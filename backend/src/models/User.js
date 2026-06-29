const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema Mongoose pour les utilisateurs du systeme.
// Ce modele gere a la fois les comptes particuliers et les comptes entreprise.

const userSchema = new mongoose.Schema({
    // Informations d'identite de base.
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    // Email unique pour l'identification et la connexion.
    // lowercase: true assure la coherence (pas de doublons Test@Example.com vs test@example.com).
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telephone: { type: String, trim: true },
    // Mot de passe qui sera hash avant d'etre stocke (voir le pre('save') hook).
    // minlength: 8 impose une longueur minimale pour la securite.
    motDePasse: { type: String, required: true, minlength: 8 },

    // Ce champ simplifie la suite : on sait vite si on est dans un usage perso ou entreprise.
    // C'est utile pour la logique metier (ex: les comptes entreprise ont des roles, les particuliers non).
    typeCompte: { 
        type: String, 
        enum: ['particulier', 'entreprise'], 
        required: true 
    },

    // Les roles ne servent reellement que pour l'entreprise, mais on garde une seule collection User.
    // Cela evite d'avoir a gerer deux collections separees (Particulier et UserEntreprise).
    // default: null permet d'avoir des utilisateurs sans role (ex: particuliers).
    role: { 
        type: String, 
        enum: ['admin', 'fleet_manager', 'conducteur', 'mecanicien', 'comptable'],
        default: null
    },

    // Astuce apprise : required peut etre conditionnel via une fonction.
    // Ici, on force l'entreprise uniquement pour les comptes "entreprise".
    // C'est elegant car ça evite d'avoir des champs entreprise null pour les particuliers.
    entreprise: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Entreprise',
        required: function() { return this.typeCompte === 'entreprise'; }
    },

    // Soft disable du compte sans suppression (conformite RGPD).
    actif: { type: Boolean, default: true },
    }, { timestamps: true });

// Hook pre('save') : s'execute avant chaque sauvegarde du document.
// On hash uniquement si le mot de passe a change (sinon double hash au moindre save).
// isModified('motDePasse') verifie si le champ a ete modifie depuis la derniere sauvegarde.
// C'est important car si on ne faisait pas cette verification, le mot de passe serait re-hash
// a chaque modification d'un autre champ, ce qui le rendrait invalide.
userSchema.pre('save', async function () {
    if (!this.isModified('motDePasse')) return;
    // bcrypt.hash avec un facteur de 12 (salt rounds) pour un bon compromis securite/performances.
    // Plus le facteur est eleve, plus le hash est securise mais plus c'est lent a calculer.
    this.motDePasse = await bcrypt.hash(this.motDePasse, 12);
});

// Methode attachee au schema pour centraliser la comparaison bcrypt au meme endroit.
// Cela permet d'appeler user.verifierMotDePasse(motDePasse) au lieu d'utiliser bcrypt.compare directement.
// C'est plus propre et plus facile a maintenir car la logique de verification est centralisee.
userSchema.methods.verifierMotDePasse = async function (candidat) {
    return bcrypt.compare(candidat, this.motDePasse);
};

// Export du modele Mongoose pour pouvoir l'utiliser dans les controleurs.
module.exports = mongoose.model('User', userSchema);