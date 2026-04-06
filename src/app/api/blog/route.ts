import { NextRequest, NextResponse } from "next/server";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { blogPostSchema } from "@/lib/validations/blog";

export type BlogPostRow = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    author: string;
    category: string;
    tags: unknown;
    status: string;
    publishedAt: Date | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
};

export const DUMMY_BLOG_POSTS: BlogPostRow[] = [
    {
        id: "bp01",
        slug: "top-tips-for-umrah-first-timers",
        title: "Top Tips for Umrah First-Timers",
        excerpt:
            "Everything you need to know before your first Umrah journey — from packing essentials to navigating the Haram.",
        content: `<h1>Top Tips for Umrah First-Timers</h1>
<p>Embarking on your first Umrah journey is one of the most spiritual experiences of your life. To ensure your pilgrimage is smooth, comfortable, and deeply fulfilling, here are our essential tips compiled from years of assisting thousands of pilgrims.</p>

<h2>1. Physical and Spiritual Preparation</h2>
<p>Before you travel, spend time in spiritual reflection and prayer. Consider consulting your imam or local Islamic center for guidance on the rituals. Additionally, get a proper medical checkup and ensure you are physically fit for the journey, especially if you are elderly or have health concerns.</p>

<h2>2. Packing Essentials</h2>
<ul>
  <li><strong>Ihram Clothing:</strong> Two sets of white, seamless garments (preferably cotton for comfort)</li>
  <li><strong>Comfortable Shoes:</strong> Slip-on sandals that are easy to remove for prayers</li>
  <li><strong>Toiletries:</strong> Unscented soap, shampoo, and personal hygiene items</li>
  <li><strong>Medications:</strong> Any prescribed medications plus pain relievers and digestive aids</li>
  <li><strong>Documentation:</strong> Passport, visa, vaccination certificates, and copies of important documents</li>
</ul>

<h2>3. Understanding the Rituals</h2>
<p>Umrah consists of Ihram, Tawaf (circumambulation of the Kaaba), Sa'y (walking between Safa and Marwa), and Halaq or Taqsir (hair cutting). Learn these rituals beforehand through videos or local imams to feel more confident once you arrive.</p>

<h2>4. Timing Your Journey</h2>
<p>The best times to perform Umrah are outside of Hajj season. Avoid Ramadan if it's your first time, as the Haram becomes extremely crowded. November to March offers comfortable weather and fewer crowds.</p>

<h2>5. Choosing the Right Package</h2>
<p>Select an Umrah package that includes hotel accommodation close to the Haram. The closer your hotel, the easier it will be to perform prayers on time and rest between rituals. Look for packages with experienced guides who speak your language.</p>

<h2>6. Stay Hydrated and Take Care of Your Health</h2>
<p>Saudi Arabia's heat can be intense. Carry a water bottle at all times and drink regularly, even if you don't feel thirsty. Wear sunscreen and a hat, especially during Tawaf. Break your rituals if you feel unwell—your health is important.</p>

<h2>7. Be Respectful and Mindful</h2>
<p>Remember you're in one of the holiest places on Earth. Be respectful to other pilgrims, maintain silence during prayers, and follow the instructions of Haram staff and guides. Photography in certain areas may be restricted—always ask first.</p>

<h2>8. Budget Wisely</h2>
<p>Besides your package cost, budget for personal expenses like meals outside hotels, souvenirs, and tips for guides. Exchange some currency before you travel to avoid unfavorable rates at airports.</p>

<h2>Conclusion</h2>
<p>Your first Umrah is a journey of faith and personal growth. With proper preparation and the right mindset, it will be an experience that stays with you forever. We wish you a blessed and fulfilling pilgrimage.</p>`,
        coverImageUrl:
            "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "umrah",
        tags: ["umrah", "tips", "first-time"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-02-10"),
        sortOrder: 1,
        createdAt: new Date("2026-02-10"),
        updatedAt: new Date("2026-02-10"),
    },
    {
        id: "bp02",
        slug: "best-time-to-visit-dubai",
        title: "Best Time to Visit Dubai in 2026",
        excerpt:
            "Dubai shines year-round, but these months offer the best weather, prices, and events for Pakistani and UK travellers.",
        content: `<h1>Best Time to Visit Dubai in 2026</h1>
<p>Dubai is a destination that attracts millions of visitors each year with its stunning architecture, pristine beaches, and world-class shopping. But when is the best time to visit? Let's break down the seasons and help you plan the perfect Dubai getaway.</p>

<h2>Winter Season: November to March (The Best Time)</h2>
<p>Without a doubt, winter is the ideal season to visit Dubai. With daytime temperatures ranging from 20-25°C (68-77°F) and cool evenings, you'll enjoy comfortable weather perfect for outdoor activities. This period also marks the Dubai Shopping Festival and other cultural events.</p>

<h3>Advantages:</h3>
<ul>
  <li>Perfect weather for beach visits and outdoor activities</li>
  <li>Major shopping festivals with huge discounts</li>
  <li>Desert safaris and dune bashing are most enjoyable</li>
  <li>Lower humidity levels</li>
  <li>Ideal for families with children</li>
</ul>

<h3>Disadvantages:</h3>
<ul>
  <li>Higher hotel rates and airfares</li>
  <li>Crowded beaches and attractions</li>
  <li>Bookings may need to be made in advance</li>
</ul>

<h2>Spring Season: April to May</h2>
<p>As temperatures start rising (25-35°C), spring is a transitional period. It's less crowded than winter and offers reasonable prices compared to peak season.</p>

<h2>Summer Season: June to August</h2>
<p>Summer experiences extreme heat with temperatures soaring to 40-50°C (104-122°F). However, this is also the best time for budget travelers as hotel prices drop significantly by 30-50%.</p>

<h3>Benefits for Budget Travelers:</h3>
<ul>
  <li>Substantial discounts on accommodations</li>
  <li>Fewer tourists and shorter queues at attractions</li>
  <li>Special mall sales and promotions</li>
  <li>Indoor attractions like shopping malls and museums remain cool</li>
</ul>

<h2>Autumn Season: September to October</h2>
<p>Temperatures begin to cool down from the intense summer heat. It's a good transition period with moderate prices and fewer crowds. September is particularly quiet, making it an underrated time to visit.</p>

<h2>Special Events Calendar 2026</h2>
<ul>
  <li><strong>January:</strong> Dubai Marathon, New Year celebrations</li>
  <li><strong>February:</strong> Dubai Shopping Festival (extended), food festivals</li>
  <li><strong>March:</strong> Dubai World Cup (horse racing), cultural events</li>
  <li><strong>August:</strong> Dubai Summer Surprises (major sales)</li>
  <li><strong>November:</strong> Ramadan events and preparations</li>
</ul>

<h2>Budget Traveler's Recommendation</h2>
<p>For Pakistani travelers on a budget, consider visiting in April-May or September-October. You'll get pleasant weather at significantly lower prices than peak season.</p>

<h2>Conclusion</h2>
<p>Whether you're seeking comfort or budget-friendly options, Dubai has something to offer year-round. Winter is unbeatable for overall experience, but don't overlook shoulder seasons for your perfect Dubai escape.</p>`,
        coverImageUrl:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "destinations",
        tags: ["dubai", "uae", "travel-guide"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-02-18"),
        sortOrder: 2,
        createdAt: new Date("2026-02-18"),
        updatedAt: new Date("2026-02-18"),
    },
    {
        id: "bp03",
        slug: "how-to-find-cheap-flights-from-pakistan",
        title: "How to Find Cheap Flights from Pakistan",
        excerpt:
            "Insider strategies for booking the cheapest international fares from Karachi, Lahore, and Islamabad.",
        content: `<h1>How to Find Cheap Flights from Pakistan</h1>
<p>One of the biggest expenses for travelers from Pakistan is airfare. International flights can burn through your travel budget quickly. But don't worry—we've compiled insider strategies to help you book the cheapest flights from Karachi, Lahore, and Islamabad.</p>

<h2>1. Be Flexible with Your Travel Dates</h2>
<p>Flexibility is your secret weapon for cheap flights. Traveling mid-week (Tuesday-Thursday) is typically 10-30% cheaper than weekend flights. Similarly, flights departing early morning or late night are often more affordable.</p>

<h3>The Sweet Spot:</h3>
<ul>
  <li>Tuesday and Wednesday departures</li>
  <li>Flights between 6-8 AM or 11 PM onwards</li>
  <li>Avoid peak holiday seasons</li>
</ul>

<h2>2. Use Fare Comparison Websites Strategically</h2>
<p>Websites like Skyscanner, Google Flights, Kayak, and Expedia allow you to compare prices across multiple airlines instantly. Set up price alerts—these tools will notify you when prices drop for your desired route.</p>

<h3>Pro Tips:</h3>
<ul>
  <li>Clear your browser cookies before searching different airlines</li>
  <li>Search in an incognito window to avoid dynamic pricing</li>
  <li>Compare prices in Pakistani Rupees before converting currency</li>
</ul>

<h2>3. Consider Layover Options</h2>
<p>Direct flights are convenient but expensive. Flying with one or two layovers can save you 20-40% on fares. Consider layovers in cities like Istanbul, Doha, or Dubai—they're often shorter anyway and give you a brief city experience.</p>

<h2>4. Book Connecting Flights Separately</h2>
<p>Sometimes booking two separate tickets (Pakistan to a hub, then hub to destination) is cheaper than a combined booking. However, ensure sufficient layover time and take responsibility for any delays.</p>

<h2>5. Set Up Price Alerts and Follow Airlines on Social Media</h2>
<p>Major carriers like Pakistan International Airlines (PIA), Turkish Airlines, Emirates, and Air Sial frequently offer flash sales. Follow them on Facebook and Twitter—they often post deals exclusively to social media followers.</p>

<h2>6. Consider Flying from Different Cities</h2>
<p>If you're in Punjab, occasionally check fares from Karachi or Peshawar. The difference in ticket prices can sometimes offset transportation costs to a different city's airport.</p>

<h2>7. Look for Package Deals</h2>
<p>Travel agencies and tour operators often bundle flights with hotels at discounted rates. If your destination includes accommodation, this might be more economical than booking components separately.</p>

<h2>8. Book in Advance (But Not Too Early)</h2>
<p>The sweet spot for booking international flights is typically 2-3 months in advance. Booking more than 6 months ahead sometimes results in higher prices as rates haven't yet dropped. Last-minute bookings are rarely cheap unless it's a flash sale.</p>

<h2>9. Clear Your Cache and Use VPNs</h2>
<p>Some travel websites use dynamic pricing based on your location and search history. Use a VPN to simulate searches from different locations or try incognito browsing to potentially see lower prices.</p>

<h2>10. Check Specialty Airfare Websites</h2>
<p>Websites like Momondo and Hopper are specifically designed to find flights airlines don't heavily advertise. These can uncover hidden gem fares.</p>

<h2>Real-World Example: Karachi to London</h2>
<ul>
  <li><strong>Direct flight:</strong> PKR 90,000-120,000</li>
  <li><strong>With one layover (Istanbul):</strong> PKR 60,000-80,000</li>
  <li><strong>Separate bookings (KHI-IST, then IST-LHR):</strong> PKR 55,000-75,000</li>
</ul>

<h2>Final Tips</h2>
<ul>
  <li>Being a Pakistani traveler, you have legitimate cheap options via regional hubs</li>
  <li>Patience and persistence pay off—check prices at least 5-7 times before booking</li>
  <li>Consider the total cost (flight + transfer + comfort) not just base fare</li>
  <li>Travel during shoulder seasons for the best deals</li>
</ul>

<h2>Conclusion</h2>
<p>Booking cheap flights requires strategy, flexibility, and research. By implementing these tips, you can save thousands of rupees on your next international journey. Happy travels!</p>`,
        coverImageUrl:
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "flights",
        tags: ["flights", "budget", "pakistan"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-01"),
        sortOrder: 3,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
    },
    {
        id: "bp04",
        slug: "istanbul-travel-guide-2026",
        title: "Istanbul Travel Guide 2026",
        excerpt:
            "From the Grand Bazaar to Sultanahmet, how to make the most of a 5-day Istanbul trip on any budget.",
        content: `<h1>Istanbul Travel Guide 2026: Your Complete 5-Day Itinerary</h1>
<p>Istanbul, straddling Europe and Asia, is one of the world's most enchanting cities. With a rich history spanning over 2,600 years, stunning architecture, and mouthwatering cuisine, Istanbul deserves every minute you can spare. Here's our comprehensive guide to making the most of a 5-day visit.</p>

<h2>Getting Around Istanbul</h2>
<p>Purchase an Istanbulkart (rechargeable transit card) for seamless travel on metros, trams, buses, and ferries. It's cheaper and more convenient than buying individual tickets.</p>

<h2>Day 1: Historic Sultanahmet District</h2>
<p>Start in the heart of old Istanbul where centuries of history come alive.</p>

<h3>Morning: Blue Mosque & Hagia Sophia</h3>
<ul>
  <li>Visit at sunrise to avoid crowds</li>
  <li>The Blue Mosque (Sultanahmet Camii) is free to enter outside prayer times</li>
  <li>Currently, Hagia Sophia is a mosque, entry is free but best visited early morning</li>
</ul>

<h3>Afternoon: Topkapi Palace</h3>
<p>Explore the grand residence of Ottoman sultans for 3-4 hours. Book tickets online to skip queues. The palace grounds offer spectacular views of the Bosphorus.</p>

<h3>Evening: Basilica Cistern & Dinner</h3>
<p>Descend into the underground Byzantine water cistern—a peaceful, atmospheric marvel. Have dinner at a rooftop restaurant overlooking the illuminated mosques.</p>

<h2>Day 2: The Grand Bazaar & Asian Side</h2>

<h3>Morning: Grand Bazaar (Kapalı Çarşı)</h3>
<p>Get lost in the 66 interconnected streets of this 500-year-old marketplace. Shop for carpets, spices, ceramics, and Turkish delight. Don't forget to bargain!</p>

<h3>Afternoon: Bosphorus Cruise</h3>
<p>Take a sunset cruise on the Bosphorus, separating Europe from Asia. This relaxing boat ride offers stunning views of palaces, bridges, and the city skyline.</p>

<h3>Evening: Galata Tower & Beyoğlu</h3>
<p>Climb Galata Tower for 360-degree views of Istanbul. Wander through the charming streets of Beyoğlu, sample restaurants, and experience Istanbul's vibrant nightlife at İstiklal Avenue.</p>

<h2>Day 3: Cultural Immersion</h2>

<h3>Morning: Turkish Hammam Experience</h3>
<p>Visit a traditional Turkish bath (hammam). The experience of hot steam rooms and experienced attendants is quintessentially Istanbul and incredibly relaxing.</p>

<h3>Afternoon: Archaeological Museums</h3>
<p>The Istanbul Archaeological Museums house one of the world's largest collections of ancient artifacts, from Egyptian mummies to Mesopotamian treasures.</p>

<h3>Evening: Whirling Dervish Ceremony</h3>
<p>Witness the mesmerizing Sufi whirling dervish performance—a spiritual dance that's a must-see cultural experience.</p>

<h2>Day 4: Asian Istanbul & Local Markets</h2>

<h3>Morning: Camlica Hill</h3>
<p>Take a quick metro ride to Asia's highest point for panoramic views of the entire city. A perfect photo opportunity.</p>

<h3>Afternoon: Kadıköy District</h3>
<p>Explore the bohemian Kadıköy district with its bookstores, galleries, and cafes. Visit the bustling fish market (Balık Pazarı) for fresh seafood and street food.</p>

<h3>Evening: Sunset at Maiden's Tower</h3>
<p>Visit the iconic Maiden's Tower on a small island in the Bosphorus. The sunset views are unforgettable.</p>

<h2>Day 5: Day Trips & Relaxation</h2>

<h3>Option A: Cappadocia Day Trip</h3>
<p>Fly to Cappadocia for an early morning hot air balloon ride over fairy chimneys and ancient cave dwellings. Return same-day flights are available.</p>

<h3>Option B: Bursa Trip</h3>
<p>Take a ferry and drive to Bursa to visit the Green Mosque and Green Tomb. The drive itself offers beautiful Bosphorus views.</p>

<h3>Option C: Beach Day (Summer)</h3>
<p>Relax at a beach club in Kilyos or Bebek on the Black Sea coast.</p>

<h2>Istanbul Food Guide</h2>
<ul>
  <li><strong>Döner Kebab:</strong> Turkish meat on a rotating skewer, value for money</li>
  <li><strong>Meze:</strong> Small appetizers perfect for trying multiple dishes</li>
  <li><strong>Baklava:</strong> Sweet pastry layered with nuts and honey</li>
  <li><strong>Turkish Tea & Coffee:</strong> Strong, aromatic, and served in tiny cups</li>
  <li><strong>Fresh Fish:</strong> Try grilled sea bass (levrek) at waterfront restaurants</li>
  <li><strong>Pide:</strong> Turkish flatbread, often called "Turkish pizza"</li>
</ul>

<h2>Budget Breakdown (Per Person, USD)</h2>
<ul>
  <li>Budget hotel: $25-40/night</li>
  <li>Street food meal: $3-5</li>
  <li>Restaurant dinner: $15-30</li>
  <li>Museum entry: $10-15</li>
  <li>Bosphorus cruise: $10-15</li>
  <li>Hammam: $20-30</li>
</ul>

<h2>Practical Tips</h2>
<ul>
  <li><strong>Best time to visit:</strong> April-May and September-October (perfect weather, fewer crowds)</li>
  <li><strong>Language:</strong> While Turkish is spoken, English is understood in tourist areas</li>
  <li><strong>Currency:</strong> Turkish Lira (TRY). ATMs are widely available</li>
  <li><strong>Safety:</strong> Istanbul is safe for tourists—standard precautions apply</li>
  <li><strong>Dress code:</strong> When visiting mosques, wear modest clothing and remove shoes</li>
</ul>

<h2>Conclusion</h2>
<p>Istanbul is a city that enchants every visitor with its unique blend of ancient history, Ottoman grandeur, and modern vibrancy. This 5-day itinerary covers the must-see attractions while leaving room for spontaneous discoveries. Whether you're a history buff, food lover, or adventure seeker, Istanbul will leave you wanting to return.</p>`,
        coverImageUrl:
            "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "destinations",
        tags: ["istanbul", "turkey", "city-guide"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-12"),
        sortOrder: 4,
        createdAt: new Date("2026-03-12"),
        updatedAt: new Date("2026-03-12"),
    },
];

function jsonWithSource(data: BlogPostRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-blog-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        const filtered = showAll
            ? DUMMY_BLOG_POSTS
            : DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED");
        return jsonWithSource(filtered, "dummy");
    }

    try {
        const rows = await prisma.blogPost.findMany({
            where: showAll ? undefined : { status: "PUBLISHED" },
            orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
        });

        if (rows.length) {
            return jsonWithSource(rows as BlogPostRow[], "db");
        }

        if (showAll) {
            return jsonWithSource([], "db");
        }

        return jsonWithSource(
            DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED"),
            "dummy",
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        const filtered = showAll
            ? DUMMY_BLOG_POSTS
            : DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED");
        return jsonWithSource(filtered, "dummy");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = blogPostSchema.parse(body);

        const post = await prisma.blogPost.create({
            data: {
                ...validated,
                tags: validated.tags ?? [],
                publishedAt: validated.publishedAt
                    ? new Date(validated.publishedAt)
                    : validated.status === "PUBLISHED"
                        ? new Date()
                        : null,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
