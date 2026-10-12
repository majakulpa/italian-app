// Il Cinema's generated serial — the episodes that have passed the release gate.
//
// Adding an episode means authoring it against src/data/fondamentale.js, running
// the pipeline in research/gen-experiment/README.md ("Release gate for the
// serial"), committing the report it writes, and then — only then — adding it
// here. If the gate does not pass, the prose gets the repair pass the experiment
// describes; the threshold does not move.
//
// ── The shape ───────────────────────────────────────────────────────────────
// {
//   id:       "ep1"            file-name-safe; names its report
//                              src/data/serial-reports/<id>.json
//   season:   "Stagione 1 · Via Zamboni"
//                              an authored title, not a measured figure
//   title:    "La chiave"
//   pages:    [["paragraph", "paragraph"], ["paragraph"], …]
//                              pages for the reading screen; a page is a list of
//                              paragraphs. Page boundaries leave no mark on the
//                              measured text — shared/serialGate.js's
//                              canonicalText() flattens them to one paragraph
//                              per line, which is the shape the checker read.
//   newWords: [{ it: "la chiave", en: "key", pl: "klucz" }, …]
//                              the deliberate new words. Every off-lexicon lemma
//                              the checker found must be in here (gate arm 3),
//                              and there is a cap (arm 4). `it` carries the
//                              article when the noun is opaque, exactly as
//                              fondamentale.js stores one — the gate normalises
//                              with shared/lemma.js.
// }
//
// What is deliberately absent: any reading-time estimate. "7 min" is not
// measurable and is refused the same way the scene brief's "circa 12 minuti"
// was; the word count is measurable and comes off the committed report.
//
// ── Episode 1, as measured ──────────────────────────────────────────────────
// 503 content words, 98.4% lexicon-only coverage against the real 600, zero
// stage flags, three off-lexicon lemmas — all declared, against a cap of 15.
// The figures are not retyped judgements: they come off
// src/data/serial-reports/ep1.json, which research/gen-experiment/
// report_episode.py wrote and `npm test` holds this text to byte for byte.
//
// Six lemmas came back off-lexicon on the first pass, at 97.8%. Four were
// written out of the prose rather than declared, because declaring them would
// have lied to the reader:
//   `sedere` and `alzare`, from "si siede" and "si alza", are off-lexicon only
//     because fondamentale.js stores the reflexives `sedersi` and `alzarsi`
//     while the checker matches single tokens — both words are in the 600;
//   `rotta` was spaCy mislemmatising the participle "rotte" as the noun
//     *rotta*, "route";
//   `fine` is genuinely absent, and "venti minuti prima della fine" was worth
//     losing: "sempre venti minuti troppo presto" says the same thing better.
// A declaration is a promise that a word is new, so it must not be spent on a
// tooling artefact — and it must not be spent where a rewrite reads better.
//
// The three that are declared — `la sala`, `la luce`, `il buio` — are genuinely
// absent from the first 600 and genuinely needed by a story set in a cinema.
// `il buio` replaced "nel nero", which was a calque: Italian darkness is *buio*
// or *scuro*, and `nero` is the colour. The word being missing from the lexicon
// is a reason to declare it or rephrase, never a reason to write the wrong one.
export const EPISODES = [
  {
    id: "ep1",
    season: "Stagione 1 · Via Zamboni",
    title: "L'uomo del martedì",
    pages: [
      [
        "Il cinema di via Zamboni è piccolo, vecchio e quasi sempre vuoto. La porta è verde. Dentro, la sala ha sei sedie strette, un pavimento nero e un muro bianco dove passa il film.",
        "Nina vende i biglietti. Lavora qui da due anni, la sera, dopo l'università. Elio porta il film nella stanza piccola sopra la sala e lo passa. Nina fa il conto dei soldi, pulisce il pavimento e chiude la porta quando è tardi.",
        "Il lavoro non è bello e non è brutto. È un lavoro. La madre di Nina dice sempre che una ragazza di venti anni deve dormire la notte, non guardare film vecchi con la gente sola della città. Nina risponde che paga la camera e i libri, e che la notte le piace.",
        "Il martedì, però, non è come gli altri giorni. Il martedì viene l'uomo.",
      ],
      [
        "Arriva sempre alla stessa ora, le nove meno dieci. Dice buona sera, paga il biglietto con i soldi giusti e non aspetta il resto. Non compra niente da bere. Non chiede mai niente del film.",
        "Entra e prende sempre lo stesso posto, l'ultima sedia vicino alla porta. Poi guarda. Poi, sempre venti minuti troppo presto, apre la porta e va via.",
        "Sempre. Ogni martedì, per sette mesi.",
        "È un uomo di cinquanta anni, forse sessanta. Porta un cappello grigio e una giacca troppo grande. Ha le mani di chi lavora con le mani. Non è ricco e non è povero. È una persona che nessuno guarda due volte.",
        "Nina ha cominciato a tenere il conto dei martedì. Poi ha cominciato a pensare.",
      ],
      [
        "Una sera ha chiesto a Elio: «Quell'uomo, lo conosci?»",
        "Elio ha detto no. Ha detto che la gente viene al cinema per molte cose, e che quasi nessuna di queste cose è il film.",
        "Nina pensa una cosa diversa. Per lei l'uomo non guarda il film. Guarda il muro bianco, la luce che passa sopra le sedie vuote.",
        "Un martedì di marzo Nina ha fatto una cosa nuova. È entrata nella sala con lui. È restata in piedi vicino alla porta, nel buio, e ha guardato non il film ma l'uomo.",
        "L'uomo non guardava il film. Guardava sempre lo stesso posto sul muro bianco, un posto piccolo, basso, dove non c'era niente. E la bocca si muoveva, senza parole, come quando una persona legge.",
        "Nina è uscita prima di lui. Aveva freddo.",
      ],
      [
        "Il martedì dopo, l'uomo non è venuto.",
        "Nina ha aspettato le nove, le nove e mezzo, le dieci. Ha guardato la strada vuota, la pioggia, la luce del bar. Alle undici ha chiuso la porta verde.",
        "Non è venuto il martedì dopo. E non è venuto quello dopo.",
        "Dopo tre settimane Nina è entrata nella sala con una lampada, è andata all'ultima sedia vicino alla porta e ha guardato sotto.",
        "C'era una lettera. Carta vecchia, gialla, senza nome sopra. Dentro, quattro parole: non è un film.",
        "Nina ha letto le quattro parole molte volte. Poi ha messo la lettera dentro la borsa, ha spento la luce e non è andata a casa.",
      ],
    ],
    newWords: [
      { it: "la sala", en: "hall · screening room", pl: "sala" },
      { it: "la luce", en: "light", pl: "światło" },
      { it: "il buio", en: "the dark · darkness", pl: "ciemność" },
    ],
  },
];
