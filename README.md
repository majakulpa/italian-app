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
  Dashboard.jsx                  Home screen: streak, overall %, level ladder, module cards, review band
  shared/
    theme.js                     Colors, fonts, level accent colors — shared by all modules
    storage.js                   localStorage progress/streak persistence, shared by all modules
    stats.js                     Reads that progress back across all four modules (dashboard counts)
    srs.js                       Leitner scheduler: boxes, due dates, the review queue
    speech.js, SpeakButton.jsx   Pronunciation playback (browser SpeechSynthesis API)
    shuffle.js, Postmark.jsx, PerforatedDivider.jsx, TopBar.jsx, SessionSummary.jsx, StreakChip.jsx
                                  Small presentational/utility pieces shared across modules
  data/
    vocab.js                     Vocabulary word lists (levels > categories > words)
    grammar.js                   Grammar topics (levels > topics > explanation + drills)
    conversations.js             Guided dialogues (levels > dialogues > steps > options)
    stories.js                   Graded readers (levels > stories > paragraphs + questions)
  modules/
    vocab/VocabModule.jsx              Flashcards + quiz UI (done)
    grammar/GrammarModule.jsx          Lesson (explanation) + drill UI (done)
    conversations/ConversationsModule.jsx  Chat-style guided dialogues (done)
    stories/StoriesModule.jsx          Reader + word glosses + comprehension quiz (done)
    stories/gloss.js                   Splits a paragraph into tappable glossed words
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

Vitest + React Testing Library. Covers persistence/streak logic, the Leitner
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
- **Dashboard** — the home screen reads that progress back: the day streak and
  an overall completion figure in a header band, an A1–C1 ladder of roundels
  showing how far each level is, and a progress bar with a real count on each
  module card. Read-only, and it re-reads storage every time you come back from
  a module. `src/shared/stats.js` is the only place that counts: its registry
  reuses the same key builders the modules write with, so the dashboard can't
  drift from what a module considers done. The overall and per-level
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
  plus a daily study streak, shared across modules.
- **Pronunciation** — speaker icons next to Italian text play it aloud via
  the browser's `SpeechSynthesis` API.

## Roadmap — suggested order for Claude Code

1. **Recorded audio** — the `SpeechSynthesis` pronunciation is in place;
   a recorded-audio pack would be a quality upgrade later.
2. **More stories** — the reader takes any number per level; adding a story
   is one object in `src/data/stories.js`, no UI work.
3. **Due items first inside decks** — the scheduler is in place but the
   flashcard and drill sessions still shuffle a whole category. Ordering each
   deck by what's due would make every session, not just Review, benefit from
   it.
4. **Typed recall / production** — every mode is recognition (pick an option,
   flip a card). Typing the Italian, with accent-tolerant matching, is the
   obvious missing exercise.

## Design notes

Colors, fonts, and per-level accent colors live in `src/shared/theme.js`
— keep new modules pulling from there so the app stays visually
consistent (postmark badges, warm paper background, Fraunces for
headings/Italian text, Inter for UI, IBM Plex Mono for small labels).

Level accents read as metro lines: A1 blue, A2 red, B1 green, B2 purple,
C1 teal. Adding a level means adding its `--color-*` pair to `THEME_STYLE`
(the base `:root` **and** all three override blocks) plus an entry in
`LEVEL_ACCENTS` — the data files only spread what's already there.
