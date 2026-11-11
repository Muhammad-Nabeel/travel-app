import { getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Whether "Continue with Google" should be shown. NextAuth only registers the
 * Google provider while it is enabled in Admin → Settings → Google Sign-In.
 */
export function useGoogleSignInEnabled(): boolean {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        let ignore = false;
        getProviders()
            .then((providers) => {
                if (!ignore) setEnabled(Boolean(providers?.google));
            })
            .catch(() => {
                if (!ignore) setEnabled(false);
            });
        return () => {
            ignore = true;
        };
    }, []);

    return enabled;
}
