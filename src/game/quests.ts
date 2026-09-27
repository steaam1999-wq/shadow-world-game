import { ACHIEVEMENTS, DAILY_QUEST_COUNT, QUEST_POOL } from '../data/quests';
import type { AchievementDef, DailyState, GameState, QuestDef, QuestEvent } from '../types';
import { todayKey } from '../utils/format';
import { shuffle } from '../utils/random';

export function createDaily(): DailyState {
  return {
    date: todayKey(),
    quests: shuffle(QUEST_POOL)
      .slice(0, DAILY_QUEST_COUNT)
      .map((q) => ({ id: q.id, progress: 0, claimed: false })),
    bonusClaimed: false,
  };
}

/** Resets daily quests if the calendar day changed. Returns true on reset. */
export function ensureDaily(state: GameState): boolean {
  if (state.daily.date === todayKey() && state.daily.quests.length) return false;
  state.daily = createDaily();
  return true;
}

export const questDef = (id: string): QuestDef => QUEST_POOL.find((q) => q.id === id)!;

export function trackEvent(state: GameState, event: QuestEvent, amount = 1) {
  for (const q of state.daily.quests) {
    const def = questDef(q.id);
    if (def && def.event === event && !q.claimed) q.progress = Math.min(def.target, q.progress + amount);
  }
}

export const claimableQuests = (state: GameState) =>
  state.daily.quests.filter((q) => !q.claimed && q.progress >= questDef(q.id).target).length;

export const allQuestsClaimed = (state: GameState) => state.daily.quests.every((q) => q.claimed);

/** Returns achievements newly unlocked (and records them). */
export function checkAchievements(state: GameState): AchievementDef[] {
  if (!state.hero) return [];
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue;
    if (a.check(state)) {
      state.achievements.push(a.id);
      state.currencies.crystals += a.reward.crystals;
      state.currencies.gold += a.reward.gold ?? 0;
      state.currencies.shards += a.reward.shards ?? 0;
      fresh.push(a);
    }
  }
  return fresh;
}
