// Обмен скинов: ваш инвентарь ↔ магазин сайта, разница — через баланс.
// Идеи с торговых площадок: две панели (CS.MONEY), панель сделки «отдаёте / получаете» (swap.gg),
// доплата и остаток балансом, подбор под сумму (tradeit.gg), крупные карточки со шкалой float (skinswap).
window.App = window.App || {};
(function (App) {
  const { CATALOG, SKINS, RARITY, itemPrice, floatFor, round2 } = App.data;
  const { money, itemCard, esc, toast, skinIcon, showDrops } = App.ui;
  const store = App.store;

  const ACCEPT = 0.95; // ваши предметы принимаются по 95% цены
  const SHOP_SIZE = 280;
  const PAGE = 60;
  const TYPES = [['all', 'Все'], ['knife', 'Ножи'], ['gloves', 'Перчатки'], ['rifle', 'Винтовки'], ['sniper', 'Снайп.'], ['pistol', 'Пистолеты'], ['smg', 'ПП']];
  const SORTS = [['desc', 'Сначала дорогие'], ['asc', 'Сначала дешёвые'], ['float-asc', 'Float ↑'], ['float-desc', 'Float ↓']];

  // Ассортимент магазина: обновляется раз в сутки, больше дешёвых скинов и немного дорогих.
  let shop = null;
  function buildShop() {
    const day = Math.floor(Date.now() / 86400000);
    let a = day * 2654435761 >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const items = [];
    for (let i = 0; i < SHOP_SIZE; i++) {
      const e = CATALOG[Math.floor(Math.pow(rnd(), 0.75) * CATALOG.length)];
      const st = e.skin.st && rnd() < 0.12;
      items.push({ uid: `shop${i}`, skinId: e.skin.id, wear: e.wear, st, float: floatFor(e.wear, rnd()), price: itemPrice(e.skin, e.wear, st) });
    }
    return items;
  }

  const sum = (list) => round2(list.reduce((t, it) => t + it.price, 0));

  function page(view) {
    if (!shop) shop = buildShop();
    const give = new Set(), get = new Set();
    const filters = {
      give: { q: '', sort: 'desc', min: '', max: '', type: 'all', rarity: 'all', shown: PAGE },
      get: { q: '', sort: 'desc', min: '', max: '', type: 'all', rarity: 'all', shown: PAGE },
    };

    const toolbar = (side) => `
      <div class="tc-tools">
        <input class="search" data-f="q" placeholder="Поиск…" autocomplete="off" aria-label="Поиск">
        <select data-f="sort" aria-label="Сортировка">${SORTS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select>
        <div class="price-range"><input data-f="min" inputmode="decimal" placeholder="от" aria-label="Цена от"><span>—</span><input data-f="max" inputmode="decimal" placeholder="до" aria-label="Цена до"></div>
        <select data-f="rarity" aria-label="Редкость"><option value="all">Любая редкость</option>
          ${Object.entries(RARITY).map(([id, r]) => `<option value="${id}">${r.name}</option>`).join('')}</select>
      </div>
      <div class="chips" data-chips="${side}">${TYPES.map(([v, n]) => `<button data-t="${v}" class="${v === 'all' ? 'on' : ''}">${n}</button>`).join('')}</div>`;

    view.innerHTML = `
      <div class="swap-head">
        <h1 class="page-title">Обмен скинов</h1>
        <p class="muted">Выберите свои предметы слева и нужные справа. Разница зачисляется на баланс или списывается с него.
          Ваши предметы принимаются по ${Math.round(ACCEPT * 100)}% цены.</p>
      </div>
      <div class="trade-bar" id="trade-bar">
        <div class="tb-side">
          <div class="tb-label">Вы отдаёте</div>
          <div class="tb-sum" id="t-give"></div>
          <div class="tb-thumbs" id="t-give-thumbs"></div>
        </div>
        <div class="tb-center">
          <div class="tb-diff" id="t-diff"></div>
          <button class="btn cta big" id="t-go">Обменять</button>
          <button class="link-btn" id="t-clear">Очистить выбор</button>
        </div>
        <div class="tb-side right">
          <div class="tb-label">Вы получаете</div>
          <div class="tb-sum" id="t-get"></div>
          <div class="tb-thumbs" id="t-get-thumbs"></div>
        </div>
      </div>
      <div class="trade-cols">
        <section class="trade-col" data-side="give">
          <div class="tc-head"><h2>Ваш инвентарь</h2><span class="muted" id="c-give-info"></span></div>
          ${toolbar('give')}
          <div class="item-grid trade-grid" id="g-give"></div>
          <div class="catalog-more"><button class="btn ghost" data-more="give">Показать ещё</button></div>
        </section>
        <section class="trade-col" data-side="get">
          <div class="tc-head"><h2>Магазин</h2><span class="muted" id="c-get-info"></span>
            <button class="btn ghost small" id="autofill" title="Добавить предметы магазина на сумму ваших">Подобрать под сумму</button></div>
          ${toolbar('get')}
          <div class="item-grid trade-grid" id="g-get"></div>
          <div class="catalog-more"><button class="btn ghost" data-more="get">Показать ещё</button></div>
        </section>
      </div>`;

    const $ = (s) => view.querySelector(s);
    const source = (side) => (side === 'give' ? store.state.inventory : shop);
    const selected = (side) => (side === 'give' ? give : get);
    const pickedItems = (side) => source(side).filter((it) => selected(side).has(it.uid));

    function filtered(side) {
      const f = filters[side];
      const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
      const min = parseFloat(String(f.min).replace(',', '.')), max = parseFloat(String(f.max).replace(',', '.'));
      const list = source(side).filter((it) => {
        const s = SKINS[it.skinId];
        return (f.type === 'all' || s.type === f.type) && (f.rarity === 'all' || s.rarity === f.rarity) &&
          (isNaN(min) || it.price >= min) && (isNaN(max) || it.price <= max) &&
          words.every((w) => `${s.weapon} ${s.name}`.toLowerCase().includes(w));
      });
      const by = { desc: (a, b) => b.price - a.price, asc: (a, b) => a.price - b.price, 'float-asc': (a, b) => a.float - b.float, 'float-desc': (a, b) => b.float - a.float }[f.sort];
      return list.sort(by);
    }

    function renderGrid(side) {
      const list = filtered(side);
      const sel = selected(side);
      $(`#g-${side}`).innerHTML = list.length
        ? list.slice(0, filters[side].shown).map((it) => itemCard(it, { selected: sel.has(it.uid) })).join('')
        : `<p class="empty">${side === 'give' && !store.state.inventory.length ? 'Инвентарь пуст — <a href="#/">откройте кейс</a> или просто купите скины справа за баланс.' : 'Ничего не нашлось.'}</p>`;
      view.querySelector(`[data-more="${side}"]`).hidden = list.length <= filters[side].shown;
      $(`#c-${side}-info`).innerHTML = `${source(side).length} шт. · ${money(sum(source(side)))}`;
    }

    function renderBar() {
      const g = pickedItems('give'), r = pickedItems('get');
      const giveVal = round2(sum(g) * ACCEPT), getVal = sum(r);
      const diff = round2(giveVal - getVal);
      const bal = store.state.balance;
      $('#t-give').innerHTML = `${money(giveVal)}${g.length ? `<span class="muted"> · ${g.length} шт.</span>` : ''}`;
      $('#t-get').innerHTML = `${money(getVal)}${r.length ? `<span class="muted"> · ${r.length} шт.</span>` : ''}`;
      const thumbs = (list, side) => list.slice(0, 8).map((it) => `<button class="tb-thumb" data-rm="${side}:${it.uid}" style="--rc:${RARITY[SKINS[it.skinId].rarity].color}" title="Убрать">${skinIcon(SKINS[it.skinId])}</button>`).join('') +
        (list.length > 8 ? `<span class="tb-more">+${list.length - 8}</span>` : '');
      $('#t-give-thumbs').innerHTML = thumbs(g, 'give');
      $('#t-get-thumbs').innerHTML = thumbs(r, 'get');
      let text, ok = g.length + r.length > 0;
      if (!ok) text = '<span class="muted">Выберите предметы</span>';
      else if (diff >= 0) text = `На баланс: <b class="good">+${money(diff)}</b>`;
      else if (bal + 1e-9 >= -diff) text = `Доплата с баланса: <b>${money(-diff)}</b>`;
      else { text = `Не хватает <b class="bad">${money(-diff - bal)}</b>`; ok = false; }
      $('#t-diff').innerHTML = text;
      $('#t-go').disabled = !ok;
      $('#t-go').textContent = !r.length && g.length ? 'Продать' : !g.length && r.length ? 'Купить' : 'Обменять';
    }

    const renderAll = () => { renderGrid('give'); renderGrid('get'); renderBar(); };

    // Выбор карточек
    for (const side of ['give', 'get']) {
      $(`#g-${side}`).addEventListener('click', (e) => {
        if (e.target.closest('.item-tool')) return;
        const card = e.target.closest('.item');
        if (!card) return;
        const sel = selected(side), uid = card.dataset.uid;
        if (sel.has(uid)) sel.delete(uid); else sel.add(uid);
        card.classList.toggle('selected', sel.has(uid));
        renderBar();
      });
      const col = view.querySelector(`[data-side="${side}"]`);
      col.querySelectorAll('[data-f]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        filters[side][el.dataset.f] = el.value.trim();
        filters[side].shown = PAGE;
        renderGrid(side);
      }));
      col.querySelector('[data-chips]').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        filters[side].type = b.dataset.t;
        filters[side].shown = PAGE;
        col.querySelectorAll('[data-chips] button').forEach((x) => x.classList.toggle('on', x === b));
        renderGrid(side);
      });
      view.querySelector(`[data-more="${side}"]`).addEventListener('click', () => { filters[side].shown += PAGE; renderGrid(side); });
    }

    $('#trade-bar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      const [side, uid] = b.dataset.rm.split(':');
      selected(side).delete(uid);
      renderAll();
    });
    $('#t-clear').addEventListener('click', () => { give.clear(); get.clear(); renderAll(); });

    // Подбор под сумму: самые дорогие подходящие предметы магазина, пока хватает ваших.
    $('#autofill').addEventListener('click', () => {
      let budget = round2(sum(pickedItems('give')) * ACCEPT - sum(pickedItems('get')));
      if (budget <= 0) return toast('Сначала выберите свои предметы слева — подберём скины на их сумму.', 'info');
      let added = 0;
      for (const it of filtered('get')) {
        if (get.has(it.uid) || it.price > budget) continue;
        get.add(it.uid);
        budget = round2(budget - it.price);
        added++;
        if (budget < 0.05) break;
      }
      if (!added) toast('В магазине нет предметов на эту сумму с текущими фильтрами.', 'info');
      renderAll();
    });

    $('#t-go').addEventListener('click', () => {
      const g = pickedItems('give'), r = pickedItems('get');
      const diff = round2(sum(g) * ACCEPT - sum(r));
      if (!g.length && !r.length) return;
      if (diff < 0 && store.state.balance + 1e-9 < -diff) return toast('Не хватает баланса для доплаты.', 'bad');

      store.removeItems(g.map((it) => it.uid));
      const received = r.map((it) => store.makeItem(SKINS[it.skinId], it.wear, it.st, 'Обмен', it.float));
      store.addItems(received);
      store.credit(diff);
      store.state.stats.trades = (store.state.stats.trades || 0) + 1;
      store.log('trade', `Отдано: ${g.length} шт., получено: ${r.length} шт.`, diff);
      store.save();

      // Магазин забирает ваши предметы и отдаёт свои.
      shop = shop.filter((it) => !get.has(it.uid)).concat(g.map((it, i) => ({ ...it, uid: `shopu${Date.now()}${i}` })));
      give.clear();
      get.clear();
      renderAll();
      if (received.length) {
        App.fx.celebrate(received);
        showDrops(received, 'Обмен выполнен');
      } else {
        App.fx.sound.coin();
        toast(`Продано: +${money(diff)} на баланс`, 'good');
      }
    });

    renderAll();
    return store.subscribe(() => { renderGrid('give'); renderBar(); });
  }

  App.pages = App.pages || {};
  App.pages.swap = page;
})(window.App);
