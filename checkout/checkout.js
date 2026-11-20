const draft = JSON.parse(localStorage.getItem("otv-checkout-draft-v1") || "null");
const views = { form: document.querySelector('[data-checkout-view="form"]'), review: document.querySelector('[data-checkout-view="review"]'), result: document.querySelector('[data-checkout-view="result"]') };
const progress = (step) => document.querySelectorAll("[data-progress-step]").forEach((node) => node.classList.toggle("is-active", Number(node.dataset.progressStep) <= step));
const show = (view) => Object.entries(views).forEach(([key, node]) => node.toggleAttribute("hidden", key !== view));
const error = (message = "") => { document.querySelector("[data-checkout-error]").textContent = message; };
const normalizePhone = (value) => { const raw = String(value || "").trim().replace(/[\s()\-]/g, ""); if (/^8\d{10}$/.test(raw)) return `+7${raw.slice(1)}`; if (/^7\d{10}$/.test(raw)) return `+${raw}`; if (/^\+7\d{10}$/.test(raw)) return raw; return ""; };
const validateCustomer = (data) => {
  const errors = [];
  if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(data.name.trim())) errors.push("Введите имя буквами.");
  data.phone = normalizePhone(data.phone); if (!data.phone) errors.push("Введите российский номер телефона.");
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(data.email) || data.email.includes("..")) errors.push("Введите действующий Gmail.");
  const address = data.address.trim(); if (address.length < 10 || !/\p{L}{2,}/u.test(address) || !/\b\d{1,5}[а-яa-z]?\b/iu.test(address)) errors.push("Укажите город, улицу и номер дома.");
  return errors;
};

if (!draft?.items?.length) { error("Корзина пуста. Вернитесь в магазин и добавьте товар."); document.querySelector('[data-checkout-view="form"]')?.setAttribute("hidden", ""); }
if (new URLSearchParams(location.search).get("payment") === "success") { show("result"); progress(3); localStorage.removeItem("otv-checkout-draft-v1"); }
if (new URLSearchParams(location.search).get("payment") === "failed") { show("result"); progress(3); document.querySelector("[data-result-icon]").textContent = "×"; document.querySelector("[data-result-kicker]").textContent = "Оплата не прошла"; document.querySelector("[data-result-title]").textContent = "Попробуйте ещё раз."; document.querySelector("[data-result-copy]").textContent = "Т‑Банк не подтвердил платёж. Проверьте данные карты или выберите другой способ оплаты."; }
document.querySelector("[data-delivery-details]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const validationErrors = validateCustomer(data);
  if (validationErrors.length) { error(validationErrors.join(" ")); return; }
  localStorage.setItem("otv-checkout-customer-v1", JSON.stringify(data));
  document.querySelector("[data-review-name]").textContent = data.name;
  document.querySelector("[data-review-email]").textContent = data.email;
  document.querySelector("[data-review-address]").textContent = data.address;
  document.querySelector("[data-review-total]").textContent = `${Number(draft.total || 0).toLocaleString("ru-RU")} ₽`;
  show("review"); progress(2); error("");
});
document.querySelector("[data-back-button]")?.addEventListener("click", () => { show("form"); progress(1); });
document.querySelector("[data-pay-button]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget; const customer = JSON.parse(localStorage.getItem("otv-checkout-customer-v1") || "{}");
  button.disabled = true; button.querySelector("span").textContent = "…"; error("");
  try {
    const orderResponse = await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ customer, items:draft.items, total:draft.total, fulfillmentMethod:"delivery", paymentStatus:"pending_payment" }) });
    const order = await orderResponse.json(); if (!orderResponse.ok) throw new Error(order.error || "Не удалось создать заказ.");
    const paymentResponse = await fetch("/api/tbank-init", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...draft, ...customer, customer, orderId:order.orderId }) });
    const payment = await paymentResponse.json(); if (!paymentResponse.ok || !payment.paymentUrl) throw new Error(payment.error || "Не удалось открыть оплату Т‑Банка.");
    window.location.href = payment.paymentUrl;
  } catch (requestError) { error(requestError.message || "Не удалось открыть оплату. Попробуйте ещё раз."); button.disabled = false; button.querySelector("span").textContent = "→"; }
});
