import NextAuth from "next-auth";
import { authOptions } from "@/lib/providers/auth/auth-provider";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };