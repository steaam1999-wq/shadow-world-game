/**
 * Поручения: сюжетные цепочки от жителей города и ежедневные задания.
 * Прогресс накопительных целей считается от момента, когда задание взято (baseline);
 * «состояние» (уровень, надетые вещи, бойцы, районы) — по текущему значению.
 */
import { SLOT_IDS } from "./equipment";
import type { EcoHost, Result } from "./economy";

export type Metric = "jobs" | "wins" | "arenaWins" | "earned" | "biz" | "turf" | "bossKills" | "level" | "gear" | "crew" | "trainings";
/** Цели «по состоянию»: считаются по текущему значению, а не с момента взятия. */
const ABSOLUTE: Metric[] = ["level", "gear", "crew", "turf", "biz"];

export type Objective = { m: Metric; n: number; label: string };
export type Reward = { money: number; xp: number; gold?: number; item?: string };
export type QuestDef = { id: string; giver: string; title: string; text: string; objectives: Objective[]; reward: Reward; minLevel: number; after?: string };

export type QuestState = {
  active: Record<string, Partial<Record<Metric, number>>>;
  done: string[];
  daily: { day: string; ids: string[]; base: Partial<Record<Metric, number>>; claimed: string[] };
};
export const freshQuests = (): QuestState => ({ active: {}, done: [], daily: { day: "", ids: [], base: {}, claimed: [] } });

type QHost = EcoHost & { eco: EcoHost["eco"] & { quests: QuestState; arena: { wins: number }; trained?: number } };

export function metric(s: QHost, m: Metric): number {
  const e = s.eco;
  switch (m) {
    case "jobs": return e.jobsTotal;
    case "wins": return e.wins;
    case "arenaWins": return e.arena.wins;
    case "earned": return e.earned;
    case "biz": return Object.values(e.biz).reduce((a, b) => a + b, 0);
    case "turf": return e.captured.length;
    case "bossKills": return Object.values(e.bossKills).reduce((a, b) => a + b, 0);
    case "level": return s.level;
    case "gear": return SLOT_IDS.filter((sl) => e.loadout.equipment[sl]).length;
    case "crew": return e.crew;
    case "trainings": return e.trained ?? 0;
  }
}
const snapshot = (s: QHost, objs: Objective[]) => Object.fromEntries(objs.map((o) => [o.m, metric(s, o.m)]));
/** Прогресс цели: для накопительных — прирост с момента взятия. */
export function progress(s: QHost, o: Objective, base: Partial<Record<Metric, number>>): number {
  const v = metric(s, o.m);
  return Math.min(o.n, ABSOLUTE.includes(o.m) ? v : v - (base[o.m] ?? v));
}
const complete = (s: QHost, objs: Objective[], base: Partial<Record<Metric, number>>) => objs.every((o) => progress(s, o, base) >= o.n);

// ---------------- сюжетные поручения ----------------
export const STORY_QUESTS: QuestDef[] = [
  { id: "q1", giver: "mark", title: "Первый заказ", text: "«Город проверяет новеньких делом. Сделай три движухи — и я пойму, что ты не болтун».", objectives: [{ m: "jobs", n: 3, label: "Выполнить движухи" }], reward: { money: 300, xp: 40 }, minLevel: 1 },
  { id: "q2", giver: "tommy", title: "Вышибала на вечер", text: "«В баре шумно. Покажи паре задир, кто здесь спокойный».", objectives: [{ m: "wins", n: 2, label: "Выиграть бои" }], reward: { money: 500, xp: 50, item: "hoodie" }, minLevel: 1, after: "q1" },
  { id: "q3", giver: "mark", title: "Встречают по одёжке", text: "«В таком виде тебя никто всерьёз не примет. Собери нормальный комплект — пять вещей на себе».", objectives: [{ m: "gear", n: 5, label: "Надеть вещи в разные слоты" }], reward: { money: 600, xp: 60, item: "shades" }, minLevel: 2, after: "q2" },
  { id: "q4", giver: "nicholas", title: "Своя точка", text: "«Деньги должны работать, пока ты спишь. Купи первую точку».", objectives: [{ m: "biz", n: 1, label: "Купить точку" }], reward: { money: 800, xp: 70 }, minLevel: 2, after: "q3" },
  { id: "q5", giver: "tommy", title: "Подпольная арена", text: "«Под эстакадой по пятницам дерутся за рейтинг. Выиграй там — и тебя начнут узнавать».", objectives: [{ m: "arenaWins", n: 2, label: "Победы на арене" }], reward: { money: 900, xp: 90, gold: 2 }, minLevel: 3, after: "q4" },
  { id: "q6", giver: "sofia", title: "Деньги любят счёт", text: "«Заработай десять тысяч. Чисто или почти чисто — мне важен результат».", objectives: [{ m: "earned", n: 10000, label: "Заработать денег" }], reward: { money: 2000, xp: 150 }, minLevel: 4, after: "q5" },
  { id: "q7", giver: "luca", title: "Район для своих", text: "«West Side держит банда, которая никому не нужна. Возьми район — будем партнёрами».", objectives: [{ m: "turf", n: 1, label: "Захватить район" }], reward: { money: 3000, xp: 200, item: "chain" }, minLevel: 4, after: "q6" },
  { id: "q8", giver: "clark", title: "Неофициально", text: "«Кабан с рынка всем надоел. Я ничего не говорил. Но был бы рад».", objectives: [{ m: "bossKills", n: 1, label: "Победить босса в рейде" }], reward: { money: 3000, xp: 250 }, minLevel: 5, after: "q7" },
  { id: "q9", giver: "alex", title: "Своя команда", text: "«Одиночек в этом городе съедают. Собери хотя бы пятерых».", objectives: [{ m: "crew", n: 5, label: "Бойцов в бригаде" }], reward: { money: 4000, xp: 300 }, minLevel: 6, after: "q8" },
  { id: "q10", giver: "rafael", title: "Имя на арене", text: "«Рейтинг — это реклама. Десять побед, и о тебе заговорят в моих клубах».", objectives: [{ m: "arenaWins", n: 10, label: "Победы на арене" }], reward: { money: 8000, xp: 400, item: "balaclava" }, minLevel: 8, after: "q9" },
  { id: "q11", giver: "antonio", title: "Терпение", text: "«Расти, мальчик. Двенадцатый уровень — тогда поговорим о серьёзном».", objectives: [{ m: "level", n: 12, label: "Уровень" }], reward: { money: 10000, xp: 500, gold: 5 }, minLevel: 8, after: "q10" },
  { id: "q12", giver: "victor", title: "Человек Харриганов", text: "«Три района под твоим словом — и у тебя будет место за моим столом».", objectives: [{ m: "turf", n: 3, label: "Районы под контролем" }], reward: { money: 25000, xp: 800, item: "plate" }, minLevel: 12, after: "q11" },
];

// ---------------- ежедневные задания ----------------
export const DAILY_POOL: QuestDef[] = [
  { id: "d_jobs5", giver: "mark", title: "Рабочий день", text: "Выполни пять движух.", objectives: [{ m: "jobs", n: 5, label: "Движухи" }], reward: { money: 40, xp: 25 }, minLevel: 1 },
  { id: "d_jobs10", giver: "nicholas", title: "Без выходных", text: "Выполни десять движух.", objectives: [{ m: "jobs", n: 10, label: "Движухи" }], reward: { money: 80, xp: 45 }, minLevel: 3 },
  { id: "d_wins3", giver: "tommy", title: "Уличная репутация", text: "Выиграй три боя.", objectives: [{ m: "wins", n: 3, label: "Победы в боях" }], reward: { money: 60, xp: 35 }, minLevel: 1 },
  { id: "d_wins5", giver: "alex", title: "Без жалости", text: "Выиграй пять боёв.", objectives: [{ m: "wins", n: 5, label: "Победы в боях" }], reward: { money: 100, xp: 55, gold: 1 }, minLevel: 4 },
  { id: "d_arena2", giver: "rafael", title: "Вечер на арене", text: "Победи на арене дважды.", objectives: [{ m: "arenaWins", n: 2, label: "Победы на арене" }], reward: { money: 90, xp: 50, gold: 1 }, minLevel: 2 },
  { id: "d_earn", giver: "sofia", title: "Оборот", text: "Заработай денег.", objectives: [{ m: "earned", n: 3000, label: "Заработать" }], reward: { money: 70, xp: 40 }, minLevel: 2 },
  { id: "d_train", giver: "daniel", title: "Форма", text: "Проведи две тренировки в хате.", objectives: [{ m: "trainings", n: 2, label: "Тренировки" }], reward: { money: 50, xp: 30 }, minLevel: 1 },
];
export const DAILY_COUNT = 3;

/** Набор заданий дня: детерминирован по дате, поэтому одинаков после перезагрузки. */
export function dailyFor(day: string, level: number): string[] {
  let h = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const pool = DAILY_POOL.filter((q) => q.minLevel <= level).map((q) => q.id);
  const out: string[] = [];
  while (out.length < Math.min(DAILY_COUNT, pool.length)) {
    h = (h * 1103515245 + 12345) | 0;
    const id = pool[Math.abs(h) % pool.length];
    if (!out.includes(id)) out.push(id);
  }
  return out;
}
/** Обновить ежедневные задания на новый день (с новой точкой отсчёта прогресса). */
export function refreshDaily<T extends QHost>(s: T, day: string): T {
  if (s.eco.quests.daily.day === day) return s;
  const ids = dailyFor(day, s.level);
  const objs = ids.flatMap((id) => DAILY_POOL.find((q) => q.id === id)!.objectives);
  return { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, daily: { day, ids, base: snapshot(s, objs), claimed: [] } } } };
}

/** Сюжетные поручения, которые можно взять сейчас. */
export function availableStory(s: QHost): QuestDef[] {
  const q = s.eco.quests;
  return STORY_QUESTS.filter((d) => !q.done.includes(d.id) && !q.active[d.id] && s.level >= d.minLevel && (!d.after || q.done.includes(d.after)));
}
export function acceptQuest<T extends QHost>(s: T, id: string): Result<T> {
  const d = STORY_QUESTS.find((x) => x.id === id);
  if (!d || !availableStory(s).includes(d)) return { state: s, ok: false, message: "Поручение недоступно" };
  return { state: { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, active: { ...s.eco.quests.active, [id]: snapshot(s, d.objectives) } } } }, ok: true, message: `Взято: «${d.title}»` };
}
export const isStoryDone = (s: QHost, id: string) => {
  const d = STORY_QUESTS.find((x) => x.id === id), base = s.eco.quests.active[id];
  return !!d && !!base && complete(s, d.objectives, base);
};
export const isDailyDone = (s: QHost, id: string) => {
  const d = DAILY_POOL.find((x) => x.id === id);
  return !!d && s.eco.quests.daily.ids.includes(id) && complete(s, d.objectives, s.eco.quests.daily.base);
};
/** Сумма денег ежедневного задания растёт с уровнем. */
export const dailyMoney = (d: QuestDef, level: number) => d.reward.money * (2 + level);

/**
 * Забрать награду. Выдача предметов и опыта делегирована вызывающему коду (give),
 * чтобы квесты не зависели от экономики напрямую.
 */
export function claimQuest<T extends QHost>(s: T, id: string, give: (s: T, r: Reward) => T): Result<T> {
  const story = STORY_QUESTS.find((x) => x.id === id);
  if (story) {
    if (!isStoryDone(s, id)) return { state: s, ok: false, message: "Цели ещё не выполнены" };
    const { [id]: _done, ...active } = s.eco.quests.active;
    const next = { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, active, done: [...s.eco.quests.done, id] } } };
    return { state: give(next, story.reward), ok: true, message: `«${story.title}» выполнено: +$${story.reward.money}, +${story.reward.xp} опыта` };
  }
  const daily = DAILY_POOL.find((x) => x.id === id);
  if (!daily || !isDailyDone(s, id) || s.eco.quests.daily.claimed.includes(id)) return { state: s, ok: false, message: "Задание не выполнено" };
  const reward = { ...daily.reward, money: dailyMoney(daily, s.level) };
  const next = { ...s, eco: { ...s.eco, quests: { ...s.eco.quests, daily: { ...s.eco.quests.daily, claimed: [...s.eco.quests.daily.claimed, id] } } } };
  return { state: give(next, reward), ok: true, message: `«${daily.title}»: +$${reward.money}, +${reward.xp} опыта` };
}

export const isQuests = (x: unknown): x is QuestState =>
  !!x && typeof x === "object" && !!(x as QuestState).active && Array.isArray((x as QuestState).done) && !!(x as QuestState).daily && Array.isArray((x as QuestState).daily.ids);
