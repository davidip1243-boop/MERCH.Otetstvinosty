const teeColours = [
  { id: "white", name: "Белая", visual: "chalk", price: 3000, images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"] },
  { id: "graphite", name: "Графитовая", visual: "wine", images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg", "06.jpg", "07.jpg"] },
  { id: "banana", name: "Банановая", visual: "canvas", images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"] },
  { id: "light-brown", name: "Светло-коричневая", visual: "canvas", images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"] },
  { id: "light-grey", name: "Светло-серая", visual: "pine", images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"] },
  { id: "burgundy", name: "Бордовая", visual: "wine", images: ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"] },
];

function createTeeProduct(colour) {
  return {
    id: `tee-${colour.id}`,
    name: `Футболка ${colour.name.toLowerCase()}`,
    type: "tshirts",
    price: colour.price || 2500,
    color: colour.visual,
    sizes: ["S", "M", "L", "XL", "XXL"],
    lead: "Плотный хлопок, свободная посадка, спокойный принт команды.",
    note: "Для встреч, поездок и обычного воскресенья.",
    details: ["Плотная посадка oversize", "Мягкий хлопок", "Размер выбирается в карточке товара"],
    variants: [
      {
        ...colour,
        imagePath: `/assets/images/products/tee-team/${colour.id}`,
        images: colour.images || ["01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg"],
      },
    ],
  };
}

const defaultProducts = [
  {
    id: "hoodie-road",
    name: "Худи «Дорога»",
    type: "hoodies",
    price: 4900,
    color: "pine",
    sizes: ["S", "M", "L", "XL", "XXL"],
    lead: "Теплое худи свободного кроя для поездок, встреч и долгих прогулок.",
    note: "Базовый цвет и мягкая посадка на каждый день.",
    details: ["Мягкий футер", "Свободная посадка", "Размер выбирается в карточке товара"],
    variants: [{ id: "default", name: "Базовый", visual: "pine", imagePath: "/assets/images/products/defaults/hoodie-road", images: ["01.svg", "02.svg"] }],
  },
  {
    id: "longsleeve-light",
    name: "Лонгслив «Свет»",
    type: "long-sleeves",
    price: 3300,
    color: "chalk",
    sizes: ["S", "M", "L", "XL", "XXL"],
    lead: "Легкий лонгслив с длинным рукавом и спокойной вышивкой.",
    note: "Лаконичная база для прохладного дня.",
    details: ["Мягкий хлопок", "Длинный рукав", "Размер выбирается в карточке товара"],
    variants: [{ id: "default", name: "Светлый", visual: "chalk", imagePath: "/assets/images/products/defaults/longsleeve-light", images: ["01.svg", "02.svg"] }],
  },
  {
    id: "tote-dream",
    name: "Шопер «Путь»",
    type: "shoppers",
    price: 1800,
    color: "canvas",
    sizes: [],
    lead: "Плотный шопер для книг, вещей в дорогу и всего нужного на каждый день.",
    note: "Практичная вещь с тихим характером.",
    details: ["Плотный канвас", "Усиленные ручки", "Внутреннее отделение"],
    variants: [{ id: "default", name: "Канвас", visual: "canvas", imagePath: "/assets/images/products/defaults/tote-dream", images: ["01.svg", "02.svg"] }],
  },
];

const productTypeLabels = {
  tshirts: "Футболки",
  hoodies: "Худи",
  "long-sleeves": "Лонгсливы",
  shoppers: "Шоперы",
};

const products = [...teeColours.map(createTeeProduct), ...defaultProducts];
const catalogProducts = products.filter(
  (product) => !product.id.startsWith("tee-") || product.id === "tee-white" || product.id === "tee-graphite",
);
const legacyColourProductIds = Object.fromEntries(teeColours.map((colour) => [colour.id, `tee-${colour.id}`]));

const storageKey = "otv-cart-v2";
const themeKey = "otv-theme";
const formatter = new Intl.NumberFormat("ru-RU");

const money = (value) => `${formatter.format(value)} ₽`;
const readCart = () =>
  JSON.parse(localStorage.getItem(storageKey) || "[]").map((item) => {
    const variant = item.variant || "white";
    return {
      ...item,
      id: item.id === "tee-team" ? legacyColourProductIds[variant] || "tee-white" : item.id,
      size: item.size === "ONE" ? "" : item.size,
      variant,
      quantity: Math.max(1, Number(item.quantity) || 1),
    };
  });

function writeCart(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
  renderCart();
  updateCartCount();
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function cartKey(id, size = "", variant = "") {
  return [id, size, variant].filter(Boolean).join("::");
}

function upsertCartItem(id, size = "", variant = "", delta = 1) {
  const items = readCart();
  const key = cartKey(id, size, variant);
  const existing = items.find((item) => cartKey(item.id, item.size, item.variant) === key);

  if (existing) {
    existing.quantity += delta;
  } else if (delta > 0) {
    items.push({ id, size, variant, quantity: delta });
  }

  writeCart(items.filter((item) => item.quantity > 0));
}

function getCartQuantity(id, size = "", variant = "") {
  const item = readCart().find((entry) => cartKey(entry.id, entry.size, entry.variant) === cartKey(id, size, variant));
  return item?.quantity || 0;
}

function selectedProductSize(productId) {
  return document.querySelector(`[data-size-group="${productId}"] .size-chip.is-active`)?.dataset.size || "";
}

function productVariant(product, variantId) {
  return product.variants.find((variant) => variant.id === variantId) || product.variants[0];
}

function selectedProductVariant(productId) {
  return document.querySelector(`[data-variant-group="${productId}"] .variant-chip.is-active`)?.dataset.variant || productById(productId)?.variants?.[0]?.id || "";
}

function productGallery(product, variantId) {
  const variant = productVariant(product, variantId);
  return `
    <div class="product-detail-gallery" data-gallery-root data-gallery-variant="${variant.id}">
      <div class="product-visual product-visual--${variant.visual}" data-product-main-visual>
        <span class="garment garment--${product.id}" aria-hidden="true"></span>
        <img class="product-photo" src="${variant.imagePath}/${variant.images[0]}" alt="${product.name}, ${variant.name}" onerror="this.remove()" />
      </div>
      <div class="product-thumbs" aria-label="Фото цвета ${variant.name}">
        ${variant.images
          .map(
            (image, index) => `
              <button class="product-thumb ${image ? "" : "is-pending"} ${index === 0 ? "is-active" : ""}" type="button" ${image ? `data-gallery-image="${variant.imagePath}/${image}" data-gallery-alt="${product.name}, ${variant.name}, фото ${index + 1}"` : "disabled"} aria-label="${image ? `${variant.name}, фото ${index + 1}` : "Фото скоро появится"}">
                <span class="product-visual--${variant.visual}"></span>
                ${image ? `<img src="${variant.imagePath}/${image}" alt="" onerror="this.remove()" />` : ""}
                ${image ? `<b>${String(index + 1).padStart(2, "0")}</b>` : ""}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function selectGalleryImage(galleryButton) {
  if (!galleryButton || galleryButton.disabled) return;

  const gallery = galleryButton.closest("[data-gallery-root]");
  const main = gallery?.querySelector("[data-product-main-visual]");
  const image = main?.querySelector(".product-photo");

  if (image) {
    image.src = galleryButton.dataset.galleryImage;
    image.alt = galleryButton.dataset.galleryAlt;
  }

  gallery?.querySelectorAll("[data-gallery-image]").forEach((button) => {
    button.classList.toggle("is-active", button === galleryButton);
  });
}

function productCard(product, featured = false) {
  const variant = product.variants[0];
  return `
    <article class="product-card reveal" data-product-card data-product-open="${product.id}" data-type="${product.type}">
      <div class="product-visual product-visual--${product.color}" aria-hidden="true">
        <span class="garment garment--${product.id}"></span>
        <img class="product-photo" src="${variant.imagePath}/${variant.images[0]}" alt="" onerror="this.remove()" />
      </div>
      <div class="product-info">
        <span class="product-kind">${productTypeLabels[product.type] || "Мерч"}</span>
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
  const activeVariant = product.variants[0].id;
  const quantity = getCartQuantity(product.id, activeSize, activeVariant);
  return `
    <section class="product-detail-page reveal" data-product-detail="${product.id}">
      <div data-product-gallery>${productGallery(product, activeVariant)}</div>
      <div class="product-detail-copy">
        <p class="label">Товар</p>
        <h1>${product.name}</h1>
        <p>${product.lead}</p>
        <strong class="product-detail-price">${money(product.price)}</strong>
        ${
          product.variants.length > 1
            ? `<div class="variant-row" data-variant-group="${product.id}" aria-label="Цвет футболки">
                ${product.variants
                  .map(
                    (variant, index) => `
                      <button class="variant-chip ${index === 0 ? "is-active" : ""}" data-variant="${variant.id}" type="button">
                        <span class="variant-chip__dot variant-chip__dot--${variant.id}"></span>${variant.name}
                      </button>
                    `,
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${
          product.sizes.length
            ? `<div class="size-row" data-size-group="${product.id}">
                ${product.sizes
                  .map(
                    (size) => `
                      <button class="size-chip ${size === activeSize ? "is-active" : ""}" data-size="${size}" type="button">
                        ${size}
                      </button>
                    `,
                  )
                  .join("")}
              </div>`
            : ""
        }
        <div data-product-controls="${product.id}">
          ${productControls(product.id, activeSize, activeVariant, quantity)}
        </div>
        <ul class="product-detail-list">
          ${product.details.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

function productControls(id, size, variant, quantity = getCartQuantity(id, size, variant)) {
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
  const variant = selectedProductVariant(id);
  controls.innerHTML = productControls(id, size, variant);
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
    grid.innerHTML = catalogProducts.map((product) => productCard(product)).join("");
  }

  if (featured) {
    featured.innerHTML = catalogProducts.slice(0, 3).map((product) => productCard(product, true)).join("");
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
          <div class="cart-row-visual product-visual--${productVariant(product, item.variant).visual}" aria-hidden="true"></div>
          <div>
            <strong>${product.name}</strong>
            <span>${productVariant(product, item.variant).name}${item.size ? ` · Размер: ${item.size}` : ""}</span>
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
        colour: productVariant(product, item.variant).name,
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
    window.open(`/item/${openButton.dataset.openProduct}`, "_blank", "noopener");
    return;
  }

  const openCard = event.target.closest("[data-product-open]");
  if (openCard && !event.target.closest("button, a")) {
    window.open(`/item/${openCard.dataset.productOpen}`, "_blank", "noopener");
    return;
  }

  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const id = addButton.dataset.addToCart;
    upsertCartItem(id, selectedProductSize(id), selectedProductVariant(id));
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
    upsertCartItem(id, selectedProductSize(id), selectedProductVariant(id), Number(productDelta.dataset.productDelta));
    refreshProductControls(id);
  }

  const variantButton = event.target.closest("[data-variant]");
  if (variantButton) {
    const detail = variantButton.closest("[data-product-detail]");
    const product = productById(detail?.dataset.productDetail);
    if (!product) return;
    detail.querySelectorAll("[data-variant]").forEach((button) => {
      button.classList.toggle("is-active", button === variantButton);
    });
    const galleryHost = detail.querySelector("[data-product-gallery]");
    if (galleryHost) galleryHost.innerHTML = productGallery(product, variantButton.dataset.variant);
    refreshProductControls(product.id);
  }

  const galleryButton = event.target.closest("[data-gallery-image]");
  if (galleryButton) {
    selectGalleryImage(galleryButton);
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

let gallerySwipeStart = null;

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;

  const visual = event.target.closest("[data-gallery-root] [data-product-main-visual]");
  if (!visual) return;

  gallerySwipeStart = {
    gallery: visual.closest("[data-gallery-root]"),
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
});

document.addEventListener("pointerup", (event) => {
  if (!gallerySwipeStart || gallerySwipeStart.pointerId !== event.pointerId) return;

  const { gallery, x, y } = gallerySwipeStart;
  gallerySwipeStart = null;

  const horizontalDistance = event.clientX - x;
  const verticalDistance = event.clientY - y;
  if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;

  const photos = [...gallery.querySelectorAll("[data-gallery-image]")];
  if (photos.length < 2) return;

  const activeIndex = Math.max(0, photos.findIndex((button) => button.classList.contains("is-active")));
  const direction = horizontalDistance < 0 ? 1 : -1;
  const nextIndex = (activeIndex + direction + photos.length) % photos.length;
  selectGalleryImage(photos[nextIndex]);
});

document.addEventListener("pointercancel", () => {
  gallerySwipeStart = null;
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select, [contenteditable='true']") || target.isContentEditable)
  ) {
    return;
  }

  event.preventDefault();
  const distance = Math.max(96, Math.round(window.innerHeight * 0.12));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollBy({
    top: event.key === "ArrowDown" ? distance : -distance,
    behavior: reducedMotion ? "auto" : "smooth",
  });
});
