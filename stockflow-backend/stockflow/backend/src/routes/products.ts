import { Router, Response } from 'express';
import db from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/products — list all products
router.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// GET /api/products/:code — single product
router.get('/:code', (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM products WHERE product_code = ?').get(req.params.code);
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// POST /api/products — create product
router.post('/', (req: AuthRequest, res: Response) => {
  const { product_code, name, description, weight, price, quantity } = req.body;
  if (!product_code || !name || price == null) {
    res.status(400).json({ error: 'product_code, name, and price are required' });
    return;
  }
  try {
    const stmt = db.prepare(
      `INSERT INTO products (product_code, name, description, weight, price, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(product_code, name, description, weight || null, price, quantity || 0);
    const row = db.prepare('SELECT * FROM products WHERE product_code = ?').get(product_code);
    res.status(201).json(row);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Product code already exists' });
    } else {
      res.status(500).json({ error: 'Database error', detail: String(err) });
    }
  }
});

// PUT /api/products/:code — update product
router.put('/:code', (req: AuthRequest, res: Response) => {
  const { name, description, weight, price, quantity } = req.body;
  try {
    const info = db.prepare(
      `UPDATE products
       SET name=?, description=?, weight=?, price=?, quantity=?, last_updated=datetime('now')
       WHERE product_code=?`
    ).run(name, description, weight, price, quantity, req.params.code);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const row = db.prepare('SELECT * FROM products WHERE product_code = ?').get(req.params.code);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// DELETE /api/products/:code
router.delete('/:code', (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM products WHERE product_code = ?').get(req.params.code);
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    db.prepare('DELETE FROM products WHERE product_code=?').run(req.params.code);
    res.json({ message: 'Product deleted', product: row });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

export default router;
