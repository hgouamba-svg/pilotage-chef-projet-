# Assistant Conseillers — déploiement

Petite app React/Vite : génère des PAA orientés solution (DMT + Commerce) à partir d'un
écart et d'une cause diagnostiquée. Les données sont stockées dans le navigateur
(localStorage) — rien n'est envoyé à un serveur.

## Important — je n'ai pas pu tester le build moi-même

Mon environnement n'a pas d'accès réseau, donc je n'ai pas pu lancer `npm install` /
`npm run build` pour vérifier que tout compile sans erreur. Le code suit les
conventions standard Vite + React + Tailwind, mais fais un test en local ou laisse
Vercel faire le premier build avant de considérer que c'est bon — regarde les logs de
build en cas d'échec, l'erreur sera explicite (dépendance, syntaxe, etc.).

## Déploiement — le plus simple, sans rien installer

1. Va sur [github.com/new](https://github.com/new), crée un dépôt (ex. `assistant-conseillers`), reste en "Public" ou "Private" selon ton besoin.
2. Sur la page du dépôt vide, clique **"uploading an existing file"**, et glisse-dépose tout le contenu de ce dossier (garde la structure : `src/` doit rester un sous-dossier).
3. Valide le commit.
4. Va sur [vercel.com/new](https://vercel.com/new), connecte ton compte GitHub, choisis ce dépôt.
5. Vercel détecte Vite automatiquement (build command `vite build`, output `dist`). Clique **Deploy**.
6. Au bout d'1-2 minutes, ton app est en ligne sur une URL `*.vercel.app`.

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
