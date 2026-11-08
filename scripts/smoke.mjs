// Packs every package, installs the tarballs into an empty project the way an app would, and
// checks what an app reaches: every export resolves and imports, every @import in every
// stylesheet resolves through the packages' exports, and every file the CSS needs is in a tarball.
//   node scripts/smoke.mjs        (needs the network, for the fonts)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'trentesix-smoke-'));
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
const packages = fs
  .readdirSync(path.join(repo, 'packages'))
  .filter((d) => fs.existsSync(path.join(repo, 'packages', d, 'package.json')));

const failures = [];
try {
  for (const p of packages)
    run('pnpm', ['pack', '--pack-destination', work], path.join(repo, 'packages', p));
  const app = path.join(work, 'app');
  fs.mkdirSync(app);
  fs.writeFileSync(path.join(app, 'package.json'), '{"name":"app","private":true,"type":"module"}');
  const tarballs = fs.readdirSync(work).filter((f) => f.endsWith('.tgz'));
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', ...tarballs.map((t) => path.join(work, t))],
    app,
  );

  // Resolve as the app would, from a file inside it.
  const probe = path.join(app, 'probe.mjs');
  fs.writeFileSync(probe, 'export const resolve = (s) => import.meta.resolve(s);\n');
  const { resolve } = await import(pathToFileURL(probe));

  for (const p of packages) {
    const name = `@trentesix/${p}`;
    const manifest = JSON.parse(
      fs.readFileSync(path.join(app, 'node_modules', name, 'package.json'), 'utf8'),
    );
    for (const [sub, target] of Object.entries(manifest.exports)) {
      if (sub.includes('*')) continue;
      const spec = sub === '.' ? name : `${name}/${sub.slice(2)}`;
      try {
        const url = resolve(spec);
        if (!fs.existsSync(fileURLToPath(url))) throw new Error('not in the tarball');
        if (/\.(m?js)$/.test(url) && !spec.endsWith('/stylelint')) await import(url);
        if (url.endsWith('.css')) checkCss(fileURLToPath(url), spec);
      } catch (e) {
        failures.push(`${spec} (${JSON.stringify(target)}): ${e.message}`);
      }
    }
  }

  function checkCss(file, from) {
    const css = fs.readFileSync(file, 'utf8');
    for (const [, spec] of css.matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
      try {
        const target = spec.startsWith('.')
          ? path.resolve(path.dirname(file), spec)
          : fileURLToPath(resolveFrom(file, spec));
        if (!fs.existsSync(target)) throw new Error('missing');
        checkCss(target, spec);
      } catch (e) {
        failures.push(`${from} imports ${spec}: ${e.message}`);
      }
    }
    for (const [, url] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      if (/^(data:|https?:|#)/.test(url)) continue;
      if (!fs.existsSync(path.resolve(path.dirname(file), url)))
        failures.push(`${from} needs ${url}: missing`);
    }
  }

  // A bare @import resolves from the stylesheet's own package, as a bundler does.
  function resolveFrom(file, spec) {
    const p = path.join(path.dirname(file), '__probe.mjs');
    fs.writeFileSync(p, 'export const r = (s) => import.meta.resolve(s);\n');
    return execFileSync(process.execPath, [
      '--input-type=module',
      '-e',
      `import { r } from ${JSON.stringify(pathToFileURL(p).href)}; process.stdout.write(r(${JSON.stringify(spec)}))`,
    ]).toString();
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`The packages as published don't work:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Smoke: ${packages.length} packages install, import and resolve every stylesheet.`);
