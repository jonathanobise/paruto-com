# paruto.com landing page

Static single page. See README.md for layout and preview, ROLLBACK.md for undoing a deploy.

## Deploying
Live at **https://paruto.com**, served by **Cloudflare**: the Worker `paruto-com` (config in `wrangler.jsonc`; `worker.js` only sends www.* to the apex), also at https://paruto-com.paruto.workers.dev (kept on). paruto.com and www.paruto.com are the Worker's custom domains, so Cloudflare manages their DNS records and certificates; the zone's MX and TXT records (Zoho mail) are separate and must stay. Everything in the folder is published except what `.assetsignore` lists, so add new repo or tooling files there. `_headers` sets the security and cache headers.
- **Pushing doesn't deploy.** Deploy only committed code, from a clean checkout of `main`, because uncommitted work in this folder would otherwise go live:
  `W=/tmp/paruto-com-deploy && git worktree add -q --detach $W main && (cd $W && npx -y wrangler@4.141.0 deploy) ; git worktree remove --force $W`
  Check it with `curl -sI https://paruto.com/ | grep -i server` (`cloudflare`). Don't deploy or push without being asked.
- GitHub Pages still builds `main` as a standby (`CNAME`, `.nojekyll`) until the user says to switch it off; ROLLBACK.md has the fallback steps. Once it's off, delete those two files and that ROLLBACK.md section.
- Use `/usr/bin/git` (`/usr/local/bin/git` won't run on this Mac); `gh` is at `/opt/homebrew/bin/gh`.
- Cloudflare is managed with wrangler here (the project has a `wrangler.jsonc`); DNS records with the `cf` CLI (`cf dns records delete` needs `--force` when run non-interactively, or it aborts while still exiting 0).

## Rules

- Brand rules come from ~/Projects/paruto-brand (brand.paruto.com): gold `#C9952A` on black, Barlow / Barlow Condensed / Cormorant Garamond. Dark is the default; light is opt-in via the nav toggle or the footer Auto/Light/Dark control, and is set before first paint by the inline script in `index.html`. Headlines are Barlow Condensed uppercase; the emphasis phrase is an `<em>`, which renders in italic gold serif.
- Dark mode has three depths, Graphite, Midnight (default) and OLED, set as `data-depth` before first paint (pre-paint script in `index.html`, `404.html` and `privacy.html`; footer Depth control). Depth overrides live in the `[data-depth]` blocks in `styles.css`; new dark surfaces must read the `--bg*` tokens so every depth works.
- Press feedback is app-wide from one listener in `app.js` (the `PRESSABLE` selector): a ripple from the touch point plus each control's own `:active` dip. Add new control classes there, not per button.
- Light mode follows the brand's light-section rule: black logos on off-white (never the gold logo on light). Every logo `<img>` is a pair, `.only-dark` (gold or white) and `.only-light` (black). Inline symbol paths use `class="pd"` so their fill follows `--mark-fill`. Media surfaces (product cards) carry `.on-dark` to stay dark in both themes. New colours go in both token blocks at the top of `styles.css`.
- Logos in `assets/logos/` are copies of the brand build output. Never hand-edit them; regenerate them in paruto-brand and copy them over.
- Products are generated from ~/Projects/paruto-apps/apps.json by `node scripts/sync-products.mjs`. It writes the New chip, at-a-glance numbers, featured release, live grid and In the works list between `<!-- sync:NAME -->` markers in `index.html`, and copies screenshots into `assets/products/apps/`. Never hand-edit inside those markers. When apps.json changes (an app ships, a status changes), re-run the script, check the page, then deploy.
- Brand facts: tagline "Think Possibilities"; Paruto Media ("We Amplify Impact", parutomedia.com), Paruto Music (parutomusic.com; recording studio and record label, "We Redefine Music" from its #WeRedefineMusic), Paruto Capital (parutocapital.com; trading education, "We teach mastery, not hype" from its own site — never add performance or profit claims), Paruto Kids (parutokids.com; Christian songs, stories and play for ages 2–5 with Jas, Jay and Baby Joe, "Where little minds learn, sing and grow" from its own site; standard lockup from paruto-brand); contact hello@paruto.com. Don't invent facts, stats or taglines. Ask instead.
- Apple's HIG is the design authority; see DESIGN.md for how each guideline maps to code. In short:
  - Liquid Glass (`.glass`, `.glass-clear`) goes only on controls, never on content.
  - Gold is the tint and means "interactive". Eyebrows and labels stay neutral.
  - Body text is 400 weight, never light.
  - Every target is at least 44px. Use the 8-pt `--s*` spacing and concentric radii.
  - Keep Reduce Motion, Reduce Transparency and Increase Contrast working.
  - Mark new ambient animations with `data-ambient` so they pause off-screen.
- Don't push or deploy without being asked.
- Hero: `hero-gl.js` renders the mark in 3D (gold in dark mode, black lacquer in light mode, per the brand's "no gold logo on light" rule). Scroll progress `p` runs from 0 at the top to 1 when the pinned hero releases. Both `app.js` (copy fade via `--p`) and `hero-gl.js` (camera flight) use that same measure, so retime them together. The flight targets the origin, which is the P's counter. If the 3D render fails, the SVG in `.hero__stage` stays as the fallback. The 3D only runs on hardware graphics: a worker tests for a hardware WebGL context first, and software renderers keep the SVG. three.js comes from one tree-shaken bundle, `vendor/three/hero-three.min.js`. If you use a new `THREE.*` class in `hero-gl.js`, add it to `scripts/hero-three-entry.js` and run `node scripts/build-hero-three.mjs`. `3d:*` performance marks time each set-up step.
- Companies: the same `.bento > .tile` markup renders as pinned scroll chapters when `app.js` adds `.chapters-on` (≥1001px and motion allowed), and as the bento grid otherwise. Each tile needs a `data-name` for the chapter index. Style chapter mode only under `.chapters-on`. Chapters need a window at least 1001×700; below that, or if any tile's copy is taller than its card (checked in `app.js` after fonts load and on resize), the grid is used instead. After changing tile copy, check every chapter fits at 1024×700, 1366×768 and 1920×1080.
- Performance budget (mobile Lighthouse ≥ 90, LCP < 2.5 s): fonts are self-hosted in `assets/fonts` (no Google Fonts). `hero-gl.js` must keep importing three.js dynamically after `load` + idle, never at the top level. The hero lede and buttons paint without an entrance animation because the lede is the LCP element.
- Privacy: the only third-party request is the Cloudflare Web Analytics beacon (cookieless; token in `index.html`, `404.html`, `privacy.html`). Adding any other third-party script, font, embed or form means updating `privacy.html` first.
- Social: @parutogroup on Instagram, X, YouTube, TikTok, Threads and Facebook, plus LinkedIn at `linkedin.com/company/paruto` (footer + JSON-LD `sameAs`).
- Roadmap: https://claude.ai/artifact/QF9Bz5iiLjYugjkBfTWvqk is the source of truth for what's built and what's left. Items live in its database collection `items` (fields: title, summary, status `waiting|in_progress|next|planned|shipped|dropped`, area, priority P1–P3, owner, shippedOn, commit, notes, link, order, history). Keep it current with the ArtifactData tool:
  - Set an item to `in_progress` when starting it.
  - When it ships, set `shipped`, `shippedOn` and `commit`, and append to `history`.
  - Add new requests as new items.
