// Blackjack: 6-deck shoe, dealer stands on all 17s, blackjack pays 3:2, double on first two cards.
(() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const DECKS = 6;

  const dealerEl = document.getElementById('dealer-hand');
  const playerEl = document.getElementById('player-hand');
  const dealerScoreEl = document.getElementById('dealer-score');
  const playerScoreEl = document.getElementById('player-score');
  const msg = document.getElementById('bj-msg');
  const betInput = document.getElementById('bj-bet');
  const dealBtn = document.getElementById('bj-deal');
  const hitBtn = document.getElementById('bj-hit');
  const standBtn = document.getElementById('bj-stand');
  const doubleBtn = document.getElementById('bj-double');

  let shoe = [];
  let dealer = [], player = [];
  let bet = 0;
  let inRound = false;
  let holeHidden = true;

  function newShoe() {
    shoe = [];
    for (let d = 0; d < DECKS; d++)
      for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
    for (let i = shoe.length - 1; i > 0; i--) {
      const j = Casino.randInt(i + 1);
      [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }
  }

  function draw() {
    if (shoe.length < 52) newShoe();
    return shoe.pop();
  }

  function score(hand) {
    let total = 0, aces = 0;
    for (const c of hand) {
      if (c.r === 'A') { aces++; total += 11; }
      else if ('JQK'.includes(c.r) || c.r === '10') total += 10;
      else total += Number(c.r);
    }
    while (total > 21 && aces) { total -= 10; aces--; }
    return total;
  }

  const isBlackjack = hand => hand.length === 2 && score(hand) === 21;

  function cardEl(c, hidden) {
    const el = document.createElement('div');
    if (hidden) {
      el.className = 'card back';
      return el;
    }
    el.className = 'card' + (c.s === '♥' || c.s === '♦' ? ' red' : '');
    el.innerHTML = `<span></span><span class="big"></span><span style="align-self:flex-end"></span>`;
    el.children[0].textContent = c.r;
    el.children[1].textContent = c.s;
    el.children[2].textContent = c.r;
    return el;
  }

  function render() {
    dealerEl.innerHTML = '';
    dealer.forEach((c, i) => dealerEl.appendChild(cardEl(c, i === 1 && holeHidden)));
    playerEl.innerHTML = '';
    player.forEach(c => playerEl.appendChild(cardEl(c)));
    playerScoreEl.textContent = player.length ? `(${score(player)})` : '';
    dealerScoreEl.textContent = !dealer.length ? '' : holeHidden ? `(${score([dealer[0]])})` : `(${score(dealer)})`;
  }

  function setButtons() {
    dealBtn.disabled = inRound;
    betInput.disabled = inRound;
    hitBtn.disabled = standBtn.disabled = !inRound;
    doubleBtn.disabled = !inRound || player.length !== 2 || Casino.balance() < bet;
  }

  function finish(text, ret, cls) {
    holeHidden = false;
    inRound = false;
    render();
    if (ret > 0) Casino.give(ret);
    Casino.record('Блэкджек', ret - bet);
    Casino.setMsg(msg, text, cls);
    setButtons();
  }

  function deal() {
    if (inRound) return;
    const b = Casino.readBet(betInput, msg);
    if (b === null) return;
    bet = b;
    Casino.take(bet);
    holeHidden = true;
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    inRound = true;
    Casino.setMsg(msg, 'Ваш ход');
    render();
    setButtons();

    const pBJ = isBlackjack(player), dBJ = isBlackjack(dealer);
    if (pBJ && dBJ) finish('Оба блэкджека — ничья', bet);
    else if (pBJ) finish(`Блэкджек! +${Casino.fmt(Math.floor(bet * 1.5))}`, bet + Math.floor(bet * 1.5), 'win');
    else if (dBJ) finish('У дилера блэкджек', 0, 'lose');
  }

  function hit() {
    if (!inRound) return;
    player.push(draw());
    render();
    const s = score(player);
    if (s > 21) finish(`Перебор (${s})`, 0, 'lose');
    else if (s === 21) stand();
    else setButtons();
  }

  async function stand() {
    if (!inRound) return;
    hitBtn.disabled = standBtn.disabled = doubleBtn.disabled = true;
    holeHidden = false;
    render();
    while (score(dealer) < 17) {
      await sleep(500);
      dealer.push(draw());
      render();
    }
    const p = score(player), d = score(dealer);
    if (d > 21) finish(`У дилера перебор! +${Casino.fmt(bet)}`, bet * 2, 'win');
    else if (p > d) finish(`${p} против ${d} — победа! +${Casino.fmt(bet)}`, bet * 2, 'win');
    else if (p < d) finish(`${p} против ${d} — проигрыш`, 0, 'lose');
    else finish(`${p} против ${d} — ничья`, bet);
  }

  function double() {
    if (!inRound || player.length !== 2 || !Casino.take(bet)) return;
    bet *= 2;
    player.push(draw());
    render();
    const s = score(player);
    if (s > 21) finish(`Перебор (${s})`, 0, 'lose');
    else stand();
  }

  dealBtn.addEventListener('click', deal);
  hitBtn.addEventListener('click', hit);
  standBtn.addEventListener('click', stand);
  doubleBtn.addEventListener('click', double);

  newShoe();
  setButtons();
})();
