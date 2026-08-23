import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login({ onGoToRegister }) {
  const [email, setEmail] = useState('julietest@gmail.com');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      const res = await api.connexion({ email, motDePasse });
      // On extrait user et token qu'Axios soit déballé ou non dans api.js
      const data = res.data || res;
      login(data.user, data.token);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Identifiants invalides');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </label>

        {erreur && <p className="erreur" style={{ color: 'red' }}>{erreur}</p>}

        <button type="submit" disabled={chargement}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p>
        Pas encore de compte ?{' '}
        <button type="button" onClick={onGoToRegister}>
          Créer un compte entreprise
        </button>
      </p>
    </div>
  );
}