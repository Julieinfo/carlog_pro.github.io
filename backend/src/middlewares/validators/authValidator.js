const { body, validationResult } = require('express-validator');

// Middleware generique pour bloquer la requete si express-validator trouve des erreurs.
// C'est un helper pour eviter de repeter la logique de verification des erreurs.

/**
 * Verifie les resultats de validation et bloque la requete si des erreurs sont trouvees.
 * Role : centraliser la logique de gestion des erreurs de validation.
 * Parametres : req, res, next (standard middleware Express)
 * Valeur de retour : 400 avec les erreurs si validation echoue, next() sinon
 */
const validerReste = (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
        // On renvoie un statut 400 avec la liste de toutes les erreurs formatees.
        // erreurs.array() renvoie un tableau d'objets avec les details de chaque erreur (champ, message, valeur).
        // J'ai choisi de renvoyer toutes les erreurs d'un coup pour que le frontend puisse tout afficher.
        return res.status(400).json({ erreurs: erreurs.array() });
    }
    // Pas d'erreurs, on continue la chaine de middlewares.
    next();
};

// Regles de validation pour l'inscription.
// C'est un tableau de middlewares express-validator qui seront executes sequentiellement.

/**
 * Valide les donnees d'inscription (utilisateur + entreprise).
 * Role : s'assurer que les donnees envoyees sont valides avant de creer le compte.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateInscription = [
    // 1. Validation de l'Utilisateur
    // Chaque body() cree une regle de validation pour un champ specifique.
    // Les chaines de methodes (trim(), notEmpty(), isAlpha(), etc.) definissent les contraintes.
    
    body('nom')
        .trim() // Supprime les espaces au debut et a la fin
        .notEmpty().withMessage('Le nom est obligatoire.')
        .isAlpha('fr-FR', { ignore: ' -' }).withMessage('Le nom ne doit contenir que des lettres.'),
        // isAlpha avec 'fr-FR' accepte les accents francais, et ignore: ' -' permet les tirets et espaces (ex: "Jean-Pierre")

    body('prenom')
        .trim()
        .notEmpty().withMessage('Le prénom est obligatoire.')
        .isAlpha('fr-FR', { ignore: ' -' }).withMessage('Le prénom ne doit contenir que des lettres.'),

    body('email')
        .trim()
        .notEmpty().withMessage('L\'adresse email est obligatoire.')
        .isEmail().withMessage('Le format de l\'email est invalide.')
        .normalizeEmail(), // Convertit en minuscules et nettoie l'email (ex: "Test@Example.COM" -> "test@example.com")

    body('motDePasse')
        .notEmpty().withMessage('Le mot de passe est obligatoire.')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
        .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule.')
        .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.')
        .matches(/[\W_]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial.'),
        // J'ai choisi des regles strictes pour la securite, mais elles pourraient etre assouplies si necessaire.
        // \W correspond a tout caractere non-alphanumerique, et _ ajoute le underscore.

    // 2. Validation de l'Entreprise liee
    body('nomEntreprise')
        .trim()
        .notEmpty().withMessage('Le nom de l\'entreprise est obligatoire.'),
        // J'ai limite la validation de l'entreprise au nom pour l'instant.
        // On pourrait ajouter des regles pour le SIRET, l'adresse, etc. si necessaire.

    // On lance la verification finale qui bloquera la requete si une regle echoue.
    // validerReste doit etre en dernier pour verifier toutes les regles accumulees.
    validerReste
];

// Regles de validation pour la connexion.
// Plus simples que l'inscription car on a moins de champs a valider.

/**
 * Valide les donnees de connexion.
 * Role : s'assurer que l'email et le mot de passe sont presents et valides.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateConnexion = [
    body('email')
        .trim()
        .notEmpty().withMessage('L\'adresse email est obligatoire.')
        .isEmail().withMessage('Le format de l\'email est invalide.')
        .normalizeEmail(),

    body('motDePasse')
        .notEmpty().withMessage('Le mot de passe est obligatoire.'),
        // Je ne valide pas le format du mot de passe ici car on ne veut pas aider un attaquant
        // a deviner les regles de mot de passe. La verification se fait dans le controleur.

    // Execute la verification et bloque si une regle echoue.
    validerReste
];