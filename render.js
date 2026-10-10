/* ============================================================================
 * Contramarea — Renderizador en canvas.
 * Glifos 100% originales dibujados por código (sin sprites de terceros).
 * ==========================================================================*/
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var P = M.CONFIG.palette;
  var ROWS = M.ROWS, COLS = M.COLS;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* --- Glifos originales por nivel de pieza ------------------------------- */
  function glyph(ctx, tier, cx, cy, s, ink) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.6, s * 0.10);
    var i, a;

    if (tier === 1) {                       // Brote
      ctx.beginPath(); ctx.moveTo(0, s * 0.42); ctx.lineTo(0, -s * 0.16); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s * 0.22, -s * 0.20, s * 0.24, s * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * 0.22, -s * 0.26, s * 0.24, s * 0.14, 0.6, 0, Math.PI * 2); ctx.fill();
    } else if (tier === 2) {                // Coralito
      for (i = -1; i <= 1; i++) {
        a = i * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.40);
        ctx.quadraticCurveTo(i * s * 0.28, 0, Math.sin(a) * s * 0.42, -s * 0.38);
        ctx.stroke();
      }
    } else if (tier === 3) {                // Coral
      for (i = -2; i <= 2; i++) {
        a = i * 0.36;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.42);
        ctx.quadraticCurveTo(i * s * 0.20, -s * 0.05, Math.sin(a) * s * 0.44, -s * 0.44);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, s * 0.30, s * 0.14, 0, Math.PI * 2); ctx.fill();
    } else if (tier === 4) {                // Anémona
      ctx.beginPath(); ctx.arc(0, s * 0.14, s * 0.26, Math.PI, 0); ctx.fill();
      for (i = 0; i < 5; i++) {
        a = -Math.PI + (i / 4) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.22, s * 0.14 + Math.sin(a) * s * 0.12);
        ctx.quadraticCurveTo(Math.cos(a) * s * 0.40, -s * 0.10, Math.cos(a) * s * 0.34, -s * 0.42);
        ctx.stroke();
      }
    } else if (tier === 5) {                // Estrella
      ctx.beginPath();
      for (i = 0; i < 10; i++) {
        var rr = (i % 2 === 0) ? s * 0.46 : s * 0.20;
        a = -Math.PI / 2 + (i * Math.PI) / 5;
        var px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
      }
      ctx.closePath(); ctx.fill();
    } else if (tier === 6) {                // Perla
      var grd = ctx.createRadialGradient(-s * 0.14, -s * 0.16, s * 0.06, 0, 0, s * 0.46);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.55, ink);
      grd.addColorStop(1, ink);
      ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.18, s * 0.10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    } else {                                // Arrecife
      for (i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.30 - s * 0.17, s * 0.34);
        ctx.lineTo(i * s * 0.30, -s * 0.30 + Math.abs(i) * s * 0.16);
        ctx.lineTo(i * s * 0.30 + s * 0.17, s * 0.34);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, s * 0.30, s * 0.13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.w = 0; this.h = 0;
    this.game = null;
    this.view = [];
    this.popups = [];
    this.tideFlash = 0;
    this.wavePhase = 0;
    this.last = 0;
    this.slideDur = 0.16;   // segundos
    this.resize();
  }

  Renderer.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.w = Math.max(1, Math.round(rect.width));
    this.h = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.metrics = this.computeMetrics();
  };

  Renderer.prototype.computeMetrics = function () {
    var pad = Math.round(Math.min(this.w, this.h) * 0.045);
    var availW = this.w - pad * 2;
    var availH = this.h - pad * 2;
    var cell = Math.floor(Math.min(availW / COLS, availH / ROWS));
    var boardW = cell * COLS, boardH = cell * ROWS;
    return {
      pad: pad,
      cell: cell,
      boardX: Math.round((this.w - boardW) / 2),
      boardY: Math.round((this.h - boardH) / 2),
      boardW: boardW,
      boardH: boardH,
      gap: Math.max(3, Math.round(cell * 0.08))
    };
  };

  Renderer.prototype.cellCenter = function (r, c) {
    var m = this.metrics;
    return {
      x: m.boardX + c * m.cell + m.cell / 2,
      y: m.boardY + r * m.cell + m.cell / 2
    };
  };

  Renderer.prototype.setGame = function (game) {
    this.game = game;
    this.syncFromGame(game, null);
  };

  /* Reconstruye la vista desde la rejilla, interpolando posiciones. */
  Renderer.prototype.syncFromGame = function (game, hints) {
    this.game = game;
    var prev = {};
    this.view.forEach(function (v) { prev[v.id] = v; });
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var t = game.grid[r][c];
        if (!t) { continue; }
        var hint = hints ? hints[t.id] : null;
        var old = prev[t.id];
        var fr, fc, spawn = false;
        if (hint) { fr = hint.from.r; fc = hint.from.c; }
        else if (old) { fr = old.vr; fc = old.vc; }
        else { fr = r + 1; fc = c; spawn = true; }
        out.push({
          id: t.id,
          tier: t.tier,
          fr: fr, fc: fc,
          tr: r, tc: c,
          vr: fr, vc: fc,
          t: (fr === r && fc === c) ? 1 : 0,
          scale: spawn ? 0 : 1,
          pop: (hint && hint.fresh) ? 1 : 0
        });
      }
    }
    this.view = out;
  };

  Renderer.prototype.applyMove = function (event, game) {
    var hints = {};
    (event.movements || []).forEach(function (mv) {
      hints[mv.id] = { from: mv.from[0], fresh: mv.fresh };
    });
    this.syncFromGame(game, hints);
    if (event.rose) { this.tideFlash = 1; }
  };

  Renderer.prototype.addPopup = function (r, c, text, color) {
    var p = this.cellCenter(r, c);
    this.popups.push({ x: p.x, y: p.y, text: text, color: color || P.gold, t: 0 });
  };

  Renderer.prototype.update = function (dt) {
    var dur = this.slideDur;
    this.view.forEach(function (v) {
      if (v.t < 1) {
        v.t = clamp(v.t + dt / dur, 0, 1);
        var e = easeOut(v.t);
        v.vr = lerp(v.fr, v.tr, e);
        v.vc = lerp(v.fc, v.tc, e);
      }
      if (v.scale < 1) { v.scale = clamp(v.scale + dt * 6, 0, 1); }
      if (v.pop > 0) { v.pop = clamp(v.pop - dt * 2.6, 0, 1); }
    });
    this.popups = this.popups.filter(function (p) { p.t += dt * 1.1; return p.t < 1; });
    if (this.tideFlash > 0) { this.tideFlash = clamp(this.tideFlash - dt * 0.9, 0, 1); }
    this.wavePhase += dt;
  };

  /* --- Fondo -------------------------------------------------------------- */
  Renderer.prototype.drawBackground = function () {
    var ctx = this.ctx;
    var g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0a2c38');
    g.addColorStop(0.55, P.deep);
    g.addColorStop(1, '#03151b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    // Rayos de luz suaves
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#d9f7ff';
    for (var i = 0; i < 5; i++) {
      var x = (this.w / 5) * i + Math.sin(this.wavePhase * 0.3 + i) * 14;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 46, 0);
      ctx.lineTo(x + 130, this.h);
      ctx.lineTo(x + 30, this.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  Renderer.prototype.drawBoard = function () {
    var ctx = this.ctx, m = this.metrics, game = this.game;
    ctx.save();
    roundRect(ctx, m.boardX - m.gap, m.boardY - m.gap, m.boardW + m.gap * 2, m.boardH + m.gap * 2, m.cell * 0.18);
    ctx.fillStyle = 'rgba(4,34,43,.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(47,163,201,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Huecos vacíos
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var p = this.cellCenter(r, c);
        roundRect(ctx, p.x - m.cell / 2 + m.gap / 2, p.y - m.cell / 2 + m.gap / 2,
          m.cell - m.gap, m.cell - m.gap, m.cell * 0.20);
        ctx.fillStyle = 'rgba(255,255,255,.045)';
        ctx.fill();
      }
    }

    // Nivel de la marea dentro del tablero
    if (game && game.tideMax) {
      var ratio = clamp(game.tide / game.tideMax, 0, 1);
      var waterH = m.boardH * ratio * 0.86;
      if (waterH > 0) {
        ctx.save();
        roundRect(ctx, m.boardX - m.gap, m.boardY - m.gap, m.boardW + m.gap * 2, m.boardH + m.gap * 2, m.cell * 0.18);
        ctx.clip();
        var wg = ctx.createLinearGradient(0, m.boardY + m.boardH - waterH, 0, m.boardY + m.boardH);
        wg.addColorStop(0, 'rgba(47,163,201,.06)');
        wg.addColorStop(1, 'rgba(18,86,107,.42)');
        ctx.fillStyle = wg;
        var surfaceY = m.boardY + m.boardH - waterH;
        ctx.beginPath();
        ctx.moveTo(m.boardX - m.gap, surfaceY);
        for (var x = 0; x <= m.boardW + m.gap * 2; x += 8) {
          ctx.lineTo(m.boardX - m.gap + x, surfaceY + Math.sin((x / 34) + this.wavePhase * 2.2) * 4);
        }
        ctx.lineTo(m.boardX + m.boardW + m.gap, m.boardY + m.boardH + m.gap);
        ctx.lineTo(m.boardX - m.gap, m.boardY + m.boardH + m.gap);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    if (this.tideFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.tideFlash * 0.35;
      ctx.fillStyle = P.danger;
      roundRect(ctx, m.boardX - m.gap, m.boardY - m.gap, m.boardW + m.gap * 2, m.boardH + m.gap * 2, m.cell * 0.18);
      ctx.fill();
      ctx.restore();
    }
  };

  Renderer.prototype.drawTiles = function () {
    var ctx = this.ctx, m = this.metrics;
    var self = this;
    this.view.slice().sort(function (a, b) { return (a.tr - b.tr) || (a.tc - b.tc); }).forEach(function (v) {
      var info = M.tierInfo(v.tier);
      var cx = m.boardX + v.vc * m.cell + m.cell / 2;
      var cy = m.boardY + v.vr * m.cell + m.cell / 2;
      var size = (m.cell - m.gap) * (1 + 0.16 * Math.sin(Math.PI * (1 - v.pop)));
      size *= v.scale;

      ctx.save();
      ctx.shadowColor = info.glow;
      ctx.shadowBlur = 14 * (0.4 + v.pop);
      roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.22);
      var lg = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
      lg.addColorStop(0, info.glow);
      lg.addColorStop(1, info.color);
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.restore();

      roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.22);
      ctx.strokeStyle = 'rgba(255,255,255,.30)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      glyph(ctx, v.tier, cx, cy, size * 0.62, 'rgba(6,32,40,.72)');
    });
  };

  Renderer.prototype.drawPopups = function () {
    var ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 ' + Math.max(13, Math.round(this.metrics.cell * 0.30)) + 'px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    this.popups.forEach(function (p) {
      ctx.globalAlpha = 1 - p.t;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = 'rgba(4,26,34,.85)';
      ctx.lineWidth = 3;
      var y = p.y - p.t * 38;
      ctx.strokeText(p.text, p.x, y);
      ctx.fillText(p.text, p.x, y);
    });
    ctx.restore();
  };

  Renderer.prototype.render = function (now) {
    var ts = now ? now / 1000 : 0;
    var dt = this.last ? Math.min(0.05, ts - this.last) : 0.016;
    this.last = ts;
    this.update(dt);
    this.drawBackground();
    this.drawBoard();
    this.drawTiles();
    this.drawPopups();
  };

  M.Renderer = Renderer;
  M.roundRect = roundRect;
})(window.MAREA);
