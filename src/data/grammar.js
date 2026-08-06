import { LEVEL_ACCENTS } from "../shared/theme.js";

// Grammar topics: explanations paired with drills, organized by level like
// vocabulary is. To add a topic: add an object with { id, name, tagline,
// explanation, drills } to a level's `topics`. explanation.table is
// optional ({ headers: [...], rows: [[...], ...] }); explanation.examples
// are optional [{ it, en }] example sentences.
export const GRAMMAR_LEVELS = [
  {
    id: "A1",
    label: "A1",
    name: "Principiante",
    tagline: "Verb basics: -are verbs, essere & avere",
    ...LEVEL_ACCENTS.A1,
    topics: [
      {
        id: "present-are",
        name: "Presente: verbi in -ARE",
        tagline: "The present tense of regular -are verbs",
        explanation: {
          summary:
            "Most Italian verbs end in -are, -ere, or -ire. The -are group is the largest — drop the -are ending and add these endings to the stem.",
          table: {
            headers: ["", "parlare"],
            rows: [
              ["io", "parlo"],
              ["tu", "parli"],
              ["lui / lei", "parla"],
              ["noi", "parliamo"],
              ["voi", "parlate"],
              ["loro", "parlano"],
            ],
          },
          points: [
            "Endings: -o, -i, -a, -iamo, -ate, -ano",
            "Other common -are verbs: abitare (to live), lavorare (to work), studiare (to study), guardare (to watch)",
          ],
          examples: [
            { it: "Io parlo italiano.", en: "I speak Italian." },
            { it: "Lei lavora a Roma.", en: "She works in Rome." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io ___ italiano ogni giorno.", hint: "parlare — io", options: ["parlo", "parli", "parla", "parlano"], answer: "parlo" },
          { id: "2", prompt: "Tu ___ a Milano?", hint: "abitare — tu", options: ["abito", "abiti", "abita", "abitiamo"], answer: "abiti" },
          { id: "3", prompt: "Lei ___ in un ufficio.", hint: "lavorare — lei", options: ["lavoro", "lavori", "lavora", "lavorano"], answer: "lavora" },
          { id: "4", prompt: "Noi ___ italiano insieme.", hint: "studiare — noi", options: ["studio", "studi", "studia", "studiamo"], answer: "studiamo" },
          { id: "5", prompt: "Voi ___ la televisione.", hint: "guardare — voi", options: ["guardo", "guardi", "guardate", "guardano"], answer: "guardate" },
          { id: "6", prompt: "Loro ___ a Napoli.", hint: "abitare — loro", options: ["abito", "abiti", "abita", "abitano"], answer: "abitano" },
          { id: "7", prompt: "Marco ___ molto bene l'inglese.", hint: "parlare — lui", options: ["parlo", "parli", "parla", "parliamo"], answer: "parla" },
          { id: "8", prompt: "Io e Anna ___ in biblioteca.", hint: "studiare — noi", options: ["studio", "studi", "studiate", "studiamo"], answer: "studiamo" },
        ],
      },
      {
        id: "essere-avere",
        name: "Essere e avere",
        tagline: "To be and to have — irregular but essential",
        explanation: {
          summary:
            "Essere (to be) and avere (to have) are irregular, but you'll use them constantly — including later to build the passato prossimo.",
          table: {
            headers: ["", "essere", "avere"],
            rows: [
              ["io", "sono", "ho"],
              ["tu", "sei", "hai"],
              ["lui / lei", "è", "ha"],
              ["noi", "siamo", "abbiamo"],
              ["voi", "siete", "avete"],
              ["loro", "sono", "hanno"],
            ],
          },
          points: [
            "avere is also used for age: Ho 30 anni — literally \"I have 30 years\"",
            "essere is used for professions, nationality, and traits: Sono italiana.",
          ],
          examples: [
            { it: "Io sono stanco.", en: "I am tired." },
            { it: "Noi abbiamo due figli.", en: "We have two children." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io ___ studente.", hint: "essere — io", options: ["sono", "sei", "è", "siamo"], answer: "sono" },
          { id: "2", prompt: "Tu ___ 25 anni.", hint: "avere — tu", options: ["ho", "hai", "ha", "abbiamo"], answer: "hai" },
          { id: "3", prompt: "Lei ___ italiana.", hint: "essere — lei", options: ["sono", "sei", "è", "siamo"], answer: "è" },
          { id: "4", prompt: "Noi ___ molto stanchi.", hint: "essere — noi", options: ["sono", "siete", "siamo", "è"], answer: "siamo" },
          { id: "5", prompt: "Voi ___ fame?", hint: "avere — voi", options: ["ho", "hai", "avete", "hanno"], answer: "avete" },
          { id: "6", prompt: "Loro ___ due macchine.", hint: "avere — loro", options: ["ho", "ha", "abbiamo", "hanno"], answer: "hanno" },
          { id: "7", prompt: "Marco e Luca ___ fratelli.", hint: "essere — loro", options: ["sono", "è", "siamo", "siete"], answer: "sono" },
          { id: "8", prompt: "Io ___ un fratello e una sorella.", hint: "avere — io", options: ["ho", "hai", "ha", "abbiamo"], answer: "ho" },
        ],
      },
    ],
  },
  {
    id: "A2",
    label: "A2",
    name: "Elementare",
    tagline: "-ere/-ire verbs and articles",
    ...LEVEL_ACCENTS.A2,
    topics: [
      {
        id: "present-ere-ire",
        name: "Presente: verbi in -ERE e -IRE",
        tagline: "The present tense of -ere and -ire verbs",
        explanation: {
          summary:
            "-ere and -ire verbs follow similar patterns to -are verbs but with different endings. Some -ire verbs (like capire) add -isc- before the ending in most forms.",
          table: {
            headers: ["", "scrivere", "dormire", "capire"],
            rows: [
              ["io", "scrivo", "dormo", "capisco"],
              ["tu", "scrivi", "dormi", "capisci"],
              ["lui / lei", "scrive", "dorme", "capisce"],
              ["noi", "scriviamo", "dormiamo", "capiamo"],
              ["voi", "scrivete", "dormite", "capite"],
              ["loro", "scrivono", "dormono", "capiscono"],
            ],
          },
          points: [
            "-ere endings: -o, -i, -e, -iamo, -ete, -ono",
            "-ire endings: -o, -i, -e, -iamo, -ite, -ono (like dormire), or with -isc-: -isco, -isci, -isce, -iamo, -ite, -iscono (like capire)",
            "Common -isc- verbs: capire, preferire, finire, pulire",
          ],
          examples: [
            { it: "Non capisco questa parola.", en: "I don't understand this word." },
            { it: "Lei scrive un'email.", en: "She writes an email." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io ___ un libro ogni mese.", hint: "leggere — io", options: ["leggo", "leggi", "legge", "leggiamo"], answer: "leggo" },
          { id: "2", prompt: "Tu ___ presto la sera?", hint: "dormire — tu", options: ["dormo", "dormi", "dorme", "dormite"], answer: "dormi" },
          { id: "3", prompt: "Lui non ___ l'italiano molto bene.", hint: "capire — lui", options: ["capisco", "capisci", "capisce", "capiamo"], answer: "capisce" },
          { id: "4", prompt: "Noi ___ una lettera ai nonni.", hint: "scrivere — noi", options: ["scrivo", "scrivi", "scriviamo", "scrivono"], answer: "scriviamo" },
          { id: "5", prompt: "Voi ___ il lavoro alle sei.", hint: "finire — voi", options: ["finisco", "finisci", "finite", "finiscono"], answer: "finite" },
          { id: "6", prompt: "Loro ___ la casa ogni sabato.", hint: "pulire — loro", options: ["pulisco", "pulisci", "puliamo", "puliscono"], answer: "puliscono" },
          { id: "7", prompt: "Io ___ il tè al caffè.", hint: "preferire — io", options: ["preferisco", "preferisci", "preferisce", "preferiamo"], answer: "preferisco" },
          { id: "8", prompt: "Tu e Marco ___ bene la lezione?", hint: "capire — voi", options: ["capisco", "capite", "capiscono", "capiamo"], answer: "capite" },
        ],
      },
      {
        id: "articles",
        name: "Articoli",
        tagline: "Definite and indefinite articles",
        explanation: {
          summary:
            "Italian nouns have gender (masculine/feminine) and number, and the article must match. Definite articles mean \"the\"; indefinite articles mean \"a/an\".",
          table: {
            headers: ["", "singolare", "plurale"],
            rows: [
              ["masch. + consonante", "il libro", "i libri"],
              ["masch. + s+cons./z/gn", "lo studente", "gli studenti"],
              ["masch. + vocale", "l'amico", "gli amici"],
              ["femm. + consonante", "la casa", "le case"],
              ["femm. + vocale", "l'amica", "le amiche"],
            ],
          },
          points: [
            "Indefinite: un libro, uno studente, una casa, un'amica",
            "The article agrees with the noun's gender and number, not its meaning",
          ],
          examples: [
            { it: "Lo zaino è sul tavolo.", en: "The backpack is on the table." },
            { it: "Le case sono grandi.", en: "The houses are big." },
          ],
        },
        drills: [
          { id: "1", prompt: "___ libro è interessante.", hint: "the (masc. + consonant)", options: ["il", "lo", "la", "l'"], answer: "il" },
          { id: "2", prompt: "___ studente studia molto.", hint: "the (masc. + s+consonant)", options: ["il", "lo", "la", "i"], answer: "lo" },
          { id: "3", prompt: "___ amica di Marco è simpatica.", hint: "the (fem. + vowel)", options: ["la", "il", "lo", "l'"], answer: "l'" },
          { id: "4", prompt: "___ case in centro sono care.", hint: "the (fem. plural)", options: ["il", "la", "le", "i"], answer: "le" },
          { id: "5", prompt: "___ zaini sono nuovi.", hint: "the (masc. + vowel, plural)", options: ["il", "gli", "i", "le"], answer: "gli" },
          { id: "6", prompt: "Ho ___ amico a Roma.", hint: "a (masc. + vowel)", options: ["un", "uno", "una", "un'"], answer: "un" },
          { id: "7", prompt: "Lei ha ___ zia in Francia.", hint: "a (fem. + consonant)", options: ["un", "uno", "una", "un'"], answer: "una" },
          { id: "8", prompt: "Cerco ___ studente per il progetto.", hint: "a (masc. + s+consonant)", options: ["un", "uno", "una", "un'"], answer: "uno" },
        ],
      },
    ],
  },
  {
    id: "B1",
    label: "B1",
    name: "Intermedio",
    tagline: "Past tense and comparisons",
    ...LEVEL_ACCENTS.B1,
    topics: [
      {
        id: "passato-prossimo",
        name: "Passato prossimo",
        tagline: "Talking about completed past actions",
        explanation: {
          summary:
            "The passato prossimo describes completed past actions. It's formed with essere or avere in the present tense, plus a past participle. Most verbs use avere; verbs of movement or state (and all reflexive verbs) use essere — and with essere, the participle agrees with the subject in gender and number.",
          table: {
            headers: ["", "parlare (avere)", "andare (essere)"],
            rows: [
              ["io", "ho parlato", "sono andato/a"],
              ["tu", "hai parlato", "sei andato/a"],
              ["lui / lei", "ha parlato", "è andato/a"],
              ["noi", "abbiamo parlato", "siamo andati/e"],
              ["voi", "avete parlato", "siete andati/e"],
              ["loro", "hanno parlato", "sono andati/e"],
            ],
          },
          points: [
            "Regular participles: -are → -ato, -ere → -uto, -ire → -ito",
            "Common irregular participles: fatto (fare), detto (dire), visto (vedere), preso (prendere)",
            "With essere, the participle ending changes for gender/number: andato, andata, andati, andate",
          ],
          examples: [
            { it: "Ho mangiato una pizza ieri.", en: "I ate a pizza yesterday." },
            { it: "Siamo andati al mare.", en: "We went to the beach." },
          ],
        },
        drills: [
          { id: "1", prompt: "Ieri io ___ la pasta.", hint: "mangiare — io", options: ["ho mangiato", "sono mangiato", "ha mangiato", "hai mangiato"], answer: "ho mangiato" },
          { id: "2", prompt: "Tu ___ al cinema ieri sera?", hint: "andare — tu", options: ["hai andato", "sei andato", "ha andato", "sono andato"], answer: "sei andato" },
          { id: "3", prompt: "Lei ___ i compiti.", hint: "fare — lei", options: ["ha fatto", "è fatto", "ho fatto", "ha fare"], answer: "ha fatto" },
          { id: "4", prompt: "Noi ___ tardi.", hint: "arrivare — noi", options: ["abbiamo arrivato", "siamo arrivati", "siamo arrivato", "abbiamo arrivati"], answer: "siamo arrivati" },
          { id: "5", prompt: "Voi ___ quel film?", hint: "vedere — voi", options: ["avete visto", "siete visti", "avete vede", "ha visto"], answer: "avete visto" },
          { id: "6", prompt: "Loro ___ il treno.", hint: "prendere — loro", options: ["hanno preso", "sono presi", "hanno prendere", "hanno prenduto"], answer: "hanno preso" },
          { id: "7", prompt: "Marco ___ la verità.", hint: "dire — lui", options: ["ha detto", "è detto", "ha dire", "ha dicuto"], answer: "ha detto" },
          { id: "8", prompt: "Io e Sara ___ alle otto.", hint: "partire — noi", options: ["abbiamo partito", "siamo partiti", "siamo partito", "abbiamo partiti"], answer: "siamo partiti" },
        ],
      },
      {
        id: "comparatives",
        name: "Comparativi",
        tagline: "Comparing people and things",
        explanation: {
          summary:
            "Compare two things with più... di (more... than) or meno... di (less... than). Use che instead of di when comparing two adjectives, verbs, or nouns of the same type. Use come or quanto to express equality (as... as).",
          points: [
            "più/meno + adjective + di + noun/pronoun: Marco è più alto di Luca.",
            "Use che when comparing two qualities of the same thing: È più simpatico che intelligente.",
            "come or quanto express equality: Lei è alta come sua sorella.",
          ],
          examples: [
            { it: "Roma è più grande di Firenze.", en: "Rome is bigger than Florence." },
            { it: "Lui è simpatico come suo padre.", en: "He is as nice as his father." },
          ],
        },
        drills: [
          { id: "1", prompt: "Roma è più grande ___ Firenze.", hint: "more... than (two nouns)", options: ["di", "che", "come", "quanto"], answer: "di" },
          { id: "2", prompt: "Lei è più simpatica ___ intelligente.", hint: "more... than (two qualities)", options: ["di", "che", "come", "quanto"], answer: "che" },
          { id: "3", prompt: "Lui è alto ___ suo fratello.", hint: "as tall as", options: ["come", "che", "di", "più"], answer: "come" },
          { id: "4", prompt: "Marco corre ___ velocemente di Luca.", hint: "more quickly than", options: ["più", "come", "che", "quanto"], answer: "più" },
          { id: "5", prompt: "Questa borsa costa ___ di quella.", hint: "less than", options: ["meno", "più", "come", "che"], answer: "meno" },
          { id: "6", prompt: "Studiare è ___ utile che divertente, secondo lui.", hint: "more... than (two qualities)", options: ["più", "che", "di", "come"], answer: "più" },
          { id: "7", prompt: "Anna guadagna ___ suo marito.", hint: "as much as", options: ["quanto", "che", "di", "meno"], answer: "quanto" },
          { id: "8", prompt: "Il treno è ___ veloce dell'autobus.", hint: "more... than (two nouns)", options: ["più", "che", "come", "quanto"], answer: "più" },
        ],
      },
    ],
  },
];
