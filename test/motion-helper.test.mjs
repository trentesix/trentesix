// The motion helper's edge cases: overlapping calls, failures that must not stick, and the
// accessible paths. Run: pnpm test.
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

/** Runs `fn(motion)` in a fresh page with the helper imported. */
async function inPage(fn, args) {
  const page = await browser.newPage();
  try {
    await page.goto(`${server.url}?look=devis`);
    return await page.evaluate(
      async ([src, args]) => {
        const m = await import('/packages/core/motion.js');
        return await new Function('m', 'args', `return (${src})(m, args)`)(m, args);
      },
      [fn.toString(), args],
    );
  } finally {
    await page.close();
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('bin then bin back leaves the row open, with its own overflow', async () => {
  const r = await inPage(async ({ bin }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="r" style="overflow:auto;height:40px">row</div>',
    );
    const row = document.getElementById('r');
    const first = bin(row);
    await new Promise((r) => setTimeout(r, 30));
    const second = bin(row, { back: true });
    await Promise.all([first, second]);
    return {
      h: row.getBoundingClientRect().height,
      o: row.style.overflow,
      op: getComputedStyle(row).opacity,
    };
  });
  assert.equal(r.h, 40);
  assert.equal(r.o, 'auto');
  assert.equal(r.op, '1');
});

test('two bins in a row restore the original overflow', async () => {
  const r = await inPage(async ({ bin }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="r" style="overflow:auto;height:40px">row</div>',
    );
    const row = document.getElementById('r');
    const a = bin(row);
    await new Promise((r) => setTimeout(r, 30));
    await Promise.all([a, bin(row)]);
    return row.style.overflow;
  });
  assert.equal(r, 'auto');
});

test('growFrom back then growFrom leaves the view open, not clipped', async () => {
  const r = await inPage(async ({ growFrom }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button id="o">New</button><div id="v" style="width:200px;height:100px;background:#eee"><p>hi</p></div>',
    );
    const [o, v] = ['o', 'v'].map((i) => document.getElementById(i));
    const first = growFrom(o, v, { back: true });
    await new Promise((r) => setTimeout(r, 30));
    await Promise.all([first, growFrom(o, v)]);
    return { clip: getComputedStyle(v).clipPath, anims: v.getAnimations().length };
  });
  assert.ok(r.clip === 'none' || /inset\(0/.test(r.clip), r.clip);
  assert.equal(r.anims, 0);
});

test('a failing flight does not poison the queue or leave a ghost behind', async () => {
  const r = await inPage(async ({ flight }) => {
    document.body.insertAdjacentHTML('beforeend', '<span id="a">A</span><span id="b">B</span>');
    const [a, b] = ['a', 'b'].map((i) => document.getElementById(i));
    const base = document.body.children.length;
    const bad = Object.create(b);
    Object.defineProperty(bad, 'getBoundingClientRect', { value: () => b.getBoundingClientRect() });
    let n = 0;
    Object.defineProperty(bad, 'style', {
      get() {
        if (n++ > 0) throw new Error('boom');
        return b.style;
      },
    });
    let rejected = false;
    await flight(a, bad).catch(() => (rejected = true));
    const afterFail = { ghosts: document.body.children.length - base, vis: a.style.visibility };
    const t = performance.now();
    await flight(a, b).catch(() => (rejected = true));
    return {
      rejected,
      ...afterFail,
      ghosts2: document.body.children.length - base,
      ran: performance.now() - t > 100,
    };
  });
  assert.equal(r.rejected, false);
  assert.equal(r.ghosts, 0);
  assert.equal(r.vis, '');
  assert.equal(r.ghosts2, 0);
  assert.ok(r.ran, 'the next flight still ran');
});

const holdPage = `<button id="h" style="width:100px;height:30px"><span data-part="fill"></span>Delete</button>`;

test('a synthetic click (detail 0) starts a hold that completes; Escape cancels', async () => {
  const r = await inPage(async ({ hold }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button id="h"><span data-part="fill"></span>Go</button>',
    );
    const b = document.getElementById('h');
    let n = 0;
    hold(b, { ms: 100, onConfirm: () => n++ });
    b.click();
    const busy = b.dataset.state;
    await new Promise((r) => setTimeout(r, 250));
    const done = [n, b.dataset.state];
    b.dataset.state = '';
    b.removeAttribute('data-state');
    b.click();
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((r) => setTimeout(r, 250));
    return { busy, done, afterEscape: n };
  });
  assert.equal(r.busy, 'busy');
  assert.deepEqual(r.done, [1, 'done']);
  assert.equal(r.afterEscape, 1);
});

test('hold does not confirm a button removed mid-hold', async () => {
  const r = await inPage(async ({ hold }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button id="h"><span data-part="fill"></span>Go</button>',
    );
    const b = document.getElementById('h');
    let n = 0;
    hold(b, { ms: 100, onConfirm: () => n++ });
    b.click();
    await new Promise((r) => setTimeout(r, 30));
    b.remove();
    await new Promise((r) => setTimeout(r, 250));
    return n;
  });
  assert.equal(r, 0);
});

test('a throwing onConfirm is reported once, as an error, not a rejection', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${server.url}?look=devis`);
    const seen = await page.evaluate(async () => {
      const { hold } = await import('/packages/core/motion.js');
      const seen = { errors: 0, rejections: 0 };
      addEventListener('error', (e) => (e.preventDefault(), seen.errors++));
      addEventListener('unhandledrejection', () => seen.rejections++);
      document.body.insertAdjacentHTML(
        'beforeend',
        '<button id="h"><span data-part="fill"></span>Go</button>',
      );
      const b = document.getElementById('h');
      hold(b, {
        ms: 50,
        onConfirm: () => {
          throw new Error('nope');
        },
      });
      b.click();
      await new Promise((r) => setTimeout(r, 300));
      return { ...seen, state: b.dataset.state };
    });
    assert.deepEqual(seen, { errors: 1, rejections: 0, state: 'done' });
  } finally {
    await page.close();
  }
});

test('toastTimer pauses while the tab is hidden and reads --toast-time without a bar', async () => {
  const r = await inPage(async ({ toastTimer }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="t" style="--toast-time:300ms">toast</div>',
    );
    const t = document.getElementById('t');
    let state = 'visible';
    Object.defineProperty(document, 'visibilityState', { get: () => state, configurable: true });
    const start = performance.now();
    const p = toastTimer(t);
    await new Promise((r) => setTimeout(r, 50));
    state = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    const paused = t.getAnimations()[0].playState;
    await new Promise((r) => setTimeout(r, 400));
    const stillWaiting = performance.now() - start > 400 && t.getAnimations().length === 1;
    state = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await p;
    const total = performance.now() - start;
    // and it resolves when the toast leaves the DOM
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="u" style="--toast-time:60s">toast</div>',
    );
    const u = document.getElementById('u');
    const q = toastTimer(u);
    u.remove();
    await q;
    return { paused, stillWaiting, total };
  });
  assert.equal(r.paused, 'paused');
  assert.ok(r.stillWaiting);
  assert.ok(r.total > 650, `${r.total}`);
});

test('toastTimer picks the timer animation by name', async () => {
  const r = await inPage(async ({ toastTimer }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<style>@keyframes other { to { opacity: .5 } } @keyframes trentesix-timer { to { opacity: .9 } }</style>
       <div id="t"><i data-part="timer" style="display:block;animation: other 10s, trentesix-timer 200ms forwards"></i></div>`,
    );
    const t = document.getElementById('t');
    const start = performance.now();
    await toastTimer(t);
    return performance.now() - start;
  });
  assert.ok(r < 2000, `${r}`);
});

test('switchLights awaits apply, survives a throwing apply, and clears data-lights', async () => {
  const r = await inPage(async ({ switchLights }) => {
    addEventListener('error', (e) => e.preventDefault());
    const log = [];
    await switchLights(async () => {
      await new Promise((r) => setTimeout(r, 30));
      log.push('vt');
    });
    const a = document.documentElement.hasAttribute('data-lights');
    await switchLights(async () => {
      throw new Error('bad');
    });
    const b = document.documentElement.hasAttribute('data-lights');
    document.startViewTransition = undefined;
    await switchLights(async () => {
      await new Promise((r) => setTimeout(r, 30));
      log.push('plain');
    });
    let threw = false;
    await switchLights(async () => {
      throw new Error('bad');
    }).catch(() => (threw = true));
    return { log, a, b, threw };
  });
  assert.deepEqual(r.log, ['vt', 'plain']);
  assert.equal(r.a, false);
  assert.equal(r.b, false);
  assert.equal(r.threw, false);
});

test('overlapping switchLights calls do not clear data-lights early', async () => {
  const r = await inPage(async ({ switchLights }) => {
    const slow = switchLights(async () => new Promise((r) => setTimeout(r, 150)));
    await new Promise((r) => setTimeout(r, 20));
    const fast = switchLights(() => {});
    await fast;
    const mid = document.documentElement.hasAttribute('data-lights');
    await slow;
    return { mid, end: document.documentElement.hasAttribute('data-lights') };
  });
  assert.equal(r.end, false);
});

test('tokens are read from the element, so a subtree can have its own springs', async () => {
  const r = await inPage(({ spring }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="s" style="--spring-pop-duration:123ms"></div>',
    );
    const s = document.getElementById('s');
    return [spring('pop', s).duration, spring('pop').duration];
  });
  assert.equal(r[0], 123);
  assert.notEqual(r[1], 123);
});

test('count reads the final value once while rolling, then is plain digits', async () => {
  const r = await inPage(async ({ count }) => {
    document.body.insertAdjacentHTML('beforeend', '<span id="c">19</span>');
    const c = document.getElementById('c');
    const roll = count(c, 20);
    const mid = {
      hiddenCols: [...c.querySelectorAll('[data-part="digit"]')].every(
        (d) => d.getAttribute('aria-hidden') === 'true',
      ),
      said: c.querySelector('[data-part="said"]')?.textContent,
    };
    await roll;
    await count(c, 'abc');
    await count(c, NaN);
    return {
      mid,
      end: c.textContent,
      hidden: c.querySelectorAll('[aria-hidden]').length,
      said: !!c.querySelector('[data-part="said"]'),
    };
  });
  assert.deepEqual(r.mid, { hiddenCols: true, said: '20' });
  assert.equal(r.end, 'NaN');
  assert.equal(r.hidden, 0);
  assert.equal(r.said, false);
});
