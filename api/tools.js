import { Redis } from "@upstash/redis";
import { getAuth } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "dmt-tools-config";

export default async function handler(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (req.method === "GET") {
      const data = await redis.get(KEY);
      // null si jamais configuré : le client retombe alors sur ses valeurs par défaut.
      return res.status(200).json(data || null);
    }

    if (req.method === "POST") {
      if (auth.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { tools } = body || {};
      if (!Array.isArray(tools)) {
        return res.status(400).json({ error: "Format d'outils invalide (tableau attendu)" });
      }
      await redis.set(KEY, tools);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
