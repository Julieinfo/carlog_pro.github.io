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

// Regles de validation pour la creation d'un vehicule.

/**
 * Valide les donnees de creation d'un vehicule.
 * Role : s'assurer que les donnees envoyees sont valides avant de creer le vehicule.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateCreerVehicule = [
    // L'immatriculation est obligatoire.
    body('immatriculation')
        .trim()
        .notEmpty().withMessage("L'immatriculation est obligatoire."),

    // La marque est obligatoire.
    body('marque')
        .trim()
        .notEmpty().withMessage('La marque est obligatoire.'),

    // Le modele est obligatoire.
    body('modele')
        .trim()
        .notEmpty().withMessage('Le modèle est obligatoire.'),

    // Le type de vehicule est obligatoire et doit faire partie de l'enum.
    body('typeVehicule')
        .notEmpty().withMessage('Le type de véhicule est obligatoire.')
        .isIn(['porteur', 'tracteur', 'remorque', 'utilitaire', 'voiture']).withMessage('Le type de véhicule est invalide.'),

    // Le PTAC est obligatoire et doit etre positif.
    body('ptac')
        .notEmpty().withMessage('Le PTAC est obligatoire.')
        .isInt({ min: 0 }).withMessage('Le PTAC doit être un nombre positif.'),

    // L'annee est optionnelle mais si fournie, doit etre entre 1900 et l'annee courante + 1.
    body('annee')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage("L'année est invalide."),

    // Le carburant est optionnel mais si fourni, doit faire partie de l'enum.
    body('carburant')
        .optional()
        .isIn(['diesel', 'gnv', 'electrique', 'hydrogene', 'essence', 'hybride']).withMessage('Le type de carburant est invalide.'),

    // Le kilometrage est optionnel mais si fourni, doit etre positif.
    body('kilometrage')
        .optional()
        .isInt({ min: 0 }).withMessage('Le kilométrage doit être un nombre positif.'),

    validerReste
];

// Regles de validation pour la modification d'un vehicule.

/**
 * Valide les donnees de modification d'un vehicule.
 * Role : s'assurer que les donnees envoyees sont valides avant de modifier le vehicule.
 * Parametres : aucun (utilise req.body)
 * Valeur de retour : middleware array (express-validator)
 */
exports.validateModifierVehicule = [
    // Tous les champs sont optionnels pour la modification.
    body('immatriculation')
        .optional()
        .trim()
        .notEmpty().withMessage("L'immatriculation ne peut pas être vide."),

    body('marque')
        .optional()
        .trim()
        .notEmpty().withMessage('La marque ne peut pas être vide.'),

    body('modele')
        .optional()
        .trim()
        .notEmpty().withMessage('Le modèle ne peut pas être vide.'),

    body('typeVehicule')
        .optional()
        .isIn(['porteur', 'tracteur', 'remorque', 'utilitaire', 'voiture']).withMessage('Le type de véhicule est invalide.'),

    body('ptac')
        .optional()
        .isInt({ min: 0 }).withMessage('Le PTAC doit être un nombre positif.'),

    body('annee')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage("L'année est invalide."),

    body('carburant')
        .optional()
        .isIn(['diesel', 'gnv', 'electrique', 'hydrogene', 'essence', 'hybride']).withMessage('Le type de carburant est invalide.'),

    body('kilometrage')
        .optional()
        .isInt({ min: 0 }).withMessage('Le kilométrage doit être un nombre positif.'),

    body('statut')
        .optional()
        .isIn(['disponible', 'en_course', 'en_maintenance', 'en_panne']).withMessage('Le statut est invalide.'),

    validerReste
];
