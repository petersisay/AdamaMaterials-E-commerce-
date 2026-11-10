# ♻️ Revola — Managed Reclaimed Materials Marketplace (Web & Backend)

[![CI Pipeline](https://img.shields.io/badge/CI-Passing-success?style=flat-square&logo=githubactions)](https://github.com/Revola-MarketPlace/Revola)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#)

> **Revola** is an enterprise-grade, managed circular marketplace engineered specifically for Adama, Ethiopia. The platform connects demolition contractors, recyclers, fabricators, and builders to source, list, trade, and repurpose high-value salvaged and circular construction materials (Metals, Lumber, Masonry, Electrical, and Industrial Plastics).

---

## 📑 Table of Contents

- [Key Platform Features](#-key-platform-features)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (`server/`)](#backend-setup-server)
  - [Frontend Setup (`client/`)](#frontend-setup-client)
  - [Telegram Verification Bot Setup (`bot/`)](#telegram-verification-bot-setup-bot)
- [Environment Configuration](#-environment-configuration)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Security & Data Isolation](#-security--data-isolation)
- [Team Git Branching Workflow](#-team-git-branching-workflow)

---

## 🌟 Key Platform Features

- 🔐 **Multi-Role Authentication & Access Control (RBAC)**: Distinct permissions and isolated data views for `BUYER`, `SELLER`, `STAFF`, and `ADMIN`.
- 🌐 **Google OAuth 2.0 Integration**: Safe account linking that matches existing user identities without creating duplicate accounts.
- 📦 **Dynamic Reclaimed Materials Catalog**: Category filtering (Metals, Timber, Masonry, Plastics), condition grading (`New`, `Like New`, `Good`, `Salvaged`), and live inventory tracking.
- 🛒 **Isolated Cart & Checkout Engine**: Real-time stock validation, automated inventory decrements, and user-scoped carts.
- 🚚 **Dynamic Geocoded Delivery Pricing**: Automatic delivery fee engine calculating vehicle tiers, item weights, weekend surge, and Adama geographic boundary validations.
- 💳 **Chapa Ethiopian Payment Gateway**: Secure hosted Chapa checkout, HMAC-SHA256 webhook signature verification, and automated status transition state machine.
- 🏦 **Manual Bank Transfer & Telegram Bot Verification**: Buyers can submit Commercial Bank of Ethiopia (CBE) transfer receipts via web or Telegram bot; Staff review and verify via a dedicated verification dashboard.
- 🗺️ **Geocoded Supply Depots & Marketplace Map**: Interactive OpenStreetMap visualization of 30+ supply yards and depots across Adama subcities.
- 🌓 **Appearance Mode (Light / Dark / System)**: Tailwind CSS v4 custom dark variant with zero-flash of unstyled content (FOUC).

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│      React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                              SERVICE TIER                              │
│       Node.js + Express.js API Gateway with JWT & Role Middleware      │
│  ├── Auth & Google OAuth Controller                                    │
│  ├── Product Catalog & Marketplace Map                                 │
│  ├── Cart & Checkout Engine                                            │
│  ├── Dynamic Adama Delivery Fee Calculator                             │
│  ├── Chapa & Bank Transfer Payment Engine                              │
│  └── In-App Notifications & Audit Logger                               │
└─────────────────┬───────────────────────────────────┬──────────────────┘
                  │ Mongoose ODM                      │ HTTPS Webhooks
┌─────────────────▼──────────────────┐   ┌────────────▼──────────────────┐
│           DATABASE TIER            │   │         EXTERNAL SERVICES     │
│  MongoDB Atlas (Document Store     │   │  • Chapa Payment Gateway      │
│  & Geospatial Coordinate Indexes)  │   │  • Telegram Verification Bot  │
└────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 📂 Repository Structure

```text
Revola/
├── client/                     # Vite + React 19 Frontend Web Application
│   ├── public/                 # Static assets, logos, and web manifest
│   ├── src/
│   │   ├── components/         # Reusable UI components (ThemeToggle, BrandLogo, Modals)
│   │   ├── context/            # React Contexts (AuthContext, ThemeContext, CartContext)
│   │   ├── layouts/            # Page layouts (MainLayout, DashboardLayout)
│   │   ├── pages/              # Screen views (Home, Marketplace, Checkout, Tracking, Profile)
│   │   ├── services/           # Axios HTTP client and API endpoints
│   │   └── utils/              # Formatting and helper utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # DB connection & Adama service boundary geometry
│   │   ├── controllers/        # Route controllers (auth, product, cart, order, payment)
│   │   ├── middleware/         # JWT auth guard (`protect`), role guard (`restrictTo`)
│   │   ├── models/             # Mongoose schemas (User, Product, Cart, Order, Payment)
│   │   ├── routes/             # Express API routes mounted under /api/v1/*
│   │   ├── services/           # Payment providers (Chapa, Mock, Bank) & Storage
│   │   └── utils/              # Delivery fee calculator, AppError, asyncHandler
│   ├── package.json
│   └── nodemon.json
│
├── bot/                        # Telegram Payment Receipt Verification Bot
│   ├── telegram_verifier_bot.py
│   └── requirements.txt
│
├── docs/                       # Architecture, API specifications, and team guidelines
│   ├── api/                    # Endpoint documentation
│   ├── architecture/           # System design & security models
│   ├── database/               # MongoDB schema diagrams
│   └── team/                   # Team standards & WEBSITE_BACKEND_TEAM.md
│
├── .github/                    # GitHub Actions CI/CD workflows and PR templates
├── README.md
├── CONTRIBUTING.md
├── ARCHITECTURE.md
├── .gitignore
└── .editorconfig
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 6 | Fast, modern, component-driven web user interface |
| **Styling** | Tailwind CSS v4, PostCSS, Lucide Icons | Responsive utility-first design with dark/light themes |
| **Maps** | Leaflet, React-Leaflet, OpenStreetMap | Geocoded material depot mapping and driver tracking |
| **Backend** | Node.js (v20+), Express.js | High-throughput REST API with clean routing |
| **Database** | MongoDB Atlas, Mongoose 8 | Flexible document storage with 2dsphere geo-indexing |
| **Auth** | JWT, bcryptjs, Google OAuth 2.0 | Secure session management and password hashing |
| **Payments** | Chapa API, CBE Bank Transfer | Ethiopian Birr (ETB) online & offline transactions |
| **Bot Service**| Python 3.11, python-telegram-bot | Buyer receipt submission and admin Telegram alerts |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 9.0.0`
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or a MongoDB Atlas connection string.
- **Python**: `>= 3.10` (only if running the optional Telegram verification bot).

---

### Backend Setup (`server/`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(Fill in your `MONGODB_URI`, `JWT_SECRET`, and `CHAPA_SECRET_KEY`)*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Server runs at:* `http://localhost:5000`

---

### Frontend Setup (`client/`)

1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Web application opens at:* `http://localhost:5173`

---

### Telegram Verification Bot Setup (`bot/`)

1. Navigate to the bot directory:
   ```bash
   cd bot
   ```
2. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure `.env` with your Telegram Bot Token:
   ```bash
   cp .env.example .env
   ```
4. Run the bot:
   ```bash
   python telegram_verifier_bot.py
   ```

---

## 🔒 Environment Configuration

### Backend (`server/.env.example`)
```ini
NODE_ENV=development
PORT=5000

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/revola_marketplace

# JWT Credentials
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
COOKIE_EXPIRE=30

# Web Client URL
CLIENT_URL=http://localhost:5173

# Chapa Payment Gateway Keys (Ethiopia)
CHAPA_SECRET_KEY=CHASECK_TEST-xxxxxxxxxxxxxxxxxxxx
CHAPA_WEBHOOK_SECRET=your_webhook_secret

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Marketplace Commission (Default: 10%)
MARKETPLACE_COMMISSION_RATE=0.10
```

---

## 📡 API Architecture & Endpoints

All endpoints are mounted under `/api/v1`:

| Route Prefix | Method | Endpoint | Description | Auth Required |
|---|:---:|---|---|:---:|
| **Auth** | `POST` | `/auth/register` | Register new account (Buyer/Seller) | No |
| | `POST` | `/auth/login` | Authenticate with Username/Email | No |
| | `POST` | `/auth/google` | Sign in / Sign up with Google OAuth | No |
| | `GET` | `/auth/me` | Get current authenticated user profile | Yes |
| | `POST` | `/auth/avatar` | Upload profile image (Base64/Multipart) | Yes |
| **Products** | `GET` | `/products` | Browse public approved materials | No |
| | `GET` | `/products/map-locations` | Get 30+ geocoded depot & seller pins | No |
| | `POST` | `/products` | Seller creates new material listing | Seller |
| **Cart** | `GET` | `/cart` | Retrieve user-isolated shopping cart | Buyer |
| | `POST` | `/cart` | Add material to cart with stock validation | Buyer |
| **Orders** | `POST` | `/orders/estimate-delivery-fee` | Dynamic Adama delivery calculator | No |
| | `POST` | `/orders/checkout` | Place order with Chapa / Bank transfer | Buyer |
| | `GET` | `/orders/my-orders` | List user's orders | Buyer / Seller |
| | `GET` | `/orders/:id/track` | Live delivery status & milestone timeline | Authenticated |
| **Payments** | `GET` | `/payments/verify-online/:orderId` | Verify Chapa online transaction | Buyer |
| | `POST` | `/payments/submit-receipt` | Submit CBE bank transfer proof | Buyer |
| | `POST` | `/payments/verify-manual` | Staff approves bank transfer receipt | Staff / Admin |
| **Notifications**| `GET` | `/notifications` | List user in-app notifications | Authenticated |
| | `PATCH`| `/notifications/read-all` | Mark all user notifications as read | Authenticated |

---

## 🛡️ Security & Data Isolation

1. **Password Safety**: Password hashes are strictly omitted from Mongoose queries via `select: false` and hashed with `bcryptjs` (12 salt rounds).
2. **Buyer Isolation**: Cart, orders, and profile records are strictly queried using `req.user._id` ensuring zero cross-tenant contamination.
3. **Seller Data Isolation**: Sellers can only view and manage orders and inventory items that belong to their seller account.
4. **Idempotent Webhooks**: All payment webhooks verify HMAC-SHA256 signatures and check for already-completed transactions before updating order state.

---

## 🌿 Team Git Branching Workflow

We enforce a structured Git branching strategy:
- `main` — Production release branch. All code must pass automated CI checks.
- `develop` — Main team integration branch.
- Feature branches must follow the naming standard:
  - `feature/web-auth`
  - `feature/web-marketplace`
  - `feature/backend-orders`
  - `feature/backend-payment`
