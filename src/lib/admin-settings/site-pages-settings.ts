import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type ManagedPageContent = {
    eyebrow: string;
    title: string;
    intro: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
};

export type ContactUsPageContent = {
    eyebrow: string;
    title: string;
    intro: string;
    phoneLabel: string;
    phoneValue: string;
    locationLabel: string;
    locationValue: string;
    emailLabel: string;
    emailValue: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailFieldLabel: string;
    emailFieldPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
};

export type FaqItem = {
    question: string;
    answer: string;
};

export type FaqPageContent = {
    eyebrow: string;
    title: string;
    intro: string;
    faqs: FaqItem[];
};

export type CareerJob = {
    title: string;
    location: string;
    team: string;
    type: string;
    summary: string;
    applyLabel: string;
    applyHref: string;
};

export type CareersPageContent = ManagedPageContent & {
    jobs: CareerJob[];
};

export type SitePagesSettings = {
    aboutUs: ManagedPageContent;
    contactUs: ContactUsPageContent;
    arrangeCall: ManagedPageContent;
    faq: FaqPageContent;
    careers: CareersPageContent;
    termsConditions: ManagedPageContent;
    privacyPolicy: ManagedPageContent;
    refundPolicy: ManagedPageContent;
    cookiePolicy: ManagedPageContent;
};

const SITE_PAGES_KEY = "site_pages_content";

function sanitizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function sanitizeFaqItems(value: unknown): FaqItem[] {
    if (!Array.isArray(value)) {
        return defaultSitePagesSettings().faq.faqs;
    }

    const items = value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const question = sanitizeText((item as { question?: unknown }).question);
            const answer = sanitizeText((item as { answer?: unknown }).answer);

            if (!question || !answer) {
                return null;
            }

            return { question, answer };
        })
        .filter((item): item is FaqItem => item !== null);

    return items.length > 0 ? items : defaultSitePagesSettings().faq.faqs;
}

function sanitizeCareerJobs(value: unknown): CareerJob[] {
    if (!Array.isArray(value)) {
        return defaultSitePagesSettings().careers.jobs;
    }

    const items = value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const job = item as Partial<CareerJob>;
            const title = sanitizeText(job.title);
            const location = sanitizeText(job.location);
            const team = sanitizeText(job.team);
            const type = sanitizeText(job.type);
            const summary = sanitizeText(job.summary);
            const applyLabel = sanitizeText(job.applyLabel) || "Apply";
            const applyHref = sanitizeText(job.applyHref);

            if (!title || !location || !type || !summary) {
                return null;
            }

            return {
                title,
                location,
                team,
                type,
                summary,
                applyLabel,
                applyHref,
            } satisfies CareerJob;
        })
        .filter((item): item is CareerJob => item !== null);

    return items.length > 0 ? items : defaultSitePagesSettings().careers.jobs;
}

function sanitizeCareersContent(
    value: unknown,
    fallback: CareersPageContent,
): CareersPageContent {
    const base = sanitizePageContent(value, fallback);
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

    return {
        ...base,
        jobs: sanitizeCareerJobs(source.jobs),
    };
}

function sanitizePageContent(value: unknown, fallback: ManagedPageContent): ManagedPageContent {
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

    return {
        eyebrow: sanitizeText(source.eyebrow) || fallback.eyebrow,
        title: sanitizeText(source.title) || fallback.title,
        intro: sanitizeText(source.intro) || fallback.intro,
        body: sanitizeText(source.body) || fallback.body,
        ctaLabel: sanitizeText(source.ctaLabel) || fallback.ctaLabel,
        ctaHref: sanitizeText(source.ctaHref) || fallback.ctaHref,
    };
}

function sanitizeContactUsContent(
    value: unknown,
    fallback: ContactUsPageContent,
): ContactUsPageContent {
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

    return {
        eyebrow: sanitizeText(source.eyebrow) || fallback.eyebrow,
        title: sanitizeText(source.title) || fallback.title,
        intro: sanitizeText(source.intro) || fallback.intro,
        phoneLabel: sanitizeText(source.phoneLabel) || fallback.phoneLabel,
        phoneValue: sanitizeText(source.phoneValue) || fallback.phoneValue,
        locationLabel: sanitizeText(source.locationLabel) || fallback.locationLabel,
        locationValue: sanitizeText(source.locationValue) || fallback.locationValue,
        emailLabel: sanitizeText(source.emailLabel) || fallback.emailLabel,
        emailValue: sanitizeText(source.emailValue) || fallback.emailValue,
        fullNameLabel: sanitizeText(source.fullNameLabel) || fallback.fullNameLabel,
        fullNamePlaceholder:
            sanitizeText(source.fullNamePlaceholder) || fallback.fullNamePlaceholder,
        emailFieldLabel:
            sanitizeText(source.emailFieldLabel) || fallback.emailFieldLabel,
        emailFieldPlaceholder:
            sanitizeText(source.emailFieldPlaceholder) || fallback.emailFieldPlaceholder,
        messageLabel: sanitizeText(source.messageLabel) || fallback.messageLabel,
        messagePlaceholder:
            sanitizeText(source.messagePlaceholder) || fallback.messagePlaceholder,
        submitLabel: sanitizeText(source.submitLabel) || fallback.submitLabel,
    };
}

export function defaultSitePagesSettings(): SitePagesSettings {
    return {
        aboutUs: {
            eyebrow: "About Safar",
            title: "Travel guidance built around real people.",
            intro:
                "Safar helps travellers book with confidence across flights, hotels, Umrah journeys, and curated tours.",
            body:
                "We focus on practical service, transparent pricing, and responsive support before and after booking. Our team works closely with travellers who need clear answers, dependable planning, and help when plans change.\n\nFrom family holidays to faith-based travel, we aim to keep the process simple and personal.",
            ctaLabel: "Explore packages",
            ctaHref: "/tour-packages",
        },
        contactUs: {
            eyebrow: "Contact Us",
            title: "We'd love to hear from you",
            intro: "Our team is always here to answer your queries",
            phoneLabel: "Contact Us",
            phoneValue: "042 111 266563",
            locationLabel: "Our Location",
            locationValue: "1st Floor, NASTP, 69 Abid Majeed Road, Cantt",
            emailLabel: "Email Us",
            emailValue: "contact@bookme.pk",
            fullNameLabel: "Full Name",
            fullNamePlaceholder: "Enter Full Name",
            emailFieldLabel: "Email Address",
            emailFieldPlaceholder: "Enter Email Address",
            messageLabel: "Message",
            messagePlaceholder: "Enter Message",
            submitLabel: "Submit",
        },
        arrangeCall: {
            eyebrow: "Arrange a Call",
            title: "Let us help you plan the right trip.",
            intro:
                "Use this page for call-back instructions, consultation notes, and what customers should prepare before speaking to your team.",
            body:
                "Share the best time to call, what information travellers should keep ready, and how your advisors can assist with flights, hotels, Umrah, or tour planning.",
            ctaLabel: "Call support",
            ctaHref: "tel:",
        },
        faq: {
            eyebrow: "FAQ",
            title: "Answers to common travel questions.",
            intro:
                "Keep this page updated with the questions your team receives most often.",
            faqs: [
                {
                    question: "How do I confirm a booking?",
                    answer:
                        "Our team confirms your booking details after reviewing availability, traveller information, and payment status.",
                },
                {
                    question: "Can I get help with Umrah travel planning?",
                    answer:
                        "Yes. You can contact our support team for package guidance, departure options, hotel details, and general planning support.",
                },
                {
                    question: "Do your prices include service charges?",
                    answer:
                        "Displayed totals can include a configurable site service charge set by the admin team.",
                },
            ],
        },
        careers: {
            eyebrow: "Careers",
            title: "Build the future of travel with Safar.",
            intro:
                "We are looking for people who love problem solving, customer care, and travel.",
            body:
                "Join a team focused on improving how people book flights, hotels, Umrah journeys, and tours. We value ownership, clear communication, and a customer-first mindset.",
            ctaLabel: "Email your resume",
            ctaHref: "mailto:careers@safartravel.com",
            jobs: [
                {
                    title: "Travel Consultant",
                    location: "Lahore, PK",
                    team: "Customer Success",
                    type: "Full-time",
                    summary:
                        "Support travelers with flight, hotel, and Umrah bookings while ensuring a smooth end-to-end experience.",
                    applyLabel: "Apply",
                    applyHref: "mailto:careers@safartravel.com",
                },
                {
                    title: "Operations Coordinator",
                    location: "Islamabad, PK",
                    team: "Operations",
                    type: "Full-time",
                    summary:
                        "Coordinate vendor confirmations, manage booking pipelines, and keep travel operations on schedule.",
                    applyLabel: "Apply",
                    applyHref: "mailto:careers@safartravel.com",
                },
            ],
        },
        termsConditions: {
            eyebrow: "Legal",
            title: "Terms and Conditions",
            intro:
                "Review the terms that govern bookings, payments, cancellations, and use of Safar services.",
            body:
                "These terms apply to all customers and cover eligibility, booking confirmations, fare and availability changes, supplier rules, and required traveler documents. Service fees, taxes, and surcharges may apply depending on product type and provider.\n\nYou are responsible for ensuring passport validity, visa requirements, and correct traveler information. Changes, cancellations, and no-show penalties are governed by supplier policies and may be non-refundable.\n\nSafar may update these terms to reflect regulatory, supplier, or operational changes. Continued use of the platform indicates acceptance of the updated terms.",
            ctaLabel: "",
            ctaHref: "",
        },
        privacyPolicy: {
            eyebrow: "Legal",
            title: "Privacy Policy",
            intro:
                "Learn how Safar collects, uses, stores, and protects customer information.",
            body:
                "We collect data needed to process bookings, verify identity, provide customer support, and meet legal or regulatory obligations. This may include contact details, traveler information, and payment identifiers.\n\nData is stored securely and shared only with relevant suppliers, payment processors, or authorities when required to fulfill your booking. We do not sell personal data.\n\nYou can request access, correction, or deletion of your data where permitted by law. Contact us for any privacy-related requests.",
            ctaLabel: "",
            ctaHref: "",
        },
        refundPolicy: {
            eyebrow: "Legal",
            title: "Refund Policy",
            intro:
                "Understand eligibility, timelines, and processing rules for refunds and chargebacks.",
            body:
                "Refund eligibility depends on the supplier fare rules, ticket type, and service category. Some bookings may be partially refundable or non-refundable, and service fees may not be refundable.\n\nIf a refund is approved, processing timelines vary by payment method and issuing bank. Chargebacks should only be raised after contacting support to avoid delays or disputes.\n\nPlease review refund rules before making changes, or contact us for guidance.",
            ctaLabel: "",
            ctaHref: "",
        },
        cookiePolicy: {
            eyebrow: "Legal",
            title: "Cookie Policy",
            intro:
                "Details on how Safar uses cookies and similar technologies.",
            body:
                "We use cookies to keep sessions secure, remember preferences, and improve performance. Analytics cookies help us understand site usage and improve the booking experience.\n\nYou can manage cookies in your browser settings. Disabling cookies may impact certain features or personalization.",
            ctaLabel: "",
            ctaHref: "",
        },
    };
}

export async function getStoredSitePagesSettings(): Promise<SitePagesSettings> {
    const defaults = defaultSitePagesSettings();

    if (shouldBypassDatabase()) {
        return defaults;
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: SITE_PAGES_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaults;
        }

        const parsed = JSON.parse(row.value) as Partial<SitePagesSettings>;

        return {
            aboutUs: sanitizePageContent(parsed.aboutUs, defaults.aboutUs),
            contactUs: sanitizeContactUsContent(parsed.contactUs, defaults.contactUs),
            arrangeCall: sanitizePageContent(parsed.arrangeCall, defaults.arrangeCall),
            faq: {
                eyebrow: sanitizeText(parsed.faq?.eyebrow) || defaults.faq.eyebrow,
                title: sanitizeText(parsed.faq?.title) || defaults.faq.title,
                intro: sanitizeText(parsed.faq?.intro) || defaults.faq.intro,
                faqs: sanitizeFaqItems(parsed.faq?.faqs),
            },
            careers: sanitizeCareersContent(parsed.careers, defaults.careers),
            termsConditions: sanitizePageContent(
                parsed.termsConditions,
                defaults.termsConditions,
            ),
            privacyPolicy: sanitizePageContent(
                parsed.privacyPolicy,
                defaults.privacyPolicy,
            ),
            refundPolicy: sanitizePageContent(
                parsed.refundPolicy,
                defaults.refundPolicy,
            ),
            cookiePolicy: sanitizePageContent(
                parsed.cookiePolicy,
                defaults.cookiePolicy,
            ),
        };
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaults;
    }
}

export async function saveStoredSitePagesSettings(
    input: SitePagesSettings,
): Promise<SitePagesSettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving site page content.");
    }

    const defaults = defaultSitePagesSettings();
    const payload: SitePagesSettings = {
        aboutUs: sanitizePageContent(input.aboutUs, defaults.aboutUs),
        contactUs: sanitizeContactUsContent(input.contactUs, defaults.contactUs),
        arrangeCall: sanitizePageContent(input.arrangeCall, defaults.arrangeCall),
        faq: {
            eyebrow: sanitizeText(input.faq.eyebrow) || defaults.faq.eyebrow,
            title: sanitizeText(input.faq.title) || defaults.faq.title,
            intro: sanitizeText(input.faq.intro) || defaults.faq.intro,
            faqs: sanitizeFaqItems(input.faq.faqs),
        },
        careers: sanitizeCareersContent(input.careers, defaults.careers),
        termsConditions: sanitizePageContent(
            input.termsConditions,
            defaults.termsConditions,
        ),
        privacyPolicy: sanitizePageContent(
            input.privacyPolicy,
            defaults.privacyPolicy,
        ),
        refundPolicy: sanitizePageContent(input.refundPolicy, defaults.refundPolicy),
        cookiePolicy: sanitizePageContent(input.cookiePolicy, defaults.cookiePolicy),
    };

    await prisma.adminSetting.upsert({
        where: { key: SITE_PAGES_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SITE_PAGES_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
