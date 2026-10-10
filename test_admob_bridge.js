#!/usr/bin/env node
/* ============================================================================
 * Contramarea — Prueba del puente AdMob (plugin simulado).
 *
 * Inyecta un `window.Capacitor.Plugins.AdMob` falso ANTES de que arranque el
 * juego, de modo que la capa de monetización tome la rama nativa. Comprueba
 * que se respeta el orden obligatorio de UMP y que ningún anuncio se pide sin
 * consentimiento.
 *
 * Uso:  node tools/test_admob_bridge.js
 * ==========================================================================*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('/home/user/node_modules/puppeteer');

const ROOT = path.join(__dirname, '..');
const PORT = 8149;
const ENTRY = '/src/index.html';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml'
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') { p = ENTRY; }
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

/* --- Escenarios ------------------------------------------------------------ */
const CONSENT_REQUIRED = {
  status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED'
};
const CONSENT_GRANTED = {
  status: 'OBTAINED', isConsentFormAvailable: true, canRequestAds: true,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED'
};
const CONSENT_NONE = {
  status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: false,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED'
};

async function boot(browser, state) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); } });

  await page.evaluateOnNewDocument((st) => {
    window.__AD = { calls: [], state: st };
    const log = (fn, args) => window.__AD.calls.push({ fn: fn, args: args });
    const AdMob = {
      requestConsentInfo: async () => { log('requestConsentInfo'); return window.__AD.state.consent; },
      showConsentForm: async () => {
        log('showConsentForm');
        window.__AD.state.consent = Object.assign({}, window.__AD.state.consent, {
          status: 'OBTAINED', canRequestAds: true
        });
        return window.__AD.state.consent;
      },
      initialize: async (o) => {
        log('initialize', o);
        if (window.__AD.state.initRejects) { throw new Error('native view unavailable'); }
      },
      showBanner: async (o) => { log('showBanner', o); },
      hideBanner: async () => { log('hideBanner'); },
      prepareInterstitial: async (o) => { log('prepareInterstitial', o); },
      showInterstitial: async (o) => { log('showInterstitial', o); },
      prepareRewardVideoAd: async (o) => { log('prepareRewardVideoAd', o); },
      showRewardVideoAd: async (o) => {
        log('showRewardVideoAd', o);
        if (window.__AD.state.rewardedFails) { throw new Error('no fill'); }
        return { amount: 1, type: 'reward' };
      },
      showPrivacyOptionsForm: async () => { log('showPrivacyOptionsForm'); }
    };
    window.Capacitor = {
      Plugins: { AdMob: AdMob },
      getPlatform: () => 'android',
      isNativePlatform: () => true
    };
  }, state);

  await page.goto('http://127.0.0.1:' + PORT + ENTRY, { waitUntil: 'networkidle0' });
  await page.waitForFunction('!!window.__MAREA_DEBUG', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 250));
  return { page, errors };
}

const order = (page) => page.evaluate(() => window.__AD.calls.map((c) => c.fn));
const argsOf = (page, fn) => page.evaluate((f) => {
  const hit = window.__AD.calls.filter((c) => c.fn === f);
  return hit.length ? hit[hit.length - 1].args : null;
}, fn);
const countOf = (page, fn) => page.evaluate((f) => window.__AD.calls.filter((c) => c.fn === f).length, fn);

(async () => {
  const server = await serve();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio']
  });

  console.log('\n=== Contramarea · Puente AdMob (plugin simulado) ===\n');

  /* ---------------------------------------------------------------- Caso 1 */
  console.log('  [Caso 1] UE · consentimiento requerido · el usuario acepta');
  {
    const { page, errors } = await boot(browser, {
      consent: CONSENT_REQUIRED, initRejects: false, rewardedFails: false
    });
    const seq = await order(page);
    const first3 = seq.filter((f) => ['requestConsentInfo', 'showConsentForm', 'initialize'].includes(f));

    ok('se consulta el consentimiento al arrancar', seq.includes('requestConsentInfo'));
    ok('se muestra el formulario oficial porque es obligatorio', seq.includes('showConsentForm'));
    ok('el SDK se inicializa solo tras el consentimiento', seq.includes('initialize'));
    ok('el orden es requestConsentInfo → showConsentForm → initialize',
      JSON.stringify(first3) === JSON.stringify(['requestConsentInfo', 'showConsentForm', 'initialize']),
      JSON.stringify(first3));

    const native = await page.evaluate(() => window.MAREA.Monetization.isNative);
    const adapterId = await page.evaluate(() => window.MAREA.Monetization._adapterId());
    const canAsk = await page.evaluate(() => window.MAREA.Monetization.consent.canRequestAds());
    ok('el juego detecta la rama nativa', native === true && adapterId === 'capacitor-native');
    ok('canRequestAds queda en true', canAsk === true);

    const menu = await page.$eval('#screen-menu', (n) => n.classList.contains('active'));
    const ownConsent = await page.$eval('#screen-consent', (n) => n.classList.contains('active'));
    ok('en nativo NO se duplica la pantalla de consentimiento propia', menu === true && ownConsent === false);

    const initOpts = await argsOf(page, 'initialize');
    ok('initialize registra el modo prueba', initOpts && initOpts.initializeForTesting === true,
      JSON.stringify(initOpts));
    ok('sin errores en consola', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 2 */
  console.log('\n  [Caso 2] Banner: solo en menú, con las opciones correctas');
  {
    const { page } = await boot(browser, {
      consent: CONSENT_GRANTED, initRejects: false, rewardedFails: false
    });
    const shown = await page.evaluate(() => window.MAREA.Monetization.ads.showBanner());
    const opts = await argsOf(page, 'showBanner');
    ok('el banner se puede mostrar desde el menú', shown === true);
    ok('usa tamaño adaptativo', opts && opts.adSize === 'ADAPTIVE_BANNER', JSON.stringify(opts));
    ok('se ancla abajo, fuera del tablero', opts && opts.position === 'BOTTOM_CENTER');
    ok('en prueba usa unidades de prueba', opts && opts.isTesting === true);
    ok('en nativo NO se fuerza npa (lo decide UMP)', opts && opts.npa === undefined);

    const hidden = await page.evaluate(() => window.MAREA.Monetization.ads.hideBanner());
    ok('el banner se puede ocultar al empezar a jugar', hidden === true);
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 3 */
  console.log('\n  [Caso 3] Recompensado: opt-in y entrega única');
  {
    const { page } = await boot(browser, {
      consent: CONSENT_GRANTED, initRejects: false, rewardedFails: false
    });
    const before = await page.evaluate(() => window.MAREA.Save.get().stats.rewardedWatched || 0);
    const res = await page.evaluate(() => new Promise((resolve) => {
      window.MAREA.Monetization.ads.showRewarded(resolve);
    }));
    const after = await page.evaluate(() => window.MAREA.Save.get().stats.rewardedWatched || 0);
    const prep = await argsOf(page, 'prepareRewardVideoAd');
    const show = await argsOf(page, 'showRewardVideoAd');
    ok('el recompensado entrega la recompensa', res && res.ok === true && res.rewarded === true,
      JSON.stringify(res));
    ok('se precarga antes de mostrar', !!prep && !!prep.adId, JSON.stringify(prep));
    ok('se muestra el vídeo con la unidad de recompensado', !!show && !!show.adId);
    ok('el contador de recompensas sube exactamente una vez', after - before === 1,
      'antes=' + before + ' despues=' + after);
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 4 */
  console.log('\n  [Caso 4] Sin permiso de anuncios no se pide NADA');
  {
    const { page, errors } = await boot(browser, {
      consent: CONSENT_NONE, initRejects: false, rewardedFails: false
    });
    const seq = await order(page);
    const canServe = await page.evaluate(() => window.MAREA.Monetization.ads.canServe());
    const banner = await page.evaluate(() => window.MAREA.Monetization.ads.showBanner());
    const reward = await page.evaluate(() => new Promise((resolve) => {
      window.MAREA.Monetization.ads.showRewarded(resolve);
    }));
    ok('el SDK NO se inicializa sin permiso', !seq.includes('initialize'), JSON.stringify(seq));
    ok('canServe es false', canServe === false);
    ok('el banner queda bloqueado', banner === false);
    ok('el recompensado se rechaza con motivo claro',
      reward && reward.ok === false && reward.reason === 'no-consent', JSON.stringify(reward));
    const menu = await page.$eval('#screen-menu', (n) => n.classList.contains('active'));
    ok('el juego arranca igual, sin anuncios', menu === true);
    ok('sin errores en consola', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 5 */
  console.log('\n  [Caso 5] Si initialize() falla, el juego no se rompe');
  {
    const { page, errors } = await boot(browser, {
      consent: CONSENT_GRANTED, initRejects: true, rewardedFails: false
    });
    const menu = await page.$eval('#screen-menu', (n) => n.classList.contains('active'));
    const canServe = await page.evaluate(() => window.MAREA.Monetization.ads.canServe());
    const lastErr = await page.evaluate(() => window.MAREA.Monetization._admob().lastError);
    ok('el juego arranca aunque AdMob falle', menu === true);
    ok('los anuncios quedan desactivados, no rotos', canServe === false);
    ok('se registra el error para diagnóstico', typeof lastErr === 'string' && lastErr.length > 0);
    ok('sin excepciones sin capturar', errors.filter((e) => e.includes('pageerror')).length === 0,
      errors.join(' | '));
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 6 */
  console.log('\n  [Caso 6] Intersticial: se precarga antes de mostrarse');
  {
    const { page } = await boot(browser, {
      consent: CONSENT_GRANTED, initRejects: false, rewardedFails: false
    });
    await page.evaluate(() => {
      /* El intersticial solo sale cada 3 niveles y con 90 s de margen. */
      window.MAREA.Save.set({ stats: Object.assign({}, window.MAREA.Save.get().stats, { lastInterstitialAt: 0 }) });
      window.MAREA.Monetization.ads.onLevelCompleted(() => {});
      window.MAREA.Monetization.ads.onLevelCompleted(() => {});
      window.MAREA.Monetization.ads.onLevelCompleted(() => {});
    });
    await new Promise((r) => setTimeout(r, 300));
    const prep = await countOf(page, 'prepareInterstitial');
    const show = await countOf(page, 'showInterstitial');
    ok('el intersticial se precarga antes de mostrarse', prep >= 1, 'prepare=' + prep);
    ok('el intersticial se muestra tras 3 niveles', show >= 1, 'show=' + show);
    await page.close();
  }

  /* ---------------------------------------------------------------- Caso 7 */
  console.log('\n  [Caso 7] Recompensado sin relleno: no se entrega premio');
  {
    const { page } = await boot(browser, {
      consent: CONSENT_GRANTED, initRejects: false, rewardedFails: true
    });
    const before = await page.evaluate(() => window.MAREA.Save.get().stats.rewardedWatched || 0);
    const res = await page.evaluate(() => new Promise((resolve) => {
      window.MAREA.Monetization.ads.showRewarded(resolve);
    }));
    const after = await page.evaluate(() => window.MAREA.Save.get().stats.rewardedWatched || 0);
    ok('si el anuncio falla, no hay recompensa', res && res.ok === false, JSON.stringify(res));
    ok('el contador de recompensas no sube', after === before,
      'antes=' + before + ' despues=' + after);
    await page.close();
  }

  await browser.close();
  server.close();

  console.log('\n=== RESULTADO: ' + pass + ' PASS · ' + fail + ' FAIL ===\n');
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
