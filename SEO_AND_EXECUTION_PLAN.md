# SEO Strategy & Step-by-Step Execution Plan

**Companion to:** [PROJECT_REVIEW_AND_ROADMAP.md](PROJECT_REVIEW_AND_ROADMAP.md). Bug IDs such as C1 and H3 refer to that document.
**Date:** 26 October 2026
**Goal:** an elite travel website: fast, secure, accessible, and ranking for Umrah, flight, visa and tour searches, with an SEO-optimised blog that brings in leads.

This document has five parts:

- **A.** What "elite" means, as measurable targets
- **B.** SEO audit of the current code
- **C.** Final title and description for every page, plus templates for dynamic pages
- **D.** The blog SEO system: data model, editor, content plan, editorial rules
- **E.** Step-by-step execution plan covering the whole roadmap, SEO included

Every recommendation gives its reason.

> **Market assumption:** The copy below targets travellers departing from **Pakistan** (Lahore, Karachi, Islamabad), under the brand **Safar Umrah**. Both come from the code: `SITE_NAME`, PKR pricing and the departure cities in the mock data. If the client also targets UK or Gulf customers, keep the structure and change the place names. Claims marked **[verify]** must be confirmed by the client before publishing, because Google penalises unverifiable trust claims and so can consumer-protection law.

---

## Part A — What "elite" means (acceptance targets)

"Elite" has to be measurable, or it can't be signed off. These targets are the handover bar.

| Area | Target | Why this target |
|---|---|---|
| Core Web Vitals (mobile, field data) | LCP < 2.0 s, INP < 200 ms, CLS < 0.1 | Google uses field Core Web Vitals as a ranking signal. They also track conversion: slow pages lose mobile users before the search form even loads. |
| Lighthouse (mobile) | ≥ 95 Performance, 100 SEO, ≥ 95 Accessibility, 100 Best Practices on home, Umrah listing, package detail and blog post | A fast lab check that can run in CI on every PR, so regressions are caught before release. |
| Indexing | 100 % of public pages in the sitemap; 0 "Duplicate without canonical" and 0 "Crawled – not indexed" for money pages in Search Console | Pages that aren't indexed can't rank, however good the content is. |
| Structured data | 0 errors in Google's Rich Results Test for Article, BreadcrumbList, FAQPage, TouristTrip/Offer, Organization | Rich results (breadcrumbs, FAQs, prices) raise click-through rate from the same ranking position. |
| Security | No findings from section 2 of the review open; security headers (CSP, HSTS) in place | A hacked travel site is de-indexed or flagged "This site may harm your computer". Security is an SEO requirement. |
| Accessibility | WCAG 2.2 AA on core flows | Older pilgrims are a core audience. It is also a legal expectation in the UK/EU if those markets are targeted. |
| Content | 12 cornerstone articles live at launch, then 4–8 per month | Topical authority is built from clusters of articles, not one-off posts (see Part D). |

---

## Part B — SEO audit of the current code

### B.1 What's already good (keep it)

- [src/lib/seo.ts](src/lib/seo.ts) has a central `buildMetadata()` that sets canonical, Open Graph, Twitter and robots tags, and trims descriptions to 160 characters.
- JSON-LD helpers exist for WebPage, Article, Breadcrumb, FAQ, ItemList, Organization (as `TravelAgency`) and WebSite. Tour and visa detail pages already emit `TouristTrip` and `Offer`.
- [src/app/sitemap.ts](src/app/sitemap.ts) and [src/app/robots.ts](src/app/robots.ts) exist. Admin, booking and payment URLs are disallowed.
- Blog category filter pages are `noindex`. Not-found states are `noindex` on most dynamic routes.
- There is a title template, `%s | Safar Umrah`, and dynamic OG images (`opengraph-image.tsx`, `twitter-image.tsx`).

**Why keep it:** the foundation is sound. The work below makes it stronger; nothing needs rewriting.

### B.2 Problems found

| # | Problem | Evidence | Fix | Why it matters |
|---|---|---|---|---|
| S1 | **Service page titles are generic** | `"Umrah Packages"`, `"Hotels"`, `"Visa Guidance"`, `"Tour Packages"` in each `page.tsx` | Use the titles in Part C | Titles are the strongest on-page ranking signal and the headline in search results. "Hotels" matches no real search query. |
| S2 | **The blog has no SEO fields.** The post title (up to 200 characters) is used as the `<title>`, and the excerpt as the description | [blog/[slug]/page.tsx:56-65](src/app/blog/[slug]/page.tsx#L56-L65), [validations/blog.ts](src/lib/validations/blog.ts) | Add `seoTitle`, `metaDescription`, `focusKeyword`, `canonicalUrl` and `noIndex` (D.1) | The on-page headline and the search-result title do different jobs. Long titles get cut off in results. |
| S3 | **The blog author is the developer agency**, not a person | `author @default("AIM Digital")` in [schema.prisma](prisma/schema.prisma); `createArticleSchema` sets the author as an Organization | Add an `Author` model with real people, bios and author pages (D.1) | Google's E-E-A-T guidance (experience, expertise, authoritativeness, trust) values identifiable expert authors. Religious and travel-money content is close to "Your Money or Your Life" territory, where this matters most. Your agency's name also shouldn't be on the client's content. |
| S4 | **Demo blog posts are served in production** when no real posts are published | [lib/blog.ts:75](src/lib/blog.ts#L75): `if (posts.length === 0) return getDummyPosts()` | Only fall back in development | Placeholder content gets indexed as thin or duplicate content, and real posts then have to overcome a poor first impression with Google. |
| S5 | **Fetching one post loads every post** | [lib/blog.ts:87](src/lib/blog.ts#L87): `getPublishedBlogPosts()` then `.find()` | Query by slug with `findUnique`, cached with `"use cache"` and `cacheTag("blog")` | With 200 posts, each article page loads all their content. A slow time to first byte hurts LCP and crawl budget. |
| S6 | **Blog content is raw HTML in a monospace textarea**, and the content CSS styles `h1` | [admin/blog/page.tsx:330](src/app/admin/blog/page.tsx#L330), [blog/[slug]/page.tsx:190](src/app/blog/[slug]/page.tsx#L190) | Rich-text editor limited to H2–H4, lists, links, images with required alt text, and FAQ blocks; sanitise on save (C2) | Non-technical editors produce broken markup and several H1s, which muddles the page's topic. Raw HTML is also the XSS hole (C2). |
| S7 | **Blog category pages are `noindex` query-string pages** | [blog/page.tsx:63-76](src/app/blog/page.tsx#L63-L76): `/blog?category=umrah` | Move them to indexable `/blog/category/[slug]` routes, each with a unique intro paragraph and its own title (Part C) | Category hubs such as "Umrah guides" can rank for broad terms and pass internal link equity to articles. Query-string pages without unique content can't. |
| S8 | **No pagination, related posts or internal links** on the blog | [blog/page.tsx](src/app/blog/page.tsx) renders every post | `/blog/page/[n]`, a "Related articles" block, and contextual links to packages | Internal links are how Google discovers pages and understands which ones matter most. They also turn readers into leads. |
| S9 | **The sitemap is missing money pages** | [sitemap.ts](src/app/sitemap.ts) lists static pages, blog, destinations and activities, but not `/umrah-packages/[slug]`, `/tour-packages/[id]` or `/visa/[slug]` | Add them; use real `updatedAt` values | The pages most likely to convert are the ones Google is least sure exist. |
| S10 | **`lastModified: now` on every static route** | [sitemap.ts:37](src/app/sitemap.ts#L37) | Use each page's real content-update time (e.g. the `site_pages` setting's `updatedAt`), or omit it | When `lastmod` always says "now", Google learns to ignore it, including for posts that really did change. |
| S11 | **The Umrah package detail page has no structured data** and its not-found state isn't `noindex` | [umrah-packages/[slug]/page.tsx:104-115](src/app/umrah-packages/[slug]/page.tsx#L104-L115) | Add `TouristTrip` + `Offer` (price, currency, availability, validFrom) and `BreadcrumbList`; `noIndex` when not found | Umrah packages are the main product. Price-rich results increase clicks, and an indexed "Package not found" page is a soft 404. |
| S12 | **The Organization schema is nearly empty** | [page.tsx](src/app/page.tsx) calls `createOrganizationSchema()` with no arguments | Add logo, phone, email, `sameAs` (social profiles), and one `TravelAgency` per branch with address and geo coordinates | Feeds Google's Knowledge Panel and local results ("Umrah travel agent in Lahore"). Branch data already exists in the `Branch` table. |
| S13 | **Auth pages inherit the homepage canonical** | The root [layout.tsx](src/app/layout.tsx) sets `alternates.canonical: "/"`; `signin`, `signup` and `auth/redirect` are client pages with no metadata; `dashboard` sets only a title | Add metadata with `noIndex` (move the client component into a child file so the page can export metadata) | Every non-overriding page tells Google "I am the homepage", and login pages can appear in search results. |
| S14 | **The homepage renders its content in the browser** | Review section 4.1 | Server Components with caching | Googlebot does render JavaScript, but later and less reliably. Content in the first HTML response ranks faster and more consistently. |
| S15 | **Brand names are inconsistent** | `SITE_NAME = "Safar Umrah"`; the email says "Confirm your Safar account"; the blog author is "AIM Digital" | Confirm the official brand with the client; use one constant everywhere | Consistent naming across the site, schema and Google Business Profile is how Google connects them into one entity. |
| S16 | **Meta keywords are hand-maintained** on every page | `keywords: [...]` throughout | Leave them in, but don't spend time on them | Google ignores meta keywords. Effort is better spent on titles, content and links. |
| S17 | **No search-engine verification or webmaster setup** | Nothing found in metadata | Add Google Search Console and Bing Webmaster verification via `metadata.verification`; submit the sitemap | Without Search Console you can't see indexing errors, queries or Core Web Vitals field data, so the Part A targets can't be measured. |
| S18 | **Raw `<img>` tags and missing size hints** | 12 `<img>` tags (review section 4.7) | `next/image` with `alt`, `sizes`, and `priority` on the hero image | Image weight is the biggest LCP factor on travel pages. Alt text helps image search and accessibility. |

---

## Part C — Titles and descriptions for every page

**Rules applied.**
- Full title ≤ 60 characters including the ` | Safar Umrah` suffix (14 characters). Descriptions are 120–160 characters. All lengths were checked with a script.
- The main keyword comes first in the title, and the description ends with a call to action.
- The homepage uses `title.absolute`, so the suffix isn't added twice.

**Why:** Google cuts titles off at roughly 580 px (about 60 characters) and descriptions at about 160 characters. A truncated title loses its message, and a description with a clear call to action earns more clicks.

**Years in titles.** Generate the year from a helper (`seasonYear()`) and never hard-code it. *Why:* "Umrah Packages 2026" left unchanged in 2027 looks stale and loses clicks.

### C.1 Static and service pages

| Path | Title (page part; the suffix is added by the template) | Meta description | Index? |
|---|---|---|---|
| `/` | **absolute:** Safar Umrah \| Umrah Packages, Flights & Visas from Pakistan | Book Umrah packages, cheap flights and visa services from Pakistan. Compare hotels near the Haram, pay in instalments or at a branch, and get expert support. | ✅ |
| `/umrah-packages` | Umrah Packages from Pakistan – 2026 Prices | Compare 7 to 28-night Umrah packages from Lahore, Karachi and Islamabad. See hotel distance to the Haram, inclusions and per-person prices. Book online. | ✅ |
| `/flights` | Cheap Flights from Pakistan – Compare & Book | Search and compare flights from Lahore, Karachi and Islamabad to Jeddah, Madinah, Dubai, London and beyond. Live fares, flexible payment, no hidden fees. | ✅ (search results with query params: ❌, already handled) |
| `/hotels` | Makkah & Madinah Hotels Near the Haram | Find Makkah and Madinah hotels by walking distance to the Haram and Masjid an-Nabawi. Compare star ratings and room sharing, then request the best rate. | ✅ once real data exists (M3); ❌ until then |
| `/visa` | Visa Services – UAE, Malaysia, Saudi & More | Get help with UAE, Malaysia and Saudi visas from Pakistan. Check requirements, documents, processing times and fees, then apply with expert support. | ✅ |
| `/tour-packages` | Tour Packages – Dubai, Turkey, Bali & More | Explore all-inclusive holiday packages to Dubai, Istanbul, Bali, the Maldives and Cairo. Flights, hotels and tours in one price. Customise and book today. | ✅ once real data exists (M3) |
| `/activities` | Things to Do – Tours & Activities | Discover top-rated tours, attractions and experiences in Dubai, Istanbul, Makkah, Madinah and more. Compare prices and reviews before you travel. | ✅ |
| `/blog` | Umrah & Travel Blog – Guides, Tips and News | Step-by-step Umrah guides, visa updates, packing lists and destination tips from our travel experts. Plan your pilgrimage or holiday with confidence. | ✅ |
| `/blog/category/umrah` | Umrah Guides – Rituals, Duas & Planning Tips | Practical Umrah guides covering ihram, tawaf, sa'i, duas, best times to travel and costs from Pakistan. Written and reviewed by experienced Umrah advisers. | ✅ |
| `/blog/category/flights` | Flight Tips – Fares, Baggage & Booking Advice | When to book, how baggage rules work and how to find cheaper fares from Pakistan. Straightforward flight advice from our ticketing team. | ✅ |
| `/blog/category/destinations` | Destination Guides – Where to Go and When | In-depth guides to Dubai, Istanbul, Bali, Cairo and more: best time to visit, costs, visas and itineraries for travellers from Pakistan. | ✅ |
| `/about-us` | About Us – Trusted Umrah & Travel Agency | Meet the team behind Safar Umrah, a licensed **[verify]** travel agency with branches across Pakistan **[verify]**, helping pilgrims and families travel with confidence. | ✅ |
| `/contact-us` | Contact Us – Call, WhatsApp or Visit a Branch | Speak to a travel adviser by phone or WhatsApp, email us, or visit a branch. See opening hours and addresses for every Safar Umrah office. | ✅ |
| `/arrange-a-call` | Request a Callback from a Travel Expert | Leave your number and a Safar Umrah adviser will call you back to plan your Umrah, flights or holiday. Free advice with no obligation to book. | ✅ |
| `/faq` | Umrah & Travel FAQs – Visas, Payments, Refunds | Answers to common questions about Umrah visas, payment options, cancellations, baggage, document requirements and what to expect when you book. | ✅ |
| `/careers` | Careers – Join Our Travel Team | Explore open roles at Safar Umrah, from travel consultants to operations. Help pilgrims and travellers plan journeys that matter. | ✅ |
| `/terms-conditions` | Terms & Conditions | Booking terms for flights, Umrah packages, visas and tours with Safar Umrah, including payments, changes, liability and passenger responsibilities. | ✅ |
| `/privacy-policy` | Privacy Policy | How Safar Umrah collects, uses and protects your personal data, including passport details, payment information and marketing preferences. | ✅ |
| `/refund-policy` | Refund & Cancellation Policy | Cancellation charges, refund timelines and airline or hotel rules that apply to Safar Umrah flights, Umrah packages, visas and tours. | ✅ |
| `/cookie-policy` | Cookie Policy | Which cookies Safar Umrah uses for analytics, preferences and essential site functions, and how to manage or withdraw your consent. | ✅ |
| `/signin`, `/signup`, `/auth/*`, `/dashboard`, `/flights/booking`, `/flights/payment` | Sign In / Create Account / My Dashboard / … | Short functional text | ❌ `noindex, follow` |

**Where these live.**
- About, contact, FAQ, careers and the policy pages already read their title and intro from `site_pages` settings ([site-pages-settings.ts](src/lib/admin-settings/site-pages-settings.ts)). Add `seoTitle` and `metaDescription` fields there, defaulting to the values above, so the client can edit them in the admin area.
- All other pages hard-code the values in a single `src/lib/seo-copy.ts` map.

**Why:** one source of truth that the client can edit without a deployment, while the defaults stay SEO-correct.

### C.2 Templates for dynamic pages

These are rules applied to each record's fields. Each has an admin override field (`seoTitle`, `metaDescription`) that takes priority when filled.

| Route | Title template | Description template | Structured data |
|---|---|---|---|
| `/umrah-packages/[slug]` | `{title} – {makkahNights+madinahNights} Nights from {departureCity}` | `{totalNights}-night Umrah from {departureCity}: {makkahNights} nights Makkah, {madinahNights} nights Madinah. {hotelSummary}. From {currency} {basePrice} per person. Departs {startDate:d MMM}.` | `TouristTrip` + `Offer` (`price`, `priceCurrency`, `availability`: InStock or SoldOut from `seatsAvailable`, `validFrom`) + `BreadcrumbList` |
| `/tour-packages/[slug]` | `{title} – {durationDays}-Day {destination} Package` | `{durationDays} days in {destination} from {departureCity}. {first 2 highlights}. From {currency} {basePrice} per person, flights and hotel included **[verify per package]**.` | Already has `TouristTrip`/`Offer`; add `image` and `itinerary` |
| `/visa/[slug]` | `{country} Visa from Pakistan – Requirements & Fees` | `Apply for a {country} {visaType} visa from Pakistan. Document checklist, processing time ({processingDays} days), fees and expert help with your application.` | `Service` + `Offer` + `FAQPage` (built from that visa's own FAQs) |
| `/destinations/[slug]` | `{city} Travel Guide – Best Time, Tips & Flights` | `{tagline}. Best time to visit {city}, ideal stay ({idealStay}), local currency and language, and flights from Pakistan from {fare}.` | `TouristDestination` + `BreadcrumbList` |
| `/activities/[slug]` | `{title} in {city} – Tickets & Prices` | `{description, first sentence}. Rated {reviews}/5 by {reviewCount} travellers. From {cost}. Check availability and book.` | `TouristAttraction` + `AggregateRating` (**only** if the reviews are first-party and genuine) |
| `/blog/[slug]` | `seoTitle ?? title` (ensure ≤ 46 characters plus suffix) | `metaDescription ?? excerpt` | `BlogPosting` with an author `Person`, `dateModified`, `image`; `FAQPage` when the post contains an FAQ block |
| `/blog/category/[slug]` | From the category record | From the category record | `CollectionPage` + `ItemList` |
| `/authors/[slug]` | `{name} – {role} at Safar Umrah` | `{bio, first 155 characters}` | `ProfilePage` + `Person` |

**Why templates plus overrides:** every new package gets good metadata automatically, which matters because the client will add records without thinking about SEO. Editors can still hand-tune high-value pages.

**Two related changes:**
- **Activities should get slugs.** Today they use database IDs (`/activities/cm9x…`). *Why:* readable URLs carry keywords and get clicked more. Redirect the old ID URLs with 308s to keep any existing links working.
- **Never mark up fake ratings.** `Activity.reviews` defaults to `4.5`. *Why:* self-assigned `AggregateRating` breaks Google's review-snippet policy and can lead to a manual action.

---

## Part D — Blog SEO system

### D.1 Data model changes

```prisma
model Author {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  role        String            // e.g. "Senior Umrah Adviser"
  bio         String   @db.Text
  photoUrl    String?
  credentials String?           // e.g. "12 years guiding Umrah groups"
  sameAs      Json     @default("[]")  // LinkedIn etc.
  posts       BlogPost[] @relation("author")
  reviewed    BlogPost[] @relation("reviewer")
}

model BlogCategory {
  id              String @id @default(cuid())
  slug            String @unique
  name            String
  intro           String @db.Text   // unique 100–200 words shown at the top of the hub page
  seoTitle        String?
  metaDescription String?
  posts           BlogPost[]
}

// BlogPost: add
//   seoTitle String?  metaDescription String?  focusKeyword String?
//   canonicalUrl String?  noIndex Boolean @default(false)
//   authorId → Author   reviewedById → Author?   categoryId → BlogCategory
//   faq Json?  readingMinutes Int?  contentUpdatedAt DateTime?
//   @@index([status, publishedAt])
```

**Why each part:**
- **`Author` and `reviewedBy`** serve E-E-A-T. Religious guidance should show "Reviewed by [scholar or senior adviser]", the same way medical sites show "Medically reviewed by".
- **`BlogCategory` as a table** gives hub pages their own copy and metadata.
- **`contentUpdatedAt`** is separate from `updatedAt`, so fixing a typo doesn't count as a content refresh in the sitemap or the "Updated" date.
- **`faq`** generates `FAQPage` schema from structured data, which is more reliable than parsing HTML.

### D.2 Editor and admin experience

1. **Rich-text editor (Tiptap)** in place of the raw-HTML textarea. It allows H2–H4, lists, quotes, tables, links, images (alt text required), a "Package card" embed, and an FAQ block.
   *Why:* editors can't break the heading structure or insert scripts. Output is sanitised on save (C2).
2. **SEO panel next to the editor:**
   - live search-result preview with character counters (title ≤ 60, description 120–160)
   - focus-keyword checks: in title, first 100 words, one H2 and the slug
   - word count, internal-link count (warn below 3), alt-text check, and a canonical field
   *Why:* this puts an SEO plugin's checks into the editor the client actually uses, so quality doesn't depend on the editor's memory.
3. **Slug lock after publishing.** Changing a published slug automatically creates a 308 redirect (new `Redirect` table, applied in `proxy.ts`).
   *Why:* changing a URL without a redirect loses all the ranking and backlinks the page had built.
4. **Scheduled publishing** via `publishedAt` in the future, plus a preview link for drafts.
   *Why:* lets the client publish consistently, e.g. a Ramadan series that goes live on schedule.

### D.3 Page template for a blog post

From top to bottom:

1. Breadcrumb
2. H1 (the post title)
3. Author and reviewer byline with photos, linked to their author pages
4. "Updated {date}" and reading time
5. Hero image (`next/image`, `priority`)
6. Table of contents (generated from the H2s)
7. Article body
8. Inline "Related package" card
9. FAQ block
10. Author bio box
11. Three related posts (same category, then shared tags)
12. A call to action: WhatsApp, request a callback, or browse packages

**Why this order:**
- The byline and update date are trust signals readers see immediately.
- The table of contents earns "jump to" links in search results.
- Package cards and the call to action turn readers into leads; without them the blog brings traffic but no revenue.
- Related posts keep crawlers and readers moving through the cluster.

**Rendering:**
- Generate known slugs at build time with `generateStaticParams`.
- Cache with `"use cache"` and `cacheTag("blog", "blog:{slug}")`.
- Call `revalidateTag` when a post is saved.

*Why:* static-speed pages that update the moment an editor publishes.

### D.4 Content strategy: topic clusters

Structure the content as **pillar pages** (broad guides) supported by **cluster articles** (specific questions), all interlinked and all linking to the matching product page.

*Why:* Google ranks sites it sees as authorities on a topic. A cluster on Umrah gives that signal far better than scattered one-off posts, and the client's product range covers these topics directly.

**Cluster 1 — Umrah (priority: the core product)**

| Slug | Title (≤ 60 incl. suffix) | Meta description | Links to |
|---|---|---|---|
| `how-to-perform-umrah-step-by-step` **(pillar)** | How to Perform Umrah: Step-by-Step Guide | A clear step-by-step guide to performing Umrah: ihram, niyyah, tawaf, sa'i and halq, with the duas for each stage and common mistakes to avoid. | All Umrah posts, `/umrah-packages` |
| `umrah-cost-from-pakistan` | Umrah Cost from Pakistan 2026: Full Breakdown | How much does Umrah cost from Pakistan? Flights, visa, hotels, transport and food explained by package tier, with tips to cut costs without losing comfort. | `/umrah-packages`, `/flights` |
| `umrah-visa-requirements-pakistan` | Umrah Visa from Pakistan: Requirements & Steps | Documents, eligibility, processing time and fees for the Saudi Umrah visa from Pakistan, plus how the e-visa and tourist visa options compare. | `/visa` |
| `best-time-for-umrah` | Best Time for Umrah: Seasons, Crowds & Prices | Compare Ramadan, winter, summer and school-holiday Umrah: crowd levels, weather in Makkah and Madinah, and how package prices change through the year. | `/umrah-packages` |
| `ramadan-umrah-guide` | Ramadan Umrah Guide: Booking, Costs & Tips | Planning Umrah in Ramadan? When to book, what last-ten-nights packages cost, how to manage fasting and crowds, and which hotels fill first. | Ramadan packages |
| `umrah-packing-list` | Umrah Packing List: What to Take (and Leave) | A practical Umrah packing checklist for men and women: ihram, documents, medicines, footwear and the items that are not allowed in the Haram. | Pillar |
| `makkah-hotels-near-haram` | Best Makkah Hotels Near the Haram by Budget | Makkah hotels compared by walking distance to the Haram, star rating and price, from budget stays to Clock Tower suites, for every Umrah budget. | `/hotels`, `/umrah-packages` |
| `umrah-with-family-and-elderly` | Umrah with Family, Children & Elderly Parents | How to plan a comfortable family Umrah: wheelchairs, room sharing, choosing close hotels, rest days and travel tips for children and elderly pilgrims. | Family packages |
| `umrah-for-women` | Umrah for Women: Mahram Rules & Practical Tips | Saudi rules for women performing Umrah, including the mahram requirement, ihram dress, menstruation guidance, and safety and comfort tips. | Pillar |
| `ziyarat-places-in-madinah` | Ziyarat in Madinah: Places to Visit & History | The key ziyarat sites in Madinah, including Masjid Quba, Uhud and Masjid al-Qiblatayn, with history, visiting times and how to include them in your trip. | `/umrah-packages` |

**Cluster 2 — Flights and visas (supports the other services)**

| Slug | Title | Meta description | Links to |
|---|---|---|---|
| `cheap-flights-lahore-to-jeddah` | Cheap Flights Lahore to Jeddah: When to Book | When to book Lahore to Jeddah flights, which airlines fly direct, baggage allowances including Zamzam, and how fares change around Ramadan. | `/flights` (pre-filled LHE→JED) |
| `dubai-visa-for-pakistanis` | Dubai Visa for Pakistanis: Documents & Fees | Everything Pakistani travellers need for a UAE tourist visa: document checklist, bank statement rules, processing time, fees and common rejection reasons. | `/visa/uae`, Dubai tour |

**Later clusters:** destination guides (Dubai, Istanbul, Bali, Baku, Malaysia), each paired with a tour package.

**Facts must be checked against official sources** before publishing: Saudi visa rules, mahram rules and fees change. *Why:* outdated rules in a visa article cause real harm to customers and lose trust and rankings.

### D.5 Editorial rules (give these to the client's writers)

1. **One search intent per article.** Choose the focus keyword before writing, and check that no other post targets it. *Why:* two posts on one keyword compete with each other ("cannibalisation").
2. **Answer the question in the first 100 words**, then go into depth. *Why:* this is what wins featured snippets and AI-overview citations.
3. **Original experience.** Include adviser tips, real photos from the client's groups, and real prices from current packages. *Why:* Google's helpful-content system rewards first-hand experience, and it is the one thing competitors can't copy.
4. **No mass-produced AI content.** AI may help with drafting, but every article needs human fact-checking, original detail and a named reviewer. *Why:* Google's "scaled content abuse" policy targets sites that publish large volumes of unoriginal content, and recoveries take months.
5. **Religious content is reviewed** by a qualified person, named in the byline. *Why:* accuracy and trust. Errors in ritual guidance damage the brand far more than any ranking gain helps.
6. **At least 3 internal links** (pillar, sibling article, product page) and at least 1 authoritative external source (e.g. the official Saudi visa portal). *Why:* builds the cluster and signals trustworthiness.
7. **Refresh cornerstone posts every 6 months**, and before Ramadan and Hajj season. Update `contentUpdatedAt` only for real changes. *Why:* fresh content matters for time-sensitive queries such as costs and visas.
8. **Images:** WebP or AVIF, ≤ 200 KB, a descriptive filename, and alt text that describes the image (not a list of keywords).

---

## Part E — Step-by-step execution plan

**How to work through this.**
- One branch and one PR per step. CI must pass before merging.
- Each step lists its **files**, its **result**, and a **done when** check you can verify.
- Sprints are sized for one full-stack developer, at about one sprint per week. Adjust for your team.
- SEO and design work (marked 🎨) can run in parallel with a designer or content writer.

**Why this order:** safety first, then the foundation everything else needs (service layer, tests), then speed and SEO, then the CRM, then features. Each sprint ends with something demonstrable to the client.

### Sprint 0 — Preparation (½ day)

| Step | Action | Done when |
|---|---|---|
| 0.1 | Commit or stash the current uncommitted port-change edits (`3000` → `3004` in 10 files); create a `develop` branch | `git status` is clean |
| 0.2 | Delete `.next-backup-20261023/` (it is root-owned: `sudo rm -rf`), `blog.out` and `test-blog.js`; add `.next-backup-*` to `.gitignore` | `npx eslint .` reports only `src` issues |
| 0.3 | Fix `.dockerignore` (add `.env*`). **Rotate all secrets** if any image was pushed (C4) | `docker build` then `docker run … ls -a` shows no `.env` |
| 0.4 | Add GitHub Actions CI: `tsc --noEmit`, `eslint src`, `jest`, `next build`, `prisma migrate diff --exit-code` | A PR shows a green check |
| 0.5 | Ask the client the questions in review section 8, plus: official brand name, logo, social profiles, branch details, licence numbers (for the **[verify]** items) | Answers recorded in `docs/decisions.md` |

### Sprint 1 — Stop-ship security fixes (review Phase 0)

| Step | Action | Files | Done when |
|---|---|---|---|
| 1.1 | Create `requireAdmin()` / `requireRole()` that re-read the role from the DB | `src/lib/auth/guards.ts` (new) | Unit-tested |
| 1.2 | Guard every mutating handler (C1). Move admin writes under `/api/admin/*` | packages, destinations, activities, blog, reviews routes | Route tests: anonymous request returns 401, customer returns 403, admin returns 200 |
| 1.3 | Public queries filter by `PUBLISHED`/`isPublished`; remove `?all=true` from public pages (H1) | `umrah-packages/page.tsx`, `packages/[id]`, `reviews`, `blog`, `activities`, `destinations` routes | A draft package returns 404 publicly |
| 1.4 | Review POST ignores client-supplied `isPublished`/`isVerified` | `api/reviews/route.ts` | Test passes |
| 1.5 | Sanitise blog HTML on save and on render; escape `<` in `StructuredData` (C2) | `lib/sanitize.ts` (new), `blog/[slug]/page.tsx`, `structured-data.tsx` | An XSS payload test renders inert |
| 1.6 | Re-check roles in the JWT callback every 5 minutes (H6); delete `/api/auth/token` (M5) | `auth-provider.ts` | A demoted admin loses access within 5 minutes |
| 1.7 | Mock flight fallback behind `ENABLE_MOCK_FLIGHTS` (off in production); show "Request a quote" when live search fails; hide raw provider errors (H2) | `search-service.ts`, `flights-results-panel.tsx` | In production a Sabre failure shows the quote form |
| 1.8 | Default unimplemented gateways to `false`; hide them in the UI (H4) | `schema.prisma` migration, `payment-page-client.tsx` | Only working payment methods appear |

**Client demo after Sprint 1:** the site is safe to show.

### Sprint 2 — Service layer and booking integrity (review Phase 1, part 1)

| Step | Action | Done when |
|---|---|---|
| 2.1 | Create `src/lib/services/{packages,content,blog,bookings,leads}.ts`. Move the Prisma calls and the `PackageRow` mapping there | Routes and pages import services; the duplicate mapping is deleted |
| 2.2 | Remove HTTP self-fetches from server pages (M1) | No `headers().get("host")` left in `src/app` |
| 2.3 | Server-side offer store (Redis/Upstash, 20-minute TTL). Booking takes an `offerId`, re-prices on the server, and computes service charges from `PaymentSetting` (C3) | A tampered price is rejected in a test |
| 2.4 | Contact/account separation; normalise emails; link a guest booking only after verification (H3) | Registering after a guest booking works |
| 2.5 | Password reset and resend-verification flows (M2, M7); return the same response whether or not an email is registered | `/forgot-password` works end-to-end |
| 2.6 | Catch Prisma errors and map them to stable error codes; log details server-side with a request ID (M4) | No `err.message` returned to clients |

### Sprint 3 — Booking lifecycle, data model and protection (review Phase 1, part 2)

| Step | Action | Done when |
|---|---|---|
| 3.1 | Migration: the new `BookingStatus` lifecycle, `BookingEvent` audit table, indexes from review 5.3, Activity foreign key (M8), activity `slug` | `prisma migrate dev` is clean; drift check passes |
| 3.2 | Admin status actions with allowed transitions only; cursor pagination (H5) | Admin can take a booking from NEW to CLOSED; the audit trail is visible |
| 3.3 | Rate limiting (Upstash) on auth, search, bookings, reviews and chatbot; Turnstile on public forms (H7) | Load test: the 21st request per minute returns 429 |
| 3.4 | Circuit breaker matches error codes, not substrings (M9); verify DB TLS with the CA certificate (M6) | Tests pass |
| 3.5 | `/booking/[reference]` confirmation page and confirmation email in place of `alert()` | Booking ends on the confirmation page; the email arrives |
| 3.6 | Fix the 13 `set-state-in-effect` lint errors; production multi-stage Dockerfile (L4) | `eslint src` reports 0 errors |

### Sprint 4 — SEO foundation (Parts B and C)

| Step | Action | Files | Done when |
|---|---|---|---|
| 4.1 | `src/lib/seo-copy.ts` holding every static title and description from C.1; `seasonYear()` helper; homepage uses `title.absolute` | `seo-copy.ts` (new), each `page.tsx` | All titles ≤ 60 and descriptions 120–160 (a unit test checks the lengths) |
| 4.2 | Add `seoTitle` and `metaDescription` to `site_pages` settings and the admin form | `site-pages-settings.ts`, `admin/site-pages/page.tsx` | The client can edit the about-us title in admin |
| 4.3 | Add `seoTitle` and `metaDescription` columns to UmrahPackage, TourPackage, Destination and Activity; apply the C.2 templates with overrides | migration, `lib/seo-templates.ts` (new) | Each detail page has a unique title (crawl check) |
| 4.4 | Structured data: Umrah `TouristTrip`/`Offer`/Breadcrumb (S11); a full Organization record plus one `TravelAgency` per branch (S12) | `seo.ts`, `umrah-packages/[slug]/page.tsx`, `page.tsx` | Rich Results Test: 0 errors |
| 4.5 | `noindex` metadata on signin, signup, auth and dashboard (S13); `noindex` on Umrah not-found | Split those pages into a server `page.tsx` plus a client component | View-source shows `noindex` |
| 4.6 | Sitemap: add Umrah, tour and visa detail pages; use real `lastModified`; use `generateSitemaps` if over 5,000 URLs (S9, S10) | `sitemap.ts` | Sitemap validates; Search Console shows 0 errors |
| 4.7 | `metadata.verification` for Google and Bing; submit the sitemap; link GA4 to Search Console (S17) | `layout.tsx` | Search Console verified |
| 4.8 | Security headers: CSP (allowing GTM/GA4), HSTS, `X-Content-Type-Options`, `Referrer-Policy` | `next.config.ts` `headers()` | securityheaders.com rates A |

### Sprint 5 — Blog SEO system (Part D)

| Step | Action | Done when |
|---|---|---|
| 5.1 | Migration: `Author`, `BlogCategory`, the new `BlogPost` fields, `Redirect` table (D.1); move the existing `author` and `category` strings into the new tables | Existing posts keep working |
| 5.2 | Remove dummy-post fallbacks in production (S4); query by slug (S5); cache with `"use cache"` and `cacheTag`, plus `revalidateTag` on save | Post page TTFB < 200 ms from cache |
| 5.3 | Routes: `/blog/category/[slug]`, `/blog/page/[n]`, `/authors/[slug]`. 308-redirect `/blog?category=x` to `/blog/category/x` (S7, S8) | Old URLs redirect; new ones are indexable |
| 5.4 | Post template from D.3 (TOC, byline, reviewer, related posts, package card, FAQ, call to action). `BlogPosting` schema with an author `Person` | Rich Results Test passes for Article and FAQ |
| 5.5 | Tiptap editor with an SEO panel, search preview, checks, slug lock and automatic redirects, scheduled publishing (D.2) | An editor can publish without touching HTML |
| 5.6 🎨 | Content: write and review the 12 articles in D.4 with real photos and package links | 12 posts live; each has ≥ 3 internal links |

### Sprint 6 — Performance (review Phase 2)

| Step | Action | Done when |
|---|---|---|
| 6.1 | Enable `cacheComponents`; convert the homepage sections to cached Server Components with small client carousels (review 4.1) | Homepage HTML contains destinations, blog and reviews text |
| 6.2 | `after()` for search logging; flight-search cache; Sabre token in-flight dedupe (review 4.3–4.5) | p95 time for a repeated search < 300 ms |
| 6.3 | Load `FloatingReviewWidget` with `next/dynamic` on interaction, and not on admin pages; split `flight-search.tsx` (review 4.6) | Homepage JS reduced by ≥ 30 % (compare with `next build` output) |
| 6.4 | Convert all `<img>` to `next/image`; `priority` on the hero image; AVIF/WebP (S18) | LCP < 2.0 s in Lighthouse mobile |
| 6.5 | Presigned R2 uploads (review 4.8) | A 40 MB upload doesn't touch the Next.js server |
| 6.6 | Lighthouse CI in the pipeline, with a budget per Part A | PR fails if Performance drops below 90 |

### Sprint 7 — Design system and conversion (review Phase 4) 🎨

This needs the brand palette and logo from step 0.5, and a Figma file from the designer, which can be produced during Sprints 1–6.

| Step | Action | Done when |
|---|---|---|
| 7.1 | Tailwind 4 `@theme` design tokens; replace DaisyUI `corporate`; use CSS logical properties for future RTL | No stock DaisyUI theme left in use |
| 7.2 | Editorial layouts for home, Umrah listing and detail, destination and blog | Client signs off on design |
| 7.3 | Mobile booking flow: sticky price summary, bottom-sheet pickers | Usability test: 5 users complete a booking without help |
| 7.4 | Trust signals: licence numbers, verified reviews, branch map, team photos | **[verify]** items confirmed |
| 7.5 | WCAG 2.2 AA pass: one `<main>` (L1), focus states, labels, contrast | axe-core finds 0 serious issues |
| 7.6 | Differentiators, in this order: WhatsApp capture, booking tracker `/track/[ref]`, hotel distance to the Haram, document upload, Hijri dates (review 7.2) | Each feature demoed |

### Sprint 8 — CRM-ready layer (review Phase 3)

| Step | Action | Done when |
|---|---|---|
| 8.1 | `Lead` model with UTM/gclid capture (stored from the landing URL in a first-party cookie) and `marketingConsent` | A lead from an ad shows its campaign |
| 8.2 | `OutboxEvent` table written in the same transaction as bookings and leads | A test: no booking exists without an outbox row |
| 8.3 | pg-boss worker with retry, backoff and dead-letter; admin "Integration log" page | A failed delivery retries, then appears in the log |
| 8.4 | `CrmProvider` interface with the client's chosen CRM adapter; field-ownership mapping | Lead appears in the CRM within 1 minute |
| 8.5 | Inbound CRM webhook with HMAC verification; `AGENT` role | A stage change in the CRM updates the booking and writes a `BookingEvent` |

### Sprint 9 — Payments and launch hardening (review Phase 5)

| Step | Action | Done when |
|---|---|---|
| 9.1 | The chosen gateway end-to-end: server-side intent, webhook as source of truth, idempotency | Test card payment marks the booking PAID only via the webhook |
| 9.2 | Deposits and instalments | Demoed |
| 9.3 | Sentry (or similar) error monitoring; `/api/health` checks DB and Sabre; uptime monitor | Alerts reach the team |
| 9.4 | Backup-restore drill; load test search and booking at 10× expected peak (e.g. Ramadan) | Report filed |
| 9.5 | **Pre-launch SEO checklist:** 301 map from any old site URLs, crawl with Screaming Frog (0 broken links, 0 missing titles, 0 duplicate descriptions), production `NEXT_PUBLIC_SITE_URL` set (otherwise canonicals point to `localhost:3004`), robots allows crawling, sitemap submitted | Checklist signed |
| 9.6 | Update `PROJECT_OVERVIEW.md` and `README.md`; client admin training (how to write an SEO-ready post) | Handover meeting held |

### After launch — monthly SEO routine

| Task | Frequency | Why |
|---|---|---|
| Search Console: coverage errors, Core Web Vitals, queries with high impressions but low click-through | Weekly | Low click-through on a page usually means its title or description needs rewriting, a quick win |
| Publish 4–8 cluster articles | Monthly | Steady publishing builds topical authority |
| Refresh cornerstone posts and package prices | Pre-Ramadan, pre-Hajj, every 6 months | Seasonal demand spikes; stale prices lose clicks and trust |
| Earn links: Google Business Profile per branch, Pakistani travel directories, mosque and community partnerships, press for group trips | Ongoing | Links from relevant sites remain a strong ranking factor, and local profiles drive "near me" searches |
| Ask customers for reviews (Google Business Profile plus on-site, verified) | After every trip | Reviews drive local rankings and conversion |

---

## Summary: the path to "elite"

1. **Sprints 0–3:** a safe, correct booking platform. This is a precondition for SEO, since compromised or broken sites don't rank or convert.
2. **Sprints 4–5:** every page with a unique, length-checked title and description; full structured data; a blog system that makes good SEO the default for the client's editors.
3. **Sprint 6:** Core Web Vitals in the green.
4. **Sprint 7:** a distinctive, accessible design with features competitors don't have.
5. **Sprints 8–9:** CRM-ready, payments live, launch-hardened.
6. **After launch:** a content and measurement routine that keeps rankings growing.
