const express = require('express');
const router = express.Router();

// Import des middlewares de validation et de securite.
// Ces middlewares verifient que les donnees envoyees sont valides avant d'arriver au controleur.
// C'est important pour la securite et pour eviter les erreurs de saisie dans la base.
const { validateInscription, validateConnexion } = require('../middlewares/validators/authValidator');
const { protect } = require('../middlewares/authMiddleware');

// Import des fonctions du controleur.
// Ces fonctions contiennent la logique metier pour l'inscription, la connexion et le profil.
const { inscription, connexion, getProfil } = require('../controllers/authController');

// ==========================================
// ROUTES PUBLIQUES (pas besoin de JWT)
// ==========================================
// Ces routes sont accessibles sans authentification car elles servent a s'authentifier.

// Route pour la creation de compte (Entreprise + Admin).
// validateInscription verifie que tous les champs sont valides avant d'appeler inscription.
// J'ai mis la validation avant le controleur pour rejeter les requetes invalides rapidement.
router.post('/inscription', validateInscription, inscription);

// Route pour la connexion.
// validateConnexion verifie le format de l'email et la presence du mot de passe.
// J'ai choisi de ne pas valider le format du mot de passe ici pour ne pas aider un attaquant.
router.post('/connexion', validateConnexion, connexion);

// Route pour recuperer le profil de l'utilisateur connecte.
// Cette route est protegee par le middleware protect car elle necessite une authentification.
// J'ai choisi GET car c'est une lecture de donnees (RESTful).
router.get('/me', protect, getProfil);

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;