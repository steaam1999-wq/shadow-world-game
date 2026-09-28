// Детальный осмотр скина: увеличение (колесо, кнопки, щипок), перетаскивание, фон, износ.
window.App = window.App || {};
(function (App) {
  const { RARITY, itemPrice, wearOdds } = App.data;
  const { esc, money, skinIcon, modal, fmtChance } = App.ui;

  const MIN = 1, MAX = 8;
  const BGS = [['dark', 'Тёмный'], ['light', 'Светлый'], ['grid', 'Сетка']];

  function openInspect(skin, { wear, st = false } = {}) {
    const r = RARITY[skin.rarity];
    const wears = wearOdds(skin);
    let curWear = wear && skin.wears.includes(wear) ? wear : (skin.wears.includes('FT') ? 'FT' : skin.wears[0]);
    let curSt = st && skin.st;
    let bg = 'dark';

    const m = modal(`
      <div class="inspect" style="--rc:${r.color}">
        <div class="inspect-stage bg-dark" id="ins-stage" tabindex="0" aria-label="Изображение скина: колесо мыши или +/− — увеличение, перетаскивание — сдвиг">
          <div class="inspect-canvas" id="ins-canvas">${skinIcon(skin, 'inspect-pic', '')}</div>
          <div class="inspect-zoom">
            <button id="ins-out" aria-label="Уменьшить">−</button>
            <span id="ins-level">100%</span>
            <button id="ins-in" aria-label="Увеличить">+</button>
            <button id="ins-reset" aria-label="Сбросить">⟲</button>
          </div>
          <div class="inspect-hint">Колесо мыши или щипок — увеличение · перетащите, чтобы сдвинуть · двойной клик — ×3</div>
        </div>
        <div class="inspect-side">
          <div class="muted">${esc(skin.weapon)}</div>
          <h2>${esc(skin.name)}</h2>
          <div class="pills"><span class="rarity-pill">${r.name}</span>${skin.st ? '<span class="pill st-pill">StatTrak™ доступен</span>' : ''}</div>
          <div class="inspect-price" id="ins-price"></div>
          <div class="inspect-label">Износ</div>
          <div class="seg wrap" id="ins-wear">${wears.map((w) => `<button data-w="${w.id}" title="${w.name} · шанс ${fmtChance(w.chance)}">${w.id}</button>`).join('')}</div>
          <div class="muted small" id="ins-wear-name"></div>
          ${skin.st ? '<label class="switch"><input type="checkbox" id="ins-st"><span></span>StatTrak™</label>' : ''}
          <div class="inspect-label">Фон</div>
          <div class="seg" id="ins-bg">${BGS.map(([id, n]) => `<button data-b="${id}" class="${id === bg ? 'on' : ''}">${n}</button>`).join('')}</div>
          <a class="btn ghost" href="#/skin/${skin.id}" id="ins-page">Страница скина и шансы</a>
        </div>
      </div>`, { wide: true, cls: 'inspect-modal' });

    const $ = (s) => m.el.querySelector(s);
    const stage = $('#ins-stage');
    const canvas = $('#ins-canvas');
    let scale = 1, tx = 0, ty = 0;

    function clampPan() {
      const w = stage.clientWidth, h = stage.clientHeight;
      // Изображение не уезжает за край дальше, чем на половину экрана.
      const maxX = (w * (scale - 1)) + w * 0.25, maxY = (h * (scale - 1)) + h * 0.25;
      tx = Math.min(w * 0.25, Math.max(-maxX, tx));
      ty = Math.min(h * 0.25, Math.max(-maxY, ty));
      if (scale === 1) { tx = 0; ty = 0; }
    }
    function apply(animate = false) {
      clampPan();
      canvas.style.transition = animate ? 'transform .25s ease' : 'none';
      canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      $('#ins-level').textContent = `${Math.round(scale * 100)}%`;
      stage.classList.toggle('zoomed', scale > 1);
    }
    // Масштабирование вокруг точки (px, py) в координатах сцены.
    function zoomAt(next, px, py, animate) {
      next = Math.min(MAX, Math.max(MIN, next));
      tx = px - (px - tx) * (next / scale);
      ty = py - (py - ty) * (next / scale);
      scale = next;
      apply(animate);
    }
    const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];

    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      zoomAt(scale * Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
    stage.addEventListener('dblclick', (e) => {
      const rect = stage.getBoundingClientRect();
      if (scale > 1) { scale = 1; tx = ty = 0; apply(true); }
      else zoomAt(3, e.clientX - rect.left, e.clientY - rect.top, true);
    });

    // Перетаскивание одним пальцем/мышью, щипок двумя пальцами.
    const pts = new Map();
    let last = null, pinch = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      stage.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      last = [e.clientX, e.clientY];
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: scale };
      }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const rect = stage.getBoundingClientRect();
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt(pinch.s * (d / pinch.d), (a[0] + b[0]) / 2 - rect.left, (a[1] + b[1]) / 2 - rect.top);
      } else if (pts.size === 1 && last) {
        tx += e.clientX - last[0];
        ty += e.clientY - last[1];
        last = [e.clientX, e.clientY];
        apply();
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      last = pts.size === 1 ? [...pts.values()][0] : null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);

    $('#ins-in').addEventListener('click', () => zoomAt(scale * 1.5, ...center(), true));
    $('#ins-out').addEventListener('click', () => zoomAt(scale / 1.5, ...center(), true));
    $('#ins-reset').addEventListener('click', () => { scale = 1; tx = ty = 0; apply(true); });
    stage.addEventListener('keydown', (e) => {
      if (e.key === '+' || e.key === '=') zoomAt(scale * 1.5, ...center(), true);
      else if (e.key === '-') zoomAt(scale / 1.5, ...center(), true);
      else if (e.key === '0') { scale = 1; tx = ty = 0; apply(true); }
      else return;
      e.preventDefault();
    });

    function renderInfo() {
      const w = wears.find((x) => x.id === curWear);
      $('#ins-price').innerHTML = money(itemPrice(skin, curWear, curSt));
      $('#ins-wear-name').textContent = `${w.name} · шанс износа ${fmtChance(w.chance)}`;
      m.el.querySelectorAll('#ins-wear button').forEach((b) => b.classList.toggle('on', b.dataset.w === curWear));
      stage.dataset.wear = curWear;
    }
    $('#ins-wear').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) { curWear = b.dataset.w; renderInfo(); }
    });
    $('#ins-st')?.addEventListener('change', (e) => { curSt = e.target.checked; renderInfo(); });
    if ($('#ins-st')) $('#ins-st').checked = curSt;
    $('#ins-bg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      bg = b.dataset.b;
      stage.className = `inspect-stage bg-${bg}${scale > 1 ? ' zoomed' : ''}`;
      m.el.querySelectorAll('#ins-bg button').forEach((x) => x.classList.toggle('on', x === b));
    });

    renderInfo();
    apply();
    stage.focus();
    return m;
  }

  App.openInspect = openInspect;
})(window.App);
