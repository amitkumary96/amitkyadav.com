import { defineCollection, z } from 'astro:content';
import { SECTION_IDS } from '../config/site';

/**
 * One schema, shared by every section.
 *
 * Before this existed, seven page files each re-derived post data from
 * `import.meta.glob` and trusted whatever frontmatter happened to be there.
 * A typo in a field name failed silently — the post just disappeared from a
 * listing with no error. Everything below now fails the build instead.
 */
/**
 * Treats an empty or whitespace-only value as absent.
 *
 * A CMS renders every optional field as a control, and a control that has never
 * been filled in writes an empty string rather than omitting the key. Sveltia's
 * `omit_empty_optional_fields` is meant to prevent that; it did not, and because
 * the schema rejected `audio: ''` and `cover: ''` the editor produced files its
 * own site refused to build — with the failure only visible in CI logs.
 *
 * Tolerating empty here means no editor, present or future, can write frontmatter
 * that breaks the build simply by leaving a field alone.
 */
const blankAsUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : (value ?? undefined);

const optionalString = () => z.preprocess(blankAsUndefined, z.string().optional());

const postSchema = ({ image }: { image: () => z.ZodType }) =>
  z
    .object({
      title: z.string().min(1, 'This post needs a title.'),

      /**
       * Accepts `2026-08-19` or a full ISO timestamp.
       *
       * Validated as a string and then converted, rather than with z.coerce.date.
       * Astro replaces Zod's messages for *type* errors with its own — a cleared
       * date reported only as "Invalid date", which tells a writer nothing — but
       * it passes *refinement* messages straight through. So the checks below are
       * deliberately refinements on a string.
       *
       * YAML parses an unquoted `2026-08-19` into a Date before Zod sees it,
       * hence the round trip back to a string first.
       */
      date: z.preprocess(
        (value) => (value instanceof Date ? value.toISOString() : value),
        z
          .string()
          .min(1, 'This post needs a date, e.g. 2026-08-19.')
          .refine((value) => !Number.isNaN(new Date(value).getTime()), {
            message: 'That date could not be read. Use the form 2026-08-19.',
          })
          .transform((value) => new Date(value)),
      ),

      /** Used on cards, in feeds, and as the meta description. */
      excerpt: optionalString(),

      /**
       * Blank rows are dropped rather than rejected. A CMS list widget adds an
       * empty row the moment you click "add", so leaving one behind would
       * otherwise fail the build over a stray click.
       */
      tags: z.preprocess(
        (value) =>
          Array.isArray(value)
            ? value.filter((tag) => typeof tag === 'string' && tag.trim() !== '')
            : (value ?? []),
        z.array(z.string()).default([]),
      ),

      /**
       * Draft posts are excluded from every listing, feed and sitemap on a
       * production build, and shown everywhere else so staging can preview
       * unfinished work.
       */
      draft: z.boolean().default(false),

      /**
       * `verse` preserves line breaks and stanza spacing. Omit it and the
       * section's own default applies — poems are verse unless told otherwise.
       *
       * Blank-tolerant like the rest: a select the editor rendered but nobody
       * chose from writes an empty string, and falling back to the section
       * default is more useful than refusing to build.
       */
      format: z.preprocess(blankAsUndefined, z.enum(['prose', 'verse']).optional()),

      /** Omit and the section default applies. See PostLang in config/site.ts. */
      lang: z.preprocess(blankAsUndefined, z.enum(['hi', 'hi-Latn', 'en']).optional()),

      /** Optimised at build time into WebP/AVIF with a responsive srcset. */
      cover: z.preprocess(blankAsUndefined, image().optional()),
      coverAlt: optionalString(),

      /**
       * Path to a recitation, relative to the site root — e.g.
       * `/audio/rat-aur-tum.mp3`. Audio is served as-is rather than processed,
       * so these live in public/audio/.
       */
      audio: z.preprocess(
        blankAsUndefined,
        z
          .string()
          .startsWith('/', 'The recitation path must start with / — e.g. /audio/poem.mp3.')
          .optional(),
      ),
      audioLabel: optionalString(),

      /**
       * Groups posts into an ordered sequence — a story in chapters, or a
       * recurring column. Any section can use it.
       *
       * The preprocess step exists because a CMS renders this as a collapsed
       * object and can write it back empty — `{ name: '', order: null }` — for a
       * post that is not part of any series. Treating that as absent keeps the
       * editor from producing files its own site refuses to build.
       */
      series: z.preprocess(
        (value) => {
          if (!value || typeof value !== 'object') return value ?? undefined;
          const candidate = value as { name?: unknown; order?: unknown };
          const hasName = typeof candidate.name === 'string' && candidate.name.trim() !== '';
          if (!hasName) return undefined;

          /**
           * A missing or unreadable part number becomes 0, which the `positive`
           * refinement below rejects with a message a writer can act on. Left as
           * null it would surface only as Astro's own 'Expected type "number",
           * received "null"'.
           */
          const order = Number(candidate.order);
          return { ...candidate, order: Number.isFinite(order) ? order : 0 };
        },
        z
          .object({
            name: z.string().min(1),
            /**
             * Deliberately still an error rather than a tolerated blank. A part
             * with no position would sort arbitrarily among its siblings, and a
             * story whose chapters shuffle is worse than a build that stops and
             * says so.
             */
            order: z
              .number()
              .int('The series part number must be a whole number.')
              .positive('This post names a series but has no part number. Add one — parts with no position would shuffle.'),
          })
          .optional(),
      ),
    })
    /**
     * An image without a description is invisible to anyone using a screen
     * reader, so this is a build error rather than a lint warning.
     */
    .refine((data) => !data.cover || Boolean(data.coverAlt?.trim()), {
      message:
        'This post has a cover image but no description. Add one in "Cover description" — without it the image is invisible to anyone using a screen reader.',
      path: ['coverAlt'],
    });

/**
 * Every section gets an identically-shaped collection. Written as a fold over
 * SECTION_IDS so adding a section really is a one-word change in config/site.ts.
 */
export const collections = Object.fromEntries(
  SECTION_IDS.map((id) => [id, defineCollection({ type: 'content', schema: postSchema })]),
);
