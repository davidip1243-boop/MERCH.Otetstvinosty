const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Only GET is allowed." });
  if (!process.env.CONVEX_URL) return res.status(503).json({ error: "Product database is not configured." });
  try {
    const database = new ConvexHttpClient(process.env.CONVEX_URL);
    return res.status(200).json({ products: await database.query(anyApi.catalog.list, {}) });
  } catch (error) {
    console.error("Convex product query failed", error);
    return res.status(503).json({ error: "Product database is unavailable." });
  }
};
