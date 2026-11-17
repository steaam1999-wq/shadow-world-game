# Equipment System — React + TypeScript

В игре используется 2D-аватар со слоями, а не замена всего изображения персонажа. Все слои используют общую SVG-фигуру 320×640. Контуры, мягкие тени, швы и складки рисуются в одной системе координат; отдельные фотографии вещей не растягиваются поверх тела. Лицо — оригинальная иллюстрация.

## 1. Данные

`src/equipment.ts` не зависит от React, LocalStorage и боёв:

```ts
type EquipmentSlot = "head" | "chest" | "weapon" | "legs" | "feet";
type GearItem = {
  id: string; // ID экземпляра; один предмет находится в одном месте
  name: string;
  slot: EquipmentSlot; // совместимый слот
  visualAssetId: string; // ключ реестра графики, а не произвольный URL
  minLevel: number;
  stats: { attack: number; defense: number };
};
type Equipment = Record<EquipmentSlot, GearItem | null>;
type Loadout = { inventory: GearItem[]; equipment: Equipment };

const emptyEquipment = (): Equipment => ({
  head: null,
  chest: null,
  weapon: null,
  legs: null,
  feet: null,
});
```

`gearCatalog` содержит 11 определений. Стартовый комплект: футболка, джинсы и кроссовки сразу надеты; бейсболка и перчатки лежат в сумке. `starterLoadout` создаёт пустые слоты и пять вещей для изолированной логики; `dressedStarterLoadout` используется при создании новой игры. Худи и карго выдаются за поручения и требуют уровень 2.

В состоянии игры это `game.loadout.inventory` и `game.loadout.equipment`. Сюжетные предметы хранятся отдельно нормализованными ID в прежнем `game.inventory`, чтобы сохранить совместимость главы I. Их каталог `src/items.ts` также задаёт `slot: 'quest'` и `visualAssetId`; эти предметы открывают действия сюжета, а не занимают слот одежды.

Для одинаковых копий предмета в будущем следует разделить `instanceId` и `definitionId`; сейчас каждый ID уникален в пределах сохранения, повторная выдача того же предмета блокируется.

## 2. Атомарные Equip / Unequip

Функции из `src/equipment.ts` возвращают новый объект. Они не изменяют переданный `state`, не добавляют предмет второй раз и не зависят от текущего экрана.

```ts
export function equipItem(
  state: Loadout,
  itemId: string,
  targetSlot?: EquipmentSlot,
  level = 1,
): Loadout {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item || item.minLevel > level || !equipmentSlots.includes(item.slot)) {
    return state;
  }
  const slot = targetSlot ?? item.slot;
  if (slot !== item.slot) return state;

  const old = state.equipment[slot];
  return {
    inventory: [
      ...state.inventory.filter((i) => i.id !== itemId),
      ...(old ? [old] : []), // заменённая вещь возвращается в сумку
    ],
    equipment: { ...state.equipment, [slot]: item },
  };
}

export function unequipItem(state: Loadout, slot: EquipmentSlot): Loadout {
  const item = state.equipment[slot];
  if (!item) return state;
  return {
    inventory: [...state.inventory, item],
    equipment: { ...state.equipment, [slot]: null },
  };
}
```

`equipGear` / `unequipGear` в `src/game.ts` применяют эти функции к игровому состоянию и блокируют переодевание во время незаконченного боя. Характеристики арены вычисляются из надетых вещей через `combatStats`, без отдельного кеша, который может устареть.

## 3. Рендерер и клик в инвентаре

`visualAssetId` разрешается через реестр `src/avatarAssets.ts`. Он задаёт совместимый слот и тип рисованного предмета. `AvatarRig.tsx` содержит общие формы тела и одежды: одинаковые плечи, пояс, запястья и щиколотки. Холст сохраняет пропорции через `viewBox="0 0 320 640"` и `preserveAspectRatio="xMidYMid meet"`.

Сокращённая логика реального рендерера:

```tsx
function Avatar({ equipment }: { equipment: Equipment }) {
  return <AvatarRig equipment={equipment} headHref="/art/faces/street.webp" />;
}

// Внутри AvatarRig:
{avatarDrawOrder.map(slot => {
  const item = equipment[slot];
  const asset = item && visualAssets[item.visualAssetId];
  if (!asset || asset.slot !== slot) return null;
  return <g key={slot} data-slot={slot}>
    <Wearable assetId={item.visualAssetId} id={uniqueId} />
  </g>;
})}
```

Порядок: брюки → обувь → верх → головной убор → перчатки. Рукава заканчиваются у тех же запястий, где начинаются перчатки; брюки стыкуются с обувью. Бейсболка маскирует верх волос. Для разных вещей нет независимого растяжения по осям. При снятии слой исчезает; для пустых слотов верха, брюк и обуви остаётся нейтральная базовая одежда без боевых бонусов. Неизвестный или несовместимый ассет отображается как пустой слот.

Миниатюры в инвентаре и боковых слотах генерирует `node scripts/preview-loadout.mjs` из того же `Wearable`, в `public/art/gear-ink/`. Поэтому форма вещи на значке соответствует надетой вещи. Каждый экземпляр SVG получает уникальные ID градиентов, чтобы профиль и предпросмотр не влияли друг на друга.

Связь UI со сменой внешности в `src/EquipmentPanel.tsx`:

```tsx
const onEquip = (item: GearItem) =>
  setGame((current) => equipGear(current, item.id));

const onUnequip = (slot: EquipmentSlot) =>
  setGame((current) => unequipGear(current, slot));

<Avatar equipment={game.loadout.equipment} />;

{
  game.loadout.inventory.map((item) => (
    <button key={item.id} onClick={() => onEquip(item)}>
      Надеть {item.name}
    </button>
  ));
}
```

Цепочка: клик → проверка игрового режима → атомарная замена → новый `GameState` → новые props `equipment` → React добавляет/удаляет слой → `useGame` сохраняет состояние. Принудительный `forceUpdate`, ручная перерисовка Canvas и отдельный event bus не нужны. В инвентаре есть закреплённый предпросмотр, а в профиле тот же компонент отображает ту же экипировку.

## Сохранения и расширение

Схема сохранения обновлена до `version: 2`. Старые сохранения `version: 1` получают стартовую сумку, пустые слоты, журнал поручений и состояние арены; деньги, глава, отношения и решения сохраняются. Валидатор отклоняет подменённые ассеты, несовместимые слоты и повторяющиеся экземпляры.

Для 3D можно заменить `Avatar.tsx` на рендерер glTF, сохранив `Equipment` и функции замены: `visualAssetId` будет ключом меша, привязанного к общей skeleton/bone rig. Для анимации 2D потребуются согласованные кадры одежды для каждой позы; текущий аватар статический.

## Проверки

Тесты проверяют замену с возвратом старого предмета, снятие, неверный слот, ограничения уровня, сохранение/загрузку, запрет смены вещей в бою и влияние на характеристики. DOM-тест нажимает карточку вещи и проверяет появление `[data-slot="chest"]`, затем нажимает «Снять» и проверяет удаление слоя. Регрессионные тесты проверяют все 288 сочетаний 11 предметов: неизменную геометрию, один слой на слот, базовую одежду при снятии и независимость SVG-градиентов. DOM-тест также заменяет футболку на худи и джинсы на карго, снимает и надевает обувь и восстанавливает наряд после загрузки. Графический скрипт `node scripts/preview-loadout.mjs` рендерит ту же SVG-фигуру без браузера. Настоящий Safari и геометрия интерфейса в текущей среде остаются непроверенными.

## Исправление стартового облика

Поле `appearanceRevision: 1` отмечает однократную миграцию внешности. В старом сохранении пустые базовые слоты заполняются стартовой одеждой и кроссовками. Уже надетые вещи не заменяются. После миграции игрок может снять вещь: повторная загрузка не надевает её принудительно.

Комплект современной классики выдаётся и надевается через `profileOutfit` без дубликатов. `updateProfile` проверяет режим боя и сохраняет имя/внешность вместе с комплектом. Пальто, шляпа, брюки и туфли — обычные предметы тех же слотов; их можно комбинировать с прежними вещами. Палитра кожи передаётся в `AvatarRig` независимо от одежды. Подробности: [CHARACTER_ART.md](CHARACTER_ART.md).

## Рисованный основной герой

Для типажа «Ветеран» `Avatar.tsx` использует `PaintedAvatar.tsx` и данные `paintedHero.ts`. Полный классический комплект без тренировочных перчаток показан цельной иллюстрацией. Смена любой вещи переключает на рисованные слои текущего набора; снятие слоя сохраняется. Трость внутри цельной иллюстрации декоративная и не занимает игровой слот.

11 изображений вещей зарегистрированы на одном холсте 256×512, без растяжения по отдельным осям. Маски скрывают базовые брюки/обувь под надетой одеждой. Варианты другой внешности продолжают использовать SVG-геометрию 320×640. `Equipment` и атомарные операции остаются общими для обоих рендереров.
