#!/usr/bin/env node
// Builds every package's CSS and JS from its tokens. Run: pnpm build (or pnpm check, to fail when
// the committed files are out of date).
//
// - packages/core/tokens.json: the base every look starts from (spacing, radii, borders, motion,
//   families, the look variables). Written to core/base.css on :root.
// - packages/<look>/tokens.json: a look's colours, shadows and what differs. The default look
//   ("default": true, Discothèque) is written on :root, so a page that loads it and nothing else
//   wears it; every other look on [data-look='<id>'] (on <html>, or on any element so a part of a
//   page can wear it).
// - A look whose tokens say "temper": "calm" gets core's calm moments (packages/core/src/calm.css)
//   stamped into its moments.css, before its own (packages/<look>/src/moments.css).
//
// Every look gives values to the same variable names, so component CSS reads one set of names
// whatever the look.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { docTables, failures } from '../packages/core/contrast.mjs';
import { dtcg } from './dtcg.mjs';
import { cssData, htmlData } from './vscode.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const readText = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const HEADER = 'Generated from tokens.json by scripts/build.mjs. Do not edit.';
const check = process.argv.includes('--check');

const core = read('packages/core/tokens.json');
/** Every look in packages/, the default first, then by id. */
const looks = fs
  .readdirSync(path.join(root, 'packages'))
  .filter((d) => d !== 'core' && fs.existsSync(path.join(root, 'packages', d, 'tokens.json')))
  .map((id) => ({ id, tokens: read(`packages/${id}/tokens.json`) }))
  .sort(
    (a, b) =>
      Number(Boolean(b.tokens.default)) - Number(Boolean(a.tokens.default)) ||
      a.id.localeCompare(b.id),
  );
const defaults = looks.filter((l) => l.tokens.default);
if (defaults.length !== 1) throw new Error('Exactly one look must say "default": true');

const lower = (v) => String(v).replace(/#[0-9a-f]{3,8}\b/gi, (h) => h.toLowerCase());
const valueIn = (tok, theme, first) =>
  lower(typeof tok.value === 'string' ? tok.value : (tok.value[theme] ?? tok.value[first]));
/**
 * A spring (stiffness, damping, mass 1) as a CSS linear() curve and the time it takes to settle,
 * so springs need no script: transition: transform var(--spring-pop-duration) var(--spring-pop).
 */
function spring({ stiffness, damping }) {
  let x = 0;
  let v = 0;
  let t = 0;
  const dt = 1 / 240;
  const pts = [0];
  while (t < 2.5) {
    for (let i = 0; i < 4; i++) {
      v += (-stiffness * (x - 1) - damping * v) * dt;
      x += v * dt;
      t += dt;
    }
    pts.push(x);
    if (Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.02) break;
  }
  pts[pts.length - 1] = 1;
  const step = Math.max(1, Math.floor(pts.length / 40));
  const kept = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  return {
    ms: Math.round(t * 1000),
    easing: `linear(${kept.map((p) => +p.toFixed(3)).join(', ')})`,
  };
}
/** Motion tokens as CSS variables: --spring-<name> and --spring-<name>-duration, --ease-<name>, --duration-<name>. */
const motionVars = (motion) =>
  motion.tokens.flatMap((tok) => {
    if (tok.spring) {
      const s = spring(tok.spring);
      return [
        [`spring-${tok.name}`, s.easing],
        [`spring-${tok.name}-duration`, `${s.ms}ms`],
      ];
    }
    return [
      [`ease-${tok.name}`, tok.easing],
      [`duration-${tok.name}`, tok.duration],
    ];
  });

/**
 * A type scale as CSS variables: --text-<role> is a whole font value (style, weight, size, line
 * height and family), --text-<role>-tracking its letter spacing. A look's scale may name only the
 * roles it changes.
 */
const textVars = (scale = []) =>
  scale.flatMap((r) => [
    [
      `text-${r.name}`,
      `${r.style ? `${r.style} ` : ''}${r.weight} ${r.size}/${r.lineHeight} var(--font-${r.family})`,
    ],
    [`text-${r.name}-tracking`, r.tracking ?? '0'],
  ]);

const block = (decls, indent = '  ') => decls.map(([k, v]) => `${indent}--${k}: ${v};`).join('\n');

/**
 * What each stylesheet declares: declared.base.light is core/base.css; declared[look].light holds
 * a look's light block with the values that don't change, .dark its dark block. The contrast
 * check and the editor help read this, so they see exactly what the CSS says.
 */
const declared = {};

/** One light/dark layout for any selector: light, dark by system unless forced light, forced dark. */
function themed(look, sel, light, dark, plain = []) {
  plain = [...plain, ...labelText(plain)];
  plain = [...plain, ...derivedFor(look, light, plain)];
  declared[look] = {
    light: Object.fromEntries([...light, ...plain].map(([k, v]) => [k, v])),
    dark: Object.fromEntries(dark.map(([k, v]) => [k, v])),
  };
  return `${sel.light} {
${block(light)}
${block(plain)}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  ${sel.systemDark} {
${block(dark, '    ')}
    color-scheme: dark;
  }
}
${sel.dark} {
${block(dark)}
  color-scheme: dark;
}
`;
}

/**
 * Selectors for the default look: on :root, so a page that loads it and nothing else wears it, and
 * on [data-look='<id>'] so a part of any page can wear it. :root is less specific than the other
 * looks' :root[data-look=...], so they win on a page of their own.
 */
const onRoot = (id, light, dark) => ({
  light: `:root,\n[data-look='${id}']`,
  systemDark: `:root:not([data-theme='${light}']),
  :root:not([data-theme='${light}']) [data-look='${id}']:not([data-theme='${light}'])`,
  dark: `:root[data-theme='${dark}'],
:root[data-theme='${dark}'] [data-look='${id}']:not([data-theme='${light}']),
[data-look='${id}'][data-theme='${dark}']`,
});
/**
 * Selectors for a look that is set with data-look: on <html>, or on any element so a part of a
 * page can wear it whatever the page's look. Its theme is its own data-theme when it has one, the
 * page's otherwise.
 */
const scoped = (id, light, dark) => ({
  light: `:root[data-look='${id}'],\n[data-look='${id}']`,
  systemDark: `:root[data-look='${id}']:not([data-theme='${light}']),
  :root:not([data-theme='${light}']) [data-look='${id}']:not([data-theme='${light}'])`,
  dark: `:root[data-look='${id}'][data-theme='${dark}'],
:root[data-theme='${dark}'] [data-look='${id}']:not([data-theme='${light}']),
[data-look='${id}'][data-theme='${dark}']`,
});

const files = {};

/**
 * Base tokens written with var(): a custom property holding var() is resolved where it is declared,
 * so on :root it would keep the page look's values inside a part wearing another look. Every look
 * therefore re-declares those that read a variable some look sets (colours, shadows, families,
 * look variables...), unless it sets the token itself. Filled in as the base is built; the names
 * looks set are gathered on a first pass (see below).
 */
let derivedBase = [];
let lookNames = new Set();
const baseValues = new Map();
const varsIn = (v) => [...String(v).matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]);
const derivedFor = (id, light, plain) => {
  const own = new Set([...light, ...plain].map(([k]) => k));
  const ids = looks.map((l) => l.id);
  // Things inherited from the page that a part must not keep: tokens another look sets and this
  // one doesn't go back to the base's value, or to unset (so a var() fallback applies). Tokens
  // named for another look (--folio-*) are only read by that look's own rules.
  const leaks = [...lookNames]
    .filter((n) => !own.has(n) && !ids.some((o) => o !== id && n.startsWith(`${o}-`)))
    .map((n) => [n, baseValues.has(n) ? baseValues.get(n) : 'initial']);
  const done = new Set(leaks.map(([k]) => k));
  const derived = derivedBase.filter(
    ([k, v]) => !own.has(k) && !done.has(k) && varsIn(v).some((n) => lookNames.has(n)),
  );
  return [...derived, ...leaks];
};
/** --text-label follows the look's own label tokens, unless its type scale names the role. */
const labelText = (plain) => {
  const get = (n) => plain.find(([k]) => k === n)?.[1];
  if (plain.some(([k]) => k === 'text-label') || get('label-size') === undefined) return [];
  const role = core.type.scale.find((r) => r.name === 'label');
  return [
    [
      'text-label',
      `${get('label-weight')} ${get('label-size')}/${role.lineHeight} var(--font-body)`,
    ],
    ['text-label-tracking', get('label-tracking')],
  ];
};

// ── Core: base.css ───────────────────────────────────────────────────────────────────────────────
const baseColors = new Set(
  // Every look must give a value to every colour the default look names.
  defaults[0].tokens.color.tokens.map((t) => t.name),
);
{
  const plain = [
    ...['spacing', 'radius', 'border', 'duration', 'easing']
      .flatMap((k) => core[k]?.tokens ?? [])
      .map((tok) => [tok.name, tok.value]),
    ...Object.entries(core.type.families).map(([k, v]) => [`font-${k}`, v]),
    ...motionVars(core.motion),
    ...core.look.values.map((v) => [v.name, v.value]),
    ...textVars(core.type.scale),
    ...core.layout.tokens.map((t) => [t.name, t.value]),
  ];
  declared.base = { light: Object.fromEntries(plain), dark: {} };
  derivedBase = plain.filter(([, v]) => varsIn(v).length);
  for (const [k, v] of plain) baseValues.set(k, v);
  const bp = Object.fromEntries(core.layout.breakpoints.map((b) => [b.name, b.value]));
  // Layout values that change with the window: the gutter widens from its breakpoint.
  const wider = core.layout.tokens
    .filter((t) => t.wide)
    .map(
      (t) => `@media (width >= ${bp[t.from]}px) {\n  :root {\n    --${t.name}: ${t.wide};\n  }\n}`,
    )
    .join('\n');
  files['packages/core/base.css'] =
    `/* The base every look starts from: spacing, radii, borders, motion, families and the look
   variables, on :root. Load it before a look. ${HEADER} */
:root {
${block(plain)}
}
${wider}
`;
}

// ── Folio's mapping: its own token names onto the shared ones ───────────────────────────────────
function folioCss({ id, tokens: folio }) {
  const [light, dark] = folio.color.themes.map((x) => x.id);
  const color = Object.fromEntries(folio.color.tokens.map((t) => [t.name, t]));
  const shadow = Object.fromEntries(folio.shadow.tokens.map((t) => [t.name, t]));
  const c = (name, theme) => valueIn(color[name], theme, light);
  const s = (name, theme) => valueIn(shadow[name], theme, light);

  // Shared variable → Folio colour token (Folio › Implementation › Token mapping).
  const colorMap = {
    paper: 'canvas',
    'paper-raised': 'surface',
    'paper-sunk': 'surface-sunk',
    'paper-tint': 'surface-hover',
    field: 'field',
    ink: 'text',
    'ink-muted': 'text-muted',
    'ink-subtle': 'text-subtle',
    rule: 'border',
    'ink-line': 'border-strong',
    chocolate: 'surface',
    'chocolate-soft': 'surface',
    'on-chocolate': 'text',
    'on-chocolate-muted': 'text-muted',
    code: 'code',
    'on-code': 'code-text',
    'on-code-muted': 'code-text-muted',
    'code-rule': 'code-border',
    'code-keyword': 'code-keyword',
    'code-string': 'code-string',
    'code-function': 'code-function',
    'code-focus': 'code-focus',
    mustard: 'accent-soft',
    'on-mustard': 'accent-text',
    'mustard-soft': 'warning-soft',
    'panel-highlight': 'accent-soft',
    'on-panel-highlight': 'accent-text',
    orange: 'accent',
    action: 'accent',
    'on-action': 'on-accent',
    rust: 'danger',
    'rust-soft': 'danger-soft',
    avocado: 'success',
    success: 'success',
    'success-soft': 'success-soft',
    'warning-ink': 'warning',
    teal: 'info',
    'teal-soft': 'info-soft',
    plum: 'presence-6',
    focus: 'focus',
    'on-plum': 'on-presence',
    'on-avocado': 'on-success',
  };
  const missing = [...baseColors].filter((n) => !(n in colorMap));
  if (missing.length) throw new Error(`No Folio value for colour(s): ${missing.join(', ')}`);

  const colorsIn = (theme) => [
    ...Object.entries(colorMap).map(([shared, folioName]) => [shared, c(folioName, theme)]),
    ['shadow-press', s('shadow-xs', theme)],
    ['shadow-lift', s('shadow-s', theme)],
    ['shadow-dialog', s('shadow-l', theme)],
    ['shadow-drag', s('shadow-drag', theme)],
    ['shadow-highlight', `0 0 0 3px ${c('accent-soft', theme)}`],
    // A highlighted panel is a tinted surface in Folio; shadows are for things that float.
    ['shadow-panel-highlight', 'none'],
    // Folio's own names, for the few component rules that differ by more than colour.
    ...folio.color.tokens.map((t) => [`folio-${t.name}`, c(t.name, theme)]),
    ...folio.shadow.tokens.map((t) => [`folio-${t.name}`, s(t.name, theme)]),
  ];

  const sans = `'IBM Plex Sans Variable', ${folio.type.families.sans}`;
  const plain = [
    ['radius-s', '4px'],
    ['radius-m', '6px'],
    ['radius-l', '8px'],
    ['radius-xl', '12px'],
    ['border-object', '1px'],
    ['border-strong', '1px'],
    ['stripe-band', '0px'],
    ['duration-snap', '100ms'],
    ['duration-pop', '150ms'],
    ['duration-glide', '250ms'],
    ['duration-drift', '400ms'],
    ['ease-spring', 'cubic-bezier(0.2, 0, 0, 1)'],
    ['ease-glide', 'cubic-bezier(0.2, 0, 0, 1)'],
    ['ease-drift', 'cubic-bezier(0.2, 0, 0, 1)'],
    ...motionVars(folio.motion),
    ['font-display', sans],
    ['font-body', sans],
    ['font-mono', folio.type.families.mono],
    ['font-celebrate', sans],
    ['font-empty', sans],
    ['outline', 'var(--folio-border)'],
    ['outline-control', 'var(--folio-border-strong)'],
    ['outline-field', 'var(--ink-line)'],
    ['outline-field-active', 'var(--folio-accent)'],
    ['border-field', '1px'],
    ['divider', '1px solid var(--rule)'],
    ['focus-ring', '2px'],
    // The gap between ring and control, in the page colour: the ring reads on --inverse too.
    ['focus-edge', 'var(--paper)'],
    ['press', '0px'],
    ['lift', '0px'],
    ['radius-button', '6px'],
    ['radius-badge', '4px'],
    ['label-size', '13px'],
    ['label-weight', '500'],
    ['label-tracking', '0'],
    ['label-case', 'none'],
    ['field-label-size', '13px'],
    ['field-label-tracking', '0'],
    ['field-label-case', 'none'],
    ['label-color', 'var(--ink)'],
    // Dialog backdrops: the default look tints chocolate in each rule; Folio dims with its overlay.
    ['backdrop', 'var(--folio-overlay)'],
    // Type sizes: component CSS writes "font-size: var(--fs-page, <default size>)", so these exist
    // only in Folio and the default keeps its own sizes untouched.
    ['fs-hero', '28px'],
    ['fs-poster', '48px'],
    ['fs-entry', '26px'],
    ['fs-page', '22px'],
    ['fs-num', '20px'],
    ['fs-section', '16px'],
    ['fs-field', '16px'],
    ['fs-sub', '15px'],
    ['fs-mark', '15px'],
    ['fs-item', '14px'],
    // Body sizes one notch denser and no weight above 600 (Folio › Foundations › Typography).
    ['fs-18', '16px'],
    ['fs-17', '15px'],
    ['fs-16', '14px'],
    ['fs-15', '14px'],
    ['fs-14', '13px'],
    ['fw-bold', '600'],
    ['fw-heavy', '600'],
    ['fs-dialog', '18px'],
    // Corners written as literals in component CSS, scaled to Folio's radii.
    ['r-22', '8px'],
    ['r-16', '8px'],
    ['r-12', '6px'],
    ['r-10', '6px'],
    ['r-9', '4px'],
    ['fs-empty', '16px'],
    ['fw-empty', '600'],
    ['ui-size', '14px'],
    ['link', 'var(--folio-accent-text)'],
    ['inverse', 'var(--folio-inverse)'],
    ['on-inverse', 'var(--folio-on-inverse)'],
    ['on-inverse-accent', 'var(--folio-on-inverse-accent)'],
    ['on-chocolate-accent', 'var(--folio-accent-text)'],
    ['selected-soft', 'var(--folio-accent-soft)'],
    ...textVars(folio.type.scale),
    ['temper', folio.temper],
  ];
  return themed(id, scoped(id, light, dark), colorsIn(light), colorsIn(dark), plain);
}

// ── Looks written in the shared names (Discothèque, Devis, Relais): their tokens go straight in ──
function sharedNamesCss({ id, tokens: look }) {
  const [light, dark] = look.color.themes.map((x) => x.id);
  const own = new Set(look.color.tokens.map((t) => t.name));
  const missing = [...baseColors].filter((n) => !own.has(n));
  if (missing.length) throw new Error(`No ${look.name} value for colour(s): ${missing.join(', ')}`);
  const colors = [...look.color.tokens, ...(look.shadow?.tokens ?? [])];
  const vars = (theme) => colors.map((tok) => [tok.name, valueIn(tok, theme, light)]);
  const plain = [
    ...Object.entries(look.type?.families ?? {}).map(([k, v]) => [`font-${k}`, v]),
    ...(look.motion ? motionVars(look.motion) : []),
    ...Object.entries(look.look?.values ?? {}),
    ...textVars(look.type?.scale),
    ['temper', look.temper],
  ];
  const sel = look.default ? onRoot(id, light, dark) : scoped(id, light, dark);
  return themed(id, sel, vars(light), vars(dark), plain);
}

// First pass, to learn which names looks set (derived base tokens are left out); then for real.
const cssOf = (look) => (look.id === 'folio' ? folioCss(look) : sharedNamesCss(look));
{
  const real = derivedBase;
  derivedBase = [];
  for (const look of looks) cssOf(look);
  lookNames = new Set(looks.flatMap((l) => Object.keys(declared[l.id].light)));
  derivedBase = real;
}
const calmTemplate = readText('packages/core/src/calm.css').replace(/^\/\*[\s\S]*?\*\/\s*/, '');
for (const look of looks) {
  const { id, tokens } = look;
  if (!['calm', 'lively'].includes(tokens.temper))
    throw new Error(`${id}: "temper" is "calm" or "lively"`);
  files[`packages/${id}/look.css`] = `/* ${tokens.name}. ${HEADER} */
${cssOf(look)}`;

  // Moments: the calm rules first for a calm look, then the look's own.
  const own = readText(`packages/${id}/src/moments.css`);
  const calm =
    tokens.temper === 'calm'
      ? `/* The calm rules, from @trentesix/core (packages/core/src/calm.css). */\n${calmTemplate.replaceAll('__look__', id)}\n`
      : '';
  files[`packages/${id}/moments.css`] =
    `/* ${tokens.name}'s moments, after @trentesix/core/moments.css. ${HEADER} */
${calm}${own}`;

  // Everything for a page that wears this look, in order.
  files[`packages/${id}/all.css`] =
    `/* ${tokens.name}, whole: the base, the look, its fonts and the moments. ${HEADER} */
@import '@trentesix/core/base.css';
@import './look.css';
@import './fonts.css';
@import '@trentesix/core/moments.css';
@import './moments.css';
`;
}

// ── Scripts: each package's tokens.js and tokens.d.ts ──────────────────────────────────────────
const ms = (v) => Number(String(v).replace('ms', ''));
const curve = (v) => v.match(/[\d.]+/g).map(Number);
const js = (name, v, doc) =>
  `${doc ? `/** ${doc} */\n` : ''}export const ${name} = ${JSON.stringify(v, null, 2)};\n`;
const dts = (values) =>
  Object.entries(values)
    .map(([k, v]) => `export declare const ${k}: ${JSON.stringify(v)};`)
    .join('\n');
const springsOf = (motion) =>
  Object.fromEntries(
    motion.tokens.map((tok) => [
      tok.name,
      tok.spring
        ? { ...tok.spring, duration: spring(tok.spring).ms, easing: spring(tok.spring).easing }
        : { duration: ms(tok.duration), easing: tok.easing },
    ]),
  );
{
  const named = (group, prefix) =>
    Object.fromEntries(group.tokens.map((x) => [x.name.replace(prefix, ''), x]));
  const values = {
    duration: Object.fromEntries(
      Object.entries(named(core.duration, 'duration-')).map(([k, x]) => [k, ms(x.value)]),
    ),
    easing: Object.fromEntries(
      Object.entries(named(core.easing, 'ease-')).map(([k, x]) => [k, curve(x.value)]),
    ),
  };
  values.breakpoints = Object.fromEntries(core.layout.breakpoints.map((b) => [b.name, b.value]));
  files['packages/core/tokens.js'] = `// ${HEADER}
${js('duration', values.duration, 'The base durations, in ms.')}
${js('easing', values.easing, 'The base cubic-bezier curves.')}
${js('breakpoints', values.breakpoints, 'Window widths, in px: small (phones end), medium, large, wide. For media queries in scripts; CSS writes them as numbers.')}`;
  files['packages/core/tokens.d.ts'] = `// ${HEADER}\n${dts(values)}\n`;
}
for (const { id, tokens } of looks) {
  const values = {
    look: {
      id,
      name: tokens.name,
      default: Boolean(tokens.default),
      temper: tokens.temper,
      themes: tokens.color.themes,
    },
    motion: springsOf(tokens.motion ?? core.motion),
  };
  if (id === 'folio') {
    const tok = (fam, name) => tokens[fam].tokens.find((x) => x.name === name).value;
    values.folioMotion = {
      duration: Object.fromEntries(
        tokens.duration.tokens.map((x) => [x.name.replace('duration-', ''), ms(x.value)]),
      ),
      standard: curve(tok('easing', 'ease-standard')),
      exit: curve(tok('easing', 'ease-exit')),
    };
  }
  files[`packages/${id}/tokens.js`] = `// ${HEADER}
${js('look', values.look, `${tokens.name}: its id (the data-look value), name, temper and themes.`)}
${js('motion', values.motion, 'Its springs and the pen: duration in ms and a CSS easing (springs as linear()).')}
${values.folioMotion ? js('folioMotion', values.folioMotion, "Folio's motion: tweens only, no overshoot.") : ''}`;
  files[`packages/${id}/tokens.d.ts`] = `// ${HEADER}\n${dts(values)}\n`;
}

// ── Contrast: core/contrast.json, measured on what the stylesheets above declare ───────────────
const lookInfo = looks.map(({ id, tokens }) => ({
  id,
  name: tokens.name,
  themes: tokens.color.themes.map((t) => t.id),
  themeName: Object.fromEntries(tokens.color.themes.map((t) => [t.id, t.name])),
}));
const contrast = read('packages/core/contrast.json');
const contrastFailures = failures(declared, contrast.pairs, lookInfo);
{
  // The tables in core's docs/foundations.md are written from the same list, between markers, so the
  // docs can't drift from what pnpm check enforces.
  const file = 'packages/core/docs/foundations.md';
  const doc = readText(file);
  const { safe, avoid } = docTables(declared, contrast, lookInfo);
  const between = (text, name, body) => {
    const start = `<!-- ${name}: written by pnpm build from packages/core/contrast.json -->`;
    const end = `<!-- /${name} -->`;
    const a = text.indexOf(start);
    const b = text.indexOf(end);
    if (a < 0 || b < a) throw new Error(`${file} needs the markers ${start} and ${end}`);
    return `${text.slice(0, a + start.length)}\n\n${body}\n\n${text.slice(b)}`;
  };
  files[file] = between(between(doc, 'contrast-pairs', safe), 'contrast-avoid', avoid);
}

// ── Editor help: core/vscode/*.json ─────────────────────────────────────────────────────────────
{
  // Every variable's usage note: from the token JSON, or written here for the few a look adds.
  const usage = {};
  const note = (name, text) => {
    if (text && !(name in usage)) usage[name] = text;
  };
  const byId = Object.fromEntries(looks.map((l) => [l.id, l.tokens]));
  for (const k of ['spacing', 'radius', 'border', 'duration', 'easing'])
    for (const tok of core[k]?.tokens ?? []) note(tok.name, tok.usage);
  for (const look of looks)
    for (const k of ['color', 'shadow'])
      for (const tok of look.tokens[k]?.tokens ?? []) note(tok.name, tok.usage);
  for (const v of core.look.values) note(v.name, v.usage);
  for (const r of core.type.scale) {
    note(
      `text-${r.name}`,
      `${r.usage} A whole font value: write \`font: var(--text-${r.name})\`, with \`letter-spacing: var(--text-${r.name}-tracking)\`.`,
    );
    note(`text-${r.name}-tracking`, `Letter spacing for --text-${r.name}.`);
  }
  for (const t of core.layout.tokens) note(t.name, t.usage);
  note(
    'temper',
    'How the look moves: `lively` or `calm`. The motion helper and the calm moments read it; set by the look.',
  );
  const families = {
    display: 'Display type: page and entry titles, headings.',
    body: 'Body and UI text.',
    mono: 'Code, ids, keys and keyboard hints.',
    celebrate: 'Celebrations only; at most once per session.',
    empty: 'Empty states.',
    typewriter: 'Memo-style cards.',
  };
  for (const k of Object.keys(core.type.families)) note(`font-${k}`, families[k]);
  note(
    'font-money',
    'Devis only: quote titles and money totals. Write `font-family: var(--font-money, var(--font-display))` so other looks keep their display face.',
  );
  note(
    'font-letter',
    'Relais only: the text of messages people send and reply. Write `font-family: var(--font-letter, var(--font-body))` so other looks keep their body face.',
  );
  note(
    'font-mark',
    'Relais only: the wordmark and stamps. Write `font-family: var(--font-mark, var(--font-display))` so other looks keep their display face.',
  );
  note(
    'postmark-rest',
    '`postmark` moment setting: how faint the mark settles after pressing in (0.72 in Relais).',
  );
  note(
    'relais-airmail',
    'Relais only: the airmail stripe, a whole background value. Use it on a band --stripe-band tall.',
  );
  for (const motion of [core.motion, ...looks.map((l) => l.tokens.motion).filter(Boolean)])
    for (const tok of motion.tokens) {
      if (tok.spring) {
        note(
          `spring-${tok.name}`,
          `${tok.usage} A spring as a CSS \`linear()\` curve; pair it with \`--spring-${tok.name}-duration\`.`,
        );
        note(`spring-${tok.name}-duration`, `How long the ${tok.name} spring takes to settle.`);
      } else {
        note(`ease-${tok.name}`, tok.usage);
        note(`duration-${tok.name}`, tok.usage);
      }
    }
  if (byId.folio) {
    for (const tok of [...byId.folio.color.tokens, ...byId.folio.shadow.tokens])
      note(`folio-${tok.name}`, `Folio only. ${tok.usage}`);
    note(
      'backdrop',
      'The dimmed backdrop behind dialogs. Folio only; the default look tints each backdrop in its own rule.',
    );
    for (const name of Object.keys(declared.folio.light)) {
      if (/^fs-/.test(name))
        note(
          name,
          `Folio only: the size Folio uses where component CSS writes \`font-size: var(--${name}, …)\` with the default size as the fallback.`,
        );
      if (/^fw-/.test(name))
        note(
          name,
          `Folio only: the weight Folio uses where component CSS writes \`font-weight: var(--${name}, …)\` with the default weight as the fallback.`,
        );
      if (/^r-/.test(name))
        note(
          name,
          `Folio only: Folio's corner where component CSS writes \`border-radius: var(--${name}, ${name.slice(2)}px)\`.`,
        );
    }
  }
  const momentsCss = [
    readText('packages/core/moments.css'),
    readText('packages/core/src/calm.css'),
    ...looks.map((l) => readText(`packages/${l.id}/src/moments.css`)),
  ].join('\n');
  const motionMd = readText('packages/core/docs/motion.md');
  const htmlLooks = looks.map(({ id, tokens }) => ({
    id,
    name: tokens.name,
    themes: tokens.color.themes,
  }));
  files['packages/core/vscode/css-custom-data.json'] = JSON.stringify(
    cssData({ declared, usage, momentsCss, looks: lookInfo }),
  );
  files['packages/core/vscode/html-custom-data.json'] = JSON.stringify(
    htmlData({ momentsCss, motionMd, looks: htmlLooks }),
  );

  // ── Design tools: each look's dtcg/<theme>.tokens.json (scripts/dtcg.mjs) ──────────────────────
  for (const info of lookInfo) {
    const [light, dark] = info.themes;
    const lightValues = { ...declared.base.light, ...declared[info.id].light };
    const byTheme = { [light]: lightValues, [dark]: { ...lightValues, ...declared[info.id].dark } };
    for (const theme of info.themes)
      files[`packages/${info.id}/dtcg/${theme}.tokens.json`] = JSON.stringify(
        dtcg({ values: byTheme[theme], usage, look: info, theme }),
      );
  }
}

const prettierConfig = await prettier.resolveConfig(path.join(root, 'package.json'));
const stale = [];
for (const [file, raw] of Object.entries(files)) {
  const text = await prettier.format(raw, { ...prettierConfig, filepath: file });
  const target = path.join(root, file);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (current === text) continue;
  if (check) stale.push(file);
  else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
}
if (check && stale.length) console.error(`Out of date: ${stale.join(', ')}. Run pnpm build.`);
else console.log(check ? 'Up to date.' : `Written: ${Object.keys(files).length} files`);
// The files are written even when a pair fails, so the docs show the failing ratios too.
if (contrastFailures) {
  console.error(
    `\nThese colour pairs are below their minimum contrast (packages/core/contrast.json):\n\n${contrastFailures}\n`,
  );
  process.exitCode = 1;
} else console.log(`Contrast: all ${contrast.pairs.length} pairs pass in every look and theme.`);
if (check && stale.length) process.exitCode = 1;
