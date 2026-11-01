import { z } from "zod";

import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/seo-copy";

export const SEO_TITLE_MIN = 10;
export const SEO_DESCRIPTION_MIN = 50;

// Required on every destination, activity, Umrah package and visa page:
// detail pages render these values as-is, there is no generated fallback.
export const seoFields = {
    seoTitle: z
        .string()
        .trim()
        .min(SEO_TITLE_MIN, `SEO title must be at least ${SEO_TITLE_MIN} characters`)
        .max(MAX_TITLE_LENGTH, `SEO title must be ${MAX_TITLE_LENGTH} characters or less`),
    seoDescription: z
        .string()
        .trim()
        .min(SEO_DESCRIPTION_MIN, `SEO description must be at least ${SEO_DESCRIPTION_MIN} characters`)
        .max(MAX_DESCRIPTION_LENGTH, `SEO description must be ${MAX_DESCRIPTION_LENGTH} characters or less`),
};
