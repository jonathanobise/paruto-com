#!/usr/bin/env node
// Sync paruto.com's product showcase from the apps catalogue (paruto-apps/apps.json).
//
//   node scripts/sync-products.mjs [path/to/paruto-apps]     (default: ../paruto-apps)
//
// Rewrites the blocks between <!-- sync:NAME --> and <!-- /sync:NAME --> markers in index.html
// (now-live chip, at-a-glance numbers, featured product, product grid, in-the-works list) and copies
// each app's small WebP screenshot into assets/products/apps/. Copy only what the catalogue says:
// names, taglines, categories, statuses and links come straight from apps.json, never invented here.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appsRoot = process.argv[2] || join(root, "..", "paruto-apps");
const data = JSON.parse(readFileSync(join(appsRoot, "apps.json"), "utf8"));
const OUT = join(root, "assets", "products", "apps");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>';
const STATUS = { live: "Live", beta: "Beta", "in-development": "In development", "coming-soon": "Coming soon" };
const GAMES = new Set(["Games"]);
const verb = (a) => (GAMES.has(a.category) || /game/i.test(a.tagline || "") ? "Play" : "Open");

// --- images: the catalogue's small WebP copy of the cover (or first screenshot) -------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const wallOf = (src) => src.replace(/^assets\/apps\//, "assets/wall/").replace(/\.[a-z0-9]+$/i, ".webp");
function image(a, { large = false } = {}) {
  const media = (a.media || []).filter((m) => m.type === "image");
  const src = a.cover || media[0]?.src;
  if (!src) return null;
  const phone = !a.cover || media.find((m) => m.src === src)?.device === "phone";
  const pick = large && existsSync(join(appsRoot, src)) ? src : existsSync(join(appsRoot, wallOf(src))) ? wallOf(src) : src;
  if (!existsSync(join(appsRoot, pick))) return null;
  const name = `${a.id}${large ? "-large" : ""}${extname(pick)}`;
  copyFileSync(join(appsRoot, pick), join(OUT, name));
  const caption = media.find((m) => m.src === src)?.caption || a.name;
  return { src: `assets/products/apps/${name}`, phone, caption };
}

// --- selection -------------------------------------------------------------------------------------
const apps = data.apps.filter((a) => a && a.id && a.name);
const byNewest = (x, y) => String(y.added || "").localeCompare(String(x.added || ""));
const live = apps.filter((a) => a.status === "live" && a.url).sort(byNewest);
const works = apps.filter((a) => a.status !== "live").sort((x, y) =>
  ["beta", "in-development", "coming-soon"].indexOf(x.status) - ["beta", "in-development", "coming-soon"].indexOf(y.status) || byNewest(x, y));
const featured = live[0];
const grid = live.slice(1);
const companies = 4; // Media, Music, Capital, Kids (Technology is the products themselves)

const meta = (a) => [a.category, (a.platforms || []).join(" & ")].filter(Boolean).map(esc).join(" · ");
// accessible names start with the visible text (voice control users say what they see)
const NEWTAB = '<span class="sr"> (opens in a new tab)</span>';
const label = (a) => `${verb(a)} now: ${a.name} (opens in a new tab)`;
const tone = (a) => `--a:${esc(a.accent || "#C9952A")};--b:${esc(a.accent2 || a.accent || "#7E5A10")}`;

function featuredHTML(a) {
  const img = image(a, { large: true });
  return `<article class="feature on-dark" style="${tone(a)}">
      ${img ? `<img class="feature__img" src="${img.src}" alt="${esc(a.name)}: ${esc(img.caption)}" loading="lazy" decoding="async" width="1600" height="1000">` : ""}
      <div class="feature__shade"></div>
      <div class="feature__body">
        <p class="feature__new"><span class="badge badge--live">Live</span><span>Newest release</span></p>
        <h3 class="feature__title">${esc(a.name)}</h3>
        <p class="feature__line">${esc(a.tagline)}</p>
        <p class="feature__meta">${meta(a)}</p>
        <a class="btn btn--tint" href="${esc(a.url)}" target="_blank" rel="noopener" aria-label="${esc(label(a))}">${verb(a)} now ${ARROW}</a>
      </div>
    </article>`;
}
function cardHTML(a) {
  const img = image(a);
  const art = img
    ? img.phone
      ? `<div class="pcard__art pcard__art--phone"><img src="${img.src}" alt="${esc(a.name)}: ${esc(img.caption)}" loading="lazy" decoding="async" width="400" height="866"></div>`
      : `<div class="pcard__art"><img src="${img.src}" alt="${esc(a.name)}: ${esc(img.caption)}" loading="lazy" decoding="async" width="640" height="400"></div>`
    : `<div class="pcard__art pcard__art--mono" aria-hidden="true"><span>${esc(a.name[0])}</span></div>`;
  return `<li class="pcard" style="${tone(a)}" data-category="${esc(a.category || "")}">
        <a class="pcard__link" href="${esc(a.url)}" target="_blank" rel="noopener">
          ${art}
          <span class="pcard__body">
            <span class="pcard__meta"><span class="badge badge--live">${STATUS[a.status] || esc(a.status)}</span><span>${esc(a.category || "")}</span></span>
            <span class="pcard__name">${esc(a.name)}</span>
            <span class="pcard__line">${esc(a.tagline)}</span>
            <span class="pcard__go">${verb(a)} ${ARROW}${NEWTAB}</span>
          </span>
        </a>
      </li>`;
}
function workHTML(a) {
  const st = STATUS[a.status] || a.status;
  const go = a.url && a.status === "beta" ? `<a class="link" href="${esc(a.url)}" target="_blank" rel="noopener" aria-label="Try the beta: ${esc(a.name)} (opens in a new tab)">Try the beta ${ARROW}</a>` : "";
  return `<li class="work" style="${tone(a)}">
        <span class="work__mono" aria-hidden="true">${esc(a.name[0])}</span>
        <span class="work__main"><span class="work__name">${esc(a.name)}</span><span class="work__line">${esc(a.tagline)}</span></span>
        <span class="work__side"><span class="badge">${esc(st)}</span><span class="work__cat">${esc(a.category || "")}</span>${go}</span>
      </li>`;
}
const nowLive = featured
  ? `<a class="nowlive glass" href="${esc(featured.url)}" target="_blank" rel="noopener"><span class="nowlive__dot" aria-hidden="true"></span><span class="nowlive__tag">New</span><span class="nowlive__name">${esc(featured.name)}</span><span class="nowlive__go">${verb(featured)} now ${ARROW}</span>${NEWTAB}</a>`
  : "";
const glance = `<dl class="glance__stats">
      <div class="stat"><dt>Companies</dt><dd>${companies}</dd></div>
      <div class="stat"><dt>Products live</dt><dd>${live.length}</dd></div>
      <div class="stat"><dt>In the works</dt><dd>${works.length}</dd></div>
    </dl>`;
const lede = `${apps.length} products designed and built by Paruto. ${live.length} are live today, and you can try every one of them in your browser.`;

const blocks = {
  "now-live": nowLive,
  glance,
  "products-lede": `<p class="lede">${esc(lede)}</p>`,
  featured: featured ? featuredHTML(featured) : "",
  grid: `<ul class="pgrid">\n      ${grid.map(cardHTML).join("\n      ")}\n    </ul>`,
  works: works.length ? `<ul class="works">\n      ${works.map(workHTML).join("\n      ")}\n    </ul>` : "",
};

let html = readFileSync(join(root, "index.html"), "utf8");
for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- sync:${name} -->)[\\s\\S]*?(<!-- /sync:${name} -->)`);
  if (!re.test(html)) { console.error(`✗ marker sync:${name} not found in index.html`); process.exit(1); }
  html = html.replace(re, `$1\n    ${body}\n    $2`);
}
writeFileSync(join(root, "index.html"), html);
console.log(`✓ ${apps.length} products · ${live.length} live (featured: ${featured?.name}) · ${works.length} in the works · ${readdirSync(OUT).length} images copied`);
