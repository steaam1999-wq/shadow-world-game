// Главная (список кейсов) и страница открытия кейса.
window.App = window.App || {};
(function (App) {
  const { CASES, CASE_BY_ID, GROUPS } = App.data;
  const { money, caseArt, skinCard, toast, showDrops, esc } = App.ui;
  const store = App.store;

  function fmtTimer(ms) {
    const s = Math.ceil(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }

  function caseTile(c) {
    const left = c.free ? store.freeReadyIn() : 0;
    const label = c.free ? (left ? `<span class="timer" data-free-timer>${fmtTimer(left)}</span>` : 'Бесплатно') : money(c.price);
    return `<a class="case-tile" href="#/case/${c.id}" style="--cc:${c.color}">
      ${caseArt(c)}
      <div class="case-name">${esc(c.name)}</div>
      <div class="case-price">${label}</div>
    </a>`;
  }

  function home(view) {
    const s = store.state.stats;
    view.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <h1>Открывай кейсы. <span class="grad">Апгрейдь</span> скины.</h1>
          <p>Симулятор лучших механик CS2-сайтов: рулетка кейсов, апгрейд с колесом шансов, контракты и батлы.
             Все результаты — <a href="#/fair">Provably Fair</a> и проверяемы вручную.</p>
          <div class="hero-cta">
            <a class="btn primary big" href="#/case/free">Открыть бесплатный кейс</a>
            <a class="btn ghost big" href="#/upgrade">Попробовать апгрейд</a>
          </div>
        </div>
        <div class="hero-side">
          <form class="promo" id="promo">
            <div class="promo-title">Промокод</div>
            <div class="row"><input name="code" placeholder="Например, SHADOW" maxlength="20" autocomplete="off">
            <button class="btn primary">OK</button></div>
          </form>
          <div class="mini-stats">
            <div><b>${s.opened}</b><span>кейсов открыто</span></div>
            <div><b>${s.upgradesWon}/${s.upgrades}</b><span>апгрейдов</span></div>
            <div><b>${s.battlesWon}/${s.battles}</b><span>батлов</span></div>
          </div>
        </div>
      </section>
      ${GROUPS.map((g) => `
        <section class="case-group">
          <h2 class="section-title">${g.name}${g.note ? `<span class="section-note">${g.note}</span>` : ''}</h2>
          <div class="case-grid">${CASES.filter((c) => c.group === g.id).map(caseTile).join('')}</div>
        </section>`).join('')}`;

    view.querySelector('#promo').addEventListener('submit', (e) => {
      e.preventDefault();
      const code = e.target.code.value.trim().toUpperCase();
      App.redeemPromo(code);
      e.target.reset();
    });
    return tickFree(view);
  }

  // Обновляет таймер бесплатного кейса раз в секунду; возвращает функцию очистки.
  function tickFree(view, onReady) {
    const id = setInterval(() => {
      const left = store.freeReadyIn();
      view.querySelectorAll('[data-free-timer]').forEach((el) => { el.textContent = left ? fmtTimer(left) : 'Готово!'; });
      if (!left && onReady) onReady();
    }, 1000);
    return () => clearInterval(id);
  }

  function casePage(view, id) {
    const c = CASE_BY_ID[id];
    if (!c) { view.innerHTML = '<p class="empty">Кейс не найден. <a href="#/">На главную</a></p>'; return; }
    let count = 1;
    let busy = false;

    view.innerHTML = `
      <div class="case-head" style="--cc:${c.color}">
        <a href="#/" class="back">← Все кейсы</a>
        ${caseArt(c)}
        <h1>${esc(c.name)}</h1>
        <div class="case-meta">${c.free ? 'Раз в 24 часа'
          : c.official ? `Официальный кейс CS2 · вышел ${esc(c.date)} · шансы Valve · ${c.items.length} предметов`
          : `RTP ≈ ${Math.round(c.rtp * 100)}% · ${c.items.length} предметов`}</div>
      </div>
      <div class="reels" id="reels"></div>
      <div class="open-bar">
        ${c.free ? '' : `<div class="seg" id="count">${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" class="${n === 1 ? 'on' : ''}">x${n}</button>`).join('')}</div>`}
        <button class="btn primary big" id="open"></button>
        <label class="switch"><input type="checkbox" id="fast" ${store.state.settings.fast ? 'checked' : ''}><span></span>Быстро</label>
      </div>
      <h2 class="section-title">Содержимое кейса</h2>
      <div class="item-grid">${c.items.map((it) => skinCard(it.skin, { chance: it.chance })).join('')}</div>`;

    const reels = view.querySelector('#reels');
    const openBtn = view.querySelector('#open');

    function drawIdleReels() {
      reels.innerHTML = Array.from({ length: count }, () => '<div class="reel idle"></div>').join('');
      reels.querySelectorAll('.reel').forEach((r) => {
        r.innerHTML = `<div class="reel-strip">${c.items.slice().reverse().concat(c.items).slice(0, 12).map((it) => App.reel.cell(it.skin)).join('')}</div><div class="reel-marker"></div>`;
      });
      reels.dataset.count = count;
    }

    function updateButton() {
      if (c.free) {
        const left = store.freeReadyIn();
        openBtn.disabled = busy || left > 0;
        openBtn.innerHTML = left ? `Доступно через <span data-free-timer>${fmtTimer(left)}</span>` : 'Открыть бесплатно';
      } else {
        openBtn.disabled = busy;
        openBtn.innerHTML = `Открыть за ${money(c.price * count)}`;
      }
    }

    view.querySelector('#count')?.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || busy) return;
      count = +b.dataset.n;
      view.querySelectorAll('#count button').forEach((x) => x.classList.toggle('on', x === b));
      drawIdleReels();
      updateButton();
    });
    view.querySelector('#fast').addEventListener('change', (e) => {
      store.state.settings.fast = e.target.checked;
      store.save();
    });

    openBtn.addEventListener('click', async () => {
      if (busy) return;
      const cost = c.price * count;
      if (c.free) {
        if (store.freeReadyIn() > 0) return;
        store.state.lastFree = Date.now();
      } else if (!store.canAfford(cost)) {
        toast('Недостаточно монет. Пополните демо-баланс.', 'bad');
        App.openDeposit();
        return;
      } else {
        store.spend(cost);
      }
      busy = true;
      updateButton();

      const results = Array.from({ length: count }, () => App.rollCaseItem(c, App.fair.next()));
      const items = results.map((r) => store.makeItem(r.skin, r.wear, r.st, `Кейс «${c.name}»`));
      store.state.stats.opened += count;
      store.addItems(items);
      store.save();

      drawIdleReels();
      const fast = store.state.settings.fast;
      await Promise.all([...reels.querySelectorAll('.reel')].map((el, i) => {
        el.classList.remove('idle');
        return App.reel.spin(el, c, results[i].skin, { fast });
      }));
      items.forEach((it) => App.feed.push('Вы', it, c.id));
      busy = false;
      updateButton();
      showDrops(items);
    });

    drawIdleReels();
    updateButton();
    return tickFree(view, () => { if (c.free && !busy) updateButton(); });
  }

  App.pages = App.pages || {};
  App.pages.home = home;
  App.pages.case = casePage;
})(window.App);
