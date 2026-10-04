# Can a model write constrained Italian? — a measured test

Answers the open question left in the design proposals: whether 340 words of
decent Italian can be generated inside a fixed ~600-lemma lexicon *and* a fixed
grammatical stage (stage 3 — presente, passato prossimo, imperfetto only).

## Run it

```bash
/usr/local/bin/python3.9 -m venv .venv
.venv/bin/pip install "spacy==3.7.5" simplemma
.venv/bin/pip install https://github.com/explosion/spacy-models/releases/download/it_core_news_sm-3.7.0/it_core_news_sm-3.7.0-py3-none-any.whl
.venv/bin/python build_lexicon.py 600
.venv/bin/python check_text.py "texts/*.txt"
.venv/bin/python summarise.py
.venv/bin/python sweep.py
```

## Files

| File | What it does |
|---|---|
| `build_lexicon.py` | Builds an N-lemma Italian lexicon from an OpenSubtitles frequency list, lemmatised and aggregated. Drops hallucinated lemmas by keeping only those attested as real surface forms. |
| `check_text.py` | Measures a text: known-word coverage against the lexicon, plus grammar-stage violations. Two independent detectors (spaCy morphology + Italian suffix rules) are unioned, because neither is trustworthy alone. |
| `report_episode.py` | Writes the committed measurement report for one serial episode — coverage, off-lexicon lemmas, stage flags and a SHA-256 of the exact bytes measured. See "Release gate for the serial" below. |
| `summarise.py` | Aggregates results and separates hand-verified genuine violations from detector false positives. |
| `sweep.py` | Coverage of each text against lexicons of 400–3000 lemmas. |
| `texts/` | The eight test texts: 3 naive, 3 constrained, 1 long constrained, 1 repaired. |

## Headline results

| Condition | Mean coverage | Genuine stage violations |
|---|---|---|
| Naive prompt (no lexicon given) | 82.1% | 12 in 882 words — 1 per 73 |
| Lexicon-constrained | 97.2% | 0 in 806 words |
| Constrained at 314 words | 97.5% | 1 (`saprai`, futuro) |
| Constrained + repair pass | 97.5% | 0 |

Natural, unconstrained Italian narrative needs roughly **3,000 lemmas** to reach
95% coverage. Constrained writing reaches it at **600**. Generating against the
lexicon is therefore not an optimisation — it is the only way early reading works.

## Limitations

- The texts were written by the same model that is being evaluated, so this
  demonstrates that the capability exists; it is not a blind benchmark.
- The lexicon is an OpenSubtitles-derived proxy for De Mauro's *vocabolario
  fondamentale*. It is dialogue-skewed and misses everyday concrete nouns
  (`tavolo`, `letto`, `sedia`, `porta` below 1500) — which is precisely the gap
  De Mauro's *alta disponibilità* tier was designed to fill.
- The stage detector produced 4 false positives across 8 texts, all past
  participles used adjectivally or one parse error. Production use needs review.

---

# Release gate for the serial

The experiment above answered "can it be done". This section is the part that
ships: the pipeline an episode of Il Cinema's serial must pass before it can
appear in `src/data/serial.js`.

## The one thing to understand

**The JavaScript side measures nothing linguistic.** `src/shared/serialGate.js`
does not lemmatise, parse, or judge a verb tense. The measurement is the Python
pass in this directory — spaCy's morphology unioned with the Italian suffix
rules, because neither is trustworthy alone — run once by the author, writing a
committed JSON report. All `npm test` then does is check that the committed
measurement is still *about the text on disk*, and that everything it found was
declared.

That split is a finding, not a shortcut. `src/shared/lemma.js` says of itself
that `lemmaKey` is "deliberately not a stemmer: nothing here should decide that
`parlo` and `parlare` are the same word" — which is exactly the normalisation a
coverage figure needs. Measured against the real 600 entries, the design's own
certified episode text (`texts/B_constr_1.txt`) scores **58.2%** by bare surface
match over the same 282 content tokens and **92.9%** with the lemmatiser — a
34-point gap that is entirely Italian inflection. (Earlier passes over the same
text reported 51.2% and 57.7% for the surface figure depending on how tokens were
filtered; the number above is this pipeline's own, through `check_text.py`'s token
filter.) A JS gate would reject prose the experiment certified, and an author
chasing the JS number writes Italian with no inflection in it.

The three portable suffix patterns are likewise **not** a gate. The plan's
adversarial review measured them over `src/data/stories.js`'s A1/A2 paragraphs —
777 tokens known to be presente and passato prossimo — and got 9 flags, 8 of them
false (`così`, `turisti`, `visti`, `strette`, `mette`, `triste`, `faccia` twice).
`check_text.py` avoids that by gating the passato-remoto rule on spaCy's part of
speech and trapassato on its morphology, which JS cannot do. The patterns are
allowed as a clearly-labelled author aid and nothing more.

**If the venv cannot be built, no episode ships.** The pipeline exits non-zero
and says so. The fallback is to publish nothing, not to publish unchecked.

## Build the venv

Gitignored at `research/gen-experiment/.venv`. Verified on macOS x86_64:

```bash
cd research/gen-experiment
/usr/local/bin/python3.9 -m venv .venv
.venv/bin/pip install "spacy==3.7.5" simplemma
.venv/bin/pip install https://github.com/explosion/spacy-models/releases/download/it_core_news_sm-3.7.0/it_core_news_sm-3.7.0-py3-none-any.whl
```

Known-good versions: Python 3.9.0, spacy 3.7.5, simplemma 1.1.2,
it_core_news_sm 3.7.0.

## Run the pipeline

From the repo root:

```bash
npm run serial:measure                    # every episode in src/data/serial.js
node scripts/measure-serial.mjs --text FILE --id ID --out REPORT.json
```

It exports `src/data/fondamentale.js` to the lexicon shape `check_text.py` wants
(`scripts/export-lexicon.mjs`), writes each episode's canonical text to
`.build/`, and writes one report per episode into `src/data/serial-reports/`.

Not `build_lexicon.py`'s `lexicon_600.json`: that is the OpenSubtitles proxy,
and the Limitations above admit it has no `tavolo`, `letto`, `sedia` or `porta`.
`fondamentale.js` exists to replace it. The export strips the definite article,
because `fondamentale.js` stores an opaque noun *with* its article (`la chiave`,
`il problema`, `l'amore`) and a token-level checker could never match that.

The second form is how the gate's own fixtures in `gate-fixture/` were made —
the experiment's certified text, run through the exact pipeline an episode goes
through.

## What the report means

```json
{
  "episodeId": "B_constr_1",
  "textSha256": "09d526f9…",   SHA-256 of the exact UTF-8 bytes measured
  "textBytes": 1611,
  "contentWords": 282,          punctuation, numerals and proper nouns excluded
  "lexiconOnlyCoverage": 92.9,  share of content tokens whose lemma is in the
                                lexicon — NOT crediting declared new words
  "offLexiconLemmas": ["aria", "attimo", "luce", …],
  "offLexiconForms": { "suo": ["sua", "suo"] },
  "stageFlags": [],             forms outside presente/passato prossimo/imperfetto
  "lexicon": { "size": 600, "sha256": "061a50aa…" }
}
```

`textSha256` is the point. A report that only said "92.9%" would go stale the
first time anyone touched a sentence, silently. The hash lets the JS gate refuse
any episode whose prose has drifted away from its own measurement.

`lexicon.sha256` is traceability, not a gate. Growing the lexicon cannot break a
report — a new entry can only move a lemma *off* the off-lexicon list, never on
to it, so an old report over-states its unknowns and the gate stays conservative.
*Removing* or renaming an entry can break it; re-run the pipeline then.

## What `npm test` checks

`src/data/serial.test.js`, over every episode in `src/data/serial.js`:

1. a report exists — no report, no ship;
2. `textSha256` matches the shipped text byte for byte;
3. **every off-lexicon lemma is in that episode's declared new words.** This,
   not raw coverage, is the real gate: every unknown word must be deliberate;
4. declared new words are within `NEW_WORDS_CAP` — a judgement, documented as
   one beside the constant, and what stops "declare everything" from gaming (3);
5. `stageFlags` is empty;
6. `lexiconOnlyCoverage` is reported as a number and clears `COVERAGE_FLOOR`.

`EPISODES` is empty, so that loop passes over nothing. The same gate is therefore
run against fixtures in `gate-fixture/`, through the same function, and each arm
is proven to fail when it should. `B_constr_1` clears five arms and fails
coverage at 92.9% — which is the honest headline of this slice: **the
experiment's 97.2% was for its own proxy lexicon and was never ours.** Against
the real 600 the same certified text sits 2.1 points under the floor, because
`fondamentale.js` has no `suo`, `mio`, `tuo`, `me`, `luce`, `aria`, `tipo`,
`piano`, `strano`, `attimo`, `tranquillo` or `lì` in its first 600. The repair
pass the experiment describes is the norm, not the exception.

The Python here is outside the JS coverage gate by construction —
`vite.config.js` includes `src/**/*.{js,jsx}` only — so none of it is counted,
and nothing about the coverage config needed changing to keep it out.
