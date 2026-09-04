# EMI Products Backend

REST API for a full-stack assignment that lists consumer products and their mutual-fund-backed EMI (installment) plans. Clients can fetch a product catalog, then load a single product with variants and nested EMI options (tenure, monthly amount, interest, cashback).

## Tech stack

- **Node.js** + **Express** — HTTP API
- **MongoDB** + **Mongoose** — persistence and schemas
- **dotenv** — environment configuration
- **cors** — cross-origin access for a frontend
- **nodemon** — local development reload

## Setup

```bash
git clone <your-repo-url>
cd Backend

npm install

cp .env.example .env
```

Edit `.env` and set `MONGODB_URI` to your database (local MongoDB or Atlas). Keep `PORT=5001` unless you need another port. Set `IMAGE_BASE_URL` to this API’s public origin so seed writes absolute image URLs (local or production).

```env
MONGODB_URI=mongodb://127.0.0.1:27017/emi_products
PORT=5001
IMAGE_BASE_URL=http://localhost:5001
```

Studio JPGs in `public/images/` are served at `GET /images/<filename>`. `npm run seed` stores `${IMAGE_BASE_URL}/images/<filename>` on each variant.

Load sample products and EMI plans (clears existing `Product` and `EMIPlan` documents first):

```bash
npm run seed
```

Start the API:

```bash
# development (nodemon)
npm run dev

# production
npm start
```

The server logs `Server running on port 5000` (or your `PORT`) when it is ready. `GET /health` returns `{ "status": "ok" }`.

## Data models

### Product

| Field | Type | Rules |
| --- | --- | --- |
| `slug` | String | Required, unique (e.g. `iphone-17-pro`) |
| `name` | String | Required |
| `brand` | String | Required |
| `placement` | String | `deals` \| `hero` \| `catalogue` — homepage section |
| `dealTag` | String | Label for the Great Deals strip (e.g. `Best Seller`) |
| `variants` | Array | At least **two** variants |
| `variants[].variantId` | String | Required (e.g. `256gb-orange`) |
| `variants[].label` | String | Required (e.g. `256GB, Orange`) |
| `variants[].mrp` | Number | Required, ≥ 0 |
| `variants[].price` | Number | Required, ≥ 0 |
| `variants[].images` | [String] | Image URLs |

Mongoose also stores `createdAt` and `updatedAt`.

### EMIPlan

| Field | Type | Rules |
| --- | --- | --- |
| `productSlug` | String | Required (matches `Product.slug`) |
| `variantId` | String | Required (matches a variant on that product) |
| `tenureMonths` | Number | Required, ≥ 1 |
| `monthlyAmount` | Number | Required, ≥ 0 |
| `interestRate` | Number | Required (e.g. `0` or `10.5`) |
| `cashback` | Number | Default `0` |

A unique compound index enforces one plan per `(productSlug, variantId, tenureMonths)`.

**Seeded EMI rules**

- Tenures: 3, 6, 12, 24, 36 months
- 3–24 months: **0%** interest; monthly amount = selling price ÷ tenure (rounded)
- 36 months: **10.5%** reducing-balance EMI
- Cashback: ₹1,000–₹7,500 by product tier and tenure

## API endpoints

Base URL (local): `http://localhost:5001`  
Production: `https://onefi-assignment-nzq0.onrender.com`

Also: `GET /health` → `{ "status": "ok" }`. Static photos: `GET /images/<filename>.jpg`.

### `GET /api/products`

Returns a compact list for catalog views.

**Request**

```http
GET /api/products
```

**Response** `200`

```json
[
  {
    "slug": "iphone-17-pro",
    "name": "iPhone 17 Pro",
    "brand": "Apple",
    "thumbnail": "http://localhost:5001/images/iphone-17-pro-silver.jpg",
    "startingPrice": 127400,
    "startingEmi": 5308,
    "placement": "deals"
  },
  {
    "slug": "samsung-galaxy-s24-ultra",
    "name": "Samsung Galaxy S24 Ultra",
    "brand": "Samsung",
    "thumbnail": "http://localhost:5001/images/samsung-galaxy-s24-ultra-black.jpg",
    "startingPrice": 121999
  },
  {
    "slug": "oneplus-12",
    "name": "OnePlus 12",
    "brand": "OnePlus",
    "thumbnail": "http://localhost:5001/images/oneplus-12-emerald.jpg",
    "startingPrice": 54999
  }
]
```

- `thumbnail` is the first image of the first variant.
- `startingPrice` is the lowest variant `price`.

### `GET /api/products/deals`

Homepage Great Deals strip: products with `placement: "deals"`, plus `mrp`, `discountPercent`, and `dealTag`. Hero and catalogue phones come from `GET /api/products` filtered by `placement`.

**Response** `200`

```json
[
  {
    "slug": "iphone-17-pro",
    "name": "iPhone 17 Pro",
    "brand": "Apple",
    "thumbnail": "http://localhost:5001/images/iphone-17-pro-silver.jpg",
    "startingPrice": 127400,
    "mrp": 134900,
    "discountPercent": 6,
    "dealTag": "Best Seller"
  }
]
```

Must be registered **before** `GET /api/products/:slug` so `deals` is not treated as a slug.

### `GET /api/products/:slug`

Returns one product with variants and nested EMI plans (matched on `productSlug` + `variantId`).

**Request**

```http
GET /api/products/iphone-17-pro
```

**Response** `200`

```json
{
  "slug": "iphone-17-pro",
  "name": "iPhone 17 Pro",
  "brand": "Apple",
  "variants": [
    {
      "variantId": "256gb-silver",
      "label": "256GB, Silver",
      "mrp": 134900,
      "price": 127400,
      "images": [
        "http://localhost:5001/images/iphone-17-pro-silver.jpg"
      ],
      "emiPlans": [
        {
          "tenureMonths": 3,
          "monthlyAmount": 42467,
          "interestRate": 0,
          "cashback": 1000
        },
        {
          "tenureMonths": 6,
          "monthlyAmount": 21233,
          "interestRate": 0,
          "cashback": 2000
        },
        {
          "tenureMonths": 12,
          "monthlyAmount": 10617,
          "interestRate": 0,
          "cashback": 3500
        },
        {
          "tenureMonths": 24,
          "monthlyAmount": 5308,
          "interestRate": 0,
          "cashback": 5000
        },
        {
          "tenureMonths": 36,
          "monthlyAmount": 4141,
          "interestRate": 10.5,
          "cashback": 7500
        }
      ]
    },
    {
      "variantId": "256gb-orange",
      "label": "256GB, Orange",
      "mrp": 134900,
      "price": 127400,
      "images": [
        "http://localhost:5001/images/iphone-17-pro-orange.jpg"
      ],
      "emiPlans": [
        {
          "tenureMonths": 3,
          "monthlyAmount": 42467,
          "interestRate": 0,
          "cashback": 1000
        },
        {
          "tenureMonths": 6,
          "monthlyAmount": 21233,
          "interestRate": 0,
          "cashback": 2000
        },
        {
          "tenureMonths": 12,
          "monthlyAmount": 10617,
          "interestRate": 0,
          "cashback": 3500
        },
        {
          "tenureMonths": 24,
          "monthlyAmount": 5308,
          "interestRate": 0,
          "cashback": 5000
        },
        {
          "tenureMonths": 36,
          "monthlyAmount": 4141,
          "interestRate": 10.5,
          "cashback": 7500
        }
      ]
    }
  ]
}
```

**Response** `404` (unknown slug)

```json
{
  "error": "Not found",
  "message": "No product found with slug \"unknown-phone\""
}
```

**Response** `500` (unexpected server/database errors)

```json
{
  "error": "Internal server error",
  "message": "Could not fetch product. Please try again later."
}
```

## npm scripts

| Script | Command |
| --- | --- |
| `npm start` | `node server.js` |
| `npm run dev` | `nodemon server.js` |
| `npm run seed` | `node seed.js` (destructive: clears then inserts sample products/EMI) |
| `npm run migrate:images` | Rewrite `localhost` image hosts to `IMAGE_BASE_URL` without deleting data |

## Image URL migration

Production documents may still store `http://localhost:5001/images/...`. This does **not** wipe the database.

```bash
# .env must have MONGODB_URI
IMAGE_BASE_URL=https://onefi-assignment-nzq0.onrender.com npm run migrate:images
```

Do **not** put `npm run seed` on Render Pre-Deploy. Seed only when you intentionally want a reset.

## Deploy (Render)

Live API: `https://onefi-assignment-nzq0.onrender.com`

1. Push this repo to GitHub.
2. Render Web Service, start command `npm start`.
3. Env: `MONGODB_URI`, `IMAGE_BASE_URL=https://onefi-assignment-nzq0.onrender.com` (`PORT` is injected).
4. First-time data only: Render **Shell** → `npm run seed` (once). Later image-host fixes: `npm run migrate:images`.
5. Frontend `VITE_API_BASE_URL` should point at this host.

Do not commit `.env`. Use `.env.example` as the template.
