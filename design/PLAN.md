# La Città — the build plan

One page: what the app is becoming, what is built, what is next, and which
decisions are already settled so they don't get re-argued.

This file is the working plan; update it as chunks land.

### The visual designs

GitHub shows `.html` files as source code, so open the published links to
actually see them — the repo copies are the source of truth and the links are
republished from them.

| | Screens | Live | Source |
|---|---|---|---|
| **La Città** — the current design | 21 | [open](https://claude.ai/code/artifact/23fba711-0323-44ba-aaf9-81fad0d2956e) | [`02-la-citta.html`](02-la-citta.html) |
| **Three concepts** — superseded, kept for the reasoning | 27 | [open](https://claude.ai/code/artifact/a43f6ede-deec-4636-83ff-14f9528a5aae) | [`01-three-concepts.html`](01-three-concepts.html) |
| **Evidence review** — the research behind every decision | 50 sources | [open](https://claude.ai/code/artifact/ab63d8c1-421b-4bfe-add5-a68a00b480e7) | [`../research/evidence-review.html`](../research/evidence-review.html) |

To view a source copy locally: `open design/02-la-citta.html`.

**If you edit a design file, republish it** — otherwise the link and the repo
drift apart, which has already happened once.

---

## What La Città is

An Italian course shaped as a city. Each district is a place you'd actually
have to cope with in Italian; one of them is a serial you can just about read.
The app is the whole course, not a supplement — so it owes all four of Nation's
strands, not just vocabulary drilling.

Built for one learner: **Polish L1, fluent English L2, beginner in Italian.**
That is a design constraint, not a footnote — see [Polish is a first-class
layer](#polish-is-a-first-class-layer).

---

## Status

| # | Chunk | State |
|---|---|---|
| 1 | **The lexicon** — De Mauro `fondamentale`, four word states, frequency-weighted coverage, streak deleted | ✅ merged ([#4](https://github.com/majakulpa/italian-app/pull/4)) |
| 2 | **La Città** — city map home screen, five districts, locks that state their condition | ✅ merged ([#8](https://github.com/majakulpa/italian-app/pull/8)) |
| 3 | **L'Officina** — mapping cards, word detail, La Riserva grid + drill, the articles strand | ✅ complete |
| 4 | **La Piazza** — the review district: typed production, located feedback, a landing screen | ✅ complete |
| 5 | **The stage model** — infer stage from production; gate grading, never content | later, needs a schema change first |
| 6 | **Il Cinema** — the generated serial | later, gated at 600 solid words |
| 7 | **Scenes with voice** — the four-phase task loop | last, biggest build |

### What exists on `main` today

- `src/data/fondamentale.js` — **400 of a target 2,000** entries, rank order, EN + PL glosses, articles on opaque nouns.
- `src/shared/wordState.js` — `unseen → learning → known → solid`, derived from the Leitner box, never stored.
- `src/shared/coverage.js` — `coverage()`, `coverageBands()`, `rankWeight()`, and the
  vocabulary bridge: `lemmaKey()`, `lexiconUnits()`, `lexiconStates()`, `lexiconEvidence()`.
  The bridge is walked once into rank → units; the states, the scheduler box behind
  a word and the traces under it are three reads of that, not three walks.
- `src/shared/districts.js` — the five districts, their streets, and their locks.
  `officina` routes to its own hub rather than straight to a module.
- `src/modules/officina/` — the L'Officina hub (design 07) and its bench roster.
  **All five benches open** — the vocabulary deck, Mappatura delle parole, La Riserva,
  Gli Articoli and Falsi Amici — and each carries a figure read out of storage.
  None of the mockup's drawn numbers survived: a bench either measures its count
  or shows none.
- `src/data/mappe.js` — **4 suffix maps** (`-zione`, `-ità`, `-ico`, `-ista`), each with both
  roads, its notes, its false friends and 5–6 production drills.
- `src/data/articoli.js` — **3 strands, 10 rules, 16 items**, each with three options,
  the rule it instances and a Polish anchor of its own.
- `src/data/falsiAmici.js` — **14 false friends** from two sources: the traps each map
  already declares, reused rather than copied, and the pairs no suffix rule generates.
- `src/modules/riserva/` — La Riserva (design 10), word detail (design 11),
  `traces.js`, which answers "dove l'hai incontrata" from the deck and the story
  glosses, and the fascia drill (`drill.js`, `DrillRound.jsx`) — typed
  production over the base vocabulary, graded through `reviewItem` under
  `riserva:` keys. **This is what raised the coverage ceiling from 1.6% to
  66.1%, and ranks 301–400 raised it again on their own to 69.1%**; see open
  question 2.
- `src/shared/typedAnswer.js` — accent-tolerant matching for typed answers, and the
  shared-prefix arithmetic the located feedback is built on. Three modules judge
  against it now: `modules/mappe/feedback.js`, `modules/falsiAmici/feedback.js`
  and `shared/locatedFeedback.js`, which La Piazza and La Riserva share —
  it moved out of `modules/review/` the day it got a second caller.
- `src/modules/review/` — La Piazza (design 18): the landing, the typed round,
  `question.js` (a due unit turned into something to produce) and `week.js`
  (the one figure the landing states). The nine verdict kinds are in
  `shared/locatedFeedback.js` and the card that draws them in
  `shared/Verdict.jsx`, because La Riserva's drill produces the same verdicts.
- Four module screens (vocab, grammar, conversations, stories) still in the **old postcard styling**.
  Everything in L'Officina — the hub, Mappatura delle parole, La Riserva, word detail,
  Gli Articoli and Falsi Amici — and La Piazza are in the new one, per the rule in
  the visual-seam open question below.

---

## Settled decisions

Don't re-litigate these without new evidence.

**The streak is gone, permanently.** Hours logged correlated near-zero with
proficiency and a fifth of learners farmed the cheapest lessons. The home screen
leads with coverage and solid words. Nothing may count sessions, minutes or
consecutive days.

**Coverage is frequency-weighted, not `count / 2000`.** Word rank 12 is worth far
more than rank 1,900.

**Il Cinema unlocks at 600 solid words + 2 districts finished.** This is the only
threshold in the design that came out of an experiment rather than judgement: at
400 known words the best achievable coverage of text written *for* the learner is
90.1% — roughly one unknown word in ten, which is decoding, not reading. At 600
it is 97.2%. See [`../research/gen-experiment/`](../research/gen-experiment/).

**Coverage is never shown as a percentage of ability, and La Riserva shows no
percentage at all.** This was open question 1, and the arithmetic was never the
problem — it is right and it stays exactly as it is. The problem is that a share
of running text reads like a share of the language, and the two diverge most
violently at the beginning. The real curve, computed from `rankWeight()`:

| words known | coverage | unknown words per 100 |
|---|---|---|
| 10 | 30.8% | 69 |
| 100 | 54.5% | 45 |
| 600 | 73.3% | 27 |
| 2,000 | 86.0% | 14 |

A learner with 100 words has "54.5% coverage" and cannot read a menu. Both
halves of that sentence are true, and only the second one is about her. Note
also that the full 2,000 still leaves 14 unknown words in every 100 — well under
the 95–98% a text needs before it can be read rather than decoded. Coverage
flatters at every point on the curve, and worst at the start.

So, three rules:

- **La Riserva shows counts and worth, never a percentage.** The grid, `N / 2,000`
  by state, and what each *fascia* is worth in coverage points — which is what
  the design already draws ("queste 200 da sole valgono 4,3 punti"). Its headline
  figure is `834`, a count, not a percent. A progress bar over the whole 2,000
  would be the exact lie this decision exists to prevent.
- **The map keeps the percentage**, because share-of-running-text is a real and
  useful quantity, but it is always labelled as that, always paired with the word
  count, and never called complete, done, or progress.
- **Where a single honest number is wanted, it is the inverse**: unknown words
  per 100. It is the same fact, it tracks reading difficulty rather than flattering
  it, and it degrades in the right direction — 45 at a hundred words, 14 at two
  thousand.

This is also the number that makes the serial's case rather than undercutting it.
Naturally-written Italian leaves 14 words per 100 unknown even at the full 2,000;
text written *against* the learner's lexicon leaves under 3 at 600, which is the
whole reason Il Cinema is possible. The gap between those two is the product.

**Locks must state their condition.** Never a bare padlock. A locked district
carries a live counter and a sentence saying what opens it, and stays focusable
rather than dropping out of the tab order.

**Only gate on numbers you have measured.** The design drew five padlocks on day
one; the app ships two, because the other three were pacing guesses. A lock
invented to make the map look busier is exactly the guesswork the sweep avoided.

**`met` is not a word state.** It was designed, then removed: nothing in the app
writes it. It comes back the day a glossing surface produces it.

**Generation is proven, and it is the mechanism.** Naturally-written Italian needs
~3,000 lemmas to clear 95% coverage; text written *against* the learner's lexicon
clears it at 600. That gap is why the serial is possible at all.

---

## Open questions

**1. "Solid" means surviving 7 days, not 21.** `BOX_DAYS = [0,1,3,7,21]`, so
reaching box 5 means surviving the 7-day gap; surviving 21 days means answering
correctly *while in* box 5, which the scheduler can't distinguish. The wording is
fixed. Whether 7 days is the right bar for "solid" is not — coverage and the
Cinema gate both lean on it. A real 21-day bar needs a sixth box in `srs.js`.

**2. The lexicon is 400 of 2,000 — and that is now the only thing capping
coverage.** This entry used to say the lexicon was the real bottleneck while
the arithmetic said otherwise: the ceiling was ~1.6%, and it was 1.6% because
the *bridge* was one module wide, not because the list was short. Seeding
1,600 entries would have moved the headline by nothing at all.

La Riserva's drill widened the bridge — every entry is a schedulable unit
under a `riserva:` key — so the ceiling is now exactly the worth of the ranks
that have a word behind them: **69.1%, and 400 / 2,000 solid**, pinned in
`coverage.test.js`. The mechanism reaches everything the file holds.

So the sentence is true for the first time: hand-authoring 1,600 more accurate
entries with Polish glosses is the real bottleneck in this whole plan, it is a
content problem rather than an engineering one, and every entry added now
raises the headline. Decide whether to grind through it or source De Mauro's
list directly.

**3. There is a visual seam.** The city uses the new design system; the four
module interiors still use the old postcard styling. It closes as each district
is built out. Nobody should "fix" it with a blanket restyle — that would be a
large, untestable diff for no behaviour change.

---

## Chunk 3 — L'Officina

The word workshop, and the district that makes the lexicon visible. Cheapest per
unit of value, and the part of the design most worth having.

Four workbenches, per screen 07:

- **Mappatura delle parole** — ✅ built ([#11](https://github.com/majakulpa/italian-app/pull/11)).
  Suffix correspondences as rules, not word lists: `-zione`, `-ità`, `-ico`,
  `-ista`, each with the Polish road, the English road, what the ending brings
  with it, and the false friends the rule creates. The drill is production —
  the app's first typed exercise — and a wrong answer is located rather than
  solved. It also stays out of the Leitner queue, and its stated blocker —
  that La Piazza was multiple-choice and this bench types — is gone as of
  chunk 4. What holds now is the narrower argument beside its
  `scheduled: false` flag in `src/shared/stats.js`: a Leitner box schedules a
  lexical item, and a suffix rule is not one.
- **La Riserva** — ✅ built. The 2,000-word grid in frequency order, coloured
  by state; counts and per-band worth, no percentage. A *fascia* is also the
  way in to a typed production round over the entries it holds — gloss in
  English and Polish, you write the Italian, graded through `reviewItem` under
  `riserva:` keys — which is what made the base vocabulary studiable at all and
  moved the ceiling from 1.6% to 66.1%. It is the only bench in the Leitner
  queue, because a base-vocabulary entry is a lexical item and that is what a
  Leitner box schedules.
- **Gli Articoli** — ✅ built. The permanent strand: Polish has no articles and
  the errors survive into advanced proficiency, so this never stops appearing.
  Sequenced determinativo → indeterminativo → preposizioni articolate, which
  is design screen 12's own footer and a teaching order rather than an
  authoring one. Three options an item, one of which can be the zero article,
  because `Sono medico` and `abito in centro` are real answers. Every item
  carries its own Polish anchor. A wrong answer names the *dimension* it went
  wrong on and never the answer — three buttons cannot be located the way an
  infinite answer space can — and the rule and the Polish card stay shut until
  the item does.

  It stays out of the Leitner queue, but **not for the reason written here
  before**. That reason was that the queue would answer a wrong pick by
  revealing the right one on the spot — the weakest feedback shape available,
  and the exact pattern this bench replaces — and that it should be revisited
  when La Piazza learned to locate rather than solve. It has (chunk 4). What
  is left is not an argument but work: La Piazza asks for typing now, and an
  article item is a choice between three authored forms, so the queue needs a
  second question shape before it can carry one.
- **Falsi Amici** — ✅ built. The traps collected as you hit them: `colazione` ≠
  *kolacja*, `droga` ≠ *droga*, `firma` ≠ *firma*, `divano` ≠ *dywan*. It needed
  Mappatura delle parole first, because Mappatura delle parole is where most of them get generated — and
  Mappatura delle parole's `trap` verdict is now the write that records a catch, so walking
  into one in either place is the same event. The collection draws from two
  sources: the `traps[]` each map already declares, reused rather than copied,
  and the pairs no suffix rule generates, which Latin handed to both languages
  and the two took in different directions. Only a real Italian word with a
  slid meaning is collected — Mappatura delle parole's other three trap drills bait with
  `citità`, `musico` and `psichiatrista`, which are the rule overreaching onto
  non-words, a different lesson.

The hub screen (design 07) is built ([#12](https://github.com/majakulpa/italian-app/pull/12)).
`officina` routes to it, Mappatura delle parole is reached from the map rather than only
through the NavMenu, and the vocabulary deck sits on it as a fifth bench —
the district used to route straight there, so it needed a door of its own.

**The chunk is closed.** Word detail (design 11) was the last screen, and its
open question turned out to be the way in rather than the quantity: the grid is
deliberately not two thousand buttons, so a *fascia* is the door. A band opens
to at most two hundred words, on demand, and those are the controls.

Three things on that screen the design draws and the app does not, each for the
same reason — nothing behind them:

- **IPA and part of speech.** No pronunciation data exists, and inventing a
  stress mark per word teaches a wrong word. The speak button is the honest
  version: the browser says it aloud rather than the app claiming to know how
  it is transcribed.
- ~~**"Dove l'hai incontrata"**~~ — this one turned out to be buildable, and
  the first version of the screen was wrong to say otherwise. `Ep. 7` and
  `Il Bar` are drawings, but two real encounters are provable: the vocabulary
  deck put the lemma in front of you in an example sentence, and a story
  glossed it under your finger. `modules/riserva/traces.js` reads both.
  What stays true is the narrower claim — reading a story writes no word
  *status*, so a story trace says only that the story was finished.
  Matching is by written form, so a homograph can land under the wrong sense
  (`porta` the door against `porta` from *portare*); the trace carries the
  story's own gloss verbatim so the mismatch is visible rather than asserted.
- **Why Polish splits a word.** The pink card fires off data the lexicon
  already had: 87 of the first 300 entries carry more than one Polish sense.
  What it will not do is say *which* reason, because `pytać · prosić o` is two
  meanings and `mówić · powiedzieć` is one meaning in two aspects, and nothing
  in the file tells them apart.

La Riserva is built: the 2,000 as a grid in frequency order, coloured by state,
with the ten *fasce* underneath saying what each is worth. No percentage on it,
per the settled decision. It draws a rank with no word behind it differently
from one the learner has not met — the first is a fact about the file, the
second about her, and the lexicon being 400 of 2,000 is visible rather than
implied. The drill keeps that distinction rather than losing it: a band with
no word written down offers no round, and a band already met says so.

Word detail is the last screen in this chunk, and its open question is now the
way in rather than the quantity: the grid is deliberately not two thousand
buttons, so pressing a cell is not the answer.

Retrieval rule for every drill here: **produce first, reveal last.** A wrong
answer gets located, not solved — flag it, say where, allow a second attempt,
then reveal. The standard wrong→red X→answer pattern is the weakest feedback
shape available. Mappatura delle parole implements this in `modules/mappe/feedback.js`;
where the item is "a gloss, produce the Italian", `shared/locatedFeedback.js`
already does it and should be reused rather than forked again.

---

## Chunk 4 — La Piazza

Design screen 18, and the screen the design calls "the most important
interaction in the app: a wrong answer gets *located*, never solved". It was
the opposite of that: four options, a red cross, and the answer painted green
on the spot. Two entries above name that as the reason a bench stays out of
the Leitner queue; both are now out of date, and both have been corrected.

What it is:

- **Production, not recognition.** Everything is typed. A grammar item's
  authored `options` stay in the data and stop being drawn — they become the
  `distractor` verdict instead, which is the most locatable error in the app.
  A vocabulary word is asked by its English gloss, with its example sentence
  gapped out underneath, because a gloss alone is often ambiguous. Twelve of
  the 120 words are inflected across their own example and cannot be gapped
  without lemmatising; those get the gloss alone, and a data test pins which
  twelve so a new one cannot fail quietly.
- **Located, not solved.** `shared/locatedFeedback.js` — which lived in
  `modules/review/` until La Riserva's drill turned out to need the same
  judge to the character. Same shape as the two feedback files above, no
  judging logic in common with them, all of it built on the four domain-free
  exports of `shared/typedAnswer.js`.
- **Only right-first-time promotes.** `srs.js` is untouched and grading stays
  binary. A correct second attempt came after the app said where to look,
  which is scaffolding, and "show me" is wrong by definition. An accent left
  off still counts: a spelling slip is not a failed retrieval.

**One figure of the design is refused.** Screen 18 warns that *14 parole
escono da «solida» se non le rivedi entro giovedì.* That would be false here:
`srs.js` has no decay, so a top-box item nobody answers stays in the top box
and simply goes overdue. Nothing leaves solid by neglect, so nothing can be
defended by answering before Thursday — and inventing a penalty to manufacture
urgency is the streak wearing a different hat. The card states the fact
underneath it instead: which solid words come back inside the next seven days,
or nothing at all when that is zero. Same rule as the four padlocks the map
refused and the figures the benches refused.

**What this unblocks, and is not doing here.** Gli Articoli, Mappatura delle
parole and Falsi Amici each stated a blocker that was a fact about La Piazza,
and all three of those facts have changed. Bringing any of them into the queue
is its own chunk: the article strand needs the queue to carry a second
question shape, since it is a choice between three authored forms and the
queue now asks for typing.

---

## Polish is a first-class layer

Not a translation. Slavic learners reason about Romance grammar through their L1
in 93% of cases, after a decade of English — so explanations anchor in Polish
categories even though the interface is English.

- **Aspect** via `dokonany` / `niedokonany`: *przeczytałem* → `ho letto`,
  *czytałem* → `leggevo`. Then flag where it fails — `być` has no perfective
  partner, so *era* and *è stata* both collapse to *był*.
- **Cognates through both languages.** They unlock different words, and Polish
  sometimes wins where English actively misleads: `fabbrica`/*fabryka* vs English
  *fabric*.
- **Pronunciation is mostly skippable.** Polish already gives pure vowels, a
  trilled `r` and transparent spelling. Spend the budget on geminates
  (`nono`/`nonno`) and on mobile stress, which Polish fixed penultimate stress
  does not prepare you for.
- **Articles are the one genuinely hard thing**, and neither Polish nor English
  helps.

---

## Rules that hold across every chunk

- `npm test` green, coverage gated at 100%. Don't lower the threshold.
- Reuse `storage.js`; never touch `localStorage` directly.
- Pull styling from `theme.js`. Migrate a screen's styling when you rebuild that
  screen, not in a blanket pass.
- Legible at 375px, keyboard-reachable, visible focus.
- **Contrast is measured in a browser, in both themes, not inferred from the
  tokens.** The token checks in `theme.test.js` prove a colour is good; they
  cannot see that no colour was set. La Riserva's legend shipped inheriting
  browser-default black — 1.27:1 in the dark theme — with every arithmetic
  check passing and 1,336 tests green. jsdom computes no cascade for inherited
  colour, so nothing automated here can catch it.
- Never grade a structure above the learner's stage. It stays in the input.
- Push branches and open PRs freely; never merge without approval.
- Short PR descriptions. UI evidence goes in the
  [wiki](https://github.com/majakulpa/italian-app/wiki), never committed here.
