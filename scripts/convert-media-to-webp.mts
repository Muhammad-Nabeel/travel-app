// Converts raster images already in Cloudflare R2 to resized WebP (the same
// treatment new uploads get in /api/admin/media) and points database
// references at the new files. Originals are left in R2 so old links keep
// working; delete them from Admin → Media once the site is verified.
//
//   npx tsx scripts/convert-media-to-webp.mts           # dry run, prints the plan
//   npx tsx scripts/convert-media-to-webp.mts --apply   # upload + update the DB

import nextEnv from "@next/env";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

nextEnv.loadEnvConfig(process.cwd());

const { prisma } = await import("../prisma/client");
const { optimizeImage } = await import("../src/lib/media/optimize-image");
const { uploadToR2, getR2PublicUrl } = await import("../src/lib/storage/r2");
const { sanitizeBrandAssets } = await import("../src/lib/brand-assets");

type ImageTarget = Parameters<typeof optimizeImage>[1];

const APPLY = process.argv.includes("--apply");
const RASTER = /\.(png|jpe?g|gif|tiff?|bmp|avif)$/i;

function targetForKey(key: string): ImageTarget {
    if (key.startsWith("website/logo/")) return "logo";
    if (key.startsWith("website/brand/") || key.startsWith("airline-logos/")) return "icon";
    return "photo";
}

async function listAllKeys(): Promise<string[]> {
    const client = new S3Client({
        region: "auto",
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        },
    });

    const keys: string[] = [];
    let token: string | undefined;
    do {
        const page = await client.send(
            new ListObjectsV2Command({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
                ContinuationToken: token,
            }),
        );
        keys.push(...(page.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : [])));
        token = page.NextContinuationToken;
    } while (token);

    return keys;
}

/** The favicon stays PNG (it is also the apple-touch-icon). */
async function getFaviconKey(): Promise<string | null> {
    const row = await prisma.adminSetting.findUnique({ where: { key: "brand_settings" } });
    if (!row?.value) return null;
    const icon = sanitizeBrandAssets(JSON.parse(row.value).assets).icon;
    return icon ? new URL(icon).pathname.slice(1) : null;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Rewrites any absolute URL ending in an old key (on any host) to the new URL. */
function rewrite(text: string, mapping: Map<string, string>): string {
    let result = text;
    for (const [oldKey, newUrl] of mapping) {
        if (!result.includes(oldKey)) continue;
        result = result.replace(new RegExp(`https?://[^\\s"'()<>]+/${escapeRegExp(oldKey)}`, "g"), newUrl);
    }
    return result;
}

async function main() {
    const keys = await listAllKeys();
    const faviconKey = await getFaviconKey();
    const candidates = keys.filter((key) => RASTER.test(key) && key !== faviconKey);

    console.log(`${keys.length} objects in R2, ${candidates.length} raster images to convert.`);
    if (faviconKey) console.log(`Keeping favicon as PNG: ${faviconKey}`);

    const mapping = new Map<string, string>();
    let before = 0;
    let after = 0;

    for (const key of candidates) {
        const newKey = key.replace(RASTER, ".webp");
        try {
            const res = await fetch(getR2PublicUrl(key));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const original = Buffer.from(await res.arrayBuffer());
            const optimized = await optimizeImage(original, targetForKey(key));

            before += original.length;
            after += optimized.body.length;
            console.log(
                `${APPLY ? "upload" : "would upload"} ${newKey}  ${Math.round(original.length / 1024)}KB → ${Math.round(optimized.body.length / 1024)}KB`,
            );

            if (APPLY) await uploadToR2(newKey, optimized.body, optimized.contentType);
            mapping.set(key, getR2PublicUrl(newKey));
        } catch (err) {
            console.error(`skip ${key}: ${err instanceof Error ? err.message : err}`);
        }
    }

    console.log(`\nImages: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`);

    // Database references.
    const updates: Array<{ label: string; run: () => Promise<unknown> }> = [];

    for (const row of await prisma.destination.findMany({ select: { id: true, slug: true, imageUrl: true } })) {
        const next = row.imageUrl ? rewrite(row.imageUrl, mapping) : row.imageUrl;
        if (next !== row.imageUrl) {
            updates.push({
                label: `destination ${row.slug}`,
                run: () => prisma.destination.update({ where: { id: row.id }, data: { imageUrl: next } }),
            });
        }
    }

    for (const row of await prisma.activity.findMany({ select: { id: true, slug: true, imageUrl: true } })) {
        const next = rewrite(row.imageUrl, mapping);
        if (next !== row.imageUrl) {
            updates.push({
                label: `activity ${row.slug}`,
                run: () => prisma.activity.update({ where: { id: row.id }, data: { imageUrl: next } }),
            });
        }
    }

    for (const row of await prisma.blogPost.findMany({ select: { id: true, slug: true, coverImageUrl: true, content: true } })) {
        const coverImageUrl = rewrite(row.coverImageUrl, mapping);
        const content = rewrite(row.content, mapping);
        if (coverImageUrl !== row.coverImageUrl || content !== row.content) {
            updates.push({
                label: `blog ${row.slug}`,
                run: () => prisma.blogPost.update({ where: { id: row.id }, data: { coverImageUrl, content } }),
            });
        }
    }

    for (const row of await prisma.adminSetting.findMany({ select: { key: true, value: true } })) {
        const next = rewrite(row.value, mapping);
        if (next !== row.value) {
            updates.push({
                label: `setting ${row.key}`,
                run: () => prisma.adminSetting.update({ where: { key: row.key }, data: { value: next } }),
            });
        }
    }

    console.log(`\n${updates.length} database rows ${APPLY ? "updated" : "would be updated"}:`);
    for (const update of updates) {
        console.log(`  ${update.label}`);
        if (APPLY) await update.run();
    }

    if (!APPLY) console.log("\nDry run only. Re-run with --apply to upload and update the database.");
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
