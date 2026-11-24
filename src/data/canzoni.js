// Le Canzoni — songs for the non-graded sing-along screen.
//
// A song here is a public-domain recording plus its lyric lines, with the
// option to show English under every line. It is not a lesson and nothing on
// it is scored; it is the one place in the app where the learner hears Italy
// sung rather than explained.
//
// ── Why this song, and why it is legally safe ───────────────────────────────
// "Funiculì, Funiculà" (1880): music Luigi Denza (1846-1922), words Peppino
// Turco (1846-1903). Both authors died over a century ago, so the work is
// public domain under life+70 (English Wikipedia: public domain since
// 1 January 1993, counted from Denza's death). It was chosen over 'O sole mio,
// which is still in copyright in the EU after the 2002 Mazzucchi
// co-authorship ruling. The recording is a 1906 performance by Francesco
// Daddi, Wikimedia Commons, licence pd. See `provenance` on the entry.
//
// ── Where the text came from, and how far it is verified ────────────────────
// The text was checked against the Neapolitan lyrics transcribed in English
// Wikipedia's "Funiculì, Funiculà" article (fetched 2026-11-17), which cites
// Bivona, 2013. That is a SECONDARY transcription. The public-domain editions
// the brief named (IMSLP, G. Schirmer c. 1904; ChoralWiki/CPDL) both sit behind
// bot challenges and could not be fetched from the command line, so the
// orthography below has NOT been compared against a scan of a printed edition.
// Someone with a browser should compare it with the IMSLP/CPDL score before
// release. The one place this file departs from the transcription: it prints
// "Addò" with a grave where the transcription has "Addó" once, because the
// same word is "Addò" everywhere else in that text.
//
// ── What is NOT established ─────────────────────────────────────────────────
// Which verses the 1906 recording actually contains is UNVERIFIED. Nobody has
// listened to it. These lines are the canonical text of the song; whether the
// Daddi take sings all three stanzas, omits one, or repeats the refrain
// between them is unconfirmed until the timing pass.
//
// `start` is null on every line for the same reason: no timing has been
// measured, so none is printed. Do not interpolate it from `duration` and the
// line count. A timing-capture pass fills these in.
//
// ── It is Neapolitan, not Italian ───────────────────────────────────────────
// The `language` is "nap" and the orthography is Neapolitan on purpose. Do not
// "correct" it toward Italian: `jamme` is not a misspelt `andiamo`. Where the
// gap between the two is the interesting part, the line carries `it`, the
// standard-Italian equivalent, so a learner of Italian can see what they are
// looking at. `it` is omitted where an equivalent would add nothing (the
// funiculì, funiculà hook).
//
// What a learner of Italian will meet in these lines:
//   - Initial `j` for Italian `i`/`gi`/`v`: `jamme` (andiamo), `jà` (dai).
//   - `nc-` for `c-`: `nc'è` is `ci è`.
//   - `-ie-`/`-uo-` diphthongs: `viento` (vento), `attuorno` (intorno).
//   - `lo`/`la` as the article before a masculine noun: `lo fuoco`, `lo
//     viento`, where Italian has `il fuoco`, `il vento`.
//   - `'ncoppa` (sopra/su), `'ncielo` (in cielo): the apostrophe marks the
//     lost first syllable `in-`.
//   - `po'`, `sulo`, `saje`: Italian `poi`, `solo`, `sai`.
//   - `me ne sagliette` for `me ne salii`: an `-ette` perfect, the Neapolitan
//     counterpart of the Italian passato remoto.
//   - `né` here is an interjection (roughly "hey"), NOT the Italian
//     conjunction `né` ("nor"), and not Polish `nie`.
//
// ── Shape of an entry ───────────────────────────────────────────────────────
//   id, title, year   plain
//   language          BCP-47; "nap", never "it"; the screen sets lang= from it
//   languageName      what the learner reads
//   credits           music / words, with dates
//   audio.src         path under public/; duration is the Commons API figure
//   provenance        plain strings; what was checked, where, and what was not
//   lines[]           { nap, en, pl, it?, start }
//                       nap    the sung phrase, in Neapolitan
//                       en, pl glosses. Polish is its own translation, not a
//                              relay of the English: it is the first-class
//                              layer for this app's learner.
//                       it     standard-Italian equivalent; optional
//                       start  seconds into the recording, or null (always
//                              null until measured)
//
// A line is a couplet as it is sung: the printed text repeats its last phrase
// in parentheses as an echo (`tu saje addò? (Tu saje addò?)`), and the echo is
// not a separate line here. The refrain is given once, in full, after stanza
// one; the printed text calls for it again after stanzas two and three and
// this file does not repeat it, since a repeated line would need a second
// timing and nobody has heard the recording to say where the repeats fall.
//
// One gloss is not certain: `nu taluorno` (last line). It reads as "one
// refrain / one and the same tune"; the exact dictionary sense of `taluorno`
// was not confirmed against a Neapolitan dictionary. The English and Polish
// keep to the sense the sentence needs ("the same song over and over") and do
// not claim a literal rendering.

export const CANZONI = [
  {
    id: "funiculi-funicula",
    title: "Funiculì, Funiculà",
    year: 1880,
    language: "nap",
    languageName: "Napoletano",
    credits: {
      music: "Luigi Denza (1846–1922)",
      words: "Peppino Turco (1846–1903)",
    },
    audio: {
      src: "audio/funiculi-funicula-1906.mp3",
      duration: 142.34,
      recorded: "1906-02-16",
      performer: "Francesco Daddi",
    },
    provenance: {
      recording:
        "Wikimedia Commons, 'Funiculì Funiculà Daddi 3569e.ogg' (1906-02-16, Francesco Daddi, tenor, with piano)",
      licence: "Public domain",
      attributionRequired: "No",
      commonsApi:
        "License: pd; AttributionRequired: false; duration 142.34 s (as reported by the Commons API)",
      workStatus:
        "Public domain: Luigi Denza died 1922, Peppino Turco died 1903; life+70 expired",
      textCheckedAgainst:
        "English Wikipedia, 'Funiculì, Funiculà', section 'Original Neapolitan lyrics' (cites Bivona, 2013), https://en.wikipedia.org/wiki/Funicul%C3%AC,_Funicul%C3%A0, fetched 2026-11-17",
      textNotCheckedAgainst:
        "IMSLP (G. Schirmer, c. 1904) and ChoralWiki/CPDL: both blocked automated fetching; compare by hand before release",
      recordingContent:
        "Unverified: which verses the 1906 take contains has not been confirmed by listening",
      timing: "Unmeasured: every line's start is null until a timing pass",
    },
    lines: [
      // ── Stanza 1 ──
      {
        nap: "Aissera, Nanniné, me ne sagliette, tu saje addò?",
        en: "Last night, Nannì, I went up. Do you know where?",
        pl: "Wczoraj wieczorem, Nannino, wspiąłem się na górę. Wiesz dokąd?",
        it: "Ieri sera, Nannina, me ne salii. Sai dove?",
        start: null,
      },
      {
        nap: "Addò 'sto core 'ngrato cchiù dispietto farme nun pò!",
        en: "Where this ungrateful heart can no longer spite me!",
        pl: "Tam, gdzie to niewdzięczne serce nie może mi już dokuczyć!",
        it: "Dove questo cuore ingrato più dispetto farmi non può!",
        start: null,
      },
      {
        nap: "Addò lo fuoco coce, ma se fuje, te lassa sta!",
        en: "Where the fire burns, but if you run away, it lets you be!",
        pl: "Tam, gdzie ogień pali, ale jeśli uciekniesz, zostawi cię w spokoju!",
        it: "Dove il fuoco brucia, ma se fuggi, ti lascia stare!",
        start: null,
      },
      {
        nap: "E nun te corre appriesso, nun te struje, sulo a guardà!",
        en: "It doesn't chase you or consume you, just from looking!",
        pl: "Nie biegnie za tobą i nie niszczy cię, wystarczy tylko patrzeć!",
        it: "E non ti corre dietro, non ti distrugge, solo a guardare!",
        start: null,
      },
      // ── Refrain ──
      {
        nap: "Jamme, jamme 'ncoppa, jamme jà,",
        en: "Let's go, let's go up, come on!",
        pl: "Chodźmy, chodźmy na górę, no chodźmy!",
        it: "Andiamo, andiamo su, andiamo, dai,",
        start: null,
      },
      {
        nap: "funiculì, funiculà, funiculì, funiculà,",
        en: "Funiculì, funiculà (the funicular itself, sung as a hook)",
        pl: "Funiculì, funiculà (sama kolejka linowa, śpiewana jak przyśpiewka)",
        start: null,
      },
      {
        nap: "'ncoppa, jamme jà, funiculì, funiculà!",
        en: "Up, come on, let's go: funiculì, funiculà!",
        pl: "Na górę, no chodźmy: funiculì, funiculà!",
        it: "Su, andiamo, dai: funiculì, funiculà!",
        start: null,
      },
      // ── Stanza 2 ──
      {
        nap: "Né, jamme da la terra a la montagna, nu passo nc'è!",
        en: "Hey, let's go from the ground to the mountain: it's one step!",
        pl: "Hej, chodźmy z ziemi na górę, to tylko jeden krok!",
        it: "Dai, andiamo dalla terra alla montagna, c'è un passo solo!",
        start: null,
      },
      {
        nap: "Se vède Francia, Proceta e la Spagna... Io veco a tte!",
        en: "You can see France, Procida and Spain... and I see you!",
        pl: "Widać Francję, Procidę i Hiszpanię... a ja widzę ciebie!",
        it: "Si vede la Francia, Procida e la Spagna... io vedo te!",
        start: null,
      },
      {
        nap: "Tirato co la fune, ditto 'nfatto, 'ncielo se va!",
        en: "Pulled by the cable, no sooner said than done, up to the sky we go!",
        pl: "Ciągnięci liną, ledwo powiedziane, już zrobione, jedziemy do nieba!",
        it: "Tirati con la fune, detto fatto, in cielo si va!",
        start: null,
      },
      {
        nap: "Se va comm' 'a lo viento a l'intrasatto, guè, saglie, sà!",
        en: "We go like the wind, all of a sudden. Hey, climb, up!",
        pl: "Mkniemy jak wiatr, nagle. Hej, w górę, w górę!",
        it: "Si va come il vento all'improvviso, ehi, sali, su!",
        start: null,
      },
      // ── Stanza 3 ──
      {
        nap: "Se n'è sagliuta, oje né, se n'è sagliuta, la capa già!",
        en: "It has gone up, oh yes, it has gone up: my head already!",
        pl: "Poszła w górę, oj tak, poszła w górę: głowa już!",
        it: "Se n'è salita, ehi, se n'è salita, la testa già!",
        start: null,
      },
      {
        nap: "È gghiuta, po' è turnata, po' è venuta, sta sempe ccà!",
        en: "It went, then it came back, then it came, it's always here!",
        pl: "Poszła, potem wróciła, potem przyszła, wciąż tu jest!",
        it: "È andata, poi è tornata, poi è venuta, sta sempre qua!",
        start: null,
      },
      {
        nap: "La capa vota, vota, attuorno, attuorno, attuorno a tte!",
        en: "My head spins and spins, around, around, around you!",
        pl: "Głowa kręci się i kręci, wokół, wokół, wokół ciebie!",
        it: "La testa gira, gira, intorno, intorno, intorno a te!",
        start: null,
      },
      {
        nap: "'Sto core canta sempe nu taluorno: Sposamme, oje né!",
        en: "This heart always sings the same tune: Let's get married, hey!",
        pl: "To serce wciąż śpiewa jedną i tę samą melodię: Pobierzmy się, hej!",
        it: "Questo cuore canta sempre lo stesso ritornello: Sposiamoci, ehi!",
        start: null,
      },
    ],
  },
];
