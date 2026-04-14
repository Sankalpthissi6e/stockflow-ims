import { Router, Response } from 'express';
import db from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Helper to parse JSON fields
function parseBatch(row: any) {
  if (!row) return null;
  return {
    ...row,
    raw_materials: typeof row.raw_materials === 'string' ? JSON.parse(row.raw_materials) : row.raw_materials,
    output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
  };
}

// GET /api/manufacturing?status=in_progress|completed|cancelled
router.get('/', (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  let query = 'SELECT * FROM manufacturing WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY start_date DESC';

  try {
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(parseBatch));
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// GET /api/manufacturing/:batch
router.get('/:batch', (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM manufacturing WHERE batch_number = ?').get(req.params.batch);
    if (!row) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    res.json(parseBatch(row));
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// POST /api/manufacturing — start new WIP batch (deducts raw materials)
router.post('/', (req: AuthRequest, res: Response) => {
  const { batch_number, name, raw_materials, output, notes } = req.body;

  if (!batch_number || !name || !raw_materials?.length || !output?.length) {
    res.status(400).json({
      error: 'batch_number, name, raw_materials, and output are required'
    });
    return;
  }

  try {
    const startBatch = db.transaction(() => {
      // Deduct raw materials from stock
      for (const mat of raw_materials) {
        const check = db.prepare('SELECT quantity FROM products WHERE product_code = ?').get(mat.product_code) as any;
        if (!check) {
          throw new Error(`Product ${mat.product_code} not found`);
        }
        if (check.quantity < mat.quantity) {
          throw new Error(
            `Insufficient stock for ${mat.product_code}: available ${check.quantity}, required ${mat.quantity}`
          );
        }
        db.prepare(
          `UPDATE products SET quantity = quantity - ?, last_updated = datetime('now')
           WHERE product_code = ?`
        ).run(mat.quantity, mat.product_code);
      }

      db.prepare(
        `INSERT INTO manufacturing (batch_number, name, raw_materials, output, notes)
         VALUES (?, ?, ?, ?, ?)`
      ).run(batch_number, name, JSON.stringify(raw_materials), JSON.stringify(output), notes || null);
    });

    startBatch();

    const row = db.prepare('SELECT * FROM manufacturing WHERE batch_number = ?').get(batch_number);
    res.status(201).json(parseBatch(row));
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Batch number already exists' });
    } else {
      res.status(400).json({ error: err.message || 'Failed to start batch' });
    }
  }
});

// PATCH /api/manufacturing/:batch/complete — mark done, add output to stock
router.patch('/:batch/complete', (req: AuthRequest, res: Response) => {
  try {
    const completeBatch = db.transaction(() => {
      const batch = parseBatch(
        db.prepare('SELECT * FROM manufacturing WHERE batch_number = ? AND status = ?').get(req.params.batch, 'in_progress')
      );
      if (!batch) {
        throw { notFound: true };
      }

      // Add output products to stock
      for (const item of batch.output) {
        db.prepare(
          `UPDATE products SET quantity = quantity + ?, last_updated = datetime('now')
           WHERE product_code = ?`
        ).run(item.quantity, item.product_code);
      }

      db.prepare(
        `UPDATE manufacturing SET status = 'completed', end_date = datetime('now')
         WHERE batch_number = ?`
      ).run(req.params.batch);
    });

    completeBatch();

    const row = db.prepare('SELECT * FROM manufacturing WHERE batch_number = ?').get(req.params.batch);
    res.json(parseBatch(row));
  } catch (err: any) {
    if (err.notFound) {
      res.status(404).json({ error: 'In-progress batch not found' });
    } else {
      res.status(500).json({ error: 'Database error', detail: String(err) });
    }
  }
});

// DELETE /api/manufacturing/:batch
router.delete('/:batch', (req: AuthRequest, res: Response) => {
  try {
    const info = db.prepare(
      `UPDATE manufacturing SET status = 'cancelled' WHERE batch_number = ?`
    ).run(req.params.batch);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    const row = db.prepare('SELECT * FROM manufacturing WHERE batch_number = ?').get(req.params.batch);
    res.json({ message: 'Batch cancelled', batch: parseBatch(row) });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

export default router;
