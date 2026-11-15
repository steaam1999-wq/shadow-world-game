# Система экипировки (Equipment System)

Стек: TypeScript + React. Логика — чистые функции без React, визуал — компонент `<Avatar>`.

```
клик «Надеть» в сумке
   │  EquipmentScreen.onItemClick(uid)
   ▼
E.equip(game, uid)                 ← economy.ts: проверка уровня, обёртка
   │
   ▼
equipItem(loadout, uid)            ← equipment.ts: шаги a–e, возвращает НОВЫЙ loadout
   │                                  + событие equipment:changed (шаг e)
   ▼
setGame(newState)                  ← useGame: новое состояние, автосохранение
   │
   ▼
<Avatar equipment={game.eco.loadout.equipment}/>
   │  equipmentLayers(): слот → ItemDef → visualAssetId → ASSETS[id] (z, draw | src)
   ▼
SVG: базовое тело + слои, отсортированные по z
```

## 1. Данные — `src/equipment.ts`

| Тип | Что это |
|---|---|
| `SlotId` | `"head" \| "face" \| "neck" \| "chest" \| "outer" \| "legs" \| "feet" \| "weapon"` |
| `ItemDef` | предмет каталога: `id`, `name`, `slot`, **`visualAssetId`**, `rarity`, `lvl`, `price`, `stats` |
| `ItemInstance` | конкретная вещь игрока: `{ uid, defId }` — две одинаковые куртки различаются `uid` |
| `Equipment` | `Record<SlotId, ItemInstance \| null>` — `{ head: null, chest: {…}, weapon: null, … }` |
| `Loadout` | `{ items: ItemInstance[]; equipment: Equipment; nextUid }` — сумка + надетое |

`Loadout` хранится в сохранении (`game.eco.loadout`) и проверяется `isLoadout` при загрузке.

## 2. Логика — `equipItem` / `unequipItem`

```ts
export function equipItem(l: Loadout, uid: string, opts = {}): EquipResult {
  const inst = l.items.find((i) => i.uid === uid);          // a) найти в сумке
  const def = itemDef(inst.defId);
  if (opts.slot && opts.slot !== def.slot) return fail;     // b) слот подходит?
  if (opts.level < def.lvl) return fail;                    //    и уровень
  const before = l.equipment[def.slot];                     // c) что было надето
  const loadout = {
    ...l,
    items: [...l.items.filter((i) => i.uid !== uid), ...(before ? [before] : [])], // c) старое — в сумку
    equipment: { ...l.equipment, [def.slot]: inst },        // d) новое — в слот
  };
  emitEquipmentChange({ slot: def.slot, before, after: inst }); // e) уведомить
  return { loadout, ok: true, change: { … } };
}
```

* Функции **чистые**: исходный `loadout` не меняется. В React новая ссылка → новый рендер.
  Поэтому шаг e («обновить визуал») выполняется автоматически, без ручных вызовов.
* Событие `onEquipmentChange` нужно для эффектов: аватар подсвечивает сменившийся слой,
  сюда же можно повесить звук, анимацию, аналитику.
* `unequipItem(l, slot)` — обратная операция: слот → `null`, вещь — в сумку.

## 3. Визуал — `src/avatar/`

* `assets.tsx` — реестр `visualAssetId → { z, draw | src }`.
  Все слои рисуются на одном холсте **200×420**, поэтому любой векторный слой можно заменить
  рисованным спрайтом: `ASSETS.outer_leather = { z: 50, src: "art/outer_leather.webp" }`.
* `Avatar.tsx`:
  1. рисует базовое тело (кожа, стрижка, базовая майка и шорты);
  2. `equipmentLayers(equipment)` собирает слои надетых вещей и сортирует по `z`
     (ноги 10 → обувь 20 → торс 30 → верх 50 → шея 55 → оружие 60 → голова 70 → лицо 80);
  3. рендерит их поверх тела. У каждого слоя `key = slot + assetId`, поэтому React
     **сам удаляет** слой снятой вещи и заменяет слой при смене вещи в слоте.

Пустой слот = слоя нет → снова видно базовое тело. Отдельная «очистка» не нужна.

## Где используется

| Место | Что видно |
|---|---|
| Профиль | аватар + по 4 слота слева и справа (клик → экран экипировки) |
| Экипировка (`#gear`) | аватар, слоты (клик по занятому — снять, по пустому — фильтр сумки), сумка: «Надеть», «Продать» |
| Барыга | покупка кладёт вещь в сумку, в пустой слот — сразу надевает |
| Арена | соперники в своей экипировке — тот же `<Avatar>` |
| Бой | бонусы вещей (атака, броня, ловкость, интуиция) входят в формулы боя |

## Перенос на Unity (C#)

Та же схема: `ItemDef` → `ScriptableObject` со `slot` и ссылкой на `Sprite`/`GameObject`;
`Equipment` → `Dictionary<SlotId, ItemInstance>`; `EquipItem` возвращает старую вещь в инвентарь
и вызывает `event Action<EquipChange> OnEquipmentChanged`; компонент `AvatarRenderer`
подписан на событие и для слота включает/меняет `SpriteRenderer` (2D, `sortingOrder = z`)
или `SkinnedMeshRenderer` (3D, кость скелета общая) либо отключает его при снятии.

## Тесты

* `tests/equipment.test.ts` — шаги a–e, снятие, события, проверка сохранения, порядок слоёв.
* `tests/ui.test.tsx` — «Экипировка в интерфейсе»: клик «Надеть» → слой `head` появился на аватаре,
  клик по слоту → слой исчез, вещь вернулась в сумку.
