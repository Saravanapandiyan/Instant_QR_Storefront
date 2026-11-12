# Platform Admin Portal (`apps/admin`) — Architecture, Layout Analysis & Implementation Plan

---

## 1. Executive Summary & Objective

The **Platform Admin Portal** (`apps/admin`) is the top-level **Control Plane / Super Admin** application in the Instant QR Storefront ecosystem. While the **Owner Portal** (`apps/owner`) allows individual restaurant owners to manage their own brands, menus, and physical branches, the **Admin Portal** governs the entire SaaS platform.

### Core Users & Permissions:
- **Role**: `Role.SUPER_ADMIN` / Platform Administrators (`isPlatformAdmin: true`).
- **Platform Scope**: Global oversight across all tenants, multi-branch fleets, cross-restaurant order flows, system security, and platform-wide configurations.
- **Technology**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + TanStack Query + Zustand. (PWA is intentionally omitted for the Admin Portal per project architecture; it is an enterprise desktop/laptop dashboard).

---

## 2. Analysis of the Stitch AI Design (`stitch_super_admin_portal_design`)

The Stitch AI designs provide high-density, professional enterprise layout structures across 6 primary screens.

### 2.1 Global Shell & Persistent Navigation (Shared Layout)
All screens in the design share a unified control-plane layout:

```
+----------------------------------------------------------------------------------------------------+
| SIDEBAR (256px / w-64)   | TOP HEADER (h-16 sticky top bar)                                         |
|                          | [ Search ⌘K ]          [ Systems Operational ] [ Notifications ] [ Avatar] |
| - Instant QR (ROOT)      +-------------------------------------------------------------------------+
| - Governance & Ops       | MAIN VIEWPORT (max-w-[1680px] p-6 lg:p-8)                                |
|   * Overview             |                                                                         |
|   * Restaurants & Tenants|  [ Page Header / Telemetry Ribbon / Action Buttons ]                     |
|   * User Accounts        |                                                                         |
|   * Global Orders        |  [ Metric Cards / Bento Grid ]                                          |
|   * Platform Settings    |                                                                         |
|   * System Health Audit  |  [ Filter Toolbar / Segmented Status Tabs ]                             |
|                          |                                                                         |
| [ Region Node Status ]   |  [ Dense Data Tables / Charts / Slide-over Drawers ]                     |
| [ Super Admin Profile ]  |                                                                         |
+--------------------------+-------------------------------------------------------------------------+
```

1. **Fixed Left Sidebar (`w-64` / 256px)**:
   - **Branding Header**: "Instant QR Control Plane" with a distinctive `ROOT` access badge.
   - **Navigation Menu**:
     - `Overview` (Icon: LayoutDashboard)
     - `Restaurants & Tenants` (Icon: Storefront)
     - `User Accounts` (Icon: Users / ManageAccounts)
     - `Global Orders` (Icon: ReceiptLong / ClipboardList)
     - `Platform Settings` (Icon: Settings / Tune)
     - `System Health Audit` (Icon: Activity / Dns)
   - **Footer Context**: Regional cluster health badge (`ap-south-1 Mumbai-Core`), logged-in Super Admin profile card, and instant Sign Out action.

2. **Top Sticky Header (`h-16`)**:
   - **Universal Command Search**: `⌘K` global search input allowing instant lookups across restaurants, orders, users, and audit logs.
   - **Cluster Health Status**: Live pill indicator (*"All Systems Operational"*, *"Cluster: prod-ind-01"*).
   - **Notification Center**: Bell button with unread alert badge.
   - **Admin Profile Quick Menu**.

---

### 2.2 Screen-by-Screen Layout Breakdown

#### **Screen 1: Platform Overview Dashboard (`platform_overview_dashboard`)**
- **Top Ribbon**: Live ingestion heartbeat (`Live Ingestion Active`), timeframe selector (*Last 30 Days*, *This Month*, *YTD*), filter hubs button, and *"Export Executive Summary"* action.
- **Primary Bento Metric Grid (4 Cards)**:
  1. *Active Restaurants* (Total count, +12.4% MoM growth, verified vs onboarding breakdown).
  2. *Physical Outlets / Branches* (Total branches, monthly net additions, 98.2% availability rate).
  3. *Platform Orders* (Lifetime and monthly order count, positive trend indicators).
  4. *Gross Platform Volume / GMV* (Total processed revenue in platform currency, conversion breakdown).
- **Middle Analytic Section**:
  - Daily Order Volume & Platform Revenue trend chart with date-range filters.
  - Top Performing Restaurant Hubs (ranked by volume and regional active merchant density).
- **Bottom Operational Tables**:
  - Recent Restaurant Signups table (Brand, Owner, Branches, Date, Status, Actions).
  - Real-time Operations Event Log.

---

#### **Screen 2: Restaurant & Tenant Management (`restaurant_tenant_management`)**
- **Header**: Tenant Registry metadata, cluster quorum status, and primary `+ Onboard Enterprise Brand` action.
- **Filter Toolbar**:
  - Segmented status tabs: `All Brands` (142), `Active` (134), `Pending Review` (5), `Suspended` (3).
  - Search input: Filter by brand name, owner email, or storefront URL slug (`/r/...`).
  - Region filter dropdown & Subscription tier dropdown.
  - CSV export button.
- **Tenant Directory Data Table**:
  - Columns: Brand Logo & Concept Name, Storefront URL Slug link, Owner Contact (Name, Email, Mobile), Operational Branches count, Base Currency, Active Status badge, Action menu.
- **Slide-Over Tenant Profile Drawer (480px)**:
  - Opens on clicking any restaurant row.
  - Full business verification details (KYC, contact, address).
  - Quick action controls: **Approve Restaurant**, **Suspend Account**, **Login as Owner (Impersonation)**.
  - Direct link to preview live customer storefront.

---

#### **Screen 3: Platform Users & Roles Management (`platform_users_roles_management`)**
- **Header**: IAM Scope status and `+ Invite System User` action.
- **Metrics Strip**: Total Platform Users, Restaurant Owners, Branch Managers / Staff, Root Super Admins.
- **Search & Role Toolbar**:
  - Search by Name, Email, or Phone.
  - Filter by Role: `SUPER_ADMIN`, `ADMIN` (Owner), `MANAGER`, `STAFF`.
  - Filter by Account Status: `Active`, `Deactivated`.
- **Users Directory Table**:
  - User Name & Avatar, verified phone with country code, role badge, assigned restaurant, joined date, active status switch, and quick actions (Reset password, Edit privileges, Ban user).
- **Privileges Modal**:
  - Radio options for role assignment, business assignment mapping, and session revocation.

---

#### **Screen 4: Global Orders & Transaction Oversight (`global_orders_transaction_oversight`)**
- **Telemetry Stream Bar**: Live feed connection status, total processed volume, total orders logged, zero gateway dropout counter, and ingress latency telemetry.
- **Filter Bar**: Global search (Order ID, customer phone, transaction hash), date range selector, restaurant dropdown, payment status pills (*All, Paid, Pending, Failed, Refunded*).
- **Global Order Stream Table**:
  - Columns: Order ID, Timestamp, Restaurant & Branch, Customer Name & masked phone, Items preview count, Total Amount, Payment Status badge, Fulfillment state, Action button.
- **Order Details Receipt Drawer**:
  - Itemized dishes with customer cooking notes.
  - Payment gateway transaction reference (Stripe PaymentIntent ID).
  - Admin dispute resolution: Issue manual refund, download audit record, flag transaction.

---

#### **Screen 5: Platform Settings & Audit Logs (`platform_settings_audit_logs`)**
- **Tabbed Interface**:
  - *Tab 1: General Platform Settings*.
  - *Tab 2: Storefront Governance & Policies*.
  - *Tab 3: System Audit Activity Log*.
- **Settings Content**:
  - Platform identity, support email, default base currency.
  - Tenant governance toggles: Require admin approval for new restaurants, enable guest checkout, allow custom theme colors.
  - Emergency platform maintenance mode toggle with safety confirmation dialog.
- **Audit Activity Log**:
  - Timestamp, Actor Admin, Event Type (e.g. *Restaurant Suspended*, *Role Modified*), Target Entity, Changes Diff (Before/After).

---

#### **Screen 6: System Health & Infrastructure Audit (`system_health_audit`)**
- Infrastructure telemetry, API response times, database connection pool status, and cluster regional node health.

---

## 3. Centralized Color & Theming Token System (Separate Theme File)

### 3.1 The User's Requirement
> *"i didnt like theme color. asusual write all color in a separate file and use that color whenever we need to change we can change those theme color"*

Stitch AI used hardcoded Material-3 colors with purple/lavender tints (`#091426`, `#5654a8`, `#f8f9ff`, `#cbdbf5`) that look overly blue/purple.

### 3.2 The Separate Theme File Strategy
All colors across the entire Admin Portal will be decoupled into a single dedicated file:
**`apps/admin/src/styles/admin-theme.css`** (and exported as TypeScript tokens in `apps/admin/src/config/theme.config.ts`).

Every component, card, table, sidebar, header, button, and badge in `apps/admin` will **strictly use CSS variables**. When the user wants to change the theme (e.g., from deep navy to slate, modern obsidian dark, charcoal, emerald, or neutral light), **they only change that single file, and every page updates instantly**.

### 3.3 Centralized Color Token Specification (`admin-theme.css`):

```css
/* =========================================================================
   PLATFORM ADMIN PORTAL — CENTRALIZED THEME TOKENS
   Location: apps/admin/src/styles/admin-theme.css
   Modify this single file to change the entire Admin Portal color palette!
   ========================================================================= */

:root {
  /* -----------------------------------------------------------------------
     DEFAULT DARK THEME (Sleek Modern Obsidian / Slate)
     ----------------------------------------------------------------------- */
  --adm-bg: #090d16;                  /* Canvas background */
  --adm-surface: #0f172a;             /* Primary card / panel / sidebar */
  --adm-surface-subtle: #1e293b;      /* Hover states, table headers, inputs */
  --adm-surface-elevated: #1e293b;    /* Modals, popovers, dropdowns */

  /* Borders & Dividers */
  --adm-border: #1e293b;              /* Clean, crisp hairline dividers */
  --adm-border-subtle: #334155;       /* Focus rings, card hover borders */

  /* Primary Brand Action (Easily change to blue, indigo, emerald, amber) */
  --adm-primary: #6366f1;             /* Electric Indigo action color */
  --adm-primary-hover: #4f46e5;       /* Primary button hover */
  --adm-primary-contrast: #ffffff;    /* Text on primary button */
  --adm-primary-subtle: rgba(99, 102, 241, 0.12); /* Selected pill backgrounds */

  /* Text & Typography Hierarchy */
  --adm-text: #f8fafc;                /* Primary high-contrast text */
  --adm-text-secondary: #94a3b8;      /* Secondary text & labels */
  --adm-muted: #64748b;               /* Disabled text, table captions */

  /* Semantic Status Accents */
  --adm-success: #10b981;             /* Active / Approved / Verified */
  --adm-success-subtle: rgba(16, 185, 129, 0.12);
  --adm-warning: #f59e0b;             /* Pending Review / Warning */
  --adm-warning-subtle: rgba(245, 158, 11, 0.12);
  --adm-error: #ef4444;               /* Suspended / Failed / Danger */
  --adm-error-subtle: rgba(239, 68, 68, 0.12);
}

/* -----------------------------------------------------------------------
   LIGHT THEME OVERRIDES (Toggleable via .light class on <html>)
   ----------------------------------------------------------------------- */
html.light {
  --adm-bg: #f8fafc;
  --adm-surface: #ffffff;
  --adm-surface-subtle: #f1f5f9;
  --adm-surface-elevated: #ffffff;
  --adm-border: #e2e8f0;
  --adm-border-subtle: #cbd5e1;
  --adm-primary: #4f46e5;
  --adm-primary-hover: #4338ca;
  --adm-primary-contrast: #ffffff;
  --adm-primary-subtle: rgba(79, 70, 229, 0.08);
  --adm-text: #0f172a;
  --adm-text-secondary: #475569;
  --adm-muted: #94a3b8;
  --adm-success: #059669;
  --adm-success-subtle: rgba(5, 150, 105, 0.1);
  --adm-warning: #d97706;
  --adm-warning-subtle: rgba(217, 119, 6, 0.1);
  --adm-error: #dc2626;
  --adm-error-subtle: rgba(220, 38, 38, 0.1);
}
```

---

## 4. Technical Architecture for `apps/admin`

### 4.1 Monorepo Workspace Setup
```
Instant QR Storefront/
├── apps/
│   ├── api/          (NestJS backend API on port 3000)
│   ├── customer/     (Diner PWA storefront on port 5174)
│   ├── owner/        (Restaurant Owner portal on port 5173)
│   └── admin/        (Platform Super Admin portal on port 5175) 🚀 NEW
├── packages/
│   └── shared-types/ (Shared DTOs & models)
└── stitch_super_admin_portal_design/ (Reference Stitch designs)
```

### 4.2 Application Architecture (`apps/admin`)
- **Port**: `5175`
- **Routing**: `react-router-dom` v6
  - `/login`: Dedicated Super Admin authentication.
  - `/`: Overview Dashboard.
  - `/restaurants`: Tenant Directory, Approval Queue & Slide-over Drawer.
  - `/users`: Platform IAM, Owners & Staff Directory.
  - `/orders`: Cross-Restaurant Global Order Stream & Dispute Audit.
  - `/settings`: Platform Governance, Fees & Maintenance Controls.
  - `/audit-logs`: System Security Event Trail.
- **State Management**:
  - `useAdminAuthStore.ts` (Zustand: JWT token, `SUPER_ADMIN` identity).
  - `useAdminThemeStore.ts` (Zustand: dark/light theme toggle).
- **Data Fetching**: `@tanstack/react-query` with centralized `adminApiClient.ts`.
- **Icons**: Native React `lucide-react` icons (replacing Google Material Symbols web font for zero-latency instant rendering and reliable offline loading).

---

## 5. Backend API Endpoints Needed (`apps/api`)

Protected with `@UseGuards(JwtAuthGuard, SuperAdminGuard)`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/admin-login` | Authenticate Super Admin with email & password |
| `GET` | `/api/v1/admin/dashboard/stats` | Platform-wide totals (restaurants, branches, orders, GMV) |
| `GET` | `/api/v1/admin/dashboard/volume-chart` | 30-day historical order volume & revenue timeline |
| `GET` | `/api/v1/admin/restaurants` | List all platform restaurants with status, branch count, owner |
| `PATCH` | `/api/v1/admin/restaurants/:id/status` | Approve, suspend, or reactivate a restaurant |
| `GET` | `/api/v1/admin/users` | List all platform users with role filters |
| `PATCH` | `/api/v1/admin/users/:id/status` | Disable or enable user account |
| `GET` | `/api/v1/admin/orders` | Global order stream across all tenants |
| `POST` | `/api/v1/admin/orders/:id/refund` | Super Admin dispute refund trigger |
| `GET` | `/api/v1/admin/audit-logs` | Retrieve chronological administrative action logs |
| `GET` | `/api/v1/admin/settings` | Read and update platform governance settings |

---

## 6. Phased Implementation Roadmap

### **Phase 1: Project Scaffolding & Centralized Theme File**
1. Scaffold `apps/admin` (Vite + React 19 + TypeScript + Tailwind CSS v4).
2. Configure `vite.config.ts` on port `5175` with proxy to `/api` on `localhost:3000`.
3. Create `apps/admin/src/styles/admin-theme.css` with the decoupled CSS variables.
4. Setup Zustand `useAdminAuthStore` and `useAdminThemeStore`.

### **Phase 2: Global Control-Plane Shell (Layout & Navigation)**
1. Build `AdminLayout.tsx` featuring the 256px fixed Sidebar (`Instant QR Control Plane` + `ROOT` badge).
2. Build `AdminHeader.tsx` with `⌘K` search shortcut, cluster status indicator, and profile menu.
3. Setup protected route guard requiring `isPlatformAdmin: true` or `role: SUPER_ADMIN`.
4. Build the dedicated Super Admin `/login` page.

### **Phase 3: Platform Overview Dashboard**
1. Bento metric cards: Active Restaurants, Physical Outlets, Platform Orders, Platform GMV.
2. Order Volume & Revenue chart component.
3. Pending Approval review card.
4. Recent Signups table with status chips.

### **Phase 4: Restaurant & Tenant Directory (`/restaurants`)**
1. Segmented status tabs: All, Active, Pending Review, Suspended.
2. Tenant data table with live storefront links (`/r/:slug`).
3. Slide-over Tenant Drawer showing KYC, owner contact, and branch fleets.
4. Wire backend actions: `Approve`, `Suspend`, `Reactivate`.

### **Phase 5: Platform Users & Access Management (`/users`)**
1. IAM directory listing all Owners, Managers, and Staff.
2. Role filtering and search.
3. User Privilege & Status Management Modal.

### **Phase 6: Global Orders & Dispute Audit (`/orders`)**
1. Real-time telemetry bar (feed connection, logged orders, GMV).
2. Global order audit table with restaurant and branch scoping.
3. Itemized order receipt drawer with dispute actions.

### **Phase 7: Platform Settings & System Audit Logs (`/settings`, `/audit-logs`)**
1. Governance policy toggles and emergency maintenance switch.
2. Chronological administrative audit logs with action diffs.

