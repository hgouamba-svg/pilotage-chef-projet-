import { kv } from "@vercel/kv";

const KEY = "paa-history";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = (await kv.get(KEY)) || [];
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      await kv.set(KEY, body);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
