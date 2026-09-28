// Личный кабинет: вход, регистрация, профиль, история, настройки.
window.App = window.App || {};
(function (App) {
  const { money, esc, modal, toast, itemCard, fmt } = App.ui;
  const store = App.store;
  const auth = App.auth;

  const HISTORY_ICONS = { case: 'Кейс', upgrade: 'Апгрейд', contract: 'Контракт', battle: 'Батл', trade: 'Обмен', sell: 'Продажа', deposit: 'Баланс', account: 'Аккаунт' };

  const avatar = (u, size = '') =>
    `<span class="avatar ${size}" style="--hue:${u ? u.hue : 220}">${esc(u ? u.login[0].toUpperCase() : '?')}</span>`;

  function authForm(mode) {
    const isLogin = mode === 'login';
    return `<form class="auth-form" data-mode="${mode}" novalidate>
      <div class="seg auth-tabs">
        <button type="button" data-tab="login" class="${isLogin ? 'on' : ''}">Вход</button>
        <button type="button" data-tab="register" class="${isLogin ? '' : 'on'}">Регистрация</button>
      </div>
      <label class="field">Логин<input id="auth-login" name="login" autocomplete="username" maxlength="16" required></label>
      <label class="field">Пароль<input id="auth-pass" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required></label>
      ${isLogin ? '' : '<label class="field">Повторите пароль<input id="auth-pass2" name="password2" type="password" autocomplete="new-password" required></label>'}
      <div class="auth-error" role="alert"></div>
      <button class="btn primary big" type="submit">${isLogin ? 'Войти' : 'Создать аккаунт'}</button>
      <p class="muted small">${isLogin
        ? 'Нет аккаунта? Откройте вкладку «Регистрация».'
        : 'Прогресс гостя (баланс и инвентарь) перейдёт в новый аккаунт.'}
        Аккаунты хранятся только в этом браузере.</p>
    </form>`;
  }

  // Вешает обработчики на форму; onDone вызывается после успешного входа.
  function bindAuth(root, onDone) {
    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      root.querySelector('.auth-form').outerHTML = authForm(tab.dataset.tab);
      root.querySelector('#auth-login').focus();
    });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const login = f.login.value, pass = f.password.value;
      let err;
      if (f.dataset.mode === 'register') {
        err = pass !== f.password2.value ? 'Пароли не совпадают.' : auth.register(login, pass);
      } else {
        err = auth.login(login, pass);
      }
      if (err) {
        f.querySelector('.auth-error').textContent = err;
        return;
      }
      toast(f.dataset.mode === 'register' ? `Добро пожаловать, ${esc(auth.user().login)}!` : `С возвращением, ${esc(auth.user().login)}!`, 'good');
      onDone && onDone();
    });
  }

  App.openAuth = function (mode = 'login') {
    const m = modal(`<h2>Личный кабинет</h2>${authForm(mode)}`);
    bindAuth(m.el, () => { m.close(); location.hash = '#/profile'; });
    m.el.querySelector('#auth-login').focus();
  };

  function fmtDate(ts) {
    return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function profile(view) {
    const u = auth.user();
    if (!u) {
      view.innerHTML = `<div class="auth-page panel"><h1 class="page-title">Вход в личный кабинет</h1>${authForm('login')}</div>`;
      bindAuth(view, () => App.route());
      return;
    }

    let tab = 'overview';
    view.innerHTML = `
      <section class="profile-head panel">
        ${avatar(u, 'xl')}
        <div class="profile-name">
          <h1>${esc(u.login)}</h1>
          <div class="muted">На сайте с ${fmtDate(u.created)}</div>
          <div class="lvl-line" id="p-level"></div>
        </div>
        <div class="profile-balance"><span class="muted">Баланс</span><b id="p-balance"></b>
          <button class="btn primary" id="p-deposit">Пополнить</button></div>
      </section>
      <div class="seg profile-tabs" id="p-tabs">
        <button data-t="overview" class="on">Обзор</button>
        <button data-t="history">История</button>
        <button data-t="settings">Настройки</button>
      </div>
      <div id="p-body"></div>`;

    const $ = (s) => view.querySelector(s);

    function renderHead() {
      const lv = store.level();
      $('#p-balance').innerHTML = money(store.state.balance);
      $('#p-level').innerHTML = `Уровень <b>${lv.lvl}</b>
        <div class="xp-bar"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
        <span class="muted">${fmt(store.state.xp)} / ${fmt(lv.next)} опыта</span>`;
    }

    function overview() {
      const st = store.state;
      const s = st.stats;
      const invValue = st.inventory.reduce((t, it) => t + it.price, 0);
      const top = st.inventory.slice().sort((a, b) => b.price - a.price).slice(0, 6);
      const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
      return `
        <div class="profile-stats">
          <div><span>Кейсов открыто</span><b>${s.opened}</b></div>
          <div><span>Апгрейды</span><b>${s.upgradesWon} / ${s.upgrades}</b><em>${pct(s.upgradesWon, s.upgrades)} удачных</em></div>
          <div><span>Контракты</span><b>${s.contracts}</b></div>
          <div><span>Батлы</span><b>${s.battlesWon} / ${s.battles}</b><em>${pct(s.battlesWon, s.battles)} побед</em></div>
          <div><span>Инвентарь</span><b>${st.inventory.length}</b><em>${money(invValue)}</em></div>
          <div><span>Лучший дроп</span><b>${s.best ? money(s.best.price) : '—'}</b>
            <em>${s.best ? `<a href="#/skin/${s.best.skinId}">${esc(App.data.SKINS[s.best.skinId].weapon)} | ${esc(App.data.SKINS[s.best.skinId].name)}</a>` : ''}</em></div>
        </div>
        <h2 class="section-title">Самые дорогие предметы</h2>
        ${top.length ? `<div class="item-grid">${top.map((it) => itemCard(it, { view: true })).join('')}</div>`
          : '<p class="empty">Инвентарь пуст — <a href="#/">откройте первый кейс</a>.</p>'}
        <div class="modal-actions left"><a class="btn ghost" href="#/inventory">Весь инвентарь</a></div>`;
    }

    function history() {
      const h = store.state.history;
      return h.length ? `<div class="table-wrap panel"><table class="odds">
          <tr><th>Когда</th><th>Действие</th><th>Что произошло</th><th>Сумма</th></tr>
          ${h.map((e) => `<tr><td class="nowrap muted">${fmtDate(e.ts)}</td><td><span class="tag">${HISTORY_ICONS[e.type] || e.type}</span></td>
            <td>${esc(e.text)}</td><td>${e.price != null ? money(e.price) : ''}</td></tr>`).join('')}
        </table></div>`
        : '<p class="empty">Здесь появятся ваши открытия кейсов, апгрейды, контракты и батлы.</p>';
    }

    function settings() {
      return `<div class="settings-grid">
        <form class="panel" id="pw-form" novalidate>
          <h3>Смена пароля</h3>
          <label class="field">Текущий пароль<input id="pw-old" type="password" autocomplete="current-password"></label>
          <label class="field">Новый пароль<input id="pw-new" type="password" autocomplete="new-password"></label>
          <div class="auth-error" role="alert"></div>
          <button class="btn primary">Сохранить пароль</button>
        </form>
        <div class="panel">
          <h3>Цвет аватара</h3>
          <div class="hue-row" id="hues">${[0, 30, 55, 140, 190, 220, 265, 310].map((h) =>
            `<button class="avatar" style="--hue:${h}" data-h="${h}" aria-label="Цвет ${h}">${esc(u.login[0].toUpperCase())}</button>`).join('')}</div>
          <h3>Игра</h3>
          <label class="switch"><input type="checkbox" id="set-fast" ${store.state.settings.fast ? 'checked' : ''}><span></span>Быстрое открытие кейсов</label>
          <p class="muted small">Сиды честной игры — на странице <a href="#/fair">«Честная игра»</a>.</p>
        </div>
        <div class="panel">
          <h3>Аккаунт</h3>
          <button class="btn ghost" id="logout">Выйти из аккаунта</button>
          <div class="danger-zone">
            <p class="muted small">Сброс удалит баланс, инвентарь, статистику и историю этого аккаунта.</p>
            <button class="btn danger" id="reset">Сбросить прогресс</button>
            <div class="confirm" id="reset-confirm" hidden>
              <span>Точно сбросить? Это нельзя отменить.</span>
              <button class="btn danger small" id="reset-yes">Да, сбросить</button>
              <button class="btn ghost small" id="reset-no">Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    }

    function renderBody() {
      $('#p-body').innerHTML = tab === 'overview' ? overview() : tab === 'history' ? history() : settings();
      if (tab !== 'settings') return;
      $('#pw-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const err = auth.changePassword($('#pw-old').value, $('#pw-new').value);
        if (err) { e.target.querySelector('.auth-error').textContent = err; return; }
        toast('Пароль изменён', 'good');
        e.target.reset();
        e.target.querySelector('.auth-error').textContent = '';
      });
      $('#hues').addEventListener('click', (e) => {
        const b = e.target.closest('[data-h]');
        if (b) { auth.setHue(+b.dataset.h); App.route(); }
      });
      $('#set-fast').addEventListener('change', (e) => { store.state.settings.fast = e.target.checked; store.save(); });
      $('#logout').addEventListener('click', () => { auth.logout(); toast('Вы вышли из аккаунта'); location.hash = '#/'; });
      $('#reset').addEventListener('click', () => { $('#reset-confirm').hidden = false; });
      $('#reset-no').addEventListener('click', () => { $('#reset-confirm').hidden = true; });
      $('#reset-yes').addEventListener('click', () => { auth.resetProgress(); toast('Прогресс сброшен'); tab = 'overview'; App.route(); });
    }

    $('#p-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      tab = b.dataset.t;
      $('#p-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      renderBody();
    });
    $('#p-deposit').addEventListener('click', App.openDeposit);

    renderHead();
    renderBody();
    return store.subscribe(() => { renderHead(); if (tab !== 'settings') renderBody(); });
  }

  App.pages = App.pages || {};
  App.pages.profile = profile;
  App.avatarHtml = avatar;
})(window.App);
