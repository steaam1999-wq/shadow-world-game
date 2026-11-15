/**
 * Визуальное отображение экипировки на персонаже.
 *
 * Как работает:
 *  1) рисуется базовое тело (кожа, волосы, базовая майка и шорты);
 *  2) для каждого слота equipment[slot] берётся предмет → его visualAssetId →
 *     слой из реестра ASSETS (SVG-группа или спрайт);
 *  3) слои сортируются по z и рисуются поверх тела.
 * Пустой слот → слоя нет, под ним снова видно базовое тело. Отдельно «очищать»
 * ничего не нужно: React сравнивает списки слоёв и сам убирает исчезнувший.
 *
 * Компонент «глупый»: он получает equipment через props и ничего не хранит.
 * Новое состояние экипировки (после equipItem/unequipItem) → новый props → перерисовка.
 */
import { useEffect, useState } from "react";
import { SLOT_IDS, defOf, onEquipmentChange, type Equipment, type SlotId } from "../equipment";
import { ASSETS, renderAsset } from "./assets";

const SKIN = "#c69c82", SKIN_D = "#a97f66", HAIR = "#1c1714", BASE = "#2b2f33", BASE_D = "#23262a";

/** Базовое тело: видно там, где нет одежды. */
function BaseBody() {
  const line = { stroke: "#0b0f0d", strokeWidth: 1.1, strokeLinejoin: "round" as const };
  return (
    <g>
      {/* руки и ноги */}
      <path d="M64 94 Q51 100 48 140 L45 200 Q45 228 49 238 L57 238 Q58 220 59 200 L66 146 Z" fill="url(#av-skin)" {...line} />
      <path d="M136 94 Q149 100 152 140 L155 200 Q155 228 151 238 L143 238 Q142 220 141 200 L134 146 Z" fill="url(#av-skin)" {...line} />
      <ellipse cx="53" cy="245" rx="6.5" ry="9" fill={SKIN} {...line} />
      <ellipse cx="147" cy="245" rx="6.5" ry="9" fill={SKIN} {...line} />
      <path d="M72 206 L98 206 L96 300 L94 392 L77 392 L74 300 Z" fill="url(#av-skin)" {...line} />
      <path d="M102 206 L128 206 L126 300 L123 392 L106 392 L104 300 Z" fill="url(#av-skin)" {...line} />
      <ellipse cx="86" cy="398" rx="10" ry="5" fill={SKIN_D} {...line} />
      <ellipse cx="114" cy="398" rx="10" ry="5" fill={SKIN_D} {...line} />
      {/* торс: базовая майка и шорты */}
      <path d="M64 92 Q100 84 136 92 L140 150 L132 206 L68 206 L60 150 Z" fill="url(#av-skin)" {...line} />
      <path d="M70 92 Q100 100 130 92 L136 150 L131 206 L69 206 L64 150 Z" fill={BASE} {...line} />
      <path d="M68 200 L132 200 L130 250 L103 250 L100 224 L97 250 L70 250 Z" fill={BASE_D} {...line} />
      {/* шея и голова */}
      <path d="M92 64 L108 64 L109 90 L91 90 Z" fill={SKIN_D} {...line} />
      <ellipse cx="83.5" cy="48" rx="2.6" ry="4.2" fill={SKIN_D} {...line} />
      <ellipse cx="116.5" cy="48" rx="2.6" ry="4.2" fill={SKIN_D} {...line} />
      <ellipse cx="100" cy="46" rx="16.5" ry="20.5" fill="url(#av-skin)" {...line} />
      {/* лицо: сдержанные черты, без мультяшных глаз */}
      <path d="M91.5 41.5 L97.5 40.8 M102.5 40.8 L108.5 41.5" stroke="#2a1f18" strokeWidth={1.5} strokeLinecap="round" />
      <ellipse cx="94.5" cy="45.6" rx="1.8" ry="1.05" fill="#1b1410" />
      <ellipse cx="105.5" cy="45.6" rx="1.8" ry="1.05" fill="#1b1410" />
      <path d="M100 47 L98.4 54.6 L101.2 55.2" fill="none" stroke={SKIN_D} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M95.5 60 Q100 61.4 104.5 60" fill="none" stroke="#7a4a3a" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M86 52 Q90 64 100 66.5 Q110 64 114 52 Q112 62 100 66.5" fill="#00000014" />
      {/* короткая современная стрижка */}
      <path d="M83.6 45 Q82.6 25 100 24.4 Q117.4 25 116.4 45 Q115 33 106 31 Q100 34 92 31 Q86 34 83.6 45 Z" fill={HAIR} {...line} />
    </g>
  );
}

/** Слои надетых вещей, отсортированные по z. */
export function equipmentLayers(eq: Equipment): { slot: SlotId; assetId: string; z: number }[] {
  return SLOT_IDS.flatMap((slot) => {
    const def = defOf(eq[slot]);
    const asset = def && ASSETS[def.visualAssetId];
    return def && asset ? [{ slot, assetId: def.visualAssetId, z: asset.z }] : [];
  }).sort((a, b) => a.z - b.z);
}

export function Avatar({ equipment, className = "", flash = true }: { equipment: Equipment; className?: string; flash?: boolean }) {
  // подсветка слоя, который только что сменился (подписка на событие из equipItem/unequipItem)
  const [lit, setLit] = useState<SlotId | null>(null);
  useEffect(() => {
    if (!flash) return;
    let timer: ReturnType<typeof setTimeout>;
    const off = onEquipmentChange((c) => {
      setLit(c.slot);
      clearTimeout(timer);
      timer = setTimeout(() => setLit(null), 700);
    });
    return () => { off(); clearTimeout(timer); };
  }, [flash]);

  const layers = equipmentLayers(equipment);
  return (
    <svg className={"avatar " + className} viewBox="0 0 200 420" role="img" aria-label="Персонаж в экипировке">
      <defs>
        <linearGradient id="av-skin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b58a70" /><stop offset=".45" stopColor={SKIN} /><stop offset="1" stopColor="#a9806a" />
        </linearGradient>
        <linearGradient id="av-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".10" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="408" rx="46" ry="7" fill="#000" opacity=".45" />
      <BaseBody />
      {layers.map((l) => (
        // key = слот + ассет: смена вещи в слоте заменяет слой, снятие — убирает его
        <g key={l.slot + ":" + l.assetId} data-slot={l.slot} className={lit === l.slot ? "layer-flash" : undefined}>
          {renderAsset(l.assetId)}
        </g>
      ))}
    </svg>
  );
}
