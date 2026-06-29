const express = require('express');
const router = express.Router();

// Import du middleware d'authentification.
// Ici j'utilise seulement protect car toutes les routes d'alertes sont accessibles
// a tous les utilisateurs authentifies de l'entreprise (pas de restriction de role).
// J'ai choisi cette approche car la gestion des alertes est une activite commune.
const { protect } = require('../middlewares/authMiddleware');

// Import des fonctions du controleur alerte.
// J'utilise la destructuration pour importer chaque fonction individuellement.
const {
    creerAlerte,
    getAlertes,
    getAlerteById,
    getAlertesByVehicule,
    modifierAlerte,
    supprimerAlerte
} = require('../controllers/alerteController');

// ==========================================
// ROUTES PRIVEES (Securisees par JWT via protect)
// Prefixe global dans app.js : /api/alertes
// ==========================================
// Toutes ces routes necessitent un JWT valide pour y acceder.

// 1. [CREATE] - Creer une alerte (Manuelle ou Automatique).
// J'ai autorise tous les utilisateurs authentifies a creer des alertes,
// car meme un conducteur peut signaler un probleme sur son vehicule.
router.post('/', protect, creerAlerte);

// 2. [READ ALL] - Recuperer toutes les alertes de l'entreprise.
// Pratique pour filtrer par statut via req.query (ex: ?statut=en_cours).
// J'ai utilise req.query pour les filtres car c'est plus flexible que des routes separees.
router.get('/', protect, getAlertes);

// 3. [READ VEHICLE HISTORY] - Recuperer l'historique des alertes d'un vehicule specifique.
// Cette route est utile pour analyser les problemes recurrents d'un vehicule.
// :vehiculeId est un parametre d'URL dynamique capture par Express.
router.get('/vehicule/:vehiculeId', protect, getAlertesByVehicule);

// 4. [READ ONE] - Recuperer les details d'une alerte specifique.
// :id est un parametre d'URL dynamique qui correspond a l'ID MongoDB de l'alerte.
router.get('/:id', protect, getAlerteById);

// 5. [UPDATE] - Modifier ou Resoudre une alerte (statut, notes de maintenance...).
// Permet de mettre a jour les informations ou de marquer l'alerte comme resolue.
router.put('/:id', protect, modifierAlerte);

// 6. [DELETE] - Supprimer definitivement une alerte (erreur de saisie).
// J'ai autorise la suppression car les alertes peuvent etre creees par erreur.
// En prod, on pourrait limiter ça aux admins pour plus de controle.
router.delete('/:id', protect, supprimerAlerte);

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;