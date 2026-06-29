const mongoose = require("mongoose");

// Schema Mongoose pour les vehicules du parc automobile.
// Ce modele contient toutes les informations techniques et operationnelles d'un vehicule.

const vehiculeSchema = new mongoose.Schema({
    // Reference a l'entreprise proprietaire du vehicule.
    // Indispensable pour l'isolation multi-tenant.
    entreprise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entreprise",
        required: true
    },
    // Immatriculation du vehicule (plaque d'immatriculation).
    // Retrait du unique: true global ici car l'unicite est par entreprise (voir l'index compose plus bas).
    // uppercase: true convertit automatiquement en majuscules pour la coherence.
    immatriculation: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    // Marque du constructeur (ex: Renault, Volvo, Mercedes).
    marque: {
        type: String,
        required: true,
        trim: true
    },
    // Modele du vehicule (ex: Clio, FH, Actros).
    modele: {
        type: String,
        required: true,
        trim: true
    },
    // Annee de fabrication du vehicule.
    // min: 1900 et max: annee courante + 1 evitent les valeurs absurdes.
    annee: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    // Type de vehicule pour la categorisation (utile pour les filtres et stats).
    typeVehicule: {
        type: String,
        enum: ["porteur", "tracteur", "remorque", "utilitaire", "voiture"],
        required: true
    },
    // PTAC (Poids Total Autorise en Charge) : poids maximum du vehicule charge.
    // C'est une information legale importante pour la conformite.
    ptac: {
        type: Number,
        required: true,
        min: 0
    },
    // Type de carburant du vehicule.
    // default: "diesel" car c'est le plus courant dans le transport de marchandises.
    carburant: {
        type: String,
        enum: ["diesel", "gnv", "electrique", "hydrogene", "essence", "hybride"],
        default: "diesel"
    },
    // Kilometrage actuel du vehicule.
    // default: 0 pour les nouveaux vehicules.
    kilometrage: {
        type: Number,
        default: 0,
        min: 0
    },
    // Date de mise en service du vehicule (pour le suivi de l'age du parc).
    dateMiseEnService: {
        type: Date
    },
    // Statut operationnel actuel du vehicule.
    // enum limite les valeurs possibles pour eviter les erreurs de saisie.
    statut: {
        type: String,
        enum: ["disponible", "en_course", "en_maintenance", "en_panne"],
        default: "disponible"
    },
    // Conducteur habituel du vehicule (optionnel).
    // Permet d'assigner un conducteur principal pour simplifier les affectations recurrentes.
    conducteurPrincipal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    // Soft delete : permet d'archiver un vehicule sans le supprimer physiquement.
    // C'est important pour conserver l'historique des affectations et des statistiques.
    actif: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    }
);

// Index compose pour l'unicite par entreprise uniquement.
// L'unicite est (entreprise + immatriculation) : deux entreprises peuvent avoir la meme plaque,
// mais une entreprise ne peut pas avoir deux vehicules avec la meme plaque.
// C'est plus flexible qu'une unicite globale sur l'immatriculation.
vehiculeSchema.index({ entreprise: 1, immatriculation: 1 }, { unique: true });

// Export du modele Mongoose pour pouvoir l'utiliser dans les controleurs.
module.exports = mongoose.model("Vehicule", vehiculeSchema);