const mongoose = require('mongoose');

// Schema Mongoose pour les alertes systeme.
// Les alertes permettent de signaler des evenements ou problemes sur les vehicules.

const alerteSchema = new mongoose.Schema(
    {
        // Indispensable pour le multi-tenant : isole les alertes par entreprise.
        // Chaque alerte doit etre rattachee a une entreprise pour empecher
        // qu'une entreprise ne voit les alertes d'une autre.
        entreprise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entreprise',
        required: true
        },
        // Optionnel au niveau DB pour permettre des alertes globales ou administratives.
        // Une alerte peut etre liee a un vehicule specifique ou etre generale (ex: "maintenance du garage").
        vehicule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicule',
        required: false
        },
        // Optionnel au niveau DB (ex: alerte comportement ou smartphone conducteur).
        // Permet de cibler un conducteur specifique si l'alerte le concerne.
        conducteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
        },
        // Titre court de l'alerte pour affichage dans les listes.
        titre: {
        type: String,
        required: true,
        trim: true
        },
        // Description detaillee de l'alerte pour donner plus de contexte.
        description: {
        type: String,
        trim: true
        },
        // Categorisation de l'alerte pour faciliter le filtrage et la priorisation.
        // enum limite les types possibles a ceux definis ici.
        typeAlerte: {
        type: String,
        enum: ['maintenance', 'carburant', 'securite', 'geo-fencing', 'administratif'],
        required: true
        },
        // Niveau d'urgence pour prioriser le traitement des alertes.
        // default: 'medium' evite d'avoir a specifier l'urgence a chaque creation.
        niveauUrgence: {
        type: String,
        enum: ['low', 'medium', 'critical'],
        default: 'medium'
        },
        // Statut de l'alerte dans le cycle de vie (active -> en_cours -> resolue).
        // enum permet de garantir que seuls ces statuts sont utilises.
        statut: {
        type: String,
        enum: ['active', 'en_cours', 'resolue', 'acquittee'],
        default: 'active'
        },
        // Reference a l'utilisateur qui a resolu l'alerte (pour le suivi).
        resoluePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        },
        // Date a laquelle l'alerte a ete resolue (pour le suivi et les stats).
        dateResolution: {
        type: Date
        }
    },
    { 
        // Genere automatiquement les champs createdAt (date de declenchement) et updatedAt.
        // createdAt est particulierement utile ici car il correspond a la date de declenchement de l'alerte.
        timestamps: true 
    }
);

// Index compose pour optimiser les requetes du tableau de bord.
// L'index (entreprise + statut) permet de recuperer rapidement les alertes actives d'une entreprise.
// C'est crucial pour les performances car le dashboard affiche souvent les alertes en premier.
alerteSchema.index({ entreprise: 1, statut: 1 });

// Export du modele Mongoose pour pouvoir l'utiliser dans les controleurs.
module.exports = mongoose.model('Alerte', alerteSchema);