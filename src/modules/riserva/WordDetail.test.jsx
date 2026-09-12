import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiservaModule from "./RiservaModule.jsx";

import { FONDAMENTALE, glossSenses } from "../../data/fondamentale.js";
import { MODULE_STATS } from "../../shared/stats.js";
import { MAX_BOX, boxInterval } from "../../shared/srs.js";
import { saveProgress, storyKey } from "../../shared/storage.js";
import { wordTraces } from "./traces.js";
import * as speech from "../../shared/speech.js";
import { STORY_LEVELS } from "../../data/stories.js";

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
//
// The word is found by its text and a `button` selector rather than by role
// and accessible name. Both resolve to the same element, but an open band has
// 200 word buttons on it and a role query runs the accessibility filter —
// getComputedStyle per candidate — over every one of them, which under v8
// coverage instrumentation costs about half a second a call against a 20s
// timeout. This is navigation, not the assertion: that each word in a band is
// its own accessible control is claimed by RiservaModule.test.jsx's "opens a
// fascia to its words", where it is the point of the test.
async function openWord(user, entry) {
  const band = Math.floor((entry.rank - 1) / 200) + 1;
  await user.click(screen.getByRole("button", { name: new RegExp(`Fascia ${band} `) }));
  await user.click(screen.getByText(entry.it, { selector: "button" }));
}

beforeEach(() => {
  localStorage.clear();
  // jsdom has no SpeechSynthesis, and SpeakButton renders nothing without it.
  // Same mock the vocabulary module's tests use.
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
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

    expect(screen.getByText(glossSenses(divides.en).join(" · "))).toBeInTheDocument();
    expect(screen.getByText(glossSenses(divides.pl).join(" · "))).toHaveAttribute("lang", "pl");
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

  // The design fills this with `Ep. 7` and `Il Bar`, both of which are
  // drawings. What the app can prove is the deck's example sentence and the
  // story glosses — see traces.js — so a word the deck teaches lists it, and
  // a word neither source reaches says so rather than inventing one.
  it("lists a real encounter for a word the deck teaches", async () => {
    const user = userEvent.setup();
    const { entry } = bridged();

    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);

    expect(screen.getByText(/dove l'hai incontrata/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nowhere yet/)).not.toBeInTheDocument();
    // Never the design's invented ones.
    expect(screen.queryByText(/Ep\. 7|Il Bar/)).not.toBeInTheDocument();
  });

  // The second source, and the one whose claim is narrower: reading a story
  // writes no word status, so a story trace can only say the story was
  // finished. It carries the gloss the story itself gave, verbatim, because
  // matching is by written form and a homograph can land under the wrong
  // sense — printing the story's own words makes that visible.
  it("lists a story that glossed the word, in the story's own words", async () => {
    const user = userEvent.setup();
    const empty = { words: {}, schedule: {}, stories: {} };
    const entry = FONDAMENTALE.find((e) => wordTraces(empty, e).some((t) => t.kind === "story"));
    const trace = wordTraces(empty, entry).find((t) => t.kind === "story");

    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);

    expect(screen.getByText(new RegExp(trace.where))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`glossed there as .${trace.meaning}`))).toBeInTheDocument();
  });

  it("marks an encounter you have finished", async () => {
    const user = userEvent.setup();
    const empty = { words: {}, schedule: {}, stories: {} };
    const entry = FONDAMENTALE.find((e) => wordTraces(empty, e).some((t) => t.kind === "story"));
    const { story, level } = (() => {
      for (const lvl of STORY_LEVELS)
        for (const st of lvl.stories)
          if (st.title === wordTraces(empty, entry).find((t) => t.kind === "story").where) return { story: st, level: lvl };
      throw new Error("story not found");
    })();

    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);
    expect(screen.queryByText("· done")).not.toBeInTheDocument();

    saveProgress({ words: { [storyKey(level, story)]: "done" } });
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, entry);
    expect(screen.getAllByText("· done").length).toBeGreaterThan(0);
  });

  it("says so plainly for a word neither source reaches", async () => {
    const user = userEvent.setup();
    // Rank 1 is `essere`, which the vocabulary deck does not teach.
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, FONDAMENTALE[0]);

    expect(screen.getByText(/Nowhere yet/)).toBeInTheDocument();
  });

  it("goes back to the grid", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);
    await openWord(user, FONDAMENTALE[0]);

    await user.click(screen.getByRole("button", { name: /La Riserva/ }));
    expect(screen.getByRole("heading", { name: "La Riserva" })).toBeInTheDocument();
  });
});
