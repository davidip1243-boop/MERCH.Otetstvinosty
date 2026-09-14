const crypto = require("crypto");
const { ConvexHttpClient } = require("convex/browser");
const { anyApi } = require("convex/server");

function token(params) {
  const values = Object.fromEntries(Object.entries({ ...params, Password: process.env.TBANK_PASSWORD }).filter(([key, value]) => key !== "Token" && value !== null && typeof value !== "object"));
  return crypto.createHash("sha256").update(Object.keys(values).sort().map((key) => String(values[key])).join("")).digest("hex");
}

function validToken(notification) {
  if (!process.env.TBANK_PASSWORD || !notification.Token) return false;
  const expected = token(notification);
  const received = String(notification.Token).toLowerCase();
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("OK");
  const notification = req.body || {};
  if (!validToken(notification)) return res.status(401).send("Invalid token");
  if (notification.TerminalKey !== process.env.TBANK_TERMINAL_KEY) return res.status(401).send("Invalid terminal");
  const amount = Number(notification.Amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).send("Invalid amount");
  if (process.env.CONVEX_URL) {
    try {
      const database = new ConvexHttpClient(process.env.CONVEX_URL);
      const order = await database.query(anyApi.orders.getById, { orderId: String(notification.OrderId || "") });
      if (!order || Math.round(Number(order.total) * 100) !== Math.round(amount)) return res.status(400).send("Amount mismatch");
      await database.mutation(anyApi.orders.updatePayment, {
        orderId: String(notification.OrderId || ""),
        status: String(notification.Status || "unknown"),
        amount,
        providerPaymentId: notification.PaymentId ? String(notification.PaymentId) : undefined,
        raw: notification,
      });
      return res.status(200).send("OK");
    } catch (error) {
      console.error("Convex payment update failed", error);
      return res.status(503).send("Retry");
    }
  }
  const orders = globalThis.__otvOrders || [];
  const order = orders.find((item) => item.orderId === String(notification.OrderId || ""));
  if (!order || Math.round(Number(order.total) * 100) !== Math.round(amount)) return res.status(400).send("Amount mismatch");
  if (order) {
    order.paymentId = notification.PaymentId || order.paymentId;
    order.paymentStatus = notification.Status || order.paymentStatus;
    if (["CONFIRMED", "AUTHORIZED"].includes(notification.Status)) order.status = "paid";
  }
  return res.status(200).send("OK");
};
