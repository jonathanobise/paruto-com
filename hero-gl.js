/* paruto.com — the Paruto mark in 3D, and the scroll flight through it.
   Progressive: if modules, WebGL or the vendor files are unavailable, the SVG mark in .hero__stage stays.
   Dark appearance: polished gold. Light appearance: black lacquer with a gold rim light
   (the brand never puts the gold mark on a light background). */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const root = document.documentElement;
const hero = document.querySelector('.hero');
const sticky = document.querySelector('.hero__sticky');
const stage = document.querySelector('.hero__stage');
const canvas = document.querySelector('.hero__gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;

// Same geometry as the brand symbol (365 × 347 units): one continuous band, P inside D.
const PD = 'M75 259V77.5H190.5A96 96 0 0 1 190.5 269.5H168.5L91 347H0V0H190.5A173.5 173.5 0 0 1 190.5 347H147L184 310H190.5A136.5 136.5 0 0 0 190.5 37H37V310H79L153.5 235.5H190.5A62 62 0 0 0 190.5 111.5H111V223Z';

const LOOKS = {
  dark:  { color: 0xE6B24E, metalness: 1, roughness: .14, clearcoat: .4, clearcoatRoughness: .12, env: 1.5, key: 2.6, rim: 3.2, rimColor: 0xF5D68A, exposure: 1.05 },
  light: { color: 0x0E0E0E, metalness: .35, roughness: .14, clearcoat: 1, clearcoatRoughness: .04, env: 1, key: 1.6, rim: 6, rimColor: 0xE0A63A, exposure: 1 },
};

const clamp01 = v => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - t, 4);

if (canvas && stage && !saveData) {
  try { init(); } catch (e) { /* keep the SVG fallback */ }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentRotation.set(.45, Math.PI * .8, 0);   // put the studio's bright panels where the face can see them
  pmrem.dispose();

  // Extrude the symbol with a deep, soft bevel so edges catch the light.
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${PD}"/></svg>`);
  const shapes = svg.paths.flatMap(p => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 44, bevelEnabled: true, bevelThickness: 9, bevelSize: 4.5, bevelSegments: 12, curveSegments: 72 });
  geo.center();                                   // the P's counter sits almost exactly on the origin
  const mat = new THREE.MeshPhysicalMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI;                      // SVG is y-down
  const mark = new THREE.Group();
  mark.add(mesh);
  scene.add(mark);

  const key = new THREE.DirectionalLight(0xfff1d6, 2.6);
  const rim = new THREE.DirectionalLight(0xF5D68A, 3.2);
  rim.position.set(650, -250, -450);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 8000);
  const TAN = Math.tan(THREE.MathUtils.degToRad(15));
  const MARK_H = 365;                             // world height incl. bevel

  const applyLook = () => {
    const l = LOOKS[root.dataset.theme === 'light' ? 'light' : 'dark'];
    mat.color.setHex(l.color);
    Object.assign(mat, { metalness: l.metalness, roughness: l.roughness, clearcoat: l.clearcoat, clearcoatRoughness: l.clearcoatRoughness, envMapIntensity: l.env });
    key.intensity = l.key;
    rim.intensity = l.rim;
    rim.color.setHex(l.rimColor);
    renderer.toneMappingExposure = l.exposure;
    request();
  };

  // ---- layout: start pose sits in .hero__stage; the flight pulls it to the centre of the screen ----
  let W = 1, H = 1, slotX = 0, slotY = 0, d0 = 1200;
  const layout = () => {
    const r = sticky.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, W < 700 ? 1.75 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    slotX = s.left - r.left + s.width / 2;
    slotY = s.top - r.top + s.height / 2;
    const slotH = Math.min(s.width, s.height) * .8;
    d0 = (MARK_H / 2) / TAN * (H / slotH);
    request();
  };

  // ---- input ----
  const target = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    sticky.addEventListener('pointermove', e => {
      target.x = (e.clientX / W - .5) * .55;
      target.y = (e.clientY / H - .5) * .32;
    });
    sticky.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  }
  const progress = () => {
    const span = hero.offsetHeight - innerHeight;
    return span > 0 ? clamp01(scrollY / span) : 0;
  };

  // ---- frame ----
  const t0 = performance.now();
  let first = true;
  const draw = now => {
    const t = (now - t0) / 1000;
    const p = reduce ? 0 : progress();
    const intro = reduce ? 1 : easeOut(clamp01((now - t0 - 150) / 1900));
    tilt.x += (target.x - tilt.x) * .05;
    tilt.y += (target.y - tilt.y) * .05;

    // pose: turned three-quarters at rest, swinging in on load, squaring up as the flight begins
    const settle = 1 - smooth(.04, .44, p);
    const idle = reduce ? 0 : Math.sin(t * .62);
    mark.rotation.y = ((-.48 - (1 - intro) * 2.6) + tilt.x + idle * .035) * settle;
    mark.rotation.x = (.12 + tilt.y) * settle;
    mark.rotation.z = -.07 * smooth(.25, .9, p);
    mark.position.y = idle * 5 * settle;
    mark.scale.setScalar(lerp(.86, 1, intro));
    key.position.set(lerp(-1100, -320, intro), 520, 720);   // the highlight glides across on load

    // flight: ease toward the face, then through the P's counter
    const f = clamp01((p - .1) / .84);
    camera.position.set(0, 0, 30 + (d0 - 30) * Math.pow(1 - f, 2.2));
    camera.lookAt(0, 0, -1000);
    const c = smooth(0, .36, p);
    camera.setViewOffset(W, H, (W / 2 - slotX) * (1 - c), (H / 2 - slotY) * (1 - c), W, H);
    camera.updateProjectionMatrix();

    // a bloom of light as the counter fills the screen; the canvas bows out once we're through
    sticky.style.setProperty('--flash', (Math.exp(-Math.pow((f - .56) / .12, 2)) * .9).toFixed(3));
    canvas.style.opacity = (1 - smooth(.6, .76, f)).toFixed(3);

    renderer.render(scene, camera);
    if (first) { first = false; root.classList.add('gl-ready'); }
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
  new MutationObserver(applyLook).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', layout);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); root.classList.remove('gl-ready'); });

  applyLook();
  layout();
}
