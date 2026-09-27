// Мир Теней — core game logic and UI.
'use strict';

const SAVE_KEY = 'shadowworld_save_v1';
const ENERGY_MAX = 100;
const ENERGY_REGEN = 20; // seconds per 1 energy
const HP_REGEN = 6; // seconds per 1% of max hp
const BAG_LIMIT = 40;
const ARENA_COST = 8;
const DUNGEON_COST = 15;
const FORGE_MAX = 10;

let S = null; // persistent save
const UI = { screen: 'main', arg: null, tab: null, auto: null };

// ---------- helpers ----------
const now = () => Math.floor(Date.now() / 1000);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = (p) => Math.random() * 100 < p;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.floor(n).toLocaleString('ru-RU');
const $ = (s) => document.querySelector(s);

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function expNeed(l) { return Math.round(40 * Math.pow(l, 1.7) + 30); }

// ---------- save / load ----------
function save() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) S = JSON.parse(raw);
  } catch (e) { S = null; }
}

// ---------- items ----------
function rollRarity(bonus = 0) {
  const ws = RARITY.map((r) => r.weight * (r.id > 0 ? 1 + bonus * r.id : 1));
  let x = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) return i; }
  return 0;
}

function makeItem(slot, lvl, rarity, noUid) {
  const tier = Math.min(6, Math.floor((lvl - 1) / 5));
  const m = RARITY[rarity].mult;
  const r = (x) => Math.max(1, Math.round(x * m));
  const st = {};
  switch (slot) {
    case 'weapon': st.atk = r(4 + lvl * 2.2); if (rarity >= 2) st.crit = rarity; break;
    case 'helm': st.def = r(1 + lvl * 0.8); st.hp = r(5 + lvl * 4); break;
    case 'armor': st.def = r(2 + lvl * 1.4); st.hp = r(10 + lvl * 6); break;
    case 'gloves': st.atk = r(1 + lvl * 0.8); st.crit = r(1 + lvl * 0.1); break;
    case 'boots': st.def = r(1 + lvl * 0.7); st.dodge = r(1 + lvl * 0.08); break;
    case 'ring': st.atk = r(1 + lvl * 0.9); st.crit = r(1 + lvl * 0.08); break;
    case 'amulet': st.hp = r(8 + lvl * 5); st.def = r(lvl * 0.5); break;
  }
  return { uid: noUid ? 0 : S.uid++, slot, name: ITEM_NAMES[slot][tier], lvl, rarity, up: 0, st };
}

function randomItem(lvl, bonus = 0, minRarity = 0) {
  return makeItem(pick(Object.keys(SLOTS)), Math.max(1, lvl), Math.max(minRarity, rollRarity(bonus)));
}

function itemStat(it, k) { return it.st[k] ? Math.round(it.st[k] * (1 + 0.12 * it.up)) : 0; }
function itemPrice(it) { return Math.round((10 + it.lvl * 5) * (1 + it.rarity) * (1 + it.up * 0.25)); }
function itemPower(it) {
  if (!it) return 0;
  return itemStat(it, 'atk') * 2 + itemStat(it, 'def') * 2 + itemStat(it, 'hp') * 0.3 + itemStat(it, 'crit') * 3 + itemStat(it, 'dodge') * 3;
}
function itemName(it) { return `${it.name}${it.up ? ' +' + it.up : ''}`; }
function itemHtml(it, noIcon) {
  return `<span style="color:${RARITY[it.rarity].color}">${noIcon ? '' : SLOTS[it.slot].icon + ' '}${esc(itemName(it))}</span>`;
}
const STAT_LABELS = { atk: '⚔️ Атака', def: '🛡️ Защита', hp: '❤️ Здоровье', crit: '🎯 Крит %', dodge: '💨 Уворот %' };
function itemStatsHtml(it, cmp) {
  return Object.keys(STAT_LABELS).filter((k) => it.st[k] || (cmp && cmp.st[k])).map((k) => {
    const v = itemStat(it, k);
    let d = '';
    if (cmp) {
      const diff = v - itemStat(cmp, k);
      if (diff) d = ` <span class="${diff > 0 ? 'good' : 'bad'}">(${diff > 0 ? '+' : ''}${diff})</span>`;
    }
    return `<div class="kv"><span>${STAT_LABELS[k]}</span><b>${v}${d}</b></div>`;
  }).join('');
}

function findItem(uid) {
  for (const s in S.equip) if (S.equip[s] && S.equip[s].uid === uid) return { it: S.equip[s], where: 'equip' };
  const it = S.bag.find((x) => x.uid === uid);
  return it ? { it, where: 'bag' } : null;
}

function addItem(it) {
  if (S.bag.length >= BAG_LIMIT) {
    const p = itemPrice(it);
    S.gold += p;
    toast(`Рюкзак полон! ${itemName(it)} продан за ${p}💰`);
    return;
  }
  S.bag.push(it);
  qProg('loot');
}

function addCons(id, n = 1) { S.cons[id] = (S.cons[id] || 0) + n; }

// ---------- character stats ----------
function calcStats(c) {
  const it = { atk: 0, def: 0, hp: 0, crit: 0, dodge: 0 };
  for (const s in c.equip) {
    const x = c.equip[s];
    if (x) for (const k in it) it[k] += itemStat(x, k);
  }
  const st = c.stats;
  const cm = 1 + (c.clanLvl || 0) * 0.02;
  const base = c.cls === 'mage'
    ? st.int * 2.2 + st.str * 0.5
    : st.str * 1.6 + st.agi * (c.cls === 'rogue' ? 0.9 : 0.4);
  const r = {
    maxHp: Math.round((50 + st.vit * 12 + c.level * 10 + it.hp) * cm),
    atk: Math.round((5 + base + it.atk) * cm),
    def: Math.round(st.vit * 0.8 + c.level + it.def),
    crit: Math.min(50, Math.round(5 + st.agi * 0.35 + it.crit + (c.cls === 'rogue' ? 5 : 0))),
    dodge: Math.min(35, Math.round(3 + st.agi * 0.25 + it.dodge)),
  };
  r.power = Math.round(r.atk * 2 + r.def * 2 + r.maxHp * 0.3 + r.crit * 3 + r.dodge * 3);
  return r;
}

function stats() {
  return calcStats({ cls: S.cls, level: S.level, stats: S.stats, equip: S.equip, clanLvl: S.clan ? S.clan.lvl : 0 });
}

function buffActive(k) { return (S.buffs[k] || 0) > now(); }

// ---------- progression ----------
function gainExp(n) {
  if (buffActive('exp')) n = Math.round(n * 1.5);
  S.exp += n;
  let ups = 0;
  while (S.exp >= expNeed(S.level)) {
    S.exp -= expNeed(S.level);
    S.level++;
    S.points += 3;
    ups++;
    if (S.level % 5 === 0) {
      sendMail('Администрация', `Поздравляем с ${S.level} уровнем!`,
        `Вы достигли ${S.level} уровня. Примите подарок от Совета Теней!`,
        { gems: 5, gold: S.level * 50, items: { hp_big: 2, stone: 2 } });
    }
    if (S.level === 5) toast('🛡 Теперь вы можете вступить в клан!');
  }
  if (ups) {
    const s = stats();
    S.hp = s.maxHp;
    S.energy = Math.max(S.energy, ENERGY_MAX);
    UI.levelUp = true;
    addChat('Система', `${S.name} достиг ${S.level} уровня!`, true);
  }
  return n;
}

function gainGold(n) {
  if (buffActive('gold')) n = Math.round(n * 1.5);
  S.gold += n;
  return n;
}

function applyReward(r) {
  const out = [];
  if (r.exp) out.push(`+${gainExp(r.exp)} опыта`);
  if (r.gold) out.push(`+${gainGold(r.gold)}💰`);
  if (r.gems) { S.gems += r.gems; out.push(`+${r.gems}💎`); }
  if (r.items) for (const id in r.items) { addCons(id, r.items[id]); out.push(`${CONSUMABLES[id].icon}×${r.items[id]}`); }
  return out.join(', ');
}

// ---------- daily ----------
function checkDay() {
  const d = today();
  if (S.lastDay === d) return;
  S.lastDay = d;
  const qs = [...DAILY_QUESTS].sort(() => Math.random() - 0.5).slice(0, 4).map((q) => q.id);
  S.daily = { quests: qs, progress: {}, claimed: {} };
  S.shop = null;
  for (const b of S.bots) {
    b.lvl = Math.min(60, b.lvl + rnd(0, 2));
    b.rating = Math.max(0, b.rating + rnd(-30, 70));
  }
  if (S.clan) S.clan.exp += rnd(100, 400);
  clanLevelCheck();
}

function qProg(id, n = 1) {
  if (!S.daily || !S.daily.quests.includes(id)) return;
  const q = DAILY_QUESTS.find((x) => x.id === id);
  const before = S.daily.progress[id] || 0;
  S.daily.progress[id] = Math.min(q.goal, before + n);
  if (before < q.goal && S.daily.progress[id] >= q.goal) toast(`📜 Задание «${q.name}» выполнено!`);
}

function questsReady() {
  let n = 0;
  if (S.daily) for (const id of S.daily.quests) {
    const q = DAILY_QUESTS.find((x) => x.id === id);
    if ((S.daily.progress[id] || 0) >= q.goal && !S.daily.claimed[id]) n++;
  }
  for (const a of ACHIEVEMENTS) if (!S.ach[a.id] && achValue(a) >= a.goal) n++;
  return n;
}

function achValue(a) { return S[a.stat] || 0; }

function bonusAvailable() { return S.bonus.date !== today(); }

// ---------- mail / chat ----------
function sendMail(from, title, text, reward) {
  S.mail.unshift({ id: S.uid++, from, title, text, reward: reward || null, read: false, t: now() });
  if (S.mail.length > 30) S.mail.length = 30;
}

function addChat(from, text, sys, me) {
  S.chat.push({ t: now(), from, text, sys: !!sys, me: !!me });
  if (S.chat.length > 60) S.chat.splice(0, S.chat.length - 60);
}

function genBots() {
  S.bots = BOT_NAMES.map((name) => {
    const lvl = rnd(1, 14);
    return { name, cls: pick(Object.keys(CLASSES)), lvl, rating: 1000 + lvl * 25 + rnd(-120, 120), clan: chance(60) ? pick(CLAN_NAMES) : null };
  });
}

// ---------- regen & tick ----------
function regen() {
  const t = now();
  if (S.energy < ENERGY_MAX) {
    const n = Math.floor((t - S.regenTs) / ENERGY_REGEN);
    if (n > 0) { S.energy = Math.min(ENERGY_MAX, S.energy + n); S.regenTs += n * ENERGY_REGEN; }
  } else S.regenTs = t;
  const mx = stats().maxHp;
  if (S.hp < mx && !S.fight) {
    const n = Math.floor((t - S.hpTs) / HP_REGEN);
    if (n > 0) { S.hp = Math.min(mx, S.hp + Math.ceil(mx * n / 100)); S.hpTs += n * HP_REGEN; }
  } else S.hpTs = t;
  if (S.hp > mx) S.hp = mx;
}

function tick() {
  if (!S) return;
  regen();
  checkDay();
  if (now() >= S.nextChat) {
    S.nextChat = now() + rnd(12, 40);
    const b = pick(S.bots);
    if (chance(12)) addChat('Система', `${b.name} нашёл легендарный предмет!`, true);
    else addChat(b.name, pick(CHAT_LINES));
    if (UI.screen === 'chat') renderChatLog();
  }
  renderTop();
  document.querySelectorAll('[data-cd]').forEach((el) => {
    const left = +el.dataset.cd - now();
    el.textContent = left > 0 ? fmtTime(left) : 'готово';
  });
  save();
}

// ---------- combat ----------
function makeMonster(lvl, def, kind) {
  const k = { normal: { hp: 1, atk: 1 }, elite: { hp: 1.8, atk: 1.3 }, boss: { hp: 3.5, atk: 1.5 } }[kind];
  const hp = Math.round((40 + lvl * 24) * k.hp);
  return {
    name: (kind === 'elite' ? 'Элитный ' : '') + def[0], icon: def[1], lvl, kind,
    hp, maxHp: hp, atk: Math.round((6 + lvl * 4.2) * k.atk), def: Math.round(lvl * 1.5),
    crit: kind === 'boss' ? 10 : 5, dodge: 3, rage: 0,
  };
}

function makeBot(lvl, name) {
  const cls = pick(Object.keys(CLASSES));
  const st = { ...CLASSES[cls].base };
  const prio = { warrior: ['str', 'vit', 'agi'], mage: ['int', 'vit', 'agi'], rogue: ['agi', 'str', 'vit'] }[cls];
  const pts = (lvl - 1) * 3;
  st[prio[0]] += Math.round(pts * 0.5);
  st[prio[1]] += Math.round(pts * 0.3);
  st[prio[2]] += pts - Math.round(pts * 0.5) - Math.round(pts * 0.3);
  const equip = {};
  for (const slot in SLOTS) {
    if (slot === 'weapon' || slot === 'armor' || chance(clamp(lvl * 8, 20, 90))) {
      equip[slot] = makeItem(slot, Math.max(1, lvl - rnd(0, 3)), chance(75) ? 0 : rollRarity(0), true);
    }
  }
  const s = calcStats({ cls, level: lvl, stats: st, equip });
  return {
    name, icon: CLASSES[cls].icon, cls, lvl, kind: 'player',
    hp: s.maxHp, maxHp: s.maxHp, atk: s.atk, def: s.def, crit: s.crit, dodge: s.dodge, rage: 0, power: s.power,
    rating: Math.max(0, S.rating + rnd(-80, 80)),
  };
}

function strike(att, target, o = {}) {
  if (!o.sure && chance(target.dodge)) return { miss: true, dmg: 0 };
  const crit = o.crit || chance(att.crit);
  const raw = att.atk * (0.85 + Math.random() * 0.3) * (o.mult || 1);
  let dmg = Math.max(1, Math.round(raw - (o.pierce ? 0 : target.def * 0.5)));
  if (crit) dmg = Math.round(dmg * 1.8);
  return { miss: false, crit, dmg };
}

function startFight(enemy, type, extra = {}) {
  S.fight = Object.assign({ type, enemy, rage: 0, log: [], over: false, win: null, turn: 1, reward: null }, extra);
  flog('sys', `Бой начался! Противник: ${enemy.icon} ${enemy.name} [${enemy.lvl}]`);
  go('fight');
}

function flog(c, t) {
  S.fight.log.unshift({ c, t });
  if (S.fight.log.length > 30) S.fight.log.length = 30;
}

function describe(r, who, extra = '') {
  if (r.miss) return `${who}: промах!`;
  return `${who}${extra}: ${r.crit ? '<b class="crit">крит!</b> ' : ''}−${r.dmg}`;
}

function playerAction(kind) {
  const f = S.fight;
  if (!f || f.over) return;
  const me = stats();
  const en = f.enemy;
  const sk = CLASSES[S.cls].skill;
  if (kind === 'attack') {
    const r = strike(me, en);
    en.hp -= r.dmg;
    f.rage = Math.min(100, f.rage + 20);
    flog('me', describe(r, 'Вы бьёте'));
  } else if (kind === 'skill') {
    if (f.rage < sk.cost) { toast(`Нужно ${sk.cost} ярости`); return; }
    f.rage -= sk.cost;
    const r = strike(me, en, { mult: sk.mult, pierce: sk.pierce, crit: sk.crit, sure: true });
    en.hp -= r.dmg;
    flog('me', describe(r, `${sk.icon} ${sk.name}`));
    if (sk.stun) { en.stun = true; flog('sys', `${en.name} оглушён!`); }
  } else if (kind === 'potion') {
    const id = S.hp < me.maxHp * 0.4 && S.cons.hp_big ? 'hp_big' : (S.cons.hp_small ? 'hp_small' : (S.cons.hp_big ? 'hp_big' : null));
    if (!id) { toast('Нет зелий здоровья'); return; }
    if (S.hp >= me.maxHp) { toast('Здоровье полное'); return; }
    S.cons[id]--;
    const h = Math.round(me.maxHp * CONSUMABLES[id].heal);
    S.hp = Math.min(me.maxHp, S.hp + h);
    flog('heal', `${CONSUMABLES[id].icon} Вы выпили зелье: +${h} ❤️`);
  } else if (kind === 'flee') {
    if (f.type !== 'hunt') {
      if (!confirm(f.type === 'arena' ? 'Сдаться? Это засчитается как поражение.' : 'Покинуть подземелье? Прогресс будет потерян.')) return;
      return endFight(false);
    }
    if (chance(60)) { flog('sys', 'Вы сбежали с поля боя.'); f.over = true; f.win = null; stopAuto(); save(); render(); return; }
    flog('sys', 'Сбежать не удалось!');
  }
  if (en.hp <= 0) { en.hp = 0; return endFight(true); }
  enemyTurn();
  if (S.hp <= 0) { S.hp = 0; return endFight(false); }
  f.turn++;
  save();
  render();
}

function enemyTurn() {
  const f = S.fight;
  const en = f.enemy;
  const me = stats();
  if (en.stun) { en.stun = false; flog('sys', `${en.name} пропускает ход.`); return; }
  let r;
  if (en.kind === 'player' && en.rage >= 30 && chance(50)) {
    const sk = CLASSES[en.cls].skill;
    en.rage -= 30;
    r = strike(en, me, { mult: sk.mult, pierce: sk.pierce, crit: sk.crit, sure: true });
    flog('en', describe(r, `${en.name}: ${sk.icon} ${sk.name}`));
  } else if (en.kind === 'boss' && f.turn % 3 === 0) {
    r = strike(en, me, { mult: 1.8, sure: true });
    flog('en', describe(r, `${en.icon} ${en.name} — сокрушительный удар`));
  } else {
    r = strike(en, me);
    en.rage = Math.min(100, (en.rage || 0) + 20);
    flog('en', describe(r, `${en.name} бьёт`));
  }
  S.hp -= r.dmg;
  if (r.dmg) f.rage = Math.min(100, f.rage + 8);
}

function endFight(win) {
  const f = S.fight;
  const en = f.enemy;
  f.over = true;
  f.win = win;
  stopAuto();
  const rw = [];
  if (f.type === 'hunt') {
    if (win) {
      S.kills++;
      qProg('hunt');
      const km = en.kind === 'elite' ? 2.5 : 1;
      rw.push(`+${gainExp(Math.round((10 + en.lvl * 6) * km))} опыта`);
      rw.push(`+${gainGold(Math.round(rnd(5 + en.lvl * 3, 10 + en.lvl * 5) * km))}💰`);
      if (chance(en.kind === 'elite' ? 70 : 22)) {
        const it = randomItem(en.lvl, en.kind === 'elite' ? 1 : 0);
        addItem(it); rw.push(itemHtml(it));
      }
      if (chance(8)) { addCons('stone'); rw.push('💎 Камень заточки'); }
      if (chance(6)) { addCons('hp_small'); rw.push('🧪 Малое зелье'); }
      if (chance(en.kind === 'elite' ? 15 : 2)) { S.gems++; rw.push('+1💎'); }
    }
  } else if (f.type === 'arena') {
    qProg('arena');
    if (win) {
      S.arenaWins++;
      qProg('arena_win');
      const d = rnd(12, 22);
      S.rating += d;
      rw.push(`+${d} рейтинга`);
      rw.push(`+${gainExp(20 + en.lvl * 8)} опыта`);
      rw.push(`+${gainGold(20 + en.lvl * 6)}💰`);
      if (chance(10)) { S.gems++; rw.push('+1💎'); }
    } else {
      S.arenaLosses++;
      const d = rnd(8, 14);
      S.rating = Math.max(0, S.rating - d);
      rw.push(`−${d} рейтинга`);
      rw.push(`+${gainExp(5 + en.lvl * 2)} опыта`);
    }
    S.arenaOpps = [];
  } else if (f.type === 'dungeon') {
    const d = DUNGEONS.find((x) => x.id === f.dungeon);
    if (win && f.stage < d.stages) {
      f.next = true;
      rw.push(`+${gainExp(10 + en.lvl * 5)} опыта`);
      rw.push(`+${gainGold(rnd(10, 20) + en.lvl * 3)}💰`);
    } else if (win) {
      S.dungeons++;
      qProg('dungeon');
      S.dungeonCd[d.id] = now() + d.cd;
      rw.push(`+${gainExp(60 + en.lvl * 25)} опыта`);
      rw.push(`+${gainGold(60 + en.lvl * 20)}💰`);
      const g = rnd(1, 3) + Math.floor(DUNGEONS.indexOf(d) / 2);
      S.gems += g; rw.push(`+${g}💎`);
      const it = randomItem(en.lvl, 3, 2);
      addItem(it); rw.push(itemHtml(it));
      if (chance(50)) { const it2 = randomItem(en.lvl, 2, 1); addItem(it2); rw.push(itemHtml(it2)); }
      addCons('stone', 2); rw.push('💎 Камень заточки ×2');
      addChat('Система', `${S.name} прошёл подземелье «${d.name}»!`, true);
    }
  }
  if (!win) S.hp = Math.max(1, S.hp);
  S.hpTs = now();
  f.reward = rw;
  flog('sys', win ? '🏆 Победа!' : '☠️ Поражение...');
  checkAch();
  save();
  render();
  if (UI.levelUp) { UI.levelUp = false; showLevelUp(); }
}

function leaveFight() {
  const f = S.fight;
  S.fight = null;
  const back = f ? { hunt: 'hunt', arena: 'arena', dungeon: 'dungeons' }[f.type] : 'main';
  go(back);
}

function toggleAuto() {
  if (UI.auto) { stopAuto(); render(); return; }
  UI.auto = setInterval(() => {
    const f = S.fight;
    if (!f || f.over) { stopAuto(); return; }
    const mx = stats().maxHp;
    if (S.hp < mx * 0.3 && (S.cons.hp_small || S.cons.hp_big)) playerAction('potion');
    else if (f.rage >= CLASSES[S.cls].skill.cost) playerAction('skill');
    else playerAction('attack');
  }, 450);
  render();
}

function stopAuto() { if (UI.auto) { clearInterval(UI.auto); UI.auto = null; } }

function checkAch() {
  for (const a of ACHIEVEMENTS) {
    if (!S.ach[a.id] && achValue(a) >= a.goal && !S.achNotified?.[a.id]) {
      S.achNotified = S.achNotified || {};
      S.achNotified[a.id] = true;
      toast(`🏅 Достижение «${a.name}» — заберите награду в заданиях`);
    }
  }
}

// ---------- clan ----------
function clanNeed(l) { return 1000 * l; }
function clanLevelCheck() {
  if (!S.clan) return;
  while (S.clan.lvl < 10 && S.clan.exp >= clanNeed(S.clan.lvl)) {
    S.clan.exp -= clanNeed(S.clan.lvl);
    S.clan.lvl++;
    toast(`🛡 Клан достиг ${S.clan.lvl} уровня!`);
  }
}

// ---------- UI primitives ----------
function toast(t) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = t;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('hide'), 2600);
  setTimeout(() => el.remove(), 3100);
}

function modal(html) {
  $('#modal-body').innerHTML = html;
  $('#modal').classList.add('open');
}
function closeModal() { $('#modal').classList.remove('open'); }

function bar(cls, v, max, label) {
  const p = max > 0 ? clamp(v / max * 100, 0, 100) : 0;
  return `<div class="bar ${cls}"><i style="width:${p}%"></i><span>${label}</span></div>`;
}

function row(icon, label, go, right = '', arg) {
  return `<a class="row" data-go="${go}"${arg !== undefined ? ` data-arg="${arg}"` : ''}><span class="ic">${icon}</span><span class="lb">${label}</span><span class="rt">${right}</span></a>`;
}

function btn(label, act, arg, cls = '') {
  return `<button class="btn ${cls}" data-act="${act}"${arg !== undefined ? ` data-arg="${arg}"` : ''}>${label}</button>`;
}

function tabs(list, cur) {
  return `<div class="tabs">${list.map(([id, l]) => `<a class="tab ${cur === id ? 'on' : ''}" data-act="tab" data-arg="${id}">${l}</a>`).join('')}</div>`;
}

function badge(n) { return n ? `<span class="badge">${n}</span>` : ''; }

function go(screen, arg) {
  if (S && S.fight && screen !== 'fight') {
    if (!S.fight.over) screen = 'fight';
    else if (!S.fight.next) S.fight = null;
  }
  if (UI.screen !== screen) UI.tab = null;
  UI.screen = screen;
  UI.arg = arg === undefined ? null : arg;
  render();
  window.scrollTo(0, 0);
}

function renderTop() {
  const el = $('#top');
  if (!S) { el.innerHTML = ''; return; }
  const s = stats();
  const nextE = S.energy < ENERGY_MAX ? ` <small>+1 через ${ENERGY_REGEN - ((now() - S.regenTs) % ENERGY_REGEN)}с</small>` : '';
  el.innerHTML = `
    <div class="top-row">
      <span class="nick">${CLASSES[S.cls].icon} ${esc(S.name)} <small>[${S.level}]</small></span>
      <span class="money">💰${fmt(S.gold)} &nbsp;💎${fmt(S.gems)}</span>
    </div>
    ${bar('hp', S.hp, s.maxHp, `❤️ ${fmt(S.hp)} / ${fmt(s.maxHp)}`)}
    ${bar('en', S.energy, ENERGY_MAX, `⚡ ${S.energy} / ${ENERGY_MAX}${nextE}`)}
    ${bar('xp', S.exp, expNeed(S.level), `✨ ${fmt(S.exp)} / ${fmt(expNeed(S.level))}`)}`;
  const nav = $('#nav');
  nav.innerHTML = [
    ['main', '🏰', 'Город', 0],
    ['hero', '👤', 'Герой', S.points],
    ['bag', '🎒', 'Рюкзак', 0],
    ['chat', '💬', 'Чат', 0],
    ['mail', '✉️', 'Почта', S.mail.filter((m) => !m.read).length],
  ].map(([id, ic, l, b]) => `<a data-go="${id}" class="${UI.screen === id ? 'on' : ''}"><span>${ic}${badge(b)}</span>${l}</a>`).join('');
}

// ---------- screens ----------
const SCREENS = {};

SCREENS.create = () => {
  const sel = UI.arg || 'warrior';
  return `
  <div class="hero-banner"><div class="logo">🌑</div><h1>Мир Теней</h1><p>Браузерная ролевая онлайн-игра</p></div>
  <div class="box">
    <h3>Создание персонажа</h3>
    <label class="lbl">Имя героя</label>
    <input id="nick" class="inp" maxlength="16" placeholder="Введите имя" value="${esc(UI.nick || '')}">
    <label class="lbl">Класс</label>
    ${Object.entries(CLASSES).map(([id, c]) => `
      <a class="cls ${sel === id ? 'on' : ''}" data-act="pickClass" data-arg="${id}">
        <span class="big">${c.icon}</span>
        <span><b>${c.name}</b><br><small>${c.desc}</small><br><small class="muted">Навык: ${c.skill.icon} ${c.skill.name}</small></span>
      </a>`).join('')}
    ${btn('⚔️ Начать приключение', 'create', undefined, 'primary wide')}
  </div>`;
};

SCREENS.main = () => {
  const online = 180 + ((new Date().getHours() * 37 + new Date().getMinutes()) % 140);
  const heal = healCost();
  const lastNews = S.chat.filter((c) => c.sys).slice(-1)[0];
  return `
  <div class="box center">
    <div class="city">🏰 Город Сумрака</div>
    <small class="muted">Онлайн: <b class="good">${online}</b> игроков</small>
    ${lastNews ? `<div class="news">📢 ${esc(lastNews.text)}</div>` : ''}
  </div>
  ${S.fight && S.fight.next ? `<a class="row gold-row" data-go="fight"><span class="ic">⚰️</span><span class="lb">Продолжить подземелье</span><span class="rt">›</span></a>` : ''}
  ${bonusAvailable() ? `<a class="row gold-row" data-act="bonus"><span class="ic">🎁</span><span class="lb">Ежедневная награда!</span><span class="rt">забрать</span></a>` : ''}
  ${S.points ? `<a class="row gold-row" data-go="hero"><span class="ic">⭐</span><span class="lb">Доступно очков навыков: ${S.points}</span><span class="rt">›</span></a>` : ''}
  <div class="section">Сражения</div>
  ${row('🌲', 'Охота', 'hunt', '<small>монстры</small>')}
  ${row('🏟️', 'Арена', 'arena', `<small>рейтинг ${S.rating}</small>`)}
  ${row('⚰️', 'Подземелья', 'dungeons', '<small>боссы</small>')}
  ${row('📜', 'Задания', 'quests', badge(questsReady()))}
  <div class="section">Город</div>
  ${row('👤', 'Персонаж', 'hero', badge(S.points))}
  ${row('🎒', 'Рюкзак', 'bag', `<small>${S.bag.length}/${BAG_LIMIT}</small>`)}
  ${row('🔨', 'Кузница', 'forge', '<small>заточка</small>')}
  ${row('🏪', 'Лавка', 'shop', '')}
  <a class="row" data-act="heal"><span class="ic">⛪</span><span class="lb">Лекарь</span><span class="rt"><small>${heal ? `исцелить за ${heal}💰` : 'вы здоровы'}</small></span></a>
  ${row('🛡️', 'Клан', 'clan', S.clan ? `<small>${esc(S.clan.name)}</small>` : '')}
  <div class="section">Общение</div>
  ${row('🏆', 'Рейтинг', 'rating', '')}
  ${row('💬', 'Чат', 'chat', '')}
  ${row('✉️', 'Почта', 'mail', badge(S.mail.filter((m) => !m.read).length))}
  <div class="section">Прочее</div>
  ${row('⚙️', 'Настройки', 'settings', '')}
  ${row('❓', 'Помощь', 'help', '')}`;
};

function healCost() {
  const mx = stats().maxHp;
  if (S.hp >= mx) return 0;
  return Math.max(1, Math.round((1 - S.hp / mx) * S.level * 8));
}

SCREENS.hero = () => {
  const s = stats();
  const c = CLASSES[S.cls];
  const statNames = { str: '💪 Сила', agi: '🏹 Ловкость', vit: '❤️ Выносливость', int: '🧠 Интеллект' };
  const statHint = { str: 'атака воина и разбойника', agi: 'крит, уворот, атака разбойника', vit: 'здоровье и защита', int: 'атака мага' };
  const buffs = ['exp', 'gold'].filter(buffActive).map((k) => `<div class="kv"><span>${k === 'exp' ? '📜 +50% опыта' : '💰 +50% золота'}</span><b data-cd="${S.buffs[k]}">${fmtTime(S.buffs[k] - now())}</b></div>`).join('');
  return `
  <div class="box center">
    <div class="avatar">${c.icon}</div>
    <h2>${esc(S.name)}</h2>
    <div class="muted">${c.name} · ${S.level} уровень${S.clan ? ` · 🛡 ${esc(S.clan.name)}` : ''}</div>
    <div class="power">Мощь: <b>${fmt(s.power)}</b></div>
  </div>
  <div class="box">
    <h3>Параметры</h3>
    <div class="kv"><span>⚔️ Атака</span><b>${s.atk}</b></div>
    <div class="kv"><span>🛡️ Защита</span><b>${s.def}</b></div>
    <div class="kv"><span>❤️ Здоровье</span><b>${s.maxHp}</b></div>
    <div class="kv"><span>🎯 Шанс крита</span><b>${s.crit}%</b></div>
    <div class="kv"><span>💨 Уворот</span><b>${s.dodge}%</b></div>
    <div class="kv"><span>${c.skill.icon} Навык</span><b>${c.skill.name}</b></div>
    <small class="muted">${c.skill.desc}. Стоимость: ${c.skill.cost} ярости.</small>
    ${S.clan ? `<div class="kv"><span>🛡 Бонус клана</span><b>+${S.clan.lvl * 2}%</b></div>` : ''}
    ${buffs}
  </div>
  <div class="box">
    <h3>Характеристики ${S.points ? `<span class="badge">${S.points}</span>` : ''}</h3>
    ${Object.keys(statNames).map((k) => `
      <div class="stat-row">
        <span>${statNames[k]}<br><small class="muted">${statHint[k]}</small></span>
        <b>${S.stats[k]}</b>
        ${S.points ? btn('+1', 'addStat', k, 'sm') : ''}
      </div>`).join('')}
  </div>
  <div class="box">
    <h3>Снаряжение</h3>
    ${Object.entries(SLOTS).map(([id, sl]) => {
      const it = S.equip[id];
      return it
        ? `<a class="row" data-go="item" data-arg="${it.uid}"><span class="ic">${sl.icon}</span><span class="lb">${itemHtml(it, true)}</span><span class="rt"><small>${it.lvl} ур.</small></span></a>`
        : `<a class="row" data-go="bag" data-arg="${id}"><span class="ic">${sl.icon}</span><span class="lb muted">${sl.name}: пусто</span><span class="rt">›</span></a>`;
    }).join('')}
  </div>
  <div class="box">
    <h3>Статистика</h3>
    <div class="kv"><span>Убито монстров</span><b>${S.kills}</b></div>
    <div class="kv"><span>Арена: победы / поражения</span><b>${S.arenaWins} / ${S.arenaLosses}</b></div>
    <div class="kv"><span>Рейтинг арены</span><b>${S.rating}</b></div>
    <div class="kv"><span>Пройдено подземелий</span><b>${S.dungeons}</b></div>
  </div>`;
};

SCREENS.bag = () => {
  const tab = UI.tab || 'gear';
  let html = tabs([['gear', `⚔️ Вещи (${S.bag.length})`], ['cons', '🧪 Расходники']], tab);
  if (tab === 'gear') {
    const slotFilter = UI.arg && SLOTS[UI.arg] ? UI.arg : null;
    let list = S.bag.slice().reverse();
    if (slotFilter) list = list.filter((x) => x.slot === slotFilter);
    if (slotFilter) html += `<div class="box">Фильтр: ${SLOTS[slotFilter].name} · <a class="link" data-go="bag">показать всё</a></div>`;
    if (!list.length) html += '<div class="box center muted">Пусто. Сражайтесь с монстрами, чтобы найти снаряжение!</div>';
    html += list.map((it) => {
      const eq = S.equip[it.slot];
      const better = itemPower(it) > itemPower(eq);
      return `<a class="row" data-go="item" data-arg="${it.uid}"><span class="ic">${SLOTS[it.slot].icon}</span><span class="lb">${itemHtml(it, true)}<br><small class="muted">${it.lvl} ур. · ${RARITY[it.rarity].name}</small></span><span class="rt">${better ? '<b class="good">▲</b>' : ''}${it.lvl > S.level ? '<small class="bad">🔒</small>' : ''}</span></a>`;
    }).join('');
    if (S.bag.some((x) => x.rarity === 0)) html += `<div class="box">${btn('Продать все обычные вещи', 'sellJunk', undefined, 'wide')}</div>`;
  } else {
    const ids = Object.keys(S.cons).filter((k) => S.cons[k] > 0);
    if (!ids.length) html += '<div class="box center muted">Нет расходников. Загляните в лавку!</div>';
    html += ids.map((id) => {
      const c = CONSUMABLES[id];
      const usable = c.heal || c.energy || c.buff;
      return `<div class="row"><span class="ic">${c.icon}</span><span class="lb">${c.name} ×${S.cons[id]}<br><small class="muted">${c.desc}</small></span><span class="rt">${usable ? btn('Исп.', 'useCons', id, 'sm') : ''}</span></div>`;
    }).join('');
  }
  return html;
};

SCREENS.item = () => {
  const f = findItem(+UI.arg);
  if (!f) return '<div class="box">Предмет не найден.</div>' + row('🎒', 'В рюкзак', 'bag');
  const it = f.it;
  const eq = f.where === 'bag' ? S.equip[it.slot] : null;
  return `
  <div class="box center">
    <div class="avatar">${SLOTS[it.slot].icon}</div>
    <h2 style="color:${RARITY[it.rarity].color}">${esc(itemName(it))}</h2>
    <div class="muted">${SLOTS[it.slot].name} · ${RARITY[it.rarity].name} · ${it.lvl} ур.</div>
  </div>
  <div class="box">
    ${itemStatsHtml(it, eq)}
    <div class="kv"><span>💰 Цена продажи</span><b>${itemPrice(it)}</b></div>
    ${it.lvl > S.level ? `<div class="bad">Требуется ${it.lvl} уровень</div>` : ''}
    ${eq ? `<small class="muted">Сравнение с надетым: ${itemHtml(eq)}</small>` : ''}
  </div>
  <div class="box btns">
    ${f.where === 'bag' ? btn('Надеть', 'equip', it.uid, 'primary') : btn('Снять', 'unequip', it.uid)}
    ${btn('🔨 В кузницу', 'toForge', it.uid)}
    ${f.where === 'bag' ? btn(`Продать за ${itemPrice(it)}💰`, 'sell', it.uid, 'danger') : ''}
  </div>
  ${row('🎒', 'Назад в рюкзак', 'bag')}`;
};

SCREENS.hunt = () => {
  return `<div class="box"><h3>🌲 Охота</h3><small class="muted">Выберите локацию. Уровень монстров зависит от вашего уровня и локации. Есть шанс встретить элитного монстра!</small></div>` +
    LOCATIONS.map((l) => {
      const locked = S.level < l.minLvl;
      return locked
        ? `<div class="row locked"><span class="ic">${l.icon}</span><span class="lb">${l.name}<br><small>с ${l.minLvl} уровня</small></span><span class="rt">🔒</span></div>`
        : `<a class="row" data-act="hunt" data-arg="${l.id}"><span class="ic">${l.icon}</span><span class="lb">${l.name}<br><small class="muted">ур. ${l.minLvl}–${l.minLvl + 4} · ${l.monsters.map((m) => m[1]).join(' ')}</small></span><span class="rt"><small>${l.energy}⚡</small></span></a>`;
    }).join('');
};

SCREENS.fight = () => {
  const f = S.fight;
  if (!f) { UI.screen = 'main'; return SCREENS.main(); }
  const en = f.enemy;
  const s = stats();
  const sk = CLASSES[S.cls].skill;
  const d = f.type === 'dungeon' ? DUNGEONS.find((x) => x.id === f.dungeon) : null;
  let html = `
  <div class="box fight-title">${f.type === 'hunt' ? '🌲 Охота' : f.type === 'arena' ? '🏟️ Арена' : `${d.icon} ${d.name} · зал ${f.stage}/${d.stages}`}</div>
  <div class="versus">
    <div class="fighter">
      <div class="avatar sm">${CLASSES[S.cls].icon}</div>
      <b>${esc(S.name)}</b> <small>[${S.level}]</small>
      ${bar('hp', S.hp, s.maxHp, `${Math.max(0, S.hp)}/${s.maxHp}`)}
      ${bar('rage', f.rage, 100, `ярость ${f.rage}`)}
    </div>
    <div class="vs">VS</div>
    <div class="fighter">
      <div class="avatar sm ${en.kind === 'boss' ? 'boss' : en.kind === 'elite' ? 'elite' : ''}">${en.icon}</div>
      <b>${esc(en.name)}</b> <small>[${en.lvl}]</small>
      ${bar('hp', en.hp, en.maxHp, `${Math.max(0, en.hp)}/${en.maxHp}`)}
      ${en.kind === 'player' ? bar('rage', en.rage, 100, `ярость ${en.rage}`) : `<small class="muted">${en.kind === 'boss' ? '👑 Босс' : en.kind === 'elite' ? '⭐ Элита' : 'Монстр'}</small>`}
    </div>
  </div>`;
  if (!f.over) {
    const pots = (S.cons.hp_small || 0) + (S.cons.hp_big || 0);
    html += `<div class="actions">
      ${btn('⚔️ Удар', 'fight', 'attack', 'primary')}
      ${btn(`${sk.icon} ${sk.name}`, 'fight', 'skill', f.rage >= sk.cost ? 'skill' : 'disabled')}
      ${btn(`🧪 Зелье (${pots})`, 'fight', 'potion')}
      ${btn(f.type === 'hunt' ? '🏃 Бежать' : '🏳️ Сдаться', 'fight', 'flee')}
      ${btn(UI.auto ? '⏸ Стоп' : '🤖 Автобой', 'auto', undefined, 'wide')}
    </div>`;
  } else {
    html += `<div class="box result ${f.win ? 'win' : f.win === false ? 'lose' : ''}">
      <h2>${f.win ? '🏆 Победа!' : f.win === false ? '☠️ Поражение' : '🏃 Вы сбежали'}</h2>
      ${f.reward && f.reward.length ? `<div>${f.reward.join('<br>')}</div>` : ''}
      ${f.win === false && f.type !== 'arena' ? '<small class="muted">Здоровье восстанавливается со временем или у лекаря.</small>' : ''}
    </div><div class="actions">`;
    if (f.type === 'hunt') html += btn('🔁 Искать ещё', 'hunt', f.loc, 'primary') + btn('Назад', 'leave');
    else if (f.type === 'arena') html += btn('🏟️ На арену', 'leave', undefined, 'primary wide');
    else if (f.next) html += btn('➡️ Следующий зал', 'nextStage', undefined, 'primary') + btn('🧪 Зелье', 'drink') + btn('Покинуть', 'leave', undefined, 'wide');
    else html += btn('Выйти', 'leave', undefined, 'primary wide');
    html += '</div>';
  }
  html += `<div class="box log">${f.log.map((l) => `<div class="l-${l.c}">${l.t}</div>`).join('')}</div>`;
  return html;
};

SCREENS.arena = () => {
  if (!S.arenaOpps || !S.arenaOpps.length) {
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    S.arenaOpps = [-1, 0, 1].map((d, i) => makeBot(Math.max(1, S.level + d), names[i]));
  }
  const me = stats();
  const total = S.arenaWins + S.arenaLosses;
  return `
  <div class="box">
    <h3>🏟️ Арена</h3>
    <div class="kv"><span>Ваш рейтинг</span><b>${S.rating}</b></div>
    <div class="kv"><span>Победы / поражения</span><b>${S.arenaWins} / ${S.arenaLosses}${total ? ` (${Math.round(S.arenaWins / total * 100)}%)` : ''}</b></div>
    <div class="kv"><span>Ваша мощь</span><b>${fmt(me.power)}</b></div>
    <small class="muted">Бой стоит ${ARENA_COST}⚡. Побеждайте, чтобы подняться в рейтинге!</small>
  </div>
  <div class="section">Соперники</div>
  ${S.arenaOpps.map((o, i) => `
    <div class="row">
      <span class="ic">${o.icon}</span>
      <span class="lb">${esc(o.name)} <small>[${o.lvl}]</small><br><small class="muted">${CLASSES[o.cls].name} · мощь <b class="${o.power > me.power * 1.1 ? 'bad' : o.power < me.power * 0.9 ? 'good' : ''}">${fmt(o.power)}</b> · 🏆${o.rating}</small></span>
      <span class="rt">${btn('Бой', 'arenaFight', i, 'sm primary')}</span>
    </div>`).join('')}
  <div class="box">${btn('🔄 Сменить соперников (10💰)', 'arenaRefresh', undefined, 'wide')}</div>`;
};

SCREENS.dungeons = () => {
  return `<div class="box"><h3>⚰️ Подземелья</h3><small class="muted">Пройдите все залы и победите босса. Здоровье между залами не восстанавливается! Вход: ${DUNGEON_COST}⚡. Награда: редкие вещи, кристаллы, камни заточки.</small></div>` +
    DUNGEONS.map((d) => {
      const cd = (S.dungeonCd[d.id] || 0) - now();
      if (S.level < d.minLvl) return `<div class="row locked"><span class="ic">${d.icon}</span><span class="lb">${d.name}<br><small>с ${d.minLvl} уровня</small></span><span class="rt">🔒</span></div>`;
      return `<div class="row"><span class="ic">${d.icon}</span><span class="lb">${d.name}<br><small class="muted">${d.stages} залов · босс ${d.boss[1]} ${d.boss[0]}</small>${cd > 0 ? `<br><small class="bad">откат: <span data-cd="${S.dungeonCd[d.id]}">${fmtTime(cd)}</span></small>` : ''}</span>
        <span class="rt">${cd > 0 ? btn(`🗝️ (${S.cons.key || 0})`, 'dungeon', d.id, 'sm') : btn('Войти', 'dungeon', d.id, 'sm primary')}</span></div>`;
    }).join('');
};

SCREENS.quests = () => {
  const tab = UI.tab || 'daily';
  let html = tabs([['daily', '📜 Ежедневные'], ['ach', '🏅 Достижения']], tab);
  if (tab === 'daily') {
    html += '<div class="box"><small class="muted">Задания обновляются каждый день в полночь.</small></div>';
    html += S.daily.quests.map((id) => {
      const q = DAILY_QUESTS.find((x) => x.id === id);
      const p = S.daily.progress[id] || 0;
      const done = p >= q.goal;
      const claimed = S.daily.claimed[id];
      const rw = [q.reward.exp && `${q.reward.exp} опыта`, q.reward.gold && `${q.reward.gold}💰`, q.reward.gems && `${q.reward.gems}💎`,
        q.reward.items && Object.entries(q.reward.items).map(([k, v]) => `${CONSUMABLES[k].icon}×${v}`).join(' ')].filter(Boolean).join(', ');
      return `<div class="box quest ${claimed ? 'done' : ''}"><b>${q.name}</b> — ${q.desc}
        ${bar('xp', p, q.goal, `${p} / ${q.goal}`)}
        <div class="qfoot"><small>Награда: ${rw}</small>${claimed ? '<small class="good">✔ получено</small>' : done ? btn('Забрать', 'claimQuest', id, 'sm primary') : ''}</div></div>`;
    }).join('');
  } else {
    html += ACHIEVEMENTS.map((a) => {
      const v = Math.min(a.goal, achValue(a));
      const got = S.ach[a.id];
      return `<div class="box quest ${got ? 'done' : ''}"><b>🏅 ${a.name}</b> — ${a.desc}
        ${bar('xp', v, a.goal, `${v} / ${a.goal}`)}
        <div class="qfoot"><small>Награда: ${a.gems}💎</small>${got ? '<small class="good">✔ получено</small>' : v >= a.goal ? btn('Забрать', 'claimAch', a.id, 'sm primary') : ''}</div></div>`;
    }).join('');
  }
  return html;
};

function forgeInfo(it) {
  const chanceTbl = [100, 100, 100, 90, 80, 70, 60, 50, 40, 30];
  return {
    gold: Math.round((20 + it.lvl * 10) * (it.up + 1) * (1 + it.rarity * 0.3)),
    stones: 1 + Math.floor(it.up / 2),
    chance: chanceTbl[it.up] || 0,
  };
}

SCREENS.forge = () => {
  if (UI.arg) {
    const f = findItem(+UI.arg);
    if (f) {
      const it = f.it;
      if (it.up >= FORGE_MAX) return `<div class="box center">${itemHtml(it)}<br>Предмет улучшен до максимума!</div>${row('🔨', 'Назад', 'forge')}`;
      const fi = forgeInfo(it);
      const next = { ...it, up: it.up + 1 };
      return `
      <div class="box center"><div class="avatar">🔨</div><h3>${itemHtml(it)}</h3><small class="muted">Улучшение до +${it.up + 1}</small></div>
      <div class="box">${itemStatsHtml(next, it)}</div>
      <div class="box">
        <div class="kv"><span>Шанс успеха</span><b class="${fi.chance >= 70 ? 'good' : 'bad'}">${fi.chance}%</b></div>
        <div class="kv"><span>Стоимость</span><b>${fmt(fi.gold)}💰</b></div>
        <div class="kv"><span>Камни заточки</span><b>${fi.stones} (есть ${S.cons.stone || 0})</b></div>
        <small class="muted">При неудаче золото и камни теряются, но предмет не ломается.</small>
      </div>
      <div class="box btns">${btn('🔨 Улучшить', 'upgrade', it.uid, 'primary wide')}</div>
      ${row('🔨', 'Выбрать другой предмет', 'forge')}`;
    }
  }
  const eq = Object.values(S.equip).filter(Boolean);
  return `<div class="box"><h3>🔨 Кузница</h3><small class="muted">Каждое улучшение даёт +12% к характеристикам предмета. Максимум +${FORGE_MAX}. Камни заточки: ${S.cons.stone || 0} 💎</small></div>
    <div class="section">Надетые вещи</div>
    ${eq.length ? eq.map((it) => `<a class="row" data-go="forge" data-arg="${it.uid}"><span class="ic">${SLOTS[it.slot].icon}</span><span class="lb">${itemHtml(it, true)}</span><span class="rt">›</span></a>`).join('') : '<div class="box muted">Ничего не надето</div>'}
    <div class="section">В рюкзаке</div>
    ${S.bag.length ? S.bag.slice().reverse().map((it) => `<a class="row" data-go="forge" data-arg="${it.uid}"><span class="ic">${SLOTS[it.slot].icon}</span><span class="lb">${itemHtml(it, true)}</span><span class="rt">›</span></a>`).join('') : '<div class="box muted">Пусто</div>'}`;
};

function shopStock() {
  if (!S.shop || S.shop.lvl !== S.level) {
    S.shop = { lvl: S.level, items: [0, 1, 2, 3].map(() => randomItem(S.level, 1.5, 1)) };
  }
  return S.shop.items;
}

SCREENS.shop = () => {
  const tab = UI.tab || 'pots';
  let html = tabs([['pots', '🧪 Зелья'], ['gear', '⚔️ Снаряжение'], ['gems', '💎 Премиум']], tab);
  if (tab === 'pots') {
    html += ['hp_small', 'hp_big', 'stone'].map((id) => {
      const c = CONSUMABLES[id];
      return `<div class="row"><span class="ic">${c.icon}</span><span class="lb">${c.name}<br><small class="muted">${c.desc} · есть: ${S.cons[id] || 0}</small></span><span class="rt">${btn(`${c.price}💰`, 'buy', id, 'sm')}</span></div>`;
    }).join('');
  } else if (tab === 'gear') {
    html += `<div class="box"><small class="muted">Товар обновляется каждый день и при повышении уровня.</small></div>`;
    html += shopStock().map((it, i) => it
      ? `<div class="row"><span class="ic">${SLOTS[it.slot].icon}</span><span class="lb">${itemHtml(it, true)}<br><small class="muted">${it.lvl} ур. · ${Object.keys(STAT_LABELS).filter((k) => it.st[k]).map((k) => `${STAT_LABELS[k].split(' ')[0]}${itemStat(it, k)}`).join(' ')}</small></span><span class="rt">${btn(`${itemPrice(it) * 4}💰`, 'buyGear', i, 'sm')}</span></div>`
      : `<div class="row locked"><span class="ic">✔</span><span class="lb">Продано</span></div>`).join('');
  } else {
    html += ['energy', 'scroll_exp', 'scroll_gold', 'key'].map((id) => {
      const c = CONSUMABLES[id];
      return `<div class="row"><span class="ic">${c.icon}</span><span class="lb">${c.name}<br><small class="muted">${c.desc} · есть: ${S.cons[id] || 0}</small></span><span class="rt">${btn(`${c.gems}💎`, 'buy', id, 'sm')}</span></div>`;
    }).join('');
    html += `<div class="row"><span class="ic">💰</span><span class="lb">Мешок золота<br><small class="muted">${fmt(goldBag())} золота</small></span><span class="rt">${btn('10💎', 'buyGold', undefined, 'sm')}</span></div>`;
    html += '<div class="box"><small class="muted">💎 Кристаллы можно получить за задания, достижения, подземелья и ежедневные награды.</small></div>';
  }
  return html;
};

function goldBag() { return 300 + S.level * 60; }

SCREENS.clan = () => {
  if (!S.clan) {
    return `<div class="box"><h3>🛡️ Кланы</h3><small class="muted">Клан даёт бонус +2% к атаке и здоровью за каждый уровень клана. Вступить можно с 5 уровня.</small></div>
      <div class="section">Кланы, набирающие игроков</div>
      ${CLAN_NAMES.map((n, i) => `<div class="row"><span class="ic">🛡️</span><span class="lb">${n}<br><small class="muted">ур. ${1 + (i * 7) % 5} · ${S.bots.filter((b) => b.clan === n).length + 3} участников</small></span><span class="rt">${btn('Вступить', 'clanJoin', i, 'sm')}</span></div>`).join('')}
      <div class="box">
        <h3>Создать свой клан</h3>
        <input id="clanName" class="inp" maxlength="20" placeholder="Название клана">
        ${btn('Создать за 1000💰 (с 10 ур.)', 'clanCreate', undefined, 'wide')}
      </div>`;
  }
  const c = S.clan;
  const members = S.bots.filter((b) => b.clan === c.name).sort((a, b) => b.lvl - a.lvl);
  return `
  <div class="box center"><div class="avatar">🛡️</div><h2>${esc(c.name)}</h2><div class="muted">Уровень клана ${c.lvl}${c.owner ? ' · вы глава' : ''}</div></div>
  <div class="box">
    ${c.lvl < 10 ? bar('xp', c.exp, clanNeed(c.lvl), `${fmt(c.exp)} / ${fmt(clanNeed(c.lvl))}`) : '<b class="good">Максимальный уровень!</b>'}
    <div class="kv"><span>Бонус к атаке и здоровью</span><b>+${c.lvl * 2}%</b></div>
    <div class="kv"><span>Ваш вклад</span><b>${fmt(c.donated)}💰</b></div>
    <div class="btns">${btn('Пожертвовать 100💰', 'clanDonate', 100)}${btn('1000💰', 'clanDonate', 1000)}</div>
  </div>
  <div class="section">Участники (${members.length + 1})</div>
  <div class="row"><span class="ic">${CLASSES[S.cls].icon}</span><span class="lb"><b>${esc(S.name)}</b> <small>[${S.level}]</small></span><span class="rt"><small>${c.owner ? 'глава' : 'вы'}</small></span></div>
  ${members.map((b) => `<div class="row"><span class="ic">${CLASSES[b.cls].icon}</span><span class="lb">${esc(b.name)} <small>[${b.lvl}]</small></span><span class="rt"><small class="${chance(40) ? 'good' : 'muted'}">●</small></span></div>`).join('')}
  <div class="box">${btn('Покинуть клан', 'clanLeave', undefined, 'danger wide')}</div>`;
};

SCREENS.rating = () => {
  const tab = UI.tab || 'lvl';
  const me = { name: S.name, cls: S.cls, lvl: S.level, rating: S.rating, me: true };
  const list = [...S.bots, me].sort((a, b) => tab === 'lvl' ? (b.lvl - a.lvl || b.rating - a.rating) : b.rating - a.rating);
  const pos = list.indexOf(me) + 1;
  return tabs([['lvl', '⭐ По уровню'], ['arena', '🏟️ Арена']], tab) +
    `<div class="box center">Ваше место: <b>${pos}</b> из ${list.length}</div>` +
    list.slice(0, 25).map((p, i) => `<div class="row ${p.me ? 'me' : ''}"><span class="ic">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span><span class="lb">${CLASSES[p.cls].icon} ${esc(p.name)}</span><span class="rt"><small>${tab === 'lvl' ? p.lvl + ' ур.' : '🏆' + p.rating}</small></span></div>`).join('') +
    (pos > 25 ? `<div class="row me"><span class="ic">${pos}</span><span class="lb">${CLASSES[S.cls].icon} ${esc(S.name)}</span><span class="rt"><small>${tab === 'lvl' ? S.level + ' ур.' : '🏆' + S.rating}</small></span></div>` : '');
};

function chatLogHtml() {
  return S.chat.map((m) => {
    const t = new Date(m.t * 1000);
    const tm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    if (m.sys) return `<div class="msg sys"><small>${tm}</small> 📢 ${esc(m.text)}</div>`;
    return `<div class="msg ${m.me ? 'mine' : ''}"><small>${tm}</small> <b>${esc(m.from)}:</b> ${esc(m.text)}</div>`;
  }).join('');
}

function renderChatLog() {
  const el = $('#chatlog');
  if (el) { el.innerHTML = chatLogHtml(); el.scrollTop = el.scrollHeight; }
}

SCREENS.chat = () => `
  <div class="box"><h3>💬 Общий чат</h3></div>
  <div id="chatlog" class="chatlog">${chatLogHtml()}</div>
  <div class="chat-input"><input id="chatMsg" class="inp" maxlength="140" placeholder="Сообщение..."><button class="btn primary" data-act="chatSend">➤</button></div>`;

SCREENS.mail = () => {
  if (UI.arg) {
    const m = S.mail.find((x) => x.id === +UI.arg);
    if (m) {
      m.read = true;
      let rw = '';
      if (m.reward) {
        const r = m.reward;
        rw = [r.gold && `${r.gold}💰`, r.gems && `${r.gems}💎`, r.items && Object.entries(r.items).map(([k, v]) => `${CONSUMABLES[k].icon}×${v}`).join(' ')].filter(Boolean).join(', ');
      }
      return `<div class="box"><small class="muted">От: ${esc(m.from)}</small><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p>
        ${m.reward ? `<div class="gift">🎁 Вложение: ${rw}</div>${btn('Забрать', 'mailClaim', m.id, 'primary wide')}` : ''}</div>
        ${row('✉️', 'Все письма', 'mail')}`;
    }
  }
  if (!S.mail.length) return '<div class="box center muted">Писем нет</div>';
  return `<div class="box"><h3>✉️ Почта</h3></div>` + S.mail.map((m) => `<a class="row ${m.read ? '' : 'unread'}" data-go="mail" data-arg="${m.id}"><span class="ic">${m.reward ? '🎁' : '✉️'}</span><span class="lb">${esc(m.title)}<br><small class="muted">${esc(m.from)}</small></span><span class="rt">${m.read ? '' : '<span class="badge">new</span>'}</span></a>`).join('');
};

SCREENS.settings = () => `
  <div class="box"><h3>⚙️ Настройки</h3>
    <div class="kv"><span>Персонаж</span><b>${esc(S.name)}</b></div>
    <div class="kv"><span>В игре с</span><b>${new Date(S.created * 1000).toLocaleDateString('ru-RU')}</b></div>
  </div>
  <div class="box"><h3>Сохранение</h3>
    <small class="muted">Прогресс сохраняется в браузере автоматически. Чтобы перенести его на другое устройство, скопируйте код.</small>
    <textarea id="saveCode" class="inp" rows="3" placeholder="Код сохранения"></textarea>
    <div class="btns">${btn('📤 Получить код', 'exportSave')}${btn('📥 Загрузить код', 'importSave')}</div>
  </div>
  <div class="box">${btn('🗑 Начать заново', 'reset', undefined, 'danger wide')}</div>`;

SCREENS.help = () => `
  <div class="box"><h3>❓ Помощь</h3>
  <p><b>⚡ Энергия</b> тратится на охоту, арену и подземелья. Восстанавливается на 1 каждые ${ENERGY_REGEN} секунд, полностью — при повышении уровня.</p>
  <p><b>❤️ Здоровье</b> восстанавливается само (1% каждые ${HP_REGEN} сек.), зельями или у лекаря.</p>
  <p><b>⚔️ Бой</b> — пошаговый. Обычный удар копит <b>ярость</b>, за 30 ярости можно применить особый навык класса. Автобой сражается за вас.</p>
  <p><b>⭐ Уровень</b> даёт 3 очка характеристик. Воину нужна сила и выносливость, магу — интеллект, разбойнику — ловкость.</p>
  <p><b>🎒 Вещи</b> бывают обычные, <span style="color:${RARITY[1].color}">необычные</span>, <span style="color:${RARITY[2].color}">редкие</span>, <span style="color:${RARITY[3].color}">эпические</span> и <span style="color:${RARITY[4].color}">легендарные</span>. Стрелка ▲ показывает, что вещь лучше надетой.</p>
  <p><b>🔨 Кузница</b> улучшает вещи до +${FORGE_MAX}. Нужны золото и камни заточки.</p>
  <p><b>⚰️ Подземелья</b> — серия боёв подряд с боссом в конце. Лучший источник редких вещей.</p>
  <p><b>🛡️ Клан</b> даёт постоянный бонус к атаке и здоровью.</p>
  </div>`;

function render() {
  if (!S) { UI.screen = 'create'; }
  if (S && S.fight && !S.fight.over) UI.screen = 'fight';
  const fn = SCREENS[UI.screen] || SCREENS.main;
  $('#screen').innerHTML = fn();
  document.body.classList.toggle('no-hud', !S);
  renderTop();
  if (UI.screen === 'chat') renderChatLog();
}

function showLevelUp() {
  modal(`<div class="center"><div class="avatar">⭐</div><h2>Новый уровень!</h2><p>Вы достигли <b>${S.level}</b> уровня!</p>
    <p>Здоровье и энергия восстановлены.<br>Получено очков характеристик: <b>+3</b></p>
    <small class="muted">Распределите очки в разделе «Персонаж».</small>
    <button class="btn primary wide" data-act="closeModal">Отлично!</button></div>`);
}

// ---------- actions ----------
const ACTIONS = {
  pickClass(a) { UI.nick = $('#nick').value; UI.arg = a; render(); },
  create() {
    const name = ($('#nick').value || '').trim();
    if (name.length < 3) return toast('Имя должно быть от 3 символов');
    if (!/^[\p{L}\p{N}_\- ]+$/u.test(name)) return toast('Имя содержит недопустимые символы');
    newGame(name, UI.arg || 'warrior');
    go('main');
    toast('Добро пожаловать в Мир Теней! Загляните в почту ✉️');
  },
  tab(a) { UI.tab = a; render(); },
  closeModal() { closeModal(); },
  bonus() {
    if (!bonusAvailable()) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yd = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    S.bonus.streak = S.bonus.date === yd ? S.bonus.streak % 7 + 1 : 1;
    S.bonus.date = today();
    const st = S.bonus.streak;
    const r = { gold: 50 * st + S.level * 10, gems: st === 7 ? 10 : st >= 4 ? 2 : 0, items: st % 2 ? { hp_small: 2 } : { stone: 1 } };
    const txt = applyReward(r);
    modal(`<div class="center"><div class="avatar">🎁</div><h2>Ежедневная награда</h2>
      <div class="streak">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<span class="${d <= st ? 'on' : ''}">${d}</span>`).join('')}</div>
      <p>День ${st} из 7</p><p><b>${txt}</b></p><small class="muted">Заходите каждый день — на 7-й день 10💎!</small>
      <button class="btn primary wide" data-act="closeModal">Отлично!</button></div>`);
    save(); render();
  },
  heal() {
    const c = healCost();
    if (!c) return toast('Вы полностью здоровы');
    if (S.gold < c) return toast('Недостаточно золота');
    S.gold -= c;
    S.hp = stats().maxHp;
    toast('⛪ Лекарь исцелил ваши раны');
    save(); render();
  },
  addStat(k) {
    if (S.points <= 0) return;
    S.points--; S.stats[k]++;
    save(); render();
  },
  equip(uid) {
    const i = S.bag.findIndex((x) => x.uid === +uid);
    if (i < 0) return;
    const it = S.bag[i];
    if (it.lvl > S.level) return toast(`Требуется ${it.lvl} уровень`);
    S.bag.splice(i, 1);
    if (S.equip[it.slot]) S.bag.push(S.equip[it.slot]);
    S.equip[it.slot] = it;
    S.hp = Math.min(S.hp, stats().maxHp);
    toast(`Надето: ${itemName(it)}`);
    save(); go('hero');
  },
  unequip(uid) {
    for (const s in S.equip) {
      if (S.equip[s] && S.equip[s].uid === +uid) {
        if (S.bag.length >= BAG_LIMIT) return toast('Рюкзак полон');
        S.bag.push(S.equip[s]); S.equip[s] = null;
      }
    }
    S.hp = Math.min(S.hp, stats().maxHp);
    save(); go('hero');
  },
  sell(uid) {
    const i = S.bag.findIndex((x) => x.uid === +uid);
    if (i < 0) return;
    const it = S.bag[i];
    if (it.rarity >= 3 && !confirm(`Продать ${itemName(it)}?`)) return;
    S.bag.splice(i, 1);
    S.gold += itemPrice(it);
    toast(`Продано за ${itemPrice(it)}💰`);
    save(); go('bag');
  },
  sellJunk() {
    let sum = 0;
    S.bag = S.bag.filter((it) => { if (it.rarity === 0 && it.up === 0) { sum += itemPrice(it); return false; } return true; });
    S.gold += sum;
    toast(`Продано на ${sum}💰`);
    save(); render();
  },
  toForge(uid) { go('forge', uid); },
  useCons(id) {
    const c = CONSUMABLES[id];
    if (!S.cons[id]) return;
    if (c.heal) {
      const mx = stats().maxHp;
      if (S.hp >= mx) return toast('Здоровье полное');
      S.hp = Math.min(mx, S.hp + Math.round(mx * c.heal));
    } else if (c.energy) {
      S.energy += c.energy;
    } else if (c.buff) {
      S.buffs[c.buff] = Math.max(now(), S.buffs[c.buff] || 0) + c.dur;
    } else return;
    S.cons[id]--;
    toast(`${c.icon} ${c.name} использован`);
    save(); render();
  },
  hunt(locId) {
    const l = LOCATIONS.find((x) => x.id === locId);
    if (!l || S.level < l.minLvl) return;
    if (S.energy < l.energy) return toast('Недостаточно энергии ⚡');
    if (S.hp < stats().maxHp * 0.1) return toast('Слишком мало здоровья! Подлечитесь.');
    S.energy -= l.energy;
    S.fight = null;
    const lvl = Math.max(1, clamp(S.level, l.minLvl, l.minLvl + 4) + rnd(-1, 1));
    const kind = chance(10) ? 'elite' : 'normal';
    startFight(makeMonster(lvl, pick(l.monsters), kind), 'hunt', { loc: l.id });
  },
  fight(kind) { playerAction(kind); },
  auto() { toggleAuto(); },
  leave() { leaveFight(); },
  drink() {
    const f = S.fight;
    const id = S.cons.hp_big ? 'hp_big' : S.cons.hp_small ? 'hp_small' : null;
    if (!id) return toast('Нет зелий здоровья');
    ACTIONS.useCons(id);
    if (f) go('fight');
  },
  arenaFight(i) {
    const o = S.arenaOpps[+i];
    if (!o) return;
    if (S.energy < ARENA_COST) return toast('Недостаточно энергии ⚡');
    if (S.hp < stats().maxHp * 0.1) return toast('Слишком мало здоровья! Подлечитесь.');
    S.energy -= ARENA_COST;
    startFight(o, 'arena');
  },
  arenaRefresh() {
    if (S.gold < 10) return toast('Недостаточно золота');
    S.gold -= 10; S.arenaOpps = [];
    save(); render();
  },
  dungeon(id) {
    const d = DUNGEONS.find((x) => x.id === id);
    if (!d || S.level < d.minLvl) return;
    const onCd = (S.dungeonCd[d.id] || 0) > now();
    if (onCd && !S.cons.key) return toast('Нужен ключ подземелья 🗝️ (есть в лавке)');
    if (S.energy < DUNGEON_COST) return toast('Недостаточно энергии ⚡');
    if (S.hp < stats().maxHp * 0.5) return toast('Войти можно только с 50% здоровья и выше');
    if (onCd) S.cons.key--;
    S.energy -= DUNGEON_COST;
    dungeonStage(d, 1);
  },
  nextStage() {
    const f = S.fight;
    const d = DUNGEONS.find((x) => x.id === f.dungeon);
    dungeonStage(d, f.stage + 1);
  },
  claimQuest(id) {
    if (S.daily.claimed[id]) return;
    const q = DAILY_QUESTS.find((x) => x.id === id);
    if ((S.daily.progress[id] || 0) < q.goal) return;
    S.daily.claimed[id] = true;
    toast(`Награда: ${applyReward(q.reward)}`);
    save(); render();
    if (UI.levelUp) { UI.levelUp = false; showLevelUp(); }
  },
  claimAch(id) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (S.ach[id] || achValue(a) < a.goal) return;
    S.ach[id] = true;
    S.gems += a.gems;
    toast(`🏅 +${a.gems}💎`);
    save(); render();
  },
  upgrade(uid) {
    const f = findItem(+uid);
    if (!f) return;
    const it = f.it;
    const fi = forgeInfo(it);
    if (it.up >= FORGE_MAX) return;
    if (S.gold < fi.gold) return toast('Недостаточно золота');
    if ((S.cons.stone || 0) < fi.stones) return toast('Недостаточно камней заточки');
    S.gold -= fi.gold;
    S.cons.stone -= fi.stones;
    qProg('forge');
    if (chance(fi.chance)) {
      it.up++;
      S.maxUpgrade = Math.max(S.maxUpgrade, it.up);
      toast(`✨ Успех! ${itemName(it)}`);
      if (it.up >= 7) addChat('Система', `${S.name} заточил ${it.name} на +${it.up}!`, true);
      checkAch();
    } else {
      toast('💥 Неудача! Улучшение не удалось');
    }
    save(); render();
  },
  buy(id) {
    const c = CONSUMABLES[id];
    if (c.gems) {
      if (S.gems < c.gems) return toast('Недостаточно кристаллов 💎');
      S.gems -= c.gems;
    } else {
      if (S.gold < c.price) return toast('Недостаточно золота');
      S.gold -= c.price;
    }
    addCons(id);
    toast(`Куплено: ${c.icon} ${c.name}`);
    save(); render();
  },
  buyGear(i) {
    const items = shopStock();
    const it = items[+i];
    if (!it) return;
    const p = itemPrice(it) * 4;
    if (S.gold < p) return toast('Недостаточно золота');
    if (S.bag.length >= BAG_LIMIT) return toast('Рюкзак полон');
    S.gold -= p;
    it.uid = S.uid++;
    S.bag.push(it);
    items[+i] = null;
    toast(`Куплено: ${itemName(it)}`);
    save(); render();
  },
  buyGold() {
    if (S.gems < 10) return toast('Недостаточно кристаллов 💎');
    S.gems -= 10;
    S.gold += goldBag();
    toast(`+${fmt(goldBag())}💰`);
    save(); render();
  },
  clanJoin(i) {
    if (S.level < 5) return toast('Вступить в клан можно с 5 уровня');
    const name = CLAN_NAMES[+i];
    S.clan = { name, lvl: 1 + (+i * 7) % 5, exp: rnd(0, 500), donated: 0, owner: false };
    toast(`Вы вступили в клан «${name}»`);
    addChat('Система', `${S.name} вступил в клан «${name}»`, true);
    save(); render();
  },
  clanCreate() {
    const name = ($('#clanName').value || '').trim();
    if (S.level < 10) return toast('Создать клан можно с 10 уровня');
    if (name.length < 3) return toast('Название от 3 символов');
    if (S.gold < 1000) return toast('Недостаточно золота');
    S.gold -= 1000;
    S.clan = { name, lvl: 1, exp: 0, donated: 0, owner: true };
    toast(`Клан «${name}» основан!`);
    save(); render();
  },
  clanDonate(n) {
    n = +n;
    if (S.gold < n) return toast('Недостаточно золота');
    S.gold -= n;
    S.clan.exp += n;
    S.clan.donated += n;
    clanLevelCheck();
    toast(`Пожертвовано ${n}💰`);
    save(); render();
  },
  clanLeave() {
    if (!confirm('Покинуть клан? Бонус клана будет потерян.')) return;
    S.clan = null;
    save(); render();
  },
  chatSend() {
    const inp = $('#chatMsg');
    const t = (inp.value || '').trim();
    if (!t) return;
    addChat(S.name, t, false, true);
    inp.value = '';
    renderChatLog();
    if (chance(60)) {
      setTimeout(() => {
        addChat(pick(S.bots).name, pick(['согласен', 'ахах', '+', 'привет!', 'не, не так', 'го в пати', `${S.name}, ты какой класс?`, 'гуд', 'удачи в боях!']));
        if (UI.screen === 'chat') renderChatLog();
        save();
      }, rnd(2000, 6000));
    }
    save();
  },
  mailClaim(id) {
    const m = S.mail.find((x) => x.id === +id);
    if (!m || !m.reward) return;
    toast(`Получено: ${applyReward(m.reward)}`);
    m.reward = null;
    save(); render();
  },
  exportSave() {
    $('#saveCode').value = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    $('#saveCode').select();
    toast('Код сохранения создан — скопируйте его');
  },
  importSave() {
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob($('#saveCode').value.trim()))));
      if (!d || !d.name || !d.cls) throw new Error('bad');
      S = d; save(); go('main');
      toast('Сохранение загружено');
    } catch (e) { toast('Неверный код сохранения'); }
  },
  reset() {
    if (!confirm('Удалить персонажа и начать заново?')) return;
    stopAuto();
    localStorage.removeItem(SAVE_KEY);
    S = null;
    go('create');
  },
};

function dungeonStage(d, stage) {
  const lvl = Math.max(d.minLvl + 2, S.level);
  const loc = LOCATIONS[Math.min(LOCATIONS.length - 1, DUNGEONS.indexOf(d) + 1)];
  const en = stage === d.stages
    ? makeMonster(lvl + 1, d.boss, 'boss')
    : makeMonster(lvl, pick(loc.monsters), chance(25) ? 'elite' : 'normal');
  S.fight = null;
  startFight(en, 'dungeon', { dungeon: d.id, stage });
}

function newGame(name, cls) {
  S = {
    v: 1, name, cls, created: now(), level: 1, exp: 0, gold: 150, gems: 10, points: 0,
    stats: { ...CLASSES[cls].base }, hp: 1, energy: ENERGY_MAX, regenTs: now(), hpTs: now(),
    equip: Object.fromEntries(Object.keys(SLOTS).map((k) => [k, null])), bag: [], cons: { hp_small: 3, stone: 1 },
    buffs: {}, uid: 1, rating: 1000, arenaWins: 0, arenaLosses: 0, kills: 0, dungeons: 0, maxUpgrade: 0,
    dungeonCd: {}, daily: null, bonus: { date: null, streak: 0 }, ach: {}, clan: null, mail: [], chat: [], bots: [],
    arenaOpps: [], fight: null, lastDay: null, nextChat: now() + 5, shop: null,
  };
  S.equip.weapon = makeItem('weapon', 1, 0);
  S.equip.armor = makeItem('armor', 1, 0);
  S.hp = stats().maxHp;
  genBots();
  checkDay();
  for (let i = 0; i < 6; i++) addChat(pick(S.bots).name, pick(CHAT_LINES));
  sendMail('Администрация', 'Добро пожаловать в Мир Теней!',
    'Приветствуем, странник! Начни с охоты в Тёмном лесу, выполняй ежедневные задания, сражайся на арене и собирай легендарное снаряжение. Прими небольшой подарок на удачу!',
    { gold: 100, items: { hp_small: 3, stone: 2 } });
  save();
}

// ---------- boot ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act],[data-go]');
  if (!el) return;
  if (e.target.id === 'modal') { closeModal(); return; }
  e.preventDefault();
  if (el.dataset.act) {
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el.dataset.arg);
  }
  if (el.dataset.go && S) go(el.dataset.go, el.dataset.arg);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'chatMsg') ACTIONS.chatSend();
  if (e.key === 'Enter' && e.target.id === 'nick') ACTIONS.create();
});

$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

load();
if (S) {
  if (S.fight && S.fight.over && !S.fight.next) S.fight = null;
  regen();
  checkDay();
}
UI.screen = S ? 'main' : 'create';
render();
setInterval(tick, 1000);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
