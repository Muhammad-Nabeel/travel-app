import { NextResponse } from "next/server";

export function GET() {
    return NextResponse.json({
        ok: true,
        service: "travel-app",
        timestamp: new Date().toISOString(),
    });
}