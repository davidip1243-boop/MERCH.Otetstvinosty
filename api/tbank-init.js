const crypto = require("crypto");

function token(params) {
  const values = { ...params, Password: process.env.TBANK_PASSWORD };
  return crypto.createHash("sha256").update(Object.keys(values).sort().map((key) => values[key]).join("")).digest("hex");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });
  const { orderId, total, customer, items } = req.body || {};
  if (!orderId || !total || !customer?.email || !Array.isArray(items) || !items.length) return res.status(400).json({ error: "Payment data is incomplete." });
  if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) return res.status(503).json({ error: "T‑Банк пока не подключён: добавьте TBANK_TERMINAL_KEY и TBANK_PASSWORD в Vercel." });

  const payload = {
    TerminalKey: process.env.TBANK_TERMINAL_KEY,
    Amount: Math.round(Number(total) * 100),
    OrderId: String(orderId),
    Description: "Заказ orthodox-merch-shop",
    NotificationURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/api/tbank-notification`,
    SuccessURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/cart/?payment=success`,
    FailURL: `${process.env.SITE_URL || "https://orthodox-merch-shop.vercel.app"}/cart/?payment=failed`,
    DATA: { Email: customer.email, Phone: customer.phone || "" },
    Receipt: { Email: customer.email, Taxation: process.env.TBANK_TAXATION || "usn_income", Items: items.map((item) => ({ Name: item.name, Price: Math.round(Number(item.unitPrice) * 100), Quantity: item.quantity, Amount: Math.round(Number(item.total) * 100), Tax: "none" })) },
  };
  payload.Token = token(payload);
  const response = await fetch("https://securepay.tinkoff.ru/v2/Init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.Success) return res.status(502).json({ error: result.Message || result.Details || "T‑Банк не принял платёж." });
  return res.status(200).json({ ok: true, paymentUrl: result.PaymentURL, paymentId: result.PaymentId });
};
