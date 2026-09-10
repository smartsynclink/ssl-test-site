import type { SchemaTypeDefinition } from 'sanity';
import siteSettings from './siteSettings';
import seo from './seo';
import page from './page';
import { sectionTypes } from './sections';
import { faq, review, project, videoItem } from './shared';

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings, page, seo,
  faq, review, project, videoItem,
  ...sectionTypes,
];
