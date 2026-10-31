import { prisma } from "@/lib/db";

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

/**
 * Builds a unique slug such as "desert-safari-dubai" from the activity title
 * and its destination city. `excludeId` lets an activity keep its own slug.
 */
export async function getUniqueActivitySlug(
    title: string,
    destinationId: string,
    excludeId?: string,
) {
    const destination = await prisma.destination.findUnique({
        where: { id: destinationId },
        select: { city: true },
    });
    const baseSlug = toSlug(`${title} ${destination?.city ?? ""}`) || "activity";

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await prisma.activity.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === excludeId) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}
