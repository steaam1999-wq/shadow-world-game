/*
 * TV layer for 2sub.movie, injected by MainActivity into every page (twice per load; it is idempotent).
 *
 * - Arrows move a visible focus ring between everything clickable (links, buttons, and the site's
 *   clickable cards, found by cursor:pointer), OK clicks it. Open dialogs (sign-in) keep focus inside.
 * - While a film plays: OK = pause/play, Left/Right = previous/next phrase (the player's own buttons,
 *   or a 10 s seek when they cannot be found), Up/Down = menu mode (focus the player controls and the
 *   "Диалоги" panel), Back leaves menu mode, then the player.
 * - window.__tv.back() and __tv.media() are called by MainActivity for the Back key and media keys.
 */
(function () {
  'use strict';

  var VIEWPORT_WIDTH = 1280;  // CSS pixels across the screen: the desktop layout, about 1.5x on a 1080p TV
  var SEEK_SECONDS = 10;
  var MEDIA_SEEK_SECONDS = 30;
  var MENU_IDLE_MS = 8000;

  function applyViewport() {
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      (document.head || document.documentElement).appendChild(m);
    }
    var want = 'width=' + VIEWPORT_WIDTH + ', user-scalable=no';
    if (m.getAttribute('content') !== want) m.setAttribute('content', want);
  }

  function applyCss() {
    if (document.getElementById('tv-style') || !window.__TV_CSS) return;
    var st = document.createElement('style');
    st.id = 'tv-style';
    st.textContent = window.__TV_CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  applyViewport();
  applyCss();
  if (window.__tv) return;

  // ------------------------------------------------------------------ state

  var focused = null;        // element carrying the focus ring
  var menuMode = false;      // in the player: arrows move focus instead of controlling playback
  var menuTimer = 0;
  var handled = {};          // key -> true while its keydown was ours, so the keyup is swallowed too
  var hintShownFor = null;   // the <video> the player hint was shown for
  var watched = typeof WeakSet === 'function' ? new WeakSet() : null;

  var DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
               Up: 'up', Down: 'down', Left: 'left', Right: 'right' };
  var NATURAL = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, ' +
      '[role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], ' +
      '[role="checkbox"], [role="switch"], [onclick], [tabindex]:not([tabindex="-1"])';
  var POINTER_SCAN = 'div, span, li, img, svg, label, p, h1, h2, h3, h4, article, section, figure';
  var SCOPES = '[role="dialog"], [aria-modal="true"], dialog[open], [class*="modal" i], [class*="popup" i]';

  // ------------------------------------------------------------------ helpers

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function isTextInput(el) {
    if (!el || !el.tagName) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'email', 'password', 'tel', 'url', 'number'].indexOf(t) >= 0;
  }

  function caretAtEdge(el, dir) {
    try {
      var len = (el.value || '').length;
      if (dir === 'left') return el.selectionStart === 0 && el.selectionEnd === 0;
      return el.selectionStart === len && el.selectionEnd === len;
    } catch (err) {
      return true;  // email/number inputs do not expose a caret position
    }
  }

  function visible(el, r) {
    if (r.width < 6 || r.height < 6) return false;
    if (el.disabled) return false;
    if (el.closest && el.closest('[aria-hidden="true"], [inert]')) return false;
    if (el.checkVisibility) {
      return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    }
    for (var a = el, i = 0; a && a.nodeType === 1 && i < 8; a = a.parentElement, i++) {
      var cs = getComputedStyle(a);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
    }
    return true;
  }

  function cursorOf(el) {
    try { return getComputedStyle(el).cursor; } catch (err) { return ''; }
  }

  function showToast(html, ms) {
    var t = document.getElementById('tv-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tv-toast';
      (document.body || document.documentElement).appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { t.classList.remove('show'); }, ms || 2500);
  }

  // ------------------------------------------------------------------ candidates

  function activeScope() {
    var list = document.querySelectorAll(SCOPES);
    for (var i = list.length - 1; i >= 0; i--) {
      var d = list[i];
      var r = d.getBoundingClientRect();
      if (r.width < 120 || r.height < 80 || !visible(d, r)) continue;
      if (d.querySelector('video')) continue;
      var fixed = false;
      for (var a = d, j = 0; a && a.nodeType === 1 && j < 4; a = a.parentElement, j++) {
        var pos = getComputedStyle(a).position;
        if (pos === 'fixed' || pos === 'sticky') { fixed = true; break; }
      }
      if (fixed || d.getAttribute('aria-modal') === 'true' || d.tagName === 'DIALOG') return d;
    }
    return null;
  }

  function collect(scope) {
    var root = scope || document;
    var vw = innerWidth, vh = innerHeight;
    var out = [];
    var set = new Set();
    var fromPointer = new Set();

    function add(el, viaPointer) {
      if (set.has(el) || el.tagName === 'VIDEO' || el.id === 'tv-toast') return;
      var r = el.getBoundingClientRect();
      if (!visible(el, r)) return;
      // A clickable wrapper as big as the screen (the player surface, a page backdrop) is not a target.
      if (viaPointer && r.width * r.height > vw * vh * 0.4) return;
      set.add(el);
      if (viaPointer) fromPointer.add(el);
      out.push({ el: el, r: r });
    }

    root.querySelectorAll(NATURAL).forEach(function (el) { add(el, false); });
    root.querySelectorAll(POINTER_SCAN).forEach(function (el) {
      if (set.has(el) || cursorOf(el) !== 'pointer') return;
      var p = el.parentElement;
      if (p && cursorOf(p) === 'pointer') return;  // inherited from a clickable ancestor
      add(el, true);
    });

    // Inside a link everything belongs to the link; a pointer-only element inside another target is
    // part of that target (the title on a card), while real buttons inside a clickable panel stay.
    return out.filter(function (c) {
      for (var a = c.el.parentElement, i = 0; a && i < 12; a = a.parentElement, i++) {
        if (!set.has(a)) continue;
        if (a.tagName === 'A' || fromPointer.has(c.el)) return false;
      }
      return true;
    });
  }

  // ------------------------------------------------------------------ focus

  function setFocus(el, scroll) {
    if (focused && focused !== el && focused.classList) focused.classList.remove('tv-focus');
    focused = el;
    if (!el) return;
    if (!isTextInput(el)) {
      var natural = el.matches && el.matches('a[href], button, input, select, textarea, summary');
      if (!natural && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (err) { /* not focusable, the ring still shows */ }
    }
    el.classList.add('tv-focus');
    if (scroll !== false) reveal(el);
  }

  function reveal(el) {
    var r = el.getBoundingClientRect();
    var m = 60;
    if (r.top >= m && r.bottom <= innerHeight - m && r.left >= 0 && r.right <= innerWidth) return;
    try {
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    } catch (err) {
      el.scrollIntoView();
    }
  }

  function clearFocus() {
    if (focused && focused.classList) focused.classList.remove('tv-focus');
    focused = null;
  }

  function startCandidate(cands) {
    var best = null, score = Infinity;
    cands.forEach(function (c) {
      var r = c.r;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
      var s = Math.max(0, r.top) * 2 + Math.max(0, r.left);
      if (s < score) { score = s; best = c.el; }
    });
    return best || (cands[0] && cands[0].el);
  }

  function intervalGap(a1, a2, b1, b2) {
    if (b2 < a1) return a1 - b2;
    if (b1 > a2) return b1 - a2;
    return 0;
  }

  function pick(dir, from, cands) {
    var f = from.getBoundingClientRect();
    var fcx = f.left + f.width / 2, fcy = f.top + f.height / 2;
    var best = null, bestScore = Infinity;
    cands.forEach(function (c) {
      var el = c.el, r = c.r;
      if (el === from || el.contains(from) || from.contains(el)) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var main, cross, slack;
      if (dir === 'right' || dir === 'left') {
        slack = 0.3 * Math.min(f.width, r.width);
        if (dir === 'right' && !(cx > fcx && r.left >= f.right - slack)) return;
        if (dir === 'left' && !(cx < fcx && r.right <= f.left + slack)) return;
        main = dir === 'right' ? Math.max(0, r.left - f.right) : Math.max(0, f.left - r.right);
        cross = intervalGap(f.top, f.bottom, r.top, r.bottom);
        // Left/Right stays on its row: nothing beside you means the end of the row, not a jump downwards.
        if (cross > Math.min(f.height, r.height) * 0.75) return;
        var s1 = main + cross * 4 + Math.abs(cy - fcy) * 0.3;
        if (s1 < bestScore) { bestScore = s1; best = el; }
      } else {
        slack = 0.3 * Math.min(f.height, r.height);
        if (dir === 'down' && !(cy > fcy && r.top >= f.bottom - slack)) return;
        if (dir === 'up' && !(cy < fcy && r.bottom <= f.top + slack)) return;
        main = dir === 'down' ? Math.max(0, r.top - f.bottom) : Math.max(0, f.top - r.bottom);
        cross = intervalGap(f.left, f.right, r.left, r.right);
        var s2 = main + cross * 1.5 + Math.abs(cx - fcx) * 0.2;
        if (s2 < bestScore) { bestScore = s2; best = el; }
      }
    });
    return best;
  }

  function moveFocus(dir) {
    var scope = activeScope();
    var cands = collect(scope);
    if (!cands.length) {
      if (dir === 'up' || dir === 'down') scrollPage(dir);
      return;
    }
    var cur = focused && focused.isConnected && (!scope || scope.contains(focused)) ? focused : null;
    if (cur) {
      var cr = cur.getBoundingClientRect();
      if (cr.bottom < -innerHeight || cr.top > innerHeight * 2) cur = null;  // the page scrolled far away
    }
    if (!cur) {
      setFocus(startCandidate(cands));
      return;
    }
    var next = pick(dir, cur, cands);
    if (next) setFocus(next);
    else if (dir === 'up' || dir === 'down') scrollPage(dir);
  }

  function scrollPage(dir) {
    window.scrollBy({ top: (dir === 'down' ? 1 : -1) * innerHeight * 0.6, behavior: 'smooth' });
  }

  function activate(el) {
    if (isTextInput(el)) {
      el.focus();
      el.click();
      return;
    }
    if (el.tagName === 'SELECT') {
      el.focus();
      if (el.showPicker) { try { el.showPicker(); return; } catch (err) { /* fall through */ } }
    }
    var r = el.getBoundingClientRect();
    var o = { bubbles: true, cancelable: true, view: window, button: 0,
              clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    var p = { pointerId: 1, pointerType: 'mouse', isPrimary: true };
    for (var k in o) p[k] = o[k];
    try { el.dispatchEvent(new PointerEvent('pointerdown', p)); } catch (err) { /* old WebView */ }
    el.dispatchEvent(new MouseEvent('mousedown', o));
    try { el.dispatchEvent(new PointerEvent('pointerup', p)); } catch (err) { /* old WebView */ }
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.click();
  }

  // ------------------------------------------------------------------ player

  function playerVideo() {
    var best = null, area = 0;
    document.querySelectorAll('video').forEach(function (v) {
      var r = v.getBoundingClientRect();
      var w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      var h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      if (w * h > area) { area = w * h; best = v; }
    });
    // Trailers are YouTube iframes and never count; the film player covers a good part of the screen.
    if (!best || area < innerWidth * innerHeight * 0.2) return null;
    watch(best);
    return best;
  }

  function watch(v) {
    if (!watched || watched.has(v)) return;
    watched.add(v);
    var tell = function (on) { if (window.TvBridge) window.TvBridge.setPlaying(on); };
    v.addEventListener('playing', function () { tell(true); });
    v.addEventListener('pause', function () { tell(false); });
    v.addEventListener('ended', function () { tell(false); });
    if (!v.paused) tell(true);
  }

  function playerRoot(v) {
    var el = v;
    for (var i = 0; i < 10 && el.parentElement && el.parentElement !== document.body; i++) {
      el = el.parentElement;
      if (el.querySelectorAll('button, [role="button"]').length >= 3) return el;
    }
    return el;
  }

  // Makes the player show its controls, the way a mouse move does.
  function wake(v) {
    var root = playerRoot(v);
    var r = v.getBoundingClientRect();
    var o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    [v, root].forEach(function (t) {
      try { t.dispatchEvent(new MouseEvent('mousemove', o)); } catch (err) { /* ignore */ }
      try { t.dispatchEvent(new PointerEvent('pointermove', o)); } catch (err) { /* ignore */ }
    });
  }

  function label(el) {
    var cls = el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
    return [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-action'),
            el.getAttribute('data-tooltip'), cls, el.textContent].join(' ').slice(0, 300);
  }

  var CLOSE_RE = /close|закры|выход|exit|✕|×/i;
  var PREV_RE = /prev|предыд|previous|назад/i;
  var NEXT_RE = /next|следующ|далее/i;

  // The phrase buttons: by their label first, then by layout (left and right of the central play button).
  function phraseButton(v, which) {
    var root = playerRoot(v);
    var buttons = [];
    root.querySelectorAll('button, [role="button"]').forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      buttons.push({ el: b, r: r, text: label(b) });
    });
    var re = which === 'next' ? NEXT_RE : PREV_RE;
    for (var i = 0; i < buttons.length; i++) {
      if (re.test(buttons[i].text) && !CLOSE_RE.test(buttons[i].text)) return buttons[i].el;
    }
    var rr = root.getBoundingClientRect();
    var midX = rr.left + rr.width / 2;
    var bottom = buttons.filter(function (b) { return b.r.top > rr.top + rr.height * 0.6; });
    var play = null, d = Infinity;
    bottom.forEach(function (b) {
      var dx = Math.abs(b.r.left + b.r.width / 2 - midX);
      if (dx < d && dx < rr.width * 0.12) { d = dx; play = b; }
    });
    if (!play) return null;
    var pcy = play.r.top + play.r.height / 2, pcx = play.r.left + play.r.width / 2;
    var side = null, sd = Infinity;
    bottom.forEach(function (b) {
      if (b === play) return;
      var cy = b.r.top + b.r.height / 2, cx = b.r.left + b.r.width / 2;
      if (Math.abs(cy - pcy) > play.r.height) return;
      var dx = which === 'next' ? cx - pcx : pcx - cx;
      if (dx > 0 && dx < sd && dx < rr.width * 0.15) { sd = dx; side = b; }
    });
    return side ? side.el : null;
  }

  function seek(v, seconds) {
    var t = Math.max(0, (v.currentTime || 0) + seconds);
    if (isFinite(v.duration)) t = Math.min(t, v.duration - 1);
    v.currentTime = t;
    showToast((seconds > 0 ? '+' : '−') + Math.abs(seconds) + ' с', 900);
  }

  function phrase(v, which) {
    wake(v);
    setTimeout(function () {
      var b = phraseButton(v, which);
      if (b) activate(b);
      else seek(v, which === 'next' ? SEEK_SECONDS : -SEEK_SECONDS);
    }, 60);
  }

  function togglePlay(v) {
    wake(v);
    if (v.paused) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* the site's own button will do */ });
    } else {
      v.pause();
    }
  }

  function skipButton(v) {
    var found = null;
    playerRoot(v).querySelectorAll('button, [role="button"], div, span').forEach(function (el) {
      if (found || el.children.length > 3) return;
      if (/пропустить|skip/i.test(el.textContent || '') && visible(el, el.getBoundingClientRect())) found = el;
    });
    return found;
  }

  function enterMenu(v) {
    menuMode = true;
    wake(v);
    setTimeout(function () {
      var cands = collect(null);
      var vr = v.getBoundingClientRect();
      var target = null, d = Infinity;
      cands.forEach(function (c) {  // the control nearest the bottom centre of the picture
        var dx = c.r.left + c.r.width / 2 - (vr.left + vr.width / 2);
        var dy = c.r.top + c.r.height / 2 - vr.bottom;
        var dist = Math.abs(dx) + Math.abs(dy) * 2;
        if (dist < d) { d = dist; target = c.el; }
      });
      if (target) setFocus(target, false);
    }, 60);
    armMenuTimer(v);
  }

  function leaveMenu() {
    menuMode = false;
    clearTimeout(menuTimer);
    clearFocus();
  }

  function armMenuTimer(v) {
    clearTimeout(menuTimer);
    menuTimer = setTimeout(function () {
      if (menuMode && v && !v.paused && !isTextInput(document.activeElement)) leaveMenu();
    }, MENU_IDLE_MS);
  }

  function playerKey(v, dir, isEnter) {
    if (hintShownFor !== v) {
      hintShownFor = v;
      showToast('<b>OK</b> пауза · <b>← →</b> реплики · <b>↑ ↓</b> меню и диалоги · <b>Назад</b> выход', 4000);
    }
    if (isEnter) { togglePlay(v); return; }
    if (dir === 'left') { phrase(v, 'previous'); return; }
    if (dir === 'right') { phrase(v, 'next'); return; }
    if (dir === 'down') {
      var skip = skipButton(v);
      if (skip) { activate(skip); return; }
    }
    enterMenu(v);
  }

  // ------------------------------------------------------------------ keys

  function onKeyDown(e) {
    var dir = DIRS[e.key];
    var isEnter = e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23;
    if (!dir && !isEnter) return;

    var ae = document.activeElement;
    if (isTextInput(ae)) {
      if (isEnter) return;  // submit the form, or open the keyboard
      if ((dir === 'left' || dir === 'right') && !caretAtEdge(ae, dir)) return;
      ae.blur();
    }

    var v = playerVideo();
    if (!v && menuMode) leaveMenu();

    handled[e.key] = true;
    stop(e);

    if (v && !menuMode) {
      playerKey(v, dir, isEnter);
      return;
    }
    if (v) armMenuTimer(v);

    if (isEnter) {
      if (focused && focused.isConnected) activate(focused);
      else moveFocus('down');
      return;
    }
    moveFocus(dir);
  }

  function onKeyUp(e) {
    if (handled[e.key]) {
      delete handled[e.key];
      stop(e);
    }
  }

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);

  // A dialog that opens (sign-in) takes the focus, so the remote does not stay on the page behind it.
  var lastScope = null, scopeCheck = 0;
  new MutationObserver(function () {
    if (scopeCheck) return;
    scopeCheck = setTimeout(function () {
      scopeCheck = 0;
      var scope = activeScope();
      if (scope && scope !== lastScope && (!focused || !scope.contains(focused))) {
        var cands = collect(scope);
        if (cands.length) setFocus(startCandidate(cands));
      }
      lastScope = scope;
      if (focused && !focused.isConnected) focused = null;
    }, 250);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true,
                                           attributeFilter: ['class', 'style', 'open', 'hidden', 'aria-hidden'] });

  // ------------------------------------------------------------------ called from MainActivity

  window.__tv = {
    back: function () {
      var v = playerVideo();
      if (v && menuMode) { leaveMenu(); return true; }
      if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen(); return true; }
      var scope = activeScope();
      if (scope) {
        var close = null;
        scope.querySelectorAll('button, [role="button"], [aria-label], [class*="close" i]').forEach(function (b) {
          if (!close && CLOSE_RE.test(label(b))) close = b;
        });
        if (close) { activate(close); return true; }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
        return true;
      }
      if (v) {
        var root = playerRoot(v);
        var x = null;
        root.querySelectorAll('button, [role="button"], [aria-label], [class*="close" i]').forEach(function (b) {
          if (!x && CLOSE_RE.test(label(b))) x = b;
        });
        if (x) { activate(x); clearFocus(); return true; }
      }
      clearFocus();
      return false;
    },
    media: function (cmd) {
      var v = playerVideo() || document.querySelector('video');
      if (!v) return;
      if (cmd === 'playpause') togglePlay(v);
      else if (cmd === 'play') { if (v.paused) togglePlay(v); }
      else if (cmd === 'pause') { if (!v.paused) togglePlay(v); }
      else if (cmd === 'forward') seek(v, MEDIA_SEEK_SECONDS);
      else if (cmd === 'rewind') seek(v, -MEDIA_SEEK_SECONDS);
      else if (cmd === 'next') phrase(v, 'next');
      else if (cmd === 'previous') phrase(v, 'previous');
    },
    refresh: function () { applyViewport(); applyCss(); }
  };
})();
