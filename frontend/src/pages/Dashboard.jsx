import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token, logout, user } = useAuth();

  const [vehicules, setVehicules] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function chargerDonnees() {
      setChargement(true);
      setErreur('');
      try {
        const [resVehicules, resAlertes] = await Promise.all([
          api.getVehicules(),
          api.getAlertes(),
        ]);

        if (!annule) {
          const dataV = resVehicules.data || resVehicules;
          const dataA = resAlertes.data || resAlertes;

          const listeVehicules = Array.isArray(dataV)
            ? dataV
            : Array.isArray(dataV.vehicules)
            ? dataV.vehicules
            : [];

          const listeAlertes = Array.isArray(dataA)
            ? dataA
            : Array.isArray(dataA.alertes)
            ? dataA.alertes
            : [];

          setVehicules(listeVehicules);
          setAlertes(listeAlertes);
        }
      } catch (err) {
        if (!annule) {
          setErreur(err.response?.data?.message || err.message);
        }
      } finally {
        if (!annule) setChargement(false);
      }
    }

    chargerDonnees();

    return () => {
      annule = true;
    };
  }, [token]);

  if (chargement) {
    return (
      <div className="dashboard-container">
        <p className="empty-state">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="dashboard-container">
        <p style={{ color: 'var(--primary-red)', padding: '20px' }}>
          Erreur : {erreur}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header CarLog Pro */}
      <header className="navbar">
        <div className="logo">
          CarLog <span>Pro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Bonjour, <strong>{user?.prenom || 'Julie'}</strong>
          </span>
          <button className="btn-logout" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="dashboard-container">
        <h1 className="dashboard-title">Tableau de bord</h1>

        <div className="dashboard-grid">
          {/* Section Véhicules */}
          <section className="card-section">
            <div className="section-header">
              <h2>Flotte automobile</h2>
              <span className="count-badge">{vehicules.length} véhicules</span>
            </div>
            {vehicules.length === 0 ? (
              <p className="empty-state">Aucun véhicule enregistré dans la flotte.</p>
            ) : (
              <ul className="data-list">
                {vehicules.map((v, index) => (
                  <li className="data-item" key={v._id || index}>
                    <div>
                      <div className="item-title">
                        {v.marque || 'Marque inconnue'} {v.modele || ''}
                      </div>
                      <div className="item-sub">
                        {v.immatriculation || 'Sans immatriculation'}
                      </div>
                    </div>
                    <span className="item-sub">{v.statut || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Section Alertes */}
          <section className="card-section">
            <div className="section-header">
              <h2>Alertes de maintenance</h2>
              <span className="count-badge">{alertes.length} actives</span>
            </div>
            {alertes.length === 0 ? (
              <p className="empty-state">Aucune alerte active pour le moment.</p>
            ) : (
              <ul className="data-list">
                {alertes.map((a, index) => (
                  <li className="data-item" key={a._id || index}>
                    <div>
                      <div className="item-title">{a.typeAlerte || 'Alerte'}</div>
                      <div className="item-sub">
                        Urgence : {a.niveauUrgence || 'Info'}
                      </div>
                    </div>
                    <span className="item-sub">{a.statut || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}