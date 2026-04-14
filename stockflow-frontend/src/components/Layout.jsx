import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Factory,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products',      icon: Package,         label: 'Products' },
  { path: '/sales',         icon: ShoppingCart,     label: 'Sales' },
  { path: '/purchases',     icon: Truck,           label: 'Purchases' },
  { path: '/manufacturing', icon: Factory,         label: 'Manufacturing' },
  { path: '/customers',     icon: Users,           label: 'Customers' },
  { path: '/suppliers',     icon: Building2,       label: 'Suppliers' },
];

export default function Layout() {
  const { username, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = NAV_ITEMS.find(
    (n) => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Boxes size={22} />
            </div>
            <div className="logo-text">
              <span className="logo-name">StockFlow</span>
              <span className="logo-sub">IMS</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{username || 'Admin'}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button className="btn-ghost logout-btn" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="topbar-info">
            <h2 className="topbar-title">{currentPage?.label || 'StockFlow'}</h2>
          </div>
        </header>

        <div className="page-content animate-fade-in" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
