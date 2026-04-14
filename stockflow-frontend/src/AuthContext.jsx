import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('sf_user'));

  const isAuthenticated = !!token;

  function handleLogin(tokenValue, user) {
    localStorage.setItem('sf_token', tokenValue);
    localStorage.setItem('sf_user', user);
    setToken(tokenValue);
    setUsername(user);
  }

  function handleLogout() {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    setToken(null);
    setUsername(null);
  }

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'sf_token') {
        setToken(e.newValue);
        if (!e.newValue) setUsername(null);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
