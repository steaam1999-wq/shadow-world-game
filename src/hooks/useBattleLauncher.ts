import { useCallback } from 'react';
import { ENEMIES } from '../data/enemies';
import { getLocation } from '../data/locations';
import { createArenaCombatant, createEnemyCombatant, createPlayerCombatant } from '../game/combat';
import { heroStats } from '../game/hero';
import { isTowerBoss, towerEnemy, towerLevel } from '../game/tower';
import type { ArenaOpponent } from '../types';
import { useGame } from './useGame';

export const MIN_HP_TO_FIGHT = 0.25;

export function useBattleLauncher() {
  const { state, startBattle, toast, play } = useGame();

  const hpOk = useCallback(() => {
    if (!state.hero) return false;
    const max = heroStats(state).maxHp;
    if (state.hero.hp < max * MIN_HP_TO_FIGHT) {
      play('error');
      toast({ kind: 'error', title: 'Слишком мало здоровья', text: 'Отдохните у костра или подождите восстановления', icon: '🩸' });
      return false;
    }
    return true;
  }, [state, play, toast]);

  const launchLocation = useCallback(
    (locationId: string, stageIndex: number) => {
      if (!hpOk()) return;
      const loc = getLocation(locationId);
      const stage = loc.stages[stageIndex];
      const t = ENEMIES[stage.enemyId];
      startBattle(
        { kind: 'location', locationId, stageIndex, enemyTemplate: t, isBoss: !!t.boss },
        createPlayerCombatant(state),
        createEnemyCombatant(t, stage.level),
      );
    },
    [state, startBattle, hpOk],
  );

  const launchTower = useCallback(() => {
    if (!hpOk()) return;
    const floor = state.tower.current;
    const t = towerEnemy(floor);
    const enemy = createEnemyCombatant(t, towerLevel(floor));
    if (isTowerBoss(floor) && !t.boss) enemy.maxHp = enemy.hp = enemy.maxHp * 3;
    startBattle({ kind: 'tower', floor, enemyTemplate: t, isBoss: !!t.boss }, createPlayerCombatant(state), enemy);
  }, [state, startBattle, hpOk]);

  const launchArena = useCallback(
    (opp: ArenaOpponent) => {
      const player = createPlayerCombatant(state);
      player.hp = player.maxHp; // arena fights always start at full HP
      startBattle({ kind: 'arena', arenaOpponent: opp, isBoss: false }, player, createArenaCombatant(opp));
    },
    [state, startBattle],
  );

  return { launchLocation, launchTower, launchArena };
}
