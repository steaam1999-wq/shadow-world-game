// Каталог скинов, кейсов и математика баланса.
// Все цены — в виртуальных монетах (1 монета ≈ 1 $ по ориентиру рынка), реальных денег нет.
window.App = window.App || {};
(function (App) {
  const RARITY = {
    consumer: { name: 'Ширпотреб', color: '#b0c3d9', order: 0 },
    industrial: { name: 'Промышленное', color: '#5e98d9', order: 1 },
    milspec: { name: 'Армейское', color: '#4b69ff', order: 2 },
    restricted: { name: 'Запрещённое', color: '#8847ff', order: 3 },
    classified: { name: 'Засекреченное', color: '#d32ce6', order: 4 },
    covert: { name: 'Тайное', color: '#eb4b4b', order: 5 },
    contraband: { name: 'Контрабанда', color: '#e4ae39', order: 6 },
    rare: { name: '★ Редкий предмет', color: '#ffc93c', order: 7 },
  };

  const WEARS = [
    { id: 'FN', name: 'Прямо с завода', mult: 1.6, p: 0.1 },
    { id: 'MW', name: 'Немного поношенное', mult: 1.2, p: 0.2 },
    { id: 'FT', name: 'После полевых испытаний', mult: 1.0, p: 0.4 },
    { id: 'WW', name: 'Поношенное', mult: 0.85, p: 0.15 },
    { id: 'BS', name: 'Закалённое в боях', mult: 0.75, p: 0.15 },
  ];
  const STATTRAK_CHANCE = 0.1;
  const STATTRAK_MULT = 1.8;
  // Средний множитель цены выпавшего предмета относительно базовой (FT, без StatTrak).
  const AVG_DROP_MULT =
    WEARS.reduce((s, w) => s + w.p * w.mult, 0) * (1 - STATTRAK_CHANCE + STATTRAK_CHANCE * STATTRAK_MULT);

  // [id, оружие, название, тип иконки, редкость, базовая цена (FT), цвет 1, цвет 2]
  const RAW_SKINS = [
    ['p250-sand', 'P250', 'Sand Dune', 'pistol', 'consumer', 0.03, '#c9b27a', '#8a7650'],
    ['nova-pred', 'Nova', 'Predator', 'rifle', 'consumer', 0.04, '#7f8a5a', '#3b3f2a'],
    ['scar-mesh', 'SCAR-20', 'Sand Mesh', 'sniper', 'consumer', 0.04, '#b9a57a', '#6f6247'],
    ['mag7-ddpat', 'MAG-7', 'Metallic DDPAT', 'smg', 'consumer', 0.05, '#9aa3ad', '#555c66'],
    ['mp9-storm', 'MP9', 'Storm', 'smg', 'industrial', 0.06, '#6e8aa8', '#39485a'],
    ['galil-sage', 'Galil AR', 'Sage Spray', 'rifle', 'industrial', 0.08, '#8fa37d', '#4e5c43'],
    ['ump-urban', 'UMP-45', 'Urban DDPAT', 'smg', 'industrial', 0.07, '#8d9299', '#4a4e54'],
    ['mp9-ruby', 'MP9', 'Ruby Poison Dart', 'smg', 'milspec', 0.3, '#d8334a', '#2a2a2a'],
    ['ump-expo', 'UMP-45', 'Exposure', 'smg', 'milspec', 0.2, '#f2c14e', '#3a3a3a'],
    ['deagle-oxide', 'Desert Eagle', 'Oxide Blaze', 'pistol', 'milspec', 0.35, '#e0782f', '#4b4b4b'],
    ['p250-nova', 'P250', 'Supernova', 'pistol', 'milspec', 0.45, '#4fb7e8', '#1d3557'],
    ['glock-candy', 'Glock-18', 'Candy Apple', 'pistol', 'milspec', 0.6, '#e63946', '#8d0f1c'],
    ['awp-capil', 'AWP', 'Capillary', 'sniper', 'milspec', 0.7, '#d65a5a', '#1e1e28'],
    ['m4a4-daimyo', 'M4A4', 'Evil Daimyo', 'rifle', 'milspec', 0.85, '#e04e39', '#1c1c1c'],
    ['ak-elite', 'AK-47', 'Elite Build', 'rifle', 'milspec', 0.95, '#3a86ff', '#f1f1f1'],
    ['famas-roll', 'FAMAS', 'Roll Cage', 'rifle', 'restricted', 1.8, '#4cc9f0', '#f72585'],
    ['glock-water', 'Glock-18', 'Water Elemental', 'pistol', 'restricted', 2.0, '#48cae4', '#d62828'],
    ['p90-asii', 'P90', 'Asiimov', 'smg', 'restricted', 2.2, '#f4f4f4', '#ff7b00'],
    ['usp-cortex', 'USP-S', 'Cortex', 'pistol', 'restricted', 2.5, '#ff70a6', '#70d6ff'],
    ['awp-atheris', 'AWP', 'Atheris', 'sniper', 'restricted', 4.0, '#2ec4b6', '#e71d36'],
    ['deagle-kumi', 'Desert Eagle', 'Kumicho Dragon', 'pistol', 'restricted', 5.0, '#c1121f', '#fdf0d5'],
    ['m4a1-deci', 'M4A1-S', 'Decimator', 'rifle', 'restricted', 6.0, '#f8f9fa', '#0077b6'],
    ['ak-misty', 'AK-47', 'Frontside Misty', 'rifle', 'restricted', 7.0, '#90e0ef', '#0077b6'],
    ['glock-bq', 'Glock-18', 'Bullet Queen', 'pistol', 'classified', 9.0, '#ffbe0b', '#8338ec'],
    ['m4a1-hb', 'M4A1-S', 'Hyper Beast', 'rifle', 'classified', 16.0, '#80ed99', '#ff006e'],
    ['m4a4-deso', 'M4A4', 'Desolate Space', 'rifle', 'classified', 18.0, '#9d4edd', '#ffd166'],
    ['ak-redline', 'AK-47', 'Redline', 'rifle', 'classified', 25.0, '#d90429', '#111111'],
    ['awp-hb', 'AWP', 'Hyper Beast', 'sniper', 'classified', 30.0, '#06d6a0', '#ef476f'],
    ['usp-kc', 'USP-S', 'Kill Confirmed', 'pistol', 'classified', 45.0, '#f94144', '#2b2d42'],
    ['deagle-print', 'Desert Eagle', 'Printstream', 'pistol', 'classified', 55.0, '#ffffff', '#1b1b1b'],
    ['awp-neo', 'AWP', 'Neo-Noir', 'sniper', 'covert', 65.0, '#ff5d8f', '#1b263b'],
    ['ak-asii', 'AK-47', 'Asiimov', 'rifle', 'covert', 70.0, '#fdfdfd', '#ff6d00'],
    ['ak-blood', 'AK-47', 'Bloodsport', 'rifle', 'covert', 110.0, '#e5383b', '#0b090a'],
    ['awp-asii', 'AWP', 'Asiimov', 'sniper', 'covert', 130.0, '#ffffff', '#ff7a00'],
    ['m4a1-print', 'M4A1-S', 'Printstream', 'rifle', 'covert', 170.0, '#f5f5f5', '#101010'],
    ['ak-serpent', 'AK-47', 'Fire Serpent', 'rifle', 'covert', 700.0, '#2d6a4f', '#d4a373'],
    ['m4a1-jungle', 'M4A1-S', 'Welcome to the Jungle', 'rifle', 'covert', 1500.0, '#38b000', '#ffba08'],
    ['m4a4-howl', 'M4A4', 'Howl', 'rifle', 'contraband', 4500.0, '#ff4800', '#ffd000'],
    ['ak-lotus', 'AK-47', 'Wild Lotus', 'rifle', 'covert', 9000.0, '#2a9d8f', '#e9c46a'],
    ['awp-gungnir', 'AWP', 'Gungnir', 'sniper', 'covert', 11000.0, '#219ebc', '#ffb703'],
    ['awp-dlore', 'AWP', 'Dragon Lore', 'sniper', 'covert', 12000.0, '#e9c46a', '#6a994e'],
    ['daggers-web', '★ Shadow Daggers', 'Crimson Web', 'knife', 'rare', 140.0, '#9b2226', '#1a1a1a'],
    ['wraps-cobalt', '★ Hand Wraps', 'Cobalt Skulls', 'gloves', 'rare', 160.0, '#1d4ed8', '#e5e7eb'],
    ['gut-auto', '★ Gut Knife', 'Autotronic', 'knife', 'rare', 180.0, '#ef233c', '#2b2d42'],
    ['flip-lore', '★ Flip Knife', 'Lore', 'knife', 'rare', 350.0, '#e9c46a', '#8d6e3f'],
    ['driver-snake', '★ Driver Gloves', 'King Snake', 'gloves', 'rare', 450.0, '#d9d9d9', '#3a3a3a'],
    ['bayo-marble', '★ Bayonet', 'Marble Fade', 'knife', 'rare', 600.0, '#ffbe0b', '#3a86ff'],
    ['skel-ch', '★ Skeleton Knife', 'Case Hardened', 'knife', 'rare', 900.0, '#4361ee', '#c9a227'],
    ['m9-tiger', '★ M9 Bayonet', 'Tiger Tooth', 'knife', 'rare', 950.0, '#ffb703', '#fb8500'],
    ['kara-doppler', '★ Karambit', 'Doppler', 'knife', 'rare', 1100.0, '#7209b7', '#f72585'],
    ['spec-kimono', '★ Specialist Gloves', 'Crimson Kimono', 'gloves', 'rare', 1200.0, '#9d0208', '#370617'],
    ['kara-fade', '★ Karambit', 'Fade', 'knife', 'rare', 1600.0, '#ff006e', '#ffbe0b'],
    ['bfly-doppler', '★ Butterfly Knife', 'Doppler', 'knife', 'rare', 1800.0, '#3a0ca3', '#4cc9f0'],
    ['bfly-fade', '★ Butterfly Knife', 'Fade', 'knife', 'rare', 2500.0, '#f15bb5', '#fee440'],
    ['sport-pandora', '★ Sport Gloves', "Pandora's Box", 'gloves', 'rare', 3200.0, '#7b2cbf', '#ff0054'],
  ];

  const SKINS = {};
  for (const [id, weapon, name, type, rarity, price, c1, c2] of RAW_SKINS) {
    SKINS[id] = { id, weapon, name, type, rarity, price, c1, c2 };
  }

  // Кейсы. rtp — доля цены кейса, которая в среднем возвращается игроку.
  const CASES = [
    {
      id: 'free', name: 'Ежедневный', price: 0, free: true, group: 'free', color: '#2ec4b6', alpha: 1.1,
      skins: ['p250-sand', 'nova-pred', 'scar-mesh', 'mag7-ddpat', 'mp9-storm', 'galil-sage', 'ump-urban',
        'ump-expo', 'mp9-ruby', 'deagle-oxide', 'glock-candy', 'ak-elite', 'usp-cortex', 'ak-redline'],
    },
    {
      id: 'rookie', name: 'Новичок', price: 1, group: 'cheap', color: '#4b69ff', rtp: 0.9,
      skins: ['mp9-storm', 'galil-sage', 'ump-expo', 'mp9-ruby', 'deagle-oxide', 'p250-nova', 'glock-candy',
        'awp-capil', 'm4a4-daimyo', 'ak-elite', 'famas-roll', 'glock-water', 'p90-asii', 'ak-redline', 'daggers-web'],
    },
    {
      id: 'pistol', name: 'Пистолеты', price: 3.5, group: 'cheap', color: '#8847ff', rtp: 0.9,
      skins: ['deagle-oxide', 'p250-nova', 'glock-candy', 'glock-water', 'usp-cortex', 'deagle-kumi',
        'glock-bq', 'usp-kc', 'deagle-print'],
    },
    {
      id: 'fifty', name: '50 / 50', price: 5, group: 'cheap', color: '#ff9f1c', rtp: 0.88,
      skins: ['p250-sand', 'nova-pred', 'mag7-ddpat', 'ump-urban', 'm4a4-deso', 'ak-redline', 'awp-hb', 'ak-asii'],
    },
    {
      id: 'classic', name: 'Классика', price: 8, group: 'popular', color: '#d32ce6', rtp: 0.9,
      skins: ['ak-elite', 'm4a4-daimyo', 'awp-capil', 'famas-roll', 'p90-asii', 'awp-atheris', 'm4a1-deci',
        'ak-misty', 'm4a1-hb', 'm4a4-deso', 'ak-redline', 'awp-hb', 'ak-asii', 'awp-asii', 'gut-auto'],
    },
    {
      id: 'ak', name: 'Калашников', price: 12, group: 'popular', color: '#eb4b4b', rtp: 0.9,
      skins: ['ak-elite', 'ak-misty', 'ak-redline', 'ak-asii', 'ak-blood', 'ak-serpent', 'ak-lotus', 'kara-doppler'],
    },
    {
      id: 'awp', name: 'Снайпер', price: 25, group: 'popular', color: '#06d6a0', rtp: 0.9,
      skins: ['awp-capil', 'awp-atheris', 'awp-hb', 'awp-neo', 'awp-asii', 'awp-gungnir', 'awp-dlore'],
    },
    {
      id: 'gloves', name: 'Перчатки', price: 120, group: 'premium', color: '#ffb703', rtp: 0.9,
      skins: ['m4a1-hb', 'ak-redline', 'usp-kc', 'ak-asii', 'awp-asii', 'wraps-cobalt', 'driver-snake',
        'spec-kimono', 'sport-pandora'],
    },
    {
      id: 'knife', name: 'Ножевой', price: 150, group: 'premium', color: '#ffc93c', rtp: 0.9,
      skins: ['ak-redline', 'awp-hb', 'usp-kc', 'deagle-print', 'ak-asii', 'ak-blood', 'awp-asii', 'daggers-web', 'gut-auto', 'flip-lore', 'bayo-marble', 'skel-ch',
        'm9-tiger', 'kara-doppler', 'kara-fade', 'bfly-doppler', 'bfly-fade'],
    },
    {
      id: 'legend', name: 'Легенда', price: 500, group: 'premium', color: '#ff4800', rtp: 0.9,
      skins: ['m4a1-print', 'ak-serpent', 'flip-lore', 'bayo-marble', 'kara-doppler', 'kara-fade',
        'm4a1-jungle', 'm4a4-howl', 'ak-lotus', 'awp-dlore'],
    },
  ];

  const GROUPS = [
    { id: 'free', name: 'Бесплатные' },
    { id: 'cheap', name: 'Бюджетные' },
    { id: 'popular', name: 'Популярные' },
    { id: 'premium', name: 'Премиум' },
  ];

  // Веса предметов: w = цена^(-alpha). Для платных кейсов alpha подбирается
  // бинарным поиском так, чтобы матожидание дропа = rtp * цена кейса.
  function weightsFor(values, alpha) {
    return values.map((v) => Math.pow(v, -alpha));
  }
  function expected(values, weights) {
    let sw = 0, sv = 0;
    for (let i = 0; i < values.length; i++) { sw += weights[i]; sv += weights[i] * values[i]; }
    return sv / sw;
  }

  function balanceCase(c) {
    const values = c.skins.map((id) => SKINS[id].price * AVG_DROP_MULT);
    let alpha = c.alpha ?? 1;
    if (!c.free) {
      const target = c.price * c.rtp;
      let lo = 0, hi = 30;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (expected(values, weightsFor(values, mid)) > target) lo = mid; else hi = mid;
      }
      alpha = (lo + hi) / 2;
    }
    const w = weightsFor(values, alpha);
    const sum = w.reduce((a, b) => a + b, 0);
    c.items = c.skins
      .map((id, i) => ({ skin: SKINS[id], chance: w[i] / sum }))
      .sort((a, b) => b.skin.price - a.skin.price);
    c.ev = expected(values, w);
    c.topSkin = c.items[0].skin;
  }
  CASES.forEach(balanceCase);

  const CASE_BY_ID = Object.fromEntries(CASES.map((c) => [c.id, c]));

  // Каталог для апгрейда и контрактов: каждый скин во всех степенях износа.
  const CATALOG = [];
  for (const skin of Object.values(SKINS)) {
    for (const w of WEARS) {
      CATALOG.push({ key: `${skin.id}|${w.id}`, skin, wear: w.id, price: round2(skin.price * w.mult) });
    }
  }
  CATALOG.sort((a, b) => a.price - b.price);

  function round2(n) { return Math.round(n * 100) / 100; }

  function itemPrice(skin, wearId, st) {
    const w = WEARS.find((x) => x.id === wearId);
    return Math.max(0.01, round2(skin.price * w.mult * (st ? STATTRAK_MULT : 1)));
  }

  App.data = {
    RARITY, WEARS, SKINS, CASES, CASE_BY_ID, GROUPS, CATALOG,
    STATTRAK_CHANCE, AVG_DROP_MULT, round2, itemPrice,
    wear: (id) => WEARS.find((w) => w.id === id),
  };
})(window.App);
