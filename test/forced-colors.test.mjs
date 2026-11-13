// Forced colours (Windows high contrast) keep what a colour alone was saying. The system repaints
// every background in the page's colour, so the parts that are only a colour must show some other
// way: moments.css draws them in system colours. In every look, with forced colours on, the
// moments that rely on colour play, and each must be seen at some point while they do. Run: pnpm
// test.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
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

/** Plays the colour moments with forced colours on; returns which of them were seen. */
async function run(look, colorScheme) {
  const page = await browser.newPage({ forcedColors: 'active', colorScheme });
  try {
    await page.goto(`${server.url}?look=${look}`);
    return await page.evaluate(async () => {
      if (!matchMedia('(forced-colors: active)').matches) return { forced: false };
      // The page's own colour: what a repainted background turns into.
      const probe = document.body.appendChild(document.createElement('div'));
      probe.style.background = 'Canvas';
      const canvas = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const painted = (c) => c !== canvas && !/rgba\(.*, 0\)$/.test(c) && c !== 'transparent';
      const part = (name, sel) => document.querySelector(`[data-name="${name}"] ${sel}`);

      const seen = {};
      const look = () => {
        const ind = part('slide', '[data-part="indicator"]');
        if (ind) {
          const s = getComputedStyle(ind);
          if (s.outlineStyle === 'solid' && painted(s.outlineColor)) seen.slide = true;
        }
        const fill = part('hold', '[data-part="fill"]');
        if (fill) {
          const s = getComputedStyle(fill);
          const box = fill.getBoundingClientRect();
          if (painted(s.backgroundColor) && box.width >= 1 && box.height >= 2) seen.hold = true;
        }
        const bar = part('change-mark', '[data-part="bar"]');
        if (bar && painted(getComputedStyle(bar).backgroundColor) && +getComputedStyle(bar).opacity)
          seen.bar = true;
        const hl = part('change-mark', '[data-part="highlight"]');
        if (hl) {
          const s = getComputedStyle(hl);
          if (s.borderBottomStyle === 'solid' && painted(s.borderBottomColor) && +s.opacity)
            seen.highlight = true;
        }
        for (const el of document.querySelectorAll('[data-name="flash"] [data-moment~="flash"]')) {
          const s = getComputedStyle(el);
          if (s.outlineStyle === 'solid' && painted(s.outlineColor)) seen.flash = true;
        }
      };
      let playing = true;
      const done = window.playMoments(['slide', 'hold', 'change-mark', 'flash']).finally(() => {
        playing = false;
      });
      while (playing) {
        look();
        await new Promise((r) => requestAnimationFrame(r));
      }
      await done;
      return { forced: true, seen };
    });
  } finally {
    await page.close();
  }
}

describe('forced colours', { concurrency: 4 }, () => {
  for (const look of ['discotheque', 'folio', 'devis', 'relais'])
    for (const scheme of ['light', 'dark'])
      test(`${look}, ${scheme}`, async () => {
        const { forced, seen } = await run(look, scheme);
        assert.ok(forced, 'the page sees forced colours');
        assert.deepEqual(
          seen,
          { slide: true, hold: true, bar: true, highlight: true, flash: true },
          'the selected option, the hold, the change-mark and the flash were seen',
        );
      });
});
