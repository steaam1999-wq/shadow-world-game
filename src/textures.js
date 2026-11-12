// =====================================================================
//  Процедурные текстуры: атлас эффектов и земля глав
// =====================================================================
import * as THREE from 'three';

const TAU = Math.PI * 2;

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// детерминированный ГПСЧ
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

// ---------------------------------------------------------------------
//  Атлас эффектов 4x4 (каждая клетка 128px)
// ---------------------------------------------------------------------
export const CELL = {
  GLOW: 0, STAR: 1, STREAK: 2, RING: 3, SMOKE: 4, FLAME: 5, RUNE: 6, SHADOW: 7,
  DOT: 8, SHOCK: 9, CRESCENT: 10, SIGIL: 11, SHARD: 12, BOLT: 13, PETAL: 14, CRACK: 15,
};

export function makeAtlas() {
  const C = 128, cv = canvas(C * 4), g = cv.getContext('2d');
  const at = (i, fn) => { g.save(); g.translate((i % 4) * C + C / 2, Math.floor(i / 4) * C + C / 2); fn(); g.restore(); };
  const radial = (r, stops) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };

  at(CELL.GLOW, () => { g.fillStyle = radial(62, [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.75)'], [0.45, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-64, -64, 128, 128); });
  at(CELL.STAR, () => {
    g.fillStyle = radial(30, [[0, '#fff'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-64, -64, 128, 128);
    g.fillStyle = '#fff';
    for (let k = 0; k < 2; k++) {
      g.save(); g.rotate(k * Math.PI / 4);
      const L = k ? 34 : 60, w = k ? 4 : 7;
      g.beginPath(); g.moveTo(0, -L); g.quadraticCurveTo(w * 0.3, -w * 0.3, L, 0); g.quadraticCurveTo(w * 0.3, w * 0.3, 0, L); g.quadraticCurveTo(-w * 0.3, w * 0.3, -L, 0); g.quadraticCurveTo(-w * 0.3, -w * 0.3, 0, -L); g.fill();
      g.restore();
    }
  });
  at(CELL.STREAK, () => {
    const gr = g.createLinearGradient(-64, 0, 64, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.92, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 63, 14, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(20, 0, 40, 4, 0, 0, TAU); g.fill();
  });
  at(CELL.RING, () => { g.strokeStyle = '#fff'; g.lineWidth = 5; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.arc(0, 0, 56, 0, TAU); g.stroke(); });
  at(CELL.SMOKE, () => {
    const r = rng(77);
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, d = r() * 26, s = 14 + r() * 24;
      g.fillStyle = radial(s, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]);
      g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d); g.fillRect(-s, -s, s * 2, s * 2); g.restore();
    }
  });
  at(CELL.FLAME, () => {
    const gr = g.createRadialGradient(0, 18, 2, 0, 6, 54);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(26, -20, 40, 20, 0, 52); g.bezierCurveTo(-40, 20, -26, -20, 0, -60); g.fill();
  });
  // магический круг с рунами
  const runeCircle = (seed, rings) => {
    const r = rng(seed);
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 4;
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 50, 0, TAU); g.stroke();
    g.font = 'bold 11px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const glyphs = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU;
      g.save(); g.rotate(a + Math.PI / 2); g.translate(0, -55); g.rotate(0); g.fillText(glyphs[(r() * glyphs.length) | 0], 0, 0); g.restore();
    }
    g.lineWidth = 2;
    for (let k = 0; k < rings; k++) {
      const n = 3 + k * 2, R = 40 - k * 6;
      g.beginPath();
      for (let i = 0; i <= n; i++) { const a = i * TAU / n * (k % 2 ? 2 : 1) - Math.PI / 2; const x = Math.cos(a) * R, y = Math.sin(a) * R; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.stroke();
  };
  at(CELL.RUNE, () => runeCircle(11, 2));
  at(CELL.SIGIL, () => runeCircle(29, 3));
  at(CELL.SHADOW, () => { g.fillStyle = radial(60, [[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-64, -64, 128, 128); });
  at(CELL.DOT, () => { g.fillStyle = radial(20, [[0, '#fff'], [0.6, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-24, -24, 48, 48); });
  at(CELL.SHOCK, () => {
    const gr = g.createRadialGradient(0, 0, 30, 0, 0, 62);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.9, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(-64, -64, 128, 128);
  });
  at(CELL.CRESCENT, () => {
    g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 8;
    g.beginPath(); g.arc(0, 0, 54, -2.4, 0.9); g.arc(16, -10, 44, 0.9, -2.4, true); g.fill();
  });
  at(CELL.SHARD, () => {
    const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, 'rgba(255,255,255,0.1)'); gr.addColorStop(1, '#fff');
    g.fillStyle = gr; g.beginPath(); g.moveTo(60, 0); g.lineTo(-10, 12); g.lineTo(-58, 0); g.lineTo(-10, -12); g.closePath(); g.fill();
  });
  at(CELL.BOLT, () => {
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 12; g.lineCap = 'round';
    const r = rng(5); g.beginPath(); g.moveTo(-62, 0);
    for (let x = -50; x <= 62; x += 12) g.lineTo(x, (r() - 0.5) * 30);
    g.stroke();
  });
  at(CELL.PETAL, () => { g.fillStyle = radial(30, [[0, '#fff'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.ellipse(0, 0, 40, 16, 0.5, 0, TAU); g.fill(); });
  at(CELL.CRACK, () => {
    g.strokeStyle = '#fff'; g.lineCap = 'round'; const r = rng(9);
    for (let i = 0; i < 7; i++) {
      let a = i / 7 * TAU + r() * 0.5, x = 0, y = 0; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0);
      for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(x, y); g.lineWidth = 4 - k * 0.6; }
      g.stroke();
    }
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  return tex;
}

// ---------------------------------------------------------------------
//  Земля глав (бесшовная 1024px) + карта рельефа + свечение
// ---------------------------------------------------------------------
function wrap(g, S, x, y, r, fn) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    if (x + dx < -r || x + dx > S + r || y + dy < -r || y + dy > S + r) continue;
    g.save(); g.translate(x + dx, y + dy); fn(); g.restore();
  }
}

function noiseFill(g, S, r, base, n, alpha, smin, smax) {
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const x = r() * S, y = r() * S, s = smin + r() * (smax - smin);
    const light = r() < 0.5;
    wrap(g, S, x, y, s, () => {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, s);
      gr.addColorStop(0, light ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.3})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-s, -s, s * 2, s * 2);
    });
  }
}

function stonePoly(g, r, w, h) {
  g.beginPath();
  const pts = 7;
  for (let i = 0; i < pts; i++) {
    const a = i / pts * TAU;
    const rx = w / 2 * (0.85 + r() * 0.15), ry = h / 2 * (0.85 + r() * 0.15);
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

function crackLines(g, S, r, n, color, width) {
  g.strokeStyle = color; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let x = r() * S, y = r() * S, a = r() * TAU;
    const pts = [[x, y]];
    for (let k = 0; k < 8; k++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * (8 + r() * 14); y += Math.sin(a) * (8 + r() * 14); pts.push([x, y]); }
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      g.lineWidth = width; g.beginPath();
      pts.forEach(([px, py], k) => (k ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy)));
      g.stroke();
    }
  }
}

export function makeGround(kind) {
  const S = 1024, cv = canvas(S), g = cv.getContext('2d');
  const bump = canvas(S), b = bump.getContext('2d');
  const emi = canvas(512), e = emi.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, 512, 512);
  const r = rng(kind.length * 977 + 13);
  let hasEmissive = false;

  if (kind === 'ruins' || kind === 'crypt') {
    // каменные плиты
    const dark = kind === 'crypt';
    noiseFill(g, S, r, dark ? '#16181f' : '#1c1a1d', 200, 0.06, 20, 80);
    b.fillStyle = '#000'; b.fillRect(0, 0, S, S);
    const cols = dark ? 8 : 6, cw = S / cols;
    for (let row = 0; row < cols; row++) {
      const off = (row % 2) * cw * 0.5;
      for (let c = 0; c < cols; c++) {
        const x = c * cw + off + cw / 2, y = row * cw + cw / 2;
        const w = cw * (dark ? 0.94 : 0.9), h = cw * (dark ? 0.94 : 0.88);
        const tone = dark ? 30 + r() * 18 : 40 + r() * 26;
        const tint = dark ? [tone * 0.85, tone * 0.9, tone * 1.1] : [tone * 1.05, tone, tone * 0.92];
        wrap(g, S, x, y, cw, () => {
          if (dark) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); } else stonePoly(g, r, w, h);
          const gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
          gr.addColorStop(0, `rgb(${tint.map((v) => v * 1.15 | 0)})`); gr.addColorStop(1, `rgb(${tint.map((v) => v * 0.8 | 0)})`);
          g.fillStyle = gr; g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3; g.stroke();
        });
        wrap(b, S, x, y, cw, () => {
          if (dark) { b.beginPath(); b.rect(-w / 2, -h / 2, w, h); } else stonePoly(b, r, w, h);
          b.fillStyle = `rgb(${150 + r() * 60 | 0},${150},${150})`; b.fill();
        });
      }
    }
    b.filter = 'blur(3px)'; b.drawImage(bump, 0, 0); b.filter = 'none';
    // пятна, мох, кровь
    for (let i = 0; i < 40; i++) {
      const x = r() * S, y = r() * S, s = 10 + r() * 40, k = r();
      wrap(g, S, x, y, s, () => {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, s);
        const col = k < 0.45 ? (dark ? '40,60,70' : '50,70,40') : k < 0.75 ? '0,0,0' : '90,10,14';
        gr.addColorStop(0, `rgba(${col},${k < 0.75 ? 0.35 : 0.5})`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(-s, -s, s * 2, s * 2);
      });
    }
    crackLines(g, S, r, 30, 'rgba(0,0,0,0.6)', 2);
    crackLines(b, S, r, 30, 'rgba(0,0,0,0.9)', 3);
    if (dark) { // кости
      g.strokeStyle = 'rgba(200,190,170,0.35)'; g.lineWidth = 4; g.lineCap = 'round';
      for (let i = 0; i < 30; i++) { const x = r() * S, y = r() * S, a = r() * TAU, l = 10 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    }
  } else if (kind === 'forest') {
    noiseFill(g, S, r, '#1d3a36', 500, 0.07, 10, 70);
    b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);
    // травинки
    for (let i = 0; i < 9000; i++) {
      const x = r() * S, y = r() * S, l = 4 + r() * 9, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
      const t = r();
      g.strokeStyle = t < 0.5 ? `rgba(70,${120 + r() * 50 | 0},${110 + r() * 30 | 0},0.6)` : `rgba(20,${50 + r() * 30 | 0},48,0.6)`;
      g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    // камни и тропы
    for (let i = 0; i < 26; i++) {
      const x = r() * S, y = r() * S, w = 20 + r() * 50, h = w * (0.6 + r() * 0.3);
      const tone = 90 + r() * 50 | 0;
      wrap(g, S, x, y, w, () => { stonePoly(g, r, w, h); g.fillStyle = `rgb(${tone - 10},${tone},${tone + 5})`; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.stroke(); });
      wrap(b, S, x, y, w, () => { stonePoly(b, r, w, h); b.fillStyle = '#e0e0e0'; b.fill(); });
    }
    // светящиеся лепестки
    hasEmissive = true;
    for (let i = 0; i < 60; i++) {
      const x = r() * 512, y = r() * 512;
      e.fillStyle = `rgba(${150 + r() * 80 | 0},${200 + r() * 55 | 0},255,0.9)`; e.beginPath(); e.arc(x, y, 1 + r() * 1.5, 0, TAU); e.fill();
      g.fillStyle = 'rgba(220,240,255,0.8)'; g.beginPath(); g.arc(x * 2, y * 2, 2.5, 0, TAU); g.fill();
    }
  } else { // abyss
    noiseFill(g, S, r, '#140c1c', 400, 0.08, 20, 90);
    b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) {
      const x = r() * S, y = r() * S, w = 40 + r() * 120, h = w * (0.5 + r() * 0.4);
      const tone = 26 + r() * 20 | 0;
      wrap(g, S, x, y, w, () => { stonePoly(g, r, w, h); g.fillStyle = `rgb(${tone + 8},${tone},${tone + 16})`; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; g.stroke(); });
      wrap(b, S, x, y, w, () => { stonePoly(b, r, w, h); b.fillStyle = '#d0d0d0'; b.fill(); });
    }
    hasEmissive = true;
    const er = rng(31);
    crackLines(g, S, er, 10, 'rgba(150,70,220,0.7)', 2);
    const er2 = rng(31);
    e.save(); e.scale(0.5, 0.5); crackLines(e, S, er2, 10, 'rgba(170,90,240,0.8)', 3); e.restore();
    e.filter = 'blur(2px)'; e.drawImage(emi, 0, 0); e.filter = 'none';
  }

  const mk = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: mk(cv, true), bump: mk(bump, false), emissive: hasEmissive ? mk(emi, true) : null };
}
