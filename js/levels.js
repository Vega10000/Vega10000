/* =========================================================================
   levels.js — the season plan.

   The order is the order a real beginner acro class moves in: warm up, learn
   shapes, build the strength and flexibility that skills need, then tumble,
   then perform. Each zone unlocks on stars earned so the progression cannot
   be skipped straight to the hard tumbling.
   ========================================================================= */

(function (global) {
  'use strict';

  var LEVELS = [
    {
      id: 'warmup', name: 'Warm-Up Zone', icon: '🔥', zone: 'warmup',
      music: 'chill', family: 'Warm-Up', video: 'warmup', unlock: 0,
      tagline: 'Wake the body up. Every session starts here.',
      brief: 'Follow the beat and hold each stretch shape. Slow and steady — this is where injuries get prevented.',
      skills: ['releve', 'hollow', 'arch', 'split'],
      bars: 14, density: 2.0, holdBias: 0.85
    },
    {
      id: 'shapes', name: 'Shapes Lab', icon: '⭐', zone: 'shapes',
      music: 'boombap', family: 'Shapes', video: 'shapes', unlock: 1,
      tagline: 'Tuck, straddle, pike — the alphabet of acro.',
      brief: 'Quick jumps on the beat. Tight shapes score higher, so squeeze everything and point those toes.',
      skills: ['tuck', 'straddle', 'pike', 'releve'],
      bars: 16, density: 3.2, holdBias: 0.18
    },
    {
      id: 'strength', name: 'Strength Studio', icon: '💪', zone: 'strength',
      music: 'boombap', family: 'Strength', video: 'conditioning', unlock: 3,
      tagline: 'Hollow and arch: the shape of every flip.',
      brief: 'Long holds. Your core is the boss of your whole body — give it a job and do not let the shape sag.',
      skills: ['hollow', 'arch', 'candle', 'releve'],
      bars: 16, density: 2.4, holdBias: 0.8
    },
    {
      id: 'balance', name: 'Balance Bay', icon: '🕊️', zone: 'balance',
      music: 'chill', family: 'Balance', video: 'balance', unlock: 6,
      tagline: 'Pick one spot and give it your eyes.',
      brief: 'Hold your balance through the whole note. Wobbling is fine — falling out early is what costs you.',
      skills: ['releve', 'passe', 'candle', 'handstand'],
      bars: 16, density: 2.6, holdBias: 0.9
    },
    {
      id: 'flex', name: 'Flex & Bridge Studio', icon: '🌉', zone: 'flex',
      music: 'chill', family: 'Flexibility', video: 'bridge', unlock: 9,
      tagline: 'Shoulders past your hands. Breathe out and sink.',
      brief: 'Bridges and splits, held long. Never bounce — sink into it and breathe on every hold.',
      skills: ['bridge', 'split', 'arch', 'passe'],
      bars: 16, density: 2.4, holdBias: 0.88
    },
    {
      id: 'tumbling', name: 'Tumble Track', icon: '🌀', zone: 'tumbling',
      music: 'trap', family: 'Tumbling', video: 'cartwheel', unlock: 12,
      tagline: 'Hand, hand, foot, foot. Commit all the way.',
      brief: 'Fast, and it should be. Rolls and cartwheels on the beat, then round-offs once you find the rhythm.',
      skills: ['fwdroll', 'cartwheel', 'roundoff', 'tuck'],
      bars: 18, density: 3.6, holdBias: 0.08
    },
    {
      id: 'showcase', name: 'The Showcase', icon: '🎪', zone: 'showcase',
      music: 'showcase', family: 'Showcase', video: 'roundoff', unlock: 15,
      tagline: 'Lights up. Perform to the back row.',
      brief: 'Your full routine, everything you have drilled, one pass, no do-overs. Chin up and finish every shape.',
      skills: ['tuck', 'straddle', 'leap', 'cartwheel', 'roundoff', 'walkover',
               'handstand', 'bridge', 'split', 'fwdroll', 'passe', 'pike'],
      bars: 24, density: 3.9, holdBias: 0.3, showcase: true
    }
  ];

  var BY_ID = {};
  LEVELS.forEach(function (l) { BY_ID[l.id] = l; });

  global.AcroLevels = {
    list: LEVELS,
    byId: function (id) { return BY_ID[id]; },
    isUnlocked: function (lvl, totalStars) { return totalStars >= lvl.unlock; }
  };
})(window);
