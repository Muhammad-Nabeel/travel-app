# Design Improvement Plan — Expedia-style Redesign

Goal: make Safar look and feel like a mature travel marketplace (Expedia, Booking, Skyscanner) — calm, photo-led, white-space heavy, with one dominant search box and consistent components across every page.

This document is based on an audit of the current code (`src/app`, `src/components`, `globals.css`, the `*.module.css` search engines). Each section lists **what is wrong now** and **what to change**.

---

## 1. What makes Expedia look "aesthetic"

Before listing fixes, these are the principles to copy — almost every issue below is a violation of one of them.

| Principle | What Expedia does |
|---|---|
| **One hero, one job** | Full-bleed real photo, a single serif headline, and a large white search card that overlaps the photo's bottom edge. |
| **Tabbed product switcher** | Stays / Flights / Cars / Packages / Things to do / Cruises as illustrated icons above the search fields, with an underline on the active tab. |
| **Pill search bar** | Fields live in one rounded row separated by thin dividers; one strong blue "Search" pill on the right. |
| **White chrome** | Header is plain white with dark text — no glass, gradients, or tinted backgrounds. |
| **Restrained palette** | White + near-black text + one brand blue for actions + one accent (yellow logo / dark navy promo banners). |
| **Photography does the colour** | Colour comes from destination images, not from gradients and orbs. |
| **Consistent cards** | Same radius, same shadow, same image ratio, same price position everywhere. |
| **Generous spacing** | Big vertical rhythm between sections; content capped at ~1200px. |

---

## 2. Critical issues found in the current code

These are bugs or clear design breaks — fix first.

1. **Nav links are invisible.** In [navbar.tsx](src/app/navbar.tsx) inactive links use `text-white/80` on a `bg-white/40`–`bg-white/70` header. On any page that isn't over the blue hero they are white-on-white.
2. **Dark-mode toggle does nothing.** `dark` in [navbar.tsx](src/app/navbar.tsx) is local state only; nothing changes `data-theme` or a class. Either wire it up or remove the button (recommended: remove for now — Expedia has no theme toggle).
3. **Half-dark pages on dark-mode OSes.** [globals.css](src/app/globals.css) switches `--background`/`--foreground` under `prefers-color-scheme: dark`, but components hardcode `bg-white`, `text-slate-900`, etc. Result: dark body, white cards, grey body text with poor contrast. Pick light-only until the token system (section 3) is in place.
4. **Two competing design systems.** `<html data-theme="corporate">` + DaisyUI classes (`footer`, `base-200`, `btn`, `card`, `skeleton`, `input-bordered`) are mixed with raw Tailwind slate/sky/blue and three large CSS modules with hardcoded hex (`#2563eb`, `#374151`, `#dbeafe`…). The footer and flight results look like a different site from the home sections.
5. **Too many colours.** Usage count across `src`: slate 1335, blue 295, sky 155, emerald 140, amber 129, rose 112, red 50, teal 32, plus orange/violet/indigo/cyan/purple/lime/pink. Active nav is `sky-400`, search tab is `blue-700`, card stripes are amber→orange and emerald→teal, blog badge is amber. There is no single "brand blue".
6. **Too many radii.** `rounded-lg` (227), `rounded-full` (180), `rounded-xl` (142), `rounded-2xl` (127), `rounded-3xl` (48), `rounded-4xl`, `rounded-[2rem]`, `rounded-[1.75rem]`… Cards on the same page use different corners.
7. **Hero is a gradient, not a photo.** `.homeHero` in [flight-search-engine.module.css](src/components/features/home/flight-search/flight-search-engine.module.css) is a blue→green gradient with blurred orbs. It reads as a SaaS landing page, not travel.
8. **Home only searches flights.** The site sells Umrah, tour packages, visas, hotels and activities, but the home search box only offers flights. Expedia's biggest visual cue is the product tab row.
9. **Display font is almost unused.** Cormorant Garamond is loaded globally but used in 4 places; headings use `font-extrabold` sans. Either use it deliberately for hero/section headlines (Expedia uses a serif hero headline) or drop it to save a font download.
10. **Gimmicky body background.** `body` has two radial gradients + a linear gradient; `.surface` uses backdrop blur; `.hero-grid` draws a grid. These muddy the white canvas.
11. **Placeholder copy in production.** e.g. hotels page: "real provider data coming soon"; hero eyebrow "Built for serious flight search" / "One clean row to search…" describes the UI rather than selling travel.
12. **Scrollbar styling** uses a blue gradient thumb on every element — remove; native thin scrollbars look more premium.

---

## 3. Design system (do this before page work)

### 3.1 Colour tokens

Replace the current `:root` block in `globals.css` with a small, semantic set and **only** use these in components.

```css
:root {
  /* Neutrals */
  --bg: #ffffff;
  --bg-subtle: #f5f6f8;      /* section backgrounds, inputs */
  --surface: #ffffff;        /* cards */
  --border: #dfe0e4;
  --text: #191e3b;           /* near-navy, like Expedia */
  --text-muted: #5f6377;

  /* Brand */
  --primary: #1668e3;        /* all primary buttons, links, active tabs */
  --primary-hover: #0d4eaf;
  --primary-soft: #e8f0fd;   /* selected chips, active tab bg */
  --accent: #c8a24a;         /* Umrah/premium gold — badges only */
  --deal: #d1173a;           /* sale price / "x% off" only */
  --success: #227950;

  /* Dark promo band (like "Packages under $699") */
  --navy: #191e3b;

  --radius-sm: 8px;   /* inputs, chips */
  --radius-md: 12px;  /* buttons in forms, small cards */
  --radius-lg: 16px;  /* cards, search card */
  --radius-pill: 999px;

  --shadow-card: 0 1px 3px rgba(12, 14, 28, .08), 0 2px 8px rgba(12, 14, 28, .06);
  --shadow-raised: 0 8px 24px rgba(12, 14, 28, .14);
}
```

Rules:
- Body background = plain `var(--bg)`. Alternate sections can use `--bg-subtle`.
- One primary blue. Remove `sky-*`, `emerald-*`, `teal-*`, `violet-*`, `indigo-*` from UI chrome.
- Gold accent is reserved for Umrah/premium badges; red only for discounts/errors.
- Map these in `@theme inline` so Tailwind classes become `bg-primary`, `text-muted`, `rounded-card`, etc.

### 3.2 Pick one component approach

Recommended: **drop DaisyUI** and build ~10 small components in `src/components/ui/` (Button, Input, Select, Card, Badge, Tabs, Modal/Sheet, Skeleton, SectionHeader, PriceTag). DaisyUI's `corporate` theme is what currently fights the custom styles. If you keep DaisyUI, define a custom theme with the tokens above and stop using raw slate/sky classes.

Also migrate the three CSS modules (flight / hotel / package search, ~1,800 lines combined) onto the same tokens — they currently hardcode Tailwind-gray hex values.

### 3.3 Typography

- Body/UI: keep **Plus Jakarta Sans** (or switch to Inter). Weights 400/500/600/700 only — avoid `font-extrabold`.
- Display: use the serif (**Cormorant Garamond** works, or *DM Serif Display* which is closer to Expedia's hero) **only** for the hero headline and big promo banners.
- Scale (desktop / mobile):

| Token | Size | Use |
|---|---|---|
| display | 56 / 36px serif | Hero headline |
| h1 | 36 / 28px | Page titles |
| h2 | 28 / 22px | Section titles ("Explore stays in trending destinations") |
| h3 | 18px 600 | Card titles |
| body | 16px | Paragraphs |
| small | 14px | Meta, labels |
| caption | 12px | Badges, fine print |

- Remove the uppercase letter-spaced "eyebrow" labels (`tracking-[0.2em]`, `tracking-[0.24em]`) from most sections — Expedia uses plain sentence-case titles.

### 3.4 Spacing & layout

- Container: keep `.section-shell` at `min(1200px, 100% - 2rem)`; on mobile use `1rem` gutters.
- Section rhythm: `py-12 md:py-16` between home sections (currently `py-6`–`py-10`, which feels cramped).
- Grid: cards in 2 / 3 / 4 columns with `gap-4 md:gap-6`.

### 3.5 Icons & imagery

- Keep lucide for UI icons (1.5px stroke, 20px). For the **product tabs** use colourful illustrated icons like Expedia (a small custom SVG set — bed, plane, Kaaba, suitcase, passport, ticket).
- Every destination, package, hotel and blog card needs a real photo at a fixed ratio (cards 4:3, hero 21:9). Replace all decorative gradients (`.destination-tile`, card top stripes `h-2 bg-linear-to-r …`).
- Use `next/image` everywhere (10 files still use raw `<img>`), with `sizes` and blur placeholders.

---

## 4. Global components

### 4.1 Header (`navbar.tsx`)

Target layout (desktop):

```
[Logo]  [Shop travel ▾]                 PKR • 🇵🇰   Support   My trips   [Sign in]
```

- Solid white background, 1px bottom border `--border`, no blur, no shadow until scrolled (then a subtle `--shadow-card`). Height 64px.
- Dark text links (`--text`), hover = `--primary`. No pill-filled active state; use a 2px underline or bold.
- Move the four product links into a **"Shop travel" dropdown** (Flights, Umrah packages, Tour packages, Visa, Hotels, Activities) so the bar stays clean — the products are already in the hero tabs.
- Right side: currency (code + flag), "Support" (→ contact/arrange a call), "My trips" (→ dashboard), then **one** "Sign in" text button. Move "Sign up" into the sign-in page/menu like Expedia.
- Remove the theme toggle.
- Mobile: logo + currency + avatar/menu icon; menu opens as a full-height slide-in sheet, not an inline dropdown.

### 4.2 Footer (`site-footer.tsx`)

- Light grey (`--bg-subtle`) background, 4 link columns: **Company** (About, Careers, Blog), **Explore** (Flights, Umrah, Tours, Visa, Hotels), **Policies** (Terms, Privacy, Cookies, Refunds), **Help** (Contact, FAQ, Arrange a call).
- Below: payment/trust logos (Visa, Mastercard, IATA/ATOL if applicable), social icons, © line.
- Drop DaisyUI `footer`/`link` classes; use the token styles.

### 4.3 Floating widgets

- `FloatingReviewWidget` (645 lines) should look like Expedia's "Help" pill: small white pill bottom-right with icon + one word, opening a panel. Make sure it never overlaps the search button or cookie banner on mobile.

---

## 5. Home page

Proposed section order:

1. **Hero + universal search**
2. Promo banner (dark navy, e.g. "Umrah packages from PKR 2,49,000")
3. Trending destinations (photo cards)
4. Umrah packages (featured, 3–4 cards)
5. Tour packages / Things to do
6. Why book with us (4 trust points with icons)
7. Reviews (with aggregate rating)
8. Travel blog
9. Airline partners (logo strip — move to bottom, it's low-value above the fold)
10. Newsletter / app CTA

### 5.1 Hero

- Full-width real photo (Makkah skyline at dusk, or rotating destination), ~420px tall desktop / 280px mobile, with a light dark overlay (`linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.05))`) only for text contrast.
- Serif headline, white, centered, one line. E.g. *"Your journey, beautifully planned"*. Remove the eyebrow pill and the sub-paragraph.
- Search card overlaps the bottom of the photo by ~50% (`-mb-24` style), white, `--radius-lg`, `--shadow-raised`, 1px border.

### 5.2 Search card

- **Tab row**: Flights · Umrah · Tours · Hotels · Visa · Activities. Illustrated icon (40px) above label, active tab = `--primary` text + 3px underline; tabs separated from fields by a 1px divider. Reuse the existing `FlightSearchEngine`, `HotelSearch`, `PackageSearch`, `VisaSearch` components inside the tabs.
- **Fields row**: one pill-shaped container (`border`, `--radius-pill`, 56–64px tall) with segments separated by vertical dividers: `📍 Leaving from | 📍 Going to | 📅 Dates | 👤 Travellers, cabin` and a blue pill **Search** button inside the right end.
- Trip-type (Round trip / One way / Multi-city) and "Direct flights" become small text toggles above the row, not big tabs.
- Under the row: a single optional checkbox (e.g. "Add hotel to save") like Expedia's "Add a flight to Bundle & Save".
- Field popovers (calendar, pax, airport autocomplete): white, `--radius-lg`, `--shadow-raised`, 2-month calendar on desktop, full-screen sheet on mobile.
- Trending searches: move below the card as small grey chips.

### 5.3 Content sections

- **Section header pattern** (one component): h2 on the left, optional "See all →" link on the right, arrow buttons only on desktop.
- **Destination cards**: photo 4:3 with `--radius-lg`, text *under* the image (name, "Flights from PKR X"), not overlaid on a gradient. Hover = image zoom 1.03, no card lift.
- **Package cards**: image, gold "Umrah" or blue "Tour" badge on image, title (2 lines max), nights · hotel stars · inclusions as icon row, price block bottom-right: "from" small grey + price bold + "per person" small. Remove coloured top stripes.
- **Promo band**: full-width navy (`--navy`) rounded block with serif white headline, short subtext, and a white pill "Book now" button — directly mirrors the "Packages under $699" banner.
- **Reviews**: aggregate score at left ("4.8/5 · 1,240 reviews"), scrollable cards at right; consistent card style.

---

## 6. Search results pages (flights, hotels, packages, visa)

- **Sticky compact search bar** at top showing the current query as a summary pill; click to expand into the full search card.
- **Layout**: 280px filter sidebar left (collapsible groups, checkboxes with counts, price slider) + results right. On mobile, filters open as a bottom sheet from a "Filters" button; "Sort" as a second button.
- **Sort tabs** above results: Recommended · Cheapest · Fastest, each showing a price — Skyscanner/Expedia style.
- **Fare calendar strip** (`fare-calendar-strip.tsx`): keep, but restyle as a single row of equal-width day chips with price; selected = `--primary-soft` bg + `--primary` text.
- **Flight result card** (`flight-result-card.tsx`): airline logo + name left, times large (20px 600) with duration line and stops in the middle, price + "Select" button right. Expandable details in the same card. Replace DaisyUI `base-*`/`skeleton` with tokens and a shared Skeleton.
- Empty and error states: illustration + one sentence + action button, instead of `alert alert-error` with raw stack text shown to users (`flights/page.tsx` currently renders error details in a `<pre>`-like box).

---

## 7. Detail pages (Umrah, tours, destinations, visa, activities, blog post)

Common template:

1. Breadcrumb (small, grey).
2. Title (h1) + rating/location line + share/save icons.
3. **Photo gallery grid**: 1 large + 4 small (`grid-cols-4 grid-rows-2`), "See all photos" button → lightbox.
4. Two-column body: left = overview, itinerary (accordion by day), inclusions/exclusions (two lists with ✓ / ✕ icons), hotel info, FAQ, policies; right = **sticky booking card** with price, date/room selectors, primary CTA "Reserve" / "Enquire", and trust notes ("Free cancellation", "Pay later").
5. "You may also like" carousel at the bottom.

On mobile the booking card becomes a sticky bottom bar (price + CTA).

The Umrah configurator (`umrah-configurator.tsx`, ~800 lines) should follow a stepper pattern: Step 1 Dates & travellers → Step 2 Makkah hotel → Step 3 Madinah hotel → Step 4 Transport & extras → Summary, with a running price summary on the right.

---

## 8. Booking & payment flow

- Progress indicator at top: **Details → Payment → Confirmation**.
- Two columns: forms left, sticky **trip summary** right (flight/package, travellers, price breakdown, total).
- Form fields: 48px height, label above, `--radius-sm`, 1px `--border`, focus ring in `--primary`. Group passengers in collapsible cards ("Adult 1 — John Smith ✓").
- Payment page: payment method tiles with logos, clear secure badge ("🔒 Secure payment"), total repeated next to the Pay button.
- Inline validation messages under fields (red, 13px) instead of alerts.

---

## 9. Content & static pages

- **About, Careers, Contact, FAQ, policies** (`site-content-page.tsx`): replace the single big rounded box with a simple page — light-grey page header band (h1 + one line), then content at max-width 760px for readable line length. Policies get a sticky table of contents on desktop.
- **FAQ**: accordion with categories; search box on top.
- **Contact / Arrange a call**: two columns — contact methods (phone, WhatsApp, email, office address with map) left, form right.
- **Blog index**: featured post hero card + 3-column grid; category chips at top (already have `blog/category`). **Blog post**: 720px article column, large cover image, author/date row, table of contents, related posts.
- **Auth (signin/signup)**: centered 400px card on a plain or photo background, logo on top, social sign-in buttons first, then email. Remove the decorative serif unless it's used site-wide.

---

## 10. Dashboard & admin

- User dashboard: left nav (Trips, Enquiries, Profile, Payments), trip cards with status badges (Upcoming / Completed / Cancelled) using the semantic colours.
- Admin: lower priority visually, but switch to the same tokens so it doesn't look like another product. Keep a dense table style.

---

## 11. Mobile

- Test every page at 360px, 390px and 768px.
- Hero search becomes a **stacked card**: each field full-width row, Search button full-width at the bottom.
- Field popovers open as **full-screen sheets** with a header ("Where to?") and close button.
- Carousels: horizontal scroll with snap, show a peek of the next card (`w-[80%]`), hide arrow buttons.
- Tap targets ≥ 44px; bottom sticky CTAs on detail/booking pages.

---

## 12. Micro-interactions & polish

- Transitions 150–200ms ease-out; no bouncing or large translate effects.
- Skeletons must match the final layout exactly (same sizes as cards) — one shared `Skeleton` component.
- Hover: cards get a slightly stronger shadow; buttons darken; images zoom 1.03.
- Focus states visible on everything (`outline: 2px solid var(--primary); outline-offset: 2px`) — the current `input:focus { outline: none }` removes keyboard focus for non-ring elements.
- Stop the airline marquee for users with `prefers-reduced-motion`.

---

## 13. Accessibility & quality checklist

- Text contrast ≥ 4.5:1 (fixes the white nav text issue, `text-slate-400/500` on `bg-slate-50`).
- All images have meaningful `alt`; icon-only buttons have `aria-label` (most already do).
- Form labels connected to inputs; error messages linked via `aria-describedby`.
- Don't rely on colour alone for selected states (add check icon/underline).
- Lighthouse targets: Performance ≥ 90 on mobile (hero image via `next/image` with `priority`, font `display: swap`, remove unused font weights), Accessibility ≥ 95.

---

## 14. Implementation roadmap

| Phase | Scope | Effort |
|---|---|---|
| **0. Quick fixes** (½ day) | Nav link colour, remove theme toggle, remove `prefers-color-scheme` dark block, plain white body background, remove gradient scrollbars | S |
| **1. Foundation** (2–3 days) | Tokens in `globals.css`, `src/components/ui/*` primitives, typography scale, decide DaisyUI removal | M |
| **2. Header + footer** (1 day) | New header with "Shop travel" dropdown and mobile sheet; new footer | S |
| **3. Home hero + tabbed search** (3–4 days) | Photo hero, product tabs, pill field row, popovers, mobile sheet; refactor the 3 search CSS modules onto tokens | L |
| **4. Home sections** (2 days) | Section header component, destination/package/blog/review cards, promo band, trust row | M |
| **5. Results pages** (3 days) | Filter sidebar/sheet, sort tabs, result cards, empty/error states | L |
| **6. Detail + booking** (3–4 days) | Gallery, sticky booking card, Umrah stepper, booking progress & summary | L |
| **7. Content, auth, dashboard** (2 days) | Static page template, blog, auth card, dashboard | M |
| **8. QA** (1–2 days) | Mobile pass, accessibility, Lighthouse, cross-browser | M |

**Assets needed from the business:** high-resolution photos (Makkah, Madinah, top tour destinations, hotels), illustrated tab icons (or approval to commission/source a set), final logo in SVG, real hotel/package copy to replace placeholders.
