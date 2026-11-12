"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * Cloudflare Turnstile for public forms. The site key comes from
 * Admin → Settings → Form Protection; when protection is off the widget is
 * not rendered and forms submit without a token.
 */

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile failed to load"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const CaptchaSiteKeyContext = createContext<string | null>(null);

export function CaptchaProvider({
  siteKey,
  children,
}: {
  siteKey: string | null;
  children: ReactNode;
}) {
  return <CaptchaSiteKeyContext.Provider value={siteKey}>{children}</CaptchaSiteKeyContext.Provider>;
}

function TurnstileWidget({
  siteKey,
  onToken,
  resetRef,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetRef: RefObject<() => void>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
          theme: "light",
          size: "flexible",
        });
        resetRef.current = () => {
          if (widgetId) turnstile.reset(widgetId);
        };
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      // A closed panel or unmounted form must not keep a token it can no longer refresh.
      onToken(null);
      resetRef.current = () => {};
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, onToken, resetRef]);

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px]" />
      {loadError ? (
        <p className="mt-1 text-xs text-deal">
          The security check couldn&apos;t load. Check your connection or disable ad blockers,
          then refresh the page.
        </p>
      ) : null}
    </div>
  );
}

export type CaptchaState = {
  /** True when the site requires a check before submitting. */
  enabled: boolean;
  /** Token to send as `captchaToken`; null until the check passes. */
  token: string | null;
  /** True when the form may submit (check passed, or protection off). */
  ready: boolean;
  /** The widget to place above the submit button (null when protection is off). */
  widget: ReactNode;
  /** Tokens are single use: call after every submission attempt. */
  reset: () => void;
};

export function useCaptcha(): CaptchaState {
  const siteKey = useContext(CaptchaSiteKeyContext);
  const [token, setToken] = useState<string | null>(null);
  const resetRef = useRef<() => void>(() => {});

  const reset = useCallback(() => {
    setToken(null);
    resetRef.current();
  }, []);

  return {
    enabled: Boolean(siteKey),
    token,
    ready: !siteKey || Boolean(token),
    widget: siteKey ? (
      <TurnstileWidget siteKey={siteKey} onToken={setToken} resetRef={resetRef} />
    ) : null,
    reset,
  };
}
