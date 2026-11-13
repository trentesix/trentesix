// VS Code custom data: hover notes and completions for every CSS variable the package sets and
// for the moment attributes. build.mjs writes them to vscode/, so they change with the tokens.
import { resolve, variablesIn } from '../packages/core/contrast.mjs';

const md = (value) => ({ kind: 'markdown', value });

/** A value short enough for a hover: springs are long linear() lists. */
function brief(value) {
  const points = value.match(/^linear\((.*)\)$/);
  if (points) return `linear(…) (${points[1].split(',').length} points)`;
  return value.length > 70 ? `${value.slice(0, 67)}…` : value;
}

/** "`raw`", or "`raw` → `resolved`" when the value refers to other variables. */
function shownValue(vars, value) {
  let resolved;
  try {
    resolved = resolve(vars, value);
  } catch {
    resolved = value;
  }
  const raw = `\`${brief(value)}\``;
  return resolved === value ? raw : `${raw} → \`${brief(resolved)}\``;
}

/** One line per look, light and dark folded together when they agree. */
function valuesPerLook(declared, name, looks) {
  const lines = [];
  for (const look of looks) {
    const per = look.themes.map((theme) => {
      const vars = variablesIn(declared, look.id, theme);
      return name in vars ? shownValue(vars, vars[name]) : null;
    });
    if (per.every((v) => v === null)) continue;
    const [light, dark] = per.map((v) => v ?? 'not set');
    const [lightName, darkName] = look.themes.map((t) => look.themeName[t]);
    lines.push(
      light === dark
        ? `- ${look.name}: ${light}`
        : `- ${look.name}: ${lightName} ${light}, ${darkName} ${dark}`,
    );
  }
  return lines.join('\n');
}

/**
 * The variables moments.css reads or sets that aren't tokens. Names starting --m- are internal and
 * left out on purpose, so editors don't suggest them.
 */
const MOTION_VARIABLES = {
  travel: [
    'Reduced motion: 1 normally, 0 under reduced motion. Multiply distances, scales and turns by it, inside a calc().',
    '`1`, `0` under reduced motion',
  ],
  loop: [
    'Reduced motion: the iteration count for anything that repeats. `infinite` normally, `1` under reduced motion.',
    '`infinite`, `1` under reduced motion',
  ],
  'motion-cap': [
    'Reduced motion: the longest a fade or drawn line may last. Use `min(var(--duration-pop), var(--motion-cap))`.',
    '`100s`, `200ms` under reduced motion',
  ],
  'motion-snap': [
    '`--duration-snap` capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-pop': [
    '`--spring-pop-duration` (pairs with `--spring-pop`) capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-settle': [
    '`--spring-settle-duration` (pairs with `--spring-settle`) capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-glide': [
    '`--duration-glide` capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-drift': [
    '`--duration-drift` capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-pen': [
    '`--duration-pen` capped by `--motion-cap`: the duration for an animation that fades or draws, such as `trentesix-enter`.',
    'the token, `200ms` at most under reduced motion',
  ],
  'motion-linger': [
    'Three drifts, capped by `--motion-cap`: how long something you just changed stays marked (`trentesix-flash`).',
    '`calc(var(--duration-drift) * 3)`, `200ms` at most under reduced motion',
  ],
  flash: [
    'The fill of `trentesix-flash` and the `flash` moment, for something you just changed. Set it on the element, or on a part of the page.',
    'Discothèque `color-mix(in srgb, var(--mustard) 40%, transparent)`, Folio `var(--folio-accent-soft)`, Relais `var(--selected-soft)`',
  ],
  'enter-x': [
    '`trentesix-enter` comes in from an offset along x, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0px`',
  ],
  'enter-y': [
    '`trentesix-enter` comes in from an offset along y, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0px`',
  ],
  'enter-scale': [
    '`trentesix-enter` comes in from a scale, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`1`',
  ],
  'enter-turn': [
    '`trentesix-enter` comes in from a turn, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0deg`',
  ],
  'enter-opacity': [
    '`trentesix-enter` comes in from an opacity. Set it on the element that animates: it does not inherit.',
    '`0`',
  ],
  'leave-x': [
    '`trentesix-leave` goes out to an offset along x, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0px`',
  ],
  'leave-y': [
    '`trentesix-leave` goes out to an offset along y, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0px`',
  ],
  'leave-scale': [
    '`trentesix-leave` goes out to a scale, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`1`',
  ],
  'leave-turn': [
    '`trentesix-leave` goes out to a turn, times `--travel`. Set it on the element that animates: it does not inherit.',
    '`0deg`',
  ],
  'leave-opacity': [
    '`trentesix-leave` goes out to an opacity. Set it on the element that animates: it does not inherit.',
    '`0`',
  ],
  'switch-thumb': [
    "`switch` moment setting: the thumb's size.",
    'Discothèque `20px`, Folio `16px`',
  ],
  'switch-travel': [
    '`switch` moment setting: how far the thumb travels.',
    'Discothèque `24px`, Folio `20px`',
  ],
  'switch-stretch': [
    '`switch` moment setting: how much the thumb stretches while pressed.',
    'Discothèque `6px`, Folio `4px`',
  ],
  'toast-time': [
    '`toast` moment setting: how long the toast shows. Its timer bar is the clock.',
    '`5s`',
  ],
  'sweep-height': [
    '`sweep` moment setting: how tall the band is.',
    'Relais `var(--stripe-band)`, other looks `3px`',
  ],
  'sweep-fill': [
    "`sweep` moment setting: the band's background.",
    'Relais `var(--relais-airmail)`, other looks `var(--mustard)`',
  ],
  'postmark-rest': [
    '`postmark` moment setting (Relais): the opacity the mark settles to after it is pressed in.',
    '`0.72`',
  ],
  'ticker-time': ['`ticker` moment setting: how long one pass of the track takes.', '`70s`'],
  progress: ["`develop` moment setting: the upload's progress, from 0 to 1.", '`0` to `1`'],
  hour: ['`wind` moment setting: where the hour hand lands.', '`270deg`'],
  x: ["`slide` moment: the indicator's left edge, set by `slide()`.", 'set by `slide()`'],
  w: ["`slide` moment: the indicator's width, set by `slide()`.", 'set by `slide()`'],
};

/** css-custom-data.json: every --variable, with its usage note and its values per look. */
export function cssData({ declared, usage, momentsCss, looks }) {
  const names = new Set();
  for (const look of Object.values(declared))
    for (const theme of Object.values(look)) for (const n of Object.keys(theme)) names.add(n);

  const missing = [...names].filter((n) => !usage[n]);
  if (missing.length)
    throw new Error(`No usage note for: ${missing.map((n) => `--${n}`).join(', ')}`);

  // Every variable moments.css uses must be a token or have a note above.
  const inMoments = new Set(
    [...momentsCss.matchAll(/(?:var\(|^\s*)--([a-z][\w-]*)/gm)].map((m) => m[1]),
  );
  const unknown = [...inMoments].filter(
    (n) => !n.startsWith('m-') && !names.has(n) && !(n in MOTION_VARIABLES),
  );
  if (unknown.length)
    throw new Error(
      `moments.css uses variables with no note: ${unknown.map((n) => `--${n}`).join(', ')}`,
    );

  const properties = [...names].sort().map((name) => ({
    name: `--${name}`,
    description: md(`${usage[name]}\n\n${valuesPerLook(declared, name, looks)}`),
  }));
  for (const [name, [note, values]] of Object.entries(MOTION_VARIABLES))
    properties.push({
      name: `--${name}`,
      description: md(`${note}\n\n${values}. Set by moments.css.`),
    });
  return { version: 1.1, properties };
}

/**
 * The catalogue tables in docs/motion.md, as name → "Lives in. How", so the attribute hover says
 * what docs/motion.md says.
 */
function catalogue(motionMd) {
  const from = motionMd.indexOf('## The catalogue');
  const to = motionMd.indexOf('## The helper');
  const rows = {};
  for (const line of motionMd.slice(from, to).split('\n')) {
    const m = line.match(/^\|\s*`([a-z-]+)`\s*\|([^|]+)\|(.+)\|\s*$/);
    if (m) rows[m[1]] = `**${m[2].trim()}.** ${m[3].trim().replace(/\\\|/g, '|')}`;
  }
  return rows;
}

const MOMENTS_WITHOUT_A_ROW = {
  thud: 'The container a `stamp` lands in: it jolts 2px when a stamp lands, or on `data-state="done"`.',
};

const STATES = {
  busy: 'Working: the busy cue (press, save, hold while held).',
  dirty: 'Unsaved changes (save).',
  done: 'Finished: the moment plays its ending.',
  failed: 'Failed or changes asked: a shake or a rust line.',
  leaving: 'Closing: plays the exit (toast, milestone, dialog).',
  lifted: 'Picked up (lift).',
  open: 'Open (unfold).',
  paused: 'Stopped (ticker).',
  rest: 'Shown as it stands, without playing: a record opened later (notary).',
  running: 'Playing, even under reduced motion (ticker).',
};

/** html-custom-data.json: data-moment, data-state, data-part and the attributes on <html>. */
export function htmlData({ momentsCss, motionMd, looks }) {
  const found = (attr) =>
    [
      ...new Set(
        [...momentsCss.matchAll(new RegExp(`${attr}~?='([a-z-]+)'`, 'g'))].map((m) => m[1]),
      ),
    ].sort();
  const rows = catalogue(motionMd);
  const moments = found('data-moment').map((name) => {
    const description = rows[name] ?? MOMENTS_WITHOUT_A_ROW[name];
    if (!description)
      throw new Error(`moments.css has data-moment="${name}", but docs/motion.md doesn't`);
    return { name, description: md(description) };
  });
  const states = found('data-state').map((name) => {
    if (!STATES[name]) throw new Error(`No note for data-state="${name}"`);
    return { name, description: md(STATES[name]) };
  });
  const parts = found('data-part').map((name) => ({
    name,
    description: md(
      `Used by: ${
        Object.keys(rows)
          .filter((m) => rows[m].includes(`\`${name}\``))
          .map((m) => `\`${m}\``)
          .join(', ') || 'see docs/motion.md'
      }.`,
    ),
  }));
  return {
    version: 1.1,
    globalAttributes: [
      {
        name: 'data-moment',
        description: md(
          'A named motion from `@trentesix/core/moments.css`. Space-separated, so one element can carry more than one.',
        ),
        values: moments,
      },
      { name: 'data-state', description: md('The state a moment shows.'), values: states },
      {
        name: 'data-part',
        description: md('A part of a moment, on a child of the element with `data-moment`.'),
        values: parts,
      },
      {
        name: 'data-look',
        description: md('On `<html>`: the look. Discothèque needs no attribute.'),
        values: looks
          .filter((l) => l.id !== 'discotheque')
          .map((l) => ({ name: l.id, description: md(l.name) })),
      },
      {
        name: 'data-theme',
        description: md('On `<html>`: forces a theme. Without it the system setting decides.'),
        values: looks[0].themes.map((t) => ({
          name: t.id,
          description: md(
            looks.map((l) => `${l.name}: ${l.themes.find((x) => x.id === t.id).name}`).join(', '),
          ),
        })),
      },
      {
        name: 'data-motion',
        description: md("On `<html>`: overrides the system's reduced-motion setting."),
        values: [
          {
            name: 'reduce',
            description: md('Nothing travels, grows, bounces or repeats; fades stay short.'),
          },
          { name: 'full', description: md('Full motion, whatever the system says.') },
        ],
      },
      {
        name: 'data-prose',
        description: md(
          'Rich text from `@trentesix/core/prose.css`: the headings, lists, quotes, links, code and tables inside this element, in the look. Empty for text to read, at most `--reading-width` wide.',
        ),
        values: [
          {
            name: 'compact',
            description: md('At UI size, the full width: editors in fields, tickets, comments.'),
          },
        ],
      },
    ],
  };
}
