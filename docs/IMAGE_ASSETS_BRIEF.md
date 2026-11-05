# Image Assets Brief

Every image the redesigned site needs: the ChatGPT prompt, the size to pick, where it is used, and the file name to save it as. Covers the pages already redesigned and the Phase 6 detail pages.

**Total: 72 images.** About 20 of them should be real photos, not AI images (marked ⚠️, see §2).

---

## 1. How to use this brief

1. **Open a new ChatGPT chat and paste the setup prompt (§3) first.** It sets the style for every image in that chat so they all look like one set.
2. **For each image, paste its prompt and pick the size listed** (ChatGPT image sizes are `Square 1024×1024`, `Landscape 1536×1024` or `Portrait 1024×1536`).
3. **Download the PNG and rename it exactly as listed** (e.g. `hero-home.png`). Don't compress, resize or convert it yourself. A PNG straight from ChatGPT is the best starting file.
4. **Put all files in `design-assets/raw/`** in the project and tell me. I convert, crop and wire them up (§9).

If an image comes out wrong (warped buildings, extra fingers, garbled signs, text in the image), regenerate it. Don't fix it with edits that leave artefacts.

---

## 2. Images that should NOT be AI-generated

| What | Why | Use instead |
|---|---|---|
| ⚠️ **Holy sites**: Masjid al-Haram, the Kaaba, Masjid an-Nabawi, Quba Mosque | AI regularly gets minarets, the Kaaba's kiswa, domes and courtyards wrong. Your audience will notice, and it undermines trust on an Umrah site. | Licensed real photos (Unsplash/Pexels free licence, Getty/Shutterstock, or your own). The current home hero is a licensed Unsplash photo and can stay. |
| ⚠️ **Named hotels** (Safwa Towers, Noor Residence, any real hotel) | A made-up photo of a real, bookable hotel misleads customers and can breach supplier terms. | Official images from the hotel or your supplier (Amadeus/Sabre/bed bank). |
| ⚠️ **Famous landmarks** (Badshahi Mosque, Faisal Mosque, Burj Khalifa, Petronas Towers, Hagia Sophia, Tower Bridge, pyramids) | AI usually gets them *nearly* right, which looks fake to anyone who's been there. | Prefer real photos. AI prompts are given as a fallback; check each result carefully. |
| **Airline logos** | Trademarks. | Official logo files from each airline's press kit. The 44 files in `public/airlines/` should become SVG or WebP. |
| **Your logo and team/office photos** | Brand and authenticity. | A designer-made SVG logo; real photos of your team and office. |

Prompts for the ⚠️ items are still included so you have a fallback.

---

## 3. Setup prompt (paste once at the start of the chat)

```
For every image I ask for in this conversation, follow these rules unless I say otherwise:

STYLE: Photorealistic editorial travel photography, as if shot on a full-frame camera with a 35mm lens. Natural light, true-to-life colours, gentle contrast, sharp focus on the main subject. Calm, premium, trustworthy mood, like a high-end travel booking website (Expedia, Booking.com). Not oversaturated, no HDR halos, no fantasy or surreal elements, no lens-flare effects.

PEOPLE: If people appear they are small in the frame, seen from behind or in soft focus, never identifiable faces, dressed modestly and respectfully. No children as the main subject.

STRICTLY NO: text, letters, numbers, captions, signs with readable writing, logos, brand names, watermarks, borders, frames, collages or split images.

COMPOSITION: One clear subject, uncluttered background, plenty of breathing room. Keep the main subject inside the central 60% of the frame so the image can be cropped to different shapes.

Reply only with the image; no explanation needed.
```

For **icons and illustrations** (§5.3 and §5.11), start a **separate chat** with this setup prompt instead:

```
For every image I ask for in this conversation: create a single illustrated icon in a soft, modern "3D-lite" travel-app style: rounded friendly shapes, gentle gradients, a subtle soft shadow underneath, lighting from the top-left. Use ONLY this palette: brand blue #1668E3, light blue #E8F0FD, navy #191E3B, warm gold #B8913A, white #FFFFFF, plus tints of these. FULLY TRANSPARENT BACKGROUND (PNG with alpha), no background shape, no circle behind it. The object is centred and fills about 70% of the canvas. No text, no letters, no numbers. Every icon in this chat must look like part of the same set.
```

---

## 4. Technical spec (Google / Core Web Vitals best practice)

You only supply the PNGs; everything below is what I do with them. It's here so you know what to expect.

### 4.1 Formats

| Type | Stored as (source) | Sent to browsers | Why |
|---|---|---|---|
| Photos | WebP, quality 85, sRGB, metadata stripped | **AVIF first, WebP fallback**, chosen automatically by `next/image` | AVIF is ~50% smaller than JPEG at the same quality; WebP covers the rest. Both are what Google's PageSpeed recommends ("Serve images in next-gen formats"). |
| Icons / illustrations | SVG where possible, otherwise WebP with transparency | Same | SVG is resolution-independent and tiny. |
| Social share (Open Graph) | **JPG** 1200×630 | JPG | WhatsApp, Facebook and LinkedIn don't reliably support AVIF/WebP for previews. |
| Favicon / app icons | SVG + PNG + ICO | Same | Browser and OS requirements. |

### 4.2 Sizes and byte budgets

`next/image` creates several widths from each source and the browser downloads only the one it needs (`srcset` + `sizes`). Budgets are for the AVIF actually downloaded.

| Slot | Shown at (desktop → phone) | Source you supply | Typical download | Budget |
|---|---|---|---|---|
| Page hero (LCP image) | full width, ~1366×590 → 390×720 | Landscape 1536×1024 | 1536w / 828w | **≤ 120 KB** desktop, **≤ 60 KB** phone |
| Promo band | ~720×340 | Landscape 1536×1024 | 828w | ≤ 70 KB |
| Destination card (4:3) | 256×192 → 300×225 | Landscape 1536×1024 | 640w | ≤ 35 KB |
| Destination page hero | full width, short band | same source as the card | 1536w | ≤ 110 KB |
| Activity / tour card (4:3) | 288–384 wide | Landscape 1536×1024 | 640–828w | ≤ 45 KB |
| Blog card (16:9) | 320×180 | Landscape 1536×1024 | 640w | ≤ 35 KB |
| Blog article cover | ~760×428 | same source | 1080w | ≤ 90 KB |
| Gallery main / thumbs | 800×600 / 200×150 | Landscape 1536×1024 | 1080w / 384w | ≤ 90 KB / ≤ 15 KB |
| Product tab icon | 44×44 | Square 1024×1024, transparent | 128px | ≤ 6 KB (SVG ≤ 3 KB) |
| Empty-state illustration | ~280×280 | Square 1024×1024, transparent | 640w | ≤ 25 KB |
| Open Graph image | 1200×630 | Landscape 1536×1024 (background only) | — | ≤ 200 KB JPG |

**Total images on first home-page load (above the fold): ≤ 180 KB.**

### 4.3 Loading rules I'll apply

- **Hero = the Largest Contentful Paint (LCP) image:** `next/image` with `preload` (Next 16 replaces `priority` with `preload`), `fetchPriority="high"`, `sizes="100vw"`, never lazy-loaded. Heroes currently load through CSS `background-image`, which Google can't preload or right-size, so I'll move them to `next/image`.
- **Everything else lazy-loads** (`loading="lazy"`, the default).
- **Every image gets fixed dimensions or an `aspect-ratio`,** so nothing shifts while loading (Cumulative Layout Shift = 0).
- **A tiny blur placeholder** (`placeholder="blur"`) on cards and heroes, so empty boxes never flash.
- **Descriptive `alt` text** from this brief (accessibility + Google Images SEO).
- **Descriptive lowercase-hyphen file names,** e.g. `destination-istanbul.webp` (helps image search).
- **Long cache:** `minimumCacheTTL` of 31 days. That cache can't be cleared, so a changed image gets a new name (`hero-home-v2.webp`).
- **Self-hosted:** the 12 seeded images currently hot-linked from `images.unsplash.com` move to our own storage (public folder or Cloudflare R2), which saves a DNS lookup and connection to another host.

---

## 5. The images

Format per entry: **file name** · ChatGPT size · where it's used · **alt text** · prompt.

### 5.1 Page heroes (6)

Hero composition rule: the **top 35%** sits behind a white headline, so keep it calm and fairly plain (sky, soft architecture). The **bottom 30%** is covered by the white search card. The subject belongs in the **middle band**. The image is also cropped to a tall phone shape, so keep the subject **centred horizontally**.

**H1 · `hero-home.png`** ⚠️ real photo preferred (current licensed photo can stay)
Landscape 1536×1024 · Home page and `/flights` hero
Alt: "Masjid an-Nabawi in Madinah at golden hour"
```
Landscape 3:2. Wide view of the courtyard of Masjid an-Nabawi in Madinah at golden hour, the green dome and white minarets lit by warm low sun against a clear soft-blue sky. The upper third of the frame is mostly open sky. Distant pilgrims in white walk across the marble courtyard in the lower part of the frame, small and not identifiable. Serene, spiritual, welcoming.
```

**H1-M · `hero-home-mobile.png`** (optional, art-directed phone version) ⚠️ same note
Portrait 1024×1536 · Home hero on phones
Alt: same as H1
```
Portrait 2:3. Same scene as before: Masjid an-Nabawi in Madinah at golden hour, framed vertically with one tall white minaret and the green dome in the centre, large calm sky in the top 40%, marble courtyard with tiny distant pilgrims in the bottom 25%.
```

**H2 · `hero-hotels.png`**
Landscape 1536×1024 · `/hotels` hero
Alt: "Elegant hotel room with a city view at dusk"
```
Landscape 3:2. A calm, elegant five-star hotel room at dusk, seen from the doorway: neatly made king bed with white linen, warm bedside lamps glowing, floor-to-ceiling window showing a softly blurred city skyline with twinkling lights and a pink-blue evening sky. Upper third of the frame is the window and sky. Neutral cream, wood and soft gold tones. No artwork with text, no TV screen content.
```

**H3 · `hero-tours.png`**
Landscape 1536×1024 · `/tour-packages` hero
Alt: "Traveller looking out over mountains and a valley at sunrise"
```
Landscape 3:2. A single traveller with a small backpack, seen from behind and small in the frame, standing on a rocky viewpoint looking over layered misty mountains and a green valley at sunrise. Soft warm light, pastel sky filling the upper third. Sense of adventure and freedom.
```

**H4 · `hero-visa.png`**
Landscape 1536×1024 · `/visa` hero
Alt: "Passport, boarding pass and world map on a desk"
```
Landscape 3:2. Overhead flat-lay on a light oak desk: a closed navy-blue passport with no visible country name or emblem, a plain boarding pass with no readable text, a pair of sunglasses, a small potted plant and a faded vintage world map partly visible. Soft morning window light from the left, gentle shadows. Objects grouped in the middle band; the top third is clean desk surface.
```

**H5 · `hero-umrah.png`** ⚠️ real photo strongly preferred
Landscape 1536×1024 · `/umrah-packages` hero (Phase 6)
Alt: "Masjid al-Haram in Makkah at dusk"
```
Landscape 3:2. Wide view of Masjid al-Haram in Makkah at blue hour, the illuminated minarets and arches glowing warm white against a deep blue sky, the upper third mostly sky. A sea of distant pilgrims in white in the lower part of the frame, tiny and not identifiable. Peaceful, awe-inspiring, respectful.
```

### 5.2 Promo band (1)

**P1 · `promo-umrah.png`** ⚠️ real photo preferred
Landscape 1536×1024 · Navy "Umrah packages, planned around you" band on the home page. The left 40% is covered by a dark navy fade, so keep the subject on the **right side**.
Alt: "Pilgrims walking towards the mosque at sunset"
```
Landscape 3:2. Subject on the RIGHT half of the frame: the minarets and arches of a grand mosque in Madinah at sunset, warm golden light on the stone. The LEFT half is soft, dark, out-of-focus evening sky and shadow, nearly empty. Two or three tiny pilgrims in white walking towards the mosque, seen from behind.
```

### 5.3 Product tab icons (6) · use the icon chat

Square 1024×1024, **transparent background** · The tab row at the top of the home search card (shown at 44px).
**Better option:** ask a designer for these as one SVG set, or have ChatGPT's PNGs vectorised. Either is ~3 KB each and pixel-perfect.

| File | Alt | Prompt |
|---|---|---|
| `icon-flights.png` | Flights | `A cute passenger airplane flying diagonally upward to the right, brand-blue body with white windows and a gold tail stripe.` |
| `icon-umrah.png` | Umrah | `A golden crescent moon with a small star beside it, floating above a simple white dome silhouette with a navy outline.` |
| `icon-tours.png` | Tours | `A rounded travel suitcase in brand blue with a gold handle and two small destination stickers with no text.` |
| `icon-hotels.png` | Hotels | `A neat double bed seen at a three-quarter angle with white pillows, a light-blue blanket and a navy headboard.` |
| `icon-visa.png` | Visa | `A navy passport standing slightly open with a gold approval stamp shape on the page (no letters) and a small blue check mark badge.` |
| `icon-activities.png` | Things to do | `A pair of admission tickets fanned out, one brand blue and one gold, with simple star shapes instead of text.` |

### 5.4 Destinations (8)

Landscape 1536×1024 · Destination cards on the home page (cropped 4:3) **and** the hero band of `/destinations/[slug]` (cropped wide). Keep the landmark centred with sky above it. They're stored in the database, so after conversion I'll give you files to upload in **Admin → Destinations** (or I can update the seed).

| File | Alt | Prompt |
|---|---|---|
| `destination-lahore.png` ⚠️ | Badshahi Mosque in Lahore at sunset | `Landscape 3:2. The Badshahi Mosque in Lahore at sunset, red sandstone and white marble domes glowing warm, reflected in a calm pool in the foreground, clear orange-to-blue sky above.` |
| `destination-karachi.png` | Karachi seafront at sunset | `Landscape 3:2. Karachi's Clifton seafront at sunset, wide sandy beach with gentle waves, a few distant strolling people as silhouettes, the modern city skyline soft on the horizon, warm pink-orange sky.` |
| `destination-islamabad.png` ⚠️ | Faisal Mosque with the Margalla Hills | `Landscape 3:2. The Faisal Mosque in Islamabad, its tent-like white roof and four slender minarets in bright morning light, the green Margalla Hills rising behind it, clear blue sky.` |
| `destination-dubai.png` ⚠️ | Dubai skyline at dusk | `Landscape 3:2. Dubai skyline at blue hour seen from across the water, the Burj Khalifa in the centre, glittering tower lights reflected in calm water, soft purple-blue sky.` |
| `destination-jeddah.png` | Jeddah Corniche with a mosque on the water | `Landscape 3:2. The Jeddah Corniche at golden hour, a small white mosque standing on the water with its reflection, calm Red Sea, palm trees along the promenade, warm sky.` |
| `destination-istanbul.png` | Istanbul skyline over the Bosphorus | `Landscape 3:2. Istanbul at sunrise seen from the water, domes and minarets of the old city on the skyline, a ferry crossing the Bosphorus, seagulls, soft golden haze.` |
| `destination-london.png` ⚠️ | Tower Bridge on the Thames at dusk | `Landscape 3:2. Tower Bridge over the River Thames in London at blue hour, the bridge lit warm against a deep blue sky, gentle reflections in the river.` |
| `destination-kuala-lumpur.png` ⚠️ | Petronas Towers at night | `Landscape 3:2. The Petronas Twin Towers in Kuala Lumpur at blue hour, shining silver against a deep blue sky, seen from a park with palm trees in the foreground.` |

### 5.5 Activities (8)

Landscape 1536×1024 · "Things to do" cards (4:3) and `/activities` pages. These replace the current hot-linked Unsplash photos. Upload via **Admin → Activities**.

| File | Alt | Prompt |
|---|---|---|
| `activity-dubai-desert-safari.png` | 4x4 vehicles crossing red dunes at sunset | `Landscape 3:2. Two white 4x4 vehicles driving over rolling red sand dunes in the Dubai desert at sunset, plumes of golden sand behind them, long shadows, warm sky.` |
| `activity-dubai-burj-khalifa-deck.png` | View over Dubai from a skyscraper observation deck | `Landscape 3:2. View from a very high glass observation deck over Dubai at golden hour, two visitors seen from behind as silhouettes at the window, the city grid and other skyscrapers far below, hazy desert horizon.` |
| `activity-jeddah-corniche-walk.png` | Sunset walk along the Jeddah Corniche | `Landscape 3:2. A wide seaside promenade in Jeddah at sunset, a family walking away from the camera, palm trees and modern lamp posts, calm Red Sea and a glowing orange horizon.` |
| `activity-istanbul-old-city-tour.png` | Cobbled street in Istanbul's old city | `Landscape 3:2. A cobbled street in Istanbul's old city in morning light, colourful wooden Ottoman houses, a mosque dome visible at the end of the street, a few tourists walking away from the camera.` |
| `activity-london-eye.png` ⚠️ | The London Eye beside the Thames | `Landscape 3:2. The London Eye observation wheel beside the River Thames on a bright spring afternoon, blue sky with soft clouds, trees in fresh green leaf along the embankment.` |
| `activity-kuala-lumpur-skybridge.png` ⚠️ | Skybridge between the Petronas Towers | `Landscape 3:2. Looking up at the double-deck skybridge linking the Petronas Twin Towers in Kuala Lumpur, steel and glass gleaming in late-afternoon sun, deep blue sky.` |
| `activity-lahore-food-walk.png` | Evening food street in Lahore's walled city | `Landscape 3:2. A lively evening food street in Lahore's walled city, warm string lights, steaming pots and grills at street stalls, historic brick buildings with wooden balconies, people in soft focus.` |
| `activity-karachi-clifton-beach.png` | Camels on Clifton Beach at sunset | `Landscape 3:2. Two decorated camels standing on the wet sand of Clifton Beach, Karachi, at sunset, gentle waves, glowing orange sky reflected on the beach.` |

### 5.6 Blog covers (4)

Landscape 1536×1024 · Blog cards (16:9), article header and the article's social share image. Keep the subject centred; the top and bottom get cropped. Upload via **Admin → Blog**.

| File | Alt | Prompt |
|---|---|---|
| `blog-umrah-first-timers.png` | Pilgrim's travel essentials laid out neatly | `Landscape 3:2. Neat flat-lay on a cream linen surface: folded white ihram cloths, a small prayer mat, a string of prayer beads, a closed navy passport with no markings, a water bottle and comfortable sandals. Soft natural light, calm and organised.` |
| `blog-best-time-dubai.png` | Dubai Marina on a clear winter evening | `Landscape 3:2. Dubai Marina on a clear, pleasant winter evening, towers lit up around the curving waterway, a few boats, people strolling on the promenade in light jackets, soft lilac sky.` |
| `blog-cheap-flights-pakistan.png` | Plane wing above the clouds at sunrise | `Landscape 3:2. View through an airplane window of the wing above a sea of soft clouds at sunrise, warm golden light, the window frame softly blurred at the edges.` |
| `blog-istanbul-guide.png` | Tea and a view of the Bosphorus | `Landscape 3:2. A traditional tulip-shaped glass of Turkish tea on a small saucer on a café table in the foreground, the Bosphorus and a mosque-domed skyline softly blurred behind, late-afternoon light.` |

### 5.7 Hotels (1 fallback)

Real hotel photos must come from the supplier (§2). This one image is only a **generic fallback** for hotels with no photo yet.

**HT1 · `hotel-fallback.png`**
Landscape 1536×1024 · Hotel cards with no photo
Alt: "Comfortable hotel room"
```
Landscape 3:2. A bright, comfortable, modern hotel room in neutral cream and soft blue tones, two neatly made twin beds, a small seating area, sheer curtains with soft daylight. Generic and unbranded; no artwork with text.
```

### 5.8 Umrah package gallery (10) · Phase 6

Landscape 1536×1024 · Photo gallery on Umrah package detail pages. `umrah-haram-exterior`, `umrah-madinah-courtyard` and `umrah-kaaba-night` double as the **10, 15 and 21-day package card thumbnails**.

| File | Alt | Prompt |
|---|---|---|
| `umrah-haram-exterior.png` ⚠️ | Masjid al-Haram and the clock tower | `Landscape 3:2. Masjid al-Haram in Makkah in late-afternoon light, white marble arches and minarets in the foreground, the tall clock tower behind, pilgrims in white small and distant.` |
| `umrah-kaaba-night.png` ⚠️ | The Kaaba at night | `Landscape 3:2. The Kaaba at night seen from an upper level of Masjid al-Haram, pilgrims performing tawaf as a soft motion-blurred circle of white, warm light on the marble, reverent atmosphere.` |
| `umrah-madinah-courtyard.png` ⚠️ | Courtyard umbrellas at Masjid an-Nabawi | `Landscape 3:2. The giant white umbrella canopies open over the marble courtyard of Masjid an-Nabawi in Madinah in bright daylight, a few distant pilgrims, clean and serene.` |
| `umrah-quba-mosque.png` ⚠️ | Quba Mosque in Madinah | `Landscape 3:2. Quba Mosque in Madinah, white walls, domes and minarets in soft morning light, palm trees in front, clear blue sky.` |
| `umrah-hotel-room-quad.png` | Spacious hotel room for four | `Landscape 3:2. A clean, spacious hotel room set up for four guests: two double beds with white linen, warm lighting, a window with sheer curtains glowing with daylight. Calm cream and gold tones, unbranded.` |
| `umrah-hotel-breakfast.png` | Hotel breakfast buffet | `Landscape 3:2. A bright hotel breakfast buffet with fresh fruit, dates, flatbreads, pastries and juices arranged neatly on a long counter, warm inviting light, no people, no signs.` |
| `umrah-transport-coach.png` | Air-conditioned coach for pilgrims | `Landscape 3:2. A modern white air-conditioned tourist coach parked on a clean street in a Saudi city, palm trees, bright daylight, no logos or writing on the bus.` |
| `umrah-mount-uhud.png` | Mount Uhud near Madinah | `Landscape 3:2. The rugged reddish-brown slopes of Mount Uhud near Madinah under a clear blue sky, a few small visitors on a path at the base, quiet desert landscape.` |
| `umrah-airport-arrival.png` | Arrivals hall at the airport | `Landscape 3:2. A bright, modern airport arrivals hall with high white ceilings and large windows, a few travellers with suitcases walking away from the camera, clean and calm, no readable signs.` |
| `umrah-pilgrim-journey.png` | Pilgrim walking with luggage | `Landscape 3:2. A pilgrim in white ihram seen from behind, pulling a small suitcase along a wide marble walkway towards a grand mosque in the distance at sunrise, soft golden light.` |

### 5.9 Tour package galleries (24) · Phase 6

Landscape 1536×1024 · 4 extra photos per tour for the detail-page gallery. The current card photo is image #1. File pattern: `tour-<place>-<n>.png`. Each prompt starts with `Landscape 3:2.`

| File | Alt | Prompt (after "Landscape 3:2.") |
|---|---|---|
| `tour-dubai-2.png` | Dhow cruise dinner on Dubai Creek | `A traditional wooden dhow lit with warm lights cruising on Dubai Creek at night, dinner tables on deck, city lights reflected in the water.` |
| `tour-dubai-3.png` | Desert camp at dusk | `A luxury desert camp in the Dubai dunes at dusk, low cushions, lanterns and rugs around a small fire, deep blue sky with first stars.` |
| `tour-dubai-4.png` | Spice souk in old Dubai | `A traditional spice souk in old Dubai, colourful sacks of spices and dried fruit, warm lantern light, shoppers in soft focus.` |
| `tour-dubai-5.png` | Luxury hotel pool overlooking the sea | `An infinity pool at a luxury Dubai beach resort at golden hour, sun loungers, palm trees and the calm Arabian Gulf beyond.` |
| `tour-istanbul-2.png` | Grand Bazaar lamps | `Rows of colourful mosaic glass lamps glowing in a stall inside a historic covered bazaar in Istanbul, warm light, arched ceiling.` |
| `tour-istanbul-3.png` | Bosphorus cruise at sunset | `A small cruise boat on the Bosphorus at sunset, waterfront Ottoman mansions on the shore, a long suspension bridge in the distance.` |
| `tour-istanbul-4.png` | Hot-air balloons over Cappadocia | `Dozens of hot-air balloons floating over the fairy-chimney rock formations of Cappadocia at sunrise, soft pastel sky.` |
| `tour-istanbul-5.png` | Turkish breakfast spread | `A generous Turkish breakfast on a terrace table: cheeses, olives, tomatoes, simit bread, honey and tea glasses, morning sunlight.` |
| `tour-bali-2.png` | Ubud rice terraces | `Lush green stepped rice terraces in Ubud, Bali, in soft morning mist, palm trees, a small path with a lone walker seen from behind.` |
| `tour-bali-3.png` | Sea temple at sunset | `A Balinese temple on a rock outcrop in the sea at sunset, waves around its base, glowing orange sky.` |
| `tour-bali-4.png` | Family pool villa | `A private villa pool surrounded by tropical plants in Bali, a family's inflatable ring floating, thatched pavilion, bright afternoon.` |
| `tour-bali-5.png` | Waterfall in the jungle | `A tall waterfall falling into a turquoise pool in the Balinese jungle, ferns and mossy rocks, soft diffused light.` |
| `tour-maldives-2.png` | Overwater villa deck | `The private deck of an overwater villa in the Maldives, two sun loungers, steps into crystal-clear turquoise water, bright blue sky.` |
| `tour-maldives-3.png` | Snorkelling over a coral reef | `Underwater view of a snorkeller seen from behind swimming over a colourful coral reef with tropical fish, sun rays through clear water.` |
| `tour-maldives-4.png` | Sandbank picnic | `A tiny white sandbank in a turquoise lagoon with a shaded picnic set-up, a wooden boat moored nearby, no other land in sight.` |
| `tour-maldives-5.png` | Beach dinner under the stars | `A candle-lit dinner table set on a white sand beach at dusk, lanterns, gentle waves, deep blue sky with first stars.` |
| `tour-cairo-2.png` | Felucca on the Nile | `A traditional felucca sailboat with a white sail on the Nile at sunset, palm-lined banks, warm golden light.` |
| `tour-cairo-3.png` | Ancient temple columns | `Massive carved ancient Egyptian temple columns in Luxor in warm late-afternoon light, deep shadows, a small visitor for scale.` |
| `tour-cairo-4.png` | Khan el-Khalili market | `A historic market alley in Cairo, hanging brass lanterns, carpets and souvenirs, warm evening light, shoppers in soft focus.` |
| `tour-cairo-5.png` | Nile cruise ship sundeck | `The sundeck of a Nile cruise ship with loungers and a small pool, the river and desert hills sliding past, bright afternoon.` |
| `tour-tokyo-2.png` | Temple with cherry blossoms | `A traditional red Japanese temple gate surrounded by blooming cherry blossoms in Tokyo, soft spring light, petals in the air.` |
| `tour-tokyo-3.png` | Mount Fuji over a lake | `Snow-capped Mount Fuji reflected in a calm lake at dawn, autumn trees along the shore, pastel pink sky.` |
| `tour-tokyo-4.png` | Bowl of ramen | `Close-up of a steaming bowl of ramen with egg, sliced pork and spring onions on a wooden counter in a cosy Tokyo noodle bar, warm light.` |
| `tour-tokyo-5.png` | Bullet train at speed | `A sleek white Japanese bullet train speeding past with slight motion blur, green countryside and a clear blue sky.` |

### 5.10 Sign-in page (1)

**A1 · `auth-side.png`**
Portrait 1024×1536 · Side panel on desktop sign-in/sign-up pages (hidden on phones)
Alt: "Airplane window view over clouds at sunset"
```
Portrait 2:3. View through an oval airplane window of soft pink and gold clouds at sunset, the window frame and a hint of the seat softly blurred, calm and dreamy, lots of soft empty sky.
```

### 5.11 Empty-state illustrations (2) · use the icon chat

Square 1024×1024, transparent · Shown when a search returns nothing.

| File | Alt | Prompt |
|---|---|---|
| `empty-no-flights.png` | No flights found | `An illustrated small airplane looking for something with a magnifying glass, flying past a few soft clouds, friendly and calm, not sad.` |
| `empty-no-packages.png` | No packages found | `An illustrated open, empty suitcase with a small map and a compass beside it, friendly and inviting, suggesting "let's plan something".` |

### 5.12 Social share background (1)

**S1 · `og-background.png`**
Landscape 1536×1024 · Background of the default link-preview image (1200×630). Logo and headline get added **in code**, because AI text comes out garbled.
Alt: "Safar — flights, Umrah packages and tours"
```
Landscape 3:2. A calm, wide travel scene: an airplane wing above soft golden clouds at sunrise, the LEFT half of the frame mostly empty soft sky (space for a logo and headline), the wing entering from the right. Warm, premium, optimistic.
```

---

## 6. Brand files (designer or me, not ChatGPT)

| File | Spec | Notes |
|---|---|---|
| `logo.svg` | Vector, transparent | Used in header and footer. ChatGPT can't produce a real vector file. |
| `logo-white.svg` | Vector, white version | For dark backgrounds (promo band, social image). |
| `icon.svg` | Square vector app mark | Next.js serves it as the favicon. |
| `favicon.ico` | 32×32 | Already exists; regenerate from the new mark. |
| `apple-icon.png` | 180×180 PNG, no transparency | iOS home screen. |
| `icon-192.png`, `icon-512.png` | PNG, maskable safe zone | Android / web app manifest. |

---

## 7. Checklist

| Section | Count | AI OK? |
|---|---|---|
| 5.1 Heroes | 6 (1 optional) | H2–H4 yes · H1, H1-M, H5 real preferred |
| 5.2 Promo | 1 | real preferred |
| 5.3 Tab icons | 6 | yes (SVG better) |
| 5.4 Destinations | 8 | 3 yes · 5 landmarks real preferred |
| 5.5 Activities | 8 | 6 yes · 2 real preferred |
| 5.6 Blog covers | 4 | yes |
| 5.7 Hotel fallback | 1 | yes (generic only) |
| 5.8 Umrah gallery | 10 | 6 yes · 4 holy sites real preferred |
| 5.9 Tour galleries | 24 | yes |
| 5.10 Auth | 1 | yes |
| 5.11 Empty states | 2 | yes |
| 5.12 Social background | 1 | yes |
| **Total** | **72** | |

---

## 8. Priority order (if you don't want to do all 72 at once)

1. **H1 (or keep current), H2, H3, H4, P1**: every hero above the fold, which matters most for speed and first impression.
2. **Tab icons (5.3)**: very visible on the home page.
3. **Destinations (5.4) and activities (5.5)**: the home carousels are currently empty or gradient-only without them.
4. **Blog covers (5.6)**: replace the hot-linked Unsplash images.
5. **Umrah gallery (5.8) and H5**: needed for Phase 6.
6. **Tour galleries (5.9), empty states, auth, social background.**

---

## 9. What I do once you drop the files in `design-assets/raw/`

1. **Convert:** resize to the master size, strip metadata, convert to sRGB and save as WebP q85 (transparent icons stay WebP with alpha, or become SVG).
2. **Place:** static images go in `public/images/<section>/`. Database images (destinations, activities, blog) go to the R2 bucket, or get a seed update.
3. **Next.js image config:**
   ```ts
   images: {
     formats: ["image/avif", "image/webp"],
     qualities: [60, 75],
     deviceSizes: [640, 828, 1080, 1536, 1920],
     imageSizes: [64, 128, 256, 384],
     minimumCacheTTL: 2678400, // 31 days; version file names when an image changes
     remotePatterns, // unchanged
   }
   ```
4. **Move CSS-background heroes to `next/image`** with `preload` and `fetchPriority="high"`, and add a `<picture>` phone variant if H1-M is supplied.
5. **Replace the 10 raw `<img>` tags and remove `unoptimized`,** so cards, blog and airline logos get AVIF/WebP with correct `sizes`.
6. **Add blur placeholders and alt text from this brief.**
7. **Measure with Lighthouse / PageSpeed Insights (mobile) and report back.** Targets: LCP < 2.5 s, CLS < 0.1, image bytes on home ≤ 180 KB above the fold.
