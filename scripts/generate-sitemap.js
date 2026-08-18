const fs = require('fs');
const path = require('path');
const { indexablePages } = require('./lib/pages');

const DIST = path.join(process.cwd(), 'dist');

const pages = indexablePages(DIST);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(({ url }) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
].join('\n');

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
console.log(`sitemap.xml generated (${pages.length} urls)`);
