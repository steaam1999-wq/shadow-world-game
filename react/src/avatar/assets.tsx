/**
 * Реестр визуальных ассетов экипировки: visualAssetId → слой.
 *
 * Все слои рисуются на общем холсте 200×420 (персонаж стоит лицом к зрителю,
 * правая для зрителя рука держит оружие). Поэтому любой слой можно заменить
 * растровым спрайтом того же размера: укажите src вместо draw.
 *
 * z — порядок отрисовки (больше — выше): тело 0 → ноги 10 → обувь 20 → торс 30 →
 * верхняя одежда 50 → шея 55 → оружие 60 → голова 70 → лицо 80.
 */
import type { ReactNode } from "react";

export type VisualAsset = { z: number; draw?: () => ReactNode; src?: string };

const C = { line: "#0b0f0d", lw: 1.1 };
/** Деталь одежды с тонким контуром. */
const P = ({ d, fill, o = 1 }: { d: string; fill: string; o?: number }) => (
  <path d={d} fill={fill} stroke={C.line} strokeWidth={C.lw} strokeLinejoin="round" opacity={o} />
);
/** Линия (швы, молнии, шнурки). */
const L = ({ d, stroke, w = 1, o = 1 }: { d: string; stroke: string; w?: number; o?: number }) => (
  <path d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" opacity={o} />
);
/** Мягкий блик ткани поверх формы. */
const Sheen = ({ d }: { d: string }) => <path d={d} fill="url(#av-sheen)" />;

// общие контуры
const TORSO = "M62 92 Q100 82 138 92 L141 150 L133 212 L67 212 L59 150 Z";
const SLEEVE_L = "M63 93 Q49 99 46 140 L43 200 Q43 226 47 236 L59 236 Q60 220 61 200 L67 146 Z";
const SLEEVE_R = "M137 93 Q151 99 154 140 L157 200 Q157 226 153 236 L141 236 Q140 220 139 200 L133 146 Z";
const LEGS = "M66 204 L134 204 L130 300 L124 390 L106 390 L102 262 L98 262 L94 390 L76 390 L70 300 Z";
const shoe = (top: number, fill: string, sole: string) => (
  <>
    <P d={`M73 ${top} L96 ${top} L98 398 Q98 405 91 405 L69 405 Q65 405 66 399 Z`} fill={fill} />
    <P d={`M127 ${top} L104 ${top} L102 398 Q102 405 109 405 L131 405 Q135 405 134 399 Z`} fill={fill} />
    <L d="M66 401 H98 M102 401 H134" stroke={sole} w={2.4} />
  </>
);

export const ASSETS: Record<string, VisualAsset> = {
  // ---------- ноги ----------
  legs_jeans: { z: 10, draw: () => (<>
    <P d={LEGS} fill="#2f4a6b" /><Sheen d="M70 210 L96 210 L94 380 L80 380 Z" />
    <L d="M100 208 V262 M80 214 Q88 222 94 214 M74 300 L78 386 M126 300 L122 386" stroke="#1d3049" />
    <P d="M66 202 H134 V210 H66 Z" fill="#273f5c" /></>) },
  legs_joggers: { z: 10, draw: () => (<>
    <P d="M66 204 L134 204 L130 300 L122 384 L106 384 L102 262 L98 262 L94 384 L78 384 L70 300 Z" fill="#3a3d42" />
    <P d="M78 378 H94 V390 H78 Z M106 378 H122 V390 H106 Z" fill="#2c2f33" />
    <L d="M68 230 L74 300 L80 378 M132 230 L126 300 L120 378" stroke="#e8e8e8" w={1.6} o={0.8} />
    <L d="M96 210 L94 222 M104 210 L106 222" stroke="#cfcfcf" /></>) },
  legs_cargo: { z: 10, draw: () => (<>
    <P d={LEGS} fill="#6b6a52" /><Sheen d="M72 212 L95 212 L93 380 L80 380 Z" />
    <P d="M66 262 H80 V292 H68 Z" fill="#5d5c46" /><P d="M134 262 H120 V292 H132 Z" fill="#5d5c46" />
    <L d="M100 208 V262" stroke="#4e4d3a" /></>) },
  legs_tactical: { z: 10, draw: () => (<>
    <P d={LEGS} fill="#353b2e" />
    <P d="M74 300 H94 V322 H75 Z" fill="#23271f" /><P d="M126 300 H106 V322 H125 Z" fill="#23271f" />
    <P d="M66 250 H79 V278 H68 Z" fill="#2c3127" /><P d="M134 250 H121 V278 H132 Z" fill="#2c3127" />
    <P d="M66 202 H134 V211 H66 Z" fill="#1b1e18" /></>) },

  // ---------- обувь ----------
  feet_sneakers: { z: 20, draw: () => shoe(386, "#ecebe6", "#9a9a94") },
  feet_boots: { z: 20, draw: () => (<>{shoe(374, "#5a3b26", "#2a1a10")}<L d="M80 378 H92 M80 384 H92 M108 378 H120 M108 384 H120" stroke="#2a1a10" w={1} /></>) },
  feet_runners: { z: 20, draw: () => (<>{shoe(384, "#16181b", "#7cff6a")}<L d="M76 392 L92 388 M124 392 L108 388" stroke="#7cff6a" w={1.4} /></>) },
  feet_tactical: { z: 20, draw: () => (<>{shoe(364, "#141516", "#000")}<L d="M80 370 H92 M80 376 H92 M80 382 H92 M108 370 H120 M108 376 H120 M108 382 H120" stroke="#3a3b3c" w={1} /></>) },

  // ---------- торс ----------
  chest_tee: { z: 30, draw: () => (<>
    <P d={TORSO} fill="#16181b" />
    <P d="M64 93 Q50 99 47 128 L60 132 L66 108 Z" fill="#16181b" /><P d="M136 93 Q150 99 153 128 L140 132 L134 108 Z" fill="#16181b" />
    <Sheen d="M70 100 L96 96 L94 200 L72 200 Z" /><L d="M90 88 Q100 96 110 88" stroke="#000" w={1.4} /></>) },
  chest_hoodie: { z: 30, draw: () => (<>
    <P d="M84 82 Q100 70 116 82 Q113 95 100 97 Q87 95 84 82 Z" fill="#3f444a" />
    <P d={SLEEVE_L} fill="#4a4f55" /><P d={SLEEVE_R} fill="#4a4f55" />
    <P d="M62 92 Q100 82 138 92 L141 150 L134 216 L66 216 L59 150 Z" fill="#4a4f55" />
    <Sheen d="M70 100 L96 96 L94 206 L72 206 Z" />
    <P d="M80 172 H120 L124 202 H76 Z" fill="#41464c" />
    <L d="M95 96 L94 120 M105 96 L106 120" stroke="#d9d9d9" w={1.2} />
    <P d="M45 228 H60 V238 H46 Z M155 228 H140 V238 H154 Z" fill="#3f444a" /></>) },
  chest_track: { z: 30, draw: () => (<>
    <P d={SLEEVE_L} fill="#1e2a44" /><P d={SLEEVE_R} fill="#1e2a44" />
    <P d="M62 92 Q100 82 138 92 L141 150 L134 214 L66 214 L59 150 Z" fill="#1e2a44" />
    <Sheen d="M70 100 L96 96 L94 206 L72 206 Z" />
    <L d="M100 90 V214" stroke="#c9c9c9" w={1.2} /><P d="M90 86 L100 84 L110 86 L108 94 L92 94 Z" fill="#172137" />
    <L d="M55 100 L48 160 L46 228 M145 100 L152 160 L154 228" stroke="#f2f2f2" w={2.2} /></>) },
  chest_vest: { z: 30, draw: () => (<>
    <P d={TORSO} fill="#1d1f22" />
    <P d="M64 93 Q50 99 47 128 L60 132 L66 108 Z" fill="#1d1f22" /><P d="M136 93 Q150 99 153 128 L140 132 L134 108 Z" fill="#1d1f22" />
    <P d="M68 98 Q100 90 132 98 L135 150 L129 200 L71 200 L65 150 Z" fill="#2f353a" />
    <P d="M72 150 H128 V164 H72 Z" fill="#262b2f" /><L d="M78 104 V148 M122 104 V148" stroke="#1a1d20" w={2} />
    <P d="M86 110 H114 V128 H86 Z" fill="#3a4147" /></>) },

  // ---------- верхняя одежда ----------
  outer_bomber: { z: 50, draw: () => (<>
    <P d="M62 92 Q48 98 45 140 L42 200 Q42 226 46 236 L60 236 Q61 220 62 200 L68 146 Z" fill="#4b5a3a" />
    <P d="M138 92 Q152 98 155 140 L158 200 Q158 226 154 236 L140 236 Q139 220 138 200 L132 146 Z" fill="#4b5a3a" />
    <P d="M60 90 Q80 84 95 92 L93 214 L66 214 L56 150 Z" fill="#4b5a3a" /><P d="M140 90 Q120 84 105 92 L107 214 L134 214 L144 150 Z" fill="#4b5a3a" />
    <Sheen d="M64 100 L90 96 L88 206 L68 206 Z" />
    <P d="M66 206 H93 V218 H67 Z M134 206 H107 V218 H133 Z" fill="#3a4630" />
    <L d="M94 96 L93 212 M106 96 L107 212" stroke="#d07a2a" w={1.4} />
    <P d="M86 86 Q100 80 114 86 L112 92 Q100 88 88 92 Z" fill="#3a4630" />
    <P d="M43 226 H60 V238 H44 Z M157 226 H140 V238 H156 Z" fill="#3a4630" /></>) },
  outer_leather: { z: 50, draw: () => (<>
    <P d="M62 92 Q48 98 45 140 L42 200 Q42 226 46 236 L60 236 Q61 220 62 200 L68 146 Z" fill="#141516" />
    <P d="M138 92 Q152 98 155 140 L158 200 Q158 226 154 236 L140 236 Q139 220 138 200 L132 146 Z" fill="#141516" />
    <P d="M60 90 Q80 84 97 92 L95 212 L66 212 L56 150 Z" fill="#17181a" /><P d="M140 90 Q120 84 103 92 L105 212 L134 212 L144 150 Z" fill="#17181a" />
    <P d="M84 90 L97 92 L92 126 L76 106 Z" fill="#202124" /><P d="M116 90 L103 92 L108 126 L124 106 Z" fill="#202124" />
    <Sheen d="M62 104 L84 112 L86 200 L68 200 Z" /><Sheen d="M48 130 L56 128 L54 220 L46 220 Z" />
    <L d="M104 130 L108 210" stroke="#9a9a9a" w={1} /><L d="M70 160 L84 158 M116 158 L130 160" stroke="#3a3b3e" w={1.4} /></>) },
  outer_puffer: { z: 50, draw: () => (<>
    <P d="M60 90 Q44 98 41 140 L38 202 Q38 228 43 238 L60 238 Q61 220 62 202 L68 146 Z" fill="#1d2b3a" />
    <P d="M140 90 Q156 98 159 140 L162 202 Q162 228 157 238 L140 238 Q139 220 138 202 L132 146 Z" fill="#1d2b3a" />
    <P d="M56 88 Q100 78 144 88 L148 150 L138 220 L62 220 L52 150 Z" fill="#22334a" />
    <L d="M56 110 Q100 104 144 110 M54 132 Q100 126 146 132 M55 154 Q100 148 145 154 M58 176 Q100 170 142 176 M60 198 Q100 192 140 198" stroke="#152232" w={1.4} />
    <L d="M44 120 L60 120 M42 150 L60 150 M40 180 L60 180 M156 120 L140 120 M158 150 L140 150 M160 180 L140 180" stroke="#152232" w={1.2} />
    <P d="M84 78 Q100 72 116 78 L116 92 Q100 88 84 92 Z" fill="#1a2838" /><L d="M100 86 V220" stroke="#8a96a4" w={1} />
    <Sheen d="M64 96 L92 92 L90 210 L70 210 Z" /></>) },
  outer_plate: { z: 50, draw: () => (<>
    <P d="M74 88 H86 V100 H74 Z M126 88 H114 V100 H126 Z" fill="#5a503a" />
    <P d="M67 96 Q100 90 133 96 L135 196 L65 196 Z" fill="#6e6248" />
    <P d="M74 104 H126 V146 H74 Z" fill="#7a6d52" />
    <P d="M70 160 H88 V194 H70 Z M91 160 H109 V194 H91 Z M112 160 H130 V194 H112 Z" fill="#5f5540" />
    <L d="M76 110 H124 M76 118 H124 M76 126 H124" stroke="#5f5540" w={1} /></>) },
  outer_tactical: { z: 50, draw: () => (<>
    <P d="M62 92 Q48 98 45 140 L42 200 Q42 226 46 236 L60 236 Q61 220 62 200 L68 146 Z" fill="#2c3127" />
    <P d="M138 92 Q152 98 155 140 L158 200 Q158 226 154 236 L140 236 Q139 220 138 200 L132 146 Z" fill="#2c3127" />
    <P d="M52 96 Q60 88 70 92 L68 112 L52 112 Z M148 96 Q140 88 130 92 L132 112 L148 112 Z" fill="#141516" />
    <P d="M66 94 Q100 88 134 94 L136 200 L64 200 Z" fill="#17191b" />
    <P d="M72 102 H128 V144 H72 Z" fill="#202326" />
    <P d="M68 158 H86 V196 H68 Z M89 158 H111 V196 H89 Z M114 158 H132 V196 H114 Z" fill="#111214" />
    <P d="M84 108 H116 V118 H84 Z" fill="#3b4232" /></>) },

  // ---------- шея ----------
  neck_chain: { z: 55, draw: () => (<><L d="M90 86 Q100 106 110 86" stroke="#7a5a10" w={2.6} /><L d="M90 86 Q100 106 110 86" stroke="#e6c25a" w={1.5} /></>) },
  neck_heavy: { z: 55, draw: () => (<>
    <L d="M88 86 Q100 114 112 86" stroke="#7a5a10" w={4} /><L d="M88 86 Q100 114 112 86" stroke="#f0cf6a" w={2.6} />
    <P d="M96 104 H104 L106 116 L100 122 L94 116 Z" fill="#f0cf6a" /></>) },

  // ---------- оружие (в правой для зрителя руке) ----------
  weapon_knuckles: { z: 60, draw: () => (<><P d="M140 240 H155 V250 H140 Z" fill="#c9a14a" /><L d="M143 245 h1 M147 245 h1 M151 245 h1" stroke="#7a5a10" w={2} /></>) },
  weapon_bat: { z: 60, draw: () => (<><P d="M144 238 L150 236 L176 356 Q178 366 170 368 Q162 368 162 360 Z" fill="#b98a55" /><P d="M142 232 H152 V240 H142 Z" fill="#3a2a1a" /><Sheen d="M150 250 L154 249 L172 352 L168 353 Z" /></>) },
  weapon_knife: { z: 60, draw: () => (<><P d="M143 236 H151 V252 H143 Z" fill="#1a1b1c" /><P d="M144 252 L150 252 L149 286 L145 278 Z" fill="#c8ced3" /></>) },
  weapon_pistol: { z: 60, draw: () => (<><P d="M141 238 H153 V256 H141 Z" fill="#232527" /><P d="M143 254 H153 V286 H143 Z" fill="#2b2e31" /><L d="M146 258 V284" stroke="#4a4e52" /></>) },
  weapon_silencer: { z: 60, draw: () => (<><P d="M141 238 H153 V256 H141 Z" fill="#1d1f21" /><P d="M143 254 H153 V284 H143 Z" fill="#26292c" /><P d="M144 284 H152 V312 H144 Z" fill="#111213" /></>) },
  weapon_smg: { z: 60, draw: () => (<><P d="M139 236 H155 V254 H139 Z" fill="#1d1f21" /><P d="M140 252 H156 V300 H140 Z" fill="#26292c" /><P d="M154 262 H162 V284 H154 Z" fill="#141516" /><P d="M144 300 H151 V316 H144 Z" fill="#141516" /></>) },
  weapon_carbine: { z: 60, draw: () => (<>
    <P d="M128 196 L140 192 L176 372 L166 376 Z" fill="#202224" />
    <P d="M124 186 L138 180 L144 206 L130 212 Z" fill="#2c2f32" />
    <P d="M150 262 L162 258 L168 286 L156 290 Z" fill="#141516" /><L d="M140 222 L170 370" stroke="#3c4044" /></>) },

  // ---------- голова ----------
  head_cap: { z: 70, draw: () => (<>
    <P d="M83 40 Q83 23 100 22 Q117 23 117 40 Q100 36 83 40 Z" fill="#141516" />
    <P d="M84 39 Q100 35 116 39 L119 43 Q100 48 81 43 Z" fill="#0d0e0f" /><circle cx="100" cy="30" r="2" fill="#d9b56a" /></>) },
  head_beanie: { z: 70, draw: () => (<>
    <P d="M83 42 Q82 19 100 18 Q118 19 117 42 Z" fill="#2a2d31" />
    <P d="M82 34 H118 V43 H82 Z" fill="#23262a" /><L d="M88 22 V34 M94 20 V34 M100 19 V34 M106 20 V34 M112 22 V34" stroke="#1d2023" /></>) },
  head_balaclava: { z: 70, draw: () => (<>
    <P d="M82 46 Q82 24 100 24 Q118 24 118 46 Q118 70 100 70 Q82 70 82 46 Z M90 72 H110 L112 88 H88 Z" fill="#111213" />
    <P d="M88 41 H112 Q112 50 100 50 Q88 50 88 41 Z" fill="#c69c82" />
    <ellipse cx="94.5" cy="45.5" rx="1.8" ry="1.1" fill="#1b1410" /><ellipse cx="105.5" cy="45.5" rx="1.8" ry="1.1" fill="#1b1410" /></>) },
  head_helmet: { z: 70, draw: () => (<>
    <P d="M80 44 Q79 17 100 16 Q121 17 120 44 L116 46 L84 46 Z" fill="#4a5038" />
    <P d="M78 38 H86 V46 H79 Z M122 38 H114 V46 H121 Z" fill="#2e3324" /><L d="M86 28 H114" stroke="#2e3324" w={2} />
    <Sheen d="M84 22 L98 19 L96 40 L84 40 Z" /></>) },

  // ---------- лицо ----------
  face_shades: { z: 80, draw: () => (<>
    <P d="M87 42 H98 Q98 50 92.5 50 Q87 50 87 42 Z" fill="#0c0d0e" /><P d="M102 42 H113 Q113 50 107.5 50 Q102 50 102 42 Z" fill="#0c0d0e" />
    <L d="M98 43.5 H102 M87 43 L84 42 M113 43 L116 42" stroke="#0c0d0e" w={1.2} /><L d="M89 44 L92 44" stroke="#ffffff" o={0.35} /></>) },
  face_tactical: { z: 80, draw: () => (<>
    <P d="M85 41 Q100 38 115 41 L114 48 Q107 51 100 49 Q93 51 86 48 Z" fill="#e29a2a" o={0.85} />
    <L d="M85 43 L82 42 M115 43 L118 42" stroke="#111" w={1.4} /></>) },
};

/** Рендер одного слоя: векторный draw() или растровый спрайт того же холста 200×420. */
export function renderAsset(id: string): ReactNode {
  const a = ASSETS[id];
  if (!a) return null;
  if (a.src) return <image href={a.src} x={0} y={0} width={200} height={420} preserveAspectRatio="xMidYMid meet" />;
  return a.draw?.() ?? null;
}
