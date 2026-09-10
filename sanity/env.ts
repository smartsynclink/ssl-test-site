export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'w2d9vne3';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01';

/** Where Studio is mounted; stega uses it to build "edit this field" links. */
export const studioUrl = '/studio';

/**
 * Viewer token, server-only. Required to read drafts, so Presentation mode and
 * Draft Mode need it; published reads work without it. Never referenced from a
 * client component, so it stays out of the browser bundle.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN ?? '';
