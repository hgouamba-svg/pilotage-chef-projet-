import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import { getAuth, applyCors } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USERS_KEY = "users";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const users = (await redis.get(USERS_KEY)) || [];

    if (req.method === "GET") {
      const auth = getAuth(req);
      if (!auth || auth.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }
      const safe = users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        equipe: u.equipe,
        displayName: u.displayName,
      }));
      return res.status(200).json(safe);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { username, password, role, equipe, displayName } = body || {};

      if (!username || !password || password.length < 6) {
        return res
          .status(400)
          .json({ error: "Identifiant requis, mot de passe de 6 caractères minimum" });
      }

      // Le tout premier compte créé (base vide) devient automatiquement admin,
      // sans authentification requise — c'est le seul moyen de démarrer.
      // Une fois qu'il existe au moins un utilisateur, toute création exige un token admin.
      const bootstrap = users.length === 0;
      if (!bootstrap) {
        const auth = getAuth(req);
        if (!auth || auth.role !== "admin") {
          return res.status(403).json({ error: "Accès réservé aux administrateurs" });
        }
      }

      if (users.find((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
        return res.status(409).json({ error: "Cet identifiant existe déjà" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        id: uid(),
        username,
        passwordHash,
        role: bootstrap ? "admin" : role === "admin" ? "admin" : "superviseur",
        equipe: equipe || null,
        displayName: displayName || username,
      };
      const next = [...users, newUser];
      await redis.set(USERS_KEY, next);
      return res.status(200).json({ ok: true, bootstrap });
    }

    if (req.method === "PATCH") {
      const auth = getAuth(req);
      if (!auth || auth.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, newPassword } = body || {};
      if (!id || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Nouveau mot de passe de 6 caractères minimum" });
      }
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }
      users[idx] = { ...users[idx], passwordHash: await bcrypt.hash(newPassword, 10) };
      await redis.set(USERS_KEY, users);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const auth = getAuth(req);
      if (!auth || auth.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id } = body || {};
      if (id === auth.sub) {
        return res.status(400).json({ error: "Impossible de supprimer votre propre compte" });
      }
      const next = users.filter((u) => u.id !== id);
      await redis.set(USERS_KEY, next);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
