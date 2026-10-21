/* paruto.com — the Paruto mark in 3D, and the scroll flight through it.
   Progressive: if modules, WebGL or the vendor files are unavailable, the SVG mark in .hero__stage stays.
   The scene (hero-scene.js) runs in a worker on its own OffscreenCanvas (hero-worker.js), so building it, compiling
   its shaders and drawing every frame happen off the page's main thread and never block a tap or a scroll; each
   finished frame arrives as an ImageBitmap and is shown on the page's canvas. Browsers that can't draw WebGL in a
   worker draw it here instead. This file reads the page (scroll, layout, pointer, appearance),
   sends that to the scene, and owns the page effects: the flash, the canvas fade and `gl-ready`. */
// Nothing is imported up front: the worker, hero-probe.js and three.js (via hero-scene.js) only load once the page is
// idle, and three.js only on hardware graphics, so none of it competes with the first paint.

const root = document.documentElement;
const hero = document.querySelector('.hero');
const sticky = document.querySelector('.hero__sticky');
const stage = document.querySelector('.hero__stage');
const canvas = document.querySelector('.hero__gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;   // very low-end phones keep the SVG mark
const small = innerWidth < 700;

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
const mark = name => performance.mark('3d:' + name);
const drawn = () => root.classList.add('gl-ready');

// Where the mark sits: the start pose fills .hero__stage; the flight pulls it to the centre of the pinned hero.
const measure = () => {
  const r = sticky.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const W = Math.max(1, r.width), H = Math.max(1, r.height);
  return { W, H, dpr: Math.min(devicePixelRatio || 1, W < 700 ? 1.75 : 2),
    slotX: s.left - r.left + s.width / 2, slotY: s.top - r.top + s.height / 2, slotH: Math.min(s.width, s.height) * .8 };
};

// Build the scene once the page has painted and the browser is idle, so the 3D set-up never delays the text.
if (canvas && stage && !saveData && !lowMemory) {
  const start = () => (window.Worker && window.OffscreenCanvas && 'transferToImageBitmap' in OffscreenCanvas.prototype ? inWorker() : onPage());
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 200));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
}

function inWorker() {
  let w, fellBack = false;
  const fallBack = () => { if (fellBack) return; fellBack = true; w?.terminate(); onPage(); };
  try {
    w = new Worker(new URL('./hero-worker.js', import.meta.url), { type: 'module' });
    // Frames go one at a time: while the worker is drawing, only the newest state waits, so it never falls behind.
    // The page's canvas only takes a bitmap context once frames arrive, so a fallback can still draw WebGL on it.
    let busy = false, next = null, view = null;
    const port = {
      look: t => w.postMessage({ type: 'look', theme: t }),
      layout: b => w.postMessage({ type: 'layout', layout: b }),
      frame: s => { if (busy) { next = s; return; } busy = true; w.postMessage({ type: 'frame', state: s }); },
    };
    w.onmessage = ({ data: m }) => {
      if (m.type === 'mark') mark(m.name);
      else if (m.type === 'ready') run(port);
      else if (m.type === 'drawn') {
        (view ||= canvas.getContext('bitmaprenderer')).transferFromImageBitmap(m.frame);
        busy = false; drawn();
        if (next) { const s = next; next = null; port.frame(s); }
      }
      else if (m.type === 'lost') root.classList.remove('gl-ready');
      else if (m.type === 'none') fallBack();          // no WebGL2 in workers here
      else w.terminate();                              // software graphics or a failed build: keep the SVG
    };
    w.onerror = fallBack;                              // e.g. no module workers
    w.postMessage({ type: 'init', small, reduce, theme: theme(), layout: measure() });
  } catch (e) { fallBack(); }
}

async function onPage() {
  try {
    const { openGL } = await import('./hero-probe.js');
    const got = openGL(canvas);
    if (!got.gl) return;                               // keep the SVG
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); root.classList.remove('gl-ready'); });
    const { createScene } = await import('./hero-scene.js');
    const s = await createScene({ canvas, context: got.gl, small, reduce, step: mark });
    s.look(theme()); s.layout(measure());
    await s.compile();
    run({ look: s.look, layout: s.layout, frame: st => { s.frame(st); drawn(); } });
  } catch (e) { /* keep the SVG fallback */ }
}

// Drive the scene, wherever it runs, from the page.
function run(port) {
  const t0 = performance.now();
  let W = 1, H = 1;
  const layout = () => { const b = measure(); W = b.W; H = b.H; port.layout(b); request(); };

  // ---- input ----
  const target = { x: 0, y: 0 };
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    sticky.addEventListener('pointermove', e => {
      target.x = (e.clientX / W - .5) * .55;
      target.y = (e.clientY / H - .5) * .32;
    });
    sticky.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  }
  // hero progress: 0 at the top, 1 when the pinned hero releases (app.js uses the same measure for the copy fade)
  const progress = () => {
    const span = hero.offsetHeight - innerHeight;
    return span > 0 ? clamp01(scrollY / span) : 0;
  };

  // ---- frame ----
  const draw = now => {
    const p = reduce ? 0 : progress();
    // a bloom of light as the counter fills the screen; the canvas bows out once we're through
    const f = clamp01((p - .1) / .84);
    sticky.style.setProperty('--flash', (Math.exp(-Math.pow((f - .56) / .12, 2)) * .9).toFixed(3));
    canvas.style.opacity = (1 - smooth(.6, .76, f)).toFixed(3);
    port.frame({ ms: now - t0, p, target: { x: target.x, y: target.y } });
  };

  // ---- loop: only while the hero is on screen and the tab is visible; on demand under Reduce Motion ----
  let raf = 0, visible = true, pending = false;
  const loop = now => { raf = 0; draw(now); if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  function request() {
    if (reduce) { if (!pending) { pending = true; requestAnimationFrame(now => { pending = false; draw(now); }); } return; }
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; request(); }).observe(hero);
  document.addEventListener('visibilitychange', request);
  new MutationObserver(() => { port.look(theme()); request(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', layout);
  layout();
}
