// Trentesix lints its own hand-written CSS with the config core ships. The generated files (each
// look's look.css and moments.css) come from tokens and sources, so the sources are linted.
export default { extends: ['./packages/core/stylelint/index.js'] };
