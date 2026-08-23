"""Aggregate results, separating hand-verified genuine violations from
detector false positives, and compute simple prose-quality proxies."""
import json, glob, statistics as st
import spacy, simplemma
import check_text as C

# Hand-adjudicated: every flag the detector raised, checked against the actual
# sentence. Past participles used adjectivally ("le finestre erano bagnate",
# "la porta era socchiusa") are not trapassato; "le stesse stanze" is not a
# subjunctive; and spaCy simply misparsed "dormiva" inside guillemets.
FALSE_POSITIVES = {
    ("A_naive_1.txt", "bagnate"), ("A_naive_1.txt", "stesse"),
    ("A_naive_2.txt", "socchiusa"), ("B_constr_2.txt", "dormiva"),
}
COND = {"A_naive": "naive prompt", "B_constr": "lexicon-constrained",
        "C_constr": "lexicon-constrained (long)", "D_repaired": "constrained + repair"}

nlp = spacy.load("it_core_news_sm")
rows = []
for path in sorted(glob.glob("texts/*.txt")):
    name = path.split("/")[-1]
    text = open(path, encoding="utf-8").read()
    r = C.analyse(text, name)
    genuine = [(w, k) for (w, k) in r["flags"] if (name, w) not in FALSE_POSITIVES]
    doc = nlp(text)
    lemmas = [simplemma.lemmatize(t.text.lower(), lang="it")
              for t in doc if not t.is_punct and not t.is_space]
    sents = [s for s in doc.sents if len(s.text.strip()) > 1]
    cond = next(c for c in COND if name.startswith(c))
    rows.append(dict(name=name, cond=COND[cond], n=r["n"], cov=r["coverage"],
                     flags=len(r["flags"]), genuine=len(genuine),
                     genuine_list=genuine,
                     ttr=len(set(lemmas)) / len(lemmas),
                     mean_sent=len(lemmas) / max(len(sents), 1)))

print("\n" + "=" * 96)
print(f"{'text':<20}{'condition':<28}{'words':>6}{'cover':>8}{'raw':>5}{'genuine':>9}{'TTR':>7}{'sent':>7}")
print("-" * 96)
for r in rows:
    print(f"{r['name']:<20}{r['cond']:<28}{r['n']:>6}{r['cov']:>7.1f}%"
          f"{r['flags']:>5}{r['genuine']:>9}{r['ttr']:>7.2f}{r['mean_sent']:>7.1f}")
print("-" * 96)
for cond in ["naive prompt", "lexicon-constrained"]:
    g = [r for r in rows if r["cond"] == cond]
    tot_w = sum(r["n"] for r in g); tot_v = sum(r["genuine"] for r in g)
    print(f"{cond:<28} mean coverage {st.mean(r['cov'] for r in g):5.1f}%   "
          f"genuine violations {tot_v} in {tot_w} words "
          f"(1 per {tot_w // max(tot_v,1)})")
print("=" * 96)
print("\nGenuine violations by text:")
for r in rows:
    if r["genuine_list"]:
        print(" ", r["name"], "->", ", ".join(f"{w}[{k}]" for w, k in r["genuine_list"]))
print("\nDetector false positives (hand-verified):", len(FALSE_POSITIVES),
      "across", len(rows), "texts")
json.dump(rows, open("summary.json", "w"), ensure_ascii=False, indent=1)
