const crypto = require("crypto");

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD).update(value).digest("hex");
}

function createSession() {
  const payload = `${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });

  const password = String(req.body?.password || "");
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return res.status(503).json({ error: "Admin password is not configured." });
  if (password !== expectedPassword) return res.status(401).json({ error: "Incorrect password." });

  return res.status(200).json({ ok: true, session: createSession() });
};
