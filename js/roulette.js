// European single-zero roulette.
(() => {
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colorOf = n => n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black';

  // Each bet: label, how many times the stake is returned on a win, and the win test.
  const OUTSIDE = {
    d1: { label: '1–12', ret: 3, wins: n => n >= 1 && n <= 12 },
    d2: { label: '13–24', ret: 3, wins: n => n >= 13 && n <= 24 },
    d3: { label: '25–36', ret: 3, wins: n => n >= 25 },
    low: { label: '1–18', ret: 2, wins: n => n >= 1 && n <= 18 },
    even: { label: 'Чёт', ret: 2, wins: n => n !== 0 && n % 2 === 0 },
    red: { label: '◆', ret: 2, wins: n => REDS.has(n), cls: 'red' },
    black: { label: '◆', ret: 2, wins: n => n !== 0 && !REDS.has(n), cls: 'black' },
    odd: { label: 'Нечет', ret: 2, wins: n => n % 2 === 1 },
    high: { label: '19–36', ret: 2, wins: n => n >= 19 },
  };
  function betInfo(key) {
    if (key[0] === 'n') {
      const num = Number(key.slice(1));
      return { label: String(num), ret: 36, wins: n => n === num };
    }
    return OUTSIDE[key];
  }

  const board = document.getElementById('roulette-board');
  const msg = document.getElementById('roulette-msg');
  const chipInput = document.getElementById('roulette-chip');
  const spinBtn = document.getElementById('roulette-spin');
  const clearBtn = document.getElementById('roulette-clear');
  const totalEl = document.getElementById('roulette-total');
  const resultEl = document.getElementById('wheel-result');
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');

  const bets = {};
  const cells = {};
  let spinning = false;

  function addCell(key, text, cls, col, row, colSpan = 1, rowSpan = 1) {
    const el = document.createElement('div');
    el.className = 'cell ' + cls;
    el.textContent = text;
    el.style.gridColumn = `${col} / span ${colSpan}`;
    el.style.gridRow = `${row} / span ${rowSpan}`;
    el.addEventListener('click', () => place(key));
    el.addEventListener('contextmenu', e => { e.preventDefault(); remove(key); });
    board.appendChild(el);
    cells[key] = el;
  }

  addCell('n0', '0', 'green', 1, 1, 1, 3);
  for (let n = 1; n <= 36; n++) {
    const col = 2 + Math.floor((n - 1) / 3);
    const row = 3 - ((n - 1) % 3);
    addCell('n' + n, n, colorOf(n), col, row);
  }
  ['d1', 'd2', 'd3'].forEach((k, i) => addCell(k, OUTSIDE[k].label, 'outside', 2 + i * 4, 4, 4));
  ['low', 'even', 'red', 'black', 'odd', 'high'].forEach((k, i) =>
    addCell(k, OUTSIDE[k].label, OUTSIDE[k].cls || 'outside', 2 + i * 2, 5, 2));

  function totalBet() {
    return Object.values(bets).reduce((a, b) => a + b, 0);
  }

  function renderBets() {
    for (const [key, el] of Object.entries(cells)) {
      el.querySelector('.stake')?.remove();
      if (bets[key]) {
        const s = document.createElement('span');
        s.className = 'stake';
        s.textContent = Casino.fmt(bets[key]);
        el.appendChild(s);
      }
    }
    totalEl.textContent = Casino.fmt(totalBet());
  }

  function place(key) {
    if (spinning) return;
    const chip = Casino.readBet(chipInput, msg);
    if (chip === null) return;
    Casino.take(chip);
    bets[key] = (bets[key] || 0) + chip;
    Casino.setMsg(msg, `Ставка ${Casino.fmt(chip)} на «${betInfo(key).label}». ПКМ — убрать`);
    renderBets();
  }

  function remove(key) {
    if (spinning || !bets[key]) return;
    Casino.give(bets[key]);
    delete bets[key];
    renderBets();
  }

  clearBtn.addEventListener('click', () => {
    if (spinning) return;
    const t = totalBet();
    if (t) Casino.give(t);
    for (const k in bets) delete bets[k];
    renderBets();
    Casino.setMsg(msg, 'Стол очищен');
  });

  // Wheel drawing
  const SEG = (Math.PI * 2) / ORDER.length;
  const FILL = { red: '#c8283a', black: '#1a1a1f', green: '#138a4a' };
  let rotation = 0;

  function drawWheel() {
    const w = canvas.width, c = w / 2, r = c - 6;
    ctx.clearRect(0, 0, w, w);
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(rotation);
    ORDER.forEach((n, i) => {
      const a0 = -Math.PI / 2 + i * SEG - SEG / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a0 + SEG);
      ctx.closePath();
      ctx.fillStyle = FILL[colorOf(n)];
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.rotate(a0 + SEG / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(r - 16, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(n, 0, 0);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#15131f';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function animateTo(index) {
    return new Promise(resolve => {
      const from = rotation;
      const base = -index * SEG;
      const twoPi = Math.PI * 2;
      let target = base + twoPi * Math.ceil((from - base) / twoPi);
      target += twoPi * 5;
      // Small random offset inside the segment so it doesn't always stop dead center.
      target += (Casino.randInt(1000) / 1000 - 0.5) * SEG * 0.7;
      const duration = 4000;
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 4);
        rotation = from + (target - from) * ease;
        drawWheel();
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  let lastCell = null;
  async function spin() {
    if (spinning) return;
    const staked = totalBet();
    if (!staked) {
      Casino.setMsg(msg, 'Сначала сделайте ставку', 'lose');
      return;
    }
    spinning = true;
    spinBtn.disabled = clearBtn.disabled = true;
    Casino.setMsg(msg, 'Ставок больше нет…');
    resultEl.textContent = '…';
    lastCell?.classList.remove('last');

    const index = Casino.randInt(ORDER.length);
    const n = ORDER[index];
    await animateTo(index);

    let won = 0;
    for (const [key, amount] of Object.entries(bets)) {
      const b = betInfo(key);
      if (b.wins(n)) won += amount * b.ret;
    }
    const color = colorOf(n);
    resultEl.textContent = n;
    resultEl.style.color = color === 'red' ? '#ff5c6c' : color === 'green' ? '#3ddc84' : '#e8e6f0';
    lastCell = cells['n' + n];
    lastCell.classList.add('last');

    if (won > 0) Casino.give(won);
    const delta = won - staked;
    Casino.record('Рулетка', delta);
    const name = { red: 'красное', black: 'чёрное', green: 'зеро' }[color];
    if (delta > 0) Casino.setMsg(msg, `${n} ${name}. Выигрыш +${Casino.fmt(won)}!`, 'win');
    else if (won > 0) Casino.setMsg(msg, `${n} ${name}. Вернули ${Casino.fmt(won)} из ${Casino.fmt(staked)}`);
    else Casino.setMsg(msg, `${n} ${name}. Ставки проиграли`, 'lose');

    for (const k in bets) delete bets[k];
    renderBets();
    spinning = false;
    spinBtn.disabled = clearBtn.disabled = false;
  }

  spinBtn.addEventListener('click', spin);
  // Chips left on the table (not yet spun) go back to the player on page close.
  window.addEventListener('pagehide', () => {
    if (!spinning && totalBet()) Casino.give(totalBet());
  });
  drawWheel();
})();
