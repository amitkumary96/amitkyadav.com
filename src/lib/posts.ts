import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import {
  SECTIONS,
  getSection,
  type PostFormat,
  type PostLang,
  type Section,
  type SectionId,
} from '../config/site';

export type PostEntry = CollectionEntry<SectionId>;

/**
 * A post with everything the templates need already resolved: which section it
 * belongs to, its URL, and the format and language defaults applied. Templates
 * should never re-derive these — that duplication is what the old page files
 * got wrong.
 */
export interface Post {
  readonly entry: PostEntry;
  readonly section: Section;
  readonly slug: string;
  readonly url: string;
  readonly title: string;
  readonly date: Date;
  readonly excerpt?: string;
  readonly tags: readonly string[];
  readonly draft: boolean;
  readonly format: PostFormat;
  readonly lang: PostLang;
  readonly audio?: string;
  readonly audioLabel?: string;
  readonly series?: { readonly name: string; readonly order: number };
  readonly readingMinutes: number;
}

/**
 * Drafts are visible while writing and on staging, and hidden on the production
 * build. The staging workflow sets SHOW_DRAFTS explicitly.
 */
const SHOW_DRAFTS =
  import.meta.env.DEV ||
  // Read from process rather than import.meta.env: Vite deliberately does not
  // expose arbitrary process env through import.meta.env, so a plain
  // `import.meta.env.SHOW_DRAFTS` reads undefined and the gate silently never
  // opens. This module only ever runs at build time, where process exists.
  (typeof process !== 'undefined' && process.env?.SHOW_DRAFTS === 'true');

/**
 * How many content files each section holds on disk.
 *
 * The glob is recursive on purpose. It used to stop one level deep, which meant
 * a chapter filed at story/a-novel/ch-01.md was invisible: the section reported
 * itself empty and the build still succeeded. Nesting is exactly what a
 * serialised story wants, so that was silent content loss — the same class of
 * failure this module exists to eliminate.
 *
 * Paths containing a underscore-prefixed segment are skipped to match Astro's
 * own rule, so colocated _assets/ folders and _wip.md scratch files do not count.
 */
const SECTION_FILE_COUNTS: ReadonlyMap<string, number> = (() => {
  const counts = new Map<string, number>();

  for (const filePath of Object.keys(import.meta.glob('../content/**/*.{md,mdx}'))) {
    // '../content/story/a-novel/ch-01.md' -> ['..','content','story','a-novel','ch-01.md']
    const segments = filePath.split('/');
    const section = segments[2];
    if (!section || segments.slice(2).some((part) => part.startsWith('_'))) continue;
    counts.set(section, (counts.get(section) ?? 0) + 1);
  }

  return counts;
})();

/**
 * Audio files present in public/. Keys only — the glob never imports them, so no
 * binary reaches the bundle.
 *
 * A recitation path is only a string in frontmatter, so a typo would otherwise
 * ship a silent 404 on the one feature nobody would think to retest.
 */
const AVAILABLE_AUDIO: ReadonlySet<string> = new Set(
  Object.keys(import.meta.glob('../../public/audio/**/*.{mp3,m4a,ogg,wav}')).map(
    (filePath) => filePath.replace('../../public', ''),
  ),
);

/** Roughly 200 words per minute, floored at one. Whitespace-split counts Devanagari fine. */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * URL-safe slug that keeps non-Latin letters instead of stripping them. A naive
 * `[^a-z0-9]` slugify would reduce "कहानी" to an empty string.
 *
 * Punctuation that carries meaning in technical tags is spelled out first,
 * because dropping it silently merged distinct tags: "C++" and "C" both used to
 * collapse to "c".
 */
export function slugify(input: string): string {
  const spelled = input
    .trim()
    .toLowerCase()
    .replace(/\+\+/g, '-plus-plus')
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/&/g, '-and-')
    .replace(/\./g, '-dot-');

  const slug = spelled
    .replace(/['’"“”]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  if (slug) return slug;

  // A tag of pure punctuation would otherwise produce an empty slug, and a page
  // at /tags/ colliding with the tag index.
  let hash = 0;
  for (const char of input) hash = (hash * 31 + char.codePointAt(0)!) % 0xffffffff;
  return 'tag-' + hash.toString(36);
}

function toPost(entry: PostEntry, section: Section): Post {
  const { data } = entry;

  if (data.audio && !AVAILABLE_AUDIO.has(data.audio)) {
    const available = [...AVAILABLE_AUDIO].join(', ') || '(none)';
    throw new Error(
      `${section.id}/${entry.slug}: audio "${data.audio}" is not in public/. Available: ${available}`,
    );
  }

  return {
    entry,
    section,
    slug: entry.slug,
    url: `/${section.id}/${entry.slug}`,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt,
    tags: data.tags,
    draft: data.draft,
    format: data.format ?? section.defaultFormat,
    lang: data.lang ?? section.defaultLang,
    audio: data.audio,
    audioLabel: data.audioLabel,
    series: data.series,
    readingMinutes: readingMinutes(entry.body),
  };
}

const byDateDesc = (a: Post, b: Post) => b.date.getTime() - a.date.getTime();

/**
 * Collections are read once per build. Without this, getAllSeries -> getAllPosts
 * fanned out across all four collections again for every section page and every
 * tag page.
 */
const sectionCache = new Map<SectionId, Post[]>();

/** Every published post in one section, newest first. */
export async function getSectionPosts(sectionId: SectionId): Promise<Post[]> {
  const cached = sectionCache.get(sectionId);
  if (cached) return cached;

  const section = getSection(sectionId);
  const fileCount = SECTION_FILE_COUNTS.get(sectionId) ?? 0;

  if (!section || fileCount === 0) {
    sectionCache.set(sectionId, []);
    return [];
  }

  // The cast is needed because the collection name is a variable rather than a
  // literal; the ids come straight from SECTIONS, so it is safe by construction.
  const entries = (await getCollection(sectionId as CollectionKey)) as PostEntry[];

  /**
   * Fail loudly when the collection yields fewer entries than there are files.
   * A dropped post looks identical to "nothing written yet" on the rendered
   * page, so it must never be silent again.
   */
  if (entries.length !== fileCount) {
    throw new Error(
      `Section "${sectionId}" has ${fileCount} content file(s) on disk but the collection ` +
        `yielded ${entries.length}. A post is being dropped silently — check for an ` +
        `unsupported extension or a frontmatter parse failure.`,
    );
  }

  const posts = entries
    .filter((entry) => SHOW_DRAFTS || !entry.data.draft)
    .map((entry) => toPost(entry, section))
    .sort(byDateDesc);

  sectionCache.set(sectionId, posts);
  return posts;
}

/** Every published post across every section, newest first. */
export async function getAllPosts(): Promise<Post[]> {
  const perSection = await Promise.all(SECTIONS.map((s) => getSectionPosts(s.id)));
  return perSection.flat().sort(byDateDesc);
}

export async function getLatestPerSection(): Promise<Map<SectionId, Post | undefined>> {
  const entries = await Promise.all(
    SECTIONS.map(async (s) => [s.id, (await getSectionPosts(s.id))[0]] as const),
  );
  return new Map(entries);
}

export interface Series {
  readonly slug: string;
  readonly name: string;
  readonly section: Section;
  /** Ascending by `series.order`, which is the reading order. */
  readonly parts: readonly Post[];
}

let seriesCache: Series[] | undefined;

/**
 * Groups posts into series. A story in chapters and a recurring column are the
 * same shape, so they share one mechanism.
 */
export async function getAllSeries(): Promise<Series[]> {
  if (seriesCache) return seriesCache;

  const posts = await getAllPosts();
  const grouped = new Map<string, Post[]>();

  for (const post of posts) {
    if (!post.series) continue;
    const key = `${post.section.id}/${slugify(post.series.name)}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(post);
    else grouped.set(key, [post]);
  }

  seriesCache = [...grouped.entries()]
    .map(([key, parts]) => {
      const sorted = [...parts].sort(
        (a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0),
      );

      /**
       * Two parts claiming the same position sort arbitrarily, which reads as a
       * random chapter order and is impossible to diagnose from the page.
       */
      const orders = sorted.map((part) => part.series!.order);
      const duplicates = [
        ...new Set(orders.filter((order, index) => orders.indexOf(order) !== index)),
      ];
      if (duplicates.length > 0) {
        throw new Error(
          `Series "${sorted[0].series!.name}" has more than one part at position ` +
            `${duplicates.join(', ')}. Every part needs a distinct order.`,
        );
      }

      return {
        slug: key,
        name: sorted[0].series!.name,
        section: sorted[0].section,
        parts: sorted,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return seriesCache;
}

export interface SeriesPosition {
  readonly series: Series;
  readonly index: number;
  readonly total: number;
  readonly previous?: Post;
  readonly next?: Post;
}

/** Where a given post sits in its series, plus its neighbours. */
export async function getSeriesPosition(post: Post): Promise<SeriesPosition | undefined> {
  if (!post.series) return undefined;

  const all = await getAllSeries();
  const wanted = `${post.section.id}/${slugify(post.series.name)}`;
  const series = all.find((s) => s.slug === wanted);
  if (!series) return undefined;

  const index = series.parts.findIndex((p) => p.url === post.url);
  if (index === -1) return undefined;

  return {
    series,
    index,
    total: series.parts.length,
    previous: series.parts[index - 1],
    next: series.parts[index + 1],
  };
}

export interface Tag {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
}

/** Tags across every section, most-used first. */
export async function getAllTags(): Promise<Tag[]> {
  const posts = await getAllPosts();
  const counts = new Map<string, { name: string; count: number }>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugify(tag);
      const existing = counts.get(slug);
      if (existing) existing.count += 1;
      else counts.set(slug, { name: tag, count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.some((tag) => slugify(tag) === tagSlug));
}

/** e.g. "19 August 2026". Fixed locale so the output does not vary by builder. */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** e.g. "19 Aug 2026", for cards and tight spaces. */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** ISO date for <time datetime> and feeds. */
export function isoDate(date: Date): string {
  return date.toISOString();
}
