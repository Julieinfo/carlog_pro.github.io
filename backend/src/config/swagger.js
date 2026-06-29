// swagger-jsdoc permet de generer la specification OpenAPI a partir de commentaires JSDoc dans le code.
// C'est pratique car on documente l'API directement dans les fichiers de routes, au plus pres du code.
const swaggerJsdoc = require('swagger-jsdoc');

// swagger-ui-express fournit l'interface graphique pour visualiser et tester la documentation.
const swaggerUi = require('swagger-ui-express');

// Configuration de Swagger : on definit ici les infos generales de l'API et comment trouver les commentaires JSDoc.
// J'ai choisi OpenAPI 3.0.0 car c'est la version la plus recente et la plus complete.
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'CarLog Pro API',
        version: '1.0.0',
        description: 'API de gestion de flotte automobile SaaS',
        },
        // URL du serveur : en dev c'est localhost:5000, mais en prod il faudrait mettre l'URL de production.
        // J'aurais pu utiliser plusieurs serveurs (dev, staging, prod), mais pour l'instant un seul suffit.
        servers: [{ url: 'http://localhost:5000' }],
        components: {
        // Definition du schema d'authentification : on utilise des JWT Bearer tokens.
        // Ca permet a Swagger d'ajouter un bouton "Authorize" dans l'interface pour tester les routes protegees.
        securitySchemes: {
            bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            },
        },
        },
        // On applique securite bearerAuth par defaut a toutes les routes.
        // Pour les routes publiques (comme login), on peut override avec @swager.ignore dans les commentaires JSDoc.
        security: [{ bearerAuth: [] }],
    },
    // Swagger va scanner tous les fichiers de routes pour trouver les commentaires JSDoc.
    // J'ai utilise un pattern glob pour cibler tous les fichiers routes/*.js
    apis: ['./src/routes/*.js'],
};

// Generation de la specification OpenAPI a partir des options et des commentaires JSDoc.
const specs = swaggerJsdoc(options);

// Export des deux elements necessaires dans app.js : swaggerUi pour le middleware, specs pour la documentation.
module.exports = { swaggerUi, specs };