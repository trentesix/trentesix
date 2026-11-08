// slide(): the indicator lands under its target, also when the bar of tabs around it is scrolled
// sideways (a narrow screen). Run: pnpm test.
import assert from 'node:assert/strict';
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

test('the indicator lands under its tab in a bar scrolled sideways', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  try {
    await page.goto(`${server.url}?look=devis`);
    const gap = await page.evaluate(async () => {
      const { slide } = await import('/packages/core/motion.js');
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div id="bar" data-moment="slide" style="position:relative;display:flex;width:200px;overflow-x:auto">
          <span data-part="indicator" style="position:absolute;bottom:0;height:3px;width:var(--w);translate:var(--x) 0"></span>
          ${[1, 2, 3, 4, 5].map((n) => `<button style="flex:none;width:120px">Tab ${n}</button>`).join('')}
        </div>`,
      );
      const bar = document.getElementById('bar');
      const indicator = bar.querySelector('[data-part="indicator"]');
      const last = bar.querySelectorAll('button')[4];
      bar.scrollLeft = 400;
      await slide(indicator, last);
      return Math.abs(indicator.getBoundingClientRect().left - last.getBoundingClientRect().left);
    });
    assert.ok(gap < 1, `off by ${gap}px`);
  } finally {
    await page.close();
  }
});
