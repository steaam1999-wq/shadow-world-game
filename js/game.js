// EMPIRE CITY — игровая логика (локальная демо-версия, прогресс в localStorage)
"use strict";

const SAVE_KEY = "empire_city_v1";
const ENERGY_REGEN_SEC = 20;   // 1 энергия за 20 секунд
const HP_REGEN_SEC = 6;        // 1 здоровье за 6 секунд
const INCOME_CAP_H = 12;       // точки копят доход максимум 12 часов
const BOSS_RESPAWN_MS = 30 * 60 * 1000;

const $ = sel => document.querySelector(sel);
const app = () => $("#app");

// ---------- Утилиты ----------
const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => Math.floor(n).toLocaleString("ru-RU");
function short(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(".0", "") + "b";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "m";
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(".0", "") + "k";
  return fmt(n);
}
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }

// ---------- Состояние ----------
function newState(name) {
  return {
    v: 1, name, created: Date.now(), last: Date.now(),
    level: 1, xp: 0, points: 0,
    cash: 2500, gold: 5, safe: 0,
    energy: 50, hp: 150,
    stats: { str: 5, def: 5, agi: 5, end: 5 },
    rep: { street: 0, law: 0 },
    authBase: 0,
    gear: { weapon: null, armor: null, extra: null }, owned: [],
    biz: {}, pending: 0,
    home: 0, furniture: [],
    districts: {},
    crew: 0,
    bosses: {}, bossKills: {},
    story: 0,
    jobsTotal: 0, mastery: {},
    wins: 0, losses: 0,
    lastSpin: "", lastBonus: "",
    enAcc: 0, hpAcc: 0,
    log: []
  };
}

let S = null;

function load() {
  try { S = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { S = null; }
  if (S) S = Object.assign(newState(S.name), S);
}
function save() { if (S) { S.last = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } }

// ---------- Производные параметры ----------
const item = id => DATA.items.find(i => i.id === id);
const hasF = id => S.furniture.includes(id);
function gearSum(key) { return ["weapon", "armor", "extra"].reduce((a, sl) => a + ((S.gear[sl] && item(S.gear[sl])[key]) || 0), 0); }
function furnSum(key) { return DATA.furniture.reduce((a, f) => a + (hasF(f.id) ? (f[key] || 0) : 0), 0); }

const totStr = () => S.stats.str + furnSum("str");
const totAgi = () => S.stats.agi + furnSum("agi") + gearSum("agi");
const maxHp  = () => 100 + S.stats.end * 10;
const maxEn  = () => 50 + (S.level - 1) * 2 + DATA.homes[S.home].en + furnSum("en");
const atk    = () => totStr() * 2 + gearSum("atk") + S.crew * 3;
const def    = () => S.stats.def * 2 + gearSum("def") + S.crew * 3;
const safeCap = () => DATA.homes[S.home].safe * (hasF("safe") ? 2 : 1);
const xpNeed = l => Math.round(40 * Math.pow(l, 1.45));
function authority(s) {
  s = s || S;
  const d = DATA.districts.reduce((a, x) => a + (s.districts[x.id] ? x.auth : 0), 0);
  const g = ["weapon", "armor", "extra"].reduce((a, sl) => a + ((s.gear[sl] && item(s.gear[sl]).auth) || 0), 0);
  return s.authBase + d + g + s.home * 15;
}
function incomePerHour() {
  const b = DATA.biz.reduce((a, x) => a + (S.biz[x.id] || 0) * x.inc, 0);
  const d = DATA.districts.reduce((a, x) => a + (S.districts[x.id] ? x.inc : 0), 0);
  return b + d;
}
const bizPrice = b => Math.round(b.price * Math.pow(1.15, S.biz[b.id] || 0));
const statPrice = v => Math.round(40 * Math.pow(v, 1.45));
const crewPrice = () => Math.round(500 * Math.pow(S.crew + 1, 1.5));
const crewMax = () => S.level + 2;

// ---------- Время: регенерация и доход ----------
function tick() {
  if (!S) return;
  const now = Date.now();
  let dt = (now - S.last) / 1000;
  if (dt <= 0) return;
  S.last = now;

  if (S.energy < maxEn()) {
    S.enAcc += dt;
    const g = Math.floor(S.enAcc / ENERGY_REGEN_SEC);
    if (g > 0) { S.energy = Math.min(maxEn(), S.energy + g); S.enAcc -= g * ENERGY_REGEN_SEC; }
  } else S.enAcc = 0;

  const hpRate = HP_REGEN_SEC / (hasF("sofa") ? 2 : 1);
  if (S.hp < maxHp()) {
    S.hpAcc += dt;
    const g = Math.floor(S.hpAcc / hpRate);
    if (g > 0) { S.hp = Math.min(maxHp(), S.hp + g); S.hpAcc -= g * hpRate; }
  } else S.hpAcc = 0;

  const inc = incomePerHour();
  S.pending = Math.min(inc * INCOME_CAP_H, S.pending + inc * dt / 3600);
}

// ---------- Награды и уровень ----------
function addLog(t) { S.log.unshift({ t: Date.now(), m: t }); S.log.length = Math.min(S.log.length, 40); }

function give(r) {
  const parts = [];
  if (r.cash) { S.cash += r.cash; parts.push("+$" + fmt(r.cash)); }
  if (r.gold) { S.gold += r.gold; parts.push("+" + r.gold + " 💎"); }
  if (r.auth) { S.authBase += r.auth; parts.push("+" + r.auth + " 🤘"); }
  if (r.energyFull) { S.energy = Math.max(S.energy, maxEn()); parts.push("⚡ энергия полная"); }
  if (r.xp) { parts.push("+" + r.xp + " ⭐"); addXp(r.xp); }
  return parts.join(" · ");
}

function addXp(x) {
  S.xp += x;
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level);
    S.level++;
    S.points += 3;
    S.gold += 2;
    S.energy = maxEn();
    S.hp = maxHp();
    addLog("Новый уровень " + S.level + "! +3 очка параметров, +2 💎");
    setTimeout(() => modal(`<div class="big">🎉</div><h3>Уровень ${S.level}!</h3><p>Энергия и здоровье восстановлены.<br>+3 очка параметров · +2 💎</p>${unlocksText(S.level)}`), 50);
  }
}

function unlocksText(l) {
  const u = [];
  DATA.jobs.filter(j => j.lvl === l).forEach(j => u.push(j.icon + " движуха «" + j.name + "»"));
  DATA.biz.filter(b => b.lvl === l).forEach(b => u.push(b.icon + " точка «" + b.name + "»"));
  DATA.districts.filter(d => d.lvl === l).forEach(d => u.push(d.icon + " район " + d.name));
  DATA.bosses.filter(b => b.lvl === l).forEach(b => u.push(b.icon + " рейд на «" + b.name + "»"));
  return u.length ? `<p class="small"><b>Открыто:</b><br>${u.join("<br>")}</p>` : "";
}

// ---------- Бой ----------
function makeFighter(o) {
  return { name: o.name, hp: o.hp, maxHp: o.hp, atk: o.atk, def: o.def, agi: o.agi || 0 };
}
function playerFighter() {
  return { name: S.name, hp: S.hp, maxHp: maxHp(), atk: atk(), def: def(), agi: totAgi() };
}
function hit(a, b) {
  const dodge = b.agi / (b.agi + 120);
  if (Math.random() < dodge) return { dmg: 0, txt: `${b.name} уходит от удара` };
  const crit = Math.random() < a.agi / (a.agi + 90);
  let dmg = Math.max(1, Math.round(Math.max(a.atk * 0.15, a.atk * (0.8 + Math.random() * 0.4) - b.def * 0.6)));
  if (crit) dmg = Math.round(dmg * 1.8);
  b.hp -= dmg;
  return { dmg, txt: `${a.name} бьёт ${crit ? "<b>критом</b> " : ""}на <b>${dmg}</b>` };
}
function battle(p, e, rounds) {
  const log = [];
  for (let r = 1; r <= rounds && p.hp > 0 && e.hp > 0; r++) {
    log.push(hit(p, e).txt);
    if (e.hp <= 0) break;
    log.push(hit(e, p).txt);
  }
  p.hp = Math.max(0, p.hp); e.hp = Math.max(0, e.hp);
  const win = e.hp <= 0 || (p.hp > 0 && p.hp / p.maxHp > e.hp / e.maxHp);
  return { win, log };
}

function genOpponents() {
  const list = [];
  for (let i = 0; i < 4; i++) {
    const l = Math.max(1, S.level + rnd(-2, 2));
    const pts = 20 + (l - 1) * 3;
    const str = Math.round(pts * (0.2 + Math.random() * 0.15));
    const df = Math.round(pts * (0.2 + Math.random() * 0.15));
    const agi = Math.round(pts * (0.15 + Math.random() * 0.15));
    const end = Math.max(3, pts - str - df - agi);
    const gear = (0.6 + Math.random() * 0.6) * (l * 2.4 + l * l * 0.05);
    list.push({
      name: DATA.nicks[rnd(0, DATA.nicks.length - 1)], level: l,
      hp: 100 + end * 10 + l * 8, atk: Math.round(str * 2 + gear * 1.1), def: Math.round(df * 2 + gear), agi,
      seed: rnd(1, 1e9)
    });
  }
  S._opps = list;
}
const power = f => Math.round(f.atk * 1.2 + f.def + f.hp / 10 + (f.agi || 0));

// ---------- Действия ----------
function needEnergy(n) {
  if (S.energy >= n) return true;
  toast("Не хватает энергии ⚡ (нужно " + n + ")", "bad");
  return false;
}
function needCash(n) {
  if (S.cash >= n) return true;
  toast("Не хватает денег: нужно $" + fmt(n), "bad");
  return false;
}
function needHp() {
  if (S.hp >= maxHp() * 0.2) return true;
  toast("Слишком мало здоровья ❤️. Отдохни или подлечись.", "bad");
  return false;
}

const A = {
  job(id) {
    const j = DATA.jobs.find(x => x.id === id);
    if (S.level < j.lvl || !needEnergy(j.en)) return;
    S.energy -= j.en;
    const fail = Math.random() < Math.max(0.02, j.risk - totAgi() / 400);
    if (fail) {
      const loss = Math.min(S.hp - 1, rnd(5, 15) + j.lvl);
      S.hp -= loss;
      addXp(Math.ceil(j.xp / 3));
      toast(`${j.icon} Сорвалось! −${loss} ❤️, но опыт есть: +${Math.ceil(j.xp / 3)} ⭐`, "bad");
    } else {
      const m = S.mastery[id] || 0;
      const bonus = 1 + Math.floor(m / 100) * 0.25;
      const cash = Math.round(rnd(j.cash[0], j.cash[1]) * bonus);
      const xp = Math.round(j.xp * (hasF("tv") ? 1.1 : 1));
      S.mastery[id] = m + 10;
      S.rep[j.side]++;
      S.authBase += 1;
      S.jobsTotal++;
      const r = give({ cash, xp });
      toast(`${j.icon} ${j.name}: ${r}${(m + 10) % 100 === 0 ? " · Мастерство ↑ (+25% к доходу)" : ""}`);
    }
    save(); render();
  },

  fight(i) {
    const o = S._opps && S._opps[i];
    if (!o || !needHp() || !needEnergy(5)) return;
    S.energy -= 5;
    const p = playerFighter(), e = makeFighter(o);
    const res = battle(p, e, 8);
    S.hp = Math.max(1, p.hp);
    let summary;
    if (res.win) {
      S.wins++; S.rep.street++;
      const cash = o.level * rnd(40, 90);
      summary = give({ cash, xp: 4 + o.level, auth: rnd(1, 3) });
      addLog(`Победа над ${o.name} [${o.level}]: ${summary}`);
    } else {
      S.losses++;
      const lost = Math.round(S.cash * 0.1);
      S.cash -= lost;
      addXp(1);
      summary = `−$${fmt(lost)} (наличные не в сейфе)`;
      addLog(`Поражение от ${o.name} [${o.level}]`);
    }
    genOpponents();
    save(); render();
    modal(`<div class="versus"><div>${ART.hero(S)}</div><b>VS</b><div>${ART.opponent(o.seed)}</div></div><h3>${res.win ? "🏆 Победа!" : "🤕 Поражение"}</h3>
      <p class="small">${esc(S.name)} ❤️${p.hp}/${p.maxHp} &nbsp;vs&nbsp; ${esc(o.name)} ❤️${e.hp}/${e.maxHp}</p>
      <div class="fightlog">${res.log.map(l => "<div>" + l + "</div>").join("")}</div><p><b>${summary}</b></p>`);
  },

  refreshOpps() { genOpponents(); render(); },

  train(stat) {
    const p = statPrice(S.stats[stat]);
    if (!needCash(p)) return;
    S.cash -= p; S.stats[stat]++;
    if (stat === "end") S.hp += 10;
    toast("Тренировка: +1 к параметру"); save(); render();
  },
  point(stat) {
    if (S.points <= 0) return;
    S.points--; S.stats[stat]++;
    if (stat === "end") S.hp += 10;
    save(); render();
  },

  buyItem(id) {
    const it = item(id);
    if (S.level < it.lvl || S.owned.includes(id) || !needCash(it.price)) return;
    S.cash -= it.price; S.owned.push(id);
    const cur = S.gear[it.slot] && item(S.gear[it.slot]);
    if (!cur || cur.price < it.price) S.gear[it.slot] = id;
    toast(`${it.icon} ${it.name} куплен${cur && cur.price >= it.price ? "" : " и надет"}`);
    save(); render();
  },
  equip(id) { const it = item(id); S.gear[it.slot] = id; save(); render(); },

  buyBiz(id) {
    const b = DATA.biz.find(x => x.id === id), p = bizPrice(b);
    if (S.level < b.lvl || !needCash(p)) return;
    S.cash -= p; S.biz[id] = (S.biz[id] || 0) + 1; S.authBase += 2;
    toast(`${b.icon} ${b.name}: теперь ${S.biz[id]} шт. (+$${fmt(b.inc)}/ч)`); save(); render();
  },
  collect() {
    const v = Math.floor(S.pending);
    if (v <= 0) return toast("Пока нечего собирать");
    S.pending -= v; S.cash += v;
    toast("Собрано с точек: +$" + fmt(v)); save(); render();
  },

  buyHome(i) {
    const h = DATA.homes[i];
    if (i !== S.home + 1 || S.level < h.lvl || !needCash(h.price)) return;
    S.cash -= h.price; S.home = i; S.energy = maxEn();
    addLog("Переезд: " + h.name);
    toast("🏠 Переезд! " + h.name); save(); render();
  },
  buyFurn(id) {
    const f = DATA.furniture.find(x => x.id === id);
    if (hasF(id) || !needCash(f.price)) return;
    S.cash -= f.price; S.furniture.push(id);
    toast(f.icon + " " + f.name + " теперь в хате"); save(); render();
  },

  capture(id) {
    const d = DATA.districts.find(x => x.id === id);
    if (S.districts[id] || S.level < d.lvl || !needHp() || !needEnergy(20)) return;
    S.energy -= 20;
    const p = playerFighter(), e = makeFighter({ name: d.boss, hp: d.hp, atk: d.atk, def: d.def, agi: d.lvl * 2 });
    const res = battle(p, e, 12);
    S.hp = Math.max(1, p.hp);
    let msg;
    if (res.win) {
      S.districts[id] = Date.now(); S.wins++; S.rep.street += 5;
      msg = give({ cash: d.inc * 3, xp: 25 + d.lvl * 6 });
      addLog(`Район ${d.name} теперь твой!`);
    } else { S.losses++; addXp(3); msg = "Отступил. Подкачайся, обновись у барыги или найми людей."; }
    save(); render();
    modal(`<div class="big">${res.win ? d.icon : "🚑"}</div><h3>${res.win ? d.name + " под контролем!" : "Захват сорвался"}</h3>
      <p class="small">${esc(d.boss)}: ❤️${e.hp}/${e.maxHp}</p><div class="fightlog">${res.log.map(l => "<div>" + l + "</div>").join("")}</div><p><b>${msg}</b></p>`);
  },

  raid(id) {
    const b = DATA.bosses.find(x => x.id === id);
    const st = bossState(b);
    if (S.level < b.lvl || st.dead || !needHp() || !needEnergy(10)) return;
    S.energy -= 10;
    const p = playerFighter(), e = makeFighter({ name: b.name, hp: st.hp, atk: b.atk, def: b.def, agi: b.lvl });
    e.maxHp = b.hp;
    const before = st.hp;
    const res = battle(p, e, 3);
    S.hp = Math.max(1, p.hp);
    const dealt = before - e.hp;
    S.bosses[id] = { hp: e.hp, t: Date.now() };
    let extra = "";
    if (e.hp <= 0) {
      S.bossKills[id] = (S.bossKills[id] || 0) + 1;
      S.bosses[id] = { hp: 0, t: Date.now(), dead: Date.now() };
      extra = "<p><b>Босс повержен! " + give({ cash: b.cash, xp: b.xp, gold: b.gold, auth: 10 }) + "</b></p>";
      addLog(`Рейд: ${b.name} повержен`);
    } else addXp(2);
    save(); render();
    modal(`<div class="versus"><div>${ART.hero(S)}</div><b>VS</b><div>${ART.boss(b.id)}</div></div><h3>Нанесено ${fmt(dealt)} урона</h3>
      <div class="fightlog">${res.log.map(l => "<div>" + l + "</div>").join("")}</div>
      <p class="small">У босса осталось ❤️ ${fmt(e.hp)} / ${fmt(b.hp)}</p>${extra}`);
  },

  hire() {
    if (S.crew >= crewMax()) return toast("Больше людей сейчас не потянешь — нужен уровень выше", "bad");
    const p = crewPrice();
    if (!needCash(p)) return;
    S.cash -= p; S.crew++; S.authBase += 3;
    toast("🧍 В бригаде пополнение: " + S.crew + " чел."); save(); render();
  },

  deposit(all) {
    const room = safeCap() - S.safe;
    const v = Math.min(room, all ? S.cash : Math.min(S.cash, 1000));
    if (v <= 0) return toast(room <= 0 ? "Сейф полон — нужна хата побольше или сейф" : "Нечего класть", "bad");
    S.cash -= v; S.safe += v; toast("В сейф: $" + fmt(v)); save(); render();
  },
  withdraw(all) {
    const v = all ? S.safe : Math.min(S.safe, 1000);
    if (v <= 0) return;
    S.safe -= v; S.cash += v; toast("Из сейфа: $" + fmt(v)); save(); render();
  },

  spin() {
    if (S.lastSpin === today()) return toast("Колесо уже крутили сегодня");
    S.lastSpin = today();
    const i = rnd(0, DATA.wheel.length - 1);
    const w = DATA.wheel[i];
    const wheel = $("#wheel");
    if (wheel) {
      const deg = 360 * 5 + (360 - i * 45 - 22.5);
      wheel.style.transform = `rotate(${deg}deg)`;
    }
    setTimeout(() => { const r = give(w.give); save(); render(); modal(`<div class="big">🎡</div><h3>Выпало: ${w.label}</h3><p>${r}</p>`); }, wheel ? 2600 : 0);
    save();
  },
  slots(bet) {
    if (!needCash(bet)) return;
    S.cash -= bet;
    const sym = ["🍒", "🍋", "🔔", "💎", "7️⃣", "⭐"];
    const r = [0, 0, 0].map(() => sym[rnd(0, sym.length - 1)]);
    let mult = 0;
    if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === "7️⃣" ? 20 : r[0] === "💎" ? 12 : 6;
    else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1.5;
    const win = Math.round(bet * mult);
    S.cash += win;
    save(); render();
    if (!$("#reels")) return;
    $("#reels").textContent = r.join(" ");
    $("#slotres").innerHTML = win ? `<b class="good">Выигрыш $${fmt(win)}!</b>` : "Мимо. Повезёт в другой раз.";
  },

  story() {
    const q = DATA.story[S.story];
    if (!q || !q.check(S)) return;
    S.story++;
    const r = give(q.reward);
    addLog("Связи: «" + q.title + "» выполнено");
    save(); render();
    modal(`<div class="portrait">${ART.contact(q.who)}</div><h3>${q.title}</h3><p>Задание выполнено.</p><p><b>${r}</b></p>`);
  },

  bonus() {
    if (S.lastBonus === today()) return;
    S.lastBonus = today();
    const r = give({ cash: 300 * S.level, gold: 1, energyFull: true });
    save(); render(); modal(`<div class="big">🎁</div><h3>Ежедневный бонус</h3><p>${r}</p>`);
  },

  refill() {
    if (S.gold < 5) return toast("Нужно 5 💎", "bad");
    if (S.energy >= maxEn()) return toast("Энергия и так полная");
    S.gold -= 5; S.energy = maxEn(); toast("⚡ Энергия восстановлена"); save(); render();
  },
  heal() {
    if (S.hp >= maxHp()) return toast("Здоровье полное");
    const p = Math.max(100, Math.round((maxHp() - S.hp) * 3 * (1 + S.level / 10)));
    if (!needCash(p)) return;
    S.cash -= p; S.hp = maxHp(); toast("❤️ Подлечился за $" + fmt(p)); save(); render();
  },

  reset() {
    if (!confirm("Сбросить весь прогресс? Это нельзя отменить.")) return;
    localStorage.removeItem(SAVE_KEY); S = null; go("start");
  }
};

function bossState(b) {
  const st = S.bosses[b.id];
  if (!st) return { hp: b.hp };
  if (st.dead) {
    if (Date.now() - st.dead > BOSS_RESPAWN_MS) { delete S.bosses[b.id]; return { hp: b.hp }; }
    return { hp: 0, dead: true, left: (BOSS_RESPAWN_MS - (Date.now() - st.dead)) / 1000 };
  }
  return { hp: st.hp };
}

// ---------- Уведомления ----------
function badges() {
  const b = {};
  if (S.pending >= 1) b.points = "$";
  const q = DATA.story[S.story];
  if (q && q.check(S)) b.contacts = 1;
  if (S.lastSpin !== today()) b.casino = 1;
  if (S.points > 0) b.profile = S.points;
  const opd = DATA.districts.filter(d => !S.districts[d.id] && S.level >= d.lvl).length;
  if (opd) b.districts = opd;
  return b;
}

// ---------- UI-компоненты ----------
let toastTimer;
function toast(msg, kind) {
  const t = $("#toast");
  t.innerHTML = msg; t.className = "toast show " + (kind || "");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = "toast", 2600);
}
function modal(html) {
  $("#modal .box").innerHTML = html + `<button class="btn" onclick="closeModal()">Ок</button>`;
  $("#modal").classList.add("show");
}
function closeModal() { $("#modal").classList.remove("show"); }

function topbar() {
  const enT = S.energy < maxEn() ? `<i id="tbT">${mmss(ENERGY_REGEN_SEC - S.enAcc)}</i>` : "";
  return `<div class="topbar">
    <button class="res" onclick="A.refill()" title="Восстановить за 5 💎">${ART.ICONS.energy}<b id="tbEn">${S.energy}/${maxEn()}</b>${enT}</button>
    <button class="res" onclick="A.heal()" title="Подлечиться">${ART.ICONS.hp}<b>${S.hp}/${maxHp()}</b></button>
    <span class="res">${ART.ICONS.cash}<b>${short(S.cash)}</b></span>
    <span class="res">${ART.ICONS.gold}<b>${S.gold}</b></span>
  </div>`;
}
function head(title, icon, sub) {
  return topbar() + `<div class="sechead"><span class="secicon">${ART.hasTile(icon) ? ART.tile(icon) : icon}</span><div><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ""}</div></div>`;
}
const back = () => `<button class="btn back" onclick="go('hub')">← В город</button>`;
function lockTag(l) { return `<span class="lock">🔒 с ${l} ур.</span>`; }

function room() {
  return `<div class="room">${ART.room(S, DATA.homes)}<div class="roomcaption">${DATA.homes[S.home].name}</div></div>`;
}

// ---------- Экраны ----------
let screen = "start";
function go(s) { screen = s; render(); window.scrollTo(0, 0); }

const SCREENS = {
  start() {
    const has = !!S;
    return `<div class="start">
      <div class="sunset">${ART.startScene()}<div class="logo">EMPIRE<span>CITY</span></div></div>
      <div class="startbox">
        <p>Готов приехать в большой город<br>и построить свою империю?</p>
        ${has ? `<button class="btn green" onclick="go('hub')">Продолжить за ${esc(S.name)}</button><p class="small">или начни заново:</p>` : ""}
        <input id="nameIn" maxlength="18" placeholder="Кличка персонажа" value="${has ? "" : "Алекс"}">
        <button class="btn ${has ? "" : "green"}" onclick="startGame()">Начать игру</button>
        <p class="small muted">Локальная демо-версия. Прогресс хранится в этом браузере.</p>
      </div>
    </div>`;
  },

  hub() {
    const b = badges();
    const tile = (id, icon, name) => `<button class="tile" onclick="go('${id}')">${b[id] ? `<span class="badge">${b[id]}</span>` : ""}<div class="art">${ART.tile(id)}</div><div class="txt">${name}</div></button>`;
    const pct = Math.floor(S.xp / xpNeed(S.level) * 100);
    const bonus = S.lastBonus !== today();
    return topbar() + `
    <div class="cityhead"><div class="logo sm">EMPIRE<span>CITY</span></div><small>${DATA.homes[S.home].name}</small></div>
    <div class="menugrid">
      ${tile("points", "🏪", "Точки")}${tile("realty", "🏢", "Недвижка")}${tile("districts", "🏙️", "Районы")}
      ${tile("fights", "🥊", "Бои")}${tile("home", "🛋️", "Хата")}${tile("crew", "🧑‍🤝‍🧑", "Бригада")}
      ${tile("jobs", "🏃", "Движухи")}${tile("raids", "⛓️", "Рейды")}${tile("casino", "🎰", "Казино")}
      ${tile("contacts", "📞", "Связи")}${tile("bank", "🏦", "Банк")}${tile("shop", "🧥", "Барыга")}
    </div>
    <button class="promo" onclick="${bonus ? "A.bonus()" : ""}">${bonus ? "🎁 Забери ежедневный бонус: $" + fmt(300 * S.level) + " + 💎 + ⚡" : "★ Бонус получен. Возвращайся завтра ★"}</button>
    <div class="hubbar">
      <button class="photo" onclick="go('profile')">${b.profile ? `<span class="badge">${b.profile}</span>` : ""}<span class="face">${ART.hero(S)}</span><span class="lv">${S.level}</span><span class="cap">Профиль</span></button>
      <div class="hubres">
        <div class="resrow">
          <div class="rbox">${ART.ICONS.energy}<small>${S.energy}/${maxEn()}</small></div>
          <div class="rbox">${ART.ICONS.auth}<small>${short(authority())}</small></div>
          <div class="rbox">${ART.ICONS.cash}<small>${short(S.cash)}</small></div>
          <div class="rbox gold">${ART.ICONS.gold}<small>${S.gold}</small></div>
        </div>
        <div class="xp"><i style="width:${pct}%"></i><span>${short(S.xp)} / ${short(xpNeed(S.level))}</span></div>
      </div>
    </div>
    <div class="links">
      <a onclick="go('log')">📟 Сводки <span class="muted">(${S.log.length})</span></a>
      <a onclick="go('help')">Помощь</a>
      <a onclick="go('start')">Главный экран</a>
      <a onclick="A.reset()">Сбросить прогресс</a>
    </div>
    <div class="copy">EMPIRE CITY · демо 1.0</div>`;
  },

  profile() {
    const wanted = Math.min(5, Math.floor(S.rep.street / 25));
    const pt = st => S.points > 0 ? `<button class="mini" onclick="A.point('${st}')">+</button>` : "";
    const g = sl => S.gear[sl] ? item(S.gear[sl]) : null;
    const gearTxt = ["weapon", "armor", "extra"].map(sl => g(sl) ? `${g(sl).icon} ${g(sl).name}` : "—").join("<br>");
    return topbar() + `
    <div class="wantedbar">${ART.wanted(S, wanted)}</div>
    ${room()}
    <div class="namebar"><span>${esc(S.name)}</span><span>ур. <b class="level">${S.level}</b></span></div>
    <div class="paper">
      <div class="rowstat"><div class="label">Опыт:</div><div class="value">⭐ ${fmt(S.xp)} / ${fmt(xpNeed(S.level))}</div></div>
      <div class="rowstat"><div class="label">Авторитет:</div><div class="value">🤘 ${fmt(authority())}</div></div>
      <div class="rowstat"><div class="label">Наличные:</div><div class="value">💵 ${fmt(S.cash)} &nbsp; 💎 ${S.gold}</div></div>
      <div class="rowstat"><div class="label">В сейфе:</div><div class="value">💵 ${fmt(S.safe)}</div></div>
      <div class="rowstat"><div class="label">Параметры:</div><div class="value col">
        ${S.points > 0 ? `<span class="good">Свободных очков: ${S.points}</span>` : ""}
        <div class="statgrid"><span>💪 Сила ${totStr()} ${pt("str")}</span><span>🛡️ Защита ${S.stats.def} ${pt("def")}</span>
        <span>🎯 Ловк. ${totAgi()} ${pt("agi")}</span><span>❤️ Вынос. ${S.stats.end} ${pt("end")}</span></div>
      </div></div>
      <div class="rowstat"><div class="label">В бою:</div><div class="value">⚔️ ${atk()} &nbsp; 🛡️ ${def()} &nbsp; ❤️ ${maxHp()}</div></div>
      <div class="rowstat"><div class="label">Репутация:</div><div class="value">🧢 улица ${S.rep.street} &nbsp; ⚖️ закон ${S.rep.law}</div></div>
      <div class="rowstat"><div class="label">Снаряга:</div><div class="value">${gearTxt}</div></div>
      <div class="rowstat"><div class="label">Бои:</div><div class="value">🏆 ${S.wins} &nbsp; 🤕 ${S.losses}</div></div>
      <div class="rowstat"><div class="label">Бригада:</div><div class="value">🧍 ${S.crew} чел.</div></div>
      <div class="rowstat"><div class="label">Районы:</div><div class="value">${DATA.districts.filter(d => S.districts[d.id]).map(d => d.icon).join(" ") || "—"}</div></div>
    </div>` + back();
  },

  jobs() {
    return head("Движухи", "jobs", "Работа за энергию. Мастерство каждые 10 раз даёт +25% к доходу.") +
      DATA.jobs.map(j => {
        const lock = S.level < j.lvl;
        const m = S.mastery[j.id] || 0;
        return `<div class="card ${lock ? "locked" : ""}">
          <div class="cico">${j.icon}</div>
          <div class="cbody"><b>${j.name}</b>
            <small>💵 ${fmt(j.cash[0])}–${fmt(j.cash[1])} · ⭐ ${j.xp} · ${j.side === "law" ? "⚖️" : "🧢"}</small>
            <div class="mbar"><i style="width:${m % 100}%"></i></div><small>Мастерство ${Math.floor(m / 100)} ур. · ${m % 100}%</small>
          </div>
          ${lock ? lockTag(j.lvl) : `<button class="btn sm" onclick="A.job('${j.id}')">⚡${j.en}</button>`}
        </div>`;
      }).join("") + back();
  },

  fights() {
    if (!S._opps) genOpponents();
    const me = playerFighter();
    return head("Бои", "fights", "Драка стоит ⚡5. Проиграл — теряешь 10% наличных (сейф не трогают).") +
      `<div class="paper small">Твоя сила: ⚔️ ${me.atk} · 🛡️ ${me.def} · 🎯 ${me.agi} · ❤️ ${S.hp}/${maxHp()} &nbsp; <b>Мощь ${power(me)}</b></div>` +
      S._opps.map((o, i) => {
        const pw = power(o), my = power(me);
        const cls = pw > my * 1.15 ? "bad" : pw < my * 0.85 ? "good" : "";
        return `<div class="card"><div class="cico face">${ART.opponent(o.seed)}</div>
          <div class="cbody"><b>${esc(o.name)}</b> <small>ур. ${o.level}</small><small class="${cls}">Мощь ${pw}</small></div>
          <button class="btn sm red" onclick="A.fight(${i})">Наехать</button></div>`;
      }).join("") +
      `<button class="btn" onclick="A.refreshOpps()">🔄 Других соперников</button>` + back();
  },

  raids() {
    return head("Рейды", "raids", "Боссы с огромным запасом здоровья. Каждый заход ⚡10, урон сохраняется.") +
      DATA.bosses.map(b => {
        const st = bossState(b), lock = S.level < b.lvl;
        const pct = Math.round(st.hp / b.hp * 100);
        return `<div class="card col ${lock ? "locked" : ""}">
          <div class="row"><div class="cico face">${ART.boss(b.id)}</div><div class="cbody"><b>${b.name}</b>
            <small>Награда: $${fmt(b.cash)} · ⭐${b.xp} · 💎${b.gold} · побед: ${S.bossKills[b.id] || 0}</small></div>
          ${lock ? lockTag(b.lvl) : st.dead ? `<span class="lock">⏳ ${mmss(st.left)}</span>` : `<button class="btn sm red" onclick="A.raid('${b.id}')">⚡10</button>`}</div>
          <div class="hpbar"><i style="width:${pct}%"></i><span>❤️ ${fmt(st.hp)} / ${fmt(b.hp)}</span></div>
        </div>`;
      }).join("") + back();
  },

  districts() {
    return head("Районы", "districts", "Захвати район — получай доход и авторитет. Штурм стоит ⚡20.") +
      `<div class="map">${DATA.districts.map(d => `<div class="blk ${S.districts[d.id] ? "mine" : ""}">${d.icon}<small>${d.name}</small></div>`).join("")}</div>` +
      DATA.districts.map(d => {
        const lock = S.level < d.lvl, mine = !!S.districts[d.id];
        const pw = power({ atk: d.atk, def: d.def, hp: d.hp, agi: d.lvl * 2 });
        return `<div class="card ${lock ? "locked" : ""}"><div class="cico">${d.icon}</div>
          <div class="cbody"><b>${d.name}</b><small>${mine ? "✅ Под твоим контролем" : "Держит: " + d.boss + " · мощь " + pw}</small>
          <small>+$${fmt(d.inc)}/ч · +${d.auth} 🤘</small></div>
          ${mine ? "" : lock ? lockTag(d.lvl) : `<button class="btn sm red" onclick="A.capture('${d.id}')">Штурм</button>`}</div>`;
      }).join("") + back();
  },

  points() {
    const inc = incomePerHour();
    return head("Точки", "points", "Бизнес приносит деньги, даже когда ты не в игре (до 12 часов).") +
      `<div class="paper center"><div>Доход: <b>$${fmt(inc)}/ч</b></div><div class="big2">💵 ${fmt(S.pending)}</div>
      <button class="btn green" onclick="A.collect()">Собрать</button></div>` +
      DATA.biz.map(b => {
        const lock = S.level < b.lvl, n = S.biz[b.id] || 0;
        return `<div class="card ${lock ? "locked" : ""}"><div class="cico">${b.icon}</div>
          <div class="cbody"><b>${b.name}</b> <small>есть: ${n}</small><small>+$${fmt(b.inc)}/ч за каждую</small></div>
          ${lock ? lockTag(b.lvl) : `<button class="btn sm" onclick="A.buyBiz('${b.id}')">$${short(bizPrice(b))}</button>`}</div>`;
      }).join("") + back();
  },

  realty() {
    return head("Недвижка", "realty", "Новая хата — больше энергии, авторитета и места в сейфе.") +
      DATA.homes.map((h, i) => {
        const mine = i === S.home, past = i < S.home, next = i === S.home + 1, lock = S.level < h.lvl;
        return `<div class="card ${!mine && !next ? "locked" : ""}"><div class="cico">${["🛏️", "🏠", "🏡", "🏬", "🌆", "🏰"][i]}</div>
          <div class="cbody"><b>${h.name}</b><small>⚡ +${h.en} · сейф $${short(h.safe)} · 🤘 +${i * 15}</small></div>
          ${mine ? `<span class="lock good">Живёшь тут</span>` : past ? `<span class="lock">Пройдено</span>` :
            next ? (lock ? lockTag(h.lvl) : `<button class="btn sm" onclick="A.buyHome(${i})">$${short(h.price)}</button>`) : lockTag(h.lvl)}</div>`;
      }).join("") + back();
  },

  home() {
    return head("Хата", "home", "Обставь жильё и тренируйся.") + room() +
      `<h4 class="sub">Обстановка</h4>` +
      DATA.furniture.map(f => `<div class="card"><div class="cico">${f.icon}</div>
        <div class="cbody"><b>${f.name}</b><small>${f.text}</small></div>
        ${hasF(f.id) ? `<span class="lock good">Есть</span>` : `<button class="btn sm" onclick="A.buyFurn('${f.id}')">$${short(f.price)}</button>`}</div>`).join("") +
      `<h4 class="sub">Тренировки</h4>` +
      [["str", "💪", "Сила", "урон в бою"], ["def", "🛡️", "Защита", "меньше урона"], ["agi", "🎯", "Ловкость", "криты, уклоны, меньше срывов"], ["end", "❤️", "Выносливость", "+10 к здоровью"]].map(([k, ic, n, d]) =>
        `<div class="card"><div class="cico">${ic}</div><div class="cbody"><b>${n}: ${S.stats[k]}</b><small>${d}</small></div>
        <button class="btn sm" onclick="A.train('${k}')">$${short(statPrice(S.stats[k]))}</button></div>`).join("") + back();
  },

  crew() {
    return head("Бригада", "crew", "Каждый боец даёт +3 к атаке и защите в боях, рейдах и штурмах.") +
      `<div class="paper center"><div class="crewrow">${S.crew ? Array.from({ length: Math.min(S.crew, 8) }, (_, i) => ART.crewMember(i)).join("") : "<i class='muted'>Пока никого</i>"}${S.crew > 8 ? `<b>+${S.crew - 8}</b>` : ""}</div>
      <div>Бойцов: <b>${S.crew}</b> из ${crewMax()} (лимит растёт с уровнем)</div>
      <div>Бонус: ⚔️ +${S.crew * 3} · 🛡️ +${S.crew * 3}</div>
      <button class="btn green" onclick="A.hire()" ${S.crew >= crewMax() ? "disabled" : ""}>Нанять бойца за $${fmt(crewPrice())}</button></div>
      <div class="paper small"><b>Семьи города.</b> В Empire City пять старых семей делят центр. Пока ты для них никто — но каждый захваченный район приближает тебя к их столу.</div>` + back();
  },

  shop() {
    const slots = [["weapon", "Оружие"], ["armor", "Броня"], ["extra", "Аксессуары"]];
    return head("Барыга", "shop", "«Всё чистое, почти новое. Деньги вперёд».") +
      slots.map(([sl, nm]) => `<h4 class="sub">${nm}</h4>` + DATA.items.filter(i => i.slot === sl).map(it => {
        const own = S.owned.includes(it.id), on = S.gear[sl] === it.id, lock = S.level < it.lvl;
        const st = [it.atk && "⚔️+" + it.atk, it.def && "🛡️+" + it.def, it.agi && "🎯+" + it.agi, it.auth && "🤘+" + it.auth].filter(Boolean).join(" ");
        return `<div class="card ${lock ? "locked" : ""}"><div class="cico">${it.icon}</div>
          <div class="cbody"><b>${it.name}</b><small>${st}</small></div>
          ${on ? `<span class="lock good">Надето</span>` : own ? `<button class="btn sm" onclick="A.equip('${it.id}')">Надеть</button>` :
            lock ? lockTag(it.lvl) : `<button class="btn sm" onclick="A.buyItem('${it.id}')">$${short(it.price)}</button>`}</div>`;
      }).join("")).join("") + back();
  },

  bank() {
    return head("Банк", "bank", "Деньги в сейфе не теряются при проигрыше в бою.") +
      `<div class="paper center">
        <div>Наличные: <b>$${fmt(S.cash)}</b></div>
        <div class="big2">🔐 $${fmt(S.safe)}</div>
        <div class="small">Вместимость сейфа: $${fmt(safeCap())}</div>
        <div class="mbar"><i style="width:${Math.min(100, S.safe / safeCap() * 100)}%"></i></div>
        <div class="btnrow"><button class="btn" onclick="A.deposit(false)">Положить $1 000</button><button class="btn green" onclick="A.deposit(true)">Положить всё</button></div>
        <div class="btnrow"><button class="btn" onclick="A.withdraw(false)">Снять $1 000</button><button class="btn" onclick="A.withdraw(true)">Снять всё</button></div>
      </div>
      <div class="paper small">💎 Обмен: 5 💎 восстанавливают всю энергию — нажми на ⚡ в верхней панели. ❤️ — лечение за наличные.</div>` + back();
  },

  casino() {
    const spun = S.lastSpin === today();
    return head("Казино", "casino", "Только игровая валюта. Никаких реальных денег.") +
      `<div class="paper center"><h4>Колесо удачи — раз в день бесплатно</h4>
        <div class="wheelwrap"><div class="pointer">▼</div><div id="wheel" class="wheel">${DATA.wheel.map((w, i) => `<span style="transform:rotate(${i * 45 + 22.5}deg)"><em>${w.label}</em></span>`).join("")}</div></div>
        <button class="btn green" onclick="A.spin()" ${spun ? "disabled" : ""}>${spun ? "Завтра снова" : "Крутить!"}</button></div>
      <div class="paper center"><h4>Однорукий бандит</h4>
        <div id="reels" class="reels">🍒 🔔 7️⃣</div><div id="slotres" class="small">Три одинаковых — ×6…×20, две — ×1.5</div>
        <div class="btnrow">${[100, 1000, 10000].map(b => `<button class="btn" onclick="A.slots(${b})">$${short(b)}</button>`).join("")}</div></div>` + back();
  },

  contacts() {
    const q = DATA.story[S.story];
    const done = DATA.story.slice(0, S.story);
    return head("Связи", "contacts", "Сюжет: Глава I · «Новая жизнь»") +
      (q ? `<div class="paper"><div class="row"><div class="cico face big">${ART.contact(q.who)}</div><div><b>${q.who}</b><br><small>${q.title}</small></div></div>
          <p class="quote">${q.text}</p><p>🎯 <b>${q.goal}</b></p>
          <p class="small">Награда: ${[q.reward.cash && "$" + fmt(q.reward.cash), q.reward.xp && q.reward.xp + " ⭐", q.reward.gold && q.reward.gold + " 💎"].filter(Boolean).join(" · ")}</p>
          <button class="btn ${q.check(S) ? "green" : ""}" onclick="A.story()" ${q.check(S) ? "" : "disabled"}>${q.check(S) ? "Готово — забрать награду" : "Ещё не выполнено"}</button></div>`
        : `<div class="paper center"><div class="big">🕴️</div><b>Глава I завершена.</b><p>Продолжение — в следующем обновлении.</p></div>`) +
      (done.length ? `<h4 class="sub">Выполнено</h4>` + done.map(d => `<div class="card done"><div class="cico face">${ART.contact(d.who)}</div><div class="cbody"><b>${d.title}</b><small>${d.who}</small></div><span class="lock good">✓</span></div>`).join("") : "") + back();
  },

  log() {
    return head("Сводки", "📟", "Что происходило в городе") +
      `<div class="paper small">${S.log.length ? S.log.map(l => `<div class="logline"><span class="muted">${new Date(l.t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span> ${esc(l.m)}</div>`).join("") : "Пока тихо."}</div>` + back();
  },

  help() {
    return head("Помощь", "❓") + `<div class="paper small">
      <p><b>⚡ Энергия</b> тратится на движухи, бои, рейды и штурмы. Восстанавливается 1 ед. за ${ENERGY_REGEN_SEC} сек. и полностью при новом уровне.</p>
      <p><b>❤️ Здоровье</b> нужно для драк (минимум 20%). Восстанавливается само или лечением за деньги (тап по ❤️).</p>
      <p><b>⭐ Опыт</b> поднимает уровень: +3 очка параметров, +2 💎 и новые движухи, районы, точки.</p>
      <p><b>🤘 Авторитет</b> растёт от движух, побед, точек, районов, жилья и статусных вещей.</p>
      <p><b>🏪 Точки и районы</b> приносят доход, который копится до 12 часов — заходи собирать.</p>
      <p><b>🏦 Сейф</b> защищает деньги от потерь в драках.</p>
      <p><b>📞 Связи</b> — сюжет. Выполняй задания контактов и получай награды.</p>
      <p class="muted">Это одиночная демо-версия: соперники — сгенерированные персонажи, прогресс хранится в браузере.</p></div>` + back();
  }
};

function render() {
  if (!S && screen !== "start") screen = "start";
  app().innerHTML = SCREENS[screen]();
}

function startGame() {
  const n = ($("#nameIn").value || "").trim();
  if (!n) return toast("Введи кличку", "bad");
  if (S && !confirm("Начать заново? Текущий прогресс будет удалён.")) return;
  S = newState(n.slice(0, 18));
  addLog("Ты приехал в Empire City.");
  save(); go("hub");
  setTimeout(() => modal(`<div class="big">🚉</div><h3>Добро пожаловать, ${esc(S.name)}</h3>
    <p>Ты выходишь с вокзала с одной сумкой и $2 500 в кармане. В телефоне сообщение: «Если ищешь работу — загляни в кафе на West Side. Спросишь Марка».</p>
    <p class="small">Начни со <b>📞 Связей</b> и <b>🏃 Движух</b>.</p>`), 100);
}

// ---------- Запуск ----------
load();
if (S) { tick(); screen = "hub"; }
render();
let saveCounter = 0;
setInterval(() => {
  if (!S) return;
  const before = S.energy + "|" + S.hp + "|" + Math.floor(S.pending);
  tick();
  if (++saveCounter % 5 === 0) save();
  const after = S.energy + "|" + S.hp + "|" + Math.floor(S.pending);
  const busy = document.activeElement && document.activeElement.tagName === "INPUT";
  // Перерисовываем, только если что-то изменилось и пользователь не крутит колесо
  if (!busy && screen !== "casino" && screen !== "start" && (before !== after || screen === "raids")) {
    const y = window.scrollY; render(); window.scrollTo(0, y);
  } else if (screen !== "start") {
    const el = $("#tbEn"); if (el) el.textContent = S.energy + "/" + maxEn();
  }
  const t = $("#tbT"); if (t) t.textContent = mmss(ENERGY_REGEN_SEC - S.enAcc);
}, 1000);
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
