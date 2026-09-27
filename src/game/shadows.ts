import { MAX_SHADOW_TIER, SHADOWS, SHADOW_LIST } from '../data/shadows';
import type { GameState, ShadowInstance } from '../types';
import { pick, uid, weighted } from '../utils/random';

export const SHADOW_SLOT_LEVELS = [1, 8, 18];
export const SUMMON_COST = 120; // shards
export const mergeCost = (tier: number) => tier * 60; // shards
export const absorbValue = (s: ShadowInstance) => 15 * Math.pow(2, s.tier - 1);

export function grantShadow(state: GameState, defId: string, tier = 1): ShadowInstance {
  const inst: ShadowInstance = { uid: uid(), defId, tier };
  state.shadows.push(inst);
  if (!state.discoveredShadows.includes(defId)) state.discoveredShadows.push(defId);
  state.counters.shadowsObtained += 1;
  state.counters.maxShadowTier = Math.max(state.counters.maxShadowTier, tier);
  // auto-equip into a free unlocked slot
  const lvl = state.hero?.level ?? 1;
  const free = state.equippedShadows.findIndex((x, i) => !x && lvl >= SHADOW_SLOT_LEVELS[i]);
  if (free >= 0) state.equippedShadows[free] = inst.uid;
  return inst;
}

/** Finds a merge partner for the given shadow (same def & tier). */
export const findMergePartner = (state: GameState, s: ShadowInstance) =>
  state.shadows.find((o) => o.uid !== s.uid && o.defId === s.defId && o.tier === s.tier);

export function mergeShadow(state: GameState, shadowUid: string): ShadowInstance | null {
  const s = state.shadows.find((x) => x.uid === shadowUid);
  if (!s || s.tier >= MAX_SHADOW_TIER) return null;
  const partner = findMergePartner(state, s);
  if (!partner) return null;
  const cost = mergeCost(s.tier);
  if (state.currencies.shards < cost) return null;
  state.currencies.shards -= cost;
  // keep the equipped one if any
  const keep = state.equippedShadows.includes(partner.uid) && !state.equippedShadows.includes(s.uid) ? partner : s;
  const drop = keep === s ? partner : s;
  keep.tier += 1;
  state.shadows = state.shadows.filter((x) => x.uid !== drop.uid);
  state.equippedShadows = state.equippedShadows.map((x) => (x === drop.uid ? null : x));
  state.counters.maxShadowTier = Math.max(state.counters.maxShadowTier, keep.tier);
  return keep;
}

export function absorbShadow(state: GameState, shadowUid: string) {
  const s = state.shadows.find((x) => x.uid === shadowUid);
  if (!s) return 0;
  const v = absorbValue(s);
  state.shadows = state.shadows.filter((x) => x.uid !== shadowUid);
  state.equippedShadows = state.equippedShadows.map((x) => (x === shadowUid ? null : x));
  state.currencies.shards += v;
  return v;
}

export function summonShadow(state: GameState): ShadowInstance | null {
  if (state.currencies.shards < SUMMON_COST) return null;
  state.currencies.shards -= SUMMON_COST;
  const weights: Record<string, number> = { uncommon: 40, rare: 35, epic: 18, legendary: 6, mythic: 1 };
  const rarity = weighted(Object.entries(weights));
  const pool = SHADOW_LIST.filter((s) => s.rarity === rarity);
  const def = pick(pool.length ? pool : SHADOW_LIST);
  return grantShadow(state, def.id, 1);
}

export function toggleEquipShadow(state: GameState, shadowUid: string): string | null {
  const idx = state.equippedShadows.indexOf(shadowUid);
  if (idx >= 0) {
    state.equippedShadows[idx] = null;
    return null;
  }
  const s = state.shadows.find((x) => x.uid === shadowUid)!;
  // one shadow of each kind at a time
  if (state.equippedShadows.some((u) => u && state.shadows.find((x) => x.uid === u)?.defId === s.defId)) {
    return 'Тень этого вида уже экипирована';
  }
  const lvl = state.hero?.level ?? 1;
  const free = state.equippedShadows.findIndex((x, i) => !x && lvl >= SHADOW_SLOT_LEVELS[i]);
  if (free < 0) return 'Нет свободных слотов';
  state.equippedShadows[free] = shadowUid;
  return null;
}

export const shadowDef = (s: ShadowInstance) => SHADOWS[s.defId];
