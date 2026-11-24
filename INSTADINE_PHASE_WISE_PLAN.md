# InstaDine — Phase-Wise Implementation & Product Plan

**Product:** InstaDine (instadine.app)  
**Document Version:** 1.0 — November 2026  
**Status:** Active Execution Plan  
**Target Architecture:** Next.js (React/PWA), Node.js (NestJS), PostgreSQL, Redis, WebSockets, Google Gemini Flash AI (Free Tier), Stock Food Image API (Pexels/Unsplash + Pollinations.ai)

---

## Executive Summary

InstaDine is an ultra-fast, zero-subscription QR ordering and kitchen management system built for small cafés, food stalls, food trucks, and quick-service outlets. 

### Core Differentiators
1. **5-Minute Guided Onboarding:** 1-click authentication, AI menu import with auto dish images, staff PINs, table QR generation, and test order all completed in under 5 minutes.
2. **Prepaid Pay-Per-Order Model:** No monthly fees. 1 confirmed order = 1 credit (~$0.01 / ~₹0.30 or less). 100 free credits upon signup.
3. **Automated AI Dish Imagery (Approach 2):** Menus without photos automatically get high-quality food photography using free commercial APIs (Pexels/Unsplash) with AI fallback (Pollinations.ai).
4. **Restaurant Portal Audio-Visual Alerts:** Instant high-priority popup modal with a repeating audio chime on incoming orders until confirmed.
5. **Kitchen Prep Timing & KDS Running Duration:** Accepting an order marks it paid, deducts 1 credit, prompts for estimated prep time, and displays live running countdown timers on the Kitchen Display System (KDS).
6. **Dynamic Database-Driven Plans:** All credit packs, prices, bonuses, and feature tier unlocks are managed dynamically via PostgreSQL and the Super Admin panel.

---

## Technical Baseline & API Key Setup

| Component | Technology / Provider | Cost | API Key Required? | Notes |
|---|---|---|---|---|
| **Frontend** | Next.js (App Router), Tailwind CSS, PWA | Free / Open Source | No | Lightweight PWA (< 200 KB initial bundle). |
| **Backend API** | Node.js (NestJS / Express), WebSockets / SSE | Free / Open Source | No | Real-time order dispatch and ledger processing. |
| **Database** | PostgreSQL | Free / Open Source | No | Transactional ledger, dynamic plans, relational schemas. |
| **Cache & Queue** | Redis | Free / Open Source | No | Real-time state, rate limits, async background jobs. |
| **Menu OCR (Vision)** | **Google Gemini Flash** | **$0 (Free Tier)** | **Yes** (Google AI Studio) | 1,500 requests/day, 15 RPM. Zero card required. |
| **Dish Auto-Descriptions** | **Google Gemini Flash** | **$0 (Free Tier)** | **Yes** (Same key) | Generates appetizing 1-sentence descriptions if none provided. |
| **Menu Translation** | **Google Gemini Flash** | **$0 (Free Tier)** | **Yes** (Same key) | Multi-language translation cached in PostgreSQL. |
| **Dish Stock Images** | **Pexels / Unsplash API** | **$0 (Free Tier)** | **Yes** (Pexels / Unsplash) | Free commercial use. Instant search by dish title. |
| **Fallback Image Gen** | **Pollinations.ai (Flux)** | **$0 (Free)** | **No Key Needed** | Fallback for rare dishes. Zero sign-up, zero cost. |
| **Payments** | Modular Gateway (Stripe / Razorpay) | Standard gateway fees | Yes | Abstraction layer; provider confirmed before launch. |

---

## Phased Implementation Roadmap

```
PHASE 0: Foundations & Data Models (Weeks 1–2)
   │
   ▼
PHASE 1: 5-Minute Quick Setup & AI Menu Engine (Weeks 3–5)
   │
   ▼
PHASE 2: Real-time Ordering, KDS & Preparation Flow (Weeks 6–8)
   │
   ▼
PHASE 3: Credit Ledger, Dynamic Plans & Super Admin (Weeks 9–10)
   │
   ▼
PHASE 4: Multilingual Engine, TV Display & Reporting (Weeks 11–12)
   │
   ▼
PHASE 5: Field Pilots, Production Hardening & Launch (Weeks 13+)
```

---

### Phase 0: Foundations & Data Models (Weeks 1–2)

**Goal:** Establish the foundational infrastructure, repository structure, environment configuration, and database schemas.

#### Tasks:
1. **Repository & Workspace Setup:**
   - Configure monorepo structure (Customer PWA, Restaurant Portal, Super Admin, Backend API).
   - Establish Docker compose for local PostgreSQL and Redis.
2. **Database Schema & Migrations:**
   - `accounts`: Store restaurant owner account, status, country, currency, credit balance cache.
   - `outlets`: Outlet name, address, timezone, currency, dine-in/takeaway flags.
   - `users`: Staff members with role (`OWNER`, `CASHIER`, `KITCHEN`, `WAITER`) and 4-digit PIN.
   - `menus`, `categories`, `items`, `item_options`: Menu hierarchy with photos, tags (veg/non-veg, spicy), availability.
   - `tables`: Table/counter labels, short codes, permanent QR token URLs.
   - `orders`: Order number, type (dine-in/takeaway), status (`PLACED`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `REJECTED`, `EXPIRED`), totals, `prep_time_minutes`, `prep_started_at`, `estimated_ready_at`.
   - `order_items`: Line items, options, special notes, pricing.
   - `credit_ledger`: Append-only ledger (`account_id`, `delta`, `reason`, `ref_id`, `balance_after`, `created_at`).
   - `packs`: **Dynamic DB table** (`id`, `code`, `name`, `orders_count`, `bonus_credits`, `price_usd`, `price_inr`, `regional_pricing_json`, `features_json`, `is_active`, `sort_order`).
3. **Environment & API Credentials:**
   - Configure `GEMINI_API_KEY` from Google AI Studio.
   - Configure `PEXELS_API_KEY` and `UNSPLASH_ACCESS_KEY`.
   - Setup S3/Cloudflare R2 bucket for dish photos, uploaded menus, and generated QR PDFs.
4. **Seed Initial Plans in Database:**
   - Seed Free (100 credits), Starter (500), Growth (1,500), Pro (3,300), Business (11,500), Chain (30,000) packs into `packs` table.

**Deliverable for Phase 0:** Working database migrations, seed data, and verified connections to Gemini & Stock Image APIs.

---

### Phase 1: 5-Minute Quick Setup & AI Menu Engine (Weeks 3–5)

**Goal:** Deliver the end-to-end guided onboarding wizard allowing any restaurant owner to go from registration to a live QR menu in under 5 minutes.

#### Step-by-Step Flow Implementation:

#### 1. Step 1: Quick Auth & Profile (≈ 45 seconds)
- 1-click **Google Sign-In** or **Mobile Phone OTP** (SMS/WhatsApp). No passwords, no credit card required.
- Quick modal: Outlet Name, Currency, Timezone, and Service Types (Dine-in / Takeaway).
- Automatically credit **100 free order credits** to the account ledger.

#### 2. Step 2: Categories & Dishes with AI (≈ 2 minutes)
- **AI Auto-Import (Vision OCR):**
  - Owner uploads a photo or PDF of their paper menu.
  - Backend sends image to **Google Gemini Flash Vision API** with structured JSON output schema.
  - Automatically extracts: Categories (e.g. *Starters, Drinks*), Dish Names, Descriptions (if present), and Prices.
- **Automated AI Dish Descriptions (Gemini Flash):**
  - If an extracted dish (or manually added item) has **no description**, Gemini Flash automatically generates a mouth-watering, appetizing 1-sentence food description (under 15 words) based on the dish name and category.
- **Automated Food Image Pairing (Approach 2):**
  - For each extracted dish without an image, the backend queries the **Pexels / Unsplash API** by dish title.
  - If a match is found: download and cache high-resolution image to S3 CDN.
  - Fallback for rare/regional dishes: call **Pollinations.ai** (`https://image.pollinations.ai/prompt/{dish}?width=800&height=600&model=flux`) and cache image.
  - Owner gets a quick 30-second review screen: tap to edit price, description, swap photo, or delete item.
- **Rapid Manual Fallback:**
  - One-tap category templates (*Starters, Mains, Beverages, Desserts*) with instant inline item entry and 1-click AI description generation.

#### 3. Step 3: Staff & PIN-Based Roles (≈ 45 seconds)
- Add staff name and select role:
  - *Cashier / Counter Staff* (Manages orders, confirms payments, sets prep time).
  - *Kitchen Chef* (KDS view, updates prep status).
  - *Server / Waiter* (Delivery status).
- Assign a **4-digit PIN** so staff can log into terminal screens from any phone or tablet without email invitations.

#### 4. Step 4: Tables & Permanent QR Generation (≈ 30 seconds)
- Enter number of tables or select counter pickup.
- System generates permanent short URLs (`instadine.app/q/{token}`).
- Instant PDF generation for printable table tents and counter QR display cards.

#### 5. Step 5: Interactive Live Test Order (≈ 1 minute)
- Onboarding wizard displays a live test QR code.
- Owner scans with their phone $\rightarrow$ places a test order $\rightarrow$ sees it appear on their dashboard with sound $\rightarrow$ completes setup.
- **Guaranteed completion within 5 minutes.**

**Deliverable for Phase 1:** Complete self-serve 5-minute onboarding flow with automated AI menu extraction and image pairing.

---

### Phase 2: Real-time Ordering, KDS & Preparation Flow (Weeks 6–8) - [COMPLETED]

**Goal:** Build the lightning-fast customer ordering PWA, real-time counter alert system, and kitchen display with running duration timers.

#### Tasks:

#### 1. Customer Ordering PWA (< 200 KB) - [COMPLETED]
- Instant menu load from QR code without login or app install.
- Category tabs, search bar, dietary tags (Veg / Non-veg / Spicy / Halal).
- Item modal: Add-ons, special instructions, and appetizing food images.
- Cart & Checkout: Select Dine-in (Table # auto-filled) or Takeaway $\rightarrow$ Enter customer name $\rightarrow$ Generates unique **Order #** with banner *"Pay at the counter"*.
- Live tracking screen: Waiting for payment $\rightarrow$ Preparing (with live countdown & animated progress bar) $\rightarrow$ Ready (celebration banner) $\rightarrow$ Completed.

#### 2. Restaurant Portal Real-Time Alert System - [COMPLETED]
- Real-time polling & order detection on counter dashboard.
- **Instant High-Priority Popup Modal (`NewOrderAlertModal`):**
  - When an order arrives, an overlay modal takes focus displaying Order #, Table/Takeaway, Item breakdown with notes, and Total Amount.
- **Continuous Audible Sound Alert (`audioAlert.ts`):**
  - Repeating dual-tone chime plays continuously until staff taps *"Acknowledge"* or *"Accept"*.
  - Header sound toggle allows 1-tap muting or testing sound anytime.

#### 3. Accept, Mark Paid & Preparation Time Selection - [COMPLETED]
- Staff clicks **"Accept & Set Prep Time"**:
  - Opens `PrepTimeModal` with quick presets: `[10 min]`, `[15 min]`, `[20 min]`, `[30 min]`, `[45 min]`, or Custom minutes.
  - Single atomic database transaction: Status moves to `PREPARING` and **1 credit is deducted** from the ledger (`CreditLedger` entry created with `ORDER_CONFIRMED`).
  - Sets `prep_started_at = NOW()` and `estimated_ready_at = NOW() + INTERVAL 'X minutes'`.
  - Customer tracking screen updates immediately to show real-time countdown (*"~14:32 mins remaining"*).

#### 4. Kitchen Display System (KDS) & Running Duration (`/kds`) - [COMPLETED]
- Dedicated tablet / screen view for kitchen staff accessible at `/kds` (with full-screen & audio toggles).
- Active order cards showing items, modifications, notes, and **Live Running Duration Timer**:
  - Format: `Elapsed: 07:12 / Target: 15:00 min`.
  - **Color Warnings:**
    - **Green:** On schedule (0% – 75% of target time elapsed).
    - **Amber:** Approaching target (75% – 100% of target time elapsed).
    - **Red / Flashing:** Overdue (> 100% of target time elapsed, e.g. `+02:15 OVERDUE`).
- Kitchen tap actions: *"Mark Ready 🛎️"* $\rightarrow$ moves order to Ready queue, updates customer tracking screen, triggers ready alert.
- *"Served & Completed ✅"* clears the order.

#### 5. Customer Portal Digital Receipt & Print Flow - [COMPLETED]
- **Customer Viewable Thermal Receipt (`CustomerReceiptModal`):** Accessible directly on customer's phone from both the Live Order Tracking screen (`OrderTrackingModal`) and Order History (`MyOrdersModal`).
- **1:1 Match with Restaurant Side POS Thermal Receipt:**
  - Standard POS thermal paper format (white monospace layout on soft backdrop with ASCII double dividers `====================`).
  - Thermal Paper Width selector (`80mm (Standard POS)` / `58mm (Compact)`).
  - Restaurant & Branch details (Name, Branch name, Address, Phone).
  - Order number, Date & Time, Dine-in Table # / Takeaway, Customer Name & Phone.
  - Tabular column breakdown: `ITEM`, `QTY`, `PRICE`, `TOTAL`.
  - Item customizations/notes and Customer Instruction box.
  - Totals: Items Subtotal, GST/Tax, Grand Total Bill, Payment Method (`CASH`), and Payment Status (`PAID` / `PENDING`).
  - Dynamic `@media print` styling injection with page margin presets (80mm/58mm) for crisp thermal receipt or PDF printing.

**Deliverable for Phase 2:** Full real-time operational loop: Customer order $\rightarrow$ Customer digital receipt $\rightarrow$ Counter popup + sound $\rightarrow$ Prep time selection & 1-credit deduction $\rightarrow$ KDS duration timer $\rightarrow$ Customer ready alert. [VERIFIED & COMPLETED]

---

### Phase 3: Credit Ledger, Dynamic Plans & Super Admin (Weeks 9–10) - [COMPLETED]

**Goal:** Implement the rock-solid prepaid credit ledger and full dynamic plan management via the database and Super Admin panel.

#### Tasks:

#### 1. Append-Only Transactional Credit Ledger - [COMPLETED]
- Ledger guarantees:
  - Credits can **only be appended, never modified or deleted** (`credit_ledger` table).
  - Account `credit_balance` is cached on the account table, synchronized via atomic DB transactions.
  - Ledger reasons: `FREE_SIGNUP`, `PACK_PURCHASE`, `ORDER_CONFIRMED`, `GRACE_RECOVERY`, `ADMIN_ADJUSTMENT`, `REFUND`.
- **Grace Buffer:** Up to 20 orders allowed after balance hits 0 (balance down to -20) so no outlet is cut off mid-shift. If balance reaches -20, order acceptance is halted until top-up. Negative balance is automatically reconciled on the next top-up.
- **Low-Credit Notifications:** Warning banners on dashboard and automated alerts when balance is $\le 50$ credits.

#### 2. Dynamic DB-Driven Plans (`packs` table) - [COMPLETED]
- Plan attributes stored in database:
  - `code`, `name`, `orders_count`, `bonus_credits`, `price_usd`, `price_inr`, `regional_pricing_json`.
  - `features_json`: Feature unlocks (Reports, Translation, KDS, Multi-counter).
  - `is_active`: Toggle visibility on restaurant pricing page.
  - `sort_order`: Display sequence.
- Restaurant dashboard dynamically queries available packs from the API (no hardcoded pricing).

#### 3. Super Admin Plan Management (CRUD) - [COMPLETED]
- Admin UI for managing plans (`SuperAdminPlansPage.tsx` at `/admin/plans`):
  - **Create New Pack:** Add promotional packages (e.g. Festival packs, custom regional packs).
  - **Edit Pricing & Bonuses:** Adjust USD/INR pricing or bonus credits without deploying code.
  - **Feature Tier Mapping:** Dynamically assign feature permissions to specific packs.
  - **Activate / Deactivate:** Hide expired or legacy packs with a single toggle.

#### 4. Payment Gateway Adapter (Stripe / Razorpay / Direct Sandbox) - [COMPLETED]
- Modular payment abstraction interface (`CreditCheckoutModal.tsx`):
  - Checkout flow for purchasing credit packs with Stripe, Razorpay (UPI/QR), and direct sandbox test recharge.
  - Webhook & transaction processing with idempotency keys (prevents duplicate credit additions).
  - Invoice and receipt generation with reference codes.

**Deliverable for Phase 3:** Complete dynamic credit billing system with Super Admin plan controls and payment gateway integration. [VERIFIED & COMPLETED]

---

### Phase 4: Multilingual Engine, TV Display & Reporting (Weeks 11–12) - [COMPLETED]

**Goal:** Expand regional accessibility, customer callout displays, and actionable analytics.

#### Tasks:

#### 1. TV Order Ready Board with Voice Callout (`/tv` & `/tv/:branchId`) - [COMPLETED]
- High-contrast, large-format full-screen order pickup board designed for wall-mounted 1080p/4K TVs and tablets.
- **Dual Column Architecture:**
  - **Preparing / Cooking:** Warm amber theme with live running prep duration timers, table/takeaway badges, and ticket numbers.
  - **Ready for Pickup:** Emerald green glowing cards with giant order numbers (`#102`), counter collection prompts, and newly ready pulse animations.
- **Audio & Voice Callout (`audioAlert.ts`):**
  - Integrated browser Web Speech Synthesis (`window.speechSynthesis`) + triple-tone chime: announces *"Order number {X} is ready for pickup"*.
  - Sequenced speech queue preventing audio overlap.
  - Live clock, audio toggles (Voice on/off, chime on/off, test callout), and Smart TV share link.

#### 2. Multilingual Menu Translation Engine (Google Gemini Flash) - [COMPLETED]
- **1-Click AI Translation:** Translates categories, dish titles, and descriptions into regional languages (Hindi, Tamil, Telugu, Malayalam, Kannada, Spanish, French, Arabic, Malay).
- **Culinary Transliteration:** Automatically transliterates dishes like Biryani, Dosa, Paneer, Tikka, and Shawarma into culturally authentic native scripts.
- **Database Caching & Overrides:** Stored directly in `Category.translations` and `Product.translations` JSON columns with manual owner edit modal (`TranslateMenuModal.tsx`).
- **Customer Storefront Localization:** Instant localized browsing via native language picker dropdown on Customer PWA with zero page reload.

#### 3. Sales Analytics & Daily Reports (`/analytics`) - [COMPLETED]
- **Core KPI Metrics:** Gross Revenue, Tax totals, Ticket volumes, Dine-in vs Takeaway split, Average Order Value (AOV), and Average Kitchen Prep Time.
- **Peak Hours Distribution:** 24-hour order velocity bar chart identifying lunch and dinner rush periods.
- **Top 10 Dishes Leaderboard:** Ranked by order count and revenue contribution.
- **Export & Print:** 1-click CSV export and printable daily register report for accounting.

**Deliverable for Phase 4:** Multilingual support, TV pickup display system, and automated sales reporting. [VERIFIED & COMPLETED]

---

### Phase 5: Field Pilots, Production Hardening & Launch (Weeks 13+)

**Goal:** Conduct pilot tests in target markets (India and Philippines), optimize offline behavior, and execute go-to-market.

#### Tasks:
1. **Field Pilots (30 Outlets in India, 15 in Philippines):**
   - Deploy in local cafés, street kiosks, and food court stalls.
   - Monitor real-world onboarding completion time (target: < 5 minutes).
   - Evaluate network stability on 3G/4G connections.
2. **Offline Resilience & Caching:**
   - Service worker caching for customer menus to ensure instant loading even during momentary mobile data drops.
   - Automatic reconnect and offline queue sync for restaurant portal.
3. **Auto Top-Up:**
   - Enable optional card mandate for automated credit recharges when balance drops below 20 credits.
4. **Public Go-To-Market Launch:**
   - Launch Instagram ad campaigns (*"Photo to QR in 5 minutes. 100 free orders, no card"*).
   - Activate *"Powered by InstaDine"* referral links on customer digital menus.

---

## Phase Summary & Milestone Checklist

| Phase | Duration | Core Deliverables | Target Milestone |
|---|---|---|---|
| **Phase 0** | Weeks 1–2 | Schemas, DB migrations, Gemini API & Stock Image API setup, dynamic `packs` seed | Architecture & API validation [COMPLETED] |
| **Phase 1** | Weeks 3–5 | 5-Minute Setup Wizard, AI Vision menu OCR, auto dish descriptions & images, staff PINs, QR PDF | Frictionless onboarding operational (< 5 min) [COMPLETED] |
| **Phase 2** | Weeks 6–8 | Customer PWA, Portal popup + repeating audio alert, Prep time selector, KDS duration timer | End-to-end real-time ordering & kitchen loop [COMPLETED] |
| **Phase 3** | Weeks 9–10 | Transactional ledger, dynamic DB plans, Super Admin plan CRUD, payment checkout | Complete monetization & credit system [COMPLETED] |
| **Phase 4** | Weeks 11–12 | Gemini multilingual translation, TV ready board with audio callout, sales reports | Feature tier enhancements (NEXT) |
| **Phase 5** | Weeks 13+ | 45-outlet field pilot, network caching, auto top-up, public marketing launch | Commercial release & field scaling |

---

*Document generated and maintained for the InstaDine engineering and product team.*
