import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export async function uploadLogoToR2(
    file: File,
    fileName: string,
): Promise<string> {
    const buffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `logos/${fileName}`,
        Body: Buffer.from(buffer),
        ContentType: file.type,
        ACL: "public-read",
    });

    await r2Client.send(command);

    // Generate public URL (R2 supports public access when configured)
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/logos/${fileName}`;
    return publicUrl;
}

export async function getLogoFromR2(fileName: string): Promise<string> {
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/logos/${fileName}`;
    return publicUrl;
}

export async function deleteLogoFromR2(fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `logos/${fileName}`,
    });

    await r2Client.send(command);
}

// Legacy Firebase functions for backward compatibility
export const storage = null;
export async function uploadLogoToFirebase(file: File, fileName: string): Promise<string> {
    return uploadLogoToR2(file, fileName);
}
export async function getLogoFromFirebase(fileName: string): Promise<string> {
    return getLogoFromR2(fileName);
}
export async function deleteLogoFromFirebase(fileName: string): Promise<void> {
    return deleteLogoFromR2(fileName);
}
