// Mines: 5x5 field, open safe cells to grow the multiplier, cash out any time.
(() => {
  const SIZE = 25;
  const HOUSE = 0.97;

  const grid = document.getElementById('mines-grid');
  const countSel = document.getElementById('mines-count');
  const betInput = document.getElementById('mines-bet');
  const btn = document.getElementById('mines-btn');
  const randomBtn = document.getElementById('mines-random');
  const nextEl = document.getElementById('mines-next');
  const curEl = document.getElementById('mines-cur');
  const msg = document.getElementById('mines-msg');

  for (let i = 1; i <= 24; i++) countSel.add(new Option(i, i, false, i === 3));

  let playing = false;
  let mines = new Set();
  let opened = new Set();
  let bet = 0;

  // Fair multiplier after k safe picks with m mines: HOUSE / P(k safe in a row).
  function multiplier(k, m) {
    let p = 1;
    for (let i = 0; i < k; i++) p *= (SIZE - m - i) / (SIZE - i);
    return HOUSE / p;
  }

  const cells = [];
  for (let i = 0; i < SIZE; i++) {
    const c = document.createElement('button');
    c.className = 'mine-cell';
    c.addEventListener('click', () => open(i));
    grid.appendChild(c);
    cells.push(c);
  }

  function m() { return Number(countSel.value); }

  function updateInfo() {
    const k = opened.size;
    curEl.textContent = '×' + (k ? multiplier(k, m()) : 1).toFixed(2);
    nextEl.textContent = k < SIZE - m() ? '×' + multiplier(k + 1, m()).toFixed(2) : '—';
  }

  function updateButton() {
    if (playing) {
      btn.classList.add('cashout');
      btn.innerHTML = opened.size
        ? `Забрать<small>${Casino.fmt(Math.floor(bet * multiplier(opened.size, m())))} SC</small>`
        : 'Забрать<small>откройте клетку</small>';
      btn.disabled = !opened.size;
    } else {
      btn.classList.remove('cashout');
      btn.textContent = 'Играть';
      btn.disabled = false;
    }
    randomBtn.disabled = !playing;
    countSel.disabled = betInput.disabled = playing;
  }

  function resetCells() {
    cells.forEach(c => { c.className = 'mine-cell'; c.textContent = ''; c.disabled = false; });
  }

  function start() {
    const b = Casino.readBet(betInput, msg);
    if (b === null) return;
    bet = b;
    Casino.take(bet);
    // Pick mine positions with a partial Fisher–Yates shuffle.
    const idx = [...Array(SIZE).keys()];
    for (let i = 0; i < m(); i++) {
      const j = i + Casino.randInt(SIZE - i);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    mines = new Set(idx.slice(0, m()));
    opened = new Set();
    playing = true;
    resetCells();
    Casino.setMsg(msg, 'Открывайте клетки');
    updateInfo();
    updateButton();
  }

  function revealAll() {
    cells.forEach((c, i) => {
      c.disabled = true;
      if (opened.has(i)) return;
      c.classList.add('dim', mines.has(i) ? 'bomb' : 'gem');
      c.textContent = mines.has(i) ? '💣' : '💎';
    });
  }

  function open(i) {
    if (!playing || opened.has(i)) return;
    const c = cells[i];
    if (mines.has(i)) {
      c.classList.add('bomb', 'boom');
      c.textContent = '💣';
      playing = false;
      Casino.record('Мины', -bet);
      Casino.setMsg(msg, 'Бум! Ставка сгорела', 'lose');
      revealAll();
      updateButton();
      return;
    }
    opened.add(i);
    c.classList.add('gem');
    c.textContent = '💎';
    c.disabled = true;
    updateInfo();
    if (opened.size === SIZE - m()) cashOut();
    else updateButton();
  }

  function cashOut() {
    if (!playing || !opened.size) return;
    const mult = multiplier(opened.size, m());
    const win = Math.floor(bet * mult);
    playing = false;
    Casino.give(win);
    Casino.record('Мины', win - bet);
    Casino.setMsg(msg, `Выигрыш ×${mult.toFixed(2)}: +${Casino.fmt(win)} SC`, 'win');
    revealAll();
    updateButton();
  }

  btn.addEventListener('click', () => (playing ? cashOut() : start()));
  randomBtn.addEventListener('click', () => {
    const free = cells.map((_, i) => i).filter(i => !opened.has(i));
    if (free.length) open(free[Casino.randInt(free.length)]);
  });
  countSel.addEventListener('change', updateInfo);

  cells.forEach(c => { c.disabled = true; });
  updateInfo();
  updateButton();
})();
