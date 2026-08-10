import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import { signToken } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USERS_KEY = "users";
const FOURTEEN_DAYS = 1000 * 60 * 60 * 24 * 14;
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_SECONDS = 15 * 60; // 15 minutes

function attemptsKey(username) {
  return `login-attempts:${String(username).toLowerCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { username, password } = body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    const key = attemptsKey(username);
    const attempts = (await redis.get(key)) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      const minutes = ttl > 0 ? Math.ceil(ttl / 60) : 15;
      return res.status(429).json({
        error: `Trop de tentatives échouées. Réessaie dans environ ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      });
    }

    const users = (await redis.get(USERS_KEY)) || [];
    const user = users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase()
    );

    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      const next = attempts + 1;
      await redis.set(key, next, { ex: LOCK_WINDOW_SECONDS });
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Connexion réussie : on efface le compteur d'échecs pour ce compte.
    await redis.del(key);

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      equipe: user.equipe || null,
      displayName: user.displayName || user.username,
      exp: Date.now() + FOURTEEN_DAYS,
    });

    return res.status(200).json({
      token,
      user: {
        username: user.username,
        role: user.role,
        equipe: user.equipe || null,
        displayName: user.displayName || user.username,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
