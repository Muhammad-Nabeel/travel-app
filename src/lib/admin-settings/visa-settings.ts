import { cache } from "react";

import { z } from "zod";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { seoFields } from "@/lib/validations/seo";

import visaGuides from "./visa-guides.json";

export type VisaType = "e-visa" | "sticker-visa";

export type VisaFaq = { question: string; answer: string };

/**
 * Guide content shown on the visa detail page. Required for every country so
 * each page answers what applicants search for (documents, fee, processing
 * time, steps) instead of rendering a thin price card.
 */
export type VisaGuide = {
    overview: string;
    processingTime: string;
    documents: string[];
    steps: string[];
    faqs: VisaFaq[];
};

export type VisaCountryEntry = VisaGuide & {
    country: string;
    visaType: VisaType;
    duration: string;
    entry: string;
    perPersonCost: string;
    serviceFee: string;
    netCost: string;
    code: string;
    isActive: boolean;
    sortOrder: number;
    seoTitle: string;
    seoDescription: string;
};

const VISA_COUNTRIES_KEY = "visa_countries";

function sanitizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function sanitizeList(value: unknown): string[] {
    return Array.isArray(value) ? value.map(sanitizeText).filter(Boolean) : [];
}

function sanitizeFaqs(value: unknown): VisaFaq[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const faq = (item ?? {}) as Partial<VisaFaq>;
            return { question: sanitizeText(faq.question), answer: sanitizeText(faq.answer) };
        })
        .filter((faq) => faq.question && faq.answer);
}

function normalizeVisaType(value: unknown): VisaType {
    return value === "sticker-visa" ? "sticker-visa" : "e-visa";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }
    return fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
}

export function defaultVisaCountries(): VisaCountryEntry[] {
    return [
        {
            country: "Malaysia",
            visaType: "e-visa",
            duration: "30 days",
            entry: "Single Entry",
            perPersonCost: "PKR 30,000 / Traveler",
            serviceFee: "PKR 10,000",
            netCost: "PKR 40,000",
            code: "MY",
            isActive: true,
            sortOrder: 1,
            seoTitle: "Malaysia Visa for Pakistani – e-Visa Fees",
            seoDescription:
                "Malaysia e-visa from Pakistan: 30 days, single entry, PKR 40,000 all-in with service fee. Document checklist and help applying from our Lahore visa team.",
            ...visaGuides.MY,
        },
        {
            country: "UAE",
            visaType: "sticker-visa",
            duration: "30 days",
            entry: "Single Entry",
            perPersonCost: "PKR 39,000 / Traveler",
            serviceFee: "PKR 8,000",
            netCost: "PKR 49,000",
            code: "AE",
            isActive: true,
            sortOrder: 2,
            seoTitle: "Dubai Visa Price in Pakistan – UAE Visit Visa",
            seoDescription:
                "UAE (Dubai) 30-day visit visa from Pakistan for PKR 49,000 all-in with service fee. Document checklist, processing time and help from our Lahore visa team.",
            ...visaGuides.AE,
        },
    ];
}

function sanitizeVisaCountries(value: unknown): VisaCountryEntry[] {
    if (!Array.isArray(value)) {
        return defaultVisaCountries();
    }

    const items = value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const entry = item as Partial<VisaCountryEntry>;
            const country = sanitizeText(entry.country);
            const duration = sanitizeText(entry.duration);
            const visaType = normalizeVisaType(entry.visaType);
            const entryType = sanitizeText(entry.entry);
            const perPersonCost = sanitizeText(entry.perPersonCost);
            const serviceFee = sanitizeText(entry.serviceFee);
            const netCost = sanitizeText(entry.netCost);
            const code = sanitizeText(entry.code);
            const isActive = normalizeBoolean(entry.isActive, true);
            const sortOrder = normalizeNumber(entry.sortOrder, 0);
            const seoTitle = sanitizeText(entry.seoTitle);
            const seoDescription = sanitizeText(entry.seoDescription);
            const overview = sanitizeText(entry.overview);
            const processingTime = sanitizeText(entry.processingTime);
            const documents = sanitizeList(entry.documents);
            const steps = sanitizeList(entry.steps);
            const faqs = sanitizeFaqs(entry.faqs);

            if (
                !country ||
                !duration ||
                !entryType ||
                !perPersonCost ||
                !serviceFee ||
                !netCost ||
                !seoTitle ||
                !seoDescription ||
                !overview ||
                !processingTime ||
                documents.length === 0 ||
                steps.length === 0
            ) {
                return null;
            }

            return {
                country,
                visaType,
                duration,
                entry: entryType,
                perPersonCost,
                serviceFee,
                netCost,
                code,
                isActive,
                sortOrder,
                seoTitle,
                seoDescription,
                overview,
                processingTime,
                documents,
                steps,
                faqs,
            } satisfies VisaCountryEntry;
        })
        .filter((item): item is VisaCountryEntry => item !== null);

    return items.length > 0 ? items : defaultVisaCountries();
}

const visaSeoSchema = z.object(seoFields);

/** First entry missing required guide content, as a message for the admin. */
export function findVisaGuideIssue(entries: Partial<VisaCountryEntry>[]): string | null {
    for (const entry of entries) {
        const name = sanitizeText(entry.country) || "a visa country";
        if (!sanitizeText(entry.overview)) return `${name}: add an overview.`;
        if (!sanitizeText(entry.processingTime)) return `${name}: add the processing time.`;
        if (sanitizeList(entry.documents).length === 0) return `${name}: list at least one required document.`;
        if (sanitizeList(entry.steps).length === 0) return `${name}: list at least one application step.`;
        const faqs = Array.isArray(entry.faqs) ? (entry.faqs as Partial<VisaFaq>[]) : [];
        if (faqs.some((faq) => Boolean(sanitizeText(faq?.question)) !== Boolean(sanitizeText(faq?.answer)))) {
            return `${name}: every FAQ needs both a question and an answer.`;
        }
    }
    return null;
}

/** First entry whose SEO title or description is missing or out of range, as a message for the admin. */
export function findVisaSeoIssue(entries: Partial<VisaCountryEntry>[]): string | null {
    for (const entry of entries) {
        const result = visaSeoSchema.safeParse({
            seoTitle: entry.seoTitle ?? "",
            seoDescription: entry.seoDescription ?? "",
        });
        if (!result.success) {
            const name = sanitizeText(entry.country) || "a visa country";
            return `${name}: ${result.error.issues[0].message}`;
        }
    }
    return null;
}

// Memoized per request: generateMetadata and the page both read it.
export const getStoredVisaCountries = cache(async (): Promise<VisaCountryEntry[]> => {
    if (shouldBypassDatabase()) {
        return defaultVisaCountries();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: VISA_COUNTRIES_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultVisaCountries();
        }

        const parsed = JSON.parse(row.value) as unknown;
        return sanitizeVisaCountries(parsed);
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaultVisaCountries();
    }
});

export async function saveStoredVisaCountries(
    input: VisaCountryEntry[],
): Promise<VisaCountryEntry[]> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving visa countries.");
    }

    const payload = sanitizeVisaCountries(input);

    await prisma.adminSetting.upsert({
        where: { key: VISA_COUNTRIES_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: VISA_COUNTRIES_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
