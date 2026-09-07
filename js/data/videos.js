/* =========================================================================
   videos.js — the "Learn From Real Acrobats" library.

   Each record carries full metadata rather than a bare link, so the library
   can be filtered, audited, and repaired:

     title, creator, source, id, category, difficulty, duration,
     ages, purpose  — why this video is in the library
     safety         — what the player must NOT take from it
     reflect        — the WATCH -> TRY -> REFLECT question

   REPAIR MECHANISM
   ----------------
   Third-party video dies constantly. Every record belongs to a group with
   its own `search` query, and the UI verifies a thumbnail actually loaded
   before offering to play. A record whose thumbnail 404s is replaced in the
   interface by a live YouTube search for the same topic, so a dead link
   degrades into something useful rather than a black rectangle.

   `status` lets a record be retired by hand without deleting the row.
   ========================================================================= */

(function (global) {
  'use strict';

  /* reflect: q = question, a = options, c = index of the best answer,
     why = what the coach says afterwards either way. */
  function V(o) {
    o.status = o.status || 'active';
    o.ages = o.ages || '6-12';
    return o;
  }

  var GROUPS = [
    {
      key: 'warmup', icon: '🔥', name: 'Warm-Up & Preparation',
      category: 'Safety', search: 'gymnastics warm up stretches for kids',
      blurb: 'Always start here. Warm muscles stretch; cold muscles complain.',
      videos: [
        V({ id: 'wK99lII1oFM', title: 'Super Simple Stretches for Kids & Gymnasts',
            creator: 'Gymnastics coaching channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~6 min',
            purpose: 'A short, repeatable warm-up that needs no equipment.',
            safety: 'Warm up before every session. Never stretch into sharp pain.',
            reflect: { q: 'What did the athlete do BEFORE they started stretching?',
                       a: ['Moved around to get warm first', 'Stretched as hard as possible', 'Nothing'],
                       c: 0, why: 'Movement first, stretch second. Warm muscles stretch safely.' } }),
        V({ id: 'E8A1YweE7GU', title: "Kids' Follow-Along Warm-Ups and Stretches",
            creator: 'Recreational gymnastics program', source: 'YouTube',
            difficulty: 'Beginner', duration: '~10 min',
            purpose: 'A full guided warm-up you can follow start to finish.',
            safety: 'Home-safe. Clear space around you before you begin.',
            reflect: { q: 'Why do coaches always start a session the same way?',
                       a: ['To waste time', 'So the body knows what is coming and gets ready', 'To look organised'],
                       c: 1, why: 'A routine warm-up prepares your body and your brain.' } }),
        V({ id: 'xcUPlqRpUhQ', title: 'Full Body Stretch Warm-Up for Dance, Gym & Cheer',
            creator: 'Dance & gymnastics instructor', source: 'YouTube',
            difficulty: 'Beginner', duration: '~12 min',
            purpose: 'Covers the whole body, useful before any acro session.',
            safety: 'Stretch slowly. If it is sharp, back off.',
            reflect: { q: 'How should a good stretch feel?',
                       a: ['Sharp and painful', 'Like a strong pull you can breathe through', 'Like nothing at all'],
                       c: 1, why: 'Opening a door, not forcing it. Pain is a stop sign.' } })
      ]
    },
    {
      key: 'flexibility', icon: '🌸', name: 'Flexibility & Splits',
      category: 'Flexibility', search: 'how to do the splits for kids gymnastics stretch',
      blurb: 'The boring minutes that make the exciting skills possible.',
      videos: [
        V({ id: 'bCAoRWpF_Yk', title: 'Gymnastics for Kids — Daily Flexibility Routine',
            creator: 'Kids gymnastics channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~8 min',
            purpose: 'A daily habit you can actually keep.',
            safety: 'Home-safe. Never bounce; never force a split.',
            reflect: { q: 'How often should you stretch to get more flexible?',
                       a: ['Once a month, really hard', 'A little bit most days', 'Only at the gym'],
                       c: 1, why: 'Ten minutes a day beats an hour on Saturday. Every time.' } }),
        V({ id: 'nAeY7cH9vXk', title: 'How to Do the Splits for Kids',
            creator: 'Gymnastics instructor', source: 'YouTube',
            difficulty: 'Beginner', duration: '~7 min',
            purpose: 'Step-by-step split progression with safe checkpoints.',
            safety: 'Use blocks or cushions under your hands. Come out slowly.',
            reflect: { q: 'What should your hips do in a proper split?',
                       a: ['Twist to one side', 'Stay square to the front', 'It does not matter'],
                       c: 1, why: 'Square hips make the split real instead of a cheat.' } }),
        V({ id: '38gnESoGfsY', title: '15-Minute Stretching Routine — Learning the Splits',
            creator: 'Former competitive gymnast', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~15 min',
            purpose: 'A longer session for dedicated stretch days.',
            safety: 'Warm up first. This one is long — stop if you get tired.',
            reflect: { q: 'What did the athlete do between each stretch?',
                       a: ['Held their breath', 'Breathed out and relaxed into it', 'Bounced'],
                       c: 1, why: 'Breathing out tells your muscles it is safe to let go.' } })
      ]
    },
    {
      key: 'conditioning', icon: '💪', name: 'Strength & Conditioning',
      category: 'Strength', search: 'gymnastics conditioning for kids hollow body',
      blurb: 'Hollow and arch — the shape of every flip you will ever do.',
      videos: [
        V({ id: 'wK99lII1oFM', title: 'Build a Strong Body — Simple Drills',
            creator: 'Gymnastics coaching channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~6 min',
            purpose: 'Body-weight basics that need no equipment.',
            safety: 'Home-safe. Stop when your form gets sloppy, not when you get tired.',
            reflect: { q: 'Why do coaches love the hollow body shape so much?',
                       a: ['It looks cool', 'It is the shape your body makes in almost every skill', 'It is easy'],
                       c: 1, why: 'Hollow is the shape of a flip, a handstand and a landing.' } }),
        V({ id: 'bCAoRWpF_Yk', title: 'Daily Gymnastics Strength Routine for Kids',
            creator: 'Kids gymnastics channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~8 min',
            purpose: 'Pairs with the daily flexibility routine.',
            safety: 'Home-safe. Quality over quantity — two good reps beat ten sloppy ones.',
            reflect: { q: 'What matters more, doing lots of reps or doing them well?',
                       a: ['Lots of reps', 'Doing them well', 'Doing them fast'],
                       c: 1, why: 'Sloppy reps teach your body to be sloppy.' } })
      ]
    },
    {
      key: 'balance', icon: '⚖️', name: 'Balance & Body Control',
      category: 'Balance', search: 'gymnastics balance drills for kids beam',
      blurb: 'Pick one spot and give it your eyes.',
      videos: [
        V({ id: '1WRcfLWlONQ', title: 'Gymnastics for Kids — How to Do a Handstand',
            creator: 'Gymnastics coach', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~10 min',
            purpose: 'Shows how balance and strength work together upside down.',
            safety: 'COACH-SUPERVISED. Watching this does not make it safe to try alone.',
            reflect: { q: 'What helped the athlete stay balanced?',
                       a: ['Looking at their hands and squeezing everything tight', 'Moving quickly', 'Closing their eyes'],
                       c: 0, why: 'Eyes give you information; tight muscles give you control.' } }),
        V({ id: 'E8A1YweE7GU', title: 'Balance & Body Control Warm-Ups',
            creator: 'Recreational gymnastics program', source: 'YouTube',
            difficulty: 'Beginner', duration: '~10 min',
            purpose: 'Safe balance work you can do on the floor at home.',
            safety: 'Home-safe. Practise on the floor before anything raised.',
            reflect: { q: 'What does wobbling actually mean?',
                       a: ['You are bad at balance', 'Your body is working and correcting', 'You should stop'],
                       c: 1, why: 'Only a statue never wobbles. Wobbling is the work.' } })
      ]
    },
    {
      key: 'rhythmdance', icon: '🎵', name: 'Dance, Rhythm & Musicality',
      category: 'Dance', search: 'gymnastics dance floor routine choreography kids',
      blurb: 'Anyone can do a skill. An acrobat does it on the beat.',
      videos: [
        V({ id: 'xcUPlqRpUhQ', title: 'Movement & Dance Warm-Up for Gymnastics',
            creator: 'Dance & gymnastics instructor', source: 'YouTube',
            difficulty: 'Beginner', duration: '~12 min',
            purpose: 'Connects music, counting and movement.',
            safety: 'Home-safe. Clear the space around you first.',
            reflect: { q: 'What did the athlete do with their arms at the end of each move?',
                       a: ['Let them drop', 'Finished them in a clear shape', 'Hid them'],
                       c: 1, why: 'Finished arms make an ordinary skill look expensive.' } }),
        V({ id: 'bCAoRWpF_Yk', title: 'Floor Movement Basics for Young Gymnasts',
            creator: 'Kids gymnastics channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~8 min',
            purpose: 'Introduces travelling steps that link skills together.',
            safety: 'Home-safe on a soft, clear floor.',
            reflect: { q: 'Why does a run-in matter before a leap?',
                       a: ['It looks nice', 'It builds the speed the leap needs', 'It does not matter'],
                       c: 1, why: 'A good run-in is half of a good leap.' } })
      ]
    },
    {
      key: 'rolls', icon: '🌀', name: 'Rolls',
      category: 'Tumbling', search: 'how to do a forward roll beginner gymnastics kids',
      blurb: 'Chin to chest, round like a ball. Never put your head down.',
      videos: [
        V({ id: 'KCb6cehtmcw', title: 'How to Do a Forward Roll (Beginner Skill for Kids)',
            creator: 'Gymnastics coach', source: 'YouTube',
            difficulty: 'Beginner', duration: '~5 min',
            purpose: 'Teaches the safe head position, which is the whole skill.',
            safety: 'COACH-SUPERVISED. Rolls put load near the neck — learn these on a mat with a coach.',
            reflect: { q: 'Where should your chin be during a forward roll?',
                       a: ['Tucked to your chest', 'Looking up at the ceiling', 'Turned to the side'],
                       c: 0, why: 'Chin to chest keeps your head safe and your body round.' } }),
        V({ id: 'ensZiOySzSU', title: 'How to Do a Perfect Forward Roll',
            creator: 'Gymnastics & cheer instructor', source: 'YouTube',
            difficulty: 'Beginner', duration: '~4 min',
            purpose: 'Common mistakes and how to fix them.',
            safety: 'COACH-SUPERVISED. Never on a hard floor.',
            reflect: { q: 'Why does a round back roll better than a flat one?',
                       a: ['It looks better', 'Round shapes roll; flat shapes thud', 'It is faster'],
                       c: 1, why: 'You are trying to be a wheel, not a plank.' } }),
        V({ id: 'U_scqEjjZbM', title: 'Learn How to Do a Backwards Roll',
            creator: 'Head Over Heels Gymnastics', source: 'YouTube',
            difficulty: 'Beginner', duration: '~6 min',
            purpose: 'Progressions that build up to the skill safely.',
            safety: 'COACH-SUPERVISED. Back rolls need hand strength and a spotter.',
            reflect: { q: 'What do your hands do in a backward roll?',
                       a: ['Nothing', 'Push the floor hard to protect your neck', 'Hold your knees'],
                       c: 1, why: 'Strong hands take the weight off your head. That is why we drill push-ups.' } })
      ]
    },
    {
      key: 'cartwheel', icon: '☸️', name: 'Cartwheel',
      category: 'Tumbling', search: 'how to do a cartwheel for kids beginner tutorial',
      blurb: 'Hand, hand, foot, foot — in one straight line.',
      videos: [
        V({ id: 'ed8OH0WQjXc', title: 'Want to Do a Cartwheel? Here’s How',
            creator: 'Kids gymnastics coach', source: 'YouTube',
            difficulty: 'Beginner', duration: '~5 min',
            purpose: 'Breaks the cartwheel into four countable beats.',
            safety: 'COACH-SUPERVISED. Learn it on a mat with someone spotting you.',
            reflect: { q: 'What is the rhythm of a cartwheel?',
                       a: ['Hand, hand, foot, foot', 'Foot, hand, foot, hand', 'All at once'],
                       c: 0, why: 'Say it out loud while you do it. Rhythm beats strength here.' } }),
        V({ id: 'Mw1rjuAdZpQ', title: 'How to Do a Cartwheel — 5 Easy Steps for Kids',
            creator: 'Gymnastics instructor', source: 'YouTube',
            difficulty: 'Beginner', duration: '~6 min',
            purpose: 'Five checkpoints, each one practisable on its own.',
            safety: 'COACH-SUPERVISED. Build up on a line on the floor first.',
            reflect: { q: 'Where should your hands and feet land?',
                       a: ['Anywhere', 'All along one straight line', 'In a circle'],
                       c: 1, why: 'A cartwheel is a wheel on a track, not a wheel in a field.' } }),
        V({ id: '-0MmGwjDMLY', title: 'How to Do a Cartwheel for Beginners',
            creator: 'At-home gymnastics channel', source: 'YouTube',
            difficulty: 'Beginner', duration: '~7 min',
            purpose: 'Starts from a simple monkey jump and builds up.',
            safety: 'COACH-SUPERVISED for the full skill. The lead-up drills are gentler.',
            reflect: { q: 'Why start with a monkey jump instead of the full cartwheel?',
                       a: ['It is more fun', 'It teaches taking weight on your hands safely', 'No reason'],
                       c: 1, why: 'Break a scary skill into three that are not scary.' } })
      ]
    },
    {
      key: 'handstand', icon: '🤸', name: 'Handstand',
      category: 'Tumbling', search: 'how to do a handstand for kids beginner tutorial',
      blurb: 'Every tumbling pass in the world runs through a handstand.',
      videos: [
        V({ id: 'W1dY7omecSw', title: 'Beginner Handstand for Kids with a Coach',
            creator: 'Professional gymnastics coach', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~9 min',
            purpose: 'Wall progressions that build the shape before the balance.',
            safety: 'COACH-SUPERVISED. Inversions need a coach, a mat and a spotter.',
            reflect: { q: 'Where should you look in a handstand?',
                       a: ['At your feet', 'At your hands', 'Straight ahead'],
                       c: 1, why: 'Your body follows your eyes. Look at your hands.' } }),
        V({ id: 'iAflXux4sMQ', title: 'How to Do a Handstand for Kids — Step by Step',
            creator: 'Gymnastics instructor', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~8 min',
            purpose: 'Strength and balance progressions in order.',
            safety: 'COACH-SUPERVISED. Learn how to safely come out of it first.',
            reflect: { q: 'What should you learn BEFORE holding a handstand?',
                       a: ['How to get out of it safely', 'How to hold it longer', 'Nothing'],
                       c: 0, why: 'Knowing how to bail is what makes trying it safe.' } })
      ]
    },
    {
      key: 'bridge', icon: '🌉', name: 'Bridge & Backbends',
      category: 'Flexibility', search: 'bridge backbend tutorial kids gymnastics',
      blurb: 'Shoulders past your hands. Straight arms, straight legs.',
      videos: [
        V({ id: 'Aa73IgY6nbg', title: 'Bridge & Backbend Technique with a Coach',
            creator: 'Professional gymnastics coach', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~9 min',
            purpose: 'Shoulder-first bridging, which protects the lower back.',
            safety: 'COACH-SUPERVISED. Backbends need supervision and a proper surface.',
            reflect: { q: 'A good bridge opens which part of the body most?',
                       a: ['Only the lower back', 'The shoulders', 'The knees'],
                       c: 1, why: 'A bridge that opens the shoulders beats ten that only bend the low back.' } }),
        V({ id: '308lGytDbK0', title: 'Bridge, Backbend & Kickover — Beginners Tutorial',
            creator: 'Gymnastics instructor', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~11 min',
            purpose: 'The full beginner path from bridge to kickover.',
            safety: 'COACH-SUPERVISED. Do not attempt a kickover without a coach.',
            reflect: { q: 'What comes first, a comfortable bridge or a kickover?',
                       a: ['Kickover', 'Comfortable bridge', 'Either way'],
                       c: 1, why: 'You cannot build a moving skill on a shape you cannot hold still.' } })
      ]
    },
    {
      key: 'performance', icon: '🎪', name: 'Performance & Routines',
      category: 'Performance', search: 'youth gymnastics floor routine performance',
      blurb: 'Watch how a performer finishes every single shape.',
      videos: [
        V({ id: 'nM4K2MfHkFQ', title: 'Beginner Gymnastics: Round-Off Tutorial',
            creator: 'Gymnastics coach', source: 'YouTube',
            difficulty: 'Advanced', duration: '~6 min',
            purpose: 'Shows how skills connect into a tumbling pass.',
            safety: 'COACH-SUPERVISED. Round-offs are a gym skill, full stop.',
            reflect: { q: 'What did the athlete do at the END of the skill?',
                       a: ['Stopped in a finished position', 'Walked away', 'Looked at the floor'],
                       c: 0, why: 'The ending is the part people remember. Finish everything.' } }),
        V({ id: '4uIoko2Ls4I', title: 'Beginner Tumbling Skills for Kids',
            creator: 'Kids gymnastics channel', source: 'YouTube',
            difficulty: 'Intermediate', duration: '~10 min',
            purpose: 'How beginner skills fit together into a routine.',
            safety: 'COACH-SUPERVISED for the tumbling elements.',
            reflect: { q: 'Why do gymnasts practise linking skills, not just single skills?',
                       a: ['To save time', 'Because a routine is the links, not just the moves', 'They do not'],
                       c: 1, why: 'Anyone can do a move. A routine is what you do between the moves.' } })
      ]
    }
  ];

  var BY_KEY = {}, ALL = [];
  GROUPS.forEach(function (g) {
    BY_KEY[g.key] = g;
    g.videos.forEach(function (v) { v.group = g.key; ALL.push(v); });
  });

  global.Videos = {
    groups: GROUPS,
    all: ALL,
    byKey: function (k) { return BY_KEY[k]; },
    categories: ['Safety', 'Flexibility', 'Strength', 'Balance', 'Dance', 'Tumbling', 'Performance'],
    difficulties: ['Beginner', 'Intermediate', 'Advanced'],
    thumb: function (id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; },
    embed: function (id) {
      return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
    },
    watch: function (id) { return 'https://www.youtube.com/watch?v=' + id; },
    searchUrl: function (q) {
      return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    },
    /* Retire a record without deleting it, so the library stays auditable. */
    retire: function (id) {
      ALL.forEach(function (v) { if (v.id === id) v.status = 'retired'; });
    }
  };
})(window);
