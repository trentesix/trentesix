# @trentesix/devis

Devis, the quote tool's look: a worksite's structure with bank-note green and serif money; calm, with a notary's seal.

| Light                                                                                             | Dark                                                                                            |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ![Devis, light](https://raw.githubusercontent.com/trentesix/trentesix/main/media/devis-light.png) | ![Devis, dark](https://raw.githubusercontent.com/trentesix/trentesix/main/media/devis-dark.png) |

Every moment, playing in Devis: [the moments page](https://trentesix.github.io/trentesix/?look=devis).

```sh
pnpm add @trentesix/core @trentesix/devis
```

```css
@import '@trentesix/devis/all.css';
```

Through a bundler (Vite, webpack, Parcel, esbuild, PostCSS with `postcss-import`): the
stylesheets import core and the fonts by package name.

On `<html>`: `data-look="devis"`. Its temper is calm.

| File          | What it is                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| `all.css`     | Everything, in order: core's base, this look, its fonts, core's moments, its moments |
| `look.css`    | Its colours and what differs from the base, light and dark                           |
| `fonts.css`   | Its fonts, self-hosted                                                               |
| `moments.css` | Its moments, after `@trentesix/core/moments.css`                                     |
| `tokens.json` | Its tokens; `import { look, motion } from '@trentesix/devis'` for scripts            |

The guides ship with `@trentesix/core` ([foundations](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/foundations.md), [motion](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/motion.md), [writing](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/writing.md)); the whole system is described in the [Trentesix repository](https://github.com/trentesix/trentesix#readme).
