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
import OfficinaModule from "./modules/officina/OfficinaModule.jsx";
import { BENCHES } from "./modules/officina/benches.js";
import { expectNoViolations } from "./test/a11y.js";
import { LEVELS } from "./data/vocab.js";
import { GRAMMAR_LEVELS } from "./data/grammar.js";
import { STORY_LEVELS } from "./data/stories.js";
import { CONVERSATION_LEVELS } from "./data/conversations.js";
import { MAPS } from "./data/mappe.js";
import { saveProgress, wordKey, drillKey } from "./shared/storage.js";
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

describe("Le Mappe", () => {
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

describe("the review session", () => {
  it("has an accessible mixed session and summary", async () => {
    const word = greetings.words[0];
    saveProgress({
      words: { [wordKey(a1Vocab, greetings, word)]: "known" },
      schedule: { [wordKey(a1Vocab, greetings, word)]: { box: 1, due: "2020-01-01" } },
    });

    const user = userEvent.setup();
    const { container } = render(<ReviewModule onExit={() => {}} />);
    await expectNoViolations(container);

    await user.click(screen.getByRole("button", { name: word.en }));
    await user.click(screen.getByRole("button", { name: /See results/ }));
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

  // Le Mappe is the first screen in the app with three languages on it at
  // once, so it is the first place the marking can be wrong in two
  // directions rather than one.
  it("marks Polish as Polish and Italian as Italian in Le Mappe", async () => {
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
