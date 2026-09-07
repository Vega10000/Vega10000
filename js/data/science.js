/* =========================================================================
   science.js — Coach Zuri's Science Corner.

   Short physics and body lessons, written so a nine-year-old learns why a
   skill works without noticing she is being taught physics. Each lesson has
   a `demo` key that the UI renders as a small animated diagram rather than
   an equation.

   The 'safety' lesson is not optional flavour — it is the first mission in
   the game, and it is what earns the right to show tumbling animations at
   all.
   ========================================================================= */

(function (global) {
  'use strict';

  var LESSONS = [
    {
      id: 'safety', icon: '🛡️', title: 'The First Rule Of The Academy',
      sub: 'Which skills you can practise alone, and which ones need a coach.',
      demo: 'safety',
      body: [
        "Some acro skills are completely safe to practise at home. Balances, stretches, " +
        "jumps, dance steps, squats, holds — if you have clear space and something soft " +
        "underneath, go for it.",
        "Other skills are not. Anything upside down, anything that lands on your hands, " +
        "anything that bends your back a long way. Cartwheels, handstands, rolls, bridges, " +
        "walkovers, round-offs. Those are COACH-SUPERVISED skills.",
        "That is not because you are not good enough. It is because those skills put weight " +
        "through your neck, wrists and back, and a coach knows how to catch you when it goes " +
        "wrong. Everyone gets it wrong sometimes. That is what a spotter is for.",
        "In Acroverse you will see supervised skills. You will learn their shapes, their " +
        "timing and their words, and that will make you faster at the gym. But watching an " +
        "animation is not the same as being spotted. Do the real thing at training."
      ],
      takeaway: "Home: balances, stretches, jumps, dance, strength. Gym: anything upside down."
    },
    {
      id: 'balancecom', icon: '⚖️', title: 'Why Do We Wobble?',
      sub: 'Centre of mass and base of support.',
      demo: 'com',
      body: [
        "Your body has an invisible balance point somewhere around your belly button. " +
        "Scientists call it your centre of mass. Think of it as the spot where all of you " +
        "averages out.",
        "The floor space between your feet is your base of support. Standing with feet apart? " +
        "Big base. Standing on one toe? Tiny base.",
        "Here is the whole secret: you stay balanced as long as your centre of mass stays " +
        "over your base of support. The moment it drifts outside, gravity wins and you step out.",
        "So when you wobble, you are not failing. You are making tiny corrections to drag your " +
        "centre of mass back over your base. That is a skill, and it gets better with practice."
      ],
      takeaway: "Balance point over foot space = balanced. Outside it = stepping out."
    },
    {
      id: 'landing', icon: '🛬', title: 'Why Do We Bend Our Knees When We Land?',
      sub: 'Spreading a force over more time.',
      demo: 'landing',
      body: [
        "Drop an egg onto a table and it cracks. Drop the same egg onto a cushion and it " +
        "survives. Same egg, same height — so what changed?",
        "Time. The cushion squashes, which means the egg slows down over a longer moment. " +
        "The same amount of stopping gets spread out, so less force hits at once.",
        "Your knees are the cushion. When you land and bend, you turn a sudden stop into a " +
        "slow one. Land with straight legs and all of it arrives instantly, through your joints.",
        "That is also why a good landing is a quiet landing. Noise is energy that did not get " +
        "absorbed. Listen to yourself land — quiet means you did it right."
      ],
      takeaway: "Bend to land. Longer stop = smaller force. Quiet landings are safe landings."
    },
    {
      id: 'rotation', icon: '🌀', title: 'Why Does Tucking Make You Spin Faster?',
      sub: 'How body shape changes rotation.',
      demo: 'rotation',
      body: [
        "Watch an ice skater spin. Arms out — slow. Arms pulled in tight — suddenly fast. " +
        "They did not push off again. They just changed shape.",
        "When your weight is far from the middle of the spin, turning is slow and heavy. " +
        "Pull everything close to the centre and the same spin speeds up, for free.",
        "That is exactly why coaches shout TIGHT TUCK. A tight tuck brings your knees and " +
        "arms close to your middle, so you rotate faster and get all the way around.",
        "It also works backwards. Open out of a shape and you slow down — which is how " +
        "gymnasts control when to stop rotating and land."
      ],
      takeaway: "Tight = fast spin. Open = slow spin. You control rotation with your shape."
    },
    {
      id: 'core', icon: '🧱', title: 'Why Coaches Are Obsessed With Your Middle',
      sub: 'The core connects everything.',
      demo: 'core',
      body: [
        "Try this: stand up and lift one leg to the front. Now do it again, but let your " +
        "belly go completely floppy. Much harder, isn't it?",
        "Your core is the bridge between your top half and your bottom half. If the bridge " +
        "is loose, power from your legs leaks away before it reaches your arms.",
        "That is why hollow and arch holds are in every gymnastics warm-up on earth. They are " +
        "not exciting. They are the reason the exciting things work.",
        "A tight middle also holds your shape in the air. Floppy bodies bend in flight, and " +
        "a bent body does not rotate the way you planned."
      ],
      takeaway: "Your core is the boss of your body. Tight middle = shapes that hold."
    },
    {
      id: 'momentum', icon: '🚀', title: 'Where Does The Power Come From?',
      sub: 'Momentum, and pushing the floor.',
      demo: 'momentum',
      body: [
        "When you push the floor, the floor pushes you back — exactly as hard. That push " +
        "back is the only reason you go anywhere.",
        "So a bigger, faster push means a bigger jump. Not a longer push with floppy legs — " +
        "a sharp, strong one through the whole foot.",
        "A run-in adds to it. The speed you build running is momentum, and a good take-off " +
        "turns some of that forward speed into upward height.",
        "This is why coaches care so much about your last three steps. Waste them and there " +
        "is nothing to convert."
      ],
      takeaway: "Push the floor hard, the floor pushes back. Speed in, height out."
    },
    {
      id: 'warmup', icon: '🔥', title: 'What Actually Happens When You Warm Up?',
      sub: 'Why we never start cold.',
      demo: 'warmup',
      body: [
        "Cold muscle is stiff, like a rubber band left in the fridge. Warm muscle stretches " +
        "and springs back.",
        "Moving around raises your body temperature and sends more blood to your muscles. " +
        "Everything gets a bit more stretchy and a lot more responsive.",
        "Warming up also wakes up your brain's map of your body, so your coordination is " +
        "sharper. That is why your first cartwheel of the day feels clumsier than your fifth.",
        "That is the whole reason a warm-up comes first, every session, forever. It is not " +
        "a rule someone invented to be annoying."
      ],
      takeaway: "Warm muscles stretch and spring. Cold ones just complain."
    },
    {
      id: 'nerves', icon: '🦋', title: 'Butterflies Before You Perform',
      sub: 'What nerves actually are.',
      demo: 'nerves',
      body: [
        "Before a performance your heart speeds up, your hands get cold and your tummy feels " +
        "strange. Your body is getting ready to do something big.",
        "Here is the interesting part: excitement and nervousness produce almost exactly the " +
        "same feelings in your body. The difference is the word you put on it.",
        "Athletes who tell themselves 'I am excited' usually perform better than athletes who " +
        "tell themselves 'I am nervous' — even though their bodies are doing the same thing.",
        "So take one slow breath out, stand tall, and call it excitement. Then go and show " +
        "everyone what you practised."
      ],
      takeaway: "Nerves and excitement feel the same. You get to choose which one it is."
    }
  ];

  var BY_ID = {};
  LESSONS.forEach(function (l) { BY_ID[l.id] = l; });

  global.Science = {
    list: LESSONS,
    byId: function (id) { return BY_ID[id]; },
    count: LESSONS.length
  };
})(window);
