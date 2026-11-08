// Generated from tokens.json by scripts/build.mjs. Do not edit.
/** Folio: its id (the data-look value), name, temper and themes. */
export const look = {
  id: 'folio',
  name: 'Folio',
  default: false,
  temper: 'calm',
  themes: [
    {
      id: 'light',
      name: 'Light',
    },
    {
      id: 'dark',
      name: 'Dark',
    },
  ],
};

/** Its springs and the pen: duration in ms and a CSS easing (springs as linear()). */
export const motion = {
  pop: {
    stiffness: 380,
    damping: 36,
    duration: 417,
    easing:
      'linear(0, 0.056, 0.164, 0.29, 0.415, 0.529, 0.628, 0.71, 0.778, 0.831, 0.873, 0.906, 0.931, 0.949, 0.963, 0.974, 0.981, 0.987, 0.991, 0.994, 0.996, 0.997, 0.998, 0.999, 0.999, 1)',
  },
  settle: {
    stiffness: 520,
    damping: 42,
    duration: 367,
    easing:
      'linear(0, 0.075, 0.211, 0.36, 0.499, 0.618, 0.715, 0.791, 0.85, 0.893, 0.925, 0.948, 0.964, 0.976, 0.984, 0.989, 0.993, 0.995, 0.997, 0.998, 0.999, 0.999, 1)',
  },
  pen: {
    duration: 420,
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
};

/** Folio's motion: tweens only, no overshoot. */
export const folioMotion = {
  duration: {
    fast: 100,
    base: 150,
    slow: 250,
    ambient: 400,
  },
  standard: [0.2, 0, 0, 1],
  exit: [0.4, 0, 1, 1],
};
