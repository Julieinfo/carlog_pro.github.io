// Import du modele Mongoose pour les affectations.
// C'est ce modele qui definit la structure des donnees dans MongoDB.
const Affectation = require('../models/Affectation');

// ==========================================
// GET /api/affectations (Récupérer toutes les affectations de l'entreprise)
// ==========================================

/**
 * Recupere toutes les affectations de l'entreprise de l'utilisateur connecte.
 * Role : afficher la liste complete des affectations pour le dashboard.
 * Parametres : aucun (utilise req.user.entreprise depuis le token JWT)
 * Valeur de retour : tableau d'objets affectation avec les details vehicule et conducteur
 */
exports.getAffectations = async (req, res) => {
    try {
        // Securite multi-tenant : on ne recupere QUE les affectations de l'entreprise de l'utilisateur connecte.
        // C'est crucial pour empecher une entreprise de voir les donnees d'une autre.
        // L'entrepriseId vient du token JWT decode dans le middleware d'authentification.
        const entrepriseId = req.user.entreprise;

        // Requete avec populate : ca permet de recuperer les details des references (vehicule, conducteur)
        // au lieu d'avoir juste les IDs. J'ai choisi de ne recuperer que certains champs pour alleger la reponse.
        // J'aurais pu faire une requete separee pour chaque reference, mais populate est plus performant.
        const affectations = await Affectation.find({ entreprise: entrepriseId })
        .populate('vehicule', 'marque modele immatriculation') // optionnel: pour embarquer les détails du véhicule
        .populate('conducteur', 'nom prenom email')            // optionnel: pour embarquer les détails du chauffeur
        .sort({ dateDebut: -1 }); // Les plus récentes en premier

        res.status(200).json(affectations);
    } catch (err) {
        // En cas d'erreur, on renvoie un 500 avec le message d'erreur.
        // En prod, on devrait logger l'erreur et renvoyer un message plus genérique pour ne pas exposer les details techniques.
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// POST /api/affectations (Créer une nouvelle affectation)
// ==========================================

/**
 * Cree une nouvelle affectation de vehicule a un conducteur.
 * Role : permettre l'attribution d'un vehicule pour une mission.
 * Parametres : vehicule (ID), conducteur (ID), dateDebut (optionnel), kmDebut (obligatoire), observations (optionnel)
 * Valeur de retour : l'objet affectation cree avec statut 'en_cours'
 */
exports.creerAffectation = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;
        const { vehicule, conducteur, dateDebut, kmDebut, observations } = req.body;

        // 1. Verification basique des champs obligatoires.
        // J'ai choisi de faire cette verification ici plutot que dans un middleware pour garder la logique metier au meme endroit.
        // Ca pourrait etre deplace dans un validator middleware si l'application grossit.
        if (!vehicule || !conducteur || !kmDebut) {
        return res.status(400).json({ message: 'Veuillez fournir le véhicule, le conducteur et le kilométrage de départ.' });
        }

        // 2. Regle metier : Verifier si le vehicule est deja pris.
        // C'est important pour eviter qu'un meme vehicule soit attribue a plusieurs conducteurs en meme temps.
        // On filtre par entreprise pour rester dans le contexte multi-tenant.
        const vehiculeOccupe = await Affectation.findOne({
        entreprise: entrepriseId,
        vehicule,
        statut: 'en_cours'
        });
        if (vehiculeOccupe) {
        return res.status(400).json({ message: 'Ce véhicule est déjà affecté à un autre conducteur actuellement.' });
        }

        // 3. Regle metier : Verifier si le conducteur conduit deja un autre vehicule.
        // Meme logique : un conducteur ne peut avoir qu'un vehicule a la fois.
        // J'aurais pu combiner les deux requetes en une avec $or, mais deux requetes separes sont plus lisibles.
        const conducteurOccupe = await Affectation.findOne({
        entreprise: entrepriseId,
        conducteur,
        statut: 'en_cours'
        });
        if (conducteurOccupe) {
        return res.status(400).json({ message: 'Ce conducteur est déjà affecté à un autre véhicule actuellement.' });
        }

        // 4. Creation de l'affectation.
        // On force l'entrepriseId pour garantir l'isolation multi-tenant, meme si un utilisateur malveillant l'envoyait dans le body.
        // dateDebut est optionnel : si non fourni, on utilise la date actuelle par defaut.
        const nouvelleAffectation = await Affectation.create({
        entreprise: entrepriseId, // Forcé pour l'isolation multi-tenant
        vehicule,
        conducteur,
        dateDebut: dateDebut || Date.now(),
        kmDebut,
        observations,
        statut: 'en_cours'
        });

        res.status(201).json(nouvelleAffectation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// GET /api/affectations/:id (Lire une seule affectation - Sécurisée)
// ==========================================

/**
 * Recupere une affectation specifique par son ID.
 * Role : afficher les details d'une affectation pour consultation ou modification.
 * Parametres : id (dans l'URL)
 * Valeur de retour : l'objet affectation avec les details conducteur et vehicule
 */
exports.getAffectationById = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;

        // Securisation multi-tenant : l'affectation doit appartenir a l'entreprise de l'user.
        // J'utilise findOne avec deux criteres (_id et entreprise) au lieu de findById + verification,
        // car c'est plus performant (une seule requete) et plus securise (pas de race condition).
        const affectation = await Affectation.findOne({ _id: req.params.id, entreprise: entrepriseId })
            .populate('conducteur', 'nom prenom email')
            .populate('vehicule', 'immatriculation marque modele');

        if (!affectation) {
            return res.status(404).json({ message: 'Affectation introuvable ou accès refusé.' });
        }

        res.status(200).json(affectation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// PUT /api/affectations/:id (Modifier une affectation - Sécurisée)
// ==========================================

/**
 * Modifie une affectation existante.
 * Role : permettre la correction d'informations dans une affectation en cours.
 * Parametres : id (dans l'URL), champs a modifier (dans le body)
 * Valeur de retour : l'objet affectation modifie
 */
exports.modifierAffectation = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;

        // Securisation multi-tenant : on filtre par ID ET par entreprise.
        // findOneAndUpdate est parfait pour ca : il fait la recherche et la mise a jour en une seule operation atomique.
        // new: true renvoie le document modifie (pas l'ancien).
        // runValidators: true est important pour que les validations du schema Mongoose s'appliquent meme sur update.
        // CORRECTION SÉCURITÉ : Filtrage des champs autorisés pour empêcher la modification de champs sensibles.
        // Avant : req.body était passé directement à findOneAndUpdate, permettant à un utilisateur malveillant
        // de modifier des champs critiques comme 'entreprise', 'statut', ou tout autre champ non prévu.
        // Risque : Un utilisateur pourrait modifier l'entreprise pour accéder aux affectations d'une autre entreprise.
        // Maintenant : On extrait uniquement les champs autorisés (vehicule, conducteur, dateDebut, kmDebut, observations, dateFin, kmFin).
        const champsAutorises = ['vehicule', 'conducteur', 'dateDebut', 'kmDebut', 'observations', 'dateFin', 'kmFin'];
        const donneesValides = {};
        champsAutorises.forEach(champ => {
            if (req.body[champ] !== undefined) {
                donneesValides[champ] = req.body[champ];
            }
        });

        const affectationModifiee = await Affectation.findOneAndUpdate(
            { _id: req.params.id, entreprise: entrepriseId },
            donneesValides,
            { new: true, runValidators: true }
        );

        if (!affectationModifiee) {
            return res.status(404).json({ message: 'Affectation introuvable ou accès refusé.' });
        }

        res.status(200).json({ message: 'Affectation mise à jour avec succès.', affectation: affectationModifiee });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// PUT /api/affectations/:id/terminer (Clore proprement une affectation pour l'historique)
// ==========================================

/**
 * Cloture une affectation en cours et l'archive dans l'historique.
 * Role : permettre de terminer proprement une mission avec le kilometrage final.
 * Parametres : id (dans l'URL), dateFin (optionnel), kmFin (obligatoire), observationsFin (optionnel)
 * Valeur de retour : l'objet affectation avec statut 'terminee'
 */
exports.terminerAffectation = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;
        const { dateFin, kmFin, observationsFin } = req.body;

        // Le kilometrage de fin est obligatoire car c'est essentiel pour le suivi de l'usure des vehicules.
        // J'ai choisi de le rendre obligatoire ici plutot que dans le schema pour avoir un message d'erreur plus clair.
        if (!kmFin) {
            return res.status(400).json({ message: 'Le kilométrage de fin est obligatoire pour clore l\'affectation.' });
        }

        // On cherche l'affectation active appartenant a l'entreprise.
        // J'utilise findOne au lieu de findById pour verifier l'appartenance a l'entreprise en meme temps.
        const affectation = await Affectation.findOne({ _id: req.params.id, entreprise: entrepriseId });

        if (!affectation) {
            return res.status(404).json({ message: 'Affectation introuvable ou accès refusé.' });
        }

        // On verifie que l'affectation n'est pas deja cloturee pour eviter les doublons dans l'historique.
        if (affectation.statut === 'terminee') {
            return res.status(400).json({ message: 'Cette affectation est déjà clôturée.' });
        }

        // Regle metier : Le kilometrage de fin ne peut pas etre inferieur au kilometrage de depart.
        // C'est une verification de coherence pour eviter les erreurs de saisie.
        // J'aurais pu aussi verifier que kmFin n'est pas trop eleve (ex: +1000km en 1h), mais c'est plus complexe a mettre en place.
        if (kmFin < affectation.kmDebut) {
            return res.status(400).json({ 
                message: `Le kilométrage de fin (${kmFin} km) ne peut pas être inférieur au kilométrage de départ (${affectation.kmDebut} km).` 
            });
        }

        // Mise a jour pour l'historique.
        // Je modifie directement l'objet et j'appelle save() plutot que d'utiliser findOneAndUpdate,
        // car j'ai besoin de faire plusieurs modifications et une verification de logique metier avant.
        affectation.statut = 'terminee';
        affectation.dateFin = dateFin || Date.now();
        affectation.kmFin = kmFin;
        // Je concatene les observations de fin a celles existantes pour garder l'historique complet.
        if (observationsFin) affectation.observations = `${affectation.observations || ''} | Fin: ${observationsFin}`;

        await affectation.save();

        res.status(200).json({ message: 'Affectation clôturée avec succès et archivée dans l\'historique.', affectation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// DELETE /api/affectations/:id (Supprimer une affectation - Sécurisée)
// ==========================================

/**
 * Supprime une affectation de la base de donnees.
 * Role : permettre la suppression d'une affectation (en cas d'erreur de creation par exemple).
 * Parametres : id (dans l'URL)
 * Valeur de retour : message de confirmation
 */
exports.supprimerAffectation = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;

        // Securisation multi-tenant : on filtre par ID ET par entreprise.
        // findOneAndDelete est parfait pour ça : il fait la recherche et la suppression en une seule operation atomique.
        const affectationSupprimee = await Affectation.findOneAndDelete(
            { _id: req.params.id, entreprise: entrepriseId }
        );

        if (!affectationSupprimee) {
            return res.status(404).json({ message: 'Affectation introuvable ou accès refusé.' });
        }

        // J'ai choisi d'autoriser la suppression meme pour les affectations en cours.
        // En prod, on pourrait vouloir empecher ça pour forcer la cloture propre (terminerAffectation).
        // Mais pour l'instant, ça donne de la flexibilite pour corriger les erreurs.
        res.status(200).json({ message: 'Affectation supprimée avec succès.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};