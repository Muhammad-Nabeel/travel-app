import { NextRequest, NextResponse } from "next/server";

import { prisma, shouldBypassDatabase } from "@/lib/db";
import { flightRouteErrorResponse } from "@/lib/flight-routes-api";
import { toFlightRouteView } from "@/lib/flight-routes";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { flightRouteSchema, flightRouteSlug } from "@/lib/validations/flight-route";

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const routes = await prisma.flightRoute.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
        return NextResponse.json({ routes: routes.map(toFlightRouteView) }, { status: 200 });
    } catch (error) {
        return flightRouteErrorResponse(error, "Failed to fetch flight routes.");
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const data = flightRouteSchema.parse(await request.json());
        const created = await prisma.flightRoute.create({
            data: { ...data, slug: flightRouteSlug(data.originCity, data.destinationCity) },
        });

        revalidatePublicSite();
        return NextResponse.json(toFlightRouteView(created), { status: 201 });
    } catch (error) {
        return flightRouteErrorResponse(error, "Failed to create flight route.");
    }
}
