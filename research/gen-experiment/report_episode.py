"""Write the committed measurement report for one serial episode.

This is the half of the release gate that actually measures Italian. It runs
check_text.py's two-detector union — spaCy's morphology and the suffix rules,
unioned because neither is trustworthy alone — over one episode's text, against
the lexicon exported from src/data/fondamentale.js, and writes a JSON report
that `npm test` then holds the shipped text to.

The hash is the point. A report that merely said "95.8%" would go stale the
first time anyone touched a sentence, silently. The report carries a SHA-256 of
the exact bytes measured, so the JS gate can refuse any episode whose prose has
drifted away from its own measurement. The JS side measures nothing linguistic;
it only checks that a committed measurement is still about the text on disk.

Usage:
    .venv/bin/python report_episode.py --lexicon LEX.json --id ID \\
        --text TEXT.txt --out REPORT.json
"""
import argparse
import datetime
import hashlib
import json
import os

import check_text


def report(episode_id, text_bytes, lexicon_path, lexicon_lemmas):
    text = text_bytes.decode("utf-8")
    result = check_text.analyse(text, episode_id)
    # Off-lexicon *lemmas*, deduplicated and sorted: the gate asks whether every
    # unknown word was declared, and a word appearing four times is one
    # declaration, not four. The surface forms are kept alongside so a human
    # reading the report can see what was actually on the page.
    off_lexicon = {}
    for surface, lemma in result["unknown"]:
        off_lexicon.setdefault(lemma, set()).add(surface)
    return {
        "episodeId": episode_id,
        "measuredAt": datetime.datetime.now(datetime.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        # SHA-256 over the UTF-8 bytes handed to the checker — not over a
        # re-serialisation of them. The JS gate recomputes this from
        # canonicalText(episode) and the two must agree byte for byte.
        "textSha256": hashlib.sha256(text_bytes).hexdigest(),
        "textBytes": len(text_bytes),
        # Content tokens: punctuation, numerals and proper nouns are excluded by
        # check_text.analyse, because a name is not a vocabulary burden.
        "contentWords": result["n"],
        # Lexicon-only coverage: the share of content tokens whose lemma is in
        # fondamentale.js. It does NOT credit the episode's declared new words —
        # the design promises a readability figure against the base vocabulary,
        # and crediting the declarations would let an episode buy its own number.
        "lexiconOnlyCoverage": round(result["coverage"], 1),
        "offLexiconLemmas": sorted(off_lexicon),
        "offLexiconForms": {k: sorted(v) for k, v in sorted(off_lexicon.items())},
        "stageFlags": [{"word": w, "kind": k} for w, k in result["flags"]],
        "lexicon": {
            "source": os.path.basename(lexicon_path),
            "size": len(lexicon_lemmas),
            # Binds the report to the word list it measured against. Growing the
            # lexicon cannot invalidate a report — a new entry can only move a
            # lemma off the off-lexicon list, never onto it — but *removing* an
            # entry can, and then this hash is how you know the report is stale.
            "sha256": hashlib.sha256(
                "\n".join(lexicon_lemmas).encode("utf-8")
            ).hexdigest(),
        },
        "tooling": {
            "checker": "research/gen-experiment/check_text.py",
            "detectors": "union(spaCy morphology, Italian suffix rules)",
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lexicon", required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    lemmas = check_text.load_lexicon(args.lexicon)
    with open(args.text, "rb") as fh:
        text_bytes = fh.read()
    data = report(args.id, text_bytes, args.lexicon, lemmas)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")
    print("wrote", args.out)


if __name__ == "__main__":
    main()
