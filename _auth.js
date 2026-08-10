import crypto from "crypto";

// IMPORTANT : définis la variable d'environnement AUTH_SECRET sur Vercel
// (Settings > Environment Variables) avec une chaîne aléatoire longue.
// Sans elle, un secret par défaut est utilisé — à ne jamais garder en production.
const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me-before-prod";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload) {
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  // comparaison en temps constant
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuth(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return verifyToken(token);
}
