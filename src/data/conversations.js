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
];
