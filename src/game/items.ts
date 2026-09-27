import { AFFIX_POOL, ITEM_BASES, ITEM_SUFFIXES, MAX_UPGRADE, RARITIES, RARITY_INFO, SLOTS, SLOT_MAIN } from '../data/items';
import type { Item, Rarity, Slot, StatBlock, StatKey } from '../types';
import { pick, rand, shuffle, uid, weighted } from '../utils/random';

export type LootSource = 'normal' | 'boss' | 'tower' | 'towerBoss' | 'arena' | 'chest' | 'premiumChest';

const RARITY_WEIGHTS: Record<LootSource, number[]> = {
  //            common unc  rare epic leg  myth
  normal: [55, 28, 12, 4, 0.9, 0.1],
  boss: [0, 20, 45, 25, 8.5, 1.5],
  tower: [30, 35, 22, 10, 2.6, 0.4],
  towerBoss: [0, 10, 40, 35, 12, 3],
  arena: [10, 35, 35, 15, 4.5, 0.5],
  chest: [0, 40, 40, 15, 4.5, 0.5],
  premiumChest: [0, 0, 30, 45, 20, 5],
};

export function rollRarity(source: LootSource): Rarity {
  const w = RARITY_WEIGHTS[source];
  return weighted(RARITIES.map((r, i) => [r, w[i]] as [Rarity, number]));
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const isFractional = (k: StatKey) => ['critChance', 'dodge', 'block', 'bleedChance', 'lifesteal', 'speed'].includes(k);

export function generateItem(level: number, rarity: Rarity, slot?: Slot): Item {
  const s = slot ?? pick(SLOTS);
  const base = pick(ITEM_BASES[s]);
  const info = RARITY_INFO[rarity];
  const lvl = Math.max(1, Math.round(level));

  const main: StatBlock = {};
  for (const [k, [b, per]] of Object.entries(SLOT_MAIN[s]) as [StatKey, [number, number]][]) {
    const v = (b + per * (lvl - 1)) * info.mult * rand(0.9, 1.1);
    main[k] = isFractional(k) ? round1(v) : Math.max(1, Math.round(v));
  }

  const affixes: StatBlock = {};
  const pool = shuffle(AFFIX_POOL.filter((a) => !(a.stat in main)));
  for (const a of pool.slice(0, info.affixes)) {
    const v = (rand(a.base[0], a.base[1]) + a.perLevel * (lvl - 1)) * (0.85 + info.mult * 0.15);
    affixes[a.stat] = isFractional(a.stat) || a.stat.endsWith('Pct') ? round1(v) : Math.max(1, Math.round(v));
  }

  return {
    id: uid(),
    name: `${base.name} ${pick(ITEM_SUFFIXES[rarity])}`,
    slot: s,
    rarity,
    level: lvl,
    upgrade: 0,
    icon: base.icon,
    main,
    affixes,
    isNew: true,
  };
}

export const upgradeMult = (upgrade: number) => 1 + upgrade * 0.1;

/** Effective stats of an item (main scaled by upgrade, affixes flat). */
export function itemStats(item: Item): StatBlock {
  const out: StatBlock = {};
  const m = upgradeMult(item.upgrade);
  for (const k in item.main) {
    const key = k as StatKey;
    const v = (item.main[key] ?? 0) * m;
    out[key] = isFractional(key) ? round1(v) : Math.round(v);
  }
  for (const k in item.affixes) {
    const key = k as StatKey;
    out[key] = (out[key] ?? 0) + (item.affixes[key] ?? 0);
  }
  return out;
}

const STAT_WEIGHT: Partial<Record<StatKey, number>> = {
  atk: 2.2, hp: 0.35, def: 3, critChance: 5, critDmg: 1.2, speed: 4, dodge: 6, block: 6, bleedChance: 3,
  lifesteal: 6, str: 4.5, agi: 4, vit: 5, dark: 4, atkPct: 5, hpPct: 4, defPct: 3, magicPct: 2.5,
};

export function itemPower(item: Item): number {
  const s = itemStats(item);
  let p = 0;
  for (const k in s) p += (s[k as StatKey] ?? 0) * (STAT_WEIGHT[k as StatKey] ?? 1);
  return Math.round(p);
}

export const sellPrice = (item: Item) =>
  Math.round((8 + item.level * 3) * RARITY_INFO[item.rarity].sell * (1 + item.upgrade * 0.25));

export const upgradeCost = (item: Item) =>
  Math.round((30 + item.level * 6) * Math.pow(item.upgrade + 1, 1.5) * (0.7 + RARITY_INFO[item.rarity].mult * 0.3));

export const upgradeChance = (item: Item) => {
  if (item.upgrade < 5) return 100;
  return Math.max(30, 100 - (item.upgrade - 4) * 8);
};

export const canUpgrade = (item: Item) => item.upgrade < MAX_UPGRADE;

export const rarityIndex = (r: Rarity) => RARITIES.indexOf(r);
