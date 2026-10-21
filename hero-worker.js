/* paruto.com — the hero's 3D runs here, on an OffscreenCanvas handed over by hero-gl.js, so building the scene,
   compiling shaders and drawing frames never block the page. Messages in: init, look, layout, frame.
   Messages out: mark (timing), software / failed (keep the SVG), none (no WebGL2 in workers here: draw on the page),
   ready, drawn, lost. */
import { openGL } from './hero-probe.js';

let hero = null, theme = 'dark', box = null;

self.onmessage = async ({ data: m }) => {
  if (m.type === 'init') {
    const got = openGL(m.canvas);
    if (got === 'software' || got === 'none') { postMessage({ type: got }); return; }
    m.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); postMessage({ type: 'lost' }); });
    theme = m.theme; box = m.layout;
    try {
      const { createScene } = await import('./hero-scene.js');
      const s = await createScene({ canvas: m.canvas, context: got.gl, small: m.small, reduce: m.reduce,
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
  if (m.type === 'frame' && hero) { hero.frame(m.state); postMessage({ type: 'drawn' }); }
};
