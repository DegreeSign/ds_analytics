# AGENTS.md

## Build & dist rules

- **Never build the package** (`webpack` / `tsc` emit). The `dist/` directory is a committed
  build artifact; do not regenerate or modify it.
- If you ever build for **testing** purposes, you **must** revert every change made under
  `dist/` afterwards (e.g. `git checkout dist`) before finishing.
- Never stage, commit, or report `dist/` changes as part of a change.

## Code organization rules

- **Types live in `src/types/`, logic lives in `src/code/`.** Never define a type /
  interface in a `code/` file; move it to the matching `src/types/` file and import it.
- **Use readable English identifiers.** No cryptic abbreviations (e.g. `Accum` ->
  `Accumulator`). A name must be understandable without reading its definition.
- **Do not duplicate code.** Code required in more than one place must be isolated as a
  helper function in the same location and reused, to keep the diff minimal.
- **Keep `ChangeLog.md` updated** with external / public API changes only (new exports,
  changed types, breaking changes). Ignore internal refactors and renames. The changelog
  is a serious document: one sentence per change, absolute need-to-know only. Never spell
  out version bumps. Never mention a type or symbol that is not publicly exported.

## Minimal diff rules

- **Keep the diff absolutely minimal.** Only touch what the task requires: do not
  reformat unrelated code, do not reorder or rename symbols that were not asked for,
  do not move code beyond what was requested.