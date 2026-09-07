import { describe, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import VocabModule from "./modules/vocab/VocabModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";
import ConversationsModule from "./modules/conversations/ConversationsModule.jsx";
import StoriesModule from "./modules/stories/StoriesModule.jsx";
import ReviewModule from "./modules/review/ReviewModule.jsx";
import MappeModule from "./modules/mappe/MappeModule.jsx";
import ArticoliModule from "./modules/articoli/ArticoliModule.jsx";
import RiservaModule from "./modules/riserva/RiservaModule.jsx";
import { FONDAMENTALE } from "./data/fondamentale.js";
import FalsiAmiciModule from "./modules/falsiAmici/FalsiAmiciModule.jsx";
import OfficinaModule from "./modules/officina/OfficinaModule.jsx";
import { BENCHES } from "./modules/officina/benches.js";
import { expectNoViolations } from "./test/a11y.js";
import { LEVELS } from "./data/vocab.js";
import { GRAMMAR_LEVELS } from "./data/grammar.js";
import { STORY_LEVELS } from "./data/stories.js";
import { CONVERSATION_LEVELS } from "./data/conversations.js";
import { MAPS } from "./data/mappe.js";
import { STRANDS, ZERO } from "./data/articoli.js";
import { TRAP_SETS, FALSI_AMICI } from "./data/falsiAmici.js";
import { saveProgress, wordKey, drillKey, trapCaughtKey, riservaKey } from "./shared/storage.js";
import { reviewItem } from "./shared/srs.js";
import { DISTRICTS } from "./shared/districts.js";
import * as speech from "./shared/speech.js";

// Accessibility is the one property that isn't any single component's — a
// screen is only usable if the shell, the module and the shared pieces all
// behave, and a regression usually arrives with a component that renders
// fine in isolation. So the axe scans live together here, one per screen the
// app can actually be in, in the same spirit as levels.test.js holding the
// cross-module data invariants.
//
// These scans cover the structural half of WCAG 2.1 AA — names, roles,
// states, headings, focusability. The colour half can't run in jsdom (no
// paint) and is checked arithmetically in shared/theme.test.js instead.

// An axe pass over a whole screen is heavier than an ordinary assertion —
// a story reader is a few hundred nodes — and the default 5s runs out on a
// loaded machine long before anything is actually wrong.
vi.setConfig({ testTimeout: 30000 });

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories.find((c) => c.id === "greetings");
const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const presentAre = a1Grammar.topics.find((t) => t.id === "present-are");
const a1Story = STORY_LEVELS.find((l) => l.id === "A1").stories[0];
const zione = MAPS.find((m) => m.id === "zione");
const determinativo = STRANDS[0];
const mapSet = TRAP_SETS.find((s) => s.id === "mappe");

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  // jsdom has no SpeechSynthesis, and the speaker buttons are part of what's
  // being audited — pretend it's there, as it is in every browser this ships to.
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the app shell", () => {
  // Two states, not one: the city on a fresh account has shut districts on
  // it, and a shut district is a different bit of markup from an open one
  // (aria-disabled, a padlock, a note underneath). Scanning only the seeded
  // map would leave the day-one screen — the one every learner sees first —
  // unaudited.
  it("has an accessible city map on a fresh account, shut districts and all", async () => {
    const { container } = render(<App />);
    await expectNoViolations(container, { fragment: false });
  });

  it("has an accessible navigation menu when it's open", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await expectNoViolations(container, { fragment: false });
  });

  it("has an accessible city map with progress on it and La Piazza open", async () => {
    saveProgress({
      words: {
        [wordKey(a1Vocab, greetings, greetings.words[0])]: "known",
        [drillKey(a1Grammar, presentAre, presentAre.drills[0])]: "known",
      },
      schedule: {
        [wordKey(a1Vocab, greetings, greetings.words[0])]: { box: 1, due: "2020-01-01" },
      },
    });
    const { container } = render(<App />);
    await expectNoViolations(container, { fragment: false });
  });
});

describe("the city map", () => {
  // A locked district must stay operable by keyboard. `disabled` would take
  // it out of the tab order entirely, which is the "door you didn't know was
  // there" the design argues against — so it carries aria-disabled instead,
  // and this is the test that stops anyone swapping it back.
  it("keeps a shut district focusable, and announced as unavailable", () => {
    render(<App />);

    const cinema = screen.getByRole("button", { name: /Il Cinema/ });
    expect(cinema).toHaveAttribute("aria-disabled", "true");
    expect(cinema).not.toBeDisabled();

    cinema.focus();
    expect(document.activeElement).toBe(cinema);
  });

  it("leaves no district out of the tab order, open or shut", () => {
    render(<App />);

    for (const { name } of DISTRICTS) {
      const tile = screen.getByRole("button", { name: new RegExp(name) });
      tile.focus();
      expect(document.activeElement, name).toBe(tile);
    }
  });
});

describe("the vocabulary module", () => {
  it("has an accessible home screen", async () => {
    const { container } = render(<VocabModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has accessible flashcards, front and back", async () => {
    const user = userEvent.setup();
    const { container } = render(<VocabModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    await expectNoViolations(container);

    await user.click(screen.getByText("Tap to reveal translation"));
    await expectNoViolations(container);
  });

  it("has an accessible quiz, unanswered and answered", async () => {
    const user = userEvent.setup();
    const { container } = render(<VocabModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);
    await expectNoViolations(container);

    await user.click(screen.getByRole("button", { name: greetings.words[0].en }));
    await expectNoViolations(container);
  });

  it("has an accessible listening round", async () => {
    const user = userEvent.setup();
    const { container } = render(<VocabModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: "Listen" })[0]);
    await expectNoViolations(container);
  });

  it("has an accessible end-of-quiz summary", async () => {
    const user = userEvent.setup();
    const { container } = render(<VocabModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);

    for (const word of greetings.words) {
      await user.click(screen.getByRole("button", { name: word.en }));
      await user.click(screen.getByRole("button", { name: /Next word|See results/ }));
    }
    await expectNoViolations(container);
  });
});

describe("the grammar module", () => {
  it("has an accessible home screen", async () => {
    const { container } = render(<GrammarModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible lesson, conjugation table and all", async () => {
    const user = userEvent.setup();
    const { container } = render(<GrammarModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);
    await expectNoViolations(container);
  });

  it("has an accessible drill, unanswered and answered", async () => {
    const user = userEvent.setup();
    const { container } = render(<GrammarModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);
    await expectNoViolations(container);

    await user.click(screen.getByRole("button", { name: presentAre.drills[0].answer }));
    await expectNoViolations(container);
  });
});

describe("the conversations module", () => {
  it("has an accessible home screen", async () => {
    const { container } = render(<ConversationsModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible dialogue, and its recap once it's finished", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConversationsModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);
    await expectNoViolations(container);

    // Answer every turn by taking the first reply offered, until the recap.
    // A reply button is named by its register followed by the Italian line.
    for (let i = 0; i < 8 && !screen.queryByRole("button", { name: /Practice again/ }); i++) {
      const options = screen.queryAllByRole("button", { name: /^(formal|casual) / });
      if (options.length === 0) break;
      await user.click(options[0]);
    }
    await expectNoViolations(container);
  });
});

describe("the stories module", () => {
  it("has an accessible home screen", async () => {
    const { container } = render(<StoriesModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible reader, with a translation shown and a gloss open", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoriesModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await expectNoViolations(container);

    await user.click(screen.getAllByRole("button", { name: /Show translation/ })[0]);
    await expectNoViolations(container);

    const glossed = Object.keys(a1Story.paragraphs[0].gloss)[0];
    await user.click(screen.getAllByRole("button", { name: glossed })[0]);
    await expectNoViolations(container);
  });

  it("has accessible comprehension questions and results", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoriesModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await user.click(screen.getByRole("button", { name: /Comprehension questions/ }));
    await expectNoViolations(container);

    for (const question of a1Story.questions) {
      await user.click(screen.getByRole("button", { name: question.answer }));
      await user.click(screen.getByRole("button", { name: /See results|Next question/ }));
    }
    await expectNoViolations(container);
  });
});

describe("L'Officina", () => {
  // The hub has a state the rest of the app doesn't: a card that is a real
  // button, carries a whole paragraph of text, and is aria-disabled because
  // the bench behind it isn't built. That is the state worth scanning.
  it("has an accessible workshop, benches that don't open yet and all", async () => {
    const { container } = render(<OfficinaModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("leaves no bench out of the tab order, open or not", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const bench of BENCHES) {
      const card = screen.getByRole("button", { name: new RegExp(bench.name) });
      card.focus();
      expect(document.activeElement, bench.id).toBe(card);
    }
  });
});

describe("Mappatura delle parole", () => {
  const openMap = async (user) => user.click(screen.getByRole("button", { name: /-cja/ }));
  const openDrill = async (user) => {
    await openMap(user);
    await user.click(screen.getByRole("button", { name: /Practise the rule/ }));
  };
  const type = async (user, text) => {
    await user.type(screen.getByLabelText(/Write it in Italian/), text);
    await user.click(screen.getByRole("button", { name: /^(Check|Next|See how it went)/ }));
  };

  it("has an accessible list of maps", async () => {
    const { container } = render(<MappeModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible mapping card, both roads and the trap", async () => {
    const user = userEvent.setup();
    const { container } = render(<MappeModule onExit={() => {}} />);
    await openMap(user);
    await expectNoViolations(container);
  });

  // Three states of the drill, not one. An unanswered typed field, a wrong
  // answer mid-item (the field goes aria-invalid and a located verdict
  // appears under it) and a settled one (the field turns read-only) are three
  // different bits of markup, and the middle one is the state this module
  // exists for.
  it("has an accessible drill, empty and part-way through an answer", async () => {
    const user = userEvent.setup();
    const { container } = render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await expectNoViolations(container);

    await type(user, "rivolucione");
    await expectNoViolations(container);

    await type(user, "rivolucione");
    await expectNoViolations(container);
  });

  it("has an accessible summary at the end of a run", async () => {
    // `delay: null` matters here rather than anywhere else in this file:
    // this is the only test that types whole words for a whole deck — six
    // drills, seven answers once the deliberate miss is counted. At the
    // default inter-keystroke delay that is hundreds of async ticks, which
    // fits in the 30s above uninstrumented and does not fit under coverage.
    const user = userEvent.setup({ delay: null });
    const { container } = render(<MappeModule onExit={() => {}} />);
    await openDrill(user);

    for (const [i, drill] of zione.drills.entries()) {
      // Miss the first one on purpose, so the summary is scanned with its
      // "worth another look" list rendered rather than empty.
      await type(user, i === 0 ? "nonsense" : drill.it);
      if (i === 0) await type(user, "nonsense");
      await user.click(screen.getByRole("button", { name: /^(Next|See how it went)/ }));
    }
    await expectNoViolations(container);
  });
});

describe("La Riserva", () => {
  // Two thousand cells, and axe has opinions about all of them. The grid is
  // aria-hidden by design — it is a picture whose facts are given as text —
  // so what this checks is that hiding it did not also hide the ten fasce
  // that are the screen's real controls, and that an expanded band is
  // announced rather than silently appearing.
  it("has an accessible grid and band list", async () => {
    const { container } = render(<RiservaModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("stays accessible with a fascia open", async () => {
    const user = userEvent.setup();
    const { container } = render(<RiservaModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ }));
    await expectNoViolations(container);
  });

  // Word detail's way in is the fascia, so the axe pass has to reach it the
  // way a learner does rather than by rendering the screen in isolation.
  it("has an accessible word detail behind a fascia", async () => {
    const user = userEvent.setup();
    const { container } = render(<RiservaModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ }));
    await user.click(screen.getByRole("button", { name: FONDAMENTALE[0].it }));
    await expectNoViolations(container);
  });

  // The drill is the other thing behind a fascia, and it is three screen
  // states rather than one: the prompt, the prompt with a verdict card open
  // under an invalid field, and the summary. The middle one is where the
  // interesting markup is — a live region, an aria-describedby pointing at a
  // card that was not there a moment ago, and a Polish string inside an
  // English page.
  it("has an accessible drill behind a fascia", async () => {
    const user = userEvent.setup();
    const { container } = render(<RiservaModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ }));
    await user.click(screen.getByRole("button", { name: /Drill the next/ }));
    await expectNoViolations(container);

    await user.type(screen.getByLabelText("Write it in Italian"), "sbagliato");
    await user.click(screen.getByRole("button", { name: /^Check/ }));
    await expectNoViolations(container);
  });

  it("has an accessible drill summary", async () => {
    const user = userEvent.setup();
    // Everything in band 1 met bar the first word, so one answer finishes the
    // round and the summary is two clicks away rather than twenty.
    let progress = { version: 2, words: {}, schedule: {} };
    for (const entry of FONDAMENTALE.filter((e) => e.rank > 1 && e.rank <= 200)) {
      progress = reviewItem(progress, riservaKey(entry), true, "2026-09-01");
    }
    saveProgress(progress);

    const { container } = render(<RiservaModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ }));
    await user.click(screen.getByRole("button", { name: /Drill the next/ }));
    await user.type(screen.getByLabelText("Write it in Italian"), "sbagliato");
    await user.click(screen.getByRole("button", { name: /^Check/ }));
    await user.click(screen.getByRole("button", { name: /^Check again/ }));
    await user.click(screen.getByRole("button", { name: /See how it went/ }));

    await expectNoViolations(container);
  });
});

describe("Gli Articoli", () => {
  // An option's accessible name is the form, or "no article" for the zero
  // article — an em dash is silence to a screen reader, so it is aria-hidden
  // and carries a visually-hidden name instead.
  const option = (form) => {
    const label = form === ZERO ? "no article" : form;
    return screen.getByRole("button", { name: (name) => name === label || name.startsWith(`${label} `) });
  };
  const openDrill = async (user) => {
    await user.click(screen.getByRole("button", { name: new RegExp(determinativo.name) }));
    await user.click(screen.getByRole("button", { name: /Practise it/ }));
  };

  it("has an accessible list of strands", async () => {
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible teaching card with every rule on it", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: new RegExp(determinativo.name) }));
    await expectNoViolations(container);
  });

  // Three states of the drill, not one. Unanswered, mid-item after a wrong
  // first attempt (one option goes aria-disabled and a located verdict
  // appears under it, with nothing revealed), and settled (every option goes
  // aria-disabled and the rule and the Polish card open). The middle one is
  // the state this module exists for.
  it("has an accessible drill, empty, part-way through, and settled", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await openDrill(user);
    await expectNoViolations(container);

    await user.click(option(ZERO));
    await expectNoViolations(container);

    await user.click(option("un"));
    await expectNoViolations(container);
  });

  it("has an accessible summary at the end of a run", async () => {
    // `delay: null` for the same reason Mappatura delle parole's summary scan uses it: this
    // is the only scan here that clicks through a whole strand — five items,
    // six answers once the deliberate miss is counted — and at the default
    // inter-event delay that is hundreds of async ticks, which fits in the
    // 30s ceiling uninstrumented and does not fit under coverage.
    const user = userEvent.setup({ delay: null });
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await openDrill(user);

    for (const [i, item] of determinativo.items.entries()) {
      // Miss the first one on purpose, so the summary is scanned with its
      // "worth another look" list rendered rather than empty.
      const wrong = item.options.filter((o) => o !== item.answer);
      await user.click(option(i === 0 ? wrong[0] : item.answer));
      if (i === 0) await user.click(option(wrong[1]));
      await user.click(screen.getByRole("button", { name: /^(Continua|See how it went)/ }));
    }
    await expectNoViolations(container);
  });

  // Every option is a real <button>, including the ones already ruled out —
  // aria-disabled rather than `disabled`, so nothing drops out of the tab
  // order under a keyboard user in the middle of an item.
  it("leaves no option out of the tab order, live or ruled out", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openDrill(user);
    await user.click(option(ZERO));

    for (const form of determinativo.items[0].options) {
      const button = option(form);
      button.focus();
      expect(document.activeElement, form).toBe(button);
    }
  });
});

describe("Falsi Amici", () => {
  const openDrill = async (user) =>
    user.click(screen.getByRole("button", { name: new RegExp(`Practise these ${mapSet.traps.length}`) }));
  const type = async (user, text) => {
    await user.type(screen.getByLabelText(/Write it in Italian/), text);
    await user.click(screen.getByRole("button", { name: /^(Check|Next|See how it went)/ }));
  };

  // Two states of the collection, not one. A fresh account is every card in
  // its neutral shape; a seeded one has a caught card, which is a different
  // surface with an extra badge in it — and the caught card is the state
  // this bench exists to produce.
  it("has an accessible collection on a fresh account", async () => {
    const { container } = render(<FalsiAmiciModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  it("has an accessible collection with traps already marked as caught", async () => {
    saveProgress({ words: { [trapCaughtKey(FALSI_AMICI[0])]: "learning" } });
    const { container } = render(<FalsiAmiciModule onExit={() => {}} />);
    await expectNoViolations(container);
  });

  // Three states of the drill, the same three Mappatura delle parole has: an unanswered
  // typed field, a wrong answer mid-item (the field goes aria-invalid and a
  // located verdict appears under it) and a settled one (the field turns
  // read-only). The middle one is the state this module exists for, and here
  // it is the trap verdict specifically.
  it("has an accessible drill, empty, mid-trap and settled", async () => {
    const user = userEvent.setup();
    const { container } = render(<FalsiAmiciModule onExit={() => {}} />);
    await openDrill(user);
    await expectNoViolations(container);

    await type(user, mapSet.traps[0].bait);
    await expectNoViolations(container);

    await type(user, mapSet.traps[0].bait);
    await expectNoViolations(container);
  });

  it("has an accessible summary at the end of a run", async () => {
    // `delay: null` for the same reason Mappatura delle parole's summary scan uses it:
    // this scan types whole words for a whole set, which at the default
    // inter-keystroke delay is hundreds of async ticks — it fits in the 30s
    // above uninstrumented and does not fit under coverage.
    const user = userEvent.setup({ delay: null });
    const { container } = render(<FalsiAmiciModule onExit={() => {}} />);
    await openDrill(user);

    for (const [i, trap] of mapSet.traps.entries()) {
      // Walk into the first one on purpose, so the summary is scanned with
      // its "these ones caught you" list rendered rather than empty.
      await type(user, i === 0 ? trap.bait : trap.say.it);
      if (i === 0) await type(user, trap.bait);
      await user.click(screen.getByRole("button", { name: /^(Next|See how it went)/ }));
    }
    await expectNoViolations(container);
  });
});

describe("the review session", () => {
  // The typed drill has more states than the multiple choice it replaced —
  // the landing, an item mid-flight, a located verdict with the input handed
  // back, and a settled one — and the located verdict is the state most
  // worth auditing: it is the one that repaints the screen without moving
  // focus, which is what LiveStatus is there for.
  it("has an accessible landing, item, located verdict, settled item and summary", async () => {
    const word = greetings.words[0];
    const key = wordKey(a1Vocab, greetings, word);
    saveProgress({ words: { [key]: "known" }, schedule: { [key]: { box: 1, due: "2020-01-01" } } });

    const user = userEvent.setup();
    const { container } = render(<ReviewModule onExit={() => {}} />);
    await expectNoViolations(container);

    await user.click(screen.getByRole("button", { name: /Start the round/ }));
    await expectNoViolations(container);

    const type = async (text) => {
      const input = screen.getByLabelText("Write it in Italian");
      await user.clear(input);
      if (text) await user.type(input, text);
      await user.click(screen.getByRole("button", { name: /^Check/ }));
    };

    // An empty box: a verdict card with no tick, no cross and no answer, and
    // a field that must not be called invalid for holding nothing.
    await type("");
    await expectNoViolations(container);

    // Wrong once: the verdict card is up, the input is still live, and the
    // answer has not been handed over.
    await type("ciap");
    await expectNoViolations(container);

    // Wrong twice: settled, revealed, and the input is read-only.
    await type("ciar");
    await expectNoViolations(container);

    await user.click(screen.getByRole("button", { name: /See how it went/ }));
    await expectNoViolations(container);
  });

  // The sweep above walks one item to the end of its two attempts, which
  // leaves three of the six verdict states unaudited — and they are the three
  // that change the markup most: a correct answer swaps the card's accent and
  // its AnswerMark, and "Show me" settles the item with no mark at all and a
  // read-only field nothing has been typed into.
  it("has an accessible right answer and an accessible reveal", async () => {
    const word = greetings.words[0];
    const key = wordKey(a1Vocab, greetings, word);
    const second = greetings.words[1];
    const secondKey = wordKey(a1Vocab, greetings, second);
    saveProgress({
      words: { [key]: "known", [secondKey]: "known" },
      schedule: { [key]: { box: 1, due: "2020-01-01" }, [secondKey]: { box: 1, due: "2020-01-01" } },
    });

    const user = userEvent.setup();
    const { container } = render(<ReviewModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Start the round/ }));

    // Right: the pistachio card, the tick, and the sentence the gap came from.
    const onScreen = () => (screen.queryByText(word.en) ? word : second);
    const first = onScreen();
    await user.type(screen.getByLabelText("Write it in Italian"), first.it);
    await user.click(screen.getByRole("button", { name: /^Check/ }));
    await expectNoViolations(container);

    // Revealed: settled, no mark, and a read-only field with nothing in it.
    await user.click(screen.getByRole("button", { name: /^Next/ }));
    await user.click(screen.getByRole("button", { name: "Show me" }));
    await expectNoViolations(container);
  });

  it("has an accessible empty state", async () => {
    const { container } = render(<ReviewModule onExit={() => {}} />);
    await expectNoViolations(container);
  });
});

// WCAG 3.1.2, Language of Parts: the document is lang="en", so every run of
// Italian inside it has to say so, or a screen reader pronounces "gli" and
// "ciao" with English phonetics. There's no axe rule for this — it can't tell
// which language a string is in — so each module states where its Italian is.
describe("Italian text is marked as Italian", () => {
  const italianAncestor = (node) => node.closest('[lang="it"]');

  it("marks the district names on the map, which are Italian place names", () => {
    render(<App />);

    // A shut district's name appears twice — on its tile and in the note
    // stating what opens it — and both are Italian.
    for (const { name } of DISTRICTS) {
      for (const label of screen.getAllByText(name)) {
        expect(italianAncestor(label), name).not.toBeNull();
      }
    }
    // The counts beside them are English, and must not claim otherwise.
    expect(italianAncestor(screen.getByText(/words$/))).toBeNull();
  });

  it("marks the word, the example and the prompt in the vocabulary module", async () => {
    const user = userEvent.setup();
    render(<VocabModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    const word = greetings.words[0];
    expect(italianAncestor(screen.getByText(word.it))).not.toBeNull();

    await user.click(screen.getByText("Tap to reveal translation"));
    expect(italianAncestor(screen.getByText(`"${word.ex}"`))).not.toBeNull();
    // The English gloss is not Italian, and must not claim to be.
    expect(italianAncestor(screen.getByText(word.exEn))).toBeNull();
  });

  it("marks the drill prompt, the options and the conjugation table in grammar", async () => {
    const user = userEvent.setup();
    render(<GrammarModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    // A cell of the conjugation table, and an example sentence.
    expect(italianAncestor(screen.getByText("parlo"))).not.toBeNull();
    expect(italianAncestor(screen.getByText(`"${presentAre.explanation.examples[0].it}"`))).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /Start drill/ }));
    const drill = presentAre.drills[0];
    expect(italianAncestor(screen.getByText(drill.prompt))).not.toBeNull();
    expect(italianAncestor(screen.getByText(drill.answer))).not.toBeNull();
    // The English translation of the prompt sits right beside it.
    expect(italianAncestor(screen.getByText(drill.en))).toBeNull();
  });

  it("marks both sides of the dialogue in conversations", async () => {
    const user = userEvent.setup();
    render(<ConversationsModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const dialogue = CONVERSATION_LEVELS[0].dialogues[0];
    expect(italianAncestor(screen.getByText(dialogue.steps[0].them.it))).not.toBeNull();
    expect(italianAncestor(screen.getByText(dialogue.steps[0].options[0].it))).not.toBeNull();
  });

  // Mappatura delle parole is the first screen in the app with three languages on it at
  // once, so it is the first place the marking can be wrong in two
  // directions rather than one.
  it("marks Polish as Polish and Italian as Italian in Mappatura delle parole", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /-cja/ }));

    expect(screen.getByText("lekcja").closest("[lang]")).toHaveAttribute("lang", "pl");
    expect(italianAncestor(screen.getByText("lezione"))).not.toBeNull();
    // The English road's prompt takes the document's own language.
    expect(screen.getByText("nation").closest("[lang]")).toBeNull();
  });

  // Five bench names on one screen, four of them Italian and one of them
  // English — so this is a place the marking can be wrong in two directions,
  // and both are checked.
  it("marks the Italian bench names in L'Officina, and leaves the English one alone", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const bench of BENCHES) {
      const name = screen.getByText(bench.name);
      expect(name.closest("[lang]")?.getAttribute("lang") ?? null, bench.id).toBe(bench.lang ?? null);
    }
    expect(italianAncestor(screen.getByText("Qui si smontano le parole."))).not.toBeNull();
  });

  // The first screen in the app that puts a whole Polish *sentence* on it
  // rather than a Polish word inside a pair — the anchor card is a first-class
  // layer per PLAN.md, so it has to be announced in Polish and not in English
  // phonetics.
  it("marks the Italian sentence, the Polish anchor and the options in Gli Articoli", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: new RegExp(determinativo.name) }));
    await user.click(screen.getByRole("button", { name: /Practise it/ }));

    const item = determinativo.items[0];
    // The prompt, and the article options under it.
    expect(italianAncestor(screen.getByText(new RegExp(item.before)))).not.toBeNull();
    expect(screen.getByText(item.options[0]).closest("[lang]")).toHaveAttribute("lang", "it");

    await user.click(screen.getByRole("button", { name: (name) => name === item.answer }));

    expect(screen.getByText(item.anchor.pl).closest("[lang]")).toHaveAttribute("lang", "pl");
    // The English explanation beside it is not Polish, and must not claim to be.
    expect(screen.getByText(item.anchor.says).closest('[lang="pl"]')).toBeNull();
    expect(italianAncestor(screen.getByText(item.anchor.says))).toBeNull();
  });

  // The hardest case in the app for language marking: an Italian word, a
  // Polish or English lookalike and English prose in one sentence, fourteen
  // times over on one screen.
  it("marks the Italian word, the Polish lookalike and neither of the English ones in Falsi Amici", () => {
    render(<FalsiAmiciModule onExit={() => {}} />);

    const divano = FALSI_AMICI.find((t) => t.id === "divano");
    expect(italianAncestor(screen.getAllByText(divano.it)[0])).not.toBeNull();
    expect(screen.getAllByText(divano.lookalike)[0].closest("[lang]")).toHaveAttribute("lang", "pl");

    // An English lookalike takes the document's own language, and so does
    // the prose explaining the pair.
    const parenti = FALSI_AMICI.find((t) => t.id === "parenti");
    expect(screen.getAllByText(parenti.lookalike)[0].closest("[lang]")).toBeNull();
    expect(italianAncestor(screen.getByText(divano.note))).toBeNull();
  });

  // La Riserva is the one screen whose Italian is *built* rather than read off
  // the data: `Fascia 1 · posti 1–200` and `posto 1` are composed in JSX, and
  // fondamentale.js keeps FASCE.label English on the strength of that — "it
  // states the same fact La Riserva's own Italian heading states, and that
  // heading is built on the screen where it can carry lang='it'". So this is
  // the assertion that argument rests on.
  //
  // It is also the one kind of missing tag nothing else here would catch. Both
  // strings live in a local <Eyebrow>, and a component whose signature is
  // ({ children, style }) swallows a lang prop without a word: the JSX reads
  // lang="it", the DOM carries no lang at all, and axe passes — axe cannot
  // tell what language a string is in. That shipped. This asserts against the
  // DOM rather than against the JSX.
  it("marks the fascia heading and the drill's posto in La Riserva", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);

    expect(screen.getByText("Fascia 1 · posti 1–200").closest("[lang]")).toHaveAttribute("lang", "it");
    // The English half of the very same button must not claim to be Italian.
    expect(italianAncestor(screen.getAllByText(/coverage points/)[0])).toBeNull();

    await user.click(screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ }));
    await user.click(screen.getByRole("button", { name: /Drill the next/ }));

    expect(screen.getByText("posto 1").closest("[lang]")).toHaveAttribute("lang", "it");
    expect(screen.getByText("Fascia 1 · posti 1–200").closest("[lang]")).toHaveAttribute("lang", "it");
    // And the counters either side of them are English.
    expect(italianAncestor(screen.getByText(/Attempt 1 of 2/))).toBeNull();
    expect(italianAncestor(screen.getByText("1 / 20"))).toBeNull();
  });

  it("marks the story text and the word gloss in stories", async () => {
    const user = userEvent.setup();
    render(<StoriesModule onExit={() => {}} />);
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    const glossed = Object.keys(a1Story.paragraphs[0].gloss)[0];
    const word = screen.getAllByRole("button", { name: glossed })[0];
    expect(italianAncestor(word)).not.toBeNull();

    await user.click(word);
    // The gloss bar repeats the headword in Italian and its meaning in English.
    const meaning = a1Story.paragraphs[0].gloss[glossed];
    expect(italianAncestor(screen.getByText(meaning))).toBeNull();
  });

  // La Piazza puts three languages' worth of claim in one card: the English
  // gloss that asks the question, the Italian sentence it is gapped out of,
  // and — once the item settles — the answer and the sentence with the gap
  // closed. Getting this wrong reads `ciao` with English phonetics.
  it("marks the gapped example and the answer in La Piazza, and not the English gloss", async () => {
    const user = userEvent.setup();
    const word = greetings.words[0];
    const key = wordKey(a1Vocab, greetings, word);
    saveProgress({ words: { [key]: "known" }, schedule: { [key]: { box: 1, due: "2020-01-01" } } });

    render(<ReviewModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Start the round/ }));

    expect(italianAncestor(screen.getByText("___, come stai?"))).not.toBeNull();
    // The gloss is what the question is asked in, and it is English.
    expect(italianAncestor(screen.getByText(word.en))).toBeNull();
    // The typed answer is Italian, so the field has to say so — otherwise a
    // screen reader spells back what is typed with English letter names.
    expect(screen.getByLabelText("Write it in Italian")).toHaveAttribute("lang", "it");

    await user.click(screen.getByRole("button", { name: "Show me" }));
    expect(italianAncestor(screen.getByText(word.it))).not.toBeNull();
    expect(italianAncestor(screen.getByText(word.ex))).not.toBeNull();
    expect(italianAncestor(screen.getByText(word.exEn, { exact: false }))).toBeNull();
  });
});

describe("keyboard reachability", () => {
  // Every control the audit scans has to be operable without a mouse. axe
  // checks names and roles; this checks the other half — that nothing
  // interactive is left out of the tab order.
  it("leaves no interactive control out of the tab order", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Il Cantiere/ }));
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    const controls = screen.getAllByRole("button");
    for (const control of controls) {
      control.focus();
      if (document.activeElement !== control) {
        throw new Error(`Control is not focusable: ${control.textContent || control.getAttribute("aria-label")}`);
      }
    }
  });
});
