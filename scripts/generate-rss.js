const fs = require('fs');
const path = require('path');
const RSS = require('rss');

const SITE = process.env.SITE || 'https://amitkyadav.com';
const DIST = path.join(process.cwd(), 'dist');

const feed = new RSS({ title: 'amitkyadav.com', feed_url: SITE + '/rss.xml', site_url: SITE });

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

walk(DIST).forEach(f => {
  const rel = path.relative(DIST, f).replace(/\\/g, '/');
  if(rel.endsWith('.html') && rel !== 'index.html') {
    const url = SITE + '/' + rel.replace(/index.html$/, '');
    feed.item({ title: url, url });
  }
});

fs.writeFileSync(path.join(DIST, 'rss.xml'), feed.xml({ indent: true }));
console.log('rss.xml generated');
