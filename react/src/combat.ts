/**
 * Пошаговый бой. Один ход = выбор приёма игроком → расчёт его действия → ответ противника
 * → периодические эффекты → перезарядки и адреналин.
 *
 * combatTurn — чистая функция «состояние боя + ID приёма (+ rng) → новое состояние + строки лога».
 * Так устроен серверный обработчик хода: её можно без изменений вызвать из REST/WebSocket-эндпоинта.
 *
 * Цепочка проверки удара: точность против уворота → шанс крита → поглощение бронёй → урон.
 */
import type { Rng } from "./economy";

export type Role = "brute" | "shooter" | "surgeon";
export type EffectKind = "bleed" | "poison" | "stun" | "rage" | "focus" | "guard";
export type Effect = { kind: EffectKind; turns: number; power: number };
export type SkillId = "strike" | "bandage" | "smash" | "trip" | "aimed" | "smoke" | "venom" | "adrenaline" | "knife";

export type Combatant = {
  name: string;
  hp: number;
  maxHp: number;
  /** адреналин — ресурс приёмов (аналог маны) */
  ap: number;
  maxAp: number;
  str: number;
  agi: number;
  int: number;
  /** итоговая атака (сила + оружие + бригада) */
  atk: number;
  /** броня: поглощает armor / (armor + 100) урона */
  armor: number;
  level: number;
  effects: Effect[];
  cooldowns: Partial<Record<SkillId, number>>;
  skills: SkillId[];
};

export type Battle = {
  turn: number;
  player: Combatant;
  enemy: Combatant;
  log: string[];
  over: boolean;
  winner: "player" | "enemy" | null;
  /** сколько урона нанёс игрок за бой (для рейдов) */
  dealt: number;
  /** ограничение по ходам: после него побеждает тот, у кого больше доля здоровья */
  maxTurns: number;
};

export type Skill = {
  id: SkillId;
  name: string;
  text: string;
  cost: number;
  cooldown: number;
};
export const skills: Record<SkillId, Skill> = {
  strike: { id: "strike", name: "Удар", text: "Обычная атака. Бесплатно.", cost: 0, cooldown: 0 },
  bandage: { id: "bandage", name: "Перевязка", text: "Лечит 15% здоровья + 2 за единицу интуиции (Хирургу — 3,5).", cost: 25, cooldown: 3 },
  smash: { id: "smash", name: "Мощный удар", text: "Урон ×1.8.", cost: 20, cooldown: 2 },
  trip: { id: "trip", name: "Подсечка", text: "Урон ×0.6 и оглушение на 1 ход (шанс зависит от интуиции).", cost: 25, cooldown: 4 },
  aimed: { id: "aimed", name: "Прицельный выстрел", text: "Не промахивается, игнорирует броню, крит ×2.", cost: 25, cooldown: 3 },
  smoke: { id: "smoke", name: "Дымовая шашка", text: "+40% к увороту на 2 хода.", cost: 20, cooldown: 4 },
  venom: { id: "venom", name: "Отравленный клинок", text: "Урон ×0.8 и яд на 4 хода (от интуиции).", cost: 20, cooldown: 3 },
  adrenaline: { id: "adrenaline", name: "Стимулятор", text: "+40% к урону на 3 хода и +5 здоровья за ход.", cost: 30, cooldown: 5 },
  knife: { id: "knife", name: "Пырнуть ножом", text: "Урон ×1.0 и кровотечение на 3 хода (от силы).", cost: 20, cooldown: 3 },
};

export const roles: Record<Role, { name: string; text: string; skills: SkillId[] }> = {
  brute: { name: "Громила", text: "Сила и контроль: мощные удары и оглушение.", skills: ["strike", "smash", "trip", "knife", "bandage"] },
  shooter: { name: "Стрелок", text: "Ловкость и криты: выстрелы сквозь броню и уход от ударов.", skills: ["strike", "aimed", "smoke", "knife", "bandage"] },
  surgeon: { name: "Хирург", text: "Интуиция: яд, стимуляторы и сильное лечение.", skills: ["strike", "venom", "adrenaline", "bandage", "trip"] },
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const has = (c: Combatant, k: EffectKind) => c.effects.find((e) => e.kind === k);

// ---------------- формулы ----------------
/** Шанс попасть: точность атакующего против уворота защищающегося (55–97%). */
export function hitChance(a: Combatant, d: Combatant): number {
  const accuracy = 60 + a.agi * 2 + a.level * 2;
  let evade = d.agi * 2.2;
  if (has(d, "guard")) evade *= 1.4;
  return clamp(accuracy / (accuracy + evade * 0.8), 0.55, 0.97);
}
/** Шанс крита растёт с ловкостью (5–45%). */
export const critChance = (a: Combatant) => clamp(0.05 + a.agi / (a.agi + 120), 0.05, 0.45);
/** Доля урона, которую поглощает броня. */
export const absorb = (armor: number) => armor / (armor + 100);
/** Шанс наложить контроль: интуиция атакующего против интуиции цели (20–85%). */
export const effectChance = (a: Combatant, d: Combatant) => clamp(0.5 + (a.int - d.int) / 60, 0.2, 0.85);

type Hit = { dmg: number; text: string; landed: boolean };
/** Один удар по цепочке: промах/уворот → крит → броня. Мутирует копию цели. */
function strikeTarget(a: Combatant, d: Combatant, rng: Rng, mult: number, opt: { sure?: boolean; pierce?: boolean; critMult?: number } = {}): Hit {
  if (!opt.sure && rng() > hitChance(a, d)) return { dmg: 0, text: `${d.name} уходит от удара`, landed: false };
  const crit = rng() < critChance(a);
  let dmg = a.atk * (0.85 + rng() * 0.3) * mult;
  if (has(a, "rage")) dmg *= 1.4;
  if (crit) dmg *= opt.critMult ?? 1.5;
  if (!opt.pierce) dmg *= 1 - absorb(d.armor);
  const final = Math.max(1, Math.round(dmg));
  d.hp = Math.max(0, d.hp - final);
  return { dmg: final, text: `${crit ? "Крит! " : ""}${a.name} наносит ${final}`, landed: true };
}
function addEffect(c: Combatant, e: Effect) {
  c.effects = [...c.effects.filter((x) => x.kind !== e.kind), e];
}

/** Применить приём. Возвращает строки лога и нанесённый урон. */
function useSkill(a: Combatant, d: Combatant, id: SkillId, rng: Rng): { log: string[]; dealt: number } {
  const log: string[] = [];
  let dealt = 0;
  const hit = (mult: number, o?: Parameters<typeof strikeTarget>[4]) => {
    const r = strikeTarget(a, d, rng, mult, o);
    dealt += r.dmg;
    log.push(r.text);
    return r;
  };
  switch (id) {
    case "strike": hit(1); break;
    case "smash": log.push(`${a.name}: «Мощный удар»`); hit(1.8); break;
    case "trip": {
      log.push(`${a.name}: «Подсечка»`);
      if (hit(0.6).landed && rng() < effectChance(a, d)) { addEffect(d, { kind: "stun", turns: 1, power: 0 }); log.push(`${d.name} оглушён и пропустит ход`); }
      else log.push(`${d.name} удержался на ногах`);
      break;
    }
    case "aimed": log.push(`${a.name}: «Прицельный выстрел»`); hit(1.2, { sure: true, pierce: true, critMult: 2 }); break;
    case "smoke": addEffect(a, { kind: "guard", turns: 2, power: 0 }); log.push(`${a.name} уходит в дым: уворот +40% на 2 хода`); break;
    case "venom": {
      log.push(`${a.name}: «Отравленный клинок»`);
      if (hit(0.8).landed) { const p = Math.max(3, Math.round(4 + a.int * 1.2)); addEffect(d, { kind: "poison", turns: 4, power: p }); log.push(`${d.name} отравлен: −${p} за ход, 4 хода`); }
      break;
    }
    case "knife": {
      log.push(`${a.name}: «Пырнуть ножом»`);
      if (hit(1).landed) { const p = Math.max(2, Math.round(3 + a.str * 0.6)); addEffect(d, { kind: "bleed", turns: 3, power: p }); log.push(`${d.name} истекает кровью: −${p} за ход, 3 хода`); }
      break;
    }
    case "adrenaline": addEffect(a, { kind: "rage", turns: 3, power: 5 }); log.push(`${a.name}: «Стимулятор» — урон +40% и +5 здоровья за ход, 3 хода`); break;
    case "bandage": {
      const heal = Math.round(a.maxHp * 0.15 + a.int * (a.skills.includes("venom") ? 3.5 : 2));
      const before = a.hp;
      a.hp = Math.min(a.maxHp, a.hp + heal);
      log.push(`${a.name}: «Перевязка» +${a.hp - before} здоровья`);
      break;
    }
  }
  return { log, dealt };
}

/** Периодические эффекты в конце хода персонажа: яд, кровотечение, стимулятор; уменьшение длительности. */
function tickEffects(c: Combatant): { log: string[]; damage: number } {
  const log: string[] = [];
  let damage = 0;
  for (const e of c.effects) {
    if (e.kind === "bleed" || e.kind === "poison") {
      const d = Math.min(c.hp, e.power);
      c.hp -= d;
      damage += d;
      log.push(`${c.name}: ${e.kind === "bleed" ? "кровотечение" : "яд"} −${d}`);
    }
    if (e.kind === "rage") c.hp = Math.min(c.maxHp, c.hp + e.power);
  }
  c.effects = c.effects.map((e) => (e.kind === "stun" ? e : { ...e, turns: e.turns - 1 })).filter((e) => e.turns > 0);
  return { log, damage };
}
const coolDown = (c: Combatant) => {
  c.cooldowns = Object.fromEntries(Object.entries(c.cooldowns).map(([k, v]) => [k, Math.max(0, (v ?? 0) - 1)]).filter(([, v]) => (v as number) > 0));
  c.ap = Math.min(c.maxAp, c.ap + 8 + Math.round(c.int / 5));
};

/** Можно ли применить приём сейчас. */
export function canUse(c: Combatant, id: SkillId): boolean {
  return c.skills.includes(id) && c.ap >= skills[id].cost && !(c.cooldowns[id] ?? 0);
}

/** Выбор приёма противником: сильные приёмы, когда доступны; лечение при низком здоровье. */
export function enemyChoice(e: Combatant, rng: Rng): SkillId {
  if (e.hp < e.maxHp * 0.35 && canUse(e, "bandage")) return "bandage";
  const ready = e.skills.filter((s) => s !== "strike" && s !== "bandage" && canUse(e, s));
  return ready.length && rng() < 0.5 ? ready[Math.floor(rng() * ready.length)] : "strike";
}

function act(b: Battle, who: "player" | "enemy", id: SkillId, rng: Rng) {
  const a = who === "player" ? b.player : b.enemy, d = who === "player" ? b.enemy : b.player;
  if (has(a, "stun")) {
    a.effects = a.effects.filter((e) => e.kind !== "stun");
    b.log.push(`${a.name} оглушён и пропускает ход`);
    return;
  }
  const sk = skills[id];
  a.ap -= sk.cost;
  if (sk.cooldown) a.cooldowns = { ...a.cooldowns, [id]: sk.cooldown + 1 };
  const r = useSkill(a, d, id, rng);
  b.log.push(...r.log);
  if (who === "player") b.dealt += r.dealt;
}
function finishIfDead(b: Battle) {
  if (b.enemy.hp <= 0) { b.over = true; b.winner = "player"; b.log.push(`${b.enemy.name} повержен`); }
  else if (b.player.hp <= 0) { b.over = true; b.winner = "enemy"; b.log.push(`${b.player.name} без сознания`); }
}

/**
 * Один ход боя. Возвращает новое состояние (исходное не меняется).
 * Неверный или недоступный приём — состояние без изменений.
 */
export function combatTurn(battle: Battle, skill: SkillId, rng: Rng): Battle {
  if (battle.over || !canUse(battle.player, skill)) return battle;
  const b: Battle = structuredClone(battle);
  b.turn++;
  b.log.push(`— Ход ${b.turn} —`);
  act(b, "player", skill, rng);
  finishIfDead(b);
  if (!b.over) {
    const dot = tickEffects(b.enemy);
    b.log.push(...dot.log);
    b.dealt += dot.damage;
    finishIfDead(b);
  }
  if (!b.over) {
    act(b, "enemy", enemyChoice(b.enemy, rng), rng);
    finishIfDead(b);
  }
  if (!b.over) {
    b.log.push(...tickEffects(b.player).log);
    finishIfDead(b);
  }
  coolDown(b.player);
  coolDown(b.enemy);
  if (!b.over && b.turn >= b.maxTurns) {
    b.over = true;
    b.winner = b.player.hp / b.player.maxHp >= b.enemy.hp / b.enemy.maxHp ? "player" : "enemy";
    b.log.push(`Время вышло: ${b.winner === "player" ? "преимущество за тобой" : "преимущество у противника"}`);
  }
  return b;
}

/** Сдаться / сбежать: бой заканчивается поражением. */
export function flee(battle: Battle): Battle {
  if (battle.over) return battle;
  return { ...battle, over: true, winner: "enemy", log: [...battle.log, `${battle.player.name} уходит из боя`] };
}

export function startBattle(player: Combatant, enemy: Combatant, maxTurns = 25): Battle {
  return { turn: 0, player, enemy, log: [`${player.name} против ${enemy.name}`], over: false, winner: null, dealt: 0, maxTurns };
}

/** Противник с набором приёмов по уровню. */
export function npcCombatant(o: { name: string; hp: number; maxHp?: number; atk: number; def: number; agi: number; level: number; int?: number }, kind: "street" | "boss" = "street"): Combatant {
  const int = o.int ?? Math.round(5 + o.level * 1.5);
  const sk: SkillId[] = kind === "boss" ? ["strike", "smash", "knife", "trip"] : o.level >= 8 ? ["strike", "smash", "knife"] : o.level >= 4 ? ["strike", "smash"] : ["strike"];
  return {
    name: o.name, hp: o.hp, maxHp: o.maxHp ?? o.hp, ap: 40, maxAp: 60 + int * 2,
    str: Math.round(o.atk / 2), agi: o.agi, int, atk: o.atk, armor: o.def, level: o.level,
    effects: [], cooldowns: {}, skills: sk,
  };
}
