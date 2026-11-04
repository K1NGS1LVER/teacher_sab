# Teaching examples

Worked examples the teacher can pattern-match against. Each shows correct application of a skill rule. Use these to calibrate format, not to copy content wholesale.

## Example 1 — Quiz construction (bare claims, parallel, no asymmetry)

Bad (correct answer gives itself away):

```
Quiz 2: What does the trailing 6 in 28x28x6 represent?

1. The number of filters in the convolution, because each filter produces one output channel
2. The number of pixels along the output width
3. The kernel size
4. The batch size
```

Why it fails: option 1 carries its own reasoning ("because..."), is longer, and is more specific — a giveaway. No asymmetry of bolding either.

Good:

```
Quiz 2: In the output shape 28x28x6, what does the trailing 6 represent?

1. The number of filters in the convolution
2. The number of pixels along the output width
3. The kernel size used by the convolution
4. The number of training examples in the batch
```

All options are bare claims, same grain, same register, no reasoning, no bolding. The explanation ("the number of output channels, one per filter") appears only after the learner answers.

## Example 2 — Node loop with worked-example fading (CI configuration)

Topic: "Add a CI pipeline that runs tests on push." Intensity: working.

Node A (foundational truth): "ALL automated checks in CI are triggered by an event." Quiz-check after stating.

Node B (derived): worked example first — a complete `.github/workflows/ci.yml` that runs `npm test` on `push`, with each line commented to show what it does and why.

Then fade: give a partial file where the `jobs.test.steps` block has blanks (e.g., the `run:` command and the `on:` trigger) and ask the learner to fill them. Only after they complete it correctly do they write a full pipeline from scratch for a new task (e.g., also lint on `pull_request`).

Quiz-check for Node B: "Which event should trigger the pipeline so tests run on every push?" — new surface, not repeating the example's wording.

## Example 3 — Concreteness fading & transfer (DevOps: CI vs CD)

Principle: "CI automates building and testing; CD automates releasing." Three cases differing in surface, same structure:

1. A web app: push → build Docker image → run unit tests → (CI) … then deploy to staging (CD).
2. A CLI tool: push → compile binary → run test suite → (CI) … then publish to a package registry (CD).
3. A library: push → run linter + tests → (CI) … then tag a release (CD).

Learner compares cases and states the shared structure: "CI = build + test on every change; CD = release that change automatically."

Negative case: "A cron job that rebuilds the Docker image every Sunday" — looks like automation but is not CI/CD because it isn't triggered by a change event. Ask why the principle doesn't fit.

Forward-reaching: "Where else could you use build-then-test automation?" Learner: "data pipelines, ML model training." Backward-reaching: "This staging deploy is like what earlier case?" Learner: "the web-app case." Far-transfer item after a delay: "You're asked to automate training a nightly ML model. Which parts map to CI and which to CD, and why?"

## Example 4 — Confidence grading with delayed judgment

Learner misses Quiz 3 and picks option 2 confidently.

Bad (immediate, cuts off metacognition):

```
Wrong. The answer is 3. The trailing 6 is the number of filters.
```

Good:

```
How sure were you about option 2? (1 = guess, 2 = fairly sure, 3 = certain)
What made option 2 seem right?
```

Learner: "3 — I thought 6 meant six images." Teacher: "That's a misconception: 6 is channels/filters, not image count. The correct answer is 3."

Wrong-and-confident → misconception to dislodge (revisit soon). Wrong-and-unsure → plain gap.

## Example 5 — Intensity scaling (DevOps domain)

Overview (5 nodes, shallow): what is DevOps, CI/CD pipeline at a glance, version control, containers, one quiz per node. One session.

Working (10 nodes, standard): add CI config example, container registry, basic deployment, environment variables, worked example fading for CI config, one quiz + free recall per node. 2–3 sessions.

Comprehensive (20+ nodes, deep): add gotchas (flaky tests, secret management, rollback strategies, caching, matrix builds, multi-arch images, cost), multiple checks per node, free recall on key nodes, far-transfer item after a delay. Split across 4+ sessions; never compress into one.

## Example 6 — Self-explanation prompt

After establishing Node B (CI triggers on push):

"Explain in your own words: why does the pipeline run on `push` rather than on a timer? How does that follow from the truth that CI checks are change-triggered?"

Grade against the correct relationship: push = change event; CI = build+test on change. Missing or wrong → re-teach the edge.

## Example 7 — Course decomposition (DevOps course)

Course slug: `devops`. Hub `study-artifacts/devops.md`, sessions in `study-artifacts/devops/`.

01-foundations.md: what DevOps is, CI vs CD, version control.
02-ci-pipeline.md: CI config worked example, fading to independent config.
03-testing-in-ci.md: test types, flaky tests, caching.
04-containers.md: images, registries.
05-deployment.md: staging vs prod, rollback.

Course graph DAG: foundations → ci-pipeline → testing-in-ci → containers → deployment. Teaching order = topological order. Intensity = comprehensive → each subtopic deep enough for its own session; split across 5+ sessions.
