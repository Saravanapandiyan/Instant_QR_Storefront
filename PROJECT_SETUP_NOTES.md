# Instant QR Storefront — Learning & Setup Notes

This document records all setup steps, decisions, commands executed, packages installed, and the reasons behind each choice.

---

## 1. System & Runtime Environment
* **OS**: Linux (Ubuntu/Debian)
* **Node Version Manager (`nvm`)**: Active version is **Node v24.10.0** (`npm v11.6.1`).
* **Package Manager**: **`pnpm` v12.14.0** installed globally via `npm install -g pnpm`.
  * *Why pnpm*: High disk efficiency (content-addressable store) and native support for monorepo workspaces via `pnpm-workspace.yaml`.

---

## 2. PostgreSQL Database Setup
* **Service**: PostgreSQL RDBMS (system service `postgresql.service` active on default port `5432`).
* **Database Name**: `instant_qr_db`
* **Dedicated Database User**: `qr_admin`
* **Local Password**: `innovation`
* **Local Database Connection String**:
  ```
  postgresql://qr_admin:innovation@localhost:5432/instant_qr_db?schema=public
  ```
* *Commands Executed*:
  ```bash
  sudo -u postgres psql
  CREATE USER qr_admin WITH PASSWORD 'innovation';
  CREATE DATABASE instant_qr_db OWNER qr_admin;
  GRANT ALL PRIVILEGES ON DATABASE instant_qr_db TO qr_admin;
  \q
  ```

---

## 3. Monorepo Structure
* **Root Files**:
  * `package.json`: Monorepo root definition.
  * `pnpm-workspace.yaml`: Declares workspace members:
    * `apps/*`
    * `packages/*`
  * `.gitignore`: Excludes `node_modules`, `dist`, `.env`, build logs, and editor configs.
* **Target Directories**:
  * `apps/api`: NestJS backend API.
  * `apps/owner`: React + Vite + PWA Owner portal.
  * `packages/shared-types`: Shared TypeScript DTOs and interfaces.

## 4. Deep-Dive Concepts & Learning Notes

### Q1: Why write `import` syntax if we chose CommonJS (CJS)?
* In TypeScript, you **always** write modern `import ... from ...` in your source code.
* The choice of **CommonJS** lives in [`apps/api/tsconfig.json`](file:///var/www/html/Instant%20QR%20Storefront/apps/api/tsconfig.json) (`"module": "commonjs"`).
* When TypeScript compiles your code into the `dist/` folder, it automatically transforms:
  ```ts
  import { Module } from '@nestjs/common';
  ```
  into:
  ```js
  const common_1 = require("@nestjs/common");
  ```
* So you write clean modern code, but Node.js executes battle-tested CommonJS behind the scenes.

---

### Q2: What are `generator client` and `datasource db` in `schema.prisma`?
1. **`generator client`**:
   Tells Prisma: *"When I run `prisma generate`, create a custom TypeScript library (`@prisma/client`) tailored specifically to my models."*
2. **`datasource db`**:
   Tells Prisma:
   * Which database engine we use (`provider = "postgresql"`).
   * Where to find the connection password (`url = env("DATABASE_URL")`).
3. **Single vs Multiple schema files**:
   * In standard Prisma, **one single `schema.prisma` file holds all tables** (`Restaurant`, `Category`, `Product`, `Order`, `User`).
   * Having all models in one file allows Prisma to clearly map relationships (e.g. `Restaurant has many Products`).

---

### Q3: What is YAML and how does `pnpm-workspace.yaml` work?
* **YAML** ("YAML Ain't Markup Language") is a configuration file format that uses simple indentation (spaces) instead of `{}` brackets.
* In `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'apps/*'       # Tells pnpm that apps/api, apps/owner, apps/storefront are workspace projects
    - 'packages/*'   # Tells pnpm that packages/shared-types is also a workspace project
  ```
* When you run `pnpm install`, pnpm links these internal projects together without publishing them to npm.

---

### Q4: Why is there a `node_modules` inside `apps/api` if they are shared?
* `pnpm` uses a global storage vault at `~/.local/share/pnpm/store/`.
* The `apps/api/node_modules` folder doesn't contain duplicated gigabytes of files; it contains **symlinks** (hard links / shortcuts) pointing back to that central vault.
* If 3 apps in our monorepo use the exact same package, it is downloaded and stored on your hard drive **only once**.

---

### Q5: Why do we need the `packages/` folder?
* `apps/`: For standalone, executable applications (the NestJS API server, the React Owner portal).
* `packages/`: For **shared helper libraries** (like `packages/shared-types`).
* *Example*: Both the backend API and the frontend need to know the shape of a `Restaurant` object (`name: string, slug: string`). Instead of writing that interface twice, we write it once in `packages/shared-types` and both apps import it!

* **Phone & Country Code Modeling**: Explicitly separated `countryCode` (e.g. `+91`, `+1`) and `phone` (e.g. `9876543210`) in both `User` and `Restaurant` models. This allows frontends to render an international dial code selector with flags alongside the local phone input.
* **Branch Architecture Model**:
  * An **Owner** is the Superadmin of their restaurant business/brand.
  * An Owner can create and manage multiple **Branches** (e.g., Downtown Branch, Airport Branch).
  * Each Branch has its own physical address, contact details, table numbers, unique QR storefront URL, and Stripe configuration.
* **Staff & Role-Based Access Control (RBAC)**:
  * The Owner can create staff/employee accounts.
  * Staff are assigned to **selected branches only** (e.g., Staff Member "Alex" only sees Branch A, not Branch B).
  * Staff access is restricted by page and action (e.g., Kitchen/Orders view vs. Menu management vs. Financial settings).
* **Payment Gateway — Stripe**:
  * Confirmed gateway is **Stripe**.
  * Owners can configure their Stripe API keys (Publishable key, Secret key, Webhook secret) per branch in their portal settings.
* **Customer Experience Rule**: Customers do **NOT** sign up or log in. They scan the restaurant branch's physical QR code, browse products, and order with zero login friction. Only **Restaurant Owners** and **Staff/Platform Admins** have user accounts with email & password.
* **Role Enum**: `Role { ADMIN, OWNER, STAFF }`.

---

## 5. Notes on NestJS Scaffolding & Fixes
* **Module System Selection**: Chose **CJS (CommonJS)** with Jest for rock-solid stability with NestJS decorators and Prisma ORM.
* **Observe Module**: Declined external Observe SaaS and removed `@nestjs/observe` from `app.module.ts` and `package.json` to keep development 100% clean and local.
* **Prisma Version Standardization**: Aligned both `@prisma/client` and `prisma` CLI to stable version `^6.19.3` to avoid experimental Prisma 8 command renames and ensure rock-solid stability.
* **Prisma Shadow Database & CREATEDB**: `prisma migrate dev` creates a temporary shadow database to test schema changes. Granted `ALTER USER qr_admin CREATEDB;` in PostgreSQL so Prisma can create and destroy this test database safely.
* **First Migration Applied**: `20261021091527_init_restaurant` generated the `restaurants` table and generated `@prisma/client` TypeScript types.

---

## 6. Frontend Owner Portal Architecture & Design System (Phase 6 & 7)
### What We Built in Phase 6 & 7:
1. **Vite + React 19 + TypeScript (`apps/owner`)**:
   - Light, ultra-fast client-side application.
   - Oxlint linter for lightning-speed lint checks.
2. **Modern Custom Design System (CSS Tokens in `variables.css`)**:
   - Luxury dark glassmorphism canvas (`#090d16`) with ambient radial emerald & amber gradients.
   - Modern typography with Google Fonts (*Plus Jakarta Sans*).
3. **Modular Component Kit (`src/components/ui/`)**:
   - **`Button`**: Supports variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), icons, and an active loading spinner (`isLoading`).
   - **`Input`**: Accessible form field with `forwardRef` for React Hook Form, floating label, error validation messages, and optional prefix/suffix.
   - **`Card`**: Glassmorphism surface container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
4. **API Client (`lib/api-client.ts`) & Zustand Store (`store/useAuthStore.ts`)**:
   - Automatic JWT Bearer token attachment via `Authorization: Bearer <token>`.
   - Automatic logout on 401 Unauthorized responses.
   - Persisted session state in `localStorage`.
5. **Feature-Driven Auth UI (`features/auth/`)**:
   - **`/register`**: Name, email, password, and international country code dial dropdown (`+91`, `+1`, `+44`, `+971`, etc.) + phone number.
   - **`/login`**: Email & password authentication connected to NestJS backend (`POST /api/v1/auth/login`).
   - **`ProtectedRoute`**: Auto-redirects unauthenticated visitors to `/login`, preserving safe routes.

---

### 🎨 Centralized Theme Architecture (`apps/owner/src/styles/theme.css`):
- **Single-File Color Switching**: All primary accents, backgrounds, and borders are defined in `apps/owner/src/styles/theme.css`.
- **Current Theme**: **Modern Royal Indigo & Slate (Stripe / Linear / Clerk Style)**:
  - Primary accent: Royal Indigo (`#4f46e5` in light mode, `#6366f1` in dark mode).
  - Background: Crisp Slate (`#f8fafc` in light mode, `#090d16` deep obsidian in dark mode).
  - Auth Layout: Centered Modern Glass Card (`max-w-[420px]`) with zero promotional clutter, centered app logo, and clean focused input fields.
- **Easy Re-coloring**: If you ever want to change the brand color later, you only modify the `--brand-primary` hex value in `styles/theme.css` — 0 component code changes needed!

---

## 7. Next Up: Phase 8 (Owner Branch Dashboard & Branch Creation)
- Connect `GET /api/v1/restaurants/mine` using `@tanstack/react-query` to fetch all branches owned by the logged-in user.
- Build "Add Branch" modal with live auto-slug preview.
- Connect `POST /api/v1/restaurants` to create real branches directly from the browser!

