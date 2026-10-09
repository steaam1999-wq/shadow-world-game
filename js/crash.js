// Crash ("Ракета"): rounds run continuously; cash out before the rocket flies away.
(() => {
  const HOUSE = 0.97;          // P(crash >= m) = 0.97 / m
  const MAX_MULT = 1000;
  const GROWTH = 0.115;        // m(t) = e^(GROWTH * t)
  const BETTING_MS = 6000;
  const AFTER_CRASH_MS = 3000;

  const canvas = document.getElementById('crash-canvas');
  const ctx = canvas.getContext('2d');
  const multEl = document.getElementById('crash-mult');
  const statusEl = document.getElementById('crash-status');
  const btn = document.getElementById('crash-btn');
  const betInput = document.getElementById('crash-bet');
  const autoOn = document.getElementById('crash-auto-on');
  const autoInput = document.getElementById('crash-auto');
  const msg = document.getElementById('crash-msg');
  const historyEl = document.getElementById('crash-history');

  let phase = 'betting';       // betting | flying | crashed
  let phaseStart = performance.now();
  let crashPoint = 1;
  let mult = 1;
  let myBet = null;            // { amount, auto } for the current round
  let nextBet = null;          // queued for the next round
  const past = [];

  function rollCrashPoint() {
    const r = Casino.random();
    const m = Math.floor((100 * HOUSE) / (1 - r)) / 100;
    return Math.min(MAX_MULT, Math.max(1, m));
  }

  const multAt = t => Math.min(MAX_MULT, Math.exp(GROWTH * t));
  const timeOf = m => Math.log(m) / GROWTH;

  function startBetting(now) {
    phase = 'betting';
    phaseStart = now;
    mult = 1;
    crashPoint = rollCrashPoint();
    myBet = nextBet;
    nextBet = null;
    updateButton();
  }

  function readAuto() {
    if (!autoOn.checked) return null;
    const a = Math.floor(Number(autoInput.value) * 100) / 100;
    return a >= 1.01 ? a : null;
  }

  function cashOut(at) {
    if (!myBet || phase !== 'flying') return;
    const win = Math.floor(myBet.amount * at);
    Casino.give(win);
    Casino.record('Ракета', win - myBet.amount);
    Casino.setMsg(msg, `Забрали на ×${at.toFixed(2)}: +${Casino.fmt(win)} SC`, 'win');
    myBet = null;
    updateButton();
  }

  function onButton() {
    if (phase === 'flying' && myBet) {
      cashOut(mult);
      return;
    }
    const slot = phase === 'betting' ? 'myBet' : 'nextBet';
    const current = slot === 'myBet' ? myBet : nextBet;
    if (current) {
      // Cancel a bet that hasn't flown yet.
      Casino.give(current.amount);
      if (slot === 'myBet') myBet = null; else nextBet = null;
      Casino.setMsg(msg, 'Ставка отменена');
      updateButton();
      return;
    }
    const amount = Casino.readBet(betInput, msg);
    if (amount === null) return;
    Casino.take(amount);
    const bet = { amount, auto: readAuto() };
    if (slot === 'myBet') myBet = bet; else nextBet = bet;
    Casino.setMsg(msg, slot === 'myBet' ? `Ставка ${Casino.fmt(amount)} SC принята` : 'Ставка на следующий раунд');
    updateButton();
  }

  function updateButton() {
    btn.classList.remove('cashout', 'cancel');
    if (phase === 'flying' && myBet) {
      btn.classList.add('cashout');
      btn.innerHTML = `Забрать<small>${Casino.fmt(Math.floor(myBet.amount * mult))} SC</small>`;
    } else if ((phase === 'betting' && myBet) || (phase !== 'betting' && nextBet)) {
      btn.classList.add('cancel');
      btn.innerHTML = phase === 'betting' ? 'Отменить' : 'Отменить<small>ожидание раунда</small>';
    } else {
      btn.innerHTML = phase === 'betting' ? 'Ставка' : 'Ставка<small>на следующий раунд</small>';
    }
    const lock = !!(myBet || nextBet);
    betInput.disabled = autoOn.disabled = lock;
    autoInput.disabled = lock || !autoOn.checked;
  }

  function addPast(m) {
    past.unshift(m);
    past.length = Math.min(past.length, 20);
    historyEl.innerHTML = '';
    for (const p of past) {
      const s = document.createElement('span');
      s.className = 'chip ' + (p < 2 ? 'low' : p < 10 ? 'mid' : 'high');
      s.textContent = '×' + p.toFixed(2);
      historyEl.appendChild(s);
    }
  }

  // Background stars, fixed per session.
  const stars = Array.from({ length: 60 }, () => [Math.random(), Math.random(), Math.random() * 1.5 + 0.3]);

  function draw(now) {
    const W = canvas.width, H = canvas.height;
    const padL = 50, padB = 36, padT = 20, padR = 30;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1340');
    g.addColorStop(1, '#0d1226');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const drift = phase === 'flying' ? (now - phaseStart) / 40 : 0;
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (const [x, y, r] of stars) {
      const sx = ((x * W - drift * r) % W + W) % W;
      ctx.beginPath(); ctx.arc(sx, y * H, r, 0, Math.PI * 2); ctx.fill();
    }

    if (phase === 'betting') return;

    const t = phase === 'flying' ? (now - phaseStart) / 1000 : timeOf(mult);
    const tMax = Math.max(8, t * 1.15);
    const mMax = Math.max(2, mult * 1.15);
    const X = s => padL + (s / tMax) * (W - padL - padR);
    const Y = m => H - padB - ((m - 1) / (mMax - 1)) * (H - padB - padT);

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = '13px Montserrat, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const m = 1 + (mMax - 1) * i / 4;
      ctx.fillText('×' + m.toFixed(1), padL - 8, Y(m) + 4);
    }
    ctx.textAlign = 'center';
    const stepS = Math.ceil(tMax / 6);
    for (let s = stepS; s < tMax; s += stepS) ctx.fillText(s + 'с', X(s), H - 12);

    // Curve with filled area
    const crashed = phase === 'crashed';
    const color = crashed ? '#ff4d5e' : '#ff8a1f';
    ctx.beginPath();
    ctx.moveTo(X(0), Y(1));
    const N = 80;
    for (let i = 1; i <= N; i++) {
      const s = (t * i) / N;
      ctx.lineTo(X(s), Y(multAt(s)));
    }
    const tipX = X(t), tipY = Y(mult);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.lineTo(tipX, Y(1));
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, tipY, 0, Y(1));
    fill.addColorStop(0, crashed ? 'rgba(255,77,94,.35)' : 'rgba(255,138,31,.35)');
    fill.addColorStop(1, 'rgba(255,138,31,0)');
    ctx.fillStyle = fill;
    ctx.fill();

    // Rocket at the tip (flies off-screen after crash)
    let rx = tipX, ry = tipY;
    if (crashed) {
      const k = Math.min(1, (now - phaseStart) / 600);
      rx += k * 300; ry -= k * 300;
    }
    ctx.save();
    ctx.translate(rx, ry);
    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', 0, 0);
    ctx.restore();
  }

  function tick() {
    const now = performance.now();
    const elapsed = now - phaseStart;

    if (phase === 'betting') {
      const left = Math.max(0, (BETTING_MS - elapsed) / 1000);
      statusEl.textContent = `Раунд начнётся через ${left.toFixed(1)}с`;
      statusEl.className = 'crash-status';
      multEl.textContent = '×1.00';
      multEl.className = 'crash-mult waiting';
      if (elapsed >= BETTING_MS) {
        phase = 'flying';
        phaseStart = now;
        statusEl.textContent = '';
        updateButton();
      }
    } else if (phase === 'flying') {
      mult = multAt(elapsed / 1000);
      if (myBet && myBet.auto && myBet.auto <= crashPoint && mult >= myBet.auto) {
        mult = myBet.auto;
        cashOut(myBet.auto);
      }
      if (mult >= crashPoint) {
        mult = crashPoint;
        phase = 'crashed';
        phaseStart = now;
        addPast(crashPoint);
        if (myBet) {
          Casino.record('Ракета', -myBet.amount);
          Casino.setMsg(msg, `Ракета улетела на ×${crashPoint.toFixed(2)}. Ставка сгорела`, 'lose');
          myBet = null;
        }
        updateButton();
      } else if (myBet) {
        btn.querySelector('small').textContent = `${Casino.fmt(Math.floor(myBet.amount * mult))} SC`;
      }
      multEl.textContent = '×' + mult.toFixed(2);
      multEl.className = 'crash-mult' + (phase === 'crashed' ? ' crashed' : '');
      if (phase === 'crashed') {
        statusEl.textContent = 'Улетела!';
        statusEl.className = 'crash-status crashed';
      }
    } else if (elapsed >= AFTER_CRASH_MS) {
      startBetting(now);
    }

    draw(now);
    requestAnimationFrame(tick);
  }

  // Seed the history strip with a few past rounds so the game doesn't look empty.
  for (let i = 0; i < 12; i++) addPast(rollCrashPoint());

  btn.addEventListener('click', onButton);
  autoOn.addEventListener('change', updateButton);
  startBetting(performance.now());

  // Unflown bets go back to the player on page close.
  window.addEventListener('pagehide', () => {
    if (phase === 'betting' && myBet) Casino.give(myBet.amount);
    if (nextBet) Casino.give(nextBet.amount);
  });

  requestAnimationFrame(tick);
})();
