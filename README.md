# Paruto — paruto.com

The group landing page for Paruto: Media, Music, Capital and Technology. Static site with no framework and no build step.

```
index.html     the page (all copy lives here)
DESIGN.md      how Apple HIG guidance is applied
404.html       branded not-found page (GitHub Pages serves it for any missing path; absolute URLs only)
robots.txt, sitemap.xml   search engine basics; update sitemap lastmod when content changes
styles.css     design tokens at the top, then sections in page order
app.js         progressive enhancement: nav, scroll effects, reveals, product rail
hero-gl.js     the 3D Paruto mark (three.js) and the scroll flight through it; SVG fallback if unavailable
vendor/three/  three.js r186 + two addons, vendored (MIT, see vendor/three/LICENSE); mapped by the importmap in index.html
assets/logos/  copied from paruto-brand (gold/white lockups and the symbol)
assets/icons/  favicons, app icons, og-image (copied from paruto-brand)
assets/products/  product screenshots (copied from paruto-apps)
```

## Preview locally
```bash
python3 -m http.server 8095   # open http://localhost:8095
```

## Deploying
Any static host works: publish the repo root with no build command. `CNAME` (paruto.com) and `.nojekyll` are already in place for GitHub Pages, the same setup as brand.paruto.com.
