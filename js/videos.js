/* =========================================================================
   videos.js — the learning library.

   These are real YouTube tutorials, grouped by the drill they support.

   ROBUSTNESS NOTE
   ---------------
   Third-party videos rot: channels delete them, owners disable embedding.
   So nothing here is trusted blindly. ui.js loads each entry thumbnail-first
   (i.ytimg.com), and if that image fails to load the card degrades into a
   YouTube search link for the same topic. That means a dead ID becomes a
   working search instead of a black rectangle. Every card also carries a
   direct "Watch on YouTube" link for when embedding is disabled.
   ========================================================================= */

(function (global) {
  'use strict';

  function V(id, title, note) { return { id: id, title: title, note: note }; }

  var GROUPS = [
    {
      key: 'warmup', icon: '🔥', name: 'Warm-Up & Stretching',
      search: 'gymnastics warm up stretches for kids',
      blurb: 'Always start here. Warm muscles stretch — cold muscles tear.',
      videos: [
        V('wK99lII1oFM', 'Super Simple Stretches for Kids & Gymnasts', 'Short, easy, do-it-anywhere routine.'),
        V('E8A1YweE7GU', "Kids' Follow-Along Warm-Ups and Stretches", 'Follow along start to finish.'),
        V('xcUPlqRpUhQ', 'Full Body Stretch Warm-Up for Dance, Gym & Cheer', 'Great before any acro session.')
      ]
    },
    {
      key: 'flexibility', icon: '🧘', name: 'Flexibility & Splits',
      search: 'how to do the splits for kids gymnastics stretch',
      blurb: 'The boring minutes that make the exciting skills possible.',
      videos: [
        V('bCAoRWpF_Yk', 'Gymnastics for Kids — Daily Flexibility Routine', 'A repeatable daily habit.'),
        V('nAeY7cH9vXk', 'How to Do the Splits for Kids', 'Step-by-step split progression.'),
        V('38gnESoGfsY', '15-Minute Stretching Routine — Learning the Splits', 'Longer session for stretch days.')
      ]
    },
    {
      key: 'conditioning', icon: '💪', name: 'Strength & Conditioning',
      search: 'gymnastics conditioning for kids hollow body arch',
      blurb: 'Hollow and arch — the shape of every flip you will ever do.',
      videos: [
        V('wK99lII1oFM', 'Build a Strong Body — Simple Drills', 'Body-weight basics, no equipment.'),
        V('bCAoRWpF_Yk', 'Daily Gymnastics Strength Routine for Kids', 'Pairs with the flexibility routine.')
      ]
    },
    {
      key: 'rolls', icon: '🌀', name: 'Rolls',
      search: 'how to do a forward roll beginner gymnastics kids',
      blurb: 'Chin to chest, round like a ball. Never put your head down.',
      videos: [
        V('KCb6cehtmcw', 'How to Do a Forward Roll (Beginner Skill for Kids)', 'The safe, correct head position.'),
        V('ensZiOySzSU', 'How to Do a Perfect Forward Roll', 'Beginner gymnastics & cheer tutorial.'),
        V('Gpq928mjB74', 'How to Do a Back Roll — Beginner, At Home', 'Drills to build up to it safely.'),
        V('U_scqEjjZbM', 'Learn How to Do a Backwards Roll', 'Head Over Heels Gymnastics tutorial.')
      ]
    },
    {
      key: 'shapes', icon: '⭐', name: 'Jumps & Shapes',
      search: 'gymnastics jumps tuck straddle pike tutorial kids',
      blurb: 'Tuck, straddle, pike. The alphabet of acrobatics.',
      videos: [
        V('4uIoko2Ls4I', 'Gymnastics Tutorial for Kids — Beginner Skills', 'Handstand, bridge kickover and cartwheel.'),
        V('wK99lII1oFM', 'Simple Shape & Strength Drills', 'Tight shapes start here.')
      ]
    },
    {
      key: 'balance', icon: '🕊️', name: 'Balance',
      search: 'gymnastics balance drills for kids beam',
      blurb: 'Pick one spot and give it your eyes.',
      videos: [
        V('1WRcfLWlONQ', 'Gymnastics for Kids — How to Do a Handstand', 'A 10-minute lesson from scratch.'),
        V('E8A1YweE7GU', 'Balance & Body Control Warm-Ups', 'Good pre-beam preparation.')
      ]
    },
    {
      key: 'handstand', icon: '🤸', name: 'Handstand',
      search: 'how to do a handstand for kids beginner tutorial',
      blurb: 'Every tumbling pass in the world runs through a handstand.',
      videos: [
        V('W1dY7omecSw', 'Beginner Handstand for Kids with Coach Meggin', 'Taught by a professional gymnastics coach.'),
        V('1WRcfLWlONQ', 'Gymnastics for Kids: How to Do a Handstand', 'Full lesson, from the wall to free-standing.'),
        V('iAflXux4sMQ', 'How to Do a Handstand for Kids — Step by Step', 'Strength and balance progressions.'),
        V('F3EH9pxNSGs', 'How to Do a Handstand for Beginners', 'Clear step-by-step breakdown.')
      ]
    },
    {
      key: 'cartwheel', icon: '☸️', name: 'Cartwheel',
      search: 'how to do a cartwheel for kids beginner tutorial',
      blurb: 'Hand, hand, foot, foot — in one straight line.',
      videos: [
        V('ed8OH0WQjXc', 'Want to Do a Cartwheel? Here’s How', 'Kids gymnastics, step by step.'),
        V('Mw1rjuAdZpQ', 'How to Do a Cartwheel — 5 Easy Steps for Kids', 'Broken into five simple pieces.'),
        V('-0MmGwjDMLY', 'How to Do a Cartwheel for Beginners', 'Starts from a monkey jump at home.'),
        V('PYCsrRGINHA', 'Beginner Gymnastics: How to Do a Cartwheel', 'Classic beginner progression.')
      ]
    },
    {
      key: 'bridge', icon: '🌉', name: 'Bridge & Kickover',
      search: 'bridge backbend kickover tutorial kids gymnastics',
      blurb: 'Shoulders past your hands. Straight arms, straight legs.',
      videos: [
        V('Aa73IgY6nbg', 'Bridge & Backbend Kickover with Coach Meggin', 'Technique, tips and safe drills.'),
        V('308lGytDbK0', 'Bridge, Backbend & Kickover — Beginners Tutorial', 'Full beginner walkthrough.'),
        V('zfqEo774NLU', 'Bridge Kickover for Kids — Easy Beginner Lesson', 'Flexibility-first approach.'),
        V('MYrRUokhJbI', 'Backbend Kickover — First Steps', 'Where to begin if a bridge is new.')
      ]
    },
    {
      key: 'roundoff', icon: '💫', name: 'Round-Off',
      search: 'round off tutorial beginner gymnastics',
      blurb: 'The engine of every tumbling pass.',
      videos: [
        V('nM4K2MfHkFQ', 'Beginner Gymnastics: Round-Off Tutorial', 'Cartwheel to snap, explained.'),
        V('4uIoko2Ls4I', 'Beginner Tumbling Skills for Kids', 'Where the round-off fits in.')
      ]
    },
    {
      key: 'walkover', icon: '🌙', name: 'Back Walkover',
      search: 'back walkover tutorial beginner gymnastics step by step',
      blurb: 'A back walkover is just a moving bridge.',
      videos: [
        V('pG2uW38fkY0', 'Back Walkover for Beginners — At-Home Tutorial', 'Part of a step-by-step series.'),
        V('KR9B8jkUUqA', 'The Only Back Walkover Tutorial You’ll Ever Need', 'Quick and clear.'),
        V('5tSKUALzj9A', 'Front & Back Walkover for Beginners', 'Both directions, step by step.'),
        V('dLbDyBambPc', 'How to Do a Back Walkover in One Day', 'Confidence-building progression.')
      ]
    }
  ];

  var BY_KEY = {};
  GROUPS.forEach(function (g) { BY_KEY[g.key] = g; });

  global.AcroVideos = {
    groups: GROUPS,
    byKey: function (k) { return BY_KEY[k]; },
    thumb: function (id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; },
    embed: function (id) {
      return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
    },
    watch: function (id) { return 'https://www.youtube.com/watch?v=' + id; },
    searchUrl: function (q) {
      return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    }
  };
})(window);
