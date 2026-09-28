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
  // Диапазоны float для каждого износа, как в CS2.
  const FLOAT_RANGES = { FN: [0, 0.07], MW: [0.07, 0.15], FT: [0.15, 0.38], WW: [0.38, 0.45], BS: [0.45, 1] };
  const floatFor = (wear, r) => {
    const [a, b] = FLOAT_RANGES[wear] || FLOAT_RANGES.FT;
    return Math.round((a + (b - a) * r) * 1e6) / 1e6;
  };
  const STATTRAK_CHANCE = 0.1;
  const STATTRAK_MULT = 1.8;

  // Все скины CS2 из сгенерированной базы (js/cs2-db.js).
  const DB = App.CS2_DB;
  const SKINS = {};
  const SKIN_LIST = [];
  for (const [id, weapon, name, type, rarity, price, wmask, st, img] of DB.skins) {
    const wears = WEARS.filter((_, i) => wmask & (1 << i)).map((w) => w.id);
    const skin = { id, weapon, name, type, rarity, price, wears, st: !!st, img: img || '' }; // img — хеш картинки Steam
    // Цвета запасной SVG-иконки: оттенок по имени + цвет редкости.
    let h = 0;
    for (const ch of weapon + name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    skin.c1 = `hsl(${h % 360} 65% 62%)`;
    SKIN_LIST.push(skin);
    SKINS[id] = skin;
  }
  const SKIN_BY_INDEX = SKIN_LIST;
  const fullName = (skin) => `${skin.weapon} | ${skin.name}`;

  // Средний множитель цены выпавшего предмета: учитывает, какие износы и StatTrak есть у скина.
  function dropMult(skin) {
    const ws = WEARS.filter((w) => skin.wears.includes(w.id));
    const psum = ws.reduce((s, w) => s + w.p, 0);
    const wear = ws.reduce((s, w) => s + (w.p / psum) * w.mult, 0);
    return wear * (skin.st ? 1 - STATTRAK_CHANCE + STATTRAK_CHANCE * STATTRAK_MULT : 1);
  }

  // Тематические кейсы сайта (скины указаны старыми id, см. legacy в cs2-db.js).
  // rtp — доля цены кейса, которая в среднем возвращается игроку.
  const CASES = [
    {
      id: 'free', name: 'Ежедневный', price: 0, free: true, group: 'cheap', color: '#2ec4b6', alpha: 1.1,
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

  for (const c of CASES) c.skins = c.skins.map((old) => DB.legacy[old]).filter(Boolean);

  // Официальные кейсы CS2: реальное содержимое и шансы Valve по редкостям.
  const VALVE_ODDS = { milspec: 0.7992, restricted: 0.1598, classified: 0.032, covert: 0.0064, rare: 0.0026 };
  const OFFICIAL_COLORS = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#ffb703', '#2ec4b6', '#ff7a18'];
  DB.cases.forEach(([id, name, date, items, rare, img], i) => {
    CASES.push({
      id: 'c' + id, name: name.replace(/ Case$/, ''), fullName: name, date, official: true,
      group: 'official', color: OFFICIAL_COLORS[i % OFFICIAL_COLORS.length], rtp: 0.9,
      img: img || '',
      skins: items.concat(rare).map((idx) => SKIN_BY_INDEX[idx].id),
    });
  });

  const GROUPS = [
    { id: 'cheap', name: 'Бюджетные' },
    { id: 'popular', name: 'Популярные' },
    { id: 'premium', name: 'Премиум' },
    { id: 'official', name: 'Официальные кейсы CS2', note: 'Реальное содержимое и шансы Valve' },
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

  function officialWeights(skins) {
    const byTier = {};
    for (const sk of skins) (byTier[sk.rarity] = byTier[sk.rarity] || []).push(sk);
    const total = Object.keys(byTier).reduce((t, r) => t + (VALVE_ODDS[r] || 0), 0);
    return skins.map((sk) => (VALVE_ODDS[sk.rarity] || 0) / total / byTier[sk.rarity].length);
  }

  function balanceCase(c) {
    const skins = c.skins.map((id) => SKINS[id]);
    const values = skins.map((sk) => sk.price * dropMult(sk));
    let w;
    if (c.official) {
      w = officialWeights(skins);
      c.price = round2(expected(values, w) / c.rtp);
    } else {
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
      w = weightsFor(values, alpha);
    }
    const sum = w.reduce((a, b) => a + b, 0);
    c.items = skins
      .map((skin, i) => ({ skin, chance: w[i] / sum }))
      .sort((a, b) => b.skin.price - a.skin.price);
    c.ev = expected(values, w);
    c.topSkin = c.items[0].skin;
  }
  CASES.forEach(balanceCase);

  // Где выпадает скин: skinId → [{ case, chance }] по убыванию шанса.
  const DROPS = {};
  for (const c of CASES) {
    for (const it of c.items) (DROPS[it.skin.id] = DROPS[it.skin.id] || []).push({ case: c, chance: it.chance });
  }
  for (const list of Object.values(DROPS)) list.sort((a, b) => b.chance - a.chance);

  // Вероятность каждого износа у конкретного скина (только реально существующие износы).
  function wearOdds(skin) {
    const ws = WEARS.filter((w) => skin.wears.includes(w.id));
    const psum = ws.reduce((t, w) => t + w.p, 0);
    return ws.map((w) => ({ ...w, chance: w.p / psum }));
  }

  const CASE_BY_ID = Object.fromEntries(CASES.map((c) => [c.id, c]));

  // Каталог для апгрейда и контрактов: каждый скин во всех степенях износа.
  const CATALOG = [];
  for (const skin of SKIN_LIST) {
    for (const w of WEARS.filter((x) => skin.wears.includes(x.id))) {
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
    RARITY, WEARS, SKINS, SKIN_LIST, CASES, CASE_BY_ID, GROUPS, CATALOG,
    STATTRAK_CHANCE, STATTRAK_MULT, FLOAT_RANGES, floatFor, round2, itemPrice, fullName, DROPS, wearOdds,
    wear: (id) => WEARS.find((w) => w.id === id),
  };
})(window.App);
