module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is allowed." });
  }

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];

  if (!items.length) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  return res.status(200).json({
    ok: true,
    message: "Заявка сохранена. Мы скоро свяжемся с вами.",
    orderId: `OTV-${Date.now()}`
  });
};
