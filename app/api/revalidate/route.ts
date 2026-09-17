/**
 * Sanity webhook → fresh pages without a redeploy.
 *
 * Every page query is tagged 'page' and Site Settings 'siteSettings' (see
 * app/page.tsx, app/[slug]/page.tsx), so a change to settings refreshes the
 * site-wide data and any other document refreshes the pages. `expire: 0` makes
 * the next visit fetch fresh content instead of being served the stale copy.
 *
 * Sanity → API → Webhooks: URL <site>/api/revalidate, POST, create/update/delete,
 * projection {_type}, secret = SANITY_REVALIDATE_SECRET.
 */
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return new Response('SANITY_REVALIDATE_SECRET is not set', { status: 500 });

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret);
  if (isValidSignature !== true) return new Response('Invalid signature', { status: 401 });
  if (!body?._type) return new Response('Missing _type', { status: 400 });

  const tags = body._type === 'siteSettings' ? ['siteSettings'] : ['page'];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
