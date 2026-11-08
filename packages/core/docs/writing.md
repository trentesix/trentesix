# Writing

How an app using `@trentesix/core` talks to people, in English and in French. The looks change
how words are set; they never change the voice. These rules come from the interface text of the
apps built on the package, and the examples are taken from it.

## Voice

Plain, warm and brief. The interface talks like a colleague who knows the work: it says what
happened, what it means and what to do next, then gets out of the way.

- **Plain words.** "Take it out" rather than "Restore item". "Delete for good" rather than
  "Permanently delete". No jargon unless the reader is a developer and the word is the right one
  (an API key, a webhook, a slug).
- **Short sentences.** One idea each. Two short sentences beat one long one with a semicolon.
- **Say what it means for them.** "Someone who learns your password still can't sign in." is
  better than "Adds a second authentication factor."
- **Calm about problems.** No blame, no alarm, no exclamation marks in errors. Say that work is
  safe when it is: "Something went wrong on our side. Nothing you saved is lost."
- **A little character, rarely.** A light line is fine where nothing is at stake, such as an empty
  list or a page that failed to load ("Fell behind the filing cabinet."). Never in a
  confirmation, an error about the reader's data, or anything about money or security.

## Tone by moment

| Moment               | Tone                                   | Example                                                                |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Everyday action      | Neutral, a few words                   | "Saved", "1 moved to the bin"                                          |
| Something to fix     | Direct and specific, what to do next   | "Fill in Author and Body before publishing. Drafts can wait."          |
| Something went wrong | Calm, what happened and the next step  | "That code isn't right. Try the one the app shows now."                |
| Can't be undone      | Plain about the consequence, no drama  | "It leaves the bin and can't be taken out again."                      |
| Empty                | Light headline, then a useful sentence | "No projects yet!" then "Start one for your site, or ask to be added." |
| A milestone          | Glad, once, then back to work          | "Published. The live version is up to date."                           |

## Capitals and punctuation

- **Sentence case everywhere**: titles, buttons, labels, menu items, tabs. "Account security",
  "Ask for review", "Clear filters". Only proper names keep their capitals (a product's or a
  provider's name, a person's).
- **Full stops** end sentences in body text, hints, toasts and errors. Buttons, labels, tabs,
  menu items, column heads and titles have none. A title that is a question ends with a question
  mark: "Empty the bin?".
- **Curly quotes and apostrophes**: ’ “ ” in English, never straight ones. French uses « » (see
  below).
- **Ellipsis** (the single character …) only for something in progress: "Saving…",
  "Reconnecting…". Never to trail off.
- **The middle dot** · joins short facts on one line: "Deleted by Louise · yesterday",
  "Publishing · 3 of 12". Use it instead of dashes or pipes.
- **Colons** introduce what follows, including a reason: "It didn't happen: the server was
  busy."
- Avoid dashes as punctuation. Two sentences or a colon read better.

## Buttons and links

- **Start with a verb** that names the result: "Publish", "Ask for review", "Copy them", "Send
  another code", "Move to the bin". Not "OK", "Submit", "Yes" or "Confirm".
- **Name the object when it helps**: "New project", "Upload files", "Delete the channel". The
  button should still make sense read on its own, as a screen reader may read it.
- **The confirm button repeats the question's verb.** "Empty the bin?" is answered by "Empty the
  bin", not "OK".
- **Cancel is "Cancel"**, and closing is "Close". "Back" is for going back a step.
- **While busy, say what is happening**, with the same verb: "Save" becomes "Saving…", "Create
  and open" becomes "Creating…". When done, use the past tense, briefly: "Saved", "Copied".
- **Links read as a destination or an action**: "See the bin", "Open in the editor", "Read the
  docs". Never "Click here".

## Labels, hints and placeholders

- A label names the thing, in a few words: "Title", "Reading time", "Verification code".
- A hint under a field says what it is for or what happens, in one sentence: "Each one signs you
  in once without your phone."
- Placeholders are examples, never the only instructions; they disappear while typing and are
  hard to read.
- Mark what is required, not what is optional, and say when it matters: required fields "only
  matter when you ask for review or publish."

## Errors

Every error says **what happened** and **what to do now**, in that order. If there is nothing to
do, say what the app is doing about it.

- "That email and password don't match an account."
- "That took too long. Sign in again."
- "Every id made from this title is taken. Try a longer title."
- "Only reviewers and admins can decide. You can still leave a note."

Rules:

- Speak about the thing, not the person: "That code isn't right", not "You entered a wrong code".
- Don't apologise in every message, and never write "Oops" or "Error:".
- Put the error where the problem is: next to the field, or as a notice over the part of the page
  it stops. A passing message (a toast) is only for things that happened elsewhere or after the
  fact.
- Count blocking problems and point to them: "Not saved: 2 things to fix first.", then each
  problem beside its field with a way to get there.
- Separate problems from suggestions. Suggestions say so: "Suggestions · won't block".
- When a server reason is shown as is, put it after a colon in the app's own sentence: "Email not
  sent: {reason}".

## Confirmations

Ask only when something can't be taken back or reaches other people.

- The title is the question, with the object named: "Delete Newsletter for good?"
- The body says the consequence in one or two sentences, ending with "This can't be undone." when
  that's true.
- The confirm button is the verb from the title. The other is "Cancel".
- When an action can be undone, don't ask: do it, and offer "Undo" in the message that follows.

## Empty states

- A short headline that says what is missing: "No channels yet", "The bin is empty.",
  "Nothing matches these filters."
- One sentence that says what this place is for, or how things get here: "A channel decides
  what an app or site may read from the public API. Make one for each."
- One action, named with a verb: "New project". Leave it out when the reader can't act.
- When filters cause the emptiness, offer the way out: "Clear filters".
- A quiet good-news state is allowed to be warm: "Nothing waits for a review. Enjoy it."

## Numbers, dates and counts

- Numbers and dates follow the interface language, not the content's. Format them with the
  platform (`Intl`), using Canadian English (`en-CA`) and Canadian French (`fr-CA`).
- Write counts as digits, with real plurals: "1 file", "12 files", "1 recovery code left".
  Never "file(s)".
- Small counts and years have no thousands separator: 1979, 412. Large numbers do: 12,480 in
  English, 12 480 in French.
- Recent times are relative: "yesterday", "3 hours ago", "in 2 days". Older dates are short: "Oct
  8" this year, "Oct 8, 2025" before. Times something is scheduled for are exact, with the day:
  "Tue, Nov 3, 9:00 a.m."
- Sizes count 1 MB as 1024 × 1024 bytes and keep the number and unit together with a no-break
  space: "100 MB", "1.5 GB"; in French "1,5 Go", "100 Mo".
- Progress names both ends: "3 of 12".

## French

French is a full interface language, written for it, not translated word for word.

- **Vouvoiement.** The interface says _vous_ everywhere: "Réessayez.", "Connectez-vous",
  "Vous débutez ?". Never _tu_.
- **Buttons use the infinitive**: "Enregistrer", "Publier", "Mettre à la corbeille", "Créer et
  ouvrir", "Supprimer définitivement". Messages and hints use the imperative with _vous_:
  "Réessayez.", "Tapez un code de langue…".
- **Sentence case**, as in English: "Demander des changements", not "Demander Des Changements".
- **Espaces fines insécables** (U+202F) before `?`, `!`, `:` and `;`, and inside « »:
  "Restaurer cette version ?", "Aucun projet pour l’instant !", « {query} ». They keep the
  punctuation from wrapping onto its own line. In source files, write the character itself or the
  escape `\u202f`, never a plain space.
- **Guillemets** « » for quoted words and names: "Rien ne correspond à « {query} »." Inner
  quotes, if ever needed, are “ ”.
- **Apostrophes** are curly: l’instant, n’a pas.
- **Ellipsis** is the single character: "Enregistrement…", "Création…".
- **Canadian French**: the interface follows `fr-CA`. Say _courriel_, not _e-mail_. Units are
  Ko, Mo, Go.
- **Numbers**: decimal comma (1,5) and a no-break space as the thousands separator and before
  units (12 480, 100 Mo). Let `Intl` with `fr-CA` do this.
- **Status words are short adjectives or nouns**: "Brouillon", "En révision", "En ligne",
  "Retiré".
- French runs about a third longer than English. Leave room in buttons and tabs, and never set a
  width that fits only the English.

## Accessibility in words

- Every icon-only button has a name that says what it does: "Close", "Previous page",
  "Show the choices".
- A label that appears only as an icon or colour has the same words for screen readers.
- Messages that appear on their own (a toast, a saved state, a count that changes) are announced
  politely; errors that block are announced at once.
- Motion is never the only signal. Every moment also says something in words: a label, a message
  or a live announcement.
