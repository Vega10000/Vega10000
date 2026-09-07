/* =========================================================================
   profile.js — the save file, and everything that reads from it.

   Owns: XP and ranks, Star Sparks, the accolade table, daily quests, the
   weekly challenge, practice streaks, and the aggregates the parent
   dashboard reads.

   Everything lives in one localStorage blob. If storage is unavailable
   (private window, blocked site data) the game runs unsaved rather than
   refusing to start — a kid should never meet a wall of an error screen.
   ========================================================================= */

(function (global) {
  'use strict';

  var KEY = 'acroverse.profile.v1';

  function blank() {
    return {
      created: today(),
      name: '',
      avatar: {
        skin: '#c98b62', hair: '#2b1a12', hairStyle: 'ponytail',
        leo: '#ff4f9a', leo2: '#7a3cff', accent: '#ffc84a',
        celebration: 'sparkle'
      },
      owned: ['ponytail', 'sparkle'],     // unlocked customisation items
      xp: 0,
      sparks: 0,
      sparksEarned: 0,

      /* raw counters — everything the accolades and dashboard read */
      drills: 0,
      perfect: 0, great: 0, good: 0, miss: 0,
      bestCombo: 0,
      holdSeconds: 0,
      practiceSeconds: 0,
      flawless: 0,
      improvements: 0,                    // times she beat her own score
      comebacks: 0,                       // improved after a weak run
      attempts: 0,                        // every drill start, finished or not

      skillReps: {},                      // skillId -> clean reps
      rooms: {},                          // roomId  -> { sessions, best, stars }
      missions: {},                       // missionId -> { stars, best, plays }
      games: {},                          // minigameId -> { plays, best }
      routines: [],                       // saved choreography
      performances: [],                   // { score, date, breakdown }
      bestPerformance: 0,

      videos: [],                         // video ids watched
      reflections: {},                    // videoId -> answer index
      science: [],                        // science lesson ids read

      days: [],                           // ISO dates practised
      quests: { date: '', done: [] },
      weekly: { week: '', progress: 0, claimed: false },

      badges: {},                         // accoladeId -> ISO date

      settings: {
        music: true, sfx: true, voice: true,
        musicVol: 0.8, coachVol: 1,
        reduceMotion: false, captions: true, bigText: false,
        colorBlind: false, assist: 'normal'   // easy | normal | pro
      }
    };
  }

  var P = blank();

  function today() { return new Date().toISOString().slice(0, 10); }

  function weekKey(d) {
    d = d || new Date();
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + Math.ceil((((t - y0) / 86400000) + 1) / 7);
  }

  function load() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw), base = blank(), k;
        for (k in base) if (base.hasOwnProperty(k) && saved[k] !== undefined) base[k] = saved[k];
        /* merge settings and avatar forward, so a new option gets a default
           instead of being undefined on an old save */
        ['settings', 'avatar'].forEach(function (grp) {
          var d = blank()[grp];
          for (var kk in d) if (base[grp][kk] === undefined) base[grp][kk] = d[kk];
        });
        P = base;
      }
    } catch (e) { P = blank(); }
    return P;
  }

  function save() {
    try { if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(P)); }
    catch (e) { /* quota or blocked — play on, unsaved */ }
  }

  /* ------------------------------------------------------------- ranks */
  var RANKS = [
    { xp: 0,     name: 'Rookie Acrobat',    icon: '🌱', blurb: 'Everyone starts here.' },
    { xp: 400,   name: 'Movement Explorer', icon: '🧭', blurb: 'Learning what your body can do.' },
    { xp: 1000,  name: 'Balance Builder',   icon: '⚖️', blurb: 'Steady on your feet.' },
    { xp: 1900,  name: 'Skill Seeker',      icon: '🔎', blurb: 'Hunting the next shape.' },
    { xp: 3200,  name: 'Acrobat Apprentice',icon: '🎒', blurb: 'The basics belong to you now.' },
    { xp: 5000,  name: 'Rising Acrobat',    icon: '🚀', blurb: 'People are starting to notice.' },
    { xp: 7400,  name: 'Rhythm Artist',     icon: '🎧', blurb: 'You move like the music.' },
    { xp: 10500, name: 'Performance Artist',icon: '🎭', blurb: 'You do not just do skills. You perform them.' },
    { xp: 14500, name: 'Elite Acrobat',     icon: '💎', blurb: 'Clean, confident, consistent.' },
    { xp: 20000, name: 'Acro Champion',     icon: '👑', blurb: 'The whole journey, earned.' }
  ];

  function rank() {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (P.xp >= RANKS[i].xp) r = RANKS[i];
    return r;
  }
  function nextRank() {
    for (var i = 0; i < RANKS.length; i++) if (P.xp < RANKS[i].xp) return RANKS[i];
    return null;
  }
  function rankIndex() {
    var n = 0;
    for (var i = 0; i < RANKS.length; i++) if (P.xp >= RANKS[i].xp) n = i;
    return n;
  }

  /* ---- awarding --------------------------------------------------------- */
  function addXp(n) {
    var before = rankIndex();
    P.xp += Math.max(0, Math.round(n));
    return rankIndex() > before ? rank() : null;   // returns the new rank, or null
  }
  function addSparks(n) {
    n = Math.max(0, Math.round(n));
    P.sparks += n; P.sparksEarned += n;
    return n;
  }
  function spendSparks(n) {
    if (P.sparks < n) return false;
    P.sparks -= n; save(); return true;
  }

  /* ---- streaks ---------------------------------------------------------- */
  function markPractised() {
    var t = today();
    if (P.days.indexOf(t) === -1) {
      P.days.push(t); P.days.sort();
      if (P.days.length > 500) P.days = P.days.slice(-500);
    }
  }
  function dayStreak() {
    if (!P.days.length) return 0;
    var set = {}, i;
    for (i = 0; i < P.days.length; i++) set[P.days[i]] = 1;
    var d = new Date(), n = 0;
    /* today OR yesterday keeps it alive, so an evening session tomorrow
       does not "lose" a streak overnight */
    if (!set[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (set[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---- small readers used all over the UI -------------------------------- */
  function reps(id) { return P.skillReps[id] || 0; }
  function roomStars(id) { return (P.rooms[id] && P.rooms[id].stars) || 0; }
  function totalStars() {
    var n = 0, k;
    for (k in P.rooms) if (P.rooms.hasOwnProperty(k)) n += P.rooms[k].stars || 0;
    return n;
  }
  function roomsCleared() {
    var n = 0, k;
    for (k in P.rooms) if (P.rooms[k].stars > 0) n++;
    return n;
  }
  function gamesPlayed() {
    var n = 0, k;
    for (k in P.games) if (P.games[k].plays > 0) n++;
    return n;
  }
  function skillsLearned() {
    var n = 0, k;
    for (k in P.skillReps) if (P.skillReps[k] > 0) n++;
    return n;
  }

  /* ==================================================================== */
  /*  ACCOLADES                                                           */
  /*  A(id, icon, tier, category, name, description, counter, goal)       */
  /*  Locked badges show cur/goal, so the next one always feels close.    */
  /* ==================================================================== */
  var TIER_XP = { bronze: 60, silver: 150, gold: 320, platinum: 700 };
  var TIER_SPARKS = { bronze: 15, silver: 40, gold: 90, platinum: 200 };

  function A(id, icon, tier, cat, name, desc, count, goal) {
    return { id: id, icon: icon, tier: tier, cat: cat, name: name, desc: desc,
             count: count, goal: goal,
             xp: TIER_XP[tier], sparks: TIER_SPARKS[tier] };
  }

  var ACCOLADES = [
    /* ---- discovery ---- */
    A('first_flight','🕊️','bronze','Discovery','First Flight','Complete your first training mission.',function(){return P.drills;},1),
    A('explorer','🧭','bronze','Discovery','Movement Explorer','Try 5 different skills.',function(){return skillsLearned();},5),
    A('roomer','🚪','bronze','Discovery','Open Door','Train in 3 different rooms.',function(){return roomsCleared();},3),
    A('all_rooms','🏛️','gold','Discovery','Academy Regular','Train in every room in the Academy.',function(){return roomsCleared();},8),
    A('gamer','🎮','bronze','Discovery','Game On','Play 4 different mini-games.',function(){return gamesPlayed();},4),
    A('all_games','🕹️','gold','Discovery','Arcade Master','Play every mini-game at least once.',function(){return gamesPlayed();},9),
    A('curious','❓','bronze','Discovery','Curious Mind','Read your first Science Corner lesson.',function(){return P.science.length;},1),
    A('avatar1','👗','bronze','Discovery','Looking Sharp','Customise your acrobat.',function(){return P.owned.length>2?1:0;},1),

    /* ---- balance ---- */
    A('steady_star','⭐','bronze','Balance','Steady Star','Hold a balance successfully.',function(){return reps('releve')+reps('passe');},1),
    A('steady10','🪨','bronze','Balance','Rock Steady','Land 10 clean balance holds.',function(){return reps('releve')+reps('passe')+reps('lunge');},10),
    A('steady50','🏔️','silver','Balance','Immovable','Land 50 clean balance holds.',function(){return reps('releve')+reps('passe')+reps('lunge');},50),
    A('hold60','⏳','bronze','Balance','One Full Minute','Hold shapes for 60 seconds in total.',function(){return Math.floor(P.holdSeconds);},60),
    A('hold600','🧘','gold','Balance','Ten Minutes Of Still','Hold shapes for 10 minutes in total.',function(){return Math.floor(P.holdSeconds);},600),
    A('beam_pro','🎯','silver','Balance','Beam Walker','Score 800 on Balance Beam.',function(){return (P.games.balance&&P.games.balance.best)||0;},800),

    /* ---- strength ---- */
    A('power_player','💪','bronze','Strength','Power Player','Complete a Power Room session.',function(){return (P.rooms.power&&P.rooms.power.sessions)||0;},1),
    A('core25','🔥','bronze','Strength','Core Starter','Land 25 hollow or arch holds.',function(){return reps('hollow')+reps('arch');},25),
    A('core100','🧱','gold','Strength','Core Of Steel','Land 100 hollow or arch holds.',function(){return reps('hollow')+reps('arch');},100),
    A('squats50','🦵','silver','Strength','Legs Of Spring','Complete 50 clean squats.',function(){return reps('squat');},50),
    A('landing25','🎯','silver','Strength','Soft Landing','Stick 25 landings.',function(){return reps('jumpland');},25),
    A('power3','🏋️','gold','Strength','Power House','Earn 3 stars in the Power Room.',function(){return roomStars('power');},3),

    /* ---- flexibility ---- */
    A('flex_explorer','🌸','bronze','Flexibility','Flexibility Explorer','Complete a Flexibility Garden session.',function(){return (P.rooms.flexibility&&P.rooms.flexibility.sessions)||0;},1),
    A('split10','🪷','bronze','Flexibility','Opening Up','Hold 10 clean splits.',function(){return reps('split');},10),
    A('split50','🦋','gold','Flexibility','Split Decision','Hold 50 clean splits.',function(){return reps('split');},50),
    A('flex3','🌺','gold','Flexibility','Garden Keeper','Earn 3 stars in the Flexibility Garden.',function(){return roomStars('flexibility');},3),
    A('warm10','🔥','bronze','Flexibility','Always Warms Up','Start with a warm-up 10 times.',function(){return (P.rooms.flexibility&&P.rooms.flexibility.sessions)||0;},10),

    /* ---- coordination ---- */
    A('coord1','🤹','bronze','Coordination','Coordination Cadet','Complete a Coordination Zone session.',function(){return (P.rooms.coordination&&P.rooms.coordination.sessions)||0;},1),
    A('mirror','🪞','silver','Coordination','Mirror Master','Score 700 on Mirror Master.',function(){return (P.games.mirror&&P.games.mirror.best)||0;},700),
    A('memory','🧠','silver','Coordination','Photographic','Reach round 7 in Memory Routine.',function(){return (P.games.memory&&P.games.memory.best)||0;},7),
    A('spin','🌀','silver','Coordination','Spin Doctor','Score 700 on Spin Doctor.',function(){return (P.games.spin&&P.games.spin.best)||0;},700),
    A('turns25','💫','bronze','Coordination','Spot On','Complete 25 spotting turns.',function(){return reps('spotturn');},25),
    A('coord3','🎪','gold','Coordination','Wired In','Earn 3 stars in the Coordination Zone.',function(){return roomStars('coordination');},3),

    /* ---- rhythm ---- */
    A('rhythm_rider','🎵','bronze','Rhythm','Rhythm Rider','Complete a rhythm challenge.',function(){return (P.rooms.rhythm&&P.rooms.rhythm.sessions)||0;},1),
    A('onbeat50','🎯','bronze','Rhythm','On The Beat','Land 50 Perfect hits.',function(){return P.perfect;},50),
    A('onbeat300','⏱️','silver','Rhythm','Human Metronome','Land 300 Perfect hits.',function(){return P.perfect;},300),
    A('onbeat1000','🕰️','gold','Rhythm','Clockwork','Land 1000 Perfect hits.',function(){return P.perfect;},1000),
    A('music_master','🎧','silver','Rhythm','Music Master','Score 90% or better on a rhythm mission.',function(){return (P.rooms.rhythm&&P.rooms.rhythm.stars)||0;},3),
    A('freeze','🧊','silver','Rhythm','Freeze Frame','Score 700 on Freeze Frame.',function(){return (P.games.freeze&&P.games.freeze.best)||0;},700),
    A('chasse25','💃','bronze','Rhythm','Light Feet','Complete 25 chassés.',function(){return reps('chasse');},25),

    /* ---- combos ---- */
    A('combo10','🔗','bronze','Combos','Chain Of Ten','Hit a 10 combo.',function(){return P.bestCombo;},10),
    A('combo25','⛓️','silver','Combos','Unbroken','Hit a 25 combo.',function(){return P.bestCombo;},25),
    A('combo50','🌟','gold','Combos','Untouchable','Hit a 50 combo.',function(){return P.bestCombo;},50),
    A('combo100','☄️','platinum','Combos','Legendary Streak','Hit a 100 combo.',function(){return P.bestCombo;},100),
    A('flawless1','💎','silver','Combos','Flawless','Finish a drill with zero misses.',function(){return P.flawless;},1),
    A('flawless10','💠','gold','Combos','Spotless Record','Finish 10 drills with zero misses.',function(){return P.flawless;},10),

    /* ---- tumbling (all coach-supervised skills) ---- */
    A('tumble1','🤸','bronze','Tumbling','First Tumble','Complete a Tumbling Arena session.',function(){return (P.rooms.tumbling&&P.rooms.tumbling.sessions)||0;},1),
    A('roll20','🌀','bronze','Tumbling','Round Like A Ball','Land 20 forward rolls.',function(){return reps('fwdroll');},20),
    A('cart10','☸️','bronze','Tumbling','Wheel Turner','Land 10 clean cartwheels.',function(){return reps('cartwheel');},10),
    A('cart50','☀️','silver','Tumbling','Cartwheel Queen','Land 50 clean cartwheels.',function(){return reps('cartwheel');},50),
    A('hand25','🙌','silver','Tumbling','Upside Down','Hold 25 handstands.',function(){return reps('handstand');},25),
    A('roundoff20','💫','gold','Tumbling','Engine Room','Land 20 round-offs.',function(){return reps('roundoff');},20),
    A('walkover15','🌙','gold','Tumbling','Moonwalker','Land 15 back walkovers.',function(){return reps('walkover');},15),

    /* ---- creativity ---- */
    A('architect','🏗️','silver','Creativity','Routine Architect','Create your first routine.',function(){return P.routines.length;},1),
    A('architect5','📐','gold','Creativity','Choreographer','Create 5 routines.',function(){return P.routines.length;},5),
    A('combo_creator','🧩','silver','Creativity','Combo Creator','Score 700 in Combo Creator.',function(){return (P.games.combo&&P.games.combo.best)||0;},700),
    A('long_routine','📜','gold','Creativity','Epic','Build a routine with 8 or more elements.',function(){
        var m=0;P.routines.forEach(function(r){m=Math.max(m,(r.elements||[]).length);});return m;},8),
    A('signature','✍️','silver','Creativity','Signature Move','Name one of your routines.',function(){
        var n=0;P.routines.forEach(function(r){if(r.name)n++;});return n;},1),

    /* ---- performance ---- */
    A('perform1','🎪','silver','Performance','Performance Star','Complete your first full routine.',function(){return P.performances.length;},1),
    A('perform5','🎬','gold','Performance','Show Runner','Complete 5 performances.',function(){return P.performances.length;},5),
    A('golden','🏆','gold','Performance','Golden Acrobat','Score 80,000+ in a performance.',function(){return P.bestPerformance;},80000),
    A('ovation','👏','platinum','Performance','Standing Ovation','Score 120,000+ in a performance.',function(){return P.bestPerformance;},120000),
    A('landing_pro','🎯','silver','Performance','Perfect Landing','Score 800 on Perfect Landing.',function(){return (P.games.landing&&P.games.landing.best)||0;},800),
    A('champion','👑','platinum','Performance','Acro Champion','Reach the top rank.',function(){return rankIndex()+1;},RANKS.length),
    A('legacy','🎖️','platinum','Performance','Legacy Award','Earn 3 stars in every Academy room.',function(){
        var n=0,k;for(k in P.rooms)if(P.rooms[k].stars===3)n++;return n;},8),

    /* ---- consistency ---- */
    A('streak3','📆','bronze','Consistency','Three In A Row','Practise 3 days in a row.',function(){return dayStreak();},3),
    A('streak7','🗓️','silver','Consistency','Full Week','Practise 7 days in a row.',function(){return dayStreak();},7),
    A('streak30','🏅','platinum','Consistency','Dedicated','Practise 30 days in a row.',function(){return dayStreak();},30),
    A('days10','☀️','bronze','Consistency','Ten Days In','Practise on 10 different days.',function(){return P.days.length;},10),
    A('sessions25','🏃','silver','Consistency','Gym Regular','Complete 25 training sessions.',function(){return P.drills;},25),
    A('sessions100','🦾','platinum','Consistency','Hundred Club','Complete 100 training sessions.',function(){return P.drills;},100),

    /* ---- learning ---- */
    A('student','📺','bronze','Learning','Student Of The Game','Watch 5 tutorial videos.',function(){return P.videos.length;},5),
    A('scholar','🎓','gold','Learning','Scholar','Watch 20 tutorial videos.',function(){return P.videos.length;},20),
    A('reflect1','💭','bronze','Learning','Good Question','Answer your first reflection question.',function(){return Object.keys(P.reflections).length;},1),
    A('reflect10','🧐','silver','Learning','Sharp Eyes','Answer 10 reflection questions.',function(){return Object.keys(P.reflections).length;},10),
    A('science5','🔬','silver','Learning','Science Corner','Read 5 Science Corner lessons.',function(){return P.science.length;},5),
    A('science_all','🧪','gold','Learning','Body Scientist','Read every Science Corner lesson.',function(){return P.science.length;},8),
    A('safety','🛡️','bronze','Learning','Safety First','Learn which skills need a real coach.',function(){return P.science.indexOf('safety')>=0?1:0;},1),

    /* ---- grit ---- */
    A('fearless','🦁','bronze','Grit','Fearless Beginner','Attempt a brand-new challenge.',function(){return P.attempts;},1),
    A('grit','🧗','silver','Grit','Grit Award','Keep going through 20 missed reps.',function(){return P.miss;},20),
    A('comeback','🔁','silver','Grit','Comeback Champion','Improve after a tough run.',function(){return P.comebacks;},1),
    A('comeback10','🔥','gold','Grit','Never Quits','Come back stronger 10 times.',function(){return P.comebacks;},10),
    A('improve','📈','bronze','Grit','Beat Your Best','Beat one of your own scores.',function(){return P.improvements;},1),
    A('improve25','🚀','gold','Grit','Always Climbing','Beat your own score 25 times.',function(){return P.improvements;},25),

    /* ---- collection ---- */
    A('sparks500','✨','bronze','Collection','Spark Collector','Earn 500 Star Sparks.',function(){return P.sparksEarned;},500),
    A('sparks5000','🌠','gold','Collection','Spark Hoarder','Earn 5,000 Star Sparks.',function(){return P.sparksEarned;},5000),
    A('stars12','🌟','silver','Collection','Rising','Earn 12 stars across the Academy.',function(){return totalStars();},12),
    A('stars24','✨','gold','Collection','Star Collector','Earn 24 stars across the Academy.',function(){return totalStars();},24),
    A('badges25','🏵️','silver','Collection','Trophy Hunter','Earn 25 accolades.',function(){return earnedCount();},25),
    A('badges50','🗝️','platinum','Collection','Completionist','Earn 50 accolades.',function(){return earnedCount();},50)
  ];

  var BY_ID = {};
  ACCOLADES.forEach(function (a) { BY_ID[a.id] = a; });

  function progressOf(a) {
    var cur = a.count() || 0;
    return { cur: Math.min(cur, a.goal), goal: a.goal, done: cur >= a.goal,
             pct: Math.min(100, Math.round((cur / a.goal) * 100)) };
  }
  function earnedCount() { return Object.keys(P.badges).length; }

  /* Returns accolades newly earned, awards their XP and Sparks, and marks
     them so each only fires once. */
  function checkAccolades() {
    var fresh = [];
    ACCOLADES.forEach(function (a) {
      if (P.badges[a.id]) return;
      if (progressOf(a).done) {
        P.badges[a.id] = today();
        addXp(a.xp); addSparks(a.sparks);
        fresh.push(a);
      }
    });
    if (fresh.length) save();
    return fresh;
  }

  /* ==================================================================== */
  /*  DAILY QUESTS — three a day, stable for the whole day                */
  /* ==================================================================== */
  var QUEST_POOL = [
    { id: 'q_balance', icon: '⚖️', name: 'Quick Quest', text: 'Train once in the Balance Lab.',
      check: function (s) { return s.room === 'balance'; }, xp: 90, sparks: 25 },
    { id: 'q_power', icon: '💪', name: 'Quick Quest', text: 'Complete a Power Room session.',
      check: function (s) { return s.room === 'power'; }, xp: 90, sparks: 25 },
    { id: 'q_rhythm', icon: '🎵', name: 'Skill Quest', text: 'Finish a Rhythm Studio drill.',
      check: function (s) { return s.room === 'rhythm'; }, xp: 100, sparks: 30 },
    { id: 'q_coord', icon: '🤹', name: 'Skill Quest', text: 'Play a Coordination Zone mini-game.',
      check: function (s) { return s.room === 'coordination'; }, xp: 100, sparks: 30 },
    { id: 'q_flex', icon: '🌸', name: 'Quick Quest', text: 'Spend a session in the Flexibility Garden.',
      check: function (s) { return s.room === 'flexibility'; }, xp: 90, sparks: 25 },
    { id: 'q_star', icon: '⭐', name: 'Star Quest', text: 'Beat one of your own scores.',
      check: function (s) { return s.improved; }, xp: 140, sparks: 45 },
    { id: 'q_combo', icon: '🔗', name: 'Star Quest', text: 'Hit a 10 combo in any drill.',
      check: function (s) { return s.combo >= 10; }, xp: 120, sparks: 35 },
    { id: 'q_clean', icon: '💎', name: 'Star Quest', text: 'Finish a drill with 2 misses or fewer.',
      check: function (s) { return s.miss <= 2; }, xp: 120, sparks: 35 },
    { id: 'q_video', icon: '📺', name: 'Learn Quest', text: 'Watch one tutorial video.',
      check: function (s) { return s.watchedVideo; }, xp: 80, sparks: 25 },
    { id: 'q_science', icon: '🔬', name: 'Learn Quest', text: 'Read a Science Corner lesson.',
      check: function (s) { return s.readScience; }, xp: 80, sparks: 25 },
    { id: 'q_game', icon: '🎮', name: 'Skill Quest', text: 'Play any mini-game.',
      check: function (s) { return !!s.game; }, xp: 100, sparks: 30 },
    { id: 'q_routine', icon: '🎨', name: 'Create Quest', text: 'Add a move to a routine.',
      check: function (s) { return s.builtRoutine; }, xp: 130, sparks: 40 }
  ];

  /* Seeded by the date, so the three quests stay put all day and everyone
     gets a fresh set at midnight without a server. */
  function dailyQuests() {
    var t = today();
    if (P.quests.date !== t) { P.quests = { date: t, done: [] }; save(); }
    var seed = 0, i;
    for (i = 0; i < t.length; i++) seed = (seed * 31 + t.charCodeAt(i)) >>> 0;
    var pool = QUEST_POOL.slice(), out = [];
    for (i = 0; i < 3 && pool.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      out.push(pool.splice(seed % pool.length, 1)[0]);
    }
    return out.map(function (q) {
      return { q: q, done: P.quests.done.indexOf(q.id) !== -1 };
    });
  }

  /* Called after every session with a summary; completes any matching quest. */
  function resolveQuests(summary) {
    var done = [];
    dailyQuests().forEach(function (row) {
      if (row.done) return;
      var ok = false;
      try { ok = row.q.check(summary || {}); } catch (e) { ok = false; }
      if (ok) {
        P.quests.done.push(row.q.id);
        addXp(row.q.xp); addSparks(row.q.sparks);
        done.push(row.q);
      }
    });
    if (done.length) save();
    return done;
  }

  /* ---- weekly challenge -------------------------------------------------- */
  var WEEKLIES = [
    { id: 'w_balance', icon: '⚖️', name: 'Balance Week', text: 'Complete 5 balance sessions this week.', goal: 5, room: 'balance' },
    { id: 'w_rhythm', icon: '🎵', name: 'Rhythm Week', text: 'Complete 5 rhythm sessions this week.', goal: 5, room: 'rhythm' },
    { id: 'w_core', icon: '💪', name: 'Core Control Week', text: 'Complete 5 Power Room sessions this week.', goal: 5, room: 'power' },
    { id: 'w_flex', icon: '🌸', name: 'Flexibility Week', text: 'Complete 5 Flexibility sessions this week.', goal: 5, room: 'flexibility' },
    { id: 'w_chor', icon: '🎨', name: 'Choreography Week', text: 'Build 3 routines this week.', goal: 3, room: 'choreography' },
    { id: 'w_conf', icon: '🦁', name: 'Confidence Week', text: 'Try 5 different mini-games this week.', goal: 5, room: 'any' },
    { id: 'w_perf', icon: '🎪', name: 'Performance Week', text: 'Complete 3 performances this week.', goal: 3, room: 'performance' }
  ];

  function weeklyChallenge() {
    var wk = weekKey();
    if (P.weekly.week !== wk) { P.weekly = { week: wk, progress: 0, claimed: false }; save(); }
    var seed = 0, i;
    for (i = 0; i < wk.length; i++) seed = (seed * 31 + wk.charCodeAt(i)) >>> 0;
    var w = WEEKLIES[seed % WEEKLIES.length];
    return { w: w, progress: Math.min(P.weekly.progress, w.goal),
             done: P.weekly.progress >= w.goal, claimed: P.weekly.claimed };
  }

  function advanceWeekly(summary) {
    var c = weeklyChallenge();
    var hit = c.w.room === 'any' ? !!summary.game
            : c.w.room === 'choreography' ? !!summary.builtRoutine
            : c.w.room === 'performance' ? !!summary.performance
            : summary.room === c.w.room;
    if (hit && P.weekly.progress < c.w.goal) { P.weekly.progress++; save(); }
    var now = weeklyChallenge();
    if (now.done && !now.claimed) {
      P.weekly.claimed = true;
      addXp(400); addSparks(120); save();
      return now.w;
    }
    return null;
  }

  /* ==================================================================== */
  /*  PARENT DASHBOARD                                                    */
  /*  Descriptive only. This is never framed as an assessment.            */
  /* ==================================================================== */
  function parentSummary() {
    var roomRows = [], k;
    for (k in P.rooms) {
      if (P.rooms.hasOwnProperty(k)) {
        roomRows.push({ room: k, sessions: P.rooms[k].sessions || 0, stars: P.rooms[k].stars || 0 });
      }
    }
    roomRows.sort(function (a, b) { return b.sessions - a.sessions; });

    var skillRows = [];
    for (k in P.skillReps) if (P.skillReps[k] > 0) skillRows.push({ id: k, reps: P.skillReps[k] });
    skillRows.sort(function (a, b) { return b.reps - a.reps; });

    var hits = P.perfect + P.great + P.good;
    return {
      name: P.name,
      created: P.created,
      rank: rank(),
      xp: P.xp,
      sparks: P.sparks,
      sessions: P.drills,
      minutes: Math.round(P.practiceSeconds / 60),
      daysPractised: P.days.length,
      streak: dayStreak(),
      lastPractised: P.days.length ? P.days[P.days.length - 1] : null,
      accolades: earnedCount(),
      accoladeTotal: ACCOLADES.length,
      videosWatched: P.videos.length,
      reflections: Object.keys(P.reflections).length,
      scienceRead: P.science.length,
      routines: P.routines.length,
      performances: P.performances.length,
      favouriteRooms: roomRows.slice(0, 4),
      mostPractisedSkills: skillRows.slice(0, 6),
      accuracy: hits + P.miss ? Math.round((hits / (hits + P.miss)) * 100) : 0,
      improvements: P.improvements,
      comebacks: P.comebacks,
      last7: last7Days()
    };
  }

  function last7Days() {
    var out = [], d = new Date(), set = {}, i;
    for (i = 0; i < P.days.length; i++) set[P.days[i]] = 1;
    for (i = 6; i >= 0; i--) {
      var x = new Date(d); x.setDate(d.getDate() - i);
      var iso = x.toISOString().slice(0, 10);
      out.push({ date: iso, practised: !!set[iso],
                 label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][x.getDay()] });
    }
    return out;
  }

  global.Profile = {
    load: load, save: save,
    data: function () { return P; },
    reset: function () { P = blank(); save(); return P; },

    RANKS: RANKS, rank: rank, nextRank: nextRank, rankIndex: rankIndex,
    addXp: addXp, addSparks: addSparks, spendSparks: spendSparks,

    ACCOLADES: ACCOLADES, accolade: function (id) { return BY_ID[id]; },
    progressOf: progressOf, checkAccolades: checkAccolades, earnedCount: earnedCount,
    TIER_COLORS: { bronze: '#c98b52', silver: '#c9d2dd', gold: '#ffc84a', platinum: '#8fe9ff' },

    markPractised: markPractised, dayStreak: dayStreak,
    reps: reps, roomStars: roomStars, totalStars: totalStars,
    roomsCleared: roomsCleared, skillsLearned: skillsLearned,

    dailyQuests: dailyQuests, resolveQuests: resolveQuests,
    weeklyChallenge: weeklyChallenge, advanceWeekly: advanceWeekly,
    parentSummary: parentSummary,
    today: today
  };
})(window);
