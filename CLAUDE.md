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
- Always ask before `git push`.
