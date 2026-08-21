module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });

  const password = String(req.body?.password || "");
  const expectedPassword = process.env.ADMIN_PASSWORD || "Merch-otv2017";
  if (password !== expectedPassword) return res.status(401).json({ error: "Incorrect password." });

  return res.status(200).json({ ok: true, session: "admin" });
};
