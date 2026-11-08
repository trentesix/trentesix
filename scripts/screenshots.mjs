// Screenshots of the moments page in every look and theme, for the READMEs: media/<look>-<theme>.png.
// Builds site/ first (the page with its fonts), serves it and photographs it in Chromium.
//   node scripts/screenshots.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [path.join(repo, 'scripts/site.mjs')], { stdio: 'inherit' });

const site = path.join(repo, 'site');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.relative(site, file).startsWith('..') && fs.existsSync(file)) {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/test/fixture/`;

const looks = fs
  .readdirSync(path.join(repo, 'packages'))
  .filter((d) => d !== 'core' && fs.existsSync(path.join(repo, 'packages', d, 'tokens.json')));
const media = path.join(repo, 'media');
fs.mkdirSync(media, { recursive: true });

const browser = await chromium.launch();
try {
  for (const look of looks)
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',
        colorScheme: theme,
      });
      await page.goto(`${base}?look=${look}&theme=${theme}`);
      await page.evaluate(async () => {
        document.querySelector('nav')?.remove();
        await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 300));
      });
      const file = path.join(media, `${look}-${theme}.png`);
      await page.screenshot({ path: file });
      console.log(path.relative(repo, file));
      await page.close();
    }
} finally {
  await browser.close();
  server.close();
}
