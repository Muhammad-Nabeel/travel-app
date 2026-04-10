import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/providers/auth/auth-provider";

const ADMIN_ROLE = "ADMIN";

export default async function PostLoginRedirectPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as
    | {
        role?: string;
      }
    | undefined;

  if (!sessionUser) {
    redirect("/signin?callbackUrl=/auth/redirect");
  }

  if (sessionUser.role === ADMIN_ROLE) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
