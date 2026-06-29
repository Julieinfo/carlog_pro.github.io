const mongoose = require('mongoose');

// Schema Mongoose pour les affectations de vehicules a des conducteurs.
// Une affectation represente une mission ou une periode d'utilisation d'un vehicule.

const affectationSchema = new mongoose.Schema(
    {
        // Reference a l'entreprise : indispensable pour l'isolation multi-tenant.
        // Chaque affectation doit etre rattachee a une entreprise pour empecher
        // qu'une entreprise ne voit les affectations d'une autre.
        entreprise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entreprise',
        required: true
        },
        // Reference au vehicule affecte.
        // Le ref permet d'utiliser populate() pour recuperer les details du vehicule.
        vehicule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicule',
        required: true
        },
        // Reference au conducteur (utilisateur) qui utilise le vehicule.
        conducteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        },
        // Date de debut de l'affectation.
        // default: Date.now permet de ne pas avoir a specifier la date a chaque creation.
        dateDebut: {
        type: Date,
        required: true,
        default: Date.now
        },
        // Date de fin de l'affectation (optionnelle car elle est renseignee a la cloture).
        dateFin: {
        type: Date
        },
        // Kilometrage du vehicule au debut de l'affectation.
        // min: 0 empeche les valeurs negatives qui n'ont pas de sens.
        kmDebut: {
        type: Number,
        required: true,
        min: 0
        },
        // Kilometrage du vehicule a la fin de l'affectation.
        kmFin: {
        type: Number,
        min: 0
        },
        // Statut de l'affectation pour le suivi du cycle de vie.
        // enum limite les valeurs possibles a celles definies ici, ce qui evite les erreurs de saisie.
        statut: {
        type: String,
        enum: ['en_cours', 'terminee', 'annulee'],
        default: 'en_cours'
        },
        // Observations libres pour noter des informations complementaires.
        // trim: true supprime les espaces inutiles au debut et a la fin.
        observations: {
        type: String,
        trim: true
        }
    },
    { 
        // timestamps: true ajoute automatiquement les champs createdAt et updatedAt.
        // C'est pratique pour le suivi de quand l'affectation a ete creee et modifiee.
        timestamps: true 
    }
);

// Indexation pour chercher rapidement les affectations actives d'une entreprise.
// L'index compose (entreprise + statut) optimise les requetes du type
// "trouver toutes les affectations en_cours de l'entreprise X".
// Sans index, MongoDB devrait scanner tous les documents, ce qui serait lent sur une grosse base.
affectationSchema.index({ entreprise: 1, statut: 1 });

// Indexation pour l'historique d'un vehicule specifique.
// L'index (vehicule + dateDebut) optimise les requetes du type
// "trouver l'historique des affectations du vehicule Y trie par date".
// Le -1 sur dateDebut signifie un ordre decroissant (les plus recentes d'abord).
affectationSchema.index({ vehicule: 1, dateDebut: -1 });

// Export du modele Mongoose pour pouvoir l'utiliser dans les controleurs.
module.exports = mongoose.model('Affectation', affectationSchema);