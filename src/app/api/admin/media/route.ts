import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

import {
    isPassthroughImage,
    optimizeImage,
    withExtension,
    type ImageTarget,
} from "@/lib/media/optimize-image";
import { uploadToR2 } from "@/lib/storage/r2";

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
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

function canUseR2Storage(): boolean {
    return !!(
        process.env.CLOUDFLARE_R2_ENDPOINT &&
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET_NAME &&
        process.env.CLOUDFLARE_R2_PUBLIC_URL
    );
}

type MediaType =
    | "website-logo"
    | "brand-assets"
    | "blog-media"
    | "umrah-images"
    | "destination-images"
    | "activities-images"
    | "general";

function getStoragePath(mediaType: MediaType, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 9);

    switch (mediaType) {
        case "website-logo":
            return `website/logo/${timestamp}-${randomId}-${fileName}`;
        case "brand-assets":
            return `website/brand/${timestamp}-${randomId}-${fileName}`;
        case "blog-media":
            return `blog/${timestamp}-${randomId}-${fileName}`;
        case "umrah-images":
            return `umrah/${timestamp}-${randomId}-${fileName}`;
        case "destination-images":
            return `destinations/${timestamp}-${randomId}-${fileName}`;
        case "activities-images":
            return `activities/${timestamp}-${randomId}-${fileName}`;
        case "general":
        default:
            return `media/${timestamp}-${randomId}-${fileName}`;
    }
}

function getListPrefix(mediaType: MediaType): string {
    switch (mediaType) {
        case "website-logo":
            return "website/logo/";
        case "brand-assets":
            return "website/brand/";
        case "blog-media":
            return "blog/";
        case "umrah-images":
            return "umrah/";
        case "destination-images":
            return "destinations/";
        case "activities-images":
            return "activities/";
        case "general":
        default:
            return "media/";
    }
}

/** Brand icons are small; the app icon (favicon) is requested explicitly. */
function getImageTarget(mediaType: MediaType, requested: FormDataEntryValue | null): ImageTarget {
    if (requested === "favicon") return "favicon";
    if (mediaType === "website-logo") return "logo";
    if (mediaType === "brand-assets") return "icon";
    return "photo";
}

function getMediaTypeFromKey(key: string): MediaType {
    if (key.startsWith("website/logo/")) return "website-logo";
    if (key.startsWith("website/brand/")) return "brand-assets";
    if (key.startsWith("blog/")) return "blog-media";
    if (key.startsWith("umrah/")) return "umrah-images";
    if (key.startsWith("destinations/")) return "destination-images";
    if (key.startsWith("activities/")) return "activities-images";
    return "general";
}

export async function POST(request: NextRequest) {
    if (!canUseR2Storage()) {
        return NextResponse.json(
            {
                error: "Cloudflare R2 storage is not configured. Add CLOUDFLARE_R2_* environment variables.",
            },
            { status: 500 },
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const mediaType = formData.get("mediaType") as MediaType;
        const customFileName = formData.get("fileName") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 },
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
            return NextResponse.json(
                { error: "Only image, video, and audio files are allowed" },
                { status: 400 },
            );
        }

        // Validate file size (50MB limit)
        const sizeLimit = 50 * 1024 * 1024;
        if (file.size > sizeLimit) {
            return NextResponse.json(
                { error: "File size must be less than 50MB" },
                { status: 400 },
            );
        }

        let body: Buffer = Buffer.from(await file.arrayBuffer());
        let contentType = file.type;
        let extension = file.name.split(".").pop() || "bin";

        // Raster images are stored as resized WebP (see optimizeImage).
        if (file.type.startsWith("image/") && !isPassthroughImage(file.type)) {
            const target = getImageTarget(mediaType, formData.get("target"));
            const optimized = await optimizeImage(body, target);
            body = optimized.body;
            contentType = optimized.contentType;
            extension = optimized.extension;
        }

        const fileName = customFileName
            ? withExtension(customFileName, extension)
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
        const storagePath = getStoragePath(mediaType, fileName);
        const publicUrl = await uploadToR2(storagePath, body, contentType);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
            storagePath,
            mediaType,
            size: body.length,
            contentType,
        });
    } catch (error) {
        console.error("Media upload error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to upload media",
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    if (!canUseR2Storage()) {
        return NextResponse.json(
            {
                error: "Cloudflare R2 storage is not configured.",
            },
            { status: 500 },
        );
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const mediaType = searchParams.get("mediaType") as MediaType | null;
        const prefix = mediaType ? getListPrefix(mediaType) : "";

        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            MaxKeys: 1000,
        });

        const response = await r2Client.send(command);

        const files = (response.Contents || []).map((object) => ({
            key: object.Key,
            url: `${PUBLIC_URL}/${object.Key}`,
            size: object.Size,
            lastModified: object.LastModified,
            mediaType: object.Key ? getMediaTypeFromKey(object.Key) : "general",
        }));

        return NextResponse.json({
            success: true,
            files,
        });
    } catch (error) {
        console.error("Media list error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to list media",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    if (!canUseR2Storage()) {
        return NextResponse.json(
            {
                error: "Cloudflare R2 storage is not configured.",
            },
            { status: 500 },
        );
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const fileKey = searchParams.get("fileKey");

        if (!fileKey) {
            return NextResponse.json(
                { error: "fileKey query parameter is required" },
                { status: 400 },
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        await r2Client.send(command);

        return NextResponse.json({
            success: true,
            message: "Media deleted successfully",
        });
    } catch (error) {
        console.error("Media deletion error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to delete media",
            },
            { status: 500 },
        );
    }
}