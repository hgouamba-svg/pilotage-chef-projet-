# Déploiement intranet — Assistant Conseillers

Ce document s'adresse à l'IT de 3 Media. Il décrit ce qui est nécessaire pour faire
tourner l'application sur une machine interne plutôt que sur Vercel.

## Ce qui change, ce qui ne change pas

- **Ne change pas** : les données restent hébergées chez Upstash (Redis managé),
  pas sur votre serveur. Ce choix évite d'avoir à installer et sauvegarder une base
  de données en plus du reste — le serveur interne n'a besoin que d'un accès sortant
  HTTPS (port 443) vers `*.upstash.io`. Si vous préférez héberger la base également
  en interne, c'est possible mais demande un travail supplémentaire (remplacer
  `@upstash/redis` par un client Redis classique) — dites-le si c'est votre cas.
- **Change** : l'application n'est plus servie par Vercel, mais par un petit serveur
  Node.js (`server.js`) que vous faites tourner sur votre machine.

## Prérequis techniques

- **Node.js 18 ou supérieur** installé sur le serveur.
- **Accès réseau sortant HTTPS (443)** vers `*.upstash.io` (stockage des données).
- Un moyen de garder le processus actif en continu : **PM2**, un service **systemd**,
  ou équivalent (le serveur ne se relance pas tout seul après un crash ou un reboot
  sans ça).
- Un **reverse proxy** (nginx, IIS, ou autre) si vous voulez servir l'app sur le port
  443 avec un certificat interne, plutôt que sur un port arbitraire type `3000`.

## Variables d'environnement à définir sur le serveur

Les mêmes que sur la version cloud, à définir comme variables d'environnement système
(pas dans un fichier commité) :

| Variable | Description |
|---|---|
| `KV_REST_API_URL` | URL Upstash Redis (voir dashboard Upstash) |
| `KV_REST_API_TOKEN` | Token Upstash Redis |
| `AUTH_SECRET` | Chaîne aléatoire longue, pour signer les sessions |
| `PORT` | Port d'écoute (optionnel, `3000` par défaut) |

## Étapes de déploiement

```bash
# 1. Récupérer le code (dépôt Git fourni séparément)
git clone <url-du-depot>
cd assistant-conseillers

# 2. Installer les dépendances
npm install

# 3. Construire le frontend
npm run build

# 4. Définir les variables d'environnement (exemple avec un fichier .env chargé par votre outil de process management, ou export direct)
export KV_REST_API_URL="..."
export KV_REST_API_TOKEN="..."
export AUTH_SECRET="..."

# 5. Démarrer le serveur (à faire gérer par PM2/systemd en production, pas lancé à la main)
npm run server
```

L'application est alors accessible sur `http://<adresse-serveur>:3000` (ou via votre
reverse proxy si configuré).

## Ce qui reste à votre charge dans la durée

- Redémarrer le service après chaque mise à jour du code (`git pull` + `npm install`
  + `npm run build` + redémarrage du process).
- Surveiller que le processus reste actif.
- Mettre à jour Node.js périodiquement (failles de sécurité).
- Sauvegarder `AUTH_SECRET` quelque part en sécurité — si cette valeur est perdue et
  recréée, tous les utilisateurs connectés seront déconnectés (pas de perte de
  données, juste une reconnexion à refaire).

## Ce qui n'est PAS couvert par ce document

- L'authentification SSO via Microsoft 365 — n'est pas mise en place, et n'a pas
  besoin de l'être avec un déploiement intranet, puisque le réseau interne fait déjà
  office de première barrière d'accès. Le système actuel (identifiant/mot de passe
  propre à l'application) reste utilisé tel quel.
