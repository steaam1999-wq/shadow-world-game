'use strict';
// =====================================================================
//  ARCANE SURVIVORS — боевой слой (survivor-like)
// =====================================================================

const Game = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  const TAU = Math.PI * 2;
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

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    vignette = null;
  }
  window.addEventListener('resize', resize);

  // -------------------------------------------------------------------
  //  Кэш спрайтов
  // -------------------------------------------------------------------
  const spriteCache = new Map();
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function glow(color, size) {
    const key = 'g' + color + size;
    let c = spriteCache.get(key);
    if (c) return c;
    c = makeCanvas(size * 2, size * 2);
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size, size, 0, size, size, size);
    gr.addColorStop(0, color);
    gr.addColorStop(0.25, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.9;
    g.fillStyle = gr;
    g.fillRect(0, 0, size * 2, size * 2);
    spriteCache.set(key, c);
    return c;
  }

  function enemySprite(shape, r, color, elite) {
    const key = shape + r + color + (elite ? 'e' : '');
    let c = spriteCache.get(key);
    if (c) return c;
    const S = Math.ceil(r * 3.2);
    c = makeCanvas(S, S);
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    drawShape(g, shape, r, color);
    if (elite) {
      g.strokeStyle = '#ffd86b'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, r * 1.25, 0, TAU); g.stroke();
    }
    spriteCache.set(key, c);
    return c;
  }

  function eyes(g, x, y, s, col) {
    g.fillStyle = col;
    g.beginPath(); g.arc(-x, y, s, 0, TAU); g.arc(x, y, s, 0, TAU); g.fill();
  }

  function drawShape(g, shape, r, color) {
    g.lineJoin = 'round';
    switch (shape) {
      case 'ghost': {
        g.globalAlpha = 0.85; g.fillStyle = color;
        g.beginPath();
        g.arc(0, -r * 0.2, r, Math.PI, 0);
        g.lineTo(r, r * 0.9);
        for (let i = 0; i < 4; i++) g.quadraticCurveTo(r - (i + 0.5) * r / 2, r * (i % 2 ? 0.9 : 0.4), r - (i + 1) * r / 2, r * 0.9);
        g.closePath(); g.fill();
        g.globalAlpha = 1; eyes(g, r * 0.35, -r * 0.25, r * 0.17, '#1a1830');
        break;
      }
      case 'ghoul': {
        g.fillStyle = color;
        g.beginPath(); g.ellipse(0, r * 0.1, r * 0.9, r, 0, 0, TAU); g.fill();
        g.fillStyle = '#5f6a43';
        g.beginPath(); g.ellipse(-r * 0.9, r * 0.3, r * 0.3, r * 0.5, 0.4, 0, TAU); g.ellipse(r * 0.9, r * 0.3, r * 0.3, r * 0.5, -0.4, 0, TAU); g.fill();
        eyes(g, r * 0.35, -r * 0.3, r * 0.15, '#ff4a3a');
        g.strokeStyle = '#2b2a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(-r * 0.3, r * 0.25); g.lineTo(r * 0.3, r * 0.25); g.stroke();
        break;
      }
      case 'knight': {
        g.fillStyle = '#3a3346';
        g.fillRect(-r * 0.9, -r * 0.2, r * 1.8, r * 1.2);
        g.fillStyle = color;
        g.beginPath(); g.roundRect(-r * 0.75, -r, r * 1.5, r * 1.9, r * 0.35); g.fill();
        g.fillStyle = '#5c5e70'; g.fillRect(-r * 0.55, -r * 0.8, r * 1.1, r * 0.7);
        g.fillStyle = '#ff3b3b'; g.fillRect(-r * 0.45, -r * 0.5, r * 0.9, r * 0.14);
        g.fillStyle = '#4a4458'; g.beginPath(); g.ellipse(-r * 0.95, r * 0.25, r * 0.4, r * 0.6, 0, 0, TAU); g.fill();
        g.strokeStyle = '#a8a2bf'; g.lineWidth = 1.5; g.stroke();
        break;
      }
      case 'wolf': {
        g.fillStyle = color;
        g.beginPath(); g.ellipse(-r * 0.2, r * 0.15, r * 1.05, r * 0.65, 0, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(r * 0.4, -r * 0.5); g.lineTo(r * 1.25, r * 0.05); g.lineTo(r * 0.5, r * 0.4); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(r * 0.45, -r * 0.45); g.lineTo(r * 0.55, -r * 0.95); g.lineTo(r * 0.8, -r * 0.35); g.fill();
        g.fillStyle = '#5c3f30'; g.beginPath(); g.moveTo(-r * 1.1, 0); g.lineTo(-r * 1.6, -r * 0.4); g.lineTo(-r * 1.05, r * 0.35); g.fill();
        g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(r * 0.75, -r * 0.12, r * 0.12, 0, TAU); g.fill();
        g.strokeStyle = '#9d5bff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.3); g.lineTo(-r * 0.2, -r * 0.55); g.lineTo(0, -r * 0.3); g.stroke();
        break;
      }
      case 'wisp': {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.4, 0, TAU); g.fill();
        g.fillStyle = color;
        for (let i = 0; i < 3; i++) { const a = i * TAU / 3; g.beginPath(); g.arc(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2, r * 0.2, 0, TAU); g.fill(); }
        break;
      }
      case 'treant': {
        g.fillStyle = '#3e2c1d';
        g.fillRect(-r * 0.45, -r * 0.3, r * 0.9, r * 1.3);
        g.strokeStyle = '#3e2c1d'; g.lineWidth = r * 0.22; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-r * 0.3, 0); g.lineTo(-r * 1.0, -r * 0.5); g.moveTo(r * 0.3, 0); g.lineTo(r * 1.0, -r * 0.6); g.stroke();
        g.fillStyle = color;
        g.beginPath(); g.arc(0, -r * 0.6, r * 0.75, 0, TAU); g.arc(-r * 0.6, -r * 0.35, r * 0.5, 0, TAU); g.arc(r * 0.6, -r * 0.4, r * 0.5, 0, TAU); g.fill();
        eyes(g, r * 0.2, r * 0.15, r * 0.1, '#e9ff6a');
        break;
      }
      case 'skeleton': {
        g.strokeStyle = color; g.lineWidth = 2.5; g.lineCap = 'round';
        g.beginPath();
        for (let i = 0; i < 3; i++) { g.moveTo(-r * 0.55, r * (0.15 + i * 0.25)); g.lineTo(r * 0.55, r * (0.15 + i * 0.25)); }
        g.moveTo(0, 0); g.lineTo(0, r * 0.9);
        g.moveTo(-r * 0.6, r * 0.1); g.lineTo(-r * 0.95, r * 0.6); g.moveTo(r * 0.6, r * 0.1); g.lineTo(r * 1.05, -r * 0.3);
        g.stroke();
        g.strokeStyle = '#8e8e9e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(r * 1.05, -r * 0.3); g.lineTo(r * 1.1, -r * 1.2); g.stroke();
        g.fillStyle = color; g.beginPath(); g.arc(0, -r * 0.45, r * 0.5, 0, TAU); g.fill();
        eyes(g, r * 0.2, -r * 0.5, r * 0.12, '#3a8cff');
        break;
      }
      case 'mage': {
        g.fillStyle = '#26314d';
        g.beginPath(); g.moveTo(0, -r * 1.15); g.lineTo(r * 0.95, r); g.lineTo(-r * 0.95, r); g.closePath(); g.fill();
        g.strokeStyle = color; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#0b0f1a'; g.beginPath(); g.arc(0, -r * 0.35, r * 0.35, 0, TAU); g.fill();
        eyes(g, r * 0.14, -r * 0.38, r * 0.08, color);
        g.strokeStyle = '#6b5a45'; g.lineWidth = 2; g.beginPath(); g.moveTo(r * 0.9, r * 0.9); g.lineTo(r * 1.1, -r * 0.9); g.stroke();
        g.fillStyle = color; g.beginPath(); g.arc(r * 1.1, -r * 0.95, r * 0.2, 0, TAU); g.fill();
        break;
      }
      case 'golem': {
        g.fillStyle = color;
        g.beginPath(); g.roundRect(-r * 0.9, -r * 0.8, r * 1.8, r * 1.7, r * 0.4); g.fill();
        g.beginPath(); g.arc(-r * 1.0, 0, r * 0.4, 0, TAU); g.arc(r * 1.0, 0, r * 0.4, 0, TAU); g.fill();
        g.strokeStyle = '#7d745c'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-r * 0.5, -r * 0.4); g.lineTo(-r * 0.1, 0); g.lineTo(-r * 0.35, r * 0.5); g.moveTo(r * 0.4, -r * 0.6); g.lineTo(r * 0.2, -r * 0.1); g.stroke();
        g.fillStyle = '#26201a'; g.beginPath(); g.arc(-r * 0.3, -r * 0.35, r * 0.17, 0, TAU); g.arc(r * 0.3, -r * 0.35, r * 0.17, 0, TAU); g.fill();
        eyes(g, r * 0.3, -r * 0.35, r * 0.07, '#5ab0ff');
        break;
      }
      case 'spawn': {
        g.strokeStyle = color; g.lineWidth = 2.5; g.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const a = i * TAU / 6 + 0.3;
          g.beginPath(); g.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
          g.quadraticCurveTo(Math.cos(a + 0.5) * r * 1.2, Math.sin(a + 0.5) * r * 1.2, Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45); g.stroke();
        }
        g.fillStyle = '#4a1d7a'; g.beginPath(); g.arc(0, 0, r * 0.9, 0, TAU); g.fill();
        g.fillStyle = '#ffd6ff';
        [[-0.3, -0.2, 0.18], [0.3, -0.25, 0.14], [0, 0.25, 0.2]].forEach(([x, y, s]) => { g.beginPath(); g.arc(x * r, y * r, s * r, 0, TAU); g.fill(); });
        g.fillStyle = '#1b0630';
        [[-0.3, -0.2, 0.08], [0.3, -0.25, 0.06], [0, 0.25, 0.09]].forEach(([x, y, s]) => { g.beginPath(); g.arc(x * r, y * r, s * r, 0, TAU); g.fill(); });
        break;
      }
      case 'eye': {
        g.strokeStyle = '#6a2a8a'; g.lineWidth = 3; g.lineCap = 'round';
        for (let i = 0; i < 5; i++) { const a = Math.PI * 0.2 + i * Math.PI * 0.15; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); g.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.6); g.stroke(); }
        g.fillStyle = '#f3e1ef'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
        g.fillStyle = color; g.beginPath(); g.arc(0, 0, r * 0.55, 0, TAU); g.fill();
        g.fillStyle = '#12021c'; g.beginPath(); g.ellipse(0, 0, r * 0.14, r * 0.42, 0, 0, TAU); g.fill();
        g.strokeStyle = '#c0306b'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
        break;
      }
      case 'horror': {
        g.fillStyle = color;
        g.beginPath();
        for (let i = 0; i <= 14; i++) { const a = i * TAU / 14, rr = r * (i % 2 ? 1.25 : 0.95); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill();
        g.strokeStyle = '#b46cff'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#e8a6ff';
        g.beginPath(); g.ellipse(-r * 0.35, -r * 0.15, r * 0.12, r * 0.25, 0.3, 0, TAU); g.ellipse(r * 0.35, -r * 0.15, r * 0.12, r * 0.25, -0.3, 0, TAU); g.fill();
        g.fillStyle = '#0a0010'; g.beginPath(); g.ellipse(0, r * 0.4, r * 0.45, r * 0.18, 0, 0, TAU); g.fill();
        break;
      }
      case 'boss_knight': {
        g.fillStyle = '#7a1022';
        g.beginPath(); g.moveTo(-r * 0.7, -r * 0.4); g.lineTo(-r * 1.1, r * 1.1); g.lineTo(r * 1.1, r * 1.1); g.lineTo(r * 0.7, -r * 0.4); g.fill();
        g.fillStyle = color;
        g.beginPath(); g.roundRect(-r * 0.7, -r * 0.6, r * 1.4, r * 1.5, r * 0.2); g.fill();
        g.fillStyle = '#c6c9db'; g.beginPath(); g.roundRect(-r * 0.45, -r * 1.15, r * 0.9, r * 0.75, r * 0.3); g.fill();
        g.fillStyle = '#ff2b2b'; g.fillRect(-r * 0.35, -r * 0.85, r * 0.7, r * 0.1);
        g.fillStyle = '#d33'; g.beginPath(); g.moveTo(0, -r * 1.15); g.quadraticCurveTo(r * 0.5, -r * 1.6, r * 0.2, -r * 1.7); g.quadraticCurveTo(0, -r * 1.4, 0, -r * 1.15); g.fill();
        g.strokeStyle = '#e8ecff'; g.lineWidth = r * 0.12; g.lineCap = 'round';
        g.beginPath(); g.moveTo(r * 0.8, r * 0.6); g.lineTo(r * 1.3, -r * 1.2); g.stroke();
        g.strokeStyle = '#d9b44a'; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(r * 0.6, r * 0.15); g.lineTo(r * 1.15, r * 0.35); g.stroke();
        break;
      }
      case 'boss_devourer': {
        g.fillStyle = '#2f4a26';
        for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.35, r * 0.2, a, 0, TAU); g.fill(); }
        g.fillStyle = color; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
        g.fillStyle = '#16080c'; g.beginPath(); g.arc(0, r * 0.1, r * 0.6, 0, TAU); g.fill();
        g.fillStyle = '#f2f0d8';
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; const x = Math.cos(a) * r * 0.6, y = r * 0.1 + Math.sin(a) * r * 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x * 0.6 + Math.cos(a + 0.2) * 3, (y - r * 0.1) * 0.6 + r * 0.1); g.lineTo(Math.cos(a + 0.4) * r * 0.6, r * 0.1 + Math.sin(a + 0.4) * r * 0.6); g.fill(); }
        g.fillStyle = '#b46cff'; g.beginPath(); g.arc(0, r * 0.1, r * 0.18, 0, TAU); g.fill();
        eyes(g, r * 0.55, -r * 0.65, r * 0.1, '#e9ff6a');
        break;
      }
      case 'boss_king': {
        g.fillStyle = '#3b1f4a';
        g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(r * 1.1, r * 1.1); g.lineTo(-r * 1.1, r * 1.1); g.closePath(); g.fill();
        g.strokeStyle = color; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#d8d2bf'; g.beginPath(); g.arc(0, -r * 0.6, r * 0.45, 0, TAU); g.fill();
        g.fillStyle = '#1a0f22'; g.beginPath(); g.arc(-r * 0.17, -r * 0.65, r * 0.12, 0, TAU); g.arc(r * 0.17, -r * 0.65, r * 0.12, 0, TAU); g.fill();
        g.fillStyle = color;
        g.beginPath(); g.moveTo(-r * 0.5, -r * 0.95); g.lineTo(-r * 0.5, -r * 1.4); g.lineTo(-r * 0.25, -r * 1.15); g.lineTo(0, -r * 1.5); g.lineTo(r * 0.25, -r * 1.15); g.lineTo(r * 0.5, -r * 1.4); g.lineTo(r * 0.5, -r * 0.95); g.closePath(); g.fill();
        g.fillStyle = '#1a0f22'; g.beginPath(); g.arc(0, -r * 1.12, r * 0.1, 0, TAU); g.fill();
        g.strokeStyle = color; g.lineWidth = r * 0.08; g.beginPath(); g.moveTo(-r * 1.0, r * 0.9); g.lineTo(-r * 0.9, -r * 0.6); g.stroke();
        g.fillStyle = '#7fd6ff'; g.beginPath(); g.arc(-r * 0.9, -r * 0.7, r * 0.15, 0, TAU); g.fill();
        break;
      }
      case 'boss_lord': {
        g.strokeStyle = '#d68bff'; g.lineWidth = 2;
        for (let i = 0; i < 10; i++) { const a = i * TAU / 10; g.beginPath(); g.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15 - r * 0.2); g.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45 - r * 0.2); g.stroke(); }
        g.fillStyle = '#0b0410';
        g.beginPath(); g.moveTo(0, -r * 1.2); g.quadraticCurveTo(r * 1.1, -r * 0.2, r * 0.9, r * 1.2); g.lineTo(-r * 0.9, r * 1.2); g.quadraticCurveTo(-r * 1.1, -r * 0.2, 0, -r * 1.2); g.fill();
        g.strokeStyle = color; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-r * 0.25, -r * 0.45, r * 0.1, r * 0.05, 0.3, 0, TAU); g.ellipse(r * 0.25, -r * 0.45, r * 0.1, r * 0.05, -0.3, 0, TAU); g.fill();
        g.strokeStyle = '#6b3a8f'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(-r * 0.2, -r * 0.1); g.lineTo(-r * 0.4, r * 0.8); g.moveTo(r * 0.2, -r * 0.1); g.lineTo(r * 0.45, r * 0.85); g.moveTo(0, 0); g.lineTo(0, r * 1.0); g.stroke();
        break;
      }
      default:
        g.fillStyle = color; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    }
  }

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
  let vignette = null;

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
    resize();
    const ch = DATA.chapters[chapterId];
    run = {
      ch, chId: chapterId,
      time: 0, kills: 0, paused: false, over: false,
      p: newPlayer(),
      weapons: [], passives: {}, spec: null,
      enemies: [], shots: [], eShots: [], gems: [], pickups: [],
      rings: [], lines: [], blasts: [], parts: [], texts: [], hazards: [], holes: [],
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
    run.shots.push(Object.assign({ pierce: 1, life: 2, r: 6, hit: new Set(), homing: 0, kind: 'bolt', slow: 0 }, o));
  }

  function chainLightning(start, dmg, jumps, range) {
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
      p.walk += dt * 10;
    }
    p.invuln -= dt;
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

  function quit() { run = null; }

  // -------------------------------------------------------------------
  //  Отрисовка
  // -------------------------------------------------------------------
  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  function drawGround(camX, camY) {
    const pal = run.ch.palette, T = 128;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    const x0 = Math.floor(camX / T) - 1, x1 = Math.floor((camX + W) / T) + 1;
    const y0 = Math.floor(camY / T) - 1, y1 = Math.floor((camY + H) / T) + 1;
    for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
      const h = hash(tx, ty), sx = tx * T - camX, sy = ty * T - camY;
      if (h < 0.5) { ctx.fillStyle = pal.tile; ctx.fillRect(sx, sy, T, T); }
      const h2 = hash(tx + 999, ty - 77);
      if (h2 < 0.35) decor(run.ch.decor, sx + hash(tx, ty + 5) * T, sy + hash(tx + 3, ty) * T, h2, pal);
    }
  }

  function decor(kind, x, y, h, pal) {
    ctx.fillStyle = pal.deco; ctx.strokeStyle = pal.deco; ctx.lineWidth = 2;
    const v = (h * 1000) % 4 | 0;
    switch (kind) {
      case 'ruins':
        if (v === 0) { ctx.fillRect(x - 10, y - 26, 20, 40); ctx.fillRect(x - 14, y + 12, 28, 6); }
        else if (v === 1) { for (let i = 0; i < 5; i++) ctx.fillRect(x + hash(i, x | 0) * 30 - 15, y + hash(y | 0, i) * 20 - 10, 6, 4); }
        else if (v === 2) { ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x - 5, y + 6); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x + 22, y + 3); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); }
        break;
      case 'forest':
        if (v <= 1) { ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.arc(x + 16, y + 8, 15, 0, TAU); ctx.arc(x - 14, y + 10, 14, 0, TAU); ctx.fill(); }
        else if (v === 2) { ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(x + i * 5, y); ctx.lineTo(x + i * 5 - 3, y - 10); } ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(x - 25, y); ctx.quadraticCurveTo(x, y - 12, x + 25, y + 4); ctx.stroke(); }
        break;
      case 'crypt':
        if (v === 0) { ctx.beginPath(); ctx.roundRect(x - 10, y - 18, 20, 26, [9, 9, 0, 0]); ctx.fill(); }
        else if (v === 1) { ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y + 3); ctx.moveTo(x - 8, y - 4); ctx.lineTo(x - 12, y + 4); ctx.stroke(); }
        else if (v === 2) { ctx.strokeRect(x - 30, y - 30, 60, 60); }
        else { ctx.fillRect(x - 3, y - 14, 6, 26); ctx.fillRect(x - 10, y - 8, 20, 6); }
        break;
      case 'abyss':
        if (v <= 1) { ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x - 4, y - 12); ctx.lineTo(x + 16, y - 6); ctx.lineTo(x + 8, y + 10); ctx.closePath(); ctx.fill(); }
        else if (v === 2) { ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(x - 25, y - 5); ctx.lineTo(x - 5, y + 4); ctx.lineTo(x + 6, y - 8); ctx.lineTo(x + 24, y); ctx.stroke(); ctx.globalAlpha = 1; }
        else { ctx.fillStyle = '#d9b8ff'; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(run.time * 2 + x); ctx.fillRect(x, y, 2, 2); ctx.globalAlpha = 1; }
        break;
    }
  }

  function drawPlayer(p, sx, sy) {
    const corr = Save.data.corruption / 100;
    const bob = Math.sin(p.walk) * 1.5;
    // аура
    const auraCol = corr > 0.5 ? '#b46cff' : corr > 0.2 ? '#8f8bff' : '#7ab8ff';
    ctx.globalCompositeOperation = 'lighter';
    const gs = glow(auraCol, 40);
    ctx.globalAlpha = 0.35 + 0.1 * Math.sin(run.time * 3);
    ctx.drawImage(gs, sx - 40, sy - 40);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (p.invuln > 0 && Math.floor(run.time * 20) % 2) ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.translate(sx, sy + bob);
    ctx.scale(p.face, 1);
    // тень
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 15, 12, 4, 0, 0, TAU); ctx.fill();
    // мантия
    ctx.fillStyle = '#23285a';
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, 14); ctx.lineTo(-12, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6f7dff'; ctx.lineWidth = 1.5; ctx.stroke();
    // звёзды ордена
    ctx.fillStyle = '#cfd7ff'; ctx.fillRect(-4, 4, 2, 2); ctx.fillRect(3, 9, 2, 2);
    // капюшон
    ctx.fillStyle = '#1a1d44'; ctx.beginPath(); ctx.arc(0, -12, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#05060f'; ctx.beginPath(); ctx.arc(2, -11, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = corr > 0.5 ? '#e08bff' : '#9fe0ff'; ctx.fillRect(2, -12, 2, 2); ctx.fillRect(5, -12, 1.5, 2);
    // посох
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(13, -20); ctx.stroke();
    // Сердце Эфира
    const hc = p.heart >= 100 ? '#ff9bff' : '#b46cff';
    ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(13, -22, 3.5 + (p.heart >= 100 ? Math.sin(run.time * 10) : 0), 0, TAU); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    if (p.heart >= 100) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glow('#d68bff', 22), sx + p.face * 13 - 22, sy - 22 - 22 + bob);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!run) { ctx.fillStyle = '#07060b'; ctx.fillRect(0, 0, W, H); return; }
    const p = run.p;
    const shx = run.shake ? rand(-run.shake, run.shake) : 0, shy = run.shake ? rand(-run.shake, run.shake) : 0;
    const camX = p.x - W / 2 + shx, camY = p.y - H / 2 + shy;
    drawGround(camX, camY);
    const onScreen = (x, y, m = 60) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;

    // опасные зоны
    for (const h of run.hazards) {
      if (h.done) continue;
      const k = h.t / h.delay;
      ctx.strokeStyle = h.color; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(180,108,255,' + (0.12 + k * 0.25) + ')';
      ctx.beginPath(); ctx.arc(h.x - camX, h.y - camY, h.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(h.x - camX, h.y - camY, h.r * k, 0, TAU); ctx.stroke();
    }

    // кристаллы
    ctx.globalCompositeOperation = 'lighter';
    for (const g of run.gems) {
      if (!onScreen(g.x, g.y)) continue;
      const big = g.val >= 10, col = big ? '#ff9bff' : g.val >= 3 ? '#7dffb8' : '#7ab8ff';
      const s = big ? 7 : g.val >= 3 ? 5 : 4;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(g.x - camX, g.y - camY - s); ctx.lineTo(g.x - camX + s * 0.7, g.y - camY); ctx.lineTo(g.x - camX, g.y - camY + s); ctx.lineTo(g.x - camX - s * 0.7, g.y - camY); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // предметы
    for (const k of run.pickups) {
      const x = k.x - camX, y = k.y - camY + Math.sin(k.t * 4) * 3;
      if (k.kind === 'fragment') {
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow('#ffd86b', 26), x - 26, y - 26); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 7, y); ctx.fill();
      } else if (k.kind === 'heal') {
        ctx.fillStyle = '#ff5a7a'; ctx.beginPath(); ctx.arc(x - 4, y - 2, 5, 0, TAU); ctx.arc(x + 4, y - 2, 5, 0, TAU); ctx.moveTo(x - 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x + 9, y); ctx.fill();
      } else {
        ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 7, Math.PI, 0); ctx.stroke();
      }
    }

    // враги
    for (const e of run.enemies) {
      if (!onScreen(e.x, e.y, e.r * 2)) continue;
      const spr = enemySprite(e.shape, e.boss ? e.r : DATA.enemies[e.type].r * (e.elite ? 1.6 : 1), e.color, e.elite);
      const bob = e.boss ? Math.sin(run.time * 2) * 3 : Math.sin(run.time * 6 + e.seed) * 1.5;
      const x = e.x - camX, y = e.y - camY + bob;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, e.y - camY + e.r * 0.9, e.r * 0.8, e.r * 0.25, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(x, y); if (e.face < 0) ctx.scale(-1, 1);
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
      if (e.flash > 0) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, e.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.frozen > 0) { ctx.globalAlpha = 0.45; ctx.fillStyle = '#bff8ff'; ctx.beginPath(); ctx.arc(x, y, e.r * 1.1, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      else if (e.slowT > 0) { ctx.strokeStyle = 'rgba(159,244,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, e.r + 2, 0, TAU); ctx.stroke(); }
      if (e.burnT > 0 && Math.random() < 0.3) particles(e.x + rand(-e.r, e.r) * 0.6, e.y - e.r * 0.3, '#ff8a3c', 1, 30, 0.4, 2.5);
      if (e.boss && e.ai.mode === 'windup') {
        ctx.strokeStyle = 'rgba(255,60,60,0.7)'; ctx.lineWidth = e.r * 0.8; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(e.ai.dir) * 380, y + Math.sin(e.ai.dir) * 380); ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (e.elite) {
        const w = e.r * 2;
        ctx.fillStyle = '#000a'; ctx.fillRect(x - w / 2, y - e.r - 12, w, 4);
        ctx.fillStyle = '#ffd86b'; ctx.fillRect(x - w / 2, y - e.r - 12, w * Math.max(0, e.hp / e.maxHp), 4);
      }
    }
    // поле притяжения пожирателя
    if (run.boss && (run.boss.bossId === 'devourer' || (run.boss.bossId === 'abyss_lord' && run.boss.ai.phase >= 2))) {
      const b = run.boss, R = b.bossId === 'devourer' ? 560 : 520;
      ctx.strokeStyle = 'rgba(160,255,120,0.10)'; if (b.bossId === 'abyss_lord') ctx.strokeStyle = 'rgba(200,120,255,0.12)';
      ctx.lineWidth = 2; ctx.setLineDash([8, 12]); ctx.lineDashOffset = -run.time * 40;
      ctx.beginPath(); ctx.arc(b.x - camX, b.y - camY, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }

    // огненная аура (эволюция)
    const fire = getWeapon('fire');
    if (fire && fire.evo) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.08 * Math.sin(run.time * 8);
      const R = 95 * p.areaMul; ctx.drawImage(glow('#ff6a20', R), p.x - camX - R, p.y - camY - R);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    drawPlayer(p, p.x - camX, p.y - camY);

    // серпы
    const blood = getWeapon('blood');
    if (blood && blood.blades) {
      const s = (blood.evo ? 18 : 12) * p.areaMul;
      for (const b of blood.blades) {
        const x = b.x - camX, y = b.y - camY;
        ctx.save(); ctx.translate(x, y); ctx.rotate(b.a + Math.PI / 2);
        ctx.fillStyle = blood.evo ? '#ff1a40' : '#ff3b5c';
        ctx.beginPath(); ctx.arc(0, 0, s, Math.PI * 0.1, Math.PI * 1.1); ctx.arc(s * 0.35, -s * 0.15, s * 0.8, Math.PI * 1.1, Math.PI * 0.1, true); ctx.fill();
        ctx.restore();
      }
    }

    // снаряды
    ctx.globalCompositeOperation = 'lighter';
    for (const h of run.holes) {
      const x = h.x - camX, y = h.y - camY, k = Math.min(1, h.t * 3);
      ctx.drawImage(glow('#8a3cff', h.r * 0.6), x - h.r * 0.6, y - h.r * 0.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 22 * k, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e0b8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 24 * k + Math.sin(h.t * 10) * 2, 0, TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
    }
    for (const s of run.shots) {
      const x = s.x - camX, y = s.y - camY;
      if (!onScreen(s.x, s.y)) continue;
      const gsz = s.kind === 'orb' ? s.r * 2.4 : s.r * 2.2;
      ctx.drawImage(glow(s.color, Math.ceil(gsz)), x - gsz, y - gsz);
      ctx.fillStyle = '#ffffff';
      if (s.kind === 'shard') {
        const a = Math.atan2(s.vy, s.vx);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#e8feff';
        ctx.beginPath(); ctx.moveTo(s.r * 1.8, 0); ctx.lineTo(-s.r, s.r * 0.6); ctx.lineTo(-s.r, -s.r * 0.6); ctx.fill(); ctx.restore();
      } else { ctx.beginPath(); ctx.arc(x, y, s.r * 0.45, 0, TAU); ctx.fill(); }
    }
    for (const s of run.eShots) {
      const x = s.x - camX, y = s.y - camY;
      if (!onScreen(s.x, s.y)) continue;
      ctx.drawImage(glow(s.color, s.r * 2), x - s.r * 2, y - s.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const s of run.eShots) {
      if (!onScreen(s.x, s.y)) continue;
      ctx.fillStyle = '#1a0010'; ctx.beginPath(); ctx.arc(s.x - camX, s.y - camY, s.r * 0.55, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';

    // кольца
    for (const r of run.rings) {
      const k = 1 - r.r / r.max;
      ctx.strokeStyle = r.color; ctx.globalAlpha = Math.max(0, k) * 0.9; ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, r.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // молнии
    for (const l of run.lines) {
      ctx.strokeStyle = l.color; ctx.lineWidth = l.wide ? 5 : 2.5; ctx.globalAlpha = Math.min(1, l.life * 8);
      ctx.beginPath(); ctx.moveTo(l.x1 - camX, l.y1 - camY);
      const segs = 6;
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        ctx.lineTo(l.x1 + (l.x2 - l.x1) * t - camX + rand(-10, 10), l.y1 + (l.y2 - l.y1) * t - camY + rand(-10, 10));
      }
      ctx.lineTo(l.x2 - camX, l.y2 - camY); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const b of run.blasts) {
      const k = b.life / b.max;
      ctx.globalAlpha = k * 0.8;
      ctx.drawImage(glow(b.color, Math.ceil(b.r)), b.x - camX - b.r, b.y - camY - b.r);
    }
    ctx.globalAlpha = 1;
    for (const pt of run.parts) {
      ctx.globalAlpha = pt.life / pt.max;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - camX - pt.size / 2, pt.y - camY - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // числа урона
    ctx.textAlign = 'center';
    for (const t of run.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2.5);
      ctx.font = 'bold ' + t.size + 'px Georgia, serif';
      ctx.fillStyle = '#000'; ctx.fillText(t.txt, t.x - camX + 1, t.y - camY + 1);
      ctx.fillStyle = t.color; ctx.fillText(t.txt, t.x - camX, t.y - camY);
    }
    ctx.globalAlpha = 1;

    // виньетка + порча
    if (!vignette) {
      vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
    }
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    const corr = Save.data.corruption / 100;
    if (corr > 0.05) { ctx.fillStyle = 'rgba(120,30,180,' + corr * 0.12 + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = run.ch.palette.fog; ctx.fillRect(0, 0, W, H);
    if (run.flash > 0) { ctx.globalAlpha = Math.min(0.5, run.flash * 0.6); ctx.fillStyle = run.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }

    drawHUD();
    if (joy.active) {
      ctx.globalAlpha = 0.3; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 18, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function bar(x, y, w, h, k, col, bg = 'rgba(0,0,0,0.6)') {
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(k, 0, 1), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  function drawHUD() {
    const p = run.p;
    // опыт
    bar(0, 0, W, 8, p.xp / p.xpNext, '#5aa8ff');
    ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#cfe0ff';
    ctx.fillText('Ур. ' + p.lvl, 10, 26);
    // здоровье над героем
    const sx = W / 2, sy = H / 2;
    bar(sx - 20, sy + 22, 40, 5, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? '#ff3b5c' : '#ff6a7a');
    // время
    const t = Math.floor(run.time), mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
    ctx.textAlign = 'center'; ctx.font = 'bold 22px Georgia, serif'; ctx.fillStyle = '#fff';
    ctx.fillText(mm + ':' + ss, W / 2, 34);
    ctx.font = '12px Georgia, serif'; ctx.fillStyle = '#aaa';
    const left = DATA.rules.bossTime - run.time;
    ctx.fillText(run.bossSpawned ? (run.boss ? 'Страж здесь' : '') : 'Страж через ' + Math.ceil(left) + ' с', W / 2, 50);
    // убийства
    ctx.textAlign = 'right'; ctx.font = 'bold 14px Georgia, serif'; ctx.fillStyle = '#e8d8ff';
    ctx.fillText('☠ ' + run.kills, W - 12, 28);
    ctx.font = '12px Georgia, serif'; ctx.fillStyle = '#c08bff';
    ctx.fillText('Порча ' + Math.round(Save.data.corruption) + '%', W - 12, 46);
    // оружие и артефакты
    ctx.textAlign = 'center';
    let x = 14;
    for (const w of run.weapons) {
      const d = DATA.weapons[w.id];
      ctx.fillStyle = w.evo ? 'rgba(255,216,107,0.25)' : 'rgba(0,0,0,0.5)'; ctx.fillRect(x, 36, 30, 30);
      ctx.strokeStyle = w.evo ? '#ffd86b' : d.color; ctx.strokeRect(x + 0.5, 36.5, 29, 29);
      ctx.fillStyle = d.color; ctx.font = '17px Georgia, serif'; ctx.fillText(d.icon, x + 15, 57);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(w.evo ? '★' : w.lvl, x + 25, 64);
      x += 34;
    }
    x = 14;
    for (const id in run.passives) {
      const d = DATA.passives[id];
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, 70, 22, 22);
      ctx.font = '13px sans-serif'; ctx.fillStyle = '#e0d8ff'; ctx.fillText(d.icon, x + 11, 86);
      ctx.font = 'bold 8px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(run.passives[id], x + 19, 91);
      x += 25;
    }
    if (run.spec) {
      const s = DATA.specs[run.spec];
      ctx.textAlign = 'left'; ctx.font = 'bold 12px Georgia, serif'; ctx.fillStyle = s.color;
      ctx.fillText(s.icon + ' ' + s.name, 14, 108);
    }
    // здоровье и Сердце Эфира снизу
    const bw = Math.min(360, W - 40), bx = (W - bw) / 2;
    bar(bx, H - 46, bw, 12, p.hp / p.maxHp, '#e0344f');
    ctx.textAlign = 'center'; ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp), W / 2, H - 37);
    const full = p.heart >= 100;
    bar(bx, H - 28, bw, 10, p.heart / 100, full ? (Math.floor(run.time * 4) % 2 ? '#e08bff' : '#b46cff') : '#7a3cc0');
    ctx.font = '11px Georgia, serif'; ctx.fillStyle = full ? '#ffd6ff' : '#b8a0d8';
    ctx.fillText(full ? '✦ Сердце Эфира готово — ПРОБЕЛ ✦' : 'Сердце Эфира', W / 2, H - 6);

    // босс
    if (run.boss) {
      const b = run.boss, d = DATA.bosses[b.bossId];
      const w = Math.min(560, W - 80);
      bar((W - w) / 2, 64, w, 12, b.hp / b.maxHp, '#c0304a');
      ctx.textAlign = 'center'; ctx.font = 'bold 15px Georgia, serif'; ctx.fillStyle = '#ffdede';
      ctx.fillText(d.name, W / 2, 96);
      // указатель на босса за экраном
      const dx = b.x - p.x, dy = b.y - p.y;
      if (Math.abs(dx) > W / 2 || Math.abs(dy) > H / 2) {
        const a = Math.atan2(dy, dx), R = Math.min(W, H) / 2 - 40;
        ctx.save(); ctx.translate(W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R); ctx.rotate(a);
        ctx.fillStyle = '#ff4a5a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.fill(); ctx.restore();
      }
    }
    // баннер
    if (run.banner) {
      const bn = run.banner, k = Math.min(1, bn.t, (bn.max - bn.t) * 3);
      ctx.globalAlpha = clamp(k, 0, 1);
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px Georgia, serif'; ctx.fillStyle = '#000'; ctx.fillText(bn.title, W / 2 + 2, H * 0.28 + 2);
      ctx.fillStyle = '#f0e0ff'; ctx.fillText(bn.title, W / 2, H * 0.28);
      ctx.font = 'italic 16px Georgia, serif'; ctx.fillStyle = '#c8b8e8'; ctx.fillText(bn.sub, W / 2, H * 0.28 + 28);
      ctx.globalAlpha = 1;
    }
  }

  // -------------------------------------------------------------------
  //  Главный цикл
  // -------------------------------------------------------------------
  let lastT = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    if (run && !run.paused) update(dt);
    render();
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);

  return {
    start, quit, useHeart,
    applyChoice,
    reroll() {
      if (!run || run.p.rerolls <= 0) return null;
      run.p.rerolls--;
      return buildChoices(3);
    },
    get rerolls() { return run ? run.p.rerolls : 0; },
    setPaused(v) { if (run && !run.over) run.paused = v; },
    get running() { return !!run && !run.over; },
    get run() { return run; },
    // для отладки и тестов
    debug: {
      skipTo(t) { if (run) run.time = t; },
      god() { if (run) run.p.invuln = 1e9; },
      xp(v) { if (run) gainXp(v); },
      // ускоренная симуляция: n шагов по 1/60 с, пока забег не на паузе
      step(n, move) {
        for (let i = 0; i < n && run && !run.paused; i++) {
          if (move) {
            // простой бот: уходит от врагов, тянется к эфиру
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
})();
