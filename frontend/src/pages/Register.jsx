import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register({ onGoToLogin }) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    nomEntreprise: '',
  });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { login } = useAuth();

  // Un seul handler générique pour tous les champs du formulaire
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const data = await api.inscription(form);
      login(data.user, data.token);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Créer un compte entreprise</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nom
          <input name="nom" value={form.nom} onChange={handleChange} required />
        </label>
        <label>
          Prénom
          <input name="prenom" value={form.prenom} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            name="motDePasse"
            value={form.motDePasse}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Nom de l'entreprise
          <input
            name="nomEntreprise"
            value={form.nomEntreprise}
            onChange={handleChange}
            required
          />
        </label>

        {erreur && <p className="erreur">{erreur}</p>}

        <button type="submit" disabled={chargement}>
          {chargement ? 'Création...' : 'Créer le compte'}
        </button>
      </form>

      <p>
        Déjà un compte ?{' '}
        <button type="button" onClick={onGoToLogin}>
          Se connecter
        </button>
      </p>
    </div>
  );
}
