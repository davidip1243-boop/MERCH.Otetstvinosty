function getOrders() {
  if (!globalThis.__otvOrders) globalThis.__otvOrders = [];
  return globalThis.__otvOrders;
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

module.exports = async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ orders: getOrders() });
  if (req.method === "PUT") {
    const { orderId, status } = req.body || {};
    const order = getOrders().find((item) => item.orderId === orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    order.status = status || order.status;
    return res.status(200).json({ ok: true, order });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Only GET and POST are allowed." });

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return res.status(400).json({ error: "Cart is empty." });
  const email = String(order.customer?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(email)) return res.status(400).json({ error: "Use a valid Gmail address." });

  const savedOrder = {
    ...order,
    customer: { email },
    orderId: `OTV-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending_approval",
  };
  const confirmation = await sendOrderConfirmation(savedOrder);
  getOrders().unshift(savedOrder);

  return res.status(200).json({
    ok: true,
    message: "Заявка сохранена. Мы скоро свяжемся с вами.",
    orderId: savedOrder.orderId,
    emailWarning: confirmation.error || null,
  });
};
