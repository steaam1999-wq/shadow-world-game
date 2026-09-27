import type { GameState, Item } from '../types';
import { heroStats } from './hero';
import { addItems } from './inventory';
import { generateItem, rollRarity } from './items';

export const potionPrice = (state: GameState) => 30 + (state.hero?.level ?? 1) * 4;
export const restPrice = (state: GameState) => 10 + (state.hero?.level ?? 1) * 3;
export const CHEST_COST = 40; // crystals
export const PREMIUM_CHEST_COST = 120; // crystals
export const INSTANT_HEAL_COST = 5; // crystals

export type ShopResult = { ok: true; items?: Item[] } | { ok: false; reason: string };

export function buyPotion(state: GameState, qty = 1): ShopResult {
  const cost = potionPrice(state) * qty;
  if (state.currencies.gold < cost) return { ok: false, reason: 'Недостаточно золота' };
  state.currencies.gold -= cost;
  state.potions += qty;
  return { ok: true };
}

export function rest(state: GameState, withCrystals: boolean): ShopResult {
  const hero = state.hero!;
  const max = heroStats(state).maxHp;
  if (hero.hp >= max) return { ok: false, reason: 'Здоровье уже полное' };
  if (withCrystals) {
    if (state.currencies.crystals < INSTANT_HEAL_COST) return { ok: false, reason: 'Недостаточно кристаллов' };
    state.currencies.crystals -= INSTANT_HEAL_COST;
  } else {
    const cost = restPrice(state);
    if (state.currencies.gold < cost) return { ok: false, reason: 'Недостаточно золота' };
    state.currencies.gold -= cost;
  }
  hero.hp = max;
  return { ok: true };
}

export function openChest(state: GameState, premium: boolean): ShopResult {
  const cost = premium ? PREMIUM_CHEST_COST : CHEST_COST;
  if (state.currencies.crystals < cost) return { ok: false, reason: 'Недостаточно кристаллов' };
  state.currencies.crystals -= cost;
  const lvl = state.hero?.level ?? 1;
  const items = [generateItem(lvl + 1, rollRarity(premium ? 'premiumChest' : 'chest'))];
  if (premium) items.push(generateItem(lvl + 1, rollRarity('chest')));
  addItems(state, items);
  return { ok: true, items };
}
