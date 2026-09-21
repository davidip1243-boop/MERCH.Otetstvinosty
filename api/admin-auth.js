const { anyApi } = require("convex/server");
const { database, verifyPassword, createSession } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const db = database();
  if (!db) return res.status(503).json({ error: "Account database is not configured." });
  const user = await db.query(anyApi.auth.getByEmail, { email }).catch(() => null);
  if (!user || user.role !== "admin" || !verifyPassword(password, user.passwordHash, user.passwordSalt)) return res.status(401).json({ error: "Incorrect admin Gmail or password." });
  await db.mutation(anyApi.auth.markLogin, { id: user._id });
  return res.status(200).json({ ok: true, session: createSession(user), user: { email: user.email, role: user.role } });
};
