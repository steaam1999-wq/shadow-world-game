/**
 * Система экипировки (Equipment System).
 *
 * Уровень 1 — данные: каталог предметов (ItemDef), экземпляры в инвентаре (ItemInstance),
 *   объект экипированных слотов (Equipment = { head: null, chest: …, weapon: … }).
 * Уровень 2 — логика: чистые функции equipItem / unequipItem. Они не меняют входные объекты,
 *   а возвращают новое состояние Loadout — поэтому любое изменение автоматически
 *   вызывает перерисовку в React (новая ссылка → новый рендер <Avatar>).
 * Уровень 3 — визуал живёт в src/avatar/: каждый ItemDef ссылается на visualAssetId,
 *   по которому рендерер находит слой (SVG-группу или спрайт) и рисует его поверх тела.
 */

// ---------------- уровень 1: данные ----------------

/** Слоты экипировки. Порядок здесь — порядок в интерфейсе, не порядок отрисовки. */
export const SLOT_IDS = ["head", "face", "neck", "chest", "outer", "legs", "feet", "weapon"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export const SLOT_NAMES: Record<SlotId, string> = {
  head: "Голова", face: "Лицо", neck: "Шея", chest: "Торс", outer: "Верхняя одежда", legs: "Ноги", feet: "Обувь", weapon: "Оружие",
};

export type Rarity = "common" | "rare" | "epic";
export const RARITY_NAMES: Record<Rarity, string> = { common: "Обычный", rare: "Редкий", epic: "Эпический" };

export type ItemStats = { atk?: number; def?: number; agi?: number; int?: number; auth?: number };

/** Описание предмета в каталоге (одно на тип предмета). */
export type ItemDef = {
  id: string;
  name: string;
  slot: SlotId;
  /** ссылка на визуальный слой: SVG-компонент или спрайт в реестре src/avatar/assets.tsx */
  visualAssetId: string;
  rarity: Rarity;
  lvl: number;
  price: number;
  stats: ItemStats;
};

/** Конкретная вещь у игрока. uid отличает два одинаковых предмета. */
export type ItemInstance = { uid: string; defId: string };

/** Экипированные слоты: в каждом либо вещь, либо null. */
export type Equipment = Record<SlotId, ItemInstance | null>;

/** Всё, что связано с вещами персонажа: сумка + надетое. */
export type Loadout = { items: ItemInstance[]; equipment: Equipment; nextUid: number };

export const emptyEquipment = (): Equipment => ({ head: null, face: null, neck: null, chest: null, outer: null, legs: null, feet: null, weapon: null });

/** Каталог: современная одежда и снаряжение. */
export const ITEMS: ItemDef[] = [
  // оружие
  { id: "knuckles", name: "Кастет", slot: "weapon", visualAssetId: "weapon_knuckles", rarity: "common", lvl: 1, price: 300, stats: { atk: 4 } },
  { id: "bat", name: "Бейсбольная бита", slot: "weapon", visualAssetId: "weapon_bat", rarity: "common", lvl: 3, price: 900, stats: { atk: 8 } },
  { id: "knife", name: "Тактический нож", slot: "weapon", visualAssetId: "weapon_knife", rarity: "common", lvl: 5, price: 2500, stats: { atk: 13, agi: 2 } },
  { id: "traumatic", name: "Травматический пистолет", slot: "weapon", visualAssetId: "weapon_pistol", rarity: "common", lvl: 9, price: 7000, stats: { atk: 23 } },
  { id: "pistol", name: "Пистолет с глушителем", slot: "weapon", visualAssetId: "weapon_silencer", rarity: "rare", lvl: 14, price: 18000, stats: { atk: 36, agi: 3 } },
  { id: "smg", name: "Пистолет-пулемёт", slot: "weapon", visualAssetId: "weapon_smg", rarity: "rare", lvl: 20, price: 50000, stats: { atk: 56 } },
  { id: "carbine", name: "Карабин", slot: "weapon", visualAssetId: "weapon_carbine", rarity: "epic", lvl: 28, price: 140000, stats: { atk: 86, agi: 4 } },
  // голова
  { id: "cap", name: "Бейсболка", slot: "head", visualAssetId: "head_cap", rarity: "common", lvl: 1, price: 200, stats: { agi: 1 } },
  { id: "beanie", name: "Шапка-бини", slot: "head", visualAssetId: "head_beanie", rarity: "common", lvl: 3, price: 600, stats: { def: 2 } },
  { id: "balaclava", name: "Балаклава", slot: "head", visualAssetId: "head_balaclava", rarity: "rare", lvl: 8, price: 3000, stats: { def: 2, agi: 3, int: 1 } },
  { id: "helmet", name: "Тактический шлем", slot: "head", visualAssetId: "head_helmet", rarity: "epic", lvl: 16, price: 22000, stats: { def: 12 } },
  // лицо
  { id: "shades", name: "Солнцезащитные очки", slot: "face", visualAssetId: "face_shades", rarity: "common", lvl: 2, price: 400, stats: { agi: 2, auth: 3 } },
  { id: "tglasses", name: "Тактические очки", slot: "face", visualAssetId: "face_tactical", rarity: "rare", lvl: 12, price: 9000, stats: { agi: 6, int: 2 } },
  // шея
  { id: "chain", name: "Золотая цепь", slot: "neck", visualAssetId: "neck_chain", rarity: "common", lvl: 4, price: 1500, stats: { agi: 2, auth: 5 } },
  { id: "heavychain", name: "Массивная цепь", slot: "neck", visualAssetId: "neck_heavy", rarity: "epic", lvl: 18, price: 40000, stats: { agi: 6, auth: 25 } },
  // торс
  { id: "tee", name: "Чёрная футболка", slot: "chest", visualAssetId: "chest_tee", rarity: "common", lvl: 1, price: 150, stats: { def: 1 } },
  { id: "hoodie", name: "Худи", slot: "chest", visualAssetId: "chest_hoodie", rarity: "common", lvl: 2, price: 500, stats: { def: 3 } },
  { id: "tracktop", name: "Спортивная олимпийка", slot: "chest", visualAssetId: "chest_track", rarity: "common", lvl: 4, price: 1200, stats: { def: 4, agi: 2 } },
  { id: "stabvest", name: "Скрытый бронежилет", slot: "chest", visualAssetId: "chest_vest", rarity: "rare", lvl: 10, price: 9000, stats: { def: 14 } },
  // верхняя одежда
  { id: "bomber", name: "Бомбер", slot: "outer", visualAssetId: "outer_bomber", rarity: "common", lvl: 3, price: 900, stats: { def: 5 } },
  { id: "leather", name: "Кожаная куртка", slot: "outer", visualAssetId: "outer_leather", rarity: "common", lvl: 6, price: 3000, stats: { def: 9, auth: 4 } },
  { id: "puffer", name: "Пуховик", slot: "outer", visualAssetId: "outer_puffer", rarity: "common", lvl: 9, price: 6000, stats: { def: 12 } },
  { id: "plate", name: "Плитник", slot: "outer", visualAssetId: "outer_plate", rarity: "rare", lvl: 16, price: 25000, stats: { def: 28 } },
  { id: "tactical", name: "Тактический комплект", slot: "outer", visualAssetId: "outer_tactical", rarity: "epic", lvl: 22, price: 70000, stats: { def: 42, agi: 2 } },
  // ноги
  { id: "jeans", name: "Джинсы", slot: "legs", visualAssetId: "legs_jeans", rarity: "common", lvl: 1, price: 300, stats: { def: 1 } },
  { id: "joggers", name: "Спортивные штаны", slot: "legs", visualAssetId: "legs_joggers", rarity: "common", lvl: 2, price: 400, stats: { agi: 2 } },
  { id: "cargo", name: "Брюки-карго", slot: "legs", visualAssetId: "legs_cargo", rarity: "common", lvl: 7, price: 2500, stats: { def: 4, agi: 2 } },
  { id: "tpants", name: "Тактические брюки", slot: "legs", visualAssetId: "legs_tactical", rarity: "rare", lvl: 15, price: 15000, stats: { def: 9, agi: 3 } },
  // обувь
  { id: "sneakers", name: "Кроссовки", slot: "feet", visualAssetId: "feet_sneakers", rarity: "common", lvl: 1, price: 350, stats: { agi: 1 } },
  { id: "boots", name: "Ботинки", slot: "feet", visualAssetId: "feet_boots", rarity: "common", lvl: 5, price: 1800, stats: { def: 3 } },
  { id: "runners", name: "Беговые кроссовки", slot: "feet", visualAssetId: "feet_runners", rarity: "rare", lvl: 11, price: 8000, stats: { agi: 7 } },
  { id: "tboots", name: "Тактические ботинки", slot: "feet", visualAssetId: "feet_tactical", rarity: "rare", lvl: 17, price: 20000, stats: { def: 7, agi: 3 } },
];

export const itemDef = (defId: string) => ITEMS.find((i) => i.id === defId);
export const defOf = (inst: ItemInstance | null) => (inst ? itemDef(inst.defId) : undefined);

/** Стартовый набор: футболка, джинсы, кроссовки уже надеты. */
export function starterLoadout(): Loadout {
  let l: Loadout = { items: [], equipment: emptyEquipment(), nextUid: 1 };
  for (const id of ["tee", "jeans", "sneakers"]) {
    l = addItem(l, id);
    l = equipItem(l, l.items[l.items.length - 1].uid).loadout;
  }
  return l;
}

/** Положить новую вещь в инвентарь. */
export function addItem(l: Loadout, defId: string): Loadout {
  if (!itemDef(defId)) return l;
  return { ...l, items: [...l.items, { uid: "i" + l.nextUid, defId }], nextUid: l.nextUid + 1 };
}

/** Суммарные бонусы надетых вещей. */
export function equipmentStats(eq: Equipment): Required<ItemStats> {
  const sum = { atk: 0, def: 0, agi: 0, int: 0, auth: 0 };
  for (const slot of SLOT_IDS) {
    const d = defOf(eq[slot]);
    if (!d) continue;
    for (const k of Object.keys(sum) as (keyof ItemStats)[]) sum[k] += d.stats[k] ?? 0;
  }
  return sum;
}

// ---------------- уровень 2: логика ----------------

export type EquipChange = { slot: SlotId; before: ItemInstance | null; after: ItemInstance | null };
export type EquipResult = { loadout: Loadout; ok: boolean; message: string; change?: EquipChange };

/**
 * Надеть вещь из инвентаря.
 *  a) находит предмет в инвентаре по uid;
 *  b) проверяет слот (у предмета есть корректный slot; при желании — уровень персонажа);
 *  c) если в слоте уже что-то надето — возвращает старую вещь в инвентарь;
 *  d) убирает вещь из инвентаря и записывает её в слот;
 *  e) сообщает об изменении: возвращает change и рассылает событие equipment:changed.
 * Функция чистая: входной loadout не изменяется.
 */
export function equipItem(l: Loadout, uid: string, opts: { level?: number; slot?: SlotId } = {}): EquipResult {
  // a) найти предмет в инвентаре
  const inst = l.items.find((i) => i.uid === uid);
  if (!inst) return { loadout: l, ok: false, message: "Вещи нет в сумке" };
  const def = itemDef(inst.defId);
  if (!def) return { loadout: l, ok: false, message: "Неизвестный предмет" };

  // b) проверить, подходит ли слот (и уровень, если он передан)
  const slot = def.slot;
  if (opts.slot && opts.slot !== slot) return { loadout: l, ok: false, message: `${def.name} не надевается в слот «${SLOT_NAMES[opts.slot]}»` };
  if (opts.level !== undefined && opts.level < def.lvl) return { loadout: l, ok: false, message: `${def.name} доступен с ${def.lvl} уровня` };

  // c) старая вещь из слота возвращается в инвентарь
  const before = l.equipment[slot];
  const back = before ? [before] : [];

  // d) вещь уходит из инвентаря в слот
  const loadout: Loadout = {
    ...l,
    items: [...l.items.filter((i) => i.uid !== uid), ...back],
    equipment: { ...l.equipment, [slot]: inst },
  };

  // e) уведомить подписчиков (визуал в React обновится и так — через новое состояние)
  const change: EquipChange = { slot, before, after: inst };
  emitEquipmentChange(change);
  return { loadout, ok: true, message: `${def.name}: надето`, change };
}

/** Снять вещь: слот очищается, вещь возвращается в инвентарь. */
export function unequipItem(l: Loadout, slot: SlotId): EquipResult {
  const before = l.equipment[slot];
  if (!before) return { loadout: l, ok: false, message: "Слот пуст" };
  const loadout: Loadout = { ...l, items: [...l.items, before], equipment: { ...l.equipment, [slot]: null } };
  const change: EquipChange = { slot, before, after: null };
  emitEquipmentChange(change);
  return { loadout, ok: true, message: `${defOf(before)?.name ?? "Вещь"}: снято`, change };
}

/** Лучшая вещь в инвентаре для слота (по сумме бонусов) — для кнопки «Надеть лучшее». */
export function bestFor(l: Loadout, slot: SlotId, level: number): ItemInstance | undefined {
  const score = (d: ItemDef) => (d.stats.atk ?? 0) * 1.2 + (d.stats.def ?? 0) + (d.stats.agi ?? 0) + (d.stats.int ?? 0);
  return l.items
    .filter((i) => { const d = itemDef(i.defId); return d && d.slot === slot && d.lvl <= level; })
    .sort((a, b) => score(itemDef(b.defId)!) - score(itemDef(a.defId)!))[0];
}

// ---------------- события (шаг e) ----------------
/** Простая шина событий: подписаться может кто угодно — аватар (вспышка слоя), звук, аналитика. */
type Listener = (c: EquipChange) => void;
const listeners = new Set<Listener>();
export function onEquipmentChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emitEquipmentChange(c: EquipChange) {
  for (const fn of listeners) fn(c);
}

/** Проверка загруженного из сохранения снаряжения. */
export function isLoadout(x: unknown): x is Loadout {
  if (!x || typeof x !== "object") return false;
  const l = x as Loadout;
  const okInst = (i: unknown) => !!i && typeof (i as ItemInstance).uid === "string" && !!itemDef((i as ItemInstance).defId);
  return Array.isArray(l.items) && l.items.every(okInst) && typeof l.nextUid === "number" && !!l.equipment &&
    SLOT_IDS.every((s) => l.equipment[s] === null || (okInst(l.equipment[s]) && itemDef(l.equipment[s]!.defId)!.slot === s));
}
