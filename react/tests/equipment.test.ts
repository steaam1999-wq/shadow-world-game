import { describe, it, expect } from "vitest";
import {
  addItem, equipItem, unequipItem, emptyEquipment, starterLoadout, equipmentStats, onEquipmentChange, bestFor, isLoadout, ITEMS, SLOT_IDS,
  type Loadout, type EquipChange,
} from "../src/equipment";
import { equipmentLayers } from "../src/avatar/Avatar";
import { ASSETS } from "../src/avatar/assets";

const empty = (): Loadout => ({ items: [], equipment: emptyEquipment(), nextUid: 1 });
const withItems = (...ids: string[]) => ids.reduce(addItem, empty());

describe("Уровень 1: данные", () => {
  it("у каждого предмета есть слот и визуальный ассет из реестра", () => {
    for (const it of ITEMS) {
      expect(SLOT_IDS).toContain(it.slot);
      expect(ASSETS[it.visualAssetId], it.visualAssetId).toBeDefined();
    }
    expect(Object.keys(emptyEquipment())).toEqual([...SLOT_IDS]);
  });
  it("одинаковые вещи получают разные uid", () => {
    const l = withItems("cap", "cap");
    expect(l.items[0].uid).not.toBe(l.items[1].uid);
  });
});

describe("Уровень 2: equipItem / unequipItem", () => {
  it("a, d: находит вещь в сумке, убирает её оттуда и кладёт в слот", () => {
    const l = withItems("hoodie");
    const r = equipItem(l, l.items[0].uid);
    expect(r.ok).toBe(true);
    expect(r.loadout.equipment.chest?.defId).toBe("hoodie");
    expect(r.loadout.items).toHaveLength(0);
    expect(l.items).toHaveLength(1); // исходный объект не изменился
  });
  it("b: проверяет слот и уровень", () => {
    const l = withItems("carbine", "cap");
    expect(equipItem(l, l.items[0].uid, { level: 5 }).ok).toBe(false);
    expect(equipItem(l, l.items[1].uid, { slot: "chest" }).ok).toBe(false);
    expect(equipItem(l, "нет-такого").ok).toBe(false);
  });
  it("c: старая вещь из слота возвращается в сумку", () => {
    let l = withItems("hoodie", "tracktop");
    l = equipItem(l, l.items[0].uid).loadout;
    const r = equipItem(l, l.items.find((i) => i.defId === "tracktop")!.uid);
    expect(r.loadout.equipment.chest?.defId).toBe("tracktop");
    expect(r.loadout.items.map((i) => i.defId)).toEqual(["hoodie"]);
    expect(r.change).toMatchObject({ slot: "chest" });
    expect(r.change!.before?.defId).toBe("hoodie");
  });
  it("e: рассылает событие equipment:changed при надевании и снятии", () => {
    const seen: EquipChange[] = [];
    const off = onEquipmentChange((c) => seen.push(c));
    let l = withItems("cap");
    l = equipItem(l, l.items[0].uid).loadout;
    l = unequipItem(l, "head").loadout;
    off();
    expect(seen.map((c) => [c.slot, c.after?.defId ?? null])).toEqual([["head", "cap"], ["head", null]]);
  });
  it("снятие возвращает вещь в сумку и очищает слот", () => {
    let l = withItems("cap");
    l = equipItem(l, l.items[0].uid).loadout;
    const r = unequipItem(l, "head");
    expect(r.loadout.equipment.head).toBeNull();
    expect(r.loadout.items.map((i) => i.defId)).toEqual(["cap"]);
    expect(unequipItem(r.loadout, "head").ok).toBe(false);
  });
  it("бонусы считаются со всех слотов; лучшая вещь выбирается по уровню", () => {
    let l = withItems("bat", "plate", "shades");
    for (const i of [...l.items]) l = equipItem(l, i.uid).loadout;
    expect(equipmentStats(l.equipment)).toMatchObject({ atk: 8, def: 28, agi: 2, auth: 3 });
    const b = withItems("bat", "knuckles", "carbine");
    expect(bestFor(b, "weapon", 5)!.defId).toBe("bat");
  });
  it("проверка сохранения отличает корректное снаряжение", () => {
    expect(isLoadout(starterLoadout())).toBe(true);
    const bad = starterLoadout();
    expect(isLoadout({ ...bad, equipment: { ...bad.equipment, head: bad.equipment.chest } })).toBe(false);
  });
});

describe("Уровень 3: слои аватара", () => {
  it("каждый надетый слот — слой; пустой слот — нет слоя; порядок по z", () => {
    let l = withItems("plate", "hoodie", "cap", "bat");
    for (const i of [...l.items]) l = equipItem(l, i.uid).loadout;
    const layers = equipmentLayers(l.equipment);
    expect(layers.map((x) => x.slot)).toEqual(["chest", "outer", "weapon", "head"]);
    const after = equipmentLayers(unequipItem(l, "outer").loadout.equipment);
    expect(after.map((x) => x.slot)).toEqual(["chest", "weapon", "head"]);
  });
});
