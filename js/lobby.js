// Lobby: game tiles, categories, search, hero carousel and hash routing.
(() => {
  const GAMES = [
    { id: 'crash', name: 'Ракета', cat: 'fast', icon: '🚀', a: '#ff6a00', b: '#c3007a', tag: 'ТОП' },
    { id: 'mines', name: 'Мины', cat: 'fast', icon: '💣', a: '#00b37a', b: '#005c9e', tag: 'ТОП' },
    { id: 'plinko', name: 'Плинко', cat: 'fast', icon: '🔻', a: '#ff2d87', b: '#5b21ff', tag: 'NEW' },
    { id: 'dice', name: 'Кости', cat: 'fast', icon: '🎲', a: '#2f80ff', b: '#1b2ca8' },
    { id: 'slots', name: 'Теневые слоты', cat: 'slots', icon: '🎰', a: '#ffb800', b: '#ff4d00' },
    { id: 'roulette', name: 'Рулетка', cat: 'table', icon: '🎡', a: '#d81b3c', b: '#4a0a2a' },
    { id: 'blackjack', name: 'Блэкджек', cat: 'table', icon: '🃏', a: '#11804b', b: '#06331f' },
  ];
  const CAT_TITLES = { all: 'Все игры', fast: 'Быстрые игры', slots: 'Слоты', table: 'Настольные игры' };

  const tilesEl = document.getElementById('tiles');
  const titleEl = document.getElementById('lobby-title');
  const search = document.getElementById('search');
  let currentCat = 'all';

  function renderTiles() {
    const q = search.value.trim().toLowerCase();
    const list = GAMES.filter(g => (currentCat === 'all' || g.cat === currentCat) && g.name.toLowerCase().includes(q));
    titleEl.textContent = q ? `Поиск: ${search.value.trim()}` : CAT_TITLES[currentCat];
    tilesEl.innerHTML = '';
    for (const g of list) {
      const a = document.createElement('a');
      a.className = 'tile';
      a.href = '#' + g.id;
      a.style.setProperty('--a', g.a);
      a.style.setProperty('--b', g.b);
      a.innerHTML = `${g.tag ? `<span class="tag">${g.tag}</span>` : ''}
        <span class="tile-icon">${g.icon}</span>
        <span class="tile-name"></span>
        <span class="tile-play">▶</span>`;
      a.querySelector('.tile-name').textContent = g.name;
      tilesEl.appendChild(a);
    }
    if (!list.length) tilesEl.innerHTML = '<p class="empty">Ничего не найдено</p>';
  }
  search.addEventListener('input', renderTiles);

  // Routing
  const views = document.querySelectorAll('.view');
  const gameTitle = document.getElementById('game-title');

  function showView(id) {
    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
  }

  function setNav(key) {
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === key));
  }

  function route() {
    const hash = location.hash.slice(1) || 'lobby';
    const [page, sub] = hash.split('/');
    document.body.classList.remove('menu-open');
    window.scrollTo(0, 0);

    if (page === 'history') {
      showView('history');
      setNav('history');
      return;
    }
    const game = GAMES.find(g => g.id === page);
    if (game) {
      showView('game');
      gameTitle.textContent = game.name;
      document.querySelectorAll('.game').forEach(el => el.classList.toggle('active', el.id === 'game-' + game.id));
      setNav(game.id === 'crash' ? 'crash' : '');
      window.dispatchEvent(new CustomEvent('casino:open', { detail: game.id }));
      return;
    }
    currentCat = CAT_TITLES[sub] ? sub : 'all';
    document.querySelectorAll('.cat').forEach(c => c.classList.toggle('active', c.dataset.cat === currentCat));
    setNav({ all: 'lobby', fast: 'fast', slots: 'slots-cat', table: 'table' }[currentCat]);
    showView('lobby');
    renderTiles();
  }
  window.addEventListener('hashchange', route);

  // Hero carousel
  const slides = [...document.querySelectorAll('#hero .slide')];
  const dots = document.getElementById('hero-dots');
  let slide = 0;
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.addEventListener('click', () => { show(i); restart(); });
    dots.appendChild(d);
  });
  function show(i) {
    slide = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle('active', j === slide));
    [...dots.children].forEach((d, j) => d.classList.toggle('active', j === slide));
  }
  let timer;
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(slide + 1), 5000);
  }
  show(0);
  restart();

  // Mobile menu
  document.getElementById('burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));

  // Wait until every game script has loaded so they receive the initial 'casino:open'.
  window.addEventListener('DOMContentLoaded', route);
})();
