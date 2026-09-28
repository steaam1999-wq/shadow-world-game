// «Живые» эффекты: фон с искрами, звуки (WebAudio, без файлов), конфетти.
// Всё отключается при prefers-reduced-motion; звук — кнопкой в шапке.
window.App = window.App || {};
(function (App) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Фон ----------
  function startBackground() {
    const cv = document.createElement('canvas');
    cv.id = 'bg-fx';
    cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');
    let w, h, dpr;
    const orbs = [
      { x: 0.15, y: 0.2, r: 0.45, c: '61,220,132', sx: 0.00007, sy: 0.00005 },
      { x: 0.85, y: 0.35, r: 0.4, c: '34,184,255', sx: -0.00006, sy: 0.00008 },
      { x: 0.5, y: 0.9, r: 0.5, c: '120,70,255', sx: 0.00005, sy: -0.00006 },
    ];
    const sparks = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), v: 0.00005 + Math.random() * 0.00016, s: 0.6 + Math.random() * 1.8, a: Math.random() * Math.PI * 2 }));

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.width = innerWidth * dpr;
      h = cv.height = innerHeight * dpr;
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const o of orbs) {
        const x = (o.x + Math.sin(t * o.sx * 10) * 0.08) * w, y = (o.y + Math.cos(t * o.sy * 10) * 0.08) * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, o.r * Math.max(w, h));
        g.addColorStop(0, `rgba(${o.c},.13)`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      for (const p of sparks) {
        p.y -= p.v * 16;
        p.a += 0.02;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const x = (p.x + Math.sin(p.a) * 0.004) * w, y = p.y * h;
        ctx.fillStyle = `rgba(${80 + Math.floor(p.s * 30)},${200 + Math.floor(p.s * 20)},255,${0.25 + 0.35 * Math.abs(Math.sin(p.a))})`;
        ctx.beginPath();
        ctx.arc(x, y, p.s * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced && !document.hidden) requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduced) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  }

  // ---------- Звук ----------
  let actx = null;
  const soundOn = () => App.store.state.settings.sound !== false;
  function ac() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, { type = 'sine', vol = 0.08, at = 0, slide = 0 } = {}) {
    if (!soundOn()) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + at;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  const sound = {
    tick: () => tone(1400 + Math.random() * 200, 0.035, { type: 'square', vol: 0.025 }),
    open: () => { tone(220, 0.25, { type: 'sawtooth', vol: 0.04, slide: 500 }); },
    // Чем реже предмет, тем выше и длиннее аккорд.
    win(order = 2) {
      const base = 392 * Math.pow(1.12, Math.max(0, order - 2));
      [0, 4, 7, 12].slice(0, order >= 5 ? 4 : 3).forEach((st, i) =>
        tone(base * Math.pow(2, st / 12), 0.35 + order * 0.04, { type: 'triangle', vol: 0.07, at: i * 0.08 }));
    },
    lose: () => { tone(330, 0.3, { type: 'triangle', vol: 0.06, slide: -160 }); tone(220, 0.4, { type: 'triangle', vol: 0.05, at: 0.12, slide: -100 }); },
    coin: () => { tone(988, 0.08, { type: 'square', vol: 0.03 }); tone(1319, 0.14, { type: 'square', vol: 0.03, at: 0.07 }); },
  };

  // ---------- Конфетти ----------
  function confetti({ x = innerWidth / 2, y = innerHeight / 2, colors = ['#3ddc84', '#22b8ff', '#ffc93c', '#8847ff', '#ffffff'], count = 120 } = {}) {
    if (reduced) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    document.body.appendChild(cv);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    const ctx = cv.getContext('2d');
    const parts = Array.from({ length: count }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const sp = 6 + Math.random() * 10;
      return { x: x * dpr, y: y * dpr, vx: Math.cos(ang) * sp * dpr, vy: Math.sin(ang) * sp * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        w: (5 + Math.random() * 6) * dpr, h: (3 + Math.random() * 4) * dpr, c: colors[Math.floor(Math.random() * colors.length)] };
    });
    const start = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const life = (t - start) / 2600;
      for (const p of parts) {
        p.vy += 0.28 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (life < 1) requestAnimationFrame(frame); else cv.remove();
    })(start);
  }

  // Праздник для редкого дропа: звук всегда, конфетти — от «Засекреченного» и выше.
  function celebrate(items) {
    const { SKINS, RARITY } = App.data;
    const best = items.reduce((m, it) => Math.max(m, RARITY[SKINS[it.skinId].rarity].order), 0);
    sound.win(best);
    if (best >= 4) {
      const top = items.find((it) => RARITY[SKINS[it.skinId].rarity].order === best);
      const c = RARITY[SKINS[top.skinId].rarity].color;
      confetti({ colors: [c, '#ffffff', '#ffc93c', c], count: best >= 6 ? 220 : 130 });
    }
  }

  App.fx = { sound, confetti, celebrate, startBackground, reduced };
})(window.App);
