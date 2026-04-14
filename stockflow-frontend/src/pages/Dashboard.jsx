import { useState, useEffect } from 'react';
import { fetchDashboard } from '../api';
import {
  IndianRupee,
  Package,
  ShoppingCart,
  Truck,
  Factory,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const d = await fetchDashboard();
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} />
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); loadDashboard(); }}>
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      icon: IndianRupee,
      iconClass: 'indigo',
      label: 'Inventory Value',
      value: `₹${(data.inventory.total_value || 0).toLocaleString('en-IN')}`,
    },
    {
      icon: Package,
      iconClass: 'blue',
      label: 'Total Units in Stock',
      value: (data.inventory.total_units || 0).toLocaleString('en-IN'),
    },
    {
      icon: ShoppingCart,
      iconClass: 'green',
      label: 'Pending Sales',
      value: data.orders.pending_sales,
    },
    {
      icon: Truck,
      iconClass: 'amber',
      label: 'Pending Purchases',
      value: data.orders.pending_purchases,
    },
    {
      icon: TrendingUp,
      iconClass: 'purple',
      label: 'Dispatched (30d)',
      value: data.orders.dispatched_today,
    },
    {
      icon: Factory,
      iconClass: 'red',
      label: 'Active WIP Batches',
      value: data.manufacturing.active_wip,
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory and operations</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className="stat-card" key={i} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="stat-card-header">
              <div className={`stat-icon ${stat.iconClass}`}>
                <stat.icon size={22} />
              </div>
              <ArrowUpRight size={16} className="stat-arrow" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>
            <AlertTriangle size={18} className="section-icon" />
            Low Stock Alerts
          </h3>
          <span className="badge badge-danger">{data.low_stock.length} items</span>
        </div>

        {data.low_stock.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Package size={36} />
            <p>All products are well-stocked</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock.map((p) => (
                  <tr key={p.product_code}>
                    <td className="td-mono">{p.product_code}</td>
                    <td className="td-primary">{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'badge-danger' : p.quantity < 10 ? 'badge-warning' : 'badge-info'}`}>
                        {p.quantity === 0 ? 'Out of Stock' : p.quantity < 10 ? 'Critical' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
