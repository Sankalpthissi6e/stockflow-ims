import { Router, Response } from 'express';
import db from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Customers
router.get('/customers', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM customers ORDER BY name').all();
  res.json(rows);
});

router.get('/customers/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json(row);
});

router.post('/customers', (req: AuthRequest, res: Response) => {
  const { customer_id, name, email, phone, address, gstin } = req.body;
  try {
    db.prepare(
      `INSERT INTO customers (customer_id, name, email, phone, address, gstin)
       VALUES (?,?,?,?,?,?)`
    ).run(customer_id, name, email, phone, address, gstin);
    const row = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(customer_id);
    res.status(201).json(row);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Customer ID already exists' });
    } else {
      res.status(500).json({ error: String(err.message) });
    }
  }
});

// Suppliers
router.get('/suppliers', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(rows);
});

router.get('/suppliers/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM suppliers WHERE supplier_id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Supplier not found' });
    return;
  }
  res.json(row);
});

router.post('/suppliers', (req: AuthRequest, res: Response) => {
  const { supplier_id, name, email, phone, address, gstin } = req.body;
  try {
    db.prepare(
      `INSERT INTO suppliers (supplier_id, name, email, phone, address, gstin)
       VALUES (?,?,?,?,?,?)`
    ).run(supplier_id, name, email, phone, address, gstin);
    const row = db.prepare('SELECT * FROM suppliers WHERE supplier_id = ?').get(supplier_id);
    res.status(201).json(row);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Supplier ID already exists' });
    } else {
      res.status(500).json({ error: String(err.message) });
    }
  }
});

export default router;
