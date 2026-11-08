// The contrast checker's public API: ratio() and shown().
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ratio, shown } from '../packages/core/contrast.mjs';

test('black on white is 21:1, a colour on itself 1:1', () => {
  assert.equal(ratio('#000', '#fff'), 21);
  assert.equal(ratio('#ffffff', '#000000'), 21);
  assert.equal(ratio('#777', '#777'), 1);
});

test('every hex length and rgb() form gives the same white', () => {
  for (const white of [
    '#fff',
    '#ffff',
    '#ffffff',
    '#ffffffff',
    'rgb(255 255 255)',
    'rgb(255, 255, 255)',
    'rgba(255,255,255,1)',
    'rgb(100% 100% 100%)',
    'rgb(255 255 255 / 100%)',
  ])
    assert.equal(ratio(white, '#000'), 21, white);
});

test('a see-through foreground is laid over the background', () => {
  assert.equal(ratio('rgb(0 0 0 / 0)', '#fff'), 1);
  assert.ok(ratio('#00000080', '#fff') < ratio('#000', '#fff'));
});

test('colours it cannot measure throw instead of returning a wrong number', () => {
  for (const bad of ['#fffff', '#fffffff', 'rgb(1 2)', 'rgb(a b c)', 'hsl(0 0% 0%)', 'red'])
    assert.throws(() => ratio(bad, '#fff'), /Can't measure/, bad);
  assert.throws(() => ratio('#000', 'transparent'), /opaque/);
});

test('out-of-range channels are clamped', () => {
  assert.equal(ratio('rgb(300 300 300)', '#000'), 21);
});

test('shown() rounds down to one decimal', () => {
  assert.equal(shown(4.49), '4.4');
  assert.equal(shown(4.5), '4.5');
  assert.equal(shown(21), '21.0');
});
