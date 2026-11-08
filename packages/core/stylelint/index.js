// The shared stylelint config for CSS written on @trentesix/core. Extend it:
//
//   export default { extends: ['@trentesix/core/stylelint'] };
//
// It turns on nothing about style or formatting, only the rules that keep colour and motion on
// the tokens. Colour values belong in token files; an app that keeps its own turns these rules off
// for those files with an override (see the README).
import plugins from './plugin.js';

const colour = 'Use a colour variable from @trentesix/core, such as var(--ink) or var(--paper)';

export default {
  plugins,
  rules: {
    // Raw colours: hex, named and colour functions. transparent and currentColor aren't flagged.
    'color-no-hex': [true, { message: `Raw hex colour: ${colour.toLowerCase()}` }],
    'color-named': ['never', { message: `Named colour: ${colour.toLowerCase()}` }],
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
      { message: (fn) => `Raw colour ${fn}(…): ${colour.toLowerCase()}` },
    ],
    'trentesix/motion-tokens': true,
    'trentesix/no-motion-kill': true,
    'trentesix/keyframes-travel': true,
  },
};
