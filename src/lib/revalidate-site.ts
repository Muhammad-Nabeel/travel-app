import { revalidatePath } from "next/cache";

/**
 * Called by every admin save that changes what the public site shows.
 * Cached pages are otherwise left alone (they only re-render daily as a
 * safety net), so a page is rebuilt only when its data actually changed.
 * Pages aren't re-rendered here: they are marked stale and rebuilt once, on
 * the next visit.
 */
export function revalidatePublicSite() {
    revalidatePath("/", "layout");
    // Not under the root layout, but they list or show the same content.
    revalidatePath("/sitemap.xml");
    revalidatePath("/opengraph-image");
    revalidatePath("/twitter-image");
}
