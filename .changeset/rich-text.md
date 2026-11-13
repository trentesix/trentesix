---
'@trentesix/core': minor
'@trentesix/discotheque': minor
'@trentesix/folio': minor
'@trentesix/devis': minor
'@trentesix/relais': minor
---

Rich text: `@trentesix/core/prose.css` styles what people write (headings, paragraphs, lists,
quotes, links, emphasis, inline code, code wells, tables, figures, details and Markdown task
lists) inside an element with `data-prose`, in every look and theme. `data-prose="compact"` sets
it at UI size for editors in fields and comments. Each look's `all.css` now includes it.

New look variables: `--strong-weight` (bold in running text, 700 in Discothèque and 600 in the
others, the weight each body face has), `--prose-h1` to `--prose-h3` with their `-tracking`
(the heading steps of rich text: Folio steps up from its page title, Relais swaps item and
section), and `--mark` / `--on-mark` (highlighted text and search hits; Relais uses its soft
blue rather than airmail red). Three new contrast pairs: `--on-mark` on `--mark`, and ink on the
inserted and deleted grounds.
