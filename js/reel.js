// Рулетка (лента предметов), используется в кейсах и батлах.
window.App = window.App || {};
(function (App) {
  const { skinIcon, rarityOf } = App.ui;
  const WIN_INDEX = 48;
  const LENGTH = 56;

  // Случайный предмет кейса для «массовки» на ленте (чисто визуально).
  function filler(caseDef) {
    let r = Math.random(), acc = 0;
    for (const it of caseDef.items) { acc += it.chance; if (r < acc) return it.skin; }
    return caseDef.items[caseDef.items.length - 1].skin;
  }

  function cell(skin) {
    return `<div class="reel-cell" style="--rc:${rarityOf(skin).color}">
      <div class="reel-img">${skinIcon(skin)}</div>
      <div class="reel-name">${App.ui.esc(skin.weapon)}<br><b>${App.ui.esc(skin.name)}</b></div>
    </div>`;
  }

  /**
   * Рисует ленту в container и прокручивает её до winnerSkin.
   * @returns {Promise<void>} резолвится, когда лента остановилась
   */
  function spin(container, caseDef, winnerSkin, { fast = false, vertical = false, sound = true } = {}) {
    const skins = Array.from({ length: LENGTH }, () => filler(caseDef));
    skins[WIN_INDEX] = winnerSkin;
    container.classList.toggle('vertical', vertical);
    container.innerHTML = `<div class="reel-strip">${skins.map(cell).join('')}</div><div class="reel-marker"></div>`;
    const strip = container.firstElementChild;
    const cells = strip.children;
    const first = cells[0].getBoundingClientRect();
    const second = cells[1].getBoundingClientRect();
    const step = vertical ? second.top - first.top : second.left - first.left;
    const size = vertical ? first.height : first.width;
    const box = container.getBoundingClientRect();
    const start = vertical ? first.top - box.top - container.clientTop : first.left - box.left - container.clientLeft;
    const view = vertical ? container.clientHeight : container.clientWidth;
    // Останавливаемся в случайной точке внутри выигрышной ячейки — для интриги.
    const jitter = (Math.random() - 0.5) * size * 0.8;
    const offset = start + WIN_INDEX * step + size / 2 + jitter - view / 2;
    const duration = fast ? 1400 : 6200;

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${duration}ms cubic-bezier(.08,.72,.14,1)`;
        strip.style.transform = vertical ? `translateY(${-offset}px)` : `translateX(${-offset}px)`;
      });
      let done = false;
      // Щелчок каждый раз, когда под маркер заезжает новая ячейка.
      let lastCell = -1;
      const tickLoop = () => {
        if (done) return;
        const m = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
        const pos = -(vertical ? m.m42 : m.m41) + view / 2 - start;
        const idx = Math.floor(pos / step);
        if (idx !== lastCell) { if (lastCell >= 0) App.fx.sound.tick(); lastCell = idx; }
        requestAnimationFrame(tickLoop);
      };
      if (sound) requestAnimationFrame(tickLoop);
      const finish = () => {
        if (done) return;
        done = true;
        cells[WIN_INDEX].classList.add('won');
        resolve();
      };
      strip.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, duration + 300);
    });
  }

  App.reel = { spin, cell };
})(window.App);
