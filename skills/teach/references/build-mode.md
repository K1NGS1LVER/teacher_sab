# Build mode reference

Depth behind the build mode section of `SKILL.md`. The inline section is the contract: the ban, the stage loop, the gate, and the inspection order. This file holds the default ladder, the rules for building a different one, the journal template, and one worked exchange.

Load this file when the project is a cloud-native agent system, when the learner asks for a stage plan, or when you need a worked example of the inspect-first reply shape.

## Contents

- Default ladder: cloud-native agent orchestration (S0 to S9)
- Building a ladder for any other project
- Journal template
- Worked exchange
- When a course supplies the material

## 1. Default ladder: cloud-native agent orchestration

Use when the learner's goal is to build an agent, orchestrator, or service that calls a model. Each stage names the new capability, the unconditional truths it rests on, the problem that motivates it, break exercises, and the inspection checklist.

Verify provider and platform specifics against current docs before stating them. A confident wrong fact corrupts every stage built on it.

### S0: a loop with one model call, on the host machine

- **Capability:** read input, call the model, print the reply, stop on an exit signal.
- **Truths:** a program is a loop of input, work, output. An LLM API call is a network request with text in and text out. Each request is independent: the model sees only what that request contains.
- **Motivate:** "what happens if you send the same question twice?"
- **Break:** missing key, wrong model name, no network, empty input, very long input.
- **Inspect:** key read from the environment and never hardcoded. API errors and timeouts handled. A clean exit path. An explicit output length cap. Can the learner say exactly what the model saw on each call?

### S1: the same program inside a container

- **Capability:** the loop runs from a container image with configuration injected at run time.
- **Truths:** an image is a read-only template and a container is a running instance of it. A container has its own filesystem and process namespace but shares the host kernel. Changes inside a container are lost when it is removed unless stored outside it. Config belongs to the environment, not the image.
- **Motivate:** "it works on your machine, so what do you need to hand someone so it works on theirs?"
- **Break:** build without a dependency, run without the env var, kill the container mid-reply, remove the container and look for data.
- **Inspect:** no secret in any image layer or build context. Ignore file present. Pinned base image and dependency versions. Non-root user. Small image. Can the learner prove no secret is in the image history?

### S2: conversation state

- **Capability:** the loop keeps a message history and the model appears to remember.
- **Truths:** the model has no memory. "Memory" is the list your program re-sends. Context windows are finite and every token costs time and money.
- **Motivate:** "ask it your name, then ask it what your name is."
- **Break:** run until the context limit, restart the container and observe state loss, send a poisoned earlier message.
- **Inspect:** the history is bounded, with a deliberate trimming or summarizing strategy the learner chose and defended. Where does state live, and what survives a restart? Token use is estimated or measured.

### S3: tools

- **Capability:** the model can request an action, the program performs it, the result goes back, the loop continues.
- **Truths:** the model never executes anything. It emits a structured request. Your program decides whether to run it. The tool boundary is the security boundary.
- **Motivate:** "how would the model know today's date, or the contents of a file?"
- **Break:** tool throws, tool returns a huge result, the model requests a tool that does not exist, the model sends malformed arguments, the model requests the same call forever.
- **Inspect:** arguments validated, tool allowlist, result size capped, errors returned to the model as data, tools sandboxed inside the container, no shell access passed through. Predict the number of model calls for a question needing one tool, then check.

### S4: loop control and observability basics

- **Capability:** a bounded, debuggable agent loop.
- **Truths:** every loop needs a hard stop. Failures are normal and must be classified as retryable or not. A run you cannot reconstruct is a run you cannot debug.
- **Motivate:** "what stops this if the model never says it is done?"
- **Break:** force an infinite tool loop, simulate rate limiting and timeouts, return garbage from a tool.
- **Inspect:** max iterations, token or cost budget, wall-clock timeout, repeated-action detection, retry with backoff only on transient errors, a run id on every log line, one structured log entry per step.

### S5: the agent as a service

- **Capability:** submit a task over HTTP, get a task id, poll for status, work happens in a background worker.
- **Truths:** long work does not belong in the request path. A task is a unit of work with an id and a status. Containers are disposable, so durable state lives outside them.
- **Motivate:** "what does the caller see while the agent works for three minutes?"
- **Break:** kill the worker mid-task, submit twenty tasks at once, submit the same task twice, stop the datastore.
- **Inspect:** task states and transitions are explicit. A choice of queue mechanism made and defended with trade-offs. At-least-once delivery means tasks must be safe to run twice, so check idempotency. Timeouts on tasks. A health check. Nothing important stored inside a container.

### S6: local multi-container composition

- **Capability:** API, worker, queue, and datastore run together from one definition.
- **Truths:** containers reach each other by service name on a shared network, not by localhost. "Started" is not "ready." Config differs per environment and secrets are injected, not baked in.
- **Motivate:** "why does the worker fail on first start but work on the second?"
- **Break:** wrong start order, datastore down, wrong hostname, a volume removed.
- **Inspect:** readiness handled, restart behavior chosen deliberately, named volumes for state, one secrets path, one command to bring the stack up and one to tear it down, owned by the learner.

### S7: multi-agent orchestration

- **Capability:** an orchestrator decomposes work and hands it to specialized agents.
- **Truths:** an agent is the same loop with a different prompt and tool set. Coordination is data passed through your system, not magic. Every hand-off is a contract.
- **Motivate:** "when does one agent with more tools stop being enough?" Make the learner argue for the second agent before building it.
- **Patterns to compare:** sequential pipeline, router, parallel fan-out and fan-in, supervisor and workers, evaluator loop.
- **Break:** a sub-agent returns garbage, two agents hand work back and forth forever, one agent consumes the whole budget, parallel agents race on shared state.
- **Inspect:** hand-off schemas validated at the boundary, per-agent and global budgets, minimal context passed between agents, one trace id across all agents, errors compound and the learner can show where, cost per run is known.
- **Start with two agents.** Add a third only after the second works and is explained.

### S8: cloud native

- **Capability:** the system runs on a cluster scheduler with declared desired state.
- **Truths:** a controller continuously reconciles declared state with actual state. Pods are ephemeral and can be killed at any moment. Config and secrets are separate objects from images. Resource requests and limits shape scheduling and kill behavior. Probes tell the platform when to restart or route traffic.
- **Motivate:** "who restarts your worker at 3 a.m., and what happens to the task it was holding?"
- **Break:** kill pods mid-task, drain a node, exceed the memory limit, ship a bad secret, roll out a new version while tasks are in flight, scale workers up and down.
- **Inspect:** resource requests and limits set. Liveness and readiness are different and the learner can explain why. Graceful shutdown on termination signal. Least privilege for the service account. Egress restricted to what the agent needs. Workers scale on queue depth, with the scaling mechanism verified against current docs.

### S9: evaluation, safety, and operations

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
5. Order by dependency: backend and core logic before interface, risky unknowns early, auth and polish late.
6. Reorder when a dependency forces it, and tell the learner why.
7. Present the ladder as a small dependency map plus a few sentences of reasoning, then wait for the learner's go-ahead.

Cap the ladder at what the learner's goal needs. A ladder with twelve stages for a weekend tool is padding, not ambition.

## 3. Journal template

The learner owns the journal. With file tools, create and update it. In plain chat, print the block after each stage and say where to save it.

```markdown
# <project> journal

## Stage <n>: <name>
- Prediction:
- Result:
- Gap between the two:
- Blocker (bucket, cause, root cause):
- Break exercise and diagnosis:
- Explain-back (own words):
- Misses to revisit:
- Rebuild notes for the next stage:

## Review queue
- [ ] <concept or miss> - due <date>
```

Review queue spacing: missed about 1 day, shaky 3 days, solid 7, instant recall 14. The next session's warm-up draws from it.

## 4. Worked exchange

**Learner:** (pastes a container build file and says the container exits right away)

**Coach:** Two questions before I say anything. What process does the container run when it starts, and when does that process finish? And what did you expect the container to do after your program printed its last line?

**Learner:** It runs my script, and then it ends. I thought it would stay up.

**Coach:** Good, that is your prediction versus the result. What is a container's lifetime tied to? Which bucket is this: memory, knowledge, problem-solving, or debugging?

**Learner:** Knowledge. It lives as long as its main process.

**Coach:** Right. Now connect it to S0: your program is a loop. What would have kept the process alive if the loop had not exited? Run it again, and tell me what you expect to see before you do.

Note what the coach does not do: name the fix, mention the build file's last line, or suggest a foreground flag. Three questions produced the diagnosis, and the learner still has to reach the solution.

## 5. When a course supplies the material

If the learner imported a course that contains projects or exercises, course mode owns the material and build mode owns the production. Map the course's exercise to the stage that practises it, keep the source order as evidence rather than command, and run the normal gate on what the learner built. The learner still attempts before any complete solution appears.
