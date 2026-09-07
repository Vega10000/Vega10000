/* =========================================================================
   missions.js — turns a mission row into something runnable.

   districts.js describes missions declaratively. This is the only place
   that knows how to translate "a drill in the Power Room, 14 bars" into an
   actual chart config, which is why adding a mission never means touching
   the engine.

   It also owns the safety gate: any mission that touches a coach-supervised
   room or skill is flagged here, and the UI is required to show the warning
   before it will run.
   ========================================================================= */

(function (global) {
  'use strict';

  function skillsFor(room, mission) {
    var ids = (mission && mission.skills) || (room && room.skills) || [];
    return ids.filter(function (id) { return !!AcroSkills.byId(id); });
  }

  /* Assembles the rhythm-engine config for a drill or a performance. */
  function drillConfig(mission) {
    var room = Rooms.byId(mission.room) || Rooms.byId('power');
    var skills = skillsFor(room, mission);
    /* Hold-heavy rooms should chart holds; fast rooms should chart taps. */
    var holds = skills.filter(function (id) { return AcroSkills.byId(id).type === 'hold'; });
    var holdBias = mission.holdBias !== undefined ? mission.holdBias
                 : (holds.length / Math.max(1, skills.length)) * 0.9;
    return {
      id: mission.id,
      name: mission.name,
      icon: room.icon,
      room: room.id,
      zone: room.zone,
      music: mission.music || room.music,
      skills: skills,
      bars: mission.bars || 14,
      density: mission.density || 3.0,
      holdBias: holdBias,
      tier: room.tier,
      openingLine: mission.openingLine || null
    };
  }

  /* A performance runs the rhythm engine over a routine she built, with the
     showcase arrangement and the ceremony switched on. */
  function performanceConfig(mission, routine) {
    var els = (routine && routine.elements) || [];
    var skills = els.length ? els.slice()
               : ['tuck', 'straddle', 'chasse', 'releve', 'spotturn', 'leap', 'armframe', 'split'];
    return {
      id: mission.id,
      name: (routine && routine.name) || mission.name,
      icon: '🎪',
      room: 'performance',
      zone: 'showcase',
      music: mission.music || (mission.grand ? 'cinematic' : 'pop'),
      skills: skills,
      bars: mission.grand ? 24 : 20,
      density: 3.6,
      holdBias: 0.28,
      tier: 'home',
      performance: true,
      grand: !!mission.grand,
      openingLine: Coach.nugget('performance')
    };
  }

  /* True when a mission involves anything that needs a real coach. The UI
     must not start such a mission without showing the warning first. */
  function isSupervised(mission) {
    if (mission.type === 'drill') {
      var room = Rooms.byId(mission.room);
      if (room && room.tier === 'gym') return true;
      return skillsFor(room, mission).some(function (id) {
        return AcroSkills.byId(id).tier === 'gym';
      });
    }
    if (mission.type === 'video') {
      var g = Videos.byKey(mission.group);
      return !!(g && g.videos.some(function (v) { return /COACH-SUPERVISED/.test(v.safety); }));
    }
    return false;
  }

  /* Stars from accuracy. Generous on purpose: this is a practice tool. */
  function starsFor(acc) {
    return acc >= 0.88 ? 3 : (acc >= 0.68 ? 2 : (acc >= 0.40 ? 1 : 0));
  }

  /* The six judged categories shown after a performance. Derived from the
     run rather than invented, and never framed as a physical assessment —
     these score what she did in the game, not how her body looked. */
  function judgePerformance(res) {
    var total = Math.max(1, res.totalNotes);
    var perfect = res.counts.perfect / total;
    var clean = (res.counts.perfect + res.counts.great) / total;
    var landed = (total - res.counts.miss) / total;
    var pct = function (v) { return Math.round(Math.max(0, Math.min(1, v)) * 100); };
    return [
      { key: 'Technique',   value: pct(clean),
        note: 'How cleanly you hit each shape.' },
      { key: 'Control',     value: pct(landed * 0.75 + (res.holdSeconds > 4 ? 0.25 : res.holdSeconds / 16)),
        note: 'Holding your shapes all the way through.' },
      { key: 'Timing',      value: pct(perfect * 0.8 + clean * 0.2),
        note: 'Landing on the beat, not near it.' },
      { key: 'Musicality',  value: pct(res.accuracy),
        note: 'Moving with the music instead of next to it.' },
      { key: 'Creativity',  value: pct(0.55 + Math.min(res.uniqueSkills || 0, 8) / 16),
        note: 'How much variety your routine had.' },
      { key: 'Consistency', value: pct(res.bestCombo / Math.max(8, total * 0.55)),
        note: 'Stringing it together without dropping out.' }
    ];
  }

  global.Missions = {
    drillConfig: drillConfig,
    performanceConfig: performanceConfig,
    isSupervised: isSupervised,
    starsFor: starsFor,
    judgePerformance: judgePerformance,

    /* One place that knows how a mission "counts" once finished. */
    summarise: function (mission, res) {
      return {
        missionId: mission.id,
        room: res.room || mission.room,
        game: res.game || null,
        improved: !!res.improved,
        combo: res.bestCombo || res.combo || 0,
        miss: (res.counts && res.counts.miss) !== undefined ? res.counts.miss : 0,
        performance: !!res.performance,
        watchedVideo: mission.type === 'video',
        readScience: mission.type === 'science',
        builtRoutine: mission.type === 'routine'
      };
    }
  };
})(window);
