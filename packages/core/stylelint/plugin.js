// Three rules for CSS written on @trentesix/core, so motion keeps to docs/motion.md:
//
// - trentesix/motion-tokens: transition and animation take their durations and curves from the
//   tokens. A raw "300ms" or "cubic-bezier(…)" is a value the looks and reduced motion can't reach.
//   And moments.css's keyframes (trentesix-enter, trentesix-flash…) last a capped duration, such as
//   var(--motion-pop), not var(--spring-pop-duration), so they stay short under reduced motion.
// - trentesix/no-motion-kill: no "animation-duration: 0.01ms" or "animation: none" for reduced
//   motion. Ending animations at once fires timers at once and closes toasts before anyone sees
//   them; moments.css reduces motion with --travel, --loop and --motion-cap instead.
// - trentesix/keyframes-travel: keyframes that move something multiply the move by --travel, which
//   is 0 under reduced motion, so the same keyframes just fade.
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages },
} = stylelint;

const MOTION_PROPS = /^(transition|animation)(-duration|-delay|-timing-function)?$/i;
// A time: 120ms, .3s, 1.5s. The lookbehind keeps it from matching inside names like "x2s".
const TIME = /(?<![\w.-])(\d*\.?\d+)(ms|s)\b/gi;
const ms = (n, unit) => (unit.toLowerCase() === 's' ? n * 1000 : n);

/** The value with every var(…) taken out, fallbacks included, since those come from tokens. */
function withoutVars(value) {
  let out = '';
  for (let i = 0; i < value.length;) {
    if (value.slice(i, i + 4).toLowerCase() !== 'var(') {
      out += value[i++];
      continue;
    }
    let depth = 0;
    for (; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')' && --depth === 0) break;
    }
    out += 'var';
    i++;
  }
  return out;
}

/** The value split at top-level commas or spaces, leaving what's inside brackets whole. */
function split(value, sep) {
  const parts = [''];
  let depth = 0;
  for (const c of value) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (depth === 0 && (sep === ',' ? c === ',' : /\s/.test(c))) parts.push('');
    else parts[parts.length - 1] += c;
  }
  return parts.map((p) => p.trim()).filter(Boolean);
}

// A duration token on its own: var(--duration-pop), var(--spring-settle-duration).
const UNCAPPED = /^var\(\s*--(duration-([a-z]+)|spring-([a-z]+)-duration)\s*[,)]/i;
// What an animation's duration can look like, so the first one in a layer is its duration and
// any after it its delay.
const TIMELIKE =
  /^((\d*\.?\d+)(ms|s)|(min|max|calc|clamp)\(|var\(\s*--([\w-]*duration[\w-]*|motion-[\w-]+|[\w-]*-time)\s*[,)])/i;

/** For each animation layer that plays one of moments.css's keyframes: its duration, if uncapped. */
function uncapped(layers) {
  const found = [];
  for (const layer of layers) {
    const words = split(layer, ' ');
    if (!words.some((w) => /^trentesix-[\w-]+$/i.test(w))) continue;
    const duration = words.find((w) => TIMELIKE.test(w));
    const m = duration?.match(UNCAPPED);
    if (m) found.push([duration, `--motion-${m[2] ?? m[3]}`]);
  }
  return found;
}

const motionTokens = 'trentesix/motion-tokens';
const motionTokensMessages = ruleMessages(motionTokens, {
  time: (t) =>
    `Raw duration "${t}": use a token, such as var(--duration-pop) or var(--spring-pop-duration)`,
  curve: (c) => `Raw curve "${c}(…)": use a token, such as var(--ease-glide) or var(--spring-pop)`,
  uncapped: (d, capped) =>
    `Uncapped "${d}" for a moments.css keyframe: use var(${capped}), which stays short under reduced motion`,
});

const motionTokensRule = (on) => (root, result) => {
  if (!on) return;
  root.walkDecls(MOTION_PROPS, (decl) => {
    const value = withoutVars(decl.value);
    if (/^\s*inherit\s*$/i.test(value)) return;
    for (const [t, n, unit] of value.matchAll(TIME))
      if (ms(+n, unit) !== 0)
        report({
          result,
          ruleName: motionTokens,
          node: decl,
          word: t,
          message: motionTokensMessages.time(t),
        });
    for (const [, fn] of value.matchAll(/\b(cubic-bezier|linear)\(/gi))
      report({
        result,
        ruleName: motionTokens,
        node: decl,
        word: fn,
        message: motionTokensMessages.curve(fn),
      });
    // animation, or animation-duration beside an animation-name, layer by layer.
    let layers = null;
    if (/^animation$/i.test(decl.prop)) layers = split(decl.value, ',');
    else if (/^animation-duration$/i.test(decl.prop)) {
      const names = decl.parent.nodes.findLast(
        (n) => n.type === 'decl' && /^animation-name$/i.test(n.prop),
      );
      if (names) {
        const durations = split(decl.value, ',');
        layers = split(names.value, ',').map((n, i) => `${n} ${durations[i % durations.length]}`);
      }
    }
    for (const [d, capped] of uncapped(layers ?? []))
      report({
        result,
        ruleName: motionTokens,
        node: decl,
        word: d,
        message: motionTokensMessages.uncapped(d, capped),
      });
  });
};

const noMotionKill = 'trentesix/no-motion-kill';
const noMotionKillMessages = ruleMessages(noMotionKill, {
  tiny: (t) =>
    `"${t}" ends the motion at once, timers and toasts included: reduce it with var(--travel), var(--loop) and var(--motion-cap)`,
  skip: (prop) =>
    `"${prop}: none" for reduced motion skips the moment: reduce it with var(--travel), var(--loop) and var(--motion-cap)`,
  important: (prop) =>
    `"${prop} … !important" for reduced motion overrides every moment: reduce it with var(--travel), var(--loop) and var(--motion-cap)`,
});

/** Inside @media (prefers-reduced-motion: reduce), or a rule for data-motion="reduce". */
function forReducedMotion(node) {
  for (let n = node.parent; n; n = n.parent) {
    if (n.type === 'atrule' && /prefers-reduced-motion\s*:\s*reduce/i.test(n.params)) return true;
    if (n.type === 'rule' && /data-motion=['"]?reduce/i.test(n.selector)) return true;
  }
  return false;
}

const noMotionKillRule = (on) => (root, result) => {
  if (!on) return;
  root.walkDecls(/^(transition|animation)/i, (decl) => {
    // Anything above zero and under 10ms is there to end the motion, not to time it. Fallbacks
    // count too: var(--x, 0.01ms) is the same trick.
    for (const [t, n, unit] of decl.value.matchAll(TIME)) {
      const v = ms(+n, unit);
      if (v > 0 && v < 10)
        report({
          result,
          ruleName: noMotionKill,
          node: decl,
          word: t,
          message: noMotionKillMessages.tiny(t),
        });
    }
    if (!forReducedMotion(decl)) return;
    if (
      /^(animation|animation-name|transition|transition-property)$/i.test(decl.prop) &&
      /^\s*none\s*$/i.test(decl.value)
    )
      report({
        result,
        ruleName: noMotionKill,
        node: decl,
        message: noMotionKillMessages.skip(decl.prop),
      });
    else if (decl.important)
      report({
        result,
        ruleName: noMotionKill,
        node: decl,
        message: noMotionKillMessages.important(decl.prop),
      });
  });
};

const keyframesTravel = 'trentesix/keyframes-travel';
const keyframesTravelMessages = ruleMessages(keyframesTravel, {
  moves: (name, props) =>
    `@keyframes ${name} moves (${props}) without --travel: multiply the distance, scale or turn by it, as in translate: 0 calc(16px * var(--travel))`,
});

// Values that move nothing, so they need no --travel: an identity, or a reset.
const STILL =
  /^(none|0|0px|0deg|0turn|1|1 1|0 0|0px 0px|translate\(0(px)?(, ?0(px)?)?\)|scale\(1\)|rotate\(0(deg|turn)?\))$/i;

// Reported once per @keyframes, on its first line, so one comment above it can explain an
// exception (a timer bar, a line drawing itself) for the whole animation.
const keyframesTravelRule = (on) => (root, result) => {
  if (!on) return;
  root.walkAtRules(/^(-webkit-)?keyframes$/i, (keyframes) => {
    const moving = new Set();
    keyframes.walkDecls(/^(transform|translate|scale|rotate)$/i, (decl) => {
      const value = decl.value.trim();
      if (STILL.test(value) || /calc\([^;]*var\(\s*--travel\s*\)/i.test(value)) return;
      moving.add(decl.prop);
    });
    if (moving.size)
      report({
        result,
        ruleName: keyframesTravel,
        node: keyframes,
        word: keyframes.params,
        message: keyframesTravelMessages.moves(keyframes.params, [...moving].join(', ')),
      });
  });
};

const rule = (name, fn, messages) => {
  fn.ruleName = name;
  fn.messages = messages;
  return createPlugin(name, fn);
};

export default [
  rule(motionTokens, motionTokensRule, motionTokensMessages),
  rule(noMotionKill, noMotionKillRule, noMotionKillMessages),
  rule(keyframesTravel, keyframesTravelRule, keyframesTravelMessages),
];
