import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSitePagesSettings,
    saveStoredSitePagesSettings,
    type SitePagesSettings,
} from "@/lib/admin-settings/site-pages-settings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function GET() {
    try {
        const settings = await getStoredSitePagesSettings();
        return NextResponse.json(settings, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Partial<SitePagesSettings>;
        const saved = await saveStoredSitePagesSettings({
            aboutUs: {
                eyebrow: body.aboutUs?.eyebrow ?? "",
                title: body.aboutUs?.title ?? "",
                intro: body.aboutUs?.intro ?? "",
                body: body.aboutUs?.body ?? "",
                ctaLabel: body.aboutUs?.ctaLabel ?? "",
                ctaHref: body.aboutUs?.ctaHref ?? "",
            },
            contactUs: {
                eyebrow: body.contactUs?.eyebrow ?? "",
                title: body.contactUs?.title ?? "",
                intro: body.contactUs?.intro ?? "",
                phoneLabel: body.contactUs?.phoneLabel ?? "",
                locationLabel: body.contactUs?.locationLabel ?? "",
                emailLabel: body.contactUs?.emailLabel ?? "",
                fullNameLabel: body.contactUs?.fullNameLabel ?? "",
                fullNamePlaceholder: body.contactUs?.fullNamePlaceholder ?? "",
                emailFieldLabel: body.contactUs?.emailFieldLabel ?? "",
                emailFieldPlaceholder: body.contactUs?.emailFieldPlaceholder ?? "",
                messageLabel: body.contactUs?.messageLabel ?? "",
                messagePlaceholder: body.contactUs?.messagePlaceholder ?? "",
                submitLabel: body.contactUs?.submitLabel ?? "",
            },
            arrangeCall: {
                eyebrow: body.arrangeCall?.eyebrow ?? "",
                title: body.arrangeCall?.title ?? "",
                intro: body.arrangeCall?.intro ?? "",
                body: body.arrangeCall?.body ?? "",
                ctaLabel: body.arrangeCall?.ctaLabel ?? "",
                ctaHref: body.arrangeCall?.ctaHref ?? "",
            },
            faq: {
                eyebrow: body.faq?.eyebrow ?? "",
                title: body.faq?.title ?? "",
                intro: body.faq?.intro ?? "",
                faqs: Array.isArray(body.faq?.faqs) ? body.faq.faqs : [],
            },
            careers: {
                eyebrow: body.careers?.eyebrow ?? "",
                title: body.careers?.title ?? "",
                intro: body.careers?.intro ?? "",
                body: body.careers?.body ?? "",
                ctaLabel: body.careers?.ctaLabel ?? "",
                ctaHref: body.careers?.ctaHref ?? "",
                jobs: Array.isArray(body.careers?.jobs) ? body.careers.jobs : [],
            },
            termsConditions: {
                eyebrow: body.termsConditions?.eyebrow ?? "",
                title: body.termsConditions?.title ?? "",
                intro: body.termsConditions?.intro ?? "",
                body: body.termsConditions?.body ?? "",
                ctaLabel: body.termsConditions?.ctaLabel ?? "",
                ctaHref: body.termsConditions?.ctaHref ?? "",
            },
            privacyPolicy: {
                eyebrow: body.privacyPolicy?.eyebrow ?? "",
                title: body.privacyPolicy?.title ?? "",
                intro: body.privacyPolicy?.intro ?? "",
                body: body.privacyPolicy?.body ?? "",
                ctaLabel: body.privacyPolicy?.ctaLabel ?? "",
                ctaHref: body.privacyPolicy?.ctaHref ?? "",
            },
            refundPolicy: {
                eyebrow: body.refundPolicy?.eyebrow ?? "",
                title: body.refundPolicy?.title ?? "",
                intro: body.refundPolicy?.intro ?? "",
                body: body.refundPolicy?.body ?? "",
                ctaLabel: body.refundPolicy?.ctaLabel ?? "",
                ctaHref: body.refundPolicy?.ctaHref ?? "",
            },
            cookiePolicy: {
                eyebrow: body.cookiePolicy?.eyebrow ?? "",
                title: body.cookiePolicy?.title ?? "",
                intro: body.cookiePolicy?.intro ?? "",
                body: body.cookiePolicy?.body ?? "",
                ctaLabel: body.cookiePolicy?.ctaLabel ?? "",
                ctaHref: body.cookiePolicy?.ctaHref ?? "",
            },
        });

        // About, FAQ, careers and policy pages render this content.
        revalidatePublicSite();
        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
