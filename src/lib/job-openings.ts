import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type JobOpeningRow = {
    id: string;
    title: string;
    team: string;
    location: string;
    employmentType: string;
    summary: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type JobOpeningInput = {
    title?: string;
    team?: string;
    location?: string;
    employmentType?: string;
    summary?: string;
    isActive?: boolean;
    sortOrder?: number;
};

export function normalizeJobOpeningInput(body: JobOpeningInput) {
    return {
        title: String(body.title ?? "").trim(),
        team: String(body.team ?? "").trim(),
        location: String(body.location ?? "").trim(),
        employmentType: String(body.employmentType ?? "").trim(),
        summary: String(body.summary ?? "").trim(),
        isActive: Boolean(body.isActive ?? true),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    };
}

export function missingJobOpeningFields(
    payload: ReturnType<typeof normalizeJobOpeningInput>,
) {
    const required = {
        title: "Title",
        team: "Team",
        location: "Location",
        employmentType: "Employment type",
        summary: "Summary",
    } as const;

    return Object.entries(required)
        .filter(([key]) => !payload[key as keyof typeof required])
        .map(([, label]) => label);
}

/** Active roles for the public careers page, in admin sort order. */
export async function getActiveJobOpenings() {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        return await prisma.jobOpening.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });
    } catch (error) {
        markDatabaseUnavailable(error);
        console.error("[job-openings]", error);
        return [];
    }
}
