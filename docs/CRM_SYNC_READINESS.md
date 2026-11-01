# CRM sync readiness: website bookings → CRM leads

Status: **planned, not started**. Written 29 October 2026.

This plan makes every website booking map field-for-field onto a Travel CRM lead, so syncing it later is a transfer, not a translation.

---

## 1. Where we are now

After the `20261029000000_normalize_tables` migration, every customer request (checkout, chatbot, Umrah / visa / tour enquiry forms) is a row in one `Booking` table, with `type`, `channel`, `status` and customer contact columns. That is the right foundation, but the data is not yet sync-ready:

| Gap | Why it blocks the sync |
|---|---|
| **Phone is optional** on the website | The CRM finds or creates the contact and lead by normalized phone (`Lead.phoneNormalized` is unique). No phone, no lead. |
| **Trip details are free-form JSON**, and each channel uses different names | The sync would have to guess per form and would break whenever a form changes (see table below). |
| **No sync tracking** | Nothing records whether a booking was sent, which CRM lead it became, or why sending failed. |

Current payload shapes:

| Source | Departure date | Passengers | Class |
|---|---|---|---|
| Checkout | `payload.query.departureDate` | `adults`, `children`, `infants` | `cabinClass` |
| Chatbot | `travelDates` (free text) | `passengers` (free text) | `travelClass` (free text) |
| Visa form | `travelDate` | `travelers` | – |
| Tour form | `preferredMonth` | `travelers` | – |

---

## 2. Decisions

### 2.1 No `Lead` table on the website

The website keeps one `Booking` table. In the CRM, every website request starts as a lead, even a paid checkout, because an agent still issues the ticket. Each synced booking becomes:

- a new **Lead** (`stage = NEW`, `source = WEBSITE`), or
- a **LeadOrder** under the existing lead when the phone number is already known (one lead per phone in the CRM).

The website never creates invoices, receipts or sale submissions. Those belong to the CRM.

### 2.2 `Booking` uses the CRM's lead field names and values

Only fields every request type shares become columns. Service-specific fields go in a `details` JSON column, as the CRM itself stores enquiry details.

| Website column | CRM field | Notes |
|---|---|---|
| `customerPhone` (**required**) | `phone` | |
| `phoneNormalized` | `phoneNormalized` | Must use the same normalization function as the CRM |
| `fromLocation`, `toLocation` | same | |
| `departureDate`, `returnDate` | same | Real dates, not free text |
| `tripType` | `TripType` | `ONE_WAY`, `ROUND_TRIP`, `MULTI_CITY` |
| `travelClass` | `TravelClass` | `ECONOMY`, `ECONOMY_PLUS`, `PREMIUM`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST` |
| `adultCount`, `childCount`, `infantCount` | same | |
| `type` | `leadType` (`ServiceType`) | Website types (`FLIGHT`, `HOTEL`, `UMRAH`, `VISA`, `TOUR`) are a subset of the CRM's |
| `details` (JSON) | Lead service details / `LeadOrder.itinerary` | CRM key names, e.g. `hotelCity`, `hotelRating`, `hotelBoard`, `umrahRoute`, `makkahNights`, `madinaNights`, `visaCountry`, `visaType`, `tourDays`, `flightSectors[]` (`sectorOrder`, `originIata`, `destinationIata`, `departureDate`) |
| `payload` (JSON) | – | Unchanged: raw snapshot of the flight offer, passengers, payment |

Naming conflict to settle: the website's `UmrahPackage` uses `madinahNights`, the CRM uses `madinaNights`. The contract uses the CRM spelling.

### 2.3 One shared Zod contract

A `websiteEnquirySchema` lives in the CRM's `packages/contracts` (already Zod 4, the same major version as the website). It is used:

- by the website, to validate every request before saving it;
- by the CRM, to validate every request it receives.

If either side renames a field, the build fails instead of leads silently losing data.

### 2.4 Sync tracking on `Booking`, not a new table

Only bookings sync, so a separate outbox table is not needed. New columns:

| Column | Purpose |
|---|---|
| `crmSyncStatus` | `PENDING`, `SENT`, `FAILED` |
| `crmLeadId` | CRM lead the booking became |
| `crmOrderNumber` | CRM lead order number, for repeat customers |
| `crmSyncedAt` | Last successful send |
| `crmSyncError` | Last failure message |

### 2.5 Status flows back from the CRM

The CRM owns the pipeline. On a lead stage change it calls a signed (HMAC) webhook on the website:

| CRM stage | Website `Booking.status` |
|---|---|
| `NEW`, `CONTACTED`, `QUOTED`, `FOLLOW_UP` | `PENDING` |
| `BOOKED` | `CONFIRMED` |
| `LOST` | `CANCELLED` |

---

## 3. Work items

### Step 1 – Migration (website)

- Add the columns from 2.2 and 2.4 to `Booking`, plus enums `TripType`, `TravelClass`, `CrmSyncStatus`.
- Index `phoneNormalized` and `(crmSyncStatus, createdAt)`.
- Backfill checkout rows from `payload.query` and `payload.contact`.
- Older chatbot and enquiry rows keep their JSON and are marked as not syncable, so they are never sent half-filled.

**Done when:** the migration applies cleanly on a copy of the hosted database and `prisma migrate diff` reports no drift.

### Step 2 – Forms send the shared fields (website)

| Form | Change |
|---|---|
| Flight checkout | Map `query` → trip columns; map `tripType` (`round-trip` → `ROUND_TRIP`, …) and `cabinClass` → `TravelClass`; multi-city legs → `details.flightSectors` |
| Chatbot | Replace free-text dates and passengers with a date picker and adult / child / infant counts; phone required |
| Umrah enquiry | `departureCity` → `fromLocation`; nights → `details.makkahNights` / `details.madinaNights` |
| Visa enquiry | `travelDate` → `departureDate`; `travelers` → `adultCount`; country / type → `details` |
| Tour enquiry | `destination` → `toLocation`; `preferredMonth` → `departureDate` (first of month); `travelers` → `adultCount` |
| All | Phone number required |

**Done when:** every form saves a booking that passes the shared contract.

### Step 3 – Shared contract (CRM repo, used by the website)

- Add `websiteEnquirySchema` and the enums to `packages/contracts`.
- Add the phone normalization function to the same package, so both systems use the same one.
- The website installs the package and uses it in `/api/bookings/*` routes.

**Done when:** both projects build against the same schema.

### Step 4 – Sync (can wait until the CRM is delivered)

Website:
- A cron job sends `crmSyncStatus = PENDING` bookings to the CRM with HMAC signing and `reference` as the idempotency key, retries with backoff, and records `FAILED` with the error.
- An inbound webhook route verifies the HMAC signature and applies the status mapping in 2.5.

CRM (`integrations/website` module):
- `POST /api/v1/integrations/website/leads` validates with the shared contract.
- Finds or creates the `Contact` by `phoneNormalized`.
- Creates a `Lead` (`source = WEBSITE`), or a `LeadOrder` if the lead already exists.
- Stores the website reference with a unique constraint so retries never duplicate.
- Sends a webhook to the website on stage changes.

**Done when:** a website enquiry appears in the CRM within a minute, a repeat customer becomes a lead order, and a stage change in the CRM updates the booking on the website.

---

## 4. Order

Steps 1–3 now, so data collected from today is sync-ready. Step 4 when the CRM is delivered.
