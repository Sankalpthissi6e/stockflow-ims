import { Router, Response } from 'express';
import db from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard — summary stats for dashboard cards
router.get('/', (_req: AuthRequest, res: Response) => {
  try {
    const inventory = db.prepare(
      'SELECT COALESCE(SUM(price * quantity), 0) as total_value, COALESCE(SUM(quantity), 0) as total_units FROM products'
    ).get() as any;

    const pendingSales = db.prepare(
      `SELECT COUNT(*) as c FROM orders WHERE type='sale' AND status NOT IN ('history','dispatched')`
    ).get() as any;

    const pendingPurchases = db.prepare(
      `SELECT COUNT(*) as c FROM orders WHERE type='purchase' AND status NOT IN ('history','completed')`
    ).get() as any;

    const dispatchedRecent = db.prepare(
      `SELECT COUNT(*) as c FROM orders WHERE type='sale' AND status='dispatched'
       AND updated_at >= datetime('now', '-30 days')`
    ).get() as any;

    const wip = db.prepare(
      "SELECT COUNT(*) as active_wip FROM manufacturing WHERE status = 'in_progress'"
    ).get() as any;

    const lowStock = db.prepare(
      'SELECT product_code, name, quantity FROM products WHERE quantity < 20 ORDER BY quantity ASC LIMIT 5'
    ).all();

    res.json({
      inventory: {
        total_value: parseFloat(inventory.total_value || 0),
        total_units: parseInt(inventory.total_units || 0),
      },
      orders: {
        pending_sales:     pendingSales.c || 0,
        pending_purchases: pendingPurchases.c || 0,
        dispatched_today:  dispatchedRecent.c || 0,
      },
      manufacturing: {
        active_wip: wip.active_wip || 0,
      },
      low_stock: lowStock,
    });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard query failed', detail: String(err) });
  }
});

export default router;
