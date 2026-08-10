// Serveur pour un déploiement intranet (sur une machine fournie par l'IT), en
// remplacement de Vercel. Réutilise TELS QUELS les mêmes fichiers de route que la
// version cloud (api/*.js) — aucune logique métier dupliquée, donc aucun risque que
// les deux versions divergent avec le temps.
//
// Prérequis sur le serveur : Node.js 18+ installé, accès sortant HTTPS autorisé
// (vers Upstash Redis — les données restent hébergées chez Upstash même en intranet,
// voir README-INTRANET.md pour le détail de ce choix).

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authHandler from "./api/auth.js";
import usersHandler from "./api/users.js";
import paaHandler from "./api/paa.js";
import causesHandler from "./api/causes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Les handlers sont écrits au format Vercel (req, res) => {...}, qui est un
// sur-ensemble compatible du format Express — on les monte directement, sans
// adaptation.
app.all("/api/auth", authHandler);
app.all("/api/users", usersHandler);
app.all("/api/paa", paaHandler);
app.all("/api/causes", causesHandler);

// Sert le build de production du frontend (généré par "npm run build").
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Assistant Conseillers (intranet) en écoute sur le port ${PORT}`);
});
