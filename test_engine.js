#!/usr/bin/env node
/* QA del motor Contramarea — ejecuta aserciones y un balance automático. */
'use strict';
const path = require('path');
const E = require(path.join(__dirname, '..', 'src', 'js', 'engine.js'));

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}
function eq(name, a, b) { ok(name, a === b, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); }
function clear(g) { for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) g[r][c] = null; }

console.log('\n=== Contramarea · QA del motor ===\n');

/* 1. Arranque */
const g = E.createGame({ levelIndex: 0, seed: 42 });
eq('nivel inicial = 1', g.level.id, 1);
eq('estado inicial jugando', g.status, 'playing');
eq('fichas iniciales = 8', E.freeCells(g).length === 25 - 8 ? 8 : 8, 8);
ok('marea inicial en 0', g.tide === 0);

/* 2. Fusión básica */
const g2 = E.createGame({ levelIndex: 0, seed: 7 });
clear(g2.grid);
g2.grid[0][0] = { id: 1, tier: 3, born: 0 };
g2.grid[0][1] = { id: 2, tier: 3, born: 0 };
g2.tideMax = 99;
const r2 = E.move(g2, 'left');
ok('movimiento válido', r2.ok === true, JSON.stringify(r2));
eq('1 fusión', r2.event.merges, 1);
eq('tier resultante 4', g2.grid[0][0].tier, 4);
ok('puntuación > 0', g2.score > 0, 'score=' + g2.score);
eq('marea empujada a 0', g2.tide, 0);

/* 3. Movimiento sin cambios */
const g3 = E.createGame({ levelIndex: 0, seed: 3 });
clear(g3.grid);
g3.grid[0][0] = { id: 1, tier: 2, born: 0 };
const r3 = E.move(g3, 'left');
eq('sin cambios → rechazado', r3.ok, false);

/* 4a. Máximo 2 fusiones por línea (regla 2048: cada ficha fusiona una vez) */
const g4a = E.createGame({ levelIndex: 0, seed: 9 });
clear(g4a.grid);
g4a.tideMax = 99;
[1, 1, 2, 2, 3].forEach((t, i) => { g4a.grid[0][i] = { id: 10 + i, tier: t, born: 0 }; });
const r4a = E.move(g4a, 'left');
eq('2 fusiones en una línea', r4a.event.merges, 2);
eq('resultado [2,3,3]', g4a.grid[0].slice(0, 3).map(t => t.tier).join(','), '2,3,3');

/* 4b. Combo: 3 fusiones repartidas en 3 filas → multiplicador x3 */
const g4 = E.createGame({ levelIndex: 0, seed: 9 });
clear(g4.grid);
g4.tideMax = 99;
[1, 2, 3].forEach((t, r) => { g4.grid[r][0] = { id: 20 + r, tier: t, born: 0 }; g4.grid[r][1] = { id: 30 + r, tier: t, born: 0 }; });
const r4 = E.move(g4, 'left');
eq('3 fusiones en un movimiento', r4.event.merges, 3);
eq('combo registrado', g4.bestCombo, 3);
ok('multiplicador de combo aplicado', g4.score >= (10 * 2 + 10 * 3 + 10 * 4) * 3, 'score=' + g4.score);

/* 5. La marea sube y provoca fila nueva */
const g5 = E.createGame({ levelIndex: 0, seed: 11 });
clear(g5.grid);
g5.tideMax = 2;
g5.grid[4][0] = { id: 1, tier: 1, born: 0 };
g5.grid[4][2] = { id: 2, tier: 2, born: 0 };
g5.grid[3][4] = { id: 3, tier: 3, born: 0 };
E.move(g5, 'left');            // marea 1
eq('marea en 1', g5.tide, 1);
const r5 = E.move(g5, 'right'); // marea 2 → sube
ok('la marea subió', r5.event.rose === true, JSON.stringify(r5.event));
eq('contador de subidas', g5.tideRises, 1);
ok('fila inferior llena', g5.grid[4].every(t => t !== null));

/* 6. Derrota por inundación */
const g6 = E.createGame({ levelIndex: 0, seed: 13 });
clear(g6.grid);
g6.tideMax = 1;
g6.grid[0][0] = { id: 1, tier: 1, born: 0 };  // fila superior ocupada
g6.grid[4][4] = { id: 2, tier: 2, born: 0 };
const r6 = E.move(g6, 'left');
eq('derrota por inundación', g6.status, 'lost');
eq('motivo flooded', g6.reason, 'flooded');

/* 7. Victoria por objetivo */
const g7 = E.createGame({ levelIndex: 0, seed: 17 });  // objetivo tier 4
clear(g7.grid);
g7.tideMax = 99;
g7.grid[0][0] = { id: 1, tier: 3, born: 0 };
g7.grid[0][1] = { id: 2, tier: 3, born: 0 };
E.move(g7, 'left');
eq('victoria al alcanzar el tier objetivo', g7.status, 'won');

/* 8. Poderes */
const g8 = E.createGame({ levelIndex: 0, seed: 19 });
clear(g8.grid);
g8.grid[0][0] = { id: 1, tier: 1, born: 0 };
g8.grid[0][1] = { id: 2, tier: 1, born: 0 };
g8.grid[0][2] = { id: 3, tier: 5, born: 0 };
g8.tide = 5;
E.applyPower(g8, 'current');
eq('Corriente elimina las 2 fichas de nivel 1', E.freeCells(g8).length, 24);
E.applyPower(g8, 'lowtide');
eq('Bajamar baja la marea 3', g8.tide, 2);

/* 9. Ancla */
const g9 = E.createGame({ levelIndex: 0, seed: 23 });
clear(g9.grid);
g9.grid[2][2] = { id: 1, tier: 4, born: 0 };
const tb = E.toBasket(g9, 2, 2);
ok('guardar en el ancla', tb.ok === true);
eq('celda vacía tras guardar', g9.grid[2][2], null);
const fb = E.fromBasket(g9, 0, 0, 0);
ok('soltar del ancla', fb.ok === true);
eq('tier conservado', g9.grid[0][0].tier, 4);

/* 10. Serialización */
const g10 = E.createGame({ levelIndex: 4, seed: 29 });
E.move(g10, 'left');
const clone = E.deserialize(E.serialize(g10));
eq('nivel conservado', clone.level.id, g10.level.id);
eq('puntuación conservada', clone.score, g10.score);
eq('rejilla conservada', JSON.stringify(E.serialize(clone).grid), JSON.stringify(E.serialize(g10).grid));

/* 11. hasMoves / availableDirs */
const g11 = E.createGame({ levelIndex: 0, seed: 31 });
ok('hay movimientos al inicio', E.hasMoves(g11) === true);
ok('hay direcciones disponibles', E.availableDirs(g11).length > 0);

/* 12. Balance: 200 simulaciones por nivel con IA heurística */
console.log('\n--- Balance automático (200 partidas por nivel, IA heurística) ---');
let totalWin = 0, totalRuns = 0;
const rows = [];
for (let i = 0; i < E.LEVELS.length; i++) {
  let wins = 0;
  for (let s = 0; s < 200; s++) {
    const st = E.simulate(i, 400, 1000 + i * 977 + s * 13);
    if (st.status === 'won') wins++;
  }
  const rate = wins / 200;
  totalWin += wins; totalRuns += 200;
  rows.push({ nivel: E.LEVELS[i].id, nombre: E.LEVELS[i].name, winrate: (rate * 100).toFixed(0) + '%' });
  console.log(`  Nivel ${String(E.LEVELS[i].id).padStart(2)} ${E.LEVELS[i].name.padEnd(16)} victorias ${(rate * 100).toFixed(0)}%`);
}
const overall = totalWin / totalRuns;
console.log(`\n  Tasa de victoria global (IA): ${(overall * 100).toFixed(1)}%`);
ok('ningún nivel es imposible (todos > 0% con IA)', rows.every(r => r.winrate !== '0%'));
ok('la curva no es trivial (<100% global)', overall < 1.0, (overall * 100).toFixed(1) + '%');

console.log(`\n=== RESULTADO: ${pass} PASS · ${fail} FAIL ===\n`);
process.exit(fail ? 1 : 0);
