# Google Tag Manager setup: tags and triggers per service

This guide sets up tracking for every service on the site: **Flights, Hotels, Umrah, Tours and Visa**, plus contact clicks, contact form/chat leads and sign-ups.

You will end up with:

- **GA4**: every event recorded, with each service reported separately.
- **Key events (conversions)** in GA4 for each service.
- Optional **Google Ads conversions** for each service.

Everything below is done in the GTM, GA4 and Google Ads web interfaces. The website already sends all the events; no code changes are needed.

> The same instructions, per service and with copy buttons, are in the admin panel under **Admin → Settings → Site Analytics** (choose Google Tag Manager).

---

## 1. What the website sends

The site pushes these events to the GTM `dataLayer`. Use the names exactly as written. They are case-sensitive.

### Flights: full booking funnel

| Step | Event | When it fires | Useful parameters |
| --- | --- | --- | --- |
| 1 | `search` | Visitor submits the flight search form | `search_type` = `flight`, `trip_type`, `origin`, `destination`, `departure_date`, `return_date`, `cabin_class`, `adults`, `children`, `infants`, `direct_only`, `leg_count`, `search_surface` |
| 2 | `select_item` | Clicks **Book** on a flight result | `ecommerce` object (`value`, `currency`, `items`), `stops` |
| 3 | `begin_checkout` | Submits passenger details | `ecommerce` object, `trip_type`, `departure_date`, `return_date`, `passenger_count` |
| 4 | `payment_page_viewed` | Payment page opens | `trip_type`, `origin`, `destination`, `passenger_count`, `value`, `currency` |
| 5 | `add_payment_info` | Clicks pay with a payment method | `ecommerce` object incl. `payment_type`, `trip_type`, `passenger_count` |
| 6 | `purchase` | **Booking request saved** (the conversion) | `ecommerce` object incl. `transaction_id` (booking reference) |
| — | `generate_lead` | Flight enquiry form sent | `lead_type` = `flight`, `lead_source` = `enquiry_form`, `item_name` |

> `purchase` currently fires only for **Cash on Delivery** and **Pay at Branch**. Online gateways (card, PayPal etc.) are not connected yet, so they never produce a `purchase`.

### Hotels, Umrah, Tours, Visa: enquiry leads

These services take enquiries rather than instant bookings. Each one sends **`generate_lead`** when its enquiry form is submitted successfully. The service is identified by `lead_type`:

| Service | Page with the form | `lead_type` | `item_name` contains | Sends `value` + `currency`? |
| --- | --- | --- | --- | --- |
| Hotels | `/hotels` | `hotel` | Stay type, destination, dates, guests | No |
| Umrah | `/umrah-packages/<package>` | `umrah` | Package title | **Yes** (estimated total) |
| Tours | `/tour-packages/<package>` | `tour` | Package title | **Yes** (estimated amount) |
| Visa | `/visa/<country>` | `visa` | Country and visa type | No |
| Flights | `/flights` (enquiry form) | `flight` | Trip type, route, passengers, cabin | No |

All enquiry leads have `lead_source` = `enquiry_form`.

### Site-wide events

| Event | When | Parameters |
| --- | --- | --- |
| `generate_lead` | Contact form sent | `lead_type` = `contact`, `lead_source` = `contact_form` |
| `generate_lead` | Chat / review widget lead | `lead_type` = `chat`, `lead_source` = `chat_widget` |
| `contact_click` | Click on a phone, WhatsApp or email link | `method` (only the method, never the number) |
| `sign_up` | Account created with email | `method` = `email` |

No personal data (name, email, phone) is ever sent.

---

## 2. Connect GTM to the website

1. In **GTM**, create a Web container if you don't have one, and copy its ID (`GTM-XXXXXXX`).
2. On the website, go to **Admin → Settings → Site Analytics**.
3. Choose **Google Tag Manager**, paste the container ID and click **Save Site Analytics**.

The site now loads GTM on every public page.

---

## 3. Import the ready-made container

In **Admin → Settings → Site Analytics**, enter the GTM Container ID and the GA4 Measurement ID, and optionally the Google Ads Conversion ID and a label per service (step 6). Click **Save**, then **Download GTM container**.

The downloaded file has your IDs already filled in and contains everything below. Its template is `src/lib/analytics/gtm-container-base.json`.

**Tags**
- `Google Tag - GA4` (all pages)
- `GA4 Event - Ecommerce`
- `GA4 Event - Standard`

**Triggers for GA4**
- `CE - GA4 ecommerce events`: `select_item`, `begin_checkout`, `add_payment_info`, `purchase`
- `CE - GA4 standard events`: `search`, `payment_page_viewed`, `generate_lead`, `contact_click`, `sign_up`

**Triggers per service** (for ad platform conversions, see step 6)
- `CE - Lead - Flight enquiry`
- `CE - Lead - Hotel enquiry`
- `CE - Lead - Umrah enquiry`
- `CE - Lead - Tour enquiry`
- `CE - Lead - Visa enquiry`
- `CE - Lead - Contact form or chat`
- `CE - Flight booking (purchase)`

**Variables**
- A Data Layer Variable (`DLV - …`) for every parameter in section 1.
- `DLV - ecommerce.value`, `DLV - ecommerce.currency` and `DLV - ecommerce.transaction_id` for booking values.
- A `GA4 Measurement ID` constant.

**To import:**

1. GTM → **Admin → Import Container**.
2. Choose the downloaded `gtm-…-import.json` file.
3. Workspace: **Existing** (or a new one). Import option: **Merge → Rename conflicting tags, triggers and variables**.
4. Click **Confirm**.
5. Check **Variables → `GA4 Measurement ID`** shows your GA4 Measurement ID (`G-XXXXXXXXXX`, from GA4 → Admin → Data streams → your web stream). If you downloaded before saving it, it shows a placeholder; edit it here.
6. Don't publish yet. Test first (step 7).

> **Don't create extra GA4 event tags per service.** The two GA4 event tags already send every event for every service. Adding a "Hotel lead" GA4 tag on top would record each hotel lead twice. Services are separated inside GA4 by `lead_type` (step 4).

### If you prefer to build it by hand

1. **Variables → New → Data Layer Variable** for each parameter in section 1. Name it `DLV - <parameter>`, Data Layer Version 2.
2. **Tag: Google Tag.** Tag ID = your `G-…` ID. Trigger: **Initialization – All Pages**.
3. **Trigger: Custom Event**, event name `^(select_item|begin_checkout|add_payment_info|purchase)$`, tick **Use regex matching**.
4. **Tag: GA4 Event.**
   - Event Name = `{{Event}}`.
   - Tick **More settings → Ecommerce → Send Ecommerce data**, Data source **Data Layer**.
   - Trigger = the trigger from step 3.
5. **Trigger: Custom Event**, event name `^(search|payment_page_viewed|generate_lead|contact_click|sign_up)$`, regex.
6. **Tag: GA4 Event.**
   - Event Name = `{{Event}}`.
   - Add an Event Parameter row for each parameter (e.g. `lead_type` = `{{DLV - lead_type}}`).
   - Trigger = the trigger from step 5.

---

## 4. GA4: report each service separately

### 4a. Register custom dimensions

GA4 → **Admin → Custom definitions → Create custom dimension**. Scope **Event**. Create each of these. The parameter name must match exactly.

| Dimension name | Event parameter |
| --- | --- |
| Lead type | `lead_type` |
| Lead source | `lead_source` |
| Search type | `search_type` |
| Trip type | `trip_type` |
| Origin | `origin` |
| Destination | `destination` |
| Cabin class | `cabin_class` |
| Contact method | `method` |
| Search surface | `search_surface` |

After this, any report on `generate_lead` can be broken down by **Lead type** to show Flight / Hotel / Umrah / Tour / Visa / Contact / Chat side by side. Data appears from the moment the dimension is created; it is not backfilled.

### 4b. Create one key event per service

GA4 → **Admin → Events → Create event → Create**. Make one for each service:

| Custom event name | Matching conditions |
| --- | --- |
| `lead_flight` | `event_name` equals `generate_lead` **and** `lead_type` equals `flight` |
| `lead_hotel` | `event_name` equals `generate_lead` **and** `lead_type` equals `hotel` |
| `lead_umrah` | `event_name` equals `generate_lead` **and** `lead_type` equals `umrah` |
| `lead_tour` | `event_name` equals `generate_lead` **and** `lead_type` equals `tour` |
| `lead_visa` | `event_name` equals `generate_lead` **and** `lead_type` equals `visa` |
| `lead_contact` | `event_name` equals `generate_lead` **and** `lead_type` matches regex `contact\|chat` |

For each one, keep **Copy parameters from the source event** ticked.

Then go to **Admin → Key events** and mark these as key events:
- `lead_flight`, `lead_hotel`, `lead_umrah`, `lead_tour`, `lead_visa`, `lead_contact`
- `purchase` (flight bookings)
- Optionally `sign_up`

Leave `generate_lead` itself **not** marked as a key event, so leads aren't counted twice.

### 4c. Flight funnel report (optional)

GA4 → **Explore → Funnel exploration**. Add these steps in order:

1. `search`
2. `select_item`
3. `begin_checkout`
4. `payment_page_viewed`
5. `add_payment_info`
6. `purchase`

This shows where flight visitors drop off.

---

## 5. Per-service summary

| Service | What to watch in GA4 | Key event | GTM trigger for ads |
| --- | --- | --- | --- |
| **Flights** | `search` → `purchase` funnel; `generate_lead` with Lead type = flight | `purchase`, `lead_flight` | `CE - Flight booking (purchase)`, `CE - Lead - Flight enquiry` |
| **Hotels** | `generate_lead` with Lead type = hotel | `lead_hotel` | `CE - Lead - Hotel enquiry` |
| **Umrah** | `generate_lead` with Lead type = umrah (has value) | `lead_umrah` | `CE - Lead - Umrah enquiry` |
| **Tours** | `generate_lead` with Lead type = tour (has value) | `lead_tour` | `CE - Lead - Tour enquiry` |
| **Visa** | `generate_lead` with Lead type = visa | `lead_visa` | `CE - Lead - Visa enquiry` |
| **Contact** | `generate_lead` with Lead type = contact/chat; `contact_click` by Contact method | `lead_contact` | `CE - Lead - Contact form or chat` |

---

## 6. Google Ads conversions per service (optional)

Skip this section if you don't run Google Ads.

### Option A: import from GA4 (simplest)

1. Link GA4 to Google Ads: GA4 → **Admin → Google Ads links**.
2. In Google Ads → **Goals → Conversions → New conversion action → Import → Google Analytics 4 → Web**.
3. Select `purchase`, `lead_flight`, `lead_hotel`, `lead_umrah`, `lead_tour` and `lead_visa`.

No GTM changes are needed.

### Option B: Google Ads tags in GTM (faster attribution)

**Quickest:** paste the Conversion ID and each service's label into **Admin → Settings → Site Analytics → Google Ads conversions per service**, save and download the container again. It then contains the Conversion Linker and one Google Ads tag per service, already on the right trigger. Re-import with **Merge**.

**By hand:**

1. In Google Ads, create one conversion action per service:
   - Flight booking
   - Flight enquiry
   - Hotel enquiry
   - Umrah enquiry
   - Tour enquiry
   - Visa enquiry

   For each one, choose **Use Google Tag Manager** and note the **Conversion ID** and **Conversion Label**.
2. In GTM, add a **Conversion Linker** tag with trigger **All Pages**. Add it once.
3. For each service, add a tag of type **Google Ads Conversion Tracking**:

| Tag name | Conversion value | Currency code | Transaction ID | Trigger |
| --- | --- | --- | --- | --- |
| Ads - Flight booking | `{{DLV - ecommerce.value}}` | `{{DLV - ecommerce.currency}}` | `{{DLV - ecommerce.transaction_id}}` | `CE - Flight booking (purchase)` |
| Ads - Flight enquiry | *(leave blank)* | | | `CE - Lead - Flight enquiry` |
| Ads - Hotel enquiry | *(leave blank)* | | | `CE - Lead - Hotel enquiry` |
| Ads - Umrah enquiry | `{{DLV - value}}` | `{{DLV - currency}}` | | `CE - Lead - Umrah enquiry` |
| Ads - Tour enquiry | `{{DLV - value}}` | `{{DLV - currency}}` | | `CE - Lead - Tour enquiry` |
| Ads - Visa enquiry | *(leave blank)* | | | `CE - Lead - Visa enquiry` |

The Conversion ID and Label go into each tag from the matching Ads conversion action.

**Use either A or B for a given conversion, not both,** otherwise Google Ads counts it twice.

The same per-service triggers work for other ad platforms too, such as a Meta Pixel `Lead` / `Purchase` tag.

---

## 7. Test each service before publishing

1. In GTM, click **Preview** and enter the website URL.
2. In GA4, open **Admin → DebugView**.
3. Do each journey below. In the Tag Assistant panel, click the event on the left and check that the expected tags **fired**.

| Service | What to do on the site | Expect in Tag Assistant |
| --- | --- | --- |
| Flights (booking) | Search a flight → **Book** a result → fill passengers → on payment choose **Pay at Branch** or **Cash on Delivery** → confirm | `search`, `select_item`, `begin_checkout`, `payment_page_viewed`, `add_payment_info`, `purchase`. GA4 tags fire on each; *Ads - Flight booking* fires on `purchase` |
| Flights (enquiry) | Submit the flight enquiry form | `generate_lead` with `lead_type` = `flight` |
| Hotels | `/hotels` → submit the enquiry form | `generate_lead`, `lead_type` = `hotel` |
| Umrah | Open any Umrah package → submit the enquiry | `generate_lead`, `lead_type` = `umrah`, with `value` |
| Tours | Open any tour package → submit the enquiry | `generate_lead`, `lead_type` = `tour`, with `value` |
| Visa | Open any visa country page → submit the enquiry | `generate_lead`, `lead_type` = `visa` |
| Contact | Submit `/contact-us`; click a phone/WhatsApp link | `generate_lead` (`contact`), `contact_click` (`method`) |
| Sign-up | Create an account with email | `sign_up` |

On each `generate_lead`, open **Variables** in Tag Assistant and confirm `DLV - lead_type` holds the right service. Only that service's `CE - Lead - …` trigger should fire.

Test submissions create real enquiries and bookings in **Admin → Bookings**. Delete them afterwards, or tell the team they are tests.

Once everything fires correctly:

1. GTM → **Submit → Publish**, named e.g. "Per-service tracking".
2. GA4 standard reports can take 24–48 hours to show the data. DebugView and Realtime show it immediately.

---

## 8. Current gaps

These are not tracked yet and need code changes if you want them:

- **Search events for Hotels, Umrah, Tours and Visa.** Only the flight search form sends `search`. The other search forms send nothing until an enquiry is submitted.
- **Package views** (`view_item`) for Umrah and tour package pages.
- **Online payments.** `purchase` fires only for Cash on Delivery and Pay at Branch until the card/online gateways are connected.
