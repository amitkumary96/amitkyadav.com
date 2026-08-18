import { collection, config, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    poet: collection({
      label: 'Poet',
      slugField: 'title',
      path: 'src/content/poet/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        category: fields.select({
          label: 'Category',
          options: [{ label: 'Poet', value: 'poet' }],
          defaultValue: 'poet',
        }),
        excerpt: fields.text({ label: 'Excerpt' }),
        content: fields.markdoc({ label: 'Content', extension: 'md' })
      }
    }),
    engineer: collection({
      label: 'Engineer',
      slugField: 'title',
      path: 'src/content/engineer/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        category: fields.select({
          label: 'Category',
          options: [{ label: 'Engineer', value: 'engineer' }],
          defaultValue: 'engineer',
        }),
        excerpt: fields.text({ label: 'Excerpt', validation: { isRequired: false } }),
        content: fields.markdoc({ label: 'Content', extension: 'md' })
      }
    }),
    life: collection({
      label: 'Life',
      slugField: 'title',
      path: 'src/content/life/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        category: fields.select({
          label: 'Category',
          options: [{ label: 'Life', value: 'life' }],
          defaultValue: 'life',
        }),
        excerpt: fields.text({ label: 'Excerpt', validation: { isRequired: false } }),
        content: fields.markdoc({ label: 'Content', extension: 'md' })
      }
    })
  }
});
