import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

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
