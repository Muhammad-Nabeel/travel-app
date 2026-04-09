import type { Account, NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "../../db";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

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
