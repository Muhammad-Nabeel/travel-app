/**
 * @jest-environment node
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { revalidateContent, type PublicContent } from "@/lib/revalidate-site";

const APP_DIR = join(process.cwd(), "src/app");

/** True when a URL path or route pattern has a page (or sitemap) in src/app, allowing for (route groups). */
function routeExists(path: string): boolean {
    if (path === "/sitemap.xml") return existsSync(join(APP_DIR, "sitemap.ts"));

    function walk(dir: string, segments: string[]): boolean {
        if (segments.length === 0) {
            if (existsSync(join(dir, "page.tsx"))) return true;
        }
        const entries = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
        // A (group) folder adds no URL segment.
        if (entries.some((e) => /^\(.+\)$/.test(e.name) && walk(join(dir, e.name), segments))) return true;
        if (segments.length === 0) return false;
        const [head, ...rest] = segments;
        return entries.some((e) => e.name === head && walk(join(dir, e.name), rest));
    }
    return walk(APP_DIR, path.split("/").filter(Boolean));
}

const ALL_CONTENT: PublicContent[] = [
    "destinations",
    "activities",
    "reviews",
    "blog",
    "umrahPackages",
    "tourPackages",
    "flightRoutes",
    "visaCountries",
    "airlinePartners",
    "jobOpenings",
    "branches",
    "pageBanners",
    "contentPages",
];

describe("revalidateContent", () => {
    beforeEach(() => mockRevalidatePath.mockClear());

    it.each(ALL_CONTENT)("%s only lists paths that exist", (content) => {
        revalidateContent(content);
        expect(mockRevalidatePath).toHaveBeenCalled();
        for (const [path] of mockRevalidatePath.mock.calls) {
            expect({ path, exists: routeExists(path) }).toEqual({ path, exists: true });
        }
    });

    it("passes the page type for route patterns and none for literal paths", () => {
        revalidateContent("blog");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/blog/[slug]", "page");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/blog");
    });

    it("never marks the whole site stale", () => {
        for (const content of ALL_CONTENT) revalidateContent(content);
        expect(mockRevalidatePath).not.toHaveBeenCalledWith("/", "layout");
    });
});
