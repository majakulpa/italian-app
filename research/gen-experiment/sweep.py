"""How big does the lexicon have to be before *naturally written* Italian
clears Nation's 95% threshold without the author working around gaps?"""
import json, glob, importlib
import check_text as C

sizes = [400, 600, 1000, 1500, 2000, 3000]
files = sorted(glob.glob("texts/A_naive_*.txt")) + sorted(glob.glob("texts/B_constr_*.txt"))
print(f"{'lexicon':>8} | " + " | ".join(f"{f.split('/')[-1][:13]:>13}" for f in files) + " |  naive mean")
print("-" * 104)
for n in sizes:
    C.LEX = set(json.load(open(f"lexicon_{n}.json")))
    cov = []
    for f in files:
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            r = C.analyse(open(f, encoding="utf-8").read(), f)
        cov.append(r["coverage"])
    naive_mean = sum(cov[:3]) / 3
    mark = "  <-- clears 95%" if naive_mean >= 95 else ""
    print(f"{n:>8} | " + " | ".join(f"{c:>12.1f}%" for c in cov) + f" | {naive_mean:>10.1f}%{mark}")
