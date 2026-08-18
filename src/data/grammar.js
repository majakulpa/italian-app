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
    tagline: "Verb basics, irregular verbs, and endings that agree",
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
      {
        id: "presente-irregolare",
        name: "Presente irregolare: andare, fare, stare, venire",
        tagline: "The everyday verbs that break the rules",
        explanation: {
          summary:
            "A handful of the most-used verbs don't follow the -are/-ere/-ire patterns at all. There's no trick to them — they're learnt one by one — but notice that noi and voi usually stay regular.",
          table: {
            headers: [
              "",
              { it: "andare", en: "to go" },
              { it: "fare", en: "to do, to make" },
              { it: "stare", en: "to stay, to be" },
              { it: "venire", en: "to come" },
            ],
            rows: [
              ["io", "vado", "faccio", "sto", "vengo"],
              ["tu", "vai", "fai", "stai", "vieni"],
              ["lui / lei", "va", "fa", "sta", "viene"],
              ["noi", "andiamo", "facciamo", "stiamo", "veniamo"],
              ["voi", "andate", "fate", "state", "venite"],
              ["loro", "vanno", "fanno", "stanno", "vengono"],
            ],
          },
          points: [
            "noi and voi are regular even here: andiamo, andate — the irregularity sits in the other four forms",
            "Two more of the same kind: dare (do, dai, dà, diamo, date, danno) and uscire (esco, esci, esce, usciamo, uscite, escono)",
            "stare covers both how you are and where you are: Come stai? Sto bene. Sto a casa.",
            "andare takes a before a town and in before a country or a room: vado a Roma, vado in Italia, vado in cucina",
            "fare does the work of several English verbs: fare colazione (have breakfast), fare la spesa (do the shopping), fare una domanda (ask a question)",
          ],
          examples: [
            { it: "Vado al mercato ogni sabato.", en: "I go to the market every Saturday." },
            { it: "Come stai? — Sto bene, grazie.", en: "How are you? — I'm fine, thanks." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io ___ a scuola in autobus.", en: "I go to school by bus.", hint: "andare (to go) — io", options: ["vado", "vai", "va", "andiamo"], answer: "vado" },
          { id: "2", prompt: "Tu ___ colazione al bar?", en: "Do you have breakfast at the bar?", hint: "fare (to do, to make) — tu", options: ["fai", "faccio", "fa", "fate"], answer: "fai" },
          { id: "3", prompt: "Come ___ tua madre?", en: "How is your mother?", hint: "stare (to stay, to be) — lei", options: ["sta", "stai", "sto", "stanno"], answer: "sta" },
          { id: "4", prompt: "Noi ___ a cena da voi stasera.", en: "We're coming to yours for dinner tonight.", hint: "venire (to come) — noi", options: ["veniamo", "venite", "vengo", "vengono"], answer: "veniamo" },
          { id: "5", prompt: "Voi ___ in vacanza ad agosto?", en: "Are you (plural) going on holiday in August?", hint: "andare (to go) — voi", options: ["andate", "andiamo", "vanno", "vai"], answer: "andate" },
          { id: "6", prompt: "I miei amici ___ una festa sabato.", en: "My friends are having a party on Saturday.", hint: "fare (to do, to make) — loro", options: ["fanno", "fate", "facciamo", "fa"], answer: "fanno" },
          { id: "7", prompt: "Io ___ di casa alle otto.", en: "I leave the house at eight.", hint: "uscire (to go out) — io", options: ["esco", "esci", "esce", "usciamo"], answer: "esco" },
          { id: "8", prompt: "Marta mi ___ sempre una mano.", en: "Marta always gives me a hand.", hint: "dare (to give) — lei", options: ["dà", "do", "dai", "danno"], answer: "dà" },
        ],
      },
      {
        id: "nomi-aggettivi",
        name: "Nomi e aggettivi",
        tagline: "Making the endings agree",
        explanation: {
          summary:
            "Every Italian noun is masculine or feminine, and any adjective with it has to match — in gender and in number. Most nouns end in -o (masculine), -a (feminine) or -e (either), and the plural just changes that final vowel.",
          table: {
            headers: ["", { it: "singolare", en: "singular" }, { it: "plurale", en: "plural" }],
            rows: [
              [{ it: "maschile in -o", en: "masculine in -o" }, "il libro rosso", "i libri rossi"],
              [{ it: "femminile in -a", en: "feminine in -a" }, "la casa rossa", "le case rosse"],
              [{ it: "maschile in -e", en: "masculine in -e" }, "il ristorante grande", "i ristoranti grandi"],
              [{ it: "femminile in -e", en: "feminine in -e" }, "la stazione grande", "le stazioni grandi"],
            ],
          },
          points: [
            "Plurals: -o becomes -i, -a becomes -e, -e becomes -i — whatever the gender",
            "Adjectives ending in -e have one form for both genders: un libro grande, una casa grande",
            "The adjective normally comes after the noun: una macchina nuova, un caffè freddo",
            "A mixed group of people takes the masculine plural: Marco e Anna sono italiani",
            "Words borrowed from other languages don't change: due bar, tre film, i computer",
          ],
          examples: [
            { it: "Le ragazze italiane sono simpatiche.", en: "The Italian girls are nice." },
            { it: "Ho comprato due libri nuovi.", en: "I bought two new books." },
          ],
        },
        drills: [
          { id: "1", prompt: "La casa di Anna è ___.", en: "Anna's house is red.", hint: "rosso (red) — feminine singular", options: ["rossa", "rosso", "rosse", "rossi"], answer: "rossa" },
          { id: "2", prompt: "I libri sono ___.", en: "The books are new.", hint: "nuovo (new) — masculine plural", options: ["nuovi", "nuove", "nuovo", "nuova"], answer: "nuovi" },
          { id: "3", prompt: "Le ragazze sono ___.", en: "The girls are Italian.", hint: "italiano (Italian) — feminine plural", options: ["italiane", "italiani", "italiana", "italiano"], answer: "italiane" },
          { id: "4", prompt: "Ho una macchina ___.", en: "I have a small car.", hint: "piccolo (small) — feminine singular", options: ["piccola", "piccolo", "piccole", "piccoli"], answer: "piccola" },
          { id: "5", prompt: "Ho comprato due ___ rossi.", en: "I bought two red books.", hint: "libro (book) — plural", options: ["libri", "libro", "libre", "libra"], answer: "libri" },
          { id: "6", prompt: "Vorrei un caffè ___.", en: "I'd like a cold coffee.", hint: "freddo (cold) — masculine singular", options: ["freddo", "fredda", "freddi", "fredde"], answer: "freddo" },
          { id: "7", prompt: "Le mie amiche sono molto ___.", en: "My friends (all women) are very nice.", hint: "simpatico (nice) — feminine plural", options: ["simpatiche", "simpatici", "simpatica", "simpatico"], answer: "simpatiche" },
          { id: "8", prompt: "Marco e Anna sono ___.", en: "Marco and Anna are Italian.", hint: "italiano (Italian) — a mixed group takes the masculine plural", options: ["italiani", "italiane", "italiano", "italiana"], answer: "italiani" },
        ],
      },
    ],
  },
  {
    id: "A2",
    label: "A2",
    name: "Elementare",
    tagline: "-ere/-ire verbs, articles, modals and reflexives",
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
      {
        id: "verbi-modali",
        name: "Verbi modali: potere, volere, dovere",
        tagline: "Can, want and must — each followed by an infinitive",
        explanation: {
          summary:
            "Potere (can), volere (want) and dovere (must) are followed straight by an infinitive, with nothing in between. All three are irregular in the present, and all three are worth knowing cold — they carry half of everyday conversation.",
          table: {
            headers: [
              "",
              { it: "potere", en: "to be able to, can" },
              { it: "volere", en: "to want" },
              { it: "dovere", en: "must, to have to" },
            ],
            rows: [
              ["io", "posso", "voglio", "devo"],
              ["tu", "puoi", "vuoi", "devi"],
              ["lui / lei", "può", "vuole", "deve"],
              ["noi", "possiamo", "vogliamo", "dobbiamo"],
              ["voi", "potete", "volete", "dovete"],
              ["loro", "possono", "vogliono", "devono"],
            ],
          },
          points: [
            "Modal + infinitive, no preposition: devo studiare, non posso venire, voglio partire",
            "sapere is \"can\" for a learnt skill: so nuotare (I know how to swim) vs posso nuotare (I'm free to swim)",
            "In the passato prossimo the modal borrows the auxiliary of the verb after it: ho dovuto lavorare, but sono dovuto andare",
            "Vorrei is the polite form of voglio — asking for something with voglio sounds blunt",
            "With a reflexive infinitive the pronoun can go either end: mi devo alzare = devo alzarmi",
          ],
          examples: [
            { it: "Non posso venire, devo lavorare.", en: "I can't come, I have to work." },
            { it: "Vogliamo prenotare un tavolo per due.", en: "We want to book a table for two." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io non ___ venire stasera.", en: "I can't come tonight.", hint: "potere (to be able to) — io", options: ["posso", "puoi", "può", "possiamo"], answer: "posso" },
          { id: "2", prompt: "Tu ___ un caffè?", en: "Do you want a coffee?", hint: "volere (to want) — tu", options: ["vuoi", "voglio", "vuole", "volete"], answer: "vuoi" },
          { id: "3", prompt: "Lei ___ studiare per l'esame.", en: "She has to study for the exam.", hint: "dovere (must) — lei", options: ["deve", "devo", "devi", "dobbiamo"], answer: "deve" },
          { id: "4", prompt: "Noi ___ partire alle sette.", en: "We have to leave at seven.", hint: "dovere (must) — noi", options: ["dobbiamo", "dovete", "devono", "devo"], answer: "dobbiamo" },
          { id: "5", prompt: "___ aiutarmi, per favore?", en: "Can you (plural) help me, please?", hint: "potere (to be able to) — voi", options: ["Potete", "Possiamo", "Possono", "Puoi"], answer: "Potete" },
          { id: "6", prompt: "I bambini ___ andare al parco.", en: "The children want to go to the park.", hint: "volere (to want) — loro", options: ["vogliono", "vuole", "volete", "vogliamo"], answer: "vogliono" },
          { id: "7", prompt: "Marco ___ nuotare molto bene.", en: "Marco can swim very well — a skill he has learnt.", hint: "sapere (to know how to) — lui", options: ["sa", "può", "deve", "vuole"], answer: "sa" },
          { id: "8", prompt: "Ieri ___ lavorare fino a tardi.", en: "Yesterday I had to work until late.", hint: "dovere (must) — passato prossimo, io", options: ["ho dovuto", "sono dovuto", "ho dovuta", "avevo dovuto"], answer: "ho dovuto" },
        ],
      },
      {
        id: "riflessivi",
        name: "Verbi riflessivi",
        tagline: "Mi alzo, ti svegli — describing your day",
        explanation: {
          summary:
            "A reflexive verb turns its action back on the subject: alzare is to lift something, alzarsi is to get yourself up. The pronoun — mi, ti, si, ci, vi, si — goes in front of the verb, and the verb itself is conjugated as normal.",
          table: {
            headers: [
              "",
              { it: "alzarsi", en: "to get up" },
              { it: "mettersi", en: "to put on" },
              { it: "vestirsi", en: "to get dressed" },
            ],
            rows: [
              ["io", "mi alzo", "mi metto", "mi vesto"],
              ["tu", "ti alzi", "ti metti", "ti vesti"],
              ["lui / lei", "si alza", "si mette", "si veste"],
              ["noi", "ci alziamo", "ci mettiamo", "ci vestiamo"],
              ["voi", "vi alzate", "vi mettete", "vi vestite"],
              ["loro", "si alzano", "si mettono", "si vestono"],
            ],
          },
          points: [
            "The pronoun comes before the conjugated verb: mi alzo presto",
            "With an infinitive it joins onto the end instead: devo alzarmi presto (or mi devo alzare presto)",
            "The passato prossimo always takes essere, and the participle agrees: mi sono alzata, ci siamo alzati",
            "Everyday ones: svegliarsi, alzarsi, lavarsi, vestirsi, chiamarsi, sentirsi, divertirsi, riposarsi, arrabbiarsi",
            "The plural forms double as \"each other\": ci vediamo domani, si scrivono ogni settimana",
          ],
          examples: [
            { it: "Mi sveglio alle sette e mi alzo subito.", en: "I wake up at seven and get up right away." },
            { it: "Come ti chiami? — Mi chiamo Elena.", en: "What's your name? — My name is Elena." },
          ],
        },
        drills: [
          { id: "1", prompt: "Io ___ alle sette ogni mattina.", en: "I get up at seven every morning.", hint: "alzarsi (to get up) — io", options: ["mi alzo", "ti alzi", "si alza", "mi alza"], answer: "mi alzo" },
          { id: "2", prompt: "Come ___ chiami?", en: "What's your name? — Italian says \"how do you call yourself?\"", hint: "chiamarsi (to be called) — the pronoun for tu", options: ["ti", "mi", "si", "ci"], answer: "ti" },
          { id: "3", prompt: "Lei ___ sempre tardi la domenica.", en: "She always wakes up late on Sundays.", hint: "svegliarsi (to wake up) — lei", options: ["si sveglia", "mi sveglio", "si svegliano", "ti svegli"], answer: "si sveglia" },
          { id: "4", prompt: "Noi ___ molto alle feste.", en: "We enjoy ourselves a lot at parties.", hint: "divertirsi (to enjoy oneself) — noi", options: ["ci divertiamo", "vi divertite", "si divertono", "mi diverto"], answer: "ci divertiamo" },
          { id: "5", prompt: "Voi ___ prima di uscire?", en: "Do you (plural) get dressed before going out?", hint: "vestirsi (to get dressed) — voi", options: ["vi vestite", "ci vestiamo", "si vestono", "ti vesti"], answer: "vi vestite" },
          { id: "6", prompt: "I bambini ___ le mani prima di mangiare.", en: "The children wash their hands before eating.", hint: "lavarsi (to wash oneself) — loro", options: ["si lavano", "si lava", "ci laviamo", "vi lavate"], answer: "si lavano" },
          { id: "7", prompt: "Stamattina Anna ___ alle sei.", en: "This morning Anna got up at six.", hint: "alzarsi (to get up) — passato prossimo, lei", options: ["si è alzata", "si è alzato", "ha alzato", "si era alzata"], answer: "si è alzata" },
          { id: "8", prompt: "Devo ___ presto domani.", en: "I have to get up early tomorrow.", hint: "alzarsi (to get up) — after an infinitive the pronoun joins on, io", options: ["alzarmi", "alzarsi", "alzarti", "alzarci"], answer: "alzarmi" },
        ],
      },
    ],
  },
  {
    id: "B1",
    label: "B1",
    name: "Intermedio",
    tagline: "Past and future tenses, and comparisons",
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
      {
        id: "imperfetto",
        name: "Imperfetto",
        tagline: "The backdrop tense — and when it beats the passato prossimo",
        explanation: {
          summary:
            "The imperfetto describes what things were like, what used to happen, and what was going on when something else cut in. The passato prossimo reports one finished event. Same past, two different jobs — and Italian chooses between them in almost every past sentence.",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "leggere", en: "to read" },
              { it: "dormire", en: "to sleep" },
              { it: "essere", en: "to be" },
            ],
            rows: [
              ["io", "parlavo", "leggevo", "dormivo", "ero"],
              ["tu", "parlavi", "leggevi", "dormivi", "eri"],
              ["lui / lei", "parlava", "leggeva", "dormiva", "era"],
              ["noi", "parlavamo", "leggevamo", "dormivamo", "eravamo"],
              ["voi", "parlavate", "leggevate", "dormivate", "eravate"],
              ["loro", "parlavano", "leggevano", "dormivano", "erano"],
            ],
          },
          points: [
            "One set of endings for all three groups: -vo, -vi, -va, -vamo, -vate, -vano",
            "Almost no irregulars — essere (ero…), plus fare (facevo), dire (dicevo), bere (bevevo)",
            "Use it for description, age, weather, the time and habits: era tardi, aveva vent'anni, pioveva, andavo sempre al mare",
            "Interrupted action: dormivo quando ha telefonato — the imperfetto sets the scene, the passato prossimo breaks it",
            "Signals: sempre, di solito, ogni giorno, mentre point to the imperfetto; ieri, l'anno scorso, all'improvviso, due volte to the passato prossimo",
          ],
          examples: [
            { it: "Da bambino andavo al mare ogni estate.", en: "As a child I went to the seaside every summer." },
            { it: "Leggevo quando è saltata la luce.", en: "I was reading when the power went out." },
          ],
        },
        drills: [
          { id: "1", prompt: "Da bambino ___ sempre al mare in estate.", en: "As a child I always went to the seaside in summer.", hint: "andare (to go) — imperfetto, io", options: ["andavo", "sono andato", "andrò", "andassi"], answer: "andavo" },
          { id: "2", prompt: "___ le sette e pioveva.", en: "It was seven o'clock and it was raining.", hint: "essere (to be) — imperfetto, loro (telling the time takes the plural)", options: ["Erano", "Era", "Sono state", "Sarebbero"], answer: "Erano" },
          { id: "3", prompt: "Mentre noi ___, è arrivato Marco.", en: "While we were eating, Marco arrived.", hint: "mangiare (to eat) — imperfetto, noi", options: ["mangiavamo", "abbiamo mangiato", "mangeremo", "mangiassimo"], answer: "mangiavamo" },
          { id: "4", prompt: "Ieri sera ___ un film bellissimo.", en: "Last night I watched a wonderful film.", hint: "vedere (to see) — one finished event, so passato prossimo, io", options: ["ho visto", "vedevo", "vedrò", "vedessi"], answer: "ho visto" },
          { id: "5", prompt: "Mia nonna ___ sempre il pane in casa.", en: "My grandmother always made bread at home.", hint: "fare (to do, to make) — imperfetto, lei", options: ["faceva", "ha fatto", "farà", "facesse"], answer: "faceva" },
          { id: "6", prompt: "Quando ___ piccoli, abitavamo a Bologna.", en: "When we were little, we lived in Bologna.", hint: "essere (to be) — imperfetto, noi", options: ["eravamo", "siamo stati", "saremo", "fossimo"], answer: "eravamo" },
          { id: "7", prompt: "All'improvviso qualcuno ___ alla porta.", en: "Suddenly someone knocked at the door.", hint: "bussare (to knock) — a sudden event, so passato prossimo, lui", options: ["ha bussato", "bussava", "busserà", "bussasse"], answer: "ha bussato" },
          { id: "8", prompt: "Ogni estate mio padre ___ in una fabbrica.", en: "Every summer my father worked in a factory.", hint: "lavorare (to work) — imperfetto, lui", options: ["lavorava", "ha lavorato", "lavorerà", "lavorasse"], answer: "lavorava" },
        ],
      },
      {
        id: "futuro",
        name: "Futuro semplice",
        tagline: "Will — and the Italian habit of guessing with it",
        explanation: {
          summary:
            "The future is one set of endings on the infinitive minus its final -e, with -are turning into -er-. Italians also use it to guess about the present: sarà stanco means \"he must be tired\", not \"he will be tired\".",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "prendere", en: "to take" },
              { it: "partire", en: "to leave" },
              { it: "essere", en: "to be" },
            ],
            rows: [
              ["io", "parlerò", "prenderò", "partirò", "sarò"],
              ["tu", "parlerai", "prenderai", "partirai", "sarai"],
              ["lui / lei", "parlerà", "prenderà", "partirà", "sarà"],
              ["noi", "parleremo", "prenderemo", "partiremo", "saremo"],
              ["voi", "parlerete", "prenderete", "partirete", "sarete"],
              ["loro", "parleranno", "prenderanno", "partiranno", "saranno"],
            ],
          },
          points: [
            "Endings, identical for every verb: -ò, -ai, -à, -emo, -ete, -anno",
            "-are verbs swap the a for an e: parlare → parlerò — except dare, fare and stare, which keep it (darò, farò, starò)",
            "Irregular stems drop a vowel or double the r: andrò, dovrò, potrò, saprò, vedrò, vivrò, berrò, verrò, vorrò, rimarrò",
            "Futuro di probabilità, a guess about right now: Che ore saranno? Saranno le tre. Non risponde: sarà in riunione.",
            "After quando, appena and se about the future, Italian keeps the future where English switches to the present: quando arriverai, chiamami",
            "For a plan already fixed, the present is just as normal: domani parto alle otto",
          ],
          examples: [
            { it: "Domani partiremo presto.", en: "Tomorrow we'll leave early." },
            { it: "Non risponde: sarà in riunione.", en: "He's not answering — he must be in a meeting." },
          ],
        },
        drills: [
          { id: "1", prompt: "Domani io ___ con il treno delle otto.", en: "Tomorrow I'll leave on the eight o'clock train.", hint: "partire (to leave) — futuro, io", options: ["partirò", "partirei", "partivo", "partissi"], answer: "partirò" },
          { id: "2", prompt: "Tu ___ tempo di aiutarmi sabato?", en: "Will you have time to help me on Saturday?", hint: "avere (to have) — futuro, tu", options: ["avrai", "avrei", "avevi", "avessi"], answer: "avrai" },
          { id: "3", prompt: "Lei ___ a Roma dal mese prossimo.", en: "She'll be living in Rome from next month.", hint: "vivere (to live) — futuro, lei", options: ["vivrà", "vivrebbe", "viveva", "vivesse"], answer: "vivrà" },
          { id: "4", prompt: "Noi ___ venire alla festa, siamo liberi.", en: "We'll be able to come to the party, we're free.", hint: "potere (to be able to) — futuro, noi", options: ["potremo", "potremmo", "potevamo", "potessimo"], answer: "potremo" },
          { id: "5", prompt: "Voi ___ la verità molto presto.", en: "You (plural) will know the truth very soon.", hint: "sapere (to know) — futuro, voi", options: ["saprete", "sapete", "sapreste", "sapevate"], answer: "saprete" },
          { id: "6", prompt: "I ragazzi ___ domani mattina.", en: "The boys will come tomorrow morning.", hint: "venire (to come) — futuro, loro", options: ["verranno", "vengono", "verrebbero", "venivano"], answer: "verranno" },
          { id: "7", prompt: "Che ore ___? — Le tre, credo.", en: "What time do you reckon it is? — Three, I think.", hint: "essere (to be) — the future used as a guess about now, loro", options: ["saranno", "sono", "erano", "sarebbero"], answer: "saranno" },
          { id: "8", prompt: "Quando ___ a casa, chiamami.", en: "When you get home, call me.", hint: "arrivare (to arrive) — after «quando» Italian keeps the future, tu", options: ["arriverai", "arrivassi", "arriveresti", "arrivavi"], answer: "arriverai" },
        ],
      },
    ],
  },
  {
    id: "B2",
    label: "B2",
    name: "Superiore",
    tagline: "Congiuntivo, condizionale, pronouns and the imperative",
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
      {
        id: "pronomi",
        name: "Pronomi diretti, indiretti e combinati",
        tagline: "Lo, gli, glielo — not repeating what's already been said",
        explanation: {
          summary:
            "A direct pronoun replaces an object with no preposition (vedo Marco → lo vedo); an indirect one replaces a + person (scrivo a Marco → gli scrivo). Put the two together and the first changes its vowel to e: me lo, te lo, and gli + lo written as one word, glielo.",
          table: {
            headers: [
              "",
              { it: "diretti", en: "direct — me, him, her, them" },
              { it: "indiretti", en: "indirect — to me, to him, to her" },
              { it: "combinati", en: "combined — it to me, it to him" },
            ],
            rows: [
              ["io", "mi", "mi", "me lo / me la"],
              ["tu", "ti", "ti", "te lo / te la"],
              ["lui / lei", "lo / la", "gli / le", "glielo / gliela"],
              ["noi", "ci", "ci", "ce lo / ce la"],
              ["voi", "vi", "vi", "ve lo / ve la"],
              ["loro", "li / le", "gli", "glielo / gliela"],
            ],
          },
          points: [
            "The pronoun sits in front of the conjugated verb: la conosco, gli telefono, ce lo dice sempre",
            "With an infinitive, a gerund or an informal imperative it joins onto the end instead: voglio vederlo, dimmelo",
            "In the passato prossimo a direct lo/la/li/le pulls the participle into agreement: l'ho vista, le ho viste",
            "mi, ti, ci, vi become me, te, ce, ve in front of another pronoun — and lo/la elide before a vowel: me l'ha detto",
            "\"To them\" is gli in everyday Italian (gli ho detto tutto); loro after the verb is the formal written option",
            "ne stands for di + something, or for a quantity: ne parliamo domani, ne voglio due",
          ],
          examples: [
            { it: "Il libro? L'ho già letto.", en: "The book? I've already read it." },
            { it: "Se ti serve la macchina, te la presto.", en: "If you need the car, I'll lend it to you." },
          ],
        },
        drills: [
          { id: "1", prompt: "Conosci Marta? — Sì, ___ conosco bene.", en: "Do you know Marta? — Yes, I know her well.", hint: "her (direct object)", options: ["la", "le", "gli", "lo"], answer: "la" },
          { id: "2", prompt: "Hai visto i miei occhiali? — No, non ___ ho visti.", en: "Have you seen my glasses? — No, I haven't seen them.", hint: "them (direct object, masculine plural)", options: ["li", "le", "gli", "ne"], answer: "li" },
          { id: "3", prompt: "Telefono a Marco stasera: ___ telefono dopo cena.", en: "I'm phoning Marco tonight: I'll phone him after dinner.", hint: "to him (indirect object)", options: ["gli", "lo", "le", "ci"], answer: "gli" },
          { id: "4", prompt: "Ho scritto a Elena e ___ ho mandato le foto.", en: "I wrote to Elena and sent her the photos.", hint: "to her (indirect object)", options: ["le", "la", "gli", "ne"], answer: "le" },
          { id: "5", prompt: "Mi presti la macchina? — Sì, ___ presto volentieri.", en: "Will you lend me the car? — Yes, I'll gladly lend it to you.", hint: "it to you (ti + la combined)", options: ["te la", "ti la", "me la", "gliela"], answer: "te la" },
          { id: "6", prompt: "Chi ha dato il libro a Paolo? — ___ ho dato io.", en: "Who gave Paolo the book? — I gave it to him.", hint: "it to him (gli + lo combined)", options: ["Glielo", "Gli lo", "Lo gli", "Gliela"], answer: "Glielo" },
          { id: "7", prompt: "Hai comprato le mele? — Sì, ___ ho comprate tre.", en: "Did you buy the apples? — Yes, I bought three of them.", hint: "of them (a quantity)", options: ["ne", "le", "li", "ci"], answer: "ne" },
          { id: "8", prompt: "Questo problema? Preferisco non ___ adesso.", en: "This problem? I'd rather not talk about it now.", hint: "parlarne (to talk about it) — the pronoun joins onto the infinitive", options: ["parlarne", "ne parlare", "parlarlo", "parlargli"], answer: "parlarne" },
        ],
      },
      {
        id: "imperativo",
        name: "Imperativo",
        tagline: "Telling, offering and asking — informally and formally",
        explanation: {
          summary:
            "The informal imperative (tu, noi, voi) reuses the present tense — with one exception: the tu form of -are verbs ends in -a. The formal Lei borrows the congiuntivo presente, which is why parli! can mean both \"you speak\" as a wish and \"speak!\" to a stranger.",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "prendere", en: "to take" },
              { it: "sentire", en: "to hear, to listen" },
            ],
            rows: [
              ["tu", "parla!", "prendi!", "senti!"],
              [{ it: "Lei", en: "you — formal" }, "parli!", "prenda!", "senta!"],
              ["noi", "parliamo!", "prendiamo!", "sentiamo!"],
              ["voi", "parlate!", "prendete!", "sentite!"],
            ],
          },
          points: [
            "Only the tu form of -are verbs is a surprise: parla! — every other informal form is simply the present tense",
            "The formal Lei is the congiuntivo presente, negative included: parli pure, non si preoccupi",
            "Negative tu is non + the infinitive: non parlare!, non andare!",
            "Short irregular tu forms: va' (vai), da' (dai), fa' (fai), sta' (stai), di' (dire)",
            "Pronouns attach to the informal forms — and double their consonant after the short ones: dimmi, fallo, dacci, vacci",
            "With the formal Lei the pronoun stays in front instead: mi dica, si accomodi, me lo dia",
          ],
          examples: [
            { it: "Senti, dimmi la verità.", en: "Listen, tell me the truth." },
            { it: "Prego, si accomodi.", en: "Please, take a seat — to someone you address formally." },
          ],
        },
        drills: [
          { id: "1", prompt: "___ più lentamente, per favore!", en: "Speak more slowly, please! — to a friend.", hint: "parlare (to speak) — imperativo, tu", options: ["Parla", "Parli", "Parlare", "Parlate"], answer: "Parla" },
          { id: "2", prompt: "Signora, ___ pure, la ascolto.", en: "Madam, do go ahead and speak, I'm listening.", hint: "parlare (to speak) — imperativo, Lei (the formal you)", options: ["parli", "parla", "parlate", "parlare"], answer: "parli" },
          { id: "3", prompt: "___ questa strada e poi gira a destra.", en: "Take this street and then turn right — to a friend.", hint: "prendere (to take) — imperativo, tu", options: ["Prendi", "Prenda", "Prendete", "Prendere"], answer: "Prendi" },
          { id: "4", prompt: "Ragazzi, ___ attenzione!", en: "Guys, pay attention!", hint: "fare (to do, to make) — imperativo, voi", options: ["fate", "fai", "faccia", "facciamo"], answer: "fate" },
          { id: "5", prompt: "Non ___ così in fretta!", en: "Don't eat so fast! — to a friend.", hint: "mangiare (to eat) — negative imperativo, tu", options: ["mangiare", "mangi", "mangia", "mangiate"], answer: "mangiare" },
          { id: "6", prompt: "___ la verità, ti prego.", en: "Tell me the truth, please — to a friend.", hint: "dirmi (to tell me) — imperativo tu, with the pronoun attached", options: ["Dimmi", "Mi dica", "Dimmelo", "Dici"], answer: "Dimmi" },
          { id: "7", prompt: "Prego, ___, il dottore arriva subito.", en: "Please take a seat, the doctor will be right with you — formal.", hint: "accomodarsi (to take a seat) — imperativo, Lei: the pronoun stays in front", options: ["si accomodi", "accomodati", "si accomoda", "accomodatevi"], answer: "si accomodi" },
          { id: "8", prompt: "___ subito, è tardi!", en: "Let's go right away, it's late!", hint: "andare (to go) — imperativo, noi", options: ["Andiamo", "Andate", "Vai", "Vada"], answer: "Andiamo" },
        ],
      },
    ],
  },
  {
    id: "C1",
    label: "C1",
    name: "Avanzato",
    tagline: "Hypotheticals, the passive, and the narrative past",
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
      {
        id: "passato-remoto",
        name: "Passato remoto",
        tagline: "The tense of history, novels and the south",
        explanation: {
          summary:
            "The passato remoto reports a finished action with no thread left to the present: it is the narrative past of history books, novels and fairy tales — and, south of Rome, the ordinary way of talking about yesterday. The regular endings are straightforward; the irregular verbs follow a tidy 1-3-3 pattern.",
          table: {
            headers: [
              "",
              { it: "parlare", en: "to speak" },
              { it: "credere", en: "to believe" },
              { it: "partire", en: "to leave" },
              { it: "essere", en: "to be" },
            ],
            rows: [
              ["io", "parlai", "credetti", "partii", "fui"],
              ["tu", "parlasti", "credesti", "partisti", "fosti"],
              ["lui / lei", "parlò", "credette", "partì", "fu"],
              ["noi", "parlammo", "credemmo", "partimmo", "fummo"],
              ["voi", "parlaste", "credeste", "partiste", "foste"],
              ["loro", "parlarono", "credettero", "partirono", "furono"],
            ],
          },
          points: [
            "Regular endings — -are: -ai, -asti, -ò, -ammo, -aste, -arono; -ere: -ei/-etti…; -ire: -ii, -isti, -ì, -immo, -iste, -irono",
            "Irregular verbs are irregular in three persons only — io, lui/lei, loro — and regular in the other three: feci, facesti, fece, facemmo, faceste, fecero",
            "The ones worth memorising: fui, ebbi, feci, dissi, venni, vidi, presi, scrissi, nacqui, volli, seppi, stetti",
            "It pairs with the imperfetto exactly as the passato prossimo does: mentre leggeva, qualcuno bussò",
            "In speech it sounds literary in the north and perfectly ordinary in Sicily and Naples — reading is where you'll meet it most",
          ],
          examples: [
            { it: "Dante nacque a Firenze nel 1265.", en: "Dante was born in Florence in 1265." },
            { it: "Aprì la porta e vide il mare.", en: "He opened the door and saw the sea." },
          ],
        },
        drills: [
          { id: "1", prompt: "Dante ___ a Firenze nel 1265.", en: "Dante was born in Florence in 1265.", hint: "nascere (to be born) — passato remoto, lui", options: ["nacque", "nascette", "nasceva", "nascerà"], answer: "nacque" },
          { id: "2", prompt: "I fratelli ___ la porta e uscirono.", en: "The brothers opened the door and went out.", hint: "aprire (to open) — passato remoto, loro", options: ["aprirono", "aprivano", "apriranno", "aprissero"], answer: "aprirono" },
          { id: "3", prompt: "Io ___ una lettera al re.", en: "I wrote a letter to the king.", hint: "scrivere (to write) — passato remoto, io", options: ["scrissi", "scrivei", "scrivevo", "scriverò"], answer: "scrissi" },
          { id: "4", prompt: "Tu ___ tutta la verità quel giorno.", en: "You told the whole truth that day.", hint: "dire (to say, to tell) — passato remoto, tu (a regular form even in an irregular verb)", options: ["dicesti", "dissi", "dicevi", "dicessi"], answer: "dicesti" },
          { id: "5", prompt: "Noi ___ in silenzio fino all'alba.", en: "We stayed in silence until dawn.", hint: "stare (to stay) — passato remoto, noi", options: ["stemmo", "stettemmo", "stavamo", "staremmo"], answer: "stemmo" },
          { id: "6", prompt: "Il vecchio ___ il mare per l'ultima volta.", en: "The old man saw the sea for the last time.", hint: "vedere (to see) — passato remoto, lui", options: ["vide", "vedette", "vedeva", "vedrà"], answer: "vide" },
          { id: "7", prompt: "Loro ___ a piedi fino al paese.", en: "They came on foot as far as the village.", hint: "venire (to come) — passato remoto, loro", options: ["vennero", "venirono", "venivano", "verranno"], answer: "vennero" },
          { id: "8", prompt: "Mentre il treno ___, qualcuno gridò il suo nome.", en: "As the train was leaving, someone shouted his name.", hint: "partire (to leave) — the background scene stays in the imperfetto, lui", options: ["partiva", "partì", "partirà", "partisse"], answer: "partiva" },
        ],
      },
      {
        id: "verbi-pronominali",
        name: "Verbi pronominali",
        tagline: "Farcela, andarsene, cavarsela — verbs welded to their pronouns",
        explanation: {
          summary:
            "A few very common verbs drag pronouns around that no longer mean anything on their own: ce la faccio isn't \"I do it there\", it's \"I can manage\". They have to be learnt whole — and their auxiliary in the past follows the verb underneath.",
          table: {
            headers: ["", { it: "presente", en: "present" }, { it: "passato prossimo", en: "past" }],
            rows: [
              [{ it: "farcela", en: "to manage, to make it" }, "ce la faccio", "ce l'ho fatta"],
              [{ it: "andarsene", en: "to leave, to be off" }, "me ne vado", "me ne sono andato/a"],
              [{ it: "cavarsela", en: "to get by, to get off lightly" }, "me la cavo", "me la sono cavata"],
              [{ it: "metterci", en: "to take (someone) time" }, "ci metto", "ci ho messo"],
              [{ it: "volerci", en: "to be needed, to take" }, "ci vuole / ci vogliono", "c'è voluto / ci sono voluti"],
            ],
          },
          points: [
            "farcela is the verb of effort: ce la faccio, non ce la faccio più, ce l'hai fatta!",
            "andarsene is a livelier \"leave\" than andare: me ne vado, se ne sono andati senza salutare",
            "cavarsela is both to get by and to get off lightly: me la cavo con l'inglese, se l'è cavata con una multa",
            "metterci is the person's time, volerci the thing's: ci metto un'ora ad arrivare, but ci vuole un'ora",
            "The auxiliary follows the base verb — fare and mettere keep avere (ce l'ho fatta, ci ho messo), andarsene and cavarsela take essere — and wherever there's a la, the participle ends in -a",
          ],
          examples: [
            { it: "Non ce la faccio più, me ne vado.", en: "I can't take it any more, I'm off." },
            { it: "Quanto ci vuole per arrivare in centro?", en: "How long does it take to get to the centre?" },
          ],
        },
        drills: [
          { id: "1", prompt: "Non ___ più: sono troppo stanco.", en: "I can't take it any more: I'm too tired.", hint: "farcela (to manage, to cope) — presente, io", options: ["ce la faccio", "ci faccio", "me la faccio", "ce lo faccio"], answer: "ce la faccio" },
          { id: "2", prompt: "È tardi, ___ a casa.", en: "It's late, I'm off home.", hint: "andarsene (to leave, to be off) — presente, io", options: ["me ne vado", "mi vado", "ne vado", "me ne ando"], answer: "me ne vado" },
          { id: "3", prompt: "Come va con il tedesco? — ___, più o meno.", en: "How's your German going? — I get by, more or less.", hint: "cavarsela (to get by) — presente, io", options: ["Me la cavo", "Mi cavo", "Me ne cavo", "Ce la cavo"], answer: "Me la cavo" },
          { id: "4", prompt: "Da casa mia ___ mezz'ora ad arrivare in ufficio.", en: "From my place it takes me half an hour to get to the office.", hint: "metterci (to take someone time) — presente, io", options: ["ci metto", "ci vuole", "mi metto", "ce la metto"], answer: "ci metto" },
          { id: "5", prompt: "Per fare questa torta ___ tre uova.", en: "You need three eggs to make this cake.", hint: "volerci (to be needed) — presente, agreeing with «tre uova»", options: ["ci vogliono", "ci vuole", "ci mettono", "si vogliono"], answer: "ci vogliono" },
          { id: "6", prompt: "L'esame era difficile, ma alla fine ___.", en: "The exam was hard, but in the end I made it.", hint: "farcela (to manage) — passato prossimo, io", options: ["ce l'ho fatta", "ce l'ho fatto", "ce la sono fatta", "ci ho fatto"], answer: "ce l'ho fatta" },
          { id: "7", prompt: "Anna era offesa e ___ senza salutare.", en: "Anna was offended and left without saying goodbye.", hint: "andarsene (to leave) — passato prossimo, lei", options: ["se n'è andata", "se n'è andato", "si è andata", "ne è andata"], answer: "se n'è andata" },
          { id: "8", prompt: "Ha avuto un incidente, ma ___ con qualche graffio.", en: "He had an accident, but got off with a few scratches.", hint: "cavarsela (to get off lightly) — passato prossimo, lui", options: ["se l'è cavata", "se l'è cavato", "si è cavata", "ce l'ha cavata"], answer: "se l'è cavata" },
        ],
      },
    ],
  },
];
