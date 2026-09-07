/* Drives a full performance, then the cinematic replay and the certificate,
   and checks the coach personalities actually change what is said. */
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.SHOT_DIR || '/tmp/acro-shots';
require('fs').mkdirSync(OUT, { recursive: true });
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const out = {};

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.click('#btn-boot'); await page.waitForTimeout(400);
  await page.fill('#create-name', 'Ava');
  await page.click('#create-go'); await page.waitForTimeout(500);

  // ---- coach personalities -----------------------------------------------
  out.coaches = await page.evaluate(() => {
    const say = id => { window.Coach.setCoach(id); return window.Coach.say('doingWell'); };
    const r = { zuri: say('zuri'), rex: say('rex'), mira: say('mira') };
    // every coach must carry the safety warning
    r.allHaveSupervised = window.Coach.coaches.every(c =>
      c.reactions.supervised && c.reactions.supervised.length > 0);
    r.count = window.Coach.coaches.length;
    window.Coach.setCoach('zuri');
    return r;
  });

  // unlock a coach through the settings UI
  await page.evaluate(() => { window.Profile.data().xp = 5000; window.Profile.save(); });
  await page.click('#btn-settings'); await page.waitForTimeout(400);
  out.coachOptions = await page.$$eval('.coach-opt', e => e.length);
  out.lockedBefore = await page.$$eval('.coach-opt.locked', e => e.length);
  await page.click('.coach-opt:nth-child(2)');
  await page.waitForTimeout(400);
  out.coachAfterPick = await page.evaluate(() => window.Profile.data().settings.coach);
  await page.screenshot({ path: `${OUT}/20-coach-picker.png` });

  // ---- build a routine and perform it ------------------------------------
  await page.evaluate(() => {
    const p = window.Profile.data();
    ['balance','flexibility','power','coordination','rhythm','tumbling']
      .forEach(r => { p.rooms[r] = { sessions: 3, best: 900, stars: 3 }; });
    p.routines.push({ name: 'Skyline', elements: ['chasse','straddle','spotturn','releve','leap','armframe'],
                      date: window.Profile.today() });
    window.Profile.save();
    window.App.goHub();
  });
  await page.waitForTimeout(400);

  out.performanceStarted = await page.evaluate(() => {
    const m = { id: 'test_perf', type: 'performance', name: 'Skyline', free: true };
    const r = window.Profile.data().routines[0];
    // drive the brief through the real code path
    const cards = [...document.querySelectorAll('#room-grid .card')];
    const perfRoom = cards.find(x => x.textContent.includes('Performance Arena'));
    return perfRoom ? (perfRoom.disabled ? 'locked' : 'available') : 'missing';
  });

  // go through the choreography studio's Perform button — the real path
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#room-grid .card')];
    const c = cards.find(x => x.textContent.includes('Choreography'));
    if (c && !c.disabled) c.click();
  });
  await page.waitForTimeout(500);
  const performBtns = await page.$$('.saved .btn:not(.btn-ghost)');
  out.performButtons = performBtns.length;
  if (performBtns.length) {
    await performBtns[0].click();
    await page.waitForTimeout(500);
    await page.click('#brief-start');
    await page.waitForTimeout(2500);

    // play it
    const keys = ['a','s','d','f'];
    const t0 = Date.now();
    while (Date.now() - t0 < 7000) {
      const k = keys[Math.floor(Math.random()*4)];
      await page.keyboard.down(k); await page.waitForTimeout(60);
      await page.keyboard.up(k); await page.waitForTimeout(70);
    }
    out.performedRecorded = await page.evaluate(() => window.App.rhythm.performed.length);
    await page.evaluate(() => { window.App.rhythm.chart.endBeat = 0; });
    await page.waitForTimeout(3200);
    out.resultsShown = await page.isVisible('#scr-results');
    out.judgePanelShown = await page.isVisible('#judge-panel');
    out.judgeRows = await page.$$eval('.judge', e => e.length);
    await page.screenshot({ path: `${OUT}/21-performance-results.png` });

    // ---- the replay ------------------------------------------------------
    const replayBtn = await page.$('button[data-perf]:has-text("replay")');
    if (replayBtn) {
      await replayBtn.click();
      await page.waitForTimeout(3000);
      out.replayShown = await page.isVisible('#scr-replay');
      out.replayPainted = await page.evaluate(() => {
        const c = document.getElementById('replay-canvas');
        const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let lit = 0;
        for (let i = 3; i < d.length; i += 4*211) if (d[i] > 8) lit++;
        return lit;
      });
      await page.screenshot({ path: `${OUT}/22-replay.png` });
      await page.click('#replay-skip');
      await page.waitForTimeout(600);
    }

    // ---- the certificate --------------------------------------------------
    const certBtn = await page.$('button[data-perf]:has-text("Certificate")');
    if (certBtn) {
      await certBtn.click();
      await page.waitForTimeout(900);
      out.certShown = await page.isVisible('#scr-cert');
      out.certPainted = await page.evaluate(() => {
        const c = document.getElementById('cert-canvas');
        const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let lit = 0;
        for (let i = 3; i < d.length; i += 4*211) if (d[i] > 8) lit++;
        return lit;
      });
      // the canvas must be untainted, or "save as picture" silently fails
      out.certExportable = await page.evaluate(() => {
        try { return document.getElementById('cert-canvas').toDataURL('image/png').slice(0,15); }
        catch (e) { return 'TAINTED: ' + e.message; }
      });
      await page.screenshot({ path: `${OUT}/23-certificate.png` });
    }
  }

  await browser.close();
  console.log(JSON.stringify({ ...out, errors: errors.filter(e => !/ytimg|TUNNEL/.test(e)) }, null, 2));
})();
