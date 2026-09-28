// Апгрейд: ставим предметы (и/или монеты) ради более дорогого скина с шансом.
window.App = window.App || {};
(function (App) {
  const { CATALOG, round2 } = App.data;
  const { money, itemCard, skinCard, toast, showDrops, fmtChance, esc } = App.ui;
  const store = App.store;

  const HOUSE = 0.95;      // шанс = ставка / цель * 0.95
  const MAX_CHANCE = 0.8;
  const MIN_CHANCE = 0.01;
  const MAX_ITEMS = 6;
  const MULTS = [1.5, 2, 3, 5, 10, 20];

  // uid, выбранный заранее (например, из инвентаря по кнопке «Апгрейд»).
  let preselect = null;
  let preTarget = null;
  App.upgradeWith = (uid) => { preselect = uid; location.hash = '#/upgrade'; };
  // Открыть апгрейд с выбранной целью (из каталога скинов).
  App.upgradeTo = (skinId) => { preTarget = skinId; location.hash = '#/upgrade'; };

  App.upgradeChance = (stake, price) => (price > stake && stake > 0 ? Math.min(MAX_CHANCE, (stake / price) * HOUSE) : 0);

  function chanceFor(stake, target) {
    if (!target || stake <= 0) return 0;
    return Math.min(MAX_CHANCE, (stake / target.price) * HOUSE);
  }

  function page(view) {
    const sel = new Set(preselect && store.findItem(preselect) ? [preselect] : []);
    preselect = null;
    let coins = 0;
    let mult = 2;
    const skinT = preTarget && App.data.SKINS[preTarget];
    let target = skinT
      ? CATALOG.find((e) => e.skin === skinT && e.wear === 'FT') || CATALOG.find((e) => e.skin === skinT)
      : null;
    let query = skinT ? `${skinT.weapon} ${skinT.name}` : '';
    preTarget = null;
    let busy = false;
    // Зафиксированный апгрейд: пока крутится колесо и после результата показываем именно его шанс.
    let locked = null;
    const unlock = () => { locked = null; };
    let angle = 0;

    view.innerHTML = `
      <h1 class="page-title">Апгрейд</h1>
      <div class="upgrade">
        <div class="panel">
          <div class="panel-head"><span>Ваша ставка</span><span id="stake-sum"></span></div>
          <div class="coins-stake">
            <label>Добавить монеты: <b id="coins-val"></b></label>
            <input type="range" id="coins" min="0" step="0.01" value="0">
          </div>
          <div class="item-grid small scroll" id="inv"></div>
        </div>

        <div class="wheel-wrap">
          <div class="wheel">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="84" class="wheel-bg"/>
              <circle cx="100" cy="100" r="84" class="wheel-win" id="arc" pathLength="100" stroke-dasharray="0 100"/>
            </svg>
            <div class="wheel-pointer" id="pointer"><i></i></div>
            <div class="wheel-center">
              <div class="wheel-chance" id="chance">0%</div>
              <div class="wheel-label" id="wlabel">шанс</div>
            </div>
          </div>
          <div class="upgrade-target" id="target-view"></div>
          <button class="btn primary big" id="go">Апгрейд</button>
        </div>

        <div class="panel">
          <div class="panel-head"><span>Цель</span>
            <input class="search" id="q" placeholder="Поиск скина…" value="${esc(query)}"></div>
          <div class="seg wrap" id="mults">${MULTS.map((m) => `<button data-m="${m}" class="${m === mult ? 'on' : ''}">x${m}</button>`).join('')}</div>
          <div class="item-grid small scroll" id="targets"></div>
        </div>
      </div>`;

    const $ = (s) => view.querySelector(s);
    const coinsInput = $('#coins');

    const stakeItems = () => store.state.inventory.filter((it) => sel.has(it.uid));
    const stakeValue = () => round2(stakeItems().reduce((s, it) => s + it.price, 0) + coins);

    function renderInv() {
      for (const uid of sel) if (!store.findItem(uid)) sel.delete(uid);
      const inv = store.state.inventory;
      $('#inv').innerHTML = inv.length
        ? inv.map((it) => itemCard(it, { selected: sel.has(it.uid) })).join('')
        : '<p class="empty">Инвентарь пуст — <a href="#/">откройте кейс</a> или поставьте монеты.</p>';
      coinsInput.max = Math.max(0, store.state.balance);
      if (coins > store.state.balance) coins = round2(store.state.balance);
      coinsInput.value = coins;
      $('#coins-val').innerHTML = money(coins);
    }

    function renderTargets() {
      const stake = stakeValue();
      const min = Math.max(stake * mult, 0.02);
      const q = query.toLowerCase();
      const list = CATALOG.filter((e) =>
        e.price > stake && (q ? `${e.skin.weapon} ${e.skin.name}`.toLowerCase().includes(q) : e.price >= min)
      ).slice(0, 60);
      if (target && target.price <= stake) target = null;
      $('#targets').innerHTML = list.length
        ? list.map((e) => skinCard(e.skin, { price: e.price, wear: e.wear, key: e.key, selected: target && target.key === e.key })).join('')
        : '<p class="empty">Нет подходящих предметов</p>';
    }

    function renderCenter() {
      const L = locked;
      const stake = L ? L.stake : stakeValue();
      const tgt = L ? L.tgt : target;
      const ch = L ? L.ch : chanceFor(stake, tgt);
      $('#stake-sum').innerHTML = money(stakeValue());
      $('#chance').textContent = tgt ? fmtChance(ch) : '—';
      $('#arc').setAttribute('stroke-dasharray', `${ch * 100} 100`);
      $('#wlabel').textContent = L && L.roll != null
        ? `выпало ${(L.roll * 100).toFixed(2)} — ${L.win ? 'победа' : 'мимо'}`
        : L ? 'крутим…' : 'шанс';
      $('#wlabel').className = `wheel-label ${L && L.roll != null ? (L.win ? 'good' : 'bad') : ''}`;
      $('#target-view').innerHTML = tgt
        ? `<div class="target-line">${esc(tgt.skin.weapon)} | ${esc(tgt.skin.name)} (${tgt.wear}) — ${money(tgt.price)}
             ${stake > 0 ? `<span class="muted">x${(tgt.price / stake).toFixed(2)}</span>` : ''}</div>`
        : '<div class="muted">Выберите ставку и предмет справа</div>';
      $('#go').disabled = busy || !!L || !target || stakeValue() <= 0 || chanceFor(stakeValue(), target) < MIN_CHANCE;
    }

    function renderAll() { renderInv(); renderTargets(); renderCenter(); }

    $('#inv').addEventListener('click', (e) => {
      if (e.target.closest('.item-tool')) return;
      const card = e.target.closest('.item');
      if (!card || busy) return;
      const uid = card.dataset.uid;
      unlock();
      if (sel.has(uid)) sel.delete(uid);
      else if (sel.size >= MAX_ITEMS) return toast(`Не больше ${MAX_ITEMS} предметов`, 'bad');
      else sel.add(uid);
      renderAll();
    });
    coinsInput.addEventListener('input', () => {
      if (busy) return;
      unlock();
      coins = round2(+coinsInput.value);
      $('#coins-val').innerHTML = money(coins);
      renderTargets();
      renderCenter();
    });
    $('#mults').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (busy) return;
      unlock();
      mult = +b.dataset.m;
      $('#mults').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      target = null;
      renderTargets();
      renderCenter();
    });
    $('#q').addEventListener('input', (e) => { query = e.target.value.trim(); renderTargets(); });
    $('#targets').addEventListener('click', (e) => {
      if (e.target.closest('.item-tool')) return;
      const card = e.target.closest('.item');
      if (!card || busy) return;
      unlock();
      target = CATALOG.find((x) => x.key === card.dataset.key);
      renderTargets();
      renderCenter();
    });

    $('#go').addEventListener('click', async () => {
      const stake = stakeValue();
      const ch = chanceFor(stake, target);
      if (busy || !target || ch < MIN_CHANCE) return;
      if (!store.canAfford(coins)) return toast('Недостаточно монет', 'bad');

      busy = true;
      const tgt = target;
      locked = { stake, ch, tgt, roll: null, win: false };
      const uids = [...sel];
      const roll = App.fair.next()();
      const win = roll < ch;

      store.removeItems(uids);
      if (coins > 0) store.spend(coins);
      store.state.xp = round2(store.state.xp + (stake - coins)); // предметы тоже дают опыт
      store.state.stats.upgrades++;
      let prize = null;
      if (win) {
        store.state.stats.upgradesWon++;
        prize = store.makeItem(tgt.skin, tgt.wear, false, 'Апгрейд');
        store.addItems([prize]);
      }
      store.log('upgrade', `${win ? 'Удачно' : 'Неудачно'}: ${tgt.skin.weapon} | ${tgt.skin.name} (${tgt.wear}), шанс ${(ch * 100).toFixed(2)}%`, win ? tgt.price : -stake);
      store.save();
      renderCenter();

      // Стрелка останавливается на угле roll*360: зелёная дуга — [0, шанс*360).
      const fast = store.state.settings.fast;
      angle = angle - (angle % 360) + 360 * (fast ? 3 : 6) + roll * 360;
      const ptr = $('#pointer');
      ptr.style.transition = `transform ${fast ? 1200 : 4200}ms cubic-bezier(.12,.72,.1,1)`;
      ptr.style.transform = `rotate(${angle}deg)`;
      await App.ui.sleep(fast ? 1300 : 4300);
      if (!view.isConnected) return;

      locked.roll = roll;
      locked.win = win;
      view.querySelector('.wheel').classList.add(win ? 'win' : 'lose');
      setTimeout(() => view.querySelector('.wheel')?.classList.remove('win', 'lose'), 1500);
      sel.clear();
      coins = 0;
      busy = false;
      target = null;
      if (win) {
        App.feed.push('Вы', prize, null, 'upgrade');
        showDrops([prize], `Апгрейд удался! (выпало ${(roll * 100).toFixed(2)} < ${(ch * 100).toFixed(2)})`);
      } else {
        toast(`Неудача: выпало ${(roll * 100).toFixed(2)}, нужно меньше ${(ch * 100).toFixed(2)}`, 'bad');
      }
      renderAll();
    });

    renderAll();
    return store.subscribe(() => { if (!busy) { renderInv(); renderCenter(); } });
  }

  App.pages = App.pages || {};
  App.pages.upgrade = page;
})(window.App);
