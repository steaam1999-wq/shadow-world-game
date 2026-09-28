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
  // У Steam несколько адресов с одними и теми же картинками. Если один недоступен в сети
  // пользователя, пробуем следующий и запоминаем тот, что сработал.
  const IMG_HOSTS = [
    'https://community.akamai.steamstatic.com',
    'https://community.cloudflare.steamstatic.com',
    'https://community.fastly.steamstatic.com',
    'https://steamcommunity-a.akamaihd.net',
  ];
  let hostIdx = 0;
  try { hostIdx = Math.min(IMG_HOSTS.length - 1, +localStorage.getItem('shadowdrop:imghost') || 0); } catch (e) { /* нет хранилища */ }
  const imgUrl = (hash, size, h = hostIdx) => `${IMG_HOSTS[h]}/economy/image/${hash}${size ? '/' + size : ''}`;

  let imgOk = 0, imgFail = 0;
  const imagesBlocked = () => imgOk === 0 && imgFail >= 3;
  const isReal = (img) => img.naturalWidth > 16 && img.naturalHeight > 16;

  function setImgStatus() {
    const el = document.getElementById('img-status');
    if (!el) return;
    el.textContent = imgOk ? 'Картинки Steam: загружаются' : imagesBlocked()
      ? 'Картинки Steam недоступны в этом окне или сети — показаны нарисованные изображения' : '';
    el.className = imgOk ? 'ok' : imagesBlocked() ? 'warn' : '';
  }

  // Следующий адрес Steam для картинки; false — адреса закончились.
  function tryNextHost(img) {
    const next = ((+img.dataset.h || 0) + 1) % IMG_HOSTS.length; // по кругу, начиная с запомненного
    if (!img.dataset.hash || next === +img.dataset.h0) return false;
    img.dataset.h = next;
    img.src = imgUrl(img.dataset.hash, img.dataset.size, next);
    return true;
  }

  document.addEventListener('load', (e) => {
    const el = e.target;
    if (!el.classList) return;
    if (el.classList.contains('skin-img')) {
      if (isReal(el)) {
        imgOk++;
        el.parentNode.classList.add('loaded');
        const h = +el.dataset.h || 0;
        if (h !== hostIdx) { hostIdx = h; try { localStorage.setItem('shadowdrop:imghost', h); } catch (err) { /* нет хранилища */ } }
        if (imgOk === 1) setImgStatus();
      } else if (!tryNextHost(el)) { imgFail++; el.remove(); setImgStatus(); }
    } else if (el.classList.contains('case-photo') && isReal(el)) {
      el.parentNode.classList.add('has-photo');
    }
  }, true);
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el.classList) return;
    if (el.classList.contains('skin-img')) {
      if (!tryNextHost(el)) { imgFail++; el.remove(); setImgStatus(); }
    } else if (el.classList.contains('case-photo')) el.remove();
  }, true);

  // size — суффикс размера Steam ('360fx360f'); пустая строка — исходное изображение (для осмотра).
  function skinIcon(skin, cls = '', size = '360fx360f') {
    const img = skin.img && !imagesBlocked()
      ? `<img class="skin-img" src="${imgUrl(skin.img, size)}" data-hash="${skin.img}" data-size="${size}" data-h="${hostIdx}" data-h0="${hostIdx}"
          alt="" loading="lazy" decoding="async" draggable="false">`
      : '';
    return `<span class="skin-pic ${cls}" role="img" aria-label="${esc(skin.weapon)} | ${esc(skin.name)}">${skinSvg(skin)}${img}</span>`;
  }

  function caseArt(c) {
    const col = c.color;
    const photo = c.img && !imagesBlocked()
      ? `<img class="case-photo" src="${imgUrl(c.img, '256fx256f')}" alt="" loading="lazy">`
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
    return `<div class="item r-${skin.rarity} ${selected ? 'selected' : ''} ${view ? 'viewable' : ''}" data-uid="${item.uid}" data-skin="${skin.id}" style="--rc:${r.color}">
      <div class="item-top"><span class="wear">${item.wear}</span>${item.st ? '<span class="st">ST™</span>' : ''}${infoLink(skin, item.wear, item.st)}</div>
      <div class="item-img">${skinIcon(skin)}</div>
      <div class="item-weapon">${esc(skin.weapon)}</div>
      <div class="item-name">${esc(skin.name)}</div>
      <div class="item-price">${money(item.price)}</div>
      ${item.float != null ? floatBar(item.float) : ''}
      ${extra}${actions ? `<div class="item-actions">${actions}</div>` : ''}
    </div>`;
  }

  // Шкала float, как на торговых площадках: зоны FN…BS и маркер точного значения.
  function floatBar(f) {
    return `<div class="float" title="Float ${f.toFixed(6)}"><div class="float-bar"><i style="left:${(f * 100).toFixed(2)}%"></i></div>
      <span class="float-val">${f.toFixed(4)}</span></div>`;
  }

  function skinCard(skin, { chance, price, wear, key, selected, view = false } = {}) {
    const r = rarityOf(skin);
    return `<div class="item r-${skin.rarity} ${selected ? 'selected' : ''} ${view ? 'viewable' : ''}" ${key ? `data-key="${key}"` : ''} data-skin="${skin.id}" style="--rc:${r.color}">
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

  App.ui = { floatBar, esc, fmt, money, skinIcon, caseArt, itemCard, skinCard, fmtChance, toast, modal, showDrops, skinOf, rarityOf, sleep };
})(window.App);
