/* =========================================================================
   app.js — screens, navigation and game flow.

   The engine modules know nothing about the DOM; this file is the only
   place the two meet. It owns:
     - screen routing and the back stack
     - the avatar preview loops (create / wardrobe / choreography)
     - the safety gate, which no supervised mission can start without
     - launching either the rhythm engine or a mini-game and folding the
       result back into the profile
   ========================================================================= */

(function (global) {
  'use strict';

  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var P = null;                      // profile data
  var rhythm = new Rhythm.Game();
  var mini = null;                   // active mini-game
  var active = null;                 // whichever of the two is running
  var current = 'scr-boot';
  var currentMission = null;
  var currentConfig = null;
  var lastResult = null;
  var previewRaf = null;
  var doneMissions = {};             // missionId -> true

  /* ------------------------------------------------------------- routing */
  function show(id) {
    stopPreview();
    var el = $(current);
    if (el) el.classList.remove('active');
    current = id;
    var next = $(id);
    if (next) { next.classList.add('active'); next.scrollTop = 0; }
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }

  function modal(title, body, actions) {
    var m = $('modal'), c = $('modal-card');
    c.innerHTML = '<h3>' + title + '</h3><p>' + body + '</p>' +
      '<div class="modal-actions"></div>';
    var box = c.querySelector('.modal-actions');
    (actions || [{ label: 'OK' }]).forEach(function (a) {
      var b = doc.createElement('button');
      b.className = 'btn ' + (a.ghost ? 'btn-ghost' : '');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        m.hidden = true;
        if (a.fn) a.fn();
      });
      box.appendChild(b);
    });
    m.hidden = false;
  }

  function speak(text) {
    if (!P.settings.voice || !text) return;
    var s = global.speechSynthesis;
    if (!s || typeof global.SpeechSynthesisUtterance !== 'function') return;
    try {
      s.cancel();
      var u = new global.SpeechSynthesisUtterance(text);
      u.rate = 1.02; u.pitch = 1.1; u.volume = P.settings.coachVol;
      s.speak(u);
    } catch (e) { /* unavailable — captions still carry the line */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* --------------------------------------------------------- the avatar */
  function makeGymnast(scale) {
    var a = P.avatar;
    var g = new AcroCharacter.Gymnast({
      scale: scale || 1, skin: a.skin, hair: a.hair, leo: a.leo, leo2: a.leo2
    });
    return g;
  }

  /* One preview loop shared by the create screen, the wardrobe and the
     choreography studio, so only one rAF is ever alive. */
  function runPreview(canvasId, opts) {
    stopPreview();
    var cv = $(canvasId);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var gym = makeGymnast(1);
    var seq = opts.sequence && opts.sequence.length ? opts.sequence : null;
    var idx = 0, t = 0, last = 0, dim = { w: 0, h: 0 };

    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      cv.width = Math.max(120, r.width * dpr);
      cv.height = Math.max(150, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gym.scale = Math.max(0.5, Math.min(1.9, r.height / 300));
      return { w: r.width, h: r.height };
    }
    dim = size();

    function nextSkill() {
      if (!seq) return AcroSkills.byId(opts.skill || 'releve');
      var s = AcroSkills.byId(seq[idx % seq.length]);
      idx++;
      return s || AcroSkills.byId('releve');
    }
    var cur = nextSkill();
    gym.playSkill(cur, cur.type === 'hold');

    function loop(ts) {
      if (!previewRaf) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      if (dim.w < 4) dim = size();
      t += dt;
      var hold = cur.type === 'hold' ? 1.0 : 0.5;
      if (t > cur.dur + hold) { t = 0; cur = nextSkill(); gym.playSkill(cur, cur.type === 'hold'); }
      gym.update(dt, AcroAudio.beatPhase());

      ctx.clearRect(0, 0, dim.w, dim.h);
      var fy = dim.h * 0.86;
      var g = ctx.createLinearGradient(0, fy - 60, 0, dim.h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, AcroStage.hexA(P.avatar.accent || '#ffc84a', 0.20));
      ctx.fillStyle = g; ctx.fillRect(0, fy - 60, dim.w, dim.h - fy + 60);
      ctx.strokeStyle = AcroStage.hexA(P.avatar.accent || '#ffc84a', 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(dim.w, fy); ctx.stroke();

      gym.skin = P.avatar.skin; gym.hair = P.avatar.hair;
      gym.leo = P.avatar.leo; gym.leo2 = P.avatar.leo2;
      gym.draw(ctx, dim.w * 0.5, fy, dt, { glow: AcroStage.hexA(P.avatar.leo, 0.65) });
      previewRaf = requestAnimationFrame(loop);
    }
    previewRaf = requestAnimationFrame(loop);
  }
  function stopPreview() {
    if (previewRaf) { cancelAnimationFrame(previewRaf); previewRaf = null; }
  }

  /* ==================================================================== */
  /*  HUB                                                                 */
  /* ==================================================================== */
  function renderHub() {
    var r = Profile.rank(), nx = Profile.nextRank();
    $('rank-icon').textContent = r.icon;
    $('rank-name').textContent = r.name;
    var pct = 100;
    if (nx) {
      var span = nx.xp - r.xp;
      pct = span > 0 ? Math.round(((P.xp - r.xp) / span) * 100) : 0;
    }
    $('rank-fill').style.width = Math.max(3, Math.min(100, pct)) + '%';
    $('hub-sparks').textContent = P.sparks;
    $('hub-badges').textContent = Profile.earnedCount();
    $('hub-streak').textContent = Profile.dayStreak();

    renderQuests();
    renderDistricts();
    renderRooms();
    renderGames();
  }

  function newNugget() {
    var w = Coach.allWisdom[Math.floor(Math.random() * Coach.allWisdom.length)];
    $('nugget-text').textContent = w.text;
    $('nugget-label').textContent = Coach.name + ' · ' + w.label;
    return w.text;
  }

  function renderQuests() {
    var box = $('quests');
    box.innerHTML = '';
    Profile.dailyQuests().forEach(function (row) {
      var d = doc.createElement('div');
      d.className = 'quest' + (row.done ? ' done' : '');
      d.innerHTML = '<span class="qi">' + (row.done ? '✅' : row.q.icon) + '</span>' +
        '<div><b>' + row.q.name + '</b><p>' + esc(row.q.text) + '</p></div>' +
        '<span class="qr">' + (row.done ? 'Done' : '+' + row.q.xp + ' XP') + '</span>';
      box.appendChild(d);
    });

    var c = Profile.weeklyChallenge();
    $('weekly').innerHTML =
      '<h4>Weekly Challenge</h4>' +
      '<b>' + c.w.icon + ' ' + c.w.name + '</b>' +
      '<p>' + esc(c.w.text) + '</p>' +
      '<div class="wbar"><i style="width:' +
        Math.round((c.progress / c.w.goal) * 100) + '%"></i></div>' +
      '<p style="margin-top:8px;font-size:.74rem">' + c.progress + ' / ' + c.w.goal +
        (c.claimed ? ' · reward claimed 🎉' : '') + '</p>';
  }

  function renderDistricts() {
    var grid = $('district-grid');
    grid.innerHTML = '';
    Districts.list.forEach(function (d) {
      var open = Districts.isUnlocked(d, doneMissions);
      var pr = Districts.progress(d, doneMissions);
      var b = doc.createElement('button');
      b.className = 'card';
      b.disabled = !open;
      b.innerHTML =
        '<div class="card-glow" style="background:' + d.color + '"></div>' +
        '<div class="card-ico">' + d.icon + '</div>' +
        '<div class="card-name">District ' + d.n + ' · ' + d.name + '</div>' +
        '<div class="card-tag">' + esc(d.tagline) + '</div>' +
        '<div class="card-foot">' +
          '<span class="pill">' + pr.done + ' / ' + pr.total + ' missions</span>' +
          (open ? (pr.done === pr.total ? '<span class="pill home">Complete ✓</span>' : '')
                : '<span class="pill">🔒 Finish District ' + (d.n - 1) + '</span>') +
        '</div>';
      b.addEventListener('click', function () {
        if (!open) { toast('Finish District ' + (d.n - 1) + ' first.'); return; }
        AcroAudio.sfx.click();
        openDistrict(d);
      });
      grid.appendChild(b);
    });
  }

  function renderRooms() {
    var grid = $('room-grid');
    grid.innerHTML = '';
    var stars = Profile.totalStars();
    Rooms.list.forEach(function (room) {
      var open = Rooms.isUnlocked(room, stars);
      var got = Profile.roomStars(room.id);
      var pal = AcroStage.palettes[room.zone] || AcroStage.palettes.hub;
      var st = '';
      for (var i = 0; i < 3; i++) st += '<i class="' + (i < got ? 'on' : '') + '">★</i>';
      var b = doc.createElement('button');
      b.className = 'card';
      b.disabled = !open;
      b.innerHTML =
        '<div class="card-glow" style="background:' + pal.glow + '"></div>' +
        '<div class="card-ico">' + room.icon + '</div>' +
        '<div class="card-name">' + room.name + '</div>' +
        '<div class="card-tag">' + esc(room.tagline) + '</div>' +
        '<div class="card-foot">' +
          '<span class="stars-mini">' + st + '</span>' +
          '<span class="pill ' + room.tier + '">' +
            AcroSkills.TIERS[room.tier].icon + ' ' + AcroSkills.TIERS[room.tier].label + '</span>' +
          (open ? '' : '<span class="pill">🔒 ' + room.unlock + '★</span>') +
        '</div>';
      b.addEventListener('click', function () {
        if (!open) { toast('Earn ' + room.unlock + ' stars to open ' + room.name + '.'); return; }
        AcroAudio.sfx.click();
        if (room.id === 'choreography') { openChoreo(); return; }
        openRoom(room);
      });
      grid.appendChild(b);
    });
  }

  function renderGames() {
    var grid = $('game-grid');
    grid.innerHTML = '';
    MiniGames.list.forEach(function (g) {
      var rec = P.games[g.id] || { plays: 0, best: 0 };
      var b = doc.createElement('button');
      b.className = 'card game-card';
      b.innerHTML =
        '<div class="card-ico">' + g.icon + '</div>' +
        '<div class="card-name">' + g.name + '</div>' +
        '<div class="card-tag">' + esc(g.blurb) + '</div>' +
        '<div class="card-foot"><span class="pill">' +
          (rec.best ? 'Best ' + rec.best : 'New') + '</span></div>';
      b.addEventListener('click', function () {
        AcroAudio.sfx.click();
        briefFor({ id: 'free_' + g.id, type: 'game', game: g.id, name: g.name, free: true });
      });
      grid.appendChild(b);
    });
  }

  /* ==================================================================== */
  /*  DISTRICT + ROOM                                                     */
  /* ==================================================================== */
  var MISSION_LABEL = {
    drill: 'Training drill', game: 'Mini-game', video: 'Watch & reflect',
    science: 'Science Corner', routine: 'Choreography', performance: 'Performance'
  };
  var MISSION_ICON = {
    drill: '🎵', game: '🎮', video: '📺', science: '🔬', routine: '🎨', performance: '🎪'
  };

  function openDistrict(d) {
    var pr = Districts.progress(d, doneMissions);
    $('district-head').innerHTML =
      '<div class="dnum">District ' + d.n + ' · ' + pr.done + ' of ' + pr.total + ' complete</div>' +
      '<h2>' + d.icon + ' ' + d.name + '</h2>' +
      '<p>' + esc(pr.done === pr.total ? d.outro : d.intro) + '</p>' +
      (d.supervised ? '<p style="color:#ffc89a">🛡️ This district covers coach-supervised ' +
        'skills. You will learn the shapes and the timing here — the skill itself belongs ' +
        'in the gym with your coach.</p>' : '');

    var list = $('mission-list');
    list.innerHTML = '';
    d.missions.forEach(function (m, i) {
      var prevDone = i === 0 || doneMissions[d.missions[i - 1].id];
      var done = !!doneMissions[m.id];
      var b = doc.createElement('button');
      b.className = 'mission';
      b.disabled = !prevDone && !done;
      b.innerHTML =
        '<span class="mi">' + MISSION_ICON[m.type] + '</span>' +
        '<span class="mb"><b>' + esc(m.name) + '</b>' +
          '<span>' + MISSION_LABEL[m.type] +
          (Missions.isSupervised(m) ? ' · 🛡️ coach-supervised' : '') + '</span></span>' +
        '<span class="mdone">' + (done ? '✓' : (b.disabled ? '🔒' : '›')) + '</span>';
      b.addEventListener('click', function () {
        AcroAudio.sfx.click();
        briefFor(m);
      });
      list.appendChild(b);
    });
    show('scr-district');
    speak(pr.done === pr.total ? d.outro : d.intro);
  }

  function openRoom(room) {
    $('room-head').innerHTML =
      '<div class="dnum">Free training</div>' +
      '<h2>' + room.icon + ' ' + room.name + '</h2>' +
      '<p>' + esc(room.blurb) + '</p>' +
      '<p><span class="pill ' + room.tier + '">' + AcroSkills.TIERS[room.tier].icon + ' ' +
        AcroSkills.TIERS[room.tier].label + '</span> ' +
        esc(AcroSkills.TIERS[room.tier].note) + '</p>';

    var body = $('room-body');
    body.innerHTML = '<h3 class="mini-h">Drills</h3>';
    var list = doc.createElement('div');
    list.className = 'mission-list';

    [['Quick drill', 12, 2.6], ['Full session', 16, 3.2], ['Challenge', 20, 3.8]]
      .forEach(function (row, i) {
        var m = { id: 'free_' + room.id + '_' + i, type: 'drill', room: room.id,
                  name: row[0] + ' · ' + room.name, bars: row[1], density: row[2], free: true };
        var b = doc.createElement('button');
        b.className = 'mission';
        b.innerHTML = '<span class="mi">🎵</span><span class="mb"><b>' + row[0] +
          '</b><span>' + row[1] + ' bars · ' + (i === 0 ? 'gentle' : i === 1 ? 'standard' : 'fast') +
          '</span></span><span class="mdone">›</span>';
        b.addEventListener('click', function () { AcroAudio.sfx.click(); briefFor(m); });
        list.appendChild(b);
      });
    body.appendChild(list);

    if (room.games && room.games.length) {
      var gh = doc.createElement('h3');
      gh.className = 'mini-h'; gh.textContent = 'Mini-games in this room';
      body.appendChild(gh);
      var gl = doc.createElement('div');
      gl.className = 'mission-list';
      room.games.forEach(function (gid) {
        var g = MiniGames.byId(gid);
        if (!g) return;
        var b = doc.createElement('button');
        b.className = 'mission';
        b.innerHTML = '<span class="mi">' + g.icon + '</span><span class="mb"><b>' + g.name +
          '</b><span>' + esc(g.blurb) + '</span></span><span class="mdone">›</span>';
        b.addEventListener('click', function () {
          AcroAudio.sfx.click();
          briefFor({ id: 'free_' + gid, type: 'game', game: gid, name: g.name, free: true });
        });
        gl.appendChild(b);
      });
      body.appendChild(gl);
    }

    if (room.skills.length) {
      var sh = doc.createElement('h3');
      sh.className = 'mini-h'; sh.textContent = 'Skills you will use';
      body.appendChild(sh);
      var chips = doc.createElement('div');
      chips.className = 'skill-chips';
      chips.style.justifyContent = 'flex-start';
      room.skills.forEach(function (id) {
        var sk = AcroSkills.byId(id);
        if (!sk) return;
        var c = doc.createElement('button');
        c.className = 'chip';
        c.innerHTML = '<span class="dot" style="background:' + sk.color + '"></span>' +
          sk.name + ' <span style="opacity:.55">' +
          AcroSkills.TIERS[sk.tier].icon + '</span>';
        c.addEventListener('click', function () { showSkill(sk); });
        chips.appendChild(c);
      });
      body.appendChild(chips);
    }
    show('scr-room');
  }

  function showSkill(sk) {
    var t = AcroSkills.TIERS[sk.tier];
    modal(sk.name,
      '<b>' + t.icon + ' ' + t.label + '</b><br>' + esc(t.note) + '<br><br>' +
      esc(sk.desc) + '<br><br><i>“' + esc(sk.cue) + '”</i><br><br>' +
      'You have landed this cleanly ' + Profile.reps(sk.id) + ' times.',
      [{ label: 'Watch a tutorial', ghost: true, fn: function () { openVideos(sk.video); } },
       { label: 'Got it' }]);
  }

  /* ==================================================================== */
  /*  BRIEF + SAFETY GATE                                                 */
  /* ==================================================================== */
  function briefFor(m) {
    currentMission = m;
    var supervised = Missions.isSupervised(m);

    /* science and video missions are not "played" — go straight there */
    if (m.type === 'science') { openLesson(Science.byId(m.lesson), m); return; }
    if (m.type === 'video') { openVideos(m.group, m); return; }
    if (m.type === 'routine') { openChoreo(m); return; }

    var icon, name, tag, coach, skills = [], hint;
    if (m.type === 'game') {
      var g = MiniGames.byId(m.game);
      icon = g.icon; name = g.name; tag = g.blurb;
      coach = g.instruction;
      hint = 'Keys <b>1 2 3 4</b>, <b>← →</b> and <b>SPACE</b> — or tap the pads.';
    } else {
      currentConfig = m.type === 'performance'
        ? Missions.performanceConfig(m, P.routines[P.routines.length - 1])
        : Missions.drillConfig(m);
      var room = Rooms.byId(currentConfig.room);
      icon = currentConfig.icon; name = m.name;
      tag = room ? room.tagline : '';
      coach = m.type === 'performance'
        ? Coach.nugget('performance')
        : (room ? room.blurb : Coach.nugget());
      skills = currentConfig.skills;
      hint = 'Keys <b>A S D F</b> or the arrow keys — or tap the four pads. Hold the long notes.';
    }

    $('brief-icon').textContent = icon;
    $('brief-name').textContent = name;
    $('brief-tag').textContent = tag;
    $('brief-coach').textContent = coach;
    $('brief-hint').innerHTML = hint;

    var chips = $('brief-skills');
    chips.innerHTML = '';
    skills.forEach(function (id) {
      var sk = AcroSkills.byId(id);
      if (!sk) return;
      var c = doc.createElement('button');
      c.className = 'chip';
      c.innerHTML = '<span class="dot" style="background:' + sk.color + '"></span>' + sk.name +
        ' <span style="opacity:.55">' + AcroSkills.TIERS[sk.tier].icon + '</span>';
      c.addEventListener('click', function () { showSkill(sk); });
      chips.appendChild(c);
    });

    /* The gate: a supervised mission cannot start until she ticks the box. */
    var gate = $('safety-gate'), ok = $('safety-ok'), startBtn = $('brief-start');
    if (supervised) {
      gate.hidden = false;
      $('safety-text').textContent = Coach.say('supervised');
      ok.checked = false;
      startBtn.disabled = true;
      ok.onchange = function () { startBtn.disabled = !ok.checked; };
      speak($('safety-text').textContent);
    } else {
      gate.hidden = true;
      startBtn.disabled = false;
      ok.onchange = null;
      speak(coach);
    }
    show('scr-brief');
  }

  /* ==================================================================== */
  /*  PLAY                                                                */
  /* ==================================================================== */
  function startMission() {
    var m = currentMission;
    show('scr-play');
    P.attempts++;
    Profile.save();

    var laneMode = m.type !== 'game';
    $('pads-lane').style.display = laneMode ? 'grid' : 'none';
    $('pads-mini').classList.toggle('on', !laneMode);

    requestAnimationFrame(function () {
      var canvas = $('game-canvas');
      if (laneMode) {
        mini = null;
        active = rhythm;
        rhythm.attach(canvas);
        rhythm.resize();
        rhythm.fx.reduceMotion = P.settings.reduceMotion;
        rhythm.stage.reduceMotion = P.settings.reduceMotion;
        applyAvatar(rhythm.gym);
        rhythm.start(currentConfig, {
          onEnd: onDrillEnd,
          onCoach: function (l) { speak(l); }
        });
      } else {
        mini = MiniGames.create(m.game);
        active = mini;
        mini.attach(canvas);
        mini.resize();
        applyAvatar(mini.gym);
        mini.start({
          onEnd: onGameEnd,
          assist: P.settings.assist,
          reduceMotion: P.settings.reduceMotion
        });
      }
    });
  }

  function applyAvatar(g) {
    g.skin = P.avatar.skin; g.hair = P.avatar.hair;
    g.leo = P.avatar.leo; g.leo2 = P.avatar.leo2;
  }

  /* ---- results folding --------------------------------------------------- */
  function bankCommon(summary, xp, sparks) {
    Profile.markPractised();
    var newRank = Profile.addXp(xp);
    Profile.addSparks(sparks);
    var quests = Profile.resolveQuests(summary);
    var weekly = Profile.advanceWeekly(summary);
    Profile.save();
    return { newRank: newRank, quests: quests, weekly: weekly };
  }

  function onDrillEnd(res) {
    var m = currentMission;
    var stars = Missions.starsFor(res.accuracy);
    var rec = P.missions[m.id] || { stars: 0, best: 0, plays: 0 };
    var improved = res.score > rec.best && rec.plays > 0;
    var comeback = improved && rec.stars < 2;

    P.perfect += res.counts.perfect;
    P.great += res.counts.great;
    P.good += res.counts.good;
    P.miss += res.counts.miss;
    P.bestCombo = Math.max(P.bestCombo, res.bestCombo);
    P.holdSeconds += res.holdSeconds;
    P.practiceSeconds += 60;
    P.drills += 1;
    if (res.flawless) P.flawless += 1;
    if (improved) P.improvements += 1;
    if (comeback) P.comebacks += 1;

    Object.keys(res.cleanReps).forEach(function (id) {
      P.skillReps[id] = (P.skillReps[id] || 0) + res.cleanReps[id];
    });

    rec.stars = Math.max(rec.stars, stars);
    rec.best = Math.max(rec.best, res.score);
    rec.plays += 1;
    P.missions[m.id] = rec;

    if (res.room) {
      var rr = P.rooms[res.room] || { sessions: 0, best: 0, stars: 0 };
      rr.sessions += 1;
      rr.best = Math.max(rr.best, res.score);
      rr.stars = Math.max(rr.stars, stars);
      P.rooms[res.room] = rr;
    }

    if (res.performance) {
      P.performances.push({ score: res.score, date: Profile.today(), stars: stars });
      P.bestPerformance = Math.max(P.bestPerformance, res.score);
    }
    if (!m.free) doneMissions[m.id] = true;

    res.improved = improved;
    res.uniqueSkills = Object.keys(res.cleanReps).length;
    var xp = Math.round(res.score / 90) + stars * 70 + (m.xp || 0);
    var sparks = Math.round(res.score / 260) + stars * 22 + (m.sparks || 0);
    var extra = bankCommon(Missions.summarise(m, res), xp, sparks);
    lastResult = { kind: 'drill', res: res, stars: stars, xp: xp, sparks: sparks,
                   improved: improved, extra: extra, mission: m };
    showResults();
  }

  function onGameEnd(res) {
    var m = currentMission;
    var rec = P.games[res.game] || { plays: 0, best: 0 };
    var improved = res.score > rec.best && rec.plays > 0;
    /* Memory Routine scores by round reached, everything else by points. */
    var metric = res.game === 'memory' ? res.rounds : res.score;
    rec.best = Math.max(rec.best, metric);
    rec.plays += 1;
    P.games[res.game] = rec;
    P.drills += 1;
    P.practiceSeconds += 45;
    if (improved) P.improvements += 1;

    var def = MiniGames.byId(res.game);
    if (def && def.room) {
      var rr = P.rooms[def.room] || { sessions: 0, best: 0, stars: 0 };
      rr.sessions += 1;
      rr.stars = Math.max(rr.stars, Missions.starsFor(res.accuracy));
      P.rooms[def.room] = rr;
    }
    if (!m.free) doneMissions[m.id] = true;

    var stars = Missions.starsFor(res.accuracy);
    var xp = Math.round(res.score / 6) + stars * 60 + (m.xp || 0);
    var sparks = Math.round(res.score / 20) + stars * 18 + (m.sparks || 0);
    res.improved = improved;
    res.room = def ? def.room : null;
    var extra = bankCommon(Missions.summarise(m, res), xp, sparks);
    lastResult = { kind: 'game', res: res, stars: stars, xp: xp, sparks: sparks,
                   improved: improved, extra: extra, mission: m };
    showResults();
  }

  function showResults() {
    var L = lastResult, res = L.res, stars = L.stars;
    var perf = !!res.performance;

    $('res-title').textContent = perf
      ? (stars === 3 ? 'A Standing Ovation!' : 'You Performed!')
      : (stars === 3 ? 'Nailed It!' : stars === 2 ? 'Nice Work!' :
         stars === 1 ? 'Good Session' : 'Session Complete');

    $('res-score').textContent = Math.round(res.score).toLocaleString();

    var starEls = $('res-stars').children, i;
    for (i = 0; i < 3; i++) starEls[i].classList.remove('on');
    for (i = 0; i < stars; i++) {
      (function (n) {
        setTimeout(function () {
          starEls[n].classList.add('on');
          AcroAudio.sfx.star();
        }, 250 + n * 300);
      })(i);
    }

    $('res-rewards').innerHTML =
      '<span class="reward">+' + L.xp + ' XP</span>' +
      '<span class="reward">+' + L.sparks + ' ✨</span>' +
      (L.improved ? '<span class="reward">📈 New personal best!</span>' : '');

    /* judged categories, performances only */
    var jp = $('judge-panel');
    if (perf) {
      jp.hidden = false;
      jp.innerHTML = Missions.judgePerformance(res).map(function (j) {
        return '<div class="judge"><b>' + j.key + '</b>' +
          '<span class="jbar"><i style="width:' + j.value + '%"></i></span>' +
          '<span class="jv">' + j.value + '</span></div>';
      }).join('');
    } else jp.hidden = true;

    var cells;
    if (L.kind === 'drill') {
      cells = [['Perfect', res.counts.perfect], ['Great', res.counts.great],
               ['Good', res.counts.good], ['Missed', res.counts.miss],
               ['Best combo', res.bestCombo],
               ['Accuracy', Math.round(res.accuracy * 100) + '%']];
    } else {
      cells = [['Rounds', res.rounds], ['Landed', res.hits],
               ['Best combo', res.combo],
               ['Accuracy', Math.round(res.accuracy * 100) + '%']];
    }
    $('res-grid').innerHTML = cells.map(function (c) {
      return '<div class="res-cell"><b>' + c[1] + '</b><span>' + c[0] + '</span></div>';
    }).join('');

    /* "what you did well" is never empty, and "next level-up" is never a
       criticism — it is the next instruction. */
    $('res-well').textContent = wellDone(L);
    $('res-next').textContent = nextUp(L);

    var line = Coach.respondTo(res.accuracy, L.improved, (L.mission.plays || 0) === 0);
    $('res-coach').textContent = line;

    /* accolades, rank-ups, quests */
    var fresh = Profile.checkAccolades();
    var bw = $('res-badges');
    bw.innerHTML = '';
    (L.extra.quests || []).forEach(function (q) {
      var d = doc.createElement('div');
      d.className = 'badge-pop';
      d.innerHTML = '<span>' + q.icon + '</span> Quest complete: ' + esc(q.text);
      bw.appendChild(d);
    });
    if (L.extra.weekly) {
      var wd = doc.createElement('div');
      wd.className = 'badge-pop';
      wd.innerHTML = '<span>' + L.extra.weekly.icon + '</span> ' + L.extra.weekly.name + ' complete!';
      bw.appendChild(wd);
    }
    fresh.forEach(function (b, idx) {
      var d = doc.createElement('div');
      d.className = 'badge-pop';
      d.style.animationDelay = (idx * 0.12) + 's';
      d.innerHTML = '<span style="font-size:1.2rem">' + b.icon + '</span> ' + b.name;
      bw.appendChild(d);
    });
    if (L.extra.newRank) {
      var rd = doc.createElement('div');
      rd.className = 'badge-pop';
      rd.innerHTML = '<span style="font-size:1.2rem">' + L.extra.newRank.icon + '</span> New rank: ' +
        L.extra.newRank.name;
      bw.appendChild(rd);
    }

    setTimeout(function () {
      if (fresh.length) { AcroAudio.sfx.badge(); speak(Coach.say('accolade') + ' ' + fresh[0].name); }
      else if (L.extra.newRank) { AcroAudio.sfx.badge(); speak(Coach.say('levelUp')); }
      else speak(line);
    }, 1100);

    Profile.save();
    show('scr-results');
  }

  function wellDone(L) {
    var r = L.res;
    var bits = [];
    if (L.kind === 'drill') {
      if (r.counts.perfect > 0) bits.push('You landed ' + r.counts.perfect + ' perfectly-timed shapes.');
      if (r.bestCombo >= 5) bits.push('Your best streak was ' + r.bestCombo + ' in a row.');
      if (r.holdSeconds > 3) bits.push('You held your shapes for ' + Math.round(r.holdSeconds) + ' seconds.');
      if (r.flawless) bits.push('You got through the whole thing without a single miss.');
    } else {
      if (r.hits > 0) bits.push('You landed ' + r.hits + ' of ' + r.attempts + ' attempts.');
      if (r.combo >= 4) bits.push('You strung ' + r.combo + ' together in a row.');
      if (r.rounds > 3) bits.push('You made it to round ' + r.rounds + '.');
    }
    if (L.improved) bits.push('And you beat your own previous score.');
    if (!bits.length) bits.push('You finished it. Finishing when it is hard is its own skill.');
    return bits.join(' ');
  }

  function nextUp(L) {
    var r = L.res;
    if (L.stars === 3) return 'Three stars. Take this one into a routine, or step up to a harder drill.';
    if (L.kind === 'drill') {
      if (r.counts.miss > r.counts.perfect) return 'Slow it down in your head. Watch the note reach the line before you move — speed comes free once the timing is right.';
      if (r.bestCombo < 6) return 'Aim for six in a row next time. Consistency scores higher than any single perfect hit.';
      return 'Push for more Perfects. You are landing them — now land them earlier in the run.';
    }
    if (r.accuracy < 0.5) return 'Try the Relaxed difficulty in Settings for a run or two, then come back to Normal.';
    return 'Beat your own best. That is the only score that matters here.';
  }

  /* ==================================================================== */
  /*  TROPHY ROOM                                                         */
  /* ==================================================================== */
  var badgeFilter = 'All';
  function renderTrophy() {
    $('trophy-count').textContent = Profile.earnedCount() + ' of ' + Profile.ACCOLADES.length + ' earned';
    var r = Profile.rank();
    $('trophy-shelf').innerHTML = [
      ['<b>' + r.icon + '</b>', r.name],
      ['<b>' + Profile.totalStars() + '</b>', 'stars'],
      ['<b>' + P.sparksEarned + '</b>', 'sparks earned'],
      ['<b>' + P.performances.length + '</b>', 'performances'],
      ['<b>' + (P.bestPerformance || 0).toLocaleString() + '</b>', 'best performance'],
      ['<b>' + P.routines.length + '</b>', 'routines built']
    ].map(function (c) {
      return '<div class="shelf-cell">' + c[0] + '<span>' + c[1] + '</span></div>';
    }).join('');

    var cats = ['All'];
    Profile.ACCOLADES.forEach(function (a) { if (cats.indexOf(a.cat) < 0) cats.push(a.cat); });
    var fr = $('badge-filters');
    fr.innerHTML = '';
    cats.forEach(function (c) {
      var b = doc.createElement('button');
      b.textContent = c;
      if (c === badgeFilter) b.classList.add('on');
      b.addEventListener('click', function () { badgeFilter = c; renderTrophy(); });
      fr.appendChild(b);
    });

    var grid = $('badge-grid');
    grid.innerHTML = '';
    Profile.ACCOLADES.filter(function (a) {
      return badgeFilter === 'All' || a.cat === badgeFilter;
    }).forEach(function (a) {
      var p = Profile.progressOf(a);
      var earned = !!P.badges[a.id];
      var el = doc.createElement('div');
      el.className = 'badge ' + (earned ? 'earned' : 'locked');
      el.innerHTML =
        '<div class="badge-tier" style="color:' + Profile.TIER_COLORS[a.tier] + '">' + a.tier + '</div>' +
        '<div class="badge-ico">' + a.icon + '</div>' +
        '<b>' + a.name + '</b><p>' + esc(a.desc) + '</p>' +
        (earned
          ? '<div class="badge-num">Earned ' + P.badges[a.id] + '</div>'
          : '<div class="badge-prog"><i style="width:' + p.pct + '%"></i></div>' +
            '<div class="badge-num">' + p.cur + ' / ' + p.goal + '</div>');
      grid.appendChild(el);
    });
  }

  /* ==================================================================== */
  /*  VIDEO LIBRARY                                                       */
  /* ==================================================================== */
  function videoCard(v, group, mission) {
    var card = doc.createElement('div');
    card.className = 'vid';

    var thumb = doc.createElement('button');
    thumb.className = 'vid-thumb';
    thumb.setAttribute('aria-label', 'Play: ' + v.title);
    var img = doc.createElement('img');
    img.loading = 'lazy'; img.alt = '';
    img.src = Videos.thumb(v.id);
    var play = doc.createElement('div');
    play.className = 'vid-play'; play.textContent = '▶';
    thumb.appendChild(img); thumb.appendChild(play);

    /* A thumbnail that 404s, or comes back as YouTube's 120px placeholder,
       means the video is gone. Turn the card into a topic search rather
       than offering a dead player. */
    function markDead() {
      card.classList.add('dead');
      thumb.innerHTML = '<div class="vid-missing">This video has moved.<br>' +
        'Use the search link below to find it.</div>';
    }
    img.addEventListener('error', markDead);
    img.addEventListener('load', function () { if (img.naturalWidth <= 120) markDead(); });

    thumb.addEventListener('click', function () {
      if (card.classList.contains('dead')) return;
      var f = doc.createElement('iframe');
      f.src = Videos.embed(v.id);
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true; f.title = v.title;
      thumb.innerHTML = ''; thumb.appendChild(f);
      if (P.videos.indexOf(v.id) === -1) {
        P.videos.push(v.id);
        Profile.addXp(40); Profile.addSparks(12);
        Profile.save();
        var fresh = Profile.checkAccolades();
        if (fresh.length) toast('🏅 ' + fresh[0].name + ' unlocked!');
      }
    });

    var body = doc.createElement('div');
    body.className = 'vid-body';
    body.innerHTML =
      '<b>' + esc(v.title) + '</b>' +
      '<div class="vid-meta"><span>' + v.difficulty + '</span><span>' + v.duration +
        '</span><span>Ages ' + v.ages + '</span></div>' +
      '<p>' + esc(v.purpose) + '<br><span style="opacity:.7">' + esc(v.creator) + '</span></p>' +
      '<div class="vid-safety">🛡️ ' + esc(v.safety) + '</div>' +
      '<a href="' + Videos.watch(v.id) + '" target="_blank" rel="noopener">Watch on YouTube ↗</a>' +
      ' &nbsp;·&nbsp; <a href="' + Videos.searchUrl(group.search) +
        '" target="_blank" rel="noopener">Find more ↗</a>';

    /* WATCH -> TRY -> REFLECT */
    if (v.reflect) {
      var rf = doc.createElement('div');
      rf.className = 'reflect';
      rf.innerHTML = '<b>💭 ' + esc(v.reflect.q) + '</b>';
      v.reflect.a.forEach(function (opt, i) {
        var b = doc.createElement('button');
        b.textContent = opt;
        b.addEventListener('click', function () {
          if (rf.dataset.done) return;
          rf.dataset.done = '1';
          var right = i === v.reflect.c;
          b.classList.add(right ? 'right' : 'wrong');
          if (!right) rf.children[1 + v.reflect.c].classList.add('right');
          var why = doc.createElement('div');
          why.className = 'why';
          why.textContent = (right ? '✅ ' : '💡 ') + v.reflect.why;
          rf.appendChild(why);
          if (!P.reflections[v.id]) {
            P.reflections[v.id] = i;
            Profile.addXp(50); Profile.addSparks(15);
            Profile.save();
            var fresh = Profile.checkAccolades();
            if (fresh.length) toast('🏅 ' + fresh[0].name + ' unlocked!');
          }
          speak(v.reflect.why);
          if (mission && !mission.free) {
            doneMissions[mission.id] = true;
            Profile.resolveQuests(Missions.summarise(mission, {}));
            Profile.addXp(mission.xp || 0); Profile.addSparks(mission.sparks || 0);
            Profile.save();
            toast('Mission complete! +' + (mission.xp || 0) + ' XP');
          }
        });
        rf.appendChild(b);
      });
      body.appendChild(rf);
    }

    card.appendChild(thumb); card.appendChild(body);
    return card;
  }

  function openVideos(focusKey, mission) {
    var nav = $('vid-nav'), wrap = $('vid-groups');
    nav.innerHTML = ''; wrap.innerHTML = '';
    Videos.groups.forEach(function (g) {
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
        '<p class="blurb">' + esc(g.blurb) + '</p>';
      var grid = doc.createElement('div');
      grid.className = 'vid-grid';
      g.videos.filter(function (v) { return v.status !== 'retired'; })
       .forEach(function (v) { grid.appendChild(videoCard(v, g, g.key === focusKey ? mission : null)); });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
    show('scr-videos');
    if (focusKey) {
      setTimeout(function () {
        var t = $('vg-' + focusKey);
        if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 40);
    }
  }

  /* ==================================================================== */
  /*  SCIENCE CORNER                                                      */
  /* ==================================================================== */
  function renderScience() {
    var grid = $('science-grid');
    grid.innerHTML = '';
    Science.list.forEach(function (l) {
      var read = P.science.indexOf(l.id) >= 0;
      var b = doc.createElement('button');
      b.className = 'card';
      b.innerHTML =
        '<div class="card-ico">' + l.icon + '</div>' +
        '<div class="card-name">' + esc(l.title) + '</div>' +
        '<div class="card-tag">' + esc(l.sub) + '</div>' +
        '<div class="card-foot"><span class="pill">' + (read ? '✓ Read' : 'New') + '</span></div>';
      b.addEventListener('click', function () { AcroAudio.sfx.click(); openLesson(l); });
      grid.appendChild(b);
    });
    show('scr-science');
  }

  function openLesson(lesson, mission) {
    if (!lesson) return;
    var el = $('lesson-body');
    el.innerHTML =
      '<canvas class="demo-canvas" id="demo-canvas"></canvas>' +
      '<div class="lsub">' + lesson.icon + ' ' + esc(lesson.sub) + '</div>' +
      '<h2>' + esc(lesson.title) + '</h2>' +
      lesson.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<div class="takeaway">💡 ' + esc(lesson.takeaway) + '</div>';
    show('scr-lesson');
    drawDemo(lesson.demo);

    if (P.science.indexOf(lesson.id) < 0) {
      P.science.push(lesson.id);
      Profile.addXp(60); Profile.addSparks(20);
      Profile.save();
      var fresh = Profile.checkAccolades();
      if (fresh.length) toast('🏅 ' + fresh[0].name + ' unlocked!');
    }
    if (mission && !mission.free) {
      doneMissions[mission.id] = true;
      Profile.addXp(mission.xp || 0); Profile.addSparks(mission.sparks || 0);
      Profile.resolveQuests(Missions.summarise(mission, {}));
      Profile.save();
      toast('Mission complete! +' + (mission.xp || 0) + ' XP');
    }
    speak(lesson.title + '. ' + lesson.body[0]);
  }

  /* Small animated diagrams. A picture of a centre of mass beats a formula. */
  function drawDemo(kind) {
    var cv = $('demo-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d'), t = 0, last = 0;
    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      cv.width = Math.max(200, r.width * dpr);
      cv.height = Math.max(120, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: r.width, h: r.height };
    }
    var d = size();
    var gym = makeGymnast(1);
    gym.scale = Math.max(0.5, Math.min(1.2, d.h / 300));

    function loop(ts) {
      if (!previewRaf) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts; t += dt;
      if (d.w < 4) d = size();
      ctx.clearRect(0, 0, d.w, d.h);
      var fy = d.h * 0.84, cx = d.w * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(d.w, fy); ctx.stroke();

      var sway = Math.sin(t * 1.1);
      if (kind === 'com') {
        gym.pose = AcroSkills.pose({ rot: sway * 9, x: sway * 4 });
        gym.draw(ctx, cx, fy, dt, { noTrail: true });
        /* base of support */
        ctx.fillStyle = 'rgba(125,255,184,0.28)';
        ctx.fillRect(cx - 26, fy - 4, 52, 8);
        /* centre of mass, drifting with the lean */
        var comx = cx + sway * 26;
        var out = Math.abs(sway * 26) > 26;
        ctx.strokeStyle = out ? '#ff6b8a' : '#7dffb8';
        ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(comx, fy - 120 * gym.scale); ctx.lineTo(comx, fy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = out ? '#ff6b8a' : '#7dffb8';
        ctx.beginPath(); ctx.arc(comx, fy - 74 * gym.scale, 8, 0, 6.2832); ctx.fill();
        label(ctx, d, out ? 'Outside the base — you step out!' : 'Balance point over your feet ✓',
              out ? '#ff6b8a' : '#7dffb8');
      } else if (kind === 'landing') {
        var cyc = (t % 2.4) / 2.4;
        var bend = cyc > 0.5 ? Math.sin((cyc - 0.5) * Math.PI * 2) : 0;
        gym.pose = AcroSkills.pose({
          y: cyc < 0.5 ? -60 * Math.sin(cyc * Math.PI * 2) : 14 * bend,
          legLA: 96 + bend * 26, legLB: 93 - bend * 40,
          legRA: 84 - bend * 26, legRB: 87 + bend * 40
        });
        gym.draw(ctx, cx, fy, dt, { noTrail: true });
        label(ctx, d, cyc < 0.5 ? 'In the air…' : 'Bend to land — the stop takes longer, so it hurts less',
              cyc < 0.5 ? 'rgba(255,255,255,.6)' : '#7dffb8');
      } else if (kind === 'rotation') {
        var tight = (t % 5) > 2.5;
        gym.pose = AcroSkills.pose(tight
          ? { rot: (t * 300) % 360, y: -40, legLA: -132, legLB: 42, legRA: -48, legRB: 138,
              armLA: 158, armLB: 178, armRA: 22, armRB: 2 }
          : { rot: (t * 110) % 360, y: -40, legLA: 196, legLB: 194, legRA: -16, legRB: -14,
              armLA: 205, armLB: 200, armRA: -25, armRB: -20 });
        gym.draw(ctx, cx, fy - 40, dt, { noTrail: true });
        label(ctx, d, tight ? 'Tight tuck → fast spin' : 'Open shape → slow spin',
              tight ? '#ffc84a' : '#4fd1ff');
      } else if (kind === 'safety') {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 34px system-ui, sans-serif';
        ctx.fillText('🏠', d.w * 0.3, d.h * 0.4);
        ctx.fillText('🛡️', d.w * 0.7, d.h * 0.4);
        ctx.font = '800 13px system-ui, sans-serif';
        ctx.fillStyle = '#7dffb8';
        ctx.fillText('SAFE AT HOME', d.w * 0.3, d.h * 0.58);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('balances · stretches · jumps', d.w * 0.3, d.h * 0.7);
        ctx.fillText('dance · strength', d.w * 0.3, d.h * 0.78);
        ctx.fillStyle = '#ffc89a';
        ctx.font = '800 13px system-ui, sans-serif';
        ctx.fillText('COACH REQUIRED', d.w * 0.7, d.h * 0.58);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('cartwheels · handstands', d.w * 0.7, d.h * 0.7);
        ctx.fillText('rolls · bridges · walkovers', d.w * 0.7, d.h * 0.78);
      } else {
        gym.pose = AcroSkills.pose({ rot: sway * 5 });
        gym.draw(ctx, cx, fy, dt, { noTrail: true });
      }
      previewRaf = requestAnimationFrame(loop);
    }
    stopPreview();
    previewRaf = requestAnimationFrame(loop);
  }

  function label(ctx, d, text, color) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, d.w / 2, d.h * 0.10);
  }

  /* ==================================================================== */
  /*  CHOREOGRAPHY STUDIO                                                 */
  /* ==================================================================== */
  var routine = [];
  var choreoMission = null;

  function openChoreo(mission) {
    choreoMission = mission || null;
    routine = [];
    renderTimeline();
    renderPalette();
    renderSaved();
    $('routine-name').value = '';
    show('scr-choreo');
    runPreview('choreo-canvas', { sequence: ['releve'] });
  }

  function renderTimeline() {
    var tl = $('timeline');
    tl.innerHTML = '';
    if (!routine.length) {
      tl.innerHTML = '<span class="tl-empty">Tap moves on the right to build your routine →</span>';
      return;
    }
    routine.forEach(function (id, i) {
      var sk = AcroSkills.byId(id);
      var b = doc.createElement('button');
      b.className = 'tl-item';
      b.style.borderColor = sk.color;
      b.style.background = AcroStage.hexA(sk.color, 0.18);
      b.innerHTML = '<span class="dot" style="background:' + sk.color + '"></span>' +
        (i + 1) + '. ' + sk.name + ' ✕';
      b.title = 'Remove';
      b.addEventListener('click', function () {
        routine.splice(i, 1);
        renderTimeline();
        AcroAudio.sfx.back();
      });
      tl.appendChild(b);
    });
  }

  function renderPalette() {
    var pal = $('move-palette');
    pal.innerHTML = '';
    /* Only home-safe skills, plus any supervised skill she has actually
       drilled — you cannot choreograph something you have never practised. */
    AcroSkills.list.filter(function (s) {
      return s.tier === 'home' || Profile.reps(s.id) > 0;
    }).forEach(function (sk) {
      var b = doc.createElement('button');
      b.className = 'move';
      b.innerHTML = '<span class="dot" style="background:' + sk.color + '"></span>' +
        '<b>' + sk.name + '</b><span>' + sk.family + ' · ' +
        AcroSkills.TIERS[sk.tier].icon + '</span>';
      b.addEventListener('click', function () {
        if (routine.length >= 12) { toast('Twelve moves is plenty for one routine!'); return; }
        routine.push(sk.id);
        renderTimeline();
        AcroAudio.sfx.good();
        runPreview('choreo-canvas', { sequence: routine });
      });
      pal.appendChild(b);
    });
  }

  function renderSaved() {
    var box = $('saved-routines');
    box.innerHTML = '';
    if (!P.routines.length) return;
    var h = doc.createElement('h3');
    h.className = 'mini-h'; h.textContent = 'Saved routines';
    box.appendChild(h);
    P.routines.forEach(function (r, i) {
      var d = doc.createElement('div');
      d.className = 'saved';
      d.innerHTML = '<span class="sn">' + esc(r.name || 'Untitled routine') +
        '<small>' + r.elements.length + ' moves · ' + r.date + '</small></span>';
      var load = doc.createElement('button');
      load.className = 'btn btn-ghost';
      load.style.padding = '8px 14px'; load.style.minHeight = '38px';
      load.textContent = 'Load';
      load.addEventListener('click', function () {
        routine = r.elements.slice();
        $('routine-name').value = r.name || '';
        renderTimeline();
        runPreview('choreo-canvas', { sequence: routine });
      });
      var perf = doc.createElement('button');
      perf.className = 'btn';
      perf.style.padding = '8px 14px'; perf.style.minHeight = '38px';
      perf.textContent = '🎪 Perform';
      perf.addEventListener('click', function () {
        currentMission = { id: 'free_perform_' + i, type: 'performance', name: r.name || 'Your routine', free: true };
        currentConfig = Missions.performanceConfig(currentMission, r);
        briefFor(currentMission);
      });
      d.appendChild(load); d.appendChild(perf);
      box.appendChild(d);
    });
  }

  function saveRoutine() {
    if (routine.length < 3) { toast('Add at least three moves first.'); return; }
    var name = $('routine-name').value.trim();
    P.routines.push({ name: name, elements: routine.slice(), date: Profile.today() });
    Profile.addXp(160); Profile.addSparks(55);
    Profile.save();
    var fresh = Profile.checkAccolades();
    toast(fresh.length ? '🏅 ' + fresh[0].name + ' unlocked!' : 'Routine saved! +160 XP');
    if (choreoMission && !choreoMission.free) {
      doneMissions[choreoMission.id] = true;
      Profile.addXp(choreoMission.xp || 0); Profile.addSparks(choreoMission.sparks || 0);
      Profile.resolveQuests(Missions.summarise(choreoMission, {}));
      Profile.advanceWeekly(Missions.summarise(choreoMission, {}));
      Profile.save();
      choreoMission = null;
    }
    renderSaved();
    speak(Coach.nugget('creativity'));
  }

  /* ==================================================================== */
  /*  WARDROBE                                                            */
  /* ==================================================================== */
  function renderWardrobe() {
    if (current !== 'scr-wardrobe') show('scr-wardrobe');
    $('ward-sparks').textContent = P.sparks;
    var box = $('ward-cats');
    box.innerHTML = '';

    box.appendChild(swatchCat('Skin tone', Shop.skins, 'skin', function (i) { return i.hex; }));
    box.appendChild(swatchCat('Hair colour', Shop.hairColors, 'hair', function (i) { return i.hex; }));

    [['Leotard', Shop.leotards, 'leo'],
     ['Hairstyle', Shop.hairStyles, 'hairStyle'],
     ['Celebration', Shop.celebrations, 'celebration'],
     ['Trophy room', Shop.decor, null]].forEach(function (row) {
      var cat = doc.createElement('div');
      cat.className = 'ward-cat';
      cat.innerHTML = '<h3>' + row[0] + '</h3>';
      var grid = doc.createElement('div');
      grid.className = 'ward-items';
      row[1].forEach(function (item) {
        var owned = P.owned.indexOf(item.id) >= 0 || Shop.costOf(item) === 0;
        var on = row[2] && (row[2] === 'leo' ? P.avatar.leo === item.a : P.avatar[row[2]] === item.id);
        var b = doc.createElement('button');
        b.className = 'ward-item' + (on ? ' on' : '');
        b.innerHTML =
          (item.a ? '<div class="ward-swatch" style="background:linear-gradient(135deg,' +
                     item.a + ',' + item.b + ')"></div>'
                  : '<div class="wi">' + (item.icon || '⭐') + '</div>') +
          '<b>' + esc(item.name) + '</b>' +
          (owned ? '<span class="owned">' + (on ? 'Wearing' : 'Owned') + '</span>'
                 : '<span class="cost">' + item.cost + ' ✨</span>');
        b.addEventListener('click', function () {
          if (!owned) {
            if (!Profile.spendSparks(item.cost)) {
              toast('You need ' + (item.cost - P.sparks) + ' more Star Sparks.');
              return;
            }
            P.owned.push(item.id);
            AcroAudio.sfx.badge();
            toast('Unlocked ' + item.name + '!');
          } else AcroAudio.sfx.click();
          if (row[2] === 'leo') { P.avatar.leo = item.a; P.avatar.leo2 = item.b; }
          else if (row[2]) P.avatar[row[2]] = item.id;
          Profile.save();
          renderWardrobe();
        });
        grid.appendChild(b);
      });
      cat.appendChild(grid);
      box.appendChild(cat);
    });
    runPreview('ward-canvas', { sequence: ['releve', 'straddle', 'chasse', 'passe'] });
  }

  function swatchCat(label, items, field, colorOf) {
    var cat = doc.createElement('div');
    cat.className = 'ward-cat';
    cat.innerHTML = '<h3>' + label + '</h3>';
    var row = doc.createElement('div');
    row.className = 'swatches';
    items.forEach(function (i) {
      var owned = !i.cost || P.owned.indexOf(i.id) >= 0;
      var b = doc.createElement('button');
      b.className = 'sw' + (P.avatar[field] === colorOf(i) ? ' on' : '') + (owned ? '' : ' locked');
      b.style.background = colorOf(i);
      b.title = i.name + (owned ? '' : ' — ' + i.cost + ' sparks');
      b.addEventListener('click', function () {
        if (!owned) {
          if (!Profile.spendSparks(i.cost)) { toast('Not enough Star Sparks yet.'); return; }
          P.owned.push(i.id);
          AcroAudio.sfx.badge();
        } else AcroAudio.sfx.click();
        P.avatar[field] = colorOf(i);
        Profile.save();
        renderWardrobe();
      });
      row.appendChild(b);
    });
    cat.appendChild(row);
    return cat;
  }

  /* ==================================================================== */
  /*  PARENT DASHBOARD                                                    */
  /* ==================================================================== */
  function renderParent() {
    var s = Profile.parentSummary();
    var body = $('parent-body');
    var cells = [
      [s.sessions, 'sessions'], [s.minutes + 'm', 'time in game'],
      [s.daysPractised, 'days practised'], [s.streak, 'day streak'],
      [s.accolades + '/' + s.accoladeTotal, 'accolades'],
      [s.videosWatched, 'videos watched'], [s.reflections, 'questions answered'],
      [s.scienceRead + '/' + Science.count, 'science lessons'],
      [s.routines, 'routines built'], [s.performances, 'performances'],
      [s.accuracy + '%', 'timing accuracy'], [s.improvements, 'personal bests']
    ];
    var html = '<div class="p-grid">' + cells.map(function (c) {
      return '<div class="p-cell"><b>' + c[0] + '</b><span>' + c[1] + '</span></div>';
    }).join('') + '</div>';

    html += '<h3 class="mini-h">This week</h3><div class="week-strip">' +
      s.last7.map(function (d) {
        return '<div class="wday' + (d.practised ? ' on' : '') + '">' +
          '<b>' + d.label + '</b><span>' + (d.practised ? '●' : '·') + '</span></div>';
      }).join('') + '</div>';

    if (s.favouriteRooms.length) {
      html += '<h3 class="mini-h">Where she spends her time</h3><div class="p-list">' +
        s.favouriteRooms.map(function (r) {
          var room = Rooms.byId(r.room);
          return '<div class="p-row">' + (room ? room.icon + ' ' + room.name : r.room) +
            '<span class="pv">' + r.sessions + ' sessions</span></div>';
        }).join('') + '</div>';
    }
    if (s.mostPractisedSkills.length) {
      html += '<h3 class="mini-h">Most practised skills</h3><div class="p-list">' +
        s.mostPractisedSkills.map(function (k) {
          var sk = AcroSkills.byId(k.id);
          if (!sk) return '';
          return '<div class="p-row"><span class="dot" style="background:' + sk.color + '"></span> ' +
            sk.name + ' <span class="pill ' + sk.tier + '">' +
            AcroSkills.TIERS[sk.tier].label + '</span>' +
            '<span class="pv">' + k.reps + ' clean reps</span></div>';
        }).join('') + '</div>';
    }

    html += '<h3 class="mini-h">Safety</h3><div class="disclaimer">' +
      'Acroverse separates <b>home-safe</b> movement (balances, stretches, jumps, dance, ' +
      'body-weight strength) from <b>coach-supervised</b> skills (anything inverted: ' +
      'cartwheels, handstands, rolls, bridges, walkovers). Supervised content always shows a ' +
      'warning that must be acknowledged before it will start, and the coach repeats that ' +
      'those skills belong in the gym with a real coach and a mat.' +
      (s.scienceRead ? ' She has read ' + s.scienceRead + ' of the ' + Science.count +
        ' Science Corner lessons, including the safety rules lesson.' : '') +
      '</div>';

    body.innerHTML = html;
    show('scr-parent');
  }

  /* ==================================================================== */
  /*  SETTINGS                                                            */
  /* ==================================================================== */
  function applySettings() {
    var s = P.settings;
    doc.documentElement.setAttribute('data-bigtext', s.bigText ? '1' : '0');
    doc.documentElement.setAttribute('data-motion', s.reduceMotion ? '1' : '0');
    doc.documentElement.setAttribute('data-cb', s.colorBlind ? '1' : '0');
    AcroAudio.setMusic(s.music);
    AcroAudio.setSfx(s.sfx);
    AcroAudio.musicVolume(s.musicVol);
    rhythm.fx.reduceMotion = s.reduceMotion;
    rhythm.stage.reduceMotion = s.reduceMotion;
  }

  function bindSettings() {
    var s = P.settings;
    var map = [
      ['set-music', 'music', 'checkbox'], ['set-sfx', 'sfx', 'checkbox'],
      ['set-voice', 'voice', 'checkbox'], ['set-motion', 'reduceMotion', 'checkbox'],
      ['set-bigtext', 'bigText', 'checkbox'], ['set-captions', 'captions', 'checkbox'],
      ['set-cb', 'colorBlind', 'checkbox']
    ];
    map.forEach(function (row) {
      var el = $(row[0]);
      el.checked = !!s[row[1]];
      el.addEventListener('change', function () {
        s[row[1]] = el.checked;
        Profile.save();
        applySettings();
        if (row[1] === 'voice' && !el.checked && global.speechSynthesis) global.speechSynthesis.cancel();
      });
    });
    var vol = $('set-musicvol');
    vol.value = Math.round(s.musicVol * 100);
    vol.addEventListener('input', function () {
      s.musicVol = vol.value / 100; AcroAudio.musicVolume(s.musicVol); Profile.save();
    });
    var as = $('set-assist');
    as.value = s.assist;
    as.addEventListener('change', function () { s.assist = as.value; Profile.save(); });

    $('set-reset').addEventListener('click', function () {
      modal('Reset everything?',
        'This clears every star, accolade, routine, outfit and streak on this device. ' +
        'It cannot be undone.',
        [{ label: 'Cancel', ghost: true },
         { label: 'Reset', fn: function () {
            P = Profile.reset();
            doneMissions = {};
            applySettings(); bindSettings(); renderHub();
            show('scr-hub');
            toast('Fresh start! Welcome back to the Academy.');
         } }]);
    });
  }

  /* ==================================================================== */
  /*  CREATE SCREEN                                                       */
  /* ==================================================================== */
  function renderCreate() {
    if (current !== 'scr-create') show('scr-create');
    function swatches(boxId, items, field, colorOf) {
      var box = $(boxId);
      box.innerHTML = '';
      items.forEach(function (i) {
        if (i.cost) return;                        // paid options live in the wardrobe
        var b = doc.createElement('button');
        b.className = 'sw' + (P.avatar[field] === colorOf(i) ? ' on' : '');
        b.style.background = colorOf(i);
        b.title = i.name;
        b.addEventListener('click', function () {
          P.avatar[field] = colorOf(i);
          Profile.save();
          renderCreate();
        });
        box.appendChild(b);
      });
    }
    swatches('sw-skin', Shop.skins, 'skin', function (i) { return i.hex; });
    swatches('sw-hair', Shop.hairColors, 'hair', function (i) { return i.hex; });

    var box = $('sw-leo');
    box.innerHTML = '';
    Shop.leotards.filter(function (l) { return !l.cost; }).forEach(function (l) {
      var b = doc.createElement('button');
      b.className = 'sw' + (P.avatar.leo === l.a ? ' on' : '');
      b.style.background = 'linear-gradient(135deg,' + l.a + ',' + l.b + ')';
      b.title = l.name;
      b.addEventListener('click', function () {
        P.avatar.leo = l.a; P.avatar.leo2 = l.b;
        Profile.save(); renderCreate();
      });
      box.appendChild(b);
    });
    runPreview('avatar-canvas', { sequence: ['releve', 'straddle', 'passe'] });
  }

  /* ==================================================================== */
  /*  WIRING                                                              */
  /* ==================================================================== */
  function bind() {
    $('btn-boot').addEventListener('click', function () {
      AcroAudio.init(); AcroAudio.resume();
      applySettings();
      AcroAudio.play('menu');
      if (!P.name) { show('scr-create'); renderCreate(); }
      else { goHub(); speak(Coach.say(P.days.length > 1 ? 'returning' : 'greeting')); }
    });

    $('create-go').addEventListener('click', function () {
      P.name = $('create-name').value.trim();
      Profile.save();
      AcroAudio.sfx.whoosh();
      goHub();
      var greet = 'Welcome to Acroverse' + (P.name ? ', ' + P.name : '') +
        '. I am Coach Zuri. Before anything else, we learn the first rule of the Academy.';
      speak(greet);
      toast(greet);
    });

    $('btn-nugget').addEventListener('click', function () {
      AcroAudio.sfx.click(); speak(newNugget());
    });
    $('btn-trophy').addEventListener('click', function () { AcroAudio.sfx.click(); show('scr-trophy'); renderTrophy(); });
    $('btn-videos').addEventListener('click', function () { AcroAudio.sfx.click(); openVideos(null); });
    $('btn-science').addEventListener('click', function () { AcroAudio.sfx.click(); renderScience(); });
    $('btn-wardrobe').addEventListener('click', function () {
      AcroAudio.sfx.click();
      show('scr-wardrobe');          // show first: show() cancels preview loops
      renderWardrobe();
    });
    $('btn-parent').addEventListener('click', function () { AcroAudio.sfx.click(); renderParent(); });
    $('btn-settings').addEventListener('click', function () { AcroAudio.sfx.click(); show('scr-settings'); });
    $('btn-profile').addEventListener('click', function () { AcroAudio.sfx.click(); show('scr-trophy'); renderTrophy(); });

    Array.prototype.forEach.call(doc.querySelectorAll('[data-back]'), function (b) {
      b.addEventListener('click', function () {
        AcroAudio.sfx.back();
        var to = b.getAttribute('data-back');
        if (to === 'scr-hub') goHub(); else show(to);
      });
    });

    $('brief-start').addEventListener('click', function () { AcroAudio.sfx.whoosh(); startMission(); });
    $('brief-watch').addEventListener('click', function () {
      AcroAudio.sfx.click();
      var vid = 'warmup';
      if (currentConfig && currentConfig.skills && currentConfig.skills.length) {
        vid = (AcroSkills.byId(currentConfig.skills[0]) || {}).video || 'warmup';
      }
      openVideos(vid);
    });

    $('res-again').addEventListener('click', function () { AcroAudio.sfx.whoosh(); startMission(); });
    $('res-next-btn').addEventListener('click', function () { AcroAudio.sfx.back(); goHub(); });

    $('btn-pause').addEventListener('click', function () {
      if (active === rhythm) rhythm.togglePause();
      else if (mini) mini.paused = !mini.paused;
    });

    $('choreo-clear').addEventListener('click', function () { routine = []; renderTimeline(); });
    $('choreo-preview').addEventListener('click', function () {
      if (!routine.length) { toast('Add some moves first!'); return; }
      runPreview('choreo-canvas', { sequence: routine });
    });
    $('choreo-save').addEventListener('click', saveRoutine);

    /* lane pads (rhythm) */
    Array.prototype.forEach.call(doc.querySelectorAll('.pad'), function (pad) {
      var lane = parseInt(pad.getAttribute('data-lane'), 10);
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (pad.setPointerCapture) pad.setPointerCapture(e.pointerId);
        rhythm.keyDown[lane] = true; rhythm.pressLane(lane);
      });
      var up = function (e) { e.preventDefault(); rhythm.keyDown[lane] = false; rhythm.releaseLane(lane); };
      pad.addEventListener('pointerup', up);
      pad.addEventListener('pointercancel', up);
      pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    /* mini-game pads */
    Array.prototype.forEach.call(doc.querySelectorAll('.mini-pad'), function (pad) {
      var act = pad.getAttribute('data-act');
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (mini) mini.press(act);
      });
      pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    global.addEventListener('resize', function () {
      if (current === 'scr-play' && active) active.resize();
    });

    /* Auto-pause when the tab is hidden — she should never come back to a
       routine that carried on without her. */
    doc.addEventListener('visibilitychange', function () {
      if (!doc.hidden || current !== 'scr-play') return;
      if (active === rhythm && rhythm.running && !rhythm.paused) rhythm.togglePause();
      else if (mini && !mini.paused) mini.paused = true;
    });
  }

  function goHub() {
    AcroAudio.play('menu');
    renderHub();
    newNugget();
    show('scr-hub');
  }

  /* ---- boot --------------------------------------------------------------- */
  function init() {
    P = Profile.load();
    /* free items are always owned, even on an old save */
    Shop.freeIds().forEach(function (id) { if (P.owned.indexOf(id) < 0) P.owned.push(id); });
    /* rebuild the completed-mission set from saved mission records */
    Object.keys(P.missions).forEach(function (id) {
      if (Districts.mission(id)) doneMissions[id] = true;
    });
    bind();
    bindSettings();
    applySettings();
    newNugget();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

  global.App = {
    show: show, toast: toast, goHub: goHub,
    /* exposed so automated tests can drive a running session */
    rhythm: rhythm,
    activeGame: function () { return active; },
    profile: function () { return P; }
  };
})(window);
