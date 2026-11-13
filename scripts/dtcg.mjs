// A look's tokens in the Design Tokens Community Group format (the W3C community group's
// 2025.10 spec, https://www.designtokens.org/tr/2025.10/format/), for Figma's variables import,
// Tokens Studio and other design tools. One file per theme, each whole (the base and the look):
// design tools import a file per mode.
//
// Read from what the CSS declares, so a design tool sees the same values as the page. What the
// format can't hold is left out: springs (CSS linear() curves), keyword settings (label-case),
// widths in ch, values built from several variables (divider), and the compatibility variables a
// look sets for older component CSS (--fs-*, --fw-*, --r-*) or for its own rules (--folio-*).

/** Groups by name prefix, in the order they are written. */
const GROUPS = [
  ['space-', 'spacing'],
  ['radius-', 'radius'],
  ['border-', 'border'],
  ['duration-', 'duration'],
  ['ease-', 'easing'],
  ['font-', 'font'],
  ['text-', 'typography'],
  ['shadow-', 'shadow'],
];
const SKIP = /^(fs-|fw-|r-\d|folio-|spring-|focus-ring$|label-|field-label-|temper$)/;

const num = (v) => +Number(v).toFixed(4);

/** A CSS colour (#rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), transparent) as a DTCG colour. */
function color(v) {
  v = v.trim().toLowerCase();
  let rgba;
  if (v === 'transparent') rgba = [0, 0, 0, 0];
  else if (/^#[0-9a-f]{3,8}$/.test(v)) {
    let h = v.slice(1);
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    rgba = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    rgba.push(h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1);
  } else {
    const m = v.match(
      /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/,
    );
    if (!m) return null;
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4];
    rgba = [+m[1], +m[2], +m[3], a];
  }
  const hex = `#${rgba
    .slice(0, 3)
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('')}`;
  return {
    colorSpace: 'srgb',
    components: rgba.slice(0, 3).map((c) => num(c / 255)),
    alpha: num(rgba[3]),
    hex,
  };
}

/** 4px, 0.5rem, 0 → a DTCG dimension (px or rem, the only units the format has). */
function dimension(v, fontSize) {
  const m = String(v)
    .trim()
    .match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (!m || (!m[2] && +m[1] !== 0)) return null;
  // em is relative to the font, which only a typography token knows.
  if (m[2] === 'em') return fontSize ? { value: num(+m[1] * fontSize), unit: 'px' } : null;
  return { value: num(+m[1]), unit: m[2] ?? 'px' };
}

function duration(v) {
  const m = String(v)
    .trim()
    .match(/^([\d.]+)(ms|s)$/);
  return m ? { value: m[2] === 's' ? num(+m[1] * 1000) : num(+m[1]), unit: 'ms' } : null;
}

function cubicBezier(v) {
  const m = String(v).match(/^cubic-bezier\(([^)]+)\)$/);
  return m ? m[1].split(',').map((x) => num(x)) : null;
}

/** 'Karla Variable', 'Karla', system-ui → ['Karla Variable', 'Karla', 'system-ui']. */
const fontFamily = (v) => v.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, ''));

/** Splits at top-level commas, leaving rgba(…) whole. */
function layers(v) {
  const out = [''];
  let depth = 0;
  for (const c of v) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && !depth) out.push('');
    else out[out.length - 1] += c;
  }
  return out.map((s) => s.trim());
}

/** A box-shadow value as one DTCG shadow or a list of them; null for none or what can't be read. */
function shadow(v, resolveColor) {
  if (v.trim() === 'none') return null;
  const out = [];
  for (const layer of layers(v)) {
    const inset = /\binset\b/.test(layer);
    const rest = layer.replace(/\binset\b/, '').trim();
    const colorPart = rest.match(/(#[0-9a-f]{3,8}|rgba?\([^)]*\)|var\([^)]*\))\s*$/i);
    if (!colorPart) return null;
    const lengths = rest
      .slice(0, colorPart.index)
      .trim()
      .split(/\s+/)
      .map((x) => dimension(x));
    if (lengths.length < 2 || lengths.length > 4 || lengths.some((x) => !x)) return null;
    const c = resolveColor(colorPart[1]);
    if (!c) return null;
    const zero = { value: 0, unit: 'px' };
    out.push({
      color: c,
      offsetX: lengths[0],
      offsetY: lengths[1],
      blur: lengths[2] ?? zero,
      spread: lengths[3] ?? zero,
      ...(inset ? { inset: true } : {}),
    });
  }
  return out.length === 1 ? out[0] : out;
}

/** 'italic 400 20px/1.3 var(--font-display)' → its parts. */
function font(v) {
  const m = v.match(/^(?:(italic)\s+)?(\d+)\s+([\d.]+px)\/([\d.]+)\s+var\(--font-([\w-]+)\)$/);
  return m && { italic: Boolean(m[1]), weight: +m[2], size: m[3], lineHeight: +m[4], family: m[5] };
}

/**
 * The DTCG document for one theme: values is every variable the CSS gives a value to in that
 * theme (base and look), usage the descriptions by variable name.
 */
export function dtcg({ values, usage, look, theme }) {
  const groupOf = (name) => GROUPS.find(([p]) => name.startsWith(p))?.[1];
  const tokens = {};
  const put = (group, name, token) => {
    const d = usage[name];
    tokens[group] ??= {};
    tokens[group][name] = { ...(d ? { $description: d } : {}), ...token };
  };
  const pathOf = {};
  const alias = (v) => v.match(/^var\(--([\w-]+)\)$/)?.[1];
  const resolve = (v, seen = new Set()) => {
    const a = alias(v);
    if (!a || seen.has(a) || values[a] === undefined) return a ? null : v;
    seen.add(a);
    return resolve(values[a], seen);
  };
  // A colour written as a colour, or as another colour's variable (kept as an alias).
  const colorOrAlias = (v) => {
    const a = alias(v);
    if (a && pathOf[a]?.type === 'color') return `{${pathOf[a].path}}`;
    const r = resolve(v);
    return r === null ? null : color(r);
  };

  const names = Object.keys(values).filter(
    (n) => !SKIP.test(n) && values[n] !== 'initial' && !n.endsWith('-tracking'),
  );
  // First the plain values (so aliases can point at them), then the rest.
  const plainFirst = [...names].sort(
    (a, b) => Number(!!alias(values[a])) - Number(!!alias(values[b])),
  );
  for (const name of plainFirst) {
    const v = values[name];
    const group = groupOf(name);
    const r = resolve(v);
    if (r === null) continue;
    const viaAlias = alias(v) && pathOf[alias(v)] ? `{${pathOf[alias(v)].path}}` : null;
    let type;
    let value;
    if (group === 'font') [type, value] = ['fontFamily', viaAlias ?? fontFamily(r)];
    else if (group === 'duration') [type, value] = ['duration', viaAlias ?? duration(r)];
    else if (group === 'easing') [type, value] = ['cubicBezier', viaAlias ?? cubicBezier(r)];
    else if (group === 'shadow') [type, value] = ['shadow', shadow(v, colorOrAlias)];
    else if (group === 'typography') {
      const f = font(r);
      if (!f) continue;
      const size = parseFloat(f.size);
      const tracking = values[`${name}-tracking`];
      value = {
        fontFamily: pathOf[`font-${f.family}`]
          ? `{${pathOf[`font-${f.family}`].path}}`
          : fontFamily(resolve(`var(--font-${f.family})`) ?? f.family),
        fontSize: dimension(f.size),
        fontWeight: f.weight,
        lineHeight: f.lineHeight,
        letterSpacing: dimension(tracking ?? '0', size) ?? { value: 0, unit: 'px' },
      };
      type = 'typography';
      if (f.italic) value = { ...value, fontStyle: 'italic' };
    } else if (color(r)) [type, value] = ['color', viaAlias ?? color(r)];
    else if (dimension(r)) [type, value] = ['dimension', viaAlias ?? dimension(r)];
    if (!value) continue;
    // fontStyle isn't part of the format's typography: it goes in $extensions.
    let ext;
    if (type === 'typography' && value.fontStyle) {
      ext = { 'dev.trentesix': { fontStyle: value.fontStyle } };
      delete value.fontStyle;
    }
    const g = group ?? (type === 'color' ? 'color' : 'size');
    put(g, name, { $type: type, $value: value, ...(ext ? { $extensions: ext } : {}) });
    pathOf[name] = { path: `${g}.${name}`, type };
  }
  // A stable order: groups as listed, then colour and size; names as the CSS has them.
  const order = [...GROUPS.map(([, g]) => g), 'color', 'size'];
  const sorted = Object.fromEntries(
    order
      .filter((g) => tokens[g])
      .map((g) => [
        g,
        Object.fromEntries(names.filter((n) => tokens[g][n]).map((n) => [n, tokens[g][n]])),
      ]),
  );
  return {
    $description: `${look.name}, ${look.themeName[theme]}: the base and the look, as the CSS declares them. Generated by scripts/build.mjs.`,
    ...sorted,
  };
}
