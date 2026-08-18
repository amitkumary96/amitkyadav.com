import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

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
const integrations = [mdx()];

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
