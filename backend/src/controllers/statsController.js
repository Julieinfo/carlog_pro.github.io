const mongoose = require('mongoose');
const Vehicule = require('../models/Vehicule');
const Affectation = require('../models/Affectation');

// ==========================================
// GET /api/stats (Récupérer les KPI du tableau de bord)
// ==========================================

/**
 * Recupere les statistiques du dashboard pour l'entreprise de l'utilisateur.
 * Role : afficher les KPI principaux (vehicules par statut, missions en cours) sur le dashboard.
 * Parametres : aucun (utilise req.user.entreprise depuis le token JWT)
 * Valeur de retour : objet avec vehiculesParStatut et nombre de missions en cours
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Conversion de l'ID en ObjectId MongoDB pour l'aggregation.
        // C'est necessaire car req.user.entreprise est une chaine et l'aggregation a besoin d'un ObjectId.
        // J'ai hesite a faire cette conversion dans le middleware, mais elle est specifique a cette fonction.
        const entrepriseId = new mongoose.Types.ObjectId(req.user.entreprise);

        // 1. Aggregation Mongoose pour grouper et compter les vehicules par statut.
        // L'aggregation est puissante : elle permet de faire des operations de groupement directement dans MongoDB.
        // J'aurais pu faire plusieurs requetes countDocuments, mais l'aggregation est plus performante (une seule requete).
        // 
        // Etape par etape de l'algorithme :
        // - $match : filtre pour ne garder que les vehicules de l'entreprise (isolation multi-tenant)
        // - $group : regroupe les vehicules par statut et compte combien il y en a dans chaque groupe
        const statsVehicules = await Vehicule.aggregate([
            { $match: { entreprise: entrepriseId } }, // Multi-tenant : uniquement l'entreprise courante
            {
                $group: {
                    _id: '$statut', // On groupe par le champ 'statut'
                    total: { $sum: 1 } // On incremente de 1 pour chaque vehicule trouve
                }
            }
        ]);

        // Formater le resultat de l'aggregation pour le rendre plus propre (cle-valeur).
        // L'aggregation renvoie un tableau du style [{_id: 'disponible', total: 5}, {_id: 'maintenance', total: 2}],
        // mais le frontend prefere un objet du style {disponible: 5, maintenance: 2, total: 7}.
        // J'initialise tous les statuts possibles a 0 pour que le frontend ait toujours toutes les cles.
        const vehiculesParStatut = {
            total: 0,
            disponible: 0,
            en_course: 0,
            maintenance: 0,
            en_panne: 0
        };

        // On parcourt les resultats de l'aggregation pour remplir l'objet.
        // Si un statut n'est pas present dans l'aggregation (ex: aucun vehicule en panne), il reste a 0.
        statsVehicules.forEach(stat => {
            const statutFormate = stat._id; // ex: 'disponible'
            if (statutFormate in vehiculesParStatut) {
                vehiculesParStatut[statutFormate] = stat.total;
            }
            vehiculesParStatut.total += stat.total;
        });

        // 2. Compter le nombre d'affectations actives (en cours).
        // countDocuments est plus performant que find().length car MongoDB renvoie juste le compteur.
        // J'aurais pu inclure ça dans l'aggregation, mais une requete separee est plus lisible pour ce cas simple.
        const affectationsActives = await Affectation.countDocuments({
            entreprise: entrepriseId,
            statut: 'en_cours'
        });

        // 3. Envoyer la reponse consolidee au Front-end.
        // J'ai structure la reponse avec deux categories principales (vehicules et missions)
        // pour que le frontend puisse facilement afficher les KPI dans des sections differentes.
        res.status(200).json({
            vehicules: vehiculesParStatut,
            missions: {
                enCours: affectationsActives
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};