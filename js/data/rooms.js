/* =========================================================================
   rooms.js — the eight training rooms of Acroverse Academy.

   A room is a place with a mood, a music style and a set of skills. What
   you actually *do* in a room is a mission (see districts.js), which may be
   a rhythm drill, a mini-game, a video lesson or a performance.

   `tier` is the safety classification of the room as a whole. A 'gym' room
   opens with the coach-supervised warning, every time, with no way to skip
   past it — that is deliberate.
   ========================================================================= */

(function (global) {
  'use strict';

  var ROOMS = [
    {
      id: 'balance', name: 'The Balance Lab', icon: '⚖️', zone: 'balance',
      music: 'rnb', tier: 'home', unlock: 0,
      tagline: 'Steady is a skill, not a feeling.',
      blurb: 'Hold your shapes still while the floor tries to talk you out of it. ' +
             'Balance is not standing still — it is learning how to recover.',
      skills: ['releve', 'passe', 'lunge', 'armframe'],
      games: ['balance', 'freeze'],
      theme: 'balance'
    },
    {
      id: 'flexibility', name: 'The Flexibility Garden', icon: '🌸', zone: 'flex',
      music: 'rnb', tier: 'home', unlock: 1,
      tagline: 'Opening a door, never forcing it.',
      blurb: 'Slow, gentle, breathing work. Nothing here should ever hurt — ' +
             'a strong pull is good, a sharp pain is a stop sign.',
      skills: ['split', 'armframe', 'lunge', 'releve'],
      games: ['freeze'],
      theme: 'flexibility'
    },
    {
      id: 'power', name: 'The Power Room', icon: '💪', zone: 'strength',
      music: 'hiphop', tier: 'home', unlock: 2,
      tagline: 'Strong means controlled.',
      blurb: 'Squats, holds and landings. This is the room that makes every ' +
             'other room easier, and nobody ever sees you do it.',
      skills: ['squat', 'hollow', 'arch', 'heelraise', 'jumpland', 'tuck'],
      games: ['landing'],
      theme: 'strength'
    },
    {
      id: 'coordination', name: 'The Coordination Zone', icon: '🤹', zone: 'coord',
      music: 'funk', tier: 'home', unlock: 4,
      tagline: 'Your body is learning a new language.',
      blurb: 'Footwork, reaction, left and right, sequences. Awkward is the ' +
             'feeling of learning. Lean into it.',
      skills: ['spotturn', 'chasse', 'heelraise', 'armframe'],
      games: ['mirror', 'memory', 'spin'],
      theme: 'coordination'
    },
    {
      id: 'rhythm', name: 'The Rhythm Studio', icon: '🎵', zone: 'rhythm',
      music: 'funk', tier: 'home', unlock: 6,
      tagline: 'Move like you heard it.',
      blurb: 'Counting, dancing, timing, musicality. The room where skills ' +
             'stop being moves and start being a performance.',
      skills: ['chasse', 'leap', 'straddle', 'pike', 'armframe', 'spotturn'],
      games: ['freeze', 'memory'],
      theme: 'focus'
    },
    {
      id: 'tumbling', name: 'The Tumbling Arena', icon: '🤸', zone: 'tumbling',
      music: 'hiphop', tier: 'gym', unlock: 9,
      tagline: 'Coach-supervised. Every single time.',
      blurb: 'Rolls, cartwheels, handstands and walkovers. You learn the ' +
             'shapes and the timing here — you do the real thing at the gym, ' +
             'with your coach and a proper mat.',
      skills: ['fwdroll', 'cartwheel', 'handstand', 'bridge', 'roundoff', 'walkover', 'candle'],
      games: ['spin'],
      theme: 'courage'
    },
    {
      id: 'choreography', name: 'The Choreography Studio', icon: '🎨', zone: 'chor',
      music: 'pop', tier: 'home', unlock: 12,
      tagline: 'Choreography is just choosing on purpose.',
      blurb: 'Take everything you have unlocked and build something that ' +
             'looks like you. Then give it a name.',
      skills: [],
      games: ['combo', 'choreo'],
      theme: 'creativity'
    },
    {
      id: 'performance', name: 'The Performance Arena', icon: '🎪', zone: 'showcase',
      music: 'cinematic', tier: 'home', unlock: 15,
      tagline: 'Look what I can do now.',
      blurb: 'Lights, crowd, music, one run. Everything you have practised, ' +
             'performed all the way through.',
      skills: [],
      games: ['performance'],
      theme: 'performance'
    }
  ];

  var BY_ID = {};
  ROOMS.forEach(function (r) { BY_ID[r.id] = r; });

  global.Rooms = {
    list: ROOMS,
    byId: function (id) { return BY_ID[id]; },
    isUnlocked: function (room, stars) { return stars >= room.unlock; }
  };
})(window);
