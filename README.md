# StockFlow IMS 📦

StockFlow is a modern, full-stack **Inventory Management System** designed for efficiency and ease of use. It features a robust backend for data management and a premium, responsive frontend for terminal-level performance and rich aesthetics.

---

## 🚀 Features

### 📊 Dashboard
- Real-time overview of key inventory metrics.
- Quick insights into stock levels and order statuses.

### 📦 Product Management
- Full CRUD operations for products.
- Detailed tracking of product codes, descriptions, weights, and prices.
- Real-time quantity updates.

### 🧾 Order System (Sales & Purchase)
- Unified order management for both sales and purchases.
- Workflow-based status tracking:
  - **Sales**: Quotation → Packing → Dispatched → History.
  - **Purchases**: Received → Unpaid → Paid → Completed → History.
- Automated total and tax calculations.

### 🛠️ Manufacturing (WIP)
- Track production batches from "In Progress" to "Completed".
- Manage raw materials and output tracking.

### 👥 Party Management
- Dedicated modules for **Customers** and **Suppliers**.
- Detailed record-keeping including GSTIN and contact info.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (Premium, Custom Design)
- **Icons**: Lucide React
- **Routing**: React Router 7

### Backend
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: SQLite (via `better-sqlite3`)
- **Authentication**: JWT & BcryptJS

---

## 📂 Project Structure

```text
stockflow-ims/
├── stockflow-frontend/      # React application (Vite)
├── stockflow-backend/       # Express API (TypeScript)
│   └── stockflow/backend/   # Core backend source
├── database/                # SQL schema definitions
└── README.md                # Project documentation
```

---

## ⚙️ Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd stockflow-backend/stockflow/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd stockflow-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📄 License
This project is for internal use and demonstration purposes.
