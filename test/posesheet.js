/* Renders a grid of key poses from several skills so the figure can be
   eyeballed at size, mid-motion, not just standing still. */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    document.body.innerHTML = '<canvas id="sheet" width="1400" height="900"></canvas>';
    const c = document.getElementById('sheet'), ctx = c.getContext('2d');
    ctx.fillStyle = '#14092a'; ctx.fillRect(0, 0, 1400, 900);

    const picks = [
      ['handstand', 0.75], ['cartwheel', 0.5], ['bridge', 0.9], ['split', 0.9],
      ['tuck', 0.52], ['straddle', 0.54], ['leap', 0.52], ['walkover', 0.52],
      ['fwdroll', 0.54], ['roundoff', 0.46], ['candle', 0.9], ['releve', 0.9]
    ];
    const cols = 6, cw = 1400 / cols, ch = 900 / 2;

    picks.forEach((p, i) => {
      const sk = AcroSkills.byId(p[0]);
      const g = new AcroCharacter.Gymnast({ scale: 1.15 });
      g.pose = AcroCharacter.sampleClip(sk.clip, p[1]);
      const cx = (i % cols) * cw + cw / 2;
      const fy = Math.floor(i / cols) * ch + ch - 60;

      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2 + 12, fy); ctx.lineTo(cx + cw / 2 - 12, fy); ctx.stroke();

      // settle the hair chain before capturing, so it is not mid-spring
      for (let k = 0; k < 60; k++) g.draw(ctx, cx, fy, 0.016, { noTrail: true });

      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.font = '700 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(sk.name, cx, fy + 30);
    });
  });

  await page.locator('#sheet').screenshot({ path: '/tmp/acro-shots/posesheet.png' });
  await browser.close();
  console.log('pose sheet written');
})();
