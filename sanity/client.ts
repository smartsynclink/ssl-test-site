import { createClient, type QueryParams } from 'next-sanity';
import { draftMode } from 'next/headers';
import { apiVersion, dataset, projectId, readToken, studioUrl } from './env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Sanity's CDN caches query results, which keeps Studio edits invisible in
  // dev even with Next's own caching disabled. Live in dev, cached in prod.
  useCdn: process.env.NODE_ENV !== 'development',
  perspective: 'published',
});

/**
 * Draft client used only when Next.js Draft Mode is on — i.e. inside the
 * Presentation tool's iframe. Reads unpublished content, bypasses the CDN, and
 * turns on stega: every string comes back with invisible markers naming the
 * document and field it came from, which is what lets Presentation map a click
 * in the preview to the right field in Studio.
 */
const draftClient = client.withConfig({
  useCdn: false,
  perspective: 'drafts',
  token: readToken,
  stega: { enabled: true, studioUrl },
});

/**
 * Local review of unpublished work. With SANITY_DEV_DRAFTS=1, `next dev` reads
 * drafts overlaid on published content, so a restructure saved as drafts can be
 * reviewed on localhost while the deployed site keeps serving published
 * content. No stega here: it appends invisible characters to every string and
 * would break the string comparisons the components make.
 */
const devDrafts = process.env.NODE_ENV === 'development'
  && process.env.SANITY_DEV_DRAFTS === '1' && !!readToken;
const devDraftClient = client.withConfig({ useCdn: false, perspective: 'drafts', token: readToken });

/** For build-time lists (generateStaticParams), which run outside a request. */
export const listClient = devDrafts ? devDraftClient : client;

/**
 * Cached Sanity fetch.
 *
 * Every query is tagged so the Sanity webhook can invalidate exactly what
 * changed via revalidateTag. `revalidate` is the fallback floor for when no
 * webhook fires; pages are otherwise served from the ISR cache indefinitely.
 *
 * In Draft Mode nothing is cached and drafts are returned instead, so the
 * Presentation preview always shows the editor's unpublished work.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
  revalidate = 3600,
}: {
  query: string;
  params?: QueryParams;
  tags: string[];
  revalidate?: number;
}): Promise<T> {
  const isDraft = (await draftMode()).isEnabled;

  if (isDraft) {
    if (!readToken) {
      throw new Error(
        'Draft Mode is on but SANITY_API_READ_TOKEN is not set. Add a Viewer ' +
          'token from sanity.io/manage (API → Tokens) to preview drafts.',
      );
    }
    return draftClient.fetch<T>(query, params, { next: { revalidate: 0 } });
  }

  if (devDrafts) return devDraftClient.fetch<T>(query, params, { next: { revalidate: 0 } });

  return client.fetch<T>(query, params, {
    // In dev, always read through: otherwise edits made in Studio stay
    // invisible until the fetch cache expires or .next is deleted.
    next: process.env.NODE_ENV === 'development'
      ? { revalidate: 0 }
      : { tags, revalidate },
  });
}
