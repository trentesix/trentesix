# Motion and moments

Everything that moves in an app built on Trentesix, by name. Each look moves with its own character:

- **Discothèque** is print you can touch: things pop, thud and bounce once.
- **Folio** is ink that draws itself: calm and quick, nothing bounces, and each moment has one
  flourish (a tick, an edge line or a ring that writes itself).
- **Relais** is the post: calm and firm like Folio, with no bounce, tilt or shake, and two postal
  moments of its own, the postmark pressed on a sent reply and the airmail stripe sweeping in
  for what just arrived (see [Relais](#relais)).
- **Devis** is a worksite with a notary: things land square and stay put. Calm like Folio, but
  it keeps Discothèque's hazard-stripe busy cue and hi-vis flash, and presses the notary seal
  onto a quote the client accepts (see [Devis](#devis)).

Motion comes in three layers, and most of it needs no script at all:

| Layer   | File                                                         | What it gives                                                                        |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Tokens  | `@trentesix/core/base.css` and the look's `look.css`         | durations, curves, springs as CSS `linear()`, the pen                                |
| Moments | `@trentesix/core/moments.css`, then the look's `moments.css` | every named moment below, keyed on `data-moment` and `data-state`                    |
| Helper  | `@trentesix/core/motion`                                     | the few things CSS can't do alone (about 4 KB minified and gzipped, no dependencies) |

A look's `all.css` loads them in order:

```css
@import '@trentesix/devis/all.css';
```

A look says how it moves with `--temper` (`lively` or `calm`). The calm looks share the calm rules,
which the build puts into each one's `moments.css`; the helper reads `--temper` to move the same
way.

## Tokens

| Variable                                      | Discothèque       | Folio            | Devis             | Relais               | Use                              |
| --------------------------------------------- | ----------------- | ---------------- | ----------------- | -------------------- | -------------------------------- |
| `--duration-snap`, `--ease-spring`            | 120 ms, overshoot | 100 ms, standard | 100 ms, overshoot | 100 ms, no overshoot | presses, hovers, toggles         |
| `--duration-pop`                              | 320 ms            | 150 ms           | 180 ms            | 200 ms               | menus, popovers, chips appearing |
| `--duration-glide`, `--ease-glide`            | 360 ms            | 250 ms           | 260 ms            | 280 ms               | panels, drawers, rows moving     |
| `--duration-drift`, `--ease-drift`            | 600 ms            | 400 ms           | 420 ms            | 460 ms               | things arriving on their own     |
| `--spring-pop`, `--spring-pop-duration`       | spring 400/22     | spring 380/36    | spring 420/30     | spring 360/38        | things you caused appearing      |
| `--spring-settle`, `--spring-settle-duration` | spring 420/20     | spring 520/42    | spring 520/40     | spring 460/46        | things landing after a move      |
| `--ease-pen`, `--duration-pen`                | 340 ms            | 420 ms           | 380 ms            | 420 ms               | lines that draw themselves       |
| `--ease-shake`                                | shake curve       | (same)           | (same)            | (same)               | error shake only (Discothèque)   |

Springs are compiled to `linear()` at build time, so `transition: scale var(--spring-pop-duration) var(--spring-pop)` is a real spring.

### Choosing a duration

- The further something travels or the bigger it gets, the longer it takes: snap for a button,
  pop for a chip or a menu, glide for a panel, drift for anything that arrives on its own.
- Entering uses the look's entering curve (a spring in Discothèque, standard in Folio). Leaving is
  always quicker and never springs: `--duration-snap` with `--ease-glide`.
- Things you caused answer at once. Things that happen on their own (presence, live updates) drift
  in, so they never feel like they came from your click.

## Reduced motion

When someone asks for less motion (the system setting, or `data-motion="reduce"` on `<html>`):

- **Nothing travels, grows, bounces or repeats.** Every moment ends where it would have ended.
- **Fades, colours and drawn lines stay**, 200 ms at most, so every state change is still seen.
- **Timers and progress run as usual**: a toast still counts down, a hold still fills.
- **Nothing is skipped.** A toast that shows for 5 s still shows for 5 s.

`moments.css` does this with three variables, so a component's own CSS can follow the same rule:

```css
:root {
  --travel: 1; /* 0 under reduced motion: multiply distances, scales and turns by it */
  --loop: infinite; /* 1 under reduced motion */
  --motion-cap: 100s; /* 200ms under reduced motion: min(var(--duration-pop), var(--motion-cap)) */
}
```

`data-motion="full"` on `<html>` ignores the system setting (for a "Motion: full" preference).

### Capped durations

`moments.css` also gives each duration token with the cap already applied, so an animation that
fades or draws needs no `min()` of its own:

| Variable          | Is                                 | Pairs with                     |
| ----------------- | ---------------------------------- | ------------------------------ |
| `--motion-snap`   | `--duration-snap`, capped          | `--ease-spring`                |
| `--motion-pop`    | `--spring-pop-duration`, capped    | `--spring-pop`                 |
| `--motion-settle` | `--spring-settle-duration`, capped | `--spring-settle`              |
| `--motion-glide`  | `--duration-glide`, capped         | `--ease-glide`                 |
| `--motion-drift`  | `--duration-drift`, capped         | `--ease-drift`, `--ease-glide` |
| `--motion-pen`    | `--duration-pen`, capped           | `--ease-pen`                   |
| `--motion-linger` | three drifts, capped               | `--ease-drift`                 |

They are separate variables, rather than the tokens themselves turning short under reduced
motion, because the plain tokens also time things that must not shrink: delays, staggers and
distances multiplied by `--travel`. Take a `--motion-*` duration for anything with a fade or a
drawn line in it, and the plain token for a delay or for `calc(var(--duration-glide) *
var(--travel))`. Like the cap, they follow the page's look.

### Arriving and leaving

Most things that appear or go away do it the same way: from a little offset, a scale or a turn,
with a fade. `moments.css` has the two keyframes its own moments use, for component CSS too:

```css
.chip {
  --enter-y: 6px;
  --enter-scale: 0.97;
  animation: trentesix-enter var(--motion-pop) var(--spring-pop) both;
}
.chip[data-closing] {
  --leave-y: 4px;
  animation: trentesix-leave var(--motion-snap) var(--ease-glide) forwards;
}
```

| Keyframe          | Moves                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `trentesix-enter` | in from `--enter-x`, `--enter-y` (`0px`), `--enter-scale` (`1`), `--enter-turn` (`0deg`) and `--enter-opacity` (`0`) |
| `trentesix-leave` | out to `--leave-x`, `--leave-y`, `--leave-scale`, `--leave-turn` and `--leave-opacity`, with the same defaults       |
| `trentesix-flash` | the background from `--flash` back to its own (see the `flash` moment)                                               |

Offsets, scales and turns are multiplied by `--travel`, so under reduced motion only the fade is
left. The `--enter-*` and `--leave-*` properties don't inherit: set them on the element that
animates, and a toast's offset never reaches a badge inside it. One element can set both, for its
way in and its way out.

Never end animations instantly with `animation-duration: 0.01ms !important`: it makes timers
fire at once and closes toasts before anyone sees them.

The stylelint config (`@trentesix/core/stylelint`, see the README) flags that trick, raw
durations and curves, and keyframes that move without `--travel`.

### Tilt is for objects, or for landing

Text sits straight at rest. Anything that holds words to read (a card, a ticket, a sticker, a
note, a question) leans only as it arrives: give the lean to `--enter-turn`, with whatever offset
it comes in from, and it settles straight once it has landed. The turn goes through `--travel`,
so under reduced motion it is straight from the start and only fades in.

```css
.ticket {
  --enter-y: 14px;
  --enter-turn: -0.8deg;
  animation: trentesix-enter var(--motion-settle) var(--spring-settle) backwards;
}
```

- **Objects may keep an angle.** A stamp, a photo, a screenshot or a pin is a thing on the page,
  not a sentence, and can rest turned.
- **A selection lands too.** Something that becomes picked, or the best match, can lean as it
  does, with `--enter-opacity: 1` so it doesn't fade, then stand straight while it stays picked.
- **Held things tilt while held.** The `lift` moment tilts a row while it's carried and
  straightens it when it's put down: a moment, not a resting angle.
- **A hover shouldn't be what straightens it.** If text needs a hover to sit level, it was
  leaning at rest.

## Relais

The email desk moves like the post: firm, unhurried, never playful. Relais shares Folio's calm
rules for press, field errors, save, toast, code cells, flash, milestone, presence, sign-in,
upload, pen, schedule, unfold, dialog and lift (the helper's `slide()`, `count()`, `flight()`,
`growFrom()`, `bin()` and `switchLights()` take Folio's calm path too), and adds:

- **Springs without overshoot.** `pop` is 360 / 38 and `settle` 460 / 46, both at or above
  critical damping; the pen is 420 ms. `--ease-spring` has no overshoot either.
- **`postmark`**, for a reply that was sent. Add it where the sent message shows, once:

  ```html
  <span data-moment="postmark" role="img" aria-label="Sent 6 Nov 2026">
    <svg viewBox="0 0 120 64" aria-hidden="true">
      <circle data-part="ink" pathLength="1" cx="32" cy="32" r="28" />
      <circle data-part="ink" pathLength="1" cx="32" cy="32" r="22" />
      <path data-part="ink" pathLength="1" d="M62 20q5-5 10 0t10 0t10 0t10 0t10 0" />
      <path data-part="ink" pathLength="1" d="M62 30q5-5 10 0t10 0t10 0t10 0t10 0" />
      <path data-part="ink" pathLength="1" d="M62 40q5-5 10 0t10 0t10 0t10 0t10 0" />
      <text data-part="date" x="32" y="36" text-anchor="middle">6 NOV</text>
    </svg>
  </span>
  ```

  The mark is `--action` ink at -8deg (an object keeps its angle). It presses in from 1.32 times its size, a
  few degrees turned, and settles at 72% opacity (`--postmark-rest`). Under reduced motion it
  appears in place, with no scale or turn, and fades to the same rest.

- **`sweep`**, for a row or panel that arrived on its own (a new ticket, a new message). The
  element holds `<span data-part="band" aria-hidden="true"></span>`; the airmail stripe
  unveils from the left along its top edge, holds for about 1.5 s and fades. Under reduced
  motion the stripe fades in place without sliding. The band is a square strip: on a rounded
  host, give the host `overflow: hidden` so it follows the corners.
- **`postmark`** rests at `--postmark-rest` (0.72 in Relais) after pressing in.
- **`seal`** is the ticket resolved: the pill fills and the tick writes itself, without the rays.
- **`stamp`** is pressed on from 1.25 times its size at -4deg, with no jolt (`thud` does nothing).
- **The busy cue** is a 3 px run of the airmail stripe along the button's bottom edge.
- **`flash`** soaks in `--selected-soft` (blue), because airmail red is for what needs attention.

For a composer: the Send button is `data-moment="press save"` (busy, then `done` draws its
tick) and the sent message gets a `postmark`. An incoming message or ticket gets a `sweep`. One
moment per action, as in the budget below.

## Devis

The quote tool moves like a worksite with a notary: firm, square, never playful, with one press
for the moment something becomes binding. Devis shares Folio's calm rules for press, field
errors, save, toast, code cells, milestone, presence, upload, schedule, unfold, dialog and lift
(the helper's `slide()`, `count()`, `flight()`, `growFrom()`, `bin()` and `switchLights()` take
the calm path too), and:

- **Keeps three of Discothèque's**, because they belong on a site: the busy cue's rolling hazard
  stripes, in hi-vis yellow, the `flash` that hits at once in hi-vis and fades, and the sign-in
  `curtain`'s five bands, as hazard tape: each length is pulled across from alternate sides with
  its stripes running, holds over the card a beat, and lifts away. Under reduced motion the tape
  is simply there, then fades.
- **Springs with the barest overshoot.** `pop` is 420 / 30 (one small landing), `settle` 520 / 40
  (none); the pen is 380 ms.
- **`notary`**, for a quote the client accepted. Add it where the document shows, once:

  ```html
  <div data-moment="thud">
    …the quote…
    <span data-moment="notary" role="img" aria-label="Accepted 6 Nov 2026">
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle data-part="ink" pathLength="1" cx="48" cy="48" r="45" />
        <circle data-part="ink" pathLength="1" cx="48" cy="48" r="39" />
        <text data-part="word" x="48" y="50" text-anchor="middle">Accepted</text>
        <text data-part="date" x="48" y="64" text-anchor="middle">6 Nov 2026</text>
      </svg>
    </span>
  </div>
  ```

  The seal is `--orange` (Devis's seal gold) on its own paper disc, at -8deg (an object keeps its
  angle). It presses in whole from 1.5 times its size, a few degrees turned, lands with `pop`'s
  one small overshoot, and the container (`thud`) takes a 1 px jolt. When the record is opened
  later, `data-state="rest"` shows it as it stands without playing. Under reduced motion it fades
  in place, with no scale, turn or jolt. Other looks draw the rings (outer, then inner) and fade
  the words in.

- **`stamp`** is pressed on square, from 1.3 times its size at -6deg, with the pop spring.
- **`seal`** (the status pill) fills and writes its tick without the rays: acceptance is sober.
- **`postmark`** marks a sign-in code sent by email. Devis has no version of its own: the rings and
  lines draw themselves in, as in every look but Relais.

For the client's page: the Accept button is `data-moment="press"` (busy shows the stripes), and
the accepted quote gets a `notary` seal. One moment per action, as below.

## A moment budget

- One moment per action. Publishing gets the stamp; it doesn't also get a toast and confetti.
- Never two moments at the same time in the same place.
- Moments are for things that matter: the first publish, approvals, sign-in. Saving the hundredth
  time is a micro-interaction, not a moment.
- Every moment says something in words too (a label, a toast, `aria-live`). Motion is never the
  only signal.
- A `flash` marks what changed where you weren't looking: the slug a title rewrote, the row a
  dialog updated. The thing you clicked already answers with its own press or tick, so it doesn't
  flash too, and nothing flashes and gets a `change-mark` at once: a flash is your change, a
  change-mark someone else's.

## The catalogue

Three kinds:

- **Micro-interactions** belong to a component and happen every time.
- **Moments** are named events, rarer and with more character.
- **Transitions** are how one view becomes another.

Attributes: put `data-moment="<name>"` on the element; one element can carry more than one,
space-separated (`data-moment="press save"`). States are `data-state="busy|done|failed"` unless
noted. Parts are children marked `data-part="<part>"`; every part is optional unless the moment
can't work without it. Lines that draw themselves are SVG paths (or circles) with `pathLength="1"`
and `data-part="ink"`.

Moments move things with `transform` and set the `animation` or `transition` of the elements they
name. Position those elements with `translate` or `inset`, and leave their animation and
transition to the moment. Settings are CSS variables a component can set on its own element.
Names starting with `--m-` are internal, and so are the `trentesix-` keyframes other than the three
in [Arriving and leaving](#arriving-and-leaving).

### Micro-interactions

| Name          | Lives in                  | Markup and states                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `press`       | Button                    | `data-moment="press"`; reacts to `:active` and `data-pressed`. Discothèque presses into its shadow (`--press`; set it lower on a button without one), Folio sinks 1 px and darkens a shade. Lands in 90 ms and lets go 90 ms later at the earliest. `data-state="busy"` shows the busy cue: stripes roll inside (Discothèque), a line runs along the bottom (Folio).                                                                               |
| `switch`      | Switch                    | part `thumb`, on/off from `aria-checked` (or a checked input inside); the thumb stretches while pressed (6 px / 4 px), then lands with `--spring-pop`. Settings: `--switch-thumb`, `--switch-travel`, `--switch-stretch`.                                                                                                                                                                                                                          |
| `slide`       | Segmented, Tabs           | part `indicator`, placed by `slide()` through `--x` and `--w`; glides between options.                                                                                                                                                                                                                                                                                                                                                             |
| `field-error` | TextField, every field    | on the box around the input; `data-invalid`: Discothèque shakes once, Folio draws a rust line under the field. Part `message` (inside, or a sibling after it) drops in (Folio: rises).                                                                                                                                                                                                                                                             |
| `save`        | SaveButton                | `data-state="dirty\|busy\|done\|failed"`; dirty shows a dot (part `dot`) that pings once, busy shows the busy cue, done draws a tick (part `ink`), failed shakes (Folio: a rust line along the bottom). `data-shortcut` flashes the press when ⌘S was used. This is also the unsaved state and the ⌘S press.                                                                                                                                       |
| `copied`      | CopyButton                | part `icon` holds the copy glyph and the tick's SVG (the one with part `ink`) in one centred cell; `data-state="done"` swaps them and draws the tick. Part `tag` ("Copied") rises and fades after a second.                                                                                                                                                                                                                                        |
| `counter`     | Count, Badge              | `count(el, value)` rolls the digits that changed; it fills the element with digit columns (part `digit`), so the element holds only the number.                                                                                                                                                                                                                                                                                                    |
| `code-cells`  | CodeField                 | parts `cell` (`data-filled`), each holding its digit in a child element; `data-state="done"` closes the gaps and draws a tick; `failed` shakes or edges in rust, then the digits leave right to left (clear them after about 1 s).                                                                                                                                                                                                                 |
| `hold`        | Button `intent="destroy"` | `hold(button, {ms, onConfirm})`; part `fill` grows while held, drains if released early. The button gets `data-state="busy"` while held and `done` at the end.                                                                                                                                                                                                                                                                                     |
| `flash`       | Anything you just changed | something you just changed, away from where you clicked, when added or with `flash(el)` (which plays it again on an element already marked): the background takes `--flash` and fades back to its own. Discothèque hits at once in marigold, holds a beat and fades over three drifts; Folio's pale wash soaks in like ink, then dries. Under reduced motion the colour still shows and fades in 200 ms. Someone else's change is a `change-mark`. |

### Moments

| Name          | Lives in                  | Markup and states                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toast`       | Toast                     | enters from below; part `timer` is the clock (`--toast-time`, 5 s): `toastTimer(el)` resolves when its bar runs out and pauses on hover and focus. `data-state="leaving"` exits; remove the toast on `animationend`.                                                                                                                                                                               |
| `stamp`       | Stamp (Discothèque)       | thuds down with a slight turn when added, and lifts off after 1.8 s; the page gives a 2 px jolt (`data-moment="thud"` on the container, which jolts when a stamp lands in it or on `data-state="done"`; in Devis, 1 px when a `notary` seal is pressed in it).                                                                                                                                     |
| `seal`        | StatusPill                | Folio's publish, and approve and schedule in both looks. `data-state="done"`: part `fill` sweeps in, the `ink` writes itself in order (a ring, then a tick), part `rays` sparks once, part `edge` draws down the card, part `label` firms up, part `badge` pops onto an avatar. `failed` (changes asked) does the same without ink.                                                                |
| `change-mark` | ChangeMark                | something someone else just changed (yours is a `flash`), when added: part `bar` draws down the edge, part `highlight` sweeps the words, then both fade over about 4 s.                                                                                                                                                                                                                            |
| `postmark`    | Sent reply (Relais)       | a cancellation mark added to the page when something is sent: an SVG with `ink` rings and wavy lines (`pathLength="1"`, rings first) and a `date` text. Relais presses it in with `--spring-settle`, then it settles back to `--postmark-rest` (0.72); other looks draw the ink in order and fade the date in. `data-state="leaving"` fades it.                                                    |
| `notary`      | Accepted document (Devis) | the seal pressed on a document that now binds: an SVG with two `ink` circles (`pathLength="1"`, outer first), a `word` and a `date` text, on its own paper disc at -8deg. Devis presses it in with `--spring-pop` and jolts the `thud` around it 1 px; other looks draw the rings and fade the words in. `data-state="rest"` shows it without playing (a record opened later); `leaving` fades it. |
| `sweep`       | New row or panel (Relais) | the element holds a part `band`, which arrives once along its top edge and fades after about 1.5 s. Relais sweeps the airmail stripe in from the left (`--sweep-height` is `--stripe-band`); other looks draw a 3 px `--mustard` line. `--sweep-fill` sets its background.                                                                                                                         |
| `milestone`   | Celebration               | first publish and other firsts, when added: part `card` lands, its `ink` seal draws, one burst: ten strips in part `confetti` (Discothèque) or part `rays` (Folio). `data-state="leaving"` fades it.                                                                                                                                                                                               |
| `arrival`     | PresenceStack             | someone joins: their avatar slides into the stack, then part `ring` pings three times (Discothèque) or its `ink` circle draws itself around the avatar (Folio).                                                                                                                                                                                                                                    |
| `curtain`     | Sign-in page              | `data-state="done"` when signed in: the five children of part `bands` sweep up and lift away (Discothèque), or are pulled across as hazard tape and lift away (Devis); part `card` steps back and part `view` (the Studio) rises (Folio).                                                                                                                                                          |
| `develop`     | Upload tile               | an uploaded image develops like a print with the upload: set `--progress` (0 to 1). Part `image` goes from soft to sharp (Folio: grey to colour), part `progress` fills; `data-state="done"` flashes (Discothèque) or draws the `ink` tick in part `badge` (Folio).                                                                                                                                |
| `pen`         | AI suggestion diff        | when added, part `del` gets a line drawn through it, then part `ins` writes itself in, underline and all. `data-state="done"` (accepted) folds `del` away and settles `ins` into plain ink.                                                                                                                                                                                                        |
| `wind`        | Schedule button           | `data-state="done"`: part `minute` winds two turns and part `hour` three quarters, landing on `--hour` (270deg by default); then the pill (a `seal`) reads the time.                                                                                                                                                                                                                               |

### Transitions

| Name           | Lives in              | How                                                                                                                                                                                                                                        |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title-flight` | List → editor route   | `flight(from, to)`: the entry's title flies from its row into the editor's heading.                                                                                                                                                        |
| `grow-from`    | Create → editor route | `growFrom(button, view)`: the new editor grows out of the "+ New" button, and back on the way out (`{back: true}`).                                                                                                                        |
| `unfold`       | Drawer, Disclosure    | `data-state="open"`: height and opacity, with `@starting-style`; Discothèque settles with a spring.                                                                                                                                        |
| `dialog`       | Dialog, Popover, Menu | Discothèque rises 16 px with `--spring-pop` and its shadow grows as it lands; Folio rises 8 px from 98% with `--spring-settle`. The backdrop (`::backdrop`, or part `backdrop` next to the panel) fades. `data-state="leaving"` closes it. |
| `bin`          | Rows in every list    | `bin(row)`: the row slides out and the gap closes; undo, `bin(row, {back: true})`, brings it back, then mark it with a `change-mark`.                                                                                                      |
| `lift`         | Sortable lists        | `data-state="lifted"`: the row rises and tilts (Discothèque) or lifts 1.5% with a shadow (Folio).                                                                                                                                          |
| `wait`         | Skeleton              | appears only after 200 ms, so fast loads show no skeleton at all; parts `bone` shimmer, and stop under reduced motion.                                                                                                                     |
| `lights`       | Theme switch          | `switchLights(apply, {x, y})`: the new theme spreads as a circle from the switch (View Transitions); Folio and reduced motion cross-fade.                                                                                                  |

### Site

| Name     | Lives in | How                                                                                                                                                                                                                                                                                                                            |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ticker` | LiveBand | part `track` scrolls (give it two copies side by side; `--ticker-time`, 70 s); stops while the element holding it is hovered or focused (a Play button beside it doesn't pause it) and with `data-state="paused"`; under reduced motion it starts paused and `data-state="running"` plays it. Part `dot` pulses while it runs. |

## The helper

```js
import {
  play,
  reduced,
  spring,
  slide,
  count,
  flash,
  hold,
  toastTimer,
  flight,
  growFrom,
  bin,
  switchLights,
} from '@trentesix/core/motion';
```

| Function                        | Does                                                                                                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reduced()`                     | whether motion is reduced right now (system setting or `data-motion`).                                                                                                                                                                                                           |
| `play(el, frames, options)`     | `el.animate()` with the reduced-motion rule built in. `options.info: true` marks a timer or progress, left alone. `fill` defaults to `backwards`; the promise carries the Animation as `.animation`.                                                                             |
| `spring(name, el?)`             | `{duration, easing}` of `pop`, `settle` or `pen` in the current look (the page's, or `el`'s own).                                                                                                                                                                                |
| `slide(indicator, target)`      | moves a `slide` indicator to `target` (sets `--x` and `--w`).                                                                                                                                                                                                                    |
| `count(el, value)`              | rolls a `counter` to `value`; returns a promise.                                                                                                                                                                                                                                 |
| `flash(el)`                     | marks `el` with the `flash` moment, or plays it again if it's already marked; resolves when the colour has faded.                                                                                                                                                                |
| `hold(button, {ms, onConfirm})` | press and hold to confirm, with Space and Enter; a click with no pointer or key (screen reader, voice control) starts the hold and lets it finish, Escape, blur or the tab hiding cancels it; a throwing `onConfirm` is reported with `reportError`; returns a cleanup function. |
| `toastTimer(el)`                | resolves when the toast's timer bar runs out; the timer is the animation, so hovering pauses both, and so does a hidden tab.                                                                                                                                                     |
| `flight(from, to)`              | flies `from`'s look into `to` (a cross-fading ghost); waits while one flight is still running.                                                                                                                                                                                   |
| `growFrom(origin, view)`        | grows `view` out of `origin`'s box; `growFrom(origin, view, {back: true})` shrinks it back.                                                                                                                                                                                      |
| `bin(row, {back})`              | slides the row out and closes its gap; resolves when done. `{back: true}` opens the gap and slides it back in.                                                                                                                                                                   |
| `switchLights(apply, {x, y})`   | runs `apply()` inside a View Transition that spreads from (x, y); just calls `apply()` where unsupported.                                                                                                                                                                        |

Everything returns promises that resolve when the motion is done (never rejects), so code can
`await` a moment before moving on.

`flight()`, `growFrom()` and `bin(row, {back: true})` measure both ends, so show the destination
before calling them and hide the source after they resolve. A view that sets its own `display`
(a grid list, say) doesn't hide with the `hidden` attribute unless something says so:
`moments.css` does for anything inside a moment, and a page should have
`[hidden] { display: none !important; }` for the rest.
