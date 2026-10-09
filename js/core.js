// Shared casino state: balance, history, persistence, bonus and bet controls.
const Casino = (() => {
  const STORAGE_KEY = 'shadow-casino-v1';
  const START_BALANCE = 1000;
  const BONUS_AMOUNT = 200;
  const BONUS_COOLDOWN_MS = 60 * 60 * 1000;
  const HISTORY_LIMIT = 100;

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
  const balanceBox = balanceEl.closest('.balance');
  const historyEl = document.getElementById('history');
  const statsEl = document.getElementById('stats');

  function fmt(n) {
    return Math.round(n).toLocaleString('ru-RU');
  }

  function render() {
    balanceEl.textContent = fmt(state.balance);
    renderHistory();
    updateBonus();
  }

  function renderHistory() {
    historyEl.innerHTML = '';
    if (!state.history.length) {
      historyEl.innerHTML = '<li class="empty">Ставок пока нет</li>';
    }
    for (const h of state.history) {
      const li = document.createElement('li');
      li.className = h.delta > 0 ? 'win' : h.delta < 0 ? 'lose' : '';
      li.innerHTML = '<span class="g"></span><span class="t"></span><span class="amt"></span>';
      li.children[0].textContent = h.game;
      li.children[1].textContent = h.time
        ? new Date(h.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
      li.children[2].textContent = (h.delta > 0 ? '+' : '') + fmt(h.delta);
      historyEl.appendChild(li);
    }
    const games = state.history.filter(h => h.game !== 'Бонус');
    const wins = games.filter(h => h.delta > 0);
    const net = games.reduce((a, h) => a + h.delta, 0);
    const best = wins.reduce((a, h) => Math.max(a, h.delta), 0);
    statsEl.innerHTML = '';
    for (const [label, value, cls] of [
      ['Ставок', fmt(games.length)],
      ['Побед', games.length ? Math.round(wins.length / games.length * 100) + '%' : '—'],
      ['Лучший выигрыш', best ? '+' + fmt(best) : '—', 'pos'],
      ['Итог', (net > 0 ? '+' : '') + fmt(net), net >= 0 ? 'pos' : 'neg'],
    ]) {
      const d = document.createElement('div');
      d.className = 'stat';
      d.innerHTML = `<span></span><b class="${cls || ''}"></b>`;
      d.children[0].textContent = label;
      d.children[1].textContent = value;
      statsEl.appendChild(d);
    }
  }

  function bump() {
    balanceBox.classList.add('bump');
    setTimeout(() => balanceBox.classList.remove('bump'), 180);
  }

  // Cryptographically strong integer in [0, max).
  function randInt(max) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % max;
  }

  // Uniform float in [0, 1) with 32 bits of entropy.
  function random() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
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
    state.history.unshift({ game, delta: Math.round(delta), time: Date.now() });
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
      bonusBtn.textContent = state.balance < 10 ? `+${START_BALANCE} SC` : `Бонус +${BONUS_AMOUNT}`;
    } else {
      const left = Math.ceil((BONUS_COOLDOWN_MS - (Date.now() - state.lastBonus)) / 60000);
      bonusBtn.textContent = `Бонус ${left} мин`;
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

  // Bet steppers (− / +) halve and double; quick buttons set an exact amount.
  document.querySelectorAll('.step').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.for);
      if (input.disabled) return;
      const v = Math.max(1, Math.floor(Number(input.value)) || 1);
      input.value = btn.dataset.step === '+' ? Math.min(v * 2, Math.max(1, Math.floor(state.balance))) : Math.max(1, Math.floor(v / 2));
      input.dispatchEvent(new Event('input'));
    });
  });
  document.querySelectorAll('.quick').forEach(group => {
    const input = document.getElementById(group.dataset.for);
    group.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (input.disabled) return;
      input.value = b.textContent;
      input.dispatchEvent(new Event('input'));
    }));
  });

  render();

  return { balance, take, give, record, readBet, setMsg, randInt, random, fmt };
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));
