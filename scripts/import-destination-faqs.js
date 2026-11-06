/* eslint-disable @typescript-eslint/no-require-imports */
// Adds the first FAQs to each destination page (/destinations/<slug>).
// Questions come from what Pakistani travellers search on Google ("People also
// ask") and ask AI assistants about each city, researched November 2026.
// Answers lead with the direct answer so they can be quoted on their own.
//
// Safe to re-run: a destination that already has FAQs is skipped, so admin
// edits in /admin/destinations are never overwritten. Fees and fares change:
// review them in the admin before relying on them long term.
//
//   node scripts/import-destination-faqs.js           # dry run (validates content)
//   node scripts/import-destination-faqs.js --write   # save to destinations with no FAQs
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const FAQS = {
  dubai: [
    {
      question: "Do Pakistanis need a visa for Dubai?",
      answer:
        "Yes. Pakistani passport holders need a UAE visit visa before they fly; there is no visa on arrival. Tourist visas are issued for 30 or 60 days (single or multiple entry) and are applied for through a UAE airline, hotel or licensed travel agent. You need a passport valid for at least 6 months, a white-background photo, a CNIC copy, a confirmed return ticket and a hotel booking or the address of your host in the UAE.",
    },
    {
      question: "How long does a Dubai visit visa take from Pakistan?",
      answer:
        "GDRFA Dubai lists 48 hours as the expected processing time for tourist visas, but applications sent through agents in Pakistan usually take 3–5 working days, and longer in peak seasons such as Eid and winter holidays. Apply at least 1–2 weeks before your flight and do not book non-refundable tickets until the visa is issued.",
    },
    {
      question: "What is the best time to visit Dubai?",
      answer:
        "November to March is the best time to visit Dubai. Daytime temperatures are around 20–30°C, which is comfortable for desert safaris, beaches, Global Village and outdoor sightseeing. June to September is very hot (often above 40°C), but hotel rates are lower and malls, indoor parks and attractions stay open.",
    },
    {
      question: "How many hours is the flight from Pakistan to Dubai?",
      answer:
        "A direct flight from Karachi to Dubai takes about 2 hours. From Lahore, Islamabad, Peshawar and Multan, direct flights take about 3 to 3.5 hours. Several airlines fly the route every day, so fares change a lot with dates; booking 3–6 weeks ahead and avoiding Eid and school holidays usually gives the best price.",
    },
    {
      question: "How much does a Dubai trip cost from Pakistan?",
      answer:
        "A 5-day Dubai trip from Pakistan typically costs about PKR 180,000 to PKR 450,000 per person (2026 estimate). The main costs are the return flight, the visit visa, the hotel (Deira and Bur Dubai are the most affordable areas), attraction tickets and food. Travelling outside December–January and booking flights early keeps the cost at the lower end.",
    },
    {
      question: "How many days are enough for Dubai?",
      answer:
        "4 to 5 days is enough for a first visit to Dubai. That covers Burj Khalifa and Dubai Mall, the Dubai Fountain, a desert safari, Dubai Marina and JBR beach, the gold and spice souks in Deira, and a day trip to Abu Dhabi for the Sheikh Zayed Grand Mosque. Add 1–2 days for theme parks or shopping.",
    },
    {
      question: "Is Dubai safe for families and women travelling alone?",
      answer:
        "Yes. Dubai is regularly ranked among the safest cities in the world, with low street crime, strong policing and well-lit public areas. Families and women travelling alone can use the metro, taxis and ride-hailing apps comfortably. The main rules to know are strict laws on public behaviour, drugs and photographing people without permission.",
    },
    {
      question: "How do you get around Dubai?",
      answer:
        "The Dubai Metro (Red and Green lines) is the cheapest way to reach Dubai Mall, Deira, Bur Dubai, Dubai Marina and the airport. Buy a Nol card at any metro station and use it on the metro, buses and tram. Taxis, Careem and Uber are widely available for places the metro does not reach, such as desert safari pick-ups and Palm Jumeirah.",
    },
    {
      question: "Is it easy to find halal and Pakistani food in Dubai?",
      answer:
        "Yes. Food in the UAE is halal by default, and any pork is sold and labelled separately. Pakistani restaurants serving biryani, karahi, nihari and BBQ are easy to find in Karama, Bur Dubai, Deira and Al Barsha, and there are mosques and prayer rooms in malls, metro areas and the airport.",
    },
    {
      question: "What should I wear in Dubai?",
      answer:
        "Dress modestly in malls, souks and government buildings: cover your shoulders and knees. Women do not need to cover their hair except when visiting a mosque, where both men and women should wear long sleeves and long trousers or skirts. Swimwear is fine at beaches, pools and water parks but not in malls or on the street.",
    },
  ],

  jeddah: [
    {
      question: "Can Pakistanis get a Saudi tourist visa?",
      answer:
        "Pakistan is not on the list of countries that can get a Saudi tourist eVisa by nationality alone. A Pakistani passport holder can get the tourist eVisa (or a visa on arrival) only if they hold a valid US, UK or Schengen visa that has already been used at least once, or a residence permit from one of those countries or a GCC state. Otherwise, Pakistanis travel to Jeddah on an Umrah, family visit, business or work visa.",
    },
    {
      question: "How do I get an Umrah visa from Pakistan?",
      answer:
        "Pakistanis apply for an Umrah visa through a Ministry of Religious Affairs (MoRA) licensed Umrah operator, which books your Saudi-approved hotel and transport and submits the application on the Nusuk system. You need a passport valid for at least 6 months, a photo, a CNIC copy, a confirmed return ticket and the required vaccination certificates. Processing usually takes a few working days once the package is booked.",
    },
    {
      question: "Which vaccinations are required to travel from Pakistan to Saudi Arabia?",
      answer:
        "Umrah and Hajj travellers need a meningococcal (ACYW) meningitis vaccine taken at least 10 days before arrival, with the certificate. Travellers leaving Pakistan must also carry a valid polio vaccination certificate, which is checked at the airport before departure. The current Saudi Ministry of Health rules also recommend seasonal flu and COVID-19 vaccines.",
    },
    {
      question: "How far is Makkah from Jeddah and how do I get there?",
      answer:
        "Makkah is about 80 km from Jeddah. The fastest way is the Haramain High-Speed Railway, which takes about 35–45 minutes from Jeddah Al-Sulaymaniyah station or the King Abdulaziz Airport station. In 2026, economy fares are roughly SAR 40–50 one way. By car or taxi the drive takes about 1 to 1.5 hours, depending on traffic near the Haram.",
    },
    {
      question: "Can women perform Umrah without a mahram?",
      answer:
        "Yes. Saudi Arabia's Ministry of Hajj and Umrah has allowed women to perform Umrah without a mahram since 2022, as long as they travel with an approved operator or group. Some Pakistani operators and airlines still have their own rules for women travelling alone, so confirm the requirements with your operator before booking.",
    },
    {
      question: "What is the dress code for tourists in Jeddah?",
      answer:
        "Foreign women do not have to wear an abaya or headscarf in Jeddah, but modest clothing that covers the shoulders and knees is expected in public. Both men and women should avoid tight or see-through clothes. A headscarf is required in mosques, and pilgrims wear ihram from the miqat when travelling to Makkah for Umrah.",
    },
    {
      question: "What is the best time to visit Jeddah?",
      answer:
        "November to March is the best time to visit Jeddah, with temperatures around 20–30°C that suit Umrah and walks along the Corniche and through Al-Balad. Summer (June to September) is hot and humid, often above 40°C. Ramadan and the school holidays are the busiest periods for Umrah, so book flights and hotels early if you travel then.",
    },
    {
      question: "What are the best places to visit in Jeddah?",
      answer:
        "The top sights in Jeddah are Al-Balad, the historic old town with coral-stone houses (a UNESCO World Heritage Site since 2014); the Jeddah Corniche and King Fahd's Fountain; the Al-Rahma Floating Mosque; the Jeddah Waterfront; and malls such as Red Sea Mall and Mall of Arabia. Many Umrah travellers spend a day in Jeddah before or after Makkah.",
    },
    {
      question: "How many days do you need for an Umrah trip from Pakistan?",
      answer:
        "Most Umrah packages from Pakistan last 14 to 21 days, split between Makkah and Madinah, with Jeddah used as the arrival or departure airport. A shorter trip of 7–10 days is possible if you have limited leave. Allow at least one full day in Jeddah if you also want to visit Al-Balad and the Corniche.",
    },
    {
      question: "What currency is used in Jeddah and are cards accepted?",
      answer:
        "Saudi Arabia uses the Saudi Riyal (SAR), which is fixed at 3.75 riyals to one US dollar. Debit and credit cards and mobile payments are accepted almost everywhere in Jeddah, Makkah and Madinah, including taxis and small shops. Carry some cash for street vendors and tips, and exchange money at the airport or licensed exchange shops.",
    },
  ],

  istanbul: [
    {
      question: "Do Pakistanis need a visa for Turkey?",
      answer:
        "Yes. Pakistani passport holders need a visa for Turkey, and there is no visa on arrival. Most Pakistanis apply for a sticker visa through the Anatolia visa application centres in Pakistan. You can get the Turkey e-Visa online instead only if you hold a valid visa or residence permit from the US, UK, Ireland or a Schengen country.",
    },
    {
      question: "How long does a Turkey visa take from Pakistan?",
      answer:
        "A Turkey sticker visa from Pakistan usually takes about 2–4 weeks after you submit your documents, and longer in the summer peak. Apply at least a month before travel. You will need a passport valid for at least 6 months, bank statements, a hotel booking, a return ticket, travel insurance, proof of employment or business, and a polio vaccination certificate.",
    },
    {
      question: "What is the best time to visit Istanbul?",
      answer:
        "April to May and September to October are the best times to visit Istanbul. The weather is mild (about 15–25°C), the tulips bloom in April, and crowds and hotel prices are lower than in summer. July and August are hot and busy, and winter (December to February) is cold and rainy, but it is the cheapest time to go.",
    },
    {
      question: "Which airport should I fly into, Istanbul Airport or Sabiha Gökçen?",
      answer:
        "Istanbul Airport (IST) is on the European side, about 40 km from the old city, and handles Turkish Airlines and most flights from Pakistan. Sabiha Gökçen (SAW) is on the Asian side and is used mainly by Pegasus and other low-cost airlines. The two airports are more than an hour apart, so check which one your ticket uses before booking a hotel or transfer.",
    },
    {
      question: "How do I get from Istanbul Airport to the city centre?",
      answer:
        "From Istanbul Airport (IST), the M11 metro connects to the city's metro network, and Havaist buses go to Taksim, Sultanahmet and other central areas (you pay by tapping a bank card). A taxi to Sultanahmet takes about 45–60 minutes depending on traffic. From Sabiha Gökçen, use the M4 metro or Havabus to Kadıköy and Taksim.",
    },
    {
      question: "Do I need an Istanbulkart?",
      answer:
        "Yes, an Istanbulkart is the easiest way to travel in Istanbul. The reloadable card works on the metro, trams, buses, Marmaray and the Bosphorus ferries, and is cheaper than single tickets. Buy and top it up at the machines at metro stations and ferry piers. Havaist airport buses do not accept it.",
    },
    {
      question: "Is halal food easy to find in Istanbul?",
      answer:
        "Yes. Turkey is a Muslim-majority country and almost all meat in Istanbul is halal, so kebabs, döner, köfte, pide and Turkish breakfasts are easy to find. Pork is rarely sold, but many restaurants serve alcohol, so look for places that do not if that matters to you. Mosques are everywhere, and the call to prayer can be heard across the city.",
    },
    {
      question: "Is the Blue Mosque free and how much is Hagia Sophia?",
      answer:
        "The Blue Mosque (Sultan Ahmed Mosque) is free to enter, with no ticket. Foreign visitors to Hagia Sophia pay about €25 for the upper-gallery visit (2026 price), while Muslims can enter the prayer area for prayers. Both close to tourists during the five daily prayers, especially Friday midday prayers. Dress modestly; women need to cover their hair.",
    },
    {
      question: "How many days do you need in Istanbul?",
      answer:
        "4 to 5 days is enough for Istanbul. Spend 2 days in the old city (Hagia Sophia, Blue Mosque, Topkapı Palace, Basilica Cistern and the Grand Bazaar), a day on a Bosphorus cruise and the Galata area, and a day on the Asian side in Kadıköy or Üsküdar. Many travellers add 2–3 days for Cappadocia, a 1.5-hour flight away.",
    },
    {
      question: "Is Istanbul expensive for tourists from Pakistan?",
      answer:
        "Istanbul is mid-priced compared with Europe. Public transport and street food are cheap, while hotels in Sultanahmet and Taksim, museum tickets (often priced in euros) and Bosphorus dinner cruises cost more. The Turkish lira changes value often, so check the current rate before you go. Cards are widely accepted, but carry some lira for small shops and the bazaar.",
    },
  ],

  london: [
    {
      question: "Do Pakistanis need a visa for London?",
      answer:
        "Yes. Pakistani passport holders need a UK Standard Visitor visa to visit London; the UK ETA does not apply to Pakistani citizens. Apply online on GOV.UK, then give your fingerprints and photo at a VFS Global visa centre in Islamabad, Lahore, Karachi or Mirpur. From 8 April 2026 the 6-month visitor visa fee is £135.",
    },
    {
      question: "How long does a UK visit visa take from Pakistan?",
      answer:
        "Most UK visitor visa decisions are made within 3 weeks of your biometrics appointment. Priority and super priority services give a faster decision at extra cost where available. You can apply up to 3 months before your travel date, so apply early for summer and December trips, when demand is highest.",
    },
    {
      question: "How much bank balance do I need for a UK visit visa?",
      answer:
        "There is no fixed minimum balance for a UK visit visa. You need to show 6 months of bank statements with enough money to cover your trip, a regular income, and strong ties to Pakistan, such as a job, business, property or family. Large deposits made just before applying, with no explanation, are a common reason for refusal.",
    },
    {
      question: "How long is the flight from Pakistan to London?",
      answer:
        "A direct flight from Pakistan to London takes about 8 to 9 hours. Most travellers fly with one stop in the Gulf or Istanbul, which usually takes 11 to 15 hours in total. Most flights arrive at Heathrow (LHR), while some arrive at Manchester or Birmingham, which have fast train links to London.",
    },
    {
      question: "How do I get from Heathrow to central London?",
      answer:
        "There are three train options from Heathrow. The Piccadilly line (Tube) is the cheapest at about £5.50, but takes around an hour. The Elizabeth line costs about £15.50 to central London and takes around 30–40 minutes. Heathrow Express is the fastest, 15 minutes to Paddington, but costs about £26. You can tap a contactless card or Oyster on the Tube and Elizabeth line.",
    },
    {
      question: "Should I use Oyster or a contactless card in London?",
      answer:
        "Both cost the same, and both cap your daily spend (about £8.90 a day for Zones 1–2 in 2026). Tapping your own contactless bank card is easiest, but some Pakistani cards add a foreign-transaction fee to every tap, so an Oyster card can be cheaper for them. Always tap in and out on the Tube, or you are charged the maximum fare.",
    },
    {
      question: "Is halal food easy to find in London?",
      answer:
        "Yes. London has thousands of halal restaurants, butchers and takeaways. Whitechapel and Brick Lane, Edgware Road, Southall, Tooting and Green Street are known for Pakistani, Arab and Turkish food. Halal options are common in central areas too. Large mosques include the London Central Mosque at Regent's Park and the East London Mosque.",
    },
    {
      question: "What is the best time to visit London?",
      answer:
        "April to June and September to October are the best times to visit London, with mild weather (about 12–22°C) and long days. July and August are the warmest and busiest months, and November to February is cold and dark early but has Christmas markets and lights. Carry an umbrella in every season, because rain is common.",
    },
    {
      question: "How many days do you need in London?",
      answer:
        "5 to 7 days is ideal for London. That gives time for Buckingham Palace, Westminster and Big Ben, the Tower of London, the British Museum and the Natural History Museum (both free), the London Eye, Oxford Street, and a day trip to Windsor, Oxford or Cambridge.",
    },
  ],

  "kuala-lumpur": [
    {
      question: "Do Pakistanis need a visa for Malaysia?",
      answer:
        "Yes. Pakistani passport holders need a visa for Malaysia, which most travellers get as an eVisa through the official Malaysian immigration eVisa portal. The tourist eVisa allows a single stay of up to 30 days and cannot be extended. You must apply from outside Malaysia. You need a passport valid for at least 6 months, a photo, a return ticket, a hotel booking and recent bank statements.",
    },
    {
      question: "What is the Malaysia Digital Arrival Card (MDAC)?",
      answer:
        "The MDAC is a free online arrival form that every visitor to Malaysia must complete, in addition to the visa, within 3 days before arrival. Fill it in on the official Malaysian immigration website and keep the confirmation on your phone or printed, as airlines and immigration may check it. Avoid look-alike websites that charge a fee for the MDAC.",
    },
    {
      question: "How long does the Malaysia eVisa take?",
      answer:
        "The Malaysia eVisa is usually approved within a few working days, but it can take longer in busy periods or if documents are missing. Apply at least 2 weeks before your flight, and do not travel until you have received the approved eVisa by email. Carry a printed copy along with your MDAC confirmation.",
    },
    {
      question: "How long is the flight from Pakistan to Kuala Lumpur?",
      answer:
        "A direct flight from Lahore or Karachi to Kuala Lumpur takes about 5.5 to 6 hours. Flights with one stop, often in the Gulf or Bangkok, take 9 to 14 hours. Flights land at Kuala Lumpur International Airport (KLIA), which is about 55 km south of the city centre.",
    },
    {
      question: "How do I get from KLIA to Kuala Lumpur city centre?",
      answer:
        "The KLIA Ekspres train is the fastest way: about 28–35 minutes to KL Sentral for RM55 one way (2026 fare). Airport coaches are cheaper but take about an hour. A Grab ride costs roughly RM65–100 and can be good value for families or groups of three or more. Avoid unlicensed taxi touts in the arrivals hall.",
    },
    {
      question: "Is halal food easy to find in Kuala Lumpur?",
      answer:
        "Yes. Malaysia is a Muslim-majority country and halal food is everywhere in Kuala Lumpur. Look for the JAKIM halal logo at restaurants and packaged food. Malay dishes such as nasi lemak and satay, mamak restaurants serving roti canai and teh tarik, and Pakistani and Arab restaurants around Bukit Bintang are all easy to find. Malls have prayer rooms (surau).",
    },
    {
      question: "What is the best time to visit Kuala Lumpur?",
      answer:
        "Kuala Lumpur can be visited all year: it is hot (about 30–33°C) and humid in every season. June to August and January to February tend to be drier, while March to April and October to November bring the heaviest afternoon rain. Rain usually comes in short, heavy showers, so plan outdoor sightseeing for the morning.",
    },
    {
      question: "How many days are enough for Kuala Lumpur?",
      answer:
        "3 to 4 days is enough for Kuala Lumpur. That covers the Petronas Twin Towers and KLCC Park, Batu Caves, Merdeka Square, KL Tower, Bukit Bintang and Central Market, plus a day trip to Genting Highlands or Putrajaya. Many travellers add 3–4 days in Langkawi or Penang, a short flight away.",
    },
    {
      question: "How do you get around Kuala Lumpur?",
      answer:
        "The LRT, MRT, monorail and KTM trains connect most sights, and a Touch 'n Go card works on all of them and on buses. Grab is cheap and widely used for door-to-door trips. Free GOKL city buses loop around Bukit Bintang and KLCC. Walking is possible in the centre, but the heat makes short Grab rides popular.",
    },
  ],

  karachi: [
    {
      question: "What is the best time to visit Karachi?",
      answer:
        "November to February is the best time to visit Karachi, with mild temperatures of about 15–28°C and a cool sea breeze, which suits beach trips and sightseeing. Summer (April to June) is hot and very humid, and the July–August monsoon can bring heavy rain and flooding. Swimming at the beaches is usually banned during the monsoon because of rough seas.",
    },
    {
      question: "How long is the flight to Karachi from Lahore and Islamabad?",
      answer:
        "A direct flight from Lahore to Karachi takes about 1 hour 45 minutes, and from Islamabad about 2 hours. Several Pakistani airlines fly these routes many times a day, and flights land at Jinnah International Airport (KHI). By road, Lahore to Karachi is around 1,200 km on the motorway, a full day's drive.",
    },
    {
      question: "What are the best places to visit in Karachi?",
      answer:
        "The top places to visit in Karachi are Mazar-e-Quaid, the tomb of Quaid-e-Azam Muhammad Ali Jinnah; Clifton Beach and Sea View; Mohatta Palace; Frere Hall; the Pakistan Maritime Museum; Port Grand; Manora Island; and the old city around Empress Market. Do Darya is popular in the evening for seafood with sea views.",
    },
    {
      question: "Which are the best beaches in Karachi?",
      answer:
        "The most popular beaches in Karachi are Clifton Beach (Sea View) in the city; Hawke's Bay and Sandspit, about 45 minutes away and known for turtle nesting; and French Beach and the beaches near Mubarak Village to the west, which have clearer water. Many families rent huts at Hawke's Bay or French Beach for a day trip.",
    },
    {
      question: "What food is Karachi famous for and where should I eat?",
      answer:
        "Karachi is famous for biryani, nihari, haleem, bun kebab, BBQ and seafood. Burns Road is the city's best-known food street for traditional dishes, Boat Basin in Clifton is busy late at night, and Do Darya in DHA serves seafood by the sea. Karachi's food scene stays open late, especially at weekends.",
    },
    {
      question: "How do I get from Karachi airport to Clifton or DHA?",
      answer:
        "Jinnah International Airport is about 15–20 km from Clifton and DHA, roughly 30–45 minutes by car depending on traffic. Ride-hailing apps such as Careem, inDrive and Yango are the most convenient and show the fare upfront. Many hotels also arrange airport pick-ups if you book in advance.",
    },
    {
      question: "Is Karachi safe for tourists?",
      answer:
        "The main tourist areas of Karachi, such as Clifton, DHA, Saddar and the beaches, are busy and generally safe for visitors who take normal big-city precautions. Street crime such as mobile phone snatching is the most common problem, so keep valuables out of sight, use ride-hailing apps rather than street taxis, and avoid large political gatherings.",
    },
    {
      question: "How many days are enough for Karachi?",
      answer:
        "3 to 4 days is enough for Karachi. That gives you a day for Mazar-e-Quaid, Frere Hall, Mohatta Palace and the old city; a day at Clifton, Sea View and Port Grand; a beach day at Hawke's Bay or French Beach; and evenings on Burns Road and at Do Darya.",
    },
    {
      question: "Where is the best shopping in Karachi?",
      answer:
        "For shopping in Karachi, Dolmen Mall Clifton, Lucky One Mall and Ocean Mall have local and international brands. Tariq Road is known for clothes and shoes at local prices, Zainab Market for handicrafts and souvenirs, and Saddar and Bohri Bazaar for fabrics, jewellery and bargains.",
    },
  ],

  islamabad: [
    {
      question: "What is the best time to visit Islamabad?",
      answer:
        "March to April and October to November are the best times to visit Islamabad, with mild weather (about 15–28°C) for hiking in the Margalla Hills and sightseeing. Summer (May to June) is very hot, and the July–August monsoon brings heavy rain. Winter (December to February) is cool and foggy, and nearby Murree and the Galiyat often get snow.",
    },
    {
      question: "What are the best places to visit in Islamabad?",
      answer:
        "The top places to visit in Islamabad are Faisal Mosque, Daman-e-Koh viewpoint, the Pakistan Monument and its museum, Lok Virsa Heritage Museum, Rawal Lake and Lake View Park, Saidpur Village, Shakarparian, and the Margalla Hills hiking trails. Pir Sohawa, further up the Margalla Hills, is popular for its views and restaurants.",
    },
    {
      question: "Can visitors go inside Faisal Mosque?",
      answer:
        "Yes. Faisal Mosque is open to visitors, including non-Muslims, outside prayer times, and entry is free. Dress modestly: men and women should cover their arms and legs, and women should cover their hair. Shoes are left at the entrance. Visit in the late afternoon for the best light, and avoid Friday midday prayers if you want to look around.",
    },
    {
      question: "Which Margalla Hills trail is best for beginners?",
      answer:
        "Trail 3, which starts near Sector F-6, is the most popular Margalla Hills trail and suits most fit beginners; it takes about 1–1.5 hours to the first viewpoint. Trail 5 is longer but gentler, and Trail 6 links to Daman-e-Koh. Start early in the morning, carry water, stay on marked trails and avoid hiking alone after dark.",
    },
    {
      question: "How far is Murree from Islamabad?",
      answer:
        "Murree is about 60 km from Islamabad, around 1.5 to 2 hours by car via the Murree Expressway. Nathia Gali and the Galiyat are about 80–90 km away, a 2.5–3 hour drive. In winter, check the road status and weather before leaving, as heavy snow can cause traffic jams and temporary entry limits.",
    },
    {
      question: "How do I get from Islamabad airport to the city?",
      answer:
        "Islamabad International Airport is about 25–30 km from the city centre, around 30–45 minutes by car. Careem, inDrive and Yango offer ride-hailing with upfront fares, and the Orange Line Metro Bus connects the airport to Peshawar Mor in the city, where you can change to the Red Line towards Rawalpindi.",
    },
    {
      question: "How long does it take to travel from Lahore or Karachi to Islamabad?",
      answer:
        "From Lahore, the M-2 motorway takes about 4 to 4.5 hours by car, and several daily buses run the route; a direct flight takes about 1 hour. From Karachi, a direct flight to Islamabad takes about 2 hours, and the train takes more than 20 hours.",
    },
    {
      question: "Is Islamabad safe for tourists?",
      answer:
        "Islamabad is considered one of Pakistan's safest and best-planned cities, with well-policed sectors, wide roads and many green parks. Visitors should still take normal precautions, keep their CNIC or passport with them for police checkpoints, avoid political gatherings, and use ride-hailing apps at night.",
    },
    {
      question: "How many days are enough for Islamabad?",
      answer:
        "2 to 3 days is enough to see Islamabad's main sights, including Faisal Mosque, Daman-e-Koh, the Pakistan Monument, Lok Virsa, Saidpur Village and a Margalla Hills hike. Add 1–2 days for a trip to Murree or Nathia Gali, or a day in Rawalpindi for its old bazaars and food.",
    },
  ],
};

const LIMITS = { maxFaqs: 10, question: [5, 200], answer: [10, 1000] };

function validate(slug, faqs) {
  const problems = [];
  if (faqs.length > LIMITS.maxFaqs) problems.push(`${faqs.length} FAQs (max ${LIMITS.maxFaqs})`);
  const seen = new Set();
  for (const { question, answer } of faqs) {
    const q = question.trim();
    const a = answer.trim();
    if (q.length < LIMITS.question[0] || q.length > LIMITS.question[1]) problems.push(`question length ${q.length}: "${q}"`);
    if (a.length < LIMITS.answer[0] || a.length > LIMITS.answer[1]) problems.push(`answer length ${a.length}: "${q}"`);
    if (seen.has(q.toLowerCase())) problems.push(`duplicate question: "${q}"`);
    seen.add(q.toLowerCase());
  }
  return problems;
}

async function main() {
  const write = process.argv.includes("--write");

  let invalid = false;
  for (const [slug, faqs] of Object.entries(FAQS)) {
    const problems = validate(slug, faqs);
    const longest = Math.max(...faqs.map((f) => f.answer.length));
    console.log(`${problems.length ? "✗" : "✓"} /destinations/${slug}  (${faqs.length} FAQs, longest answer ${longest} chars)`);
    for (const problem of problems) console.log(`    ! ${problem}`);
    if (problems.length) invalid = true;
  }
  if (invalid) process.exit(1);

  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const pool = new Pool({
    connectionString: connectionUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]pgbouncer=true/g, ""),
    ssl: /[?&]sslmode=disable\b/.test(connectionUrl) ? false : { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const destinations = await prisma.destination.findMany({ select: { id: true, slug: true, faqs: true } });
    const bySlug = new Map(destinations.map((d) => [d.slug, d]));

    for (const d of destinations) {
      if (!FAQS[d.slug]) console.log(`note  /destinations/${d.slug} has no FAQs in this script`);
    }

    let updated = 0;
    for (const [slug, faqs] of Object.entries(FAQS)) {
      const destination = bySlug.get(slug);
      if (!destination) {
        console.log(`skip  /destinations/${slug} (no destination with this slug)`);
        continue;
      }
      if (Array.isArray(destination.faqs) && destination.faqs.length > 0) {
        console.log(`skip  /destinations/${slug} (already has ${destination.faqs.length} FAQs)`);
        continue;
      }
      if (!write) {
        console.log(`would add ${faqs.length} FAQs to /destinations/${slug}`);
        continue;
      }
      await prisma.destination.update({ where: { id: destination.id }, data: { faqs } });
      updated += 1;
      console.log(`added ${faqs.length} FAQs to /destinations/${slug}`);
    }

    console.log(write ? `\n${updated} destination(s) updated.` : "\nDry run. Re-run with --write to save these FAQs.");
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
