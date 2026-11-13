// The design-tool files (each look's dtcg/<theme>.tokens.json) are well-formed DTCG: every token
// has a type and a value of that type's shape, every alias points at a token in the same file,
// and the colours match what the look's CSS declares. Run: pnpm test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const looks = fs
  .readdirSync(path.join(root, 'packages'))
  .filter((d) => fs.existsSync(path.join(root, 'packages', d, 'dtcg')));

const isDim = (v) => typeof v?.value === 'number' && ['px', 'rem'].includes(v.unit);
const isColor = (v) =>
  v?.colorSpace === 'srgb' &&
  v.components.length === 3 &&
  v.components.every((c) => c >= 0 && c <= 1) &&
  v.alpha >= 0 &&
  v.alpha <= 1 &&
  /^#[0-9a-f]{6}$/.test(v.hex);
const SHAPES = {
  color: isColor,
  dimension: isDim,
  duration: (v) => typeof v?.value === 'number' && v.unit === 'ms',
  cubicBezier: (v) => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number'),
  fontFamily: (v) => Array.isArray(v) && v.every((f) => typeof f === 'string' && f),
  shadow: (v) =>
    [v]
      .flat()
      .every(
        (s) =>
          (isColor(s.color) || typeof s.color === 'string') &&
          ['offsetX', 'offsetY', 'blur', 'spread'].every((k) => isDim(s[k])),
      ),
  typography: (v) =>
    isDim(v.fontSize) &&
    typeof v.fontWeight === 'number' &&
    typeof v.lineHeight === 'number' &&
    isDim(v.letterSpacing) &&
    // The family is the look's own font token, so changing a family changes every role using it.
    typeof v.fontFamily === 'string',
};

for (const look of looks)
  for (const file of fs.readdirSync(path.join(root, 'packages', look, 'dtcg')))
    test(`${look}/dtcg/${file}`, () => {
      const doc = JSON.parse(fs.readFileSync(path.join(root, 'packages', look, 'dtcg', file)));
      const tokens = Object.entries(doc)
        .filter(([g]) => !g.startsWith('$'))
        .flatMap(([g, group]) => Object.entries(group).map(([n, t]) => [`${g}.${n}`, t]));
      const byPath = Object.fromEntries(tokens);
      const aliases = [];
      const check = (where, v, type) => {
        if (typeof v === 'string' && /^\{.+\}$/.test(v)) {
          const target = byPath[v.slice(1, -1)];
          assert.ok(target, `${where}: ${v} points at nothing`);
          if (type) assert.equal(target.$type, type, `${where}: ${v} is a ${target.$type}`);
          aliases.push(v);
          return true;
        }
        return false;
      };
      assert.ok(tokens.length > 50, 'has its tokens');
      for (const [p, t] of tokens) {
        assert.ok(SHAPES[t.$type], `${p}: unknown $type ${t.$type}`);
        if (check(p, t.$value, t.$type)) continue;
        assert.ok(SHAPES[t.$type](t.$value), `${p}: not a ${t.$type}: ${JSON.stringify(t.$value)}`);
        if (t.$type === 'typography') check(`${p}.fontFamily`, t.$value.fontFamily, 'fontFamily');
        if (t.$type === 'shadow')
          for (const s of [t.$value].flat()) check(`${p}.color`, s.color, 'color');
      }
      // Every role the components read is there.
      for (const p of ['color.paper', 'color.ink', 'color.focus', 'typography.text-body'])
        assert.ok(byPath[p], `${p} is exported`);

      // The paper colour is the one the look's CSS declares for this theme.
      const theme = file.replace('.tokens.json', '');
      const css = fs.readFileSync(path.join(root, 'packages', look, 'look.css'), 'utf8');
      const paper = [...css.matchAll(/--paper: (#[0-9a-f]+);/g)].map((m) => m[1]);
      assert.equal(byPath['color.paper'].$value.hex, theme === 'light' ? paper[0] : paper[1]);
    });
