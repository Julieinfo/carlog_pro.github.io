// Import du modele Mongoose pour les alertes.
// Les alertes servent a signaler des problemes ou des evenements sur les vehicules.
const Alerte = require('../models/Alerte');

// ==========================================
// 1. [CREATE] - Créer une alerte
// POST /api/alertes
// ==========================================

/**
 * Cree une nouvelle alerte dans le systeme.
 * Role : permettre le signalement de problemes (panne, accident, maintenance, etc.)
 * Parametres : titre (obligatoire), typeAlerte (obligatoire), vehicule (optionnel), conducteur (optionnel), description (optionnel), niveauUrgence (optionnel), statut (optionnel)
 * Valeur de retour : l'objet alerte cree
 */
exports.creerAlerte = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;
        const { vehicule, conducteur, titre, description, typeAlerte, niveauUrgence, statut } = req.body;

        // Validation des champs obligatoires selon le schema.
        // J'ai choisi de valider ici pour avoir un message d'erreur specifique.
        // En prod, on pourrait utiliser une bibliotheque de validation comme Joi ou express-validator.
        if (!titre || !typeAlerte) {
        return res.status(400).json({ message: 'Le titre et le type d\'alerte sont obligatoires.' });
        }

        const nouvelleAlerte = await Alerte.create({
        entreprise: entrepriseId, // Force pour l'isolation multi-tenant
        vehicule,
        conducteur,
        titre,
        description,
        typeAlerte,
        niveauUrgence,
        statut
        });

        res.status(201).json(nouvelleAlerte);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 2. [READ ALL] - Récupérer toutes les alertes de l'entreprise
// GET /api/alertes
// ==========================================

/**
 * Recupere toutes les alertes de l'entreprise avec possibilite de filtrage.
 * Role : afficher la liste des alertes pour le dashboard de suivi.
 * Parametres : statut (optionnel, dans query string pour filtrer)
 * Valeur de retour : tableau d'objets alerte avec details vehicule et conducteur
 */
exports.getAlertes = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;
        
        // Possibilite de filtrer par statut via l'URL (ex: /api/alertes?statut=active).
        // C'est pratique pour le frontend qui peut avoir des onglets (toutes, actives, resolues).
        // J'ai utilise req.query plutot que des routes separees pour garder l'API simple.
        const filtre = { entreprise: entrepriseId };
        if (req.query.statut) {
        filtre.statut = req.query.statut;
        }

        const alertes = await Alerte.find(filtre)
        .populate('vehicule', 'marque modele immatriculation')
        .populate('conducteur', 'nom prenom email')
        .sort({ createdAt: -1 }); // Les plus récentes d'abord (createdAt généré par les timestamps)

        res.status(200).json(alertes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 3. [READ VEHICLE HISTORY] - Historique des alertes d'un véhicule
// GET /api/alertes/vehicule/:vehiculeId
// ==========================================

/**
 * Recupere l'historique des alertes pour un vehicule specifique.
 * Role : afficher tous les problemes rencontres par un vehicule pour analyse.
 * Parametres : vehiculeId (dans l'URL)
 * Valeur de retour : tableau d'objets alerte filtre par vehicule
 */
exports.getAlertesByVehicule = async (req, res) => {
    try {
        const { vehiculeId } = req.params;
        const entrepriseId = req.user.entreprise;

        // Securite multi-tenant : on s'assure que le vehicule appartient a la meme entreprise.
        // C'est crucial pour eviter qu'une entreprise puisse voir l'historique des vehicules d'une autre.
        // J'utilise un filtre combine (entreprise + vehicule) pour garantir l'isolation.
        const alertes = await Alerte.find({ 
        entreprise: entrepriseId, 
        vehicule: vehiculeId 
        })
        .populate('conducteur', 'nom prenom')
        .sort({ createdAt: -1 });

        res.status(200).json(alertes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 4. [READ ONE] - Détails d'une seule alerte
// GET /api/alertes/:id
// ==========================================

/**
 * Recupere les details d'une alerte specifique.
 * Role : afficher les informations completes d'une alerte pour consultation ou resolution.
 * Parametres : id (dans l'URL)
 * Valeur de retour : l'objet alerte avec tous les details (y compris qui l'a resolue)
 */
exports.getAlerteById = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        const alerte = await Alerte.findById(id)
        .populate('vehicule', 'marque modele immatriculation')
        .populate('conducteur', 'nom prenom')
        .populate('resoluePar', 'nom prenom');

        // Verification de l'appartenance a l'entreprise.
        // J'utilise toString() pour comparer les ObjectId car ce sont des objets et pas des chaines directes.
        // J'aurais pu utiliser findOne avec filtre, mais findById + verification est plus standard.
        if (!alerte || alerte.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Alerte introuvable ou accès non autorisé.' });
        }

        res.status(200).json(alerte);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 5. [UPDATE] - Modifier ou Résoudre une alerte
// PUT /api/alertes/:id
// ==========================================

/**
 * Modifie une alerte existante ou la marque comme resolue.
 * Role : permettre la mise a jour des informations ou la resolution d'une alerte.
 * Parametres : id (dans l'URL), champs a modifier (dans le body)
 * Valeur de retour : l'objet alerte modifie
 */
exports.modifierAlerte = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        let alerte = await Alerte.findById(id);

        if (!alerte || alerte.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Alerte introuvable ou accès non autorisé.' });
        }

        // REGLE METIER : Si le statut passe a 'resolue', on injecte l'utilisateur connecte et la date actuelle.
        // C'est important pour le suivi : on sait qui a resolu l'alerte et quand.
        // Je verifie aussi que l'alerte n'etait pas deja resolue pour eviter d'ecraser l'historique.
        // CORRECTION SÉCURITÉ : Filtrage des champs autorisés pour empêcher la modification de champs sensibles.
        // Avant : req.body était passé directement à findByIdAndUpdate, permettant à un utilisateur malveillant
        // de modifier des champs critiques comme 'entreprise', 'resoluePar', 'dateResolution', ou tout autre champ non prévu.
        // Risque : Un utilisateur pourrait modifier l'entreprise pour accéder aux alertes d'une autre entreprise,
        // ou s'attribuer faussement la résolution d'une alerte en modifiant 'resoluePar'.
        // Maintenant : On extrait uniquement les champs autorisés de manière explicite (whitelist statique)
        // pour éviter toute injection de propriété distante (remote property injection).
        const donneesValides = {
            ...(req.body.titre !== undefined && { titre: req.body.titre }),
            ...(req.body.description !== undefined && { description: req.body.description }),
            ...(req.body.typeAlerte !== undefined && { typeAlerte: req.body.typeAlerte }),
            ...(req.body.niveauUrgence !== undefined && { niveauUrgence: req.body.niveauUrgence }),
            ...(req.body.statut !== undefined && { statut: req.body.statut })
        };

        // Gestion spéciale pour le statut 'resolue' : on injecte automatiquement resoluePar et dateResolution
        if (donneesValides.statut === 'resolue' && alerte.statut !== 'resolue') {
        donneesValides.resoluePar = req.user._id; // L'ID de l'utilisateur extrait du token JWT
        donneesValides.dateResolution = Date.now();
        }

        alerte = await Alerte.findByIdAndUpdate(id, donneesValides, {
        new: true,
        runValidators: true
        });

        res.status(200).json(alerte);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 6. [DELETE] - Supprimer définitivement une alerte
// DELETE /api/alertes/:id
// ==========================================

/**
 * Supprime definitivement une alerte de la base de donnees.
 * Role : permettre la suppression d'alertes erronees ou obsoletes.
 * Parametres : id (dans l'URL)
 * Valeur de retour : message de confirmation
 */
exports.supprimerAlerte = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        const alerte = await Alerte.findById(id);

        if (!alerte || alerte.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Alerte introuvable ou accès non autorisé.' });
        }

        // Contrairement aux vehicules (soft delete), on peut faire une suppression totale pour les alertes.
        // C'est un choix metier : les alertes sont moins critiques que les donnees vehicules,
        // et on peut avoir besoin de supprimer des erreurs de saisie sans polluer la base.
        // J'aurais pu faire un soft delete aussi, mais ça me semble inutile pour ce cas d'usage.
        await Alerte.findByIdAndDelete(id);

        res.status(200).json({ message: 'Alerte supprimée avec succès.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};