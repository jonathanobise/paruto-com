// Entry for the hero's three.js bundle: only the classes hero-gl.js uses, tree-shaken by scripts/build-hero-three.mjs.
// Adding a THREE.* class to hero-gl.js? Export it here and rebuild.
export {
  WebGLRenderer, Scene, PMREMGenerator, Shape, ExtrudeGeometry, MeshPhysicalMaterial, Mesh, Group,
  DirectionalLight, PerspectiveCamera, MathUtils, ACESFilmicToneMapping, SRGBColorSpace,
} from 'three';
export { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
