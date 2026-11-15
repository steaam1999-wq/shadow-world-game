// EMPIRE CITY — оформление «изумруд и золото» (ар-деко, нуар)
// Подключается последним: переопределяет шапку, заголовки, город, профиль, семьи и навигацию.
"use strict";

// ---------- картинки с запасным SVG ----------
function pic(key, fallback, cls = "") {
  const a = ASSETS[key];
  if (!a) return fallback;
  if (typeof a === "string") return `<img class="pic ${cls}" src="${a}" alt="" decoding="async">`;
  const x = a.cols > 1 ? (a.i % a.cols) * 100 / (a.cols - 1) : 0, y = a.rows > 1 ? Math.floor(a.i / a.cols) * 100 / (a.rows - 1) : 0;
  return `<span class="pic atlas ${cls}" role="img" style="background-image:url(${a.src});background-size:${a.cols * 100}% ${a.rows * 100}%;background-position:${x}% ${y}%"></span>`;
}

// ---------- навигация с историей ----------
const HIST = [];
function go(s) {
  if (screen !== s && screen !== "start") { HIST.push(screen); if (HIST.length > 40) HIST.shift(); }
  screen = s; closeMenu(); render(); window.scrollTo(0, 0);
}
function goBack() { screen = HIST.pop() || "hub"; render(); window.scrollTo(0, 0); }

// ---------- линейные иконки шапки ----------
const T = {
  heart: `<svg viewBox="0 0 24 24" class="ti"><path d="M12 21 C4 14 2 11 2 7.5 A4.5 4.5 0 0 1 12 5 A4.5 4.5 0 0 1 22 7.5 C22 11 20 14 12 21Z" fill="#d23a3a"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" class="ti"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#e2b85a"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" class="ti"><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M15 12h6v4h-6z" fill="none" stroke="#e2c98a" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24" class="ti"><path d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.6 9 9z" fill="#e2b85a"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" class="ti"><path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5z" fill="none" stroke="#cfc6aa" stroke-width="1.8"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" class="ti"><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" fill="none" stroke="#e2c98a" stroke-width="1.8"/><circle cx="12" cy="9" r="2.5" fill="#e2c98a"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" class="ti"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="#9aa08a" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#9aa08a" stroke-width="1.8"/></svg>`
};

// ---------- медальоны (вектор, золото на изумруде) ----------
const MG = (body, bg1 = "#2c4a37", bg2 = "#0f1c15") => `<svg viewBox="0 0 64 64" class="art med"><defs><radialGradient id="mbg${bg1.slice(1)}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></radialGradient></defs><circle cx="32" cy="32" r="31" fill="url(#mbg${bg1.slice(1)})"/>${body}</svg>`;
const G = "#d9b56a", G2 = "#8a6a2a", INK = "#1a120a";
const gp = (d, f, w = 1.6) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const MED = {
  letter: () => MG(gp("M12 22 h40 v24 h-40 Z", "#efe2c4") + gp("M12 22 L32 36 L52 22", "none") + `<circle cx="32" cy="35" r="6" fill="#9a1f1f" stroke="${INK}" stroke-width="1.4"/><path d="M29 35 h6 M32 32 v6" stroke="#5a0f0f" stroke-width="1.4"/>`),
  menu: () => MG(`<path d="M20 24 h24 M20 32 h24 M20 40 h24" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>`),
  gear: () => MG(`<circle cx="32" cy="32" r="9" fill="none" stroke="${G}" stroke-width="3"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="30" y="14" width="4" height="7" rx="1" fill="${G}" transform="rotate(${i * 45} 32 32)"/>`).join("") + `<circle cx="32" cy="32" r="13" fill="none" stroke="${G}" stroke-width="2.5"/>`),
  watch: () => MG(`<circle cx="32" cy="35" r="15" fill="#efe2c4" stroke="${G}" stroke-width="3"/><path d="M32 35 V25 M32 35 l7 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` + gp("M28 14 h8 v6 h-8 Z", G) + `<path d="M36 17 q10 -4 14 6" stroke="${G}" stroke-width="2" fill="none"/>`),
  map: () => MG(gp("M12 18 L24 14 L38 18 L52 14 V46 L38 50 L24 46 L12 50 Z", "#d8c49a") + `<path d="M24 14 V46 M38 18 V50" stroke="#9a7a4a" stroke-width="1.4"/><path d="M14 30 q8 -6 14 0 t18 -6" stroke="#3a7a9a" stroke-width="2.5" fill="none"/>` +
    `<circle cx="44" cy="42" r="9" fill="#b8903a" stroke="${INK}" stroke-width="1.4"/><path d="M44 35 L46 42 L44 49 L42 42 Z" fill="#efe2c4"/>`),
  city: () => MG(`<path d="M10 52 V36 h6 V28 h6 V52 M24 52 V20 l5 -8 l5 8 V52 M36 52 V26 h8 V52 M46 52 V34 h8 V52" fill="#1a2a22" stroke="${G}" stroke-width="1.6"/>` +
    [[27, 24], [31, 24], [27, 30], [31, 30], [27, 36], [31, 36], [39, 32], [39, 38], [49, 40], [13, 42], [19, 34]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2.4" height="3" fill="#f2c96a"/>`).join("") +
    `<path d="M29 12 V4" stroke="${G}" stroke-width="1.5"/><ellipse cx="32" cy="54" rx="24" ry="3" fill="#f2c96a" opacity=".25"/>`, "#21384a", "#0c141c"),
  families: (org = "harrigan") => crestSvg(org),
  items: () => MG(gp("M12 26 Q12 20 18 20 h28 q6 0 6 6 v18 q0 6 -6 6 h-28 q-6 0 -6 -6 Z", "#7a4424") + gp("M24 20 Q24 12 32 12 Q40 12 40 20", "none", 3) +
    `<path d="M12 32 h40" stroke="#4a2814" stroke-width="2"/>` + gp("M28 30 h8 v6 h-8 Z", G, 1.4) + `<path d="M18 22 v26 M46 22 v26" stroke="#5a3218" stroke-width="1.5"/>`, "#3a2a1a", "#120c08"),
  rest: () => MED.watch(),
  story: () => MED.letter()
};
// рисованные медальоны вместо векторных, если они есть в ASSETS
{
  const v = Object.assign({}, MED);
  MED.letter = () => pic("icon.letter", v.letter());
  MED.watch = () => pic("icon.watch", v.watch());
  MED.map = () => pic("nav.map", v.map());
  MED.city = () => pic("nav.city", v.city());
  MED.items = () => pic("nav.items", v.items());
}
// медальон-иконка раздела из прежних плиток
const medTile = key => ART.tile(key);

// герб организации
function crestSvg(org) {
  const o = ORGS[org] || ORGS.city;
  const col = { harrigan: "#1f5a3a", moreno: "#7a3a1a", bellini: "#2a4a6a", police: "#2a3a6a", city: "#4a3a2a" }[org] || "#2a4a3a";
  return `<svg viewBox="0 0 64 64" class="art med"><circle cx="32" cy="32" r="31" fill="#1a140c"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="${13 + i * 0.5}" cy="${46 - i * 5}" rx="2.6" ry="5" fill="#6a8a3a" stroke="${INK}" stroke-width=".8" transform="rotate(${-40 + i * 8} ${13 + i * .5} ${46 - i * 5})"/><ellipse cx="${51 - i * 0.5}" cy="${46 - i * 5}" rx="2.6" ry="5" fill="#6a8a3a" stroke="${INK}" stroke-width=".8" transform="rotate(${40 - i * 8} ${51 - i * .5} ${46 - i * 5})"/>`).join("")}
    ${gp("M20 18 h24 v14 Q44 46 32 52 Q20 46 20 32 Z", col, 1.8)}
    <path d="M20 18 h24 v14 Q44 46 32 52 Q20 46 20 32 Z" fill="none" stroke="${G}" stroke-width="2"/>
    ${gp("M24 14 l3 -6 l5 4 l5 -4 l3 6 Z", G, 1.2)}
    <text x="32" y="40" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="17" fill="${G}">${o.mark}</text></svg>`;
}

// ---------- сцены ----------
function nightStreet(withHero) {
  let g = `<defs>
    <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1814"/><stop offset=".6" stop-color="#1c2e24"/><stop offset="1" stop-color="#2a2a1c"/></linearGradient>
    <linearGradient id="ns-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a22"/><stop offset="1" stop-color="#121410"/></linearGradient>
    <radialGradient id="ns-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd890" stop-opacity=".9"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>
    <radialGradient id="ns-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4ad8a0" stop-opacity=".5"/><stop offset="1" stop-color="#4ad8a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="ns-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ab0a0" stop-opacity="0"/><stop offset="1" stop-color="#9ab0a0" stop-opacity=".18"/></linearGradient></defs>
    <rect width="360" height="480" fill="url(#ns-sky)"/>`;
  // дальние дома
  g += `<path d="M0 250 V120 h40 V90 h30 V140 h30 V60 h26 V250 Z" fill="#14201a"/><path d="M230 250 V80 h40 V40 h30 V100 h60 V250 Z" fill="#111c17"/>`;
  for (let i = 0; i < 26; i++) { const x = (i * 53) % 340 + 8, y = 80 + (i * 37) % 150; g += `<rect x="${x}" y="${y}" width="5" height="7" fill="#e8b860" opacity="${0.3 + (i % 3) * 0.2}"/>`; }
  // кирпичная стена слева с фонарём и пожарной лестницей
  g += `<path d="M0 60 L70 90 L70 330 L0 360 Z" fill="#3a2418"/>`;
  for (let y = 100; y < 340; y += 10) g += `<path d="M0 ${y} L70 ${y + 8}" stroke="#2a180e" stroke-width="1"/>`;
  g += `<path d="M30 120 v120 M56 126 v110" stroke="#1a1a1a" stroke-width="2"/>` + [140, 170, 200, 230].map(y => `<path d="M30 ${y} L56 ${y + 4}" stroke="#1a1a1a" stroke-width="2"/>`).join("");
  g += `<path d="M78 380 V140 q0 -10 10 -14 h10" stroke="#1a1612" stroke-width="5" fill="none"/><path d="M92 120 h20 l-4 18 h-12 Z" fill="#2a2016" stroke="#0a0806" stroke-width="2"/><circle cx="102" cy="132" r="60" fill="url(#ns-lamp)"/><circle cx="102" cy="131" r="6" fill="#ffe2a0"/>`;
  // фасад отеля справа с изумрудным козырьком
  g += `<path d="M230 120 L360 100 V360 L230 340 Z" fill="#2a2018"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g += `<rect x="${244 + c * 38}" y="${130 + r * 46 - c * 4}" width="22" height="32" rx="10" fill="#f0c070" opacity=".85" stroke="#4a3418" stroke-width="2"/>`;
  g += `<path d="M228 300 L360 282 L360 300 L228 320 Z" fill="#1f6a4a" stroke="#4ad8a0" stroke-width="2"/><ellipse cx="300" cy="300" rx="80" ry="30" fill="url(#ns-glow)"/>`;
  g += `<path d="M262 340 h70 v-30 q-35 -24 -70 0 Z" fill="#f0c070" opacity=".9"/><path d="M250 360 h96 v8 h-96 Z M256 352 h84 v8 h-84 Z" fill="#7a1f1f"/>`;
  // мостовая и отражения
  g += `<path d="M0 360 L360 340 V480 H0 Z" fill="url(#ns-road)"/>`;
  for (let y = 370; y < 480; y += 14) g += `<path d="M0 ${y} Q180 ${y - 8} 360 ${y - 4}" stroke="#3a3a2a" stroke-width="1" fill="none"/>`;
  g += `<ellipse cx="102" cy="420" rx="22" ry="60" fill="#ffd890" opacity=".15"/><ellipse cx="300" cy="410" rx="40" ry="50" fill="#f0c070" opacity=".12"/><ellipse cx="300" cy="380" rx="60" ry="14" fill="#4ad8a0" opacity=".12"/>`;
  // ретро-автомобиль
  g += `<path d="M120 352 q4 -18 22 -20 h30 q12 0 18 14 l14 2 q6 2 6 8 v8 h-96 v-6 q0 -6 6 -6 Z" fill="#141a16" stroke="#3a4a3a" stroke-width="1.5"/><circle cx="140" cy="364" r="7" fill="#0a0a0a"/><circle cx="196" cy="364" r="7" fill="#0a0a0a"/><rect x="146" y="336" width="18" height="10" fill="#e8b860" opacity=".35"/>`;
  g += `<rect y="300" width="360" height="180" fill="url(#ns-fog)"/>`;
  if (withHero) g += `<ellipse cx="180" cy="452" rx="58" ry="10" fill="#000" opacity=".5"/><g transform="translate(106 186) scale(0.86)">${ART.thug(Object.assign(ART.heroLook(S), {}))}</g>`;
  return `<svg class="art" viewBox="0 0 360 480" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
}

const LOC = {
  west:  { title: "West Side",       owner: "Банда Рыжего",      text: "Спальные кварталы, гаражи и кафе, где все друг друга знают.", sky: ["#2a3a4a", "#c07a4a"], tone: "#2a2018" },
  prom:  { title: "Промзона",        owner: "Бригада Штыря",     text: "Склады, трубы и тишина, за которую хорошо платят.",            sky: ["#2a2a2a", "#8a5a3a"], tone: "#1f1f1c" },
  old:   { title: "Старый город",    owner: "Люди Седого",       text: "Кирпич, брусчатка и долги, которым больше лет, чем тебе.",       sky: ["#2a2438", "#b06a4a"], tone: "#2a1a14" },
  port:  { title: "Порт",            owner: "Портовые",          text: "Краны, контейнеры и корабли, которые не значатся в журналах.",    sky: ["#1a2a3a", "#4a7a9a"], tone: "#141c22" },
  kings: { title: "Kings District",  owner: "Семья Харриган",    text: "Тихие улицы, на которых слово семьи — закон.",                   sky: ["#3a2a1a", "#d8a050"], tone: "#2a1a10" },
  city:  { title: "City Center",     owner: "Совет Пятерых",     text: "Стекло, неон и деньги, которые никогда не спят.",                 sky: ["#101a2a", "#3a5a8a"], tone: "#0c1218" }
};
const HOME_LOC = ["west", "west", "old", "prom", "city", "kings"];
const curLoc = () => S._loc && LOC[S._loc] ? S._loc : HOME_LOC[S.home] || "west";

function districtBanner(id) {
  const L = LOC[id], gid = "sky" + id;
  let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.sky[0]}"/><stop offset="1" stop-color="${L.sky[1]}"/></linearGradient>
    <linearGradient id="bshade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient></defs>
    <rect width="400" height="220" fill="url(#${gid})"/>`;
  const rnd2 = rng2(id);
  // дальний город
  let x = 0; while (x < 400) { const w = 20 + rnd2() * 30, h = 40 + rnd2() * (id === "city" ? 120 : 60); g += `<rect x="${x}" y="${150 - h}" width="${w}" height="${h + 70}" fill="${L.tone}" opacity=".7"/>`; x += w + 2; }
  // главный объект района
  const main = {
    kings: `<path d="M110 160 V90 h180 V160 Z" fill="#7a3a28" stroke="#2a140c" stroke-width="2"/><path d="M100 92 L200 52 L300 92 Z" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="2"/>` +
      Array.from({ length: 12 }, (_, i) => `<rect x="${122 + (i % 6) * 28}" y="${100 + Math.floor(i / 6) * 30}" width="12" height="20" rx="6" fill="#f0c070"/>`).join("") + `<rect x="190" y="130" width="20" height="30" rx="10" fill="#f0c070"/>`,
    city: Array.from({ length: 5 }, (_, i) => { const bx = 70 + i * 56, h = 90 + (i % 2) * 50; return `<rect x="${bx}" y="${160 - h}" width="40" height="${h}" fill="#1a2a3a" stroke="#4a7aaa" stroke-width="1.5"/>` + Array.from({ length: Math.floor(h / 14) }, (_, r) => `<rect x="${bx + 6}" y="${166 - h + r * 14}" width="28" height="4" fill="#8ad0ff" opacity="${.3 + (r % 3) * .2}"/>`).join(""); }).join(""),
    old: Array.from({ length: 4 }, (_, i) => `<path d="M${60 + i * 76} 160 V${100 - i % 2 * 12} l34 -26 l34 26 V160 Z" fill="#8a4a32" stroke="#2a140c" stroke-width="2"/><rect x="${76 + i * 76}" y="${112 - i % 2 * 12}" width="10" height="14" fill="#f0c070"/><rect x="${98 + i * 76}" y="${112 - i % 2 * 12}" width="10" height="14" fill="#f0c070"/>`).join(""),
    port: `<path d="M40 160 h320 v-8 h-320 Z" fill="#2a3a4a"/>` + [[60, "#a03030"], [110, "#2a6ab0"], [160, "#d0a030"], [80, "#2a8a5a"]].map(([cx, c], i) => `<rect x="${cx + (i > 2 ? 0 : 0)}" y="${i > 2 ? 112 : 132}" width="48" height="20" fill="${c}" stroke="#111" stroke-width="1.5"/>`).join("") +
      `<path d="M260 160 V50 M260 56 H200 M206 56 V90" stroke="#d8a040" stroke-width="5"/><path d="M300 160 V70 M300 76 H350" stroke="#d8a040" stroke-width="4"/>`,
    west: Array.from({ length: 5 }, (_, i) => `<path d="M${40 + i * 66} 160 V${118 - i % 2 * 8} l26 -20 l26 20 V160 Z" fill="${["#8a7a5a", "#7a8a6a", "#9a8a6a"][i % 3]}" stroke="#2a2018" stroke-width="2"/><rect x="${56 + i * 66}" y="${128 - i % 2 * 8}" width="18" height="12" fill="#f0c070"/>`).join(""),
    prom: `<path d="M60 160 V100 l30 -16 v16 l30 -16 v16 l30 -16 V160 Z" fill="#4a4a44" stroke="#1a1a1a" stroke-width="2"/><rect x="220" y="90" width="120" height="70" fill="#3a3a36" stroke="#1a1a1a" stroke-width="2"/>` +
      `<path d="M250 90 V30 h12 V90 M290 90 V44 h12 V90" fill="#5a5a54" stroke="#1a1a1a" stroke-width="2"/><path d="M256 26 q-12 -16 6 -26 M296 40 q-10 -14 6 -24" stroke="#aaa" stroke-width="8" fill="none" opacity=".4" stroke-linecap="round"/>` + [80, 110, 240, 270, 300].map(xx => `<rect x="${xx}" y="120" width="12" height="10" fill="#f0c070" opacity=".8"/>`).join("")
  }[id];
  g += main;
  // фонари, дорога
  g += `<path d="M0 160 H400 V220 H0 Z" fill="#141410"/>` + [40, 360].map(lx => `<path d="M${lx} 200 V120" stroke="#1a1612" stroke-width="4"/><circle cx="${lx}" cy="118" r="7" fill="#ffe0a0"/><circle cx="${lx}" cy="118" r="40" fill="#ffd890" opacity=".18"/>`).join("");
  g += `<path d="M90 196 q4 -16 20 -18 h28 q10 0 16 12 l12 2 q5 2 5 7 v7 h-86 v-5 q0 -5 5 -5 Z" fill="#162018" stroke="#3a4a3a" stroke-width="1.5"/><circle cx="108" cy="206" r="6" fill="#050505"/><circle cx="158" cy="206" r="6" fill="#050505"/>`;
  g += `<rect width="400" height="220" fill="url(#bshade)"/>`;
  return `<svg class="art" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
}

// ---------- шапка ----------
function topbar() {
  const enT = S.energy < maxEn() ? `<i id="tbT">${mmss(ENERGY_REGEN_SEC - S.enAcc)}</i>` : "";
  const pct = Math.min(100, Math.floor(S.xp / xpNeed(S.level) * 100));
  const story = DATA.story[S.story], storyReady = story && story.check(S);
  const best = NPCS.filter(n => isFriend(n.id)).sort((a, b) => relOf(b.id) - relOf(a.id))[0];
  const side = best && best.org !== "city" ? ORGS[best.org].short : "Независимый";
  return `<header class="hdr">
    <div class="hdr1">
      <button class="hres" onclick="A.heal()">${T.heart}<b>${S.hp}</b></button>
      <button class="hres" onclick="A.refill()">${T.bolt}<b id="tbEn">${S.energy}</b>${enT}</button>
      <span class="hsp"></span>
      <span class="hres">${T.wallet}<b>$${short(S.cash)}</b></span>
      <span class="hres">${T.star}<b>${S.gold}</b></span>
      <button class="medal sm" onclick="go('help')">${pic("icon.gear", MED.gear())}</button>
    </div>
    <div class="hdr2">
      <button class="medal" onclick="openMenu()">${pic("icon.menu", MED.menu())}</button>
      <div class="hname">${esc(S.name)} <span>· ${S.level} ур.</span></div>
      <button class="medal" onclick="go('contacts')">${storyReady || meetableCount() ? `<span class="badge">!</span>` : ""}${pic("icon.letter", MED.letter())}</button>
    </div>
    <div class="hdr3"><span>${T.shield} ${side} · ${rankOf().name}</span><span>Опыт ${T.star} <b>${fmt(S.xp)}</b> / ${fmt(xpNeed(S.level))}</span><i style="width:${pct}%"></i></div>
  </header>`;
}
function head(title, icon, sub) {
  return topbar() + `<div class="titlebar"><button onclick="goBack()" aria-label="Назад">‹</button><h2>${title}</h2><i>•</i></div>${sub ? `<p class="lead">${sub}</p>` : ""}`;
}
const row = (icon, title, sub, onclick, badge) => `<button class="lrow" onclick="${onclick}"><span class="lmed">${icon}</span><span class="ltxt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</span>${badge ? `<span class="badge static">${badge}</span>` : ""}<span class="chev">›</span></button>`;

// ---------- меню ☰ ----------
function openMenu() {
  const sb = sysBadges();
  modal(`<h3 class="mtitle">Меню</h3><div class="menulist">
    ${row(MED.letter(), "Сюжет «Цена власти»", "Связи и задания", "go('contacts')")}
    ${row(ICON2.people(), "Люди города", "Семьи, полиция, знакомые", "go('people')", meetableCount())}
    ${row(ICON2.rank(), "Ранги", rankOf().name, "go('ranks')", sb.rankUp)}
    ${row(ICON2.ach(), "Достижения", "Рейтинг " + S.rating, "go('achievements')", sb.ach)}
    ${row(ICON2.talent(), "Таланты", "Свободно очков: " + talentFree(), "go('talents')", sb.tal)}
    ${row(ICON2.notes(), "Заметки", "", "go('notes')")}
    ${row(MED.watch(), "Сводки", "Что было в городе", "go('log')")}
    ${row(MED.gear(), "Помощь", "", "go('help')")}
    ${row(MED.city(), "Главный экран", "", "go('start')")}
    ${row(MED.menu(), "Сбросить прогресс", "", "closeModal();A.reset()")}
  </div>`);
}
function closeMenu() { const m = document.querySelector("#modal.show .menulist"); if (m) closeModal(); }

// ---------- нижняя навигация ----------
function navbar() {
  const sb = sysBadges();
  const items = [
    ["map", "Карта", pic("nav.map", MED.map()), badges().districts],
    ["hub", "Город", pic("nav.city", MED.city()), ""],
    ["profile", "Профиль", pic("nav.profile", ART.hero(S)), sb.profile],
    ["people", "Семьи", pic("nav.families", crestSvg("harrigan")), meetableCount()],
    ["bag", "Вещи", pic("nav.items", MED.items()), PROFS.reduce((a, p) => a + (S.bag[p.item] || 0), 0) || ""]
  ];
  const map = { map: "map", districts: "map", hub: "hub", profile: "profile", people: "people", npc: "people", bag: "bag" };
  const cur = map[screen];
  return `<nav class="navbar">${items.map(([id, t, ic, bd]) => `<button class="nav${cur === id ? " on" : ""}" onclick="go('${id}')">
    ${bd ? `<span class="badge">${bd}</span>` : ""}<span class="navicon${id === "profile" ? " hero" : ""}">${ic}</span>${id === "profile" ? `<span class="navlv">${S.level} ур.</span>` : ""}<span class="navt">${t}</span></button>`).join("")}</nav>`;
}

// ---------- экраны ----------
const THEME_SCREENS = {
  hub() {
    const id = curLoc(), L = LOC[id], d = DATA.districts.find(x => x.id === id);
    const mine = S.districts[id], b = badges(), sb = sysBadges();
    const q = DATA.story[S.story];
    const bonus = S.lastBonus !== today();
    const healP = Math.max(100, Math.round((maxHp() - S.hp) * 3 * (1 + S.level / 10) * (1 - perk("healPct") / 100)));
    return head("Город") + `
      <div class="banner">${pic("loc." + id, districtBanner(id))}<div class="bcap"><h3>${L.title}</h3><small>${mine ? "Под твоим контролем" : L.owner}</small></div></div>
      <p class="lead">${L.text}</p>
      ${q ? row(MED.letter(), "Сюжетное поручение", q.check(S) ? "Готово — забери награду" : q.title, "go('contacts')", q.check(S) ? "!" : "") : row(MED.letter(), "Глава I завершена", "Посмотреть итоги", "go('contacts')")}
      ${bonus ? row(ICON2.gift(), "Подарок дня", "$" + fmt(300 * S.level) + " + 💎 + полная энергия", "A.bonus()", "!") : ""}
      ${row(MED.watch(), "Подлечиться", S.hp >= maxHp() ? "Здоровье полное" : "Восстановить здоровье · $" + fmt(healP), "A.heal()")}
      ${row(MED.map(), "Перейти в другой район", "Карта города", "go('map')", b.districts)}
      <div class="sectitle">События</div>${eventsStrip()}
      <div class="sectitle">Дела</div>
      ${row(medTile("jobs"), "Движухи", "Работа за энергию", "go('jobs')")}
      ${row(medTile("fights"), "Бои", "Наехать на соперника", "go('fights')")}
      ${row(medTile("raids"), "Рейды", "Боссы города", "go('raids')")}
      ${row(medTile("districts"), "Районы", "Захват территорий", "go('districts')", b.districts)}
      <div class="sectitle">Хозяйство</div>
      ${row(medTile("points"), "Точки", S.pending >= 1 ? "Собрать $" + fmt(S.pending) : "Бизнес и доход", "go('points')", b.points)}
      ${row(medTile("realty"), "Недвижимость", DATA.homes[S.home].name, "go('realty')")}
      ${row(medTile("home"), "Хата", "Обстановка и тренировки", "go('home')")}
      ${row(medTile("crew"), "Бригада", S.crew + " бойцов", "go('crew')")}
      <div class="sectitle">Город</div>
      ${row(medTile("shop"), "Барыга", "Оружие, броня, аксессуары", "go('shop')")}
      ${row(medTile("bank"), "Банк", "Сейф: $" + fmt(S.safe), "go('bank')")}
      ${row(medTile("casino"), "Казино", S.lastSpin !== today() ? "Колесо удачи ждёт" : "Слоты", "go('casino')", b.casino)}
      ${row(medTile("contacts"), "Связи", "Сюжет и знакомства", "go('contacts')", b.contacts)}`;
  },

  profile() {
    const g = sl => S.gear[sl] ? item(S.gear[sl]) : null;
    const slot = (content, onclick, locked) => `<button class="slot${locked ? " empty" : ""}" onclick="${onclick}">${content}${locked ? `<span class="slock">${T.lock}</span>` : ""}</button>`;
    const gearSlot = (sl, fb) => g(sl) ? slot(`<span class="semoji">${g(sl).icon}</span>`, "go('bag')") : slot(fb, "go('shop')", true);
    const d = activeDog();
    const q = DATA.story[S.story];
    const wanted = Math.max(0, Math.min(5, Math.floor(S.rep.street / 25)) + perk("wanted"));
    const pt = st => S.points > 0 ? `<button class="mini" onclick="A.point('${st}')">+</button>` : "";
    const L = LOC[curLoc()];
    return topbar() + `
      <div class="herocard">
        <div class="herobg">${ASSETS["bg.profile"] ? pic("bg.profile", "") : nightStreet(true)}</div>
        <div class="slots left">
          ${gearSlot("weapon", `<span class="semoji dim">🔫</span>`)}
          ${gearSlot("armor", `<span class="semoji dim">🧥</span>`)}
          ${gearSlot("extra", `<span class="semoji dim">⌚</span>`)}
          ${d ? slot(sv("0 0 64 64", dogHead(breed(d.breed))), "go('dogs')") : slot(`<span class="semoji dim">🐕</span>`, "go('dogs')", true)}
        </div>
        <div class="slots right">
          ${slot(MED.letter(), "go('contacts')")}
          ${slot(ICON2.item("kit"), "go('bag')", !S.bag.kit)}
          ${slot(MED.watch(), "go('ranks')")}
          ${slot(ICON2.ach(), "go('achievements')")}
        </div>
        <button class="locpill" onclick="go('map')">${T.pin} ${L.title} ›</button>
        ${wanted ? `<span class="wantedpill">Розыск ${"★".repeat(wanted)}</span>` : ""}
      </div>
      ${q ? row(MED.letter(), "Глава I · " + q.title, q.check(S) ? "Готово — забери награду" : q.goal, "go('contacts')", q.check(S) ? "!" : "") : row(MED.letter(), "Глава I завершена", "Посмотреть итоги", "go('contacts')")}
      <details class="fold" open><summary>Характеристики</summary>
        <div class="statlist">
          <div><span>Ранг</span><b>${rankOf().name}</b></div>
          <div><span>Авторитет</span><b>${fmt(authority())}</b></div>
          <div><span>Наличные / сейф</span><b>$${fmt(S.cash)} / $${fmt(S.safe)}</b></div>
          <div><span>В бою</span><b>⚔️ ${atk()} · 🛡️ ${def()} · ❤️ ${maxHp()}</b></div>
          ${S.points > 0 ? `<div class="good"><span>Свободные очки</span><b>${S.points}</b></div>` : ""}
          <div><span>💪 Сила</span><b>${totStr()} ${pt("str")}</b></div>
          <div><span>🛡️ Защита</span><b>${S.stats.def} ${pt("def")}</b></div>
          <div><span>🎯 Ловкость</span><b>${totAgi()} ${pt("agi")}</b></div>
          <div><span>❤️ Выносливость</span><b>${S.stats.end} ${pt("end")}</b></div>
          <div><span>Репутация</span><b>улица ${S.rep.street} · закон ${S.rep.law}</b></div>
          <div><span>Бои</span><b>победы ${S.wins} · поражения ${S.losses}</b></div>
          <div><span>Бригада</span><b>${S.crew} бойцов</b></div>
          <div><span>Районы</span><b>${DATA.districts.filter(x => S.districts[x.id]).map(x => x.name).join(", ") || "—"}</b></div>
        </div></details>
      ${profileExtras()}`;
  },

  people() {
    const f = S._org || "all";
    const tabs = [["all", "Все"]].concat(Object.keys(ORGS).map(k => [k, ORGS[k].short]));
    const kicker = { harrigan: "Семья", moreno: "Семья", bellini: "Семья", police: "Закон", city: "Город" };
    const big = { harrigan: "Харриган", moreno: "Морено", bellini: "Беллини", police: "Полиция", city: "Люди города" };
    return head("Организации", null, "Три семьи и закон. У каждого своя власть.") +
      `<div class="tabs">${tabs.map(([k, t]) => `<button class="${f === k ? "on" : ""}" onclick="setOrg('${k}')">${t}</button>`).join("")}</div>` +
      Object.keys(ORGS).filter(k => f === "all" || f === k).map(k => {
        const o = ORGS[k];
        return `<section class="orgcard"><div class="orghead"><span class="crest">${pic("crest." + k, crestSvg(k))}</span><div><small>${kicker[k]}</small><h3>${big[k]}</h3></div></div>
          <p class="orgtext">${o.text}</p>
          ${NPCS.filter(n => n.org === k).map(n => {
            const met = npcMet(S, n.id), unl = npcUnlocked(n);
            const sub = met ? `${n.title} · <span style="color:${tierOf(relOf(n.id)).color}">${tierOf(relOf(n.id)).name} ${relOf(n.id)}</span>` : unl ? `${n.title} · <span class="good">можно познакомиться</span>` : `${n.title} · 🔒 ${unlockText(n)}`;
            return `<button class="prow${unl ? "" : " locked"}" onclick="openNpc('${n.id}')"><span class="pframe">${pic("npc." + n.id, ART.npc(n))}</span><span class="ltxt"><b>${n.name}</b><small>${sub}</small></span>${unl && !met ? `<span class="badge static">NEW</span>` : ""}<span class="chev">›</span></button>`;
          }).join("")}</section>`;
      }).join("");
  }
};

// портреты и сцены из рисованного арта, если он есть
const _npcArt = ART.npc, _npcFull = ART.npcFull, _contact = ART.contact, _hero = ART.hero, _start = ART.startScene;
ART.npc = n => pic("npc." + n.id, _npcArt(n));
ART.npcFull = n => ASSETS["npc." + n.id] ? pic("npc." + n.id, "", "npcportrait") : _npcFull(n);
ART.contact = id => { const n = npcById(id); return n ? ART.npc(n) : _contact(id); };
ART.hero = st => pic("hero.portrait", _hero(st));
ART.startScene = () => pic("bg.start", _start(), "startpic");

Object.assign(SCREENS, THEME_SCREENS);
document.documentElement.classList.add("theme-emerald");
render();

// ---------- нуар-силуэты для безымянных соперников, боссов и бойцов бригады ----------
function noirFigure(seed, opt = {}) {
  const r = rng2("noir" + seed), pick = a => a[Math.floor(r() * a.length)];
  const hat = opt.hat || pick(["fedora", "cap", "none", "fedora", "flat"]);
  const wide = opt.big ? 1.18 : 0.92 + r() * 0.2;
  const glow = opt.glow || pick(["#d9b56a", "#4ad8a0", "#e08a4a"]);
  const id = "nf" + String(seed).replace(/\W/g, "") + (opt.big ? "b" : "");
  const sx = w => 50 + (w - 50) * wide;
  let g = `<defs><radialGradient id="${id}" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="${opt.bg || "#2c4434"}"/><stop offset="1" stop-color="#0a120d"/></radialGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${glow}" stop-opacity=".0"/><stop offset=".85" stop-color="${glow}" stop-opacity=".0"/><stop offset="1" stop-color="${glow}" stop-opacity=".55"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#${id})"/>`;
  // дымка и фонарь
  g += `<circle cx="${20 + r() * 60}" cy="18" r="22" fill="${glow}" opacity=".10"/>`;
  // плечи и голова
  const body = `M${sx(8)} 100 Q${sx(10)} 70 ${sx(30)} 64 L44 60 Q50 66 56 60 L${sx(70)} 64 Q${sx(90)} 70 ${sx(92)} 100 Z`;
  g += `<path d="${body}" fill="#060a08"/><path d="${body}" fill="url(#${id}r)"/>`;
  g += `<path d="M44 52 h12 v10 h-12 Z" fill="#060a08"/><ellipse cx="50" cy="40" rx="${13 * Math.min(wide, 1.08)}" ry="16" fill="#060a08"/>`;
  g += `<path d="M44 60 L50 74 L56 60" fill="none" stroke="#1a2a20" stroke-width="2"/>`;
  if (hat === "fedora") g += `<path d="M28 31 Q50 25 72 31 Q74 35 68 34 Q50 30 32 34 Q26 35 28 31 Z" fill="#060a08"/><path d="M37 31 Q36 14 50 13 Q64 14 63 31 Z" fill="#060a08"/><path d="M37.5 27 Q50 24 62.5 27" stroke="${glow}" stroke-opacity=".35" stroke-width="1.5" fill="none"/>`;
  if (hat === "cap") g += `<path d="M36 33 Q35 20 50 20 Q65 20 64 33 Z" fill="#060a08"/><path d="M50 30 Q66 28 76 33 Q66 36 50 34 Z" fill="#060a08"/>`;
  if (hat === "flat") g += `<path d="M35 32 Q36 22 52 22 Q68 23 70 30 Q60 34 35 32 Z" fill="#060a08"/>`;
  // контровой свет по краю головы
  g += `<path d="M${50 + 12 * Math.min(wide, 1.08)} 34 Q${52 + 13 * Math.min(wide, 1.08)} 44 ${48 + 12 * Math.min(wide, 1.08)} 54" stroke="${glow}" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`;
  // глаза / огонёк сигареты
  if (opt.eyes !== false && r() < 0.6) g += `<circle cx="45" cy="41" r="1.3" fill="${glow}" opacity=".8"/><circle cx="55" cy="41" r="1.3" fill="${glow}" opacity=".8"/>`;
  if (opt.cigar || r() < 0.3) g += `<path d="M56 50 l10 2" stroke="#3a2a1a" stroke-width="2"/><circle cx="67" cy="52" r="1.6" fill="#ff7a3a"/><path d="M68 49 q4 -6 0 -12 q-3 -5 2 -10" stroke="#9aa" stroke-opacity=".35" stroke-width="1.2" fill="none"/>`;
  if (opt.mark) g += `<text x="50" y="95" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="11" font-weight="700" fill="${glow}" opacity=".8">${opt.mark}</text>`;
  return `<svg class="art noir" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
}
const BOSS_NOIR = {
  boar:  { hat: "cap",    big: true, glow: "#e08a4a", bg: "#3a2a1a", mark: "КАБАН" },
  shtyr: { hat: "flat",   big: true, glow: "#9ab0c0", bg: "#26323a", mark: "ШТЫРЬ" },
  baron: { hat: "fedora", big: false, glow: "#d9b56a", bg: "#3a2c1a", cigar: true, mark: "БАРОН" },
  sedoy: { hat: "none",   big: true, glow: "#c0d0d8", bg: "#1e2a30", mark: "СЕДОЙ" }
};
ART.opponent = seed => noirFigure(seed);
ART.boss = id => noirFigure("boss" + id, Object.assign({ eyes: true }, BOSS_NOIR[id] || {}));
ART.crewMember = i => `<span class="crewnoir">${noirFigure("crew" + i, { glow: "#d9b56a" })}</span>`;
render();

// =====================================================================
// Правила арта 0.311: рисованный медальон — только когда картинка значит то же самое;
// всё остальное — золотая линейная иконка в металлическом круге (как кнопки шапки 0.311).
// =====================================================================
const LI = {
  store: `<path d="M3 9l1.5-5h15L21 9M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-5h4v5"/>`,
  building: `<path d="M4 21V4h10v17M14 9h6v12M2 21h20M7 8h1M10 8h1M7 12h1M10 12h1M7 16h1M10 16h1M17 13h.5M17 17h.5"/>`,
  flag: `<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>`,
  crown: `<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5zM5 21h14"/>`,
  swords: `<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/>`,
  house: `<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>`,
  briefcase: `<path d="M3 7h18v13H3zM8 7V4h8v3M3 13h18M11 12h2v2h-2z"/>`,
  skull: `<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3zM10 20v-2M14 20v-2"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/>`,
  dice: `<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r=".8"/><circle cx="15" cy="15" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="15" cy="9" r=".8"/><circle cx="9" cy="15" r=".8"/>`,
  vault: `<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="4"/><path d="M12 7.5v1.5M12 14v1.5M8 11.5h1.5M14.5 11.5H16M6 19v2M18 19v2"/>`,
  gift: `<path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4 9 8 12 8M12 8s2-5 4.5-4S15 8 12 8"/>`,
  paw: `<path d="M12 13c-3 0-5.5 3-5.5 5s1.8 3 5.5 3 5.5-1 5.5-3-2.5-5-5.5-5z"/><circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/>`,
  medkit: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M12 10v7M8.5 13.5h7"/>`,
  ranks: `<path d="M6 4l6 4 6-4M6 10l6 4 6-4M6 16l6 4 6-4"/>`,
  trophy: `<path d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3.5 4M17 6h3a3 3 0 0 1-3.5 4"/>`,
  star: `<path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z"/>`,
  notes: `<path d="M5 3h11l3 3v15H5zM9 8h6M9 12h6M9 16h4"/>`,
  wrench: `<path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3z M14.7 6.3a4 4 0 0 1 5-3.3l-2.6 2.6.6 2.4 2.4.6 2.6-2.6a4 4 0 0 1-3.3 5"/>`,
  bolt: `<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>`,
  crosshair: `<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>`,
  paper: `<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7M9 8h3"/>`,
  heart: `<path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 15.4 12 20 12 20z"/><path d="M5 12h3l2-3 3 6 2-3h4"/>`,
  package: `<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9M7.5 5.2l9 4.5"/>`,
  bike: `<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l-1.5-3H6M15 9l-2 7h-3"/>`,
  car: `<path d="M5 16H3v-4l2-5h12l3 5h1v4h-2M7 16h8"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 12h13"/>`,
  music: `<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>`,
  banknote: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>`,
  truck: `<path d="M2 5h12v11H2zM14 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>`,
  handshake: `<path d="M2 11l4-4 4 2 3-2 3 2 4-2 2 3-6 6-2-1-2 2-2-1-2 1-4-3M10 9l-3 3M13 11l3 3"/>`,
  gavel: `<path d="M14 4l6 6M12 6l6 6M10 8l4 4-8 8-3-3 8-8M3 21h8"/>`,
  tower: `<path d="M6 21V8l6-5 6 5v13M3 21h18M10 21v-4h4v4M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>`,
  drops: `<path d="M12 3s-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z"/>`,
  utensils: `<path d="M4 3v7a2 2 0 0 0 2 2h1v9M8 3v6M6 3v6M17 3c-2 2-3 5-3 8h3v10"/>`,
  warehouse: `<path d="M2 21V8l10-5 10 5v13M6 21v-8h12v8M6 17h12"/>`,
  hotel: `<path d="M4 21V3h16v18M2 21h20M9 7h1M14 7h1M9 11h1M14 11h1M10 21v-4h4v4"/>`,
  sword: `<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/>`,
  shirt: `<path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3c0 2-1.5 3-4 3S8 5 8 3z"/>`,
  shield: `<path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5z"/>`,
  cap: `<path d="M3 15a9 6 0 0 1 18 0zM12 9V6M3 15h10l8 1"/>`,
  gem: `<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M10 3 8 9l4 12 4-12-2-6"/>`,
  watch: `<circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 1M9 3h6l1 3M9 21h6l1-3M8 3l-1 3M8 21l-1-3"/>`,
  glasses: `<circle cx="6.5" cy="14" r="3.5"/><circle cx="17.5" cy="14" r="3.5"/><path d="M10 14h4M3 14 4.5 7M21 14l-1.5-7"/>`,
  ring: `<circle cx="12" cy="15" r="6"/><path d="M9 5h6l-1.5 4h-3z"/>`,
  dumbbell: `<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
  sofa: `<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2"/>`,
  fridge: `<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12M9 5v2M9 13v3"/>`,
  tv: `<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M7 3l5 4 5-4"/>`,
  lock: `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  phone: `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>`
};
function metal(name) {
  return `<svg class="art metal" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="mtlbg" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#404a3a"/><stop offset=".85" stop-color="#101c15"/><stop offset="1" stop-color="#050c08"/></radialGradient></defs>
    <circle cx="32" cy="32" r="30" fill="url(#mtlbg)"/><circle cx="32" cy="32" r="29.5" fill="none" stroke="#5d6449" stroke-width="3"/><circle cx="32" cy="32" r="31" fill="none" stroke="#080b08" stroke-width="1.5"/><circle cx="32" cy="32" r="27.2" fill="none" stroke="#9c905b" stroke-opacity=".55" stroke-width="1"/>
    <g transform="translate(18 18) scale(1.1667)" fill="none" stroke="#e1c55e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${LI[name] || LI.star}</g></svg>`;
}
const PAINT = { map: () => pic("nav.map", ""), city: () => pic("nav.city", ""), briefcase: () => pic("nav.items", ""), letter: () => pic("icon.letter", ""), phone: () => pic("icon.phone", ""), watch: () => pic("icon.watch", "") };

// разделы города и плитки событий
const TILE_ICON = { points: "store", realty: "building", districts: "flag", fights: "swords", home: "house", crew: "users", jobs: "briefcase", raids: "skull", casino: "dice", bank: "vault" };
const _tile = ART.tile;
ART.tile = key => key === "shop" ? PAINT.briefcase() : key === "contacts" ? PAINT.letter() : TILE_ICON[key] ? metal(TILE_ICON[key]) : _tile(key);
ART.hasTile = key => key in TILE_ICON || key === "shop" || key === "contacts";

// иконки систем: «Прочее», «Эффекты», заголовки, сумка
Object.assign(ICON2, {
  dog: () => metal("paw"), gift: () => metal("gift"), craft: () => metal("medkit"), rank: () => metal("ranks"),
  ach: () => metal("trophy"), talent: () => metal("star"), notes: () => metal("notes"),
  people: () => PAINT.phone(), bag: () => PAINT.briefcase(), map: () => PAINT.map(), city: () => PAINT.city(), crew: () => metal("users"),
  item: id => metal({ kit: "medkit", drink: "bolt", ammo: "crosshair", alibi: "paper" }[id] || "star")
});

// предметы, движухи, точки, обстановка, районы — вместо эмодзи
const ICON_OF = {
  jobs: { port: "package", courier: "bike", car: "car", club: "music", debt: "banknote", convoy: "truck", deal: "handshake", auction: "gavel", tower: "tower" },
  items: { knuckle: "swords", bat: "sword", knife: "sword", sawoff: "crosshair", pistol: "crosshair", rifle: "crosshair", sniper: "crosshair", leather: "shirt", track: "shirt", vest: "shield", kevlar: "shield", heavy: "shield", tactic: "shield", cap: "cap", chain: "gem", watch: "watch", shades: "glasses", ring: "ring" },
  biz: { kiosk: "store", wash: "drops", shawa: "utensils", service: "wrench", club: "music", storage: "warehouse", hotel: "hotel" },
  furniture: { weights: "dumbbell", bag: "target", sofa: "sofa", fridge: "fridge", tv: "tv", safe: "vault" },
  districts: { west: "flag", prom: "flag", old: "flag", port: "flag", kings: "crown", city: "tower" }
};
for (const [list, map] of Object.entries(ICON_OF)) for (const x of DATA[list]) if (map[x.id]) x.icon = metal(map[x.id]);

// «Хата»: вместо мультяшной комнаты — рисованная сцена района, где ты живёшь
function room() {
  const id = HOME_LOC[S.home] || "west";
  return `<div class="banner homebanner">${pic("loc." + id, districtBanner(id))}<div class="bcap"><h3>${DATA.homes[S.home].name}</h3><small>${LOC[id].title}</small></div></div>`;
}

// «Карта»: карточки районов с рисованными сценами, как в 0.311
SCREENS.map = function () {
  const cur = curLoc();
  return head("Карта города", null, "Переход между районами бесплатный. Закрытые районы откроются с уровнем.") +
    DATA.districts.map((d, i) => {
      const L = LOC[d.id], lock = S.level < d.lvl, here = cur === d.id, mine = !!S.districts[d.id];
      return `<section class="distcard${lock ? " locked" : ""}">
        <div class="distart">${pic("loc." + d.id, districtBanner(d.id))}<span class="distnum">${String(i + 1).padStart(2, "0")}</span>${here ? `<span class="disthere">${T.pin} Вы здесь</span>` : ""}</div>
        <div class="distbody"><h3>${L.title}</h3><small>${mine ? "Под твоим контролем" : L.owner} · с ${d.lvl} ур.</small><p>${L.text}</p>
          ${lock ? `<button class="btn" disabled>${T.lock} Откроется с ${d.lvl} уровня</button>` : here ? `<button class="btn" disabled>Вы здесь</button>` : `<button class="btn green" onclick="visitLoc('${d.id}')">Перейти в район</button>`}
          ${!lock && !mine ? `<button class="linkbtn" onclick="go('districts')">Штурм района ›</button>` : ""}</div>
      </section>`;
    }).join("");
};
render();
