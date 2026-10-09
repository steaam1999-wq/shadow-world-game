// Plinko: 12 rows of pegs, ball bounces left/right at random into a multiplier slot.
(() => {
  const ROWS = 12;
  const TABLES = {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  };

  const canvas = document.getElementById('plinko-canvas');
  const ctx = canvas.getContext('2d');
  const btn = document.getElementById('plinko-btn');
  const betInput = document.getElementById('plinko-bet');
  const msg = document.getElementById('plinko-msg');
  const riskEl = document.getElementById('plinko-risk');

  const W = canvas.width, H = canvas.height;
  const GAP = 42, TOP = 40, CX = W / 2, BALL_R = 8, PEG_R = 4.5;
  const SLOT_Y = TOP + ROWS * GAP;
  const HOP_MS = 120;

  let risk = 'medium';
  const balls = [];
  const flashes = new Array(ROWS + 1).fill(0);

  riskEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    if (balls.length) return;
    risk = b.dataset.risk;
    riskEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    draw(performance.now());
  }));

  // x of the ball after `k` right bounces when it reaches row r (r = ROWS means the slot row).
  const ballX = (r, k) => CX + (k - r / 2) * GAP;
  const rowY = r => TOP + r * GAP;

  function slotColor(m) {
    if (m >= 10) return '#ff3b5c';
    if (m >= 3) return '#ff7a1a';
    if (m >= 1.5) return '#ffb020';
    if (m >= 1) return '#4c8dff';
    return '#3a4766';
  }

  function drop() {
    const bet = Casino.readBet(betInput, msg);
    if (bet === null) return;
    Casino.take(bet);
    const path = Array.from({ length: ROWS }, () => Casino.randInt(2));
    balls.push({ bet, path, risk, start: performance.now() });
    riskEl.classList.add('locked');
    if (balls.length === 1) requestAnimationFrame(loop);
  }

  // Ball position: first a short fall to row 0, then one hop per row.
  function ballPos(ball, now) {
    const t = (now - ball.start) / HOP_MS;
    if (t < 1) return { x: CX, y: rowY(0) * t * t - BALL_R, done: false };
    const step = Math.min(ROWS, Math.floor(t - 1));
    const f = Math.min(1, t - 1 - step);
    if (step >= ROWS) {
      const k = ball.path.reduce((a, b) => a + b, 0);
      return { x: ballX(ROWS, k), y: SLOT_Y - BALL_R, done: true, slot: k };
    }
    const k0 = ball.path.slice(0, step).reduce((a, b) => a + b, 0);
    const k1 = k0 + ball.path[step];
    const x = ballX(step, k0) + (ballX(step + 1, k1) - ballX(step, k0)) * f;
    const y = rowY(step) + (rowY(step + 1) - rowY(step)) * f * f - Math.sin(Math.PI * f) * 14 - BALL_R;
    return { x, y, done: false };
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e8ecf8';
    for (let r = 0; r < ROWS; r++) {
      for (let j = 0; j < r + 3; j++) {
        ctx.beginPath();
        ctx.arc(CX + (j - (r + 2) / 2) * GAP, rowY(r), PEG_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const table = TABLES[risk];
    const sw = GAP - 4, sh = 30;
    ctx.font = 'bold 12px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    table.forEach((mult, k) => {
      const x = ballX(ROWS, k);
      const lift = flashes[k] > now ? 6 : 0;
      ctx.fillStyle = slotColor(mult);
      ctx.globalAlpha = lift ? 1 : 0.9;
      roundRect(x - sw / 2, SLOT_Y + 6 + lift, sw, sh, 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillText(mult + '×', x, SLOT_Y + 6 + lift + sh / 2);
    });
    for (const b of balls) {
      const p = ballPos(b, now);
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcf33';
      ctx.shadowColor = '#ffcf33';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function loop(now) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const p = ballPos(b, now);
      if (!p.done) continue;
      balls.splice(i, 1);
      const mult = TABLES[b.risk][p.slot];
      const win = Math.floor(b.bet * mult);
      flashes[p.slot] = now + 250;
      if (win > 0) Casino.give(win);
      Casino.record('Плинко', win - b.bet);
      Casino.setMsg(msg, `×${mult}: ${win >= b.bet ? '+' : ''}${Casino.fmt(win - b.bet)} SC`, win >= b.bet ? 'win' : 'lose');
    }
    draw(now);
    if (!balls.length) riskEl.classList.remove('locked');
    if (balls.length || flashes.some(f => f > now)) requestAnimationFrame(loop);
  }

  btn.addEventListener('click', drop);

  // Balls in flight already have their outcome; settle them on page close.
  window.addEventListener('pagehide', () => {
    for (const b of balls.splice(0)) {
      const k = b.path.reduce((a, x) => a + x, 0);
      const win = Math.floor(b.bet * TABLES[b.risk][k]);
      if (win > 0) Casino.give(win);
      Casino.record('Плинко', win - b.bet);
    }
  });

  draw(performance.now());
})();
