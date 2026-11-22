# Build mode reference

Depth behind the build mode section of `SKILL.md`. The inline section is the contract: the ban, the stage loop, the gate, the design principles, and the inspection order. This file holds the default ladder, the rules for building a different one, expansion packs, the journal template, and one worked exchange.

Load this file when the project is a cloud-native agent system, when the learner asks for a stage plan, or when you need a worked example of the inspect-first reply shape.

## Contents

- Default ladder: cloud-native agent orchestration (S0 to S11)
- Building a ladder for any other project
- Expansion packs
- Journal template
- Worked exchange
- When a course supplies the material

## 1. Default ladder: cloud-native agent orchestration

Use when the learner's goal is to build an agent, orchestrator, or service that calls a model. Each stage names the new capability, the unconditional truths it rests on, the problem that motivates it, break exercises, and the inspection checklist.

Verify provider and platform specifics against current docs before stating them. A confident wrong fact corrupts every stage built on it.

The harness runs outside the sandbox and the sandbox executes its tool calls. That is a design decision, not a decree: S3 makes the learner argue it out.

### S0: loop that carries its own messages

- **Capability:** an LLM call inside a loop. Each iteration appends the model's last response to what the next request sends.
- **Truths:** the model sees only what each request contains. Within one run, "memory" is the list the loop re-sends. Each request is independent.
- **Motivate:** "you send the same question twice. What does the second call know about the first?"
- **Break:** missing key, wrong model name, empty input, a very long run.
- **Inspect:** key read from the environment and never hardcoded. API errors and timeouts handled. A clean exit path. An explicit output length cap. Can the learner say exactly what the model saw on each call?

### S1: tools and the natural stop condition

- **Capability:** the model can request actions, the loop executes them, and the loop exits when a response contains no tool requests.
- **Truths:** the model never executes anything. It emits a structured request and your program decides. A response with no tool requests means the task is finished.
- **Start with two tools:** create a file and read a file. Then one that runs a command.
- **Break:** unknown tool, malformed arguments, a tool that errors, a model that never stops asking.
- **Inspect:** arguments validated, tool allowlist, result size capped, errors returned to the model as data, tools run inside the sandbox, shell access not passed through. Predict the number of model calls for a question needing one tool, then check.

### S2: loop control and logging

- **Capability:** a bounded, debuggable agent loop.
- **Truths:** every loop needs a hard stop. Failures are normal and must be classified as retryable or not. A run you cannot reconstruct is a run you cannot debug.
- **Motivate:** "what stops this if the model never says it is done?"
- **Break:** force an infinite tool loop, simulate rate limiting and timeouts, return garbage from a tool.
- **Inspect:** max iterations, token or cost budget, wall-clock timeout, repeated-action detection, retry with backoff only on transient errors, a run id on every log line, one structured log entry per step.

### S3: the sandbox (decision stage)

- **Capability:** tool calls execute inside a disposable container.
- **Decision the learner must argue before building:** does the loop run (A) inside the container, or (B) outside, sending tool calls in? Require trade-offs on secrets, isolation, lifecycle, and swappability. Do not reveal a preferred answer. If they choose A, ask where the API key lives and what a model-driven command can reach.
- **Truths:** commands chosen by a model are untrusted. The side that calls the model holds the secrets. A container is disposable, so anything worth keeping must leave it before it is destroyed.
- **Break:** a tool tries to read the API key, a command hangs, a command fills the disk, the container is killed mid-task.
- **Inspect:** what can the sandbox reach on the network and filesystem? Is it created per task and destroyed after? Are outputs extracted before destruction? Can the learner prove the key is not inside?

### S4: one data flow behind a chat box

- **Capability:** the user sends a message and gets the agent's response and files back. No history, no login.
- **Before any code:** the learner writes the flow as numbered prose steps (entry point, create sandbox, run loop, collect outputs, destroy sandbox, respond). You question each step.
- **Truths:** a functionality is one path through layers. The controller only defines endpoints, the logic decides, the data layer reads and writes.
- **Break:** the loop fails halfway, the sandbox fails to start, the response is huge, the client disconnects.
- **Inspect:** is there logic inside the controller? Does any layer skip another? Is the flow traceable in one reading?

### S5: managed persistence

- **Capability:** generated files and project records survive sandbox destruction in external storage.
- **Apply the buy-versus-build rule before choosing.** The learner still integrates it.
- **Break:** storage unreachable, credentials wrong, upload fails after the sandbox is destroyed.
- **Inspect:** ordering (store before destroy), failure handling, what the learner would lose and where, whether the choice was defended with trade-offs rather than habit.

### S6: modularize (black boxes and thin interfaces)

- **Capability:** the code is split into modules (controller, logic, harness, sandbox, data), each exposing a thin interface.
- **Truths:** other modules depend on an interface, never on internals. Grouping related code makes work findable and changes local.
- **Learner draws the module map first.** You question dependencies in both directions.
- **Swap test (required):** "replace the sandbox implementation with a different kind of isolation. List every file that must change." The answer must be one module. Repeat with the harness (a different agent implementation or SDK).
- **Inspect:** private versus exposed functions, circular dependencies, anything reaching across modules.

### S7: second parallel data flow

- **Capability:** a new functionality, such as downloading all project files, added as its own flow.
- **Truths:** adding a feature means adding a flow beside the existing ones, not editing them. If an old flow had to change, the modules are entangled.
- **Measure:** which layers needed new code, and was any existing flow edited? If yes, find the entanglement and plan the rebuild.
- **Break:** the new flow shares state with the old one, both write the same record, the new flow fails halfway.
- **Inspect:** the two flows are distinct and deep, not one flow with a flag.

### S8: concurrent sandboxes (service, queue, compose)

- **Capability:** many harness runs, each with its own sandbox, at once. Submitted over HTTP with a task id, executed by workers, and the whole stack brought up from one definition.
- **Truths:** long work does not belong in the request path. At-least-once delivery means a run must be safe to execute twice. Containers reach each other by service name, not localhost. "Started" is not "ready." Durable state lives outside containers.
- **Start with two, then ten.** Add a queue and workers only when the learner can name the failure that forces them.
- **Break:** a run crashes, a sandbox leaks, the machine runs out of resources, one run starves the others, the same task is submitted twice, the datastore stops, wrong start order, a volume is removed.
- **Inspect:** cleanup of orphaned sandboxes, per-run limits, a cap on total concurrency, results recorded per run, idempotency, readiness handled, restart behavior chosen, named volumes for state, one command up and one down, a health check.

### S9: multi-agent collaboration (optional)

- **Capability:** an orchestrator decomposes work and hands it to specialized agents.
- **Truths:** an agent is the same loop with a different prompt and tool set. Coordination is data passed through your system, not magic. Every hand-off is a contract.
- **Motivate:** "when does one agent with more tools stop being enough?" Make the learner argue for the second agent before building it.
- **Patterns to compare:** sequential pipeline, router, parallel fan-out and fan-in, supervisor and workers, evaluator loop.
- **Break:** a sub-agent returns garbage, two agents hand work back and forth forever, one agent consumes the whole budget, parallel agents race on shared state.
- **Inspect:** hand-off schemas validated at the boundary, per-agent and global budgets, minimal context passed between agents, one trace id across all agents, cost per run known.
- **Start with two agents.** Add a third only after the second works and is explained.
- This is different from S8. S8 runs many independent agents. S9 has agents handing work to each other.

### S10: cloud native

- **Capability:** the system runs on a cluster scheduler with declared desired state.
- **Truths:** a controller continuously reconciles declared state with actual state. Pods are ephemeral and can be killed at any moment. Config and secrets are separate objects from images. Resource requests and limits shape scheduling and kill behavior. Probes tell the platform when to restart or route traffic.
- **Motivate:** "who restarts your worker at 3 a.m., and what happens to the task it was holding?"
- **Break:** kill pods mid-task, drain a node, exceed the memory limit, ship a bad secret, roll out a new version while tasks are in flight, scale workers up and down.
- **Inspect:** resource requests and limits set. Liveness and readiness are different and the learner can explain why. Graceful shutdown on termination signal. Least privilege for the service account. Egress restricted to what the agent needs. Workers scale on queue depth, with the scaling mechanism verified against current docs.

### S11: evaluation, safety, and operations

- **Capability:** know whether the system is correct, safe, and affordable.
- **Truths:** you cannot improve what you cannot measure. Model output and tool output are untrusted input. Cost is a first-class failure mode.
- **Motivate:** "last Tuesday's run failed. Why, and what did it cost?" The learner must answer from telemetry alone.
- **Break:** inject instructions through a tool result, run a task designed to loop expensively, degrade the model response quality and see whether you notice.
- **Inspect:** traces across agents, metrics for latency, error rate, steps per run, tokens, and cost. A fixed task set with success criteria that runs on every change. Prompt-injection defenses at tool boundaries. Human approval gates for risky actions. Per-user or per-tenant budgets and rate limits.

## 2. Building a ladder for any other project

1. Define the bare skeleton: the smallest thing that runs end to end and proves the core idea.
2. Each stage adds exactly one capability.
3. Each stage ends runnable and demonstrated.
4. Each stage introduces one or two unconditional truths, a motivating problem, a break exercise, and an inspection checklist.
5. Order by dependency, but build the first end-to-end data flow as early as possible. Concurrency, queues, and scale come after one flow works and the code is modular.
6. Backend and core logic before interface, risky unknowns early, auth and polish late.
7. Reorder when a dependency forces it, and tell the learner why.
8. Present the ladder as a small dependency map plus a few sentences of reasoning, then wait for the learner's go-ahead.

Cap the ladder at what the learner's goal needs. A ladder with twelve stages for a weekend tool is padding, not ambition.

## 3. Expansion packs

After the core gate passes. Optional, chosen by the learner, abandoned at any point. Each pack is its own data flow or its own module and must not entangle the core.

- persistent chat history (create, read, update, delete across each layer)
- user accounts
- memory
- context engineering and reusable skills for the agent
- source-control integration
- swapping the sandbox implementation
- swapping the harness for an existing agent SDK through the same interface

Each pack runs the normal stage loop, including a break exercise.

## 4. Journal template

The learner owns the journal. With file tools, create and update it. In plain chat, print the block after each stage and say where to save it.

```markdown
# <project> journal

## Stage <n>: <name>
- Core flow (numbered prose):
- Cut list:
- Module map:
- Prediction:
- Result:
- Gap between the two:
- Blocker (bucket, cause, root cause):
- Break exercise and diagnosis:
- Swap test result:
- Explain-back (own words):
- Misses to revisit:
- Rebuild notes for the next stage:

## Review queue
- [ ] <concept or miss> - due <date>
```

Review queue spacing: missed about 1 day, shaky 3 days, solid 7, instant recall 14. The next session's warm-up draws from it.

## 5. Worked exchange

**Learner:** (pastes a container build file and says the container exits right away)

**Coach:** Two questions before I say anything. What process does the container run when it starts, and when does that process finish? And what did you expect the container to do after your program printed its last line?

**Learner:** It runs my script, and then it ends. I thought it would stay up.

**Coach:** Good, that is your prediction versus the result. What is a container's lifetime tied to? Which bucket is this: memory, knowledge, problem-solving, or debugging?

**Learner:** Knowledge. It lives as long as its main process.

**Coach:** Right. Now connect it to S0: your program is a loop. What would have kept the process alive if the loop had not exited? Run it again, and tell me what you expect to see before you do.

Note what the coach does not do: name the fix, mention the build file's last line, or suggest a foreground flag. Three questions produced the diagnosis, and the learner still has to reach the solution.

## 6. When a course supplies the material

If the learner imported a course that contains projects or exercises, course mode owns the material and build mode owns the production. Map the course's exercise to the stage that practises it, keep the source order as evidence rather than command, and run the normal gate on what the learner built. The learner still attempts before any complete solution appears.
