const { body, validationResult } = require('express-validator');

// Middleware generique pour bloquer la requete si express-validator trouve des erreurs.

/**
 * Verifie les resultats de validation et bloque la requete si des erreurs sont trouvees.
 * Role : centraliser la logique de gestion des erreurs de validation.
 * Parametres : req, res, next (standard middleware Express)
 * Valeur de retour : 400 avec les erreurs si validation echoue, next() sinon
 */
const validerReste = (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
        return res.status(400).json({ erreurs: erreurs.array() });
    }
    next();
};

// Regles de validation pour la creation d'une alerte.

/**
 * Valide les donnees de creation d'une alerte.
 * Role : s'assurer que les donnees envoyees sont valides avant de creer l'alerte.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateCreerAlerte = [
    // Le titre est obligatoire.
    body('titre')
        .trim()
        .notEmpty().withMessage('Le titre est obligatoire.'),

    // Le type d'alerte est obligatoire et doit faire partie de l'enum.
    body('typeAlerte')
        .notEmpty().withMessage("Le type d'alerte est obligatoire.")
        .isIn(['maintenance', 'carburant', 'securite', 'geo-fencing', 'administratif']).withMessage("Le type d'alerte est invalide."),

    // Le niveau d'urgence est optionnel mais si fourni, doit faire partie de l'enum.
    body('niveauUrgence')
        .optional()
        .isIn(['low', 'medium', 'critical']).withMessage("Le niveau d'urgence est invalide."),

    // Le vehicule est optionnel mais si fourni, doit etre un ObjectId valide.
    body('vehicule')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du véhicule est invalide."),

    // Le conducteur est optionnel mais si fourni, doit etre un ObjectId valide.
    body('conducteur')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du conducteur est invalide."),

    // La description est optionnelle mais si fournie, on la trim.
    body('description')
        .optional()
        .trim(),

    validerReste
];

// Regles de validation pour la modification d'une alerte.

/**
 * Valide les donnees de modification d'une alerte.
 * Role : s'assurer que les donnees envoyees sont valides avant de modifier l'alerte.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateModifierAlerte = [
    // Tous les champs sont optionnels pour la modification.
    body('titre')
        .optional()
        .trim()
        .notEmpty().withMessage('Le titre ne peut pas être vide.'),

    body('typeAlerte')
        .optional()
        .isIn(['maintenance', 'carburant', 'securite', 'geo-fencing', 'administratif']).withMessage("Le type d'alerte est invalide."),

    body('niveauUrgence')
        .optional()
        .isIn(['low', 'medium', 'critical']).withMessage("Le niveau d'urgence est invalide."),

    body('statut')
        .optional()
        .isIn(['active', 'en_cours', 'resolue', 'acquittee']).withMessage('Le statut est invalide.'),

    body('vehicule')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du véhicule est invalide."),

    body('conducteur')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du conducteur est invalide."),

    body('description')
        .optional()
        .trim(),

    validerReste
];
