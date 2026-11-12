// =====================================================================
//  Манифест готовых 3D-моделей ARCANE SURVIVORS.
//  Положи файлы .glb / .gltf / .fbx в assets/models/ и раскомментируй
//  нужные строки. Любой незаполненный пункт остаётся процедурным.
//  Подробно — в docs/ART_PIPELINE.md.
// =====================================================================
window.ASSET_MANIFEST = {
  base: 'assets/models/',

  // Герой. height — рост в метрах (1 единица = 1 м). clips — имена клипов,
  // если они не называются стандартно (Idle / Run / Cast / Attack / Hit / Death).
  hero: null,
  // hero: { file: 'hero.glb', height: 1.9, staffBone: 'RightHand', orbBone: 'LeftHand',
  //         clips: { idle: 'Idle', run: 'Run', cast: 'Cast' } },

  // Рядовые враги: анимации move и attack запекаются в кадры для толпы.
  enemies: {
    // ghost:    { file: 'ghost.glb',    height: 1.6, float: true, frames: 10 },
    // ghoul:    { file: 'ghoul.glb',    height: 1.4 },
    // cknight:  { file: 'cknight.glb',  height: 2.0 },
    // wolf:     { file: 'wolf.glb',     height: 1.1 },
    // wisp:     { file: 'wisp.glb',     height: 1.5, float: true },
    // treant:   { file: 'treant.glb',   height: 2.4 },
    // skeleton: { file: 'skeleton.glb', height: 1.8 },
    // deadmage: { file: 'deadmage.glb', height: 1.9 },
    // golem:    { file: 'golem.glb',    height: 2.5 },
    // spawn:    { file: 'spawn.glb',    height: 1.0 },
    // voideye:  { file: 'voideye.glb',  height: 1.8, float: true },
    // horror:   { file: 'horror.glb',   height: 2.3 },
  },

  // Боссы: полноценный скелет и смешивание анимаций (Walk / Attack / Charge / Cast).
  bosses: {
    // fallen_knight: { file: 'fallen_knight.glb', height: 5.2 },
    // devourer:      { file: 'devourer.glb',      height: 4.6 },
    // soulless_king: { file: 'soulless_king.glb', height: 5.6 },
    // abyss_lord:    { file: 'abyss_lord.glb',    height: 6.5 },
  },
};
