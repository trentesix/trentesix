// Generated from tokens.json by scripts/build.mjs. Do not edit.
/** The base durations, in ms. */
export const duration = {
  snap: 120,
  pop: 320,
  glide: 360,
  drift: 600,
};

/** The base cubic-bezier curves. */
export const easing = {
  spring: [0.3, 1.6, 0.5, 1],
  glide: [0.2, 0.9, 0.3, 1],
  drift: [0.45, 0, 0.55, 1],
  shake: [0.36, 0.07, 0.19, 0.97],
};

/** Window widths, in px: small (phones end), medium, large, wide. For media queries in scripts; CSS writes them as numbers. */
export const breakpoints = {
  small: 600,
  medium: 900,
  large: 1200,
  wide: 1600,
};
