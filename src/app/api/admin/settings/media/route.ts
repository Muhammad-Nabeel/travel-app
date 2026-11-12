import { NextRequest, NextResponse } from "next/server";
import { getStoredMediaSettings, saveStoredMediaSettings } from "@/lib/admin-settings/media-settings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function GET() {
    const settings = await getStoredMediaSettings();
    return NextResponse.json({ settings }, { status: 200 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { websiteLogo, airlineLogos, ...otherSettings } = body;

        const settings = {
            websiteLogo: websiteLogo || null,
            airlineLogos: Array.isArray(airlineLogos) ? airlineLogos : [],
            ...otherSettings,
        };

        await saveStoredMediaSettings(settings);

        revalidatePublicSite();
        return NextResponse.json({
            ok: true,
            settings,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to save media settings.",
            },
            { status: 500 },
        );
    }
}