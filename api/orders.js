const crypto = require("crypto");
const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");

function getOrders() {
  if (!globalThis.__otvOrders) globalThis.__otvOrders = [];
  return globalThis.__otvOrders;
}

function getDatabase() {
  if (!process.env.CONVEX_URL) return null;
  return new ConvexHttpClient(process.env.CONVEX_URL);
}

function validAdminSession(value) {
  if (!process.env.ADMIN_PASSWORD || !value) return false;
  const [encoded, received] = String(value).split(".");
  if (!encoded || !received) return false;
  let payload;
  try { payload = Buffer.from(encoded, "base64url").toString("utf8"); } catch { return false; }
  const timestamp = Number(payload);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > 12 * 60 * 60 * 1000 || Date.now() < timestamp) return false;
  const expected = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD).update(payload).digest("hex");
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function requireAdmin(req, res) {
  if (!validAdminSession(req.headers["x-admin-session"])) {
    res.status(401).json({ error: "Admin authentication required." });
    return false;
  }
  return true;
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

async function sendOrderConfirmation(order) {
  if (!process.env.RESEND_API_KEY) {
    return { error: "Email confirmation is not configured. Add RESEND_API_KEY in Vercel project settings." };
  }

  const lines = order.items.map((item) => `<li>${escapeHtml(item.name)} × ${item.quantity} — ${item.total.toLocaleString("ru-RU")} ₽</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ORDER_FROM_EMAIL || "onboarding@resend.dev",
      to: [order.customer.email],
      subject: `Заказ ${order.orderId} принят`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Спасибо за заказ</h2><p>Ваш заказ <strong>${escapeHtml(order.orderId)}</strong> получен и отправлен на проверку команде.</p><ul>${lines}</ul><p><strong>Итого: ${order.total.toLocaleString("ru-RU")} ₽</strong></p><p>Мы напишем на этот Gmail после одобрения заказа.</p></div>`,
    }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    return { error: details.message || "Не удалось отправить подтверждение на этот Gmail." };
  }
  return { ok: true };
}

function validOrderTotals(items, total) {
  if (!Number.isFinite(Number(total)) || Number(total) <= 0) return false;
  return items.every((item) => Number.isInteger(item.quantity) && item.quantity > 0 && Number.isFinite(Number(item.unitPrice)) && Number(item.unitPrice) >= 0 && Math.round(Number(item.total) * 100) === Math.round(Number(item.unitPrice) * item.quantity * 100))
    && Math.round(items.reduce((sum, item) => sum + Number(item.total), 0) * 100) === Math.round(Number(total) * 100);
}

async function validCatalogOrder(database, items) {
  const products = await database.query(anyApi.catalog.list, {});
  if (!products.length) return false;
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  return items.every((item) => {
    const product = productBySlug.get(item.id);
    if (!product || Number(item.unitPrice) !== Number(product.price) || item.name !== product.name) return false;
    if (item.size && !product.sizes.includes(item.size)) return false;
    if (item.colour && !product.variants.some((variant) => variant.name === item.colour)) return false;
    return true;
  });
}

module.exports = async function handler(req, res) {
  const database = getDatabase();

  if (req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    if (!database) return res.status(200).json({ orders: getOrders(), persistence: "memory" });
    try {
      return res.status(200).json({ orders: await database.query(anyApi.orders.list, {}), persistence: "convex" });
    } catch (error) {
      console.error("Convex order query failed", error);
      return res.status(503).json({ error: "Order database is unavailable." });
    }
  }
  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const { orderId, status } = req.body || {};
    if (database) {
      try {
        const order = await database.mutation(anyApi.orders.updateStatus, { orderId, status: status || "pending_approval" });
        if (!order) return res.status(404).json({ error: "Order not found." });
        return res.status(200).json({ ok: true, order });
      } catch (error) {
        console.error("Convex order update failed", error);
        return res.status(503).json({ error: "Order database is unavailable." });
      }
    }
    const order = getOrders().find((item) => item.orderId === orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    order.status = status || order.status;
    return res.status(200).json({ ok: true, order, persistence: "memory" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Only GET and POST are allowed." });

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return res.status(400).json({ error: "Cart is empty." });
  const email = String(order.customer?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(email)) return res.status(400).json({ error: "Use a valid Gmail address." });
  if (!validOrderTotals(items, order.total)) return res.status(400).json({ error: "Order totals are invalid." });
  if (database) {
    try {
      if (!(await validCatalogOrder(database, items))) return res.status(400).json({ error: "One or more products are no longer available at that price." });
    } catch (error) {
      console.error("Catalog validation failed", error);
      return res.status(503).json({ error: "Product database is unavailable." });
    }
  }

  const savedOrder = {
    ...order,
    customer: { ...(order.customer || {}), email },
    orderId: `OTV-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending_approval",
  };
  if (database) {
    try {
      await database.mutation(anyApi.orders.create, savedOrder);
    } catch (error) {
      console.error("Convex order creation failed", error);
      return res.status(503).json({ error: "Order database is unavailable." });
    }
  } else {
    getOrders().unshift(savedOrder);
  }
  const confirmation = await sendOrderConfirmation(savedOrder);

  return res.status(200).json({
    ok: true,
    message: "Заявка сохранена. Мы скоро свяжемся с вами.",
    orderId: savedOrder.orderId,
    emailWarning: confirmation.error || null,
    persistence: database ? "convex" : "memory",
  });
};
