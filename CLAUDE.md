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
- For UI changes, verify in the browser preview (`npm run dev`, port
  5173) — this is a PWA; visual and interaction bugs won't show up in
  unit tests alone.

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

### Dispatch is approved, not assumed

`.claude/settings.json` puts an `ask` rule on the `Agent` tool, so every
dispatch prompts the owner. Before that prompt, state the **job card** in one
short block so the answer is informed:

```
Agent:  verifier
Job:    is the L'Officina branch green?
Scope:  npm test + coverage on claude/officina-riserva
Done:   a pass/fail verdict with failing assertions
```

One card per agent. Don't bundle three dispatches into one paragraph and
don't dispatch to "get started" while the plan is still being discussed.

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
