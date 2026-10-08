# paruto.com landing page

Static single page. See README.md for layout, preview and deploy.

- Brand rules come from ~/Projects/paruto-brand (brand.paruto.com): gold `#C9952A` on black, Barlow / Barlow Condensed / Cormorant Garamond. Dark is the default; light is opt-in via the nav toggle or the footer Auto/Light/Dark control, and is set before first paint by the inline script in `index.html`. Headlines are Barlow Condensed uppercase; the emphasis phrase is an `<em>`, which renders in italic gold serif.
- Light mode follows the brand's light-section rule: black logos on off-white (never the gold logo on light). Every logo `<img>` is a pair, `.only-dark` (gold or white) and `.only-light` (black). Inline symbol paths use `class="pd"` so their fill follows `--mark-fill`. Media surfaces (product cards) carry `.on-dark` to stay dark in both themes. New colours go in both token blocks at the top of `styles.css`.
- Logos in `assets/logos/` are copies of the brand build output. Never hand-edit them; regenerate them in paruto-brand and copy them over.
- Product cards mirror ~/Projects/paruto-apps/apps.json (name, tagline, status, links). Update both when a product ships.
- Brand facts: tagline "Think Possibilities"; Paruto Media ("We Amplify Impact", parutomedia.com), Paruto Music (parutomusic.com), Paruto Capital (parutocapital.com); contact hello@paruto.com. Don't invent facts, stats or taglines. Ask instead.
- Apple's HIG is the design authority; see DESIGN.md for how each guideline maps to code. In short:
  - Liquid Glass (`.glass`, `.glass-clear`) goes only on controls, never on content.
  - Gold is the tint and means "interactive". Eyebrows and labels stay neutral.
  - Body text is 400 weight, never light.
  - Every target is at least 44px. Use the 8-pt `--s*` spacing and concentric radii.
  - Keep Reduce Motion, Reduce Transparency and Increase Contrast working.
  - Mark new ambient animations with `data-ambient` so they pause off-screen.
- Don't push or deploy without being asked.
- Hero: `hero-gl.js` renders the mark in 3D (gold in dark mode, black lacquer in light mode, per the brand's "no gold logo on light" rule). Scroll progress `p` runs from 0 at the top to 1 when the pinned hero releases. Both `app.js` (copy fade via `--p`) and `hero-gl.js` (camera flight) use that same measure, so retime them together. The flight targets the origin, which is the P's counter. If the 3D render fails, the SVG in `.hero__stage` stays as the fallback.
- Companies: the same `.bento > .tile` markup renders as pinned scroll chapters when `app.js` adds `.chapters-on` (≥1001px and motion allowed), and as the bento grid otherwise. Each tile needs a `data-name` for the chapter index. Style chapter mode only under `.chapters-on`.
