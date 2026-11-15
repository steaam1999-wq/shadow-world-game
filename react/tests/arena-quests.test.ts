import { describe, it, expect } from "vitest";
import { freshGame, type GameState } from "../src/game";
import { addXp, grantReward, doJob, buyItem } from "../src/economy";
import { makeRivals, rivalCombatant, eloDelta, beginArena, settleArena, attemptsLeft, leagueOf, ARENA_ATTEMPTS } from "../src/arena";
import { startBattle } from "../src/combat";
import { playerCombatant } from "../src/economy";
import { availableStory, acceptQuest, claimQuest, isStoryDone, refreshDaily, dailyFor, isDailyDone, STORY_QUESTS } from "../src/quests";

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const T0 = 1_700_000_000_000;
const game = (p: Partial<GameState> = {}) => ({ ...freshGame(T0), ...p });

describe("Арена", () => {
  it("соперники близки по уровню и одеты по своему уровню", () => {
    const list = makeRivals(10, 1200, seeded(1), 20);
    for (const r of list) {
      expect(Math.abs(r.level - 10)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.rating - 1200)).toBeLessThanOrEqual(120);
      expect(rivalCombatant(r).hp).toBeGreaterThan(0);
    }
  });
  it("Эло: победа над сильным даёт больше, поражение отнимает", () => {
    expect(eloDelta(1000, 1200, true)).toBeGreaterThan(eloDelta(1000, 800, true));
    expect(eloDelta(1000, 1000, false)).toBe(-16);
  });
  it("5 попыток в день, затем отказ; новый день — снова 5", () => {
    let s = game();
    for (let i = 0; i < ARENA_ATTEMPTS; i++) s = beginArena(s, "2026-11-15").state;
    expect(attemptsLeft(s.eco.arena, "2026-11-15")).toBe(0);
    expect(beginArena(s, "2026-11-15").ok).toBe(false);
    expect(beginArena(s, "2026-11-16").ok).toBe(true);
  });
  it("итог боя меняет рейтинг, победы, деньги и лигу", () => {
    const s = game();
    const r = makeRivals(1, 1000, seeded(2), 1)[0];
    const b = { ...startBattle(playerCombatant(s, "Я"), rivalCombatant(r)), over: true, winner: "player" as const };
    const w = settleArena(s, r, b, seeded(3), addXp);
    expect(w.state.eco.arena.rating).toBeGreaterThan(1000);
    expect(w.state.eco.arena.wins).toBe(1);
    expect(w.state.money).toBeGreaterThan(s.money);
    const l = settleArena(s, r, { ...b, winner: "enemy" as const }, seeded(3), addXp);
    expect(l.state.eco.arena.rating).toBeLessThan(1000);
    expect(l.state.money).toBe(s.money);
    expect(leagueOf(1350).name).toBe("Золото");
  });
});

describe("Поручения", () => {
  it("цепочка: первое доступно сразу, следующее — после выполнения", () => {
    const s = game();
    expect(availableStory(s).map((q) => q.id)).toEqual(["q1"]);
    let a = acceptQuest(s, "q1").state;
    expect(availableStory(a)).toHaveLength(0);
    expect(isStoryDone(a, "q1")).toBe(false);
    for (let i = 0; i < 3; i++) a = doJob({ ...a, energy: 100 }, "port", () => 0.99).state;
    expect(isStoryDone(a, "q1")).toBe(true);
    const c = claimQuest(a, "q1", grantReward);
    expect(c.ok).toBe(true);
    expect(c.state.money).toBe(a.money + STORY_QUESTS[0].reward.money);
    expect(availableStory(c.state).map((q) => q.id)).toEqual(["q2"]);
    expect(claimQuest(c.state, "q1", grantReward).ok).toBe(false);
  });
  it("прогресс считается с момента взятия; награда-предмет попадает в сумку", () => {
    let s = game({ money: 5000 });
    for (let i = 0; i < 3; i++) s = doJob({ ...s, energy: 100 }, "port", () => 0.99).state;
    s = { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, done: ["q1"] }, wins: 5 } };
    s = acceptQuest(s, "q2").state;
    expect(isStoryDone(s, "q2")).toBe(false); // старые 5 побед не считаются
    s = { ...s, eco: { ...s.eco, wins: 7 } };
    const c = claimQuest(s, "q2", grantReward).state;
    expect(c.eco.loadout.items.some((i) => i.defId === "hoodie")).toBe(true);
  });
  it("цель «по состоянию» (надетые вещи) засчитывает уже надетое", () => {
    let s = game({ money: 5000, level: 2, xp: 50 });
    s = { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, done: ["q1", "q2"] } } };
    s = acceptQuest(s, "q3").state;
    s = buyItem(buyItem(s, "cap").state, "shades").state;
    expect(isStoryDone(s, "q3")).toBe(true); // футболка, джинсы, кроссовки + кепка + очки = 5
  });
  it("ежедневные: одинаковый набор на дату, отдельная точка отсчёта", () => {
    expect(dailyFor("2026-11-15", 10)).toEqual(dailyFor("2026-11-15", 10));
    expect(dailyFor("2026-11-15", 10)).toHaveLength(3);
    let s = refreshDaily(game(), "2026-11-15");
    expect(s.eco.quests.daily.ids).toHaveLength(3);
    const id = s.eco.quests.daily.ids[0];
    expect(isDailyDone(s, id)).toBe(false);
    s = refreshDaily(s, "2026-11-15");
    expect(s.eco.quests.daily.day).toBe("2026-11-15");
  });
});
