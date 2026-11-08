# Foundations

Colour, type, space, shape, elevation, focus, icons and layout: the parts every screen is made
of. Every value here comes from the token JSON (`packages/core/tokens.json` for the base, then each
look's `packages/<look>/tokens.json`) and from the CSS that `scripts/build.mjs` generates from it.
When they disagree, the JSON wins; run `pnpm build`.

There are four looks:

- **Discothèque** (the default) is print you can touch: warm paper, thick ink outlines, hard
  offset shadows, a serif for display.
- **Folio** (`data-look="folio"` on `<html>`) is calm and conventional: cool greys, 1px borders,
  soft shadows, one sans-serif.
- **Devis** (`data-look="devis"`) is for the quote tool: a worksite's structure (condensed
  capitals, 2px ink outlines, a faint grid, no shadows on objects) with bank-note green, cool
  paper and a serif for titles and money. Hi-vis yellow (`--mustard`) marks only what needs
  attention; seal gold (`--orange`) is for the acceptance seal.
- **Relais** (`data-look="relais"`) is for the email desk: postal navy ink on cool blue-grey paper,
  rounder corners and pill buttons, Instrument Sans for the interface and Newsreader for the
  letters people send. Airmail red marks only what needs attention.

Each look has a light and a dark theme. Discothèque calls them "Lights on" and "Lights off";
Folio calls them "Light" and "Dark"; Devis calls them "Day" and "Night". See the README for the
attributes.

Devis and Relais write their tokens in Discothèque's names directly, so they have no prefixed
names of their own; what differs beyond colour is in each JSON's `look` section. Devis adds one
variable the others don't set: `--font-money`, for quote titles and totals. Write
`font-family: var(--font-money, var(--font-display))` so the other looks fall back to their
display face. Relais adds `--font-letter` (messages), `--font-mark` (the wordmark),
`--relais-note`, `--relais-note-edge` and `--relais-airmail`.

## One set of names

Component CSS reads **Discothèque's variable names** whatever the look. Folio gives those names
its own values, so `var(--paper)` is warm paper in Discothèque and Folio's grey canvas in Folio.
Write component CSS with the shared names below and it works in every look.

Folio's own token names are also available, prefixed: `--folio-canvas`, `--folio-accent`,
`--folio-presence-3` and so on (only under `data-look="folio"`). Use them only for something that
exists in Folio alone.

## Colour

### Surfaces

| Variable           | Means                                                                                   | Folio role      |
| ------------------ | --------------------------------------------------------------------------------------- | --------------- |
| `--paper`          | The page ground behind everything. A page never sits on white.                          | `canvas`        |
| `--paper-raised`   | Anything that is an object on the page: cards, tiles, dialogs.                          | `surface`       |
| `--paper-sunk`     | Wells: board columns, progress tracks, skeleton base.                                   | `surface-sunk`  |
| `--paper-tint`     | Hover on rows and tiles; empty translation cells; dashed drop zones.                    | `surface-hover` |
| `--field`          | Inside text inputs and editors only, so typing surfaces read as paper you write on.     | `field`         |
| `--chocolate`      | Discothèque's dark band: top bar, toasts. In Folio, a plain surface. Code has `--code`. | `surface`       |
| `--chocolate-soft` | Sidebar ground; inputs inside the top bar. In Folio, a plain surface.                   | `surface`       |

| Variable           | Discothèque light | Discothèque dark | Folio light | Folio dark |
| ------------------ | ----------------- | ---------------- | ----------- | ---------- |
| `--paper`          | `#F7EBD0`         | `#1C110A`        | `#F5F6F8`   | `#111418`  |
| `--paper-raised`   | `#FFFAF0`         | `#2A1A10`        | `#FFFFFF`   | `#191D23`  |
| `--paper-sunk`     | `#EFDFBC`         | `#24170E`        | `#EDEFF2`   | `#0D1014`  |
| `--paper-tint`     | `#FBEFD6`         | `#33200F`        | `#F0F3F7`   | `#222830`  |
| `--field`          | `#FFFFFF`         | `#170E08`        | `#FFFFFF`   | `#14181D`  |
| `--chocolate`      | `#3B2416`         | `#0E0805`        | `#FFFFFF`   | `#191D23`  |
| `--chocolate-soft` | `#5A3822`         | `#160D07`        | `#FFFFFF`   | `#191D23`  |

### Text and lines

| Variable               | Means                                                                                     | Folio role      |
| ---------------------- | ----------------------------------------------------------------------------------------- | --------------- |
| `--ink`                | Primary text. In Discothèque, also the 2px outline of every object.                       | `text`          |
| `--ink-muted`          | Secondary text, metadata, labels.                                                         | `text-muted`    |
| `--ink-subtle`         | Placeholders, drag grips, disabled text. Never the only copy of an instruction.           | `text-subtle`   |
| `--rule`               | Dividers between rows and fields. Decorative only.                                        | `border`        |
| `--ink-line`           | The edge of text inputs, search boxes and editors. At least 3:1 against what they sit on. | `border-strong` |
| `--on-chocolate`       | Text on `--chocolate` and `--chocolate-soft`.                                             | `text`          |
| `--on-chocolate-muted` | Secondary text on the same.                                                               | `text-muted`    |

| Variable               | Discothèque light | Discothèque dark | Folio light | Folio dark |
| ---------------------- | ----------------- | ---------------- | ----------- | ---------- |
| `--ink`                | `#3B2416`         | `#F7EBD0`        | `#1A2029`   | `#E8EBEF`  |
| `--ink-muted`          | `#6B4F36`         | `#C9B28A`        | `#4F5A68`   | `#AAB3BF`  |
| `--ink-subtle`         | `#7A5D42`         | `#A8906C`        | `#5E6978`   | `#939DAA`  |
| `--rule`               | `#D9C49A`         | `#4A3020`        | `#DDE1E6`   | `#2C333C`  |
| `--ink-line`           | `#8A7763`         | `#8A7558`        | `#7D8794`   | `#6E7987`  |
| `--on-chocolate`       | `#F7EBD0`         | `#F7EBD0`        | `#1A2029`   | `#E8EBEF`  |
| `--on-chocolate-muted` | `#E9D6B0`         | `#C9B28A`        | `#4F5A68`   | `#AAB3BF`  |

### Action, selection and status

| Variable               | Means                                                                                                            | Folio role     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- |
| `--action`             | Primary buttons (Publish, Save, New). Pair with `--on-action`.                                                   | `accent`       |
| `--on-action`          | Text on `--action`.                                                                                              | `on-accent`    |
| `--mustard`            | Selection and small highlights: the selected item, counts, review state. Discothèque's signature fill.           | `accent-soft`  |
| `--on-mustard`         | Text on `--mustard`.                                                                                             | `accent-text`  |
| `--mustard-soft`       | Inserted text in diffs, freshly added rows, warning suggestions.                                                 | `warning-soft` |
| `--panel-highlight`    | A big panel that calls for you ("needs you", getting started). Mustard in Lights on, mustard-soft in Lights off. | `accent-soft`  |
| `--on-panel-highlight` | Text on `--panel-highlight`.                                                                                     | `accent-text`  |
| `--orange`             | Decoration only: display italics at 28px and up, stripes, cursors. Never small text.                             | `accent`       |
| `--rust`               | Danger and errors: text on paper, deletions in diffs. Also Discothèque's link colour.                            | `danger`       |
| `--rust-soft`          | Background of blocking problems and deleted text.                                                                | `danger-soft`  |
| `--avocado`            | Large fills for "live" and success areas (tiles, stubs). Text on it is large and `--on-avocado`.                 | `success`      |
| `--on-avocado`         | Large text on `--avocado`.                                                                                       | `on-success`   |
| `--success`            | Live status and success buttons; success text.                                                                   | `success`      |
| `--success-soft`       | Background of live pills and "all caught up" notices.                                                            | `success-soft` |
| `--warning-ink`        | Warning text: suggestions, counters near their limit.                                                            | `warning`      |
| `--teal`               | Scheduled and informational.                                                                                     | `info`         |
| `--teal-soft`          | Background of scheduled pills and info notes.                                                                    | `info-soft`    |
| `--plum`               | The sixth presence colour. Never a status.                                                                       | `presence-6`   |
| `--on-plum`            | Text on plum and teal fills.                                                                                     | `on-presence`  |
| `--focus`              | The focus ring.                                                                                                  | `focus`        |

| Variable               | Discothèque light | Discothèque dark | Folio light | Folio dark |
| ---------------------- | ----------------- | ---------------- | ----------- | ---------- |
| `--action`             | `#B8491A`         | `#E57A47`        | `#1F5FC4`   | `#6EA0F2`  |
| `--on-action`          | `#FFFFFF`         | `#1C110A`        | `#FFFFFF`   | `#0D1014`  |
| `--mustard`            | `#E1A730`         | `#E1A730`        | `#E8F0FC`   | `#17253B`  |
| `--on-mustard`         | `#3B2416`         | `#3B2416`        | `#1C56B3`   | `#8DB4F5`  |
| `--mustard-soft`       | `#FFF1C7`         | `#3A2A0C`        | `#FFF4DB`   | `#33270D`  |
| `--panel-highlight`    | `#E1A730`         | `#3A2A0C`        | `#E8F0FC`   | `#17253B`  |
| `--on-panel-highlight` | `#3B2416`         | `#F7EBD0`        | `#1C56B3`   | `#8DB4F5`  |
| `--orange`             | `#D9622B`         | `#E57A47`        | `#1F5FC4`   | `#6EA0F2`  |
| `--rust`               | `#A8401A`         | `#F0A27A`        | `#B42318`   | `#F2877D`  |
| `--rust-soft`          | `#FBE6DC`         | `#3B1A0E`        | `#FDECEA`   | `#3A1714`  |
| `--avocado`            | `#7A8B3A`         | `#9DB050`        | `#18794E`   | `#5CC08F`  |
| `--on-avocado`         | `#3B2416`         | `#1C110A`        | `#FFFFFF`   | `#0D1014`  |
| `--success`            | `#56651F`         | `#9DB050`        | `#18794E`   | `#5CC08F`  |
| `--success-soft`       | `#E7EDCF`         | `#232B10`        | `#E6F4EC`   | `#12301F`  |
| `--warning-ink`        | `#875700`         | `#E1A730`        | `#8A5A00`   | `#E5B454`  |
| `--teal`               | `#1F4B5A`         | `#7FB3C4`        | `#0B6E85`   | `#5EC2DA`  |
| `--teal-soft`          | `#DCEBEF`         | `#10262E`        | `#E2F3F7`   | `#10292F`  |
| `--plum`               | `#7A3B5A`         | `#D9A0BC`        | `#7A3FA0`   | `#C59BE0`  |
| `--on-plum`            | `#FFFFFF`         | `#1C110A`        | `#FFFFFF`   | `#0D1014`  |
| `--focus`              | `#E1A730`         | `#E1A730`        | `#1F5FC4`   | `#6EA0F2`  |

Mustard is for small things: a selection, a count, a highlight, a button. A big panel that calls
for you takes `--panel-highlight` with `--on-panel-highlight` and `--shadow-panel-highlight`
instead. In Lights on it is the same mustard; in Lights off, where a wall of mustard glares, it
is mustard-soft with a mustard offset shadow, and the selections and counts inside it stay full
mustard.

```css
.needs-you {
  background: var(--panel-highlight);
  color: var(--on-panel-highlight);
  box-shadow: var(--shadow-panel-highlight);
}
```

### Roles that differ by look

A few variables name a role rather than a colour, because the looks fill that role
differently. Prefer them to the raw colour.

| Variable                 | Discothèque              | Folio                       | Devis                   | Relais                  | Use                                        |
| ------------------------ | ------------------------ | --------------------------- | ----------------------- | ----------------------- | ------------------------------------------ |
| `--outline`              | `--ink`                  | `--folio-border`            | `--ink`                 | `--rule`                | the edge of objects: cards, tables, panels |
| `--outline-control`      | `--ink`                  | `--folio-border-strong`     | `--ink`                 | `--ink-line`            | the edge of controls: buttons, switches    |
| `--outline-field`        | `--ink-line`             | `--ink-line`                | `--ink-line`            | `--ink-line`            | the edge of a text input at rest           |
| `--outline-field-active` | `--ink`                  | `--ink-line`                | `--ink`                 | `--action`              | the same, hovered or focused               |
| `--divider`              | `2px dotted var(--rule)` | `1px solid var(--rule)`     | `1px solid var(--rule)` | `1px solid var(--rule)` | a whole `border` value between rows        |
| `--link`                 | `--rust`                 | `--folio-accent-text`       | `--action`              | `--action`              | links in text                              |
| `--inverse`              | `--chocolate`            | `--folio-inverse`           | `--chocolate`           | `--chocolate`           | the one dark-on-light object: toasts       |
| `--on-inverse`           | `--on-chocolate`         | `--folio-on-inverse`        | `--on-chocolate`        | `--on-chocolate`        | text on `--inverse`                        |
| `--on-inverse-accent`    | `--mustard`              | `--folio-on-inverse-accent` | `--mustard`             | `--code-keyword`        | the action word in a toast (Undo)          |
| `--selected-soft`        | `--mustard-soft`         | `--folio-accent-soft`       | `--mustard-soft`        | `--teal-soft`           | a soft selection fill                      |
| `--backdrop`             | (not set)                | `--folio-overlay`           | (not set)               | (not set)               | the dimmed backdrop behind dialogs         |

`--chocolate` is white in Folio: Folio has no dark band, so the top bar and sidebar are plain
surfaces. For a toast or tooltip that must stay dark in every look, use `--inverse`.

### Code wells

A code well is a dark panel for code: a block of code, a terminal, a request and its answer. It
stays dark in both themes, so code reads the same everywhere, and it has its own syntax colours.

| Variable          | Means                                                               | Folio role        |
| ----------------- | ------------------------------------------------------------------- | ----------------- |
| `--code`          | The well.                                                           | `code`            |
| `--on-code`       | Code and plain text in it.                                          | `code-text`       |
| `--on-code-muted` | Comments, punctuation, line numbers and labels.                     | `code-text-muted` |
| `--code-rule`     | Lines between rows and panes inside the well. Decorative only.      | `code-border`     |
| `--code-keyword`  | Keywords, keys and the line being pointed at.                       | `code-keyword`    |
| `--code-string`   | Strings and values.                                                 | `code-string`     |
| `--code-function` | Function names, numbers and constants.                              | `code-function`   |
| `--code-focus`    | The focus ring on a control inside the well, in place of `--focus`. | `code-focus`      |

| Variable          | Discothèque light | Discothèque dark | Folio light | Folio dark |
| ----------------- | ----------------- | ---------------- | ----------- | ---------- |
| `--code`          | `#3B2416`         | `#0E0805`        | `#1A2029`   | `#1A2029`  |
| `--on-code`       | `#F7EBD0`         | `#F7EBD0`        | `#E8EBEF`   | `#E8EBEF`  |
| `--on-code-muted` | `#E9D6B0`         | `#C9B28A`        | `#9AA4B2`   | `#9AA4B2`  |
| `--code-rule`     | `#5A3822`         | `#160D07`        | `#2C3440`   | `#2C3440`  |
| `--code-keyword`  | `#E1A730`         | `#E1A730`        | `#8DB4F5`   | `#8DB4F5`  |
| `--code-string`   | `#C9D98A`         | `#C9D98A`        | `#7FD4A8`   | `#7FD4A8`  |
| `--code-function` | `#F2B48F`         | `#F2B48F`        | `#F0B37E`   | `#F0B37E`  |
| `--code-focus`    | `#E1A730`         | `#E1A730`        | `#6EA0F2`   | `#6EA0F2`  |

### Folio only

These exist as `--folio-*` variables only under `data-look="folio"`:

- `--folio-accent-hover`: primary button hover and press.
- `--folio-danger`, `--folio-on-danger`: a danger fill and its text.
- `--folio-on-success`: text on a success fill.
- `--folio-overlay`: the dialog backdrop (`rgba(16, 24, 40, 0.45)` light, `rgba(0, 0, 0, 0.6)`
  dark).
- `--folio-presence-1` to `--folio-presence-6` and `--folio-on-presence`: one colour per person on
  a screen, with initials in `--folio-on-presence` (at least 4.5:1 on all six).
- `--folio-type-article`, `--folio-type-event`, `--folio-type-media`, `--folio-type-person`: type
  squares in link chips and search results.

### Contrast pairs that are safe

Ratios are WCAG contrast, computed from the token values, light theme then dark, and rounded
down. The pairs live in `packages/core/contrast.json`; `pnpm check` fails when one drops below what it
needs (4.5:1 for text, 3:1 for large text and for focus rings and the edges of controls), and
`pnpm build` writes these tables from the same list.

<!-- contrast-pairs: written by pnpm build from packages/core/contrast.json -->

| Text or mark                | On                  | Needs | Discothèque | Devis       | Folio       | Relais      | Safe for                       |
| --------------------------- | ------------------- | ----- | ----------- | ----------- | ----------- | ----------- | ------------------------------ |
| `--ink`                     | `--paper`           | 4.5:1 | 12.2 / 15.6 | 14.3 / 15.5 | 15.1 / 15.4 | 14.1 / 15.2 | any text                       |
| `--ink`                     | `--paper-raised`    | 4.5:1 | 13.9 / 14.1 | 16.1 / 14.2 | 16.3 / 14.1 | 15.9 / 13.7 | any text                       |
| `--ink`                     | `--paper-sunk`      | 4.5:1 | 11.0 / 14.7 | 12.7 / 16.1 | 14.2 / 15.9 | 12.8 / 15.8 | any text                       |
| `--ink`                     | `--paper-tint`      | 4.5:1 | 12.7 / 13.1 | 15.1 / 12.7 | 14.7 / 12.4 | 15.0 / 12.5 | any text                       |
| `--ink`                     | `--field`           | 4.5:1 | 14.4 / 16.0 | 16.1 / 16.1 | 16.3 / 14.9 | 15.9 / 15.8 | typing                         |
| `--ink-muted`               | `--paper`           | 4.5:1 | 6.3 / 9.0   | 6.9 / 8.6   | 6.4 / 8.7   | 6.4 / 8.7   | any text                       |
| `--ink-muted`               | `--paper-raised`    | 4.5:1 | 7.2 / 8.1   | 7.8 / 7.8   | 7.0 / 7.9   | 7.3 / 7.8   | any text                       |
| `--ink-muted`               | `--paper-sunk`      | 4.5:1 | 5.7 / 8.4   | 6.1 / 8.9   | 6.0 / 8.9   | 5.9 / 9.0   | any text                       |
| `--ink-subtle`              | `--paper`           | 4.5:1 | 5.1 / 6.0   | 5.4 / 6.8   | 5.1 / 6.7   | 5.3 / 6.9   | any text (never the only copy) |
| `--ink-subtle`              | `--paper-raised`    | 4.5:1 | 5.8 / 5.4   | 6.2 / 6.2   | 5.5 / 6.1   | 6.1 / 6.2   | any text (never the only copy) |
| `--ink-subtle`              | `--field`           | 4.5:1 | 6.0 / 6.2   | 6.2 / 7.1   | 5.5 / 6.4   | 6.1 / 7.2   | placeholders                   |
| `--link`                    | `--paper`           | 4.5:1 | 5.2 / 8.9   | 8.2 / 9.9   | 6.4 / 8.7   | 9.1 / 8.5   | links                          |
| `--link`                    | `--paper-raised`    | 4.5:1 | 5.9 / 8.0   | 9.3 / 9.0   | 6.9 / 8.0   | 10.3 / 7.7  | links                          |
| `--on-action`               | `--action`          | 4.5:1 | 5.2 / 6.3   | 9.3 / 10.1  | 6.0 / 7.2   | 10.3 / 8.5  | button labels                  |
| `--on-mustard`              | `--mustard`         | 4.5:1 | 6.7 / 6.7   | 11.2 / 11.2 | 6.0 / 7.3   | 5.8 / 6.6   | any text                       |
| `--on-panel-highlight`      | `--panel-highlight` | 4.5:1 | 6.7 / 11.7  | 11.2 / 11.0 | 6.0 / 7.3   | 13.1 / 13.3 | any text                       |
| `--rust`                    | `--paper`           | 4.5:1 | 5.2 / 8.9   | 6.5 / 9.1   | 6.0 / 7.5   | 5.8 / 9.1   | error text                     |
| `--rust`                    | `--rust-soft`       | 4.5:1 | 5.1 / 7.5   | 5.8 / 7.7   | 5.7 / 6.5   | 5.2 / 7.7   | error text in a problem box    |
| `--success`                 | `--paper`           | 4.5:1 | 5.4 / 7.7   | 8.2 / 9.9   | 5.0 / 8.2   | 5.7 / 10.0  | success text                   |
| `--success`                 | `--success-soft`    | 4.5:1 | 5.3 / 6.1   | 7.6 / 7.6   | 4.7 / 6.3   | 5.4 / 7.8   | live pills                     |
| `--on-action`               | `--success`         | 4.5:1 | 6.4 / 7.7   | 9.3 / 10.1  | 5.4 / 8.5   | 6.4 / 10.0  | success button labels          |
| `--on-avocado`              | `--avocado`         | 3:1   | 3.8 / 7.7   | 5.2 / 7.9   | 5.4 / 8.5   | 5.2 / 10.0  | large text on avocado fills    |
| `--warning-ink`             | `--paper`           | 4.5:1 | 5.2 / 8.6   | 5.6 / 12.7  | 5.4 / 9.6   | 6.5 / 11.5  | warning text                   |
| `--warning-ink`             | `--mustard-soft`    | 4.5:1 | 5.4 / 6.4   | 5.7 / 9.0   | 5.4 / 7.6   | 6.0 / 10.1  | warning suggestions            |
| `--teal`                    | `--paper`           | 4.5:1 | 8.0 / 8.0   | 8.1 / 10.0  | 5.4 / 8.9   | 6.0 / 10.1  | info text                      |
| `--teal`                    | `--teal-soft`       | 4.5:1 | 7.7 / 6.8   | 7.3 / 8.7   | 5.1 / 7.3   | 5.4 / 8.3   | scheduled pills                |
| `--on-plum`                 | `--plum`            | 4.5:1 | 8.0 / 8.5   | 8.0 / 8.6   | 6.8 / 8.2   | 8.2 / 8.8   | presence tabs                  |
| `--on-plum`                 | `--teal`            | 4.5:1 | 9.4 / 8.0   | 9.1 / 10.2  | 5.8 / 9.2   | 6.8 / 10.1  | type squares                   |
| `--on-chocolate`            | `--chocolate`       | 4.5:1 | 12.2 / 16.8 | 14.3 / 16.7 | 16.3 / 14.1 | 14.1 / 16.4 | top bar                        |
| `--on-chocolate`            | `--chocolate-soft`  | 4.5:1 | 8.7 / 16.2  | 11.9 / 15.8 | 16.3 / 14.1 | 12.1 / 15.4 | sidebar                        |
| `--on-chocolate-muted`      | `--chocolate`       | 4.5:1 | 10.1 / 9.6  | 9.3 / 9.2   | 7.0 / 7.9   | 8.7 / 9.4   | secondary text in the top bar  |
| `--on-inverse`              | `--inverse`         | 4.5:1 | 12.2 / 16.8 | 14.3 / 16.7 | 15.1 / 15.4 | 14.1 / 16.4 | toasts                         |
| `--on-inverse-accent`       | `--inverse`         | 4.5:1 | 6.7 / 9.2   | 11.2 / 13.7 | 7.7 / 5.7   | 7.9 / 9.8   | the action word in a toast     |
| `--on-code`                 | `--code`            | 4.5:1 | 12.2 / 16.8 | 14.3 / 16.7 | 13.6 / 13.6 | 14.1 / 16.4 | code                           |
| `--on-code-muted`           | `--code`            | 4.5:1 | 10.1 / 9.6  | 9.3 / 9.2   | 6.4 / 6.4   | 8.7 / 9.4   | comments and labels in code    |
| `--code-keyword`            | `--code`            | 4.5:1 | 6.7 / 9.2   | 11.2 / 13.7 | 7.7 / 7.7   | 7.9 / 9.8   | keywords in code               |
| `--code-string`             | `--code`            | 4.5:1 | 9.5 / 13.0  | 10.0 / 12.3 | 9.2 / 9.2   | 9.6 / 11.9  | strings in code                |
| `--code-function`           | `--code`            | 4.5:1 | 8.0 / 11.0  | 9.6 / 11.8  | 8.9 / 8.9   | 11.2 / 13.9 | function names in code         |
| `--ink-line`                | `--field`           | 3:1   | 4.2 / 4.3   | 5.1 / 5.5   | 3.6 / 4.0   | 4.8 / 5.4   | input edges                    |
| `--ink-line`                | `--paper`           | 3:1   | 3.6 / 4.2   | 4.5 / 5.3   | 3.3 / 4.1   | 4.2 / 5.2   | input edges                    |
| `--ink-line`                | `--paper-sunk`      | 3:1   | 3.2 / 3.9   | 4.0 / 5.5   | 3.1 / 4.3   | 3.8 / 5.4   | input edges                    |
| `--outline-control`         | `--paper`           | 3:1   | 12.2 / 15.6 | 14.3 / 15.5 | 3.3 / 4.1   | 4.2 / 5.2   | control edges                  |
| `--outline-control`         | `--paper-raised`    | 3:1   | 13.9 / 14.1 | 16.1 / 14.2 | 3.6 / 3.8   | 4.8 / 4.7   | control edges                  |
| `--focus`                   | `--focus-edge`      | 3:1   | 6.7 / 6.7   | n/a         | n/a         | n/a         | focus ring: the two bands      |
| `--focus` or `--focus-edge` | `--paper`           | 3:1   | 12.2 / 8.6  | 14.3 / 12.7 | 5.5 / 7.0   | 5.2 / 8.5   | focus ring                     |
| `--focus` or `--focus-edge` | `--paper-raised`    | 3:1   | 13.9 / 7.7  | 16.1 / 11.6 | 6.0 / 6.4   | 5.9 / 7.7   | focus ring                     |
| `--focus` or `--focus-edge` | `--paper-sunk`      | 3:1   | 11.0 / 8.1  | 12.7 / 13.2 | 5.2 / 7.2   | 4.7 / 8.9   | focus ring                     |
| `--focus` or `--focus-edge` | `--panel-highlight` | 3:1   | 6.7 / 6.4   | 11.2 / 9.0  | 5.2 / 5.8   | 4.8 / 7.5   | focus ring                     |
| `--focus` or `--focus-edge` | `--field`           | 3:1   | 14.4 / 8.8  | 16.1 / 13.2 | 6.0 / 6.7   | 5.9 / 8.9   | focus ring                     |
| `--focus` or `--focus-edge` | `--chocolate`       | 3:1   | 6.7 / 9.2   | 11.2 / 13.7 | 6.0 / 6.4   | 15.9 / 9.2  | focus ring                     |
| `--focus` or `--focus-edge` | `--chocolate-soft`  | 3:1   | 4.8 / 8.9   | 9.3 / 12.9  | 6.0 / 6.4   | 13.7 / 8.7  | focus ring                     |
| `--code-focus`              | `--code`            | 3:1   | 6.7 / 9.2   | 11.2 / 13.7 | 6.2 / 6.2   | 7.9 / 9.8   | focus ring in a code well      |
| `--focus` or `--focus-edge` | `--inverse`         | 3:1   | 6.7 / 9.2   | 11.2 / 13.7 | 15.1 / 15.4 | 15.9 / 9.2  | the focus ring on a toast      |
| `--link`                    | `--paper-sunk`      | 4.5:1 | 4.6 / 8.4   | 7.3 / 10.3  | 6.0 / 9.0   | 8.3 / 8.9   | links in sunk panels           |
| `--warning-ink`             | `--paper-raised`    | 4.5:1 | 5.9 / 7.7   | 6.3 / 11.6  | 5.9 / 8.8   | 7.4 / 10.4  | warning text on cards          |
| `--warning-ink`             | `--paper-sunk`      | 4.5:1 | 4.7 / 8.1   | 5.0 / 13.2  | 5.1 / 9.9   | 5.9 / 12.0  | warning text in sunk panels    |
| `--on-chocolate-accent`     | `--chocolate`       | 4.5:1 | 6.7 / 9.2   | 11.2 / 13.7 | 6.9 / 8.0   | 7.9 / 9.8   | accent text on chocolate       |

<!-- /contrast-pairs -->

Pairs to avoid:

<!-- contrast-avoid: written by pnpm build from packages/core/contrast.json -->

| Text or mark | On          | Discothèque | Devis     | Folio     | Relais    | Why                                                               |
| ------------ | ----------- | ----------- | --------- | --------- | --------- | ----------------------------------------------------------------- |
| `--orange`   | `--paper`   | 3.0 / 6.3   | 4.3 / 9.6 | 5.5 / 7.0 | 7.3 / 9.1 | Decoration and display italics of 28px and up only.               |
| `--ink`      | `--avocado` | 3.8 / 2.0   | 3.0 / 1.9 | 3.0 / 1.8 | 3.0 / 1.5 | Use `--on-avocado`, and keep text on avocado large.               |
| `--focus`    | `--paper`   | 1.8 / 8.6   | n/a       | n/a       | n/a       | Mustard alone: draw the ring with its `--focus-edge` (see Focus). |
| `--rule`     | `--paper`   | 1.4 / 1.5   | 1.8 / 1.7 | 1.2 / 1.4 | 1.3 / 1.5 | Decorative: never the only edge of a control.                     |

<!-- /contrast-avoid -->

## Type

### Families

| Variable            | Discothèque                       | Folio                 | Devis                            | Relais                     |
| ------------------- | --------------------------------- | --------------------- | -------------------------------- | -------------------------- |
| `--font-display`    | Fraunces (variable), then Georgia | IBM Plex Sans         | Barlow Condensed                 | Instrument Sans (variable) |
| `--font-body`       | Karla (variable), then system UI  | IBM Plex Sans         | Hanken Grotesk (variable)        | Instrument Sans (variable) |
| `--font-mono`       | JetBrains Mono (variable)         | IBM Plex Mono         | Martian Mono (variable)          | IBM Plex Mono              |
| `--font-celebrate`  | Shrikhand                         | IBM Plex Sans         | Instrument Serif                 | Newsreader (variable)      |
| `--font-empty`      | Bagel Fat One                     | IBM Plex Sans         | Barlow Condensed                 | Instrument Sans (variable) |
| `--font-typewriter` | Courier Prime, then Courier New   | (Discothèque's value) | (Discothèque's value)            | (Discothèque's value)      |
| `--font-money`      | (not set)                         | (not set)             | Instrument Serif: titles, totals | (not set)                  |
| `--font-letter`     | (not set)                         | (not set)             | (not set)                        | Newsreader: messages       |
| `--font-mark`       | (not set)                         | (not set)             | (not set)                        | Archivo: the wordmark      |

The fonts are self-hosted, one stylesheet per look: `@trentesix/discotheque/fonts.css`,
`@trentesix/folio/fonts.css`, `@trentesix/devis/fonts.css` and `@trentesix/relais/fonts.css`. A
page loads only its look's.
Courier Prime is not bundled; it falls back to Courier New.

### Scale

The type scale is a set of roles, the same names in every look, as CSS variables:
`--text-<role>` is a whole font value (style, weight, size, line height and family), and
`--text-<role>-tracking` its letter spacing.

```css
.panel h2 {
  font: var(--text-title);
  letter-spacing: var(--text-title-tracking);
}
```

The base gives each role Discothèque's values; a look sets the roles it changes (Folio all of
them; Devis and Relais none yet, so they read the base with their own families). Size / line
height / weight:

| Variable             | Base (Discothèque)                | Folio                    | Use                                                        |
| -------------------- | --------------------------------- | ------------------------ | ---------------------------------------------------------- |
| `--text-display`     | 96px / 0.9 / 900 (display)        | 28px / 1.2 / 600         | The one big line on a screen: a greeting, a poster number. |
| `--text-page-title`  | 56px / 0.95 / 800 (display)       | 22px / 1.3 / 600         | Page and entry titles.                                     |
| `--text-title`       | 34px / 1.05 / 800 (display)       | 16px / 1.4 / 600         | Panel and dialog titles.                                   |
| `--text-section`     | 24px / 1.15 / 700 (display)       | 16px / 1.4 / 600         | Card, tile and form-section headings.                      |
| `--text-item`        | 20px / 1.2 / 700 (display)        | 14px / 1.4 / 600         | Names in rows and on cards.                                |
| `--text-voice`       | 20px / 1.3 / 400 italic (display) | 16px / 1.65 / 400 italic | The app speaking: a gentle note, an empty translation.     |
| `--text-body-l`      | 18px / 1.7 / 400 (body)           | 16px / 1.65 / 400        | Rich text and previews.                                    |
| `--text-body`        | 16px / 1.55 / 400 (body)          | 14px / 1.5 / 400         | Default UI text and inputs.                                |
| `--text-body-strong` | 16px / 1.55 / 700 (body)          | 14px / 1.5 / 500         | Names and button labels.                                   |
| `--text-small`       | 14px / 1.5 / 400 (body)           | 13px / 1.45 / 400        | Metadata, help text, table cells.                          |
| `--text-label`       | 12px / 1.3 / 700 (body)           | 13px / 1.4 / 500         | Eyebrows and section labels (with --label-case).           |
| `--text-code`        | 13px / 1.65 / 400 (mono)          | 13px / 1.6 / 400         | Endpoints, JSON, ids, keys.                                |
| `--text-kbd`         | 12px / 1.2 / 600 (mono)           | 11px / 1.2 / 500         | Keyboard hints.                                            |
| `--text-celebrate`   | 40px / 1 / 400 (celebrate)        | 28px / 1.2 / 600         | Celebrations only; at most once per session.               |
| `--text-empty`       | 38px / 1 / 400 (empty)            | 16px / 1.4 / 600         | Empty states: one line.                                    |

`--ui-size` (16px Discothèque, 14px Folio, 15px Devis and Relais) and the `--label-*` set below
remain, and Folio still sets its `--fs-*` sizes, which let CSS written with Discothèque's sizes
come out one notch denser. The tables below are each look's full scale, as designed, with
styles that have no role of their own (Discothèque's `memo`, Folio's `entry-title` and
`overline`).

**Discothèque**

| Style         | Family     | Size | Line height | Weight      | Use                                                |
| ------------- | ---------- | ---- | ----------- | ----------- | -------------------------------------------------- |
| `display-xl`  | display    | 96px | 0.9         | 900         | greetings and poster numbers; one per screen       |
| `display-l`   | display    | 56px | 0.95        | 800         | page and entry titles                              |
| `title`       | display    | 34px | 1.05        | 800         | panel and dialog titles                            |
| `section`     | display    | 24px | 1.15        | 700         | card and tile headings                             |
| `item`        | display    | 20px | 1.2         | 700         | entry names on cards, agenda rows                  |
| `voice`       | display    | 20px | 1.3         | 400 italic  | the app speaking: gentle notes, empty translations |
| `body-l`      | body       | 18px | 1.7         | 400         | rich-text editing and previews                     |
| `body`        | body       | 16px | 1.55        | 400         | default UI text, inputs                            |
| `body-strong` | body       | 16px | 1.55        | 700         | names, button labels                               |
| `small`       | body       | 14px | 1.5         | 400         | metadata, help text, table cells                   |
| `label`       | body       | 12px | 1.3         | 700, 0.12em | field labels and eyebrows, uppercase               |
| `code`        | mono       | 13px | 1.65        | 400         | endpoints, JSON, ids, keys                         |
| `kbd`         | mono       | 12px | 1.2         | 600         | keyboard hints, in a 2px ink box                   |
| `celebrate`   | celebrate  | 40px | 1           | 400         | celebrations only; at most once per session        |
| `empty`       | empty      | 38px | 1           | 400         | empty states: one line, a sentence, one action     |
| `memo`        | typewriter | 16px | 1.75        | 400         | memo-style cards                                   |

`display-xl` and `display-l` set Fraunces' optical size to 144. Letter spacing tightens as the
size grows: -0.03em, -0.02em, -0.01em.

**Folio**

| Style           | Size | Line height | Weight      | Use                                             |
| --------------- | ---- | ----------- | ----------- | ----------------------------------------------- |
| `display`       | 28px | 1.2         | 600         | the greeting and a dashboard's big numbers      |
| `entry-title`   | 26px | 1.25        | 600         | the entry's title field, larger than the chrome |
| `page-title`    | 22px | 1.3         | 600         | list and settings page titles                   |
| `section-title` | 16px | 1.4         | 600         | card, panel, dialog and form-section headings   |
| `item`          | 14px | 1.4         | 600         | entry names in rows and cards, column heads     |
| `body-l`        | 16px | 1.65        | 400         | rich text, at most 72 characters per line       |
| `body`          | 14px | 1.5         | 400         | default UI text, inputs, table cells            |
| `body-strong`   | 14px | 1.5         | 500         | names, button labels                            |
| `small`         | 13px | 1.45        | 400         | metadata, help text, badges                     |
| `label`         | 13px | 1.4         | 500         | field labels, sentence case                     |
| `overline`      | 11px | 1.4         | 600, 0.06em | sidebar group headings only, uppercase, muted   |
| `code`          | 13px | 1.6         | 400         | endpoints, JSON, ids, slugs                     |
| `kbd`           | 11px | 1.2         | 500         | keyboard hints, in a 1px box                    |

Folio has no weight above 600 and no celebration or empty-state face: those variables point at
IBM Plex Sans.

### Labels

Labels and eyebrows read four variables, so one rule works in every look:

| Variable           | Discothèque   | Folio   | Devis         | Relais        |
| ------------------ | ------------- | ------- | ------------- | ------------- |
| `--label-size`     | 12px          | 13px    | 13px          | 11px          |
| `--label-weight`   | 700           | 500     | 600           | 500           |
| `--label-tracking` | 0.12em        | 0       | 0.08em        | 0.08em        |
| `--label-case`     | uppercase     | none    | uppercase     | uppercase     |
| `--label-color`    | `--ink-muted` | `--ink` | `--ink-muted` | `--ink-muted` |

Field labels have their own set, the same in every look: `--field-label-size` 13px,
`--field-label-tracking` 0, `--field-label-case` none.

## Spacing

A 4px base. The names are steps, not pixels.

| Variable     | Value | Discothèque use                     | Folio use                            |
| ------------ | ----- | ----------------------------------- | ------------------------------------ |
| `--space-1`  | 4px   | icon to label, avatar overlap step  | icon to label, badge padding         |
| `--space-2`  | 8px   | chip gaps, button groups            | button groups, label to input        |
| `--space-3`  | 12px  | row padding, field label to input   | row padding, gaps inside cards       |
| `--space-4`  | 16px  | card padding, phone gutter          | card padding, phone gutter           |
| `--space-5`  | 20px  | tile padding, list gaps             | panel padding                        |
| `--space-6`  | 24px  | desktop gutter, sections in a panel | desktop gutter, form sections        |
| `--space-8`  | 32px  | main content padding                | main content padding on wide screens |
| `--space-10` | 40px  | between major page regions          | between major page regions           |
| `--space-14` | 56px  | above page titles on wide screens   | (Discothèque's value)                |

Folio's JSON also defines `space-12` (48px, empty-state padding), but it is not in the CSS yet;
use `calc(var(--space-6) * 2)` or write 48px.

## Radius

| Variable          | Discothèque | Folio | Devis | Relais | Use                                                                                                       |
| ----------------- | ----------- | ----- | ----- | ------ | --------------------------------------------------------------------------------------------------------- |
| `--radius-s`      | 8px         | 4px   | 2px   | 4px    | kbd boxes, chips, badges (Folio), thumbnails in rows                                                      |
| `--radius-m`      | 14px        | 6px   | 4px   | 10px   | inputs, list containers; buttons and menus (Folio)                                                        |
| `--radius-l`      | 22px        | 8px   | 6px   | 12px   | cards, tiles, panels, tables                                                                              |
| `--radius-xl`     | 26px        | 12px  | 8px   | 16px   | dialogs and the command palette                                                                           |
| `--radius-pill`   | 999px       | 999px | 999px | 999px  | Discothèque: buttons, pills, segmented controls, avatars. Folio: avatars, switches, the presence dot only |
| `--radius-button` | pill        | 6px   | 4px   | pill   | buttons                                                                                                   |
| `--radius-badge`  | pill        | 4px   | 2px   | pill   | badges and pills                                                                                          |

Use `--radius-button` and `--radius-badge` on buttons and badges rather than picking a radius: a
button is a pill in Discothèque and Relais, a rounded rectangle in Folio, and nearly square in
Devis.

## Borders

| Variable          | Discothèque | Folio | Devis | Relais | Use                                                                                             |
| ----------------- | ----------- | ----- | ----- | ------ | ----------------------------------------------------------------------------------------------- |
| `--border-object` | 2px         | 1px   | 2px   | 1px    | the outline of every card, button and pill                                                      |
| `--border-strong` | 3px         | 1px   | 2px   | 2px    | dialogs, the palette, a selected presence ring                                                  |
| `--border-field`  | 1.5px       | 1px   | 2px   | 1px    | the edge of text inputs (with `--outline-field`)                                                |
| `--stripe-band`   | 6px         | 0px   | 6px   | 6px    | each stripe band (Discothèque's rainbow, Devis's hazard tape, Relais's airmail); Folio has none |

Folio's JSON also names `border-selected` (2px: a selected media card, the active tab's
underline) and `focus-width` (2px); in CSS the focus width is `--focus-ring`.

In Discothèque every object has a 2px ink outline and rows are split by dotted rules. In Folio,
objects have a 1px hairline (`--rule`) and controls a 1px stronger edge (`--outline-control`),
because a hairline is too faint to be the only edge of something you can press.

## Elevation and shadows

Discothèque and Folio lift things differently. Discothèque has no soft shadows: an object that lifts gets
a hard offset in ink, like card stock on a desk. Folio separates objects with borders first, and
keeps soft, low shadows for things that float.

| Variable                   | Discothèque light                 | Discothèque dark              | Folio (light)                     | Use                                    |
| -------------------------- | --------------------------------- | ----------------------------- | --------------------------------- | -------------------------------------- |
| `--shadow-press`           | `3px 3px 0 #3B2416`               | `3px 3px 0 #000000`           | `shadow-xs`                       | primary buttons at rest                |
| `--shadow-lift`            | `4px 4px 0 #3B2416`               | `4px 4px 0 #000000`           | `shadow-s`                        | hovered cards, the selected nav item   |
| `--shadow-dialog`          | `8px 8px 0 #3B2416`               | `8px 8px 0 #000000`           | `shadow-l`                        | dialogs, the palette, popovers, panels |
| `--shadow-drag`            | `10px 14px 0 rgba(59,36,22,0.35)` | `10px 14px 0 rgba(0,0,0,0.6)` | `0 12px 24px rgba(16,24,40,0.18)` | anything being dragged                 |
| `--shadow-highlight`       | `4px 4px 0 #E1A730`               | `4px 4px 0 #E1A730`           | `0 0 0 3px` accent-soft           | a field or preview that just changed   |
| `--shadow-panel-highlight` | `none`                            | `4px 4px 0 #E1A730`           | `none`                            | a `--panel-highlight` panel            |

Folio's shadows, light theme (dark uses black at higher opacity):

| Folio token | Value                                                                  | Use                                        |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| `shadow-xs` | `0 1px 2px rgba(16, 24, 40, 0.05)`                                     | buttons and inputs at rest                 |
| `shadow-s`  | `0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)`   | dashboard cards; lists and tables use none |
| `shadow-m`  | `0 4px 12px rgba(16, 24, 40, 0.10), 0 1px 3px rgba(16, 24, 40, 0.06)`  | menus, popovers, toasts                    |
| `shadow-l`  | `0 16px 40px rgba(16, 24, 40, 0.18), 0 2px 6px rgba(16, 24, 40, 0.08)` | dialogs, the palette, drawers              |

Devis and Relais lift like Folio, with borders first, but keep only what floats: nothing at rest
casts a shadow (`--press` and `--lift` are 0).

| Variable                   | Devis (Day)                       | Relais (light)                    | Use                                    |
| -------------------------- | --------------------------------- | --------------------------------- | -------------------------------------- |
| `--shadow-press`           | `none`                            | `none`                            | primary buttons at rest                |
| `--shadow-lift`            | `none`                            | `0 1px 3px rgba(20,33,61,0.1)`    | hovered cards, the selected nav item   |
| `--shadow-dialog`          | `0 16px 40px rgba(19,36,29,0.22)` | `0 16px 40px rgba(20,33,61,0.22)` | dialogs, the palette, popovers, panels |
| `--shadow-drag`            | `0 12px 28px rgba(19,36,29,0.25)` | `0 12px 28px rgba(20,33,61,0.25)` | anything being dragged                 |
| `--shadow-highlight`       | `0 0 0 3px #FFD23F` (hi-vis)      | `0 0 0 3px #1D3A8A`               | a field or preview that just changed   |
| `--shadow-panel-highlight` | `none`                            | `none`                            | a `--panel-highlight` panel            |

In the dark themes the floating shadows are black at 0.6, Relais's lift black at 0.5, and Relais's
highlight `#8FB0FF`.

`shadow-m` has no shared name; use `--folio-shadow-m` under Folio. Two more variables carry the
press: `--press` (3px in Discothèque, the distance a primary button travels into its shadow; 0 in
Folio) and `--lift` (-1px in Discothèque, how far a hovered object rises; 0 in Folio).

Levels, from the page up: the page (`--paper`), objects on it (`--paper-raised` with an outline),
things that float above it (menus, popovers, toasts), then dialogs over a backdrop. Use the next
shadow up only when the object really sits above the one below.

## Focus

Every interactive element shows a focus ring when reached by keyboard:

```css
:focus-visible {
  outline: var(--focus-ring) solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--focus-edge);
}
```

| Variable       | Discothèque              | Folio                        | Devis                    | Relais                |
| -------------- | ------------------------ | ---------------------------- | ------------------------ | --------------------- |
| `--focus`      | mustard `#E1A730`        | accent `#1F5FC4` / `#6EA0F2` | hi-vis `#FFD23F`         | `#2F5BD3` / `#8FB0FF` |
| `--focus-edge` | on-mustard ink `#3B2416` | transparent                  | on-mustard ink `#13241D` | `--paper-raised`      |
| `--focus-ring` | 3px                      | 2px                          | 3px                      | 3px                   |

Discothèque's ring is two bands: the mustard ring, and an ink edge filling the 2px gap between it
and the element. Mustard alone is too light on Lights-on paper (1.8:1), and no single colour reads
on both the cream paper and the chocolate sidebar, so whichever band the ground hides, the other
one shows: the ink edge on paper (12.2:1), the mustard on chocolate (4.8:1 or more) and in Lights
off (8.6:1 on paper). The edge is the ink that reads on mustard in both themes, so the two bands
stay apart too (6.7:1). Folio's ring is one colour, at least 5:1 wherever it sits, and its edge is
transparent. Devis's is built like Discothèque's (hi-vis with an ink edge); Relais's blue ring is
set off the element by an edge of the raised paper. Every ring is a checked contrast pair.

The edge is a `box-shadow`, so an element with a shadow of its own lists both, edge first:
`box-shadow: 0 0 0 2px var(--focus-edge), var(--shadow-press);`.

- Never remove the outline without drawing another one.
- Show focus on the element that has it, or on its visible box when the real element is hidden
  (a checkbox's square, a switch's track).
- Don't show the ring on mouse click: use `:focus-visible`.

## Icons

The package ships no icons. Apps built on it use [Lucide](https://lucide.dev) (`lucide-react` in
React), at its default 2px stroke, in `currentColor` so icons take the text colour.

| Size    | Where                                      |
| ------- | ------------------------------------------ |
| 14px    | inside small buttons and dense rows        |
| 16px    | the default: inside buttons, menus, inputs |
| 18px    | standalone icon buttons, banners, toolbars |
| 22–24px | the top bar's menu button, larger chrome   |
| 32–40px | empty states and drop zones                |

When an icon needs a label:

- **Next to text**, the icon is decoration: `aria-hidden="true"`, no label.
- **Alone in a button**, the button needs a name: `aria-label="Remove"`, plus a tooltip with the
  same words for sighted users.
- **Carrying meaning on its own** (a status, a warning), give it a text alternative or put the
  words beside it. Colour and shape are never the only signal.
- Use the same icon for the same action everywhere, and never an icon that only makes sense once
  you know the app.

## Layout and breakpoints

| Variable          | Value                                             | Use                              |
| ----------------- | ------------------------------------------------- | -------------------------------- |
| `--gutter`        | `--space-4` (16px), `--space-6` (24px) from 900px | the page's side margin           |
| `--reading-width` | 72ch                                              | the longest line of running text |
| `--region-gap`    | `--space-10` (40px)                               | between a page's major regions   |

Breakpoints can't be CSS variables (a media query can't read one), so they are numbers: in
`packages/core/tokens.json` (`layout.breakpoints`), and for scripts
`import { breakpoints } from '@trentesix/core'`.

| Breakpoint | Width  | Where                                     |
| ---------- | ------ | ----------------------------------------- |
| `small`    | 600px  | phones end here: one column below it      |
| `medium`   | 900px  | a side column can sit beside the main one |
| `large`    | 1200px | room for three columns                    |
| `wide`     | 1600px | content stops growing around here         |

```css
@media (width >= 900px) {
  .page {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
```

Prefer container queries for components that appear in more than one width (a card in a sidebar
and in a page), and media queries for the page shell. Check every layout at 320px wide: no
horizontal page scroll, and targets of at least 24px.
