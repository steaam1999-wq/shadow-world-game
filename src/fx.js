// =====================================================================
//  Пакетная отрисовка спрайтов (частицы, свечения, следы, декали)
//  Одна инстансная сетка = один вызов отрисовки на тысячи спрайтов.
// =====================================================================
import * as THREE from 'three';

const VERT_BILL = /* glsl */`
  attribute vec3 aPos;
  attribute vec4 aColor;
  attribute vec4 aParams;   // x=ширина, y=высота, z=поворот, w=клетка атласа
  attribute vec3 aDir;      // если ненулевой — спрайт вытягивается вдоль направления
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
    float rot = aParams.z;
    if (dot(aDir, aDir) > 0.0) {
      vec3 vd = (modelViewMatrix * vec4(aDir, 0.0)).xyz;
      rot = atan(vd.y, vd.x);
    }
    float c = cos(rot), s = sin(rot);
    vec2 corner = position.xy * aParams.xy;
    mv.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
    gl_Position = projectionMatrix * mv;
    float cell = aParams.w;
    vec2 cellOff = vec2(mod(cell, 4.0), 3.0 - floor(cell / 4.0)) * 0.25;
    vUv = cellOff + (position.xy + 0.5) * 0.25;
    vColor = aColor;
  }
`;

const VERT_GROUND = /* glsl */`
  attribute vec3 aPos;
  attribute vec4 aColor;
  attribute vec4 aParams;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    float c = cos(aParams.z), s = sin(aParams.z);
    vec2 corner = position.xy * aParams.xy;
    vec3 p = aPos + vec3(c * corner.x - s * corner.y, 0.0, s * corner.x + c * corner.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    float cell = aParams.w;
    vec2 cellOff = vec2(mod(cell, 4.0), 3.0 - floor(cell / 4.0)) * 0.25;
    vUv = cellOff + (position.xy + 0.5) * 0.25;
    vColor = aColor;
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec4 vColor;
  void main() {
    vec4 t = texture2D(map, vUv);
    vec4 col = vec4(vColor.rgb * t.rgb, vColor.a * t.a);
    if (col.a < 0.003) discard;
    gl_FragColor = col;
  }
`;

export class SpriteBatch {
  constructor(max, atlas, { additive = true, ground = false, depthTest = true, renderOrder = 10 } = {}) {
    this.max = max;
    this.n = 0;
    const g = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(1, 1);
    g.index = quad.index;
    g.setAttribute('position', quad.attributes.position);
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.par = new Float32Array(max * 4);
    this.dir = new Float32Array(max * 3);
    const ia = (arr, n) => { const a = new THREE.InstancedBufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = ia(this.pos, 3); this.aCol = ia(this.col, 4); this.aPar = ia(this.par, 4); this.aDir = ia(this.dir, 3);
    g.setAttribute('aPos', this.aPos); g.setAttribute('aColor', this.aCol); g.setAttribute('aParams', this.aPar);
    if (!ground) g.setAttribute('aDir', this.aDir);
    g.instanceCount = 0;
    this.geo = g;
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: atlas } },
      vertexShader: ground ? VERT_GROUND : VERT_BILL,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
  }

  begin() { this.n = 0; }

  // x,y,z — мир; w,h — размер; r,g,b,a — цвет (может быть >1 для яркого свечения)
  add(x, y, z, w, h, r, g, b, a, rot, cell, dx = 0, dy = 0, dz = 0) {
    if (this.n >= this.max) return;
    const i = this.n++;
    const p = i * 3, q = i * 4;
    this.pos[p] = x; this.pos[p + 1] = y; this.pos[p + 2] = z;
    this.col[q] = r; this.col[q + 1] = g; this.col[q + 2] = b; this.col[q + 3] = a;
    this.par[q] = w; this.par[q + 1] = h; this.par[q + 2] = rot; this.par[q + 3] = cell;
    this.dir[p] = dx; this.dir[p + 1] = dy; this.dir[p + 2] = dz;
  }

  end() {
    this.geo.instanceCount = this.n;
    const n = this.n;
    for (const [a, k] of [[this.aPos, 3], [this.aCol, 4], [this.aPar, 4], [this.aDir, 3]]) {
      a.clearUpdateRanges(); a.addUpdateRange(0, n * k); a.needsUpdate = true;
    }
  }
}

// цвет "#rrggbb" -> [r,g,b] 0..1 (кэш)
const colCache = new Map();
export function rgb(hex) {
  let c = colCache.get(hex);
  if (!c) {
    const col = new THREE.Color(hex);
    c = [col.r, col.g, col.b];
    colCache.set(hex, c);
  }
  return c;
}
