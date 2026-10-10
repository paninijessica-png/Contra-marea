/* ============================================================================
 * Contramarea — Interfaz: pantallas, HUD, tienda, entrada de usuario.
 * ==========================================================================*/
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var C = M.CONFIG;
  var P = C.palette;
  var H = {};        // handlers
  var currentScreen = 'menu';
  var anchorMode = false;

  function el(id) { return document.getElementById(id); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var SCREENS = ['menu', 'levels', 'shop', 'settings', 'result', 'pause', 'consent', 'rotate'];

  function show(name) {
    SCREENS.forEach(function (s) {
      var node = el('screen-' + s);
      if (node) { node.classList.toggle('active', s === name); }
    });
    currentScreen = name;
  }
  function hideAll() { SCREENS.forEach(function (s) { var n = el('screen-' + s); if (n) { n.classList.remove('active'); } }); }
  function screen() { return currentScreen; }

  /* --- Textos --- */
  function applyLang() {
    var lang = M.Save.get().settings.lang || 'es';
    document.documentElement.lang = lang;
    qsa('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      var val = M.t(key, lang);
      if (val) { node.textContent = val; }
    });
    el('game-title').textContent = C.title[lang] || C.title.es;
    el('game-tagline').textContent = C.tagline[lang] || C.tagline.es;
    el('ver').textContent = C.version;
    el('pkg').textContent = C.packageId;
    el('credits-owner').textContent = '© 2025 ' + C.owner;
    el('opt-lang').value = lang;
    el('opt-sound').checked = !!M.Save.get().settings.sound;
    renderLevels();
    renderShop();
  }

  /* --- HUD --- */
  function updateHUD(game) {
    if (!game) { return; }
    el('hud-score').textContent = game.score;
    el('hud-moves').textContent = game.endless ? '∞' : Math.max(0, game.level.moves - game.movesUsed);
    el('hud-tide').textContent = game.tide + '/' + game.tideMax;
    el('hud-objective').textContent = game.endless
      ? M.t('endless')
      : M.t('objective') + ': ' + M.objectiveText(game.level.objective);
    el('hud-gems').textContent = M.Save.get().gems;
    el('hud').classList.toggle('hidden', currentScreen !== 'game');
    el('controls').classList.toggle('hidden', currentScreen !== 'game');
    renderBasket(game);
  }

  function renderBasket(game) {
    var box = el('basket');
    if (!game) { box.innerHTML = ''; return; }
    var html = '';
    for (var i = 0; i < game.basketMax; i++) {
      var b = game.basket[i];
      html += '<div class="basket-slot' + (b ? ' filled' : '') + '" data-basket="' + i + '">' +
        (b ? '<span style="font-size:11px;font-weight:800;color:' + M.tierInfo(b.tier).glow + '">' + M.tierInfo(b.tier)[M.Save.get().settings.lang === 'en' ? 'en' : 'es'] + '</span>' : '') +
        '</div>';
    }
    box.innerHTML = html;
    qsa('#basket .basket-slot').forEach(function (node) {
      node.onclick = function () { if (H.onBasketTap) { H.onBasketTap(parseInt(node.getAttribute('data-basket'), 10)); } };
    });
  }

  /* --- Niveles --- */
  function renderLevels() {
    var grid = el('levels-grid');
    var unlocked = M.Save.get().progress.unlocked;
    var html = '';
    for (var i = 0; i < M.LEVELS.length; i++) {
      var L = M.LEVELS[i];
      var isUnlocked = L.id <= unlocked;
      var stars = M.Save.levelStars(L.id);
      var starStr = '';
      for (var s = 0; s < 3; s++) { starStr += (s < stars ? '★' : '☆'); }
      html += '<button class="level-btn' + (isUnlocked ? '' : ' locked') + (stars ? ' cleared' : '') + '" data-level="' + i + '"' + (isUnlocked ? '' : ' disabled') + '>' +
        '<span>' + L.id + '</span>' +
        (isUnlocked ? '<span class="lvl-stars">' + starStr + '</span>' : '<span class="lvl-stars">🔒</span>') +
        '</button>';
    }
    grid.innerHTML = html;
    el('stars-total').textContent = M.Save.totalStars();
    qsa('#levels-grid .level-btn').forEach(function (node) {
      node.onclick = function () {
        if (node.disabled) { return; }
        if (H.onLevelPick) { H.onLevelPick(parseInt(node.getAttribute('data-level'), 10)); }
      };
    });
  }

  /* --- Tienda --- */
  function renderShop() {
    var lang = M.Save.get().settings.lang || 'es';
    var owned = M.Save.get().owned;

    el('shop-powers').innerHTML = C.powers.map(function (p) {
      return '<div class="shop-item">' +
        '<div class="si-ico">' + (p.icon === 'wave' ? '≈' : p.icon === 'moon' ? '☾' : '⚓') + '</div>' +
        '<div class="si-main"><div class="si-title">' + p.title[lang] + '</div>' +
        '<div class="si-desc">' + p.desc[lang] + '</div></div>' +
        '<button class="si-buy" data-power-buy="' + p.id + '">' + p.cost + ' ◆</button>' +
        '</div>';
    }).join('');

    el('shop-iap').innerHTML = C.iap.map(function (p) {
      var isOwned = p.type === 'non_consumable' && owned[p.id];
      return '<div class="shop-item">' +
        '<div class="si-ico">' + (p.gems ? '◆' : '🚫') + '</div>' +
        '<div class="si-main"><div class="si-title">' + p.title[lang] + '</div>' +
        '<div class="si-desc">' + p.desc[lang] + (p.gems ? ' (+' + p.gems + ' ◆)' : '') + '</div></div>' +
        '<button class="si-buy' + (isOwned ? ' owned' : '') + '" data-iap="' + p.id + '"' + (isOwned ? ' disabled' : '') + '>' +
        (isOwned ? '✔' : p.price) + '</button>' +
        '</div>';
    }).join('');

    el('shop-gems').textContent = M.Save.get().gems;

    qsa('#shop-powers [data-power-buy]').forEach(function (node) {
      node.onclick = function () { if (H.onBuyPower) { H.onBuyPower(node.getAttribute('data-power-buy')); } };
    });
    qsa('#shop-iap [data-iap]').forEach(function (node) {
      node.onclick = function () { if (node.disabled) { return; } if (H.onBuyIap) { H.onBuyIap(node.getAttribute('data-iap')); } };
    });
  }

  function refreshGems() {
    el('hud-gems').textContent = M.Save.get().gems;
    el('shop-gems').textContent = M.Save.get().gems;
  }

  /* --- Resultado --- */
  function showResult(opts) {
    el('result-title').textContent = opts.title;
    el('result-stars').textContent = opts.stars != null ? '★★★'.slice(0, opts.stars) + '☆☆☆'.slice(0, 3 - opts.stars) : '';
    el('result-body').textContent = opts.body || '';
    el('btn-result-next').classList.toggle('hidden', !opts.canNext);
    el('btn-result-retry').classList.toggle('hidden', !!opts.hideRetry);
    el('btn-result-revive').classList.toggle('hidden', !opts.canRevive);
    show('result');
  }

  /* --- Toast --- */
  var toastTimer = null;
  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* --- Entrada --- */
  function bindInput(target, onSwipe, onTap) {
    var sx = 0, sy = 0, st = 0, active = false, moved = false;
    var THRESHOLD = 22;

    function down(e) {
      var p = e.touches ? e.touches[0] : e;
      sx = p.clientX; sy = p.clientY; st = Date.now(); active = true; moved = false;
      M.Audio.unlock();
    }
    function move(e) {
      if (!active || moved) { return; }
      var p = e.touches ? e.touches[0] : e;
      var dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) { return; }
      moved = true;
      if (Math.abs(dx) > Math.abs(dy)) { onSwipe(dx > 0 ? 'right' : 'left'); }
      else { onSwipe(dy > 0 ? 'down' : 'up'); }
      if (e.cancelable) { e.preventDefault(); }
    }
    function up(e) {
      if (!active) { return; }
      active = false;
      if (!moved && Date.now() - st < 400) {
        var p = (e.changedTouches && e.changedTouches[0]) || e;
        onTap(p.clientX, p.clientY);
      }
    }
    target.addEventListener('touchstart', down, { passive: true });
    target.addEventListener('touchmove', move, { passive: false });
    target.addEventListener('touchend', up, { passive: true });
    target.addEventListener('mousedown', down);
    target.addEventListener('mousemove', move);
    target.addEventListener('mouseup', up);
    target.addEventListener('mouseleave', function () { active = false; });

    document.addEventListener('keydown', function (e) {
      var map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
      if (map[e.key]) { onSwipe(map[e.key]); e.preventDefault(); }
    });
  }

  /* --- Inicialización --- */
  function init(handlers) {
    H = handlers || {};

    el('btn-play').onclick = function () { if (H.onPlay) { H.onPlay(); } };
    el('btn-endless').onclick = function () { if (H.onEndless) { H.onEndless(); } };
    el('btn-install').onclick = function () { if (H.onInstall) { H.onInstall(); } };
    el('btn-levels').onclick = function () { renderLevels(); show('levels'); };
    el('btn-shop').onclick = function () { renderShop(); show('shop'); };
    el('btn-settings').onclick = function () { show('settings'); };
    qsa('.icon-btn.back').forEach(function (b) { b.onclick = function () { show('menu'); }; });

    el('btn-pause').onclick = function () { if (H.onPause) { H.onPause(); } };
    el('btn-resume').onclick = function () { if (H.onResume) { H.onResume(); } };
    el('btn-pause-retry').onclick = function () { if (H.onRetry) { H.onRetry(); } };
    el('btn-pause-menu').onclick = function () { if (H.onMenu) { H.onMenu(); } };

    el('btn-result-next').onclick = function () { if (H.onNext) { H.onNext(); } };
    el('btn-result-retry').onclick = function () { if (H.onRetry) { H.onRetry(); } };
    el('btn-result-menu').onclick = function () { if (H.onMenu) { H.onMenu(); } };
    el('btn-result-revive').onclick = function () { if (H.onRevive) { H.onRevive(); } };

    el('btn-consent-accept').onclick = function () { if (H.onConsent) { H.onConsent(true); } };
    el('btn-consent-reject').onclick = function () { if (H.onConsent) { H.onConsent(false); } };

    el('btn-restore').onclick = function () { if (H.onRestore) { H.onRestore(); } };
    el('btn-reset').onclick = function () {
      if (window.confirm(M.t('confirmReset'))) { if (H.onReset) { H.onReset(); } }
    };
    el('btn-privacy').onclick = function () { if (H.onPrivacy) { H.onPrivacy(); } };

    el('opt-sound').onchange = function (e) { if (H.onSound) { H.onSound(e.target.checked); } };
    el('opt-lang').onchange = function (e) { if (H.onLang) { H.onLang(e.target.value); } };

    qsa('.power-btn').forEach(function (b) {
      b.onclick = function () { if (H.onPower) { H.onPower(b.getAttribute('data-power')); } };
    });

    applyLang();
  }

  M.UI = {
    el: el, init: init, show: show, hideAll: hideAll, screen: screen,
    applyLang: applyLang, updateHUD: updateHUD, renderLevels: renderLevels,
    renderShop: renderShop, refreshGems: refreshGems, showResult: showResult,
    toast: toast, bindInput: bindInput,
    setAnchorMode: function (v) { anchorMode = v; },
    isAnchorMode: function () { return anchorMode; },
    /* Muestra u oculta el botón de instalación de la PWA (solo aparece si el
     * navegador ofrece instalarla, es decir, si cumple los requisitos). */
    showInstall: function (on) {
      var b = el('btn-install');
      if (b) { b.classList.toggle('hidden', !on); }
    },
    setPowersEnabled: function (v) {
      qsa('.power-btn').forEach(function (b) { b.disabled = !v; });
    }
  };
})(window.MAREA);
