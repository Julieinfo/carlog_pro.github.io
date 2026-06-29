// Chargement des variables d'environnement : indispensable pour acceder aux secrets (MONGO_URI, JWT_SECRET, etc.)
// Je le fais au tout debut pour que toutes les dependances puissent utiliser process.env
require('dotenv').config();

// Import de l'application Express configuree dans app.js
const app = require('./app');

// Import de la fonction de connexion a la base de donnees
const connectDB = require('./config/db');

// Definition du port : on utilise la variable d'environnement PORT si elle existe, sinon 5000 par defaut.
// C'est flexible comme ça : en dev on peut laisser 5000, en prod on peut utiliser le port defini par l'hebergeur.
const PORT = process.env.PORT || 5000;

// IMPORTANT : on connecte a MongoDB AVANT de demarrer le serveur.
// Si on faisait l'inverse, l'API pourrait recevoir des requetes alors que la base n'est pas prete,
// ce qui provoquerait des erreurs. J'ai utilise .then() pour garantir l'ordre d'execution.
// J'aurais pu aussi utiliser async/await, mais cette version avec Promise me semble plus lisible ici.
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
});