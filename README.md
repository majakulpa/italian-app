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
  App.jsx                        App shell + module menu (home screen)
  shared/
    theme.js                     Colors, fonts, level accent colors — shared by all modules
    storage.js                   localStorage progress/streak persistence, shared by all modules
    speech.js, SpeakButton.jsx   Pronunciation playback (browser SpeechSynthesis API)
    shuffle.js, Postmark.jsx, PerforatedDivider.jsx, TopBar.jsx, SessionSummary.jsx
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
public/
  manifest icons, favicon
vite.config.js              PWA config (manifest, service worker) + Vitest config
```

## Tests

```bash
npm test          # run once
npm run test:watch
```

Vitest + React Testing Library. Covers persistence/streak logic, speech
support detection, the module UI flows, and the story data itself — every
gloss key has to occur in its own paragraph and every comprehension answer
has to be one of its options (see `*.test.js(x)` files next to the code
they test).

To add a module: create `src/modules/<name>/<Name>Module.jsx` exporting a
component that accepts an `onExit` prop (call it to return to the module
menu), add its data file under `src/data/` if needed, then register it in
the `MODULES` array in `src/App.jsx` with `ready: true`.

## What's built

- **Vocabulary** — A1/A2/B1 levels, 2 categories per level (72 words with
  example sentences), flashcard mode (flip, mark known/still learning),
  multiple-choice quiz mode with a missed-words review list, and a listening
  mode (hear the word via `SpeechSynthesis`, pick its meaning — no Italian
  text shown until you answer).
- **Grammar** — A1/A2/B1 levels, 2 topics per level (present tense of -are/
  -ere/-ire verbs, essere vs avere, articles, passato prossimo, comparatives).
  Each topic has a short explanation (conjugation table + bullet points +
  example sentences) and an 8-question fill-in-the-blank drill with a
  missed-items review list.
- **Conversations** — A1/A2/B1 levels, 2 guided dialogues per level (café,
  introductions, directions, restaurant, making plans, job interview). Each
  turn offers a more formal and a more casual way to say the same thing,
  with light feedback on the register — no wrong answers, just style. Chat
  transcript builds up turn by turn; a recap at the end tallies formal vs
  casual picks and re-lists your responses.
- **Stories** — A1/A2/B1 levels, 2 short original stories per level (a
  tourist's day in Rome and a Sicilian fairy tale; a missed train in Naples
  and a love story by letter; murder mysteries in Venice and in the
  Piedmont vineyards). Tenses are graded to match the grammar module — A1
  in the present, A2 in the passato prossimo, B1 mixing imperfetto and
  passato prossimo. The whole story scrolls on one page: each paragraph has
  a tap-to-reveal English translation and a pronounce button, and glossed
  words are underlined — tapping one opens a gloss bar at the bottom of the
  screen with its meaning. Three multiple-choice comprehension questions
  follow, each with an explanation, and finishing them marks the story done.
- **Persistence** — progress (`localStorage`) survives a reload: known/
  mastered words, drill items, completed dialogues and finished stories,
  plus a daily study streak, shared across modules.
- **Pronunciation** — speaker icons next to Italian text play it aloud via
  the browser's `SpeechSynthesis` API.

## Roadmap — suggested order for Claude Code

1. **Spaced repetition** — a simple leitner-box or SM-2-style scheduler so
   "still learning"/"learning" items resurface sooner than mastered ones,
   across all modules.
2. **Recorded audio** — the `SpeechSynthesis` pronunciation is in place;
   a recorded-audio pack would be a quality upgrade later.
3. **More stories** — the reader takes any number per level; adding a story
   is one object in `src/data/stories.js`, no UI work.

## Design notes

Colors, fonts, and per-level accent colors live in `src/shared/theme.js`
— keep new modules pulling from there so the app stays visually
consistent (postmark badges, warm paper background, Fraunces for
headings/Italian text, Inter for UI, IBM Plex Mono for small labels).
