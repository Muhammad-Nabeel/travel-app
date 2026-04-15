import { NextRequest, NextResponse } from "next/server";
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
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const fileName = formData.get("fileName") as string;

        if (!file || !fileName) {
            return NextResponse.json(
                { error: "File and fileName are required" },
                { status: 400 },
            );
        }

        const buffer = await file.arrayBuffer();

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `logos/${fileName}`,
            Body: Buffer.from(buffer),
            ContentType: file.type,
            ACL: "public-read",
        });

        await r2Client.send(command);

        const publicUrl = `${PUBLIC_URL}/logos/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
        });
    } catch (error) {
        console.error("Logo upload error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to upload logo",
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fileName = searchParams.get("fileName");

        if (!fileName) {
            return NextResponse.json(
                { error: "fileName query parameter is required" },
                { status: 400 },
            );
        }

        const publicUrl = `${PUBLIC_URL}/logos/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
        });
    } catch (error) {
        console.error("Logo retrieval error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to retrieve logo",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fileName = searchParams.get("fileName");

        if (!fileName) {
            return NextResponse.json(
                { error: "fileName query parameter is required" },
                { status: 400 },
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `logos/${fileName}`,
        });

        await r2Client.send(command);

        return NextResponse.json({
            success: true,
            message: "Logo deleted successfully",
        });
    } catch (error) {
        console.error("Logo deletion error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to delete logo",
            },
            { status: 500 },
        );
    }
}
