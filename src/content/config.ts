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
const postSchema = ({ image }: { image: () => z.ZodType }) =>
  z
    .object({
      title: z.string().min(1, 'title cannot be empty'),

      /** Accepts `2026-08-19` or a full ISO timestamp. */
      date: z.coerce.date(),

      /** Used on cards, in feeds, and as the meta description. */
      excerpt: z.string().optional(),

      tags: z.array(z.string().min(1)).default([]),

      /**
       * Draft posts are excluded from every listing, feed and sitemap on a
       * production build, and shown everywhere else so staging can preview
       * unfinished work.
       */
      draft: z.boolean().default(false),

      /**
       * `verse` preserves line breaks and stanza spacing. Omit it and the
       * section's own default applies — poems are verse unless told otherwise.
       */
      format: z.enum(['prose', 'verse']).optional(),

      /** Omit and the section default applies. See PostLang in config/site.ts. */
      lang: z.enum(['hi', 'hi-Latn', 'en']).optional(),

      /** Optimised at build time into WebP/AVIF with a responsive srcset. */
      cover: image().optional(),
      coverAlt: z.string().optional(),

      /**
       * Path to a recitation, relative to the site root — e.g.
       * `/audio/rat-aur-tum.mp3`. Audio is served as-is rather than processed,
       * so these live in public/audio/.
       */
      audio: z.string().startsWith('/', 'audio must be a site-root path').optional(),
      audioLabel: z.string().optional(),

      /**
       * Groups posts into an ordered sequence — a story in chapters, or a
       * recurring column. Any section can use it.
       */
      series: z
        .object({
          name: z.string().min(1),
          order: z.number().int().positive(),
        })
        .optional(),
    })
    /**
     * An image without a description is invisible to anyone using a screen
     * reader, so this is a build error rather than a lint warning.
     */
    .refine((data) => !data.cover || Boolean(data.coverAlt?.trim()), {
      message: 'coverAlt is required whenever cover is set',
      path: ['coverAlt'],
    });

/**
 * Every section gets an identically-shaped collection. Written as a fold over
 * SECTION_IDS so adding a section really is a one-word change in config/site.ts.
 */
export const collections = Object.fromEntries(
  SECTION_IDS.map((id) => [id, defineCollection({ type: 'content', schema: postSchema })]),
);
