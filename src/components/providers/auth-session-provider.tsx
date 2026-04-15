"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
