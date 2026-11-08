// Devis's own moments: springs with the barest overshoot, the notary seal pressed in (drawn in the
// other looks, still at rest), and the two things Devis keeps from Discothèque (the busy cue's
// hazard stripes and the hi-vis flash), in full and reduced motion. Run: pnpm test.
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

const ratio = ({ stiffness, damping }) => damping / (2 * Math.sqrt(stiffness));

test('Devis springs are firm: pop lands with one small overshoot, settle with next to none', () => {
  const tokens = JSON.parse(
    fs.readFileSync(new URL('../packages/devis/tokens.json', import.meta.url)),
  );
  const spring = (name) => tokens.motion.tokens.find((t) => t.name === name).spring;
  const pop = ratio(spring('pop'));
  const settle = ratio(spring('settle'));
  assert.ok(pop >= 0.65 && pop < 1, `pop damping ratio ${pop.toFixed(2)}`);
  assert.ok(settle >= 0.85, `settle damping ratio ${settle.toFixed(2)}`);
});

/** Plays the notary specimen, pauses it at its first frame, and reads what it looks like. */
async function notary(look, reducedMotion, { rest = false } = {}) {
  const page = await browser.newPage({ reducedMotion });
  try {
    await page.goto(`${server.url}?look=${look}`);
    return await page.evaluate(async (rest) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const stage = document.querySelector('[data-name="notary"] .stage');
      window.playMoments(['notary']);
      while (!stage.querySelector('[data-moment~="notary"]')) await frame();
      const seal = stage.querySelector('[data-moment~="notary"]');
      if (rest) seal.dataset.state = 'rest';
      const card = stage.querySelector('[data-moment~="thud"]');
      const pause = (el) => {
        const anims = el.getAnimations();
        for (const a of anims) {
          a.pause();
          a.currentTime = 0;
        }
        return anims.map((a) => a.animationName);
      };
      const names = pause(seal);
      const cs = getComputedStyle(seal);
      return {
        names,
        scale: new DOMMatrix(cs.transform).a,
        opacity: Number(cs.opacity),
        ink: pause(seal.querySelector('[data-part="ink"]')),
        word: pause(seal.querySelector('[data-part="word"]')),
        thud: card.getAnimations().map((a) => a.animationName),
        color: cs.color,
        rotate: cs.rotate,
      };
    }, rest);
  } finally {
    await page.close();
  }
}

test('Devis presses the notary seal in whole, and the quote takes the jolt', async () => {
  const seen = await notary('devis', 'no-preference');
  assert.deepEqual(seen.names, ['trentesix-enter']);
  assert.ok(seen.scale > 1.4, `starts large (${seen.scale})`);
  assert.deepEqual(seen.ink, [], 'the rings are not drawn separately');
  assert.deepEqual(seen.thud, ['trentesix-thud-devis']);
  assert.equal(seen.rotate, '-8deg', 'an object keeps its angle');
});

test('under reduced motion the seal fades in place, no scale', async () => {
  const seen = await notary('devis', 'reduce');
  assert.ok(Math.abs(seen.scale - 1) < 0.01, `no scale (${seen.scale})`);
});

test('a record opened later shows the seal as it stands', async () => {
  const seen = await notary('devis', 'no-preference', { rest: true });
  assert.deepEqual(seen.names, []);
  assert.deepEqual(seen.ink, []);
  assert.deepEqual(seen.word, []);
  assert.equal(seen.opacity, 1);
});

test('other looks draw the notary seal instead of pressing it', async () => {
  for (const look of ['discotheque', 'folio', 'relais']) {
    const seen = await notary(look, 'no-preference');
    assert.ok(!seen.names.includes('trentesix-enter'), look);
    assert.deepEqual(seen.ink, ['trentesix-draw'], look);
    assert.deepEqual(seen.word, ['trentesix-fade-in'], look);
  }
});

test('Devis keeps the hazard-stripe busy cue and the hi-vis flash', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${server.url}?look=devis`);
    const seen = await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<button id="b" data-moment="press" data-state="busy">Send</button><p id="f" data-moment="flash">Saved</p>',
      );
      const busy = getComputedStyle(document.getElementById('b'), '::before');
      return {
        stripes: busy.backgroundImage,
        busyHeight: busy.height,
        flash: document
          .getElementById('f')
          .getAnimations()
          .map((a) => a.animationName),
      };
    });
    assert.match(seen.stripes, /repeating-linear-gradient/, 'hazard stripes');
    assert.notEqual(seen.busyHeight, '2px', 'not the calm looks’ line');
    assert.deepEqual(seen.flash, ['trentesix-flash'], 'hits at once, no soak');
  } finally {
    await page.close();
  }
});

/** A signed-in curtain, paused at its first frame: what its bands and card play. */
async function curtain(look, reducedMotion) {
  const page = await browser.newPage({ reducedMotion });
  try {
    await page.goto(`${server.url}?look=${look}`);
    return await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div id="c" data-moment="curtain" data-state="done" style="position:relative;width:400px;height:300px"><div data-part="card">Sign in</div><div data-part="view"></div><div data-part="bands">${'<i></i>'.repeat(5)}</div></div>`,
      );
      const bands = [...document.querySelectorAll('#c [data-part="bands"] > i')];
      for (const a of document.getElementById('c').getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = 0;
      }
      return {
        shown: getComputedStyle(document.querySelector('#c [data-part="bands"]')).display,
        names: bands[0].getAnimations().map((a) => a.animationName),
        image: getComputedStyle(bands[0]).backgroundImage,
        from: bands.slice(0, 2).map((b) => new DOMMatrix(getComputedStyle(b).transform).e),
        card: document
          .querySelector('#c [data-part="card"]')
          .getAnimations()
          .map((a) => a.animationName),
      };
    });
  } finally {
    await page.close();
  }
}

test('Devis signs in with hazard tape pulled across from both sides, then lifted away', async () => {
  const seen = await curtain('devis', 'no-preference');
  assert.equal(seen.shown, 'grid');
  assert.deepEqual(seen.names, ['trentesix-tape-in', 'trentesix-roll', 'trentesix-band-out']);
  assert.match(seen.image, /repeating-linear-gradient/);
  assert.ok(seen.from[0] < 0 && seen.from[1] > 0, `from ${seen.from}`);
  assert.deepEqual(seen.card, ['trentesix-hide']);

  const still = await curtain('devis', 'reduce');
  assert.deepEqual(still.from, [0, 0], 'under reduced motion the tape is just there');

  const folio = await curtain('folio', 'no-preference');
  assert.equal(folio.shown, 'none', 'Folio keeps its calm curtain');
});
