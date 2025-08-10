# amitkyadav.com - Astro Production-ready Scaffold

Stack: Astro + Tailwind CSS + React components (client islands)

## Quick start (local)

1. Install dependencies:
```bash
npm install
```

2. Run dev server:
```bash
npm run dev
```

3. Open the URL shown in the terminal (usually http://localhost:3000).

## Build (production)
```bash
npm run build
```
This generates the static site in `dist/`. The build script also runs sitemap and RSS generation.

## Deploy
- Manual: Zip `dist/` and upload to Hostinger `public_html`.
- GitHub: push repo and use GitHub Pages or Hostinger Git deployment.

## Notes
- Content is Markdown files placed in `src/content/poet/`, `src/content/engineer/`, `src/content/life/`.
- For translation, the site uses LibreTranslate public instance by default. See `src/utils/translate.js`.
- Netlify CMS is included as an optional `admin` folder and config; enabling requires a Git-based host or Netlify.


## Translation

The site uses LibreTranslate (https://libretranslate.de) by default via client-side calls in `src/utils/translate.js`. For production, consider using a self-hosted instance or swapping to Google Translate API and updating the adapter.
