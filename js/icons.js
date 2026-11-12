'use strict';
// =====================================================================
//  Процедурные иконки (без эмодзи): заклинания, артефакты, школы, финал
// =====================================================================
const Icons = (() => {
  const TAU = Math.PI * 2;
  const cache = new Map();

  const COLORS = {
    bolt: '#9ad0ff', lightning: '#fff27a', fire: '#ff8a3c', frost: '#9ff4ff', blood: '#ff3b5c', void: '#b46cff',
    tome: '#d8b25a', boots: '#c8a080', crystal: '#7fd6ff', rune: '#a8c0ff', heart: '#ff6a8a', magnet: '#bcd8ff', eye: '#ff5fd2',
    heal: '#7dffa8', seal: '#9ad0ff', absorb: '#b46cff', free: '#ffd86b',
  };

  function base(g, S, color, gold) {
    const r = S / 2;
    const bg = g.createRadialGradient(r, r * 0.8, 2, r, r, r);
    bg.addColorStop(0, '#2a1d40'); bg.addColorStop(1, '#09060f');
    g.fillStyle = bg; g.beginPath(); g.arc(r, r, r - 2, 0, TAU); g.fill();
    g.strokeStyle = gold ? '#ffd86b' : color; g.lineWidth = gold ? 3 : 2; g.globalAlpha = 0.85;
    g.beginPath(); g.arc(r, r, r - 2.5, 0, TAU); g.stroke(); g.globalAlpha = 1;
    g.translate(r, r);
    g.shadowColor = color; g.shadowBlur = S * 0.18;
  }

  const draw = {
    bolt(g, s, c) {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(s * 0.36, -s * 0.3); g.lineTo(-s * 0.3, s * 0.06); g.lineTo(-s * 0.36, s * 0.0); g.closePath(); g.fill();
      g.fillStyle = c;
      g.beginPath(); g.moveTo(s * 0.38, -s * 0.32); g.lineTo(s * 0.14, s * 0.02); g.lineTo(s * 0.06, -s * 0.06); g.closePath(); g.fill();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(-s * 0.2, s * 0.12); g.lineTo(-s * 0.2 + Math.cos(a) * s * 0.16, s * 0.12 + Math.sin(a) * s * 0.16); g.lineWidth = s * 0.04; g.strokeStyle = c; g.stroke(); }
    },
    lightning(g, s, c) {
      g.fillStyle = c;
      g.beginPath(); g.moveTo(s * 0.08, -s * 0.4); g.lineTo(-s * 0.2, s * 0.05); g.lineTo(0, s * 0.05); g.lineTo(-s * 0.1, s * 0.4); g.lineTo(s * 0.22, -s * 0.08); g.lineTo(s * 0.02, -s * 0.08); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(s * 0.04, -s * 0.3); g.lineTo(-s * 0.1, s * 0.0); g.lineTo(0, 0); g.fill();
    },
    fire(g, s, c) {
      const gr = g.createLinearGradient(0, s * 0.4, 0, -s * 0.4); gr.addColorStop(0, '#ff3a10'); gr.addColorStop(0.6, c); gr.addColorStop(1, '#ffe08a');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, -s * 0.42); g.bezierCurveTo(s * 0.3, -s * 0.1, s * 0.34, s * 0.2, 0, s * 0.38); g.bezierCurveTo(-s * 0.34, s * 0.2, -s * 0.3, -s * 0.05, -s * 0.08, -s * 0.2); g.bezierCurveTo(-s * 0.06, -s * 0.05, s * 0.04, -s * 0.2, 0, -s * 0.42); g.fill();
      g.fillStyle = '#fff6c0'; g.beginPath(); g.ellipse(0, s * 0.18, s * 0.09, s * 0.15, 0, 0, TAU); g.fill();
    },
    frost(g, s, c) {
      g.strokeStyle = c; g.lineWidth = s * 0.06; g.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        g.save(); g.rotate(i * Math.PI / 3);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 0.38); g.moveTo(0, -s * 0.22); g.lineTo(-s * 0.09, -s * 0.31); g.moveTo(0, -s * 0.22); g.lineTo(s * 0.09, -s * 0.31); g.stroke();
        g.restore();
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, s * 0.06, 0, TAU); g.fill();
    },
    blood(g, s, c) {
      g.fillStyle = c;
      for (let i = 0; i < 2; i++) {
        g.save(); g.rotate(i * Math.PI);
        g.beginPath(); g.arc(0, 0, s * 0.36, -2.3, 0.4); g.arc(s * 0.08, -s * 0.06, s * 0.28, 0.4, -2.3, true); g.fill();
        g.restore();
      }
      g.fillStyle = '#ffd0d8'; g.beginPath(); g.moveTo(0, -s * 0.1); g.quadraticCurveTo(s * 0.08, s * 0.04, 0, s * 0.1); g.quadraticCurveTo(-s * 0.08, s * 0.04, 0, -s * 0.1); g.fill();
    },
    void(g, s, c) {
      const gr = g.createRadialGradient(0, 0, s * 0.05, 0, 0, s * 0.36); gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#1a0630'); gr.addColorStop(0.8, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s * 0.38, 0, TAU); g.fill();
      g.strokeStyle = c; g.lineWidth = s * 0.035;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, s * (0.2 + i * 0.07), i * 2, i * 2 + 2.2); g.stroke(); }
    },
    tome(g, s, c) {
      g.fillStyle = '#4a2a18'; g.fillRect(-s * 0.3, -s * 0.34, s * 0.6, s * 0.66);
      g.fillStyle = '#efe0c0'; g.fillRect(-s * 0.26, -s * 0.3, s * 0.52, s * 0.58);
      g.fillStyle = '#5a3020'; g.fillRect(-s * 0.3, -s * 0.34, s * 0.08, s * 0.66);
      g.strokeStyle = c; g.lineWidth = s * 0.03; g.beginPath(); g.arc(s * 0.04, -s * 0.02, s * 0.13, 0, TAU); g.stroke();
      g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; g.lineTo(s * 0.04 + Math.cos(a) * s * 0.13, -s * 0.02 + Math.sin(a) * s * 0.13); } g.closePath(); g.stroke();
    },
    boots(g, s, c) {
      g.fillStyle = c;
      g.beginPath(); g.moveTo(-s * 0.18, -s * 0.36); g.lineTo(s * 0.06, -s * 0.36); g.lineTo(s * 0.06, s * 0.1); g.lineTo(s * 0.34, s * 0.18); g.lineTo(s * 0.34, s * 0.32); g.lineTo(-s * 0.2, s * 0.32); g.closePath(); g.fill();
      g.fillStyle = '#5a3a28'; g.fillRect(-s * 0.2, s * 0.24, s * 0.54, s * 0.08);
      g.strokeStyle = '#ffe0a0'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.1); g.lineTo(-s * 0.42, -s * 0.18); g.moveTo(-s * 0.3, 0.02 * s); g.lineTo(-s * 0.44, -s * 0.02); g.stroke();
    },
    crystal(g, s, c) {
      g.strokeStyle = '#d8b25a'; g.lineWidth = s * 0.05;
      g.beginPath(); g.moveTo(-s * 0.26, -s * 0.38); g.lineTo(s * 0.26, -s * 0.38); g.moveTo(-s * 0.26, s * 0.38); g.lineTo(s * 0.26, s * 0.38); g.stroke();
      g.fillStyle = c;
      g.beginPath(); g.moveTo(-s * 0.2, -s * 0.32); g.lineTo(s * 0.2, -s * 0.32); g.lineTo(0, 0); g.closePath(); g.fill();
      g.globalAlpha = 0.6; g.beginPath(); g.moveTo(-s * 0.2, s * 0.32); g.lineTo(s * 0.2, s * 0.32); g.lineTo(0, 0); g.closePath(); g.fill(); g.globalAlpha = 1;
    },
    rune(g, s, c) {
      g.fillStyle = '#4a4a5a'; g.beginPath(); g.moveTo(-s * 0.24, -s * 0.36); g.lineTo(s * 0.26, -s * 0.3); g.lineTo(s * 0.3, s * 0.34); g.lineTo(-s * 0.28, s * 0.36); g.closePath(); g.fill();
      g.strokeStyle = c; g.lineWidth = s * 0.06; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-s * 0.08, -s * 0.22); g.lineTo(-s * 0.08, s * 0.22); g.moveTo(-s * 0.08, -s * 0.22); g.lineTo(s * 0.12, -s * 0.08); g.lineTo(-s * 0.08, s * 0.02); g.lineTo(s * 0.14, s * 0.22); g.stroke();
    },
    heart(g, s, c) {
      g.fillStyle = c;
      g.beginPath(); g.moveTo(0, s * 0.34); g.bezierCurveTo(-s * 0.46, s * 0.02, -s * 0.28, -s * 0.38, 0, -s * 0.14); g.bezierCurveTo(s * 0.28, -s * 0.38, s * 0.46, s * 0.02, 0, s * 0.34); g.fill();
      g.fillStyle = '#ffd86b'; g.beginPath(); g.moveTo(0, -s * 0.06); g.lineTo(s * 0.06, s * 0.06); g.lineTo(0, s * 0.16); g.lineTo(-s * 0.06, s * 0.06); g.fill();
    },
    magnet(g, s, c) {
      g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * 0.34, 0, TAU); g.arc(s * 0.14, -s * 0.08, s * 0.28, 0, TAU, true); g.fill();
      g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s * (0.1 + i * 0.08), s * (0.18 - i * 0.14), s * 0.025, 0, TAU); g.fill(); }
    },
    eye(g, s, c) {
      g.fillStyle = '#f3e1ef'; g.beginPath(); g.moveTo(-s * 0.4, 0); g.quadraticCurveTo(0, -s * 0.34, s * 0.4, 0); g.quadraticCurveTo(0, s * 0.34, -s * 0.4, 0); g.fill();
      g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * 0.15, 0, TAU); g.fill();
      g.fillStyle = '#10001a'; g.beginPath(); g.ellipse(0, 0, s * 0.04, s * 0.12, 0, 0, TAU); g.fill();
    },
    heal(g, s, c) {
      g.fillStyle = '#d8c8b0'; g.fillRect(-s * 0.07, -s * 0.38, s * 0.14, s * 0.16);
      g.fillStyle = c; g.beginPath(); g.arc(0, s * 0.08, s * 0.26, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(-s * 0.08, 0, s * 0.06, 0, TAU); g.fill();
    },
    seal(g, s, c) {
      g.strokeStyle = c; g.lineWidth = s * 0.04;
      g.beginPath(); g.arc(0, 0, s * 0.32, 0, TAU); g.stroke();
      g.fillStyle = c; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.1 : s * 0.26; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
    },
    absorb(g, s, c) { draw.void(g, s, c); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, s * 0.05, 0, TAU); g.fill(); },
    free(g, s, c) {
      g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * 0.15, 0, TAU); g.fill();
      g.strokeStyle = c; g.lineWidth = s * 0.04; g.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12, r1 = s * 0.22, r2 = s * (i % 2 ? 0.3 : 0.38); g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.stroke(); }
    },
  };
  // школы = значки стихий
  const SPEC = { storm: 'lightning', fire: 'fire', frost: 'frost', blood: 'blood', void: 'void' };

  function canvas(id, size = 64) {
    const key = id + ':' + size;
    let c = cache.get(key);
    if (c) return c;
    let gold = false, name = id;
    if (id.startsWith('evo_')) { gold = true; name = id.slice(4); }
    if (id.startsWith('spec_')) name = SPEC[id.slice(5)] || 'void';
    c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const col = COLORS[name] || '#d8c8ff';
    g.save();
    base(g, size, col, gold);
    (draw[name] || draw.void)(g, size, col);
    g.restore();
    if (gold) {
      g.fillStyle = '#ffd86b'; g.shadowColor = '#ffb030'; g.shadowBlur = 6;
      const r = size * 0.13, cx = size * 0.82, cy = size * 0.18;
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill();
    }
    cache.set(key, c);
    return c;
  }

  function url(id, size = 96) {
    const key = 'u' + id + size;
    let u = cache.get(key);
    if (!u) { u = canvas(id, size).toDataURL(); cache.set(key, u); }
    return u;
  }

  return { canvas, url, COLORS };
})();
