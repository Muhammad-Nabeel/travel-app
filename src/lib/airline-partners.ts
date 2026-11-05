import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { isPassthroughImage, optimizeImage } from "@/lib/media/optimize-image";
import { uploadToR2 } from "@/lib/storage/r2";

export type AirlinePartnerRow = {
    id: string;
    name: string;
    logoUrl: string;
    storagePath: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function slugify(name: string) {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 80) || "airline"
    );
}

/** Returns an error message when the form value is not an acceptable logo. */
export function validateLogoFile(file: FormDataEntryValue | null): string | null {
    if (!(file instanceof File) || file.size === 0) return "Logo image is required.";
    if (!file.type.startsWith("image/")) return "Only image files are allowed.";
    if (file.size > MAX_LOGO_BYTES) return "Image size must be 5MB or less.";
    return null;
}

/** Stores the logo in R2 as WebP (SVG kept as is) and returns its URL and key. */
export async function uploadAirlineLogo(file: File, airlineName: string) {
    const original = Buffer.from(await file.arrayBuffer());
    const logo = isPassthroughImage(file.type)
        ? { body: original, contentType: file.type, extension: "svg" }
        : await optimizeImage(original, "logo");
    const storagePath = `airline-logos/${Date.now()}-${slugify(airlineName)}.${logo.extension}`;
    const logoUrl = await uploadToR2(storagePath, logo.body, logo.contentType);

    return { logoUrl, storagePath };
}

/** Active partners for the homepage strip, in admin sort order. */
export async function getActiveAirlinePartners() {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        return await prisma.airlinePartner.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
    } catch (error) {
        markDatabaseUnavailable(error);
        console.error("[airline-partners]", error);
        return [];
    }
}
