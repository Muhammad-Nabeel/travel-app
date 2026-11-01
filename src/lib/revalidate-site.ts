import { revalidatePath } from "next/cache";

/**
 * Re-renders every cached public page after an admin edit. Home and listing
 * pages render destinations, activities, posts, reviews and airline logos on
 * the server, so content changes must not wait for the ISR window.
 */
export function revalidatePublicSite() {
    revalidatePath("/", "layout");
}
