# Mahastays Backend

Node.js · TypeScript · Express 5 · **Prisma + MongoDB** — the complete backend for the Mahastays travel platform
(stays, curated packages, experiences, bookings, payments, vendor payouts, reviews, ads) built from the
*"Complete Backend & Database Architecture Roadmap"* spec.

| | |
| :-- | :-- |
| **API** | 184 endpoints under `/api/v1` — see [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md) (generated from the code) and the Postman collection in [`postman/`](postman) |
| **Data model** | 22 collections, 54 embedded types — [`prisma/schema.prisma`](prisma/schema.prisma) |
| **Actors** | 5 separate identities: User · Vendor · Sub-Admin · Admin · Super-Admin, with permission-flag RBAC |
| **Code** | 118 TypeScript files, ~10.5k lines, strict mode |
| **Tests** | 87 automated tests (business engines, full-app HTTP smoke tests, seed/schema validation) |

> **Read this first — what has and hasn't been verified.**
> ✅ The whole codebase type-checks in strict mode against the generated Prisma types, the production build compiles and boots, and 87 tests pass
> (including the exact ledger numbers from your spec: ₹18,237 / ₹22,218 / ₹706, and RFC-6238 2FA vectors).
> ⚠️ It has **not been run against a live MongoDB or Razorpay** — the environment it was built in had neither. Your first `docker compose up -d && npm run db:setup`
> is therefore the real integration test. Expect, at worst, small runtime query details rather than structural problems. See [Known gaps](#known-gaps--next-steps).

---

## Quick start

**Requirements:** Node ≥ 20.19, Docker (for MongoDB + Redis). MongoDB **must run as a replica set** — Prisma needs transactions; the compose file does this for you.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then set JWT_ACCESS_SECRET and ENCRYPTION_KEY:  openssl rand -base64 48
docker compose up -d             # MongoDB (single-node replica set) + Redis
npm run db:setup                 # = db:push (collections + indexes) · db:indexes (partial/TTL indexes) · db:seed (demo data)
npm run dev                      # http://localhost:4000/api/v1/health
```

`db:seed` prints demo credentials once (super-admin, TOTP secret, recovery keys, …). Customer: `traveler@mahastays.local` / `Demo@12345` (Club member).
`PAYMENT_GATEWAY=mock` (the default) is a fully working fake gateway, so you can test the whole money flow without a Razorpay account.

### Your first booking (≈ 1 minute)

```bash
BASE=http://localhost:4000/api/v1; H='content-type: application/json'

TOKEN=$(curl -s $BASE/auth/user/login -H "$H" -d '{"email":"traveler@mahastays.local","password":"Demo@12345"}' | jq -r .data.accessToken)
PROP=$(curl -s "$BASE/properties?destination=Mahabaleshwar" | jq -r '.data[0].id')

# price it — member discount applied because we send the token
curl -s $BASE/bookings/stays/quote -H "$H" -H "authorization: Bearer $TOKEN" \
  -d '{"propertyId":"'$PROP'","roomId":"r501","checkInDate":"2026-12-18","checkOutDate":"2026-12-21","guests":{"adults":2,"children":1}}' | jq .data.pricing
#  → baseTotal 16500 · cleaningFee 275 · memberDiscount 1320 · taxesGst 2782 · grandTotalInr 18237   (your spec's example)

# hold the room + create the payment order
ORDER=$(curl -s $BASE/bookings/stays/reserve -H "$H" -H "authorization: Bearer $TOKEN" \
  -d '{"propertyId":"'$PROP'","roomId":"r501","checkInDate":"2026-12-18","checkOutDate":"2026-12-21","guests":{"adults":2,"children":1}}' | jq -r .data.checkout.orderId)

# "pay" (dev gateway) → booking confirmed, invoice number assigned, vendor wallet credited
curl -s -X POST $BASE/payments/mock/capture -H "$H" -H "authorization: Bearer $TOKEN" -d '{"orderId":"'$ORDER'"}' | jq '.data.booking | {bookingReference,bookingStatus,paymentStatus,invoiceNumber}'
```

Prefer a GUI? Import [`postman/Mahastays.postman_collection.json`](postman/Mahastays.postman_collection.json) — every request has a sample body, and the login requests save the token for you.

---

## Project structure

```
mahastays-backend/
├── prisma/
│   ├── schema.prisma          # 22 models · 54 embedded types · 38 enums (MongoDB)
│   ├── seed.ts / seed.data.ts # demo data from the spec, pushed through the real services & validators
├── scripts/
│   ├── create-indexes.ts      # partial-unique + TTL + geo indexes Prisma can't declare
│   └── generate-docs.ts       # → docs/ENDPOINTS.md + Postman collection (introspects the real router tree)
├── src/
│   ├── server.ts · app.ts     # bootstrap, graceful shutdown · middleware stack (raw-body webhook parser before JSON)
│   ├── config/                # env validation (Zod, fails fast), constants, logger (pino, redacts secrets)
│   ├── middlewares/           # authenticate · requireRole · requireStaff (permission flags) · requireVendor · masterPin · rate limits · errors
│   ├── services/              # tokens (refresh rotation) · audit · platform config · locks · notifications · storage · payment gateways
│   ├── utils/                 # crypto (AES-GCM/bcrypt) · TOTP · dates (IST) · money · geo · sequences & codes
│   ├── modules/               # one folder per domain: routes + service + schemas (+ presenter / engine)
│   │   ├── auth/ users/ vendors/ staff/
│   │   ├── properties/ packages/ experiences/ catalog/ inventory/
│   │   ├── bookings/          # pricing engine · cancellation engine · quote/reserve · lifecycle · query
│   │   ├── payments/ payouts/ reviews/ wishlist/ ads/ uploads/ config/ health/
│   │   └── admin/             # vendor KYC · users · listing moderation · bookings · reviews · finance · staff · super-admin
│   ├── jobs/                  # hold expiry · auto-complete · refund retry · invoice repair
│   └── routes/index.ts        # mounts everything under /api/v1
├── tests/                     # vitest: engines, full-app smoke tests (Prisma mocked), seed validation
├── docs/                      # ENDPOINTS.md (generated) · ARCHITECTURE.md
├── postman/                   # generated collection
├── Dockerfile · docker-compose.yml · .env.example
```

Every module follows one pattern: **`*.routes.ts`** (HTTP + validation) → **`*.service.ts`** (business logic, Prisma) → **`*.presenter.ts`** (API response shape), with pure **`*.engine.ts`** files for anything arithmetic (pricing, refunds, availability, payouts) so it is unit-testable without a database.

## Scripts

| Command | What it does |
| :-- | :-- |
| `npm run dev` | API with hot reload (`tsx watch`) |
| `npm run build` / `npm start` | Generate Prisma client + compile → run `dist/server.js` |
| `npm test` | 87 tests (no database needed) |
| `npm run typecheck` | Strict TypeScript check of src, tests, seed, scripts |
| `npm run db:push` | Create collections and Prisma-declared indexes |
| `npm run db:indexes` | Create partial-unique / TTL / geo indexes (**run once after `db:push`**) |
| `npm run db:seed` | Demo data + credentials (refuses to run in production) |
| `npm run docs:generate` | Regenerate `docs/ENDPOINTS.md` and the Postman collection |
| `docker compose --profile app up --build` | Also run the API itself in a container |

## API conventions

- **Envelope:** `{ "success": true, "data": …, "meta"?: { page, limit, total, totalPages } }` · errors `{ "success": false, "error": { "code", "message", "details"?, "requestId" } }`. Every response carries `x-request-id`.
- **Auth:** `Authorization: Bearer <access token>` (15 min). The refresh token lives in an **HTTP-only cookie** (`/api/v1/auth`), rotated on every use with reuse detection; mobile clients send `x-client-type: mobile` to receive it in the body instead.
- **Staff:** admins and sub-admins are checked against live **permission flags** (e.g. `canApproveVendors`, `canInitiateCustomerRefunds` + `maxRefundCeilingInr`). Admin/Super-Admin sign in with **TOTP 2FA**; money/policy actions need the Super-Admin **master PIN** (`x-master-pin`).
- **Ids & dates:** MongoDB ObjectIds (24 hex). Listings can also be fetched by `slug`. Dates are `YYYY-MM-DD` in India time. Money is **integer rupees**.
- **Public pricing parameters:** `GET /config/public` (GST rates, member discount, …) — don't hard-code them in the UI; use `POST /bookings/*/quote` for the authoritative amount.

## Production checklist

- [ ] **MongoDB replica set** with backups (Atlas M10+ or a 3-node set); run `db:push` and `db:indexes` on every deploy. **Never run `db:seed`** against production.
- [ ] Strong, unique `JWT_ACCESS_SECRET` and `ENCRYPTION_KEY` (store in a secrets manager; **losing `ENCRYPTION_KEY` makes bank numbers and 2FA secrets unrecoverable** — back it up).
- [ ] HTTPS everywhere; set `TRUST_PROXY=1` behind a load balancer; configure `COOKIE_SAMESITE` / `COOKIE_DOMAIN` for your frontend domain; list only your real origins in `CORS_ORIGINS`.
- [ ] `PAYMENT_GATEWAY=razorpay` + keys; register `{API_PUBLIC_URL}/api/v1/payments/verify-webhook` (events `payment.captured`, `order.paid`, `payment.failed`) with the webhook secret.
- [ ] **Redis** (`REDIS_URL`) as soon as you run more than one API instance: distributed booking locks and job leader election. Swap the rate limiter's in-memory store for a shared one (`rate-limit-redis`).
- [ ] Private S3 bucket for KYC documents (`STORAGE_PROVIDER=s3`; documents are served to admins via 10-minute signed URLs), CDN for public media.
- [ ] SMTP with SPF/DKIM; MSG91 with a **DLT-approved** OTP template for Indian SMS.
- [ ] Enable 2FA for every admin account (`POST /auth/admin/2fa/setup`), change the master PIN (`POST /superadmin/master-pin/change`), and rotate the seeded passwords (or don't seed).
- [ ] Ship logs (pino JSON) to an aggregator and alert on `LATE CAPTURE REFUND FAILED` and `refund dispatch failed`.
- [ ] Have your CA confirm GST rates/SAC codes, TDS section and rate, and the invoice format (see [Spec observations](docs/ARCHITECTURE.md#spec-observations-things-to-confirm)).
- [ ] Load-test the booking path (the spec targets 1,000 concurrent reservations) and run a security review before launch.

## Known gaps / next steps

Being explicit about what is **not** in this build:

1. **No live-database run yet** (see the note at the top). The first integration pass should cover: reserve → pay → confirm, cancel → refund, payout request → release. Adding integration tests against a throw-away replica set (e.g. `mongodb-memory-server` with `MongoMemoryReplSet`) is the natural next step.
2. **Support tickets:** the spec defines the `canManageInquiryTickets` permission and a customer-support department but no ticket data model, so no ticket endpoints exist.
3. **Packages do not consume room inventory** — the spec's package model has no room link. Recommended: add `roomId` to `PackageTier` and include package nights in the availability engine.
4. **Ads:** `dailyBudget` is stored but only the total budget is enforced.
5. **Club membership purchase** isn't in the spec; membership is granted by admins (`PATCH /admin/users/:id/membership`). A paid membership product would need its own payment type.
6. **Apple sign-in** (listed in the spec's `authProvider`) is not implemented; Google and phone-OTP are.
7. **Prisma version:** Prisma 7 has no MongoDB connector, and Prisma 8's MongoDB support is a different (contract-based) API still at release-candidate stage, so this project is pinned to **Prisma 6.19**. All database access sits behind the service layer to keep a future migration contained.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for design decisions, flow diagrams and the mapping from every spec section to code.
