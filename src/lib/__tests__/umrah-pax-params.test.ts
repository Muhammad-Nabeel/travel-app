import { MAX_ADULTS, MAX_CHILDREN, toAdults, toChildren } from "@/lib/umrah-pricing";

describe("umrah traveller URL params", () => {
    it("uses the defaults when the param is missing or not a number", () => {
        expect(toAdults(undefined)).toBe(2);
        expect(toAdults("abc")).toBe(2);
        expect(toChildren(undefined)).toBe(0);
        expect(toChildren("")).toBe(0);
    });

    it("clamps to the allowed range", () => {
        expect(toAdults("0")).toBe(1);
        expect(toAdults("5000")).toBe(MAX_ADULTS);
        expect(toChildren("-3")).toBe(0);
        expect(toChildren("99")).toBe(MAX_CHILDREN);
    });

    it("drops fractions", () => {
        expect(toAdults("2.7")).toBe(2);
        expect(toChildren("1.5")).toBe(1);
    });
});
