/* =========================================================================
   coach.js — Coach Nova.

   Nova reacts to what actually happened rather than firing lines at random:
   every line is filed under a trigger, and the picker avoids repeating a
   line until the pool for that trigger has been exhausted. That is the
   difference between a coach and a soundboard.

   Lines are split into two registers:
     TECHNIQUE — real, specific acrobatics coaching cues
     MINDSET   — how to practise, how to fall, how to keep going
   ========================================================================= */

(function (global) {
  'use strict';

  var LINES = {

    /* Said once when a drill session begins. */
    warmup: [
      "Warm muscles stretch. Cold muscles tear. We always start here.",
      "Every session begins the same way, and that is exactly why it works.",
      "Breathe out as you stretch. Holding your breath tells your muscles to fight you.",
      "Ten honest minutes beats an hour of messing around. Let's get honest."
    ],

    startShapes: [
      "Shapes first. Tuck, straddle, pike — these are the alphabet, and skills are the words.",
      "Point your toes even when nobody is watching. Especially then.",
      "A tight shape spins fast. A loose shape just falls. Squeeze everything.",
      "Sloppy shapes become sloppy skills. Let's build clean ones from the start."
    ],
    startBalance: [
      "Pick one spot on the wall and give it your eyes. Your body follows your eyes.",
      "Balance is not standing still. It is a thousand tiny corrections you learn to make quietly.",
      "Wobbling means you are working. Only a statue never wobbles.",
      "Squeeze from your belly button. Balance starts in the middle, not the feet."
    ],
    startStrength: [
      "Strength is what turns a shape you can make into a shape you can hold.",
      "Hollow and arch. These two are the shape of every flip you will ever do.",
      "Your core is the boss of your whole body. Let's give it a job.",
      "This part is not glamorous. It is just the part that makes everything else possible."
    ],
    startFlex: [
      "Flexibility is built in the boring minutes. Ten a day beats an hour on Saturday.",
      "Never bounce in a stretch. Sink, breathe, and let it open.",
      "Stretching should feel like a strong pull, never a sharp pain. Know the difference.",
      "Push your shoulders past your hands in that bridge. That is where the real flexibility lives."
    ],
    startTumbling: [
      "Hand, hand, foot, foot. Say it out loud while you tumble — rhythm beats strength.",
      "Every tumbling pass in the world runs through a handstand. That is why we drill it.",
      "Commit all the way. Half a skill is how people get hurt. Full send, or set it up again.",
      "Look where you are going. Your head leads, your body follows, every single time."
    ],
    startShowcase: [
      "This is showtime. You are not learning now — you are showing what you already own.",
      "Perform to the back row. Chin up, chest proud, finish every single shape.",
      "The routine is already in your body. Your only job is to let it out.",
      "Nerves and excitement feel identical. Call it excitement and it becomes excitement."
    ],

    /* Fired mid-drill on a streak milestone. */
    streak: [
      "That is the rhythm! Feel how the beat carries you?",
      "Beautiful. You just did four in a row without thinking about it.",
      "Now you are moving like an acrobat instead of thinking like one.",
      "That is what practice buys you. Keep it rolling.",
      "Clean, clean, clean. I could put that in a routine right now.",
      "Your shapes are holding up even at speed. That is real progress."
    ],
    bigStreak: [
      "Are you kidding me? That is competition-level consistency!",
      "This is the streak we are going to talk about at dinner. Outstanding.",
      "You just made hard look easy. That is the whole job.",
      "Lock this feeling in your memory. THIS is what dialled-in feels like."
    ],

    perfect: [
      "Perfect timing. Right on the beat.",
      "Textbook. Toes pointed, shape tight.",
      "That one was gorgeous.",
      "Yes! Exactly like that, every time."
    ],

    /* Fired after a miss — never scolding, always the next instruction. */
    miss: [
      "Shake it off. The next rep is the only one that matters now.",
      "Falling is data, not failure. What did that one teach you?",
      "Missed one? Good. That means we picked the right difficulty.",
      "Reset your feet and go again. No frustration, just information.",
      "Every acrobat you admire has missed that a thousand times. Keep going.",
      "Slow it down in your head. Speed comes free once the shape is right."
    ],
    manyMiss: [
      "Let's breathe. Drop your shoulders, unclench your jaw, and find the beat again.",
      "When it stops working, go smaller. Nail one clean rep and build from there.",
      "This drill is supposed to be hard. You are not behind — you are exactly on schedule.",
      "Tired makes everything look impossible. Reset, and let's take the next one."
    ],

    /* Skill-specific corrections, keyed by skill id. */
    skill: {
      tuck:      ["Knees to your chest — not chest to your knees."],
      straddle:  ["Legs straight, toes pointed. Reach out to meet them."],
      pike:      ["Fold at the hips. If your knees bend, you are cheating the fold."],
      leap:      ["Front leg leads, back leg finishes. Split in the air."],
      releve:    ["All the way up on those toes. Grow two inches taller."],
      passe:     ["Square those hips to the front. If a hip opens, the balance is gone."],
      handstand: ["Look at your hands. Push the floor away through your shoulders."],
      candle:    ["Weight on your shoulders, never on your neck."],
      hollow:    ["Low back glued to the floor. If it lifts, bring your legs higher."],
      arch:      ["Lift from your upper back and squeeze those legs together."],
      bridge:    ["Straight arms, straight legs, shoulders past your hands."],
      split:     ["Hips square, back leg turned down. Breathe out as you sink."],
      fwdroll:   ["Chin to chest. Round like a ball and never put your head down."],
      cartwheel: ["Hand, hand, foot, foot — in one straight line."],
      roundoff:  ["Snap those feet together and punch the floor."],
      walkover:  ["Reach back with straight arms. Do not sit down into it."]
    },

    /* End-of-session, by star rating. */
    result3: [
      "Three stars. You did not just pass that — you owned it.",
      "That is the standard now. Everything we do next builds on this.",
      "Flawless work. I am genuinely impressed, and I do not say that to be nice.",
      "Gold star session. Go tell someone about that one."
    ],
    result2: [
      "Two stars — solid work. One more clean pass and that third star is yours.",
      "Good session. The shapes are there; now we tighten the timing.",
      "You are right on the edge of the next level. I can see it.",
      "Nice. Now go again and beat yourself, not anybody else."
    ],
    result1: [
      "One star and a whole lot learned. That is a fair trade.",
      "You finished it. Finishing when it is hard is its own skill.",
      "Now we know what to drill. That is worth more than an easy win.",
      "Progress is not a straight line. Come back to this one tomorrow."
    ],

    accolade: [
      "New accolade unlocked! You earned every bit of that.",
      "Add that one to the trophy case. Well done.",
      "That badge does not get handed out. It gets taken. Nice work.",
      "Look at that — proof that the practice is paying off."
    ],

    /* Fired when the player is idle on a menu. */
    idle: [
      "Ready when you are. Pick a drill and let's work.",
      "Even five minutes counts. Consistency is the whole secret.",
      "Not sure where to start? Warm-Up is never the wrong answer.",
      "Watch a video if you want to see it done first. Then come do it."
    ],

    /* Pure wisdom — surfaced on the hub as rotating 'golden nuggets'. */
    wisdom: [
      "Compare yourself to who you were last month, never to the girl next to you.",
      "The gymnast who falls the most in practice usually falls the least at the meet.",
      "You cannot skip steps. You can only do them faster.",
      "Strong is a look you earn, not a look you copy.",
      "Point your toes. It is free, and it changes everything.",
      "Ask your coach why, not just how. Understanding beats memorising.",
      "The mat is honest. It tells you exactly what you did, every time.",
      "Be the athlete who is early, warmed up, and asking questions.",
      "Confidence is just a memory of doing it before. Go make some memories.",
      "Rest is training too. Muscles get stronger while you sleep, not while you work.",
      "If a skill scares you, break it into three smaller ones you are not scared of.",
      "Nobody gets a standing ovation for the easy routine they were sure of.",
      "Your body will do what your eyes commit to. Look where you want to go.",
      "Talent gets you started. Showing up on the tired days gets you good.",
      "A skill is not learned until you can do it badly-tired and still make it safe.",
      "Celebrate the small wins out loud. They are the only kind there are."
    ]
  };

  /* Non-repeating picker: each pool keeps a shuffled bag and refills when
     empty, so Nova does not say the same thing twice in a row. */
  var bags = {};
  function pick(pool, key) {
    if (!pool || !pool.length) return null;
    if (!bags[key] || !bags[key].length) {
      bags[key] = pool.slice();
      for (var i = bags[key].length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = bags[key][i]; bags[key][i] = bags[key][j]; bags[key][j] = t;
      }
      /* Avoid an immediate repeat across a refill boundary. */
      if (bags[key].length > 1 && bags[key][bags[key].length - 1] === lastSaid[key]) {
        bags[key].unshift(bags[key].pop());
      }
    }
    var line = bags[key].pop();
    lastSaid[key] = line;
    return line;
  }
  var lastSaid = {};

  global.AcroCoach = {
    lines: LINES,
    /* say('miss') -> a miss line; say('skill','cartwheel') -> that cue */
    say: function (trigger, sub) {
      if (trigger === 'skill') {
        var arr = LINES.skill[sub];
        return arr ? pick(arr, 'skill:' + sub) : null;
      }
      return pick(LINES[trigger], trigger);
    },
    wisdom: function () { return pick(LINES.wisdom, 'wisdom'); },
    /* Maps a drill family to its opening line pool. */
    startKeyFor: function (family) {
      return ({
        'Shapes': 'startShapes', 'Balance': 'startBalance',
        'Strength': 'startStrength', 'Flexibility': 'startFlex',
        'Tumbling': 'startTumbling', 'Warm-Up': 'warmup',
        'Showcase': 'startShowcase'
      })[family] || 'startShapes';
    }
  };
})(window);
