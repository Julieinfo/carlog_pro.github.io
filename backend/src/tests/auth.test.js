const request = require('supertest');
const mongoose = require('mongoose');

// Import de l'application Express a tester.
// J'importe app.js et pas server.js pour eviter de demarrer le serveur HTTP reel.
// C'est important pour les tests : on veut tester l'application sans la couche reseau.
const app = require('../app');

// Import des modeles pour pouvoir verifier les donnees dans la base apres les tests.
const User = require('../models/User');
const Entreprise = require('../models/Entreprise');

// Import de la fonction de connexion a la base pour les tests.
const connectDB = require('../config/db');

// Hook beforeAll : s'execute une seule fois avant tous les tests.
// J'utilise ça pour initialiser l'environnement de test et connecter a la base.
beforeAll(async () => {
    // On force l'environnement a 'test' pour utiliser une base de donnees de test.
    // C'est crucial pour ne pas polluer la base de donnees de developpement ou de production.
    process.env.NODE_ENV = 'test';
    await connectDB();
});

// Hook afterAll : s'execute une seule fois apres tous les tests.
// J'utilise ça pour nettoyer la base de donnees et fermer la connexion.
afterAll(async () => {
    // Nettoyage rigoureux : on supprime l'utilisateur ET l'entreprise crees pour le test.
    // C'est important pour laisser la base propre pour les futurs runs de tests.
    // J'utilise deleteMany avec des criteres precis pour ne supprimer que les donnees de test.
    await User.deleteMany({ email: 'jean.dupont@example.com' });
    await Entreprise.deleteMany({ siret: '12345678901235' });
    // Fermeture propre de la connexion MongoDB pour eviter les fuites de ressources.
    await mongoose.connection.close();
});

// Suite de tests pour l'endpoint d'inscription.
// describe permet de grouper les tests logiquement et d'avoir des sorties plus claires.
describe('POST /api/auth/inscription', () => {
    
    // Test 1 : Le chemin ideal avec toutes les donnees requises par le modele.
    // Ce test verifie que l'inscription fonctionne correctement quand tout est OK.
    it('devrait creer un nouvel utilisateur et son entreprise', async () => {
        // supertest permet de simuler une requete HTTP vers l'application Express.
        // C'est plus simple que de faire de vraies requetes HTTP avec curl ou Postman.
        const res = await request(app)
            .post('/api/auth/inscription')
            .send({
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                motDePasse: 'SuperPassword123!',
                nomEntreprise: 'Transports Dupont',
                siret: '12345678901235',
                emailProfessionnel: 'contact@dupont.fr',
                telephoneEntreprise: '0102030405',
                adresse: {
                    rue: '12 Rue des Camions',
                    codePostal: '75001',
                    ville: 'Paris',
                    pays: 'France'
                }
            });

        // Verification du code de statut HTTP.
        // 201 Created est le code standard pour une creation reussie.
        expect(res.statusCode).toBe(201);
        
        // Verification que la reponse contient un token JWT.
        // C'est important car le frontend a besoin du token pour connecter l'utilisateur automatiquement.
        expect(res.body).toHaveProperty('token');
        
        // Verification directe dans MongoDB pour s'assurer que les donnees sont bien stockees.
        // J'ai ajoute cette verification pour tester la persistence des donnees, pas seulement la reponse HTTP.
        const userInDb = await User.findOne({ email: 'jean.dupont@example.com' });
        expect(userInDb).toBeTruthy(); // L'utilisateur doit exister dans la base
        expect(userInDb.motDePasse).not.toBe('SuperPassword123!'); // Hachage OK : le mot de passe ne doit pas etre en clair
    });

    // Test 2 : La gestion des conflits (Doublon).
    // Ce test verifie que le systeme rejette correctement les doublons d'email.
    it('devrait rejeter l\'inscription si l\'email existe deja', async () => {
        const res = await request(app)
            .post('/api/auth/inscription')
            .send({
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com', // Doublon detecte ici (meme email que le test 1)
                motDePasse: 'AnotherPassword123!',
                nomEntreprise: 'Autre Entreprise',
                siret: '98765432100000',
                emailProfessionnel: 'contact@autre.fr',
                telephoneEntreprise: '0600000000',
                adresse: {
                    rue: '1 Avenue du Dev',
                    codePostal: '64000',
                    ville: 'Pau',
                    pays: 'France'
                }
            });

        // On s'attend a un 400 Bad Request car l'email existe deja.
        // J'aurais pu aussi verifier le message d'erreur, mais le code de statut suffit pour l'instant.
        expect(res.statusCode).toBe(400); 
    });
});