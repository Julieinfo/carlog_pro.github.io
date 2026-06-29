const express = require('express');
const router = express.Router();

// Importation des verrous de securite.
// protect verifie que l'utilisateur est authentifie via JWT.
// authorize verifie que l'utilisateur a le role necessaire pour l'operation.
const { protect, authorize } = require('../middlewares/authMiddleware');

// Import des validateurs express-validator pour les vehicules.
const { validateCreerVehicule, validateModifierVehicule } = require('../middlewares/validators/vehiculeValidator');

// Import des fonctions du controleur vehicule.
// J'utilise la destructuration pour importer chaque fonction individuellement.
const {
    creerVehicule,
    getVehicules,
    getVehiculeById,
    modifierVehicule,
    supprimerVehicule
} = require('../controllers/vehiculeController');

// ==========================================
// ROUTES PRIVEES /api/vehicules
// ==========================================
// Ces routes sont protegees par authentification et certaines ont des restrictions de role.

// 1. Consultation : Ouverte a TOUS les utilisateurs connectes de l'entreprise.
// J'ai autorise admin, fleet_manager et conducteur car tous ont besoin de voir les vehicules.
// Les conducteurs doivent savoir quels vehicules sont disponibles pour les affectations.
router.get('/', protect, authorize('admin', 'fleet_manager', 'conducteur'), getVehicules);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'conducteur'), getVehiculeById);

// 2. Creation et Modification : Reservees aux profils "Gestion" (Admin + Manager).
// J'ai limite ces operations car la gestion du parc est une responsabilite administrative.
// Les conducteurs ne doivent pas pouvoir ajouter ou modifier des vehicules arbitrairement.
// J'ajoute les validateurs pour s'assurer que les donnees sont valides.
router.post('/', protect, authorize('admin', 'fleet_manager'), validateCreerVehicule, creerVehicule);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), validateModifierVehicule, modifierVehicule);

// 3. Suppression : Reservee exclusivement a l'Admin.
// J'ai restreint la suppression au seul role admin car c'est une operation critique.
// Meme les fleet managers ne devraient pas pouvoir supprimer des vehicules sans validation.
// J'aurais pu autoriser les managers aussi, mais j'ai prefere etre prudent.
router.delete('/:id', protect, authorize('admin'), supprimerVehicule);

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;