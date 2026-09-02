import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArticoliModule from "./ArticoliModule.jsx";
import { announce, judge, LOCATED } from "./feedback.js";
import { STRANDS, RULES, ZERO, filled } from "../../data/articoli.js";
import { loadProgress, saveProgress, articoliKey } from "../../shared/storage.js";

const determinativo = STRANDS[0];
const preposizioni = STRANDS[2];
const caffe = determinativo.items[0];

// An option's accessible name is the form itself, or "no article" for the
// zero article — an em dash is silence to a screen reader — and once the item
// settles AnswerMark appends its own visually-hidden verdict to it.
const optionLabel = (form) => (form === ZERO ? "no article" : form);
const option = (form) => {
  const label = optionLabel(form);
  return screen.getByRole("button", { name: (name) => name === label || name.startsWith(`${label} `) });
};

const openStrand = async (user, strand = determinativo) => {
  await user.click(screen.getByRole("button", { name: new RegExp(strand.name) }));
  await user.click(screen.getByRole("button", { name: /Practise it/ }));
};

const advance = async (user) => user.click(screen.getByRole("button", { name: /^(Continua|See how it went)/ }));

// The visible verdict card only. Every sentence on it is repeated verbatim in
// the role="status" live region — that is the module working as intended, and
// it means a bare getByText for a located sentence finds two nodes.
const onCard = (matcher) => screen.getAllByText(matcher).filter((el) => !el.closest('[role="status"]'));

beforeEach(() => {
  localStorage.clear();
});

describe("the strand list", () => {
  it("opens on the design's own heading and its Italian line", () => {
    render(<ArticoliModule onExit={() => {}} />);

    expect(screen.getByRole("heading", { name: "Gli Articoli" })).toHaveAttribute("lang", "it");
    expect(screen.getByText("Il polacco non ne ha. Per questo non smette mai di comparire.")).toHaveAttribute("lang", "it");
  });

  // The order is the design's own footer and a teaching decision: there is
  // nothing to fuse until the definite article is already yours.
  it("lists the strands in the sequence the design states", () => {
    render(<ArticoliModule onExit={() => {}} />);

    const cards = screen.getAllByRole("button").filter((b) => /Passo \d\d/.test(b.textContent));
    expect(cards.map((c) => c.textContent.match(/Passo \d\d/)[0])).toEqual(["Passo 01", "Passo 02", "Passo 03"]);
    expect(cards[0].textContent).toContain(determinativo.name);
    expect(cards[2].textContent).toContain(preposizioni.name);
  });

  it("counts landed sentences out of storage rather than off the mockup", () => {
    saveProgress({ words: { [articoliKey(determinativo, caffe)]: "known" } });
    render(<ArticoliModule onExit={() => {}} />);

    expect(screen.getByRole("button", { name: new RegExp(determinativo.name) })).toHaveAccessibleName(
      expect.stringContaining(`1 / ${determinativo.items.length} landed`),
    );
  });

  // `giorno 148` is a day counter, and PLAN.md deleted the streak
  // permanently. `71%` is a figure of nothing. Neither may appear.
  //
  // Asserting the absence of the literals `148` and `71%` was worth nothing:
  // they were never in the source and nothing would ever put them there. What
  // has to hold is the general rule PLAN.md states — every number on this
  // screen is measured — so the assertion is that the digits on the screen are
  // *exactly* the passo numbers and the storage-derived fractions, derived
  // from STRANDS rather than typed out. Any drawn figure added to the screen
  // fails this, 148 and 71 among them.
  it("shows no number it has not measured", () => {
    const { container } = render(<ArticoliModule onExit={() => {}} />);

    expect(container.textContent).not.toMatch(/giorno|\bday\b|%/i);

    const cards = screen.getAllByRole("button").filter((b) => /Passo \d\d/.test(b.textContent));
    expect(cards).toHaveLength(STRANDS.length);

    cards.forEach((card, i) => {
      const passo = `Passo ${String(i + 1).padStart(2, "0")}`;
      const fraction = `0 / ${STRANDS[i].items.length} landed`;
      expect(card.textContent).toContain(passo);
      expect(card.textContent).toContain(fraction);
      // Its step number and its storage-derived fraction, and no other digit.
      expect(card.textContent.replace(passo, "").replace(fraction, "")).not.toMatch(/\d/);
      card.remove();
    });

    // Nor anywhere else on the screen.
    expect(container.textContent).not.toMatch(/\d/);
  });

  it("goes back the way it was opened", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<ArticoliModule onExit={() => (left = true)} exitLabel="L'Officina" />);

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(left).toBe(true);
  });
});

describe("the teaching card", () => {
  it("states every rule the strand goes on to drill", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: new RegExp(determinativo.name) }));

    // Every rule the strand declares, by its own `when` line — so a card that
    // rendered three of the four would fail here rather than pass on a count.
    for (const id of determinativo.teaches) {
      expect(screen.getByText(RULES[id].when), id).toBeInTheDocument();
    }
    // And the explanation under it, not just the forms and the heading.
    expect(screen.getByText(RULES.suono.says)).toBeInTheDocument();
    expect(screen.getAllByText("The rule")).toHaveLength(determinativo.teaches.length);
  });

  it("comes back to the strand list", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: new RegExp(determinativo.name) }));
    await user.click(screen.getByRole("button", { name: /Gli Articoli/ }));
    expect(screen.getByRole("heading", { name: "Gli Articoli" })).toBeInTheDocument();
  });
});

describe("the drill", () => {
  it("shows the sentence with a gap, and names the gap for a screen reader", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    expect(screen.getByText(/Bevo/).textContent).toContain("___");
    expect(screen.getByText("blank")).toBeInTheDocument();
    expect(option(ZERO)).toBeInTheDocument();
  });

  it("marks a right answer known and opens the rule and the Polish anchor", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option("il"));

    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(screen.getByText("Bevo il caffè ogni mattina.")).toHaveAttribute("lang", "it");
    expect(screen.getByText("Piję kawę")).toHaveAttribute("lang", "pl");
    expect(screen.getByText("One of the rules behind it")).toBeInTheDocument();
    expect(loadProgress().words[articoliKey(determinativo, caffe)]).toBe("known");
  });

  // The whole argument of this bench: a wrong answer is located, not solved.
  // The rule for `Bevo il caffè` is that Italian keeps the article on a mass
  // noun — printing it here would be handing over the answer.
  it("locates a wrong first answer without revealing anything", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option(ZERO));

    expect(onCard(/Italian does not leave this gap empty/)).toHaveLength(1);
    expect(screen.getByText(/Have another go/)).toBeInTheDocument();
    expect(screen.queryByText("Bevo il caffè ogni mattina.")).not.toBeInTheDocument();
    expect(screen.queryByText("Piję kawę")).not.toBeInTheDocument();
    expect(screen.queryByText("One of the rules behind it")).not.toBeInTheDocument();
    // Nothing is written until the item closes, so a first miss cannot be
    // read back as progress.
    expect(loadProgress().words[articoliKey(determinativo, caffe)]).toBeUndefined();
  });

  // The five located verdicts are the whole point of the strand's feedback,
  // so each one has to be shown to actually reach the card. feedback.test.js
  // proves locate() classifies them; these prove the module renders them,
  // which is a different claim and the one a learner depends on. With the
  // fusion and missing cases tested above, that is all five.
  it("names the dimension when the wrong kind of article was chosen", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    // `Bevo ___ caffè` wants the definite `il`; `un` is an article of the
    // wrong kind rather than a wrong shape.
    await user.click(option("un"));

    expect(onCard(/An article does belong here/)).toHaveLength(1);
    expect(screen.queryByText("Bevo il caffè ogni mattina.")).not.toBeInTheDocument();
  });

  it("names the dimension when an article was put where Italian wants none", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    // `Sono ___ medico` is the item where Polish beats English: the gap stays
    // empty, and reaching for `un` is the error English pushes you into.
    await openStrand(user, STRANDS[1]);

    await user.click(option("un"));

    expect(onCard(/Whether there is one at all is/)).toHaveLength(1);
  });

  it("names the dimension when the kind is right and only the shape is wrong", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    // Past the first item to `Ieri ___ studente`, whose three options are all
    // definite — so `il` against `lo` can only be the sound rule, and saying
    // "wrong kind" there would be a lie.
    await user.click(option(caffe.answer));
    await advance(user);

    await user.click(option("il"));

    expect(onCard(/Definite or indefinite is not what went wrong/)).toHaveLength(1);
  });

  it("gives a second attempt, and books a late right answer as still learning", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option(ZERO));
    expect(screen.getByText("Attempt 2 of 2")).toBeInTheDocument();

    await user.click(option("il"));
    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(loadProgress().words[articoliKey(determinativo, caffe)]).toBe("learning");
  });

  it("reveals only once both attempts are spent", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option(ZERO));
    await user.click(option("un"));

    expect(screen.getByText("Bevo il caffè ogni mattina.")).toBeInTheDocument();
    expect(screen.getByText("Piję kawę")).toBeInTheDocument();
    expect(loadProgress().words[articoliKey(determinativo, caffe)]).toBe("learning");
  });

  // Same rule as a shut district and a shut bench: aria-disabled, never
  // `disabled`, so an option already ruled out keeps its place in the tab
  // order instead of vanishing from under a keyboard user mid-item.
  it("rules out an option already tried without taking it out of the tab order", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option(ZERO));
    const tried = option(ZERO);
    expect(tried).toHaveAttribute("aria-disabled", "true");
    expect(tried).not.toBeDisabled();
    tried.focus();
    expect(document.activeElement).toBe(tried);

    // Pressing it again spends nothing: still attempt 2, still no reveal.
    await user.click(tried);
    expect(screen.getByText("Attempt 2 of 2")).toBeInTheDocument();
    expect(screen.queryByText("Bevo il caffè ogni mattina.")).not.toBeInTheDocument();
  });

  it("ignores a press on a settled item", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option("il"));
    await user.click(option("un"));

    // Still the right answer's card, not a fresh wrong verdict over the top.
    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(loadProgress().words[articoliKey(determinativo, caffe)]).toBe("known");
  });

  it("credits both words when the only thing missed was the joining", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user, preposizioni);

    await user.click(option("in il"));
    expect(onCard(/Both of those words are right/)).toHaveLength(1);
  });

  it("comes back to the strand list from mid-drill", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(screen.getByRole("button", { name: /Gli Articoli/ }));
    expect(screen.getByRole("heading", { name: "Gli Articoli" })).toBeInTheDocument();
  });

  // The header of Verdict claims the card and the live region "say the same
  // things", and until now nothing held it to that for the located sentences
  // specifically — the prose lived in two places and the fusion copy had
  // already drifted a comma apart. Each of the five now has to reach the card
  // *and* the live region as the one string in feedback.js, so a reworded
  // verdict cannot be reworded in only one of the three places.
  const routes = [
    { kind: "definiteness", strand: STRANDS[0], skip: 0, pick: "un" },
    { kind: "missing", strand: STRANDS[0], skip: 0, pick: ZERO },
    { kind: "form", strand: STRANDS[0], skip: 1, pick: "il" },
    { kind: "intrusive", strand: STRANDS[1], skip: 0, pick: "un" },
    { kind: "fusion", strand: STRANDS[2], skip: 0, pick: "in il" },
  ];

  it.each(routes)("shows and speaks the same $kind sentence feedback.js defines", async ({ strand, skip, pick }) => {
    const user = userEvent.setup();
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user, strand);

    for (const item of strand.items.slice(0, skip)) {
      await user.click(option(item.answer));
      await advance(user);
    }
    const said = LOCATED[judge(strand.items[skip], pick, 1).kind];

    await user.click(option(pick));

    expect(onCard(said)).toHaveLength(1);
    expect(container.querySelector('[role="status"]')).toHaveTextContent(said);
  });

  // Every one of the five, so a sixth kind added to LOCATED without a route
  // above fails here rather than going untested.
  it("has a route to every located verdict there is", () => {
    expect(routes.map((r) => r.kind).sort()).toEqual(Object.keys(LOCATED).sort());
  });

  // A screen reader gets no colour and no cards, so the live region has to
  // carry everything the feedback card shows — including the located "where",
  // which is the entire point of not just saying "incorrect".
  it("tells a screen reader everything the card shows", async () => {
    const user = userEvent.setup();
    const { container } = render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    await user.click(option("un"));
    const live = container.querySelector('[role="status"]');
    expect(live).toHaveTextContent(announce(judge(caffe, "un", 1)));
    expect(live.textContent).toContain("An article does belong here.");
  });
});

describe("the end of a run", () => {
  const runThrough = async (user, missFirst) => {
    for (const [i, item] of determinativo.items.entries()) {
      if (i === 0 && missFirst) {
        const wrong = item.options.find((o) => o !== item.answer);
        await user.click(option(wrong));
        await user.click(option(item.options.find((o) => o !== item.answer && o !== wrong)));
      } else {
        await user.click(option(item.answer));
      }
      await advance(user);
    }
  };

  it("tallies what landed and what had to be revealed", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);
    await runThrough(user, true);

    expect(screen.getByText("landed")).toBeInTheDocument();
    expect(screen.getByText("Worth another look")).toBeInTheDocument();
    expect(screen.getByText("Bevo il caffè ogni mattina.")).toBeInTheDocument();
  });

  // "Landed" was two different words. Storage wrote "known" only for a
  // first-attempt win, while the summary tile counted any eventual win, so one
  // second-attempt item made the summary read "5 landed" and the strand card
  // behind it read "4 / 5 landed" about the same five answers — and the item
  // that most deserved revisiting was filtered out of "Worth another look",
  // because that list is the complement of the same flag.
  //
  // Both numbers, in one test, on purpose: checking either alone would have
  // passed on the broken code.
  it("counts a second-attempt win the same way on the summary and on the strand card", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);

    // Item one missed once and then won back; every other item right first time.
    await user.click(option(caffe.options.find((o) => o !== caffe.answer)));
    await user.click(option(caffe.answer));
    await advance(user);
    for (const item of determinativo.items.slice(1)) {
      await user.click(option(item.answer));
      await advance(user);
    }

    const total = determinativo.items.length;
    const tile = (label) => screen.getByText(label).previousElementSibling;

    expect(tile("landed")).toHaveTextContent(String(total - 1));
    expect(tile("took a second look")).toHaveTextContent("1");
    // The won-back item is on the revisit list rather than filtered off it.
    expect(screen.getByText("Worth another look")).toBeInTheDocument();
    expect(screen.getByText(filled(caffe))).toBeInTheDocument();

    // The same five answers, counted by storage on the screen behind it.
    await user.click(screen.getByRole("button", { name: /Back to the strands/ }));
    expect(screen.getByRole("button", { name: new RegExp(determinativo.name) })).toHaveAccessibleName(
      expect.stringContaining(`${total - 1} / ${total} landed`),
    );
  });

  it("leaves the revisit list out when nothing was missed", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);
    await runThrough(user, false);

    expect(screen.queryByText("Worth another look")).not.toBeInTheDocument();
  });

  it("runs the same strand again from the top", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);
    await runThrough(user, false);

    await user.click(screen.getByRole("button", { name: /Run it again/ }));
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("goes back to the strand list, with the new count on it", async () => {
    const user = userEvent.setup();
    render(<ArticoliModule onExit={() => {}} />);
    await openStrand(user);
    await runThrough(user, false);

    await user.click(screen.getByRole("button", { name: /Back to the strands/ }));
    expect(screen.getByRole("button", { name: new RegExp(determinativo.name) })).toHaveAccessibleName(
      expect.stringContaining(`${determinativo.items.length} / ${determinativo.items.length} landed`),
    );
  });
});
