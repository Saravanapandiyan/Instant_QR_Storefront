# Order Anti-Spam Plan — Secure Table QR Ordering

**Goal:** a QR code that is photographed, shared or edited can never be used to place spam orders.
**Scope:** `apps/api` (NestJS + Prisma), `apps/customer` (storefront), `apps/owner` (QR Studio, Live Orders).
**Status:** plan only. Nothing below is built yet.

---

## 1. The problem (current state, from the code)

| Today | Where | Why it is abusable |
|---|---|---|
| The QR opens `/r/{branchSlug}?table=5` | `InstagramQRModal.tsx`, `StorefrontPage.tsx:111` | The table number is plain text. Anyone can change it to `?table=6` or `?table=99`. |
| The guest can also type any table number | `StorefrontPage.tsx:1268` (free-text input) | A made-up table is accepted. |
| `POST /orders` is public, with no limits | `orders.controller.ts`, `orders.service.ts#createOrder` | It can be called in a loop, from anywhere, with no rate limit. |
| `tableNumber` is free text and stored as is | `schema.prisma → Order.tableNumber String?` | No link to a real table, and no way to tell whether the table is occupied. |
| Phone number is required but never verified | `createOrder` | Any 7+ characters pass. |
| **Already good:** every order starts as `PENDING`, and staff must accept it | `OrderStatus.PENDING` | Spam is never cooked automatically. This stays. |

**Attack we must defeat:** a guest photographs the Table 5 QR, goes home and shares it. Friends scan it and place random orders.

---

## 2. Guarantees (what "100% handled" means)

No system can stop someone from *trying* to send a request. What we can guarantee is what happens to it. After this plan:

| # | Guarantee | Default mode | Strict mode |
|---|---|---|---|
| G1 | A spam order is **never cooked** (never reaches the kitchen) | ✅ | ✅ |
| G2 | A spam order **never costs the restaurant a credit** | ✅ | ✅ |
| G3 | A shared photo **cannot add orders to a table that has guests** | ✅ | ✅ |
| G4 | An edited or invented QR link **is rejected** (fake table, other table, other restaurant) | ✅ | ✅ |
| G5 | A remote person **cannot create any order at all** | ⚠️ Bounded: at most a few pending "new table" requests per empty table, which are auto-blocked once rejected | ✅ Zero |
| G6 | One device or connection **cannot flood** the Pending list | ✅ | ✅ |

**Strict mode = 100% no spam orders at all.** A table only accepts orders after a staff member opens it, which needs someone physically in the restaurant. Default mode trades one tap of staff work for a small, capped and self-blocking exposure on empty tables. Each restaurant picks its mode; Strict is recommended for busy or high-risk venues.

---

## 3. Design overview (defence in layers)

```
Guest scans printed QR ──► /t/{tableToken}
        │
        ▼
 [L1] Signed table token ── unknown / rotated / inactive ─► "This QR is no longer valid"
        │ valid → branch + table resolved on the server (the guest never types a table)
        ▼
 [L2] Table session state
        ├─ CLOSED + Strict  ─► "Ask staff to open your table"            (G5 = zero)
        ├─ CLOSED + Default ─► order allowed as "New table" request      (capped, see L3)
        └─ OPEN             ─► allowed only for devices that joined the session
                                (host device + devices invited by share link)   (G3)
        ▼
 [L3] Limits: per device, per IP, per table, per order size  ─► 429 / flagged
        ▼
 [L4] Block list: device or IP blocked after a "Spam" reject  ─► refused
        ▼
 Order created as PENDING ─► staff Accept / Reject (unchanged)  (G1)
        ▼
 Credit consumed only on Accept (CONFIRMED)                     (G2)
```

---

## 4. Layer details

### L1 — Signed per-table QR tokens (fixes G4)

- Create a `DiningTable` entity for every table (and one `COUNTER` table per branch for takeaway).
- Each table gets a **random 128-bit token** (22 base62 characters), stored server-side, for example `https://order.instadine.app/t/7fK2pQ9xLm3NcV8rT1yZbA`.
- The token resolves the branch, table and restaurant **on the server**. The URL carries no table number to edit.
- **Rotate:** QR Studio has "Regenerate QR" per table. The old token stops working immediately, so the restaurant reprints just that table (use this when a QR is known to be leaked).
- **Deactivate:** turning off a table makes its QR return "not valid".
- The customer app **removes the free-text table field** for dine-in. The table label is read-only and comes from the token.
- Old `/r/{slug}?table=` links: a transition period (section 9), then dine-in ordering through them is disabled.

### L2 — Table sessions (fixes G3 and G5)

A table is either **CLOSED** (nobody seated) or **OPEN** (guests seated, bill running).

**Opening a table**
- **Strict mode:** staff tap "Open table" in Live Orders → Tables (or accept a walk-in from the floor plan). Until then the QR shows "Please ask staff to open your table".
- **Default mode:** the first order from a CLOSED table arrives with a **"New table"** badge. Staff accept it only if someone is actually sitting there. Accepting opens the session and makes that device the **host**.

**Joining an open table (the key protection against shared photos)**
- Once a table is OPEN, a new device scanning the printed QR **cannot order**. It sees: "Table 5 is in use. Ask your table to share the order link."
- The host's phone shows **"Invite others at this table"**, a share link or QR with a session-only **join token**. Friends seated at the same table scan it to join.
- The join token dies when the session closes, and the host can revoke it.
- So a photo of the printed QR is useless against an occupied table, and the join link only works for the current visit.

**Closing a table**
- Automatically when every order in the session is COMPLETED or CANCELLED **and** paid, or after N minutes of no orders (default 180).
- Or manually: staff tap "Close table" (also from the bill or settle action).
- Closing ends all joined devices and expires the join token.

### L3 — Limits (fixes G6, bounds G5)

Enforced in the API and stored in DB counters, so they are not bypassable from the client:

| Limit | Default | Applies to |
|---|---|---|
| Pending orders per device per branch | 1 | All modes |
| "New table" requests pending per CLOSED table | 3 (any devices) | Default mode |
| Orders per IP per branch | 5 per 10 min | All modes (`@nestjs/throttler` + DB) |
| Orders per session | 20 per hour | OPEN tables |
| Max quantity per line / lines per order | 20 / 30 | All modes |
| Unusual order value (configurable) | e.g. more than 3× the branch average | Accepted but flagged **Unusual** for staff |
| Global per-IP API rate limit | 60 requests per min | All public endpoints |

Over-limit requests get a clear message ("You already have an order waiting for staff"), never a silent failure.

### L4 — Block list

- Live Orders gets a **"Reject as spam"** action, next to the normal Reject.
- It blocks that order's **device ID** for this restaurant (30 days) and its **IP** for 24 hours. The IP block is short because mobile networks share IPs.
- It also clears every other pending "New table" request from the same device or IP in one tap.
- The owner can view and unblock entries in Settings.

### Device identity

- On first visit the API sets a **signed, httpOnly, Secure, SameSite=Lax cookie** `did` (random UUID + HMAC).
- Orders store `deviceIdHash` and `ipHash`, never the raw IP.
- If cookies are blocked, the device falls back to stricter IP-based limits (1 pending per IP per table).
- IP comes from `X-Forwarded-For` with `trust proxy` set correctly for the deployment.

### Takeaway / counter QR

- Takeaway is the easiest remote spam target because it has no table. It uses the `COUNTER` table type:
  - **Strict:** takeaway orders need online prepayment (once Stripe is live) or staff confirmation at the counter.
  - **Default:** same limits as a CLOSED table, plus a **"Takeaway · unverified"** badge.

### Optional extra signal: location (off by default)

- A per-restaurant toggle requires the browser location to be within X m (default 150) of the branch. This needs `Branch.latitude` and `Branch.longitude`.
- It's a **soft** signal only, because GPS can be spoofed and guests can deny permission. It is never relied on for any guarantee.

### Credits (fixes G2)

- A credit is consumed **only at the CONFIRMED transition**: the staff Accept, in `updateOrderStatus`.
- PENDING, rejected and cancelled orders never consume credits.
- Low-credit warning at a configurable threshold (default 50). Orders keep flowing, as promised on the landing page.
- Note: the credit system itself is not built yet. It must implement this rule from day one.

---

## 5. Data model changes (`apps/api/prisma/schema.prisma`)

```prisma
enum TableKind      { TABLE COUNTER }
enum SessionStatus  { OPEN CLOSED }
enum SpamMode       { DEFAULT STRICT }

model DiningTable {
  id           String   @id @default(uuid())
  branchId     String
  label        String                 // "Table 5", "Counter"
  kind         TableKind @default(TABLE)
  token        String   @unique       // 22-char base62, printed in the QR
  tokenVersion Int      @default(1)   // bumped on rotate (audit)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  branch       Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  sessions     TableSession[]
  orders       Order[]
  @@unique([branchId, label])
  @@map("dining_tables")
}

model TableSession {
  id             String        @id @default(uuid())
  tableId        String
  status         SessionStatus @default(OPEN)
  openedBy       String?                 // staff user id (Strict) or null (opened by accepting the first order)
  hostDeviceHash String?
  joinToken      String        @unique   // session-only invite token
  joinedDevices  String[]                // device hashes allowed to order
  openedAt       DateTime      @default(now())
  lastOrderAt    DateTime?
  closedAt       DateTime?
  closedReason   String?                 // SETTLED | IDLE | STAFF
  table          DiningTable   @relation(fields: [tableId], references: [id], onDelete: Cascade)
  orders         Order[]
  @@index([tableId, status])
  @@map("table_sessions")
}

model BlockedClient {
  id           String   @id @default(uuid())
  restaurantId String
  deviceHash   String?
  ipHash       String?
  reason       String                    // SPAM_REJECT | MANUAL
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  @@index([restaurantId, deviceHash])
  @@index([restaurantId, ipHash])
  @@map("blocked_clients")
}

// Order: add
//   tableId        String?   -> DiningTable
//   sessionId      String?   -> TableSession
//   deviceHash     String?
//   ipHash         String?
//   isNewTable     Boolean @default(false)   // "New table" badge
//   flags          Json?                     // { unusual: true, takeawayUnverified: true }
//   rejectReason   String?                   // includes "SPAM"
// keep tableNumber as a snapshot of DiningTable.label for receipts/history.

// Restaurant (or Branch): add
//   spamMode       SpamMode @default(DEFAULT)
//   locationCheck  Boolean  @default(false)
//   lowCreditAt    Int      @default(50)
// Branch: add latitude/longitude (Float?) for the optional location check.
```

---

## 6. API changes (`apps/api`)

**Public (customer)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/public/tables/:token` | Resolve the token to branch, table label, session state, and whether this device can order (`canOrder`, `reason`) |
| POST | `/public/tables/:token/join` | Body `{ joinToken }`: adds this device to the open session |
| POST | `/orders` | **Changed:** requires `tableToken` (dine-in and takeaway); `tableNumber` is ignored. Runs L1 → L4 checks before creating a PENDING order. |

**Owner / staff (auth + role)**

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/branches/:id/tables` | List, create, bulk-create (`T1…Tn`) |
| PATCH | `/tables/:id` | Rename, activate or deactivate |
| POST | `/tables/:id/rotate-token` | New token; old QR stops working |
| POST | `/tables/:id/open` · `/close` | Session control (Strict opening, manual close) |
| GET | `/branches/:id/tables/live` | Floor view: open or closed, pending counts |
| PATCH | `/orders/:id/status` | **Changed:** `{ status: CANCELLED, reason: "SPAM" }` triggers the block list. On `CONFIRMED`: opens the session if it is a "New table" order, and consumes one credit. |
| GET/DELETE | `/restaurants/:id/blocked` | View and unblock |
| PATCH | `/restaurants/:id/security` | `spamMode`, `locationCheck`, limits |

**`createOrder` check order** (fail fast, cheapest first):
1. Global rate limit (throttler).
2. Block list (device hash and IP hash).
3. Token → table → branch active and accepting orders.
4. Session rules (mode, OPEN or CLOSED, joined device, "New table" cap).
5. Per-device, per-IP and per-session counters.
6. Order-size caps and the unusual-value flag.
7. Price recomputed server-side (already done today).
8. Create as PENDING inside a transaction with the counter updates, so there are no race conditions.

---

## 7. Customer app changes (`apps/customer`)

- New route `/t/:token` replaces `/r/:slug?table=` for dine-in.
- Remove the free-text **Table Number** input for dine-in. Show "Table 5" read-only from the token.
- On load, call `GET /public/tables/:token` and render one of these states:
  - `canOrder` → the normal menu and checkout.
  - `TABLE_CLOSED_STRICT` → "Please ask staff to open your table." The menu stays browsable.
  - `TABLE_IN_USE` → "Table 5 is in use. Ask your table to share the order link."
  - `PENDING_EXISTS` → "Your order is waiting for staff."
  - `BLOCKED` / `QR_INVALID` → a clear message with no detail about why.
- The host sees an **"Invite others at this table"** sheet with the share link or QR (join token).
- A join link opens `/t/:token?j={joinToken}`, which joins and then shows the menu.

## 8. Owner app changes (`apps/owner`)

- **Storefront QR Studio:** a "Tables" tab to create tables (bulk T1…Tn plus a Counter), one QR per table, Download all (PNG/PDF stand sheets), and "Regenerate QR" per table.
- **Live Orders:**
  - badges: **New table**, **Unusual**, **Takeaway · unverified**
  - actions: Accept, Reject, **Reject as spam**
  - a **Tables strip** (open/closed, Open table, Close table)
- **Settings → Order safety:** Default or Strict mode, location check, limits, blocked devices list.
- **Roles:** only Manager or Cashier can Open/Close tables and Accept. Kitchen can't.

---

## 9. Rollout and migration

| Phase | Ships | Guarantees after phase |
|---|---|---|
| **P1** | `DiningTable` + tokens + QR Studio Tables tab + `/t/:token` + remove the free-text table field + throttler and per-device limits | G4, G6 (and G1 and G2 as today) |
| **P2** | Table sessions, host and join links, "New table" badge, auto-close | G3, G5 (bounded) |
| **P3** | Reject as spam + block list + Unusual flag + Settings page | Self-blocking spam |
| **P4** | Strict mode + Counter/takeaway rules + optional location check | G5 = zero in Strict |

**Migration of printed QRs:**
- On deploy, auto-create `DiningTable` rows for each branch from the existing table labels used in past orders, plus the counts the owner enters.
- Old `/r/{slug}?table=` links keep working for **30 days** in a restricted mode: always treated as a CLOSED table, Default rules, and a banner prompting the owner to reprint.
- After that, old links show the menu only (browse, no ordering) with "Please scan the QR on your table".

---

## 10. Test plan (must all pass before launch)

| # | Attack or scenario | Expected result |
|---|---|---|
| T1 | Edit the URL table number or token | `QR_INVALID`; no order |
| T2 | Made-up token | `QR_INVALID` |
| T3 | Rotated QR (old token) | `QR_INVALID` |
| T4 | Photo of the QR, scanned from home, **table OPEN** | `TABLE_IN_USE`; no order (G3) |
| T5 | Photo from home, **table CLOSED**, Strict | `TABLE_CLOSED_STRICT`; no order (G5 zero) |
| T6 | Photo from home, table CLOSED, Default | 1 "New table" pending; staff Reject as spam → device and IP blocked; a retry is refused |
| T7 | Several remote devices, CLOSED table, Default | Capped at 3 pending; the 4th gets "ask staff" |
| T8 | One device sends 50 orders in a loop | 1 pending; the rest get 429 |
| T9 | Leaked join link after the guests leave | Join token expired with the session; refused |
| T10 | Real group, 4 phones at one table | Host orders, then invites 3 by link; all can order |
| T11 | Rejected or cancelled order | No credit consumed |
| T12 | Accepted order | Exactly 1 credit consumed (idempotent on retries) |
| T13 | Takeaway spam, Strict | Requires prepay or staff confirmation |
| T14 | Cookies disabled | Falls back to IP limits; still bounded |
| T15 | Two requests racing for the last "New table" slot | The transaction allows only one |

Add API e2e tests (`@nestjs/testing` + a test DB) for T1–T15, and one Playwright flow for the customer join link.

---

## 11. Landing page follow-up

Once P1–P3 are live, the order-safety section on the landing page can honestly add:
- "Every table has its own secure QR"
- "Shared photos can't order to your tables"
- "Spammers are blocked in one tap"

Until then, keep the current copy, which only claims staff approval, $0 for rejected orders, pause and roles.

## 12. Open questions

1. Default mode for new restaurants: **Default** (recommended) or **Strict**?
2. Auto-close idle time: is 180 min right for your restaurants?
3. Should accepted orders from an **OPEN** table auto-confirm (faster service), or always need Accept? This plan keeps Accept always, for G1.
4. Takeaway in Strict mode before Stripe exists: staff-confirm only?
