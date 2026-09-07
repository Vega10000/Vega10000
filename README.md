# 🤸‍♀️ Acro Academy

A rhythm-based acrobatics training game for a young gymnast who has just started acro.
Coach Nova calls out real technique cues, the drills build in the order a beginner class
actually moves, and every skill links out to a real video tutorial.

**Play it:** open `index.html` in any browser. No install, no build step, no server needed.

---

## What's in it

### 🎯 Drills that follow a real progression
Seven training zones, unlocked by stars so the hard tumbling can't be skipped:

| Zone | Focus | Unlocks at |
|---|---|---|
| 🔥 Warm-Up Zone | Stretch and hold shapes | Start |
| ⭐ Shapes Lab | Tuck, straddle, pike | 1 ★ |
| 💪 Strength Studio | Hollow, arch, candlestick | 3 ★ |
| 🕊️ Balance Bay | Relevé, passé, handstand | 6 ★ |
| 🌉 Flex & Bridge Studio | Bridge, splits | 9 ★ |
| 🌀 Tumble Track | Rolls, cartwheels, round-offs | 12 ★ |
| 🎪 The Showcase | The full performance routine | 15 ★ |

Plus a **Skill Drills** page for every one of the 16 skills — an animated looping
breakdown, the coaching cue, and a link to the tutorials for that skill.

### 🗣️ Coach Nova
104 written lines across two registers — real technique correction
("*Hand, hand, foot, foot — in one straight line*") and how-to-practise mindset
("*Falling is data, not failure*"). She reacts to what actually happened: streaks,
misses, the specific skill on screen, and the end-of-session result. Lines are
drawn from a shuffled bag so she never repeats herself back-to-back, and she can
speak out loud through the browser's speech synthesis (toggleable).

### 🏅 32 accolades
Bronze through platinum, across precision, combos, per-skill mastery, endurance,
day streaks and performance scores. Locked badges show a live progress bar
(`7 / 10 cartwheels`) rather than a mystery box. Six ranks from Rookie to Legend.

### 🎵 Original hip-hop / R&B, generated live
**No copyrighted music is used or needed.** The soundtrack is synthesised in the
browser from oscillators and noise — 808s with pitch glide, trap hi-hat rolls,
swung boom-bap kits, Rhodes-style seventh chords, and a sidechain duck on every
kick. Five tracks: chill R&B, boom-bap, trap, a showcase anthem, and a menu loop.

This is also the game's **master clock**: notes are charted against beat positions
read from the audio engine, not a wall-clock timer, so the chart cannot drift out
of sync with the music.

### 📺 Real tutorial videos
34 curated YouTube tutorials across 11 topics, from warm-ups to back walkovers.
Cards load thumbnail-first (no YouTube JS until you click) and **degrade
gracefully**: if a video is ever deleted or made private, the card detects the
missing thumbnail and turns itself into a YouTube search for the same topic
instead of showing a dead player. Every card also carries a direct link.

### 🎨 Graphics
Everything is drawn procedurally to canvas — no image assets to load or lose.
A 16-joint skeletal gymnast with keyframed pose clips, auto-pointing toes when
airborne, a spring-chain ponytail, motion trails, floor reflection, beat-reactive
crowd and spotlights, particles, chalk dust and confetti.

---

## Controls

| | |
|---|---|
| **Keyboard** | `A` `S` `D` `F`, or the arrow keys |
| **Touch** | Four full-width pads across the bottom |
| **Pause** | `Esc`, or the button top-right |

Tap on the beat as each skill reaches the line. **Hold** the long notes for the
whole bar — that's a balance or flexibility hold, and letting go early costs you.

There is **no fail state**. A weaker run just earns fewer stars, and Nova tells
you what to fix.

---

## Project layout

```
index.html          screens and markup
css/style.css       styling (tablet-first, 44px minimum touch targets)
js/skills.js        16 skills: coaching data + keyframed pose clips
js/levels.js        the seven zones and their unlock thresholds
js/coach.js         Coach Nova's line library and non-repeating picker
js/videos.js        the tutorial library
js/accolades.js     32 accolades + the saved profile (localStorage)
js/audio.js         hip-hop/R&B synth engine, and the master clock
js/character.js     skeletal gymnast: pose solving and rendering
js/stage.js         the gym: crowd, spotlights, mat, reflection
js/fx.js            particles, pop text, screen shake
js/game.js          chart generation, judgment, scoring, the play loop
js/ui.js            screens, navigation, video cards, speech
test/               browser smoke test, pose sheet, audio verification
```

Plain scripts, no modules and no bundler — which is exactly why the game runs
from a `file://` double-click as happily as from a web server.

## Accessibility & safety

- **Reduce motion** setting cuts particles, shake, and crowd/spotlight animation
- Coach voice can be turned off; music and effects toggle independently
- Auto-pauses when the tab is hidden
- No accounts, no network calls, no analytics — progress is saved only in
  `localStorage` on the device, and the game runs fully offline apart from the
  YouTube video embeds

## Tests

```bash
npm --prefix /opt/node22/lib/node_modules ls playwright   # bundled with the image
NODE_PATH=/opt/node22/lib/node_modules node test/smoke.js        # full playthrough, fails on any console error
NODE_PATH=/opt/node22/lib/node_modules node test/audio-check.js  # proves the music engine schedules audio
NODE_PATH=/opt/node22/lib/node_modules node test/posesheet.js    # renders a pose sheet for visual review
```

---

*Tutorial videos are hosted on YouTube by their respective creators and are linked,
not redistributed. All music and artwork in this game are generated at runtime.*
