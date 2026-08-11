import { LEVEL_ACCENTS } from "../shared/theme.js";

// Graded readers: short original stories, organized by level like every
// other module. To add a story, add an object with { id, title, tagline,
// blurb, minutes, paragraphs, questions } to a level's `stories`.
//
// Each paragraph carries the Italian text, its English translation (hidden
// behind a tap-to-reveal toggle in the reader), and a `gloss` map of
// word -> meaning. The reader tokenizes the Italian at render time and
// makes any word with a gloss entry tappable, so authoring a gloss is one
// key/value pair — no markup inside the story text. Keys are matched with
// the tokenizer in src/modules/stories/gloss.js (lowercased, punctuation
// stripped, and elisions like "d'accordo" also match the bare "accordo"),
// and src/data/stories.test.js fails on any key that doesn't occur in its
// own paragraph — so a typo can't silently produce a dead gloss.
//
// Tenses are graded to match the grammar module: A1 stays in the present,
// A2 works in the passato prossimo, B1 mixes imperfetto + passato prossimo
// with longer sentences.
export const STORY_LEVELS = [
  {
    id: "A1",
    label: "A1",
    name: "Principiante",
    tagline: "First readers: a day in Rome & a Sicilian fairy tale",
    ...LEVEL_ACCENTS.A1,
    stories: [
      {
        id: "roma",
        title: "Un giorno a Roma",
        tagline: "A tourist's first day in Rome",
        blurb: "Marta's plan falls apart on the number 64 bus — and the day gets better for it.",
        minutes: 3,
        paragraphs: [
          {
            it: "Marta arriva a Roma la mattina presto. La stazione è grande e piena di gente. Lei ha una piccola valigia e una mappa della città.",
            en: "Marta arrives in Rome early in the morning. The station is big and full of people. She has a small suitcase and a map of the city.",
            gloss: {
              arriva: "arrives (arrivare)",
              stazione: "station",
              piena: "full",
              gente: "people",
              valigia: "suitcase",
              mappa: "map",
            },
          },
          {
            it: "Prima di tutto, Marta va al bar. «Un caffè, per favore» dice al barista. Il caffè costa un euro e lei lo beve in piedi, come gli italiani.",
            en: "First of all, Marta goes to the café. \"A coffee, please,\" she says to the barista. The coffee costs one euro and she drinks it standing up, like Italians do.",
            gloss: {
              bar: "café, coffee bar",
              dice: "says (dire)",
              barista: "barista",
              costa: "costs (costare)",
              beve: "drinks (bere)",
              piedi: "feet — «in piedi» means standing up",
            },
          },
          {
            it: "Poi prende l'autobus numero 64. Ma l'autobus va nella direzione sbagliata! Marta guarda fuori dal finestrino e non riconosce niente.",
            en: "Then she takes the number 64 bus. But the bus is going the wrong way! Marta looks out of the window and doesn't recognize anything.",
            gloss: {
              prende: "takes (prendere)",
              autobus: "bus",
              sbagliata: "wrong",
              guarda: "looks (guardare)",
              finestrino: "window (of a vehicle)",
              riconosce: "recognizes (riconoscere)",
            },
          },
          {
            it: "«Scusi, dove siamo?» chiede a una signora. «Siamo a Trastevere» risponde la signora con un sorriso. «Non è un problema: Trastevere è molto bello.»",
            en: "\"Excuse me, where are we?\" she asks a lady. \"We're in Trastevere,\" the lady answers with a smile. \"It's not a problem: Trastevere is very beautiful.\"",
            gloss: {
              chiede: "asks (chiedere)",
              signora: "lady, madam",
              risponde: "answers (rispondere)",
              sorriso: "smile",
            },
          },
          {
            it: "Marta scende dall'autobus. Le strade sono strette e le case sono gialle e arancioni. C'è un gatto che dorme al sole davanti a una porta verde.",
            en: "Marta gets off the bus. The streets are narrow and the houses are yellow and orange. There's a cat sleeping in the sun in front of a green door.",
            gloss: {
              scende: "gets off (scendere)",
              strade: "streets",
              strette: "narrow",
              case: "houses",
              gatto: "cat",
              dorme: "sleeps (dormire)",
              sole: "sun",
            },
          },
          {
            it: "Nel pomeriggio Marta trova la Fontana di Trevi. Ci sono molti turisti. Lei prende una moneta, chiude gli occhi e la getta nell'acqua. «Voglio tornare a Roma» pensa.",
            en: "In the afternoon Marta finds the Trevi Fountain. There are lots of tourists. She takes a coin, closes her eyes and throws it into the water. \"I want to come back to Rome,\" she thinks.",
            gloss: {
              pomeriggio: "afternoon",
              trova: "finds (trovare)",
              turisti: "tourists",
              moneta: "coin",
              occhi: "eyes",
              getta: "throws (gettare)",
              tornare: "to come back, to return",
            },
          },
          {
            it: "La sera Marta mangia un gelato al pistacchio sui gradini di una chiesa. Il cielo è rosa. Il primo giorno a Roma non va secondo il programma, ma è perfetto così.",
            en: "In the evening Marta eats a pistachio gelato on the steps of a church. The sky is pink. Her first day in Rome doesn't go according to plan, but it's perfect just as it is.",
            gloss: {
              sera: "evening",
              gelato: "ice cream",
              gradini: "steps",
              chiesa: "church",
              cielo: "sky",
              programma: "plan, programme",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Come beve il caffè Marta?",
            options: ["In piedi, come gli italiani", "Seduta a un tavolo", "In albergo", "Sull'autobus"],
            answer: "In piedi, come gli italiani",
            explain: "Italians usually drink their coffee standing at the bar — it's quicker, and cheaper than sitting down.",
          },
          {
            id: "q2",
            prompt: "Perché Marta scende a Trastevere?",
            options: [
              "Perché l'autobus va nella direzione sbagliata",
              "Perché il suo albergo è lì",
              "Perché ha fame",
              "Perché piove",
            ],
            answer: "Perché l'autobus va nella direzione sbagliata",
            explain: "The number 64 is heading the wrong way, so she ends up somewhere she never planned to go.",
          },
          {
            id: "q3",
            prompt: "What does Marta wish for at the Trevi Fountain?",
            options: ["To come back to Rome", "To find her hotel", "To meet an Italian", "To eat more gelato"],
            answer: "To come back to Rome",
            explain: "«Voglio tornare a Roma» — the traditional wish you make when you throw a coin in.",
          },
        ],
      },
      {
        id: "lucertola",
        title: "La lucertola e la luna",
        tagline: "A Sicilian fairy tale",
        blurb: "A very small lizard wants to touch the moon. An old woman knows where to find it.",
        minutes: 3,
        paragraphs: [
          {
            it: "In un piccolo paese della Sicilia vive una lucertola che si chiama Nina. Nina è molto piccola, ma ha un sogno molto grande.",
            en: "In a small village in Sicily there lives a lizard called Nina. Nina is very small, but she has a very big dream.",
            gloss: {
              paese: "village, small town",
              vive: "lives (vivere)",
              lucertola: "lizard",
              sogno: "dream",
            },
          },
          {
            it: "Ogni notte Nina guarda la luna. La luna è bianca e rotonda e sembra vicina. «Voglio toccare la luna» dice Nina.",
            en: "Every night Nina looks at the moon. The moon is white and round and it seems close. \"I want to touch the moon,\" says Nina.",
            gloss: {
              notte: "night",
              luna: "moon",
              rotonda: "round",
              sembra: "seems (sembrare)",
              vicina: "close, nearby",
              toccare: "to touch",
            },
          },
          {
            it: "Nina sale sul muro del giardino. La luna è ancora lontana. Nina sale sul tetto della casa. La luna è ancora lontana. Nina sale sull'albero più alto del paese. La luna è ancora lontana.",
            en: "Nina climbs the garden wall. The moon is still far away. Nina climbs onto the roof of the house. The moon is still far away. Nina climbs the tallest tree in the village. The moon is still far away.",
            gloss: {
              sale: "climbs (salire)",
              muro: "wall",
              giardino: "garden",
              tetto: "roof",
              albero: "tree",
              lontana: "far away",
            },
          },
          {
            it: "Nina è triste. Si siede sotto l'albero e piange. «La luna non è per le lucertole piccole» dice.",
            en: "Nina is sad. She sits down under the tree and cries. \"The moon isn't for small lizards,\" she says.",
            gloss: {
              triste: "sad",
              siede: "sits (sedersi)",
              piange: "cries (piangere)",
            },
          },
          {
            it: "Una vecchia signora del paese la sente. «Piccola Nina» dice, «la luna non abita solo nel cielo. Vieni con me.»",
            en: "An old woman from the village hears her. \"Little Nina,\" she says, \"the moon doesn't only live in the sky. Come with me.\"",
            gloss: {
              vecchia: "old",
              sente: "hears (sentire)",
              abita: "lives, dwells (abitare)",
              cielo: "sky",
              vieni: "come (venire)",
            },
          },
          {
            it: "La signora porta Nina alla fontana del paese. Nell'acqua nera c'è la luna, bianca e rotonda. Nina mette la zampa nell'acqua e tocca la luna.",
            en: "The woman takes Nina to the village fountain. In the black water there is the moon, white and round. Nina puts her paw in the water and touches the moon.",
            gloss: {
              porta: "takes, brings (portare)",
              fontana: "fountain",
              acqua: "water",
              nera: "black",
              mette: "puts (mettere)",
              zampa: "paw",
              tocca: "touches (toccare)",
            },
          },
          {
            it: "Da quella notte, ogni sera Nina va alla fontana. E in Sicilia dicono ancora: «Se vuoi la luna, non guardare in alto — guarda in basso.»",
            en: "From that night on, Nina goes to the fountain every evening. And in Sicily they still say: \"If you want the moon, don't look up — look down.\"",
            gloss: {
              quella: "that",
              dicono: "they say (dire)",
              ancora: "still",
              vuoi: "you want (volere)",
              alto: "high, up",
              basso: "low, down",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Che cosa vuole fare Nina?",
            options: ["Toccare la luna", "Trovare un'amica", "Andare a Roma", "Dormire sul tetto"],
            answer: "Toccare la luna",
            explain: "Nina's big dream is to touch the moon: «Voglio toccare la luna».",
          },
          {
            id: "q2",
            prompt: "Dove trova la luna alla fine?",
            options: [
              "Nell'acqua della fontana",
              "Sull'albero più alto",
              "Sul tetto della casa",
              "Nel giardino della vecchia signora",
            ],
            answer: "Nell'acqua della fontana",
            explain: "The old woman shows her the moon's reflection in the village fountain.",
          },
          {
            id: "q3",
            prompt: "What is the lesson of the tale?",
            options: [
              "What you long for may be closer than you think",
              "Small lizards should not have dreams",
              "You have to climb high to succeed",
              "Old people always know best",
            ],
            answer: "What you long for may be closer than you think",
            explain: "«Se vuoi la luna, non guardare in alto — guarda in basso.»",
          },
        ],
      },
    ],
  },
  {
    id: "A2",
    label: "A2",
    name: "Elementare",
    tagline: "Past-tense stories: a missed train & a letter in Verona",
    ...LEVEL_ACCENTS.A2,
    stories: [
      {
        id: "treno",
        title: "Il treno delle 6:40",
        tagline: "A missed train in Naples",
        blurb: "Three hours to kill in Napoli Centrale, a barista with a cousin, and a day nobody planned.",
        minutes: 4,
        paragraphs: [
          {
            it: "Ho perso il treno delle 6:40 per Pompei. Ho corso sul binario con lo zaino sulle spalle, ma le porte si sono chiuse davanti a me.",
            en: "I missed the 6:40 train to Pompeii. I ran along the platform with my backpack on my shoulders, but the doors closed in front of me.",
            gloss: {
              perso: "missed, lost (perdere)",
              corso: "ran (correre)",
              binario: "platform, track",
              zaino: "backpack",
              spalle: "shoulders",
              chiuse: "closed (chiudere)",
            },
          },
          {
            it: "Il treno dopo era alle nove. Tre ore di attesa nella stazione di Napoli Centrale. Ero arrabbiato: avevo un programma preciso per quel giorno.",
            en: "The next train was at nine. Three hours of waiting in Napoli Centrale station. I was angry: I had a precise plan for that day.",
            gloss: {
              dopo: "after — «il treno dopo» is the next train",
              attesa: "wait, waiting",
              arrabbiato: "angry",
              preciso: "precise",
            },
          },
          {
            it: "Sono andato al bar della stazione e ho ordinato un caffè. Il barista mi ha guardato e ha detto: «Hai perso il treno, vero? Si vede dalla faccia.»",
            en: "I went to the station café and ordered a coffee. The barista looked at me and said: \"You missed your train, didn't you? I can tell from your face.\"",
            gloss: {
              ordinato: "ordered (ordinare)",
              guardato: "looked at (guardare)",
              detto: "said (dire)",
              vero: "true — «vero?» is like \"didn't you?\"",
              faccia: "face",
            },
          },
          {
            it: "Si chiamava Ciro. Mi ha offerto una sfogliatella e mi ha chiesto perché volevo andare a Pompei. «Per vedere le rovine» ho risposto. «Tutti vogliono vedere le rovine» ha detto Ciro. «Ma oggi c'è la festa a Forcella.»",
            en: "His name was Ciro. He offered me a sfogliatella and asked me why I wanted to go to Pompeii. \"To see the ruins,\" I answered. \"Everybody wants to see the ruins,\" said Ciro. \"But today there's the festival in Forcella.\"",
            gloss: {
              offerto: "offered (offrire)",
              sfogliatella: "a shell-shaped Neapolitan pastry",
              chiesto: "asked (chiedere)",
              rovine: "ruins",
              risposto: "answered (rispondere)",
              festa: "festival, party",
            },
          },
          {
            it: "Non conoscevo Forcella. Ciro ha chiamato suo cugino Peppe e venti minuti dopo Peppe è arrivato con un motorino rosso. «Sali» ha detto.",
            en: "I didn't know Forcella. Ciro called his cousin Peppe and twenty minutes later Peppe turned up on a red scooter. \"Get on,\" he said.",
            gloss: {
              conoscevo: "I knew (conoscere)",
              chiamato: "called (chiamare)",
              cugino: "cousin",
              motorino: "scooter",
              sali: "get on, climb up (salire)",
            },
          },
          {
            it: "Abbiamo attraversato la città tra il traffico e il rumore. Nei vicoli c'erano bandiere, musica e tavoli lunghissimi in mezzo alla strada.",
            en: "We crossed the city through the traffic and the noise. In the alleys there were flags, music and very long tables in the middle of the street.",
            gloss: {
              attraversato: "crossed (attraversare)",
              rumore: "noise",
              vicoli: "alleys",
              bandiere: "flags",
              tavoli: "tables",
              mezzo: "middle",
            },
          },
          {
            it: "Ho mangiato con la famiglia di Peppe. Nessuno parlava inglese e il mio italiano era terribile, ma abbiamo riso per tutto il pomeriggio.",
            en: "I ate with Peppe's family. Nobody spoke English and my Italian was terrible, but we laughed all afternoon.",
            gloss: {
              nessuno: "nobody",
              parlava: "spoke (parlare)",
              terribile: "terrible",
              riso: "laughed (ridere)",
            },
          },
          {
            it: "Il treno delle nove è partito senza di me. Pompei è lì da duemila anni: può aspettare. Quel giorno ho imparato che i treni persi a volte portano più lontano di quelli presi.",
            en: "The nine o'clock train left without me. Pompeii has been there for two thousand years: it can wait. That day I learned that missed trains sometimes take you further than the ones you catch.",
            gloss: {
              partito: "left, departed (partire)",
              senza: "without",
              aspettare: "to wait",
              imparato: "learned (imparare)",
              volte: "times — «a volte» means sometimes",
              presi: "taken, caught (prendere)",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Perché il narratore resta alla stazione di Napoli?",
            options: [
              "Perché ha perso il treno per Pompei",
              "Perché il treno è in ritardo",
              "Perché aspetta un amico",
              "Perché vuole visitare la stazione",
            ],
            answer: "Perché ha perso il treno per Pompei",
            explain: "The doors of the 6:40 close in front of him, and the next train isn't until nine.",
          },
          {
            id: "q2",
            prompt: "Chi è Peppe?",
            options: ["Il cugino del barista", "Il fratello del narratore", "Una guida turistica", "Il capostazione"],
            answer: "Il cugino del barista",
            explain: "Ciro, the barista, phones his cousin Peppe, who arrives on a red scooter.",
          },
          {
            id: "q3",
            prompt: "What does the narrator conclude at the end?",
            options: [
              "Missed trains sometimes take you further",
              "You should always book your tickets in advance",
              "Pompeii is not worth the trip",
              "Naples is too noisy for tourists",
            ],
            answer: "Missed trains sometimes take you further",
            explain: "«I treni persi a volte portano più lontano di quelli presi.»",
          },
        ],
      },
      {
        id: "verona",
        title: "La lettera di Verona",
        tagline: "A love story by correspondence",
        blurb: "She answers an anonymous letter left on Juliet's wall. Six months later, she takes a train to Bologna.",
        minutes: 4,
        paragraphs: [
          {
            it: "L'anno scorso, in una giornata di pioggia, sono entrata nel cortile della casa di Giulietta a Verona. I muri erano coperti di lettere.",
            en: "Last year, on a rainy day, I went into the courtyard of Juliet's house in Verona. The walls were covered in letters.",
            gloss: {
              scorso: "last, past",
              pioggia: "rain",
              entrata: "entered (entrare)",
              cortile: "courtyard",
              muri: "walls",
              coperti: "covered (coprire)",
              lettere: "letters",
            },
          },
          {
            it: "Le persone lasciano lì lettere d'amore. Alcune sono felici, altre no. Ho letto una lettera senza nome: «Ho paura di dire quello che sento. Se qualcuno legge questo, mi scriva.»",
            en: "People leave love letters there. Some are happy, others aren't. I read a letter with no name on it: \"I'm afraid to say what I feel. If anyone reads this, write to me.\"",
            gloss: {
              lasciano: "leave (lasciare)",
              alcune: "some",
              letto: "read (leggere)",
              paura: "fear — «ho paura» means I'm afraid",
              sento: "I feel (sentire)",
              qualcuno: "someone",
            },
          },
          {
            it: "Non so perché, ma ho risposto. Ho scritto poche righe su un foglio del mio quaderno e le ho lasciate nello stesso posto, con il mio indirizzo email.",
            en: "I don't know why, but I answered. I wrote a few lines on a page from my notebook and left them in the same spot, with my email address.",
            gloss: {
              righe: "lines",
              foglio: "sheet of paper",
              quaderno: "notebook",
              stesso: "same",
              posto: "place, spot",
              indirizzo: "address",
            },
          },
          {
            it: "Dopo due settimane è arrivata una mail. Si chiamava Luca ed era di Bologna. Aveva scritto quella lettera un anno prima, dopo una brutta storia.",
            en: "Two weeks later an email arrived. His name was Luca and he was from Bologna. He had written that letter a year earlier, after a bad relationship.",
            gloss: {
              settimane: "weeks",
              brutta: "bad, ugly",
              storia: "story — here, a relationship",
              prima: "before, earlier",
            },
          },
          {
            it: "Abbiamo cominciato a scriverci. Lui mi raccontava dei suoi studenti — insegnava storia in una scuola — e io gli raccontavo del mio lavoro in libreria.",
            en: "We started writing to each other. He told me about his students — he taught history at a school — and I told him about my job in a bookshop.",
            gloss: {
              cominciato: "started (cominciare)",
              raccontava: "told, recounted (raccontare)",
              insegnava: "taught (insegnare)",
              scuola: "school",
              libreria: "bookshop",
            },
          },
          {
            it: "Per sei mesi non ci siamo mai visti. Solo parole. A volte penso che sia stato il periodo più onesto della mia vita.",
            en: "For six months we never saw each other. Only words. Sometimes I think it was the most honest period of my life.",
            gloss: {
              mesi: "months",
              visti: "seen (vedere)",
              parole: "words",
              periodo: "period, stretch of time",
              onesto: "honest",
              vita: "life",
            },
          },
          {
            it: "A marzo Luca ha scritto una frase sola: «Vieni a Bologna? Ti aspetto sotto le due torri, sabato alle sei.»",
            en: "In March Luca wrote a single sentence: \"Will you come to Bologna? I'll wait for you under the two towers, Saturday at six.\"",
            gloss: {
              frase: "sentence",
              sola: "single, alone",
              torri: "towers",
              sabato: "Saturday",
            },
          },
          {
            it: "Sono andata. Pioveva anche quel giorno. L'ho riconosciuto subito, anche se non avevo mai visto la sua faccia: era l'unico che non guardava il telefono.",
            en: "I went. It was raining that day too. I recognized him immediately, even though I had never seen his face: he was the only one who wasn't looking at his phone.",
            gloss: {
              pioveva: "it was raining (piovere)",
              riconosciuto: "recognized (riconoscere)",
              subito: "immediately",
              unico: "the only one",
              telefono: "phone",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Dove trova la lettera la narratrice?",
            options: [
              "Nel cortile della casa di Giulietta",
              "In una libreria di Bologna",
              "Sotto le due torri",
              "In una scuola di Verona",
            ],
            answer: "Nel cortile della casa di Giulietta",
            explain: "The courtyard of Juliet's house in Verona is famously covered in letters left by visitors.",
          },
          {
            id: "q2",
            prompt: "Quanto tempo si scrivono prima di incontrarsi?",
            options: ["Sei mesi", "Due settimane", "Un anno", "Tre giorni"],
            answer: "Sei mesi",
            explain: "«Per sei mesi non ci siamo mai visti. Solo parole.»",
          },
          {
            id: "q3",
            prompt: "How does she recognize Luca in Bologna?",
            options: [
              "He was the only one not looking at his phone",
              "He was holding her letter",
              "He had sent her a photograph",
              "He was standing with an umbrella",
            ],
            answer: "He was the only one not looking at his phone",
            explain: "«Era l'unico che non guardava il telefono» — she had never seen his face before.",
          },
        ],
      },
    ],
  },
  {
    id: "B1",
    label: "B1",
    name: "Intermedio",
    tagline: "Two mysteries: a canal in Venice & a harvest in Piedmont",
    ...LEVEL_ACCENTS.B1,
    stories: [
      {
        id: "venezia",
        title: "Nebbia sul Canal Grande",
        tagline: "A murder mystery in Venice",
        blurb: "A body by the Rialto at dawn, a hotel full of tourists, and a detective who keeps staring at the victim's shoes.",
        minutes: 5,
        paragraphs: [
          {
            it: "La nebbia di novembre copriva Venezia come una coperta bagnata. Erano le sei del mattino quando Tonino Basso, gondoliere da trent'anni, ha visto qualcosa galleggiare vicino al ponte di Rialto.",
            en: "The November fog covered Venice like a wet blanket. It was six in the morning when Tonino Basso, a gondolier for thirty years, saw something floating near the Rialto bridge.",
            gloss: {
              nebbia: "fog",
              copriva: "covered (coprire)",
              coperta: "blanket",
              bagnata: "wet",
              gondoliere: "gondolier",
              galleggiare: "to float",
              ponte: "bridge",
            },
          },
          {
            it: "Non era un sacco della spazzatura, come aveva pensato all'inizio. Era un uomo, con un cappotto grigio e le scarpe ancora ai piedi.",
            en: "It wasn't a bag of rubbish, as he had thought at first. It was a man, in a grey overcoat, with his shoes still on his feet.",
            gloss: {
              sacco: "bag, sack",
              spazzatura: "rubbish, garbage",
              inizio: "beginning",
              cappotto: "overcoat",
              scarpe: "shoes",
            },
          },
          {
            it: "Il commissario Elena Marchetti è arrivata quaranta minuti dopo. Il morto si chiamava Andrew Fenwick, quarantasei anni, inglese, ospite dell'Hotel Danieli da quattro giorni.",
            en: "Inspector Elena Marchetti arrived forty minutes later. The dead man's name was Andrew Fenwick, forty-six, English, a guest at the Hotel Danieli for four days.",
            gloss: {
              commissario: "police inspector",
              morto: "dead man",
              ospite: "guest",
            },
          },
          {
            it: "«Ubriaco» ha detto il suo assistente. «È caduto in acqua. Succede due o tre volte all'anno.» Elena non ha risposto. Guardava le scarpe del morto.",
            en: "\"Drunk,\" said her assistant. \"He fell in the water. It happens two or three times a year.\" Elena didn't answer. She was looking at the dead man's shoes.",
            gloss: {
              ubriaco: "drunk",
              caduto: "fallen (cadere)",
              succede: "it happens (succedere)",
              risposto: "answered (rispondere)",
              guardava: "was looking at (guardare)",
            },
          },
          {
            it: "In albergo dicevano tutti la stessa cosa: il signor Fenwick era gentile, tranquillo, sempre solo. Comprava antiquariato. La sera prima aveva cenato con un uomo che nessuno conosceva.",
            en: "At the hotel they all said the same thing: Mr Fenwick was kind, quiet, always alone. He bought antiques. The evening before, he had had dinner with a man nobody knew.",
            gloss: {
              albergo: "hotel",
              gentile: "kind",
              tranquillo: "quiet",
              antiquariato: "antiques",
              cenato: "had dinner (cenare)",
              conosceva: "knew (conoscere)",
            },
          },
          {
            it: "Tonino il gondoliere ha ricordato un dettaglio: verso mezzanotte aveva sentito due voci discutere in un rio laterale. Una parlava inglese. L'altra parlava veneziano.",
            en: "Tonino the gondolier remembered one detail: around midnight he had heard two voices arguing in a side canal. One spoke English. The other spoke Venetian.",
            gloss: {
              ricordato: "remembered (ricordare)",
              dettaglio: "detail",
              mezzanotte: "midnight",
              voci: "voices",
              discutere: "to argue",
              rio: "a small canal (Venetian word)",
            },
          },
          {
            it: "Elena è tornata alle scarpe. Erano pulite. Asciutte sotto, pulite sopra. Un uomo ubriaco che cammina per Venezia alle due di notte, con la nebbia e l'acqua alta, non ha le scarpe pulite.",
            en: "Elena went back to the shoes. They were clean. Dry underneath, clean on top. A drunk man walking through Venice at two in the morning, in the fog and the high water, does not have clean shoes.",
            gloss: {
              pulite: "clean",
              asciutte: "dry",
              sotto: "underneath, below",
              cammina: "walks (camminare)",
              alta: "high — «acqua alta» is Venice's tidal flooding",
            },
          },
          {
            it: "Qualcuno lo aveva portato al canale. Qualcuno con una barca.",
            en: "Someone had brought him to the canal. Someone with a boat.",
            gloss: {
              portato: "carried, taken (portare)",
              barca: "boat",
            },
          },
          {
            it: "Il registro delle vendite di un negozio di antiquariato a San Polo ha dato un nome: Matteo Guerra, che tre giorni prima aveva venduto a Fenwick un dipinto per ottantamila euro. Un dipinto falso.",
            en: "The sales register of an antique shop in San Polo gave a name: Matteo Guerra, who three days earlier had sold Fenwick a painting for eighty thousand euros. A fake painting.",
            gloss: {
              registro: "register, log book",
              vendite: "sales",
              negozio: "shop",
              venduto: "sold (vendere)",
              dipinto: "painting",
              falso: "fake",
            },
          },
          {
            it: "Fenwick se n'era accorto. Aveva chiesto i soldi indietro. Guerra aveva preferito il canale. La nebbia si è alzata verso le undici, e a quell'ora Elena aveva già il mandato in tasca.",
            en: "Fenwick had realized. He had asked for his money back. Guerra had preferred the canal. The fog lifted around eleven, and by then Elena already had the warrant in her pocket.",
            gloss: {
              accorto: "realized — «accorgersi» to notice",
              soldi: "money",
              indietro: "back",
              preferito: "preferred (preferire)",
              alzata: "lifted, risen (alzarsi)",
              mandato: "warrant",
              tasca: "pocket",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Quale dettaglio convince Elena che non è stato un incidente?",
            options: [
              "Le scarpe del morto erano pulite e asciutte",
              "Il cappotto grigio era troppo elegante",
              "Il morto era inglese",
              "C'era troppa nebbia sul canale",
            ],
            answer: "Le scarpe del morto erano pulite e asciutte",
            explain: "Un uomo ubriaco che cammina di notte con l'acqua alta non può avere le scarpe pulite: quindi al canale non ci è arrivato a piedi.",
          },
          {
            id: "q2",
            prompt: "Che cosa aveva comprato Fenwick da Matteo Guerra?",
            options: ["Un dipinto falso", "Una gondola", "Un appartamento a San Polo", "Un libro antico"],
            answer: "Un dipinto falso",
            explain: "Un dipinto pagato ottantamila euro, che però era falso: è il movente (the motive) dell'omicidio.",
          },
          {
            id: "q3",
            prompt: "Perché è importante quello che ha sentito Tonino?",
            options: [
              "Due voci discutevano a mezzanotte, una in inglese e una in veneziano",
              "Ha visto la barca dell'assassino",
              "Conosceva bene Fenwick",
              "Lavorava all'Hotel Danieli",
            ],
            answer: "Due voci discutevano a mezzanotte, una in inglese e una in veneziano",
            explain: "La testimonianza collega Fenwick a un veneziano poche ore prima della morte.",
          },
        ],
      },
      {
        id: "vendemmia",
        title: "L'ultima vendemmia",
        tagline: "A death during the grape harvest",
        blurb: "An old winemaker dies in his cellar three days into the harvest. His granddaughter reads his notebooks.",
        minutes: 5,
        paragraphs: [
          {
            it: "La vendemmia era cominciata da tre giorni quando hanno trovato Ottavio Ferrero nella cantina, tra le botti, con la testa contro il cemento.",
            en: "The harvest had been under way for three days when they found Ottavio Ferrero in the cellar, among the barrels, his head against the concrete.",
            gloss: {
              vendemmia: "grape harvest",
              cominciata: "begun (cominciare)",
              cantina: "cellar, winery",
              botti: "barrels",
              testa: "head",
              cemento: "concrete",
            },
          },
          {
            it: "Aveva ottantun anni e mezza collina di Barbaresco. Nessuno in famiglia ha pianto molto.",
            en: "He was eighty-one and owned half a hillside of Barbaresco. Nobody in the family cried much.",
            gloss: {
              collina: "hill, hillside",
              nessuno: "nobody",
              pianto: "cried (piangere)",
            },
          },
          {
            it: "I carabinieri hanno parlato di incidente. Il vecchio scendeva in cantina ogni mattina alle cinque, da solo, con una lampadina sola e le scale di pietra bagnate.",
            en: "The Carabinieri called it an accident. The old man went down to the cellar every morning at five, alone, with a single bulb and wet stone steps.",
            gloss: {
              carabinieri: "the Carabinieri, one of Italy's police forces",
              incidente: "accident",
              scendeva: "went down (scendere)",
              lampadina: "light bulb",
              scale: "stairs, steps",
              pietra: "stone",
            },
          },
          {
            it: "Ma la nipote, Chiara, non era d'accordo. Era tornata da Torino per la vendemmia, come ogni anno, e conosceva il nonno meglio di tutti.",
            en: "But his granddaughter, Chiara, disagreed. She had come back from Turin for the harvest, as she did every year, and knew her grandfather better than anyone.",
            gloss: {
              nipote: "granddaughter (also: niece, grandson, nephew)",
              accordo: "agreement — «d'accordo» means in agreement",
              tornata: "returned (tornare)",
              nonno: "grandfather",
              meglio: "better",
            },
          },
          {
            it: "«Il nonno aveva paura del buio in cantina» ha detto. «Non scendeva mai senza accendere tutte le luci. E quella mattina la luce grande era spenta.»",
            en: "\"Grandfather was afraid of the dark in the cellar,\" she said. \"He never went down without switching on all the lights. And that morning the big light was off.\"",
            gloss: {
              buio: "dark, darkness",
              accendere: "to switch on",
              luci: "lights",
              spenta: "switched off (spegnere)",
            },
          },
          {
            it: "La settimana prima, Ottavio aveva chiamato il notaio. Voleva cambiare il testamento: la cantina non sarebbe andata ai due figli, ma a Chiara.",
            en: "The week before, Ottavio had called the notary. He wanted to change his will: the winery would not go to his two children, but to Chiara.",
            gloss: {
              notaio: "notary",
              cambiare: "to change",
              testamento: "will, testament",
              figli: "children, sons",
            },
          },
          {
            it: "I due figli lo sapevano. Marco, il maggiore, aveva debiti. Renata, la seconda, aveva già un compratore francese per la collina.",
            en: "The two children knew. Marco, the elder, had debts. Renata, the second, already had a French buyer for the hillside.",
            gloss: {
              sapevano: "knew (sapere)",
              maggiore: "the elder, the eldest",
              debiti: "debts",
              compratore: "buyer",
            },
          },
          {
            it: "Chiara ha passato tre notti a leggere i quaderni del nonno. Ottavio scriveva tutto: il tempo, lo zucchero dell'uva, chi entrava in cantina.",
            en: "Chiara spent three nights reading her grandfather's notebooks. Ottavio wrote everything down: the weather, the sugar in the grapes, who came into the cellar.",
            gloss: {
              quaderni: "notebooks",
              tempo: "weather (also: time)",
              zucchero: "sugar",
              uva: "grapes",
              entrava: "entered (entrare)",
            },
          },
          {
            it: "L'ultima pagina era del giorno della morte, scritta alle quattro e mezza del mattino: «Renata è venuta a chiedermi ancora. Le ho detto di no. Adesso scende in cantina con me.»",
            en: "The last page was from the day of his death, written at half past four in the morning: \"Renata came to ask me again. I told her no. Now she is coming down to the cellar with me.\"",
            gloss: {
              pagina: "page",
              morte: "death",
              chiedermi: "to ask me (chiedere + mi)",
              adesso: "now",
              scende: "she is coming down (scendere)",
            },
          },
          {
            it: "Renata dice ancora oggi che il padre è caduto. Ma quell'anno il vino è stato eccellente, e Chiara lo ha imbottigliato da sola, con l'etichetta che il nonno aveva disegnato: L'ultima vendemmia.",
            en: "Renata still says today that her father fell. But that year the wine was excellent, and Chiara bottled it on her own, with the label her grandfather had drawn: The Last Harvest.",
            gloss: {
              caduto: "fallen (cadere)",
              vino: "wine",
              eccellente: "excellent",
              imbottigliato: "bottled (imbottigliare)",
              etichetta: "label",
              disegnato: "drawn, designed (disegnare)",
            },
          },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Perché Chiara non crede all'incidente?",
            options: [
              "Il nonno non scendeva mai in cantina al buio",
              "Il nonno non beveva mai vino",
              "La cantina era chiusa a chiave",
              "Il nonno era troppo giovane per cadere",
            ],
            answer: "Il nonno non scendeva mai in cantina al buio",
            explain: "Ottavio aveva paura del buio e accendeva sempre tutte le luci; quella mattina però la luce grande era spenta.",
          },
          {
            id: "q2",
            prompt: "Che cosa voleva fare Ottavio la settimana prima di morire?",
            options: [
              "Cambiare il testamento a favore di Chiara",
              "Vendere la collina a un compratore francese",
              "Pagare i debiti di Marco",
              "Disegnare una nuova etichetta",
            ],
            answer: "Cambiare il testamento a favore di Chiara",
            explain: "Aveva chiamato il notaio: la cantina sarebbe andata alla nipote e non ai due figli — ed entrambi lo sapevano.",
          },
          {
            id: "q3",
            prompt: "Che cosa rivela l'ultima pagina del quaderno?",
            options: [
              "Che Renata è scesa in cantina con il padre quella mattina",
              "Che Marco aveva già pagato i suoi debiti",
              "Che il nonno stava male da settimane",
              "Che la vendemmia era finita in anticipo",
            ],
            answer: "Che Renata è scesa in cantina con il padre quella mattina",
            explain: "Ottavio annotava chi entrava in cantina: l'ultima riga mette Renata accanto a lui alle quattro e mezza del mattino.",
          },
        ],
      },
    ],
  },
];
