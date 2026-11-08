// Reduced motion keeps its promise: nothing is skipped and nothing ends hidden. Every moment in
// fixture/ plays at once, in both looks, with the system asking for reduced motion and not, and
// then each moment's probes (what it leaves on screen) must be visible. A flash must be seen
// every time, reduced or not. Run: pnpm test.
//
// Uses the Chromium that playwright-core expects; if it's missing: pnpm exec playwright-core
// install chromium.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { chromium } from 'playwright-core';
import { serve } from './fixture/serve.mjs';

/** What each moment leaves on screen once it has played. Every match must end visible. */
const PROBES = {
  press: ['[data-moment~="press"]'],
  switch: ['[data-part="thumb"]'],
  slide: ['[data-part="indicator"]'],
  'field-error': ['input', '[data-part="message"]'],
  save: ['[data-moment~="save"]'],
  copied: ['[data-part="icon"]'],
  counter: ['[data-part="digit"]'],
  'code-cells': ['[data-part="cell"]'],
  hold: ['[data-moment~="hold"]'],
  flash: ['[data-moment~="flash"]'],
  toast: ['.entry'],
  stamp: ['[data-moment~="thud"]'],
  seal: ['[data-part="fill"]', '[data-part="label"]', '[data-part="ink"]', '[data-part="badge"]'],
  'change-mark': ['[data-moment~="change-mark"]'],
  postmark: ['[data-moment~="postmark"]', '[data-part="date"]', '[data-part="ink"]'],
  notary: [
    '[data-moment~="notary"]',
    '[data-part="ink"]',
    '[data-part="word"]',
    '[data-part="date"]',
  ],
  sweep: ['[data-moment~="sweep"]'],
  milestone: ['.entry'],
  arrival: ['[data-moment~="arrival"]'],
  curtain: ['[data-part="card"]'],
  develop: ['[data-part="image"]'],
  pen: ['[data-part="ins"]'],
  wind: ['[data-part="hour"]', '[data-part="minute"]', '[data-part="label"]'],
  'title-flight': ['.row'],
  'grow-from': ['.row'],
  unfold: ['[data-moment~="unfold"]'],
  dialog: ['.row'],
  bin: ['.row'],
  lift: ['[data-moment~="lift"]'],
  wait: ['.row'],
  lights: ['[data-moment~="press"]'],
  ticker: ['[data-part="track"]'],
};
const TOAST_MS = 1500; // --toast-time in fixture/index.html

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

/** Plays every moment in one look and motion setting; returns what the page saw. */
async function run(look, reducedMotion) {
  const page = await browser.newPage({ reducedMotion, viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(`${server.url}?look=${look}`);
    return await page
      .evaluate(async (probes) => {
        await window.playMoments();
        // Whatever is still running and will end (a fade-out, a landing); loops never end.
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
        const visible = (el) => {
          let opacity = 1;
          for (let n = el; n; n = n.parentElement) opacity *= +getComputedStyle(n).opacity;
          const box = el.getBoundingClientRect();
          return (
            el.checkVisibility({ visibilityProperty: true }) &&
            opacity > 0.1 &&
            // A straight SVG line (a clock hand) has no width or no height, but never neither.
            (el instanceof SVGElement && el.tagName !== 'svg'
              ? box.width >= 1 || box.height >= 1
              : box.width >= 1 && box.height >= 1)
          );
        };
        const hidden = [];
        const missing = window.momentNames.filter((name) => !probes[name]);
        for (const [name, selectors] of Object.entries(probes)) {
          const stage = document.querySelector(`[data-name="${name}"] .stage`);
          if (!stage) missing.push(name);
          else
            for (const sel of selectors) {
              // Parts a moment hides on purpose with the hidden attribute aren't probes.
              const found = [...stage.querySelectorAll(sel)].filter(
                (el) => !el.closest('[hidden]'),
              );
              if (!found.length) hidden.push(`${name}: nothing matches ${sel}`);
              for (const el of found) if (!visible(el)) hidden.push(`${name}: ${sel} ends hidden`);
            }
        }
        return {
          hidden,
          missing,
          travel: getComputedStyle(document.documentElement).getPropertyValue('--travel').trim(),
          toastMs: +document.querySelector('[data-name="toast"] .stage').dataset.lastToast,
          flashes: +document.querySelector('[data-name="flash"] .stage').dataset.flashes,
        };
      }, PROBES)
      .then((seen) => ({ ...seen, errors }));
  } finally {
    await page.close();
  }
}

// The eight runs share one browser, four side by side: the toast's time is most of the wait,
// and all eight at once starve title-flight's ghost of frames, so it can end mid-flight.
describe('moments', { concurrency: 4 }, () => {
  for (const look of ['discotheque', 'folio', 'devis', 'relais'])
    for (const reducedMotion of ['reduce', 'no-preference'])
      test(`${look}, ${reducedMotion === 'reduce' ? 'reduced motion' : 'full motion'}`, async () => {
        const seen = await run(look, reducedMotion);
        assert.deepEqual(seen.errors, [], 'no console errors');
        assert.deepEqual(seen.missing, [], 'every moment in the fixture has probes');
        assert.deepEqual(seen.hidden, [], 'every probe ends visible');
        assert.ok(
          seen.toastMs >= TOAST_MS,
          `the toast showed for ${seen.toastMs} ms, less than its ${TOAST_MS} ms`,
        );
        assert.equal(seen.flashes, 2, 'the flash showed its colour both times');
        assert.equal(seen.travel, reducedMotion === 'reduce' ? '0' : '1', '--travel');
      });
});
