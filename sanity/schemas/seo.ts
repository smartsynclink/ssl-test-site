import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', description: 'Falls back to the page title.' }),
    defineField({ name: 'description', type: 'text', rows: 3, validation: r => r.max(180) }),
    defineField({ name: 'ogImage', type: 'image' }),
    defineField({ name: 'noIndex', type: 'boolean', initialValue: false }),
  ],
});
