# Active Course Ingestion Design

## Goal

Let the teaching skill turn a user-selected local course directory, cloned repository, public GitHub repository, or static public course website into a bounded, versioned course snapshot that can feed the existing course-mode teaching loop.

## Design

Course ingestion is a deterministic acquisition and normalization boundary. It produces a manifest and normalized documents; it does not teach, execute repository code, crawl arbitrary hosts, or treat imported text as instructions.

The first release is incremental:

1. Local directories and existing clones.
2. Public GitHub repositories pinned to a commit.
3. Static same-origin public websites with robots, SSRF, and resource-budget controls.
4. Refresh/diff support for new course revisions.

The existing `teach` skill remains responsible for probing the learner, choosing a sequence, building the dependency graph, teaching, retrieval practice, project work, and study artifacts. Imported source order is evidence, not an instruction. Inferred prerequisite edges are labeled as inferred.

## Snapshot boundary

Each snapshot records source kind, canonical locator, revision metadata, retrieval time, parser version, per-document hashes, license evidence, warnings, resource counters, and normalized documents. Durable learner logs store citations, hashes, and short excerpts by default, not an entire imported course.

Imported content is explicitly untrusted course material. It may be summarized or quoted, but it cannot select tools, paths, URLs, credentials, shell commands, or output destinations.

## Safety rules

- Local reads stay inside the selected root; escaping symlinks and obvious secrets are excluded by default.
- Repository code is never executed during ingestion.
- Public GitHub imports use canonical HTTPS URLs, bounded acquisition, commit pinning, API backoff, and truncation warnings.
- Website imports begin with `robots.txt`, stay same-origin, validate every redirect, reject unsafe network destinations, and use strict page/byte/depth/time budgets.
- Unknown, missing, or mixed licenses remain visible and block redistribution/export by default.
- Malformed or partial input yields warnings and partial results, never a fabricated complete course.

## Testing contract

Every implementation phase must have unit, integration, and end-to-end coverage. A phase is eligible for its own PR only after all three suites pass on the branch and again on the merged result.
