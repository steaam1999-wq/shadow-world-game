// Состояние игрока (localStorage) и Provably Fair генератор.
window.App = window.App || {};
(function (App) {
  const KEY = 'shadowdrop:v1';
  const listeners = new Set();

  function freshFair() {
    return { serverSeed: App.crypto.randomHex(32), clientSeed: App.crypto.randomHex(8), nonce: 0, history: [] };
  }

  function defaults() {
    return {
      balance: 25,
      xp: 0,
      inventory: [],
      lastFree: 0,
      promoUsed: [],
      settings: { fast: false },
      stats: { opened: 0, upgrades: 0, upgradesWon: 0, contracts: 0, battles: 0, battlesWon: 0, best: null },
      fair: freshFair(),
    };
  }

  // Предметы из старой версии сайта (до базы CS2) переводим на новые id скинов.
  function migrate(saved) {
    const { SKINS } = App.data;
    const legacy = App.CS2_DB.legacy;
    const fix = (it) => {
      if (it && !SKINS[it.skinId] && legacy[it.skinId]) it.skinId = legacy[it.skinId];
      return it && SKINS[it.skinId] ? it : null;
    };
    if (Array.isArray(saved.inventory)) saved.inventory = saved.inventory.map(fix).filter(Boolean);
    if (saved.stats && saved.stats.best) saved.stats.best = fix(saved.stats.best);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const d = defaults();
        migrate(saved);
        return { ...d, ...saved, stats: { ...d.stats, ...saved.stats }, settings: { ...d.settings, ...saved.settings } };
      }
    } catch (e) { /* приватный режим или повреждённые данные — начинаем заново */ }
    return defaults();
  }

  const state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* хранилище недоступно */ }
    listeners.forEach((fn) => fn(state));
  }

  let uidCounter = Date.now();
  const uid = () => (uidCounter++).toString(36);

  const store = {
    state,
    save,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    canAfford: (n) => state.balance + 1e-9 >= n,
    spend(n) {
      state.balance = App.data.round2(state.balance - n);
      state.xp = App.data.round2(state.xp + n);
    },
    credit(n) { state.balance = App.data.round2(state.balance + n); },

    level() {
      const lvl = Math.floor(Math.sqrt(state.xp / 5));
      const cur = lvl * lvl * 5, next = (lvl + 1) * (lvl + 1) * 5;
      return { lvl, progress: (state.xp - cur) / (next - cur), next };
    },

    makeItem(skin, wear, st, source) {
      return { uid: uid(), skinId: skin.id, wear, st: !!st, price: App.data.itemPrice(skin, wear, st), source, ts: Date.now() };
    },
    addItems(items) {
      state.inventory.unshift(...items);
      for (const it of items) {
        if (!state.stats.best || it.price > state.stats.best.price) state.stats.best = it;
      }
    },
    removeItems(uids) {
      const set = new Set(uids);
      state.inventory = state.inventory.filter((it) => !set.has(it.uid));
    },
    findItem: (uid) => state.inventory.find((it) => it.uid === uid),
    sell(uids) {
      const set = new Set(uids);
      let total = 0;
      for (const it of state.inventory) if (set.has(it.uid)) total += it.price;
      store.removeItems(uids);
      store.credit(total);
      return App.data.round2(total);
    },

    freeReadyIn() {
      const left = state.lastFree + 24 * 3600 * 1000 - Date.now();
      return Math.max(0, left);
    },
  };

  // --- Provably Fair ---
  // roll = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`) → первые 52 бита / 2^52 ∈ [0, 1)
  function rollFrom(serverSeed, clientSeed, nonce, cursor = 0) {
    const hex = App.crypto.hmacHex(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    return parseInt(hex.slice(0, 13), 16) / 2 ** 52;
  }

  const fair = {
    rollFrom,
    serverHash: () => App.crypto.sha256Hex(state.fair.serverSeed),
    // Резервирует один nonce под игровое действие; возвращает функцию для получения чисел.
    next() {
      const { serverSeed, clientSeed } = state.fair;
      const nonce = state.fair.nonce++;
      let cursor = 0;
      const roll = () => rollFrom(serverSeed, clientSeed, nonce, cursor++);
      roll.nonce = nonce;
      return roll;
    },
    rotate(newClientSeed) {
      const f = state.fair;
      f.history.unshift({ serverSeed: f.serverSeed, hash: fair.serverHash(), clientSeed: f.clientSeed, nonces: f.nonce, ts: Date.now() });
      f.history = f.history.slice(0, 20);
      f.serverSeed = App.crypto.randomHex(32);
      f.clientSeed = newClientSeed || App.crypto.randomHex(8);
      f.nonce = 0;
      save();
    },
  };

  // Выбор предмета из кейса + износ + StatTrak по одному «броску».
  function rollCaseItem(caseDef, roll) {
    const r = roll();
    let acc = 0, picked = caseDef.items[caseDef.items.length - 1];
    // Идём от дешёвых к дорогим, чтобы маленький r соответствовал частому предмету.
    for (let i = caseDef.items.length - 1; i >= 0; i--) {
      acc += caseDef.items[i].chance;
      if (r < acc) { picked = caseDef.items[i]; break; }
    }
    // Износ выбирается только среди тех, что реально бывают у скина.
    const wears = App.data.WEARS.filter((w) => picked.skin.wears.includes(w.id));
    const psum = wears.reduce((t, w) => t + w.p, 0);
    const wr = roll() * psum;
    let wacc = 0, wear = wears[wears.length - 1].id;
    for (const w of wears) { wacc += w.p; if (wr < wacc) { wear = w.id; break; } }
    const st = roll() < App.data.STATTRAK_CHANCE && picked.skin.st;
    return { skin: picked.skin, wear, st };
  }

  App.store = store;
  App.fair = fair;
  App.rollCaseItem = rollCaseItem;
})(window.App);
