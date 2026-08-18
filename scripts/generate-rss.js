const fs = require('fs');
const path = require('path');
const RSS = require('rss');
const { indexablePages, siteOrigin } = require('./lib/pages');

const DIST = path.join(process.cwd(), 'dist');
const SITE = siteOrigin();

/** Section ids come from the content folders, so this never drifts from config. */
const SECTIONS = fs
  .readdirSync(path.join(process.cwd(), 'src', 'content'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const between = (html, pattern) => {
  const match = html.match(pattern);
  return match ? match[1].trim() : undefined;
};

const decode = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/**
 * A post lives at /<section>/<slug>/ — one level below a section index. This
 * keeps the About and Contact pages, the section listings and the tag pages out
 * of the feed without needing a separate manifest.
 */
function asPost({ rel, html, url }) {
  const segments = rel.replace(/\/index\.html$/, '').split('/');
  if (segments.length !== 2) return undefined;

  const [section, slug] = segments;
  if (!SECTIONS.includes(section) || !slug) return undefined;

  // "Title — Amit Kumar Yadav" -> "Title"
  const rawTitle = decode(between(html, /<title>([\s\S]*?)<\/title>/i) ?? slug);
  const title = rawTitle.split(' — ')[0];

  return {
    title,
    url,
    guid: url,
    description: decode(
      between(html, /<meta name="description" content="([^"]*)"/i) ?? '',
    ),
    categories: [section],
    // The article header renders <time datetime="…"> as the publication date.
    date: between(html, /<time[^>]+datetime="([^"]+)"/i),
  };
}

const items = indexablePages(DIST)
  .map(asPost)
  .filter(Boolean)
  .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));

const feed = new RSS({
  title: 'Amit Kumar Yadav',
  description:
    'Writing on engineering and AI, Hindi poetry, and stories — by Amit Kumar Yadav.',
  feed_url: `${SITE}/rss.xml`,
  site_url: SITE,
  language: 'en',
});

for (const item of items) feed.item(item);

fs.writeFileSync(path.join(DIST, 'rss.xml'), feed.xml({ indent: true }));
console.log(`rss.xml generated (${items.length} items)`);
