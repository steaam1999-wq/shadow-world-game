import type { Attribute, ClassId, GameState, Hero, Item, ShadowInstance } from '../types';
import { computeStats, MAX_LEVEL, POINTS_PER_LEVEL, xpToNext } from './stats';
import { SLOTS } from '../data/items';

export function createHero(name: string, classId: ClassId): Hero {
  return {
    name: name.trim() || 'Безымянный',
    classId,
    level: 1,
    xp: 0,
    hp: 100000, // clamped to max on first stat computation
    attributes: { str: 0, agi: 0, vit: 0, dark: 0 },
    freePoints: 0,
  };
}

export const equippedGear = (state: GameState): Item[] =>
  SLOTS.map((s) => state.equipment[s]).filter((x): x is Item => !!x);

export const equippedShadowInstances = (state: GameState): ShadowInstance[] =>
  state.equippedShadows
    .map((uid) => state.shadows.find((s) => s.uid === uid))
    .filter((x): x is ShadowInstance => !!x);

export function heroStats(state: GameState) {
  const h = state.hero!;
  return computeStats({
    classId: h.classId,
    level: h.level,
    attributes: h.attributes,
    gear: equippedGear(state),
    shadows: equippedShadowInstances(state),
  });
}

/** Keeps current HP inside [0, maxHp] after gear/level changes. */
export function clampHp(state: GameState) {
  if (!state.hero) return;
  const max = heroStats(state).maxHp;
  state.hero.hp = Math.max(0, Math.min(max, state.hero.hp));
}

/** Adds XP; returns number of levels gained. Heals fully on level up. */
export function addXp(state: GameState, amount: number): number {
  const h = state.hero!;
  let gained = 0;
  h.xp += Math.round(amount);
  while (h.level < MAX_LEVEL && h.xp >= xpToNext(h.level)) {
    h.xp -= xpToNext(h.level);
    h.level += 1;
    h.freePoints += POINTS_PER_LEVEL;
    gained += 1;
  }
  if (h.level >= MAX_LEVEL) h.xp = 0;
  if (gained > 0) h.hp = heroStats(state).maxHp;
  return gained;
}

export function allocatePoint(state: GameState, attr: Attribute, amount = 1) {
  const h = state.hero!;
  const n = Math.min(amount, h.freePoints);
  if (n <= 0) return false;
  const before = heroStats(state).maxHp;
  h.attributes[attr] += n;
  h.freePoints -= n;
  const after = heroStats(state).maxHp;
  h.hp += Math.max(0, after - before);
  return true;
}

export const RESPEC_COST = 50; // crystals

export function respec(state: GameState) {
  const h = state.hero!;
  const total = h.attributes.str + h.attributes.agi + h.attributes.vit + h.attributes.dark;
  h.attributes = { str: 0, agi: 0, vit: 0, dark: 0 };
  h.freePoints += total;
  clampHp(state);
}

export const HP_REGEN_PER_SEC = 0.006; // 0.6% of max HP per second out of combat
