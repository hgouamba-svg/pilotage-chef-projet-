# Assistant Conseillers — déploiement

Petite app React/Vite : génère des PAA orientés solution (DMT, commerce, disciplinaire,
fidélisation) à partir d'un écart et d'une cause diagnostiquée. Accès protégé par
identifiant/mot de passe, avec des équipes cloisonnées (un superviseur ne voit que sa
propre équipe, un administrateur voit tout).

## Nouveau : authentification (à faire avant tout déploiement à plusieurs personnes)

**1. Ajoute une variable d'environnement secrète** — indispensable, sinon un secret par
défaut faible est utilisé :
- Vercel → Settings → Environment Variables → ajoute `AUTH_SECRET` avec une valeur
  aléatoire longue (30+ caractères, ex. générée avec `openssl rand -hex 32` en local, ou
  n'importe quel générateur de mot de passe long).
- Redeploy après l'avoir ajoutée.

**2. Crée le premier compte (administrateur)** — une fois l'app en ligne :
- Le tout premier compte créé devient automatiquement administrateur, sans qu'aucune
  connexion ne soit nécessaire au préalable (la base d'utilisateurs est vide).
- Ouvre l'app, tu tombes sur l'écran de connexion. Pour créer ce premier compte, il faut
  passer par une requête directe (l'interface de création de compte n'apparaît qu'une
  fois connecté en tant qu'admin) :

```bash
curl -X POST https://TON-URL.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"choisis-un-mot-de-passe-solide","displayName":"Ton nom"}'
```

- Une fois ce premier compte créé, connecte-toi normalement sur l'app avec ces
  identifiants. Le bouton **"Gérer les utilisateurs"** apparaît dans l'en-tête (réservé
  aux administrateurs) pour créer les comptes superviseurs de chaque équipe.

**3. Équipes** — quatre équipes sont prédéfinies dans le code (`EQUIPES` en haut de
`src/App.jsx`) : A et B (Front Office), C et D (FO/BO). Renomme-les si les équipes
réelles ont d'autres noms, avant de créer les comptes superviseurs.

**Sécurité — ce qui est fait, ce qui ne l'est pas encore :**
- Mots de passe hashés (bcrypt), jamais stockés en clair.
- Sessions par jeton signé, valables 14 jours.
- Un superviseur ne peut ni voir ni écraser les données d'une autre équipe (vérifié
  côté serveur, pas seulement caché côté écran).
- Pas encore fait : réinitialisation de mot de passe en libre-service (un admin doit
  supprimer puis recréer un compte pour changer son mot de passe), historique des
  connexions, verrouillage après tentatives échouées. À ajouter si l'outil devient un
  vrai outil d'entreprise à plus grande échelle.

## Stockage partagé entre appareils (téléphone, Mac, bureau...)

Les données sont stockées côté serveur via **Upstash Redis** (le remplaçant officiel de
l'ancien "Vercel KV", que Vercel a retiré) — pas dans le navigateur. Même URL, mêmes PAA,
peu importe l'appareil.

**Étape obligatoire après le premier déploiement** (une seule fois) :

1. Va sur ton projet dans le dashboard Vercel → onglet **Storage**.
2. Clique **Create Database** / **Browse Storage**.
3. Dans la liste **Marketplace Database Providers**, choisis **Upstash** (pas "Redis" tout
   court, ni "Neon" — spécifiquement Upstash, qui expose l'API REST dont l'app a besoin).
4. Choisis **Redis** comme produit Upstash, donne un nom à la base (ex. `paa-store`), garde
   les réglages par défaut → valide la création.
5. Vercel te propose de connecter la base à un projet : sélectionne **pilotage-chef-projet**
   (ou le nom de ton projet) → confirme. Les variables d'environnement sont injectées
   automatiquement, rien à copier toi-même.
6. Va dans **Deployments** → les trois points sur le dernier déploiement → **Redeploy**,
   pour que le projet prenne en compte les nouvelles variables.

Une fois cette étape faite, recharge l'app : le bandeau jaune d'avertissement disparaît et
la synchronisation fonctionne partout.

**Tant que ce n'est pas fait**, l'app affiche ce bandeau et retombe sur un stockage local
au navigateur (comme avant) — rien n'est perdu, mais ça ne se synchronise pas encore entre
appareils.

## Important — je n'ai pas pu tester le build moi-même

Mon environnement n'a pas d'accès réseau, donc je n'ai pas pu lancer `npm install` /
`npm run build` pour vérifier que tout compile sans erreur. Le code suit les
conventions standard Vite + React + Tailwind + Vercel KV, mais fais un test en local ou
laisse Vercel faire le premier build avant de considérer que c'est bon — regarde les logs
de build en cas d'échec, l'erreur sera explicite (dépendance, syntaxe, etc.).

## Déploiement — le plus simple, sans rien installer

1. Va sur [github.com/new](https://github.com/new), crée un dépôt (ex. `assistant-conseillers`), reste en "Public" ou "Private" selon ton besoin.
2. Sur la page du dépôt vide, clique **"uploading an existing file"**, et glisse-dépose tout le contenu de ce dossier (garde la structure : `src/` et `api/` doivent rester des sous-dossiers).
3. Valide le commit.
4. Va sur [vercel.com/new](https://vercel.com/new), connecte ton compte GitHub, choisis ce dépôt.
5. Vercel détecte Vite automatiquement (build command `vite build`, output `dist`). Clique **Deploy**.
6. Au bout d'1-2 minutes, ton app est en ligne sur une URL `*.vercel.app`.
7. Fais l'étape "Stockage partagé" ci-dessus pour activer la synchronisation multi-appareils.

## Alternative — en local avec Node.js installé

```bash
npm install
npm run dev        # tester en local sur http://localhost:5173
npm run build       # génère le dossier dist/
npx vercel --prod   # déploie directement (te demande de te connecter la première fois)
```

## Remplacer ton site existant

Si tu veux que ça remplace `assistant-conseillers.vercel.app` plutôt que de créer une
nouvelle URL : dans les Settings du projet Vercel existant, va dans **Git** et connecte
ce nouveau dépôt GitHub à la place de l'ancien (ou pousse ce code dans le dépôt qui est
déjà lié à ce projet Vercel, si tu l'as).
