/* paruto.com — open the hero's WebGL2 context, on hardware graphics only. Shared by hero-worker.js and the on-page
   fallback in hero-gl.js. A software renderer (SwiftShader, llvmpipe, GPU-less or locked-down devices) takes seconds
   to compile the shaders, so those keep the flat SVG mark and three.js is never downloaded. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
// The attributes three.js's WebGLRenderer would ask for, so it can adopt this context as its own.
const ATTRS = { alpha: true, antialias: true, depth: true, stencil: false, premultipliedAlpha: true,
  preserveDrawingBuffer: false, powerPreference: 'high-performance' };

// Returns { gl } on hardware, 'software' when only a software renderer is on offer, 'none' when there's no WebGL2 here.
export function openGL(canvas) {
  let gl = null;
  try { gl = canvas.getContext('webgl2', { ...ATTRS, failIfMajorPerformanceCaveat: true }); } catch (e) { /* none */ }
  if (!gl) {
    // Refused: either only a slow software renderer is available, or this context can't draw WebGL2 at all.
    let any = null;
    try { any = canvas.getContext('webgl2'); } catch (e) { /* none */ }
    if (!any) return 'none';
    any.getExtension('WEBGL_lose_context')?.loseContext();
    return 'software';
  }
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  if (SOFTWARE.test(name)) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return 'software'; }
  return { gl };
}
