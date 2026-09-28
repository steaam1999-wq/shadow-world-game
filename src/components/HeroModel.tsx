import { useId } from 'react';
import { CLASSES } from '../data/classes';
import { RARITY_INFO } from '../data/items';
import type { ClassId, Item, Slot } from '../types';

/**
 * Layered SVG character model. Class decides silhouette, helmet and weapon;
 * equipped items show up on the body and glow in their rarity colour.
 */
export function HeroModel({
  classId,
  equipment = {},
  shadows = 0,
  crop = 'full',
  animate = true,
  className = '',
}: {
  classId: ClassId;
  equipment?: Partial<Record<Slot, Item>>;
  shadows?: number;
  crop?: 'full' | 'bust';
  animate?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const cls = CLASSES[classId];
  const accent = cls.color;
  const trim = (slot: Slot, fallback = '#3f3a44') => (equipment[slot] ? RARITY_INFO[equipment[slot]!.rarity].color : fallback);
  const has = (slot: Slot) => !!equipment[slot];
  const weaponGlow = has('weapon') && ['epic', 'legendary', 'mythic'].includes(equipment.weapon!.rarity);

  const viewBox = crop === 'bust' ? '48 34 104 104' : '0 0 200 260';
  const id = (n: string) => `${n}-${uid}`;

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={`Модель: ${cls.name}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={id('aura')} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15 + shadows * 0.15} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('armor')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4a4450" />
          <stop offset="55%" stopColor="#25212b" />
          <stop offset="100%" stopColor="#141118" />
        </linearGradient>
        <linearGradient id={id('cape')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0b0810" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={id('metal')} x1="0" x2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow aura & ground */}
      {shadows > 0 && <ellipse cx="100" cy="150" rx="95" ry="120" fill={`url(#${id('aura')})`} className={animate ? 'model-aura' : ''} />}
      <ellipse cx="100" cy="244" rx="46" ry="7" fill="#000" opacity="0.6" />

      {/* Cape (behind body) */}
      <path className={animate ? 'model-cape' : ''} d="M72 96 Q58 170 52 238 L148 238 Q142 170 128 96 Z" fill={`url(#${id('cape')})`} />

      <g className={animate ? 'model-breathe' : ''}>
        {/* Legs */}
        <path d="M84 168 L80 228 L95 228 L99 168 Z" fill="#1d1a22" />
        <path d="M101 168 L105 228 L120 228 L116 168 Z" fill="#1d1a22" />
        {/* Boots */}
        <path d="M76 220 L97 220 L99 241 L70 241 Z" fill="#2a2227" stroke={trim('boots')} strokeWidth={has('boots') ? 1.6 : 0.8} />
        <path d="M103 220 L124 220 L130 241 L101 241 Z" fill="#2a2227" stroke={trim('boots')} strokeWidth={has('boots') ? 1.6 : 0.8} />

        {/* Weapon behind body for mage staff */}
        {classId === 'shadowmage' && <Staff id={id} trim={trim('weapon', accent)} glow={weaponGlow} />}

        {/* Arms */}
        <path d="M70 104 L58 150 L69 153 L80 110 Z" fill={`url(#${id('armor')})`} />
        <path d="M130 104 L142 150 L131 153 L120 110 Z" fill={`url(#${id('armor')})`} />

        {/* Torso */}
        <path d="M75 97 Q100 88 125 97 L121 171 Q100 179 79 171 Z" fill={`url(#${id('armor')})`} stroke={trim('armor')} strokeWidth={has('armor') ? 1.8 : 0.8} />
        <ClassChest classId={classId} accent={accent} trim={trim('armor', accent)} />
        {/* Belt */}
        <rect x="79" y="160" width="42" height="7" rx="2" fill="#17131a" stroke="#4b4350" strokeWidth="0.8" />
        <rect x="96" y="159" width="8" height="9" rx="1.5" fill={accent} opacity="0.85" />

        {/* Amulet */}
        {has('amulet') && (
          <g filter={`url(#${id('glow')})`}>
            <path d="M92 100 Q100 112 108 100" stroke="#a8a29e" strokeWidth="0.8" fill="none" />
            <circle cx="100" cy="113" r="3.4" fill={trim('amulet')} />
          </g>
        )}

        {/* Pauldrons */}
        <Pauldron cx={74} classId={classId} accent={accent} trim={trim('armor', '#57505e')} metal={`url(#${id('metal')})`} />
        <Pauldron cx={126} classId={classId} accent={accent} trim={trim('armor', '#57505e')} metal={`url(#${id('metal')})`} flip />

        {/* Gloves */}
        <circle cx="63" cy="154" r="7" fill="#221d26" stroke={trim('gloves')} strokeWidth={has('gloves') ? 1.8 : 0.8} />
        <circle cx="137" cy="154" r="7" fill="#221d26" stroke={trim('gloves')} strokeWidth={has('gloves') ? 1.8 : 0.8} />
        {has('ring') && <circle cx="140" cy="157" r="2" fill={trim('ring')} filter={`url(#${id('glow')})`} />}

        {/* Head */}
        <rect x="93" y="84" width="14" height="10" fill="#15121a" />
        <circle cx="100" cy="72" r="16" fill="#1b171f" />
        <Head classId={classId} accent={accent} trim={trim('helmet', '')} hasHelmet={has('helmet')} metal={`url(#${id('metal')})`} glow={`url(#${id('glow')})`} />

        {/* Weapons */}
        {classId === 'berserker' && <Axe trim={trim('weapon', '#6b7280')} metal={`url(#${id('metal')})`} glow={weaponGlow ? `url(#${id('glow')})` : undefined} />}
        {classId === 'guardian' && (
          <>
            <Sword trim={trim('weapon', '#6b7280')} metal={`url(#${id('metal')})`} glow={weaponGlow ? `url(#${id('glow')})` : undefined} />
            <Shield accent={accent} metal={`url(#${id('metal')})`} />
          </>
        )}
        {classId === 'assassin' && <Daggers trim={trim('weapon', '#6b7280')} metal={`url(#${id('metal')})`} glow={weaponGlow ? `url(#${id('glow')})` : undefined} />}
      </g>
    </svg>
  );
}

function ClassChest({ classId, accent, trim }: { classId: ClassId; accent: string; trim: string }) {
  switch (classId) {
    case 'berserker':
      // fur collar + blood-red war paint straps
      return (
        <g>
          <path d="M80 99 Q100 110 120 99 Q116 92 100 94 Q84 92 80 99 Z" fill="#57443a" />
          <path d="M84 104 L116 150" stroke={accent} strokeWidth="4" opacity="0.8" />
          <path d="M84 130 L112 128" stroke="#1a1418" strokeWidth="2" />
        </g>
      );
    case 'guardian':
      return (
        <g>
          <path d="M84 104 L116 104 L112 150 Q100 156 88 150 Z" fill="#3a3540" stroke={trim} strokeWidth="1.2" />
          <path d="M100 108 L100 146 M90 122 L110 122" stroke={accent} strokeWidth="3" />
        </g>
      );
    case 'assassin':
      return (
        <g>
          <path d="M80 100 L120 158 M120 100 L80 158" stroke="#3b2f35" strokeWidth="4" />
          <circle cx="100" cy="129" r="3" fill={accent} />
          <path d="M88 150 L112 150" stroke={trim} strokeWidth="1" opacity="0.8" />
        </g>
      );
    case 'shadowmage':
      return (
        <g>
          <path d="M92 98 L100 170 L108 98" fill="#241832" stroke={accent} strokeWidth="1" />
          <text x="100" y="138" textAnchor="middle" fontSize="9" fill={accent} opacity="0.9">ᛟ</text>
          <circle cx="100" cy="118" r="2.2" fill={accent} />
        </g>
      );
  }
}

function Pauldron({ cx, classId, accent, trim, metal, flip }: { cx: number; classId: ClassId; accent: string; trim: string; metal: string; flip?: boolean }) {
  const s = flip ? -1 : 1;
  if (classId === 'assassin' || classId === 'shadowmage') {
    return <ellipse cx={cx} cy="102" rx="9" ry="7" fill="#221c28" stroke={trim} strokeWidth="1" />;
  }
  return (
    <g>
      <ellipse cx={cx} cy="101" rx="13" ry="10" fill="#34303a" stroke={trim} strokeWidth="1.4" />
      {classId === 'berserker' && <path d={`M${cx - 4 * s} 94 L${cx - 12 * s} 80 L${cx + 2 * s} 92 Z`} fill="#d6d3d1" />}
      {classId === 'guardian' && <path d={`M${cx - 9} 99 Q${cx} 91 ${cx + 9} 99`} stroke={metal} strokeWidth="2.5" fill="none" />}
      <circle cx={cx} cy="103" r="2" fill={accent} />
    </g>
  );
}

function Head({ classId, accent, trim, hasHelmet, metal, glow }: { classId: ClassId; accent: string; trim: string; hasHelmet: boolean; metal: string; glow: string }) {
  const eyes = (
    <g filter={glow}>
      <ellipse cx="94" cy="74" rx="2.6" ry="1.4" fill={accent} />
      <ellipse cx="106" cy="74" rx="2.6" ry="1.4" fill={accent} />
    </g>
  );
  const helmStroke = hasHelmet ? trim : '#57505e';
  switch (classId) {
    case 'berserker':
      return (
        <g>
          <path d="M83 74 Q84 54 100 52 Q116 54 117 74 L112 80 L88 80 Z" fill="#3a3440" stroke={helmStroke} strokeWidth="1.4" />
          <path d="M86 62 Q70 58 66 40 Q78 50 90 56 Z" fill="#e7e5e4" />
          <path d="M114 62 Q130 58 134 40 Q122 50 110 56 Z" fill="#e7e5e4" />
          <rect x="98.5" y="68" width="3" height="14" fill="#2a2530" />
          {eyes}
        </g>
      );
    case 'guardian':
      return (
        <g>
          <path d="M84 84 L84 62 Q84 52 100 50 Q116 52 116 62 L116 84 Q100 90 84 84 Z" fill={metal} stroke={helmStroke} strokeWidth="1.5" />
          <rect x="87" y="71" width="26" height="4" rx="1" fill="#0b0a0e" />
          <rect x="98.5" y="75" width="3" height="10" fill="#0b0a0e" />
          <path d="M100 50 Q104 38 112 34" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
          <g filter={glow}>
            <rect x="91" y="72" width="5" height="2" fill={accent} />
            <rect x="104" y="72" width="5" height="2" fill={accent} />
          </g>
        </g>
      );
    case 'assassin':
      return (
        <g>
          <path d="M80 92 Q78 60 100 50 Q122 60 120 92 Q110 84 100 84 Q90 84 80 92 Z" fill="#17141b" stroke={helmStroke} strokeWidth="1.2" />
          <path d="M88 78 Q100 86 112 78 L112 86 Q100 92 88 86 Z" fill="#2b2530" />
          {eyes}
        </g>
      );
    case 'shadowmage':
      return (
        <g>
          <path d="M78 94 Q80 62 104 30 Q100 50 122 70 Q124 84 122 94 Q112 84 100 84 Q88 84 78 94 Z" fill="#1d1428" stroke={hasHelmet ? trim : accent} strokeWidth="1.2" />
          <ellipse cx="100" cy="76" rx="12" ry="10" fill="#07050a" />
          {eyes}
        </g>
      );
  }
}

function Axe({ trim, metal, glow }: { trim: string; metal: string; glow?: string }) {
  return (
    <g filter={glow}>
      <rect x="135" y="104" width="4" height="118" rx="1.5" fill="#4a3426" />
      <path d="M139 110 Q164 104 170 124 Q164 144 139 138 Z" fill={metal} stroke={trim} strokeWidth="1.5" />
      <path d="M135 112 Q120 116 118 124 Q120 132 135 136 Z" fill={metal} stroke={trim} strokeWidth="1.2" />
    </g>
  );
}

function Sword({ trim, metal, glow }: { trim: string; metal: string; glow?: string }) {
  return (
    <g filter={glow}>
      <path d="M134 150 L140 150 L141 76 L137 68 L133 76 Z" fill={metal} stroke={trim} strokeWidth="1" />
      <rect x="127" y="148" width="20" height="4" rx="1" fill={trim} />
      <rect x="135.5" y="152" width="3" height="14" fill="#3b2a20" />
    </g>
  );
}

function Shield({ accent, metal }: { accent: string; metal: string }) {
  return (
    <g>
      <path d="M44 118 L82 118 L80 160 Q63 182 46 160 Z" fill="#2b2731" stroke={metal} strokeWidth="3" />
      <path d="M63 124 L63 170 M50 140 L76 140" stroke={accent} strokeWidth="4" />
    </g>
  );
}

function Daggers({ trim, metal, glow }: { trim: string; metal: string; glow?: string }) {
  return (
    <g filter={glow}>
      <path d="M139 158 L142 158 L144 194 L140 200 L137 194 Z" fill={metal} stroke={trim} strokeWidth="1" />
      <rect x="134" y="155" width="13" height="3" rx="1" fill={trim} />
      <path d="M61 158 L64 158 L63 194 L59 200 L57 194 Z" fill={metal} stroke={trim} strokeWidth="1" />
      <rect x="55" y="155" width="13" height="3" rx="1" fill={trim} />
    </g>
  );
}

function Staff({ id, trim, glow }: { id: (n: string) => string; trim: string; glow: boolean }) {
  return (
    <g>
      <rect x="140" y="52" width="4" height="186" rx="2" fill="#2e2238" />
      <path d="M134 56 Q142 34 150 56" stroke={trim} strokeWidth="2" fill="none" />
      <circle cx="142" cy="46" r={glow ? 8 : 6.5} fill={trim} filter={`url(#${id('glow')})`} className="model-orb" />
    </g>
  );
}
