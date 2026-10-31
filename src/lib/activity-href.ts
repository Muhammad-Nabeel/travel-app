/** Public URL for an activity; falls back to the id for rows without a slug. */
export function getActivityHref(activity: { id: string; slug?: string | null }) {
    return `/activities/${activity.slug?.trim() ? activity.slug : activity.id}`;
}
