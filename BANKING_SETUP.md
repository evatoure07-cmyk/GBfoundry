# GB Foundry — Import bancaire Discord

Un module d'import bancaire est disponible dans `discord-bank-bot.js` et `bank-parser.js`. Il lit les messages **ENTRÉE D'ARGENT** / **SORTIE D'ARGENT** publiés par Jessica, contrôle la cohérence entre montant et soldes, puis crée une transaction à catégoriser dans la table privée `account_transactions` du projet Supabase GB Foundry. Les identifiants Discord des messages empêchent les doubles insertions.

## Configuration sur un service Node privé et permanent

Installer les dépendances avec `npm install`, puis définir les variables d'environnement **sur le serveur uniquement** :

- `DISCORD_BOT_TOKEN` : jeton du bot Discord, à garder secret
- `DISCORD_BANK_CHANNEL_ID` : identifiant du salon contenant les messages bancaires
- `DISCORD_BANK_AUTHOR_ID` : identifiant du bot Jessica (fortement recommandé)
- `SUPABASE_URL` : URL du projet Supabase GB Foundry
- `SUPABASE_SERVICE_ROLE_KEY` : clé privée Supabase, **ne jamais publier dans le navigateur ou GitHub**

Lancer le processus avec `npm run start:discord`. Activer les intents **Message Content** et autoriser le bot à lire le salon bancaire.

Le site web et le bot doivent être déployés séparément : le service web actuel lance `npm start`, pas le bot. Une instance permanente est nécessaire pour recevoir les nouveaux messages.

## Limitations actuelles

Le bot n'est **pas encore déployé ni connecté au salon**. L'interface de comptabilité de la tablette n'est pas encore reliée à la table privée. Les comptes de démonstration du site utilisent encore le stockage local et ne doivent pas servir à exposer des transactions financières réelles. Une authentification serveur avec autorisations CEO/COO/assistant/RH devra être mise en place avant l'affichage du grand livre sur la tablette.

Les messages bancaires plus anciens ne sont pas importés automatiquement ; il faudra prévoir une reprise historique contrôlée. Aucune clé secrète n'est présente dans le dépôt.
