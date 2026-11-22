# Build-Along Skill Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the standalone build coaching skill to `build-along`, preserve `build` as a compatibility alias, and ship patch `0.6.1` through GitHub and npm.

**Architecture:** Keep the canonical skill content in `skills/build-along/SKILL.md` and `skills/build-along/references/ladder.md`. Preserve `skills/build/SKILL.md` as a thin compatibility skill that names `build-along` and warns against using the old name for new prompts. The installer installs both names, with `build-along` first.

**Tech Stack:** Node.js 18+, Bash, npm, GitHub Actions, GitHub CLI, OpenCode CLI.

## Global Constraints

- Canonical standalone skill name: `build-along`
- Legacy alias: `build`
- Package release: patch `0.6.1`
- Git tag: annotated `v0.6.1`
- npm publish: public access on `registry.npmjs.org`
- Do not publish unless all deterministic tests and hosted PR checks pass
- Preserve existing untracked directories

---

### Task 1: Add failing rename policy tests

**Files:**
- Modify: `test/unit-learning-policy.sh`
- Modify: `test/e2e-install-flow.sh`
- Modify: `evals/evals.json`

- [ ] **Step 1:** Update the policy test variables and assertions:

```bash
buildskill="$repo/skills/build-along/SKILL.md"
legacybuild="$repo/skills/build/SKILL.md"
ladder="$repo/skills/build-along/references/ladder.md"
```

```bash
echo "== standalone build-along skill =="
contains "$buildskill" "name: build-along"
contains "$buildskill" "The ban"
contains "$buildskill" "Attempt first"
contains "$buildskill" "references/ladder.md"
contains "$legacybuild" "name: build"
contains "$legacybuild" "build-along"
contains "$ladder" "S0: loop that carries its own messages"
contains "$ladder" "S11: evaluation, safety, and operations"
```

- [ ] **Step 2:** Update end-to-end installer checks to look for both names:

```bash
test -f "$target/.cursor/rules/build-along.mdc"
test -f "$target/.cursor/rules/build.mdc"

build_along_skill="$target/.agents/skills/build-along/SKILL.md"
legacy_build_skill="$target/.agents/skills/build/SKILL.md"
...
test -f "$build_along_skill"
test -f "$legacy_build_skill"
test -f "$(dirname "$build_along_skill")/references/ladder.md"
```

- [ ] **Step 3:** Rename eval references from `build` to `build-along` for standalone runner use. Keep eval scenario IDs stable.

- [ ] **Step 4:** Run the policy and end-to-end tests:

```bash
bash test/unit-learning-policy.sh
bash test/e2e-install-flow.sh
```

Expected: FAIL because the canonical `build-along` files and installer paths do not exist yet.

### Task 2: Create canonical skill and compatibility alias

**Files:**
- Create: `skills/build-along/SKILL.md`
- Create: `skills/build-along/references/ladder.md`
- Modify: `skills/build/SKILL.md`
- Keep: `skills/build/references/ladder.md`

- [ ] **Step 1:** Move the existing build skill content to `skills/build-along/SKILL.md` and its ladder to `skills/build-along/references/ladder.md`.
- [ ] **Step 2:** Change the canonical frontmatter name to `build-along` and description to describe the preferred name.
- [ ] **Step 3:** Replace `skills/build/SKILL.md` with a compatibility alias whose frontmatter name is `build`, description deprecates it, and body redirects users and agents to `build-along`.
- [ ] **Step 4:** Retain `skills/build/references/ladder.md` for compatibility package contents.
- [ ] **Step 5:** Rerun policy tests:

```bash
bash test/unit-learning-policy.sh
bash test/e2e-install-flow.sh
```

Expected: PASS.

### Task 3: Update installer and documentation

**Files:**
- Modify: `bin/cli.js`
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1:** Update `installSkills` to install canonical `build-along` then legacy `build`.
- [ ] **Step 2:** Update Cursor generation to generate `build-along.mdc` and `build.mdc`.
- [ ] **Step 3:** Update README examples and the skill table to lead with `build-along`, mark `build` deprecated, and explain the compatibility alias.
- [ ] **Step 4:** Bump `package.json` version to `0.6.1`.
- [ ] **Step 5:** Run the local suite:

```bash
npm test
npm pack --dry-run --json
```

Expected: all tests pass and package contents include both canonical and compatibility skill files.

### Task 4: Run model evals

**Files:**
- No implementation files.

- [ ] **Step 1:** Check OpenCode availability:

```bash
opencode --version
```

- [ ] **Step 2:** Run the existing eval suite against the teach skill:

```bash
npm run test:eval
```

- [ ] **Step 3:** If the provider is configured, run the build skill contract directly:

```bash
node evals/run.mjs --skill-dir skills/build-along --skill-name build-along --only build-mode-ban
```

Expected: existing suite or provider limitation is reported explicitly. No provider-dependent failure is treated as a code failure unless the skill contract check reproduces deterministically.

### Task 5: Commit and open PR pipeline

**Files:**
- All implementation changes.

- [ ] **Step 1:** Review the diff and commit it:

```bash
git diff --stat
git diff --stat --cached
git add bin/cli.js README.md package.json skills test evals docs/superpowers/plans/2026-11-22-build-along-implementation.md
git diff --cached --stat
git diff --cached
git commit -m "feat: rename build skill to build-along"
git push -u origin HEAD
```

- [ ] **Step 2:** Create a pull request:

```bash
gh pr create --base main --head "$(git branch --show-current)" --title "feat: add build-along and deprecate build alias" --body "Adds build-along as the canonical standalone skill, retains build as a compatibility alias, and bumps the package to 0.6.1."
```

- [ ] **Step 3:** Record the PR URL and monitor only through PR CI and review status.

### Task 6: Merge only after hosted checks pass

- [ ] **Step 1:** Verify all required checks for the PR:

```bash
gh pr checks
```

Expected: Node 18, Node 20, and Node 22 matrix checks pass.

- [ ] **Step 2:** Merge the PR:

```bash
gh pr merge --squash --delete-branch
git switch main
git pull --ff-only
```

### Task 7: Tag and publish GitHub release

- [ ] **Step 1:** Verify the merged main commit and package version:

```bash
git status --short --branch
node -p "require('./package.json').version"
```

Expected: clean tracked tree on `main`, version `0.6.1`.

- [ ] **Step 2:** Create and push the annotated tag:

```bash
git tag -a v0.6.1 -m "v0.6.1"
git push origin v0.6.1
```

- [ ] **Step 3:** Wait for the tag workflow, then verify the release and workflow:

```bash
gh run list --limit 10
gh release view v0.6.1
```

### Task 8: Publish npm

- [ ] **Step 1:** Run the authenticated npm check:

```bash
npm whoami
npm pack --dry-run --json
npm publish --access public
```

- [ ] **Step 2:** If npm authentication is unavailable, stop before publication and give the exact commands:

```bash
npm login
npm publish --access public
```

- [ ] **Step 3:** Verify npm metadata and package tarball:

```bash
npm view teacher-sab version dist-tags
npm view teacher-sab dist-tags.latest
npm pack teacher-sab@0.6.1 --dry-run --json
```

Expected: latest is `0.6.1` and the tarball contains:

- `skills/build-along/SKILL.md`
- `skills/build-along/references/ladder.md`
- `skills/build/SKILL.md`
- `skills/build/references/ladder.md`
