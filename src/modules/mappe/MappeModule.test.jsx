import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MappeModule from "./MappeModule.jsx";
import { MAPS } from "../../data/mappe.js";
import { loadProgress, saveProgress, mappeKey } from "../../shared/storage.js";

const zione = MAPS.find((m) => m.id === "zione");
const drill = (id) => zione.drills.find((d) => d.id === id);

const openDrill = async (user) => {
  await user.click(screen.getByRole("button", { name: /-cja/ }));
  await user.click(screen.getByRole("button", { name: /Practise the rule/ }));
};

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

describe("the Mappe home", () => {
  it("lists every map as a rule rather than as a title", async () => {
    render(<MappeModule onExit={() => {}} />);

    for (const map of MAPS) {
      // Announced in words, not as a run of punctuation — the arrow and the
      // dot are aria-hidden and spelled out beside them.
      expect(screen.getByRole("button", { name: new RegExp(`becomes ${map.rule.to}`) })).toBeInTheDocument();
    }
  });

  it("shows how much of each map has been drilled", () => {
    saveProgress({ words: { [mappeKey(zione, drill("funzione"))]: "known" } });
    render(<MappeModule onExit={() => {}} />);

    expect(screen.getByRole("button", { name: /-cja/ })).toHaveAccessibleName(
      expect.stringContaining(`1 / ${zione.drills.length} drilled`),
    );
  });

  it("leaves the module when asked", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<MappeModule onExit={() => (left = true)} />);

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(left).toBe(true);
  });
});

describe("a mapping card", () => {
  it("teaches the rule, both roads and the trap before drilling anything", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /-cja/ }));

    // The Polish road first, because it is the shorter one on this map.
    const roads = screen.getAllByText(/— The (short|other) road/);
    expect(roads[0].textContent).toContain("Polish");
    expect(roads[1].textContent).toContain("English");

    expect(screen.getByText("lezione")).toBeInTheDocument();
    expect(screen.getByText("nazione")).toBeInTheDocument();
    // The trap is on the card, in the same breath as the rule.
    expect(screen.getByText("colazione")).toBeInTheDocument();
    expect(screen.getByText("kolacja")).toBeInTheDocument();
  });

  it("goes back to the list of maps", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /-cja/ }));
    await user.click(screen.getByRole("button", { name: /Le Mappe/ }));

    expect(screen.getByRole("heading", { name: "Le Mappe" })).toBeInTheDocument();
  });
});

describe("the drill", () => {
  it("asks for production — there is nothing to pick from", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);

    expect(screen.getByText("rewolucja")).toBeInTheDocument();
    expect(field()).toHaveValue("");
    // The answer is nowhere on the screen before it is typed.
    expect(noneVisible("rivoluzione")).toEqual([]);
  });

  it("names the rule and the sub-pattern nobody taught, on a right answer", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "rivoluzione");

    expect(visible(/You applied/)).toBeInTheDocument();
    expect(visible(/Nobody taught you that part/)).toBeInTheDocument();
    expect(screen.getByText("rewo-")).toBeInTheDocument();
    expect(screen.getByText("rivo-")).toBeInTheDocument();
  });

  it("accepts the answer without its accent, and shows the accent anyway", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /-ity/ }));
    await user.click(screen.getByRole("button", { name: /Practise the rule/ }));
    await answer(user, "possibilita");

    expect(visible("Right")).toBeInTheDocument();
    expect(visible(/Italian writes it/)).toBeInTheDocument();
    expect(visible("possibilità")).toBeInTheDocument();
  });

  it("does nothing at all when the field is empty", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "");

    expect(noneVisible("Right")).toEqual([]);
    expect(noneVisible("Not there yet")).toEqual([]);
    expect(screen.getByText("Attempt 1 of 2")).toBeInTheDocument();
  });
});

describe("a wrong answer is located, not solved", () => {
  it("says where it went and withholds the answer on the first attempt", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "rivolucione");

    expect(visible("Not there yet")).toBeInTheDocument();
    expect(visible(/You have/)).toBeInTheDocument();
    expect(visible("rivolu")).toBeInTheDocument();
    expect(visible(/Have another go/)).toBeInTheDocument();
    // Not solved: the answer is still not on the screen.
    expect(noneVisible("rivoluzione")).toEqual([]);
    expect(screen.getByText("Attempt 2 of 2")).toBeInTheDocument();
  });

  it("hands focus back to the field so the second attempt is an edit", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "rivolucione");

    expect(document.activeElement).toBe(field());
    expect(field()).toHaveValue("rivolucione");
  });

  it("reveals only after the second attempt is spent", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "rivolucione");
    await answer(user, "rivolucione");

    expect(visible(/The answer is/)).toBeInTheDocument();
    expect(visible("rivoluzione")).toBeInTheDocument();
    expect(field()).toHaveAttribute("readonly");
  });

  // On a trap item the rule is the thing being disproved, so the feedback
  // must not demand the rule's ending — "this map lands on -zione" would be
  // false advice about the one item that proves it doesn't.
  it("never demands the rule's ending on an item that sits outside the rule", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    for (const item of zione.drills.slice(0, -1)) {
      await answer(user, item.it);
      await user.click(check());
    }

    await answer(user, "pranzo");
    expect(visible(/the map does not reach/)).toBeInTheDocument();
    expect(noneVisible(/This map lands on/)).toEqual([]);
  });

  it("tells the learner the map failed, not them, when they typed the map's own answer", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    // Straight to the trap item, which is authored last on purpose.
    for (const item of zione.drills.slice(0, -1)) {
      await answer(user, item.it);
      await user.click(check());
    }

    expect(screen.getByText("kolacja")).toBeInTheDocument();
    await answer(user, "colazione");

    expect(visible(/is exactly what the rule gives you/)).toBeInTheDocument();
    expect(visible(/it means breakfast/)).toBeInTheDocument();
    // It is not praised as a rule correctly applied.
    expect(noneVisible(/You applied/)).toEqual([]);
  });
});

describe("what the drill records", () => {
  it("counts a first-time answer as known and a second-time one as learning", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);

    await answer(user, "rivoluzione");
    await user.click(check());
    await answer(user, "nonsense");
    await answer(user, "funzione");

    const words = loadProgress().words;
    expect(words[mappeKey(zione, drill("rivoluzione"))]).toBe("known");
    expect(words[mappeKey(zione, drill("funzione"))]).toBe("learning");
  });

  it("records a revealed answer as still being learned", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "nonsense");
    await answer(user, "nonsense");

    expect(loadProgress().words[mappeKey(zione, drill("rivoluzione"))]).toBe("learning");
  });
});

describe("the end of a run", () => {
  const runThrough = async (user, wrongAt = -1) => {
    await openDrill(user);
    for (const [i, item] of zione.drills.entries()) {
      if (i === wrongAt) {
        await answer(user, "nonsense");
        await answer(user, "nonsense");
      } else {
        await answer(user, item.it);
      }
      await user.click(check());
    }
  };

  it("tallies what landed and what had to be revealed", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await runThrough(user, 0);

    expect(screen.getByText(String(zione.drills.length - 1))).toBeInTheDocument();
    expect(screen.getByText("landed")).toBeInTheDocument();
    expect(screen.getByText("Worth another look")).toBeInTheDocument();
    expect(screen.getByText("rewolucja")).toBeInTheDocument();
  });

  it("leaves the review list out when nothing was missed", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await runThrough(user);

    expect(screen.queryByText("Worth another look")).not.toBeInTheDocument();
  });

  it("can run the same map again, or go back to the list", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await runThrough(user);

    await user.click(screen.getByRole("button", { name: "Run it again" }));
    expect(screen.getByText("rewolucja")).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Le Mappe/ }));
    await runThrough(user);
    await user.click(screen.getByRole("button", { name: "Back to the maps" }));
    expect(screen.getByRole("heading", { name: "Le Mappe" })).toBeInTheDocument();
  });
});

// WCAG 3.1.2: this screen puts Polish, English and Italian in one paragraph,
// so all three have to be marked or a screen reader reads `lekcja` with
// Italian phonetics and `lezione` with English ones.
describe("three languages on one screen", () => {
  const langOf = (node) => node.closest("[lang]")?.getAttribute("lang");

  it("marks the Polish prompt Polish and the Italian answer Italian", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await user.click(screen.getByRole("button", { name: /-cja/ }));

    expect(langOf(screen.getByText("lekcja"))).toBe("pl");
    expect(langOf(screen.getByText("lezione"))).toBe("it");
    expect(langOf(screen.getByText("kolacja"))).toBe("pl");
    expect(langOf(screen.getByText("colazione"))).toBe("it");
    // The English road's prompt is in the document's own language and must
    // not claim to be anything else.
    expect(langOf(screen.getByText("nation"))).toBeUndefined();
  });

  it("marks the typed field as Italian, and the prompt as its own language", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);

    expect(field()).toHaveAttribute("lang", "it");
    expect(langOf(screen.getByText("rewolucja"))).toBe("pl");
  });
});

describe("the answer is announced, not just painted", () => {
  it("mounts the live region empty and fills it once there is a verdict", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);

    // Mounted from the start with nothing in it — a region that appears with
    // its text already inside may never be announced. See LiveStatus.jsx.
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("");

    await answer(user, "rivoluzione");
    expect(live).toHaveTextContent("Correct. You applied -cja → -zione. You also changed rewo- to rivo-.");
  });

  // The located feedback is the part a screen-reader user would otherwise
  // lose entirely: the colour of the card says nothing and focus never moves.
  it("speaks where the answer went wrong, not just that it did", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    await answer(user, "rivolizione");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Not quite. The ending -zione is right; the word in front of it is not. You have rivol right, and it goes wrong after that. Try once more.",
    );
  });

  it("marks the field invalid while the answer is wrong", async () => {
    const user = userEvent.setup();
    render(<MappeModule onExit={() => {}} />);
    await openDrill(user);
    expect(field()).not.toHaveAttribute("aria-invalid");

    await answer(user, "nonsense");
    expect(field()).toHaveAttribute("aria-invalid", "true");
  });
});
