import { cache } from "react";
import type { FlightRoute } from "@prisma/client";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import type { FlightRouteAirline, FlightRouteFaq } from "@/lib/validations/flight-route";

// Server-side reads for the public /flights/<slug> pages. Only active routes
// are ever returned.

export type FlightRouteView = Omit<
    FlightRoute,
    "airlines" | "travelTips" | "documents" | "faqs"
> & {
    airlines: FlightRouteAirline[];
    travelTips: string[];
    documents: string[];
    faqs: FlightRouteFaq[];
};

function stringList(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
        : [];
}

function objectList<T extends object>(value: unknown, keys: Array<keyof T>): T[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
        (item): item is T =>
            Boolean(item) &&
            typeof item === "object" &&
            keys.every((key) => typeof (item as Record<string, unknown>)[key as string] === "string"),
    );
}

export function toFlightRouteView(route: FlightRoute): FlightRouteView {
    return {
        ...route,
        airlines: objectList<FlightRouteAirline>(route.airlines, ["name", "code", "service"]),
        travelTips: stringList(route.travelTips),
        documents: stringList(route.documents),
        faqs: objectList<FlightRouteFaq>(route.faqs, ["question", "answer"]),
    };
}

export const getActiveFlightRoutes = cache(async (): Promise<FlightRouteView[]> => {
    if (shouldBypassDatabase()) return [];

    try {
        const routes = await prisma.flightRoute.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
        return routes.map(toFlightRouteView);
    } catch (error) {
        markDatabaseUnavailable(error);
        return [];
    }
});

export const getActiveFlightRouteBySlug = cache(
    async (slug: string): Promise<FlightRouteView | null> => {
        const routes = await getActiveFlightRoutes();
        return routes.find((route) => route.slug === slug) ?? null;
    },
);

/**
 * Other active routes worth linking from a route page: same origin or same
 * destination first, then the rest, so every page links into the cluster.
 */
export function getRelatedFlightRoutes(
    route: FlightRouteView,
    routes: FlightRouteView[],
    limit = 6,
) {
    const others = routes.filter((item) => item.id !== route.id);
    const score = (item: FlightRouteView) =>
        (item.destinationIata === route.destinationIata ? 2 : 0) +
        (item.originIata === route.originIata ? 1 : 0);
    return [...others].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
