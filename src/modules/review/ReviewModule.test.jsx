import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewModule from "./ReviewModule.jsx";
import { LOCATED } from "../../shared/locatedFeedback.js";
import { LEVELS } from "../../data/vocab.js";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import { wordKey, drillKey, riservaKey, loadProgress, saveProgress, todayISO, addDaysISO } from "../../shared/storage.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { MODULE_STATS } from "../../shared/stats.js";
import { MAX_BOX, SESSION_LIMIT } from "../../shared/srs.js";
import { DISTRICTS, districtForModule } from "../../shared/districts.js";
import * as speech from "../../shared/speech.js";

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories.find((c) => c.id === "greetings");
const word = greetings.words[0]; // ciao — "hi / bye", "Ciao, come stai?"
const accented = greetings.words.find((w) => w.it === "sì");
// The one entry in the deck whose answer carries the sentence's own
// punctuation — "come stai?", gapped out of "Ciao Marco, come stai?".
const question = greetings.words.find((w) => w.it === "come stai?");
const WORD_KEY = wordKey(a1Vocab, greetings, word);
const ACCENTED_KEY = wordKey(a1Vocab, greetings, accented);
const QUESTION_KEY = wordKey(a1Vocab, greetings, question);

const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const topic = a1Grammar.topics[0];
const drill = topic.drills[0]; // "Io ___ italiano ogni giorno." — parlo
const DRILL_KEY = drillKey(a1Grammar, topic, drill);

// Seeds items as studied-but-unscheduled, which srs.js treats as due now.
function seedDue(words, schedule = {}) {
  saveProgress({ words, schedule });
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderReview = (onExit = () => {}) => render(<ReviewModule onExit={onExit} />);

const startRound = async (user) => user.click(screen.getByRole("button", { name: /Start the round/ }));

const answer = async (user, text) => {
  const input = screen.getByLabelText("Write it in Italian");
  await user.clear(input);
  if (text) await user.type(input, text);
  await user.click(screen.getByRole("button", { name: /^Check/ }));
};

const spoken = () => document.querySelector('[role="status"]').textContent;

describe("La Piazza — the landing", () => {
  it("says nothing is due when the queue is empty, and goes back to the city", async () => {
    const user = userEvent.setup();
    const exits = [];
    renderReview(() => exits.push("exit"));

    expect(screen.getByText("Nothing due")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start the round/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to the city" }));
    expect(exits).toEqual(["exit"]);
  });

  it("shows an item scheduled for a future day as nothing due", () => {
    seedDue({ [WORD_KEY]: "known" }, { [WORD_KEY]: { box: 4, due: "2099-01-01", last: todayISO() } });
    renderReview();
    expect(screen.getByText("Nothing due")).toBeInTheDocument();
  });

  // The district's own blurb, imported rather than retyped, so the tile on
  // the map and the screen behind it cannot drift apart.
  it("lands on the district rather than dropping straight into a session", () => {
    seedDue({ [WORD_KEY]: "learning", [DRILL_KEY]: "learning" });
    renderReview();

    expect(screen.getByRole("heading", { name: "La Piazza" })).toBeInTheDocument();
    expect(screen.getByText(DISTRICTS.find((d) => d.id === "piazza").blurb)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("items waiting")).toBeInTheDocument();
  });

  // The badge counted everything due and the round then delivered 20 of them,
  // so a learner with 47 waiting read "47 items waiting" and answered
  // "1 / 20" with nothing on screen acknowledging the cap. That is the same
  // class of unbacked figure week.js was written to refuse, on the screen
  // that refuses it — so the landing says both numbers or neither.
  it("says what one round delivers when more is waiting than a round holds", () => {
    const over = {};
    for (const level of LEVELS) {
      for (const category of level.categories) {
        for (const w of category.words) over[wordKey(level, category, w)] = "learning";
      }
    }
    expect(Object.keys(over).length).toBeGreaterThan(SESSION_LIMIT);

    seedDue(over);
    renderReview();

    expect(screen.getByText(String(Object.keys(over).length))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`One round takes ${SESSION_LIMIT} of them`))).toBeInTheDocument();
  });

  it("says nothing about the cap when a round takes everything waiting", () => {
    seedDue({ [WORD_KEY]: "learning", [DRILL_KEY]: "learning" });
    renderReview();
    expect(screen.queryByText(/One round takes/)).not.toBeInTheDocument();
  });

  // Design screen 18 draws "14 words leave solid if you don't review them by
  // Thursday". srs.js has no decay, so that sentence would be false — see
  // week.js. What is derivable is which solid words are next in the queue.
  it("states what is coming back this week, and never that anything decays", () => {
    seedDue(
      { [WORD_KEY]: "learning", [ACCENTED_KEY]: "known" },
      { [ACCENTED_KEY]: { box: MAX_BOX, due: addDaysISO(todayISO(), 3), last: todayISO() } },
    );
    renderReview();

    expect(screen.getByText(/1 solid word comes back/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing falls out of solid for being answered late/)).toBeInTheDocument();
  });

  it("counts more than one of them in the plural", () => {
    const soon = { box: MAX_BOX, due: addDaysISO(todayISO(), 2), last: todayISO() };
    seedDue({ [WORD_KEY]: "learning" }, { [ACCENTED_KEY]: soon, [wordKey(a1Vocab, greetings, greetings.words[2])]: soon });
    renderReview();

    expect(screen.getByText(/2 solid words come back/)).toBeInTheDocument();
  });

  it("says nothing about the week when nothing solid is coming back", () => {
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    expect(screen.queryByText(/solid word/)).not.toBeInTheDocument();
  });

  it("leaves the landing for the city", async () => {
    const user = userEvent.setup();
    const exits = [];
    seedDue({ [WORD_KEY]: "learning" });
    renderReview(() => exits.push("exit"));

    await user.click(screen.getByRole("button", { name: /La Città/ }));
    expect(exits).toEqual(["exit"]);
  });
});

describe("La Piazza — a typed item", () => {
  it("asks a vocabulary word by its gloss, with its example gapped, and never shows the word", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    expect(screen.getByText(word.en)).toBeInTheDocument();
    expect(screen.getByText("___, come stai?")).toBeInTheDocument();
    expect(screen.getByText("A1 · Vocabulary")).toBeInTheDocument();
    expect(screen.queryByText(word.it)).not.toBeInTheDocument();
    // No line-up: the old multiple choice is gone.
    expect(screen.queryByRole("button", { name: word.en })).not.toBeInTheDocument();
  });

  // The hint is rendered verbatim, so "the hint is on screen" is only half a
  // test: three shipped hints contained their own answer, and this assertion
  // as first written would have passed while the screen gave the answer away.
  // grammar.test.js keeps them out of the data; this checks what is drawn.
  it("asks a grammar drill by its own gap and hint, without putting the answer on screen", async () => {
    const user = userEvent.setup();
    seedDue({ [DRILL_KEY]: "learning" });
    renderReview();
    await startRound(user);

    expect(screen.getByText(drill.prompt)).toBeInTheDocument();
    expect(screen.getByText(drill.hint)).toBeInTheDocument();
    for (const option of drill.options) {
      expect(screen.queryByRole("button", { name: option }), option).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(new RegExp(`(?<!\\p{L})${drill.answer}(?!\\p{L})`, "iu"));
  });

  // The round trip that makes the feature worth having: answering right has
  // to move the item's box and push it out of today's queue.
  it("promotes an answer that was right first time out of today's queue", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, word.it);
    expect(screen.getByText("Right")).toBeInTheDocument();

    const saved = loadProgress();
    expect(saved.words[WORD_KEY]).toBe("known");
    expect(saved.schedule[WORD_KEY].box).toBe(2);
    expect(saved.schedule[WORD_KEY].due).not.toBe(todayISO());
  });

  // Missing a diacritic is a spelling slip, not a failed retrieval — and the
  // spelling is shown all the same, or accepting it teaches the wrong one.
  it("takes an answer with the accent left off, spells it back, and still promotes", async () => {
    const user = userEvent.setup();
    seedDue({ [ACCENTED_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "si");
    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(screen.getByText(accented.it)).toBeInTheDocument();
    expect(loadProgress().schedule[ACCENTED_KEY].box).toBe(2);
  });

  // The gap swallowed the question mark — the screen reads `Ciao Marco, ___`
  // — so demanding it back is asking the learner to guess punctuation nobody
  // showed her. It used to be marked wrong, located as `come stai` (the whole
  // answer bar the mark) and demoted to box 1 on the second attempt.
  it("takes an answer without the closing punctuation the gap swallowed, and spells it back", async () => {
    const user = userEvent.setup();
    seedDue({ [QUESTION_KEY]: "learning" });
    renderReview();
    await startRound(user);

    expect(screen.getByText("Ciao Marco, ___")).toBeInTheDocument();
    await answer(user, "come stai");

    expect(screen.getByText("Right")).toBeInTheDocument();
    // Accepted, and still shown with the mark on: the point of forgiving it
    // is not to teach that it isn't there. And no stray full stop after it.
    expect(screen.getByText(question.it)).toBeInTheDocument();
    expect(spoken()).toBe("Correct. Italian writes it come stai?");
    expect(loadProgress().schedule[QUESTION_KEY].box).toBe(2);
  });

  it("locates a wrong first answer, hands nothing over, and gives the input back", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "ciap");

    expect(screen.getByText("Not there yet")).toBeInTheDocument();
    expect(screen.getByText(LOCATED.ending)).toBeInTheDocument();
    expect(screen.getByText("cia")).toBeInTheDocument();
    // Nothing revealed, nothing graded, and the field is still editable.
    expect(screen.queryByText(/The answer is/)).not.toBeInTheDocument();
    expect(screen.getByText("Attempt 2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Write it in Italian")).not.toHaveAttribute("readonly");
    expect(loadProgress().schedule[WORD_KEY]).toBeUndefined();
  });

  // The other half of locating: the ending landed and the word in front of
  // it did not. The fragment quoted back is only ever letters the learner
  // typed herself, so it narrows the answer down without being it.
  it("says when the ending is the part that landed", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "miao");

    expect(screen.getByText(LOCATED.stem)).toBeInTheDocument();
    expect(screen.getByText("iao")).toBeInTheDocument();
    expect(screen.queryByText(word.it)).not.toBeInTheDocument();
  });

  // aria-invalid says "what you wrote is wrong", so it may only be set where
  // she wrote something. And the verdict card is the field's description, or
  // a screen reader landing back in the input after a wrong answer is told it
  // is invalid without being told where it went — which is the whole point of
  // locating rather than solving.
  it("marks the field invalid only for an answer the learner actually wrote", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    const field = () => screen.getByLabelText("Write it in Italian");
    expect(field()).not.toHaveAttribute("aria-invalid");
    expect(field()).not.toHaveAttribute("aria-describedby");

    // An empty box is not an attempt, so there is nothing of hers to call
    // invalid — but there is a verdict card to point at.
    await answer(user, "");
    expect(field()).not.toHaveAttribute("aria-invalid");
    const described = field().getAttribute("aria-describedby");
    expect(document.getElementById(described)).toHaveTextContent(LOCATED.blank);

    await answer(user, "ciap");
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(field().getAttribute("aria-describedby"))).toHaveTextContent(LOCATED.ending);

    await answer(user, word.it);
    expect(field()).not.toHaveAttribute("aria-invalid");
  });

  it("does not call the field invalid when nothing was typed and the answer was asked for", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await user.click(screen.getByRole("button", { name: "Show me" }));

    const field = screen.getByLabelText("Write it in Italian");
    expect(field).not.toHaveAttribute("aria-invalid");
    expect(document.getElementById(field.getAttribute("aria-describedby"))).toHaveTextContent(word.it);
  });

  it("says the same thing to a screen reader as it draws on the card", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    expect(spoken()).toBe("");
    await answer(user, "ciap");
    expect(spoken()).toBe(`Not quite. ${LOCATED.ending} You have cia right. Try once more.`);
  });

  // The most locatable error in the app, and the reason the authored options
  // stay in the data after they stop being drawn.
  it("tells a grammar answer that it is another form of the same item", async () => {
    const user = userEvent.setup();
    seedDue({ [DRILL_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "parlano");
    expect(screen.getByText(LOCATED.distractor)).toBeInTheDocument();
    expect(screen.queryByText(drill.answer)).not.toBeInTheDocument();
  });

  it("reveals the answer once the second attempt is spent, and does not promote", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "ciap");
    await answer(user, "ciar");

    expect(screen.getByText(word.it)).toBeInTheDocument();
    expect(screen.getByText(word.ex)).toBeInTheDocument();
    const saved = loadProgress();
    expect(saved.words[WORD_KEY]).toBe("learning");
    expect(saved.schedule[WORD_KEY]).toEqual({ box: 1, due: todayISO(), last: todayISO() });
  });

  // Scaffolding, not retrieval: the app had already said where to look.
  it("settles a right second attempt without promoting it", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "ciap");
    await answer(user, word.it);

    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(loadProgress().schedule[WORD_KEY].box).toBe(1);
  });

  // An empty box is not an attempt — spending one of two goes on a mis-tap
  // would mark dexterity rather than Italian.
  it("does not spend an attempt on an empty box", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "");

    expect(screen.getByText("Nothing written")).toBeInTheDocument();
    // Twice: once on the card, once in the live region, which is the whole
    // sentence here because there is no "where" to add to it.
    expect(screen.getAllByText(LOCATED.blank)).toHaveLength(2);
    expect(screen.getByText("Attempt 1 of 2")).toBeInTheDocument();
    expect(loadProgress().schedule[WORD_KEY]).toBeUndefined();
  });

  it("hands the answer over on request, grades it wrong, and takes the offer away", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await user.click(screen.getByRole("button", { name: "Show me" }));

    expect(screen.getByText("Here it is")).toBeInTheDocument();
    expect(screen.getByText(word.it)).toBeInTheDocument();
    // No cross: AnswerMark's hidden text calls it "your answer, incorrect",
    // and nothing was answered.
    expect(screen.queryByText("your answer, incorrect")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show me" })).not.toBeInTheDocument();
    expect(loadProgress().schedule[WORD_KEY].box).toBe(1);
  });

  // Without the settled guard, pressing the button again would grade the item
  // a second time — and a second grade after a right answer would demote the
  // box the answer had just earned.
  it("grades a settled item once, whatever else is pressed", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, word.it);
    expect(loadProgress().schedule[WORD_KEY].box).toBe(2);

    await user.click(screen.getByRole("button", { name: /See how it went/ }));
    expect(screen.getByText("That’s the round")).toBeInTheDocument();
    expect(loadProgress().schedule[WORD_KEY].box).toBe(2);
  });

  it("pronounces the answer without submitting the form", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await answer(user, "ciap");
    await answer(user, "ciar");
    await user.click(screen.getByRole("button", { name: `Pronounce "${word.it}"` }));

    expect(speech.speakItalian).toHaveBeenCalledWith(word.it);
    // Still on the same item: a speaker that submitted would have advanced.
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("goes back to the landing from inside a round", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await user.click(screen.getByRole("button", { name: /La Piazza/ }));
    expect(screen.getByRole("heading", { name: "La Piazza" })).toBeInTheDocument();
  });
});

describe("La Piazza — the round", () => {
  it("works through a mixed vocabulary and grammar queue and tallies the result", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning", [DRILL_KEY]: "learning" });
    renderReview();
    await startRound(user);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // Math.random is pinned, so the queue order is fixed: answer whichever
    // item is on screen, twice, and both modules get exercised.
    for (const step of [0, 1]) {
      await answer(user, screen.queryByText(drill.prompt) ? drill.answer : word.it);
      await user.click(screen.getByRole("button", { name: step === 0 ? /^Next/ : /See how it went/ }));
    }

    expect(screen.getByText("That’s the round")).toBeInTheDocument();
    expect(screen.getByText("right first time")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const saved = loadProgress();
    expect(saved.schedule[WORD_KEY].box).toBe(2);
    expect(saved.schedule[DRILL_KEY].box).toBe(2);
  });

  it("lists what is coming back, and returns to the landing", async () => {
    const user = userEvent.setup();
    seedDue({ [DRILL_KEY]: "learning" });
    renderReview();
    await startRound(user);

    await user.click(screen.getByRole("button", { name: "Show me" }));
    await user.click(screen.getByRole("button", { name: /See how it went/ }));

    expect(screen.getByText("coming back")).toBeInTheDocument();
    expect(screen.getByText("Worth another look")).toBeInTheDocument();
    expect(screen.getByText(drill.prompt.replace("___", drill.answer))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to La Piazza/ }));
    expect(screen.getByRole("heading", { name: "La Piazza" })).toBeInTheDocument();
  });
});

// A base-vocabulary word met on La Riserva's bench comes back here like
// anything else — that is the whole reason the drill goes through reviewItem
// rather than keeping a scheduler of its own. What it must not lose on the
// way is its Polish half.
describe("a word from La Riserva", () => {
  // `dire` is rank 17 and splits in Polish: "mówić · powiedzieć".
  const dire = FONDAMENTALE.find((e) => e.it === "dire");

  it("arrives in the queue under L'Officina, with both glosses", async () => {
    const user = userEvent.setup();
    seedDue({ [riservaKey(dire)]: "known" });
    renderReview();
    await startRound(user);

    expect(screen.getByText(/Base vocabulary/)).toBeInTheDocument();
    expect(screen.getByText("L'Officina")).toBeInTheDocument();
    expect(screen.getByText(dire.en)).toBeInTheDocument();
    expect(screen.getByText(dire.pl)).toHaveAttribute("lang", "pl");
  });

  it("grades through the same judge and promotes on a first-time answer", async () => {
    const user = userEvent.setup();
    seedDue({ [riservaKey(dire)]: "known" });
    renderReview();
    await startRound(user);
    await answer(user, "dire");

    expect(loadProgress().schedule[riservaKey(dire)].box).toBe(2);
  });
});

// The item card takes its colour and its label from the district the item
// came from, resolved by module id through districts.js. A scheduled module
// that resolved to nothing would be a crash rather than a missing colour, so
// the assumption is pinned here rather than guarded with a branch nothing
// could cover.
describe("what the screen assumes about the map", () => {
  it("resolves every scheduled module to exactly one district", () => {
    for (const mod of MODULE_STATS.filter((m) => m.scheduled)) {
      expect(districtForModule(mod.id), mod.id).toBeTruthy();
    }
  });

  // Two of the three name their own district. La Riserva is a bench inside
  // L'Officina, whose tile counts the vocabulary deck, so it resolves through
  // the walls it sits in rather than through a district invented for a
  // workbench — and it has to land in L'Officina, not just somewhere.
  it("puts a base-vocabulary item under L'Officina", () => {
    expect(DISTRICTS.filter((d) => d.module === "riserva")).toHaveLength(0);
    expect(districtForModule("riserva").id).toBe("officina");
  });

  // And a module id nothing knows about resolves to nothing, rather than to
  // whichever district happens to be first.
  it("resolves an unknown module to no district", () => {
    expect(districtForModule("nope")).toBeUndefined();
  });
});
