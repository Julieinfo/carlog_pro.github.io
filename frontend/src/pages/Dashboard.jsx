import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();

  const [vehicules, setVehicules] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  // useEffect avec [token] en dépendance : se relance si le token change
  // (semaine 2 : cycle de vie, dépendances)
  useEffect(() => {
    let annule = false; // évite de mettre à jour le state si le composant est démonté (cleanup, semaine 2)

    async function chargerDonnees() {
      setChargement(true);
      setErreur('');
      try {
        const [dataVehicules, dataAlertes] = await Promise.all([
          api.getVehicules(token),
          api.getAlertes(token),
        ]);
        if (!annule) {
          setVehicules(dataVehicules.vehicules || dataVehicules);
          setAlertes(dataAlertes.alertes || dataAlertes);
        }
      } catch (err) {
        if (!annule) setErreur(err.message);
      } finally {
        if (!annule) setChargement(false);
      }
    }

    chargerDonnees();

    return () => {
      annule = true; // cleanup
    };
  }, [token]);

  if (chargement) return <p>Chargement du tableau de bord...</p>;
  if (erreur) return <p className="erreur">Erreur : {erreur}</p>;

  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>

      <section>
        <h2>Véhicules ({vehicules.length})</h2>
        {/* Rendu de liste avec key unique (semaine 1) */}
        <ul>
          {vehicules.map((v) => (
            <li key={v._id}>
              {v.marque} {v.modele} — {v.immatriculation} — {v.statut}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Alertes actives ({alertes.length})</h2>
        <ul>
          {alertes.map((a) => (
            <li key={a._id}>
              [{a.niveauUrgence}] {a.typeAlerte} — {a.statut}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
