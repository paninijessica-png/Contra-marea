#!/usr/bin/env node
/* Calibra los objetivos de los 24 niveles de Contramarea midiendo el
 * rendimiento de la IA heurística bajo las restricciones reales de cada nivel.
 * Salida: literal JS listo para pegar en engine.js  */
'use strict';
const path = require('path');
const E = require(path.join(__dirname, '..', 'src', 'js', 'engine.js'));

/* Forma de cada nivel: dificultad creciente y objetivos alternos. */
const SHAPE = [
  { n: 1,  name: 'Primera ola',      type: 'tier',    tideMax: 10, startTiles: 6,  moves: 30, maxSpawnTier: 1 },
  { n: 2,  name: 'Arrecife joven',   type: 'merges',  tideMax: 10, startTiles: 6,  moves: 30, maxSpawnTier: 1 },
  { n: 3,  name: 'Marea suave',      type: 'score',   tideMax: 10, startTiles: 7,  moves: 32, maxSpawnTier: 1 },
  { n: 4,  name: 'Perla naciente',   type: 'tier',    tideMax: 10, startTiles: 7,  moves: 36, maxSpawnTier: 1 },
  { n: 5,  name: 'Corriente fría',   type: 'survive', tideMax: 8,  startTiles: 8,  moves: 42, maxSpawnTier: 2 },
  { n: 6,  name: 'La marea sube',    type: 'merges',  tideMax: 9,  startTiles: 8,  moves: 32, maxSpawnTier: 2 },
  { n: 7,  name: 'Arrecife vivo',    type: 'score',   tideMax: 9,  startTiles: 9,  moves: 34, maxSpawnTier: 2 },
  { n: 8,  name: 'Contracorriente',  type: 'tier',    tideMax: 9,  startTiles: 8,  moves: 38, maxSpawnTier: 2 },
  { n: 9,  name: 'Bajamar',          type: 'merges',  tideMax: 9,  startTiles: 9,  moves: 34, maxSpawnTier: 2 },
  { n: 10, name: 'Noche de perlas',  type: 'score',   tideMax: 9,  startTiles: 10, moves: 36, maxSpawnTier: 2 },
  { n: 11, name: 'Ola grande',       type: 'survive', tideMax: 7,  startTiles: 10, moves: 46, maxSpawnTier: 3 },
  { n: 12, name: 'Arrecife dorado',  type: 'tier',    tideMax: 9,  startTiles: 9,  moves: 42, maxSpawnTier: 3 },
  { n: 13, name: 'Tempestad',        type: 'merges',  tideMax: 8,  startTiles: 10, moves: 36, maxSpawnTier: 3 },
  { n: 14, name: 'Marea roja',       type: 'score',   tideMax: 8,  startTiles: 11, moves: 38, maxSpawnTier: 3 },
  { n: 15, name: 'Resaca',           type: 'tier',    tideMax: 9,  startTiles: 9,  moves: 46, maxSpawnTier: 3 },
  { n: 16, name: 'Fondo profundo',   type: 'survive', tideMax: 6,  startTiles: 11, moves: 52, maxSpawnTier: 3 },
  { n: 17, name: 'Cascada de coral', type: 'merges',  tideMax: 8,  startTiles: 11, moves: 38, maxSpawnTier: 4 },
  { n: 18, name: 'Marea viva',       type: 'score',   tideMax: 8,  startTiles: 12, moves: 40, maxSpawnTier: 4 },
  { n: 19, name: 'El faro',          type: 'tier',    tideMax: 8,  startTiles: 9,  moves: 52, maxSpawnTier: 4 },
  { n: 20, name: 'Torbellino',       type: 'merges',  tideMax: 7,  startTiles: 12, moves: 42, maxSpawnTier: 4 },
  { n: 21, name: 'Gran arrecife',    type: 'score',   tideMax: 7,  startTiles: 12, moves: 42, maxSpawnTier: 4 },
  { n: 22, name: 'Marea negra',      type: 'survive', tideMax: 7,  startTiles: 13, moves: 52, maxSpawnTier: 4 },
  { n: 23, name: 'Corazón del mar',  type: 'tier',    tideMax: 8,  startTiles: 9,  moves: 58, maxSpawnTier: 5 },
  { n: 24, name: 'Contramarea',      type: 'score',   tideMax: 6,  startTiles: 13, moves: 46, maxSpawnTier: 5 }
];

const RUNS = 400;

function percentile(arr, p) {
  const a = arr.slice().sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.max(0, Math.floor(a.length * p)))];
}

function metricOf(state, type) {
  if (type === 'tier') return state.maxTier;
  if (type === 'merges') return state.totalMerges;
  if (type === 'score') return state.score;
  return state.tideRises;
}

const out = [];
console.log('\n=== Calibración de niveles (IA heurística, ' + RUNS + ' partidas/nivel) ===\n');
console.log('N  Nombre            Tipo     objetivo   p50   p75   IA%');
for (let i = 0; i < SHAPE.length; i++) {
  const sh = SHAPE[i];
  const vals = [];
  for (let s = 0; s < RUNS; s++) {
    const g = E.createGame({ levelIndex: i, seed: 7919 * (i + 1) + s * 104729 });
    // aplicar la forma calibrada
    g.tideMax = sh.tideMax;
    g.level = Object.assign({}, g.level, { tideMax: sh.tideMax, moves: sh.moves, startTiles: sh.startTiles, maxSpawnTier: sh.maxSpawnTier });
    // re-sembrar con startTiles
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) g.grid[r][c] = null;
    g.nextId = 1; g.maxTier = 1;
    for (let k = 0; k < sh.startTiles; k++) {
      const f = E.freeCells(g); if (!f.length) break;
      const p = f[Math.floor(g.rng() * f.length)];
      g.grid[p.r][p.c] = { id: g.nextId++, tier: 1, born: 0 };
    }
    let guard = 0;
    while (g.status === 'playing' && guard < 500) {
      guard++;
      const dirs = E.availableDirs(g); if (!dirs.length) break;
      let best = null, bs = -Infinity;
      for (const d of dirs) {
        const p = E.deserialize(E.serialize(g));
        const r = E.move(p, d); if (!r.ok) continue;
        let top = 0; for (let c = 0; c < p.cols; c++) if (p.grid[0][c]) top++;
        const v = r.event.merges * 100 + E.freeCells(p).length * 6 - p.tide * 5 - top * 12;
        if (v > bs) { bs = v; best = d; }
      }
      if (!best) break;
      E.move(g, best);
    }
    vals.push(metricOf(g, sh.type));
  }
  // Dificultad objetivo: 85% de victorias de la IA en el nivel 1 → 25% en el 24.
  const targetRate = 0.85 - 0.60 * (i / (SHAPE.length - 1));
  let candidates;
  if (sh.type === 'tier') {
    candidates = [3, 4, 5, 6, 7];
  } else if (sh.type === 'survive') {
    candidates = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  } else if (sh.type === 'merges') {
    candidates = [];
    for (let v = 4; v <= 80; v += 1) candidates.push(v);
  } else {
    candidates = [];
    for (let v = 200; v <= 6000; v += 50) candidates.push(v);
  }
  // El mayor objetivo cuya tasa de victorias de la IA siga siendo >= targetRate.
  let value = candidates[0];
  for (const v of candidates) {
    const wr = vals.filter(x => x >= v).length / RUNS;
    if (wr >= targetRate) { value = v; } else { break; }
  }

  const p50 = percentile(vals, 0.5), p75 = percentile(vals, 0.75);
  const aiWin = vals.filter(v => v >= value).length / RUNS;
  console.log(
    String(sh.n).padStart(2), sh.name.padEnd(17), sh.type.padEnd(8),
    String(value).padStart(7), String(p50).padStart(6), String(p75).padStart(6),
    (aiWin * 100).toFixed(0).padStart(4) + '%'
  );
  out.push({ ...sh, value });
}

console.log('\n--- Literal para engine.js ---\n');
const lines = out.map(l =>
  `    { id: ${String(l.n).padStart(2)}, name: '${l.name}',`.padEnd(46) +
  ` objective: { type: '${l.type}',`.padEnd(30) +
  ` value: ${String(l.value).padStart(5)} }, moves: ${l.moves}, tideMax: ${l.tideMax}, startTiles: ${l.startTiles}, maxSpawnTier: ${l.maxSpawnTier} }`
);
console.log('  var LEVELS = [\n' + lines.join(',\n') + '\n  ];');
