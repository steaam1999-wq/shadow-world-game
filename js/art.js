// Процедурные изображения скинов: силуэт конкретной модели оружия + узор по названию отделки.
// Используются, когда настоящая картинка Steam недоступна (и как подложка под неё).
window.App = window.App || {};
(function (App) {
  // ---------- Геометрия (viewBox 0 0 200 80) ----------
  const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const P = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';
  const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

  const STOCKS = {
    solid: P([[6, 31], [48, 28], [48, 42], [30, 42], [8, 54], [4, 50]]),
    sniper: P([[4, 30], [50, 27], [50, 43], [36, 43], [26, 53], [6, 57]]),
    thin: P([[14, 30], [48, 30], [48, 34], [19, 34], [17, 46], [12, 46]]),
    none: null,
  };

  function longGun(o) {
    const s = {
      stock: 'solid', rx: 48, rw: 52, hl: 36, bl: 40, mag: 'straight', mx: 86, gx: 74,
      scope: 0, handle: false, sup: 0, pump: false, front: false, ...o,
    };
    const parts = [];
    if (STOCKS[s.stock]) parts.push(STOCKS[s.stock]);
    parts.push(R(s.rx, 26, s.rw, 14));
    const hx = s.rx + s.rw;
    if (s.hl) parts.push(R(hx, 27, s.hl, 10));
    const bx = hx + s.hl;
    if (s.bl) parts.push(R(bx, 30, s.bl, 4));
    const end = bx + s.bl;
    if (s.sup) parts.push(R(end, 28, s.sup, 8));
    if (s.front) parts.push(R(end - 5, 24, 3, 6));
    parts.push(P([[s.gx, 40], [s.gx + 10, 40], [s.gx + 5, 58], [s.gx - 4, 57]]));
    const m = s.mx;
    if (s.mag === 'straight') parts.push(P([[m, 40], [m + 11, 40], [m + 13, 60], [m + 2, 60]]));
    if (s.mag === 'short') parts.push(P([[m, 40], [m + 9, 40], [m + 10, 50], [m + 1, 50]]));
    if (s.mag === 'curved') parts.push(`M${m} 40L${m + 11} 40Q${m + 14} 52 ${m + 21} 62L${m + 11} 66Q${m + 4} 54 ${m} 40Z`);
    if (s.mag === 'box') parts.push(R(m, 40, 22, 14));
    if (s.mag === 'drum') parts.push(R(m, 40, 26, 18));
    if (s.mag === 'helical') parts.push(R(hx - 4, 37, s.hl + 12, 9));
    if (s.scope) {
      const sx = s.rx + 6;
      parts.push(R(sx, 16, s.scope, 7), R(sx + s.scope * 0.2, 22, 4, 5), R(sx + s.scope * 0.7, 22, 4, 5));
    }
    if (s.handle) parts.push(R(s.rx + 8, 19, 30, 3), R(s.rx + 10, 21, 3, 6), R(s.rx + 35, 21, 3, 6));
    if (s.pump) parts.push(R(hx + 6, 36, Math.min(40, s.bl * 0.5), 6));
    if (s.topMag) parts.push(R(s.rx + 8, 19, s.rw - 20, 7));
    return parts;
  }

  function pistol(o) {
    const s = { sl: 70, sup: 0, x: 44, revolver: false, tecMag: false, wide: false, ...o };
    const parts = [];
    const x = s.x;
    if (s.revolver) {
      parts.push(R(x, 28, 26, 10), circle(x + 22, 33, 9), R(x + 30, 27, s.sl - 30, 6));
    } else {
      parts.push(R(x, 24, s.sl, s.wide ? 15 : 11), R(x + 4, 33, s.sl * 0.62, 6));
    }
    if (s.sup) parts.push(R(x + s.sl, 26, s.sup, 7));
    parts.push(P([[x + 6, 35], [x + 24, 35], [x + 20, 64], [x, 63]]));
    parts.push(`M${x + 24} 38h14q2 8 -8 10h-6Z`);
    if (s.tecMag) parts.push(R(x + 36, 36, 9, 28));
    return parts;
  }

  function dual() {
    return pistol({ sl: 62, x: 30 }).concat(pistol({ sl: 62, x: 70 }).map((p) => p));
  }

  function knife(o) {
    const s = { len: 110, curve: 0, guard: false, ring: false, split: false, hook: false, wide: 14, ...o };
    const parts = [];
    const hx = s.ring ? 26 : 12;
    if (s.split) parts.push(R(hx, 36, 60, 4), R(hx, 43, 60, 4), R(hx + 56, 35, 6, 13));
    else parts.push(`M${hx} 38q0 -4 6 -4h52v14h-52q-6 0 -6 -4Z`);
    if (s.ring) parts.push(circle(18, 42, 8));
    if (s.guard) parts.push(R(70, 30, 5, 22));
    const bx = 74, tip = bx + s.len, w = s.wide;
    if (s.curve > 8) {
      parts.push(`M${bx} 34C${bx + 40} ${34 - s.curve} ${tip - 30} ${34 - s.curve} ${tip} ${40 - s.curve * 0.2}C${tip - 34} ${38 - s.curve * 0.4} ${bx + 36} ${44 + w * 0.3} ${bx} ${34 + w}Z`);
    } else {
      // Прямой клинок: обух сверху, «брюшко» лезвия снизу, остриё чуть выше центра.
      const spine = 42 - w;
      const hook = s.hook ? `L${bx + s.len * 0.5} ${spine}l5 5l5 -5` : '';
      parts.push(`M${bx} ${spine + 2}${hook}L${tip - 26} ${spine - 1}Q${tip - 6} ${spine} ${tip} ${spine + w * 0.55}` +
        `Q${tip - 30} ${46 + w * 0.35} ${bx + 16} ${47}L${bx} 47Z`);
    }
    return parts;
  }

  const GLOVES = ['M60 70L56 40L62 18L72 16L76 36L80 12L90 10L94 34L100 10L110 10L112 34L118 14L128 16L126 40L136 30L146 34L128 60L124 70Z'];

  const G = {
    'AK-47': () => longGun({ rx: 48, rw: 50, hl: 28, bl: 52, mag: 'curved', mx: 86, gx: 72, front: true }),
    'M4A4': () => longGun({ rx: 50, rw: 48, hl: 36, bl: 40, mx: 86, gx: 74, handle: true }),
    'M4A1-S': () => longGun({ rx: 50, rw: 48, hl: 32, bl: 14, sup: 42, mx: 86, gx: 74 }),
    'AWP': () => longGun({ stock: 'sniper', rx: 50, rw: 44, hl: 26, bl: 72, mag: 'box', mx: 78, gx: 62, scope: 46 }),
    'SSG 08': () => longGun({ rx: 50, rw: 40, hl: 20, bl: 82, mag: 'short', mx: 80, gx: 62, scope: 40 }),
    'SCAR-20': () => longGun({ rx: 48, rw: 52, hl: 40, bl: 40, mx: 86, gx: 72, scope: 36 }),
    'G3SG1': () => longGun({ rx: 46, rw: 56, hl: 38, bl: 42, mag: 'short', mx: 88, gx: 72, scope: 38 }),
    'Galil AR': () => longGun({ stock: 'thin', rx: 44, rw: 54, hl: 30, bl: 44, mag: 'curved', mx: 84, gx: 70 }),
    'FAMAS': () => longGun({ stock: 'none', rx: 18, rw: 74, hl: 40, bl: 42, mx: 42, gx: 96, handle: true }),
    'AUG': () => longGun({ stock: 'none', rx: 18, rw: 76, hl: 34, bl: 46, mx: 40, gx: 96, scope: 30 }),
    'SG 553': () => longGun({ stock: 'thin', rx: 46, rw: 52, hl: 36, bl: 40, mag: 'curved', mx: 84, gx: 72, scope: 22 }),
    'MP9': () => longGun({ stock: 'thin', rx: 56, rw: 44, hl: 16, bl: 22, mx: 80, gx: 80 }),
    'MAC-10': () => longGun({ stock: 'none', rx: 56, rw: 60, hl: 0, bl: 18, mx: 72, gx: 72 }),
    'MP7': () => longGun({ stock: 'thin', rx: 54, rw: 46, hl: 16, bl: 24, mx: 80, gx: 80 }),
    'MP5-SD': () => longGun({ stock: 'thin', rx: 50, rw: 46, hl: 8, bl: 0, sup: 62, mag: 'curved', mx: 84, gx: 72 }),
    'UMP-45': () => longGun({ stock: 'thin', rx: 50, rw: 54, hl: 32, bl: 14, mx: 88, gx: 74 }),
    'P90': () => longGun({ stock: 'none', rx: 30, rw: 112, hl: 0, bl: 22, mag: 'none', gx: 70, topMag: true }),
    'PP-Bizon': () => longGun({ stock: 'thin', rx: 50, rw: 50, hl: 28, bl: 24, mag: 'helical', gx: 72 }),
    'Nova': () => longGun({ rx: 48, rw: 40, hl: 0, bl: 86, mag: 'none', gx: 66, pump: true }),
    'XM1014': () => longGun({ rx: 48, rw: 46, hl: 0, bl: 80, mag: 'none', gx: 70, pump: true }),
    'Sawed-Off': () => longGun({ stock: 'none', rx: 40, rw: 40, hl: 0, bl: 50, mag: 'none', gx: 44, pump: true }),
    'MAG-7': () => longGun({ stock: 'thin', rx: 50, rw: 44, hl: 0, bl: 50, mx: 70, gx: 62, pump: true }),
    'M249': () => longGun({ rx: 48, rw: 60, hl: 30, bl: 40, mag: 'drum', mx: 80, gx: 76 }),
    'Negev': () => longGun({ rx: 48, rw: 58, hl: 30, bl: 42, mag: 'box', mx: 84, gx: 76, handle: true }),
    'Desert Eagle': () => pistol({ sl: 92, wide: true, x: 36 }),
    'Glock-18': () => pistol({ sl: 70 }),
    'USP-S': () => pistol({ sl: 64, sup: 46, x: 30 }),
    'P2000': () => pistol({ sl: 66 }),
    'P250': () => pistol({ sl: 62 }),
    'Five-SeveN': () => pistol({ sl: 72 }),
    'CZ75-Auto': () => pistol({ sl: 64 }),
    'Tec-9': () => pistol({ sl: 76, tecMag: true, x: 36 }),
    'R8 Revolver': () => pistol({ sl: 86, revolver: true, x: 40 }),
    'Dual Berettas': dual,
    'Zeus x27': () => pistol({ sl: 60, wide: true }),
  };

  const KNIVES = {
    'Karambit': { len: 96, curve: 22, ring: true },
    'Butterfly Knife': { len: 104, split: true },
    'M9 Bayonet': { len: 110, guard: true, wide: 14, hook: true },
    'Bayonet': { len: 110, guard: true },
    'Flip Knife': { len: 98, wide: 14 },
    'Gut Knife': { len: 90, hook: true, wide: 15 },
    'Huntsman Knife': { len: 108, guard: true, hook: true, wide: 15 },
    'Falchion Knife': { len: 100, curve: 10, wide: 15 },
    'Bowie Knife': { len: 116, guard: true, wide: 16 },
    'Shadow Daggers': { len: 60, wide: 16 },
    'Talon Knife': { len: 94, curve: 20, ring: true },
    'Stiletto Knife': { len: 110, wide: 10 },
    'Ursus Knife': { len: 100, wide: 15 },
    'Navaja Knife': { len: 92, curve: 9, wide: 12 },
    'Skeleton Knife': { len: 96, ring: true, wide: 13 },
    'Classic Knife': { len: 104, guard: true },
    'Paracord Knife': { len: 98, hook: true },
    'Survival Knife': { len: 96, hook: true, wide: 14 },
    'Nomad Knife': { len: 100, wide: 14 },
    'Kukri Knife': { len: 104, curve: 14, wide: 18 },
  };

  function shapeFor(skin) {
    if (skin.type === 'gloves') return GLOVES;
    const base = skin.weapon.replace(/^★ /, '');
    if (skin.type === 'knife') return knife(KNIVES[base] || { len: 100 });
    return (G[base] || G['AK-47'])();
  }

  // ---------- Узоры ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  const DOPPLER = {
    'Ruby': ['#6d0010', '#e0142f', '#ff5a6e'], 'Sapphire': ['#001a6e', '#0a4dff', '#4fc3ff'],
    'Emerald': ['#003d24', '#00a86b', '#6dffb0'], 'Black Pearl': ['#0e0620', '#3b1a6b', '#7c4dbf'],
    'Phase 1': ['#10101c', '#4b1f7a', '#c04dd8'], 'Phase 2': ['#1a0d2e', '#d43f9a', '#ff8ad0'],
    'Phase 3': ['#0b1f3d', '#138d75', '#3a6fd8'], 'Phase 4': ['#0a1a3a', '#1e7bff', '#8a4dff'],
  };
  const CAMO = [['#6b6b4a', '#3f432b', '#9a8f63', '#26281b'], ['#8a8f96', '#4c5158', '#c3c7cc', '#2b2e33'], ['#b59a6a', '#7a6340', '#d9c79c', '#4d3d25']];

  // Возвращает { base, defs, layers } для узора, нарисованного в координатах 200×80.
  function patternFor(skin, uid) {
    const name = skin.name.toLowerCase();
    const h = hashStr(skin.weapon + skin.name);
    const r = rng(h);
    const rc = App.data.RARITY[skin.rarity].color;
    const hue = h % 360;
    let defs = '', layers = '';

    const lin = (id, stops, x2 = 1, y2 = 0.3) => {
      defs += `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
      return `url(#${id})`;
    };
    const blotches = (colors, n, rMin, rMax) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const c = colors[Math.floor(r() * colors.length)];
        out += `<ellipse cx="${(r() * 200).toFixed(1)}" cy="${(r() * 80).toFixed(1)}" rx="${(rMin + r() * (rMax - rMin)).toFixed(1)}" ry="${(rMin * 0.7 + r() * (rMax - rMin) * 0.6).toFixed(1)}" fill="${c}" transform="rotate(${Math.floor(r() * 180)} 100 40)"/>`;
      }
      return out;
    };
    const stripes = (color, n, w, skew = 30) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const x = (i / n) * 240 - 20 + r() * 8;
        out += `<path d="M${x} -5l${w} 0l${-skew} 90l${-w} 0Z" fill="${color}"/>`;
      }
      return out;
    };

    let base = rc;
    const phase = (skin.name.match(/\(([^)]+)\)/) || [])[1];

    if (/gamma doppler/.test(name)) {
      const p = phase === 'Emerald' ? DOPPLER.Emerald : phase === 'Black Pearl' ? DOPPLER['Black Pearl'] : ['#0b2e1a', '#1f9e5a', '#7ee0a0'];
      base = lin(`b${uid}`, p, 1, 0.6);
      layers = blotches([p[2], p[0], '#d6ff7a'], 12, 6, 18);
    } else if (/doppler/.test(name)) {
      const p = DOPPLER[phase] || DOPPLER['Phase 2'];
      base = lin(`b${uid}`, p, 1, 0.6);
      layers = blotches([p[2], p[0], p[1]], 14, 5, 16);
    } else if (/marble fade/.test(name)) {
      base = lin(`b${uid}`, ['#1e5bff', '#ffd400', '#ff2a2a', '#ffd400', '#1e5bff'], 1, 0.1);
    } else if (/fade/.test(name)) {
      base = lin(`b${uid}`, ['#ffe066', '#ff4fa3', '#9b4dff', '#4d6bff'], 1, 0.15);
    } else if (/tiger tooth/.test(name)) {
      base = lin(`b${uid}`, ['#ffcc33', '#ff8c00']);
      layers = stripes('#b34700', 14, 5, 22);
    } else if (/case hardened/.test(name)) {
      base = '#6b7a8f';
      layers = blotches(['#2b4c9b', '#c9a227', '#3a5bbf', '#8a7a3a'], 26, 4, 14);
    } else if (/crimson web|crimson kimono/.test(name)) {
      base = '#8b0f1a';
      for (let i = 0; i < 9; i++) layers += `<path d="M${40 + i * 18} -5Q${50 + i * 18 + r() * 20} 40 ${30 + i * 18} 90" stroke="#1a0a0a" stroke-width="1.4" fill="none"/>`;
      layers += `<path d="M0 30Q100 ${20 + r() * 20} 200 30M0 52Q100 ${42 + r() * 20} 200 52" stroke="#1a0a0a" stroke-width="1.4" fill="none"/>`;
    } else if (/asiimov/.test(name)) {
      base = '#f1f1f1';
      layers = `<path d="M60 0L120 0L90 80L40 80Z" fill="#ff6a00"/><path d="M130 0L150 0L128 80L108 80Z" fill="#111"/><path d="M0 50L40 50L30 80L0 80Z" fill="#111"/>`;
    } else if (/printstream/.test(name)) {
      base = lin(`b${uid}`, ['#fafafa', '#e8e3f0', '#cfd8e3']);
      layers = `<path d="M110 -5L200 -5L200 85L80 85Z" fill="#0d0d0d"/>` + stripes('rgba(160,120,255,.25)', 6, 3, 40);
    } else if (/redline/.test(name)) {
      base = '#141414';
      layers = `<rect x="0" y="36" width="200" height="4" fill="#d90429"/><rect x="0" y="44" width="200" height="1.5" fill="#d90429"/>`;
    } else if (/lore/.test(name)) {
      base = lin(`b${uid}`, ['#f5d77a', '#c9a227', '#6b5214']);
      layers = blotches(['#5f7f2f', '#8a6a1a'], 8, 4, 10);
    } else if (/howl/.test(name)) {
      base = lin(`b${uid}`, ['#ffb300', '#ff4800', '#b31b00']);
      layers = blotches(['#3a0a00', '#ffd000'], 10, 4, 10);
    } else if (/(ddpat|mesh|forest|boreal|safari|camo|sand|urban|scorched|jungle|woodland|desert|spray|predator|storm)/.test(name)) {
      const c = CAMO[h % CAMO.length];
      base = c[0];
      layers = blotches(c.slice(1), 30, 5, 13);
    } else if (/(night|stained|blue steel|rust coat|damascus|bright water|black laminate|ultraviolet|steel|metallic|anodized|chrome|vanilla)/.test(name)) {
      const dark = /night|black|ultraviolet/.test(name), blue = /blue|bright water/.test(name), rust = /rust/.test(name);
      base = lin(`b${uid}`, rust ? ['#8a4b2a', '#4a2a1a', '#a0603a'] : blue ? ['#3a5a8a', '#1a2a4a', '#6a8abf'] : dark ? ['#3a3a44', '#15151a', '#50505e'] : ['#d9dde3', '#8a9099', '#f2f4f7'], 1, 0.5);
      if (/stained|damascus/.test(name)) layers = blotches(['rgba(80,60,120,.35)', 'rgba(40,90,110,.35)'], 16, 4, 12);
    } else {
      // Остальные отделки: оттенок по имени + цвет редкости, один из стилей.
      const c1 = `hsl(${hue} 72% 58%)`, c2 = `hsl(${(hue + 40) % 360} 70% 32%)`, c3 = `hsl(${(hue + 200) % 360} 75% 60%)`;
      const style = h % 5;
      if (style === 0) { base = lin(`b${uid}`, [c1, c2]); layers = stripes(c3, 8, 6, 24); }
      else if (style === 1) { base = c2; layers = blotches([c1, c3, rc], 18, 5, 14); }
      else if (style === 2) { base = lin(`b${uid}`, [c1, rc, c2], 1, 0.8); layers = `<path d="M0 ${30 + r() * 20}Q60 ${r() * 80} 120 ${20 + r() * 40}T200 ${30 + r() * 20}L200 80L0 80Z" fill="${c2}" opacity=".7"/>`; }
      else if (style === 3) { base = lin(`b${uid}`, [c3, c1]); layers = `<path d="M${60 + r() * 40} -5L${130 + r() * 40} -5L${100 + r() * 40} 85L${40 + r() * 30} 85Z" fill="${c2}"/>` + stripes('rgba(0,0,0,.25)', 10, 2, 30); }
      else { base = c1; layers = blotches([c2, c3], 10, 8, 20) + stripes('rgba(255,255,255,.18)', 12, 2, 10); }
    }
    return { base, defs, layers };
  }

  let seq = 0;
  // SVG-разметка изображения скина (самостоятельный документ, с тенью внутри).
  function svgMarkup(skin) {
    const uid = `a${(seq++).toString(36)}`;
    const parts = shapeFor(skin);
    const pat = patternFor(skin, uid);
    const paths = parts.map((d) => `<path d="${d}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 208 92" width="416" height="184">
      <defs>
        <filter id="s${uid}" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".55"/></filter>
        <clipPath id="c${uid}">${paths}</clipPath>
        <linearGradient id="h${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
        ${pat.defs}
      </defs>
      <g fill="#07080c" stroke="#07080c" stroke-width="3" stroke-linejoin="round" filter="url(#s${uid})">${paths}</g>
      <g clip-path="url(#c${uid})">
        <rect width="200" height="80" fill="${pat.base}"/>${pat.layers}
        <rect width="200" height="80" fill="url(#h${uid})"/>
      </g>
    </svg>`;
  }

  // Готовая картинка (data: URL) для каждого скина считается один раз и кешируется:
  // браузер растеризует её единожды, а не перерисовывает сложный SVG в каждой карточке.
  const cache = new Map();
  function url(skin) {
    let u = cache.get(skin.id);
    if (!u) {
      u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup(skin).replace(/\s*\n\s*/g, ' '));
      cache.set(skin.id, u);
    }
    return u;
  }
  function render(skin, cls = '') {
    return `<img class="skin-svg ${cls}" src="${url(skin)}" alt="" draggable="false" decoding="async">`;
  }

  App.art = { render, url };
})(window.App);
