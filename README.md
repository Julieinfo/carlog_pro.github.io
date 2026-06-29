# 🚗 CarLog Pro - Landing Page SaaS

> Application SaaS fullstack de gestion de flotte automobile

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Status](https://img.shields.io/badge/Status-En%20cours-orange?style=for-the-badge)

---

## 📱 Aperçu

CarLog Pro est une plateforme SaaS de gestion de parc automobile destinée aux entreprises et aux particuliers. Le projet évolue d'un site vitrine statique vers une application fullstack complète avec API REST, authentification JWT et base de données MongoDB.

> ⚠️ Projet personnel de formation - aucune vente, aucun service réel.

---

## ✨ Frontend - Landing Page

- **Hero** - Accroche, dashboard mockup animé et statistiques clés
- **Fonctionnalités** - 6 features présentées en grille
- **Tarifs** - 3 plans fictifs (Starter / Pro / Entreprise)
- **Témoignages** - Avis clients fictifs
- **CTA** - Formulaire d'inscription fictif
- **Footer** - Navigation et liens

## 🎨 Design

- Dark mode · Rouge & noir
- Typographie : Bebas Neue + DM Sans + JetBrains Mono
- Animations : révélation au scroll, barres animées, transitions hover
- Responsive mobile

---

## 🔧 Backend — API REST

- **Authentification** - Inscription, connexion, JWT (7 jours), route `/me`
- **Middleware protect** - Vérification JWT sur toutes les routes protégées
- **Middleware authorize** - Contrôle d'accès par rôle (admin, fleet_manager, conducteur...)
- **CRUD Véhicules** - Gestion de la flotte avec isolation multi-tenant
- **CRUD Alertes** - Maintenance, sécurité, administratif, géofencing
- **CRUD Affectations** - Suivi conducteur/véhicule avec historique
- **Validation** - express-validator sur toutes les routes
- **Base de données** - MongoDB Atlas avec Mongoose

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | HTML5 · CSS3 · JavaScript vanilla |
| Backend | Node.js · Express |
| Base de données | MongoDB Atlas · Mongoose |
| Authentification | JWT · bcryptjs |
| Validation | express-validator |
| Frontend (à venir) | React.js · Vite |
| Paiement (à venir) | Stripe |
| Déploiement (à venir) | Render · Vercel |

---

## 🔗 Lien

🌐 [Voir la démo frontend](https://julieinfo.github.io/carlog_pro/frontend/)

---

## 👩‍💻 Auteure

**Julie De Castro** - Développeuse Web  
[GitHub](https://github.com/julieinfo) · [Portfolio](https://julieinfo.github.io)
