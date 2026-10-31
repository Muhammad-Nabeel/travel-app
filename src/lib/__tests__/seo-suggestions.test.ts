import { z } from "zod";

import { DUMMY_PACKAGES } from "@/app/api/packages/route";
import { defaultVisaCountries } from "@/lib/admin-settings/visa-settings";
import {
    seoTitleBudget,
    suggestActivitySeo,
    suggestDestinationSeo,
    suggestUmrahPackageSeo,
    suggestVisaSeo,
} from "@/lib/seo-suggestions";
import { seoFields } from "@/lib/validations/seo";

jest.mock("@/lib/db", () => ({
    prisma: {},
    markDatabaseUnavailable: jest.fn(),
    shouldBypassDatabase: () => true,
}));

const seoSchema = z.object(seoFields);
const budget = seoTitleBudget();

describe("SEO suggestions", () => {
    it("picks the longest destination title that fits the budget", () => {
        const seo = suggestDestinationSeo({
            city: "Dubai",
            country: "UAE",
            tagline: "Skyline luxury and desert adventure.",
            fare: "PKR 38,400",
        });
        expect(seo.title).toBe("Dubai Travel Guide – Best Time, Tips & Flights");
        expect(seo.description).toBe(
            "Skyline luxury and desert adventure. Best time to visit Dubai, how long to stay, local tips and things to do. Flights from Pakistan from PKR 38,400.",
        );
    });

    it("falls back to shorter title candidates for long names", () => {
        const seo = suggestDestinationSeo({ city: "Kuala Lumpur Federal Territory", country: "Malaysia" });
        expect(seo.title.length).toBeLessThanOrEqual(budget);
    });

    it("caps descriptions at 160 characters", () => {
        const seo = suggestActivitySeo({
            title: "Desert Safari",
            description: `${"Dune bashing, camel rides and a barbecue dinner under the stars ".repeat(4)}.`,
            cost: "AED 150",
            city: "Dubai",
        });
        expect(seo.description.length).toBeLessThanOrEqual(160);
    });

    it("uses the first sentence of an activity description", () => {
        const seo = suggestActivitySeo(
            { title: "Burj Khalifa", description: "<p>Ride to level 124. Then shop.</p>", cost: "AED 169", city: "Dubai" },
            "EasyTrip",
        );
        expect(seo.title).toBe("Burj Khalifa in Dubai – Tickets & Prices");
        expect(seo.description).toBe(
            "Ride to level 124. From AED 169. Check what's included and book with a EasyTrip travel adviser.",
        );
    });

    it("builds Umrah and visa suggestions that pass validation", () => {
        const umrah = suggestUmrahPackageSeo({
            title: "Family Comfort Umrah",
            departureCity: "Karachi",
            makkahNights: 8,
            madinahNights: 4,
            hotelSummary: "Mövenpick Hajar Tower + Al Salam Royal",
            basePrice: 7200,
            currency: "SAR",
            startDate: "2026-05-01T00:00:00Z",
        });
        const visa = suggestVisaSeo({
            country: "Malaysia",
            visaType: "e-visa",
            duration: "30 days",
            entry: "Single Entry",
            netCost: "PKR 40,000",
        });
        for (const seo of [umrah, visa]) {
            expect(seoSchema.safeParse({ seoTitle: seo.title, seoDescription: seo.description }).success).toBe(true);
            expect(seo.title.length).toBeLessThanOrEqual(budget);
        }
    });
});

describe("built-in demo content", () => {
    it.each([...DUMMY_PACKAGES, ...defaultVisaCountries()].map((item) => [item.seoTitle, item]))(
        "%s has valid SEO fields",
        (_title, item) => {
            expect(seoSchema.safeParse(item).success).toBe(true);
            expect(item.seoTitle.length).toBeLessThanOrEqual(budget);
        },
    );
});
