# POS Integration Plan

**Goal:** QR orders from InstaDine appear in the restaurant's existing POS like any counter order (kitchen tickets, reports, payments), and the POS menu stays the single source of truth.
**Scope:** `apps/api` (new `pos` module), `apps/owner` (Integrations page), small hooks in `orders` and `menu`.
**Status:** plan only. Partner programmes and API access terms change, so verify each provider before starting it.

---

## 1. What a POS integration does (and doesn't do)

| Does | Doesn't |
|---|---|
| Push accepted InstaDine orders into the POS (kitchen tickets print as usual) | Take payment from guests by itself. Online payment is a separate project (Stripe Connect, see section 10). |
| Import the menu, prices, modifiers and taxes from the POS | Replace the POS for restaurants that already have one |
| Receive status back: ready, completed, voided | Work for restaurants with no POS (InstaDine already acts as their lightweight POS) |
| Mark orders paid when the bill is settled at the POS till | |

---

## 2. Provider strategy

**Two paths behind one connector interface:**

1. **Direct integrations** for POS systems with open, self-serve APIs that small restaurants use.
2. **One aggregator (middleware) partner** for the long tail and enterprise POS systems.

### 2.1 Coverage map (top POS systems; verify access before each build)

| POS | Typical market | Path | Access |
|---|---|---|---|
| Square | Global, small restaurants | **Direct** | Public API, OAuth |
| Clover | US/CA/EU, small restaurants | **Direct** | Public API, app marketplace |
| Loyverse | Global, very small cafés | **Direct** | Public API, token |
| Lightspeed Restaurant (K-Series) | EU/NA/AU | **Direct** | Partner API, OAuth |
| Shopify POS | Global, cafés and retail | **Direct** | Public API |
| Toast | US | Aggregator (or partner programme) | Partner approval required |
| SpotOn | US | Aggregator | Partner |
| TouchBistro | NA | Aggregator | Partner |
| Revel | US | Aggregator | Partner |
| Oracle MICROS Simphony | Enterprise, hotels | Aggregator | Enterprise |
| NCR Voyix Aloha | Enterprise, chains | Aggregator | Enterprise |
| PAR Brink | QSR chains | Aggregator | Enterprise |
| Heartland Restaurant | US | Aggregator | Partner |
| Epos Now | UK | Aggregator or direct | Partner API |
| Zettle (PayPal) | EU | Direct | Public API (limited restaurant features) |
| Tevalis / Zonal | UK hospitality | Aggregator | Partner |
| Petpooja | India | Aggregator (UrbanPiper) or direct | Partner |
| Restroworks (Posist) | India, chains | Aggregator | Partner |
| Foodics | Middle East | Direct or aggregator | Partner API |
| GoFrugal / DotPe | India | Aggregator | Partner |

**Aggregator choice:** pick **one** based on your main market.
- Global or EU: **Deliverect**.
- US independents: **Chowly** or **Checkmate**.
- US enterprise: **Olo (Omnivore)**.
- India: **UrbanPiper**.

---

## 3. Architecture

```
            apps/owner  ──(connect, map, settings)──►  /pos/* (owner API)
                                                           │
apps/customer ─► POST /orders ─► orders.service ── Accept (CONFIRMED) ──► OutboxEvent(PUSH_ORDER)
                                                           │
                                               PosWorker (queue, retries, idempotent)
                                                           │
                         ┌──────────────── PosConnector interface ────────────────┐
                         │  SquareAdapter  CloverAdapter  LoyverseAdapter  ...     │
                         │  AggregatorAdapter (Deliverect | UrbanPiper | ...)      │
                         └─────────────────────────────────────────────────────────┘
                                                           ▲
                         POS / aggregator webhooks ──► /pos/webhooks/:provider (signature verified)
```

### 3.1 Connector interface (`apps/api/src/pos/connector.ts`)

```ts
export interface PosConnector {
  provider: PosProvider;
  // auth
  getAuthUrl(restaurantId: string, branchId: string): Promise<string>;      // OAuth providers
  handleAuthCallback(params: Record<string, string>): Promise<PosCredentials>;
  // menu
  fetchMenu(conn: PosConnection): Promise<PosMenu>;                          // items, modifiers, taxes, categories
  // orders
  pushOrder(conn: PosConnection, order: NormalizedOrder, idempotencyKey: string): Promise<PosOrderRef>;
  cancelOrder(conn: PosConnection, ref: PosOrderRef, reason: string): Promise<void>;
  // webhooks
  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): boolean;
  parseWebhook(rawBody: Buffer): PosEvent[];                                 // ORDER_STATUS | PAYMENT | MENU_CHANGED | ITEM_86
}
```

### 3.2 Reliability rules
- **Outbox pattern:** the Accept transaction writes an `OutboxEvent` row. A worker pushes it to the POS. This avoids lost or duplicated pushes if the API crashes.
- **Idempotency key** = InstaDine `order.id`, sent to every provider that supports it. Our side also checks `PosOrderLink` before pushing.
- **Retries:** exponential backoff (1 s, 5 s, 30 s, 2 min, 10 min, 30 min); after that `FAILED`, and staff see a **"Not sent to POS"** badge with a Retry button.
- **Webhooks:** verify the signature, deduplicate by event id, process asynchronously, always return 200 quickly.
- **POS offline:** the order stays visible in InstaDine Live Orders, so service never stops. It syncs when the POS is back.

---

## 4. Data model (`schema.prisma`)

```prisma
enum PosProvider { SQUARE CLOVER LOYVERSE LIGHTSPEED SHOPIFY DELIVERECT URBANPIPER CHOWLY OLO }
enum PosSyncStatus { PENDING SENT FAILED VOIDED }

model PosConnection {
  id                 String      @id @default(uuid())
  restaurantId       String
  branchId           String                      // one POS location per branch
  provider           PosProvider
  externalLocationId String
  credentials        Bytes                       // encrypted (AES-256-GCM, key from KMS/env), never logged
  scopes             String[]
  isActive           Boolean     @default(true)
  pushOnAccept       Boolean     @default(true)
  menuSource         String      @default("POS") // POS | INSTADINE
  lastMenuSyncAt     DateTime?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  @@unique([branchId, provider])
  @@map("pos_connections")
}

model PosItemMapping {
  id                  String  @id @default(uuid())
  connectionId        String
  productId           String                      // InstaDine Product
  externalItemId      String
  externalVariationId String?
  modifierMap         Json?                       // InstaDine option -> POS modifier id
  @@unique([connectionId, productId])
  @@map("pos_item_mappings")
}

model PosOrderLink {
  id              String        @id @default(uuid())
  orderId         String        @unique
  connectionId    String
  externalOrderId String?
  status          PosSyncStatus @default(PENDING)
  attempts        Int           @default(0)
  lastError       String?
  updatedAt       DateTime      @updatedAt
  @@map("pos_order_links")
}

model OutboxEvent {
  id        String   @id @default(uuid())
  type      String                       // PUSH_ORDER | CANCEL_ORDER
  payload   Json
  status    String   @default("PENDING")
  runAfter  DateTime @default(now())
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
  @@index([status, runAfter])
  @@map("outbox_events")
}

model PosWebhookEvent {
  id          String      @id            // provider event id (dedupe)
  provider    PosProvider
  receivedAt  DateTime    @default(now())
  processedAt DateTime?
  payload     Json
  @@map("pos_webhook_events")
}
```

---

## 5. Flows

### 5.1 Connect (owner)
1. Owner opens Integrations, picks a POS, completes OAuth (or pastes a token for Loyverse) and picks the POS location for each branch.
2. Credentials are stored encrypted. A test call confirms access.

### 5.2 Menu (choose one source of truth per branch)
- **POS as source (recommended when a POS exists):**
  - import categories, items, prices, modifiers and taxes into InstaDine, and create `PosItemMapping`
  - photos and InstaDine-only tags (Best selling) stay editable in InstaDine
  - re-sync on webhook `MENU_CHANGED` and nightly
- **InstaDine as source:** the owner maps each InstaDine dish to a POS item with a matching screen (auto-match by name and price, then manual fix-up). An unmapped dish blocks "push on accept" for orders containing it.
- **86'd items:** a POS "out of stock" webhook sets `BranchProduct.isAvailable=false`. The storefront already shows Sold out.

### 5.3 Order push
1. Guest orders, the order is PENDING, staff Accept, the order is CONFIRMED.
2. In the same transaction, an `OutboxEvent(PUSH_ORDER)` is written.
3. The worker normalises the order: lines, modifiers, notes, table label, customer name, the `DINE_IN`/`TAKEAWAY` type, and the tax the POS will apply.
4. `pushOrder` sends it with the idempotency key and stores `externalOrderId`. The POS prints the kitchen ticket.
5. If staff cancel in InstaDine after the push, `cancelOrder` voids it in the POS.

### 5.4 Status and payment back (webhooks)
- POS "ready" or "completed" → InstaDine `READY` or `COMPLETED`, so the guest tracker updates.
- POS bill settled → `paymentStatus = PAID`. This feeds table-session auto-close in `ORDER_ANTI_SPAM_PLAN.md`.
- POS void → InstaDine `CANCELLED` with the reason "Voided in POS".

---

## 6. Hard parts and how we handle them

| Issue | Approach |
|---|---|
| Modifiers and variants differ per POS | Normalise to `item + variation + modifiers[]`; mapping UI; block the push when the mapping is incomplete |
| Tax and rounding mismatch | Use the POS menu as the price source; send line prices and let the POS compute tax; show the POS total back in InstaDine after the push |
| Price changed in POS | Menu webhook plus nightly sync; reject a stale-price push and re-price |
| Duplicate tickets | Idempotency key + `PosOrderLink` unique per order + outbox |
| POS down or rate-limited | Outbox retries; "Not sent to POS" badge; Live Orders still works |
| Multiple branches | One `PosConnection` per branch (location) |
| Credential security | AES-256-GCM encryption at rest; key outside the DB; scoped OAuth; token refresh job; revoke on disconnect |
| Webhook spoofing | Signature verification per provider; reject unsigned requests |
| Spam reaching the POS | Push only at Accept, so pending or spam orders never reach the POS (see the anti-spam plan) |
| Credits | A credit is consumed at InstaDine Accept, not at the POS push |

---

## 7. Owner UX (`apps/owner`)

- **Settings → Integrations:**
  - provider cards, Connect or Disconnect, location picker per branch
  - menu source toggle, mapping screen with auto-match
  - "Send test order" button
- **Live Orders:** a small POS status per order (Sent · Failed · Retry).
- **Logs:** the last 50 POS events per branch, for support.

---

## 8. Phases

| Phase | Ships | Unlocks |
|---|---|---|
| **P0** | `pos` module, connector interface, outbox + worker, encrypted credentials, webhook endpoint, Integrations page shell | Foundation |
| **P1** | **Square** (order push, menu import, status and payment webhooks) | The most common small-restaurant POS |
| **P2** | **Clover** + **Loyverse** | Small-restaurant coverage |
| **P3** | **One aggregator** (Deliverect, UrbanPiper, or Chowly/Checkmate by market) | Toast, Lightspeed, Aloha, Simphony, Revel, Petpooja and others through one integration |
| **P4** | Lightspeed / Shopify POS / Foodics direct if demand justifies it; deeper features (table sync, split bills) | Fewer aggregator fees for high-volume partners |

---

## 9. Testing

- **Sandbox accounts:** Square sandbox, Clover sandbox, Loyverse test store, and the aggregator's staging environment.
- **Contract tests** per adapter with recorded fixtures (menu, order, webhooks).
- **E2E:**
  - place an order, accept it, check the ticket in the POS sandbox, settle it in the POS, check InstaDine shows it paid
  - kill the worker mid-push and confirm no duplicate ticket
  - expire the token and confirm the refresh, or a "Reconnect POS" alert
- **Webhook replay and duplicate tests.**

---

## 10. Related but separate: online payments

POS integration doesn't collect money from guests. For pay-in-app:
- **Stripe Connect (Standard or Express):** each restaurant connects its own Stripe account and money goes straight to the restaurant. This is already planned ("Card & wallets coming soon").
- **POS-native payments** (Square Web Payments, Clover Ecommerce) are only possible for restaurants on that POS.
- When an order is paid online and pushed to the POS, send it as **prepaid** so the till doesn't charge again.

## 11. Open questions

1. Primary market for P3: **global/EU (Deliverect)**, **US (Chowly/Checkmate)**, or **India (UrbanPiper)**?
2. Menu source default for POS restaurants: POS (recommended) or InstaDine?
3. Push orders at Accept (recommended, keeps spam out of the POS) or at placement?
4. Pricing: is the POS integration included in 1¢/order, or a paid add-on (aggregator fees are per location per month)?
