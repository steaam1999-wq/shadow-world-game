// Состояние игрока (localStorage), аккаунты и Provably Fair генератор.
window.App = window.App || {};
(function (App) {
  const GUEST_KEY = 'shadowdrop:v1';
  const ACCOUNTS_KEY = 'shadowdrop:accounts';
  const HISTORY_MAX = 150;
  const listeners = new Set();

  function readJSON(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* хранилище недоступно */ }
  }

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
      history: [],
      created: Date.now(),
    };
  }

  // Предметы из старой версии сайта (до базы CS2) переводим на новые id скинов.
  function migrate(saved) {
    const { SKINS } = App.data;
    const legacy = App.CS2_DB.legacy;
    const fix = (it) => {
      if (it && !SKINS[it.skinId] && legacy[it.skinId]) it.skinId = legacy[it.skinId];
      // Старым предметам без float выдаём постоянное значение по их uid.
      if (it && it.float == null) {
        let h = 0;
        for (const ch of String(it.uid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        it.float = App.data.floatFor(it.wear, (h % 10000) / 10000);
      }
      return it && SKINS[it.skinId] ? it : null;
    };
    if (Array.isArray(saved.inventory)) saved.inventory = saved.inventory.map(fix).filter(Boolean);
    if (saved.stats && saved.stats.best) saved.stats.best = fix(saved.stats.best);
  }

  function load(key) {
    const saved = readJSON(key);
    if (!saved) return defaults();
    try {
      const d = defaults();
      migrate(saved);
      return { ...d, ...saved, stats: { ...d.stats, ...saved.stats }, settings: { ...d.settings, ...saved.settings } };
    } catch (e) {
      return defaults(); // повреждённые данные — начинаем заново
    }
  }

  // Аккаунты живут только в этом браузере: логин, соль и SHA-256 от пароля.
  const accounts = readJSON(ACCOUNTS_KEY) || { users: {}, current: null };
  if (accounts.current && !accounts.users[accounts.current]) accounts.current = null;
  const keyFor = (id) => (id ? `shadowdrop:user:${id}` : GUEST_KEY);

  const state = load(keyFor(accounts.current));

  function save() {
    writeJSON(keyFor(accounts.current), state);
    listeners.forEach((fn) => fn(state));
  }

  // Подменяет содержимое state, сохраняя сам объект (на него ссылаются все страницы).
  function replaceState(next) {
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, next);
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

    makeItem(skin, wear, st, source, float = App.data.floatFor(wear, Math.random())) {
      return { uid: uid(), skinId: skin.id, wear, st: !!st, float, price: App.data.itemPrice(skin, wear, st), source, ts: Date.now() };
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
      if (uids.length) App.fx?.sound.coin();
      if (uids.length) store.log('sell', `Продано предметов: ${uids.length}`, App.data.round2(total));
      return App.data.round2(total);
    },

    // Запись в историю действий личного кабинета.
    log(type, text, price = null) {
      state.history.unshift({ ts: Date.now(), type, text, price });
      if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;
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
    const float = App.data.floatFor(wear, roll()); // cursor 3 — точное значение float
    return { skin: picked.skin, wear, st, float };
  }

  // --- Личный кабинет ---
  const LOGIN_RE = /^[A-Za-zА-Яа-яЁё0-9_.-]{3,16}$/;
  const hashPassword = (salt, password) => App.crypto.sha256Hex(`${salt}:${password}`);

  const auth = {
    user() {
      const u = accounts.current && accounts.users[accounts.current];
      return u ? { id: accounts.current, ...u } : null;
    },
    register(login, password) {
      login = String(login).trim();
      if (!LOGIN_RE.test(login)) return 'Логин: 3–16 символов, буквы, цифры, «_», «.» или «-».';
      if (String(password).length < 6) return 'Пароль должен быть не короче 6 символов.';
      const id = login.toLowerCase();
      if (accounts.users[id]) return 'Такой логин уже занят.';
      const salt = App.crypto.randomHex(16);
      accounts.users[id] = { login, salt, hash: hashPassword(salt, password), created: Date.now(), hue: Math.floor(Math.random() * 360) };
      // Прогресс гостя переходит в новый аккаунт, гость начинает с нуля.
      const wasGuest = !accounts.current;
      accounts.current = id;
      writeJSON(ACCOUNTS_KEY, accounts);
      if (wasGuest) {
        state.created = Date.now();
        writeJSON(GUEST_KEY, defaults());
      } else {
        replaceState(defaults());
      }
      store.log('account', 'Аккаунт создан');
      save();
      return null;
    },
    login(login, password) {
      const id = String(login).trim().toLowerCase();
      const u = accounts.users[id];
      if (!u || u.hash !== hashPassword(u.salt, password)) return 'Неверный логин или пароль.';
      accounts.current = id;
      writeJSON(ACCOUNTS_KEY, accounts);
      replaceState(load(keyFor(id)));
      store.log('account', 'Вход в аккаунт');
      save();
      return null;
    },
    logout() {
      accounts.current = null;
      writeJSON(ACCOUNTS_KEY, accounts);
      replaceState(load(GUEST_KEY));
      save();
    },
    changePassword(oldPass, newPass) {
      const u = accounts.users[accounts.current];
      if (!u) return 'Сначала войдите в аккаунт.';
      if (u.hash !== hashPassword(u.salt, oldPass)) return 'Текущий пароль указан неверно.';
      if (String(newPass).length < 6) return 'Новый пароль должен быть не короче 6 символов.';
      u.salt = App.crypto.randomHex(16);
      u.hash = hashPassword(u.salt, newPass);
      writeJSON(ACCOUNTS_KEY, accounts);
      store.log('account', 'Пароль изменён');
      save();
      return null;
    },
    setHue(hue) {
      const u = accounts.users[accounts.current];
      if (!u) return;
      u.hue = hue;
      writeJSON(ACCOUNTS_KEY, accounts);
      save();
    },
    resetProgress() {
      const fresh = defaults();
      fresh.created = state.created;
      replaceState(fresh);
      store.log('account', 'Прогресс сброшен');
      save();
    },
  };

  App.store = store;
  App.auth = auth;
  App.fair = fair;
  App.rollCaseItem = rollCaseItem;
})(window.App);
