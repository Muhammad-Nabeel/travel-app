import {
    normalizePath,
    absoluteUrl,
    toMetaDescription,
    stripHtml,
} from "@/lib/seo";

// ─── normalizePath ────────────────────────────────────────────────────────────

describe("normalizePath", () => {
    it("returns path unchanged when it already starts with /", () => {
        expect(normalizePath("/about")).toBe("/about");
    });

    it("prepends / when the path does not start with /", () => {
        expect(normalizePath("about")).toBe("/about");
    });

    it("returns / for an empty string", () => {
        expect(normalizePath("")).toBe("/");
    });

    it("handles deeply nested paths", () => {
        expect(normalizePath("/blog/2026/my-post")).toBe("/blog/2026/my-post");
    });
});

// ─── absoluteUrl ──────────────────────────────────────────────────────────────

describe("absoluteUrl", () => {
    it("returns a string starting with http", () => {
        const url = absoluteUrl("/about");
        expect(url.startsWith("http")).toBe(true);
    });

    it("appends the path to the site base", () => {
        const url = absoluteUrl("/about");
        expect(url.endsWith("/about")).toBe(true);
    });

    it("correctly handles paths without leading slash", () => {
        const url = absoluteUrl("contact");
        expect(url.endsWith("/contact")).toBe(true);
    });
});

// ─── toMetaDescription ────────────────────────────────────────────────────────

describe("toMetaDescription", () => {
    it("returns the string unchanged when under the limit", () => {
        const text = "Short description.";
        expect(toMetaDescription(text)).toBe("Short description.");
    });

    it("truncates to exactly the default 160 char limit with an ellipsis", () => {
        const long = "a".repeat(200);
        const result = toMetaDescription(long);
        // slice(0, 159).trimEnd() + "…" = 159 + 1 = 160
        expect(result.length).toBe(160);
        expect(result.endsWith("…")).toBe(true);
    });

    it("respects a custom maxLength", () => {
        const long = "a".repeat(100);
        const result = toMetaDescription(long, 50);
        // slice(0, 49).trimEnd() + "…" = 49 + 1 = 50
        expect(result.length).toBe(50);
        expect(result.endsWith("…")).toBe(true);
    });

    it("collapses internal whitespace before measuring length", () => {
        const text = "hello   world"; // 13 chars with spaces, 11 after collapse
        expect(toMetaDescription(text)).toBe("hello world");
    });

    it("trims leading and trailing whitespace", () => {
        expect(toMetaDescription("  hello  ")).toBe("hello");
    });
});

// ─── stripHtml ────────────────────────────────────────────────────────────────

describe("stripHtml", () => {
    it("removes simple tags", () => {
        expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
    });

    it("removes nested tags", () => {
        expect(stripHtml("<div><span>text</span></div>")).toBe("text");
    });

    it("removes self-closing tags", () => {
        expect(stripHtml("line1<br/>line2")).toBe("line1 line2");
    });

    it("collapses multiple spaces left by removed tags", () => {
        expect(stripHtml("<b>a</b> <i>b</i>")).toBe("a b");
    });

    it("returns the original text when there are no tags", () => {
        expect(stripHtml("plain text")).toBe("plain text");
    });

    it("returns an empty string for an empty input", () => {
        expect(stripHtml("")).toBe("");
    });
});
