import { NextRequest, NextResponse } from "next/server";

import { prisma, shouldBypassDatabase } from "@/lib/db";
import { flightRouteErrorResponse } from "@/lib/flight-routes-api";
import { toFlightRouteView } from "@/lib/flight-routes";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { flightRouteSchema, flightRouteSlug } from "@/lib/validations/flight-route";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        const data = flightRouteSchema.parse(await request.json());
        const updated = await prisma.flightRoute.update({
            where: { id },
            data: { ...data, slug: flightRouteSlug(data.originCity, data.destinationCity) },
        });

        revalidatePublicSite();
        return NextResponse.json(toFlightRouteView(updated), { status: 200 });
    } catch (error) {
        return flightRouteErrorResponse(error, "Failed to update flight route.");
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        await prisma.flightRoute.delete({ where: { id } });

        revalidatePublicSite();
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        return flightRouteErrorResponse(error, "Failed to delete flight route.");
    }
}
