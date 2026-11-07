# CLAUDE.md

Guidance for Claude Code working in this repo. Read README.md first — it has
the project structure, what's built, and the roadmap.

## Workflow

- For a new module or any multi-step feature, use Plan mode first — this
  repo is small enough that a quick plan avoids rework and lets you review
  the approach before code gets written.
- Follow the existing module pattern exactly (see README "To add a
  module"): `src/modules/<name>/<Name>Module.jsx` exporting a component
  that accepts an `onExit` prop, data in `src/data/` if needed, registered
  in the `MODULES` array in `src/App.jsx` with `ready: true`.
- Pull colors/fonts/level accents from `src/shared/theme.js` — don't
  hardcode styles that duplicate what's already there.
- Reuse `src/shared/storage.js` for any new persisted state (progress,
  streaks) instead of touching `localStorage` directly.

## Testing

- Co-locate tests next to the code (`Thing.test.jsx` beside `Thing.jsx`),
  matching the existing files.
- Run `npm test` before considering any change done. Don't report a task
  finished on UI/logic changes without the suite passing.
- For UI changes, verify in the browser preview (`npm run dev`) — this is a
  PWA, and visual bugs do not show up in unit tests. Not a formality: jsdom
  computes no cascade for inherited colour, so an element that sets no `color`
  passes every arithmetic contrast check and axe pass while being invisible in
  one theme. That has already shipped once. Measure the rendered page, in both
  themes, and say what you measured.
- That browser pass now has a suite behind it: `npm run e2e` (Playwright, in
  `e2e/`, Chromium at 375x812 in both palettes) walks every screen and runs
  axe's WCAG 2.1 AA rule set against the *painted* page, which is the one
  place `color-contrast` returns a real ratio instead of "incomplete". It is
  additive — it does not replace reading the screen, and it does not replace
  `npm test`. See the README's browser-tests section.

## Git

- Commit at logical checkpoints, roughly one module/feature per commit,
  matching the existing history style.
- Pushing a feature branch and opening a PR is part of finishing a piece
  of work — do it without asking. A change nobody can review isn't done.
- Never merge a PR, force-push a shared branch, or push straight to
  `main` without explicit approval. The PR is the review gate; don't
  step around it.

## Orchestration

The main session is the **orchestrator**. It runs on the strongest model,
holds the plan, and does the thinking that needs the whole picture: what to
build next, whether a design is right, whether a finding is real. It should
not spend its context on work a cheaper agent can do — bulk searching, test
runs, screenshotting, data entry.

`.claude/agents/` holds the roster:

| Agent | Model | Give it |
|---|---|---|
| `scout` | opus | Implementation that is also a design decision. One scoped change, on a branch, with its tests. |
| `reviewer` | opus | Adversarial review of a branch or PR. Read-only. |
| `mechanic` | sonnet | Implementation where the answer is already decided. Wiring, a named coverage gap, renames, data-shape edits, docs. |
| `lexicographer` | sonnet | `src/data/fondamentale.js` entries — EN + PL glosses. Language accuracy. |
| `scanner` | haiku | Read-only recon. "Where is X", "does Y exist", pattern sweeps. |
| `verifier` | haiku | `npm test`, the coverage gate, the build. Returns a verdict, not a log. |
| `evidence` | haiku | Before/after screenshots at 375x812, console errors, wiki URLs. |

The rows are in descending cost order, and that order is the default reading
direction: start at the bottom and only climb when the job genuinely needs it.

### Dispatch freely, and say what you dispatched

Dispatch is not gated. Don't ask permission for it, don't narrate a job card
before each one, and don't pause the work waiting to be told to proceed. The
orchestrator decides who does what; that is the job.

What the owner needs is not approval-in-advance but a legible account
afterwards — one line per agent saying what it was asked and what came back.
Two rules survive from when this was gated: don't bundle three unrelated
dispatches into one worker, and don't dispatch to "get started" while the
plan is still being argued.

The gate that used to live here was an `ask` rule on the `Agent` tool in
`.claude/settings.json`. It was removed because it fired on every dispatch,
including the read-only recon ones, and a prompt that always gets the same
answer is a prompt that stops being read.

### Routing — cheapest agent that can do the job correctly

Both halves of that sentence are load bearing. "Cheapest" is not a licence to
send design work to haiku, and "correctly" is not a licence to send every job
to opus because opus is never wrong. The rule is to name what the job actually
requires, then pick the lowest tier that supplies it.

Ask one question: **has the right answer already been decided, or is deciding
it the work?**

- Deciding it is the work → `scout` (build) or `reviewer` (judge). Visual and
  interaction design, architecture, a correctness argument, whether a finding
  is real, what to build next.
- Already decided, only the typing remains → `mechanic`. Wiring a component
  that exists into a place that exists, closing a coverage gap at named lines,
  a rename, a data-shape migration, docs.
- Italian or Polish content, or whether a gloss/article/translation is right →
  `lexicographer`. Never cheaper: a wrong gloss ships a language error to a
  learner and no test catches it.
- Finding, running, capturing, reporting → `scanner`, `verifier`, `evidence`.
  These are the three jobs where the output is long and the answer is short,
  which is exactly what a cheap agent is for.

**Escalate on evidence, not on nerves.** Give the job to the lower tier first
and let it hand back. `mechanic` is instructed to stop and report when a brief
turns out to need a design decision, and that handoff costs one short message
— far less than opus doing the whole thing on the chance that it might. The
same applies upward: if `mechanic` hands back twice on the same change, the
change was never mechanical, so promote it to `scout` and say why.

**Spend on the gate, not on the work.** Where quality is actually protected
here is the coverage gate, the axe sweep, the browser suite and `reviewer` —
and those are cheap to run relative to re-doing a shipped mistake. So: never
skip the review of a change that touches behaviour in order to save a
dispatch, and never pay opus to write something a gate would have caught
anyway.

### Dispatching is not free either

A subagent starts cold. It re-reads `CLAUDE.md`, `README.md` and the files it
needs before it does anything useful, which is a fixed cost per dispatch that
has nothing to do with the size of the question. That changes the arithmetic:

- **Don't dispatch what you can answer in one call.** One `grep`, one file
  read, one `git log` — do it inline. A `scanner` dispatch to find out which
  file exports a function costs more than the `grep` and arrives later. Reach
  for `scanner` when the sweep is wide or the output is long, not when it is
  one command.
- **Batch recon into one brief.** Eight related questions about the same
  feature go to one `scanner`, not eight. Eight *unrelated* questions still
  don't go to one worker — that is the rule that survived from the old gate —
  but "everything needed to build X" is one job, not eight.
- **Continue an agent instead of spawning another.** An agent that has already
  read the tree can answer a follow-up with its context intact; a fresh
  dispatch pays the cold start again. Use `SendMessage` to the one that is
  already warm.
- **Don't re-derive what is already in this context.** If the orchestrator has
  just read a file, handing that work to a subagent so it can read the same
  file again is pure loss.
- **Parallel only when independent.** Two agents reading different things at
  once is good. Chaining a task that needs the previous one's answer through
  parallel workers is worse than doing it in sequence, and usually means
  paying twice for the second one.
- **One level of delegation.** Workers other than `scout` have no `Agent`
  tool and cannot spawn further agents.

### One review round by default

`reviewer` is opus and it is worth it, but the loop is where the cost hides.
Default to **one** round: review, Scout answers every finding, orchestrator
adjudicates, ship. A second round is for when the first found something
load-bearing that the fix might plausibly have got wrong — not as a routine
confirmation that the fixes landed. That last part is a `verifier` job, and
`verifier` is haiku.

Changes that need no `reviewer` at all: a data-only addition already held by a
committed measurement and its gate, a docs-only change, a comment fix. Say
when you are skipping it and why, so the choice is visible rather than silent.

### Integrating what comes back

A worker's report is evidence, not truth. Verifier saying green means the
command it ran printed green — if the change was load-bearing, check the
assertion actually exercises it. Reviewer findings are arguments Scout may
rebut, and Scout's rebuttals are arguments too; the orchestrator decides, and
says which findings it is overruling and why.

Never relay a worker's claim to the owner as if it were checked. Say who ran
what.

### Read the tree you are standing in

Agent worktrees live under `.claude/worktrees/`, which means the repo root
holds several complete copies of `src/` at once, some of them weeks old. A
filename glob or a `find` from the root reaches into all of them and returns
files that look right and are not. Nothing about the result says which
checkout it came from.

This is not hypothetical. A scanner reported that `modules/review/question.js`
and `shared/locatedFeedback.js` "do not exist anywhere in the repo" on a day
when both were on `main`; it had read a copy predating the two PRs that
created them, and every line number in its report was internally consistent
and wrong. A verifier reported a green suite with the test count from a
snapshot three PRs old.

So: work from paths relative to your own worktree, never absolute paths
through the repo root, and when a file's contents surprise you, run
`git log --oneline -1` before you believe them. The orchestrator's half of
this is that a worker's report about what does *not* exist is the weakest
claim it can make — verify absence yourself.
