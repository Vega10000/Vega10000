/* =========================================================================
   audio.js — original hip-hop / R&B engine, synthesised live in the browser.

   WHY SYNTHESISED, NOT MP3s
   -------------------------
   Shipping commercial hip-hop would be copyright infringement, and a fixed
   audio file cannot follow gameplay. Everything here is generated from
   oscillators and noise at runtime: 808s, trap hats, boom-bap kits and
   Rhodes-style seventh chords. That makes it original, free to distribute,
   and — the part that matters — it doubles as the game's master clock, so
   every note in a drill is guaranteed to land on the beat.

   The scheduler is the standard Web Audio lookahead pattern: a coarse timer
   wakes up often and schedules sample-accurate events a little ahead of the
   playhead, because setTimeout is far too jittery to sequence music with.
   ========================================================================= */

(function (global) {
  'use strict';

  var ctx = null, master = null, comp = null;
  var bus = {};                 // named gain nodes: drums, bass, keys, lead, sfx
  var duck = null;              // sidechain-style gain the kick dips
  var ready = false, musicOn = true, sfxOn = true;

  var LOOKAHEAD = 0.12;         // seconds scheduled ahead of the playhead
  var TICK_MS = 25;
  var timer = null;

  var cur = null;               // current style definition
  var intensity = 0.5;          // 0..1 — how much of the arrangement plays
  var startTime = 0;            // ctx time the loop began
  var nextStep = 0;             // next 16th-note index to schedule
  var stepsPerBeat = 4;

  /* ---------------------------------------------------------------- utils */
  function db(x) { return Math.pow(10, x / 20); }

  function env(param, t, a, d, peak, sustain, rel, dur) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    if (sustain !== undefined && dur) {
      param.exponentialRampToValueAtTime(Math.max(sustain, 0.0002), t + a + d);
      param.setValueAtTime(Math.max(sustain, 0.0002), t + dur);
      param.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    } else {
      param.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
  }

  var noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = b;
    }
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    return s;
  }

  /* Gentle saturation — gives the 808 and the master glue some weight. */
  var shaperCurve = null;
  function saturator(amount) {
    if (!shaperCurve) {
      var n = 1024, c = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        var x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * 2.2);
      }
      shaperCurve = c;
    }
    var ws = ctx.createWaveShaper();
    ws.curve = shaperCurve; ws.oversample = '2x';
    return ws;
  }

  /* ------------------------------------------------------------ the kit */
  function kick(t, gain) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    env(g.gain, t, 0.002, 0.34, (gain || 1) * 0.95);
    o.connect(g).connect(bus.drums);
    o.start(t); o.stop(t + 0.42);

    /* transient click so it cuts through on laptop speakers */
    var c = noise(), cg = ctx.createGain(), cf = ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 1800;
    env(cg.gain, t, 0.001, 0.02, (gain || 1) * 0.16);
    c.connect(cf).connect(cg).connect(bus.drums);
    c.start(t); c.stop(t + 0.05);

    /* sidechain dip: the pocket that makes hip-hop breathe */
    if (duck) {
      duck.gain.cancelScheduledValues(t);
      duck.gain.setValueAtTime(1, t);
      duck.gain.linearRampToValueAtTime(0.62, t + 0.02);
      duck.gain.linearRampToValueAtTime(1, t + 0.20);
    }
  }

  function sub808(t, freq, dur, glideFrom) {
    var o = ctx.createOscillator(), g = ctx.createGain(), sat = saturator();
    o.type = 'sine';
    if (glideFrom) {
      o.frequency.setValueAtTime(glideFrom, t);
      o.frequency.exponentialRampToValueAtTime(freq, t + 0.07);
    } else {
      o.frequency.setValueAtTime(freq, t);
    }
    env(g.gain, t, 0.006, 0.10, 0.85, 0.55, 0.12, dur);
    o.connect(sat).connect(g).connect(bus.bass);
    o.start(t); o.stop(t + dur + 0.2);
  }

  function snare(t, gain) {
    var n = noise(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
    nf.type = 'highpass'; nf.frequency.value = 1400;
    env(ng.gain, t, 0.001, 0.16, (gain || 1) * 0.5);
    n.connect(nf).connect(ng).connect(bus.drums);
    n.start(t); n.stop(t + 0.2);

    var o = ctx.createOscillator(), g = ctx.createGain();   // tuned body
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    env(g.gain, t, 0.001, 0.10, (gain || 1) * 0.34);
    o.connect(g).connect(bus.drums);
    o.start(t); o.stop(t + 0.16);
  }

  function clap(t, gain) {
    /* Four tight noise bursts — the classic clap "spread". */
    [0, 0.011, 0.021, 0.032].forEach(function (off, i) {
      var n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.1;
      env(g.gain, t + off, 0.001, i === 3 ? 0.17 : 0.03, (gain || 1) * (i === 3 ? 0.42 : 0.28));
      n.connect(f).connect(g).connect(bus.drums);
      n.start(t + off); n.stop(t + off + 0.2);
    });
  }

  function hat(t, open, gain) {
    var n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 7800;
    env(g.gain, t, 0.001, open ? 0.19 : 0.033, (gain || 1) * (open ? 0.20 : 0.16));
    n.connect(f).connect(g).connect(bus.drums);
    n.start(t); n.stop(t + (open ? 0.26 : 0.07));
  }

  function rim(t, gain) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(400, t);
    env(g.gain, t, 0.001, 0.035, (gain || 1) * 0.18);
    o.connect(g).connect(bus.drums);
    o.start(t); o.stop(t + 0.06);
  }

  /* --------------------------------------------------------- tonal parts */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* Rhodes-ish: a fundamental plus a detuned octave and a bell partial,
     rolled off with a lowpass and wobbled with tremolo. */
  function rhodes(t, midi, dur, gain) {
    var out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2100; lp.Q.value = 0.6;
    env(out.gain, t, 0.015, 0.30, (gain || 1) * 0.20, (gain || 1) * 0.10, 0.35, dur);

    [[1, 1], [2.01, 0.34], [3.0, 0.12]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = mtof(midi) * p[0];
      o.detune.value = (Math.random() * 8 - 4);
      g.gain.value = p[1];
      o.connect(g).connect(lp);
      o.start(t); o.stop(t + dur + 0.5);
    });

    var trem = ctx.createOscillator(), tg = ctx.createGain();
    trem.type = 'sine'; trem.frequency.value = 4.6; tg.gain.value = 0.06;
    trem.connect(tg).connect(out.gain);
    trem.start(t); trem.stop(t + dur + 0.5);

    lp.connect(out).connect(bus.keys);
  }

  function lead(t, midi, dur, gain) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator();
    var g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3000;
    o.type = 'triangle'; o2.type = 'triangle';
    o.frequency.value = mtof(midi); o2.frequency.value = mtof(midi); o2.detune.value = 9;
    env(g.gain, t, 0.012, 0.14, (gain || 1) * 0.16, (gain || 1) * 0.09, 0.18, dur);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(bus.lead);
    o.start(t); o2.start(t); o.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
  }

  /* ------------------------------------------------------------- styles */
  /* Patterns are 16 steps (one bar of 16ths). 'x' = hit, '-' = rest.
     Chords are MIDI note arrays, one per bar. */
  var STYLES = {
    /* Slow R&B for warm-ups and stretching. */
    chill: {
      bpm: 78, swing: 0.14, bars: 4,
      kick:  ['x-------x-------', 'x-----x---------', 'x-------x-------', 'x-----x-----x---'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x-------x-x-'],
      hat:   ['--x---x---x---x-', '--x---x---x---x-', '--x---x---x---x-', '--x---x---x-x-x-'],
      openHat: '------------x---',
      chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]],
      bassLine: [45, 41, 43, 40],
      leadMotif: null, clapInsteadOfSnare: false
    },
    /* Swung boom-bap for the technique drills. */
    boombap: {
      bpm: 92, swing: 0.20, bars: 4,
      kick:  ['x-----x---x-----', 'x-----x-------x-', 'x-----x---x-----', 'x---x-----x-x---'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x-------x-x-'],
      hat:   ['x-x-x-x-x-x-x-x-', 'x-x-x-x-x-x-x-x-', 'x-x-x-x-x-x-x-x-', 'x-x-x-x-x-xxx-x-'],
      openHat: '----------x-----',
      chords: [[57, 60, 64, 67], [50, 53, 57, 60], [55, 58, 62, 65], [50, 53, 57, 60]],
      bassLine: [45, 38, 43, 38],
      leadMotif: [[0, 72, 0.5], [2, 76, 0.5], [6, 74, 0.75], [10, 72, 1.0]],
      clapInsteadOfSnare: false
    },
    /* Half-time trap for tumbling — rolling hats and gliding 808s. */
    trap: {
      bpm: 140, swing: 0.0, bars: 4,
      kick:  ['x-------x---x---', 'x-----x-----x---', 'x-------x---x---', 'x---x---x-x-x---'],
      snare: ['--------x-------', '--------x-------', '--------x-------', '--------x---x-x-'],
      hat:   ['xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx'],
      hatRolls: [[3, 3], [11, 6], [27, 3], [56, 8]],   // [stepIndexInLoop, subdivisions]
      openHat: '--------------x-',
      chords: [[45, 48, 52, 55], [43, 46, 50, 53], [41, 44, 48, 51], [43, 46, 50, 53]],
      bassLine: [33, 31, 29, 31], glide: true,
      leadMotif: [[0, 69, 0.75], [6, 72, 0.5], [8, 71, 1.0], [24, 69, 0.5], [30, 67, 1.0]],
      clapInsteadOfSnare: true
    },
    /* Bright, big anthem for the Showcase. */
    showcase: {
      bpm: 104, swing: 0.08, bars: 4,
      kick:  ['x---x---x---x---', 'x---x---x---x---', 'x---x---x---x---', 'x---x---x-x-x---'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x---x---x-x-'],
      hat:   ['x-xxx-x-x-xxx-x-', 'x-xxx-x-x-xxx-x-', 'x-xxx-x-x-xxx-x-', 'x-xxx-x-xxxxx-x-'],
      openHat: '------------x---',
      chords: [[53, 57, 60, 64], [55, 59, 62, 65], [57, 60, 64, 67], [52, 55, 59, 62]],
      bassLine: [41, 43, 45, 40],
      leadMotif: [[0, 76, 0.5], [4, 79, 0.5], [8, 77, 0.75], [14, 76, 0.5],
                  [16, 74, 0.5], [22, 72, 1.0], [32, 76, 0.5], [40, 81, 1.5]],
      clapInsteadOfSnare: true
    },

    /* Funk for the Coordination Zone — syncopated, busy, playful. */
    funk: {
      bpm: 104, swing: 0.18, bars: 4,
      kick:  ['x--x--x---x-x---', 'x--x--x-----x---', 'x--x--x---x-x---', 'x--x--x-x-x-x-x-'],
      snare: ['----x-------x---', '----x-------x-x-', '----x-------x---', '----x---x---x-x-'],
      hat:   ['x-xxx-x-x-xxx-x-', 'x-xxx-x-x-xxx-x-', 'x-xxx-x-x-xxx-x-', 'xxxxx-x-xxxxx-x-'],
      openHat: '--------x-------',
      chords: [[52, 55, 59, 62], [50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 59]],
      bassLine: [40, 38, 43, 36],
      leadMotif: [[0, 76, 0.25], [2, 74, 0.25], [4, 71, 0.5], [10, 76, 0.25],
                  [12, 79, 0.75], [26, 74, 0.5], [36, 71, 0.5], [44, 76, 1.0]],
      clapInsteadOfSnare: false
    },
    /* Bright pop for the Choreography Studio. */
    pop: {
      bpm: 118, swing: 0.04, bars: 4,
      kick:  ['x---x---x---x---', 'x---x---x---x---', 'x---x---x---x---', 'x---x---x-x-x---'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x---x---x-x-'],
      hat:   ['x-x-x-x-x-x-x-x-', 'x-x-x-x-x-x-x-x-', 'x-x-x-x-x-x-x-x-', 'x-x-x-x-xxx-x-x-'],
      openHat: '------------x---',
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67]],
      bassLine: [45, 41, 43, 48],
      leadMotif: [[0, 81, 0.5], [4, 79, 0.5], [8, 76, 0.75], [16, 77, 0.5],
                  [20, 81, 0.5], [32, 79, 0.5], [40, 84, 1.25]],
      clapInsteadOfSnare: true
    },
    /* Afrobeat-inspired instrumental — rolling, warm, percussive. */
    afrobeat: {
      bpm: 108, swing: 0.10, bars: 4,
      kick:  ['x-----x---x-----', 'x-----x---x-----', 'x-----x---x-----', 'x-----x---x-x-x-'],
      snare: ['--------x-------', '--------x-----x-', '--------x-------', '--------x---x-x-'],
      hat:   ['x-xx-xx-x-xx-xx-', 'x-xx-xx-x-xx-xx-', 'x-xx-xx-x-xx-xx-', 'x-xx-xxxx-xx-xx-'],
      openHat: '----x-------x---',
      chords: [[57, 61, 64], [55, 59, 62], [52, 56, 59], [55, 59, 62]],
      bassLine: [45, 43, 40, 43],
      leadMotif: [[0, 76, 0.25], [3, 78, 0.25], [6, 81, 0.5], [14, 76, 0.5],
                  [22, 73, 0.5], [30, 76, 0.75], [38, 81, 0.5], [46, 78, 1.0]],
      clapInsteadOfSnare: false
    },
    /* Electronic for high-energy drills. */
    electronic: {
      bpm: 126, swing: 0, bars: 4,
      kick:  ['x---x---x---x---', 'x---x---x---x---', 'x---x---x---x---', 'x---x---x---x-x-'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x---x---x-x-'],
      hat:   ['--x---x---x---x-', 'x-x-x-x-x-x-x-x-', '--x---x---x---x-', 'xxx-xxx-xxx-xxx-'],
      openHat: '--------------x-',
      chords: [[45, 48, 52, 55], [48, 52, 55, 59], [43, 46, 50, 53], [50, 53, 57, 60]],
      bassLine: [33, 36, 31, 38],
      leadMotif: [[0, 72, 0.25], [2, 72, 0.25], [4, 75, 0.5], [8, 79, 0.5],
                  [16, 77, 0.25], [18, 77, 0.25], [20, 74, 0.75], [32, 72, 0.5], [40, 84, 1.0]],
      clapInsteadOfSnare: true
    },
    /* Low-key loop for the hub, so menus are not silent. */
    menu: {
      bpm: 86, swing: 0.16, bars: 4,
      kick:  ['x-------x-------', 'x-------x-------', 'x-------x-------', 'x-------x---x---'],
      snare: ['----x-------x---', '----x-------x---', '----x-------x---', '----x-------x---'],
      hat:   ['--x---x---x---x-', '--x---x---x---x-', '--x---x---x---x-', '--x---x---x---x-'],
      openHat: '',
      chords: [[57, 60, 64, 67], [55, 59, 62, 65], [53, 57, 60, 64], [55, 59, 62, 65]],
      bassLine: [45, 43, 41, 43],
      leadMotif: null, clapInsteadOfSnare: false
    }
  };

  /* Rooms pick a genre; these map onto the kits above. */
  var ALIASES = { hiphop: 'boombap', rnb: 'chill', cinematic: 'showcase' };
  function resolveStyle(name) {
    return STYLES[name] || STYLES[ALIASES[name]] || STYLES.menu;
  }

  /* ------------------------------------------------------------ scheduler */
  function stepTime(step) {
    var spb = 60 / cur.bpm;                 // seconds per beat
    var base = startTime + step * (spb / stepsPerBeat);
    /* Swing: push every offbeat 16th later by a fraction of a 16th. */
    if (cur.swing && step % 2 === 1) base += cur.swing * (spb / stepsPerBeat);
    return base;
  }

  function scheduleStep(step) {
    var loopLen = cur.bars * 16;
    var s = ((step % loopLen) + loopLen) % loopLen;
    var bar = Math.floor(s / 16), i = s % 16;
    var t = stepTime(step);

    if (cur.kick[bar] && cur.kick[bar][i] === 'x') kick(t, 1);

    var sn = cur.snare[bar] && cur.snare[bar][i] === 'x';
    if (sn) { if (cur.clapInsteadOfSnare) clap(t, 1); else snare(t, 1); }

    if (cur.hat[bar] && cur.hat[bar][i] === 'x') {
      var rolled = false;
      if (cur.hatRolls) {
        for (var r = 0; r < cur.hatRolls.length; r++) {
          if (cur.hatRolls[r][0] === s) {
            var n = cur.hatRolls[r][1], spb2 = 60 / cur.bpm, span = spb2 / stepsPerBeat;
            for (var k = 0; k < n; k++) hat(t + (k * span / n), false, 0.55 + k * 0.05);
            rolled = true;
          }
        }
      }
      if (!rolled) hat(t, false, i % 4 === 0 ? 1 : 0.7);
    }
    if (cur.openHat && cur.openHat[i] === 'x') hat(t, true, 0.8);
    if (i === 6 && bar % 2 === 1) rim(t, 0.7);

    /* Chords land on the downbeat of each bar and ring for the bar. */
    if (i === 0) {
      var spbar = (60 / cur.bpm) * 4;
      var chord = cur.chords[bar % cur.chords.length];
      chord.forEach(function (m, ci) {
        rhodes(t + ci * 0.012, m, spbar * 0.92, 1);
      });
      var bn = cur.bassLine[bar % cur.bassLine.length];
      sub808(t, mtof(bn), spbar * 0.55, cur.glide ? mtof(bn) * 0.66 : 0);
    }
    /* A second bass note mid-bar keeps the low end moving. */
    if (i === 10) {
      var bn2 = cur.bassLine[bar % cur.bassLine.length];
      sub808(t, mtof(bn2 + (bar % 2 ? 0 : 3)), (60 / cur.bpm) * 0.9, 0);
    }

    /* Arrangement layers gate on intensity, so a strong run literally
       sounds fuller than a shaky one. */
    if (cur.leadMotif && intensity >= 0.55) {
      cur.leadMotif.forEach(function (nte) {
        if (nte[0] === s) lead(t, nte[1], (60 / cur.bpm) * nte[2], Math.min(1, intensity + 0.2));
      });
    }
    if (intensity >= 0.8 && (i === 14 || i === 6) && bar % 2 === 1) clap(t, 0.5);
    if (intensity >= 0.92 && i === 12 && bar === 3) hat(t, true, 0.9);
  }

  function tick() {
    if (!ready || !cur) return;
    var horizon = ctx.currentTime + LOOKAHEAD;
    var guard = 0;
    while (stepTime(nextStep) < horizon && guard++ < 128) {
      if (musicOn) scheduleStep(nextStep);
      nextStep++;
    }
  }

  /* ------------------------------------------------------------ lifecycle */
  function init() {
    if (ctx) return true;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }

    master = ctx.createGain(); master.gain.value = db(-5);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 22;
    comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.22;

    duck = ctx.createGain(); duck.gain.value = 1;

    bus.drums = ctx.createGain(); bus.drums.gain.value = db(-2);
    bus.bass  = ctx.createGain(); bus.bass.gain.value  = db(-4);
    bus.keys  = ctx.createGain(); bus.keys.gain.value  = db(-8);
    bus.lead  = ctx.createGain(); bus.lead.gain.value  = db(-11);
    bus.sfx   = ctx.createGain(); bus.sfx.gain.value   = db(-4);

    /* Only the tonal buses duck — ducking the drums would kill the groove. */
    bus.bass.connect(duck); bus.keys.connect(duck); bus.lead.connect(duck);
    duck.connect(comp);
    bus.drums.connect(comp);
    bus.sfx.connect(comp);
    comp.connect(master).connect(ctx.destination);

    ready = true;
    if (!timer) timer = setInterval(tick, TICK_MS);
    return true;
  }

  function resume() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function play(styleName) {
    var s = resolveStyle(styleName);
    /* The clock must restart even when there is no audio device, otherwise a
       muted or unsupported browser would chart notes against a stale epoch. */
    if (!init()) {
      if (fallbackStyle !== s) {
        fallbackStyle = s;
        fallbackStart = (global.performance && performance.now()) || Date.now();
      }
      return;
    }
    resume();
    fallbackStyle = s;
    if (cur === s) return;                   // already playing this style
    cur = s;
    startTime = ctx.currentTime + 0.08;
    nextStep = 0;
  }

  function stop() {
    cur = null;
  }

  /* -------------------------------------------------------- game clock */
  /* Beats elapsed since the loop started. game.js charts against this so the
     notes and the music can never drift apart. Falls back to a wall clock if
     audio is unavailable, so the game still runs muted. */
  var fallbackStart = (global.performance && performance.now()) || Date.now();
  var fallbackStyle = null;
  function beats() {
    if (ready && cur) return (ctx.currentTime - startTime) * (cur.bpm / 60);
    var ms = ((global.performance && performance.now()) || Date.now()) - fallbackStart;
    return (ms / 1000) * (((fallbackStyle && fallbackStyle.bpm) || 100) / 60);
  }
  function now() { return ready ? ctx.currentTime : (((global.performance && performance.now()) || Date.now()) / 1000); }
  function bpm() { return (cur || fallbackStyle) ? (cur || fallbackStyle).bpm : 100; }

  /* 0..1 position within the current beat — drives the visual pulse. */
  function beatPhase() { var b = beats(); return b - Math.floor(b); }

  /* ------------------------------------------------------------------ sfx */
  function blip(freq, dur, type, gain, sweepTo) {
    if (!ready || !sfxOn) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    env(g.gain, t, 0.004, dur, (gain === undefined ? 1 : gain) * 0.3);
    o.connect(g).connect(bus.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  var SFX = {
    perfect: function () { blip(1320, 0.13, 'sine', 1); blip(1980, 0.16, 'sine', 0.5); },
    great:   function () { blip(990, 0.12, 'sine', 0.85); },
    good:    function () { blip(660, 0.10, 'triangle', 0.7); },
    miss:    function () { blip(190, 0.16, 'sawtooth', 0.35, 110); },
    click:   function () { blip(880, 0.04, 'square', 0.32); },
    back:    function () { blip(440, 0.06, 'square', 0.3, 330); },
    star:    function () { [0, 90, 180].forEach(function (d, i) {
                 setTimeout(function () { blip(880 * Math.pow(1.26, i), 0.2, 'sine', 0.8); }, d); }); },
    badge:   function () { [0, 110, 220, 380].forEach(function (d, i) {
                 setTimeout(function () { blip([880, 1108, 1318, 1760][i], 0.28, 'sine', 0.9); }, d); }); },
    /* Crowd: filtered noise swell. Cheap, and surprisingly convincing. */
    cheer:   function (len) {
      if (!ready || !sfxOn) return;
      var t = ctx.currentTime, n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      len = len || 1.8;
      f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.7;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.30, t + 0.28);
      g.gain.setValueAtTime(0.30, t + len * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 7.5; lg.gain.value = 260;
      lfo.connect(lg).connect(f.frequency);
      n.connect(f).connect(g).connect(bus.sfx);
      n.start(t); n.stop(t + len + 0.1);
      lfo.start(t); lfo.stop(t + len + 0.1);
    },
    whoosh: function () {
      if (!ready || !sfxOn) return;
      var t = ctx.currentTime, n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.22);
      env(g.gain, t, 0.02, 0.24, 0.22);
      n.connect(f).connect(g).connect(bus.sfx);
      n.start(t); n.stop(t + 0.3);
    }
  };

  global.AcroAudio = {
    init: init, resume: resume, play: play, stop: stop,
    sfx: SFX,
    beats: beats, beatPhase: beatPhase, bpm: bpm, now: now,
    isReady: function () { return ready; },
    setMusic: function (on) {
      musicOn = !!on;
      if (master) master.gain.setTargetAtTime(on ? db(-5) : db(-60), ctx.currentTime, 0.05);
      if (!on && ready) { /* keep the clock running so charts stay aligned */ }
    },
    setSfx: function (on) { sfxOn = !!on; },
    /* 0..1. Called live from gameplay as her combo and accuracy climb. */
    setIntensity: function (v) { intensity = Math.max(0, Math.min(1, v)); },
    getIntensity: function () { return intensity; },
    musicVolume: function (v) {
      if (master && ctx) master.gain.setTargetAtTime(db(-5) * v, ctx.currentTime, 0.05);
    },
    styles: Object.keys(STYLES),
    styleBpm: function (n) { return resolveStyle(n).bpm; }
  };
})(window);
