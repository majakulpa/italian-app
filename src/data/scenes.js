// Le scene — Il Mercato, phase 1 of the four-phase scene shape (design 02–06).
//
// A scene is not a lesson. Design 02 makes the whole argument in one line:
// "you're not doing lesson 4, you're becoming someone who can buy tomatoes."
// So every scene here starts from an `ability` — a can-do statement in the
// first person, present tense, that a learner could read out and mean — and
// everything else in the entry exists to get them to the point where it is
// true. The brief shows it before the scene, the debrief records it after.
//
// ── Why all three are stage 1 ───────────────────────────────────────────
// Stage 1 is presente only. That is a hard constraint on the authoring, not
// a label: no passato prossimo, no futuro, no condizionale, and — the trap
// that caught the design's own mockup — **no formal imperative**. Design 03
// opens with "Mi dica, signora!", which is exactly what a Bologna stallholder
// says and is morphologically the present subjunctive of `dire`. A stage-1
// scene cannot model it, so the opening here is `Desidera?` — the Lei present
// indicative, equally real at a counter, and already the wording this repo
// ships in data/conversations.js. scenes.test.js keeps the whole file honest
// by classifying every word of every modelled and produced line — each one is
// either a verb form named with its tense, or a non-verb — and it blacklists
// that imperative family by name, because it is the one an author reaches for
// without noticing.
//
// Clitics are the one thing above the tense line that stays: `li mangio`,
// `lo taglio`, `ne prendo`. They are how these sentences are actually said,
// and R1 makes clitics always graded, which is why a clitic `correctable`
// below carries `stage: null` rather than a number.
//
// ── Shape of an entry ───────────────────────────────────────────────────
//   ability      the can-do statement, IT + EN. The reason the scene exists.
//                It is chrome, not material: it is read, never produced, and
//                it is allowed words that are in neither `knownRanks` nor
//                `newWords` — `cibo` and `peso` in scene 1 (design 02's own
//                wording), `salumi` in scene 2. None of the three is in the
//                first 400 ranks. Whether the brief should gloss them is a
//                screen decision, not a data one, and it is open.
//   stage        the grammatical ceiling. 1 = presente.
//   knownRanks   fondamentale.js ranks the scene leans on, so the brief can
//                count "N parole che sai già" from the learner's real
//                lexicon state instead of the design's drawn 14. Plain
//                numbers, because that is what the count needs; the rank →
//                word checklist lives in scenes.test.js, which fails if a
//                rank here ever stops meaning the word it was chosen for.
//   newWords     genuinely new words, EN + PL gloss, `pos`, and a `note`
//                where one is earned. `fondamentaleRank` records whether the
//                word is in the base list — for all 19 below it is `null`,
//                which is the finding, not an omission: *mezzo, chilo, etto,
//                maturo, pomodoro, prosciutto, resto, contanti, carta,
//                assaggiare* are none of them in the first 400 ranks. That is
//                why scene words need their own scheduled module rather than
//                riding the lexicon's coverage figure. `formaggio` was the
//                exception the check caught — it is rank 235, so it sits in
//                `knownRanks`, not here.
//                Nouns follow fondamentale.js: bare when the ending gives the
//                gender away (`pomodoro`, `carta`, `euro`), with the definite
//                article when it doesn't (`il salumiere`, `i contanti`), and
//                with an explicit `gender` only where the article elides to
//                `l'` and stops carrying it — which is no entry here, once
//                `l'euro` was corrected to `euro`.
//                Greetings and counter formulas — buongiorno, grazie, per
//                favore, prego — are treated as already-known and are not
//                listed; nobody arrives at a market without them. `desidera`
//                is likewise not listed: it is the partner's opening line, so
//                the learner meets it as comprehension, never production.
//   grammar      the one slice the scene teaches, with examples and a note.
//                `polish` is a card, or `null`. It is `null` for scene 2 on
//                purpose: `posso assaggiare` maps to `mogę spróbować`, but it
//                maps just as directly to English "can I taste", and the
//                Polish card's whole justification (see data/mappe.js) is
//                that Polish gets there in *fewer steps than English*. Where
//                it doesn't, the card is padding. The one real Polish-only
//                fact in that scene — that *spróbować* carries an aspect
//                Italian doesn't mark, and governs the genitive — is a thing
//                to switch off rather than a hook to lean on, so it lives in
//                the `assaggiare` note where it belongs.
//   model        4–8 alternating vendor/customer lines, IT + EN. Phase 03
//                plays these; they are the only Italian the learner meets
//                before producing any.
//   rehearsal    Phase 04. `answer` is the one canonical form, because
//                shared/locatedFeedback.js `judge` takes exactly one answer
//                plus `neighbours` — it cannot be handed a set. `accepted`
//                is the set the screen picks the nearest member of *before*
//                calling judge, and it always contains `answer`.
//                `neighbours` are other whole items the learner might have
//                reached for instead — a different quantity, a different
//                cut — never a mis-formed version of the answer itself.
//                Mis-formed versions are `correctables`.
//   task         Phase 05. Partner role, setting, goal, plain-terms success
//                criteria, and the line the partner opens on. `success` is
//                English because it is written for the partner model and for
//                the debrief, not for the screen.
//   correctables the enum the debrief may name, one at a time and at most
//                once. The model cannot invent a correction: it picks an
//                `id` from here or says nothing, and the client checks the
//                `stage` on this data rather than trusting the stage the
//                model claims. `stage: null` means always graded — the
//                clitics — and is written out rather than left undefined so
//                that a forgotten field can't pass for one.
//
// Italian accuracy is the deliverable. Every line below is something a
// stallholder or a customer would really say, agreement included
// (`pomodori maturi`, `belli maturi`), and the Polish is a layer in its own
// right — aspect and case right, " · " between split senses — not a
// translation of the English.

export const SCENE_STAGE_PRESENTE = 1;

export const SCENES = [
  {
    // knownRanks: 1 essere · 2 di · 8 un · 11 per · 18 questo · 21 volere ·
    // 26 tutto · 28 più · 29 no · 51 bene · 65 così · 70 altro · 85 bello ·
    // 136 mangiare · 148 comprare · 212 sera · 303 tre
    id: "verdura",
    title: "Al banco della verdura",
    district: "mercato",
    stage: SCENE_STAGE_PRESENTE,
    ability: {
      // Design 02's own can-do, kept word for word. It is the best line in
      // the mockup: it names an outcome, not a syllabus item.
      it: "Posso comprare cibo a peso e dire quanto lo voglio maturo.",
      en: "I can buy food by weight and say how ripe I want it.",
    },
    knownRanks: [1, 2, 8, 11, 18, 21, 26, 28, 29, 51, 65, 70, 85, 136, 148, 212, 303],
    newWords: [
      {
        it: "mezzo",
        pos: "adj",
        en: "half",
        pl: "pół",
        fondamentaleRank: null,
        note: "Si accorda con la cosa: mezzo chilo, mezza bottiglia. In polacco pół davanti a una misura non cambia (pół kilo); è połowa, il sostantivo, che si declina.",
      },
      {
        it: "chilo",
        pos: "noun",
        en: "kilo",
        pl: "kilogram · kilo",
        fondamentaleRank: null,
        note: "Al mercato si dice sempre chilo, non chilogrammo. Plurale chili: due chili di pane.",
      },
      {
        it: "etto",
        pos: "noun",
        en: "a hundred grams",
        pl: "sto gramów",
        fondamentaleRank: null,
        // The unit is the point. A learner who translates it loses it: the
        // Polish and English both need three words, so `etto` has to be
        // learned as a thing rather than as a gloss.
        note: "Un etto sono cento grammi. Non c'è una parola sola né in polacco né in inglese: è l'unità del banco. Da due in su fa etti — due etti, tre etti.",
      },
      {
        it: "maturo",
        pos: "adj",
        en: "ripe",
        pl: "dojrzały",
        fondamentaleRank: null,
        // Design 03's own gloss note, kept: it is the cleanest statement of
        // the agreement rule in the whole mockup. Its Polish showed the
        // inflected dojrzałe because it was glossing maturi; the lemma here
        // is the dictionary form.
        note: "Plurale maturi perché pomodori è plurale. In italiano l'aggettivo si accorda — come in polacco.",
      },
      {
        it: "pomodoro",
        pos: "noun",
        en: "tomato",
        pl: "pomidor",
        fondamentaleRank: null,
        note: "Plurale pomodori, maschile.",
      },
      {
        it: "stasera",
        pos: "adv",
        en: "this evening, tonight",
        pl: "dziś wieczorem",
        fondamentaleRank: null,
        note: "Una parola sola: sta- + sera. Come stamattina e stanotte.",
      },
    ],
    grammar: {
      slice: "quantity + di",
      title: "Quantità + di",
      examples: [
        { it: "mezzo chilo di pomodori", en: "half a kilo of tomatoes" },
        { it: "un etto di prosciutto", en: "a hundred grams of ham" },
        { it: "due chili di pane", en: "two kilos of bread" },
      ],
      // Design 04's own note, verbatim. Six words that do the work.
      note: "Quantità + di + cosa. Niente articolo.",
      polish: {
        it: "Il polacco fa la stessa cosa col genitivo: pół kilo pomidorów.",
        pl: "pół kilo pomidorów",
        transfers: "L'idea è identica: la quantità regge la cosa che conti.",
        differs: "Il polacco lo fa cambiando la fine della parola (pomidor → pomidorów). L'italiano non tocca la parola: ci mette di davanti.",
      },
    },
    model: [
      { who: "vendor", it: "Buongiorno! Desidera?", en: "Morning! What can I get you?" },
      {
        who: "customer",
        // Design 03's customer line, verbatim — clitic and all. It is what
        // makes `lo mangio → li mangio` a correctable the learner has heard.
        it: "Mezzo chilo di pomodori, per favore. Ma maturi, che li mangio stasera.",
        en: "Half a kilo of tomatoes, please. Ripe ones though — I'm eating them tonight.",
      },
      { who: "vendor", it: "Questi sono belli maturi. Un etto in più?", en: "These are nice and ripe. A hundred grams more?" },
      { who: "customer", it: "No, va bene così. Quant'è?", en: "No, that's fine as it is. How much is it?" },
      { who: "vendor", it: "Tre euro. Vuole altro?", en: "Three euros. Anything else?" },
      { who: "customer", it: "No, è tutto. Grazie.", en: "No, that's everything. Thanks." },
    ],
    rehearsal: [
      {
        id: "mezzo-chilo",
        en: "half a kilo of tomatoes, please",
        answer: "Mezzo chilo di pomodori, per favore.",
        accepted: ["Mezzo chilo di pomodori, per favore.", "Mezzo chilo di pomodori."],
        neighbours: ["Un chilo di pomodori, per favore.", "Un etto di pomodori, per favore."],
      },
      {
        id: "un-etto",
        // Design 04's own "Dillo tu" prompt and answer, verbatim.
        en: "a hundred grams of cheese",
        answer: "un etto di formaggio",
        accepted: ["un etto di formaggio", "cento grammi di formaggio"],
        neighbours: ["un chilo di formaggio", "mezzo chilo di formaggio"],
      },
      {
        id: "ma-maturi",
        en: "ripe ones, though",
        answer: "Ma maturi.",
        accepted: ["Ma maturi.", "Però maturi.", "Ma maturi, per favore."],
        neighbours: ["Ma verdi.", "Ma piccoli."],
      },
      {
        id: "va-bene-cosi",
        en: "no, that's fine as it is — how much is it?",
        answer: "No, va bene così. Quant'è?",
        accepted: ["No, va bene così. Quant'è?", "No, va bene così. Quanto costa?", "Va bene così. Quant'è?"],
        neighbours: ["Sì, un etto in più. Quant'è?"],
      },
    ],
    task: {
      partner: { it: "il venditore", en: "the greengrocer on the stall" },
      setting: {
        // Design 02's "La situazione", verbatim. The last clause is the whole
        // reason the phase is unscripted: a partner who slows down for you is
        // not the thing the learner needs to survive.
        it: "Sabato, mercato di Bologna. Vuoi mezzo chilo di pomodori — quelli maturi, per stasera. Il venditore parla veloce e non rallenta per nessuno.",
        en: "Saturday, the Bologna market. You want half a kilo of tomatoes — ripe ones, for tonight. The stallholder talks fast and slows down for nobody.",
      },
      goal: {
        it: "Compra mezzo chilo di pomodori maturi e scopri quanto costano.",
        en: "Buy half a kilo of ripe tomatoes and find out what you owe.",
      },
      success: [
        "The learner asked for a quantity of tomatoes using a quantity word plus di.",
        "The learner said they want them ripe, not just that they want tomatoes.",
        "The learner asked or was told the price and acknowledged it.",
      ],
      opening: { it: "Buongiorno! Desidera?", en: "Morning! What can I get you?" },
    },
    correctables: [
      {
        // Design 06's own correction. A clitic, so always graded: stage null.
        id: "clitico-plurale",
        said: "lo mangio",
        better: "li mangio",
        why: "Oggetto plurale — i pomodori. Il pronome diventa li.",
        stage: null,
      },
      {
        id: "accordo-maturi",
        said: "pomodori maturo",
        better: "pomodori maturi",
        why: "L'aggettivo si accorda: pomodori è maschile plurale, quindi maturi.",
        stage: 1,
      },
      {
        id: "mezzo-accordo",
        said: "mezza chilo",
        better: "mezzo chilo",
        why: "Chilo è maschile, quindi mezzo.",
        stage: 1,
      },
      {
        id: "quantita-articolo",
        said: "mezzo chilo dei pomodori",
        better: "mezzo chilo di pomodori",
        why: "Dopo una quantità, di senza articolo.",
        stage: 1,
      },
      {
        id: "etto-plurale",
        said: "due etto",
        better: "due etti",
        why: "Da due in su, etto fa etti.",
        stage: 1,
      },
    ],
  },
  {
    // knownRanks: 1 essere · 2 di · 8 un · 11 per · 18 questo · 22 potere ·
    // 44 sì · 45 cosa · 50 molto · 67 tanto · 80 buono · 103 dare ·
    // 104 prendere · 150 costare · 235 formaggio · 302 due · 303 tre
    id: "salumiere",
    title: "Dal salumiere",
    district: "mercato",
    stage: SCENE_STAGE_PRESENTE,
    ability: {
      it: "Posso ordinare salumi e formaggio a peso, e chiedere di assaggiare.",
      en: "I can order cold cuts and cheese by weight, and ask for a taste.",
    },
    knownRanks: [1, 2, 8, 11, 18, 22, 44, 45, 50, 67, 80, 103, 104, 150, 235, 302, 303],
    newWords: [
      {
        it: "il salumiere",
        pos: "noun",
        en: "the deli man, the cold-cuts seller",
        pl: "sprzedawca wędlin",
        fondamentaleRank: null,
        // -e ending, so the article carries the gender: fondamentale.js's
        // rule, applied here. La salumiera exists and is equally common.
        note: "Finisce in -e, quindi l'articolo dice il genere. Al femminile: la salumiera.",
      },
      {
        it: "prosciutto",
        pos: "noun",
        en: "ham",
        pl: "szynka",
        fondamentaleRank: null,
        note: "Al banco ti chiedono quale: crudo (stagionato, non cotto) o cotto.",
      },
      {
        it: "pezzo",
        pos: "noun",
        en: "piece",
        pl: "kawałek",
        fondamentaleRank: null,
        note: "Un pezzo di formaggio si compra così, senza dire il peso: poi lo pesano loro.",
      },
      {
        it: "assaggiare",
        pos: "verb",
        en: "to taste, to try (food)",
        // Not `kosztować`, which is a dictionary sense of "taste" and the
        // everyday word for *to cost* — and scene 3 teaches `costare` as
        // exactly that. The pair rather than one perfective, because that is
        // how this repo glosses a verb (`provare` is `próbować` at rank 134,
        // and the aspect pairs in `fondamentale.js` list the imperfective
        // first): `próbować` is what you ask at a counter, `spróbować` the
        // single taste you are asking for.
        pl: "próbować · spróbować",
        fondamentaleRank: null,
        // The one genuine Polish-only fact in this scene, and the reason the
        // scene has no Polish grammar card: it is a difference to switch off,
        // not a shape to lean on.
        note: "Il polacco sceglie l'aspetto — spróbować (una volta) contro próbować (continuare) — e vuole il genitivo: spróbować sera. L'italiano non marca né l'uno né l'altro: assaggiare il formaggio.",
      },
      {
        it: "tagliare",
        pos: "verb",
        en: "to cut, to slice",
        pl: "ciąć · krajać",
        fondamentaleRank: null,
        note: "Lo taglio fine? è la domanda standard al banco dei salumi.",
      },
      {
        it: "fine",
        pos: "adj",
        en: "thin, thinly (of a slice)",
        pl: "cienki · cienko",
        fondamentaleRank: null,
        // Earns its note: three different words hide behind this spelling and
        // two of them have different genders.
        note: "Attenzione: fine qui vuol dire sottile, e vale anche come avverbio (taglio fine). Non è la fine (il finale) né il fine (lo scopo).",
      },
      {
        it: "certo",
        pos: "adv",
        // Glossed in the sense the scene uses. The adjective `certo` = sicuro
        // is a different part of speech, so it belongs in the note rather
        // than crammed into a gloss the `pos` field then contradicts.
        en: "of course",
        pl: "oczywiście",
        fondamentaleRank: null,
        note: "Certo! da solo vuol dire ma sì, volentieri. Come aggettivo vuol dire sicuro.",
      },
    ],
    grammar: {
      slice: "potere + infinito",
      title: "Posso + infinito",
      examples: [
        { it: "Posso assaggiare?", en: "Can I taste it?" },
        { it: "Posso pagare con la carta?", en: "Can I pay by card?" },
        { it: "Lo può tagliare fine?", en: "Can you slice it thin?" },
      ],
      note: "Posso e poi il verbo all'infinito, senza niente in mezzo. È anche il modo più semplice di chiedere un favore al banco.",
      // Refused on purpose. Polish mogę + bezokolicznik is a one-to-one
      // match, but so is English "can I" — and a Polish card only earns its
      // space where Polish is the shorter road. See the file header.
      polish: null,
    },
    model: [
      { who: "vendor", it: "Buongiorno. Cosa Le do?", en: "Morning. What can I get you?" },
      {
        who: "customer",
        it: "Due etti di prosciutto, per favore. E un pezzo di formaggio.",
        en: "Two hundred grams of ham, please. And a piece of cheese.",
      },
      { who: "vendor", it: "Il prosciutto lo taglio fine?", en: "Shall I slice the ham thin?" },
      { who: "customer", it: "Sì, fine. Posso assaggiare il formaggio?", en: "Yes, thin. Can I taste the cheese?" },
      { who: "vendor", it: "Certo. Questo è molto buono, e non costa tanto.", en: "Of course. This one's very good, and it isn't expensive." },
      { who: "customer", it: "Molto buono. Ne prendo tre etti.", en: "Very good. I'll take three hundred grams of it." },
    ],
    rehearsal: [
      {
        id: "due-etti",
        en: "two hundred grams of ham, please",
        answer: "Due etti di prosciutto, per favore.",
        accepted: ["Due etti di prosciutto, per favore.", "Due etti di prosciutto."],
        neighbours: ["Un etto di prosciutto, per favore.", "Due etti di formaggio, per favore."],
      },
      {
        id: "posso-assaggiare",
        en: "can I taste the cheese?",
        answer: "Posso assaggiare il formaggio?",
        accepted: ["Posso assaggiare il formaggio?", "Posso assaggiare il formaggio"],
        neighbours: ["Posso assaggiare il prosciutto?"],
      },
      {
        id: "taglia-fine",
        en: "could you slice it thin?",
        answer: "Lo taglia fine?",
        accepted: ["Lo taglia fine?", "Me lo taglia fine?", "Lo può tagliare fine?"],
        neighbours: ["Lo taglia grosso?"],
      },
      {
        id: "ne-prendo",
        en: "I'll take three hundred grams of it",
        answer: "Ne prendo tre etti.",
        accepted: ["Ne prendo tre etti.", "Ne prendo tre etti, grazie."],
        neighbours: ["Ne prendo due etti.", "Ne prendo un chilo."],
      },
    ],
    task: {
      partner: { it: "il salumiere", en: "the man behind the deli counter" },
      setting: {
        it: "Lo stesso mercato, il banco dei salumi. Hai gente a cena e vuoi prosciutto e un pezzo di formaggio. Il formaggio non lo conosci: prima di comprarlo lo vuoi assaggiare.",
        en: "The same market, the deli counter. You have people coming for dinner and you want ham and a piece of cheese. You don't know the cheese: you want a taste before you buy it.",
      },
      goal: {
        it: "Ordina prosciutto e formaggio a peso, e chiedi di assaggiare il formaggio prima di prenderlo.",
        en: "Order ham and cheese by weight, and ask to taste the cheese before you take it.",
      },
      success: [
        "The learner named a weight for the ham using a quantity word plus di.",
        "The learner asked to taste the cheese with potere plus an infinitive.",
        "The learner decided how much cheese to take after tasting it.",
      ],
      opening: { it: "Buongiorno. Cosa Le do?", en: "Morning. What can I get you?" },
    },
    correctables: [
      {
        id: "posso-infinito",
        said: "Posso assaggio?",
        better: "Posso assaggiare?",
        why: "Dopo posso va l'infinito, non il presente.",
        stage: 1,
      },
      {
        id: "etti-plurale",
        said: "due etto",
        better: "due etti",
        why: "Da due in su, etto fa etti.",
        stage: 1,
      },
      {
        id: "ne-mancante",
        said: "Prendo tre etti",
        better: "Ne prendo tre etti",
        why: "La cosa è già stata detta: la quantità si porta dietro ne.",
        stage: null,
      },
      {
        id: "peso-articolo",
        said: "due etti del prosciutto",
        better: "due etti di prosciutto",
        why: "Dopo una quantità, di senza articolo.",
        stage: 1,
      },
      {
        id: "formaggio-genere",
        said: "la formaggio",
        better: "il formaggio",
        why: "Formaggio finisce in -o: è maschile.",
        stage: 1,
      },
    ],
  },
  {
    // knownRanks: 2 di · 6 avere · 8 un · 11 per · 18 questo · 21 volere ·
    // 22 potere · 26 tutto · 51 bene · 66 solo · 149 pagare · 150 costare ·
    // 303 tre · 307 sette · 310 dieci
    id: "quanto-costa",
    title: "Quanto costa?",
    district: "mercato",
    stage: SCENE_STAGE_PRESENTE,
    ability: {
      it: "Posso chiedere quanto costa, pagare e controllare il resto.",
      en: "I can ask what something costs, pay for it, and check my change.",
    },
    knownRanks: [2, 6, 8, 11, 18, 21, 22, 26, 51, 66, 149, 150, 303, 307, 310],
    newWords: [
      {
        it: "quanto",
        pos: "interrog",
        en: "how much, how many",
        pl: "ile",
        fondamentaleRank: null,
        note: "Si accorda con la cosa: quanto pane, quanta acqua, quanti pomodori, quante mele. Il polacco ile non ha genere.",
      },
      {
        // Bare, not `l'euro`. The -o ending gives the gender away on its own,
        // which is fondamentale.js's condition for storing a noun without its
        // article; the elision-plus-`gender` case is for nouns whose ending is
        // *opaque* as well as vowel-initial (`l'amore`, `l'arte`). Written as
        // `l'euro` with `gender: "m"` first, and scenes.test.js's article
        // check caught it.
        it: "euro",
        pos: "noun",
        en: "euro",
        pl: "euro",
        fondamentaleRank: null,
        note: "Invariabile al plurale: dieci euro, mai euri. Come in polacco, dove euro non si declina.",
      },
      {
        it: "resto",
        pos: "noun",
        en: "change (money back); the rest",
        pl: "reszta",
        fondamentaleRank: null,
        note: "Alla cassa il resto sono i soldi che ti tornano. Il polacco usa la stessa parola per i due sensi, reszta, dove l'inglese ne usa due (change e rest). Vuole l'articolo: ecco il resto.",
      },
      {
        it: "i contanti",
        // Plural-only, like `i soldi` at rank 297, so it is stored with its
        // article rather than bare.
        pos: "noun",
        en: "cash",
        pl: "gotówka",
        fondamentaleRank: null,
        note: "Solo plurale in italiano, e la frase fissa è in contanti. Il polacco gotówka è singolare.",
      },
      {
        it: "carta",
        pos: "noun",
        en: "card; paper",
        pl: "karta · papier",
        fondamentaleRank: null,
        note: "Con la carta vuole l'articolo; in contanti non lo vuole. È anche la carta su cui scrivi.",
      },
      {
        it: "in tutto",
        pos: "phrase",
        en: "altogether, in total",
        pl: "w sumie · razem",
        fondamentaleRank: null,
        note: "Quant'è in tutto? è come si chiede il totale.",
      },
    ],
    grammar: {
      slice: "quanto costa / quanto costano",
      title: "Quanto costa? Quanto costano?",
      examples: [
        { it: "Quanto costa il pane?", en: "How much does the bread cost?" },
        { it: "Quanto costano i pomodori?", en: "How much do the tomatoes cost?" },
        { it: "Tre euro al chilo.", en: "Three euros a kilo." },
      ],
      note: "Il verbo va con la cosa, non con te: una cosa costa, due cose costano. E il prezzo a peso si dice con al: tre euro al chilo, due euro all'etto.",
      polish: {
        // On-topic for the slice and Polish-specific: the price-per-unit
        // phrase takes a preposition in Polish and in Italian, and in
        // English it takes none. This is the case the design's pink card is
        // for — Polish is the shorter road, not just another road.
        it: "Anche il polacco mette una preposizione davanti all'unità: trzy euro za kilo.",
        pl: "trzy euro za kilo",
        transfers: "Prezzo + preposizione + unità, come in polacco. L'inglese non ne mette nessuna: three euros a kilo.",
        differs: "La preposizione italiana si fonde con l'articolo: a + il fa al, a + lo fa allo, a + l' fa all'. Tre euro al chilo, due euro all'etto.",
      },
    },
    model: [
      { who: "customer", it: "Buongiorno. Quanto costano queste?", en: "Morning. How much are these?" },
      { who: "vendor", it: "Tre euro al chilo. Quanti ne vuole?", en: "Three euros a kilo. How many do you want?" },
      { who: "customer", it: "Un chilo, grazie. Quant'è in tutto?", en: "A kilo, thanks. How much is that altogether?" },
      { who: "vendor", it: "Tre euro. Paga in contanti o con la carta?", en: "Three euros. Are you paying cash or by card?" },
      { who: "customer", it: "In contanti. Ho solo dieci euro.", en: "Cash. I've only got ten euros." },
      { who: "vendor", it: "Va bene. Ecco sette euro di resto.", en: "That's fine. Here's seven euros change." },
    ],
    rehearsal: [
      {
        id: "quanto-costano",
        en: "how much do the tomatoes cost?",
        answer: "Quanto costano i pomodori?",
        accepted: ["Quanto costano i pomodori?", "Quanto costano questi pomodori?"],
        neighbours: ["Quanto costa il pane?", "Quanto costa il formaggio?"],
      },
      {
        id: "in-tutto",
        en: "how much is that altogether?",
        answer: "Quant'è in tutto?",
        accepted: ["Quant'è in tutto?", "Quanto è in tutto?", "Quanto fa in tutto?"],
        neighbours: ["Quant'è al chilo?"],
      },
      {
        id: "pago-contanti",
        en: "I'm paying cash",
        answer: "Pago in contanti.",
        accepted: ["Pago in contanti.", "In contanti."],
        neighbours: ["Pago con la carta."],
      },
      {
        id: "con-la-carta",
        en: "can I pay by card?",
        answer: "Posso pagare con la carta?",
        accepted: ["Posso pagare con la carta?", "Posso pagare con la carta"],
        neighbours: ["Posso pagare in contanti?"],
      },
    ],
    task: {
      partner: { it: "la fruttivendola", en: "the woman running the fruit and vegetable stall" },
      setting: {
        it: "Ancora il mercato, un altro banco. Non c'è un cartello col prezzo e devi chiederlo. Hai un biglietto da dieci euro e niente monete, quindi il resto lo devi controllare.",
        en: "The market again, a different stall. There's no price label, so you have to ask. You have a ten-euro note and no coins, so you'll need to check the change.",
      },
      goal: {
        it: "Chiedi quanto costa, di' quanto ne vuoi, paga in contanti e controlla il resto.",
        en: "Ask the price, say how much you want, pay in cash and check the change.",
      },
      success: [
        "The learner asked the price with quanto costa or quanto costano, agreeing with the goods.",
        "The learner said how much they wanted.",
        "The learner said how they were paying, and the change adds up against what they handed over.",
      ],
      // The partner opens without naming a price on purpose: there is no
      // label on the stall, so the learner has to ask, which is the ability.
      opening: { it: "Buongiorno! Sono belli questi, no?", en: "Morning! Nice, aren't they?" },
    },
    correctables: [
      {
        id: "costare-accordo",
        said: "Quanto costa i pomodori?",
        better: "Quanto costano i pomodori?",
        why: "Il verbo va con la cosa: i pomodori costano.",
        stage: 1,
      },
      {
        id: "euro-plurale",
        said: "dieci euri",
        better: "dieci euro",
        why: "Euro non cambia al plurale.",
        stage: 1,
      },
      {
        id: "contanti-singolare",
        said: "in contante",
        better: "in contanti",
        why: "In italiano contanti è solo plurale.",
        stage: 1,
      },
      {
        id: "carta-articolo",
        said: "con carta",
        better: "con la carta",
        why: "Qui l'articolo serve: si paga con la carta.",
        stage: 1,
      },
      {
        id: "ne-quantita",
        said: "Voglio due chili",
        better: "Ne voglio due chili",
        why: "La cosa è già stata detta: la quantità si porta dietro ne.",
        stage: null,
      },
    ],
  },
];
