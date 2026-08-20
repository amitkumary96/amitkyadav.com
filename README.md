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

### Where to write

| | Editor | Writes to | Appears on |
| --- | --- | --- | --- |
| **Live** | <https://amitkyadav.com/admin> | `master` | the public site, ~2 min |
| **Test** | <https://staging.amitkyadav.com/admin> | `staging` | staging only |

**Write real posts in the live editor.** Content is not something staging reviews —
it goes straight to the public site, which is the point.

The staging editor exists so that after a code or design change you can check the
CMS itself still works, without touching live writing.

The two look identical, so each shows a coloured bar at the top: **red LIVE SITE**
or **grey TEST SITE**, with the branch it saves to. Check it before you type.

### Signing in

**Press "Sign In with Token", not "Login with GitHub".** The GitHub button uses
Netlify's OAuth broker, which this site is not registered with, so it returns
`Not Found`. Token sign-in needs no OAuth app and no proxy server, which is the
only reason a browser-based editor can run on static hosting.

The token is a **fine-grained personal access token** with **Contents: Read and
write** on this repository and nothing else. It is stored in your browser.

In `.mdx` sections the toolbar offers **Insert → Video** and **Insert → Callout**
alongside the built-in code block and image. Poetry is `.md`, so it gets images
and frontmatter media instead; a component tag in a `.md` file would render as
literal text.

In verse, **Enter starts a new stanza and Shift+Enter starts a new line.**

### Changing the code or design

`master` is the trunk — it always holds the live writing, because the production
editor commits to it. `staging` is a working branch for code.

1. **Actions → Sync Staging from Production.** Brings staging up to date with the
   live content, so you test a change against what is really there.
2. Push your changes to `staging`. They appear at staging.amitkyadav.com.
3. Check it, including `/admin` if the change could affect the editor.
4. **Actions → Promote Staging to Production.** Merges staging into master and
   deploys. Tick `dry_run` first to see what would move.

This merges rather than fast-forwards, because master moves on its own every time
a post is written and would almost never be a direct ancestor of staging.

### On this machine

`npm run dev`, then <http://localhost:3000/keystatic>. Kept as a fallback. It
cannot create nested folders — those are added by hand.

### If a change does not appear

A failed build leaves the previous version serving, on purpose — a broken post
must never reach the site. Open **Actions**: a red run explains which field to fix
and confirms nothing was lost.

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
