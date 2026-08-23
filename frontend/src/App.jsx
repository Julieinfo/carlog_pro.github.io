import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { useState } from 'react';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [pageAuth, setPageAuth] = useState('login'); // 'login' ou 'register'

  if (!isAuthenticated) {
    return pageAuth === 'login' ? (
      <Login onGoToRegister={() => setPageAuth('register')} />
    ) : (
      <Register onGoToLogin={() => setPageAuth('login')} />
    );
  }

  return <Dashboard />;
}