const crypto = require("crypto");
const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");

function token(params) {
  const values = Object.fromEntries(Object.entries({ ...params, Password: process.env.TBANK_PASSWORD }).filter(([, value]) => value !== null && typeof value !== "object"));
  return crypto.createHash("sha256").update(Object.keys(values).sort().map((key) => String(values[key])).join("")).digest("hex");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "Payment data is incomplete." });
  if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) return res.status(503).json({ error: "T‑Банк пока не подключён: добавьте TBANK_TERMINAL_KEY и TBANK_PASSWORD в Vercel." });
  if (!process.env.CONVEX_URL) return res.status(503).json({ error: "База заказов пока не подключена." });

  let order;
  try {
    const database = new ConvexHttpClient(process.env.CONVEX_URL);
    order = await database.query(anyApi.orders.getById, { orderId: String(orderId) });
  } catch (error) {
    console.error("Order lookup failed before payment initialization", error);
    return res.status(503).json({ error: "Не удалось проверить заказ в базе данных." });
  }
  if (!order || order.fulfillmentMethod !== "delivery" || !Number.isFinite(Number(order.total)) || Number(order.total) <= 0 || !order.customer?.email || !Array.isArray(order.items) || !order.items.length) return res.status(400).json({ error: "Заказ не готов к оплате." });

  const payload = {
    TerminalKey: process.env.TBANK_TERMINAL_KEY,
    Amount: Math.round(Number(order.total) * 100),
    OrderId: String(orderId),
    Description: "Заказ orthodox-merch-shop",
    NotificationURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/api/tbank-notification`,
    SuccessURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/checkout/?payment=success`,
    FailURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/checkout/?payment=failed`,
    DATA: { Email: order.customer.email, Phone: order.customer.phone || "" },
    Receipt: { Email: order.customer.email, Taxation: process.env.TBANK_TAXATION || "usn_income", Items: order.items.map((item) => ({ Name: item.name, Price: Math.round(Number(item.unitPrice) * 100), Quantity: item.quantity, Amount: Math.round(Number(item.total) * 100), Tax: "none" })) },
  };
  payload.Token = token(payload);
  const response = await fetch("https://securepay.tinkoff.ru/v2/Init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.Success) return res.status(502).json({ error: result.Message || result.Details || "T‑Банк не принял платёж." });
  return res.status(200).json({ ok: true, paymentUrl: result.PaymentURL, paymentId: result.PaymentId });
};
