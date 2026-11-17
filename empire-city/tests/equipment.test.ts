import { describe, it, expect } from "vitest";
import {
  starterLoadout,
  equipItem,
  unequipItem,
  gearCatalog,
  combatStats,
  validLoadout,
} from "../src/equipment";
import {
  freshGame,
  parseSave,
  equipGear,
  startFight,
  arenaAction,
  rest,
  travel,
  acceptJob,
  resolveJob,
  choose,
  meet,
} from "../src/game";
import { jobs, opponents } from "../src/activities";
describe("Экипировка", () => {
  it("переносит предмет из сумки в правильный слот без мутации", () => {
    const s = starterLoadout();
    const next = equipItem(s, "gear.tee");
    expect(next.equipment.chest?.id).toBe("gear.tee");
    expect(next.inventory.some((i) => i.id === "gear.tee")).toBe(false);
    expect(s.equipment.chest).toBeNull();
    expect(s.inventory).toHaveLength(5);
    expect(equipItem(next, "gear.tee")).toBe(next);
  });
  it("возвращает заменяемый предмет и сохраняет уникальность всех экземпляров", () => {
    let s = starterLoadout();
    s = { ...s, inventory: [...s.inventory, gearCatalog["gear.hoodie"]] };
    s = equipItem(s, "gear.tee");
    const next = equipItem(s, "gear.hoodie", "chest", 2);
    expect(next.equipment.chest?.id).toBe("gear.hoodie");
    expect(next.inventory.filter((i) => i.id === "gear.tee")).toHaveLength(1);
    expect(validLoadout(next)).toBe(true);
    const cleared = unequipItem(next, "chest");
    expect(cleared.equipment.chest).toBeNull();
    expect(
      cleared.inventory.filter((i) => i.id === "gear.hoodie"),
    ).toHaveLength(1);
    expect(unequipItem(cleared, "chest")).toBe(cleared);
  });
  it("не меняет состояние при неправильном слоте, уровне или неизвестном ID", () => {
    const s = starterLoadout();
    expect(equipItem(s, "gear.cap", "chest")).toBe(s);
    expect(equipItem(s, "missing")).toBe(s);
    const withHoodie = {
      ...s,
      inventory: [...s.inventory, gearCatalog["gear.hoodie"]],
    };
    expect(equipItem(withHoodie, "gear.hoodie")).toBe(withHoodie);
  });
  it("использует характеристики именно надетых вещей", () => {
    const bag = starterLoadout();
    expect(combatStats(bag)).toEqual({ attack: 8, defense: 2 });
    expect(combatStats(equipItem(bag, "gear.gloves"))).toEqual({
      attack: 13,
      defense: 3,
    });
  });
  it("отклоняет дубликаты, подмену ассета и чужой слот в сохранении", () => {
    const s = starterLoadout();
    expect(
      validLoadout({ ...s, inventory: [...s.inventory, s.inventory[0]] }),
    ).toBe(false);
    expect(
      validLoadout({
        ...s,
        inventory: [
          { ...s.inventory[0], visualAssetId: "https://bad.test/asset" },
        ],
      }),
    ).toBe(false);
    expect(
      validLoadout({
        ...s,
        equipment: { ...s.equipment, chest: gearCatalog["gear.cap"] },
      }),
    ).toBe(false);
  });
  it("мигрирует старое сохранение, сохраняя деньги, решения и отношения", () => {
    const state = freshGame();
    const { loadout, questProgress, arena, arenaWins, ...legacy } = state;
    const old = {
      ...legacy,
      version: 1,
      money: 489,
      decisions: [{ id: "ask", text: "Вопрос Марку" }],
    };
    const loaded = parseSave(JSON.stringify(old))!;
    expect(loaded.version).toBe(2);
    expect(loaded.money).toBe(489);
    expect(loaded.decisions).toEqual(old.decisions);
    expect(loaded.relations).toEqual(state.relations);
    expect(loaded.loadout.inventory).toHaveLength(2);
    expect(
      parseSave(JSON.stringify(equipGear(loaded, "gear.cap")))?.loadout
        .equipment.head?.id,
    ).toBe("gear.cap");
  });
});
describe("Поручения города", () => {
  it("проходит оба решения каждого из 10 заданий и не начисляет повторную награду", () => {
    expect(jobs).toHaveLength(10);
    for (const q of jobs)
      for (const choice of q.choices) {
        let s: ReturnType<typeof freshGame> = {
          ...freshGame(),
          district: q.district,
          level: 3,
          xp: 200,
          unlocked: [
            "center",
            "old",
            "kings",
            "industrial",
            "west",
          ] as ReturnType<typeof freshGame>["unlocked"],
          questProgress: q.requires
            ? { [q.requires]: "complete" as const }
            : {},
        };
        s = acceptJob(s, q.id);
        expect(s.questProgress[q.id]).toBe("active");
        const next = resolveJob(s, q.id, choice.id);
        expect(next.questProgress[q.id]).toBe("complete");
        expect(next.money).toBe(s.money + choice.money);
        expect(next.energy).toBe(s.energy - choice.energy);
        expect(resolveJob(next, q.id, choice.id)).toBe(next);
        expect(parseSave(JSON.stringify(next))).toEqual(next);
      }
  });
  it("проверяет район, предыдущее задание и энергию", () => {
    const s = freshGame();
    expect(acceptJob(s, "bar-audit")).toBe(s);
    expect(acceptJob(s, "financial-trace")).toBe(s);
    const active = acceptJob(s, "delivery-app");
    const tired = { ...active, energy: 0 };
    expect(resolveJob(tired, "delivery-app", "metro")).toBe(tired);
  });
});
describe("Одиночная арена", () => {
  it("все три противника побеждаются; награды выдаются один раз на бой", () => {
    for (const o of opponents) {
      let s = { ...freshGame(), level: 3, xp: 200 };
      for (const item of s.loadout.inventory) s = equipGear(s, item.id);
      s = startFight(s, o.id);
      expect(s.energy).toBe(90);
      let turns = 0;
      while (s.arena && !s.arena.finished && turns++ < 30)
        s = arenaAction(s, "attack");
      expect(s.arena?.result).toBe("won");
      expect(s.money).toBe(150 + o.money);
      expect(s.arenaWins).toBe(1);
      expect(arenaAction(s, "attack")).toBe(s);
      expect(parseSave(JSON.stringify(s))).toEqual(s);
    }
  });
  it("сохраняет незаконченный бой и блокирует обход через отдых, одежду и задания", () => {
    const s = arenaAction(startFight(freshGame(), "rookie"), "attack");
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(rest(s)).toBe(s);
    expect(travel(s, "old")).toBe(s);
    expect(equipGear(s, "gear.gloves")).toBe(s);
    expect(acceptJob(s, "delivery-app")).toBe(s);
    expect(choose(s, "ask")).toBe(s);
    expect(meet(s, "emma")).toBe(s);
    const ended = arenaAction(s, "forfeit");
    expect(ended.arena?.result).toBe("lost");
    expect(rest(ended).health).toBe(100);
  });
  it("не допускает отрицательного здоровья или энергии при поражении и восстановлении", () => {
    const active = startFight(freshGame(), "rookie");
    const s = arenaAction({ ...active, health: 1 }, "attack");
    expect(s.health).toBe(0);
    expect(s.arena?.result).toBe("lost");
    expect(s.money).toBe(150);
    const exhausted = { ...active, energy: 4 };
    expect(arenaAction(exhausted, "recover")).toBe(exhausted);
    expect(
      startFight({ ...freshGame(), energy: 9 }, "rookie").arena,
    ).toBeNull();
  });
});
