/* paruto.com — the 3D Paruto mark: scene, looks and the per-frame pose. No DOM here, so the same code runs in the
   hero worker on an OffscreenCanvas (hero-worker.js) or, where workers can't draw WebGL, on the page. hero-gl.js
   drives it with layout, appearance and frame state (scroll progress, pointer).
   Dark appearance: polished gold. Light appearance: black lacquer with a gold rim light
   (the brand never puts the gold mark on a light background). */
// One tree-shaken bundle of just the three.js classes the hero uses (scripts/build-hero-three.mjs).
import * as THREE from './vendor/three/hero-three.min.js';

const clamp01 = v => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - t, 4);

// The brand symbol (365 × 347 units), built directly rather than parsed from SVG: straight runs plus four
// half-circles, all centred on (190.5, 173.5). Same path as #pd in index.html:
// M75 259V77.5H190.5A96 96 0 0 1 190.5 269.5H168.5L91 347H0V0H190.5A173.5 173.5 0 0 1 190.5 347H147L184 310
// H190.5A136.5 136.5 0 0 0 190.5 37H37V310H79L153.5 235.5H190.5A62 62 0 0 0 190.5 111.5H111V223Z
function symbolShape() {
  const CX = 190.5, CY = 173.5, UP = -Math.PI / 2, DOWN = Math.PI / 2;  // y-down, as in the SVG
  const s = new THREE.Shape();
  s.moveTo(75, 259); s.lineTo(75, 77.5); s.lineTo(CX, 77.5);
  s.absarc(CX, CY, 96, UP, DOWN, false);                 // P bowl, outer edge
  s.lineTo(168.5, 269.5); s.lineTo(91, 347); s.lineTo(0, 347); s.lineTo(0, 0); s.lineTo(CX, 0);
  s.absarc(CX, CY, 173.5, UP, DOWN, false);              // D, outer edge
  s.lineTo(147, 347); s.lineTo(184, 310); s.lineTo(CX, 310);
  s.absarc(CX, CY, 136.5, DOWN, UP, true);               // D, inner edge
  s.lineTo(37, 37); s.lineTo(37, 310); s.lineTo(79, 310); s.lineTo(153.5, 235.5); s.lineTo(CX, 235.5);
  s.absarc(CX, CY, 62, DOWN, UP, true);                  // P bowl, inner edge
  s.lineTo(111, 111.5); s.lineTo(111, 223); s.closePath();
  return s;
}

const LOOKS = {
  dark:  { color: 0xE6B24E, metalness: 1, roughness: .14, clearcoat: .4, clearcoatRoughness: .12, env: 1.5, key: 2.6, rim: 3.2, rimColor: 0xF5D68A, exposure: 1.05 },
  light: { color: 0x0E0E0E, metalness: .35, roughness: .14, clearcoat: 1, clearcoatRoughness: .04, env: 1, key: 1.6, rim: 6, rimColor: 0xE0A63A, exposure: 1 },
};

// Set-up runs in short steps that hand control back between them, and shaders compile asynchronously before the
// first frame. `context` is the WebGL2 context hero-probe.js opened (and checked is hardware) on `canvas`.
export async function createScene({ canvas, context, small, reduce, step = () => {} }) {
  const pause = () => new Promise(r => setTimeout(r, 0));
  step('start');
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  step('renderer');
  await pause();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), .04, .1, 100, { size: 128 }).texture;   // 128² is a quarter of the default work, same look at this roughness
  scene.environmentRotation.set(.45, Math.PI * .8, 0);   // put the studio's bright panels where the face can see them
  pmrem.dispose();
  step('environment');
  await pause();

  // Extrude the symbol with a deep, soft bevel so edges catch the light.
  const geo = new THREE.ExtrudeGeometry(symbolShape(), { depth: 44, bevelEnabled: true, bevelThickness: 9, bevelSize: 4.5,
    bevelSegments: small ? 6 : 10, curveSegments: small ? 28 : 56 });
  geo.center();                                   // the P's counter sits almost exactly on the origin
  const mat = new THREE.MeshPhysicalMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI;                      // SVG is y-down
  const mark = new THREE.Group();
  mark.add(mesh);
  scene.add(mark);
  step('geometry');
  await pause();

  const key = new THREE.DirectionalLight(0xfff1d6, 2.6);
  const rim = new THREE.DirectionalLight(0xF5D68A, 3.2);
  rim.position.set(650, -250, -450);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 8000);
  const TAN = Math.tan(THREE.MathUtils.degToRad(15));
  const MARK_H = 365;                             // world height incl. bevel

  const look = theme => {
    const l = LOOKS[theme === 'light' ? 'light' : 'dark'];
    mat.color.setHex(l.color);
    Object.assign(mat, { metalness: l.metalness, roughness: l.roughness, clearcoat: l.clearcoat, clearcoatRoughness: l.clearcoatRoughness, envMapIntensity: l.env });
    key.intensity = l.key;
    rim.intensity = l.rim;
    rim.color.setHex(l.rimColor);
    renderer.toneMappingExposure = l.exposure;
  };

  // ---- layout: start pose sits in .hero__stage; the flight pulls it to the centre of the screen ----
  let W = 1, H = 1, slotX = 0, slotY = 0, d0 = 1200;
  const layout = L => {
    ({ W, H, slotX, slotY } = L);
    renderer.setPixelRatio(L.dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    d0 = (MARK_H / 2) / TAN * (H / L.slotH);
  };

  // ---- frame: `ms` since the scene was ready, scroll progress `p`, pointer `target` ----
  const tilt = { x: 0, y: 0 };
  const frame = ({ ms, p, target }) => {
    const t = ms / 1000;
    const intro = reduce ? 1 : easeOut(clamp01((ms - 150) / 1900));
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

    renderer.render(scene, camera);
  };

  // compile before the first frame, so it never stalls on a shader
  const compile = async () => {
    if (renderer.compileAsync) { try { await renderer.compileAsync(scene, camera); } catch (e) { /* compile on first frame instead */ } }
    step('compiled');
  };

  return { look, layout, frame, compile };
}
