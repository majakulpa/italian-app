# Episode measurement reports

One JSON file per shipped episode, named `<episode id>.json`. Each is written by
`node scripts/measure-serial.mjs`, which runs the offline Python checker in
`research/gen-experiment/` over the episode's text and records what it found.

These files are committed on purpose. They are the measurement the release gate
in `src/data/serial.test.js` holds the shipped prose to — the `textSha256` field
binds a report to the exact bytes it measured, so an edited paragraph fails the
suite instead of quietly invalidating a number nobody re-checked.

Do not hand-edit one. Re-run the pipeline. The format is documented in
`research/gen-experiment/README.md` under "Release gate for the serial".

Empty but for this file: `EPISODES` in `src/data/serial.js` is empty, because the
gate ships before the content.
