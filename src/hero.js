// =====================================================================
//  Герой — Каэль, последний Арканист. Процедурная модель Stylized AAA.
//
//  Интерфейс совместим с рендером: { root, crystal, orb, update(t, p, dt) }
//    crystal — кристалл Сердца Эфира в навершии посоха (пульсация, свечение)
//    orb     — сгусток магии над левой ладонью (каст)
//
//  Высота ~1.95 м (1 ед. = 1 м), смотрит вдоль +Z, ноги на y = 0.
//  Узлы анимации: legL/legR (+ kneeL/kneeR), body (дыхание, наклон),
//  armL/armR (+ elbowL/elbowR), cape (волна ткани), headPivot, staffHead.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------
//  Процедурные PBR-карты (canvas): ткань, кожа, металл, дерево, вышивка
// ---------------------------------------------------------------------
function rnd(seed) { let s = seed >>> 0 || 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function canvasTex(size, draw, { srgb = false, rep = [1, 1], h = size } = {}) {
  const c = document.createElement('canvas');
  c.width = size; c.height = h;
  draw(c.getContext('2d'), size, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeMaps() {
  const M = {};
  // ткань: полотняное переплетение нитей
  const weave = (g, S, lo, hi, seed) => {
    const r = rnd(seed);
    g.fillStyle = `rgb(${lo},${lo},${lo})`; g.fillRect(0, 0, S, S);
    const n = 64, w = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const over = (i + j) % 2 === 0, v = (over ? hi : lo) + (r() * 18 - 9);
      g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      if (over) g.fillRect(i * w, j * w + w * 0.15, w, w * 0.7); else g.fillRect(i * w + w * 0.15, j * w, w * 0.7, w);
    }
    // редкие «узелки» и потёртости
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${hi},${hi},${hi},0.25)`; g.beginPath(); g.arc(r() * S, r() * S, 1 + r() * 3, 0, TAU); g.fill(); }
  };
  M.fabricBump = canvasTex(256, (g, S) => weave(g, S, 90, 200, 3), { rep: [6, 6] });
  M.fabricRough = canvasTex(256, (g, S) => weave(g, S, 200, 235, 5), { rep: [6, 6] });
  M.fabricAlbedo = canvasTex(256, (g, S) => {
    weave(g, S, 215, 250, 7);
    const r = rnd(11);
    for (let k = 0; k < 40; k++) { const x = r() * S, y = r() * S, s = 10 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(0,0,0,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
  }, { srgb: true, rep: [8, 8] });
  // кожа: пятна, поры, заломы
  M.leatherBump = canvasTex(256, (g, S) => {
    const r = rnd(21); g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 900; k++) { const v = 100 + r() * 70 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * S, r() * S, 2, 2); }
    g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 1.5;
    for (let k = 0; k < 25; k++) { g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += r() * 30 - 15; y += r() * 12 - 6; g.lineTo(x, y); } g.stroke(); }
  }, { rep: [2, 2] });
  M.leatherRough = canvasTex(128, (g, S) => { const r = rnd(23); g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, S, S); for (let k = 0; k < 40; k++) { const v = 130 + r() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.beginPath(); g.arc(r() * S, r() * S, 4 + r() * 14, 0, TAU); g.fill(); } }, { rep: [2, 2] });
  // металл: царапины и потёртости (шероховатость)
  M.metalRough = canvasTex(256, (g, S) => {
    const r = rnd(31); g.fillStyle = '#404040'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 140; k++) { const v = 80 + r() * 120 | 0; g.strokeStyle = `rgba(${v},${v},${v},0.55)`; g.lineWidth = r() * 1.5 + 0.3; g.beginPath(); const x = r() * S, y = r() * S, a = r() * TAU, l = 6 + r() * 40; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let k = 0; k < 20; k++) { const x = r() * S, y = r() * S, s = 8 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(170,170,170,0.5)'); gr.addColorStop(1, 'rgba(170,170,170,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
  }, { rep: [2, 2] });
  M.metalBump = canvasTex(128, (g, S) => { const r = rnd(33); g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(40,40,40,0.7)'; g.lineWidth = 1; g.beginPath(); const x = r() * S, y = r() * S; g.moveTo(x, y); g.lineTo(x + r() * 30 - 15, y + r() * 30 - 15); g.stroke(); } }, { rep: [2, 2] });
  // дерево: волокна вдоль древка
  M.woodAlbedo = canvasTex(256, (g, S) => {
    const r = rnd(41); g.fillStyle = '#d0b8a0'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 70; k++) { const x = r() * S, v = 120 + r() * 80 | 0; g.strokeStyle = `rgba(${v},${v * 0.8 | 0},${v * 0.6 | 0},0.6)`; g.lineWidth = 0.5 + r() * 2.5; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= S; y += 16) g.lineTo(x + Math.sin(y * 0.05 + k) * 3, y); g.stroke(); }
  }, { srgb: true, rep: [1, 4] });
  M.woodBump = canvasTex(256, (g, S) => {
    const r = rnd(43); g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 90; k++) { const x = r() * S, v = 40 + r() * 160 | 0; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 0.5 + r() * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= S; y += 16) g.lineTo(x + Math.sin(y * 0.05 + k) * 3, y); g.stroke(); }
  }, { rep: [1, 4] });
  // рунная полоса: золотые кромки и вязь глифов на тёмно-фиолетовом (альбедо + металличность)
  const band = (g, W, H, gold, base, glyphs) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    g.fillStyle = gold; g.fillRect(0, 0, W, H * 0.13); g.fillRect(0, H * 0.87, W, H * 0.13);
    g.fillRect(0, H * 0.19, W, H * 0.04); g.fillRect(0, H * 0.77, W, H * 0.04);
    if (!glyphs) { for (let x = 6; x < W; x += 14) { g.beginPath(); g.arc(x, H / 2, H * 0.08, 0, TAU); g.fill(); } return; }
    g.strokeStyle = gold; g.lineWidth = H * 0.07; g.lineCap = 'round'; g.lineJoin = 'round';
    const r = rnd(77);
    for (let x = H * 0.45; x < W; x += H * 0.62) {
      g.beginPath();
      const k = (r() * 5) | 0, cx = x, top = H * 0.3, bot = H * 0.7, w = H * 0.14;
      if (k === 0) { g.moveTo(cx - w, bot); g.lineTo(cx, top); g.lineTo(cx + w, bot); }
      else if (k === 1) { g.moveTo(cx, top); g.lineTo(cx, bot); g.moveTo(cx - w, top + w * 0.6); g.lineTo(cx + w, bot - w * 0.6); }
      else if (k === 2) { g.arc(cx, H / 2, H * 0.15, 0.4, TAU - 0.4); }
      else if (k === 3) { g.moveTo(cx - w, top); g.lineTo(cx + w, top); g.lineTo(cx - w, bot); g.lineTo(cx + w, bot); }
      else { g.moveTo(cx - w, H / 2); g.lineTo(cx, top); g.lineTo(cx + w, H / 2); g.lineTo(cx, bot); g.closePath(); }
      g.stroke();
    }
  };
  M.bandAlbedo = canvasTex(512, (g, W, H) => band(g, W, H, '#e8bc5c', '#3a1a66', true), { srgb: true, h: 64 });
  M.bandMetal = canvasTex(512, (g, W, H) => band(g, W, H, '#ffffff', '#000000', true), { h: 64 });
  M.trimAlbedo = canvasTex(256, (g, W, H) => band(g, W, H, '#e8bc5c', '#3a1a66', false), { srgb: true, h: 32 });
  M.trimMetal = canvasTex(256, (g, W, H) => band(g, W, H, '#ffffff', '#000000', false), { h: 32 });
  return M;
}

// ---------------------------------------------------------------------
//  Материалы
// ---------------------------------------------------------------------
function makeMaterials(M) {
  const S = (o) => new THREE.MeshStandardMaterial(o);
  return {
    robe: S({ color: '#7440a8', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.2, roughnessMap: M.fabricRough, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide }),
    robeDark: S({ color: '#43215f', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.0, roughnessMap: M.fabricRough, roughness: 0.9, metalness: 0.03, side: THREE.DoubleSide }),
    scarf: S({ color: '#5b2c8e', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.5, roughnessMap: M.fabricRough, roughness: 0.88, metalness: 0.04, side: THREE.DoubleSide }),
    cape: S({ color: '#24113f', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.2, roughnessMap: M.fabricRough, roughness: 0.9, metalness: 0.03, side: THREE.DoubleSide }),
    capeInner: S({ color: '#5a1a3a', map: M.fabricAlbedo, roughness: 0.85, metalness: 0.03, side: THREE.DoubleSide }),
    gold: S({ color: '#d6a84e', roughnessMap: M.metalRough, roughness: 0.25, metalness: 0.88, bumpMap: M.metalBump, bumpScale: 0.4, emissive: '#2a1804', emissiveIntensity: 0.6 }),
    steel: S({ color: '#6a5a92', roughnessMap: M.metalRough, roughness: 0.34, metalness: 0.6, bumpMap: M.metalBump, bumpScale: 0.5, emissive: '#0c0618', emissiveIntensity: 1 }),
    leather: S({ color: '#4a2c1c', bumpMap: M.leatherBump, bumpScale: 1.4, roughnessMap: M.leatherRough, roughness: 0.62, metalness: 0.0 }),
    leatherDark: S({ color: '#24160f', bumpMap: M.leatherBump, bumpScale: 1.2, roughnessMap: M.leatherRough, roughness: 0.55, metalness: 0.0 }),
    wood: S({ color: '#5a3a26', map: M.woodAlbedo, bumpMap: M.woodBump, bumpScale: 1.5, roughness: 0.7, metalness: 0.0 }),
    shadow: S({ color: '#030106', roughness: 1, metalness: 0 }),
    mask: S({ color: '#1c1326', bumpMap: M.leatherBump, bumpScale: 1, roughness: 0.6, metalness: 0.1 }),
    eye: S({ color: '#000000', emissive: '#d0a8ff', emissiveIntensity: 3, roughness: 1 }),
    // магия: плотное цветное ядро без ухода в белый
    core: S({ color: '#2a0a4a', emissive: '#9a4dff', emissiveIntensity: 1.35, roughness: 0.3, metalness: 0 }),
    shell: new THREE.MeshPhysicalMaterial({ color: '#c9a2ff', emissive: '#5a22d0', emissiveIntensity: 0.45, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    spark: S({ color: '#1a0830', emissive: '#d090ff', emissiveIntensity: 1.6, roughness: 0.4 }),
    potion: S({ color: '#30d0a0', emissive: '#10a070', emissiveIntensity: 0.8, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.85 }),
    parchment: S({ color: '#c8b28a', roughness: 0.9 }),
    // рунная вышивка: металлическое золото только там, где нити
    band: S({ color: '#ffffff', map: M.bandAlbedo, metalnessMap: M.bandMetal, metalness: 0.9, roughness: 0.42, bumpMap: M.bandMetal, bumpScale: 1.5, side: THREE.DoubleSide }),
    trim: S({ color: '#ffffff', map: M.trimAlbedo, metalnessMap: M.trimMetal, metalness: 0.9, roughness: 0.42, bumpMap: M.trimMetal, bumpScale: 1.5, side: THREE.DoubleSide }),
    tunic: S({ color: '#55287f', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.0, roughnessMap: M.fabricRough, roughness: 0.85, metalness: 0.04, side: THREE.DoubleSide }),
    sash: S({ color: '#6334a0', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.6, roughnessMap: M.fabricRough, roughness: 0.8, metalness: 0.04, side: THREE.DoubleSide }),
    bootLeather: S({ color: '#56308c', bumpMap: M.leatherBump, bumpScale: 1.4, roughnessMap: M.leatherRough, roughness: 0.5, metalness: 0.05 }),
    glove: S({ color: '#4c2a80', bumpMap: M.leatherBump, bumpScale: 1.2, roughnessMap: M.leatherRough, roughness: 0.55, metalness: 0.05 }),
    skin: S({ color: '#5e4038', roughness: 0.7, metalness: 0 }),
  };
}

// ---------------------------------------------------------------------
//  Геометрические помощники
// ---------------------------------------------------------------------
// Сборка статичных деталей узла в одну сетку на материал (меньше вызовов отрисовки)
class Assembler {
  constructor() { this.byMat = new Map(); }
  add(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(V(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(...scl)));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!this.byMat.has(mat)) this.byMat.set(mat, []);
    this.byMat.get(mat).push(g);
    return this;
  }
  into(parent) {
    for (const [mat, geos] of this.byMat) {
      const m = new THREE.Mesh(mergeGeometries(geos), mat);
      m.castShadow = true; m.receiveShadow = true;
      parent.add(m);
    }
    return parent;
  }
}

// Труба с переменным радиусом вдоль кривой
function taperTube(points, radii, tubular = 24, radial = 10, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, tubular, 1, radial, closed);
  const pos = g.attributes.position, p = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, c);
    const rf = t * (radii.length - 1), i0 = Math.floor(rf), i1 = Math.min(radii.length - 1, i0 + 1);
    const r = radii[i0] + (radii[i1] - radii[i0]) * (rf - i0);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(idx, p.x, p.y, p.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

// Палец: два сустава
function finger(len, r, bend) {
  const pts = [V(0, 0, 0), V(0, -len * 0.5, Math.sin(bend * 0.5) * len * 0.25), V(0, -len * 0.85, Math.sin(bend) * len * 0.6)];
  return taperTube(pts, [r, r * 0.9, r * 0.7], 8, 6);
}

// Кисть в перчатке: ладонь + 4 пальца + большой палец
function addHand(A, mat, { grip = false, spread = false }) {
  A.add(new THREE.CapsuleGeometry(0.035, 0.05, 4, 8), mat, [0, -0.04, 0], [0, 0, 0], [1.1, 1, 0.65]);
  for (let f = 0; f < 4; f++) {
    const x = -0.027 + f * 0.018;
    const bend = grip ? 2.4 : spread ? 0.35 : 0.9;
    const yaw = spread ? (f - 1.5) * 0.18 : 0;
    A.add(finger(grip ? 0.075 : 0.085, 0.009, bend), mat, [x, -0.085, 0.004], [0, yaw, spread ? (f - 1.5) * 0.12 : 0]);
  }
  A.add(finger(0.06, 0.011, grip ? 1.8 : 0.6), mat, [0.034, -0.04, 0.02], [0.3, 0, grip ? -0.9 : -0.6]);
}

// ---------------------------------------------------------------------
//  Ткань как параметрическая поверхность: профиль + складки.
//  Одна и та же функция строит мантию, вышивку, борта и кушак —
//  поэтому вся отделка точно ложится на складки.
// ---------------------------------------------------------------------
function profileLookup(pts) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  const samples = curve.getSpacedPoints(160).map((p) => [p.x, p.y]).sort((a, b) => a[1] - b[1]);
  return (y) => {
    if (y <= samples[0][1]) return samples[0][0];
    for (let i = 1; i < samples.length; i++) {
      if (samples[i][1] >= y) { const [r0, y0] = samples[i - 1], [r1, y1] = samples[i]; return r0 + (r1 - r0) * ((y - y0) / ((y1 - y0) || 1)); }
    }
    return samples[samples.length - 1][0];
  };
}

function clothFn({ profile, folds = 9, foldDepth = 0.07, foldTop = 1.0, seed = 1, flatten = 0.84 }) {
  const R = profileLookup(profile), yMin = Math.min(...profile.map((p) => p[1]));
  return (phi, y, off = 1) => {
    const k = Math.max(0, Math.min(1, (foldTop - y) / ((foldTop - yMin) || 1)));
    const fold = Math.sin(phi * folds + Math.sin(y * 3 + seed) * 0.8) * foldDepth * Math.pow(k, 1.3)
      + Math.sin(phi * (folds * 2 + 3) + seed) * foldDepth * 0.3 * k;
    const r = R(y) * (1 + fold) * (1 + Math.sin(phi + seed) * 0.03 * k) * off;
    return [Math.sin(phi) * r, y, Math.cos(phi) * r * flatten];
  };
}

// Сетка поверхности: phi0..phi1 (вокруг), y1 -> y0 (сверху вниз)
function surface(fn, phi0, phi1, y0, y1, nu, nv, off = 1, uRep = 1, vRep = 1, swapUV = false) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const phi = phi0 + (phi1 - phi0) * (i / nu), y = y1 - (y1 - y0) * (j / nv);
    pos.push(...fn(phi, y, off));
    const u = (i / nu) * uRep, v = (1 - j / nv) * vRep;
    if (swapUV) uv.push(v, u); else uv.push(u, v);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Лента вдоль ткани: центр по phi зависит от высоты (борта, V-вырез)
function strip(fn, phiAt, half, y0, y1, nv, off, uRep) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const y = y1 - (y1 - y0) * (j / nv), pc = phiAt(y);
    for (let i = 0; i <= 2; i++) {
      pos.push(...fn(pc + (i - 1) * half, y, off));
      uv.push((j / nv) * uRep, i / 2);           // u — вдоль ленты, v — поперёк
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < 2; i++) {
    const a = j * 3 + i, b = a + 1, c = a + 3, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Кромка по поверхности (золотой шнур)
function edgeTube(fn, ys, phis, off, r) {
  const pts = [];
  for (let k = 0; k < ys.length; k++) pts.push(V(...fn(phis[k], ys[k], off)));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 2), r, 4, false);
}
function ringEdge(fn, y, phi0, phi1, n, off, r) {
  const ys = [], ps = [];
  for (let k = 0; k <= n; k++) { ys.push(y); ps.push(phi0 + (phi1 - phi0) * (k / n)); }
  return edgeTube(fn, ys, ps, off, r);
}

// ---------------------------------------------------------------------
//  Части тела
// ---------------------------------------------------------------------
// Тяжёлые сапоги с золотыми накладками
function createLegs(mat) {
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.11, 0.86, 0);
    const A = new Assembler();
    A.add(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 12), mat.robeDark, [0, -0.21, 0]);
    A.into(hip);
    const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee);
    const B = new Assembler();
    const boot = new THREE.LatheGeometry([[0.0, -0.4], [0.07, -0.4], [0.078, -0.33], [0.074, -0.2], [0.08, -0.05], [0.098, 0.02], [0.104, 0.07], [0.0, 0.07]].map(([r, y]) => new THREE.Vector2(r, y)), 18);
    B.add(boot, mat.bootLeather);
    B.add(new THREE.TorusGeometry(0.1, 0.02, 8, 20), mat.bootLeather, [0, 0.045, 0], [Math.PI / 2, 0, 0]);
    // широкая золотая накладка с пряжкой
    B.add(new THREE.CylinderGeometry(0.081, 0.079, 0.045, 18, 1, true), mat.gold, [0, -0.17, 0]);
    B.add(new THREE.BoxGeometry(0.045, 0.055, 0.02), mat.gold, [0, -0.17, 0.08]);
    B.add(new THREE.BoxGeometry(0.022, 0.03, 0.022), mat.bootLeather, [0, -0.17, 0.085]);
    B.add(new THREE.TorusGeometry(0.076, 0.009, 5, 18), mat.gold, [0, -0.3, 0], [Math.PI / 2, 0, 0]);
    // массивная стопа, золотой носок, подошва
    B.add(new THREE.CapsuleGeometry(0.06, 0.13, 4, 10), mat.bootLeather, [0, -0.375, 0.07], [Math.PI / 2, 0, 0], [1, 1, 0.78]);
    B.add(new THREE.SphereGeometry(0.058, 12, 8, 0, TAU, 0, Math.PI / 2), mat.gold, [0, -0.39, 0.16], [Math.PI / 2 + 0.3, 0, 0], [1, 0.7, 0.8]);
    B.add(new THREE.BoxGeometry(0.125, 0.03, 0.29), mat.leatherDark, [0, -0.425, 0.07]);
    B.into(knee);
    legs.push({ hip, knee });
  }
  return legs;
}

// Кафтан: закрытый верх, распашная юбка, внутренняя туника, рунная полоса по подолу,
// золотые борта и V-вырез, тканый кушак с узлом
function createTorsoAndRobe(mat) {
  const body = new THREE.Group();
  const A = new Assembler();
  const OPEN = 0.3;                // полуширина распаха спереди (рад)
  const coat = clothFn({ profile: [[0.1, 1.57], [0.2, 1.52], [0.29, 1.45], [0.3, 1.36], [0.27, 1.22], [0.23, 1.08], [0.22, 1.02], [0.27, 0.9], [0.33, 0.72], [0.4, 0.52], [0.46, 0.34]], folds: 9, foldDepth: 0.07, foldTop: 0.98, seed: 1.7 });
  // верх кафтана
  A.add(surface(coat, 0, TAU, 1.0, 1.57, 44, 14, 1, 4, 2), mat.robe);
  // распашная юбка до середины голени
  A.add(surface(coat, OPEN, TAU - OPEN, 0.42, 1.0, 44, 20, 1, 4, 3), mat.robe);
  // внутренняя туника в распахе с золотым знаком
  A.add(surface(coat, -OPEN - 0.12, OPEN + 0.12, 0.5, 1.0, 10, 12, 0.92, 1, 2), mat.tunic);
  const emb = new THREE.Shape(); emb.moveTo(0, 0.05); emb.lineTo(0.03, 0); emb.lineTo(0, -0.05); emb.lineTo(-0.03, 0); emb.closePath();
  const embHole = new THREE.Path(); embHole.moveTo(0, 0.025); embHole.lineTo(0.014, 0); embHole.lineTo(0, -0.025); embHole.lineTo(-0.014, 0); embHole.closePath(); emb.holes.push(embHole);
  const fp = coat(0, 0.6, 0.93);
  A.add(new THREE.ExtrudeGeometry(emb, { depth: 0.006, bevelEnabled: false }), mat.gold, [fp[0], fp[1], fp[2] + 0.004]);
  
  // рунная полоса по подолу
  A.add(surface(coat, OPEN, TAU - OPEN, 0.42, 0.53, 60, 3, 1.012, 14, 1), mat.band);
  A.add(ringEdge(coat, 0.421, OPEN, TAU - OPEN, 36, 1.016, 0.011), mat.gold);
  // золотые борта по краям распаха и V-вырез на груди
  for (const s of [-1, 1]) {
    A.add(strip(coat, () => s * (OPEN + 0.075), 0.075, 0.42, 1.0, 14, 1.015, 6), mat.trim);
    A.add(strip(coat, (y) => s * (0.1 + (y - 1.0) / 0.52 * 0.42), 0.07, 1.0, 1.52, 10, 1.018, 4), mat.trim);
  }
  // кушак: широкая тканевая лента, золотые кромки, узел и свисающие концы
  A.add(surface(coat, 0, TAU, 0.95, 1.09, 44, 3, 1.07, 6, 1), mat.sash);
  A.add(ringEdge(coat, 1.09, 0, TAU, 30, 1.075, 0.009), mat.gold);
  A.add(ringEdge(coat, 0.95, 0, TAU, 30, 1.075, 0.009), mat.gold);
  const kp = coat(-0.42, 1.02, 1.1);
  A.add(new THREE.SphereGeometry(0.045, 10, 8), mat.sash, kp, [0, 0, 0], [1.1, 0.9, 0.7]);
  for (const [dx, len, rz] of [[-0.02, 0.26, 0.12], [0.03, 0.2, -0.08]]) {
    const end = new THREE.PlaneGeometry(0.07, len, 1, 6); end.translate(0, -len / 2, 0);
    const ep = end.attributes.position; for (let i = 0; i < ep.count; i++) ep.setZ(i, Math.sin(-ep.getY(i) * 9) * 0.012);
    end.computeVertexNormals();
    A.add(end, mat.sash, [kp[0] + dx, kp[1] - 0.03, kp[2] + 0.02], [0.15, -0.42, rz]);
    A.add(new THREE.BoxGeometry(0.072, 0.02, 0.006), mat.gold, [kp[0] + dx + Math.sin(rz) * len, kp[1] - 0.03 - len * 0.98, kp[2] + 0.04], [0.15, -0.42, rz]);
  }
  // сумка и флакон на кушаке (асимметрия)
  A.add(new THREE.BoxGeometry(0.08, 0.09, 0.05), mat.leather, [0.24, 0.92, 0.1], [0, 0.6, -0.05]);
  A.add(new THREE.BoxGeometry(0.084, 0.03, 0.054), mat.leatherDark, [0.24, 0.965, 0.1], [0, 0.6, -0.05]);
  A.add(new THREE.SphereGeometry(0.032, 10, 8), mat.potion, [-0.25, 0.9, -0.06]);
  A.add(new THREE.CylinderGeometry(0.011, 0.013, 0.04, 8), mat.parchment, [-0.25, 0.94, -0.06]);
  A.into(body);
  return { body, coat };
}

// Наплечная пелерина с распахом спереди и золотой рунной каймой
function createMantle(mat) {
  const g = new THREE.Group();
  const A = new Assembler();
  const OPEN = 0.42;
  const m = clothFn({ profile: [[0.14, 1.6], [0.26, 1.54], [0.35, 1.44], [0.39, 1.33], [0.4, 1.27]], folds: 8, foldDepth: 0.06, foldTop: 1.55, seed: 4, flatten: 0.9 });
  A.add(surface(m, OPEN, TAU - OPEN, 1.27, 1.6, 40, 10, 1, 4, 1), mat.robe);
  A.add(surface(m, OPEN, TAU - OPEN, 1.27, 1.34, 52, 2, 1.012, 12, 1), mat.band);
  A.add(ringEdge(m, 1.272, OPEN, TAU - OPEN, 30, 1.016, 0.01), mat.gold);
  for (const s of [-1, 1]) A.add(strip(m, () => s * (OPEN + 0.05), 0.05, 1.27, 1.6, 8, 1.016, 3), mat.trim);
  // застёжка-брошь
  A.add(new THREE.TorusGeometry(0.026, 0.008, 6, 14), mat.gold, [0, 1.5, 0.22]);
  A.add(new THREE.OctahedronGeometry(0.018), mat.core, [0, 1.5, 0.23]);
  A.into(g);
  return g;
}

// Глубокий округлый капюшон, лицо в тени, светящиеся глаза
function createHoodAndHead(mat) {
  const head = new THREE.Group(); head.position.set(0, 1.66, 0.0);
  const A = new Assembler();
  // лицо и шея (в тени капюшона)
  A.add(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), mat.skin, [0, -0.1, 0]);
  A.add(new THREE.SphereGeometry(0.1, 18, 14), mat.skin, [0, -0.01, 0.0], [0, 0, 0], [0.92, 1.1, 0.98]);
  A.add(new THREE.SphereGeometry(0.13, 16, 10, 0, TAU, 0, Math.PI * 0.3), mat.shadow, [0, 0.035, -0.005], [0.22, 0, 0], [1, 1, 1.05]);
  A.add(new THREE.ConeGeometry(0.016, 0.036, 6), mat.skin, [0, -0.015, 0.103], [Math.PI / 2 + 0.3, 0, 0]);
  A.add(new THREE.BoxGeometry(0.045, 0.007, 0.01), mat.shadow, [0, -0.06, 0.09]);
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-0.022, 0.003); eyeShape.quadraticCurveTo(0, 0.012, 0.024, -0.004); eyeShape.quadraticCurveTo(0, 0.002, -0.022, 0.003);
  const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, { depth: 0.004, bevelEnabled: false });
  A.add(eyeGeo, mat.eye, [0.036, 0.015, 0.088], [0, 0.3, -0.1]);
  A.add(eyeGeo, mat.eye, [-0.036, 0.015, 0.088], [0, -0.3, 0.1], [-1, 1, 1]);
  // брови-тени
  A.add(new THREE.BoxGeometry(0.05, 0.012, 0.014), mat.shadow, [0.036, 0.034, 0.085], [0, 0.3, -0.15]);
  A.add(new THREE.BoxGeometry(0.05, 0.012, 0.014), mat.shadow, [-0.036, 0.034, 0.085], [0, -0.3, 0.15]);
  // капюшон: объёмная сфера с вырезом для лица, мягкий пик сверху, складки
  const hood = new THREE.SphereGeometry(0.2, 30, 20, Math.PI * 0.33, Math.PI * 1.34, 0, Math.PI * 0.82);
  hood.rotateY(Math.PI / 2);
  const hp = hood.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
    const up = Math.max(0, y / 0.2);
    y += Math.pow(up, 3) * 0.05; z -= Math.pow(up, 3) * 0.05;          // мягкий пик
    if (y < 0) { x *= 1 + (-y) * 1.4; z *= 1 + (-y) * 0.8; }            // ниспадает на плечи
    const fold = Math.sin(Math.atan2(x, z) * 6) * 0.012 * (1 - up);
    hp.setXYZ(i, x * (1 + fold * 4), y, z * (1 + fold * 4));
  }
  hood.computeVertexNormals();
  A.add(hood, mat.robe, [0, 0.03, -0.02], [0, 0, 0], [1.1, 1.15, 1.12]);
  // утолщённая кромка капюшона с золотом
  const rim = [];
  for (let k = 0; k <= 22; k++) { const a = -1.35 + (k / 22) * 2.7; rim.push(V(Math.sin(a) * 0.19, Math.cos(a) * 0.17, 0.13 + Math.cos(a) * 0.05)); }
  A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim), 44, 0.026, 8, false), mat.robe);
  A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim.map((p) => p.clone().add(V(0, 0, 0.022)))), 44, 0.009, 5, false), mat.gold);
  A.into(head);
  return head;
}

// Рука: рукав — локоть — широкий раструб с рунной манжетой — перчатка и кисть
function createArm(mat, side, handOpts) {
  const shoulder = new THREE.Group(); shoulder.position.set(side * 0.31, 1.4, 0);
  const A = new Assembler();
  A.add(taperTube([V(0, 0.02, 0), V(side * 0.015, -0.13, 0.005), V(0, -0.25, 0)], [0.08, 0.075, 0.07], 10, 12), mat.robe);
  A.add(new THREE.TorusGeometry(0.072, 0.014, 6, 16), mat.robeDark, [0, -0.13, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9]);
  A.into(shoulder);
  const elbow = new THREE.Group(); elbow.position.y = -0.25; shoulder.add(elbow);
  const B = new Assembler();
  const sl = clothFn({ profile: [[0.066, 0.0], [0.075, -0.08], [0.1, -0.17], [0.13, -0.25], [0.138, -0.28]], folds: 6, foldDepth: 0.1, foldTop: 0.0, seed: side * 2, flatten: 1 });
  B.add(surface(sl, 0, TAU, -0.28, 0.0, 22, 8, 1, 2, 1), mat.robe);
  B.add(surface(sl, 0, TAU, -0.28, -0.2, 32, 2, 1.015, 5, 1), mat.band);
  B.add(ringEdge(sl, -0.279, 0, TAU, 20, 1.02, 0.01), mat.gold);
  B.add(new THREE.CylinderGeometry(0.045, 0.047, 0.11, 10), mat.glove, [0, -0.25, 0]);
  B.add(new THREE.TorusGeometry(0.048, 0.008, 4, 12), mat.gold, [0, -0.2, 0], [Math.PI / 2, 0, 0]);
  B.into(elbow);
  const wrist = new THREE.Group(); wrist.position.y = -0.31; elbow.add(wrist);
  const H = new Assembler();
  addHand(H, mat.glove, handOpts);
  H.into(wrist);
  return { shoulder, elbow, wrist };
}

// Золотой посох: витое древко, ажурная оправа-«пламя», кристалл и кольцо орбиты
function createStaff(mat) {
  const staff = new THREE.Group();
  const A = new Assembler();
  const L = 2.0;
  A.add(taperTube([V(0, -0.62, 0), V(0.008, 0, 0.004), V(-0.006, 0.6, -0.004), V(0, L - 0.62, 0)], [0.02, 0.026, 0.026, 0.03], 32, 8), mat.wood);
  // две золотые спирали вокруг древка
  for (const ph of [0, Math.PI]) {
    const hel = [];
    for (let k = 0; k <= 60; k++) { const y = -0.55 + k * (L - 0.25) / 60, a = ph + k * 0.55; hel.push(V(Math.cos(a) * 0.03, y, Math.sin(a) * 0.03)); }
    A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), 110, 0.009, 4, false), mat.gold);
  }
  for (const y of [-0.5, -0.1, 0.4, 0.95]) A.add(new THREE.TorusGeometry(0.036, 0.011, 6, 16), mat.gold, [0, y, 0], [Math.PI / 2, 0, 0]);
  A.add(new THREE.ConeGeometry(0.03, 0.14, 8), mat.gold, [0, -0.69, 0], [Math.PI, 0, 0]);
  A.into(staff);
  const headPivot = new THREE.Group(); headPivot.position.y = L - 0.6; staff.add(headPivot);
  const H = new Assembler();
  H.add(new THREE.CylinderGeometry(0.06, 0.035, 0.1, 12), mat.gold, [0, 0, 0]);
  H.add(new THREE.TorusGeometry(0.06, 0.012, 6, 18), mat.gold, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
  // ажурная оправа в форме пламени (две перекрещенные пластины с вырезом)
  const flame = new THREE.Shape();
  flame.moveTo(0, -0.02); flame.bezierCurveTo(0.13, 0.04, 0.15, 0.2, 0.06, 0.3); flame.quadraticCurveTo(0.02, 0.36, 0, 0.42);
  flame.quadraticCurveTo(-0.02, 0.36, -0.06, 0.3); flame.bezierCurveTo(-0.15, 0.2, -0.13, 0.04, 0, -0.02);
  const fh = new THREE.Path();
  fh.moveTo(0, 0.02); fh.bezierCurveTo(0.1, 0.07, 0.11, 0.2, 0.045, 0.28); fh.quadraticCurveTo(0.015, 0.33, 0, 0.37);
  fh.quadraticCurveTo(-0.015, 0.33, -0.045, 0.28); fh.bezierCurveTo(-0.11, 0.2, -0.1, 0.07, 0, 0.02);
  flame.holes.push(fh);
  const fg = new THREE.ExtrudeGeometry(flame, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 2, curveSegments: 16 });
  fg.translate(0, 0.04, -0.007);
  H.add(fg, mat.gold); H.add(fg, mat.gold, [0, 0, 0], [0, Math.PI / 2, 0]);
  // завитки у основания
  for (let k = 0; k < 4; k++) H.add(new THREE.TorusGeometry(0.035, 0.008, 5, 12, Math.PI * 1.4), mat.gold, [Math.cos(k * TAU / 4) * 0.07, 0.07, Math.sin(k * TAU / 4) * 0.07], [0, -k * TAU / 4, 0]);
  H.into(headPivot);
  const crystal = new THREE.Group(); crystal.position.y = 0.2; headPivot.add(crystal);
  const cg = new THREE.OctahedronGeometry(0.06, 0); cg.scale(0.8, 2.0, 0.8);
  const core = new THREE.Mesh(cg, mat.core); crystal.add(core);
  const shellGeo = new THREE.OctahedronGeometry(0.075, 0); shellGeo.scale(0.8, 1.9, 0.8);
  const shell = new THREE.Mesh(shellGeo, mat.shell); crystal.add(shell);
  // кольцо орбиты и осколки
  const shards = new THREE.Group(); crystal.add(shards);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.005, 6, 48), mat.spark); ring.rotation.x = Math.PI / 2 - 0.35; shards.add(ring);
  for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.014), mat.spark); const a = k * TAU / 4; s.position.set(Math.cos(a) * 0.17, Math.sin(a) * 0.17 * Math.sin(0.35), Math.sin(a) * 0.17 * Math.cos(0.35)); s.scale.y = 1.8; shards.add(s); }
  return { staff, headPivot, crystal, core, shell, shards };
}

// Крупный сгусток магии на раскрытой ладони: ядро, оболочка, спираль, искры
function createMagicOrb(mat) {
  const orb = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 2), mat.core); orb.add(core);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.095, 2), mat.shell); orb.add(shell);
  const swirl = new THREE.Group(); orb.add(swirl);
  for (let arm = 0; arm < 2; arm++) {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const t = k / 30, a = arm * Math.PI + t * TAU * 1.2, r = 0.02 + t * 0.065; pts.push(V(Math.cos(a) * r, (t - 0.5) * 0.04, Math.sin(a) * r)); }
    swirl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.005, 4, false), mat.spark));
  }
  const sparks = new THREE.Group(); orb.add(sparks);
  for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.012), mat.spark); s.userData.a = k * TAU / 5; s.userData.tilt = k * 0.8; sparks.add(s); }
  return { orb, core, shell, swirl, sparks };
}

// ---------------------------------------------------------------------
//  Сборка героя
// ---------------------------------------------------------------------
export function buildHero() {
  const mat = makeMaterials(makeMaps());
  const root = new THREE.Group();
  const legs = createLegs(mat);
  for (const l of legs) root.add(l.hip);

  const body = new THREE.Group(); root.add(body);              // дыхание и наклон корпуса
  const { body: torso } = createTorsoAndRobe(mat);
  body.add(torso);
  body.add(createMantle(mat));
  const headPivot = createHoodAndHead(mat); body.add(headPivot);

  const armL = createArm(mat, 1, { spread: true });            // левая (+X) — сгусток магии на ладони
  const armR = createArm(mat, -1, { grip: true });             // правая (−X) — посох
  body.add(armL.shoulder, armR.shoulder);
  const M = createMagicOrb(mat);
  M.orb.position.set(0.0, -0.13, 0.09); armL.wrist.add(M.orb);
  const S = createStaff(mat);
  S.staff.position.set(0, -0.08, 0.035); armR.wrist.add(S.staff);

  // мягкий цветной рефлекс от сгустка (малый радиус, без пересвета)
  const orbLight = new THREE.PointLight('#a060ff', 1.2, 1.8, 2);
  M.orb.add(orbLight);

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  M.shell.castShadow = false; S.shell.castShadow = false;

  const st = { walk: 0 };
  return {
    root, crystal: S.crystal, orb: M.orb,
    update(t, p, dt) {
      const mv = p.moving ? 1 : 0;
      st.walk += dt * (p.moving ? 9 : 0);
      const S1 = Math.sin(st.walk), C1 = Math.cos(st.walk);
      const cast = p.castT > 0 ? Math.min(1, p.castT / 0.15) : 0;

      // ходьба: шаг бедром и сгиб колена
      legs[0].hip.rotation.x = S1 * 0.5 * mv; legs[1].hip.rotation.x = -S1 * 0.5 * mv;
      legs[0].knee.rotation.x = Math.max(0, -S1) * 0.75 * mv; legs[1].knee.rotation.x = Math.max(0, S1) * 0.75 * mv;
      root.position.y = Math.abs(C1) * 0.03 * mv;

      // дыхание, наклон, лёгкий поворот корпуса
      const breath = Math.sin(t * 1.8) * 0.012;
      body.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
      body.rotation.x = 0.08 * mv + cast * 0.04;
      body.rotation.z = S1 * 0.03 * mv;
      body.rotation.y = S1 * 0.05 * mv;
      headPivot.rotation.y = Math.sin(t * 0.6) * 0.12;

      // левая рука отведена в сторону, ладонь со сгустком вперёд; при касте поднимается
      armL.shoulder.rotation.x = -0.35 - S1 * 0.15 * mv - cast * 0.6;
      armL.shoulder.rotation.z = 0.55 + cast * 0.2;
      armL.elbow.rotation.x = -0.85;
      armL.wrist.rotation.x = 0.35;
      // правая рука держит посох вертикально
      armR.shoulder.rotation.x = S1 * 0.2 * mv - 0.3 - cast * 0.3;
      armR.shoulder.rotation.z = -0.2;
      armR.elbow.rotation.x = -0.75 + cast * 0.15;
      armR.wrist.rotation.x = 1.05 - cast * 0.15;
      armR.wrist.rotation.z = 0.2;

      // магия: пульсация кристалла и сгустка насыщенным цветом
      const hb = p.heart >= 100;
      const pulse = hb ? 0.5 + 0.5 * Math.sin(t * 9) : 0.5 + 0.5 * Math.sin(t * 2.5);
      mat.core.emissiveIntensity = 1.2 + pulse * (hb ? 0.6 : 0.25) + cast * 0.4;
      S.crystal.scale.setScalar(1 + (hb ? pulse * 0.08 : 0));
      S.shell.rotation.y = t * 0.8;
      S.shards.rotation.y = t * 1.4;
      M.core.scale.setScalar(1 + Math.sin(t * 6) * 0.06 + cast * 0.3);
      M.shell.rotation.set(t * 0.7, t * 1.1, 0);
      M.swirl.rotation.y = -t * 2.4;
      for (const s of M.sparks.children) {
        const a = s.userData.a + t * 3;
        s.position.set(Math.cos(a) * 0.13, Math.sin(a * 1.3 + s.userData.tilt) * 0.06, Math.sin(a) * 0.13);
        s.rotation.set(a, a * 0.7, 0);
      }
      orbLight.intensity = 0.9 + cast * 1.5 + pulse * 0.3;
    },
  };
}
