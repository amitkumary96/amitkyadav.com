const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE || 'https://amitkyadav.com';
const DIST = path.join(process.cwd(), 'dist');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(name => {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if(stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if(name.endsWith('.html')) results.push(file);
    }
  });
  return results;
}

const pages = walk(DIST).map(f => {
  const rel = path.relative(DIST, f).replace(/\\/g, '/');
  const url = SITE + '/' + rel.replace(/index.html$/, '');
  return url;
});

const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  .concat(pages.map(u => `  <url><loc>${u}</loc></url>`))
  .concat(['</urlset>']).join('\n');

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
console.log('sitemap.xml generated');
