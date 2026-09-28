// Батлы: несколько игроков открывают одинаковые кейсы, победитель забирает всё.
window.App = window.App || {};
(function (App) {
  const { CASES, CASE_BY_ID, round2 } = App.data;
  const { money, caseArt, toast, esc, itemCard, showDrops } = App.ui;
  const store = App.store;

  const BOT_NAMES = ['s1mple_fan', 'HeadshotHero', 'ZeusMain', 'NoScopeNik', 'EcoRound', 'FlashBang', 'DeagleOnly', 'ClutchKing', 'RushB', 'MolotovMaks'];

  function page(view) {
    let caseId = 'classic';
    let players = 2;
    let rounds = 3;
    let busy = false;

    const paid = CASES.filter((c) => !c.free);

    view.innerHTML = `
      <h1 class="page-title">Батлы</h1>
      <div class="panel battle-setup" id="setup">
        <div class="case-pick" id="cases">${paid.map((c) => `
          <button class="case-mini ${c.id === caseId ? 'on' : ''}" data-id="${c.id}" style="--cc:${c.color}">
            ${caseArt(c)}<span>${esc(c.name)}</span>${money(c.price)}</button>`).join('')}
        </div>
        <div class="battle-opts">
          <div>Игроков <div class="seg" id="players">${[2, 3, 4].map((n) => `<button data-n="${n}" class="${n === players ? 'on' : ''}">${n}</button>`).join('')}</div></div>
          <div>Раундов <div class="seg" id="rounds">${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" class="${n === rounds ? 'on' : ''}">${n}</button>`).join('')}</div></div>
          <button class="btn primary big" id="start"></button>
        </div>
      </div>
      <div class="arena" id="arena"></div>`;

    const $ = (s) => view.querySelector(s);

    function updateStart() {
      const c = CASE_BY_ID[caseId];
      $('#start').innerHTML = `Начать батл за ${money(c.price * rounds)}`;
      $('#start').disabled = busy;
    }

    function pickSeg(sel, cb) {
      $(sel).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || busy) return;
        $(sel).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        cb(b);
        updateStart();
      });
    }
    pickSeg('#cases', (b) => { caseId = b.dataset.id; });
    pickSeg('#players', (b) => { players = +b.dataset.n; });
    pickSeg('#rounds', (b) => { rounds = +b.dataset.n; });

    $('#start').addEventListener('click', async () => {
      const c = CASE_BY_ID[caseId];
      const cost = round2(c.price * rounds);
      if (busy) return;
      if (!store.canAfford(cost)) { toast('Недостаточно монет', 'bad'); App.openDeposit(); return; }
      busy = true;
      updateStart();
      store.spend(cost);
      store.state.stats.battles++;

      const names = ['Вы', ...BOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, players - 1)];
      // Все броски заранее — из provably fair потока, по одному nonce на игрока в раунде.
      const drops = names.map(() => []);
      for (let r = 0; r < rounds; r++) {
        for (let p = 0; p < players; p++) drops[p].push(App.rollCaseItem(c, App.fair.next()));
      }
      const totals = drops.map((list) => list.reduce((s, d) => s + App.data.itemPrice(d.skin, d.wear, d.st), 0));
      const best = Math.max(...totals);
      // Ничья решается ещё одним честным броском.
      const leaders = totals.map((t, i) => (t === best ? i : -1)).filter((i) => i >= 0);
      const winner = leaders[Math.floor(App.fair.next()() * leaders.length)];
      const allItems = drops.flat().map((d) => store.makeItem(d.skin, d.wear, d.st, `Батл «${c.name}»`));
      if (winner === 0) {
        store.state.stats.battlesWon++;
        store.addItems(allItems);
      }
      store.log('battle', `«${c.name}», ${players} игр., ${rounds} р.: ${winner === 0 ? 'победа' : 'поражение'}`,
        winner === 0 ? App.data.round2(allItems.reduce((t, it) => t + it.price, 0)) : -cost);
      store.save();

      const arena = $('#arena');
      arena.innerHTML = `<div class="battle-cols" style="--n:${players}">${names.map((n, i) => `
        <div class="bcol" data-p="${i}">
          <div class="bplayer"><span class="avatar">${esc(n[0])}</span>${esc(n)}</div>
          <div class="reel vertical-reel" id="breel${i}"></div>
          <div class="btotal">${money(0)}</div>
          <div class="bdrops"></div>
        </div>`).join('')}</div>`;

      const running = names.map(() => 0);
      const fast = store.state.settings.fast;
      for (let r = 0; r < rounds; r++) {
        if (!view.isConnected) return;
        await Promise.all(names.map((_, p) => App.reel.spin(arena.querySelector(`#breel${p}`), c, drops[p][r].skin, { fast, vertical: true })));
        names.forEach((_, p) => {
          const d = drops[p][r];
          running[p] += App.data.itemPrice(d.skin, d.wear, d.st);
          const col = arena.querySelector(`[data-p="${p}"]`);
          col.querySelector('.btotal').innerHTML = money(running[p]);
          col.querySelector('.bdrops').insertAdjacentHTML('beforeend', itemCard(allItems[p * rounds + r]));
        });
        await App.ui.sleep(fast ? 200 : 700);
      }
      if (!view.isConnected) return;

      arena.querySelectorAll('.bcol').forEach((col, i) => col.classList.add(i === winner ? 'winner' : 'loser'));
      busy = false;
      updateStart();
      if (winner === 0) {
        const top = allItems.reduce((a, b) => (b.price > a.price ? b : a));
        App.feed.push('Вы', top, c.id, 'battle');
        showDrops(allItems, `Победа! Вы забираете ${allItems.length} предметов`);
      } else {
        toast(`Победил ${esc(names[winner])} с ${money(totals[winner])}`, 'bad');
      }
    });

    updateStart();
  }

  App.pages = App.pages || {};
  App.pages.battles = page;
})(window.App);
