import type { Account, NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { getActiveGoogleCredentials } from "@/lib/admin-settings/google-auth-settings";
import { prisma } from "../../db";

/**
 * Static options for getServerSession(). Session decoding needs no providers,
 * so Google (configured in the admin panel) is only added in getAuthOptions().
 */
// How often a session re-reads the user's role from the database.
const ROLE_REFRESH_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase().trim() },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        passwordHash: true,
                        emailVerifiedAt: true,
                    },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const passwordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!passwordValid) {
                    return null;
                }

                if (!user.emailVerifiedAt) {
                    throw new Error("EMAIL_NOT_VERIFIED");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: "/signin",
        newUser: "/signup",
    },

    callbacks: {
        async jwt({
            token,
            user,
            account,
        }: {
            token: JWT;
            user?: User;
            account?: Account | null;
        }) {
            // Only runs on sign-in (when user is present)
            if (user) {
                if (account?.provider === "google") {
                    // Upsert the Google user into our DB so they have a local record
                    const dbUser = await prisma.user.upsert({
                        where: { email: user.email! },
                        update: {
                            emailVerifiedAt: new Date(),
                        },
                        create: {
                            name: user.name ?? user.email!.split("@")[0],
                            email: user.email!,
                            role: "CUSTOMER",
                            emailVerifiedAt: new Date(),
                        },
                        select: { id: true, role: true },
                    });
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                } else {
                    // Credentials sign-in
                    token.id = user.id;
                    token.role = (user as User & { role: string }).role;
                }
                token.roleCheckedAt = Date.now();
                return token;
            }

            // The session (navbar, dashboard, server checks) should follow a
            // role change without waiting 30 days for the token to expire.
            // Admin access itself is checked against the database in the proxy.
            const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
            if (typeof token.id === "string" && Date.now() - checkedAt > ROLE_REFRESH_MS) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id },
                        select: { role: true },
                    });
                    token.role = dbUser?.role ?? "CUSTOMER";
                    token.roleCheckedAt = Date.now();
                } catch {
                    // Keep the current claims; the next request retries.
                }
            }
            return token;
        },

        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                (session.user as Session["user"] & { id: string; role: string }).id =
                    token.id as string;
                (session.user as Session["user"] & { id: string; role: string }).role =
                    token.role as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

/** Options for the NextAuth route: adds Google when it is enabled in Admin → Settings → Google Sign-In. */
export async function getAuthOptions(): Promise<NextAuthOptions> {
    const google = await getActiveGoogleCredentials();
    if (!google) return authOptions;

    return {
        ...authOptions,
        providers: [
            GoogleProvider({ clientId: google.clientId, clientSecret: google.clientSecret }),
            ...authOptions.providers,
        ],
    };
}
