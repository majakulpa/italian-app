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
