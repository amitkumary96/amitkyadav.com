import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SECTIONS, SITE } from '../config/site';
import { getAllPosts } from '../lib/posts';

export const prerender = true;

const SECTION_LABEL = new Map(SECTIONS.map((s) => [s.id, s.label]));

/**
 * The real feed.
 *
 * What this replaces: a Node script that walked dist/ after the build, matched
 * every .html file, and used the URL as the item title. The feed had no real
 * titles, no descriptions and no reliable dates, so nobody could usefully
 * subscribe to it. Reading the collections instead means the feed carries the
 * same data the pages do.
 *
 * Drafts are excluded unconditionally, even on staging where they are otherwise
 * visible. A feed is a publishing channel, not a preview: once an item goes out
 * to a reader's client it cannot be recalled.
 */
export const GET: APIRoute = async (context) => {
  const posts = (await getAllPosts()).filter((post) => !post.draft);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? `https://${SITE.domain}`,
    trailingSlash: true,
    xmlns: { content: 'http://purl.org/rss/1.0/modules/content/' },
    customData: [
      '<language>en-in</language>',
      `<managingEditor>${SITE.social.email} (${SITE.author})</managingEditor>`,
    ].join(''),
    items: posts.map((post) => ({
      title: post.title,
      link: `${post.url}/`,
      pubDate: post.date,
      description: post.excerpt ?? `${SECTION_LABEL.get(post.section.id)} by ${SITE.author}`,
      // Section first, then the post's own tags, so a reader can filter on either.
      categories: [SECTION_LABEL.get(post.section.id) ?? post.section.id, ...post.tags],
      author: `${SITE.social.email} (${SITE.author})`,
      customData: [
        // Lets a reader's client render Devanagari and Hinglish correctly rather
        // than assuming the feed language applies to every item.
        `<dc:language xmlns:dc="http://purl.org/dc/elements/1.1/">${post.lang}</dc:language>`,
        post.audio
          ? `<enclosure url="${context.site ?? ''}${post.audio.replace(/^\//, '')}" type="audio/mpeg" />`
          : '',
      ]
        .filter(Boolean)
        .join(''),
    })),
  });
};
