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

  const viewBox = crop === 'bust' ? (classId === 'monk' ? '64 24 72 72' : '48 34 104 104') : '0 0 200 260';
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


/** Mirrors an SVG path horizontally around x = 100 (the model's centre line). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);

/**
 * Realistic tattooed monk warrior: 7.5-head proportions, painted light and
 * shade, skin grain, layered steel pauldrons and twin spirit blades that
 * cast blue rim light on the body.
 */
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
  const u = (n: string) => `url(#${id(n)})`;
  const ink = '#1a1f2b';
  const shadow = '#2a170f';
  const leatherLine = '#6b5446';

  // Body silhouettes (also used to clip the skin grain)
  const HEAD = 'M100 31 C109 31 113.5 37.5 113.5 45 C113.5 49 112.8 52 111.6 54.5 C110 58.5 105.5 61.5 100 61.5 C94.5 61.5 90 58.5 88.4 54.5 C87.2 52 86.5 49 86.5 45 C86.5 37.5 91 31 100 31 Z';
  const NECK = 'M92 55 L108 55 L111 68 Q100 71 89 68 Z';
  const TRAPS = 'M89 65 Q80 67.5 72 73.5 L128 73.5 Q120 67.5 111 65 Z';
  const TORSO = 'M74 73 C82 71 92 72 100 73 C108 72 118 71 126 73 C128 82 126 92 122 100 C119 108 117 114 116.5 122 L83.5 122 C83 114 81 108 78 100 C74 92 72 82 74 73 Z';
  const DELT = 'M74 73 C68 74 64.5 79 64.5 86 C65 92 67 96 69 98 L77 92 C78 86 78 79 74 73 Z';
  const UPPER = 'M65 86 C61 95 59.8 105 60.8 114 L69.6 116.2 C71.5 109 74.5 101 77 92 Z';
  const FORE = 'M60.8 113 C57 120 54.5 132 54 144 L61 146 C62.5 136 66 125 69.6 116 Z';
  const FIST = 'M52.5 143 C50 145 50 151 52 154 C54.5 157 59 157 61 154 C62.5 151 62 146 60.5 143.5 Z';
  const skinParts = [HEAD, NECK, TRAPS, TORSO, DELT, mirror(DELT), UPPER, mirror(UPPER), FORE, mirror(FORE), FIST, mirror(FIST)];

  // Gear
  const BRACER = 'M58.8 122 L67.3 124 L62.8 145.5 L54.6 143.5 Z';
  const PLATE1 = 'M60 80 C60 71 68 66 78 68 C83 69 86 72 86 76 C80 75 72 76 66 81 C63.5 83 61.5 83 60 80 Z';
  const PLATE2 = 'M61 83 C66 79 74 77.5 84 78.5 L83 82 C75 81.5 68 83 63 87 Z';
  const PLATE3 = 'M62.5 88 C67 84.5 73 83 81 83.5 L80.3 86.8 C74 86.8 69 88.3 64.5 91.5 Z';
  const SPIKES = 'M65 74 Q58 66 55 56 Q63 63.5 70 71 Z M71 70 Q68 60 69.5 50 Q73.5 59.5 76.5 69 Z M78 68.5 Q80.5 59.5 85 53.5 Q83.5 62 82.3 70 Z';
  const LEG = 'M84 140 C80 155 78 168 78.5 182 C78 196 76.5 212 76 226 L86.5 227 C87 213 88.5 198 89 184 C91 170 95 156 98.5 142 Z';
  const BOOT = 'M73.5 224 L88 225 L89.5 234 C90 238 88 242 85 242 L67 242 C65 242 64.5 239.5 66 238 C69 236 72 232 73.5 224 Z';
  const TASSET_C = 'M88 127 L112 127 L114 158 L100 163 L86 158 Z';
  const TASSET_S = 'M82 126 L89 127 L86 158 L74 152 Z';
  const BLADE = 'M50.5 155 L61 158.5 L40 236 L31 246 L30 231 Z';
  const CORE = 'M55.5 159 L36.5 234';
  const GUARD = 'M47 146.5 L65.5 153.5';
  const RIM_ARM = 'M54.2 144 C54.5 132 57 120 60.8 113 C60 104 61 95 65 86';
  const RIM_LEG = 'M76 226 C76.5 212 78 196 78.5 182 C78 168 80 155 84 140';

  const both = (d: string, props: Record<string, unknown>) => (
    <>
      <path d={d} {...props} />
      <path d={mirror(d)} {...props} />
    </>
  );

  return (
    <g className={animate ? 'model-breathe' : ''}>
      <defs>
        <linearGradient id={id('mskin')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#b88e71" />
          <stop offset="45%" stopColor="#7f5943" />
          <stop offset="100%" stopColor="#3b271e" />
        </linearGradient>
        <radialGradient id={id('mpec')} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c49b7e" />
          <stop offset="100%" stopColor="#6e4a37" />
        </radialGradient>
        <linearGradient id={id('mleather')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4a372d" />
          <stop offset="100%" stopColor="#1c1416" />
        </linearGradient>
        <linearGradient id={id('mplate')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#9a99a3" />
          <stop offset="35%" stopColor="#4b4a53" />
          <stop offset="70%" stopColor="#24232a" />
          <stop offset="100%" stopColor="#6b6a74" />
        </linearGradient>
        <linearGradient id={id('mspike')} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="#5b5e66" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id={id('mcloth')} x1="0" x2="1">
          <stop offset="0%" stopColor="#2c2529" />
          <stop offset="100%" stopColor="#141013" />
        </linearGradient>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <filter id={id('soft2')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1" />
        </filter>
        <clipPath id={id('skinclip')}>
          {skinParts.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>

      {/* Spirit light behind the blades and on the ground */}
      <ellipse cx="42" cy="200" rx="34" ry="56" fill={u('spirit')} className={animate ? 'model-aura' : ''} />
      <ellipse cx="158" cy="200" rx="34" ry="56" fill={u('spirit')} className={animate ? 'model-aura' : ''} />
      <ellipse cx="34" cy="244" rx="16" ry="3.5" fill="#38bdf8" opacity="0.35" filter={u('soft2')} />
      <ellipse cx="166" cy="244" rx="16" ry="3.5" fill="#38bdf8" opacity="0.35" filter={u('soft2')} />

      {/* Legs: dark cloth, folds, shin wraps, boots */}
      {both(LEG, { fill: u('mcloth') })}
      {both('M82 150 Q86 156 85 164 M80.5 176 Q84 180 86.5 179 M81 190 Q83 194 86 193', { fill: 'none', stroke: '#000', strokeWidth: 1.4, opacity: 0.45, filter: u('soft') })}
      {[198, 204, 210, 216, 222].map((y) => (
        <g key={y}>
          {both(`M77 ${y} L87.5 ${y + 2.2}`, { stroke: '#5a4a40', strokeWidth: 2.6, strokeLinecap: 'round' })}
          {both(`M77.3 ${y - 0.8} L87.3 ${y + 1.3}`, { stroke: '#8a7462', strokeWidth: 0.5, opacity: 0.7 })}
        </g>
      ))}
      {both(BOOT, { fill: u('mleather'), stroke: trim('boots', '#120d0e'), strokeWidth: has('boots') ? 1.4 : 0.6 })}
      {both('M68 237 C72 236 78 236.5 86 237.5', { fill: 'none', stroke: leatherLine, strokeWidth: 0.7, opacity: 0.8 })}

      {/* Blue rim light on the legs */}
      {both(RIM_LEG, { fill: 'none', stroke: '#7dd3fc', strokeWidth: 1.1, opacity: 0.35, filter: u('soft') })}

      {/* Leather tassets with stitching and studs */}
      {both(TASSET_S, { fill: u('mleather'), stroke: trim('armor', '#120d0e'), strokeWidth: has('armor') ? 1.4 : 0.6 })}
      <path d={TASSET_C} fill={u('mleather')} stroke={trim('armor', '#120d0e')} strokeWidth={has('armor') ? 1.4 : 0.6} />
      <path d="M89.8 129 L91.6 156 M110.2 129 L108.4 156 M77 131 L75.5 150" fill="none" stroke="#a88f78" strokeWidth="0.5" strokeDasharray="1.2 1.4" opacity="0.6" />
      {[134, 142, 150].map((y) => (
        <g key={y}>
          <circle cx="94" cy={y} r="1.1" fill="#b8bcc4" />
          <circle cx="106" cy={y} r="1.1" fill="#b8bcc4" />
        </g>
      ))}
      <path d="M86 158 L100 163 L114 158" fill="none" stroke="#000" strokeWidth="2" opacity="0.4" filter={u('soft')} />

      {/* Arms (behind torso edges) */}
      {both(UPPER, { fill: u('mskin') })}
      {both(FORE, { fill: u('mskin') })}
      {/* biceps / triceps shading */}
      {both('M62 104 C63.5 110 66 113 69 114', { fill: 'none', stroke: shadow, strokeWidth: 2.2, opacity: 0.5, filter: u('soft') })}
      {both('M71 101 C68.5 99 67 95 67.5 91', { fill: 'none', stroke: '#e0b393', strokeWidth: 1.6, opacity: 0.35, filter: u('soft') })}
      {both('M58 126 C59 131 60 136 59.5 141', { fill: 'none', stroke: shadow, strokeWidth: 1.6, opacity: 0.45, filter: u('soft') })}
      {/* arm tattoo bands (right arm only) */}
      <path d="M61.5 99 C65 100.5 70 101 74 99.5 L73 103 C69 104.2 65 104 61 102.6 Z M61 105 C64.5 106.5 69 107 72.5 105.6 L71.8 108 C68 109.2 64.5 109 60.8 107.8 Z" fill={ink} opacity="0.85" />
      <path d="M62.5 110 Q66 113.5 64 118 Q67.5 114.5 69.5 110.5 Z" fill={ink} opacity="0.8" />

      {/* Torso */}
      <path d={TRAPS} fill={u('mskin')} />
      <path d={NECK} fill={u('mskin')} />
      <path d={TORSO} fill={u('mskin')} />
      {/* pecs with light from the upper left */}
      {both('M79 78 C86 75 95 76 99.3 79 L99.3 92 C93 96 85 95 80 90 C78.5 86 78.2 82 79 78 Z', { fill: u('mpec') })}
      {both('M80.5 90 C86 96 94 96.5 99.3 92.5', { fill: 'none', stroke: shadow, strokeWidth: 3.2, opacity: 0.8, filter: u('soft') })}
      {both('M82 80 C87 78 93 78.5 97 80.5', { fill: 'none', stroke: '#e6bea0', strokeWidth: 1.6, opacity: 0.35, filter: u('soft') })}
      {both('M76 92 C74 88 73.5 82 75 76', { fill: 'none', stroke: shadow, strokeWidth: 1.8, opacity: 0.55, filter: u('soft') })}
      <path d="M100 78 L100 121" stroke={shadow} strokeWidth="1.4" opacity="0.45" filter={u('soft')} />
      {/* abs */}
      {[99, 106, 113].map((y) => <g key={y}>{both(`M91.5 ${y} Q96 ${y + 1.6} 99.4 ${y + 0.6}`, { fill: 'none', stroke: shadow, strokeWidth: 1.6, opacity: 0.7, filter: u('soft') })}</g>)}
      {[96, 103, 110].map((y) => <g key={y}>{both(`M93 ${y + 2} Q96 ${y + 1} 98.5 ${y + 2.4}`, { fill: 'none', stroke: '#e0b393', strokeWidth: 1.5, opacity: 0.35, filter: u('soft') })}</g>)}
      {/* serratus / obliques */}
      {both('M80.5 96 Q84 99.5 83.2 103.5 M80 102 Q83.5 105.5 83 110 M82.5 112 Q86 117 85.5 121', { fill: 'none', stroke: shadow, strokeWidth: 1.2, opacity: 0.45, filter: u('soft') })}
      {/* form shadow on the far side of the body */}
      <path d="M126 73 C128 82 126 92 122 100 C119 108 117 114 116.5 122 L111 122 C112.5 112 116.5 102 119.5 94 C122.5 86 124 79 126 73 Z" fill={shadow} opacity="0.4" filter={u('soft')} />
      {/* chest & shoulder tattoo */}
      <path d="M75.5 76 Q82.5 83 80.5 92 Q84.5 86 86.5 80 Q83.5 77.5 75.5 76 Z M84 77 Q90.5 80 93.5 86.5 Q88 82.5 82.8 81.5 Z M78 95 Q81.5 99 80.5 104 Q83.5 100 83.8 96 Z" fill={ink} opacity="0.82" />
      <path d="M100 81 L103.5 86 L100 91 L96.5 86 Z" fill="none" stroke="#7dd3fc" strokeWidth="0.9" filter={u('glow')} className={animate ? 'model-orb' : ''} />

      {/* Skin grain over every bare surface */}
      <rect x="40" y="25" width="120" height="140" filter={u('grain')} clipPath={u('skinclip')} opacity="0.07" />

      {/* Harness, belt and buckle */}
      <path d="M76 76 L81 73 L121.5 118.5 L116.5 121.5 Z" fill={u('mleather')} />
      <path d="M78.6 75.8 L119 120" stroke="#a88f78" strokeWidth="0.45" strokeDasharray="1.2 1.4" opacity="0.6" />
      <circle cx="98.6" cy="96.5" r="2.6" fill={u('mplate')} stroke="#0e0c10" strokeWidth="0.5" />
      <path d="M83 120 L117 120 L118 127.5 L82 127.5 Z" fill={u('mleather')} stroke="#0e0c10" strokeWidth="0.6" />
      <rect x="95.5" y="119.2" width="9" height="9" rx="1.5" fill={u('mplate')} stroke="#0e0c10" strokeWidth="0.6" />
      <rect x="97.6" y="121.3" width="4.8" height="4.8" rx="0.8" fill="none" stroke="#d4d4d8" strokeWidth="0.5" opacity="0.8" />

      {/* Bracers */}
      {both(BRACER, { fill: u('mleather'), stroke: '#0e0c10', strokeWidth: 0.6 })}
      {both('M59.5 128 L66.5 129.8 M58 134 L65.2 135.8 M56.6 140 L63.8 141.8', { stroke: trim('gloves', leatherLine), strokeWidth: has('gloves') ? 1.4 : 0.9 })}

      {/* Twin spirit blades */}
      {[false, true].map((m) => {
        const f = (d: string) => (m ? mirror(d) : d);
        return (
          <g key={String(m)}>
            <path d={f(BLADE)} fill="#38bdf8" opacity="0.55" filter={u('soft2')} className={animate ? 'model-orb' : ''} />
            <path d={f(BLADE)} fill={u('blade')} stroke="#7dd3fc" strokeWidth="0.8" filter={u('glow')} />
            <path d={f(CORE)} stroke="#f0f9ff" strokeWidth="1.5" strokeLinecap="round" filter={u('glow')} />
            <path d={f('M50 170 L53 171 M46 186 L49 187 M42 202 L45 203 M38 218 L41 219')} stroke="#e0f2fe" strokeWidth="0.9" opacity="0.8" />
            <path d={f(GUARD)} stroke={trim('weapon', '#8b8f98')} strokeWidth="3.6" strokeLinecap="round" />
            <path d={f(GUARD)} stroke="#f1f5f9" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" transform="translate(0 -1)" />
          </g>
        );
      })}
      {both(FIST, { fill: u('mskin'), stroke: '#3b2419', strokeWidth: 0.6 })}
      {both('M53 147.5 C55.5 146.5 58.5 146.5 61 147.8 M52.6 151 C55.3 150 58.6 150 61.2 151.2', { fill: 'none', stroke: shadow, strokeWidth: 0.7, opacity: 0.7 })}
      {has('ring') && <circle cx="53.5" cy="149.5" r="1.6" fill={trim('ring')} filter={u('glow')} />}
      {/* blue rim light on arms */}
      {both(RIM_ARM, { fill: 'none', stroke: '#7dd3fc', strokeWidth: 1.4, opacity: 0.6, filter: u('soft') })}
      <circle cx="32" cy="186" r="1.3" fill="#e0f2fe" filter={u('glow')} className={animate ? 'model-orb' : ''} />
      <circle cx="170" cy="206" r="1.1" fill="#e0f2fe" filter={u('glow')} className={animate ? 'model-orb' : ''} />
      <circle cx="44" cy="228" r="0.9" fill="#e0f2fe" filter={u('glow')} />

      {/* Layered spiked pauldrons */}
      {[false, true].map((m) => {
        const f = (d: string) => (m ? mirror(d) : d);
        const edge = trim('armor', '#0e0c10');
        return (
          <g key={`p${m}`}>
            <path d={f(PLATE3)} fill={u('mplate')} stroke={edge} strokeWidth="0.7" />
            <path d={f(PLATE2)} fill={u('mplate')} stroke={edge} strokeWidth="0.7" />
            <path d={f(PLATE1)} fill={u('mplate')} stroke={edge} strokeWidth={has('armor') ? 1.3 : 0.7} />
            <path d={f('M63 77 C66 72 72 69.5 79 70')} fill="none" stroke="#fff" strokeWidth="1" opacity="0.45" filter={u('soft')} />
            <path d={f(SPIKES)} fill={u('mspike')} stroke="#1f2026" strokeWidth="0.4" />
            <circle cx={m ? 132 : 68} cy="84.8" r="0.9" fill="#d4d4d8" />
            <circle cx={m ? 124 : 76} cy="82.7" r="0.9" fill="#d4d4d8" />
          </g>
        );
      })}

      {/* Prayer beads */}
      <path d="M88.5 67.5 Q100 81 111.5 67.5" fill="none" stroke="#3a2618" strokeWidth="2.4" strokeDasharray="0.1 3.4" strokeLinecap="round" />
      <circle cx="100" cy="75.5" r="2" fill={trim('amulet', '#6b4a30')} filter={has('amulet') ? u('glow') : undefined} />

      {/* Head */}
      {both('M86.8 44 C85.2 44.5 85 50 86.9 51 Z', { fill: '#8a5e44' })}
      <path d={HEAD} fill={u('mskin')} />
      <ellipse cx="95" cy="37" rx="5.5" ry="3" fill="#fff" opacity="0.13" filter={u('soft')} />
      {/* scalp tattoo */}
      <path d="M100 32 Q98.8 38 100 44 Q101.2 38 100 32 Z" fill={ink} opacity="0.85" />
      {both('M93 34 Q90 39 92.5 44 Q92 39 95.5 35 Z M89 40 Q87.5 43 88.8 47 Q89.4 43.5 91 41.5 Z', { fill: ink, opacity: 0.85 })}
      {has('helmet') && <path d="M87 43 Q100 39 113 43" fill="none" stroke={trim('helmet')} strokeWidth="1.6" />}
      {/* brow ridge, eye sockets, glowing eyes */}
      {both('M90 44.5 Q95 42.3 99 44.3 L99 45.8 Q95 44.8 90 46.5 Z', { fill: shadow, opacity: 0.6, filter: u('soft') })}
      {both('M91.6 46.8 Q94.6 45.4 97.6 46.8 Q94.6 48.2 91.6 46.8 Z', { fill: '#1f120c', opacity: 0.8 })}
      <g filter={u('glow')}>
        <ellipse cx="94.6" cy="46.8" rx="1.5" ry="0.75" fill="#7dd3fc" />
        <ellipse cx="105.4" cy="46.8" rx="1.5" ry="0.75" fill="#7dd3fc" />
      </g>
      {/* nose, cheekbones */}
      <path d="M100.6 46.5 Q102.4 50.8 102.3 53.3 Q101 54.2 99.6 53.8 Z" fill={shadow} opacity="0.35" filter={u('soft')} />
      <path d="M99.6 46.8 L99.4 52.6" stroke="#e0b393" strokeWidth="0.7" opacity="0.45" />
      <path d="M97.4 53.9 Q100 55.1 102.6 53.9" fill="none" stroke="#3a2419" strokeWidth="0.7" />
      {both('M88.8 50 Q90.8 54.8 94 57', { fill: 'none', stroke: shadow, strokeWidth: 1.8, opacity: 0.35, filter: u('soft') })}
      {/* short beard and moustache */}
      <path d="M89 53 Q90 60 95 62.4 Q100 63.8 105 62.4 Q110 60 111 53 Q108 58.4 104 58.6 Q100 57.3 96 58.6 Q92 58.4 89 53 Z" fill="#1f1511" opacity="0.92" />
      <path d="M95.5 56.4 Q100 55 104.5 56.4 Q100 57.8 95.5 56.4 Z" fill="#170f0c" />
      <path d="M97.6 58.3 Q100 58.9 102.4 58.3" fill="none" stroke="#5a3526" strokeWidth="0.7" />
      {/* face grain */}
      <rect x="84" y="30" width="32" height="34" filter={u('grain')} clipPath={u('skinclip')} opacity="0.06" />
    </g>
  );
}
