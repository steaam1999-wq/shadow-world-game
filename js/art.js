// EMPIRE CITY — векторная графика (оригинальные SVG-рисунки в мультяшном стиле)
"use strict";

const ART = (() => {
  const OL = "#2a1d12";                       // цвет контура
  let uid = 0;
  const id = p => p + (++uid);

  const P = (d, fill, sw = 3, extra = "") =>
    `<path d="${d}" fill="${fill}" stroke="${OL}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const L = (d, color, sw) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const C = (cx, cy, r, fill, sw = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${OL}" stroke-width="${sw}"/>`;
  const E = (cx, cy, rx, ry, fill, sw = 3) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${OL}" stroke-width="${sw}"/>`;
  const R = (x, y, w, h, fill, rx = 0, sw = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${OL}" stroke-width="${sw}"/>`;
  const svg = (vb, body, cls = "") => `<svg class="art ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${body}</svg>`;

  // Детерминированный генератор случайных чисел
  function rng(seed) {
    let a = typeof seed === "number" ? seed : [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, "0")).join("");
  }

  const SKINS = ["#f2c8a0", "#e9b48a", "#d9a074", "#c68858", "#a86d45", "#f5d2b5"];
  const HAIRS = ["#2b2118", "#4a3020", "#7a4a22", "#b06a2a", "#9a9a9a", "#d8c8a0", "#1a1a1a"];
  const OUTFITS = ["#1f2a44", "#2b2b2b", "#3c4f2f", "#5a1f1f", "#2f3f6a", "#4a3a5a", "#6a4a2a"];

  // ---------- Персонаж ----------
  // o: {skin, hair, hairType, beard, hat, hatColor, outfit, stripes, chain, weapon, mood, scar, shades, uniform, big,
  //     female, skirt, skirtColor, suit, tie, shirt, old, glasses, watch, tattoo, earrings, lips, pants}
  function thug(o) {
    const sk = o.skin, skD = shade(sk, 0.82), hc = o.hair || "#2b2118", out = o.outfit || "#1f2a44";
    const fem = !!o.female;
    const outD = o.pants || shade(out, 0.75);
    const str = (o.stripes === false || o.suit || o.uniform || fem) ? null : (o.stripes || "#f2f2f2");
    const browC = (hc === "#9a9a9a" || hc === "#bdbdbd" || hc === "#d0d0d0" || hc === "#e0e0e0") ? "#888" : OL;
    let g = "";

    // волосы за головой
    if (fem && o.hairType === "long") g += P("M54 60 Q48 16 100 14 Q152 16 146 60 L154 158 Q100 172 46 158 Z", hc);
    if (fem && o.hairType === "ponytail") g += P("M126 32 Q170 52 160 136 Q148 104 124 62 Z", hc);

    // ноги и обувь
    if (o.skirt) {
      g += P("M80 236 L78 280 L90 280 L92 236 Z", sk, 2.5) + P("M108 236 L110 280 L122 280 L120 236 Z", sk, 2.5);
      g += P("M72 280 h20 l2 8 h-24 Z", "#1d1d1d", 2.5) + P("M108 280 h20 l2 8 h-24 Z", "#1d1d1d", 2.5);
      g += P("M60 200 L140 200 L154 248 Q100 260 46 248 Z", o.skirtColor || outD);
    } else {
      const w = fem ? 0.85 : 1;
      g += E(74, 287, 21 * w, 9, "#1d1d1d") + E(126, 287, 21 * w, 9, "#1d1d1d");
      g += P(fem ? "M72 200 L70 283 L94 283 L99 206 Z" : "M68 200 L64 283 L93 283 L99 206 Z", outD) +
           P(fem ? "M101 206 L106 283 L130 283 L128 200 Z" : "M101 206 L107 283 L136 283 L132 200 Z", outD);
      if (str) g += L("M70 210 L67 278", str, 3) + L("M130 210 L133 278", str, 3);
      if (o.suit && !fem) g += L("M84 214 L80 280 M116 214 L120 280", "#0000002a", 2);
    }

    // руки за торсом
    const hx1 = fem ? 56 : 50, hx2 = fem ? 144 : 150;
    if (fem) {
      g += P("M66 126 Q46 152 50 200 L62 201 Q62 164 74 144 Z", out) + P("M134 126 Q154 152 150 200 L138 201 Q138 164 126 144 Z", out);
    } else {
      g += P("M62 126 Q38 152 42 202 L58 203 Q58 164 72 142 Z", out) + P("M138 126 Q162 152 158 202 L142 203 Q142 164 128 142 Z", out);
      if (str) g += L("M56 134 Q42 160 47 196", str, 3) + L("M144 134 Q158 160 153 196", str, 3);
    }

    // торс
    g += P(fem ? "M64 122 Q100 112 136 122 L142 206 Q100 216 58 206 Z"
           : o.big ? "M54 120 Q100 106 146 120 L160 212 Q100 226 40 212 Z" : "M58 120 Q100 108 142 120 L150 210 Q100 222 50 210 Z", out);
    if (o.uniform) {
      g += P("M86 118 L100 150 L114 118 Z", "#e8e4d8", 2) + P("M97 128 L100 170 L103 128 Z", "#6a1f1f", 2);
      g += C(72, 150, 4, "#e6b64f", 2) + C(128, 150, 4, "#e6b64f", 2) + L("M66 132 L82 130", "#e6b64f", 3) + L("M134 132 L118 130", "#e6b64f", 3);
    } else if (o.suit) {
      const shirt = o.shirt || "#f2efe6", lap = shade(out, 0.78);
      g += P("M86 117 L100 158 L114 117 Z", shirt, 2);
      if (o.tie) g += P("M96 122 L100 118 L104 122 L103 128 L106 152 L100 160 L94 152 L97 128 Z", o.tie, 2);
      g += P("M84 116 L100 160 L90 168 L76 128 Z", lap, 2.5) + P("M116 116 L100 160 L110 168 L124 128 Z", lap, 2.5);
      g += C(100, 176, 2.5, "#1a1a1a", 1) + C(100, 192, 2.5, "#1a1a1a", 1);
      if (!fem) g += L("M118 140 l12 -2", "#f2efe6", 3);
    } else if (fem) {
      g += P("M88 118 Q100 140 112 118 Z", sk, 2);
    } else {
      g += L("M100 118 L100 214", OL, 2.5) + P("M86 116 L100 132 L114 116", "none", 3);
      g += `<path d="M64 150 Q62 180 66 206" stroke="#ffffff22" stroke-width="8" fill="none"/>`;
    }
    // кисти
    g += C(hx1, 207, fem ? 8 : 10, sk) + C(hx2, 207, fem ? 8 : 10, sk);
    if (o.watch) g += R(hx1 - 8, 192, 16, 7, "#f2c94c", 2, 2);
    if (o.tattoo) g += L(`M${hx2 - 5} 203 l4 4 l4 -4 M${hx1 - 4} 204 h8`, "#2a4a7a", 2);

    // шея
    g += fem ? P("M92 104 L92 122 Q100 126 108 122 L108 104 Z", skD) : P("M88 104 L88 122 Q100 128 112 122 L112 104 Z", skD);
    if (o.tattoo) g += L("M106 108 q6 4 2 9 q-4 4 2 8", "#2a4a7a", 2.5);

    // цепь / ожерелье
    if (o.chain && fem) {
      for (let i = 0; i <= 8; i++) { const t = i / 8, x = 86 + 28 * t, y = 120 + 18 * Math.sin(Math.PI * t); g += C(x, y, 2.6, "#f6f1e4", 1.2); }
    } else if (o.chain) {
      g += L("M80 120 Q100 168 120 120", "#7a5a10", 7) + L("M80 120 Q100 168 120 120", "#f2c94c", 4) +
        P("M96 146 h8 v8 h6 v6 h-6 v12 h-8 v-12 h-6 v-6 h6 Z", "#f2c94c", 2);
    }

    // голова
    g += C(fem ? 64 : 62, 74, fem ? 7 : 9, sk) + C(fem ? 136 : 138, 74, fem ? 7 : 9, sk);
    g += P(fem ? "M64 58 Q64 26 100 26 Q136 26 136 58 L136 84 Q130 114 100 116 Q70 114 64 84 Z"
               : "M62 58 Q62 24 100 24 Q138 24 138 58 L140 90 Q136 118 100 120 Q64 118 60 90 Z", sk);
    if (fem && (o.earrings !== false)) g += C(64, 88, 3.5, "#f2c94c", 1.5) + C(136, 88, 3.5, "#f2c94c", 1.5);
    if (fem) g += `<ellipse cx="78" cy="88" rx="7" ry="4" fill="#e0707044"/><ellipse cx="122" cy="88" rx="7" ry="4" fill="#e0707044"/>`;
    // щетина / борода
    if (o.beard === "stubble") g += `<path d="M64 86 Q100 124 136 86 Q132 114 100 119 Q68 114 64 86 Z" fill="#0000002a"/>`;
    if (o.beard === "full") g += P("M61 80 Q62 126 100 128 Q138 126 139 80 Q130 102 100 102 Q70 102 61 80 Z", hc);

    // глаза
    if (o.shades) {
      g += P("M72 62 h24 v10 q-2 8 -12 8 q-10 0 -12 -8 Z", "#151515") + P("M104 62 h24 v10 q-2 8 -12 8 q-10 0 -12 -8 Z", "#151515") + L("M96 64 L104 64", OL, 3);
      g += L("M77 66 L84 66", "#ffffff88", 2) + L("M109 66 L116 66", "#ffffff88", 2);
    } else {
      g += E(85, 69, fem ? 6.5 : 7, fem ? 6 : 5.5, "#fff", 2) + E(115, 69, fem ? 6.5 : 7, fem ? 6 : 5.5, "#fff", 2);
      g += `<circle cx="87" cy="70" r="${fem ? 3.2 : 2.8}" fill="${OL}"/><circle cx="113" cy="70" r="${fem ? 3.2 : 2.8}" fill="${OL}"/>`;
      if (fem) {
        g += L("M78 65 l-4 -3 M81 63 l-2 -4 M122 65 l4 -3 M119 63 l2 -4", OL, 1.8);
        g += L("M76 57 Q85 52 94 57", browC, 2.5) + L("M124 57 Q115 52 106 57", browC, 2.5);
      } else {
        g += o.mood === "calm" ? L("M75 59 Q85 55 95 60", browC, 4.5) + L("M125 59 Q115 55 105 60", browC, 4.5)
                               : L("M74 56 L96 64", browC, 5) + L("M126 56 L104 64", browC, 5);
      }
      if (o.glasses) g += `<circle cx="85" cy="69" r="10" fill="#ffffff22" stroke="${OL}" stroke-width="2.5"/><circle cx="115" cy="69" r="10" fill="#ffffff22" stroke="${OL}" stroke-width="2.5"/>` + L("M95 68 L105 68 M75 67 L66 64 M125 67 L134 64", OL, 2.5);
    }
    if (o.old) g += L("M78 46 Q88 43 98 46 M102 46 Q112 43 122 46", "#00000033", 2) + L("M75 78 q4 3 9 2 M125 78 q-4 3 -9 2 M72 92 q3 8 8 12 M128 92 q-3 8 -8 12", "#00000033", 2);
    if (o.scar) g += L("M118 54 L110 82", "#9a3a2a", 2.5) + L("M112 62 L118 64 M110 70 L116 72", "#9a3a2a", 1.5);

    // нос
    g += fem ? P("M100 72 Q94 84 98 87 Q102 89 105 86", skD, 2) : P("M100 68 Q90 86 97 90 Q104 92 107 87", skD, 2.5);

    // рот
    if (fem) {
      g += o.mood === "angry" ? P("M89 104 Q100 98 111 104 Q100 108 89 104 Z", o.lips || "#b8392b", 2)
                              : P("M88 101 Q94 98 100 100 Q106 98 112 101 Q100 111 88 101 Z", o.lips || "#b8392b", 2);
    } else if (o.mood === "grin") g += P("M84 99 Q100 113 116 99 Z", "#fff", 2.5) + `<rect x="103" y="100" width="6" height="6" fill="#f2c94c"/>`;
    else if (o.mood === "calm") g += L("M88 103 Q100 107 112 103", OL, 3);
    else g += L("M86 105 Q100 97 114 105", OL, 3.5);
    if (o.beard === "mustache" || o.beard === "full") g += P("M82 97 Q92 89 100 94 Q108 89 118 97 Q108 96 100 99 Q92 96 82 97 Z", hc, 2);

    // волосы и головные уборы
    const ht = o.hat;
    if (ht === "cap") {
      g += P("M60 54 Q60 16 100 16 Q140 16 140 54 Q100 46 60 54 Z", o.hatColor || "#2b2b2b") + P("M100 50 Q130 46 158 54 Q150 62 100 58 Z", shade(o.hatColor || "#2b2b2b", 0.7));
      g += L("M100 18 L100 48", "#ffffff33", 3);
    } else if (ht === "beanie") {
      g += P("M60 56 Q58 12 100 12 Q142 12 140 56 Z", o.hatColor || "#5a3a2a") + R(56, 46, 88, 13, shade(o.hatColor || "#5a3a2a", 0.8), 5, 3);
      for (let x = 70; x < 136; x += 12) g += L(`M${x} 22 L${x} 46`, "#0002", 3);
    } else if (ht === "police") {
      g += P("M56 52 Q50 20 100 16 Q150 20 144 52 Z", "#2c4876") + R(60, 42, 80, 12, "#b8392b", 2, 3);
      g += P("M62 54 Q100 70 138 54 L138 50 Q100 60 62 50 Z", "#151515", 2.5) + C(100, 30, 6, "#f2c94c", 2.5);
    } else if (ht === "fedora") {
      g += P("M44 56 Q100 40 156 56 Q160 62 150 62 Q100 52 50 62 Q40 62 44 56 Z", o.hatColor || "#3a2a20");
      g += P("M66 54 Q64 18 100 16 Q136 18 134 54 Q100 46 66 54 Z", o.hatColor || "#3a2a20") + P("M67 46 Q100 40 133 46 L134 53 Q100 46 66 53 Z", "#1a1a1a", 2);
    } else if (fem && o.hairType === "bob") {
      g += P("M58 92 Q50 20 100 18 Q150 20 142 92 L132 92 Q134 54 116 42 Q96 52 70 48 Q66 70 68 92 Z", hc) + L("M82 26 Q100 20 118 26", "#ffffff33", 3);
    } else if (fem && o.hairType === "bun") {
      g += C(100, 16, 14, hc) + P("M62 60 Q60 24 100 24 Q140 24 138 60 Q122 38 100 40 Q78 38 62 60 Z", hc) + L("M84 30 Q100 26 116 30", "#ffffff33", 2.5);
    } else if (fem) { // long / ponytail
      g += P("M60 66 Q58 22 100 20 Q142 22 140 66 Q130 42 110 38 Q96 50 70 46 Q62 54 60 66 Z", hc) + L("M84 28 Q100 22 116 28", "#ffffff33", 3);
    } else if (o.hairType === "buzz") {
      g += P("M62 58 Q60 22 100 22 Q140 22 138 58 Q128 40 100 40 Q72 40 62 58 Z", hc);
    } else if (o.hairType === "slick") {
      g += P("M60 64 Q56 20 100 18 Q146 20 140 64 Q136 40 112 36 Q90 34 72 42 Q62 50 60 64 Z", hc) + L("M76 30 Q100 24 124 30", "#ffffff33", 3);
    } else if (o.hairType === "mullet") {
      g += P("M60 70 Q54 22 100 20 Q146 22 140 70 Q138 46 100 40 Q62 46 60 70 Z", hc) + P("M60 70 Q56 100 66 110 L70 88 Z", hc, 2.5) + P("M140 70 Q144 100 134 110 L130 88 Z", hc, 2.5);
    } else if (o.hairType === "sides") {
      g += P("M60 76 Q58 52 66 44 L70 66 Z", hc, 2.5) + P("M140 76 Q142 52 134 44 L130 66 Z", hc, 2.5) + `<ellipse cx="88" cy="36" rx="12" ry="6" fill="#ffffff55" transform="rotate(-20 88 36)"/>`;
    } else {
      g += `<ellipse cx="88" cy="36" rx="12" ry="6" fill="#ffffff55" transform="rotate(-20 88 36)"/>`;
    }

    // предмет в правой руке
    g += weapon(o.weapon, sk);
    return g;
  }

  function weapon(w, sk) {
    switch (w) {
      case "knuckle": return P("M140 199 h20 v14 h-20 Z", "#d9b44a", 2.5) + C(144, 203, 2.5, "#fff3", 1.5) + C(150, 203, 2.5, "#fff3", 1.5) + C(156, 203, 2.5, "#fff3", 1.5);
      case "bat": return P("M146 214 L176 116 Q182 104 192 110 Q196 118 188 126 L156 218 Z", "#c58a4a") + L("M176 130 L184 134", "#8a5a2a", 3) + C(150, 207, 10, sk || "#f2c8a0");
      case "knife": return P("M146 202 h8 v14 h-8 Z", "#3a2a20", 2.5) + P("M147 202 L150 166 Q156 176 154 202 Z", "#d8dde2", 2.5);
      case "sawoff": return P("M120 196 L176 186 L178 196 L150 202 L148 214 L138 216 L140 204 L122 206 Z", "#3a3a3a", 2.5) + P("M120 196 L106 200 L110 214 L124 206 Z", "#7a4a22", 2.5);
      case "pistol": return P("M140 196 h34 v9 h-22 v14 h-10 v-14 h-2 Z", "#2a2a2a", 2.5) + L("M144 199 h26", "#ffffff33", 2);
      case "rifle": case "sniper":
        return P("M112 204 L196 176 L199 184 L160 198 L156 214 L146 216 L148 202 L116 212 Z", "#2e2e2e", 2.5) +
          P("M112 204 L94 212 L98 224 L118 214 Z", "#7a4a22", 2.5) + P("M152 200 L156 220 L148 222 L146 204 Z", "#2e2e2e", 2) +
          (w === "sniper" ? R(150, 178, 26, 8, "#1a1a1a", 3, 2) : "");
      case "cane": return L("M150 214 L158 288", OL, 8) + L("M150 214 L158 288", "#4a2a1a", 5) + P("M142 210 Q150 196 160 206", "none", 6) + L("M142 210 Q150 197 159 206", "#e6b64f", 3);
      case "folder": return P("M138 186 h34 v40 h-34 Z", "#c9a46a", 2.5) + L("M144 196 h20 M144 204 h20 M144 212 h14", "#7a5a2a", 2);
      case "glass": return P("M144 186 h16 l-2 22 h-12 Z", "#cfe6ee", 2) + `<rect x="147" y="196" width="10" height="11" fill="#c9862a"/>`;
      case "cigar": return P("M150 200 h18 v5 h-18 Z", "#7a4a22", 1.5) + L("M168 202 h3", "#e05a2a", 3) + `<path d="M172 196 q4 -6 0 -12" stroke="#9998" stroke-width="2" fill="none"/>`;
      default: return "";
    }
  }

  // Параметры персонажа по зерну
  function randomLook(seed, extra) {
    const r = rng(seed);
    return Object.assign({
      skin: pick(r, SKINS), hair: pick(r, HAIRS),
      hairType: pick(r, ["bald", "buzz", "buzz", "slick", "mullet"]),
      beard: pick(r, ["none", "stubble", "stubble", "full", "mustache"]),
      hat: r() < 0.35 ? pick(r, ["cap", "beanie"]) : null,
      hatColor: pick(r, ["#2b2b2b", "#5a3a2a", "#1f3a5a", "#6a1f1f", "#3c4f2f"]),
      outfit: pick(r, OUTFITS), stripes: r() < 0.75 ? pick(r, ["#f2f2f2", "#f2f2f2", "#e6b64f", "#c03030"]) : false,
      chain: r() < 0.3, scar: r() < 0.25, shades: r() < 0.12,
      mood: pick(r, ["angry", "angry", "grin", "calm"]),
      weapon: r() < 0.4 ? pick(r, ["bat", "knife", "knuckle", "pistol"]) : null,
      big: r() < 0.3
    }, extra || {});
  }

  const inset = (x, y, w, h, look) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="28 6 144 150" preserveAspectRatio="xMidYMin slice">${thug(look)}</svg>`;
  const bust = (look, cls) => svg("28 6 144 150", thug(look), "bust " + (cls || ""));
  const full = (look, cls) => svg("0 0 200 300", thug(look), "full " + (cls || ""));

  // ---------- Герой ----------
  const WEAPON_MAP = { knuckle: "knuckle", bat: "bat", knife: "knife", sawoff: "sawoff", pistol: "pistol", rifle: "rifle", sniper: "sniper" };
  function heroLook(S) {
    const base = randomLook("hero:" + S.name, { mood: "angry", hat: null, chain: false, weapon: null, shades: false, scar: false });
    if (S.gear.weapon) base.weapon = WEAPON_MAP[S.gear.weapon];
    const ex = S.gear.extra;
    if (ex === "cap") { base.hat = "cap"; base.hatColor = "#2b2b2b"; }
    if (ex === "chain" || ex === "watch" || ex === "ring") base.chain = true;
    if (ex === "shades") { base.shades = true; base.chain = true; }
    const ar = S.gear.armor;
    base.outfit = { leather: "#3a2a20", track: "#1f2a44", vest: "#4a5a3a", kevlar: "#2f3a2f", heavy: "#2a2a2a", tactic: "#3a3f2a" }[ar] || "#2b2b2b";
    base.stripes = ar === "track" || !ar ? "#f2f2f2" : false;
    base.big = S.stats.str + S.stats.end > 40;
    return base;
  }

  // ---------- Комната ----------
  function room(S, homes) {
    const h = homes[S.home], wp = id("wp"), sky = id("sky");
    const w1 = h.wall[0], w2 = h.wall[1], fl = h.floor;
    const has = f => S.furniture.includes(f);
    let g = `<defs>
      <pattern id="${wp}" width="22" height="26" patternUnits="userSpaceOnUse"><rect width="22" height="26" fill="${w1}"/>
        <path d="M11 3 Q18 9 11 13 Q4 9 11 3 Z M0 16 Q7 22 0 26 M22 16 Q15 22 22 26" fill="${w2}" opacity=".55"/></pattern>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ac0cf"/><stop offset="1" stop-color="#dfe3d2"/></linearGradient></defs>`;
    // потолок, стены
    g += `<rect width="400" height="300" fill="#e9e5d6"/><rect y="22" width="400" height="160" fill="url(#${wp})"/>`;
    g += `<path d="M0 22 H400" stroke="${OL}" stroke-width="3"/>`;
    // боковые стены в перспективе
    g += `<path d="M0 22 L40 40 L40 178 L0 200 Z" fill="${shade(w1, 0.8)}" opacity=".8"/><path d="M400 22 L360 40 L360 178 L400 200 Z" fill="${shade(w1, 0.8)}" opacity=".8"/>`;
    // пол
    g += `<path d="M0 200 L40 178 L360 178 L400 200 L400 300 L0 300 Z" fill="${fl}" stroke="${OL}" stroke-width="3"/>`;
    for (let i = -6; i <= 6; i++) g += `<path d="M${200 + i * 26} 178 L${200 + i * 60} 300" stroke="#0003" stroke-width="2"/>`;
    g += `<path d="M40 178 H360" stroke="#efe6cc" stroke-width="6"/>`;
    if (S.home >= 3) g += `<ellipse cx="200" cy="262" rx="120" ry="26" fill="${S.home >= 5 ? "#7a1f2a" : "#3a5a7a"}" stroke="${OL}" stroke-width="3"/><ellipse cx="200" cy="262" rx="100" ry="18" fill="none" stroke="#e6b64f" stroke-width="2" stroke-dasharray="6 4"/>`;

    // окно с городом
    g += R(140, 46, 120, 98, `url(#${sky})`, 2, 4);
    g += `<path d="M150 144 V112 h14 V96 h12 V144 M182 144 V86 h18 V144 M206 144 V104 h16 V144 M228 144 V92 h12 V80 h8 V144" fill="#c9c3b2" stroke="#8d8676" stroke-width="2"/>`;
    g += `<path d="M236 80 Q232 66 242 58 Q236 50 246 44" stroke="#8a8a8a" stroke-width="7" fill="none" opacity=".6" stroke-linecap="round"/>`;
    for (let y = 100; y < 140; y += 10) g += `<rect x="186" y="${y}" width="4" height="5" fill="#8d8676"/><rect x="194" y="${y}" width="4" height="5" fill="#8d8676"/>`;
    g += `<path d="M200 46 V144 M140 95 H260" stroke="#f3efe2" stroke-width="7"/><rect x="140" y="46" width="120" height="98" fill="none" stroke="#f3efe2" stroke-width="8"/>` + R(136, 42, 128, 106, "none", 3, 3);
    g += R(132, 144, 136, 8, "#efe9d8", 2, 3);
    // карниз и шторы
    g += L("M116 38 H284", "#9a9a9a", 4) + C(116, 38, 4, "#b0b0b0", 2) + C(284, 38, 4, "#b0b0b0", 2);
    g += P("M118 40 Q114 100 120 162 L146 162 Q140 100 146 40 Z", "#d8493a") + L("M128 46 Q126 100 130 158", "#a83228", 3) + L("M138 46 Q136 100 140 158", "#a83228", 3);
    g += P("M254 40 Q260 100 254 162 L280 162 Q286 100 282 40 Z", "#d8493a") + L("M262 46 Q264 100 262 158", "#a83228", 3) + L("M272 46 Q274 100 272 158", "#a83228", 3);

    // лампа / люстра
    if (S.home >= 4) {
      g += L("M200 22 V40", OL, 3) + P("M176 40 h48 l-6 12 h-36 Z", "#e6b64f") + C(180, 58, 5, "#fff6b5", 2) + C(200, 60, 5, "#fff6b5", 2) + C(220, 58, 5, "#fff6b5", 2);
    } else {
      g += L("M200 22 V34", OL, 3) + P("M184 42 Q200 30 216 42 Z", "#e2d37a", 2.5) + C(200, 45, 4, "#fff8c0", 2);
    }

    // дверь
    g += P("M362 58 L398 52 L398 206 L362 196 Z", "#a35f34") + P("M368 70 L392 66 L392 120 L368 122 Z", "#b9733f", 2) + P("M368 134 L392 132 L392 190 L368 186 Z", "#b9733f", 2) + C(372, 132, 3.5, "#e6b64f", 2);

    // картина / плакат
    if (S.home >= 2) g += R(296, 60, 46, 58, "#2a2a2a", 2, 3) + `<rect x="301" y="65" width="36" height="48" fill="${S.home >= 5 ? "#c9a14a" : "#d8c9a6"}"/>` +
      (S.home >= 5 ? `<path d="M309 105 L319 78 L329 105 Z" fill="#7a1f2a"/>` : `<path d="M306 108 L314 88 L322 98 L328 82 L334 108 Z" fill="#5a7a5a"/>`);
    // кровать
    g += P("M276 168 h82 v40 h-82 Z", "#b9b4a4") + P("M282 176 h78 v28 h-78 Z", "#2a7ba0") + P("M344 166 Q356 162 360 172 L360 186 L340 186 Z", "#f3f0e6", 2.5);
    g += L("M286 210 v10 M354 210 v10", OL, 4);

    // мебель
    if (has("fridge")) g += P("M44 92 h44 v104 h-44 Z", "#e8eef0") + L("M44 128 h44", OL, 3) + L("M80 104 v14 M80 140 v20", "#888", 3);
    if (has("bag")) g += L("M110 22 V70", "#555", 3) + P("M98 70 h24 l2 58 q-14 8 -28 0 Z", "#b8392b") + L("M98 84 h24 M98 114 h24", "#7a2018", 3);
    if (has("weights")) {
      g += P("M30 236 L36 160 h8 L48 236 Z", "#5a4a40") + P("M86 236 L90 160 h8 L104 236 Z", "#5a4a40") + P("M34 200 h66 v12 h-66 Z", "#b8392b");
      g += L("M22 166 H112", "#888", 5) + R(14, 148, 14, 36, "#1d1d1d", 3) + R(106, 148, 14, 36, "#1d1d1d", 3) + R(4, 152, 10, 28, "#2b2b2b", 3) + R(116, 152, 10, 28, "#2b2b2b", 3);
    }
    if (has("tv")) g += P("M228 186 h36 v26 h-36 Z", "#6a4a2a") + R(222, 150, 48, 36, "#1d1d1d", 4) + `<rect x="227" y="155" width="38" height="26" fill="#5ab0d0" opacity=".8"/>` + L("M236 150 L228 136 M256 150 L262 134", OL, 2);
    if (has("sofa")) g += P("M4 240 h96 v40 h-96 Z", "#7a3a8a") + P("M10 222 h84 v24 h-84 Z", "#8a4a9a") + P("M0 236 h14 v44 h-14 Z", "#6a2a7a") + P("M92 236 h14 v44 h-14 Z", "#6a2a7a");
    if (has("safe")) g += R(316, 222, 40, 40, "#4a5058", 4) + C(336, 242, 8, "#b0b6bc", 2.5) + L("M336 236 V242 H341", OL, 2);

    // стол с костями (передний план)
    g += P("M300 268 L400 252 L400 300 L286 300 Z", "#f3efe2") + P("M332 276 l8 -3 l3 7 l-8 3 Z", "#fff", 2) + P("M346 270 l8 -2 l2 8 l-8 2 Z", "#fff", 2) + `<circle cx="337" cy="279" r="1.3" fill="${OL}"/><circle cx="350" cy="274" r="1.3" fill="${OL}"/><circle cx="352" cy="276" r="1.3" fill="${OL}"/>`;

    // герой
    g += `<ellipse cx="200" cy="286" rx="44" ry="8" fill="#0004"/>`;
    g += `<g transform="translate(138 106) scale(0.62)">${thug(heroLook(S))}</g>`;
    return svg("0 0 400 300", g, "roomsvg");
  }

  // ---------- Баннер «Розыск» ----------
  function wanted(S, stars) {
    let g = `<rect width="400" height="120" fill="#e9e2cc"/><rect y="78" width="400" height="42" fill="#2f5a3a"/><path d="M0 78 H400" stroke="${OL}" stroke-width="3"/>`;
    g += `<ellipse cx="300" cy="40" rx="30" ry="10" fill="#c9bb98" opacity=".6"/><ellipse cx="70" cy="30" rx="24" ry="7" fill="#c9bb98" opacity=".6"/>`;
    const cop = (x, flip, look) => `<g transform="translate(${x} 0) ${flip ? "translate(110 0) scale(-1 1)" : ""}"><g transform="scale(0.55) translate(0 -10)">${thug(look)}</g></g>`;
    g += cop(-6, false, { skin: "#f2c8a0", hair: "#2b2118", hairType: "buzz", hat: "police", outfit: "#3d5a8a", stripes: false, uniform: true, mood: "angry", weapon: "rifle", beard: "none" });
    g += cop(296, true, { skin: "#e9b48a", hair: "#2b2118", hat: "police", outfit: "#4a5a48", stripes: false, uniform: true, mood: "angry", beard: "mustache", big: true });
    // плакат
    g += `<g transform="rotate(-2 200 60)">` + R(146, 6, 108, 108, "#e4d3a2", 2, 3) + `<text x="200" y="28" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="19" fill="#3a2a14">РОЗЫСК</text>`;
    g += R(164, 33, 72, 58, "#c9b07a", 2, 2) + inset(165, 34, 70, 56, Object.assign(heroLook(S), { weapon: null })) + R(164, 33, 72, 58, "none", 2, 2.5);
    g += `<text x="200" y="108" text-anchor="middle" font-size="14" fill="#b0281c">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</text></g>`;
    return svg("0 0 400 120", g, "wantedsvg");
  }

  // ---------- Плитки разделов ----------
  function burst(c1 = "#f6dfa6", c2 = "#e5bd72") {
    let g = `<rect width="100" height="80" fill="${c1}"/>`;
    for (let i = 0; i < 18; i += 2) {
      const a1 = i * Math.PI / 9, a2 = (i + 1) * Math.PI / 9;
      g += `<path d="M50 50 L${50 + 120 * Math.cos(a1)} ${50 + 120 * Math.sin(a1)} L${50 + 120 * Math.cos(a2)} ${50 + 120 * Math.sin(a2)} Z" fill="${c2}"/>`;
    }
    return g + `<rect width="100" height="80" fill="url(#vign)"/>`;
  }
  const VIGN = `<defs><radialGradient id="vign" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a4a1a" stop-opacity=".35"/></radialGradient></defs>`;
  const T = (body, sw = 2.2) => body.replace(/stroke-width="3"/g, `stroke-width="${sw}"`);

  const TILES = {
    points: () => T(P("M22 40 h56 v34 h-56 Z", "#e8e0c8") + P("M18 28 h64 l-4 14 h-56 Z", "#c03030") +
      [26, 42, 58].map(x => `<path d="M${x} 28 h8 l-1 14 h-8 Z" fill="#fff"/>`).join("") + P("M18 28 h64 l-4 14 h-56 Z", "none") +
      R(28, 46, 26, 18, "#9ad0e0", 1) + R(60, 46, 12, 28, "#7a4a22", 1) + R(38, 16, 24, 12, "#2a6a3a", 2) +
      `<text x="50" y="26" text-anchor="middle" font-size="9" font-weight="bold" fill="#fff" font-family="Arial">24</text>` + R(30, 52, 8, 8, "#e6b64f", 1)),
    realty: () => T(P("M30 12 h40 v64 h-40 Z", "#b8c4cc") + P("M70 30 h16 v46 h-16 Z", "#8a98a2") + P("M12 40 h18 v36 h-18 Z", "#c9a27a") +
      [0, 1, 2, 3, 4, 5].map(r => [0, 1, 2].map(c => `<rect x="${35 + c * 11}" y="${18 + r * 9}" width="7" height="5" fill="${(r + c) % 3 ? "#5a7a9a" : "#f2e08a"}"/>`).join("")).join("") +
      R(45, 66, 10, 10, "#5a3a2a", 1) + L("M78 30 V8 H94 M90 8 V18", "#d8a02a", 2.5)),
    districts: () => T(P("M6 76 V40 h14 V28 h12 V76 Z", "#4a5a6a") + P("M34 76 V18 h18 V76 Z", "#3a4a5a") + P("M56 76 V34 h14 V24 h8 V76 Z", "#556676") + P("M80 76 V44 h14 V76 Z", "#4a5a6a") +
      [22, 30, 38, 46, 54].map(y => `<rect x="38" y="${y}" width="4" height="4" fill="#f2e08a"/><rect x="45" y="${y + 4}" width="4" height="4" fill="#f2e08a"/>`).join("") +
      L("M43 18 V4", OL, 2) + P("M43 4 L58 8 L43 12 Z", "#c03030") + L("M0 76 H100", OL, 3)),
    fights: () => T(P("M10 46 Q8 26 26 24 L42 26 Q50 30 48 40 L46 58 Q40 66 28 64 Q12 62 10 46 Z", "#c8302a") + P("M40 46 h10 v12 h-12 Z", "#e8e0d0") +
      P("M90 46 Q92 26 74 24 L58 26 Q50 30 52 40 L54 58 Q60 66 72 64 Q88 62 90 46 Z", "#2a5ab0") + P("M60 46 h-10 v12 h12 Z", "#e8e0d0") +
      L("M50 8 V18 M38 12 L44 20 M62 12 L56 20", "#f2c94c", 3) + L("M18 34 Q24 30 30 34", "#fff8", 2) + L("M82 34 Q76 30 70 34", "#fff8", 2)),
    home: () => T(P("M18 40 Q16 18 50 18 Q84 18 82 40 L82 56 H18 Z", "#9a5a2a") + P("M10 42 Q10 34 20 36 L24 66 H12 Z", "#8a4a1a") + P("M90 42 Q90 34 80 36 L76 66 H88 Z", "#8a4a1a") +
      P("M22 50 h56 v18 h-56 Z", "#b06a32") + L("M14 66 v8 M86 66 v8", OL, 3) + L("M34 26 Q50 22 66 26", "#ffffff44", 3) + C(50, 38, 3, "#6a3a12", 1.5)),
    crew: () => inset(2, 22, 44, 58, randomLook(11, { weapon: null, hat: "cap", outfit: "#c06a1a" })) +
      inset(54, 22, 44, 58, randomLook(23, { weapon: null, hat: null, hairType: "buzz", outfit: "#2a8a3a" })) +
      inset(24, 10, 52, 70, randomLook(5, { weapon: null, hat: null, hairType: "bald", outfit: "#8a2a8a", chain: true, mood: "grin" })),
    jobs: () => T(P("M20 34 L50 24 L80 34 L80 70 L50 78 L20 70 Z", "#c99a5a") + P("M20 34 L50 44 L80 34", "none") + P("M50 44 V78", "none") +
      P("M34 29 L64 39 L64 48 L58 46 L58 37 L28 31 Z", "#e6d29a", 2) + L("M28 52 L42 56 M28 58 L38 61", "#7a5a2a", 2) +
      `<text x="66" y="62" font-size="11" font-weight="bold" fill="#7a3a1a" font-family="Arial" transform="rotate(-12 66 62)">$</text>` + L("M4 40 H14 M2 50 H12 M6 60 H14", "#7a4a1a", 2.5)),
    raids: () => T([[14, 20], [30, 28], [46, 36], [62, 44]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" transform="rotate(${i % 2 ? 60 : 25} ${x} ${y})" fill="none" stroke="${OL}" stroke-width="6"/><ellipse cx="${x}" cy="${y}" rx="11" ry="6" transform="rotate(${i % 2 ? 60 : 25} ${x} ${y})" fill="none" stroke="#b8c0c8" stroke-width="3"/>`).join("") +
      P("M60 46 h28 v26 h-28 Z", "#d9a02a") + P("M66 46 v-8 q8 -12 16 0 v8", "none") + C(74, 58, 3.5, OL, 1) + L("M74 60 v6", OL, 3)),
    casino: () => T(P("M20 24 h56 v52 h-56 Z", "#c8c8c8") + P("M22 10 h52 l2 14 h-56 Z", "#c03030") + `<text x="48" y="21" text-anchor="middle" font-size="8" font-weight="bold" fill="#f2c94c" font-family="Arial">JACKPOT</text>` +
      R(26, 30, 44, 20, "#fff", 2) + [32, 44, 56].map(x => `<text x="${x + 4}" y="46" text-anchor="middle" font-size="14" font-weight="bold" fill="#c03030" font-family="Arial">7</text>`).join("") +
      R(28, 56, 40, 14, "#e6b64f", 2) + L("M80 34 V18", OL, 3) + C(80, 16, 5, "#c03030") + L("M76 50 H80 V34", OL, 3) + `<path d="M34 62 h28" stroke="#7a5a10" stroke-width="2"/>`),
    contacts: () => T(P("M32 20 h36 v58 h-36 Z", "#4a5a6a", 3) + L("M60 20 V6", OL, 3) + R(37, 26, 26, 18, "#9ad0a0", 2) +
      `<text x="50" y="38" text-anchor="middle" font-size="7" font-weight="bold" fill="#2a4a2a" font-family="Arial">ТЁРКИ</text>` +
      [0, 1, 2].map(r => [0, 1, 2].map(c => R(38 + c * 9, 50 + r * 8, 6, 5, "#d8d8d8", 1, 1)).join("")).join("") + P("M26 30 h50 v8 h-50 Z", "#2a5ab0", 2)),
    bank: () => T(P("M26 26 h48 v6 q6 4 6 14 v24 q0 8 -10 8 h-40 q-10 0 -10 -8 v-24 q0 -10 6 -14 Z", "#cfe6ee88") +
      P("M30 46 h40 v28 h-40 Z", "#7aa86a", 2) + P("M36 40 h30 v14 h-30 Z", "#a8c88a", 2) + C(44, 66, 8, "#e6b64f", 2) +
      `<text x="44" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="#7a5a10" font-family="Arial">E</text>` + C(60, 62, 7, "#e6b64f", 2) +
      R(28, 18, 44, 10, "#9a9a9a", 2) + L("M32 34 Q30 54 34 70", "#ffffff99", 3)),
    shop: () => T(P("M20 14 L50 22 L80 14 L92 76 H8 Z", "#6a5a3a") + P("M50 22 L36 76 H64 Z", "#e8d8b0") +
      L("M44 34 V44 M44 34 h10", "#6a6a6a", 3) + P("M42 52 l6 -4 l2 10 l-6 3 Z", "#3a8a3a", 1.5) + C(56, 60, 4, "#e6b64f", 1.5) + R(48, 64, 10, 6, "#c8c8c8", 1, 1.5) +
      L("M20 14 L14 40 M80 14 L86 40", OL, 3) + `<path d="M50 22 L40 12 L60 12 Z" fill="#5a4a2a" stroke="${OL}" stroke-width="2"/>`)
  };
  function tile(key) { return svg("0 0 100 80", VIGN + burst() + TILES[key](), "tileart"); }

  // ---------- Иконки ресурсов ----------
  const ICONS = {
    energy: svg("0 0 40 40", R(8, 8, 24, 30, "#2a2a2a", 4, 2.5) + R(13, 4, 5, 5, "#888", 1, 2) + R(22, 4, 5, 5, "#888", 1, 2) + P("M22 12 L14 24 h6 l-3 10 l10 -14 h-6 l3 -8 Z", "#f2c94c", 2), "ico"),
    hp: svg("0 0 40 40", P("M20 34 Q4 22 6 13 Q9 4 20 11 Q31 4 34 13 Q36 22 20 34 Z", "#d8302a", 2.5) + L("M12 14 Q14 10 18 12", "#fff9", 2.5), "ico"),
    cash: svg("0 0 40 40", P("M6 14 h28 v18 h-28 Z", "#6a9a5a", 2.5) + P("M8 10 h28 v18 h-28 Z", "#8ab878", 2.5) + C(22, 19, 5, "#cfe6b8", 2) + `<text x="22" y="22.5" text-anchor="middle" font-size="8" font-weight="bold" fill="#3a5a2a" font-family="Arial">$</text>`, "ico"),
    gold: svg("0 0 40 40", C(20, 20, 15, "#e6b64f", 2.5) + C(20, 20, 11, "#f2cf6a", 1.5) + `<text x="20" y="26" text-anchor="middle" font-size="16" font-weight="900" fill="#8a5a10" font-family="Arial Black,Arial">E</text>`, "ico"),
    auth: svg("0 0 40 40", P("M6 30 L4 12 L13 20 L20 6 L27 20 L36 12 L34 30 Z", "#e6b64f", 2.5) + R(6, 30, 28, 5, "#c99a2a", 1, 2) + C(20, 22, 3, "#c03030", 1.5), "ico")
  };

  // ---------- Стартовая сцена ----------
  function startScene() {
    let g = `<defs><linearGradient id="ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b03e36"/><stop offset=".45" stop-color="#e0763a"/><stop offset=".75" stop-color="#f2b14a"/></linearGradient></defs>`;
    g += `<rect width="400" height="340" fill="url(#ss)"/>`;
    g += `<path d="M-20 120 L420 60 L420 80 L-20 150 Z" fill="#ffd27a" opacity=".25"/><path d="M-20 190 L420 120 L420 132 L-20 206 Z" fill="#ffd27a" opacity=".2"/>`;
    g += `<circle cx="300" cy="190" r="46" fill="#ffe08a" opacity=".55"/>`;
    const b = [[0, 150, 40], [36, 120, 50], [82, 170, 36], [114, 100, 46], [156, 140, 40], [192, 90, 54], [242, 130, 44], [282, 110, 48], [326, 160, 34], [356, 125, 50]];
    b.forEach(([x, y, w], i) => {
      g += `<rect x="${x}" y="${y}" width="${w}" height="${340 - y}" fill="${i % 2 ? "#3b3247" : "#2e2838"}"/>`;
      for (let yy = y + 10; yy < 300; yy += 16) for (let xx = x + 6; xx < x + w - 6; xx += 12) if ((xx * yy + i) % 7 < 2) g += `<rect x="${xx}" y="${yy}" width="5" height="7" fill="#f2c96a" opacity=".8"/>`;
    });
    g += `<rect y="300" width="400" height="40" fill="#1e1b26"/>`;
    g += `<g transform="translate(-8 150) scale(0.78)">${thug(randomLook(301, { weapon: "knife", hat: "cap", hatColor: "#4a3a2a", beard: "full", hair: "#2b2118", outfit: "#1f2a1f", mood: "angry", shades: false, chain: false }))}</g>`;
    g += `<g transform="translate(264 150) scale(0.78)">${thug(randomLook(302, { weapon: "bat", hat: "beanie", hatColor: "#5a5a3a", beard: "full", hair: "#7a4a22", outfit: "#3a4a2a", mood: "angry", shades: false }))}</g>`;
    g += `<g transform="translate(105 128) scale(0.95)">${thug({ skin: "#e9b48a", hair: "#2b2118", hairType: "bald", beard: "stubble", outfit: "#1f2a44", stripes: "#f2f2f2", chain: true, weapon: "rifle", mood: "angry", big: true })}</g>`;
    return svg("0 0 400 340", g, "startsvg");
  }

  // ---------- Готовые образы ----------
  const BOSSES = {
    boar:  { skin: "#e0a080", hair: "#4a3020", hairType: "bald", beard: "full", outfit: "#7a2a2a", stripes: "#f2f2f2", big: true, mood: "grin", weapon: "bat" },
    shtyr: { skin: "#d9a074", hair: "#2b2118", hairType: "buzz", beard: "stubble", outfit: "#2b2b2b", stripes: false, chain: true, scar: true, mood: "angry", weapon: "knuckle" },
    baron: { skin: "#f2c8a0", hair: "#1a1a1a", hat: "fedora", hatColor: "#2a2a2a", beard: "mustache", outfit: "#3a2a4a", stripes: false, chain: true, mood: "calm", weapon: "pistol" },
    sedoy: { skin: "#e9b48a", hair: "#bdbdbd", hairType: "slick", beard: "full", outfit: "#1f1f1f", stripes: false, scar: true, mood: "calm", shades: true, weapon: "sniper" }
  };
  const CONTACTS = {
    "Марк": { skin: "#f2c8a0", hair: "#3a2a20", hairType: "slick", beard: "stubble", outfit: "#2a3a5a", stripes: false, mood: "calm" },
    "Лёха-механик": { skin: "#d9a074", hair: "#7a4a22", hat: "cap", hatColor: "#3a5a2a", beard: "full", outfit: "#3a4a6a", stripes: false, mood: "grin" },
    "Капитан Орлов": { skin: "#e9b48a", hair: "#2b2118", hat: "police", beard: "mustache", outfit: "#3d5a8a", stripes: false, uniform: true, mood: "angry" },
    "Незнакомец": { skin: "#c68858", hair: "#1a1a1a", hat: "fedora", hatColor: "#1a1a1a", shades: true, outfit: "#1a1a1a", stripes: false, mood: "calm", beard: "none" }
  };

  return {
    thug, bust, full, randomLook, hasTile: k => !!TILES[k], heroLook, room, wanted, tile, ICONS, startScene,
    boss: id => bust(BOSSES[id], "boss"),
    contact: id => { const n = typeof npcById === "function" && npcById(id); return bust(n ? n.look : (CONTACTS[id] || randomLook(id)), "contact"); },
    npc: n => bust(n.look, "npc"),
    npcFull: n => full(n.look, "npcfull"),
    inset,
    opponent: seed => bust(randomLook(seed), "opp"),
    hero: S => bust(heroLook(S), "hero"),
    crewMember: i => full(randomLook("crew" + i, { weapon: pick(rng(i), ["bat", "knife", "knuckle", null]) }), "crewm")
  };
})();
