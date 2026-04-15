import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import {
    type AirlineLogoEntry,
    getStoredAirlineLogos,
    saveStoredAirlineLogos,
} from "@/lib/admin-settings/airline-logo-settings";

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

function normalizeFileBaseName(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
}

function extractExtension(fileName: string, mimeType: string) {
    const fromName = fileName.split(".").pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) {
        return fromName;
    }

    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    return "jpg";
}

export async function GET() {
    const logos = await getStoredAirlineLogos();
    return NextResponse.json({ logos }, { status: 200 });
}

export async function POST(request: NextRequest) {
    if (!canUseR2Storage()) {
        return NextResponse.json(
            {
                ok: false,
                error: "Cloudflare R2 storage is not configured. Add CLOUDFLARE_R2_* environment variables.",
            },
            { status: 500 },
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const inputName = String(formData.get("name") ?? "").trim();

        if (!(file instanceof File)) {
            return NextResponse.json({ ok: false, error: "Logo file is required." }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ ok: false, error: "Only image files are allowed." }, { status: 400 });
        }

        const sizeLimit = 5 * 1024 * 1024;
        if (file.size > sizeLimit) {
            return NextResponse.json({ ok: false, error: "Image size must be 5MB or less." }, { status: 400 });
        }

        const extension = extractExtension(file.name, file.type);
        const normalizedBaseName = normalizeFileBaseName(inputName || file.name) || "airline-logo";
        const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
        const storagePath = `airline-logos/${id}-${normalizedBaseName}.${extension}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: storagePath,
            Body: buffer,
            ContentType: file.type,
            ACL: "public-read",
            Metadata: {
                "cache-control": "public, max-age=31536000",
            },
        });

        await r2Client.send(command);

        const createdLogo: AirlineLogoEntry = {
            id,
            name: inputName || normalizedBaseName.replace(/-/g, " "),
            src: `${PUBLIC_URL}/${storagePath}`,
            storagePath,
            isActive: true,
            sortOrder: Date.now(),
        };

        const existing = await getStoredAirlineLogos();
        const next = [...existing, createdLogo].sort((a, b) => a.sortOrder - b.sortOrder);
        await saveStoredAirlineLogos(next);

        return NextResponse.json({ ok: true, logo: createdLogo }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to upload logo.",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    if (!canUseR2Storage()) {
        return NextResponse.json(
            {
                ok: false,
                error: "Cloudflare R2 storage is not configured.",
            },
            { status: 500 },
        );
    }

    try {
        const body = (await request.json()) as { id?: string };
        const id = String(body.id ?? "").trim();

        if (!id) {
            return NextResponse.json({ ok: false, error: "Logo id is required." }, { status: 400 });
        }

        const existing = await getStoredAirlineLogos();
        const target = existing.find((item) => item.id === id);
        if (!target) {
            return NextResponse.json({ ok: false, error: "Logo not found." }, { status: 404 });
        }

        if (target.storagePath) {
            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: target.storagePath,
            });
            await r2Client.send(command);
        }

        const next = existing.filter((item) => item.id !== id);
        await saveStoredAirlineLogos(next);

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to delete logo.",
            },
            { status: 500 },
        );
    }
}
