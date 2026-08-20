module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("OK");
  const notification = req.body || {};
  const orders = globalThis.__otvOrders || [];
  const order = orders.find((item) => item.orderId === String(notification.OrderId || ""));
  if (order) {
    order.paymentId = notification.PaymentId || order.paymentId;
    order.paymentStatus = notification.Status || order.paymentStatus;
    if (["CONFIRMED", "AUTHORIZED"].includes(notification.Status)) order.status = "paid";
  }
  return res.status(200).send("OK");
};
