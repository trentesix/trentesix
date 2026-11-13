// Rich text (prose.css) in every look and theme: it wins over an app's reset, its headings step
// down from h1 to the text, its weights and colours are the look's, compact text is at UI size,
// a look scoped to one element reaches the rich text inside it, and in forced colours what was
// only a ground still shows. The page is test/fixture/prose.html. Run: pnpm test.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { chromium } from 'playwright-core';
import { serve } from './fixture/serve.mjs';

const LOOKS = ['discotheque', 'folio', 'devis', 'relais'];

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

async function open(query, options = {}) {
  const page = await browser.newPage(options);
  await page.goto(`${server.url}prose.html?${query}`);
  return page;
}

/** What the reading and compact text compute to, and what the look's variables say they should. */
function measure() {
  const css = (el) => getComputedStyle(el);
  // What a font shorthand or a colour variable comes to, on a probe inside the box.
  const probe = (box, style, prop) => {
    const el = box.appendChild(document.createElement('span'));
    el.style.cssText = style;
    const v = css(el)[prop];
    el.remove();
    return v;
  };
  const px = (v) => parseFloat(v);
  const out = {};
  for (const id of ['reading', 'compact']) {
    const box = document.getElementById(id);
    const q = (sel) => box.querySelector(sel);
    const sizes = ['h1', 'h2', 'h3', 'p'].map((t) => px(css(q(t)).fontSize));
    const gap = px(probe(box, 'display: block; margin-top: var(--prose-gap)', 'marginTop'));
    out[id] = {
      sizes,
      first: px(css(box.firstElementChild).marginTop),
      paragraphGap: px(css(q('ul + ol')).marginTop),
      gap,
      list: css(q('ul')).listStyleType,
      listPad: px(css(q('ul')).paddingInlineStart),
      nested: css(q('ul ul')).listStyleType,
      ordered: css(q('ol ol')).listStyleType,
      link: css(q('a')).color,
      linkLine: css(q('a')).textDecorationLine,
      wantLink: probe(box, 'color: var(--link)', 'color'),
      strong: css(q('p strong')).fontWeight,
      wantStrong: probe(box, 'font-weight: var(--strong-weight)', 'fontWeight'),
      mark: css(q('mark')).backgroundColor,
      wantMark: probe(box, 'background: var(--mark)', 'backgroundColor'),
      pre: css(q('pre')).backgroundColor,
      wantPre: probe(box, 'background: var(--code)', 'backgroundColor'),
      bodySize: px(css(box).fontSize),
      wantBody: px(
        probe(box, `font: var(${id === 'reading' ? '--text-body-l' : '--text-body'})`, 'fontSize'),
      ),
      width: css(box).maxInlineSize,
    };
  }
  return out;
}

describe('rich text', { concurrency: 4 }, () => {
  for (const look of LOOKS)
    for (const theme of ['light', 'dark'])
      test(`${look}, ${theme}`, async () => {
        const page = await open(`look=${look}&theme=${theme}`);
        try {
          const m = await page.evaluate(measure);
          for (const [id, r] of Object.entries(m)) {
            // The page starts from a reset that strips lists and links; prose.css puts them back.
            assert.equal(r.list, 'disc', `${id}: bullets`);
            assert.ok(r.listPad > 0, `${id}: lists are indented`);
            assert.equal(r.nested, 'circle', `${id}: nested bullets`);
            assert.equal(r.ordered, 'lower-alpha', `${id}: nested numbers`);
            assert.equal(r.linkLine, 'underline', `${id}: links are underlined`);
            assert.equal(r.link, r.wantLink, `${id}: links in --link`);
            assert.equal(r.strong, r.wantStrong, `${id}: bold is --strong-weight`);
            assert.equal(r.mark, r.wantMark, `${id}: mark on --mark`);
            assert.equal(r.pre, r.wantPre, `${id}: code blocks are code wells`);
            assert.equal(r.bodySize, r.wantBody, `${id}: text at its role's size`);
            assert.equal(r.first, 0, `${id}: the first block sits flush`);
            assert.equal(r.paragraphGap, r.gap, `${id}: blocks are --prose-gap apart`);
            // Each heading is larger than the next, and none is smaller than the text.
            const [h1, h2, h3, p] = r.sizes;
            if (id === 'reading') {
              assert.ok(h1 > h2 && h2 > h3, `${id}: headings step down (${r.sizes})`);
              assert.ok(h3 >= p, `${id}: h3 is not smaller than the text (${r.sizes})`);
            } else assert.ok(h1 >= p && h2 >= p, `${id}: headings are not smaller (${r.sizes})`);
          }
          assert.notEqual(m.reading.width, 'none', 'reading text keeps to a measure');
          assert.equal(m.compact.width, 'none', 'compact text fills its field');
        } finally {
          await page.close();
        }
      });

  test('bold inside a heading keeps the heading’s weight', async () => {
    const page = await open('look=discotheque');
    try {
      const [heading, strong] = await page.evaluate(() => {
        const h = document.querySelector('#reading h1');
        h.innerHTML = 'A <strong>bold</strong> word';
        return [h, h.querySelector('strong')].map((el) => getComputedStyle(el).fontWeight);
      });
      assert.equal(strong, heading);
    } finally {
      await page.close();
    }
  });

  test('a look scoped to one element reaches the rich text inside it', async () => {
    const page = await open('look=discotheque');
    try {
      const [scoped, folio] = await page.evaluate(() => {
        const size = (el) => getComputedStyle(el.querySelector('h2')).fontSize;
        const box = document.getElementById('reading');
        const wrap = document.createElement('div');
        wrap.dataset.look = 'folio';
        box.before(wrap);
        wrap.append(box);
        const scopedSize = size(box);
        wrap.replaceWith(box);
        document.documentElement.dataset.look = 'folio';
        return [scopedSize, size(box)];
      });
      assert.equal(scoped, folio);
    } finally {
      await page.close();
    }
  });

  for (const look of LOOKS)
    test(`forced colours, ${look}`, async () => {
      const page = await open(`look=${look}`, { forcedColors: 'active' });
      try {
        const r = await page.evaluate(() => {
          const box = document.getElementById('reading');
          const css = (sel) => getComputedStyle(box.querySelector(sel));
          const sys = (c) => {
            const el = document.body.appendChild(document.createElement('div'));
            el.style.background = c;
            const v = getComputedStyle(el).backgroundColor;
            el.remove();
            return v;
          };
          return {
            forced: matchMedia('(forced-colors: active)').matches,
            mark: css('mark').backgroundColor,
            Mark: sys('Mark'),
            Canvas: sys('Canvas'),
            ins: css('ins').textDecorationLine,
            del: css('del').textDecorationLine,
            code: [css('p code').borderTopStyle, css('p code').borderTopColor],
            pre: [css('pre').borderTopStyle, css('pre').borderTopColor],
          };
        });
        assert.ok(r.forced, 'the page sees forced colours');
        assert.equal(r.mark, r.Mark, 'mark keeps the system highlighter');
        assert.notEqual(r.mark, r.Canvas);
        assert.equal(r.ins, 'underline', 'inserted text keeps its line');
        assert.equal(r.del, 'line-through', 'deleted text keeps its line');
        for (const [name, [style, color]] of Object.entries({ code: r.code, pre: r.pre })) {
          assert.equal(style, 'solid', `${name} has a border`);
          assert.notEqual(color, r.Canvas, `${name}'s border shows`);
          assert.doesNotMatch(color, /^rgba\(.*, 0\)$/, `${name}'s border is not transparent`);
        }
      } finally {
        await page.close();
      }
    });
});
