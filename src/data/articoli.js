// Gli Articoli — the permanent strand.
//
// PLAN.md: "Polish has no articles and the errors survive into advanced
// proficiency, so this never stops appearing." That is the whole reason this
// bench exists, and it is also the reason it is harder than anything else in
// the app: it is the one place where *neither* of the learner's two languages
// helps. Polish has no article at all, so it offers nothing. English has
// a/the, so it feels like it should — and then it drops the article in exactly
// the places Italian keeps it. `Bevo il caffè` is `I drink coffee`, with no
// `the` anywhere near it.
//
// ── The sequence ────────────────────────────────────────────────────────
// design/02-la-citta.html screen 12 states the order in its own footer:
// determinativo → indeterminativo → preposizioni articolate. STRANDS is in
// that order and articoli.test.js pins it, because the order is a teaching
// decision and not a coincidence of authoring: the fused prepositions are
// definite articles welded onto a preposition, so they are unlearnable before
// the definite article itself is.
//
// ── Shape of a strand ───────────────────────────────────────────────────
//   id / name       `name` is the Italian one the design uses; `label` is the
//                   English one, because the interface is English.
//   accent          a CITY_ACCENTS key. Not `bubble`: pink is reserved on
//                   this screen for the Polish anchor card, the way it is the
//                   Polish road in Le Mappe.
//   teaches[]       rule ids from RULES below, in the order the card shows
//                   them.
//   items[]         the drills.
//
// ── Shape of an item ────────────────────────────────────────────────────
//   before / after  the Italian sentence, split around the gap. `filled()`
//                   below is the only place the two get joined, so the
//                   sentence a summary prints and the sentence the feedback
//                   reveals can never disagree.
//   answer          the form that goes in the gap, or ZERO.
//   options         three of them, exactly as the design draws them — and one
//                   of the three can be ZERO, because the zero article is a
//                   real answer in Italian and not an oversight in the mockup.
//   rule            the id of *a* rule this item is an instance of, and
//                   deliberately not "the" rule: `la mano` is filed under
//                   `corpo` and is also a `genere-opaco` noun, and `Vado alla
//                   stazione` needs the definite article before it can fuse.
//                   One rule per item is what keeps the feedback pointed at
//                   one thing, so the module says "one of the rules behind
//                   this" and never claims it is the only one operating.
//                   articoli.test.js checks every item names a rule that
//                   exists and that no rule goes unused.
//   en              the finished sentence in English.
//   anchor          the Polish one. See below.
//
// ── Why every item carries a Polish anchor ──────────────────────────────
// PLAN.md's "Polish is a first-class layer": Slavic learners reason about
// Romance grammar through their L1, so explanations anchor in Polish
// categories even though the interface is English. The design's pink card is
// the model — *Il polacco dice «Piję kawę» — niente articolo, nessuna scelta.
// L'inglese qui lo toglie anche. Nessuna delle tue due lingue ti aiuta.*
//
// The anchor is per item rather than per rule because the useful thing is
// never "Polish has no articles" in the abstract — it is what *this* Polish
// sentence does instead. Sometimes that is a case ending (`imienia
// dziewczyny` is a genitive doing the work of `della`), sometimes it is a
// gender that actively misleads (`klucz` is masculine, `la chiave` is not),
// and once, usefully, it is Polish agreeing with Italian while English is the
// one that lies (`Jestem lekarzem` / `Sono medico` / *I am **a** doctor*).
//
//   anchor.pl       the Polish sentence, marked lang="pl" by the module
//   anchor.says     what it tells you, in English
//
// ── Accuracy over length ────────────────────────────────────────────────
// Same discipline as data/mappe.js. Sixteen items that are right in Italian
// *and* right in Polish beat fifty with a wrong gender or a Polish typo in
// them, and the learner is a Polish native who spots the typo instantly.
// Nouns are reused from data/fondamentale.js wherever one fits — `il caffè`,
// `la chiave`, `il problema`, `la mano`, `la stazione`, `il pane`, `il nome`
// — because that file already stores an opaque noun *with* its definite
// article, and an article strand that invented its own nouns would be
// teaching the article twice from two lists.

// The zero article, drawn the way screen 12 draws it. A glyph rather than a
// word: the module gives it a visually-hidden name, because an em dash on its
// own is silence to a screen reader.
export const ZERO = "—";

// Every form the drill can put on a button, and what each one *is*. The
// feedback is built on these classifications rather than on the spelling —
// "you chose an indefinite article where Italian wants a definite one" is a
// statement about `kind`, and nothing else in the file has to know how to
// spell it.
//
//   definite / indefinite  an article on its own
//   fused                  a preposition and a definite article as one word
//   unfused                the same two written apart, which Italian never
//                          does. It is a distractor, and a good one: it is
//                          the error the rule exists to prevent
//   zero                   no article. A bare preposition counts here too —
//                          `in centro` has a preposition and no article, and
//                          "no article" is exactly the thing being taught
//
// articoli.test.js requires every option of every item to appear here.
export const ARTICLE_FORMS = {
  il: { kind: "definite" },
  lo: { kind: "definite" },
  "l'": { kind: "definite" },
  la: { kind: "definite" },
  i: { kind: "definite" },
  gli: { kind: "definite" },

  un: { kind: "indefinite" },
  uno: { kind: "indefinite" },
  una: { kind: "indefinite" },
  "un'": { kind: "indefinite" },

  nel: { kind: "fused", prep: "in", article: "il" },
  sul: { kind: "fused", prep: "su", article: "il" },
  alla: { kind: "fused", prep: "a", article: "la" },
  della: { kind: "fused", prep: "di", article: "la" },
  dalla: { kind: "fused", prep: "da", article: "la" },

  "in il": { kind: "unfused", prep: "in", article: "il" },
  "su il": { kind: "unfused", prep: "su", article: "il" },
  "a la": { kind: "unfused", prep: "a", article: "la" },
  "di la": { kind: "unfused", prep: "di", article: "la" },
  "da la": { kind: "unfused", prep: "da", article: "la" },

  in: { kind: "zero" },
  su: { kind: "zero" },
  a: { kind: "zero" },
  di: { kind: "zero" },
  da: { kind: "zero" },
  [ZERO]: { kind: "zero" },
};

// The rules the items are instances of.
//
// `forms` is the Italian the rule is about — usually the articles themselves,
// and for the two rules that are about *not* having an article, the verb or
// the phrase that swallows it. `when` and `says` are English. They are
// separate fields rather than one sentence for the same reason Le Mappe
// splits its rule headline: one string can only claim one language, and `lo`
// inside an English paragraph still has to be marked lang="it" (WCAG 3.1.2).
export const RULES = {
  suono: {
    id: "suono",
    forms: ["il", "lo", "l'", "i", "gli"],
    when: "chosen by the sound the next word starts with, not by the noun",
    says:
      "lo (plural gli) goes before s + consonant, and before z, gn, ps, x and y. l' goes before a vowel, and its plural is gli too. Everything else masculine takes il, plural i. The article is agreeing with the sound that follows it, which is why it changes when an adjective gets in front of the noun: lo studente, but il bravo studente.",
  },
  generico: {
    id: "generico",
    forms: ["il", "la", "i", "le"],
    when: "on a whole class or a whole substance, where English and Polish leave the noun bare",
    says:
      "Italian puts the definite article on a noun meaning the whole of something — coffee as a substance, cats as a species, money in general. English drops it there and Polish has none to drop, so this is the single most common article error a Polish speaker makes in Italian, and it survives into advanced proficiency.",
  },
  corpo: {
    id: "corpo",
    forms: ["il", "la"],
    when: "with parts of the body and clothes, where English reaches for a possessive",
    says:
      "Italian says the hand, not my hand: who it belongs to is already carried by the verb or by a pronoun. Mi ha stretto la mano — the mi is the possessive.",
  },
  "genere-opaco": {
    id: "genere-opaco",
    forms: ["il", "la"],
    when: "when the ending of the noun lies about its gender",
    says:
      "Most -o nouns are masculine and most -a nouns feminine, and then there is il problema, il tema, il sistema (Greek, masculine) and la mano (Latin, feminine). data/fondamentale.js stores exactly these nouns with their article attached, which is the same admission: no rule saves you, so the article comes with the word.",
  },
  "prima-volta": {
    id: "prima-volta",
    forms: ["un", "uno", "una", "un'"],
    when: "the first time something is mentioned, before it is a particular one",
    says:
      "The indefinite article introduces; the definite one points back. C'è un problema opens the subject, il problema è più grave continues it. Polish marks this distinction with word order and stress instead, so the information exists in Polish — it is just not carried by a word you can put in a gap.",
  },
  "uno-suono": {
    id: "uno-suono",
    forms: ["un", "uno", "una", "un'"],
    when: "by gender first, then by the same sound rule the definite article uses",
    says:
      "Masculine is un, and uno before s + consonant, z, gn, ps, x, y — the same list as lo. Feminine is una, and un' before a vowel. Note the asymmetry that catches everyone: the feminine elides and takes an apostrophe, the masculine does not. un amico, un'amica.",
  },
  mestiere: {
    id: "mestiere",
    forms: ["essere", "fare"],
    when: "before a bare profession, nationality or role",
    says:
      "Sono medico, sono polacca, faccio l'ingegnere. No article, where English insists on one. Add an adjective and the article comes back — sono un bravo medico — because the phrase has stopped naming a category and started describing a person.",
  },
  "avere-fisso": {
    id: "avere-fisso",
    forms: ["avere fame", "avere sete", "avere sonno", "avere fretta"],
    when: "in the fixed avere expressions",
    says:
      "Italian owns hunger where English and Polish are hungry: ho fame is literally I have hunger, and the noun takes no article at all. The whole expression is one lexical unit, so nothing goes in front of the noun.",
  },
  fusione: {
    id: "fusione",
    forms: ["del", "al", "nel", "dal", "sul"],
    when: "whenever di, a, da, in or su meets a definite article",
    says:
      "The two are written as one word, always: di + il = del, a + il = al, in + il = nel, da + il = dal, su + il = sul, and the same across la, l', i, gli, le (della, alla, nella, dalla, sulla…). There is no version of Italian where they stay apart, so *di la is not a variant, it is a misspelling. con and per never fuse in modern Italian.",
  },
  "in-nudo": {
    id: "in-nudo",
    forms: ["in centro", "in città", "in ufficio", "in Italia"],
    when: "with in and an unmodified place noun",
    says:
      "in takes no article in front of a plain place noun or a country: in centro, in città, in Italia. Modify the noun and the article — fused — comes straight back: nel centro storico, nell'Italia del nord. This is the one place in the strand where the honest answer really is the empty gap.",
  },
};

// The gap filled in. ZERO puts nothing in it, and a bare preposition still
// puts its own word in — `in centro` has no article but it does have `in`.
export function filled(item, form = item.answer) {
  return form === ZERO ? `${item.before} ${item.after}` : `${item.before} ${form} ${item.after}`;
}

export const STRANDS = [
  {
    id: "determinativo",
    name: "Il determinativo",
    label: "The definite article",
    accent: "tomato",
    reach:
      "Six words — il, lo, l', la, i, gli — and no way to avoid choosing one. Two things decide it: what the noun is, and what the next sound is.",
    teaches: ["suono", "generico", "corpo", "genere-opaco"],
    items: [
      {
        id: "caffe",
        before: "Bevo",
        answer: "il",
        after: "caffè ogni mattina.",
        options: ["il", "un", ZERO],
        rule: "generico",
        en: "I drink coffee every morning.",
        anchor: {
          pl: "Piję kawę",
          says:
            "No article, and no choice to make — Polish has none to offer. English drops it here too: I drink coffee, not I drink the coffee. Neither of your two languages helps, and this is the sentence the design picked to say so.",
        },
      },
      {
        id: "studente",
        before: "Ieri",
        answer: "lo",
        after: "studente è arrivato tardi.",
        options: ["il", "lo", "l'"],
        rule: "suono",
        en: "Yesterday the student arrived late.",
        anchor: {
          pl: "Student się spóźnił",
          says:
            "Polish student carries gender, number and case, and still nothing in it tells you the Italian article changes shape in front of st-. This one has to be learned as a sound rule, because there is nothing in either of your languages for it to attach to.",
        },
      },
      {
        id: "mano",
        before: "Mi ha stretto",
        answer: "la",
        after: "mano.",
        options: ["la", "una", ZERO],
        rule: "corpo",
        // `ha stretto` says nothing about who did it, so the English must not
        // either — the item is about the article, not about the subject.
        en: "They shook my hand.",
        anchor: {
          pl: "Uścisnął mi rękę",
          says:
            "Polish does exactly what Italian does — mi carries the possession and ręka needs no possessive in front of it. So here Polish is the better guide than English, which wants my hand. What Polish still cannot tell you is that Italian marks the noun with la on top.",
        },
      },
      {
        id: "occhiali",
        before: "Non trovo più",
        answer: "gli",
        after: "occhiali.",
        options: ["i", "gli", ZERO],
        rule: "suono",
        en: "I can't find my glasses.",
        anchor: {
          pl: "Nie mogę znaleźć okularów",
          says:
            "Polish okulary is plural-only, like occhiali, so the number is not the trap. The article is: a vowel start takes l' in the singular and gli in the plural, and Polish leaves the gap where the article would go completely empty.",
        },
      },
      {
        id: "problema",
        before: "Secondo me",
        answer: "il",
        after: "problema è più grave.",
        options: ["il", "la", "un"],
        rule: "genere-opaco",
        en: "I think the problem is more serious.",
        anchor: {
          pl: "Moim zdaniem problem jest poważniejszy",
          says:
            "Rare good news: Polish problem is masculine and so is Italian problema, so your L1 is right where the -a ending is lying to you. It still hands you no article, so the gender is only half the answer.",
        },
      },
    ],
  },
  {
    id: "indeterminativo",
    name: "L'indeterminativo",
    label: "The indefinite article",
    accent: "lemon",
    reach:
      "un, uno, una, un' — and the harder half of this strand is knowing when Italian wants none of them at all.",
    teaches: ["uno-suono", "prima-volta", "mestiere", "avere-fisso"],
    items: [
      {
        id: "medico",
        before: "Sono",
        answer: ZERO,
        after: "medico.",
        options: ["un", "il", ZERO],
        rule: "mestiere",
        en: "I'm a doctor.",
        anchor: {
          pl: "Jestem lekarzem",
          says:
            "The one place your two languages disagree and Polish wins. Polish puts lekarz in the instrumental and adds nothing; English insists on a doctor. Italian sides with Polish — trust the instinct that wants to leave the gap empty, and distrust the English one.",
        },
      },
      {
        id: "problema-nuovo",
        before: "C'è",
        answer: "un",
        after: "problema.",
        options: ["un", "il", ZERO],
        rule: "prima-volta",
        en: "There's a problem.",
        anchor: {
          pl: "Jest problem",
          says:
            "Polish says it with no article at all and lets word order do the introducing. Italian has to choose, and the choice is about whether the thing has been mentioned yet — the same noun takes il two screens earlier, once it is a particular problem.",
        },
      },
      {
        id: "zaino",
        before: "Ho comprato",
        answer: "uno",
        after: "zaino nuovo.",
        options: ["un", "uno", "il"],
        rule: "uno-suono",
        en: "I bought a new backpack.",
        anchor: {
          pl: "Kupiłem nowy plecak",
          says:
            "Polish clusters consonants far more freely than Italian does, so nothing in plecak or in zaino suggests the initial z should change the word in front of it. The sound rule is the same one lo follows; the shapes are different.",
        },
      },
      {
        id: "chiave",
        before: "Vorrei",
        answer: "un'",
        after: "altra chiave.",
        options: ["un", "una", "un'"],
        rule: "uno-suono",
        en: "I'd like another key.",
        anchor: {
          pl: "Poproszę jeszcze jeden klucz",
          says:
            "Polish klucz is masculine and Italian la chiave is feminine, so your L1 pushes you straight at un here. It is feminine, and in front of a vowel the feminine elides: un'altra, with the apostrophe. The masculine never takes one.",
        },
      },
      {
        id: "fame",
        before: "Ho",
        answer: ZERO,
        after: "fame!",
        options: ["una", "la", ZERO],
        rule: "avere-fisso",
        en: "I'm hungry!",
        anchor: {
          pl: "Jestem głodny",
          says:
            "Polish and English both make hunger an adjective — you *are* hungry. Italian makes it a noun you own, ho fame, and then puts nothing in front of it. Neither language prepares you for the noun, let alone for the empty gap.",
        },
      },
    ],
  },
  {
    id: "preposizioni",
    name: "Le preposizioni articolate",
    label: "Prepositions with the article",
    accent: "grape",
    reach:
      "di, a, da, in and su swallow the article whole. This strand comes last because there is nothing to fuse until the definite article is already yours.",
    teaches: ["fusione", "in-nudo"],
    items: [
      {
        id: "cassetto",
        before: "Le chiavi sono",
        answer: "nel",
        after: "cassetto.",
        options: ["nel", "in il", "in"],
        rule: "fusione",
        en: "The keys are in the drawer.",
        anchor: {
          pl: "Klucze są w szufladzie",
          says:
            "Polish does the same job with a case: w + locative, and szuflada bends instead of taking a word in front of it. Italian bends nothing and welds instead — the preposition and the article become one word.",
        },
      },
      {
        id: "tavolo",
        before: "Il pane è",
        answer: "sul",
        after: "tavolo.",
        options: ["sul", "su il", "su"],
        rule: "fusione",
        en: "The bread is on the table.",
        anchor: {
          pl: "Chleb jest na stole",
          says:
            "na + locative again, and again no separate word to translate. The trap is picking su on its own: it looks like the closest thing to the Polish, and it is missing the article Italian still wants.",
        },
      },
      {
        id: "stazione",
        before: "Vado",
        answer: "alla",
        after: "stazione.",
        options: ["alla", "a la", "a"],
        rule: "fusione",
        en: "I'm going to the station.",
        anchor: {
          pl: "Idę na dworzec",
          says:
            "Polish uses na and the accusative for motion towards. Italian uses a, and because stazione is a particular one it takes la — which then fuses. The two written apart is not a slower, more careful Italian; it is simply wrong.",
        },
      },
      {
        id: "nome",
        before: "Non ricordo il nome",
        answer: "della",
        after: "ragazza.",
        options: ["della", "di la", "di"],
        rule: "fusione",
        en: "I don't remember the girl's name.",
        anchor: {
          pl: "Nie pamiętam imienia dziewczyny",
          says:
            "Here Polish is doing the whole job with one ending: dziewczyny is a genitive, and there is no preposition and no article anywhere. Italian needs di for the genitive and la for the girl, and then fuses them — three pieces of information where Polish used one suffix.",
        },
      },
      {
        id: "polonia",
        before: "Vengo",
        answer: "dalla",
        after: "Polonia.",
        options: ["dalla", "da la", "da"],
        rule: "fusione",
        en: "I'm from Poland.",
        anchor: {
          pl: "Pochodzę z Polski",
          says:
            "z + genitive, one preposition and a bent noun. Italian wants da and the article a country carries, fused into dalla. Worth holding next to the item below: you come dalla Polonia but you go in Polonia, and the asymmetry is real rather than an exception.",
        },
      },
      {
        id: "centro",
        before: "Abito",
        answer: "in",
        after: "centro.",
        options: ["nel", "in il", "in"],
        rule: "in-nudo",
        en: "I live in the centre of town.",
        anchor: {
          pl: "Mieszkam w centrum",
          says:
            "Same three options as the drawer above and a different answer, which is the point: w centrum has no article because Polish never does, and this time Italian agrees. Say nel centro storico and the article is back, because the noun stopped being plain.",
        },
      },
    ],
  },
];
