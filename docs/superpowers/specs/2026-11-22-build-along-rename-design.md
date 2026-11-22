# Build-Along Skill Rename and Patch Release

## Goal

Make `build-along` the canonical name for the learner-authored build-coaching
skill without breaking users who already invoke `build`.

## Design

- Move the maintained standalone skill source to `skills/build-along/`.
- Keep `build` as a compatibility installation that contains the same skill
  content and identifies `build-along` as the preferred name.
- Update the CLI, generated Cursor rule, README, tests, and eval examples to
  use `build-along` as the primary name.
- Keep the legacy build-mode guidance inside `teach`; this rename affects only
  the standalone skill.
- Bump the package from `0.6.0` to `0.6.1`.
- Run deterministic tests locally and through the existing pull-request
  workflow, merge the PR, create and push `v0.6.1`, and publish the package.

## Compatibility behavior

Existing installations and prompts using `build` continue to work. New
installations receive `build-along` and the compatibility alias. The installer
prints a short deprecation notice for `build` rather than silently presenting
both names as equivalent primary choices.

## Verification

- Unit policy checks validate both canonical and compatibility skill content.
- End-to-end installer checks validate all supported harnesses and Cursor
  rules.
- `npm pack --dry-run --json` confirms both skill paths are included.
- GitHub Actions validates Node 18, 20, and 22 before release.
- npm metadata and tarball contents are checked after publication.
