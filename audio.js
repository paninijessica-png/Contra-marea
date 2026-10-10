/* Contramarea — Audio procedural (WebAudio). Sin archivos externos:
 * todo el sonido se sintetiza, así el juego pesa menos y funciona offline. */
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  var ctx = null;
  var master = null;
  var ambient = null;
  var unlocked = false;
  var enabled = true;

  function ensure() {
    if (ctx) { return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return null; }
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function unlock() {
    var c = ensure();
    if (!c) { return; }
    if (c.state === 'suspended') { c.resume(); }
    unlocked = true;
  }

  function tone(freq, dur, type, gain, when) {
    if (!enabled) { return; }
    var c = ensure();
    if (!c || !unlocked) { return; }
    var t0 = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function slide(f1, f2, dur, type, gain) {
    if (!enabled) { return; }
    var c = ensure();
    if (!c || !unlocked) { return; }
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain, filterFreq) {
    if (!enabled) { return; }
    var c = ensure();
    if (!c || !unlocked) { return; }
    var frames = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, frames, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < frames; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / frames); }
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq || 900;
    var g = c.createGain(); g.gain.value = gain || 0.14;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  var Audio = {
    init: function (soundOn) { enabled = soundOn !== false; ensure(); },
    unlock: unlock,
    setEnabled: function (on) { enabled = !!on; if (!on) { Audio.stopAmbient(); } },
    isEnabled: function () { return enabled; },

    /* --- Efectos --- */
    slide: function () { slide(320, 180, 0.12, 'triangle', 0.10); },
    merge: function (combo) {
      var base = 420 + Math.min(6, combo || 1) * 90;
      tone(base, 0.16, 'sine', 0.20, 0);
      tone(base * 1.5, 0.14, 'sine', 0.12, 0.05);
      if ((combo || 1) > 1) { tone(base * 2, 0.18, 'triangle', 0.10, 0.10); }
    },
    tide: function () { noise(0.7, 0.18, 620); slide(180, 90, 0.7, 'sine', 0.10); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.32, 'sine', 0.16, i * 0.11); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.34, 'triangle', 0.15, i * 0.13); }); },
    tap: function () { tone(660, 0.06, 'square', 0.07, 0); },
    coin: function () { tone(1046, 0.09, 'square', 0.10, 0); tone(1568, 0.12, 'square', 0.08, 0.07); },
    error: function () { tone(180, 0.18, 'sawtooth', 0.10, 0); },

    /* --- Ambiente (loop suave) --- */
    startAmbient: function () {
      if (!enabled || ambient) { return; }
      var c = ensure();
      if (!c || !unlocked) { return; }
      var g = c.createGain(); g.gain.value = 0.05; g.connect(master);
      var osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = 110;
      var lfo = c.createOscillator(); lfo.frequency.value = 0.08;
      var lfoGain = c.createGain(); lfoGain.gain.value = 22;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(g);
      osc.start(); lfo.start();
      ambient = { osc: osc, lfo: lfo, gain: g };
    },
    stopAmbient: function () {
      if (!ambient) { return; }
      try { ambient.osc.stop(); ambient.lfo.stop(); } catch (e) {}
      ambient = null;
    }
  };

  M.Audio = Audio;
})(window.MAREA);
