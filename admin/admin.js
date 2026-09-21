const money = (n) => `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
const ordersStorageKey = "otv-orders-v1";
const adminSessionKey = "otv-admin-session";
const statusLabels = { pending_approval: "На проверке", approved: "Одобрен", rejected: "Отклонен", paid: "Оплачен", pickup_pending: "Самовывоз" };
let orders = JSON.parse(localStorage.getItem(ordersStorageKey) || "[]");
let products = [];

const loginOverlay = document.querySelector("#admin-login");
const loginForm = document.querySelector("#admin-login-form");
const loginError = document.querySelector("#login-error");
if (sessionStorage.getItem(adminSessionKey)) loginOverlay.classList.add("is-hidden");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const response = await fetch("/api/admin-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.querySelector("#admin-email").value, password: document.querySelector("#admin-password").value }) });
  if (!response.ok) { const data = await response.json().catch(() => ({})); loginError.textContent = data.error || "Неверные данные входа."; return; }
  const result = await response.json();
  sessionStorage.setItem(adminSessionKey, result.session);
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
  const filtered = orders.filter((order) => (filter === "all" || order.status === filter) && `${order.orderId} ${order.customer?.name} ${order.customer?.email} ${order.customer?.contactInfo}`.toLowerCase().includes(search));
  document.querySelector("#orders-body").innerHTML = filtered.map(orderRow).join("");
  document.querySelector("#empty-state").hidden = filtered.length > 0;
  document.querySelector("#orders-count-label").textContent = filtered.length;
  document.querySelector("#nav-order-count").textContent = orders.length;
}
async function loadOrders() {
  try {
    const response = await fetch("/api/orders", { headers: { "x-admin-session": sessionStorage.getItem(adminSessionKey) || "" } });
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
document.addEventListener("click", async (event) => { const button = event.target.closest("[data-approve-order]"); if (!button) return; const order = orders.find((item) => item.orderId === button.dataset.approveOrder); if (order) { order.status = "approved"; localStorage.setItem(ordersStorageKey, JSON.stringify(orders)); try { await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json", "x-admin-session": sessionStorage.getItem(adminSessionKey) || "" }, body: JSON.stringify({ orderId: order.orderId, status: order.status }) }); } catch { /* local approval remains visible */ } renderOrders(); } });
document.querySelector("#theme-toggle").addEventListener("click", () => document.body.classList.toggle("light-theme"));
document.querySelector("#mobile-menu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("is-open"));

const adminHeaders = () => ({ "x-admin-session": sessionStorage.getItem(adminSessionKey) || "" });
const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

function showAdminView(view) {
  document.querySelectorAll(".admin-view").forEach((node) => { node.hidden = node.id !== view; });
  document.querySelectorAll("[data-admin-view]").forEach((link) => link.classList.toggle("is-active", link.dataset.adminView === view));
  document.querySelector('.side-nav a[href="#orders"]')?.classList.toggle("is-active", view === "orders");
  if (view === "products") loadProducts();
}

async function loadProducts() {
  const list = document.querySelector("#product-list");
  list.innerHTML = `<p class="loading-state">Загружаем каталог…</p>`;
  try {
    const response = await fetch("/api/products", { headers: { Accept: "application/json", ...adminHeaders() } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Не удалось загрузить каталог.");
    products = Array.isArray(data.products) ? data.products.map((product) => ({ ...product, id: product._id || product.id })) : [];
    list.innerHTML = products.length ? products.map((product) => `<article class="product-admin-row"><div class="product-admin-swatch product-visual--${escapeText(product.color || "chalk")}"></div><div><strong>${escapeText(product.name)}</strong><small>${escapeText(product.slug)} · ${escapeText(product.category)}</small></div><b>${money(product.price)}</b><span class="product-active ${product.active ? "is-on" : ""}">${product.active ? "В магазине" : "Скрыт"}</span><button class="outline-button" data-edit-product="${escapeText(product.id)}">Изменить</button><button class="row-menu" data-archive-product="${escapeText(product.id)}" aria-label="Скрыть товар">×</button></article>`).join("") : `<p class="empty-state">Товаров в базе пока нет.</p>`;
  } catch (error) { list.innerHTML = `<p class="form-status is-error">${escapeText(error.message)}</p>`; }
}

function openProductEditor(product = null) {
  const form = document.querySelector("#product-form");
  form.reset();
  form.elements.id.value = product?.id || "";
  form.elements.name.value = product?.name || "";
  form.elements.slug.value = product?.slug || "";
  form.elements.price.value = product?.price ?? "";
  form.elements.category.value = product?.category || "tshirts";
  form.elements.color.value = product?.color || "chalk";
  form.elements.sizes.value = (product?.sizes || []).join(", ");
  form.elements.lead.value = product?.lead || "";
  form.elements.note.value = product?.note || "";
  form.elements.details.value = (product?.details || []).join("\n");
  form.elements.variants.value = JSON.stringify(product?.variants || [{ id: "default", name: "Базовый", visual: product?.color || "chalk", imagePath: "/assets/images/products/defaults/tote-dream", images: ["01.jpg"] }], null, 2);
  form.elements.active.checked = product ? product.active : true;
  document.querySelector("#editor-title").textContent = product ? "Изменить товар" : "Новый товар";
  showAdminView("product-editor");
}

document.querySelector('[data-admin-view="products"]').addEventListener("click", (event) => { event.preventDefault(); showAdminView("products"); });
document.querySelector('.side-nav a[href="#orders"]').addEventListener("click", (event) => { event.preventDefault(); showAdminView("orders"); });
document.querySelector("#add-product").addEventListener("click", () => openProductEditor());
document.querySelector("#close-editor").addEventListener("click", () => showAdminView("products"));
document.querySelector("#cancel-editor").addEventListener("click", () => showAdminView("products"));
document.querySelector("#product-list").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-product]");
  if (edit) openProductEditor(products.find((product) => product.id === edit.dataset.editProduct));
  const archive = event.target.closest("[data-archive-product]");
  if (archive && confirm("Скрыть этот товар из магазина?")) fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ id: archive.dataset.archiveProduct }) }).then(loadProducts);
});
document.querySelector("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector("#product-form-status");
  let variants;
  try { variants = JSON.parse(form.elements.variants.value); if (!Array.isArray(variants)) variants = [variants]; } catch { status.textContent = "Варианты должны быть корректным JSON."; status.className = "form-status field-wide is-error"; return; }
  const payload = { id: form.elements.id.value || undefined, name: form.elements.name.value.trim(), slug: form.elements.slug.value.trim(), price: Number(form.elements.price.value), category: form.elements.category.value, color: form.elements.color.value.trim(), sizes: form.elements.sizes.value.split(",").map((size) => size.trim()).filter(Boolean), lead: form.elements.lead.value.trim(), note: form.elements.note.value.trim(), details: form.elements.details.value.split("\n").map((line) => line.trim()).filter(Boolean), variants, active: form.elements.active.checked };
  status.textContent = "Сохраняем…";
  try { const response = await fetch("/api/products", { method: payload.id ? "PUT" : "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(payload) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Не удалось сохранить товар."); status.textContent = "Сохранено. Магазин увидит изменения после обновления."; status.className = "form-status field-wide is-success"; window.setTimeout(() => showAdminView("products"), 700); } catch (error) { status.textContent = error.message; status.className = "form-status field-wide is-error"; }
});
loadOrders();
