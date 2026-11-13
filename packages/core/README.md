# @trentesix/core

The base every Trentesix look starts from: spacing, radii, borders, motion, families and the look
variables (`base.css`), the moments (`moments.css`), rich text (`prose.css`), the motion helper (`motion`), the contrast
checker (`contrast`), the stylelint config (`stylelint`) and the editor help (`vscode/`).

An app installs core and a look, and loads the look's `all.css`:

```sh
pnpm add @trentesix/core @trentesix/devis
```

```css
@import '@trentesix/devis/all.css';
```

Through a bundler (Vite, webpack, Parcel, esbuild, PostCSS with `postcss-import`): the
stylesheets import core and the fonts by package name.

Core names no look: a look says how it moves with `--temper` (`lively` or `calm`), and the helper
and the calm moments follow it. The guides ship with it, in `docs/`:
[foundations](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/foundations.md), [motion](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/motion.md) and [writing](https://github.com/trentesix/trentesix/blob/main/packages/core/docs/writing.md); the whole
system is described in the [Trentesix repository](https://github.com/trentesix/trentesix#readme).
