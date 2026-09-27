import { BOSS_IDS, ENEMIES } from '../data/enemies';
import { LOCATIONS } from '../data/locations';
import type { EnemyTemplate } from '../types';

export const TOWER_FLOORS = 100;

export const towerLevel = (floor: number) => Math.max(1, Math.round(1 + floor * 0.62));
export const isTowerBoss = (floor: number) => floor % 10 === 0;

/** Deterministic enemy per floor so the tower feels hand-crafted. */
export function towerEnemy(floor: number): EnemyTemplate {
  if (floor >= TOWER_FLOORS) return ENEMIES.shadowKing;
  if (isTowerBoss(floor)) {
    const idx = floor / 10 - 1;
    if (idx % 2 === 1 || idx >= 10) return ENEMIES.towerWarden;
    const bosses = BOSS_IDS.filter((id) => id !== 'towerWarden');
    return ENEMIES[bosses[Math.floor(idx / 2) % bosses.length]];
  }
  // enemies whose home location level is close to the floor level
  const lvl = towerLevel(floor);
  const pool = TOWER_POOL.filter((e) => e.level <= lvl + 2).slice(-5);
  const list = pool.length ? pool : TOWER_POOL.slice(0, 1);
  return ENEMIES[list[(floor * 7) % list.length].id];
}

/** Regular enemies ordered by the level they appear at in the campaign. */
const TOWER_POOL = LOCATIONS.flatMap((l) => l.stages)
  .filter((s) => !ENEMIES[s.enemyId].boss)
  .map((s) => ({ id: s.enemyId, level: s.level }))
  .sort((a, b) => a.level - b.level);

export function towerFloorReward(floor: number) {
  const boss = isTowerBoss(floor);
  return {
    gold: Math.round((20 + floor * 9) * (boss ? 4 : 1)),
    xp: Math.round((25 + floor * 11) * (boss ? 3 : 1)),
    shards: Math.round((3 + floor / 4) * (boss ? 5 : 1)),
    crystals: boss ? 10 + floor / 5 : 0,
  };
}
