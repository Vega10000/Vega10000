/* =========================================================================
   game.js — the drill engine.

   The music is the clock. Every note is placed at a beat position and judged
   against AcroAudio.beats(), never against a wall-clock timer, so the chart
   physically cannot drift out of sync with the track.

   No fail state anywhere. A 9-year-old learning acro should never be told
   "you lose" by a practice tool — a weak run just earns fewer stars, and
   Coach Nova tells her what to fix.
   ========================================================================= */

(function (global) {
  'use strict';

  var LANE_KEYS = [
    ['a', 'arrowleft'],
    ['s', 'arrowdown'],
    ['d', 'arrowup'],
    ['f', 'arrowright']
  ];
  var LANE_LABEL = ['A', 'S', 'D', 'F'];

  /* Judgment windows in seconds. Generous by rhythm-game standards, on
     purpose: this is a practice toy, not a test of reflexes. */
  var W_PERFECT = 0.085, W_GREAT = 0.150, W_GOOD = 0.215;
  var LOOKAHEAD_BEATS = 5.5;
  var COUNT_IN_BEATS = 8;

  var VALUE = { perfect: 300, great: 200, good: 100, miss: 0 };
  var JUDGE_COLOR = {
    perfect: '#ffe97a', great: '#7dffb8', good: '#4fd1ff', miss: '#ff6b8a'
  };

  /* Deterministic RNG: the same level always charts the same way, so she can
     actually learn a routine instead of fighting a new one every attempt. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* --------------------------------------------------------- chart build */
  function buildChart(level) {
    var rand = rng(hash(level.id));
    var pool = level.skills.map(function (id) { return AcroSkills.byId(id); });
    var holds = pool.filter(function (s) { return s.type === 'hold'; });
    var taps = pool.filter(function (s) { return s.type === 'tap'; });
    var notes = [];
    var laneFree = [0, 0, 0, 0];
    /* Strong beats first — notes on the downbeat feel musical, notes on the
       'e' of 4 feel random. */
    var SLOTS = [0, 2, 1, 3, 0.5, 2.5, 1.5, 3.5];

    for (var bar = 0; bar < level.bars; bar++) {
      var startBeat = COUNT_IN_BEATS + bar * 4;
      /* ramp density up over the level so it opens gently and builds */
      var ramp = 0.55 + 0.45 * (bar / Math.max(1, level.bars - 1));
      var want = Math.max(1, Math.round(level.density * ramp));
      var slots = SLOTS.slice(0, Math.min(SLOTS.length, want + 2));
      shuffleTail(slots, rand, want);

      for (var n = 0; n < want && n < slots.length; n++) {
        var beat = startBeat + slots[n];
        var useHold = holds.length && (rand() < level.holdBias || !taps.length);
        var skill = useHold
          ? holds[(rand() * holds.length) | 0]
          : taps[(rand() * taps.length) | 0];
        if (!skill) continue;

        var lane = skill.lane;
        var dur = 0;
        if (skill.type === 'hold') dur = rand() < 0.45 ? 2 : 1.5;

        /* keep one lane from stacking on top of itself */
        if (beat < laneFree[lane]) continue;
        laneFree[lane] = beat + dur + 0.55;

        notes.push({
          beat: beat, skill: skill, lane: lane,
          type: skill.type, dur: dur,
          judged: false, judgment: null,
          holding: false, holdStart: 0, holdCredit: 0, broke: false
        });
      }
    }
    notes.sort(function (a, b) { return a.beat - b.beat; });

    var maxRaw = 0;
    notes.forEach(function (n) {
      maxRaw += VALUE.perfect + (n.type === 'hold' ? n.dur * 120 : 0);
    });

    return {
      notes: notes,
      maxRaw: maxRaw || 1,
      endBeat: COUNT_IN_BEATS + level.bars * 4 + 3
    };
  }

  function shuffleTail(arr, rand, keep) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (rand() * (i + 1)) | 0;
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    arr.length = Math.min(arr.length, Math.max(keep, 1));
    arr.sort(function (a, b) { return a - b; });
  }

  function hash(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }

  /* ------------------------------------------------------------- engine */
  function Game() {
    this.canvas = null; this.ctx = null;
    this.stage = new AcroStage.Stage();
    this.fx = new AcroFX.FX();
    this.gym = new AcroCharacter.Gymnast({ scale: 1 });
    this.running = false;
    this.level = null;
    this.chart = null;
    this.keyDown = [false, false, false, false];
    this.laneFlash = [0, 0, 0, 0];
    this.coachText = '';
    this.coachTimer = 0;
    this.lastFrame = 0;
    this.onEnd = null;
    this.onCoach = null;
    this.paused = false;
    this._raf = null;
    this._boundKeyDown = null;
    this._boundKeyUp = null;
  }

  Game.prototype.attach = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  };

  Game.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var r = this.canvas.getBoundingClientRect();
    var w = Math.max(320, r.width), h = Math.max(240, r.height);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    /* Scale the athlete to the room so she fills a phone and a desktop alike. */
    /* Scale against whichever axis is tighter, so she fits a tall thin phone
       as comfortably as a wide desktop window. */
    this.gym.scale = Math.max(0.70, Math.min(2.0, Math.min(h / 400, w / 320)));
    /* One factor drives every HUD size, so text never crowds a small screen. */
    this.uiK = Math.max(0.62, Math.min(1, Math.min(w, h) / 760));
  };

  Game.prototype.start = function (levelId, opts) {
    opts = opts || {};
    this.level = AcroLevels.byId(levelId);
    if (!this.level) return;
    this.chart = buildChart(this.level);
    this.stage.setZone(this.level.zone);
    this.fx.clear();
    this.gym.trail.length = 0;
    this.gym.tailInit = false;

    this.score = 0; this.rawScore = 0;
    this.combo = 0; this.bestCombo = 0;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.holdSeconds = 0;
    this.cleanReps = {};
    this.missStreak = 0;
    this.finished = false;
    this.paused = false;
    this.onEnd = opts.onEnd || null;
    this.onCoach = opts.onCoach || null;

    AcroAudio.play(this.level.music);
    this.bpm = AcroAudio.styleBpm(this.level.music);
    this.beat = 0;
    this.lastFrame = 0;

    this.say(AcroCoach.say(AcroCoach.startKeyFor(this.level.family)), 4.5);

    this.bindKeys();
    this.running = true;
    var self = this;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  Game.prototype.stop = function () {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.unbindKeys();
  };

  Game.prototype.say = function (text, secs) {
    if (!text) return;
    this.coachText = text;
    this.coachTimer = secs || 3.2;
    if (this.onCoach) this.onCoach(text);
  };

  /* ------------------------------------------------------------- input */
  Game.prototype.bindKeys = function () {
    var self = this;
    this._boundKeyDown = function (e) {
      var k = e.key.toLowerCase();
      if (k === 'escape') { e.preventDefault(); self.togglePause(); return; }
      for (var i = 0; i < 4; i++) {
        if (LANE_KEYS[i].indexOf(k) !== -1) {
          e.preventDefault();
          if (!self.keyDown[i]) { self.keyDown[i] = true; self.pressLane(i); }
          return;
        }
      }
    };
    this._boundKeyUp = function (e) {
      var k = e.key.toLowerCase();
      for (var i = 0; i < 4; i++) {
        if (LANE_KEYS[i].indexOf(k) !== -1) {
          e.preventDefault();
          self.keyDown[i] = false; self.releaseLane(i);
          return;
        }
      }
    };
    global.addEventListener('keydown', this._boundKeyDown);
    global.addEventListener('keyup', this._boundKeyUp);
  };

  Game.prototype.unbindKeys = function () {
    if (this._boundKeyDown) global.removeEventListener('keydown', this._boundKeyDown);
    if (this._boundKeyUp) global.removeEventListener('keyup', this._boundKeyUp);
    this._boundKeyDown = this._boundKeyUp = null;
  };

  Game.prototype.togglePause = function () {
    this.paused = !this.paused;
    if (this.onPause) this.onPause(this.paused);
  };

  Game.prototype.secPerBeat = function () { return 60 / this.bpm; };

  Game.prototype.pressLane = function (lane) {
    if (!this.running || this.paused || this.finished) return;
    this.laneFlash[lane] = 1;
    var spb = this.secPerBeat();
    var best = null, bestDelta = 1e9;

    for (var i = 0; i < this.chart.notes.length; i++) {
      var n = this.chart.notes[i];
      if (n.judged || n.lane !== lane) continue;
      var delta = Math.abs((n.beat - this.beat) * spb);
      if (delta < bestDelta && delta <= W_GOOD) { best = n; bestDelta = delta; }
      if (n.beat - this.beat > LOOKAHEAD_BEATS) break;
    }
    if (!best) { AcroAudio.sfx.click(); return; }

    var j = bestDelta <= W_PERFECT ? 'perfect' : (bestDelta <= W_GREAT ? 'great' : 'good');
    this.judge(best, j);

    if (best.type === 'hold') {
      best.holding = true;
      best.holdStart = this.beat;
      this.gym.playSkill(best.skill, true);
    } else {
      this.gym.playSkill(best.skill, false);
    }
  };

  Game.prototype.releaseLane = function (lane) {
    if (!this.chart) return;
    for (var i = 0; i < this.chart.notes.length; i++) {
      var n = this.chart.notes[i];
      if (n.holding && n.lane === lane) {
        this.endHold(n, false);
      }
    }
    this.gym.release();
  };

  /* ------------------------------------------------------------ scoring */
  Game.prototype.judge = function (note, j) {
    note.judged = true;
    note.judgment = j;
    this.counts[j]++;

    if (j === 'miss') {
      this.combo = 0;
      this.missStreak++;
      this.fx.popText(this.hitX, this.laneY(note.lane), 'MISS', JUDGE_COLOR.miss, 24);
      AcroAudio.sfx.miss();
      if (this.missStreak === 3) this.say(AcroCoach.say('manyMiss'), 3.4);
      else if (this.missStreak === 1) this.say(AcroCoach.say('miss'), 2.8);
      return;
    }

    this.missStreak = 0;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    var mult = 1 + Math.min(this.combo, 40) / 20;   // caps at 3x
    this.rawScore += VALUE[j];
    this.score += Math.round(VALUE[j] * mult);

    if (j === 'perfect') this.cleanReps[note.skill.id] = (this.cleanReps[note.skill.id] || 0) + 1;

    /* visual + audio reward, scaled to how good the hit was */
    var lx = this.hitX, ly = this.laneY(note.lane);
    var col = JUDGE_COLOR[j];
    this.fx.popText(lx, ly - 10, j.toUpperCase(), col, j === 'perfect' ? 30 : 24);
    this.fx.ring(lx, ly, col, 10, j === 'perfect' ? 84 : 56, 0.42);
    this.fx.burst(lx, ly, col, j === 'perfect' ? 22 : 12, j === 'perfect' ? 1.15 : 0.8);
    AcroAudio.sfx[j]();

    /* sparkle on the athlete herself, plus chalk if she hit the floor */
    if (this.gymPos) {
      this.fx.burst(this.gymPos.x, this.gymPos.y - 30 * this.gym.scale, note.skill.color, 10, 0.7);
      if (note.skill.family === 'Tumbling') {
        this.fx.chalk(this.gymPos.x, this.h * this.stage.floorFrac + 12, 12);
      }
    }
    if (j === 'perfect') this.fx.kick(4, AcroStage.hexA(col, 0.5));

    /* coach reacts to streaks */
    if (this.combo > 0 && this.combo % 25 === 0) {
      this.say(AcroCoach.say('bigStreak'), 3.0);
      this.fx.confetti(this.w, this.h, 40);
      AcroAudio.sfx.star();
    } else if (this.combo > 0 && this.combo % 10 === 0) {
      this.say(AcroCoach.say('streak'), 2.6);
    }
  };

  Game.prototype.endHold = function (note, completed) {
    if (!note.holding) return;
    note.holding = false;
    var held = Math.max(0, this.beat - note.holdStart);
    var frac = Math.max(0, Math.min(1, held / note.dur));
    note.holdCredit = frac;
    this.holdSeconds += held * this.secPerBeat();

    var pts = Math.round(note.dur * 120 * frac);
    this.rawScore += pts;
    this.score += Math.round(pts * (1 + Math.min(this.combo, 40) / 20));

    var ly = this.laneY(note.lane);
    if (frac >= 0.92) {
      this.fx.popText(this.hitX + 50, ly - 8, 'HELD!', '#7dffb8', 22);
      this.fx.burst(this.hitX + 50, ly, '#7dffb8', 14, 0.9);
      this.cleanReps[note.skill.id] = (this.cleanReps[note.skill.id] || 0) + 1;
      AcroAudio.sfx.great();
    } else if (!completed && frac < 0.6) {
      note.broke = true;
      this.fx.popText(this.hitX + 50, ly - 8, 'HOLD IT', '#ffb648', 20);
    }
  };

  /* ------------------------------------------------------------- update */
  Game.prototype.laneY = function (lane) {
    return this.hy0 + this.laneH * (lane + 0.5);
  };

  Game.prototype.frame = function (ts) {
    if (!this.running) return;
    var self = this;
    var dt = this.lastFrame ? Math.min((ts - this.lastFrame) / 1000, 0.05) : 0.016;
    this.lastFrame = ts;

    if (!this.paused) this.update(dt);
    this.render(dt);

    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  Game.prototype.update = function (dt) {
    this.beat = AcroAudio.beats();
    var spb = this.secPerBeat();

    /* miss anything that scrolled past the window unjudged */
    for (var i = 0; i < this.chart.notes.length; i++) {
      var n = this.chart.notes[i];
      if (!n.judged && (this.beat - n.beat) * spb > W_GOOD) {
        this.judge(n, 'miss');
      }
      if (n.holding && this.beat >= n.beat + n.dur) {
        this.endHold(n, true);
        this.gym.release();
      }
    }

    /* ribbon trail off her hands while a skill is playing */
    if (this.gym.isBusy() && this.gymJoints && !this.fx.reduceMotion) {
      var col = this.gym.skillId ? (AcroSkills.byId(this.gym.skillId) || {}).color : '#fff';
      this.fx.ribbon(this.gymPos.x + this.gymJoints.handL.x,
                     this.gymPos.y + this.gymJoints.handL.y, col || '#fff');
    }

    this.gym.update(dt, AcroAudio.beatPhase());
    this.stage.update(dt);
    this.fx.update(dt);
    for (var L = 0; L < 4; L++) this.laneFlash[L] = Math.max(0, this.laneFlash[L] - dt * 5);
    if (this.coachTimer > 0) this.coachTimer -= dt;

    if (!this.finished && this.beat >= this.chart.endBeat) this.finish();
  };

  Game.prototype.finish = function () {
    this.finished = true;
    var total = this.counts.perfect + this.counts.great + this.counts.good + this.counts.miss;
    var acc = this.chart.maxRaw ? this.rawScore / this.chart.maxRaw : 0;
    var stars = acc >= 0.90 ? 3 : (acc >= 0.72 ? 2 : (acc >= 0.45 ? 1 : 0));

    var res = {
      levelId: this.level.id,
      score: this.score, accuracy: acc, stars: stars,
      counts: this.counts, bestCombo: this.bestCombo,
      holdSeconds: this.holdSeconds, cleanReps: this.cleanReps,
      totalNotes: total,
      flawless: this.counts.miss === 0 && total > 0
    };

    AcroAudio.sfx.cheer(2.2);
    this.fx.confetti(this.w, this.h, stars >= 2 ? 160 : 70);
    this.say(AcroCoach.say(stars >= 3 ? 'result3' : (stars === 2 ? 'result2' : 'result1')), 5);

    var self = this;
    setTimeout(function () {
      self.stop();
      if (self.onEnd) self.onEnd(res);
    }, 1600);
  };

  /* ------------------------------------------------------------- render */
  Game.prototype.render = function (dt) {
    var ctx = this.ctx, w = this.w, h = this.h;
    if (!ctx) return;

    /* highway geometry, recomputed each frame so resizes are free */
    this.hy0 = h * 0.735;
    this.laneH = (h - this.hy0) / 4;
    this.hitX = Math.max(74, w * 0.155);
    this.pxPerBeat = (w - this.hitX) / LOOKAHEAD_BEATS;

    var phase = AcroAudio.beatPhase();
    var energy = Math.min(1, this.combo / 30);
    var sh = this.fx.shakeOffset();

    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.clearRect(-40, -40, w + 80, h + 80);

    this.stage.floorFrac = 0.615;
    this.stage.draw(ctx, w, h, phase, energy);

    /* --- the athlete -------------------------------------------------- */
    /* gy is the mat surface; the gymnast grounds herself on it by her feet. */
    var gx = w * 0.53, gy = h * this.stage.floorFrac + 12;
    var self = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, gy, w, Math.max(0, h * 0.735 - gy));
    ctx.clip();
    this.stage.drawReflection(ctx, w, h, function (c) {
      c.globalAlpha = 0.11;
      self.gym.draw(c, gx, gy, 0, { noTrail: true });
    });
    ctx.restore();
    var info = this.gym.draw(ctx, gx, gy, dt, {
      glow: this.combo >= 10 ? AcroStage.hexA(this.stage.pal.glow, 0.8) : null
    });
    this.gymPos = { x: info.x, y: info.y };
    this.gymJoints = info.joints;

    /* --- note highway ------------------------------------------------- */
    this.drawHighway(ctx, w, h, phase);

    /* Effects last, so popups and sparks read over the highway panel. */
    this.fx.draw(ctx);

    /* --- HUD --------------------------------------------------------- */
    this.drawHUD(ctx, w, h);

    ctx.restore();
    this.fx.drawFlash(ctx, w, h);

    if (this.paused) this.drawPaused(ctx, w, h);
  };

  Game.prototype.drawHighway = function (ctx, w, h, phase) {
    var hy0 = this.hy0, laneH = this.laneH, hitX = this.hitX;

    /* panel */
    var g = ctx.createLinearGradient(0, hy0, 0, h);
    g.addColorStop(0, 'rgba(6,4,16,0.55)');
    g.addColorStop(1, 'rgba(6,4,16,0.88)');
    ctx.fillStyle = g;
    ctx.fillRect(0, hy0, w, h - hy0);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, hy0); ctx.lineTo(w, hy0); ctx.stroke();

    var i;
    for (i = 0; i < 4; i++) {
      var y = hy0 + laneH * i;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.028)' : 'rgba(255,255,255,0.055)';
      ctx.fillRect(0, y, w, laneH);
      if (this.laneFlash[i] > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (this.laneFlash[i] * 0.13) + ')';
        ctx.fillRect(0, y, w, laneH);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    /* hit line, pulsing on the beat */
    var pul = Math.pow(1 - phase, 3);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.34 + pul * 0.42) + ')';
    ctx.lineWidth = 2 + pul * 2;
    ctx.shadowColor = this.stage.pal.glow; ctx.shadowBlur = 16 + pul * 18;
    ctx.beginPath(); ctx.moveTo(hitX, hy0); ctx.lineTo(hitX, h); ctx.stroke();
    ctx.restore();

    /* lane targets + key hints */
    for (i = 0; i < 4; i++) {
      var cy = this.laneY(i);
      var r = laneH * 0.30;
      ctx.beginPath(); ctx.arc(hitX, cy, r + pul * 2, 0, 6.2832);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + this.laneFlash[i] * 0.6) + ')';
      ctx.lineWidth = 2.5; ctx.stroke();
      if (this.keyDown[i]) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = '800 ' + Math.round(laneH * 0.30) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(LANE_LABEL[i], hitX * 0.42, cy);
    }

    /* notes */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (i = 0; i < this.chart.notes.length; i++) {
      var n = this.chart.notes[i];
      var rel = n.beat - this.beat;
      if (rel > LOOKAHEAD_BEATS + 1) break;
      if (n.judged && n.judgment === 'miss') continue;
      if (n.judged && n.type === 'tap') continue;
      if (n.judged && n.type === 'hold' && !n.holding && this.beat > n.beat + n.dur) continue;

      var x = hitX + rel * this.pxPerBeat;
      var cy2 = this.laneY(n.lane);
      var bh = laneH * 0.60;
      var tailW = n.type === 'hold' ? n.dur * this.pxPerBeat : 0;
      if (x + tailW < -60) continue;

      /* fade in at the right edge so notes do not pop into existence */
      var alpha = Math.max(0, Math.min(1, (LOOKAHEAD_BEATS + 0.6 - rel) / 1.1));
      ctx.globalAlpha = alpha * (n.judged ? 0.55 : 1);

      if (tailW > 0) {
        ctx.fillStyle = AcroStage.hexA(n.skill.color, n.holding ? 0.55 : 0.28);
        roundRect(ctx, x, cy2 - bh * 0.34, tailW, bh * 0.68, bh * 0.34);
        ctx.fill();
      }

      ctx.save();
      ctx.shadowColor = n.skill.color;
      ctx.shadowBlur = n.holding ? 24 : 12;
      var grd = ctx.createLinearGradient(x - 46, 0, x + 46, 0);
      grd.addColorStop(0, AcroCharacter.shade(n.skill.color, -0.18));
      grd.addColorStop(1, AcroCharacter.shade(n.skill.color, 0.22));
      ctx.fillStyle = grd;
      roundRect(ctx, x - 46, cy2 - bh / 2, 92, bh, Math.min(14, bh / 2));
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(10,6,20,0.92)';
      ctx.font = '800 ' + Math.max(10, Math.round(bh * 0.33)) + 'px system-ui, sans-serif';
      ctx.fillText(n.skill.short, x, cy2);
      ctx.globalAlpha = 1;
    }
  };

  Game.prototype.drawHUD = function (ctx, w, h) {
    var k = this.uiK || 1;
    var pad = Math.round(16 * k) + 2;
    var F = function (weight, size) {
      return weight + ' ' + Math.round(size * k) + 'px system-ui, sans-serif';
    };

    /* progress through the routine */
    var prog = Math.max(0, Math.min(1, (this.beat - COUNT_IN_BEATS) /
                Math.max(1, this.chart.endBeat - COUNT_IN_BEATS)));
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, pad, pad, w - pad * 2, 7, 4); ctx.fill();
    var pg = ctx.createLinearGradient(pad, 0, w - pad, 0);
    pg.addColorStop(0, this.stage.pal.accent);
    pg.addColorStop(1, this.stage.pal.glow);
    ctx.fillStyle = pg;
    roundRect(ctx, pad, pad, Math.max(6, (w - pad * 2) * prog), 7, 4); ctx.fill();

    /* score */
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = F('700', 11);
    ctx.fillText('SCORE', pad, pad + 16 * k);
    ctx.fillStyle = '#fff';
    ctx.font = F('900', 30);
    ctx.fillText(String(this.score).replace(/\B(?=(\d{3})+(?!\d))/g, ','), pad, pad + 30 * k);

    /* level name — inset to clear the pause button in the corner */
    var rx = w - pad - 54;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = F('700', 11);
    ctx.fillText(this.level.icon + '  ' + this.level.name.toUpperCase(), rx, pad + 16 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = F('800', 15);
    var accNow = this.chart.maxRaw ? (this.rawScore / this.chart.maxRaw) : 0;
    ctx.fillText(Math.round(accNow * 100) + '% accuracy', rx, pad + 32 * k);

    /* combo, centred and scaled by how hot the streak is */
    if (this.combo >= 3) {
      var s = 1 + Math.min(this.combo, 40) / 55;
      ctx.save();
      ctx.translate(w / 2, h * 0.155);
      ctx.scale(s, s);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = F('900', 40);
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(8,6,20,0.7)';
      ctx.strokeText(this.combo + 'x', 0, 0);
      var cg = ctx.createLinearGradient(-50, -20, 50, 20);
      cg.addColorStop(0, '#fff'); cg.addColorStop(1, this.stage.pal.glow);
      ctx.fillStyle = cg;
      ctx.fillText(this.combo + 'x', 0, 0);
      ctx.font = F('800', 11);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('COMBO', 0, 26 * k);
      ctx.restore();
    }

    /* count-in */
    if (this.beat < COUNT_IN_BEATS) {
      var left = COUNT_IN_BEATS - this.beat;
      var label = left > 6 ? 'GET READY' : (left > 1 ? String(Math.ceil(left - 1)) : 'GO!');
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var kk = 1 + (1 - (left % 1)) * 0.25;
      ctx.translate(w / 2, h * 0.30); ctx.scale(kk, kk);
      ctx.font = F('900', left > 6 ? 44 : 84);
      ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(8,6,20,0.75)';
      ctx.strokeText(label, 0, 0);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    /* coach bubble */
    if (this.coachTimer > 0 && this.coachText) {
      drawCoachBubble(ctx, this.coachText, pad, h * 0.115, Math.min(360, w - pad * 2 - 60),
                      Math.min(1, this.coachTimer / 0.4));
    }
  };

  Game.prototype.drawPaused = function (ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,16,0.72)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '900 46px system-ui, sans-serif';
    ctx.fillText('PAUSED', w / 2, h / 2 - 16);
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Press Esc to keep going', w / 2, h / 2 + 24);
    ctx.restore();
  };

  function drawCoachBubble(ctx, text, x, y, maxW, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW - 68 && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    var bh = 26 + lines.length * 19;

    ctx.fillStyle = 'rgba(12,8,26,0.88)';
    roundRect(ctx, x, y, maxW, bh, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.stroke();

    /* Nova's badge */
    ctx.fillStyle = '#ff4f9a';
    ctx.beginPath(); ctx.arc(x + 26, y + bh / 2, 17, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 16px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', x + 26, y + bh / 2 + 1);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.font = '600 14px system-ui, sans-serif';
    for (var L = 0; L < lines.length; L++) {
      ctx.fillText(lines[L], x + 52, y + 14 + L * 19);
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  global.AcroGame = {
    Game: Game,
    buildChart: buildChart,
    LANE_LABEL: LANE_LABEL,
    LANE_KEYS: LANE_KEYS,
    roundRect: roundRect,
    windows: { perfect: W_PERFECT, great: W_GREAT, good: W_GOOD },
    COUNT_IN_BEATS: COUNT_IN_BEATS
  };
})(window);
