/* Drives the real game in a real browser: boots it, plays a drill by
   hammering the lane keys, and fails on any console error or page error. */
const { chromium } = require('playwright');
const path = require('path');

const OUT = process.env.SHOT_DIR || '/tmp/acro-shots';
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  // --- boot ---------------------------------------------------------------
  await page.click('#btn-boot');
  await page.waitForTimeout(600);
  const hubVisible = await page.isVisible('#scr-hub');
  await page.screenshot({ path: `${OUT}/01-hub.png` });

  // --- zone count / lock state -------------------------------------------
  const zones = await page.$$eval('.zone', els => els.map(e => ({
    name: e.querySelector('.zone-name').textContent,
    locked: e.disabled
  })));

  // --- open first zone brief ---------------------------------------------
  await page.click('.zone:not([disabled])');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-brief.png` });

  // --- play it -----------------------------------------------------------
  await page.click('#brief-start');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/03-play-countin.png` });

  // Hammer the lanes for a while: presses land at random times, so this both
  // exercises the hit path and the miss path.
  const keys = ['a', 's', 'd', 'f'];
  const t0 = Date.now();
  while (Date.now() - t0 < 9000) {
    const k = keys[Math.floor(Math.random() * 4)];
    await page.keyboard.down(k);
    await page.waitForTimeout(60 + Math.random() * 130);
    await page.keyboard.up(k);
    await page.waitForTimeout(30 + Math.random() * 120);
  }
  await page.screenshot({ path: `${OUT}/04-play-action.png` });

  const state = await page.evaluate(() => {
    const g = window.AcroUI.game;
    return {
      running: g.running, beat: Math.round(g.beat * 10) / 10,
      score: g.score, combo: g.combo, counts: g.counts,
      notes: g.chart.notes.length,
      judged: g.chart.notes.filter(n => n.judged).length
    };
  });

  // --- let it finish ------------------------------------------------------
  // update() re-reads the beat from the audio clock every frame, so the way to
  // end a drill early is to move the finish line, not the playhead.
  await page.evaluate(() => { window.AcroUI.game.chart.endBeat = 0; });
  await page.waitForTimeout(2800);
  const resultsVisible = await page.isVisible('#scr-results');
  await page.screenshot({ path: `${OUT}/05-results.png` });

  // --- badges -------------------------------------------------------------
  await page.click('#res-hub'); await page.waitForTimeout(400);
  await page.click('#btn-badges'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/06-badges.png`, fullPage: false });
  const badgeCount = await page.$$eval('.badge', e => e.length);
  const earned = await page.$$eval('.badge.earned', e => e.length);

  // --- videos -------------------------------------------------------------
  await page.click('#scr-badges [data-back]'); await page.waitForTimeout(300);
  await page.click('#btn-videos'); await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/07-videos.png` });
  const vidCards = await page.$$eval('.vid', e => e.length);
  const deadCards = await page.$$eval('.vid.dead', e => e.length);

  // --- skill detail + preview animation -----------------------------------
  await page.click('#scr-videos [data-back]'); await page.waitForTimeout(300);
  await page.click('.skill-card'); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/08-skill.png` });
  const previewPainted = await page.evaluate(() => {
    const c = document.getElementById('preview-canvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) lit++;
    return lit;   // non-zero => something was actually drawn
  });

  // --- mobile portrait ----------------------------------------------------
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.goto(url, { waitUntil: 'load' });
  await m.click('#btn-boot'); await m.waitForTimeout(500);
  await m.screenshot({ path: `${OUT}/09-mobile-hub.png` });
  await m.click('.zone:not([disabled])'); await m.waitForTimeout(300);
  await m.click('#brief-start'); await m.waitForTimeout(2000);
  await m.screenshot({ path: `${OUT}/10-mobile-play.png` });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  await browser.close();

  console.log(JSON.stringify({
    hubVisible, zones, state, resultsVisible,
    badges: { total: badgeCount, earned },
    videos: { cards: vidCards, dead: deadCards },
    previewPaintedSamples: previewPainted,
    mobileHorizontalOverflowPx: overflow,
    errors
  }, null, 2));
  if (errors.length) process.exitCode = 1;
})();
