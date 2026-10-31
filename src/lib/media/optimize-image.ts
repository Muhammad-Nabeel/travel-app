import sharp from "sharp";

// Every raster upload is stored as WebP, sized for its largest on-site use.
// next/image then serves smaller widths per device from that master copy.

export type ImageTarget = "photo" | "logo" | "icon" | "favicon";

const MAX_WIDTH: Record<ImageTarget, number> = {
    // Full-bleed heroes render at up to 1920 CSS px.
    photo: 2400,
    logo: 800,
    // Product-tab and menu icons render at 24–44 CSS px; 256 covers 3x screens.
    icon: 256,
    favicon: 512,
};

const WEBP_QUALITY = 80;

/** SVG and ICO are kept as uploaded; they are vector or already tiny. */
const PASSTHROUGH_TYPES = new Set(["image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"]);

export type OptimizedImage = {
    body: Buffer;
    contentType: string;
    extension: string;
};

export function isPassthroughImage(contentType: string): boolean {
    return PASSTHROUGH_TYPES.has(contentType);
}

/**
 * Re-encodes an uploaded raster image (JPEG, PNG, GIF, WebP, AVIF, TIFF) as
 * WebP, applying EXIF rotation and shrinking it to the target's max width.
 * The favicon target is PNG because the same file is the apple-touch-icon.
 */
export async function optimizeImage(input: Buffer, target: ImageTarget): Promise<OptimizedImage> {
    try {
        const image = sharp(input, { animated: target !== "favicon" }).rotate();

        if (target === "favicon") {
            const body = await image
                .resize({
                    width: MAX_WIDTH.favicon,
                    height: MAX_WIDTH.favicon,
                    fit: "contain",
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                    withoutEnlargement: true,
                })
                .png({ compressionLevel: 9, palette: true, quality: 90 })
                .toBuffer();
            return { body, contentType: "image/png", extension: "png" };
        }

        const body = await image
            .resize({ width: MAX_WIDTH[target], withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY, effort: 5 })
            .toBuffer();
        return { body, contentType: "image/webp", extension: "webp" };
    } catch {
        throw new Error("This image could not be processed. Upload a JPG, PNG, WebP or GIF.");
    }
}

/** Replaces a file name's extension, e.g. "beach.png" → "beach.webp". */
export function withExtension(fileName: string, extension: string): string {
    return `${fileName.replace(/\.[^./]+$/, "")}.${extension}`;
}
