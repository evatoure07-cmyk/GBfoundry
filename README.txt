GB FOUNDRY — PORTAIL PROFESSIONNEL (DÉMONSTRATION)
=================================================

Cette version remplace l'ancien site LTD-like par une interface pleine largeur GB Foundry.

CONNEXIONS
- Administration : direction, RH, responsable commercial, responsable events
- Employé : commerciaux et récolteurs
- Entreprise : comptes partenaires avec commandes et suivi

COMPTES DE TEST (UNIQUEMENT DÉMONSTRATION)
Mot de passe commun : Demo1234!
- ceo.gb (CEO)
- coo.gb (COO)
- silo.sterling (assistant de direction)
- rh.gb (RH)
- camille.martin (commercial)
- noah.laurent (récolteur)
- garage.demo (entreprise partenaire)

FONCTIONNALITÉS DE LA MAQUETTE
- Catalogue provisoire, panier et commandes des partenaires
- Prise en charge des commandes par les commerciaux et validation des livraisons
- Annulation de commande avec motif et confirmation
- Création d'accès partenaires, gestion des employés et réinitialisation de mots de passe temporaires
- Réceptionnaires habilités au paiement et à la réception
- Déclarations de récolte, casiers, validation des quotas, grades et salaires
- Annonces et recrutement avec postes activables/désactivables
- Logo GB Foundry orange et noir

IMPORTANT : DONNÉES LOCALES ET SÉCURITÉ
Ceci est un PROTOTYPE : les données sont stockées dans localStorage, sans synchronisation entre appareils. Les mots de passe, rôles et droits ne sont pas sécurisés côté serveur. Ne pas utiliser pour des comptes réels, ne pas saisir d'informations confidentielles. Les notifications et la création de comptes via Discord ne sont pas encore connectées. Aucun vrai salaire n'est versé et les tarifs, objets et quotas fournis sont fictifs.

Pour une production utilisable par plusieurs membres :
mettre en place une base partagée, une authentification sécurisée, des règles d'accès sur serveur et un bot Discord côté serveur (pas de token ni de mot de passe confidentiel dans le code public).

DÉPLOIEMENT RENDER
Type : Static Site
Build Command : aucune
Publish Directory : .
Branche : main

Fichiers : index.html, app.js, styles.css, logo.png.
