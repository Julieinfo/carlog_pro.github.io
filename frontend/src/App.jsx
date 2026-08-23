import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Pas de React Router pour l'instant (vu en semaine 8).
// La "navigation" est simulée avec un simple state 'page' :
// c'est volontairement basique, à remplacer plus tard par React Router.
export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [page, setPage] = useState('login'); // 'login' | 'register'

  if (!isAuthenticated) {
    return page === 'login' ? (
      <Login onGoToRegister={() => setPage('register')} />
    ) : (
      <Register onGoToLogin={() => setPage('login')} />
    );
  }

  return (
    <div className="app">
      <Navbar userName={user?.prenom || 'Utilisateur'} onLogout={logout} />
      <Dashboard />
    </div>
  );
}
