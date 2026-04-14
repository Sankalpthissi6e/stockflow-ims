import { useState, useEffect } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Package,
  AlertTriangle,
} from 'lucide-react';
import './Products.css';

const EMPTY_PRODUCT = {
  product_code: '',
  name: '',
  description: '',
  weight: '',
  price: '',
  quantity: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await fetchProducts();
      setProducts(data);
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

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      product_code: product.product_code,
      name: product.name,
      description: product.description || '',
      weight: product.weight || '',
      price: product.price,
      quantity: product.quantity,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || form.price === '') return;
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateProduct(editing.product_code, {
          name: form.name,
          description: form.description,
          weight: form.weight ? parseFloat(form.weight) : null,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity) || 0,
        });
        showToast('Product updated successfully');
      } else {
        await createProduct({
          product_code: form.product_code,
          name: form.name,
          description: form.description,
          weight: form.weight ? parseFloat(form.weight) : null,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity) || 0,
        });
        showToast('Product created successfully');
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code) {
    if (!confirm(`Delete product ${code}?`)) return;
    try {
      await deleteProduct(code);
      showToast('Product deleted');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products…</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} products in inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>{search ? 'No products match your search' : 'No products yet'}</p>
          {!search && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={16} /> Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Weight (kg)</th>
                <th>Price (₹)</th>
                <th>Quantity</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.product_code}>
                  <td className="td-mono">{p.product_code}</td>
                  <td className="td-primary">{p.name}</td>
                  <td>{p.weight || '—'}</td>
                  <td>₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                  <td>{p.quantity}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.quantity === 0
                          ? 'badge-danger'
                          : p.quantity < 20
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {p.quantity === 0
                        ? 'Out of Stock'
                        : p.quantity < 20
                        ? 'Low'
                        : 'In Stock'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit"
                        onClick={() => openEdit(p)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Delete"
                        onClick={() => handleDelete(p.product_code)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'New Product'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
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

                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Product Code *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. P006"
                      value={form.product_code}
                      onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Optional description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
