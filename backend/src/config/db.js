// Mongoose est un ODM (Object Data Modeling) pour MongoDB.
// Il facilite l'interaction avec la base en offrant des schemas et des modeles typees.
const mongoose = require('mongoose');

/**
 * Fonction de connexion a la base de donnees MongoDB.
 * Role : etablir la connexion et gerer les erreurs potentielles.
 * Parametres : aucun (utilise la variable d'environnement MONGO_URI)
 * Valeur de retour : Promise qui se resout quand la connexion est etablie
 */
const connectDB = async () => {
  try {
    // CORRECTION SÉCURITÉ : Vérification de la présence de MONGO_URI avant tentative de connexion.
    // Avant : process.env.MONGO_URI était utilisé directement sans vérification.
    // Risque : Si la variable d'environnement est manquante, l'erreur serait détectée tardivement
    // avec un message d'erreur cryptique de Mongoose, rendant le debug difficile.
    // Maintenant : On vérifie explicitement que MONGO_URI existe et n'est pas vide avant de tenter la connexion.
    if (!process.env.MONGO_URI) {
      throw new Error('La variable d\'environnement MONGO_URI est manquante. Veuillez la définir dans le fichier .env.');
    }

    // Mongoose gere automatiquement le pool de connexions.
    // Une seule connexion ici suffit pour toute l'application, Mongoose se charge de reutiliser les connexions.
    // J'ai hesite a ajouter des options de configuration (comme useNewUrlParser), mais Mongoose les gere par defaut maintenant.
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    // En production, il vaut mieux arreter le processus que de lancer une API "a moitie vivante" sans base de donnees.
    // Sinon, toutes les requetes echoueraient et les utilisateurs verraient des erreurs 500.
    // J'ai choisi process.exit(1) pour indiquer que le processus s'est termine avec une erreur.
    console.error(`Erreur : ${error.message}`);
    process.exit(1);
  }
};

// Export de la fonction pour pouvoir l'utiliser dans server.js
module.exports = connectDB;