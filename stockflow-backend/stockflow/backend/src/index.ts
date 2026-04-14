import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { generateToken } from './middleware/auth';

import productsRouter      from './routes/products';
import ordersRouter        from './routes/orders';
import manufacturingRouter from './routes/manufacturing';
import partiesRouter       from './routes/parties';
import dashboardRouter     from './routes/dashboard';

const app  = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// ─────────────────────────────────────────────
// AUTH — single shared login (no RBAC per SRS)
// ─────────────────────────────────────────────
const SHARED_USERNAME     = process.env.APP_USERNAME || 'admin';
const SHARED_PASSWORD_HASH = bcrypt.hashSync(
  process.env.APP_PASSWORD || 'stockflow@2024',
  10
);

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (
    username !== SHARED_USERNAME ||
    !bcrypt.compareSync(password, SHARED_PASSWORD_HASH)
  ) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = generateToken(username);
  res.json({ token, username });
});

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.use('/api/dashboard',     dashboardRouter);
app.use('/api/products',      productsRouter);
app.use('/api/orders',        ordersRouter);
app.use('/api/manufacturing', manufacturingRouter);
app.use('/api',               partiesRouter);  // /api/customers, /api/suppliers

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'StockFlow IMS', version: '1.0.0' });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 StockFlow IMS API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

export default app;
