import { Redis } from "@upstash/redis";
import { getAuth } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "equipes-config";
const VALID_IDS = ["A", "B", "C", "D"];

export default async function handler(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (req.method === "GET") {
      const data = await redis.get(KEY);
      // null si jamais renommé : le client retombe sur les noms par défaut (A/B/C/D).
      return res.status(200).json(data || null);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, label } = body || {};

      if (!VALID_IDS.includes(id)) {
        return res.status(400).json({ error: "Équipe inconnue" });
      }
      if (!label || !label.trim()) {
        return res.status(400).json({ error: "Le nom d'équipe ne peut pas être vide" });
      }

      // Un superviseur ne peut renommer que sa propre équipe. Un administrateur peut
      // renommer n'importe laquelle.
      if (auth.role !== "admin" && auth.equipe !== id) {
        return res.status(403).json({ error: "Tu ne peux renommer que ta propre équipe" });
      }

      const current = (await redis.get(KEY)) || {};
      const next = { ...current, [id]: label.trim().slice(0, 60) };
      await redis.set(KEY, next);
      return res.status(200).json({ ok: true, equipes: next });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
