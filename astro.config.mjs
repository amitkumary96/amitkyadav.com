import { defineConfig } from 'astro/config';

const site = 'https://amitkyadav.com';
const isProduction = process.env.NODE_ENV === 'production';
const integrations = [];

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
});
