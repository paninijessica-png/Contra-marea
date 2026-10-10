/* Contramarea — Guardado local (localStorage) y progreso del jugador. */
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var KEY = 'contramarea.save.v1';

  var DEFAULTS = {
    v: 1,
    progress: { unlocked: 1, stars: {}, bestScores: {} },
    gems: 120,
    noAds: false,
    owned: {},
    endlessBest: 0,
    settings: { sound: true, lang: 'es' },
    consent: { decided: false, personalised: false, date: null },
    stats: { levelsWon: 0, totalMerges: 0, totalTideRises: 0, gamesPlayed: 0, interstitialsShown: 0, rewardedWatched: 0, lastInterstitialAt: 0 }
  };

  function deepMerge(base, patch) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!patch || typeof patch !== 'object') { return out; }
    Object.keys(patch).forEach(function (k) {
      if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && base && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k], patch[k]);
      } else {
        out[k] = patch[k];
      }
    });
    return out;
  }

  var cache = null;
  var available = true;

  function load() {
    if (cache) { return cache; }
    try {
      var raw = window.localStorage.getItem(KEY);
      cache = raw ? deepMerge(DEFAULTS, JSON.parse(raw)) : deepMerge(DEFAULTS, {});
    } catch (e) {
      available = false;
      cache = deepMerge(DEFAULTS, {});
    }
    return cache;
  }

  function flush() {
    if (!available || !cache) { return false; }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
      return true;
    } catch (e) {
      available = false;
      return false;
    }
  }

  var Save = {
    get: function () { return load(); },
    set: function (patch) { cache = deepMerge(load(), patch); flush(); return cache; },
    save: flush,
    reset: function () {
      cache = deepMerge(DEFAULTS, {});
      flush();
      return cache;
    },
    isAvailable: function () { return available; },

    /* --- Progreso --- */
    levelStars: function (levelId) { return load().progress.stars[levelId] || 0; },
    isUnlocked: function (levelId) { return levelId <= load().progress.unlocked; },
    completeLevel: function (levelId, stars, score) {
      var s = load();
      s.progress.stars[levelId] = Math.max(s.progress.stars[levelId] || 0, stars);
      s.progress.bestScores[levelId] = Math.max(s.progress.bestScores[levelId] || 0, score);
      s.progress.unlocked = Math.max(s.progress.unlocked, levelId + 1);
      s.stats.levelsWon++;
      flush();
      return s;
    },
    totalStars: function () {
      var st = load().progress.stars, n = 0;
      Object.keys(st).forEach(function (k) { n += st[k]; });
      return n;
    },

    /* --- Gemas --- */
    addGems: function (n) { var s = load(); s.gems = Math.max(0, s.gems + n); flush(); return s.gems; },
    spendGems: function (n) {
      var s = load();
      if (s.gems < n) { return false; }
      s.gems -= n; flush(); return true;
    },

    /* --- Partida en curso --- */
    saveRun: function (serialized) {
      var s = load(); s.run = serialized; flush();
    },
    loadRun: function () { return load().run || null; },
    clearRun: function () { var s = load(); s.run = null; flush(); },

    /* --- Estadísticas --- */
    bump: function (field, n) {
      var s = load();
      s.stats[field] = (s.stats[field] || 0) + (n == null ? 1 : n);
      flush();
      return s.stats[field];
    }
  };

  M.Save = Save;
})(window.MAREA);
