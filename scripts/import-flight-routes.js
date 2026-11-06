/* eslint-disable @typescript-eslint/no-require-imports */
// Creates the first flight route landing pages (/flights/<from>-to-<to>).
// Rows are created as drafts (isActive = false): an admin checks each airline
// list against current schedules in /admin/flight-routes, then publishes.
// Safe to re-run: a route that already exists (same airport pair) is skipped,
// so admin edits are never overwritten.
//
//   node scripts/import-flight-routes.js           # dry run (validates content)
//   node scripts/import-flight-routes.js --write   # insert
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Distances are great-circle distances between the airports, rounded.
const AIRPORTS = {
  LHE: { city: "Lahore", airport: "Allama Iqbal International Airport" },
  ISB: { city: "Islamabad", airport: "Islamabad International Airport" },
  KHI: { city: "Karachi", airport: "Jinnah International Airport" },
  JED: { city: "Jeddah", country: "Saudi Arabia", airport: "King Abdulaziz International Airport" },
  DXB: { city: "Dubai", country: "UAE", airport: "Dubai International Airport" },
  IST: { city: "Istanbul", country: "Turkey", airport: "Istanbul Airport" },
  LHR: { city: "London", country: "United Kingdom", airport: "London Heathrow Airport" },
};

const SAUDI_DOCUMENTS = [
  "Passport valid for at least 6 months from your travel date",
  "Saudi visa: Umrah, tourist e-visa, family visit or work visa",
  "Polio vaccination certificate (checked for travellers leaving Pakistan)",
  "Meningococcal (ACYW) vaccination certificate for Umrah and Hajj travellers",
  "Return ticket and hotel booking for Umrah and tourist visas",
  "Protector stamp from the Bureau of Emigration if you travel on a work visa",
];

const UAE_DOCUMENTS = [
  "Passport valid for at least 6 months from your travel date",
  "UAE visit visa (or residence or work visa)",
  "Confirmed return ticket",
  "Hotel booking or your host's address in the UAE",
  "Polio vaccination certificate (checked for travellers leaving Pakistan)",
  "Protector stamp from the Bureau of Emigration if you travel on a work visa",
];

const ROUTES = [
  {
    from: "LHE",
    to: "JED",
    flightTime: "About 5 hours non-stop",
    distance: "About 3,650 km",
    airlines: [
      { name: "Saudia", code: "SV", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
      { name: "Serene Air", code: "ER", service: "Non-stop" },
      { name: "Emirates", code: "EK", service: "1 stop via Dubai" },
      { name: "Qatar Airways", code: "QR", service: "1 stop via Doha" },
      { name: "flydubai", code: "FZ", service: "1 stop via Dubai" },
    ],
    intro: [
      "Lahore to Jeddah is one of the busiest international routes from Pakistan. Most passengers are travelling for Umrah, visiting family or starting work in Saudi Arabia, so seats sell quickly in Ramadan, during the school holidays and in the weeks before Hajj.",
      "Flights leave Allama Iqbal International Airport (LHE) and land at King Abdulaziz International Airport (JED), the main gateway for pilgrims going on to Makkah. A non-stop flight takes about 5 hours. Saudia, PIA, airblue and Serene Air fly the route direct, and Emirates, Qatar Airways and flydubai offer one-stop options that can be cheaper when direct fares are high.",
      "Our Lahore team in DHA Phase 1 books Jeddah tickets every day. Search live fares above, or send us your dates on WhatsApp and we will compare the airlines for you, including group fares for Umrah families.",
    ],
    travelTips: [
      "Book 6 to 8 weeks ahead for Ramadan and school-holiday dates; fares rise sharply close to departure.",
      "If you are going for Umrah, put on ihram before boarding or at the airport: the flight crosses the miqat before landing in Jeddah, and the crew usually announce it.",
      "Check whether your fare includes one or two checked bags; allowances differ by airline and fare type.",
      "Many airlines allow one 5-litre Zamzam container per passenger on the return flight from Jeddah. Confirm the rule for your airline before you fly.",
      "Arrive at Lahore airport at least 3 hours before an international departure.",
    ],
    documents: SAUDI_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Lahore to Jeddah?",
        answer: "About 5 hours non-stop. One-stop flights via Dubai, Doha or Abu Dhabi usually take 8 to 12 hours including the connection.",
      },
      {
        question: "Which airlines fly non-stop from Lahore to Jeddah?",
        answer: "Saudia, PIA, airblue and Serene Air operate non-stop flights. Schedules change by season, so ask us which airlines are flying on your dates.",
      },
      {
        question: "When are Lahore to Jeddah tickets cheapest?",
        answer: "Usually outside Ramadan, the weeks before Hajj and the Pakistani school holidays. Booking 6 to 8 weeks ahead and being flexible by a day or two also helps.",
      },
      {
        question: "Can I bring Zamzam water back to Lahore?",
        answer: "Most airlines on this route allow one sealed 5-litre Zamzam container per passenger on flights from Jeddah, usually bought at the airport. Rules vary by airline, so confirm when you book.",
      },
      {
        question: "Do I need a visa to fly from Lahore to Jeddah?",
        answer: "Yes. Pakistani passport holders need a Saudi visa (Umrah, tourist, visit or work) before they fly, and the airline checks it at check-in in Lahore.",
      },
    ],
    seoTitle: "Lahore to Jeddah Flights – Cheap Air Tickets",
    seoDescription:
      "Cheap Lahore to Jeddah air tickets on Saudia, PIA, airblue and Serene Air. 5-hour non-stop flights for Umrah, family visits and work. Compare fares with us.",
  },
  {
    from: "ISB",
    to: "JED",
    flightTime: "About 5 hours non-stop",
    distance: "About 3,550 km",
    airlines: [
      { name: "Saudia", code: "SV", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
      { name: "Serene Air", code: "ER", service: "Non-stop" },
      { name: "Emirates", code: "EK", service: "1 stop via Dubai" },
      { name: "Qatar Airways", code: "QR", service: "1 stop via Doha" },
      { name: "Etihad Airways", code: "EY", service: "1 stop via Abu Dhabi" },
    ],
    intro: [
      "Islamabad to Jeddah links the capital, Rawalpindi and the north of Pakistan, including Azad Kashmir and Khyber Pakhtunkhwa, with Saudi Arabia's Red Sea gateway. Demand peaks in Ramadan, through the Umrah season and when overseas workers return after leave.",
      "Flights depart Islamabad International Airport (ISB) and arrive at King Abdulaziz International Airport (JED) after about 5 hours non-stop. Saudia, PIA, airblue and Serene Air fly direct, while Emirates, Qatar Airways and Etihad Airways connect through their Gulf hubs.",
      "We book Islamabad departures every day for individual travellers, families and Umrah groups. Search live fares above, or message us with your dates and we will compare direct and one-stop options for you.",
    ],
    travelTips: [
      "Islamabad International Airport is outside the city on the motorway; allow at least 45 minutes from central Islamabad or Rawalpindi.",
      "Book 6 to 8 weeks ahead for Ramadan and Eid travel, when Islamabad flights fill early.",
      "If you are going for Umrah, put on ihram before boarding or at the airport: the miqat is crossed in the air before Jeddah.",
      "Compare Islamabad and Lahore departures if your dates are fixed; the cheaper option changes from week to week.",
      "Arrive at the airport at least 3 hours before departure.",
    ],
    documents: SAUDI_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Islamabad to Jeddah?",
        answer: "About 5 hours non-stop. With one stop in Dubai, Doha or Abu Dhabi, the journey usually takes 8 to 12 hours.",
      },
      {
        question: "Which airlines fly direct from Islamabad to Jeddah?",
        answer: "Saudia, PIA, airblue and Serene Air fly non-stop. Ask us which airlines are operating on your dates, as schedules change by season.",
      },
      {
        question: "Is it cheaper to fly to Jeddah from Islamabad or Lahore?",
        answer: "It depends on the date. Both cities have several direct flights a week, and fares move with demand. We can compare both departure cities for your dates.",
      },
      {
        question: "Do I need a visa to fly from Islamabad to Jeddah?",
        answer: "Yes. Pakistani passport holders need a valid Saudi visa before travelling, and it is checked at check-in.",
      },
    ],
    seoTitle: "Islamabad to Jeddah Flights – Cheap Air Tickets",
    seoDescription:
      "Book cheap Islamabad to Jeddah air tickets on Saudia, PIA, airblue and Serene Air. 5-hour non-stop flights for Umrah and work, plus one-stop Gulf options.",
  },
  {
    from: "KHI",
    to: "JED",
    flightTime: "About 4 hours non-stop",
    distance: "About 2,880 km",
    airlines: [
      { name: "Saudia", code: "SV", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
      { name: "Emirates", code: "EK", service: "1 stop via Dubai" },
      { name: "Qatar Airways", code: "QR", service: "1 stop via Doha" },
      { name: "flydubai", code: "FZ", service: "1 stop via Dubai" },
    ],
    intro: [
      "Karachi to Jeddah is the shortest of Pakistan's main routes to Saudi Arabia, serving travellers from Sindh and Balochistan going for Umrah, family visits and work. It is also a popular choice for families from elsewhere in Pakistan when Karachi fares are lower.",
      "Flights leave Jinnah International Airport (KHI) and land at King Abdulaziz International Airport (JED) after about 4 hours non-stop. Saudia, PIA and airblue fly direct, and Emirates, Qatar Airways and flydubai offer one-stop connections.",
      "Tell us your dates and how many people are travelling, and we will compare direct and connecting fares across airlines, including group seats for Umrah.",
    ],
    travelTips: [
      "Karachi has the widest choice of Jeddah departure times in Pakistan; early-morning flights are often cheaper.",
      "Book 6 to 8 weeks ahead for Ramadan, Eid and school-holiday travel.",
      "If you are going for Umrah, put on ihram before boarding: the miqat is crossed in the air before Jeddah.",
      "Arrive at Jinnah International Airport at least 3 hours before departure; queues can be long in peak season.",
    ],
    documents: SAUDI_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Karachi to Jeddah?",
        answer: "About 4 hours non-stop. One-stop flights via Dubai or Doha usually take 7 to 11 hours including the connection.",
      },
      {
        question: "Which airlines fly non-stop from Karachi to Jeddah?",
        answer: "Saudia, PIA and airblue operate direct flights. Schedules change by season, so ask us which airlines fly on your dates.",
      },
      {
        question: "When are Karachi to Jeddah fares lowest?",
        answer: "Outside Ramadan, the pre-Hajj weeks and school holidays. Booking early and travelling mid-week usually gives the best fares.",
      },
      {
        question: "Do I need a visa to fly from Karachi to Jeddah?",
        answer: "Yes. You need a valid Saudi visa (Umrah, tourist, visit or work) before you travel.",
      },
    ],
    seoTitle: "Karachi to Jeddah Flights – Cheap Air Tickets",
    seoDescription:
      "Cheap Karachi to Jeddah air tickets on Saudia, PIA and airblue. 4-hour non-stop flights for Umrah, family visits and work. Compare fares with EasyTrip.",
  },
  {
    from: "LHE",
    to: "DXB",
    flightTime: "About 3 hr 15 min non-stop",
    distance: "About 1,990 km",
    airlines: [
      { name: "Emirates", code: "EK", service: "Non-stop" },
      { name: "flydubai", code: "FZ", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
    ],
    intro: [
      "Lahore to Dubai is a short, busy route used by holidaymakers, business travellers and families visiting relatives in the UAE. Dubai is also a common stopover for onward journeys to Europe, North America and Africa.",
      "Flights depart Allama Iqbal International Airport (LHE) and land at Dubai International Airport (DXB) after about 3 hours 15 minutes. Emirates, flydubai, PIA and airblue all fly non-stop, so there are several departures every day to choose from.",
      "We book Lahore to Dubai tickets together with UAE visit visas, hotels and tours, which gives you the documents the visa application needs. Search fares above or ask our team for a package price.",
    ],
    travelTips: [
      "Compare Dubai (DXB) with Sharjah (SHJ), about 30 minutes away by road: Air Arabia flies Lahore to Sharjah and is sometimes cheaper.",
      "Check the baggage on your fare: some lower fares include only hand baggage or a single checked bag.",
      "Fares are highest around Eid, New Year and the winter school holidays; book early for those dates.",
      "Apply for your UAE visa before booking non-refundable hotels, and keep a copy of your return ticket.",
    ],
    documents: UAE_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Lahore to Dubai?",
        answer: "About 3 hours 15 minutes non-stop.",
      },
      {
        question: "Which airlines fly direct from Lahore to Dubai?",
        answer: "Emirates, flydubai, PIA and airblue fly non-stop between Lahore and Dubai. Ask us which flight times suit your plans.",
      },
      {
        question: "Do Pakistanis need a visa for Dubai?",
        answer: "Yes. Pakistani passport holders need a UAE visit visa before they fly, and the airline checks it at check-in. We can arrange the visa together with your ticket.",
      },
      {
        question: "Should I fly to Dubai or Sharjah?",
        answer: "Dubai International has more airlines and flight times. Sharjah is about 30 minutes from Dubai by road and is sometimes cheaper with Air Arabia, so it is worth comparing both.",
      },
    ],
    seoTitle: "Lahore to Dubai Flights – Cheap Air Tickets",
    seoDescription:
      "Book cheap Lahore to Dubai air tickets on Emirates, flydubai, PIA and airblue. Non-stop flights in about 3 hours, plus UAE visa and hotel help from EasyTrip.",
  },
  {
    from: "ISB",
    to: "DXB",
    flightTime: "About 3 hours non-stop",
    distance: "About 1,920 km",
    airlines: [
      { name: "Emirates", code: "EK", service: "Non-stop" },
      { name: "flydubai", code: "FZ", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
    ],
    intro: [
      "Islamabad to Dubai connects the capital and Rawalpindi with the UAE's biggest city in about 3 hours. The route is popular for family visits, shopping trips, business travel and connections onward through Dubai.",
      "Flights leave Islamabad International Airport (ISB) and arrive at Dubai International Airport (DXB). Emirates, flydubai, PIA and airblue fly non-stop, so there is a wide choice of departure times through the week.",
      "We can book your ticket, UAE visit visa and hotel together. Search live fares above or message our team with your dates for a quote.",
    ],
    travelTips: [
      "Allow at least 45 minutes to reach Islamabad International Airport from central Islamabad or Rawalpindi.",
      "Check the baggage on your fare: some lower fares include only hand baggage or one checked bag.",
      "Book early for Eid, New Year and winter school holidays, when Dubai fares are highest.",
      "If you are connecting onward in Dubai, keep the whole journey on one ticket so your bags are checked through.",
    ],
    documents: UAE_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Islamabad to Dubai?",
        answer: "About 3 hours non-stop.",
      },
      {
        question: "Which airlines fly non-stop from Islamabad to Dubai?",
        answer: "Emirates, flydubai, PIA and airblue operate direct flights between Islamabad and Dubai.",
      },
      {
        question: "Do I need a UAE visa to fly from Islamabad to Dubai?",
        answer: "Yes. Pakistani passport holders need a UAE visit visa before travelling. We can arrange the visa with your ticket.",
      },
    ],
    seoTitle: "Islamabad to Dubai Flights – Cheap Air Tickets",
    seoDescription:
      "Cheap Islamabad to Dubai air tickets on Emirates, flydubai, PIA and airblue. 3-hour non-stop flights, with UAE visa and hotel booking help from EasyTrip.",
  },
  {
    from: "KHI",
    to: "DXB",
    flightTime: "About 2 hr 15 min non-stop",
    distance: "About 1,190 km",
    airlines: [
      { name: "Emirates", code: "EK", service: "Non-stop" },
      { name: "flydubai", code: "FZ", service: "Non-stop" },
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
    ],
    intro: [
      "Karachi to Dubai is one of the shortest and most frequent international routes from Pakistan, with flights in about 2 hours 15 minutes. It is busy all year with business travellers, families and shoppers, and many passengers connect in Dubai to destinations worldwide.",
      "Flights depart Jinnah International Airport (KHI) and land at Dubai International Airport (DXB). Emirates, flydubai, PIA and airblue all fly non-stop, with departures throughout the day.",
      "Tell us your dates and we will compare the airlines, or book your ticket together with a UAE visit visa and hotel.",
    ],
    travelTips: [
      "With many daily flights, Karachi to Dubai fares change quickly; booking a few weeks ahead usually pays off.",
      "Compare Dubai (DXB) with Sharjah (SHJ), about 30 minutes away by road, which Air Arabia serves from Karachi.",
      "Check whether your fare includes checked baggage before you book.",
      "Arrive at Jinnah International Airport at least 3 hours before departure.",
    ],
    documents: UAE_DOCUMENTS,
    faqs: [
      {
        question: "How long is the flight from Karachi to Dubai?",
        answer: "About 2 hours 15 minutes non-stop.",
      },
      {
        question: "Which airlines fly from Karachi to Dubai?",
        answer: "Emirates, flydubai, PIA and airblue fly non-stop. Air Arabia also flies from Karachi to nearby Sharjah.",
      },
      {
        question: "Do Pakistanis need a visa for Dubai?",
        answer: "Yes. You need a UAE visit visa before you fly. We can arrange it together with your ticket.",
      },
    ],
    seoTitle: "Karachi to Dubai Flights – Cheap Air Tickets",
    seoDescription:
      "Book cheap Karachi to Dubai air tickets on Emirates, flydubai, PIA and airblue. Non-stop flights in about 2 hours 15 minutes, plus UAE visa help from EasyTrip.",
  },
  {
    from: "LHE",
    to: "IST",
    flightTime: "About 6 hr 30 min non-stop",
    distance: "About 4,180 km",
    airlines: [
      { name: "Turkish Airlines", code: "TK", service: "Non-stop" },
      { name: "Qatar Airways", code: "QR", service: "1 stop via Doha" },
      { name: "Emirates", code: "EK", service: "1 stop via Dubai" },
      { name: "flydubai", code: "FZ", service: "1 stop via Dubai" },
    ],
    intro: [
      "Lahore to Istanbul is a favourite route for holidays, honeymoons and history trips, and Istanbul is also a convenient stop on the way to Europe and North America.",
      "Turkish Airlines flies non-stop from Allama Iqbal International Airport (LHE) to Istanbul Airport (IST) in about 6 hours 30 minutes. Qatar Airways, Emirates and flydubai offer one-stop options through Doha and Dubai, which can be cheaper or fit your dates better.",
      "We book Istanbul flights together with Turkish visa support, hotels and tours. Search fares above or ask our team for a complete Turkey package.",
    ],
    travelTips: [
      "Apply for your Turkish visa early: sticker visa appointments can take several weeks in summer.",
      "Istanbul Airport (IST) is about 40 km from Sultanahmet; Havaist airport buses and taxis run to the city.",
      "Some one-stop fares land at Sabiha Gökçen (SAW) on the Asian side, so check which Istanbul airport your ticket uses.",
      "Summer and Eid holidays are the most expensive times to fly; spring and autumn are cheaper and have pleasant weather.",
    ],
    documents: [
      "Passport valid for at least 6 months from your travel date",
      "Turkish visa: sticker visa, or e-Visa if you hold a valid US, UK, Schengen or Irish visa or residence permit",
      "Confirmed return ticket and hotel booking",
      "Travel insurance covering your stay",
      "Polio vaccination certificate (checked for travellers leaving Pakistan)",
    ],
    faqs: [
      {
        question: "How long is the flight from Lahore to Istanbul?",
        answer: "About 6 hours 30 minutes non-stop with Turkish Airlines. One-stop flights via Doha or Dubai usually take 10 to 14 hours.",
      },
      {
        question: "Is there a direct flight from Lahore to Istanbul?",
        answer: "Yes, Turkish Airlines flies non-stop between Lahore and Istanbul Airport. Ask us for the current schedule.",
      },
      {
        question: "Do Pakistanis need a visa for Turkey?",
        answer: "Yes. Most Pakistani travellers need a sticker visa. If you hold a valid US, UK, Schengen or Irish visa or residence permit, you may qualify for a Turkish e-Visa instead.",
      },
      {
        question: "When is the cheapest time to fly from Lahore to Istanbul?",
        answer: "Spring and autumn are usually cheaper than summer and the Eid holidays, and the weather in Istanbul is pleasant then too.",
      },
    ],
    seoTitle: "Lahore to Istanbul Flights – Cheap Air Tickets",
    seoDescription:
      "Cheap Lahore to Istanbul air tickets: Turkish Airlines non-stop in about 6.5 hours, or one-stop via Doha and Dubai. Turkey visa and tour help from EasyTrip.",
  },
  {
    from: "LHE",
    to: "LHR",
    flightTime: "About 12–16 hours with one stop",
    distance: "About 6,320 km",
    airlines: [
      { name: "Qatar Airways", code: "QR", service: "1 stop via Doha" },
      { name: "Emirates", code: "EK", service: "1 stop via Dubai" },
      { name: "Etihad Airways", code: "EY", service: "1 stop via Abu Dhabi" },
      { name: "Turkish Airlines", code: "TK", service: "1 stop via Istanbul" },
      { name: "Gulf Air", code: "GF", service: "1 stop via Bahrain" },
    ],
    intro: [
      "Lahore to London is the main route between Punjab and the UK's large British-Pakistani community, used for family visits, studies, weddings and business.",
      "Most travellers fly with one stop: Qatar Airways via Doha, Emirates via Dubai, Etihad Airways via Abu Dhabi, Turkish Airlines via Istanbul or Gulf Air via Bahrain, landing at London Heathrow (LHR). The journey usually takes 12 to 16 hours depending on the connection. PIA was cleared to resume flights to the UK in 2025, so ask us whether a non-stop service is running on your dates.",
      "We compare total journey time as well as price, and can help with UK visit visa documents. Search fares above or send us your dates on WhatsApp.",
    ],
    travelTips: [
      "Compare total journey time, not only the fare: a short connection can save several hours.",
      "Book early for December, Eid and the UK summer holidays, when family travel pushes fares up.",
      "Some fares land at Manchester or Birmingham instead of London; these can be cheaper and closer for many families.",
      "Keep the whole journey on one ticket so your bags are checked through to London.",
    ],
    documents: [
      "Passport valid for the whole of your stay",
      "UK visit, study or family visa",
      "Tuberculosis (TB) test certificate if you are staying in the UK for more than 6 months",
      "Confirmed return or onward ticket",
      "Polio vaccination certificate (checked for travellers leaving Pakistan)",
    ],
    faqs: [
      {
        question: "How long is the flight from Lahore to London?",
        answer: "Usually 12 to 16 hours with one stop in Doha, Dubai, Abu Dhabi, Istanbul or Bahrain, depending on the connection time.",
      },
      {
        question: "Is there a direct flight from Lahore to London?",
        answer: "Most travellers fly with one stop. PIA was cleared to resume UK flights in 2025; ask us whether a non-stop service is operating on your dates.",
      },
      {
        question: "Which airline is best for Lahore to London?",
        answer: "It depends on your priorities. Gulf carriers such as Qatar Airways and Emirates have the most connections, while Turkish Airlines is often good value. We compare price, baggage and connection time for you.",
      },
      {
        question: "Do I need a visa to fly to London from Lahore?",
        answer: "Yes. Pakistani passport holders need a UK visa before travelling. Stays over 6 months also need a TB test certificate from an approved clinic.",
      },
    ],
    seoTitle: "Lahore to London Flights – Cheap Air Tickets",
    seoDescription:
      "Cheap Lahore to London air tickets via Doha, Dubai, Abu Dhabi or Istanbul. Compare Qatar Airways, Emirates, Etihad and Turkish Airlines fares with EasyTrip.",
  },
  {
    from: "KHI",
    to: "LHE",
    flightTime: "About 1 hr 45 min non-stop",
    distance: "About 1,020 km",
    airlines: [
      { name: "PIA", code: "PK", service: "Non-stop" },
      { name: "airblue", code: "PA", service: "Non-stop" },
      { name: "Serene Air", code: "ER", service: "Non-stop" },
      { name: "AirSial", code: "PF", service: "Non-stop" },
      { name: "Fly Jinnah", code: "9P", service: "Non-stop" },
    ],
    intro: [
      "Karachi to Lahore is Pakistan's busiest domestic route, linking the country's two largest cities in about 1 hour 45 minutes. It is used every day by business travellers, students and families.",
      "Flights depart Jinnah International Airport (KHI) and land at Allama Iqbal International Airport (LHE). PIA, airblue, Serene Air, AirSial and Fly Jinnah all fly non-stop, so there are many departures through the day.",
      "Tell us your dates and we will find the best fare across all five airlines, including group bookings for weddings and corporate travel.",
    ],
    travelTips: [
      "Fares are highest on Friday and Sunday evenings and around Eid; mid-week flights are usually cheaper.",
      "Some low fares include hand baggage only, so check the checked-baggage allowance before you book.",
      "Arrive at the airport at least 2 hours before a domestic departure.",
      "Book a few weeks ahead for Eid, when domestic flights sell out quickly.",
    ],
    documents: [
      "Original CNIC for Pakistani adults (or passport for foreign nationals)",
      "B-Form (Child Registration Certificate) for children",
      "Booking confirmation or e-ticket",
    ],
    faqs: [
      {
        question: "How long is the flight from Karachi to Lahore?",
        answer: "About 1 hour 45 minutes non-stop.",
      },
      {
        question: "Which airlines fly from Karachi to Lahore?",
        answer: "PIA, airblue, Serene Air, AirSial and Fly Jinnah all fly non-stop between Karachi and Lahore.",
      },
      {
        question: "What ID do I need for a domestic flight in Pakistan?",
        answer: "Adults need their original CNIC (foreign nationals need a passport). Children travel with a B-Form, and airlines check ID at check-in and boarding.",
      },
      {
        question: "When are Karachi to Lahore tickets cheapest?",
        answer: "Usually mid-week and when booked a few weeks ahead. Friday and Sunday evenings and Eid dates are the most expensive.",
      },
    ],
    seoTitle: "Karachi to Lahore Flights – Cheap Air Tickets",
    seoDescription:
      "Book cheap Karachi to Lahore air tickets on PIA, airblue, Serene Air, AirSial and Fly Jinnah. 1 hr 45 min non-stop flights, many departures every day.",
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

function buildRow(route, index) {
  const from = AIRPORTS[route.from];
  const to = AIRPORTS[route.to];
  const destinationCountry = to.country ?? "Pakistan";
  return {
    slug: `${slugify(from.city)}-to-${slugify(to.city)}`,
    originCity: from.city,
    originIata: route.from,
    originAirport: from.airport,
    destinationCity: to.city,
    destinationCountry,
    destinationIata: route.to,
    destinationAirport: to.airport,
    intro: route.intro.join("\n\n"),
    flightTime: route.flightTime,
    distance: route.distance,
    airlines: route.airlines,
    travelTips: route.travelTips,
    documents: route.documents,
    faqs: route.faqs,
    fareFrom: null,
    isActive: false,
    sortOrder: index + 1,
    seoTitle: route.seoTitle,
    seoDescription: route.seoDescription,
  };
}

// Mirrors the admin form rules (src/lib/validations/flight-route.ts and
// seo-copy limits) so imported rows can be saved unchanged in the admin.
function validate(row) {
  const problems = [];
  const titleBudget = 60 - " | EasyTrip".length;
  if (row.seoTitle.length > titleBudget) problems.push(`seoTitle ${row.seoTitle.length} > ${titleBudget}`);
  if (row.seoDescription.length < 120 || row.seoDescription.length > 160)
    problems.push(`seoDescription length ${row.seoDescription.length} (120-160)`);
  if (row.intro.length < 200 || row.intro.length > 5000) problems.push(`intro length ${row.intro.length}`);
  if (row.travelTips.some((tip) => tip.length > 300)) problems.push("travel tip over 300 chars");
  if (row.documents.some((doc) => doc.length > 200)) problems.push("document over 200 chars");
  if (row.faqs.some((faq) => faq.question.length > 200 || faq.answer.length > 1000 || faq.answer.length < 10))
    problems.push("FAQ length");
  if (row.airlines.some((a) => !/^[A-Z0-9]{2}$/.test(a.code))) problems.push("airline code");
  return problems;
}

async function main() {
  const write = process.argv.includes("--write");
  const rows = ROUTES.map(buildRow);

  let invalid = false;
  for (const row of rows) {
    const problems = validate(row);
    const words = [row.intro, ...row.travelTips, ...row.documents, ...row.faqs.flatMap((f) => [f.question, f.answer])]
      .join(" ")
      .split(/\s+/).length;
    console.log(`${problems.length ? "✗" : "✓"} /flights/${row.slug}  (${words} words, ${row.airlines.length} airlines, ${row.faqs.length} FAQs)`);
    for (const problem of problems) console.log(`    ! ${problem}`);
    if (problems.length) invalid = true;
  }
  if (invalid) process.exit(1);
  if (!write) {
    console.log("\nDry run. Re-run with --write to insert these routes as drafts.");
    return;
  }

  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const pool = new Pool({
    connectionString: connectionUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]pgbouncer=true/g, ""),
    ssl: /[?&]sslmode=disable\b/.test(connectionUrl) ? false : { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    let created = 0;
    for (const row of rows) {
      const existing = await prisma.flightRoute.findFirst({
        where: {
          OR: [
            { slug: row.slug },
            { originIata: row.originIata, destinationIata: row.destinationIata },
          ],
        },
        select: { id: true },
      });
      if (existing) {
        console.log(`skip  /flights/${row.slug} (already exists)`);
        continue;
      }
      await prisma.flightRoute.create({ data: row });
      created += 1;
      console.log(`added /flights/${row.slug} (draft)`);
    }
    console.log(`\n${created} route(s) created as drafts. Review and publish them in /admin/flight-routes.`);
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

module.exports = { ROUTES, buildRow };
