"use client";

import Link from "next/link";

/**
 * Shown when a page fails to load: the server is too busy, the database is
 * briefly unreachable, or any other unexpected error. Visitors only ever see
 * this generic message; the real error stays in the server log.
 */
export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="section-shell flex-1 py-16" aria-labelledby="error-title">
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-subtle px-6 py-14 text-center">
        <h1 id="error-title" className="text-2xl font-semibold text-foreground">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Our site is busy right now. Please try again in a moment. If it keeps
          happening, our team is still here to help you plan your trip.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-semibold text-white transition hover:bg-brand-strong"
          >
            Try again
          </button>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full border border-line px-8 text-base font-semibold text-foreground transition hover:bg-white"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
