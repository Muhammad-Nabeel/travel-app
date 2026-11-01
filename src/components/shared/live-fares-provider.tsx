"use client";

import { createContext, useContext } from "react";

const LiveFaresContext = createContext(false);

/** Tells client components whether live Sabre fares are switched on in Admin → Settings. */
export function LiveFaresProvider({
    enabled,
    children,
}: {
    enabled: boolean;
    children: React.ReactNode;
}) {
    return <LiveFaresContext.Provider value={enabled}>{children}</LiveFaresContext.Provider>;
}

export function useLiveFaresEnabled(): boolean {
    return useContext(LiveFaresContext);
}
