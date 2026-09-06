import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FalsiAmiciModule from "./FalsiAmiciModule.jsx";
import { TRAP_SETS, FALSI_AMICI } from "../../data/falsiAmici.js";
import { loadProgress, saveProgress, trapKey, trapCaughtKey } from "../../shared/storage.js";

const mapSet = TRAP_SETS.find((s) => s.id === "mappe");
const colazione = FALSI_AMICI.find((t) => t.id === "colazione");
const divano = FALSI_AMICI.find((t) => t.id === "divano");

const openSet = async (user, set) =>
  user.click(screen.getByRole("button", { name: new RegExp(`Practise these ${set.traps.length}`) }));

// What the eye gets, as opposed to what the ear gets. The live region
// repeats the verdict as plain text, so an unscoped getByText would match
// twice — and "the screen says it" and "the announcer says it" are two
// different claims worth making separately.
const visible = (matcher) => screen.getByText(matcher, { ignore: 'script, style, [role="status"]' });
const noneVisible = (matcher) => screen.queryAllByText(matcher, { ignore: 'script, style, [role="status"]' });

const field = () => screen.getByLabelText(/Write it in Italian/);
const check = () => screen.getByRole("button", { name: /^(Check|Next|See how it went)/ });

const answer = async (user, text) => {
  await user.clear(field());
  if (text !== "") await user.type(field(), text);
  await user.click(check());
};

beforeEach(() => {
  localStorage.clear();
});

describe("the collection", () => {
  // The argument the bench rests on: these are worth reading before they
  // catch you, so a fresh account sees all of them rather than an empty
  // screen that fills up with mistakes.
  it("shows every trap the app knows about on a fresh account", () => {
    render(<FalsiAmiciModule onExit={() => {}} />);

    for (const trap of FALSI_AMICI) {
      expect(screen.getAllByText(trap.it).length, trap.id).toBeGreaterThan(0);
      expect(visible(trap.note), trap.id).toBeInTheDocument();
    }
  });

  it("draws both halves of a pair, and the word to reach for instead", () => {
    render(<FalsiAmiciModule onExit={() => {}} />);

    expect(visible(new RegExp(divano.means))).toBeInTheDocument();
    expect(visible(new RegExp(divano.lookalikeMeans))).toBeInTheDocument();
    expect(screen.getAllByText(divano.say.it).length).toBeGreaterThan(0);
  });

  // Marked in a word before it is marked in a colour — the red surface is
  // silent to anyone not seeing it (WCAG 1.4.1).
  it("says in words which ones have caught you and which have not", () => {
    saveProgress({ words: { [trapCaughtKey(divano)]: "learning" } });
    render(<FalsiAmiciModule onExit={() => {}} />);

    expect(screen.getAllByText("Caught you")).toHaveLength(1);
    expect(screen.getAllByText("Not yet")).toHaveLength(FALSI_AMICI.length - 1);
  });

  it("counts the caught ones, out of every trap that exists", () => {
    saveProgress({ words: { [trapCaughtKey(divano)]: "learning" } });
    render(<FalsiAmiciModule onExit={() => {}} />);

    expect(visible(new RegExp(`1 of ${FALSI_AMICI.length} have caught you`))).toBeInTheDocument();
  });

  // The bench counts what has had you, not how the drilling is going. A
  // drill grade under the other key must not show up here, or the figure
  // would climb every time the learner practised.
  it("does not count a drilled trap as one that caught you", () => {
    saveProgress({ words: { [trapKey(divano)]: "known" } });
    render(<FalsiAmiciModule onExit={() => {}} />);

    expect(visible(new RegExp(`0 of ${FALSI_AMICI.length} have caught you`))).toBeInTheDocument();
    expect(noneVisible("Caught you")).toHaveLength(0);
  });

  it("leaves the module when asked", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<FalsiAmiciModule onExit={() => (left = true)} exitLabel="L'Officina" />);

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(left).toBe(true);
  });
});

describe("the drill", () => {
  it("asks for production from the lookalike, with nothing to pick from", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    const first = mapSet.traps[0];
    expect(visible(first.lookalike)).toBeInTheDocument();
    // The meaning, so the prompt is unambiguous — never the Italian.
    expect(visible(first.lookalikeMeans)).toBeInTheDocument();
    expect(field()).toBeInTheDocument();
    expect(noneVisible(first.say.it)).toHaveLength(0);
  });

  it("does nothing at all when the field is empty", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, "");
    expect(visible(/Attempt 1 of 2/)).toBeInTheDocument();
    expect(noneVisible(/Not there yet/)).toHaveLength(0);
  });

  // Accepted, and spelled out anyway: taking `realta` silently would teach
  // the wrong spelling by omission, and the accented vowels are two taps
  // away on a phone keyboard.
  it("takes an answer without its accent, and shows the accent anyway", async () => {
    const attualita = FALSI_AMICI.find((t) => t.id === "attualita");
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, mapSet.traps[0].say.it);
    await user.click(check());
    await answer(user, "realta");

    expect(visible(/Italian writes it/)).toBeInTheDocument();
    expect(screen.getAllByText(attualita.say.it).length).toBeGreaterThan(0);
    expect(loadProgress().words[trapKey(attualita)]).toBe("known");
  });

  it("goes back to the collection from the drill", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await user.click(screen.getByRole("button", { name: /Falsi Amici/ }));
    expect(screen.getByRole("heading", { name: "Falsi Amici" })).toBeInTheDocument();
  });
});

describe("a wrong answer is located, not solved", () => {
  it("tells the learner which word means what when they walk into the trap", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);

    expect(visible(/That is the trap itself/)).toBeInTheDocument();
    expect(visible(new RegExp(colazione.means))).toBeInTheDocument();
    // And still no answer, with an attempt left.
    expect(noneVisible(colazione.say.it)).toHaveLength(0);
    expect(visible(/Have another go/)).toBeInTheDocument();
  });

  it("says where a near miss went and withholds the answer", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, "cenare");
    expect(visible(/goes wrong after that/)).toBeInTheDocument();
    expect(visible("cena")).toBeInTheDocument();
  });

  it("reveals only after the second attempt is spent", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, "zuppa");
    expect(noneVisible(/The answer is/)).toHaveLength(0);

    await answer(user, "zuppa");
    expect(visible(/The answer is/)).toBeInTheDocument();
    expect(screen.getAllByText(colazione.say.it).length).toBeGreaterThan(0);
  });

  it("hands focus back to the field so the second attempt is an edit", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, "zuppa");
    expect(document.activeElement).toBe(field());
  });
});

// The write this whole bench exists for. Everything above is a screen; this
// is the fact the screen is a view of.
describe("what walking into a trap records", () => {
  it("marks the trap caught the moment the false friend is typed", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    expect(loadProgress().words[trapCaughtKey(colazione)]).toBeUndefined();
    await answer(user, colazione.bait);
    expect(loadProgress().words[trapCaughtKey(colazione)]).toBe("learning");
  });

  // Recovering on the second attempt is progress, and it shows up in the
  // grade — but it does not un-happen the catch. The collection is a record
  // of what has had you.
  it("keeps the trap caught even when the second attempt is right", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);
    await answer(user, colazione.say.it);

    expect(loadProgress().words[trapCaughtKey(colazione)]).toBe("learning");
    expect(loadProgress().words[trapKey(colazione)]).toBe("learning");
  });

  it("records nothing at all against a trap that was dodged", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.say.it);

    expect(loadProgress().words[trapCaughtKey(colazione)]).toBeUndefined();
    expect(loadProgress().words[trapKey(colazione)]).toBe("known");
  });

  // Right first time is "known", anything that needed a second look is
  // "learning" — the same bar Mappatura delle parole, Gli Articoli and the grammar drill
  // use, so the four cards mean the same thing.
  it("grades a revealed answer as still being learned", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, "zuppa");
    await answer(user, "zuppa");

    expect(loadProgress().words[trapKey(colazione)]).toBe("learning");
  });

  // Set membership, not a tally: the bench asks which traps have caught you,
  // and `words` maps a key to one string. A second hit writes the same value
  // over the same key and the collection reads the same.
  it("reads the same after a second hit as after the first", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);
    const afterOne = loadProgress().words[trapCaughtKey(colazione)];
    await answer(user, colazione.bait);

    expect(loadProgress().words[trapCaughtKey(colazione)]).toBe(afterOne);
  });

  it("shows the trap as caught on the collection once the run is over", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);
    await answer(user, colazione.bait);
    await user.click(screen.getByRole("button", { name: /^Next/ }));
    await user.click(screen.getByRole("button", { name: /Falsi Amici/ }));

    expect(visible(new RegExp(`1 of ${FALSI_AMICI.length} have caught you`))).toBeInTheDocument();
  });
});

describe("the end of a run", () => {
  const runThrough = async (user, plan) => {
    await openSet(user, mapSet);
    for (const [i, trap] of mapSet.traps.entries()) {
      await answer(user, plan(trap, i));
      if (noneVisible(/Have another go/).length > 0) await answer(user, plan(trap, i));
      await user.click(screen.getByRole("button", { name: /^(Next|See how it went)/ }));
    }
  };

  it("tallies what was dodged and what had to be revealed", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FalsiAmiciModule onExit={() => {}} />);
    await runThrough(user, (trap, i) => (i === 0 ? trap.bait : trap.say.it));

    expect(visible("dodged").previousSibling).toHaveTextContent(String(mapSet.traps.length - 1));
    expect(visible("revealed").previousSibling).toHaveTextContent("1");
    expect(visible(/These ones caught you/)).toBeInTheDocument();
    expect(visible(/they stay marked/)).toBeInTheDocument();
  });

  it("leaves the caught list out when nothing caught you", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FalsiAmiciModule onExit={() => {}} />);
    await runThrough(user, (trap) => trap.say.it);

    expect(noneVisible(/These ones caught you/)).toHaveLength(0);
  });

  it("can run the same set again, or go back to the collection", async () => {
    const user = userEvent.setup({ delay: null });
    render(<FalsiAmiciModule onExit={() => {}} />);
    await runThrough(user, (trap) => trap.say.it);

    await user.click(screen.getByRole("button", { name: /Run it again/ }));
    expect(visible(/1 \/ 5/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Falsi Amici/ }));
    await runThrough(user, (trap) => trap.say.it);
    await user.click(screen.getByRole("button", { name: /Back to the collection/ }));
    expect(screen.getByRole("heading", { name: "Falsi Amici" })).toBeInTheDocument();
  });
});

// WCAG 3.1.2 again, and this screen is the hardest case in the app: an
// Italian word, a Polish or English lookalike and English prose, in one
// sentence, fourteen times over.
describe("three languages on one screen", () => {
  const langOf = (text) => screen.getAllByText(text)[0].closest("[lang]")?.getAttribute("lang") ?? null;

  it("marks the Italian word Italian and the lookalike its own language", () => {
    render(<FalsiAmiciModule onExit={() => {}} />);

    expect(langOf(divano.it)).toBe("it");
    expect(langOf(divano.lookalike)).toBe("pl");
    // The English lookalike takes the document's own language.
    const parenti = FALSI_AMICI.find((t) => t.id === "parenti");
    expect(langOf(parenti.lookalike)).toBeNull();
  });

  it("marks the prompt and the typed field on the drill", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    expect(visible(mapSet.traps[0].lookalike).closest("[lang]")).toHaveAttribute("lang", "pl");
    expect(field()).toHaveAttribute("lang", "it");
  });
});

describe("the answer is announced, not just painted", () => {
  const region = () => screen.getByRole("status");

  it("mounts the live region empty and fills it once there is a verdict", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    expect(region()).toHaveTextContent("");
    await answer(user, colazione.say.it);
    expect(region()).toHaveTextContent("Correct.");
  });

  // A screen reader gets no colour and no card, so it has to be told which
  // way round the pair goes — that is the entire content of the verdict.
  it("speaks which word means what, not just that it was wrong", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);
    expect(region()).toHaveTextContent(new RegExp(colazione.means));
    expect(region()).toHaveTextContent(new RegExp(colazione.lookalikeMeans));
  });

  it("marks the field invalid while the answer is wrong", async () => {
    const user = userEvent.setup();
    render(<FalsiAmiciModule onExit={() => {}} />);
    await openSet(user, mapSet);

    await answer(user, colazione.bait);
    expect(field()).toHaveAttribute("aria-invalid", "true");
  });
});
