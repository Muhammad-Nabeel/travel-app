import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 (S3-compatible) object storage.
let client: S3Client | null = null;

export function isR2Configured(): boolean {
    return Boolean(
        process.env.CLOUDFLARE_R2_ENDPOINT &&
            process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
            process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
            process.env.CLOUDFLARE_R2_BUCKET_NAME &&
            process.env.CLOUDFLARE_R2_PUBLIC_URL,
    );
}

function getClient(): S3Client {
    if (!isR2Configured()) {
        throw new Error(
            "Cloudflare R2 storage is not configured. Add the CLOUDFLARE_R2_* environment variables.",
        );
    }

    client ??= new S3Client({
        region: "auto",
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        },
    });

    return client;
}

export function getR2PublicUrl(key: string): string {
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/+$/, "")}/${key}`;
}

/** Uploads an object and returns its public URL. */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string,
): Promise<string> {
    await getClient().send(
        new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
        }),
    );

    return getR2PublicUrl(key);
}

export async function deleteFromR2(key: string): Promise<void> {
    await getClient().send(
        new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: key,
        }),
    );
}
