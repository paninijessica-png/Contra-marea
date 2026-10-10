window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var C = M.CONFIG;
  var game = null;
  var renderer = null;
  var selectedBasket = -1;
  var runIndex = 0;
  var installPrompt = null;

  function boot() {
    renderer = new M.Renderer(document.getElementById('board'));

    window.addEventListener('resize', function () {
      renderer.resize();
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { renderer.resize(); }, 250);
    });

    M.Audio.init(M.Save.get().settings.sound);

    M.UI.init({
      onPlay: function () {
        startLevel(M.Save.get().progress.unlocked - 1);
      },
      onEndless: startEndless,
      onLevelPick: startLevel,
      onPause: pause,
      onResume: resume,
      onRetry: function () {
        if (runIndex < 0) { startEndless(); }
        else { startLevel(runIndex); }
      },
      onNext: function () {
        startLevel(Math.min(M.LEVELS.length - 1, runIndex + 1));
      },
      onMenu: toMenu,
      onRevive: revive,
      onConsent: setConsent,
      onRestore: restorePurchases,
      onReset: function () {
        M.Save.reset();
        M.UI.applyLang();
        M.UI.renderLevels();
        M.UI.refreshGems();
        M.UI.toast('OK');
      },
      onPrivacy: function () {
        window.open('privacy.html', '_blank');
      },
      onSound: function (on) {
        M.Save.set({
          settings: Object.assign({}, M.Save.get().settings, {
            sound: on
          })
        });
        M.Audio.setEnabled(on);
      },
      onLang: function (lang) {
        M.Save.set({
          settings: Object.assign({}, M.Save.get().settings, {
            lang: lang
          })
        });
        M.UI.applyLang();
      },
      onPower: usePower,
      onBuyPower: buyPower,
      onBuyIap: buyIap,
      onBasketTap: tapBasket,
      onInstall: function () {
        if (!installPrompt) {
          M.UI.showInstall(false);
          return;
        }
        installPrompt.prompt();
        installPrompt.userChoice.then(function (choice) {
          installPrompt = null;
          M.UI.showInstall(false);
          if (choice && choice.outcome === 'accepted') {
            M.UI.toast(M.t('installed'));
          }
        });
      }
    });

    M.UI.bindInput(
      document.getElementById('board'),
      handleSwipe,
      handleTap
    );

    M.Monetization.init({ network: 'admob' }).then(function (info) {
      if (info && info.adsAllowed) {
        M.Monetization.ads.preload('rewarded');
      }
    });

    var isNativeApp = !!(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    );

    if (!isNativeApp && location.protocol.indexOf('http') === 0) {
      var mf = document.createElement('link');
      mf.rel = 'manifest';
      mf.href = 'manifest.webmanifest';
      document.head.appendChild(mf);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      }
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      installPrompt = e;
      M.UI.showInstall(true);
    });

    window.addEventListener('appinstalled', function () {
      installPrompt = null;
      M.UI.showInstall(false);
    });

    if (M.Monetization.isNative) {
      M.UI.show('menu');
      M.UI.renderLevels();
    } else if (!M.Save.get().consent.decided) {
      M.UI.show('consent');
    } else {
      M.UI.show('menu');
      M.UI.renderLevels();
    }

    window.__MAREA_DEBUG = {
      getGame: function () { return game; },
      startLevel: startLevel,
      startEndless: startEndless,
      getRunIndex: function () { return runIndex; },
      version: C.version
    };

    loop();
  }

  function setConsent(personalised) {
    M.Monetization.consent.set(personalised);
    M.UI.show('menu');
    M.UI.renderLevels();
    M.UI.refreshGems();
    M.Monetization.ads.preload('rewarded');
  }

  function loop(now) {
    renderer.render(now || 0);
    requestAnimationFrame(loop);
  }

  function startLevel(index) {
    runIndex = index;
    game = M.Engine.createGame({ levelIndex: index });
    M.Save.bump('gamesPlayed');
    renderer.setGame(game);
    M.UI.setAnchorMode(false);
    selectedBasket = -1;
    M.UI.show('game');
    M.UI.setPowersEnabled(true);
    M.UI.updateHUD(game);
    M.Audio.startAmbient();
  }

  function startEndless() {
    runIndex = -1;
    game = M.Engine.createGame({ endless: true });
    renderer.setGame(game);
    M.UI.setAnchorMode(false);
    selectedBasket = -1;
    M.UI.show('game');
    M.UI.setPowersEnabled(true);
    M.UI.updateHUD(game);
    M.Audio.startAmbient();
  }

  function toMenu() {
    game = null;
    M.UI.setAnchorMode(false);
    M.Audio.stopAmbient();
    M.UI.show('menu');
    M.UI.renderLevels();
    M.UI.refreshGems();
    M.Monetization.ads.hideBanner();
  }

  function pause() {
    if (!game || game.status !== 'playing') { return; }
    M.UI.show('pause');
  }

  function resume() {
    if (!game) {
      toMenu();
      return;
    }
    M.UI.show('game');
  }

  function handleSwipe(dir) {
    if (!game || game.status !== 'playing') { return; }
    if (M.UI.screen() !== 'game') { return; }
    if (M.UI.isAnchorMode()) { return; }

    var res = M.Engine.move(game, dir);
    if (!res.ok) {
      M.Audio.error();
      return;
    }

    var ev = res.event;
    renderer.applyMove(ev, game);
    M.Audio.slide();

    if (ev.merges > 0) {
      M.Audio.merge(ev.merges);
      ev.movements.forEach(function (mv) {
        if (mv.fresh) {
          renderer.addPopup(
            mv.to.r,
            mv.to.c,
            '+' + (10 * mv.tier * ev.merges),
            C.palette.gold
          );
        }
      });
      if (ev.merges >= 3) {
        M.UI.toast('¡Combo x' + ev.merges + '!');
      }
    }

    if (ev.rose) { M.Audio.tide(); }

    M.Save.bump('totalMerges', ev.merges);
    if (ev.rose) { M.Save.bump('totalTideRises'); }
    M.UI.updateHUD(game);

    if (game.status === 'won') { onWin(); }
    else if (game.status === 'lost') { onLose(); }
  }

  function handleTap(clientX, clientY) {
    if (!game || game.status !== 'playing') { return; }
    if (M.UI.screen() !== 'game') { return; }

    var rect = document.getElementById('board').getBoundingClientRect();
    var m = renderer.metrics;
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var c = Math.floor((x - m.boardX) / m.cell);
    var r = Math.floor((y - m.boardY) / m.cell);

    if (r < 0 || r >= M.ROWS || c < 0 || c >= M.COLS) { return; }

    if (selectedBasket >= 0) {
      var drop = M.Engine.fromBasket(game, selectedBasket, r, c);
      if (drop.ok) {
        M.Audio.coin();
        selectedBasket = -1;
        renderer.setGame(game);
        M.UI.updateHUD(game);
      } else {
        M.Audio.error();
      }
      return;
    }

    if (M.UI.isAnchorMode()) {
      var take = M.Engine.toBasket(game, r, c);
      if (take.ok) {
        M.Audio.coin();
        M.UI.setAnchorMode(false);
        renderer.setGame(game);
        M.UI.updateHUD(game);
      } else {
        M.Audio.error();
        M.UI.toast('Ancla llena');
      }
    }
  }

  function tapBasket(i) {
    if (!game || game.status !== 'playing') { return; }
    if (!game.basket[i]) { return; }
    selectedBasket = selectedBasket === i ? -1 : i;
    M.UI.toast(
      selectedBasket >= 0 ? 'Toca una celda vacía para soltar' : ''
    );
  }

  function usePower(id) {
    if (!game || game.status !== 'playing') { return; }

    var power = C.powers.filter(function (p) {
      return p.id === id;
    })[0];
    if (!power) { return; }

    if (id === 'anchor') {
      if (game.basket.length >= game.basketMax) {
        M.UI.toast('Ancla llena');
        M.Audio.error();
        return;
      }
      if (!M.Save.spendGems(power.cost)) {
        M.UI.toast(M.t('notEnoughGems'));
        M.Audio.error();
        return;
      }
      M.UI.setAnchorMode(true);
      M.UI.toast('Toca una pieza para guardarla');
      M.UI.refreshGems();
      return;
    }

    if (!M.Save.spendGems(power.cost)) {
      M.UI.toast(M.t('notEnoughGems'));
      M.Audio.error();
      return;
    }

    var res = M.Engine.applyPower(game, id);
    if (res.ok) {
      M.Audio.coin();
      M.UI.refreshGems();
      renderer.setGame(game);
      M.UI.updateHUD(game);
      if (game.status === 'won') { onWin(); }
      else if (game.status === 'lost') { onLose(); }
    } else {
      M.Audio.error();
    }
  }

  function buyPower(id) {
    var power = C.powers.filter(function (p) {
      return p.id === id;
    })[0];
    if (!power) { return; }

    if (M.Save.spendGems(power.cost)) {
      M.Audio.coin();
      M.UI.refreshGems();
      M.UI.toast('Poder comprado');
    } else {
      M.Audio.error();
      M.UI.toast(M.t('notEnoughGems'));
    }
  }

  function computeStars() {
    if (game.endless) { return 0; }
    var left = game.level.moves - game.movesUsed;
    var ratio = left / game.level.moves;
    if (ratio >= 0.40) { return 3; }
    if (ratio >= 0.15) { return 2; }
    return 1;
  }

  function onWin() {
    M.Audio.win();
    var stars = computeStars();

    if (game.endless) {
      var best = Math.max(M.Save.get().endlessBest, game.score);
      M.Save.set({ endlessBest: best });
      M.UI.showResult({
        title: M.t('endlessOver'),
        stars: null,
        body: M.t('score') + ': ' + game.score +
          ' · ' + M.t('bestScore') + ': ' + best,
        canNext: false,
        hideRetry: false,
        canRevive: false
      });
      return;
    }

    M.Save.completeLevel(game.level.id, stars, game.score);
    M.UI.renderLevels();
    M.Monetization.ads.onLevelCompleted(function () {});
    M.UI.showResult({
      title: M.t('levelComplete'),
      stars: stars,
      body: M.t('score') + ': ' + game.score +
        ' · ' + M.t('movesLeft') + ': ' +
        (game.level.moves - game.movesUsed),
      canNext: runIndex + 1 < M.LEVELS.length,
      hideRetry: false,
      canRevive: false
    });
  }

  function onLose() {
    M.Audio.lose();

    if (game.endless) {
      var best = Math.max(M.Save.get().endlessBest, game.score);
      M.Save.set({ endlessBest: best });
      M.UI.showResult({
        title: M.t('endlessOver'),
        stars: null,
        body: M.t('score') + ': ' + game.score +
          ' · ' + M.t('bestScore') + ': ' + best,
        canNext: false,
        hideRetry: false,
        canRevive: true
      });
      return;
    }

    var reasonKey = game.reason === 'flooded' ? 'flooded' :
      (game.reason === 'stuck' ? 'stuck' : 'outOfMoves');

    M.UI.showResult({
      title: M.t(reasonKey),
      stars: null,
      body: M.t('score') + ': ' + game.score +
        ' · ' + M.t('objective') + ': ' +
        M.objectiveText(game.level.objective),
      canNext: false,
      hideRetry: false,
      canRevive: true
    });
  }

  function revive() {
    if (!game) { return; }

    M.Monetization.ads.showRewarded(function (res) {
      if (!res.ok || !res.rewarded) {
        M.UI.toast(M.t('adNotReady'));
        return;
      }
      for (var c = 0; c < M.COLS; c++) {
        game.grid[0][c] = null;
      }
      game.tide = 0;
      game.status = 'playing';
      game.reason = null;

      if (!game.endless) {
        game.level = Object.assign({}, game.level, {
          moves: game.movesUsed + 5
        });
      }

      renderer.setGame(game);
      M.UI.show('game');
      M.UI.updateHUD(game);
      M.UI.toast(M.t('thanks'));
    });
  }

  function buyIap(id) {
    M.Monetization.iap.purchase(id, function (res) {
      if (res.ok) {
        M.Audio.coin();
        M.UI.refreshGems();
        M.UI.renderShop();

        var p = M.Monetization.iap.find(id);
        M.UI.toast(
          p && p.gems ? M.t('gemsAdded') + ' +' + p.gems :
          M.t('thanks')
        );

        if (M.Save.get().noAds) {
          M.Monetization.ads.hideBanner();
        }
      } else {
        M.Audio.error();
        M.UI.toast(M.t('adNotReady'));
      }
    });
  }

  function restorePurchases() {
    M.Monetization.iap.restore(function (res) {
      M.UI.refreshGems();
      M.UI.renderShop();
      M.UI.toast(
        res && res.ok ? M.t('thanks') : M.t('adNotReady')
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.MAREA);
