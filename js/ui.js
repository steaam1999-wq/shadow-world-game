// Общие UI-хелперы: иконки скинов, карточки предметов, тосты, модалки.
window.App = window.App || {};
(function (App) {
  const { RARITY, SKINS } = App.data;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function fmt(n) {
    return Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const money = (n) => `<span class="money">${fmt(n)}<i class="coin"></i></span>`;

  // Нарисованное изображение скина (js/art.js): силуэт модели + узор отделки.
  const skinSvg = (skin, cls = '') => App.art.render(skin, cls);

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

  // size — суффикс размера Steam ('360fx360f'); пустая строка — исходное изображение (для осмотра).
  function skinIcon(skin, cls = '', size = '360fx360f') {
    const img = skin.img && !imagesBlocked()
      ? `<img class="skin-img" src="${skin.img}${size ? '/' + size : ''}" alt="" loading="lazy" decoding="async" draggable="false">`
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

  const ZOOM_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14.5 14.5L20 20M10 7v6M7 10h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
  // Кнопки в углу карточки: лупа — детальный осмотр, «i» — страница скина.
  const infoLink = (skin, wear = '', st = false) =>
    `<button class="item-tool item-zoom" data-inspect="${skin.id}" data-wear="${wear}" data-st="${st ? 1 : 0}" title="Осмотреть" aria-label="Осмотреть скин">${ZOOM_ICON}</button>` +
    `<a class="item-tool item-info" href="#/skin/${skin.id}" title="Страница скина" aria-label="Страница скина">i</a>`;

  // view: вся карточка ведёт на страницу скина; иначе — только кнопка «i» в углу.
  function itemCard(item, { selected = false, actions = '', extra = '', view = false } = {}) {
    const skin = skinOf(item);
    const r = rarityOf(skin);
    return `<div class="item ${selected ? 'selected' : ''} ${view ? 'viewable' : ''}" data-uid="${item.uid}" data-skin="${skin.id}" style="--rc:${r.color}">
      <div class="item-top"><span class="wear">${item.wear}</span>${item.st ? '<span class="st">ST™</span>' : ''}${infoLink(skin, item.wear, item.st)}</div>
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
      <div class="item-top">${wear ? `<span class="wear">${wear}</span>` : ''}${chance != null ? `<span class="chance" title="Шанс выпадения">${fmtChance(chance)}</span>` : ''}${infoLink(skin, wear || '', false)}</div>
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
    const zoom = e.target.closest('[data-inspect]');
    if (zoom) {
      App.openInspect(SKINS[zoom.dataset.inspect], { wear: zoom.dataset.wear, st: zoom.dataset.st === '1' });
      return;
    }
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

  function modal(html, { onClose, wide = false, cls = '' } = {}) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true">
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
