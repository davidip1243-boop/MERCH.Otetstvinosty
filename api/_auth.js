const crypto = require("crypto");
const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");

const ADMIN_EMAIL = "davidip1243@gmail.com";
const database = () => process.env.CONVEX_URL ? new ConvexHttpClient(process.env.CONVEX_URL) : null;
const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "missing-auth-secret";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") };
}
function verifyPassword(password, hash, salt) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function createSession(user) {
  const payload = JSON.stringify({ email: user.email, role: user.role, iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${crypto.createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
function getSession(value) {
  if (!value) return null;
  const [encoded, received] = String(value).split(".");
  if (!encoded || !received) return null;
  let payload;
  try { payload = Buffer.from(encoded, "base64url").toString("utf8"); } catch { return null; }
  let data;
  try { data = JSON.parse(payload); } catch { return null; }
  if (!data.iat || Date.now() - data.iat > 12 * 60 * 60 * 1000 || Date.now() < data.iat) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  return data;
}
module.exports = { ADMIN_EMAIL, database, hashPassword, verifyPassword, createSession, getSession };
