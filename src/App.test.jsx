import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { LEVELS } from "./data/vocab.js";
import { wordKey } from "./shared/storage.js";
import { DISTRICTS } from "./shared/districts.js";
import { MODULES } from "./App.jsx";
import { TABS } from "./shared/TabBar.jsx";

const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("opens on the city, with every district that ships drawn on it", () => {
    render(<App />);
    expect(screen.getByText("Italiano")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();

    for (const { name } of DISTRICTS) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeInTheDocument();
    }
  });

  // The dashboard reads storage once per mount rather than subscribing to it,
  // which only works because App unmounts it while a module is open. If that
  // ever changes to keeping the dashboard mounted, its numbers would freeze at
  // whatever they were when the app started, and this is the test that catches
  // it — the module-level tests all render their module in isolation.
  it("updates the dashboard after you study and come back", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /L'Officina/ })).toHaveTextContent(`0 / ${TOTAL_WORDS}`);

    // Two doors deep now: the district opens the workshop, and the workshop
    // opens the deck. Coming back out has to pass through both.
    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /I knew it/ }));

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    await user.click(screen.getByRole("button", { name: /La Città/ }));

    expect(screen.getByRole("button", { name: /L'Officina/ })).toHaveTextContent(`1 / ${TOTAL_WORDS}`);
  });

  // Review is a route rather than a MODULES entry, so nothing else covers
  // that La Piazza actually reaches a session and gets back.
  it("reaches the review session through La Piazza and returns", async () => {
    const user = userEvent.setup();
    const level = LEVELS.find((l) => l.id === "A1");
    const key = wordKey(level, level.categories[0], level.categories[0].words[0]);
    localStorage.setItem(
      "italiano:progress:v1",
      JSON.stringify({ words: { [key]: "learning" }, schedule: {} }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: /La Piazza/ }));
    expect(screen.getByRole("heading", { name: "La Piazza" })).toBeInTheDocument();

    // The district is a landing rather than a straight jump into a session,
    // so the route has to reach the round through it.
    await user.click(screen.getByRole("button", { name: /Start the round/ }));
    expect(screen.getByText("A1 · Vocabulary")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /La Piazza/ }));
    await user.click(screen.getByRole("button", { name: /La Città/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  it("opens the workshop from L'Officina and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /La Città/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  it("opens grammar from Il Cantiere and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Il Cantiere/ }));
    expect(screen.getByText("Regole in tasca")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  it("opens conversations from Il Mercato and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Il Mercato/ }));
    expect(screen.getByText("Due parole")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  // This used to assert the opposite: Il Cinema was shut on a fresh account
  // and could not be opened with the content that ships, so the map was not a
  // route to the stories module and only the switcher was. That gap was
  // called deliberate, but a door that never opens is not a gate — see
  // districts.js. The switcher is gone now, and the map is the way in.
  it("reaches the stories module from the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Il Cinema/ }));
    expect(screen.getByText("Quattro pagine")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });
});

describe("the tab bar", () => {
  const bar = () => screen.getByRole("navigation", { name: "Sections" });
  const tab = (label) => within(bar()).getByRole("button", { name: label });
  const currentTabs = () => within(bar()).getAllByRole("button").filter((b) => b.getAttribute("aria-current") === "page");

  it("is a labelled landmark of real, named buttons, with the map as the current page", () => {
    render(<App />);

    expect(within(bar()).getAllByRole("button").map((b) => b.textContent)).toEqual(TABS.map((t) => t.label));
    expect(currentTabs()).toEqual([tab("Città")]);
  });

  it("moves aria-current with the screen, and only ever marks one tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab("Officina"));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
    expect(currentTabs()).toEqual([tab("Officina")]);

    await user.click(tab("Città"));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
    expect(currentTabs()).toEqual([tab("Città")]);
  });

  // A district opened off the map is still in the city, so Città stays the
  // current tab rather than no tab at all.
  it("keeps Città current inside a module opened from the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Il Cantiere/ }));
    expect(screen.getByText("Regole in tasca")).toBeInTheDocument();
    expect(currentTabs()).toEqual([tab("Città")]);
  });

  // The lock rule, on the tab: La Piazza with nothing due is shut on the map,
  // and its tab must neither be disabled nor go nowhere. It opens onto the
  // landing, which says what opens the district.
  it("opens La Piazza's landing from its tab even when nothing is due", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(tab("Piazza")).not.toBeDisabled();
    expect(tab("Piazza")).not.toHaveAttribute("aria-disabled");

    await user.click(tab("Piazza"));
    expect(screen.getByRole("heading", { name: "La Piazza" })).toBeInTheDocument();
    expect(screen.getByText("Nothing due")).toBeInTheDocument();
    expect(screen.getByText(/the first ones come back/)).toBeInTheDocument();
    expect(currentTabs()).toEqual([tab("Piazza")]);
  });

  // Mid-session the bar stays, and a tab leaves the session. Pressing the tab
  // you are already under goes back to its front screen — the hub keeps
  // which bench is open in its own state, so without a remount it would stay
  // in the deck.
  it("stays on screen mid-session, and a tab press leaves the session", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab("Officina"));
    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    expect(screen.getByText("Tap to reveal translation")).toBeInTheDocument();
    expect(bar()).toBeInTheDocument();

    await user.click(tab("Officina"));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    await user.click(tab("Città"));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
    expect(screen.queryByText("Tap to reveal translation")).not.toBeInTheDocument();
  });

  // Focus stays where the press was. The bar is never unmounted by a tab
  // change, so a keyboard learner is not dropped onto the body.
  it("keeps focus on the tab that was pressed", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(tab("Officina"));
    expect(tab("Officina")).toHaveFocus();
  });
});

// The NavMenu was the one place every module was listed, and it is gone. So
// this is the proof nothing went with it: every MODULES entry, reached from
// the tab bar and the doors on the screens behind it, with no menu anywhere.
// A module added to MODULES without a way in fails the first assertion.
describe("every module is reachable without a menu", () => {
  const OFFICINA = (bench) => async (user) => {
    await user.click(within(screen.getByRole("navigation", { name: "Sections" })).getByRole("button", { name: "Officina" }));
    await user.click(screen.getByRole("button", { name: bench }));
  };
  const MAP = (district) => async (user) => {
    await user.click(screen.getByRole("button", { name: district }));
  };

  const ROUTES = {
    vocab: [OFFICINA(/Vocabulary/), () => screen.getByText("Parole in viaggio")],
    grammar: [MAP(/Il Cantiere/), () => screen.getByText("Regole in tasca")],
    conversations: [MAP(/Il Mercato/), () => screen.getByText("Due parole")],
    stories: [MAP(/Il Cinema/), () => screen.getByText("Quattro pagine")],
    mappe: [OFFICINA(/Mappatura delle parole/), () => screen.getByRole("heading", { name: "Mappatura delle parole" })],
    riserva: [OFFICINA(/La Riserva/), () => screen.getByRole("heading", { name: "La Riserva" })],
    articoli: [OFFICINA(/Gli Articoli/), () => screen.getByRole("heading", { name: "Gli Articoli" })],
    "falsi-amici": [OFFICINA(/Falsi Amici/), () => screen.getByRole("heading", { name: "Falsi Amici" })],
  };

  it("has a route for every module in the registry", () => {
    expect(Object.keys(ROUTES).sort()).toEqual(MODULES.map((m) => m.id).sort());
  });

  it.each(Object.keys(ROUTES))("reaches %s", async (id) => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();

    const [walk, landed] = ROUTES[id];
    await walk(user);
    expect(landed()).toBeInTheDocument();
  });
});
