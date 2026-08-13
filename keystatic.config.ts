import { defineConfig, text, date, document } from '@keystatic/core';

export const keystaticConfig = defineConfig({
  storage: { kind: 'local' },
  collections: {
    poet: {
      label: 'Poet',
      path: 'src/content/poet',
      format: 'md',
      schema: {
        title: text({ label: 'Title' }),
        date: date({ label: 'Date' }),
        category: text({ label: 'Category' }),
        excerpt: text({ label: 'Excerpt' }),
        content: document({ label: 'Content' })
      }
    },
    engineer: {
      label: 'Engineer',
      path: 'src/content/engineer',
      format: 'md',
      schema: {
        title: text({ label: 'Title' }),
        date: date({ label: 'Date' }),
        category: text({ label: 'Category' }),
        excerpt: text({ label: 'Excerpt', optional: true }),
        content: document({ label: 'Content' })
      }
    },
    life: {
      label: 'Life',
      path: 'src/content/life',
      format: 'md',
      schema: {
        title: text({ label: 'Title' }),
        date: date({ label: 'Date' }),
        category: text({ label: 'Category' }),
        excerpt: text({ label: 'Excerpt', optional: true }),
        content: document({ label: 'Content' })
      }
    }
  }
});
