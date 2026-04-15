import type { VisaCountryEntry } from "@/lib/admin-settings/visa-settings";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function toVisaSlug(country: string, visaType: string) {
    return `${slugify(country)}-${slugify(visaType)}`;
}

export function getVisaPath(country: string, visaType: string) {
    return `/visa/${toVisaSlug(country, visaType)}`;
}

export function findVisaBySlug(items: VisaCountryEntry[], slug: string) {
    return (
        items.find((item) => toVisaSlug(item.country, item.visaType) === slug) ??
        null
    );
}
