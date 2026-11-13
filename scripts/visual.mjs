// Visual regression: the moments page in every look and theme, photographed once every moment has
// played, and the rich-text page (prose.css), compared with the approved pictures in
// test/visual/. The moments' tests check what moves and what ends visible; this checks colour,
// type and shape.
//   pnpm visual            compare; on a difference, writes <look>-<theme>.actual.png and
//                          .diff.png (the changed pixels in magenta) to test/visual/results/
//   pnpm visual --update   approve what the page looks like now
//
// Builds site/ first, for the fonts. Under reduced motion every moment ends where it would have
// ended, so each run lands on the same picture; loops are stopped and the toast's clock is masked.
// Pictures differ a little between machines (font rasterising), so a few pixels may differ; CI
// keeps its pictures as an artifact, which can be approved by copying them into test/visual/.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from '../test/fixture/serve.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const update = process.argv.includes('--update');
const approved = path.join(repo, 'test/visual');
const results = path.join(approved, 'results');

/** A pixel counts as changed when a channel moves by more than this (of 255): a colour token moved
    by a step. */
const CHANNEL = 2;
/** And a picture as changed when more than this share of its pixels did. */
const SHARE = 0.0005;

execFileSync(process.execPath, [path.join(repo, 'scripts/site.mjs')], { stdio: 'inherit' });
const looks = fs
  .readdirSync(path.join(repo, 'packages'))
  .filter((d) => d !== 'core' && fs.existsSync(path.join(repo, 'packages', d, 'tokens.json')))
  .sort();

const server = await serve(0, path.join(repo, 'site'));
const browser = await chromium.launch();
fs.rmSync(results, { recursive: true, force: true });
const changed = [];
try {
  for (const [prefix, pageFile, moments] of [
    ['', '', true],
    ['prose-', 'prose.html', false],
  ])
    for (const look of looks)
      for (const theme of ['light', 'dark']) {
        const name = `${prefix}${look}-${theme}`;
        const page = await browser.newPage({
          viewport: { width: 1280, height: 900 },
          reducedMotion: 'reduce',
          colorScheme: theme,
        });
        await page.goto(`${server.url}${pageFile}?look=${look}&theme=${theme}&motion=reduce`);
        const height = await page.evaluate(async (moments) => {
          document.querySelector('nav')?.remove();
          await document.fonts.ready;
          // Every moment but lights, which switches the whole page to the other theme.
          if (moments) await window.playMoments(window.momentNames.filter((n) => n !== 'lights'));
          await Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
              .map((a) => a.finished.catch(() => {})),
          );
          return Math.ceil(document.documentElement.scrollHeight);
        }, moments);
        // A viewport as tall as the page rather than fullPage, which re-lays the page out mid-shot.
        await page.setViewportSize({ width: 1280, height });
        const shot = await page.screenshot({
          animations: 'disabled',
          caret: 'hide',
          mask: [page.locator('[data-name="toast"] .clock')],
        });
        const file = path.join(approved, `${name}.png`);
        if (update || !fs.existsSync(file)) {
          fs.mkdirSync(approved, { recursive: true });
          fs.writeFileSync(file, shot);
          console.log(`${update ? 'Approved' : 'New'}: ${path.relative(repo, file)}`);
        } else {
          const diff = await compare(page, fs.readFileSync(file), shot);
          if (diff.share > SHARE || diff.size) {
            changed.push(`${name}: ${diff.size || `${(diff.share * 100).toFixed(3)}% of pixels`}`);
            fs.mkdirSync(results, { recursive: true });
            fs.writeFileSync(path.join(results, `${name}.actual.png`), shot);
            if (diff.png) fs.writeFileSync(path.join(results, `${name}.diff.png`), diff.png);
          } else console.log(`Same: ${name}`);
        }
        await page.close();
      }
} finally {
  await browser.close();
  await server.close();
}
if (changed.length) {
  console.error(
    `\nThese differ from test/visual/ (see test/visual/results/):\n  ${changed.join('\n  ')}\n` +
      'If the change is meant, approve it: pnpm visual --update',
  );
  process.exitCode = 1;
}

/**
 * Compares two PNGs in the page (the browser decodes and encodes them, so no image library is
 * needed). Returns the share of pixels that changed and a picture of them, or the sizes when they
 * differ.
 */
async function compare(page, before, after) {
  const result = await page.evaluate(
    async ({ a, b, channel }) => {
      const load = async (b64) =>
        createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const [x, y] = await Promise.all([load(a), load(b)]);
      if (x.width !== y.width || x.height !== y.height)
        return { size: `${x.width}×${x.height} is now ${y.width}×${y.height}`, share: 1 };
      const pixels = (img) => {
        const c = new OffscreenCanvas(img.width, img.height);
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, img.width, img.height);
      };
      const p = pixels(x).data;
      const q = pixels(y);
      let n = 0;
      for (let i = 0; i < p.length; i += 4) {
        const moved =
          Math.max(
            Math.abs(p[i] - q.data[i]),
            Math.abs(p[i + 1] - q.data[i + 1]),
            Math.abs(p[i + 2] - q.data[i + 2]),
          ) > channel;
        // The diff: changed pixels in magenta over a faint copy of the new picture.
        if (moved) {
          n++;
          q.data.set([255, 0, 255, 255], i);
        } else for (let k = 0; k < 3; k++) q.data[i + k] = 255 - (255 - q.data[i + k]) * 0.2;
      }
      if (!n) return { share: 0 };
      const c = new OffscreenCanvas(q.width, q.height);
      c.getContext('2d').putImageData(q, 0, 0);
      const blob = await c.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000)
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { share: n / (p.length / 4), png: btoa(bin) };
    },
    { a: before.toString('base64'), b: after.toString('base64'), channel: CHANNEL },
  );
  return { ...result, png: result.png && Buffer.from(result.png, 'base64') };
}
