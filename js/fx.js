/* =========================================================================
   fx.js — particles, pop text and screen feel.

   One flat pool of particles with a `kind` tag rather than a class per
   effect: the whole system updates and draws in two tight loops, which keeps
   frame cost predictable even when a 50-combo is throwing confetti.
   ========================================================================= */

(function (global) {
  'use strict';

  function FX() {
    this.parts = [];
    this.texts = [];
    this.rings = [];
    this.shake = 0;
    this.shakeDecay = 6;
    this.flash = 0;
    this.flashColor = '#fff';
    this.max = 900;
    this.reduceMotion = false;
  }

  FX.prototype.clear = function () {
    this.parts.length = 0; this.texts.length = 0; this.rings.length = 0;
    this.shake = 0; this.flash = 0;
  };

  FX.prototype._push = function (p) {
    if (this.parts.length >= this.max) this.parts.shift();
    this.parts.push(p);
  };

  /* Bright radial burst — the Perfect-hit reward. */
  FX.prototype.burst = function (x, y, color, count, power) {
    if (this.reduceMotion) count = Math.ceil(count * 0.35);
    power = power || 1;
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (70 + Math.random() * 230) * power;
      this._push({
        kind: 'spark', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.4 + Math.random() * 0.5, age: 0,
        size: 1.6 + Math.random() * 3.2, color: color, grav: 320, drag: 0.94
      });
    }
  };

  /* Chalk dust — puffs up wherever her hands or feet strike the floor. */
  FX.prototype.chalk = function (x, y, count) {
    if (this.reduceMotion) count = Math.ceil(count * 0.4);
    for (var i = 0; i < (count || 10); i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.0;
      var sp = 20 + Math.random() * 70;
      this._push({
        kind: 'dust', x: x + (Math.random() - 0.5) * 22, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.7 + Math.random() * 0.8, age: 0,
        size: 5 + Math.random() * 11, color: '#ffffff', grav: -14, drag: 0.93
      });
    }
  };

  FX.prototype.confetti = function (w, h, count) {
    if (this.reduceMotion) count = Math.ceil(count * 0.4);
    var cols = ['#ff4f9a', '#ffc84a', '#4fd1ff', '#7dffb8', '#c17bff', '#ff8b3d'];
    for (var i = 0; i < (count || 90); i++) {
      this._push({
        kind: 'confetti', x: Math.random() * w, y: -20 - Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 90, vy: 90 + Math.random() * 190,
        life: 2.6 + Math.random() * 2.2, age: 0,
        size: 5 + Math.random() * 7, color: cols[(Math.random() * cols.length) | 0],
        grav: 46, drag: 0.995, spin: (Math.random() - 0.5) * 12, rot: Math.random() * 6.28,
        aspect: 0.45 + Math.random() * 0.3
      });
    }
  };

  /* Trailing ribbon dot — dropped along her hands during a skill. */
  FX.prototype.ribbon = function (x, y, color) {
    this._push({
      kind: 'ribbon', x: x, y: y, vx: 0, vy: -8,
      life: 0.5, age: 0, size: 5.5, color: color, grav: 0, drag: 0.9
    });
  };

  FX.prototype.popText = function (x, y, text, color, size) {
    this.texts.push({
      x: x, y: y, text: text, color: color, size: size || 30,
      life: 0.95, age: 0, vy: -76
    });
  };

  FX.prototype.ring = function (x, y, color, r0, r1, life) {
    this.rings.push({
      x: x, y: y, color: color, r0: r0 || 8, r1: r1 || 90,
      life: life || 0.5, age: 0
    });
  };

  FX.prototype.kick = function (amount, color) {
    if (this.reduceMotion) amount *= 0.3;
    this.shake = Math.min(this.shake + amount, 26);
    if (color) { this.flash = Math.min(0.5, this.flash + 0.20); this.flashColor = color; }
  };

  FX.prototype.update = function (dt) {
    var i, p;
    for (i = this.parts.length - 1; i >= 0; i--) {
      p = this.parts[i];
      p.age += dt;
      if (p.age >= p.life) { this.parts.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.spin) p.rot += p.spin * dt;
    }
    for (i = this.texts.length - 1; i >= 0; i--) {
      var t = this.texts[i];
      t.age += dt; t.y += t.vy * dt; t.vy *= 0.90;
      if (t.age >= t.life) this.texts.splice(i, 1);
    }
    for (i = this.rings.length - 1; i >= 0; i--) {
      var r = this.rings[i];
      r.age += dt;
      if (r.age >= r.life) this.rings.splice(i, 1);
    }
    this.shake = Math.max(0, this.shake - this.shakeDecay * dt * 10);
    this.flash = Math.max(0, this.flash - dt * 2.2);
  };

  FX.prototype.shakeOffset = function () {
    if (this.shake <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shake,
      y: (Math.random() - 0.5) * this.shake
    };
  };

  FX.prototype.draw = function (ctx) {
    var i, p, k;
    ctx.save();
    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * p.aspect / 2, p.size, p.size * p.aspect);
        ctx.restore();
      } else if (p.kind === 'dust') {
        ctx.globalAlpha = Math.max(0, k) * 0.42;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, 6.2832); ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        if (p.kind === 'spark') { ctx.shadowColor = p.color; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, 6.2832); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < this.rings.length; i++) {
      var r = this.rings[i], t = r.age / r.life;
      ctx.globalAlpha = Math.max(0, 1 - t) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * t, 0, 6.2832);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < this.texts.length; i++) {
      var tx = this.texts[i], a = 1 - tx.age / tx.life;
      var pop = tx.age < 0.12 ? 1 + (0.12 - tx.age) * 3.2 : 1;
      ctx.globalAlpha = Math.max(0, a);
      ctx.save();
      ctx.translate(tx.x, tx.y);
      ctx.scale(pop, pop);
      ctx.font = '900 ' + tx.size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,6,20,0.75)';
      ctx.strokeText(tx.text, 0, 0);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  FX.prototype.drawFlash = function (ctx, w, h) {
    if (this.flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.flash;
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  global.AcroFX = { FX: FX };
})(window);
