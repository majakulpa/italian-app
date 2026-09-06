// The one derived fact La Piazza's landing screen states about the week.
//
// ── What the design draws, and why this isn't it ─────────────────────────
// Design screen 18 puts a warning card at the top of La Piazza:
//
//     14 parole escono da «solida» se non le rivedi entro giovedì.
//     (14 words leave "solid" if you don't review them by Thursday.)
//
// That sentence would be false in this codebase, and shipping it would be
// the same mistake as the four padlocks the map refused (districts.js) and
// the figures the workbenches refused (officina/benches.js): a number drawn
// in a mockup with nothing behind it. There is no decay in srs.js. An
// unreviewed item in the top box stays in the top box forever — it just goes
// overdue. Nothing leaves "solid" by neglect, so nothing can be defended by
// answering it before Thursday, and a card that says otherwise invents a
// penalty in order to manufacture urgency. PLAN.md deleted the streak for
// exactly that reason.
//
// The real fact underneath it is derivable and is worth stating: which of the
// words you know best are next in the queue. `solidThisWeek` counts words at
// the top box whose turn comes round inside the next seven days.
//
// Two boundaries, both deliberate:
//
//   - already due is excluded. Those are the queue, and the queue is the
//     count in the badge beside the title. This card is about what is not
//     on the pile yet.
//   - words only. `solid` is a *word* state (wordState.js) and a grammar
//     drill is not a word, so counting drills into a figure labelled "words"
//     would be precisely the drift this card exists to avoid. Grammar items
//     in the top box still turn up in the session; they are just not what
//     this sentence is about.

import { addDaysISO, todayISO } from "../../shared/storage.js";
import { MODULE_STATS } from "../../shared/stats.js";
import { wordState } from "../../shared/wordState.js";

export const WEEK_DAYS = 7;

// The vocabulary deck's units, through the same registry the dashboard
// counts with — so this can't drift from what a word key is elsewhere.
const VOCAB = MODULE_STATS.find((mod) => mod.id === "vocab");

function vocabKeys() {
  return VOCAB.levels.flatMap((level) => VOCAB.units(level).map((unit) => unit.key));
}

export function solidThisWeek(progress, today = todayISO(), days = WEEK_DAYS) {
  const horizon = addDaysISO(today, days);

  return vocabKeys().filter((key) => {
    const due = progress.schedule[key]?.due;
    // ISO dates sort as strings, the same comparison srs.js makes.
    return wordState(progress, key) === "solid" && due > today && due <= horizon;
  }).length;
}
