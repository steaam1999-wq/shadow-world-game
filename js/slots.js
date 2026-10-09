// Three-reel slot machine with weighted symbols (~94% return to player).
(() => {
  const SYMBOLS = [
    { s: '🍒', w: 8, pay: 5 },
    { s: '🍋', w: 7, pay: 8 },
    { s: '🔔', w: 5, pay: 15 },
    { s: '💎', w: 3, pay: 40 },
    { s: '🌑', w: 2, pay: 100 },
    { s: '7️⃣', w: 1, pay: 500 },
  ];
  const TWO_CHERRIES = 2; // any two cherries pay x2
  const TOTAL_W = SYMBOLS.reduce((a, x) => a + x.w, 0);

  const reels = [0, 1, 2].map(i => document.getElementById('reel-' + i));
  const msg = document.getElementById('slots-msg');
  const betInput = document.getElementById('slots-bet');
  const spinBtn = document.getElementById('slots-spin');

  const table = document.getElementById('slots-paytable');
  for (const x of [...SYMBOLS].reverse()) {
    table.insertAdjacentHTML('beforeend', `<tr><td>${x.s} ${x.s} ${x.s}</td><td>×${x.pay}</td></tr>`);
  }
  table.insertAdjacentHTML('beforeend', `<tr><td>🍒 🍒 + любой</td><td>×${TWO_CHERRIES}</td></tr>`);

  function pick() {
    let r = Casino.randInt(TOTAL_W);
    for (const x of SYMBOLS) {
      if (r < x.w) return x;
      r -= x.w;
    }
  }

  function multiplier(result) {
    const [a, b, c] = result;
    if (a === b && b === c) return a.pay;
    if (result.filter(x => x.s === '🍒').length === 2) return TWO_CHERRIES;
    return 0;
  }

  let busy = false;
  async function spin() {
    if (busy) return;
    const bet = Casino.readBet(betInput, msg);
    if (bet === null) return;
    busy = true;
    spinBtn.disabled = true;
    Casino.take(bet);
    Casino.setMsg(msg, 'Крутим…');
    reels.forEach(r => r.classList.remove('hit'));

    const result = [pick(), pick(), pick()];
    const stopAt = [700, 1050, 1400];
    const start = performance.now();
    reels.forEach(r => r.classList.add('spinning'));

    await new Promise(resolve => {
      const tick = () => {
        const t = performance.now() - start;
        let done = true;
        reels.forEach((r, i) => {
          if (t < stopAt[i]) {
            r.textContent = SYMBOLS[Casino.randInt(SYMBOLS.length)].s;
            done = false;
          } else if (r.classList.contains('spinning')) {
            r.classList.remove('spinning');
            r.textContent = result[i].s;
          }
        });
        if (done) resolve(); else setTimeout(tick, 60);
      };
      tick();
    });

    const mult = multiplier(result);
    if (mult > 0) {
      const win = bet * mult;
      Casino.give(win);
      Casino.record('Слоты', win - bet);
      Casino.setMsg(msg, `Выигрыш ×${mult}: +${Casino.fmt(win)}!`, 'win');
      reels.forEach(r => r.classList.add('hit'));
    } else {
      Casino.record('Слоты', -bet);
      Casino.setMsg(msg, 'Не повезло. Ещё разок?', 'lose');
    }
    busy = false;
    spinBtn.disabled = false;
  }

  spinBtn.addEventListener('click', spin);
})();
