import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { destinationSchema } from "@/lib/validations/destination";

export type DestinationRow = {
    id: string;
    slug: string | null;
    city: string;
    country: string;
    scope: "DOMESTIC" | "INTERNATIONAL";
    tagline: string | null;
    overview: string | null;
    highlights: string[];
    travelTips: string[];
    bestTimeToVisit: string | null;
    idealStay: string | null;
    currency: string | null;
    timezone: string | null;
    language: string | null;
    iataCode: string | null;
    imageUrl: string | null;
    fare: string;
    notes: string | null;
    gradient: string;
    sortOrder: number;
    isActive: boolean;
};

export const DUMMY_DESTINATIONS: DestinationRow[] = [
    { id: "d01", slug: "lahore", city: "Lahore", country: "Pakistan", scope: "DOMESTIC", tagline: "Culture, food, and heritage in one city", overview: "Explore Mughal landmarks, old city bazaars, and modern dining spots across Lahore.", highlights: ["Badshahi Mosque", "Walled City", "Food Street"], travelTips: ["Best visited from Nov to Mar", "Use ride-hailing for inner city trips"], bestTimeToVisit: "November to March", idealStay: "3-4 days", currency: "PKR", timezone: "PKT (UTC+5)", language: "Urdu, Punjabi", iataCode: "LHE", imageUrl: null, fare: "PKR 18,400", notes: "Daily departures", gradient: "blue", sortOrder: 1, isActive: true },
    { id: "d02", slug: "karachi", city: "Karachi", country: "Pakistan", scope: "DOMESTIC", tagline: "Pakistan's coastal megacity", overview: "A fast-paced city known for beaches, business districts, and diverse cuisine.", highlights: ["Clifton Beach", "Port Grand", "Burns Road"], travelTips: ["Traffic peaks in evenings", "Light clothing recommended in summer"], bestTimeToVisit: "December to February", idealStay: "2-3 days", currency: "PKR", timezone: "PKT (UTC+5)", language: "Urdu, Sindhi", iataCode: "KHI", imageUrl: null, fare: "PKR 16,200", notes: "Non-stop flights", gradient: "teal", sortOrder: 2, isActive: true },
    { id: "d03", slug: "islamabad", city: "Islamabad", country: "Pakistan", scope: "DOMESTIC", tagline: "Green capital with scenic hills", overview: "A planned city with clean boulevards, hiking trails, and nearby mountain escapes.", highlights: ["Faisal Mosque", "Daman-e-Koh", "Margalla Trails"], travelTips: ["Carry a light jacket for evenings", "Friday prayers affect traffic near mosque"], bestTimeToVisit: "October to April", idealStay: "2-3 days", currency: "PKR", timezone: "PKT (UTC+5)", language: "Urdu, English", iataCode: "ISB", imageUrl: null, fare: "PKR 15,100", notes: "Flexible fares", gradient: "navy", sortOrder: 3, isActive: true },
    { id: "d04", slug: "dubai", city: "Dubai", country: "UAE", scope: "INTERNATIONAL", tagline: "Skyline luxury and desert adventure", overview: "Dubai combines futuristic architecture with traditional souks, beaches, and entertainment.", highlights: ["Burj Khalifa", "Dubai Mall", "Desert Safari"], travelTips: ["Public transport is reliable", "Book attractions early in peak season"], bestTimeToVisit: "November to March", idealStay: "4-5 days", currency: "AED", timezone: "GST (UTC+4)", language: "Arabic, English", iataCode: "DXB", imageUrl: null, fare: "PKR 38,400", notes: "Round-trip from Karachi", gradient: "blue", sortOrder: 4, isActive: true },
    { id: "d05", slug: "jeddah", city: "Jeddah", country: "Saudi Arabia", scope: "INTERNATIONAL", tagline: "Gateway for Umrah and Red Sea charm", overview: "Jeddah serves as a key entry point for pilgrims and offers rich Hijazi culture and coastal beauty.", highlights: ["Al-Balad", "Corniche", "Floating Mosque"], travelTips: ["Respect local dress code", "Plan transfers around prayer times"], bestTimeToVisit: "November to February", idealStay: "3-4 days", currency: "SAR", timezone: "AST (UTC+3)", language: "Arabic", iataCode: "JED", imageUrl: null, fare: "PKR 89,000", notes: "Umrah gateway", gradient: "teal", sortOrder: 5, isActive: true },
    { id: "d06", slug: "istanbul", city: "Istanbul", country: "Turkey", scope: "INTERNATIONAL", tagline: "Where Europe meets Asia", overview: "Historic mosques, Bosphorus cruises, and vibrant bazaars make Istanbul unforgettable.", highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar"], travelTips: ["Get an Istanbulkart", "Wear comfortable walking shoes"], bestTimeToVisit: "April to June", idealStay: "4-6 days", currency: "TRY", timezone: "TRT (UTC+3)", language: "Turkish", iataCode: "IST", imageUrl: null, fare: "PKR 104,252", notes: "Europe gateway", gradient: "purple", sortOrder: 6, isActive: true },
    { id: "d07", slug: "london", city: "London", country: "UK", scope: "INTERNATIONAL", tagline: "Classic landmarks and modern city life", overview: "From museums and royal landmarks to West End shows, London has something for every traveler.", highlights: ["Tower Bridge", "British Museum", "London Eye"], travelTips: ["Use contactless transit", "Weather changes quickly"], bestTimeToVisit: "May to September", idealStay: "5-7 days", currency: "GBP", timezone: "GMT/BST", language: "English", iataCode: "LHR", imageUrl: null, fare: "PKR 189,000", notes: "Heathrow non-stop", gradient: "sunset", sortOrder: 7, isActive: true },
    { id: "d08", slug: "kuala-lumpur", city: "Kuala Lumpur", country: "Malaysia", scope: "INTERNATIONAL", tagline: "Urban energy with tropical ease", overview: "A food lover's paradise with iconic towers, lush parks, and family-friendly attractions.", highlights: ["Petronas Towers", "Batu Caves", "Jalan Alor"], travelTips: ["Rain showers are common", "Cashless payments are widely accepted"], bestTimeToVisit: "May to July", idealStay: "4-5 days", currency: "MYR", timezone: "MYT (UTC+8)", language: "Malay, English", iataCode: "KUL", imageUrl: null, fare: "PKR 134,500", notes: "Popular with families", gradient: "teal", sortOrder: 8, isActive: true },
    { id: "d09", slug: "doha", city: "Doha", country: "Qatar", scope: "INTERNATIONAL", tagline: "Modern Gulf city with rich heritage", overview: "Discover waterfront promenades, curated museums, and old market charm in Doha.", highlights: ["Souq Waqif", "Museum of Islamic Art", "The Pearl"], travelTips: ["Evenings are best for outdoor plans", "Metro is efficient and clean"], bestTimeToVisit: "November to March", idealStay: "3-4 days", currency: "QAR", timezone: "AST (UTC+3)", language: "Arabic, English", iataCode: "DOH", imageUrl: null, fare: "PKR 61,800", notes: "Qatar Airways hub", gradient: "dark", sortOrder: 9, isActive: true },
    { id: "d10", slug: "bangkok", city: "Bangkok", country: "Thailand", scope: "INTERNATIONAL", tagline: "Temples, markets, and nonstop street life", overview: "Bangkok offers ornate temples, bustling markets, and world-famous Thai cuisine.", highlights: ["Grand Palace", "Wat Arun", "Chatuchak Market"], travelTips: ["Plan around traffic rush hours", "Keep small cash for street vendors"], bestTimeToVisit: "November to February", idealStay: "4-6 days", currency: "THB", timezone: "ICT (UTC+7)", language: "Thai", iataCode: "BKK", imageUrl: null, fare: "PKR 127,837", notes: "Southeast Asia hub", gradient: "ocean", sortOrder: 10, isActive: true },
];

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

async function getUniqueDestinationSlug(city: string) {
    const baseSlug = toSlug(city) || "destination";

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await prisma.destination.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}

function jsonWithSource(data: DestinationRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-destination-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => showAll || d.isActive),
            "dummy",
        );
    }

    try {
        const rows = await prisma.destination.findMany({
            where: showAll ? undefined : { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        if (rows.length) {
            return jsonWithSource(rows, "db");
        }

        if (showAll) {
            return jsonWithSource([], "db");
        }

        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => d.isActive),
            "dummy",
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => showAll || d.isActive),
            "dummy",
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = destinationSchema.parse(body);

        const destination = await prisma.destination.create({
            data: {
                slug: await getUniqueDestinationSlug(validatedData.city),
                city: validatedData.city,
                country: validatedData.country,
                scope: validatedData.scope,
                tagline: validatedData.tagline,
                overview: validatedData.overview,
                highlights: validatedData.highlights,
                travelTips: validatedData.travelTips,
                bestTimeToVisit: validatedData.bestTimeToVisit,
                idealStay: validatedData.idealStay,
                currency: validatedData.currency,
                timezone: validatedData.timezone,
                language: validatedData.language,
                fare: validatedData.fare,
                iataCode: validatedData.iataCode,
                imageUrl: validatedData.imageUrl,
                notes: validatedData.notes,
                gradient: validatedData.gradient,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
            },
        });
        return NextResponse.json(destination, { status: 201 });
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const message = err.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");
            return NextResponse.json(
                { ok: false, error: `Validation: ${message}` },
                { status: 400 },
            );
        }
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Database error" },
            { status: 503 },
        );
    }
}
