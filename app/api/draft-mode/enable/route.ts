/**
 * Draft Mode enable endpoint.
 *
 * Sanity Studio's Presentation tool calls this with a signed request to turn
 * Next.js Draft Mode on, then redirects to the page being edited so the iframe
 * renders unpublished content.
 *
 * Without a Viewer token next-sanity throws "`client` must have a `token`
 * specified" at module load, which surfaces as an opaque 500. Guard it so the
 * cause is obvious instead.
 */
import { defineEnableDraftMode } from 'next-sanity/draft-mode';
import { client } from '@/sanity/client';
import { readToken } from '@/sanity/env';

const handler = readToken
  ? defineEnableDraftMode({ client: client.withConfig({ token: readToken }) }).GET
  : async () =>
      new Response(
        'SANITY_API_READ_TOKEN is not set. Add a Viewer token from ' +
          'sanity.io/manage (API → Tokens) to your environment to use ' +
          'Presentation mode.',
        { status: 501, headers: { 'content-type': 'text/plain' } },
      );

export const GET = handler;
