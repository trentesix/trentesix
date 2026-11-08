// Relais's own moments: springs that never overshoot, the postmark pressed in, and the airmail
// sweep, in full and reduced motion. The rest of the moments are covered for Relais by
// reduced-motion.test.mjs. Run: pnpm test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { serve } from './fixture/serve.mjs';

let server;
let browser;
before(async () => {
  server = await serve();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test('Relais springs are calm: damped to at least critical, so no overshoot', () => {
  const tokens = JSON.parse(
    fs.readFileSync(new URL('../packages/relais/tokens.json', import.meta.url)),
  );
  for (const name of ['pop', 'settle']) {
    const { spring } = tokens.motion.tokens.find((t) => t.name === name);
    const zeta = spring.damping / (2 * Math.sqrt(spring.stiffness));
    assert.ok(zeta >= 0.95, `${name} damping ratio ${zeta.toFixed(2)}`);
  }
});

/** Pauses the postmark and the sweep at their first frame and reads what they look like. */
async function firstFrames(look, reducedMotion) {
  const page = await browser.newPage({ reducedMotion });
  try {
    await page.goto(`${server.url}?look=${look}`);
    return await page.evaluate(async () => {
      const stage = (name) => document.querySelector(`[data-name="${name}"] .stage`);
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const first = (el) => {
        const anims = el.getAnimations();
        for (const a of anims) {
          a.pause();
          a.currentTime = 0;
        }
        const cs = getComputedStyle(el);
        return {
          names: anims.map((a) => a.animationName),
          opacity: cs.opacity,
          scale: new DOMMatrix(cs.transform).a,
          clip: cs.clipPath,
          height: cs.height,
          image: cs.backgroundImage,
        };
      };
      const out = {};
      const markPlay = window.playMoments(['postmark', 'sweep']);
      await frame();
      while (!stage('sweep').querySelector('[data-part="band"]')) await frame();
      out.postmark = first(stage('postmark').querySelector('[data-moment~="postmark"]'));
      out.ink = first(stage('postmark').querySelector('[data-part="ink"]')).names;
      out.band = first(stage('sweep').querySelector('[data-part="band"]'));
      void markPlay;
      return out;
    });
  } finally {
    await page.close();
  }
}

test('Relais presses the postmark in with scale; reduced motion keeps it in place', async () => {
  const full = await firstFrames('relais', 'no-preference');
  assert.ok(full.postmark.names.includes('trentesix-enter'), 'pressed in');
  assert.ok(full.postmark.names.includes('trentesix-postmark-rest'), 'settles back');
  assert.ok(full.postmark.scale > 1.2, `starts large (${full.postmark.scale})`);
  assert.deepEqual(full.ink, [], 'the ink is not drawn separately');
  const reduced = await firstFrames('relais', 'reduce');
  assert.ok(Math.abs(reduced.postmark.scale - 1) < 0.01, 'no scale under reduced motion');
});

test('other looks draw the postmark instead of pressing it', async () => {
  const seen = await firstFrames('discotheque', 'no-preference');
  assert.ok(!seen.postmark.names.includes('trentesix-enter'));
  assert.ok(seen.ink.includes('trentesix-draw'));
});

test('Relais sweeps the airmail stripe; reduced motion fades it in place', async () => {
  const full = await firstFrames('relais', 'no-preference');
  assert.ok(full.band.names.includes('trentesix-sweep'));
  assert.match(full.band.image, /repeating-linear-gradient/);
  assert.equal(full.band.height, '6px');
  assert.match(full.band.clip, /100%/, 'starts unveiled from the left');
  const reduced = await firstFrames('relais', 'reduce');
  assert.match(
    reduced.band.clip,
    /^inset\(0px( 0%)?( 0px)?( 0px)?\)$|^inset\(0px 0% 0px 0px\)$/,
    'no travel under reduced motion',
  );
});
