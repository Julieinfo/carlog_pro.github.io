const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Ton application Express
const User = require('../models/User');
const Entreprise = require('../models/Entreprise');
const connectDB = require('../config/db');

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
});

afterAll(async () => {
    // Nettoyage rigoureux : on supprime l'utilisateur ET l'entreprise créés pour le test
    await User.deleteMany({ email: 'jean.dupont@example.com' });
    await Entreprise.deleteMany({ siret: '12345678901235' });
    await mongoose.connection.close();
});

describe('POST /api/auth/inscription', () => {
    
    // Test 1 : Le chemin idéal avec toutes les données requises par le modèle
    it('devrait créer un nouvel utilisateur et son entreprise', async () => {
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

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        
        // Vérification directe dans MongoDB
        const userInDb = await User.findOne({ email: 'jean.dupont@example.com' });
        expect(userInDb).toBeTruthy();
        expect(userInDb.motDePasse).not.toBe('SuperPassword123!'); // Hachage OK
    });

    // Test 2 : La gestion des conflits (Doublon)
    it('devrait rejeter l\'inscription si l\'email existe déjà', async () => {
        const res = await request(app)
            .post('/api/auth/inscription')
            .send({
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com', // Doublon détecté ici
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

        expect(res.statusCode).toBe(400); 
    });
});