const Vehicule = require('../models/Vehicule');

// Ajout d'un vehicule dans le parc de l'entreprise connectee.

/**
 * Cree un nouveau vehicule dans la base de donnees.
 * Role : permettre l'ajout d'un vehicule au parc de l'entreprise.
 * Parametres : immatriculation (obligatoire), marque (obligatoire), modele (obligatoire), typeVehicule, kilometrage, ptac, carburant, statut
 * Valeur de retour : l'objet vehicule cree
 */
exports.creerVehicule = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;
        const { immatriculation, marque, modele, typeVehicule, kilometrage, ptac, carburant, statut } = req.body;

        // On valide ici les champs minimum pour eviter de polluer la base avec des fiches inexploitables.
        // J'ai choisi de faire cette validation manuellement plutot que d'utiliser une bibliotheque de validation
        // pour garder le code simple et eviter une dependance supplementaire.
        if (!immatriculation || !marque || !modele) {
        return res.status(400).json({ message: 'L\'immatriculation, la marque et le modèle sont obligatoires.' });
        }

        // L'immatriculation est unique par entreprise (multi-tenant), pas globalement sur toute la plateforme.
        // C'est important : deux entreprises differentes peuvent avoir la meme immatriculation (ex: AB-123),
        // mais une entreprise ne peut pas avoir deux vehicules avec la meme plaque.
        // Je normalise en majuscules et trim pour eviter les doublons visuels (ex: "ab-123" vs "AB-123 ").
        const vehiculeExistant = await Vehicule.findOne({ entreprise: entrepriseId, immatriculation: immatriculation.toUpperCase().trim() });
        if (vehiculeExistant) {
        return res.status(400).json({ message: 'Un véhicule avec cette immatriculation existe déjà.' });
        }

        const nouveauVehicule = await Vehicule.create({
        // Important : on prend l'entreprise depuis le token, jamais depuis le body (sinon faille de securite).
        // Si on permettait a l'utilisateur de specifier l'entreprise dans le body, il pourrait creer des vehicules
        // pour d'autres entreprises, ce qui serait une faille de securite critique.
        entreprise: entrepriseId,
        immatriculation: immatriculation.toUpperCase().trim(),
        marque,
        modele,
        typeVehicule,
        kilometrage,
        ptac,
        carburant,
        statut
        });

        res.status(201).json(nouveauVehicule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Liste des vehicules avec pagination + recherche + filtres.
// C'est une fonction complexe car elle gere plusieurs fonctionnalites en meme temps.

/**
 * Recupere la liste des vehicules de l'entreprise avec pagination, recherche et filtres.
 * Role : afficher le parc vehicule avec possibilite de filtrer et rechercher.
 * Parametres : page (optionnel, defaut 1), limit (optionnel, defaut 10), search (optionnel), typeVehicule (optionnel), statut (optionnel)
 * Valeur de retour : objet avec data (tableau de vehicules) et pagination (infos de pagination)
 */
exports.getVehicules = async (req, res) => {
    try {
        const entrepriseId = req.user.entreprise;

        // Base de requete : isolation par entreprise + masquage des vehicules archives.
        // Le champ actif: false permet de faire un soft delete : les vehicules supprimes ne sont plus affiches
        // mais restent dans la base pour l'historique. J'aurais pu faire un vrai delete, mais le soft delete est plus sur.
        let filtres = { entreprise: entrepriseId, actif: true };

        // Les filtres arrivent en query string (pratique pour brancher des filtres front simples).
        // J'ai choisi cette approche plutot que des routes separees (ex: /api/vehicules/disponible)
        // car c'est plus flexible et permet de combiner plusieurs filtres.
        const { search, typeVehicule, statut } = req.query;

        // Recherche souple (insensible a la casse) sur les champs les plus utilises en exploitation.
        // L'operateur $regex avec l'option 'i' permet une recherche partielle et insensible a la casse.
        // J'ai limite la recherche a 3 champs pour eviter de surcharger la base si le parc est grand.
        // CORRECTION SÉCURITÉ : Échappement des caractères spéciaux et validation de la chaîne de recherche.
        // Avant : L'entrée utilisateur était directement utilisée dans $regex sans validation.
        // Risque : Un attaquant pourrait injecter des patterns regex malveillants (ex: ".*.*.*.*") pour provoquer
        // une attaque ReDoS (Regular Expression Denial of Service) et surcharger le serveur.
        // Maintenant : On échappe les caractères spéciaux regex et on limite la longueur de la chaîne de recherche.
        if (search) {
            // Validation de la longueur pour éviter les chaînes trop longues
            if (search.length > 100) {
                return res.status(400).json({ message: 'La recherche ne peut pas dépasser 100 caractères.' });
            }

            // Échappement des caractères spéciaux regex pour éviter l'injection de patterns malveillants
            const searchEscape = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            filtres.$or = [
                { immatriculation: { $regex: searchEscape, $options: 'i' } },
                { marque: { $regex: searchEscape, $options: 'i' } },
                { modele: { $regex: searchEscape, $options: 'i' } }
            ];
        }

        // Filtre exact pour rester compatible avec les enums du schema.
        // Pour typeVehicule et statut, j'utilise une egalite stricte car ce sont des enums definis dans le schema.
        if (typeVehicule) {
            filtres.typeVehicule = typeVehicule;
        }

        // Meme logique pour le statut, utile pour les onglets "disponible / maintenance / panne".
        if (statut) {
            filtres.statut = statut;
        }

        // Garde-fous pagination : evite les pages negatives et les limites trop grandes.
        // C'est important pour eviter qu'un utilisateur malveillant ne demande une page -1 ou une limite de 1M,
        // ce qui pourrait surcharger le serveur. J'ai mis une limite max de 100 vehicules par page.
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        // Promise.all permet d'avoir la liste + le total en parallele (plus propre pour l'UX front).
        // C'est plus performant que de faire les deux requetes sequentiellement, car MongoDB peut les traiter en parallele.
        // J'aurais pu utiliser une aggregation pour faire les deux en une seule requete, mais Promise.all est plus lisible.
        const [vehicules, totalVehicules] = await Promise.all([
            Vehicule.find(filtres)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            
            Vehicule.countDocuments(filtres)
        ]);

        res.status(200).json({
            pagination: {
                totalItems: totalVehicules,
                totalPages: Math.ceil(totalVehicules / limit),
                currentPage: page,
                itemsPerPage: limit
            },
            data: vehicules
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Detail d'un vehicule.

/**
 * Recupere les details d'un vehicule specifique par son ID.
 * Role : afficher toutes les informations d'un vehicule pour consultation ou modification.
 * Parametres : id (dans l'URL)
 * Valeur de retour : l'objet vehicule complet
 */
exports.getVehiculeById = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        const vehicule = await Vehicule.findById(id);

        // Double verification : existence + appartenance a la bonne entreprise.
        // C'est crucial pour la securite multi-tenant : on ne veut pas qu'une entreprise puisse voir
        // les vehicules d'une autre entreprise meme si elle connait l'ID.
        // J'utilise toString() pour comparer les ObjectId car ce sont des objets et pas des chaines directes.
        if (!vehicule || vehicule.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Véhicule introuvable ou accès non autorisé.' });
        }

        res.status(200).json(vehicule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Modification d'un vehicule.

/**
 * Modifie un vehicule existant.
 * Role : permettre la mise a jour des informations d'un vehicule.
 * Parametres : id (dans l'URL), champs a modifier (dans le body)
 * Valeur de retour : l'objet vehicule modifie
 */
exports.modifierVehicule = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        // On controle d'abord la propriete du document avant toute modification.
        // C'est une verification de securite importante pour eviter qu'un utilisateur ne modifie
        // un vehicule qui ne lui appartient pas. J'aurais pu utiliser findOneAndUpdate avec filtre,
        // mais la verification explicite est plus lisible et permet de renvoyer un message d'erreur clair.
        let vehicule = await Vehicule.findById(id);

        if (!vehicule || vehicule.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Véhicule introuvable ou accès non autorisé.' });
        }

        // Normalisation pour eviter les doublons visuels du style ab-123 vs AB-123.
        // Je fais la meme normalisation que dans la creation (majuscules + trim) pour la coherence.
        // J'aurais pu verifier si l'immatriculation existe deja apres modification, mais pour l'instant
        // je laisse le schema Mongoose gerer ça avec l'index unique.
        if (req.body.immatriculation) {
        req.body.immatriculation = req.body.immatriculation.toUpperCase().trim();
        }

        // CORRECTION SÉCURITÉ : Filtrage des champs autorisés pour empêcher la modification de champs sensibles.
        // Avant : req.body était passé directement à findByIdAndUpdate, permettant à un utilisateur malveillant
        // de modifier des champs critiques comme 'entreprise', 'actif', ou tout autre champ non prévu.
        // Risque : Un utilisateur pourrait se donner accès à des véhicules d'une autre entreprise en modifiant le champ 'entreprise'.
        // Maintenant : On extrait uniquement les champs autorisés de manière explicite (whitelist statique)
        // pour éviter toute injection de propriété distante (remote property injection).
        const donneesValides = {
            ...(req.body.immatriculation !== undefined && { immatriculation: req.body.immatriculation }),
            ...(req.body.marque !== undefined && { marque: req.body.marque }),
            ...(req.body.modele !== undefined && { modele: req.body.modele }),
            ...(req.body.typeVehicule !== undefined && { typeVehicule: req.body.typeVehicule }),
            ...(req.body.kilometrage !== undefined && { kilometrage: req.body.kilometrage }),
            ...(req.body.ptac !== undefined && { ptac: req.body.ptac }),
            ...(req.body.carburant !== undefined && { carburant: req.body.carburant }),
            ...(req.body.statut !== undefined && { statut: req.body.statut })
        };

        // runValidators est important ici : sinon certains updates contournent les validations Mongoose.
        // Par defaut, Mongoose ne valide pas les champs lors d'un update, ce qui pourrait permettre
        // d'inserer des donnees invalides. J'active cette option pour garantir la coherence des donnees.
        vehicule = await Vehicule.findByIdAndUpdate(id, donneesValides, {
        new: true,
        runValidators: true
        });

        res.status(200).json(vehicule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Suppression logique : on archive le vehicule au lieu de le supprimer physiquement.
// C'est un choix metier important pour la conservation des donnees historiques.

/**
 * Archive un vehicule (soft delete) au lieu de le supprimer definitivement.
 * Role : permettre la suppression d'un vehicule tout en gardant l'historique.
 * Parametres : id (dans l'URL)
 * Valeur de retour : message de confirmation
 */
exports.supprimerVehicule = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepriseId = req.user.entreprise;

        const vehicule = await Vehicule.findById(id);

        if (!vehicule || vehicule.entreprise.toString() !== entrepriseId.toString()) {
        return res.status(404).json({ message: 'Véhicule introuvable ou accès non autorisé.' });
        }

        // Choix metier : soft delete pour garder l'historique des affectations et des stats.
        // Si on supprimait physiquement le vehicule, on perdrait l'historique de ses affectations,
        // ce qui rendrait les statistiques incoherentes. Le soft delete permet de garder ces donnees.
        // J'aurais pu ajouter un champ dateSuppression pour savoir quand le vehicule a ete archive,
        // mais pour l'instant le champ actif suffit.
        vehicule.actif = false; 
        
        // On ne touche pas au statut technique pour ne pas brouiller les donnees historiques.
        // Le statut (disponible, en_course, maintenance, en_panne) reste tel quel pour que l'historique
        // des affectations reste coherent. Seul le champ actif change pour masquer le vehicule dans les listes.
        await vehicule.save();

        res.status(200).json({ message: 'Véhicule archivé avec succès.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};