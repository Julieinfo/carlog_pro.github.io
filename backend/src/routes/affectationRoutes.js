const express = require('express');
const router = express.Router();

// 1. Importation des verrous de securite.
// protect verifie que l'utilisateur est authentifie (JWT valide).
// authorize verifie que l'utilisateur a le role necessaire pour acceder a la route.
const { protect, authorize } = require('../middlewares/authMiddleware');

// Import des validateurs express-validator pour les affectations.
const { validateCreerAffectation, validateModifierAffectation, validateTerminerAffectation } = require('../middlewares/validators/affectationValidator');

// 2. Importation de TOUTES les fonctions du controleur affectation.
// J'importe toutes les fonctions d'un coup pour avoir une vue d'ensemble.
// J'aurais pu importer le controleur entier et faire affectationController.getAffectations,
// mais la destructuration est plus lisible et evite de repeter 'affectationController' partout.
const {
    getAffectations,
    creerAffectation,
    getAffectationById,
    modifierAffectation,
    terminerAffectation,
    supprimerAffectation
} = require('../controllers/affectationController');

// ==========================================
// ROUTES PRIVEES /api/affectations
// ==========================================
// Toutes ces routes sont protegees par le middleware protect (authentification JWT).
// Certaines ont des restrictions de role supplementaires via authorize.

// Liste toutes les affectations et recupere une affectation specifique (Ouvert a tous).
// J'ai autorise admin, fleet_manager et conducteur car tous ont besoin de voir les affectations.
// Les conducteurs doivent voir leurs propres affectations, les managers doivent voir celles de leur equipe.
router.get('/', protect, authorize('admin', 'fleet_manager', 'conducteur'), getAffectations);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'conducteur'), getAffectationById);

// Creer, Modifier et Clore une affectation (Reserve Admin et Fleet Manager).
// J'ai restreint ces operations aux roles de gestion car ce sont des actions sensibles.
// Les conducteurs ne doivent pas pouvoir creer ou modifier des affectations arbitrairement.
// J'ajoute les validateurs pour s'assurer que les donnees sont valides avant d'arriver au controleur.
router.post('/', protect, authorize('admin', 'fleet_manager'), validateCreerAffectation, creerAffectation);
router.put('/:id/terminer', protect, authorize('admin', 'fleet_manager'), validateTerminerAffectation, terminerAffectation);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), validateModifierAffectation, modifierAffectation);

// Supprimer une affectation (Reserve Admin uniquement).
// J'ai limite la suppression au seul role admin car c'est une operation critique.
// Meme les fleet managers ne devraient pas pouvoir supprimer des affectations sans validation.
router.delete('/:id', protect, authorize('admin'), supprimerAffectation);

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;