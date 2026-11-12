# Travel App — Project Overview

This repository contains a travel platform for flight search, hotel discovery, Umrah and tour packages, visa services, destinations, activities, and travel content. It includes customer-facing pages, an administrative dashboard, and API routes backed by PostgreSQL.

This overview reflects the source code reviewed on October 26, 2026. Integration descriptions indicate what is implemented in the repository; they do not confirm that external credentials or deployed services are operational.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16, App Router |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, DaisyUI 5 |
| Database | PostgreSQL, Prisma 7, PostgreSQL driver adapter |
| Authentication | NextAuth 4, Google OAuth, email/password, bcrypt |
| Validation | Zod 4 |
| Flight providers | Sabre integration; separate Amadeus adapter |
| Media storage | Cloudflare R2 through the AWS S3 SDK |
| Email | SMTP (nodemailer), configured in Admin → Settings → Email (SMTP) |
| Analytics | Google Analytics 4 and Google Tag Manager support |
| Tests | Jest 30 with Next.js integration |
| Local containers | Docker and Docker Compose |

## Current features

### Customer experience

- Flight search with one-way, round-trip, and multi-city input, passenger counts, cabin selection, currency, and direct-flight filtering.
- Flight passenger/contact forms and a payment selection page.
- Booking requests for cash on delivery or payment at a branch. Online payment gateways (Wise, Stripe, PayPal, SumUp, Paymob) are planned for phase 2 and are hidden at checkout until then.
- Every booking status change and admin note is kept in `BookingEvent` (who, when, from → to) and shown as a history on the admin booking page.
- Guest bookings are not attached to an account by email alone: the confirmation email carries a signed "Add this booking to my account" link that works only when signed in with that verified email.
- Flight search logs are written after the response and pruned after 90 days.
- Public forms (sign-up, forgot password, contact, enquiries, flight booking requests, reviews, chat requests) are protected by Cloudflare Turnstile when it is enabled in Admin → Settings → Form Protection, and by per-IP rate limits stored in Postgres (`RateLimitBucket`) so every app process shares one count.
- Hotel search page and an API that currently returns mock hotel results.
- Umrah and tour package listing/detail pages.
- Destination, activity, visa, and blog pages.
- Sign-up, email verification, email/password sign-in, Google sign-in, and a customer dashboard.
- Reviews, contact information, a call request page, FAQs, and policy pages.

### Administration

The `/admin` area contains pages for bookings, Umrah packages, destinations, activities, blog posts, reviews, visas, logos, media, site content, and settings. Supporting APIs cover pricing, currencies, branches, support contacts, airline logos, analytics, and other site configuration.

The user model defines `ADMIN`, `CUSTOMER`, and `AGENT` roles. Authentication adds the user's database ID and role to the session.

## Flight search behavior

The central implementation is [`src/lib/flights/search-service.ts`](src/lib/flights/search-service.ts).

1. Normalize URL parameters or a string-valued input object.
2. Validate search input with the shared Zod schema.
3. Request offers from the Sabre adapter.
4. Apply route and direct-flight filters.
5. Return results with the query, source, and warnings.

For one-way and round-trip searches, unavailable or empty Sabre results trigger a fallback to seeded mock offers. Multi-city searches return an empty result set and a warning when live results are unavailable; they do not use the mock fallback.

An Amadeus flight-search adapter exists in `src/lib/providers/amadeus/flight-search.ts`, but the central search service currently invokes Sabre only.

Flight booking requests create internal bookings with `PENDING` status. Creating a request does not itself establish airline ticket issuance or a completed online payment.

## Repository structure

```text
src/
  app/                    Public pages, admin pages, and API route handlers
  components/             Feature UI, layouts, shared components, providers
  lib/
    admin-settings/       Site configuration helpers
    analytics/            GA4 configuration and event helpers
    auth/                 Email verification helpers
    flights/              Search orchestration, offer types, booking types
    pricing/              Booking pricing helpers
    providers/            Sabre, Amadeus, and authentication integrations
    validations/          Shared validation schemas
    __tests__/            Library tests
    db.ts                 Database access and availability helpers
prisma/
  schema.prisma           Database models and enums
  migrations/             SQL migration history
  client.ts               Prisma client and PostgreSQL pool setup
  seed.js                 Seed data script
docs/                     Additional setup documentation
scripts/                  Maintenance scripts
```

## Database model

The schema in [`prisma/schema.prisma`](prisma/schema.prisma) includes:

- **Identity:** `User`, `EmailVerificationToken`.
- **Bookings and inquiries:** `Booking`, `PackageBooking`, `ServiceRequest`.
- **Travel catalog:** `UmrahPackage`, `TourPackage`, `Destination`, `Activity`.
- **Content and configuration:** `BlogPost`, `CustomerReview`, `AdminSetting`, `PaymentSetting`, `Branch`.
- **Search history models:** `FlightSearchLog`, `HotelSearchLog`.

Booking statuses are `PENDING`, `CONFIRMED`, `CANCELLED`, and `FAILED`. Package and blog publishing statuses are `DRAFT`, `PUBLISHED`, and `ARCHIVED`.

## Local setup

Use Node.js and npm; the repository's Docker image uses Node.js 20. A reachable PostgreSQL database is needed for persistent features.

1. Create or update `.env` locally using the variable reference below. Keep credential values out of documentation and version control.
2. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   npm run prisma:generate
   ```

3. For a new local development database, synchronize the schema:

   ```bash
   npm run db:push
   ```

   Review schema changes before applying them to an existing database. For environments managed through migration history, use `npm run prisma:deploy` to apply committed migrations instead. Confirm that the migration history covers the current schema before deployment.

4. Optionally populate development data:

   ```bash
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Open <http://localhost:3004>.

## Environment variable reference

Configure integrations according to the features being used. This list contains variable names only, not local credential values.

| Purpose | Variables |
| --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL`, optional `PG_POOL_MAX`, optional `DATABASE_SSL_CA` (PEM text or path to the server's CA certificate; turns on TLS certificate verification) |
| Authentication | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (also signs flight offers between search and booking) |
| Error tracking | none: the Sentry DSN, environment and tracing rate are set in Admin → Settings → Error Tracking (stored in the database; picked up by every server process within 5 minutes). Request bodies, headers, cookies, query strings and user details are never sent. |
| Form protection | none: the Turnstile site key and secret key are entered in Admin → Settings → Form Protection and stored encrypted in the database (needs `ADMIN_SETTINGS_ENCRYPTION_KEY`) |
| Google sign-in | None; enabled and configured in Admin → Settings → Google Sign-In (stored encrypted). `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are only copied into the database on first read if no setting exists yet |
| Public site URL | `NEXT_PUBLIC_SITE_URL`, `SITE_URL` |
| Verification emails | None; SMTP is stored encrypted in the database (needs `ADMIN_SETTINGS_ENCRYPTION_KEY`) |
| Sabre connection | `SABRE_BASE_URL`, `SABRE_CLIENT_ID`, `SABRE_CLIENT_SECRET`, `SABRE_PCC`, `SABRE_CPA_ID` |
| Sabre options | `SABRE_REQUESTOR_COMPANY_CODE`, `SABRE_ISO_COUNTRY`, `SABRE_ISO_CURRENCY`, `SABRE_INCLUDE_VENDOR_CODES`, `SABRE_NDC_ENABLED`, `SABRE_FLIGHT_SEARCH_PATH`, `SABRE_FARE_CALENDAR_PATH` |
| Amadeus adapter | `AMADEUS_BASE_URL`, `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_CURRENCY`, `AMADEUS_MAX_OFFERS` |
| Cloudflare R2 | `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` |
| Browser analytics | None; the GTM container or GA4 Measurement ID is stored in the database (Admin → Settings → Site Analytics) |
| Admin analytics | None; the GA4 property and service account are stored encrypted in the database (Admin → Settings → Dashboard Analytics, needs `ADMIN_SETTINGS_ENCRYPTION_KEY`) |

Runtime database connections prefer `DATABASE_URL`, with `DIRECT_URL` as a fallback. Prisma CLI configuration prefers `DIRECT_URL`, with `DATABASE_URL` as a fallback. For Supabase, use the appropriate pooled runtime connection and direct migration connection.

Existing Firebase setup documents describe an earlier storage setup; the current logo/media upload routes use Cloudflare R2.

## Main API groups

| Route | Purpose |
| --- | --- |
| `/api/search/flights` | Flight search |
| `/api/search/hotels` | Validated hotel search with mock results |
| `/api/search/fare-calendar` | Fare calendar requests |
| `/api/search/trending` | Trending searches |
| `/api/places/airports`, `/api/places/cities`, `/api/aviation/lookup` | Place and aviation lookups |
| `/api/bookings/flight-request` | Pending flight booking requests |
| `/api/bookings/service-request` | Flight, hotel, Umrah, visa, and tour inquiries |
| `/api/bookings/chatbot-request` | Chatbot booking requests |
| `/api/auth/*` | Authentication, registration, tokens, email verification |
| `/api/packages`, `/api/destinations`, `/api/activities`, `/api/blog`, `/api/reviews` | Catalog and content endpoints, with item routes where implemented |
| `/api/admin/*` | Administrative configuration, analytics, and uploads |
| `/api/settings/*` | Public branches and pricing settings |
| `/api/health` | Health endpoint |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development on port 3004 |
| `npm run build` | Generate the Prisma client and build Next.js |
| `npm start` | Serve a completed build on port 3004 |
| `npm run lint` | Run ESLint |
| `npm test -- --runInBand` | Run Jest tests serially |
| `npm run test:watch` | Watch tests |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate -- --name <name>` | Create/apply development migrations |
| `npm run prisma:deploy` | Apply committed migrations |
| `npm run db:push` | Synchronize the database to the schema |
| `npm run db:seed` | Run the seed script |
| `npm run docker:up` | Build and start the Compose development service |
| `npm run docker:down` | Stop the Compose service |
| `npm run docker:restart` | Stop, rebuild, and restart Compose |
| `npm run docker:logs` | Follow recent container logs |

The current Docker configuration runs the development server with source mounts. Production builds and database migration deployment are separate steps.

## Development guidance

Read [`AGENTS.md`](AGENTS.md) before changing code. It requires consulting the relevant bundled Next.js guide in `node_modules/next/dist/docs/` because this project's framework version may differ from familiar conventions.

Use the existing Jest tests under `src/lib/__tests__/` for the affected library behavior. Validate code changes with the relevant tests, lint, and build as appropriate. External provider behavior also requires credentials and integration checks; mock search results do not demonstrate live provider availability.
