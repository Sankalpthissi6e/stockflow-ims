import { useState, useEffect } from 'react';
import {
  fetchManufacturing,
  createBatch,
  completeBatch,
  cancelBatch,
  fetchProducts,
} from '../api';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Factory,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import './Manufacturing.css';

const MFG_STATUSES = ['all', 'in_progress', 'completed', 'cancelled'];

const STATUS_BADGE = {
  in_progress: 'badge-info',
  completed:   'badge-success',
  cancelled:   'badge-danger',
};

export default function Manufacturing() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    batch_number: '',
    name: '',
    notes: '',
    raw_materials: [{ product_code: '', name: '', quantity: 1 }],
    output: [{ product_code: '', name: '', quantity: 1 }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await fetchManufacturing();
      setBatches(data);
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
      const p = await fetchProducts();
      setProducts(p);
    } catch { /* ignore */ }
    setForm({
      batch_number: '',
      name: '',
      notes: '',
      raw_materials: [{ product_code: '', name: '', quantity: 1 }],
      output: [{ product_code: '', name: '', quantity: 1 }],
    });
    setError('');
    setModalOpen(true);
  }

  function addMaterial() {
    setForm({
      ...form,
      raw_materials: [...form.raw_materials, { product_code: '', name: '', quantity: 1 }],
    });
  }

  function removeMaterial(idx) {
    if (form.raw_materials.length <= 1) return;
    setForm({ ...form, raw_materials: form.raw_materials.filter((_, i) => i !== idx) });
  }

  function updateMaterial(idx, field, value) {
    const mats = [...form.raw_materials];
    mats[idx] = { ...mats[idx], [field]: value };
    if (field === 'product_code') {
      const prod = products.find((p) => p.product_code === value);
      if (prod) mats[idx].name = prod.name;
    }
    setForm({ ...form, raw_materials: mats });
  }

  function addOutput() {
    setForm({
      ...form,
      output: [...form.output, { product_code: '', name: '', quantity: 1 }],
    });
  }

  function removeOutput(idx) {
    if (form.output.length <= 1) return;
    setForm({ ...form, output: form.output.filter((_, i) => i !== idx) });
  }

  function updateOutput(idx, field, value) {
    const outs = [...form.output];
    outs[idx] = { ...outs[idx], [field]: value };
    if (field === 'product_code') {
      const prod = products.find((p) => p.product_code === value);
      if (prod) outs[idx].name = prod.name;
    }
    setForm({ ...form, output: outs });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.batch_number || !form.name) return;
    setSaving(true);
    setError('');
    try {
      await createBatch({
        batch_number: form.batch_number,
        name: form.name,
        raw_materials: form.raw_materials
          .filter((m) => m.product_code && m.quantity > 0)
          .map((m) => ({ ...m, quantity: parseInt(m.quantity) })),
        output: form.output
          .filter((o) => o.product_code && o.quantity > 0)
          .map((o) => ({ ...o, quantity: parseInt(o.quantity) })),
        notes: form.notes,
      });
      showToast('Batch started successfully');
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(batch) {
    try {
      await completeBatch(batch);
      showToast('Batch marked as completed');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleCancel(batch) {
    if (!confirm(`Cancel batch ${batch}?`)) return;
    try {
      await cancelBatch(batch);
      showToast('Batch cancelled');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const filtered = batches.filter((b) => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.batch_number.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading manufacturing batches…</p>
      </div>
    );
  }

  return (
    <div className="manufacturing-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Manufacturing</h1>
          <p className="page-subtitle">{batches.length} total batches</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          New Batch
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by batch name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {MFG_STATUSES.map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Factory size={48} />
          <p>No manufacturing batches found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Name</th>
                <th>Raw Materials</th>
                <th>Output</th>
                <th>Status</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.batch_number}>
                  <td className="td-mono">{b.batch_number}</td>
                  <td className="td-primary">{b.name}</td>
                  <td>{b.raw_materials.length} items</td>
                  <td>{b.output.length} items</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-neutral'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(b.start_date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="td-actions">
                      {b.status === 'in_progress' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleComplete(b.batch_number)}
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={14} />
                            Complete
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(b.batch_number)}
                            title="Cancel Batch"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
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
          <div className="modal mfg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Manufacturing Batch</h3>
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Batch Number *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. B001"
                      value={form.batch_number}
                      onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Steel Assembly Q1"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Raw Materials */}
                <div className="form-group">
                  <label className="form-label">Raw Materials (consumed) *</label>
                  <div className="order-items">
                    {form.raw_materials.map((mat, i) => (
                      <div className="mfg-item-row" key={i}>
                        <select
                          className="form-select"
                          value={mat.product_code}
                          onChange={(e) => updateMaterial(i, 'product_code', e.target.value)}
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
                          value={mat.quantity}
                          onChange={(e) => updateMaterial(i, 'quantity', e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeMaterial(i)}
                          disabled={form.raw_materials.length <= 1}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addMaterial}>
                      <Plus size={14} /> Add Material
                    </button>
                  </div>
                </div>

                {/* Output */}
                <div className="form-group">
                  <label className="form-label">Output Products (produced) *</label>
                  <div className="order-items">
                    {form.output.map((out, i) => (
                      <div className="mfg-item-row" key={i}>
                        <select
                          className="form-select"
                          value={out.product_code}
                          onChange={(e) => updateOutput(i, 'product_code', e.target.value)}
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
                          value={out.quantity}
                          onChange={(e) => updateOutput(i, 'quantity', e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeOutput(i)}
                          disabled={form.output.length <= 1}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addOutput}>
                      <Plus size={14} /> Add Output
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
                  {saving ? 'Starting…' : 'Start Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
