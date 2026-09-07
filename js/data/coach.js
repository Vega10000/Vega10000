/* =========================================================================
   coach.js — Coach Zuri, head coach of Acroverse Academy.

   Two libraries in one file:

   1. WISDOM — "Golden Nuggets", filed under the fourteen coaching themes.
      These are the lines that show up between drills, on the hub, and at
      the end of a session. Every one is original, short enough to read
      without stopping play, and written for a nine-year-old.

   2. REACTIONS — what Zuri says in response to something that just
      happened: a great run, a bad run, a comeback, a quit, a new skill.
      These make her feel like she is watching, rather than reciting.

   The picker never repeats a line until its pool is exhausted, because a
   coach who says the same thing twice in a row stops being listened to.
   ========================================================================= */

(function (global) {
  'use strict';

  /* ------------------------------------------------------------- wisdom */
  var WISDOM = {

    courage: [
      "Brave is not 'not scared'. Brave is scared, and doing it anyway.",
      "The first try is supposed to be messy. That is what a first try is for.",
      "You do not have to feel ready. You just have to start.",
      "Nervous means you care about doing it well. That is a good sign.",
      "Every skill you own now was once a skill that scared you.",
      "Courage is a muscle. It gets stronger the same way the others do.",
      "You are allowed to try something you are not good at yet.",
      "Big goals feel scary from far away and normal from up close. Get closer."
    ],

    discipline: [
      "Champions do not just train when they feel excited. They learn how to show up.",
      "Ten honest minutes beats an hour of messing around.",
      "Do the boring part well and the exciting part gets easy.",
      "Nobody sees the practice. Everybody sees the performance.",
      "Rest is training too. Your body gets stronger while you sleep.",
      "Turning up on the tired days is what makes you different.",
      "Small effort, repeated, beats big effort, abandoned.",
      "Be the athlete who is early, warmed up, and asking questions."
    ],

    balance: [
      "Balance is not standing still. Balance is learning how to recover.",
      "Pick one spot and give it your eyes. Your body follows your eyes.",
      "Wobbling means you are working. Only a statue never wobbles.",
      "Balance starts in your middle, not your feet. Squeeze your belly.",
      "Slow down. Balance is a conversation, not a race.",
      "If you fall out, step out on purpose. Falling with control is a skill.",
      "Widen your base when you are learning. Narrow it when you are ready.",
      "Breathe. Holding your breath makes you stiff, and stiff falls over."
    ],

    flexibility: [
      "Stretching should feel like opening a door, not forcing it.",
      "Never bounce in a stretch. Sink, breathe, and let it open.",
      "Flexibility is built in the boring minutes, not the exciting ones.",
      "A strong pull is good. A sharp pain is a stop sign. Know the difference.",
      "Ten minutes a day beats an hour on Saturday. Every time.",
      "Warm muscles stretch. Cold muscles complain.",
      "Being flexible is useless without the strength to control it.",
      "Your body opens on its own schedule, not yours. Keep showing up."
    ],

    strength: [
      "Strong does not mean rushing. Strong means controlled.",
      "Strength is what turns a shape you can make into a shape you can hold.",
      "Your core is the boss of your whole body. Give it a job.",
      "You cannot control what you cannot hold. Build the hold first.",
      "Strength is quiet. It shows up as skills that stop being hard.",
      "Two good repetitions beat ten sloppy ones.",
      "Push the floor away. The floor pushes back — that is where power comes from.",
      "Getting stronger is slow, then sudden. Keep going through the slow part."
    ],

    coordination: [
      "Your body is learning a new language. Give it time.",
      "Say the steps out loud while you do them. Words help the body remember.",
      "Slow is smooth, and smooth becomes fast. Never skip slow.",
      "If it feels awkward, you are learning. Easy means you already knew it.",
      "One thing at a time. Add the second thing once the first is automatic.",
      "Left and right will argue at first. Let them work it out.",
      "Your brain is building a map. Every repetition draws another line on it.",
      "When it falls apart, make it smaller until it works again."
    ],

    patience: [
      "Practice makes movements familiar. Smart practice makes them beautiful.",
      "You cannot skip steps. You can only do them faster.",
      "Progress is not a straight line. Some weeks you just hold your ground.",
      "The skill is not late. You are just early.",
      "Compare yourself to who you were last month, not to the girl next to you.",
      "Learning feels slow from the inside and fast from the outside.",
      "Give a new skill three weeks before you decide anything about it.",
      "Rushing a skill is the slowest way to learn it."
    ],

    focus: [
      "One skill. One thought. Everything else can wait ninety seconds.",
      "Pick the single thing to fix this rep. Just one.",
      "Look where you want to go. Your body goes where your eyes commit.",
      "Quiet body, quiet mind. Drop your shoulders and unclench your jaw.",
      "Distracted practice teaches your body to be distracted.",
      "Before you go, picture it once, all the way through.",
      "Finish the rep you are in before you think about the next one.",
      "Focus is not trying harder. It is thinking about less."
    ],

    recovery: [
      "Your best performance is not the one where nothing goes wrong. It is the one where you know how to recover.",
      "Every acrobat falls. The good ones just get up faster.",
      "Falling is data, not failure. What did that one teach you?",
      "Wobble, fix, continue. That is a skill of its own, and judges can see it.",
      "You do not have to be perfect. You have to be able to keep going.",
      "Reset your feet, take one breath, and go again.",
      "A bad rep is one rep. It does not get to be the whole session.",
      "Shake it off literally. Loose arms, loose legs, fresh start."
    ],

    performance: [
      "Every great routine starts with one good landing.",
      "Perform to the back row. Chin up, chest proud, finish every shape.",
      "The routine is already in your body. Your only job is to let it out.",
      "Nerves and excitement feel exactly the same. Call it excitement.",
      "Finish every movement. The ending is the part people remember.",
      "Smile at the start. It tells your body that this is fun, not dangerous.",
      "You are not learning out there. You are showing what you already own.",
      "If something goes wrong, keep performing. Most people will never notice."
    ],

    confidence: [
      "Confidence comes from doing something hard and realizing you can do it.",
      "Confidence is just a memory of doing it before. Go make some memories.",
      "Stand like someone who has practised. Because you have.",
      "You are allowed to be proud of something you worked for.",
      "Talent gets you started. Showing up makes you good.",
      "Say 'not yet' instead of 'I can't'. It is more accurate.",
      "You do not need to be the best in the room to belong in the room.",
      "The voice that says you cannot do it has been wrong before."
    ],

    sportsmanship: [
      "Cheer the loudest for the girl trying the hardest thing.",
      "Somebody else being good takes nothing away from you.",
      "Say thank you to your coach. Say it to your spotter twice.",
      "Help the newest person. You were her three months ago.",
      "Win quietly, lose gracefully, train together.",
      "A team gets better at the speed of its kindest athlete.",
      "Clap when someone lands it. Clap louder when they finally land it.",
      "Be the teammate you would want on a hard day."
    ],

    creativity: [
      "Rules first, then play. You have to know the shapes to bend them.",
      "Two skills you already own can become a move nobody has seen.",
      "Your routine should look like you, not like a copy of someone else.",
      "Music tells you a story. Move like you heard it.",
      "Try it the weird way once. Weird sometimes wins.",
      "Leave one moment of stillness. Stillness is a move too.",
      "Choreography is just choosing on purpose.",
      "The best routines have a favourite part. Build yours one."
    ],

    mistakes: [
      "Don't chase perfection. Chase improvement.",
      "Missed one? Good. That means we picked the right difficulty.",
      "Mistakes are how the body asks a question. Answer it and go again.",
      "The athlete who falls most in practice usually falls least in the show.",
      "You are not behind. You are exactly where the work is.",
      "If it stops working, go smaller. Nail one clean rep and build back up.",
      "Nobody gets a standing ovation for the easy routine they were sure of.",
      "Let's change the strategy — not the goal."
    ]
  };

  var CATEGORY_LABELS = {
    courage: 'Courage', discipline: 'Discipline', balance: 'Balance',
    flexibility: 'Flexibility', strength: 'Strength', coordination: 'Coordination',
    patience: 'Patience', focus: 'Focus', recovery: 'Recovery',
    performance: 'Performance', confidence: 'Confidence',
    sportsmanship: 'Sportsmanship', creativity: 'Creativity',
    mistakes: 'Handling Mistakes'
  };

  /* ---------------------------------------------------------- reactions */
  /* Zuri responds to the run that just happened, not to nothing. */
  var REACTIONS = {
    greeting: [
      "There she is. Let's get to work.",
      "Welcome back, Acrobat. The mat missed you.",
      "Good to see you. What are we building today?",
      "Warm up first, then we play. You know the deal."
    ],
    returning: [
      "Welcome back, Acrobat! Straight back in, no lecture.",
      "However long it's been, the floor is exactly where you left it.",
      "You came back. That is the whole skill, honestly."
    ],
    missionStart: [
      "Eyes up. Let's see what you've got.",
      "You know this one. Trust the practice.",
      "Small and clean first. Big and clean after.",
      "Take your time getting set. Then commit."
    ],
    doingWell: [
      "THAT'S the movement I've been waiting to see!",
      "Yes! Lock that feeling in. That's the one.",
      "Beautiful. You just did that without thinking about it.",
      "Now you're moving like an acrobat instead of thinking like one.",
      "Clean, clean, clean. I could put that in a routine right now."
    ],
    onFire: [
      "Are you kidding me? That's competition-level consistency.",
      "This is the streak we're telling people about at dinner.",
      "You just made hard look easy. That's the whole job.",
      "Somebody's been practising. Don't stop."
    ],
    struggling: [
      "That's okay. Let's break it into smaller pieces.",
      "Breathe. Drop your shoulders. Find the beat again.",
      "This drill is supposed to be hard. You're exactly on schedule.",
      "Let's change the strategy — not your goal.",
      "Go smaller. One clean rep, then we build."
    ],
    comeback: [
      "THAT is a comeback. You struggled and then you solved it.",
      "You just improved on your own score. That's the real game.",
      "See? Same skill, different you. Ten minutes apart.",
      "That's what practice buys. Remember this feeling."
    ],
    success: [
      "You earned that one.",
      "Nothing lucky about that. That was practice.",
      "Textbook. Toes pointed, shape tight.",
      "Put that one in the trophy room."
    ],
    quitting: [
      "Sometimes the smartest move is taking a break. Come back ready.",
      "Good stopping point. Rest is training too.",
      "Go get some water. The floor will wait."
    ],
    newSkill: [
      "New skill unlocked. Let's learn it properly, from the start.",
      "Ooh, this one's fun. Watch me first, then you go.",
      "This is the skill everything else has been building toward."
    ],
    accolade: [
      "New accolade! You earned every bit of that.",
      "Trophy room's filling up nicely.",
      "That badge doesn't get handed out. It gets taken."
    ],
    levelUp: [
      "Rank up! Different level, same work ethic.",
      "Look at that. You're not the athlete who walked in here.",
      "New rank unlocked. The skills get better from here."
    ],
    /* Said whenever a coach-supervised skill comes up. Not optional. */
    supervised: [
      "Heads up — this is a coach-supervised skill. Learn it in the gym with your real coach, not on your own at home.",
      "This one needs a coach and a proper mat. We'll practise the shape here; you'll do the real thing at training.",
      "Rule of the Academy: anything upside down gets a real coach and a real spotter. Every time."
    ],
    /* Said before any at-home movement drill. */
    homeSafe: [
      "This one's safe to practise at home — clear some space and go.",
      "No mat needed for this. Just room to move and something soft under you.",
      "Home-friendly drill. Shoes off, space clear, water nearby."
    ]
  };


  /* ------------------------------------------------- coach personalities */
  /* Zuri is the default: warm, direct, a little dry. Rex is pure hype.
     Mira is quiet and precise. They share the Golden Nuggets — that is the
     curriculum — and differ in how they react to a run. */
  var PERSONALITIES = {
    zuri: {
      id: 'zuri', name: 'Coach Zuri', initial: 'Z', color: '#ff4f9a',
      style: 'Warm and direct', unlock: 0,
      blurb: 'Head coach. Encouraging, honest, and allergic to sloppy toes.',
      reactions: REACTIONS
    },
    rex: {
      id: 'rex', name: 'Coach Rex', initial: 'R', color: '#ff8b3d',
      style: 'High energy', unlock: 1200,
      blurb: 'Turns every session into a highlight reel. Loud, in a good way.',
      reactions: {
        greeting: ["LET'S GOOO! The floor is warm and so am I.",
                   "There she is! Right, what are we breaking today?",
                   "Suit up, superstar. Clock's running."],
        returning: ["SHE'S BACK! Nobody panic, the star has returned.",
                    "Look who walked in. Let's pick it right back up.",
                    "However long it's been — irrelevant. Go."],
        missionStart: ["Big energy. Let me see it.",
                       "This one's yours. Go take it.",
                       "Deep breath, then absolutely send it.",
                       "You've done the work. Now go collect."],
        doingWell: ["OH! Did everybody see that?!",
                    "THAT'S IT! Do it eleven more times!",
                    "Somebody call the judges, we've got a problem.",
                    "You're cooking! Don't you dare slow down.",
                    "Beautiful! Absolutely beautiful!"],
        onFire: ["UNBELIEVABLE! Are you even real right now?",
                 "Stop it. STOP IT. That's ridiculous.",
                 "I'm putting this on the wall. Highlight reel material.",
                 "This is the run people are going to talk about!"],
        struggling: ["Nope, shake it off, we go again. Right now.",
                     "That one didn't count. Next one does.",
                     "Smaller! Go smaller, nail one, then we build back up.",
                     "Hey. Breathe. You're closer than it feels."],
        comeback: ["THERE IT IS! From nowhere! That's a comeback!",
                   "You just beat yourself. That's the only opponent there is.",
                   "See?! Ten minutes ago that was impossible. Now look."],
        success: ["Money. Straight in the bank.",
                  "Clean! Absolutely clean.",
                  "You earned that one, no argument."],
        quitting: ["Good call. Legends rest too. Go refuel.",
                   "Alright, save some for tomorrow. Out you go."],
        newSkill: ["OOOH. New toy. You're gonna love this.",
                   "New skill unlocked! Watch me, then wreck it."],
        accolade: ["BADGE! Add it to the pile!",
                   "That's hardware. Well earned."],
        levelUp: ["RANK UP! Different league now.",
                  "Level up! You're not who walked in here."],
        supervised: ["Real talk for a second: this one needs a coach and a mat. " +
                     "We learn the shape here, you do the skill at the gym. No exceptions.",
                     "Hold up — coach-supervised skill. Big energy is great; big energy " +
                     "upside down without a spotter is not. Gym only."],
        homeSafe: ["Home-friendly! Clear the space and let's move.",
                   "You can smash this one in your living room. Go."]
      }
    },
    mira: {
      id: 'mira', name: 'Coach Mira', initial: 'M', color: '#4fd1ff',
      style: 'Calm and precise', unlock: 3200,
      blurb: 'Technical specialist. Quiet voice, very high standards.',
      reactions: {
        greeting: ["Good. Let's begin.",
                   "Shoes off, mind on. We'll start slowly.",
                   "Welcome back. One thing at a time today."],
        returning: ["You're here. That's the part that matters.",
                    "We pick up exactly where we stopped. Nothing is lost."],
        missionStart: ["Set your feet. Then decide to go.",
                       "One thought only. Pick it before you start.",
                       "Slowly. Precision first; speed will follow.",
                       "Look at where you want to finish."],
        doingWell: ["Yes. That shape was correct.",
                    "Good. Now repeat it exactly.",
                    "That is the version we keep.",
                    "Clean line. I could measure that one."],
        onFire: ["That is consistent work. Consistency is the rarest thing there is.",
                 "Six in a row at that standard. Remember what it felt like.",
                 "Nothing lucky about any of those. That is craft."],
        struggling: ["Stop. Reset. We will make it smaller.",
                     "Your body is asking a question. Let's answer it slowly.",
                     "This is the difficult part. It is supposed to be.",
                     "One clean repetition. That is the whole goal now."],
        comeback: ["You corrected it yourself. That is the skill I actually teach.",
                   "Better than last time, measurably. Note what changed.",
                   "You solved it. Remember how."],
        success: ["Correct.",
                  "Precisely that. Again.",
                  "Good. That one was earned."],
        quitting: ["Stopping well is also a skill. Go and rest.",
                   "Enough for today. Sleep is where the work sets."],
        newSkill: ["A new shape. We will learn it properly, from the beginning.",
                   "Watch first. Do not copy yet — watch."],
        accolade: ["Recorded. You met the standard.",
                   "That one required real work."],
        levelUp: ["A new level. The standard rises with it.",
                  "Rank up. Same principles, finer margins."],
        supervised: ["This is a coach-supervised skill. You will learn its shape and its " +
                     "timing here. You will learn the skill itself in the gym, with a coach " +
                     "and a mat. Those are different things.",
                     "Inverted work requires a spotter. Not sometimes — always."],
        homeSafe: ["Safe to practise at home. Clear the space first.",
                   "This one needs only room and attention."]
      }
    }
  };

  var activeCoach = 'zuri';

  /* --------------------------------------------------------- the picker */
  var bags = {}, lastSaid = {};

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function pick(pool, key) {
    if (!pool || !pool.length) return null;
    if (!bags[key] || !bags[key].length) {
      bags[key] = shuffle(pool.slice());
      /* avoid an immediate repeat across the refill boundary */
      if (bags[key].length > 1 && bags[key][bags[key].length - 1] === lastSaid[key]) {
        bags[key].unshift(bags[key].pop());
      }
    }
    var line = bags[key].pop();
    lastSaid[key] = line;
    return line;
  }

  /* Every wisdom line in one flat list, for the hub rotation. */
  var ALL_WISDOM = [];
  Object.keys(WISDOM).forEach(function (cat) {
    WISDOM[cat].forEach(function (line) {
      ALL_WISDOM.push({ text: line, category: cat, label: CATEGORY_LABELS[cat] });
    });
  });

  /* Which coaching theme fits a given training room. Lets a Balance Lab
     session pull balance wisdom rather than something generic. */
  var ROOM_THEME = {
    balance: 'balance', flexibility: 'flexibility', power: 'strength',
    coordination: 'coordination', rhythm: 'focus', tumbling: 'courage',
    choreography: 'creativity', performance: 'performance'
  };

  global.Coach = {
    name: 'Coach Zuri',
    initial: 'Z',
    color: '#ff4f9a',
    wisdom: WISDOM,
    categories: Object.keys(WISDOM),
    labels: CATEGORY_LABELS,
    reactions: REACTIONS,
    allWisdom: ALL_WISDOM,
    total: ALL_WISDOM.length,

    /* say('doingWell') -> a reaction line, in the active coach's voice */
    say: function (key) {
      var p = PERSONALITIES[activeCoach] || PERSONALITIES.zuri;
      var pool = p.reactions[key] || REACTIONS[key];
      return pick(pool, activeCoach + ':' + key);
    },

    personalities: PERSONALITIES,
    coaches: [PERSONALITIES.zuri, PERSONALITIES.rex, PERSONALITIES.mira],
    setCoach: function (id) {
      if (PERSONALITIES[id]) {
        activeCoach = id;
        this.name = PERSONALITIES[id].name;
        this.initial = PERSONALITIES[id].initial;
        this.color = PERSONALITIES[id].color;
      }
      return PERSONALITIES[activeCoach];
    },
    activeCoach: function () { return PERSONALITIES[activeCoach]; },

    /* nugget() -> any wisdom; nugget('balance') -> themed wisdom */
    nugget: function (category) {
      if (category && WISDOM[category]) return pick(WISDOM[category], 'w:' + category);
      var all = ALL_WISDOM.map(function (w) { return w.text; });
      return pick(all, 'w:all');
    },

    nuggetFor: function (roomId) {
      return this.nugget(ROOM_THEME[roomId] || null);
    },

    /* Adaptive: reads the run and answers it. `ratio` is 0..1 accuracy,
       `improved` is true when this beat her own previous best. */
    respondTo: function (ratio, improved, isFirstTry) {
      if (improved && ratio < 0.7) return pick(REACTIONS.comeback, 'r:comeback');
      if (ratio >= 0.92) return pick(REACTIONS.onFire, 'r:onFire');
      if (ratio >= 0.75) return pick(REACTIONS.doingWell, 'r:doingWell');
      if (ratio >= 0.5) return pick(REACTIONS.success, 'r:success');
      if (isFirstTry) return pick(REACTIONS.missionStart, 'r:missionStart');
      return pick(REACTIONS.struggling, 'r:struggling');
    }
  };
})(window);
