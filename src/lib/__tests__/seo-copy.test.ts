import { serializeJsonLd } from "@/components/shared/structured-data";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import { createArticleSchema, createTouristTripSchema } from "@/lib/seo";
import {
    applySeoTokens,
    fitTitle,
    fullTitleLength,
    MAX_DESCRIPTION_LENGTH,
    MAX_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    seasonYear,
    STATIC_PAGE_KEYS,
    STATIC_PAGE_SEO,
} from "@/lib/seo-copy";

// ─── Static page copy ─────────────────────────────────────────────────────────

describe("STATIC_PAGE_SEO", () => {
    it("has an entry for every static page key", () => {
        expect(Object.keys(STATIC_PAGE_SEO).sort()).toEqual([...STATIC_PAGE_KEYS].sort());
    });

    it("uses unique paths, titles and descriptions", () => {
        const pages = Object.values(STATIC_PAGE_SEO);
        expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
        expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
        expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
    });

    it.each(STATIC_PAGE_KEYS)("%s title fits in 60 characters with the suffix", (key) => {
        const page = STATIC_PAGE_SEO[key];
        const title = applySeoTokens(page.title);
        expect(fullTitleLength(title, page.absolute)).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    });

    it.each(STATIC_PAGE_KEYS)("%s description is 120–160 characters", (key) => {
        const length = applySeoTokens(STATIC_PAGE_SEO[key].description).length;
        expect(length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
        expect(length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    });
});

describe("BLOG_CATEGORIES", () => {
    it.each(Object.entries(BLOG_CATEGORIES))("%s copy meets length rules", (_key, config) => {
        expect(fullTitleLength(config.title)).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
        expect(config.description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
        expect(config.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

describe("seasonYear / applySeoTokens", () => {
    it("uses the current year before November", () => {
        expect(seasonYear(new Date("2026-10-26T12:00:00Z"))).toBe(2026);
    });

    it("rolls over to next year from November", () => {
        expect(seasonYear(new Date("2026-11-01T00:00:00Z"))).toBe(2027);
    });

    it("replaces every {year} token", () => {
        expect(applySeoTokens("{year} and {year}", new Date("2026-03-01T00:00:00Z"))).toBe(
            "2026 and 2026",
        );
    });
});

describe("fitTitle", () => {
    it("returns the first candidate that fits", () => {
        expect(fitTitle("x".repeat(50), "short")).toBe("short");
        expect(fitTitle("fits", "also fits")).toBe("fits");
    });

    it("falls back to the last candidate when none fit", () => {
        expect(fitTitle("a".repeat(70), "b".repeat(80))).toBe("b".repeat(80));
    });
});

// ─── Structured data ──────────────────────────────────────────────────────────

describe("serializeJsonLd", () => {
    it("escapes < so a value cannot close the script tag", () => {
        const html = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
        expect(html).not.toContain("</script>");
        expect(JSON.parse(html)).toEqual({ name: "</script><script>alert(1)</script>" });
    });
});

describe("createTouristTripSchema", () => {
    it("marks sold-out packages and formats the price", () => {
        const schema = createTouristTripSchema({
            name: "Test Umrah",
            description: "A test package.",
            path: "/umrah-packages/test",
            price: 250000,
            currency: "PKR",
            seatsAvailable: 0,
            validThrough: "2027-02-01T00:00:00.000Z",
        });

        expect(schema["@type"]).toBe("TouristTrip");
        expect(schema.offers.price).toBe("250000.00");
        expect(schema.offers.availability).toBe("https://schema.org/SoldOut");
        expect(schema.offers.priceValidUntil).toBe("2027-02-01");
    });
});

describe("createArticleSchema", () => {
    it("uses an Organization author unless a profile URL is given", () => {
        const base = { title: "T", description: "D", path: "/blog/t" };
        expect(createArticleSchema({ ...base, authorName: "Team" }).author["@type"]).toBe(
            "Organization",
        );
        expect(
            createArticleSchema({ ...base, authorName: "Ali", authorUrl: "/authors/ali" }).author[
                "@type"
            ],
        ).toBe("Person");
    });
});
