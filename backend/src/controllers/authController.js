const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Entreprise = require('../models/Entreprise');

/**
 * Genere un token JWT pour un utilisateur.
 * Role : creer un jeton d'authentification qui sera utilise par le client pour les requetes suivantes.
 * Parametres : id (l'ID de l'utilisateur a encoder dans le token)
 * Valeur de retour : string (le token JWT signe)
 * 
 * Note : Le token dure 7 jours pour eviter une reconnexion trop frequente tout en restant raisonnable cote securite.
 * J'aurais pu choisir une duree plus courte (ex: 1h) pour plus de securite, mais 7 jours est un bon compromis UX/securite pour ce type d'application.
 */
const genererToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Inscription SaaS : creation de l'entreprise + creation du premier admin dans la meme action.
// C'est une operation complexe car elle touche deux collections differentes (User et Entreprise).

/**
 * Inscrit un nouvel utilisateur et cree son entreprise en meme temps.
 * Role : permettre la creation d'un compte SaaS avec l'entreprise associee.
 * Parametres : infos utilisateur (nom, prenom, email, motDePasse, telephone) + infos entreprise (nomEntreprise, siret, emailProfessionnel, telephoneEntreprise, adresse)
 * Valeur de retour : token JWT + infos utilisateur + entrepriseId
 */
exports.inscription = async (req, res) => {
    try {
        // On recupere les infos admin et les infos entreprise depuis le formulaire d'inscription.
        // J'ai choisi de tout recevoir dans un seul body plutot que de faire deux appels separe,
        // car c'est plus simple pour le frontend et ça garantit la coherence des donnees.
        const { 
        nom, 
        prenom, 
        email, 
        motDePasse, 
        telephone,
        nomEntreprise, 
        siret, 
        emailProfessionnel, 
        telephoneEntreprise,
        adresse // attendu : { rue, codePostal, ville, pays }
        } = req.body;
        
        // On bloque les doublons email pour garder un identifiant de connexion unique.
        // C'est important pour eviter que deux utilisateurs aient le meme email, ce qui causerait des confusions.
        if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un utilisateur.' });
        }
        
        // Le SIRET sert de garde-fou contre la creation de la meme entreprise plusieurs fois.
        // En France, le SIRET est unique par entreprise, donc c'est un bon moyen d'eviter les doublons.
        // J'aurais pu aussi verifier par nom d'entreprise, mais le SIRET est plus fiable.
        if (await Entreprise.findOne({ siret })) {
        return res.status(400).json({ message: 'Une entreprise avec ce SIRET est déjà enregistrée.' });
        }
        
        // On cree l'entreprise avant l'utilisateur pour recuperer son _id et faire le lien proprement.
        // L'ordre est important : l'utilisateur a besoin de l'ID de l'entreprise pour etre rattache.
        // Si on faisait l'inverse, on devrait faire un update supplementaire sur l'utilisateur.
        const entreprise = await Entreprise.create({ 
        nom: nomEntreprise,
        siret,
        emailProfessionnel,
        telephone: telephoneEntreprise,
        adresse
        });
        
        // Le premier compte est force en admin entreprise : c'est le compte "owner" initial.
        // C'est une mesure de securite importante pour eviter que le premier utilisateur n'ait pas les droits.
        // On force aussi typeCompte a 'entreprise' pour differencier des autres types de comptes (ex: conducteurs).
        const user = await User.create({ 
        nom, 
        prenom,
        email, 
        motDePasse, 
        telephone,
        entreprise: entreprise._id,
        role: 'admin',             // Sécurité : Forcé pour le créateur du compte SaaS
        typeCompte: 'entreprise'   // Sécurité : Forcé pour le compte principal
        });
        
        // On renvoie le token des l'inscription pour connecter l'utilisateur automatiquement.
        // C'est une bonne pratique UX : l'utilisateur n'a pas a se reconnecter apres s'etre inscrit.
        res.status(201).json({
        token: genererToken(user._id),
        user: { 
            id: user._id, 
            nom: user.nom, 
            prenom: user.prenom,
            email: user.email, 
            role: user.role,
            entrepriseId: entreprise._id
        },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Connexion : on verifie identifiants puis on regenere un JWT.
// C'est le point d'entree principal pour les utilisateurs deja inscrits.

/**
 * Connecte un utilisateur existant avec ses identifiants.
 * Role : verifier les identifiants et generer un nouveau token JWT.
 * Parametres : email, motDePasse
 * Valeur de retour : token JWT + infos utilisateur (sans le mot de passe)
 */
exports.connexion = async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        
        // motDePasse est cache dans le schema (select: false), donc on l'ajoute explicitement juste pour cette verification.
        // C'est une bonne pratique de securite : par defaut, on ne renvoie jamais le mot de passe dans les requetes.
        const user = await User.findOne({ email }).select('+motDePasse');
        
        // Message volontairement vague pour ne pas aider un attaquant a deviner ce qui est faux.
        // Si on disait "Email inexistant" ou "Mot de passe incorrect", un attaquant pourrait enumerer les comptes.
        // J'ai choisi de ne pas differencier les cas pour eviter ce type d'attaque.
        if (!user || !(await user.verifierMotDePasse(motDePasse))) {
        return res.status(401).json({ message: 'Identifiants invalides.' });
        }
        
        // On renvoie un nouveau token a chaque connexion.
        // J'aurais pu implementer un systeme de refresh token, mais pour l'instant un simple token suffit.
        res.json({
        token: genererToken(user._id),
        user: { 
            id: user._id, 
            nom: user.nom, 
            prenom: user.prenom,
            email: user.email, 
            role: user.role,
            entrepriseId: user.entreprise
        },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// GET /api/auth/me (Profil utilisateur connecte)
// ==========================================

/**
 * Recupere le profil de l'utilisateur connecte.
 * Role : permettre au frontend d'afficher les infos de l'utilisateur connecte.
 * Parametres : aucun (utilise req.user depuis le middleware protect)
 * Valeur de retour : objet avec les infos de l'utilisateur (sans le mot de passe)
 */
exports.getProfil = async (req, res) => {
    try {
        // req.user est disponible grace au middleware protect qui a decode le JWT.
        // J'ai choisi de renvoyer req.user directement plutot que de refaire une requete a la base,
        // car les infos dans le token sont suffisantes pour afficher le profil.
        // Si on avait besoin de donnees a jour (ex: role modifie), il faudrait refaire une requete.
        
        // J'exclus explicitement le mot de passe de la reponse pour la securite.
        // Meme si le middleware le fait deja, c'est une double securite.
        const { motDePasse, ...userSansMotDePasse } = req.user.toObject();
        
        res.status(200).json(userSansMotDePasse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};