// EMPIRE CITY — пошаговый бой (перенос движка из react/src/combat.ts).
// Ход: выбор приёма → удар игрока → периодические эффекты → ответ противника → перезарядки и адреналин.
// Цепочка удара: точность против уворота → шанс крита → поглощение бронёй.
"use strict";

const CB = (() => {
  const SKILLS = {
    strike: { name: "Удар", text: "Обычная атака. Бесплатно.", cost: 0, cd: 0, icon: "swords" },
    bandage: { name: "Перевязка", text: "Лечит 15% здоровья + 2 за интуицию (Хирургу — 3,5).", cost: 25, cd: 3, icon: "heart" },
    smash: { name: "Мощный удар", text: "Урон ×1.8.", cost: 20, cd: 2, icon: "bolt" },
    trip: { name: "Подсечка", text: "Урон ×0.6 и оглушение на 1 ход (шанс от интуиции).", cost: 25, cd: 4, icon: "paw" },
    aimed: { name: "Прицельный выстрел", text: "Не промахивается, игнорирует броню, крит ×2.", cost: 25, cd: 3, icon: "crosshair" },
    smoke: { name: "Дымовая шашка", text: "+40% к увороту на 2 хода.", cost: 20, cd: 4, icon: "drops" },
    venom: { name: "Отравленный клинок", text: "Урон ×0.8 и яд на 4 хода (от интуиции).", cost: 20, cd: 3, icon: "skull" },
    adrenaline: { name: "Стимулятор", text: "+40% к урону на 3 хода и +5 здоровья за ход.", cost: 30, cd: 5, icon: "medkit" },
    knife: { name: "Пырнуть ножом", text: "Урон ×1.0 и кровотечение на 3 хода (от силы).", cost: 20, cd: 3, icon: "sword" }
  };
  const ROLES = {
    brute: { name: "Громила", text: "Сила и контроль: мощные удары и оглушение.", skills: ["strike", "smash", "trip", "knife", "bandage"], icon: "dumbbell" },
    shooter: { name: "Стрелок", text: "Ловкость и криты: выстрелы сквозь броню и уход от ударов.", skills: ["strike", "aimed", "smoke", "knife", "bandage"], icon: "crosshair" },
    surgeon: { name: "Хирург", text: "Интуиция: яд, стимуляторы и сильное лечение.", skills: ["strike", "venom", "adrenaline", "bandage", "trip"], icon: "medkit" }
  };
  const EFFECT_NAME = { bleed: "Кровотечение", poison: "Яд", stun: "Оглушён", rage: "Стимулятор", guard: "Дым" };
  const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
  const has = (c, k) => c.effects.find(e => e.kind === k);

  const hitChance = (a, d) => { const acc = 60 + a.agi * 2 + a.level * 2; let ev = d.agi * 2.2; if (has(d, "guard")) ev *= 1.4; return clampN(acc / (acc + ev * 0.8), 0.55, 0.97); };
  const critChance = a => clampN(0.05 + a.agi / (a.agi + 120), 0.05, 0.45);
  const absorb = armor => armor / (armor + 100);
  const effectChance = (a, d) => clampN(0.5 + (a.int - d.int) / 60, 0.2, 0.85);

  function strikeTarget(a, d, rng, mult, o = {}) {
    if (!o.sure && rng() > hitChance(a, d)) return { dmg: 0, text: `${d.name} уходит от удара`, landed: false };
    const crit = rng() < critChance(a);
    let dmg = a.atk * (0.85 + rng() * 0.3) * mult;
    if (has(a, "rage")) dmg *= 1.4;
    if (crit) dmg *= o.critMult || 1.5;
    if (!o.pierce) dmg *= 1 - absorb(d.armor);
    const fin = Math.max(1, Math.round(dmg));
    d.hp = Math.max(0, d.hp - fin);
    return { dmg: fin, text: `${crit ? "Крит! " : ""}${a.name} наносит ${fin}`, landed: true };
  }
  const addEffect = (c, e) => { c.effects = c.effects.filter(x => x.kind !== e.kind).concat([e]); };

  function useSkill(a, d, id, rng) {
    const log = []; let dealt = 0;
    const hit = (m, o) => { const r = strikeTarget(a, d, rng, m, o); dealt += r.dmg; log.push(r.text); return r; };
    switch (id) {
      case "strike": hit(1); break;
      case "smash": log.push(`${a.name}: «Мощный удар»`); hit(1.8); break;
      case "trip":
        log.push(`${a.name}: «Подсечка»`);
        if (hit(0.6).landed && rng() < effectChance(a, d)) { addEffect(d, { kind: "stun", turns: 1, power: 0 }); log.push(`${d.name} оглушён и пропустит ход`); }
        else log.push(`${d.name} удержался на ногах`);
        break;
      case "aimed": log.push(`${a.name}: «Прицельный выстрел»`); hit(1.2, { sure: true, pierce: true, critMult: 2 }); break;
      case "smoke": addEffect(a, { kind: "guard", turns: 2, power: 0 }); log.push(`${a.name} уходит в дым: уворот +40% на 2 хода`); break;
      case "venom":
        log.push(`${a.name}: «Отравленный клинок»`);
        if (hit(0.8).landed) { const p = Math.max(3, Math.round(4 + a.int * 1.2)); addEffect(d, { kind: "poison", turns: 4, power: p }); log.push(`${d.name} отравлен: −${p} за ход, 4 хода`); }
        break;
      case "knife":
        log.push(`${a.name}: «Пырнуть ножом»`);
        if (hit(1).landed) { const p = Math.max(2, Math.round(3 + a.str * 0.6)); addEffect(d, { kind: "bleed", turns: 3, power: p }); log.push(`${d.name} истекает кровью: −${p} за ход, 3 хода`); }
        break;
      case "adrenaline": addEffect(a, { kind: "rage", turns: 3, power: 5 }); log.push(`${a.name}: «Стимулятор» — урон +40% и +5 здоровья за ход, 3 хода`); break;
      case "bandage": {
        const heal = Math.round(a.maxHp * 0.15 + a.int * (a.skills.includes("venom") ? 3.5 : 2)), before = a.hp;
        a.hp = Math.min(a.maxHp, a.hp + heal);
        log.push(`${a.name}: «Перевязка» +${a.hp - before} здоровья`);
        break;
      }
    }
    return { log, dealt };
  }
  function tickEffects(c) {
    const log = []; let damage = 0;
    for (const e of c.effects) {
      if (e.kind === "bleed" || e.kind === "poison") { const d = Math.min(c.hp, e.power); c.hp -= d; damage += d; log.push(`${c.name}: ${e.kind === "bleed" ? "кровотечение" : "яд"} −${d}`); }
      if (e.kind === "rage") c.hp = Math.min(c.maxHp, c.hp + e.power);
    }
    c.effects = c.effects.map(e => e.kind === "stun" ? e : Object.assign({}, e, { turns: e.turns - 1 })).filter(e => e.turns > 0);
    return { log, damage };
  }
  function coolDown(c) {
    const cd = {};
    for (const k in c.cooldowns) if (c.cooldowns[k] - 1 > 0) cd[k] = c.cooldowns[k] - 1;
    c.cooldowns = cd;
    c.ap = Math.min(c.maxAp, c.ap + 8 + Math.round(c.int / 5));
  }
  const canUse = (c, id) => c.skills.includes(id) && c.ap >= SKILLS[id].cost && !(c.cooldowns[id] || 0);
  function enemyChoice(e, rng) {
    if (e.hp < e.maxHp * 0.35 && canUse(e, "bandage")) return "bandage";
    const ready = e.skills.filter(s => s !== "strike" && s !== "bandage" && canUse(e, s));
    return ready.length && rng() < 0.5 ? ready[Math.floor(rng() * ready.length)] : "strike";
  }
  function act(b, who, id, rng) {
    const a = who === "player" ? b.player : b.enemy, d = who === "player" ? b.enemy : b.player;
    if (has(a, "stun")) { a.effects = a.effects.filter(e => e.kind !== "stun"); b.log.push(`${a.name} оглушён и пропускает ход`); return; }
    const sk = SKILLS[id];
    a.ap -= sk.cost;
    if (sk.cd) a.cooldowns = Object.assign({}, a.cooldowns, { [id]: sk.cd + 1 });
    const r = useSkill(a, d, id, rng);
    b.log.push(...r.log);
    if (who === "player") b.dealt += r.dealt;
  }
  function finishIfDead(b) {
    if (b.enemy.hp <= 0) { b.over = true; b.winner = "player"; b.log.push(`${b.enemy.name} повержен`); }
    else if (b.player.hp <= 0) { b.over = true; b.winner = "enemy"; b.log.push(`${b.player.name} без сознания`); }
  }
  /** Один ход. Чистая функция: исходный бой не меняется. */
  function turn(battle, skill, rng) {
    if (battle.over || !canUse(battle.player, skill)) return battle;
    const b = JSON.parse(JSON.stringify(battle));
    b.turn++; b.log.push(`— Ход ${b.turn} —`);
    act(b, "player", skill, rng); finishIfDead(b);
    if (!b.over) { const dot = tickEffects(b.enemy); b.log.push(...dot.log); b.dealt += dot.damage; finishIfDead(b); }
    if (!b.over) { act(b, "enemy", enemyChoice(b.enemy, rng), rng); finishIfDead(b); }
    if (!b.over) { b.log.push(...tickEffects(b.player).log); finishIfDead(b); }
    coolDown(b.player); coolDown(b.enemy);
    if (!b.over && b.turn >= b.maxTurns) {
      b.over = true;
      b.winner = b.player.hp / b.player.maxHp >= b.enemy.hp / b.enemy.maxHp ? "player" : "enemy";
      b.log.push(`Время вышло: ${b.winner === "player" ? "преимущество за тобой" : "преимущество у противника"}`);
    }
    return b;
  }
  const flee = b => b.over ? b : Object.assign({}, b, { over: true, winner: "enemy", log: b.log.concat([`${b.player.name} уходит из боя`]) });
  const start = (player, enemy, maxTurns = 25) => ({ turn: 0, player, enemy, log: [`${player.name} против ${enemy.name}`], over: false, winner: null, dealt: 0, maxTurns });
  function npc(o, kind) {
    const int = o.int != null ? o.int : Math.round(5 + o.level * 1.5);
    const sk = kind === "boss" ? ["strike", "smash", "knife", "trip"] : o.level >= 8 ? ["strike", "smash", "knife"] : o.level >= 4 ? ["strike", "smash"] : ["strike"];
    return { name: o.name, hp: o.hp, maxHp: o.maxHp || o.hp, ap: 40, maxAp: 60 + int * 2, str: Math.round(o.atk / 2), agi: o.agi, int, atk: o.atk, armor: o.def, level: o.level, effects: [], cooldowns: {}, skills: sk };
  }
  return { SKILLS, ROLES, EFFECT_NAME, turn, flee, start, npc, canUse, absorb };
})();

// ---------------- связь с игрой ----------------
// новые поля персонажа: интуиция и стиль боя (старые сохранения получают значения по умолчанию)
function ensureCombatFields() {
  if (!S) return;
  if (S.stats.int == null) S.stats.int = 5;
  if (!S.role || !CB.ROLES[S.role]) S.role = "brute";
}
window.newState = (orig => name => { const s = orig(name); s.stats.int = 5; s.role = "brute"; return s; })(window.newState);
ensureCombatFields();

const maxAdrenaline = () => 60 + S.stats.int * 3;
function playerCombatant(kind) {
  ensureCombatFields();
  let a = atk();
  if (S.buffs && S.buffs.ammo > 0) { a = Math.round(a * 1.25); S.buffs.ammo--; }
  if (kind === "raid") a = Math.round(a * (1 + perk("raidDmgPct") / 100));
  return { name: S.name, hp: S.hp, maxHp: maxHp(), ap: maxAdrenaline(), maxAp: maxAdrenaline(), str: totStr(), agi: totAgi(), int: S.stats.int, atk: a, armor: def(), level: S.level, effects: [], cooldowns: {}, skills: CB.ROLES[S.role].skills };
}

let BT = null; // текущий бой: { battle, kind, opp, id, art, result }

function beginBattle(kind, battle, extra) {
  BT = Object.assign({ kind, battle, result: null }, extra);
  save(); render(); drawBattle();
}
function settleBattle() {
  const b = BT.battle, win = b.winner === "player";
  S.hp = Math.max(1, b.player.hp);
  let msg;
  if (BT.kind === "fight") {
    const o = BT.opp;
    if (win) {
      S.wins++; S.rep.street++; dogWin(5);
      msg = "Победа! " + give({ cash: o.level * rnd(40, 90), xp: 4 + o.level, auth: rnd(1, 3) });
      addLog(`Победа над ${o.name} [${o.level}]`);
    } else {
      S.losses++;
      const alibi = S.buffs.alibi;
      const lost = alibi ? 0 : Math.round(S.cash * (perk("lossPct") ? 0.05 : 0.1));
      if (alibi) S.buffs.alibi = 0;
      S.cash -= lost; addXp(1);
      msg = alibi ? "Поражение, но алиби сработало: деньги при тебе" : `Поражение: −$${fmt(lost)} (сейф не тронут)`;
      addLog(`Поражение от ${o.name} [${o.level}]`);
    }
    genOpponents();
  } else if (BT.kind === "raid") {
    const bo = DATA.bosses.find(x => x.id === BT.id);
    if (b.enemy.hp <= 0) {
      S.bossKills[bo.id] = (S.bossKills[bo.id] || 0) + 1;
      S.bosses[bo.id] = { hp: 0, t: Date.now(), dead: Date.now() };
      msg = "Босс повержен! " + give({ cash: bo.cash, xp: Math.round(bo.xp * (1 + perk("raidXpPct") / 100)), gold: bo.gold, auth: 10 });
      addLog(`Рейд: ${bo.name} повержен`);
    } else {
      S.bosses[bo.id] = { hp: b.enemy.hp, t: Date.now() }; addXp(2);
      msg = `Нанесено ${fmt(b.dealt)} урона. У босса осталось ${fmt(b.enemy.hp)} из ${fmt(bo.hp)}`;
    }
  } else {
    const d = DATA.districts.find(x => x.id === BT.id);
    if (win) {
      S.districts[d.id] = Date.now(); S.wins++; S.rep.street += 5;
      msg = `${d.name} под контролем! ` + give({ cash: d.inc * 3, xp: 25 + d.lvl * 6 });
      addLog(`Район ${d.name} теперь твой!`);
    } else { S.losses++; addXp(3); msg = `Штурм сорвался: ${d.boss} устояли`; }
  }
  BT.result = msg;
  save(); render();
}

Object.assign(A, {
  fight(i) {
    const o = S._opps && S._opps[i];
    if (!o || !needHp() || !needEnergy(5)) return;
    S.energy -= 5;
    beginBattle("fight", CB.start(playerCombatant("fight"), CB.npc(o)), { opp: o, art: ART.opponent(o.seed) });
  },
  raid(id) {
    const bo = DATA.bosses.find(x => x.id === id), st = bossState(bo);
    if (S.level < bo.lvl || st.dead || !needHp() || !needEnergy(10)) return;
    S.energy -= 10;
    beginBattle("raid", CB.start(playerCombatant("raid"), CB.npc({ name: bo.name, hp: st.hp, maxHp: bo.hp, atk: bo.atk, def: bo.def, agi: bo.lvl, level: bo.lvl }, "boss"), 6), { id, art: ART.boss(id) });
  },
  capture(id) {
    const d = DATA.districts.find(x => x.id === id);
    if (S.districts[id] || S.level < d.lvl || !needHp() || !needEnergy(captureEn())) return;
    S.energy -= captureEn();
    beginBattle("turf", CB.start(playerCombatant("turf"), CB.npc({ name: d.boss, hp: Math.round(d.hp * 1.3), atk: Math.round(d.atk * 0.75), def: Math.round(d.def * 0.7), agi: d.lvl * 2, level: d.lvl })), { id, art: ART.boss("baron") });
  },
  setRole(r) { ensureCombatFields(); if (!CB.ROLES[r]) return; S.role = r; save(); render(); toast("Стиль боя: " + CB.ROLES[r].name); }
});

function battleSkill(id) {
  if (!BT || BT.battle.over) return;
  const nb = CB.turn(BT.battle, id, Math.random);
  if (nb === BT.battle) return;
  BT.battle = nb;
  if (nb.over) settleBattle();
  drawBattle();
}
function battleFlee() { if (!BT || BT.battle.over) return; BT.battle = CB.flee(BT.battle); settleBattle(); drawBattle(); }
function battleClose() { BT = null; const el = document.getElementById("battle"); if (el) el.remove(); render(); }

function drawBattle() {
  let el = document.getElementById("battle");
  if (!BT) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "battle"; el.className = "battle-overlay"; document.body.appendChild(el); }
  const b = BT.battle, p = b.player, e = b.enemy;
  const side = (c, art) => `<div class="bf"><div class="bport">${art}</div><b>${esc(c.name)}</b>
    <div class="bbar hp"><i style="width:${c.hp / c.maxHp * 100}%"></i><span>${c.hp} / ${c.maxHp}</span></div>
    <div class="bbar ap"><i style="width:${c.ap / c.maxAp * 100}%"></i><span>адреналин ${c.ap}</span></div>
    <div class="beff">${c.effects.map(x => `<span>${CB.EFFECT_NAME[x.kind]}${x.kind !== "stun" ? " · " + x.turns : ""}</span>`).join("")}</div></div>`;
  const title = b.over ? (b.winner === "player" ? "Победа" : "Поражение") : (BT.kind === "raid" ? "Рейд" : BT.kind === "turf" ? "Штурм" : "Бой") + " · ход " + (b.turn + 1);
  el.innerHTML = `<section class="bbox">
    <h3 class="btitle">${title}</h3>
    <div class="bsides">${side(p, ART.hero(S))}<span class="bvs">VS</span>${side(e, BT.art)}</div>
    <div class="blog" id="blog">${b.log.slice(-40).map(l => `<div class="${l.startsWith("—") ? "turn" : l.startsWith("Крит") ? "crit" : ""}">${esc(l)}</div>`).join("")}</div>
    ${b.over ? `<p class="${b.winner === "player" ? "good" : "bad"}"><b>${BT.result || ""}</b></p><button class="btn green" onclick="battleClose()">Закрыть</button>` : `
      <div class="bskills">${p.skills.map(id => { const sk = CB.SKILLS[id], cd = p.cooldowns[id] || 0;
        return `<button class="bskill" ${CB.canUse(p, id) ? "" : "disabled"} onclick="battleSkill('${id}')" title="${esc(sk.text)}"><span class="bico">${metal(sk.icon)}</span><b>${sk.name}</b><small>${cd ? "перезарядка " + cd : sk.cost ? "адреналин " + sk.cost : "бесплатно"}</small></button>`; }).join("")}</div>
      <button class="btn bflee" onclick="battleFlee()">Уйти из боя</button>
      <p class="small muted center">Броня поглощает ${Math.round(CB.absorb(p.armor) * 100)}% урона · стиль: ${CB.ROLES[S.role].name}</p>`}
  </section>`;
  const lg = document.getElementById("blog"); if (lg) lg.scrollTop = lg.scrollHeight;
}

// «Хата»: стиль боя и тренировка интуиции
SCREENS.home = (orig => () => {
  ensureCombatFields();
  const roles = Object.keys(CB.ROLES).map(r => `<div class="card"><div class="cico">${metal(CB.ROLES[r].icon)}</div><div class="cbody"><b>${CB.ROLES[r].name}</b><small>${CB.ROLES[r].text}</small></div>
    ${S.role === r ? `<span class="lock good">Выбран</span>` : `<button class="btn sm" onclick="A.setRole('${r}')">Выбрать</button>`}</div>`).join("");
  const intRow = `<div class="card"><div class="cico">${metal("star")}</div><div class="cbody"><b>Интуиция: ${S.stats.int}</b><small>приёмы, лечение, яд, оглушение; +3 адреналина</small></div>
    <span class="rowbtns">${S.points > 0 ? `<button class="btn sm green" onclick="A.point('int')">+1</button>` : ""}<button class="btn sm" onclick="A.train('int')">$${short(statPrice(S.stats.int))}</button></span></div>`;
  return orig().replace(`<h4 class="sub">Тренировки</h4>`, `<h4 class="sub">Стиль боя</h4>${roles}<h4 class="sub">Тренировки</h4>${intRow}`);
})(SCREENS.home);

// подсказка о пошаговом бое в «Боях»
SCREENS.fights = (orig => () => orig().replace("Драка стоит ⚡5.", `Пошаговый бой: каждый ход выбирай удар или приём. Стиль — ${CB.ROLES[S.role || "brute"].name} (меняется в «Хате»). Драка стоит ⚡5.`))(SCREENS.fights);
