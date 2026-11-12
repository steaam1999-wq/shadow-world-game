// =====================================================================
//  Фэнтезийный HUD поверх 3D-сцены (2D canvas)
// =====================================================================
/* global DATA, Save, Icons */
const TAU = Math.PI * 2;
const U = 1 / 20;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const FONT = 'Georgia, "Times New Roman", serif';

export class Hud {
  constructor(canvas, renderer) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.R = renderer;
    this.pt = { x: 0, y: 0, vis: true };
    this.portrait = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.c.width = this.W * this.dpr; this.c.height = this.H * this.dpr;
    this.c.style.width = this.W + 'px'; this.c.style.height = this.H + 'px';
    this.small = Math.min(this.W, this.H) < 520;
  }

  // кованая рамка
  frame(x, y, w, h, gold = '#b8954a') {
    const g = this.g;
    g.fillStyle = 'rgba(8,5,14,0.82)';
    g.fillRect(x, y, w, h);
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, '#f0d890'); gr.addColorStop(0.5, gold); gr.addColorStop(1, '#5a4320');
    g.strokeStyle = gr; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1; g.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    g.fillStyle = gr;
    for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
      g.beginPath(); g.moveTo(cx, cy - 4); g.lineTo(cx + 4, cy); g.lineTo(cx, cy + 4); g.lineTo(cx - 4, cy); g.fill();
    }
  }

  bar(x, y, w, h, k, c1, c2, label) {
    const g = this.g;
    this.frame(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = '#0a0610'; g.fillRect(x, y, w, h);
    const fw = w * clamp(k, 0, 1);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(x, y, fw, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y, fw, h * 0.35);
    if (fw > 4) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x + fw - 2, y, 2, h); }
    if (label) {
      g.font = `bold ${Math.max(10, h - 3)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(label, x + w / 2, y + h / 2 + 1);
      g.fillStyle = '#fff'; g.fillText(label, x + w / 2, y + h / 2 + 1);
    }
  }

  drawPortrait(x, y, r, run) {
    const g = this.g, corr = Save.data.corruption / 100;
    g.save();
    const bg = g.createRadialGradient(x, y - r * 0.2, 2, x, y, r);
    bg.addColorStop(0, corr > 0.5 ? '#5a2080' : '#3a2a70'); bg.addColorStop(1, '#0a0614');
    g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, y, r - 2, 0, TAU); g.clip();
    // силуэт мага в капюшоне
    g.fillStyle = '#2c1650';
    g.beginPath(); g.moveTo(x - r * 0.9, y + r); g.quadraticCurveTo(x - r * 0.7, y + r * 0.1, x - r * 0.45, y - r * 0.05);
    g.quadraticCurveTo(x - r * 0.5, y - r * 0.75, x, y - r * 0.82); g.quadraticCurveTo(x + r * 0.5, y - r * 0.75, x + r * 0.45, y - r * 0.05);
    g.quadraticCurveTo(x + r * 0.7, y + r * 0.1, x + r * 0.9, y + r); g.fill();
    g.strokeStyle = '#d8b25a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#05020a'; g.beginPath(); g.ellipse(x, y - r * 0.18, r * 0.28, r * 0.34, 0, 0, TAU); g.fill();
    const ec = corr > 0.5 ? '#ff8bff' : '#c9a8ff';
    g.shadowColor = ec; g.shadowBlur = 10; g.fillStyle = ec;
    g.beginPath(); g.ellipse(x - r * 0.11, y - r * 0.2, r * 0.06, r * 0.035, 0, 0, TAU); g.ellipse(x + r * 0.11, y - r * 0.2, r * 0.06, r * 0.035, 0, 0, TAU); g.fill();
    g.restore();
    // оправа
    const gr = g.createLinearGradient(x, y - r, x, y + r);
    gr.addColorStop(0, '#f6e0a0'); gr.addColorStop(0.5, '#b8954a'); gr.addColorStop(1, '#5a4320');
    g.strokeStyle = gr; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    // кольцо Сердца Эфира вокруг портрета
    const k = run.p.heart / 100, full = k >= 1;
    g.strokeStyle = '#1a0a28'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r + 6, 0, TAU); g.stroke();
    g.strokeStyle = full ? (Math.floor(this.R.time * 6) % 2 ? '#ff9bff' : '#c070ff') : '#8a3cd0';
    g.shadowColor = '#b46cff'; g.shadowBlur = full ? 16 : 6;
    g.beginPath(); g.arc(x, y, r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); g.shadowBlur = 0;
    // уровень
    const lx = x + r * 0.72, ly = y + r * 0.72;
    g.fillStyle = '#120a1e'; g.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; g.lineTo(lx + Math.cos(a) * 15, ly + Math.sin(a) * 15); }
    g.closePath(); g.fill(); g.strokeStyle = gr; g.lineWidth = 2; g.stroke();
    g.font = `bold 14px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe9b0';
    g.fillText(run.p.lvl, lx, ly + 1);
  }

  slot(x, y, s, id, lvl, color, gold) {
    const g = this.g;
    this.frame(x, y, s, s, gold ? '#ffd86b' : '#8a7040');
    g.drawImage(Icons.canvas(id, 64), x + 4, y + 4, s - 8, s - 8);
    if (lvl) {
      g.font = `bold 11px ${FONT}`; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
      g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(lvl, x + s - 4, y + s - 4);
      g.fillStyle = gold ? '#ffd86b' : '#fff'; g.fillText(lvl, x + s - 4, y + s - 4);
    }
  }

  // круглая мини-карта: враги, элиты, босс, награды, разломы, объекты
  minimap(run, x, y, w) {
    const g = this.g, r = w / 2 - 4, cx = x + w / 2, cy = y + r + 4, SC = r / 900, p = run.p;
    g.save();
    g.fillStyle = 'rgba(8,5,14,0.78)'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
    g.strokeStyle = 'rgba(180,140,255,0.12)'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, r * 0.5, 0, TAU); g.stroke();
    const dot = (wx, wy, c, s) => {
      const dx = (wx - p.x) * SC, dy = (wy - p.y) * SC;
      if (dx * dx + dy * dy > r * r) return;
      g.fillStyle = c; g.fillRect(cx + dx - s / 2, cy + dy - s / 2, s, s);
    };
    for (const o of run.props) dot(o.x, o.y, '#c8a878', 3);
    for (const e of run.enemies) if (!e.dead && !e.boss) dot(e.x, e.y, e.elite ? '#ffd86b' : e.champion ? '#ff9a40' : '#d04050', e.elite || e.champion ? 5 : 2);
    for (const k of run.pickups) dot(k.x, k.y, k.kind === 'fragment' ? '#ffe08a' : k.kind === 'heal' ? '#ff6a8a' : '#9ad0ff', 4);
    for (const rf of run.rifts) dot(rf.x, rf.y, '#c070ff', 7);
    g.restore();
    if (run.boss) {
      const b = run.boss, dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), k = Math.min(1, (r - 5) / (d * SC || 1));
      g.fillStyle = '#ff3050'; g.beginPath(); g.arc(cx + dx * SC * k, cy + dy * SC * k, 5, 0, TAU); g.fill();
    }
    g.fillStyle = '#e0c8ff'; g.beginPath(); g.moveTo(cx, cy - 5); g.lineTo(cx + 4, cy + 4); g.lineTo(cx - 4, cy + 4); g.fill();
    const gr = g.createLinearGradient(cx, cy - r, cx, cy + r); gr.addColorStop(0, '#f0d890'); gr.addColorStop(1, '#5a4320');
    g.strokeStyle = gr; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  }

  draw(run, joy) {
    const g = this.g, W = this.W, H = this.H, T = this.R.time;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!run) return;
    const p = run.p, R = this.R, pt = this.pt;

    // цифры урона
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of run.texts) {
      R.project(t.x * U, 1.8 + (0.8 - t.life) * 1.2, t.y * U, pt);
      if (!pt.vis) continue;
      const age = 0.8 - t.life, pop = age < 0.1 ? 1 + (0.1 - age) * 5 : 1;
      const big = t.size >= 16, size = (t.size + (big ? 6 : 3)) * pop;
      g.globalAlpha = Math.min(1, t.life * 2.5);
      g.font = `bold ${size | 0}px ${FONT}`;
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.9)'; g.strokeText(t.txt, pt.x, pt.y);
      let col = t.color;
      if (col === '#ffffff' && big) col = '#ffe08a';
      g.fillStyle = col; g.fillText(t.txt, pt.x, pt.y);
    }
    g.globalAlpha = 1;

    // полосы элит
    for (const e of run.enemies) {
      if (!e.elite || e.dead) continue;
      R.project(e.x * U, 3.6, e.y * U, pt);
      if (!pt.vis) continue;
      const w = 64;
      g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(pt.x - w / 2 - 1, pt.y - 1, w + 2, 7);
      g.fillStyle = '#ffd86b'; g.fillRect(pt.x - w / 2, pt.y, w * clamp(e.hp / e.maxHp, 0, 1), 5);
      g.font = `italic 11px ${FONT}`; g.fillStyle = '#ffe9b0'; g.textAlign = 'center';
      g.fillText('Носитель памяти', pt.x, pt.y - 9);
    }
    // полоса здоровья над героем
    R.project(p.x * U, 2.55, p.y * U, pt);
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(pt.x - 23, pt.y - 1, 46, 6);
    g.fillStyle = p.hp / p.maxHp < 0.3 ? '#ff3b5c' : '#e8445a'; g.fillRect(pt.x - 22, pt.y, 44 * clamp(p.hp / p.maxHp, 0, 1), 4);

    // красная виньетка при низком здоровье
    if (p.hp / p.maxHp < 0.3) {
      const a = 0.25 + Math.sin(T * 6) * 0.1;
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
      vg.addColorStop(0, 'rgba(120,0,20,0)'); vg.addColorStop(1, `rgba(140,0,20,${a})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }

    const sm = this.small;
    // ---------- слева снизу: портрет + полосы
    const pr = sm ? 30 : 42, px = 18 + pr, py = H - 22 - pr;
    this.drawPortrait(px, py, pr, run);
    const bx = px + pr + 18, bw = Math.min(sm ? 150 : 260, W - bx - 20);
    this.bar(bx, py - (sm ? 18 : 24), bw, sm ? 13 : 17, p.hp / p.maxHp, '#ff5a6a', '#8a1024', Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp));
    this.bar(bx, py + (sm ? 3 : 5), bw * 0.85, sm ? 7 : 9, p.heart / 100, '#d080ff', '#5a1a9a');
    g.font = `italic ${sm ? 10 : 12}px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const full = p.heart >= 100;
    g.fillStyle = full ? '#ffd6ff' : '#a890c8';
    g.fillText(full ? (sm ? 'Сердце готово — ✦' : 'Сердце Эфира готово — ПРОБЕЛ') : 'Сердце Эфира', bx, py + (sm ? 24 : 30));

    // ---------- опыт: тонкая полоса сверху
    this.frame(0, 0, W, 10);
    const xg = g.createLinearGradient(0, 0, W, 0); xg.addColorStop(0, '#3a6aff'); xg.addColorStop(1, '#9ad0ff');
    g.fillStyle = xg; g.fillRect(4, 3, (W - 8) * clamp(p.xp / p.xpNext, 0, 1), 4);

    // ---------- снизу по центру: заклинания и артефакты
    const s = sm ? 34 : 46, gap = 6;
    const wn = DATA.rules.weaponSlots;
    const totalW = wn * (s + gap) - gap;
    // на телефоне: ячейки над портретом слева, справа внизу — кнопка Сердца
    let sx = sm ? 12 : (W - totalW) / 2, sy = sm ? H - 2 * pr - 44 - s : H - s - 14;
    for (let i = 0; i < wn; i++) {
      const w = run.weapons[i];
      if (w) this.slot(sx, sy, s, (w.evo ? 'evo_' : '') + w.id, w.evo ? '★' : String(w.lvl), DATA.weapons[w.id].color, w.evo);
      else this.frame(sx, sy, s, s, '#4a3a20');
      sx += s + gap;
    }
    const ps = sm ? 24 : 30, pids = Object.keys(run.passives);
    let qx = (sm ? 12 : (W - totalW) / 2), qy = sy - ps - 8;
    for (const id of pids) { this.slot(qx, qy, ps, id, String(run.passives[id]), '#d8c8ff', false); qx += ps + 4; }
    if (run.spec && !sm) {
      const sp = DATA.specs[run.spec];
      g.font = `bold ${sm ? 11 : 13}px ${FONT}`; g.textAlign = 'left'; g.fillStyle = sp.color;
      g.shadowColor = sp.color; g.shadowBlur = 8; g.fillText(sp.name, qx + 6, qy + ps * 0.7); g.shadowBlur = 0;
    }

    // ---------- справа сверху: время, убийства, порча
    const tw = sm ? 120 : 150, tx = W - tw - 12, ty = 18;
    this.frame(tx, ty, tw, sm ? 58 : 66);
    const t = Math.floor(run.time), mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
    g.font = `bold ${sm ? 22 : 26}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#fff3d0'; g.textBaseline = 'alphabetic';
    g.fillText(mm + ':' + ss, tx + tw / 2, ty + (sm ? 26 : 30));
    g.font = `${sm ? 10 : 12}px ${FONT}`;
    g.fillStyle = '#e0d0ff'; g.textAlign = 'left'; g.fillText('Убито ' + run.kills, tx + 10, ty + (sm ? 46 : 54));
    g.fillStyle = '#c890ff'; g.textAlign = 'right'; g.fillText('Порча ' + Math.round(Save.data.corruption) + '%', tx + tw - 10, ty + (sm ? 46 : 54));
    if (!run.bossSpawned) {
      g.font = `italic ${sm ? 10 : 12}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#a898c0';
      g.fillText('Страж через ' + Math.ceil(DATA.rules.bossTime - run.time) + ' с', tx + tw / 2, ty + (sm ? 74 : 84));
    }

    // ---------- мини-карта
    if (sm) this.minimap(run, W - 12 - 92, run.boss ? 136 : ty + 84, 92);
    else this.minimap(run, tx, ty + 96, tw);
    // ---------- направление натиска
    if (run.eventDirT > 0) {
      const a = run.eventDir, rr = Math.min(W, H) / 2 - 60, al = Math.min(1, run.eventDirT);
      g.save(); g.globalAlpha = al * (0.6 + Math.sin(T * 10) * 0.4); g.translate(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr * 0.8); g.rotate(a);
      g.fillStyle = '#ff9a40'; g.shadowColor = '#ff6000'; g.shadowBlur = 14;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-6 - i * 12, -12); g.lineTo(4 - i * 12, 0); g.lineTo(-6 - i * 12, 12); g.lineTo(-2 - i * 12, 0); g.fill(); }
      g.restore();
    }
    // ---------- сила эфира
    if (run.buffT > 0) {
      g.font = `bold ${sm ? 12 : 14}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ffb0ff'; g.shadowColor = '#d060ff'; g.shadowBlur = 10;
      g.fillText('Сила Эфира: +50% урона · ' + Math.ceil(run.buffT) + ' с', W / 2, sm ? 150 : 120); g.shadowBlur = 0;
    }

    // ---------- босс
    if (run.boss) {
      const b = run.boss, d = DATA.bosses[b.bossId];
      const w = Math.min(600, W - (sm ? 40 : 360)), x = (W - w) / 2, y = sm ? 96 : 40;
      g.font = `bold ${sm ? 15 : 20}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.shadowColor = '#ff2a4a'; g.shadowBlur = 12; g.fillStyle = '#ffe0e0'; g.fillText(d.name, W / 2, y - 6); g.shadowBlur = 0;
      this.bar(x, y, w, sm ? 10 : 14, b.hp / b.maxHp, '#ff3a5a', '#600818');
      g.font = `italic ${sm ? 10 : 12}px ${FONT}`; g.fillStyle = '#c8a8b8'; g.fillText(d.title, W / 2, y + (sm ? 26 : 32));
      R.project(b.x * U, 1, b.y * U, pt);
      if (pt.x < 0 || pt.x > W || pt.y < 0 || pt.y > H) {
        const a = Math.atan2(pt.y - H / 2, pt.x - W / 2), rr = Math.min(W, H) / 2 - 50;
        g.save(); g.translate(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); g.rotate(a);
        g.fillStyle = '#ff4a5a'; g.shadowColor = '#ff0030'; g.shadowBlur = 12;
        g.beginPath(); g.moveTo(18, 0); g.lineTo(-10, -12); g.lineTo(-4, 0); g.lineTo(-10, 12); g.fill(); g.restore();
      }
    }

    // ---------- баннер
    if (run.banner) {
      const bn = run.banner, k = clamp(Math.min(1, bn.t, (bn.max - bn.t) * 3), 0, 1);
      g.globalAlpha = k;
      const y = H * 0.27;
      const lg = g.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0);
      lg.addColorStop(0, 'rgba(216,178,90,0)'); lg.addColorStop(0.5, 'rgba(216,178,90,0.9)'); lg.addColorStop(1, 'rgba(216,178,90,0)');
      g.fillStyle = lg; g.fillRect(W / 2 - 260, y + 16, 520, 1.5); g.fillRect(W / 2 - 260, y - 44, 520, 1.5);
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = `bold ${sm ? 26 : 38}px ${FONT}`;
      g.shadowColor = '#9b5cff'; g.shadowBlur = 20; g.fillStyle = '#f4e8ff'; g.fillText(bn.title, W / 2, y);
      g.shadowBlur = 0;
      g.font = `italic ${sm ? 13 : 17}px ${FONT}`; g.fillStyle = '#d8c8f0'; g.fillText(bn.sub, W / 2, y + 40);
      g.globalAlpha = 1;
    }

    // джойстик
    if (joy && joy.active) {
      g.globalAlpha = 0.35; g.strokeStyle = '#d8b25a'; g.lineWidth = 2;
      g.beginPath(); g.arc(joy.ox, joy.oy, 50, 0, TAU); g.stroke();
      g.fillStyle = '#b46cff'; g.beginPath(); g.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 20, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
  }
}
