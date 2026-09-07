/* =========================================================================
   skills.js — the acrobatic skill library.

   Every skill carries three things:
     1. Coaching data  (cue, description, difficulty) -> used by Coach Nova
     2. A pose clip    (keyframed joint angles)       -> used by character.js
     3. A lane binding (which key plays it)           -> used by game.js

   POSE CONVENTION
   ---------------
   All joint angles are ABSOLUTE, in degrees, in body space, using canvas
   orientation (y grows downward). So:
        -90 = pointing straight UP        90 = pointing straight DOWN
          0 = pointing RIGHT             180 = pointing LEFT
   `rot` then spins the entire body about the pelvis, which is what lets a
   cartwheel or a roll reuse the exact same limb poses as a static shape.
   ========================================================================= */

(function (global) {
  'use strict';

  /* ---- pose helper -------------------------------------------------------
     P() builds a full pose from a sparse object so keyframes stay readable.
     Defaults describe a neutral stand: spine up, arms at sides, legs down. */
  var NEUTRAL = {
    rot: 0,        // whole-body rotation (deg)
    x: 0,          // pelvis offset from stage anchor (body units)
    y: 0,          // pelvis vertical offset; negative = airborne
    spine: -90,    // pelvis -> chest
    neck: -90,     // chest -> head
    armLA: 104, armLB: 99,   // left  shoulder->elbow, elbow->hand
    armRA: 76,  armRB: 81,   // right shoulder->elbow, elbow->hand
    legLA: 96,  legLB: 93,   // left  hip->knee, knee->foot
    legRA: 84,  legRB: 87,   // right hip->knee, knee->foot
    footL: 0,   footR: 0,    // foot/toe point relative to shin
    squash: 1                // vertical scale, for landings & takeoffs
  };

  function P(over) {
    var p = {}, k;
    for (k in NEUTRAL) { if (NEUTRAL.hasOwnProperty(k)) p[k] = NEUTRAL[k]; }
    if (over) { for (k in over) { if (over.hasOwnProperty(k)) p[k] = over[k]; } }
    return p;
  }

  /* Common shapes reused across skills — these are the real positions a coach
     drills over and over, so they earn their own names. */
  var SHAPES = {
    stand:   P(),
    ready:   P({ armLA: 250, armLB: 258, armRA: 290, armRB: 282 }), // arms up in "V"
    crouch:  P({ y: 14, legLA: 118, legLB: 52, legRA: 62, legRB: 128,
                 spine: -78, armLA: 150, armLB: 170, armRA: 30, armRB: 10, squash: 0.9 }),
    tuck:    P({ y: -46, legLA: -132, legLB: 42, legRA: -48, legRB: 138,
                 armLA: 158, armLB: 178, armRA: 22, armRB: 2, spine: -86 }),
    straddle:P({ y: -44, legLA: 196, legLB: 194, legRA: -16, legRB: -14,
                 armLA: 205, armLB: 200, armRA: -25, armRB: -20, spine: -88 }),
    pike:    P({ y: -44, legLA: -14, legLB: -12, legRA: -4, legRB: -2,
                 armLA: -34, armLB: -22, armRA: -18, armRB: -8,
                 spine: -122, neck: -104 }),
    hollow:  P({ rot: -90, y: 46, spine: -100, neck: -104,
                 legLA: 78, legLB: 80, legRA: 82, legRB: 84,
                 armLA: 262, armLB: 264, armRA: 266, armRB: 268 }),
    arch:    P({ rot: 90, y: 46, spine: -78, neck: -70,
                 legLA: 104, legLB: 108, legRA: 100, legRB: 104,
                 armLA: 278, armLB: 276, armRA: 274, armRB: 272 }),
    handstand: P({ rot: 180, spine: -90, neck: -90,
                 legLA: 91, legLB: 90, legRA: 89, legRB: 90,
                 armLA: 268, armLB: 270, armRA: 272, armRB: 270 }),
    bridge:  P({ y: 26, spine: -34, neck: -6,
                 legLA: 128, legLB: 66, legRA: 122, legRB: 72,
                 armLA: 226, armLB: 274, armRA: 236, armRB: 278 }),
    split:   P({ y: 50, spine: -90, neck: -90,
                 legLA: 6, legLB: 4, legRA: 174, legRB: 176,
                 footL: 60, footR: 60,
                 armLA: 250, armLB: 256, armRA: 290, armRB: 284 }),
    leap:    P({ y: -52, spine: -92, neck: -92,
                 legLA: 14, legLB: 10, legRA: 166, legRB: 170,
                 footL: 64, footR: 64,
                 armLA: 196, armLB: 200, armRA: 344, armRB: 340 }),
    passe:   P({ spine: -92, neck: -92,
                 legLA: 88, legLB: 88, legRA: 128, legRB: 40,
                 armLA: 250, armLB: 254, armRA: 290, armRB: 286 }),
    releve:  P({ y: -6, spine: -92, neck: -92,
                 legLA: 90, legLB: 90, legRA: 90, legRB: 90,
                 footL: 62, footR: 62,
                 armLA: 248, armLB: 252, armRA: 292, armRB: 288 }),
    candle:  P({ rot: 180, y: 6, spine: -96, neck: -70,
                 legLA: 92, legLB: 91, legRA: 88, legRB: 89,
                 armLA: 226, armLB: 214, armRA: 314, armRB: 326 }),
    land:    P({ y: 10, legLA: 106, legLB: 68, legRA: 74, legRB: 112,
                 spine: -84, armLA: 196, armLB: 204, armRA: 344, armRB: 336,
                 squash: 0.93 })
  };

  /* A clip is a list of {t, pose} keyframes with t in 0..1 of the skill's
     duration. character.js eases between them. */
  function clip() {
    var frames = [], i;
    for (i = 0; i < arguments.length; i += 2) {
      frames.push({ t: arguments[i], pose: arguments[i + 1] });
    }
    return frames;
  }

  /* Rolling / travelling skills spin `rot` through a full turn. Building them
     from the neutral shapes keeps the silhouette consistent mid-rotation. */
  function spun(base, deg, extra) {
    var p = P(base), k;
    p.rot = deg;
    if (extra) { for (k in extra) { if (extra.hasOwnProperty(k)) p[k] = extra[k]; } }
    return p;
  }

  var SKILLS = [
    /* ---------------------------------------------------------- shapes --- */
    {
      id: 'tuck', tier: 'home', room: 'power', science: 'landing', name: 'Tuck Jump', short: 'TUCK', lane: 0, type: 'tap',
      level: 1, family: 'Shapes', color: '#ff5fa2', dur: 0.62,
      cue: 'Knees to your chest, not chest to your knees.',
      desc: 'Jump straight up, snap both knees to your chest, then open and land soft.',
      teach: 'The tuck is the first shape every acro athlete owns. Tight tuck = fast rotation later.',
      video: 'conditioning',
      clip: clip(
        0.00, SHAPES.stand, 0.18, SHAPES.crouch, 0.30, P({ y: -30, spine: -90 }),
        0.52, SHAPES.tuck, 0.76, P({ y: -18 }), 0.90, SHAPES.land, 1.00, SHAPES.stand
      )
    },
    {
      id: 'straddle', tier: 'home', room: 'power', science: 'landing', name: 'Straddle Jump', short: 'STRAD', lane: 1, type: 'tap',
      level: 1, family: 'Shapes', color: '#ffb648', dur: 0.66,
      cue: 'Toes pointed, legs straight — reach for your toes at the top.',
      desc: 'Jump and open both legs wide to the side, arms reaching to meet them.',
      teach: 'Straddle teaches you to open fast and close faster. That is what a split leap needs.',
      video: 'conditioning',
      clip: clip(
        0.00, SHAPES.stand, 0.18, SHAPES.crouch, 0.32, P({ y: -30 }),
        0.54, SHAPES.straddle, 0.78, P({ y: -16 }), 0.92, SHAPES.land, 1.00, SHAPES.stand
      )
    },
    {
      id: 'pike', tier: 'home', room: 'power', science: 'momentum', name: 'Pike Jump', short: 'PIKE', lane: 2, type: 'tap',
      level: 2, family: 'Shapes', color: '#4fd1ff', dur: 0.66,
      cue: 'Legs together and locked. Fold at the hips, not the knees.',
      desc: 'Jump and lift both straight legs to the front while you reach past your toes.',
      teach: 'A pike is a hinge. If your knees bend, you are cheating the fold.',
      video: 'conditioning',
      clip: clip(
        0.00, SHAPES.stand, 0.18, SHAPES.crouch, 0.32, P({ y: -30 }),
        0.54, SHAPES.pike, 0.78, P({ y: -16 }), 0.92, SHAPES.land, 1.00, SHAPES.stand
      )
    },
    {
      id: 'leap', tier: 'home', room: 'rhythm', science: 'momentum', name: 'Split Leap', short: 'LEAP', lane: 3, type: 'tap',
      level: 3, family: 'Shapes', color: '#c17bff', dur: 0.78,
      cue: 'Front leg leads, back leg finishes. Split in the air, not on the way down.',
      desc: 'Run-in step, then leap and split both legs front-to-back at the peak.',
      teach: 'Your leap is only as big as your split on the floor. Flexibility first, height second.',
      video: 'flexibility',
      clip: clip(
        0.00, SHAPES.stand, 0.14, SHAPES.crouch, 0.30, P({ y: -34, x: 8 }),
        0.52, spun(SHAPES.leap, 0, { x: 16 }), 0.74, P({ y: -22, x: 24, legLA: 40, legRA: 140 }),
        0.90, spun(SHAPES.land, 0, { x: 30 }), 1.00, spun(SHAPES.stand, 0, { x: 30 })
      )
    },

    /* --------------------------------------------------------- balance --- */
    {
      id: 'releve', tier: 'home', room: 'balance', science: 'balancecom', name: 'Relevé Balance', short: 'HOLD', lane: 0, type: 'hold',
      level: 1, family: 'Balance', color: '#7dffb8', dur: 1.0,
      cue: 'Eyes on one spot. Your body follows your eyes.',
      desc: 'Rise onto the balls of your feet, squeeze everything, and hold still.',
      teach: 'Balance is not standing still — it is a thousand tiny corrections you learn to make quietly.',
      video: 'balance',
      clip: clip(0.00, SHAPES.stand, 0.22, SHAPES.releve, 1.00, SHAPES.releve)
    },
    {
      id: 'passe', tier: 'home', room: 'balance', science: 'balancecom', name: 'Passé Hold', short: 'PASSÉ', lane: 1, type: 'hold',
      level: 2, family: 'Balance', color: '#7dffb8', dur: 1.0,
      cue: 'Knee out to the side, toe on the knee, hips square to the front.',
      desc: 'Stand tall on one leg with the other foot pointed at your knee.',
      teach: 'Square hips are the whole skill. If a hip opens, the balance is already gone.',
      video: 'balance',
      clip: clip(0.00, SHAPES.stand, 0.24, SHAPES.passe, 1.00, SHAPES.passe)
    },
    {
      id: 'handstand', tier: 'gym', room: 'tumbling', science: 'balancecom', name: 'Handstand Hold', short: 'H-STAND', lane: 2, type: 'hold',
      level: 3, family: 'Balance', color: '#4fd1ff', dur: 1.0,
      cue: 'Look at your hands. Push the floor away through your shoulders.',
      desc: 'Kick to vertical, stack shoulders over hands, squeeze legs into one line.',
      teach: 'Every single tumbling pass runs through a handstand. Own this one and the rest gets easier.',
      video: 'handstand',
      clip: clip(
        0.00, SHAPES.stand, 0.14, P({ spine: -60, armLA: 232, armRA: 256, y: 6 }),
        0.34, spun(SHAPES.handstand, 150, { legLA: 108, legRA: 70 }),
        0.50, SHAPES.handstand, 1.00, SHAPES.handstand
      )
    },
    {
      id: 'candle', tier: 'gym', room: 'tumbling', science: 'rotation', name: 'Candlestick', short: 'CANDLE', lane: 3, type: 'hold',
      level: 1, family: 'Balance', color: '#7dffb8', dur: 1.0,
      cue: 'Weight on your shoulders, never on your neck.',
      desc: 'Roll onto your upper back and press both legs straight up to the ceiling.',
      teach: 'The candlestick is the safe way to learn being upside down. Shoulders, not neck. Always.',
      video: 'rolls',
      clip: clip(
        0.00, SHAPES.stand, 0.20, SHAPES.crouch, 0.44, spun(SHAPES.candle, 150),
        0.62, SHAPES.candle, 1.00, SHAPES.candle
      )
    },

    /* ------------------------------------------------------ flexibility --- */
    {
      id: 'hollow', tier: 'home', room: 'power', science: 'core', name: 'Hollow Hold', short: 'HOLLOW', lane: 0, type: 'hold',
      level: 1, family: 'Strength', color: '#ffb648', dur: 1.0,
      cue: 'Low back glued to the floor. If it lifts, bring your legs higher.',
      desc: 'Lie on your back, press your ribs down, and float arms and legs off the floor.',
      teach: 'Hollow body is the shape of every flip you will ever do. Coaches love it for a reason.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand, 0.26, SHAPES.crouch, 0.50, SHAPES.hollow, 1.00, SHAPES.hollow)
    },
    {
      id: 'arch', tier: 'home', room: 'power', science: 'core', name: 'Arch Hold', short: 'ARCH', lane: 1, type: 'hold',
      level: 1, family: 'Strength', color: '#ffb648', dur: 1.0,
      cue: 'Squeeze your legs together and lift from your upper back.',
      desc: 'Lie on your front and lift chest, arms and legs into a banana shape.',
      teach: 'Hollow and arch are opposites, and you need both. Strong back, strong walkover.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand, 0.26, SHAPES.crouch, 0.50, SHAPES.arch, 1.00, SHAPES.arch)
    },
    {
      id: 'bridge', tier: 'gym', room: 'flexibility', science: 'warmup', name: 'Bridge', short: 'BRIDGE', lane: 2, type: 'hold',
      level: 2, family: 'Flexibility', color: '#ff5fa2', dur: 1.0,
      cue: 'Push your shoulders past your hands. Straight arms, straight legs.',
      desc: 'From your back, press up onto hands and feet into a tall arch.',
      teach: 'A bridge that opens the shoulders is worth ten that only bend the low back.',
      video: 'bridge',
      clip: clip(
        0.00, SHAPES.stand, 0.24, SHAPES.crouch, 0.40, P({ y: 30, spine: -20, rot: 30 }),
        0.62, SHAPES.bridge, 1.00, SHAPES.bridge
      )
    },
    {
      id: 'split', tier: 'home', room: 'flexibility', science: 'warmup', name: 'Split Hold', short: 'SPLIT', lane: 3, type: 'hold',
      level: 2, family: 'Flexibility', color: '#c17bff', dur: 1.0,
      cue: 'Hips square, back leg turned down, breathe out as you sink.',
      desc: 'Slide the front leg forward and the back leg behind until you sit flat.',
      teach: 'Flexibility is built in the boring minutes, not the exciting ones. Ten minutes a day beats an hour on Saturday.',
      video: 'flexibility',
      clip: clip(0.00, SHAPES.stand, 0.28, SHAPES.crouch, 0.56, SHAPES.split, 1.00, SHAPES.split)
    },

    /* ---------------------------------------------------------- tumbling --- */
    {
      id: 'fwdroll', tier: 'gym', room: 'tumbling', science: 'rotation', name: 'Forward Roll', short: 'ROLL', lane: 0, type: 'tap',
      level: 1, family: 'Tumbling', color: '#4fd1ff', dur: 0.86,
      cue: 'Chin to chest and look at your belly button. Round like a ball.',
      desc: 'Squat, tuck your head under, and roll along your upper back to your feet.',
      teach: 'Never put the top of your head down. Round backs roll — flat backs thud.',
      video: 'rolls',
      clip: clip(
        0.00, SHAPES.stand, 0.16, SHAPES.crouch,
        0.34, spun(SHAPES.tuck, 110, { y: 22, x: 6 }),
        0.54, spun(SHAPES.tuck, 240, { y: 24, x: 16 }),
        0.72, spun(SHAPES.tuck, 350, { y: 16, x: 24 }),
        0.88, spun(SHAPES.land, 360, { x: 30 }), 1.00, spun(SHAPES.stand, 360, { x: 30 })
      )
    },
    {
      id: 'cartwheel', tier: 'gym', room: 'tumbling', science: 'rotation', name: 'Cartwheel', short: 'WHEEL', lane: 1, type: 'tap',
      level: 2, family: 'Tumbling', color: '#ffb648', dur: 0.92,
      cue: 'Hand, hand, foot, foot — in a straight line, like a wheel on a track.',
      desc: 'Reach sideways, place one hand then the other, kick over through a straddle, land one foot at a time.',
      teach: 'Say it out loud while you do it: hand, hand, foot, foot. Rhythm beats strength here.',
      video: 'cartwheel',
      clip: clip(
        0.00, SHAPES.stand, 0.12, P({ armLA: 236, armRA: 300, spine: -96 }),
        0.30, spun(SHAPES.straddle, 92, { y: 6, x: 8 }),
        0.50, spun(SHAPES.straddle, 178, { y: 0, x: 18 }),
        0.70, spun(SHAPES.straddle, 268, { y: 6, x: 28 }),
        0.88, spun(SHAPES.land, 360, { x: 36 }), 1.00, spun(SHAPES.ready, 360, { x: 36 })
      )
    },
    {
      id: 'roundoff', tier: 'gym', room: 'tumbling', science: 'momentum', name: 'Round-Off', short: 'R-OFF', lane: 2, type: 'tap',
      level: 4, family: 'Tumbling', color: '#ff5fa2', dur: 0.94,
      cue: 'Cartwheel in, snap both feet together, finish facing where you started.',
      desc: 'A cartwheel with a quarter turn — legs snap together and you rebound onto two feet.',
      teach: 'The round-off is the engine of every tumbling pass. Fast snap, tight body, punch the floor.',
      video: 'performance',
      clip: clip(
        0.00, SHAPES.stand, 0.10, P({ armLA: 240, armRA: 300, x: 4 }),
        0.26, spun(SHAPES.straddle, 96, { y: 4, x: 12 }),
        0.46, spun(SHAPES.handstand, 176, { x: 22, legLA: 96, legRA: 84 }),
        0.64, spun(SHAPES.handstand, 250, { x: 30 }),
        0.80, spun(SHAPES.land, 356, { x: 38, y: 4 }),
        0.90, spun(SHAPES.ready, 360, { x: 40, y: -18 }),
        1.00, spun(SHAPES.ready, 360, { x: 40 })
      )
    },
    {
      id: 'walkover', tier: 'gym', room: 'tumbling', science: 'rotation', name: 'Back Walkover', short: 'WALKOVER', lane: 3, type: 'tap',
      level: 5, family: 'Tumbling', color: '#c17bff', dur: 1.05,
      cue: 'Reach back for the floor with straight arms — do not sit down into it.',
      desc: 'Arms up, reach back into a bridge over one leg, and kick over to standing.',
      teach: 'A back walkover is a moving bridge. If your bridge is not comfortable, build that first.',
      video: 'bridge',
      clip: clip(
        0.00, SHAPES.ready, 0.14, P({ spine: -104, armLA: 256, armRA: 286, legRA: 60, legRB: 62 }),
        0.34, spun(SHAPES.bridge, -26, { legRA: 30, legRB: 28, y: 8 }),
        0.52, spun(SHAPES.handstand, 194, { legLA: 130, legRA: 52 }),
        0.72, spun(SHAPES.handstand, 250, { legLA: 140, legRA: 44 }),
        0.90, spun(SHAPES.land, 360, { x: -18 }), 1.00, spun(SHAPES.ready, 360, { x: -18 })
      )
    }
  ];


  /* ---- home-safe movement skills, added for Acroverse ------------------ */
  var EXTRA = [
    {
      id: 'squat', tier: 'home', room: 'power', science: 'landing',
      name: 'Acro Squat', short: 'SQUAT', lane: 0, type: 'tap',
      level: 1, family: 'Strength', color: '#ffb648', dur: 0.70,
      cue: 'Chest tall, knees tracking over your toes, weight in your heels.',
      desc: 'Sit down and stand up with control. The foundation of every jump you will ever do.',
      teach: 'A jump is just a fast squat. Build the slow one first and the fast one arrives free.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand, 0.34, SHAPES.crouch, 0.70, SHAPES.crouch,
                 0.92, SHAPES.stand, 1.00, SHAPES.stand)
    },
    {
      id: 'lunge', tier: 'home', room: 'power', science: 'balancecom',
      name: 'Lunge Hold', short: 'LUNGE', lane: 1, type: 'hold',
      level: 1, family: 'Strength', color: '#ff8b3d', dur: 1.0,
      cue: 'Front knee over your ankle, back knee soft, hips square to the front.',
      desc: 'Step forward and sink until both knees make right angles, then hold it steady.',
      teach: 'Lunges teach one leg to work alone. Every leap and every landing is a one-leg problem.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand,
                 0.34, P({ y: 16, x: 6, legLA: 122, legLB: 74, legRA: 58, legRB: 118,
                           spine: -92, armLA: 176, armLB: 180, armRA: 4, armRB: 0 }),
                 1.00, P({ y: 16, x: 6, legLA: 122, legLB: 74, legRA: 58, legRB: 118,
                           spine: -92, armLA: 176, armLB: 180, armRA: 4, armRB: 0 }))
    },
    {
      id: 'heelraise', tier: 'home', room: 'power', science: 'landing',
      name: 'Heel Raises', short: 'HEELS', lane: 2, type: 'tap',
      level: 1, family: 'Strength', color: '#7dffb8', dur: 0.55,
      cue: 'All the way up onto your toes, then all the way down. Slowly.',
      desc: 'Rise onto the balls of both feet and lower with control.',
      teach: 'Strong ankles are how you land quietly. Quiet landings are safe landings.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand, 0.42, SHAPES.releve, 0.80, SHAPES.releve, 1.00, SHAPES.stand)
    },
    {
      id: 'jumpland', tier: 'home', room: 'power', science: 'landing',
      name: 'Stick The Landing', short: 'STICK', lane: 3, type: 'tap',
      level: 2, family: 'Strength', color: '#4fd1ff', dur: 0.72,
      cue: 'Land toes first, then heels, and bend your knees to soak it up.',
      desc: 'Jump straight up and absorb the landing quietly, then freeze.',
      teach: 'Bending your knees spreads the landing over more time, so less force hits you at once.',
      video: 'conditioning',
      clip: clip(0.00, SHAPES.stand, 0.20, SHAPES.crouch, 0.42, P({ y: -34, spine: -90 }),
                 0.68, P({ y: -14 }), 0.82, SHAPES.land, 1.00, SHAPES.stand)
    },
    {
      id: 'chasse', tier: 'home', room: 'rhythm', science: 'momentum',
      name: 'Chassé', short: 'CHASSÉ', lane: 0, type: 'tap',
      level: 1, family: 'Dance', color: '#c17bff', dur: 0.66,
      cue: 'Step, close, step. Let your feet chase each other across the floor.',
      desc: 'A travelling dance step: one foot chases the other, with a light lift between.',
      teach: 'Chassé is how you get to the skill. A good run-in is half of a good leap.',
      video: 'rhythmdance',
      clip: clip(0.00, SHAPES.stand,
                 0.26, P({ x: 8, y: -12, legLA: 68, legLB: 66, legRA: 108, legRB: 110,
                           armLA: 196, armRA: 344 }),
                 0.52, P({ x: 18, y: -18, legLA: 60, legLB: 58, legRA: 116, legRB: 118,
                           armLA: 200, armRA: 340 }),
                 0.80, P({ x: 26, y: 4, legLA: 96, legRA: 84, armLA: 190, armRA: 350 }),
                 1.00, P({ x: 26 }))
    },
    {
      id: 'spotturn', tier: 'home', room: 'coordination', science: 'rotation',
      name: 'Spotting Turn', short: 'TURN', lane: 1, type: 'tap',
      level: 2, family: 'Dance', color: '#ff5fa2', dur: 0.80,
      cue: 'Eyes stay on your spot as long as possible, then whip your head around fast.',
      desc: 'Turn all the way around while your eyes hold one spot, then snap the head to find it again.',
      teach: 'Spotting is why dancers do not get dizzy. Your head arrives last and leaves first.',
      video: 'rhythmdance',
      clip: clip(0.00, SHAPES.stand,
                 0.20, P({ neck: -70, armLA: 176, armLB: 180, armRA: 4, armRB: 0 }),
                 0.55, P({ rot: 180, neck: -110, armLA: 168, armLB: 172, armRA: 12, armRB: 8,
                           footL: 40, footR: 40, y: -4 }),
                 0.88, P({ rot: 360, neck: -90, armLA: 176, armLB: 180, armRA: 4, armRB: 0 }),
                 1.00, P({ rot: 360 }))
    },
    {
      id: 'armframe', tier: 'home', room: 'rhythm', science: 'core',
      name: 'Arm Frame', short: 'FRAME', lane: 2, type: 'hold',
      level: 1, family: 'Dance', color: '#ffc84a', dur: 1.0,
      cue: 'Long arms, soft elbows, fingers finished. Frame the shape you are making.',
      desc: 'Hold a clean high arm position — the finish that turns a movement into a performance.',
      teach: 'Judges look at your hands. Finished arms make an ordinary skill look expensive.',
      video: 'rhythmdance',
      clip: clip(0.00, SHAPES.stand, 0.30, SHAPES.ready, 1.00, SHAPES.ready)
    }
  ];
  EXTRA.forEach(function (s) { SKILLS.push(s); });

  /* Index by id for fast lookup, and expose the shape table for the pose
     previews used on the practice screens. */
  var BY_ID = {};
  SKILLS.forEach(function (s) { BY_ID[s.id] = s; });

  global.AcroSkills = {
    list: SKILLS,
    byId: function (id) { return BY_ID[id]; },
    shapes: SHAPES,
    pose: P,
    NEUTRAL: NEUTRAL,
    families: ['Shapes', 'Balance', 'Strength', 'Flexibility', 'Tumbling', 'Dance'],
    TIERS: {
      home: {
        label: 'Safe at home',
        icon: '🏠',
        note: 'Clear some space, move anything you could bump into, and go.'
      },
      gym: {
        label: 'Coach-supervised',
        icon: '🛡️',
        note: 'Practise this one at the gym with your real coach and a proper mat — ' +
              'never alone at home. Watching an animation is not the same as being spotted.'
      }
    },
    byTier: function (t) {
      return SKILLS.filter(function (s) { return s.tier === t; });
    },
    byRoom: function (r) {
      return SKILLS.filter(function (s) { return s.room === r; });
    }
  };
})(window);
