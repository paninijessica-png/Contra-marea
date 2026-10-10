#!/usr/bin/env node
/* Contramarea — genera el build web listo para subir a un hosting estático.
 *
 *   node tools/build_web.js
 *
 * Salida: build/web/  (index.html + css + js + assets + privacy.html + manifest)
 * Es autocontenido: se puede subir la carpeta tal cual a Netlify, Vercel,
 * Cloudflare Pages, GitHub Pages, itch.io o cualquier hosting estático.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'web');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) { copyDir(src, dst); }
    else {
      // readFile + writeFile en lugar de copyFileSync: el montaje del
      // workspace no permite reemplazar archivos con copia directa.
      fs.writeFileSync(dst, fs.readFileSync(src));
    }
  }
}

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { n += countFiles(path.join(dir, entry.name)); }
    else { n++; }
  }
  return n;
}

console.log('\n=== Contramarea · build web ===\n');

// 1. Copiar el contenido del juego sobrescribiendo la salida anterior.
//    (No se borra la carpeta: en el workspace de CREAO el montaje no permite
//    eliminar archivos, y sobrescribir es suficiente para un build.)
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, 'src'), OUT);
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));

// 2. Ajustar las rutas: dentro del build, assets/ cuelga de la raíz del sitio.
for (const rel of ['index.html', 'manifest.webmanifest']) {
  const file = path.join(OUT, rel);
  if (!fs.existsSync(file)) { continue; }
  const before = fs.readFileSync(file, 'utf8');
  const after = before.split('../assets/').join('assets/');
  if (before !== after) { fs.writeFileSync(file, after); }
}

// 3. Copiar también los documentos que el usuario final agradece tener a mano.
for (const rel of ['LICENSE', 'README.md']) {
  const src = path.join(ROOT, rel);
  if (fs.existsSync(src)) { fs.writeFileSync(path.join(OUT, rel), fs.readFileSync(src)); }
}

const total = countFiles(OUT);
let bytes = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); } else { bytes += fs.statSync(p).size; }
  }
})(OUT);

console.log('  Salida:      build/web/');
console.log('  Archivos:    ' + total);
console.log('  Peso total:  ' + (bytes / 1024 / 1024).toFixed(2) + ' MB');
console.log('  Entrada:     build/web/index.html');
console.log('\n  Listo para subir a cualquier hosting estático.\n');
