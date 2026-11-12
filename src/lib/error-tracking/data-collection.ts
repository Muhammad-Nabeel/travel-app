/**
 * What Sentry may collect. Request bodies here hold passwords, passenger
 * names, dates of birth and contact details, and query strings hold reset
 * tokens, so all of it stays out: reports carry the error, stack trace and
 * page URL path only. A function so every init gets its own copy.
 */
export function privacySafeDataCollection() {
    return {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
    };
}
