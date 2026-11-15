import { npcs, type DistrictId } from "./data";
export type Stage =
  | "arrival"
  | "questions"
  | "delivery"
  | "safe"
  | "tommy"
  | "miller"
  | "end"
  | "complete";
export type ItemId = "phone" | "ticket" | "envelope" | "card";
export type GameState = {
  version: 1;
  money: number;
  energy: number;
  health: number;
  reputation: number;
  xp: number;
  level: number;
  district: DistrictId;
  chapter: number;
  stage: Stage;
  relations: Record<string, number>;
  inventory: ItemId[];
  decisions: { id: string; text: string }[];
  unlocked: DistrictId[];
  name: string;
};
export const freshGame = (): GameState => ({
  version: 1,
  money: 150,
  energy: 100,
  health: 100,
  reputation: 0,
  xp: 0,
  level: 1,
  district: "center",
  chapter: 1,
  stage: "arrival",
  relations: Object.fromEntries(npcs.map((n) => [n.id, n.relation])),
  inventory: ["phone", "ticket"],
  decisions: [],
  unlocked: ["center", "old"],
  name: "Новый житель",
});
export type Effect = {
  money?: number;
  energy?: number;
  health?: number;
  reputation?: number;
  xp?: number;
  relations?: Record<string, number>;
  add?: ItemId;
  remove?: ItemId;
  unlock?: DistrictId[];
};
export type Choice = {
  id: string;
  label: string;
  hint: string;
  next: Stage;
  effect: Effect;
};
export type Scene = {
  speaker: string;
  title: string;
  text: string;
  district?: DistrictId;
  choices: Choice[];
};
export const scenes: Record<Stage, Scene> = {
  arrival: {
    speaker: "mark",
    title: "У каждого города есть своя цена",
    text: "«Первый день? Узнаю этот взгляд. Я Марк. Есть простое дело: отнеси запечатанный конверт Томми в Старый город. Он ждёт. А если не хочешь чужих секретов — ему нужен помощник за стойкой. Решай сам».",
    choices: [
      {
        id: "accept",
        label: "Взять конверт",
        hint: "+$120 за доставку · Марк +10 · −15 энергии",
        next: "delivery",
        effect: { energy: -15, relations: { mark: 10 }, add: "envelope" },
      },
      {
        id: "ask",
        label: "Что внутри конверта?",
        hint: "Узнать подробности · Марк +3",
        next: "questions",
        effect: { relations: { mark: 3 } },
      },
      {
        id: "safe",
        label: "Выбрать работу в баре",
        hint: "+$70 за смену · без чужих секретов",
        next: "safe",
        effect: { relations: { mark: 2 } },
      },
    ],
  },
  questions: {
    speaker: "mark",
    title: "Правильные вопросы",
    text: "«Квитанции за аренду и одно личное письмо. Ничего запрещённого. Но город любит превращать обычную бумагу в повод для слухов. Доставка — сто двадцать. Честная смена в баре — семьдесят».",
    choices: [
      {
        id: "accept-informed",
        label: "Хорошо. Доставлю письмо",
        hint: "Марк +7 · −15 энергии",
        next: "delivery",
        effect: { energy: -15, relations: { mark: 7 }, add: "envelope" },
      },
      {
        id: "safe-informed",
        label: "Лучше поработаю за стойкой",
        hint: "Марк +2 · безопасная подработка",
        next: "safe",
        effect: { relations: { mark: 2 } },
      },
    ],
  },
  delivery: {
    speaker: "tommy",
    title: "Письмо для «Тихой гавани»",
    district: "old",
    text: "Томми вытирает стакан, не сводя с тебя глаз. «От Рида? Хорошо. Здесь ценят людей, которые выполняют обещания. Конверт цел?»",
    choices: [
      {
        id: "deliver",
        label: "Передать запечатанный конверт",
        hint: "+$120 · +25 опыта · Томми +12 · репутация +3",
        next: "tommy",
        effect: {
          money: 120,
          xp: 25,
          reputation: 3,
          relations: { tommy: 12 },
          remove: "envelope",
        },
      },
      {
        id: "inspect",
        label: "Сначала спросить о содержимом",
        hint: "+$120 · +20 опыта · Томми +4 · Марк −3",
        next: "tommy",
        effect: {
          money: 120,
          xp: 20,
          reputation: 1,
          relations: { tommy: 4, mark: -3 },
          remove: "envelope",
        },
      },
    ],
  },
  safe: {
    speaker: "tommy",
    title: "Честная смена",
    district: "old",
    text: "«Марк предупредил. На кухне завал, а вечером придут завсегдатаи. Можно помочь на кухне или встретить гостей. Семьдесят за смену. Работа обычная, люди — не всегда».",
    choices: [
      {
        id: "kitchen",
        label: "Помочь на кухне",
        hint: "+$70 · −20 энергии · +25 опыта · Томми +10",
        next: "tommy",
        effect: {
          money: 70,
          energy: -20,
          xp: 25,
          relations: { tommy: 10 },
          reputation: 2,
        },
      },
      {
        id: "guests",
        label: "Встретить гостей",
        hint: "+$70 · −15 энергии · +20 опыта · Томми +8",
        next: "tommy",
        effect: {
          money: 70,
          energy: -15,
          xp: 20,
          relations: { tommy: 8 },
          reputation: 3,
        },
      },
    ],
  },
  tommy: {
    speaker: "tommy",
    title: "Здесь можно стать своим",
    district: "old",
    text: "«С первой работой справился. Держи мой номер. И совет: семьи не владеют всем городом, хоть и любят так думать». Томми ставит перед тобой чай. «Хочешь послушать или уже спешишь?»",
    choices: [
      {
        id: "listen",
        label: "Остаться и выслушать",
        hint: "Томми +8 · +10 энергии · +15 опыта",
        next: "miller",
        effect: { energy: 10, xp: 15, relations: { tommy: 8 }, add: "card" },
      },
      {
        id: "leave",
        label: "Поблагодарить и выйти",
        hint: "Томми +3 · +10 опыта",
        next: "miller",
        effect: { xp: 10, relations: { tommy: 3 }, add: "card" },
      },
    ],
  },
  miller: {
    speaker: "miller",
    title: "Просто несколько вопросов",
    district: "center",
    text: "У выхода из бара тебя останавливает человек в сером пальто. «Детектив Миллер. Новое лицо? Я расследую исчезновение архивных документов. Видели сегодня что-нибудь необычное? Вы не задержаны».",
    choices: [
      {
        id: "honest",
        label: "Рассказать о встрече с Марком",
        hint: "Миллер +15 · Марк −5 · репутация +2 · +20 опыта",
        next: "end",
        effect: { relations: { miller: 15, mark: -5 }, reputation: 2, xp: 20 },
      },
      {
        id: "private",
        label: "Вежливо отказаться от разговора",
        hint: "Миллер −5 · Марк +5 · +15 опыта",
        next: "end",
        effect: { relations: { miller: -5, mark: 5 }, xp: 15 },
      },
      {
        id: "clarify",
        label: "Спросить, как можно помочь законно",
        hint: "Миллер +8 · репутация +4 · +20 опыта",
        next: "end",
        effect: { relations: { miller: 8 }, reputation: 4, xp: 20 },
      },
    ],
  },
  end: {
    speaker: "mark",
    title: "Город запомнил тебя",
    text: "На телефоне сообщение от Марка: «Первый день позади. Завтра поговорим о настоящей работе». Теперь у тебя есть знакомые, первые заработанные деньги и решения, которые ещё напомнят о себе. Empire City начинает узнавать твоё имя.",
    choices: [
      {
        id: "finish",
        label: "Завершить первую главу",
        hint: "+$50 · +50 опыта · открыты Кингс, промзона и Вест-сайд",
        next: "complete",
        effect: { money: 50, xp: 50, unlock: ["kings", "industrial", "west"] },
      },
    ],
  },
  complete: {
    speaker: "mark",
    title: "Начало твоей истории",
    text: "Глава I завершена. Твои решения сохранены. Впереди — «Первые связи», знакомство с семьями и цена первого обещания. Продолжение кампании появится в следующем обновлении.",
    choices: [],
  },
};
const clamp = (x: number) => Math.max(0, Math.min(100, x));
export function choose(s: GameState, id: string): GameState {
  const scene = scenes[s.stage];
  const c = scene.choices.find((c) => c.id === id);
  if (
    !c ||
    (scene.district && scene.district !== s.district) ||
    s.energy + (c.effect.energy ?? 0) < 0 ||
    s.money + (c.effect.money ?? 0) < 0
  )
    return s;
  const e = c.effect;
  const xp = s.xp + (e.xp ?? 0);
  return {
    ...s,
    money: s.money + (e.money ?? 0),
    energy: clamp(s.energy + (e.energy ?? 0)),
    health: clamp(s.health + (e.health ?? 0)),
    reputation: Math.max(0, s.reputation + (e.reputation ?? 0)),
    xp,
    level: 1 + Math.floor(xp / 100),
    stage: c.next,
    relations: Object.fromEntries(
      Object.entries(s.relations).map(([id, v]) => [
        id,
        clamp(v + (e.relations?.[id] ?? 0)),
      ]),
    ),
    inventory: [
      ...s.inventory.filter((x) => x !== e.remove),
      ...(e.add && !s.inventory.includes(e.add) ? [e.add] : []),
    ],
    unlocked: [...new Set([...s.unlocked, ...(e.unlock ?? [])])],
    decisions: [...s.decisions, { id: c.id, text: c.label }],
  };
}
export function travel(s: GameState, district: DistrictId): GameState {
  return s.district !== district &&
    s.unlocked.includes(district) &&
    s.energy >= 5
    ? { ...s, district, energy: s.energy - 5 }
    : s;
}
export function rest(s: GameState): GameState {
  return { ...s, energy: 100, health: 100 };
}
export const SAVE_KEY = "empire-city:save";
export interface SaveRepository {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}
export function parseSave(raw: string): GameState | null {
  try {
    const s = JSON.parse(raw);
    const base = freshGame();
    if (
      s.version !== 1 ||
      !Object.hasOwn(scenes, s.stage) ||
      s.chapter !== 1 ||
      typeof s.name !== "string" ||
      s.name.length > 40
    )
      return null;
    for (const k of ["money", "energy", "health", "reputation", "xp", "level"])
      if (typeof s[k] !== "number" || !Number.isFinite(s[k]) || s[k] < 0)
        return null;
    if (
      s.energy > 100 ||
      s.health > 100 ||
      s.level !== 1 + Math.floor(s.xp / 100)
    )
      return null;
    const ids = ["center", "old", "kings", "industrial", "west"];
    if (
      !ids.includes(s.district) ||
      !Array.isArray(s.unlocked) ||
      !s.unlocked.every((x: unknown) => ids.includes(x as string)) ||
      !s.unlocked.includes(s.district)
    )
      return null;
    if (
      !Array.isArray(s.inventory) ||
      !s.inventory.every((x: unknown) =>
        ["phone", "ticket", "envelope", "card"].includes(x as string),
      )
    )
      return null;
    if (
      !Array.isArray(s.decisions) ||
      !s.decisions.every(
        (x: { id: unknown; text: unknown }) =>
          x && typeof x.id === "string" && typeof x.text === "string",
      )
    )
      return null;
    if (
      !s.relations ||
      !Object.keys(base.relations).every(
        (id) =>
          typeof s.relations[id] === "number" &&
          Number.isFinite(s.relations[id]) &&
          s.relations[id] >= 0 &&
          s.relations[id] <= 100,
      )
    )
      return null;
    return s as GameState;
  } catch {
    return null;
  }
}
export const localRepository: SaveRepository = {
  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = parseSave(raw);
    if (!s) throw new Error("Несовместимое или повреждённое сохранение");
    return s;
  },
  save: (s) => localStorage.setItem(SAVE_KEY, JSON.stringify(s)),
  clear: () => localStorage.removeItem(SAVE_KEY),
};

export function hasMet(s: GameState, id: string): boolean {
  const storyIds: Record<string, string[]> = {
    mark: ["accept", "ask", "safe"],
    tommy: ["deliver", "inspect", "kitchen", "guests"],
    miller: ["honest", "private", "clarify"],
  };
  return s.decisions.some(
    (d) => d.id === `meet:${id}` || storyIds[id]?.includes(d.id),
  );
}
/** First meetings are single-use and require physically visiting the NPC's district. */
export function meet(s: GameState, id: string): GameState {
  const npc = npcs.find((n) => n.id === id);
  if (!npc || hasMet(s, id) || npc.district !== s.district || s.energy < 5)
    return s;
  const xp = s.xp + 5;
  return {
    ...s,
    xp,
    level: 1 + Math.floor(xp / 100),
    energy: s.energy - 5,
    relations: { ...s.relations, [id]: clamp(s.relations[id] + 3) },
    decisions: [
      ...s.decisions,
      { id: `meet:${id}`, text: `Знакомство: ${npc.name}` },
    ],
  };
}
