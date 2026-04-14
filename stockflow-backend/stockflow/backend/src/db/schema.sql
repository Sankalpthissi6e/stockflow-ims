-- StockFlow IMS Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PRODUCTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  product_code   VARCHAR(50) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  weight         DECIMAL(10, 3),          -- in kg
  price          DECIMAL(12, 2) NOT NULL, -- in INR
  quantity       INTEGER NOT NULL DEFAULT 0,
  last_updated   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CUSTOMERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  customer_id    VARCHAR(50) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(20),
  address        TEXT,
  gstin          VARCHAR(20),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SUPPLIERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id    VARCHAR(50) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(20),
  address        TEXT,
  gstin          VARCHAR(20),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDERS TABLE (Sales + Purchase unified)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  order_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           VARCHAR(10) NOT NULL CHECK (type IN ('sale', 'purchase')),
  -- For sales: customer_id, for purchases: supplier_id
  party_id       VARCHAR(50) NOT NULL,
  party_name     VARCHAR(255) NOT NULL,
  products       JSONB NOT NULL,  -- Array of {product_code, name, qty, price, total}
  status         VARCHAR(30) NOT NULL,
  -- Sale statuses:    quotation | packing | dispatched | history
  -- Purchase statuses: received | unpaid | paid | completed | history
  subtotal       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MANUFACTURING (WIP) TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manufacturing (
  batch_number   VARCHAR(50) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  raw_materials  JSONB NOT NULL,  -- Array of {product_code, name, quantity}
  output         JSONB NOT NULL,  -- Array of {product_code, name, quantity}
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes          TEXT,
  start_date     TIMESTAMP DEFAULT NOW(),
  end_date       TIMESTAMP
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_type    ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfg_status     ON manufacturing(status);

-- ─────────────────────────────────────────────
-- SAMPLE SEED DATA
-- ─────────────────────────────────────────────
INSERT INTO products (product_code, name, description, weight, price, quantity) VALUES
  ('P001', 'Steel Rod 10mm', 'High tensile steel rod, 6m length', 7.5, 450.00, 200),
  ('P002', 'Cement Bag 50kg', 'OPC 53 grade cement', 50.0, 380.00, 500),
  ('P003', 'PVC Pipe 1inch', 'ISI marked PVC pipe, 3m length', 1.2, 125.00, 300),
  ('P004', 'Copper Wire 2.5mm', 'FR-LSH copper conductor, 90m roll', 3.0, 1250.00, 100),
  ('P005', 'M-Seal Epoxy', 'Waterproof epoxy compound, 50g', 0.05, 95.00, 450)
ON CONFLICT DO NOTHING;

INSERT INTO customers (customer_id, name, email, phone, address, gstin) VALUES
  ('C001', 'Mehta Constructions Ltd', 'accounts@mehtaconst.in', '9876543210', 'Andheri East, Mumbai - 400069', '27AABCM1234A1Z5'),
  ('C002', 'Sharma Builders', 'purchase@sharmabuilders.co.in', '9123456789', 'Thane West, Mumbai - 400601', '27AADCS5678B2Z3')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (supplier_id, name, email, phone, address, gstin) VALUES
  ('S001', 'Jindal Steel Works', 'sales@jindalsteel.in', '9988776655', 'MIDC, Nagpur - 440018', '27AAACJ1111C1Z8'),
  ('S002', 'Ultratech Cement Co.', 'orders@ultratechcement.in', '9977665544', 'Worli, Mumbai - 400030', '27AAACUL222D2Z1')
ON CONFLICT DO NOTHING;
