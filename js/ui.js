'use strict';
// =====================================================================
//  ARCANE SURVIVORS — сюжетный слой и интерфейс
// =====================================================================

const UI = (() => {
  const $ = (id) => document.getElementById(id);
  const screens = ['title', 'hub', 'dialog', 'levelup', 'pause', 'result', 'ending'];
  let overlay = null; // текущий открытый экран

  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    overlay = id;
    const touchHud = !(id === null && Game.running && isTouch());
    $('heartBtn').classList.toggle('hidden', touchHud);
    $('pauseBtn').classList.toggle('hidden', touchHud);
  }
  function hideAll() { show(null); }
  const isTouch = () => 'ontouchstart' in window;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // -------------------------------------------------------------------
  //  Диалоги (с печатной машинкой)
  // -------------------------------------------------------------------
  let dlg = null;
  function dialog(pages, onDone, opts = {}) {
    dlg = { pages, i: 0, onDone, typing: null, full: '' };
    $('dialog').classList.toggle('ending-style', !!opts.ending);
    show('dialog');
    showPage();
  }
  function showPage() {
    const pg = dlg.pages[dlg.i];
    $('dlgWho').textContent = pg.who || '';
    $('dlgWho').className = 'dlg-who ' + whoClass(pg.who);
    $('dlgBox').classList.toggle('narrator', !pg.who);
    $('dlgCounter').textContent = (dlg.i + 1) + ' / ' + dlg.pages.length;
    const el = $('dlgText');
    dlg.full = pg.text;
    let n = 0;
    clearInterval(dlg.typing);
    el.textContent = '';
    dlg.typing = setInterval(() => {
      n += 2;
      el.textContent = dlg.full.slice(0, n);
      if (n >= dlg.full.length) { clearInterval(dlg.typing); dlg.typing = null; }
    }, 16);
  }
  function whoClass(who) {
    if (!who) return '';
    if (who.includes('Шёпот')) return 'who-heart';
    if (who.includes('Элиан')) return 'who-mentor';
    if (who.includes('Король')) return 'who-king';
    return 'who-other';
  }
  function dialogNext() {
    if (!dlg) return;
    if (dlg.typing) { clearInterval(dlg.typing); dlg.typing = null; $('dlgText').textContent = dlg.full; return; }
    dlg.i++;
    if (dlg.i >= dlg.pages.length) { const cb = dlg.onDone; dlg = null; cb && cb(); return; }
    showPage();
  }
  function dialogSkip() {
    if (!dlg) return;
    clearInterval(dlg.typing);
    const cb = dlg.onDone; dlg = null; cb && cb();
  }

  // -------------------------------------------------------------------
  //  Титульный экран
  // -------------------------------------------------------------------
  function toTitle() {
    Game.quit();
    show('title');
    $('btnContinue').textContent = Save.data.seenPrologue ? 'Продолжить' : 'Начать путь';
  }

  // -------------------------------------------------------------------
  //  Убежище
  // -------------------------------------------------------------------
  let hubTab = 'chapters';
  function toHub(tab) {
    Game.quit();
    if (tab) hubTab = tab;
    const s = Save.data;
    $('hubEther').textContent = s.ether;
    $('hubCorr').textContent = Math.round(s.corruption) + '%';
    $('hubCorrBar').style.width = s.corruption + '%';
    $('hubFrag').textContent = Save.fragmentCount() + ' / ' + Save.totalFragments();
    $('hubEnd').textContent = Object.keys(s.endings).length + ' / 4';
    $('hubCorrNote').textContent = corruptionNote(s.corruption);
    for (const t of ['chapters', 'codex', 'upgrades']) {
      $('tab-' + t).classList.toggle('active', t === hubTab);
      $('pane-' + t).classList.toggle('hidden', t !== hubTab);
    }
    renderChapters();
    renderCodex();
    renderUpgrades();
    show('hub');
  }

  function corruptionNote(c) {
    if (c < 20) return 'Сердце бьётся ровно. Ты всё ещё ты.';
    if (c < 45) return 'Иногда тень отстаёт от тебя на полшага.';
    if (c < 70) return 'Шёпот Сердца звучит как твой собственный голос.';
    return 'Ты не помнишь лица наставника. Бездна почти видит тебя целиком.';
  }

  function renderChapters() {
    const s = Save.data, box = $('pane-chapters');
    box.innerHTML = '';
    DATA.chapters.forEach((ch, i) => {
      const locked = i > s.unlockedChapter;
      const found = ch.fragments.filter((_, k) => Save.hasFragment(i, k)).length;
      const card = document.createElement('div');
      card.className = 'chapter-card' + (locked ? ' locked' : '') + (s.cleared[i] ? ' cleared' : '');
      card.style.setProperty('--accent', ch.palette.accent);
      const boss = DATA.bosses[ch.boss];
      card.innerHTML = `
        <div class="ch-roman">${ch.roman}</div>
        <div class="ch-body">
          <div class="ch-name">${locked ? '???' : esc(ch.name)}</div>
          <div class="ch-desc">${locked ? 'Победи стража предыдущей главы.' : esc(ch.desc)}</div>
          <div class="ch-meta">${locked ? '' : `Страж: <b>${esc(boss.name)}</b> · Фрагменты: ${found}/${ch.fragments.length}${s.bestTime[i] ? ' · Рекорд: ' + fmtTime(s.bestTime[i]) : ''}`}</div>
        </div>
        <div class="ch-state">${locked ? '🔒' : s.cleared[i] ? '✦ Пройдено' : 'В бой'}</div>`;
      if (!locked) card.onclick = () => startChapter(i);
      box.appendChild(card);
    });
  }

  function renderCodex() {
    const box = $('pane-codex');
    let html = '';
    DATA.chapters.forEach((ch, i) => {
      html += `<div class="codex-ch"><h3 style="color:${ch.palette.accent}">${ch.roman}. ${esc(ch.name)}</h3>`;
      ch.fragments.forEach((f, k) => {
        html += Save.hasFragment(i, k)
          ? `<div class="frag"><div class="frag-title">✧ ${esc(f.title)}</div><div class="frag-text">${esc(f.text)}</div></div>`
          : `<div class="frag unknown"><div class="frag-title">✧ Утраченное воспоминание</div><div class="frag-text">Убей носителя памяти или погибни в этой главе, чтобы увидеть.</div></div>`;
      });
      html += '</div>';
    });
    html += '<div class="codex-ch"><h3>Концовки</h3>';
    for (const id of ['seal', 'absorb_low', 'absorb_high', 'free']) {
      const names = { seal: 'Печать', absorb_low: 'Хранитель', absorb_high: 'Новый Владыка', free: 'Рассвет (тайная)' };
      html += `<div class="frag ${Save.data.endings[id] ? '' : 'unknown'}"><div class="frag-title">${Save.data.endings[id] ? '★' : '☆'} ${names[id]}</div></div>`;
    }
    html += '</div>';
    box.innerHTML = html;
  }

  function renderUpgrades() {
    const box = $('pane-upgrades'), s = Save.data;
    box.innerHTML = '';
    for (const id in DATA.meta) {
      const m = DATA.meta[id], lvl = Save.meta(id);
      const isPurity = id === 'purity';
      const maxed = !isPurity && lvl >= m.max;
      const cost = isPurity ? m.cost[0] : m.cost[lvl];
      const can = !maxed && s.ether >= cost && !(isPurity && s.corruption <= 0);
      const row = document.createElement('div');
      row.className = 'upg' + (maxed ? ' maxed' : '');
      const pips = isPurity ? '' : Array.from({ length: m.max }, (_, k) => `<span class="pip ${k < lvl ? 'on' : ''}"></span>`).join('');
      row.innerHTML = `<div class="upg-info"><div class="upg-name">${esc(m.name)}</div><div class="upg-desc">${esc(m.desc)}</div><div class="pips">${pips}</div></div>
        <button class="btn small" ${can ? '' : 'disabled'}>${maxed ? 'Макс.' : cost + ' ✦'}</button>`;
      row.querySelector('button').onclick = () => {
        if (!can) return;
        s.ether -= cost;
        if (isPurity) Save.addCorruption(-15);
        else s.meta[id] = lvl + 1;
        Save.write();
        toHub('upgrades');
      };
      box.appendChild(row);
    }
  }

  const fmtTime = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

  // -------------------------------------------------------------------
  //  Запуск главы
  // -------------------------------------------------------------------
  const seenIntro = {};
  function startChapter(i) {
    const ch = DATA.chapters[i];
    const go = () => { hideAll(); Game.start(i); show(null); };
    if (!seenIntro[i]) { seenIntro[i] = true; dialog(ch.intro, go); }
    else go();
  }

  // -------------------------------------------------------------------
  //  Колбэки игры
  // -------------------------------------------------------------------
  let currentChoices = [];
  function onLevelUp(choices, isSpec) {
    currentChoices = choices;
    $('luTitle').textContent = isSpec ? 'Выбери путь магии' : 'Новый уровень';
    $('luSub').textContent = isSpec
      ? 'Сердце Эфира откликается. Какой стихии ты отдашь себя?'
      : 'Сердце Эфира пульсирует силой павших.';
    renderChoices(isSpec);
    show('levelup');
  }
  function renderChoices(isSpec) {
    const box = $('luCards');
    box.innerHTML = '';
    box.classList.toggle('spec', !!isSpec);
    currentChoices.forEach((c, idx) => {
      const el = document.createElement('div');
      el.className = 'card' + (c.type === 'evo' ? ' evo' : '') + (c.type === 'spec' ? ' spec' : '');
      el.style.setProperty('--c', c.color);
      el.innerHTML = `<div class="card-icon">${c.icon}</div><div class="card-tag">${esc(c.tag)}</div>
        <div class="card-title">${esc(c.title)}</div><div class="card-desc">${esc(c.desc)}</div><div class="card-key">${idx + 1}</div>`;
      el.onclick = () => choose(idx);
      box.appendChild(el);
    });
    const rr = Game.rerolls;
    $('btnReroll').classList.toggle('hidden', isSpec || rr <= 0);
    $('btnReroll').textContent = 'Перебор (' + rr + ')';
  }
  function choose(idx) {
    const c = currentChoices[idx];
    if (!c) return;
    Game.applyChoice(c);
    currentChoices = [];
    show(null);
    Game.setPaused(false);
  }

  function onFragment(f) {
    const fr = DATA.chapters[f.ch].fragments[f.i];
    toast('Фрагмент памяти', fr.title, '#ffd86b');
  }
  function onBoss(d) { toast('Страж пробудился', d.name + ' — ' + d.title, '#ff6a7a'); }
  function onHeartUsed() { /* резерв под звук */ }

  let toastT = null;
  function toast(title, text, color) {
    const t = $('toast');
    t.innerHTML = `<div class="toast-title" style="color:${color}">${esc(title)}</div><div class="toast-text">${esc(text)}</div>`;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 3500);
  }

  function onRunEnd(r) {
    const ch = DATA.chapters[r.ch];
    if (r.victory) {
      dialog(ch.outro, () => {
        if (r.ch === 3) showEndingChoice(r);
        else showResult(r);
      });
    } else showResult(r);
  }

  function showResult(r) {
    const ch = DATA.chapters[r.ch];
    $('resTitle').textContent = r.victory ? 'Страж повержен' : 'Ты пал';
    $('resTitle').className = r.victory ? 'win' : 'lose';
    $('resSub').textContent = r.victory
      ? (r.ch < 3 ? 'Открыта новая глава: ' + DATA.chapters[r.ch + 1].name : 'Арканум помнит тебя.')
      : 'Но смерть — не конец. Сердце Эфира возвращает тебя в Убежище... и показывает то, что видело.';
    $('resStats').innerHTML = `
      <div><span>Глава</span><b>${ch.roman}. ${esc(ch.name)}</b></div>
      <div><span>Время</span><b>${fmtTime(r.time)}</b></div>
      <div><span>Уничтожено</span><b>${r.kills}</b></div>
      <div><span>Уровень</span><b>${r.level}</b></div>
      <div><span>Школа</span><b>${r.spec ? esc(DATA.specs[r.spec].name) : '—'}</b></div>
      <div><span>Получено Эфира</span><b>+${r.ether} ✦</b></div>`;
    const frags = r.fragments.concat(r.vision ? [r.vision] : []);
    let fh = '';
    for (const f of frags) {
      const fr = DATA.chapters[f.ch].fragments[f.i];
      fh += `<div class="frag"><div class="frag-title">${f === r.vision ? '👁 Видение' : '✧ Фрагмент памяти'}: ${esc(fr.title)}</div><div class="frag-text">${esc(fr.text)}</div></div>`;
    }
    if (!frags.length) fh = '<div class="muted">Все воспоминания этой главы уже открыты.</div>';
    $('resFrags').innerHTML = fh;
    show('result');
  }

  // -------------------------------------------------------------------
  //  Финал
  // -------------------------------------------------------------------
  function showEndingChoice(r) {
    const allFrags = Save.fragmentCount() >= Save.totalFragments();
    const box = $('endCards');
    box.innerHTML = '';
    for (const id of ['seal', 'absorb', 'free']) {
      const e = DATA.endings[id];
      const locked = id === 'free' && !allFrags;
      const el = document.createElement('div');
      el.className = 'card ending-card' + (locked ? ' locked' : '') + (id === 'free' ? ' secret' : '');
      el.style.setProperty('--c', id === 'seal' ? '#9ad0ff' : id === 'absorb' ? '#b46cff' : '#ffd86b');
      el.innerHTML = `<div class="card-icon">${id === 'seal' ? '✶' : id === 'absorb' ? '●' : '☀'}</div>
        <div class="card-title">${locked ? '???' : esc(e.title)}</div>
        <div class="card-desc">${locked ? 'Тебе не хватает правды. Собери все фрагменты памяти (' + Save.fragmentCount() + '/' + Save.totalFragments() + ').' : esc(e.desc)}</div>`;
      if (!locked) el.onclick = () => playEnding(id, r);
      box.appendChild(el);
    }
    $('endCorr').textContent = 'Порча: ' + Math.round(Save.data.corruption) + '%' + (Save.data.corruption >= 50 ? ' — Бездна уже внутри тебя.' : ' — ты всё ещё помнишь своё имя.');
    show('ending');
  }

  function playEnding(id, r) {
    const e = DATA.endings[id];
    let text = e.text.slice(), key = id;
    if (id === 'absorb') {
      const high = Save.data.corruption >= 50;
      text = text.concat(high ? e.textHigh : e.textLow);
      key = high ? 'absorb_high' : 'absorb_low';
    }
    Save.data.endings[key] = true;
    Save.write();
    dialog(text.map((t) => ({ who: '', text: t })), () => {
      dialog([
        { who: '', text: 'ARCANE SURVIVORS' },
        { who: '', text: 'История о маге, который хотел спасти мир, но однажды обнаружил, что сам может стать его последним проклятием.' },
        { who: '', text: 'Открыто концовок: ' + Object.keys(Save.data.endings).length + ' из 4. Ты можешь вернуться в любую главу, чтобы найти недостающие воспоминания и принять иное решение.' },
      ], () => showResult(r), { ending: true });
    }, { ending: true });
  }

  // -------------------------------------------------------------------
  //  Пауза
  // -------------------------------------------------------------------
  function togglePause(force) {
    if (!Game.running) return;
    if (overlay === 'pause' && force !== true) { show(null); Game.setPaused(false); return; }
    if (overlay !== null) return; // другое окно открыто
    Game.setPaused(true);
    const run = Game.run;
    let html = '<div class="build">';
    for (const w of run.weapons) {
      const d = DATA.weapons[w.id];
      html += `<div class="build-item" style="--c:${d.color}"><span>${d.icon}</span>${esc(w.evo ? d.evo.name : d.name)} <b>${w.evo ? '★' : 'ур. ' + w.lvl}</b><div class="muted">Эволюция: ${esc(d.evo.name)} (5 ур. + ${esc(DATA.passives[d.evo.needs].name)})</div></div>`;
    }
    for (const id in run.passives) html += `<div class="build-item"><span>${DATA.passives[id].icon}</span>${esc(DATA.passives[id].name)} <b>ур. ${run.passives[id]}</b></div>`;
    html += '</div>';
    $('pauseBuild').innerHTML = html;
    show('pause');
  }

  // Подтверждение внутри страницы (системные диалоги могут быть заблокированы)
  let askCb = null;
  function ask(text, cb) { askCb = cb; $('askText').textContent = text; $('ask').classList.remove('hidden'); }

  // -------------------------------------------------------------------
  //  Привязка событий
  // -------------------------------------------------------------------
  function init() {
    Save.load();
    $('btnContinue').onclick = () => {
      if (!Save.data.seenPrologue) {
        dialog(DATA.prologue, () => { Save.data.seenPrologue = true; Save.write(); toHub('chapters'); });
      } else toHub('chapters');
    };
    $('btnPrologue').onclick = () => dialog(DATA.prologue, () => toTitle());
    $('btnReset').onclick = () => {
      ask('Стереть весь прогресс? Фрагменты, Эфир и концовки будут утеряны.', () => { Save.reset(); for (const k in seenIntro) delete seenIntro[k]; toTitle(); });
    };
    for (const t of ['chapters', 'codex', 'upgrades']) $('tab-' + t).onclick = () => toHub(t);
    $('btnHubBack').onclick = toTitle;
    $('dialog').onclick = (e) => { if (e.target.id !== 'dlgSkip') dialogNext(); };
    $('dlgSkip').onclick = (e) => { e.stopPropagation(); dialogSkip(); };
    $('btnReroll').onclick = () => { const c = Game.reroll(); if (c) { currentChoices = c; renderChoices(false); } };
    $('btnResume').onclick = () => togglePause();
    $('btnQuit').onclick = () => ask('Покинуть забег? Прогресс забега будет потерян.', () => toHub());
    $('askNo').onclick = () => $('ask').classList.add('hidden');
    $('askYes').onclick = () => { $('ask').classList.add('hidden'); const cb = askCb; askCb = null; cb && cb(); };
    $('btnResHub').onclick = () => toHub('chapters');
    $('heartBtn').addEventListener('touchstart', (e) => { e.preventDefault(); Game.useHeart(); });
    $('pauseBtn').addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });

    window.addEventListener('keydown', (e) => {
      if (overlay === 'dialog' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); dialogNext(); }
      if (overlay === 'dialog' && e.code === 'Escape') dialogSkip();
      if (overlay === 'levelup') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= currentChoices.length) choose(n - 1);
        if (e.code === 'KeyR') $('btnReroll').click();
      }
    });
    toTitle();
  }

  return { init, onLevelUp, onFragment, onBoss, onHeartUsed, onRunEnd, togglePause };
})();

window.addEventListener('load', UI.init);
