import {
    isServiceRequestType,
    buildServiceRequestReference,
    formatServiceRequestType,
    SERVICE_REQUEST_TYPES,
} from "@/lib/service-requests";

// ─── isServiceRequestType ─────────────────────────────────────────────────────

describe("isServiceRequestType", () => {
    it.each(SERVICE_REQUEST_TYPES)("returns true for valid type '%s'", (type) => {
        expect(isServiceRequestType(type)).toBe(true);
    });

    it("returns false for an unknown string", () => {
        expect(isServiceRequestType("CAR")).toBe(false);
    });

    it("returns false for an empty string", () => {
        expect(isServiceRequestType("")).toBe(false);
    });

    it("is case-sensitive — lowercase is rejected", () => {
        expect(isServiceRequestType("flight")).toBe(false);
        expect(isServiceRequestType("hotel")).toBe(false);
    });
});

// ─── buildServiceRequestReference ────────────────────────────────────────────

describe("buildServiceRequestReference", () => {
    const prefixes: Record<string, string> = {
        FLIGHT: "FL",
        HOTEL: "HT",
        UMRAH: "UM",
        VISA: "VS",
        TOUR: "TR",
    };

    it.each(SERVICE_REQUEST_TYPES)(
        "starts with the correct prefix for type '%s'",
        (type) => {
            const ref = buildServiceRequestReference(type);
            expect(ref.startsWith(prefixes[type] + "-")).toBe(true);
        }
    );

    it("produces unique references on consecutive calls", () => {
        const refs = new Set(
            Array.from({ length: 50 }, () => buildServiceRequestReference("FLIGHT"))
        );
        // With 50 calls the randomness virtually guarantees > 1 unique value
        expect(refs.size).toBeGreaterThan(1);
    });

    it("matches the expected format: PREFIX-digits", () => {
        const ref = buildServiceRequestReference("VISA");
        // e.g. "VS-1234567890"
        expect(ref).toMatch(/^VS-\d{10}$/);
    });
});

// ─── formatServiceRequestType ─────────────────────────────────────────────────

describe("formatServiceRequestType", () => {
    it("formats FLIGHT as Flight", () => {
        expect(formatServiceRequestType("FLIGHT")).toBe("Flight");
    });

    it("formats HOTEL as Hotel", () => {
        expect(formatServiceRequestType("HOTEL")).toBe("Hotel");
    });

    it("formats UMRAH as Umrah", () => {
        expect(formatServiceRequestType("UMRAH")).toBe("Umrah");
    });

    it("formats VISA as Visa", () => {
        expect(formatServiceRequestType("VISA")).toBe("Visa");
    });

    it("formats TOUR as Tour", () => {
        expect(formatServiceRequestType("TOUR")).toBe("Tour");
    });
});
