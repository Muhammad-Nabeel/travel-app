import { toVisaSlug, getVisaPath, findVisaBySlug } from "@/lib/visa";
import type { VisaCountryEntry } from "@/lib/admin-settings/visa-settings";

// Minimal stub entries — no DB access needed
const mockVisas: VisaCountryEntry[] = [
    {
        country: "Saudi Arabia",
        visaType: "e-visa",
        duration: "30 days",
        entry: "Single",
        perPersonCost: "200",
        serviceFee: "20",
        netCost: "220",
        code: "SA",
        isActive: true,
        sortOrder: 1,
        seoTitle: "Visa from Pakistan – Requirements & Fees",
        seoDescription: "Apply from Pakistan with a document checklist and expert help with your application.",
    },
    {
        country: "United Arab Emirates",
        visaType: "sticker-visa",
        duration: "60 days",
        entry: "Multiple",
        perPersonCost: "350",
        serviceFee: "30",
        netCost: "380",
        code: "AE",
        isActive: true,
        sortOrder: 2,
        seoTitle: "Visa from Pakistan – Requirements & Fees",
        seoDescription: "Apply from Pakistan with a document checklist and expert help with your application.",
    },
    {
        country: "Turkey",
        visaType: "e-visa",
        duration: "90 days",
        entry: "Multiple",
        perPersonCost: "150",
        serviceFee: "15",
        netCost: "165",
        code: "TR",
        isActive: false,
        sortOrder: 3,
        seoTitle: "Visa from Pakistan – Requirements & Fees",
        seoDescription: "Apply from Pakistan with a document checklist and expert help with your application.",
    },
];

// ─── toVisaSlug ───────────────────────────────────────────────────────────────

describe("toVisaSlug", () => {
    it("combines country and visa type as lowercase hyphenated slug", () => {
        expect(toVisaSlug("Saudi Arabia", "e-visa")).toBe("saudi-arabia-e-visa");
    });

    it("handles multi-word countries", () => {
        expect(toVisaSlug("United Arab Emirates", "sticker-visa")).toBe(
            "united-arab-emirates-sticker-visa"
        );
    });

    it("strips special characters from country or type", () => {
        expect(toVisaSlug("Côte d'Ivoire", "e-visa")).toBe("cte-divoire-e-visa");
    });

    it("collapses extra spaces", () => {
        expect(toVisaSlug("Saudi  Arabia", "e-visa")).toBe("saudi-arabia-e-visa");
    });

    it("trims leading/trailing whitespace", () => {
        expect(toVisaSlug("  Turkey  ", "  e-visa  ")).toBe("turkey-e-visa");
    });
});

// ─── getVisaPath ──────────────────────────────────────────────────────────────

describe("getVisaPath", () => {
    it("prefixes the slug with /visa/", () => {
        expect(getVisaPath("Saudi Arabia", "e-visa")).toBe(
            "/visa/saudi-arabia-e-visa"
        );
    });

    it("builds the correct path for sticker visa", () => {
        expect(getVisaPath("United Arab Emirates", "sticker-visa")).toBe(
            "/visa/united-arab-emirates-sticker-visa"
        );
    });
});

// ─── findVisaBySlug ───────────────────────────────────────────────────────────

describe("findVisaBySlug", () => {
    it("finds a visa entry by its generated slug", () => {
        const result = findVisaBySlug(mockVisas, "saudi-arabia-e-visa");
        expect(result).not.toBeNull();
        expect(result?.country).toBe("Saudi Arabia");
        expect(result?.visaType).toBe("e-visa");
    });

    it("finds a sticker visa entry", () => {
        const result = findVisaBySlug(mockVisas, "united-arab-emirates-sticker-visa");
        expect(result?.country).toBe("United Arab Emirates");
    });

    it("returns null when no entry matches the slug", () => {
        expect(findVisaBySlug(mockVisas, "unknown-country-e-visa")).toBeNull();
    });

    it("returns null for an empty slug", () => {
        expect(findVisaBySlug(mockVisas, "")).toBeNull();
    });

    it("returns null for an empty array", () => {
        expect(findVisaBySlug([], "saudi-arabia-e-visa")).toBeNull();
    });

    it("can match an inactive visa entry (filtering is caller's responsibility)", () => {
        const result = findVisaBySlug(mockVisas, "turkey-e-visa");
        expect(result?.country).toBe("Turkey");
        expect(result?.isActive).toBe(false);
    });
});
