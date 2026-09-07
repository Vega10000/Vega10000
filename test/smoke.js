/* Drives Acroverse in a real browser: creates an acrobat, plays a drill and
   a mini-game, walks every screen, and fails on any console or page error. */
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

  // ---- boot + create -----------------------------------------------------
  await page.click('#btn-boot');
  await page.waitForTimeout(500);
  out.createShown = await page.isVisible('#scr-create');
  await page.screenshot({ path: `${OUT}/01-create.png` });
  await page.fill('#create-name', 'Ava');
  await page.click('#create-go');
  await page.waitForTimeout(600);
  out.hubShown = await page.isVisible('#scr-hub');
  await page.screenshot({ path: `${OUT}/02-hub.png` });

  out.counts = await page.evaluate(() => ({
    districts: document.querySelectorAll('#district-grid .card').length,
    rooms: document.querySelectorAll('#room-grid .card').length,
    games: document.querySelectorAll('#game-grid .card').length,
    quests: document.querySelectorAll('#quests .quest').length,
    accolades: window.Profile.ACCOLADES.length,
    coachLines: window.Coach.total
  }));

  // ---- district 1 --------------------------------------------------------
  await page.click('#district-grid .card:not([disabled])');
  await page.waitForTimeout(400);
  out.missionsListed = await page.$$eval('#mission-list .mission', e => e.length);
  await page.screenshot({ path: `${OUT}/03-district.png` });

  // mission 1 is the safety science lesson
  await page.click('#mission-list .mission');
  await page.waitForTimeout(700);
  out.lessonShown = await page.isVisible('#scr-lesson');
  await page.screenshot({ path: `${OUT}/04-lesson.png` });
  out.scienceRead = await page.evaluate(() => window.Profile.data().science.length);

  // ---- a drill -----------------------------------------------------------
  // the lesson's back button returns to Science, so go home explicitly
  await page.evaluate(() => window.App.goHub());
  await page.waitForTimeout(400);
  await page.click('#btn-trophy'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/05-trophy.png` });
  out.badgeCards = await page.$$eval('#badge-grid .badge', e => e.length);

  await page.evaluate(() => window.App.goHub()); await page.waitForTimeout(400);
  // free training: first room
  await page.click('#room-grid .card:not([disabled])');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/06-room.png` });
  await page.click('#room-body .mission');
  await page.waitForTimeout(500);
  out.briefShown = await page.isVisible('#scr-brief');
  await page.screenshot({ path: `${OUT}/07-brief.png` });

  await page.click('#brief-start');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/08-drill.png` });

  const keys = ['a', 's', 'd', 'f'];
  let t0 = Date.now();
  while (Date.now() - t0 < 8000) {
    const k = keys[Math.floor(Math.random() * 4)];
    await page.keyboard.down(k);
    await page.waitForTimeout(55 + Math.random() * 120);
    await page.keyboard.up(k);
    await page.waitForTimeout(25 + Math.random() * 110);
  }
  await page.screenshot({ path: `${OUT}/09-drill-action.png` });
  out.drillState = await page.evaluate(() => {
    const g = window.App.rhythm;
    return { running: g.running, score: g.score, judged: g.chart.notes.filter(n => n.judged).length,
             notes: g.chart.notes.length };
  });

  // update() re-reads the beat from the audio clock, so end a drill early by
  // moving the finish line rather than the playhead
  await page.evaluate(() => { window.App.rhythm.chart.endBeat = 0; });
  await page.waitForTimeout(3000);
  out.resultsShown = await page.isVisible('#scr-results');
  await page.screenshot({ path: `${OUT}/10-results.png` });
  out.afterDrill = await page.evaluate(() => {
    const p = window.Profile.data();
    return { xp: p.xp, sparks: p.sparks, drills: p.drills,
             badges: Object.keys(p.badges).length, rank: window.Profile.rank().name };
  });

  // ---- a mini-game --------------------------------------------------------
  await page.evaluate(() => window.App.goHub());
  await page.waitForTimeout(400);
  await page.click('#game-grid .card');
  await page.waitForTimeout(400);
  await page.click('#brief-start');
  await page.waitForTimeout(3400);
  await page.screenshot({ path: `${OUT}/11-minigame.png` });
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press(' ');
    await page.waitForTimeout(320);
  }
  await page.screenshot({ path: `${OUT}/12-minigame-action.png` });
  out.gameState = await page.evaluate(() => {
    const g = window.App.activeGame();
    return { id: g.def.id, score: Math.round(g.score), round: g.round, attempts: g.attempts };
  });

  // ---- remaining screens --------------------------------------------------
  await page.evaluate(() => { const g = window.App.activeGame(); if (g.finish) g.finish(); });
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.App.goHub());
  await page.waitForTimeout(300);

  await page.click('#btn-videos'); await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/13-videos.png` });
  out.videos = await page.evaluate(() => ({
    cards: document.querySelectorAll('.vid').length,
    dead: document.querySelectorAll('.vid.dead').length,
    reflect: document.querySelectorAll('.reflect').length
  }));

  await page.evaluate(() => window.App.goHub()); await page.waitForTimeout(300);
  await page.click('#btn-science'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/14-science.png` });

  await page.evaluate(() => window.App.goHub()); await page.waitForTimeout(300);
  await page.click('#btn-wardrobe'); await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/15-wardrobe.png` });

  await page.evaluate(() => window.App.goHub()); await page.waitForTimeout(300);
  await page.click('#btn-parent'); await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/16-parent.png` });

  // choreography studio — grant the stars it needs so the flow is exercised
  await page.evaluate(() => {
    const p = window.Profile.data();
    ['balance','flexibility','power','coordination','rhythm'].forEach(r => {
      p.rooms[r] = { sessions: 2, best: 900, stars: 3 };
    });
    window.Profile.save();
    window.App.goHub();
  });
  await page.waitForTimeout(400);
  out.choreoOpened = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#room-grid .card')];
    const c = cards.find(x => x.textContent.includes('Choreography'));
    if (!c || c.disabled) return 'locked';
    c.click(); return 'open';
  });
  await page.waitForTimeout(500);
  if (out.choreoOpened === 'open') {
    for (let i = 0; i < 4; i++) { await page.click('#move-palette .move'); await page.waitForTimeout(200); }
    await page.fill('#routine-name', 'Ava\u2019s Routine');
    await page.click('#choreo-save');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/17-choreo.png` });
    out.routines = await page.evaluate(() => window.Profile.data().routines.length);
  }

  // ---- supervised safety gate ---------------------------------------------
  // A coach-supervised mission must not be startable until acknowledged.
  await page.evaluate(() => {
    const m = window.Districts.allMissions.find(x => window.Missions.isSupervised(x) && x.type === 'drill');
    window.__gateMission = m;
  });
  out.gate = await page.evaluate(() => {
    const m = window.__gateMission;
    if (!m) return 'no supervised mission found';
    // drive the brief directly
    const ev = new Event('x');
    window.App.show('scr-brief');
    return m.id;
  });
  await page.evaluate(() => window.App.goHub());
  await page.waitForTimeout(200);
  // walk to District 4 mission 4 through the real UI by unlocking districts
  out.gateBlocked = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#room-grid .card')];
    const tumbling = cards.find(x => x.textContent.includes('Tumbling'));
    if (!tumbling || tumbling.disabled) return 'tumbling locked';
    tumbling.click();
    return 'opened';
  });
  await page.waitForTimeout(400);
  if (out.gateBlocked === 'opened') {
    await page.click('#room-body .mission');
    await page.waitForTimeout(400);
    out.gateVisible = await page.isVisible('#safety-gate');
    out.startDisabledBeforeAck = await page.$eval('#brief-start', b => b.disabled);
    await page.check('#safety-ok');
    out.startEnabledAfterAck = await page.$eval('#brief-start', b => !b.disabled);
    await page.screenshot({ path: `${OUT}/19-safety-gate.png` });
  }

  // ---- mobile -------------------------------------------------------------
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mob.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mob.goto(URL, { waitUntil: 'load' });
  await mob.click('#btn-boot'); await mob.waitForTimeout(500);
  await mob.click('#create-go'); await mob.waitForTimeout(500);
  await mob.screenshot({ path: `${OUT}/18-mobile-hub.png` });
  out.mobileOverflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  await browser.close();
  console.log(JSON.stringify({ ...out, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
})();
