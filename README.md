# amitkyadav.com

Personal site of Amit Kumar Yadav. Engineering and AI writing on one side, Hindi
and Hinglish verse and stories on the other.

Astro + Tailwind, content as Markdown in the repo, deployed as a static site.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static output in dist/, then the Pagefind search index
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

## Features

| | Where | Notes |
| --- | --- | --- |
| Search | `/search` | Pagefind, indexed at build, runs in the browser. No server, no service. Index loads on first keystroke. |
| Archive | `/archive` | Everything by year, dense on purpose. |
| Tags | `/tags` | Cut across all four sections. |
| Pagination | `/<section>/page/2` | Kicks in past 12 entries per section (`PAGE_SIZE` in `src/lib/posts.ts`). |
| Earlier / later | foot of a post | Within its section. Series parts use the series navigation instead. |
| Related | foot of a post | By shared tags, deliberately across sections. |
| Script toggle | Devanagari posts | Devanagari ↔ Roman, converted in the browser on demand. |
| Recitation | poems with `audio` | Custom player, `preload="none"`, native fallback without JavaScript. |
| Preview images | every post | 1200×630 PNG generated at build by satori + resvg. |
| Feed | `/rss.xml` | Real titles, dates, categories, per-item language. Drafts always excluded. |
| Sitemap | `/sitemap-index.xml` | Production only — staging is `noindex`. |

### The script toggle

Devanagari posts get a Devanagari/Roman switch. The transliterator in
`src/lib/transliterate.ts` is written for Hindi rather than Sanskrit: it deletes
the word-final inherent vowel (`मन` → `man`, not `mana`) and follows Hinglish
conventions for nasals and vowel length (`नहीं` → `nahin`, `संभव` → `sambhav`,
`में` → `mein`). A Sanskrit library would give `nahīṃ`.

It is approximate and labelled so in the interface. Medial schwa deletion depends
on morphology no rule set settles, so `मिलता` comes out `milata` rather than
`milta`. It is a reading aid for people who speak Hindi but do not read the
script — where the romanisation matters, write it by hand.

The transliterator only downloads when the button is pressed, and the choice is
remembered across posts.

### Contact form

Posts to `public/contact.php`, a real endpoint served by Hostinger's PHP. It
validates, strips anything that could inject a mail header, uses a honeypot and a
submission-timing check, and redirects back with a status. No JavaScript is
required, and no third-party form service is involved.

**This is the only server-dependent file in the project.** On a purely static host
it would 404 and the form would need a different endpoint.

### Analytics

Off by default. Set `goatcounter` in `src/config/site.ts` to a GoatCounter site
code and the script is emitted — production origin only, so staging and local
development never pollute the numbers. No cookies, no personal data, so no consent
banner.

## Editing

### From anywhere, including a phone

<https://staging.amitkyadav.com/admin>

Sveltia CMS, a static single-page app that talks straight to the GitHub API.
Sign in with a **fine-grained personal access token** scoped to this repository —
there is no OAuth app and no proxy server, which is the only reason a
browser-based editor can run on static hosting at all.

Every save is a commit to `staging`, so the staging site reflects it in about
ninety seconds. Nothing written here can reach the live site by accident.

The editor exists on staging only: `astro.config.mjs` strips `/admin` from a
production build, so there is one place to write and no ambiguity about which
branch is being edited.

Its configuration is generated at `/admin/config.yml` from `SECTIONS`, so the
editor cannot drift out of sync with the site — adding a section updates both in
the same commit.

In `.mdx` sections the toolbar offers **Insert → Video** and **Insert → Callout**
alongside the built-in code block and image. Poetry is `.md`, so it gets images
and frontmatter media instead; a component tag in a `.md` file would render as
literal text.

### Publishing

GitHub → Actions → **Publish to Production** → Run workflow. It fast-forwards
`master` to `staging` and deploys. Fast-forward only, so if `master` has moved
independently the run fails and asks you to reconcile rather than inventing a
merge commit. Tick `dry_run` to see what would be published without doing it.

### On this machine

`npm run dev`, then <http://localhost:3000/keystatic>. Kept as a fallback. It
cannot create nested folders — those are added by hand.

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
