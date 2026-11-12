import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { sendTestErrorEvent } from "@/lib/error-tracking/server";
import { authOptions } from "@/lib/providers/auth/auth-provider";

/** Sends one test error so the admin can confirm events reach Sentry. */
export async function POST() {
    const session = await getServerSession(authOptions);
    const actor = session?.user?.email ?? "admin";

    const eventId = await sendTestErrorEvent(actor);
    if (!eventId) {
        return NextResponse.json(
            { ok: false, error: "Error tracking is off. Enable it and save first." },
            { status: 400 },
        );
    }
    return NextResponse.json({ ok: true, eventId });
}
