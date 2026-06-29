const express = require('express');
const router = express.Router();

// Import des middlewares de validation.
// Ces middlewares verifient que les donnees envoyees sont valides avant d'arriver au controleur.
// C'est important pour la securite et pour eviter les erreurs de saisie dans la base.
const { validateInscription, validateConnexion } = require('../middlewares/validators/authValidator');

// Import des fonctions du controleur.
// Ces fonctions contiennent la logique metier pour l'inscription et la connexion.
const { inscription, connexion } = require('../controllers/authController');

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

// Export du routeur pour pouvoir l'utiliser dans app.js.
module.exports = router;