import { useMemo, useState } from 'react';
import { INVENTORY_LIMIT, RARITIES, RARITY_INFO, SLOTS, SLOT_INFO } from '../data/items';
import { sellAllUpTo } from '../game/inventory';
import { itemPower, rarityIndex } from '../game/items';
import { CHEST_COST, openChest, PREMIUM_CHEST_COST, buyPotion, potionPrice } from '../game/shop';
import { useGame } from '../hooks/useGame';
import { ItemIcon } from '../components/ItemCard';
import { ItemModal } from '../components/ItemModal';
import { Confirm, PageTitle, Tabs } from '../components/ui';
import type { Item, Rarity } from '../types';

type Group = 'all' | 'weapon' | 'armor' | 'accessory';
type Sort = 'power' | 'rarity' | 'level';

export function InventoryPage() {
  const { state, mutate, play, toast } = useGame();
  const [tab, setTab] = useState<'bag' | 'shop'>('bag');
  const [group, setGroup] = useState<Group>('all');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [sort, setSort] = useState<Sort>('power');
  const [itemId, setItemId] = useState<string | null>(null);
  const [sellConfirm, setSellConfirm] = useState<Rarity | null>(null);

  const items = useMemo(() => {
    const list = state.inventory.filter(
      (i) => (group === 'all' || SLOT_INFO[i.slot].group === group) && (rarity === 'all' || i.rarity === rarity),
    );
    const key = (i: Item) => (sort === 'power' ? itemPower(i) : sort === 'rarity' ? rarityIndex(i.rarity) * 10000 + itemPower(i) : i.level * 10000 + itemPower(i));
    return [...list].sort((a, b) => key(b) - key(a));
  }, [state.inventory, group, rarity, sort]);

  const open = (id: string) => {
    play('click');
    setItemId(id);
    mutate((d) => {
      const it = d.inventory.find((i) => i.id === id);
      if (it) it.isNew = false;
    });
  };

  const isBetter = (i: Item) => {
    const eq = state.equipment[i.slot];
    return !eq || itemPower(i) > itemPower(eq);
  };

  const chest = (premium: boolean) => {
    const r = mutate((d) => openChest(d, premium));
    if (!r.ok) {
      play('error');
      toast({ kind: 'error', title: r.reason });
      return;
    }
    play('loot');
    for (const it of r.items ?? []) toast({ kind: 'loot', title: it.name, text: RARITY_INFO[it.rarity].name, icon: it.icon });
  };

  return (
    <div>
      <PageTitle
        icon="🎒"
        title="Инвентарь"
        subtitle={`${state.inventory.length} / ${INVENTORY_LIMIT} предметов`}
        right={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'bag', label: 'Сумка' }, { id: 'shop', label: 'Лавка' }]} />}
      />

      {tab === 'bag' && (
        <>
          {/* Equipped strip */}
          <div className="panel mb-3 flex gap-2 overflow-x-auto p-3">
            {SLOTS.map((s) => {
              const it = state.equipment[s];
              return it ? (
                <ItemIcon key={s} item={it} size="sm" onClick={() => open(it.id)} />
              ) : (
                <div key={s} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 text-xl opacity-50" title={SLOT_INFO[s].name}>
                  {SLOT_INFO[s].icon}
                </div>
              );
            })}
            <div className="ml-auto flex shrink-0 items-center pl-2 text-xs text-zinc-500">Надето</div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Tabs
              value={group}
              onChange={setGroup}
              tabs={[
                { id: 'all', label: 'Все' },
                { id: 'weapon', label: '⚔️ Оружие' },
                { id: 'armor', label: '🛡️ Броня' },
                { id: 'accessory', label: '💍 Аксессуары' },
              ]}
            />
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity | 'all')}
              className="rounded-xl border border-edge bg-black/60 px-3 py-2 text-xs font-bold uppercase text-zinc-300 outline-none"
            >
              <option value="all">Любая редкость</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_INFO[r].name}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-xl border border-edge bg-black/60 px-3 py-2 text-xs font-bold uppercase text-zinc-300 outline-none"
            >
              <option value="power">По силе</option>
              <option value="rarity">По редкости</option>
              <option value="level">По уровню</option>
            </select>
            <div className="ml-auto flex gap-2">
              <button className="btn-dark !px-3 !py-2 text-[11px]" onClick={() => setSellConfirm('uncommon')}>
                Продать обычн./необычн.
              </button>
              <button className="btn-dark !px-3 !py-2 text-[11px]" onClick={() => setSellConfirm('rare')}>
                ...и редкие
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="panel p-10 text-center text-zinc-500">
              <div className="text-5xl">🕸️</div>
              <div className="mt-2">Здесь пока пусто. Побеждайте врагов, чтобы получить добычу!</div>
            </div>
          ) : (
            <div className="panel grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 p-3 sm:grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]">
              {items.map((it) => (
                <div key={it.id} className="flex justify-center">
                  <ItemIcon item={it} onClick={() => open(it.id)} better={isBetter(it)} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">▲ — предмет сильнее надетого. При переполнении сумки новые предметы продаются автоматически.</p>
        </>
      )}

      {tab === 'shop' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ShopCard icon="🧪" title="Зелье здоровья" desc="Восстанавливает 35% HP в бою и снимает яд/горение/кровотечение" price={`${potionPrice(state)} 🪙`} cls="btn-green" onClick={() => {
            const r = mutate((d) => buyPotion(d));
            if (r.ok) { play('coin'); toast({ kind: 'success', title: '+1 зелье', icon: '🧪' }); } else { play('error'); toast({ kind: 'error', title: r.reason }); }
          }} note={`У вас: ${state.potions}`} />
          <ShopCard icon="🎁" title="Сундук теней" desc="Предмет «Необычный» или выше вашего уровня" price={`${CHEST_COST} 💎`} cls="btn-shadow" onClick={() => chest(false)} />
          <ShopCard icon="👑" title="Королевский сундук" desc="2 предмета, один гарантированно «Редкий»+ с шансом на Мифический" price={`${PREMIUM_CHEST_COST} 💎`} cls="btn-gold" onClick={() => chest(true)} />
        </div>
      )}

      <ItemModal itemId={itemId} onClose={() => setItemId(null)} />
      <Confirm
        open={!!sellConfirm}
        title="Массовая продажа"
        text={`Продать все незаблокированные предметы редкости «${sellConfirm ? RARITY_INFO[sellConfirm].name : ''}» и ниже?`}
        confirmLabel="Продать"
        onClose={() => setSellConfirm(null)}
        onConfirm={() => {
          const r = mutate((d) => sellAllUpTo(d, sellConfirm!));
          setSellConfirm(null);
          play('coin');
          toast({ kind: 'success', title: `Продано: ${r.count}`, text: `+${r.gold} 🪙`, icon: '🪙' });
        }}
      />
    </div>
  );
}

function ShopCard({ icon, title, desc, price, cls, onClick, note }: { icon: string; title: string; desc: string; price: string; cls: string; onClick: () => void; note?: string }) {
  return (
    <div className="panel flex flex-col items-center p-5 text-center">
      <div className="anim-idle text-6xl">{icon}</div>
      <div className="title mt-2 text-2xl text-zinc-100">{title}</div>
      <div className="text-xs text-zinc-400">{desc}</div>
      {note && <div className="mt-1 text-xs font-bold text-emerald-300">{note}</div>}
      <button className={`${cls} mt-auto w-full translate-y-0 pt-2.5`} style={{ marginTop: 16 }} onClick={onClick}>
        {price}
      </button>
    </div>
  );
}
