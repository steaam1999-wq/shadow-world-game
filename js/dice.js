// Dice: roll 0–99, win if the roll is below the target. 1% house edge.
(() => {
  const EDGE = 0.99;

  const rollEl = document.getElementById('dice-roll');
  const fill = document.getElementById('dice-fill');
  const marker = document.getElementById('dice-marker');
  const target = document.getElementById('dice-target');
  const targetVal = document.getElementById('dice-target-val');
  const chanceEl = document.getElementById('dice-chance');
  const multEl = document.getElementById('dice-mult');
  const payoutEl = document.getElementById('dice-payout');
  const msg = document.getElementById('dice-msg');
  const betInput = document.getElementById('dice-bet');
  const btn = document.getElementById('dice-btn');

  const mult = t => (100 * EDGE) / t;

  function update() {
    const t = Number(target.value);
    targetVal.textContent = t;
    fill.style.width = t + '%';
    chanceEl.textContent = t + '%';
    multEl.textContent = '×' + mult(t).toFixed(2);
    const bet = Math.max(0, Math.floor(Number(betInput.value)) || 0);
    payoutEl.textContent = Casino.fmt(Math.floor(bet * mult(t)));
  }

  let busy = false;
  async function roll() {
    if (busy) return;
    const bet = Casino.readBet(betInput, msg);
    if (bet === null) return;
    busy = true;
    btn.disabled = target.disabled = true;
    Casino.take(bet);
    rollEl.className = 'dice-roll';
    Casino.setMsg(msg, 'Бросаем…');

    const t = Number(target.value);
    const result = Casino.randInt(100);
    for (let i = 0; i < 12; i++) {
      rollEl.textContent = String(Casino.randInt(100)).padStart(2, '0');
      await sleep(50);
    }
    rollEl.textContent = String(result).padStart(2, '0');
    marker.style.display = 'block';
    marker.style.left = `calc(${result + 0.5}% - 2px)`;

    if (result < t) {
      const win = Math.floor(bet * mult(t));
      Casino.give(win);
      Casino.record('Кости', win - bet);
      rollEl.classList.add('win');
      Casino.setMsg(msg, `${result} < ${t}. Выигрыш +${Casino.fmt(win)}!`, 'win');
    } else {
      Casino.record('Кости', -bet);
      rollEl.classList.add('lose');
      Casino.setMsg(msg, `${result} ≥ ${t}. Мимо`, 'lose');
    }
    busy = false;
    btn.disabled = target.disabled = false;
  }

  target.addEventListener('input', update);
  betInput.addEventListener('input', update);
  btn.addEventListener('click', roll);
  update();
})();
