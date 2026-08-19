import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const PRODUCTION_ORIGIN = 'https://amitkyadav.com';

/**
 * Strips /admin from a production bundle.
 *
 * The CMS is a staging-only tool: one place to write, and no ambiguity about
 * which branch a page is editing. Doing this in the build rather than as a step
 * in the deploy workflow means a local `npm run build` produces the same output
 * CI does — otherwise a manual zip-and-upload would quietly ship the editor.
 */
function excludeAdminFromProduction(origin) {
  return {
    name: 'exclude-admin-from-production',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (origin !== PRODUCTION_ORIGIN) return;
        await rm(fileURLToPath(new URL('admin/', dir)), {
          recursive: true,
          force: true,
        });
        logger.info('Removed /admin — the editor ships to staging only.');
      },
    },
  };
}

/**
 * The canonical origin. Overridable so a staging build advertises its own URLs
 * instead of production's — previously this was hardcoded, which meant every
 * staging page emitted canonical and social tags pointing at the live site.
 */
const site = process.env.SITE_URL ?? 'https://amitkyadav.com';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * MDX loads in every environment because it compiles content at build time.
 * React and Keystatic load only in development — Keystatic's admin needs server
 * routes that static hosting cannot serve, so shipping it to production would
 * be dead weight.
 */
const integrations = [mdx(), excludeAdminFromProduction(site)];

/**
 * The sitemap is generated only for the production origin.
 *
 * Staging marks every page noindex, so publishing a sitemap of it would be
 * inviting crawlers to the copy we are trying to keep out of search. Skipping
 * the integration entirely is clearer than emitting a file and filtering all of
 * it away.
 */
if (site === PRODUCTION_ORIGIN) {
  integrations.push(
    sitemap({
      // /admin never reaches production, and the 404 is not a destination.
      filter: (page) => !page.includes('/admin'),
      changefreq: 'weekly',
      // No lastmod: it would be new Date() on every run, which would make the
      // build non-deterministic and send the FTP sync re-uploading a file whose
      // meaning had not changed. Crawlers largely ignore it anyway.
    }),
  );
}

if (!isProduction) {
  const [{ default: react }, { default: keystatic }] = await Promise.all([
    import('@astrojs/react'),
    import('@keystatic/astro'),
  ]);

  integrations.push(react(), keystatic());
}

export default defineConfig({
  site,
  integrations,
  output: isProduction ? 'static' : 'server',
  redirects: {
    // The first poem was filed under a scaffolded filename whose date prefix did
    // not even match its own date. Renamed to a real slug, with the old URL kept
    // alive because it is already in the production sitemap.
    '/poet/2025-01-15-sample-poem': '/poet/jo-soya-nahi',
  },
  markdown: {
    shikiConfig: {
      // A single dark theme in both colour modes. Code is the one place where a
      // consistently dark block reads as deliberate rather than inconsistent,
      // and it avoids Shiki's dual-theme CSS variable plumbing entirely.
      theme: 'vitesse-dark',
      wrap: false,
    },
  },
});
