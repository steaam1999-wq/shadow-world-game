import { INVENTORY_LIMIT } from '../data/items';
import type { GameState, Item, Rarity } from '../types';
import { chance } from '../utils/random';
import { clampHp } from './hero';
import { canUpgrade, rarityIndex, sellPrice, upgradeChance, upgradeCost } from './items';

/** Adds items to the bag. Overflow is auto-sold; returns gold from overflow. */
export function addItems(state: GameState, items: Item[]): number {
  let gold = 0;
  for (const it of items) {
    if (it.rarity === 'legendary') state.counters.legendaryFound += 1;
    if (it.rarity === 'mythic') {
      state.counters.mythicFound += 1;
      state.counters.legendaryFound += 1;
    }
    if (state.inventory.length >= INVENTORY_LIMIT) {
      gold += sellPrice(it);
    } else {
      state.inventory.push(it);
    }
  }
  state.currencies.gold += gold;
  return gold;
}

export function equipItem(state: GameState, itemId: string) {
  const idx = state.inventory.findIndex((i) => i.id === itemId);
  if (idx < 0) return;
  const item = { ...state.inventory[idx], isNew: false };
  const prev = state.equipment[item.slot];
  state.inventory.splice(idx, 1);
  if (prev) state.inventory.splice(idx, 0, prev);
  state.equipment[item.slot] = item;
  clampHp(state);
}

export function unequipItem(state: GameState, slot: Item['slot']) {
  const item = state.equipment[slot];
  if (!item) return false;
  if (state.inventory.length >= INVENTORY_LIMIT) return false;
  delete state.equipment[slot];
  state.inventory.unshift(item);
  clampHp(state);
  return true;
}

export function sellItem(state: GameState, itemId: string): number {
  const idx = state.inventory.findIndex((i) => i.id === itemId);
  if (idx < 0) return 0;
  const it = state.inventory[idx];
  if (it.locked) return 0;
  const price = sellPrice(it);
  state.inventory.splice(idx, 1);
  state.currencies.gold += price;
  return price;
}

export function sellAllUpTo(state: GameState, maxRarity: Rarity): { count: number; gold: number } {
  const maxIdx = rarityIndex(maxRarity);
  let gold = 0;
  let count = 0;
  state.inventory = state.inventory.filter((it) => {
    if (!it.locked && rarityIndex(it.rarity) <= maxIdx) {
      gold += sellPrice(it);
      count += 1;
      return false;
    }
    return true;
  });
  state.currencies.gold += gold;
  return { count, gold };
}

export type UpgradeOutcome = 'success' | 'fail' | 'noGold' | 'max';

/** Upgrades an item either in inventory or equipped. */
export function upgradeItem(state: GameState, itemId: string): UpgradeOutcome {
  const item =
    state.inventory.find((i) => i.id === itemId) ?? Object.values(state.equipment).find((i) => i?.id === itemId);
  if (!item) return 'fail';
  if (!canUpgrade(item)) return 'max';
  const cost = upgradeCost(item);
  if (state.currencies.gold < cost) return 'noGold';
  state.currencies.gold -= cost;
  if (!chance(upgradeChance(item))) return 'fail';
  item.upgrade += 1;
  state.counters.upgrades += 1;
  clampHp(state);
  return 'success';
}

export const findItem = (state: GameState, itemId: string) =>
  state.inventory.find((i) => i.id === itemId) ?? Object.values(state.equipment).find((i) => i?.id === itemId);
