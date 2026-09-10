import { defineField, defineType } from 'sanity';
import { sectionTypes } from './sections';

/**
 * Every URL on the site is one `page` document. The live site uses a flat
 * namespace (/austin, /projects, /air-duct--hvac-services), so a single
 * document type with a section builder reproduces every URL exactly and keeps
 * the existing SEO intact.
 */
export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'content', validation: r => r.required() }),
    defineField({
      name: 'slug', type: 'slug', group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'Must match the existing live URL exactly — changing it breaks SEO and inbound links.',
      validation: r => r.required(),
    }),
    defineField({
      name: 'theme', type: 'string', group: 'content', initialValue: 'landing',
      options: {
        list: [
          { title: 'Landing (home & city pages)', value: 'landing' },
          { title: 'Inner (services, projects, FAQs, contact)', value: 'inner' },
        ], layout: 'radio',
      },
      description: 'Selects the .pt-landing / .pt-inner stylesheet variant.',
      validation: r => r.required(),
    }),
    defineField({
      name: 'isHome', type: 'boolean', group: 'content', initialValue: false,
      description: 'Renders at / instead of /<slug>.',
    }),
    defineField({
      name: 'sections', type: 'array', group: 'content',
      of: sectionTypes.map(s => ({ type: s.name })),
    }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current', theme: 'theme', isHome: 'isHome' },
    prepare: ({ title, slug, theme, isHome }) => ({
      title, subtitle: `${isHome ? '/' : `/${slug ?? ''}`}  ·  ${theme}`,
    }),
  },
});
