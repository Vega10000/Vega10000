/* =========================================================================
   districts.js — story mode.

   Seven districts, each a short chapter with a handful of missions. A
   mission is a typed instruction the mission runner knows how to execute:

     drill        a rhythm drill in a room, using that room's skills
     game         one of the mini-games
     video        watch a tutorial and answer its reflection question
     science      read a Science Corner lesson
     routine      build choreography
     performance  the full staged routine

   Adding a mission is adding a row here. Nothing about a mission is
   hardcoded anywhere else.
   ========================================================================= */

(function (global) {
  'use strict';

  function M(id, type, name, opts) {
    var m = { id: id, type: type, name: name };
    for (var k in opts) if (opts.hasOwnProperty(k)) m[k] = opts[k];
    m.xp = m.xp || 120;
    m.sparks = m.sparks || 35;
    return m;
  }

  var DISTRICTS = [
    {
      id: 'discovery', n: 1, name: 'Discovery', icon: '🧭', color: '#4fd1ff',
      tagline: 'Find out what your body can already do.',
      intro: "Welcome to Acroverse. Before we teach you anything, let's find out what you've already got. " +
             "No pressure, no scores that matter. Just move.",
      outro: "That's your baseline. Everything from here is you, but better.",
      missions: [
        M('d1_m1', 'science', 'Coach Zuri\'s First Rule', { lesson: 'safety', xp: 100, sparks: 30 }),
        M('d1_m2', 'drill', 'Shapes You Already Know', { room: 'power', bars: 12, density: 2.4 }),
        M('d1_m3', 'video', 'Watch A Real Warm-Up', { group: 'warmup' }),
        M('d1_m4', 'drill', 'Stand Tall, Stand Still', { room: 'balance', bars: 12, density: 2.2 }),
        M('d1_m5', 'game', 'Perfect Landing', { game: 'landing', xp: 150, sparks: 45 })
      ]
    },
    {
      id: 'control', n: 2, name: 'Control', icon: '⚖️', color: '#7dffb8',
      tagline: 'Balance and strength, the quiet way.',
      intro: "Control is the whole sport. Everything spectacular is just something controlled, done fast. " +
             "So we build the control first.",
      outro: "You're steadier than you were. That's not a feeling — that's a measurement.",
      missions: [
        M('d2_m1', 'science', 'Why Do We Wobble?', { lesson: 'balancecom' }),
        M('d2_m2', 'drill', 'The Balance Lab', { room: 'balance', bars: 14, density: 2.6 }),
        M('d2_m3', 'game', 'Balance Beam', { game: 'balance', xp: 150, sparks: 45 }),
        M('d2_m4', 'drill', 'Core Control', { room: 'power', bars: 14, density: 2.6 }),
        M('d2_m5', 'science', 'Why Bend Your Knees?', { lesson: 'landing' }),
        M('d2_m6', 'drill', 'Open The Garden', { room: 'flexibility', bars: 14, density: 2.2 })
      ]
    },
    {
      id: 'rhythm', n: 3, name: 'Rhythm', icon: '🎵', color: '#ff8b3d',
      tagline: 'Musicality: the difference between doing and performing.',
      intro: "Anyone can do a skill. An acrobat does it ON the beat. Today you stop counting in your head " +
             "and start hearing it in your body.",
      outro: "Now you're moving like the music instead of next to it.",
      missions: [
        M('d3_m1', 'drill', 'Find The Beat', { room: 'rhythm', bars: 14, density: 3.0 }),
        M('d3_m2', 'game', 'Freeze Frame', { game: 'freeze', xp: 150, sparks: 45 }),
        M('d3_m3', 'video', 'Dance & Movement', { group: 'rhythmdance' }),
        M('d3_m4', 'game', 'Memory Routine', { game: 'memory', xp: 160, sparks: 50 }),
        M('d3_m5', 'drill', 'Ride The Groove', { room: 'rhythm', bars: 16, density: 3.4 })
      ]
    },
    {
      id: 'flight', n: 4, name: 'Flight', icon: '🕊️', color: '#c17bff',
      tagline: 'The upside-down district. Coach required.',
      intro: "Here's the deal. This district is about tumbling, and tumbling gets a real coach and a real mat. " +
             "In here you learn the shapes, the timing and the words. The skill itself, you do at the gym. Deal?",
      outro: "You know what these skills ask for now. Take that knowledge to training.",
      supervised: true,
      missions: [
        M('d4_m1', 'science', 'How Rotation Works', { lesson: 'rotation' }),
        M('d4_m2', 'game', 'Spin Doctor', { game: 'spin', xp: 160, sparks: 50 }),
        M('d4_m3', 'video', 'Learn The Cartwheel', { group: 'cartwheel' }),
        M('d4_m4', 'drill', 'Tumbling Timing', { room: 'tumbling', bars: 16, density: 3.2 }),
        M('d4_m5', 'video', 'Handstand Basics', { group: 'handstand' }),
        M('d4_m6', 'drill', 'The Tumbling Arena', { room: 'tumbling', bars: 18, density: 3.6 })
      ]
    },
    {
      id: 'creation', n: 5, name: 'Creation', icon: '🎨', color: '#ffc84a',
      tagline: 'Build something that looks like you.',
      intro: "You've collected the words. Now write the sentence. This is where a gymnast becomes an artist.",
      outro: "That routine did not exist before you made it. Remember that.",
      missions: [
        M('d5_m1', 'game', 'Mirror Master', { game: 'mirror', xp: 150, sparks: 45 }),
        M('d5_m2', 'game', 'Combo Creator', { game: 'combo', xp: 170, sparks: 55 }),
        M('d5_m3', 'routine', 'Build Your First Routine', { xp: 260, sparks: 90 }),
        M('d5_m4', 'drill', 'Rehearse It', { room: 'rhythm', bars: 16, density: 3.4 })
      ]
    },
    {
      id: 'showtime', n: 6, name: 'Performance', icon: '🎭', color: '#ff4f9a',
      tagline: 'Rehearsal is over. Almost.',
      intro: "A performance is not a harder practice. It's a different job. Practice is for fixing. " +
             "Performing is for showing. Let's learn the difference.",
      outro: "You performed. Not practised — performed. There's a difference and you just felt it.",
      missions: [
        M('d6_m1', 'science', 'Nerves And Your Body', { lesson: 'nerves' }),
        M('d6_m2', 'drill', 'Dress Rehearsal', { room: 'rhythm', bars: 18, density: 3.6 }),
        M('d6_m3', 'video', 'Watch A Real Performance', { group: 'performance' }),
        M('d6_m4', 'performance', 'Your First Showcase', { xp: 400, sparks: 140 })
      ]
    },
    {
      id: 'championship', n: 7, name: 'Championship', icon: '👑', color: '#8fe9ff',
      tagline: 'The Acroverse Grand Performance.',
      intro: "This is it. Your music, your costume, your routine, one run. " +
             "I've watched you build every piece of this. Go and enjoy it.",
      outro: "You thought you were training to become an acrobat. But look at what actually happened. " +
             "You learned patience. You learned courage. You learned how to fall, recover, and try again. " +
             "That's what makes an athlete.",
      missions: [
        M('d7_m1', 'routine', 'Design The Championship Routine', { xp: 320, sparks: 110 }),
        M('d7_m2', 'drill', 'Final Rehearsal', { room: 'rhythm', bars: 20, density: 3.8 }),
        M('d7_m3', 'performance', 'THE GRAND PERFORMANCE', { grand: true, xp: 800, sparks: 300 })
      ]
    }
  ];

  var BY_ID = {}, ALL_MISSIONS = [], MISSION_BY_ID = {};
  DISTRICTS.forEach(function (d) {
    BY_ID[d.id] = d;
    d.missions.forEach(function (m) {
      m.district = d.id;
      ALL_MISSIONS.push(m);
      MISSION_BY_ID[m.id] = m;
    });
  });

  global.Districts = {
    list: DISTRICTS,
    byId: function (id) { return BY_ID[id]; },
    mission: function (id) { return MISSION_BY_ID[id]; },
    allMissions: ALL_MISSIONS,
    /* A district opens once the previous one is finished. */
    isUnlocked: function (d, done) {
      if (d.n === 1) return true;
      var prev = DISTRICTS[d.n - 2];
      return prev.missions.every(function (m) { return done[m.id]; });
    },
    progress: function (d, done) {
      var n = 0;
      d.missions.forEach(function (m) { if (done[m.id]) n++; });
      return { done: n, total: d.missions.length };
    }
  };
})(window);
