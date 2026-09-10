import { defineConfig } from 'sanity';
import { presentationTool } from 'sanity/presentation';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './sanity/env';
import { schemaTypes } from './sanity/schemas';

const SINGLETONS = ['siteSettings'];

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Singletons are edited in place, never created or deleted from the list.
    templates: t => t.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (input, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? input.filter(({ action }) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : input,
  },
  plugins: [
    /* Presentation renders the site in an iframe beside the editor; clicking a
       heading there jumps to that field in Studio. `origin` is read from the
       browser at runtime, so the same config works on localhost and on Vercel
       without a per-environment build. */
    presentationTool({
      previewUrl: {
        origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        preview: '/',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
    structureTool({
      structure: S =>
        S.list().title('Content').items([
          S.listItem().title('Site Settings').id('siteSettings')
            .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          S.divider(),
          S.documentTypeListItem('page').title('Pages'),
          S.divider(),
          S.documentTypeListItem('faq').title('FAQs'),
          S.documentTypeListItem('review').title('Reviews'),
          S.documentTypeListItem('project').title('Projects'),
          S.documentTypeListItem('videoItem').title('Videos'),
        ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
