"""Build a ~600-lemma Italian lexicon, De Mauro `fondamentale`-style.

The real vocabolario di base isn't available as a machine-readable list, so we
approximate it: take an OpenSubtitles-derived frequency list (spoken register,
which is what De Mauro's fondamentale is weighted toward), lemmatise every
surface form, aggregate counts per lemma, and keep the top N.
"""
import sys, json, collections
import spacy

N = int(sys.argv[1]) if len(sys.argv) > 1 else 600
FORMS = 12000  # how far down the surface-form list to read

# Fragments left behind by elision (l', c', un', dell') and junk rows in the
# OpenSubtitles list that survive lemmatisation.
KEEP1 = {"a", "e", "o", "\u00e8", "i", "c", "l", "n", "d", "s"}

NOISE = {"perco", "finca", "po", "de", "un'", "dell", "nell", "sull", "all",
         "quell", "gliel", "sant", "cos", "vo", "ta", "eh", "ah", "oh", "mm",
         "beh", "ok", "okay", "ehi", "uh", "hey"}

nlp = spacy.load("it_core_news_sm", disable=["parser", "ner"])

rows = []
for line in open("it_freq_raw.txt", encoding="utf-8"):
    parts = line.split()
    if len(parts) != 2:
        continue
    w, c = parts[0], int(parts[1])
    if not w.isalpha() and "'" not in w:
        continue
    rows.append((w, c))
rows = rows[:FORMS]

freq = collections.Counter()
for doc, count in nlp.pipe(rows, as_tuples=True, batch_size=500):
    for t in doc:
        if t.is_punct or t.is_space:
            continue
        lem = t.lemma_.lower().strip()
        # spaCy occasionally emits a lemma with an internal space (e.g. "andre rò")
        if not lem or " " in lem:
            lem = t.text.lower()
        if t.pos_ == "PROPN":
            continue
        # Drop apostrophe fragments ("l", "c", "un") and obvious list noise.
        if (len(lem) < 2 and lem not in KEEP1) or lem in NOISE:
            continue
        freq[lem] += count

# A lemma spaCy invents ("vienere", "ragazzare", "giare") never occurs as a
# real surface form. Keep only lemmas attested somewhere in the frequency list
# itself, which removes the hallucinations without hand-curation.
ATTESTED = {w for w, _ in rows}
ENGLISH = {"the", "new", "jack", "wow", "ok", "okay", "yeah", "no", "you",
           "and", "for", "man", "all", "come", "here", "one", "time"}
lex = []
for w, _ in freq.most_common():
    if w in ENGLISH and w not in ("no", "come"):
        continue
    if w in ATTESTED:
        lex.append(w)
    if len(lex) == N:
        break
json.dump(lex, open("lexicon_%d.json" % N, "w"), ensure_ascii=False, indent=0)
print("lemmas kept:", len(lex))
print("first 60:", " ".join(lex[:60]))
print("last 20 :", " ".join(lex[-20:]))
