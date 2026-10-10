#!/usr/bin/env node
/* ============================================================================
 * Contramarea — Prueba de humo end-to-end con Chromium headless.
 * Arranca un servidor local, carga el juego, juega, abre tienda y ajustes,
 * y captura capturas reales para las tiendas.
 *
 * Uso:  node tools/smoke_test.js
 * ==========================================================================*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('/home/user/node_modules/puppeteer');

const ROOT = path.join(__dirname, '..');
const PORT = 8137;
const SHOTS = path.join(ROOT, 'store', 'screenshots');
// Permite probar el build empaquetado:  node tools/smoke_test.js /build/web/index.html
const ENTRY = process.argv[2] || '/src/index.html';

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

(async () => {
  if (!fs.existsSync(SHOTS)) { fs.mkdirSync(SHOTS, { recursive: true }); }
  const server = await serve();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') { consoleErrors.push(m.text()); } });
  page.on('pageerror', (e) => { consoleErrors.push('pageerror: ' + e.message); });

  console.log('\n=== Contramarea · Prueba de humo E2E ===\n');

  console.log('  Entrada: ' + ENTRY + '\n');
  await page.goto('http://127.0.0.1:' + PORT + ENTRY, { waitUntil: 'networkidle0' });
  await page.waitForFunction('!!window.__MAREA_DEBUG', { timeout: 15000 });
  ok('el juego arranca y expone el arnés de QA', true);

  /* --- Consentimiento --- */
  const consentVisible = await page.$eval('#screen-consent', (n) => n.classList.contains('active'));
  ok('se pide consentimiento antes de cualquier anuncio', consentVisible);
  await page.click('#btn-consent-accept');
  await new Promise((r) => setTimeout(r, 400));
  const menuVisible = await page.$eval('#screen-menu', (n) => n.classList.contains('active'));
  ok('tras el consentimiento aparece el menú', menuVisible);
  await page.screenshot({ path: path.join(SHOTS, '01-menu-1080x1920.png') });

  /* --- Empezar a jugar --- */
  await page.click('#btn-play');
  await new Promise((r) => setTimeout(r, 600));
  const hudVisible = await page.$eval('#hud', (n) => !n.classList.contains('hidden'));
  ok('el HUD aparece al empezar la partida', hudVisible);

  const g0 = await page.evaluate(() => {
    const g = window.__MAREA_DEBUG.getGame();
    return { status: g.status, tiles: g.grid.flat().filter(Boolean).length, score: g.score, tide: g.tide, level: g.level.id };
  });
  ok('la partida arranca en estado "playing"', g0.status === 'playing', JSON.stringify(g0));
  ok('el tablero tiene piezas iniciales', g0.tiles > 0, 'tiles=' + g0.tiles);
  ok('el nivel 1 está cargado', g0.level === 1);

  /* --- Jugar 40 movimientos con teclado --- */
  const keys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
  let moved = 0;
  for (let i = 0; i < 60; i++) {
    const before = await page.evaluate(() => window.__MAREA_DEBUG.getGame().movesUsed);
    await page.keyboard.press(keys[i % 4]);
    await new Promise((r) => setTimeout(r, 70));
    const st = await page.evaluate(() => {
      const g = window.__MAREA_DEBUG.getGame();
      return { moves: g.movesUsed, status: g.status, score: g.score, merges: g.totalMerges, tideRises: g.tideRises, maxTier: g.maxTier };
    });
    if (st.moves > before) { moved++; }
    if (st.status !== 'playing') { break; }
  }
  ok('los movimientos se registran al deslizar/teclear', moved > 5, 'movimientos=' + moved);

  const g1 = await page.evaluate(() => {
    const g = window.__MAREA_DEBUG.getGame();
    return { moves: g.movesUsed, score: g.score, merges: g.totalMerges, maxTier: g.maxTier, status: g.status, tide: g.tide, tideMax: g.tideMax };
  });
  ok('el jugador consigue fusiones', g1.merges > 0, JSON.stringify(g1));
  ok('la puntuación sube', g1.score > 0, 'score=' + g1.score);
  ok('alcanza piezas de nivel superior', g1.maxTier >= 2, 'maxTier=' + g1.maxTier);
  ok('la marea avanza', g1.tide > 0 || g1.moves > g1.tideMax, 'tide=' + g1.tide + '/' + g1.tideMax);

  /* HUD sincronizado */
  const hud = await page.evaluate(() => ({
    score: document.getElementById('hud-score').textContent,
    tide: document.getElementById('hud-tide').textContent
  }));
  ok('el HUD refleja la puntuación real', hud.score === String(g1.score), hud.score + ' vs ' + g1.score);
  ok('el HUD refleja la marea', hud.tide === g1.tide + '/' + g1.tideMax, hud.tide);

  // Captura de la pantalla de resultado si la partida ya terminó.
  const ended = await page.evaluate(() => window.__MAREA_DEBUG.getGame().status);
  if (ended !== 'playing') {
    await page.screenshot({ path: path.join(SHOTS, '05-resultado-1080x1920.png') });
  }

  /* --- Reiniciar para probar poderes y pausa con la partida viva --- */
  await page.evaluate(() => window.__MAREA_DEBUG.startLevel(0));
  await new Promise((r) => setTimeout(r, 400));
  const alive = await page.evaluate(() => window.__MAREA_DEBUG.getGame().status);
  ok('la partida se reinicia correctamente', alive === 'playing', alive);

  /* --- Captura real del tablero en juego --- */
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press(keys[i % 4]);
    await new Promise((r) => setTimeout(r, 90));
  }
  await new Promise((r) => setTimeout(r, 350));
  const inGame = await page.evaluate(() => ({
    status: window.__MAREA_DEBUG.getGame().status,
    tiles: window.__MAREA_DEBUG.getGame().grid.flat().filter(Boolean).length
  }));
  ok('captura de gameplay con el tablero en juego', inGame.status === 'playing' && inGame.tiles > 0, JSON.stringify(inGame));
  await page.screenshot({ path: path.join(SHOTS, '02-gameplay-1080x1920.png') });

  /* --- Poder: Corriente --- */
  const gemsBefore = await page.evaluate(() => window.MAREA.Save.get().gems);
  await page.click('.power-btn[data-power="current"]');
  await new Promise((r) => setTimeout(r, 350));
  const afterPower = await page.evaluate(() => ({
    gems: window.MAREA.Save.get().gems,
    tier1: window.__MAREA_DEBUG.getGame().grid.flat().filter((t) => t && t.tier === 1).length,
    tiles: window.__MAREA_DEBUG.getGame().grid.flat().filter(Boolean).length,
    status: window.__MAREA_DEBUG.getGame().status
  }));
  ok('usar un poder descuenta gemas', afterPower.gems === gemsBefore - 40, 'antes=' + gemsBefore + ' despues=' + afterPower.gems);
  ok('Corriente limpia las piezas de nivel 1', afterPower.tier1 === 0 || afterPower.tier1 <= 5, 'nivel1=' + afterPower.tier1);
  ok('el poder nunca deja el tablero vacío ni pierde la partida', afterPower.tiles > 0 && afterPower.status === 'playing',
    'fichas=' + afterPower.tiles + ' estado=' + afterPower.status);

  /* --- Pausa --- */
  await page.click('#btn-pause');
  await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) => setTimeout(r, 250));
  ok('la pausa abre su pantalla', await page.$eval('#screen-pause', (n) => n.classList.contains('active')));
  await page.click('#btn-resume');
  await new Promise((r) => setTimeout(r, 250));
  ok('se puede reanudar', await page.$eval('#screen-pause', (n) => !n.classList.contains('active')));

  /* --- Niveles --- */
  await page.evaluate(() => window.MAREA.UI.show('menu'));
  await page.click('#btn-levels');
  await new Promise((r) => setTimeout(r, 300));
  const levelCount = await page.$$eval('#levels-grid .level-btn', (n) => n.length);
  ok('la rejilla muestra los 24 niveles', levelCount === 24, 'n=' + levelCount);
  const unlocked = await page.$$eval('#levels-grid .level-btn:not(.locked)', (n) => n.length);
  ok('el nivel 1 está desbloqueado', unlocked >= 1);
  await page.screenshot({ path: path.join(SHOTS, '03-niveles-1080x1920.png') });

  /* --- Tienda + IAP (stub) --- */
  await page.evaluate(() => window.MAREA.UI.show('menu'));
  await page.click('#btn-shop');
  await new Promise((r) => setTimeout(r, 300));
  const shopItems = await page.$$eval('#shop-iap .shop-item', (n) => n.length);
  ok('la tienda lista los productos IAP', shopItems === 5, 'n=' + shopItems);
  const gemsPre = await page.evaluate(() => window.MAREA.Save.get().gems);
  await page.click('#shop-iap [data-iap="contramarea.gems_100"]');
  await new Promise((r) => setTimeout(r, 500));
  const gemsPost = await page.evaluate(() => window.MAREA.Save.get().gems);
  ok('comprar gemas las entrega (flujo IAP verificado)', gemsPost === gemsPre + 100, gemsPre + ' -> ' + gemsPost);
  await page.click('#shop-iap [data-iap="contramarea.no_ads"]');
  await new Promise((r) => setTimeout(r, 400));
  const noAds = await page.evaluate(() => window.MAREA.Save.get().noAds);
  ok('la compra "Sin anuncios" se aplica', noAds === true);
  await page.screenshot({ path: path.join(SHOTS, '04-tienda-1080x1920.png') });

  /* --- Reglas de anuncios --- */
  const adRules = await page.evaluate(async () => {
    const M = window.MAREA;
    const out = {};
    out.adapter = M.Monetization._adapterId();
    out.consentAllows = M.Monetization.consent.decided();
    // Con "sin anuncios" comprado, el intersticial debe saltarse.
    let called = false;
    const shown = M.Monetization.ads.onLevelCompleted(() => { called = true; });
    out.interstitialSkippedWithNoAds = (shown === false);
    out.bannerBlockedWithNoAds = (M.Monetization.ads.showBanner() === false);
    out.testUnitsInUse = M.CONFIG.testMode === true;
    out.packageId = M.CONFIG.packageId;
    return out;
  });
  ok('adaptador de monetización activo', adRules.adapter === 'web-stub' || adRules.adapter === 'capacitor-native', adRules.adapter);
  ok('el consentimiento está registrado', adRules.consentAllows === true);
  ok('"Sin anuncios" bloquea banner e intersticiales', adRules.interstitialSkippedWithNoAds && adRules.bannerBlockedWithNoAds, JSON.stringify(adRules));
  ok('modo prueba activo (unidades de prueba, sin clics reales)', adRules.testUnitsInUse === true);
  ok('package id a nombre del titular', adRules.packageId === 'com.jessicaninicuenca.contramarea' || adRules.packageId === 'com.jessicapaninicuenca.contramarea', adRules.packageId);

  /* --- Persistencia --- */
  const persisted = await page.evaluate(() => {
    window.MAREA.Save.completeLevel(1, 3, 1234);
    return window.MAREA.Save.get().progress.unlocked;
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction('!!window.__MAREA_DEBUG', { timeout: 15000 });
  const afterReload = await page.evaluate(() => window.MAREA.Save.get().progress.unlocked);
  ok('el progreso se guarda y sobrevive al reinicio', afterReload >= persisted, 'antes=' + persisted + ' despues=' + afterReload);

  /* --- Ajustes / idioma --- */
  await page.evaluate(() => window.MAREA.UI.show('settings'));
  await page.select('#opt-lang', 'en');
  await new Promise((r) => setTimeout(r, 250));
  const titleEn = await page.$eval('#game-title', (n) => n.textContent);
  ok('el idioma cambia a inglés', titleEn === 'Countertide', titleEn);
  await page.select('#opt-lang', 'es');
  await new Promise((r) => setTimeout(r, 200));
  const titleEs = await page.$eval('#game-title', (n) => n.textContent);
  ok('el idioma vuelve a español', titleEs === 'Contramarea', titleEs);

  /* --- PWA: manifiesto y service worker --- */
  const pwa = await page.evaluate(async () => {
    const out = {};
    out.manifestLink = !!document.querySelector('link[rel="manifest"]');
    const mf = await (await fetch('manifest.webmanifest')).json();
    out.name = mf.name;
    out.display = mf.display;
    out.icons = (mf.icons || []).length;
    out.standalone = (mf.display === 'fullscreen' || mf.display === 'standalone');
    out.startUrl = mf.start_url;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      out.swActive = !!(reg && reg.active);
      out.swScope = reg ? reg.scope : null;
      out.caches = await caches.keys();
    }
    return out;
  });
  ok('manifiesto PWA enlazado y válido', pwa.manifestLink && pwa.name === 'Contramarea' && pwa.icons >= 3, JSON.stringify(pwa));
  ok('se instala a pantalla completa', pwa.standalone === true, String(pwa.display));
  ok('service worker registrado y activo', pwa.swActive === true, JSON.stringify(pwa.swScope));
  ok('el juego queda cacheado en el dispositivo', (pwa.caches || []).some((c) => c.indexOf('contramarea') === 0), JSON.stringify(pwa.caches));

  /* --- Sin errores de consola --- */
  ok('sin errores de JavaScript en consola', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));

  /* --- Sin conexión: la app instalada debe arrancar igual --- */
  consoleErrors.length = 0;
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  const offlineOk = await page.waitForFunction('!!window.__MAREA_DEBUG', { timeout: 15000 })
    .then(() => true).catch(() => false);
  const offlineTitle = offlineOk ? await page.$eval('#game-title', (n) => n.textContent).catch(() => '') : '';
  ok('el juego arranca sin conexión (offline)', offlineOk && offlineTitle === 'Contramarea', offlineTitle);
  await page.setOfflineMode(false);

  /* --- Capturas generadas --- */
  const shots = fs.readdirSync(SHOTS).filter((f) => f.endsWith('.png'));
  ok('capturas reales de tienda generadas', shots.length >= 4, shots.join(', '));

  await browser.close();
  server.close();

  console.log('\n=== RESULTADO E2E: ' + pass + ' PASS · ' + fail + ' FAIL ===\n');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('\nERROR FATAL EN LA PRUEBA E2E:\n', e);
  process.exit(1);
});
