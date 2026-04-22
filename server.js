import dotenv from "dotenv";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(publicDir, "uploads");
const productsPath = path.join(dataDir, "products.json");
const port = Number(process.env.PORT) || 3000;

const app = express();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 12,
    fileSize: 8 * 1024 * 1024
  }
});

const staticPages = new Map([
  ["/", "index.html"],
  ["/catalog", "catalog.html"],
  ["/cart", "cart.html"],
  ["/delivery", "delivery.html"],
  ["/admin", "admin.html"]
]);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use("/uploads", express.static(uploadDir));

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });

  try {
    await fs.access(productsPath);
  } catch {
    await fs.writeFile(productsPath, "[]\n", "utf8");
  }
}

async function readProducts() {
  const raw = await fs.readFile(productsPath, "utf8");
  return JSON.parse(raw);
}

async function writeProducts(products) {
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), "utf8");
}

function adminAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return true;
  }

  const headerPassword = req.get("x-admin-password");
  return headerPassword === expected;
}

function requireAdmin(req, res, next) {
  if (adminAuthorized(req)) {
    return next();
  }

  return res.status(401).json({ error: "Admin authorization failed" });
}

function normalizeDetails(rawValue) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.filter(Boolean);
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch {
    return String(rawValue)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeImages(rawValue) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.filter(Boolean);
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU").format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendTelegramOrder(order) {
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.title} × ${item.quantity} — ${formatPrice(item.price * item.quantity)} ₽`
    )
    .join("\n");

  const message = [
    "<b>Новый заказ</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(order.customer.fullName)}`,
    `<b>Телефон:</b> ${escapeHtml(order.customer.phone)}`,
    `<b>Адрес:</b> ${escapeHtml(order.customer.address)}`,
    `<b>Tg:</b> ${escapeHtml(order.customer.telegram || "не указан")}`,
    "",
    "<b>Состав заказа:</b>",
    escapeHtml(itemsText),
    "",
    `<b>Итого:</b> ${formatPrice(order.total)} ₽`
  ].join("\n");

  if (process.env.TELEGRAM_WEBHOOK_URL) {
    const response = await fetch(process.env.TELEGRAM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    return;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    throw new Error("Telegram env vars are not configured");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API failed: ${response.status} ${errorText}`);
  }
}

app.get("/api/settings", (_req, res) => {
  res.json({
    adminProtected: Boolean(process.env.ADMIN_PASSWORD)
  });
});

app.post("/api/admin/login", (req, res) => {
  if (adminAuthorized(req)) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: "Неверный пароль администратора." });
});

app.get("/api/products", async (_req, res, next) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", requireAdmin, upload.array("images", 12), async (req, res, next) => {
  try {
    const products = await readProducts();
    const images = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const productId =
      req.body.id?.trim() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    if (images.length < 3) {
      return res.status(400).json({ error: "Добавьте минимум 3 изображения товара." });
    }

    const product = {
      id: productId,
      title: req.body.title?.trim(),
      price: Number(req.body.price),
      category: req.body.category?.trim() || "Мерч",
      summary: req.body.summary?.trim() || "",
      description: req.body.description?.trim() || "",
      accent: req.body.accent?.trim() || "#e9e3db",
      details: normalizeDetails(req.body.details),
      images
    };

    if (!product.title || !product.price) {
      return res.status(400).json({ error: "Заполните название и цену товара." });
    }

    products.unshift(product);
    await writeProducts(products);
    return res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.put("/api/products/:id", requireAdmin, upload.array("images", 12), async (req, res, next) => {
  try {
    const products = await readProducts();
    const index = products.findIndex((product) => product.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Товар не найден." });
    }

    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const existingImages = normalizeImages(req.body.existingImages);
    const mergedImages = [...existingImages, ...uploadedImages];

    if (mergedImages.length < 3) {
      return res.status(400).json({ error: "У товара должно остаться минимум 3 изображения." });
    }

    const current = products[index];
    const nextProduct = {
      ...current,
      title: req.body.title?.trim() || current.title,
      price: Number(req.body.price) || current.price,
      category: req.body.category?.trim() || current.category,
      summary: req.body.summary?.trim() || current.summary,
      description: req.body.description?.trim() || current.description,
      accent: req.body.accent?.trim() || current.accent,
      details: normalizeDetails(req.body.details),
      images: mergedImages
    };

    products[index] = nextProduct;
    await writeProducts(products);

    const removedImages = current.images.filter((imagePath) => !mergedImages.includes(imagePath));
    await Promise.all(
      removedImages
        .filter((imagePath) => imagePath.startsWith("/uploads/"))
        .map((imagePath) => fs.rm(path.join(publicDir, imagePath), { force: true }))
    );

    return res.json(nextProduct);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Товар не найден." });
    }

    const nextProducts = products.filter((item) => item.id !== req.params.id);
    await writeProducts(nextProducts);

    await Promise.all(
      product.images
        .filter((imagePath) => imagePath.startsWith("/uploads/"))
        .map((imagePath) => fs.rm(path.join(publicDir, imagePath), { force: true }))
    );

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { customer, items, total } = req.body;

    if (
      !customer?.fullName ||
      !customer?.phone ||
      !customer?.address ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({ error: "Заполните данные клиента и добавьте товары в корзину." });
    }

    await sendTelegramOrder({ customer, items, total });
    return res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

for (const [route, fileName] of staticPages.entries()) {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(publicDir, fileName));
  });
}

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((req, res) => {
  if (req.method === "GET") {
    return res.status(404).sendFile(path.join(publicDir, "404.html"));
  }

  return res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: error.message || "Внутренняя ошибка сервера."
  });
});

ensureStorage()
  .then(() => {
    app.listen(port, () => {
      console.log(`Storefront is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
