const { anyApi } = require("convex/server");
const { ADMIN_EMAIL, database, hashPassword, verifyPassword, createSession } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });
  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const mode = body.mode === "signup" ? "signup" : "login";
  if (!/^[^\s@]+@gmail\.com$/.test(email)) return res.status(400).json({ error: "Use a valid Gmail address." });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  const db = database();
  if (!db) return res.status(503).json({ error: "Account database is not configured." });
  try {
    let user = await db.query(anyApi.auth.getByEmail, { email });
    if (mode === "signup") {
      if (user) return res.status(409).json({ error: "An account with this Gmail already exists. Log in instead." });
      const passwordData = hashPassword(password);
      const role = email === ADMIN_EMAIL ? "admin" : "buyer";
      const id = await db.mutation(anyApi.auth.create, { email, ...passwordData, role, name: String(body.name || "").trim() || undefined });
      user = { _id: id, email, role };
    } else {
      if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) return res.status(401).json({ error: "Incorrect Gmail or password." });
      await db.mutation(anyApi.auth.markLogin, { id: user._id });
    }
    return res.status(200).json({ ok: true, session: createSession(user), user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error("Account authentication failed", error);
    return res.status(503).json({ error: "Account database is unavailable." });
  }
};
