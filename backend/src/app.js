// 1. IMPORTATION DES PACKAGES
const express = require('express'); // Le framework pour créer le serveur et gérer les routes
const cors = require('cors');       // Sécurité pour autoriser ton frontend à requêter ton backend
require('dotenv').config();         // Charge le contenu de ton fichier .env dans 'process.env'
const authRoutes = require('./routes/authRoutes');
const affectationRoutes = require('./routes/affectationRoutes');
const vehiculeRoutes = require('./routes/vehiculeRoutes');
const alerteRoutes = require('./routes/alerteRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { swaggerUi, specs } = require('./config/swagger'); // Importation de la configuration Swagger

const app = express();

// 2. LES MIDDLEWARES (Les filtres de contrôle)
app.use(cors());          // Permet au site (port 3000 ou autre) de parler à l'API (port 5000)
app.use(express.json());  // Permet à ton serveur de lire le format JSON quand on lui envoie des données (ex: un formulaire)
app.use('/api/auth', authRoutes);
app.use('/api/affectations', affectationRoutes);
app.use('/api/vehicules', vehiculeRoutes);
app.use('/api/alertes', alerteRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 3. LES ROUTES (Les aiguillages)
// Quand quelqu'un visite l'adresse racine "http://localhost:5000/", on lui répond un message de bienvenue
app.get('/', (req, res) => {
    res.json({ message: "Bienvenue sur l'API de CarLog Pro !" });
});

module.exports = app;