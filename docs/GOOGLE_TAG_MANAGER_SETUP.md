# Google Tag Manager + GA4 Setup

How to connect EasyTrip to Google Tag Manager (GTM) and send booking-funnel events to Google Analytics 4 (GA4).

The website code is already done. It loads the GTM container on every page and sends four booking events to the `dataLayer`. Everything below is configuration in the admin panel, GTM, GA4 and Google Cloud.

---

## 1. Connect the website to GTM

1. In [tagmanager.google.com](https://tagmanager.google.com), open the container and copy its ID (`GTM-XXXXXXX`).
2. In the EasyTrip admin, go to **Settings → Analytics**:
   - **Provider:** Google Tag Manager
   - **GTM Container ID:** `GTM-XXXXXXX`
   - Click **Save Analytics Settings**.
3. Check that it loads. Open easytrip.com.pk in a **private/incognito window**, press **F12**, go to **Network**, reload and search for `gtm.js`. Status **200** means GTM is connected.

> Leave `NEXT_PUBLIC_ANALYTICS_PROVIDER`, `NEXT_PUBLIC_GTM_CONTAINER_ID` and `NEXT_PUBLIC_GA4_MEASUREMENT_ID` **unset** in production. If any of them is set, it overrides the admin panel.

---

## 2. GA4: get the Measurement ID and enable page-change tracking

The site switches pages without a full reload, so GA4 must track history changes.

1. In [analytics.google.com](https://analytics.google.com), go to **Admin → Data streams** and click the web stream.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Click the gear icon next to **Enhanced measurement**:
   - **Page views:** on
   - **Show advanced settings → Page changes based on browser history events:** ticked
   - Click **Save**.

---

## 3. GTM: the Google tag (page views)

**Tags → New**

| Field | Value |
|---|---|
| Tag type | Google Tag |
| Tag ID | `G-XXXXXXXXXX` |
| Trigger | Initialization – All Pages |
| Tag name | `GA4 – Google Tag` |

> Don't add a separate page-view tag. The Google tag already sends page views, so a second tag would count every page twice.

---

## 4. GTM: Data Layer Variables

First, go to **Variables → Built-In Variables → Configure** and make sure **Event** is ticked.

Then, for each name below, go to **Variables → User-Defined Variables → New → Data Layer Variable** (Version 2):

- **Data Layer Variable Name:** the exact name (lowercase)
- **Variable title:** `dlv - <name>`

| Data Layer Variable Name | Variable title |
|---|---|
| `trip_type` | `dlv - trip_type` |
| `origin` | `dlv - origin` |
| `destination` | `dlv - destination` |
| `departure_date` | `dlv - departure_date` |
| `return_date` | `dlv - return_date` |
| `cabin_class` | `dlv - cabin_class` |
| `adults` | `dlv - adults` |
| `children` | `dlv - children` |
| `infants` | `dlv - infants` |
| `direct_only` | `dlv - direct_only` |
| `search_surface` | `dlv - search_surface` |
| `leg_count` | `dlv - leg_count` |
| `passenger_count` | `dlv - passenger_count` |
| `amount` | `dlv - amount` |
| `currency` | `dlv - currency` |
| `payment_method` | `dlv - payment_method` |

---

## 5. GTM: triggers

Create one trigger per event: **Triggers → New → Custom Event**. The event name must match exactly; names are case-sensitive.

| Trigger name | Event name |
|---|---|
| `CE – flight_search_submitted` | `flight_search_submitted` |
| `CE – proceed_to_payment` | `proceed_to_payment` |
| `CE – payment_page_viewed` | `payment_page_viewed` |
| `CE – payment_submitted` | `payment_submitted` |

Leave **This trigger fires on** set to **All Custom Events**.

---

## 6. GTM: GA4 event tags

Create one tag per event: **Tags → New → Google Analytics → Google Analytics: GA4 Event**.

For every tag:
- **Measurement ID:** `G-XXXXXXXXXX`
- **Event Settings Variable:** None
- **User Properties:** leave empty
- **Event Parameters:** click **Add parameter** for each row below. Type the name on the left and pick the variable on the right with the brick icon.

### Tag: `GA4 – flight_search_submitted`
**Event Name:** `flight_search_submitted` · **Trigger:** `CE – flight_search_submitted`

| Event Parameter | Value |
|---|---|
| trip_type | `{{dlv - trip_type}}` |
| origin | `{{dlv - origin}}` |
| destination | `{{dlv - destination}}` |
| departure_date | `{{dlv - departure_date}}` |
| return_date | `{{dlv - return_date}}` |
| cabin_class | `{{dlv - cabin_class}}` |
| adults | `{{dlv - adults}}` |
| children | `{{dlv - children}}` |
| infants | `{{dlv - infants}}` |
| direct_only | `{{dlv - direct_only}}` |
| search_surface | `{{dlv - search_surface}}` |
| leg_count | `{{dlv - leg_count}}` |

### Tag: `GA4 – proceed_to_payment`
**Event Name:** `proceed_to_payment` · **Trigger:** `CE – proceed_to_payment`

### Tag: `GA4 – payment_page_viewed`
**Event Name:** `payment_page_viewed` · **Trigger:** `CE – payment_page_viewed`

Both of these tags use the same parameters:

| Event Parameter | Value |
|---|---|
| trip_type | `{{dlv - trip_type}}` |
| origin | `{{dlv - origin}}` |
| destination | `{{dlv - destination}}` |
| departure_date | `{{dlv - departure_date}}` |
| return_date | `{{dlv - return_date}}` |
| passenger_count | `{{dlv - passenger_count}}` |
| value | `{{dlv - amount}}` |
| currency | `{{dlv - currency}}` |

### Tag: `GA4 – payment_submitted`
**Event Name:** `payment_submitted` · **Trigger:** `CE – payment_submitted`

| Event Parameter | Value |
|---|---|
| payment_method | `{{dlv - payment_method}}` |
| trip_type | `{{dlv - trip_type}}` |
| passenger_count | `{{dlv - passenger_count}}` |
| value | `{{dlv - amount}}` |
| currency | `{{dlv - currency}}` |

> The amount is sent to GA4 as **`value`**, not `amount`. GA4 only records revenue from a parameter called `value` together with `currency`.

---

## 7. Test with Preview

1. In GTM, click **Preview**, enter `https://easytrip.com.pk` and click **Connect**.
2. On the site: search for a flight, continue to booking, open the payment page and submit a payment (sandbox is fine).
3. In Tag Assistant, click each event in the left list:
   - The matching `GA4 – …` tag should be under **Tags Fired**.
   - The **Variables** tab should show real values (origin, amount and so on).
4. In GA4, go to **Admin → DebugView** and watch the events arrive.

If a tag is under **Tags Not Fired**, check that the trigger's event name matches exactly.

---

## 8. Publish

In GTM, click **Submit**, enter a version name (e.g. `GA4 + booking funnel`) and click **Publish**.
Until you publish, only Preview mode sees the tags. Publish again after every change.

---

## 9. GA4: make the data reportable

1. **Custom dimensions:** go to **Admin → Custom definitions → Create custom dimension** (Scope: *Event*) and add:
   `origin`, `destination`, `trip_type`, `cabin_class`, `payment_method`, `search_surface`
2. **Custom metrics:** go to **Admin → Custom definitions → Custom metrics** and add `passenger_count`.
3. **Key event:** about 24 hours after the first event arrives, go to **Admin → Events** and star `payment_submitted`.
4. **Optional:** to exclude office traffic, go to **Admin → Data streams → stream → Configure tag settings → Define internal traffic**, add the office IP, then activate the filter under **Admin → Data filters**.

Standard reports take 24–48 hours to fill in. **Realtime** and **DebugView** update right away.

---

## 10. Admin dashboard reporting (optional)

The admin dashboard reads GA4 numbers through the Google Analytics Data API. In **Admin → Settings → Analytics**, fill in:

### Property ID
In GA4, go to **Admin → Property settings → Property details** and copy the numeric **Property ID** (e.g. `123456789`). This is not the `G-…` ID.

### Service Account Email and Private Key
1. In [console.cloud.google.com](https://console.cloud.google.com), create or select a project.
2. Go to **APIs & Services → Library**, search for **Google Analytics Data API** and click **Enable**.
3. Go to **IAM & Admin → Service Accounts → Create service account** (e.g. `analytics-reader`). No roles are needed.
4. Copy the account's email. This is the **Service Account Email**.
5. Open the account and go to **Keys → Add key → Create new key → JSON**. A file downloads.
6. Copy the `private_key` value from that file, from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`, into **Service Account Private Key**.

### Give the service account access
In GA4, go to **Admin → Property access management → + → Add users**. Paste the service account email and set the role to **Viewer**.

Back in the admin panel, click **Test Connection**, then **Save Analytics Settings**.

> Keep the JSON key private and never commit it to git. Once it's saved in the admin panel, you can delete the downloaded file.

---

## Reference: where the events come from

| Event | Fired when | Source |
|---|---|---|
| `flight_search_submitted` | A flight search is submitted | `src/components/features/home/flight-search/flight-search.tsx` |
| `proceed_to_payment` | The booking form is submitted | `src/components/features/booking/booking-form-client.tsx` |
| `payment_page_viewed` | The payment page opens | `src/components/features/booking/payment-page-client.tsx` |
| `payment_submitted` | A payment is submitted | `src/components/features/booking/payment-page-client.tsx` |![alt text](image.png)
Events are pushed by `trackGa4Event()` in `src/lib/analytics/ga4-events.ts`. The container is loaded by `src/components/analytics/ga4-loader.tsx`, using the ID from `getPublicAnalyticsConfig()` in `src/lib/admin-settings/ga4-settings.ts`.

## Common mistakes

- The Measurement ID belongs in GTM only. Don't also put it in the admin panel or `.env`.
- Event and variable names are case-sensitive.
- Changes don't go live until you **Publish** in GTM.
- Don't add a second page-view tag.
