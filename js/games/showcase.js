/* =========================================================================
   showcase.js — the cinematic replay and the certificate.

   Two things that only happen after a performance:

   REPLAY   Plays back what she actually did, with a camera that pushes in,
            slow-motion on her best moment, letterbox bars and a crowd. The
            sequence is the real one recorded during the run, not a canned
            animation — if she missed a skill, it is not in the replay.

   CERTIFICATE  A canvas-drawn certificate she can look at and save as a
            PNG. Drawn rather than exported from the DOM so it works from a
            file:// double-click with no libraries.
   ========================================================================= */

(function (global) {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ==================================================================== */
  /*  CINEMATIC REPLAY                                                    */
  /* ==================================================================== */
  function Replay() {
    this.stage = new AcroStage.Stage();
    this.fx = new AcroFX.FX();
    this.gym = new AcroCharacter.Gymnast({ scale: 1 });
    this.running = false;
    this._raf = null;
  }

  Replay.prototype.attach = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  };

  Replay.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var r = this.canvas.getBoundingClientRect();
    var w = Math.max(280, r.width), h = Math.max(180, r.height);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.gym.scale = clamp(Math.min(h / 360, w / 300), 0.5, 1.8);
  };

  /* performed: [{skillId, judgment, quality}] from the run */
  Replay.prototype.start = function (performed, opts) {
    opts = opts || {};
    this.opts = opts;
    this.seq = (performed || []).filter(function (p) { return AcroSkills.byId(p.skillId); });
    if (!this.seq.length) {
      /* nothing landed — replay the routine she designed instead of nothing */
      this.seq = (opts.fallback || ['releve', 'straddle', 'chasse']).map(function (id) {
        return { skillId: id, quality: 0.6 };
      });
    }
    /* keep replays watchable: at most twelve beats of highlights */
    if (this.seq.length > 12) {
      var step = this.seq.length / 12, out = [];
      for (var i = 0; i < 12; i++) out.push(this.seq[Math.floor(i * step)]);
      this.seq = out;
    }
    /* the best moment gets the slow-motion push-in */
    this.highlight = 0;
    var bestQ = -1;
    for (var k = 0; k < this.seq.length; k++) {
      if (this.seq[k].quality > bestQ) { bestQ = this.seq[k].quality; this.highlight = k; }
    }

    this.stage.setZone('showcase');
    this.stage.reduceMotion = !!opts.reduceMotion;
    this.fx.reduceMotion = !!opts.reduceMotion;
    this.fx.clear();
    this.gym.trail.length = 0;
    this.gym.tailInit = false;
    if (opts.avatar) {
      this.gym.skin = opts.avatar.skin; this.gym.hair = opts.avatar.hair;
      this.gym.leo = opts.avatar.leo; this.gym.leo2 = opts.avatar.leo2;
    }

    this.idx = -1;
    this.t = 0;
    this.elapsed = 0;
    this.letterbox = 0;
    this.zoom = 1;
    this.panX = 0;
    this.done = false;
    this.onDone = opts.onDone || null;
    this.nextClip();

    AcroAudio.play('cinematic');
    AcroAudio.setIntensity(1);
    AcroAudio.sfx.cheer(2.4);

    this.running = true;
    this.last = 0;
    var self = this;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  Replay.prototype.stop = function () {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  };

  Replay.prototype.nextClip = function () {
    this.idx++;
    if (this.idx >= this.seq.length) { this.finish(); return; }
    var s = AcroSkills.byId(this.seq[this.idx].skillId);
    this.cur = s;
    this.slow = this.idx === this.highlight;
    this.gym.playSkill(s, false);
    this.t = 0;
    this.clipLen = s.dur * (this.slow ? 2.6 : 1) + 0.25;
    if (this.slow) AcroAudio.sfx.star();
  };

  Replay.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.gym.playSkill(AcroSkills.byId('armframe'), true);   // the final pose
    AcroAudio.sfx.cheer(2.6);
    this.fx.confetti(this.w, this.h, 180);
    var self = this;
    setTimeout(function () {
      self.stop();
      if (self.onDone) self.onDone();
    }, 3200);
  };

  Replay.prototype.frame = function (ts) {
    if (!this.running) return;
    var raw = this.last ? Math.min((ts - this.last) / 1000, 0.05) : 0.016;
    this.last = ts;
    /* time dilation is what makes it read as a replay rather than a rerun */
    var scale = this.slow && !this.done ? 0.38 : 1;
    var dt = raw * scale;
    this.elapsed += raw;

    if (!this.done) {
      this.t += raw;
      if (this.t >= this.clipLen) this.nextClip();
    }

    /* camera: push in and drift during the highlight, wide otherwise */
    var targetZoom = this.done ? 1.18 : (this.slow ? 1.62 : 1.06);
    var targetPan = this.slow ? Math.sin(this.elapsed * 0.6) * 24 : 0;
    this.zoom = lerp(this.zoom, targetZoom, 1 - Math.pow(0.004, raw));
    this.panX = lerp(this.panX, targetPan, 1 - Math.pow(0.02, raw));
    this.letterbox = lerp(this.letterbox, 1, 1 - Math.pow(0.02, raw));

    this.gym.update(dt, AcroAudio.beatPhase());
    this.stage.update(dt);
    this.fx.update(raw);
    this.render(dt);

    var self = this;
    this._raf = requestAnimationFrame(function (t) { self.frame(t); });
  };

  Replay.prototype.render = function (dt) {
    var ctx = this.ctx, w = this.w, h = this.h;
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    var floorFrac = 0.70;
    ctx.save();
    /* camera transform, anchored on the athlete */
    ctx.translate(w / 2 + this.panX, h * floorFrac);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-w / 2, -h * floorFrac);

    this.stage.floorFrac = floorFrac;
    this.stage.draw(ctx, w, h, AcroAudio.beatPhase(), 1);

    var gx = w * 0.5, gy = h * floorFrac + 8;
    var self = this;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, gy, w, h - gy); ctx.clip();
    this.stage.drawReflection(ctx, w, h, function (c) {
      c.globalAlpha = 0.16;
      self.gym.draw(c, gx, gy, 0, { noTrail: true });
    });
    ctx.restore();
    this.gym.draw(ctx, gx, gy, dt, { glow: 'rgba(255,200,74,0.85)' });
    this.fx.draw(ctx);
    ctx.restore();

    /* letterbox bars */
    var bar = this.letterbox * h * 0.09;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, bar);
    ctx.fillRect(0, h - bar, w, bar);

    /* caption strip */
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    if (bar > 14) {
      ctx.fillText('● REPLAY', 16, bar / 2);
      ctx.textAlign = 'right';
      var label = this.done ? 'FINAL POSE'
                : (this.slow ? 'SLOW MOTION · ' + this.cur.name.toUpperCase()
                             : this.cur.name.toUpperCase());
      ctx.fillText(label, w - 16, bar / 2);
    }
    if (this.slow && !this.done) {
      ctx.textAlign = 'center';
      ctx.font = '900 ' + Math.round(Math.min(w, h) * 0.05) + 'px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,200,74,0.9)';
      ctx.fillText('★ BEST MOMENT ★', w / 2, h - bar - 26);
    }
  };

  /* ==================================================================== */
  /*  CERTIFICATE                                                         */
  /* ==================================================================== */
  /* Drawn straight to canvas so it needs no libraries and no network, and
     so toDataURL works from a file:// page (nothing taints the canvas). */
  function drawCertificate(canvas, data) {
    var W = 1200, H = 850;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ground */
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1a0e36');
    g.addColorStop(0.5, '#241147');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* corner glows */
    [[0, 0, '#ff4f9a'], [W, 0, '#4fd1ff'], [0, H, '#c17bff'], [W, H, '#ffc84a']]
      .forEach(function (c) {
        var rg = ctx.createRadialGradient(c[0], c[1], 10, c[0], c[1], 420);
        rg.addColorStop(0, AcroStage.hexA(c[2], 0.24));
        rg.addColorStop(1, AcroStage.hexA(c[2], 0));
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      });

    /* double border */
    ctx.strokeStyle = 'rgba(255,200,74,0.85)'; ctx.lineWidth = 5;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.strokeStyle = 'rgba(255,200,74,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, W - 92, H - 92);

    ctx.textAlign = 'center';

    /* header */
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillText('A C R O V E R S E   A C A D E M Y', W / 2, 112);

    ctx.font = '900 56px system-ui, sans-serif';
    var tg = ctx.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
    tg.addColorStop(0, '#fff'); tg.addColorStop(0.5, '#ffc84a'); tg.addColorStop(1, '#ff8b3d');
    ctx.fillStyle = tg;
    ctx.fillText('CERTIFICATE OF PERFORMANCE', W / 2, 176);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText('This is to certify that', W / 2, 240);

    /* the name */
    ctx.fillStyle = '#fff';
    ctx.font = '900 66px system-ui, sans-serif';
    ctx.fillText(data.name || 'The Acrobat', W / 2, 316);
    ctx.strokeStyle = 'rgba(255,200,74,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.24, 342); ctx.lineTo(W * 0.76, 342); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText('performed the routine', W / 2, 382);
    ctx.fillStyle = '#8fe9ff';
    ctx.font = '800 32px system-ui, sans-serif';
    ctx.fillText('“' + (data.routine || 'Freestyle') + '”', W / 2, 424);

    /* the numbers */
    var stats = [
      ['SCORE', Number(data.score || 0).toLocaleString()],
      ['STARS', '★'.repeat(data.stars || 0) + '☆'.repeat(3 - (data.stars || 0))],
      ['RANK', data.rank || 'Rookie Acrobat'],
      ['ACCOLADES', String(data.accolades || 0)]
    ];
    var bw = 232, gap = 18, total = stats.length * bw + (stats.length - 1) * gap;
    var x0 = W / 2 - total / 2;
    stats.forEach(function (s, i) {
      var x = x0 + i * (bw + gap), y = 470;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, x, y, bw, 108, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillText(s[0], x + bw / 2, y + 30);
      ctx.fillStyle = '#ffc84a';
      ctx.font = '900 ' + (String(s[1]).length > 14 ? 20 : 28) + 'px system-ui, sans-serif';
      ctx.fillText(String(s[1]), x + bw / 2, y + 72);
    });

    /* the line that actually matters */
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = 'italic 600 19px system-ui, sans-serif';
    wrap(ctx, data.quote ||
      'You thought you were training to become an acrobat. But look at what actually ' +
      'happened. You learned patience. You learned courage. You learned how to fall, ' +
      'recover, and try again. That is what makes an athlete.',
      W / 2, 618, W * 0.66, 26);

    /* seal + signature */
    ctx.beginPath(); ctx.arc(158, H - 128, 54, 0, 6.2832);
    ctx.fillStyle = 'rgba(255,200,74,0.16)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,74,0.8)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffc84a';
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText('🤸', 158, H - 118);

    ctx.textAlign = 'right';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W - 400, H - 118); ctx.lineTo(W - 90, H - 118); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'italic 700 24px system-ui, sans-serif';
    ctx.fillText(data.coach || 'Coach Zuri', W - 100, H - 128);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('HEAD COACH · ACROVERSE ACADEMY', W - 100, H - 96);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('Awarded ' + (data.date || ''), W / 2, H - 62);
  }

  function wrap(ctx, text, cx, y, maxW, lh) {
    var words = String(text).split(' '), line = '', lines = [], i;
    for (i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], cx, y + i * lh);
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

  global.Showcase = {
    Replay: Replay,
    drawCertificate: drawCertificate
  };
})(window);
