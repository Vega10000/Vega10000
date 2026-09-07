/* =========================================================================
   ui.js — screens, navigation and everything that is not the canvas.

   Also owns the two pieces of defensive behaviour that keep the app honest:
     - Coach Nova's speech, which is optional and silently skipped when the
       browser has no speech synthesis
     - the video cards, which verify a thumbnail actually loaded before they
       offer to play, and fall back to a YouTube search when it did not
   ========================================================================= */

(function (global) {
  'use strict';

  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var A = global.AcroAccolades;
  var game = new AcroGame.Game();
  var profile = null;
  var currentLevel = null;
  var lastResult = null;
  var preview = null;

  /* ---------------------------------------------------- screen switching */
  var current = 'scr-boot';
  function show(id) {
    var el = $(current);
    if (el) el.classList.remove('active');
    current = id;
    var next = $(id);
    if (next) { next.classList.add('active'); next.scrollTop = 0; }
    if (id !== 'scr-play') stopPreviewIfLeaving(id);
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ------------------------------------------------------------- speech */
  function speak(text) {
    if (!profile.settings.voice || !text) return;
    var s = global.speechSynthesis;
    if (!s || typeof global.SpeechSynthesisUtterance !== 'function') return;
    try {
      s.cancel();
      var u = new global.SpeechSynthesisUtterance(text);
      u.rate = 1.02; u.pitch = 1.12; u.volume = 0.95;
      s.speak(u);
    } catch (e) { /* some browsers throw when speech is unavailable */ }
  }

  /* ---------------------------------------------------------------- hub */
  function renderHub() {
    var r = A.rank(), nx = A.nextRank();
    $('rank-icon').textContent = r.icon;
    $('rank-name').textContent = r.name;
    var pct = 100;
    if (nx) {
      var span = nx.xp - r.xp;
      pct = span > 0 ? Math.round(((profile.xp - r.xp) / span) * 100) : 0;
    }
    $('rank-fill').style.width = Math.max(3, Math.min(100, pct)) + '%';

    $('hub-stars').textContent = A.totalStars();
    $('hub-badges').textContent = A.earnedCount();
    $('hub-streak').textContent = A.dayStreak();

    renderZones();
    renderSkillStrip();
  }

  function renderZones() {
    var grid = $('zone-grid');
    grid.innerHTML = '';
    var stars = A.totalStars();

    AcroLevels.list.forEach(function (lvl) {
      var unlocked = AcroLevels.isUnlocked(lvl, stars);
      var got = A.levelStars(lvl.id);
      var pal = AcroStage.palettes[lvl.zone] || AcroStage.palettes.hub;

      var b = doc.createElement('button');
      b.className = 'zone';
      b.disabled = !unlocked;

      var starHtml = '';
      for (var i = 0; i < 3; i++) starHtml += '<i class="' + (i < got ? 'on' : '') + '">★</i>';

      b.innerHTML =
        '<div class="zone-glow" style="background:' + pal.glow + '"></div>' +
        '<div class="zone-icon">' + lvl.icon + '</div>' +
        '<div class="zone-name">' + lvl.name + '</div>' +
        '<div class="zone-tag">' + lvl.tagline + '</div>' +
        '<div class="zone-foot">' +
          '<div class="zone-stars">' + starHtml + '</div>' +
          '<div class="zone-lock">' +
            (unlocked ? (got ? 'Best ' + got + '/3' : 'New') : '🔒 ' + lvl.unlock + '★ to unlock') +
          '</div>' +
        '</div>';

      b.addEventListener('click', function () {
        if (!unlocked) { toast('Earn ' + lvl.unlock + ' stars to unlock ' + lvl.name); return; }
        AcroAudio.sfx.click();
        openBrief(lvl);
      });
      grid.appendChild(b);
    });
  }

  function renderSkillStrip() {
    var strip = $('skill-strip');
    strip.innerHTML = '';
    AcroSkills.list.forEach(function (sk) {
      var b = doc.createElement('button');
      b.className = 'skill-card';
      b.innerHTML =
        '<span class="skill-dot" style="background:' + sk.color + '"></span>' +
        '<b>' + sk.name + '</b>' +
        '<span>' + sk.family + '</span>';
      b.addEventListener('click', function () { AcroAudio.sfx.click(); openSkill(sk); });
      strip.appendChild(b);
    });
  }

  /* -------------------------------------------------------------- brief */
  function openBrief(lvl) {
    currentLevel = lvl;
    $('brief-icon').textContent = lvl.icon;
    $('brief-name').textContent = lvl.name;
    $('brief-tag').textContent = lvl.tagline;
    $('brief-coach').textContent = lvl.brief;

    var chips = $('brief-skills');
    chips.innerHTML = '';
    lvl.skills.forEach(function (id) {
      var sk = AcroSkills.byId(id);
      if (!sk) return;
      var c = doc.createElement('button');
      c.className = 'chip';
      c.innerHTML = '<span class="skill-dot" style="background:' + sk.color + '"></span>' +
                    sk.name + ' <b style="opacity:.5;font-weight:700">' +
                    (sk.type === 'hold' ? 'hold' : 'tap') + '</b>';
      c.addEventListener('click', function () { openSkill(sk); });
      chips.appendChild(c);
    });
    show('scr-brief');
    speak(lvl.brief);
  }

  /* --------------------------------------------------------------- play */
  function startLevel(lvl) {
    show('scr-play');
    /* Let layout settle before measuring the canvas, or the first frame is
       sized against a display:none element. */
    requestAnimationFrame(function () {
      game.attach($('game-canvas'));
      game.resize();
      game.fx.reduceMotion = !!profile.settings.reduceMotion;
      game.stage.reduceMotion = !!profile.settings.reduceMotion;
      game.start(lvl.id, {
        onEnd: finishLevel,
        onCoach: function (line) { speak(line); }
      });
    });
  }

  function finishLevel(res) {
    lastResult = res;
    var lvl = AcroLevels.byId(res.levelId);

    /* --- fold the run into the saved profile -------------------------- */
    profile.totalPerfect += res.counts.perfect;
    profile.totalGreat += res.counts.great;
    profile.totalGood += res.counts.good;
    profile.totalMiss += res.counts.miss;
    profile.totalHits += res.counts.perfect + res.counts.great + res.counts.good;
    profile.bestCombo = Math.max(profile.bestCombo, res.bestCombo);
    profile.holdSeconds += res.holdSeconds;
    profile.sessions += 1;
    if (res.flawless) profile.flawless += 1;
    if (lvl && lvl.showcase) profile.showcaseBest = Math.max(profile.showcaseBest, res.score);

    Object.keys(res.cleanReps).forEach(function (id) {
      profile.skillReps[id] = (profile.skillReps[id] || 0) + res.cleanReps[id];
    });

    var rec = profile.levels[res.levelId] || { stars: 0, best: 0, plays: 0 };
    rec.stars = Math.max(rec.stars, res.stars);
    rec.best = Math.max(rec.best, res.score);
    rec.plays += 1;
    profile.levels[res.levelId] = rec;

    profile.xp += Math.round(res.score / 100) + res.stars * 60;
    A.markPractised();
    A.save();

    var fresh = A.checkNew();
    renderResults(res, fresh);
    show('scr-results');
  }

  function renderResults(res, fresh) {
    $('res-title').textContent = res.stars === 3 ? 'Nailed It!' :
                                 res.stars === 2 ? 'Nice Work!' :
                                 res.stars === 1 ? 'Good Session' : 'Session Complete';
    $('res-score').textContent = res.score.toLocaleString();

    var starEls = $('res-stars').children;
    for (var i = 0; i < 3; i++) starEls[i].classList.remove('on');
    for (var s = 0; s < res.stars; s++) {
      (function (n) {
        setTimeout(function () {
          starEls[n].classList.add('on');
          AcroAudio.sfx.star();
        }, 260 + n * 320);
      })(s);
    }

    var cells = [
      ['Perfect', res.counts.perfect], ['Great', res.counts.great],
      ['Good', res.counts.good], ['Missed', res.counts.miss],
      ['Best combo', res.bestCombo], ['Accuracy', Math.round(res.accuracy * 100) + '%']
    ];
    $('res-grid').innerHTML = cells.map(function (c) {
      return '<div class="res-cell"><b>' + c[1] + '</b><span>' + c[0] + '</span></div>';
    }).join('');

    var line = AcroCoach.say(res.stars >= 3 ? 'result3' : (res.stars === 2 ? 'result2' : 'result1'));
    $('res-coach').textContent = line;

    var bw = $('res-badges');
    bw.innerHTML = '';
    if (fresh && fresh.length) {
      fresh.forEach(function (b, idx) {
        var d = doc.createElement('div');
        d.className = 'badge-pop';
        d.style.animationDelay = (idx * 0.14) + 's';
        d.innerHTML = '<span style="font-size:20px">' + b.icon + '</span> ' + b.name;
        bw.appendChild(d);
      });
      setTimeout(function () {
        AcroAudio.sfx.badge();
        speak(AcroCoach.say('accolade') + ' ' + fresh[0].name + '.');
      }, 1200);
    } else {
      speak(line);
    }
  }

  /* ------------------------------------------------------------- badges */
  function renderBadges() {
    var grid = $('badge-grid');
    grid.innerHTML = '';
    $('badge-count').textContent = A.earnedCount() + ' of ' + A.list.length + ' earned';

    A.list.forEach(function (b) {
      var p = A.progressOf(b);
      var earned = !!profile.badges[b.id];
      var el = doc.createElement('div');
      el.className = 'badge ' + (earned ? 'earned' : 'locked');
      el.innerHTML =
        '<div class="badge-tier" style="color:' + A.TIER_COLORS[b.tier] + '">' + b.tier + '</div>' +
        '<div class="badge-ico">' + b.icon + '</div>' +
        '<b>' + b.name + '</b>' +
        '<p>' + b.desc + '</p>' +
        (earned
          ? '<div class="badge-num">Earned ' + profile.badges[b.id] + '</div>'
          : '<div class="badge-prog"><i style="width:' +
              Math.round((p.cur / p.goal) * 100) + '%"></i></div>' +
            '<div class="badge-num">' + p.cur + ' / ' + p.goal + '</div>');
      grid.appendChild(el);
    });
  }

  /* ------------------------------------------------------------- videos */
  /* A YouTube thumbnail that 404s — or comes back as the 120px "no image"
     placeholder — means the video is gone. Rather than showing a dead player
     we turn the card into a search for the same topic. */
  function videoCard(v, group) {
    var card = doc.createElement('div');
    card.className = 'vid';

    var thumb = doc.createElement('button');
    thumb.className = 'vid-thumb';
    thumb.setAttribute('aria-label', 'Play: ' + v.title);

    var img = doc.createElement('img');
    img.loading = 'lazy';
    img.alt = '';
    img.src = AcroVideos.thumb(v.id);

    var play = doc.createElement('div');
    play.className = 'vid-play';
    play.textContent = '▶';

    thumb.appendChild(img);
    thumb.appendChild(play);

    function markDead() {
      card.classList.add('dead');
      thumb.innerHTML = '<div class="vid-missing">This video has moved.<br>' +
                        'Tap below to find it on YouTube.</div>';
    }
    img.addEventListener('error', markDead);
    img.addEventListener('load', function () {
      if (img.naturalWidth <= 120) markDead();
    });

    thumb.addEventListener('click', function () {
      if (card.classList.contains('dead')) return;
      var f = doc.createElement('iframe');
      f.src = AcroVideos.embed(v.id);
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      f.title = v.title;
      thumb.innerHTML = '';
      thumb.appendChild(f);
      if (profile.videos.indexOf(v.id) === -1) {
        profile.videos.push(v.id);
        A.save();
        var fresh = A.checkNew();
        if (fresh.length) toast('🏅 ' + fresh[0].name + ' unlocked!');
      }
    });

    var body = doc.createElement('div');
    body.className = 'vid-body';
    body.innerHTML =
      '<b>' + v.title + '</b><p>' + v.note + '</p>' +
      '<a href="' + AcroVideos.watch(v.id) + '" target="_blank" rel="noopener">Watch on YouTube ↗</a>' +
      ' &nbsp;·&nbsp; ' +
      '<a href="' + AcroVideos.searchUrl(group.search) + '" target="_blank" rel="noopener">More like this ↗</a>';

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
  }

  function renderVideos(focusKey) {
    var nav = $('vid-nav'), wrap = $('vid-groups');
    nav.innerHTML = ''; wrap.innerHTML = '';

    AcroVideos.groups.forEach(function (g) {
      var b = doc.createElement('button');
      b.textContent = g.icon + ' ' + g.name;
      if (g.key === focusKey) b.classList.add('on');
      b.addEventListener('click', function () {
        AcroAudio.sfx.click();
        var t = $('vg-' + g.key);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        Array.prototype.forEach.call(nav.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
      });
      nav.appendChild(b);

      var sec = doc.createElement('div');
      sec.className = 'vid-group';
      sec.id = 'vg-' + g.key;
      sec.innerHTML = '<h3>' + g.icon + ' ' + g.name + '</h3>' +
                      '<p class="blurb">' + g.blurb + '</p>';
      var grid = doc.createElement('div');
      grid.className = 'vid-grid';
      g.videos.forEach(function (v) { grid.appendChild(videoCard(v, g)); });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });

    if (focusKey) {
      setTimeout(function () {
        var t = $('vg-' + focusKey);
        if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 30);
    }
  }

  /* -------------------------------------------------------- skill detail */
  function openSkill(sk) {
    $('skill-name').textContent = sk.name;
    $('skill-meta').innerHTML =
      '<span class="tag" style="border-color:' + sk.color + '55;color:' + sk.color + '">' +
        sk.family + '</span>' +
      '<span class="tag">' + (sk.type === 'hold' ? 'Hold shape' : 'Quick skill') + '</span>' +
      '<span class="tag">Level ' + sk.level + '</span>';
    $('skill-desc').textContent = sk.desc;
    $('skill-cue').textContent = sk.cue;
    $('skill-teach').textContent = '“' + sk.teach + '”';
    var reps = A.skillReps(sk.id);
    $('skill-reps').textContent = reps
      ? 'You have landed this cleanly ' + reps + (reps === 1 ? ' time.' : ' times.')
      : 'You have not landed this one cleanly yet — go get it.';
    $('preview-label').textContent = sk.cue;

    $('skill-watch').onclick = function () {
      AcroAudio.sfx.click();
      show('scr-videos');
      renderVideos(sk.video);
    };

    show('scr-skill');
    startPreview(sk);
    speak(sk.name + '. ' + sk.cue);
  }

  /* The preview loops the real clip on a small canvas, so what she sees on
     the skill page is exactly what the game will animate. */
  function startPreview(sk) {
    var cv = $('preview-canvas');
    if (!cv) return;
    stopPreview();
    var ctx = cv.getContext('2d');
    var gym = new AcroCharacter.Gymnast({ scale: 1 });
    var t = 0, last = 0, hold = 0;

    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      cv.width = Math.max(120, r.width * dpr);
      cv.height = Math.max(150, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gym.scale = Math.max(0.5, Math.min(1.7, r.height / 300));
      return { w: r.width, h: r.height };
    }
    var dim = size();

    function loop(ts) {
      if (!preview) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      if (dim.w < 4) dim = size();

      t += dt;
      /* play the clip, pause a beat on the finished shape, then restart */
      var total = sk.dur + 0.9;
      if (t > total) { t = 0; gym.playSkill(sk, false); }
      if (!gym.isBusy() && t < 0.05) gym.playSkill(sk, false);
      if (t < sk.dur) {
        gym.clip = sk.clip; gym.clipDur = sk.dur; gym.clipT = t;
        gym.holding = sk.type === 'hold';
        gym.pose = AcroCharacter.sampleClip(sk.clip, Math.min(1, t / sk.dur));
      }

      ctx.clearRect(0, 0, dim.w, dim.h);
      /* floor line */
      var fy = dim.h * 0.84;
      var g = ctx.createLinearGradient(0, fy - 40, 0, dim.h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, AcroStage.hexA(sk.color, 0.20));
      ctx.fillStyle = g; ctx.fillRect(0, fy - 40, dim.w, dim.h - fy + 40);
      ctx.strokeStyle = AcroStage.hexA(sk.color, 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(dim.w, fy); ctx.stroke();

      gym.draw(ctx, dim.w * 0.5, fy, dt, { glow: AcroStage.hexA(sk.color, 0.7) });
      preview = requestAnimationFrame(loop);
    }
    gym.playSkill(sk, false);
    preview = requestAnimationFrame(loop);
  }

  function stopPreview() {
    if (preview) { cancelAnimationFrame(preview); preview = null; }
  }
  function stopPreviewIfLeaving(id) { if (id !== 'scr-skill') stopPreview(); }

  /* ----------------------------------------------------------- settings */
  function bindSettings() {
    var m = $('set-music'), s = $('set-sfx'), v = $('set-voice'), mo = $('set-motion'), nm = $('set-name');
    m.checked = profile.settings.music;
    s.checked = profile.settings.sfx;
    v.checked = profile.settings.voice;
    mo.checked = profile.settings.reduceMotion;
    nm.value = profile.name || '';

    m.addEventListener('change', function () {
      profile.settings.music = m.checked; AcroAudio.setMusic(m.checked); A.save();
    });
    s.addEventListener('change', function () {
      profile.settings.sfx = s.checked; AcroAudio.setSfx(s.checked); A.save();
    });
    v.addEventListener('change', function () {
      profile.settings.voice = v.checked; A.save();
      if (!v.checked && global.speechSynthesis) global.speechSynthesis.cancel();
    });
    mo.addEventListener('change', function () {
      profile.settings.reduceMotion = mo.checked;
      game.fx.reduceMotion = mo.checked;
      game.stage.reduceMotion = mo.checked;
      A.save();
    });
    nm.addEventListener('change', function () {
      profile.name = nm.value.trim(); A.save();
      if (profile.name) toast('Good to have you, ' + profile.name + '!');
    });

    $('set-reset').addEventListener('click', function () {
      if (!global.confirm('Reset every star, badge and streak on this device?')) return;
      profile = A.reset();
      bindSettings();
      renderHub();
      toast('Progress reset. Fresh start!');
    });
  }

  /* ---------------------------------------------------------------- wire */
  function bind() {
    $('btn-boot').addEventListener('click', function () {
      AcroAudio.init();
      AcroAudio.resume();
      AcroAudio.setMusic(profile.settings.music);
      AcroAudio.setSfx(profile.settings.sfx);
      AcroAudio.play('menu');
      show('scr-hub');
      renderHub();
      var w = AcroCoach.wisdom();
      $('nugget-text').textContent = w;
      speak('Welcome to Acro Academy. ' + w);
    });

    $('btn-nugget').addEventListener('click', function () {
      AcroAudio.sfx.click();
      var w = AcroCoach.wisdom();
      $('nugget-text').textContent = w;
      speak(w);
    });

    $('btn-videos').addEventListener('click', function () {
      AcroAudio.sfx.click(); show('scr-videos'); renderVideos(null);
    });
    $('btn-badges').addEventListener('click', function () {
      AcroAudio.sfx.click(); renderBadges(); show('scr-badges');
    });
    $('btn-settings').addEventListener('click', function () {
      AcroAudio.sfx.click(); show('scr-settings');
    });

    Array.prototype.forEach.call(doc.querySelectorAll('[data-back]'), function (b) {
      b.addEventListener('click', function () {
        AcroAudio.sfx.back();
        var to = b.getAttribute('data-back');
        show(to);
        if (to === 'scr-hub') { AcroAudio.play('menu'); renderHub(); }
      });
    });

    $('brief-start').addEventListener('click', function () {
      AcroAudio.sfx.whoosh();
      startLevel(currentLevel);
    });
    $('brief-watch').addEventListener('click', function () {
      AcroAudio.sfx.click();
      show('scr-videos');
      renderVideos(currentLevel.video);
    });

    $('res-again').addEventListener('click', function () {
      AcroAudio.sfx.whoosh();
      startLevel(AcroLevels.byId(lastResult.levelId));
    });
    $('res-hub').addEventListener('click', function () {
      AcroAudio.sfx.back();
      AcroAudio.play('menu');
      show('scr-hub'); renderHub();
    });

    $('btn-pause').addEventListener('click', function () { game.togglePause(); });

    /* touch pads: pointer events cover mouse, touch and stylus at once */
    Array.prototype.forEach.call(doc.querySelectorAll('.pad'), function (pad) {
      var lane = parseInt(pad.getAttribute('data-lane'), 10);
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        pad.setPointerCapture && pad.setPointerCapture(e.pointerId);
        game.keyDown[lane] = true;
        game.pressLane(lane);
      });
      var up = function (e) {
        e.preventDefault();
        game.keyDown[lane] = false;
        game.releaseLane(lane);
      };
      pad.addEventListener('pointerup', up);
      pad.addEventListener('pointercancel', up);
      pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    global.addEventListener('resize', function () {
      if (current === 'scr-play') game.resize();
    });

    /* Pause automatically when the tab is hidden — otherwise she comes back
       to a routine that carried on without her. */
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden && current === 'scr-play' && game.running && !game.paused) {
        game.togglePause();
      }
    });
  }

  /* ---------------------------------------------------------------- boot */
  function init() {
    profile = A.load();
    bind();
    bindSettings();
    game.fx.reduceMotion = !!profile.settings.reduceMotion;
    game.stage.reduceMotion = !!profile.settings.reduceMotion;
    $('nugget-text').textContent = AcroCoach.wisdom();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.AcroUI = { show: show, toast: toast, game: game };
})(window);
