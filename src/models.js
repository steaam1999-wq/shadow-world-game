// =====================================================================
//  Модели: герой, 12 видов врагов (инстансинг + скелетная анимация),
//  4 босса. Всё строится процедурно из множества деталей.
//  Ось Y — вверх, вперёд — +Z. 1 единица = 20 игровых пикселей.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------
//  Материалы (кэш)
// ---------------------------------------------------------------------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  let m = matCache.get(key);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.75,
    metalness: Math.min(o.metal ?? 0.05, 0.4),   // без карты окружения металл чернеет
    emissive: o.emi ? new THREE.Color(o.emi) : new THREE.Color(0),
    emissiveIntensity: o.ei ?? 1,
    flatShading: !!o.flat,
    transparent: !!o.opacity,
    opacity: o.opacity ?? 1,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: o.opacity ? false : true,
  });
  m.userData.key = key;
  matCache.set(key, m);
  return m;
}
const glowMat = (c, ei = 4) => mat(c, { emi: c, ei, rough: 0.4 });
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

// ---------------------------------------------------------------------
//  Геометрия
// ---------------------------------------------------------------------
// конечность: верх в начале координат, свисает вниз по -Y
export function limb(r1, r2, len, seg = 7) {
  const g = new THREE.CylinderGeometry(r1, r2, len, seg, 2);
  g.translate(0, -len / 2, 0);
  return g;
}
export const sphere = (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h);
export const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
export const cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
export const cyl = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
export const capsule = (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s);
export function lathe(pts, seg = 16) {
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}
// неровный камень
export function rock(r, detail = 0, seed = 1, rough = 0.25) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const p = g.attributes.position;
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3);
    let f = map.get(k);
    if (f === undefined) { f = 1 + (rnd() - 0.5) * rough * 2; map.set(k, f); }
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
  }
  g.computeVertexNormals();
  return g;
}
// рваный край мантии
export function tatteredLathe(pts, seg = 18, tear = 0.12, seed = 3) {
  const g = lathe(pts, seg);
  const p = g.attributes.position;
  const minY = Math.min(...pts.map((q) => q[1]));
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(p.getY(i) - minY) < 1e-4) {
      const a = Math.atan2(p.getZ(i), p.getX(i));
      p.setY(i, minY + (Math.sin(a * 7 + seed) * 0.5 + 0.5) * tear);
    }
  }
  g.computeVertexNormals();
  return g;
}
function crescentGeo(r, w, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, -2.2, 0.9, false);
  s.absarc(r * 0.3, -r * 0.18, r * 0.82, 0.9, -2.2, true);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: w * 0.2, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function wingGeo(span, height, seed = 1) {
  // перепончатое крыло: в плоскости XY, от плеча (0,0) наружу по +X
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(span * 0.4, height * 0.9, span, height * 0.55);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x0 = span * (1 - i / n), x1 = span * (1 - (i + 1) / n);
    s.quadraticCurveTo((x0 + x1) / 2, -height * (0.05 + 0.08 * ((i + seed) % 2)), x1, i === n - 1 ? 0 : height * (0.15 + 0.1 * i) * 0.6);
  }
  const g = new THREE.ShapeGeometry(s, 12);
  return g;
}

// ---------------------------------------------------------------------
//  Сборщик инстансной модели: детали сливаются по каналам анимации
// ---------------------------------------------------------------------
class Builder {
  constructor() { this.groups = new Map(); }
  // geo — уже готовая геометрия; at — смещение от опорной точки канала
  add(geo, m, { ch = 'body', k = 0, pv = [0, 0, 0], at = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1] } = {}) {
    const g = geo.clone();
    const mtx = new THREE.Matrix4().compose(
      new THREE.Vector3(...at),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(...scl));
    g.applyMatrix4(mtx);
    // унифицируем атрибуты для слияния
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal'].includes(name)) g.deleteAttribute(name);
    const ng = g.index ? g.toNonIndexed() : g;
    const key = ch + '|' + k + '|' + pv.join(',') + '|' + m.userData.key;
    let grp = this.groups.get(key);
    if (!grp) { grp = { ch, k, pv, mat: m, geos: [] }; this.groups.set(key, grp); }
    grp.geos.push(ng);
    return this;
  }
  build() {
    const parts = [];
    for (const g of this.groups.values()) {
      const geo = mergeGeometries(g.geos, false);
      geo.computeBoundingSphere();
      parts.push({ ch: g.ch, k: g.k, pv: g.pv, mat: g.mat, geo });
    }
    return parts;
  }
}

// ---------------------------------------------------------------------
//  Анимация по каналам
// ---------------------------------------------------------------------
//  st: { ph (фаза шага), t (время), atk (0..1), seed, mv (0..1 движется) }
const _a = { rx: 0, ry: 0, rz: 0, dy: 0, s: 1 };
export function animate(ch, k, st) {
  const a = _a; a.rx = a.ry = a.rz = a.dy = 0; a.s = 1;
  const S = Math.sin(st.ph), mv = st.mv;
  switch (ch) {
    case 'body': a.dy = Math.abs(S) * 0.05 * mv; a.rz = Math.sin(st.ph) * 0.04 * mv; a.rx = st.atk * 0.25; break;
    case 'sway': a.rz = Math.sin(st.t * 2 + st.seed) * 0.08; a.rx = 0.12 * mv + st.atk * 0.3; break;
    case 'head': a.ry = Math.sin(st.t * 1.3 + st.seed) * 0.25; a.rx = -st.atk * 0.3; break;
    case 'legL': a.rx = S * 0.65 * mv; break;
    case 'legR': a.rx = -S * 0.65 * mv; break;
    case 'armL': a.rx = -S * 0.5 * mv; break;
    case 'armR': a.rx = S * 0.5 * mv - st.atk * 2.0; break;
    case 'reachL': a.rx = -1.0 + Math.sin(st.t * 3 + st.seed) * 0.15; break;
    case 'reachR': a.rx = -1.0 + Math.sin(st.t * 3 + st.seed + 1) * 0.15 - st.atk; break;
    case 'fl': a.rx = (k ? S : -S) * 0.7 * mv; break;
    case 'bl': a.rx = (k ? -S : S) * 0.7 * mv; break;
    case 'tail': a.ry = Math.sin(st.ph * 0.5 + st.t * 2) * 0.5; break;
    case 'cape': a.rx = 0.15 + 0.25 * mv + Math.sin(st.t * 3 + st.seed) * 0.06; break;
    case 'tent': a.rx = Math.sin(st.t * 3 + k * 1.3 + st.seed) * 0.4; a.rz = Math.cos(st.t * 2.6 + k * 2.1) * 0.3; break;
    case 'spin': a.ry = st.t * 2.5 + k; break;
    case 'pulse': a.s = 1 + Math.sin(st.t * 5 + st.seed) * 0.07 + st.atk * 0.15; break;
    case 'jaw': a.rx = 0.1 + (Math.sin(st.t * 4) * 0.5 + 0.5) * 0.15 + st.atk * 0.9; break;
    case 'wingL': a.rz = Math.sin(st.t * 7 + st.seed) * 0.5; break;
    case 'wingR': a.rz = -Math.sin(st.t * 7 + st.seed) * 0.5; break;
  }
  return a;
}

// ---------------------------------------------------------------------
//  Враги
// ---------------------------------------------------------------------
//  Каждая фабрика возвращает { parts, float, h } — h: высота для HUD/полос
const ENEMY = {};

ENEMY.ghost = () => {
  const b = new Builder();
  const body = mat('#a8b6ff', { emi: '#2a3890', ei: 0.55, opacity: 0.7, double: true, rough: 0.3 });
  b.add(tatteredLathe([[0.0, 1.5], [0.24, 1.46], [0.38, 1.3], [0.42, 1.0], [0.46, 0.7], [0.55, 0.38], [0.62, 0.15]], 16, 0.18), body, { ch: 'sway' });
  b.add(sphere(0.2), mat('#05060c'), { ch: 'sway', at: [0, 1.22, 0.2], scl: [1, 1.1, 0.8] });
  const eye = glowMat('#9fe8ff', 2.6);
  b.add(sphere(0.05, 6, 5), eye, { ch: 'sway', at: [-0.08, 1.24, 0.36] }).add(sphere(0.05, 6, 5), eye, { ch: 'sway', at: [0.08, 1.24, 0.36] });
  b.add(limb(0.1, 0.02, 0.6), body, { ch: 'reachL', pv: [-0.36, 1.08, 0.05] });
  b.add(limb(0.1, 0.02, 0.6), body, { ch: 'reachR', pv: [0.36, 1.08, 0.05] });
  return { parts: b.build(), float: true, h: 1.6 };
};

ENEMY.ghoul = () => {
  const b = new Builder();
  const skin = mat('#76805e', { flat: true, rough: 0.9 }), dark = mat('#2c2f22', { flat: true });
  b.add(capsule(0.3, 0.32), skin, { ch: 'body', at: [0, 0.78, 0], rot: [0.55, 0, 0] });
  for (let i = 0; i < 3; i++) b.add(sphere(0.07, 6, 5), dark, { ch: 'body', at: [0, 0.98 - i * 0.14, -0.2 - i * 0.03] });
  b.add(sphere(0.2, 10, 8), skin, { ch: 'head', pv: [0, 1.0, 0.22], at: [0, 0.04, 0.08], scl: [1, 0.85, 1.25] });
  b.add(box(0.22, 0.05, 0.12), dark, { ch: 'head', pv: [0, 1.0, 0.22], at: [0, -0.06, 0.25] });
  const eye = glowMat('#ff3020', 2.6);
  b.add(sphere(0.045, 6, 5), eye, { ch: 'head', pv: [0, 1.0, 0.22], at: [-0.08, 0.08, 0.3] }).add(sphere(0.045, 6, 5), eye, { ch: 'head', pv: [0, 1.0, 0.22], at: [0.08, 0.08, 0.3] });
  for (const [ch, x] of [['armL', -0.32], ['armR', 0.32]]) {
    b.add(limb(0.08, 0.055, 0.72), skin, { ch, pv: [x, 0.98, 0.12] });
    for (let c = -1; c <= 1; c++) b.add(cone(0.025, 0.14, 4), dark, { ch, pv: [x, 0.98, 0.12], at: [c * 0.04, -0.78, 0.03], rot: [Math.PI, 0, 0] });
  }
  b.add(limb(0.1, 0.07, 0.56), skin, { ch: 'legL', pv: [-0.15, 0.56, 0] });
  b.add(limb(0.1, 0.07, 0.56), skin, { ch: 'legR', pv: [0.15, 0.56, 0] });
  return { parts: b.build(), h: 1.35 };
};

ENEMY.cknight = () => {
  const b = new Builder();
  const steel = mat('#6a6a7c', { metal: 0.4, rough: 0.45, flat: true }), dark = mat('#2e2c38', { metal: 0.3, rough: 0.5 });
  const cloth = mat('#3a1322', { rough: 0.9 }), visor = glowMat('#ff2a2a', 2.6);
  b.add(limb(0.12, 0.1, 0.78), steel, { ch: 'legL', pv: [-0.16, 0.8, 0] });
  b.add(limb(0.12, 0.1, 0.78), steel, { ch: 'legR', pv: [0.16, 0.8, 0] });
  b.add(cyl(0.34, 0.26, 0.68, 8), steel, { ch: 'body', at: [0, 1.15, 0] });
  b.add(box(0.42, 0.7, 0.05), cloth, { ch: 'body', at: [0, 0.82, 0.25] });
  b.add(sphere(0.18, 8, 6), steel, { ch: 'body', at: [-0.38, 1.44, 0], scl: [1, 0.7, 1] }).add(sphere(0.18, 8, 6), steel, { ch: 'body', at: [0.38, 1.44, 0], scl: [1, 0.7, 1] });
  b.add(cyl(0.17, 0.19, 0.32, 8), dark, { ch: 'head', pv: [0, 1.5, 0], at: [0, 0.18, 0] });
  b.add(cone(0.06, 0.25, 6), steel, { ch: 'head', pv: [0, 1.5, 0], at: [0, 0.46, 0] });
  b.add(box(0.24, 0.035, 0.03), visor, { ch: 'head', pv: [0, 1.5, 0], at: [0, 0.2, 0.18] });
  b.add(box(0.75, 1.1, 0.03), cloth, { ch: 'cape', pv: [0, 1.48, -0.2], at: [0, -0.55, 0] });
  b.add(limb(0.08, 0.07, 0.6), steel, { ch: 'armL', pv: [-0.4, 1.38, 0] });
  b.add(cyl(0.3, 0.3, 0.06, 10), dark, { ch: 'armL', pv: [-0.4, 1.38, 0], at: [-0.06, -0.5, 0.18], rot: [Math.PI / 2, 0, 0] });
  b.add(cyl(0.16, 0.16, 0.08, 6), steel, { ch: 'armL', pv: [-0.4, 1.38, 0], at: [-0.06, -0.5, 0.22], rot: [Math.PI / 2, 0, 0] });
  b.add(limb(0.08, 0.07, 0.6), steel, { ch: 'armR', pv: [0.4, 1.38, 0] });
  b.add(box(0.07, 1.0, 0.025), mat('#9a98b0', { metal: 0.9, rough: 0.25, emi: '#3a2a60', ei: 0.6 }), { ch: 'armR', pv: [0.4, 1.38, 0], at: [0, -0.55, 0.55], rot: [Math.PI / 2, 0, 0] });
  b.add(box(0.26, 0.05, 0.06), dark, { ch: 'armR', pv: [0.4, 1.38, 0], at: [0, -0.6, 0.06] });
  return { parts: b.build(), h: 2.0 };
};

ENEMY.wolf = () => {
  const b = new Builder();
  const fur = mat('#4a3a30', { flat: true, rough: 0.95 }), dark = mat('#211812', { flat: true });
  const spike = mat('#7a3cc0', { emi: '#6a2cd0', ei: 1.6, flat: true });
  b.add(capsule(0.25, 0.7), fur, { ch: 'body', at: [0, 0.62, 0], rot: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 5; i++) b.add(cone(0.06, 0.28 - i * 0.03, 5), spike, { ch: 'body', at: [0, 0.88, 0.3 - i * 0.16], rot: [-0.4, 0, 0] });
  const H = { ch: 'head', pv: [0, 0.75, 0.48] };
  b.add(sphere(0.21, 9, 7), fur, { ...H, at: [0, 0.03, 0.08], scl: [0.9, 0.85, 1.1] });
  b.add(cone(0.12, 0.32, 6), fur, { ...H, at: [0, -0.04, 0.34], rot: [Math.PI / 2, 0, 0] });
  b.add(cone(0.06, 0.18, 4), fur, { ...H, at: [-0.11, 0.24, 0.02], rot: [-0.2, 0, -0.3] }).add(cone(0.06, 0.18, 4), fur, { ...H, at: [0.11, 0.24, 0.02], rot: [-0.2, 0, 0.3] });
  const eye = glowMat('#ffd23a', 2.6);
  b.add(sphere(0.035, 6, 5), eye, { ...H, at: [-0.09, 0.07, 0.24] }).add(sphere(0.035, 6, 5), eye, { ...H, at: [0.09, 0.07, 0.24] });
  b.add(cone(0.015, 0.08, 3), mat('#e8e0c8'), { ...H, at: [0.05, -0.12, 0.38], rot: [Math.PI, 0, 0] }).add(cone(0.015, 0.08, 3), mat('#e8e0c8'), { ...H, at: [-0.05, -0.12, 0.38], rot: [Math.PI, 0, 0] });
  for (const [ch, z] of [['fl', 0.36], ['bl', -0.36]]) for (const s of [0, 1]) {
    b.add(limb(0.075, 0.05, 0.55), fur, { ch, k: s, pv: [s ? 0.15 : -0.15, 0.56, z] });
    b.add(sphere(0.055, 5, 4), dark, { ch, k: s, pv: [s ? 0.15 : -0.15, 0.56, z], at: [0, -0.55, 0.03] });
  }
  b.add(limb(0.07, 0.025, 0.55), fur, { ch: 'tail', pv: [0, 0.72, -0.48], rot: [-2.2, 0, 0] });
  return { parts: b.build(), h: 1.1 };
};

ENEMY.wisp = () => {
  const b = new Builder();
  b.add(sphere(0.17), glowMat('#9dffc8', 2.6), { ch: 'pulse', pv: [0, 1.1, 0] });
  b.add(sphere(0.32, 14, 10), mat('#5affb0', { emi: '#2aff90', ei: 1.2, opacity: 0.3, rough: 0.2 }), { ch: 'pulse', pv: [0, 1.1, 0] });
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU;
    b.add(sphere(0.06, 6, 5), glowMat('#c8ffe0', 2.6), { ch: 'spin', k: 0, pv: [0, 1.1, 0], at: [Math.cos(a) * 0.48, Math.sin(i) * 0.1, Math.sin(a) * 0.48] });
  }
  for (let i = 0; i < 3; i++) b.add(cone(0.08, 0.5, 5), mat('#5affb0', { emi: '#2aff90', ei: 1.5, opacity: 0.4 }), { ch: 'tent', k: i, pv: [(i - 1) * 0.1, 0.9, 0], at: [0, -0.25, 0], rot: [Math.PI, 0, 0] });
  return { parts: b.build(), float: true, h: 1.5 };
};

ENEMY.treant = () => {
  const b = new Builder();
  const bark = mat('#3d2a1c', { flat: true, rough: 1 }), leaf = mat('#25503a', { flat: true, rough: 0.9 });
  const moss = mat('#2f6a40', { flat: true, emi: '#103a20', ei: 0.4 });
  b.add(cyl(0.28, 0.42, 1.35, 8), bark, { ch: 'body', at: [0, 0.95, 0] });
  b.add(box(0.2, 0.06, 0.05), mat('#0a0604'), { ch: 'body', at: [0, 1.05, 0.33] });
  const eye = glowMat('#d8ff5a', 2.6);
  b.add(sphere(0.05, 6, 5), eye, { ch: 'body', at: [-0.11, 1.28, 0.3] }).add(sphere(0.05, 6, 5), eye, { ch: 'body', at: [0.11, 1.28, 0.3] });
  b.add(limb(0.16, 0.1, 0.62), bark, { ch: 'legL', pv: [-0.2, 0.55, 0] });
  b.add(limb(0.16, 0.1, 0.62), bark, { ch: 'legR', pv: [0.2, 0.55, 0] });
  for (const [ch, s] of [['armL', -1], ['armR', 1]]) {
    b.add(limb(0.11, 0.05, 0.95), bark, { ch, pv: [s * 0.3, 1.45, 0], rot: [0, 0, s * 0.9] });
    b.add(limb(0.05, 0.02, 0.4), bark, { ch, pv: [s * 0.3, 1.45, 0], at: [s * 0.5, -0.4, 0], rot: [0.3, 0, s * 1.8] });
    b.add(rock(0.18, 0, 7), leaf, { ch, pv: [s * 0.3, 1.45, 0], at: [s * 0.75, -0.55, 0] });
  }
  const C = { ch: 'head', pv: [0, 1.62, 0] };
  b.add(rock(0.5, 1, 3), leaf, { ...C, at: [0, 0.25, 0] });
  b.add(rock(0.36, 0, 5), moss, { ...C, at: [-0.34, 0.08, 0.1] }).add(rock(0.36, 0, 9), leaf, { ...C, at: [0.34, 0.12, -0.05] });
  return { parts: b.build(), h: 2.4 };
};

ENEMY.skeleton = () => {
  const b = new Builder();
  const bone = mat('#d6ceb6', { rough: 0.7 }), rust = mat('#6b5a48', { metal: 0.6, rough: 0.6 });
  b.add(box(0.26, 0.1, 0.12), bone, { ch: 'body', at: [0, 0.86, 0] });
  b.add(cyl(0.035, 0.035, 0.55, 5), bone, { ch: 'body', at: [0, 1.12, -0.04] });
  for (let i = 0; i < 4; i++) b.add(new THREE.TorusGeometry(0.17 - i * 0.015, 0.022, 5, 12, Math.PI * 1.4), bone, { ch: 'body', at: [0, 1.05 + i * 0.1, -0.02], rot: [Math.PI / 2, 0, Math.PI * 0.8] });
  const Hd = { ch: 'head', pv: [0, 1.42, 0] };
  b.add(sphere(0.16, 10, 8), bone, { ...Hd, at: [0, 0.14, 0], scl: [0.95, 1, 1.05] });
  b.add(box(0.16, 0.06, 0.12), bone, { ...Hd, at: [0, 0.0, 0.06] });
  b.add(sphere(0.05, 6, 5), mat('#05060a'), { ...Hd, at: [-0.06, 0.15, 0.13] }).add(sphere(0.05, 6, 5), mat('#05060a'), { ...Hd, at: [0.06, 0.15, 0.13] });
  const eye = glowMat('#4aa8ff', 2.6);
  b.add(sphere(0.025, 5, 4), eye, { ...Hd, at: [-0.06, 0.15, 0.16] }).add(sphere(0.025, 5, 4), eye, { ...Hd, at: [0.06, 0.15, 0.16] });
  b.add(limb(0.04, 0.03, 0.82), bone, { ch: 'legL', pv: [-0.1, 0.86, 0] });
  b.add(limb(0.04, 0.03, 0.82), bone, { ch: 'legR', pv: [0.1, 0.86, 0] });
  b.add(limb(0.035, 0.03, 0.62), bone, { ch: 'armL', pv: [-0.22, 1.38, 0] });
  b.add(limb(0.035, 0.03, 0.62), bone, { ch: 'armR', pv: [0.22, 1.38, 0] });
  b.add(box(0.05, 0.75, 0.02), rust, { ch: 'armR', pv: [0.22, 1.38, 0], at: [0, -0.62, 0.38], rot: [Math.PI / 2, 0, 0] });
  return { parts: b.build(), h: 1.8 };
};

ENEMY.deadmage = () => {
  const b = new Builder();
  const robe = mat('#1d2442', { rough: 0.9, double: true }), trim = mat('#5a7ab8', { metal: 0.6, rough: 0.4 });
  b.add(tatteredLathe([[0.0, 1.45], [0.22, 1.42], [0.3, 1.3], [0.36, 0.9], [0.46, 0.4], [0.54, 0.05]], 14, 0.12), robe, { ch: 'sway' });
  b.add(new THREE.TorusGeometry(0.33, 0.025, 4, 16), trim, { ch: 'sway', at: [0, 0.95, 0], rot: [Math.PI / 2, 0, 0] });
  b.add(sphere(0.24, 10, 8), robe, { ch: 'sway', at: [0, 1.58, -0.02], scl: [1, 1.1, 1.05] });
  b.add(sphere(0.17, 8, 6), mat('#020308'), { ch: 'sway', at: [0, 1.55, 0.1] });
  const eye = glowMat('#7fc8ff', 2.6);
  b.add(sphere(0.03, 5, 4), eye, { ch: 'sway', at: [-0.06, 1.57, 0.24] }).add(sphere(0.03, 5, 4), eye, { ch: 'sway', at: [0.06, 1.57, 0.24] });
  b.add(limb(0.1, 0.07, 0.5), robe, { ch: 'armL', pv: [-0.28, 1.35, 0] });
  b.add(limb(0.1, 0.07, 0.5), robe, { ch: 'armR', pv: [0.28, 1.35, 0] });
  b.add(cyl(0.025, 0.025, 1.7, 5), mat('#3a2a1e'), { ch: 'armR', pv: [0.28, 1.35, 0], at: [0.02, -0.45, 0.12] });
  b.add(sphere(0.09, 8, 6), glowMat('#7fbfff', 2.6), { ch: 'armR', pv: [0.28, 1.35, 0], at: [0.02, 0.42, 0.12] });
  return { parts: b.build(), h: 1.9 };
};

ENEMY.golem = () => {
  const b = new Builder();
  const bone = mat('#bdb39a', { flat: true, rough: 0.85 }), dark = mat('#3a342a', { flat: true });
  b.add(rock(0.62, 0, 11, 0.2), bone, { ch: 'body', at: [0, 1.45, 0], scl: [1.2, 1, 0.9] });
  for (let i = 0; i < 4; i++) b.add(cyl(0.05, 0.05, 0.9, 5), bone, { ch: 'body', at: [-0.3 + i * 0.2, 1.2, 0.45], rot: [0.2, 0, Math.PI / 2 + 0.3] });
  b.add(sphere(0.15, 10, 8), glowMat('#5ab0ff', 2.6), { ch: 'body', at: [0, 1.45, 0.55] });
  b.add(sphere(0.2, 8, 6), bone, { ch: 'head', pv: [0, 2.0, 0.15], at: [0, 0.1, 0.05] });
  const eye = glowMat('#5ab0ff', 2.6);
  b.add(sphere(0.04, 5, 4), eye, { ch: 'head', pv: [0, 2.0, 0.15], at: [-0.07, 0.12, 0.22] }).add(sphere(0.04, 5, 4), eye, { ch: 'head', pv: [0, 2.0, 0.15], at: [0.07, 0.12, 0.22] });
  for (const [ch, s] of [['armL', -1], ['armR', 1]]) {
    b.add(limb(0.2, 0.15, 0.9), bone, { ch, pv: [s * 0.75, 1.8, 0] });
    b.add(rock(0.26, 0, 13 + s), dark, { ch, pv: [s * 0.75, 1.8, 0], at: [0, -1.0, 0.05] });
  }
  b.add(limb(0.22, 0.18, 0.85), bone, { ch: 'legL', pv: [-0.32, 0.88, 0] });
  b.add(limb(0.22, 0.18, 0.85), bone, { ch: 'legR', pv: [0.32, 0.88, 0] });
  return { parts: b.build(), h: 2.5 };
};

ENEMY.spawn = () => {
  const b = new Builder();
  const flesh = mat('#4a1d7a', { emi: '#2a0a50', ei: 0.8, rough: 0.5 });
  b.add(sphere(0.42, 14, 10), flesh, { ch: 'pulse', pv: [0, 0.5, 0], scl: [1, 0.85, 1] });
  const eye = glowMat('#ffb0ff', 2.6);
  [[-0.15, 0.12, 0.33, 0.07], [0.15, 0.1, 0.33, 0.06], [0, -0.05, 0.38, 0.08], [0.25, -0.08, 0.28, 0.05]].forEach(([x, y, z, r]) => b.add(sphere(r, 6, 5), eye, { ch: 'pulse', pv: [0, 0.5, 0], at: [x, y, z] }));
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    b.add(limb(0.08, 0.02, 0.65), flesh, { ch: 'tent', k: i, pv: [Math.sin(a) * 0.32, 0.35, Math.cos(a) * 0.32], rot: [Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1] });
  }
  return { parts: b.build(), h: 1.0 };
};

ENEMY.voideye = () => {
  const b = new Builder();
  const P = { ch: 'pulse', pv: [0, 1.25, 0] };
  b.add(sphere(0.46, 16, 12), mat('#efe0ec', { rough: 0.25 }), P);
  b.add(cyl(0.26, 0.26, 0.02, 20), glowMat('#ff4fd2', 3), { ...P, at: [0, 0, 0.45], rot: [Math.PI / 2, 0, 0] });
  b.add(box(0.06, 0.32, 0.02), mat('#0b0010'), { ...P, at: [0, 0, 0.465] });
  for (let i = 0; i < 6; i++) b.add(cyl(0.008, 0.008, 0.4, 3), mat('#c02050', { emi: '#600010', ei: 1 }), { ...P, at: [Math.cos(i) * 0.3, Math.sin(i * 2) * 0.3, 0.3], rot: [i, i * 2, 0] });
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    b.add(limb(0.07, 0.015, 0.8), mat('#5a1a7a', { emi: '#2a0040', ei: 0.6 }), { ch: 'tent', k: i, pv: [Math.cos(a) * 0.22, 0.9, Math.sin(a) * 0.22] });
  }
  return { parts: b.build(), float: true, h: 1.8 };
};

ENEMY.horror = () => {
  const b = new Builder();
  const mass = mat('#24113a', { flat: true, rough: 0.6, emi: '#12051f', ei: 1 });
  const spikeM = mat('#120818', { flat: true }), glow = glowMat('#c070ff', 2.6);
  b.add(rock(0.75, 1, 21, 0.18), mass, { ch: 'pulse', pv: [0, 1.15, 0] });
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, y = Math.sin(i * 1.7) * 0.4;
    b.add(cone(0.1, 0.55, 5), spikeM, { ch: 'pulse', pv: [0, 1.15, 0], at: [Math.cos(a) * 0.72, y, Math.sin(a) * 0.72], rot: [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2] });
  }
  b.add(sphere(0.1, 8, 6), glow, { ch: 'pulse', pv: [0, 1.15, 0], at: [-0.25, 0.15, 0.66], scl: [0.7, 1.4, 0.5] });
  b.add(sphere(0.1, 8, 6), glow, { ch: 'pulse', pv: [0, 1.15, 0], at: [0.25, 0.15, 0.66], scl: [0.7, 1.4, 0.5] });
  b.add(box(0.5, 0.12, 0.1), glowMat('#ff4060', 2), { ch: 'jaw', pv: [0, 0.95, 0.6] });
  for (let i = 0; i < 4; i++) {
    const a = -0.6 + i * 0.4 + (i > 1 ? Math.PI - 0.6 : 0);
    b.add(limb(0.13, 0.03, 1.1), mass, { ch: 'tent', k: i, pv: [Math.cos(a) * 0.6, 0.9, Math.sin(a) * 0.3 + 0.1], rot: [0.6, 0, (i < 2 ? -1 : 1) * 0.7] });
  }
  return { parts: b.build(), h: 2.3 };
};

const enemyCache = new Map();
export function enemyModel(type) {
  let m = enemyCache.get(type);
  if (!m) { m = ENEMY[type](); enemyCache.set(type, m); }
  return m;
}

// ---------------------------------------------------------------------
//  Герой — последний Арканист
// ---------------------------------------------------------------------
export function buildHero() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const robe = mat('#2c1650', { rough: 0.8, double: true });
  const robe2 = mat('#3e1f6e', { rough: 0.7, double: true });
  const gold = mat('#d8b25a', { metal: 0.9, rough: 0.3, emi: '#4a3010', ei: 0.4 });
  const skin = mat('#2a1a14');

  const robeMesh = new THREE.Mesh(tatteredLathe([[0, 1.5], [0.2, 1.48], [0.28, 1.38], [0.3, 1.1], [0.36, 0.7], [0.46, 0.3], [0.56, 0.02]], 20, 0.08, 1), robe);
  body.add(robeMesh);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.535, 0.03, 5, 24), gold); trim.rotation.x = Math.PI / 2; trim.position.y = 0.08; body.add(trim);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 5, 20), gold); belt.rotation.x = Math.PI / 2; belt.position.y = 0.98; body.add(belt);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), glowMat('#c78bff', 5)); gem.position.set(0, 0.98, 0.33); body.add(gem);
  const front = new THREE.Mesh(box(0.16, 0.9, 0.02), robe2); front.position.set(0, 0.5, 0.42); front.rotation.x = -0.2; body.add(front);
  const frontTrim = new THREE.Mesh(box(0.2, 0.9, 0.012), gold); frontTrim.position.set(0, 0.5, 0.415); frontTrim.rotation.x = -0.2; frontTrim.scale.x = 1.15; body.add(frontTrim);
  // наплечники и плащ
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6, 0, TAU, 0, Math.PI / 2), robe2); sh.position.set(s * 0.26, 1.36, 0); sh.scale.set(1, 0.6, 1); body.add(sh);
    const sht = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 4, 12), gold); sht.position.set(s * 0.26, 1.36, 0); sht.rotation.x = Math.PI / 2; body.add(sht);
  }
  const capePivot = new THREE.Group(); capePivot.position.set(0, 1.4, -0.18); body.add(capePivot);
  const capeGeo = new THREE.PlaneGeometry(0.75, 1.35, 4, 6); capeGeo.translate(0, -0.67, 0);
  const cape = new THREE.Mesh(capeGeo, mat('#1c0d33', { rough: 0.9, double: true })); capePivot.add(cape);
  // голова в капюшоне
  const head = new THREE.Group(); head.position.set(0, 1.55, 0); body.add(head);
  const hood = new THREE.Mesh(sphere(0.25, 14, 10), robe2); hood.scale.set(1, 1.15, 1.1); head.add(hood);
  const hoodTip = new THREE.Mesh(cone(0.14, 0.3, 10), robe2); hoodTip.position.set(0, 0.2, -0.16); hoodTip.rotation.x = -0.9; head.add(hoodTip);
  const hoodTrim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 4, 16), gold); hoodTrim.position.set(0, -0.02, 0.18); hoodTrim.scale.y = 1.3; head.add(hoodTrim);
  const face = new THREE.Mesh(sphere(0.17, 10, 8), skin); face.position.set(0, -0.03, 0.12); face.scale.z = 0.7; head.add(face);
  const faceShade = new THREE.Mesh(sphere(0.16, 10, 8), mat('#04020a')); faceShade.position.set(0, 0.04, 0.14); faceShade.scale.set(1, 0.6, 0.7); head.add(faceShade);
  const eyeM = glowMat('#c9a8ff', 7);
  const eyes = [];
  for (const s of [-1, 1]) { const e = new THREE.Mesh(sphere(0.025, 6, 5), eyeM); e.position.set(s * 0.06, -0.02, 0.27); head.add(e); eyes.push(e); }
  // руки
  const armL = new THREE.Group(); armL.position.set(-0.3, 1.32, 0); body.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.3, 1.32, 0); body.add(armR);
  for (const a of [armL, armR]) {
    const sl = new THREE.Mesh(limb(0.09, 0.13, 0.55, 8), robe2); a.add(sl);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 4, 12), gold); cuff.position.y = -0.53; cuff.rotation.x = Math.PI / 2; a.add(cuff);
    const hand = new THREE.Mesh(sphere(0.06, 6, 5), skin); hand.position.y = -0.6; a.add(hand);
  }
  // сгусток магии в левой руке
  const orb = new THREE.Mesh(sphere(0.08, 10, 8), glowMat('#c070ff', 6)); orb.position.set(0, -0.72, 0.06); armL.add(orb);
  // посох
  const staff = new THREE.Group(); staff.position.set(0, -0.6, 0.05); armR.add(staff);
  const shaft = new THREE.Mesh(cyl(0.028, 0.034, 2.0, 6), mat('#2a1a10', { rough: 0.8 })); shaft.position.y = 0.25; staff.add(shaft);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 10), gold); ring1.rotation.x = Math.PI / 2; ring1.position.y = 0.9; staff.add(ring1);
  const head2 = new THREE.Group(); head2.position.y = 1.3; staff.add(head2);
  for (let i = 0; i < 4; i++) {
    const prong = new THREE.Mesh(limb(0.02, 0.008, 0.32, 4), gold);
    prong.rotation.set(Math.PI, i * Math.PI / 2, 0); prong.rotation.z = Math.PI + 0.35; prong.rotation.y = i * Math.PI / 2;
    prong.position.set(0, -0.05, 0); head2.add(prong);
  }
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat('#b46cff', 5)); crystal.scale.y = 1.7; crystal.position.y = 0.22; head2.add(crystal);

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  cape.castShadow = true;

  const st = { walk: 0 };
  return {
    root, crystal, orb,
    update(t, p, dt) {
      const mv = p.moving ? 1 : 0;
      st.walk += dt * (p.moving ? 9 : 0);
      const S = Math.sin(st.walk);
      body.position.y = Math.abs(S) * 0.06 * mv + Math.sin(t * 2) * 0.015;
      body.rotation.x = 0.12 * mv;
      body.rotation.z = S * 0.04 * mv;
      robeMesh.rotation.y = Math.sin(t * 1.5) * 0.05;
      robeMesh.scale.set(1 + S * 0.03 * mv, 1, 1 - S * 0.03 * mv);
      capePivot.rotation.x = 0.25 + 0.5 * mv + Math.sin(t * 4) * 0.08;
      cape.geometry.attributes.position.needsUpdate = false;
      const cast = p.castT > 0 ? Math.min(1, p.castT / 0.15) : 0;
      armL.rotation.x = -S * 0.4 * mv - 0.3 - cast * 0.9;
      armL.rotation.z = -0.15 - cast * 0.3;
      armR.rotation.x = S * 0.4 * mv - 0.35 - cast * 0.6;
      armR.rotation.z = 0.12;
      head.rotation.y = Math.sin(t * 0.7) * 0.15;
      head2.rotation.y = t * 1.5;
      const hb = p.heart >= 100;
      crystal.scale.setScalar(hb ? 1 + Math.sin(t * 10) * 0.15 : 1); crystal.scale.y *= 1.7;
      crystal.material.emissiveIntensity = hb ? 9 : 4 + cast * 3;
      orb.scale.setScalar(1 + Math.sin(t * 6) * 0.15 + cast * 0.8);
    },
  };
}

// ---------------------------------------------------------------------
//  Боссы (крупные отдельные модели с собственной анимацией)
// ---------------------------------------------------------------------
function shadowAll(g) { g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }

function bossKnight() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const steel = mat('#6a6488', { metal: 0.4, rough: 0.45, flat: true }), dark = mat('#2c2638', { metal: 0.3, rough: 0.55, flat: true });
  const trimM = mat('#6a4aa0', { metal: 0.9, rough: 0.3, emi: '#3a1a70', ei: 0.8 }), glow = glowMat('#c78bff', 8);
  const S = 2.4; body.scale.setScalar(S);
  const legs = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Group(); l.position.set(s * 0.17, 0.82, 0); body.add(l); legs.push(l);
    l.add(new THREE.Mesh(limb(0.13, 0.11, 0.8, 7), steel));
    const knee = new THREE.Mesh(sphere(0.09, 6, 5), dark); knee.position.set(0, -0.4, 0.08); l.add(knee);
  }
  const torso = new THREE.Group(); torso.position.y = 0.85; body.add(torso);
  torso.add(at(new THREE.Mesh(cyl(0.38, 0.28, 0.7, 8), steel), 0, 0.38, 0));
  const rune = new THREE.Mesh(box(0.05, 0.4, 0.02), glow); rune.position.set(0, 0.42, 0.33); torso.add(rune);
  const runeX = new THREE.Mesh(box(0.3, 0.04, 0.02), glow); runeX.position.set(0, 0.5, 0.33); torso.add(runeX);
  for (const s of [-1, 1]) {
    const pa = new THREE.Mesh(sphere(0.22, 8, 6), steel); pa.position.set(s * 0.43, 0.68, 0); pa.scale.set(1, 0.65, 1); torso.add(pa);
    for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(cone(0.05, 0.3, 5), dark); sp.position.set(s * (0.43 + i * 0.05), 0.82, -0.08 + i * 0.08); sp.rotation.z = -s * (0.5 + i * 0.2); torso.add(sp); }
  }
  const capeG = new THREE.Group(); capeG.position.set(0, 0.7, -0.25); torso.add(capeG);
  const capeGeo = new THREE.PlaneGeometry(0.95, 1.55, 6, 8); capeGeo.translate(0, -0.77, 0);
  const cp = capeGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) if (cp.getY(i) < -1.5) cp.setY(i, -1.55 + Math.abs(Math.sin(cp.getX(i) * 20)) * 0.2);
  const cape = new THREE.Mesh(capeGeo, mat('#3a1830', { rough: 0.95, double: true })); capeG.add(cape);
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.02); torso.add(head);
  head.add(at(new THREE.Mesh(cyl(0.19, 0.21, 0.36, 8), dark), 0, 0.15, 0));
  for (const s of [-1, 1]) { const h = new THREE.Mesh(cone(0.06, 0.45, 6), steel); h.position.set(s * 0.18, 0.42, -0.02); h.rotation.z = -s * 0.5; head.add(h); }
  const visor = new THREE.Mesh(box(0.26, 0.04, 0.03), glow); visor.position.set(0, 0.17, 0.2); head.add(visor);
  const armL = new THREE.Group(); armL.position.set(-0.45, 0.6, 0); torso.add(armL);
  armL.add(new THREE.Mesh(limb(0.1, 0.09, 0.65, 7), steel));
  const armR = new THREE.Group(); armR.position.set(0.45, 0.6, 0); torso.add(armR);
  armR.add(new THREE.Mesh(limb(0.1, 0.09, 0.65, 7), steel));
  const sword = new THREE.Group(); sword.position.set(0, -0.62, 0.05); armR.add(sword);
  const blade = new THREE.Mesh(box(0.1, 1.6, 0.03), mat('#3a2a5a', { metal: 0.9, rough: 0.2, emi: '#8a4cff', ei: 2.2 })); blade.position.y = 0.95; sword.add(blade);
  const edge = new THREE.Mesh(box(0.02, 1.55, 0.04), glowMat('#e0b8ff', 6)); edge.position.set(0.05, 0.95, 0); sword.add(edge);
  const guard = new THREE.Mesh(box(0.42, 0.06, 0.08), trimM); guard.position.y = 0.12; sword.add(guard);
  const grip = new THREE.Mesh(cyl(0.03, 0.03, 0.3, 5), dark); sword.add(grip);
  shadowAll(root);
  return {
    root, h: 5.2, swordTip: edge,
    update(t, e, dt, st) {
      const mode = e.ai.mode, walk = st.ph;
      const mv = mode === 'walk' ? 1 : 0;
      legs[0].rotation.x = Math.sin(walk) * 0.5 * mv; legs[1].rotation.x = -Math.sin(walk) * 0.5 * mv;
      body.position.y = Math.abs(Math.sin(walk)) * 0.08 * mv;
      capeG.rotation.x = 0.2 + (mode === 'charge' ? 0.9 : 0.2 * mv) + Math.sin(t * 3) * 0.08;
      if (mode === 'windup') { armR.rotation.x = -2.6; armR.rotation.z = 0.3; torso.rotation.x = -0.15; sword.rotation.x = 0; }
      else if (mode === 'charge') { armR.rotation.x = -1.4; armR.rotation.z = 0; torso.rotation.x = 0.35; sword.rotation.x = 0.2; }
      else {
        const sw = st.atk;
        armR.rotation.x = -0.5 - Math.sin(walk) * 0.2 * mv - sw * 2.2; armR.rotation.z = 0.15 - sw * 0.6;
        torso.rotation.x = 0.05 + sw * 0.2; torso.rotation.y = -sw * 0.5;
        sword.rotation.x = 0.7;
      }
      armL.rotation.x = Math.sin(walk) * 0.4 * mv - 0.2;
      visor.material.emissiveIntensity = 6 + Math.sin(t * 6) * 2;
    },
  };
}

function bossDevourer() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const hide = mat('#2f3b42', { flat: true, rough: 0.9 }), dark = mat('#141a1e', { flat: true }), horn = mat('#8a7a5a', { rough: 0.6 });
  const S = 2.0; body.scale.setScalar(S);
  const torso = new THREE.Mesh(rock(0.75, 1, 41, 0.15), hide); torso.position.set(0, 1.2, -0.1); torso.scale.set(1.1, 0.9, 1.35); body.add(torso);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI - Math.PI / 2, z = -0.7 + (i % 8) * 0.2;
    const sp = new THREE.Mesh(cone(0.07, 0.5 + (i % 3) * 0.15, 5), dark);
    sp.position.set(Math.sin(a) * 0.6, 1.6 + Math.cos(a) * 0.3, z); sp.rotation.set(-0.5, 0, -Math.sin(a) * 0.8); body.add(sp);
  }
  const legs = [];
  for (const [x, z] of [[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.6], [0.55, -0.6]]) {
    const l = new THREE.Group(); l.position.set(x, 0.95, z); body.add(l); legs.push(l);
    l.add(new THREE.Mesh(limb(0.22, 0.15, 0.95, 7), hide));
    for (let c = -1; c <= 1; c++) { const cl = new THREE.Mesh(cone(0.04, 0.18, 4), horn); cl.position.set(c * 0.07, -0.95, 0.15); cl.rotation.x = Math.PI / 2; l.add(cl); }
  }
  const head = new THREE.Group(); head.position.set(0, 1.35, 0.95); body.add(head);
  const skull = new THREE.Mesh(rock(0.45, 1, 7, 0.12), hide); skull.scale.set(1.1, 0.8, 1.1); skull.position.set(0, 0.12, 0.1); head.add(skull);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 12, Math.PI * 0.9), horn);
    h.position.set(s * 0.3, 0.45, -0.05); h.rotation.set(0, s * 0.4 + Math.PI / 2, Math.PI * 0.55 * s); head.add(h);
  }
  const eyeM = glowMat('#ff3a3a', 8);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(sphere(0.06, 6, 5), eyeM); e.position.set(s * 0.22, 0.25, 0.48); head.add(e); }
  const maw = new THREE.Mesh(sphere(0.18, 10, 8), glowMat('#b46cff', 6)); maw.position.set(0, -0.05, 0.4); head.add(maw);
  const teeth = mat('#e8e2c8');
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(cone(0.035, 0.16, 4), teeth); t.position.set(-0.27 + i * 0.09, 0.0, 0.5); t.rotation.x = Math.PI; head.add(t); }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.08, 0.05); head.add(jaw);
  const jawM = new THREE.Mesh(box(0.65, 0.12, 0.6), hide); jawM.position.set(0, -0.06, 0.25); jaw.add(jawM);
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(cone(0.03, 0.14, 4), teeth); t.position.set(-0.27 + i * 0.09, 0.05, 0.5); jaw.add(t); }
  shadowAll(root);
  return {
    root, h: 4.6, maw,
    update(t, e, dt, st) {
      const w = st.ph;
      legs[0].rotation.x = Math.sin(w) * 0.4; legs[3].rotation.x = Math.sin(w) * 0.4;
      legs[1].rotation.x = -Math.sin(w) * 0.4; legs[2].rotation.x = -Math.sin(w) * 0.4;
      body.position.y = Math.abs(Math.sin(w)) * 0.06;
      torso.scale.y = 0.9 + Math.sin(t * 2) * 0.03;
      jaw.rotation.x = 0.15 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.2 + st.atk * 0.7;
      head.rotation.x = -st.atk * 0.3;
      maw.material.emissiveIntensity = 5 + st.atk * 8 + Math.sin(t * 5) * 1.5;
    },
  };
}

function bossKing() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const robe = mat('#241a34', { rough: 0.85, double: true }), bone = mat('#e4dcc6', { rough: 0.6 });
  const gold = mat('#c8a24a', { metal: 0.9, rough: 0.35, emi: '#3a2008', ei: 0.3 }), glow = glowMat('#c070ff', 3);
  const S = 2.5; body.scale.setScalar(S);
  const robeMesh = new THREE.Mesh(tatteredLathe([[0, 1.55], [0.3, 1.5], [0.42, 1.3], [0.45, 0.9], [0.62, 0.4], [0.82, 0.0]], 22, 0.28, 2), robe);
  body.add(robeMesh);
  const aura = new THREE.Mesh(cyl(0.08, 0.2, 1.2, 8), mat('#b46cff', { emi: '#b46cff', ei: 1.6, opacity: 0.5 })); aura.position.set(0, 0.7, 0.36); aura.rotation.x = -0.25; body.add(aura);
  const ribs = new THREE.Group(); ribs.position.set(0, 1.15, 0.28); body.add(ribs);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16 - i * 0.01, 0.02, 4, 12, Math.PI), bone); r.position.y = i * 0.09; r.rotation.set(0, 0, Math.PI); ribs.add(r); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 18), gold); collar.rotation.x = Math.PI / 2; collar.position.y = 1.5; body.add(collar);
  for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(cone(0.04, 0.35, 4), robe); const a = Math.PI + (i / 7) * Math.PI; sp.position.set(Math.cos(a) * 0.38, 1.6, Math.sin(a) * 0.25 - 0.05); sp.rotation.z = -Math.cos(a) * 0.6; body.add(sp); }
  const head = new THREE.Group(); head.position.set(0, 1.78, 0.05); body.add(head);
  head.add(new THREE.Mesh(sphere(0.22, 12, 10), bone));
  const jaw = new THREE.Mesh(box(0.2, 0.08, 0.14), bone); jaw.position.set(0, -0.17, 0.06); head.add(jaw);
  for (const s of [-1, 1]) {
    const so = new THREE.Mesh(sphere(0.06, 6, 5), mat('#05030a')); so.position.set(s * 0.08, 0.02, 0.17); head.add(so);
    const ey = new THREE.Mesh(sphere(0.03, 6, 5), glowMat('#d68bff', 9)); ey.position.set(s * 0.08, 0.02, 0.2); head.add(ey);
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 6, 12, Math.PI * 0.8), mat('#1a1420', { rough: 0.5 }));
    horn.position.set(s * 0.18, 0.2, -0.05); horn.rotation.set(0, Math.PI / 2, s > 0 ? 0.3 : Math.PI - 0.3); head.add(horn);
  }
  const crown = new THREE.Group(); crown.position.y = 0.18; head.add(crown);
  crown.add(new THREE.Mesh(cyl(0.2, 0.2, 0.08, 14, true), gold));
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; const sp = new THREE.Mesh(cone(0.035, 0.16, 4), gold); sp.position.set(Math.cos(a) * 0.2, 0.11, Math.sin(a) * 0.2); crown.add(sp); }
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.42, 1.42, 0); body.add(a); arms.push(a);
    a.add(new THREE.Mesh(limb(0.13, 0.17, 0.6, 8), robe));
    const hand = new THREE.Mesh(sphere(0.06, 6, 5), bone); hand.position.y = -0.65; a.add(hand);
  }
  const staff = new THREE.Group(); staff.position.set(0, -0.65, 0.05); arms[0].add(staff);
  staff.add(at(new THREE.Mesh(cyl(0.03, 0.03, 2.2, 6), gold), 0, 0.3, 0));
  const orb = new THREE.Mesh(sphere(0.13, 12, 10), glowMat('#7fd6ff', 3)); orb.position.y = 1.5; staff.add(orb);
  shadowAll(root);
  return {
    root, h: 5.6, orb,
    update(t, e, dt, st) {
      body.position.y = 0.3 + Math.sin(t * 1.6) * 0.12;
      robeMesh.rotation.y = Math.sin(t * 0.8) * 0.1;
      robeMesh.scale.x = robeMesh.scale.z = 1 + Math.sin(t * 2.2) * 0.03;
      const cast = st.atk;
      arms[1].rotation.x = -0.3 - cast * 2.2 + Math.sin(t * 1.3) * 0.1; arms[1].rotation.z = 0.2 + cast * 0.4;
      arms[0].rotation.x = -0.4 - cast * 0.6;
      head.rotation.y = Math.sin(t * 0.9) * 0.2;
      orb.material.emissiveIntensity = 2.5 + cast * 5;
      aura.material.opacity = 0.35 + Math.sin(t * 4) * 0.15;
    },
  };
}

function bossLord() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const shroud = mat('#1e1030', { rough: 0.8, double: true }), edge = mat('#2a1040', { emi: '#8a4cff', ei: 1.5, double: true });
  const S = 2.6; body.scale.setScalar(S);
  const robeMesh = new THREE.Mesh(tatteredLathe([[0, 1.85], [0.24, 1.8], [0.34, 1.55], [0.38, 1.1], [0.5, 0.55], [0.7, 0.0]], 22, 0.35, 5), shroud);
  body.add(robeMesh);
  const hood = new THREE.Mesh(cone(0.32, 0.8, 14, 1, true), shroud); hood.position.set(0, 2.1, -0.02); body.add(hood);
  const face = new THREE.Mesh(sphere(0.2, 10, 8), mat('#000000')); face.position.set(0, 1.9, 0.1); body.add(face);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(sphere(0.035, 6, 5), glowMat('#ffffff', 5)); e.position.set(s * 0.08, 1.92, 0.27); e.scale.set(1.6, 0.7, 1); body.add(e); }
  const core = new THREE.Mesh(sphere(0.2, 16, 12), glowMat('#7fc0ff', 2)); core.position.set(0, 1.35, 0.32); body.add(core);
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 6, 24), glowMat('#5a8cff', 2.5)); coreRing.position.copy(core.position); body.add(coreRing);
  const veins = new THREE.Group(); body.add(veins);
  for (let i = 0; i < 6; i++) { const v = new THREE.Mesh(cyl(0.012, 0.004, 0.9, 3), glowMat('#6aa0ff', 2.5)); const a = i / 6 * TAU; v.position.set(Math.cos(a) * 0.25, 1.0 + Math.sin(a) * 0.3, 0.33); v.rotation.z = a; veins.add(v); }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.25, 1.6, -0.2); body.add(w); wings.push(w);
    const g = wingGeo(1.9, 1.3, s > 0 ? 1 : 2); if (s < 0) g.scale(-1, 1, 1);
    w.add(new THREE.Mesh(g, shroud));
    const bones = new THREE.Mesh(wingGeo(1.95, 1.35, s > 0 ? 1 : 2), edge); if (s < 0) bones.geometry.scale(-1, 1, 1);
    bones.scale.set(1, 1, 1); bones.position.z = -0.01; bones.material = mat('#2a1040', { emi: '#6a2cff', ei: 1.2, double: true, opacity: 0.5 }); w.add(bones);
  }
  const halo = new THREE.Group(); halo.position.set(0, 2.3, -0.3); body.add(halo);
  for (let i = 0; i < 10; i++) { const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), glowMat('#d68bff', 2.2)); const a = i / 10 * TAU; sh.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); sh.scale.y = 2; sh.rotation.z = a; halo.add(sh); }
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.36, 1.55, 0); body.add(a); arms.push(a);
    a.add(new THREE.Mesh(limb(0.1, 0.15, 0.7, 8), shroud));
    for (let c = -1; c <= 1; c++) { const cl = new THREE.Mesh(cone(0.02, 0.22, 4), mat('#1a0a28')); cl.position.set(c * 0.04, -0.8, 0.02); cl.rotation.x = Math.PI; a.add(cl); }
  }
  shadowAll(root);
  return {
    root, h: 6.5, core,
    update(t, e, dt, st) {
      body.position.y = 0.4 + Math.sin(t * 1.4) * 0.15;
      const flap = Math.sin(t * (e.ai.mode === 'charge' ? 12 : 3.2));
      wings[0].rotation.y = 0.35 + flap * 0.45; wings[1].rotation.y = -0.35 - flap * 0.45;
      wings[0].rotation.z = flap * 0.1; wings[1].rotation.z = -flap * 0.1;
      halo.rotation.z = t * 0.8;
      coreRing.rotation.set(t * 1.3, t * 0.9, 0);
      const cast = Math.max(st.atk, e.ai.mode === 'windup' ? 1 : 0);
      arms[0].rotation.set(-0.4 - cast * 1.5, 0, -0.3 - cast * 0.5);
      arms[1].rotation.set(-0.4 - cast * 1.5, 0, 0.3 + cast * 0.5);
      core.material.emissiveIntensity = 1.8 + Math.sin(t * 6) * 0.6 + cast * 2.5;
      robeMesh.rotation.y = Math.sin(t) * 0.1;
    },
  };
}

export function buildBoss(id) {
  switch (id) {
    case 'fallen_knight': return bossKnight();
    case 'devourer': return bossDevourer();
    case 'soulless_king': return bossKing();
    default: return bossLord();
  }
}

// снаряды-модели
export const PROJ = {
  shard: () => { const g = new THREE.OctahedronGeometry(0.16, 0); g.scale(0.5, 0.5, 2.4); return g; },
  crescent: () => crescentGeo(0.42, 0.1, 0.05),
  gem: () => new THREE.OctahedronGeometry(0.13, 0),
};
