// Types for @trentesix/core/motion. The contract is docs/motion.md.

/** A promise that settles when the motion is done (it never rejects). */
export type Motion = Promise<void>;

/** Whether motion is reduced right now: data-motion on <html> first, then the system setting. */
export declare function reduced(): boolean;

/** The duration (ms) and easing of the current look's pop, settle or pen. */
export declare function spring(
  name: 'pop' | 'settle' | 'pen',
  /** Read the tokens from this element's look instead of the page's. */
  el?: Element,
): {
  duration: number;
  easing: string;
};

export interface PlayOptions extends KeyframeAnimationOptions {
  /** A timer or a progress bar: runs unchanged under reduced motion. */
  info?: boolean;
}

/**
 * el.animate() with the reduced-motion rule built in. Resolves with the Animation (or null if
 * the browser couldn't play it) when it finishes or is cancelled; `.animation` holds it from
 * the start. `fill` defaults to 'backwards'.
 */
export declare function play(
  el: Element,
  frames: Keyframe[],
  options?: PlayOptions,
): Promise<Animation | null> & { animation: Animation | null };

/** Moves a slide indicator to the target option (sets --x and --w) and plays the move. */
export declare function slide(indicator: HTMLElement, target: Element): Motion;

/**
 * Marks something you just changed with the flash moment (adds data-moment="flash"), or plays the
 * flash again if it's already marked. Resolves when the colour has faded.
 */
export declare function flash(el: HTMLElement): Motion;

/** Rolls a counter to `value`: only the digits that change roll. Assistive tech reads the final value once. */
export declare function count(el: HTMLElement, value: number | string): Motion;

export interface HoldOptions {
  /** How long to hold, in ms. Default 900. */
  ms?: number;
  /** Runs once the hold completes. A throw or rejection is reported (reportError), not swallowed. */
  onConfirm?: () => void | Promise<void>;
}

/**
 * Press and hold to confirm (pointer, Space or Enter). A click without pointer or key
 * (`detail === 0`: screen reader, voice control, switch) starts the hold and lets it run out;
 * Escape, blur, the tab hiding or the button leaving the page cancels. Returns a cleanup function.
 */
export declare function hold(button: HTMLElement, options?: HoldOptions): () => void;

/** Resolves when the toast's timer bar runs out (or the toast goes away first). Pauses while the tab is hidden. */
export declare function toastTimer(el: Element): Motion;

/** Flies `from`'s look into `to`, as a cross-fading ghost. Waits for a running flight to land; a failed one never blocks the next. */
export declare function flight(from: HTMLElement, to: HTMLElement): Motion;

/** Grows `view` out of `origin`'s box; `{back: true}` shrinks it back. A newer call on the view takes over. */
export declare function growFrom(
  origin: Element,
  view: HTMLElement,
  options?: { back?: boolean },
): Motion;

/** Slides a row out and closes its gap; `{back: true}` (undo) opens the gap and slides it back. A newer call on the row takes over. */
export declare function bin(row: HTMLElement, options?: { back?: boolean }): Motion;

/** Runs `apply` inside a View Transition that spreads from (x, y); awaits it directly where unsupported. A throwing `apply` is reported, not rejected. */
export declare function switchLights(
  apply: () => void | Promise<void>,
  origin?: { x?: number; y?: number },
): Motion;
