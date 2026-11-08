// The shared stylelint config: what it flags and what it lets through. Run: pnpm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import stylelint from 'stylelint';
import config from '../packages/core/stylelint/index.js';

/** The rule names stylelint reports for a piece of CSS. */
async function flags(code) {
  const { results } = await stylelint.lint({ code, config });
  return results[0].warnings.map((w) => w.rule);
}

test('raw colours are flagged; variables, transparent and currentColor are not', async () => {
  assert.deepEqual(await flags('a { color: #3b2416; }'), ['color-no-hex']);
  assert.deepEqual(await flags('a { color: rebeccapurple; }'), ['color-named']);
  assert.deepEqual(await flags('a { color: rgb(0 0 0); }'), ['function-disallowed-list']);
  assert.deepEqual(await flags('a { color: oklch(0.5 0.1 30); }'), ['function-disallowed-list']);
  assert.deepEqual(
    await flags('a { color: var(--ink); border-color: transparent; fill: currentColor; }'),
    [],
  );
});

test('raw durations and curves in transitions and animations are flagged', async () => {
  assert.deepEqual(await flags('a { transition: opacity 300ms; }'), ['trentesix/motion-tokens']);
  assert.deepEqual(await flags('a { animation-duration: .3s; }'), ['trentesix/motion-tokens']);
  assert.deepEqual(await flags('a { transition-timing-function: cubic-bezier(0.2, 0, 0, 1); }'), [
    'trentesix/motion-tokens',
  ]);
  assert.deepEqual(await flags('a { animation: x var(--duration-pop) linear(0, 1); }'), [
    'trentesix/motion-tokens',
  ]);
});

test('0s, inherit and var(…) pass, fallbacks included', async () => {
  assert.deepEqual(
    await flags(
      'a { transition: opacity var(--duration-pop) var(--ease-glide, cubic-bezier(0.2, 0, 0, 1)) 0s; animation-duration: inherit; animation-delay: 0ms; }',
    ),
    [],
  );
});

test('"kill all motion" tricks are flagged', async () => {
  assert.ok(
    (await flags('* { animation-duration: 0.01ms !important; }')).includes(
      'trentesix/no-motion-kill',
    ),
  );
  assert.ok(
    (await flags('a { transition-duration: var(--x, 0.001s); }')).includes(
      'trentesix/no-motion-kill',
    ),
  );
  assert.deepEqual(
    await flags('@media (prefers-reduced-motion: reduce) { a { animation: none; } }'),
    ['trentesix/no-motion-kill'],
  );
  assert.deepEqual(
    await flags(":root[data-motion='reduce'] a { animation-iteration-count: 1 !important; }"),
    ['trentesix/no-motion-kill'],
  );
  // Outside reduced motion, none is a plain choice.
  assert.deepEqual(await flags('a { animation: none; }'), []);
});

test('keyframes that move need --travel', async () => {
  assert.deepEqual(await flags('@keyframes up { from { translate: 0 16px; } }'), [
    'trentesix/keyframes-travel',
  ]);
  assert.deepEqual(await flags('@keyframes grow { from { transform: scale(0.9); } }'), [
    'trentesix/keyframes-travel',
  ]);
  assert.deepEqual(
    await flags(
      '@keyframes up { from { translate: 0 calc(16px * var(--travel)); opacity: 0; } to { transform: none; } }',
    ),
    [],
  );
  // Fades and colours don't move anything.
  assert.deepEqual(await flags('@keyframes fade { from { opacity: 0; } }'), []);
});

test('the public arrival, leaving and flash pass when used the documented way', async () => {
  assert.deepEqual(
    await flags(
      'a { --enter-y: 8px; --enter-turn: -1deg; --enter-scale: 0.97; animation: trentesix-enter var(--motion-pop) var(--spring-pop) both; }',
    ),
    [],
  );
  assert.deepEqual(
    await flags(
      'a { --leave-y: 6px; animation: trentesix-leave var(--motion-snap) var(--ease-glide) forwards; }',
    ),
    [],
  );
  // A plain token as a delay is timing, not the fade.
  assert.deepEqual(
    await flags(
      'a { --flash: var(--mustard); animation: trentesix-flash var(--motion-linger) var(--ease-drift) var(--duration-drift) backwards, x var(--duration-glide) ease; }',
    ),
    [],
  );
  assert.deepEqual(
    await flags(
      'a { animation-name: trentesix-enter, own; animation-duration: var(--motion-settle), var(--duration-glide); }',
    ),
    [],
  );
});

test('moments.css keyframes with an uncapped or raw duration are flagged', async () => {
  assert.deepEqual(
    await flags('a { animation: trentesix-enter var(--spring-pop-duration) var(--spring-pop); }'),
    ['trentesix/motion-tokens'],
  );
  assert.deepEqual(await flags('a { animation: trentesix-flash var(--duration-glide) ease; }'), [
    'trentesix/motion-tokens',
  ]);
  assert.deepEqual(
    await flags('a { animation-name: trentesix-leave; animation-duration: var(--duration-snap); }'),
    ['trentesix/motion-tokens'],
  );
  assert.deepEqual(await flags('a { animation: trentesix-enter 300ms ease; }'), [
    'trentesix/motion-tokens',
  ]);
  // A keyframe of one's own that moves without --travel is still caught.
  assert.deepEqual(
    await flags(
      '@keyframes arrive { from { transform: translate(var(--enter-x), var(--enter-y)); } }',
    ),
    ['trentesix/keyframes-travel'],
  );
});
