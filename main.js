const products = [
  {
    id: "tee-team",
    name: "Футболка",
    type: "clothes",
    price: 2500,
    color: "chalk",
    sizes: ["S", "M", "L", "XL", "XXL"],
    lead: "Плотный хлопок, свободная посадка, спокойный принт команды.",
    note: "Для встреч, поездок и обычного воскресенья.",
    details: ["Плотная посадка oversize", "Мягкий хлопок", "Размер выбирается в карточке товара"],
    gallery: ["chalk", "pine", "canvas", "wine"],
  },
];

const storageKey = "otv-cart-v2";
const themeKey = "otv-theme";
const formatter = new Intl.NumberFormat("ru-RU");

const money = (value) => `${formatter.format(value)} ₽`;
const readCart = () =>
  JSON.parse(localStorage.getItem(storageKey) || "[]").map((item) => ({
    ...item,
    size: item.size === "ONE" ? "" : item.size,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));

function writeCart(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
  renderCart();
  updateCartCount();
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function cartKey(id, size = "") {
  return size ? `${id}::${size}` : id;
}

function upsertCartItem(id, size = "", delta = 1) {
  const items = readCart();
  const key = cartKey(id, size);
  const existing = items.find((item) => cartKey(item.id, item.size) === key);

  if (existing) {
    existing.quantity += delta;
  } else if (delta > 0) {
    items.push({ id, size, quantity: delta });
  }

  writeCart(items.filter((item) => item.quantity > 0));
}

function getCartQuantity(id, size = "") {
  const item = readCart().find((entry) => cartKey(entry.id, entry.size) === cartKey(id, size));
  return item?.quantity || 0;
}

function selectedProductSize(productId) {
  return document.querySelector(`[data-size-group="${productId}"] .size-chip.is-active`)?.dataset.size || "";
}

function productCard(product, featured = false) {
  return `
    <article class="product-card reveal" data-product-card data-product-open="${product.id}" data-type="${product.type}">
      <div class="product-visual product-visual--${product.color}" aria-hidden="true">
        <span class="garment garment--${product.id}"></span>
      </div>
      <div class="product-info">
        <span class="product-kind">${product.type === "clothes" ? "Одежда" : "Аксессуар"}</span>
        <h2>${product.name}</h2>
        <p>${featured ? product.note : product.lead}</p>
      </div>
      <div class="product-buy">
        <strong>${money(product.price)}</strong>
        <button class="button button-primary" data-open-product="${product.id}">Смотреть товар</button>
      </div>
    </article>
  `;
}

function productDetail(product) {
  const activeSize = product.sizes[1] || product.sizes[0] || "";
  const quantity = getCartQuantity(product.id, activeSize);
  return `
    <section class="product-detail-page reveal" data-product-detail="${product.id}">
      <div class="product-detail-gallery">
        <div class="product-visual product-visual--${product.color}" data-product-main-visual aria-hidden="true">
          <span class="garment garment--${product.id}"></span>
        </div>
        <div class="product-thumbs">
          ${product.gallery
            .map(
              (color, index) => `
                <button class="product-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-color="${color}" aria-label="Фото ${index + 1}">
                  <span class="product-visual--${color}"></span>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="product-detail-copy">
        <p class="label">Товар</p>
        <h1>${product.name}</h1>
        <p>${product.lead}</p>
        <strong class="product-detail-price">${money(product.price)}</strong>
        <div class="size-row" data-size-group="${product.id}">
          ${product.sizes
            .map(
              (size) => `
                <button class="size-chip ${size === activeSize ? "is-active" : ""}" data-size="${size}" type="button">
                  ${size}
                </button>
              `,
            )
            .join("")}
        </div>
        <div data-product-controls="${product.id}">
          ${productControls(product.id, activeSize, quantity)}
        </div>
        <ul class="product-detail-list">
          ${product.details.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

function productControls(id, size, quantity = getCartQuantity(id, size)) {
  if (quantity > 0) {
    return `
      <div class="quantity-stepper">
        <button type="button" data-product-delta="-1">−</button>
        <strong>${quantity}</strong>
        <button type="button" data-product-delta="1">+</button>
      </div>
    `;
  }

  return `<button class="button button-primary" data-add-to-cart="${id}">В корзину</button>`;
}

function refreshProductControls(id) {
  const product = productById(id);
  const controls = document.querySelector(`[data-product-controls="${id}"]`);
  if (!product || !controls) return;
  const size = selectedProductSize(id) || product.sizes[1] || product.sizes[0] || "";
  controls.innerHTML = productControls(id, size);
}

function renderProductDetailPage() {
  const host = document.querySelector("[data-product-detail-root]");
  if (!host) return;
  const id = window.location.pathname.split("/").filter(Boolean).at(-1) || "tee-team";
  const product = productById(id) || products[0];
  host.innerHTML = productDetail(product);
}

function renderProducts() {
  const grid = document.querySelector("[data-product-grid]");
  const featured = document.querySelector("[data-featured-products]");

  if (grid) {
    grid.innerHTML = products.map((product) => productCard(product)).join("");
  }

  if (featured) {
    featured.innerHTML = products.slice(0, 3).map((product) => productCard(product, true)).join("");
  }
}

function renderCart() {
  const list = document.querySelector("[data-cart-list]");
  const totalNode = document.querySelector("[data-cart-total]");
  if (!list && !totalNode) return;

  const items = readCart();
  const total = items.reduce((sum, item) => sum + (productById(item.id)?.price || 0) * item.quantity, 0);

  if (totalNode) totalNode.textContent = money(total);

  if (!list) return;
  if (!items.length) {
    list.innerHTML = `
      <div class="empty-cart">
        <strong>Корзина пустая</strong>
        <p>Загляните в каталог и выберите вещь, которая поедет дальше вместе с вами.</p>
        <a class="button button-quiet" href="/catalog/">В каталог</a>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map((item, index) => {
      const product = productById(item.id);
      if (!product) return "";
      return `
        <div class="cart-row">
          <div class="cart-row-visual product-visual--${product.color}" aria-hidden="true"></div>
          <div>
            <strong>${product.name}</strong>
            ${item.size ? `<span>Размер: ${item.size}</span>` : "<span>Один универсальный вариант</span>"}
          </div>
          <div class="quantity-stepper quantity-stepper--cart">
            <button type="button" data-cart-delta="${index}" data-delta="-1">−</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-delta="${index}" data-delta="1">+</button>
          </div>
          <b>${money(product.price * item.quantity)}</b>
        </div>
      `;
    })
    .join("");
}

function cartOrderItems() {
  return readCart()
    .map((item) => {
      const product = productById(item.id);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        size: item.size || "",
        quantity: item.quantity,
        unitPrice: product.price,
        total: product.price * item.quantity,
      };
    })
    .filter(Boolean);
}

function cartOrderTotal(items = cartOrderItems()) {
  return items.reduce((sum, item) => sum + item.total, 0);
}

function updateCartCount() {
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
    node.hidden = count === 0;
  });
}

function setOrderStatus(message, type = "") {
  const status = document.querySelector("[data-order-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.status = type;
}

function themeBaseColor(theme) {
  return theme === "light" ? "#f7ead5" : "#0f0f0e";
}

function applyTheme(theme) {
  const previousTheme = document.documentElement.dataset.theme || "dark";
  if (previousTheme !== theme) {
    document.documentElement.style.setProperty("--theme-fade-from", themeBaseColor(previousTheme));
    document.documentElement.dataset.themeFrom = previousTheme;
    document.documentElement.classList.add("is-theme-changing");
    window.setTimeout(() => {
      document.documentElement.classList.remove("is-theme-changing");
      delete document.documentElement.dataset.themeFrom;
      document.documentElement.style.removeProperty("--theme-fade-from");
    }, 760);
  }
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeKey, theme);
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-product]");
  if (openButton) {
    window.open(`/item/${openButton.dataset.openProduct}/`, "_blank", "noopener");
    return;
  }

  const openCard = event.target.closest("[data-product-open]");
  if (openCard && !event.target.closest("button, a")) {
    window.open(`/item/${openCard.dataset.productOpen}/`, "_blank", "noopener");
    return;
  }

  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const id = addButton.dataset.addToCart;
    upsertCartItem(id, selectedProductSize(id));
    refreshProductControls(id);
  }

  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    const group = sizeButton.closest("[data-size-group]");
    group.querySelectorAll("[data-size]").forEach((button) => {
      button.classList.toggle("is-active", button === sizeButton);
    });
    refreshProductControls(group.dataset.sizeGroup);
  }

  const cartDelta = event.target.closest("[data-cart-delta]");
  if (cartDelta) {
    const items = readCart();
    const item = items[Number(cartDelta.dataset.cartDelta)];
    if (item) {
      item.quantity += Number(cartDelta.dataset.delta);
    }
    writeCart(items.filter((entry) => entry.quantity > 0));
  }

  const productDelta = event.target.closest("[data-product-delta]");
  if (productDelta) {
    const detail = productDelta.closest("[data-product-detail]");
    const id = detail?.dataset.productDetail;
    if (!id) return;
    upsertCartItem(id, selectedProductSize(id), Number(productDelta.dataset.productDelta));
    refreshProductControls(id);
  }

  const galleryButton = event.target.closest("[data-gallery-color]");
  if (galleryButton) {
    const detail = galleryButton.closest("[data-product-detail]");
    const main = detail?.querySelector("[data-product-main-visual]");
    if (main) {
      main.className = `product-visual product-visual--${galleryButton.dataset.galleryColor}`;
    }
    detail?.querySelectorAll("[data-gallery-color]").forEach((button) => {
      button.classList.toggle("is-active", button === galleryButton);
    });
  }

  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    const items = readCart();
    items.splice(Number(removeButton.dataset.removeItem), 1);
    writeCart(items);
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    const filter = filterButton.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle("is-active", button === filterButton);
    });
    document.querySelectorAll("[data-product-card]").forEach((card) => {
      card.classList.toggle("is-filtered-out", filter !== "all" && card.dataset.type !== filter);
    });
  }

  if (event.target.closest("[data-theme-toggle]")) {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-order-form]");
  if (!form) return;
  event.preventDefault();

  const items = cartOrderItems();
  if (!items.length) {
    setOrderStatus("Добавьте товар в корзину перед заказом.", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const order = {
    customer: {
      name: String(formData.get("name") || "").trim(),
      contactInfo: String(formData.get("contactInfo") || "").trim(),
      address: String(formData.get("address") || "").trim(),
    },
    items,
    total: cartOrderTotal(items),
    paymentStatus: "pending_payment",
  };

  if (!order.customer.name || !order.customer.contactInfo || !order.customer.address) {
    setOrderStatus("Заполните имя, контакт и адрес.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Отправляем";
  setOrderStatus("Сохраняем заказ...", "");

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Не удалось сохранить заказ.");
    }

    writeCart([]);
    form.reset();
    setOrderStatus(`Заказ сохранен. Номер: ${result.orderId}`, "success");
  } catch (error) {
    setOrderStatus(error.message || "Не удалось сохранить заказ.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Заказать";
  }
});

const savedTheme = localStorage.getItem(themeKey);
if (savedTheme) {
  applyTheme(savedTheme);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  applyTheme("dark");
}

renderProducts();
renderProductDetailPage();
renderCart();
updateCartCount();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
);

document.querySelectorAll(".reveal").forEach((node, index) => {
  node.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);
  revealObserver.observe(node);
});

const progress = document.querySelector("[data-scroll-progress]");
function updateScrollProgress() {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleY(${max > 0 ? window.scrollY / max : 0})`;
}

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
