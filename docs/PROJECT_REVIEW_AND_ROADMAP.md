# Travel App — Code Review, Scalability Assessment & Delivery Roadmap

**Reviewed:** 26 October 2026 · **Scope:** `PROJECT_OVERVIEW.md`, `prisma/`, `src/` (API routes, auth, proxy, pages, components), Docker/config files.
**Method:** Source reading plus `tsc --noEmit` (passes), `jest` (66/66 pass), and `eslint src` (13 errors, 13 warnings). Each finding cites a file and line. I did not run the UI in a browser or call Sabre live, so the design notes are based on the code, not on screenshots.

Every recommendation below has a **Why**. Where something depends on a business decision (which CRM, which payment gateway, which markets), it is listed under [Decisions needed from the client](#8-decisions-needed-from-the-client) and not guessed.

---

## Contents

1. [Executive summary](#1-executive-summary)
2. [Critical and high-severity bugs (fix before any client demo)](#2-critical-and-high-severity-bugs)
3. [Medium and low-severity bugs](#3-medium-and-low-severity-bugs)
4. [Performance improvements](#4-performance-improvements)
5. [Scalability issues](#5-scalability-issues)
6. [CRM readiness — recommended architecture](#6-crm-readiness--recommended-architecture)
7. [Unique design and features](#7-unique-design-and-features)
8. [Decisions needed from the client](#8-decisions-needed-from-the-client)
9. [Recommended delivery roadmap](#9-recommended-delivery-roadmap)
10. [Notes on the existing PROJECT_OVERVIEW.md](#10-notes-on-the-existing-project_overviewmd)

---

## 1. Executive summary

The foundation is reasonable: Next.js 16 App Router, Prisma 7, Zod, NextAuth, a provider-adapter pattern for Sabre/Amadeus, and an admin area. TypeScript compiles cleanly. Even so, **the app is not deliverable yet.** Four issues would be serious if found by the client or an outsider:

| # | Issue | Impact |
|---|---|---|
| 1 | Write APIs for packages, destinations, activities, blog and reviews have **no authentication** | Anyone on the internet can create, edit or delete site content |
| 2 | Blog HTML is rendered raw | Combined with #1, anyone can plant JavaScript on the public site |
| 3 | Booking totals come **from the browser** | A customer can submit a booking at any price |
| 4 | Customers can book **mock (fake) fares**, with departure dates in the past | Bookings for flights that don't exist |

There are also product gaps the client will notice right away. Online payment options are on by default but do nothing. Admins cannot confirm or cancel a booking. "Forgot password" leads to a 404. Hotels and tour packages show hardcoded demo data.

**Recommended approach, in order:** (1) close the security and data-integrity holes; (2) add a service layer, a booking lifecycle and an event "outbox" so the CRM can plug in cleanly later; (3) fix performance by moving the homepage to server rendering with caching; (4) build the design and features that set the site apart. Design work can run in parallel with steps 1–3 if a designer is available. Section 9 has the full roadmap.

---

## 2. Critical and high-severity bugs

### C1 — Public, unauthenticated write access to catalog and content APIs · **Critical**

**Evidence.** [src/proxy.ts](src/proxy.ts) only protects `/admin/*`, `/api/admin/*` and `/dashboard/*`. The admin UI writes content through *public* routes, and none of them check the session:

- [src/app/api/packages/route.ts:191](src/app/api/packages/route.ts#L191) `POST`, [src/app/api/packages/[id]/route.ts:60](src/app/api/packages/[id]/route.ts#L60) `PUT`, `:105` `DELETE`
- [src/app/api/destinations/route.ts:94](src/app/api/destinations/route.ts#L94), [src/app/api/destinations/[id]/route.ts](src/app/api/destinations/[id]/route.ts) `PUT`/`DELETE`
- [src/app/api/activities/route.ts:59](src/app/api/activities/route.ts#L59), [src/app/api/activities/[id]/route.ts](src/app/api/activities/[id]/route.ts) `PUT`/`DELETE`
- [src/app/api/blog/route.ts:385](src/app/api/blog/route.ts#L385) `POST`
- [src/app/api/reviews/[id]/route.ts](src/app/api/reviews/[id]/route.ts) `PUT`/`DELETE`

**Failure scenario.** `curl -X DELETE https://site/api/packages/<id>` deletes an Umrah package. No login needed.

**Fix.**
- Add one `requireAdmin()` helper in `src/lib/auth/` that calls `getServerSession(authOptions)`, re-reads the user's role from the database (see H6), and returns 401/403. Call it at the top of every mutating handler.
- Better: move all admin mutations under `/api/admin/*`, or into Server Actions, so the existing proxy covers them by default.

**Why.** A per-handler check is defence in depth: route checks still hold if someone later changes the proxy matcher. Keeping admin writes under one URL prefix means a new endpoint is protected without anyone having to remember to add a check.

### C2 — Stored XSS via blog content and JSON-LD · **Critical**

**Evidence.**
- [src/app/blog/[slug]/page.tsx:247](src/app/blog/[slug]/page.tsx#L247) renders `post.content` with `dangerouslySetInnerHTML`.
- [src/components/shared/structured-data.tsx:9](src/components/shared/structured-data.tsx#L9) injects `JSON.stringify(data)` into a `<script>` tag. A package or post title containing `</script><script>…` breaks out of the tag.

**Failure scenario.** With C1 unfixed, an anonymous user POSTs a blog post containing a `<script>` tag. It then runs in every visitor's browser, including admins'.

**Fix.**
- Sanitise blog HTML on save **and** on render, using an allow-list sanitiser such as `isomorphic-dompurify` or `sanitize-html`.
- In `StructuredData`, escape `<` as `<` before injecting.

**Why.** Fixing C1 alone is not enough. Admin accounts get phished, and future "editor" or "agent" roles will write content. Sanitising on output protects visitors whatever got into the database.

### C3 — Booking price is controlled by the client · **Critical**

**Evidence.** [src/app/api/bookings/flight-request/route.ts:197-200](src/app/api/bookings/flight-request/route.ts#L197-L200) stores `body.pricing.grandTotal`, falling back to `payload.offer.price`. Both come from the browser's `sessionStorage` ([payment-page-client.tsx:148](src/components/features/booking/payment-page-client.tsx#L148)). The service-charge percentage is also taken from the request body.

**Failure scenario.** A user edits `sessionStorage.booking_payload.offer.price` to `1` and submits. The admin panel and CRM then show a valid-looking booking for PKR 1.

**Fix.**
- Store each search result server-side, with a short TTL, keyed by offer ID.
- When a booking comes in, look up the offer by ID, re-price it (or call Sabre's revalidate/price-check), and compute service charges from `PaymentSetting` on the server.
- The client sends only `offerId`, passengers and contact details.

**Why.** Fares change by the minute and the browser is untrusted. Server-side re-pricing is standard in travel booking because it protects the agency from honouring fares that were tampered with or have expired.

### C4 — `.env` is copied into the Docker image · **Critical**

**Evidence.** [.dockerignore](.dockerignore) excludes `.env.local` and similar files but **not `.env`**, and the [Dockerfile](Dockerfile) runs `COPY . .`. Every image built therefore contains the database URL, `NEXTAUTH_SECRET`, Sabre, R2, Resend and GA4 credentials.

**Fix.**
- Add `.env*` (and `.next-backup-*`) to `.dockerignore`.
- Inject secrets at runtime through the host's secret manager.
- **Rotate every secret** if an image has ever been pushed to a registry.

**Why.** Anyone who can pull an image can extract its layers. Rotation is needed because removing the file now doesn't remove it from images that already exist.

### H1 — Draft and archived content is shown publicly · **High**

**Evidence.**
- [src/app/umrah-packages/page.tsx:29](src/app/umrah-packages/page.tsx#L29) fetches `/api/packages?all=true`, so the public listing includes `DRAFT` and `ARCHIVED` packages.
- [src/app/api/packages/[id]/route.ts:22](src/app/api/packages/[id]/route.ts#L22) returns any package by id or slug, whatever its status.
- [src/app/api/reviews/route.ts:21](src/app/api/reviews/route.ts#L21): `?all=true` returns unpublished reviews to anyone. The same pattern appears in blog, activities and destinations.

**Fix.** Public queries always filter `status: "PUBLISHED"` / `isPublished: true`. Only admin-authenticated code may see everything.

**Why.** Drafts often hold unconfirmed prices and dates. A customer who books a draft package creates an operational and possibly legal problem.

### H2 — Customers can see and book fake fares · **High**

**Evidence.**
- [src/lib/flights/search-service.ts:369](src/lib/flights/search-service.ts#L369) falls back to `flightResults` from [src/lib/mock-data.ts](src/lib/mock-data.ts) whenever Sabre fails or returns nothing on one-way or round-trip searches.
- The mock fares cover LHE→JED and KHI→JED (the busiest Umrah routes) with departures fixed at **12 April 2026, which has already passed**.
- The booking route never checks `offer.provider === "Mock"`.
- [search-service.ts:352](src/lib/flights/search-service.ts#L352) also shows the raw provider error to customers ("Live flight search unavailable: Sabre token request failed (401)…").

**Fix.**
- Turn the mock fallback off in production (e.g. `ENABLE_MOCK_FLIGHTS=false`).
- When live search fails, show a "Request a quote" form that creates a `ServiceRequest`.
- Reject mock offers at booking time.
- Log provider errors server-side and show customers a generic message.

**Why.** A failed search that becomes a lead is still revenue. A fake fare that becomes a booking costs money and the customer's trust. Raw error text also tells attackers which provider and credentials you use.

### H3 — Guest bookings create passwordless accounts that lock out the real owner · **High**

**Evidence.**
- [flight-request/route.ts:125-148](src/app/api/bookings/flight-request/route.ts#L125-L148) and [chatbot-request/route.ts](src/app/api/bookings/chatbot-request/route.ts) do `findUnique` or `create` on `User` using whatever email was typed, and attach the booking to that user.
- The chatbot route does not lowercase emails, but registration does.

**Failure scenarios.**
1. A customer books as a guest and later tries to sign up. They get "An account with this email already exists" ([register/route.ts](src/app/api/auth/register/route.ts)) and can't set a password, because there is no reset flow (M2).
2. Anyone can type someone else's email and push bookings into that person's dashboard.
3. `Ali@x.com` from the chatbot and `ali@x.com` from signup become two separate users.

**Fix.**
- Separate **contacts** (people who made an enquiry) from **user accounts** (people who log in). Store guest contact details on the booking or lead.
- Link a booking to a `User` only when the session is authenticated, or after the user verifies that email address.
- Normalise emails everywhere: `trim().toLowerCase()`.
- On signup, if a passwordless record exists, send a verification email so the owner can claim it.

**Why.** This contact/account split is the same model a CRM uses (Contact vs. Portal User), so fixing it here also prepares for section 6.

### H4 — Online payment methods appear but do nothing · **High**

**Evidence.**
- [prisma/schema.prisma](prisma/schema.prisma) `PaymentSetting` defaults `enableWise`, `enableStripe`, `enablePaypal`, `enableSumup` and `enablePaymob` to `true`.
- [payment-page-client.tsx:344](src/components/features/booking/payment-page-client.tsx#L344) is a `// TODO: integrate each gateway's SDK`. Choosing Stripe does nothing.
- A successful booking is confirmed with `alert()` and a redirect to `/flights`. There is no confirmation page and no email.

**Fix.**
- Default all unimplemented gateways to `false`.
- Build **one** gateway end-to-end first (the one the client chooses). It needs a server-created payment intent, webhook confirmation and idempotency.
- Add a `/booking/[reference]` confirmation page and a confirmation email.

**Why.** Five half-built gateways are worse than one that works: each is its own source of reconciliation bugs. The webhook (not the browser redirect) must be the source of truth for "paid", because users close tabs mid-redirect.

### H5 — Admins cannot manage the booking lifecycle · **High**

**Evidence.**
- No route or action updates `Booking.status` or `ServiceRequest.status` (searched for `booking.update` and `serviceRequest.update`: none found).
- [admin/bookings/page.tsx:564-583](src/app/admin/bookings/page.tsx#L564-L583) loads a hard-coded `take: 200` with no pagination.
- `BookingStatus` has only `PENDING`, `CONFIRMED`, `CANCELLED` and `FAILED`.

**Fix.**
- Add status transitions with an audit table (`BookingEvent`: who, when, from→to, note).
- Paginate with a cursor.
- Expand the lifecycle (see section 6.3).

**Why.** Booking operations are the agency's core daily work. Without status changes, every booking becomes a phone call or a spreadsheet. The audit table also answers "who cancelled this?", the first question the client will ask after a dispute.

### H6 — User roles are frozen in the JWT for 30 days · **High**

**Evidence.** [auth-provider.ts:67](src/lib/providers/auth/auth-provider.ts#L67) sets `maxAge` to 30 days. `token.role` is written only at sign-in (lines 103 and 107), and the proxy trusts it.

**Failure scenario.** You demote a former employee from `ADMIN`. They keep admin access for up to 30 days.

**Fix.**
- In the `jwt` callback, re-read `role` from the database every few minutes (store a `roleCheckedAt` claim), or add a `tokenVersion` column and compare it on each check.
- Shorten admin sessions.

**Why.** Revoking access has to take effect immediately. This matters more once CRM agents and staff accounts exist.

### H7 — No rate limiting or bot protection anywhere · **High**

**Evidence.** No rate limiter or CAPTCHA appears in `src/`. Public endpoints such as register, credentials sign-in, flight search (each call costs a Sabre request), bookings, service requests, chatbot and reviews can be hammered without limit.

**Fix.**
- Add per-IP and per-email limits (e.g. Upstash Ratelimit, or a Postgres-backed limiter).
- Add Cloudflare Turnstile to signup, reviews and enquiry forms.
- Cache identical flight searches (section 4.4).

**Why.**
- **Cost:** Sabre bills per search, and look-to-book ratios are contractual. Resend bills per email.
- **CRM data quality:** spam leads flow straight into the CRM.
- **Security:** an unlimited sign-in endpoint lets attackers brute-force passwords.

---

## 3. Medium and low-severity bugs

| ID | Issue | Evidence | Fix | Why |
|---|---|---|---|---|
| M1 | Server pages call their own API over HTTP, using the `Host` header to build the URL | [umrah-packages/page.tsx:26-29](src/app/umrah-packages/page.tsx#L26-L29), [umrah-packages/[slug]/page.tsx:78-86](src/app/umrah-packages/[slug]/page.tsx#L78-L86), [admin/page.tsx:266](src/app/admin/page.tsx#L266) | Call a shared service function directly (section 5.1) | A spoofed `Host` header makes the server fetch an attacker's URL (SSRF). The protocol guess (`localhost` means http, otherwise https) breaks behind proxies. Each call also adds an extra network hop and doubles the serverless invocations. |
| M2 | "Forgot password?" links to a page that doesn't exist | [signin/page.tsx:194](src/app/signin/page.tsx#L194) links to `/forgot-password`, which isn't defined | Build a reset flow, reusing the token-hash pattern from `email-verification.ts` | Users who forget their password are stuck, and so are guest-created accounts (H3). |
| M3 | Hotels and tour packages show hardcoded demo data | [api/search/hotels/route.ts](src/app/api/search/hotels/route.ts) returns `hotelResults` with a note to "replace mock results"; [tour-packages/page.tsx](src/app/tour-packages/page.tsx) imports `tourPackageResults`, even though a `TourPackage` table exists | Render tour packages from the DB with admin CRUD. For hotels, either integrate a provider or relabel the page "Hotel enquiry" | The client will treat anything on the site as real inventory. |
| M4 | Raw exception messages are returned to clients | e.g. [packages/[id]/route.ts](src/app/api/packages/[id]/route.ts) returns `err.message` with status 503, and blog POST returns it with 400 | Return a stable error code to the client; log details server-side with a request ID | Prisma errors expose table and column names. The status codes are also wrong: a validation error is not a 503. |
| M5 | Debug endpoint exposes the decoded JWT | [api/auth/token/route.ts](src/app/api/auth/token/route.ts) | Delete it | It serves no product purpose and gives any XSS a clean read of the session claims. |
| M6 | TLS certificate checking is turned off for the DB connection | [prisma/client.ts](prisma/client.ts): `ssl: { rejectUnauthorized: false }` | Pin the Supabase CA certificate | Without verification, anyone positioned between the app and the database can intercept traffic (man-in-the-middle). |
| M7 | Registration edge cases | [register/route.ts](src/app/api/auth/register/route.ts): two concurrent signups for the same email hit a unique-constraint error and return 500; if the email fails to send, the account can never be verified (no resend endpoint); the 409 response reveals which emails are registered | Catch `P2002` (Prisma's unique-constraint error code); add a "resend verification" endpoint; return the same response whether or not the email exists | All three generate support tickets, and the last one helps attackers build lists of valid accounts. |
| M8 | `Activity.destinationId` has no foreign key or index | [schema.prisma](prisma/schema.prisma) `Activity` model | Add `@relation` with `onDelete: Restrict` (or `Cascade`) plus `@@index([destinationId])` | Deleting a destination currently leaves orphaned activities, and every lookup by destination scans the whole table. |
| M9 | The circuit breaker trips on unrelated errors | [src/lib/db.ts](src/lib/db.ts) treats any error message containing `"connect"`, `"connection"` or `"timeout"` as "database down" for 30 s | Match on Prisma/pg error **codes** (`P1001`, `P2024`, `ECONNREFUSED`) | A harmless error that happens to mention "connection" makes the whole site serve dummy packages for 30 s, on that instance only, so different users see different content. |
| M10 | Migrations may lag behind the schema | The overview itself warns about this; 3 migrations exist and `db:push` is the documented setup path | Run `prisma migrate diff` against a fresh DB in CI and fail on drift | `db push` in production can silently drop columns. Migration history is how you deploy safely. |
| L1 | Nested `<main>` elements | [layout.tsx:96](src/app/layout.tsx#L96) and [page.tsx:33](src/app/page.tsx#L33) | Make the page wrapper a `<div>` | Invalid HTML; screen readers announce two main landmarks. |
| L2 | Dead code: legacy branch fallback | [flight-request/route.ts:33](src/app/api/bookings/flight-request/route.ts#L33): `getBranchDelegate()` always returns a truthy value, so `findLegacyBranchById` never runs | Delete the fallback once branches are migrated | Less code to maintain and audit. |
| L3 | Repo hygiene | `.next-backup-20261023/` (693 MB, root-owned, not gitignored, and the reason `eslint .` reports 21,580 problems); tracked `blog.out`; `test-blog.js` in the repo root; 13 `react-hooks/set-state-in-effect` lint errors in `src` | Delete the backup folder, add `.next-backup-*` to `.gitignore`, remove the scratch files, fix the lint errors | A clean `npm run lint` is needed before CI can enforce it, and a 693 MB folder is one `git add .` away from being committed. |
| L4 | The Docker image runs the dev server | [Dockerfile](Dockerfile) `CMD ["npm","run","dev"]` | Add a multi-stage production Dockerfile (`next build` with `output: "standalone"`, then `node server.js`) | The dev server is slow and unoptimised, and not meant to face real traffic. |
| L5 | No CI, and tests only cover helper libraries | No workflow exists in `.github/`; tests cover only `src/lib` helpers | Add a GitHub Actions workflow that runs typecheck, lint, test, build and a migration-drift check; add route tests for auth guards, booking pricing and status transitions | Every bug in section 2 is the kind a route test catches. |

---

## 4. Performance improvements

### 4.1 Render the homepage on the server, not in the browser

**Evidence.** All five homepage sections (`airlines-slider`, `destinations-slider`, `activities-slider`, `blog-slider` and `customer-reviews-section`) are `"use client"` components that `fetch()` after hydration. [customer-reviews-section.tsx:57](src/components/features/home/customer-reviews-section.tsx#L57) and [airlines-slider.tsx:31](src/components/features/home/airlines-slider.tsx#L31) also use `cache: "no-store"`.

**Fix.**
- Make the sections async Server Components that read from the service layer.
- Keep only the carousel interaction as a small client component.
- Cache the data with `"use cache"` plus `cacheTag("destinations")` etc. (requires `cacheComponents: true` in `next.config.ts`; see `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`).
- Call `revalidateTag()` from admin mutations.

**Why.**
- **Speed:** today the browser downloads JS, hydrates, then makes five more API calls, each hitting Postgres. That is the main source of slow Largest Contentful Paint (LCP) and of layout shift.
- **SEO:** search engines currently get an empty homepage.
- **Cost:** cached server rendering cuts DB load on the busiest page to near zero.

### 4.2 Stop calling your own API from server components

See M1. Fetching `http://host/api/packages` from a server component costs a full HTTP round trip, JSON serialise/parse, and a second function invocation. Calling `getPublishedPackages()` directly is faster and type-safe, and it removes the `PackageRow` mapping that is currently duplicated in [packages/route.ts](src/app/api/packages/route.ts) and [packages/[id]/route.ts](src/app/api/packages/[id]/route.ts).

### 4.3 Take search logging off the response path

[api/search/flights/route.ts:28](src/app/api/search/flights/route.ts#L28) `await`s a `flightSearchLog.create` before responding. Wrap it in `after()` from `next/server` (see `…/04-functions/after.md`). **Why:** customers shouldn't wait for an analytics write. Any DB slowness currently adds directly to search latency.

### 4.4 Cache flight search results

Identical searches (same route, dates, passenger mix and cabin) within a few minutes should hit a cache (Redis or Upstash) and not Sabre. Store the offers server-side under the cache key, which also makes C3's server-side re-pricing possible.

**Why.** Sabre searches are the slowest operation in the app (often several seconds) and are billed. Umrah traffic clusters heavily on a few routes and dates, so the hit rate will be high.

### 4.5 Remove the Sabre token stampede

[sabre/flight-search.ts:119-161](src/lib/providers/sabre/flight-search.ts#L119-L161) caches the token, but when it expires every concurrent request fetches a new one. Cache the **in-flight promise** so they all share one refresh. **Why:** at peak times this turns one auth call into dozens, and Sabre may rate-limit the auth endpoint.

### 4.6 Lazy-load global client components

[layout.tsx](src/app/layout.tsx) mounts `FloatingReviewWidget` (645 lines, a client component) on every page, admin pages included. Load it with `next/dynamic` when the user first interacts with it, and leave it off admin routes.

Also split [flight-search.tsx](src/components/features/home/flight-search/flight-search.tsx) (1,306 lines), the first thing on the homepage, so multi-city and passenger pickers load only when opened.

**Why:** less JavaScript to parse before the page responds to input, which helps Interaction to Next Paint (INP), especially on mid-range Android phones, a large share of this market.

### 4.7 Use `next/image` consistently

There are 12 raw `<img>` tags (e.g. `blog-slider`, `destinations-slider`) and 5 `unoptimized` images. Switch to `next/image` with `sizes` and add the R2 domain to `remotePatterns`, which [next.config.ts](next.config.ts) already does. **Why:** travel sites are image-heavy. Serving AVIF/WebP at the right size is usually the largest bandwidth saving available.

### 4.8 Upload media directly to R2

[api/admin/media/route.ts:115](src/app/api/admin/media/route.ts#L115) accepts files up to 50 MB through the Next.js server. Issue a **presigned PUT URL** so the browser uploads straight to R2. **Why:** the current route buffers each upload in server memory, and on serverless hosts the request-body limit (a few MB) will break large uploads.

---

## 5. Scalability issues

### 5.1 No service layer; business logic lives in route handlers

**Problem.** Prisma queries, validation, data mapping and business rules are written inline in each route and page.

**Fix.** Create `src/lib/services/{packages,bookings,leads,content}.ts`. Route handlers, Server Actions, server components, background jobs and the CRM sync all call these functions.

**Why.** The CRM integration, a future mobile app, and agent tools all need the *same* rules: price calculation, status transitions, publish filters. With one implementation, a fix applies everywhere at once.

### 5.2 State held in memory breaks with more than one instance

**Problem.** The Sabre and Amadeus token caches, the `databaseUnavailableUntil` circuit breaker, and any future rate limiter all live in process memory.

**Fix.** Move shared state to Redis or Upstash once you run more than one instance.

**Why.** With N instances you get N token refreshes and N separate rate limits (effectively N times the allowed rate), and instances disagree about whether the database is up (M9).

### 5.3 Database indexes are missing for every common query

The schema has unique indexes only. Add these:

| Model | Index | Used by |
|---|---|---|
| `Booking` | `@@index([userId, createdAt])`, `@@index([status, createdAt])` | Customer dashboard, admin bookings list |
| `PackageBooking` | `@@index([userId])`, `@@index([packageId])` | Dashboard, package detail |
| `UmrahPackage` / `TourPackage` | `@@index([status, startDate])` / `@@index([status, sortOrder])` | Public listings |
| `BlogPost` | `@@index([status, publishedAt])` | Blog index, sitemap |
| `Activity` | `@@index([destinationId, isActive])` | Destination pages |
| `FlightSearchLog` | `@@index([searchedAt])`, `@@index([origin, destination])` | Trending searches, retention job |

**Why.** These tables grow every day. Without indexes, every listing is a full table scan, and the first symptom is the admin bookings page slowing down after a few thousand bookings.

### 5.4 Search logs grow without limit

`FlightSearchLog` gets a row on every search. Add a retention job (e.g. delete rows older than 90 days, keeping aggregate counts in a `SearchStatDaily` table), or send search events to GA4 or a warehouse instead. **Why:** this will become your largest table within months, inflating backup size and the cost of the Supabase plan.

### 5.5 Connection pooling

`PG_POOL_MAX` defaults to 10 per instance. On serverless or auto-scaled hosting, use Supabase's **transaction-mode pooler** for `DATABASE_URL` and keep `DIRECT_URL` for migrations, which the code already supports. Set pool max to 1–3 per serverless instance. **Why:** Postgres connection limits are hard ceilings. Ten instances with ten connections each can exhaust a small Supabase plan during a traffic spike.

### 5.6 Admin settings are stored as JSON blobs with last-write-wins

Currency, visa countries, site pages, support contacts and branches (in the legacy `branches_catalog`) are JSON strings in `AdminSetting`. This works for configuration, but:
- Add an `updatedAt` check on save, so two admins editing at once get a conflict and don't overwrite each other.
- Add an audit row on every change.
- Move entities that the CRM or operations will query (branches, visa offerings) into proper tables. Branches have already made this move.

**Why.** The CRM will need to refer to these records (e.g. "which branch handles this lead") by stable ID.

### 5.7 API contract

**Fix.**
- Define request and response schemas with Zod in one place, and use them in route handlers.
- Version the public JSON API (`/api/v1/...`) before any external system depends on it.
- Paginate every list endpoint.

**Why.** Once a CRM, a WhatsApp bot or a mobile app calls these endpoints, an unversioned breaking change silently breaks the integration.

---

## 6. CRM readiness — recommended architecture

The repo already has three kinds of lead: `Booking` (flight requests), `ServiceRequest` (hotel/Umrah/visa/tour enquiries) and chatbot bookings, which are stored as `Booking` rows with `isChatbotRequest`. Customer information is spread across `User`, `flightData.contact` and `ServiceRequest.customerEmail`. A CRM needs one consistent picture.

### 6.1 Target data model

```
Contact            one person (email + phone, normalised); no login required
  └─ UserAccount   optional; exists only if they sign up (today's User)
Lead / Inquiry     every enquiry from any channel (web form, chatbot, call request, WhatsApp)
  └─ Booking       created when a lead converts; has a lifecycle and line items
BookingEvent       append-only history of status changes, notes and assignments
OutboxEvent        integration events waiting to be delivered (see 6.2)
```

Add `crmExternalId` and `crmSyncedAt` to Contact, Lead and Booking, plus `source`, `utmSource`, `utmCampaign`, `gclid` and `marketingConsent` on Lead.

**Why.**
- **Contact vs. account** fixes H3 and maps directly onto CRM "Contacts".
- **Lead vs. booking** maps onto CRM "Leads → Deals/Opportunities".
- **Attribution fields** let the client see which ad campaign produced which booking, usually the main reason a travel business buys a CRM.
- **Consent** is required for marketing email and WhatsApp.

### 6.2 Integration pattern: transactional outbox + adapter

```
[Route / Server Action]
   └─ prisma.$transaction([ create Booking, create OutboxEvent{type:"booking.created", payload} ])
[Worker: pg-boss, or a cron-triggered route]
   └─ reads pending OutboxEvents → CrmProvider.upsertContact / createDeal / updateStage
   └─ retries with exponential backoff; marks delivered; dead-letters after N failures
[CRM webhook → /api/integrations/crm/webhook]
   └─ verifies HMAC signature → updates Booking status / assignee → writes BookingEvent
```

- **Outbox in the same transaction.** *Why:* if you call the CRM directly inside the request, a CRM outage or slow response breaks bookings. If you write to the database and *then* call the CRM, a crash in between loses the lead. The outbox guarantees each lead is delivered at least once without coupling booking uptime to the CRM's.
- **Idempotency key = outbox event ID.** *Why:* retries must not create duplicate deals.
- **A `CrmProvider` interface** (`upsertContact`, `upsertLead`, `upsertDeal`, `updateStage`, `addNote`), implemented per vendor under `src/lib/providers/crm/<vendor>/`. *Why:* this mirrors the existing Sabre/Amadeus adapter pattern, so the client's CRM choice (HubSpot, Zoho, Salesforce, Bitrix24, or a custom one) or a later switch stays contained in one folder.
- **pg-boss** (a job queue built on Postgres) as the first worker. *Why:* it needs no new infrastructure, since Postgres already exists. Move to a managed queue only if volume demands it.
- **Agree a source of truth per field.** For example: the website owns price and itinerary; the CRM owns assigned agent, stage and notes. *Why:* two-way sync without ownership rules ends in update loops and overwritten data.

### 6.3 Booking lifecycle that maps onto a CRM pipeline

Replace the four-value `BookingStatus` with:

`NEW → CONTACTED → QUOTED → AWAITING_PAYMENT → PAID → TICKETED/CONFIRMED → TRAVELLED → CLOSED`, plus `CANCELLED`, `REFUNDED` and `FAILED`.

Enforce allowed transitions in the bookings service and write a `BookingEvent` for each one.

**Why.** CRM pipelines are stage-based. With only `PENDING` and `CONFIRMED`, the client's sales team can't measure where leads drop off, which is the main reporting value of a CRM.

### 6.4 Roles

Implement the existing (unused) `AGENT` role: agents see their assigned leads and bookings and can change their status, but cannot edit site content or settings. **Why:** once a CRM is in use, agents work leads from both the CRM and the admin panel, and they need least-privilege access.

---

## 7. Unique design and features

The client's market, inferred from the code: Umrah-first, Pakistan departures (LHE, KHI, ISB), PKR and SAR currencies, an `en_GB` locale, and UK-oriented payment options (Wise, SumUp). The suggestions below assume that market; confirm it with the client (section 8).

### 7.1 Design direction

The site uses DaisyUI's stock `corporate` theme ([layout.tsx:89](src/app/layout.tsx#L89)), which looks like many other DaisyUI sites. The font pairing (Cormorant Garamond + Plus Jakarta Sans) is a good, distinctive start.

| Recommendation | Why |
|---|---|
| **Build a custom design-token theme** (colour, radius, spacing, shadow) on Tailwind 4 `@theme`, and drop the stock DaisyUI theme. Base the palette on the brand, e.g. deep green/teal with gold accents to suit a pilgrimage brand, with a separate, energetic palette for leisure tours. | The look stops being "a template" and becomes the client's. Tokens keep every page consistent and make a dark mode or seasonal theme a single-file change. |
| **Editorial, photography-led layouts** for Umrah and destination pages: full-bleed hero, large serif headings, generous whitespace. | Umrah is a high-trust, emotional purchase. A premium editorial feel builds trust in a market full of cluttered agency sites. |
| **Mobile-first booking flow** with a sticky price summary and bottom-sheet pickers. | Most traffic in this market is on mobile. Today's flow ends in `alert()`. |
| **Visible trust signals**: licence/IATA/ministry registration numbers, verified reviews with trip type, branch addresses on a map, real agent photos. | Trust, not price, is the main barrier for high-value packages. The data already exists (`Branch`, `CustomerReview.isVerified`). |
| **RTL-ready layout** (use CSS logical properties now) with an Urdu and/or Arabic option later. | Adding RTL later is expensive if the layout uses `left`/`right` everywhere. Logical properties cost nothing now. |
| **Accessibility baseline (WCAG 2.2 AA)**: contrast, focus states, labelled inputs, a single `<main>` (L1). | Older pilgrims are a core audience, and accessible forms convert better for everyone. |

### 7.2 Features that differentiate the product

Ordered by value relative to effort.

| Feature | What it is | Why it matters |
|---|---|---|
| **WhatsApp-first lead capture** | "Continue on WhatsApp" on every package, a booking-status update template, and click-to-chat with a pre-filled reference | In Pakistan and the Gulf, WhatsApp is often the main channel for customers. Every chat becomes a CRM lead (section 6). |
| **Umrah package builder with live total** | Extends the existing [umrah-configurator.tsx](src/components/features/umrah/umrah-configurator.tsx): hotel tier, room sharing (quad/triple/double), nights split, visa and transport add-ons, all priced on the server | This is how customers actually choose. It replaces "call us for price" and produces structured leads. |
| **Hotel distance to the Haram / Masjid an-Nabawi** | Walking time and distance on every Makkah or Madinah hotel | This is the first thing Umrah buyers compare, and generic travel sites don't show it. |
| **Booking tracker by reference** | `/track/FL-12345678` showing status, documents needed and next steps, without logging in | Cuts "what's the status?" calls. It is easy to build once the lifecycle (6.3) exists. |
| **Document checklist and secure upload** | Passport, photo and vaccination uploads per traveller for visa processing, via presigned R2 URLs | Saves agents from chasing documents over WhatsApp and gives the CRM a "documents complete" stage. |
| **Instalment / deposit payments** | Pay a deposit to hold a package seat, balance before departure | Common for Umrah, and it lowers the barrier to booking. It needs H4's gateway work first. |
| **Fare and package alerts** | "Notify me when LHE→JED drops below X" or "when Ramadan packages open" | Captures intent from customers not ready to buy. Search logs already hold the demand data. |
| **Hijri calendar and seasonal awareness** | Show Hijri dates; highlight Ramadan, school holidays and peak periods in the date picker | It looks small, but it shows the product is built for this audience. |
| **Group and family bookings** | One lead contact, many travellers, room-sharing allocation | Umrah groups are the high-value segment. |
| **Multi-currency with a clear lock** | The `CurrencySettings` already exist; show "price locked for 15 minutes" at checkout | Prevents disputes when exchange rates move between quote and payment. |

---

## 8. Decisions needed from the client

These change the implementation, so get answers before Phase 3:

1. **Which CRM?** (HubSpot, Zoho, Salesforce, Bitrix24, or custom.) This decides the first adapter and the field mapping.
2. **Which payment gateway goes first?** (Stripe, Paymob, or another.) This depends on where the merchant account is registered.
3. **Markets and languages:** Pakistan only, UK diaspora, Gulf? English only, or Urdu/Arabic as well?
4. **Hotels:** live inventory (which supplier?) or enquiry-only?
5. **Hosting:** Vercel, a VPS with Docker, or something else. This affects caching (section 5.2), the background-worker choice (6.2) and the Dockerfile (L4).
6. **Is Sabre contracted for production,** and with what search quota? This affects the caching and rate-limit settings.

---

## 9. Recommended delivery roadmap

The order is deliberate: **safety → foundations → speed → integration → differentiation.** Building design or CRM sync on top of unauthenticated APIs and client-set prices would mean redoing that work.

### Phase 0 — Stop-ship fixes (do first, before any client demo)
C1, C2, C3, C4 (rotate secrets), H1, H2 (mock fallback off), H6, M5, and turning off unimplemented gateways (H4).
**Why first:** each is exploitable today or creates fake orders. A client who finds one will doubt the whole build.

### Phase 1 — Foundations
- Service layer (5.1), `requireAdmin()`/`requireRole()`, Zod for every request body, consistent error responses (M4).
- Contact/account separation and email normalisation (H3); password reset and resend-verification (M2, M7).
- Booking lifecycle and `BookingEvent` audit; admin status actions and pagination (H5, 6.3).
- Indexes, Activity foreign key, migration-drift check (5.3, M8, M10).
- Rate limiting and Turnstile (H7).
- CI: typecheck, lint, test, build, plus route tests for auth and pricing (L5). Repo cleanup (L3) and a production Dockerfile (L4).

**Why:** every later phase depends on a single place for business rules and on tests that catch regressions.

### Phase 2 — Performance
Server-rendered, cached homepage (4.1); remove self-fetches (4.2); `after()` logging (4.3); flight search cache and token dedupe (4.4, 4.5); lazy-loaded widgets (4.6); `next/image` (4.7); presigned uploads (4.8). Measure before and after with Lighthouse and the Core Web Vitals metrics (LCP, INP, CLS).
**Why:** speed affects conversion and SEO directly, and the caching here also cuts Sabre and database costs.

### Phase 3 — CRM-ready integration layer
Lead model, attribution and consent fields, outbox table, pg-boss worker, `CrmProvider` interface with the client's chosen CRM, an inbound webhook with signature verification, the `AGENT` role (section 6).
**Why:** once Phases 0–1 are in place, this is mostly additive work, and the outbox pattern means the CRM can be connected even after launch without touching booking code.

### Phase 4 — Design system and differentiating features
Design tokens and a custom theme, editorial page layouts, mobile booking flow, confirmation page and email (7.1). Then features from 7.2 in the client's priority order. WhatsApp capture and the booking tracker are recommended first.
**Why:** this is what the client sees and sells, and it sits on a base that won't need rework. Note: visual design (Figma) can start in parallel with Phase 0.

### Phase 5 — Payments and hardening
The first gateway end-to-end with webhooks and idempotency (H4); deposits and instalments; error monitoring (e.g. Sentry); uptime checks on `/api/health`, extended to check DB and Sabre reachability; backup and restore drill; load test on search and booking.
**Why:** payments are the highest-risk integration and should go live only once the booking lifecycle and monitoring exist to support them.

### Definition of done for client handover
- [ ] No unauthenticated write endpoint (verified by an automated route test)
- [ ] All prices computed server-side; no mock data reachable in production
- [ ] CI green: typecheck, lint, tests, build, no migration drift
- [ ] Lighthouse mobile ≥ 90 on Performance, Accessibility and SEO for the home, Umrah listing and package detail pages
- [ ] Secrets only in the host's secret manager; rotated after C4
- [ ] Every lead and booking produces an outbox event (CRM-ready, even before a CRM is connected)
- [ ] Admin can move a booking through its full lifecycle, with an audit trail
- [ ] README and `PROJECT_OVERVIEW.md` updated to match what was delivered

---

## 10. Notes on the existing PROJECT_OVERVIEW.md

The overview is accurate as a description, but it reads as if several features were finished when they are not. Update it after Phase 0 so the client documentation matches reality:

- "Payment selection page": only cash-on-delivery and pay-at-branch work; the other five options are stubs (H4).
- "Hotel search page": the results are always the same mock list (M3). Tour packages are also mock data, which the overview doesn't mention.
- "Administration … bookings": the admin can view bookings but cannot change them (H5).
- "Sign-in": there is no password reset (M2).
- "Flight search fallback to seeded mock offers": this is presented as a feature, but in production it is a defect (H2).
- `docs/` and `FIREBASE_CDN_SETUP.md` describe an outdated Firebase setup. Archive them to avoid confusion during handover.
