import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'stockflow.db');
const db = Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema Setup ─────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    product_code   TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    description    TEXT,
    weight         REAL,
    price          REAL NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 0,
    last_updated   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    customer_id    TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    email          TEXT,
    phone          TEXT,
    address        TEXT,
    gstin          TEXT,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id    TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    email          TEXT,
    phone          TEXT,
    address        TEXT,
    gstin          TEXT,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id       TEXT PRIMARY KEY,
    type           TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    party_id       TEXT NOT NULL,
    party_name     TEXT NOT NULL,
    products       TEXT NOT NULL,
    status         TEXT NOT NULL,
    subtotal       REAL NOT NULL DEFAULT 0,
    tax_amount     REAL NOT NULL DEFAULT 0,
    total_amount   REAL NOT NULL DEFAULT 0,
    notes          TEXT,
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS manufacturing (
    batch_number   TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    raw_materials  TEXT NOT NULL,
    output         TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'in_progress'
                   CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    notes          TEXT,
    start_date     TEXT DEFAULT (datetime('now')),
    end_date       TEXT
  );
`);

// ─── Seed Data ─────────────────────────────────────────
const existingProducts = db.prepare('SELECT COUNT(*) as c FROM products').get() as any;
if (existingProducts.c === 0) {
  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (product_code, name, description, weight, price, quantity)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const seedProducts = db.transaction(() => {
    insertProduct.run('P001', 'Steel Rod 10mm', 'High tensile steel rod, 6m length', 7.5, 450.00, 200);
    insertProduct.run('P002', 'Cement Bag 50kg', 'OPC 53 grade cement', 50.0, 380.00, 500);
    insertProduct.run('P003', 'PVC Pipe 1inch', 'ISI marked PVC pipe, 3m length', 1.2, 125.00, 300);
    insertProduct.run('P004', 'Copper Wire 2.5mm', 'FR-LSH copper conductor, 90m roll', 3.0, 1250.00, 100);
    insertProduct.run('P005', 'M-Seal Epoxy', 'Waterproof epoxy compound, 50g', 0.05, 95.00, 450);
  });
  seedProducts();

  const insertCustomer = db.prepare(
    `INSERT OR IGNORE INTO customers (customer_id, name, email, phone, address, gstin)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const seedCustomers = db.transaction(() => {
    insertCustomer.run('C001', 'Mehta Constructions Ltd', 'accounts@mehtaconst.in', '9876543210', 'Andheri East, Mumbai - 400069', '27AABCM1234A1Z5');
    insertCustomer.run('C002', 'Sharma Builders', 'purchase@sharmabuilders.co.in', '9123456789', 'Thane West, Mumbai - 400601', '27AADCS5678B2Z3');
  });
  seedCustomers();

  const insertSupplier = db.prepare(
    `INSERT OR IGNORE INTO suppliers (supplier_id, name, email, phone, address, gstin)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const seedSuppliers = db.transaction(() => {
    insertSupplier.run('S001', 'Jindal Steel Works', 'sales@jindalsteel.in', '9988776655', 'MIDC, Nagpur - 440018', '27AAACJ1111C1Z8');
    insertSupplier.run('S002', 'Ultratech Cement Co.', 'orders@ultratechcement.in', '9977665544', 'Worli, Mumbai - 400030', '27AAACUL222D2Z1');
  });
  seedSuppliers();
}

// ─── Helper to generate UUID ──────────────────────────
export function genUUID(): string {
  return uuidv4();
}

export default db;
