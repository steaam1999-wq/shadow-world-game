// Точка входа: роутер, шапка, живая лента дропов, демо-пополнение, промокоды.
window.App = window.App || {};
(function (App) {
  const { CASES } = App.data;
  const { money, skinIcon, rarityOf, toast, modal, esc } = App.ui;
  const store = App.store;

  // --- Живая лента ---
  const FEED_BOTS = ['Artem_K', 'm0nesy_wannabe', 'Dasha.gg', 'kirill1337', 'ProAimer', 'Лёха', 'NaVi4ever',
    'sn1per', 'Vlad_77', 'Tanya_CS', 'b1t_fan', 'EcoKing', 'Maks_Ak47', 'Karambit_Lover'];

  const feed = {
    push(user, item, caseId, kind = 'case') { // caseId оставлен для совместимости вызовов
      const el = document.getElementById('feed-list');
      if (!el) return;
      const skin = App.data.SKINS[item.skinId];
      const icon = { case: '', upgrade: '⬆', contract: '✎', battle: '⚔' }[kind];
      const html = `<a class="feed-item ${user === 'Вы' ? 'mine' : ''}" href="#/skin/${skin.id}"
          style="--rc:${rarityOf(skin).color}" title="${esc(user)}: ${esc(skin.weapon)} | ${esc(skin.name)} — ${App.ui.fmt(item.price)}">
        ${skinIcon(skin)}<span class="feed-user">${icon} ${esc(user)}</span></a>`;
      el.insertAdjacentHTML('afterbegin', html);
      while (el.children.length > 30) el.lastElementChild.remove();
    },
  };

  function botDrop() {
    const paid = CASES.filter((c) => !c.free);
    // Дешёвые кейсы открывают чаще.
    const weights = paid.map((c) => 1 / Math.sqrt(c.price));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), c = paid[0];
    for (let i = 0; i < paid.length; i++) { r -= weights[i]; if (r <= 0) { c = paid[i]; break; } }
    let x = Math.random(), acc = 0, skin = c.items[c.items.length - 1].skin;
    for (let i = c.items.length - 1; i >= 0; i--) { acc += c.items[i].chance; if (x < acc) { skin = c.items[i].skin; break; } }
    const item = { skinId: skin.id, price: skin.price };
    feed.push(FEED_BOTS[Math.floor(Math.random() * FEED_BOTS.length)], item, c.id);
  }

  // --- Шапка ---
  function renderHeader() {
    const lv = store.level();
    document.getElementById('balance').innerHTML = money(store.state.balance);
    document.getElementById('level').innerHTML = `<b>${lv.lvl}</b><i style="width:${Math.round(lv.progress * 100)}%"></i>`;
    document.getElementById('level').title = `Уровень ${lv.lvl} · опыт ${Math.floor(store.state.xp)} / ${lv.next}`;
    document.getElementById('inv-count').textContent = store.state.inventory.length;
    const u = App.auth.user();
    document.getElementById('account').innerHTML = u
      ? `<a class="account-link" href="#/profile" data-nav="profile" title="Личный кабинет">${App.avatarHtml(u)}<span>${App.ui.esc(u.login)}</span></a>`
      : '<button class="btn ghost small-login" id="login-btn">Войти</button>';
  }

  // --- Демо-пополнение ---
  App.openDeposit = function () {
    const m = modal(`<h2>Демо-баланс</h2>
      <p class="muted">Это симулятор: монеты виртуальные, настоящих платежей нет, вывести предметы нельзя.</p>
      <div class="deposit-grid">${[10, 50, 100, 500, 1000].map((n) => `<button class="btn ghost" data-n="${n}">+${money(n)}</button>`).join('')}</div>`);
    m.el.querySelector('.deposit-grid').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      store.credit(+b.dataset.n);
      store.log('deposit', 'Демо-пополнение', +b.dataset.n);
      store.save();
      toast(`Начислено ${money(+b.dataset.n)}`, 'good');
      m.close();
    });
  };

  const PROMOS = { SHADOW: 10, CS2: 5, UPGRADE: 15 };
  App.redeemPromo = function (code) {
    if (!code) return;
    if (!(code in PROMOS)) return toast('Такого промокода нет', 'bad');
    if (store.state.promoUsed.includes(code)) return toast('Промокод уже активирован', 'bad');
    store.state.promoUsed.push(code);
    store.credit(PROMOS[code]);
    store.log('deposit', `Промокод ${code}`, PROMOS[code]);
    store.save();
    toast(`Промокод активирован: +${money(PROMOS[code])}`, 'good');
  };

  // --- Роутер ---
  const ROUTES = [
    [/^#?\/?$/, (v) => App.pages.home(v), ''],
    [/^#\/case\/([\w-]+)$/, (v, m) => App.pages.case(v, m[1]), ''],
    [/^#\/upgrade$/, (v) => App.pages.upgrade(v), 'upgrade'],
    [/^#\/contracts$/, (v) => App.pages.contracts(v), 'contracts'],
    [/^#\/battles$/, (v) => App.pages.battles(v), 'battles'],
    [/^#\/inventory$/, (v) => App.pages.inventory(v), 'inventory'],
    [/^#\/fair$/, (v) => App.pages.fair(v), 'fair'],
    [/^#\/skins$/, (v) => App.pages.skins(v), 'skins'],
    [/^#\/skin\/([\w-]+)$/, (v, m) => App.pages.skin(v, m[1]), 'skins'],
    [/^#\/profile$/, (v) => App.pages.profile(v), 'profile'],
  ];
  let cleanup = null;

  App.route = route;
  function route() {
    const hash = location.hash || '#/';
    const view = document.getElementById('view');
    if (cleanup) { cleanup(); cleanup = null; }
    document.querySelectorAll('.modal-back').forEach((m) => m.remove());
    // Новый узел на каждую страницу: старые async-обработчики видят view.isConnected === false.
    const fresh = view.cloneNode(false);
    view.replaceWith(fresh);
    for (const [re, fn, nav] of ROUTES) {
      const m = hash.match(re);
      if (m) {
        cleanup = fn(fresh, m) || null;
        document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === (nav || 'cases')));
        window.scrollTo(0, 0);
        return;
      }
    }
    location.hash = '#/';
  }

  function init() {
    App.feed = feed;
    store.subscribe(renderHeader);
    renderHeader();
    document.getElementById('deposit').addEventListener('click', App.openDeposit);
    document.getElementById('account').addEventListener('click', (e) => {
      if (e.target.closest('#login-btn')) App.openAuth('login');
    });
    window.addEventListener('hashchange', route);
    route();
    for (let i = 0; i < 12; i++) botDrop();
    (function loop() {
      setTimeout(() => { botDrop(); loop(); }, 1500 + Math.random() * 3000);
    })();
  }

  App.feed = feed;
  document.addEventListener('DOMContentLoaded', init);
})(window.App);
