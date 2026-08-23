import { createContext, useContext, useState, useEffect } from 'react';

// Context API (semaine 3) : partage l'état de connexion à toute l'app
// sans avoir à faire passer des props de composant en composant.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Au montage, on récupère une éventuelle session sauvegardée
  // (useEffect avec tableau de deps vide = exécuté une seule fois, semaine 2)
  useEffect(() => {
    const savedToken = localStorage.getItem('carlog_token');
    const savedUser = localStorage.getItem('carlog_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('carlog_token', jwtToken);
    localStorage.setItem('carlog_user', JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('carlog_token');
    localStorage.removeItem('carlog_user');
  }

  const value = { user, token, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook custom pour consommer le contexte plus simplement dans les composants
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  }
  return context;
}
