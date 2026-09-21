const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");
const { getSession } = require("./_auth");

function validAdminSession(value) {
  return getSession(value)?.role === "admin";
}

module.exports = async function handler(req, res) {
  const isAdmin = validAdminSession(req.headers["x-admin-session"]);
  if (req.method !== "GET" && !isAdmin) return res.status(401).json({ error: "Admin authentication required." });
  if (!process.env.CONVEX_URL) return res.status(503).json({ error: "Product database is not configured." });
  try {
    const database = new ConvexHttpClient(process.env.CONVEX_URL);
    if (req.method === "GET") return res.status(200).json({ products: await database.query(isAdmin ? anyApi.catalog.listAll : anyApi.catalog.list, {}) });
    const body = req.body || {};
    if (req.method === "POST" || req.method === "PUT") {
      const product = {
        ...(body.id ? { id: body.id } : {}),
        slug: String(body.slug || "").trim(),
        name: String(body.name || "").trim(),
        category: String(body.category || "tshirts").trim(),
        price: Number(body.price),
        color: String(body.color || "chalk").trim(),
        lead: String(body.lead || "").trim(),
        note: String(body.note || "").trim(),
        details: Array.isArray(body.details) ? body.details.map(String).filter(Boolean) : [],
        active: body.active !== false,
        sizes: Array.isArray(body.sizes) ? body.sizes.map(String).filter(Boolean) : [],
        variants: Array.isArray(body.variants) ? body.variants : [],
      };
      if (!product.slug || !product.name || !Number.isFinite(product.price) || product.price < 0 || !product.variants.length) return res.status(400).json({ error: "Fill in the product name, slug, price, and at least one variant." });
      const id = await database.mutation(anyApi.catalog.upsert, product);
      return res.status(200).json({ ok: true, id });
    }
    if (req.method === "DELETE") {
      if (!body.id) return res.status(400).json({ error: "Product id is required." });
      return res.status(200).json({ ok: true, id: await database.mutation(anyApi.catalog.archive, { id: body.id }) });
    }
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Convex product query failed", error);
    return res.status(503).json({ error: "Product database is unavailable." });
  }
};
