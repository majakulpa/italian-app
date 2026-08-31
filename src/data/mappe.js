// Le Mappe — suffix correspondences, taught as rules rather than word lists.
//
// A map is one ending that maps predictably from a language the learner
// already has into Italian. `-cja → -zione` is not four words, it is every
// Polish noun in -cja the learner has ever used, which is why a map is worth
// more per minute than any flashcard deck: you learn the ending once and the
// vocabulary arrives behind it.
//
// ── The two roads ───────────────────────────────────────────────────────
// The learner is Polish L1, fluent English L2, beginner Italian, so every map
// has up to two routes into Italian and they are not equally good. Polish
// usually gets there in fewer steps (`lekcja → lezione` beats
// `lesson → lezione`, which is not a suffix rule at all), so the Polish route
// is listed first — except where it honestly isn't shorter. `-ity → -ità` is
// the case where English wins outright, and the card says so rather than
// pretending otherwise; see the note on the `ita` map.
//
// ── Why every map carries a trap ────────────────────────────────────────
// A correspondence that reliably produces the right *shape* has no opinion
// about the *meaning*, so a map that unlocks a thousand words also hands you
// a handful of confident mistakes. `colazione` is a perfectly formed -zione
// noun that means breakfast, and the Polish `kolacja` it came from is supper.
// Those are the direct cost of the strategy, so they are taught in the same
// breath as the rule and not filed away on some later screen.
//
// ── Shape of an entry ───────────────────────────────────────────────────
//   rule.to     the Italian ending every non-trap example lands on
//   routes[]    one per source language: `from` are the source endings,
//               `pairs` the worked examples. A Polish pair carries `en` too,
//               since the learner can't read the meaning off the Polish word
//               and the English word alone.
//   notes[]     what the ending brings with it — gender, plural, stress, and
//               the honest exceptions. Written out rather than left implicit:
//               "-zione is feminine" is worth more than another six pairs.
//   traps[]     a real Italian word this map produces, whose lookalike in
//               Polish or English means something else.
//   drills[]    production items. `extras` are sub-patterns the drill answer
//               needs that the map itself never taught — Latin's ct → tt, a
//               doubled consonant — so a correct answer can name them back.
//               A drill with a `trap` is one where the map's own output is
//               wrong: it is what the design means by "three where the map
//               tricks you", and `mappe.test.js` requires its answer to sit
//               *outside* the rule.
//
// Accuracy over length. Four maps that are right in both languages beat ten
// with a Polish typo or an Italian gender in them, and a Polish speaker spots
// the typo instantly. `polizia` is the worked example of that discipline: the
// design's own card lists `policja → polizia` under `-cja → -zione`, and
// `polizia` does not end in -zione. It is named as an exception below rather
// than being quietly counted as a fifth example.

export const MAPS = [
  {
    id: "zione",
    name: "-zione",
    accent: "grape",
    rule: { to: "-zione" },
    reach: "Around a thousand Italian nouns end this way. You already know almost all of them, in two other languages.",
    routes: [
      {
        lang: "pl",
        heading: "The short road",
        from: ["-cja"],
        pairs: [
          { src: "lekcja", it: "lezione", en: "lesson" },
          { src: "stacja", it: "stazione", en: "station" },
          { src: "akcja", it: "azione", en: "action" },
          { src: "tradycja", it: "tradizione", en: "tradition" },
          { src: "informacja", it: "informazione", en: "information" },
          { src: "emocja", it: "emozione", en: "emotion" },
        ],
      },
      {
        lang: "en",
        heading: "The other road",
        from: ["-tion"],
        pairs: [
          { src: "nation", it: "nazione" },
          { src: "position", it: "posizione" },
          { src: "condition", it: "condizione" },
        ],
      },
    ],
    notes: [
      "Every one of them is feminine, with no exceptions worth the words: la lezione, una stazione, le informazioni.",
      "Not every -cja stops at -zione. Polish policja is la polizia, and that one really is a one-off — take it and move on.",
    ],
    traps: [
      {
        it: "colazione",
        means: "breakfast",
        lookalike: "kolacja",
        lookalikeLang: "pl",
        lookalikeMeans: "supper, the evening meal",
        note: "The map works and the meaning slid: the two ends of the day. Supper is la cena.",
      },
    ],
    drills: [
      {
        id: "rivoluzione",
        src: "rewolucja",
        srcLang: "pl",
        it: "rivoluzione",
        en: "revolution",
        extras: [{ from: "rewo-", to: "rivo-", note: "Italian writes that first vowel as an i — rivedere, rivolgere, rivoluzione." }],
      },
      { id: "funzione", src: "funkcja", srcLang: "pl", it: "funzione", en: "function", extras: [] },
      { id: "porzione", src: "porcja", srcLang: "pl", it: "porzione", en: "portion", extras: [] },
      { id: "operazione", src: "operacja", srcLang: "pl", it: "operazione", en: "operation", extras: [] },
      { id: "attenzione", src: "attention", srcLang: "en", it: "attenzione", extras: [] },
      {
        id: "cena",
        src: "kolacja",
        srcLang: "pl",
        it: "cena",
        en: "supper, dinner",
        extras: [],
        trap: {
          instead: "colazione",
          means: "breakfast",
          why: "Supper is la cena — and cena is not the Polish cena either, which would be il prezzo.",
        },
      },
    ],
  },

  {
    id: "ita",
    name: "-ità",
    accent: "azzurro",
    rule: { to: "-ità" },
    reach: "Several hundred abstract nouns, and the ending is still open for business — anything new arriving in English as -ity arrives in Italian as -ità.",
    // The one map where English is the shorter road, so it is listed first.
    // Polish -ość is a native suffix bolted onto whatever stem is to hand: it
    // reaches Italian only when that stem is Latin as well (aktywny → attivo),
    // and it strands you when it isn't (możliwy is not possibile). English
    // -ity is Latin all the way down, so it never strands you.
    routes: [
      {
        lang: "en",
        heading: "The short road, for once",
        from: ["-ity"],
        pairs: [
          { src: "quality", it: "qualità" },
          { src: "quantity", it: "quantità" },
          { src: "university", it: "università" },
          { src: "curiosity", it: "curiosità" },
          { src: "necessity", it: "necessità" },
          { src: "identity", it: "identità" },
        ],
      },
      {
        lang: "pl",
        heading: "The Polish road, where the stem is Latin too",
        from: ["-ość"],
        pairs: [
          { src: "stabilność", it: "stabilità", en: "stability" },
          { src: "mobilność", it: "mobilità", en: "mobility" },
          { src: "elastyczność", it: "elasticità", en: "elasticity" },
          { src: "intensywność", it: "intensità", en: "intensity" },
        ],
      },
    ],
    notes: [
      "Feminine, and the plural is the same word: la qualità, le qualità. The accent does that — nothing can be added after it.",
      "The stress is on that final à, every time. Polish stress sits one syllable earlier and never moves, so ja-KOŚĆ against qua-li-TÀ is the accent this map cannot fix for you.",
      "-ość only crosses when the Polish adjective is Latin too: aktywny → attivo → attività works, możliwy does not — that one goes through possibile to possibilità.",
      "Four very common ones lost the i on the way and end in a bare -tà: città, società, realtà, libertà.",
    ],
    traps: [
      {
        it: "l'attualità",
        means: "current affairs — what is going on right now",
        lookalike: "actuality",
        lookalikeLang: "en",
        lookalikeMeans: "the state of being real",
        note: "Here the Polish road is the safe one: aktualność means exactly what attualità means, and English is the language that misleads.",
      },
    ],
    drills: [
      { id: "possibilita", src: "possibility", srcLang: "en", it: "possibilità", extras: [] },
      { id: "originalita", src: "oryginalność", srcLang: "pl", it: "originalità", en: "originality", extras: [] },
      {
        id: "attivita",
        src: "aktywność",
        srcLang: "pl",
        it: "attività",
        en: "activity",
        extras: [{ from: "kt", to: "tt", note: "Latin's ct flattens to tt in Italian — otto, notte, dottore, attività." }],
      },
      {
        id: "popolarita",
        src: "popularność",
        srcLang: "pl",
        it: "popolarità",
        en: "popularity",
        extras: [{ from: "popul-", to: "popol-", note: "Italian writes that u as an o: popolo, popolare, popolarità." }],
      },
      {
        id: "citta",
        src: "city",
        srcLang: "en",
        it: "città",
        extras: [],
        trap: {
          instead: "citità",
          means: "nothing at all",
          why: "This is one of the four that lost the i. City is città, and the map's own answer is not a word.",
        },
      },
    ],
  },

  {
    id: "ico",
    name: "-ico",
    accent: "lemon",
    rule: { to: "-ico" },
    reach: "Several hundred adjectives, and it keeps growing: an -ic word that turns up in English turns up in Italian as -ico.",
    routes: [
      {
        lang: "pl",
        heading: "The short road",
        from: ["-yczny", "-iczny"],
        pairs: [
          { src: "polityczny", it: "politico", en: "political" },
          { src: "fantastyczny", it: "fantastico", en: "fantastic" },
          { src: "automatyczny", it: "automatico", en: "automatic" },
          { src: "klasyczny", it: "classico", en: "classical" },
          { src: "ekonomiczny", it: "economico", en: "economic" },
          { src: "tragiczny", it: "tragico", en: "tragic" },
        ],
      },
      {
        lang: "en",
        heading: "The other road",
        from: ["-ic", "-ical"],
        pairs: [
          { src: "public", it: "pubblico" },
          { src: "magnetic", it: "magnetico" },
          { src: "logical", it: "logico" },
        ],
      },
    ],
    notes: [
      "It is an adjective, so it agrees: un partito politico, una scelta politica, i problemi politici, le idee politiche.",
      "The stress falls three syllables from the end — po-LI-ti-co, STO-ri-co, au-to-MA-ti-co. Polish stresses the second-to-last, so po-li-TY-czny puts it in exactly the wrong place.",
      "-yczny doesn't always land here. muzyczny is musicale, and -ale is the other big adjective family — worth knowing it exists before it catches you.",
    ],
    traps: [
      {
        it: "patetico",
        means: "pitiful, or moving to the point of tears",
        lookalike: "patetyczny",
        lookalikeLang: "pl",
        lookalikeMeans: "pompous, grandiloquent, full of ceremony",
        note: "The map is right about the shape and wrong about the sense. For a Polish patetyczny speech, Italian says solenne or ampolloso.",
      },
      {
        it: "simpatico",
        means: "likeable, good company",
        lookalike: "sympathetic",
        lookalikeLang: "en",
        lookalikeMeans: "compassionate, feeling for someone",
        note: "Polish wins this one outright: sympatyczny is exactly simpatico. Compassionate is comprensivo.",
      },
    ],
    drills: [
      {
        id: "drammatico",
        src: "dramatyczny",
        srcLang: "pl",
        it: "drammatico",
        en: "dramatic",
        extras: [{ from: "m", to: "mm", note: "Italian doubles that m, and the doubling is heard — hold it." }],
      },
      {
        id: "pratico",
        src: "praktyczny",
        srcLang: "pl",
        it: "pratico",
        en: "practical",
        extras: [{ from: "kt", to: "t", note: "The k goes altogether here: pratica, praticare, pratico." }],
      },
      {
        id: "storico",
        src: "historical",
        srcLang: "en",
        it: "storico",
        extras: [{ from: "hi-", to: "s-", note: "Italian has no h sound and drops the whole hi-: storia, storico." }],
      },
      {
        id: "elettrico",
        src: "elektryczny",
        srcLang: "pl",
        it: "elettrico",
        en: "electric",
        extras: [{ from: "kt", to: "tt", note: "Latin's ct flattens to tt again — the same change as in attività." }],
      },
      {
        id: "musicale",
        src: "muzyczny",
        srcLang: "pl",
        it: "musicale",
        en: "musical",
        extras: [],
        trap: {
          instead: "musico",
          means: "a musician, and only in old books",
          why: "This one belongs to the -ale family: educazione musicale, strumento musicale.",
        },
      },
    ],
  },

  {
    id: "ista",
    name: "-ista",
    accent: "bubble",
    rule: { to: "-ista" },
    reach: "A few hundred, and still productive: every -ism that gets invented arrives with its -ista attached.",
    routes: [
      {
        lang: "pl",
        heading: "The short road",
        from: ["-ysta", "-ista"],
        pairs: [
          { src: "artysta", it: "artista", en: "artist" },
          { src: "dentysta", it: "dentista", en: "dentist" },
          { src: "turysta", it: "turista", en: "tourist" },
          { src: "specjalista", it: "specialista", en: "specialist" },
          { src: "pianista", it: "pianista", en: "pianist" },
        ],
      },
      {
        lang: "en",
        heading: "The other road",
        from: ["-ist"],
        pairs: [
          { src: "journalist", it: "giornalista" },
          { src: "communist", it: "comunista" },
          { src: "egoist", it: "egoista" },
        ],
      },
    ],
    notes: [
      "One form covers both genders and the article does the work: il dentista, la dentista. Polish changes the word instead — dentysta, dentystka — so this is Italian asking you for the one thing Polish never does.",
      "The plural splits, though, and then you have to choose: i dentisti, le dentiste.",
      "It travels with -izm → -ismo, which is always masculine: il comunismo and il comunista, l'ottimismo and l'ottimista.",
    ],
    traps: [
      {
        it: "autista",
        means: "a driver — the person at the wheel",
        lookalike: "autysta",
        lookalikeLang: "pl",
        lookalikeMeans: "an autistic person",
        note: "The map lands on a real Italian word with an entirely different job. For the Polish sense Italian says autistico.",
      },
    ],
    drills: [
      {
        id: "ottimista",
        src: "optymista",
        srcLang: "pl",
        it: "ottimista",
        en: "optimist",
        extras: [{ from: "pt", to: "tt", note: "Latin's pt flattens to tt — ottimo, sette, scritto." }],
      },
      {
        id: "pessimista",
        src: "pesymista",
        srcLang: "pl",
        it: "pessimista",
        en: "pessimist",
        extras: [{ from: "s", to: "ss", note: "Doubled, and audibly so: pessimo, pessimista." }],
      },
      { id: "socialista", src: "socialist", srcLang: "en", it: "socialista", extras: [] },
      { id: "violinista", src: "violinist", srcLang: "en", it: "violinista", extras: [] },
      {
        id: "psichiatra",
        src: "psychiatrist",
        srcLang: "en",
        it: "psichiatra",
        extras: [],
        trap: {
          instead: "psichiatrista",
          means: "nothing at all",
          why: "A small family of specialists stops at -a instead: psichiatra, pediatra, atleta. Polish agrees with Italian here — psychiatra, not psychiatrysta.",
        },
      },
    ],
  },
];

// Every language that appears on a Mappe screen, so the module can label a
// route or a trap without a switch statement in the markup. The `lang`
// attribute matters as much as the flag does: a screen reader that doesn't
// know `lekcja` is Polish reads it with Italian phonetics (WCAG 3.1.2).
export const LANG_LABELS = {
  pl: { flag: "🇵🇱", name: "Polish" },
  en: { flag: "🇬🇧", name: "English" },
  it: { flag: "🇮🇹", name: "Italian" },
};
