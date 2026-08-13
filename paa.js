import { Redis } from "@upstash/redis";
import { getAuth, applyCors } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "paa-history";

function scopeFor(list, auth) {
  if (auth.role === "admin") return list;
  return list.filter((p) => p.equipe === auth.equipe);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (req.method === "GET") {
      const data = (await redis.get(KEY)) || [];
      return res.status(200).json(scopeFor(data, auth));
    }

    if (req.method === "POST") {
      // IMPORTANT : cette route travaille par action (add/update/remove) sur la liste
      // complète stockée côté serveur, jamais par remplacement du tableau envoyé par le
      // client — un superviseur ne reçoit (et ne renvoie) que sa propre équipe via GET,
      // un remplacement complet écraserait silencieusement les autres équipes.
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { action } = body || {};
      const data = (await redis.get(KEY)) || [];

      if (action === "add") {
        const entry = body.entry;
        if (!entry || !entry.id || !entry.equipe) {
          return res.status(400).json({ error: "Entrée invalide (équipe requise)" });
        }
        if (auth.role !== "admin" && entry.equipe !== auth.equipe) {
          return res.status(403).json({ error: "Vous ne pouvez créer un plan que pour votre équipe" });
        }
        const next = [entry, ...data];
        await redis.set(KEY, next);
        return res.status(200).json({ ok: true });
      }

      if (action === "update") {
        const { id, patch } = body;
        const idx = data.findIndex((p) => p.id === id);
        if (idx === -1) return res.status(404).json({ error: "Introuvable" });
        if (auth.role !== "admin" && data[idx].equipe !== auth.equipe) {
          return res.status(403).json({ error: "Équipe non autorisée" });
        }
        data[idx] = { ...data[idx], ...patch };
        await redis.set(KEY, data);
        return res.status(200).json({ ok: true });
      }

      if (action === "remove") {
        const { id } = body;
        const idx = data.findIndex((p) => p.id === id);
        if (idx === -1) return res.status(404).json({ error: "Introuvable" });
        if (auth.role !== "admin" && data[idx].equipe !== auth.equipe) {
          return res.status(403).json({ error: "Équipe non autorisée" });
        }
        const next = data.filter((p) => p.id !== id);
        await redis.set(KEY, next);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "Action inconnue (add / update / remove attendus)" });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
