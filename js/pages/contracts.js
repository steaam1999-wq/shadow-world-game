// Контракты: обмениваем 3–10 предметов на один случайный стоимостью x0.25–x4 от суммы.
window.App = window.App || {};
(function (App) {
  const { CATALOG, round2 } = App.data;
  const { money, itemCard, toast, showDrops } = App.ui;
  const store = App.store;

  const MIN = 3, MAX = 10;
  const LOW = 0.25, HIGH = 4;
  // m = 0.25 * 16^(r^2): матожидание ≈ 0.92, шанс окупиться (m ≥ 1) ≈ 29%.
  const multiplier = (r) => LOW * Math.pow(HIGH / LOW, r * r);

  function nearest(value) {
    let lo = 0, hi = CATALOG.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (CATALOG[mid].price < value) lo = mid + 1; else hi = mid;
    }
    const a = CATALOG[Math.max(0, lo - 1)], b = CATALOG[lo];
    return Math.abs(a.price - value) <= Math.abs(b.price - value) ? a : b;
  }

  function page(view) {
    const sel = new Set();
    let busy = false;

    view.innerHTML = `
      <h1 class="page-title">Контракты</h1>
      <div class="contract-bar panel">
        <div class="contract-slots" id="slots"></div>
        <div class="contract-info">
          <div>Сумма: <b id="sum"></b></div>
          <div class="muted">Результат: от <b id="lo"></b> до <b id="hi"></b></div>
          <button class="btn primary big" id="sign">Подписать контракт</button>
        </div>
      </div>
      <p class="muted">Выберите от ${MIN} до ${MAX} предметов. Итоговый предмет подбирается по стоимости: сумма × множитель от x${LOW} до x${HIGH}.</p>
      <div class="item-grid" id="inv"></div>`;

    const $ = (s) => view.querySelector(s);

    function render() {
      for (const uid of sel) if (!store.findItem(uid)) sel.delete(uid);
      const items = store.state.inventory.filter((it) => sel.has(it.uid));
      const sum = round2(items.reduce((s, it) => s + it.price, 0));
      $('#slots').innerHTML = Array.from({ length: MAX }, (_, i) => {
        const it = items[i];
        return it ? `<div class="slot filled" style="--rc:${App.ui.rarityOf(App.ui.skinOf(it)).color}">${App.ui.skinIcon(App.ui.skinOf(it))}</div>` : '<div class="slot"></div>';
      }).join('');
      $('#sum').innerHTML = money(sum);
      $('#lo').innerHTML = money(sum * LOW);
      $('#hi').innerHTML = money(sum * HIGH);
      $('#sign').disabled = busy || sel.size < MIN;
      const inv = store.state.inventory;
      $('#inv').innerHTML = inv.length
        ? inv.map((it) => itemCard(it, { selected: sel.has(it.uid) })).join('')
        : '<p class="empty">Инвентарь пуст — <a href="#/">откройте пару кейсов</a>.</p>';
    }

    $('#inv').addEventListener('click', (e) => {
      const card = e.target.closest('.item');
      if (!card || busy) return;
      const uid = card.dataset.uid;
      if (sel.has(uid)) sel.delete(uid);
      else if (sel.size >= MAX) return toast(`Максимум ${MAX} предметов`, 'bad');
      else sel.add(uid);
      render();
    });

    $('#sign').addEventListener('click', async () => {
      if (busy || sel.size < MIN) return;
      busy = true;
      const items = store.state.inventory.filter((it) => sel.has(it.uid));
      const sum = items.reduce((s, it) => s + it.price, 0);
      const r = App.fair.next()();
      const m = multiplier(r);
      const entry = nearest(sum * m);
      store.removeItems([...sel]);
      store.state.xp = round2(store.state.xp + sum);
      store.state.stats.contracts++;
      const prize = store.makeItem(entry.skin, entry.wear, false, 'Контракт');
      store.addItems([prize]);
      store.log('contract', `${items.length} предм. → ${entry.skin.weapon} | ${entry.skin.name} (${entry.wear})`, prize.price);
      store.save();
      sel.clear();

      $('#slots').classList.add('merging');
      await App.ui.sleep(store.state.settings.fast ? 400 : 1400);
      if (!view.isConnected) return;
      $('#slots').classList.remove('merging');
      busy = false;
      render();
      App.feed.push('Вы', prize, null, 'contract');
      showDrops([prize], `Контракт: x${(prize.price / sum).toFixed(2)}`);
    });

    render();
    return store.subscribe(() => { if (!busy) render(); });
  }

  App.pages = App.pages || {};
  App.pages.contracts = page;
  App.contractMultiplier = multiplier;
})(window.App);
