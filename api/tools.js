import { Redis } from "@upstash/redis";
import { getAuth } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "tools-config";

function normalize(raw) {
  if (!raw) return null;
  // Ancien format (avant l'ajout de la boîte à outils Commerce) : un tableau = les
  // outils DMT seuls. On le convertit pour ne rien perdre.
  if (Array.isArray(raw)) return { dmt: raw, commerce: null };
  return raw;
}

export default async function handler(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (req.method === "GET") {
      const data = normalize(await redis.get(KEY));
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      if (auth.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { tools } = body || {};
      if (!tools || typeof tools !== "object" || Array.isArray(tools)) {
        return res.status(400).json({ error: "Format d'outils invalide (objet { dmt, commerce } attendu)" });
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
