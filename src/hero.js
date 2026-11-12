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

function canvasTex(size, draw, { srgb = false, rep = [1, 1] } = {}) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d'), size);
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
    for (let k = 0; k < 40; k++) { const x = r() * S, y = r() * S, s = 10 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
  }, { srgb: true, rep: [3, 3] });
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
  // вышивка табарда: золотая рунная полоса на тёмной ткани (альбедо + металличность)
  const embroid = (g, S, gold, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    g.strokeStyle = gold; g.fillStyle = gold; g.lineWidth = 5;
    g.strokeRect(14, 6, S - 28, S * 4 - 12);
    g.lineWidth = 3; g.strokeRect(26, 6, S - 52, S * 4);
    for (let k = 0; k < 4; k++) {
      const cy = S * (0.15 + k * 0.23);
      g.beginPath(); g.moveTo(S / 2, cy - 22); g.lineTo(S / 2 + 18, cy); g.lineTo(S / 2, cy + 22); g.lineTo(S / 2 - 18, cy); g.closePath(); g.stroke();
      g.beginPath(); g.arc(S / 2, cy, 5, 0, TAU); g.fill();
    }
    // нижняя бахрома-«зубцы»
    for (let x = 14; x < S - 14; x += 16) { g.beginPath(); g.moveTo(x, S - 20); g.lineTo(x + 8, S - 4); g.lineTo(x + 16, S - 20); g.fill(); }
  };
  M.tabardAlbedo = canvasTex(128, (g, S) => embroid(g, S, '#e0b860', '#3a1030'), { srgb: true });
  M.tabardMetal = canvasTex(128, (g, S) => embroid(g, S, '#ffffff', '#000000'));
  return M;
}

// ---------------------------------------------------------------------
//  Материалы
// ---------------------------------------------------------------------
function makeMaterials(M) {
  const S = (o) => new THREE.MeshStandardMaterial(o);
  return {
    robe: S({ color: '#3b1d6e', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.2, roughnessMap: M.fabricRough, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide }),
    robeDark: S({ color: '#1f1036', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.0, roughnessMap: M.fabricRough, roughness: 0.9, metalness: 0.03, side: THREE.DoubleSide }),
    scarf: S({ color: '#5b2c8e', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.5, roughnessMap: M.fabricRough, roughness: 0.88, metalness: 0.04, side: THREE.DoubleSide }),
    cape: S({ color: '#24113f', map: M.fabricAlbedo, bumpMap: M.fabricBump, bumpScale: 1.2, roughnessMap: M.fabricRough, roughness: 0.9, metalness: 0.03, side: THREE.DoubleSide }),
    capeInner: S({ color: '#5a1a3a', map: M.fabricAlbedo, roughness: 0.85, metalness: 0.03, side: THREE.DoubleSide }),
    gold: S({ color: '#c49a45', roughnessMap: M.metalRough, roughness: 0.25, metalness: 0.88, bumpMap: M.metalBump, bumpScale: 0.4, emissive: '#2a1804', emissiveIntensity: 0.6 }),
    steel: S({ color: '#6a5a92', roughnessMap: M.metalRough, roughness: 0.34, metalness: 0.6, bumpMap: M.metalBump, bumpScale: 0.5, emissive: '#0c0618', emissiveIntensity: 1 }),
    leather: S({ color: '#4a2c1c', bumpMap: M.leatherBump, bumpScale: 1.4, roughnessMap: M.leatherRough, roughness: 0.62, metalness: 0.0 }),
    leatherDark: S({ color: '#24160f', bumpMap: M.leatherBump, bumpScale: 1.2, roughnessMap: M.leatherRough, roughness: 0.55, metalness: 0.0 }),
    wood: S({ color: '#5a3a26', map: M.woodAlbedo, bumpMap: M.woodBump, bumpScale: 1.5, roughness: 0.7, metalness: 0.0 }),
    tabard: S({ color: '#ffffff', map: M.tabardAlbedo, metalnessMap: M.tabardMetal, metalness: 0.9, roughness: 0.55, side: THREE.DoubleSide }),
    shadow: S({ color: '#030106', roughness: 1, metalness: 0 }),
    mask: S({ color: '#1c1326', bumpMap: M.leatherBump, bumpScale: 1, roughness: 0.6, metalness: 0.1 }),
    eye: S({ color: '#000000', emissive: '#c8a2ff', emissiveIntensity: 2.4, roughness: 1 }),
    // магия: плотное цветное ядро без ухода в белый
    core: S({ color: '#2a0a4a', emissive: '#9a4dff', emissiveIntensity: 1.35, roughness: 0.3, metalness: 0 }),
    shell: new THREE.MeshPhysicalMaterial({ color: '#c9a2ff', emissive: '#5a22d0', emissiveIntensity: 0.45, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    spark: S({ color: '#1a0830', emissive: '#d090ff', emissiveIntensity: 1.6, roughness: 0.4 }),
    potion: S({ color: '#30d0a0', emissive: '#10a070', emissiveIntensity: 0.8, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.85 }),
    parchment: S({ color: '#c8b28a', roughness: 0.9 }),
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

// Профиль вращения с плавной интерполяцией (много рядов — для складок)
function smoothProfile(pts, rows) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  return curve.getSpacedPoints(rows);
}

// Мантия: Lathe + складки + асимметрия + V-разрез спереди (phi = 0 — это +Z)
function robeGeometry(profile, { folds = 9, foldDepth = 0.07, foldTop = 1.0, slitTop = 0, slitHalf = 0, seed = 1, flatten = 0.84, seg = 48, rows = 34 }) {
  const pts = smoothProfile(profile, rows);
  const g = new THREE.LatheGeometry(pts, seg);
  const pos = g.attributes.position, uv = g.attributes.uv;
  const yMin = Math.min(...profile.map((p) => p[1]));
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const phi = Math.atan2(x, z), r = Math.hypot(x, z);
    // вертикальные складки сильнее к подолу
    const k = Math.max(0, Math.min(1, (foldTop - y) / (foldTop - yMin)));
    const fold = Math.sin(phi * folds + Math.sin(y * 3 + seed) * 0.8) * foldDepth * Math.pow(k, 1.3)
      + Math.sin(phi * (folds * 2 + 3) + seed) * foldDepth * 0.3 * k;
    const asym = 1 + Math.sin(phi + seed) * 0.03 * k;
    const nr = r * (1 + fold) * asym;
    x = Math.sin(phi) * nr; z = Math.cos(phi) * nr * flatten;
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, phi / TAU * 4, y * 2);
  }
  // V-разрез: убираем треугольники у переднего края подола
  if (slitHalf > 0) {
    const idx = g.index.array, keep = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let t = 0; t < idx.length; t += 3) {
      a.fromBufferAttribute(pos, idx[t]); b.fromBufferAttribute(pos, idx[t + 1]); c.fromBufferAttribute(pos, idx[t + 2]);
      const cy = (a.y + b.y + c.y) / 3, cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3;
      const phi = Math.atan2(cx, cz);
      const lim = slitHalf * Math.max(0, (slitTop - cy) / (slitTop - yMin));
      if (cy < slitTop && Math.abs(phi) < lim) continue;
      keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
  }
  g.computeVertexNormals();
  return g;
}

// Край подола (для золотой каймы): точки нижнего ряда с учётом разреза
function hemCurve(geo, yLevel, tol, slitHalf) {
  const pos = geo.attributes.position, pts = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (Math.abs(y - yLevel) < tol) {
      const x = pos.getX(i), z = pos.getZ(i), phi = Math.atan2(x, z);
      if (Math.abs(phi) >= slitHalf) pts.push({ phi: phi < 0 ? phi + TAU : phi, v: V(x, y, z) });
    }
  }
  pts.sort((a, b) => a.phi - b.phi);
  const out = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p.v) > 0.01) out.push(p.v);
  return out;
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
//  Части тела
// ---------------------------------------------------------------------
function createLegs(mat) {
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.875, 0);
    const A = new Assembler();
    A.add(new THREE.CylinderGeometry(0.075, 0.064, 0.44, 12), mat.robeDark, [0, -0.22, 0]);
    A.into(hip);
    const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
    const B = new Assembler();
    // высокий кожаный сапог (lathe), отворот и пряжка
    const boot = new THREE.LatheGeometry([[0.0, -0.4], [0.06, -0.4], [0.064, -0.34], [0.06, -0.2], [0.066, -0.05], [0.082, 0.02], [0.088, 0.06], [0.0, 0.06]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
    B.add(boot, mat.leather, [0, 0, 0]);
    B.add(new THREE.TorusGeometry(0.084, 0.016, 6, 18), mat.leatherDark, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
    B.add(new THREE.TorusGeometry(0.064, 0.008, 4, 16), mat.leatherDark, [0, -0.2, 0], [Math.PI / 2, 0, 0]);
    B.add(new THREE.BoxGeometry(0.03, 0.022, 0.012), mat.gold, [s * 0.02, -0.2, 0.064]);
    // стопа и подошва
    B.add(new THREE.CapsuleGeometry(0.048, 0.12, 4, 10), mat.leather, [0, -0.38, 0.06], [Math.PI / 2, 0, 0], [1, 1, 0.75]);
    B.add(new THREE.BoxGeometry(0.1, 0.022, 0.24), mat.leatherDark, [0, -0.425, 0.06]);
    B.into(knee);
    legs.push({ hip, knee });
  }
  return legs;
}

function createTorsoAndRobe(mat) {
  const body = new THREE.Group();
  const A = new Assembler();
  // Профиль: широкий подол (А-силуэт) — талия — грудь — широкие плечи — шея
  const profile = [[0.0, 1.56], [0.1, 1.54], [0.2, 1.5], [0.29, 1.44], [0.3, 1.36], [0.27, 1.22], [0.22, 1.06], [0.235, 0.98], [0.3, 0.75], [0.4, 0.45], [0.5, 0.18], [0.56, 0.06]];
  const SLIT = 0.5;
  const robe = robeGeometry(profile, { folds: 9, foldDepth: 0.075, foldTop: 0.98, slitTop: 0.78, slitHalf: SLIT, seed: 1.7 });
  A.add(robe, mat.robe);
  // подкладка — тёмная внутренняя сторона, видна в разрезе
  const lining = robeGeometry(profile.filter((p) => p[1] < 1.0).map(([r, y]) => [r * 0.96, y]), { folds: 9, foldDepth: 0.07, foldTop: 0.98, seed: 1.7, seg: 36, rows: 14 });
  A.add(lining, mat.capeInner);
  // золотая кайма по подолу и по краям разреза
  const hem = hemCurve(robe, 0.06, 0.02, SLIT * 0.98);
  if (hem.length > 4) A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hem), 90, 0.014, 5, false), mat.gold);
  for (const s of [-1, 1]) {
    const edge = [];
    for (let y = 0.07; y <= 0.78; y += 0.06) {
      const lim = SLIT * (0.78 - y) / (0.78 - 0.06);
      const r = 0.56 - (0.56 - 0.3) * (y - 0.06) / 0.72;
      edge.push(V(Math.sin(s * lim) * r, y, Math.cos(s * lim) * r * 0.84));
    }
    A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 24, 0.012, 6, false), mat.gold);
  }
  // пояс с массивной пряжкой
  A.add(new THREE.TorusGeometry(0.236, 0.03, 8, 40), mat.leather, [0, 1.0, 0], [Math.PI / 2, 0, 0], [1, 0.84, 1.15]);
  const buckleShape = new THREE.Shape();
  buckleShape.moveTo(-0.06, -0.045); buckleShape.lineTo(0.06, -0.045); buckleShape.quadraticCurveTo(0.075, 0, 0.06, 0.045); buckleShape.lineTo(-0.06, 0.045); buckleShape.quadraticCurveTo(-0.075, 0, -0.06, -0.045);
  const hole = new THREE.Path(); hole.moveTo(-0.035, -0.022); hole.lineTo(0.035, -0.022); hole.lineTo(0.035, 0.022); hole.lineTo(-0.035, 0.022); hole.lineTo(-0.035, -0.022);
  buckleShape.holes.push(hole);
  A.add(new THREE.ExtrudeGeometry(buckleShape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 }), mat.gold, [0, 1.0, 0.2]);
  A.add(new THREE.OctahedronGeometry(0.02), mat.core, [0, 1.0, 0.222]);
  // кожаная перевязь через грудь с заклёпками
  const strap = [V(0.22, 1.42, 0.12), V(0.12, 1.3, 0.24), V(-0.05, 1.15, 0.24), V(-0.2, 1.02, 0.15)];
  A.add(taperTube(strap, [0.022, 0.022, 0.022, 0.022], 20, 6), mat.leatherDark);
  const sc = new THREE.CatmullRomCurve3(strap);
  for (let i = 1; i < 4; i++) { const p = sc.getPointAt(i / 4); A.add(new THREE.SphereGeometry(0.011, 6, 5), mat.gold, [p.x, p.y, p.z + 0.012]); }
  // сумки на поясе: флакон, свиток, кошель (асимметрия)
  A.add(new THREE.BoxGeometry(0.08, 0.09, 0.05), mat.leather, [-0.22, 0.93, 0.08], [0, -0.5, 0.05]);
  A.add(new THREE.BoxGeometry(0.084, 0.03, 0.054), mat.leatherDark, [-0.22, 0.975, 0.08], [0, -0.5, 0.05]);
  A.add(new THREE.SphereGeometry(0.035, 10, 8), mat.potion, [0.21, 0.92, 0.1]);
  A.add(new THREE.CylinderGeometry(0.012, 0.014, 0.04, 8), mat.parchment, [0.21, 0.965, 0.1]);
  A.add(new THREE.TorusGeometry(0.02, 0.006, 4, 10), mat.gold, [0.21, 0.952, 0.1], [Math.PI / 2, 0, 0]);
  A.add(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 10), mat.parchment, [-0.08, 0.97, -0.22], [0, 0, Math.PI / 2 - 0.3]);
  A.add(new THREE.TorusGeometry(0.024, 0.006, 4, 10), mat.leatherDark, [-0.08, 0.97, -0.22], [0, Math.PI / 2, 0.3]);
  A.into(body);

  // табард с вышивкой, свисает спереди (своя сетка — колышется при ходьбе)
  const tabGeo = new THREE.PlaneGeometry(0.2, 0.74, 4, 16);
  tabGeo.translate(0, -0.37, 0);
  const tp = tabGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), x = tp.getX(i); tp.setZ(i, -x * x * 1.5 + (-y) * 0.18); }
  tabGeo.computeVertexNormals();
  const tabard = new THREE.Mesh(tabGeo, mat.tabard);
  tabard.position.set(0, 0.97, 0.22); tabard.castShadow = true;
  body.add(tabard);
  return { body, tabard };
}

function createPauldrons(mat) {
  const g = new THREE.Group();
  const A = new Assembler();
  for (const s of [-1, 1]) {
    // три накладывающихся изогнутых пластины (закрывают плечо сверху и снаружи) с золотой окантовкой
    for (let k = 0; k < 3; k++) {
      const r = 0.17 - k * 0.018, y = 1.47 - k * 0.06, x = s * (0.25 + k * 0.03);
      const ps = new THREE.SphereGeometry(r, 20, 8, -Math.PI * 0.62, Math.PI * 1.24, 0, Math.PI * 0.36);
      ps.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);           // пластина смотрит наружу
      A.add(ps, mat.steel, [x, y, 0], [0, 0, -s * (0.55 + k * 0.15)], [1, 0.55, 1.1]);
      const edge = [];
      for (let q = 0; q <= 16; q++) {
        const ph = -Math.PI * 0.62 + (q / 16) * Math.PI * 1.24 + (s > 0 ? Math.PI / 2 : -Math.PI / 2), th = Math.PI * 0.36;
        edge.push(V(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r));
      }
      A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 32, 0.009, 5, false), mat.gold, [x, y, 0], [0, 0, -s * (0.55 + k * 0.15)], [1, 0.55, 1.1]);
    }
    A.add(new THREE.SphereGeometry(0.022, 8, 6), mat.gold, [s * 0.3, 1.52, 0.02]);
    A.add(new THREE.OctahedronGeometry(0.018), mat.core, [s * 0.3, 1.52, 0.04]);
  }
  A.into(g);
  return g;
}

function createHoodAndHead(mat) {
  const head = new THREE.Group(); head.position.set(0, 1.6, 0.0);
  const A = new Assembler();
  // объёмный шарф-воротник
  A.add(taperTube([V(0.0, -0.03, 0.12), V(0.13, -0.02, 0.05), V(0.12, -0.0, -0.1), V(-0.05, -0.01, -0.14), V(-0.14, -0.03, 0.0), V(-0.06, -0.05, 0.12), V(0.02, -0.06, 0.13)], [0.05, 0.06, 0.055, 0.06, 0.058, 0.05, 0.045], 40, 10), mat.scarf);
  A.add(taperTube([V(0.04, -0.06, 0.13), V(0.06, -0.16, 0.16), V(0.05, -0.28, 0.17)], [0.04, 0.035, 0.02], 12, 8), mat.scarf, [0, 0, 0], [0, 0, 0], [1.4, 1, 0.5]);
  // наплечная пелерина — второй слой капюшона
  const mantle = robeGeometry([[0.0, 0.0], [0.12, -0.02], [0.2, -0.08], [0.3, -0.16], [0.34, -0.2]], { folds: 7, foldDepth: 0.08, foldTop: -0.02, seed: 3, flatten: 0.9, seg: 36, rows: 8 });
  A.add(mantle, mat.robe, [0, 0, -0.02]);
  // капюшон: сфера с открытым лицом, вытянутая в остроконечный хвост назад
  const hood = new THREE.SphereGeometry(0.2, 28, 18, Math.PI * 0.3, Math.PI * 1.4, 0, Math.PI * 0.86);
  hood.rotateY(Math.PI / 2);  // открытая часть смотрит вперёд (+Z)
  const hp = hood.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
    const up = Math.max(0, y / 0.2);
    z -= Math.pow(up, 2.2) * 0.17; y += Math.pow(up, 2) * 0.1;              // остроконечный хвост назад-вверх
    x *= 1 - Math.pow(up, 2) * 0.35;
    if (z > 0.05) { y += 0.025 * (z / 0.2); }                               // козырёк чуть нависает
    const fold = Math.sin(Math.atan2(x, z) * 7) * 0.008 * (1 - up);          // складки на затылке
    hp.setXYZ(i, x * (1 + fold * 5), y, z * (1 + fold * 5));
  }
  hood.computeVertexNormals();
  A.add(hood, mat.robe, [0, 0.03, -0.01], [0, 0, 0], [1.05, 1.1, 1.08]);
  // утолщённый край капюшона с золотой окантовкой
  const rim = [];
  for (let k = 0; k <= 20; k++) { const a = -1.25 + (k / 20) * 2.5; rim.push(V(Math.sin(a) * 0.17, 0.03 + Math.cos(a) * 0.19 - 0.02, 0.1 + Math.cos(a) * 0.06)); }
  A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim), 40, 0.024, 8, false), mat.robe);
  A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim.map((p) => p.clone().add(V(0, 0, 0.018)))), 40, 0.008, 5, false), mat.gold);
  // глубокая тень лица, нижняя маска-подбородок и глаза-клинья
  A.add(new THREE.SphereGeometry(0.135, 16, 12), mat.shadow, [0, 0.0, 0.05], [0, 0, 0], [1, 1.1, 0.8]);
  A.add(new THREE.CylinderGeometry(0.11, 0.08, 0.1, 18, 1, true, -1.3, 2.6), mat.mask, [0, -0.07, 0.07], [0.15, 0, 0]);
  A.add(new THREE.TorusGeometry(0.1, 0.006, 4, 16, 2.4), mat.gold, [0, -0.025, 0.07], [Math.PI / 2 + 0.15, 0, Math.PI / 2 - 1.2]);
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-0.032, 0.004); eyeShape.quadraticCurveTo(0, 0.016, 0.034, -0.006); eyeShape.quadraticCurveTo(0, 0.003, -0.032, 0.004);
  const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, { depth: 0.004, bevelEnabled: false });
  A.add(eyeGeo, mat.eye, [0.045, 0.02, 0.16], [0, 0.25, -0.12]);
  A.add(eyeGeo, mat.eye, [-0.045, 0.02, 0.16], [0, -0.25, 0.12], [-1, 1, 1]);
  A.into(head);
  return head;
}

// Рука: плечо (сегмент рукава) — локоть — предплечье с раструбом, манжета, кисть
function createArm(mat, side, handOpts) {
  const shoulder = new THREE.Group(); shoulder.position.set(side * 0.3, 1.38, 0);
  const A = new Assembler();
  A.add(taperTube([V(0, 0.02, 0), V(side * 0.015, -0.13, 0.005), V(0, -0.26, 0)], [0.075, 0.07, 0.066], 12, 12), mat.robe);
  A.add(new THREE.TorusGeometry(0.068, 0.014, 6, 16), mat.robeDark, [0, -0.13, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9]);   // складка
  A.into(shoulder);
  const elbow = new THREE.Group(); elbow.position.y = -0.26; shoulder.add(elbow);
  const B = new Assembler();
  // широкий рукав-раструб со складками
  const sleeve = robeGeometry([[0.062, 0.0], [0.07, -0.08], [0.09, -0.17], [0.115, -0.24], [0.12, -0.26]], { folds: 6, foldDepth: 0.12, foldTop: 0.0, seed: side * 2, flatten: 1, seg: 24, rows: 8 });
  B.add(sleeve, mat.robe);
  B.add(new THREE.TorusGeometry(0.118, 0.012, 5, 22), mat.gold, [0, -0.255, 0], [Math.PI / 2, 0, 0]);
  B.add(new THREE.CylinderGeometry(0.04, 0.042, 0.1, 10), mat.leatherDark, [0, -0.25, 0]);           // перчатка-краги
  B.add(new THREE.TorusGeometry(0.043, 0.008, 4, 12), mat.gold, [0, -0.205, 0], [Math.PI / 2, 0, 0]);
  B.into(elbow);
  const wrist = new THREE.Group(); wrist.position.y = -0.3; elbow.add(wrist);
  const H = new Assembler();
  addHand(H, mat.leatherDark, handOpts);
  H.into(wrist);
  return { shoulder, elbow, wrist };
}

// Плащ: подразделённая сетка, сужение к плечам, складки, рваный многослойный край
function createCape(mat) {
  const pivot = new THREE.Group(); pivot.position.set(0, 1.47, -0.16);
  const make = (w0, w1, h, seed, matl, z0) => {
    const g = new THREE.PlaneGeometry(1, h, 14, 22);
    g.translate(0, -h / 2, 0);
    const p = g.attributes.position, r = rnd(seed);
    const tear = []; for (let c = 0; c <= 14; c++) tear.push(r() * 0.16 + (c % 3 === 0 ? 0.08 : 0));
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = -p.getY(i) / h;                     // u 0..1, v 0..1 (вниз)
      const w = w0 + (w1 - w0) * Math.pow(v, 0.8);
      const x = (u - 0.5) * w;
      let y = p.getY(i);
      const col = Math.round(u * 14);
      if (v > 0.98) y += tear[col];                                         // рваный край
      const z = -Math.pow(x / (w * 0.5), 2) * 0.12 * (0.3 + v) - v * 0.12 + Math.sin(u * TAU * 3.5 + seed) * 0.03 * v + z0;
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    g.userData.base = Float32Array.from(p.array);
    const m = new THREE.Mesh(g, matl); m.castShadow = true;
    return m;
  };
  const outer = make(0.44, 0.95, 1.38, 5, mat.cape, 0);
  const inner = make(0.42, 0.9, 1.3, 9, mat.capeInner, 0.012);
  const top = make(0.5, 0.78, 0.5, 13, mat.robe, -0.02);                    // короткий верхний слой
  pivot.add(inner, outer, top);
  const A = new Assembler();
  for (const s of [-1, 1]) {
    A.add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 14), mat.gold, [s * 0.2, 0, 0.02], [Math.PI / 2, 0, 0]);
    A.add(new THREE.OctahedronGeometry(0.014), mat.core, [s * 0.2, 0, 0.03]);
  }
  A.into(pivot);
  return { pivot, layers: [outer, inner, top] };
}

// Посох: изогнутое древко, золотые перехваты, кожаная обмотка, навершие с когтями и кристаллом
function createStaff(mat) {
  const staff = new THREE.Group();
  const A = new Assembler();
  const L = 2.05;
  const shaft = [V(0, -0.62, 0), V(0.012, -0.1, 0.008), V(-0.01, 0.6, -0.006), V(0.006, 1.2, 0.01), V(0, L - 0.62, 0)];
  A.add(taperTube(shaft, [0.022, 0.03, 0.032, 0.03, 0.036], 40, 10), mat.wood);
  // металлический наконечник внизу
  A.add(new THREE.ConeGeometry(0.026, 0.12, 8), mat.steel, [0, -0.68, 0], [Math.PI, 0, 0]);
  A.add(new THREE.CylinderGeometry(0.028, 0.024, 0.06, 10), mat.gold, [0, -0.6, 0]);
  // золотые перехваты
  for (const y of [-0.2, 0.25, 0.85, 1.25]) A.add(new THREE.TorusGeometry(0.035, 0.009, 6, 16), mat.gold, [0, y, 0], [Math.PI / 2, 0, 0]);
  // кожаная обмотка под хватом
  const wrap = [];
  for (let k = 0; k <= 40; k++) { const a = k * 0.9, y = -0.12 + k * 0.007; wrap.push(V(Math.cos(a) * 0.034, y, Math.sin(a) * 0.034)); }
  A.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wrap), 80, 0.007, 4, false), mat.leather);
  A.into(staff);
  // навершие (вращается вокруг оси)
  const headPivot = new THREE.Group(); headPivot.position.y = L - 0.6; staff.add(headPivot);
  const H = new Assembler();
  H.add(new THREE.CylinderGeometry(0.05, 0.035, 0.08, 10), mat.gold, [0, 0, 0]);
  H.add(new THREE.TorusGeometry(0.052, 0.01, 6, 16), mat.gold, [0, 0.04, 0], [Math.PI / 2, 0, 0]);
  // 4 изогнутых когтя
  for (let k = 0; k < 4; k++) {
    const a = k * TAU / 4 + Math.PI / 4;
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const pts = [V(0, 0.04, 0), dir.clone().multiplyScalar(0.07).setY(0.1), dir.clone().multiplyScalar(0.1).setY(0.2), dir.clone().multiplyScalar(0.07).setY(0.3), dir.clone().multiplyScalar(0.025).setY(0.36)];
    H.add(taperTube(pts, [0.016, 0.014, 0.012, 0.008, 0.003], 20, 6), mat.gold);
  }
  H.into(headPivot);
  // кристалл Сердца Эфира: огранённое ядро + полупрозрачная оболочка + осколки на орбите
  const crystal = new THREE.Group(); crystal.position.y = 0.2; headPivot.add(crystal);
  const cg = new THREE.OctahedronGeometry(0.07, 0); cg.scale(0.85, 1.65, 0.85);
  const core = new THREE.Mesh(cg, mat.core); crystal.add(core);
  const shellGeo = new THREE.OctahedronGeometry(0.09, 0); shellGeo.scale(0.85, 1.6, 0.85);
  const shell = new THREE.Mesh(shellGeo, mat.shell); crystal.add(shell);
  const shards = new THREE.Group(); crystal.add(shards);
  for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.016), mat.spark); const a = k * TAU / 3; s.position.set(Math.cos(a) * 0.13, Math.sin(k * 2) * 0.04, Math.sin(a) * 0.13); s.scale.y = 1.8; shards.add(s); }
  return { staff, headPivot, crystal, core, shell, shards };
}

// Сгусток магии над левой ладонью
function createMagicOrb(mat) {
  const orb = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1), mat.core); orb.add(core);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), mat.shell); orb.add(shell);
  const sparks = new THREE.Group(); orb.add(sparks);
  for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.012), mat.spark); s.userData.a = k * TAU / 4; s.userData.tilt = k * 0.8; sparks.add(s); }
  return { orb, core, shell, sparks };
}

// ---------------------------------------------------------------------
//  Сборка героя
// ---------------------------------------------------------------------
export function buildHero() {
  const mat = makeMaterials(makeMaps());
  const root = new THREE.Group();
  const legs = createLegs(mat);
  for (const l of legs) root.add(l.hip);

  const body = new THREE.Group(); root.add(body);              // всё, что дышит и наклоняется
  const { body: torso, tabard } = createTorsoAndRobe(mat);
  body.add(torso);
  body.add(createPauldrons(mat));
  const headPivot = createHoodAndHead(mat); body.add(headPivot);
  const cape = createCape(mat); body.add(cape.pivot);

  const armL = createArm(mat, -1, { spread: true });           // левая рука — сгусток магии
  const armR = createArm(mat, 1, { grip: true });              // правая — посох
  body.add(armL.shoulder, armR.shoulder);
  const M = createMagicOrb(mat);
  M.orb.position.set(0, -0.15, 0.04); armL.wrist.add(M.orb);
  const S = createStaff(mat);
  S.staff.position.set(0, -0.08, 0.035); armR.wrist.add(S.staff);

  // мягкий цветной рефлекс от сгустка на складки и золото (малый радиус)
  const orbLight = new THREE.PointLight('#a060ff', 1.2, 1.6, 2);
  M.orb.add(orbLight);

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  M.shell.castShadow = false; S.shell.castShadow = false;

  const st = { walk: 0 };
  const capeBase = cape.layers.map((m) => m.geometry.userData.base);

  return {
    root, crystal: S.crystal, orb: M.orb,
    update(t, p, dt) {
      const mv = p.moving ? 1 : 0;
      st.walk += dt * (p.moving ? 9 : 0);
      const S1 = Math.sin(st.walk), C1 = Math.cos(st.walk);
      const cast = p.castT > 0 ? Math.min(1, p.castT / 0.15) : 0;

      // ходьба: шаг бедром + сгиб колена (ноги не «скользят»)
      legs[0].hip.rotation.x = S1 * 0.55 * mv; legs[1].hip.rotation.x = -S1 * 0.55 * mv;
      legs[0].knee.rotation.x = Math.max(0, -S1) * 0.8 * mv; legs[1].knee.rotation.x = Math.max(0, S1) * 0.8 * mv;
      root.position.y = Math.abs(C1) * 0.035 * mv;

      // дыхание и наклон корпуса
      const breath = Math.sin(t * 1.8) * 0.012;
      body.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
      body.rotation.x = 0.1 * mv + cast * 0.05;
      body.rotation.z = S1 * 0.035 * mv;
      body.rotation.y = S1 * 0.05 * mv;
      headPivot.rotation.y = Math.sin(t * 0.6) * 0.12;
      headPivot.rotation.x = -0.05 * mv;
      tabard.rotation.x = 0.1 * mv + Math.sin(t * 2.4) * 0.03 + S1 * 0.08 * mv;

      // руки: левая поднимает сгусток при касте, правая держит посох
      armL.shoulder.rotation.x = -S1 * 0.3 * mv - 0.35 - cast * 0.9;
      armL.shoulder.rotation.z = -0.18 - cast * 0.25;
      armL.elbow.rotation.x = -0.9 - cast * 0.3;
      armL.wrist.rotation.x = 0.6;
      armR.shoulder.rotation.x = S1 * 0.25 * mv - 0.25 - cast * 0.35;
      armR.shoulder.rotation.z = 0.12;
      armR.elbow.rotation.x = -0.75 + cast * 0.15;
      armR.wrist.rotation.x = 1.0 - cast * 0.2;

      // плащ: волна ткани, сильнее при движении
      cape.pivot.rotation.x = 0.12 + 0.35 * mv + cast * 0.1;
      for (let k = 0; k < cape.layers.length; k++) {
        const g = cape.layers[k].geometry, pos = g.attributes.position, base = capeBase[k];
        for (let i = 0; i < pos.count; i++) {
          const by = base[i * 3 + 1], v = Math.max(0, -by);
          const wave = Math.sin(t * (2.2 + mv * 3) + base[i * 3] * 6 + v * 4 + k) * v * (0.035 + mv * 0.06);
          pos.setZ(i, base[i * 3 + 2] + wave - v * v * 0.1 * mv);
        }
        pos.needsUpdate = true;
      }

      // магия: пульсация кристалла и сгустка (насыщенный цвет, без белого пересвета)
      const hb = p.heart >= 100;
      const pulse = hb ? 0.5 + 0.5 * Math.sin(t * 9) : 0.5 + 0.5 * Math.sin(t * 2.5);
      mat.core.emissiveIntensity = 1.2 + pulse * (hb ? 0.6 : 0.25) + cast * 0.4;
      S.crystal.scale.setScalar(1 + (hb ? pulse * 0.08 : 0));
      S.shell.rotation.y = t * 0.8;
      S.shards.rotation.y = t * 1.6;
      S.headPivot.rotation.y = t * 0.4;
      M.core.scale.setScalar(1 + Math.sin(t * 6) * 0.08 + cast * 0.35);
      M.shell.rotation.set(t * 0.7, t * 1.1, 0);
      for (const s of M.sparks.children) {
        const a = s.userData.a + t * 3;
        s.position.set(Math.cos(a) * 0.1, Math.sin(a * 1.3 + s.userData.tilt) * 0.05, Math.sin(a) * 0.1);
        s.rotation.set(a, a * 0.7, 0);
      }
      orbLight.intensity = 0.9 + cast * 1.5 + pulse * 0.3;
    },
  };
}
