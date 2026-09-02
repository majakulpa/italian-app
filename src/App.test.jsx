import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { LEVELS } from "./data/vocab.js";
import { wordKey } from "./shared/storage.js";
import { DISTRICTS } from "./shared/districts.js";

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
    expect(screen.getByText(/· REVIEW/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  it("keeps Review out of the module switcher, which lists content modules only", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items).toEqual([
      "All modules",
      "Vocabulary",
      "Grammar",
      "Conversations",
      "Stories",
      "Le Mappe",
      "Gli Articoli",
    ]);
  });

  // Both benches inside L'Officina are also switcher entries, and the
  // switcher opens them at the top level rather than inside the workshop. So
  // each of them has two routes into it that exit to different places, and
  // this is the pair of tests that keeps the second one working — before the
  // hub, the district was the only thing rendering the deck.
  it("opens vocabulary from the switcher and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Vocabulary" }));
    expect(screen.getByText("Parole in viaggio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  // Le Mappe has no district of its own — it is a bench inside L'Officina —
  // but it keeps its NavMenu entry like every other content module, and that
  // second route has to land at the top level and come back to the city
  // rather than to the workshop.
  it("opens Le Mappe from the switcher and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Le Mappe" }));
    expect(screen.getByRole("heading", { name: "Le Mappe" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });

  // Gli Articoli is the same shape as Le Mappe: a bench inside L'Officina
  // with a NavMenu entry of its own, so it has the same second route to keep
  // honest. Without this the module's `onExit` at the App level is never
  // called by anything, which the coverage gate reports and a learner would
  // discover by being unable to get out.
  it("opens Gli Articoli from the switcher and returns to the city", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Gli Articoli" }));
    expect(screen.getByRole("heading", { name: "Gli Articoli" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
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

  // Il Cinema is shut on a fresh account and cannot be opened with the
  // content that ships — 600 solid words is past the app's own ceiling of 20
  // — so the map is not a route to the stories module today. The switcher
  // still is. That gap is deliberate for now and stated here rather than
  // papered over: the map gates the district, the menu does not gate the
  // module behind it.
  it("leaves the stories module reachable from the switcher while Il Cinema is shut", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /Il Cinema/ })).toHaveAccessibleName(/locked/);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Stories" }));
    expect(screen.getByText("Quattro pagine")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByRole("heading", { name: "La Città" })).toBeInTheDocument();
  });
});
