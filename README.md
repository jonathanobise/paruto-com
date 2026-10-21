# Paruto — paruto.com

The group landing page for Paruto: Media, Music, Capital and Technology. Static site with no framework and no build step.

```
index.html     the page (all copy lives here)
DESIGN.md      how Apple HIG guidance is applied
scripts/sync-products.mjs  builds the products showcase from ../paruto-apps/apps.json (run after the catalogue changes)
scripts/serve.mjs  local preview server
404.html       branded not-found page (served for any missing path; absolute URLs only)
robots.txt, sitemap.xml   search engine basics; update sitemap lastmod when content changes
privacy.html   privacy notice (linked in the footer); update it whenever the site starts collecting or loading anything new
ROLLBACK.md    how to undo a bad deploy
wrangler.jsonc, worker.js  the Cloudflare Worker that serves the site (www → apex redirect, then the files)
_headers       security and cache headers
.assetsignore  repo and tooling files that are never published
assets/fonts/  self-hosted brand fonts (Latin woff2, SIL OFL licences included)
assets/og/     1200×630 share image, rendered from the hero
styles.css     design tokens at the top, then sections in page order
app.js         progressive enhancement: nav, scroll effects, reveals, product rail
hero-gl.js     the 3D Paruto mark's page side: scroll flight, layout, pointer, theme; SVG fallback if unavailable
hero-scene.js  the 3D scene itself (three.js), with no DOM, so it can run in hero-worker.js on an OffscreenCanvas
hero-worker.js runs hero-scene.js off the main thread
hero-probe.js  opens the WebGL2 context on hardware graphics only
vendor/three/  three.js r186 + two addons, vendored (MIT, see vendor/three/LICENSE); bundled into hero-three.min.js by scripts/build-hero-three.mjs
assets/logos/  copied from paruto-brand (gold/white lockups and the symbol)
assets/icons/  favicons, app icons, og-image (copied from paruto-brand)
assets/products/  product screenshots (copied from paruto-apps)
```

## Preview locally
```bash
node scripts/serve.mjs   # open http://localhost:8095 (clean URLs and the 404 page, like the Worker)
```

## Deploying
Served by Cloudflare: the Worker `paruto-com`, with paruto.com and www.paruto.com as custom domains, also at
https://paruto-com.paruto.workers.dev. Pushing doesn't deploy; see `CLAUDE.md`, "Deploying", for the command and
`ROLLBACK.md` for undoing one.
