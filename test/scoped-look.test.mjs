// Folio on a part of a page: data-look="folio" on any element gives it Folio's values whatever the
// page's look, in the page's theme unless it has a data-theme of its own. Run: pnpm test.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { serve } from './fixture/serve.mjs';

const CANVAS = { light: '#f5f6f8', dark: '#111418' }; // Folio's --paper
const PAPER = { light: '#f7ebd0', dark: '#1c110a' }; // Discothèque's

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

/**
 * --paper on the page and on three parts of it (Folio, Folio forced light, Folio forced dark),
 * with the page in a look and theme and the system in a colour scheme.
 */
async function papers({ look, theme, scheme = 'light' }) {
  const page = await browser.newPage({ colorScheme: scheme });
  try {
    await page.goto(server.url);
    return await page.evaluate(
      ({ look, theme }) => {
        const root = document.documentElement;
        if (look) root.dataset.look = look;
        else delete root.dataset.look;
        if (theme) root.dataset.theme = theme;
        else delete root.dataset.theme;
        const part = (attrs) => {
          const el = document.createElement('div');
          Object.assign(el.dataset, attrs);
          document.body.append(el);
          return el;
        };
        const paper = (el) => getComputedStyle(el).getPropertyValue('--paper').trim();
        return {
          page: paper(root),
          part: paper(part({ look: 'folio' })),
          light: paper(part({ look: 'folio', theme: 'light' })),
          dark: paper(part({ look: 'folio', theme: 'dark' })),
        };
      },
      { look, theme },
    );
  } finally {
    await page.close();
  }
}

test('a Folio part of a Discothèque page follows the page’s theme, or its own', async () => {
  for (const [opts, theme] of [
    [{}, 'light'],
    [{ scheme: 'dark' }, 'dark'],
    [{ theme: 'light', scheme: 'dark' }, 'light'],
    [{ theme: 'dark' }, 'dark'],
  ]) {
    assert.deepEqual(await papers(opts), {
      page: PAPER[theme],
      part: CANVAS[theme],
      light: CANVAS.light,
      dark: CANVAS.dark,
    });
  }
});

test('a Folio part of a Folio page is just Folio', async () => {
  assert.deepEqual(await papers({ look: 'folio', theme: 'dark' }), {
    page: CANVAS.dark,
    part: CANVAS.dark,
    light: CANVAS.light,
    dark: CANVAS.dark,
  });
});

// Devis and Relais follow the same rules as Folio: a whole page, or a part of any page.
const PART_PAPER = {
  devis: { light: '#eef2ee', dark: '#0d1612' },
  relais: { light: '#eef1f6', dark: '#0e1424' },
};

/** --paper on a part of the page wearing `part`, with the page in a look and theme and the system in a scheme. */
async function partPaper(part, { look, theme, scheme = 'light', own }) {
  const page = await browser.newPage({ colorScheme: scheme });
  try {
    await page.goto(server.url);
    return await page.evaluate(
      ({ part, look, theme, own }) => {
        const root = document.documentElement;
        if (look) root.dataset.look = look;
        if (theme) root.dataset.theme = theme;
        const el = document.createElement('div');
        el.dataset.look = part;
        if (own) el.dataset.theme = own;
        document.body.append(el);
        return getComputedStyle(el).getPropertyValue('--paper').trim();
      },
      { part, look, theme, own },
    );
  } finally {
    await page.close();
  }
}

for (const [part, name] of [
  ['devis', 'Devis'],
  ['relais', 'Relais'],
]) {
  test(`a ${name} part follows the page’s theme, or its own, on any look`, async () => {
    const want = PART_PAPER[part];
    for (const look of [undefined, 'folio', 'devis', 'relais']) {
      assert.equal(await partPaper(part, { look }), want.light);
      assert.equal(await partPaper(part, { look, scheme: 'dark' }), want.dark);
      assert.equal(await partPaper(part, { look, theme: 'light', scheme: 'dark' }), want.light);
      assert.equal(await partPaper(part, { look, theme: 'dark' }), want.dark);
      assert.equal(await partPaper(part, { look, theme: 'dark', own: 'light' }), want.light);
    }
  });
}

// Every look on a part of every other look's page: its type and colours follow it inside, in light
// and in dark. --text-title is declared with var(--font-display), so it must be re-resolved there.
const LOOKS = ['discotheque', 'folio', 'devis', 'relais'];

/** What a part wearing `part` computes, on a page in `look`, in `scheme`. */
async function seen(part, { look, scheme }) {
  const page = await browser.newPage({ colorScheme: scheme });
  try {
    await page.goto(server.url);
    return await page.evaluate(
      ({ part, look }) => {
        const root = document.documentElement;
        root.dataset.look = look;
        const el = document.createElement('div');
        el.dataset.look = part;
        document.body.append(el);
        const style = getComputedStyle(el);
        const prop = (n) => style.getPropertyValue(n).trim();
        const family = (value) => {
          const probe = document.createElement('span');
          probe.style.fontFamily = value;
          el.append(probe);
          return getComputedStyle(probe).fontFamily;
        };
        const title = document.createElement('span');
        title.style.font = 'var(--text-title)';
        el.append(title);
        const label = document.createElement('span');
        label.style.font = 'var(--text-label)';
        label.style.letterSpacing = 'var(--text-label-tracking)';
        el.append(label);
        return {
          paper: prop('--paper'),
          ink: prop('--ink'),
          display: family(prop('--font-display')),
          titleFamily: getComputedStyle(title).fontFamily,
          labelSize: getComputedStyle(label).fontSize,
          labelWeight: getComputedStyle(label).fontWeight,
          labelTracking: getComputedStyle(label).letterSpacing,
          labelToken: [prop('--label-size'), prop('--label-weight'), prop('--label-tracking')],
          outlineField: prop('--outline-field-active'),
        };
      },
      { part, look },
    );
  } finally {
    await page.close();
  }
}

test('a part of any look has that look’s type and colours, on any page, light and dark', async () => {
  for (const scheme of ['light', 'dark']) {
    const own = {};
    for (const part of LOOKS) own[part] = await seen(part, { look: part, scheme });
    for (const part of LOOKS)
      for (const look of LOOKS) {
        const got = await seen(part, { look, scheme });
        assert.deepEqual(got, own[part], `${part} inside ${look} (${scheme})`);
      }
    // The looks really differ, so the equality above is not vacuous.
    assert.equal(new Set(LOOKS.map((l) => own[l].paper)).size, LOOKS.length);
    assert.notEqual(own.folio.titleFamily, own.discotheque.titleFamily);
    assert.notEqual(own.devis.titleFamily, own.discotheque.titleFamily);
    assert.notEqual(own.relais.titleFamily, own.discotheque.titleFamily);
    assert.equal(own.discotheque.paper, PAPER[scheme]);
    assert.equal(own.folio.paper, CANVAS[scheme]);
  }
});

test('--text-label agrees with each look’s label tokens', async () => {
  for (const look of LOOKS) {
    const got = await seen(look, { look, scheme: 'light' });
    const [size, weight, tracking] = got.labelToken;
    assert.equal(got.labelSize, size, look);
    assert.equal(got.labelWeight, weight, look);
    const em = Number.parseFloat(tracking);
    assert.ok(
      tracking === '0'
        ? got.labelTracking === 'normal' || Number.parseFloat(got.labelTracking) === 0
        : Math.abs(Number.parseFloat(got.labelTracking) - em * Number.parseFloat(size)) < 0.05,
      `${look}: ${got.labelTracking} vs ${tracking}`,
    );
  }
});

test('Folio’s active field border differs from its resting one', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(server.url);
    const [rest, active] = await page.evaluate(() => {
      document.documentElement.dataset.look = 'folio';
      const s = getComputedStyle(document.documentElement);
      return ['--outline-field', '--outline-field-active'].map((n) => s.getPropertyValue(n).trim());
    });
    assert.notEqual(rest, active);
  } finally {
    await page.close();
  }
});
