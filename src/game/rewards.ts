import type { BattleContext, BattleResult, CombatState, GameState, Reward } from '../types';
import { chance, rand, randInt } from '../utils/random';
import { driftBots, generateOpponents, ratingDelta } from './arena';
import { addXp, heroStats } from './hero';
import { addItems } from './inventory';
import { generateItem, rollRarity, type LootSource } from './items';
import { trackEvent } from './quests';
import { grantShadow } from './shadows';
import { isTowerBoss, towerFloorReward } from './tower';

export const emptyReward = (): Reward => ({ xp: 0, gold: 0, crystals: 0, shards: 0, tokens: 0, items: [], shadows: [], potions: 0 });

export const enemyXp = (level: number, boss: boolean) => Math.round((30 + level * 10) * (1 + level * 0.05) * (boss ? 4 : 1));
export const enemyGold = (level: number, boss: boolean) => Math.round((10 + level * 5) * rand(0.85, 1.15) * (boss ? 4 : 1));

function rollLoot(r: Reward, level: number, source: LootSource, dropChance: number, extra = 0) {
  if (chance(dropChance)) r.items.push(generateItem(level, rollRarity(source)));
  for (let i = 0; i < extra; i++) if (chance(50)) r.items.push(generateItem(level, rollRarity(source)));
}

/** Applies a reward to state. Returns levels gained. */
export function applyReward(state: GameState, r: Reward): number {
  state.currencies.gold += r.gold;
  state.currencies.crystals += r.crystals;
  state.currencies.shards += r.shards;
  state.currencies.tokens += r.tokens;
  state.potions += r.potions;
  state.counters.goldEarned += r.gold;
  if (r.gold > 0) trackEvent(state, 'earnGold', r.gold);
  const overflow = addItems(state, r.items);
  r.gold += overflow;
  return addXp(state, r.xp);
}

export function resolveBattle(state: GameState, ctx: BattleContext, cs: CombatState): BattleResult {
  const hero = state.hero!;
  const victory = cs.winner === 'player';
  const reward = emptyReward();
  const enemyLevel = cs.enemy.level;
  const result: BattleResult = { victory, reward, levelsGained: 0 };

  // Bookkeeping shared by every battle type
  state.counters.battles += 1;
  state.counters.crits += cs.crits;
  state.potions = cs.potions;
  trackEvent(state, 'battle');
  if (cs.crits) trackEvent(state, 'critHit', cs.crits);
  if (cs.potionsUsed) trackEvent(state, 'usePotion', cs.potionsUsed);

  if (victory) {
    state.counters.wins += 1;
    state.counters.winStreak += 1;
    state.counters.bestWinStreak = Math.max(state.counters.bestWinStreak, state.counters.winStreak);
    state.counters.kills += 1;
    trackEvent(state, 'kill');
    if (ctx.isBoss) {
      state.counters.bossKills += 1;
      trackEvent(state, 'bossKill');
    }
  } else {
    state.counters.losses += 1;
    state.counters.winStreak = 0;
  }

  if (ctx.kind === 'arena') {
    const opp = ctx.arenaOpponent!;
    const delta = ratingDelta(victory, state.arena.rating, opp.rating);
    state.arena.rating = Math.max(0, state.arena.rating + delta);
    state.arena.bestRating = Math.max(state.arena.bestRating, state.arena.rating);
    result.ratingChange = delta;
    trackEvent(state, 'arenaFight');
    if (victory) {
      state.arena.wins += 1;
      state.counters.arenaWins += 1;
      trackEvent(state, 'arenaWin');
      reward.tokens = 12 + Math.floor(opp.level / 3);
      reward.gold = Math.round(40 + opp.level * 8);
      reward.xp = Math.round(enemyXp(opp.level, false) * 0.8);
      rollLoot(reward, opp.level, 'arena', 22);
    } else {
      state.arena.losses += 1;
      reward.tokens = 3;
    }
    driftBots(state);
    state.arena.opponents = generateOpponents(state);
    // PvP does not consume the hero's real HP
  } else {
    hero.hp = victory ? cs.player.hp : Math.round(heroStats(state).maxHp * 0.15);

    if (victory && ctx.kind === 'location') {
      const id = ctx.locationId!;
      const stage = ctx.stageIndex!;
      const firstClear = (state.locations[id] ?? 0) === stage;
      if (firstClear) state.locations[id] = stage + 1;
      reward.xp = enemyXp(enemyLevel, ctx.isBoss);
      reward.gold = enemyGold(enemyLevel, ctx.isBoss);
      if (ctx.isBoss) {
        reward.crystals = firstClear ? 25 : 3;
        reward.shards = randInt(10, 20);
        rollLoot(reward, enemyLevel + 1, 'boss', 100, 2);
      } else {
        if (firstClear) reward.crystals = 3;
        if (chance(15)) reward.shards = randInt(1, 4);
        rollLoot(reward, enemyLevel, 'normal', 40);
      }
      if (chance(12)) reward.potions = 1;
      result.message = firstClear ? 'Первое прохождение! Дополнительная награда.' : undefined;
    }

    if (victory && ctx.kind === 'tower') {
      const floor = ctx.floor!;
      const fr = towerFloorReward(floor);
      reward.xp = fr.xp;
      reward.gold = fr.gold;
      reward.shards = fr.shards;
      reward.crystals = Math.round(fr.crystals);
      rollLoot(reward, enemyLevel, isTowerBoss(floor) ? 'towerBoss' : 'tower', isTowerBoss(floor) ? 100 : 35, isTowerBoss(floor) ? 1 : 0);
      trackEvent(state, 'towerFloor');
      state.tower.current = Math.min(100, floor + 1);
      if (floor > state.tower.best) {
        state.tower.best = floor;
        result.newBestFloor = true;
      }
      if (floor >= 100) result.message = 'Вы покорили вершину Башни Теней!';
    }

    // Shadow drop
    const t = ctx.enemyTemplate;
    if (victory && t?.shadowId && chance((t.shadowChance ?? 0) * 100 * (ctx.kind === 'tower' ? 0.8 : 1))) {
      reward.shadows.push(grantShadow(state, t.shadowId, 1));
    }
  }

  result.levelsGained = applyReward(state, reward);
  return result;
}
