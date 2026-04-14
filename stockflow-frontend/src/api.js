/* ═══════════════════════════════════════════════════
   StockFlow IMS — API Service Layer
   ═══════════════════════════════════════════════════ */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('sf_token');
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Auth ────────────────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

// ── Dashboard ───────────────────────────────────
export function fetchDashboard() {
  return authFetch('/dashboard');
}

// ── Products ────────────────────────────────────
export function fetchProducts() {
  return authFetch('/products');
}

export function fetchProduct(code) {
  return authFetch(`/products/${code}`);
}

export function createProduct(product) {
  return authFetch('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateProduct(code, product) {
  return authFetch(`/products/${code}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export function deleteProduct(code) {
  return authFetch(`/products/${code}`, { method: 'DELETE' });
}

// ── Orders ──────────────────────────────────────
export function fetchOrders(type, status) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  const qs = params.toString();
  return authFetch(`/orders${qs ? `?${qs}` : ''}`);
}

export function fetchOrder(id) {
  return authFetch(`/orders/${id}`);
}

export function createOrder(order) {
  return authFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export function advanceOrder(id) {
  return authFetch(`/orders/${id}/advance`, { method: 'PATCH' });
}

export function deleteOrder(id) {
  return authFetch(`/orders/${id}`, { method: 'DELETE' });
}

// ── Manufacturing ───────────────────────────────
export function fetchManufacturing(status) {
  const qs = status ? `?status=${status}` : '';
  return authFetch(`/manufacturing${qs}`);
}

export function fetchBatch(batchNumber) {
  return authFetch(`/manufacturing/${batchNumber}`);
}

export function createBatch(batch) {
  return authFetch('/manufacturing', {
    method: 'POST',
    body: JSON.stringify(batch),
  });
}

export function completeBatch(batchNumber) {
  return authFetch(`/manufacturing/${batchNumber}/complete`, { method: 'PATCH' });
}

export function cancelBatch(batchNumber) {
  return authFetch(`/manufacturing/${batchNumber}`, { method: 'DELETE' });
}

// ── Customers ───────────────────────────────────
export function fetchCustomers() {
  return authFetch('/customers');
}

export function createCustomer(customer) {
  return authFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

// ── Suppliers ───────────────────────────────────
export function fetchSuppliers() {
  return authFetch('/suppliers');
}

export function createSupplier(supplier) {
  return authFetch('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}
