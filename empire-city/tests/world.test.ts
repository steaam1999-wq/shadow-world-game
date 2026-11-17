import { describe, it, expect } from "vitest";
import { freshGame, parseSave, equipGear, unequipGear } from "../src/game";
import { starterLoadout, ensureStreetOutfit } from "../src/equipment";
import { progression } from "../src/progression";
describe("Стартовая одежда", () => {
  it("новый герой сразу одет и обут; базовые вещи не дублируются", () => {
    const s = freshGame();
    expect(s.loadout.equipment.chest?.id).toBe("gear.tee");
    expect(s.loadout.equipment.legs?.id).toBe("gear.jeans");
    expect(s.loadout.equipment.feet?.id).toBe("gear.sneakers");
    expect(s.loadout.inventory.map((i) => i.id)).toEqual([
      "gear.cap",
      "gear.gloves",
    ]);
    expect(ensureStreetOutfit(s.loadout)).toBe(s.loadout);
  });
  it("исправляет босого героя в прежнем сохранении без сброса прогресса", () => {
    const old = {
      ...freshGame(),
      money: 773,
      energy: 57,
      xp: 150,
      level: 2,
      loadout: starterLoadout(),
    };
    delete old.appearanceRevision;
    const migrated = parseSave(JSON.stringify(old))!;
    expect(migrated.money).toBe(773);
    expect(migrated.energy).toBe(57);
    expect(migrated.xp).toBe(150);
    expect(migrated.loadout.equipment.feet?.id).toBe("gear.sneakers");
    expect(migrated.appearanceRevision).toBe(1);
    expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
  });
  it("сохраняет выбор одежды и позволяет осознанно снять обувь после миграции", () => {
    const state = unequipGear(freshGame(), "feet");
    expect(parseSave(JSON.stringify(state))?.loadout.equipment.feet).toBeNull();
    const capped = equipGear(freshGame(), "gear.cap");
    const old = { ...capped };
    delete old.appearanceRevision;
    expect(parseSave(JSON.stringify(old))?.loadout.equipment.head?.id).toBe(
      "gear.cap",
    );
  });
});
describe("Ранги и достижения", () => {
  it("считает прогресс из реального состояния, не меняя его", () => {
    const s = freshGame();
    const before = JSON.stringify(s);
    const p = progression(s);
    expect(p.score).toBe(0);
    expect(p.rank.name).toBe("Новый житель");
    expect(p.outfit).toBe(3);
    expect(p.achievements).toHaveLength(8);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("учитывает реальные задания, победы и открытые районы", () => {
    const s = {
      ...freshGame(),
      xp: 300,
      level: 4,
      reputation: 20,
      arenaWins: 10,
      questProgress: { "delivery-app": "complete" as const },
    };
    const p = progression(s);
    expect(p.score).toBe(675);
    expect(p.rank.name).toBe("Деловой партнёр");
    expect(p.achievements.find((a) => a.id === "fighter")?.value).toBe(10);
  });
});

it("достижение полного комплекта сохраняется после снятия вещи", () => {
  let s = freshGame();
  s = equipGear(s, "gear.cap");
  s = equipGear(s, "gear.gloves");
  expect(
    progression(s).achievements.find((a) => a.id === "outfit")?.value,
  ).toBe(5);
  s = unequipGear(s, "feet");
  expect(
    progression(s).achievements.find((a) => a.id === "outfit")?.value,
  ).toBe(5);
  expect(s.decisions.filter((d) => d.id === "achievement:outfit")).toHaveLength(
    1,
  );
});
