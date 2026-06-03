import dotenv from "dotenv";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const sourceDataDir = path.join(__dirname, "data");
const runtimeDataDir = process.env.VERCEL ? path.join("/tmp", "orthodox-merch-shop") : sourceDataDir;
const uploadDir = process.env.VERCEL
  ? path.join("/tmp", "orthodox-merch-shop", "uploads")
  : path.join(publicDir, "uploads");
const productsPath = path.join(sourceDataDir, "products.json");
const usersPath = path.join(sourceDataDir, "users.json");
const dbPath = path.join(runtimeDataDir, "app.db");

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = "merch_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_ROTATION_LIMIT = 10;
const securityRateBuckets = new Map();
const BOT_ACTIVATION_TTL_MS = 30 * 60 * 1000;
const DEFAULT_BOT_ACTIVATION_PASSWORD = "BOT-rACQ6LgKcawbCElJ";
const botActivationPassword = String(
  process.env.BOT_ACTIVATION_PASSWORD || DEFAULT_BOT_ACTIVATION_PASSWORD
);

const app = express();
let db;

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
  ["/item", "product.html"],
  ["/cart", "cart.html"],
  ["/delivery", "delivery.html"],
  ["/admin", "admin.html"]
]);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.telegram.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use("/uploads", express.static(uploadDir));

async function ensureStorage() {
  await fs.mkdir(runtimeDataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, digest) {
  const [salt, expected] = String(digest || "").split(":");
  if (!salt || !expected) {
    return false;
  }

  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (expectedBuffer.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(actual, expectedBuffer);
}

function createSessionToken() {
  return `${randomUUID()}-${randomBytes(24).toString("hex")}`;
}

function hashSessionToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email,
    createdAt: user.created_at || user.createdAt
  };
}

function getBearerToken(req) {
  const auth = req.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return "";
}

function parseCookies(req) {
  const raw = req.get("cookie") || "";
  if (!raw) {
    return {};
  }

  return raw.split(";").reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) {
      return acc;
    }

    acc[key] = decodeURIComponent(valueParts.join("="));
    return acc;
  }, {});
}

function getSessionToken(req) {
  const bearer = getBearerToken(req);
  if (bearer) {
    return bearer;
  }

  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME] || "";
}

function setSessionCookie(req, res, token) {
  const isSecure = isProduction || req.protocol === "https" || req.get("x-forwarded-proto") === "https";
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecure,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS
  });
}

function clearSessionCookie(req, res) {
  const isSecure = isProduction || req.protocol === "https" || req.get("x-forwarded-proto") === "https";
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecure,
    path: "/"
  });
}

function rateLimit({ keyPrefix, windowMs, max }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = securityRateBuckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    securityRateBuckets.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    return next();
  };
}

function adminAuthorized(req) {
  const expected = String(process.env.ADMIN_PASSWORD || "");
  if (!expected) {
    return false;
  }

  const headerPassword = req.get("x-admin-password");
  return headerPassword === expected;
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""), "utf8");
  const right = Buffer.from(String(b || ""), "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function getBotActivatedUntilMs() {
  if (!db) {
    return 0;
  }

  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("bot_activated_until_ms");
  const value = Number(row?.value || 0);
  return Number.isFinite(value) ? value : 0;
}

function setBotActivatedUntilMs(untilMs) {
  if (!db) {
    return;
  }

  db.prepare(
    `INSERT INTO app_state (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run("bot_activated_until_ms", String(Math.max(0, Math.floor(Number(untilMs) || 0))));
}

function isBotActivated() {
  return Date.now() < getBotActivatedUntilMs();
}

function getTelegramOrderChatId() {
  const configuredChatId = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  if (configuredChatId) {
    return configuredChatId;
  }

  if (!db) {
    return "";
  }

  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get("telegram_order_chat_id");
  return String(row?.value || "").trim();
}

function setTelegramOrderChatId(chatId) {
  if (!db || !chatId) {
    return;
  }

  db.prepare(
    `INSERT INTO app_state (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run("telegram_order_chat_id", String(chatId));
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

function parseProductRow(row) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    category: row.category,
    summary: row.summary,
    description: row.description,
    accent: row.accent,
    details: JSON.parse(row.details_json || "[]"),
    images: JSON.parse(row.images_json || "[]")
  };
}

function cleanupExpiredSessions() {
  const now = new Date().toISOString();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}

async function migrateJsonToSql() {
  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

  if (productCount === 0) {
    try {
      const raw = await fs.readFile(productsPath, "utf8");
      const products = JSON.parse(raw);
      const stmt = db.prepare(`
        INSERT INTO products (id, title, price, category, summary, description, accent, details_json, images_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      for (const p of Array.isArray(products) ? products : []) {
        stmt.run(
          String(p.id || randomUUID()),
          String(p.title || ""),
          Number(p.price) || 0,
          String(p.category || "Мерч"),
          String(p.summary || ""),
          String(p.description || ""),
          String(p.accent || "#e9e3db"),
          JSON.stringify(Array.isArray(p.details) ? p.details : []),
          JSON.stringify(Array.isArray(p.images) ? p.images : []),
          now
        );
      }
    } catch (error) {
      console.warn("Product JSON->SQL migration skipped:", error.message);
    }
  }

  if (userCount === 0) {
    try {
      const raw = await fs.readFile(usersPath, "utf8");
      const users = JSON.parse(raw);

      const insertUser = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertSession = db.prepare(`
        INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
      `);

      for (const u of Array.isArray(users) ? users : []) {
        const userId = String(u.id || randomUUID());
        const createdAt = String(u.createdAt || new Date().toISOString());
        insertUser.run(
          userId,
          String(u.name || ""),
          normalizeEmail(u.email),
          String(u.passwordHash || ""),
          createdAt
        );

        const sessions = Array.isArray(u.sessions) ? u.sessions : [];
        for (const s of sessions) {
          const tokenHash = s.tokenHash || (s.token ? hashSessionToken(String(s.token)) : "");
          if (!tokenHash) {
            continue;
          }
          const sessionCreatedAt = String(s.createdAt || createdAt);
          const expiresAt = new Date(Date.parse(sessionCreatedAt) + SESSION_MAX_AGE_MS).toISOString();
          insertSession.run(tokenHash, userId, sessionCreatedAt, expiresAt);
        }
      }
    } catch (error) {
      console.warn("User JSON->SQL migration skipped:", error.message);
    }
  }
}

async function initDb() {
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      accent TEXT NOT NULL,
      details_json TEXT NOT NULL,
      images_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);

  await migrateJsonToSql();
  cleanupExpiredSessions();

  const existingState = db.prepare("SELECT 1 FROM app_state WHERE key = ?").get("bot_activated_until_ms");
  if (!existingState) {
    db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run("bot_activated_until_ms", "0");
  }
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

  const orderChatId = getTelegramOrderChatId();
  if (!process.env.TELEGRAM_BOT_TOKEN || !orderChatId) {
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
        chat_id: orderChatId,
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

async function sendTelegramText(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  }).catch(() => {});
}

async function ensureTelegramWebhook() {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "");
  if (!token) {
    return;
  }

  const baseUrl = String(process.env.PUBLIC_BASE_URL || "").trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!baseUrl) {
    return;
  }

  const webhookUrl = `${baseUrl.replace(/\/+$/, "")}/api/telegram/webhook`;
  const body = {
    url: webhookUrl,
    drop_pending_updates: false
  };

  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = String(process.env.TELEGRAM_WEBHOOK_SECRET);
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.warn(`Failed to set Telegram webhook: ${response.status} ${details}`);
    return;
  }

  console.log(`Telegram webhook ensured at ${webhookUrl}`);
}

app.get("/api/settings", (_req, res) => {
  res.json({
    adminProtected: true,
    botActive: isBotActivated(),
    botActivationTtlMs: BOT_ACTIVATION_TTL_MS
  });
});

app.post("/api/admin/login", (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Admin access is disabled: ADMIN_PASSWORD is not set." });
  }

  if (adminAuthorized(req)) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: "Неверный пароль администратора." });
});

app.post(
  "/api/telegram/webhook",
  rateLimit({ keyPrefix: "telegram-webhook", windowMs: 5 * 60 * 1000, max: 300 }),
  async (req, res) => {
    const secretExpected = String(process.env.TELEGRAM_WEBHOOK_SECRET || "");
    const secretHeader = String(req.get("x-telegram-bot-api-secret-token") || "");
    if (secretExpected && !timingSafeEqualString(secretExpected, secretHeader)) {
      return res.status(401).json({ error: "Invalid Telegram webhook secret." });
    }

    const message = req.body?.message;
    const chatId = String(message?.chat?.id || "");
    const text = String(message?.text || "").trim();
    const configuredChatId = getTelegramOrderChatId();

    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }

    if (configuredChatId && chatId !== configuredChatId) {
      await sendTelegramText(chatId, "Команда недоступна для этого чата.");
      return res.status(200).json({ ok: true });
    }

    if (text === "/start") {
      await sendTelegramText(
        chatId,
        [
          "Бот магазина подключен.",
          "",
          "Команды:",
          "/activate <пароль>",
          "/status",
          "/deactivate"
        ].join("\n")
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/status") {
      const activeUntilMs = getBotActivatedUntilMs();
      const statusText = isBotActivated()
        ? `Бот активен до ${new Date(activeUntilMs).toLocaleString("ru-RU")}`
        : "Бот сейчас выключен для заказов.";
      await sendTelegramText(chatId, statusText);
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith("/activate ")) {
      const providedPassword = text.replace("/activate ", "").trim();
      if (!timingSafeEqualString(providedPassword, botActivationPassword)) {
        await sendTelegramText(chatId, "Неверный пароль активации.");
        return res.status(200).json({ ok: true });
      }

      const activeUntilMs = Date.now() + BOT_ACTIVATION_TTL_MS;
      setBotActivatedUntilMs(activeUntilMs);
      setTelegramOrderChatId(chatId);
      await sendTelegramText(chatId, `Бот активирован до ${new Date(activeUntilMs).toLocaleString("ru-RU")}`);
      return res.status(200).json({ ok: true });
    }

    if (text === "/deactivate") {
      setBotActivatedUntilMs(0);
      await sendTelegramText(chatId, "Бот выключен.");
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  }
);

app.get("/api/products", async (_req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(rows.map(parseProductRow));
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/:id", async (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Товар не найден." });
    }

    return res.json(parseProductRow(row));
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", requireAdmin, upload.array("images", 12), async (req, res, next) => {
  try {
    const images = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const productId =
      req.body.id?.trim() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    if (images.length < 3) {
      return res.status(400).json({ error: "Добавьте минимум 3 изображения товара." });
    }

    const product = {
      id: productId,
      title: String(req.body.title || "").trim().slice(0, 140),
      price: Number(req.body.price),
      category: String(req.body.category || "Мерч").trim().slice(0, 80),
      summary: String(req.body.summary || "").trim().slice(0, 280),
      description: String(req.body.description || "").trim().slice(0, 2000),
      accent: String(req.body.accent || "#e9e3db").trim().slice(0, 20),
      details: normalizeDetails(req.body.details),
      images
    };

    if (!product.title || !Number.isFinite(product.price) || product.price <= 0) {
      return res.status(400).json({ error: "Заполните название и цену товара." });
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO products (id, title, price, category, summary, description, accent, details_json, images_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      product.id,
      product.title,
      Math.round(product.price),
      product.category,
      product.summary,
      product.description,
      product.accent,
      JSON.stringify(product.details),
      JSON.stringify(product.images),
      now
    );

    return res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.put("/api/products/:id", requireAdmin, upload.array("images", 12), async (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: "Товар не найден." });
    }

    const current = parseProductRow(row);
    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const requestedExistingImages = normalizeImages(req.body.existingImages);
    const existingImages = requestedExistingImages.filter((imagePath) => current.images.includes(imagePath));
    const mergedImages = [...new Set([...existingImages, ...uploadedImages])];

    if (mergedImages.length < 3) {
      return res.status(400).json({ error: "У товара должно остаться минимум 3 изображения." });
    }

    const nextProduct = {
      ...current,
      title: String(req.body.title || "").trim() || current.title,
      price: Number(req.body.price) || current.price,
      category: String(req.body.category || "").trim() || current.category,
      summary: String(req.body.summary || "").trim() || current.summary,
      description: String(req.body.description || "").trim() || current.description,
      accent: String(req.body.accent || "").trim() || current.accent,
      details: normalizeDetails(req.body.details),
      images: mergedImages
    };

    db.prepare(
      `UPDATE products
       SET title = ?, price = ?, category = ?, summary = ?, description = ?, accent = ?, details_json = ?, images_json = ?
       WHERE id = ?`
    ).run(
      nextProduct.title.slice(0, 140),
      Math.round(Number(nextProduct.price) || 0),
      nextProduct.category.slice(0, 80),
      nextProduct.summary.slice(0, 280),
      nextProduct.description.slice(0, 2000),
      nextProduct.accent.slice(0, 20),
      JSON.stringify(nextProduct.details),
      JSON.stringify(nextProduct.images),
      req.params.id
    );

    const removedImages = current.images.filter((imagePath) => !mergedImages.includes(imagePath));
    await Promise.all(
      removedImages
        .filter((imagePath) => imagePath.startsWith("/uploads/"))
        .map((imagePath) => fs.rm(path.join(uploadDir, path.basename(imagePath)), { force: true }))
    );

    return res.json(nextProduct);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: "Товар не найден." });
    }

    const product = parseProductRow(row);
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);

    await Promise.all(
      product.images
        .filter((imagePath) => imagePath.startsWith("/uploads/"))
        .map((imagePath) => fs.rm(path.join(uploadDir, path.basename(imagePath)), { force: true }))
    );

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/orders",
  rateLimit({ keyPrefix: "orders", windowMs: 10 * 60 * 1000, max: 25 }),
  async (req, res, next) => {
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

      if (!isBotActivated()) {
        return res.status(403).json({ error: "Telegram-бот выключен. Активируйте его командой /activate <пароль> в Telegram." });
      }

      await sendTelegramOrder({ customer, items, total });
      return res.status(201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

for (const [route, fileName] of staticPages.entries()) {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(publicDir, fileName));
  });
}

app.get("/item/:id", (_req, res) => {
  res.sendFile(path.join(publicDir, "product.html"));
});

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
  .then(initDb)
  .then(ensureTelegramWebhook)
  .then(() => {
    if (!process.env.ADMIN_PASSWORD && !process.env.VERCEL) {
      throw new Error("ADMIN_PASSWORD is required. Refusing to start without admin protection.");
    }

    app.listen(port, host, () => {
      if (!process.env.BOT_ACTIVATION_PASSWORD) {
        console.warn(
          `BOT_ACTIVATION_PASSWORD is not set. Temporary generated password in use: ${DEFAULT_BOT_ACTIVATION_PASSWORD}`
        );
      }
      console.log(`Storefront is running on http://localhost:${port}`);
      console.log(`Storefront is running on http://${host}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
