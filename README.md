# Paruto — paruto.com

The group landing page for Paruto: Media, Music, Capital and Technology. Static site with no framework and no build step.

```
index.html     the page (all copy lives here)
styles.css     design tokens at the top, then sections in page order
app.js         progressive enhancement: nav, scroll effects, reveals, product rail
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
