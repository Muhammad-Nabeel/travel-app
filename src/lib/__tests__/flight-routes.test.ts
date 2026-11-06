import type { FlightRouteView } from "@/lib/flight-routes";
import { getRelatedFlightRoutes } from "@/lib/flight-routes";
import { suggestFlightRouteSeo, seoTitleBudget } from "@/lib/seo-suggestions";
import {
    flightRouteSchema,
    flightRouteSlug,
    getFlightRoutePath,
} from "@/lib/validations/flight-route";

const validInput = {
    originCity: "Lahore",
    originIata: "lhe",
    originAirport: "Allama Iqbal International Airport",
    destinationCity: "Jeddah",
    destinationCountry: "Saudi Arabia",
    destinationIata: "JED",
    destinationAirport: "King Abdulaziz International Airport",
    intro: "Lahore to Jeddah is one of the busiest routes from Pakistan. ".repeat(5),
    flightTime: "About 5 hours non-stop",
    distance: "About 3,650 km",
    airlines: [{ name: "Saudia", code: "sv", service: "Non-stop" }],
    fareFrom: "  ",
    seoTitle: "Lahore to Jeddah Flights – Cheap Air Tickets",
    seoDescription:
        "Cheap Lahore to Jeddah air tickets on Saudia, PIA, airblue and Serene Air. 5-hour non-stop flights for Umrah, family visits and work.",
};

describe("flight route slugs", () => {
    it("builds origin-to-destination slugs", () => {
        expect(flightRouteSlug("Lahore", "Jeddah")).toBe("lahore-to-jeddah");
        expect(flightRouteSlug(" Kuala Lumpur ", "Rahim Yar Khan")).toBe(
            "kuala-lumpur-to-rahim-yar-khan",
        );
        expect(getFlightRoutePath("lahore-to-jeddah")).toBe("/flights/lahore-to-jeddah");
    });
});

describe("flightRouteSchema", () => {
    it("normalises codes, empty fare and defaults to draft", () => {
        const parsed = flightRouteSchema.parse(validInput);
        expect(parsed.originIata).toBe("LHE");
        expect(parsed.airlines[0].code).toBe("SV");
        expect(parsed.fareFrom).toBeNull();
        expect(parsed.isActive).toBe(false);
        expect(parsed.faqs).toEqual([]);
    });

    it("rejects the same airport at both ends and routes without airlines", () => {
        expect(() =>
            flightRouteSchema.parse({ ...validInput, destinationIata: "LHE" }),
        ).toThrow("Origin and destination must be different airports");
        expect(() => flightRouteSchema.parse({ ...validInput, airlines: [] })).toThrow(
            "Add at least one airline",
        );
    });
});

describe("getRelatedFlightRoutes", () => {
    const route = (id: string, originIata: string, destinationIata: string) =>
        ({ id, originIata, destinationIata }) as FlightRouteView;

    it("ranks same destination, then same origin, and excludes the current route", () => {
        const current = route("1", "LHE", "JED");
        const all = [
            current,
            route("2", "KHI", "DXB"),
            route("3", "LHE", "DXB"),
            route("4", "ISB", "JED"),
        ];
        expect(getRelatedFlightRoutes(current, all).map((item) => item.id)).toEqual([
            "4",
            "3",
            "2",
        ]);
    });
});

describe("suggestFlightRouteSeo", () => {
    it("fits the title budget and mentions the airlines", () => {
        const seo = suggestFlightRouteSeo(
            {
                originCity: "Islamabad",
                destinationCity: "Jeddah",
                flightTime: "About 5 hours non-stop",
                airlines: [{ name: "Saudia" }, { name: "PIA" }, { name: "airblue" }, { name: "Serene Air" }],
            },
            "EasyTrip",
        );
        expect(seo.title.length).toBeLessThanOrEqual(seoTitleBudget("EasyTrip"));
        expect(seo.description).toContain("Saudia, PIA, airblue and more");
        expect(seo.description.length).toBeLessThanOrEqual(160);
    });
});
