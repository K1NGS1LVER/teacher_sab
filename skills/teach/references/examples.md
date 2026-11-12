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

## Example 8 — Stem novelty (anti-regurgitation, post-correction)

Context: node on Docker Compose, intensity working. The explanation above the quiz just covered what Compose is and the `docker compose up` flow.

Bad (echoes the explanation):

```
Quiz 4: What tool would you use to define and run a multi-container application?
1. Docker Compose
2. Docker Build
3. Docker Hub
4. Docker Registry
```

Good (new surface; checks whether the concept transferred):

```
Quiz 4: A teammate's repo has services `web` and `api` that only talk to each other, started by hand in three terminal tabs — and they keep losing the exact `docker run` flags. Which change fixes both the juggling and the loss of flags?

1. Write the run flags and service links into one `compose.yml` and start with `docker compose up`
2. Save the `docker run` commands in a shell script the team sources before starting
3. Publish both images to a registry so teammates redeploy faster
4. Replace the `api` with a serverless function so only one container is needed
```

Re-teach follow-up: they missed Quiz 4 and you re-taught the concept. The next check is applied, not a reworded copy — e.g. "A hand-written shell script already starts both containers fine. What does the compose.yml still give you that the script does not?" — the learner infers what Compose uniquely provides (single-command orchestration, defined networking, env/config handling); citing the re-taught definition alone earns nothing.

## Example 9 — Adaptive check progression and delayed mastery

Topic: "Why a database index speeds up a lookup." Intensity: working.

Do not force every node through the same question quota. Match the check to the target and move from immediate learning evidence to delayed mastery:

1. **Direct recall:** "What problem does an index solve during a lookup?"
2. **Explanation:** "Why can an index reduce the amount of table data the database must inspect?"
3. **Changed-surface application:** a new table/query scenario where the learner predicts whether an index helps.
4. **Delayed cumulative retrieval:** at the start of a later session, ask the learner to choose between an index, a full scan, and a different optimization for several mixed scenarios.

The node is not marked `delayed-transfer stable` after the first answer. A practical mastery criterion is delayed retrieval, one changed-surface application, and no unresolved misconception. If the learner misses the application, return to a worked example or a completion problem; if they succeed repeatedly, remove the scaffold.

## Example 10 — Working foundations with boundaries

Topic: "HTTP requests are client-initiated." State the usable foundation with scope:

```text
Working foundation: in ordinary HTTP request/response exchange, the client sends a request and the server sends a response.
Applies when: describing ordinary request/response traffic.
Boundary: protocols built on or around HTTP can add server push, streaming, upgrades, or long-lived connections; do not use the simplified statement to deny those cases.
```

The point is not to front-load every exception. It is to avoid teaching a simplified rule as universal when the exception matters to the next node.
