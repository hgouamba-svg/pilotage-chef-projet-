import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import { signToken } from "./_auth.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USERS_KEY = "users";
const FOURTEEN_DAYS = 1000 * 60 * 60 * 24 * 14;

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

    const users = (await redis.get(USERS_KEY)) || [];
    const user = users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase()
    );
    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

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
