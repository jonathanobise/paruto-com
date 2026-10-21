/* paruto.com — the hero's 3D runs here, so building the scene, compiling shaders and drawing frames never block the
   page. It draws on its own OffscreenCanvas and hands each finished frame to hero-gl.js as an ImageBitmap (a GPU
   hand-off, no copy). The page's canvas is never transferred here: a transferred canvas makes the page's frames wait
   for the worker's first one, which held back the first paint by up to a second.
   Messages in: init, look, layout, frame. Messages out: mark (timing), software / failed (keep the SVG),
   none (no WebGL2 in workers here: draw on the page), ready, drawn (with the frame), lost. */
import { openGL } from './hero-probe.js';

let hero = null, theme = 'dark', box = null, canvas = null;

self.onmessage = async ({ data: m }) => {
  if (m.type === 'init') {
    canvas = new OffscreenCanvas(1, 1);
    const got = openGL(canvas);
    if (got === 'software' || got === 'none') { postMessage({ type: got }); return; }
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); postMessage({ type: 'lost' }); });
    theme = m.theme; box = m.layout;
    try {
      const { createScene } = await import('./hero-scene.js');
      const s = await createScene({ canvas, context: got.gl, small: m.small, reduce: m.reduce,
        step: name => postMessage({ type: 'mark', name }) });
      s.look(theme); s.layout(box);       // the latest values, including any that arrived while building
      hero = s;                           // later look/layout messages now apply directly; frames wait for 'ready'
      await s.compile();
      postMessage({ type: 'ready' });
    } catch (e) { postMessage({ type: 'failed' }); }   // keep the SVG
    return;
  }
  if (m.type === 'look') { theme = m.theme; hero?.look(theme); return; }
  if (m.type === 'layout') { box = m.layout; hero?.layout(box); return; }
  if (m.type === 'frame' && hero) {
    hero.frame(m.state);
    const frame = canvas.transferToImageBitmap();
    postMessage({ type: 'drawn', frame }, [frame]);
  }
};
