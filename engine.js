/* ============================================================================
 * Contramarea — Motor de juego (lógica pura, sin DOM; testeable en Node)
 * Título: Contramarea  |  Titular: Jessica Panini Cuenca
 * Copyright (c) 2025 Jessica Panini Cuenca. Todos los derechos reservados.
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) {
    root.MAREA = root.MAREA || {};
    for (var k in api) { if (Object.prototype.hasOwnProperty.call(api, k)) root.MAREA[k] = api[k]; }
  }
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';

  var COLS = 5;
  var ROWS = 5;
  var MAX_TIER = 7;
  var DIRS = ['left', 'right', 'up', 'down'];

  /* --- Catálogo original de piezas (corales luminosos) --------------------- */
  var TIERS = [
    { tier: 1, key: 'brote',    es: 'Brote',    en: 'Sprout',   color: '#7fe3c8', glow: '#c9fff0' },
    { tier: 2, key: 'coralito', es: 'Coralito', en: 'Coralbud', color: '#3fc79e', glow: '#9df0d4' },
    { tier: 3, key: 'coral',    es: 'Coral',    en: 'Coral',    color: '#2fa3c9', glow: '#8fe2f7' },
    { tier: 4, key: 'anemona',  es: 'Anémona',  en: 'Anemone',  color: '#6a7ee0', glow: '#b4c0ff' },
    { tier: 5, key: 'estrella', es: 'Estrella', en: 'Starfish', color: '#b768d8', glow: '#e7b0fb' },
    { tier: 6, key: 'perla',    es: 'Perla',    en: 'Pearl',    color: '#f2a03d', glow: '#ffdca6' },
    { tier: 7, key: 'arrecife', es: 'Arrecife', en: 'Reef',     color: '#ff6f4d', glow: '#ffc0ad' }
  ];

  function tierInfo(tier) {
    var t = Math.max(1, Math.min(MAX_TIER, tier | 0));
    return TIERS[t - 1];
  }

  /* --- RNG determinista (xorshift32) --------------------------------------- */
  function makeRng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  /* --- Definición de niveles ----------------------------------------------- */
  /* objective.type: tier | score | merges | survive                              */
  /* Niveles calibrados con tools/calibrate.js (400 partidas de IA por nivel). */
  var LEVELS = [
    { id:  1, name: 'Primera ola',      objective: { type: 'tier',    value:     4 }, moves: 30, tideMax: 10, startTiles: 6,  maxSpawnTier: 1 },
    { id:  2, name: 'Arrecife joven',   objective: { type: 'merges',  value:    11 }, moves: 30, tideMax: 10, startTiles: 6,  maxSpawnTier: 1 },
    { id:  3, name: 'Marea suave',      objective: { type: 'score',   value:   450 }, moves: 32, tideMax: 10, startTiles: 7,  maxSpawnTier: 1 },
    { id:  4, name: 'Perla naciente',   objective: { type: 'tier',    value:     4 }, moves: 36, tideMax: 10, startTiles: 7,  maxSpawnTier: 1 },
    { id:  5, name: 'Corriente fría',   objective: { type: 'survive', value:     3 }, moves: 42, tideMax: 8,  startTiles: 8,  maxSpawnTier: 2 },
    { id:  6, name: 'La marea sube',    objective: { type: 'merges',  value:    12 }, moves: 32, tideMax: 9,  startTiles: 8,  maxSpawnTier: 2 },
    { id:  7, name: 'Arrecife vivo',    objective: { type: 'score',   value:   600 }, moves: 34, tideMax: 9,  startTiles: 9,  maxSpawnTier: 2 },
    { id:  8, name: 'Contracorriente',  objective: { type: 'tier',    value:     4 }, moves: 38, tideMax: 9,  startTiles: 8,  maxSpawnTier: 2 },
    { id:  9, name: 'Bajamar',          objective: { type: 'merges',  value:    13 }, moves: 34, tideMax: 9,  startTiles: 9,  maxSpawnTier: 2 },
    { id: 10, name: 'Noche de perlas',  objective: { type: 'score',   value:   750 }, moves: 36, tideMax: 9,  startTiles: 10, maxSpawnTier: 2 },
    { id: 11, name: 'Ola grande',       objective: { type: 'survive', value:     4 }, moves: 46, tideMax: 7,  startTiles: 10, maxSpawnTier: 3 },
    { id: 12, name: 'Arrecife dorado',  objective: { type: 'tier',    value:     5 }, moves: 42, tideMax: 9,  startTiles: 9,  maxSpawnTier: 3 },
    { id: 13, name: 'Tempestad',        objective: { type: 'merges',  value:    18 }, moves: 36, tideMax: 8,  startTiles: 10, maxSpawnTier: 3 },
    { id: 14, name: 'Marea roja',       objective: { type: 'score',   value:  1050 }, moves: 38, tideMax: 8,  startTiles: 11, maxSpawnTier: 3 },
    { id: 15, name: 'Resaca',           objective: { type: 'tier',    value:     5 }, moves: 46, tideMax: 9,  startTiles: 9,  maxSpawnTier: 3 },
    { id: 16, name: 'Fondo profundo',   objective: { type: 'survive', value:     5 }, moves: 52, tideMax: 6,  startTiles: 11, maxSpawnTier: 3 },
    { id: 17, name: 'Cascada de coral', objective: { type: 'merges',  value:    20 }, moves: 38, tideMax: 8,  startTiles: 11, maxSpawnTier: 4 },
    { id: 18, name: 'Marea viva',       objective: { type: 'score',   value:  1200 }, moves: 40, tideMax: 8,  startTiles: 12, maxSpawnTier: 4 },
    { id: 19, name: 'El faro',          objective: { type: 'tier',    value:     5 }, moves: 52, tideMax: 8,  startTiles: 9,  maxSpawnTier: 4 },
    { id: 20, name: 'Torbellino',       objective: { type: 'merges',  value:    23 }, moves: 42, tideMax: 7,  startTiles: 12, maxSpawnTier: 4 },
    { id: 21, name: 'Gran arrecife',    objective: { type: 'score',   value:  1350 }, moves: 42, tideMax: 7,  startTiles: 12, maxSpawnTier: 4 },
    { id: 22, name: 'Marea negra',      objective: { type: 'survive', value:     5 }, moves: 52, tideMax: 7,  startTiles: 13, maxSpawnTier: 4 },
    { id: 23, name: 'Corazón del mar',  objective: { type: 'tier',    value:     6 }, moves: 58, tideMax: 8,  startTiles: 9,  maxSpawnTier: 5 },
    { id: 24, name: 'Contramarea',      objective: { type: 'score',   value:  1650 }, moves: 46, tideMax: 6,  startTiles: 13, maxSpawnTier: 5 }
  ];

  var ENDLESS = {
    id: 0, name: 'Mar abierto', endless: true,
    objective: { type: 'survive', value: 999999 },
    moves: 0, tideMax: 6, startTiles: 10, maxSpawnTier: 1
  };

  function getLevel(index) {
    if (index < 0 || index >= LEVELS.length) { return null; }
    return LEVELS[index];
  }

  /* --- Estado -------------------------------------------------------------- */
  function emptyGrid(rows, cols) {
    var g = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) { row.push(null); }
      g.push(row);
    }
    return g;
  }

  function createGame(opts) {
    opts = opts || {};
    var levelIndex = (typeof opts.levelIndex === 'number') ? opts.levelIndex : 0;
    var endless = !!opts.endless;
    var level = endless ? ENDLESS : (getLevel(levelIndex) || LEVELS[0]);
    var state = {
      rows: ROWS,
      cols: COLS,
      grid: emptyGrid(ROWS, COLS),
      level: level,
      levelIndex: levelIndex,
      endless: endless,
      score: 0,
      moves: 0,
      movesUsed: 0,
      tide: 0,
      tideMax: level.tideMax,
      tideRises: 0,
      totalMerges: 0,
      bestCombo: 0,
      maxTier: 1,
      status: 'playing',
      reason: null,
      rng: makeRng(opts.seed != null ? opts.seed : (Date.now() >>> 0)),
      nextId: 1,
      basket: [],
      basketMax: 2,
      lastEvent: null,
      history: []
    };
    state.maxTier = seedBoard(state, level.startTiles, level.maxSpawnTier || 1);
    state.status = 'playing';
    return state;
  }

  function recomputeMaxTier(state) {
    var max = 1;
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        var t = state.grid[r][c];
        if (t && t.tier > max) { max = t.tier; }
      }
    }
    state.maxTier = max;
    return max;
  }

  function freeCells(state) {
    var out = [];
    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        if (!state.grid[r][c]) { out.push({ r: r, c: c }); }
      }
    }
    return out;
  }

  function spawnTile(state, tier, r, c) {
    var t = { id: state.nextId++, tier: tier, born: state.movesUsed };
    state.grid[r][c] = t;
    if (tier > state.maxTier) { state.maxTier = tier; }
    return t;
  }

  function randomTier(state, maxTier) {
    // Casi siempre tier 1; los niveles avanzados dejan caer piezas mayores.
    var m = Math.max(1, Math.min(4, maxTier || 1));
    var roll = state.rng();
    if (m >= 4 && roll > 0.96) { return 4; }
    if (m >= 3 && roll > 0.90) { return 3; }
    if (m >= 2 && roll > 0.78) { return 2; }
    return 1;
  }

  function seedBoard(state, count, maxTier) {
    var max = 1;
    for (var i = 0; i < count; i++) {
      var cells = freeCells(state);
      if (!cells.length) { break; }
      var pick = cells[Math.floor(state.rng() * cells.length)];
      var tier = randomTier(state, maxTier);
      spawnTile(state, tier, pick.r, pick.c);
      if (tier > max) { max = tier; }
    }
    return max;
  }

  /* --- Movimiento ---------------------------------------------------------- */
  function lineCells(state, dir, index) {
    var cells = [];
    var i;
    if (dir === 'left') {
      for (i = 0; i < state.cols; i++) { cells.push({ r: index, c: i }); }
    } else if (dir === 'right') {
      for (i = state.cols - 1; i >= 0; i--) { cells.push({ r: index, c: i }); }
    } else if (dir === 'up') {
      for (i = 0; i < state.rows; i++) { cells.push({ r: i, c: index }); }
    } else {
      for (i = state.rows - 1; i >= 0; i--) { cells.push({ r: i, c: index }); }
    }
    return cells;
  }

  function lineCount(state, dir) {
    return (dir === 'left' || dir === 'right') ? state.rows : state.cols;
  }

  function readLine(state, cells) {
    var out = [];
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var t = state.grid[cell.r][cell.c];
      if (t) { out.push({ tile: t, r: cell.r, c: cell.c }); }
    }
    return out;
  }

  function collapse(tiles) {
    var out = [], merges = 0, points = 0, i = 0;
    while (i < tiles.length) {
      var a = tiles[i], b = tiles[i + 1];
      if (b && a.tile.tier === b.tile.tier && a.tile.tier < MAX_TIER) {
        var newTier = a.tile.tier + 1;
        var nt = { id: a.tile.id, tier: newTier, born: a.tile.born, mergedFrom: [a.tile.id, b.tile.id], fresh: true };
        out.push({ tile: nt, from: [a, b] });
        merges++;
        points += 10 * newTier;
        i += 2;
      } else {
        out.push({ tile: a.tile, from: [a] });
        i += 1;
      }
    }
    return { out: out, merges: merges, points: points };
  }

  function move(state, dir) {
    if (state.status !== 'playing') { return { ok: false, reason: 'not-playing' }; }
    if (DIRS.indexOf(dir) === -1) { return { ok: false, reason: 'bad-dir' }; }

    var before = snapshotGrid(state);
    var lines = lineCount(state, dir);
    var movements = [];
    var merges = 0, points = 0;

    for (var i = 0; i < lines; i++) {
      var cells = lineCells(state, dir, i);
      var tiles = readLine(state, cells);
      var res = collapse(tiles);
      merges += res.merges;
      points += res.points;
      for (var k = 0; k < res.out.length; k++) {
        var entry = res.out[k];
        var dest = cells[k];
        movements.push({
          id: entry.tile.id,
          tier: entry.tile.tier,
          fresh: !!entry.tile.fresh,
          from: entry.from.map(function (f) { return { r: f.r, c: f.c }; }),
          to: { r: dest.r, c: dest.c }
        });
      }
      // reescribir la línea
      for (var j = 0; j < cells.length; j++) {
        state.grid[cells[j].r][cells[j].c] = null;
      }
      for (var m = 0; m < res.out.length; m++) {
        state.grid[cells[m].r][cells[m].c] = res.out[m].tile;
      }
    }

    var changed = merges > 0 || gridDiffers(before, state.grid);
    if (!changed) { return { ok: false, reason: 'no-change' }; }

    recomputeMaxTier(state);
    state.movesUsed++;
    state.totalMerges += merges;
    if (merges > state.bestCombo) { state.bestCombo = merges; }

    var gained = merges > 0 ? points * Math.max(1, merges) : 0;
    state.score += gained;

    // La marea: sube 1 por movimiento, cada fusión la empuja hacia atrás.
    state.tide += 1 - merges;
    if (state.tide < 0) { state.tide = 0; }

    var rose = false;
    if (state.tide >= state.tideMax) {
      rose = riseTide(state);
    }

    var event = {
      dir: dir,
      movements: movements,
      merges: merges,
      gained: gained,
      rose: rose,
      tide: state.tide
    };
    state.lastEvent = event;

    if (state.status === 'playing') { evaluate(state); }
    return { ok: true, event: event, status: state.status, reason: state.reason };
  }

  function riseTide(state) {
    // Si la fila superior está ocupada, el agua cubre el arrecife.
    var topOccupied = false;
    for (var c = 0; c < state.cols; c++) { if (state.grid[0][c]) { topOccupied = true; break; } }

    if (topOccupied) {
      state.status = 'lost';
      state.reason = 'flooded';
      state.tideRises++;
      return true;
    }
    for (var r = 0; r < state.rows - 1; r++) {
      state.grid[r] = state.grid[r + 1].slice();
    }
    var newRow = [];
    for (var cc = 0; cc < state.cols; cc++) { newRow.push(null); }
    state.grid[state.rows - 1] = newRow;
    for (var i = 0; i < state.cols; i++) {
      var tier = randomTier(state, state.level.maxSpawnTier || 1);
      spawnTile(state, tier, state.rows - 1, i);
    }
    state.tide = 0;
    state.tideRises++;
    return true;
  }

  /* --- Reglas de fin ------------------------------------------------------- */
  function objectiveMet(state) {
    var o = state.level.objective;
    if (!o) { return false; }
    if (state.endless) { return false; }
    if (o.type === 'tier') { return state.maxTier >= o.value; }
    if (o.type === 'score') { return state.score >= o.value; }
    if (o.type === 'merges') { return state.totalMerges >= o.value; }
    if (o.type === 'survive') { return state.tideRises >= o.value; }
    return false;
  }

  function hasMoves(state) {
    for (var i = 0; i < DIRS.length; i++) {
      if (canMove(state, DIRS[i])) { return true; }
    }
    return false;
  }

  function evaluate(state) {
    if (objectiveMet(state)) {
      state.status = 'won';
      state.reason = 'objective';
      return;
    }
    if (!hasMoves(state)) {
      state.status = 'lost';
      state.reason = 'stuck';
      return;
    }
    if (!state.endless && state.level.moves > 0 && state.movesUsed >= state.level.moves) {
      state.status = 'lost';
      state.reason = 'out-of-moves';
    }
  }

  /* --- Utilidades ---------------------------------------------------------- */
  function snapshotGrid(state) {
    return state.grid.map(function (row) {
      return row.map(function (t) { return t ? t.tier : 0; });
    });
  }

  function gridDiffers(a, b) {
    for (var r = 0; r < a.length; r++) {
      for (var c = 0; c < a[r].length; c++) {
        var bt = b[r][c];
        if (a[r][c] !== (bt ? bt.tier : 0)) { return true; }
      }
    }
    return false;
  }

  function canMove(state, dir) {
    if (state.status !== 'playing') { return false; }
    var lines = lineCount(state, dir);
    for (var i = 0; i < lines; i++) {
      var cells = lineCells(state, dir, i);
      var tiles = readLine(state, cells);
      var res = collapse(tiles);
      if (res.merges > 0) { return true; }
      for (var k = 0; k < res.out.length; k++) {
        var src = res.out[k].from[0];
        var dest = cells[k];
        if (src.r !== dest.r || src.c !== dest.c) { return true; }
      }
    }
    return false;
  }

  function availableDirs(state) {
    return DIRS.filter(function (d) { return canMove(state, d); });
  }

  /* --- Ancla (guardar/soltar una pieza) ------------------------------------ */
  function toBasket(state, r, c) {
    if (state.basket.length >= state.basketMax) { return { ok: false, reason: 'full' }; }
    var t = state.grid[r][c];
    if (!t) { return { ok: false, reason: 'empty' }; }
    state.grid[r][c] = null;
    state.basket.push({ id: t.id, tier: t.tier });
    return { ok: true, basket: state.basket.slice() };
  }

  function fromBasket(state, basketIndex, r, c) {
    if (!state.grid[r][c] && state.basket[basketIndex]) {
      var b = state.basket.splice(basketIndex, 1)[0];
      state.grid[r][c] = { id: b.id, tier: b.tier, born: state.movesUsed };
      return { ok: true };
    }
    return { ok: false, reason: 'blocked' };
  }

  /* --- Poderes ------------------------------------------------------------- */
  function applyPower(state, power) {
    if (state.status !== 'playing') { return { ok: false, reason: 'not-playing' }; }
    if (power === 'current') {           // Corriente: barre las piezas de nivel 1
      var removed = 0;
      for (var r = 0; r < state.rows; r++) {
        for (var c = 0; c < state.cols; c++) {
          var t = state.grid[r][c];
          if (t && t.tier === 1) { state.grid[r][c] = null; removed++; }
        }
      }
      // Nunca dejar el tablero vacío: si el poder lo vacía, la marea trae
      // piezas nuevas en lugar de declarar al jugador sin movimientos.
      if (freeCells(state).length === state.rows * state.cols) {
        var refill = Math.max(5, Math.ceil((state.level.startTiles || 8) * 0.75));
        var seeded = 0;
        while (seeded < refill) {
          var cells = freeCells(state);
          if (!cells.length) { break; }
          var pick = cells[Math.floor(state.rng() * cells.length)];
          spawnTile(state, 1, pick.r, pick.c);
          seeded++;
        }
        recomputeMaxTier(state);
      }
      evaluate(state);
      return { ok: true, removed: removed };
    }
    if (power === 'lowtide') {           // Bajamar: baja la marea
      state.tide = Math.max(0, state.tide - 3);
      return { ok: true, tide: state.tide };
    }
    return { ok: false, reason: 'unknown-power' };
  }

  /* --- Serialización ------------------------------------------------------- */
  function serialize(state) {
    return {
      v: 1,
      levelIndex: state.levelIndex,
      endless: state.endless,
      score: state.score,
      movesUsed: state.movesUsed,
      tide: state.tide,
      tideMax: state.tideMax,
      tideRises: state.tideRises,
      totalMerges: state.totalMerges,
      bestCombo: state.bestCombo,
      maxTier: state.maxTier,
      status: state.status,
      reason: state.reason,
      nextId: state.nextId,
      basket: state.basket,
      grid: state.grid.map(function (row) {
        return row.map(function (t) { return t ? { id: t.id, tier: t.tier, born: t.born } : null; });
      })
    };
  }

  function deserialize(data) {
    if (!data || data.v !== 1) { return null; }
    var state = createGame({ levelIndex: data.levelIndex || 0, endless: !!data.endless, seed: 1 });
    state.grid = data.grid.map(function (row) {
      return row.map(function (t) { return t ? { id: t.id, tier: t.tier, born: t.born } : null; });
    });
    state.score = data.score || 0;
    state.movesUsed = data.movesUsed || 0;
    state.tide = data.tide || 0;
    state.tideMax = data.tideMax || state.level.tideMax;
    state.tideRises = data.tideRises || 0;
    state.totalMerges = data.totalMerges || 0;
    state.bestCombo = data.bestCombo || 0;
    state.maxTier = data.maxTier || 1;
    state.status = data.status || 'playing';
    state.reason = data.reason || null;
    state.nextId = data.nextId || 100;
    state.basket = data.basket || [];
    return state;
  }

  /* --- Simulación para QA -------------------------------------------------- */
  function simulate(levelIndex, maxMoves, seed) {
    var state = createGame({ levelIndex: levelIndex, seed: seed || 12345 });
    var guard = 0;
    while (state.status === 'playing' && guard < (maxMoves || 500)) {
      guard++;
      var dirs = availableDirs(state);
      if (!dirs.length) { break; }
      // Heurística simple: elige el movimiento con más fusiones.
      var best = null, bestScore = -Infinity;
      for (var i = 0; i < dirs.length; i++) {
        var probe = deserialize(serialize(state));
        var res = move(probe, dirs[i]);
        if (!res.ok) { continue; }
        var freeAfter = freeCells(probe).length;
        var topRow = 0;
        for (var cc = 0; cc < probe.cols; cc++) { if (probe.grid[0][cc]) { topRow++; } }
        var s = res.event.merges * 100 + freeAfter * 6 - probe.tide * 5 - topRow * 12;
        if (s > bestScore) { bestScore = s; best = dirs[i]; }
      }
      if (!best) { break; }
      move(state, best);
    }
    return state;
  }

  var API = {
    COLS: COLS, ROWS: ROWS, MAX_TIER: MAX_TIER, DIRS: DIRS,
    TIERS: TIERS, LEVELS: LEVELS, ENDLESS: ENDLESS,
    tierInfo: tierInfo, getLevel: getLevel, makeRng: makeRng,
    createGame: createGame, move: move, canMove: canMove,
    availableDirs: availableDirs, hasMoves: hasMoves,
    toBasket: toBasket, fromBasket: fromBasket, applyPower: applyPower,
    serialize: serialize, deserialize: deserialize,
    objectiveMet: objectiveMet, simulate: simulate, freeCells: freeCells
  };
  API.Engine = API;   // alias para la capa de UI (M.Engine.*)
  return API;
});
