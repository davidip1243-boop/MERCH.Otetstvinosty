const CART_KEY = "merch-cart";
const CUSTOMER_KEY = "merch-customer";
const ADMIN_PASSWORD_KEY = "merch-admin-password";

const state = {
  products: [],
  cart: loadJson(CART_KEY, []),
  customer: loadJson(CUSTOMER_KEY, {
    fullName: "",
    phone: "",
    address: "",
    telegram: ""
  }),
  adminPassword: localStorage.getItem(ADMIN_PASSWORD_KEY) || "",
  settings: {
    adminProtected: false
  },
  editingProduct: null
};

const currency = new Intl.NumberFormat("ru-RU");

init().catch((error) => {
  console.error(error);
});

async function init() {
  state.settings = await fetchJson("/api/settings");
  state.products = await fetchJson("/api/products");
  renderFeatured();
  renderCatalog();
  setupCart();
  setupCheckoutForm();
  setupAdmin();
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  return response.status === 204 ? null : response.json();
}

function renderFeatured() {
  const container = document.querySelector("[data-featured-products]");
  if (!container) {
    return;
  }

  container.innerHTML = state.products.slice(0, 2).map((product) => buildProductCard(product, true)).join("");
  bindProductActions(container);
}

function renderCatalog() {
  const container = document.querySelector("[data-catalog-grid]");
  if (!container) {
    return;
  }

  container.innerHTML = state.products.map((product) => buildProductCard(product)).join("");
  bindProductActions(container);
}

function buildProductCard(product, compact = false) {
  return `
    <article class="${compact ? "featured-card" : "product-card"}">
      <div class="product-image">
        <span class="product-accent" style="background:${product.accent}"></span>
        <img src="${product.images[0]}" alt="${product.title}" />
      </div>
      <div class="product-copy">
        <div>
          <p class="product-meta">${product.category}</p>
          <h3>${product.title}</h3>
        </div>
        <p>${product.summary}</p>
        <div class="product-thumbs">
          ${product.images
            .slice(0, 3)
            .map(
              (image, index) => `
                <button class="product-thumb" type="button" data-product-preview="${product.id}" data-image-index="${index}">
                  <img src="${image}" alt="${product.title} ${index + 1}" />
                </button>
              `
            )
            .join("")}
        </div>
        ${compact ? "" : `<ul class="product-details">${product.details.map((item) => `<li>${item}</li>`).join("")}</ul>`}
        <div class="cart-head">
          <strong class="product-price">${currency.format(product.price)} ₽</strong>
          <button class="button button--solid" type="button" data-add-to-cart="${product.id}">В корзину</button>
        </div>
      </div>
    </article>
  `;
}

function bindProductActions(container) {
  container.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.addToCart);
    });
  });

  container.querySelectorAll("[data-product-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card, .featured-card");
      const image = card?.querySelector(".product-image img");
      const product = state.products.find((item) => item.id === button.dataset.productPreview);
      const index = Number(button.dataset.imageIndex);

      if (image && product?.images[index]) {
        image.src = product.images[index];
      }
    });
  });
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      quantity: 1
    });
  }

  persistCart();
  updateCartUi();
  openCart();
}

function setupCart() {
  document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
    button.addEventListener("click", openCart);
  });

  document.querySelectorAll("[data-cart-close]").forEach((button) => {
    button.addEventListener("click", closeCart);
  });

  updateCartUi();
}

function updateCartUi() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const containers = document.querySelectorAll("[data-cart-items]");

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(totalCount);
  });

  document.querySelectorAll("[data-cart-total]").forEach((node) => {
    node.textContent = `${currency.format(total)} ₽`;
  });

  containers.forEach((container) => {
    if (!state.cart.length) {
      container.innerHTML = `<p class="empty-state">Корзина пока пуста. Добавьте товар из каталога.</p>`;
      return;
    }

    container.innerHTML = state.cart
      .map(
        (item) => `
          <div class="cart-row">
            <div>
              <strong>${item.title}</strong>
              <span>${currency.format(item.price)} ₽</span>
            </div>
            <div class="quantity-controls">
              <button type="button" data-qty-change="${item.id}" data-delta="-1">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-qty-change="${item.id}" data-delta="1">+</button>
            </div>
          </div>
        `
      )
      .join("");
  });

  document.querySelectorAll("[data-qty-change]").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.qtyChange, Number(button.dataset.delta));
    });
  });
}

function changeQuantity(productId, delta) {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) {
    return;
  }

  item.quantity += delta;
  state.cart = state.cart.filter((entry) => entry.quantity > 0);
  persistCart();
  updateCartUi();
}

function persistCart() {
  saveJson(CART_KEY, state.cart);
}

function openCart() {
  const drawer = document.querySelector("[data-cart-drawer]");
  if (!drawer) {
    return;
  }

  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const drawer = document.querySelector("[data-cart-drawer]");
  if (!drawer) {
    return;
  }

  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setupCheckoutForm() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) {
    return;
  }

  for (const [key, value] of Object.entries(state.customer)) {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value || "";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-checkout-status]");

    if (!state.cart.length) {
      status.textContent = "Добавьте хотя бы один товар перед оформлением.";
      return;
    }

    const formData = new FormData(form);
    state.customer = Object.fromEntries(formData.entries());
    saveJson(CUSTOMER_KEY, state.customer);
    status.textContent = "Отправляем заказ…";

    try {
      await fetchJson("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer: state.customer,
          items: state.cart,
          total: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        })
      });

      status.textContent = "Заказ отправлен. Мы свяжемся с вами через Telegram или телефон.";
      state.cart = [];
      persistCart();
      updateCartUi();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function setupAdmin() {
  if (document.body.dataset.page !== "admin") {
    return;
  }

  const lock = document.querySelector("[data-admin-lock]");
  const form = document.querySelector("[data-admin-form]");
  const passwordField = document.querySelector("[data-admin-password]");
  const loginButton = document.querySelector("[data-admin-login]");
  const loginStatus = document.querySelector("[data-admin-status]");
  const formStatus = document.querySelector("[data-admin-form-status]");
  const resetButton = document.querySelector("[data-admin-reset]");

  passwordField.value = state.adminPassword;

  const showForm = !state.settings.adminProtected || Boolean(state.adminPassword);
  lock.hidden = !state.settings.adminProtected || Boolean(state.adminPassword);
  form.hidden = !showForm;

  loginButton.addEventListener("click", async () => {
    state.adminPassword = passwordField.value.trim();

    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        headers: {
          "x-admin-password": state.adminPassword
        }
      });

      localStorage.setItem(ADMIN_PASSWORD_KEY, state.adminPassword);
      lock.hidden = true;
      form.hidden = false;
      loginStatus.textContent = "Панель разблокирована.";
      renderAdminProducts();
    } catch (error) {
      loginStatus.textContent = error.message;
    }
  });

  resetButton.addEventListener("click", () => {
    resetAdminForm();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "Сохраняем товар…";

    const formData = new FormData(form);
    const details = String(formData.get("details") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    formData.set("details", JSON.stringify(details));

    if (state.editingProduct) {
      formData.delete("id");
      formData.append("existingImages", JSON.stringify(getKeptImages()));
    }

    try {
      const endpoint = state.editingProduct ? `/api/products/${state.editingProduct.id}` : "/api/products";
      const method = state.editingProduct ? "PUT" : "POST";

      await fetchJson(endpoint, {
        method,
        headers: {
          "x-admin-password": state.adminPassword
        },
        body: formData
      });

      formStatus.textContent = "Товар сохранён.";
      resetAdminForm();
      state.products = await fetchJson("/api/products");
      renderCatalog();
      renderFeatured();
      renderAdminProducts();
    } catch (error) {
      formStatus.textContent = error.message;
    }
  });

  renderAdminProducts();
}

function renderAdminProducts() {
  const container = document.querySelector("[data-admin-products]");
  if (!container) {
    return;
  }

  container.innerHTML = state.products
    .map(
      (product) => `
        <article class="admin-card glass-panel">
          <div class="admin-card__head">
            <div>
              <p class="product-meta">${product.category}</p>
              <h3>${product.title}</h3>
            </div>
            <strong>${currency.format(product.price)} ₽</strong>
          </div>
          <p>${product.summary}</p>
          <div class="product-thumbs">
            ${product.images
              .map(
                (image) => `
                  <span class="product-thumb">
                    <img src="${image}" alt="${product.title}" />
                  </span>
                `
              )
              .join("")}
          </div>
          <div class="admin-card__actions">
            <button class="button button--ghost" type="button" data-admin-edit="${product.id}">Редактировать</button>
            <button class="button button--solid" type="button" data-admin-delete="${product.id}">Удалить</button>
          </div>
        </article>
      `
    )
    .join("");

  container.querySelectorAll("[data-admin-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.adminEdit);
      if (product) {
        populateAdminForm(product);
      }
    });
  });

  container.querySelectorAll("[data-admin-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Удалить товар из каталога?");
      if (!confirmed) {
        return;
      }

      try {
        await fetchJson(`/api/products/${button.dataset.adminDelete}`, {
          method: "DELETE",
          headers: {
            "x-admin-password": state.adminPassword
          }
        });

        state.products = await fetchJson("/api/products");
        renderCatalog();
        renderFeatured();
        renderAdminProducts();
      } catch (error) {
        const status = document.querySelector("[data-admin-form-status]");
        status.textContent = error.message;
      }
    });
  });
}

function populateAdminForm(product) {
  const form = document.querySelector("[data-admin-form]");
  const existingImagesContainer = document.querySelector("[data-existing-images]");

  state.editingProduct = product;
  form.elements.namedItem("id").value = product.id;
  form.elements.namedItem("title").value = product.title;
  form.elements.namedItem("price").value = product.price;
  form.elements.namedItem("category").value = product.category;
  form.elements.namedItem("accent").value = product.accent;
  form.elements.namedItem("summary").value = product.summary;
  form.elements.namedItem("description").value = product.description;
  form.elements.namedItem("details").value = product.details.join("\n");

  existingImagesContainer.innerHTML = product.images
    .map(
      (image, index) => `
        <div class="existing-image">
          <img src="${image}" alt="${product.title} ${index + 1}" />
          <label>
            <input type="checkbox" data-existing-image value="${image}" checked />
            оставить
          </label>
        </div>
      `
    )
    .join("");
}

function getKeptImages() {
  return Array.from(document.querySelectorAll("[data-existing-image]:checked")).map((input) => input.value);
}

function resetAdminForm() {
  const form = document.querySelector("[data-admin-form]");
  const existingImagesContainer = document.querySelector("[data-existing-images]");

  form.reset();
  form.elements.namedItem("id").value = "";
  form.elements.namedItem("accent").value = "#e7ddd4";
  existingImagesContainer.innerHTML = "";
  state.editingProduct = null;
}
