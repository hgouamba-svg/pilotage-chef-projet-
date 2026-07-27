# Assistant Conseillers — déploiement

Petite app React/Vite : génère des PAA orientés solution (DMT + Commerce) à partir d'un
écart et d'une cause diagnostiquée.

## Stockage partagé entre appareils (téléphone, Mac, bureau...)

Les données sont stockées côté serveur via **Vercel KV**, pas dans le navigateur — donc
la même URL affiche les mêmes PAA, peu importe l'appareil ou le navigateur utilisé.

**Étape obligatoire après le premier déploiement** (une seule fois) :

1. Va sur ton projet dans le dashboard Vercel → onglet **Storage**.
2. Clique **Create Database** → choisis **KV** (Redis) → nomme-la (ex. `paa-store`) → **Create**.
3. Sur l'écran suivant, clique **Connect Project** et sélectionne ce projet. Vercel ajoute
   automatiquement les variables d'environnement nécessaires (`KV_REST_API_URL`,
   `KV_REST_API_TOKEN`, etc.) — tu n'as rien à copier toi-même.
4. Va dans **Deployments** → les trois points sur le dernier déploiement → **Redeploy**,
   pour que le projet prenne en compte les nouvelles variables.

Une fois cette étape faite, l'app synchronise automatiquement partout.

**Tant que ce n'est pas fait**, l'app affiche un bandeau d'avertissement et retombe sur un
stockage local au navigateur (comme avant) — rien n'est perdu, mais ça ne se synchronise
pas encore entre appareils.

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
