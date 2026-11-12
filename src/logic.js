// =====================================================================
//  ARCANE SURVIVORS — игровая логика (survivor-like). Без отрисовки.
// =====================================================================
/* global DATA, Save, UI */

export const TAU = Math.PI * 2;
export const view = { W: 1280, H: 760 };   // видимая область в игровых пикселях

export function createLogic(canvas) {
  let W = 1280, H = 760;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // -------------------------------------------------------------------
  //  Ввод
  // -------------------------------------------------------------------
  const keys = {};
  const joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (!run) return;
    if (e.code === 'Space' || e.code === 'KeyE') { useHeart(); e.preventDefault(); }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (UI.togglePause) UI.togglePause(); }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (run && !run.paused && !run.over) UI.togglePause(true); });

  canvas.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (!joy.active) { joy.active = true; joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joy.dx = joy.dy = 0; }
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
        const l = Math.hypot(dx, dy), m = 50;
        if (l > m) { joy.ox += dx - (dx / l) * m; joy.oy += dy - (dy / l) * m; dx = (dx / l) * m; dy = (dy / l) * m; }
        joy.dx = dx / m; joy.dy = dy / m;
      }
    }
    e.preventDefault();
  }, { passive: false });
  const endTouch = (e) => {
    for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.active = false; joy.dx = joy.dy = 0; }
  };
  canvas.addEventListener('touchend', endTouch);
  canvas.addEventListener('touchcancel', endTouch);


  // -------------------------------------------------------------------
  //  Пространственная сетка для столкновений
  // -------------------------------------------------------------------
  const CELL = 72;
  const grid = new Map();
  const qbuf = [];
  function gkey(cx, cy) { return (cx + 32768) * 65536 + (cy + 32768); }
  function buildGrid() {
    grid.clear();
    for (const e of run.enemies) {
      if (e.dead) continue;
      const k = gkey(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      let b = grid.get(k);
      if (!b) { b = []; grid.set(k, b); }
      b.push(e);
    }
  }
  // Возвращает (в общий буфер!) врагов в радиусе r
  function query(x, y, r, out = qbuf) {
    out.length = 0;
    const x0 = Math.floor((x - r - 30) / CELL), x1 = Math.floor((x + r + 30) / CELL);
    const y0 = Math.floor((y - r - 30) / CELL), y1 = Math.floor((y + r + 30) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const b = grid.get(gkey(cx, cy));
      if (!b) continue;
      for (const e of b) {
        if (e.dead) continue;
        const rr = r + e.r;
        if (dist2(x, y, e.x, e.y) <= rr * rr) out.push(e);
      }
    }
    return out;
  }

  // -------------------------------------------------------------------
  //  Состояние забега
  // -------------------------------------------------------------------
  let run = null;

  function newPlayer() {
    const meta = (id) => Save.meta(id);
    return {
      x: 0, y: 0, r: 13, face: 1, walk: 0,
      baseHp: 100 + meta('vitality') * 10,
      hp: 0, maxHp: 0,
      lvl: 1, xp: 0, xpNext: xpFor(1),
      invuln: 0, heart: 0, regenAcc: 0,
      dmgMul: 1, cdMul: 1, areaMul: 1, amount: 0, speed: 150, magnet: 70, regen: 0,
      rerolls: meta('insight'),
    };
  }
  function xpFor(lvl) { return Math.floor(3 + lvl * 2.2 + lvl * lvl * 0.16); }

  function start(chapterId) {
    const ch = DATA.chapters[chapterId];
    run = {
      ch, chId: chapterId,
      time: 0, kills: 0, paused: false, over: false,
      p: newPlayer(),
      weapons: [], passives: {}, spec: null,
      enemies: [], shots: [], eShots: [], gems: [], pickups: [],
      rings: [], lines: [], blasts: [], parts: [], texts: [], hazards: [], holes: [], dying: [],
      spawnAcc: 0, boss: null, bossSpawned: false, victoryT: -1,
      elitesDone: 0, tidesDone: 0, fragmentsFound: [],
      shake: 0, flash: 0, flashColor: '#b46cff', heartUses: 0,
      bladeAngle: 0, auraTick: 0, banner: null,
      levelQueue: 0,
    };
    addWeapon('bolt');
    recalc();
    run.p.hp = run.p.maxHp;
    banner(ch.roman + '. ' + ch.name, 'Выживи до прихода стража');
  }

  function banner(title, sub, t = 3) { run.banner = { title, sub, t, max: t }; }

  function recalc() {
    const p = run.p, P = run.passives;
    const lv = (id) => P[id] || 0;
    p.maxHp = p.baseHp + lv('heart') * 20;
    p.regen = lv('heart') * 0.4;
    p.dmgMul = (1 + lv('tome') * 0.10) * (1 + Save.meta('power') * 0.06);
    p.cdMul = Math.pow(0.93, lv('crystal'));
    p.areaMul = 1 + lv('rune') * 0.10;
    p.amount = (lv('eye') >= 2 ? 1 : 0) + (lv('eye') >= 4 ? 1 : 0);
    p.speed = 150 * (1 + lv('boots') * 0.08) * (1 + Save.meta('haste') * 0.05);
    p.magnet = 90 * (1 + lv('magnet') * 0.30) * (1 + Save.meta('reach') * 0.15);
    if (run.spec === 'storm') { p.speed *= 1.15; p.cdMul *= 0.9; }
    p.hp = Math.min(p.hp, p.maxHp);
  }

  // -------------------------------------------------------------------
  //  Улучшения
  // -------------------------------------------------------------------
  function getWeapon(id) { return run.weapons.find((w) => w.id === id); }
  function addWeapon(id) {
    const w = getWeapon(id);
    if (w) { w.lvl = Math.min(5, w.lvl + 1); return; }
    run.weapons.push({ id, lvl: 1, evo: false, cd: 0.3, cd2: 0, angle: 0 });
  }

  function buildChoices(n = 3) {
    const pool = [];
    const specWeapon = run.spec ? DATA.specs[run.spec].weapon : null;
    // эволюции
    for (const w of run.weapons) {
      const def = DATA.weapons[w.id];
      if (w.lvl >= 5 && !w.evo && run.passives[def.evo.needs]) {
        pool.push({ type: 'evo', id: w.id, w: 100, icon: def.icon, color: '#ffd86b', title: '✧ ' + def.evo.name, desc: 'ЭВОЛЮЦИЯ: ' + def.evo.desc, tag: 'Эволюция' });
      }
    }
    for (const id in DATA.weapons) {
      const def = DATA.weapons[id], w = getWeapon(id);
      if (w && w.lvl >= 5) continue;
      if (!w && run.weapons.length >= DATA.rules.weaponSlots) continue;
      const lvl = w ? w.lvl + 1 : 1;
      pool.push({
        type: 'weapon', id, w: (id === specWeapon ? 3 : 1) * (w ? 1.4 : 1), icon: def.icon, color: def.color,
        title: def.name, desc: w ? def.lvlDesc[w.lvl] : def.desc, tag: w ? 'Ур. ' + lvl : 'Новое заклинание',
      });
    }
    for (const id in DATA.passives) {
      const def = DATA.passives[id], l = run.passives[id] || 0;
      if (l >= 5) continue;
      if (!l && Object.keys(run.passives).length >= DATA.rules.passiveSlots) continue;
      // подсказка эволюции
      const evoFor = Object.keys(DATA.weapons).find((k) => DATA.weapons[k].evo.needs === id && getWeapon(k));
      pool.push({
        type: 'passive', id, w: evoFor ? 1.3 : 1, icon: def.icon, color: '#d8c8ff', title: def.name,
        desc: def.desc + (evoFor ? ' (Эволюция для: ' + DATA.weapons[evoFor].name + ')' : ''), tag: l ? 'Ур. ' + (l + 1) : 'Артефакт',
      });
    }
    const out = [];
    const evos = pool.filter((o) => o.type === 'evo');
    if (evos.length) out.push(evos[0]);
    let rest = pool.filter((o) => o.type !== 'evo');
    while (out.length < n && rest.length) {
      const tot = rest.reduce((s, o) => s + o.w, 0);
      let r = Math.random() * tot, i = 0;
      for (; i < rest.length; i++) { r -= rest[i].w; if (r <= 0) break; }
      i = Math.min(i, rest.length - 1);
      out.push(rest[i]);
      rest.splice(i, 1);
    }
    if (!out.length) {
      out.push({ type: 'heal', id: 'heal', icon: '✚', color: '#7dffa8', title: 'Эфирный эликсир', desc: 'Восстановить 40% здоровья и +10 Эфира.', tag: 'Дар' });
    }
    return out;
  }

  function specChoices() {
    return Object.keys(DATA.specs).map((id) => {
      const s = DATA.specs[id];
      return { type: 'spec', id, icon: s.icon, color: s.color, title: s.name, desc: s.desc, tag: 'Магическая школа' };
    });
  }

  function applyChoice(c) {
    const p = run.p;
    if (c.type === 'weapon') addWeapon(c.id);
    else if (c.type === 'passive') {
      run.passives[c.id] = (run.passives[c.id] || 0) + 1;
      if (c.id === 'heart') p.hp += 20;
      if (c.id === 'eye') Save.addCorruption(1);
    } else if (c.type === 'evo') {
      const w = getWeapon(c.id); w.evo = true;
      banner('Эволюция!', DATA.weapons[c.id].evo.name, 2.5);
      run.flash = 0.6; run.flashColor = '#ffd86b';
    } else if (c.type === 'spec') {
      run.spec = c.id;
      const s = DATA.specs[c.id];
      if (!getWeapon(s.weapon)) {
        if (run.weapons.length >= DATA.rules.weaponSlots) run.weapons[run.weapons.length - 1] = { id: s.weapon, lvl: 1, evo: false, cd: 0.3, cd2: 0, angle: 0 };
        else addWeapon(s.weapon);
      } else addWeapon(s.weapon);
      if (c.id === 'void') Save.addCorruption(8);
      banner(s.name, 'Твоя магическая школа выбрана', 2.5);
      run.flash = 0.6; run.flashColor = s.color;
    } else if (c.type === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4);
      run.bonusEther = (run.bonusEther || 0) + 10;
    }
    recalc();
  }

  // -------------------------------------------------------------------
  //  Сердце Эфира
  // -------------------------------------------------------------------
  function useHeart() {
    if (!run || run.paused || run.over) return;
    const p = run.p;
    if (p.heart < 100) return;
    p.heart = 0;
    run.heartUses++;
    Save.addCorruption(2);
    const R = Math.max(W, H) * 0.75;
    const list = query(p.x, p.y, R, []);
    for (const e of list) {
      damage(e, (e.boss ? 220 : 160) * p.dmgMul * (run.spec === 'void' ? 1.4 : 1), 'void', true);
      if (!e.boss) { const a = Math.atan2(e.y - p.y, e.x - p.x); e.kx = Math.cos(a) * 400; e.ky = Math.sin(a) * 400; }
    }
    run.eShots.length = 0;
    p.invuln = Math.max(p.invuln, 1.5);
    run.flash = 0.8; run.flashColor = '#b46cff';
    run.shake = 14;
    run.rings.push({ x: p.x, y: p.y, r: 10, max: R, speed: 1600, dmg: 0, hit: null, color: '#c78bff', visual: true, width: 18 });
    texts(p.x, p.y - 40, 'СЕРДЦЕ ЭФИРА', '#e0b8ff', 22);
    if (UI.onHeartUsed) UI.onHeartUsed();
  }

  // -------------------------------------------------------------------
  //  Урон и смерть врагов
  // -------------------------------------------------------------------
  function texts(x, y, txt, color, size = 14) {
    if (run.texts.length > 70) return;
    run.texts.push({ x, y, txt, color, size, life: 0.8 });
  }

  function particles(x, y, color, n, speed = 120, life = 0.5, size = 3) {
    if (run.parts.length > 700) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = Math.random() * speed;
      run.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rand(0.5, 1), max: life, color, size: size * rand(0.6, 1.2) });
    }
  }

  const SCHOOL_OF = { bolt: 'arcane', lightning: 'storm', fire: 'fire', frost: 'frost', blood: 'blood', void: 'void' };

  function damage(e, dmg, el, noText) {
    if (e.dead) return;
    const spec = run.spec;
    if (spec && spec === el) dmg *= spec === 'void' ? 1.4 : 1.5;
    if (spec === 'fire' && el !== 'burn') { e.burnT = 2.5; e.burnDps = Math.max(e.burnDps || 0, dmg * 0.25); }
    if (spec === 'frost') { e.slowT = Math.max(e.slowT || 0, 1.0); e.slow = Math.max(e.slow || 0, 0.3); }
    e.hp -= dmg;
    e.flash = 0.08;
    run.dealt = (run.dealt || 0) + dmg;
    if (!noText && (dmg >= 8 || Math.random() < 0.3)) texts(e.x + rand(-6, 6), e.y - e.r - 4, Math.round(dmg), el === 'burn' ? '#ffa860' : '#ffffff', dmg > 60 ? 16 : 12);
    if (e.hp <= 0) kill(e);
  }

  function kill(e) {
    e.dead = true;
    if (run.dying.length < 120) run.dying.push({ e, t: 0 });
    run.kills++;
    const p = run.p;
    particles(e.x, e.y, e.color, e.boss ? 80 : e.elite ? 30 : 7, e.boss ? 320 : 140, 0.6, e.boss ? 5 : 3);
    if (run.spec === 'blood') p.hp = Math.min(p.maxHp, p.hp + 1);
    if (e.bladeKill) {
      const b = getWeapon('blood');
      if (b) p.hp = Math.min(p.maxHp, p.hp + (b.evo ? 1.2 : 0.4));
    }
    if (e.boss) { onBossDown(e); return; }
    dropGem(e.x, e.y, e.xp);
    if (e.elite) {
      run.pickups.push({ x: e.x, y: e.y, kind: 'fragment', t: 0 });
      run.pickups.push({ x: e.x + 20, y: e.y, kind: 'heal', t: 0 });
      run.shake = Math.max(run.shake, 6);
    } else if (Math.random() < 0.004) {
      run.pickups.push({ x: e.x, y: e.y, kind: Math.random() < 0.5 ? 'magnet' : 'heal', t: 0 });
    }
  }

  function dropGem(x, y, val) {
    if (run.gems.length > 450) {
      const g = run.gems[(Math.random() * run.gems.length) | 0];
      g.val += val; return;
    }
    run.gems.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), val, mag: false });
  }

  function onBossDown(e) {
    run.boss = null;
    run.victoryT = 3.0;
    run.shake = 20; run.flash = 1; run.flashColor = '#ffffff';
    for (const g of run.gems) g.mag = true;
    run.pickups.push({ x: e.x, y: e.y, kind: 'fragment', t: 0 });
    for (const en of run.enemies) if (!en.dead) { en.dead = true; particles(en.x, en.y, en.color, 4); }
    run.eShots.length = 0; run.hazards.length = 0;
    banner('Страж повержен', DATA.bosses[e.bossId].name, 3);
  }

  // -------------------------------------------------------------------
  //  Спавн врагов
  // -------------------------------------------------------------------
  function spawnPos(extra = 60) {
    const a = Math.random() * TAU;
    const R = Math.hypot(W, H) / 2 + extra;
    return [run.p.x + Math.cos(a) * R, run.p.y + Math.sin(a) * R];
  }

  function makeEnemy(type, x, y, elite = false) {
    const d = DATA.enemies[type];
    const t = run.time;
    const hpScale = run.ch.hpMul * (1 + t / 140) * (1 + run.chId * 0.12 * t / 240) * (elite ? 14 : 1);
    const e = {
      type, x, y, r: d.r * (elite ? 1.6 : 1), hp: d.hp * hpScale, maxHp: d.hp * hpScale,
      speed: d.speed * (elite ? 0.85 : 1) * rand(0.9, 1.1), dmg: d.dmg * (1 + run.chId * 0.12) * (1 + t / 400) * (elite ? 1.5 : 1),
      color: d.color, shape: d.shape, xp: d.xp * (elite ? 25 : 1), ranged: d.ranged || null,
      shootCd: d.ranged ? rand(1, d.ranged.cd) : 0, elite, seed: Math.random() * 10,
      slowT: 0, slow: 0, burnT: 0, burnDps: 0, frozen: 0, flash: 0, kx: 0, ky: 0, hits: {},
    };
    run.enemies.push(e);
    return e;
  }

  function spawnTick(dt) {
    const t = run.time;
    if (run.victoryT >= 0) return;
    let rate = (0.9 + t * 0.032) * (1 + run.chId * 0.1);
    if (run.boss) rate *= 0.35;
    run.spawnAcc += rate * dt;
    const types = run.ch.enemies;
    const weights = [6, t > 35 ? 3 : 0, t > 95 ? 1.6 : 0];
    const tot = weights[0] + weights[1] + weights[2];
    let ranged = 0;
    for (const e of run.enemies) if (e.ranged && !e.dead) ranged++;
    while (run.spawnAcc >= 1) {
      run.spawnAcc--;
      if (run.enemies.length >= DATA.rules.maxEnemies) { run.spawnAcc = 0; break; }
      let r = Math.random() * tot, i = 0;
      while (r > weights[i]) { r -= weights[i]; i++; }
      let type = types[Math.min(i, 2)];
      if (DATA.enemies[type].ranged && ranged > 22) type = types[0];
      // В Сердце Бездны встречаются твари из прошлых глав
      if (run.chId === 3 && Math.random() < 0.15) type = pick(['ghost', 'wolf', 'skeleton', 'deadmage']);
      const [x, y] = spawnPos();
      makeEnemy(type, x, y);
    }
    // элиты
    const et = DATA.rules.eliteTimes;
    if (run.elitesDone < et.length && t >= et[run.elitesDone]) {
      run.elitesDone++;
      const [x, y] = spawnPos(20);
      makeEnemy(types[Math.min(run.elitesDone - 1, 2)], x, y, true);
      banner('Носитель памяти', 'Убей элитного врага, чтобы узнать правду', 2.2);
    }
    // прилив Бездны — кольцо врагов
    const tt = DATA.rules.tideTimes;
    if (run.tidesDone < tt.length && t >= tt[run.tidesDone]) {
      run.tidesDone++;
      const n = 34 + run.chId * 6, R = Math.max(W, H) * 0.55;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        makeEnemy(types[0], run.p.x + Math.cos(a) * R, run.p.y + Math.sin(a) * R);
      }
      banner('Прилив Бездны', 'Они окружают тебя', 2);
    }
    // босс
    if (!run.bossSpawned && t >= DATA.rules.bossTime) {
      run.bossSpawned = true;
      spawnBoss();
    }
  }

  function spawnBoss() {
    const id = run.ch.boss, d = DATA.bosses[id];
    const [x, y] = spawnPos(-80);
    const e = {
      type: id, bossId: id, boss: true, x, y, r: d.r, hp: d.hp, maxHp: d.hp,
      speed: d.speed, dmg: d.dmg, color: d.color, shape: d.shape, xp: 0,
      slowT: 0, slow: 0, burnT: 0, burnDps: 0, frozen: 0, flash: 0, kx: 0, ky: 0, hits: {}, seed: 0,
      ai: { t: 0, a: 0, b: 0, c: 0, d: 0, mode: 'walk', mt: 0, spin: 0, vx: 0, vy: 0, tx: 0, ty: 0 },
    };
    run.enemies.push(e);
    run.boss = e;
    run.shake = 10;
    if (UI.onBoss) UI.onBoss(d);
  }

  // -------------------------------------------------------------------
  //  Вражеские снаряды и опасные зоны
  // -------------------------------------------------------------------
  function eShot(x, y, a, speed, dmg, color, r = 6) {
    if (run.boss && x === run.boss.x && y === run.boss.y) run.boss.atk = 0.4;
    run.eShots.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, color, r, life: 6 });
  }
  function ringShots(e, n, speed, off, color, r) {
    for (let i = 0; i < n; i++) eShot(e.x, e.y, off + i / n * TAU, speed, e.dmg * 0.6, color, r);
  }
  function hazard(x, y, r, delay, dmg, color) { run.hazards.push({ x, y, r, t: 0, delay, dmg, color, done: false }); }

  // -------------------------------------------------------------------
  //  ИИ боссов
  // -------------------------------------------------------------------
  function bossAI(e, dt) {
    const p = run.p, ai = e.ai;
    ai.t += dt; ai.a -= dt; ai.b -= dt; ai.c -= dt; ai.d -= dt;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    const hpf = e.hp / e.maxHp;
    const enraged = hpf < 0.5;
    let move = true, spd = e.speed;

    if (ai.mode === 'windup') {
      move = false; ai.mt -= dt;
      if (ai.mt <= 0) { ai.mode = 'charge'; ai.mt = 0.65; ai.vx = Math.cos(ai.dir) * 560; ai.vy = Math.sin(ai.dir) * 560; }
    } else if (ai.mode === 'charge') {
      move = false; ai.mt -= dt;
      e.x += ai.vx * dt; e.y += ai.vy * dt;
      if (Math.random() < 0.6) particles(e.x, e.y, '#ff5a5a', 1, 40, 0.4);
      if (ai.mt <= 0) {
        ai.mode = 'walk';
        if (e.bossId === 'fallen_knight' || e.bossId === 'abyss_lord') ringShots(e, enraged ? 14 : 10, 170, ai.t, '#ff7a7a', 7);
      }
    }

    switch (e.bossId) {
      case 'fallen_knight': {
        if (ai.mode === 'walk' && ai.a <= 0) { ai.a = enraged ? 3 : 4.2; ai.mode = 'windup'; ai.mt = 0.75; ai.dir = ang; }
        if (ai.b <= 0 && ai.mode === 'walk') {
          ai.b = enraged ? 2.4 : 3.4;
          const n = enraged ? 9 : 7;
          for (let i = 0; i < n; i++) eShot(e.x, e.y, ang + (i - (n - 1) / 2) * 0.16, 230, e.dmg * 0.6, '#ffd0d0', 7);
        }
        break;
      }
      case 'devourer': {
        spd *= 0.9;
        const d = Math.sqrt(dist2(e.x, e.y, p.x, p.y));
        if (d < 560) { const pull = (enraged ? 95 : 75) * dt; p.x -= Math.cos(ang) * pull; p.y -= Math.sin(ang) * pull; }
        if (ai.a <= 0) { ai.a = 2.6; for (let i = -2; i <= 2; i++) eShot(e.x, e.y, ang + i * 0.22, 190, e.dmg * 0.55, '#a6ff5a', 9); }
        if (ai.b <= 0) { ai.b = 8; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; makeEnemy('wolf', e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80); } }
        if (enraged && ai.c <= 0) { ai.c = 3.5; ringShots(e, 22, 150, ai.t, '#7dff7a', 8); }
        break;
      }
      case 'soulless_king': {
        if (ai.a <= 0) { ai.a = enraged ? 2.5 : 3.5; ringShots(e, 18, 160, ai.t * 0.7, '#ffe27a', 7); }
        if (ai.b <= 0) {
          ai.b = 7;
          particles(e.x, e.y, '#ffe27a', 30, 200);
          const a = Math.random() * TAU;
          e.x = p.x + Math.cos(a) * 260; e.y = p.y + Math.sin(a) * 260;
          particles(e.x, e.y, '#ffe27a', 30, 200);
          ai.a = Math.min(ai.a, 0.6);
        }
        if (ai.c <= 0) { ai.c = 9; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.7; makeEnemy('deadmage', e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); } }
        if (enraged) { ai.spin += dt; if (ai.d <= 0) { ai.d = 0.16; eShot(e.x, e.y, ai.spin * 2.2, 180, e.dmg * 0.5, '#fff0a0', 6); eShot(e.x, e.y, ai.spin * 2.2 + Math.PI, 180, e.dmg * 0.5, '#fff0a0', 6); } }
        break;
      }
      case 'abyss_lord': {
        const phase = hpf > 0.66 ? 1 : hpf > 0.33 ? 2 : 3;
        if (phase !== ai.phase) {
          ai.phase = phase;
          if (phase > 1) { banner('Фаза ' + phase, phase === 2 ? 'Бездна пробуждается' : 'Последний вздох Владыки', 2); run.shake = 15; ringShots(e, 30, 200, 0, '#e08bff', 8); }
        }
        ai.spin += dt;
        if (ai.d <= 0) {
          ai.d = phase === 3 ? 0.09 : 0.14;
          const arms = phase === 1 ? 2 : 3;
          for (let i = 0; i < arms; i++) eShot(e.x, e.y, ai.spin * 1.7 + i * TAU / arms, 170, e.dmg * 0.45, '#d68bff', 6);
        }
        if (ai.mode === 'walk' && ai.a <= 0) { ai.a = phase === 3 ? 3.5 : 5.5; ai.mode = 'windup'; ai.mt = 0.7; ai.dir = ang; }
        if (phase >= 2) {
          if (ai.b <= 0) { ai.b = 6; for (let i = 0; i < 5; i++) { const [x, y] = [e.x + rand(-120, 120), e.y + rand(-120, 120)]; makeEnemy('spawn', x, y); } }
          const d = Math.sqrt(dist2(e.x, e.y, p.x, p.y));
          if (d < 520) { const pull = 40 * dt; p.x -= Math.cos(ang) * pull; p.y -= Math.sin(ang) * pull; }
        }
        if (phase === 3 && ai.c <= 0) {
          ai.c = 2.2;
          hazard(p.x, p.y, 85, 1.0, e.dmg * 1.1, '#b46cff');
          hazard(p.x + rand(-160, 160), p.y + rand(-160, 160), 85, 1.2, e.dmg * 1.1, '#b46cff');
        }
        break;
      }
    }
    if (move && ai.mode === 'walk') {
      const d = Math.sqrt(dist2(e.x, e.y, p.x, p.y));
      if (d > e.r + p.r) { e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt; }
    }
    if (ai.mode === 'walk') e.face = Math.cos(ang) >= 0 ? 1 : -1;
  }

  // -------------------------------------------------------------------
  //  Заклинания игрока
  // -------------------------------------------------------------------
  function nearestEnemy(x, y, maxR = 700, exclude) {
    let best = null, bd = maxR * maxR;
    for (const e of run.enemies) {
      if (e.dead || (exclude && exclude.has(e))) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function randomEnemyOnScreen() {
    const p = run.p, vis = [];
    for (const e of run.enemies) if (!e.dead && Math.abs(e.x - p.x) < W / 2 && Math.abs(e.y - p.y) < H / 2) vis.push(e);
    return vis.length ? pick(vis) : null;
  }

  function shoot(o) {
    run.p.castT = 0.3; run.p.castA = Math.atan2(o.vy, o.vx);
    run.shots.push(Object.assign({ pierce: 1, life: 2, r: 6, hit: new Set(), homing: 0, kind: 'bolt', slow: 0 }, o));
  }

  function chainLightning(start, dmg, jumps, range) {
    run.p.castT = 0.3; run.p.castA = Math.atan2(start.y - run.p.y, start.x - run.p.x);
    let cur = start, prevX = run.p.x, prevY = run.p.y - 10;
    const hit = new Set();
    for (let i = 0; i <= jumps && cur; i++) {
      hit.add(cur);
      run.lines.push({ x1: prevX, y1: prevY, x2: cur.x, y2: cur.y, life: 0.18, color: '#fff27a' });
      particles(cur.x, cur.y, '#fff7b0', 3, 90, 0.3, 2);
      prevX = cur.x; prevY = cur.y;
      const next = nearestEnemy(cur.x, cur.y, range, hit);
      damage(cur, dmg, 'storm');
      cur = next;
    }
  }

  function updateWeapons(dt) {
    const p = run.p;
    for (const w of run.weapons) {
      w.cd -= dt;
      const L = w.lvl, A = p.amount, D = p.dmgMul, CD = p.cdMul, AR = p.areaMul;
      switch (w.id) {
        case 'bolt': {
          if (w.cd > 0) break;
          if (w.evo) {
            w.cd = 0.55 * CD;
            const n = 5 + A;
            for (let i = 0; i < n; i++) {
              const a = Math.random() * TAU;
              shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, dmg: 34 * D, pierce: 3, homing: 6, color: '#cfe8ff', r: 7 * AR, el: 'arcane', life: 2.2, star: true });
            }
          } else {
            const t = nearestEnemy(p.x, p.y, 650);
            if (!t) { w.cd = 0.1; break; }
            w.cd = (0.8 - (L >= 3 ? 0.12 : 0)) * CD;
            const n = 1 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0) + A;
            const base = Math.atan2(t.y - p.y, t.x - p.x);
            for (let i = 0; i < n; i++) {
              const a = base + (i - (n - 1) / 2) * 0.12;
              shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, dmg: (14 + (L >= 3 ? 6 : 0) + (L >= 5 ? 8 : 0)) * D, pierce: 1 + (L >= 4 ? 1 : 0) + (L >= 5 ? 1 : 0), color: '#9ad0ff', r: 6 * AR, el: 'arcane', life: 1.6 });
            }
          }
          break;
        }
        case 'lightning': {
          if (w.cd > 0) break;
          if (w.evo) {
            w.cd = 0.55 * CD;
            for (let i = 0; i < 3 + A; i++) {
              const t = randomEnemyOnScreen(); if (!t) break;
              run.lines.push({ x1: t.x + rand(-40, 40), y1: t.y - 500, x2: t.x, y2: t.y, life: 0.2, color: '#fffbd0', wide: true });
              for (const e of query(t.x, t.y, 60 * AR, [])) damage(e, 40 * D, 'storm');
              run.blasts.push({ x: t.x, y: t.y, r: 60 * AR, life: 0.2, max: 0.2, color: '#fff27a' });
              chainLightning(t, 26 * D, 4, 150);
            }
          } else {
            const t = nearestEnemy(p.x, p.y, 500);
            if (!t) { w.cd = 0.1; break; }
            w.cd = (1.7 - (L >= 3 ? 0.3 : 0) - (L >= 5 ? 0.3 : 0)) * CD;
            const jumps = 2 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0) + (L >= 5 ? 2 : 0) + A;
            chainLightning(t, (16 + (L >= 2 ? 6 : 0) + (L >= 4 ? 8 : 0)) * D, jumps, 150 * AR);
          }
          break;
        }
        case 'fire': {
          if (w.evo) {
            run.auraTick -= dt;
            if (run.auraTick <= 0) {
              run.auraTick = 0.25;
              for (const e of query(p.x, p.y, 95 * AR, [])) { damage(e, 7 * D, 'fire', true); e.burnT = 2; e.burnDps = Math.max(e.burnDps, 12 * D); }
            }
          }
          if (w.cd > 0) break;
          const R = (w.evo ? 260 : 110 + (L >= 2 ? 25 : 0) + (L >= 4 ? 30 : 0)) * AR;
          w.cd = (w.evo ? 1.6 : 3.0 - (L >= 3 ? 0.5 : 0) - (L >= 5 ? 0.5 : 0)) * CD;
          run.rings.push({ x: p.x, y: p.y, r: 8, max: R, speed: R * 2.6, dmg: (w.evo ? 45 : 18 + (L >= 2 ? 6 : 0) + (L >= 4 ? 8 : 0) + (L >= 5 ? 8 : 0)) * D, hit: new Set(), color: '#ff8a3c', el: 'fire', burn: (w.evo ? 18 : 4 + L * 2) * D, width: 10 });
          break;
        }
        case 'frost': {
          if (w.evo) {
            w.cd2 -= dt;
            if (w.cd2 <= 0) {
              w.cd2 = 4.5 * CD;
              const R = 420 * AR;
              for (const e of query(p.x, p.y, R, [])) { e.frozen = e.boss ? 0.6 : 2.2; damage(e, 40 * D, 'frost'); }
              run.rings.push({ x: p.x, y: p.y, r: 10, max: R, speed: 1400, dmg: 0, hit: null, color: '#bff8ff', visual: true, width: 14 });
              run.flash = 0.25; run.flashColor = '#bff8ff';
            }
          }
          if (w.cd > 0) break;
          w.cd = (w.evo ? 0.9 : 1.4 - (L >= 4 ? 0.3 : 0)) * CD;
          const n = (w.evo ? 16 : 3 + (L >= 2 ? 1 : 0) + (L >= 3 ? 1 : 0) + (L >= 4 ? 1 : 0) + (L >= 5 ? 2 : 0)) + A;
          const off = Math.random() * TAU;
          for (let i = 0; i < n; i++) {
            const a = off + i / n * TAU;
            shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, dmg: (w.evo ? 26 : 9 + (L >= 2 ? 4 : 0) + (L >= 5 ? 6 : 0)) * D, pierce: (L >= 3 ? 2 : 1) + (w.evo ? 2 : 0), color: '#9ff4ff', r: 5 * AR, el: 'frost', slow: 0.45, life: 1.1, kind: 'shard' });
          }
          break;
        }
        case 'blood': {
          const n = (w.evo ? 6 : 2 + (L >= 3 ? 1 : 0) + (L >= 5 ? 1 : 0)) + A;
          const R = (w.evo ? 115 : 72 + (L >= 4 ? 18 : 0)) * AR;
          const dmg = (w.evo ? 32 : 10 + (L >= 2 ? 5 : 0) + (L >= 4 ? 6 : 0) + (L >= 5 ? 6 : 0)) * D;
          w.angle += dt * (w.evo ? 3.6 : 3.0);
          w.blades = [];
          for (let i = 0; i < n; i++) {
            const a = w.angle + i / n * TAU;
            const bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
            w.blades.push({ x: bx, y: by, a });
            for (const e of query(bx, by, (w.evo ? 18 : 12) * AR)) {
              const last = e.hits.blood || -9;
              if (run.time - last < 0.35) continue;
              e.hits.blood = run.time;
              e.bladeKill = true;
              damage(e, dmg, 'blood');
              if (!e.dead) e.bladeKill = false;
              if (w.evo) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.01);
              particles(e.x, e.y, '#ff3b5c', 2, 80, 0.3);
            }
          }
          break;
        }
        case 'void': {
          if (w.cd > 0) break;
          if (w.evo) {
            w.cd = 4.0 * CD;
            const t = randomEnemyOnScreen() || nearestEnemy(p.x, p.y, 800);
            const tx = t ? t.x : p.x + rand(-200, 200), ty = t ? t.y : p.y + rand(-200, 200);
            run.holes.push({ x: tx, y: ty, t: 0, life: 3, r: 210 * AR, dmg: 22 * D, tick: 0, final: 140 * D });
            for (let i = 1; i <= A; i++) run.holes.push({ x: tx + rand(-250, 250), y: ty + rand(-250, 250), t: 0, life: 3, r: 170 * AR, dmg: 18 * D, tick: 0, final: 110 * D });
          } else {
            w.cd = (2.6 - (L >= 5 ? 0.6 : 0)) * CD;
            const n = 1 + (L >= 3 ? 1 : 0) + (L >= 5 ? 1 : 0) + A;
            for (let i = 0; i < n; i++) {
              const t = randomEnemyOnScreen() || nearestEnemy(p.x, p.y, 700);
              const a = t ? Math.atan2(t.y - p.y, t.x - p.x) + rand(-0.2, 0.2) : Math.random() * TAU;
              shoot({ x: p.x, y: p.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg: (34 + (L >= 2 ? 12 : 0) + (L >= 4 ? 16 : 0)) * D, pierce: 1, color: '#b46cff', r: 10 * AR, el: 'void', life: 1.5, kind: 'orb', blast: (75 + (L >= 2 ? 15 : 0) + (L >= 4 ? 20 : 0)) * AR });
            }
          }
          break;
        }
      }
    }
  }

  function explode(x, y, R, dmg, el, color) {
    for (const e of query(x, y, R, [])) damage(e, dmg, el);
    run.blasts.push({ x, y, r: R, life: 0.3, max: 0.3, color });
    particles(x, y, color, 14, R * 2, 0.45, 3);
    run.shake = Math.max(run.shake, 3);
  }

  // -------------------------------------------------------------------
  //  Обновление
  // -------------------------------------------------------------------
  function hurt(d) {
    const p = run.p;
    if (p.invuln > 0 || run.victoryT >= 0) return;
    p.hp -= d;
    p.invuln = 0.5;
    run.shake = Math.max(run.shake, 7);
    run.flash = Math.max(run.flash, 0.25); run.flashColor = '#ff2040';
    texts(p.x, p.y - 26, '-' + Math.round(d), '#ff6a7a', 15);
    if (p.hp <= 0) { p.hp = 0; endRun(false); }
  }

  function update(dt) {
    const p = run.p;
    run.time += dt;

    // --- движение игрока
    let mx = 0, my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (joy.active) { mx += joy.dx; my += joy.dy; }
    const ml = Math.hypot(mx, my);
    if (ml > 0) {
      const k = Math.min(1, ml) / ml;
      p.x += mx * k * p.speed * dt; p.y += my * k * p.speed * dt;
      if (Math.abs(mx) > 0.1) p.face = mx > 0 ? 1 : -1;
      p.moveA = Math.atan2(my, mx);
      p.walk += dt * 10;
      p.moving = true;
    } else p.moving = false;
    p.invuln -= dt;
    p.castT = Math.max(0, (p.castT || 0) - dt);
    if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

    buildGrid();
    spawnTick(dt);
    updateWeapons(dt);

    // --- враги
    const sep = [];
    for (const e of run.enemies) {
      if (e.dead) continue;
      e.flash -= dt;
      if (e.burnT > 0) {
        e.burnT -= dt;
        e.burnAcc = (e.burnAcc || 0) + dt;
        if (e.burnAcc >= 0.5) { e.burnAcc = 0; damage(e, e.burnDps * 0.5, 'burn'); if (e.dead) continue; }
      }
      if (e.frozen > 0) { e.frozen -= dt; }
      else if (e.boss) bossAI(e, dt);
      else {
        let spd = e.speed;
        if (e.slowT > 0) { e.slowT -= dt; spd *= 1 - e.slow; }
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        // стрелки держат дистанцию
        let dir = 1;
        if (e.ranged && d < e.ranged.range * 0.65) dir = -0.4;
        e.x += (dx / d) * spd * dt * dir; e.y += (dy / d) * spd * dt * dir;
        e.face = dx >= 0 ? 1 : -1;
        if (e.ranged) {
          e.shootCd -= dt;
          if (e.shootCd <= 0 && d < e.ranged.range) {
            e.shootCd = e.ranged.cd * rand(0.8, 1.2);
            e.atk = 0.35;
            eShot(e.x, e.y, Math.atan2(dy, dx), e.ranged.speed, e.ranged.dmg * (1 + run.chId * 0.12), e.ranged.color, 5);
          }
        }
        // перенос далёких врагов
        if (d > 1400 && !e.elite) { const [x, y] = spawnPos(); e.x = x; e.y = y; }
      }
      // отбрасывание
      if (e.kx || e.ky) { e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= 0.88; e.ky *= 0.88; if (Math.abs(e.kx) + Math.abs(e.ky) < 5) e.kx = e.ky = 0; }
      // расталкивание
      if (!e.boss) {
        query(e.x, e.y, e.r, sep);
        let c = 0;
        for (const o of sep) {
          if (o === e || c > 5) continue;
          const dx = e.x - o.x, dy = e.y - o.y, dd = Math.hypot(dx, dy) || 0.01, min = e.r + o.r;
          if (dd < min) { const push = (min - dd) * 0.35; e.x += (dx / dd) * push; e.y += (dy / dd) * push; c++; }
        }
      }
      // контакт с игроком
      const rr = e.r + p.r - 3;
      if (dist2(e.x, e.y, p.x, p.y) < rr * rr) hurt(e.dmg);
    }

    // --- снаряды игрока
    for (const s of run.shots) {
      s.life -= dt;
      if (s.homing) {
        const t = nearestEnemy(s.x, s.y, 300, s.hit);
        if (t) {
          const a = Math.atan2(t.y - s.y, t.x - s.x), sp = Math.hypot(s.vx, s.vy);
          const cur = Math.atan2(s.vy, s.vx);
          let da = a - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
          const na = cur + clamp(da, -s.homing * dt, s.homing * dt);
          s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
        }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'orb' && s.life <= 0) { explode(s.x, s.y, s.blast, s.dmg, 'void', '#b46cff'); continue; }
      for (const e of query(s.x, s.y, s.r)) {
        if (s.hit.has(e)) continue;
        s.hit.add(e);
        if (s.kind === 'orb') { explode(s.x, s.y, s.blast, s.dmg, 'void', '#b46cff'); s.life = -1; break; }
        damage(e, s.dmg, s.el);
        if (s.slow && !e.dead) { e.slowT = 1.6; e.slow = Math.max(e.slow, s.slow); }
        if (!e.boss && !e.dead) { const sp = Math.hypot(s.vx, s.vy) || 1; e.kx += s.vx / sp * 60; e.ky += s.vy / sp * 60; }
        particles(s.x, s.y, s.color, 2, 60, 0.25, 2);
        if (--s.pierce <= 0) { s.life = -1; break; }
      }
    }
    run.shots = run.shots.filter((s) => s.life > 0);

    // --- кольца огня
    for (const r of run.rings) {
      r.r += r.speed * dt;
      if (!r.visual) {
        for (const e of query(r.x, r.y, r.r, [])) {
          if (r.hit.has(e)) continue;
          if (dist2(r.x, r.y, e.x, e.y) < (r.r - 40) * (r.r - 40)) { r.hit.add(e); continue; }
          r.hit.add(e);
          damage(e, r.dmg, r.el);
          if (!e.dead) { e.burnT = 3; e.burnDps = Math.max(e.burnDps, r.burn); }
        }
      }
    }
    run.rings = run.rings.filter((r) => r.r < r.max);

    // --- чёрные дыры
    for (const h of run.holes) {
      h.t += dt; h.tick -= dt;
      for (const e of query(h.x, h.y, h.r, [])) {
        if (e.boss) continue;
        const a = Math.atan2(h.y - e.y, h.x - e.x);
        e.x += Math.cos(a) * 160 * dt; e.y += Math.sin(a) * 160 * dt;
      }
      if (h.tick <= 0) { h.tick = 0.3; for (const e of query(h.x, h.y, h.r * 0.45, [])) damage(e, h.dmg, 'void', true); }
      if (Math.random() < 0.5) {
        const a = Math.random() * TAU;
        run.parts.push({ x: h.x + Math.cos(a) * h.r, y: h.y + Math.sin(a) * h.r, vx: -Math.cos(a) * h.r * 1.5, vy: -Math.sin(a) * h.r * 1.5, life: 0.6, max: 0.6, color: '#c78bff', size: 2.5 });
      }
      if (h.t >= h.life) explode(h.x, h.y, h.r * 0.7, h.final, 'void', '#d0a0ff');
    }
    run.holes = run.holes.filter((h) => h.t < h.life);

    // --- вражеские снаряды
    for (const s of run.eShots) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const rr = s.r + p.r - 2;
      if (dist2(s.x, s.y, p.x, p.y) < rr * rr) { hurt(s.dmg); s.life = 0; }
    }
    run.eShots = run.eShots.filter((s) => s.life > 0);

    for (const h of run.hazards) {
      h.t += dt;
      if (!h.done && h.t >= h.delay) {
        h.done = true;
        run.blasts.push({ x: h.x, y: h.y, r: h.r, life: 0.35, max: 0.35, color: h.color });
        if (dist2(h.x, h.y, p.x, p.y) < (h.r + p.r) * (h.r + p.r)) hurt(h.dmg);
      }
    }
    run.hazards = run.hazards.filter((h) => h.t < h.delay + 0.1);

    // --- кристаллы опыта
    const mag2 = p.magnet * p.magnet;
    for (const g of run.gems) {
      const d2 = dist2(g.x, g.y, p.x, p.y);
      if (!g.mag && d2 < mag2) g.mag = true;
      if (g.mag) {
        const d = Math.sqrt(d2) || 1, sp = 420 + (run.victoryT >= 0 ? 400 : 0);
        g.x += (p.x - g.x) / d * sp * dt; g.y += (p.y - g.y) / d * sp * dt;
        if (d < p.r + 8) { g.dead = true; gainXp(g.val); }
      }
    }
    run.gems = run.gems.filter((g) => !g.dead);

    for (const k of run.pickups) {
      k.t += dt;
      const d2 = dist2(k.x, k.y, p.x, p.y);
      if (d2 < (p.magnet * 0.8) ** 2 || run.victoryT >= 0) {
        const d = Math.sqrt(d2) || 1;
        k.x += (p.x - k.x) / d * 300 * dt; k.y += (p.y - k.y) / d * 300 * dt;
      }
      if (d2 < (p.r + 14) ** 2) { k.dead = true; collect(k); }
    }
    run.pickups = run.pickups.filter((k) => !k.dead);

    run.enemies = run.enemies.filter((e) => !e.dead);

    // --- эффекты
    for (const l of run.lines) l.life -= dt;
    run.lines = run.lines.filter((l) => l.life > 0);
    for (const b of run.blasts) b.life -= dt;
    run.blasts = run.blasts.filter((b) => b.life > 0);
    for (const pt of run.parts) { pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= 0.92; pt.vy *= 0.92; }
    run.parts = run.parts.filter((pt) => pt.life > 0);
    for (const t of run.texts) { t.life -= dt; t.y -= 32 * dt; }
    run.texts = run.texts.filter((t) => t.life > 0);
    run.shake = Math.max(0, run.shake - dt * 30);
    run.flash = Math.max(0, run.flash - dt * 1.5);
    if (run.banner) { run.banner.t -= dt; if (run.banner.t <= 0) run.banner = null; }

    // --- победа
    if (run.victoryT >= 0) {
      run.victoryT -= dt;
      if (run.victoryT < 0 && !run.over) endRun(true);
    }

    if (run.levelQueue > 0 && !run.over) {
      run.levelQueue--;
      levelUp();
    }
  }

  function gainXp(v) {
    const p = run.p;
    p.xp += v;
    run.xpTotal = (run.xpTotal || 0) + v;
    p.heart = Math.min(100, p.heart + v * 0.55 * (run.spec === 'void' ? 2 : 1));
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.lvl++;
      p.xpNext = xpFor(p.lvl);
      if (p.lvl >= DATA.rules.specLevel && !run.spec) run.specPending = true;
      run.levelQueue++;
    }
  }

  function levelUp() {
    run.paused = true;
    const p = run.p;
    particles(p.x, p.y, '#9ad0ff', 24, 200, 0.6);
    if (run.specPending && !run.spec) { run.specPending = false; UI.onLevelUp(specChoices(), true); }
    else UI.onLevelUp(buildChoices(3), false);
  }

  function collect(k) {
    const p = run.p;
    if (k.kind === 'heal') { const v = Math.round(p.maxHp * 0.3); p.hp = Math.min(p.maxHp, p.hp + v); texts(p.x, p.y - 30, '+' + v, '#7dffa8', 16); }
    else if (k.kind === 'magnet') { for (const g of run.gems) g.mag = true; texts(p.x, p.y - 30, 'Притяжение!', '#9ad0ff', 16); }
    else if (k.kind === 'fragment') {
      const f = Save.unlockNextFragment(run.chId);
      if (f) { run.fragmentsFound.push(f); if (UI.onFragment) UI.onFragment(f); }
      else { run.bonusEther = (run.bonusEther || 0) + 25; texts(p.x, p.y - 30, '+25 Эфира', '#c9a8ff', 16); }
    }
  }

  // -------------------------------------------------------------------
  //  Конец забега
  // -------------------------------------------------------------------
  function endRun(victory) {
    if (run.over) return;
    run.over = true;
    run.paused = true;
    const s = Save.data;
    const ether = Math.floor(run.kills / 8) + Math.floor(run.time / 6) + (victory ? 80 + run.chId * 40 : 0) + (run.bonusEther || 0);
    s.ether += ether;
    s.runs++;
    s.kills += run.kills;
    if (!victory) s.deaths++;
    s.bestTime[run.chId] = Math.max(s.bestTime[run.chId] || 0, Math.floor(run.time));
    if (victory) {
      s.cleared[run.chId] = true;
      s.unlockedChapter = Math.max(s.unlockedChapter, Math.min(3, run.chId + 1));
    }
    // «Смерть — не поражение»: каждый забег приоткрывает историю
    let vision = null;
    if (!run.fragmentsFound.length) vision = Save.unlockNextFragment(run.chId);
    Save.write();
    const result = {
      victory, ch: run.chId, time: run.time, kills: run.kills, level: run.p.lvl, ether,
      fragments: run.fragmentsFound.slice(), vision, spec: run.spec, heartUses: run.heartUses,
    };
    setTimeout(() => UI.onRunEnd(result), victory ? 200 : 900);
  }

  function quit() { run = null; for (const k in keys) keys[k] = false; }

  return {
    start, quit, useHeart, applyChoice, update,
    setView(w, h) { W = w; H = h; view.W = w; view.H = h; },
    reroll() {
      if (!run || run.p.rerolls <= 0) return null;
      run.p.rerolls--;
      return buildChoices(3);
    },
    get rerolls() { return run ? run.p.rerolls : 0; },
    setPaused(v) { if (run && !run.over) run.paused = v; },
    get running() { return !!run && !run.over; },
    get run() { return run; },
    getWeapon: (id) => run && getWeapon(id),
    joy,
    debug: {
      skipTo(t) { if (run) run.time = t; },
      god() { if (run) run.p.invuln = 1e9; },
      xp(v) { if (run) gainXp(v); },
      step(n, move) {
        for (let i = 0; i < n && run && !run.paused; i++) {
          if (move) {
            const p = run.p; let fx = 0, fy = 0;
            for (const e of run.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 220 * 220) { fx += dx / d2 * 900 * (e.boss ? 4 : 1); fy += dy / d2 * 900 * (e.boss ? 4 : 1); } }
            for (const s of run.eShots) { const dx = p.x - s.x, dy = p.y - s.y, d2 = dx * dx + dy * dy; if (d2 < 120 * 120) { fx += dx / d2 * 1500; fy += dy / d2 * 1500; } }
            let g = null, gd = 1e12; for (const k of run.gems) { const d = dist2(k.x, k.y, p.x, p.y); if (d < gd) { gd = d; g = k; } }
            if (g) { const d = Math.sqrt(gd) || 1; fx += (g.x - p.x) / d * 4; fy += (g.y - p.y) / d * 4; }
            if (p.heart >= 100 && (run.boss || p.hp < p.maxHp * 0.4)) useHeart();
            keys.KeyD = fx > 0.3; keys.KeyA = fx < -0.3; keys.KeyS = fy > 0.3; keys.KeyW = fy < -0.3;
          }
          update(1 / 60);
        }
        for (const k in keys) keys[k] = false;
      },
    },
  };
}
