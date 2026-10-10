/* ============================================================================
 * Contramarea — Capa de monetización aislada.
 *
 * Reglas de cumplimiento que implementa esta capa:
 *  - Ningún anuncio se carga antes de que el usuario decida el consentimiento
 *    (GDPR / UMP en la UE) — ver CONFIG.ads.requireConsentBeforeAds.
 *  - En nativo el consentimiento lo gestiona el formulario oficial de Google
 *    (UMP): requestConsentInfo → showConsentForm → initialize. Solo se piden
 *    anuncios cuando canRequestAds === true.
 *  - En modo prueba se usan SIEMPRE unidades de prueba (nunca clics reales).
 *  - El banner solo se muestra en menús; nunca durante el juego.
 *  - Los intersticiales respetan un mínimo de tiempo y un contador de niveles.
 *  - El rewarded es siempre opt-in, nunca obligatorio, y se entrega UNA vez.
 *  - Si el usuario rechaza la personalización se piden anuncios no
 *    personalizados (npa = true).
 *  - Los IDs reales nunca se hardcodean: vienen de CONFIG / config remota.
 *
 * Plataforma web: adaptador stub que simula el flujo (útil para QA y para la
 * versión navegador). Plataforma nativa (Capacitor): puente real contra
 * @capacitor-community/admob v8. Ver docs/MONETIZACION.md para el cableado.
 * ==========================================================================*/
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var C = M.CONFIG;
  var levelCounter = 0;
  var initialized = false;
  var currentNetwork = 'admob';
  var bridge = null;
  var overlay = null;

  /* ==========================================================================
   * 1. Entorno nativo y resolución del plugin AdMob
   * ========================================================================*/

  function detectNative() {
    var cap = window.Capacitor;
    if (cap && cap.Plugins) { return cap.Plugins; }
    if (window.cordova && window.cordova.plugins) { return window.cordova.plugins; }
    return null;
  }

  /* Devuelve el plugin AdMob o null.
   * El juego no usa bundler: en Capacitor el runtime nativo expone los plugins
   * ya registrados en window.Capacitor.Plugins, así que no hace falta importar
   * el paquete a mano. Si no hay plugin, el juego funciona sin anuncios. */
  function resolveAdMob() {
    var plugins = detectNative();
    if (!plugins) { return null; }
    return plugins.AdMob || plugins.AdMobPlugin || null;
  }

  /* ==========================================================================
   * 2. Puente AdMob real (@capacitor-community/admob v8)
   *
   * Orden obligatorio (GDPR/UMP + políticas de tienda):
   *   1) requestConsentInfo()   — en cada arranque
   *   2) showConsentForm()      — solo si status === 'REQUIRED' y hay formulario
   *   3) initialize()           — solo cuando canRequestAds === true
   *   4) cargar anuncios
   * Si canRequestAds es false NUNCA se pide un anuncio.
   * ========================================================================*/
  var AdMobBridge = {
    plugin: null,
    ready: false,               // SDK inicializado y con permiso para pedir ads
    canRequestAds: false,       // única señal válida de consentimiento
    consentStatus: 'UNKNOWN',
    privacyOptionsRequired: false,
    lastError: null,
    _retries: 0,
    _retryTimer: null,

    /* Resuelve el plugin y ejecuta el flujo completo de consentimiento. */
    bootstrap: function (done) {
      var self = this;
      this.plugin = resolveAdMob();
      if (!this.plugin) {
        done({ ok: false, adsAllowed: false, reason: 'no-plugin' });
        return;
      }
      this.runConsentFlow(done);
    },

    runConsentFlow: function (done) {
      var self = this;
      var P = this.plugin;

      /* 1) Información de consentimiento (obligatorio en cada arranque). */
      var askConsent = function () {
        if (typeof P.requestConsentInfo !== 'function') { return null; }
        return Promise.resolve(P.requestConsentInfo()).then(function (info) {
          self.applyConsent(info);
          return info;
        });
      };

      /* 2) Formulario oficial, solo si la ley lo exige y hay uno disponible. */
      var showForm = function (info) {
        if (!info || !info.isConsentFormAvailable) { return info; }
        if (info.status !== 'REQUIRED') { return info; }
        if (typeof P.showConsentForm !== 'function') { return info; }
        return Promise.resolve(P.showConsentForm()).then(function (after) {
          self.applyConsent(after);
          return after;
        });
      };

      /* 3) Inicializar el SDK únicamente con permiso para pedir anuncios. */
      var boot = function () {
        if (!self.canRequestAds) { return false; }
        return self.initialize();
      };

      Promise.resolve()
        .then(askConsent)
        .then(showForm)
        .then(boot)
        .then(function () {
          done({
            ok: true,
            adsAllowed: self.canRequestAds,
            ready: self.ready,
            consentStatus: self.consentStatus
          });
        })
        .catch(function (err) {
          self.lastError = String(err && err.message ? err.message : err);
          done({ ok: false, adsAllowed: false, error: self.lastError });
        });
    },

    /* Normaliza la respuesta de UMP. `canRequestAds` (v7.0.3+) es la fuente de
     * verdad; si el plugin es más antiguo se deduce del estado. */
    applyConsent: function (info) {
      if (!info) { return; }
      this.consentStatus = info.status || 'UNKNOWN';
      if (typeof info.canRequestAds === 'boolean') {
        this.canRequestAds = info.canRequestAds;
      } else {
        this.canRequestAds = (info.status === 'OBTAINED' || info.status === 'NOT_REQUIRED');
      }
      this.privacyOptionsRequired = (info.privacyOptionsRequirementStatus === 'REQUIRED');
    },

    /* initialize() puede rechazar en Android si la vista nativa del banner aún
     * no existe (espera hasta 5 s). Nunca bloqueamos el arranque del juego:
     * marcamos los anuncios como no disponibles y reintentamos más tarde. */
    initialize: function () {
      var self = this;
      if (this.ready) { return Promise.resolve(true); }
      var P = this.plugin;
      if (!P || typeof P.initialize !== 'function') {
        /* Plugin antiguo sin initialize(): los anuncios se pueden pedir igual. */
        this.ready = true;
        return Promise.resolve(true);
      }
      var opts = {};
      if (C.testMode) {
        opts.initializeForTesting = true;
        if (C.testDevices && C.testDevices.length) { opts.testingDevices = C.testDevices; }
      }
      if (C.ads.childDirected) { opts.tagForChildDirectedTreatment = true; }
      return Promise.resolve(P.initialize(opts))
        .then(function () {
          self.ready = true;
          self.lastError = null;
          self._retries = 0;
          return true;
        })
        .catch(function (err) {
          self.ready = false;
          self.lastError = String(err);
          self.scheduleRetry();
          return false;
        });
    },

    scheduleRetry: function () {
      var self = this;
      if (this._retryTimer || this._retries >= 3) { return; }
      this._retries++;
      this._retryTimer = setTimeout(function () {
        self._retryTimer = null;
        if (self.canRequestAds && !self.ready) { self.initialize(); }
      }, 2500);
    },

    /* Opciones comunes a todos los formatos.
     *
     * `npa` = anuncios no personalizados. Criterio:
     *  - App dirigida a menores → siempre (obligatorio por COPPA).
     *  - Nativo → NO se fuerza: UMP ya recogió la elección del usuario y el
     *    SDK de Google la aplica sola. Forzarlo aquí bajaría el eCPM sin
     *    aportar cumplimiento.
     *  - Web (sin CMP) → si el usuario rechazó la personalización. */
    adOptions: function (kind) {
      var units = (C.adUnits && C.adUnits.admob) || {};
      var opts = { adId: units[kind] };
      if (C.testMode) { opts.isTesting = true; }
      if (C.ads.childDirected) {
        opts.npa = true;
      } else if (!adapter.native) {
        var personalised = M.Monetization && M.Monetization.consent.allowsPersonalised();
        if (!personalised) { opts.npa = true; }
      }
      return opts;
    },

    /* --- Banner: solo en menús, nunca durante la partida ------------------ */
    showBanner: function () {
      var self = this;
      var P = this.plugin;
      if (!this.ready || !P || typeof P.showBanner !== 'function') { return false; }
      var opts = this.adOptions('banner');
      opts.adSize = 'ADAPTIVE_BANNER';
      opts.position = 'BOTTOM_CENTER';
      opts.margin = 0;
      Promise.resolve(P.showBanner(opts)).catch(function (e) { self.lastError = String(e); });
      return true;
    },

    hideBanner: function () {
      var P = this.plugin;
      if (P && typeof P.hideBanner === 'function') {
        Promise.resolve(P.hideBanner()).catch(function () { /* nada que hacer */ });
        return true;
      }
      return false;
    },

    /* --- Intersticial ------------------------------------------------------ */
    showInterstitial: function (cb) {
      var self = this;
      var P = this.plugin;
      if (!this.ready || !P || typeof P.showInterstitial !== 'function') {
        cb({ ok: false, reason: 'not-ready' });
        return;
      }
      var opts = this.adOptions('interstitial');
      var load = (typeof P.prepareInterstitial === 'function')
        ? Promise.resolve(P.prepareInterstitial(opts))
        : Promise.resolve();
      load
        .then(function () { return P.showInterstitial({ adId: opts.adId }); })
        .then(function () {
          M.Save.bump('interstitialsShown');
          cb({ ok: true, shown: true });
        })
        .catch(function (e) {
          self.lastError = String(e);
          cb({ ok: false, error: String(e) });
        });
    },

    /* --- Recompensado: opt-in y con entrega única -------------------------- */
    preloadRewarded: function () {
      var P = this.plugin;
      if (!this.ready || !P || typeof P.prepareRewardVideoAd !== 'function') { return; }
      Promise.resolve(P.prepareRewardVideoAd(this.adOptions('rewarded')))
        .catch(function () { /* se reintentará al mostrarlo */ });
    },

    showRewarded: function (cb) {
      var self = this;
      var P = this.plugin;
      if (!this.ready || !P || typeof P.showRewardVideoAd !== 'function') {
        cb({ ok: false, reason: 'not-ready' });
        return;
      }
      var opts = this.adOptions('rewarded');
      var settled = false;   // la recompensa se entrega EXACTAMENTE una vez
      var grant = function () {
        if (settled) { return; }
        settled = true;
        M.Save.bump('rewardedWatched');
        cb({ ok: true, rewarded: true });
      };
      var fail = function (e) {
        if (settled) { return; }
        settled = true;
        self.lastError = String(e);
        cb({ ok: false, error: String(e) });
      };
      var load = (typeof P.prepareRewardVideoAd === 'function')
        ? Promise.resolve(P.prepareRewardVideoAd(opts))
        : Promise.resolve();
      load
        /* showRewardVideoAd resuelve cuando el usuario gana la recompensa. */
        .then(function () { return P.showRewardVideoAd({ adId: opts.adId }); })
        .then(grant)
        .catch(fail);
    },

    /* --- Privacidad: punto de entrada en Ajustes (si la normativa lo pide) - */
    showPrivacyOptions: function (cb) {
      var P = this.plugin;
      if (!P || typeof P.showPrivacyOptionsForm !== 'function') {
        if (cb) { cb({ ok: false, reason: 'no-plugin' }); }
        return;
      }
      Promise.resolve(P.showPrivacyOptionsForm())
        .then(function () { if (cb) { cb({ ok: true }); } })
        .catch(function (e) { if (cb) { cb({ ok: false, error: String(e) }); } });
    }
  };

  /* ==========================================================================
   * 3. Overlay de anuncio simulado (solo web/stub)
   * ========================================================================*/
  function ensureOverlay() {
    if (overlay) { return overlay; }
    var el = document.createElement('div');
    el.id = 'ad-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999', 'display:none',
      'align-items:center', 'justify-content:center',
      'background:rgba(4,26,34,.92)', 'backdrop-filter:blur(6px)',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif'
    ].join(';');
    el.innerHTML = [
      '<div style="max-width:340px;width:86%;background:#0d3b4a;border:1px solid #2fa3c9;',
      'border-radius:20px;padding:22px;text-align:center;color:#d9f7ff;box-shadow:0 18px 50px rgba(0,0,0,.5)">',
      '<div id="ad-badge" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.65;margin-bottom:10px">ANUNCIO DE PRUEBA</div>',
      '<div id="ad-title" style="font-size:19px;font-weight:700;margin-bottom:8px"></div>',
      '<div id="ad-body" style="font-size:14px;line-height:1.5;opacity:.85;margin-bottom:16px"></div>',
      '<div id="ad-progress" style="height:8px;background:rgba(255,255,255,.14);border-radius:99px;overflow:hidden;margin-bottom:16px">',
      '<div id="ad-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#7fe3c8,#ffc247);transition:width .2s linear"></div>',
      '</div>',
      '<button id="ad-close" style="display:none;width:100%;padding:13px;border:0;border-radius:12px;',
      'background:linear-gradient(135deg,#ff7a59,#ffc247);color:#04222b;font-weight:800;font-size:15px;cursor:pointer"></button>',
      '</div>'
    ].join('');
    document.body.appendChild(el);
    overlay = el;
    return el;
  }

  function showStubAd(opts, done) {
    var el = ensureOverlay();
    var title = el.querySelector('#ad-title');
    var body = el.querySelector('#ad-body');
    var bar = el.querySelector('#ad-bar');
    var close = el.querySelector('#ad-close');
    var badge = el.querySelector('#ad-badge');
    var seconds = opts.seconds || 3;
    var t = 0;

    badge.textContent = 'ANUNCIO DE PRUEBA · ' + currentNetwork.toUpperCase();
    title.textContent = opts.rewarded ? (M.t('loadingAd')) : 'Contramarea';
    body.textContent = opts.rewarded
      ? 'Este es el hueco donde aparecerá el anuncio recompensado real.'
      : 'Este es el hueco donde aparecerá el intersticial real.';
    close.style.display = 'none';
    close.textContent = M.t('close');
    bar.style.width = '0%';
    el.style.display = 'flex';

    var timer = setInterval(function () {
      t += 0.2;
      bar.style.width = Math.min(100, (t / seconds) * 100) + '%';
      if (t >= seconds) {
        clearInterval(timer);
        close.style.display = 'block';
        close.onclick = function () {
          el.style.display = 'none';
          done(true);
        };
      }
    }, 200);
  }

  /* ==========================================================================
   * 4. Adaptadores
   * ========================================================================*/

  var WebAdapter = {
    id: 'web-stub',
    native: false,
    init: function (cb) { cb({ ok: true, adapter: 'web-stub' }); },
    preload: function (kind, cb) { if (cb) { cb({ ok: true }); } },
    showBanner: function () { /* sin banner en web */ return false; },
    hideBanner: function () { return true; },
    showInterstitial: function (cb) {
      M.Save.bump('interstitialsShown');
      showStubAd({ rewarded: false, seconds: 3 }, function () { cb({ ok: true, shown: true }); });
    },
    showRewarded: function (cb) {
      showStubAd({ rewarded: true, seconds: 3 }, function () {
        M.Save.bump('rewardedWatched');
        cb({ ok: true, rewarded: true });
      });
    },
    purchase: function (product, cb) { cb({ ok: true, product: product, stubbed: true }); },
    restore: function (cb) { cb({ ok: true, restored: [] }); }
  };

  /* Adaptador nativo (Capacitor).
   *
   * AdMob es la red implementada de verdad, contra el plugin comunitario:
   *   @capacitor-community/admob  → AdMob (banner, intersticial, rewarded, UMP)
   *
   * El resto de redes se declaran para poder añadirlas más adelante con el
   * mismo contrato; si el plugin no está instalado, el método devuelve un
   * fallo limpio en vez de romper el juego.
   *   @admob-plus/capacitor                → alternativa AdMob
   *   cordova-plugin-unity-ads             → Unity Ads
   *   @capacitor-community/applovin-max    → AppLovin MAX
   *   cordova-plugin-ironsource-mediation  → ironSource / LevelPlay
   *   cordova-plugin-facebook-ads          → Meta Audience Network
   *   @capacitor-community/in-app-purchases / cordova-plugin-purchase → IAP
   */
  var NativeAdapter = {
    id: 'capacitor-native',
    native: true,

    init: function (cb) {
      var plugins = bridge;
      var result = { ok: true, adapter: 'capacitor-native', available: [] };
      ['AdMob', 'AdMobPlugin', 'UnityAds', 'AppLovinMAX', 'IronSource', 'FacebookAds', 'InAppPurchases', 'Store'].forEach(function (p) {
        if (plugins && plugins[p]) { result.available.push(p); }
      });
      /* Flujo UMP + initialize. Nunca bloquea el arranque del juego. */
      AdMobBridge.bootstrap(function (info) {
        result.admob = info;
        result.adsAllowed = !!info.adsAllowed;
        cb(result);
      });
    },

    preload: function (kind, cb) {
      if (kind === 'rewarded') { AdMobBridge.preloadRewarded(); }
      if (cb) { cb({ ok: true }); }
    },
    showBanner: function () { return AdMobBridge.showBanner(); },
    hideBanner: function () { return AdMobBridge.hideBanner(); },
    showInterstitial: function (cb) { AdMobBridge.showInterstitial(cb); },
    showRewarded: function (cb) { AdMobBridge.showRewarded(cb); },

    purchase: function (product, cb) {
      var store = (bridge && (bridge.Store || bridge.InAppPurchases));
      if (!store) { cb({ ok: false, reason: 'no-plugin' }); return; }
      Promise.resolve(store.order ? store.order(product.id) : store.purchase({ productId: product.id }))
        .then(function () { cb({ ok: true, product: product }); })
        .catch(function (e) { cb({ ok: false, error: String(e) }); });
    },
    restore: function (cb) {
      var store = (bridge && (bridge.Store || bridge.InAppPurchases));
      if (!store) { cb({ ok: false, reason: 'no-plugin' }); return; }
      Promise.resolve(store.restore && store.restore()).then(function () { cb({ ok: true }); })
        .catch(function (e) { cb({ ok: false, error: String(e) }); });
    }
  };

  var adapter = WebAdapter;

  /* ==========================================================================
   * 5. API pública
   * ========================================================================*/
  var api = {
    get network() { return currentNetwork; },
    get isNative() { return adapter.native; },
    setNetwork: function (n) { currentNetwork = n; },

    init: function (opts) {
      opts = opts || {};
      if (opts.network) { currentNetwork = opts.network; }
      bridge = detectNative();
      adapter = bridge ? NativeAdapter : WebAdapter;
      initialized = true;
      return new Promise(function (resolve) {
        adapter.init(function (info) { resolve(info); });
      });
    },

    /* --- Consentimiento --- */
    consent: {
      decided: function () {
        /* En nativo manda UMP: el formulario oficial ya se ha gestionado. */
        if (adapter.native) { return AdMobBridge.consentStatus !== 'UNKNOWN'; }
        return !!M.Save.get().consent.decided;
      },
      allowsPersonalised: function () { return !!M.Save.get().consent.personalised; },
      canRequestAds: function () {
        if (adapter.native) { return AdMobBridge.canRequestAds; }
        return !C.ads.requireConsentBeforeAds || api.consent.decided();
      },
      set: function (personalised) {
        M.Save.set({ consent: { decided: true, personalised: !!personalised, date: new Date().toISOString() } });
      },
      /* En nativo delega en UMP (requestConsentInfo → showConsentForm).
       * En web mostramos un diálogo propio equivalente. */
      request: function (onDone) {
        if (!adapter.native) {
          onDone && onDone(api.consent.decided());
          return;
        }
        AdMobBridge.bootstrap(function (info) {
          /* Reflejamos el resultado en el guardado local solo a efectos de
           * analítica; la decisión legal vive en UMP. */
          if (info && info.adsAllowed) { api.consent.set(AdMobBridge.consentStatus === 'OBTAINED'); }
          onDone && onDone(!!(info && info.adsAllowed));
        });
      },
      /* Punto de entrada para que el usuario cambie su elección (Ajustes). */
      showPrivacyOptions: function (cb) { AdMobBridge.showPrivacyOptions(cb); }
    },

    /* --- Anuncios --- */
    ads: {
      canServe: function () {
        if (adapter.native) { return AdMobBridge.ready && AdMobBridge.canRequestAds; }
        if (C.ads.requireConsentBeforeAds && !api.consent.decided()) { return false; }
        return true;
      },
      preload: function (kind) {
        if (!api.ads.canServe()) { return; }
        adapter.preload(kind || 'rewarded');
      },

      showBanner: function () {
        if (!api.ads.canServe()) { return false; }
        if (M.Save.get().noAds) { return false; }
        return adapter.showBanner();
      },
      hideBanner: function () { return adapter.hideBanner(); },

      /* Intersticial: solo en transiciones y respetando frecuencia. */
      onLevelCompleted: function (cb) {
        levelCounter++;
        var st = M.Save.get().stats;
        var now = Date.now();
        var enoughLevels = levelCounter % C.ads.interstitialEveryLevels === 0;
        var enoughTime = (now - (st.lastInterstitialAt || 0)) > C.ads.interstitialMinSeconds * 1000;
        if (!api.ads.canServe() || M.Save.get().noAds || !enoughLevels || !enoughTime) {
          cb && cb({ ok: false, reason: 'skipped' });
          return false;
        }
        M.Save.set({ stats: Object.assign({}, st, { lastInterstitialAt: now }) });
        adapter.showInterstitial(cb || function () {});
        return true;
      },

      /* Recompensado: siempre opt-in. */
      showRewarded: function (cb) {
        if (!api.ads.canServe()) { cb({ ok: false, reason: 'no-consent' }); return; }
        adapter.showRewarded(cb);
      }
    },

    /* --- Compras --- */
    iap: {
      products: function () { return C.iap.slice(); },
      find: function (id) { return C.iap.filter(function (p) { return p.id === id; })[0] || null; },
      purchase: function (id, cb) {
        var product = api.iap.find(id);
        if (!product) { cb({ ok: false, reason: 'unknown-product' }); return; }
        adapter.purchase(product, function (res) {
          if (res.ok) { api.iap.fulfil(product); }
          cb(res);
        });
      },
      /* Entrega del producto comprado (idempotente por tipo). */
      fulfil: function (product) {
        var s = M.Save.get();
        if (product.gems) { M.Save.addGems(product.gems); }
        if (product.type === 'non_consumable') {
          var owned = Object.assign({}, s.owned); owned[product.id] = true;
          var patch = { owned: owned };
          if (product.id === 'contramarea.no_ads' || product.id === 'contramarea.starter') { patch.noAds = true; }
          M.Save.set(patch);
        }
      },
      restore: function (cb) {
        adapter.restore(function (res) {
          if (res.ok && res.restored && res.restored.length) {
            res.restored.forEach(function (id) { var p = api.iap.find(id); if (p) { api.iap.fulfil(p); } });
          }
          cb(res);
        });
      }
    },

    /* Expuesto para QA y para el arnés de pruebas. */
    _adapterId: function () { return adapter.id; },
    _isInitialized: function () { return initialized; },
    _admob: function () { return AdMobBridge; }
  };

  M.Monetization = api;
})(window.MAREA);
