# amitkyadav.com

Personal site of Amit Kumar Yadav. Engineering and AI writing on one side, Hindi
and Hinglish verse and stories on the other.

Astro + Tailwind, content as Markdown in the repo, deployed as a static site.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static output in dist/, plus sitemap and feed
npm run preview    # serve the built output
```

## Content

Four sections, each a folder under `src/content/`:

| Section | Folder | Voice |
| --- | --- | --- |
| Engineer | `src/content/engineer/` | Workshop — sans, monospace code, wider measure |
| Poetry | `src/content/poet/` | Literary — serif, verse formatting |
| Stories | `src/content/story/` | Literary |
| Life | `src/content/life/` | Literary |

Adding a section is one entry in `SECTIONS` in `src/config/site.ts` plus the
folder. Section pages, post pages, feed categories and the sitemap follow from
that array.

### Frontmatter

Every section shares one schema, defined in `src/content/config.ts`. Only `title`
and `date` are required.

```yaml
---
title: Rat aur Tum
date: 2026-08-14
excerpt: Shown on cards, in the feed, and as the page description
lang: hi-Latn          # hi (Devanagari) | hi-Latn (Hinglish) | en
format: verse          # verse preserves your line breaks; defaults per section
draft: true            # staging only — never published, never indexed
tags: ["testing", "AI"]
cover: ./_assets/photo.jpg
coverAlt: Required whenever cover is set, or the build fails
audio: /audio/rat-aur-tum.mp3
audioLabel: Read by the poet
series:
  name: A Novel in Parts
  order: 1             # must be unique within the series
---
```

Notes worth knowing:

- **Verse.** With `format: verse`, single newlines become real line breaks and a
  blank line becomes a stanza. Type the poem the way it should read.
- **Nesting.** Posts can live in subfolders — `story/a-novel/ch-01.md` becomes
  `/story/a-novel/ch-01`. Folders prefixed with `_` are ignored, which is why
  colocated images go in `_assets/`.
- **Images.** Relative paths are optimised at build time into WebP with a
  responsive srcset. Put them in `_assets/` beside the post.
- **Audio.** Files live in `public/audio/`. A path that does not exist fails the
  build rather than shipping a silent 404.
- **Series.** A story in chapters and a recurring column use the same mechanism:
  a landing page at `/series/<section>/<name>`, plus previous/next links.

### Files in `.mdx` can use these blocks

No import needed — they resolve from a components map in the post template.

```mdx
<Callout type="warning" title="Careful">Text</Callout>
<Video id="youtubeId" title="What it shows" caption="Optional" />
<Figure caption="Optional">![alt](./_assets/img.jpg)</Figure>
<Gallery columns={2}>![alt](./a.jpg) ![alt](./b.jpg)</Gallery>
```

Video is never committed — it embeds from YouTube and loads nothing until the
viewer presses play.

### Fixtures

Draft posts named "Fixture" exist to keep every feature exercised on each build:
the nested series under `src/content/story/fixture-series/`,
`src/content/engineer/component-reference.mdx`, and
`src/content/poet/recitation-check.md`. They are invisible in production. Delete
them once real writing covers the same ground.

## Editing

Local editor: `npm run dev`, then <http://localhost:3000/keystatic>. It writes
Markdown into `src/content/`. It cannot create nested folders — those are added
by hand.

A browser-based CMS that works from a phone, with no dev server, is the next
piece of work.

## Environments

| | Branch | URL | Behaviour |
| --- | --- | --- | --- |
| Staging | `staging` | staging.amitkyadav.com | Shows drafts, `noindex` on every page |
| Production | `master` | amitkyadav.com | Published posts only |

Both deploy over FTPS to Hostinger via GitHub Actions. The build reads two
variables:

- `SITE_URL` — the canonical origin. Any value other than
  `https://amitkyadav.com` marks every page `noindex` and empties the sitemap
  and feed. This matters because the staging subdomain's document root sits
  inside `public_html`, so the same pages also answer at
  `amitkyadav.com/staging/`.
- `SHOW_DRAFTS` — `true` on staging only.

Repository secrets required: `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`.

Workflow: write on `staging`, review at staging.amitkyadav.com, then merge to
`master` to publish.

## Layout

```
src/
├── config/site.ts        sections, navigation, site identity
├── content/config.ts     the shared Zod schema
├── lib/posts.ts          resolves posts, series and tags; build-time guards
├── layouts/              BaseLayout (shell), PostLayout (article)
├── components/           shared UI, plus mdx/ blocks for post bodies
├── pages/                [section]/, series/, tags/, 404
└── styles/global.css     palette tokens and the two typographic registers
```

Colour and type resolve to CSS custom properties, so dark mode is one token
block rather than a `dark:` variant on every element.
