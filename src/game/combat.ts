import { CLASSES } from '../data/classes';
import { SHADOWS } from '../data/shadows';
import type {
  ArenaOpponent,
  ClassAbility,
  ClassId,
  Combatant,
  CombatState,
  CombatStep,
  EnemyAbilityId,
  EnemyTemplate,
  FloatKind,
  GameState,
  LogKind,
  PlayerAction,
  ShadowAbility,
  SoundId,
  Status,
  StatusId,
} from '../types';
import { chance, pick, rand } from '../utils/random';
import { computeStats } from './stats';
import { equippedShadowInstances, heroStats } from './hero';

// ================== Construction ==================

export const PLAYER_MAX_ENERGY = 100;
export const HEAVY_COST = 30;
export const POTION_HEAL = 0.35;
export const DARKNESS_TURN = 25;

export const getUnlockedAbilities = (classId: ClassId, level: number): ClassAbility[] =>
  CLASSES[classId].abilities.filter((a) => a.unlockLevel <= level);

function shadowAbilitiesOf(state: GameState) {
  return equippedShadowInstances(state).map((s) => ({ ability: SHADOWS[s.defId].ability, tier: s.tier }));
}

export function createPlayerCombatant(state: GameState): Combatant {
  const hero = state.hero!;
  const st = heroStats(state);
  const cls = CLASSES[hero.classId];
  return {
    id: 'player',
    name: hero.name,
    icon: cls.icon,
    color: cls.color,
    level: hero.level,
    isPlayer: true,
    classId: hero.classId,
    maxHp: st.maxHp,
    hp: Math.max(1, Math.min(hero.hp, st.maxHp)),
    atk: st.atk,
    def: st.def,
    critChance: st.critChance,
    critDmg: st.critDmg,
    speed: st.speed,
    dodge: st.dodge,
    block: st.block,
    bleedChance: st.bleedChance,
    lifesteal: st.lifesteal,
    magicPct: st.magicPct,
    energy: 20,
    maxEnergy: PLAYER_MAX_ENERGY,
    statuses: [],
    abilities: [],
    cooldowns: {},
    shadowAbilities: shadowAbilitiesOf(state),
    flags: {},
  };
}

export function enemyBaseStats(t: EnemyTemplate, level: number) {
  return {
    maxHp: Math.round((50 + level * 24) * (1 + level * 0.045) * t.hpMul),
    atk: Math.round((10 + level * 3.3) * (1 + level * 0.03) * t.atkMul),
    def: Math.round((3 + level * 1.4) * (1 + level * 0.02) * t.defMul),
  };
}

export function createEnemyCombatant(t: EnemyTemplate, level: number): Combatant {
  const b = enemyBaseStats(t, level);
  return {
    id: 'enemy',
    name: t.name,
    icon: t.icon,
    color: t.color,
    level,
    isPlayer: false,
    maxHp: b.maxHp,
    hp: b.maxHp,
    atk: b.atk,
    def: b.def,
    critChance: t.critChance ?? 5,
    critDmg: 150,
    speed: t.speed + level * 0.25,
    dodge: t.dodge ?? 3,
    block: t.boss ? 5 : 0,
    bleedChance: 0,
    lifesteal: 0,
    magicPct: 0,
    energy: 0,
    maxEnergy: 0,
    statuses: [],
    abilities: t.abilities,
    cooldowns: {},
    boss: t.boss,
    shadowAbilities: [],
    flags: {},
  };
}

const ARENA_AI: Record<ClassId, EnemyAbilityId[]> = {
  berserker: ['frenzy', 'bleedStrike', 'heavyBlow'],
  guardian: ['guard', 'stunBash', 'heavyBlow'],
  assassin: ['shadowStrike', 'bleedStrike', 'poisonBite'],
  shadowmage: ['fireBolt', 'weakenCurse', 'drainLife'],
};

export function createArenaCombatant(o: ArenaOpponent): Combatant {
  const st = computeStats({ classId: o.classId, level: o.level, attributes: o.attributes, gear: o.gear, shadows: [] });
  const cls = CLASSES[o.classId];
  return {
    id: 'enemy',
    name: o.name,
    icon: cls.icon,
    color: cls.color,
    level: o.level,
    isPlayer: false,
    classId: o.classId,
    maxHp: st.maxHp,
    hp: st.maxHp,
    atk: st.atk,
    def: st.def,
    critChance: st.critChance,
    critDmg: st.critDmg,
    speed: st.speed,
    dodge: st.dodge,
    block: st.block,
    bleedChance: st.bleedChance,
    lifesteal: st.lifesteal,
    magicPct: st.magicPct,
    energy: 0,
    maxEnergy: 0,
    statuses: [],
    abilities: ARENA_AI[o.classId],
    cooldowns: {},
    shadowAbilities: [],
    flags: {},
  };
}

// ================== Engine internals ==================

interface Ctx {
  cs: CombatState;
  steps: CombatStep[];
}

type Side = 'player' | 'enemy';
const sideOf = (c: Combatant): Side => (c.isPlayer ? 'player' : 'enemy');
const other = (ctx: Ctx, c: Combatant) => (c.isPlayer ? ctx.cs.enemy : ctx.cs.player);

function log(ctx: Ctx, text: string, kind: LogKind) {
  ctx.cs.logSeq += 1;
  ctx.cs.log.push({ id: ctx.cs.logSeq, text, kind });
  if (ctx.cs.log.length > 60) ctx.cs.log.splice(0, ctx.cs.log.length - 60);
}

function step(
  ctx: Ctx,
  target: Side,
  opts: { float?: { text: string; kind: FloatKind }; anim?: CombatStep['anim']; actor?: Side; sound?: SoundId } = {},
) {
  ctx.steps.push({ target, ...opts, snapshot: structuredClone(ctx.cs) });
}

const getStatus = (c: Combatant, id: StatusId) => c.statuses.find((s) => s.id === id);
const statusValue = (c: Combatant, id: StatusId) => getStatus(c, id)?.value ?? 0;

function addStatus(c: Combatant, id: StatusId, turns: number, value: number, stack = false) {
  if (id === 'stun' && (c.flags.stunImmune ?? 0) > 0) return false;
  const ex = getStatus(c, id);
  if (ex) {
    ex.turns = Math.max(ex.turns, turns);
    ex.value = stack ? ex.value + value : Math.max(ex.value, value);
  } else {
    c.statuses.push({ id, turns, value });
  }
  return true;
}

const removeStatus = (c: Combatant, id: StatusId) => {
  c.statuses = c.statuses.filter((s) => s.id !== id);
};

const shadowTier = (c: Combatant, a: ShadowAbility) =>
  c.shadowAbilities.filter((s) => s.ability === a).reduce((m, s) => Math.max(m, s.tier), 0);

function effAtk(c: Combatant) {
  let a = c.atk;
  a *= 1 + statusValue(c, 'atkUp') / 100;
  a *= 1 - statusValue(c, 'weaken') / 100;
  a *= 1 - (c.flags.atkStolen ?? 0) / 100;
  a *= 1 + (c.flags.bonusAtk ?? 0) / 100;
  if (getStatus(c, 'enraged')) a *= 1 + statusValue(c, 'enraged') / 100;
  if (c.boss === 'towerWarden') a *= 1 + (c.flags.stacks ?? 0) * 0.06;
  return a;
}

function effDef(c: Combatant) {
  let d = c.def;
  d *= 1 + statusValue(c, 'defUp') / 100;
  d *= 1 - statusValue(c, 'vulnerable') / 100;
  return Math.max(0, d);
}

function effDodge(c: Combatant) {
  const t = shadowTier(c, 'evasion');
  return Math.min(75, c.dodge + statusValue(c, 'evasive') + (t ? 2 + t * 2 : 0));
}

function effCrit(c: Combatant) {
  const t = shadowTier(c, 'critBoost');
  return { chance: c.critChance + (t ? 2 + t * 2 : 0), dmg: c.critDmg + (t ? 5 + t * 5 : 0) };
}

function heal(ctx: Ctx, c: Combatant, amount: number, label?: string, silent = false) {
  const before = c.hp;
  c.hp = Math.min(c.maxHp, c.hp + Math.round(amount));
  const healed = c.hp - before;
  if (healed > 0 && !silent) {
    if (label) log(ctx, label.replace('{n}', String(healed)), 'heal');
    step(ctx, sideOf(c), { float: { text: `+${healed} HP`, kind: 'heal' }, anim: 'heal', sound: 'heal' });
  }
  return healed;
}

function checkDeath(ctx: Ctx) {
  const { player, enemy } = ctx.cs;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    ctx.cs.over = true;
    ctx.cs.winner = 'player';
  } else if (player.hp <= 0) {
    player.hp = 0;
    ctx.cs.over = true;
    ctx.cs.winner = 'enemy';
  }
  return ctx.cs.over;
}

interface HitOpts {
  mult: number;
  flat?: number;
  magic?: boolean;
  defPen?: number; // 0..1 part of defence ignored
  guaranteedCrit?: boolean;
  canDodge?: boolean;
  noOnHit?: boolean;
  label?: string;
}

interface HitResult {
  dmg: number;
  crit: boolean;
  missed: boolean;
}

function applyRawDamage(target: Combatant, amount: number) {
  let dmg = Math.max(0, Math.round(amount));
  const shield = getStatus(target, 'shield');
  let absorbed = 0;
  if (shield && dmg > 0) {
    absorbed = Math.min(shield.value, dmg);
    shield.value -= absorbed;
    dmg -= absorbed;
    if (shield.value <= 0) removeStatus(target, 'shield');
  }
  target.hp -= dmg;
  return { dmg, absorbed };
}

function hit(ctx: Ctx, attacker: Combatant, defender: Combatant, o: HitOpts): HitResult {
  const aSide = sideOf(attacker);
  const dSide = sideOf(defender);
  const who = attacker.isPlayer ? 'Вы' : attacker.name;

  if (o.canDodge !== false && chance(effDodge(defender))) {
    log(ctx, attacker.isPlayer ? `${defender.name} уклоняется от вашей атаки!` : `Вы уклонились от атаки: ${attacker.name}!`, 'system');
    step(ctx, dSide, { float: { text: 'MISS', kind: 'miss' }, anim: 'dodge', actor: aSide, sound: 'miss' });
    return { dmg: 0, crit: false, missed: true };
  }

  let raw = effAtk(attacker) * o.mult + (o.flat ?? 0);
  // Guardian passive: armour turns into force
  if (attacker.classId === 'guardian') raw += effDef(attacker) * 0.8 * o.mult;
  raw *= rand(0.92, 1.08);
  if (o.magic) raw *= 1 + attacker.magicPct / 100;

  // Shadow passives
  const rageT = shadowTier(attacker, 'rage');
  if (rageT && attacker.hp < attacker.maxHp * 0.5) raw *= 1 + (10 + rageT * 6) / 100;
  const execT = shadowTier(attacker, 'executioner');
  if (execT && defender.hp < defender.maxHp * 0.3) raw *= 1 + (15 + execT * 10) / 100;
  const fsT = shadowTier(attacker, 'firstStrike');
  if (fsT && !attacker.flags.firstStrikeUsed) {
    attacker.flags.firstStrikeUsed = 1;
    raw *= 1 + (40 + fsT * 20) / 100;
  }
  // Boss: execution
  if (attacker.boss === 'executioner' && defender.hp < defender.maxHp * 0.35) {
    raw *= 2;
    log(ctx, `${attacker.name} чует слабость — КАЗНЬ! Урон удвоен!`, 'boss');
  }

  // Long fights: the darkness thickens and everybody hits harder
  if (ctx.cs.turn > DARKNESS_TURN) raw *= 1 + (ctx.cs.turn - DARKNESS_TURN) * 0.1;

  const critInfo = effCrit(attacker);
  const crit = o.guaranteedCrit || chance(critInfo.chance);
  if (crit) raw *= critInfo.dmg / 100;

  const def = effDef(defender) * (1 - (o.defPen ?? 0));
  const reduction = Math.min(0.75, def / (def + 60 + attacker.level * 8));
  raw *= 1 - reduction;

  const guarding = getStatus(defender, 'guarding');
  if (guarding) raw *= 1 - guarding.value / 100;

  let blocked = false;
  if (chance(defender.block + (guarding ? 15 : 0))) {
    blocked = true;
    raw *= 0.35;
  }

  const { dmg, absorbed } = applyRawDamage(defender, Math.max(1, raw));
  const total = dmg + absorbed;

  if (attacker.isPlayer && crit) ctx.cs.crits += 1;

  const label = o.label ? ` (${o.label})` : '';
  if (blocked) {
    log(ctx, attacker.isPlayer ? `${defender.name} блокирует! Урон: ${total}${label}` : `Вы заблокировали удар! Получено ${total} урона.`, 'system');
    step(ctx, dSide, { float: { text: `BLOCK -${total}`, kind: 'block' }, anim: 'block', actor: aSide, sound: 'block' });
  } else if (crit) {
    log(ctx, attacker.isPlayer ? `КРИТИЧЕСКИЙ УДАР! Вы нанесли ${total} урона${label}.` : `${who} наносит критический удар: ${total} урона${label}!`, 'crit');
    step(ctx, dSide, { float: { text: `CRITICAL -${total}`, kind: 'crit' }, anim: 'crit', actor: aSide, sound: 'crit' });
  } else {
    log(ctx, attacker.isPlayer ? `Вы нанесли ${total} урона${label}.` : `${who} наносит вам ${total} урона${label}.`, attacker.isPlayer ? 'player' : 'enemy');
    step(ctx, dSide, { float: { text: `-${total}`, kind: 'dmg' }, anim: 'hit', actor: aSide, sound: 'hit' });
  }
  if (absorbed > 0) log(ctx, `Щит поглотил ${absorbed} урона.`, 'status');

  // Reflection: castellan shield, thorns shadow
  if (defender.boss === 'ironCastellan' && getStatus(defender, 'shield')) {
    const refl = Math.round(total * 0.2);
    if (refl > 0) {
      attacker.hp -= refl;
      log(ctx, `Теневой щит отражает ${refl} урона!`, 'boss');
      step(ctx, aSide, { float: { text: `-${refl}`, kind: 'dot' }, anim: 'hit' });
    }
  }
  const thornsT = shadowTier(defender, 'thorns');
  if (thornsT && total > 0) {
    const refl = Math.round(total * (6 + thornsT * 4) / 100);
    if (refl > 0) {
      attacker.hp -= refl;
      log(ctx, `Шипы тени отражают ${refl} урона.`, 'status');
      step(ctx, aSide, { float: { text: `-${refl}`, kind: 'dot' } });
    }
  }

  // Lifesteal
  const lsT = shadowTier(attacker, 'lifesteal');
  const ls = attacker.lifesteal + (lsT ? 3 + lsT * 2 : 0);
  if (ls > 0 && total > 0) heal(ctx, attacker, (total * ls) / 100, undefined, true);
  const sdT = shadowTier(attacker, 'soulDrain');
  if (sdT && crit) heal(ctx, attacker, (attacker.maxHp * (2 + sdT)) / 100, 'Пожирание душ: +{n} HP', false);

  if (checkDeath(ctx)) return { dmg: total, crit, missed: false };

  // On-hit effects
  if (!o.noOnHit) {
    if (attacker.bleedChance > 0 && chance(attacker.bleedChance)) {
      addStatus(defender, 'bleed', 3, Math.max(1, Math.round(effAtk(attacker) * 0.2)));
      log(ctx, `${attacker.isPlayer ? defender.name : 'Вы'}: кровотечение!`, 'status');
      step(ctx, dSide, { float: { text: 'КРОВОТЕЧЕНИЕ', kind: 'status' } });
    }
    const pT = shadowTier(attacker, 'poisonTouch');
    if (pT && chance(10 + pT * 5)) {
      addStatus(defender, 'poison', 3, Math.max(1, Math.round(effAtk(attacker) * 0.22)));
      log(ctx, `Тень отравляет врага!`, 'status');
      step(ctx, dSide, { float: { text: 'ЯД', kind: 'status' } });
    }
    const bT = shadowTier(attacker, 'burnTouch');
    if (bT && chance(10 + bT * 5)) {
      addStatus(defender, 'burn', 2, Math.max(1, Math.round(effAtk(attacker) * 0.28)));
      log(ctx, `Тень поджигает врага!`, 'status');
      step(ctx, dSide, { float: { text: 'ГОРЕНИЕ', kind: 'status' } });
    }
  }
  return { dmg: total, crit, missed: false };
}

function applyDebuff(ctx: Ctx, target: Combatant, id: StatusId, turns: number, value: number, text: string, floatText: string) {
  const ok = addStatus(target, id, turns, value);
  if (!ok) {
    log(ctx, `${target.isPlayer ? 'Вы устойчивы' : target.name + ' устойчив'} к оглушению.`, 'system');
    return false;
  }
  log(ctx, text, 'status');
  step(ctx, sideOf(target), { float: { text: floatText, kind: 'status' }, sound: 'magic' });
  return true;
}

// ================== Round flow ==================

const STATUS_NAMES: Record<string, string> = { bleed: 'Кровотечение', poison: 'Яд', burn: 'Горение' };

function tick(ctx: Ctx, c: Combatant) {
  if (ctx.cs.over) return;
  const foe = other(ctx, c);
  for (const id of ['bleed', 'poison', 'burn'] as const) {
    const s = getStatus(c, id);
    if (!s) continue;
    const { dmg } = applyRawDamage(c, s.value);
    log(ctx, `${STATUS_NAMES[id]}: ${c.isPlayer ? 'вы теряете' : c.name + ' теряет'} ${dmg} HP.`, 'status');
    step(ctx, sideOf(c), { float: { text: `-${dmg}`, kind: 'dot' }, anim: 'hit' });
    if (id === 'poison' && foe.boss === 'swampMother' && dmg > 0) heal(ctx, foe, dmg * 0.5, 'Болотная Матерь питается ядом: +{n} HP');
    if (checkDeath(ctx)) return;
  }
  const regen = getStatus(c, 'regen');
  if (regen) heal(ctx, c, regen.value);
  const rT = shadowTier(c, 'regen');
  if (rT) heal(ctx, c, (c.maxHp * (1 + rT)) / 100);
  if (c.boss === 'ghoulRegen' && c.hp < c.maxHp * 0.5) heal(ctx, c, c.maxHp * 0.04, 'Упырь регенерирует: +{n} HP');

  // durations
  c.statuses = c.statuses
    .map((s): Status => (s.id === 'stun' || s.id === 'enraged' ? s : { ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0);
  for (const k of Object.keys(c.cooldowns)) c.cooldowns[k] = Math.max(0, c.cooldowns[k] - 1);
  if (c.flags.stunImmune) c.flags.stunImmune -= 1;
  if (c.isPlayer) c.energy = Math.min(c.maxEnergy, c.energy + 10);
}

/** Returns true if the combatant was stunned and loses the action. */
function consumeStun(ctx: Ctx, c: Combatant) {
  if (!getStatus(c, 'stun')) return false;
  removeStatus(c, 'stun');
  c.flags.stunImmune = 2;
  log(ctx, c.isPlayer ? 'Вы оглушены и пропускаете ход!' : `${c.name} оглушён и пропускает ход!`, 'status');
  step(ctx, sideOf(c), { float: { text: 'ОГЛУШЁН', kind: 'status' } });
  return true;
}

export function startCombat(player: Combatant, enemy: Combatant, potions: number): { state: CombatState; steps: CombatStep[] } {
  const cs: CombatState = { player, enemy, turn: 1, log: [], over: false, potions, potionsUsed: 0, crits: 0, logSeq: 0 };
  const ctx: Ctx = { cs, steps: [] };
  log(ctx, `Бой начинается: ${player.name} против «${enemy.name}» (ур. ${enemy.level}).`, 'system');
  const bT = shadowTier(player, 'bulwark');
  if (bT) {
    addStatus(player, 'shield', 99, Math.round((player.maxHp * (5 + bT * 4)) / 100));
    log(ctx, `Тень возводит бастион: щит ${statusValue(player, 'shield')}.`, 'status');
  }
  if (enemy.speed > player.speed + 2 && chance(50)) {
    log(ctx, `${enemy.name} быстрее вас и атакует первым!`, 'enemy');
    hit(ctx, enemy, player, { mult: 0.8 });
    checkDeath(ctx);
  }
  step(ctx, 'player', {});
  return { state: ctx.cs, steps: ctx.steps };
}

export function canUseAction(cs: CombatState, action: PlayerAction): { ok: boolean; reason?: string } {
  const p = cs.player;
  if (cs.over) return { ok: false };
  if (getStatus(p, 'stun')) return action.type === 'skip' ? { ok: true } : { ok: false, reason: 'Вы оглушены' };
  switch (action.type) {
    case 'heavy':
      return p.energy >= HEAVY_COST ? { ok: true } : { ok: false, reason: `Нужно ${HEAVY_COST} энергии` };
    case 'potion':
      if (cs.potions <= 0) return { ok: false, reason: 'Нет зелий' };
      if (p.hp >= p.maxHp) return { ok: false, reason: 'HP полное' };
      return { ok: true };
    case 'ability': {
      const ab = CLASSES[p.classId!].abilities.find((a) => a.id === action.abilityId);
      if (!ab) return { ok: false };
      if (p.energy < ab.cost) return { ok: false, reason: `Нужно ${ab.cost} энергии` };
      if ((p.cooldowns[ab.id] ?? 0) > 0) return { ok: false, reason: `Перезарядка: ${p.cooldowns[ab.id]}` };
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

function playerAct(ctx: Ctx, action: PlayerAction) {
  const p = ctx.cs.player;
  const e = ctx.cs.enemy;
  if (consumeStun(ctx, p)) return;

  switch (action.type) {
    case 'skip':
      break;
    case 'attack':
      p.energy = Math.min(p.maxEnergy, p.energy + 20);
      hit(ctx, p, e, { mult: 1 });
      break;
    case 'defend': {
      p.energy = Math.min(p.maxEnergy, p.energy + 30);
      addStatus(p, 'guarding', 1, 50);
      log(ctx, 'Вы встаёте в защитную стойку (−50% урона, +15% блока).', 'player');
      step(ctx, 'player', { float: { text: 'ЗАЩИТА', kind: 'status' }, anim: 'block', sound: 'block' });
      heal(ctx, p, p.maxHp * 0.05, 'Передышка: +{n} HP');
      if (p.classId === 'guardian') addStatus(p, 'shield', 2, Math.round(p.maxHp * 0.08));
      break;
    }
    case 'heavy': {
      p.energy -= HEAVY_COST;
      log(ctx, 'Вы замахиваетесь для сильного удара!', 'player');
      const r = hit(ctx, p, e, { mult: 1.8, label: 'сильный удар' });
      if (!r.missed && !ctx.cs.over && chance(25)) applyDebuff(ctx, e, 'stun', 1, 0, `${e.name} оглушён!`, 'ОГЛУШЕНИЕ');
      break;
    }
    case 'potion': {
      ctx.cs.potions -= 1;
      ctx.cs.potionsUsed += 1;
      log(ctx, 'Вы выпиваете зелье здоровья.', 'heal');
      heal(ctx, p, p.maxHp * POTION_HEAL, 'Зелье восстанавливает {n} HP.');
      for (const id of ['bleed', 'poison', 'burn'] as const) removeStatus(p, id);
      break;
    }
    case 'ability':
      useClassAbility(ctx, action.abilityId);
      break;
  }
}

function useClassAbility(ctx: Ctx, id: string) {
  const p = ctx.cs.player;
  const e = ctx.cs.enemy;
  const ab = CLASSES[p.classId!].abilities.find((a) => a.id === id)!;
  p.energy -= ab.cost;
  p.cooldowns[ab.id] = ab.cooldown + 1;
  log(ctx, `Вы используете «${ab.name}»!`, 'player');
  step(ctx, 'player', { anim: 'heal', sound: 'magic', float: { text: ab.name.toUpperCase(), kind: 'status' } });
  const atk = effAtk(p);

  switch (id) {
    // ---- Berserker
    case 'bloodRage': {
      const r = hit(ctx, p, e, { mult: 2.2, magic: true, label: ab.name });
      if (!r.missed && !ctx.cs.over) {
        addStatus(e, 'bleed', 3, Math.round(atk * 0.35));
        log(ctx, `${e.name} истекает кровью!`, 'status');
      }
      addStatus(p, 'atkUp', 3, 30);
      log(ctx, 'Ярость: +30% атаки на 3 хода.', 'status');
      break;
    }
    case 'whirlwind':
      for (let i = 0; i < 3 && !ctx.cs.over; i++) hit(ctx, p, e, { mult: 0.9, magic: true, label: `вихрь ${i + 1}` });
      break;
    case 'lastStand': {
      const missing = 1 - p.hp / p.maxHp;
      const r = hit(ctx, p, e, { mult: 1.5 + 3.5 * missing, magic: true, label: ab.name });
      if (r.dmg > 0) heal(ctx, p, r.dmg * 0.3, 'Кровь врага лечит вас: +{n} HP');
      break;
    }
    // ---- Guardian
    case 'shieldBash': {
      const r = hit(ctx, p, e, { mult: 1.5, flat: effDef(p), magic: true, label: ab.name });
      if (!r.missed && !ctx.cs.over) applyDebuff(ctx, e, 'stun', 1, 0, `${e.name} оглушён ударом щита!`, 'ОГЛУШЕНИЕ');
      break;
    }
    case 'aegis':
      addStatus(p, 'shield', 3, Math.round(p.maxHp * 0.35 * (1 + p.magicPct / 200)));
      addStatus(p, 'defUp', 3, 40);
      log(ctx, `Эгида: щит ${statusValue(p, 'shield')} и +40% защиты.`, 'status');
      step(ctx, 'player', { float: { text: `ЩИТ ${statusValue(p, 'shield')}`, kind: 'heal' }, anim: 'block' });
      break;
    case 'retribution': {
      hit(ctx, p, e, { mult: 1.2, flat: effDef(p) * 1.2, magic: true, label: ab.name });
      if (!ctx.cs.over) heal(ctx, p, p.maxHp * 0.15, 'Возмездие восстанавливает {n} HP.');
      break;
    }
    // ---- Assassin
    case 'shadowStab': {
      const r = hit(ctx, p, e, { mult: 1.8, guaranteedCrit: true, canDodge: false, magic: true, label: ab.name });
      if (!ctx.cs.over && r.dmg > 0) {
        addStatus(e, 'bleed', 3, Math.round(atk * 0.3));
        log(ctx, `${e.name} истекает кровью!`, 'status');
      }
      break;
    }
    case 'venom':
      for (let i = 0; i < 2 && !ctx.cs.over; i++) hit(ctx, p, e, { mult: 0.8, magic: true, label: 'ядовитый клинок' });
      if (!ctx.cs.over) {
        addStatus(e, 'poison', 4, Math.round(atk * 0.45 * (1 + p.magicPct / 100)));
        log(ctx, `${e.name} отравлен!`, 'status');
        step(ctx, 'enemy', { float: { text: 'ЯД', kind: 'status' } });
      }
      break;
    case 'vanish':
      addStatus(p, 'evasive', 2, 60);
      log(ctx, 'Вы растворяетесь в тенях: +60% уклонения.', 'status');
      hit(ctx, p, e, { mult: 1.5, guaranteedCrit: true, canDodge: false, magic: true, label: ab.name });
      break;
    // ---- Shadow mage
    case 'abyssFlame': {
      const r = hit(ctx, p, e, { mult: 2.0, magic: true, defPen: 1, label: ab.name });
      if (!ctx.cs.over && !r.missed) {
        addStatus(e, 'burn', 3, Math.round(atk * 0.3 * (1 + p.magicPct / 100)));
        log(ctx, `${e.name} горит в пламени бездны!`, 'status');
        step(ctx, 'enemy', { float: { text: 'ГОРЕНИЕ', kind: 'status' } });
      }
      break;
    }
    case 'hex':
      addStatus(e, 'weaken', 3, 30);
      addStatus(e, 'vulnerable', 3, 40);
      log(ctx, `${e.name} проклят: −30% атаки, −40% защиты.`, 'status');
      step(ctx, 'enemy', { float: { text: 'ПРОКЛЯТИЕ', kind: 'status' }, anim: 'hit', sound: 'magic' });
      break;
    case 'voidPrison': {
      const r = hit(ctx, p, e, { mult: 2.6, magic: true, defPen: 1, canDodge: false, label: ab.name });
      if (!ctx.cs.over) {
        applyDebuff(ctx, e, 'stun', 1, 0, `${e.name} заключён в темницу пустоты!`, 'ОГЛУШЕНИЕ');
        if (r.dmg > 0) heal(ctx, p, r.dmg * 0.2, 'Пустота питает вас: +{n} HP');
      }
      break;
    }
  }
}

// ---- Enemy side ----

const ABILITY_NAMES: Record<EnemyAbilityId, string> = {
  bleedStrike: 'Рваная рана',
  poisonBite: 'Ядовитый укус',
  fireBolt: 'Огненный шар',
  stunBash: 'Оглушающий удар',
  drainLife: 'Похищение жизни',
  heavyBlow: 'Сокрушительный удар',
  shadowStrike: 'Удар тени',
  weakenCurse: 'Проклятие слабости',
  heal: 'Тёмное исцеление',
  guard: 'Глухая оборона',
  frenzy: 'Бешенство',
  armorBreak: 'Сокрушение брони',
};

const ABILITY_CD: Partial<Record<EnemyAbilityId, number>> = { stunBash: 4, heal: 4, guard: 3, weakenCurse: 4 };

function bossPreAction(ctx: Ctx, e: Combatant, p: Combatant) {
  const t = ctx.cs.turn;
  switch (e.boss) {
    case 'soulEater':
      if (t % 3 === 0 && (p.flags.atkStolen ?? 0) < 50) {
        p.flags.atkStolen = (p.flags.atkStolen ?? 0) + 10;
        e.flags.bonusAtk = (e.flags.bonusAtk ?? 0) + 10;
        log(ctx, `Морок пожирает частицу вашей души: −10% атаки (всего −${p.flags.atkStolen}%).`, 'boss');
        step(ctx, 'player', { float: { text: '−10% АТАКИ', kind: 'status' }, sound: 'magic' });
      }
      if (e.hp < e.maxHp * 0.3 && !getStatus(e, 'enraged')) {
        addStatus(e, 'enraged', 99, 50);
        log(ctx, 'Морок впадает в ЯРОСТЬ! +50% урона!', 'boss');
        step(ctx, 'enemy', { float: { text: 'ЯРОСТЬ!', kind: 'crit' }, anim: 'crit', sound: 'crit' });
      }
      break;
    case 'swampMother':
      addStatus(p, 'poison', 3, Math.max(1, Math.round(e.atk * 0.1)), true);
      log(ctx, `Ядовитые испарения болота: яд усиливается (${statusValue(p, 'poison')}/ход).`, 'boss');
      step(ctx, 'player', { float: { text: 'ЯД+', kind: 'status' } });
      break;
    case 'ironCastellan':
      if (t % 4 === 0) {
        addStatus(e, 'shield', 3, Math.round(e.maxHp * 0.2));
        log(ctx, 'Кастелян поднимает теневой щит! Удары по нему отражаются.', 'boss');
        step(ctx, 'enemy', { float: { text: 'ТЕНЕВОЙ ЩИТ', kind: 'heal' }, anim: 'block', sound: 'block' });
      }
      break;
    case 'shadowKing':
      if (!e.flags.reborn && e.hp < e.maxHp * 0.5) {
        e.flags.reborn = 1;
        e.flags.bonusAtk = (e.flags.bonusAtk ?? 0) + 30;
        log(ctx, 'Король Теней ПЕРЕРОЖДАЕТСЯ из тьмы! +30% атаки!', 'boss');
        heal(ctx, e, e.maxHp * 0.25, 'Король восстанавливает {n} HP!');
      }
      break;
    case 'towerWarden':
      e.flags.stacks = (e.flags.stacks ?? 0) + 1;
      break;
  }
}

/** Special boss attacks that replace the normal action. Returns true if used. */
function bossSpecial(ctx: Ctx, e: Combatant, p: Combatant) {
  const t = ctx.cs.turn;
  if (e.boss === 'executioner' && t % 3 === 0) {
    log(ctx, 'Гракс заносит топор: КРОВАВАЯ РУБКА!', 'boss');
    const r = hit(ctx, e, p, { mult: 1.7, label: 'Кровавая рубка' });
    if (!r.missed && !ctx.cs.over) addStatus(p, 'bleed', 3, Math.round(effAtk(e) * 0.3));
    return true;
  }
  if (e.boss === 'shadowKing' && t % 5 === 0) {
    log(ctx, 'Король Теней призывает ТЕНЕВОЕ ЗАТМЕНИЕ!', 'boss');
    const r = hit(ctx, e, p, { mult: 1.1, magic: true, canDodge: false, label: 'Затмение' });
    if (r.dmg > 0 && !ctx.cs.over) applyDebuff(ctx, p, 'stun', 1, 0, 'Вы ослеплены тьмой и оглушены!', 'ОГЛУШЕНИЕ');
    return true;
  }
  return false;
}

function enemyUseAbility(ctx: Ctx, e: Combatant, p: Combatant, id: EnemyAbilityId) {
  const name = ABILITY_NAMES[id];
  e.cooldowns[id] = (ABILITY_CD[id] ?? 3) + 1;
  log(ctx, `${e.name} использует «${name}».`, 'enemy');
  const atk = effAtk(e);
  switch (id) {
    case 'bleedStrike': {
      const r = hit(ctx, e, p, { mult: 1.1, label: name });
      if (!r.missed && !ctx.cs.over) applyDebuff(ctx, p, 'bleed', 3, Math.round(atk * 0.25), 'Вы истекаете кровью!', 'КРОВОТЕЧЕНИЕ');
      break;
    }
    case 'poisonBite': {
      const r = hit(ctx, e, p, { mult: 0.9, label: name });
      if (!r.missed && !ctx.cs.over) applyDebuff(ctx, p, 'poison', 3, Math.round(atk * 0.3), 'Вы отравлены!', 'ЯД');
      break;
    }
    case 'fireBolt': {
      const r = hit(ctx, e, p, { mult: 1.3, magic: true, defPen: 0.5, label: name });
      if (!r.missed && !ctx.cs.over) applyDebuff(ctx, p, 'burn', 2, Math.round(atk * 0.25), 'Вы горите!', 'ГОРЕНИЕ');
      break;
    }
    case 'stunBash': {
      const r = hit(ctx, e, p, { mult: 0.9, label: name });
      if (!r.missed && !ctx.cs.over && chance(45)) applyDebuff(ctx, p, 'stun', 1, 0, 'Вы оглушены!', 'ОГЛУШЕНИЕ');
      break;
    }
    case 'drainLife': {
      const r = hit(ctx, e, p, { mult: 1.0, label: name });
      if (r.dmg > 0) heal(ctx, e, r.dmg * 0.5, `${e.name} восстанавливает {n} HP.`);
      break;
    }
    case 'heavyBlow':
      hit(ctx, e, p, { mult: 1.7, label: name });
      break;
    case 'shadowStrike':
      hit(ctx, e, p, { mult: 1.4, canDodge: false, label: name });
      break;
    case 'weakenCurse':
      applyDebuff(ctx, p, 'weaken', 3, 25, 'Вы ослаблены: −25% атаки на 3 хода.', 'СЛАБОСТЬ');
      break;
    case 'heal':
      heal(ctx, e, e.maxHp * 0.18, `${e.name} исцеляется на {n} HP.`);
      break;
    case 'guard':
      addStatus(e, 'guarding', 2, 40);
      addStatus(e, 'defUp', 2, 50);
      log(ctx, `${e.name} уходит в глухую оборону.`, 'enemy');
      step(ctx, 'enemy', { float: { text: 'ЗАЩИТА', kind: 'status' }, anim: 'block', sound: 'block' });
      break;
    case 'frenzy':
      addStatus(e, 'atkUp', 3, 30);
      log(ctx, `${e.name} впадает в бешенство: +30% атаки.`, 'enemy');
      step(ctx, 'enemy', { float: { text: 'БЕШЕНСТВО', kind: 'status' }, sound: 'magic' });
      hit(ctx, e, p, { mult: 0.8, label: name });
      break;
    case 'armorBreak': {
      const r = hit(ctx, e, p, { mult: 1.0, label: name });
      if (!r.missed && !ctx.cs.over) applyDebuff(ctx, p, 'vulnerable', 3, 30, 'Ваша броня пробита: −30% защиты.', 'БРОНЯ −30%');
      break;
    }
  }
}

function enemyAct(ctx: Ctx) {
  const e = ctx.cs.enemy;
  const p = ctx.cs.player;
  if (ctx.cs.over) return;
  bossPreAction(ctx, e, p);
  if (checkDeath(ctx)) return;
  if (consumeStun(ctx, e)) return;
  if (bossSpecial(ctx, e, p)) return;

  const ready = e.abilities.filter((a) => {
    if ((e.cooldowns[a] ?? 0) > 0) return false;
    if (a === 'heal') return e.hp < e.maxHp * 0.6;
    if (a === 'guard') return e.hp < e.maxHp * 0.8;
    return true;
  });
  if (ready.length && chance(e.boss ? 50 : 38)) {
    enemyUseAbility(ctx, e, p, pick(ready));
  } else {
    hit(ctx, e, p, { mult: 1 });
  }
}

function speedBonus(ctx: Ctx, attacker: Combatant, defender: Combatant) {
  const diff = attacker.speed - defender.speed;
  if (diff <= 0 || ctx.cs.over) return;
  if (chance(Math.min(25, diff * 2))) {
    log(ctx, attacker.isPlayer ? 'Скорость! Вы наносите дополнительный удар.' : `${attacker.name} молниеносно атакует снова!`, attacker.isPlayer ? 'player' : 'enemy');
    hit(ctx, attacker, defender, { mult: 0.6, label: 'быстрый удар', noOnHit: true });
  }
}

/** Resolves a full round: player action → enemy action → status ticks. */
export function playRound(state: CombatState, action: PlayerAction): { state: CombatState; steps: CombatStep[] } {
  const ctx: Ctx = { cs: structuredClone(state), steps: [] };
  const wasStunned = !!getStatus(ctx.cs.player, 'stun');
  playerAct(ctx, action);
  checkDeath(ctx);
  if (!wasStunned && (action.type === 'attack' || action.type === 'heavy')) speedBonus(ctx, ctx.cs.player, ctx.cs.enemy);
  checkDeath(ctx);

  if (!ctx.cs.over) {
    enemyAct(ctx);
    checkDeath(ctx);
    speedBonus(ctx, ctx.cs.enemy, ctx.cs.player);
    checkDeath(ctx);
  }
  if (!ctx.cs.over) {
    tick(ctx, ctx.cs.player);
    tick(ctx, ctx.cs.enemy);
    checkDeath(ctx);
  }
  if (!ctx.cs.over) {
    ctx.cs.turn += 1;
    if (ctx.cs.turn === DARKNESS_TURN + 1) log(ctx, 'Тьма сгущается: с каждым ходом урон обеих сторон растёт!', 'boss');
  }
  if (ctx.cs.over) {
    log(ctx, ctx.cs.winner === 'player' ? `${ctx.cs.enemy.name} повержен!` : 'Вы пали в бою...', ctx.cs.winner === 'player' ? 'player' : 'enemy');
  }
  step(ctx, 'player', {});
  return { state: ctx.cs, steps: ctx.steps };
}

export const STATUS_INFO: Record<StatusId, { name: string; icon: string; bad: boolean }> = {
  bleed: { name: 'Кровотечение', icon: '🩸', bad: true },
  poison: { name: 'Яд', icon: '☠️', bad: true },
  burn: { name: 'Горение', icon: '🔥', bad: true },
  stun: { name: 'Оглушение', icon: '💫', bad: true },
  weaken: { name: 'Слабость', icon: '🥀', bad: true },
  vulnerable: { name: 'Уязвимость', icon: '💔', bad: true },
  atkUp: { name: 'Сила', icon: '⚔️', bad: false },
  defUp: { name: 'Стойкость', icon: '🛡️', bad: false },
  shield: { name: 'Щит', icon: '🔰', bad: false },
  regen: { name: 'Регенерация', icon: '💚', bad: false },
  enraged: { name: 'Ярость', icon: '😡', bad: false },
  guarding: { name: 'Защита', icon: '🧱', bad: false },
  evasive: { name: 'Тень', icon: '🌫️', bad: false },
};
