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
 * build. SHOW_DRAFTS lets the staging build opt in explicitly; see the deploy
 * workflows.
 */
const SHOW_DRAFTS =
  import.meta.env.DEV ||
  // Read from process rather than import.meta.env: Vite deliberately does not
  // expose arbitrary process env through import.meta.env, so a plain
  // `import.meta.env.SHOW_DRAFTS` reads undefined and the gate silently never
  // opens. This module only ever runs at build time, where process exists.
  (typeof process !== 'undefined' && process.env?.SHOW_DRAFTS === 'true');

/**
 * Which sections currently hold at least one file.
 *
 * Every section is declared in content/config.ts whether or not it has posts
 * yet, which is the point — a new section should not need a config change. But
 * calling getCollection on an empty one makes Astro warn once per call, and at
 * eleven pages that was fourteen warnings per build, drowning out real ones.
 *
 * This resolves at build time from the file list itself, with no I/O.
 */
const POPULATED_SECTIONS = new Set(
  Object.keys(import.meta.glob('../content/*/*.{md,mdx}')).map(
    // '../content/poet/rat-aur-tum.md' -> 'poet'
    (path) => path.split('/')[2],
  ),
);

/** Roughly 200 words per minute, floored at one. Whitespace-split counts Devanagari fine. */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * URL-safe slug that keeps non-Latin letters instead of stripping them. A
 * naive `[^a-z0-9]` slugify would reduce "कहानी" to an empty string.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['’"“”]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function toPost(entry: PostEntry, section: Section): Post {
  const { data } = entry;
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

/** Every published post in one section, newest first. */
export async function getSectionPosts(sectionId: SectionId): Promise<Post[]> {
  const section = getSection(sectionId);
  if (!section || !POPULATED_SECTIONS.has(sectionId)) return [];

  // The cast is needed because the collection name is a variable rather than a
  // literal; the ids come straight from SECTIONS, so it is safe by construction.
  const entries = (await getCollection(sectionId as CollectionKey)) as PostEntry[];

  return entries
    .filter((entry) => SHOW_DRAFTS || !entry.data.draft)
    .map((entry) => toPost(entry, section))
    .sort(byDateDesc);
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

/**
 * Groups posts into series. A story in chapters and a recurring column are the
 * same shape, so they share one mechanism.
 */
export async function getAllSeries(): Promise<Series[]> {
  const posts = await getAllPosts();
  const grouped = new Map<string, Post[]>();

  for (const post of posts) {
    if (!post.series) continue;
    const key = `${post.section.id}/${slugify(post.series.name)}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(post);
    else grouped.set(key, [post]);
  }

  return [...grouped.entries()]
    .map(([key, parts]) => {
      const sorted = [...parts].sort(
        (a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0),
      );
      return {
        slug: key,
        name: sorted[0].series!.name,
        section: sorted[0].section,
        parts: sorted,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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
  const series = all.find((s) => s.slug === `${post.section.id}/${slugify(post.series!.name)}`);
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
