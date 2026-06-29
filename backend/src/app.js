// Point d'entree principal de l'application Express.
// J'ai choisi de centraliser ici tous les middlewares globaux et les routes pour que server.js reste simple.
// C'est une pratique courante, meme si j'aurais pu aussi mettre les middlewares dans un fichier a part.
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const affectationRoutes = require('./routes/affectationRoutes');
const vehiculeRoutes = require('./routes/vehiculeRoutes');
const alerteRoutes = require('./routes/alerteRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { swaggerUi, specs } = require('./config/swagger');

// Creation de l'instance Express : c'est cette app qu'on va exporter et utiliser dans server.js
const app = express();

// CORS est indispensable pour autoriser les requetes depuis le frontend.
// En dev local, le front et le back sont sur des ports differents (3000 et 5000), donc sans ça, le navigateur bloquerait les requetes.
// J'ai mis la configuration par defaut, mais en prod on devrait restreindre les origines autorisees.
app.use(cors());

// Ce middleware parse automatiquement le JSON du corps des requetes.
// Sans lui, req.body serait toujours undefined et on ne pourrait pas recuperer les donnees envoyees par le client.
// J'ai hesite a mettre une limite de taille, mais pour l'instant la config par defaut suffit.
app.use(express.json());

// Enregistrement des routes : chaque routeur est monte sur un prefixe specifique.
// Ca permet d'organiser l'API de maniere logique : /api/auth pour l'auth, /api/vehicules pour les vehicules, etc.
// J'aurais pu faire un fichier index.js qui regroupe toutes les routes, mais je trouve plus lisible de les declarer ici explicitement.
app.use('/api/auth', authRoutes);
app.use('/api/affectations', affectationRoutes);
app.use('/api/vehicules', vehiculeRoutes);
app.use('/api/alertes', alerteRoutes);
app.use('/api/stats', statsRoutes);

// Swagger UI : genere une interface graphique pour la documentation API.
// C'est super pratique pour tester les endpoints sans avoir a utiliser Postman ou cURL.
// La documentation est generee automatiquement a partir des commentaires JSDoc dans les fichiers de routes.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Route de sante (health check) : permet de verifier rapidement que l'API est en ligne.
// C'est une bonne pratique, surtout pour le monitoring en prod.
// J'ai mis un message simple, mais on pourrait aussi retourner des infos sur la version ou le statut de la DB.
app.get('/', (req, res) => {
    res.json({ message: "Bienvenue sur l'API de CarLog Pro !" });
});

// Export de l'application configuree pour pouvoir l'utiliser dans server.js et dans les tests.
module.exports = app;