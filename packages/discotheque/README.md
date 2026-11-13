# @trentesix/discotheque

Discothèque, the default look: print you can touch. Warm paper, thick ink outlines, hard offset shadows, a serif for display.

| Light                                                                                                         | Dark                                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ![Discothèque, light](https://raw.githubusercontent.com/trentesix/trentesix/main/media/discotheque-light.png) | ![Discothèque, dark](https://raw.githubusercontent.com/trentesix/trentesix/main/media/discotheque-dark.png) |

Every moment, playing in Discothèque: [the moments page](https://trentesix.github.io/trentesix/?look=discotheque).

```sh
pnpm add @trentesix/core @trentesix/discotheque
```

```css
@import '@trentesix/discotheque/all.css';
```

Through a bundler (Vite, webpack, Parcel, esbuild, PostCSS with `postcss-import`): the
stylesheets import core and the fonts by package name.

No attribute needed: it is the default look, set on `:root`. Its temper is lively.

| File          | What it is                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `all.css`     | Everything, in order: core's base, this look, its fonts, core's moments, its moments                                             |
| `look.css`    | Its colours and what differs from the base, light and dark                                                                       |
| `fonts.css`   | Its fonts, self-hosted                                                                                                           |
| `moments.css` | Its moments, after `@trentesix/core/moments.css`                                                                                 |
| `tokens.json` | Its tokens; `import { look, motion } from '@trentesix/discotheque'` for scripts                                                  |
| `dtcg/`       | Its tokens for design tools (Figma, Tokens Studio): `light.tokens.json`, `dark.tokens.json`, in the W3C community group's format |

The guides ship with `@trentesix/core` ([foundations](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/foundations.md), [motion](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/motion.md), [writing](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/writing.md)); the whole system is described in the [Trentesix repository](https://github.com/trentesix/trentesix#readme).
