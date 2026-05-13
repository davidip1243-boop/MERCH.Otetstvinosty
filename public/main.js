const CART_KEY = "merch-cart";
const CUSTOMER_KEY = "merch-customer";
const LANG_KEY = "merch-lang";
const SESSION_DRAFT_KEY = "merch-session-draft";
const SESSION_HISTORY_KEY = "merch-session-history";
const DELETED_PRODUCTS_KEY = "merch-deleted-products";

const translations = {
  ru: {
    "lang.label": "Язык",
    "common.telegram": "Telegram",
    "common.youtube": "YouTube",
    "common.admin": "Админ-панель",
    "nav.home": "Главная",
    "nav.catalog": "Каталог",
    "nav.delivery": "Доставка",
    "nav.cart": "Корзина",
    "index.meta.description":
      "Минималистичный интернет-магазин мерча с лаконичной эстетикой, локальной корзиной и заказами в Telegram.",
    "index.eyebrow": "Минимализм. Тишина. Доверие.",
    "index.title": "Знаешь ли ты, кто мы?",
    "index.lead":
      "Мы делаем мерч без лишней декоративности: чистые формы, мягкая посадка и спокойные символы, которые не спорят с человеком.",
    "index.openCatalog": "Открыть каталог",
    "index.delivery": "Доставка",
    "index.weekPick": "Выбор недели",
    "index.weekTitle": "Тихий мерч для повседневной жизни",
    "index.weekLead": "Белый, чёрный, пастельные акценты и мягкий тактильный объём.",
    "index.selection": "Подборка",
    "index.essentials": "Основные вещи",
    "index.story1eyebrow": "Философия",
    "index.story1title": "Красота без перегруза",
    "index.story1text":
      "Простые формы, пастельный воздух, тёплая пластика интерфейса и аккуратные отклики на каждом касании.",
    "index.story2eyebrow": "Деталь",
    "index.story2title": "Тихий знак",
    "index.story2text":
      "Крест встроен в систему сайта и мерча как сдержанный символ, а не декоративный шум.",
    "index.footer": "Лаконичный магазин мерча с мягкими откликами и заказом через Telegram.",
    "catalog.eyebrow": "Каталог",
    "catalog.title": "Предметы с тихим характером",
    "catalog.lead":
      "У каждого товара уже есть три стартовых изображения: общий ракурс, детализация и подача на модели. Новые фото и позиции можно добавлять из админ-панели.",
    "catalog.footer": "Доставка по России, оформление заказа без создания аккаунта.",
    "delivery.eyebrow": "Доставка",
    "delivery.title": "Просто, прозрачно, без перегруза",
    "delivery.lead":
      "Вы оформляете заказ в корзине, данные сохраняются локально, а после отправки заявка мгновенно уходит в Telegram для обработки.",
    "delivery.step1n": "1",
    "delivery.step1t": "Добавьте товары",
    "delivery.step1d": "Каталог работает без аккаунта: просто собирайте корзину и переходите к форме заказа.",
    "delivery.step2n": "2",
    "delivery.step2t": "Заполните данные",
    "delivery.step2d": "ФИО, телефон, адрес и ник в Telegram сохраняются в LocalStorage для следующего заказа.",
    "delivery.step3n": "3",
    "delivery.step3t": "Получите подтверждение",
    "delivery.step3d": "Заказ прилетает в Telegram-бот или внешний вебхук, после чего менеджер связывается с вами.",
    "delivery.footer": "Корзина хранится локально в браузере, а отправка заказа идёт через серверный API.",
    "cart.backCatalog": "Вернуться в каталог",
    "cart.eyebrow": "Корзина",
    "cart.title": "Оформление без регистрации",
    "cart.lead": "Проверьте состав заказа, заполните данные и отправьте заявку в один шаг.",
    "cart.footer": "Оформление заказа в полном экране с той же визуальной системой магазина.",
    "admin.eyebrow": "Админ-панель",
    "admin.title": "Управление товарами и фотографиями",
    "admin.lead":
      "Здесь можно добавлять новые позиции, редактировать описание и загружать дополнительные фото. Если задан ADMIN_PASSWORD, панель запросит пароль перед записью.",
    "admin.passwordLabel": "Пароль администратора",
    "admin.passwordPlaceholder": "Введите пароль",
    "admin.unlock": "Разблокировать",
    "admin.name": "Название",
    "admin.namePlaceholder": "Худи «Свет»",
    "admin.price": "Цена",
    "admin.pricePlaceholder": "7900",
    "admin.category": "Категория",
    "admin.categoryPlaceholder": "Худи",
    "admin.accent": "Акцентный цвет",
    "admin.summary": "Краткое описание",
    "admin.summaryPlaceholder": "Короткое описание карточки",
    "admin.description": "Полное описание",
    "admin.descriptionPlaceholder": "Подробное описание товара",
    "admin.details": "Детали товара",
    "admin.detailsPlaceholder": "Одна характеристика на строку",
    "admin.photos": "Фотографии",
    "admin.save": "Сохранить товар",
    "admin.clear": "Очистить форму",
    "checkout.fullName": "ФИО",
    "checkout.fullNamePlaceholder": "Иванов Иван Иванович",
    "checkout.phone": "Телефон",
    "checkout.phonePlaceholder": "+7 999 123-45-67",
    "checkout.address": "Адрес",
    "checkout.addressPlaceholder": "Город, улица, дом, квартира",
    "checkout.telegram": "Ник в Telegram",
    "checkout.telegramPlaceholder": "@username",
    "checkout.total": "Итого",
    "checkout.submit": "Отправить заказ",
    "ui.addToCart": "В корзину",
    "ui.cartEmpty": "Корзина пока пуста. Добавьте товар из каталога.",
    "ui.checkoutNeedItem": "Добавьте хотя бы один товар перед оформлением.",
    "ui.checkoutSending": "Отправляем заказ…",
    "ui.checkoutSent": "Заказ отправлен. Мы свяжемся с вами через Telegram или телефон.",
    "ui.adminUnlocked": "Панель разблокирована.",
    "ui.adminSaving": "Сохраняем товар…",
    "ui.adminSaved": "Товар сохранён.",
    "ui.adminEdit": "Редактировать",
    "ui.adminDelete": "Удалить",
    "ui.adminKeep": "оставить",
    "ui.adminDeleteConfirm": "Удалить товар из каталога?",
    "ui.openDetails": "Открыть",
    "product.backCatalog": "Назад в каталог",
    "product.notFound": "Товар не найден",
    "product.details": "Детали",
    "404.title": "Страница не найдена",
    "404.eyebrow": "404",
    "404.main": "Страница не найдена. Но, возможно, ты найдешь себя!",
    "404.home": "Вернуться на главную"
  },
  en: {
    "lang.label": "Language",
    "common.telegram": "Telegram",
    "common.youtube": "YouTube",
    "common.admin": "Admin panel",
    "nav.home": "Home",
    "nav.catalog": "Shop",
    "nav.delivery": "Delivery",
    "nav.cart": "Cart",
    "index.meta.description":
      "Minimal merch storefront with a clean aesthetic, local cart persistence, and Telegram order flow.",
    "index.eyebrow": "Minimal. Quiet. Trusted.",
    "index.title": "Do You Know Who We Are?",
    "index.lead":
      "We create merch without visual noise: clean forms, soft fit, and calm symbols that never overpower the person.",
    "index.openCatalog": "Open Shop",
    "index.delivery": "Delivery",
    "index.weekPick": "Pick of the Week",
    "index.weekTitle": "Quiet Merch for Everyday Life",
    "index.weekLead": "White, black, soft accents, and tactile volume.",
    "index.selection": "Selection",
    "index.essentials": "Core Pieces",
    "index.story1eyebrow": "Philosophy",
    "index.story1title": "Beauty Without Clutter",
    "index.story1text":
      "Simple shapes, airy tones, warm interface motion, and thoughtful feedback in every interaction.",
    "index.story2eyebrow": "Detail",
    "index.story2title": "Quiet Symbol",
    "index.story2text": "The cross is integrated as a restrained symbol, not decorative noise.",
    "index.footer": "A clean merch store with soft interactions and Telegram-based ordering.",
    "catalog.eyebrow": "Shop",
    "catalog.title": "Items with a Quiet Character",
    "catalog.lead":
      "Each product starts with three images: angle, close detail, and model view. Add new products and photos in the admin panel.",
    "catalog.footer": "Delivery across Russia with checkout available without account creation.",
    "delivery.eyebrow": "Delivery",
    "delivery.title": "Simple, Transparent, No Overload",
    "delivery.lead":
      "You place an order in the cart, your data is saved locally, and the request is instantly sent to Telegram for processing.",
    "delivery.step1n": "1",
    "delivery.step1t": "Add products",
    "delivery.step1d": "The shop works without an account: build your cart and move to checkout.",
    "delivery.step2n": "2",
    "delivery.step2t": "Enter details",
    "delivery.step2d": "Name, phone, address, and Telegram handle are stored in LocalStorage for your next order.",
    "delivery.step3n": "3",
    "delivery.step3t": "Get confirmation",
    "delivery.step3d": "Orders arrive in Telegram bot or webhook, then a manager contacts you.",
    "delivery.footer": "The cart is stored locally in your browser, and orders are submitted via server API.",
    "cart.backCatalog": "Back to shop",
    "cart.eyebrow": "Cart",
    "cart.title": "Checkout Without Sign-Up",
    "cart.lead": "Review your order, fill in details, and send it in one step.",
    "cart.footer": "Fullscreen checkout with the same visual language as the rest of the store.",
    "admin.eyebrow": "Admin panel",
    "admin.title": "Manage Products and Photos",
    "admin.lead":
      "Add new items, edit descriptions, and upload extra photos. If ADMIN_PASSWORD is set, the panel asks for it before write actions.",
    "admin.passwordLabel": "Admin password",
    "admin.passwordPlaceholder": "Enter password",
    "admin.unlock": "Unlock",
    "admin.name": "Name",
    "admin.namePlaceholder": "Hoodie “Light”",
    "admin.price": "Price",
    "admin.pricePlaceholder": "7900",
    "admin.category": "Category",
    "admin.categoryPlaceholder": "Hoodie",
    "admin.accent": "Accent color",
    "admin.summary": "Short description",
    "admin.summaryPlaceholder": "Card short text",
    "admin.description": "Full description",
    "admin.descriptionPlaceholder": "Detailed product description",
    "admin.details": "Product details",
    "admin.detailsPlaceholder": "One feature per line",
    "admin.photos": "Photos",
    "admin.save": "Save product",
    "admin.clear": "Clear form",
    "checkout.fullName": "Full name",
    "checkout.fullNamePlaceholder": "Ivan Ivanov",
    "checkout.phone": "Phone",
    "checkout.phonePlaceholder": "+7 999 123-45-67",
    "checkout.address": "Address",
    "checkout.addressPlaceholder": "City, street, building, apartment",
    "checkout.telegram": "Telegram handle",
    "checkout.telegramPlaceholder": "@username",
    "checkout.total": "Total",
    "checkout.submit": "Send order",
    "ui.addToCart": "Add to cart",
    "ui.cartEmpty": "Your cart is empty. Add a product from the shop.",
    "ui.checkoutNeedItem": "Add at least one product before checkout.",
    "ui.checkoutSending": "Sending order…",
    "ui.checkoutSent": "Order sent. We will contact you via Telegram or phone.",
    "ui.adminUnlocked": "Panel unlocked.",
    "ui.adminSaving": "Saving product…",
    "ui.adminSaved": "Product saved.",
    "ui.adminEdit": "Edit",
    "ui.adminDelete": "Delete",
    "ui.adminKeep": "keep",
    "ui.adminDeleteConfirm": "Delete this product from the catalog?",
    "ui.openDetails": "Open",
    "product.backCatalog": "Back to shop",
    "product.notFound": "Product not found",
    "product.details": "Details",
    "404.title": "Page Not Found",
    "404.eyebrow": "404",
    "404.main": "Page not found. But maybe you'll find yourself.",
    "404.home": "Back to home"
  }
};

const state = {
  products: [],
  cart: loadJson(CART_KEY, []),
  customer: loadJson(CUSTOMER_KEY, {
    fullName: "",
    phone: "",
    address: "",
    telegram: ""
  }),
  adminPassword: "",
  settings: {
    adminProtected: false
  },
  catalogFilter: "all",
  language: detectInitialLanguage(),
  sessionId: "",
  sessionStartedAt: "",
  sessionFinalized: false,
  editingProduct: null
};

init().catch((error) => {
  console.error(error);
});

async function init() {
  setupGuestSessionPersistence();
  setupLanguageSwitcher();
  state.settings = await fetchJson("/api/settings");
  state.products = applyDeletedFilter(await fetchJson("/api/products"));
  renderFeatured();
  renderCatalog();
  setupCatalogFilters();
  setupCart();
  openCartFromQuery();
  setupCheckoutForm();
  setupAdmin();
  renderProductPage();
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function setupGuestSessionPersistence() {
  const existingDraft = loadJson(SESSION_DRAFT_KEY, null);
  if (existingDraft?.sessionId && existingDraft?.startedAt) {
    state.sessionId = existingDraft.sessionId;
    state.sessionStartedAt = existingDraft.startedAt;
  } else {
    state.sessionId = createSessionId();
    state.sessionStartedAt = new Date().toISOString();
  }

  saveSessionDraft();

  window.addEventListener("beforeunload", finalizeSession);
  window.addEventListener("pagehide", finalizeSession);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveSessionDraft();
    }
  });
}

function saveSessionDraft() {
  if (!state.sessionId) {
    return;
  }

  saveJson(SESSION_DRAFT_KEY, {
    sessionId: state.sessionId,
    startedAt: state.sessionStartedAt,
    lastSeenAt: new Date().toISOString(),
    page: window.location.pathname,
    language: state.language,
    cart: state.cart,
    customer: state.customer,
    accountEmail: ""
  });
}

function finalizeSession() {
  if (state.sessionFinalized || !state.sessionId) {
    return;
  }

  const draft = loadJson(SESSION_DRAFT_KEY, null);
  if (!draft || draft.sessionId !== state.sessionId) {
    return;
  }

  const history = loadJson(SESSION_HISTORY_KEY, []);
  history.push({
    sessionId: state.sessionId,
    startedAt: state.sessionStartedAt,
    endedAt: new Date().toISOString(),
    page: draft.page,
    language: draft.language,
    cart: draft.cart,
    customer: draft.customer,
    accountEmail: ""
  });

  const cappedHistory = history.slice(-200);
  saveJson(SESSION_HISTORY_KEY, cappedHistory);
  saveSessionDraft();
  state.sessionFinalized = true;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function detectInitialLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "ru" || saved === "en") {
    return saved;
  }

  return navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function t(key) {
  return translations[state.language]?.[key] ?? translations.ru[key] ?? key;
}

function formatPrice(value) {
  const locale = state.language === "en" ? "en-US" : "ru-RU";
  return new Intl.NumberFormat(locale).format(Number(value) || 0);
}

function applyTranslations() {
  document.documentElement.lang = state.language;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-content]").forEach((node) => {
    node.setAttribute("content", t(node.dataset.i18nContent));
  });

  document.querySelectorAll("[data-lang-switch]").forEach((select) => {
    select.value = state.language;
  });
}

function setupLanguageSwitcher() {
  applyTranslations();

  document.querySelectorAll("[data-lang-switch]").forEach((select) => {
    select.value = state.language;
    select.addEventListener("change", () => {
      state.language = select.value === "ru" ? "ru" : "en";
      localStorage.setItem(LANG_KEY, state.language);
      saveSessionDraft();
      applyTranslations();
      renderFeatured();
      renderCatalog();
      renderAdminProducts();
      updateCartUi();
      renderProductPage();
    });
  });
}


function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDeletedProductIds() {
  return new Set(loadJson(DELETED_PRODUCTS_KEY, []));
}

function saveDeletedProductIds(ids) {
  saveJson(DELETED_PRODUCTS_KEY, Array.from(ids));
}

function markProductDeleted(productId) {
  if (!productId) {
    return;
  }
  const ids = getDeletedProductIds();
  ids.add(productId);
  saveDeletedProductIds(ids);
}

function clearProductDeletedMark(productId) {
  if (!productId) {
    return;
  }
  const ids = getDeletedProductIds();
  ids.delete(productId);
  saveDeletedProductIds(ids);
}

function applyDeletedFilter(products) {
  const ids = getDeletedProductIds();
  return (Array.isArray(products) ? products : []).filter((product) => !ids.has(product.id));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options
  });
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

  container.innerHTML = state.products
    .filter((product) => matchesCatalogFilter(product, state.catalogFilter))
    .map((product) => buildProductCard(product))
    .join("");
  bindProductActions(container);
}

function setupCatalogFilters() {
  const buttons = document.querySelectorAll("[data-catalog-filter]");
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogFilter = button.dataset.catalogFilter || "all";
      updateCatalogFilterUi();
      renderCatalog();
    });
  });

  updateCatalogFilterUi();
}

function updateCatalogFilterUi() {
  document.querySelectorAll("[data-catalog-filter]").forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.catalogFilter || "all") === state.catalogFilter);
  });
}

function matchesCatalogFilter(product, filter) {
  if (filter === "all") {
    return true;
  }

  const category = String(product.category || "").toLowerCase();
  if (filter === "clothes") {
    return (
      category.includes("худи") ||
      category.includes("футбол") ||
      category.includes("одеж") ||
      category.includes("hoodie") ||
      category.includes("shirt") ||
      category.includes("clothes")
    );
  }

  if (filter === "candles") {
    return category.includes("свеч") || category.includes("cand");
  }

  if (filter === "crosses") {
    return category.includes("крест") || category.includes("cross");
  }

  return true;
}

function buildProductCard(product, compact = false) {
  return `
    <article class="${compact ? "featured-card" : "product-card"}" data-open-product="${product.id}">
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
          <strong class="product-price">${formatPrice(product.price)} ₽</strong>
          <div class="product-actions">
            <button class="button button--ghost" type="button" data-open-product-button="${product.id}">${t("ui.openDetails")}</button>
            <button class="button button--solid" type="button" data-add-to-cart="${product.id}">${t("ui.addToCart")}</button>
          </div>
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

  container.querySelectorAll("[data-open-product-button]").forEach((button) => {
    button.addEventListener("click", () => {
      openProductPage(button.dataset.openProductButton);
    });
  });

  container.querySelectorAll("[data-open-product]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, textarea, select, label")) {
        return;
      }

      openProductPage(card.dataset.openProduct);
    });
  });
}

function openProductPage(productId) {
  if (!productId) {
    return;
  }

  const safeId = encodeURIComponent(productId);
  window.open(`/item/${safeId}`, "_blank", "noopener");
}

function getProductIdFromPath() {
  if (document.body.dataset.page !== "product") {
    return "";
  }

  const match = window.location.pathname.match(/^\/item\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function renderProductPage() {
  const container = document.querySelector("[data-product-page]");
  if (!container) {
    return;
  }

  const productId = getProductIdFromPath();
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    container.innerHTML = `<p class="empty-state">${t("product.notFound")}</p>`;
    return;
  }

  const details = product.details.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const images = product.images
    .map(
      (image, index) => `
        <figure class="product-detail-image">
          <img src="${image}" alt="${escapeHtml(product.title)} ${index + 1}" />
        </figure>
      `
    )
    .join("");

  container.innerHTML = `
    <article class="product-detail glass-panel">
      <p class="product-meta">${escapeHtml(product.category)}</p>
      <h1>${escapeHtml(product.title)}</h1>
      <p class="product-detail-summary">${escapeHtml(product.summary)}</p>
      <p class="product-detail-description">${escapeHtml(product.description)}</p>
      <strong class="product-price product-detail-price">${formatPrice(product.price)} ₽</strong>
      <div class="product-actions">
        <a class="button button--ghost" href="/catalog">${t("product.backCatalog")}</a>
        <button class="button button--solid" type="button" data-add-to-cart="${product.id}">${t("ui.addToCart")}</button>
      </div>
      <h2>${t("product.details")}</h2>
      <ul class="product-details">${details}</ul>
      <div class="product-detail-gallery">${images}</div>
    </article>
  `;

  const addButton = container.querySelector("[data-add-to-cart]");
  addButton?.addEventListener("click", () => addToCart(product.id));
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
  if (window.location.pathname !== "/cart") {
    window.location.assign("/cart");
  }
}

function setupCart() {
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
    node.textContent = `${formatPrice(total)} ₽`;
  });

  containers.forEach((container) => {
    if (!state.cart.length) {
      container.innerHTML = `<p class="empty-state">${t("ui.cartEmpty")}</p>`;
      return;
    }

    container.innerHTML = state.cart
      .map(
        (item) => `
          <div class="cart-row">
            <div>
              <strong>${item.title}</strong>
              <span>${formatPrice(item.price)} ₽</span>
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
  saveSessionDraft();
}

function openCart() {
  window.location.assign("/cart");
}

function closeCart() {
  document.body.style.overflow = "";
}

function openCartFromQuery() {
  // Cart is full-page only.
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
      status.textContent = t("ui.checkoutNeedItem");
      return;
    }

    const formData = new FormData(form);
    state.customer = Object.fromEntries(formData.entries());
    saveJson(CUSTOMER_KEY, state.customer);
    saveSessionDraft();
    status.textContent = t("ui.checkoutSending");

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

      status.textContent = t("ui.checkoutSent");
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

  state.adminPassword = "";
  passwordField.value = "";
  lock.hidden = false;
  form.hidden = true;

  const unlockAdmin = async () => {
    state.adminPassword = passwordField.value.trim();

    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        headers: {
          "x-admin-password": state.adminPassword
        }
      });

      lock.hidden = true;
      form.hidden = false;
      loginStatus.textContent = t("ui.adminUnlocked");
      renderAdminProducts();
    } catch (error) {
      lock.hidden = false;
      form.hidden = true;
      loginStatus.textContent = error.message;
    }
  };

  loginButton.addEventListener("click", async () => {
    await unlockAdmin();
  });

  resetButton.addEventListener("click", () => {
    resetAdminForm();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = t("ui.adminSaving");

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

      formStatus.textContent = t("ui.adminSaved");
      resetAdminForm();
      const savedProductId = state.editingProduct?.id || String(formData.get("id") || "");
      if (savedProductId) {
        clearProductDeletedMark(savedProductId);
      }
      state.products = applyDeletedFilter(await fetchJson("/api/products"));
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
            <strong>${formatPrice(product.price)} ₽</strong>
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
            <button class="button button--ghost" type="button" data-admin-edit="${product.id}">${t("ui.adminEdit")}</button>
            <button class="button button--solid" type="button" data-admin-delete="${product.id}">${t("ui.adminDelete")}</button>
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
      const confirmed = window.confirm(t("ui.adminDeleteConfirm"));
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

        markProductDeleted(button.dataset.adminDelete || "");
        state.products = applyDeletedFilter(await fetchJson("/api/products"));
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
            ${t("ui.adminKeep")}
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
