// The contrast checker's measuring functions, for apps that check colour pairs of their own.
// The module's other exports are the build's and aren't part of the public API.

/**
 * WCAG contrast of fg on bg. Each is hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb() or rgba(),
 * channels as numbers or percentages. A see-through fg is laid over bg first. Throws on any
 * other colour (hsl(), oklch(), names other than transparent) and on a see-through bg.
 */
export declare function ratio(fg: string, bg: string): number;
/** A ratio rounded down to one decimal, as text: 4.5 is never really 4.49. */
export declare function shown(ratio: number): string;
