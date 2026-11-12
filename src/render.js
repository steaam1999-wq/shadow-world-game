// =====================================================================
//  ARCANE SURVIVORS — 2.5D рендер (Three.js)
// =====================================================================
/* global DATA, Save */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SpriteBatch, rgb } from './fx.js';
import { makeAtlas, CELL } from './textures.js';
import { createWorld } from './world.js';
import { enemyModel, animate, buildHero, buildBoss, mat, PROJ } from './models.js';

const U = 1 / 20;                 // игровой пиксель -> мировая единица
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const CAM_OFF = new THREE.Vector3(0, 18.5, 11.5);
const CAP = 420;                   // экземпляров на тип врага

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.gl = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.5, 200);
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.62, 0.42, 0.88);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    const touch = 'ontouchstart' in window && Math.min(screen.width, screen.height) < 900;
    this.quality = touch ? 1 : 2;
    this.fpsAcc = 0; this.fpsN = 0; this.fpsT = 0;

    // спрайтовые пакеты
    const atlas = makeAtlas();
    this.add = new SpriteBatch(14000, atlas, { additive: true, renderOrder: 20 });
    this.norm = new SpriteBatch(3000, atlas, { additive: false, renderOrder: 15 });
    this.gAdd = new SpriteBatch(2500, atlas, { additive: true, ground: true, renderOrder: 5 });
    this.gNorm = new SpriteBatch(1500, atlas, { additive: false, ground: true, renderOrder: 4 });
    for (const b of [this.add, this.norm, this.gAdd, this.gNorm]) this.scene.add(b.mesh);

    // свет
    this.playerLight = new THREE.PointLight('#b88cff', 30, 16, 2);
    this.scene.add(this.playerLight);
    this.lights = [];
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight('#ffffff', 0, 14, 2); this.scene.add(l); this.lights.push(l); }
    this.lightCand = [];

    // герой
    this.hero = buildHero();
    this.scene.add(this.hero.root);
    this.heroYaw = 0;

    // инстансы снарядов и кристаллов
    const inst = (geo, m, cap) => { const im = new THREE.InstancedMesh(geo, m, cap); im.count = 0; im.frustumCulled = false; this.scene.add(im); return im; };
    this.shardIM = inst(PROJ.shard(), mat('#bff8ff', { emi: '#5ae0ff', ei: 3, rough: 0.1 }), 500);
    this.bladeIM = inst(PROJ.crescent(), mat('#ff2040', { emi: '#ff1030', ei: 3, rough: 0.3, metal: 0.4 }), 24);
    this.gemIM = [
      inst(PROJ.gem(), mat('#7ab8ff', { emi: '#3a8aff', ei: 3, rough: 0.2 }), 600),
      inst(PROJ.gem(), mat('#7dffb8', { emi: '#30ff90', ei: 3, rough: 0.2 }), 300),
      inst(PROJ.gem(), mat('#ff9bff', { emi: '#ff50ff', ei: 3.5, rough: 0.2 }), 200),
    ];
    this.pickMeshes = new Map();
    this.holeMeshes = new Map();

    this.enemyTypes = new Map();
    this.fxp = [];
    this.motes = [];
    this.world = null; this.worldKind = null;
    this.boss = null; this.bossObj = null; this.bossDie = 0;
    this.camPos = new THREE.Vector3(); this.camTarget = new THREE.Vector3();
    this.time = 0;
    // временные объекты
    this.m4 = new THREE.Matrix4(); this.m4b = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler();
    this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.col = new THREE.Color();
    this.st = { ph: 0, t: 0, atk: 0, seed: 0, mv: 1 };
    this.footprint = { W: 1280, H: 760 };
    this.applyQuality();
    this.resize();
  }

  reset() {
    this.fxp.length = 0;
    if (this.bossObj) this.scene.remove(this.bossObj.root);
    this.bossObj = null; this.boss = null;
    for (const m of this.pickMeshes.values()) this.scene.remove(m);
    for (const m of this.holeMeshes.values()) this.scene.remove(m);
    this.pickMeshes.clear(); this.holeMeshes.clear();
  }

  // -------------------------------------------------------------------
  applyQuality() {
    const q = this.quality, dpr = window.devicePixelRatio || 1;
    this.gl.setPixelRatio(q === 2 ? Math.min(dpr, 1.5) : q === 1 ? Math.min(dpr, 1) : 0.75);
    this.gl.shadowMap.enabled = q > 0;
    this.enemyShadows = q === 2;
    for (const t of this.enemyTypes.values()) for (const m of t.meshes) m.im.castShadow = this.enemyShadows;
    if (this.world) this.world.setShadows(q > 0);
    if (this.world) this.world.sun.shadow.mapSize.set(q === 2 ? 2048 : 1024, q === 2 ? 2048 : 1024);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.W = w; this.H = h;
    this.gl.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.composer.setPixelRatio(this.gl.getPixelRatio());
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    // на узких экранах поднимаем камеру, чтобы видеть поле
    const k = Math.max(1, 1.1 / (w / h));
    this.camK = Math.min(1.7, k);
    this.camera.updateProjectionMatrix();
  }

  setWorld(kind) {
    if (this.worldKind === kind) return;
    if (this.world) this.world.dispose();
    this.world = createWorld(this.scene, kind);
    this.worldKind = kind;
    this.world.setShadows(this.quality > 0);
    this.motes.length = 0;
  }

  // видимая область земли в игровых пикселях (для логики спавна)
  computeFootprint(px, pz) {
    const ray = new THREE.Raycaster(), pts = [];
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const d = ray.ray.direction, o = ray.ray.origin;
      const t = d.y < -1e-3 ? -o.y / d.y : 80;
      pts.push([o.x + d.x * t, o.z + d.z * t]);
    }
    let mx = 0, mz = 0;
    for (const [x, z] of pts) { mx = Math.max(mx, Math.abs(x - px)); mz = Math.max(mz, Math.abs(z - pz)); }
    this.footprint.W = Math.min(mx * 2, 110) / U;
    this.footprint.H = Math.min(mz * 2, 90) / U;
    return this.footprint;
  }

  project(x, y, z, out) {
    this.v.set(x, y, z).project(this.camera);
    out.x = (this.v.x * 0.5 + 0.5) * this.W;
    out.y = (-this.v.y * 0.5 + 0.5) * this.H;
    out.vis = this.v.z < 1;
    return out;
  }

  light(x, y, z, color, intensity) { this.lightCand.push({ x, y, z, color, intensity }); }

  // -------------------------------------------------------------------
  //  Частицы рендера
  // -------------------------------------------------------------------
  emit(x, y, z, vx, vy, vz, life, size, color, cell = CELL.GLOW, opt = {}) {
    if (this.fxp.length > 2500) return;
    this.fxp.push({ x, y, z, vx, vy, vz, life, max: life, size, c: rgb(color), cell, grav: opt.grav || 0, add: opt.add !== false, grow: opt.grow || 0, rot: opt.rot ?? Math.random() * TAU, spin: opt.spin || 0, a: opt.a ?? 1 });
  }
  burst(x, y, z, color, n, sp = 4, size = 0.25, life = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, u = Math.random() * 0.8 + 0.2, s = sp * Math.random();
      this.emit(x, y, z, Math.cos(a) * s, u * sp * 0.8, Math.sin(a) * s, life * rand(0.5, 1), size * rand(0.6, 1.3), color, CELL.DOT, { grav: 9 });
    }
  }

  // -------------------------------------------------------------------
  //  Враги (инстансинг)
  // -------------------------------------------------------------------
  enemyType(type) {
    let t = this.enemyTypes.get(type);
    if (t) return t;
    const model = enemyModel(type);
    const meshes = model.parts.map((p) => {
      const im = new THREE.InstancedMesh(p.geo, p.mat, CAP);
      im.count = 0; im.frustumCulled = false; im.castShadow = this.enemyShadows; im.receiveShadow = false;
      im.setColorAt(0, new THREE.Color(1, 1, 1));
      this.scene.add(im);
      return { im, p };
    });
    t = { model, meshes, n: 0 };
    this.enemyTypes.set(type, t);
    return t;
  }

  drawEnemy(e, dt, dying) {
    const t = this.enemyType(e.type);
    if (t.n >= CAP) return;
    const i = t.n++;
    const x = e.x * U, z = e.y * U;
    // фаза шага по пройденному пути
    if (e._lx === undefined) { e._lx = e.x; e._ly = e.y; e._ph = Math.random() * TAU; e._yaw = 0; }
    const moved = Math.hypot(e.x - e._lx, e.y - e._ly);
    e._lx = e.x; e._ly = e.y;
    if (!dying && !(e.frozen > 0)) e._ph += moved * 0.16;
    const px = this.run.p.x, py = this.run.p.y;
    const ty = Math.atan2(px - e.x, py - e.y);
    let dy = ty - e._yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
    e._yaw += dy * Math.min(1, dt * 8);
    e.atk = Math.max(0, (e.atk || 0) - dt);
    const st = this.st;
    st.ph = e._ph; st.t = this.time; st.seed = e.seed || 0; st.atk = e.atk > 0 ? Math.sin((e.atk / 0.35) * Math.PI) : 0;
    st.mv = e.frozen > 0 ? 0 : Math.min(1, moved * 2 + 0.2);
    if (e.frozen > 0) st.t = e._ft || (e._ft = this.time); else e._ft = 0;
    let sc = e.elite ? 1.6 : 1, yOff = t.model.float ? 0.25 + Math.sin(this.time * 2 + (e.seed || 0)) * 0.12 : 0;
    let tilt = 0;
    if (dying) { const k = dying.t / 0.45; sc *= 1 - k * 0.7; yOff -= k * 0.6; tilt = k * 1.2; }
    this.e.set(tilt, e._yaw, 0); this.q.setFromEuler(this.e);
    this.v.set(x, yOff, z); this.s.set(sc, sc, sc);
    const root = this.m4.compose(this.v, this.q, this.s);
    // цвет
    const col = this.col;
    if (dying) col.setRGB(0.35, 0.12, 0.45);
    else if (e.flash > 0) col.setRGB(7, 7, 7);
    else if (e.frozen > 0) col.setRGB(0.7, 1.4, 2.0);
    else if (e.burnT > 0) col.setRGB(1.7, 0.8 + Math.sin(this.time * 20) * 0.15, 0.45);
    else if (e.elite) col.setRGB(1.35, 1.1, 0.7);
    else if (e.slowT > 0) col.setRGB(0.85, 1.1, 1.4);
    else col.setRGB(1, 1, 1);
    for (const { im, p } of t.meshes) {
      const a = animate(p.ch, p.k, st);
      this.e.set(a.rx, a.ry, a.rz); this.q.setFromEuler(this.e);
      this.v.set(p.pv[0], p.pv[1] + a.dy, p.pv[2]); this.s.set(a.s, a.s, a.s);
      this.m4b.compose(this.v, this.q, this.s).premultiply(root);
      im.setMatrixAt(i, this.m4b);
      im.setColorAt(i, col);
    }
    // наземные метки и эффекты состояния
    const R = (e.r || 12) * U;
    if (!this.enemyShadows) this.gNorm.add(x, 0.02, z, R * 2.6, R * 2.6, 1, 1, 1, 0.75, 0, CELL.SHADOW);
    if (dying) return;
    const h = t.model.h * sc;
    if (e.elite) {
      this.gAdd.add(x, 0.04, z, R * 3.2, R * 3.2, 1.6, 1.15, 0.4, 0.8, this.time * 1.5, CELL.RUNE);
      this.add.add(x, h * 0.5, z, h * 1.4, h * 1.4, 1.0, 0.75, 0.25, 0.25, 0, CELL.GLOW);
    }
    if (e.burnT > 0 && Math.random() < 0.5) this.emit(x + rand(-R, R) * 0.6, h * rand(0.3, 0.9), z + rand(-R, R) * 0.6, 0, 1.6, 0, 0.45, R * 1.2, '#ff7a2a', CELL.FLAME, { grow: -0.5 });
    if (e.frozen > 0) this.add.add(x, h * 0.5, z, h * 1.1, h * 1.1, 0.4, 0.9, 1.3, 0.35, 0, CELL.STAR);
    if (e.atk > 0 && e.ranged) this.add.add(x, h * 0.75, z + 0.3, 1.2, 1.2, ...rgb(e.ranged.color), 1.2 * (e.atk / 0.35), 0, CELL.GLOW);
  }

  // -------------------------------------------------------------------
  //  Босс
  // -------------------------------------------------------------------
  updateBoss(run, dt) {
    const b = run.boss;
    if (b && this.boss !== b) {
      if (this.bossObj) this.scene.remove(this.bossObj.root);
      this.boss = b; this.bossObj = buildBoss(b.bossId); this.scene.add(this.bossObj.root);
      this.bossDie = 0; b._ph = 0; b._lx = b.x; b._ly = b.y; b._yaw = 0;
      this.burst(b.x * U, 1, b.y * U, '#b46cff', 60, 8, 0.4, 1);
    }
    if (!this.bossObj) return;
    const B = this.bossObj, e = this.boss;
    if (!b) {
      // гибель босса
      this.bossDie += dt;
      const k = this.bossDie / 2.2;
      B.root.scale.setScalar(Math.max(0.01, 1 - k));
      B.root.position.y = -k * 2;
      B.root.rotation.z = Math.sin(this.time * 30) * 0.05 * (1 - k);
      if (Math.random() < 0.8) this.emit(e.x * U + rand(-2, 2), rand(0.5, 4), e.y * U + rand(-2, 2), 0, 3, 0, 1, rand(0.6, 1.4), '#d8b0ff', CELL.STAR, { spin: 3 });
      this.light(e.x * U, 3, e.y * U, '#d0a0ff', 120 * (1 - k));
      if (k >= 1) { this.scene.remove(B.root); this.bossObj = null; this.boss = null; }
      return;
    }
    const x = b.x * U, z = b.y * U;
    const moved = Math.hypot(b.x - b._lx, b.y - b._ly); b._lx = b.x; b._ly = b.y;
    b._ph += Math.min(moved, 30) * 0.06;
    const target = b.ai.mode === 'windup' || b.ai.mode === 'charge' ? Math.atan2(Math.cos(b.ai.dir), Math.sin(b.ai.dir)) : Math.atan2(run.p.x - b.x, run.p.y - b.y);
    let dy = target - b._yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
    b._yaw += dy * Math.min(1, dt * 5);
    b.atk = Math.max(0, (b.atk || 0) - dt);
    const st = this.st; st.ph = b._ph; st.t = this.time; st.atk = b.atk > 0 ? Math.sin(b.atk / 0.4 * Math.PI) : 0;
    B.root.position.set(x, 0, z);
    B.root.rotation.y = b._yaw;
    const fl = b.flash > 0 ? 1.04 : 1;
    B.root.scale.setScalar(b.frozen > 0 ? 1 : fl);
    B.update(this.time, b, dt, st);
    // аура и сигил под боссом
    const R = b.r * U;
    this.gAdd.add(x, 0.05, z, R * 4, R * 4, 0.7, 0.2, 1.0, 0.4, -this.time * 0.5, CELL.SIGIL);
    this.gNorm.add(x, 0.03, z, R * 3.5, R * 3.5, 1, 1, 1, 0.9, 0, CELL.SHADOW);
    if (b.flash > 0) this.add.add(x, B.h * 0.5, z, B.h * 1.4, B.h * 1.4, 1.5, 1.2, 1.8, 0.35, 0, CELL.GLOW);
    const col = { fallen_knight: '#a070ff', devourer: '#b46cff', soulless_king: '#9ad0ff', abyss_lord: '#7fc0ff' }[b.bossId];
    this.light(x, 1.0, z + 3.2, col, 22 + st.atk * 40);
    if (b.ai.mode === 'windup') {
      const a = b.ai.dir, L = 380 * U;
      this.gAdd.add(x + Math.cos(a) * L / 2, 0.06, z + Math.sin(a) * L / 2, L, R * 1.6, 2.2, 0.2, 0.25, 0.75, a, CELL.STREAK);
      this.light(x, 1, z, '#ff3040', 80);
    }
    if (b.ai.mode === 'charge' && Math.random() < 0.9) this.emit(x + rand(-R, R), rand(0.2, 2), z + rand(-R, R), 0, 0.5, 0, 0.6, 1.2, '#4a2060', CELL.SMOKE, { add: false, grow: 1.5, a: 0.6 });
    // поля притяжения
    if (b.bossId === 'devourer' || (b.bossId === 'abyss_lord' && b.ai.phase >= 2)) {
      const PR = (b.bossId === 'devourer' ? 560 : 520) * U;
      this.gAdd.add(x, 0.05, z, PR * 2, PR * 2, 0.35, 0.15, 0.55, 0.35, this.time * 0.3, CELL.RING);
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, r = PR * rand(0.6, 1);
        this.emit(x + Math.cos(a) * r, rand(0.2, 1.5), z + Math.sin(a) * r, -Math.cos(a) * r * 0.9, 0, -Math.sin(a) * r * 0.9, 1, 0.25, '#c890ff', CELL.DOT);
      }
    }
  }

  // -------------------------------------------------------------------
  //  Кадр
  // -------------------------------------------------------------------
  render(run, dt, menu) {
    this.time += dt;
    this.run = run;
    const T = this.time;
    for (const b of [this.add, this.norm, this.gAdd, this.gNorm]) b.begin();
    this.lightCand.length = 0;
    for (const t of this.enemyTypes.values()) t.n = 0;

    let px = 0, pz = 0;
    if (run) {
      this.setWorld(run.ch.decor);
      px = run.p.x * U; pz = run.p.y * U;
    } else {
      this.setWorld(menu || 'ruins');
    }
    this.world.update(px, pz, T);

    // камера
    const k = this.camK || 1;
    if (run) {
      this.camTarget.set(px, 0.8, pz);
      const sh = (run.shake || 0) * 0.025;
      const zm = this.zoom || 1;
      this.camera.position.set(px + CAM_OFF.x * k * zm + rand(-sh, sh), CAM_OFF.y * k * zm + rand(-sh, sh), pz + CAM_OFF.z * k * zm);
      this.camera.lookAt(this.camTarget);
    } else {
      const a = T * 0.08;
      this.camera.position.set(Math.sin(a) * 9, 5.5, Math.cos(a) * 9);
      this.camera.lookAt(0, 1.6, 0);
    }
    this.camera.updateMatrixWorld();

    this.drawHero(run, dt);
    if (run) this.drawRun(run, dt);
    else this.drawMenu(dt);
    this.drawEmitters(px, pz);
    this.drawMotes(px, pz, dt);
    this.drawFx(dt);

    for (const t of this.enemyTypes.values()) for (const { im } of t.meshes) {
      im.count = t.n;
      if (t.n) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    }
    for (const b of [this.add, this.norm, this.gAdd, this.gNorm]) b.end();
    this.assignLights(px, pz);
    this.composer.render(dt);
    this.adapt(dt, !!run);
  }

  adapt(dt, running) {
    if (!running) return;
    this.fpsT += dt; this.fpsN++;
    if (this.fpsT >= 3) {
      const fps = this.fpsN / this.fpsT;
      this.fpsT = 0; this.fpsN = 0;
      if (fps < 40 && this.quality > 0) { this.quality--; this.applyQuality(); }
    }
  }

  assignLights(px, pz) {
    const c = this.lightCand;
    for (const l of c) { const d = (l.x - px) ** 2 + (l.z - pz) ** 2; l.score = l.intensity / (1 + d * 0.01); }
    c.sort((a, b) => b.score - a.score);
    for (let i = 0; i < this.lights.length; i++) {
      const L = this.lights[i], s = c[i];
      if (s) { L.position.set(s.x, s.y, s.z); L.color.set(s.color); L.intensity = s.intensity; }
      else L.intensity = 0;
    }
  }

  // -------------------------------------------------------------------
  drawHero(run, dt) {
    const H = this.hero;
    const p = run ? run.p : { moving: false, castT: 0, heart: 0, x: 0, y: 0 };
    const x = p.x * U, z = p.y * U;
    H.root.position.set(x, 0, z);
    let target = this.heroYaw;
    if (run && p.moving) target = Math.atan2(Math.cos(p.moveA), Math.sin(p.moveA));
    else if (run && p.castT > 0 && p.castA !== undefined) target = Math.atan2(Math.cos(p.castA), Math.sin(p.castA));
    else if (!run) target = 0;
    let d = target - this.heroYaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    this.heroYaw += d * Math.min(1, dt * 12);
    H.root.rotation.y = this.heroYaw;
    H.update(this.time, p, dt);
    H.root.visible = !(run && p.invuln > 0 && p.invuln < 5 && Math.floor(this.time * 20) % 2);
    const corr = Save.data.corruption / 100;
    const auraC = corr > 0.5 ? '#c060ff' : corr > 0.2 ? '#9a80ff' : '#80a8ff';
    this.playerLight.position.set(x, 3.2, z + 1.2);
    this.playerLight.color.set(auraC);
    this.playerLight.intensity = 16 + (p.castT || 0) * 50;
    // магический круг под ногами
    const ac = rgb(auraC);
    const cast = Math.min(1, (p.castT || 0) / 0.2);
    this.gAdd.add(x, 0.03, z, 2.6, 2.6, ac[0] * 1.4, ac[1] * 1.4, ac[2] * 1.4, 0.18 + cast * 0.55, this.time * 0.7, CELL.RUNE);
    if (p.heart >= 100) this.gAdd.add(x, 0.04, z, 3.6, 3.6, 1.6, 0.6, 2.2, 0.45 + Math.sin(this.time * 6) * 0.2, -this.time, CELL.SIGIL);
    // свечение кристалла посоха
    const cp = new THREE.Vector3(); H.crystal.getWorldPosition(cp);
    this.add.add(cp.x, cp.y, cp.z, 0.7 + cast * 0.5, 0.7 + cast * 0.5, 1.0, 0.45, 1.5, 0.45, 0, CELL.GLOW);
    if (p.heart >= 100) this.add.add(cp.x, cp.y, cp.z, 1.2, 1.2, 1.2, 0.5, 1.6, 0.45, this.time, CELL.STAR);
    const op = new THREE.Vector3(); H.orb.getWorldPosition(op);
    this.add.add(op.x, op.y, op.z, 0.45 + cast * 0.6, 0.45 + cast * 0.6, 1.0, 0.45, 1.6, 0.5, 0, CELL.GLOW);
    if (run && Math.random() < 0.3) this.emit(op.x, op.y, op.z, rand(-0.3, 0.3), 0.8, rand(-0.3, 0.3), 0.6, 0.12, '#d0a0ff', CELL.DOT);
  }

  drawMenu() {
    this.light(0, 1.2, 1.5, '#9a60ff', 40);
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * TAU, r = rand(1, 2.6);
      this.emit(Math.cos(a) * r, 0.1, Math.sin(a) * r, 0, rand(0.5, 1.5), 0, 1.6, rand(0.08, 0.18), '#c890ff', CELL.DOT);
    }
    this.gAdd.add(0, 0.03, 0, 6, 6, 1.0, 0.45, 1.6, 0.6, this.time * 0.25, CELL.SIGIL);
    this.gAdd.add(0, 0.04, 0, 3.4, 3.4, 1.2, 0.6, 1.8, 0.5, -this.time * 0.4, CELL.RUNE);
  }

  drawEmitters(px, pz) {
    for (const em of this.world.emitters) {
      if ((em.x - px) ** 2 + (em.z - pz) ** 2 > 40 * 40) continue;
      const c = rgb(em.color), fl = 0.8 + Math.sin(this.time * 9 + em.ph) * 0.12 + Math.sin(this.time * 23 + em.ph) * 0.08;
      if (em.kind === 'flame') {
        this.add.add(em.x, em.y + em.size * 0.25, em.z, em.size * 0.7 * fl, em.size * 1.1 * fl, c[0] * 1.6, c[1] * 1.2, c[2] * 0.8, 0.8, Math.sin(this.time * 3 + em.ph) * 0.1, CELL.FLAME);
        this.add.add(em.x, em.y, em.z, em.size * 2.2, em.size * 2.2, c[0], c[1] * 0.7, c[2] * 0.5, 0.18, 0, CELL.GLOW);
        if (Math.random() < 0.08) this.emit(em.x, em.y + 0.4, em.z, rand(-0.2, 0.2), 1.5, rand(-0.2, 0.2), 1.2, 0.08, '#ffb060', CELL.DOT);
        this.light(em.x, em.y + 0.8, em.z, em.color, 7 * fl * em.size);
      } else {
        this.add.add(em.x, em.y, em.z, em.size * 0.55 * fl, em.size * 0.55 * fl, c[0], c[1], c[2], 0.3, 0, CELL.GLOW);
        this.light(em.x, em.y + 0.6, em.z, em.color, 3 * em.size);
      }
    }
  }

  drawMotes(px, pz, dt) {
    const m = this.world.mood.motes;
    while (this.motes.length < 70) this.motes.push({ x: px + rand(-22, 22), y: rand(0.2, 5), z: pz + rand(-16, 16), ph: Math.random() * TAU, sp: rand(0.5, 1.2) });
    const c = rgb(m.color), cell = CELL[m.cell];
    for (const o of this.motes) {
      o.y += m.rise * o.sp * dt; o.x += Math.sin(this.time * 0.5 + o.ph) * 0.3 * dt;
      if (o.y > 6) o.y = 0.2; if (o.y < 0.1) o.y = 5;
      if (o.x < px - 24) o.x += 48; if (o.x > px + 24) o.x -= 48;
      if (o.z < pz - 18) o.z += 36; if (o.z > pz + 18) o.z -= 36;
      const a = 0.4 + Math.sin(this.time * 2 + o.ph) * 0.3;
      this.add.add(o.x, o.y, o.z, m.size, m.size, c[0], c[1], c[2], a, 0, cell);
    }
  }

  drawFx(dt) {
    const f = this.fxp;
    let j = 0;
    for (let i = 0; i < f.length; i++) {
      const p = f[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy -= p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05 && p.grav) { p.y = 0.05; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
      p.vx *= 0.97; p.vz *= 0.97;
      p.size = Math.max(0.01, p.size + p.grow * dt);
      p.rot += p.spin * dt;
      const k = p.life / p.max;
      (p.add ? this.add : this.norm).add(p.x, p.y, p.z, p.size, p.size, p.c[0] * 1.3, p.c[1] * 1.3, p.c[2] * 1.3, p.a * Math.min(1, k * 2), p.rot, p.cell);
      f[j++] = p;
    }
    f.length = j;
  }

  // -------------------------------------------------------------------
  //  Забег
  // -------------------------------------------------------------------
  drawRun(run, dt) {
    const T = this.time, A = this.add, G = this.gAdd;
    this.computeFootprint(run.p.x * U, run.p.y * U);

    // враги
    for (const e of run.enemies) if (!e.dead && !e.boss) this.drawEnemy(e, dt, null);
    run.dying = run.dying.filter((d) => {
      if (d.e.boss) return false;
      if (d.t === 0) {
        const x = d.e.x * U, z = d.e.y * U, c = d.e.color;
        this.burst(x, 0.8, z, c, d.e.elite ? 24 : 7, 4, 0.22, 0.6);
        this.emit(x, 0.6, z, 0, 0.6, 0, 0.7, d.e.elite ? 3 : 1.4, '#20102a', CELL.SMOKE, { add: false, grow: 1.2, a: 0.55 });
        this.emit(x, 1.0, z, 0, 2.2, 0, 0.8, 0.9, '#c8a0ff', CELL.GLOW, { grow: -0.6 });
        this.gAdd.add(x, 0.05, z, 1.5, 1.5, 1, 0.5, 1.4, 0.4, 0, CELL.SHOCK);
      }
      d.t += dt;
      if (d.t >= 0.45) return false;
      this.drawEnemy(d.e, dt, d);
      return true;
    });
    this.updateBoss(run, dt);

    // кристаллы эфира
    const gc = [0, 0, 0];
    for (const g of run.gems) {
      const tier = g.val >= 10 ? 2 : g.val >= 3 ? 1 : 0;
      const im = this.gemIM[tier];
      const i = gc[tier]++;
      if (i >= im.instanceMatrix.count) continue;
      const s = [1, 1.3, 1.8][tier];
      this.e.set(0, T * 2.5 + g.x, 0); this.q.setFromEuler(this.e);
      this.v.set(g.x * U, 0.35 + Math.sin(T * 3 + g.x) * 0.08, g.y * U); this.s.set(s, s * 1.4, s);
      im.setMatrixAt(i, this.m4.compose(this.v, this.q, this.s));
      const c = [[0.4, 0.7, 1.6], [0.4, 1.6, 0.9], [1.6, 0.6, 1.6]][tier];
      A.add(g.x * U, 0.35, g.y * U, 0.7 * s, 0.7 * s, c[0], c[1], c[2], 0.35, 0, CELL.GLOW);
    }
    this.gemIM.forEach((im, k) => { im.count = gc[k]; im.instanceMatrix.needsUpdate = true; });

    this.drawPickups(run);
    this.drawSpells(run, dt);
    this.drawEnemyShots(run);

    // частицы логики
    for (const pt of run.parts) {
      if (pt._h === undefined) { pt._h = rand(0.3, 1.4); pt._vy = rand(0.5, 3); }
      pt._h += pt._vy * dt; pt._vy -= 6 * dt; if (pt._h < 0.05) { pt._h = 0.05; pt._vy = 0; }
      const k = pt.life / pt.max, c = rgb(pt.color);
      A.add(pt.x * U, pt._h, pt.y * U, pt.size * U * 3.2, pt.size * U * 3.2, c[0] * 1.5, c[1] * 1.5, c[2] * 1.5, k, 0, CELL.DOT);
    }

    // опасные зоны
    for (const h of run.hazards) {
      if (h.done) continue;
      const k = h.t / h.delay, R = h.r * U * 2;
      G.add(h.x * U, 0.06, h.y * U, R, R, 2.0, 0.4, 2.4, 0.5 + k * 0.5, T * 2, CELL.RUNE);
      G.add(h.x * U, 0.07, h.y * U, R * k, R * k, 1.6, 0.3, 2.0, 0.5, 0, CELL.GLOW);
    }
  }

  drawPickups(run) {
    const T = this.time, seen = new Set();
    for (const k of run.pickups) {
      seen.add(k);
      let m = this.pickMeshes.get(k);
      if (!m) {
        if (k.kind === 'fragment') m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), mat('#ffe08a', { emi: '#ffb030', ei: 3, rough: 0.2, metal: 0.6 }));
        else if (k.kind === 'heal') { m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat('#ff3050', { emi: '#ff1030', ei: 1.5, rough: 0.15 }))); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8), mat('#d8c8b0')); n.position.y = 0.3; m.add(n); }
        else m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI * 1.3), mat('#9ad0ff', { emi: '#4a90ff', ei: 2.5, metal: 0.8 }));
        this.scene.add(m); this.pickMeshes.set(k, m);
      }
      const x = k.x * U, z = k.y * U, y = 0.7 + Math.sin(T * 3 + k.t) * 0.15;
      m.position.set(x, y, z); m.rotation.y = T * 2;
      const col = k.kind === 'fragment' ? [2, 1.5, 0.5] : k.kind === 'heal' ? [2, 0.4, 0.6] : [0.6, 1.2, 2];
      this.add.add(x, y, z, 1.6, 1.6, ...col, 0.5, 0, CELL.GLOW);
      this.gAdd.add(x, 0.05, z, 1.8, 1.8, ...col, 0.6, T, CELL.RUNE);
      if (k.kind === 'fragment') {
        this.add.add(x, 3, z, 0.6, 6, 2, 1.6, 0.6, 0.35, 0, CELL.STREAK, 0, 1, 0);
        this.light(x, 1.5, z, '#ffc060', 30);
      }
    }
    for (const [k, m] of this.pickMeshes) if (!seen.has(k)) { this.scene.remove(m); this.pickMeshes.delete(k); }
  }

  drawSpells(run, dt) {
    const T = this.time, A = this.add, G = this.gAdd, N = this.norm, p = run.p;
    let ns = 0;
    // снаряды игрока
    for (const s of run.shots) {
      const x = s.x * U, z = s.y * U, c = rgb(s.color);
      if (!s._tr) s._tr = [];
      s._tr.push(x, z); if (s._tr.length > 16) s._tr.splice(0, 2);
      const vx = s.vx * U, vz = s.vy * U, y = 0.9;
      if (s.kind === 'shard') {
        if (ns < 500) {
          this.e.set(0, Math.atan2(vx, vz), 0); this.q.setFromEuler(this.e);
          this.v.set(x, y, z); this.s.set(s.r / 5, s.r / 5, s.r / 5);
          this.shardIM.setMatrixAt(ns++, this.m4.compose(this.v, this.q, this.s));
        }
        A.add(x, y, z, 1.6, 0.35, c[0] * 1.5, c[1] * 1.5, c[2] * 1.5, 0.7, 0, CELL.STREAK, vx, 0, vz);
        if (Math.random() < 0.15) this.emit(x, y, z, 0, -0.5, 0, 0.5, 0.15, '#dffcff', CELL.STAR, { spin: 4 });
      } else if (s.kind === 'orb') {
        const R = s.r * U * 3;
        A.add(x, y, z, R * 2.2, R * 2.2, c[0] * 1.6, c[1] * 1.2, c[2] * 1.8, 0.9, 0, CELL.GLOW);
        N.add(x, y, z, R * 0.7, R * 0.7, 0.02, 0, 0.05, 0.95, 0, CELL.DOT);
        for (let i = 0; i < 3; i++) { const a = T * 6 + i * TAU / 3; A.add(x + Math.cos(a) * R * 0.6, y + Math.sin(a * 0.7) * 0.2, z + Math.sin(a) * R * 0.6, 0.25, 0.25, 1.6, 0.8, 2.2, 1, 0, CELL.DOT); }
        if (Math.random() < 0.5) this.emit(x, y, z, rand(-0.5, 0.5), rand(-0.2, 0.5), rand(-0.5, 0.5), 0.6, 0.5, '#7a30d0', CELL.SMOKE, { grow: 0.8, a: 0.6 });
        this.light(x, y, z, '#a060ff', 20);
      } else {
        const sz = s.star ? 0.9 : 0.75;
        A.add(x, y, z, sz * 1.5, sz * 1.5, c[0] * 1.2, c[1] * 1.2, c[2] * 1.4, 0.6, 0, CELL.GLOW);
        A.add(x, y, z, sz * 0.8, sz * 0.8, 1.6, 1.6, 1.8, 0.9, T * 8, CELL.STAR);
        A.add(x - vx * 0.03, y, z - vz * 0.03, 1.8, 0.4, c[0] * 1.6, c[1] * 1.6, c[2] * 2, 0.8, 0, CELL.STREAK, vx, 0, vz);
        const tr = s._tr;
        for (let i = 0; i < tr.length - 2; i += 2) { const k = i / tr.length; A.add(tr[i], y, tr[i + 1], 0.35 * k + 0.08, 0.35 * k + 0.08, c[0], c[1], c[2], k * 0.7, 0, CELL.DOT); }
        if (s.star) this.light(x, y, z, s.color, 6);
      }
    }
    this.shardIM.count = ns; this.shardIM.instanceMatrix.needsUpdate = true;

    // серпы
    const blood = run.weapons.find((w) => w.id === 'blood');
    let nb = 0;
    if (blood && blood.blades) {
      const sc = (blood.evo ? 1.5 : 1) * p.areaMul;
      for (const b of blood.blades) {
        const x = b.x * U, z = b.y * U;
        this.e.set(-Math.PI / 2, 0, T * 14); this.q.setFromEuler(this.e);
        this.v.set(x, 0.9, z); this.s.set(sc, sc, sc);
        this.bladeIM.setMatrixAt(nb++, this.m4.compose(this.v, this.q, this.s));
        A.add(x, 0.9, z, 1.6 * sc, 1.6 * sc, 1.8, 0.15, 0.3, 0.55, 0, CELL.GLOW);
        const R = Math.hypot(b.x - p.x, b.y - p.y) * U;
        for (let i = 1; i <= 10; i++) {
          const a = b.a - i * 0.05;
          A.add(p.x * U + Math.cos(a) * R, 0.9, p.y * U + Math.sin(a) * R, (0.55 - i * 0.03) * sc, (0.55 - i * 0.03) * sc, 1.8, 0.12, 0.3, 0.55 - i * 0.05, 0, CELL.GLOW);
        }
        this.light(x, 1, z, '#ff2040', 6);
      }
    }
    this.bladeIM.count = nb; this.bladeIM.instanceMatrix.needsUpdate = true;

    // аура феникса
    const fire = run.weapons.find((w) => w.id === 'fire');
    if (fire && fire.evo) {
      const R = 95 * U * p.areaMul;
      G.add(p.x * U, 0.05, p.y * U, R * 2.2, R * 2.2, 1.8, 0.6, 0.15, 0.45 + Math.sin(T * 8) * 0.08, T, CELL.SIGIL);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, r = R * rand(0.4, 1); this.emit(p.x * U + Math.cos(a) * r, 0.2, p.y * U + Math.sin(a) * r, 0, 2, 0, 0.5, 0.7, '#ff7a20', CELL.FLAME, { grow: -0.8 }); }
      this.light(p.x * U, 1, p.y * U, '#ff7020', 30);
    }

    // огненные и прочие кольца
    for (const r of run.rings) {
      const k = 1 - r.r / r.max, R = r.r * U, x = r.x * U, z = r.y * U, c = rgb(r.color);
      G.add(x, 0.07, z, R * 2.15, R * 2.15, c[0] * 2, c[1] * 2, c[2] * 2, k, 0, CELL.SHOCK);
      if (r.r < r.max * 0.3) G.add(x, 0.06, z, r.max * U * 1.2, r.max * U * 1.2, c[0] * 1.5, c[1] * 1.5, c[2] * 1.5, (1 - r.r / (r.max * 0.3)) * 0.8, T, CELL.SIGIL);
      const n = Math.min(90, Math.max(16, R * 6 | 0));
      for (let i = 0; i < n; i++) {
        const a = (i + ((i * 7919) % 13) / 13) / n * TAU;
        const jr = R * (0.92 + ((i * 31) % 7) / 50);
        const fx = x + Math.cos(a) * jr, fz = z + Math.sin(a) * jr;
        const fl = 0.75 + Math.sin(T * 20 + i * 1.7) * 0.25;
        if (r.el === 'fire') {
          A.add(fx, 0.35 + fl * 0.25, fz, 0.55 * fl + 0.2, 0.95 * fl + 0.3, 2.0, 0.75, 0.25, k * 0.85, Math.sin(i) * 0.3, CELL.FLAME);
          if (i % 3 === 0 && Math.random() < 0.3) this.emit(fx, 0.4, fz, Math.cos(a) * 0.8, 1.5, Math.sin(a) * 0.8, 0.5, 0.1, '#ffb050', CELL.DOT);
        } else A.add(fx, 0.5, fz, 0.6, 0.6, c[0] * 2, c[1] * 2, c[2] * 2, k * 0.8, a, CELL.STAR);
      }
      this.light(x, 1, z, r.color, 70 * k);
    }

    // молнии
    for (const l of run.lines) {
      const a = Math.min(1, l.life * 8), c = rgb(l.color);
      let x1, y1, z1, x2 = l.x2 * U, y2 = 0.8, z2 = l.y2 * U;
      if (l.wide) { x1 = x2 + rand(-1, 1); y1 = 16; z1 = z2; } else { x1 = l.x1 * U; y1 = 1.1; z1 = l.y1 * U; }
      const segs = l.wide ? 9 : 6;
      let px2 = x1, py2 = y1, pz2 = z1;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs, j = i === segs ? 0 : (l.wide ? 0.6 : 0.45);
        const nx = x1 + (x2 - x1) * t + rand(-j, j), ny = y1 + (y2 - y1) * t + rand(-j, j) * 0.5, nz = z1 + (z2 - z1) * t + rand(-j, j);
        const dx = nx - px2, dy = ny - py2, dz = nz - pz2, L = Math.hypot(dx, dy, dz);
        const mx = (nx + px2) / 2, my = (ny + py2) / 2, mz = (nz + pz2) / 2;
        A.add(mx, my, mz, L * 1.25, l.wide ? 0.9 : 0.55, c[0] * 1.6, c[1] * 1.6, c[2] * 2.2, a, 0, CELL.STREAK, dx, dy, dz);
        A.add(mx, my, mz, L * 1.1, l.wide ? 0.25 : 0.14, 3, 3, 3, a, 0, CELL.STREAK, dx, dy, dz);
        px2 = nx; py2 = ny; pz2 = nz;
      }
      A.add(x2, y2, z2, 1.6, 1.6, c[0] * 2, c[1] * 2, c[2] * 2, a, Math.random() * TAU, CELL.STAR);
      if (l.wide) { G.add(x2, 0.06, z2, 3, 3, 2, 2, 1.2, a, Math.random() * TAU, CELL.CRACK); }
      if (!l._f) { l._f = 1; this.burst(x2, 0.8, z2, '#fff6a0', 4, 5, 0.12, 0.35); }
      this.light(x2, 1.5, z2, '#fff2a0', 50 * a);
    }

    // взрывы
    for (const b of run.blasts) {
      const k = b.life / b.max, R = b.r * U, x = b.x * U, z = b.y * U, c = rgb(b.color);
      if (!b._f) {
        b._f = 1;
        this.burst(x, 0.6, z, b.color, 14, R * 3, 0.25, 0.7);
        for (let i = 0; i < 5; i++) this.emit(x + rand(-R, R) * 0.4, 0.5, z + rand(-R, R) * 0.4, rand(-1, 1), 0.8, rand(-1, 1), 0.9, R * 0.8, '#1a0c24', CELL.SMOKE, { add: false, grow: R * 0.8, a: 0.5 });
      }
      A.add(x, 0.8, z, R * 2.4 * (1.3 - k * 0.3), R * 2.4 * (1.3 - k * 0.3), c[0] * 1.8, c[1] * 1.8, c[2] * 1.8, k * 0.9, 0, CELL.GLOW);
      G.add(x, 0.07, z, R * 2.6 * (1.2 - k * 0.5), R * 2.6 * (1.2 - k * 0.5), c[0] * 2, c[1] * 2, c[2] * 2, k, 0, CELL.SHOCK);
      this.light(x, 1.2, z, b.color, 90 * k);
    }

    // чёрные дыры
    const seenH = new Set();
    for (const h of run.holes) {
      seenH.add(h);
      let m = this.holeMeshes.get(h);
      if (!m) { m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#000000' })); this.scene.add(m); this.holeMeshes.set(h, m); }
      const x = h.x * U, z = h.y * U, k = Math.min(1, h.t * 3), R = h.r * U;
      m.position.set(x, 1.0, z); m.scale.setScalar(0.9 * k + Math.sin(T * 10) * 0.05);
      G.add(x, 0.06, z, R * 2, R * 2, 1.2, 0.4, 2.2, 0.7 * k, -T * 3, CELL.SIGIL);
      A.add(x, 1.0, z, 3.6 * k, 3.6 * k, 1.4, 0.5, 2.4, 0.9, T * 4, CELL.SHOCK);
      A.add(x, 1.0, z, 4.8 * k, 1.2 * k, 1.6, 0.7, 2.6, 0.7, T * 2, CELL.STREAK, 1, 0, 0);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, r = R; this.emit(x + Math.cos(a) * r, rand(0.3, 1.8), z + Math.sin(a) * r, -Math.cos(a) * r * 1.6, 0, -Math.sin(a) * r * 1.6, 0.6, 0.18, '#d0a0ff', CELL.DOT); }
      this.light(x, 1.5, z, '#8040ff', 60);
    }
    for (const [h, m] of this.holeMeshes) if (!seenH.has(h)) { this.scene.remove(m); this.holeMeshes.delete(h); }
  }

  drawEnemyShots(run) {
    const A = this.add, N = this.norm;
    for (const s of run.eShots) {
      const x = s.x * U, z = s.y * U, c = rgb(s.color), R = s.r * U;
      A.add(x, 0.9, z, R * 5, R * 5, c[0] * 1.6, c[1] * 1.6, c[2] * 1.6, 0.9, 0, CELL.GLOW);
      A.add(x - s.vx * U * 0.04, 0.9, z - s.vy * U * 0.04, R * 6, R * 2.2, c[0], c[1], c[2], 0.6, 0, CELL.STREAK, s.vx, 0, s.vy);
      N.add(x, 0.9, z, R * 1.6, R * 1.6, 0.05, 0, 0.04, 0.9, 0, CELL.DOT);
    }
  }
}
