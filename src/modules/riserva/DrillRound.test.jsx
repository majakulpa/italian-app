import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiservaModule from "./RiservaModule.jsx";
import { FONDAMENTALE, FASCE } from "../../data/fondamentale.js";
import { loadProgress, saveProgress, riservaKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";
import { ROUND_SIZE } from "./drill.js";
import { LOCATED } from "../../shared/locatedFeedback.js";

// The drill is reached the way a learner reaches it — open the screen, open a
// fascia, press the round — rather than by rendering DrillRound in isolation.
// The band is the door PLAN.md settled on, and a test that skips the door
// would not notice the door closing.

const EMPTY = { version: 2, words: {}, schedule: {} };

const band1 = () => screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ });
const startRound = () => screen.getByRole("button", { name: /Drill the next/ });
const answerBox = () => screen.getByLabelText("Write it in Italian");
const checkButton = () => screen.getByRole("button", { name: /^(Check|Check again|Next|See how it went)/ });

// The verdict card, reached the way a screen reader reaches it — through the
// input's own aria-describedby. Scoping to it also keeps these assertions off
// the live region, which deliberately says the same things in plain text.
const verdictCard = () => within(document.getElementById(answerBox().getAttribute("aria-describedby")));

async function openRound(user) {
  render(<RiservaModule onExit={() => {}} />);
  await user.click(band1());
  await user.click(startRound());
}

async function answer(user, text) {
  if (text) await user.type(answerBox(), text);
  await user.click(checkButton());
}

beforeEach(() => {
  localStorage.clear();
});

describe("opening a round", () => {
  it("offers a fascia's next words and starts on the most frequent one", async () => {
    const user = userEvent.setup();
    await openRound(user);

    expect(screen.getByText(`1 / ${ROUND_SIZE}`)).toBeInTheDocument();
    expect(screen.getByText("to be")).toBeInTheDocument();
    expect(screen.getByText("posto 1")).toBeInTheDocument();
  });

  // PLAN.md's "Polish is a first-class layer": the Polish gloss is not a
  // translation of the English one, it is the other half of the prompt, and
  // it has to say what language it is in (WCAG 3.1.2).
  it("asks with both glosses, and marks the Polish one as Polish", async () => {
    const user = userEvent.setup();
    await openRound(user);

    expect(screen.getByText("to be")).toBeInTheDocument();
    expect(screen.getByText("być")).toHaveAttribute("lang", "pl");
  });

  // 87 of the first 300 entries split in Polish and the file cannot say
  // whether that is two senses or two aspects. Going gloss → Italian the
  // split is not ambiguity, and the screen says so rather than leaving two
  // Polish words reading as two questions.
  it("says when Polish uses more than one word, and does not when it does not", async () => {
    const user = userEvent.setup();
    await openRound(user);

    // `essere` is one Polish word; `di`, right behind it, is two.
    expect(screen.queryByText(/Polish uses more than one word/)).not.toBeInTheDocument();

    await answer(user, "essere");
    await user.click(checkButton());

    expect(screen.getByText("z · od")).toHaveAttribute("lang", "pl");
    expect(screen.getByText(/Polish uses more than one word/)).toBeInTheDocument();
  });
});

describe("grading", () => {
  // The load-bearing claim of the whole change: an answer here goes through
  // reviewItem, so one write puts the word in the Leitner queue *and* in the
  // coverage figure. No second mechanism.
  it("writes the box and the status together through reviewItem", async () => {
    const user = userEvent.setup();
    await openRound(user);
    await answer(user, "essere");

    const key = riservaKey(FONDAMENTALE[0]);
    expect(loadProgress().words[key]).toBe("known");
    expect(loadProgress().schedule[key].box).toBe(2);
  });

  // The same bar La Piazza sets: a correct answer that arrived after the app
  // said where to look is scaffolding, not retrieval.
  it("does not promote a word that took a second attempt", async () => {
    const user = userEvent.setup();
    await openRound(user);

    await answer(user, "essare");
    expect(verdictCard().getByText(LOCATED.partial)).toBeInTheDocument();

    await user.clear(answerBox());
    await answer(user, "essere");

    const key = riservaKey(FONDAMENTALE[0]);
    expect(loadProgress().words[key]).toBe("learning");
    expect(loadProgress().schedule[key].box).toBe(1);
  });

  it("locates a wrong answer without revealing it, then reveals on the second", async () => {
    const user = userEvent.setup();
    await openRound(user);

    await answer(user, "essare");
    expect(verdictCard().queryByText(/The answer is/)).not.toBeInTheDocument();

    await user.clear(answerBox());
    await answer(user, "assere");
    expect(verdictCard().getByText(/The answer is/)).toBeInTheDocument();
  });

  // An empty box is not an attempt — the same rule La Piazza applies, and the
  // reason it is worth re-checking here is that a blank must not spend a go
  // or mark the field invalid.
  it("treats an empty box as nothing to place rather than a wrong answer", async () => {
    const user = userEvent.setup();
    await openRound(user);
    await answer(user, "");

    expect(verdictCard().getByText(LOCATED.blank)).toBeInTheDocument();
    expect(answerBox()).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(/Attempt 1 of 2/)).toBeInTheDocument();
  });

  it("settles an item on Show me without promoting it", async () => {
    const user = userEvent.setup();
    await openRound(user);
    await user.click(screen.getByRole("button", { name: "Show me" }));

    expect(verdictCard().getByText(/The answer is/)).toBeInTheDocument();
    expect(loadProgress().words[riservaKey(FONDAMENTALE[0])]).toBe("learning");
  });

  // The verdict card is colour and shape; the live region is the only thing a
  // screen reader gets, so it has to carry the *where* rather than just the
  // fact of being wrong.
  it("announces where the answer went, not only that it went", async () => {
    const user = userEvent.setup();
    await openRound(user);
    await answer(user, "essare");

    expect(screen.getByRole("status").textContent).toContain(LOCATED.partial);
  });
});

describe("the end of a round", () => {
  // One word left unmet in band 1, so a whole round is two clicks rather than
  // twenty typed answers.
  function onlyOneLeft() {
    let progress = EMPTY;
    for (const entry of FONDAMENTALE.filter((e) => e.rank > 1 && e.rank <= FASCE[0].to)) {
      progress = reviewItem(progress, riservaKey(entry), true, "2026-09-01");
    }
    saveProgress(progress);
  }

  it("lists what is coming back and says where those words went", async () => {
    const user = userEvent.setup();
    onlyOneLeft();
    await openRound(user);

    await answer(user, "sbagliato");
    await user.clear(answerBox());
    await answer(user, "sbagliato");
    await user.click(screen.getByRole("button", { name: /See how it went/ }));

    expect(screen.getByRole("heading", { name: /That’s the round/ })).toBeInTheDocument();
    expect(screen.getByText("essere")).toBeInTheDocument();
    expect(screen.getByText(/is what brings them back/)).toBeInTheDocument();
  });

  it("comes back to the fasce and shows the word is no longer waiting", async () => {
    const user = userEvent.setup();
    onlyOneLeft();
    await openRound(user);

    await answer(user, "essere");
    await user.click(screen.getByRole("button", { name: /See how it went/ }));
    await user.click(screen.getByRole("button", { name: /Back to La Riserva/ }));

    // The band is still open — coming back from a round must not shut the
    // door you went through — so the sentence is already on screen.
    expect(band1()).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("button", { name: /Drill the next/ })).not.toBeInTheDocument();
    expect(screen.getByText(/You have met every word written down in this band/)).toBeInTheDocument();
  });
});

describe("a band with nothing to drill", () => {
  // The rule La Riserva's grid has drawn since it shipped, now enforced by
  // the thing that opens a round: a rank nobody has written down is a claim
  // about the file, so an empty band must not present as a drill of nothing.
  it("offers no round where no word is written down", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Fascia 4 · posti 601–800/ }));

    expect(screen.queryByRole("button", { name: /Drill the next/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing in this band is written down yet/)).toBeInTheDocument();
  });

  // And the other empty case, which is a claim about the learner rather than
  // about the file, so it gets a different sentence.
  it("says the band is met rather than offering an empty round", async () => {
    const user = userEvent.setup();
    let progress = EMPTY;
    for (const entry of FONDAMENTALE.filter((e) => e.rank <= FASCE[0].to)) {
      progress = reviewItem(progress, riservaKey(entry), true, "2026-09-01");
    }
    saveProgress(progress);

    render(<RiservaModule onExit={() => {}} />);
    await user.click(band1());

    expect(screen.queryByRole("button", { name: /Drill the next/ })).not.toBeInTheDocument();
    expect(screen.getByText(/You have met every word written down in this band/)).toBeInTheDocument();
  });

  it("counts what is left to meet in a band that is partly done", async () => {
    const user = userEvent.setup();
    saveProgress(reviewItem(EMPTY, riservaKey(FONDAMENTALE[0]), true, "2026-09-01"));

    render(<RiservaModule onExit={() => {}} />);
    await user.click(band1());

    expect(screen.getByText(/199 of the 200 written down here are still to meet/)).toBeInTheDocument();
  });
});
