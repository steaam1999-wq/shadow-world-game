import { describe, it, expect, vi, afterEach } from "vitest";
import {
  freshGame,
  choose,
  travel,
  rest,
  scenes,
  parseSave,
  localRepository,
  SAVE_KEY,
  type GameState,
} from "../src/game";
import { maxEnergy, maxHealth, levelFor, freshEconomy } from "../src/economy";
import { npcs, relationLabel, districts } from "../src/data";
const advance = (state: GameState, id: string) => {
  const required = scenes[state.stage].district;
  return choose(required ? travel(state, required) : state, id);
};
describe("Глава I", () => {
  it("проходит каждую доступную ветку с сохранением на каждом шаге", () => {
    let endings = 0;
    const walk = (s: GameState) => {
      expect(s.energy).toBeGreaterThanOrEqual(0);
      expect(s.health).toBeGreaterThanOrEqual(0);
      expect(s.energy).toBeLessThanOrEqual(maxEnergy(s));
      expect(s.health).toBeLessThanOrEqual(maxHealth(s));
      expect(parseSave(JSON.stringify(s))).toEqual(s);
      if (s.stage === "complete") {
        endings++;
        expect(s.unlocked).toHaveLength(5);
        expect(s.inventory).not.toContain("envelope");
        expect(s.inventory).toContain("card");
        expect(s.money).toBeGreaterThanOrEqual(270);
        expect(s.decisions.at(-1)?.id).toBe("finish");
        return;
      }
      for (const c of scenes[s.stage].choices) {
        const next = advance(s, c.id);
        expect(next.stage).toBe(c.next);
        walk(next);
      }
    };
    walk(freshGame());
    expect(endings).toBe(48);
  });
  it("точно начисляет награды и отношения за доставку", () => {
    let s = freshGame();
    for (const id of ["accept", "deliver", "listen", "honest", "finish"])
      s = advance(s, id);
    expect(s).toMatchObject({
      stage: "complete",
      money: 320,
      xp: 110,
      level: 2,
      reputation: 5,
    });
    // на 40 опыта — 2-й уровень: энергия восстанавливается до 102, затем переезд −5
    expect(maxEnergy(s)).toBe(102);
    expect(s.energy).toBe(97);
    expect(s.eco.points).toBe(3);
    expect(s.relations).toMatchObject({ mark: 55, tommy: 65, miller: 60 });
  });
  it("не позволяет повторно получить награду или пропустить район", () => {
    const s = choose(freshGame(), "accept");
    expect(choose(s, "deliver")).toBe(s);
    const delivered = advance(s, "deliver");
    expect(choose(delivered, "deliver")).toBe(delivered);
    expect(choose(freshGame(0), "finish")).toEqual(freshGame(0));
  });
  it("сохраняет различие безопасной ветки и отказа детективу", () => {
    let s = freshGame();
    for (const id of ["safe", "kitchen", "leave", "private", "finish"])
      s = advance(s, id);
    expect(s.money).toBe(270);
    expect(s.relations.miller).toBe(40);
    expect(s.relations.mark).toBe(57);
    expect(s.inventory).not.toContain("envelope");
  });
  it("не тратит энергию на закрытый район и повторный переход", () => {
    const s = freshGame();
    expect(travel(s, "kings")).toBe(s);
    expect(travel(s, "center")).toBe(s);
    expect(travel({ ...s, energy: 4 }, "old").district).toBe("center");
    expect(choose({ ...s, energy: 0 }, "accept").stage).toBe("arrival");
    const rested = rest({ ...s, energy: 0, health: 1 }, 1_000);
    expect(rested.energy).toBe(100);
    expect(rested.health).toBe(100);
    expect(rested.money).toBe(150);
    // повторный отдых раньше чем через 4 часа ничего не даёт
    const again = rest({ ...rested, energy: 10 }, 2_000);
    expect(again.energy).toBe(10);
    expect(rest({ ...rested, energy: 10 }, 1_000 + 4 * 3_600_000).energy).toBe(100);
  });
  it("ограничивает отношения диапазоном 0–100", () => {
    const s = freshGame();
    s.relations.mark = 99;
    expect(choose(s, "accept").relations.mark).toBe(100);
    s.stage = "miller";
    s.relations.miller = 1;
    expect(choose(s, "private").relations.miller).toBe(0);
  });
});
describe("Сохранения", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("записывает и загружает LocalStorage, удаляет сохранение", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    });
    expect(localRepository.load()).toBeNull();
    const s = choose(freshGame(), "ask");
    localRepository.save(s);
    expect(data.has(SAVE_KEY)).toBe(true);
    expect(localRepository.load()).toEqual(s);
    localRepository.clear();
    expect(localRepository.load()).toBeNull();
  });
  it("отвергает повреждённые и несовместимые данные", () => {
    for (const raw of [
      "not json",
      "null",
      "{}",
      JSON.stringify({ ...freshGame(), version: 3 }),
      JSON.stringify({ ...freshGame(), eco: { ...freshGame().eco, loadout: { ...freshGame().eco.loadout, items: [{ uid: "x", defId: "gun" }] } } }),
      JSON.stringify({ ...freshGame(), eco: { ...freshGame().eco, loadout: { ...freshGame().eco.loadout, equipment: { ...freshGame().eco.loadout.equipment, head: { uid: "y", defId: "jeans" } } } } }),
      JSON.stringify({ ...freshGame(), eco: { ...freshGame().eco, home: 99 } }),
      JSON.stringify({ ...freshGame(), xp: 500, level: 2 }),
      JSON.stringify({ ...freshGame(), energy: -1 }),
      JSON.stringify({ ...freshGame(), energy: 101 }),
      JSON.stringify({ ...freshGame(), relations: {} }),
      JSON.stringify({ ...freshGame(), stage: "toString" }),
      JSON.stringify({ ...freshGame(), inventory: ["gun"] }),
      JSON.stringify({ ...freshGame(), decisions: [null] }),
    ])
      expect(parseSave(raw)).toBeNull();
  });
  it("не скрывает ошибку недоступного хранилища", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("quota");
      },
    });
    expect(() => localRepository.load()).toThrow();
    expect(() => localRepository.save(freshGame())).toThrow();
  });
});
describe("Данные города", () => {
  it("содержат 16 уникальных полных досье и пять районов", () => {
    expect(npcs).toHaveLength(16);
    expect(new Set(npcs.map((n) => n.id)).size).toBe(16);
    expect(districts).toHaveLength(5);
    for (const n of npcs) {
      expect(n.age).toBeGreaterThan(18);
      expect(n.bio.length).toBeGreaterThan(40);
      expect(n.quests.length).toBeGreaterThan(0);
      expect(n.interactions.length).toBeGreaterThan(0);
    }
  });
  it("правильно определяет все границы отношений", () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(relationLabel)).toEqual(
      [
        "Враждебность",
        "Враждебность",
        "Недоверие",
        "Недоверие",
        "Нейтралитет",
        "Нейтралитет",
        "Дружба",
        "Дружба",
        "Полное доверие",
        "Полное доверие",
      ],
    );
  });
});

describe("Первые знакомства", () => {
  it("требует район и энергию, сохраняет первую встречу и не выдаёт бонус дважды", async () => {
    const { meet, hasMet } = await import("../src/game");
    let s = freshGame();
    expect(meet(s, "sofia")).toBe(s);
    s = { ...s, district: "west", unlocked: [...s.unlocked, "west"] };
    expect(meet({ ...s, energy: 4 }, "sofia").xp).toBe(0);
    const met = meet(s, "sofia");
    expect(hasMet(met, "sofia")).toBe(true);
    expect(met.energy).toBe(95);
    expect(met.relations.sofia).toBe(48);
    expect(met.xp).toBe(5);
    expect(meet(met, "sofia")).toBe(met);
    expect(parseSave(JSON.stringify(met))).toEqual(met);
  });
  it("учитывает знакомство по сюжету и сохраняет совместимость существующего прогресса", async () => {
    const { hasMet, meet } = await import("../src/game");
    const oldSave = choose(freshGame(), "ask");
    expect(hasMet(oldSave, "mark")).toBe(true);
    expect(meet(oldSave, "mark")).toBe(oldSave);
    expect(parseSave(JSON.stringify(oldSave))).toEqual(oldSave);
  });
});

describe("Перенос сохранений", () => {
  it("принимает сохранение 0.3 (версия 1) и добавляет экономику", () => {
    const v2 = choose(freshGame(0), "ask");
    const { eco: _eco, ...rest1 } = v2;
    const v1 = { ...rest1, version: 1, xp: 250, level: 3 };
    const migrated = parseSave(JSON.stringify(v1));
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(2);
    expect(migrated!.level).toBe(levelFor(250));
    expect(migrated!.eco.stats).toEqual(freshEconomy(0).stats);
    expect(migrated!.relations).toEqual(v2.relations);
  });
});
