import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { SITE } from '../../config/site';
import { formatDate, getAllPosts, type Post } from '../../lib/posts';

export const prerender = true;

/**
 * A social preview image per post, rendered at build time.
 *
 * Until now the site advertised no og:image at all, because the one it used to
 * name had never existed in the repo — so every share on WhatsApp, LinkedIn or X
 * showed a blank card. These are generated from the post's own title and
 * section, in the site's palette and faces, so a shared link looks deliberate.
 *
 * Satori lays out a subset of CSS and emits SVG; resvg rasterises it. Two
 * constraints worth knowing before editing the tree below:
 *   - every container needs an explicit `display: flex`, because satori does not
 *     implement block layout
 *   - fonts must be TTF, OTF or WOFF. The woff2 files the site itself serves are
 *     not readable here, which is why the static @fontsource packages are
 *     installed alongside the variable ones.
 */

const WIDTH = 1200;
const HEIGHT = 630;

// Mirrors the light-mode tokens in src/styles/global.css.
const PAPER = '#fbfaf8';
const INK = '#16161d';
const INK_SOFT = '#52525f';
const INK_FAINT = '#85838f';
const MADDER = '#a32e33';
const RULE = '#e2ded8';

/** Build-time only, so reading straight from node_modules is safe and explicit. */
function fontFile(pkg: string, file: string): string {
  return path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file);
}

const FONTS = [
  {
    name: 'Literata',
    file: fontFile('literata', 'literata-latin-400-normal.woff'),
    weight: 400 as const,
  },
  {
    name: 'Literata',
    file: fontFile('literata', 'literata-latin-600-normal.woff'),
    weight: 600 as const,
  },
  {
    name: 'Noto Serif Devanagari',
    file: fontFile('noto-serif-devanagari', 'noto-serif-devanagari-devanagari-400-normal.woff'),
    weight: 400 as const,
  },
  {
    name: 'Noto Serif Devanagari',
    file: fontFile('noto-serif-devanagari', 'noto-serif-devanagari-devanagari-600-normal.woff'),
    weight: 600 as const,
  },
];

let fontCache: Awaited<ReturnType<typeof loadFonts>> | undefined;

async function loadFonts() {
  return Promise.all(
    FONTS.map(async (font) => ({
      name: font.name,
      data: await readFile(font.file),
      weight: font.weight,
      style: 'normal' as const,
    })),
  );
}

/**
 * Longer titles step down through two sizes rather than wrapping into the
 * furniture. Measured in characters because satori cannot measure text for us.
 */
function titleSize(title: string): number {
  if (title.length > 72) return 46;
  if (title.length > 40) return 58;
  return 72;
}

// Both faces are listed so a Hinglish or mixed title resolves per glyph.
const FAMILY = 'Literata, Noto Serif Devanagari';

function template(post: Post) {
  const sectionLine = post.section.native
    ? `${post.section.label} · ${post.section.native}`
    : post.section.label;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: PAPER,
        padding: '64px 72px',
        fontFamily: FAMILY,
      },
      children: [
        // Section, with the accent rule that carries the whole identity.
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '72px',
                    height: '4px',
                    backgroundColor: MADDER,
                    marginBottom: '28px',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '24px',
                    letterSpacing: '0.14em',
                    color: MADDER,
                    textTransform: 'uppercase',
                  },
                  children: sectionLine,
                },
              },
            ],
          },
        },

        // The title does the work.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: `${titleSize(post.title)}px`,
              fontWeight: 600,
              lineHeight: 1.18,
              color: INK,
              maxWidth: '100%',
            },
            children: post.title,
          },
        },

        // Footer: who and when, plus the format so verse announces itself.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '100%',
                    height: '1px',
                    backgroundColor: RULE,
                    marginBottom: '24px',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    fontSize: '26px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: { style: { display: 'flex', color: INK_SOFT }, children: SITE.domain },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', color: INK_FAINT },
                        children: `${formatDate(post.date)}${
                          post.format === 'verse' ? '  ·  Verse' : ''
                        }`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    // Mirrors the post URL, so /engineer/a-note has /og/engineer/a-note.png
    params: { slug: `${post.section.id}/${post.slug}` },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };

  fontCache ??= await loadFonts();

  const svg = await satori(template(post) as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: fontCache,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
