/* eslint-disable @typescript-eslint/no-require-imports */
// Fills the activity detail pages (/activities/<slug>) with the sections OTA
// activity pages carry (Wego, Sastaticket, Klook-style): key facts, highlights,
// what's included / not included, what to expect, know before you go and FAQs.
// Also adds the activities Pakistani travellers search most for the Q4 2026
// winter season (Global Village Season 31, Miracle Garden Season 15, Hyde Park
// Winter Wonderland, Hogwarts in the Snow, Charna Island season, ...).
// Researched November 2026.
//
// Safe to re-run:
//  - existing activities: only empty detail fields are filled, and the
//    description is replaced only while it is still the original seeded
//    one-liner, so admin edits in /admin/activities are never overwritten;
//  - new activities: created only when the slug does not exist yet.
//
// New activities have no photo of their own yet, so they are created HIDDEN
// with the destination photo. Upload the real photo in /admin/activities and
// tick "Active". Pass --publish to create them visible anyway.
//
// Prices are "from" estimates converted to PKR at Nov 2026 rates
// (AED 76, EUR 325, GBP 372, MYR 66, SAR 75) and change with suppliers and the
// exchange rate: review them in the admin before relying on them.
// Cancellation policies depend on the supplier you book with, so this script
// leaves that field empty for the admin to fill.
//
//   node scripts/import-activity-details.js                     # dry run (validates content)
//   node scripts/import-activity-details.js --write             # save
//   node scripts/import-activity-details.js --write --publish   # save, new activities visible
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// ---------------------------------------------------------------------------
// Details for the activities that already exist (keyed by slug).
// ---------------------------------------------------------------------------
const EXISTING = {
  "burj-khalifa-observation-deck-dubai": {
    seededDescription: "Skip-the-line access to the world's tallest tower.",
    description:
      "Ride one of the world's fastest lifts to At the Top, the observation decks on levels 124 and 125 of the Burj Khalifa, the tallest building in the world at 828 metres. From about 450 metres up you see Downtown Dubai, the Dubai Fountain, the desert on one side and the Arabian Gulf on the other. Sunset slots sell out first, so book them early, or go after dark to watch the city light up.",
    duration: "1–2 hours",
    openingHours: "Daily, roughly 9am–11pm (last entry varies by season)",
    location: "Downtown Dubai, entrance on the lower ground floor of The Dubai Mall",
    bestTimeToVisit: "Sunset slot (book ahead) or after 7pm for city lights",
    highlights: [
      "Indoor and open-air terrace views from levels 124 and 125",
      "360° panorama of Downtown Dubai, the desert and the Gulf",
      "Multimedia exhibit on how the tower was built",
      "Telescopes that show the view in real time and at different times of day",
      "Watch the Dubai Fountain show from above in the evening",
    ],
    included: [
      "Timed entry ticket to At the Top, levels 124 and 125",
      "High-speed lift ride up and down",
      "Access to the exhibition area",
    ],
    excluded: [
      "Level 148 (At the Top SKY), sold as a separate ticket",
      "Hotel transfers",
      "Food and drinks",
      "Prime-time (sunset) surcharge unless booked as a prime ticket",
    ],
    itinerary: [
      "Arrive at The Dubai Mall lower ground floor 15–20 minutes before your time slot and show your e-ticket.",
      "Walk through the exhibit on the history and engineering of the tower.",
      "Take the high-speed lift to level 124, about one minute to the top.",
      "Enjoy the indoor deck and the open-air terrace, then walk up to level 125.",
      "Return by lift and exit through the souvenir shop into The Dubai Mall.",
    ],
    importantInfo: [
      "Your entry is for a fixed time slot; arriving late can mean losing the slot.",
      "Bags go through airport-style security; large bags and outside food are not allowed.",
      "Children under 4 usually enter free but still need to be booked.",
      "Nearest metro: Burj Khalifa/Dubai Mall station (Red Line), then the covered walkway.",
    ],
    faqs: [
      {
        question: "What is the best time to visit the Burj Khalifa?",
        answer:
          "Sunset is the most popular time because you see the city in daylight, at golden hour and lit up at night in one visit, but sunset tickets cost more and sell out days ahead. Early morning slots are cheaper and less crowded. In November to March the air is clearer, so the view reaches further.",
      },
      {
        question: "How long does a Burj Khalifa visit take?",
        answer:
          "Plan 1 to 2 hours including security, the exhibition, the lift ride and time on the decks. On busy evenings in December and January, queues for the lift down can add 20–30 minutes.",
      },
      {
        question: "What is the difference between level 124/125 and level 148?",
        answer:
          "Levels 124 and 125 (At the Top) are the standard observation decks at about 450 metres, with an open-air terrace. Level 148 (At the Top SKY) is at 555 metres, has a lounge with refreshments and a guided experience, and costs several times more. Most first-time visitors are happy with 124 and 125.",
      },
      {
        question: "Can I see the Dubai Fountain from the Burj Khalifa?",
        answer:
          "Yes. The Dubai Fountain plays in the lake below every 30 minutes in the evening, and from the top you can see the whole pattern of the show. For the full sound and spray, also watch one show from the Dubai Mall waterfront after your visit.",
      },
    ],
  },

  "desert-safari-adventure-dubai": {
    seededDescription: "Dune bashing, sunset views, and a traditional camp dinner.",
    description:
      "The classic Dubai evening desert safari: a 4x4 picks you up from your hotel in the afternoon and drives you into the red dunes outside the city for dune bashing, a photo stop at sunset, and an evening at a Bedouin-style camp. At the camp you can ride a camel, try sandboarding and henna, and watch tanoura and fire shows over a buffet BBQ dinner before you are driven back to your hotel.",
    duration: "About 6 hours (afternoon to night)",
    openingHours: "Daily; pick-up about 2:30–3:30pm, drop-off about 9–9:30pm",
    location: "Al Awir / Lahbab desert, about 45 minutes from Dubai city",
    bestTimeToVisit: "October to April, when evenings in the desert are cool",
    highlights: [
      "Dune bashing in a 4x4 Land Cruiser with an experienced driver",
      "Sunset photo stop on the red dunes",
      "Short camel ride and sandboarding at the camp",
      "Tanoura dance and fire show",
      "Buffet BBQ dinner with vegetarian options",
    ],
    included: [
      "Pick-up and drop-off from hotels in central Dubai (shared 4x4)",
      "Dune bashing, about 30–45 minutes",
      "Camel ride, sandboarding and henna at the camp",
      "Buffet BBQ dinner, water, soft drinks, tea and coffee",
      "Live entertainment shows",
    ],
    excluded: [
      "Quad biking and dune buggy rides (optional, paid at the camp)",
      "Private 4x4 (available at extra cost)",
      "Photos sold at the camp",
      "Tips for drivers and staff",
    ],
    itinerary: [
      "Pick-up from your hotel lobby between about 2:30pm and 3:30pm.",
      "Drive to the desert and stop to let the tyres down before the dunes.",
      "Dune bashing in the 4x4, then a sunset stop for photos.",
      "Arrive at the camp for camel rides, sandboarding, henna and Arabic coffee.",
      "Buffet BBQ dinner while the tanoura and fire shows run.",
      "Drive back to Dubai, arriving at your hotel around 9–9:30pm.",
    ],
    importantInfo: [
      "Dune bashing is not recommended for pregnant women, people with back or heart problems, or children under 3; ask for a no-dune-bashing seat.",
      "Wear light, loose clothes and closed shoes; carry a light jacket for November to February evenings.",
      "Food at the camp is halal.",
      "Hotels outside central Dubai (e.g. Sharjah, Jebel Ali) may have a pick-up surcharge.",
    ],
    faqs: [
      {
        question: "Is a Dubai desert safari safe?",
        answer:
          "Yes, when you book a licensed operator. Drivers are trained for dune driving and vehicles have roll cages and seat belts. Dune bashing is bumpy, so people with back problems, pregnant women and very young children should skip that part and ride in a vehicle that drives to the camp directly.",
      },
      {
        question: "What should I wear on a desert safari?",
        answer:
          "Light, loose cotton clothes, sunglasses and closed shoes or sandals you don't mind filling with sand. From November to February the desert gets cool after sunset, so bring a light jacket or shawl. Modest clothing is fine for the shows and dinner.",
      },
      {
        question: "Is the food at the desert camp halal?",
        answer:
          "Yes. Food served at Dubai desert camps is halal, and the buffet usually has grilled chicken and lamb, rice, salads, Arabic bread and vegetarian dishes.",
      },
      {
        question: "Evening or morning desert safari: which is better?",
        answer:
          "The evening safari is the most popular because it includes sunset, the shows and dinner. A morning safari is shorter (about 4 hours), cooler in summer and better for photos and sandboarding, but has no dinner or shows.",
      },
    ],
  },

  "clifton-beach-evening-karachi": {
    seededDescription: "Sunset, camel rides, and coastal snacks.",
    description:
      "Clifton Beach, also known as Sea View, is Karachi's best-known stretch of coast and the city's favourite evening outing. Come before sunset to walk on the sand, take a camel or horse ride, and snack on corn, chaat and fresh coconut from the stalls, then stay on for the cooler breeze and the lights along the promenade. Do Darya, a short drive along the coast, has seafood restaurants built over the water.",
    duration: "2–3 hours",
    openingHours: "Open all day; busiest from late afternoon to night",
    location: "Sea View, Clifton, Karachi",
    bestTimeToVisit: "October to March, an hour before sunset",
    highlights: [
      "Sunset over the Arabian Sea",
      "Camel and horse rides along the shore",
      "Street food: bhutta, chaat, gola ganda and fresh coconut",
      "Seafood dinner at Do Darya by the water",
    ],
    included: ["Free public beach access"],
    excluded: [
      "Camel and horse rides (agree the price before you ride)",
      "Food and drinks",
      "Transport to and from the beach",
    ],
    itinerary: [
      "Arrive at Sea View in the late afternoon and walk along the promenade.",
      "Take a short camel or horse ride along the shore.",
      "Watch the sunset over the Arabian Sea.",
      "Try street snacks from the beach stalls.",
      "Drive 10–15 minutes to Do Darya for a seafood dinner by the water.",
    ],
    importantInfo: [
      "Swimming is dangerous here; during the monsoon months (usually June to August) the city often bans entering the sea.",
      "Weekends and public holidays are very crowded; weekday evenings are calmer.",
      "Keep phones and wallets secure in crowds.",
      "Agree ride and parking prices before you pay.",
    ],
    faqs: [
      {
        question: "Is Clifton Beach free to visit?",
        answer:
          "Yes. Entry to Clifton Beach (Sea View) is free. You only pay for parking, rides and food. Agree the price of camel and horse rides before you get on.",
      },
      {
        question: "Can you swim at Clifton Beach?",
        answer:
          "It is not recommended. The currents are strong, there are few lifeguards, and during the monsoon months the city usually bans going into the water. Paddling at the edge in calm winter weather is what most visitors do.",
      },
      {
        question: "What is the best time to go to Clifton Beach?",
        answer:
          "Between October and March, arriving about an hour before sunset. The weather is pleasant, the sea is calmer and you can stay on for street food and the breeze after dark. Weekday evenings are less crowded than weekends.",
      },
    ],
  },

  "corniche-sunset-walk-jeddah": {
    seededDescription: "A relaxed coastal promenade with dining and sea views.",
    description:
      "The Jeddah Corniche is a 30-kilometre waterfront along the Red Sea, with landscaped walkways, beaches, playgrounds, open-air sculptures and plenty of cafés and restaurants. An evening walk takes in the Al Rahmah \"floating\" mosque standing over the water and, after dark, King Fahd's Fountain, which shoots water higher than almost any fountain in the world. It is a favourite with families and an easy outing before or after Umrah.",
    duration: "2–3 hours",
    openingHours: "Open all day; most lively from sunset to late night",
    location: "North and Middle Corniche, Jeddah",
    bestTimeToVisit: "November to March, from late afternoon",
    highlights: [
      "Sunset over the Red Sea",
      "Al Rahmah (Floating) Mosque over the water",
      "King Fahd's Fountain lit up at night",
      "Open-air sculptures and seafront cafés",
      "Family-friendly beaches and play areas",
    ],
    included: ["Free public access to the promenade"],
    excluded: ["Food and drinks", "Transport to the Corniche"],
    itinerary: [
      "Start at the Al Rahmah Mosque in the late afternoon.",
      "Walk along the Middle Corniche promenade as the sun sets.",
      "Stop for fresh juice or dinner at one of the seafront restaurants.",
      "Head towards the city centre waterfront to see King Fahd's Fountain lit up.",
    ],
    importantInfo: [
      "Dress modestly; shorts above the knee and sleeveless tops are not appropriate.",
      "Summer (June to September) is hot and humid even at night.",
      "Use Careem or Uber to get there; parking fills up at weekends.",
    ],
    faqs: [
      {
        question: "Is the Jeddah Corniche free?",
        answer:
          "Yes. The Corniche promenade, the public beaches and the views of King Fahd's Fountain are free. You pay only for food, drinks and any private beach clubs.",
      },
      {
        question: "When does King Fahd's Fountain operate?",
        answer:
          "The fountain usually runs in the evening and is lit up after dark; timings can change and it sometimes stops for maintenance or high winds. The best views are from the Corniche near the city centre.",
      },
      {
        question: "Can I visit the Corniche after Umrah?",
        answer:
          "Yes. Jeddah is about 1–1.5 hours from Makkah by road or 30–40 minutes on the Haramain train, so many pilgrims spend an evening on the Corniche before flying home from Jeddah.",
      },
    ],
  },

  "historic-old-city-tour-istanbul": {
    seededDescription: "Hagia Sophia, Blue Mosque, and Grand Bazaar highlights.",
    description:
      "A guided walk through Sultanahmet, the historic heart of Istanbul and a UNESCO World Heritage Site. You see the Hagia Sophia, the Blue Mosque (Sultan Ahmed Mosque) with its blue Iznik tiles, the Hippodrome of Constantinople and the Basilica Cistern, then end in the Grand Bazaar, one of the oldest covered markets in the world. Your guide explains 1,500 years of Byzantine and Ottoman history as you go.",
    duration: "About 6 hours",
    openingHours: "Daily tours (Grand Bazaar closed on Sundays)",
    location: "Sultanahmet, Fatih, Istanbul",
    bestTimeToVisit: "Morning start; April–May and September–November",
    highlights: [
      "Hagia Sophia, built in 537 and now a mosque",
      "Blue Mosque and its Iznik-tiled interior",
      "Hippodrome and the Egyptian Obelisk",
      "Basilica Cistern under the old city",
      "Grand Bazaar with over 4,000 shops",
    ],
    included: [
      "Licensed English-speaking guide",
      "Walking tour of Sultanahmet",
      "Free time in the Grand Bazaar",
    ],
    excluded: [
      "Entry fees (Hagia Sophia visitor gallery and Basilica Cistern are paid)",
      "Hotel transfers",
      "Lunch and drinks",
    ],
    itinerary: [
      "Meet your guide in Sultanahmet Square in the morning.",
      "Visit the Blue Mosque (outside prayer times).",
      "Walk across the Hippodrome to see the Egyptian Obelisk and Serpent Column.",
      "Visit the Hagia Sophia.",
      "Go underground to the Basilica Cistern.",
      "Finish with free time in the Grand Bazaar.",
    ],
    importantInfo: [
      "Mosques close to visitors for about 90 minutes at each prayer time and on Friday at midday.",
      "Women must cover their hair, shoulders and knees in mosques; men need long trousers.",
      "Foreign visitors pay an entry fee for the Hagia Sophia gallery (about €25).",
      "The Grand Bazaar is closed on Sundays and public holidays.",
    ],
    faqs: [
      {
        question: "Is the Blue Mosque free to visit?",
        answer:
          "Yes. The Blue Mosque (Sultan Ahmed Mosque) is free, but it closes to visitors during the five daily prayers and on Friday around midday. Visitors must dress modestly, and women need to cover their hair.",
      },
      {
        question: "Do you have to pay to enter the Hagia Sophia?",
        answer:
          "Muslims coming to pray can enter the prayer hall free. Foreign tourists pay an entry fee (around €25) for the visitor route through the upper gallery, which is separate from the worshippers' entrance.",
      },
      {
        question: "Can I pray Jummah at the Blue Mosque or Hagia Sophia?",
        answer:
          "Yes. Both are working mosques. Arrive early on Friday because both fill up well before the Jummah prayer.",
      },
      {
        question: "Is the Grand Bazaar open every day?",
        answer:
          "No. The Grand Bazaar is open Monday to Saturday, roughly 9am to 7pm, and closed on Sundays and religious holidays. Bargaining is expected in most shops.",
      },
    ],
  },

  "london-eye-experience-london": {
    seededDescription: "Panoramic skyline views from the Thames.",
    description:
      "The London Eye is a 135-metre observation wheel on the South Bank of the Thames. A full rotation in one of its 32 glass capsules takes about 30 minutes and gives you views of up to 40 kilometres on a clear day, taking in the Houses of Parliament, Big Ben, Buckingham Palace and St Paul's Cathedral. Pair it with a walk along the South Bank or across Westminster Bridge.",
    duration: "30-minute ride, 1–1.5 hours with queues",
    openingHours: "Daily from about 10–11am; closing time varies by season",
    location: "South Bank, London SE1 (Waterloo or Westminster station)",
    bestTimeToVisit: "Weekday mornings or the last slot before sunset",
    highlights: [
      "Views of Big Ben and the Houses of Parliament",
      "Capsules with all-round glass walls",
      "Up to 40 km of view on a clear day",
      "Short walk to Westminster Abbey and the South Bank",
    ],
    included: ["Standard entry for one rotation (about 30 minutes)"],
    excluded: [
      "Fast-track entry (separate ticket)",
      "River cruise combo",
      "Transport to the South Bank",
    ],
    itinerary: [
      "Arrive 15 minutes before your time slot and join the boarding queue.",
      "Pass through security and step into a slowly moving capsule.",
      "Enjoy one full 30-minute rotation over the Thames.",
      "Walk to Westminster Bridge for the classic Big Ben photo.",
    ],
    importantInfo: [
      "Tickets are cheaper online than at the counter.",
      "Bags are security-checked; large luggage is not allowed.",
      "The wheel can pause in high winds, and it closes for maintenance for a period each January.",
    ],
    faqs: [
      {
        question: "How long is the London Eye ride?",
        answer:
          "One rotation takes about 30 minutes. With security and queues, plan 1 to 1.5 hours, or less with a fast-track ticket.",
      },
      {
        question: "When is the best time to ride the London Eye?",
        answer:
          "Weekday mornings have the shortest queues. For photos, book the slot just before sunset; in November and December the sun sets around 4pm in London.",
      },
      {
        question: "Is the London Eye worth it?",
        answer:
          "For first-time visitors, yes: it is the easiest way to see central London's landmarks in one go. If you want a free alternative, the Sky Garden at 20 Fenchurch Street has free tickets that must be booked in advance.",
      },
    ],
  },

  "petronas-towers-skybridge-kuala-lumpur": {
    seededDescription: "Iconic skyline views and tower exhibits.",
    description:
      "The Petronas Twin Towers are 452 metres tall and were the tallest buildings in the world from 1998 to 2004. The visit takes you to the Skybridge linking the two towers on levels 41 and 42 at 170 metres, then up to the observation deck on level 86 at 370 metres for views across Kuala Lumpur. Afterwards, the KLCC Park fountain show and Suria KLCC mall are right at the foot of the towers.",
    duration: "About 1 hour",
    openingHours: "Tuesday–Sunday, about 9am–9pm; closed Mondays and Friday 1–2:30pm",
    location: "KLCC, Kuala Lumpur City Centre (KLCC LRT station)",
    bestTimeToVisit: "Book the first slot of the day or just before sunset",
    highlights: [
      "Skybridge walk between the towers at 170 metres",
      "Level 86 observation deck at 370 metres",
      "Views of KL Tower and the city skyline",
      "Lake Symphony fountain show in KLCC Park in the evening",
    ],
    included: [
      "Timed entry ticket to the Skybridge and level 86 observation deck",
      "Guided visit with lift rides",
    ],
    excluded: ["Hotel transfers", "Food and drinks"],
    itinerary: [
      "Check in at the concourse level of Tower 2, 15 minutes before your slot.",
      "Take the lift to the Skybridge on level 41 for about 10 minutes.",
      "Continue to the observation deck on level 86.",
      "Return to Suria KLCC and walk out to KLCC Park.",
    ],
    importantInfo: [
      "Tickets are released in timed slots and often sell out days ahead.",
      "Closed on Mondays, and on Friday from 1pm to 2:30pm for Jummah.",
      "Children under 3 enter free.",
    ],
    faqs: [
      {
        question: "Do I need to book Petronas Towers tickets in advance?",
        answer:
          "Yes. Visits run in timed slots with limited places, and weekend and evening slots often sell out several days ahead. Book as soon as your travel dates are fixed.",
      },
      {
        question: "Is the Petronas Towers open on Fridays?",
        answer:
          "Yes, but it closes between 1pm and 2:30pm for Friday prayers. It is closed all day on Mondays.",
      },
      {
        question: "Which is better: Petronas Towers or KL Tower?",
        answer:
          "Petronas is the famous one, and the Skybridge is unique. KL Tower (Menara KL) is a little higher above sea level because it stands on a hill, has a glass Sky Box, and gives you a view of the Petronas Towers themselves. If you have time, do both.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// New activities for the Q4 2026 winter season (keyed by destination slug).
// ---------------------------------------------------------------------------
const NEW_ACTIVITIES = {
  dubai: [
    {
      title: "Global Village Dubai Entry Ticket",
      category: "shopping",
      cost: "PKR 2,000",
      description:
        "Global Village is Dubai's biggest winter festival park. Season 31 runs from 14 October 2026 to May 2027 with around 30 country pavilions, including Pakistan, where you can shop for handicrafts, eat street food from around the world and watch thousands of live shows, fireworks and drone shows. Rides, the Festival Wheel and thrill attractions are inside the same park. It opens in the evening and is busiest on weekends.",
      seoTitle: "Global Village Dubai Tickets 2026–27",
      seoDescription:
        "Global Village Dubai Season 31 entry tickets from PKR 2,000. Timings, Pakistan pavilion, fireworks and tips for visiting Oct 2026–May 2027.",
      duration: "4–5 hours",
      openingHours: "Daily from 4pm to midnight (1am on weekends and holidays)",
      location: "Sheikh Mohammed Bin Zayed Road (E311), Dubailand",
      bestTimeToVisit: "Weekday evenings, November to March",
      highlights: [
        "Around 30 pavilions, including Pakistan, Turkey and Saudi Arabia",
        "Street food from over 250 dining spots",
        "Fireworks and drone shows on set nights",
        "Festival Wheel and the Carnaval ride area",
        "Live cultural performances on the main stage",
      ],
      included: ["General entry ticket for one evening"],
      excluded: [
        "Rides and attractions (paid with a ride card)",
        "Food and shopping",
        "Transport to Global Village",
      ],
      itinerary: [
        "Arrive soon after 4pm to beat the queues.",
        "Walk through the country pavilions; the Pakistan pavilion is a favourite for clothes and food.",
        "Eat dinner at the food stalls around the lake.",
        "Watch the main stage show and the fireworks (on show nights).",
        "Finish with a ride on the Festival Wheel for views of the park.",
      ],
      importantInfo: [
        "Weekday tickets are cheaper than weekend and holiday tickets.",
        "Buy online to skip the ticket counter.",
        "Rides need a separately loaded ride card.",
        "RTA bus routes run from Al Rashidiya, Union, Mall of the Emirates and Al Ghubaiba stations.",
      ],
      faqs: [
        {
          question: "When does Global Village Season 31 open and close?",
          answer:
            "Global Village Season 31 opened on 14 October 2026 and runs until May 2027. The exact closing date is usually announced later in the season.",
        },
        {
          question: "How much is the Global Village ticket?",
          answer:
            "General entry is about AED 25 on weekdays and AED 30 on weekends and public holidays when bought online (around PKR 2,000–2,300). Children under 3 and visitors over 65 usually enter free. Rides and food cost extra.",
        },
        {
          question: "Is there a Pakistan pavilion at Global Village?",
          answer:
            "Yes. The Pakistan pavilion is one of the most popular, with embroidered clothes, shawls, jewellery, handicrafts and food stalls selling Pakistani snacks and sweets.",
        },
        {
          question: "How long do you need at Global Village?",
          answer:
            "Plan 4 to 5 hours to see most pavilions, eat and catch a show. Families who want rides as well often stay until closing.",
        },
      ],
    },
    {
      title: "Dubai Marina Dhow Cruise with Dinner",
      category: "food",
      cost: "PKR 10,700",
      description:
        "A two-hour evening cruise on a traditional wooden dhow through Dubai Marina, past the lit-up towers of JBR, the Marina skyline and Ain Dubai. Dinner is an international buffet served on board while a tanoura dancer and live music entertain the guests. The open-air upper deck is the best place for photos, especially from November to March when the evenings are cool.",
      seoTitle: "Dubai Marina Dhow Cruise with Dinner",
      seoDescription:
        "Dubai Marina dhow cruise with buffet dinner and tanoura show from PKR 10,700. Timings, what's included and tips for the best deck.",
      duration: "About 2 hours",
      openingHours: "Daily, boarding about 8pm",
      location: "Dubai Marina Mall jetty, Dubai Marina",
      bestTimeToVisit: "October to April evenings",
      highlights: [
        "Dubai Marina and JBR skyline lit up at night",
        "View of Ain Dubai on Bluewaters Island",
        "International buffet dinner with halal food",
        "Tanoura dance and live music on board",
      ],
      included: [
        "2-hour cruise on a traditional dhow",
        "Buffet dinner with soft drinks and water",
        "Live entertainment",
      ],
      excluded: [
        "Hotel transfers (available at extra cost)",
        "Upper-deck seating on some boats",
        "Tips",
      ],
      itinerary: [
        "Check in at the Dubai Marina jetty about 30 minutes before boarding.",
        "Board the dhow around 8pm and pick your table.",
        "Cruise along the Marina towards JBR and Bluewaters Island.",
        "Dinner buffet opens while the tanoura show starts.",
        "Return to the jetty after about 2 hours.",
      ],
      importantInfo: [
        "Food is halal; ask the operator in advance for vegetarian or children's meals.",
        "Upper-deck seats are open air and can be breezy in winter.",
        "Nearest metro: Dubai Marina or the Dubai Tram to Marina Mall.",
      ],
      faqs: [
        {
          question: "Which is better: the Marina dhow cruise or the Creek dhow cruise?",
          answer:
            "The Marina cruise has the modern skyline, JBR and Ain Dubai and is the more popular choice. The Dubai Creek cruise is quieter, older-style and usually a little cheaper, passing the souks of Deira and Bur Dubai.",
        },
        {
          question: "Is food on the dhow cruise halal?",
          answer:
            "Yes. The buffet on Dubai dhow cruises is halal and usually includes grilled chicken, rice, curries, salads and desserts, with vegetarian dishes.",
        },
        {
          question: "Is the dhow cruise good for families?",
          answer:
            "Yes. It is calm water, seated, and finishes by about 10:30pm. Children under 4 usually go free, and children's tickets are discounted.",
        },
      ],
    },
    {
      title: "Museum of the Future Ticket",
      category: "tourist-attraction",
      cost: "PKR 12,900",
      description:
        "The Museum of the Future is the silver, ring-shaped building on Sheikh Zayed Road covered in Arabic calligraphy. Inside, five floors of immersive exhibits imagine life in 2071: a space station orbiting Earth, a lab cataloguing thousands of species, a healing and wellness floor and a hands-on play area for children. Visits run in timed slots, and tickets regularly sell out in the winter season.",
      seoTitle: "Museum of the Future Dubai Tickets",
      seoDescription:
        "Museum of the Future Dubai tickets from PKR 12,900. Timed entry, what's inside, how long to spend and tips to book before it sells out.",
      duration: "2–3 hours",
      openingHours: "Daily, 10am–9:30pm (last entry 7:30pm)",
      location: "Sheikh Zayed Road, next to Emirates Towers metro station",
      bestTimeToVisit: "First slot of the morning on a weekday",
      highlights: [
        "One of the most photographed buildings in Dubai",
        "Immersive space station experience, OSS Hope",
        "The Library of Life with thousands of species",
        "Future Heroes play area for children",
      ],
      included: ["Timed entry ticket to all exhibition floors"],
      excluded: ["Hotel transfers", "Food and drinks", "Fast-track or premium tickets"],
      itinerary: [
        "Arrive 15 minutes before your time slot at the main entrance.",
        "Take the lift to the space station journey on the top floor.",
        "Walk down through the Library of Life and the wellness floor.",
        "Finish at the Tomorrow, Today floor and the gift shop.",
        "Take photos of the building from the bridge to Emirates Towers metro.",
      ],
      importantInfo: [
        "Tickets are for a specific date and time and often sell out on weekends.",
        "Children under 3 and people of determination enter free (booking needed).",
        "Emirates Towers metro station is connected by a footbridge.",
      ],
      faqs: [
        {
          question: "How much is the Museum of the Future ticket?",
          answer:
            "General admission is about AED 149–169 (around PKR 11,500–12,900), depending on the date and seller. Premium tickets with fast-track entry cost more. Check the price in PKR with an adviser before you book.",
        },
        {
          question: "Is the Museum of the Future worth it?",
          answer:
            "It is worth it if you enjoy immersive, interactive exhibits and architecture. The building itself is free to photograph from outside, so if you are short on time or budget, a photo stop may be enough.",
        },
        {
          question: "How long do you need at the Museum of the Future?",
          answer:
            "Most visitors spend 2 to 3 hours inside. Families with children often stay longer in the Future Heroes play area.",
        },
      ],
    },
    {
      title: "Dubai Frame Ticket",
      category: "tourist-attraction",
      cost: "PKR 4,000",
      description:
        "The Dubai Frame is a 150-metre-tall golden picture frame in Zabeel Park. A lift takes you to the 93-metre-long sky deck at the top, where part of the floor is glass. On one side you see old Dubai — Deira, Karama and the Creek — and on the other the modern skyline of Sheikh Zayed Road. A museum on the ground floor shows how Dubai grew from a fishing village, and the exit gallery imagines the city 50 years from now.",
      seoTitle: "Dubai Frame Tickets – Price & Timings",
      seoDescription:
        "Dubai Frame tickets from PKR 4,000. See old and new Dubai from the glass sky deck, plus timings, how long it takes and the best time to go.",
      duration: "1–1.5 hours",
      openingHours: "Daily, 9am–9pm (last entry 8:30pm)",
      location: "Zabeel Park Gate 3, Al Kifaf, Dubai",
      bestTimeToVisit: "Late afternoon so you see the view by day and at sunset",
      highlights: [
        "Glass-floor walk 150 metres above the ground",
        "Old Dubai and new Dubai side by side",
        "Museum of Dubai's history on the ground floor",
        "Future Dubai gallery on the way out",
      ],
      included: ["Entry to the museum, sky deck and future gallery"],
      excluded: ["Hotel transfers", "Food and drinks"],
      itinerary: [
        "Enter through Zabeel Park Gate 3 and visit the history gallery.",
        "Take the lift to the top of the frame.",
        "Walk across the sky deck and its glass floor section.",
        "Come down through the Future Dubai gallery.",
      ],
      importantInfo: [
        "Nearest metro: Al Jafiliya (Red Line), then a 10-minute taxi or walk.",
        "Zabeel Park itself charges a small separate entry fee.",
        "Queues for the lift are longest around sunset at weekends.",
      ],
      faqs: [
        {
          question: "How much is the Dubai Frame ticket?",
          answer:
            "Adult tickets are about AED 50–53 (around PKR 4,000), children 3–12 are about AED 20, and children under 3 enter free. Combo tickets with other attractions are also available.",
        },
        {
          question: "Dubai Frame or Burj Khalifa: which should I choose?",
          answer:
            "The Burj Khalifa is much higher and shows Downtown Dubai and the Gulf. The Dubai Frame is cheaper, less crowded and shows old and new Dubai side by side. If you have the budget, do both on different days.",
        },
      ],
    },
    {
      title: "Dubai Miracle Garden Ticket",
      category: "tourist-attraction",
      cost: "PKR 8,000",
      description:
        "Dubai Miracle Garden is the world's largest natural flower garden, with around 150 million flowers arranged into hearts, arches, castles and a full-size Emirates A380. Season 15 runs from 8 October 2026 to 31 May 2027, with new displays and weekly themes. It only opens in the cooler months, so a winter trip is the time to see it. Next door, the Dubai Butterfly Garden can be added with a combo ticket.",
      seoTitle: "Dubai Miracle Garden Tickets 2026–27",
      seoDescription:
        "Dubai Miracle Garden Season 15 tickets from PKR 8,000. Opening dates Oct 2026–May 2027, timings, Butterfly Garden combo and visiting tips.",
      duration: "2–3 hours",
      openingHours: "Daily, about 9am–9pm (to 11pm on weekends)",
      location: "Al Barsha South 3, Dubailand",
      bestTimeToVisit: "Weekday late afternoon, November to March",
      highlights: [
        "Life-size Emirates A380 covered in flowers",
        "Heart Tunnel and Umbrella Tunnel",
        "Floral castles and seasonal displays",
        "Butterfly Garden next door with a combo ticket",
      ],
      included: ["General entry ticket for one day"],
      excluded: ["Butterfly Garden (combo ticket)", "Transport", "Food and drinks", "VAT where not shown"],
      itinerary: [
        "Arrive in the late afternoon when it is cooler.",
        "Walk through the Heart Tunnel and the Umbrella Tunnel.",
        "Photograph the Emirates A380 floral display.",
        "Stay until dusk when the garden lights come on.",
      ],
      importantInfo: [
        "Open only in the cooler months; closed in summer.",
        "There is no metro station nearby; take a taxi or a tour transfer.",
        "Prices for tourists differ from UAE resident prices.",
      ],
      faqs: [
        {
          question: "When is Dubai Miracle Garden open in 2026?",
          answer:
            "Season 15 opened on 8 October 2026 and runs until 31 May 2027. The garden closes in summer because of the heat.",
        },
        {
          question: "How much is the Dubai Miracle Garden ticket?",
          answer:
            "Adult tickets for tourists are about AED 100 and children's tickets about AED 80, plus VAT (around PKR 8,000 for an adult). A combo with the Dubai Butterfly Garden costs about AED 140.",
        },
        {
          question: "How do you get to Dubai Miracle Garden?",
          answer:
            "There is no metro stop nearby, so take a taxi, Careem or Uber, or book a tour with return transfers. From Downtown Dubai it is about 25–30 minutes by road.",
        },
      ],
    },
    {
      title: "Abu Dhabi City Tour from Dubai",
      category: "cultural",
      cost: "PKR 13,000",
      description:
        "A full-day tour from Dubai to Abu Dhabi, the UAE capital, built around a visit to the Sheikh Zayed Grand Mosque, one of the largest mosques in the world, with 82 white marble domes and one of the world's largest hand-knotted carpets. The tour usually adds the Corniche, Qasr Al Watan (the Presidential Palace) photo stop, the Heritage Village and a drive past Yas Island, home of Ferrari World.",
      seoTitle: "Abu Dhabi City Tour from Dubai",
      seoDescription:
        "Abu Dhabi day tour from Dubai with Sheikh Zayed Grand Mosque, Corniche and Qasr Al Watan stop, from PKR 13,000. Itinerary and dress code.",
      duration: "8–9 hours",
      openingHours: "Daily except Friday; pick-up about 8–9am",
      location: "Pick-up from Dubai hotels; tour in Abu Dhabi (about 1.5 hours away)",
      bestTimeToVisit: "October to April",
      highlights: [
        "Sheikh Zayed Grand Mosque and its marble courtyard",
        "Photo stop at Qasr Al Watan, the Presidential Palace",
        "Abu Dhabi Corniche and Heritage Village",
        "Drive past Yas Island and Ferrari World",
      ],
      included: [
        "Return transport from Dubai hotels in an air-conditioned vehicle",
        "English-speaking guide",
        "Guided visit to the Sheikh Zayed Grand Mosque",
      ],
      excluded: [
        "Lunch",
        "Entry to Qasr Al Watan, Louvre Abu Dhabi or Ferrari World",
        "Mosque visitor fee where charged",
      ],
      itinerary: [
        "Hotel pick-up in Dubai in the morning and drive to Abu Dhabi.",
        "Guided visit of the Sheikh Zayed Grand Mosque.",
        "Photo stop at Qasr Al Watan and drive along the Corniche.",
        "Lunch break (own expense) and visit to the Heritage Village.",
        "Drive past Yas Island and return to Dubai in the evening.",
      ],
      importantInfo: [
        "Mosque dress code: long, loose clothes for everyone; women must cover their hair.",
        "Bring your passport or Emirates ID for mosque security.",
        "The mosque is closed to tourists on Friday mornings, so tours usually run Saturday to Thursday.",
      ],
      faqs: [
        {
          question: "Is there an entry fee for the Sheikh Zayed Grand Mosque?",
          answer:
            "Worshippers enter free. In September 2026 the mosque introduced a small visitor fee for tourists (reported as AED 10). Check the latest rule with your adviser when booking.",
        },
        {
          question: "What should I wear to the Sheikh Zayed Grand Mosque?",
          answer:
            "Long, loose clothes covering arms and legs for men and women. Women must also cover their hair. Tight, short or see-through clothes are not allowed, so bring an abaya or long scarf with you.",
        },
        {
          question: "How far is Abu Dhabi from Dubai?",
          answer:
            "About 140 km, or 1.5 hours by road from central Dubai to the Sheikh Zayed Grand Mosque.",
        },
      ],
    },
  ],

  istanbul: [
    {
      title: "Bosphorus Sightseeing Cruise",
      category: "seaside",
      cost: "PKR 4,900",
      description:
        "A cruise along the Bosphorus, the strait that divides Istanbul between Europe and Asia. From the deck you see Dolmabahçe Palace, Ortaköy Mosque under the Bosphorus Bridge, Rumeli Fortress, the Maiden's Tower and the wooden waterfront mansions (yalı) of the old Ottoman families. It is the easiest way to understand the size of Istanbul and one of the best things to do on a first visit.",
      seoTitle: "Bosphorus Cruise Istanbul – Tickets",
      seoDescription:
        "Bosphorus sightseeing cruise in Istanbul from PKR 4,900. See Dolmabahçe Palace, Ortaköy Mosque and Rumeli Fortress between Europe and Asia.",
      duration: "About 2 hours",
      openingHours: "Daily departures, morning to sunset",
      location: "Eminönü or Kabataş pier, Istanbul",
      bestTimeToVisit: "Sunset cruise, April–May or September–November",
      highlights: [
        "Sail between Europe and Asia",
        "Dolmabahçe Palace from the water",
        "Ortaköy Mosque beneath the Bosphorus Bridge",
        "Rumeli Fortress and Ottoman waterfront mansions",
      ],
      included: ["2-hour sightseeing cruise", "Audio or live commentary on most boats"],
      excluded: ["Hotel transfers", "Food and drinks", "Dinner cruise upgrade"],
      itinerary: [
        "Board at Eminönü or Kabataş pier.",
        "Sail north past Dolmabahçe Palace and Ortaköy Mosque.",
        "Pass under the Bosphorus Bridge towards Rumeli Fortress.",
        "Turn back along the Asian shore past Beylerbeyi Palace.",
        "Return to the pier.",
      ],
      importantInfo: [
        "Upper deck is cold and windy from November to March; bring a jacket.",
        "Public Şehir Hatları ferries are a cheaper alternative with fewer stops explained.",
        "Dinner cruises with Turkish night shows are sold separately.",
      ],
      faqs: [
        {
          question: "Which Bosphorus cruise is best?",
          answer:
            "A 2-hour sightseeing cruise from Eminönü covers the main sights for most visitors. A sunset cruise has the best light. For a full day, the public long Bosphorus tour goes all the way to Anadolu Kavağı near the Black Sea.",
        },
        {
          question: "How long is a Bosphorus cruise?",
          answer:
            "Short sightseeing cruises take about 1.5 to 2 hours. The full public ferry tour to the Black Sea end takes most of the day, including a stop for lunch.",
        },
      ],
    },
    {
      title: "Topkapi Palace and Harem Ticket",
      category: "cultural",
      cost: "PKR 17,900",
      description:
        "Topkapi Palace was the home of the Ottoman sultans for almost 400 years. Its courtyards and pavilions sit above the meeting point of the Bosphorus and the Golden Horn. The Sacred Relics rooms hold items deeply respected by Muslims, including relics attributed to the Prophet Muhammad (peace be upon him), and the Treasury shows the famous Topkapi Dagger and Spoonmaker's Diamond. The Harem, where the sultan's family lived, is covered by the combined ticket.",
      seoTitle: "Topkapi Palace Tickets – Harem Included",
      seoDescription:
        "Topkapi Palace and Harem tickets from PKR 17,900. Sacred Relics, Treasury, opening days and tips for visiting the Ottoman palace in Istanbul.",
      duration: "2–3 hours",
      openingHours: "Wednesday–Monday, 9am–6:30pm in winter; closed Tuesdays",
      location: "Cankurtaran, Sultanahmet, Istanbul",
      bestTimeToVisit: "Opening time, weekdays",
      highlights: [
        "Sacred Relics (Holy Relics) chamber",
        "Imperial Treasury with the Spoonmaker's Diamond",
        "The Harem and the sultans' private rooms",
        "Terrace views over the Bosphorus",
      ],
      included: ["Combined entry ticket to the palace, Harem and Hagia Irene"],
      excluded: ["Guide or audio guide", "Hotel transfers", "Food and drinks"],
      itinerary: [
        "Enter through the Imperial Gate behind the Hagia Sophia.",
        "Visit the Harem first, before the crowds.",
        "See the Sacred Relics and the Treasury in the third courtyard.",
        "Finish on the fourth-courtyard terraces overlooking the Bosphorus.",
      ],
      importantInfo: [
        "Closed every Tuesday.",
        "Queues for the Sacred Relics room can be long by midday.",
        "Prices for foreign visitors are set in Turkish lira and change often.",
      ],
      faqs: [
        {
          question: "Is the Harem included in the Topkapi Palace ticket?",
          answer:
            "The combined ticket includes the Harem and Hagia Irene. Check that your ticket is the combined one, as palace-only tickets have been sold in some years.",
        },
        {
          question: "What day is Topkapi Palace closed?",
          answer: "Topkapi Palace is closed every Tuesday. It is open the other six days of the week.",
        },
        {
          question: "Can I see the Prophet's relics at Topkapi Palace?",
          answer:
            "Yes. The Sacred Relics chamber in the third courtyard displays relics attributed to the Prophet Muhammad (peace be upon him) and other prophets, and Quran recitation plays there throughout the day.",
        },
      ],
    },
    {
      title: "Galata Tower Ticket",
      category: "tourist-attraction",
      cost: "PKR 9,800",
      description:
        "The Galata Tower is a 14th-century Genoese stone tower in the Beyoğlu district. A lift and a short climb take you to the narrow balcony that circles the top, with 360° views of the Golden Horn, the Old City's domes and minarets, and the Bosphorus. After your visit, walk downhill through Karaköy or up to Istiklal Avenue and Taksim Square.",
      seoTitle: "Galata Tower Istanbul – Tickets & Hours",
      seoDescription:
        "Galata Tower tickets from PKR 9,800. 360° views over the Golden Horn and Old City, opening hours, queues and the best time to visit.",
      duration: "45 minutes–1 hour",
      openingHours: "Daily, about 8:30am–11pm",
      location: "Bereketzade, Beyoğlu, Istanbul",
      bestTimeToVisit: "Opening time or late evening for shorter queues",
      highlights: [
        "360° balcony view at the top",
        "Golden Horn and Old City skyline",
        "Museum displays inside the tower",
        "Close to Istiklal Avenue and Karaköy",
      ],
      included: ["Entry to the tower and viewing balcony"],
      excluded: ["Transport", "Food and drinks"],
      itinerary: [
        "Join the queue at the base of the tower.",
        "Take the lift up and climb the last floors.",
        "Walk around the balcony for the full view.",
        "Walk down the Galata steps to Karaköy for a Turkish breakfast or baklava.",
      ],
      importantInfo: [
        "The balcony is narrow and one-way; it can feel crowded at sunset.",
        "Queues at sunset can be over an hour.",
        "Not suitable for people with a fear of heights.",
      ],
      faqs: [
        {
          question: "How much is the Galata Tower ticket?",
          answer:
            "Foreign visitors pay about €30 (around PKR 9,800). The Museum Pass Istanbul includes Galata Tower if you plan to visit several museums.",
        },
        {
          question: "When is the best time to visit Galata Tower?",
          answer:
            "Right at opening or late in the evening. Sunset has the best light but also the longest queue.",
        },
      ],
    },
  ],

  "kuala-lumpur": [
    {
      title: "Batu Caves Visit",
      category: "cultural",
      cost: "Free",
      description:
        "Batu Caves is a limestone hill 13 km north of Kuala Lumpur with a series of caves and Hindu cave temples. A 42-metre golden statue of Lord Murugan stands at the foot of 272 rainbow-painted steps, which climb to the main Temple Cave under a huge natural opening in the rock. Long-tailed macaques live around the steps. It is one of the most visited sights in Malaysia and an easy half-day from the city centre by KTM train.",
      seoTitle: "Batu Caves Kuala Lumpur – Visit Guide",
      seoDescription:
        "Batu Caves near Kuala Lumpur: free entry, 272 rainbow steps, opening hours, dress code and how to get there by KTM train from KL Sentral.",
      duration: "2–3 hours",
      openingHours: "Daily, about 7am–9pm",
      location: "Gombak, Selangor (Batu Caves KTM station)",
      bestTimeToVisit: "Early morning, before the heat and tour buses",
      highlights: [
        "42-metre golden statue at the entrance",
        "272 rainbow-painted steps",
        "Temple Cave under a natural skylight",
        "Easy train ride from KL Sentral",
      ],
      included: ["Free entry to the main Temple Cave"],
      excluded: ["Paid side caves", "Transport", "Sarong rental if needed"],
      itinerary: [
        "Take the KTM Komuter train from KL Sentral to Batu Caves (about 30–40 minutes).",
        "Photograph the golden statue and the rainbow steps.",
        "Climb the 272 steps to the Temple Cave.",
        "Explore the cave and come back down for a drink at the stalls.",
      ],
      importantInfo: [
        "Cover shoulders and knees; sarongs can be rented at the bottom.",
        "Keep food and bags closed: the monkeys snatch them.",
        "The climb is steep; go early to avoid the midday heat.",
        "Thaipusam (late January or February) brings very large crowds.",
      ],
      faqs: [
        {
          question: "Is Batu Caves free?",
          answer:
            "Yes. Entry to the main Temple Cave at the top of the 272 steps is free. A few side caves charge a small fee.",
        },
        {
          question: "How do I get to Batu Caves from Kuala Lumpur?",
          answer:
            "Take the KTM Komuter train from KL Sentral to Batu Caves station; it takes about 30–40 minutes and stops right at the entrance. A Grab ride from the city centre takes about 25–40 minutes depending on traffic.",
        },
        {
          question: "What should I wear to Batu Caves?",
          answer:
            "Clothes that cover shoulders and knees, as it is a place of worship. If you are wearing shorts, you can rent a sarong at the foot of the steps.",
        },
      ],
    },
    {
      title: "Genting Highlands Day Trip with Cable Car",
      category: "adventure",
      cost: "PKR 10,000",
      description:
        "A day trip from Kuala Lumpur to Genting Highlands, a cool hill resort about 1,800 metres up in the mountains, where the temperature is often around 18–22°C. The Awana SkyWay cable car carries you over the rainforest to the top, with a stop at the Chin Swee Caves Temple. At the summit there are indoor and outdoor theme parks, the SkyAvenue mall and restaurants. Many tours combine Genting with a morning stop at Batu Caves.",
      seoTitle: "Genting Highlands Day Trip from KL",
      seoDescription:
        "Genting Highlands day trip from Kuala Lumpur with Awana SkyWay cable car, from PKR 10,000. Itinerary, weather and theme park tips.",
      duration: "8–10 hours",
      openingHours: "Daily; pick-up about 8–9am",
      location: "Genting Highlands, Pahang (about 1 hour from Kuala Lumpur)",
      bestTimeToVisit: "Weekdays; avoid Malaysian school holidays",
      highlights: [
        "Awana SkyWay cable car over the rainforest",
        "Cool mountain weather all year",
        "Chin Swee Caves Temple",
        "SkyAvenue mall and Genting SkyWorlds theme park",
      ],
      included: [
        "Return transport from Kuala Lumpur hotels",
        "Return Awana SkyWay cable car ride",
        "Driver-guide",
      ],
      excluded: ["Theme park tickets", "Meals", "Tips"],
      itinerary: [
        "Morning pick-up from your KL hotel.",
        "Optional stop at Batu Caves on the way.",
        "Ride the Awana SkyWay up the mountain.",
        "Free time at the summit for the mall, theme park or temple.",
        "Cable car down and drive back to KL in the evening.",
      ],
      importantInfo: [
        "Bring a jacket: it is much cooler and can be misty or rainy.",
        "The cable car can stop in thunderstorms or for maintenance.",
        "Halal restaurants are available at the summit.",
      ],
      faqs: [
        {
          question: "Is Genting Highlands worth a day trip?",
          answer:
            "Yes, especially for families: the cool weather, the cable car and the theme parks make a good break from the heat of Kuala Lumpur. If you only want the view, the cable car and a walk around the summit take half a day.",
        },
        {
          question: "How cold is Genting Highlands?",
          answer:
            "Usually around 15–22°C, much cooler than Kuala Lumpur. Evenings can drop below 15°C, and it is often misty, so bring a light jacket.",
        },
      ],
    },
  ],

  london: [
    {
      title: "Hyde Park Winter Wonderland",
      category: "tourist-attraction",
      cost: "PKR 400",
      description:
        "Hyde Park Winter Wonderland is London's biggest Christmas festival, open from 19 November 2026 to 3 January 2027. It fills the park with a Bavarian-style Christmas market, an ice rink, the Giant Observation Wheel, the Magical Ice Kingdom ice-sculpture walk, circus shows and fairground rides, all lit up in the early winter darkness. Entry is cheap on off-peak weekdays, while rides and shows are paid separately.",
      seoTitle: "Winter Wonderland London 2026 Tickets",
      seoDescription:
        "Hyde Park Winter Wonderland 2026: 19 Nov–3 Jan, entry from PKR 400. Ice rink, Christmas market, rides and tips for timed entry slots.",
      duration: "3–4 hours",
      openingHours: "Daily 19 Nov 2026–3 Jan 2027, 10am–10pm (closed Christmas Day)",
      location: "Hyde Park, London W2 (Marble Arch or Hyde Park Corner station)",
      bestTimeToVisit: "Weekday afternoons in November",
      highlights: [
        "London's largest outdoor ice rink",
        "Giant Observation Wheel over Hyde Park",
        "Magical Ice Kingdom ice sculptures",
        "Christmas market stalls and festive food",
      ],
      included: ["Timed entry ticket to the park"],
      excluded: ["Rides, ice skating, shows and Ice Kingdom", "Food and drinks", "Transport"],
      itinerary: [
        "Enter at your booked time slot near Marble Arch or Hyde Park Corner.",
        "Walk through the Christmas market.",
        "Skate on the ice rink or visit the Magical Ice Kingdom (booked separately).",
        "Ride the Giant Observation Wheel after dark.",
      ],
      importantInfo: [
        "Entry is by timed ticket booked online; off-peak weekday slots are the cheapest.",
        "It is cold and dark by 4pm: wear warm layers and waterproof shoes.",
        "Halal food stalls are limited; check signs or eat nearby on Edgware Road.",
      ],
      faqs: [
        {
          question: "When is Winter Wonderland 2026?",
          answer:
            "Hyde Park Winter Wonderland runs from 19 November 2026 to 3 January 2027 and is closed on Christmas Day.",
        },
        {
          question: "How much is Winter Wonderland entry?",
          answer:
            "Advance entry is about £1 on off-peak weekdays in November, around £5.50 standard and £8.25 at peak times. Rides, skating and shows are paid separately.",
        },
        {
          question: "Is there halal food at Winter Wonderland?",
          answer:
            "There are some halal options, but not at every stall. Edgware Road, a short walk from Marble Arch, has many halal Pakistani, Lebanese and Turkish restaurants.",
        },
      ],
    },
    {
      title: "Warner Bros. Studio Tour London – Harry Potter",
      category: "tourist-attraction",
      cost: "PKR 21,800",
      description:
        "The Warner Bros. Studio Tour London – The Making of Harry Potter is a walk-through tour of the real sets, costumes and props from the Harry Potter films at Leavesden, north-west of London. Walk into the Great Hall, down Diagon Alley and onto Platform 9¾ with the Hogwarts Express, and finish at the giant model of Hogwarts. From 14 November 2026 to 17 January 2027, Hogwarts in the Snow covers the sets in snow and Christmas decorations.",
      seoTitle: "Harry Potter Studio Tour London Tickets",
      seoDescription:
        "Warner Bros. Studio Tour London tickets from PKR 21,800. Hogwarts in the Snow 2026, how to get there from London and how far ahead to book.",
      duration: "3.5–4 hours",
      openingHours: "Daily; timed entry from about 8:30am",
      location: "Leavesden, Watford WD25 (shuttle bus from Watford Junction)",
      bestTimeToVisit: "Hogwarts in the Snow, 14 Nov 2026–17 Jan 2027",
      highlights: [
        "The Great Hall and Gryffindor common room",
        "Platform 9¾ and the original Hogwarts Express",
        "Diagon Alley and Gringotts Bank",
        "The large Hogwarts castle model",
      ],
      included: ["Timed entry ticket to the studio tour", "Digital guide on some tickets"],
      excluded: [
        "Transport to Leavesden (train to Watford Junction plus shuttle bus)",
        "Food, drinks and Butterbeer",
        "Souvenirs",
      ],
      itinerary: [
        "Take the train from London Euston to Watford Junction (about 20 minutes).",
        "Board the studio shuttle bus to Leavesden.",
        "Enter at your time slot, starting with the Great Hall.",
        "Walk through the sets, Platform 9¾ and the Backlot café.",
        "Finish at the Hogwarts model and the shop.",
      ],
      importantInfo: [
        "Tickets sell out weeks ahead, especially in winter and school holidays.",
        "Tickets are only sold online, not at the door.",
        "Allow about 1.5 hours to travel each way from central London.",
      ],
      faqs: [
        {
          question: "How far in advance should I book the Harry Potter Studio Tour?",
          answer:
            "At least 4–8 weeks ahead for weekends, Christmas and school holidays; weekday slots in November are easier. Tickets are not sold on the day at the studio.",
        },
        {
          question: "How do I get to the Warner Bros. Studio Tour from London?",
          answer:
            "Take a train from London Euston to Watford Junction (about 20 minutes), then the studio shuttle bus (about 15 minutes). Coach packages from central London are also available.",
        },
      ],
    },
    {
      title: "Tower of London and Crown Jewels",
      category: "cultural",
      cost: "PKR 13,800",
      description:
        "The Tower of London is a 950-year-old royal fortress on the Thames and a UNESCO World Heritage Site. Inside you see the Crown Jewels, including the crowns used at coronations and the Cullinan diamonds, the White Tower with its royal armour, and the ravens that legend says protect the kingdom. Yeoman Warder (Beefeater) tours tell the stories of famous prisoners and executions, and Tower Bridge is next door.",
      seoTitle: "Tower of London Tickets – Crown Jewels",
      seoDescription:
        "Tower of London tickets with the Crown Jewels from PKR 13,800. Beefeater tours, opening hours and tips to avoid the Jewel House queue.",
      duration: "3–4 hours",
      openingHours: "About 9am–4:30pm in winter (Sun–Mon from 10am)",
      location: "Tower Hill, London EC3 (Tower Hill station)",
      bestTimeToVisit: "Opening time; go straight to the Crown Jewels",
      highlights: [
        "The Crown Jewels in the Jewel House",
        "Yeoman Warder (Beefeater) guided tour",
        "The White Tower and royal armour",
        "The Tower ravens and views of Tower Bridge",
      ],
      included: ["Entry to the Tower of London and Crown Jewels", "Yeoman Warder tour (when running)"],
      excluded: ["Tower Bridge exhibition", "Transport", "Food and drinks"],
      itinerary: [
        "Enter at opening time and head straight to the Jewel House.",
        "Join a Yeoman Warder tour from the main entrance.",
        "Visit the White Tower and the medieval palace.",
        "Walk the wall walks and finish with a view of Tower Bridge.",
      ],
      importantInfo: [
        "The Crown Jewels queue gets long after 11am.",
        "Lots of cobbles and steps; wear comfortable shoes.",
        "Children under 5 enter free.",
      ],
      faqs: [
        {
          question: "How much is the Tower of London ticket?",
          answer:
            "An adult ticket is about £37 (around PKR 13,800) and children 5–15 about £18.50, including the Crown Jewels. Children under 5 enter free.",
        },
        {
          question: "How long do you need at the Tower of London?",
          answer: "Plan 3 to 4 hours to see the Crown Jewels, join a Beefeater tour and visit the White Tower.",
        },
      ],
    },
  ],

  jeddah: [
    {
      title: "Al-Balad Historic Jeddah Walk",
      category: "cultural",
      cost: "Free",
      description:
        "Al-Balad is the historic heart of Jeddah and a UNESCO World Heritage Site. Its narrow lanes are lined with coral-stone houses up to 500 years old, decorated with carved wooden balconies (rawasheen) that kept homes cool before air-conditioning. Walk past Nasseef House, the Al-Shafi'i Mosque and the old souks selling spices, perfume, dates and textiles. It is at its most atmospheric in the evening, when the lanes are lit and the cafés are busy.",
      seoTitle: "Al-Balad Jeddah – Historic District Walk",
      seoDescription:
        "Walk Al-Balad, Jeddah's UNESCO old town: coral-stone houses, Nasseef House, souks and cafés. Free to explore, with tips on timings and dress.",
      duration: "2–3 hours",
      openingHours: "Lanes open all day; shops busiest after Asr and in the evening",
      location: "Al-Balad, central Jeddah (near Bab Makkah)",
      bestTimeToVisit: "Evenings, November to March",
      highlights: [
        "UNESCO-listed coral-stone houses",
        "Carved wooden rawasheen balconies",
        "Nasseef House, a restored merchant home",
        "Souks for spices, dates, oud and textiles",
      ],
      included: ["Free access to the historic lanes"],
      excluded: ["Entry to house museums", "Guide", "Food and shopping", "Transport"],
      itinerary: [
        "Start at Bab Makkah in the late afternoon.",
        "Walk to Nasseef House and the restored heritage houses.",
        "Pray at the Al-Shafi'i Mosque, one of the oldest in Jeddah.",
        "Browse the souks for dates, spices and oud.",
        "Finish with tea or local sweets at an Al-Balad café.",
      ],
      importantInfo: [
        "Dress modestly; women are not required to wear an abaya, but covered shoulders and knees are expected.",
        "Some shops close during prayer times.",
        "Parts of Al-Balad are under restoration, so some lanes may be closed.",
      ],
      faqs: [
        {
          question: "Is Al-Balad Jeddah free to visit?",
          answer:
            "Yes. Walking around the lanes and souks of Al-Balad is free. Some restored houses and museums charge a small entry fee.",
        },
        {
          question: "When is the best time to visit Al-Balad?",
          answer:
            "In the evening between November and March, when the weather is cool and the lanes and cafés are lit up. Daytime in summer is very hot and many shops close in the afternoon.",
        },
      ],
    },
    {
      title: "Red Sea Boat Trip and Snorkelling from Obhur",
      category: "seaside",
      cost: "PKR 15,000",
      description:
        "A half-day boat trip from Obhur, Jeddah's seaside district north of the city, out to the coral reefs of the Red Sea. You stop at one or two reef spots to snorkel among coral and tropical fish in clear, warm water, then relax on deck with the Jeddah coastline in view. The Red Sea is warm enough to swim year-round, and the cooler months make the boat ride more comfortable.",
      seoTitle: "Red Sea Snorkelling Trip – Obhur Jeddah",
      seoDescription:
        "Red Sea boat trip and snorkelling from Obhur, Jeddah, from PKR 15,000. Coral reefs, what's included, timings and tips for families.",
      duration: "About 4 hours",
      openingHours: "Daily morning and afternoon departures (weather permitting)",
      location: "Obhur marina, north Jeddah",
      bestTimeToVisit: "October to April",
      highlights: [
        "Snorkelling over Red Sea coral reefs",
        "Clear water with tropical fish",
        "Boat ride along the Obhur coastline",
        "Suitable for beginners with life jackets",
      ],
      included: ["Boat trip with crew", "Snorkel, mask and life jacket", "Water and soft drinks"],
      excluded: ["Transport to Obhur", "Underwater photos", "Scuba diving (separate)"],
      itinerary: [
        "Meet the crew at the Obhur marina and receive a safety briefing.",
        "Sail out to the first reef.",
        "Snorkel for about 45 minutes with the crew watching.",
        "Move to a second spot or relax on deck.",
        "Return to the marina.",
      ],
      importantInfo: [
        "Trips are cancelled in rough sea; you are offered another date or a refund.",
        "Use reef-safe sunscreen and don't touch the coral.",
        "Non-swimmers can snorkel with a life jacket close to the boat.",
      ],
      faqs: [
        {
          question: "Can non-swimmers go snorkelling in Jeddah?",
          answer:
            "Yes. Operators provide life jackets and keep beginners close to the boat. Tell the crew before the trip so they can help you.",
        },
        {
          question: "What is the best season for snorkelling in Jeddah?",
          answer:
            "October to April. The water stays warm all year, but the air is cooler and the sea is calmer in these months.",
        },
      ],
    },
  ],

  karachi: [
    {
      title: "Mazar-e-Quaid Visit",
      category: "cultural",
      cost: "Free",
      description:
        "Mazar-e-Quaid is the white marble mausoleum of Quaid-e-Azam Muhammad Ali Jinnah, the founder of Pakistan, set in large gardens in the centre of Karachi. The tomb chamber has a crystal chandelier gifted by China, and the graves of Liaquat Ali Khan and Fatima Jinnah are close by. The guard-changing ceremony on national days and the museum of the Quaid's belongings make it the most important national landmark in the city.",
      seoTitle: "Mazar-e-Quaid Karachi – Timings & Guide",
      seoDescription:
        "Visit Mazar-e-Quaid, the mausoleum of Quaid-e-Azam in Karachi: free entry, timings, the museum, guard-changing ceremony and visiting tips.",
      duration: "1–1.5 hours",
      openingHours: "Daily, about 10am–6pm (tomb chamber hours vary)",
      location: "M.A. Jinnah Road, Jamshed Quarters, Karachi",
      bestTimeToVisit: "Mornings, October to March; 25 December for the Quaid's birthday",
      highlights: [
        "White marble mausoleum of Quaid-e-Azam",
        "Crystal chandelier gifted by China",
        "Quaid-e-Azam museum with his cars and belongings",
        "Guard-changing ceremony on national days",
      ],
      included: ["Free entry to the gardens and mausoleum"],
      excluded: ["Museum entry fee where charged", "Transport", "Parking"],
      itinerary: [
        "Enter through the main gate and walk through the gardens.",
        "Visit the tomb chamber to offer Fateha.",
        "See the graves of Liaquat Ali Khan and Fatima Jinnah.",
        "Visit the museum below the mausoleum.",
      ],
      importantInfo: [
        "Security checks at the gate; avoid carrying large bags.",
        "Dress respectfully; it is a national monument.",
        "Very busy on 14 August, 11 September and 25 December.",
      ],
      faqs: [
        {
          question: "What are the Mazar-e-Quaid timings?",
          answer:
            "The grounds are generally open daily from morning until evening. Inner tomb chamber timings can be limited, so arrive before mid-afternoon to see everything.",
        },
        {
          question: "Is there an entry fee for Mazar-e-Quaid?",
          answer:
            "Entry to the gardens and mausoleum is free. The museum may charge a small fee.",
        },
      ],
    },
    {
      title: "Mohatta Palace Museum",
      category: "cultural",
      cost: "PKR 100",
      description:
        "Mohatta Palace is a pink Jodhpur-stone and yellow-stone palace in Clifton, built in 1927 for businessman Shivratan Mohatta in an Indo-Saracenic style with domes and turrets. Fatima Jinnah later lived here, and it is now a museum hosting changing exhibitions on the art, textiles and history of Pakistan. The building and its gardens are some of the most photographed in Karachi.",
      seoTitle: "Mohatta Palace Museum Karachi – Guide",
      seoDescription:
        "Mohatta Palace Museum in Clifton, Karachi: 1927 palace, exhibitions, entry fee, opening days and tips for photos. Closed on Mondays.",
      duration: "1–1.5 hours",
      openingHours: "Tuesday–Sunday, 11am–6pm; closed Mondays",
      location: "Hatim Alvi Road, Clifton Block 5, Karachi",
      bestTimeToVisit: "Weekday afternoons, October to March",
      highlights: [
        "Indo-Saracenic palace architecture from 1927",
        "Former residence of Fatima Jinnah",
        "Changing art and heritage exhibitions",
        "Gardens for photos",
      ],
      included: ["Entry to the palace and current exhibitions"],
      excluded: ["Transport", "Photography inside some exhibitions"],
      itinerary: [
        "Arrive and photograph the façade from the garden.",
        "Walk through the ground-floor galleries.",
        "Visit the upper floor and the terrace views.",
      ],
      importantInfo: [
        "Closed on Mondays.",
        "Students, children under 12 and senior citizens usually enter free.",
        "Photography may be restricted inside exhibitions.",
      ],
      faqs: [
        {
          question: "What is the Mohatta Palace ticket price?",
          answer:
            "Adult entry is a small fee, recently around Rs 30–100. Students, children under 12 and senior citizens usually enter free.",
        },
        {
          question: "Is Mohatta Palace open on Monday?",
          answer: "No. Mohatta Palace Museum is closed on Mondays and open Tuesday to Sunday, 11am to 6pm.",
        },
      ],
    },
    {
      title: "Charna Island Snorkelling Trip",
      category: "adventure",
      cost: "PKR 6,500",
      description:
        "Charna Island is a small rocky island in the Arabian Sea, about 2 hours by road and boat west of Karachi, near the Mubarak Village coast. It is Pakistan's best-known spot for snorkelling and beginner scuba diving, with coral, sea urchins and reef fish in clear water. Trips usually run on weekends in the season from October to March and include the boat ride, snorkelling gear, a guide and a seafood or BBQ lunch.",
      seoTitle: "Charna Island Snorkelling Trip Karachi",
      seoDescription:
        "Charna Island snorkelling trip from Karachi from PKR 6,500 with boat, gear and lunch. Season, what's included and safety tips.",
      duration: "Full day (about 10 hours)",
      openingHours: "Weekend trips, October to March; departure about 6–7am",
      location: "Charna Island, near Mubarak Village (pick-up from Karachi)",
      bestTimeToVisit: "October to March, when the sea is calm",
      highlights: [
        "Snorkelling in clear water around the island",
        "Boat ride along the Arabian Sea coast",
        "Cliff jumping for confident swimmers",
        "Beach BBQ or seafood lunch",
      ],
      included: [
        "Return transport from a Karachi meeting point",
        "Boat ride to Charna Island",
        "Snorkel, mask, fins and life jacket",
        "Trained guide and lunch",
      ],
      excluded: ["Scuba diving (separate package)", "Underwater photos", "Personal expenses"],
      itinerary: [
        "Early morning departure from Karachi towards Mubarak Village.",
        "Board the boat to Charna Island after a safety briefing.",
        "Snorkel around the island with the guides.",
        "Lunch on the boat or beach.",
        "Return to Karachi by evening.",
      ],
      importantInfo: [
        "No trips during the monsoon (about May to August), when the sea is closed.",
        "Life jackets are required; non-swimmers can snorkel with a guide.",
        "Carry your CNIC for checkpoints on the way.",
        "Bring sunscreen, a change of clothes and a towel.",
      ],
      faqs: [
        {
          question: "What is the best time to visit Charna Island?",
          answer:
            "October to March. The sea is calm and the water is clearer. Trips stop during the monsoon months, roughly May to August.",
        },
        {
          question: "Can I snorkel at Charna Island if I can't swim?",
          answer:
            "Yes. Operators provide life jackets and guides who stay with beginners. Tell them before the trip that you can't swim.",
        },
      ],
    },
  ],

  islamabad: [
    {
      title: "Faisal Mosque Visit",
      category: "cultural",
      cost: "Free",
      description:
        "Faisal Mosque is the national mosque of Pakistan and one of the largest mosques in the world, set against the green Margalla Hills at the end of Faisal Avenue. Designed by Turkish architect Vedat Dalokay, it has no traditional dome: its tent-shaped prayer hall is inspired by a Bedouin tent and surrounded by four 90-metre minarets. The mosque and its courtyard can hold tens of thousands of worshippers.",
      seoTitle: "Faisal Mosque Islamabad – Visit Guide",
      seoDescription:
        "Visit Faisal Mosque in Islamabad: free entry, visiting times, dress code and the best time for photos with the Margalla Hills behind.",
      duration: "1–1.5 hours",
      openingHours: "Daily; visitors are welcome outside prayer times",
      location: "Shah Faisal Avenue, E-8, Islamabad",
      bestTimeToVisit: "Late afternoon to Maghrib, October to April",
      highlights: [
        "Pakistan's national mosque",
        "Tent-shaped design by Vedat Dalokay",
        "Four 90-metre minarets",
        "Margalla Hills backdrop",
      ],
      included: ["Free entry"],
      excluded: ["Transport", "Guide"],
      itinerary: [
        "Arrive in the late afternoon and leave your shoes at the shoe counter.",
        "Walk through the courtyard and the prayer hall.",
        "Pray Asr or Maghrib in congregation.",
        "Photograph the mosque against the hills at sunset.",
      ],
      importantInfo: [
        "Modest dress; women should cover their hair.",
        "Non-Muslim visitors are welcome outside prayer times.",
        "Very busy on Fridays and Eid.",
      ],
      faqs: [
        {
          question: "What are the Faisal Mosque visiting timings?",
          answer:
            "The mosque is open daily. Tourists can visit at any time except during the five daily prayers; late afternoon until Maghrib is the best time for photos.",
        },
        {
          question: "Can women visit Faisal Mosque?",
          answer: "Yes. Women can visit and pray in the women's section. Cover your hair and wear modest clothes.",
        },
      ],
    },
    {
      title: "Daman-e-Koh and Margalla Trail 3 Hike",
      category: "adventure",
      cost: "Free",
      description:
        "Daman-e-Koh is a viewpoint about halfway up the Margalla Hills, with a wide view of Islamabad, Faisal Mosque and Rawal Lake. You can drive up or reach it on foot from Trail 3, a popular steep hike of about 3 km that starts in Sector F-6 and climbs through forest to the viewpoint. On the way, look out for monkeys and birds. From November to February the weather is cool and dry.",
      seoTitle: "Daman-e-Koh & Trail 3 Islamabad Hike",
      seoDescription:
        "Hike Margalla Trail 3 to Daman-e-Koh viewpoint in Islamabad: free, about 3 km, timings, difficulty and the best season for clear views.",
      duration: "2–4 hours",
      openingHours: "Trails open from sunrise; viewpoint open until late evening",
      location: "Trail 3 starts at F-6/3; Daman-e-Koh on Margalla Hills",
      bestTimeToVisit: "Early morning, October to March",
      highlights: [
        "City view over Islamabad and Faisal Mosque",
        "Popular Margalla Hills hiking trail",
        "Forest wildlife, monkeys and birds",
        "Cafés and food stalls at the viewpoint",
      ],
      included: ["Free access to Trail 3 and the viewpoint"],
      excluded: ["Transport", "Food and drinks"],
      itinerary: [
        "Start at the Trail 3 entrance in F-6/3 early in the morning.",
        "Climb through the forest to the Viewpoint 1 rest area.",
        "Continue to Daman-e-Koh for the view over the city.",
        "Have tea at the viewpoint and return the same way or by taxi.",
      ],
      importantInfo: [
        "Trail 3 is steep in parts; wear good shoes and carry water.",
        "Don't feed the monkeys.",
        "Trails can close temporarily during fire risk or bad weather.",
      ],
      faqs: [
        {
          question: "How long does the Trail 3 hike take?",
          answer:
            "Most people take 1 to 1.5 hours to reach the viewpoint and about the same to come down. Fit hikers do it faster.",
        },
        {
          question: "Can you drive to Daman-e-Koh?",
          answer:
            "Yes. A road from Pir Sohawa Road leads up to the Daman-e-Koh parking, so you can visit the viewpoint without hiking.",
        },
      ],
    },
    {
      title: "Pakistan Monument and Museum",
      category: "cultural",
      cost: "PKR 150",
      description:
        "The Pakistan Monument on Shakarparian Hill is shaped like a blooming flower. Its four large petals represent the provinces, and the three smaller ones the territories. The petals are covered in murals of Pakistan's landmarks and the leaders of the freedom movement. Next to it, the Pakistan Monument Museum tells the story of the Pakistan Movement through wax figures and dioramas, and the hilltop gives a view over Islamabad.",
      seoTitle: "Pakistan Monument Islamabad – Tickets",
      seoDescription:
        "Pakistan Monument and Museum in Islamabad: ticket price, timings (closed Mondays), what to see and the best time to visit Shakarparian Hill.",
      duration: "1.5–2 hours",
      openingHours: "Tuesday–Sunday, 10am–8pm; closed Mondays",
      location: "Shakarparian Hill, Islamabad",
      bestTimeToVisit: "Late afternoon to evening, when the monument is lit up",
      highlights: [
        "Flower-shaped national monument",
        "Murals of Pakistani landmarks and leaders",
        "Pakistan Movement museum with wax figures",
        "Hilltop view over Islamabad",
      ],
      included: ["Entry to the museum and monument"],
      excluded: ["Transport", "Food and drinks"],
      itinerary: [
        "Visit the Pakistan Monument Museum first.",
        "Walk up to the monument and its murals.",
        "Stay for sunset and the lights.",
        "Optional: walk down to Lok Virsa museum nearby.",
      ],
      importantInfo: [
        "Closed on Mondays.",
        "Foreign nationals pay a higher ticket price than Pakistani citizens.",
        "Children under 7 enter free.",
      ],
      faqs: [
        {
          question: "What is the Pakistan Monument Museum ticket price?",
          answer:
            "Pakistani adults pay about Rs 150, students about Rs 80, and foreign visitors about Rs 1,000. Children under 7 enter free.",
        },
        {
          question: "Is the Pakistan Monument open on Monday?",
          answer: "No. The museum is closed on Mondays and open Tuesday to Sunday, 10am to 8pm.",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Validation (mirrors src/lib/validations/activity.ts and the SEO budgets).
// ---------------------------------------------------------------------------
const LIMITS = {
  description: [20, 500],
  duration: 60,
  openingHours: 120,
  location: 160,
  bestTimeToVisit: 120,
  highlights: [10, 160],
  included: [12, 160],
  excluded: [12, 160],
  itinerary: [12, 240],
  importantInfo: [12, 240],
};

function validateDetails(label, d, problems) {
  if (d.description != null) {
    const [min, max] = LIMITS.description;
    if (d.description.length < min || d.description.length > max) {
      problems.push(`${label}: description is ${d.description.length} chars (${min}–${max})`);
    }
  }
  for (const key of ["duration", "openingHours", "location", "bestTimeToVisit"]) {
    if (d[key] && d[key].length > LIMITS[key]) problems.push(`${label}: ${key} over ${LIMITS[key]} chars`);
  }
  for (const key of ["highlights", "included", "excluded", "itinerary", "importantInfo"]) {
    const list = d[key] ?? [];
    const [maxItems, maxLength] = LIMITS[key];
    if (list.length > maxItems) problems.push(`${label}: ${key} has ${list.length} items (max ${maxItems})`);
    for (const item of list) {
      if (!item.trim() || item.length > maxLength) problems.push(`${label}: ${key} item over ${maxLength} chars: "${item.slice(0, 40)}…"`);
    }
  }
  const faqs = d.faqs ?? [];
  if (faqs.length > 10) problems.push(`${label}: more than 10 FAQs`);
  for (const faq of faqs) {
    if (faq.question.length < 5 || faq.question.length > 200) problems.push(`${label}: FAQ question length "${faq.question}"`);
    if (faq.answer.length < 10 || faq.answer.length > 1000) problems.push(`${label}: FAQ answer length for "${faq.question}"`);
  }
}

function validateNew(label, a, problems) {
  validateDetails(label, a, problems);
  if (a.title.length < 3 || a.title.length > 100) problems.push(`${label}: title length`);
  if (!a.cost || a.cost.length > 40) problems.push(`${label}: cost`);
  // Leaves room for " | <brand>" within ~60 characters.
  if (a.seoTitle.length > 48) problems.push(`${label}: seoTitle is ${a.seoTitle.length} chars (max 48)`);
  if (a.seoDescription.length < 110 || a.seoDescription.length > 160) {
    problems.push(`${label}: seoDescription is ${a.seoDescription.length} chars (110–160)`);
  }
}

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const isEmpty = (value) => value == null || (Array.isArray(value) && value.length === 0) || value === "";

/** Only the detail fields still empty in the database. */
function fillEmpty(row, details) {
  const data = {};
  for (const key of ["duration", "openingHours", "location", "bestTimeToVisit", "highlights", "included", "excluded", "itinerary", "importantInfo", "faqs"]) {
    if (details[key] != null && isEmpty(row[key])) data[key] = details[key];
  }
  if (details.description && row.description.trim() === details.seededDescription) {
    data.description = details.description;
  }
  return data;
}

async function main() {
  const write = process.argv.includes("--write");
  const publish = process.argv.includes("--publish");

  const problems = [];
  for (const [slug, details] of Object.entries(EXISTING)) validateDetails(slug, details, problems);
  for (const [destination, list] of Object.entries(NEW_ACTIVITIES)) {
    for (const activity of list) validateNew(`${destination}/${activity.title}`, activity, problems);
  }
  if (problems.length) {
    for (const problem of problems) console.log(`✗ ${problem}`);
    process.exit(1);
  }
  const newCount = Object.values(NEW_ACTIVITIES).flat().length;
  console.log(`✓ content valid: ${Object.keys(EXISTING).length} existing, ${newCount} new activities\n`);

  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const pool = new Pool({
    connectionString: connectionUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]pgbouncer=true/g, ""),
    ssl: /[?&]sslmode=disable\b/.test(connectionUrl) ? false : { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    // 1. Existing activities: fill empty fields only.
    const rows = await prisma.activity.findMany();
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    for (const [slug, details] of Object.entries(EXISTING)) {
      const row = bySlug.get(slug);
      if (!row) {
        console.log(`skip  /activities/${slug} (not found)`);
        continue;
      }
      const data = fillEmpty(row, details);
      const fields = Object.keys(data);
      if (fields.length === 0) {
        console.log(`skip  /activities/${slug} (already filled in)`);
        continue;
      }
      if (write) await prisma.activity.update({ where: { id: row.id }, data });
      console.log(`${write ? "updated" : "would update"} /activities/${slug}: ${fields.join(", ")}`);
    }

    // 2. New Q4 2026 activities.
    const destinations = await prisma.destination.findMany({
      select: { id: true, slug: true, city: true, imageUrl: true },
    });
    const destinationBySlug = new Map(destinations.map((d) => [d.slug, d]));
    let sortOrder = Math.max(0, ...rows.map((row) => row.sortOrder)) + 1;
    let created = 0;

    for (const [destinationSlug, list] of Object.entries(NEW_ACTIVITIES)) {
      const destination = destinationBySlug.get(destinationSlug);
      if (!destination) {
        console.log(`skip  ${destinationSlug}: no destination with this slug`);
        continue;
      }
      if (!destination.imageUrl) {
        console.log(`skip  ${destinationSlug}: destination has no photo to start from; add one in /admin/destinations`);
        continue;
      }
      for (const activity of list) {
        const slug = toSlug(`${activity.title} ${destination.city}`);
        if (bySlug.has(slug)) {
          console.log(`skip  /activities/${slug} (exists)`);
          continue;
        }
        const { title, category, cost, description, seoTitle, seoDescription, ...details } = activity;
        const data = {
          slug,
          destinationId: destination.id,
          title,
          category,
          cost,
          description,
          seoTitle,
          seoDescription,
          imageUrl: destination.imageUrl,
          isActive: publish,
          sortOrder: sortOrder++,
          ...details,
        };
        if (write) await prisma.activity.create({ data });
        created += 1;
        console.log(`${write ? "created" : "would create"} /activities/${slug} (${publish ? "visible" : "hidden"}, ${cost})`);
      }
    }

    console.log(
      write
        ? `\nDone. ${created} new activit${created === 1 ? "y" : "ies"} created${publish ? "" : " as hidden: upload each photo in /admin/activities and tick Active"}.`
        : "\nDry run. Re-run with --write to save.",
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
