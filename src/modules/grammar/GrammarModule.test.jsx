import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GrammarModule from "./GrammarModule.jsx";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import * as speech from "../../shared/speech.js";
import * as srs from "../../shared/srs.js";
import { loadProgress, drillKey, stageEvidenceKey, todayISO, addDaysISO } from "../../shared/storage.js";

const a1 = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const presentAre = a1.topics.find((t) => t.id === "present-are");
const c1 = GRAMMAR_LEVELS.find((l) => l.id === "C1");
const ipotetico = c1.topics.find((t) => t.id === "periodo-ipotetico");

beforeEach(() => {
  localStorage.clear();
  // Identity-shuffle so drill/option order always matches data/grammar.js exactly.
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderGrammar() {
  return render(<GrammarModule onExit={() => {}} />);
}

describe("GrammarHome", () => {
  it("shows A1 topics by default with taglines", () => {
    renderGrammar();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Presente: verbi in -ARE")).toBeInTheDocument();
    expect(screen.getByText("Essere e avere")).toBeInTheDocument();
    expect(screen.getByText(presentAre.tagline)).toBeInTheDocument();
  });

  it("switches topics when a different level is selected", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /Intermedio/ }));
    expect(screen.getByText("Passato prossimo")).toBeInTheDocument();
    expect(screen.getByText("Comparativi")).toBeInTheDocument();
    expect(screen.queryByText("Presente: verbi in -ARE")).not.toBeInTheDocument();
  });

  it("reaches the top of the ladder, not just the first three levels", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /Avanzato/ }));

    for (const topic of c1.topics) {
      expect(screen.getByText(topic.name)).toBeInTheDocument();
    }
    expect(screen.getByText(c1.tagline)).toBeInTheDocument();
  });
});

describe("Lesson", () => {
  it("shows the explanation, conjugation table, and example sentences", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    expect(screen.getByText(presentAre.explanation.summary)).toBeInTheDocument();
    expect(screen.getByText("parlare")).toBeInTheDocument(); // table header
    expect(screen.getByText("parliamo")).toBeInTheDocument(); // table cell
    expect(screen.getByText(presentAre.explanation.points[0])).toBeInTheDocument();
    expect(screen.getByText(`"${presentAre.explanation.examples[0].it}"`)).toBeInTheDocument();
    expect(screen.getByText(presentAre.explanation.examples[0].en)).toBeInTheDocument();
  });

  it("translates the infinitive and the subject pronouns for a beginner", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    // The header verb, glossed from the data.
    expect(screen.getByText("to speak")).toBeInTheDocument();
    // The pronoun column, glossed from PRONOUN_GLOSS rather than the data.
    for (const en of ["I", "you", "he / she", "we", "you (plural)", "they"]) {
      expect(screen.getByText(en)).toBeInTheDocument();
    }
  });

  it("translates the row labels of a table that isn't a conjugation", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /Elementare/ }));
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[1]); // Articoli

    expect(screen.getByText("singular")).toBeInTheDocument();
    expect(screen.getByText("masc. + vowel")).toBeInTheDocument();
    // Pronoun glosses must not leak into a table with no pronouns in it.
    expect(screen.queryByText("he / she")).not.toBeInTheDocument();
  });

  // The if-sentence table has no pronoun column at all: every label is an
  // { it, en } pair, including the row labels. Nothing else exercises a
  // table where PRONOUN_GLOSS contributes nothing.
  it("translates a table whose every label is spelled out in the data", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /Avanzato/ }));
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    expect(screen.getByText(ipotetico.explanation.summary)).toBeInTheDocument();
    for (const header of ipotetico.explanation.table.headers.filter((h) => h !== "")) {
      expect(screen.getByText(header.it)).toBeInTheDocument();
      expect(screen.getByText(header.en)).toBeInTheDocument();
    }
    for (const [label] of ipotetico.explanation.table.rows) {
      expect(screen.getByText(label.it)).toBeInTheDocument();
      expect(screen.getByText(label.en)).toBeInTheDocument();
    }
  });

  it("shows the drill sentence in English alongside a hint naming the verb", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    // Drill order is shuffled, so assert against whichever item came up.
    const shown = presentAre.drills.find((d) => screen.queryByText(d.prompt));
    expect(shown).toBeDefined();
    expect(screen.getByText(shown.en)).toBeInTheDocument();
    expect(screen.getByText(shown.hint)).toBeInTheDocument();
    expect(shown.hint).toMatch(/\(to \w+\)/);
  });

  it("starts the drill from the lesson screen", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);
    await user.click(screen.getByRole("button", { name: /Start drill/ }));

    expect(screen.getByText(presentAre.drills[0].prompt)).toBeInTheDocument();
    expect(screen.getByText(presentAre.drills[0].hint)).toBeInTheDocument();
  });
});

describe("Drill", () => {
  // The options are real <button>s, so Enter and Space are the browser's own
  // activation — these cases pin that they stay real buttons rather than
  // going back to a div with a hand-wired keydown handler.
  it("answers with the keyboard as well as the pointer", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    screen.getByRole("button", { name: item0.answer }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  it("ignores keys that aren't Enter or Space", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    screen.getByRole("button", { name: presentAre.drills[0].answer }).focus();
    await user.keyboard("a");

    expect(screen.getByText("0 correct")).toBeInTheDocument();
  });

  it("answers on Space too", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    screen.getByRole("button", { name: item0.answer }).focus();
    await user.keyboard(" ");

    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  // Same double-answer guard as the vocab quiz — a second click must not
  // re-grade the drill or move its Leitner box a second time.
  it("ignores a second pick once an answer is in", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    await user.click(screen.getByRole("button", { name: item0.answer }));
    const other = item0.options.find((o) => o !== item0.answer);
    await user.click(screen.getByRole("button", { name: other }));

    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  it("marks a correct answer, updates the score, and advances", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    expect(screen.getByText(item0.prompt)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: item0.answer }));
    expect(screen.getByText("1 correct")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText(presentAre.drills[1].prompt)).toBeInTheDocument();
  });

  // Advanced answers are whole phrases ("si è mangiato", "avessi detto"),
  // not single words, so they carry spaces and accents through the option
  // button's accessible name.
  it("grades a multi-word answer at the top of the ladder", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /Avanzato/ }));
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = ipotetico.drills[0];
    expect(screen.getByText(item0.prompt)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: item0.answer }));
    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  it("marks a wrong answer without crediting the score", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    const wrongOption = item0.options.find((opt) => opt !== item0.answer);

    await user.click(screen.getByRole("button", { name: wrongOption }));
    expect(screen.getByText("0 correct")).toBeInTheDocument();
  });

  it("completes the drill, shows a summary, and persists mastered items", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    for (const item of presentAre.drills) {
      await user.click(screen.getByRole("button", { name: item.answer }));
      await user.click(screen.getByRole("button", { name: /Next|See results/ }));
    }

    expect(screen.getByText("Drill complete")).toBeInTheDocument();
    expect(screen.getByText(`correct out of ${presentAre.drills.length}`)).toBeInTheDocument();
    expect(screen.getByText(String(presentAre.drills.length))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to topics" }));
    expect(screen.getByText(`${presentAre.drills.length} / ${presentAre.drills.length} mastered`)).toBeInTheDocument();
  });

  it("lists missed items for review at the end", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const [first, ...rest] = presentAre.drills;
    const wrongOption = first.options.find((opt) => opt !== first.answer);
    await user.click(screen.getByRole("button", { name: wrongOption }));
    await user.click(screen.getByRole("button", { name: /Next|See results/ }));

    for (const item of rest) {
      await user.click(screen.getByRole("button", { name: item.answer }));
      await user.click(screen.getByRole("button", { name: /Next|See results/ }));
    }

    expect(screen.getByText("Drill complete")).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
    expect(screen.getByText("TO REVIEW")).toBeInTheDocument();
    expect(screen.getByText(first.prompt.replace("___", first.answer))).toBeInTheDocument();
  });

  // A speaker button beside the prompt read the sentence with the gap filled
  // in, and SpeakButton names itself `Pronounce "<text>"` — so the answer was
  // in an accessible name before the learner had answered. The name is the
  // half a screen reader gets, and tab-focus alone was enough to be handed
  // it; these two cases pin both halves of the fix.
  it("keeps the answer out of every accessible name while the item is unanswered", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    const sentence = item0.prompt.replace("___", item0.answer);

    // The only speakers on an unanswered item are the per-option ones, which
    // say nothing that isn't already printed on the button beside them.
    const names = screen
      .getAllByRole("button", { name: /^Pronounce/ })
      .map((b) => b.getAttribute("aria-label"));
    expect(names.sort()).toEqual(item0.options.map((o) => `Pronounce "${o}"`).sort());
    expect(screen.queryByRole("button", { name: `Pronounce "${sentence}"` })).not.toBeInTheDocument();
    // And nothing at all on the screen offers to read the filled sentence.
    for (const name of names) expect(name).not.toContain(sentence);
  });

  it("offers the whole sentence aloud once the item is answered", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    const sentence = item0.prompt.replace("___", item0.answer);
    await user.click(screen.getByRole("button", { name: item0.answer }));

    await user.click(screen.getByRole("button", { name: `Pronounce "${sentence}"` }));
    expect(speakSpy).toHaveBeenCalledWith(sentence);
  });

  // Advancing used to unmount the button that was just pressed and leave
  // focus on <body>: re-tab from the top of the document for every question,
  // and silence about the item that replaced the answered one.
  it("moves focus to the next prompt instead of dropping it to the body", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    await user.click(screen.getByRole("button", { name: presentAre.drills[0].answer }));
    await user.click(screen.getByRole("button", { name: /Next/ }));

    const prompt = screen.getByRole("heading", { name: presentAre.drills[1].prompt });
    expect(prompt).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it("lets the user hear an answer option without selecting it", async () => {
    // jsdom has no SpeechSynthesis API — mock it locally for this test only,
    // so other tests keep matching options by their exact accessible name
    // (adding a nested "Pronounce ..." button would otherwise change it).
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    const speakButton = screen.getByRole("button", { name: `Pronounce "${item0.answer}"` });
    await user.click(speakButton);

    expect(speakSpy).toHaveBeenCalledWith(item0.answer);
    // Still on the same question, nothing selected — the click didn't choose it.
    expect(screen.getByText("0 correct")).toBeInTheDocument();
    expect(screen.getByText(item0.prompt)).toBeInTheDocument();
  });
});

// PLAN.md: never grade a structure above the learner's stage. A fresh learner
// is at stage 1, presente, so a passato prossimo item is above her stage and a
// wrong pick on it must not read as wrong anywhere — not in the option, the
// mark, the live region, the score or the summary — and must be deferred in
// the queue rather than demoted.
describe("Drill above the learner's stage", () => {
  const b1 = GRAMMAR_LEVELS.find((l) => l.id === "B1");
  const passato = b1.topics.find((t) => t.id === "passato-prossimo");
  const item = passato.drills[0]; // "Ieri io ___ la pasta." — ho mangiato
  const wrong = item.options.find((opt) => opt !== item.answer);
  const KEY = drillKey(b1, passato, item);
  const tomorrow = addDaysISO(todayISO(), 1);

  const openPassato = async (user) => {
    await user.click(screen.getByRole("button", { name: /Intermedio/ }));
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);
  };

  it("draws no wrong surface for a wrong pick, and says why instead", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await openPassato(user);
    await user.click(screen.getByRole("button", { name: wrong }));

    // The option she picked: no cross, no red.
    const picked = screen.getByRole("button", { name: wrong });
    expect(picked).toHaveAccessibleName(wrong);
    expect(picked.style.color).not.toContain("corallo");
    expect(picked.parentElement.getAttribute("style")).not.toContain("corallo");
    expect(screen.queryByText("your answer, incorrect")).not.toBeInTheDocument();

    // The live region: no "Not quite", the stage and the form instead.
    const status = document.querySelector('[role="status"]');
    expect(status.textContent).not.toMatch(/Not quite/);
    expect(status.textContent).toBe(
      "This form belongs to stage 2, passato prossimo. You are at stage 1, presente, so it is not corrected yet. The form is ho mangiato.",
    );
    expect(status.querySelector('[lang="it"]')).not.toBeNull();

    // On screen, the same, with the stage names marked Italian.
    expect(screen.getByText("Not corrected yet")).toBeInTheDocument();
    const names = screen.getAllByText("passato prossimo");
    expect(names.every((el) => el.closest('[lang="it"]'))).toBe(true);

    // Not counted against the score.
    expect(screen.getByText("0 correct")).toBeInTheDocument();
  });

  it("defers the item in the queue instead of demoting it", async () => {
    const reviewSpy = vi.spyOn(srs, "reviewItem");
    const deferSpy = vi.spyOn(srs, "deferItem");
    const user = userEvent.setup();
    renderGrammar();
    await openPassato(user);
    await user.click(screen.getByRole("button", { name: wrong }));

    expect(deferSpy).toHaveBeenCalledWith(expect.anything(), KEY);
    expect(reviewSpy).not.toHaveBeenCalled();
    const saved = loadProgress();
    expect(saved.words[KEY]).toBe("learning");
    expect(saved.schedule[KEY]).toMatchObject({ box: 1, due: tomorrow });
    expect(saved.words[stageEvidenceKey(KEY)]).toBe("shown");
  });

  it("leaves it out of the score's denominator and the review list, and says how many", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await openPassato(user);

    await user.click(screen.getByRole("button", { name: wrong }));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    for (const rest of passato.drills.slice(1)) {
      await user.click(screen.getByRole("button", { name: rest.answer }));
      await user.click(screen.getByRole("button", { name: /Next|See results/ }));
    }

    expect(screen.getByText(`correct out of ${passato.drills.length - 1}`)).toBeInTheDocument();
    expect(screen.getByText("1 form was shown but not corrected — above your stage for now.")).toBeInTheDocument();
    expect(screen.queryByText("TO REVIEW")).not.toBeInTheDocument();
    expect(screen.getByText("to review").previousSibling).toHaveTextContent("0");
  });

  it("promotes a right pick above stage exactly as before, and counts it as no evidence", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await openPassato(user);
    await user.click(screen.getByRole("button", { name: item.answer }));

    const saved = loadProgress();
    expect(saved.words[KEY]).toBe("known");
    expect(saved.schedule[KEY].box).toBe(2);
    expect(saved.words).not.toHaveProperty(stageEvidenceKey(KEY));
    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  // At stage 1 a presente item is graded: wrong is wrong, as it always was, and
  // the right option having just been painted makes the next typed answer to
  // it a copy rather than evidence.
  it("still corrects a wrong pick at the learner's stage, and marks it shown", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const first = presentAre.drills[0];
    await user.click(screen.getByRole("button", { name: first.options.find((o) => o !== first.answer) }));

    expect(screen.getByText("your answer, incorrect")).toBeInTheDocument();
    expect(screen.queryByText("Not corrected yet")).not.toBeInTheDocument();
    const saved = loadProgress();
    const key = drillKey(a1, presentAre, first);
    expect(saved.schedule[key]).toMatchObject({ box: 1, due: todayISO() });
    expect(saved.words[stageEvidenceKey(key)]).toBe("shown");
  });
});

// WCAG 3.1.2: Italian on an English page has to say it is Italian, or a
// screen reader reads it in an English voice. src/a11y.test.jsx sweeps the
// drill prompt and options; these are the strings on this module's other
// screens that it doesn't reach.
describe("language marking", () => {
  const italianAncestor = (el) => el.closest('[lang="it"]');

  it("marks the home screen's Italian eyebrow and topic names as Italian", () => {
    renderGrammar();

    expect(italianAncestor(screen.getByText("Regole in tasca"))).not.toBeNull();
    expect(italianAncestor(screen.getByText("Presente: verbi in -ARE"))).not.toBeNull();
    expect(italianAncestor(screen.getByText("Essere e avere"))).not.toBeNull();
    // The English around it must not claim to be Italian.
    expect(italianAncestor(screen.getByText("Grammar"))).toBeNull();
    expect(italianAncestor(screen.getByText(presentAre.tagline))).toBeNull();
  });

  it("marks the lesson heading as Italian", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    expect(italianAncestor(screen.getByRole("heading", { name: presentAre.name }))).not.toBeNull();
    expect(italianAncestor(screen.getByText(presentAre.explanation.summary))).toBeNull();
  });
});
