# Platform Admin Portal (`apps/admin`) — Phase-by-Phase Master Plan

> **Core Development Philosophy**:  
> **Build Backend Feature ➔ Build Its Frontend UI Immediately ➔ Test & Learn Together.**  
> We never build APIs in isolation without a UI, and we never build disconnected mock UIs. Every phase delivers a fully functional vertical slice connecting the NestJS backend (`apps/api`) directly to the Admin Portal (`apps/admin`) with live database records.

---

## Architecture & Technology Stack

* **Admin Portal (`apps/admin`)**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Zustand + TanStack Query (Port `5175`)
* **Backend API (`apps/api`)**: NestJS + TypeScript + Prisma ORM + PostgreSQL (Port `3000`)
* **Theme System**: 100% centralized CSS variables in [`admin-theme.css`](file:///var/www/html/Instant%20QR%20Storefront/apps/admin/src/styles/admin-theme.css). **Zero hardcoded colors** in components.

---

## Phase Breakdown Overview

| Phase | Module | Focus Area | Deliverable |
|---|---|---|---|
| **Phase 1** | **Foundation & Shell** | Scaffolding, Theming & Clean Layout | Vite setup, centralized theme file, Sidebar & Header without dummy telemetry (Completed ✅) |
| **Phase 2** | **Super Admin Auth & Session** | Backend Guard + Bootstrap & Login Page | Dedicated Super Admin bootstrap API, `POST /auth/admin/login`, `SuperAdminGuard`, `AdminLoginPage`, `AdminProtectedRoute` (Completed ✅) |
| **Phase 3** | **Platform Overview Dashboard** | Metrics & Real-Time Stats API | Bento metric cards, 30-day velocity chart, recent fleet table (Completed ✅) |
| **Phase 4** | **Restaurant & Tenant Fleet** | Tenant Directory & Management | `/restaurants` table, slide-over drawer, Approve / Suspend / Reactivate |
| **Phase 5** | **Platform Users & RBAC** | IAM & Access Oversight | `/users` table, role filter (`SUPER_ADMIN`, `OWNER`, `STAFF`), status toggling |
| **Phase 6** | **Global Orders & Telemetry** | Cross-Restaurant Transactions | `/orders` stream, live search, itemized receipt drawer & dispute refund |
| **Phase 7** | **Platform Settings & Maintenance** | Governance & System Controls | `/settings` toggles (guest checkout, auto-approval, maintenance mode) |

---

## Detailed Phase Specifications

### ✅ Phase 1: Foundation & Clean Global Shell (Completed)
* **What was built**:
  - Scaffolding of `apps/admin` (React 19 + Vite + Tailwind CSS v4 + Lucide Icons).
  - Decoupled theme tokens in `apps/admin/src/styles/admin-theme.css`.
  - Responsive desktop layout: Fixed 256px `AdminSidebar` + Sticky `AdminHeader`.
  - **Removed unnecessary cluster / node telemetry widgets** (Region Node `ap-south-1` and `All Systems Operational / prod-ind-01`) per design feedback.
  - Verified `vite build` passes cleanly with 0 TypeScript errors.

---

### ✅ Phase 2: Super Admin Authentication & Security Guard (Completed)
* **What was built**:
  - `POST /api/v1/auth/admin/bootstrap`: Dedicated bootstrap endpoint for provisioning root platform administrators. When initialized, subsequent additions require secret `ADMIN_SETUP_SECRET`.
  - `POST /api/v1/auth/admin/login`: Dedicated login endpoint for the Admin Control Plane; strictly verifies `user.role === 'SUPER_ADMIN'` and rejects non-admin users with 403 Forbidden.
  - `GET /api/v1/auth/admin/status`: Public status check returning `{ hasSuperAdmin: boolean, totalSuperAdmins: number }`.
  - `SuperAdminGuard`: NestJS guard for role-based platform protection.
  - Hardened standard `/api/v1/auth/register` to forbid privilege escalation (rejects `role` field with 400 Bad Request).
  - Frontend `AdminLoginPage.tsx` in `apps/admin` supporting initial platform bootstrap and root sign in.
  - `AdminProtectedRoute.tsx` guarding all platform routes.
  - Seeded/provisioned initial Super Admin account: `admin@instantqr.io`.

---

### ✅ Phase 3: Platform Overview Dashboard (Completed)
* **What was built**:
  - `apps/api/src/admin/admin-dashboard.service.ts`: Aggregates live platform data:
    - `GET /api/v1/admin/dashboard/stats`: Returns live counts for total restaurants (active/pending), physical outlets, catalog items, users, and gross platform GMV.
    - `GET /api/v1/admin/dashboard/velocity`: Returns 30-day daily order volume and GMV time series for charts.
    - `GET /api/v1/admin/dashboard/recent-fleet`: Returns recent restaurant signups, owners, outlets, and live status.
  - Guarded with `JwtAuthGuard` and `SuperAdminGuard`.
  - Frontend `apps/admin/src/api/adminDashboardApi.ts`: TanStack Query integration.
  - `AdminDashboardPage.tsx`:
    - 4 Bento metric summary cards with live PostgreSQL statistics and growth indicators.
    - Interactive 30-day order velocity chart with hover tooltips.
    - KYC & Brand verification review card.
    - Live Recent Tenant Fleet Table displaying onboarded concepts ("Ananda Non veg", "Ananda Pure veg"), owners, outlets count, menu items, and direct storefront links.
  - Refresh button with spinner for live data reload.

---

### 📌 Phase 4: Restaurant & Tenant Fleet Management (`/restaurants`)
* **Backend (`apps/api`)**:
  - `GET /api/v1/admin/restaurants`: Paginated restaurant directory with status filters (`ALL`, `ACTIVE`, `PENDING_REVIEW`, `SUSPENDED`), search by name/slug/owner email.
  - `PATCH /api/v1/admin/restaurants/:id/status`: Updates restaurant operational state (`ACTIVE`, `SUSPENDED`).
  - `GET /api/v1/admin/restaurants/:id/details`: Returns full tenant profile (owner info, all branches, active menus, order statistics).
* **Frontend (`apps/admin`)**:
  - `apps/admin/src/features/restaurants/AdminRestaurantsPage.tsx`:
    - Filter tabs: `All Brands`, `Active`, `Pending Review`, `Suspended`.
    - Search bar (Brand name, slug `/r/...`, owner email).
    - Tenant Fleet Data Table (Logo, Name, Slug, Owner contact, Branches count, Status badge, Actions).
    - **480px Slide-Over Tenant Drawer**: Detailed brand overview, branch list, KYC contact, and one-click actions:
      - `Approve Restaurant`
      - `Suspend Account`
      - `Preview Customer Storefront` (opens `/r/:slug` in new tab)
* **Verification**: Change a restaurant status from Active to Suspended; verify status badge updates immediately and customer storefront responds appropriately.

---

### 📌 Phase 5: Platform Users & Roles Oversight (`/users`)
* **Backend (`apps/api`)**:
  - `GET /api/v1/admin/users`: Lists platform users with filtering by role (`SUPER_ADMIN`, `ADMIN`/Owner, `MANAGER`, `STAFF`) and search by name/email/phone.
  - `PATCH /api/v1/admin/users/:id/status`: Toggle user account active/disabled state.
* **Frontend (`apps/admin`)**:
  - `apps/admin/src/features/users/AdminUsersPage.tsx`:
    - Role distribution metrics (Owners count, Staff count, Platform Admins).
    - Users data table (Avatar, Name, Email, Phone, Role badge, Linked Restaurants, Created Date, Status toggle).
    - User detail and role assignment modal.
* **Verification**: Search by phone or email, filter by `STAFF` vs `OWNER`, and toggle account activation.

---

### 📌 Phase 6: Global Orders & Cross-Restaurant Dispute Audit (`/orders`)
* **Backend (`apps/api`)**:
  - `GET /api/v1/admin/orders`: Global order feed across all restaurants and branches with filters (Order ID, restaurant, payment status, date range).
  - `GET /api/v1/admin/orders/:id`: Full itemized receipt, cooking instructions, customer phone, and Stripe payment reference.
  - `POST /api/v1/admin/orders/:id/refund`: Admin dispute refund trigger for emergency resolution.
* **Frontend (`apps/admin`)**:
  - `apps/admin/src/features/orders/AdminOrdersPage.tsx`:
    - Real-time telemetry summary (Orders today, Total Volume, Dispute rate).
    - Global Orders Data Table (Order #, Timestamp, Restaurant & Branch, Customer, Items count, Total, Payment pill).
    - **Order Receipt Slide-Over**: Itemized dish breakdown, special instructions, Stripe transaction ID, and refund action button with confirmation dialog.
* **Verification**: Place an order from the Customer Storefront (`apps/customer`); verify it instantly appears in the Admin Global Orders table.

---

### 📌 Phase 7: Platform Settings, Policies & System Maintenance (`/settings`)
* **Backend (`apps/api`)**:
  - `GET /api/v1/admin/settings` & `PATCH /api/v1/admin/settings`:
    - Platform name, default base currency, support contact.
    - Governance policies: `requireRestaurantApproval`, `allowGuestCheckout`, `enforceStripeVerification`.
    - Platform-wide emergency maintenance mode switch.
* **Frontend (`apps/admin`)**:
  - `apps/admin/src/features/settings/AdminSettingsPage.tsx`:
    - General configuration form.
    - Tenant governance toggle switches.
    - Emergency Maintenance banner with double-confirmation modal.
* **Verification**: Toggle maintenance mode; verify customer and owner apps display maintenance screen when activated.

