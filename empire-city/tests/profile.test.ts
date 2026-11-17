import { describe, it, expect } from "vitest";
import {
  defaultAppearance,
  faces,
  backdrops,
  classicOutfit,
} from "../src/appearance";
import {
  freshGame,
  parseSave,
  updateProfile,
  startFight,
  profileOutfit,
} from "../src/game";
import { validLoadout, equipItem } from "../src/equipment";
describe("Индивидуальный профиль", () => {
  it("мигрирует прежнее сохранение без потери истории, вещей и характеристик", () => {
    const game = freshGame();
    const { appearance, ...legacy } = game;
    const loaded = parseSave(JSON.stringify(legacy))!;
    expect(loaded).toEqual({ ...game, appearance: defaultAppearance() });
    const unknown = {
      ...game,
      appearance: { face: "unknown", backdrop: "office" },
    };
    expect(parseSave(JSON.stringify(unknown))).toBeNull();
    expect(parseSave(JSON.stringify({ ...game, appearance: null }))).toBeNull();
  });
  it("сохраняет каждый типаж и фон вместе с именем; внешность не меняет прогресс", () => {
    const initial = freshGame();
    for (const face of Object.keys(faces) as (keyof typeof faces)[])
      for (const backdrop of Object.keys(
        backdrops,
      ) as (keyof typeof backdrops)[]) {
        const next = updateProfile(initial, "  Имя игрока  ", {
          face,
          backdrop,
        });
        expect(next.name).toBe("Имя игрока");
        expect(next.appearance).toEqual({ face, backdrop });
        expect(next.loadout).toBe(initial.loadout);
        expect(next.decisions).toBe(initial.decisions);
        expect(next.relations).toBe(initial.relations);
        expect(parseSave(JSON.stringify(next))).toEqual(next);
      }
    expect(updateProfile(initial, " ", defaultAppearance())).toBe(initial);
    expect(updateProfile(initial, "x".repeat(41), defaultAppearance())).toBe(
      initial,
    );
  });
  it("переодевает атомарно, сохраняет старую одежду и перчатки, не дублирует подарок", () => {
    const game = freshGame();
    game.loadout = equipItem(game.loadout, "gear.gloves");
    const preview = profileOutfit(game.loadout, true);
    expect(game.loadout.equipment.chest?.id).toBe("gear.tee");
    const dressed = updateProfile(
      game,
      "Игрок",
      { face: "veteran", backdrop: "office" },
      true,
    );
    expect(dressed.loadout).toEqual(preview);
    expect(dressed.loadout.equipment.weapon?.id).toBe("gear.gloves");
    for (const id of ["gear.tee", "gear.jeans", "gear.sneakers", "gear.cap"])
      expect(dressed.loadout.inventory.some((i) => i.id === id)).toBe(true);
    for (const id of classicOutfit)
      expect(
        Object.values(dressed.loadout.equipment).some((i) => i?.id === id),
      ).toBe(true);
    const again = updateProfile(dressed, "Игрок", dressed.appearance, true);
    expect(again.loadout).toEqual(dressed.loadout);
    expect(validLoadout(again.loadout)).toBe(true);
    expect(parseSave(JSON.stringify(dressed))).toEqual(dressed);
  });
  it("не даёт обойти запрет переодевания через редактор во время боя", () => {
    const active = startFight(freshGame(), "rookie");
    expect(updateProfile(active, "Другой", defaultAppearance(), true)).toBe(
      active,
    );
  });
});
