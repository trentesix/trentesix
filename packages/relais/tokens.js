// Generated from tokens.json by scripts/build.mjs. Do not edit.
/** Relais: its id (the data-look value), name, temper and themes. */
export const look = {
  id: 'relais',
  name: 'Relais',
  default: false,
  temper: 'calm',
  themes: [
    {
      id: 'light',
      name: 'Day',
    },
    {
      id: 'dark',
      name: 'Night',
    },
  ],
};

/** Its springs and the pen: duration in ms and a CSS easing (springs as linear()). */
export const motion = {
  pop: {
    stiffness: 360,
    damping: 38,
    duration: 517,
    easing:
      'linear(0, 0.053, 0.153, 0.27, 0.385, 0.491, 0.584, 0.663, 0.729, 0.783, 0.827, 0.863, 0.891, 0.914, 0.932, 0.947, 0.958, 0.967, 0.974, 0.98, 0.984, 0.988, 0.99, 0.992, 0.994, 0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 1)',
  },
  settle: {
    stiffness: 460,
    damping: 46,
    duration: 517,
    easing:
      'linear(0, 0.065, 0.181, 0.308, 0.428, 0.533, 0.622, 0.696, 0.756, 0.805, 0.844, 0.875, 0.901, 0.921, 0.937, 0.95, 0.96, 0.968, 0.975, 0.98, 0.984, 0.987, 0.99, 0.992, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998, 1)',
  },
  pen: {
    duration: 420,
    easing: 'cubic-bezier(0.6, 0, 0.3, 1)',
  },
};
