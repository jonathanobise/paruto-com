# paruto.com landing page

Static single page. See README.md for layout, preview and deploy.

- Brand rules come from ~/Projects/paruto-brand (brand.paruto.com): gold `#C9952A` on black, Barlow / Barlow Condensed / Cormorant Garamond, dark-only. Headlines are Barlow Condensed uppercase; the emphasis phrase is an `<em>`, which renders in italic gold serif.
- Logos in `assets/logos/` are copies of the brand build output. Never hand-edit them; regenerate them in paruto-brand and copy them over.
- Product cards mirror ~/Projects/paruto-apps/apps.json (name, tagline, status, links). Update both when a product ships.
- Brand facts: tagline "Think Possibilities"; Paruto Media ("We Amplify Impact", parutomedia.com), Paruto Music (parutomusic.com), Paruto Capital (parutocapital.com); contact hello@paruto.com. Don't invent facts, stats or taglines. Ask instead.
- Motion must respect `prefers-reduced-motion` (already handled in styles.css). Glass material goes only on controls (nav, buttons), never on content.
- Don't push or deploy without being asked.
