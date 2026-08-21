const money = (n) => `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
const ordersStorageKey = "otv-orders-v1";
const adminSessionKey = "otv-admin-session";
const statusLabels = { pending_approval: "На проверке", approved: "Одобрен", rejected: "Отклонен" };
let orders = JSON.parse(localStorage.getItem(ordersStorageKey) || "[]");

const loginOverlay = document.querySelector("#admin-login");
const loginForm = document.querySelector("#admin-login-form");
const loginError = document.querySelector("#login-error");
if (sessionStorage.getItem(adminSessionKey) === "ok") loginOverlay.classList.add("is-hidden");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const response = await fetch("/api/admin-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: document.querySelector("#admin-password").value }) });
  if (!response.ok) { loginError.textContent = "Неверный пароль."; return; }
  sessionStorage.setItem(adminSessionKey, "ok");
  loginOverlay.classList.add("is-hidden");
});

function orderRow(order) {
  const item = order.items?.[0] || {};
  const more = (order.items?.length || 1) > 1 ? ` + ещё ${order.items.length - 1}` : "";
  return `<tr><td><strong class="order-id">${order.orderId}</strong><small>${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</small></td><td><strong>${order.customer?.email || "Gmail не указан"}</strong></td><td><strong>${item.name || "Товар"}${more}</strong><small>${item.quantity || 1} шт. ${item.size ? `· размер ${item.size}` : ""}</small></td><td><strong>${money(order.total || 0)}</strong></td><td><select class="status status--${order.status}" data-order-status="${order.orderId}">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${value === order.status ? "selected" : ""}>${label}</option>`).join("")}</select></td><td><button class="approve-button" data-approve-order="${order.orderId}" ${order.status === "approved" ? "disabled" : ""}>${order.status === "approved" ? "Одобрено" : "Одобрить"}</button></td></tr>`;
}
function renderOrders() {
  const search = document.querySelector("#order-search").value.toLowerCase();
  const filter = document.querySelector("#status-filter").value;
  const filtered = orders.filter((order) => (filter === "all" || order.status === filter) && `${order.orderId} ${order.customer?.name} ${order.customer?.contactInfo}`.toLowerCase().includes(search));
  document.querySelector("#orders-body").innerHTML = filtered.map(orderRow).join("");
  document.querySelector("#empty-state").hidden = filtered.length > 0;
  document.querySelector("#orders-count-label").textContent = filtered.length;
  document.querySelector("#nav-order-count").textContent = orders.length;
}
async function loadOrders() {
  try {
    const response = await fetch("/api/orders");
    if (response.ok) {
      const data = await response.json();
      const localIds = new Set(orders.map((order) => order.orderId));
      if (Array.isArray(data.orders)) orders = [...orders, ...data.orders.filter((order) => !localIds.has(order.orderId))];
    }
  } catch { /* local orders remain visible if the API is unavailable */ }
  renderOrders();
}
document.querySelector("#order-search").addEventListener("input", renderOrders);
document.querySelector("#status-filter").addEventListener("change", renderOrders);
document.addEventListener("change", (event) => { const select = event.target.closest("[data-order-status]"); if (!select) return; const order = orders.find((item) => item.orderId === select.dataset.orderStatus); if (order) { order.status = select.value; localStorage.setItem(ordersStorageKey, JSON.stringify(orders)); renderOrders(); } });
document.addEventListener("click", async (event) => { const button = event.target.closest("[data-approve-order]"); if (!button) return; const order = orders.find((item) => item.orderId === button.dataset.approveOrder); if (order) { order.status = "approved"; localStorage.setItem(ordersStorageKey, JSON.stringify(orders)); try { await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId, status: order.status }) }); } catch { /* local approval remains visible */ } renderOrders(); } });
document.querySelector("#theme-toggle").addEventListener("click", () => document.body.classList.toggle("light-theme"));
document.querySelector("#mobile-menu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("is-open"));
loadOrders();
