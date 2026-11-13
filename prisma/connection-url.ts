/** Query parameters removed from the connection URL before it reaches `pg`. */
const STRIPPED_PARAMS = new Set(["sslmode", "pgbouncer"]);

/**
 * Supabase URLs often include sslmode in the query string, which can override
 * the explicit SSL config, and pgbouncer=true is a Prisma-only flag. Both are
 * removed; every other parameter is kept. Splitting the query by hand (rather
 * than with `new URL`) leaves the user, password and database name untouched.
 */
export function stripConnectionParams(connectionString: string): string {
    const queryStart = connectionString.indexOf("?");
    if (queryStart === -1) return connectionString;

    const base = connectionString.slice(0, queryStart);
    const kept = connectionString
        .slice(queryStart + 1)
        .split("&")
        .filter((pair) => pair && !STRIPPED_PARAMS.has(pair.split("=")[0]));

    return kept.length > 0 ? `${base}?${kept.join("&")}` : base;
}
