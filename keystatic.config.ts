import { collection, config, fields } from '@keystatic/core';

/**
 * Local-only editor, kept as a fallback until the browser-based CMS replaces it.
 *
 * This mirrors src/content/config.ts field for field. It had drifted badly —
 * three collections instead of four, a dead `category` field the site no longer
 * reads, and none of draft, tags, lang, format, cover, audio or series — which
 * meant the "working fallback" could not actually produce the content model the
 * site expects.
 *
 * One known limitation, stated rather than hidden: `path` addresses a flat file
 * per entry, so this editor cannot create the nested folders a serialised story
 * uses (story/a-novel/ch-01.md). Nested chapters have to be added by hand here.
 * The site itself handles them correctly.
 */

const postSchema = (section: string) => ({
  title: fields.slug({ name: { label: 'Title' } }),

  date: fields.date({
    label: 'Date',
    defaultValue: { kind: 'today' },
    validation: { isRequired: true },
  }),

  excerpt: fields.text({
    label: 'Excerpt',
    description: 'Shown on cards, in the feed, and as the page description.',
    multiline: true,
    validation: { isRequired: false },
  }),

  draft: fields.checkbox({
    label: 'Draft',
    description: 'Visible on staging only. Never published, never indexed.',
    defaultValue: false,
  }),

  tags: fields.array(fields.text({ label: 'Tag' }), {
    label: 'Tags',
    itemLabel: (props) => props.value || 'Tag',
  }),

  format: fields.select({
    label: 'Format',
    description: 'Verse preserves the line breaks you type. Prose reflows.',
    options: [
      { label: 'Prose', value: 'prose' },
      { label: 'Verse', value: 'verse' },
    ],
    defaultValue: section === 'poet' ? 'verse' : 'prose',
  }),

  lang: fields.select({
    label: 'Language',
    description: 'Hinglish means Hindi written in Latin script.',
    options: [
      { label: 'Hindi (Devanagari)', value: 'hi' },
      { label: 'Hinglish (Latin script)', value: 'hi-Latn' },
      { label: 'English', value: 'en' },
    ],
    defaultValue: section === 'poet' ? 'hi' : section === 'engineer' ? 'en' : 'hi-Latn',
  }),

  cover: fields.image({
    label: 'Cover image',
    directory: `src/content/${section}/_assets`,
    publicPath: './_assets/',
    validation: { isRequired: false },
  }),

  coverAlt: fields.text({
    label: 'Cover description',
    description: 'Required whenever a cover is set — the build fails without it.',
    validation: { isRequired: false },
  }),

  audio: fields.text({
    label: 'Recitation path',
    description: 'A site-root path such as /audio/poem.mp3. The file must exist in public/audio/.',
    validation: { isRequired: false },
  }),

  audioLabel: fields.text({
    label: 'Recitation label',
    validation: { isRequired: false },
  }),

  series: fields.conditional(
    fields.checkbox({ label: 'Part of a series', defaultValue: false }),
    {
      false: fields.empty(),
      true: fields.object({
        name: fields.text({
          label: 'Series name',
          validation: { isRequired: true },
        }),
        order: fields.integer({
          label: 'Part number',
          description: 'Must be unique within the series — duplicates fail the build.',
          validation: { isRequired: true, min: 1 },
        }),
      }),
    },
  ),

  content: fields.markdoc({ label: 'Content', extension: 'md' }),
});

const postCollection = (section: string, label: string) =>
  collection({
    label,
    slugField: 'title',
    path: `src/content/${section}/*`,
    format: { contentField: 'content' },
    schema: postSchema(section),
  });

export default config({
  storage: { kind: 'local' },
  collections: {
    engineer: postCollection('engineer', 'Engineer'),
    poet: postCollection('poet', 'Poetry'),
    story: postCollection('story', 'Stories'),
    life: postCollection('life', 'Life'),
  },
});
