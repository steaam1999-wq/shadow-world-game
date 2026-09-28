// Каталог всех скинов CS2 и страница отдельного скина с шансами выпадения.
window.App = window.App || {};
(function (App) {
  const { SKINS, SKIN_LIST, RARITY, DROPS, fullName, itemPrice, wearOdds, STATTRAK_CHANCE } = App.data;
  const { skinCard, esc, money, skinIcon, fmtChance } = App.ui;
  const store = App.store;

  const PAGE = 96;
  const TYPES = [
    ['all', 'Все'], ['knife', 'Ножи'], ['gloves', 'Перчатки'], ['rifle', 'Винтовки'],
    ['sniper', 'Снайперские'], ['pistol', 'Пистолеты'], ['smg', 'ПП'],
  ];
  const bestDrop = (skin) => (DROPS[skin.id] || [])[0];

  function catalog(view) {
    let type = 'all', rarity = 'all', sort = 'desc', q = '', shown = PAGE;

    view.innerHTML = `
      <h1 class="page-title">Скины CS2</h1>
      <p class="muted">Все ${SKIN_LIST.length.toLocaleString('ru-RU')} скинов игры: оружие, ножи и перчатки.
        Цены ориентировочные, для FT. В углу карточки — лучший шанс выпадения из кейса. Нажмите на скин, чтобы открыть его страницу.</p>
      <div class="catalog-bar">
        <input class="search" id="cq" placeholder="AK-47, Asiimov, Karambit…" autocomplete="off">
        <div class="seg wrap" id="ctype">${TYPES.map(([id, n]) => `<button data-v="${id}" class="${id === type ? 'on' : ''}">${n}</button>`).join('')}</div>
        <select id="crar">
          <option value="all">Любая редкость</option>
          ${Object.entries(RARITY).map(([id, r]) => `<option value="${id}">${r.name}</option>`).join('')}
        </select>
        <select id="csort">
          <option value="desc">Сначала дорогие</option>
          <option value="asc">Сначала дешёвые</option>
          <option value="chance">Сначала частые</option>
          <option value="name">По названию</option>
        </select>
      </div>
      <div class="catalog-count muted" id="ccount"></div>
      <div class="item-grid" id="cgrid"></div>
      <div class="catalog-more"><button class="btn ghost" id="cmore">Показать ещё</button></div>`;

    const $ = (s) => view.querySelector(s);

    function filtered() {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const list = SKIN_LIST.filter((s) =>
        (type === 'all' || s.type === type) &&
        (rarity === 'all' || s.rarity === rarity) &&
        words.every((w) => fullName(s).toLowerCase().includes(w)));
      if (sort === 'desc') list.sort((a, b) => b.price - a.price);
      else if (sort === 'asc') list.sort((a, b) => a.price - b.price);
      else if (sort === 'chance') list.sort((a, b) => (bestDrop(b)?.chance || 0) - (bestDrop(a)?.chance || 0));
      else list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
      return list;
    }

    function render() {
      const list = filtered();
      $('#ccount').textContent = `Найдено: ${list.length.toLocaleString('ru-RU')}`;
      $('#cgrid').innerHTML = list.length
        ? list.slice(0, shown).map((s) => skinCard(s, { chance: bestDrop(s)?.chance, view: true })).join('')
        : '<p class="empty">Ничего не нашлось — попробуйте другой запрос.</p>';
      $('#cmore').hidden = list.length <= shown;
    }

    const reset = () => { shown = PAGE; render(); };
    $('#cq').addEventListener('input', (e) => { q = e.target.value.trim(); reset(); });
    $('#ctype').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      type = b.dataset.v;
      $('#ctype').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      reset();
    });
    $('#crar').addEventListener('change', (e) => { rarity = e.target.value; reset(); });
    $('#csort').addEventListener('change', (e) => { sort = e.target.value; reset(); });
    $('#cmore').addEventListener('click', () => { shown += PAGE; render(); });

    render();
  }

  // «В среднем 1 из N открытий».
  const oneIn = (p) => Math.max(1, Math.round(1 / p)).toLocaleString('ru-RU');

  function skinPage(view, id) {
    const skin = SKINS[id];
    if (!skin) { view.innerHTML = '<p class="empty">Скин не найден. <a href="#/skins">Все скины</a></p>'; return; }
    const r = RARITY[skin.rarity];
    const drops = DROPS[id] || [];
    const best = drops[0];
    const wears = wearOdds(skin);
    const prices = wears.map((w) => itemPrice(skin, w.id, false));
    const minP = Math.min(...prices), maxP = Math.max(...prices, skin.st ? itemPrice(skin, wears[0].id, true) : 0);
    const siblings = SKIN_LIST.filter((s) => s.weapon === skin.weapon && s.id !== id)
      .sort((a, b) => b.price - a.price).slice(0, 12);

    view.innerHTML = `
      <a href="#/skins" class="back">← Все скины</a>
      <section class="skin-hero" style="--rc:${r.color}">
        <button class="skin-hero-img" id="inspect" title="Осмотреть детально">${skinIcon(skin, '', '')}<span class="zoom-hint">Осмотреть</span></button>
        <div class="skin-hero-info">
          <div class="muted">${esc(skin.weapon)}</div>
          <h1>${esc(skin.name)}</h1>
          <div class="pills">
            <span class="rarity-pill">${r.name}</span>
            ${skin.st ? '<span class="pill st-pill">StatTrak™ доступен</span>' : ''}
            <span class="pill">Износы: ${skin.wears.join(' · ')}</span>
          </div>
          <div class="skin-price">${minP === maxP ? money(minP) : `${money(minP)} — ${money(maxP)}`}</div>
          <div class="skin-best">${best
            ? `Лучший шанс: <b>${fmtChance(best.chance)}</b> в кейсе <a href="#/case/${best.case.id}">«${esc(best.case.name)}»</a> — в среднем 1 из ${oneIn(best.chance)} открытий`
            : 'Не выпадает из кейсов — получите его через апгрейд или контракт.'}</div>
          <div class="hero-cta">
            <button class="btn primary" id="to-upgrade">Апгрейдить до него</button>
            <button class="btn ghost" id="inspect-btn">Осмотреть</button>
            ${best ? `<a class="btn ghost" href="#/case/${best.case.id}">Открыть «${esc(best.case.name)}» за ${money(best.case.price)}</a>` : ''}
          </div>
        </div>
      </section>

      <h2 class="section-title">Шансы выпадения из кейсов</h2>
      ${drops.length ? `<div class="table-wrap panel"><table class="odds">
        <tr><th>Кейс</th><th>Цена кейса</th><th>Шанс скина</th><th>В среднем</th><th>Потратите в среднем</th></tr>
        ${drops.map((d) => `<tr>
          <td><a href="#/case/${d.case.id}">${esc(d.case.name)}</a>${d.case.official ? ' <span class="tag">CS2</span>' : ''}</td>
          <td>${d.case.free ? 'Бесплатно' : money(d.case.price)}</td>
          <td><b>${fmtChance(d.chance)}</b><div class="bar"><i style="width:${Math.max(2, (d.chance / drops[0].chance) * 100)}%"></i></div></td>
          <td>1 из ${oneIn(d.chance)}</td>
          <td>${d.case.free ? '—' : money(d.case.price / d.chance)}</td>
        </tr>`).join('')}
      </table></div>`
      : '<p class="panel muted">Этого скина нет ни в одном кейсе сайта. Его можно получить через апгрейд (ниже) или случайно в контракте.</p>'}

      <h2 class="section-title">Износ, цены и шансы</h2>
      <div class="table-wrap panel"><table class="odds">
        <tr><th>Износ</th><th>Шанс износа</th><th>Цена</th>${skin.st ? '<th>Цена StatTrak™</th>' : ''}${best ? `<th>Шанс из «${esc(best.case.name)}»</th>` : ''}</tr>
        ${wears.map((w) => `<tr>
          <td>${w.name} <span class="muted">(${w.id})</span></td>
          <td>${fmtChance(w.chance)}</td>
          <td>${money(itemPrice(skin, w.id, false))}</td>
          ${skin.st ? `<td>${money(itemPrice(skin, w.id, true))}</td>` : ''}
          ${best ? `<td>${fmtChance(best.chance * w.chance)}${skin.st ? `<span class="muted"> · ST ${fmtChance(best.chance * w.chance * STATTRAK_CHANCE)}</span>` : ''}</td>` : ''}
        </tr>`).join('')}
      </table></div>

      <h2 class="section-title">Шанс апгрейда</h2>
      <div class="panel upgrade-odds" id="up-odds"></div>

      ${siblings.length ? `<h2 class="section-title">Другие скины ${esc(skin.weapon)}</h2>
        <div class="item-grid">${siblings.map((s) => skinCard(s, { chance: bestDrop(s)?.chance, view: true })).join('')}</div>` : ''}`;

    function renderUpgradeOdds() {
      const inv = store.state.inventory;
      const stake = inv.reduce((t, it) => t + it.price, 0);
      const ft = wears.find((w) => w.id === 'FT') || wears[0];
      const target = itemPrice(skin, ft.id, false);
      const el = view.querySelector('#up-odds');
      if (!el) return;
      const rows = [1, 5, 10, 25, 50].map((pct) => {
        const s = (target * pct) / 100 / 0.95;
        return `<tr><td>${money(s)}</td><td>${fmtChance(App.upgradeChance(s, target))}</td></tr>`;
      }).join('');
      el.innerHTML = `
        <p>Цель: <b>${esc(skin.weapon)} | ${esc(skin.name)} (${ft.id})</b> за ${money(target)}.
          ${stake > 0 && stake < target
            ? `Если поставить весь ваш инвентарь (${money(stake)}), шанс — <b>${fmtChance(App.upgradeChance(stake, target))}</b>.`
            : stake >= target ? 'Ваш инвентарь дороже этого скина — выберите в апгрейде часть предметов.' : 'Ваш инвентарь пока пуст.'}</p>
        <div class="table-wrap"><table class="odds compact"><tr><th>Ставка</th><th>Шанс</th></tr>${rows}</table></div>`;
    }

    view.querySelector('#to-upgrade').addEventListener('click', () => App.upgradeTo(skin.id));
    view.querySelector('#inspect').addEventListener('click', () => App.openInspect(skin));
    view.querySelector('#inspect-btn').addEventListener('click', () => App.openInspect(skin));
    renderUpgradeOdds();
    return store.subscribe(renderUpgradeOdds);
  }

  App.pages = App.pages || {};
  App.pages.skins = catalog;
  App.pages.skin = skinPage;
})(window.App);
