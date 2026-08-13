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
        date: fields.date({ label: 'Date' }),
        category: fields.text({ label: 'Category' }),
        excerpt: fields.text({ label: 'Excerpt' }),
        content: fields.document({ label: 'Content' })
      }
    }),
    engineer: collection({
      label: 'Engineer',
      slugField: 'title',
      path: 'src/content/engineer/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date' }),
        category: fields.text({ label: 'Category' }),
        excerpt: fields.text({ label: 'Excerpt', validation: { isRequired: false } }),
        content: fields.document({ label: 'Content' })
      }
    }),
    life: collection({
      label: 'Life',
      slugField: 'title',
      path: 'src/content/life/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date' }),
        category: fields.text({ label: 'Category' }),
        excerpt: fields.text({ label: 'Excerpt', validation: { isRequired: false } }),
        content: fields.document({ label: 'Content' })
      }
    })
  }
});
