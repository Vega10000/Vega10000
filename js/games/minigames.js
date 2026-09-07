/* =========================================================================
   minigames.js — the arcade modes.

   All seven share one base: the base owns the canvas, the stage, the
   gymnast, the particle system, input, the timer and the HUD, and each game
   supplies only its own rules through four hooks:

       setup()          once, when the round starts
       tick(dt)         per frame logic
       drawGame(ctx)    per frame drawing, on top of the stage
       onPress(action)  a button or a tap

   That keeps every game to roughly a screenful of actual rules, and means a
   new mini-game is a new object in GAMES rather than a new subsystem.

   No mini-game has a fail state. Running out of time ends the round and
   scores what you did; there is no "you lose" screen anywhere in Acroverse.
   ========================================================================= */

(function (global) {
  'use strict';

  var ACTIONS = { a: 'A', ' ': 'A', enter: 'A',
                  arrowleft: 'LEFT', arrowright: 'RIGHT',
                  arrowup: 'UP', arrowdown: 'DOWN',
                  '1': 'P1', '2': 'P2', '3': 'P3', '4': 'P4' };

  /* Assist widens every timing window without changing the scoring maths,
     so an easier setting still produces an honest-looking score. */
  var ASSIST = { easy: 1.75, normal: 1, pro: 0.7 };

  /* ------------------------------------------------------------- helpers */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

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

  /* ==================================================================== */
  /*  BASE                                                                */
  /* ==================================================================== */
  function MiniGame(def) {
    this.def = def;
    this.stage = new AcroStage.Stage();
    this.fx = new AcroFX.FX();
    this.gym = new AcroCharacter.Gymnast({ scale: 1 });
    this.running = false;
    this._raf = null;
    this._keyDown = null;
    this._keyUp = null;
  }

  MiniGame.prototype.attach = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  };

  MiniGame.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var r = this.canvas.getBoundingClientRect();
    var w = Math.max(320, r.width), h = Math.max(240, r.height);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.gym.scale = clamp(Math.min(h / 430, w / 340), 0.62, 1.9);
    this.uiK = clamp(Math.min(w, h) / 760, 0.62, 1);
  };

  MiniGame.prototype.start = function (opts) {
    opts = opts || {};
    this.onEnd = opts.onEnd || null;
    this.assist = ASSIST[opts.assist] || 1;
    this.reduceMotion = !!opts.reduceMotion;
    this.fx.reduceMotion = this.reduceMotion;
    this.stage.reduceMotion = this.reduceMotion;
    this.stage.setZone(this.def.zone || 'hub');

    this.score = 0;
    this.round = 0;
    this.best = 0;
    this.combo = 0;
    this.hits = 0;
    this.attempts = 0;
    this.time = this.def.duration || 45;
    this.elapsed = 0;
    this.message = this.def.instruction;
    this.messageT = 3.4;
    this.coachLine = Coach.say('missionStart');
    this.coachT = 3.6;
    this.finished = false;
    this.state = 'intro';
    this.introT = 2.6;

    this.fx.clear();
    this.gym.trail.length = 0;
    this.gym.tailInit = false;

    AcroAudio.play(this.def.music || 'funk');
    AcroAudio.setIntensity(0.55);

    if (this.def.setup) this.def.setup.call(this);

    this.bind();
    this.running = true;
    this.lastFrame = 0;
    var self = this;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  MiniGame.prototype.stop = function () {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.unbind();
  };

  MiniGame.prototype.bind = function () {
    var self = this;
    this._keyDown = function (e) {
      var k = e.key.toLowerCase();
      if (k === 'escape') { e.preventDefault(); self.paused = !self.paused; return; }
      var a = ACTIONS[k];
      if (a) { e.preventDefault(); self.press(a); }
    };
    global.addEventListener('keydown', this._keyDown);
  };
  MiniGame.prototype.unbind = function () {
    if (this._keyDown) global.removeEventListener('keydown', this._keyDown);
    this._keyDown = null;
  };

  MiniGame.prototype.press = function (action) {
    if (!this.running || this.finished || this.paused) return;
    if (this.state === 'intro') { this.introT = 0; return; }
    if (this.def.onPress) this.def.onPress.call(this, action);
  };

  MiniGame.prototype.say = function (line, secs) {
    if (!line) return;
    this.coachLine = line;
    this.coachT = secs || 2.8;
  };

  MiniGame.prototype.flash = function (text, color, size) {
    this.fx.popText(this.w / 2, this.h * 0.30, text, color, size || 34);
  };

  /* Shared scoring helper: turn a 0..1 quality into points, feedback and
     the right noise, so every game rewards accuracy the same way. */
  MiniGame.prototype.award = function (quality, x, y) {
    quality = clamp(quality, 0, 1);
    this.attempts++;
    var label, color, pts;
    if (quality >= 0.88) { label = 'PERFECT'; color = '#ffe97a'; pts = 100; this.hits++; }
    else if (quality >= 0.68) { label = 'GREAT'; color = '#7dffb8'; pts = 70; this.hits++; }
    else if (quality >= 0.42) { label = 'GOOD'; color = '#4fd1ff'; pts = 40; this.hits++; }
    else { label = 'ALMOST'; color = '#ffb648'; pts = 10; }

    if (quality >= 0.42) { this.combo++; } else { this.combo = 0; }
    var mult = 1 + Math.min(this.combo, 20) / 20;
    this.score += Math.round(pts * mult);

    x = x === undefined ? this.w / 2 : x;
    y = y === undefined ? this.h * 0.34 : y;
    this.fx.popText(x, y, label, color, quality >= 0.88 ? 36 : 28);
    this.fx.burst(x, y, color, quality >= 0.88 ? 26 : 14, quality >= 0.88 ? 1.2 : 0.8);
    this.fx.ring(x, y, color, 10, quality >= 0.88 ? 92 : 60, 0.45);

    if (quality >= 0.88) { AcroAudio.sfx.perfect(); this.fx.kick(4, AcroStage.hexA(color, 0.4)); }
    else if (quality >= 0.68) AcroAudio.sfx.great();
    else if (quality >= 0.42) AcroAudio.sfx.good();
    else AcroAudio.sfx.miss();

    AcroAudio.setIntensity(0.45 + Math.min(this.combo, 16) / 26);

    if (this.combo > 0 && this.combo % 8 === 0) this.say(Coach.say('onFire'), 2.4);
    else if (quality < 0.42 && this.attempts % 4 === 0) this.say(Coach.say('struggling'), 2.6);
    return label;
  };

  MiniGame.prototype.finish = function () {
    if (this.finished) return;
    this.finished = true;
    var acc = this.attempts ? this.hits / this.attempts : 0;
    AcroAudio.sfx.cheer(1.8);
    this.fx.confetti(this.w, this.h, acc > 0.7 ? 140 : 70);
    var res = {
      game: this.def.id,
      score: Math.round(this.score),
      accuracy: acc,
      rounds: this.round,
      combo: this.combo,
      hits: this.hits,
      attempts: this.attempts,
      seconds: this.elapsed
    };
    var self = this;
    setTimeout(function () {
      self.stop();
      if (self.onEnd) self.onEnd(res);
    }, 1500);
  };

  MiniGame.prototype.frame = function (ts) {
    if (!this.running) return;
    var dt = this.lastFrame ? Math.min((ts - this.lastFrame) / 1000, 0.05) : 0.016;
    this.lastFrame = ts;

    if (!this.paused) {
      if (this.state === 'intro') {
        this.introT -= dt;
        if (this.introT <= 0) { this.state = 'play'; if (this.def.begin) this.def.begin.call(this); }
      } else if (!this.finished) {
        this.elapsed += dt;
        if (this.def.timed !== false) {
          this.time -= dt;
          if (this.time <= 0) { this.time = 0; this.finish(); }
        }
        if (this.def.tick) this.def.tick.call(this, dt);
      }
      this.gym.update(dt, AcroAudio.beatPhase());
      this.stage.update(dt);
      this.fx.update(dt);
      if (this.coachT > 0) this.coachT -= dt;
      if (this.messageT > 0) this.messageT -= dt;
    }

    this.render(dt);
    var self = this;
    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  MiniGame.prototype.render = function (dt) {
    var ctx = this.ctx, w = this.w, h = this.h;
    if (!ctx) return;
    var sh = this.fx.shakeOffset();

    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.clearRect(-40, -40, w + 80, h + 80);

    this.stage.floorFrac = this.def.floorFrac || 0.66;
    this.stage.draw(ctx, w, h, AcroAudio.beatPhase(), clamp(this.combo / 20, 0, 1));

    /* the athlete, unless the game draws her itself */
    if (this.def.drawGymnast !== false) {
      var gx = this.def.gymX ? this.def.gymX * w : w * 0.5;
      var gy = h * this.stage.floorFrac + 10;
      var self = this;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, gy, w, Math.max(0, h - gy));
      ctx.clip();
      this.stage.drawReflection(ctx, w, h, function (c) {
        c.globalAlpha = 0.1;
        self.gym.draw(c, gx, gy, 0, { noTrail: true });
      });
      ctx.restore();
      var info = this.gym.draw(ctx, gx, gy, dt, {
        glow: this.combo >= 5 ? AcroStage.hexA(this.stage.pal.glow, 0.75) : null
      });
      this.gymPos = { x: info.x, y: info.y };
    }

    if (this.def.drawGame) this.def.drawGame.call(this, ctx);

    this.fx.draw(ctx);
    this.drawHUD(ctx);
    ctx.restore();
    this.fx.drawFlash(ctx, w, h);

    if (this.state === 'intro') this.drawIntro(ctx);
    if (this.paused) this.drawPaused(ctx);
  };

  MiniGame.prototype.drawHUD = function (ctx) {
    var w = this.w, h = this.h, k = this.uiK, pad = Math.round(16 * k) + 2;
    var F = function (wt, sz) { return wt + ' ' + Math.round(sz * k) + 'px system-ui, sans-serif'; };

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = F('700', 11);
    ctx.fillText('SCORE', pad, pad);
    ctx.fillStyle = '#fff';
    ctx.font = F('900', 30);
    ctx.fillText(String(Math.round(this.score)), pad, pad + 14 * k);

    /* timer, or round counter for untimed games */
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = F('700', 11);
    var rx = w - pad - 52;
    ctx.fillText(this.def.icon + '  ' + this.def.name.toUpperCase(), rx, pad);
    ctx.fillStyle = '#fff';
    ctx.font = F('800', 18);
    if (this.def.timed === false) {
      ctx.fillText('Round ' + Math.max(1, this.round), rx, pad + 16 * k);
    } else {
      ctx.fillText(Math.ceil(this.time) + 's', rx, pad + 16 * k);
    }

    /* combo */
    if (this.combo >= 3) {
      ctx.save();
      var s = 1 + Math.min(this.combo, 20) / 40;
      ctx.translate(w / 2, h * 0.115); ctx.scale(s, s);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = F('900', 32);
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,6,20,0.7)';
      ctx.strokeText(this.combo + 'x', 0, 0);
      ctx.fillStyle = this.stage.pal.glow;
      ctx.fillText(this.combo + 'x', 0, 0);
      ctx.restore();
    }

    /* instruction banner, fading out */
    if (this.messageT > 0 && this.message) {
      ctx.save();
      ctx.globalAlpha = clamp(this.messageT / 0.6, 0, 1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = F('700', 15);
      var tw = ctx.measureText(this.message).width + 34;
      ctx.fillStyle = 'rgba(10,6,24,0.8)';
      roundRect(ctx, w / 2 - tw / 2, h * 0.185, tw, 34 * k, 17 * k); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(this.message, w / 2, h * 0.185 + 17 * k);
      ctx.restore();
    }

    /* coach bubble */
    if (this.coachT > 0 && this.coachLine) {
      drawCoachBubble(ctx, this.coachLine, pad, h * 0.80,
                      Math.min(360, w - pad * 2 - 40), clamp(this.coachT / 0.4, 0, 1), k);
    }
  };

  MiniGame.prototype.drawIntro = function (ctx) {
    var w = this.w, h = this.h, k = this.uiK;
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,16,0.78)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(56 * k) + 'px system-ui, sans-serif';
    ctx.fillText(this.def.icon, w / 2, h * 0.32);
    ctx.fillStyle = '#fff';
    ctx.font = '900 ' + Math.round(32 * k) + 'px system-ui, sans-serif';
    ctx.fillText(this.def.name, w / 2, h * 0.44);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 ' + Math.round(15 * k) + 'px system-ui, sans-serif';
    wrapText(ctx, this.def.instruction, w / 2, h * 0.53, Math.min(460, w - 60), 22 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '700 ' + Math.round(13 * k) + 'px system-ui, sans-serif';
    ctx.fillText('Starting in ' + Math.ceil(this.introT) + '…', w / 2, h * 0.72);
    ctx.restore();
  };

  MiniGame.prototype.drawPaused = function (ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,16,0.72)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '900 42px system-ui, sans-serif';
    ctx.fillText('PAUSED', this.w / 2, this.h / 2 - 14);
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Press Esc to keep going', this.w / 2, this.h / 2 + 22);
    ctx.restore();
  };

  function wrapText(ctx, text, cx, y, maxW, lh) {
    var words = String(text).split(' '), line = '', lines = [], i;
    for (i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], cx, y + i * lh);
    return lines.length;
  }

  function drawCoachBubble(ctx, text, x, y, maxW, alpha, k) {
    k = k || 1;
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.font = '600 ' + Math.round(14 * k) + 'px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var words = String(text).split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW - 66 && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    var bh = 24 * k + lines.length * 19 * k;
    ctx.fillStyle = 'rgba(12,8,26,0.9)';
    roundRect(ctx, x, y, maxW, bh, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ff4f9a';
    ctx.beginPath(); ctx.arc(x + 25 * k, y + bh / 2, 16 * k, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 ' + Math.round(15 * k) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Coach.initial, x + 25 * k, y + bh / 2 + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.font = '600 ' + Math.round(14 * k) + 'px system-ui, sans-serif';
    for (var L = 0; L < lines.length; L++) ctx.fillText(lines[L], x + 50 * k, y + 12 * k + L * 19 * k);
    ctx.restore();
  }

  /* ==================================================================== */
  /*  1. PERFECT LANDING                                                  */
  /*  A marker sweeps a bar; stop it inside the target to stick the land.  */
  /* ==================================================================== */
  var LANDING = {
    id: 'landing', name: 'Perfect Landing', icon: '🎯', zone: 'strength',
    music: 'hiphop', room: 'power', timed: false, duration: 999,
    blurb: 'Time your landing inside the target zone.',
    instruction: 'Press SPACE (or tap) when the marker is inside the green zone.',
    science: 'landing',
    setup: function () {
      this.rounds = 10;
      this.pos = 0; this.dir = 1;
      this.speed = 0.85;
      this.zoneW = 0.30 * this.assist;
      this.zoneC = 0.5;
      this.locked = false;
      this.round = 1;
    },
    tick: function (dt) {
      if (this.locked) return;
      this.pos += this.dir * this.speed * dt;
      if (this.pos > 1) { this.pos = 1; this.dir = -1; }
      if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    },
    onPress: function (a) {
      if (a !== 'A' || this.locked) return;
      this.locked = true;
      var d = Math.abs(this.pos - this.zoneC);
      var q = clamp(1 - (d / (this.zoneW / 2)), 0, 1);
      this.gym.playSkill(AcroSkills.byId('jumpland'), false);
      this.award(q, this.w / 2, this.h * 0.32);
      if (q > 0.42 && this.gymPos) this.fx.chalk(this.gymPos.x, this.h * this.stage.floorFrac + 10, 14);
      var self = this;
      setTimeout(function () {
        if (!self.running) return;
        self.round++;
        if (self.round > self.rounds) { self.finish(); return; }
        self.speed = 0.85 + self.round * 0.13;
        self.zoneW = Math.max(0.09, (0.30 - self.round * 0.019)) * self.assist;
        self.zoneC = 0.28 + Math.random() * 0.44;
        self.pos = Math.random(); self.dir = Math.random() < 0.5 ? 1 : -1;
        self.locked = false;
      }, 900);
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      var bx = w * 0.12, bw = w * 0.76, by = h * 0.85, bh = 26;
      ctx.fillStyle = 'rgba(10,6,24,0.72)';
      roundRect(ctx, bx, by, bw, bh, 13); ctx.fill();
      /* target zone */
      var zx = bx + (this.zoneC - this.zoneW / 2) * bw;
      var zw = this.zoneW * bw;
      var g = ctx.createLinearGradient(zx, 0, zx + zw, 0);
      g.addColorStop(0, 'rgba(125,255,184,0.35)');
      g.addColorStop(0.5, 'rgba(125,255,184,0.85)');
      g.addColorStop(1, 'rgba(125,255,184,0.35)');
      ctx.fillStyle = g;
      roundRect(ctx, zx, by, zw, bh, 13); ctx.fill();
      /* marker */
      var mx = bx + this.pos * bw;
      ctx.save();
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#fff';
      roundRect(ctx, mx - 3, by - 8, 6, bh + 16, 3); ctx.fill();
      ctx.restore();
      /* round pips */
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('LANDING ' + Math.min(this.round, this.rounds) + ' / ' + this.rounds, w / 2, by - 24);
    }
  };

  /* ==================================================================== */
  /*  2. BALANCE BEAM                                                     */
  /*  A drifting tilt; nudge it back and keep your centre over the beam.   */
  /* ==================================================================== */
  var BALANCE = {
    id: 'balance', name: 'Balance Beam', icon: '⚖️', zone: 'balance',
    music: 'rnb', room: 'balance', duration: 42,
    blurb: 'Keep your balance point over the beam.',
    instruction: 'Use ← and → (or the pads) to stay centred. Little corrections, not big ones.',
    science: 'balancecom',
    setup: function () {
      this.tilt = 0;
      this.vel = 0;
      this.push = 0;
      this.drift = 0.6;
      this.inZone = 0;
      this.tickAcc = 0;
      this.steps = 0;
      this.gym.playSkill(AcroSkills.byId('releve'), true);
    },
    tick: function (dt) {
      /* wind: a slow random walk, so it never feels scripted */
      this.drift += (Math.random() - 0.5) * dt * 2.4;
      this.drift = clamp(this.drift, -1.2, 1.2);
      this.vel += (this.drift * 0.9 + this.push) * dt;
      this.vel *= 0.965;
      this.tilt += this.vel * dt;
      this.push *= 0.86;

      if (Math.abs(this.tilt) > 1.7) {
        /* step off — reset, no punishment beyond losing the streak */
        this.tilt = 0; this.vel = 0; this.drift = 0;
        this.combo = 0; this.steps++;
        this.fx.popText(this.w / 2, this.h * 0.34, 'STEP OFF', '#ffb648', 26);
        AcroAudio.sfx.miss();
        this.say(Coach.nugget('balance'), 3);
      }

      /* score continuously while centred, and count a "hit" each second */
      var centred = 1 - clamp(Math.abs(this.tilt) / 1.7, 0, 1);
      if (Math.abs(this.tilt) < 0.55 * this.assist) {
        this.inZone += dt;
        this.score += dt * 34 * (1 + this.combo / 22);
      }
      this.tickAcc += dt;
      if (this.tickAcc >= 1) {
        this.tickAcc -= 1;
        this.attempts++;
        if (centred > 0.55) {
          this.hits++; this.combo++;
          if (this.combo % 6 === 0) {
            this.fx.popText(this.w / 2, this.h * 0.32, 'STEADY!', '#7dffb8', 26);
            AcroAudio.sfx.great();
          }
        } else this.combo = 0;
        AcroAudio.setIntensity(0.45 + centred * 0.45);
      }
      /* lean the athlete with the tilt */
      this.gym.pose.rot = this.tilt * 13;
      this.gym.pose.x = this.tilt * 5;
    },
    onPress: function (a) {
      if (a === 'LEFT' || a === 'P1') this.push -= 1.5;
      if (a === 'RIGHT' || a === 'P4') this.push += 1.5;
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      /* the beam */
      var by = h * this.stage.floorFrac + 8;
      ctx.fillStyle = 'rgba(120,80,50,0.9)';
      roundRect(ctx, w * 0.18, by, w * 0.64, 12, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(ctx, w * 0.18, by, w * 0.64, 4, 2); ctx.fill();

      /* balance meter */
      var mx = w * 0.5, my = h * 0.86, mw = w * 0.7;
      ctx.fillStyle = 'rgba(10,6,24,0.72)';
      roundRect(ctx, mx - mw / 2, my, mw, 22, 11); ctx.fill();
      var safe = 0.55 * this.assist / 1.7;
      ctx.fillStyle = 'rgba(125,255,184,0.5)';
      roundRect(ctx, mx - mw * safe / 2, my, mw * safe, 22, 11); ctx.fill();
      var px = mx + clamp(this.tilt / 1.7, -1, 1) * mw / 2;
      ctx.save();
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
      ctx.fillStyle = Math.abs(this.tilt) < 0.55 * this.assist ? '#7dffb8' : '#ffb648';
      ctx.beginPath(); ctx.arc(px, my + 11, 11, 0, 6.2832); ctx.fill();
      ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('BALANCE POINT', mx, my - 12);
    }
  };

  /* ==================================================================== */
  /*  3. MEMORY ROUTINE                                                   */
  /*  Watch a sequence, then reproduce it. Rounds grow by one.            */
  /* ==================================================================== */
  var MEMORY = {
    id: 'memory', name: 'Memory Routine', icon: '🧠', zone: 'coord',
    music: 'funk', room: 'coordination', timed: false, duration: 999,
    blurb: 'Watch the routine, then perform it back.',
    instruction: 'Watch the pads light up, then press them back in the same order.',
    science: 'core',
    setup: function () {
      this.pads = ['chasse', 'spotturn', 'releve', 'armframe'].map(function (id) {
        return AcroSkills.byId(id);
      });
      this.seq = [];
      this.showIdx = 0;
      this.showT = 0;
      this.inputIdx = 0;
      this.mode = 'show';
      this.lit = -1;
      this.round = 0;
      this.retries = 0;
      this.nextRound();
    },
    nextRound: function () {
      this.round++;
      this.seq.push(Math.floor(Math.random() * 4));
      this.mode = 'show'; this.showIdx = 0; this.showT = 0.55; this.inputIdx = 0;
      this.message = 'Watch — routine of ' + this.seq.length;
      this.messageT = 1.8;
    },
    tick: function (dt) {
      if (this.mode !== 'show') return;
      this.showT -= dt;
      if (this.showT <= 0) {
        if (this.showIdx < this.seq.length) {
          this.lit = this.seq[this.showIdx];
          this.gym.playSkill(this.pads[this.lit], false);
          AcroAudio.sfx.good();
          this.showIdx++;
          this.showT = 0.72;
        } else {
          this.lit = -1;
          this.mode = 'input';
          this.message = 'Your turn!';
          this.messageT = 1.4;
        }
      } else if (this.showT < 0.34) this.lit = -1;
    },
    onPress: function (a) {
      if (this.mode !== 'input') return;
      var idx = { P1: 0, P2: 1, P3: 2, P4: 3, LEFT: 0, DOWN: 1, UP: 2, RIGHT: 3 }[a];
      if (idx === undefined) return;
      this.lit = idx;
      var self = this;
      setTimeout(function () { if (self.lit === idx) self.lit = -1; }, 160);
      this.gym.playSkill(this.pads[idx], false);

      if (idx === this.seq[this.inputIdx]) {
        this.inputIdx++;
        AcroAudio.sfx.good();
        if (this.inputIdx >= this.seq.length) {
          this.award(1, this.w / 2, this.h * 0.3);
          this.retries = 0;
          this.score += this.seq.length * 22;
          this.say(Coach.say('doingWell'), 2.2);
          if (this.round >= 9) { this.finish(); return; }
          var s2 = this;
          setTimeout(function () { if (s2.running) s2.nextRound(); }, 900);
        }
      } else {
        this.award(0.15, this.w / 2, this.h * 0.3);
        this.retries++;
        this.say(Coach.say('struggling'), 2.6);
        if (this.retries >= 2) {
          /* two misses and we move on — never a wall */
          this.retries = 0;
          if (this.round >= 9) { this.finish(); return; }
          var s3 = this;
          setTimeout(function () { if (s3.running) s3.nextRound(); }, 900);
        } else {
          this.mode = 'show'; this.showIdx = 0; this.showT = 0.8; this.inputIdx = 0;
          this.message = 'Watch it once more';
          this.messageT = 1.6;
        }
      }
    },
    drawGame: function (ctx) { drawPads.call(this, ctx, this.pads, this.lit); }
  };

  /* Four labelled pads across the bottom — shared by the pad-based games. */
  function drawPads(ctx, pads, lit) {
    var w = this.w, h = this.h;
    var n = pads.length, pw = (w * 0.86) / n, x0 = w * 0.07, y = h * 0.82, ph = h * 0.11;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * pw + 5;
      var on = lit === i;
      ctx.save();
      if (on) { ctx.shadowColor = pads[i].color; ctx.shadowBlur = 26; }
      ctx.fillStyle = on ? pads[i].color : 'rgba(255,255,255,0.10)';
      roundRect(ctx, x, y, pw - 10, ph, 14); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = on ? '#fff' : AcroStage.hexA(pads[i].color, 0.55);
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, pw - 10, ph, 14); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? '#1a0d24' : 'rgba(255,255,255,0.88)';
      ctx.font = '800 ' + Math.max(10, Math.round(ph * 0.24)) + 'px system-ui, sans-serif';
      ctx.fillText(pads[i].short, x + (pw - 10) / 2, y + ph * 0.42);
      ctx.fillStyle = on ? 'rgba(26,13,36,0.7)' : 'rgba(255,255,255,0.45)';
      ctx.font = '800 ' + Math.max(9, Math.round(ph * 0.18)) + 'px system-ui, sans-serif';
      ctx.fillText(String(i + 1), x + (pw - 10) / 2, y + ph * 0.75);
    }
  }

  /* ==================================================================== */
  /*  4. MIRROR MASTER                                                    */
  /*  Coach shows a shape; match it before the timer runs out.            */
  /* ==================================================================== */
  var MIRROR = {
    id: 'mirror', name: 'Mirror Master', icon: '🪞', zone: 'coord',
    music: 'funk', room: 'coordination', duration: 50,
    blurb: 'Copy the coach as fast as you can.',
    instruction: 'Coach shows a shape — press the matching pad (1-4) before the bar empties.',
    science: 'core',
    gymX: 0.68,
    setup: function () {
      this.pads = ['tuck', 'straddle', 'releve', 'chasse'].map(function (id) {
        return AcroSkills.byId(id);
      });
      this.coachGym = new AcroCharacter.Gymnast({ scale: 1, leo: '#4fd1ff', leo2: '#1f6fd0' });
      this.coachGym.scale = this.gym.scale * 0.92;
      this.target = -1;
      this.window = 2.4 * this.assist;
      this.left = 0;
      this.lit = -1;
      this.newTarget();
    },
    newTarget: function () {
      this.round++;
      this.target = Math.floor(Math.random() * this.pads.length);
      this.coachGym.playSkill(this.pads[this.target], this.pads[this.target].type === 'hold');
      this.left = this.window;
      this.window = Math.max(0.85, this.window - 0.075);
    },
    tick: function (dt) {
      this.coachGym.update(dt, AcroAudio.beatPhase());
      this.left -= dt;
      if (this.left <= 0) {
        this.award(0, this.w * 0.5, this.h * 0.3);
        this.newTarget();
      }
    },
    onPress: function (a) {
      var idx = { P1: 0, P2: 1, P3: 2, P4: 3, LEFT: 0, DOWN: 1, UP: 2, RIGHT: 3 }[a];
      if (idx === undefined || this.target < 0) return;
      this.lit = idx;
      var self = this;
      setTimeout(function () { self.lit = -1; }, 150);
      this.gym.playSkill(this.pads[idx], false);
      if (idx === this.target) {
        /* faster answer = higher quality */
        var q = clamp(0.45 + (this.left / this.window) * 0.6, 0, 1);
        this.award(q, this.w * 0.5, this.h * 0.3);
      } else {
        this.award(0.1, this.w * 0.5, this.h * 0.3);
      }
      this.newTarget();
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      /* the coach, mirrored on the left */
      var cy = h * this.stage.floorFrac + 10;
      this.coachGym.draw(ctx, w * 0.27, cy, 0.016, { glow: 'rgba(79,209,255,0.6)' });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(79,209,255,0.85)';
      ctx.fillText('COACH', w * 0.27, cy + 22);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('YOU', w * 0.68, cy + 22);

      /* time bar */
      var bw = w * 0.5, bx = w / 2 - bw / 2, by = h * 0.74;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(ctx, bx, by, bw, 8, 4); ctx.fill();
      var f = clamp(this.left / this.window, 0, 1);
      ctx.fillStyle = f > 0.4 ? '#7dffb8' : '#ff6b8a';
      roundRect(ctx, bx, by, bw * f, 8, 4); ctx.fill();

      drawPads.call(this, ctx, this.pads, this.lit);
    }
  };

  /* ==================================================================== */
  /*  5. SPIN DOCTOR                                                      */
  /*  Stop the rotating pointer inside the arc. Rotation timing.          */
  /* ==================================================================== */
  var SPIN = {
    id: 'spin', name: 'Spin Doctor', icon: '🌀', zone: 'tumbling',
    music: 'trap', room: 'coordination', timed: false, duration: 999,
    blurb: 'Control your rotation — stop on the mark.',
    instruction: 'Press SPACE (or tap) to stop the spinner inside the glowing arc.',
    science: 'rotation',
    setup: function () {
      this.rounds = 10;
      this.round = 1;
      this.ang = 0;
      this.spd = 2.3;
      this.arcC = Math.PI * 1.5;
      this.arcW = 0.85 * this.assist;
      this.locked = false;
    },
    tick: function (dt) { if (!this.locked) this.ang = (this.ang + this.spd * dt) % 6.2832; },
    onPress: function (a) {
      if (a !== 'A' || this.locked) return;
      this.locked = true;
      var d = Math.abs(((this.ang - this.arcC + Math.PI * 3) % 6.2832) - Math.PI);
      d = Math.PI - d;                                   // 0 = dead centre
      var q = clamp(1 - (d / (this.arcW / 2)), 0, 1);
      this.gym.playSkill(AcroSkills.byId('spotturn'), false);
      this.award(q, this.w / 2, this.h * 0.28);
      var self = this;
      setTimeout(function () {
        if (!self.running) return;
        self.round++;
        if (self.round > self.rounds) { self.finish(); return; }
        self.spd = (2.3 + self.round * 0.34) * (Math.random() < 0.35 ? -1 : 1);
        self.arcW = Math.max(0.30, 0.85 - self.round * 0.05) * self.assist;
        self.arcC = Math.random() * 6.2832;
        self.locked = false;
      }, 850);
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      var cx = w * 0.5, cy = h * 0.30, r = Math.min(w, h) * 0.13;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
      /* target arc */
      ctx.strokeStyle = '#7dffb8';
      ctx.shadowColor = '#7dffb8'; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, r, this.arcC - this.arcW / 2, this.arcC + this.arcW / 2);
      ctx.stroke();
      ctx.restore();
      /* pointer */
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(this.ang);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r + 8, 0); ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('SPIN ' + Math.min(this.round, this.rounds) + ' / ' + this.rounds, cx, cy + r + 26);
    }
  };

  /* ==================================================================== */
  /*  6. FREEZE FRAME                                                     */
  /*  Dance with the music; freeze the instant it stops.                  */
  /* ==================================================================== */
  var FREEZE = {
    id: 'freeze', name: 'Freeze Frame', icon: '🧊', zone: 'rhythm',
    music: 'pop', room: 'rhythm', timed: false, duration: 999,
    blurb: 'Freeze the moment the music stops.',
    instruction: 'Dance along — the instant the music cuts out, press SPACE to freeze!',
    science: 'core',
    setup: function () {
      this.rounds = 10;
      this.round = 1;
      this.phase = 'dance';
      this.t = 1.6 + Math.random() * 2.6;
      this.window = 0.85 * this.assist;
      this.danceSkills = ['chasse', 'spotturn', 'straddle', 'armframe']
        .map(function (id) { return AcroSkills.byId(id); });
      this.danceT = 0;
    },
    tick: function (dt) {
      this.t -= dt;
      if (this.phase === 'dance') {
        this.danceT -= dt;
        if (this.danceT <= 0 && !this.gym.isBusy()) {
          var s = this.danceSkills[Math.floor(Math.random() * this.danceSkills.length)];
          this.gym.playSkill(s, false);
          this.danceT = s.dur + 0.15;
        }
        if (this.t <= 0) {
          this.phase = 'frozen';
          this.t = this.window;
          AcroAudio.setMusic(false);
          AcroAudio.sfx.click();
        }
      } else if (this.phase === 'frozen') {
        if (this.t <= 0) {           /* missed the freeze */
          this.award(0, this.w / 2, this.h * 0.3);
          this.nextRound();
        }
      }
    },
    onPress: function (a) {
      if (a !== 'A') return;
      if (this.phase === 'dance') {
        /* jumped the gun */
        this.award(0.12, this.w / 2, this.h * 0.3);
        this.flash('TOO EARLY', '#ffb648', 28);
        this.nextRound();
      } else if (this.phase === 'frozen') {
        var q = clamp(this.t / this.window, 0, 1);
        this.gym.holding = true;
        this.award(0.35 + q * 0.65, this.w / 2, this.h * 0.3);
        this.nextRound();
      }
    },
    nextRound: function () {
      var self = this;
      AcroAudio.setMusic(true);
      this.phase = 'wait';
      setTimeout(function () {
        if (!self.running) return;
        self.round++;
        if (self.round > self.rounds) { self.finish(); return; }
        self.phase = 'dance';
        self.t = 1.4 + Math.random() * 2.6;
        self.window = Math.max(0.34, 0.85 - self.round * 0.04) * self.assist;
        self.gym.release();
      }, 800);
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      if (this.phase === 'frozen') {
        ctx.save();
        ctx.globalAlpha = 0.30 * clamp(this.t / this.window, 0, 1);
        ctx.fillStyle = '#8fe9ff';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 ' + Math.round(48 * this.uiK) + 'px system-ui, sans-serif';
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(8,6,20,0.7)';
        ctx.strokeText('FREEZE!', w / 2, h * 0.24);
        ctx.fillStyle = '#fff';
        ctx.fillText('FREEZE!', w / 2, h * 0.24);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('FREEZE ' + Math.min(this.round, this.rounds) + ' / ' + this.rounds, w / 2, h * 0.80);
    }
  };

  /* ==================================================================== */
  /*  7. COMBO CREATOR                                                    */
  /*  Pick three moves that flow. She performs them; flow rules score it.  */
  /* ==================================================================== */
  var COMBO = {
    id: 'combo', name: 'Combo Creator', icon: '🧩', zone: 'chor',
    music: 'pop', room: 'choreography', timed: false, duration: 999,
    blurb: 'Build a three-move combo that flows.',
    instruction: 'Pick 3 moves with 1-4 (or tap). Mix your families and finish on a hold!',
    science: 'core',
    setup: function () {
      this.rounds = 4;
      this.round = 1;
      this.picked = [];
      this.performing = false;
      this.performIdx = 0;
      this.performT = 0;
      this.rollPads();
    },
    rollPads: function () {
      /* offer a spread the player can actually make a good choice from */
      var homeSkills = AcroSkills.list.filter(function (s) { return s.tier === 'home'; });
      var pool = homeSkills.slice();
      this.pads = [];
      for (var i = 0; i < 4 && pool.length; i++) {
        this.pads.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      this.lit = -1;
    },
    onPress: function (a) {
      if (this.performing) return;
      var idx = { P1: 0, P2: 1, P3: 2, P4: 3, LEFT: 0, DOWN: 1, UP: 2, RIGHT: 3 }[a];
      if (idx === undefined || !this.pads[idx]) return;
      this.lit = idx;
      var self = this;
      setTimeout(function () { self.lit = -1; }, 150);
      this.picked.push(this.pads[idx]);
      this.gym.playSkill(this.pads[idx], false);
      AcroAudio.sfx.good();
      if (this.picked.length >= 3) this.perform();
      else this.rollPads();
    },
    perform: function () {
      this.performing = true;
      this.performIdx = 0;
      this.performT = 0;
      this.message = 'Performing your combo…';
      this.messageT = 2.2;
    },
    /* Flow rules, stated plainly so the player can learn them:
       variety of families, no immediate repeats, ends on a hold, difficulty. */
    scoreCombo: function () {
      var p = this.picked, fams = {}, i, repeats = 0;
      for (i = 0; i < p.length; i++) {
        fams[p[i].family] = 1;
        if (i && p[i].id === p[i - 1].id) repeats++;
      }
      var variety = Object.keys(fams).length / 3;          // 0..1
      var endsHold = p[p.length - 1].type === 'hold' ? 1 : 0;
      var difficulty = p.reduce(function (a, s) { return a + s.level; }, 0) / 12;
      var noRepeat = 1 - repeats / 2;
      var q = clamp(variety * 0.42 + endsHold * 0.22 + clamp(difficulty, 0, 1) * 0.2 + noRepeat * 0.16, 0, 1);
      var notes = [];
      notes.push(variety >= 0.99 ? 'Three different families — lovely variety.'
                                 : 'Try mixing more families next time.');
      notes.push(endsHold ? 'Finished on a hold. Judges love a clean ending.'
                          : 'Finish on a hold to give it an ending.');
      if (repeats) notes.push('Two of the same move in a row lost you some flow.');
      return { q: q, notes: notes };
    },
    tick: function (dt) {
      if (!this.performing) return;
      this.performT -= dt;
      if (this.performT <= 0) {
        if (this.performIdx < this.picked.length) {
          var s = this.picked[this.performIdx];
          this.gym.playSkill(s, s.type === 'hold');
          this.performT = s.dur + 0.25;
          this.performIdx++;
          this.fx.burst(this.gymPos ? this.gymPos.x : this.w / 2,
                        this.h * this.stage.floorFrac - 40, s.color, 14, 0.8);
        } else {
          var r = this.scoreCombo();
          this.award(r.q, this.w / 2, this.h * 0.28);
          this.say(r.notes[0], 3.4);
          this.score += Math.round(r.q * 120);
          var self = this;
          this.performing = false;
          setTimeout(function () {
            if (!self.running) return;
            self.round++;
            if (self.round > self.rounds) { self.finish(); return; }
            self.picked = []; self.gym.release(); self.rollPads();
          }, 1600);
        }
      }
    },
    drawGame: function (ctx) {
      var w = this.w, h = this.h;
      /* the three slots */
      var sw = Math.min(120, w * 0.24), gap = 12;
      var total = sw * 3 + gap * 2, x0 = w / 2 - total / 2, y = h * 0.66;
      for (var i = 0; i < 3; i++) {
        var s = this.picked[i];
        var x = x0 + i * (sw + gap);
        ctx.fillStyle = s ? AcroStage.hexA(s.color, 0.30) : 'rgba(255,255,255,0.07)';
        roundRect(ctx, x, y, sw, 42, 12); ctx.fill();
        ctx.strokeStyle = s ? s.color : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, sw, 42, 12); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 12px system-ui, sans-serif';
        ctx.fillStyle = s ? '#fff' : 'rgba(255,255,255,0.35)';
        ctx.fillText(s ? s.short : (i + 1) + '?', x + sw / 2, y + 21);
      }
      ctx.textAlign = 'center';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('COMBO ' + Math.min(this.round, this.rounds) + ' / ' + this.rounds, w / 2, y - 14);
      if (!this.performing) drawPads.call(this, ctx, this.pads, this.lit);
    }
  };

  /* ==================================================================== */
  var GAMES = [LANDING, BALANCE, MEMORY, MIRROR, SPIN, FREEZE, COMBO];
  var BY_ID = {};
  GAMES.forEach(function (g) { BY_ID[g.id] = g; });

  global.MiniGames = {
    list: GAMES,
    byId: function (id) { return BY_ID[id]; },
    create: function (id) {
      var def = BY_ID[id];
      return def ? new MiniGame(def) : null;
    },
    MiniGame: MiniGame,
    roundRect: roundRect,
    drawCoachBubble: drawCoachBubble,
    wrapText: wrapText
  };
})(window);
