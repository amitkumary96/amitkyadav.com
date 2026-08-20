import type { APIRoute } from 'astro';
import { SECTIONS, SITE, type Section } from '../../config/site';

export const prerender = true;

/**
 * The CMS configuration, generated from SECTIONS rather than hand-maintained.
 *
 * The previous CMS config drifted out of sync with the site — three collections
 * when there were four, a field the site no longer read, and none of the newer
 * ones. Deriving it means adding a section updates the editor in the same commit
 * that adds it to the site, and the two cannot disagree.
 *
 * Serialised as JSON, which every YAML parser accepts, because YAML is a
 * superset of it. The first version of this file wrote YAML by hand and mixed
 * flow mappings with block sequences, producing a config that parsed nowhere —
 * a mistake that would only have surfaced on opening the editor. Building an
 * object and letting JSON.stringify format it makes that class of bug
 * impossible. The explanation lives here, in the source, which is where a
 * maintainer would look for it anyway.
 */

interface CmsField {
  name: string;
  label: string;
  widget: string;
  required?: boolean;
  default?: unknown;
  hint?: string;
  [key: string]: unknown;
}

const LANGUAGE_OPTIONS = [
  { label: 'Hindi (Devanagari)', value: 'hi' },
  { label: 'Hinglish (Latin script)', value: 'hi-Latn' },
  { label: 'English', value: 'en' },
];

const FORMAT_OPTIONS = [
  { label: 'Prose', value: 'prose' },
  { label: 'Verse - keeps the line breaks you type', value: 'verse' },
];

/**
 * Mirrors the Zod schema in src/content/config.ts, field for field.
 *
 * Order is writing order, not schema order. The first version listed every
 * metadata field before the body, which buried the actual rich text editor under
 * ten form controls — you had to scroll past Draft, Tags, Format, Language,
 * Cover and Audio before you could type a word. Title then Content now come
 * first, and everything else follows.
 */
function fieldsFor(section: Section): CmsField[] {
  return [
    { name: 'title', label: 'Title', widget: 'string', required: true },
    {
      // Second, because this is where the writing happens.
      name: 'body',
      label: 'Content',
      widget: 'markdown',
      hint:
        section.defaultFormat === 'verse'
          ? 'Enter starts a new stanza. Shift+Enter starts a new line within the same stanza — that is the distinction verse needs.'
          : undefined,
    },
    {
      name: 'date',
      label: 'Date',
      widget: 'datetime',
      date_format: 'YYYY-MM-DD',
      time_format: false,
      picker_utc: true,
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      widget: 'text',
      required: false,
      hint: 'Shown on cards, in the feed, and as the page description.',
    },
    {
      name: 'draft',
      label: 'Draft',
      widget: 'boolean',
      /**
       * False, not true. A CMS applies a field default whenever the key is absent
       * from the file — so opening a published post that predates this field and
       * pressing Save silently unpublished it. That happened to "Rat aur Tum".
       *
       * Accidentally publishing is the safer failure of the two: it reaches
       * staging only, and production needs a separate deliberate promotion.
       */
      default: false,
      hint: 'Tick while a piece is unfinished. Drafts appear on staging only and are never indexed.',
    },
    {
      name: 'tags',
      label: 'Tags',
      widget: 'list',
      required: false,
      hint: 'Tag pages cut across every section.',
    },
    {
      name: 'format',
      label: 'Format',
      widget: 'select',
      options: FORMAT_OPTIONS,
      default: section.defaultFormat,
    },
    {
      name: 'lang',
      label: 'Language',
      widget: 'select',
      options: LANGUAGE_OPTIONS,
      default: section.defaultLang,
    },
    { name: 'cover', label: 'Cover image', widget: 'image', required: false },
    {
      name: 'coverAlt',
      label: 'Cover description',
      widget: 'string',
      required: false,
      hint: 'Required whenever a cover is set - the build fails without it.',
    },
    {
      // Recitation is the point of the poetry section, so it is named plainly
      // there. The file lands in public/audio and the frontmatter records a
      // site-root path, which is what the schema validates against disk.
      name: 'audio',
      label: section.id === 'poet' ? 'Recitation' : 'Audio',
      widget: 'file',
      required: false,
      media_folder: '/public/audio',
      public_folder: '/audio',
      hint: 'Record on your phone and upload. Optional, always.',
    },
    { name: 'audioLabel', label: 'Audio label', widget: 'string', required: false },
    {
      name: 'series',
      label: 'Series',
      widget: 'object',
      required: false,
      collapsed: true,
      hint: 'For a story in chapters or a recurring column. Leave empty otherwise.',
      fields: [
        { name: 'name', label: 'Series name', widget: 'string', required: false },
        {
          name: 'order',
          label: 'Part number',
          widget: 'number',
          value_type: 'int',
          min: 1,
          required: false,
          hint: 'Must be unique within the series.',
        },
      ],
    },
  ];
}

function collectionFor(section: Section) {
  return {
    name: section.id,
    label: section.label,
    label_singular: section.labelSingular,
    folder: `src/content/${section.id}`,
    extension: section.contentExtension,
    format: 'frontmatter',
    create: true,
    slug: '{{fields.title}}',
    // Relative, so uploads colocate beside the post as src/content/<section>/_assets
    // and the frontmatter records ./_assets/name.jpg — the form Astro's image()
    // pipeline resolves.
    media_folder: '_assets',
    public_folder: './_assets',
    sortable_fields: ['date', 'title'],
    // A component tag written into a .md file renders as literal text, so the
    // in-body blocks are offered only where the file is .mdx.
    editor_components:
      section.contentExtension === 'mdx'
        ? ['code-block', 'image', 'video', 'callout']
        : ['code-block', 'image'],
    fields: fieldsFor(section),
  };
}

/**
 * Which branch this editor writes to depends on which site is serving it.
 *
 * Content is written on production and goes live; staging exists to test code and
 * design changes, and its editor writes to the staging branch so the CMS itself
 * can be exercised after a change without touching live content.
 *
 * Deriving it from the origin rather than hardcoding it means one build produces
 * the right editor for whichever site it lands on, and the two can never quietly
 * point at the same place.
 */
function configFor(origin: string) {
  const isProduction = origin === `https://${SITE.domain}`;

  return {
    backend: {
      name: 'github',
      repo: SITE.repo,
      branch: isProduction ? 'master' : 'staging',
      commit_messages: {
        create: 'content: add {{collection}} - {{slug}}',
        update: 'content: update {{collection}} - {{slug}}',
        delete: 'content: remove {{collection}} - {{slug}}',
        uploadMedia: 'content: upload {{path}}',
        deleteMedia: 'content: remove {{path}}',
      },
    },
    publish_mode: 'simple',
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    // Empty optional fields are dropped rather than written as empty strings,
    // which would fail schema validation on the next build.
    omit_empty_optional_fields: true,
    collections: SECTIONS.map(collectionFor),
  };
}

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? `https://${SITE.domain}`;

  return new Response(JSON.stringify(configFor(origin), null, 2), {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
