/** Equipment is independent of React, quests, storage and the arena. */
export const equipmentSlots = [
  "head",
  "chest",
  "weapon",
  "legs",
  "feet",
] as const;
export type EquipmentSlot = (typeof equipmentSlots)[number];
export const slotNames: Record<EquipmentSlot, string> = {
  head: "Голова",
  chest: "Верх",
  weapon: "Перчатки / оружие",
  legs: "Брюки",
  feet: "Обувь",
};
export type GearItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  visualAssetId: string;
  minLevel: number;
  stats: { attack: number; defense: number };
};
export type Equipment = Record<EquipmentSlot, GearItem | null>;
export type Loadout = { inventory: GearItem[]; equipment: Equipment };
export const gearCatalog: Record<string, GearItem> = {
  "gear.coat": {
    id: "gear.coat",
    name: "Городское пальто",
    slot: "chest",
    visualAssetId: "coat.charcoal",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },
  "gear.tailored": {
    id: "gear.tailored",
    name: "Костюмные брюки",
    slot: "legs",
    visualAssetId: "trousers.charcoal",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },
  "gear.oxfords": {
    id: "gear.oxfords",
    name: "Кожаные туфли",
    slot: "feet",
    visualAssetId: "oxfords.black",
    minLevel: 1,
    stats: { attack: 1, defense: 1 },
  },
  "gear.fedora": {
    id: "gear.fedora",
    name: "Фетровая шляпа",
    slot: "head",
    visualAssetId: "fedora.charcoal",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },

  "gear.cap": {
    id: "gear.cap",
    name: "Чёрная бейсболка",
    slot: "head",
    visualAssetId: "cap.black",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },
  "gear.tee": {
    id: "gear.tee",
    name: "Базовая футболка",
    slot: "chest",
    visualAssetId: "tee.black",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },
  "gear.hoodie": {
    id: "gear.hoodie",
    name: "Городское худи",
    slot: "chest",
    visualAssetId: "hoodie.gray",
    minLevel: 2,
    stats: { attack: 1, defense: 4 },
  },
  "gear.jeans": {
    id: "gear.jeans",
    name: "Тёмные джинсы",
    slot: "legs",
    visualAssetId: "jeans.blue",
    minLevel: 1,
    stats: { attack: 0, defense: 1 },
  },
  "gear.cargo": {
    id: "gear.cargo",
    name: "Брюки карго",
    slot: "legs",
    visualAssetId: "cargo.olive",
    minLevel: 2,
    stats: { attack: 1, defense: 3 },
  },
  "gear.sneakers": {
    id: "gear.sneakers",
    name: "Белые кроссовки",
    slot: "feet",
    visualAssetId: "sneakers.white",
    minLevel: 1,
    stats: { attack: 1, defense: 1 },
  },
  "gear.gloves": {
    id: "gear.gloves",
    name: "Тренировочные перчатки",
    slot: "weapon",
    visualAssetId: "gloves.black",
    minLevel: 1,
    stats: { attack: 5, defense: 1 },
  },
};
export const emptyEquipment = (): Equipment => ({
  head: null,
  chest: null,
  weapon: null,
  legs: null,
  feet: null,
});
export const starterLoadout = (): Loadout => ({
  inventory: [
    "gear.cap",
    "gear.tee",
    "gear.jeans",
    "gear.sneakers",
    "gear.gloves",
  ].map((id) => gearCatalog[id]),
  equipment: emptyEquipment(),
});
/** Atomic immutable swap. Nothing changes if the item, slot or level is invalid. */
export function equipItem(
  state: Loadout,
  itemId: string,
  targetSlot?: EquipmentSlot,
  level = 1,
): Loadout {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item || item.minLevel > level || !equipmentSlots.includes(item.slot))
    return state;
  const slot = targetSlot ?? item.slot;
  if (slot !== item.slot) return state;
  const old = state.equipment[slot];
  return {
    inventory: [
      ...state.inventory.filter((i) => i.id !== itemId),
      ...(old ? [old] : []),
    ],
    equipment: { ...state.equipment, [slot]: item },
  };
}
/** Put the exact equipped instance back into the bag, then clear its layer. */
export function unequipItem(state: Loadout, slot: EquipmentSlot): Loadout {
  const item = state.equipment[slot];
  if (!item) return state;
  return {
    inventory: [...state.inventory, item],
    equipment: { ...state.equipment, [slot]: null },
  };
}
export function hasGear(state: Loadout, id: string) {
  return (
    state.inventory.some((i) => i.id === id) ||
    equipmentSlots.some((s) => state.equipment[s]?.id === id)
  );
}
export function grantGear(state: Loadout, id: string): Loadout {
  return !gearCatalog[id] || hasGear(state, id)
    ? state
    : { ...state, inventory: [...state.inventory, gearCatalog[id]] };
}
export function combatStats(state: Loadout) {
  return equipmentSlots.reduce(
    (sum, slot) => {
      const stats = state.equipment[slot]?.stats;
      return {
        attack: sum.attack + (stats?.attack ?? 0),
        defense: sum.defense + (stats?.defense ?? 0),
      };
    },
    { attack: 8, defense: 2 },
  );
}
/** Never accept unknown assets or duplicated instances from a JSON save. */
export function validLoadout(value: unknown): value is Loadout {
  if (!value || typeof value !== "object") return false;
  const s = value as Loadout;
  if (
    !Array.isArray(s.inventory) ||
    !s.equipment ||
    typeof s.equipment !== "object"
  )
    return false;
  const items: GearItem[] = [...s.inventory];
  for (const slot of equipmentSlots) {
    const item = s.equipment[slot];
    if (item !== null) {
      if (!item || item.slot !== slot) return false;
      items.push(item);
    }
  }
  if (new Set(items.map((i) => i?.id)).size !== items.length) return false;
  return items.every(
    (i) =>
      i &&
      Object.hasOwn(gearCatalog, i.id) &&
      i.name === gearCatalog[i.id].name &&
      i.slot === gearCatalog[i.id].slot &&
      i.visualAssetId === gearCatalog[i.id].visualAssetId &&
      i.minLevel === gearCatalog[i.id].minLevel &&
      i.stats?.attack === gearCatalog[i.id].stats.attack &&
      i.stats?.defense === gearCatalog[i.id].stats.defense,
  );
}

/** Apply the free street outfit once, retaining every already-equipped item. */
export function ensureStreetOutfit(state: Loadout): Loadout {
  let next = state;
  for (const id of ["gear.tee", "gear.jeans", "gear.sneakers"]) {
    const item = gearCatalog[id];
    if (next.equipment[item.slot]) continue;
    next = grantGear(next, id);
    next = equipItem(next, id, item.slot, 1);
  }
  return next;
}
export const dressedStarterLoadout = () => ensureStreetOutfit(starterLoadout());
