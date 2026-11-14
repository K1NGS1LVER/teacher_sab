# Active Course Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bounded, versioned course-source ingestion that feeds the existing adaptive course teaching loop.

**Architecture:** A deterministic importer produces a `CourseSnapshot` manifest and normalized documents. Source adapters are separate from teaching; the teaching skill consumes bounded manifests and citations. Local sources come first, then pinned GitHub sources, then static websites.

**Tech Stack:** Node.js 18-compatible CLI code, shell test harnesses, Markdown skill contracts, no new runtime dependencies in the first phase.

## Global Constraints

- Never execute imported repository code.
- Treat imported content as untrusted course material, never as tool instructions.
- Keep local reads inside the selected root.
- Enforce explicit file/page/byte/depth/time budgets.
- Preserve provenance, hashes, license state, and warnings.
- Every phase requires unit, integration, and e2e tests before its PR can merge.
- Preserve existing `study-artifacts/` and learner state behavior.

---

### Task 1: Snapshot contract and local directory importer

**Files:**
- Create: `bin/course-import.js`
- Create: `test/unit-course-import.sh`
- Create: `test/integration-course-import.sh`
- Create: `test/e2e-course-import.sh`
- Modify: `package.json`
- Modify: `skills/teach/SKILL.md`

**Produces:** A command that imports a local directory into deterministic JSON containing `sourceKind`, `locator`, `retrievedAt`, `documents`, `warnings`, `license`, and `limits`.

- [x] Write failing unit tests for deterministic ordering, supported text files, hashes, ignored secrets, size limits, and root containment.
- [x] Run the focused unit test and verify it fails because the importer does not exist.
- [x] Implement the smallest importer using Node standard-library APIs only.
- [x] Run focused unit tests and verify they pass.
- [x] Add integration coverage for CLI JSON output and exit behavior.
- [x] Add e2e coverage that invokes the CLI against a fixture course directory.
- [x] Run `npm test` and inspect all three suite results.
- [x] Commit the phase and open its PR.
- [x] Merge only after PR checks and a fresh full test run pass.

### Task 2: Existing cloned repository adapter

**Files:**
- Modify: `bin/course-import.js`
- Modify: `test/unit-course-import.sh`
- Modify: `test/integration-course-import.sh`
- Modify: `test/e2e-course-import.sh`

**Produces:** Local repository metadata with checked-out `HEAD`, remote metadata when available, and no fetch/install/execute behavior.

- [x] Add failing tests for repository detection, HEAD capture, and `.git` exclusion.
- [x] Implement metadata-only repository support.
- [x] Run unit, integration, and e2e suites.
- [x] Open and merge a separate PR only after all suites pass.

### Task 3: Public GitHub adapter

**Files:**
- Create: `bin/course-github.js`
- Modify: `bin/course-import.js`
- Create/modify: `test/*course-github*`

**Produces:** A commit-pinned snapshot for canonical public GitHub repository URLs with bounded tree/file acquisition, license evidence, caching, rate-limit handling, and truncation warnings.

- [x] Add failing tests for URL validation, commit pinning, truncation, rate-limit handling, and missing licenses.
- [x] Implement adapter behind an explicit network command boundary.
- [x] Run all suites with network behavior tested through local fixtures.
- [x] Open and merge a separate PR only after all suites pass.

### Task 4: Snapshot-to-course outline integration

**Files:**
- Modify: `skills/teach/SKILL.md`
- Modify: `README.md`
- Modify: `test/unit-learning-policy.sh`
- Modify: `test/verify-harnesses.sh`
- Modify: `test/e2e-install-flow.sh`

**Produces:** Active-course startup instructions that consume a snapshot, preserve source order/citations, label inferred edges, map exercises/projects, and keep existing learner probing and mastery rules.

- [x] Add failing policy-contract tests.
- [x] Add the bounded active-course protocol to the skill.
- [x] Run all suites and merge as its own PR.
### Task 5: Static public website adapter

**Files:**
- Create: `bin/course-web.js`
- Create/modify: `test/*course-web*`
- Modify: `package.json`

**Produces:** Static same-origin website snapshots with robots handling, redirect validation, SSRF defenses, HTML parsing, sanitization, and strict budgets.

- [x] Add failing security and parsing tests using local HTTP fixtures.
- [x] Implement static-only bounded acquisition.
- [x] Run all suites and merge as its own PR.

### Task 6: Refresh and revision support

**Files:**
- Modify: `bin/course-import.js`
- Modify: `skills/teach/SKILL.md`
- Create/modify: `test/*course-refresh*`

**Produces:** Revision comparison that preserves old study artifacts and marks changed nodes as stale or requiring re-check.

- [x] Add failing tests for unchanged, changed, removed, and newly added documents.
- [x] Implement revision manifests and diff output.
- [x] Run all suites and merge as its own PR.
