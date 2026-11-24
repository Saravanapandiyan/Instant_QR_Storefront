# InstaDine — Product Development Plan

**Product:** InstaDine (instadine.app)
**Owner:** Hitasoft Technology Solutions
**Version:** 1.0 — November 2026
**Status:** Planning

---

## 1. Summary

InstaDine is a simple QR ordering system for small and street restaurants around the world.

A restaurant signs up, builds its menu (AI can import it from a photo) and prints its own QR codes for tables or the counter. A customer scans the code, a web app opens (it can be installed as a PWA, but doesn't have to be), they order, pay at the counter, and wait for their food, eaten in or taken away.

**No subscription.** Restaurants buy prepaid order credits through Stripe, like a prepaid mobile recharge. One confirmed order uses one credit. Credits never expire. New restaurants start with free credits and no card needed.

**Positioning:** *"1¢ per order, or less. No subscription. Live in 5 minutes."*

---

## 2. Problem and opportunity

| For the restaurant owner | For the customer |
|---|---|
| Queues at the counter at busy times | Waiting in line just to place an order |
| Order mistakes from verbal orders | Unclear menus, language barriers |
| Printed menus are costly to update | No idea when the food will be ready |
| Ordering software means monthly subscriptions and hardware | Downloading an app just to order |

**Why it can win**
- Most QR and POS tools sell **monthly subscriptions** aimed at mid-size and large restaurants. Small and street outlets are poorly served.
- **Pay-per-order pricing** means almost no risk for owners. They pay only when they get orders.
- **5-minute self-setup** with AI menu import means no sales team and very little support.
- The product works **without a POS, hardware or online payments**, so it fits outlets with no software at all.

---

## 3. Target customers

### Primary: small and street food businesses
- Cafés, tea and coffee shops, milk-tea and juice kiosks
- Street food stalls, food trucks, takeaways
- Hawker centres, food courts and food parks (**best fit**: many stalls, shared seating)
- Small quick-service restaurants with counter service

### Not targeted at launch
- Fine dining and full table-service restaurants
- Large chains that need deep POS integration

### Ideal customer
- 30–300 orders a day
- 1–5 staff
- The owner makes the decision alone
- Customers already have smartphones and are used to scanning QR codes

---

## 4. Launch markets

| Phase | Market | Why |
|---|---|---|
| Launch | **India** | Home market. Very familiar with QR codes thanks to UPI. Team can visit outlets and learn fast. Huge number of small outlets. |
| Launch | **Philippines** | English-speaking. Very large carinderia, stall, kiosk and food-park scene. GCash and Maya QR are used daily. |
| Phase 2 | **Malaysia** | Hawker stalls, mamak shops and food courts fit the flow almost perfectly. English works for business. |
| Phase 3 | **UK** | Independent takeaways, street-food markets and food halls. Higher-paying owners. |
| Later | Singapore, UAE, USA (food trucks and food halls), South Africa, Pakistan, Bangladesh, Sri Lanka, Nigeria, Kenya | Based on traction and multi-language readiness |

---

## 5. Core user flows

### 5.1 Restaurant owner: 5-Minute Quick Sign-up & Onboarding Flow
The entire onboarding is structured as a streamlined 5-step wizard guaranteed to take **under 5 minutes** from landing to taking live orders:

1. **Step 1: Quick Sign-up & Profile (≈ 45 seconds)**
   - 1-click Google Sign-In or Mobile Phone OTP (SMS/WhatsApp). **No password, no credit card required.**
   - Enter Outlet Name, Currency, Timezone, and Service Type (Dine-in / Takeaway).
   - **100 free order credits** are instantly provisioned to the account.

2. **Step 2: Add Categories & Dishes with AI (≈ 2 minutes)**
   - **Option A (AI Auto-Import - Fastest):** Snap a photo or upload a PDF of the paper menu. Vision AI extracts all **Categories, Dish names, Descriptions, and Prices** automatically.
     - **Automated AI Dish Images:** AI automatically generates or pairs realistic, appetizing food photos for any dish lacking an image.
     - Quick 30-second review screen to adjust prices or names.
   - **Option B (Rapid Manual Entry):** One-click category templates (e.g., *Beverages, Starters, Mains, Desserts*) with instant inline dish and price entry.

3. **Step 3: Add Staff & Roles (≈ 45 seconds)**
   - Quickly create team members by entering Name and Role (*Cashier / Counter*, *Kitchen Chef*, *Server*).
   - Assign a simple **4-digit PIN** or phone login so staff can access the POS counter dashboard or Kitchen Display System (KDS) immediately from any phone or tablet without needing personal email accounts.

4. **Step 4: Tables & Instant QR Code Generation (≈ 30 seconds)**
   - Enter table count or select counter pickup.
   - System instantly generates permanent QR codes and a downloadable, ready-to-print PDF sheet (table tents / counter standees).

5. **Step 5: Test Order & Go Live (≈ 1 minute)**
   - An interactive test QR code appears on screen: owner scans with their smartphone, places a mock order, hears the audio alert on the dashboard, confirms it, and sees it on the KDS.
   - Outlet is immediately live and ready to take customer orders. **Total setup time: under 5 minutes.**

### 5.2 Customer: ordering
1. Scan the QR code on the table or counter → the outlet's menu opens in the browser (no app download).
2. Browse the menu (AI-generated food photos, categories, veg/non-veg and dietary tags, language switch).
3. Add items, with options and notes.
4. Choose **Dine-in** (table number filled in from the QR code) or **Takeaway**.
5. Enter a name and an optional phone number.
6. Place the order → get an **order number** and the message "Pay at the counter."
7. Show the order number at the counter → staff confirm the payment.
8. The live status screen shows: Waiting for payment → Preparing (with estimated time countdown) → **Ready**.
9. Collect the food, or have it served to the table.

### 5.3 Counter and kitchen staff
1. **Instant Order Alert:** A new order arrives → **immediate visual popup modal appears on the restaurant portal** accompanied by an **audible repeating chime/sound alert** until acknowledged by staff.
2. **Confirm, Mark Paid & Set Prep Time:** Customer pays at the counter → staff tap **Confirm & Paid** → **one credit is deducted**.
   - Staff selects the **estimated preparation time** via quick buttons (e.g. 10m, 15m, 20m, 30m, or custom).
   - Order status moves to **Preparing**. Customer screen updates with the live countdown.
3. **Kitchen Screen (KDS) & Running Duration:**
   - The kitchen display shows the order ticket with a **live running duration timer** (e.g., `Elapsed: 06:40 / 15:00`).
   - Color indicators alert kitchen staff: Green (on schedule) → Yellow (approaching target) → Red (delayed/overdue).
   - Optional kitchen ticket printout.
4. **Mark Ready:** Kitchen marks **Ready** → Customer screen updates live; optional TV display announces order number via voice.
5. **Mark Completed:** Handed over to customer.

### 5.4 Order lifecycle

```
PLACED ──(staff popup alert + sound)
   │
   ├──(confirm + mark paid + set prep time)──► CONFIRMED / PREPARING ──► READY ──► COMPLETED
   │         [1 credit used]                    [KDS running timer]
   │
   ├──(no confirmation in X min)─────────────► EXPIRED   [no credit]
   └──(staff reject)─────────────────────────► REJECTED  [no credit]
```

**Rule:** only **confirmed** orders use credits. Fake, unpaid and abandoned orders cost the restaurant nothing.

---

## 6. Pricing: prepaid order credits

### 6.1 Principles
- **No subscription. No monthly fee. No hardware. No annual maintenance contract.**
- **Free start:** 100 free order credits, **no credit card needed**.
- **1 confirmed order = 1 credit.**
- **Credits never expire.**
- **Bonus credits** on bigger packs, instead of discounts.
- Each pack shows **how long it lasts** (e.g. "≈ 1 week at ~70 orders a day").
- **Features unlock** with bigger packs.
- **Dynamic DB-Driven Plans:** All plans, credit counts, bonus structures, prices, and feature flags are fed directly from the database and manageable via the Super Admin panel (no code changes required to run promos or adjust pricing).

### 6.2 Credit packs (Database-Driven)

| Pack | Orders | Bonus | Total | Global (USD) | India (INR) | Per order (USD) | Lasts about* |
|---|---|---|---|---|---|---|---|
| **Free** | 100 | – | 100 | Free (no card) | Free (no card) | – | 1–2 days |
| **Starter** | 500 | – | 500 | $5 | ₹149 | 1.0¢ | 1 week |
| **Growth** | 1,500 | – | 1,500 | $12 | ₹399 | 0.8¢ | 3 weeks |
| **Pro** ⭐ Most popular | 3,000 | +300 | 3,300 | $20 | ₹699 | 0.6¢ | 6 weeks |
| **Business** | 10,000 | +1,500 | 11,500 | $50 | ₹1,999 | 0.43¢ | 4–5 months |
| **Chain** | 25,000 | +5,000 | 30,000 | $100 | ₹4,999 | 0.33¢ | Multiple outlets |

\*Based on about 70 orders a day for a single outlet. All packs fed from `packs` database table and configurable via Super Admin.

\*Based on about 70 orders a day for a single outlet.

India pricing works out to **30 paise per order or less**.
Philippines and Malaysia: start with USD pricing shown in local currency through Stripe. Set local price points (PHP, MYR) once early data comes in.

### 6.3 Features by pack

| Feature | Free / Starter | Growth | Pro | Business | Chain |
|---|---|---|---|---|---|
| QR menu and ordering (dine-in and takeaway) | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI menu import | ✅ | ✅ | ✅ | ✅ | ✅ |
| Counter dashboard and printable QR codes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Live order status for customers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily sales reports | – | ✅ | ✅ | ✅ | ✅ |
| Multi-language menu (auto-translate) | – | – | ✅ | ✅ | ✅ |
| Kitchen ticket printing and kitchen screen | – | – | ✅ | ✅ | ✅ |
| TV "order ready" display with voice announcement | – | – | ✅ | ✅ | ✅ |
| Multiple counters or stalls | – | – | – | ✅ | ✅ |
| Staff accounts and roles | – | – | – | ✅ | ✅ |
| Multiple outlets, shared menu | – | – | – | – | ✅ |
| Priority support | – | – | – | – | ✅ |

**Unlock rule:** an account's features match the **highest pack bought**, and stay on **as long as the account has credits left**. When credits run out, features drop back to Starter level until the next top-up.

### 6.4 Credit rules
- **Low-credit alert** at 50 credits remaining (email, WhatsApp and dashboard banner).
- **Grace buffer:** up to **20 orders** can still be confirmed after reaching 0, so no outlet is cut off during a rush. These are deducted from the next top-up.
- **Auto top-up (optional):** with a saved card, buy the same pack again automatically when credits drop to 20.
- **Taxes:** Stripe Tax for VAT and GST where needed. In India, show prices as "No GST added" or include GST, per the tax decision.

---

## 7. Payments: Architecture & Gateway Selection

### 7.1 Scope
Payment processing handles **restaurant owners buying credits**. Customers paying for food happens **at the counter** (cash, UPI, card, or local QR) and is **outside** InstaDine in version 1.

### 7.2 Pluggable / Modular Payment Architecture
The payment infrastructure uses an abstraction layer so the specific gateway can be selected and confirmed (e.g. Stripe, Razorpay, Cashfree, or others) based on business entity decisions:
- **Free plan:** no customer payment profile or card needed.
- **Buying credits:** Hosted checkout or drop-in payment sheet in one-time mode, mapped to dynamic packs in the database.
- **Saved card / recurring mandate for auto top-up:** Saves payment method securely to charge background top-ups when credits fall below threshold.
- **Webhooks:**
  - payment completed → add credits to ledger, record purchase, unlock pack features.
  - payment failed → notify owner, disable auto top-up.
  - refund → claw back unused credits.
- **Receipts and invoices:** Automatic tax receipts and downloadable invoice PDFs.
- **Idempotency:** every credit addition is keyed to the gateway transaction/event ID to prevent duplicate credits.

### 7.3 Gateway Decision & Status
- Gateway selection to be **confirmed by management** (evaluating Stripe vs. Razorpay / local entity requirements).
- Core credit ledger logic is strictly decoupled from the gateway chosen.

---

## 8. Product modules

### 8.1 Customer web app (PWA)
- Opens instantly from the QR code; no login required
- Menu with categories, search, appetizing AI-generated item photos, tags (veg/non-veg, spicy, dietary)
- Item options and add-ons, special notes
- Cart → place order → order number
- Live order status updates with **live preparation countdown**
- **Digital Customer Receipt:** View, download, and print digital order receipts directly on customer's phone (itemized breakdown, GST/taxes, paid-at-counter badge, restaurant details)
- Language switch (Pro and above)
- Installable (add to home screen), works on poor networks with cached menu assets
- Mobile-first, very light (target under 200 KB for the first screen)

### 8.2 Restaurant dashboard (web and PWA, phone and tablet)
- **Instant Order Popup & Sound:** Real-time modal popup with high-priority audible alert on new orders until acknowledged
- **Accept, Mark Paid & Prep Time:** Confirming order marks it as paid, deducts 1 credit, and sets estimated preparation duration (10m, 15m, 20m, 30m, custom)
- Menu manager: categories, items, prices, availability toggle (sold out), photos
- **AI menu import & Auto dish images:** Photo/PDF menu OCR extraction + automated dish photo generation
- Tables and zones, QR code generator, printable PDF templates
- Credits wallet: balance, history, buy packs, auto top-up
- Reports: orders, sales, top items, busiest hours (Growth and above)
- Settings: outlet profile, dine-in and takeaway, order expiry time, languages, staff (Business and above)

### 8.3 Kitchen and display
- **Kitchen Display System (KDS):** Tablet or TV browser screen with order queue and **live running duration timers** (e.g. `Elapsed: 08:30 / 15:00`) with visual color warnings (Green on-time → Amber approaching → Red overdue)
- Kitchen ticket printing via a browser print bridge or ESC/POS Bluetooth (Android). Phase 2.
- TV "order ready" board with voice announcement in the customer's language (Pro and above)

### 8.4 Super admin (Hitasoft)
- Restaurant accounts, outlets, verification status
- Credit ledger viewer, manual credit adjustments (logged)
- **Dynamic Plan & Pricing Management:** Complete CRUD to create, edit, activate/deactivate credit packs, update regional pricing (USD, INR, etc.), bonus credits, and feature allocations stored in the database
- Abuse and fraud monitoring (free-credit farming, suspicious accounts)
- Platform metrics dashboard
- Support tools: impersonate (with audit log), resend receipts

---

## 9. AI features

| Feature | Phase | Implementation Choice | Notes |
|---|---|---|---|
| **Menu import from photo or PDF** | MVP | **Google Gemini Flash (Free Tier)** | Vision model → structured JSON (categories, items, prices, options). Free for everyone during onboarding. Requires free Google AI Studio API key. |
| **Automated Dish Image Matching & Generation** | MVP | **Approach 2: Free Food Stock API (Pexels / Unsplash) + Pollinations fallback** | Instantly pairs realistic, appetizing food photos for dishes lacking images. Free commercial API keys used; fallback generator requires no key. |
| **Menu translation** | MVP (Pro) | **Google Gemini Flash (Free Tier)** | Auto-translate item names and descriptions into regional languages. Owner can edit. |
| **Automated Dish Descriptions** | MVP | **Google Gemini Flash (Free Tier)** | Generates appetizing 1-sentence food descriptions if the menu item has none. Included in free tier. |
| **Smart upsell** | Phase 3 | Light LLM | "Add a drink?" suggestions based on what's in the cart. |
| **Voice or chat ordering** | Phase 4 | Experimental | Voice-to-order parsing. |

**API Key & Infrastructure Choice:**
- **Google Gemini Flash:** Free tier from Google AI Studio (`aistudio.google.com`) — 1,500 requests/day, 15 RPM free, no credit card required.
- **Dish Images (Approach 2):** Pexels / Unsplash developer API keys (free commercial tier, instant setup) + Pollinations.ai fallback (no key needed). Images cached permanently in S3.

---

## 10. Technical architecture

### 10.1 Suggested stack
| Layer | Choice |
|---|---|
| Customer PWA and dashboard | Next.js (React), Tailwind, service worker for PWA |
| Backend API | Node.js (NestJS) or similar, REST plus real-time |
| Real-time | WebSockets or server-sent events for order updates |
| Database | PostgreSQL |
| Cache and queues | Redis (sessions, rate limits, background jobs) |
| File storage | S3-compatible storage + CDN (menu photos, generated images, QR PDFs) |
| Payments | Modular gateway adapter (Stripe / Razorpay to be confirmed) |
| AI | Google Gemini Flash (Vision & Translation) + Pexels/Unsplash/Pollinations (Dish Images) |
| Notifications | Email (SES or Postmark), WhatsApp Business API for alerts |
| Hosting | Cloud provider with regions in India and Singapore, CDN worldwide |
| Monitoring | Error tracking, uptime, logs, product analytics |

### 10.2 Core data model
```
accounts            (owner, plan_level, credit_balance, customer_gateway_id, country, currency)
outlets             (account_id, name, address, timezone, currency, settings)
users / staff       (account_id, role, outlet access)
menus / categories / items / item_options
tables / qr_codes   (outlet_id, label, type: table|counter|zone, short_code)
orders              (outlet_id, table_id, order_no, type, status, customer_name, totals, prep_time_minutes, prep_started_at, estimated_ready_at, timestamps)
order_items         (order_id, item_id, qty, options, notes, price)
credit_ledger       (account_id, delta, reason: free|purchase|order|grace|refund|adjust, ref_id, balance_after)
purchases           (account_id, pack_id, amount, currency, payment_gateway_id, status)
packs               (id, code, name, orders_count, bonus_credits, price_usd, price_inr, regional_pricing_json, features_json, is_active, sort_order)
```

### 10.3 Key technical rules
- **The credit ledger can only be added to, never edited.** The balance is calculated from the ledger, with a cached balance on the account.
- **Credit use happens in a single database transaction** together with the order confirmation.
- **QR codes point to short, permanent URLs** (`instadine.app/q/{code}`), so menus can change without reprinting.
- **Rate limits on placing orders** per device, IP and QR code to block spam.
- **Pending orders expire** automatically after a time the restaurant sets (default 15 minutes).
- **Multi-currency and multi-timezone** from the first day.
- **Multi-language interface** (i18n) from the first day.

---

## 11. Development roadmap

### Phase 0: Validation and setup (2 weeks)
- Confirm the brand: InstaDine trademark search (note Meta's history of challenging "Insta-" names), buy instadine.app and instadine.com if possible, claim social handles
- Settle the Stripe entity and payment provider question (section 7.3)
- Interview 15–20 small outlets in India and 5–10 in the Philippines (remote)
- Clickable prototype of the customer and dashboard flows

### Phase 1: MVP (8–10 weeks)
- **5-Minute Quick Setup Wizard:** 1-click Google/OTP auth, outlet profile, category & dish creation with AI photo import, PIN-based staff setup, instant QR code generator, and test order (all under 5 minutes)
- **Automated AI dish image generation:** automatic photo assignment for dishes lacking photos
- QR code generator and printable PDFs
- Customer PWA: menu → cart → order → order number → live status with prep time countdown
- Dashboard: live queue with **instant visual popup modal and repeating sound alert**
- Counter & Kitchen flow: **confirm & mark paid**, prompt **prep time**, **KDS live running duration timer** with color alerts
- Credit ledger, credits deducted on confirmation, grace buffer, low-credit alerts
- Dynamic database-driven credit packs (`packs` table) and Super Admin Plan Management CRUD
- Modular payment gateway adapter (Stripe / Razorpay, final choice confirmed before build), webhooks, receipts
- Feature unlocking by pack
- Basic super admin with account, ledger, and plan controls
- English interface; menu translation for Pro

### Phase 2: Launch and polish (4–6 weeks, alongside a pilot)
- Pilot with 30–50 outlets in India and 10–20 in the Philippines
- Auto top-up with saved card
- Daily reports, best-selling items, busiest hours
- Kitchen screen, TV ready board with voice announcement
- WhatsApp alerts (low credits, daily summary)
- Performance on poor networks, offline-friendly menu cache
- Public launch in India and the Philippines with Instagram ads

### Phase 3: Growth (next 3 months)
- Malaysia launch (Malay and Chinese menus)
- Multiple counters or stalls (food courts, hawker centres), staff roles
- Kitchen ticket printing (Bluetooth or a print bridge)
- Multiple outlets and shared menu (Chain)
- Referral program: "Give 100 credits, get 100 credits"
- SEO landing pages by country and outlet type, free tools (QR menu generator, menu translator)

### Phase 4: Expansion and extra revenue
- UK launch (takeaways, street-food markets, food halls)
- **Optional online payment** by the customer (skip the counter), with a small per-transaction fee
- Paid extras: custom branding, removing "Powered by InstaDine", loyalty, repeat-customer marketing
- Hardware: QR stands and printers (sold at a markup)
- Smart upsell with AI

---

## 12. Go-to-market

### 12.1 Channels
- **Instagram ads (main channel at launch):** Reels showing "Menu photo → QR ready in 5 minutes → orders on your phone. 100 free orders, no card."
  - India: start with 3–5 cities that have many cafés and stalls (e.g. Chennai, Bengaluru, Coimbatore, Madurai, Kochi, Hyderabad)
  - Philippines: Metro Manila, Cebu, Davao (food parks, kiosks, carinderias)
  - Targeting: restaurant, café and small-business owners, ages roughly 22–45
  - Call to action: WhatsApp chat or direct signup
- **"Powered by InstaDine"** line on every customer menu, so the product spreads itself
- **Referrals** between owners
- **SEO:** pages by country, city and outlet type, plus free tools
- **Field pilots** in Madurai and nearby cities for fast feedback

### 12.2 Messaging
- "1¢ per order. No subscription."
- "Live in 5 minutes. Just a photo of your menu."
- "Pay only when you get orders. Credits never expire."
- India: "30 paise per order. No monthly fees."

---

## 13. Success metrics

| Metric | Target (first 6 months) |
|---|---|
| Signup → menu published | ≥ 60% |
| Signup → first real confirmed order within 7 days | ≥ 40% |
| Free → first paid top-up | ≥ 25% |
| Average confirmed orders per active outlet per day | ≥ 40 |
| Repeat top-up rate (paid outlets buying again within 60 days) | ≥ 60% |
| Monthly cancellation rate of active outlets | ≤ 5% |
| Support tickets per 100 active outlets per month | ≤ 10 |
| Cost to win one paying outlet vs. money earned back | Pays back within 3 months |

North-star metric: **confirmed orders per week across all outlets.**

---

## 14. Risks and how to handle them

| Risk | How to handle it |
|---|---|
| Stripe not available for an Indian entity | Settle the entity in Phase 0. Keep the payment provider switchable (Razorpay for INR). |
| "Insta-" trademark challenge from Meta | Trademark search and legal opinion before investing in the brand. Keep a backup name. |
| Fake or prank orders | Credits used only on confirmation, pending orders expire, rate limits |
| Staff skip confirming orders to save credits | Price low enough that it isn't worth the effort. Order screens depend on confirmation. Compare reports against expected volume. |
| Free-credit farming (repeated signups) | Phone or email verification, device fingerprinting, admin monitoring |
| Low revenue per outlet | Volume through self-serve and the product spreading itself. Bigger packs. Paid extras in Phase 4. |
| Customers still queue to pay | Fast confirmation (show number, tap, done). Optional online payment in Phase 4. |
| Poor connectivity at street stalls | Light PWA, cached menu, dashboard reconnects automatically |
| Owners who aren't comfortable with technology | AI setup, WhatsApp support, short video guides in local languages |

---

## 15. Team (MVP)

| Role | Count |
|---|---|
| Product manager / owner | 1 |
| UI/UX designer | 1 |
| Frontend (PWA + dashboard) | 2 |
| Backend (API, real-time, payments, credits) | 2 |
| AI engineer (menu import, translation) | 1 |
| QA | 1 |
| DevOps (part-time) | 0.5 |
| Growth / marketing (Instagram ads, content) | 1 |

---

## 16. Open decisions

1. Legal entity and payment provider setup for Stripe (India vs. global)
2. GST/VAT display: inclusive or "no tax added" per region
3. Final local price points for the Philippines and Malaysia
4. Default expiry time for pending orders (suggested: 15 minutes)
5. Size of the free credits: 100 (current plan) vs. 50
6. Backup brand name if the InstaDine trademark check fails

---

*Prepared from planning discussions, November 2026.*
