/* =========================================================================
   accolades.js — the trophy case, and the save file behind it.

   Two responsibilities:
     1. Own the persistent player profile (localStorage, one JSON blob).
     2. Define every accolade as {check, progress} against that profile, so
        the badge screen can show "7 / 10 cartwheels" instead of a locked box.

   Progress bars matter more than the badges here: a 9-year-old needs to see
   that the next one is close, not just that it is locked.
   ========================================================================= */

(function (global) {
  'use strict';

  var KEY = 'acroAcademy.profile.v1';

  function blankProfile() {
    return {
      name: '',
      xp: 0,
      totalPerfect: 0, totalGreat: 0, totalGood: 0, totalMiss: 0, totalHits: 0,
      bestCombo: 0,
      holdSeconds: 0,
      sessions: 0,
      flawless: 0,               // drills finished with zero misses
      showcaseBest: 0,
      skillReps: {},             // skillId -> clean reps
      levels: {},                // levelId -> {stars, best, plays}
      days: [],                  // ISO dates practised, for the streak
      videos: [],                // video ids opened
      badges: {},                // badgeId -> ISO date earned
      settings: { music: true, sfx: true, voice: true, reduceMotion: false }
    };
  }

  var profile = blankProfile();

  function load() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw), base = blankProfile(), k;
        for (k in base) {
          if (base.hasOwnProperty(k) && saved[k] !== undefined) base[k] = saved[k];
        }
        /* Settings gain keys across versions; merge rather than replace. */
        var s = blankProfile().settings;
        for (k in s) { if (base.settings[k] === undefined) base.settings[k] = s[k]; }
        profile = base;
      }
    } catch (e) {
      /* Private browsing, disabled storage, corrupt blob — play unsaved
         rather than refusing to start. */
      profile = blankProfile();
    }
    return profile;
  }

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(profile));
    } catch (e) { /* out of quota or blocked: the session still plays */ }
  }

  /* ---- ranks ------------------------------------------------------------ */
  var RANKS = [
    { xp: 0,     name: 'Rookie',      icon: '🌱' },
    { xp: 600,   name: 'Tumbler',     icon: '🤸' },
    { xp: 1800,  name: 'Flyer',       icon: '🪶' },
    { xp: 4000,  name: 'Acro Star',   icon: '⭐' },
    { xp: 8000,  name: 'Headliner',   icon: '🎪' },
    { xp: 14000, name: 'Legend',      icon: '👑' }
  ];

  function rank() {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (profile.xp >= RANKS[i].xp) r = RANKS[i];
    return r;
  }
  function nextRank() {
    for (var i = 0; i < RANKS.length; i++) if (profile.xp < RANKS[i].xp) return RANKS[i];
    return null;
  }

  /* ---- practice-day streak ---------------------------------------------- */
  function today() { return new Date().toISOString().slice(0, 10); }

  function markPractised() {
    var t = today();
    if (profile.days.indexOf(t) === -1) {
      profile.days.push(t);
      profile.days.sort();
      if (profile.days.length > 400) profile.days = profile.days.slice(-400);
    }
  }

  function dayStreak() {
    if (!profile.days.length) return 0;
    var set = {}, i;
    for (i = 0; i < profile.days.length; i++) set[profile.days[i]] = true;
    var d = new Date(), streak = 0;
    /* A streak stays alive if today OR yesterday was practised, so an
       evening session tomorrow does not "lose" the streak overnight. */
    if (!set[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (set[d.toISOString().slice(0, 10)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }

  function skillReps(id) { return profile.skillReps[id] || 0; }
  function levelStars(id) { return (profile.levels[id] && profile.levels[id].stars) || 0; }
  function totalStars() {
    var n = 0, k;
    for (k in profile.levels) if (profile.levels.hasOwnProperty(k)) n += profile.levels[k].stars || 0;
    return n;
  }

  /* ---- accolade definitions ---------------------------------------------
     count()/goal give the progress bar; earned() is derived from them unless
     a badge needs custom logic. */
  function C(id, icon, tier, name, desc, count, goal) {
    return { id: id, icon: icon, tier: tier, name: name, desc: desc,
             count: count, goal: goal };
  }

  var ACCOLADES = [
    /* first steps */
    C('first_steps', '👟', 'bronze', 'First Steps', 'Finish your very first drill.',
      function () { return profile.sessions; }, 1),
    C('warm_heart', '🔥', 'bronze', 'Warm Heart', 'Complete the Warm-Up zone.',
      function () { return levelStars('warmup') > 0 ? 1 : 0; }, 1),
    C('shape_up', '⭐', 'bronze', 'Shape Up', 'Complete the Shapes Lab.',
      function () { return levelStars('shapes') > 0 ? 1 : 0; }, 1),

    /* precision */
    C('on_beat', '🎯', 'bronze', 'On The Beat', 'Land 50 Perfect hits.',
      function () { return profile.totalPerfect; }, 50),
    C('metronome', '⏱️', 'silver', 'Human Metronome', 'Land 300 Perfect hits.',
      function () { return profile.totalPerfect; }, 300),
    C('clockwork', '🕰️', 'gold', 'Clockwork', 'Land 1000 Perfect hits.',
      function () { return profile.totalPerfect; }, 1000),

    /* combos */
    C('combo10', '🔗', 'bronze', 'Chain of Ten', 'Hit a 10 combo.',
      function () { return profile.bestCombo; }, 10),
    C('combo25', '⛓️', 'silver', 'Unbroken', 'Hit a 25 combo.',
      function () { return profile.bestCombo; }, 25),
    C('combo50', '🌟', 'gold', 'Untouchable', 'Hit a 50 combo.',
      function () { return profile.bestCombo; }, 50),

    /* clean work */
    C('flawless1', '💎', 'silver', 'Flawless', 'Finish a drill with zero misses.',
      function () { return profile.flawless; }, 1),
    C('flawless10', '💠', 'gold', 'Spotless Record', 'Finish 10 drills with zero misses.',
      function () { return profile.flawless; }, 10),

    /* skill mastery */
    C('cart_10', '☸️', 'bronze', 'Wheel Turner', 'Land 10 clean cartwheels.',
      function () { return skillReps('cartwheel'); }, 10),
    C('cart_50', '☀️', 'silver', 'Cartwheel Queen', 'Land 50 clean cartwheels.',
      function () { return skillReps('cartwheel'); }, 50),
    C('hand_25', '🤸', 'silver', 'Upside Down', 'Hold 25 handstands.',
      function () { return skillReps('handstand'); }, 25),
    C('bridge_25', '🌉', 'silver', 'Bridge Builder', 'Hold 25 bridges.',
      function () { return skillReps('bridge'); }, 25),
    C('split_25', '🧘', 'silver', 'Split Decision', 'Hold 25 splits.',
      function () { return skillReps('split'); }, 25),
    C('roll_20', '🌀', 'bronze', 'Round Like A Ball', 'Land 20 forward rolls.',
      function () { return skillReps('fwdroll'); }, 20),
    C('roundoff_20', '💫', 'gold', 'Engine Room', 'Land 20 round-offs.',
      function () { return skillReps('roundoff'); }, 20),
    C('walkover_15', '🌙', 'gold', 'Moonwalker', 'Land 15 back walkovers.',
      function () { return skillReps('walkover'); }, 15),

    /* endurance */
    C('hold_60', '🪨', 'bronze', 'Steady', 'Hold shapes for 60 seconds total.',
      function () { return Math.floor(profile.holdSeconds); }, 60),
    C('hold_600', '🏔️', 'gold', 'Immovable', 'Hold shapes for 10 minutes total.',
      function () { return Math.floor(profile.holdSeconds); }, 600),

    /* consistency — the ones that actually build an athlete */
    C('streak3', '📆', 'bronze', 'Three In A Row', 'Practise 3 days in a row.',
      function () { return dayStreak(); }, 3),
    C('streak7', '🗓️', 'silver', 'Full Week', 'Practise 7 days in a row.',
      function () { return dayStreak(); }, 7),
    C('streak30', '🏅', 'platinum', 'Dedicated', 'Practise 30 days in a row.',
      function () { return dayStreak(); }, 30),
    C('sessions25', '💪', 'silver', 'Gym Rat', 'Complete 25 drill sessions.',
      function () { return profile.sessions; }, 25),

    /* stars & progression */
    C('stars9', '✨', 'bronze', 'Rising', 'Earn 9 stars across the academy.',
      function () { return totalStars(); }, 9),
    C('stars21', '🌠', 'gold', 'Star Collector', 'Earn 21 stars across the academy.',
      function () { return totalStars(); }, 21),
    C('all3', '👑', 'platinum', 'Perfect Season', 'Earn 3 stars in every zone.',
      function () {
        var n = 0, k;
        for (k in profile.levels) if (profile.levels[k].stars === 3) n++;
        return n;
      }, 7),

    /* performance */
    C('showcase1', '🎪', 'silver', 'Showtime', 'Complete the Showcase performance.',
      function () { return profile.showcaseBest > 0 ? 1 : 0; }, 1),
    C('showcase_hi', '🏆', 'platinum', 'Standing Ovation', 'Score 90,000+ in the Showcase.',
      function () { return profile.showcaseBest; }, 90000),

    /* learning */
    C('student', '📺', 'bronze', 'Student of the Game', 'Watch 5 tutorial videos.',
      function () { return profile.videos.length; }, 5),
    C('scholar', '🎓', 'gold', 'Scholar', 'Watch 20 tutorial videos.',
      function () { return profile.videos.length; }, 20)
  ];

  var BY_ID = {};
  ACCOLADES.forEach(function (a) { BY_ID[a.id] = a; });

  function progressOf(a) {
    var cur = a.count() || 0;
    return { cur: Math.min(cur, a.goal), goal: a.goal, done: cur >= a.goal };
  }

  /* Returns the accolades newly earned by whatever just happened, and marks
     them earned so they only ever fire once. */
  function checkNew() {
    var fresh = [];
    ACCOLADES.forEach(function (a) {
      if (profile.badges[a.id]) return;
      if (progressOf(a).done) {
        profile.badges[a.id] = today();
        fresh.push(a);
      }
    });
    if (fresh.length) save();
    return fresh;
  }

  global.AcroAccolades = {
    load: load, save: save,
    profile: function () { return profile; },
    reset: function () { profile = blankProfile(); save(); return profile; },
    list: ACCOLADES,
    byId: function (id) { return BY_ID[id]; },
    progressOf: progressOf,
    checkNew: checkNew,
    earnedCount: function () { return Object.keys(profile.badges).length; },
    rank: rank, nextRank: nextRank, ranks: RANKS,
    markPractised: markPractised, dayStreak: dayStreak,
    totalStars: totalStars, skillReps: skillReps, levelStars: levelStars,
    TIER_COLORS: {
      bronze:   '#c98b52',
      silver:   '#c9d2dd',
      gold:     '#ffc84a',
      platinum: '#8fe9ff'
    }
  };
})(window);
