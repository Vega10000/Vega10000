/* =========================================================================
   character.js — the gymnast.

   A 2D skeleton driven by the keyframed clips in skills.js. Angles rather
   than raw points, so limbs keep their length no matter how a pose is
   interpolated — a point-lerp would stretch her arms mid-cartwheel.

   Extras that sell the motion:
     - toes auto-point whenever the feet leave the floor, the way a coached
       gymnast's do
     - a spring-chain ponytail that lags and whips through rotations
     - a motion trail of recent skeletons, brightest at the front
   ========================================================================= */

(function (global) {
  'use strict';

  var D2R = Math.PI / 180;

  /* Bone lengths, in body units. Standing height works out around 125u. */
  var B = {
    spine: 34, neck: 19, headR: 12.5,
    shoulderDX: 13, upperArm: 24, foreArm: 22,
    hipDX: 11, thigh: 30, shin: 28, foot: 11
  };

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Angles must interpolate the short way round, or a 350deg -> 10deg step
     spins the limb backwards through the whole circle. */
  function lerpAngle(a, b, t) {
    var d = ((b - a) % 360 + 540) % 360 - 180;
    return a + d * t;
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var ANGLE_KEYS = ['rot', 'spine', 'neck', 'armLA', 'armLB', 'armRA', 'armRB',
                    'legLA', 'legLB', 'legRA', 'legRB', 'footL', 'footR'];
  var LINEAR_KEYS = ['x', 'y', 'squash'];

  function blendPose(a, b, t) {
    var out = {}, i;
    for (i = 0; i < ANGLE_KEYS.length; i++) {
      out[ANGLE_KEYS[i]] = lerpAngle(a[ANGLE_KEYS[i]], b[ANGLE_KEYS[i]], t);
    }
    for (i = 0; i < LINEAR_KEYS.length; i++) {
      out[LINEAR_KEYS[i]] = lerp(a[LINEAR_KEYS[i]], b[LINEAR_KEYS[i]], t);
    }
    return out;
  }

  /* Sample a clip at normalised time p (0..1). */
  function sampleClip(clip, p) {
    if (p <= clip[0].t) return blendPose(clip[0].pose, clip[0].pose, 0);
    var last = clip[clip.length - 1];
    if (p >= last.t) return blendPose(last.pose, last.pose, 0);
    for (var i = 0; i < clip.length - 1; i++) {
      var f0 = clip[i], f1 = clip[i + 1];
      if (p >= f0.t && p <= f1.t) {
        var span = (f1.t - f0.t) || 1;
        return blendPose(f0.pose, f1.pose, easeInOut((p - f0.t) / span));
      }
    }
    return blendPose(last.pose, last.pose, 0);
  }

  /* Standing hip height: thigh + shin. The draw anchor is the mat surface,
     so the pelvis sits this far above it when she is stood up straight. */
  var HIP_H = 58;

  /* ---- skeleton solve --------------------------------------------------- */
  function pt(x, y) { return { x: x, y: y }; }
  function step(p, angDeg, len) {
    var a = angDeg * D2R;
    return pt(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len);
  }

  /* Toes point automatically whenever she is airborne or inverted, on top of
     whatever the pose asked for. Real coaching cue, and it reads instantly. */
  function autoPoint(pose) {
    var air = Math.max(0, Math.min(1, -pose.y / 34));
    var r = ((pose.rot % 360) + 360) % 360;
    var inverted = (r > 110 && r < 250) ? 1 : 0;
    return Math.max(air, inverted) * 58;
  }

  function solve(pose, scale) {
    var s = scale, ap = autoPoint(pose);
    var rot = pose.rot;
    var sq = pose.squash === undefined ? 1 : pose.squash;

    /* Everything is authored in body space then rotated about the pelvis. */
    function A(x) { return x + rot; }

    var pelvis = pt(0, 0);
    var chest = step(pelvis, A(pose.spine), B.spine * s * sq);
    var head = step(chest, A(pose.neck), B.neck * s);

    var shR = step(chest, A(pose.spine + 90), B.shoulderDX * s);
    var shL = step(chest, A(pose.spine - 90), B.shoulderDX * s);
    var hipR = step(pelvis, A(pose.spine + 90), B.hipDX * s);
    var hipL = step(pelvis, A(pose.spine - 90), B.hipDX * s);

    var elbL = step(shL, A(pose.armLA), B.upperArm * s);
    var handL = step(elbL, A(pose.armLB), B.foreArm * s);
    var elbR = step(shR, A(pose.armRA), B.upperArm * s);
    var handR = step(elbR, A(pose.armRB), B.foreArm * s);

    var kneeL = step(hipL, A(pose.legLA), B.thigh * s * sq);
    var footLp = step(kneeL, A(pose.legLB), B.shin * s * sq);
    var toeL = step(footLp, A(pose.legLB - 90 + pose.footL + ap), B.foot * s);

    var kneeR = step(hipR, A(pose.legRA), B.thigh * s * sq);
    var footRp = step(kneeR, A(pose.legRB), B.shin * s * sq);
    var toeR = step(footRp, A(pose.legRB - 90 + pose.footR + ap), B.foot * s);

    return {
      pelvis: pelvis, chest: chest, head: head,
      shL: shL, shR: shR, hipL: hipL, hipR: hipR,
      elbL: elbL, handL: handL, elbR: elbR, handR: handR,
      kneeL: kneeL, footL: footLp, toeL: toeL,
      kneeR: kneeR, footR: footRp, toeR: toeR,
      headAngle: pose.neck + rot, scale: s
    };
  }

  /* ---- drawing helpers -------------------------------------------------- */
  /* Tapered limb: a quad that is fatter at the joint end than the tip. */
  function limb(ctx, a, b, w0, w1, fill) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var th = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.moveTo(a.x + nx * w0, a.y + ny * w0);
    ctx.lineTo(b.x + nx * w1, b.y + ny * w1);
    ctx.arc(b.x, b.y, w1, th, th + Math.PI, true);
    ctx.lineTo(a.x - nx * w0, a.y - ny * w0);
    ctx.arc(a.x, a.y, w0, th + Math.PI, th, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function Gymnast(opts) {
    opts = opts || {};
    this.scale = opts.scale || 1;
    this.skin = opts.skin || '#f0c9a8';
    this.leo = opts.leo || '#ff4f9a';
    this.leo2 = opts.leo2 || '#7a3cff';
    this.hair = opts.hair || '#3a2418';
    this.pose = AcroSkills.pose();
    this.basePose = AcroSkills.pose();
    this.clip = null;
    this.clipT = 0;
    this.clipDur = 1;
    this.holding = false;
    this.idlePhase = Math.random() * 6.28;
    this.trail = [];
    this.trailMax = 9;
    /* ponytail: chain of points that chase the head with damping */
    this.tail = [];
    for (var i = 0; i < 5; i++) this.tail.push({ x: 0, y: 0, vx: 0, vy: 0 });
    this.tailInit = false;
  }

  Gymnast.prototype.playSkill = function (skill, hold) {
    this.clip = skill.clip;
    this.clipDur = skill.dur;
    this.clipT = 0;
    this.holding = !!hold;
    this.skillId = skill.id;
  };

  Gymnast.prototype.release = function () { this.holding = false; };

  Gymnast.prototype.isBusy = function () { return !!this.clip; };

  Gymnast.prototype.update = function (dt, beatPhase) {
    this.idlePhase += dt * 2.2;

    if (this.clip) {
      this.clipT += dt;
      var p = this.clipT / this.clipDur;
      if (this.holding) {
        /* Hold notes freeze on the final shape until released, with a small
           live wobble so she never looks like a paused screenshot. */
        p = Math.min(p, 1);
        this.pose = sampleClip(this.clip, p);
        var w = Math.sin(this.idlePhase * 1.7) * 1.4;
        this.pose.rot += w * 0.5;
        this.pose.spine += w;
      } else if (p >= 1) {
        this.clip = null;
        this.pose = AcroSkills.pose();
      } else {
        this.pose = sampleClip(this.clip, p);
      }
    } else {
      /* Idle: a light bounce on the beat so she is always dancing to the
         track rather than standing frozen between notes. */
      var bob = Math.sin(this.idlePhase) * 1.6;
      var pulse = beatPhase === undefined ? 0 : Math.pow(1 - beatPhase, 3) * 4;
      this.pose = AcroSkills.pose({
        y: bob - pulse,
        spine: -90 + Math.sin(this.idlePhase * 0.6) * 2.5,
        neck: -90 + Math.sin(this.idlePhase * 0.5) * 3,
        armLA: 112 + Math.sin(this.idlePhase) * 7,
        armLB: 104 + Math.sin(this.idlePhase + 0.6) * 10,
        armRA: 68 - Math.sin(this.idlePhase) * 7,
        armRB: 76 - Math.sin(this.idlePhase + 0.6) * 10,
        legLA: 96 + Math.sin(this.idlePhase * 0.5) * 1.5,
        legRA: 84 - Math.sin(this.idlePhase * 0.5) * 1.5
      });
    }
    return this.pose;
  };

  /* Ponytail integration in world space, so it whips correctly through spins. */
  Gymnast.prototype.updateTail = function (headWorld, dt, angle) {
    var i, anchor = headWorld;
    if (!this.tailInit) {
      for (i = 0; i < this.tail.length; i++) { this.tail[i].x = anchor.x; this.tail[i].y = anchor.y; }
      this.tailInit = true;
    }
    var segLen = 6 * this.scale;
    var prev = anchor;
    dt = Math.min(dt, 0.05);
    for (i = 0; i < this.tail.length; i++) {
      var n = this.tail[i];
      n.vy += 620 * dt * this.scale;                  // gravity
      n.vx *= 0.90; n.vy *= 0.90;                     // damping
      n.x += n.vx * dt; n.y += n.vy * dt;
      /* constrain to the segment ahead of it */
      var dx = n.x - prev.x, dy = n.y - prev.y, d = Math.hypot(dx, dy) || 1;
      var k = (d - segLen) / d;
      n.x -= dx * k; n.y -= dy * k;
      n.vx -= dx * k / Math.max(dt, 0.001) * 0.28;
      n.vy -= dy * k / Math.max(dt, 0.001) * 0.28;
      prev = n;
    }
  };

  Gymnast.prototype.draw = function (ctx, ox, oy, dt, opts) {
    opts = opts || {};
    var s = this.scale;
    var j = solve(this.pose, s);

    /* `oy` is the mat surface. Place the pelvis a standing hip-height above
       it, then apply the pose's own vertical offset (negative = airborne). */
    var px = ox + this.pose.x * s;
    var py = oy - HIP_H * s + this.pose.y * s;

    /* Safety net: while she is not airborne, no joint may sink below the mat.
       This is what keeps hands planted through a cartwheel and stops a lying
       shape from floating, without hand-tuning every keyframe. */
    if (this.pose.y >= 0) {
      var lowest = -Infinity, key;
      for (key in j) {
        if (j[key] && typeof j[key] === 'object' && j[key].y !== undefined) {
          if (j[key].y > lowest) lowest = j[key].y;
        }
      }
      var overshoot = (py + lowest) - oy;
      if (overshoot > 0) py -= overshoot;
    }

    /* --- motion trail: recent skeletons, faded ------------------------- */
    if (!opts.noTrail) {
      this.trail.push({ j: j, x: px, y: py });
      if (this.trail.length > this.trailMax) this.trail.shift();
      for (var t = 0; t < this.trail.length - 1; t++) {
        var f = this.trail[t];
        var a = (t / this.trail.length) * 0.26;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(f.x, f.y);
        this._bones(ctx, f.j, this.leo, this.leo, true);
        ctx.restore();
      }
    }

    /* --- ponytail, in world space, drawn behind her -------------------- */
    var headW = { x: px + j.head.x, y: py + j.head.y };
    this.updateTail(headW, dt || 0.016, j.headAngle);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.hair;
    for (var i = 0; i < this.tail.length - 1; i++) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(1.5, (6 - i * 0.95)) * s;
      ctx.moveTo(this.tail[i].x, this.tail[i].y);
      ctx.lineTo(this.tail[i + 1].x, this.tail[i + 1].y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(px, py);
    if (opts.glow) {
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur = 26;
    }
    this._bones(ctx, j, this.skin, this.leo, false);
    ctx.restore();

    return { headWorld: headW, joints: j, x: px, y: py };
  };

  /* Body rendering, in local (pelvis-origin) space. */
  Gymnast.prototype._bones = function (ctx, j, skin, leo, flat) {
    var s = this.scale;
    var w = function (n) { return n * s; };

    /* far-side limbs first, dimmed, so the figure reads with depth */
    var far = flat ? leo : shade(skin, -0.09);
    var farLeo = flat ? leo : shade(leo, -0.10);
    limb(ctx, j.shR, j.elbR, w(5.4), w(4.2), far);
    limb(ctx, j.elbR, j.handR, w(4.2), w(3.2), far);
    limb(ctx, j.hipR, j.kneeR, w(7.0), w(5.2), farLeo);
    limb(ctx, j.kneeR, j.footR, w(5.2), w(3.4), far);
    limb(ctx, j.footR, j.toeR, w(3.4), w(2.0), far);

    /* torso: a filled quad from shoulders to hips, in the leotard colour */
    ctx.beginPath();
    ctx.moveTo(j.shL.x, j.shL.y);
    ctx.lineTo(j.shR.x, j.shR.y);
    ctx.lineTo(j.hipR.x, j.hipR.y);
    ctx.lineTo(j.hipL.x, j.hipL.y);
    ctx.closePath();
    if (flat) {
      ctx.fillStyle = leo;
    } else {
      var g = ctx.createLinearGradient(j.shL.x, j.shL.y, j.hipR.x, j.hipR.y);
      g.addColorStop(0, this.leo);
      g.addColorStop(1, this.leo2);
      ctx.fillStyle = g;
    }
    ctx.fill();
    /* widen the torso slightly with a stroke so it is not a thin sliver */
    ctx.lineWidth = w(5); ctx.lineJoin = 'round'; ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    /* near-side limbs */
    limb(ctx, j.hipL, j.kneeL, w(7.0), w(5.2), flat ? leo : shade(leo, 0.06));
    limb(ctx, j.kneeL, j.footL, w(5.2), w(3.4), skin);
    limb(ctx, j.footL, j.toeL, w(3.4), w(2.0), skin);
    limb(ctx, j.shL, j.elbL, w(5.4), w(4.2), skin);
    limb(ctx, j.elbL, j.handL, w(4.2), w(3.2), skin);

    /* neck + head */
    limb(ctx, j.chest, j.head, w(5.0), w(4.4), skin);
    ctx.beginPath();
    ctx.arc(j.head.x, j.head.y, w(12.5), 0, Math.PI * 2);
    ctx.fillStyle = skin; ctx.fill();

    if (flat) return;

    /* hair cap, rotated with the head so it never floats */
    ctx.save();
    ctx.translate(j.head.x, j.head.y);
    ctx.rotate((j.headAngle + 90) * D2R);
    ctx.fillStyle = this.hair;
    /* crown only — the fringe stops above the eyes so the face stays open */
    ctx.beginPath();
    ctx.ellipse(0, w(-4.2), w(12.7), w(9.6), 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, w(-5.0), w(12.9), w(5.4), 0, 0, Math.PI * 2);
    ctx.fill();

    /* face: two eyes and a smile, drawn in head space */
    ctx.fillStyle = '#2a1f1a';
    ctx.beginPath(); ctx.arc(w(-4.6), w(2.0), w(1.7), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w(4.6), w(2.0), w(1.7), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b5615a'; ctx.lineWidth = w(1.3); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, w(4.4), w(4.0), 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
    ctx.restore();
  };

  /* Lighten/darken a hex colour without pulling in a colour library. */
  function shade(hex, amt) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    function f(v) {
      v = amt >= 0 ? v + (255 - v) * amt : v * (1 + amt);
      return Math.max(0, Math.min(255, Math.round(v)));
    }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  global.AcroCharacter = {
    Gymnast: Gymnast,
    solve: solve,
    sampleClip: sampleClip,
    blendPose: blendPose,
    bones: B,
    shade: shade
  };
})(window);
