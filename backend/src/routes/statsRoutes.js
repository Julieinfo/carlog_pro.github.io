const express = require('express');
const router = express.Router();

// Import des middlewares de securite.
// protect verifie l'authentification JWT.
// authorize restreint l'acces aux roles admin et fleet_manager.
const { protect, authorize } = require('../middlewares/authMiddleware');

// Import de la fonction du controleur stats.
const { getDashboardStats } = require('../controllers/statsController');

// ==========================================
// ROUTES PRIVEES /api/stats
// ==========================================

// Route accessible uniquement pour la gestion.
// J'ai restreint l'acces aux roles admin et fleet_manager car les statistiques
// sont des informations sensibles sur la performance de la flotte.
// Les conducteurs n'ont pas besoin d'acceder aux KPI globaux de l'entreprise.
router.get('/', protect, authorize('admin', 'fleet_manager'), getDashboardStats);

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;