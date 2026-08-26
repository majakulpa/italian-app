# La Città — the build plan

One page: what the app is becoming, what is built, what is next, and which
decisions are already settled so they don't get re-argued.

The full design is [`02-la-citta.html`](02-la-citta.html) (21 screens). The
evidence behind it is in [`../research/`](../research/). This file is the
working plan; update it as chunks land.

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
| 3 | **L'Officina** — mapping cards, word detail, La Riserva grid, the articles strand | ▶︎ next |
| 4 | **The stage model** — infer stage from production; gate grading, never content | later, needs a schema change first |
| 5 | **Il Cinema** — the generated serial | later, gated at 600 solid words |
| 6 | **Scenes with voice** — the four-phase task loop | last, biggest build |

### What exists on `main` today

- `src/data/fondamentale.js` — **300 of a target 2,000** entries, rank order, EN + PL glosses, articles on opaque nouns.
- `src/shared/wordState.js` — `unseen → learning → known → solid`, derived from the Leitner box, never stored.
- `src/shared/coverage.js` — `coverage()`, `coverageBands()`, `lexiconStates()`, `rankWeight()`.
- `src/shared/districts.js` — the five districts, their streets, and their locks.
- Four module screens (vocab, grammar, conversations, stories) still in the **old postcard styling**.

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

**1. Coverage is honest about text and misleading about ability.** Applied
straight, the weighting puts a day-one learner near **50%**, because function
words dominate. Arithmetically right, and a terrible thing to show a beginner —
it also undercuts the "2,000 words buys 86%" story the design rests on. Likely
resolution: the map shows a different quantity from the one the Riserva shows.
*Needs a decision before L'Officina's Riserva screen.*

**2. "Solid" means surviving 7 days, not 21.** `BOX_DAYS = [0,1,3,7,21]`, so
reaching box 5 means surviving the 7-day gap; surviving 21 days means answering
correctly *while in* box 5, which the scheduler can't distinguish. The wording is
fixed. Whether 7 days is the right bar for "solid" is not — coverage and the
Cinema gate both lean on it. A real 21-day bar needs a sixth box in `srs.js`.

**3. The lexicon is 300 of 2,000.** Realistic coverage ceiling today is ~1.6%.
Hand-authoring 1,700 more accurate entries with Polish glosses is the real
bottleneck in this whole plan, and it is a content problem, not an engineering
one. Decide whether to grind through it or source De Mauro's list directly.

**4. There is a visual seam.** The city uses the new design system; the four
module interiors still use the old postcard styling. It closes as each district
is built out. Nobody should "fix" it with a blanket restyle — that would be a
large, untestable diff for no behaviour change.

---

## Next chunk — L'Officina

The word workshop, and the district that makes the lexicon visible. Cheapest per
unit of value, and the part of the design most worth having.

Four workbenches, per screen 07:

- **La Riserva** — the 2,000-word grid in frequency order, coloured by state.
  Blocked on open question 1.
- **Le Mappe** — suffix correspondences taught as rules, not word lists.
  `-cja / -tion → -zione` unlocks ~1,100 words. Polish route first where it is
  shorter (`lekcja → lezione` beats `lesson → lezione`). Each card teaches its
  own false friends, because they are the direct cost of the strategy.
- **Gli Articoli** — the permanent strand. Polish has no articles and the errors
  survive into advanced proficiency, so this never stops appearing.
- **Falsi Amici** — the traps collected as you hit them: `colazione` ≠ *kolacja*,
  `droga` ≠ *droga*, `firma` ≠ *firma*, `divano` ≠ *dywan*.

Retrieval rule for every drill here: **produce first, reveal last.** A wrong
answer gets located, not solved — flag it, say where, allow a second attempt,
then reveal. The standard wrong→red X→answer pattern is the weakest feedback
shape available.

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
- Never grade a structure above the learner's stage. It stays in the input.
- Push branches and open PRs freely; never merge without approval.
- Short PR descriptions. UI evidence goes in the
  [wiki](https://github.com/majakulpa/italian-app/wiki), never committed here.
