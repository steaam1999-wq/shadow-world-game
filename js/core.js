// Shared casino state: balance, history, persistence, tabs.
const Casino = (() => {
  const STORAGE_KEY = 'shadow-casino-v1';
  const START_BALANCE = 1000;
  const BONUS_AMOUNT = 200;
  const BONUS_COOLDOWN_MS = 60 * 60 * 1000;
  const HISTORY_LIMIT = 50;

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Number.isFinite(s.balance)) return { lastBonus: 0, history: [], ...s };
      }
    } catch (e) { /* storage unavailable */ }
    return { balance: START_BALANCE, lastBonus: 0, history: [] };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const balanceEl = document.getElementById('balance');
  const historyEl = document.getElementById('history');

  function fmt(n) {
    return Math.round(n).toLocaleString('ru-RU');
  }

  function render() {
    balanceEl.textContent = fmt(state.balance);
    historyEl.innerHTML = '';
    for (const h of state.history) {
      const li = document.createElement('li');
      li.className = h.delta > 0 ? 'win' : h.delta < 0 ? 'lose' : '';
      li.innerHTML = `<span></span><span class="amt"></span>`;
      li.children[0].textContent = h.game;
      li.children[1].textContent = (h.delta > 0 ? '+' : '') + fmt(h.delta);
      historyEl.appendChild(li);
    }
    updateBonus();
  }

  function bump() {
    balanceEl.parentElement.classList.add('bump');
    setTimeout(() => balanceEl.parentElement.classList.remove('bump'), 150);
  }

  // Cryptographically strong integer in [0, max).
  function randInt(max) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % max;
  }

  function balance() { return state.balance; }

  // Takes a stake from the balance. Returns false if not enough chips.
  function take(amount) {
    if (!(amount > 0) || amount > state.balance) return false;
    state.balance -= amount;
    save(); render();
    return true;
  }

  function give(amount) {
    if (amount > 0) { state.balance += amount; bump(); }
    save(); render();
  }

  function record(game, delta) {
    state.history.unshift({ game, delta: Math.round(delta) });
    state.history.length = Math.min(state.history.length, HISTORY_LIMIT);
    save(); render();
  }

  // Reads and validates a bet input. Returns integer bet or null.
  function readBet(input, msgEl) {
    const bet = Math.floor(Number(input.value));
    if (!Number.isFinite(bet) || bet < 1) {
      setMsg(msgEl, 'Ставка должна быть не меньше 1', 'lose');
      return null;
    }
    if (bet > state.balance) {
      setMsg(msgEl, 'Недостаточно фишек. Заберите бонус!', 'lose');
      return null;
    }
    return bet;
  }

  function setMsg(el, text, cls = '') {
    el.textContent = text;
    el.className = 'message' + (cls ? ' ' + cls : '');
  }

  // Bonus: always available when broke, otherwise once per hour.
  const bonusBtn = document.getElementById('bonus-btn');
  function bonusReady() {
    return state.balance < 10 || Date.now() - state.lastBonus >= BONUS_COOLDOWN_MS;
  }
  function updateBonus() {
    const ready = bonusReady();
    bonusBtn.disabled = !ready;
    if (ready) {
      bonusBtn.textContent = state.balance < 10 ? `Бонус +${START_BALANCE}` : `Бонус +${BONUS_AMOUNT}`;
    } else {
      const left = Math.ceil((BONUS_COOLDOWN_MS - (Date.now() - state.lastBonus)) / 60000);
      bonusBtn.textContent = `Бонус через ${left} мин`;
    }
  }
  bonusBtn.addEventListener('click', () => {
    if (!bonusReady()) return;
    const amount = state.balance < 10 ? START_BALANCE : BONUS_AMOUNT;
    state.lastBonus = Date.now();
    give(amount);
    record('Бонус', amount);
  });
  setInterval(updateBonus, 15000);

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Сбросить баланс и историю?')) return;
    state = { balance: START_BALANCE, lastBonus: 0, history: [] };
    save(); render();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.game').forEach(g =>
        g.classList.toggle('active', g.id === 'game-' + tab.dataset.game));
      try { localStorage.setItem(STORAGE_KEY + '-tab', tab.dataset.game); } catch (e) { /* ignore */ }
    });
  });
  try {
    const savedTab = localStorage.getItem(STORAGE_KEY + '-tab');
    const t = savedTab && document.querySelector(`.tab[data-game="${savedTab}"]`);
    if (t) t.click();
  } catch (e) { /* ignore */ }

  render();

  return { balance, take, give, record, readBet, setMsg, randInt, fmt };
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));
