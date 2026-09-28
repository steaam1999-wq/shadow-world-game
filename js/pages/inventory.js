// Инвентарь и страница Provably Fair.
window.App = window.App || {};
(function (App) {
  const { money, itemCard, toast, esc, modal } = App.ui;
  const store = App.store;

  function inventory(view) {
    let sort = 'new';

    view.innerHTML = `
      <h1 class="page-title">Инвентарь</h1>
      <div class="inv-stats" id="stats"></div>
      <div class="inv-toolbar">
        <select id="sort">
          <option value="new">Сначала новые</option>
          <option value="desc">Сначала дорогие</option>
          <option value="asc">Сначала дешёвые</option>
        </select>
        <button class="btn ghost" id="sell-cheap">Продать всё дешевле 1</button>
        <button class="btn danger" id="sell-all">Продать всё</button>
      </div>
      <div class="item-grid" id="grid"></div>`;
    const $ = (s) => view.querySelector(s);

    function render() {
      const st = store.state;
      const total = st.inventory.reduce((s, it) => s + it.price, 0);
      const best = st.stats.best;
      $('#stats').innerHTML = `
        <div><span>Предметов</span><b>${st.inventory.length}</b></div>
        <div><span>Стоимость</span><b>${money(total)}</b></div>
        <div><span>Кейсов открыто</span><b>${st.stats.opened}</b></div>
        <div><span>Апгрейды</span><b>${st.stats.upgradesWon} / ${st.stats.upgrades}</b></div>
        <div><span>Контракты</span><b>${st.stats.contracts}</b></div>
        <div><span>Лучший дроп</span><b>${best ? `${esc(App.data.SKINS[best.skinId].weapon)} | ${esc(App.data.SKINS[best.skinId].name)} · ${money(best.price)}` : '—'}</b></div>`;
      const list = st.inventory.slice();
      if (sort === 'desc') list.sort((a, b) => b.price - a.price);
      if (sort === 'asc') list.sort((a, b) => a.price - b.price);
      const actions = `<button data-a="sell">Продать</button><button data-a="up">Апгрейд</button><button data-a="out">Вывести</button>`;
      $('#grid').innerHTML = list.length
        ? list.map((it) => itemCard(it, { view: true, actions, extra: `<div class="item-src">${esc(it.source || '')}</div>` })).join('')
        : '<p class="empty">Пока пусто. <a href="#/">Откройте первый кейс</a>!</p>';
    }

    $('#sort').addEventListener('change', (e) => { sort = e.target.value; render(); });
    $('#grid').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-a]');
      if (!btn) return;
      const uid = btn.closest('.item').dataset.uid;
      if (btn.dataset.a === 'sell') {
        const sum = store.sell([uid]);
        store.save();
        toast(`Продано за ${money(sum)}`, 'good');
      } else if (btn.dataset.a === 'up') {
        App.upgradeWith(uid);
      } else {
        toast('Это демо: вывод в Steam отключён, предметы виртуальные.', 'info');
      }
    });
    const bulk = (filter, label) => {
      const uids = store.state.inventory.filter(filter).map((it) => it.uid);
      if (!uids.length) return toast('Нечего продавать', 'info');
      const m = modal(`<h2>${label}</h2><p>Будет продано предметов: <b>${uids.length}</b></p>
        <div class="modal-actions"><button class="btn ghost" data-x>Отмена</button><button class="btn primary" data-ok>Продать</button></div>`);
      m.el.querySelector('[data-x]').onclick = m.close;
      m.el.querySelector('[data-ok]').onclick = () => {
        const sum = store.sell(uids);
        store.save();
        toast(`Продано на ${money(sum)}`, 'good');
        m.close();
      };
    };
    $('#sell-all').addEventListener('click', () => bulk(() => true, 'Продать весь инвентарь?'));
    $('#sell-cheap').addEventListener('click', () => bulk((it) => it.price < 1, 'Продать всё дешевле 1 монеты?'));

    render();
    return store.subscribe(render);
  }

  function fair(view) {
    view.innerHTML = `
      <h1 class="page-title">Честная игра (Provably Fair)</h1>
      <div class="fair-grid">
        <div class="panel">
          <h3>Как это работает</h3>
          <ol class="fair-steps">
            <li>До игры вы видите <b>хеш SHA-256</b> серверного сида — изменить сид после этого нельзя незаметно.</li>
            <li>Вы задаёте свой <b>клиентский сид</b>, каждое действие увеличивает <b>nonce</b>.</li>
            <li>Результат: <code>HMAC_SHA256(serverSeed, clientSeed:nonce:cursor)</code> → первые 13 hex-символов / 2<sup>52</sup> = число от 0 до 1.</li>
            <li>После смены сида старый серверный сид раскрывается — можно пересчитать любой результат ниже.</li>
          </ol>
          <p class="muted">cursor = 0 — выбор предмета, 1 — износ, 2 — StatTrak™. В апгрейде победа, если число &lt; шанса.
            В контракте множитель = 0.25 × 16<sup>r²</sup>. Это демо: сиды хранятся в вашем браузере; на боевом сайте
            серверный сид хранится только на сервере.</p>
        </div>
        <div class="panel">
          <h3>Текущие сиды</h3>
          <label class="field">Хеш серверного сида<input readonly id="hash"></label>
          <label class="field">Клиентский сид<input id="client" maxlength="64"></label>
          <div class="field">Nonce: <b id="nonce"></b></div>
          <button class="btn primary" id="rotate">Сменить сиды и раскрыть текущий</button>
        </div>
        <div class="panel">
          <h3>Проверка результата</h3>
          <label class="field">Server seed<input id="v-ss"></label>
          <label class="field">Client seed<input id="v-cs"></label>
          <div class="row">
            <label class="field">Nonce<input id="v-n" type="number" min="0" value="0"></label>
            <label class="field">Cursor<input id="v-c" type="number" min="0" value="0"></label>
          </div>
          <div class="verify-out" id="v-out">—</div>
        </div>
        <div class="panel wide">
          <h3>Раскрытые сиды</h3>
          <div class="table-wrap"><table id="hist"></table></div>
        </div>
      </div>`;
    const $ = (s) => view.querySelector(s);

    function render() {
      const f = store.state.fair;
      $('#hash').value = App.fair.serverHash();
      $('#client').value = f.clientSeed;
      $('#nonce').textContent = f.nonce;
      $('#hist').innerHTML = `<tr><th>Server seed</th><th>Хеш</th><th>Client seed</th><th>Игр</th><th></th></tr>` +
        (f.history.length ? f.history.map((h, i) => `<tr>
          <td class="mono">${h.serverSeed}</td><td class="mono">${h.hash}</td><td class="mono">${esc(h.clientSeed)}</td><td>${h.nonces}</td>
          <td><button class="btn ghost small" data-i="${i}">Проверить</button></td></tr>`).join('')
          : '<tr><td colspan="5" class="muted">Пока нет — нажмите «Сменить сиды».</td></tr>');
    }

    function verify() {
      const ss = $('#v-ss').value.trim(), cs = $('#v-cs').value.trim();
      if (!ss) { $('#v-out').textContent = '—'; return; }
      const r = App.fair.rollFrom(ss, cs, +$('#v-n').value || 0, +$('#v-c').value || 0);
      $('#v-out').innerHTML = `Хеш сида: <span class="mono">${App.crypto.sha256Hex(ss)}</span><br>
        Число: <b>${r.toFixed(10)}</b> · в процентах: <b>${(r * 100).toFixed(4)}%</b> · множитель контракта: <b>x${App.contractMultiplier(r).toFixed(3)}</b>`;
    }

    $('#rotate').addEventListener('click', () => {
      const cs = $('#client').value.trim();
      App.fair.rotate(cs && cs !== store.state.fair.clientSeed ? cs : undefined);
      toast('Сиды обновлены, предыдущий серверный сид раскрыт', 'good');
      render();
    });
    $('#client').addEventListener('change', (e) => {
      const cs = e.target.value.trim();
      if (!cs) return render();
      // Смена клиентского сида тоже раскрывает текущий серверный.
      App.fair.rotate(cs);
      toast('Клиентский сид сохранён', 'good');
      render();
    });
    view.querySelectorAll('#v-ss,#v-cs,#v-n,#v-c').forEach((el) => el.addEventListener('input', verify));
    $('#hist').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      const h = store.state.fair.history[+b.dataset.i];
      $('#v-ss').value = h.serverSeed;
      $('#v-cs').value = h.clientSeed;
      $('#v-n').value = 0;
      verify();
    });

    render();
  }

  App.pages = App.pages || {};
  App.pages.inventory = inventory;
  App.pages.fair = fair;
})(window.App);
