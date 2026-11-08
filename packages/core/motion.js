// The motion helper: the few moments CSS can't do alone (measuring a move, a timer tied to an
// animation, splitting digits). Everything else is in moments.css. The contract is
// docs/motion.md.
//
// Every function returns a promise that resolves when the motion is done and never rejects, so
// callers can await a moment before moving on. Durations and springs come from the current
// look's CSS variables, so the helper always moves like the page around it.

/** Properties that move or resize something: under reduced motion they jump to where they end. */
const TRAVEL = new Set(
  'transform translate scale rotate width height top left right bottom inset gap clipPath backgroundPosition marginTop marginBottom paddingTop paddingBottom borderTopWidth borderBottomWidth offsetDistance'.split(
    ' ',
  ),
);
const STANDARD = 'cubic-bezier(0.2, 0, 0, 1)';

const html = () => document.documentElement;
// Tokens are read where the motion happens (a subtree can carry its own data-look), falling back
// to <html> for an element that isn't rendered.
const css = (name, el) =>
  getComputedStyle(el?.isConnected ? el : html())
    .getPropertyValue(name)
    .trim();
// A calm look (its --temper is calm) moves without bounce or overshoot. The look says so in its
// own CSS, so the helper needs no list of looks.
const calm = (el) =>
  css('--temper', el)
    .replace(/["'\s]/g, '')
    .toLowerCase() === 'calm';
// Errors from callbacks the helper runs (never thrown into the promise): reported like an uncaught one.
const report = (e) => (typeof reportError === 'function' ? reportError(e) : console.error(e));
// A per-element call token: a newer call on the same element supersedes an older one.
const claim = (map, el) => {
  const t = {};
  map.set(el, t);
  return () => map.get(el) === t;
};
const time = (v) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000) || 0;
const done = (a) =>
  a
    ? a.finished.then(
        () => a,
        () => a,
      )
    : Promise.resolve(null);
const glide = (el) => ({
  duration: time(css('--duration-glide', el)) || 300,
  easing: css('--ease-glide', el) || STANDARD,
});

/** Whether motion is reduced right now: data-motion on <html> first, then the system setting. */
export function reduced() {
  const m = html().dataset.motion;
  return m === 'reduce' || (m !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** The duration (ms) and easing of the look's pop, settle or pen (the page's, or `el`'s own). */
export function spring(name, el) {
  const pen = name === 'pen';
  const duration = time(css(pen ? '--duration-pen' : `--spring-${name}-duration`, el));
  const easing = css(pen ? '--ease-pen' : `--spring-${name}`, el);
  // Browsers without linear() get a plain curve rather than an animation that throws.
  const ok = easing && CSS.supports('transition-timing-function', easing);
  return { duration: duration || 300, easing: ok ? easing : STANDARD };
}

/**
 * el.animate() with the reduced-motion rule built in: nothing travels, grows, bounces or
 * repeats (every frame takes the last frame's position), while fades, colours and drawn lines
 * stay, 200 ms at most. Delays are kept: they are timing, not movement. `info: true` marks a
 * timer or a progress bar, which runs unchanged. The promise carries the Animation as
 * `.animation`, for pausing or cancelling.
 */
export function play(el, frames, options = {}) {
  let { info, ...o } = options;
  o = { fill: 'backwards', ...o };
  if (!info && reduced()) {
    const last = frames[frames.length - 1];
    frames = frames.map((f) => {
      const g = { ...f };
      for (const k in g) if (TRAVEL.has(k)) k in last ? (g[k] = last[k]) : delete g[k];
      return g;
    });
    const moves = frames.some((f) =>
      Object.keys(f).some((k) => !/^(offset|easing|composite)$/.test(k) && f[k] !== last[k]),
    );
    o = {
      ...o,
      iterations: 1,
      easing: 'linear',
      duration: moves ? Math.min(o.duration ?? 200, 200) : 0,
    };
  }
  let a = null;
  try {
    a = el.animate(frames, o);
  } catch {
    try {
      a = el.animate(frames, { ...o, easing: STANDARD });
    } catch {}
  }
  const p = done(a);
  p.animation = a;
  return p;
}

/** Moves a slide indicator to the target option: sets --x and --w, and plays the move. */
export function slide(indicator, target) {
  const box = indicator.offsetParent?.getBoundingClientRect() ?? { left: 0 };
  const t = target.getBoundingClientRect();
  // In a scrolling bar of tabs, the indicator scrolls with them: count what's scrolled away.
  const parent = indicator.offsetParent;
  const to = {
    x: t.left - box.left - (parent?.clientLeft ?? 0) + (parent?.scrollLeft ?? 0),
    w: t.width,
  };
  const placed = indicator.style.getPropertyValue('--x');
  // Start from where it is now, mid-move included.
  const cs = getComputedStyle(indicator);
  const from = { x: parseFloat(cs.translate) || 0, w: parseFloat(cs.width) || 0 };
  indicator.getAnimations().forEach((a) => a.cancel());
  indicator.style.setProperty('--x', `${to.x}px`);
  indicator.style.setProperty('--w', `${to.w}px`);
  if (!placed || (from.x === to.x && from.w === to.w)) return Promise.resolve();
  const at = (b) => ({ translate: `${b.x}px 0`, width: `${b.w}px` });
  if (calm(indicator))
    return play(indicator, [at(from), at(to)], spring('settle', indicator)).then(() => {});
  // Discothèque stretches toward the new option first, and its back edge catches up.
  const left = Math.min(from.x, to.x);
  const span = Math.max(from.x + from.w, to.x + to.w) - left;
  return play(indicator, [at(from), { ...at({ x: left, w: span }), offset: 0.45 }, at(to)], {
    duration: 380,
    easing: 'cubic-bezier(0.3, 0.9, 0.4, 1)',
  }).then(() => {});
}

/**
 * Marks something you just changed with the flash moment: adds data-moment="flash" if it isn't
 * there, or plays the flash again from the start if it is, so a second change flashes too.
 * Resolves when the colour has faded.
 */
export function flash(el) {
  const moments = (el.dataset.moment ?? '').split(/\s+/).filter(Boolean);
  const others = moments.filter((m) => m !== 'flash');
  if (others.length < moments.length) {
    // Already flashing or flashed: take the moment off for one style pass, so it starts anew.
    el.dataset.moment = others.join(' ');
    void getComputedStyle(el).animationName;
  }
  el.dataset.moment = [...others, 'flash'].join(' ');
  const runs = el.getAnimations().filter((a) => a.animationName?.startsWith('trentesix-flash'));
  return Promise.all(runs.map(done)).then(() => {});
}

const counted = new WeakMap();
/**
 * Rolls a counter to `value`: only the digits that change roll, and the badge gives a bump.
 * While it rolls, assistive tech reads the final value once (the rolling columns are hidden from
 * it); when the roll ends the element is plain digits again.
 */
export function count(el, value) {
  const next = String(value ?? '');
  const prev = el.dataset.value ?? el.textContent.trim();
  const live = claim(counted, el);
  el.dataset.value = next;
  const cols = [...next].map((d) => {
    const col = document.createElement('span');
    col.dataset.part = 'digit';
    col.append(Object.assign(document.createElement('span'), { textContent: d }));
    return col;
  });
  el.replaceChildren(...cols);
  if (!prev || prev === next) return Promise.resolve();
  // A direction needs two numbers; anything else just rolls upward.
  const [a, b] = [Number(prev), Number(next)];
  const up = Number.isNaN(a) || Number.isNaN(b) || !(b < a);
  const old = prev.padStart(next.length, ' ').slice(-next.length);
  const pop = spring('pop', el);
  const said = Object.assign(document.createElement('span'), { textContent: next });
  said.dataset.part = 'said';
  Object.assign(said.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  });
  cols.forEach((c) => c.setAttribute('aria-hidden', 'true'));
  el.append(said);
  const runs = cols.map((col, i) => {
    if (old[i] === next[i]) return null;
    const out = Object.assign(document.createElement('span'), { textContent: old[i].trim() });
    out.setAttribute('aria-hidden', 'true');
    col.append(out);
    return Promise.all([
      play(
        col.firstChild,
        [{ transform: `translateY(${up ? 100 : -100}%)` }, { transform: 'none' }],
        pop,
      ),
      play(
        out,
        [{ transform: 'none' }, { transform: `translateY(${up ? -100 : 100}%)`, opacity: 0 }],
        {
          duration: pop.duration * 0.7,
          easing: glide(el).easing,
          fill: 'forwards',
        },
      ).then(() => out.remove()),
    ]);
  });
  const bump = `scale(${calm(el) ? 1.07 : 1.14})`;
  runs.push(
    play(el, [{ transform: 'none' }, { transform: bump, offset: 0.4 }, { transform: 'none' }], {
      duration: 240,
      easing: 'ease-out',
    }),
  );
  return Promise.all(runs).then(() => {
    if (!live()) return;
    said.remove();
    cols.forEach((c) => c.removeAttribute('aria-hidden'));
  });
}

/**
 * Press and hold to confirm, for the one action with no undo. The fill grows for `ms` while the
 * button is held (pointer, Space or Enter) and drains if let go early; at the end the button
 * gets data-state="done" and onConfirm runs. data-state="busy" while held, for the label.
 * A click that no pointer or key made (screen reader, voice control, switch: `detail === 0`)
 * has no release, so it starts the hold and lets it run to the end; Escape, losing focus, the
 * window or tab going away, or the button leaving the page cancels it. The hold is a timer, so
 * it runs the same under reduced motion. An onConfirm that throws (or rejects) is reported like
 * an uncaught error and does not break the button. Returns a cleanup function.
 */
export function hold(button, { ms = 900, onConfirm } = {}) {
  const fill = button.querySelector('[data-part="fill"]');
  let run = null;
  const confirm = () => {
    try {
      Promise.resolve(onConfirm?.()).catch(report);
    } catch (e) {
      report(e);
    }
  };
  const start = () => {
    if (run || button.disabled || button.dataset.state === 'done') return;
    button.dataset.state = 'busy';
    const a = (fill || button).animate(
      fill ? [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }] : [],
      {
        duration: ms,
        easing: 'cubic-bezier(0.3, 0, 0.7, 1)',
        fill: 'forwards',
      },
    );
    run = a;
    a.finished.then(
      () => {
        if (run !== a) return;
        run = null;
        if (!button.isConnected) return a.cancel();
        button.dataset.state = 'done';
        confirm();
      },
      () => {},
    );
  };
  const stop = () => {
    const a = run;
    if (!a) return;
    run = null;
    button.removeAttribute('data-state');
    if (!fill) return a.cancel();
    const k = new DOMMatrix(getComputedStyle(fill).transform).a;
    a.cancel();
    fill.animate([{ transform: `scaleX(${k})` }, { transform: 'scaleX(0)' }], {
      duration: 200,
      easing: 'ease-out',
    });
  };
  const down = (e) => {
    if (e.button) return;
    e.preventDefault();
    start();
  };
  const key = (e) => {
    if (e.key === 'Escape') return stop();
    if (e.key !== ' ' && e.key !== 'Enter') return;
    // Held keys would otherwise click the button, on keydown (Enter) or keyup (Space).
    e.preventDefault();
    if (e.type === 'keyup') stop();
    else if (!e.repeat) start();
  };
  // Only assistive tech and scripts click without a pointer or key (detail 0).
  const click = (e) => {
    if (e.detail === 0 && !run) start();
  };
  const away = () => document.visibilityState === 'hidden' && stop();
  const on = [
    ['pointerdown', down],
    ['pointerup', stop],
    ['pointerleave', stop],
    ['pointercancel', stop],
    ['keydown', key],
    ['keyup', key],
    ['click', click],
    ['blur', stop],
  ];
  on.forEach(([t, f]) => button.addEventListener(t, f));
  addEventListener('blur', stop);
  document.addEventListener('visibilitychange', away);
  return () => {
    on.forEach(([t, f]) => button.removeEventListener(t, f));
    removeEventListener('blur', stop);
    document.removeEventListener('visibilitychange', away);
    run?.cancel();
    run = null;
  };
}

/**
 * Resolves when the toast's timer bar (data-part="timer") runs out. The bar's animation is the
 * clock, so hovering or focusing the toast pauses both, and so does the tab being hidden (a
 * message nobody could read shouldn't expire). The toast never leaves early. It also resolves if
 * the toast goes away first.
 */
export function toastTimer(el) {
  const bar = el.querySelector('[data-part="timer"]');
  const found = bar?.getAnimations().find((a) => a.animationName === 'trentesix-timer');
  // No styled bar: a plain timer (--toast-time, 5 s) that pauses the same way.
  const clock = found ?? el.animate([], { duration: time(css('--toast-time', el)) || 5000 });
  let held = false;
  const sync = () => {
    const hovered = el.matches(':hover, :focus-within');
    if (document.visibilityState === 'hidden') {
      held = true;
      clock.pause();
    } else if (found) {
      // The bar's own CSS pauses it on hover and focus; only undo our own pause.
      if (held && !hovered) clock.play();
      held = false;
    } else hovered ? clock.pause() : clock.play();
  };
  const later = () => setTimeout(sync);
  const types = ['pointerenter', 'pointerleave', 'focusin', 'focusout'];
  if (!found) types.forEach((t) => el.addEventListener(t, later));
  document.addEventListener('visibilitychange', sync);
  const gone = new MutationObserver(() => el.isConnected || clock.cancel());
  gone.observe(document, { childList: true, subtree: true });
  sync();
  return done(clock).then(() => {
    gone.disconnect();
    document.removeEventListener('visibilitychange', sync);
    types.forEach((t) => el.removeEventListener(t, later));
  });
}

let flights = Promise.resolve();
/**
 * Flies `from`'s look into `to`: a ghost copy of `from` moves and scales into place while it
 * fades out, and `to` grows into place from the same spot as it fades in. A flight that starts
 * while another is running waits for it to land. Both ends must be rendered: un-hide `to`
 * first. Under reduced motion it is a cross-fade where `to` stands.
 */
export function flight(from, to) {
  // A flight that fails must not stop the ones after it, and never rejects.
  return (flights = flights.then(() => fly(from, to)).catch(() => {}));
}
async function fly(from, to) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) return;
  const fs = getComputedStyle(from);
  const k = parseFloat(fs.fontSize) / parseFloat(getComputedStyle(to).fontSize) || 1;
  const ghost = document.createElement('span');
  ghost.textContent = from.textContent;
  ghost.setAttribute('aria-hidden', 'true');
  for (const p of 'fontFamily fontSize fontWeight fontStyle fontVariationSettings lineHeight letterSpacing textTransform color'.split(
    ' ',
  ))
    ghost.style[p] = fs[p];
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    margin: 0,
    whiteSpace: 'nowrap',
    transformOrigin: '0 0',
    pointerEvents: 'none',
    zIndex: 2147483647,
  });
  const d = calm(to) ? 340 : 460;
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const move = {
    duration: d,
    easing: calm(to) ? glide(to).easing : 'cubic-bezier(0.3, 1.25, 0.4, 1)',
  };
  const fade = (delay) => ({ duration: d * 0.55, delay: d * delay, easing: 'linear' });
  let keep = null;
  document.body.append(ghost);
  try {
    keep = [to.style.transformOrigin, from.style.visibility];
    to.style.transformOrigin = '0 0';
    from.style.visibility = 'hidden';
    await Promise.all([
      play(
        ghost,
        [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${1 / k})` }],
        {
          ...move,
          fill: 'forwards',
        },
      ),
      play(ghost, [{ opacity: 1 }, { opacity: 0 }], { ...fade(0.1), fill: 'forwards' }),
      play(
        to,
        [{ transform: `translate(${-dx}px, ${-dy}px) scale(${k})` }, { transform: 'none' }],
        move,
      ),
      play(to, [{ opacity: 0 }, { opacity: 1 }], fade(0.15)),
    ]);
  } finally {
    ghost.remove();
    if (keep) [to.style.transformOrigin, from.style.visibility] = keep;
  }
}

const grown = new WeakMap();
const growing = new WeakMap();
/**
 * Grows `view` out of `origin`'s box (the "+ New" button): the view starts clipped to the
 * button in the button's colour and opens to its own size as its content fades in.
 * `{back: true}` shrinks it back into the button; hide the view when that resolves.
 * A newer call on the same view takes over: the older one stops where it is and resolves.
 */
export async function growFrom(origin, view, { back = false } = {}) {
  grown.get(view)?.forEach((a) => a?.cancel());
  const live = claim(growing, view);
  const o = origin.getBoundingClientRect();
  const v = view.getBoundingClientRect();
  if (!o.width || !v.width) return;
  const kids = [...view.children];
  if (back && reduced()) {
    const a = play(view, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    grown.set(view, [a.animation]);
    return a.then(() => {});
  }
  const vs = getComputedStyle(view);
  const os = getComputedStyle(origin);
  const small = {
    clipPath: `inset(${o.top - v.top}px ${v.right - o.right}px ${v.bottom - o.bottom}px ${o.left - v.left}px round ${os.borderRadius})`,
    backgroundColor: os.backgroundColor,
  };
  const big = {
    clipPath: `inset(0 round ${vs.borderRadius})`,
    backgroundColor: vs.backgroundColor,
  };
  const g = glide(view);
  if (back) {
    const out = kids.map((c) =>
      play(c, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }),
    );
    grown.set(
      view,
      out.map((p) => p.animation),
    );
    await Promise.all(out);
    if (!live()) return;
    const shut = play(view, [big, small], {
      duration: g.duration * 0.7,
      easing: g.easing,
      fill: 'forwards',
    });
    grown.set(view, [...out.map((p) => p.animation), shut.animation]);
    return shut.then(() => {});
  }
  const t = calm(view) ? g : { duration: 440, easing: 'cubic-bezier(0.3, 1.15, 0.4, 1)' };
  const runs = [
    play(view, [small, big], t),
    ...kids.map((c) =>
      play(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t.duration * 0.45 }),
    ),
  ];
  grown.set(
    view,
    runs.map((p) => p.animation),
  );
  await Promise.all(runs);
}

const binned = new WeakMap();
const binning = new WeakMap();
const clipped = new WeakMap();
/**
 * Moves a row to the bin: it slides aside and fades, then its gap closes. Remove or hide the row
 * when it resolves. `{back: true}` (undo, with the row shown again) opens the gap first and
 * slides the row back in. A newer call on the same row takes over: the older one stops and
 * resolves, and the row's own overflow is put back by whichever call finishes last.
 */
export async function bin(row, { back = false } = {}) {
  binned.get(row)?.forEach((a) => a?.cancel());
  const live = claim(binning, row);
  const cs = getComputedStyle(row);
  const sides = ['Top', 'Bottom'].flatMap((s) => [`padding${s}`, `margin${s}`, `border${s}Width`]);
  const open = Object.fromEntries([['height', cs.height], ...sides.map((p) => [p, cs[p]])]);
  const shut = Object.fromEntries([['height', '0px'], ...sides.map((p) => [p, '0px'])]);
  const away = `translateX(${calm(row) ? 12 : 24}px)`;
  const g = glide(row);
  // The row's own inline overflow, remembered only by the first call of a run.
  if (!clipped.has(row)) clipped.set(row, row.style.overflow);
  const unclip = () => {
    row.style.overflow = clipped.get(row);
    clipped.delete(row);
  };
  row.style.overflow = 'hidden';
  if (back) {
    const gap = play(
      row,
      [
        { ...shut, opacity: 0 },
        { ...open, opacity: 0 },
      ],
      { ...g, fill: 'forwards' },
    );
    binned.set(row, [gap.animation]);
    await gap;
    if (!live()) return;
    gap.animation?.cancel();
    unclip();
    const settle = play(
      row,
      [
        { opacity: 0, transform: away },
        { opacity: 1, transform: 'none' },
      ],
      spring('settle', row),
    );
    binned.set(row, [settle.animation]);
    await settle;
    return;
  }
  const slideOut = play(
    row,
    [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: away },
    ],
    {
      duration: g.duration * 0.6,
      easing: g.easing,
      fill: 'forwards',
    },
  );
  binned.set(row, [slideOut.animation]);
  await slideOut;
  if (!live()) return;
  const close = play(row, [open, shut], { ...g, fill: 'forwards' });
  binned.set(row, [slideOut.animation, close.animation]);
  await close;
  if (live()) unclip();
}

let lights = 0;
/**
 * Runs `apply` (which switches the theme) inside a View Transition: Discothèque's new lighting
 * spreads as a circle from (x, y); Folio and Relais, and reduced motion, cross-fade. Where View
 * Transitions aren't supported it just awaits apply(). An apply that throws is reported like an
 * uncaught error; the promise still resolves.
 */
export async function switchLights(apply, { x = innerWidth / 2, y = innerHeight / 2 } = {}) {
  const mine = ++lights;
  const run = async () => {
    try {
      await apply();
    } catch (e) {
      report(e);
    }
  };
  if (!document.startViewTransition) return run();
  const fade = calm() || reduced();
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  html().setAttribute('data-lights', '');
  try {
    const vt = document.startViewTransition(run);
    await vt.ready;
    const pseudoElement = '::view-transition-new(root)';
    html().animate(
      fade
        ? { opacity: [0, 1] }
        : { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      fade
        ? { pseudoElement, duration: reduced() ? 200 : 250, easing: 'linear' }
        : { pseudoElement, duration: 560, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
    );
    await vt.finished;
  } catch {}
  // An overlapping call owns the attribute now.
  if (mine === lights) html().removeAttribute('data-lights');
}
