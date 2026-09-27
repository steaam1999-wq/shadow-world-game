// Balance simulation: auto-plays the campaign for every class and prints boss checkpoints.
// Usage: npm run sim   (CLS=assassin npm run sim for a single class)
import { LOCATIONS } from '../src/data/locations';
import { ENEMIES } from '../src/data/enemies';
import { CLASSES } from '../src/data/classes';
import { newGameState } from '../src/game/save';
import { createHero, heroStats, allocatePoint } from '../src/game/hero';
import { createPlayerCombatant, createEnemyCombatant, startCombat, playRound, canUseAction, getUnlockedAbilities, HEAVY_COST } from '../src/game/combat';
import { resolveBattle } from '../src/game/rewards';
import { equipItem } from '../src/game/inventory';
import { itemPower } from '../src/game/items';
import type { ClassId, PlayerAction, CombatState } from '../src/types';

(globalThis as any).localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

function autoAction(c: CombatState, classId: ClassId): PlayerAction {
  if (c.player.statuses.some((s) => s.id === 'stun')) return { type: 'skip' };
  if (c.player.hp < c.player.maxHp * 0.3 && canUseAction(c, { type: 'potion' }).ok) return { type: 'potion' };
  const ab = [...getUnlockedAbilities(classId, c.player.level)].reverse().find((a) => canUseAction(c, { type: 'ability', abilityId: a.id }).ok);
  if (ab) return { type: 'ability', abilityId: ab.id };
  if (c.player.energy >= HEAVY_COST + 40) return { type: 'heavy' };
  return { type: 'attack' };
}

for (const cls of (process.env.CLS ? [process.env.CLS] : Object.keys(CLASSES)) as ClassId[]) {
  const s = newGameState();
  s.hero = createHero('Sim', cls);
  s.hero.hp = heroStats(s).maxHp;
  let fights = 0;
  const report: string[] = [];
  for (const loc of LOCATIONS) {
    for (let st = 0; st < loc.stages.length; st++) {
      let tries = 0;
      while (true) {
        // farm previous stage if losing too much
        tries++; fights++;
        if (fights > 3000) break;
        s.hero!.hp = heroStats(s).maxHp; // assume rest
        if (s.potions < 3) s.potions = 3;
        const t = ENEMIES[loc.stages[st].enemyId];
        const init = startCombat(createPlayerCombatant(s), createEnemyCombatant(t, loc.stages[st].level), s.potions);
        let cs = init.state;
        let turns = 0;
        while (!cs.over && turns < 200) { cs = playRound(cs, autoAction(cs, cls)).state; turns++; }
        const res = resolveBattle(s, { kind: 'location', locationId: loc.id, stageIndex: st, enemyTemplate: t, isBoss: !!t.boss }, cs);
        // allocate points & gear
        const rec = CLASSES[cls].recommended;
        let i = 0;
        while (s.hero!.freePoints > 0) allocatePoint(s, rec[i++ % 2 === 0 ? 0 : 1] ?? rec[0]);
        for (const it of [...s.inventory]) {
          const eq = s.equipment[it.slot];
          if (!eq || itemPower(it) > itemPower(eq)) equipItem(s, it.id);
        }
        if (res.victory) {
          if (true) report.push(`${loc.id}#${st}${t.boss ? '(BOSS)' : ''} lvl${loc.stages[st].level}: tries=${tries} turns=${turns} heroLvl=${s.hero!.level} power=${heroStats(s).power} atk=${heroStats(s).atk} hp=${heroStats(s).maxHp}`);
          break;
        } else if (st > 0) {
          // farm the previous stage once to gain xp
          st = Math.max(0, st - 1); tries = 0; // redo previous (counts as grinding)
        }
      }
    }
  }
  console.log(`== ${cls}: total fights ${fights}, final level ${s.hero!.level}`);
  console.log(report.join('\n'));
}
