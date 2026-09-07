# 🤸‍♀️ ACROVERSE: Rise of the Acrobat

An acrobatics training adventure for a young gymnast — part sports game, part
rhythm game, part RPG, part virtual coach.

**Play it:** open `index.html` in any browser. No install, no build step, no server.

---

## Safety first — the design rule everything else bends around

This is a game for a nine-year-old who has just started acro, so it never
pretends an animation is permission to try something.

Every skill is classified:

| | |
|---|---|
| 🏠 **Safe at home** (16 skills) | balances, stretches, jumps, dance steps, body-weight strength |
| 🛡️ **Coach-supervised** (7 skills) | cartwheels, handstands, rolls, bridges, round-offs, walkovers, candlesticks |

A supervised mission **cannot be started** until the player reads the warning
and ticks an acknowledgement — the start button is disabled until she does.
The Tumbling Arena carries the label permanently, every skill chip shows its
tier, every supervised video carries a safety note, and the very first mission
in the game is a Science Corner lesson explaining the difference.

The game teaches shapes, timing and vocabulary. The skill itself belongs in the
gym, with a real coach and a real mat. Coach Zuri says so, repeatedly.

---

## What's in it

### 🏛️ The Academy
Seven story **districts** (Discovery → Control → Rhythm → Flight → Creation →
Performance → Championship) with **33 missions**, gated so each opens when the
last is finished. Plus eight **training rooms** for free practice: Balance Lab,
Flexibility Garden, Power Room, Coordination Zone, Rhythm Studio, Tumbling
Arena, Choreography Studio and Performance Arena.

### 🗣️ Three coaches, 242 lines
112 "Golden Nuggets" across the fourteen coaching themes — courage, discipline,
balance, flexibility, strength, coordination, patience, focus, recovery,
performance, confidence, sportsmanship, creativity and handling mistakes — plus
130 in-the-moment reactions.

Three personalities, unlocked by XP. The nuggets are the *curriculum* and belong
to all of them; what changes is how they react to a run:

| | | |
|---|---|---|
| **Coach Zuri** | Warm and direct | *"THAT'S the movement I've been waiting to see!"* |
| **Coach Rex** | High energy | *"Somebody call the judges, we've got a problem."* |
| **Coach Mira** | Calm and precise | *"Clean line. I could measure that one."* |

They adapt. Struggling gets *"Let's change the strategy — not your goal."* A
comeback gets *"You struggled and then you solved it."* A shuffled-bag picker
stops repetition. Every coach carries the coach-supervised warning — that one is
not optional, and a test asserts it.

### 🎮 Nine ways to play
Seven arcade mini-games — **Perfect Landing**, **Balance Beam**, **Memory
Routine**, **Mirror Master**, **Spin Doctor**, **Freeze Frame**, **Combo
Creator** — plus the rhythm drill engine and the Choreography Studio.

**No fail state anywhere.** Running out of time ends the round and scores what
you did. A weak run earns fewer stars and a coaching note, never a loss screen.

### 🏅 88 accolades, 10 ranks
Bronze → platinum across fourteen categories. Locked badges show live progress
(`7 / 10 cartwheels`) rather than a mystery box. Ranks run Rookie Acrobat →
Movement Explorer → Balance Builder → Skill Seeker → Acrobat Apprentice →
Rising Acrobat → Rhythm Artist → Performance Artist → Elite Acrobat → **Acro
Champion**.

### ✨ Star Sparks
Earned by practising, learning, improving and creating. Spent on leotards,
hairstyles, hair colours, celebration effects and trophy-room decorations —
37 items. **No loot boxes, no randomness, no real money, no pay-to-win.**
Cosmetics never touch scoring.

### 🎵 Eight original tracks, generated live
Hip-hop, R&B, funk, pop, cinematic, Afrobeat-inspired, electronic and trap —
**synthesised in the browser** from oscillators and noise. 808s with pitch
glide, trap hi-hat rolls, swung boom-bap, Rhodes-style sevenths, sidechain duck
on every kick.

No copyrighted music is used or needed. The arrangement also **thickens as she
plays better** — the lead line and extra percussion only enter above a combo
threshold, so a strong run literally sounds fuller.

This engine is also the game's **master clock**: notes are charted against beat
positions read from the audio, not a wall timer, so the chart cannot drift out
of sync. Measured drift across all eight tracks: ≤ 0.02 beats.

### 📺 Watch → Try → Reflect
24 real tutorials across 10 topics, each carrying full metadata: creator,
difficulty, duration, age range, educational purpose and a **safety note**.
Every video ends with a reflection question (*"What did the athlete do BEFORE
they started stretching?"*) that awards XP for thinking about it.

Cards load thumbnail-first, so no YouTube JavaScript runs until one is clicked.

### 🔬 Coach's Science Corner
Eight illustrated lessons that teach physics without saying "physics" — centre
of mass and base of support, absorbing force on landing, how body shape changes
rotation, momentum, why we warm up, and what nerves actually are. Each has an
animated canvas diagram instead of an equation.

### 🎬 The Championship ceremony
A performance ends with the full ceremony: the six judged categories
(Technique, Control, Timing, Musicality, Creativity, Consistency), then a
**cinematic replay** — letterboxed, camera pushing in, slow-motion on her best
moment — built from the sequence she *actually* landed, not a canned animation.
Then a **certificate** with her name, routine, score, rank and coach's
signature, drawn to canvas so it saves as a PNG or prints straight from a
`file://` page.

### 👪 Parent dashboard
Sessions, minutes, day streak, accolades, videos watched, questions answered,
science read, routines built, favourite rooms and most-practised skills — with
a prominent statement that this is a **motivation and learning tool, not an
assessment**, and does not replace a qualified coach.

### ♿ Accessibility
Reduce motion, larger text, captions, colour-blind mode (shapes as well as
colours), independent music/effects/voice toggles, music volume, and three
difficulty settings that widen or tighten timing windows without faking the
score. Auto-pauses when the tab is hidden.

---

## Controls

| | |
|---|---|
| **Rhythm drills** | `A` `S` `D` `F` or arrow keys — hold the long notes |
| **Mini-games** | `1` `2` `3` `4`, `←` `→`, `SPACE` |
| **Touch** | Four lane pads, or the mini-game pad row |
| **Pause** | `Esc`, or the button top-right |

---

## Project layout

```
index.html                 screens and markup
css/style.css              styling — tablet-first, 44px minimum touch targets
js/data/       skills · coach · videos · science · shop · rooms · districts
js/engine/     audio (synth + master clock) · character · stage · fx
js/systems/    profile (XP, sparks, accolades, quests) · missions
js/games/      rhythm (drills + performances) · minigames (seven arcade modes)
js/ui/app.js   screens, navigation, safety gate, game flow
test/          browser smoke test · audio verification · pose sheet
```

Plain scripts, no modules and no bundler — which is exactly why it runs from a
`file://` double-click as happily as from a web server. Adding a skill, a
mission, a video, a lesson, an accolade or a whole mini-game is a data change;
none of it requires touching the engine.

## Tests

All run against real Chromium via Playwright:

```bash
NODE_PATH=/opt/node22/lib/node_modules node test/smoke.js        # full playthrough
NODE_PATH=/opt/node22/lib/node_modules node test/audio-check.js  # synth + clock accuracy
NODE_PATH=/opt/node22/lib/node_modules node test/posesheet.js    # pose sheet for review
node -e "require('./test/harness.js').load()"                    # data layer under Node
```

The smoke test asserts, among other things, that a coach-supervised mission's
start button is **disabled before acknowledgement and enabled after** — that
check is the one that must never regress.

---

*Tutorial videos are hosted on YouTube by their respective creators and are
linked, not redistributed. All music and artwork are generated at runtime.
Progress is stored only in this browser and sent nowhere.*
