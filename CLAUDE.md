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
| `scout` | opus | Implementation. One well-scoped change, on a branch, with its tests. |
| `reviewer` | opus | Adversarial review of a branch or PR. Read-only. |
| `lexicographer` | sonnet | `src/data/fondamentale.js` entries — EN + PL glosses. Language accuracy. |
| `scanner` | haiku | Read-only recon. "Where is X", "does Y exist", pattern sweeps. |
| `verifier` | haiku | `npm test`, the coverage gate, the build. Returns a verdict, not a log. |
| `evidence` | haiku | Before/after screenshots at 375x812, console errors, wiki URLs. |

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

### Routing

- **Cheapest agent that can do the job correctly.** Judgement, architecture,
  correctness arguments and Italian/Polish content go to opus or sonnet.
  Searching, running, capturing and reporting go to haiku.
- **Push verbose work down.** Anything that produces hundreds of lines you
  only need the conclusion from belongs in a subagent's context, not this one.
- **Parallel only when independent.** Two agents reading different things at
  once is good. Chaining a task that needs the previous one's answer through
  parallel workers is worse than doing it in sequence.
- **One level of delegation.** Workers other than `scout` have no `Agent`
  tool and cannot spawn further agents.

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
