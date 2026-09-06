import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiservaModule from "./RiservaModule.jsx";
import { senses } from "./WordDetail.jsx";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { MODULE_STATS } from "../../shared/stats.js";
import { MAX_BOX, boxInterval } from "../../shared/srs.js";
import { saveProgress } from "../../shared/storage.js";
import * as speech from "../../shared/speech.js";

const divides = FONDAMENTALE.find((e) => e.pl.includes(" · "));
const single = FONDAMENTALE.find((e) => !e.pl.includes(" · "));

// The vocabulary deck is the only thing that puts a lexicon word in the
// scheduler, so a test that wants a box has to write the key it would write.
const vocab = MODULE_STATS.find((m) => m.id === "vocab");
const lemmas = new Map(FONDAMENTALE.map((e) => [e.it, e]));

function bridged() {
  for (const level of vocab.levels) {
    for (const unit of vocab.units(level)) {
      const entry = lemmas.get(unit.item.it);
      if (entry) return { unit, entry };
    }
  }
  throw new Error("no vocabulary word bridges into the lexicon");
}

// Open a word through the way in it actually has: a fascia, then a word.
async function openWord(user, entry) {
  const band = Math.floor((entry.rank - 1) / 200) + 1;
  await user.click(screen.getByRole("button", { name: new RegExp(`Fascia ${band} `) }));
  await user.click(screen.getByRole("button", { name: entry.it }));
}

beforeEach(() => {
  localStorage.clear();
  // jsdom has no SpeechSynthesis, and SpeakButton renders nothing without it.
  // Same mock the vocabulary module's tests use.
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

describe("senses", () => {
  it("splits on the separator the lexicon actually uses", () => {
    expect(senses("pytać · prosić o")).toEqual(["pytać", "prosić o"]);
    expect(senses("być")).toEqual(["być"]);
  });
});

describe("word detail", () => {
  it("opens from a fascia rather than from the grid", async () => {
    const user = userEvent.setup();
    const { container } = render(<RiservaModule onExit={() => {}} />);

    // The cells stay a picture: none of them is a control.
    expect(container.querySelector("[data-rank]").closest("button")).toBeNull();

    await openWord(user, FONDAMENTALE[0]);
    expect(screen.getByRole("heading", { name: FONDAMENTALE[0].it })).toBeInTheDocument();
    expect(screen.getByText(`posto ${FONDAMENTALE[0].rank}`)).toBeInTheDocument();
  });

  it("gives both glosses and a way to hear it", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, divides);

    expect(screen.getByText(senses(divides.en).join(" · "))).toBeInTheDocument();
    expect(screen.getByText(senses(divides.pl).join(" · "))).toHaveAttribute("lang", "pl");
    expect(screen.getByRole("button", { name: `Pronounce "${divides.it}"` })).toBeInTheDocument();
  });

  // The design's pink card, fired off data the lexicon already had.
  it("names the split when Polish uses more than one word", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, divides);

    expect(screen.getByText(/Polish uses more than one word here/)).toBeInTheDocument();
  });

  // And must not claim it when there is no split — the card is a statement
  // about this word, not decoration that fires everywhere.
  it("says nothing about a split when Polish has one word", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, single);

    expect(screen.queryByText(/Polish uses more than one word here/)).not.toBeInTheDocument();
  });

  // The card states the fact and refuses to say which of the two reasons it
  // is, because nothing in fondamentale.js distinguishes an aspect pair from
  // a meaning split. A card that guessed would be wrong about half the time.
  it("does not claim which reason the split has", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, divides);

    const card = screen.getByText(/two different reasons/);
    expect(card).toBeInTheDocument();
    expect(card.textContent).toMatch(/two senses Italian does not separate, or one sense in two aspects/);
  });

  it("reads the box off the scheduler when the word is in it", async () => {
    const user = userEvent.setup();
    const { unit, entry } = bridged();
    saveProgress({ words: { [unit.key]: "known" }, schedule: { [unit.key]: { box: MAX_BOX, due: "2099-01-01" } } });

    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);

    const where = screen.getByText(/Box/).textContent.replace(/\s+/g, " ");
    expect(where).toContain(`Box ${MAX_BOX} of ${MAX_BOX}`);
    expect(where).toContain(`${boxInterval(MAX_BOX)} days`);
  });

  // BOX_DAYS is [0, 1, 3, 7, 21], so the wording has to survive a same-day
  // gap and a one-day gap as well as the plural case. Each is a branch, and a
  // screen that said "1 days" would pass a test that only ever saw box 5.
  it.each([
    [1, "the same day"],
    [2, "1 day."],
    [3, "3 days"],
  ])("says the gap in words for box %i", async (box, expected) => {
    const user = userEvent.setup();
    const { unit, entry } = bridged();
    saveProgress({ words: { [unit.key]: "known" }, schedule: { [unit.key]: { box, due: "2099-01-01" } } });

    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);

    const where = screen.getByText(/Box/).textContent.replace(/\s+/g, " ");
    expect(where).toContain(`Box ${box} of ${MAX_BOX}`);
    expect(where).toContain(expected);
    // The top-box sentence is a different claim and must not leak downwards.
    expect(where).not.toMatch(/the top one/);
  });

  // Most of the lexicon has never been asked, and a due date for a word
  // nothing has ever put in the queue would be fiction.
  it("says there is no box rather than inventing a due date", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, FONDAMENTALE[0]);

    expect(screen.getByText(/Not in the scheduler/)).toBeInTheDocument();
    expect(screen.queryByText(/Box \s*\d/)).not.toBeInTheDocument();
  });

  // The design fills this with two sentences from episodes that do not exist,
  // and nothing in the app records where a word was met.
  it("states what the encounters list is waiting on instead of inventing one", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, FONDAMENTALE[0]);

    expect(screen.getByText(/Waiting on something that remembers where you met a word/)).toBeInTheDocument();
  });

  it("goes back to the grid", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, FONDAMENTALE[0]);

    await user.click(screen.getByRole("button", { name: /La Riserva/ }));
    expect(screen.getByRole("heading", { name: "La Riserva" })).toBeInTheDocument();
  });
});
