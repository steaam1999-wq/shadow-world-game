// Каталог всех скинов CS2: поиск, фильтры по типу и редкости, сортировка.
window.App = window.App || {};
(function (App) {
  const { SKIN_LIST, RARITY, CASES, fullName } = App.data;
  const { skinCard, esc, money, modal, skinIcon } = App.ui;

  const PAGE = 96;
  const TYPES = [
    ['all', 'Все'], ['knife', 'Ножи'], ['gloves', 'Перчатки'], ['rifle', 'Винтовки'],
    ['sniper', 'Снайперские'], ['pistol', 'Пистолеты'], ['smg', 'ПП'],
  ];
  const WEAR_NAMES = Object.fromEntries(App.data.WEARS.map((w) => [w.id, w.name]));

  // В каких кейсах сайта встречается скин.
  const casesOf = (skin) => CASES.filter((c) => c.skins.includes(skin.id));

  function page(view) {
    let type = 'all', rarity = 'all', sort = 'desc', q = '', shown = PAGE;

    view.innerHTML = `
      <h1 class="page-title">Скины CS2</h1>
      <p class="muted">Все ${SKIN_LIST.length.toLocaleString('ru-RU')} скинов игры: оружие, ножи и перчатки. Цены ориентировочные, для FT (после полевых испытаний).</p>
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
      else list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
      return list;
    }

    function render() {
      const list = filtered();
      $('#ccount').textContent = `Найдено: ${list.length.toLocaleString('ru-RU')}`;
      $('#cgrid').innerHTML = list.length
        ? list.slice(0, shown).map((s) => skinCard(s, { key: s.id })).join('')
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

    $('#cgrid').addEventListener('click', (e) => {
      const card = e.target.closest('.item');
      if (!card) return;
      const skin = App.data.SKINS[card.dataset.key];
      const r = RARITY[skin.rarity];
      const inCases = casesOf(skin);
      const m = modal(`<div class="skin-detail" style="--rc:${r.color}">
          <div class="skin-detail-img">${skinIcon(skin)}</div>
          <div class="muted">${esc(skin.weapon)}</div>
          <h2>${esc(skin.name)}</h2>
          <div class="rarity-pill">${r.name}${skin.st ? ' · StatTrak™' : ''}</div>
          <table class="wear-table">${skin.wears.map((w) => `<tr><td>${WEAR_NAMES[w]}</td><td>${money(App.data.itemPrice(skin, w, false))}</td></tr>`).join('')}</table>
          ${inCases.length ? `<div class="muted">Выпадает из кейсов:</div>
            <div class="case-links">${inCases.map((c) => `<a href="#/case/${c.id}">${esc(c.name)}</a>`).join('')}</div>`
            : '<div class="muted">Нет в кейсах сайта — можно получить через апгрейд или контракт.</div>'}
          <div class="modal-actions"><button class="btn primary" data-up>Апгрейдить до него</button></div>
        </div>`);
      m.el.querySelector('[data-up]').onclick = () => App.upgradeTo(skin.id);
    });

    render();
  }

  App.pages = App.pages || {};
  App.pages.skins = page;
})(window.App);
