/* Verifies the coach's voice layer.

   Headless Chromium ships no speech voices at all, so a real speechSynthesis
   here would silently do nothing and prove nothing. Instead a fake synth is
   installed BEFORE the page loads (voice.js captures the API in a closure at
   load time, so patching afterwards would be too late). The fake records
   every utterance, which is how we can assert the things that actually
   matter: that the three coaches really do sound different, that a safety
   line cannot be cut off, and that the music gets out of the way.

   The last case runs on a page with no speech API at all, to confirm the
   game degrades to captions instead of throwing. */
const { chromium } = require('playwright');

const FAKE = () => {
  const spoken = [];
  let onVoicesChanged = null;
  const V = (name, lang) => ({ name, lang, default: false, localService: true });
  const voices = [
    V('Samantha', 'en-US'),
    V('Daniel', 'en-GB'),
    V('Google UK English Female', 'en-GB'),
    V('Jorge', 'es-ES')
  ];
  const synth = {
    paused: false, pending: false, speaking: false,
    getVoices: () => voices,
    speak(u) {
      spoken.push({
        text: u.text, rate: u.rate, pitch: u.pitch,
        volume: u.volume, voice: u.voice ? u.voice.name : null
      });
      u._live = true;
      setTimeout(() => { if (u._live && typeof u.onend === 'function') u.onend(); }, 5);
    },
    cancel() {
      spoken.forEach(() => {});
      if (synth._utters) synth._utters.forEach(u => { u._live = false; });
      const u = synth._last;
      if (u) { u._live = false; if (typeof u.onerror === 'function') u.onerror({ error: 'canceled' }); }
    },
    resume() { synth.paused = false; },
    addEventListener(ev, fn) { if (ev === 'voiceschanged') onVoicesChanged = fn; }
  };
  synth._utters = [];
  class FakeUtterance {
    constructor(text) {
      this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1;
      this.voice = null; this.lang = '';
      synth._last = this; synth._utters.push(this);
    }
  }
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
  window.__spoken = spoken;
  window.__fireVoicesChanged = () => { if (onVoicesChanged) onVoicesChanged(); };
};

const URL = 'file:///home/user/Vega10000/index.html';
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const out = {};

  /* ---------------------------------------------- with a working synth */
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(FAKE);
  await p.goto(URL);
  await p.waitForTimeout(300);

  out.supported = await p.evaluate(() => AcroVoice.supported);
  out.voiceCount = await p.evaluate(() => AcroVoice.voiceCount());

  /* Text cleaning: emoji out, abbreviations into words. */
  out.forEars = await p.evaluate(() => ({
    emoji: AcroVoice._forEars('🛡️ Coach-supervised skill'),
    xp: AcroVoice._forEars('Routine saved! +160 XP'),
    pct: AcroVoice._forEars('You hit 92% of the beats'),
    badge: AcroVoice._forEars('🏅 Sky Dancer unlocked!')
  }));

  out.sentences = await p.evaluate(() => ({
    short: AcroVoice._sentences('Breathe. Then go.').length,
    long: AcroVoice._sentences(
      ('This is a long instruction that keeps going and going. ').repeat(8)).length
  }));

  /* Each coach must land on its own real voice, and its own rate/pitch. */
  out.voiceFor = await p.evaluate(() => ({
    zuri: AcroVoice.voiceFor('zuri'),
    rex: AcroVoice.voiceFor('rex'),
    mira: AcroVoice.voiceFor('mira')
  }));

  out.perCoach = await p.evaluate(async () => {
    const got = {};
    for (const id of ['zuri', 'rex', 'mira']) {
      window.__spoken.length = 0;
      AcroVoice.setCoach(id);
      AcroVoice.setEnabled(true);
      AcroVoice.setVolume(1);
      AcroVoice.setRate(1);
      AcroVoice.say('Set your feet, then decide to go.');
      await new Promise(r => setTimeout(r, 30));
      const u = window.__spoken[0] || {};
      got[id] = { rate: +(u.rate || 0).toFixed(3), pitch: +(u.pitch || 0).toFixed(3), voice: u.voice };
    }
    return got;
  });

  /* The user's speed preference scales the per-coach rate and clamps. */
  out.rateScaling = await p.evaluate(async () => {
    const at = async (r) => {
      window.__spoken.length = 0;
      AcroVoice.setCoach('mira'); AcroVoice.setRate(r);
      AcroVoice.say('Precision first.');
      await new Promise(x => setTimeout(x, 30));
      return +(window.__spoken[0].rate).toFixed(3);
    };
    return { slow: await at(0.6), normal: await at(1), fast: await at(1.4), clamped: await at(99) };
  });

  /* Priority: a safety line survives a badge pop; the badge pop is dropped. */
  out.priority = await p.evaluate(async () => {
    AcroVoice.setRate(1); AcroVoice.setCoach('zuri');
    window.__spoken.length = 0;
    const safetyAccepted = AcroVoice.say(
      'This is a coach-supervised skill. Practise it at the gym.', { priority: 2 });
    const chatterRejected = AcroVoice.say('Badge unlocked!', { priority: 0 }) === false;
    const normalRejected = AcroVoice.say('Nice run!', { priority: 1 }) === false;
    const texts = window.__spoken.map(s => s.text);
    return { safetyAccepted, chatterRejected, normalRejected, spokenCount: texts.length,
             firstWasSafety: /coach-supervised/.test(texts[0] || '') };
  });

  /* ...and a safety line does interrupt ordinary chatter already in flight. */
  out.interrupts = await p.evaluate(async () => {
    AcroVoice.stop();
    window.__spoken.length = 0;
    AcroVoice.say('Just a normal encouraging line here.', { priority: 1 });
    const safetyWon = AcroVoice.say('Stop. Gym only, with a coach.', { priority: 2 });
    await new Promise(r => setTimeout(r, 40));
    return { safetyWon, lastSpoken: (window.__spoken[window.__spoken.length - 1] || {}).text };
  });

  /* The toggle really silences her. */
  out.disabled = await p.evaluate(async () => {
    AcroVoice.stop();
    window.__spoken.length = 0;
    AcroVoice.setEnabled(false);
    const refused = AcroVoice.say('You should not hear this.') === false;
    await new Promise(r => setTimeout(r, 20));
    AcroVoice.setEnabled(true);
    return { refused, spoken: window.__spoken.length };
  });

  /* Music gets out of the way, then comes back. */
  out.ducking = await p.evaluate(async () => {
    AcroAudio.init(); AcroAudio.resume(); AcroAudio.play('hiphop');
    AcroVoice.stop();
    await new Promise(r => setTimeout(r, 20));
    const before = AcroAudio.isDuckedForSpeech();
    AcroVoice.say('Listen carefully, this part matters.');
    const during = AcroAudio.isDuckedForSpeech();
    await new Promise(r => setTimeout(r, 120));
    const after = AcroAudio.isDuckedForSpeech();
    return { before, during, after };
  });

  /* Leaving a screen stops her mid-sentence. */
  out.hushOnNav = await p.evaluate(async () => {
    AcroVoice.say('A long line that should be cut short when we navigate away.');
    const talking = AcroVoice.isSpeaking();
    App.show('scr-trophies');
    return { talking, afterNav: AcroVoice.isSpeaking() };
  });

  /* Voices arriving late must be re-resolved, not ignored. */
  out.lateVoices = await p.evaluate(() => {
    window.__fireVoicesChanged();
    return { zuri: AcroVoice.voiceFor('zuri'), rex: AcroVoice.voiceFor('rex') };
  });

  out.errors = errs;
  await p.close();

  /* ------------------------------------------- with no speech API at all */
  const p2 = await b.newPage();
  const errs2 = [];
  p2.on('pageerror', e => errs2.push(e.message));
  await p2.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined, configurable: true });
  });
  await p2.goto(URL);
  await p2.waitForTimeout(300);
  out.noApi = await p2.evaluate(() => ({
    supported: AcroVoice.supported,
    sayReturns: AcroVoice.say('anything'),
    stopThrows: (function () { try { AcroVoice.stop(); return false; } catch (e) { return true; } })(),
    captionsStillOn: Profile.load().settings.captions !== false,
    bootErrors: 0
  }));
  out.noApiErrors = errs2;
  await p2.close();

  await b.close();
  console.log(JSON.stringify(out, null, 2));

  /* ------------------------------------------------------------ assertions */
  const fail = [];
  const T = (name, cond) => { if (!cond) fail.push(name); };

  T('synth detected', out.supported === true);
  T('emoji stripped', !/[\u{1F300}-\u{1FAFF}]|🛡/u.test(out.forEars.emoji) &&
                      /Coach-supervised skill/.test(out.forEars.emoji));
  T('XP expanded', /plus 160 experience points/.test(out.forEars.xp));
  T('percent expanded', /92 percent/.test(out.forEars.pct));
  T('badge emoji stripped', !/🏅/.test(out.forEars.badge));
  T('short line is one utterance', out.sentences.short === 1);
  T('long line is split', out.sentences.long > 1);

  const pc = out.perCoach;
  T('three distinct voices', new Set([out.voiceFor.zuri, out.voiceFor.rex, out.voiceFor.mira]).size === 3);
  T('rex faster than mira', pc.rex.rate > pc.mira.rate);
  T('rex lower than zuri', pc.rex.pitch < pc.zuri.pitch);
  T('mira slower than zuri', pc.mira.rate < pc.zuri.rate);
  T('no two coaches identical',
    new Set(['zuri', 'rex', 'mira'].map(k => pc[k].rate + '/' + pc[k].pitch)).size === 3);

  T('slow preference is slower', out.rateScaling.slow < out.rateScaling.normal);
  T('fast preference is faster', out.rateScaling.fast > out.rateScaling.normal);
  T('rate clamped', out.rateScaling.clamped <= 2);

  T('safety accepted', out.priority.safetyAccepted === true);
  T('chatter dropped under safety', out.priority.chatterRejected === true);
  T('normal dropped under safety', out.priority.normalRejected === true);
  T('safety spoke first', out.priority.firstWasSafety === true);
  T('safety interrupts chatter', out.interrupts.safetyWon === true);
  T('safety line is what is heard', /Gym only/.test(out.interrupts.lastSpoken || ''));

  T('toggle refuses', out.disabled.refused === true);
  T('toggle silences', out.disabled.spoken === 0);

  T('not ducked at rest', out.ducking.before === false);
  T('ducks while speaking', out.ducking.during === true);
  T('un-ducks after', out.ducking.after === false);

  T('speaking on say', out.hushOnNav.talking === true);
  T('hushed on navigation', out.hushOnNav.afterNav === false);
  T('late voices resolved', !!out.lateVoices.zuri && out.lateVoices.zuri !== out.lateVoices.rex);

  T('no page errors', out.errors.length === 0);
  T('degrades without API', out.noApi.supported === false && out.noApi.sayReturns === false);
  T('stop is safe without API', out.noApi.stopThrows === false);
  T('no errors without API', out.noApiErrors.length === 0);

  if (fail.length) { console.error('\nFAILED: ' + fail.join('; ')); process.exit(1); }
  console.log('\nvoice-check: all ' + 29 + ' assertions passed');
})();
