// =====================================================================
//  Загрузка готовых 3D-моделей (glTF/GLB или FBX) по манифесту
//  assets/manifest.js. Если модели нет — игра использует процедурную.
//
//  Герой и боссы: настоящий скелет + AnimationMixer (их на экране мало).
//  Рядовые враги: анимации «запекаются» в набор поз при загрузке и
//  рисуются инстансингом — сотни врагов за десятки вызовов отрисовки.
// =====================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const Assets = { hero: null, enemies: {}, bosses: {}, errors: [], loaded: 0, ready: false };

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const fbxLoader = new FBXLoader();

function load(url) {
  return new Promise((res, rej) => {
    if (/\.fbx$/i.test(url)) fbxLoader.load(url, (obj) => res({ scene: obj, animations: obj.animations || [] }), undefined, rej);
    else gltfLoader.load(url, (g) => res({ scene: g.scene, animations: g.animations || [] }), undefined, rej);
  });
}

// ищем клип по имени из манифеста или по типичным названиям (Mixamo и др.)
const ALIASES = {
  idle: ['idle', 'stand', 'breath'],
  run: ['run', 'jog', 'sprint'],
  move: ['walk', 'run', 'move', 'crawl', 'fly'],
  walk: ['walk', 'move'],
  attack: ['attack', 'slash', 'punch', 'strike', 'swing', 'bite'],
  cast: ['cast', 'spell', 'magic', 'attack'],
  hit: ['hit', 'damage', 'hurt', 'react'],
  death: ['death', 'die', 'dying'],
  charge: ['charge', 'dash', 'run'],
};
function findClip(clips, want, explicit) {
  if (explicit) { const c = clips.find((k) => k.name === explicit); if (c) return c; }
  for (const key of ALIASES[want] || [want]) {
    const c = clips.find((k) => k.name.toLowerCase().includes(key));
    if (c) return c;
  }
  return null;
}

// нормализация: ставим модель ногами на землю, центр по XZ, масштаб по высоте
function normalize(obj, cfg) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const h = cfg.height || 1.8;
  const s = (h / (size.y || 1)) * (cfg.scale || 1);
  const wrap = new THREE.Group();
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x; obj.position.z -= center.z; obj.position.y -= box.min.y;
  obj.rotation.y += (cfg.yaw || 0) * Math.PI / 180;
  wrap.add(obj);
  wrap.scale.setScalar(s);
  wrap.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m && m.map) m.map.anisotropy = 4;
    }
  });
  return wrap;
}

// запекание анимации толпы: клип -> N статичных поз (по материалам)
function bakeFrames(source, clip, frames) {
  const rig = SkeletonUtils.clone(source);
  rig.updateMatrixWorld(true);
  const mixer = new THREE.AnimationMixer(rig);
  if (clip) mixer.clipAction(clip).play();
  const out = [];
  const v = new THREE.Vector3(), rootInv = new THREE.Matrix4().copy(rig.matrixWorld).invert();
  for (let f = 0; f < frames; f++) {
    if (clip) mixer.setTime((clip.duration * f) / frames);
    rig.updateMatrixWorld(true);
    const byMat = new Map();
    rig.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry, pos = g.attributes.position, n = pos.count;
      const arr = new Float32Array(n * 3);
      const toRoot = new THREE.Matrix4().multiplyMatrices(rootInv, o.matrixWorld);
      for (let i = 0; i < n; i++) {
        if (o.isSkinnedMesh) o.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i);
        v.applyMatrix4(toRoot);
        arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      if (g.attributes.uv) geo.setAttribute('uv', g.attributes.uv);
      if (g.index) geo.setIndex(g.index);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.length > 1 && g.groups.length && g.index) {
        // мультиматериал: отдельная геометрия на каждую группу
        g.groups.forEach((gr) => {
          const m = mats[gr.materialIndex];
          const part = geo.clone();
          part.setIndex(Array.from(g.index.array.slice(gr.start, gr.start + gr.count)));
          if (!byMat.has(m)) byMat.set(m, []); byMat.get(m).push(part);
        });
      } else {
        const m = mats[0];
        if (!byMat.has(m)) byMat.set(m, []); byMat.get(m).push(geo);
      }
    });
    out.push([...byMat].map(([m, geos]) => {
      let geo = geos[0];
      if (geos.length > 1) {
        const norm = geos.map((x) => { const y = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(y.attributes)) if (!['position', 'normal', 'uv'].includes(k)) y.deleteAttribute(k); return y; });
        const allUv = norm.every((x) => x.attributes.uv);
        if (!allUv) norm.forEach((x) => x.deleteAttribute('uv'));
        geo = mergeGeometries(norm) || geos[0];
      }
      return { mat: crowdMaterial(m), geo };
    }));
  }
  return out;
}

const crowdMats = new Map();
function crowdMaterial(m) {
  let c = crowdMats.get(m);
  if (!c) {
    c = m.clone();
    if ('skinning' in c) c.skinning = false;
    crowdMats.set(m, c);
  }
  return c;
}

export async function loadAssets(manifest) {
  if (!manifest) { Assets.ready = true; return Assets; }
  const base = manifest.base || 'assets/models/';
  const jobs = [];
  const add = (cfg, fn) => {
    if (!cfg || !cfg.file) return;
    jobs.push(load(base + cfg.file).then((g) => { fn(g, cfg); Assets.loaded++; }).catch((e) => { Assets.errors.push(cfg.file + ': ' + (e && e.message || e)); console.warn('[assets]', cfg.file, e); }));
  };
  add(manifest.hero, (g, cfg) => {
    Assets.hero = { scene: normalize(g.scene, { height: 1.9, ...cfg }), clips: g.animations, cfg };
  });
  for (const id in manifest.bosses || {}) add(manifest.bosses[id], (g, cfg) => {
    Assets.bosses[id] = { scene: normalize(g.scene, { height: 5, ...cfg }), clips: g.animations, cfg };
  });
  for (const id in manifest.enemies || {}) add(manifest.enemies[id], (g, cfg) => {
    const scene = normalize(g.scene, { height: 1.6, ...cfg });
    const nF = cfg.frames || 10;
    const move = findClip(g.animations, 'move', cfg.clips && cfg.clips.move);
    const attack = findClip(g.animations, 'attack', cfg.clips && cfg.clips.attack);
    Assets.enemies[id] = {
      move: bakeFrames(scene, move, move ? nF : 1),
      attack: attack ? bakeFrames(scene, attack, Math.max(4, Math.round(nF * 0.6))) : null,
      height: cfg.height || 1.6, float: !!cfg.float,
    };
  });
  await Promise.all(jobs);
  Assets.ready = true;
  return Assets;
}

// ---------------------------------------------------------------------
//  Обёртки с тем же интерфейсом, что у процедурных моделей
// ---------------------------------------------------------------------
function attachMarker(root, boneName, offset) {
  let bone = null;
  if (boneName) root.traverse((o) => { if (!bone && o.name && o.name.toLowerCase().includes(boneName.toLowerCase())) bone = o; });
  const m = new THREE.Object3D();
  (bone || root).add(m);
  if (bone) m.position.set(0, 0, 0); else m.position.set(...offset);
  return m;
}

function makePlayer(rig, clips, cfg) {
  const mixer = new THREE.AnimationMixer(rig);
  const acts = {};
  for (const k of ['idle', 'run', 'walk', 'cast', 'attack', 'hit', 'death', 'charge']) {
    const c = findClip(clips, k, cfg.clips && cfg.clips[k]);
    if (c) acts[k] = mixer.clipAction(c);
  }
  let cur = null;
  const play = (name, fade = 0.2, once = false) => {
    const a = acts[name]; if (!a || a === cur) return;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
    a.fadeIn(fade).play(); if (cur) cur.fadeOut(fade);
    cur = a;
  };
  return { mixer, acts, play, get cur() { return cur; } };
}

export function makeAssetHero(asset) {
  const root = new THREE.Group();
  const rig = SkeletonUtils.clone(asset.scene);
  root.add(rig);
  const P = makePlayer(rig, asset.clips, asset.cfg);
  const crystal = attachMarker(rig, asset.cfg.staffBone || 'righthand', [0.35, 1.9, 0.2]);
  const orb = attachMarker(rig, asset.cfg.orbBone || 'lefthand', [-0.35, 1.0, 0.3]);
  return {
    root, crystal, orb, gltf: true,
    update(t, p, dt) {
      if (p.castT > 0.2 && (P.acts.cast || P.acts.attack)) P.play(P.acts.cast ? 'cast' : 'attack', 0.08, true);
      else if (!(P.cur && P.cur.loop === THREE.LoopOnce && P.cur.isRunning())) P.play(p.moving ? (P.acts.run ? 'run' : 'walk') : 'idle', 0.18);
      P.mixer.update(dt);
    },
  };
}

export function makeAssetBoss(asset) {
  const root = new THREE.Group();
  const rig = SkeletonUtils.clone(asset.scene);
  root.add(rig);
  const P = makePlayer(rig, asset.clips, asset.cfg);
  return {
    root, h: asset.cfg.height || 5, gltf: true,
    update(t, e, dt, st) {
      const mode = e.ai.mode;
      if (mode === 'charge' && P.acts.charge) P.play('charge', 0.1);
      else if ((mode === 'windup' || st.atk > 0.2) && (P.acts.attack || P.acts.cast)) P.play(P.acts.attack ? 'attack' : 'cast', 0.1, true);
      else if (!(P.cur && P.cur.loop === THREE.LoopOnce && P.cur.isRunning())) P.play(P.acts.walk ? 'walk' : P.acts.run ? 'run' : 'idle', 0.25);
      P.mixer.update(dt);
    },
  };
}
