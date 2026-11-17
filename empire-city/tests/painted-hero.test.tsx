// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar } from "../src/Avatar";
import {
  freshGame,
  newGame,
  parseSave,
  upgradeHeroAppearance,
  startFight,
  arenaAction,
} from "../src/game";
import {
  unequipItem,
  equipItem,
  validLoadout,
  gearCatalog,
} from "../src/equipment";
const dom = (game: ReturnType<typeof freshGame>) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <Avatar equipment={game.loadout.equipment} appearance={game.appearance} />,
  );
  return host;
};
describe("Цельный главный герой", () => {
  it("начинает игру с цельной рисованной фигурой, а снятие и повторное надевание переключают реальную экипировку", () => {
    const game = newGame();
    expect(game.appearance).toEqual({ face: "veteran", backdrop: "office" });
    expect(
      dom(game).querySelector(".painted-master")?.getAttribute("src"),
    ).toContain("classic-master.webp");
    for (const slot of ["head", "chest", "legs", "feet"] as const) {
      const loadout = unequipItem(game.loadout, slot);
      const changed = { ...game, loadout };
      expect(dom(changed).querySelector(".painted-master")).toBeNull();
      expect(dom(changed).querySelector(".painted-avatar")).not.toBeNull();
      expect(dom(changed).querySelector(`[data-slot="${slot}"]`)).toBeNull();
      const item = game.loadout.equipment[slot]!;
      const restored = { ...game, loadout: equipItem(loadout, item.id) };
      expect(dom(restored).querySelector(".painted-master")).not.toBeNull();
      expect(parseSave(JSON.stringify(changed))).toEqual(changed);
    }
    const gloves = { ...game, loadout: equipItem(game.loadout, "gear.gloves") };
    expect(dom(gloves).querySelector(".painted-master")).toBeNull();
    expect(
      dom(gloves).querySelector('[data-visual-asset="gloves.black"] image'),
    ).not.toBeNull();
  });
  it("обновляет старый стандартный профиль один раз, сохраняя деньги, историю, отношения и все вещи", () => {
    const old = {
      ...freshGame(),
      portraitRevision: undefined,
      money: 825,
      decisions: [{ id: "ask", text: "Узнать подробности" }],
    };
    old.loadout = equipItem(old.loadout, "gear.gloves");
    const upgraded = parseSave(JSON.stringify(old))!;
    expect(dom(upgraded).querySelector(".painted-master")).not.toBeNull();
    expect(upgraded).toMatchObject({
      money: 825,
      portraitRevision: 1,
      health: old.health,
      xp: old.xp,
      stage: old.stage,
      decisions: old.decisions,
      relations: old.relations,
    });
    for (const item of [
      ...old.loadout.inventory,
      ...Object.values(old.loadout.equipment).filter(Boolean),
    ])
      expect(
        [
          ...upgraded.loadout.inventory,
          ...Object.values(upgraded.loadout.equipment),
        ].some((i) => i?.id === item!.id),
      ).toBe(true);
    expect(validLoadout(upgraded.loadout)).toBe(true);
    const removed = {
      ...upgraded,
      loadout: unequipItem(upgraded.loadout, "chest"),
    };
    expect(parseSave(JSON.stringify(removed))).toEqual(removed);
  });
  it("сохраняет выбранный другой типаж и откладывает замену одежды до завершения боя", () => {
    const other = {
      ...freshGame(),
      portraitRevision: undefined,
      appearance: { face: "strategist" as const, backdrop: "city" as const },
    };
    expect(upgradeHeroAppearance(other)).toEqual({
      ...other,
      portraitRevision: 1,
    });
    const active = {
      ...startFight(freshGame(), "rookie"),
      portraitRevision: undefined,
    };
    expect(upgradeHeroAppearance(active)).toBe(active);
    expect(parseSave(JSON.stringify(active))?.loadout).toEqual(active.loadout);
    const ended = arenaAction(active, "forfeit");
    const upgraded = upgradeHeroAppearance(ended);
    expect(upgraded.arena).toEqual(ended.arena);
    expect(upgraded.money).toBe(ended.money);
    expect(upgraded.health).toBe(ended.health);
    expect(dom(upgraded).querySelector(".painted-master")).not.toBeNull();
  });
});

it("смешивает все 288 наборов рисованной экипировки; размеры слоёв сохраняют пропорции", () => {
  let total = 0;
  for (const chest of [
    null,
    gearCatalog["gear.tee"],
    gearCatalog["gear.hoodie"],
    gearCatalog["gear.coat"],
  ])
    for (const legs of [
      null,
      gearCatalog["gear.jeans"],
      gearCatalog["gear.cargo"],
      gearCatalog["gear.tailored"],
    ])
      for (const feet of [
        null,
        gearCatalog["gear.sneakers"],
        gearCatalog["gear.oxfords"],
      ])
        for (const head of [
          null,
          gearCatalog["gear.cap"],
          gearCatalog["gear.fedora"],
        ])
          for (const weapon of [null, gearCatalog["gear.gloves"]]) {
            const game = {
              ...newGame(),
              loadout: {
                inventory: [],
                equipment: { chest, legs, feet, head, weapon },
              },
            };
            const host = dom(game);
            if (host.querySelector(".painted-master"))
              expect(game.loadout.equipment.weapon).toBeNull();
            else {
              expect(
                host.querySelector(".painted-avatar")?.getAttribute("viewBox"),
              ).toBe("0 0 256 512");
              for (const [slot, item] of Object.entries(game.loadout.equipment))
                expect(
                  host.querySelectorAll(`[data-slot="${slot}"]`),
                ).toHaveLength(item ? 1 : 0);
              for (const image of host.querySelectorAll("image")) {
                const w = Number(image.getAttribute("width")),
                  h = Number(image.getAttribute("height"));
                expect(w / h).toBeCloseTo(0.5, 10);
                expect(image.getAttribute("preserveAspectRatio")).toBe(
                  "xMidYMid meet",
                );
              }
            }
            total++;
          }
  expect(total).toBe(288);
});
