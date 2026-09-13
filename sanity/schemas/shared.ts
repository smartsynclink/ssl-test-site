import { defineField, defineType } from 'sanity';

export const faq = defineType({
  name: 'faq', title: 'FAQ', type: 'document',
  fields: [
    defineField({ name: 'question', type: 'string', validation: r => r.required() }),
    defineField({ name: 'answer', type: 'text', rows: 4, validation: r => r.required() }),
  ],
  preview: { select: { title: 'question', subtitle: 'answer' } },
});

export const review = defineType({
  name: 'review', title: 'Review', type: 'document',
  fields: [
    defineField({ name: 'author', type: 'string', validation: r => r.required() }),
    defineField({ name: 'quote', type: 'text', rows: 5, validation: r => r.required() }),
    defineField({ name: 'initials', type: 'string', description: 'Falls back to initials of the author name.' }),
    defineField({ name: 'rating', type: 'number', initialValue: 5, validation: r => r.min(1).max(5) }),
    defineField({ name: 'city', type: 'string',
      description: 'Blueprint: every review shows first name + city. City pages show reviews from their own city.' }),
  ],
  preview: { select: { title: 'author', subtitle: 'quote' } },
});

export const project = defineType({
  name: 'project', title: 'Project (before / after)', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'caption', type: 'text', rows: 2 }),
    defineField({ name: 'category', type: 'string', description: 'Matches a service category id; drives the Projects page filter.' }),
    defineField({ name: 'city', type: 'string', description: 'Where the job was done. City pages show their own jobs as local proof.' }),
    defineField({ name: 'beforeImage', type: 'image', options: { hotspot: true }, validation: r => r.required() }),
    defineField({ name: 'afterImage', type: 'image', options: { hotspot: true }, validation: r => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'caption', media: 'afterImage' } },
});

export const videoItem = defineType({
  name: 'videoItem', title: 'Video', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'caption', type: 'text', rows: 2 }),
    defineField({ name: 'video', type: 'file', validation: r => r.required() }),
    defineField({ name: 'poster', type: 'image', description: 'Shown before playback. Required for a good LCP.' }),
  ],
  preview: { select: { title: 'title', subtitle: 'caption', media: 'poster' } },
});
