import { Router, Response } from 'express';
import db, { genUUID } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Valid status transitions
const SALE_STATUSES     = ['quotation', 'packing', 'dispatched', 'history'];
const PURCHASE_STATUSES = ['received', 'unpaid', 'paid', 'completed', 'history'];

// Helper to parse products JSON from SQLite
function parseOrder(row: any) {
  if (!row) return null;
  return {
    ...row,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
  };
}

// GET /api/orders?type=sale|purchase&status=...
router.get('/', (req: AuthRequest, res: Response) => {
  const { type, status } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  try {
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(parseOrder));
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// GET /api/orders/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id);
    if (!row) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(parseOrder(row));
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// POST /api/orders — create new order
router.post('/', (req: AuthRequest, res: Response) => {
  const { type, party_id, party_name, products, notes } = req.body;

  if (!type || !party_id || !party_name || !products?.length) {
    res.status(400).json({ error: 'type, party_id, party_name, and products are required' });
    return;
  }
  if (!['sale', 'purchase'].includes(type)) {
    res.status(400).json({ error: "type must be 'sale' or 'purchase'" });
    return;
  }

  // Calculate totals
  const subtotal = products.reduce(
    (sum: number, p: any) => sum + (p.price * p.quantity),
    0
  );
  const tax_amount   = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST
  const total_amount = parseFloat((subtotal + tax_amount).toFixed(2));

  const initialStatus = type === 'sale' ? 'quotation' : 'received';
  const orderId = genUUID();

  try {
    db.prepare(
      `INSERT INTO orders (order_id, type, party_id, party_name, products, status, subtotal, tax_amount, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(orderId, type, party_id, party_name, JSON.stringify(products), initialStatus,
      subtotal, tax_amount, total_amount, notes || null);

    const row = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
    res.status(201).json(parseOrder(row));
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// PATCH /api/orders/:id/advance — move to next status stage
router.patch('/:id/advance', (req: AuthRequest, res: Response) => {
  try {
    const order = parseOrder(
      db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id)
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const { type, status } = order;
    const statuses = type === 'sale' ? SALE_STATUSES : PURCHASE_STATUSES;
    const currentIndex = statuses.indexOf(status);

    if (currentIndex === -1 || currentIndex === statuses.length - 1) {
      res.status(400).json({ error: 'Order is already at final stage' });
      return;
    }

    const nextStatus = statuses[currentIndex + 1];

    const advance = db.transaction(() => {
      // If dispatching a sales order, deduct inventory
      if (type === 'sale' && nextStatus === 'dispatched') {
        for (const item of order.products) {
          db.prepare(
            `UPDATE products SET quantity = quantity - ?, last_updated = datetime('now')
             WHERE product_code = ? AND quantity >= ?`
          ).run(item.quantity, item.product_code, item.quantity);
        }
      }
      // If completing a purchase order, add inventory
      else if (type === 'purchase' && nextStatus === 'completed') {
        for (const item of order.products) {
          db.prepare(
            `UPDATE products SET quantity = quantity + ?, last_updated = datetime('now')
             WHERE product_code = ?`
          ).run(item.quantity, item.product_code);
        }
      }

      db.prepare(
        `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE order_id = ?`
      ).run(nextStatus, req.params.id);
    });

    advance();

    const updated = parseOrder(
      db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id)
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const info = db.prepare('DELETE FROM orders WHERE order_id=?').run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: String(err) });
  }
});

export default router;
