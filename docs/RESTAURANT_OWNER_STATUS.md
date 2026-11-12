# Restaurant Owner Side – Status & Roadmap

## 1. What We Have Built (Restaurant Owner Side)

### A. Authentication & Concept Management
- **Auth Flow**: JWT-based sign-up, sign-in, persistent sessions, route guards.
- **Restaurant Concepts (`RestaurantsPage.tsx`)**:
  - Multi-brand restaurant management with brand letter tiles and concept cards.
  - Concept creation & editing with name, description, logo upload, and default brand currency.
  - Nested branch cards grouped under each restaurant concept.
  - Clean semantic dark/light theme integration.

### B. Physical Branch Management (`BranchesPage.tsx`)
- **Branch Storefronts**:
  - Creation & editing of physical branches mapped to a restaurant concept.
  - Multi-currency support per branch (e.g., INR, USD, EUR, GBP, AED, SGD, MYR).
  - Slug generation for QR link preview (`/r/:branchSlug`).
  - Contact phone with country dial codes, street address, and active status toggles.
  - Automatic cache invalidation ensuring branches sync instantly with the menu matrix.

### C. Digital Menu Studio (`MenuPage.tsx`)
- **Category System**:
  - Create, edit, and delete food categories with zero-flicker optimistic UI.
- **Master Dish Catalog**:
  - Create, edit, and delete dishes with high-res photo uploads, descriptions, base prices, and dietary badges (Veg/Non-veg).
  - **Branch stock indicator dots** (e.g., `•• 1/2`): Green for in-stock branches, gray for out-of-stock branches with hover tooltips per branch.
  - **Dynamic Stock Badges**: Interactive filter pills (`All dishes`, `Available`, `Sold out`) reflecting actual stock across all branches.
  - **Master Stock Toggle**: One-click master toggle enabling or disabling dish availability across all physical locations.
- **Branch Availability & Pricing Matrix (`BranchMatrixTable.tsx`)**:
  - Full matrix table crossing all master dishes against all physical branches.
  - **One-click instant stock toggle** (In Stock / Sold Out per branch).
  - **Local branch price overrides**: Inline editable prices with currency formatting.
  - **Filters**: Filter dishes by search term, category, stock status (`All`, `Out of stock`, `Price overrides`), or specific branch.
  - **Bulk operations**: Bulk mark in-stock/sold-out and bulk price overrides across selected dishes.
  - Live query synchronization updating catalog and matrix views in real-time.

---

## 2. What Remains To Be Done (Restaurant Owner Side)

1. **Staff & Roles (`/staff`)**:
   - Invite managers, chefs/kitchen staff, and cashiers by email.
   - Role-based permissions (Owner, Branch Manager, Kitchen Staff).
   - Assign staff to specific branches.

2. **Store Settings (`/settings`)**:
   - Restaurant profile & operating hours (opening/closing times per branch).
   - Tax rates, service charge settings, and receipt customization.
   - Table QR code batch generator & PDF export for physical table tents.

3. **Stripe Payments Integration (`/billing`)**:
   - Connect Stripe account for direct payouts.
   - Subscription plans (Free, Pro, Multi-Branch).
   - Invoice history and billing portal.

4. **Live Orders & Kitchen Display (`/orders`)**:
   - Real-time incoming order dashboard with WebSocket or polling updates.
   - Order statuses (`Pending`, `Accepted`, `Preparing`, `Ready`, `Delivered`).
   - Sound/visual alerts for new table orders.

---

## 3. Next Milestone: User (Customer QR Storefront) vs Platform Admin

### Option A: User Side (Customer QR Storefront) – **RECOMMENDED**
- **What it covers**:
  - Mobile-first, responsive digital menu accessible when a diner scans a table QR code (`/r/:branchSlug?table=3`).
  - Real-time branch menu displaying active dishes, local branch prices, branch currency, and live out-of-stock badges.
  - Category navigation, search, and veg/non-veg filter.
  - Add to cart with quantity selection, special cooking notes, and table order placement.
- **Why do this next**:
  - This is the core customer-facing product. Building this completes the end-to-end dining experience and allows you to test the menu, branch overrides, and orders in action.

### Option B: Super Admin Side
- **What it covers**:
  - Global platform dashboard for SaaS operators.
  - Tenant/restaurant owner management, KYC, global subscription tiers, and platform revenue metrics.
- **Why do this later**:
  - Super admin manages tenants who are already running restaurants and collecting customer orders. It is easier and more practical to build after the core restaurant-to-customer loop is working.

