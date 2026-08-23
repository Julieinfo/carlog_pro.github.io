// Composant simple qui reçoit des données et une fonction via props (semaine 1)
export default function Navbar({ userName, onLogout }) {
  return (
    <nav className="app-navbar">
      <span className="logo">CarLog Pro</span>
      <div className="navbar-right">
        <span>Bonjour, {userName}</span>
        <button onClick={onLogout}>Déconnexion</button>
      </div>
    </nav>
  );
}
