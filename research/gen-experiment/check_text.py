"""Measure an Italian text against a lexicon and a grammar stage.

Two independent detectors run over every verb form and the union is reported,
because neither alone is trustworthy: spaCy's small Italian model silently
mislabels some futures and conditionals, while pure suffix rules over-fire on
nouns. Every flag is printed so false positives can be eyeballed.
"""
import sys, json, re, unicodedata
import spacy
import simplemma

LEX = set(json.load(open("lexicon_600.json")))
nlp = spacy.load("it_core_news_sm")

# ---- rule-based detection of forms above stage 3 -------------------------
FUT = re.compile(r"(rò|rai|rà|remo|rete|ranno)$")
CND = re.compile(r"(rei|resti|rebbe|remmo|reste|rebbero)$")
IMPF_SUB = re.compile(r"(assi|asse|assimo|aste|assero|essi|esse|essimo|este|"
                      r"essero|issi|isse|issimo|iste|issero)$")
REMOTO = re.compile(r"(\u00f2|\u00ec|ai|asti|ammo|arono|ette|ettero|erono|irono|immo|isti)$")

# Real words that the suffix rules would otherwise mistake for verb forms.
NOT_FUT = {"remo", "tremo", "premo", "supremo", "estremo", "scremo", "rete",
           "parete", "moschettiere", "sincero"}
NOT_SUB = {"queste", "quelle", "veste", "teste", "celeste", "richieste",
           "proteste", "feste", "foreste", "inchieste", "interesse", "contesse",
           "principesse", "dottoresse", "professoresse", "esse", "peste",
           "questo", "vaste", "guaste", "onesta", "onesté"}
NOT_REM = {"mai", "ormai", "guai", "assai", "vai", "dai", "sai", "fai", "hai",
           "lai", "quai", "posti", "questi", "tristi"}
SUB_IRREG = {"sia", "siano", "siate", "abbia", "abbiano", "abbiate", "faccia",
             "facciano", "vada", "vadano", "possa", "possano", "voglia",
             "vogliano", "debba", "debbano", "sappia", "sappiano", "dia",
             "diano", "stia", "stiano", "venga", "vengano", "dica", "dicano",
             "esca", "escano", "prenda", "prendano", "metta", "mettano"}
AUX_IMPF = {"avevo", "avevi", "aveva", "avevamo", "avevate", "avevano",
            "ero", "eri", "era", "eravamo", "eravate", "erano"}


def rule_flags(tok, prev_toks):
    w = tok.text.lower()
    out = []
    if len(w) >= 5 and FUT.search(w) and w not in NOT_FUT:
        out.append("futuro")
    if len(w) >= 6 and CND.search(w) and w not in NOT_FUT:
        out.append("condizionale")
    if w in SUB_IRREG:
        out.append("congiuntivo")
    elif len(w) >= 6 and IMPF_SUB.search(w) and w not in NOT_SUB:
        out.append("congiuntivo")
    # A future in -rò also matches the remoto -ò rule; future wins.
    if ("futuro" not in out and len(w) >= 4 and REMOTO.search(w)
            and w not in NOT_REM and tok.pos_ in ("VERB", "AUX")):
        out.append("passato remoto")
    if tok.morph.get("VerbForm") == ["Part"] and tok.morph.get("Tense") == ["Past"]:
        for p in prev_toks:
            if p.text.lower() in AUX_IMPF:
                out.append("trapassato")
                break
    return out


def spacy_flags(tok):
    m, out = tok.morph, []
    mood, tense = m.get("Mood"), m.get("Tense")
    if mood == ["Cnd"]:
        out.append("condizionale")
    if mood == ["Sub"]:
        out.append("congiuntivo")
    if tense == ["Fut"]:
        out.append("futuro")
    return out


# ---- normalising a surface form back to something the lexicon can match ----
# Italian elides and cliticises heavily, and both lemmatisers choke on it:
# "ascoltami", "dell'", "nello", "portarti" are all built from lemmas that are
# in the list. Counting them as unknown would understate coverage badly.
ELIDED = {"l": "il", "un": "uno", "dell": "di", "all": "a", "nell": "in",
          "sull": "su", "dall": "da", "c": "ci", "d": "di", "quell": "quello",
          "gliel": "lo", "anch": "anche", "s": "si", "n": "in", "m": "mi",
          "t": "ti", "v": "vi", "po": "poco"}
PREP_ART = set()
for _p in ("ne", "de", "al", "su", "da", "co", "pe"):
    for _a in ("l", "llo", "lla", "lle", "gli", "i", "lo", "la", "le"):
        PREP_ART.add(_p + _a)
PREP_ART |= {"al", "del", "nel", "sul", "dal", "col", "allo", "dello", "nello",
             "sullo", "dallo", "agli", "degli", "negli", "sugli", "dagli"}
CLITICS = ["glielo", "gliela", "glieli", "gliele", "melo", "mela", "meli",
           "mele", "telo", "tela", "celo", "cela", "mi", "ti", "ci", "vi",
           "si", "lo", "la", "li", "le", "ne", "gli"]


def candidates(tok):
    """Every string that could reasonably represent this token's lemma."""
    w = tok.text.lower().strip("'\u2019")
    out = {w}
    for lem in (tok.lemma_.lower(), simplemma.lemmatize(w, lang="it").lower()):
        for piece in lem.split("|"):          # spaCy sometimes emits "nonna|nonno"
            piece = piece.strip()
            if piece and " " not in piece:
                out.add(piece)
    if w in ELIDED:
        out.add(ELIDED[w])
    if w in PREP_ART:
        out.add("il")                          # prep+article: both parts are core
    for c in sorted(CLITICS, key=len, reverse=True):
        if w.endswith(c) and len(w) - len(c) >= 3:
            stem = w[: -len(c)]
            for cand in (stem, stem + "e", stem + "re", stem + "ere", stem + "ire"):
                out.add(cand)
                out.add(simplemma.lemmatize(cand, lang="it").lower())
            break
    return out


def analyse(text, label=""):
    doc = nlp(text)
    content, unknown, flags = [], [], []
    for i, t in enumerate(doc):
        if t.is_punct or t.is_space or t.like_num or t.pos_ == "PROPN":
            continue
        content.append(t.text)
        cands = candidates(t)
        if not (cands & LEX):
            unknown.append((t.text, simplemma.lemmatize(t.text.lower(), lang="it")))
        f = set(spacy_flags(t)) | set(rule_flags(t, doc[max(0, i - 3):i]))
        for name in f:
            flags.append((t.text, name))
    n = len(content)
    cov = 100.0 * (n - len(unknown)) / n if n else 0.0
    print("=" * 62)
    print(f"{label}   words(content)={n}  coverage={cov:.1f}%  "
          f"out-of-lexicon={len(unknown)}  stage-flags={len(flags)}")
    if unknown:
        print("  off-lexicon:", ", ".join(f"{w}→{l}" for w, l in unknown))
    if flags:
        print("  STAGE FLAGS:", ", ".join(f"{w}[{n_}]" for w, n_ in flags))
    return {"label": label, "n": n, "coverage": cov,
            "unknown": unknown, "flags": flags}


if __name__ == "__main__":
    import glob
    res = []
    for path in sorted(glob.glob(sys.argv[1] if len(sys.argv) > 1 else "texts/*.txt")):
        res.append(analyse(open(path, encoding="utf-8").read(), path.split("/")[-1]))
    json.dump(res, open("results.json", "w"), ensure_ascii=False, indent=1)
