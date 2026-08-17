import { LEVEL_ACCENTS } from "../shared/theme.js";

// Guided dialogues: at each of your turns you pick between a more formal
// and a more casual way to say the same thing, and get light feedback on
// the register. The dialogue itself stays linear — only the phrasing you
// pick changes, not the story — so there's no "wrong" answer, just style.
// `them: null` on the first step means you open the conversation.
export const CONVERSATION_LEVELS = [
  {
    id: "A1",
    label: "A1",
    name: "Principiante",
    tagline: "First conversations: café & introductions",
    ...LEVEL_ACCENTS.A1,
    dialogues: [
      {
        id: "cafe",
        title: "At the café",
        tagline: "Order a coffee and pay",
        speakerName: "Barista",
        steps: [
          {
            them: { it: "Buongiorno! Cosa desidera?", en: "Good morning! What would you like?" },
            options: [
              { tone: "formal", it: "Vorrei un cappuccino, per favore.", en: "I'd like a cappuccino, please.", feedback: "Polite and natural — \"vorrei\" is the standard way to order politely." },
              { tone: "casual", it: "Un cappuccino, grazie.", en: "A cappuccino, thanks.", feedback: "Casual but friendly — perfectly fine for a quick order." },
            ],
          },
          {
            them: { it: "Subito. Da bere qualcos'altro?", en: "Right away. Anything else to drink?" },
            options: [
              { tone: "formal", it: "No, grazie, va bene così.", en: "No, thank you, that's fine.", feedback: "A polite way to close the order." },
              { tone: "casual", it: "No, basta così.", en: "No, that's enough.", feedback: "Quick and casual — a little blunt with someone you don't know." },
            ],
          },
          {
            them: { it: "Ecco a lei. Sono due euro.", en: "Here you go. That's two euros." },
            options: [
              { tone: "formal", it: "Ecco a lei, grazie mille.", en: "Here you go, thank you very much.", feedback: "Warm and polite — a nice way to close a transaction." },
              { tone: "casual", it: "Grazie, tenga il resto.", en: "Thanks, keep the change.", feedback: "Casual and generous — common when rounding up." },
            ],
          },
        ],
      },
      {
        id: "new-friend",
        title: "Meeting someone new",
        tagline: "Introduce yourself at a party",
        speakerName: "Sofia",
        steps: [
          {
            them: { it: "Ciao! Non ci siamo mai visti. Come ti chiami?", en: "Hi! We haven't met. What's your name?" },
            options: [
              { tone: "formal", it: "Piacere, mi chiamo Marco.", en: "Nice to meet you, my name is Marco.", feedback: "The standard polite way to introduce yourself." },
              { tone: "casual", it: "Ciao, sono Marco.", en: "Hi, I'm Marco.", feedback: "Relaxed and friendly — great for a casual party." },
            ],
          },
          {
            them: { it: "Piacere, Marco! Di dove sei?", en: "Nice to meet you, Marco! Where are you from?" },
            options: [
              { tone: "formal", it: "Sono di Londra, e lei di dov'è?", en: "I'm from London, and where are you from?", feedback: "Grammatically polite, but \"lei\" actually sounds a bit stiff at a party." },
              { tone: "casual", it: "Sono di Londra, e tu?", en: "I'm from London, and you?", feedback: "Natural here — \"tu\" matches the friendly setting." },
            ],
          },
          {
            them: { it: "Bello! Ti piace l'Italia?", en: "Nice! Do you like Italy?" },
            options: [
              { tone: "formal", it: "Sì, mi piace moltissimo, grazie.", en: "Yes, I like it very much, thank you.", feedback: "Warm and complete — always a safe, polite answer." },
              { tone: "casual", it: "Sì, mi piace un sacco!", en: "Yes, I like it a ton!", feedback: "Enthusiastic and casual — \"un sacco\" is common slang for \"a lot\"." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "A2",
    label: "A2",
    name: "Elementare",
    tagline: "Everyday errands: directions & dining",
    ...LEVEL_ACCENTS.A2,
    dialogues: [
      {
        id: "directions",
        title: "Asking for directions",
        tagline: "Find your way to the station",
        speakerName: "Passerby",
        steps: [
          {
            them: null,
            options: [
              { tone: "formal", it: "Mi scusi, sa dov'è la stazione?", en: "Excuse me, do you know where the station is?", feedback: "\"Mi scusi\" + the \"lei\" form is ideal with a stranger." },
              { tone: "casual", it: "Scusa, sai dov'è la stazione?", en: "Excuse me, do you know where the station is?", feedback: "The \"tu\" form — fine with someone your age, less so with an elder stranger." },
            ],
          },
          {
            them: { it: "Certo! Vada dritto e giri a destra.", en: "Sure! Go straight and turn right." },
            options: [
              { tone: "formal", it: "Grazie mille, molto gentile.", en: "Thank you very much, very kind of you.", feedback: "Polite and warm — a nice way to thank someone for help." },
              { tone: "casual", it: "Grazie mille!", en: "Thanks a lot!", feedback: "Simple and friendly — works well too." },
            ],
          },
          {
            them: { it: "Prego, buona giornata!", en: "You're welcome, have a good day!" },
            options: [
              { tone: "formal", it: "Anche a lei, arrivederci.", en: "You too, goodbye.", feedback: "A formal closing that matches the \"lei\" used earlier." },
              { tone: "casual", it: "Anche a te, ciao!", en: "You too, bye!", feedback: "Casual closing — friendly and quick." },
            ],
          },
        ],
      },
      {
        id: "restaurant",
        title: "At the restaurant",
        tagline: "Order dinner and ask for the bill",
        speakerName: "Waiter",
        steps: [
          {
            them: { it: "Buonasera, avete prenotato?", en: "Good evening, do you have a reservation?" },
            options: [
              { tone: "formal", it: "Sì, un tavolo per due, a nome Rossi.", en: "Yes, a table for two, under the name Rossi.", feedback: "Clear and polite — exactly what's expected at a restaurant." },
              { tone: "casual", it: "Sì, per due, grazie.", en: "Yes, for two, thanks.", feedback: "Shorter and casual — still gets the job done." },
            ],
          },
          {
            them: { it: "Perfetto, prego, seguitemi. Cosa desiderate da bere?", en: "Perfect, please follow me. What would you like to drink?" },
            options: [
              { tone: "formal", it: "Vorremmo dell'acqua e una bottiglia di vino, per favore.", en: "We'd like some water and a bottle of wine, please.", feedback: "A polite plural request — appropriate for a nice restaurant." },
              { tone: "casual", it: "Due acque, grazie.", en: "Two waters, thanks.", feedback: "Quick and casual — perfectly normal too." },
            ],
          },
          {
            them: { it: "Ecco il conto, quando volete.", en: "Here's the bill, whenever you're ready." },
            options: [
              { tone: "formal", it: "Grazie, possiamo pagare con carta?", en: "Thank you, can we pay by card?", feedback: "Polite and practical — a very common way to ask." },
              { tone: "casual", it: "Grazie, con carta va bene?", en: "Thanks, is card okay?", feedback: "Casual phrasing — friendly and still clear." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "B1",
    label: "B1",
    name: "Intermedio",
    tagline: "Real-life talk: making plans & interviews",
    ...LEVEL_ACCENTS.B1,
    dialogues: [
      {
        id: "plans",
        title: "Making plans with a friend",
        tagline: "Suggest an activity and agree on a time",
        speakerName: "Giulia",
        steps: [
          {
            them: { it: "Ehi, che fai sabato? Ti va di uscire?", en: "Hey, what are you doing Saturday? Feel like going out?" },
            options: [
              { tone: "casual", it: "Sì, mi va benissimo! Cosa vuoi fare?", en: "Yes, sounds great! What do you want to do?", feedback: "Enthusiastic and casual — matches the friendly tone of the question." },
              { tone: "formal", it: "Volentieri, cosa avevi in mente?", en: "Gladly, what did you have in mind?", feedback: "A touch more composed — still friendly, just less exclamatory." },
            ],
          },
          {
            them: { it: "Che ne dici di andare al cinema?", en: "What do you say about going to the movies?" },
            options: [
              { tone: "casual", it: "Perfetto, adoro il cinema!", en: "Perfect, I love the movies!", feedback: "Warm and casual — great energy for a friend." },
              { tone: "formal", it: "Mi sembra un'ottima idea.", en: "That seems like a great idea to me.", feedback: "A more reserved phrasing — still positive, just less exclamatory." },
            ],
          },
          {
            them: { it: "Alle otto ti va bene?", en: "Is eight o'clock okay for you?" },
            options: [
              { tone: "casual", it: "Perfetto, ci vediamo alle otto!", en: "Perfect, see you at eight!", feedback: "Casual and upbeat — natural for confirming plans with a friend." },
              { tone: "formal", it: "Sì, alle otto va benissimo, grazie.", en: "Yes, eight works great, thank you.", feedback: "Politer close — fine, but a touch stiff among close friends." },
            ],
          },
        ],
      },
      {
        id: "interview",
        title: "Job interview small talk",
        tagline: "Talk about your work experience",
        speakerName: "Interviewer",
        steps: [
          {
            them: { it: "Buongiorno, mi parli un po' di lei.", en: "Good morning, tell me a bit about yourself." },
            options: [
              { tone: "formal", it: "Buongiorno, ho lavorato per tre anni nel marketing.", en: "Good morning, I've worked for three years in marketing.", feedback: "Professional and to the point — appropriate for an interview." },
              { tone: "casual", it: "Salve, ho fatto un po' di marketing.", en: "Hi, I've done some marketing.", feedback: "Too casual for an interview — aim for something more precise and confident." },
            ],
          },
          {
            them: { it: "Interessante. Perché vuole lavorare con noi?", en: "Interesting. Why do you want to work with us?" },
            options: [
              { tone: "formal", it: "Apprezzo molto i valori della vostra azienda.", en: "I really appreciate your company's values.", feedback: "Professional and thoughtful — a strong interview answer." },
              { tone: "casual", it: "Mi sembra un posto fico.", en: "It seems like a cool place.", feedback: "Way too casual for an interview — best avoided here." },
            ],
          },
          {
            them: { it: "Ha domande per me?", en: "Do you have any questions for me?" },
            options: [
              { tone: "formal", it: "Sì, come sono strutturati i team?", en: "Yes, how are the teams structured?", feedback: "A thoughtful, professional question — a great way to end the interview." },
              { tone: "casual", it: "No, direi che è tutto chiaro.", en: "No, I'd say everything's clear.", feedback: "Fine, but asking a question usually leaves a stronger impression." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "B2",
    label: "B2",
    name: "Superiore",
    tagline: "Awkward conversations: complaints & disagreement",
    ...LEVEL_ACCENTS.B2,
    dialogues: [
      {
        id: "landlord",
        title: "A problem with the flat",
        tagline: "Report a broken boiler to your landlord",
        speakerName: "Sig. Bianchi",
        steps: [
          {
            them: null,
            options: [
              { tone: "formal", it: "Buongiorno, la disturbo per un problema con la caldaia.", en: "Good morning, sorry to bother you about a problem with the boiler.", feedback: "«La disturbo per…» is the classic polite phone opener — it acknowledges you're interrupting before you ask for anything." },
              { tone: "casual", it: "Salve, senta, la caldaia non funziona.", en: "Hello, listen, the boiler isn't working.", feedback: "«Senta» is direct without being rude — fine with a landlord you already deal with regularly." },
            ],
          },
          {
            them: { it: "Ah, mi dispiace. Da quando?", en: "Ah, I'm sorry. Since when?" },
            options: [
              { tone: "formal", it: "Da due giorni. Le ho anche mandato un messaggio ieri.", en: "For two days. I also sent you a message yesterday.", feedback: "Polite, but with the record on the table — a useful combination when you want something to actually move." },
              { tone: "casual", it: "Da due giorni, e in casa fa un freddo cane.", en: "Two days, and it's freezing in the flat.", feedback: "«Fa un freddo cane» is vivid colloquial Italian — expressive, though it makes the complaint sound emotional rather than factual." },
            ],
          },
          {
            them: { it: "Provo a chiamare il tecnico, ma questa settimana è pieno.", en: "I'll try to call the technician, but he's fully booked this week." },
            options: [
              { tone: "formal", it: "Capisco, però senza riscaldamento è difficile. Le sarei grato se insistesse.", en: "I understand, but it's hard without heating. I'd be grateful if you insisted.", feedback: "«Le sarei grato se + congiuntivo imperfetto» presses hard while staying perfectly courteous — the most useful complaint formula in Italian." },
              { tone: "casual", it: "Eh no, guardi, così non va. Serve qualcuno oggi.", en: "No, look, this won't do. Someone needs to come today.", feedback: "Firm and direct. Legitimate, but it raises the temperature — keep it for when polite pressure has already failed." },
            ],
          },
          {
            them: { it: "Va bene, vedo cosa posso fare e la richiamo entro sera.", en: "All right, I'll see what I can do and call you back by this evening." },
            options: [
              { tone: "formal", it: "La ringrazio, resto in attesa di una sua chiamata.", en: "Thank you, I'll await your call.", feedback: "«Resto in attesa» closes formally and quietly repeats back the commitment he just made." },
              { tone: "casual", it: "Perfetto, allora aspetto la sua chiamata. Grazie mille.", en: "Perfect, I'll wait for your call then. Thanks a lot.", feedback: "Friendly, and still explicit about what you expect to happen next." },
            ],
          },
        ],
      },
      {
        id: "meeting",
        title: "Disagreeing in a meeting",
        tagline: "Push back on a colleague's timeline",
        speakerName: "Elena",
        steps: [
          {
            them: { it: "Secondo me dovremmo lanciare il progetto già a settembre.", en: "I think we should launch the project as early as September." },
            options: [
              { tone: "formal", it: "Capisco il punto, ma temo che sia troppo presto.", en: "I see your point, but I'm afraid it's too early.", feedback: "«Temo che + congiuntivo» disagrees with the plan rather than the person — the standard opening move in an Italian meeting." },
              { tone: "casual", it: "Settembre? Mi sembra un po' rischioso.", en: "September? That seems a bit risky to me.", feedback: "Casual but constructive — you're questioning the date, not her judgement." },
            ],
          },
          {
            them: { it: "Perché? Il team è pronto.", en: "Why? The team is ready." },
            options: [
              { tone: "formal", it: "Il team sì, ma i test no: avremmo bisogno di altre tre settimane.", en: "The team yes, but the tests no: we'd need another three weeks.", feedback: "Conceding one point before making yours («il team sì, ma…») is very idiomatic and lands far better than a flat no." },
              { tone: "casual", it: "Il team magari, ma i test sono ancora un disastro.", en: "The team maybe, but the tests are still a disaster.", feedback: "Blunt and colourful. Clear, but calling a colleague's work «un disastro» in front of others can sting." },
            ],
          },
          {
            them: { it: "E se rimandassimo a ottobre? Riusciresti a chiudere i test?", en: "And if we postponed to October? Would you manage to finish the tests?" },
            options: [
              { tone: "formal", it: "Con ottobre sì, credo che ce la faremmo senza problemi.", en: "With October yes, I think we'd manage without trouble.", feedback: "«Ce la faremmo» — farcela in the conditional — is exactly how Italians say \"we'd manage it\"." },
              { tone: "casual", it: "Ottobre ci sta. Con quel margine chiudiamo.", en: "October works. With that margin we'll finish.", feedback: "«Ci sta» means \"that works\" — very current spoken Italian, perfectly normal among colleagues." },
            ],
          },
          {
            them: { it: "Bene. Metto ottobre nel piano e lo presento al direttore.", en: "Good. I'll put October in the plan and present it to the director." },
            options: [
              { tone: "formal", it: "Perfetto. Se serve, preparo io il riepilogo dei test.", en: "Perfect. If it helps, I'll prepare the test summary myself.", feedback: "Offering the follow-up work is what turns a disagreement into a shared decision." },
              { tone: "casual", it: "Ottimo, dai. Ti mando due righe sui test.", en: "Great, go for it. I'll send you a couple of lines about the tests.", feedback: "«Due righe» — literally \"two lines\" — is the casual way to promise a short written summary." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "C1",
    label: "C1",
    name: "Avanzato",
    tagline: "High stakes: negotiating & holding your own in an argument",
    ...LEVEL_ACCENTS.C1,
    dialogues: [
      {
        id: "contratto",
        title: "Negotiating a contract",
        tagline: "Agree a freelance fee and a deadline",
        speakerName: "Direttrice",
        steps: [
          {
            them: { it: "Abbiamo apprezzato la sua proposta. Parliamo di compenso e tempi.", en: "We liked your proposal. Let's talk about fee and timings." },
            options: [
              { tone: "formal", it: "Volentieri. La mia tariffa giornaliera è di seicento euro, oneri esclusi.", en: "Gladly. My daily rate is six hundred euros, excluding charges.", feedback: "Naming your figure first and calmly sets the anchor; «oneri esclusi» flags that tax and contributions sit on top." },
              { tone: "casual", it: "Bene. Diciamo seicento al giorno, più IVA.", en: "Good. Let's say six hundred a day, plus VAT.", feedback: "Relaxed but precise — «diciamo» softens the delivery without softening the number." },
            ],
          },
          {
            them: { it: "È un po' sopra il nostro budget. Potremmo arrivare a cinquecento.", en: "That's a little above our budget. We could go to five hundred." },
            options: [
              { tone: "formal", it: "Capisco il vincolo. Potrei accettare cinquecento se il progetto si chiudesse in sei settimane.", en: "I understand the constraint. I could accept five hundred if the project closed within six weeks.", feedback: "Trading price against scope with «se + congiuntivo imperfetto» is the single most useful sentence pattern in an Italian negotiation." },
              { tone: "casual", it: "Cinquecento ci posso stare, ma allora restringiamo il campo.", en: "Five hundred I can live with, but then let's narrow the scope.", feedback: "Colloquial and cooperative; «restringere il campo» is the natural way to say \"cut the scope\"." },
            ],
          },
          {
            them: { it: "Sei settimane sono strette. Che cosa succede se sforiamo?", en: "Six weeks is tight. What happens if we overrun?" },
            options: [
              { tone: "formal", it: "In quel caso fatturerei le settimane aggiuntive alla stessa tariffa.", en: "In that case I would invoice the additional weeks at the same rate.", feedback: "Putting the consequence in the conditional keeps it hypothetical, so it reads as a term rather than a threat." },
              { tone: "casual", it: "Se sforiamo, le settimane in più le fatturo, ovviamente.", en: "If we overrun, I'll invoice the extra weeks, obviously.", feedback: "Fronting the object («le settimane in più le fatturo») is very spoken Italian and here it sounds confident rather than aggressive." },
            ],
          },
          {
            them: { it: "Mi sembra ragionevole. Le mando il contratto da firmare.", en: "That seems reasonable. I'll send you the contract to sign." },
            options: [
              { tone: "formal", it: "La ringrazio. Resto a disposizione per qualsiasi chiarimento.", en: "Thank you. I remain available for any clarification.", feedback: "«Resto a disposizione» is the standard formal sign-off in Italian business calls and emails alike." },
              { tone: "casual", it: "Perfetto, appena arriva gli do un'occhiata e le rispondo.", en: "Perfect, as soon as it arrives I'll have a look and get back to you.", feedback: "Casual and businesslike — «dare un'occhiata» is \"to have a look\", and it promises a reply without committing to a date." },
            ],
          },
        ],
      },
      {
        id: "dibattito",
        title: "A debate over dinner",
        tagline: "Argue about tourism with friends",
        speakerName: "Tommaso",
        steps: [
          {
            them: { it: "Secondo me il turismo sta rovinando le città italiane.", en: "I think tourism is ruining Italian cities." },
            options: [
              { tone: "formal", it: "Su questo ti seguo solo in parte: dipende da come viene gestito.", en: "I only partly follow you there: it depends how it's managed.", feedback: "«Ti seguo solo in parte» is elegantly measured — you disagree without dismissing what he said." },
              { tone: "casual", it: "Mah, dipende. Senza turismo mezza Venezia chiuderebbe.", en: "Well, it depends. Without tourism half of Venice would shut down.", feedback: "«Mah» plus a counter-example is how Italians actually push back at the dinner table." },
            ],
          },
          {
            them: { it: "Ma i centri storici si sono svuotati: gli affitti sono impossibili.", en: "But the historic centres have emptied out: rents are impossible." },
            options: [
              { tone: "formal", it: "È vero, però il problema non è il turista: è la mancanza di regole sugli affitti brevi.", en: "True, but the problem isn't the tourist: it's the lack of rules on short lets.", feedback: "Reframing — moving the blame from people to policy — is the strongest move available in a debate like this." },
              { tone: "casual", it: "Sì, quello è vero, gli affitti sono una follia.", en: "Yes, that's true, the rents are madness.", feedback: "Conceding openly. Among friends, agreeing on one point buys you credit for the point you make next." },
            ],
          },
          {
            them: { it: "Quindi che faresti, se decidessi tu?", en: "So what would you do, if it were up to you?" },
            options: [
              { tone: "formal", it: "Limiterei le licenze e userei quel gettito per la casa pubblica.", en: "I'd cap the licences and use that revenue for public housing.", feedback: "Two clean conditionals and a concrete proposal — this is the register of an Italian current-affairs programme." },
              { tone: "casual", it: "Io un tetto alle licenze lo metterei domani.", en: "Me, I'd put a cap on licences tomorrow.", feedback: "Fronting the object («un tetto alle licenze lo metterei») adds emphasis and sounds completely natural in speech." },
            ],
          },
          {
            them: { it: "Ci vorrebbe il coraggio politico, però.", en: "It would take political courage, though." },
            options: [
              { tone: "formal", it: "Su questo non posso che darti ragione.", en: "There I can only agree with you.", feedback: "«Non posso che + infinitive» is a slightly literary way to concede the last word gracefully." },
              { tone: "casual", it: "Eh, appunto. Quello manca sempre.", en: "Yeah, exactly. That's always what's missing.", feedback: "«Eh, appunto» is the shortest way to agree in Italian — two words that carry a whole shrug." },
            ],
          },
        ],
      },
    ],
  },
];
