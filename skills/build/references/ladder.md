# Build ladder reference

The deprecated `build` compatibility skill points to `build-along`, which owns the learner-authored project ladder. Load `../../build-along/references/ladder.md` when the learner asks for a stage plan or is building an agent or service.

## Default ladder: agent orchestration

- **S0:** loop that carries its own messages
- **S1:** tools and the natural stop condition
- **S2:** loop control and logging
- **S3:** sandbox decision: inside or outside
- **S4:** one data flow behind a chat box
- **S5:** managed persistence
- **S6:** modularize with a swap test
- **S7:** a second parallel data flow
- **S8:** concurrent sandboxes with a queue and compose
- **S9:** optional multi-agent collaboration
- **S10:** cloud native
- **S11:** evaluation, safety, and operations

Each stage adds exactly one capability, ends runnable and demonstrated, and carries one or two unconditional truths, one motivating problem, a break exercise, and an inspection checklist. Build the first end-to-end data flow early; concurrency, queues, and scale come after one flow works and is modular.

### S0: loop that carries its own messages

- Truths: the model sees only what each request contains; within one run, memory is the list the loop resends; each request is independent.
- Break: missing key, wrong model name, empty input, very long run.
- Inspect: key handling, API errors, timeouts, clean exit, output cap, and exactly what the model saw.

### S1: tools and the natural stop condition

- Truths: the model emits requests; the program decides whether and how to execute them; no tool requests means finished.
- Break: unknown tool, malformed arguments, tool error, model that never stops.
- Inspect: validation, allowlist, result cap, error-as-data, sandbox execution, and predicted call count.

### S2: loop control and logging

- Truths: every loop has a hard stop; failures are classified; unreconstructable runs cannot be debugged.
- Break: infinite tool loop, rate limit, timeout, garbage tool result.
- Inspect: iteration and cost limits, wall-clock timeout, repeated-action detection, retry policy, run id, and one structured log entry per step.

### S3: sandbox decision

The learner must argue whether the loop runs inside the sandbox or outside it and sends tool calls in. Ask about secrets, isolation, lifecycle, and swappability. Do not prescribe the answer.

- Truths: model-selected commands are untrusted; the side calling the model holds secrets; disposable sandboxes must export durable outputs before destruction.
- Break: secret access, hanging command, disk exhaustion, kill during a task.
- Inspect: network and filesystem reach, per-task lifecycle, output extraction, and proof the key is not inside.

### S4: one data flow behind a chat box

Before building, the learner writes the flow as numbered prose: entry, sandbox, loop, output collection, destruction, response.

- Truths: one functionality is one path through controller, logic, and data; the controller only defines endpoints.
- Break: loop failure, sandbox start failure, huge response, client disconnect.
- Inspect: no logic in the controller, no skipped layer, and a traceable flow.

### S5: managed persistence

Apply buy-versus-build before choosing storage. The learner integrates it.

- Break: unavailable storage, bad credentials, upload failure after sandbox destruction.
- Inspect: store-before-destroy ordering, loss handling, and defended trade-offs.

### S6: modularize

The learner draws controller, logic, harness, sandbox, and data modules before building.

- Swap test: replacing the sandbox or harness must change one module, not the whole system.
- Inspect: thin interfaces, private internals, no circular dependencies, and no cross-module reach.

### S7: second parallel data flow

Add a feature as a separate flow beside the first, not as flags and edits inside it.

- Break: shared state, conflicting writes, halfway failure.
- Inspect: distinct flows and the old flow remaining unchanged.

### S8: concurrent sandboxes

Add HTTP submission, task IDs, workers, queueing, and a single stack definition only when the learner can name the failure that forces each.

- Truths: long work leaves the request path; at-least-once delivery requires duplicate-safe runs; service names are not localhost; started is not ready; durable state is external.
- Break: crash, orphan, resource exhaustion, starvation, duplicate task, datastore outage, wrong order, removed volume.
- Inspect: cleanup, limits, concurrency cap, per-run results, idempotency, readiness, restart behavior, named state, and health check.

### S9: optional multi-agent collaboration

Require the learner to justify a second agent. Compare pipeline, router, fan-out/fan-in, supervisor, and evaluator patterns.

- Truths: an agent is a loop with a prompt and tool set; hand-offs are validated data contracts.
- Break: garbage hand-off, infinite delegation, budget exhaustion, shared-state race.
- Inspect: schemas, budgets, context size, trace id, and cost.

### S10: cloud native

Discuss reconciliation, ephemeral workloads, separate config and secrets, resource limits, probes, graceful shutdown, least privilege, restricted egress, and queue-based scaling. Verify platform specifics against current documentation.

### S11: evaluation, safety, and operations

Measure correctness, safety, and cost.

- Break: prompt injection through tool output, expensive loops, degraded model quality.
- Inspect: traces, latency, errors, steps, tokens, cost, fixed evaluation tasks, tool-boundary defenses, approvals, and budgets.

## Expansion packs

After the core gate, optional independent flows or modules may add persistent history, accounts, memory, context engineering, source control, a different sandbox, or an existing agent SDK.

## Journal fields

Record the core flow, cut list, module map, prediction, result, gap, blocker and root cause, break diagnosis, swap test, explain-back, misses, and rebuild notes for each stage.
