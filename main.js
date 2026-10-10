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
