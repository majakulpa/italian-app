import { LEVEL_ACCENTS } from "../shared/theme.js";

// Grammar topics: explanations paired with drills, organized by level like
// vocabulary is. To add a topic: add an object with { id, name, tagline,
// explanation, drills } to a level's `topics`. explanation.table is
// optional ({ headers: [...], rows: [[...], ...] }); explanation.examples
// are optional [{ it, en }] example sentences. Every drill needs an `en`
// translation of its prompt, and a `hint` that spells out the infinitive
// in English ("parlare (to speak) — io") — without those a beginner can't
// tell what they're being asked to complete.
//
// A table header or cell can be a plain string, or { it, en } where the
// English needs spelling out for a beginner — the renderer puts the `en`
// underneath in small type. Subject pronouns are the exception: they repeat
// in every conjugation table, so they stay plain strings and the renderer
// glosses them from PRONOUN_GLOSS below rather than the data repeating
// itself five times.

// The `lei` = formal "you" sense is deliberately left out: in a conjugation
// table this column is the third person, and the register point belongs in
// a lesson (and in the conversations module), not in a one-line gloss.
export const PRONOUN_GLOSS = {
  io: "I",
  tu: "you",
  "lui / lei": "he / she",
  noi: "we",
  voi: "you (plural)",
  loro: "they",
};
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
            headers: ["", { it: "parlare", en: "to speak" }],
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
          { id: "1", prompt: "Io ___ italiano ogni giorno.", en: "I speak Italian every day.", hint: "parlare (to speak) — io", options: ["parlo", "parli", "parla", "parlano"], answer: "parlo" },
          { id: "2", prompt: "Tu ___ a Milano?", en: "Do you live in Milan?", hint: "abitare (to live) — tu", options: ["abito", "abiti", "abita", "abitiamo"], answer: "abiti" },
          { id: "3", prompt: "Lei ___ in un ufficio.", en: "She works in an office.", hint: "lavorare (to work) — lei", options: ["lavoro", "lavori", "lavora", "lavorano"], answer: "lavora" },
          { id: "4", prompt: "Noi ___ italiano insieme.", en: "We study Italian together.", hint: "studiare (to study) — noi", options: ["studio", "studi", "studia", "studiamo"], answer: "studiamo" },
          { id: "5", prompt: "Voi ___ la televisione.", en: "You (plural) watch television.", hint: "guardare (to watch) — voi", options: ["guardo", "guardi", "guardate", "guardano"], answer: "guardate" },
          { id: "6", prompt: "Loro ___ a Napoli.", en: "They live in Naples.", hint: "abitare (to live) — loro", options: ["abito", "abiti", "abita", "abitano"], answer: "abitano" },
          { id: "7", prompt: "Marco ___ molto bene l'inglese.", en: "Marco speaks English very well.", hint: "parlare (to speak) — lui", options: ["parlo", "parli", "parla", "parliamo"], answer: "parla" },
          { id: "8", prompt: "Io e Anna ___ in biblioteca.", en: "Anna and I study in the library.", hint: "studiare (to study) — noi", options: ["studio", "studi", "studiate", "studiamo"], answer: "studiamo" },
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
            headers: ["", { it: "essere", en: "to be" }, { it: "avere", en: "to have" }],
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
          { id: "1", prompt: "Io ___ studente.", en: "I am a student.", hint: "essere (to be) — io", options: ["sono", "sei", "è", "siamo"], answer: "sono" },
          { id: "2", prompt: "Tu ___ 25 anni.", en: "You are 25 years old — Italian says \"you have 25 years\".", hint: "avere (to have) — tu", options: ["ho", "hai", "ha", "abbiamo"], answer: "hai" },
          { id: "3", prompt: "Lei ___ italiana.", en: "She is Italian.", hint: "essere (to be) — lei", options: ["sono", "sei", "è", "siamo"], answer: "è" },
          { id: "4", prompt: "Noi ___ molto stanchi.", en: "We are very tired.", hint: "essere (to be) — noi", options: ["sono", "siete", "siamo", "è"], answer: "siamo" },
          { id: "5", prompt: "Voi ___ fame?", en: "Are you (plural) hungry? — Italian says \"do you have hunger\".", hint: "avere (to have) — voi", options: ["ho", "hai", "avete", "hanno"], answer: "avete" },
          { id: "6", prompt: "Loro ___ due macchine.", en: "They have two cars.", hint: "avere (to have) — loro", options: ["ho", "ha", "abbiamo", "hanno"], answer: "hanno" },
          { id: "7", prompt: "Marco e Luca ___ fratelli.", en: "Marco and Luca are brothers.", hint: "essere (to be) — loro", options: ["sono", "è", "siamo", "siete"], answer: "sono" },
          { id: "8", prompt: "Io ___ un fratello e una sorella.", en: "I have a brother and a sister.", hint: "avere (to have) — io", options: ["ho", "hai", "ha", "abbiamo"], answer: "ho" },
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
            headers: [
              "",
              { it: "scrivere", en: "to write" },
              { it: "dormire", en: "to sleep" },
              { it: "capire", en: "to understand" },
            ],
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
          { id: "1", prompt: "Io ___ un libro ogni mese.", en: "I read a book every month.", hint: "leggere (to read) — io", options: ["leggo", "leggi", "legge", "leggiamo"], answer: "leggo" },
          { id: "2", prompt: "Tu ___ presto la sera?", en: "Do you go to sleep early in the evening?", hint: "dormire (to sleep) — tu", options: ["dormo", "dormi", "dorme", "dormite"], answer: "dormi" },
          { id: "3", prompt: "Lui non ___ l'italiano molto bene.", en: "He doesn't understand Italian very well.", hint: "capire (to understand) — lui", options: ["capisco", "capisci", "capisce", "capiamo"], answer: "capisce" },
          { id: "4", prompt: "Noi ___ una lettera ai nonni.", en: "We write a letter to our grandparents.", hint: "scrivere (to write) — noi", options: ["scrivo", "scrivi", "scriviamo", "scrivono"], answer: "scriviamo" },
          { id: "5", prompt: "Voi ___ il lavoro alle sei.", en: "You (plural) finish work at six.", hint: "finire (to finish) — voi", options: ["finisco", "finisci", "finite", "finiscono"], answer: "finite" },
          { id: "6", prompt: "Loro ___ la casa ogni sabato.", en: "They clean the house every Saturday.", hint: "pulire (to clean) — loro", options: ["pulisco", "pulisci", "puliamo", "puliscono"], answer: "puliscono" },
          { id: "7", prompt: "Io ___ il tè al caffè.", en: "I prefer tea to coffee.", hint: "preferire (to prefer) — io", options: ["preferisco", "preferisci", "preferisce", "preferiamo"], answer: "preferisco" },
          { id: "8", prompt: "Tu e Marco ___ bene la lezione?", en: "Do you and Marco understand the lesson well?", hint: "capire (to understand) — voi", options: ["capisco", "capite", "capiscono", "capiamo"], answer: "capite" },
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
            headers: ["", { it: "singolare", en: "singular" }, { it: "plurale", en: "plural" }],
            rows: [
              [{ it: "masch. + consonante", en: "masc. + consonant" }, "il libro", "i libri"],
              [{ it: "masch. + s+cons./z/gn", en: "masc. + s+consonant, z, gn" }, "lo studente", "gli studenti"],
              [{ it: "masch. + vocale", en: "masc. + vowel" }, "l'amico", "gli amici"],
              [{ it: "femm. + consonante", en: "fem. + consonant" }, "la casa", "le case"],
              [{ it: "femm. + vocale", en: "fem. + vowel" }, "l'amica", "le amiche"],
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
          { id: "1", prompt: "___ libro è interessante.", en: "The book is interesting.", hint: "the (masc. + consonant)", options: ["il", "lo", "la", "l'"], answer: "il" },
          { id: "2", prompt: "___ studente studia molto.", en: "The student studies a lot.", hint: "the (masc. + s+consonant)", options: ["il", "lo", "la", "i"], answer: "lo" },
          { id: "3", prompt: "___ amica di Marco è simpatica.", en: "Marco's friend is nice.", hint: "the (fem. + vowel)", options: ["la", "il", "lo", "l'"], answer: "l'" },
          { id: "4", prompt: "___ case in centro sono care.", en: "The houses in the centre are expensive.", hint: "the (fem. plural)", options: ["il", "la", "le", "i"], answer: "le" },
          { id: "5", prompt: "___ zaini sono nuovi.", en: "The backpacks are new.", hint: "the (masc. + vowel, plural)", options: ["il", "gli", "i", "le"], answer: "gli" },
          { id: "6", prompt: "Ho ___ amico a Roma.", en: "I have a friend in Rome.", hint: "a (masc. + vowel)", options: ["un", "uno", "una", "un'"], answer: "un" },
          { id: "7", prompt: "Lei ha ___ zia in Francia.", en: "She has an aunt in France.", hint: "a (fem. + consonant)", options: ["un", "uno", "una", "un'"], answer: "una" },
          { id: "8", prompt: "Cerco ___ studente per il progetto.", en: "I'm looking for a student for the project.", hint: "a (masc. + s+consonant)", options: ["un", "uno", "una", "un'"], answer: "uno" },
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
            headers: [
              "",
              { it: "parlare (avere)", en: "to speak" },
              { it: "andare (essere)", en: "to go" },
            ],
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
          { id: "1", prompt: "Ieri io ___ la pasta.", en: "Yesterday I ate the pasta.", hint: "mangiare (to eat) — io", options: ["ho mangiato", "sono mangiato", "ha mangiato", "hai mangiato"], answer: "ho mangiato" },
          { id: "2", prompt: "Tu ___ al cinema ieri sera?", en: "Did you go to the cinema last night?", hint: "andare (to go) — tu", options: ["hai andato", "sei andato", "ha andato", "sono andato"], answer: "sei andato" },
          { id: "3", prompt: "Lei ___ i compiti.", en: "She did her homework.", hint: "fare (to do, to make) — lei", options: ["ha fatto", "è fatto", "ho fatto", "ha fare"], answer: "ha fatto" },
          { id: "4", prompt: "Noi ___ tardi.", en: "We arrived late.", hint: "arrivare (to arrive) — noi", options: ["abbiamo arrivato", "siamo arrivati", "siamo arrivato", "abbiamo arrivati"], answer: "siamo arrivati" },
          { id: "5", prompt: "Voi ___ quel film?", en: "Did you (plural) see that film?", hint: "vedere (to see) — voi", options: ["avete visto", "siete visti", "avete vede", "ha visto"], answer: "avete visto" },
          { id: "6", prompt: "Loro ___ il treno.", en: "They took the train.", hint: "prendere (to take) — loro", options: ["hanno preso", "sono presi", "hanno prendere", "hanno prenduto"], answer: "hanno preso" },
          { id: "7", prompt: "Marco ___ la verità.", en: "Marco told the truth.", hint: "dire (to say, to tell) — lui", options: ["ha detto", "è detto", "ha dire", "ha dicuto"], answer: "ha detto" },
          { id: "8", prompt: "Io e Sara ___ alle otto.", en: "Sara and I left at eight.", hint: "partire (to leave) — noi", options: ["abbiamo partito", "siamo partiti", "siamo partito", "abbiamo partiti"], answer: "siamo partiti" },
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
          { id: "1", prompt: "Roma è più grande ___ Firenze.", en: "Rome is bigger than Florence.", hint: "more... than (two nouns)", options: ["di", "che", "come", "quanto"], answer: "di" },
          { id: "2", prompt: "Lei è più simpatica ___ intelligente.", en: "She is more likeable than intelligent.", hint: "more... than (two qualities)", options: ["di", "che", "come", "quanto"], answer: "che" },
          { id: "3", prompt: "Lui è alto ___ suo fratello.", en: "He is as tall as his brother.", hint: "as tall as", options: ["come", "che", "di", "più"], answer: "come" },
          { id: "4", prompt: "Marco corre ___ velocemente di Luca.", en: "Marco runs more quickly than Luca.", hint: "more quickly than", options: ["più", "come", "che", "quanto"], answer: "più" },
          { id: "5", prompt: "Questa borsa costa ___ di quella.", en: "This bag costs less than that one.", hint: "less than", options: ["meno", "più", "come", "che"], answer: "meno" },
          { id: "6", prompt: "Studiare è ___ utile che divertente, secondo lui.", en: "Studying is more useful than fun, in his opinion.", hint: "more... than (two qualities)", options: ["più", "che", "di", "come"], answer: "più" },
          { id: "7", prompt: "Anna guadagna ___ suo marito.", en: "Anna earns as much as her husband.", hint: "as much as", options: ["quanto", "che", "di", "meno"], answer: "quanto" },
          { id: "8", prompt: "Il treno è ___ veloce dell'autobus.", en: "The train is faster than the bus.", hint: "more... than (two nouns)", options: ["più", "che", "come", "quanto"], answer: "più" },
        ],
      },
    ],
  },
  {
    id: "B2",
    label: "B2",
    name: "Superiore",
    tagline: "Congiuntivo and condizionale",
    ...LEVEL_ACCENTS.B2,
    topics: [
      {
        id: "congiuntivo-presente",
        name: "Congiuntivo presente",
        tagline: "The mood of doubt, opinion and wishes",
        explanation: {
          summary:
            "The congiuntivo is used in a subordinate clause after expressions of opinion, doubt, emotion or will — anything that isn't presented as plain fact. Verbs of certainty (so che, è vero che, è sicuro che) keep the indicative instead.",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "essere", en: "to be" },
              { it: "avere", en: "to have" },
            ],
            rows: [
              ["io", "parli", "sia", "abbia"],
              ["tu", "parli", "sia", "abbia"],
              ["lui / lei", "parli", "sia", "abbia"],
              ["noi", "parliamo", "siamo", "abbiamo"],
              ["voi", "parliate", "siate", "abbiate"],
              ["loro", "parlino", "siano", "abbiano"],
            ],
          },
          points: [
            "Endings: -are → -i, -i, -i, -iamo, -iate, -ino; -ere/-ire → -a, -a, -a, -iamo, -iate, -ano",
            "The first three persons are identical, so the subject pronoun usually stays: penso che tu abbia ragione",
            "Triggers: penso/credo che, spero che, voglio che, è importante che, benché/sebbene, prima che, nonostante",
            "Irregular: faccia (fare), vada (andare), possa (potere), sappia (sapere), dica (dire), venga (venire)",
            "No congiuntivo after certainty: so che è a Roma, not so che sia a Roma",
          ],
          examples: [
            { it: "Penso che sia troppo tardi per chiamare.", en: "I think it's too late to call." },
            { it: "Benché faccia freddo, usciamo.", en: "Even though it's cold, we're going out." },
          ],
        },
        drills: [
          { id: "1", prompt: "Penso che Marco ___ ragione.", en: "I think Marco is right — Italian says \"has reason\".", hint: "avere (to have) — congiuntivo, lui", options: ["abbia", "ha", "avrà", "abbiamo"], answer: "abbia" },
          { id: "2", prompt: "Credo che tu ___ molto stanco.", en: "I think you're very tired.", hint: "essere (to be) — congiuntivo, tu", options: ["sia", "sei", "sarai", "siate"], answer: "sia" },
          { id: "3", prompt: "È importante che voi ___ in orario.", en: "It's important that you (plural) arrive on time.", hint: "arrivare (to arrive) — congiuntivo, voi", options: ["arriviate", "arrivate", "arrivano", "arriverete"], answer: "arriviate" },
          { id: "4", prompt: "Benché ___ freddo, andiamo al mare.", en: "Even though it's cold, we're going to the seaside.", hint: "fare (to do, to make) — congiuntivo, lui (impersonal \"it\")", options: ["faccia", "fa", "farà", "facciamo"], answer: "faccia" },
          { id: "5", prompt: "Voglio che loro ___ la verità.", en: "I want them to tell the truth.", hint: "dire (to say, to tell) — congiuntivo, loro", options: ["dicano", "dicono", "diranno", "dica"], answer: "dicano" },
          { id: "6", prompt: "Spero che loro ___ il lavoro entro venerdì.", en: "I hope they finish the work by Friday.", hint: "finire (to finish) — congiuntivo, loro", options: ["finiscano", "finiscono", "finiranno", "finiamo"], answer: "finiscano" },
          { id: "7", prompt: "Sebbene lei ___ molto, non è mai soddisfatta.", en: "Although she studies a lot, she's never satisfied.", hint: "studiare (to study) — congiuntivo, lei", options: ["studi", "studia", "studino", "studierà"], answer: "studi" },
          { id: "8", prompt: "So che lui ___ a Roma da tre anni.", en: "I know he has lived in Rome for three years.", hint: "abitare (to live) — after «so che» you stay in the indicative, lui", options: ["abita", "abiti", "abitino", "abitasse"], answer: "abita" },
        ],
      },
      {
        id: "condizionale",
        name: "Condizionale",
        tagline: "Would: politeness, hypotheses and unconfirmed news",
        explanation: {
          summary:
            "The condizionale is Italian's \"would\". It softens requests, states what you would do, and — in the press — reports something not yet confirmed. Built on the same stem as the future, with its own endings.",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "essere", en: "to be" },
              { it: "avere", en: "to have" },
            ],
            rows: [
              ["io", "parlerei", "sarei", "avrei"],
              ["tu", "parleresti", "saresti", "avresti"],
              ["lui / lei", "parlerebbe", "sarebbe", "avrebbe"],
              ["noi", "parleremmo", "saremmo", "avremmo"],
              ["voi", "parlereste", "sareste", "avreste"],
              ["loro", "parlerebbero", "sarebbero", "avrebbero"],
            ],
          },
          points: [
            "Endings on the future stem: -ei, -esti, -ebbe, -emmo, -este, -ebbero",
            "Irregular stems, shared with the future: andr- (andare), far- (fare), verr- (venire), vorr- (volere), potr- (potere), dovr- (dovere)",
            "Politeness: Vorrei un caffè. Potrebbe aiutarmi? — much softer than voglio / può",
            "Watch the pair verremo (future: we will come) vs verremmo (conditional: we would come) — one letter apart",
            "Condizionale passato = sarei/avrei + participle, for \"would have\": Avrei voluto venire.",
          ],
          examples: [
            { it: "Al posto tuo, non lo farei.", en: "In your place, I wouldn't do it." },
            { it: "Secondo il giornale, il ministro si dimetterebbe oggi.", en: "According to the paper, the minister is (reportedly) resigning today." },
          ],
        },
        drills: [
          { id: "1", prompt: "___ un caffè, per favore.", en: "I'd like a coffee, please.", hint: "volere (to want) — condizionale, io", options: ["Vorrei", "Voglio", "Vorrebbe", "Volevo"], answer: "Vorrei" },
          { id: "2", prompt: "Signora, ___ chiudere la finestra, per favore?", en: "Madam, could you close the window, please?", hint: "potere (to be able to) — condizionale, lei (polite form)", options: ["potrebbe", "potresti", "potrei", "potrebbero"], answer: "potrebbe" },
          { id: "3", prompt: "Noi ___ volentieri, ma non abbiamo tempo.", en: "We would gladly come, but we don't have time.", hint: "venire (to come) — condizionale, noi", options: ["verremmo", "verremo", "veniamo", "verrebbero"], answer: "verremmo" },
          { id: "4", prompt: "Tu che cosa ___ al mio posto?", en: "What would you do in my place?", hint: "fare (to do, to make) — condizionale, tu", options: ["faresti", "fai", "farai", "farebbe"], answer: "faresti" },
          { id: "5", prompt: "Loro ___ più tardi, se potessero.", en: "They would arrive later, if they could.", hint: "arrivare (to arrive) — condizionale, loro", options: ["arriverebbero", "arriveranno", "arrivano", "arriverebbe"], answer: "arriverebbero" },
          { id: "6", prompt: "___ venire ieri, ma ho lavorato fino a tardi.", en: "I would have liked to come yesterday, but I worked late.", hint: "volere (to want) — condizionale passato, io", options: ["Avrei voluto", "Vorrei", "Ho voluto", "Sarei voluto"], answer: "Avrei voluto" },
          { id: "7", prompt: "Lei ___ già a casa, ma il treno è in ritardo.", en: "She would already be home, but the train is late.", hint: "essere (to be) — condizionale, lei", options: ["sarebbe", "è", "sarà", "sarebbero"], answer: "sarebbe" },
          { id: "8", prompt: "Secondo il giornale, il sindaco ___ domani.", en: "According to the paper, the mayor is (reportedly) speaking tomorrow.", hint: "parlare (to speak) — condizionale for unconfirmed news, lui", options: ["parlerebbe", "parla", "parlerà", "parlerebbero"], answer: "parlerebbe" },
        ],
      },
    ],
  },
  {
    id: "C1",
    label: "C1",
    name: "Avanzato",
    tagline: "Hypotheticals, the passive and impersonal si",
    ...LEVEL_ACCENTS.C1,
    topics: [
      {
        id: "periodo-ipotetico",
        name: "Periodo ipotetico",
        tagline: "If I had time — the three kinds of if-sentence",
        explanation: {
          summary:
            "Italian has three if-patterns: a real one (indicative throughout), a possible or unreal one (congiuntivo imperfetto + condizionale), and an impossible one about the past (congiuntivo trapassato + condizionale passato). The one rule never to break: se is never followed by a condizionale.",
          table: {
            headers: ["", { it: "se…", en: "the if-clause" }, { it: "…allora", en: "the result" }],
            rows: [
              [{ it: "1º — realtà", en: "type 1 — real, likely" }, "se ho tempo", "vengo / verrò"],
              [{ it: "2º — possibilità", en: "type 2 — possible or unreal" }, "se avessi tempo", "verrei"],
              [{ it: "3º — impossibilità", en: "type 3 — impossible, in the past" }, "se avessi avuto tempo", "sarei venuto"],
            ],
          },
          points: [
            "Congiuntivo imperfetto: parlassi, parlassi, parlasse, parlassimo, parlaste, parlassero — and fossi…, avessi…",
            "Congiuntivo trapassato: avessi parlato / fossi andato",
            "Never «se + condizionale» — the condizionale belongs in the result clause only",
            "come se always takes the congiuntivo imperfetto: fa come se niente fosse",
            "Type 2 covers both a real possibility and a pure fantasy — context, not grammar, tells them apart",
          ],
          examples: [
            { it: "Se avessi più tempo, imparerei il russo.", en: "If I had more time, I'd learn Russian." },
            { it: "Se me lo avessi detto, ti avrei aspettato.", en: "If you had told me, I would have waited for you." },
          ],
        },
        drills: [
          { id: "1", prompt: "Se ___ più tempo, imparerei il russo.", en: "If I had more time, I'd learn Russian.", hint: "avere (to have) — congiuntivo imperfetto, io", options: ["avessi", "avrei", "ho", "avrò"], answer: "avessi" },
          { id: "2", prompt: "Se fossi al tuo posto, non ___ quell'offerta.", en: "If I were in your place, I wouldn't accept that offer.", hint: "accettare (to accept) — condizionale, io", options: ["accetterei", "accettassi", "accetto", "accetterò"], answer: "accetterei" },
          { id: "3", prompt: "Se me lo ___, ti avrei aspettato.", en: "If you had told me, I would have waited for you.", hint: "dire (to say, to tell) — congiuntivo trapassato, tu", options: ["avessi detto", "avresti detto", "hai detto", "dicessi"], answer: "avessi detto" },
          { id: "4", prompt: "Se ___ meno, dormirebbe meglio.", en: "If he worked less, he'd sleep better.", hint: "lavorare (to work) — congiuntivo imperfetto, lui", options: ["lavorasse", "lavorerebbe", "lavora", "lavorerà"], answer: "lavorasse" },
          { id: "5", prompt: "Se non ci fosse stato lo sciopero, ___ in orario.", en: "If there hadn't been a strike, we would have arrived on time.", hint: "arrivare (to arrive) — condizionale passato, noi", options: ["saremmo arrivati", "fossimo arrivati", "siamo arrivati", "arriveremmo"], answer: "saremmo arrivati" },
          { id: "6", prompt: "Parla come se ___ tutto.", en: "He talks as if he knew everything.", hint: "sapere (to know) — after «come se»: congiuntivo imperfetto, lui", options: ["sapesse", "sa", "saprebbe", "sapeva"], answer: "sapesse" },
          { id: "7", prompt: "Se voi ___ presto, troverete posto.", en: "If you (plural) arrive early, you'll find a seat.", hint: "arrivare (to arrive) — a real hypothesis takes the indicative, voi", options: ["arrivate", "arrivaste", "arrivereste", "arriviate"], answer: "arrivate" },
          { id: "8", prompt: "Se loro ___ la verità, sarebbero più tranquilli.", en: "If they knew the truth, they'd be calmer.", hint: "sapere (to know) — congiuntivo imperfetto, loro", options: ["sapessero", "saprebbero", "sanno", "sapranno"], answer: "sapessero" },
        ],
      },
      {
        id: "passivo-si",
        name: "Passivo e «si» impersonale",
        tagline: "Saying what was done without saying who did it",
        explanation: {
          summary:
            "The passive puts the object first: essere (or venire) plus a past participle that agrees with the subject, with the agent introduced by da. When there is no agent worth naming, Italian much prefers si — the passivante si with a stated object, the impersonale si without one.",
          table: {
            headers: ["", { it: "attivo", en: "active" }, { it: "passivo", en: "passive" }],
            rows: [
              [{ it: "presente", en: "present" }, "Il critico recensisce il film", "Il film è recensito dal critico"],
              [{ it: "passato", en: "past" }, "Il critico ha recensito il film", "Il film è stato recensito dal critico"],
              [{ it: "con venire", en: "with venire — stresses the action" }, "Recensiscono il film ogni anno", "Il film viene recensito ogni anno"],
              [{ it: "con «si»", en: "with «si» — no agent named" }, "Vendono i biglietti online", "I biglietti si vendono online"],
            ],
          },
          points: [
            "The participle agrees with the subject: la legge è stata approvata, i fondi sono stati approvati",
            "venire replaces essere in simple tenses only, and stresses the action rather than the resulting state",
            "andare + participle means \"must be\": va fatto subito, le domande vanno inviate entro venerdì",
            "The agent takes da: firmato dal direttore",
            "The passivante si agrees with its object: si vende la casa → si vendono le case; in the past the impersonal si takes essere: si è mangiato bene",
          ],
          examples: [
            { it: "La legge è stata approvata ieri sera.", en: "The law was passed last night." },
            { it: "In Italia si cena tardi.", en: "In Italy people have dinner late." },
          ],
        },
        drills: [
          { id: "1", prompt: "Il contratto ___ firmato dal direttore la settimana scorsa.", en: "The contract was signed by the director last week.", hint: "essere (to be) — passive in the passato prossimo, lui", options: ["è stato", "è", "ha", "viene"], answer: "è stato" },
          { id: "2", prompt: "La legge è stata ___ dal parlamento.", en: "The law was passed by parliament.", hint: "approvare (to approve, to pass) — participle agreeing with «la legge»", options: ["approvata", "approvato", "approvate", "approvando"], answer: "approvata" },
          { id: "3", prompt: "I biglietti ___ solo online.", en: "Tickets are only sold online.", hint: "vendere (to sell) — passivante «si» with a plural object", options: ["si vendono", "si vende", "si è venduto", "si venderebbe"], answer: "si vendono" },
          { id: "4", prompt: "In Italia ___ tardi.", en: "In Italy people have dinner late.", hint: "cenare (to have dinner) — impersonal «si»", options: ["si cena", "si cenano", "si è cenato", "ci cena"], answer: "si cena" },
          { id: "5", prompt: "Questo lavoro ___ fatto subito.", en: "This job must be done right away.", hint: "andare (to go) — «andare + participle» for what must be done, lui", options: ["va", "è", "viene", "ha"], answer: "va" },
          { id: "6", prompt: "Il film ___ recensito ogni anno dagli studenti.", en: "The film is reviewed every year by the students.", hint: "venire (to come) — passive with venire, lui", options: ["viene", "va", "ha", "sono"], answer: "viene" },
          { id: "7", prompt: "Ieri ___ molto bene in quella trattoria.", en: "Yesterday we ate very well in that trattoria.", hint: "mangiare (to eat) — impersonal «si» in the past, which takes essere", options: ["si è mangiato", "si ha mangiato", "si mangiano", "si mangerebbe"], answer: "si è mangiato" },
          { id: "8", prompt: "Il quadro è stato dipinto ___ un allievo di Giotto.", en: "The painting was painted by a pupil of Giotto.", hint: "by (the agent of a passive sentence)", options: ["da", "di", "con", "per"], answer: "da" },
        ],
      },
    ],
  },
];
