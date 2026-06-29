const { body, validationResult } = require('express-validator');

// Middleware generique pour bloquer la requete si express-validator trouve des erreurs.
// C'est le meme helper que dans authValidator, je le reproduis ici pour eviter les dependances circulaires.

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

// Regles de validation pour la creation d'une affectation.

/**
 * Valide les donnees de creation d'une affectation.
 * Role : s'assurer que les donnees envoyees sont valides avant de creer l'affectation.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateCreerAffectation = [
    // Le vehicule est obligatoire et doit etre un ObjectId MongoDB valide.
    // J'utilise une regex pour verifier le format de l'ObjectId.
    body('vehicule')
        .notEmpty().withMessage('Le véhicule est obligatoire.')
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du véhicule est invalide."),

    // Le conducteur est obligatoire et doit etre un ObjectId MongoDB valide.
    body('conducteur')
        .notEmpty().withMessage('Le conducteur est obligatoire.')
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du conducteur est invalide."),

    // Le kilometrage de debut est obligatoire et doit etre positif.
    body('kmDebut')
        .notEmpty().withMessage('Le kilométrage de départ est obligatoire.')
        .isInt({ min: 0 }).withMessage('Le kilométrage doit être un nombre positif.'),

    // La date de debut est optionnelle mais si fournie, doit etre une date valide.
    body('dateDebut')
        .optional()
        .isISO8601().withMessage('La date de début doit être une date valide.'),

    // Les observations sont optionnelles mais si fournies, on les trim.
    body('observations')
        .optional()
        .trim(),

    validerReste
];

// Regles de validation pour la modification d'une affectation.

/**
 * Valide les donnees de modification d'une affectation.
 * Role : s'assurer que les donnees envoyees sont valides avant de modifier l'affectation.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateModifierAffectation = [
    // Tous les champs sont optionnels pour la modification.
    // Si vehicule est fourni, il doit etre un ObjectId valide.
    body('vehicule')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du véhicule est invalide."),

    // Si conducteur est fourni, il doit etre un ObjectId valide.
    body('conducteur')
        .optional()
        .matches(/^[0-9a-fA-F]{24}$/).withMessage("L'ID du conducteur est invalide."),

    // Si kmDebut est fourni, il doit etre positif.
    body('kmDebut')
        .optional()
        .isInt({ min: 0 }).withMessage('Le kilométrage doit être un nombre positif.'),

    // Si dateDebut est fournie, elle doit etre une date valide.
    body('dateDebut')
        .optional()
        .isISO8601().withMessage('La date de début doit être une date valide.'),

    // Si observations est fourni, on le trim.
    body('observations')
        .optional()
        .trim(),

    validerReste
];

// Regles de validation pour la cloture d'une affectation.

/**
 * Valide les donnees de cloture d'une affectation.
 * Role : s'assurer que le kilometrage de fin est valide avant de cloturer l'affectation.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateTerminerAffectation = [
    // Le kilometrage de fin est obligatoire pour la cloture.
    body('kmFin')
        .notEmpty().withMessage('Le kilométrage de fin est obligatoire.')
        .isInt({ min: 0 }).withMessage('Le kilométrage doit être un nombre positif.'),

    // La date de fin est optionnelle mais si fournie, doit etre une date valide.
    body('dateFin')
        .optional()
        .isISO8601().withMessage('La date de fin doit être une date valide.'),

    // Les observations de fin sont optionnelles mais si fournies, on les trim.
    body('observationsFin')
        .optional()
        .trim(),

    validerReste
];
