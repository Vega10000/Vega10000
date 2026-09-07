/* =========================================================================
   stage.js — the gym itself.

   Drawn in layers back-to-front, each reacting to the music at a different
   strength so the room feels like it is listening to the track:
     sky -> truss + banners -> crowd -> spotlights -> back wall -> floor
   Everything is procedural; no image assets to load or go missing.
   ========================================================================= */

(function (global) {
  'use strict';

  var PALETTES = {
    warmup:   { top: '#2b1c46', bot: '#0f0a1e', accent: '#ff8b3d', floor: '#3a2350', glow: '#ffb648' },
    shapes:   { top: '#2a1450', bot: '#0d0820', accent: '#ff4f9a', floor: '#3b1f5c', glow: '#ff5fa2' },
    balance:  { top: '#0f2a44', bot: '#06121f', accent: '#4fd1ff', floor: '#123a55', glow: '#7dffb8' },
    strength: { top: '#3a2010', bot: '#150b06', accent: '#ffb648', floor: '#4a2a14', glow: '#ff8b3d' },
    flex:     { top: '#301444', bot: '#100720', accent: '#c17bff', floor: '#40205a', glow: '#c17bff' },
    tumbling: { top: '#101c48', bot: '#060a1c', accent: '#4fd1ff', floor: '#18265c', glow: '#4fd1ff' },
    showcase: { top: '#3d0f38', bot: '#100418', accent: '#ffc84a', floor: '#4d1442', glow: '#ffc84a' },
    hub:      { top: '#241546', bot: '#0b0718', accent: '#ff4f9a', floor: '#33205a', glow: '#c17bff' }
  };

  function Stage() {
    this.pal = PALETTES.hub;
    this.t = 0;
    this.floorFrac = 0.70;   // where the mat meets the back wall, as a fraction of height
    this.crowd = [];
    this.banners = [];
    this.seed = 12345;
    this.reduceMotion = false;
    this._build();
  }

  /* Deterministic RNG so the crowd looks identical every reload — a room
     that reshuffles itself each frame reads as noise, not as a room. */
  Stage.prototype._rnd = function () {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  };

  Stage.prototype._build = function () {
    this.seed = 12345;
    this.crowd = [];
    var cols = ['#ffd9a8', '#e8b48a', '#c98b62', '#a06a48', '#f2c9a0', '#8a5a3c'];
    var shirt = ['#ff4f9a', '#4fd1ff', '#ffc84a', '#7dffb8', '#c17bff', '#ff8b3d', '#e8e8f0'];
    for (var row = 0; row < 4; row++) {
      for (var i = 0; i < 34; i++) {
        this.crowd.push({
          row: row,
          fx: (i + this._rnd() * 0.6) / 34,
          skin: cols[(this._rnd() * cols.length) | 0],
          shirt: shirt[(this._rnd() * shirt.length) | 0],
          phase: this._rnd() * 6.28,
          bounce: 0.6 + this._rnd() * 0.8
        });
      }
    }
    this.banners = [
      { txt: 'ACRO ACADEMY', fx: 0.16 }, { txt: 'POINT YOUR TOES', fx: 0.5 },
      { txt: 'STICK IT', fx: 0.84 }
    ];
  };

  Stage.prototype.setZone = function (key) {
    this.pal = PALETTES[key] || PALETTES.hub;
  };

  Stage.prototype.update = function (dt) { this.t += dt; };

  Stage.prototype.draw = function (ctx, w, h, beatPhase, energy) {
    var pal = this.pal;
    var pulse = this.reduceMotion ? 0 : Math.pow(1 - (beatPhase || 0), 4);
    energy = energy === undefined ? 0.5 : energy;
    var floorY = h * this.floorFrac;

    /* --- sky ---------------------------------------------------------- */
    var g = ctx.createLinearGradient(0, 0, 0, floorY);
    g.addColorStop(0, pal.top);
    g.addColorStop(1, pal.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, floorY);

    /* soft glow behind the athlete, breathing with the kick */
    var gr = ctx.createRadialGradient(w * 0.52, floorY * 0.82, 10,
                                      w * 0.52, floorY * 0.82, w * (0.40 + pulse * 0.05));
    gr.addColorStop(0, hexA(pal.glow, 0.20 + pulse * 0.13));
    gr.addColorStop(1, hexA(pal.glow, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, floorY);

    /* --- roof truss --------------------------------------------------- */
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2;
    var ty = h * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, ty); ctx.lineTo(w, ty);
    ctx.moveTo(0, ty + 16); ctx.lineTo(w, ty + 16);
    for (var x = 0; x < w; x += 34) {
      ctx.moveTo(x, ty); ctx.lineTo(x + 17, ty + 16);
      ctx.moveTo(x + 17, ty + 16); ctx.lineTo(x + 34, ty);
    }
    ctx.stroke();

    /* --- banners (skipped when the room is too short for them) -------- */
    for (var b = 0; h > 560 && b < this.banners.length; b++) {
      var bn = this.banners[b];
      var bx = bn.fx * w, sway = Math.sin(this.t * 0.9 + b) * 3;
      ctx.save();
      ctx.translate(bx, ty + 18);
      ctx.rotate(sway * 0.002);
      ctx.fillStyle = hexA(pal.accent, 0.20);
      ctx.fillRect(-62, 0, 124, 40);
      ctx.strokeStyle = hexA(pal.accent, 0.45); ctx.lineWidth = 2;
      ctx.strokeRect(-62, 0, 124, 40);
      ctx.fillStyle = hexA('#ffffff', 0.55);
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bn.txt, 0, 21);
      ctx.restore();
    }

    /* --- crowd, up in the stands -------------------------------------- */
    var baseY = floorY - h * 0.26;
    for (var i = 0; i < this.crowd.length; i++) {
      var p = this.crowd[i];
      var depth = 1 - p.row * 0.15;
      var cx = p.fx * w;
      var cy = baseY - p.row * h * 0.028;
      var bounce = this.reduceMotion ? 0
        : Math.sin(this.t * 4.2 + p.phase) * 2.0 * p.bounce * (0.4 + energy) + pulse * 2.4;
      var r = 4.4 * depth;
      ctx.globalAlpha = (0.16 + depth * 0.26);
      ctx.fillStyle = p.shirt;
      ctx.fillRect(cx - r, cy - bounce, r * 2, r * 2.4);
      ctx.fillStyle = p.skin;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.9 - bounce, r * 0.85, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* --- back wall below the stands ----------------------------------- */
    var wallTop = baseY + h * 0.035;
    var wg = ctx.createLinearGradient(0, wallTop, 0, floorY);
    wg.addColorStop(0, hexA('#000000', 0.42));
    wg.addColorStop(1, hexA('#000000', 0.16));
    ctx.fillStyle = wg;
    ctx.fillRect(0, wallTop, w, floorY - wallTop);
    ctx.strokeStyle = hexA(pal.accent, 0.30);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, wallTop); ctx.lineTo(w, wallTop); ctx.stroke();

    /* --- spotlights --------------------------------------------------- */
    if (!this.reduceMotion) {
      for (var s = 0; s < 3; s++) {
        var ang = Math.sin(this.t * (0.35 + s * 0.12) + s * 2.1) * 0.42;
        var sx = w * (0.22 + s * 0.28);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(sx, ty + 20);
        ctx.rotate(ang);
        var lg = ctx.createLinearGradient(0, 0, 0, floorY);
        var col = [pal.glow, pal.accent, '#ffffff'][s];
        lg.addColorStop(0, hexA(col, 0.20 + pulse * 0.10));
        lg.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-w * 0.20, floorY);
        ctx.lineTo(w * 0.20, floorY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    /* --- floor -------------------------------------------------------- */
    var fg = ctx.createLinearGradient(0, floorY, 0, h);
    fg.addColorStop(0, pal.floor);
    fg.addColorStop(1, shadeHex(pal.floor, -0.55));
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorY, w, h - floorY);

    /* perspective mat lines, fading with distance so they sit behind her */
    ctx.lineWidth = 1;
    for (var L = 0; L <= 12; L++) {
      var f = L / 12;
      var yy = floorY + Math.pow(f, 1.7) * (h - floorY);
      ctx.strokeStyle = hexA('#ffffff', 0.018 + f * 0.045);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
    ctx.strokeStyle = hexA('#ffffff', 0.035);
    for (var v = -6; v <= 6; v++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + v * w * 0.045, floorY);
      ctx.lineTo(w / 2 + v * w * 0.30, h);
      ctx.stroke();
    }

    /* the lit strip she performs on */
    var sg = ctx.createLinearGradient(0, floorY, 0, floorY + 34);
    sg.addColorStop(0, hexA(pal.glow, 0.34 + pulse * 0.16));
    sg.addColorStop(1, hexA(pal.glow, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(0, floorY, w, 34);

    return { floorY: floorY };
  };

  /* Reflection of the athlete in the floor. Called after she is drawn. */
  Stage.prototype.drawReflection = function (ctx, w, h, drawFn) {
    var floorY = h * this.floorFrac;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, floorY, w, h - floorY); ctx.clip();
    ctx.globalAlpha = 0.16;
    ctx.translate(0, floorY * 2);
    ctx.scale(1, -1);
    drawFn(ctx);
    ctx.restore();
  };

  function hexA(hex, a) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return 'rgba(255,255,255,' + a + ')';
    return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' +
           parseInt(m[3], 16) + ',' + a + ')';
  }
  function shadeHex(hex, amt) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    function f(v) {
      v = amt >= 0 ? v + (255 - v) * amt : v * (1 + amt);
      return Math.max(0, Math.min(255, Math.round(v)));
    }
    return 'rgb(' + f(parseInt(m[1], 16)) + ',' + f(parseInt(m[2], 16)) + ',' +
           f(parseInt(m[3], 16)) + ')';
  }

  global.AcroStage = { Stage: Stage, palettes: PALETTES, hexA: hexA };
})(window);
