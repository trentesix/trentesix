# @trentesix/folio

Folio, the calm look: cool greys, 1px borders, soft shadows, one sans-serif.

| Light                                                                                             | Dark                                                                                            |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ![Folio, light](https://raw.githubusercontent.com/trentesix/trentesix/main/media/folio-light.png) | ![Folio, dark](https://raw.githubusercontent.com/trentesix/trentesix/main/media/folio-dark.png) |

Every moment, playing in Folio: [the moments page](https://trentesix.github.io/trentesix/?look=folio).

```sh
pnpm add @trentesix/core @trentesix/folio
```

```css
@import '@trentesix/folio/all.css';
```

Through a bundler (Vite, webpack, Parcel, esbuild, PostCSS with `postcss-import`): the
stylesheets import core and the fonts by package name.

On `<html>`: `data-look="folio"`. Its temper is calm.

| File          | What it is                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `all.css`     | Everything, in order: core's base, this look, its fonts, core's moments, its moments, core's rich text                           |
| `look.css`    | Its colours and what differs from the base, light and dark                                                                       |
| `fonts.css`   | Its fonts, self-hosted                                                                                                           |
| `moments.css` | Its moments, after `@trentesix/core/moments.css`                                                                                 |
| `tokens.json` | Its tokens; `import { look, motion } from '@trentesix/folio'` for scripts                                                        |
| `dtcg/`       | Its tokens for design tools (Figma, Tokens Studio): `light.tokens.json`, `dark.tokens.json`, in the W3C community group's format |

The guides ship with `@trentesix/core` ([foundations](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/foundations.md), [motion](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/motion.md), [writing](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/writing.md)); the whole system is described in the [Trentesix repository](https://github.com/trentesix/trentesix#readme).
