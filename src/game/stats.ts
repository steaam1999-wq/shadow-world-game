import { CLASSES } from '../data/classes';
import { SHADOWS, SHADOW_TIER_MULT } from '../data/shadows';
import type { Attribute, ClassId, DerivedStats, Item, ShadowInstance, StatBlock, StatKey } from '../types';
import { itemStats } from './items';

export const MAX_LEVEL = 60;
export const POINTS_PER_LEVEL = 3;

export const xpToNext = (level: number) => Math.floor(50 * Math.pow(level, 1.45) + 50);

export const baseStatsForLevel = (level: number) => ({
  hp: 100 + (level - 1) * 14,
  atk: 15 + (level - 1) * 2.6,
  def: 5 + (level - 1) * 1.1,
});

export function addBlock(target: StatBlock, src: StatBlock, mult = 1) {
  for (const k in src) {
    const key = k as StatKey;
    target[key] = (target[key] ?? 0) + (src[key] ?? 0) * mult;
  }
  return target;
}

export function shadowBonuses(instance: ShadowInstance): StatBlock {
  const def = SHADOWS[instance.defId];
  if (!def) return {};
  return addBlock({}, def.bonuses, SHADOW_TIER_MULT[instance.tier]);
}

export interface StatInput {
  classId: ClassId;
  level: number;
  attributes: Record<Attribute, number>;
  gear: Item[];
  shadows: ShadowInstance[];
}

/** Single source of truth for hero-like combatants (player and arena bots). */
export function computeStats(input: StatInput): DerivedStats {
  const cls = CLASSES[input.classId];
  const base = baseStatsForLevel(input.level);
  const flat: StatBlock = {};
  for (const it of input.gear) addBlock(flat, itemStats(it));
  for (const sh of input.shadows) addBlock(flat, shadowBonuses(sh));
  const f = (k: StatKey) => flat[k] ?? 0;

  const attributes = {
    str: input.attributes.str + f('str'),
    agi: input.attributes.agi + f('agi'),
    vit: input.attributes.vit + f('vit'),
    dark: input.attributes.dark + f('dark'),
  };
  const { str, agi, vit, dark } = attributes;

  const maxHp = Math.round((base.hp + vit * 14 + str * 2 + f('hp')) * cls.mods.hpMul * (1 + f('hpPct') / 100));
  const atk = Math.round((base.atk + str * 2 + dark + f('atk')) * cls.mods.atkMul * (1 + f('atkPct') / 100));
  const def = Math.round((base.def + vit * 0.6 + f('def')) * cls.mods.defMul * (1 + f('defPct') / 100));
  const critChance = Math.min(75, 5 + cls.mods.critChance + agi * 0.4 + f('critChance'));
  const critDmg = 150 + cls.mods.critDmg + dark + f('critDmg');
  const speed = 10 + cls.mods.speed + agi * 0.35 + f('speed');
  const dodge = Math.min(45, cls.mods.dodge + agi * 0.25 + f('dodge'));
  const block = Math.min(50, cls.mods.block + vit * 0.2 + f('block'));
  const bleedChance = Math.min(60, cls.mods.bleedChance + f('bleedChance'));
  const lifesteal = Math.min(30, f('lifesteal'));
  const magicPct = cls.mods.magicPct + dark * 2 + f('magicPct');

  const power = Math.round(
    atk * 2.2 * (1 + (critChance / 100) * (critDmg / 100 - 1)) + maxHp * 0.35 + def * 3 + speed * 4 + (dodge + block) * 6 + magicPct * 2,
  );

  return { maxHp, atk, def, critChance, critDmg, speed, dodge, block, bleedChance, lifesteal, magicPct, attributes, power };
}
