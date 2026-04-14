import { useState, useEffect } from 'react';
import {
  fetchOrders,
  createOrder,
  advanceOrder,
  deleteOrder,
  fetchSuppliers,
  fetchProducts,
} from '../api';
import {
  Plus,
  Search,
  ChevronRight,
  Trash2,
  X,
  Truck,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import './Purchases.css';

const PURCHASE_STATUSES = ['all', 'received', 'unpaid', 'paid', 'completed', 'history'];

const STATUS_BADGE = {
  received:  'badge-info',
  unpaid:    'badge-danger',
  paid:      'badge-warning',
  completed: 'badge-success',
  history:   'badge-neutral',
};

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    party_id: '',
    party_name: '',
    notes: '',
    items: [{ product_code: '', name: '', quantity: 1, price: 0 }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await fetchOrders('purchase');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function openCreate() {
    try {
      const [s, p] = await Promise.all([fetchSuppliers(), fetchProducts()]);
      setSuppliers(s);
      setProducts(p);
    } catch { /* ignore */ }
    setForm({
      party_id: '',
      party_name: '',
      notes: '',
      items: [{ product_code: '', name: '', quantity: 1, price: 0 }],
    });
    setError('');
    setModalOpen(true);
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { product_code: '', name: '', quantity: 1, price: 0 }],
    });
  }

  function removeItem(idx) {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  function updateItem(idx, field, value) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'product_code') {
      const prod = products.find((p) => p.product_code === value);
      if (prod) {
        items[idx].name = prod.name;
        items[idx].price = parseFloat(prod.price);
      }
    }
    setForm({ ...form, items });
  }

  function selectSupplier(id) {
    const sup = suppliers.find((s) => s.supplier_id === id);
    setForm({ ...form, party_id: id, party_name: sup ? sup.name : '' });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.party_id || !form.party_name) return;
    const validItems = form.items.filter((i) => i.product_code && i.quantity > 0);
    if (validItems.length === 0) return;

    setSaving(true);
    setError('');
    try {
      await createOrder({
        type: 'purchase',
        party_id: form.party_id,
        party_name: form.party_name,
        products: validItems.map((i) => ({
          product_code: i.product_code,
          name: i.name,
          quantity: parseInt(i.quantity),
          price: parseFloat(i.price),
          total: parseFloat(i.price) * parseInt(i.quantity),
        })),
        notes: form.notes,
      });
      showToast('Purchase order created');
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance(id) {
    try {
      await advanceOrder(id);
      showToast('Order advanced to next stage');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this purchase order?')) return;
    try {
      await deleteOrder(id);
      showToast('Order deleted');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch =
      o.party_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading purchase orders…</p>
      </div>
    );
  }

  return (
    <div className="purchases-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          New Purchase Order
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by supplier or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {PURCHASE_STATUSES.map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} />
          <p>No purchase orders found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total (₹)</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.order_id}>
                  <td className="td-mono">{o.order_id.slice(0, 8)}…</td>
                  <td className="td-primary">{o.party_name}</td>
                  <td>{o.products.length}</td>
                  <td>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] || 'badge-neutral'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="td-actions">
                      {o.status !== 'history' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAdvance(o.order_id)}
                          title="Advance to next stage"
                        >
                          <ChevronRight size={14} />
                          Advance
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDelete(o.order_id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Purchase Order</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div className="login-error">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select
                    className="form-select"
                    value={form.party_id}
                    onChange={(e) => selectSupplier(e.target.value)}
                    required
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.name} ({s.supplier_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Products *</label>
                  <div className="order-items">
                    {form.items.map((item, i) => (
                      <div className="order-item-row" key={i}>
                        <select
                          className="form-select"
                          value={item.product_code}
                          onChange={(e) => updateItem(i, 'product_code', e.target.value)}
                          required
                        >
                          <option value="">Product…</option>
                          {products.map((p) => (
                            <option key={p.product_code} value={p.product_code}>
                              {p.name} ({p.product_code})
                            </option>
                          ))}
                        </select>
                        <input
                          className="form-input item-qty"
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          required
                        />
                        <input
                          className="form-input item-price"
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => updateItem(i, 'price', e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeItem(i)}
                          disabled={form.items.length <= 1}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Optional notes…"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
