import { Redis } from "@upstash/redis";
import { getAuth, applyCors } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "equipes-config";

const SEED_EQUIPES = [
  { id: "A", label: "Équipe A — FO" },
  { id: "B", label: "Équipe B — FO" },
  { id: "C", label: "Équipe C — FO/BO" },
  { id: "D", label: "Équipe D — FO/BO" },
];

function nextId(list) {
  // Génère la lettre suivante (E, F, G...) tant que c'est possible, sinon un id
  // court aléatoire — pas de limite réelle au nombre d'équipes.
  const used = new Set(list.map((e) => e.id));
  for (let code = 65; code <= 90; code += 1) {
    const letter = String.fromCharCode(code);
    if (!used.has(letter)) return letter;
  }
  return "T" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function normalizeEquipes(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    // Ancien format (avant la version "équipes illimitées") : { A: "label", ... }.
    // On le convertit en liste, en conservant les noms déjà personnalisés.
    return SEED_EQUIPES.map((e) => ({ id: e.id, label: raw[e.id] || e.label }));
  }
  return SEED_EQUIPES;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const current = normalizeEquipes(await redis.get(KEY));

    if (req.method === "GET") {
      return res.status(200).json(current);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { action } = body || {};

      if (action === "rename") {
        const { id, label } = body;
        if (!id || !label || !label.trim()) {
          return res.status(400).json({ error: "Nom d'équipe requis" });
        }
        if (auth.role !== "admin" && auth.equipe !== id) {
          return res.status(403).json({ error: "Tu ne peux renommer que ta propre équipe" });
        }
        if (!current.find((e) => e.id === id)) {
          return res.status(404).json({ error: "Équipe introuvable" });
        }
        const next = current.map((e) => (e.id === id ? { ...e, label: label.trim().slice(0, 60) } : e));
        await redis.set(KEY, next);
        return res.status(200).json(next);
      }

      if (action === "add") {
        if (auth.role !== "admin") {
          return res.status(403).json({ error: "Accès réservé aux administrateurs" });
        }
        const { label } = body;
        if (!label || !label.trim()) {
          return res.status(400).json({ error: "Nom d'équipe requis" });
        }
        const id = nextId(current);
        const next = [...current, { id, label: label.trim().slice(0, 60) }];
        await redis.set(KEY, next);
        return res.status(200).json(next);
      }

      if (action === "remove") {
        if (auth.role !== "admin") {
          return res.status(403).json({ error: "Accès réservé aux administrateurs" });
        }
        const { id } = body;
        if (current.length <= 1) {
          return res.status(400).json({ error: "Il doit rester au moins une équipe" });
        }
        const next = current.filter((e) => e.id !== id);
        await redis.set(KEY, next);
        return res.status(200).json(next);
      }

      return res.status(400).json({ error: "Action inconnue (rename / add / remove attendus)" });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
