/* =========================================================================
   voice.js — the coach's actual voice.

   Everything here is browser speech synthesis. No audio files, no network,
   nothing copyrighted: the device reads the coach's lines in its own voice,
   so the game still works offline and from a double-clicked index.html.

   Four problems this module exists to solve, none of which a bare
   speechSynthesis.speak() call handles:

   1. THE COACHES MUST SOUND DIFFERENT. Zuri, Rex and Mira are written as
      three different people. Reading all three at one rate and one pitch
      makes them the same person wearing three names, so each personality
      carries its own rate, pitch and preferred voice.

   2. VOICES ARRIVE LATE. getVoices() famously returns [] on the first call
      in Chrome; the real list shows up on a 'voiceschanged' event that may
      fire well after boot. Anything spoken before then gets the system
      default, which on a multi-language machine can be the wrong language
      entirely. So: re-resolve on every voiceschanged, and keep going.

   3. LINES MUST NOT GUILLOTINE EACH OTHER. A badge unlocking should never
      cut off a safety warning mid-sentence. Lines carry a priority and a
      short queue decides what interrupts what.

   4. SHE CANNOT BE HEARD OVER AN 808. Music ducks while she talks and comes
      back when she stops.

   Also: the written lines contain emoji, plus signs and XP counts that are
   fine on screen and ridiculous out loud ("shield emoji plus one hundred
   sixty X P"). Text is cleaned for the ear before it is spoken.
   ========================================================================= */

(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var Utter = global.SpeechSynthesisUtterance;
  var supported = !!(synth && typeof Utter === 'function');

  var enabled = true;
  var volume = 1;
  var rate = 1;                  /* user's speed preference, 0.6 .. 1.4 */
  var coachId = 'zuri';

  /* ------------------------------------------------------ voice profiles */
  /* `want` is matched against voice names in order, best first. These are
     common platform voices; when none match we fall back to any voice in
     the page's language, then to the system default, then to no voice at
     all (which still speaks — just in the default voice). */
  var PROFILES = {
    zuri: {
      rate: 1.02, pitch: 1.12,
      want: ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny',
             'Karen', 'Moira', 'Zira', 'female']
    },
    rex: {
      /* Loud hype man: faster, lower, pushes through the beat. */
      rate: 1.16, pitch: 0.82,
      want: ['Daniel', 'Google UK English Male', 'Microsoft Guy', 'Alex',
             'Fred', 'Rishi', 'male']
    },
    mira: {
      /* Calm and precise: slower, level, leaves space between phrases. */
      rate: 0.88, pitch: 1.0,
      want: ['Google UK English Female', 'Microsoft Sonia', 'Serena', 'Fiona',
             'Tessa', 'Catherine', 'female']
    }
  };

  var voices = [];
  var resolved = {};             /* coachId -> SpeechSynthesisVoice | null */

  function langOf(v) { return (v.lang || '').toLowerCase(); }

  function refreshVoices() {
    if (!supported) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
    resolved = {};
    if (!voices.length) return;

    /* Prefer the page's language family, but never refuse to speak just
       because a machine only has, say, en-IN installed. */
    var want = (global.document && global.document.documentElement &&
                global.document.documentElement.lang || 'en').toLowerCase();
    var fam = want.split('-')[0];
    var pool = voices.filter(function (v) { return langOf(v).indexOf(fam) === 0; });
    if (!pool.length) pool = voices.slice();

    var taken = {};
    Object.keys(PROFILES).forEach(function (id) {
      var names = PROFILES[id].want, hit = null;
      for (var i = 0; i < names.length && !hit; i++) {
        var needle = names[i].toLowerCase();
        for (var j = 0; j < pool.length; j++) {
          var n = (pool[j].name || '').toLowerCase();
          /* Skip a voice already claimed by another coach, so three coaches
             do not all land on the single best voice on the machine. */
          if (n.indexOf(needle) !== -1 && !taken[pool[j].name]) { hit = pool[j]; break; }
        }
      }
      if (hit) { resolved[id] = hit; taken[hit.name] = true; }
    });

    /* Anyone still unassigned gets a distinct leftover, else the first. */
    Object.keys(PROFILES).forEach(function (id) {
      if (resolved[id]) return;
      for (var i = 0; i < pool.length; i++) {
        if (!taken[pool[i].name]) { resolved[id] = pool[i]; taken[pool[i].name] = true; return; }
      }
      resolved[id] = pool[0] || null;
    });
  }

  if (supported) {
    refreshVoices();
    /* Chrome populates the list asynchronously; Safari sometimes re-sorts it. */
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refreshVoices);
    } else {
      synth.onvoiceschanged = refreshVoices;
    }
  }

  /* --------------------------------------------------------- text for ears */
  var SPOKEN = [
    /* Things that read badly out loud, rewritten rather than dropped. */
    [/\bXP\b/g, 'experience points'],
    [/\bbpm\b/gi, 'beats per minute'],
    [/\+\s*(\d)/g, 'plus $1'],
    [/(\d)\s*%/g, '$1 percent'],
    [/&amp;/g, 'and'], [/&/g, 'and'],
    [/\.\.\./g, ', '],
    [/—/g, ', '], [/–/g, ', '],
    [/["“”]/g, ''], [/[*_`#]/g, '']
  ];

  /* Emoji, dingbats, variation selectors, zero-width joiners. */
  var EMOJI = /[‍️←-⇿⌀-➿⬀-⯿]|[\ud800-\udbff][\udc00-\udfff]/g;

  function forEars(text) {
    var s = String(text == null ? '' : text);
    s = s.replace(EMOJI, ' ');
    SPOKEN.forEach(function (r) { s = s.replace(r[0], r[1]); });
    return s.replace(/\s+/g, ' ').trim();
  }

  /* Long lines are split on sentence boundaries. Two reasons: Chrome has a
     long-standing habit of cutting an utterance off after ~15 seconds, and
     a cancel() mid-paragraph should lose one sentence, not the lot. */
  function sentences(s) {
    var parts = s.match(/[^.!?]+[.!?]*/g) || [s];
    var out = [], buf = '';
    parts.forEach(function (p) {
      p = p.trim(); if (!p) return;
      if ((buf + ' ' + p).length > 180 && buf) { out.push(buf); buf = p; }
      else buf = buf ? buf + ' ' + p : p;
    });
    if (buf) out.push(buf);
    return out;
  }

  /* --------------------------------------------------------------- ducking */
  var ducked = false;
  function duck(on) {
    if (on === ducked) return;
    ducked = on;
    var A = global.AcroAudio;
    if (A && typeof A.duckForSpeech === 'function') A.duckForSpeech(on);
  }

  /* ----------------------------------------------------------- the queue */
  /* One utterance is in flight at a time. `queue` holds the rest of the
     current line's sentences. Priority: 0 chatter, 1 normal, 2 safety. */
  var queue = [];                /* remaining sentences of the current line */
  var current = null;            /* { priority } of what is speaking now */
  var speakingSince = 0;
  var listeners = [];

  function notify(on) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](on); } catch (e) { /* a bad listener is not fatal */ }
    }
  }

  function finish() {
    current = null;
    queue.length = 0;
    duck(false);
    notify(false);
  }

  function pump() {
    if (!queue.length) { finish(); return; }
    var item = queue.shift();
    var p = PROFILES[item.coach] || PROFILES.zuri;
    var u;
    try { u = new Utter(item.text); }
    catch (e) { finish(); return; }

    u.rate = Math.max(0.5, Math.min(2, p.rate * rate));
    u.pitch = Math.max(0, Math.min(2, p.pitch));
    u.volume = Math.max(0, Math.min(1, volume));
    if (resolved[item.coach]) {
      u.voice = resolved[item.coach];
      u.lang = resolved[item.coach].lang;
    }

    u.onend = function () { if (current) pump(); };
    u.onerror = function () {
      /* 'interrupted' and 'canceled' arrive on every cancel() — not faults.
         Anything else (no voice, synthesis failure) ends the line quietly;
         the caption on screen still carries the words. */
      if (current) finish();
    };

    try { synth.speak(u); }
    catch (e) { finish(); }
  }

  /* --------------------------------------------------------------- public */
  var Voice = {
    supported: supported,

    /* say(text, opts) — opts.coach overrides the active coach,
       opts.priority 0..2, opts.force ignores the enabled flag (used by the
       Test voice button so it works before she turns the setting on). */
    say: function (text, opts) {
      opts = opts || {};
      if (!supported) return false;
      if (!enabled && !opts.force) return false;

      var clean = forEars(text);
      if (!clean) return false;

      var pri = opts.priority == null ? 1 : opts.priority;

      /* Something already talking? Highest priority wins; a tie means the
         newer line takes over, because the newer line is about what just
         happened. Lower priority is dropped rather than queued — stale
         encouragement arriving ten seconds late is worse than silence. */
      if (current) {
        if (pri < current.priority) return false;
        try { synth.cancel(); } catch (e) { /* ignore */ }
        queue.length = 0;
      }

      current = { priority: pri };
      speakingSince = Date.now();
      var who = opts.coach || coachId;
      queue = sentences(clean).map(function (s) { return { text: s, coach: who }; });

      duck(true);
      notify(true);

      /* Some engines need a resume() if a previous cancel left them paused. */
      try { if (synth.paused) synth.resume(); } catch (e) { /* ignore */ }
      pump();
      return true;
    },

    stop: function () {
      if (!supported) return;
      try { synth.cancel(); } catch (e) { /* ignore */ }
      finish();
    },

    isSpeaking: function () { return !!current; },
    speakingFor: function () { return current ? Date.now() - speakingSince : 0; },

    /* onSpeaking(fn) — fn(true) when a line starts, fn(false) when it ends.
       Used to pulse the coach's avatar so a deaf or muted player can still
       see that the coach is saying something. */
    onSpeaking: function (fn) { if (typeof fn === 'function') listeners.push(fn); },

    setEnabled: function (on) {
      enabled = !!on;
      if (!enabled) Voice.stop();
    },
    setVolume: function (v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); },
    setRate: function (v) { rate = Math.max(0.6, Math.min(1.4, Number(v) || 1)); },
    getRate: function () { return rate; },

    setCoach: function (id) { if (PROFILES[id]) coachId = id; },
    coach: function () { return coachId; },

    /* For the settings screen and the tests: which real voice each coach
       landed on, so a parent can see why two coaches sound alike on a
       machine that only ships one voice. */
    voiceFor: function (id) {
      var v = resolved[id || coachId];
      return v ? v.name : null;
    },
    voiceCount: function () { return voices.length; },
    profiles: PROFILES,

    /* exposed for tests */
    _forEars: forEars,
    _sentences: sentences,
    _refresh: refreshVoices
  };

  global.AcroVoice = Voice;
})(window);
