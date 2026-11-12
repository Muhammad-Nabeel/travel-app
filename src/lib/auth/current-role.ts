import { prisma } from "@/lib/db";

/**
 * The role stored in a session token is only what it was at sign-in, and
 * sessions last 30 days. Admin access is decided by the role in the database,
 * cached briefly so a demoted or deleted admin loses access within a minute.
 */
const ROLE_CACHE_MS = 60_000;

const cache = new Map<string, { role: string | null; expiresAt: number }>();

export async function getCurrentRole(userId: string): Promise<string | null> {
    const now = Date.now();
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) {
        return cached.role;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    const role = user?.role ?? null;

    if (cache.size > 5_000) cache.clear();
    cache.set(userId, { role, expiresAt: now + ROLE_CACHE_MS });
    return role;
}
