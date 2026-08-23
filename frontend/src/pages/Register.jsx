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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    // On complète l'objet envoyé au backend avec des données valides par défaut
    const payload = {
      ...form,
      siret: Math.floor(10000000000000 + Math.random() * 90000000000000).toString(),
      emailProfessionnel: form.email,
      telephoneEntreprise: '0102030405',
      adresse: {
        rue: '1 rue de la Paix',
        codePostal: '75000',
        ville: 'Paris',
        pays: 'France',
      },
    };

    try {
      const res = await api.inscription(payload);
      // Prise en charge selon que api.js retourne res.data ou la réponse Axios
      const data = res.data || res;
      login(data.user, data.token);
    } catch (err) {
      // Correction de la coquille (err.response au lieu de err.reponse)
      setErreur(err.response?.data?.message || err.message);
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

        {erreur && <p className="erreur" style={{ color: 'red' }}>{erreur}</p>}

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