#!/usr/bin/env node
/* Contramarea — ¿se puede jugar abriendo la carpeta con doble clic?
 *
 * Carga el juego con el protocolo file:// (sin servidor, sin internet, sin
 * instalar nada) y comprueba que arranca, se juega y guarda el progreso.
 *
 *   node tools/test_local_file.js
 */
'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require('/home/user/node_modules/puppeteer');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  { label: 'src/index.html (código fuente)', rel: 'src/index.html' },
  { label: 'build/web/index.html (build listo)', rel: path.join('build', 'web', 'index.html') }
];

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

(async () => {
  console.log('\n=== Contramarea · abrir la carpeta sin servidor (file://) ===\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio']
  });

  for (const t of TARGETS) {
    const file = path.join(ROOT, t.rel);
    console.log('--- ' + t.label + ' ---');
    if (!fs.existsSync(file)) { ok('el archivo existe', false, file); continue; }

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); } });
    page.on('pageerror', (e) => { errors.push('pageerror: ' + e.message); });

    await page.goto('file://' + file, { waitUntil: 'domcontentloaded' });

    const booted = await page.waitForFunction('!!window.__MAREA_DEBUG', { timeout: 15000 })
      .then(() => true).catch(() => false);
    ok('arranca con doble clic (sin servidor)', booted);
    if (!booted) { await page.close(); continue; }

    // Pantalla de consentimiento → menú
    await page.click('#btn-consent-accept').catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    const menu = await page.$eval('#screen-menu', (n) => n.classList.contains('active')).catch(() => false);
    ok('llega al menú principal', menu);

    // Jugar de verdad
    await page.click('#btn-play').catch(() => {});
    await new Promise((r) => setTimeout(r, 600));
    const st = await page.evaluate(() => {
      const g = window.__MAREA_DEBUG.getGame();
      return { status: g.status, tiles: g.grid.flat().filter(Boolean).length };
    }).catch(() => null);
    ok('la partida arranca', !!st && st.status === 'playing' && st.tiles > 0, JSON.stringify(st));

    const keys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press(keys[i % 4]);
      await new Promise((r) => setTimeout(r, 80));
    }
    const played = await page.evaluate(() => {
      const g = window.__MAREA_DEBUG.getGame();
      return { moves: g.movesUsed, score: g.score, merges: g.totalMerges, status: g.status };
    }).catch(() => null);
    ok('se puede jugar (movimientos y fusiones)', !!played && played.moves > 3 && played.merges > 0,
      JSON.stringify(played));

    // Guardado local en file://
    const storage = await page.evaluate(() => {
      try {
        localStorage.setItem('__t', '1');
        const v = localStorage.getItem('__t');
        localStorage.removeItem('__t');
        return { works: v === '1', saved: window.MAREA.Save.get().gems };
      } catch (e) { return { works: false, error: String(e && e.name) }; }
    }).catch(() => null);
    ok('guarda el progreso en el equipo', !!storage && storage.works === true, JSON.stringify(storage));

    // El service worker debe quedar desactivado fuera de http/https (correcto)
    const sw = await page.evaluate(() => 'serviceWorker' in navigator ? navigator.serviceWorker.controller === null : true);
    ok('no intenta registrar service worker en file:// (correcto)', sw === true);

    ok('sin errores de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));

    await page.close();
    console.log('');
  }

  await browser.close();
  console.log('=== RESULTADO: ' + pass + ' PASS · ' + fail + ' FAIL ===\n');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('\nERROR FATAL:\n', e); process.exit(1); });
