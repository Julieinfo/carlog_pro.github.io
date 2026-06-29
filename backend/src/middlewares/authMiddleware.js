const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification pour proteger les routes.
 * Role : verifier que l'utilisateur est authentifie avant d'acceder a une route protegee.
 * Parametres : req, res, next (standard middleware Express)
 * Valeur de retour : appelle next() si authentifie, renvoie 401 sinon
 * 
 * Ce middleware doit etre applique a toutes les routes qui necessitent une authentification.
 * Il ajoute l'objet utilisateur (req.user) a la requete pour que les controleurs puissent l'utiliser.
 */
const protect = async (req, res, next) => {
    let token;

    // On lit le header Authorization au format standard "Bearer <token>".
    // C'est le format standard OAuth2/Bearer, utilise par la plupart des API modernes.
    // Astuce que j'ai retenue : garder ce format evite plein de bugs cote front.
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
        // On separe la chaine et on garde uniquement la partie token.
        // split(' ')[1] prend le deuxieme element apres l'espace (ex: "Bearer xyz" -> "xyz").
        token = req.headers.authorization.split(' ')[1];

        // Verification cryptographique du JWT : si la signature n'est pas bonne, on bloque direct.
        // jwt.verify verifie que le token n'a pas ete modifie et qu'il n'est pas expire.
        // Si le secret ne correspond pas ou si le token est expire, une erreur est lancee.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // On recharge l'utilisateur depuis la base pour avoir un contexte fiable dans les controleurs.
        // C'est important car le token ne contient que l'ID, pas les infos a jour de l'utilisateur.
        // select('-motDePasse') exclut le mot de passe de la reponse pour la securite.
        req.user = await User.findById(decoded.id).select('-motDePasse');

        if (!req.user) {
            // Cas rare mais possible : l'utilisateur a ete supprime entre-temps mais le token est encore valide.
            return res.status(401).json({ message: 'Utilisateur introuvable, accès refusé.' });
        }

        // Tout est valide : le controleur suivant peut utiliser req.user en toute confiance.
        // req.user contient maintenant toutes les infos de l'utilisateur (id, nom, email, role, entreprise, etc.).
        next();
        } catch (error) {
            console.error('Erreur validation token:', error.message);
            // On renvoie un message generique pour ne pas aider un attaquant a comprendre ce qui ne va pas.
            return res.status(401).json({ message: 'Token invalide ou expiré, accès non autorisé.' });
        }
    }

    // Aucun token = on refuse. C'est volontaire pour garder les routes privees vraiment privees.
    // J'aurais pu renvoyer un 404 pour masquer l'existence de la route, mais 401 est plus standard.
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, aucun token fourni.' });
    }
};

// Middleware d'autorisation par role, reutilisable sur toutes les routes sensibles.
// C'est un middleware factory : il renvoie un middleware configure avec les roles autorises.

/**
 * Genere un middleware pour verifier que l'utilisateur a un role autorise.
 * Role : controler les droits d'acces en fonction du role de l'utilisateur.
 * Parametres : ...rolesAutorises (liste des roles autorises, ex: 'admin', 'gestionnaire')
 * Valeur de retour : middleware Express qui verifie le role
 * 
 * Usage : router.post('/admin-route', protect, authorize('admin'), controller)
 * J'ai choisi cette approche (currying) pour pouvoir configurer les roles autorises dynamiquement.
 */
const authorize = (...rolesAutorises) => {
    return (req, res, next) => {
        // On applique ici une regle metier simple : seuls certains profils peuvent agir.
        // req.user est disponible grace au middleware protect qui doit etre appele avant celui-ci.
        // J'utilise includes() pour verifier si le role de l'utilisateur est dans la liste des roles autorises.
        if (!rolesAutorises.includes(req.user.role)) {
            // 403 Forbidden : l'utilisateur est authentifie mais n'a pas les droits necessaires.
            // J'inclus le role actuel dans le message pour aider au debug (en prod, on pourrait le retirer).
            return res.status(403).json({ 
                message: `Accès refusé : votre rôle (${req.user.role}) ne vous permet pas d'effectuer cette action.` 
            });
        }
        // Le role est autorise, on passe au middleware ou controleur suivant.
        next();
    };
};

// Export des deux middlewares pour pouvoir les utiliser dans les fichiers de routes.
module.exports = { protect, authorize };