// EMPIRE CITY — системы развития: ранги, достижения, таланты, псы, ремёсла, сумка,
// подарки, заметки, карта города, городские события, нижняя навигация
"use strict";

// ================= ДАННЫЕ =================
const METRICS = {
  level:     { t: "Уровень",                  v: () => S.level },
  wins:      { t: "Выиграно боёв",            v: () => S.wins },
  jobs:      { t: "Выполнено движух",         v: () => S.jobsTotal },
  districts: { t: "Захвачено районов",        v: () => Object.keys(S.districts).length },
  crew:      { t: "Бойцов в бригаде",         v: () => S.crew },
  raids:     { t: "Побед в рейдах",           v: () => Object.values(S.bossKills).reduce((a, b) => a + b, 0) },
  ach:       { t: "Получено достижений",      v: () => Object.keys(S.ach).length },
  stats:     { t: "Сумма параметров",         v: () => S.stats.str + S.stats.def + S.stats.agi + S.stats.end },
  friends:   { t: "Друзей в городе",          v: () => NPCS.filter(n => isFriend(n.id)).length },
  met:       { t: "Знакомств",                v: () => NPCS.filter(n => npcMet(S, n.id)).length },
  story:     { t: "Шагов сюжета",             v: () => S.story },
  sedoy:     { t: "Повержен Седой",           v: () => S.bossKills.sedoy || 0 },
  biz:       { t: "Куплено точек",            v: () => Object.values(S.biz).reduce((a, b) => a + b, 0) },
  earned:    { t: "Заработано денег",         v: () => S.earned },
  home:      { t: "Уровень жилья",            v: () => S.home },
  dogs:      { t: "Псов в вольере",           v: () => S.dogs.length },
  dogLvl:    { t: "Уровень лучшего пса",      v: () => S.dogs.reduce((a, d) => Math.max(a, d.lvl), 0) },
  crafted:   { t: "Сделано вещей",            v: () => S.crafted },
  spins:     { t: "Вращений колеса",          v: () => S.spins },
  gear:      { t: "Куплено снаряжения",       v: () => S.owned.length }
};
const metric = k => METRICS[k].v();

const RANKS = [
  { name: "Шестёрка",       bonus: 0,  req: [] },
  { name: "Пацан",          bonus: 5,  req: [["level", 3], ["wins", 5], ["jobs", 20]] },
  { name: "Боец",           bonus: 10, req: [["level", 6], ["wins", 25], ["jobs", 60], ["districts", 1]] },
  { name: "Бригадир",       bonus: 18, req: [["level", 10], ["wins", 60], ["crew", 5], ["districts", 2], ["raids", 1]] },
  { name: "Смотрящий",      bonus: 27, req: [["level", 15], ["wins", 120], ["districts", 3], ["ach", 10]] },
  { name: "Авторитет",      bonus: 35, req: [["level", 20], ["wins", 200], ["districts", 4], ["stats", 150]] },
  { name: "Босс",           bonus: 45, req: [["level", 26], ["districts", 5], ["friends", 8], ["raids", 10]] },
  { name: "Крёстный отец",  bonus: 60, req: [["level", 32], ["districts", 6], ["story", 10], ["sedoy", 1]] }
];

const ACH_CATS = [
  { id: "street", name: "Улица",   text: "Тебя знают на каждом углу." },
  { id: "work",   name: "Дела",    text: "Работа делает человека." },
  { id: "biz",    name: "Бизнес",  text: "Деньги любят тишину." },
  { id: "city",   name: "Город",   text: "Районы, рейды и власть." },
  { id: "people", name: "Связи",   text: "Нужные люди решают всё." },
  { id: "life",   name: "Жизнь",   text: "Хата, псы, ремёсла и удача." }
];
const ACHS = [
  ["street", "w1",   "Первая кровь",         "wins", 1,       { cash: 300 },             5],
  ["street", "w10",  "Уличный боец",         "wins", 10,      { cash: 1500 },            10],
  ["street", "w50",  "Гроза района",         "wins", 50,      { cash: 8000, gold: 2 },   25],
  ["street", "w150", "Непобедимый",          "wins", 150,     { cash: 30000, gold: 5 },  60],
  ["street", "g5",   "Упакован",             "gear", 5,       { cash: 3000 },            10],
  ["work",   "j10",  "Работяга",             "jobs", 10,      { cash: 500 },             5],
  ["work",   "j100", "Трудоголик",           "jobs", 100,     { cash: 6000, gold: 1 },   20],
  ["work",   "j500", "Человек дела",         "jobs", 500,     { cash: 40000, gold: 5 },  60],
  ["biz",    "b1",   "Первая точка",         "biz", 1,        { cash: 500 },             5],
  ["biz",    "b10",  "Сеть",                 "biz", 10,       { cash: 10000, gold: 2 },  25],
  ["biz",    "b30",  "Магнат",               "biz", 30,       { cash: 80000, gold: 5 },  60],
  ["biz",    "e100", "Сто тысяч",            "earned", 1e5,   { gold: 2 },               15],
  ["biz",    "e1m",  "Миллионер",            "earned", 1e6,   { gold: 6 },               50],
  ["city",   "d1",   "Свой район",           "districts", 1,  { cash: 2000 },            10],
  ["city",   "d3",   "Полгорода",            "districts", 3,  { cash: 20000, gold: 3 },  35],
  ["city",   "d6",   "Хозяин города",        "districts", 6,  { cash: 200000, gold: 10 }, 100],
  ["city",   "r1",   "Охотник",              "raids", 1,      { cash: 2000 },            10],
  ["city",   "r10",  "Гроза боссов",         "raids", 10,     { cash: 30000, gold: 4 },  40],
  ["people", "m5",   "Знакомства",           "met", 5,        { cash: 1500 },            10],
  ["people", "f3",   "Свои люди",            "friends", 3,    { cash: 5000, gold: 2 },   20],
  ["people", "f8",   "Весь город знаком",    "friends", 8,    { cash: 30000, gold: 5 },  50],
  ["people", "s10",  "Новая жизнь",          "story", 10,     { cash: 20000, gold: 5 },  50],
  ["life",   "h1",   "Своя крыша",           "home", 1,       { cash: 2000 },            10],
  ["life",   "h5",   "Особняк",              "home", 5,       { gold: 10 },              80],
  ["life",   "dg1",  "Лучший друг",          "dogs", 1,       { cash: 500 },             5],
  ["life",   "dg10", "Чемпион породы",       "dogLvl", 10,    { cash: 15000, gold: 3 },  30],
  ["life",   "c10",  "Мастер на все руки",   "crafted", 10,   { cash: 3000, gold: 1 },   15],
  ["life",   "sp7",  "Везунчик",             "spins", 7,      { gold: 3 },               15],
  ["life",   "l10",  "Десятка",              "level", 10,     { gold: 2 },               20],
  ["life",   "l25",  "Ветеран улиц",         "level", 25,     { gold: 8 },               60]
].map(([cat, id, name, m, need, reward, pts]) => ({ cat, id, name, m, need, reward, pts }));

const TALENT_TREES = [
  { id: "fighter", name: "Боец", list: [
    { id: "fist",   name: "Тяжёлый кулак",   text: "Удары становятся тяжелее.",          key: "atkPct", v: [5, 15], unit: "% к атаке" },
    { id: "hide",   name: "Крепкая шкура",   text: "Держишь удар как стена.",            key: "defPct", v: [5, 15], unit: "% к защите" },
    { id: "breath", name: "Второе дыхание",  text: "Встаёшь, когда другие лежат.",       key: "hpPct",  v: [10, 25], unit: "% к здоровью" } ] },
  { id: "dealer", name: "Делец", list: [
    { id: "grip",   name: "Хватка",          text: "Из каждой движухи — больше денег.",  key: "jobCashPct", v: [5, 15], unit: "% денег за движухи" },
    { id: "nose",   name: "Нюх на выгоду",   text: "Точки работают эффективнее.",        key: "bizPct", v: [5, 15], unit: "% дохода точек" },
    { id: "haggle", name: "Торг",            text: "Барыга уступает своим.",             key: "shopDisc", v: [5, 12], unit: "% скидки у барыги" } ] },
  { id: "diplomat", name: "Дипломат", list: [
    { id: "charm",  name: "Обаяние",         text: "Разговоры сближают сильнее.",        key: "talkBonus", v: [1, 3], unit: " к отношениям за разговор" },
    { id: "friend", name: "Свой человек",    text: "Подарки дешевле.",                   key: "giftDisc", v: [20, 50], unit: "% скидки на подарки" },
    { id: "name",   name: "Имя в городе",    text: "О тебе говорят.",                    key: "auth", v: [20, 60], unit: " к авторитету" } ] },
  { id: "shadow", name: "Тень", list: [
    { id: "quick",  name: "Ловкач",          text: "Быстрые руки, быстрые решения.",     key: "agiFlat", v: [5, 15], unit: " к ловкости" },
    { id: "quiet",  name: "Тихий шаг",       text: "Движухи срываются реже.",            key: "jobRisk", v: [3, 8], unit: "% к шансу успеха движух" },
    { id: "legs",   name: "Быстрые ноги",    text: "Сил хватает на большее.",            key: "enFlat", v: [5, 15], unit: " к макс. энергии" } ] }
];
const TALENT_COST = [1, 3];   // новичок, мастер (суммарно 4)
const TIER_NAMES = ["Новичок", "Мастер"];

const DOG_BREEDS = [
  { id: "mutt",   name: "Дворняга",  price: 500,    lvl: 1,  atk: 2,  color: "#b08a5a", mark: "#e8d8b8", ears: "flop" },
  { id: "pit",    name: "Питбуль",   price: 5000,   lvl: 5,  atk: 4,  color: "#c9a07a", mark: "#f2e6d0", ears: "short" },
  { id: "rott",   name: "Ротвейлер", price: 20000,  lvl: 10, atk: 6,  color: "#2a2220", mark: "#a0602a", ears: "flop" },
  { id: "dober",  name: "Доберман",  price: 60000,  lvl: 15, atk: 8,  color: "#1f1a18", mark: "#b0703a", ears: "up" },
  { id: "alabai", name: "Алабай",    price: 200000, lvl: 22, atk: 11, color: "#e8dcc0", mark: "#fff6e6", ears: "short" }
];
const DOG_NAMES = ["Шарик", "Тайсон", "Барон", "Граф", "Рекс", "Дизель", "Гром", "Джек", "Кайзер", "Бакс", "Цезарь", "Буря"];
const KENNEL_MAX = 4;
const HUNGRY_H = 12, SICK_H = 36;

const PROFS = [
  { id: "medic",  name: "Медик",      item: "kit",    itemName: "Аптечка",          desc: "восстанавливает 60% здоровья", cost: 300,  mins: 5 },
  { id: "bar",    name: "Бармен",     item: "drink",  itemName: "Энергетик",        desc: "+25 энергии",                  cost: 800,  mins: 15 },
  { id: "gun",    name: "Оружейник",  item: "ammo",   itemName: "Особые патроны",   desc: "+25% урона на 3 схватки",      cost: 1500, mins: 30 },
  { id: "papers", name: "Документы",  item: "alibi",  itemName: "Алиби",            desc: "следующее поражение без потери денег", cost: 2000, mins: 45 }
];
const ITEMS_C = Object.fromEntries(PROFS.map(p => [p.item, p]));

// ================= ЛОГИКА =================
const H = 3600 * 1000;
const fmtDur = sec => {
  sec = Math.max(0, Math.ceil(sec));
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return d ? `${d}д ${h}ч` : h ? `${h}ч ${m}м` : m ? `${m}м ${s}с` : `${s}с`;
};
const toMidnight = () => { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); return (m - n) / 1000; };

// --- ранги
const rankOf = () => RANKS[S.rank] || RANKS[0];
const nextRank = () => RANKS[S.rank + 1];
const reqDone = ([k, n]) => metric(k) >= n;
function rankProgress(r) {
  if (!r || !r.req.length) return 1;
  return r.req.reduce((a, q) => a + Math.min(1, metric(q[0]) / q[1]), 0) / r.req.length;
}
// --- таланты
const talentPointsTotal = () => (S.level - 1) + S.rank * 2;
const talentSpent = () => Object.values(S.talents).reduce((a, t) => a + (t >= 1 ? TALENT_COST[0] : 0) + (t >= 2 ? TALENT_COST[1] : 0), 0);
const talentFree = () => talentPointsTotal() - talentSpent();
// --- псы
const activeDog = () => S.dogs[S.dog] || null;
const breed = id => DOG_BREEDS.find(b => b.id === id);
function dogState(d) {
  const h = (Date.now() - d.fed) / H;
  return h > SICK_H ? "sick" : h > HUNGRY_H ? "hungry" : "fed";
}
const dogPower = d => Math.round(breed(d.breed).atk * (1 + d.lvl * 0.5));
function dogBonus() {
  const d = activeDog(); if (!d) return 0;
  const st = dogState(d);
  return st === "fed" ? dogPower(d) : st === "hungry" ? Math.round(dogPower(d) / 2) : 0;
}
const dogXpNeed = d => d.lvl * 20;
const feedPrice = d => 50 + d.lvl * 25;
const vetPrice = d => Math.round(breed(d.breed).price * 0.15 + d.lvl * 100);
// --- ремёсла
const profLvl = id => 1 + Math.floor((S.profXp[id] || 0) / 5);
const craftMins = p => Math.max(1, Math.round(p.mins * Math.max(0.5, 1 - (profLvl(p.id) - 1) * 0.05)));
const craftYield = p => 1 + Math.floor((profLvl(p.id) - 1) / 3);

// --- суммарные бонусы систем (подключены в perk())
function sysBonus(key) {
  if (!S) return 0;
  let v = 0;
  const rb = rankOf().bonus;
  if (key === "atkFlat") v += rb + dogBonus();
  if (key === "defFlat") v += rb + Math.round(dogBonus() / 2);
  if (key === "hpFlat") v += rb * 3;
  for (const tr of TALENT_TREES) for (const t of tr.list) {
    const tier = S.talents[t.id] || 0;
    if (tier && t.key === key) v += t.v[tier - 1];
  }
  return v;
}

// --- подарки от друзей
function giftFor(id) {
  const r = rng2(id + today());
  const roll = r();
  if (roll < 0.1) return { gold: 1, label: "1 💎" };
  if (roll < 0.35) return { item: "drink", label: "Энергетик" };
  if (roll < 0.55) return { item: "kit", label: "Аптечка" };
  const c = 150 * S.level + Math.floor(r() * 300);
  return { cash: c, label: "$" + fmt(c) };
}
function rng2(seed) { let a = [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7); return () => { a = (a * 1103515245 + 12345) | 0; return ((a >>> 0) % 10000) / 10000; }; }
const giftsReady = () => NPCS.filter(n => isFriend(n.id) && S.giftsDay[n.id] !== today());

// --- уведомления систем
function sysBadges() {
  const ach = ACHS.filter(a => !S.ach[a.id] && metric(a.m) >= a.need).length;
  const nr = nextRank();
  const rankUp = nr && nr.req.every(reqDone) ? 1 : 0;
  const tal = talentFree() > 0 ? talentFree() : 0;
  const crafts = PROFS.filter(p => S.crafts[p.id] && Date.now() >= S.crafts[p.id].until).length;
  const d = activeDog();
  const dog = d && dogState(d) !== "fed" ? 1 : 0;
  const gifts = giftsReady().length;
  return { ach, rankUp, tal, crafts, dog, gifts, profile: ach + rankUp + (tal ? 1 : 0) + dog + gifts + (S.points > 0 ? 1 : 0) };
}

// ================= ДЕЙСТВИЯ =================
const SYS_ACTIONS = {
  promote() {
    const r = nextRank();
    if (!r || !r.req.every(reqDone)) return;
    S.rank++;
    addLog("Новый ранг: " + r.name);
    save(); render();
    modal(`<div class="sysicon big">${ICON2.rank()}</div><h3>Ранг: ${r.name}</h3><p>Бонус: +${r.bonus} к атаке и защите, +${r.bonus * 3} к здоровью.<br>+2 очка талантов.</p>`);
  },
  claimAch(id) {
    const a = ACHS.find(x => x.id === id);
    if (!a || S.ach[id] || metric(a.m) < a.need) return;
    S.ach[id] = Date.now(); S.rating += a.pts;
    const r = give(a.reward);
    save(); render();
    modal(`<div class="sysicon big">${ICON2.ach()}</div><h3>«${a.name}»</h3><p>${r}<br>+${a.pts} рейтинга</p>`);
  },
  achCat(c) { S._achCat = c; go("achcat"); },
  learn(id) {
    const tier = S.talents[id] || 0;
    if (tier >= 2) return;
    const cost = TALENT_COST[tier];
    if (talentFree() < cost) return toast("Не хватает очков талантов", "bad");
    S.talents[id] = tier + 1;
    save(); render(); toast("Талант изучен: " + TIER_NAMES[tier]);
  },
  resetTalents() {
    if (S.gold < 10) return toast("Нужно 10 💎", "bad");
    ask("Сбросить все таланты за 10 💎?", () => { S.gold -= 10; S.talents = {}; save(); render(); toast("Таланты сброшены"); });
  },
  setTree(t) { S._tree = t; render(); },

  buyDog(id) {
    const b = breed(id);
    if (S.dogs.length >= KENNEL_MAX) return toast("Вольер полон", "bad");
    if (S.level < b.lvl || !needCash(b.price)) return;
    S.cash -= b.price;
    S.dogs.push({ breed: id, name: DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)], lvl: 1, xp: 0, fed: Date.now() });
    if (S.dog == null || !activeDog()) S.dog = S.dogs.length - 1;
    addLog("Новый пёс: " + b.name);
    save(); render(); toast("🐕 В вольере новый пёс!");
  },
  pickDog(i) { S.dog = i; save(); render(); },
  feedDog(i) {
    const d = S.dogs[i]; if (!d) return;
    if (dogState(d) === "sick") return toast("Пёс болеет — сначала к ветеринару", "bad");
    const p = feedPrice(d); if (!needCash(p)) return;
    S.cash -= p; d.fed = Date.now(); save(); render(); toast(`${d.name} накормлен`);
  },
  vetDog(i) {
    const d = S.dogs[i]; if (!d) return;
    const p = vetPrice(d); if (!needCash(p)) return;
    S.cash -= p; d.fed = Date.now(); save(); render(); toast(`${d.name} здоров и сыт`);
  },
  freeDog(i) {
    const d = S.dogs[i]; if (!d) return;
    ask(`Отдать ${esc(d.name)} в добрые руки? Его нельзя будет вернуть.`, () => {
      S.dogs.splice(i, 1);
      if (S.dog === i) S.dog = S.dogs.length ? 0 : null; else if (S.dog > i) S.dog--;
      save(); render();
    });
  },

  craft(id) {
    const p = PROFS.find(x => x.id === id);
    if (S.crafts[id]) return;
    if (!needCash(p.cost)) return;
    S.cash -= p.cost;
    S.crafts[id] = { until: Date.now() + craftMins(p) * 60000, n: craftYield(p) };
    save(); render(); toast(`${p.name}: работа началась`);
  },
  collectCraft(id) {
    const c = S.crafts[id], p = PROFS.find(x => x.id === id);
    if (!c || Date.now() < c.until) return;
    S.bag[p.item] = (S.bag[p.item] || 0) + c.n;
    S.profXp[id] = (S.profXp[id] || 0) + 1;
    S.crafted += c.n;
    delete S.crafts[id];
    save(); render(); toast(`+${c.n} × ${p.itemName} в сумку`);
  },
  useItem(it) {
    if (!S.bag[it]) return;
    if (it === "kit") { if (S.hp >= maxHp()) return toast("Здоровье полное"); S.hp = Math.min(maxHp(), S.hp + Math.round(maxHp() * 0.6)); }
    if (it === "drink") { if (S.energy >= maxEn()) return toast("Энергия полная"); S.energy = Math.min(maxEn(), S.energy + 25); }
    if (it === "ammo") S.buffs.ammo = (S.buffs.ammo || 0) + 3;
    if (it === "alibi") { if (S.buffs.alibi) return toast("Алиби уже есть"); S.buffs.alibi = 1; }
    S.bag[it]--;
    save(); render(); toast(ITEMS_C[it].itemName + ": использовано");
  },
  claimGift(id) {
    if (!isFriend(id) || S.giftsDay[id] === today()) return;
    const g = giftFor(id); S.giftsDay[id] = today();
    let txt;
    if (g.item) { S.bag[g.item] = (S.bag[g.item] || 0) + 1; txt = g.label + " в сумку"; }
    else txt = give(g);
    save(); render(); toast(`🎁 ${npcById(id).name.split(" ")[0]}: ${txt}`);
  },
  saveNotes(v) { S.notes = v.slice(0, 2000); save(); }
};

// ================= ГРАФИКА =================
const OL2 = "#2a1d12";
const p2 = (d, f, w = 2.5) => `<path d="${d}" fill="${f}" stroke="${OL2}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const sv = (vb, b, c = "") => `<svg class="art ${c}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;

const ICON2 = {
  dog: (bid = "rott") => { const b = breed(bid) || DOG_BREEDS[2]; return sv("0 0 64 64", dogHead(b)); },
  gift: () => sv("0 0 64 64", p2("M12 26 h40 v28 h-40 Z", "#c0302a") + p2("M8 18 h48 v10 h-48 Z", "#d8493a") + p2("M28 18 h8 v36 h-8 Z", "#f2c94c") +
    p2("M32 18 Q18 4 16 14 Q16 20 32 18 Z", "#f2c94c") + p2("M32 18 Q46 4 48 14 Q48 20 32 18 Z", "#f2c94c")),
  craft: () => sv("0 0 64 64", p2("M10 22 h44 v32 h-44 Z", "#e8e4d8") + p2("M24 14 h16 v8 h-16 Z", "#9a9a9a") + p2("M28 28 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 Z", "#c0302a") +
    p2("M44 6 l8 8 l-18 18 l-6 2 l2 -6 Z", "#c99a5a", 2)),
  rank: () => sv("0 0 64 64", p2("M12 8 h40 v26 Q52 52 32 60 Q12 52 12 34 Z", "#7a1f1f") + [16, 28, 40].map(y => p2(`M20 ${y} L32 ${y + 7} L44 ${y} L44 ${y + 6} L32 ${y + 13} L20 ${y + 6} Z`, "#f2c94c", 2)).join("")),
  ach: () => sv("0 0 64 64", p2("M18 8 h28 v14 Q46 38 32 40 Q18 38 18 22 Z", "#f2c94c") + p2("M18 12 Q6 12 8 22 Q10 30 20 30", "none", 3) + p2("M46 12 Q58 12 56 22 Q54 30 44 30", "none", 3) +
    p2("M28 40 h8 v8 h-8 Z", "#d8a02a") + p2("M18 48 h28 v8 h-28 Z", "#7a4a22") + `<path d="M26 14 v14" stroke="#fff8" stroke-width="3"/>`),
  talent: () => sv("0 0 64 64", [[32, 18, 13], [16, 42, 9], [48, 44, 9]].map(([x, y, r]) =>
    p2(`M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y - r * .2} L${x + r * .45} ${y + r * .25} L${x + r * .6} ${y + r} L${x} ${y + r * .55} L${x - r * .6} ${y + r} L${x - r * .45} ${y + r * .25} L${x - r} ${y - r * .2} L${x - r * .3} ${y - r * .3} Z`, "#f2c94c", 2)).join("") +
    `<path d="M32 30 L18 38 M32 30 L46 40" stroke="#5ab0d0" stroke-width="3"/>`),
  notes: () => sv("0 0 64 64", p2("M14 10 h32 q6 0 6 6 v38 h-32 q-6 0 -6 -6 Z", "#efe2bc") + `<path d="M20 22 h22 M20 30 h22 M20 38 h16" stroke="#9a7a4a" stroke-width="2.5"/>` +
    p2("M52 4 Q40 18 38 34 L42 34 Q48 18 56 8 Z", "#f2f2f2", 2) + p2("M36 34 h8 v6 h-8 Z", "#c9a02a", 2)),
  people: () => sv("0 0 64 64", p2("M4 58 Q6 40 20 38 Q34 40 36 58 Z", "#2a3a5a") + `<circle cx="20" cy="26" r="10" fill="#f2c8a0" stroke="${OL2}" stroke-width="2.5"/>` +
    p2("M28 58 Q30 38 44 36 Q58 38 60 58 Z", "#7a1f1f") + `<circle cx="44" cy="24" r="10" fill="#d9a074" stroke="${OL2}" stroke-width="2.5"/>` + p2("M34 18 Q44 8 54 18 Q44 14 34 18 Z", "#2b2118", 2)),
  bag: () => sv("0 0 64 64", p2("M8 24 Q8 18 14 18 h36 q6 0 6 6 v24 q0 6 -6 6 h-36 q-6 0 -6 -6 Z", "#3a4a6a") + p2("M22 18 Q22 8 32 8 Q42 8 42 18", "none", 4) +
    `<path d="M10 30 h44" stroke="#f2f2f2" stroke-width="3"/><path d="M10 36 h44" stroke="#c0302a" stroke-width="3"/>` + p2("M26 40 h12 v6 h-12 Z", "#9a9a9a", 2)),
  item: id => sv("0 0 64 64", {
    kit: p2("M10 22 h44 v32 h-44 Z", "#e8e4d8") + p2("M24 14 h16 v8 h-16 Z", "#9a9a9a") + p2("M28 28 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 Z", "#c0302a"),
    drink: p2("M22 14 h20 v6 l4 6 v30 q0 4 -4 4 h-20 q-4 0 -4 -4 v-30 l4 -6 Z", "#2a8a3a") + p2("M24 6 h16 v8 h-16 Z", "#9a9a9a") + p2("M30 30 l-6 10 h6 l-4 10 l12 -14 h-6 l4 -6 Z", "#f2c94c", 2),
    ammo: [14, 28, 42].map(x => p2(`M${x} 56 v-30 q4 -14 8 0 v30 Z`, "#d9a02a", 2) + p2(`M${x} 46 h8 v10 h-8 Z`, "#b8862a", 2)).join(""),
    alibi: p2("M10 14 h20 l4 6 h20 v36 h-44 Z", "#c9a46a") + p2("M16 26 h32 v24 h-32 Z", "#f6f1e4", 2) + '<path d="M20 32 h24 M20 38 h24 M20 44 h14" stroke="#9a7a4a" stroke-width="2"/>' + '<circle cx="44" cy="46" r="6" fill="#c0302a" stroke="#2a1d12" stroke-width="2"/>'
  }[id] || ""),
  map: () => sv("0 0 64 64", p2("M6 14 L22 8 L42 14 L58 8 L58 50 L42 56 L22 50 L6 56 Z", "#e8d8a8") + `<path d="M22 8 V50 M42 14 V56" stroke="#9a7a4a" stroke-width="2"/>` +
    `<path d="M10 40 Q20 30 30 34 T54 22" stroke="#c0302a" stroke-width="3" fill="none" stroke-dasharray="4 3"/>` + p2("M50 18 l4 4 M54 18 l-4 4", "none", 3)),
  city: () => sv("0 0 64 64", p2("M8 58 V30 h12 V58", "#b8c4cc") + p2("M22 58 V14 h18 V58", "#8a98a2") + p2("M42 58 V24 h14 V58", "#c9a27a") +
    [18, 26, 34, 42].map(y => `<rect x="26" y="${y}" width="4" height="4" fill="#f2e08a"/><rect x="33" y="${y}" width="4" height="4" fill="#f2e08a"/>`).join("") + `<path d="M4 58 H60" stroke="${OL2}" stroke-width="3"/>`),
  crew: () => sv("0 0 64 64", [[14, "#c06a1a"], [50, "#2a8a3a"], [32, "#8a2a8a"]].map(([x, c], i) =>
    p2(`M${x - 13} 60 Q${x - 12} ${44 - i * 2} ${x} ${42 - i * 2} Q${x + 12} ${44 - i * 2} ${x + 13} 60 Z`, c) + `<circle cx="${x}" cy="${30 - i * 3}" r="${i === 2 ? 11 : 9}" fill="#e9b48a" stroke="${OL2}" stroke-width="2.5"/>`).join(""))
};

function dogHead(b) {
  const ears = b.ears === "up" ? p2("M14 26 L16 4 L28 18 Z", b.color) + p2("M50 26 L48 4 L36 18 Z", b.color)
    : b.ears === "short" ? p2("M14 22 Q14 10 24 14 Z", b.color) + p2("M50 22 Q50 10 40 14 Z", b.color)
    : p2("M16 16 Q4 18 6 38 Q12 40 18 30 Z", shadeHex(b.color, .8)) + p2("M48 16 Q60 18 58 38 Q52 40 46 30 Z", shadeHex(b.color, .8));
  return ears + p2("M14 30 Q14 12 32 12 Q50 12 50 30 Q50 50 32 52 Q14 50 14 30 Z", b.color) +
    p2("M22 40 Q22 32 32 32 Q42 32 42 40 Q42 50 32 50 Q22 50 22 40 Z", b.mark) +
    `<ellipse cx="32" cy="36" rx="5" ry="3.5" fill="${OL2}"/><circle cx="25" cy="27" r="3" fill="${OL2}"/><circle cx="39" cy="27" r="3" fill="${OL2}"/>` +
    `<circle cx="26" cy="26" r="1" fill="#fff"/><circle cx="40" cy="26" r="1" fill="#fff"/><path d="M28 44 Q32 47 36 44" stroke="${OL2}" stroke-width="2" fill="none"/>` +
    p2("M18 52 Q32 60 46 52 L46 58 Q32 64 18 58 Z", "#b8392b", 2) + [24, 32, 40].map(x => `<circle cx="${x}" cy="${57}" r="1.8" fill="#e8e8e8"/>`).join("");
}
function shadeHex(hex, k) { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, "0")).join(""); }

// --- карта города
function cityMap() {
  const bl = (x, y, w, h, f, roof) => p2(`M${x} ${y} h${w} v${h} h-${w} Z`, f, 2) +
    (roof === "tri" ? p2(`M${x - 3} ${y} L${x + w / 2} ${y - w * 0.45} L${x + w + 3} ${y} Z`, "#8a3a2a", 2) : roof === "flat" ? p2(`M${x - 2} ${y - 3} h${w + 4} v3 h-${w + 4} Z`, "#5a5a5a", 1.5) : "") +
    Array.from({ length: Math.floor(h / 10) }, (_, r) => Array.from({ length: Math.max(1, Math.floor(w / 9)) }, (_, c) => `<rect x="${x + 3 + c * 9}" y="${y + 4 + r * 10}" width="4" height="5" fill="${(r + c) % 3 ? "#3a4a5a" : "#f2e08a"}"/>`).join("")).join("");
  const tree = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#3a7a3a" stroke="${OL2}" stroke-width="2"/>`;
  const art = {
    kings: x => bl(-34, -6, 30, 22, "#e8dcc0", "tri") + bl(4, -10, 32, 26, "#d8c8e0", "tri") + tree(-40, 18) + tree(42, 16) + p2("M-10 24 h20 v4 h-20 Z", "#7aa86a", 1.5),
    city: x => bl(-36, -30, 18, 48, "#8ab0c8", "flat") + bl(-14, -50, 22, 68, "#6a90b0", "flat") + bl(12, -36, 20, 54, "#a0c0d8", "flat") + p2("M-3 -50 v-12", "none", 2),
    old: x => bl(-36, -6, 22, 22, "#b06a4a", "tri") + bl(-10, -14, 22, 30, "#a05a3a", "tri") + bl(16, -4, 20, 20, "#c07a5a", "tri") + tree(40, 14),
    port: x => p2("M-38 10 h30 v12 h-30 Z", "#c03030", 2) + p2("M-34 -2 h30 v12 h-30 Z", "#2a6ab0", 2) + p2("M0 10 h26 v12 h-26 Z", "#e6b64f", 2) +
      p2("M30 22 V-30 M30 -30 H-6 M-2 -30 V-14", "none", 3) + p2("M24 22 h12 v4 h-12 Z", "#555", 2),
    west: x => bl(-36, -2, 20, 18, "#c9b98e", "tri") + bl(-12, -8, 22, 24, "#a9b8a0", "tri") + bl(14, 0, 20, 16, "#d8c9a6", "tri") + p2("M-30 18 h60", "none", 2),
    prom: x => bl(-38, -8, 36, 26, "#7a7a72", "flat") + bl(4, -2, 32, 20, "#8a8a82", "flat") + p2("M-30 -8 v-26 h6 v26", "#6a6a62", 2) + p2("M-18 -8 v-20 h6 v20", "#6a6a62", 2) +
      `<path d="M-27 -36 q-6 -8 2 -14 q-4 -8 6 -12" stroke="#aaa" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`
  };
  const pos = { kings: [95, 100], city: [305, 105], old: [92, 262], port: [318, 262], west: [95, 432], prom: [305, 440] };
  let g = `<defs><linearGradient id="mapland" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8aa86a"/><stop offset=".5" stop-color="#b8a878"/><stop offset="1" stop-color="#8a8a7a"/></linearGradient></defs>`;
  g += `<rect width="400" height="540" fill="url(#mapland)"/>`;
  g += `<path d="M400 170 Q350 200 372 260 Q390 320 400 350 Z" fill="#4a8ab0" stroke="${OL2}" stroke-width="2"/>`;
  g += `<path d="M232 0 Q190 120 220 220 Q250 330 190 420 Q160 480 178 540" stroke="#3a6a90" stroke-width="30" fill="none"/><path d="M232 0 Q190 120 220 220 Q250 330 190 420 Q160 480 178 540" stroke="#5a9ac0" stroke-width="22" fill="none"/>`;
  g += `<path d="M0 180 H400 M0 350 H400 M120 0 V540 M290 0 V540" stroke="#e8dcc0" stroke-width="7" opacity=".8"/><path d="M0 180 H400 M0 350 H400 M120 0 V540 M290 0 V540" stroke="#9a8a6a" stroke-width="1" stroke-dasharray="6 6"/>`;
  g += [[204, 180], [228, 350]].map(([x, y]) => `<rect x="${x - 22}" y="${y - 6}" width="44" height="12" fill="#a08060" stroke="${OL2}" stroke-width="2"/>`).join("");
  for (const d of DATA.districts) {
    const [x, y] = pos[d.id], mine = !!S.districts[d.id], lock = S.level < d.lvl;
    g += `<g class="mapdist${lock ? " locked" : ""}" onclick="go('districts')" transform="translate(${x} ${y})">${art[d.id]()}
      ${mine ? p2("M38 -40 V0", "none", 2.5) + p2("M38 -40 L58 -34 L38 -28 Z", "#2a9a2a", 2) : ""}
      ${lock ? `<g transform="translate(0 -18)"><rect x="-9" y="-2" width="18" height="14" rx="2" fill="#e6b64f" stroke="${OL2}" stroke-width="2"/><path d="M-5 -2 v-4 a5 5 0 0 1 10 0 v4" fill="none" stroke="${OL2}" stroke-width="2.5"/></g>` : ""}
      <rect x="-58" y="32" width="116" height="20" rx="6" fill="${mine ? "#2a6a2a" : "#2a1d12"}" opacity=".88"/>
      <text x="0" y="46" text-anchor="middle" class="maplabel">${d.name} (${d.lvl})</text></g>`;
  }
  const poi = (x, y, label, to, body, color) => `<g class="mappoi" onclick="go('${to}')" transform="translate(${x} ${y})">${body}
    <path d="M-44 12 h88 l-6 9 l6 9 h-88 l6 -9 Z" fill="${color}" stroke="${OL2}" stroke-width="2"/><text x="0" y="26" text-anchor="middle" class="poilabel">${label}</text></g>`;
  g += poi(205, 330, "БОИ", "fights", p2("M-26 -30 L22 8 M26 -30 L-22 8", "none", 7) + p2("M-26 -30 L22 8 M26 -30 L-22 8", "none", 0) +
    `<path d="M-26 -30 L22 8 M26 -30 L-22 8" stroke="#d8dde2" stroke-width="5"/>` + p2("M-14 -22 h28 v22 Q0 12 -14 0 Z", "#c03030"), "#b8392b");
  g += poi(160, 205, "БАРЫГА", "shop", p2("M-22 -26 h44 v26 h-44 Z", "#e8e0c8") + p2("M-26 -34 h52 l-4 10 h-44 Z", "#2a6ab0"), "#2a5a8a");
  g += poi(215, 500, "КАЗИНО", "casino", p2("M-18 -28 h36 v28 h-36 Z", "#c8c8c8") + p2("M-14 -24 h28 v12 h-28 Z", "#fff") + `<text x="0" y="-14" text-anchor="middle" font-size="10" font-weight="bold" fill="#c03030">777</text>`, "#7a2a7a");
  g += poi(48, 505, "ХАТА", "home", p2("M-16 -4 v-16 l16 -12 l16 12 v16 Z", "#d8c9a6") + p2("M-20 -20 l20 -16 l20 16", "none", 3) + p2("M-4 -4 v-10 h8 v10", "#7a4a22", 2), "#7a5a2a");
  return sv("0 0 400 540", g, "citymap");
}

// ================= ЭКРАНЫ =================
function sysTile(icon, label, to, badge) {
  return `<button class="systile" onclick="go('${to}')">${badge ? `<span class="badge">${badge}</span>` : ""}<div class="sysicon">${icon}</div><span>${label}</span></button>`;
}

function effectsList() {
  const fx = [];
  const r = rankOf();
  if (r.bonus) fx.push(["rank", `Ранг «${r.name}»`, `⚔️+${r.bonus} 🛡️+${r.bonus} ❤️+${r.bonus * 3}`]);
  const d = activeDog();
  if (d) { const st = dogState(d); fx.push(["dog", `Пёс ${esc(d.name)} (${breed(d.breed).name})`, st === "fed" ? `⚔️+${dogBonus()} 🛡️+${Math.round(dogBonus() / 2)}` : st === "hungry" ? `голоден: ⚔️+${dogBonus()}` : "болеет: бонуса нет"]); }
  for (const tr of TALENT_TREES) for (const t of tr.list) { const tier = S.talents[t.id] || 0; if (tier) fx.push(["talent", `${t.name} (${TIER_NAMES[tier - 1]})`, `+${t.v[tier - 1]}${t.unit}`]); }
  for (const n of NPCS) if (isFriend(n.id)) fx.push(["people", `Дружба: ${n.name}`, n.perk.text]);
  for (const f of DATA.furniture) if (S.furniture.includes(f.id)) fx.push(["home", f.name, f.text]);
  if (S.home) fx.push(["home", DATA.homes[S.home].name, `⚡+${DATA.homes[S.home].en}`]);
  if (S.buffs.ammo) fx.push(["craft", "Особые патроны", `+25% урона · осталось ${S.buffs.ammo}`]);
  if (S.buffs.alibi) fx.push(["craft", "Алиби", "следующее поражение без потери денег"]);
  return fx;
}

const SYS_SCREENS = {
  map() {
    return topbar() + `<div class="screenhead">Карта города</div><div class="mapwrap">${cityMap()}</div>
      <div class="paper small center">Нажми на район, чтобы перейти к штурму, или на значок — к арене, барыге, казино и хате.</div>`;
  },

  ranks() {
    const r = rankOf(), n = nextRank(), pr = Math.round(rankProgress(n) * 100);
    const segs = 12;
    return head("Ранги", ICON2.rank(), "Ранг даёт постоянный бонус к параметрам и очки талантов") +
      `<div class="paper darkpaper">
        <div>Текущий: <b>${r.name}</b>${r.bonus ? `, бонус ⚔️🛡️ +${r.bonus}, ❤️ +${r.bonus * 3}` : ""}</div>
        ${n ? `<div>Следующий: <b>${n.name}</b>, бонус ⚔️🛡️ +${n.bonus}, ❤️ +${n.bonus * 3}</div>
        <div class="segbar">${Array.from({ length: segs }, (_, i) => `<i class="${i < Math.round(pr / 100 * segs) ? "on" : ""}"></i>`).join("")}</div>
        <div class="center small">Выполнено до нового ранга ${pr}%</div>` : `<p class="good">Высший ранг достигнут.</p>`}
      </div>` +
      (n ? n.req.map(q => { const v = metric(q[0]), ok = v >= q[1]; return `<div class="reqrow"><span>${METRICS[q[0]].t}</span><b class="${ok ? "good" : "bad"}">${fmt(v)} из ${fmt(q[1])}</b></div>`; }).join("") +
        `<button class="btn ${n.req.every(reqDone) ? "green" : ""}" onclick="A.promote()" ${n.req.every(reqDone) ? "" : "disabled"}>${n.req.every(reqDone) ? "Получить ранг «" + n.name + "»" : "Условия не выполнены"}</button>` : "") +
      `<h4 class="sub">Все ранги</h4>` + RANKS.map((x, i) => `<div class="card ${i > S.rank ? "locked" : ""}"><div class="cico chapn">${i + 1}</div><div class="cbody"><b>${x.name}</b><small>${x.bonus ? `⚔️🛡️ +${x.bonus} · ❤️ +${x.bonus * 3}` : "Начало пути"}</small></div>${i === S.rank ? `<span class="lock good">Твой</span>` : i < S.rank ? `<span class="lock">✓</span>` : ""}</div>`).join("") + back();
  },

  achievements() {
    const done = Object.keys(S.ach).length;
    return head("Достижения", ICON2.ach(), "Простой житель или легенда города? Здесь видно, на что ты способен.") +
      `<div class="paper darkpaper small">
        <div>⚔️ Побед: ${S.wins}, поражений: ${S.losses}</div>
        <div>🏅 Выполнено достижений: ${done} / ${ACHS.length}</div>
        <div>⭐ Рейтинг: ${fmt(S.rating)} / ${fmt(ACHS.reduce((a, x) => a + x.pts, 0))}</div></div>
      <h4 class="sub">Категории</h4>` +
      ACH_CATS.map(c => {
        const list = ACHS.filter(a => a.cat === c.id), got = list.filter(a => S.ach[a.id]).length, ready = list.filter(a => !S.ach[a.id] && metric(a.m) >= a.need).length;
        return `<button class="listrow" onclick="A.achCat('${c.id}')"><div class="sysicon sm">${ICON2.ach()}</div><div><b>${c.name} [${got} из ${list.length}]</b><small>${c.text}</small></div>${ready ? `<span class="badge static">${ready}</span>` : ""}<i>›</i></button>`;
      }).join("") + back();
  },

  achcat() {
    const c = ACH_CATS.find(x => x.id === S._achCat) || ACH_CATS[0];
    return head("Достижения: " + c.name, ICON2.ach(), c.text) + ACHS.filter(a => a.cat === c.id).map(a => {
      const v = metric(a.m), got = !!S.ach[a.id], ready = !got && v >= a.need;
      const rw = [a.reward.cash && "$" + fmt(a.reward.cash), a.reward.gold && a.reward.gold + " 💎", "+" + a.pts + " ⭐"].filter(Boolean).join(" · ");
      return `<div class="card ${got ? "done" : ""}"><div class="sysicon sm">${ICON2.ach()}</div><div class="cbody"><b>${a.name}</b><small>${METRICS[a.m].t}: ${fmt(Math.min(v, a.need))} из ${fmt(a.need)}</small>
        <div class="mbar"><i style="width:${Math.min(100, v / a.need * 100)}%"></i></div><small>Награда: ${rw}</small></div>
        ${got ? `<span class="lock good">✓</span>` : ready ? `<button class="btn sm green" onclick="A.claimAch('${a.id}')">Забрать</button>` : ""}</div>`;
    }).join("") + `<button class="btn back" onclick="go('achievements')">← Категории</button>`;
  },

  talents() {
    const t = TALENT_TREES.find(x => x.id === S._tree) || TALENT_TREES[0];
    return head("Таланты", ICON2.talent(), "Очки талантов: 1 за каждый уровень и 2 за каждый ранг") +
      `<div class="tabs">${TALENT_TREES.map(x => `<button class="${x.id === t.id ? "on" : ""}" onclick="A.setTree('${x.id}')">${x.name}</button>`).join("")}</div>
      <div class="center talpts">Доступно: <b>${talentFree()}</b> / ${talentPointsTotal()}</div>` +
      t.list.map(x => {
        const tier = S.talents[x.id] || 0;
        return `<div class="paper talent"><div class="row"><div class="sysicon sm">${ICON2.talent()}</div><div><b>${x.name}</b><small class="block">${x.text}</small></div></div>
          ${tier ? `<div class="tier"><span class="tierbadge">${tier}</span> ${TIER_NAMES[tier - 1]}: <b class="good">+${x.v[tier - 1]}</b>${x.unit}</div>` : ""}
          ${tier < 2 ? `<button class="btn sm" onclick="A.learn('${x.id}')" ${talentFree() < TALENT_COST[tier] ? "disabled" : ""}>Стать ${tier ? "мастером" : "новичком"} за ${TALENT_COST[tier]} ✨ → +${x.v[tier]}${x.unit}</button>` : `<span class="lock good">Максимум</span>`}</div>`;
      }).join("") + `<button class="btn" onclick="A.resetTalents()">Сбросить таланты за 10 💎</button>` + back();
  },

  dogs() {
    return head("Псы", ICON2.dog(), `Активный пёс помогает в драках. Корми раз в ${HUNGRY_H} ч, иначе он ослабнет, а через ${SICK_H} ч заболеет.`) +
      `<h4 class="sub">Выбранный пёс</h4>` +
      (activeDog() ? dogRow(S.dog, true) : `<div class="paper small center">Пока никого. Загляни на псарню ниже.</div>`) +
      `<h4 class="sub">Вольер (${S.dogs.length}/${KENNEL_MAX})</h4>` +
      (S.dogs.map((d, i) => i === S.dog ? "" : dogRow(i, false)).join("") || `<div class="paper small center">Пусто</div>`) +
      `<h4 class="sub">Псарня</h4>` + DOG_BREEDS.map(b => `<div class="card ${S.level < b.lvl ? "locked" : ""}"><div class="sysicon sm">${sv("0 0 64 64", dogHead(b))}</div>
        <div class="cbody"><b>${b.name}</b><small>Сила породы ${b.atk} · щенок 1 ур.</small></div>
        ${S.level < b.lvl ? lockTag(b.lvl) : `<button class="btn sm" onclick="A.buyDog('${b.id}')">$${short(b.price)}</button>`}</div>`).join("") + back();
  },

  crafts() {
    return head("Ремёсла", ICON2.craft(), "Делай расходники — они попадают в сумку. Опыт ремесла ускоряет работу и увеличивает выход.") +
      PROFS.map(p => {
        const c = S.crafts[p.id], ready = c && Date.now() >= c.until;
        return `<div class="paper"><div class="row"><div class="sysicon sm">${ICON2.item(p.item)}</div><div><b>${p.name}</b> <small>ур. ${profLvl(p.id)}</small><small class="block">${p.itemName} — ${p.desc}</small></div></div>
          <div class="small muted">Стоимость $${fmt(p.cost)} · ${craftMins(p)} мин · выход ×${craftYield(p)} · в сумке: ${S.bag[p.item] || 0}</div>
          ${!c ? `<button class="btn" onclick="A.craft('${p.id}')">Начать работу</button>` : ready ? `<button class="btn green" onclick="A.collectCraft('${p.id}')">Забрать ${c.n} × ${p.itemName}</button>` :
            `<div class="timerbar"><i style="width:${100 - (c.until - Date.now()) / (craftMins(p) * 600)}%"></i><span>⏳ ${fmtDur((c.until - Date.now()) / 1000)}</span></div>`}</div>`;
      }).join("") + back();
  },

  bag() {
    const cons = PROFS.filter(p => S.bag[p.item]);
    return topbar() + `<div class="screenhead">Сумка</div>` +
      `<h4 class="sub">Расходники</h4>` + (cons.length ? cons.map(p => `<div class="card"><div class="sysicon sm">${ICON2.item(p.item)}</div><div class="cbody"><b>${p.itemName} × ${S.bag[p.item]}</b><small>${p.desc}</small></div>
        <button class="btn sm green" onclick="A.useItem('${p.item}')">Использовать</button></div>`).join("") : `<div class="paper small center">Пусто. Расходники делаются в «Ремёслах» и приходят в подарок от друзей.</div>`) +
      (S.buffs.ammo || S.buffs.alibi ? `<div class="paper small">Активно: ${S.buffs.ammo ? `патроны (${S.buffs.ammo}) ` : ""}${S.buffs.alibi ? "· алиби" : ""}</div>` : "") +
      `<h4 class="sub">Снаряжение (${S.owned.length})</h4>` + (S.owned.length ? S.owned.map(id => { const it = item(id), on = S.gear[it.slot] === id;
        return `<div class="card"><div class="cico">${it.icon}</div><div class="cbody"><b>${it.name}</b><small>${[it.atk && "⚔️+" + it.atk, it.def && "🛡️+" + it.def, it.agi && "🎯+" + it.agi].filter(Boolean).join(" ")}</small></div>
        ${on ? `<span class="lock good">Надето</span>` : `<button class="btn sm" onclick="A.equip('${id}')">Надеть</button>`}</div>`; }).join("") : `<div class="paper small center">Загляни к барыге.</div>`) +
      `<button class="btn" onclick="go('shop')">🧥 К барыге</button>`;
  },

  gifts() {
    const fr = NPCS.filter(n => isFriend(n.id));
    return head("Подарки", ICON2.gift(), "Друзья в городе (отношение 61+) раз в день присылают подарок") +
      (fr.length ? fr.map(n => { const got = S.giftsDay[n.id] === today();
        return `<div class="card"><div class="cico face">${ART.npc(n)}</div><div class="cbody"><b>${n.name}</b><small>${got ? "Подарок получен — завтра будет новый" : "Подарок: " + giftFor(n.id).label}</small></div>
        ${got ? `<span class="lock">⏳ ${fmtDur(toMidnight())}</span>` : `<button class="btn sm green" onclick="A.claimGift('${n.id}')">Забрать</button>`}</div>`; }).join("")
        : `<div class="paper small center">Пока друзей нет. Знакомься и общайся в «Людях города».</div>`) +
      `<button class="btn" onclick="go('people')">👥 Люди города</button>` + back();
  },

  notes() {
    return head("Заметки", ICON2.notes(), "Личные записи. Хранятся только в этом браузере.") +
      `<div class="paper"><textarea id="notes" class="notes" maxlength="2000" placeholder="Кому должен, кто должен тебе, планы на вечер…" oninput="A.saveNotes(this.value)">${esc(S.notes)}</textarea></div>` + back();
  }
};

function dogRow(i, big) {
  const d = S.dogs[i], b = breed(d.breed), st = dogState(d);
  const stTxt = { fed: `<span class="good">сытый</span>`, hungry: `<span class="bad">голодный</span>`, sick: `<span class="bad">болеет</span>` }[st];
  const left = Math.max(0, d.fed + HUNGRY_H * H - Date.now()) / 1000;
  return `<div class="card col dogcard"><div class="row"><div class="sysicon ${big ? "" : "sm"}">${sv("0 0 64 64", dogHead(b))}</div>
    <div class="cbody"><b>${esc(d.name)}</b><small>${b.name}, ${d.lvl} ур. — ${stTxt}${st === "fed" ? ` · покормить через ${fmtDur(left)}` : ""}</small>
    <small>Бонус: ⚔️+${dogPower(d)} 🛡️+${Math.round(dogPower(d) / 2)} · опыт ${d.xp}/${dogXpNeed(d)}</small><div class="mbar"><i style="width:${d.xp / dogXpNeed(d) * 100}%"></i></div></div></div>
    <div class="btnrow">${i !== S.dog ? `<button class="btn sm" onclick="A.pickDog(${i})">✔ Выбрать</button>` : ""}
      ${st === "sick" ? `<button class="btn sm green" onclick="A.vetDog(${i})">Ветеринар $${short(vetPrice(d))}</button>` : `<button class="btn sm ${st === "hungry" ? "green" : ""}" onclick="A.feedDog(${i})">Покормить $${short(feedPrice(d))}</button>`}
      <button class="btn sm red" onclick="A.freeDog(${i})">✖ Отдать</button></div></div>`;
}

// --- полоса городских событий (как на главном экране)
function eventsStrip() {
  const ev = [];
  const spin = S.lastSpin !== today();
  ev.push({ icon: ART.tile("casino"), label: "Колесо удачи", timer: spin ? "готово" : fmtDur(toMidnight()), to: "casino", hot: spin });
  const bon = S.lastBonus !== today();
  ev.push({ icon: ICON2.gift(), label: "Бонус дня", timer: bon ? "забрать" : fmtDur(toMidnight()), to: "hub", act: bon ? "A.bonus()" : "", hot: bon });
  const inc = incomePerHour();
  if (inc) { const cap = inc * INCOME_CAP_H, left = (cap - S.pending) / inc * 3600; ev.push({ icon: ART.tile("points"), label: "Сбор с точек", timer: "$" + short(S.pending), to: "points", hot: S.pending >= cap * 0.5, sub: left > 1 ? "полно через " + fmtDur(left) : "склад полон" }); }
  const bosses = DATA.bosses.filter(b => S.level >= b.lvl);
  if (bosses.length) { const states = bosses.map(bossState), alive = states.some(s => !s.dead), soon = Math.min(...states.filter(s => s.dead).map(s => s.left)); ev.push({ icon: ART.tile("raids"), label: "Рейды", timer: alive ? "открыты" : fmtDur(soon), to: "raids", hot: alive }); }
  const cr = PROFS.map(p => S.crafts[p.id]).filter(Boolean);
  ev.push({ icon: ICON2.craft(), label: "Ремёсла", timer: !cr.length ? "свободно" : cr.some(c => Date.now() >= c.until) ? "готово" : fmtDur(Math.min(...cr.map(c => (c.until - Date.now()) / 1000))), to: "crafts", hot: !cr.length || cr.some(c => Date.now() >= c.until) });
  const d = activeDog();
  ev.push({ icon: ICON2.dog(d ? d.breed : "mutt"), label: d ? d.name : "Псарня", timer: !d ? "завести" : dogState(d) === "fed" ? fmtDur(Math.max(0, d.fed + HUNGRY_H * H - Date.now()) / 1000) : "покормить", to: "dogs", hot: !d || dogState(d) !== "fed" });
  const g = giftsReady().length;
  if (g) ev.push({ icon: ICON2.gift(), label: "Подарки друзей", timer: g + " шт.", to: "gifts", hot: true });
  return `<div class="events">${ev.map(e => `<button class="evt${e.hot ? " hot" : ""}" onclick="${e.act || `go('${e.to}')`}"><div class="evicon">${e.icon}</div><span class="evtimer">${e.hot ? "● " : "⏱ "}${e.timer}</span><span class="evlabel">${e.label}</span></button>`).join("")}</div>`;
}

// --- нижняя панель навигации
function navbar() {
  const sb = sysBadges(), b = badges();
  const items = [
    ["map", "Карта", ICON2.map(), b.districts],
    ["hub", "Город", ICON2.city(), ""],
    ["profile", "Профиль", ART.hero(S), sb.profile],
    ["crew", "Бригада", ICON2.crew(), ""],
    ["bag", "Сумка", ICON2.bag(), PROFS.reduce((a, p) => a + (S.bag[p.item] || 0), 0) || ""]
  ];
  const cur = { districts: "map", map: "map", hub: "hub", profile: "profile", crew: "crew", bag: "bag" }[screen];
  return `<nav class="navbar">${items.map(([id, t, ic, bd]) => `<button class="nav${cur === id ? " on" : ""}" onclick="go('${id}')">
    ${bd ? `<span class="badge">${bd}</span>` : ""}<span class="navicon${id === "profile" ? " hero" : ""}">${ic}</span>${id === "profile" ? `<span class="navlv">${S.level} ур.</span>` : ""}<span class="navt">${t}</span></button>`).join("")}</nav>`;
}

// --- раздел «Прочее» и «Эффекты» в профиле
function profileExtras() {
  const sb = sysBadges(), r = rankOf(), fx = effectsList();
  const icoFx = { rank: ICON2.rank, dog: () => ICON2.dog(activeDog() ? activeDog().breed : "mutt"), talent: ICON2.talent, people: ICON2.people, home: ICON2.city, craft: ICON2.craft };
  return `<div class="sectitle">Эффекты</div><div class="paper darkpaper fxlist">${fx.length ? fx.map(([k, n, t]) => `<div class="fx"><span class="fxi">${icoFx[k]()}</span><b>${n}</b> <span class="good">${t}</span></div>`).join("") : `<div class="muted">Пока никаких бонусов. Ранги, таланты, псы и друзья дают постоянные эффекты.</div>`}</div>
    <div class="sectitle">Прочее</div>
    <div class="sysgrid">
      ${sysTile(ICON2.dog(activeDog() ? activeDog().breed : "rott"), "Псы", "dogs", sb.dog)}
      ${sysTile(ICON2.craft(), "Ремёсла", "crafts", sb.crafts)}
      ${sysTile(ICON2.gift(), "Подарки", "gifts", sb.gifts)}
      ${sysTile(ICON2.people(), "Люди", "people", meetableCount())}
      ${sysTile(ICON2.rank(), "Ранги", "ranks", sb.rankUp)}
      ${sysTile(ICON2.ach(), "Достижения", "achievements", sb.ach)}
      ${sysTile(ICON2.talent(), "Таланты", "talents", sb.tal)}
      ${sysTile(ICON2.notes(), "Заметки", "notes", "")}
    </div>`;
}
