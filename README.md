# Italiano — Italian learning app

A single web app (React + Vite) that works in any browser on desktop or
mobile, and installs as a home-screen / desktop app (PWA) via
`vite-plugin-pwa`.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. On your phone, connect to the same wifi and
visit your computer's local IP at the same port to test the mobile layout.

## Build for production / install as an app

```bash
npm run build
npm run preview
```

`npm run build` produces a `dist/` folder with the service worker and
manifest baked in. Deploy `dist/` to any static host (Vercel, Netlify,
Cloudflare Pages, GitHub Pages) over HTTPS — PWAs require HTTPS (localhost
is exempt for testing). Once deployed, visiting the URL on a phone shows
an "Add to Home Screen" / install prompt; on desktop Chrome/Edge, an
install icon appears in the address bar.

## Project structure

```
src/
  App.jsx                        App shell + the MODULES registry
  Dashboard.jsx                  Home screen: coverage + solid words, level ladder, module cards, review band
  shared/
    theme.js                     Colors, fonts, level accent colors — shared by all modules
    storage.js                   localStorage progress persistence (versioned + migrated), shared by all modules
    stats.js                     Reads that progress back across all four modules (dashboard counts)
    srs.js                       Leitner scheduler: boxes, due dates, the review queue
    wordState.js                 The four word states (unseen/learning/known/solid), derived from the boxes
    coverage.js                  Frequency-weighted share of running Italian the learner would know
    speech.js, SpeakButton.jsx   Pronunciation playback (browser SpeechSynthesis API)
    typedAnswer.js               Accent-tolerant matching for typed answers, and the shared-prefix arithmetic behind "where it went wrong"
    shuffle.js, Postmark.jsx, PerforatedDivider.jsx, TopBar.jsx, SessionSummary.jsx
                                  Small presentational/utility pieces shared across modules
  data/
    vocab.js                     Vocabulary word lists (levels > categories > words)
    fondamentale.js              De Mauro's base vocabulary in rank order, with English + Polish glosses
    grammar.js                   Grammar topics (levels > topics > explanation + drills)
    conversations.js             Guided dialogues (levels > dialogues > steps > options)
    stories.js                   Graded readers (levels > stories > paragraphs + questions)
    mappe.js                     Le Mappe: suffix correspondences, their two roads, their notes, their false friends and their drills
    articoli.js                  Gli Articoli: the three strands, the rules behind them, and every item's Polish anchor
  modules/
    vocab/VocabModule.jsx              Flashcards + quiz UI (done)
    grammar/GrammarModule.jsx          Lesson (explanation) + drill UI (done)
    conversations/ConversationsModule.jsx  Chat-style guided dialogues (done)
    stories/StoriesModule.jsx          Reader + word glosses + comprehension quiz (done)
    stories/gloss.js                   Splits a paragraph into tappable glossed words
    mappe/MappeModule.jsx              Suffix maps: the card that teaches one, and the typed drill (done)
    mappe/feedback.js                  Judges a typed answer and says *where* it went wrong
    articoli/ArticoliModule.jsx        The article strands: the card that teaches one, and the three-way gap drill (done)
    articoli/feedback.js               Judges an article choice and names the dimension it went wrong on
    review/ReviewModule.jsx            Mixed spaced-repetition session (a route, not a MODULES entry)
public/
  manifest icons, favicon
vite.config.js              PWA config (manifest, service worker) + Vitest config
```

## Tests

```bash
npm test          # run once
npm run test:watch
npm run test:coverage
```

Vitest + React Testing Library. Covers persistence and migration, the Leitner
scheduler, speech support detection, the module UI flows, and the data itself
— every gloss key has to occur in its own paragraph, every comprehension
answer has to be one of its options, and the four data files have to agree on
the level ladder (see `*.test.js(x)` files next to the code they test).

`npm run test:coverage` is gated at 100% statements/branches/functions/lines,
so uncovered code fails the run rather than sliding by. If a branch genuinely
isn't worth reaching, lower the threshold in `vite.config.js` deliberately
rather than deleting the block.

A test that can't fail is worth nothing, so anything load-bearing gets checked
against a deliberately broken build before it's trusted — break the rule, watch
the test go red, put it back.

To add a module: create `src/modules/<name>/<Name>Module.jsx` exporting a
component that accepts an `onExit` prop (call it to return to the home
screen), add its data file under `src/data/` if needed, then register it in
the `MODULES` array in `src/App.jsx` with `ready: true`. Give it a matching
entry in `MODULE_STATS` (`src/shared/stats.js`) too, or its dashboard card
will have no progress to show — `stats.test.js` fails if the two lists
disagree.

## What's built

Every module runs across five levels — A1, A2, B1, B2, C1 — with two
categories/dialogues/stories each, and four grammar topics.

- **Vocabulary** — 120 words with example sentences (greetings, family,
  travel, food, work, opinions, news & media, city & environment, idioms,
  bureaucracy), flashcard mode (flip, mark known/still learning),
  multiple-choice quiz mode with a missed-words review list, and a listening
  mode (hear the word via `SpeechSynthesis`, pick its meaning — no Italian
  text shown until you answer).
- **Grammar** — 20 topics, four per level, following the order a textbook
  would take them in. Verb forms carry the ladder: present tense of
  -are/-ere/-ire verbs, the irregulars (andare, fare, stare, venire), essere
  vs avere, modals, reflexives, passato prossimo, imperfetto against it,
  futuro, congiuntivo presente, condizionale, imperativo, periodo ipotetico,
  passato remoto and the pronominal verbs (farcela, andarsene, cavarsela).
  Around them the structural topics: noun/adjective agreement, articles,
  comparatives, direct/indirect/combined pronouns, and the passive with
  impersonal si. Each topic has a short explanation (conjugation table +
  bullet points + example sentences) and an 8-question fill-in-the-blank
  drill with a missed-items review list — 160 drills in all.
- **Conversations** — 10 guided dialogues (café, introductions, directions,
  restaurant, making plans, job interview, a broken boiler, disagreeing in a
  meeting, negotiating a contract, a debate over dinner). Each turn offers a
  more formal and a more casual way to say the same thing, with light
  feedback on the register — no wrong answers, just style. Chat transcript
  builds up turn by turn; a recap at the end tallies formal vs casual picks
  and re-lists your responses. A1–B1 dialogues run three turns, B2/C1 four.
- **Stories** — 10 short original stories (a tourist's day in Rome and a
  Sicilian fairy tale; a missed train in Naples and a love story by letter;
  murder mysteries in Venice and in the Piedmont vineyards; a public-sector
  exam and a house on Lake Como; a manuscript thief in Florence and a
  reportage from an emptying village). Tenses are graded to match the
  grammar module — A1 in the present, A2 in the passato prossimo, B1 mixing
  imperfetto and passato prossimo, B2 adding congiuntivo and condizionale,
  C1 bringing in the passato remoto, the passive and impersonal si (one C1
  reader is literary, the other journalistic — register is a C1 skill too).
  From B1 up the comprehension questions are themselves in Italian.
  The whole story scrolls on one page: each paragraph has
  a tap-to-reveal English translation and a pronounce button, and glossed
  words are underlined — tapping one opens a gloss bar at the bottom of the
  screen with its meaning. Three multiple-choice comprehension questions
  follow, each with an explanation, and finishing them marks the story done.
- **Le Mappe** — suffix correspondences taught as rules rather than word lists,
  and the first workbench of L'Officina. Four maps so far — `-cja/-tion →
  -zione`, `-ity/-ość → -ità`, `-yczny/-ic → -ico`, `-ysta/-ist → -ista` —
  each a card that gives the Polish road first where it is the shorter one,
  the English road second, what the ending brings with it (gender, plural,
  stress, the honest exceptions) and the false friends the rule creates:
  `colazione` is a perfectly formed `-zione` noun meaning breakfast, and the
  Polish `kolacja` it came from is supper.

  The drill is **production** — you type the Italian, the app's first typed
  exercise — with accent-tolerant matching in `src/shared/typedAnswer.js`, so
  `possibilita` is accepted and then spelled back to you as `possibilità`. A
  wrong answer is *located, not solved*: the feedback says whether the ending
  landed, how far the answer stayed on track, and — on the items where the map
  itself is what fails — that the rule was applied correctly and the rule is
  the problem. Only a spent second attempt reveals anything. A right answer
  names the sub-patterns nobody taught, like Latin's `ct → tt` in
  `aktywność → attività`.

  Le Mappe deliberately sits outside the Leitner queue; the reasoning is
  beside its `scheduled: false` flag in `src/shared/stats.js`. It is reached
  from the L'Officina hub, and from the nav menu.
- **Gli Articoli** — the permanent strand, and L'Officina's third workbench.
  The one part of Italian where *neither* of the learner's languages helps:
  Polish has no articles at all, and English has them and drops them in
  exactly the places Italian keeps them — `Bevo il caffè` is *I drink coffee*.
  Sequenced the way design screen 12's own footer states it, determinativo →
  indeterminativo → preposizioni articolate, which is a teaching order rather
  than an authoring one: a fused preposition is a definite article welded onto
  a preposition, so there is nothing to fuse until the first strand is yours.
  Sixteen sentences with a gap in them and three options each, and one of the
  three can be the zero article, because `Sono medico` and `ho fame` and
  `abito in centro` are real answers.

  Every item carries a **Polish anchor**, per PLAN's "Polish is a first-class
  layer". It is per item rather than per rule because the useful thing is
  never "Polish has no articles" in the abstract — it is that `imienia
  dziewczyny` is a genitive doing the whole job of `della`, that `klucz` is
  masculine where `la chiave` is not, and that `Jestem lekarzem` is the one
  case in the set where Polish beats English outright and the instinct to
  leave the gap empty is the right one.

  A wrong answer is **located, not solved**, the same as Le Mappe — but three
  buttons cannot be located the way an infinite answer space can, so a verdict
  names the *dimension* and never the answer: both words right and Italian
  joins them, an article where Italian wants none, an empty gap where Italian
  wants one, the right kind but the wrong shape, or the wrong kind entirely.
  The rule and the Polish card stay shut until the item does, because naming
  the rule for an item whose answer is `lo` *is* the answer. Like Le Mappe it
  sits outside the Leitner queue, and for a different reason — the queue would
  accept it, and would answer a wrong pick by revealing the right one on the
  spot, which is the weakest feedback shape available and the exact thing this
  bench replaces. The reasoning is beside its `scheduled: false` flag in
  `src/shared/stats.js`.
- **Coverage** — the headline figure, and the one number the app wants you to
  care about: what share of running Italian you could now follow.
  `src/data/fondamentale.js` holds De Mauro's base vocabulary in frequency
  order with English *and* Polish glosses (300 of a 2,000 target so far);
  `src/shared/coverage.js` weights each word by 1/rank, Zipf-style, normalised
  so the whole 2,000 comes to 86% of running text. That weighting is the whole
  point — counted flat, memorising the back half of the list would claim half
  of Italian; weighted, it claims about a tenth, which is the truth. A word
  counts once it is `known` or `solid`, meaning Leitner box 3 or above.
  `coverageBands` splits the reservoir into ten bands of 200 for the screen
  that will draw it.

  The figure is capped low by the content that ships, which is worth knowing
  before reading anything into it: coverage learns that a word is known only
  from the vocabulary module's 120 words, and just 20 of those are in the base
  2,000. Master every word, drill, dialogue and story in the app and the
  headline reads **1.6%** and **20 / 2000 solid** — that is the ceiling, and
  `coverage.test.js` pins it so it cannot drift or flatline unnoticed. Raising
  it means seeding more of the lexicon or widening what feeds the bridge.
- **Word states** — a word is `unseen`, `learning` (boxes 1–2), `known`
  (boxes 3–4) or `solid` (the top box, reached by answering right at the end of
  box 4's 7-day interval). All four are derived from the Leitner box in
  `src/shared/wordState.js`, never stored: `srs.js` writes the box and the
  status together, so a stored state would just be the first copy to go stale.
  There is no `met` state: reading a story glosses a word but writes no word
  status, so a fifth state for "seen in input, never recalled" would be one no
  code path could produce. It comes back when stories get a word-level write.
- **Dashboard** — the home screen reads that progress back: coverage and the
  solid-word count in a header band, an A1–C1 ladder of roundels
  showing how far each level is, and a progress bar with a real count on each
  module card. Read-only, and it re-reads storage every time you come back from
  a module. `src/shared/stats.js` is the only place that counts: its registry
  reuses the same key builders the modules write with, so a module card can't
  drift from what that module considers done. Note that "done" on a module
  card and "known" in the coverage band are deliberately different bars — a
  card counts the stored `known` status, which `reviewItem` writes on the
  first correct answer (box 2), while coverage waits for box 3. Answer a word
  right once and the Vocabulary card reads `1 / 120` while coverage still
  reads `0%`. The card is measuring what you have worked through; coverage is
  measuring what would survive a gap. The per-level
  percentages average the four modules rather than pooling every unit —
  otherwise vocabulary's 120 words would swamp the other three.
- **Spaced repetition** — a five-box Leitner scheduler over vocabulary and
  grammar. Getting an item right promotes it one box and pushes it further out
  (same day, 1, 3, 7, 21 days); getting it wrong drops it straight back to box
  1 whatever box it was in. Every vocab and grammar answer already goes through
  `reviewItem` in `src/shared/srs.js`, so ordinary study feeds the queue
  without any extra step. When something is due the dashboard shows a Review
  band, and starting it opens one mixed session (capped at 20 items, most
  overdue first) drawing from both modules. Conversations and stories are
  deliberately out of it: a dialogue has no wrong answer by design, and a story
  is read rather than drilled. Schedule data lives in its own `progress.schedule`
  map, so a save from before the scheduler existed loads unchanged — those
  items simply count as due the first time round.
- **Persistence** — progress (`localStorage`) survives a reload: known/
  mastered words, drill items, completed dialogues and finished stories,
  shared across modules. The blob is versioned and migrated on load, so a
  save written by an older build keeps everything it earned.

  There is deliberately no streak. Hours logged and days-in-a-row correlated
  with almost nothing in the evidence review, and a metric that rewards
  showing up rather than knowing more is a metric this app shouldn't optimise.
- **Pronunciation** — speaker icons next to Italian text play it aloud via
  the browser's `SpeechSynthesis` API.
- **Accessibility** — the app targets WCAG 2.1 AA, and the suite holds it
  there. See the section below for what that means in practice and where each
  half is checked.

## Roadmap — suggested order for Claude Code

1. **Recorded audio** — the `SpeechSynthesis` pronunciation is in place;
   a recorded-audio pack would be a quality upgrade later.
2. **More stories** — the reader takes any number per level; adding a story
   is one object in `src/data/stories.js`, no UI work.
3. **Due items first inside decks** — the scheduler is in place but the
   flashcard and drill sessions still shuffle a whole category. Ordering each
   deck by what's due would make every session, not just Review, benefit from
   it.
4. **Typed recall / production, everywhere else** — Le Mappe now types, and
   `src/shared/typedAnswer.js` is the reusable half of it. The vocabulary and
   grammar sessions are still recognition, and the review queue is still
   multiple-choice, which is the reason Le Mappe stays out of it.

## Accessibility

The target is WCAG 2.1 Level AA, checked two ways because no single tool
covers it:

- **Structure** — `src/a11y.test.jsx` runs axe-core (WCAG 2.1 A + AA rule
  set) over every screen the app can be in: the dashboard, the open nav menu,
  each module's home, lesson, drill/quiz and summary, the story reader with a
  gloss open, and a review session. `src/test/a11y.js` is the runner; a
  failure prints the rule, the offending markup and axe's own fix advice.
- **Colour** — jsdom has no paint, so axe can only ever report contrast as
  "incomplete". `src/shared/theme.test.js` closes that gap arithmetically
  instead: it parses the hex values out of `THEME_STYLE`, resolves the same
  `color-mix()` tints the components ask for, and checks every pairing the
  design system promises — text on each surface (4.5:1), white on a level
  fill, feedback text on its tinted background, and control boundaries
  (3:1, SC 1.4.11). `src/test/contrast.js` holds the maths.

What that translated into in the app:

- `TOKENS.controlLine` is a second hairline, dark enough to clear 3:1 against
  every surface, used for anything you can click — answer options, the
  flashcard, module cards, the level picker, the menu and theme buttons.
  `TOKENS.line` stays as-is for decorative rules (table borders, perforations,
  dividers). An answered option swaps its boundary for `malachiteDeep` /
  `corolloDeep` rather than the fill accents, which only manage 2.5:1 on the
  dark card.
- Answer feedback is never colour alone: `shared/AnswerMark.jsx` pairs the
  tick/cross with visually hidden text, and `shared/AnswerStatus.jsx` is a
  `role="status"` live region that speaks the result after each answer
  (SC 4.1.3), since answering repaints the options without moving focus.
  The story reader's word gloss has the same problem and the same answer:
  tapping a glossed word opens a bar at the bottom of the screen without
  moving focus, so `GlossAnnouncer` in `StoriesModule.jsx` reads the word
  and its meaning out. Both go through `shared/LiveStatus.jsx`, which is
  where the rule lives: the region stays mounted and starts empty. A region
  that appears with its text already inside has no change of contents to
  report, and whether it gets announced at all then depends on the
  AT/browser pair — some announce it, some say nothing. Mounted first and
  filled later is the only shape that works everywhere. The visible gloss
  bar is a labelled `group` and carries no live role, so the gloss is
  announced once rather than twice.

  Only the gloss headword is marked `lang="it"`. Roughly a fifth of the
  meanings in `data/stories.js` end in a parenthetical, and those mix
  Italian lemmas (`arrives (arrivare)`) with English clarifications
  (`window (of a vehicle)`), so the markup can't tell them apart — marking
  the lemma needs its own data field first.
- Italian inside an English page is marked `lang="it"` — words, examples,
  conjugation tables, drill prompts and options, dialogue lines, story
  paragraphs and glosses (SC 3.1.2). Without it a screen reader reads *gli*
  and *ciao* with English phonetics. `SessionSummary` takes a `missedLang`
  prop rather than assuming: a story's A1 comprehension answer is English.
- Every control is a real `<button>`. The grammar drill and conversation
  options used to be `div`s with `role="button"` wrapped around further
  buttons (a speaker, a translation toggle) — nested interactive controls,
  which axe flags and screen readers announce unpredictably. The flashcard's
  "tap to reveal" is a button too; before, flipping a card needed a mouse.
- `SR_ONLY` in `src/shared/theme.js` is the visually-hidden style those
  pieces share, and the app shell wraps its content in a `<main>` landmark.

## Design notes

Colors, fonts, and per-level accent colors live in `src/shared/theme.js`
— keep new modules pulling from there so the app stays visually
consistent (postmark badges, warm paper background, Fraunces for
headings/Italian text, Inter for UI, IBM Plex Mono for small labels).

Level accents read as metro lines: A1 blue, A2 red, B1 green, B2 purple,
C1 teal. Adding a level means adding its `--color-*` pair to `THEME_STYLE`
(the base `:root` **and** all three override blocks) plus an entry in
`LEVEL_ACCENTS` — the data files only spread what's already there.
