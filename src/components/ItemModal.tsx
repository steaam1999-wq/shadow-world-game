import { Hammer, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { MAX_UPGRADE } from '../data/items';
import { findItem, equipItem, sellItem, unequipItem, upgradeItem } from '../game/inventory';
import { itemStats, sellPrice, upgradeChance, upgradeCost } from '../game/items';
import { trackEvent } from '../game/quests';
import { useGame } from '../hooks/useGame';
import { Burst } from './Particles';
import { ItemCompare, ItemHeader, StatLines } from './ItemCard';
import { Modal } from './ui';

export function ItemModal({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const { state, mutate, play, toast } = useGame();
  const [fx, setFx] = useState<{ k: number; ok: boolean } | null>(null);
  const item = itemId ? findItem(state, itemId) : undefined;
  if (!itemId || !item) return null;
  const equipped = state.equipment[item.slot];
  const isEquipped = equipped?.id === item.id;
  const cost = upgradeCost(item);

  const doUpgrade = () => {
    const out = mutate((d) => {
      const r = upgradeItem(d, item.id);
      if (r === 'success') trackEvent(d, 'upgrade');
      return r;
    });
    if (out === 'success') {
      play('levelup');
      setFx({ k: Date.now(), ok: true });
    } else if (out === 'fail') {
      play('defeat');
      setFx({ k: Date.now(), ok: false });
      toast({ kind: 'error', title: 'Улучшение не удалось', text: 'Золото потрачено, предмет цел', icon: '💔' });
    } else if (out === 'noGold') {
      play('error');
      toast({ kind: 'error', title: 'Недостаточно золота' });
    }
  };

  return (
    <Modal open onClose={onClose} title={isEquipped ? 'Экипировано' : 'Предмет'}>
      <div key={fx?.k} className={`relative ${fx ? (fx.ok ? 'anim-heal' : 'anim-shake') : ''}`}>
        {fx?.ok && <Burst color="#fbbf24" />}
        <ItemHeader item={item} />
      </div>
      <div className="mt-4">
        {isEquipped ? (
          <div className="panel-inner p-3">
            <StatLines stats={itemStats(item)} />
          </div>
        ) : (
          <ItemCompare item={item} equipped={equipped} />
        )}
      </div>

      <div className="panel-inner mt-3 flex items-center justify-between gap-3 p-3">
        <div className="text-sm">
          <div className="font-bold text-amber-300">
            <Hammer size={14} className="mr-1 inline" />
            Улучшение +{item.upgrade} → +{Math.min(MAX_UPGRADE, item.upgrade + 1)}
          </div>
          <div className="text-xs text-zinc-400">
            {item.upgrade >= MAX_UPGRADE ? 'Максимальный уровень' : `+10% к основным характеристикам · шанс ${upgradeChance(item)}%`}
          </div>
        </div>
        <button className="btn-gold !px-3 !py-2 text-xs" disabled={item.upgrade >= MAX_UPGRADE || state.currencies.gold < cost} onClick={doUpgrade}>
          {cost} 🪙
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {isEquipped ? (
          <button
            className="btn-dark"
            onClick={() => {
              const ok = mutate((d) => unequipItem(d, item.slot));
              if (!ok) toast({ kind: 'error', title: 'Инвентарь полон' });
              else play('click');
              onClose();
            }}
          >
            Снять
          </button>
        ) : (
          <button
            className="btn-blood"
            onClick={() => {
              mutate((d) => equipItem(d, item.id));
              play('block');
              onClose();
            }}
          >
            Надеть
          </button>
        )}
        {!isEquipped && (
          <button
            className="btn-dark"
            disabled={item.locked}
            onClick={() => {
              const g = mutate((d) => sellItem(d, item.id));
              play('coin');
              toast({ kind: 'success', title: `Продано за ${g} 🪙`, icon: '🪙' });
              onClose();
            }}
          >
            Продать · {sellPrice(item)} 🪙
          </button>
        )}
        {!isEquipped && (
          <button
            className="btn-dark col-span-2 !py-2 text-xs"
            onClick={() =>
              mutate((d) => {
                const it = d.inventory.find((i) => i.id === item.id);
                if (it) it.locked = !it.locked;
              })
            }
          >
            {item.locked ? <Unlock size={14} /> : <Lock size={14} />} {item.locked ? 'Разблокировать' : 'Заблокировать от продажи'}
          </button>
        )}
      </div>
    </Modal>
  );
}
