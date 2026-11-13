/**
 * @jest-environment node
 *
 * Keeps CONTENT_PAGES (src/lib/revalidate-site.ts) in step with the code: for
 * every public page, follows its imports (page -> components -> lib) and
 * records which content it reads. A page that reads content but is missing
 * from that content's list would show stale data after an admin save; a
 * listed page that doesn't read it is re-rendered for nothing. Both fail here.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { revalidateContent, type PublicContent } from "@/lib/revalidate-site";

/**
 * How each content type is read: the loader functions pages call, and the
 * Prisma model for pages that query it directly. Add a new loader here when
 * you write one.
 */
const READERS: Record<PublicContent, { loaders: string[]; model?: string }> = {
    destinations: { loaders: ["getActiveDestinations"], model: "destination" },
    activities: { loaders: ["getActiveActivities"], model: "activity" },
    reviews: { loaders: ["getPublishedReviews"], model: "customerReview" },
    blog: { loaders: ["getPublishedBlogPosts", "getPublishedBlogPostBySlug"], model: "blogPost" },
    umrahPackages: {
        loaders: ["getPublishedUmrahPackages", "getPublishedUmrahPackageBySlug"],
        model: "umrahPackage",
    },
    tourPackages: { loaders: ["getActiveTourPackages", "getActiveTourPackageBySlug"], model: "tourPackage" },
    flightRoutes: {
        loaders: ["getActiveFlightRoutes", "getActiveFlightRouteBySlug", "getRelatedFlightRoutes"],
        model: "flightRoute",
    },
    visaCountries: { loaders: ["getStoredVisaCountries"] },
    airlinePartners: { loaders: ["getActiveAirlinePartners"], model: "airlinePartner" },
    jobOpenings: { loaders: ["getActiveJobOpenings"], model: "jobOpening" },
    branches: { loaders: ["buildOrganizationJsonLd"], model: "branch" },
    pageBanners: { loaders: ["getStoredPageBanners", "getPageBanner"] },
    contentPages: { loaders: ["getStoredSitePagesSettings"] },
};

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");

function listSourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return name === "__tests__" ? [] : listSourceFiles(full);
        return /\.tsx?$/.test(name) ? [full] : [];
    });
}

function resolveImport(spec: string, from: string): string | null {
    let base: string;
    if (spec.startsWith("@/")) base = join(ROOT, "src", spec.slice(2));
    else if (spec.startsWith(".")) base = normalize(join(dirname(from), spec));
    else return null;
    for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx"), base]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
}

const sourceCache = new Map<string, string>();
function source(file: string) {
    let text = sourceCache.get(file);
    if (text === undefined) {
        text = readFileSync(file, "utf8");
        sourceCache.set(file, text);
    }
    return text;
}

/** Every file a page reaches through its imports, the page included. */
function reachableFiles(entry: string): Set<string> {
    const seen = new Set<string>();
    const stack = [entry];
    while (stack.length > 0) {
        const file = stack.pop()!;
        if (seen.has(file)) continue;
        seen.add(file);
        for (const match of source(file).matchAll(/from\s+["']([^"']+)["']/g)) {
            const target = resolveImport(match[1], file);
            if (target) stack.push(target);
        }
    }
    return seen;
}

/** Where each loader is defined: a call inside its own module doesn't count as a page reading it. */
const allFiles = listSourceFiles(join(ROOT, "src"));
const loaderHome = new Map<string, string>();
for (const { loaders } of Object.values(READERS)) {
    for (const loader of loaders) {
        const home = allFiles.find((f) =>
            new RegExp(`export (async function|const|function) ${loader}\\b`).test(source(f)),
        );
        if (home) loaderHome.set(loader, home);
    }
}
const loaderModules = new Set(loaderHome.values());

function readsContent(files: Set<string>, content: PublicContent): boolean {
    const { loaders, model } = READERS[content];
    for (const file of files) {
        if (loaderModules.has(file)) continue;
        const text = source(file);
        if (loaders.some((loader) => new RegExp(`\\b${loader}\\b`).test(text))) return true;
        if (model && new RegExp(`\\bprisma\\.${model}\\.`).test(text)) return true;
    }
    return false;
}

/** Public, cached pages keyed by the path revalidateContent uses. */
function publicPages(): Map<string, string> {
    const pages = new Map<string, string>();
    for (const file of listSourceFiles(APP_DIR)) {
        const rel = relative(APP_DIR, file).split("\\").join("/");
        if (/^(admin|api|dashboard)(\/|$)/.test(rel)) continue;
        if (rel === "sitemap.ts") pages.set("/sitemap.xml", file);
        if (!/(^|\/)page\.tsx$/.test(rel)) continue;
        const segments = rel.split("/").slice(0, -1).filter((s) => !/^\(.+\)$/.test(s));
        pages.set(`/${segments.join("/")}`, file);
    }
    return pages;
}

function listedPaths(content: PublicContent): string[] {
    mockRevalidatePath.mockClear();
    revalidateContent(content);
    return mockRevalidatePath.mock.calls.map(([path]) => path as string);
}

const CONTENT = Object.keys(READERS) as PublicContent[];
const pages = publicPages();
const reach = new Map([...pages].map(([path, file]) => [path, reachableFiles(file)]));

describe("CONTENT_PAGES matches what each page reads", () => {
    it("finds every loader it checks for", () => {
        const missing = CONTENT.flatMap((c) => READERS[c].loaders).filter((l) => !loaderHome.has(l));
        expect(missing).toEqual([]);
    });

    it("the root layout reads no content (it would need the whole site revalidated)", () => {
        const layout = reachableFiles(join(APP_DIR, "layout.tsx"));
        expect(CONTENT.filter((c) => readsContent(layout, c))).toEqual([]);
    });

    it.each(CONTENT)("%s: exactly the pages that read it", (content) => {
        const expected = [...reach]
            .filter(([, files]) => readsContent(files, content))
            .map(([path]) => path)
            .sort();
        expect(listedPaths(content).sort()).toEqual(expected);
    });
});
