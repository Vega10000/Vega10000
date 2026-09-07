/* Verifies the music engine really builds a Web Audio graph and schedules
   notes over time, by counting the nodes it creates in a live browser. */
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/Vega10000/index.html');
  await p.waitForTimeout(250);

  const out = await p.evaluate(async () => {
    // count every source node the engine creates
    const AC = window.AudioContext || window.webkitAudioContext;
    const counts = { osc: 0, buf: 0, gain: 0, filter: 0 };
    const oProto = AC.prototype;
    const realOsc = oProto.createOscillator, realBuf = oProto.createBufferSource;
    const realGain = oProto.createGain, realFilt = oProto.createBiquadFilter;
    oProto.createOscillator = function () { counts.osc++; return realOsc.call(this); };
    oProto.createBufferSource = function () { counts.buf++; return realBuf.call(this); };
    oProto.createGain = function () { counts.gain++; return realGain.call(this); };
    oProto.createBiquadFilter = function () { counts.filter++; return realFilt.call(this); };

    const ok = AcroAudio.init();
    AcroAudio.resume();
    const results = { initOk: ok, ready: AcroAudio.isReady() };

    const sample = async (style, ms) => {
      const before = { ...counts };
      AcroAudio.play(style);
      const b0 = AcroAudio.beats();
      await new Promise(r => setTimeout(r, ms));
      const b1 = AcroAudio.beats();
      return {
        style, bpm: AcroAudio.bpm(),
        beatsAdvanced: +(b1 - b0).toFixed(2),
        expectedBeats: +((ms / 1000) * (AcroAudio.bpm() / 60)).toFixed(2),
        oscCreated: counts.osc - before.osc,
        noiseCreated: counts.buf - before.buf
      };
    };

    results.tracks = [];
    for (const s of ['hiphop', 'rnb', 'funk', 'pop', 'afrobeat', 'electronic', 'trap', 'cinematic']) {
      results.tracks.push(await sample(s, 1500));
    }
    // sound effects must also produce nodes
    const beforeSfx = counts.osc;
    AcroAudio.sfx.perfect(); AcroAudio.sfx.miss(); AcroAudio.sfx.cheer(0.4);
    await new Promise(r => setTimeout(r, 120));
    results.sfxOscCreated = counts.osc - beforeSfx;
    results.beatPhaseInRange = (() => {
      const v = AcroAudio.beatPhase();
      return v >= 0 && v < 1;
    })();
    return results;
  });

  console.log(JSON.stringify(out, null, 2));
  await b.close();
})();
