# orthodox-merch-shop

Minimal merch storefront with an Apple-inspired visual style, local cart persistence, admin product management, and Telegram order delivery.

## Features

- Multi-page storefront: Home, Catalog, About, Delivery
- Apple-style glass navigation with soft rounded corners
- Cart without registration
- Customer data saved in `LocalStorage`
- Admin panel for creating, editing, deleting products and uploading product photos
- Product gallery with at least 3 photos per item
- Server-side order submission to Telegram bot API or a webhook
- Custom `404` page

## Tech

- Node.js
- Express
- Multer
- Vanilla HTML, CSS, JavaScript

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

For development:

```bash
npm run dev
```

## Environment variables

Fill `.env` with one of these delivery methods for orders:

- `TELEGRAM_WEBHOOK_URL`
- or `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`

Optional:

- `ADMIN_PASSWORD`
- `PORT`

## Project structure

```text
.
├── data/products.json
├── public/
│   ├── assets/images/
│   ├── uploads/
│   ├── *.html
│   ├── main.js
│   └── styles.css
├── server.js
└── package.json
```
