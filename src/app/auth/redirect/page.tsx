import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLE = "ADMIN";

export default async function PostLoginRedirectPage() {
  // getServerSession relies on synchronous cookie access which broke in Next.js 15+.
  // Reading the JWT directly via getToken (same as the middleware) is reliable.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const token = await getToken({
    req: {
      headers: {
        get: (name: string) => (name === "cookie" ? cookieHeader : null),
      },
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value]),
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    redirect("/signin?callbackUrl=/auth/redirect");
  }

  if (token.role === ADMIN_ROLE) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
