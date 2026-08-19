/**
 * Single source of truth for site identity, sections and navigation.
 *
 * Adding a content section is a two-step change: add an entry to SECTIONS, and
 * create the matching folder under src/content/. Section index pages, post
 * pages, RSS categories and the sitemap all follow from this array — nothing
 * else needs editing.
 */

export const SITE = {
  title: 'Amit Kumar Yadav',
  domain: 'amitkyadav.com',
  /** owner/name on GitHub. The CMS commits here. */
  repo: 'amitkumary96/amitkyadav.com',
  tagline: 'Engineer, poet, storyteller',
  description:
    'Writing on engineering and AI, Hindi poetry, and stories — by Amit Kumar Yadav.',
  author: 'Amit Kumar Yadav',
  locale: 'en_IN',
  social: {
    github: 'https://github.com/amitkumar-y',
    linkedin: 'https://linkedin.com/in/amit-kumar-y96/',
    twitter: 'https://twitter.com/amit_yadavas',
    email: 'amitkumary96@gmail.com',
  },
} as const;

export type SectionId = 'engineer' | 'poet' | 'story' | 'life';

/** Which typographic voice an article is set in. See src/styles/global.css. */
export type Register = 'workshop' | 'literary';

export type PostFormat = 'prose' | 'verse';

/**
 * BCP-47 language tags. `hi-Latn` is Hindi written in Latin script — Hinglish.
 * Tagging it correctly stops screen readers reading it as English and stops
 * browsers hyphenating it by English rules.
 */
export type PostLang = 'hi' | 'hi-Latn' | 'en';

export interface Section {
  readonly id: SectionId;
  readonly label: string;
  /**
   * What one item is called. Stated rather than derived: guessing English
   * morphology from the plural turned "Poetry" into "Poetry" and would have
   * turned "Stories" into "Storie" without a second rule.
   */
  readonly labelSingular: string;
  /** Devanagari name, shown alongside the label where the register is literary. */
  readonly native?: string;
  readonly blurb: string;
  readonly register: Register;
  /** Applied when a post does not set `format` itself. */
  readonly defaultFormat: PostFormat;
  /** Applied when a post does not set `lang` itself. */
  readonly defaultLang: PostLang;
  /**
   * Which file type the CMS creates for this section.
   *
   * `mdx` unlocks the in-body blocks — video, gallery, callout, figure — because
   * those are real components rather than markdown syntax. Poetry stays `md` on
   * purpose: a stray `<` or `{` in verse would be an MDX parse error, and a poem
   * needs none of those blocks. Its media comes from frontmatter instead.
   */
  readonly contentExtension: 'md' | 'mdx';
  /** Shown on the section page when it holds no published posts. */
  readonly emptyState: string;
}

export const SECTIONS: readonly Section[] = [
  {
    id: 'engineer',
    label: 'Engineer',
    labelSingular: 'Note',
    blurb:
      'Notes from testing, automation and AI — what broke, what held, and why.',
    register: 'workshop',
    defaultFormat: 'prose',
    defaultLang: 'en',
    contentExtension: 'mdx',
    emptyState: 'No engineering notes published yet.',
  },
  {
    id: 'poet',
    label: 'Poetry',
    labelSingular: 'Poem',
    native: 'कविता',
    blurb: 'Hindi and Hinglish verse. Some of it read aloud.',
    register: 'literary',
    defaultFormat: 'verse',
    defaultLang: 'hi',
    contentExtension: 'md',
    emptyState: 'No poems published yet.',
  },
  {
    id: 'story',
    label: 'Stories',
    labelSingular: 'Story',
    native: 'कहानी',
    blurb: 'Short fiction, and longer work published a chapter at a time.',
    register: 'literary',
    defaultFormat: 'prose',
    defaultLang: 'hi-Latn',
    contentExtension: 'mdx',
    emptyState: 'No stories published yet.',
  },
  {
    id: 'life',
    label: 'Life',
    labelSingular: 'Entry',
    native: 'जीवन',
    blurb: 'Everything else — what a week taught me, mostly.',
    register: 'literary',
    defaultFormat: 'prose',
    defaultLang: 'hi-Latn',
    contentExtension: 'mdx',
    emptyState: 'Nothing published here yet.',
  },
] as const;

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((s) => s.id);

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/**
 * Navigation is its own list, deliberately NOT derived from SECTIONS.
 *
 * Generating it from the sections would be shorter today and wrong tomorrow:
 * a tool page, a series index or an archive has nowhere to live in that model
 * and ends up special-cased. Keeping the nav explicit means adding a
 * non-content page is one line here.
 */
export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export const NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  ...SECTIONS.map((s) => ({ href: `/${s.id}`, label: s.label })),
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * Ways of finding something rather than places to go, so they live in the footer
 * and — for search — as an icon in the header. Adding them to the main nav took
 * it to eight items, which stops being navigation and becomes a list.
 */
export const UTILITY_NAV: readonly NavItem[] = [
  { href: '/archive', label: 'Archive' },
  { href: '/tags', label: 'Tags' },
  { href: '/search', label: 'Search' },
  { href: '/rss.xml', label: 'RSS' },
] as const;
