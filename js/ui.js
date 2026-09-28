// Общие UI-хелперы: иконки скинов, карточки предметов, тосты, модалки.
window.App = window.App || {};
(function (App) {
  const { RARITY, SKINS } = App.data;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function fmt(n) {
    return Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const money = (n) => `<span class="money">${fmt(n)}<i class="coin"></i></span>`;

  // Силуэты оружия (viewBox 0 0 200 80), закрашиваются градиентом скина.
  const SHAPES = {
    rifle: 'M8 36 L26 33 L30 28 L58 28 L62 31 L124 31 L128 27 L150 27 L152 31 L192 31 L192 37 L152 38 L146 43 L126 43 L118 46 L112 64 L98 64 L102 47 L86 47 L80 58 L70 58 L74 47 L54 45 L40 50 L10 56 Z',
    sniper: 'M4 38 L22 34 L30 30 L64 30 L66 24 L112 24 L114 30 L196 32 L196 37 L118 38 L112 44 L96 44 L92 60 L80 60 L84 45 L58 45 L44 52 L8 58 Z',
    smg: 'M20 34 L40 30 L150 30 L154 26 L170 26 L170 36 L150 38 L140 42 L112 42 L108 68 L94 68 L98 42 L78 42 L72 60 L58 60 L62 42 L44 44 L22 50 Z',
    pistol: 'M44 26 L160 26 L164 22 L172 22 L172 38 L112 40 L106 44 L96 44 L88 70 L64 70 L74 42 L62 40 L44 38 Z',
    knife: 'M10 44 C40 30 90 22 150 24 L190 18 C176 30 160 40 130 44 L96 46 L92 52 L58 54 C40 56 22 54 10 44 Z',
    gloves: 'M60 70 L56 40 L62 18 L72 16 L76 36 L80 12 L90 10 L94 34 L100 10 L110 10 L112 34 L118 14 L128 16 L126 40 L136 30 L146 34 L128 60 L124 70 Z',
  };

  let gradId = 0;
  function skinSvg(skin, cls = '') {
    const id = `g${gradId++}`;
    return `<svg class="skin-svg ${cls}" viewBox="0 0 200 80" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${skin.c1}"/><stop offset="1" stop-color="${RARITY[skin.rarity].color}"/></linearGradient></defs>
      <path d="${SHAPES[skin.type]}" fill="url(#${id})" stroke="rgba(0,0,0,.55)" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
  }

  // Картинки скинов грузятся со Steam CDN. Под картинкой всегда лежит SVG-силуэт:
  // картинка становится видимой только после настоящей загрузки. Так иконка не пропадает,
  // даже если CDN заблокирован без ошибки (как в песочницах) или отдаёт пустую заглушку.
  let imgOk = 0, imgFail = 0;
  const imagesBlocked = () => imgOk === 0 && imgFail >= 3;
  const isReal = (img) => img.naturalWidth > 16 && img.naturalHeight > 16;
  document.addEventListener('load', (e) => {
    const el = e.target;
    if (!el.classList) return;
    if (el.classList.contains('skin-img')) {
      if (isReal(el)) { imgOk++; el.parentNode.classList.add('loaded'); } else { imgFail++; el.remove(); }
    } else if (el.classList.contains('case-photo') && isReal(el)) {
      el.parentNode.classList.add('has-photo');
    }
  }, true);
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el.classList) return;
    if (el.classList.contains('skin-img')) { imgFail++; el.remove(); }
    else if (el.classList.contains('case-photo')) el.remove();
  }, true);

  function skinIcon(skin, cls = '') {
    const img = skin.img && !imagesBlocked()
      ? `<img class="skin-img" src="${skin.img}/360fx360f" alt="" loading="lazy" decoding="async" draggable="false">`
      : '';
    return `<span class="skin-pic ${cls}" role="img" aria-label="${esc(skin.weapon)} | ${esc(skin.name)}">${skinSvg(skin)}${img}</span>`;
  }

  function caseArt(c) {
    const col = c.color;
    const photo = c.img && !imagesBlocked()
      ? `<img class="case-photo" src="${c.img}/256fx256f" alt="" loading="lazy">`
      : '';
    return `<div class="case-art" style="--cc:${col}">
      <svg class="case-box" viewBox="0 0 160 110" aria-hidden="true">
        <path d="M14 34 L80 12 L146 34 L146 88 L80 104 L14 88 Z" fill="${col}" opacity=".22"/>
        <path d="M14 34 L80 52 L146 34 M80 52 L80 104" stroke="${col}" stroke-width="3" fill="none" opacity=".8"/>
        <path d="M14 34 L80 12 L146 34 L146 88 L80 104 L14 88 Z" stroke="${col}" stroke-width="3" fill="none"/>
      </svg>
      <div class="case-skin">${skinIcon(c.topSkin)}</div>${photo}
    </div>`;
  }

  const rarityOf = (skin) => RARITY[skin.rarity];
  const skinOf = (item) => SKINS[item.skinId];

  const infoLink = (skin) => `<a class="item-info" href="#/skin/${skin.id}" title="Страница скина" aria-label="Страница скина">i</a>`;

  // view: вся карточка ведёт на страницу скина; иначе — только кнопка «i» в углу.
  function itemCard(item, { selected = false, actions = '', extra = '', view = false } = {}) {
    const skin = skinOf(item);
    const r = rarityOf(skin);
    return `<div class="item ${selected ? 'selected' : ''} ${view ? 'viewable' : ''}" data-uid="${item.uid}" data-skin="${skin.id}" style="--rc:${r.color}">
      <div class="item-top"><span class="wear">${item.wear}</span>${item.st ? '<span class="st">ST™</span>' : ''}${infoLink(skin)}</div>
      <div class="item-img">${skinIcon(skin)}</div>
      <div class="item-weapon">${esc(skin.weapon)}</div>
      <div class="item-name">${esc(skin.name)}</div>
      <div class="item-price">${money(item.price)}</div>
      ${extra}${actions ? `<div class="item-actions">${actions}</div>` : ''}
    </div>`;
  }

  function skinCard(skin, { chance, price, wear, key, selected, view = false } = {}) {
    const r = rarityOf(skin);
    return `<div class="item ${selected ? 'selected' : ''} ${view ? 'viewable' : ''}" ${key ? `data-key="${key}"` : ''} data-skin="${skin.id}" style="--rc:${r.color}">
      <div class="item-top">${wear ? `<span class="wear">${wear}</span>` : ''}${chance != null ? `<span class="chance" title="Шанс выпадения">${fmtChance(chance)}</span>` : ''}${view ? '' : infoLink(skin)}</div>
      <div class="item-img">${skinIcon(skin)}</div>
      <div class="item-weapon">${esc(skin.weapon)}</div>
      <div class="item-name">${esc(skin.name)}</div>
      <div class="item-price">${money(price ?? skin.price)}</div>
    </div>`;
  }

  function fmtChance(p) {
    const pct = p * 100;
    if (pct >= 10) return pct.toFixed(1) + '%';
    if (pct >= 0.1) return pct.toFixed(2) + '%';
    return pct.toFixed(3) + '%';
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.item.viewable');
    if (!card || e.target.closest('button, a')) return;
    location.hash = `#/skin/${card.dataset.skin}`;
  });

  function toast(msg, type = 'info') {
    let wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(() => el.classList.add('hide'), 2800);
    setTimeout(() => el.remove(), 3300);
  }

  function modal(html, { onClose, wide = false } = {}) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <button class="modal-x" aria-label="Закрыть">×</button>${html}</div>`;
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add('show'));
    const close = () => {
      if (!back.isConnected) return;
      back.classList.remove('show');
      setTimeout(() => back.remove(), 200);
      document.removeEventListener('keydown', onKey);
      onClose && onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.classList.contains('modal-x')) close(); });
    return { el: back.querySelector('.modal'), close };
  }

  // Модалка «выпало»: продать сразу или оставить в инвентаре.
  function showDrops(items, title = 'Ваш дроп') {
    const total = items.reduce((s, it) => s + it.price, 0);
    const m = modal(`<h2>${title}</h2>
      <div class="drop-grid">${items.map((it) => itemCard(it, { view: true })).join('')}</div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="keep">Забрать в инвентарь</button>
        <button class="btn primary" data-act="sell">Продать за ${money(total)}</button>
      </div>`, { wide: items.length > 2 });
    m.el.querySelector('[data-act=keep]').onclick = m.close;
    m.el.querySelector('[data-act=sell]').onclick = () => {
      const sum = App.store.sell(items.map((i) => i.uid).filter((u) => App.store.findItem(u)));
      App.store.save();
      toast(`Продано на ${money(sum)}`, 'good');
      m.close();
    };
    return m;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  App.ui = { esc, fmt, money, skinIcon, caseArt, itemCard, skinCard, fmtChance, toast, modal, showDrops, skinOf, rarityOf, sleep };
})(window.App);
