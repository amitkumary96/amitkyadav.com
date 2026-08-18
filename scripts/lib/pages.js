const fs = require('fs');
const path = require('path');

/**
 * Shared page discovery for the sitemap and feed generators.
 *
 * Both used to list every .html file in dist/ unconditionally, which meant the
 * sitemap advertised the 404 page and, once redirects existed, the redirect
 * stubs too. Both are now filtered out, along with anything marked noindex —
 * which is how a staging build avoids publishing a sitemap of itself.
 *
 * These scripts run after `astro build` as plain Node, so they cannot use
 * getCollection. Replacing them with @astrojs/sitemap and @astrojs/rss — which
 * can read the collections and emit real titles, dates and descriptions — is
 * the proper fix and is still outstanding.
 */

/** Prefers SITE_URL so it matches the variable astro.config.mjs reads. */
function siteOrigin() {
  return (
    process.env.SITE_URL ||
    process.env.SITE ||
    'https://amitkyadav.com'
  ).replace(/\/+$/, '');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

/**
 * Every indexable page in dist/, as { url, file }.
 * `root` is the dist directory.
 */
function indexablePages(root) {
  return walk(root)
    .map((file) => {
      const rel = path.relative(root, file).replace(/\\/g, '/');
      return { file, rel, html: fs.readFileSync(file, 'utf8') };
    })
    .filter(({ rel, html }) => {
      if (rel === '404.html') return false;
      // Astro emits redirects as a meta-refresh stub; it is not a page.
      if (/http-equiv=["']?refresh/i.test(html)) return false;
      if (/name=["']?robots["']?[^>]*noindex/i.test(html)) return false;
      return true;
    })
    .map(({ rel, html }) => ({
      rel,
      html,
      url: `${siteOrigin()}/${rel.replace(/index\.html$/, '')}`,
    }));
}

module.exports = { indexablePages, siteOrigin };
