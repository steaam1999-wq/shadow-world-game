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
        <linearGradient id={id('robe')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f1ece1" />
          <stop offset="60%" stopColor="#d8d2c4" />
          <stop offset="100%" stopColor="#a9a192" />
        </linearGradient>
        <linearGradient id={id('skin')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#a47d62" />
          <stop offset="55%" stopColor="#7a5a45" />
          <stop offset="100%" stopColor="#4a352a" />
        </linearGradient>
        <radialGradient id={id('spirit')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('blade')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0c4a6e" />
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

      {classId === 'monk' ? (
        <MonkBody id={id} trim={trim} has={has} animate={animate} />
      ) : classId === 'assassin' ? (
        <AssassinBody id={id} trim={trim} has={has} animate={animate} weaponGlow={weaponGlow} />
      ) : (
      <>
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
      </g>
      </>
      )}
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

function Staff({ id, trim, glow }: { id: (n: string) => string; trim: string; glow: boolean }) {
  return (
    <g>
      <rect x="140" y="52" width="4" height="186" rx="2" fill="#2e2238" />
      <path d="M134 56 Q142 34 150 56" stroke={trim} strokeWidth="2" fill="none" />
      <circle cx="142" cy="46" r={glow ? 8 : 6.5} fill={trim} filter={`url(#${id('glow')})`} className="model-orb" />
    </g>
  );
}

const IVORY_DARK = '#b3ab9b';
const LEATHER = '#5a3d2b';
const SASH = '#8b1a1a';

/** Hooded assassin: ivory robe with tails, red sash, hidden blade, sword at the hip. */
function AssassinBody({
  id,
  trim,
  has,
  animate,
  weaponGlow,
}: {
  id: (n: string) => string;
  trim: (slot: Slot, fallback?: string) => string;
  has: (slot: Slot) => boolean;
  animate: boolean;
  weaponGlow: boolean;
}) {
  const robe = `url(#${id('robe')})`;
  const metal = `url(#${id('metal')})`;
  const glow = `url(#${id('glow')})`;
  const brass = trim('ring', '#b08d3c');
  return (
    <g className={animate ? 'model-breathe' : ''}>
      {/* Back tail, split like a swallowtail */}
      <path className={animate ? 'model-cape' : ''} d="M82 166 L118 166 L128 234 L110 218 L100 236 L90 218 L72 234 Z" fill={IVORY_DARK} />
      <path d="M72 234 L90 218 L100 236 L110 218 L128 234" fill="none" stroke={SASH} strokeWidth="1.6" />

      {/* Legs and boots */}
      <path d="M84 168 L80 228 L95 228 L99 168 Z" fill="#2b2530" />
      <path d="M101 168 L105 228 L120 228 L116 168 Z" fill="#2b2530" />
      <path d="M76 214 L97 214 L99 241 L70 241 Z" fill={LEATHER} stroke={trim('boots', '#3a2a20')} strokeWidth={has('boots') ? 1.6 : 0.8} />
      <path d="M103 214 L124 214 L130 241 L101 241 Z" fill={LEATHER} stroke={trim('boots', '#3a2a20')} strokeWidth={has('boots') ? 1.6 : 0.8} />
      <path d="M77 222 L97 222 M103 222 L123 222" stroke="#3a2a20" strokeWidth="1.5" />

      {/* Sword in its scabbard on the left hip */}
      <g filter={weaponGlow ? glow : undefined}>
        <path d="M121 166 L127 163 L153 222 L148 225 Z" fill="#3b2a20" stroke={trim('weapon', '#2a1d16')} strokeWidth="1" />
        <path d="M147 219 L153 222 L152 227 L147 225 Z" fill={brass} />
        <path d="M113 162 L129 155" stroke={trim('weapon', '#9ca3af')} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M119 158 L114 146" stroke="#2a1d16" strokeWidth="3" strokeLinecap="round" />
        <circle cx="113.5" cy="144.5" r="2.4" fill={brass} />
      </g>

      {/* Sleeves */}
      <path d="M70 104 L58 150 L69 153 L80 110 Z" fill={robe} />
      <path d="M130 104 L142 150 L131 153 L120 110 Z" fill={robe} />

      {/* Robe */}
      <path d="M75 97 Q100 88 125 97 L121 171 Q100 179 79 171 Z" fill={robe} stroke={trim('armor', IVORY_DARK)} strokeWidth={has('armor') ? 1.8 : 0.8} />
      <path d="M96 94 L111 168" fill="none" stroke={IVORY_DARK} strokeWidth="1.4" />
      <path d="M79 140 Q88 146 96 142 M104 146 Q112 150 120 146" fill="none" stroke={IVORY_DARK} strokeWidth="0.8" opacity="0.8" />

      {/* Front coat tails with red hem */}
      <path d="M80 168 L98 168 L96 212 L77 208 Z" fill={robe} />
      <path d="M102 168 L120 168 L123 208 L104 212 Z" fill={robe} />
      <path d="M77 208 L96 212 M104 212 L123 208" stroke={SASH} strokeWidth="2" />

      {/* Chest strap with throwing knives */}
      <path d="M78 102 L118 158" stroke={LEATHER} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M86 111 l5 -3 M93 121 l5 -3 M100 131 l5 -3" stroke={metal} strokeWidth="2.2" />

      {/* Red sash, leather belt, own buckle emblem, pouches */}
      <rect x="78" y="157" width="44" height="13" rx="2" fill={SASH} />
      <rect x="78" y="161" width="44" height="5" fill={LEATHER} />
      <path d="M100 157.5 L105 163.5 L100 169.5 L95 163.5 Z" fill={brass} stroke="#6b5424" strokeWidth="0.6" />
      <circle cx="100" cy="163.5" r="1.3" fill="#2a1d16" />
      <rect x="81" y="166" width="9" height="10" rx="1.5" fill={LEATHER} stroke="#3a2a20" strokeWidth="0.6" />
      <rect x="110" y="166" width="7" height="8" rx="1.5" fill={LEATHER} stroke="#3a2a20" strokeWidth="0.6" />

      {/* Red capelet on the right shoulder */}
      <path className={animate ? 'model-cape' : ''} d="M62 97 Q74 89 90 95 L87 124 Q76 129 63 121 Z" fill={SASH} />
      <path d="M62 97 Q74 89 90 95" fill="none" stroke="#6b4f3a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M88 99 L116 104" stroke={LEATHER} strokeWidth="2" />
      <ellipse cx="126" cy="101" rx="9" ry="7" fill={LEATHER} stroke={trim('armor', '#3a2a20')} strokeWidth="1" />

      {/* Bracers; the left one hides the blade */}
      <path d="M60 136 L72 139 L69 153 L58 150 Z" fill={LEATHER} stroke={trim('gloves', '#3a2a20')} strokeWidth="0.8" />
      <path d="M140 136 L128 139 L131 153 L142 150 Z" fill={LEATHER} stroke={trim('gloves', '#3a2a20')} strokeWidth="0.8" />
      <path d="M131 142 L140 140 L141 146 L132 148 Z" fill={brass} />
      <g filter={weaponGlow ? glow : undefined}>
        <path d="M136 156 L139.5 156 L141 184 L138 190 L135.5 184 Z" fill={metal} stroke={trim('weapon', '#6b7280')} strokeWidth="0.8" />
      </g>

      {/* Gloves */}
      <circle cx="63" cy="154" r="6.5" fill="#3a2a20" stroke={trim('gloves', '#2a1d16')} strokeWidth={has('gloves') ? 1.8 : 0.8} />
      <circle cx="137" cy="154" r="6.5" fill="#3a2a20" stroke={trim('gloves', '#2a1d16')} strokeWidth={has('gloves') ? 1.8 : 0.8} />
      {has('ring') && <circle cx="60" cy="157" r="2" fill={trim('ring')} filter={glow} />}
      {has('amulet') && <circle cx="100" cy="112" r="3" fill={trim('amulet')} filter={glow} />}

      {/* Hood with a beak-shaped peak; the face stays in shadow */}
      <rect x="93" y="84" width="14" height="10" fill="#2b2023" />
      <path d="M78 98 Q74 62 100 46 Q126 62 122 98 Q112 88 100 88 Q88 88 78 98 Z" fill={robe} stroke={trim('helmet', IVORY_DARK)} strokeWidth={has('helmet') ? 1.8 : 1} />
      <path d="M86 86 Q88 64 100 60 Q112 64 114 86 Q100 93 86 86 Z" fill="#0c0a0e" />
      <path d="M94 88 Q100 92 106 88 L104 84 Q100 86 96 84 Z" fill="#3a2e2a" />
      <path d="M88 66 Q100 55 112 66 L100 80 Z" fill={robe} stroke={IVORY_DARK} strokeWidth="0.8" />
      <path d="M100 48 Q98 60 100 70" fill="none" stroke={IVORY_DARK} strokeWidth="0.8" />
      <path d="M94 80 L96 80 M104 80 L106 80" stroke="#6b6358" strokeWidth="1.2" opacity="0.7" />
    </g>
  );
}

const TATTOO = '#1b2433';
const SPIRIT = '#38bdf8';

/** Mirrors an SVG path horizontally around x = 100 (the model's centre line). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);

/** Tattooed monk warrior with spiked pauldrons and twin spirit blades. */
function MonkBody({
  id,
  trim,
  has,
  animate,
}: {
  id: (n: string) => string;
  trim: (slot: Slot, fallback?: string) => string;
  has: (slot: Slot) => boolean;
  animate: boolean;
}) {
  const skin = `url(#${id('skin')})`;
  const metal = `url(#${id('metal')})`;
  const glow = `url(#${id('glow')})`;
  const bladeFill = `url(#${id('blade')})`;
  const leather = '#2a2226';
  const plate = '#3a3540';
  const hilt = trim('weapon', '#9ca3af');

  // One blade + hilt held in the left hand (viewer side); the right one is mirrored.
  const bladeL = 'M44 167 L59 171 L38 236 L23 247 L23 229 Z';
  const coreL = 'M51 172 L31 232';
  const guardL = 'M40 160 L60 168';
  const armUpL = 'M73 104 L57 132';
  const armLowL = 'M57 132 L49 158';
  const bracerL = 'M55 139 L50 154';
  const spikesL = 'M62 98 L52 84 L68 94 Z M70 94 L66 78 L76 92 Z M79 93 L81 79 L85 94 Z';

  return (
    <g className={animate ? 'model-breathe' : ''}>
      {/* Spirit light behind the blades */}
      <ellipse cx="38" cy="205" rx="30" ry="48" fill={`url(#${id('spirit')})`} className={animate ? 'model-aura' : ''} />
      <ellipse cx="162" cy="205" rx="30" ry="48" fill={`url(#${id('spirit')})`} className={animate ? 'model-aura' : ''} />

      {/* Legs in a wide heroic stance, wrapped shins, boots */}
      <path d="M86 170 L72 232 L88 234 L99 172 Z" fill="#1f1a1f" />
      <path d="M114 170 L128 232 L112 234 L101 172 Z" fill="#1f1a1f" />
      <path d="M76 208 L90 211 M75 216 L89 219 M74 224 L88 227" stroke="#4a3f3a" strokeWidth="2" />
      <path d="M124 208 L110 211 M125 216 L111 219 M126 224 L112 227" stroke="#4a3f3a" strokeWidth="2" />
      <path d="M69 230 L90 232 L92 242 L64 242 Z" fill={leather} stroke={trim('boots', '#4a3f3a')} strokeWidth={has('boots') ? 1.6 : 0.8} />
      <path d="M131 230 L110 232 L108 242 L136 242 Z" fill={leather} stroke={trim('boots', '#4a3f3a')} strokeWidth={has('boots') ? 1.6 : 0.8} />

      {/* Leather tassets with studs */}
      <path d="M77 158 L123 158 L130 198 L111 191 L100 202 L89 191 L70 198 Z" fill={leather} stroke={trim('armor', '#4a3f3a')} strokeWidth={has('armor') ? 1.8 : 0.8} />
      <path d="M89 162 L89 190 M111 162 L111 190" stroke="#1a1418" strokeWidth="1.5" />
      <circle cx="80" cy="172" r="1.4" fill={metal} />
      <circle cx="120" cy="172" r="1.4" fill={metal} />
      <circle cx="100" cy="180" r="1.4" fill={metal} />

      {/* Muscular bare torso */}
      <path d="M71 98 Q100 88 129 98 L123 158 Q100 165 77 158 Z" fill={skin} />
      <path d="M79 110 Q90 104 99 110 Q99 122 88 124 Q80 122 79 110 Z M121 110 Q110 104 101 110 Q101 122 112 124 Q120 122 121 110 Z" fill="#000" opacity="0.14" />
      <path d="M100 126 L100 156 M91 132 L109 132 M92 141 L108 141 M93 150 L107 150" stroke="#3b2a20" strokeWidth="0.9" opacity="0.7" />
      {/* Tribal tattoos on chest and shoulders */}
      <path d="M78 104 Q86 112 84 122 Q80 116 76 118 M84 106 Q92 108 96 116 M72 128 Q78 132 80 142" fill="none" stroke={TATTOO} strokeWidth="2" strokeLinecap="round" />
      <path d={mirror('M78 104 Q86 112 84 122 Q80 116 76 118 M84 106 Q92 108 96 116 M72 128 Q78 132 80 142')} fill="none" stroke={TATTOO} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 112 L104 118 L100 124 L96 118 Z" fill="none" stroke={SPIRIT} strokeWidth="1" opacity="0.8" filter={glow} />

      {/* Chest harness and belt */}
      <path d="M76 100 L124 156" stroke={leather} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="128" r="3" fill={metal} />
      <rect x="76" y="154" width="48" height="8" rx="2" fill="#1a1418" />
      <rect x="95" y="152" width="10" height="12" rx="2" fill={plate} stroke={metal} strokeWidth="1" />

      {/* Arms: muscles, tattoo bands, bracers */}
      <path d={armUpL} stroke={skin} strokeWidth="14" strokeLinecap="round" />
      <path d={armLowL} stroke={skin} strokeWidth="11" strokeLinecap="round" />
      <path d={mirror(armUpL)} stroke={skin} strokeWidth="14" strokeLinecap="round" />
      <path d={mirror(armLowL)} stroke={skin} strokeWidth="11" strokeLinecap="round" />
      <path d="M62 114 L72 119 M60 119 L70 124" stroke={TATTOO} strokeWidth="1.8" />
      <path d={mirror('M62 114 L72 119 M60 119 L70 124')} stroke={TATTOO} strokeWidth="1.8" />
      <path d={bracerL} stroke={leather} strokeWidth="12" strokeLinecap="round" />
      <path d={mirror(bracerL)} stroke={leather} strokeWidth="12" strokeLinecap="round" />
      <path d={bracerL} stroke={trim('gloves', '#4a3f3a')} strokeWidth="12" strokeOpacity={has('gloves') ? 0.5 : 0.15} strokeLinecap="round" fill="none" />
      <path d={mirror(bracerL)} stroke={trim('gloves', '#4a3f3a')} strokeWidth="12" strokeOpacity={has('gloves') ? 0.5 : 0.15} strokeLinecap="round" fill="none" />

      {/* Twin spirit blades */}
      {[false, true].map((m) => (
        <g key={String(m)}>
          <path d={m ? mirror(bladeL) : bladeL} fill={bladeFill} stroke={SPIRIT} strokeWidth="1.2" filter={glow} />
          <path d={m ? mirror(coreL) : coreL} stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" filter={glow} className={animate ? 'model-orb' : ''} />
          <path d={m ? mirror(guardL) : guardL} stroke={hilt} strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="49" cy="161" r="6.5" fill={skin} stroke="#3b2a20" strokeWidth="0.8" />
      <circle cx="151" cy="161" r="6.5" fill={skin} stroke="#3b2a20" strokeWidth="0.8" />
      {has('ring') && <circle cx="45" cy="163" r="2" fill={trim('ring')} filter={glow} />}
      <circle cx="30" cy="190" r="1.6" fill="#bae6fd" filter={glow} className={animate ? 'model-orb' : ''} />
      <circle cx="170" cy="200" r="1.4" fill="#bae6fd" filter={glow} className={animate ? 'model-orb' : ''} />

      {/* Spiked pauldrons */}
      <ellipse cx="72" cy="101" rx="14" ry="10" fill={plate} stroke={trim('armor', '#57505e')} strokeWidth="1.4" />
      <ellipse cx="128" cy="101" rx="14" ry="10" fill={plate} stroke={trim('armor', '#57505e')} strokeWidth="1.4" />
      <path d={spikesL} fill={metal} />
      <path d={mirror(spikesL)} fill={metal} />

      {/* Neck, prayer beads, head */}
      <path d="M91 82 L109 82 L113 97 L87 97 Z" fill={skin} />
      <path d="M84 98 Q100 112 116 98" fill="none" stroke="#3b2a20" strokeWidth="2.5" strokeDasharray="0.1 4.5" strokeLinecap="round" />
      <circle cx="100" cy="107" r="3" fill={trim('amulet', '#7c5a3a')} filter={has('amulet') ? glow : undefined} />
      <ellipse cx="100" cy="68" rx="15" ry="18" fill={skin} />
      <path d="M86 76 Q88 88 100 90 Q112 88 114 76 Q112 84 100 85 Q88 84 86 76 Z" fill="#2a1f1a" />
      <ellipse cx="85" cy="70" rx="2.5" ry="4" fill="#6b4e3c" />
      <ellipse cx="115" cy="70" rx="2.5" ry="4" fill="#6b4e3c" />
      {/* Scalp tattoo */}
      <path d="M100 51 L100 60 M92 54 Q96 58 94 64 M108 54 Q104 58 106 64 M88 60 Q90 64 88 68 M112 60 Q110 64 112 68" fill="none" stroke={TATTOO} strokeWidth="1.8" strokeLinecap="round" />
      {has('helmet') && <path d="M86 62 Q100 56 114 62" fill="none" stroke={trim('helmet')} strokeWidth="2.5" />}
      {/* Brow and glowing eyes */}
      <path d="M90 67 L97 69 M110 67 L103 69" stroke="#2a1f1a" strokeWidth="2" strokeLinecap="round" />
      <g filter={glow}>
        <ellipse cx="94" cy="71.5" rx="2.4" ry="1.2" fill={SPIRIT} />
        <ellipse cx="106" cy="71.5" rx="2.4" ry="1.2" fill={SPIRIT} />
      </g>
    </g>
  );
}
