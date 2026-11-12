# Instant QR Storefront — Master Project Plan

> **Core Learning Philosophy**:  
> **Build Backend Feature ➔ Build Its Frontend UI Immediately ➔ Test & Learn Together.**  
> We never build all backend APIs in isolation. Every module is built end-to-end (Backend + Frontend) in small, bite-sized phases so you understand every single line of code.

---

## 1. System Architecture Overview

* **Backend**: NestJS + TypeScript + Prisma ORM + PostgreSQL (`apps/api`)
* **Owner Portal**: React + Vite + TypeScript + Zustand + TanStack Query (`apps/owner`)
* **Customer Storefront**: Mobile-First React + Vite + PWA + Dynamic Theme (`apps/storefront`)
* **Admin Portal**: Platform administration dashboard (`apps/admin`)
* **Shared Types**: Centralized TypeScript DTOs & contracts (`packages/shared-types`)
* **Payment Gateway**: **Stripe** (configured per branch by the owner)

---

## 2. Phase-by-Phase Roadmap

### 🏁 STAGE 1: FOUNDATION & FIRST VERTICAL SLICE (Completed ✅)

#### ✅ Phase 1: Workspace & Tooling Setup
* Monorepo initialization with `pnpm` workspaces (`pnpm-workspace.yaml`).
* Root configuration, `.npmrc`, `.gitignore`.

#### ✅ Phase 2: Database Setup & User Configuration
* PostgreSQL database created: `instant_qr_db`.
* Dedicated user `qr_admin` with `CREATEDB` permissions for Prisma shadow database.

#### ✅ Phase 3: NestJS Backend Core & Prisma ORM
* NestJS app initialized in `apps/api`.
* Prisma ORM installed and configured (`schema.prisma`).
* `PrismaService` & global `PrismaModule` created for seamless database queries.

#### ✅ Phase 4: Restaurant / Branch Backend API
* `Restaurant` model with name, address, `countryCode`, `phone`.
* **Smart Auto-Slug Generator**: Automatically converts `"Luigi's Pizza"` ➔ `"luigis-pizza"`, with auto-numbering (`"-1"`, `"-2"`) on collisions.
* Global route prefix `/api/v1` and `ValidationPipe`.
* Interactive Swagger UI documentation at `/api/docs`.

#### ✅ Phase 5: Owner Authentication Backend (Register & Login)
* `User` model with `Role { ADMIN, OWNER, STAFF }`.
* Password encryption using `bcrypt` (10 salt rounds).
* JWT token generation (`@nestjs/jwt`) and passport verification strategy (`jwt.strategy.ts`).
* Bouncer guards (`@UseGuards(JwtAuthGuard)`) and `@CurrentUser()` decorator.
* Linked restaurant creation to logged-in owner (`ownerId`).
* Public storefront route (`GET /restaurants/slug/:slug`) left open for zero-login QR scanning.

---

### 🎨 STAGE 2: OWNER PORTAL FRONTEND (AUTH & BRANCHES) (Next 🚀)

#### ✅ Phase 6: Owner Portal Frontend Setup
* Scaffold `apps/owner` using **React + Vite + TypeScript**.
* Install client tools:
  * **`zustand`**: For lightweight client state (auth session, current token, active branch).
  * **`@tanstack/react-query`**: For API data fetching, loading spinners, caching, and auto-refresh.
  * **`react-hook-form` + `zod`**: Type-safe client form validation.
  * **`lucide-react`**: Clean, modern icons.
* Link `@instant-qr/shared-types` into `apps/owner`.

#### ✅ Phase 7: Owner Portal UI — Register & Login Pages & Custom Design System
* Custom Design Tokens (`styles/variables.css` & `index.css`) with Google Fonts (*Plus Jakarta Sans*), luxury dark glassmorphism, glowing emerald accents.
* Modular UI Component Kit:
  * Reusable `Button` (variants: primary, secondary, outline, ghost, danger + loading spinner).
  * Reusable `Input` (label, error text, country code prefix, forwardRef).
  * Reusable `Card` suite (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
* Centralized API Client (`lib/api-client.ts`) with automatic JWT bearer authorization.
* Zustand Auth Store (`store/useAuthStore.ts`) with `localStorage` persistence.
* Beautiful Signup (`/register`) & Login (`/login`) pages with phone country code dropdowns (`+91`, `+1`, `+44`, etc.).
* Protected routing (`routes/ProtectedRoute.tsx`) and authenticated Owner Dashboard view.

#### 📌 Phase 8: Owner Portal UI — Branch Dashboard & Create Branch
* Dashboard home: View list of all branches owned by the logged-in user (`GET /api/v1/restaurants/mine`).
* "Create New Branch" modal/page with auto-slug preview and validation.
* Connect to `POST /api/v1/restaurants`.
* Instantly see the new branch appear in the dashboard without refreshing the page!

---

### 🏢 STAGE 3: MULTI-BRANCH & STAFF ROLE MANAGEMENT (RBAC)

#### 📌 Phase 9: Multi-Branch & Staff RBAC — Backend API
* Add `BranchMember` mapping table in Prisma:
  * `userId`, `restaurantId`, `role` (`MANAGER`, `KITCHEN_STAFF`, `CASHIER`).
  * Granular permissions array: `['orders:view', 'orders:update', 'menu:edit']`.
* API to invite/create a staff member under an owner's account.
* API to assign staff members to specific branches.
* Permission guards to prevent staff from viewing unauthorized pages or other branches.

#### 📌 Phase 10: Owner Portal UI — Staff Management & Branch Switcher
* Header **Branch Switcher Dropdown** (switch between Downtown Branch, Airport Branch, etc.).
* "Staff Management" page:
  * Owner can create staff accounts and assign them to specific branches.
  * Choose staff role/permissions with simple toggles.
* Test logging in as a Staff member: verify restricted page access and branch scoping.

---

### 🍕 STAGE 4: MENU & CATALOGUE MANAGEMENT

#### 📌 Phase 11: Categories & Products — Backend API
* Prisma Models:
  * `Category`: `id`, `restaurantId`, `name`, `slug`, `sortOrder`, `isActive`.
  * `Product`: `id`, `restaurantId`, `categoryId`, `name`, `description`, `price`, `imageUrl`, `isAvailable`, `sortOrder`.
* Backend validation: Enforce that products belong to the same branch as their category.
* CRUD endpoints:
  * Categories: `POST`, `GET`, `PATCH`, `DELETE /api/v1/categories`.
  * Products: `POST`, `GET`, `PATCH`, `DELETE /api/v1/products`.
* Public endpoints for customers: `GET /api/v1/public/stores/:slug/catalogue`.

#### 📌 Phase 12: Owner Portal UI — Menu & Product Studio
* Menu Management page:
  * Create/organize categories (e.g. Starters, Main Course, Drinks, Desserts).
  * Drag-and-drop or sort ordering.
  * Add products with name, price, description, and "In Stock / Out of Stock" toggle.
* Real-time search and filter for products.

---

### 🎨 STAGE 5: STOREFRONT THEME ENGINE

#### 📌 Phase 13: Restaurant Theme Engine — Backend API
* Prisma Model:
  * `RestaurantTheme`: `restaurantId`, `primaryColor`, `accentColor`, `backgroundColor`, `textColor`, `fontKey`, `layoutKey`, `logoUrl`, `bannerUrl`.
* Backend validation: Strict color hex check and font allowlist (prevents malicious CSS injection).
* Endpoints:
  * Owner: `GET`, `PATCH /api/v1/restaurants/:id/theme`.
  * Public: `GET /api/v1/public/stores/:slug/theme`.

#### 📌 Phase 14: Owner Portal UI — Live Theme Customizer
* Live Theme Studio in the Owner Portal:
  * Pick brand colors (Color pickers for Primary, Accent, Background).
  * Upload branch logo and banner image.
  * Select typography font.
* **Live Interactive Mobile Preview**: See an exact mockup of what customers will see when they scan the QR code before publishing changes!

---

### 📱 STAGE 6: UNIQUE STYLED QR CODE ENGINE

#### 📌 Phase 15: Styled QR Code Generator — Backend API
* Install and configure `qrcode` library with High Error Correction (`H`).
* Endpoints:
  * `GET /api/v1/restaurants/:id/qr`: Returns JSON with `{ qrCodeDataUrl, storefrontUrl }` styled with the branch's primary brand color.
  * `GET /api/v1/restaurants/:id/qr/download`: Generates high-resolution 1000x1000px PNG for print table stands.
  * Table-specific QR parameter: Support `?table=5` encoded into the QR code!

#### 📌 Phase 16: Owner Portal UI — QR Studio & Table Stands
* QR Code Studio page in Owner Portal:
  * Select branch and table number (e.g., Table 1 to Table 20).
  * Live QR preview matching the restaurant's theme colors.
  * "Download for Print" button: Generates ready-to-print table stand PDFs/PNGs.

---

### 🛒 STAGE 7: CUSTOMER STOREFRONT (MOBILE-FIRST DINING)

#### 📌 Phase 17: Customer Storefront Setup & Dynamic Branding
* Scaffold `apps/storefront` using **React + Vite + TypeScript**.
* Public routing: `store.example.com/:slug` (resolves branch by slug).
* Dynamically inject the branch's colors and fonts via CSS variables (`--primary-color`, etc.).
* Zero login friction: Customers browse categories and products with high-speed mobile UX.

#### 📌 Phase 18: Customer Storefront — Interactive Cart
* Client-side cart using Zustand (persists during the dining session).
* Floating mobile cart bar: Add items, customize quantities, view subtotal.
* Table number auto-detected from QR code parameter (`?table=4`).
* Clear connection/error messages (no false promises when offline).

---

### 💳 STAGE 8: STRIPE PAYMENTS & SERVER-VALIDATED CHECKOUT

#### 📌 Phase 19: Stripe Integration — Backend API
* Add encrypted Stripe credentials to Branch/Restaurant model.
* Endpoints:
  * `POST /api/v1/public/stores/:slug/orders`: Server validates availability, recalculates prices, and creates order snapshot.
  * `POST /api/v1/payments/create-session`: Creates Stripe Checkout Session linked to the branch's Stripe account.
  * `POST /api/v1/payments/webhook`: Listens for Stripe webhooks idempotently and marks order as `PAID`.

#### 📌 Phase 20: Owner Portal UI — Stripe Settings per Branch
* "Payment Settings" tab in Owner Portal:
  * Owner inputs Stripe Publishable Key, Secret Key, and Webhook Secret for each branch.
  * Test connection button to verify credentials with Stripe API.

#### 📌 Phase 21: Customer Storefront — Seamless Stripe Checkout
* Checkout screen: Customer reviews order, enters optional name/note, and proceeds to Stripe Checkout.
* Successful payment redirection with live animated order confirmation screen (`Order #1042`).

---

### 🍽️ STAGE 9: LIVE IN-STORE FULFILLMENT & KITCHEN VIEW

#### 📌 Phase 22: Order Management & Kitchen Display
* Backend: Order status state machine (`CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED` ➔ `CANCELLED`).
* Owner & Staff UI:
  * Live Kitchen Display: Real-time orders grouped by Table Number.
  * One-click status updates ("Start Preparing", "Food Ready for Table").
  * Sound alerts when a new paid order arrives!

---

### 📲 STAGE 10: PWA & PRODUCTION DEPLOYMENT

#### 📌 Phase 23: Progressive Web App (PWA) Implementation
* Install `vite-plugin-pwa` for Owner Portal and Customer Storefront.
* Web App Manifest: Brand icon, splash screen, theme color.
* Service Workers: App-shell precaching for instant loading on mobile.

#### 📌 Phase 24: Platform Admin Portal
* Scaffold `apps/admin` for platform administrators.
* Platform dashboard: View all restaurant businesses, total branches, platform-wide volume.
* Suspend / activate accounts.

#### 📌 Phase 25: CI/CD Pipeline & Deployment
* Automated GitHub Actions CI workflow (linting, typechecking, tests).
* Docker / reverse proxy (Nginx) production setup with HTTPS and automated database backups.
