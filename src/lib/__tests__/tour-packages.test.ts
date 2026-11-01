import { toTourPackageSlug, getTourPackagePath } from "@/lib/tour-packages";

// ─── toTourPackageSlug ────────────────────────────────────────────────────────

describe("toTourPackageSlug", () => {
    it("lowercases all characters", () => {
        expect(toTourPackageSlug("Mecca City Tour")).toBe("mecca-city-tour");
    });

    it("replaces spaces with hyphens", () => {
        expect(toTourPackageSlug("holy land journey")).toBe("holy-land-journey");
    });

    it("strips special characters", () => {
        expect(toTourPackageSlug("Dubai & Abu Dhabi!")).toBe("dubai-abu-dhabi");
    });

    it("collapses multiple spaces into a single hyphen", () => {
        expect(toTourPackageSlug("Istanbul   Turkey")).toBe("istanbul-turkey");
    });

    it("trims leading and trailing whitespace", () => {
        expect(toTourPackageSlug("  Umrah Package  ")).toBe("umrah-package");
    });

    it("collapses multiple consecutive hyphens", () => {
        // after stripping '&' from "Tour & Package", two spaces remain → single hyphen
        expect(toTourPackageSlug("Tour & Package")).toBe("tour-package");
    });

    it("returns an empty string for an empty input", () => {
        expect(toTourPackageSlug("")).toBe("");
    });
});

// ─── getTourPackagePath ───────────────────────────────────────────────────────

describe("getTourPackagePath", () => {
    it("prefixes the slug with /tour-packages/", () => {
        expect(getTourPackagePath("mecca-city-tour")).toBe(
            "/tour-packages/mecca-city-tour"
        );
    });
});
