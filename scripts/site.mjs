// Builds site/: the moments page and the rich-text page (test/fixture) as a static site, with every look's fonts, for
// GitHub Pages and the README screenshots. The fonts are copied out of node_modules (only the
// files the stylesheets reach), since a browser can't resolve their package names.
//   node scripts/site.mjs   →   site/index.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(repo, 'site');
fs.rmSync(out, { recursive: true, force: true });

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

const packages = fs
  .readdirSync(path.join(repo, 'packages'))
  .filter((d) => fs.existsSync(path.join(repo, 'packages', d, 'package.json')));

// The packages' CSS and JS, at the paths the fixture links to.
for (const p of packages) {
  const dir = path.join(repo, 'packages', p);
  for (const f of fs.readdirSync(dir))
    if (/\.(css|js|mjs)$/.test(f) && f !== 'fonts.css')
      copy(path.join(dir, f), path.join(out, 'packages', p, f));
}
for (const f of fs.readdirSync(path.join(repo, 'test/fixture')))
  if (!f.endsWith('serve.mjs'))
    copy(path.join(repo, 'test/fixture', f), path.join(out, 'test/fixture', f));

// Each look's fonts.css, with its package imports swapped for copies under site/fonts/.
const fontLinks = [];
for (const p of packages) {
  const fonts = path.join(repo, 'packages', p, 'fonts.css');
  if (!fs.existsSync(fonts)) continue;
  const probe = path.join(repo, 'packages', p, '__resolve.mjs');
  fs.writeFileSync(probe, 'export const r = (s) => import.meta.resolve(s);\n');
  const { r } = await import(`${pathToFileURL(probe).href}?${Date.now()}`);
  fs.rmSync(probe);
  const css = fs.readFileSync(fonts, 'utf8').replace(/@import\s+'([^']+)';/g, (_, spec) => {
    const file = fileURLToPath(r(spec));
    const local = path.join('fonts', spec);
    const text = fs.readFileSync(file, 'utf8');
    for (const [, url] of text.matchAll(/url\(\s*['"]?(\.[^'")]+)['"]?\s*\)/g))
      copy(path.resolve(path.dirname(file), url), path.resolve(out, path.dirname(local), url));
    copy(file, path.join(out, local));
    return `@import '../../${local.split(path.sep).join('/')}';`;
  });
  fs.writeFileSync(path.join(out, 'packages', p, 'fonts.css'), css);
  fontLinks.push(`    <link rel="stylesheet" href="../../packages/${p}/fonts.css" />`);
}

// The pages themselves, with the fonts, and the site's root sending visitors to the moments.
for (const f of fs.readdirSync(path.join(out, 'test/fixture')).filter((f) => f.endsWith('.html'))) {
  const page = path.join(out, 'test/fixture', f);
  fs.writeFileSync(
    page,
    fs
      .readFileSync(page, 'utf8')
      .replace('<title>Moments</title>', '<title>Trentesix: the moments</title>')
      .replace('<title>Rich text</title>', '<title>Trentesix: rich text</title>')
      .replace('  </head>', `${fontLinks.join('\n')}\n  </head>`),
  );
}
fs.writeFileSync(
  path.join(out, 'index.html'),
  '<!doctype html><meta charset="utf-8"><title>Trentesix</title>' +
    // The look and theme in the address (?look=folio) carry over to the moments page.
    '<script>location.replace(`test/fixture/${location.search}`)</script>' +
    '<a href="test/fixture/">The moments</a>\n',
);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Site: ${path.relative(repo, out)}/`);
