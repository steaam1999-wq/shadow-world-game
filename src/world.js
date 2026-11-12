// =====================================================================
//  Окружение глав: земля, освещение, туман, декорации (чанки)
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeGround, rng } from './textures.js';
import { mat, rock, cyl, box, cone, sphere, limb, lathe } from './models.js';

const TAU = Math.PI * 2;
const TILE = 16;      // мировых единиц на повтор текстуры земли
const CHUNK = 12;
const RADIUS = 3;

// сборка декорации: список [geo, mat, x,y,z, rx,ry,rz, sx,sy,sz] -> по материалам
function merge(list) {
  const byMat = new Map();
  for (const [geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1] of list) {
    const g = geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
    const ng = g.index ? g.toNonIndexed() : g;
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m).push(ng);
  }
  return [...byMat].map(([m, geos]) => ({ mat: m, geo: mergeGeometries(geos) }));
}

// ---------------------------------------------------------------------
//  Наборы декораций
// ---------------------------------------------------------------------
function propsFor(kind) {
  const P = [];
  if (kind === 'ruins') {
    const stone = mat('#5d5864', { flat: true, rough: 0.95 }), stone2 = mat('#47434d', { flat: true, rough: 0.95 });
    const iron = mat('#26232b', { metal: 0.7, rough: 0.5 }), coal = mat('#ff5a1a', { emi: '#ff4a10', ei: 3 });
    const col = [];
    col.push([box(1.2, 0.35, 1.2), stone2, 0, 0.17, 0]);
    col.push([cyl(0.42, 0.46, 0.25, 14), stone, 0, 0.45, 0]);
    col.push([cyl(0.36, 0.4, 2.4, 14), stone, 0, 1.75, 0]);
    col.push([rock(0.42, 0, 3, 0.35), stone, 0.05, 2.95, 0, 0, 0, 0, 1, 0.6, 1]);
    P.push({ parts: merge(col), density: 0.55, scale: [0.7, 1.25], clear: 6 });
    P.push({ parts: merge([[cyl(0.38, 0.38, 3.2, 14), stone, 0, 0.38, 0, 0, 0, Math.PI / 2], [rock(0.4, 0, 5), stone2, 1.9, 0.3, 0.3], [rock(0.3, 0, 8), stone, -1.9, 0.25, -0.2]]), density: 0.25, scale: [0.8, 1.1], clear: 6 });
    P.push({ parts: merge([[rock(0.5, 0, 11), stone, 0, 0.25, 0], [rock(0.32, 0, 12), stone2, 0.6, 0.15, 0.3], [rock(0.25, 0, 13), stone, -0.4, 0.12, 0.5], [rock(0.2, 0, 14), stone2, 0.2, 0.1, -0.6]]), density: 1.4, scale: [0.6, 1.4] });
    const wall = [[box(3.2, 1.4, 0.7), stone2, 0, 0.7, 0]];
    for (let i = 0; i < 5; i++) wall.push([rock(0.38, 0, 20 + i), stone, -1.3 + i * 0.65, 1.45 + (i % 2) * 0.25, 0]);
    P.push({ parts: merge(wall), density: 0.3, scale: [0.8, 1.2], clear: 7 });
    const br = [[lathe([[0, 0.9], [0.45, 1.0], [0.55, 1.2], [0.5, 1.25], [0.38, 1.05], [0, 1.0]], 12), iron]];
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; br.push([limb(0.04, 0.03, 1.0, 5), iron, Math.cos(a) * 0.32, 1.0, Math.sin(a) * 0.32, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]); }
    br.push([rock(0.32, 0, 2), coal, 0, 1.12, 0, 0, 0, 0, 1, 0.4, 1]);
    P.push({ parts: merge(br), density: 0.18, scale: [1, 1], clear: 5, emit: [{ kind: 'flame', y: 1.3, size: 1.2, color: '#ff8a3c' }] });
    const fence = [];
    for (let i = 0; i < 6; i++) { fence.push([cyl(0.035, 0.035, 1.8, 5), iron, -1.5 + i * 0.6, 0.9, 0]); fence.push([cone(0.06, 0.18, 4), iron, -1.5 + i * 0.6, 1.88, 0]); }
    fence.push([box(3.3, 0.06, 0.06), iron, 0, 1.55, 0]); fence.push([box(3.3, 0.06, 0.06), iron, 0, 0.35, 0]);
    fence.push([box(0.2, 2.1, 0.2), stone2, -1.75, 1.05, 0]); fence.push([box(0.2, 2.1, 0.2), stone2, 1.75, 1.05, 0]);
    P.push({ parts: merge(fence), density: 0.2, scale: [1, 1], clear: 7 });
  } else if (kind === 'forest') {
    const bark = mat('#2e2219', { flat: true, rough: 1 }), leaf = mat('#1f4a44', { flat: true, rough: 0.9 }), leaf2 = mat('#2c5f50', { flat: true, rough: 0.9 });
    const moss = mat('#3a6a48', { flat: true }), stone = mat('#6a7478', { flat: true, rough: 0.9 });
    const shroom = mat('#7fe8ff', { emi: '#3ad0ff', ei: 1.3 }), stem = mat('#cfd8d0');
    const tree = [[cyl(0.22, 0.42, 3.4, 8), bark, 0, 1.7, 0]];
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; tree.push([limb(0.16, 0.05, 1.0, 5), bark, Math.cos(a) * 0.3, 0.45, Math.sin(a) * 0.3, Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1]); }
    tree.push([rock(1.0, 1, 3, 0.25), leaf, 0, 3.8, 0, 0, 0, 0, 1, 0.75, 1]);
    tree.push([rock(0.7, 1, 4, 0.25), leaf2, 0.7, 3.3, 0.4]);
    tree.push([rock(0.6, 1, 5, 0.25), leaf, -0.6, 3.4, -0.4]);
    P.push({ parts: merge(tree), density: 0.5, scale: [0.8, 1.3], clear: 8 });
    P.push({ parts: merge([[rock(0.6, 1, 7, 0.2), stone, 0, 0.3, 0, 0, 0, 0, 1.3, 0.7, 1], [rock(0.45, 0, 8), moss, 0.1, 0.62, 0, 0, 0, 0, 1.2, 0.35, 1]]), density: 0.9, scale: [0.6, 1.6] });
    const sh = [];
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 0.35 - 0.17, z = Math.floor(i / 2) * 0.3 - 0.15, h = 0.25 + i * 0.08;
      sh.push([cyl(0.04, 0.05, h, 6), stem, x, h / 2, z]);
      sh.push([new THREE.SphereGeometry(0.16 - i * 0.015, 10, 6, 0, TAU, 0, Math.PI / 2), shroom, x, h, z]);
    }
    P.push({ parts: merge(sh), density: 0.6, scale: [0.8, 1.4], emit: [{ kind: 'glow', y: 0.4, size: 1.3, color: '#3ad0ff' }] });
    const fern = [];
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; fern.push([cone(0.12, 0.9, 4), leaf2, Math.cos(a) * 0.25, 0.3, Math.sin(a) * 0.25, Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0, 1, 1, 0.3]); }
    P.push({ parts: merge(fern), density: 1.6, scale: [0.6, 1.3] });
    P.push({ parts: merge([[cyl(0.45, 0.55, 0.6, 9), bark, 0, 0.3, 0], [cyl(0.42, 0.42, 0.02, 9), mat('#8a6a48'), 0, 0.61, 0]]), density: 0.2, scale: [0.8, 1.2] });
  } else if (kind === 'crypt') {
    const stone = mat('#4a5060', { flat: true, rough: 0.95 }), stone2 = mat('#353a46', { flat: true, rough: 0.95 });
    const iron = mat('#1e2026', { metal: 0.7, rough: 0.5 }), bone = mat('#cfc6ae'), wax = mat('#e8dcc0', { rough: 0.6 });
    const grave = [[box(0.8, 1.0, 0.18), stone, 0, 0.5, 0], [cyl(0.4, 0.4, 0.18, 12), stone, 0, 1.0, 0, Math.PI / 2], [box(1.0, 0.15, 0.4), stone2, 0, 0.07, 0]];
    P.push({ parts: merge(grave), density: 1.2, scale: [0.8, 1.2], tilt: 0.15, clear: 4 });
    P.push({ parts: merge([[box(1.1, 0.7, 2.3), stone2, 0, 0.35, 0], [box(1.2, 0.15, 2.4), stone, 0, 0.77, 0], [box(0.5, 0.1, 1.2), stone, 0, 0.88, 0.2]]), density: 0.3, scale: [0.9, 1.1], clear: 6 });
    P.push({ parts: merge([[box(0.9, 0.3, 0.9), stone2, 0, 0.15, 0], [box(0.6, 3.6, 0.6), stone, 0, 1.9, 0], [box(0.95, 0.3, 0.95), stone2, 0, 3.75, 0]]), density: 0.35, scale: [0.8, 1.1], clear: 7 });
    const cand = [];
    [[0, 0, 0.5], [0.18, 0.1, 0.35], [-0.15, 0.12, 0.28], [0.05, -0.18, 0.22]].forEach(([x, z, h]) => cand.push([cyl(0.05, 0.06, h, 6), wax, x, h / 2, z]));
    P.push({ parts: merge(cand), density: 0.5, scale: [1, 1], emit: [{ kind: 'flame', y: 0.6, size: 0.55, color: '#ffb060' }] });
    const bones = [[sphere(0.14, 8, 6), bone, 0, 0.12, 0]];
    for (let i = 0; i < 5; i++) bones.push([cyl(0.03, 0.03, 0.5, 4), bone, Math.cos(i) * 0.25, 0.05, Math.sin(i * 2) * 0.25, Math.PI / 2, i, 0]);
    P.push({ parts: merge(bones), density: 1.0, scale: [0.8, 1.3] });
    const fence = [];
    for (let i = 0; i < 6; i++) { fence.push([cyl(0.035, 0.035, 1.8, 5), iron, -1.5 + i * 0.6, 0.9, 0]); fence.push([cone(0.06, 0.18, 4), iron, -1.5 + i * 0.6, 1.88, 0]); }
    fence.push([box(3.3, 0.06, 0.06), iron, 0, 1.55, 0]); fence.push([box(3.3, 0.06, 0.06), iron, 0, 0.35, 0]);
    P.push({ parts: merge(fence), density: 0.3, scale: [1, 1], clear: 7 });
  } else {
    const rockM = mat('#1e1428', { flat: true, rough: 0.8 }), rock2 = mat('#2b1d38', { flat: true, rough: 0.8 });
    const crystal = mat('#b46cff', { emi: '#9a4cff', ei: 1.4, rough: 0.2 }), rune = mat('#c78bff', { emi: '#c78bff', ei: 4 });
    const cr = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, h = 0.8 + (i % 3) * 0.5;
      const g = new THREE.OctahedronGeometry(0.2, 0);
      cr.push([g, crystal, Math.cos(a) * 0.25, h * 0.5, Math.sin(a) * 0.25, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4, 1, h * 2.2, 1]);
    }
    cr.push([rock(0.45, 0, 4), rockM, 0, 0.1, 0, 0, 0, 0, 1.2, 0.4, 1.2]);
    P.push({ parts: merge(cr), density: 0.7, scale: [0.6, 1.5], emit: [{ kind: 'glow', y: 0.9, size: 1.8, color: '#a050ff' }] });
    P.push({ parts: merge([[cone(0.7, 3.5, 6), rockM, 0, 1.75, 0], [cone(0.4, 2.2, 5), rock2, 0.6, 1.1, 0.3, 0, 0, -0.2]]), density: 0.45, scale: [0.6, 1.3], clear: 6 });
    P.push({ parts: merge([[box(0.8, 4.2, 0.8), rock2, 0, 2.1, 0], [box(0.1, 3.2, 0.82), rune, 0, 2.2, 0], [box(0.82, 0.1, 0.82), rune, 0, 3.6, 0], [cone(0.57, 0.8, 4), rockM, 0, 4.6, 0, 0, Math.PI / 4]]), density: 0.15, scale: [0.9, 1.1], clear: 8, emit: [{ kind: 'glow', y: 2.5, size: 4, color: '#c78bff' }] });
    P.push({ parts: merge([[rock(0.55, 0, 9, 0.3), rockM, 0, 0, 0], [rock(0.3, 0, 10, 0.3), rock2, 0.7, 0.4, 0.2]]), density: 0.6, scale: [0.5, 1.3], float: true });
    P.push({ parts: merge([[rock(0.5, 0, 15), rockM, 0, 0.2, 0], [rock(0.3, 0, 16), rock2, 0.5, 0.12, 0.3]]), density: 1.0, scale: [0.6, 1.4] });
  }
  return P;
}

// ---------------------------------------------------------------------
//  Свет и атмосфера глав
// ---------------------------------------------------------------------
const MOOD = {
  ruins:  { fogTint: '#6a6080', sky: '#7d7aa0', gnd: '#1a1520', hemi: 0.75, dir: '#b8c4ff', dirI: 1.7, fog: '#0c0a12', near: 30, far: 72, bump: 0.9, motes: { color: '#ffb070', cell: 'DOT', rise: 0.6, size: 0.12 } },
  forest: { fogTint: '#5aa090', sky: '#8ad0c8', gnd: '#10201e', hemi: 1.0, dir: '#d8f0ff', dirI: 1.9, fog: '#0b1a1a', near: 32, far: 76, bump: 0.6, motes: { color: '#b0ffe0', cell: 'GLOW', rise: 0.15, size: 0.25 } },
  crypt:  { fogTint: '#5a6a90', sky: '#7080b0', gnd: '#141824', hemi: 0.85, dir: '#a8bce8', dirI: 1.6, fog: '#06080d', near: 26, far: 64, bump: 1.0, motes: { color: '#9ab8ff', cell: 'DOT', rise: -0.1, size: 0.1 } },
  abyss:  { fogTint: '#8050b0', sky: '#9a6ac0', gnd: '#120818', hemi: 0.65, dir: '#d0a8ff', dirI: 1.2, fog: '#10061a', near: 28, far: 70, bump: 0.8, motes: { color: '#d68bff', cell: 'GLOW', rise: 0.4, size: 0.22 } },
};

export function createWorld(scene, kind) {
  const mood = MOOD[kind];
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(mood.fog);
  scene.fog = new THREE.Fog(mood.fog, mood.near, mood.far);

  const tex = makeGround(kind);
  const SIZE = 180, rep = SIZE / TILE;
  for (const t of [tex.map, tex.bump, tex.emissive]) if (t) t.repeat.set(rep, rep);
  const groundMat = new THREE.MeshStandardMaterial({
    map: tex.map, bumpMap: tex.bump, bumpScale: mood.bump * 3, roughness: 0.92, metalness: 0.0,
    emissive: tex.emissive ? new THREE.Color('#ffffff') : new THREE.Color(0), emissiveMap: tex.emissive, emissiveIntensity: kind === 'abyss' ? 0.55 : 0.6,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const hemi = new THREE.HemisphereLight(mood.sky, mood.gnd, mood.hemi);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(mood.dir, mood.dirI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
  group.add(sun); group.add(sun.target);
  // контровой свет: отделяет силуэты от тёмной земли
  const rim = new THREE.DirectionalLight(mood.sky, 1.4);
  group.add(rim); group.add(rim.target);

  // декорации
  const types = propsFor(kind).map((pt) => {
    const cap = Math.ceil((2 * RADIUS + 1) ** 2 * (pt.density + 1) * 1.6);
    const meshes = pt.parts.map(({ geo, mat: m }) => {
      const im = new THREE.InstancedMesh(geo, m, cap);
      im.castShadow = true; im.receiveShadow = true; im.count = 0; im.frustumCulled = false;
      group.add(im);
      return im;
    });
    return { ...pt, meshes, cap };
  });
  const emitters = [];
  const floaters = [];
  let lastCx = 1e9, lastCz = 1e9;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();

  function rebuild(cx, cz) {
    emitters.length = 0; floaters.length = 0;
    for (const t of types) t.n = 0;
    for (let i = cx - RADIUS; i <= cx + RADIUS; i++) for (let j = cz - RADIUS; j <= cz + RADIUS; j++) {
      const r = rng((i * 73856093) ^ (j * 19349663) ^ (kind.length * 83492791));
      // светящиеся руны на земле
      if (r() < 0.45 && (i || j)) {
        const runeCol = { ruins: '#b48cff', forest: '#60ffd0', crypt: '#7fb0ff', abyss: '#d070ff' }[kind];
        emitters.push({ x: (i + r()) * CHUNK, y: 0, z: (j + r()) * CHUNK, kind: 'rune', size: 3 + r() * 3, color: runeCol, ph: r() * TAU });
      }
      types.forEach((t, ti) => {
        let n = Math.floor(t.density + r());
        while (n-- > 0) {
          if (t.n >= t.cap) break;
          const x = (i + r()) * CHUNK, z = (j + r()) * CHUNK;
          if (t.clear && x * x + z * z < t.clear * t.clear) { r(); continue; }
          const sc2 = t.scale[0] + r() * (t.scale[1] - t.scale[0]);
          const yaw = r() * TAU, tilt = (t.tilt || 0) * (r() - 0.5) * 2;
          const y = t.float ? 1.2 + r() * 2.2 : 0;
          e.set(tilt, yaw, tilt * 0.5); q.setFromEuler(e); v.set(x, y, z); s.set(sc2, sc2, sc2);
          m4.compose(v, q, s);
          for (const im of t.meshes) im.setMatrixAt(t.n, m4);
          if (t.float) floaters.push({ t, idx: t.n, x, y, z, q: q.clone(), s: sc2, ph: r() * TAU });
          if (t.emit) for (const em of t.emit) emitters.push({ x, y: y + em.y * sc2, z, kind: em.kind, size: em.size * sc2, color: em.color, ph: r() * TAU });
          t.n++;
        }
      });
    }
    for (const t of types) for (const im of t.meshes) { im.count = t.n; im.instanceMatrix.needsUpdate = true; }
  }

  return {
    group, mood, emitters, sun,
    update(px, pz, time) {
      ground.position.set(px, 0, pz);
      for (const t of [tex.map, tex.bump, tex.emissive]) if (t) t.offset.set(px / TILE, -pz / TILE);
      sun.position.set(px + 14, 34, pz + 10); sun.target.position.set(px, 0, pz);
      rim.position.set(px - 8, 10, pz - 22); rim.target.position.set(px, 1, pz);
      const cx = Math.floor(px / CHUNK), cz = Math.floor(pz / CHUNK);
      if (cx !== lastCx || cz !== lastCz) { lastCx = cx; lastCz = cz; rebuild(cx, cz); }
      if (floaters.length) {
        const touched = new Set();
        for (const f of floaters) {
          v.set(f.x, f.y + Math.sin(time * 0.8 + f.ph) * 0.35, f.z); s.set(f.s, f.s, f.s);
          m4.compose(v, f.q, s);
          for (const im of f.t.meshes) im.setMatrixAt(f.idx, m4);
          touched.add(f.t);
        }
        for (const t of touched) for (const im of t.meshes) im.instanceMatrix.needsUpdate = true;
      }
    },
    setShadows(on) { for (const t of types) for (const im of t.meshes) im.castShadow = on; },
    dispose() {
      scene.remove(group);
      ground.geometry.dispose(); groundMat.dispose();
      for (const t of [tex.map, tex.bump, tex.emissive]) if (t) t.dispose();
      for (const t of types) for (const im of t.meshes) im.dispose();
    },
  };
}
