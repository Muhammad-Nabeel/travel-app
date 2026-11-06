import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/providers/auth/auth-provider";

/**
 * The account a new booking belongs to: the signed-in user, or for guests the
 * account registered with the contact email (so it shows once they sign in).
 */
export async function resolveBookingUserId(contactEmail: string | null | undefined): Promise<string | null> {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    if (sessionUserId) return sessionUserId;

    const email = contactEmail?.trim().toLowerCase();
    if (!email) return null;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return user?.id ?? null;
}
