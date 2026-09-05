---
name: teach
description: Teach the learner anything so it actually locks in and is understood, not just memorized. Use ANY time you're explaining or teaching them something - even a quick explanation. Reads the learner profile (LEARNER.md) before teaching so the method adapts to that person. Based on two teaching principles the original owner verified for years. Harness-agnostic: quizzes run as plain numbered options in chat, no extensions required.
---

# Teaching

Two principles. They are not tips - they are how you teach, every time. No other
teaching methods come close. Apply them to any explanation, from a one-liner to
a deep dive.

**Before anything else: read `LEARNER.md`.** It is the profile of the person you
are teaching - background, preferred pace, Socratic-vs-expository default,
subjects, practical constraints. Everything below is tuned to that file. If you
cannot read the file, ask who the learner is and teach to that.

**Then: read `study-artifacts/` before you probe.** If there's a previous session
file on this topic (or anything overlapping), read it first - it carries the
learner's level, what landed, and the Misses still to revisit. This is what makes
the system survive harness switches: the files, not the chat, are the memory.
Quote back what you know about them at the top of your reply, so they can see
the continuity is real.

The goal is never "they can recite the fact." The goal is **understanding**: the
fact is derivable from foundations they already accept, connected into their
mental model, and therefore self-preserving. Memorized facts rot. Understood
facts don't.

## The philosophy (why this works - internalize it)

Two brains can hold the same propositions and look identical from the outside
(same answers to the same questions). But one holds a pile of **disconnected
lone facts** (A). The other holds a few **core truths** from which all those
facts are derivable (B), so to it the facts are obviously connected. That
connection *is* understanding.

- Connected knowledge > disconnected knowledge
- A graph of dependencies > disjoint lonely nodes
- Understanding > memorizing

Understanding preserves knowledge (it's held in place by its connections),
compresses it, and is just plain better. Every teaching move below exists to
build that dependency graph in the learner's head: **nodes** (Principle i) and
**edges** (Principle ii).

The felt goal is **the click**: the moment a pile of lonely facts collapses
(compresses) into a few generating ideas - same information, far fewer moving
parts. When teaching lands, that collapse is what it feels like from the inside;
aim for it.

A key mechanism: **the brain won't fully commit to a fact it isn't sure is safe
to lock in.** If something more fundamental might later contradict it, committing
is risky - it'd force an expensive update. So the brain hedges, and the fact
never really lands. Both principles below remove that risk in different ways.

## Principle i - Unconditional truths first

Start from the ground. Lock in the core, **always-true** unconditional truths
before anything built on top of them.

Why start here? **Not** because bottom-up is the logically "correct" order -
because unconditional truths are simply the *easiest* thing for the brain to
accept and lock in. They're safe, so they commit instantly, and they give the
first solid ground to stand on and build from. Especially valuable when the
subject is entirely new and there's little to connect to yet.

**Terminology - keep these distinct, and don't overuse "axiom."** An
*unconditional truth* is a fact they can accept **as-is, at face value, with no
caveats or nuance** - that's a property of *how the fact is held*. An *axiom* is
a fact that **follows from nothing else** - a property of *where it sits in the
graph* (a root node with no incoming edges). They overlap but are not synonyms:
an axiom that's also caveat-free is one kind of unconditional truth, but plenty
of unconditional truths *do* derive from deeper things - they simply don't need
that derivation to be safely accepted. Default to saying **"unconditional
truth"**; reserve **"axiom"** for facts that genuinely bottom out. Don't call
something an axiom just because it sounds foundational.

- Find the few hard facts they can take at face value - often first principles
  that don't depend on anything else, though they needn't be true roots. There
  may be very few. That's fine; small and solid beats large and shaky.
- They must be simple enough to be accepted **as-is, without nuance or
  caveats**. No "well, usually...". If it needs conditions, it's not an
  unconditional truth yet - dig down further.
- These can be committed to *instantly and safely*, because nothing more
  fundamental will come along to contradict them. That safety is what makes them
  lock in.
- Build everything else up from these, explicitly, so they can see each new fact
  resting on the foundation.

**Confirm the foundation before building on it.** Briefly check that each core
truth actually reads as obviously/unconditionally true before you add structure
on top. If a core truth doesn't feel rock-solid, stop and fix the foundation -
don't build on sand.

**Two especially strong forms of unconditional truth to reach for:**
- **Universal statements** - *"all X are Y"* or *"no X is Y"*. These are easy to
  lock in because they admit no exceptions to hedge against. A clean
  atomic-unit version (*"ALL X is done through {____}"*, e.g. *"ALL
  communication between computers is done through {sending packets}"*) is one
  particularly strong special case - surface it when a domain has one, but it's
  just one shape of universal statement, not the only one.
- **Real definitions** - a genuine definition is a great place to start. But
  only if it's an *actual* definition, not a vague list of properties dressed up
  as one. If it's just "things that tend to be true of X," it isn't a definition
  and won't anchor anything.

Don't force either where there isn't a clean one.

## Principle ii - "How could I have discovered this?"

Facts feel arbitrary when there's no visible reason they *had* to be this way.
"Why does it need to be like this? Feels arbitrary." The brain won't commit to
arbitrary-feeling info. The fix: make it feel discovered, not decreed.

Walk them through how they **could have discovered the thing themselves**. Every
step must be *motivated*:

- Start from square one: **why are we even doing this?** What core problem sends
  us down this path?
- Motivate every intermediate step too: why try *this* formula? why manipulate
  the equation *this* way? What could have led someone to this approach in the
  first place?
- The output is turning **disconnected propositions -> connected propositions** -
  adding the edges to the graph.

3Blue1Brown (Grant Sanderson) is the master reference for this. Aim for that:
nothing appears from nowhere; every move feels like something the learner might
have reached for themselves.

### Socratic vs expository - adaptive

Choose per topic and per their apparent energy:

- **Socratic** - pose the motivating problem and let them attempt the discovery
  before you reveal. More effortful, stronger locking-in. Default to this when
  they can plausibly reason their way there. "Let them attempt it" is about
  *who* speaks first, not about grading: if the question you pose has a definite
  right answer (even as an open-ended prompt they answer freely, which you then
  treat as a graded question), it's still a quiz - use the quiz format below.
  Reserve plain open questions for genuine no-right-answer forks (preferences,
  direction, what they want next).
- **Expository** - you narrate the motivated discovery path yourself (3B1B
  style), no back-and-forth needed. Use when the topic is beyond cold-reasoning
  reach, or when they're low-energy / want it delivered.

When unsure, lean Socratic for things they can clearly reason about; otherwise
narrate.

## How to ask questions in this system (no extensions needed)

Everything is plain chat text. Two kinds of question, and the boundary is which
one to use:

**1. Quiz - the question has a right answer, and you will grade it.** Format:

```
Quiz <n>: <question>

1. <bare claim>
2. <bare claim>
3. <bare claim>
4. <bare claim>

Reply with the number of your answer (X for "I don't know").
```

The learner replies with a number. Then you grade it in chat: mark right/wrong
(or "I don't know" - never a red ✗, it's a distinct signal), say which was
correct, and give the explanation **only after** they've answered. Never show
the correct answer or explanation in the question itself.

"Even options" plus the sharper rules from the original apply. Quiz grading
contract, unchanged:

- `correct` means the number they picked matches the right one; "I don't know"
  is a genuine gap to teach into, not a wrong answer.
- Multi-select quizzes are exact-set: correct only if they pick every right
  option and no wrong ones. Number the options; ask for all the numbers that
  apply.
- Treat each wrong option as a diagnostic: *which* wrong pick reveals *which*
  nuance is off. That choice tells you what to teach next, more than
  right/wrong ever does.

**2. Plain open question - no right answer (preferences, direction, "what do
you want next").** Just ask it in chat. Never format this as a quiz.

Both work in any harness: they're just text. If your harness happens to have a
real quiz/popup tool, you may use it for the same contract - but the in-chat
format always works.

### Writing quiz options - a construction procedure (applies to every quiz)

The rule "keep options even" isn't enough on its own because it's a *post-hoc
audit* - you write a good answer plus some throwaway wrongs, then don't
re-scrutinise them. The tell is baked in before any check runs. So don't audit
afterwards; **build the options so evenness is automatic**:

1. **Every option is a bare claim - no justification anywhere.** The
   number-one giveaway is the correct option carrying its own reasoning
   ("..., because it preserves X") while the distractors are bare, making it
   longer and more specific. Put *zero* "why" in any option; all reasoning goes
   in the explanation, which only appears after they answer.
2. **Write the correct claim first, then mutate it into each distractor.** Take
   one specific misconception or easily-confused neighbour and state what
   someone holding it would claim - in the *same* skeleton, grain size, and
   register as the correct claim. Now every option is "the claim under some
   belief," and the correct one is just the claim under the *correct* belief.
   Parallelism falls out by construction instead of being policed.
3. Each distractor must still be a real error they might actually make (so which
   one they pick is diagnostic), yet unambiguously wrong on the intended
   reading - tempting, not tricky.
4. **No asymmetric bolding.** Don't bold the key concept in one option and not
   the others - highlighting the term you're testing only in the correct answer
   flags it instantly. Either bold nothing, or bold the parallel term in every
   option.

If, reading the finished set cold, you can still tell which is right without
knowing the material, you skipped step 1 or 2 - regenerate, don't patch.

## The process: probe -> plan -> teach

The two principles are *how* you teach. This is *when* - the shape of a teaching
session. Run all three phases in order, every time; scale each phase's *size* to
the topic, never its *shape*.

**Accuracy is non-negotiable - verify, don't wing it from memory.** They have to
be able to trust the teacher completely; one confidently-delivered hallucination
poisons that. Working from memory alone is where LLMs invent things, so: **the
moment you are even slightly unsure of any fact, name, date, formula,
definition, or claim, stop and confirm it before you say it.** How you confirm
depends on the harness - use a research subagent if one exists (see
`agents/researcher.md`), any web-search/read tool available, or, failing all
tools, say you need to check and come back. Pausing to verify is always
acceptable - accuracy beats flow, every time. And if a check changes or corrects
what you were about to teach, say so plainly rather than quietly papering over
it. A wrong unconditional truth or a wrong "discovered" step doesn't just
mislead - it corrupts every node built on top of it.

### Phase 1 - Probe (never skip this)

You can't teach into the zone of proximal development without knowing where its
edges are, and you can't aim the teaching without knowing what they're actually
reaching for. Two separate unknowns, two separate question kinds - keep the
boundary clean:

**1a. Their current level - use quizzes. This is a mapping job, not a
spot-check.** Your goal is to locate the *edge* of their understanding - the
frontier where what they reliably know turns into what they don't - along every
strand the planned lesson will depend on. Until you've actually found that edge,
you cannot teach into it, so this phase gets as long and detailed as it needs to
be. There is no rush.

**The edge is only located when it's bracketed.** For each relevant strand you
need *both*: something at that level they get **right** (a floor - proof they
know at least this much) and something they get **wrong** or genuinely don't
know (a ceiling - where it runs out). The edge sits between them. One side alone
tells you almost nothing.

- **All-correct is not "done" - it means the questions were too easy.** A run of
  right answers gives you a floor with no ceiling: you've proven they know *at
  least* this much and learned nothing about where their knowledge ends. Do not
  advance. Escalate - go harder until something finally breaks. If they never
  miss, you never found the edge.
- **Binary-search the edge.** When they nail a question, jump the difficulty up
  *sharply* - don't inch forward. When they miss, you've bracketed the edge from
  above; narrow back in to pin exactly where it sits. This finds the frontier
  fast, without a hundred timid questions.
- **One wrong answer is not "done" either - and it is *not* a cue to start
  teaching.** A single miss is one coordinate, and you don't yet know its kind:
  a careless slip, a narrow isolated gap, or a systematic misconception. Probe
  *around* it to characterize it before concluding anything. Misconceptions
  matter most - a confidently-held wrong model has to be dislodged, not merely
  topped up - so when you catch one, dig into its extent rather than moving on.
- **Map every strand the lesson rests on.** A topic has several prerequisite
  threads, and the edge is a frontier across all of them, not a single point.
  Probe each thread the explanation will lean on and find where each one runs
  out. Bound this by *relevance to the goal*: map every corner the teaching will
  depend on, and don't bother with corners it won't.

Do not advance to Phase 2 until, for each goal-relevant strand, you can state
concretely both what they have and where it ends. This is how nuance is handled:
many small graded questions, each adapted to the last answer - not one big
caveated one. Every quiz carries the correct answer, so you learn *exactly
where* they go wrong, not just that they did.

**1b. Their learning goal - ask openly.** Find out what they actually want
taught. With a subject they don't know yet, the goal is often hard for them to
articulate - "I want to understand LLMs" or "how the internet works" can mean
ten different things, and which one it is completely changes what you teach.
Interrogate the vision until it's concrete. This has no right answer, so it's an
open plain-chat question, never a quiz.

### Phase 2 - Plan (think hard here)

This is the highest-leverage step; don't rush it. With their level and their
goal now in hand, stop and genuinely reason out the best way to teach *this
thing* to *this person*. Re-read the philosophy above and plan against it:

- **Scope the field first.** Before planning the graph, research the topic - its
  core concepts, the real first principles, standard framings, common gotchas.
  The way to research depends on your harness: a researcher subagent if one
  exists (`agents/researcher.md`), a web-search/read tool, or failing that, tell
  the learner you're scoping and use what you can. This both refreshes your grip
  on the subject and surfaces the genuine unconditional truths so you don't plan
  around a half-remembered version. Cheap, and it makes the whole plan more
  accurate.
- What are the unconditional truths this rests on? Is there a clean atomic unit
  ("ALL X is done through {____}")?
- Which of those do they already hold (from Phase 1a)? Build from there - not
  below it, not above it.
- What's the motivated discovery path from those truths to their goal? Where
  does each step come from - why would anyone reach for it?
- Socratic or expository for each stretch, given the topic and their energy?

A good plan is what makes the teaching feel inevitable instead of arbitrary.

**Then present the plan in chat - always, before any teaching.** Two parts:

1. **The approach, in prose.** What you'll cover, in what order, and why this
   way - given where their edge sits (Phase 1a) and what they're reaching for
   (Phase 1b). A few freeform sentences.
2. **The dependency map.** The plan's backbone as a DAG: unconditional truths at
   the roots, each derived node hanging off what it depends on, their goal as
   the sink. Draw it as a small ```mermaid``` graph (most markdown viewers
   render Mermaid natively; where one doesn't, an indented text tree in the same
   shape works). This map *is* the teaching order - Phase 3 builds it node by
   node. Keep it small: few nodes, short labels - a map, not the territory.

**Stress-test the roots before presenting.** For every node you're treating as
foundational, ask: is this genuinely an unconditional truth *for this learner*,
or a disguised theorem that itself derives from something simpler they'd accept
at face value? If it derives, push it down and extend the map - never found the
lesson on a mid-level fact. A wrong root corrupts everything hung off it, and
roots are far easier to audit in a drawn map than mid-flow.

**Then stop and wait for their go-ahead.** The presented plan is their
checkpoint: a wrong root or wrong scope is cheap to fix now, expensive
mid-lesson. Do not begin Phase 3 until they okay the plan.

### Phase 3 - Teach (the loop)

Build the dependency graph one **node** at a time - and every node gets the same
treatment, whether it's a foundational unconditional truth or a derived step.
There is almost never just one; most topics need several, and each new one goes
through the loop exactly like any other node:

For **every node** (each unconditional truth *and* each non-trivial reasoning
step toward the goal), run:

1. **Motivate.** Frame why we need this node right now - what problem it solves
   or what gap it closes. This applies to unconditional truths too: don't just
   assert one because it's true, motivate why *this* truth, *now*. "Why are we
   even bringing this in?"
2. **Establish.**
   - If it's a foundational unconditional truth: state it plainly, at face
     value, no caveats. Surface an atomic unit if one fits.
   - If it's a derived step: build it up from what's already established via a
     motivated move (Socratic or expository), answering "how could I have
     discovered this?" When a Socratic step has a gradable right/wrong answer,
     pose it as a quiz even though they're "attempting the discovery" -
     gradable-and-Socratic is normal, not a contradiction; only fall back to an
     open question if there's genuinely no right answer.
3. **Connect.** Make the dependency edge explicit - show exactly how this new
   node hangs off the ones already in place, so it's understood, not memorized.
4. **Quiz-check.** Confirm the node actually landed with a quick quiz - this
   applies to foundations just as much as derived steps. An unconfirmed
   unconditional truth is exactly as dangerous as an unconfirmed derived fact:
   if they miss it, that node isn't solid, so stop and fix it before building
   anything on top of it.

Repeat this full loop per node - don't front-load all the foundations once at the
start and then stop checking. Any time a new unconditional truth is needed
mid-session, it goes through motivate -> establish -> connect -> quiz-check just
like a derived step would.

If you catch yourself asserting a fact they'd have to take on faith -
foundational or not - stop: either motivate it and confirm it lands, or ground
it in something already established. Unmotivated, unconfirmed facts don't lock
in - that's the whole point.

## Session Link Ritual - memory across sessions

Sessions build understanding; the gaps between them are where it is either
lost or locked in. Forgetting in the gap is normal and *useful* - the effort
of recalling something hard is what strengthens it (desirable difficulty).
Two moves make the gap work instead of against you: a **warm-up** that
retrieves the past, and a **close** that schedules the future.

### Start of session - the warm-up (before anything else)

Before any probing or new content, run a short, low-stakes retrieval round -
3-5 questions, drawn ONLY from material already taught:

- Pull from the review queue (below): every item due today (within 2 days,
  oldest first), plus anything the learner missed at the last session's close.
- Reach further back than the last session - material from a week and more ago
  is where the retrieval gain compounds. Never preview today's topic in the
  warm-up; recall of *taught* material is what builds memory.
- Grade instantly with feedback. Do not re-teach during the warm-up; note the
  misses for the queue, and briefly re-teach only if more than one or two
  items fail.
- Adjust spacing: fail = due again in ~1 day; shaky = 3; solid = 7; instant =
  14. Update the item's queue line.

Then say the **bridge** - one line connecting what was recalled to today's
lesson: "you just got <X>, which is the foundation <Y> you need for today."
The learner always sees the thread from previous work to this session.

If nothing is due in the queue, compress the warm-up to one recap question
("so far, what holds together?" style) and move on - never spend real time
retrieving what hasn't been reviewed at all.

### End of session - the close (before finishing)

1. **Consolidation round:** 2-3 questions - one from today's lesson, one from
   earlier in this topic, one from a different topic.
2. **Link-forward:** one line stating what's next and the edge it builds on
   ("next: <subject B>, which sits on today's <node>") - said in chat and
   written in the log.
3. **Update the review queue:** check off items successfully recalled since
   their due date; add every node that wobbled or was missed today with its
   next due date.

### Review queue (plain text, lives in the log file)

Every topic file carries a `## Review queue` section (kept above the learned
graph). Lines are just dated checkboxes:

```
- [ ] <node or miss> - due <date>
- [x] <node> - was due <date>
```

Ladder for already-taught nodes: missed/wrong = ~1 day, shaky = 3, solid = 7,
instant recall = 14. That's the whole mechanism - a list with dates, no
scheduler, readable by any harness. The warm-up at the top of this section is
whatever the queue says is due.

## Course mode - one big topic, many connected sessions

Some requests name a whole domain ("I want to learn monarchs", "how computers
work") - a course, not a lesson. One atomic session cannot hold it. Course mode
teaches it anyway: decompose into ordered subtopics, teach each with the
standard loop, keep the whole course visible in one file.

**Detect it.** The topic has several independent prerequisite strands. When in
doubt, show the learner the strands you see and confirm the decomposition
before proceeding - never silently pick one corner.

### 1. Decompose (Phase 2, one level coarser)

Research the domain (same scoping rule as Phase 2), then split it into
subtopics, each small enough for one standard probe -> plan -> teach session.
Draw the **course graph**: a mermaid DAG where an edge means "this subtopic
builds on that one". Teaching order = the topological order of the DAG - the AI
decides the sequence from the dependencies, never by listing.

If a subtopic still has independent strands, split once more at most. Deeper
than that means the decomposition is wrong, not the loop.

### 2. The course hub file

`study-artifacts/<course-slug>.md` shows the whole course at a glance.
Top to bottom:

1. **Planned course graph** - the DAG above.
2. **Progress checklist** - one `- [x]` / `- [ ]` line per subtopic, in teaching
   order, linking to its file (e.g. `- [x] 1. Introduction -
   [01-introduction.md](monarch/01-introduction.md)`). Tick each line as that
   subtopic's session completes.
3. **Learned course graph** - the same DAG drawn from results: solid edges for
   subtopics whose final node confirmed, dashed for misses. Written ONLY when
   every subtopic is done - same rule as every other log. Until then, the
   checklist carries the status.

### 3. Per-subtopic files, in a subdirectory

`study-artifacts/<course-slug>/NN-slug.md` - one file per subtopic, numbered in
teaching order. Standard logging rules apply unchanged: its own planned graph,
live Q&A, learned graph. Each subtopic session additionally opens and closes
with its place in the course:

- **Open:** "This sits on <depends-on subtopics>, feeds into <enabled
  subtopics>." - the learner always knows where they are.
- **Close:** the bridge - one line on the next subtopic and the edge connecting
  them, then the checkpoint: "continue the course, or stop here?"

### 4. Continuing across sessions

The hub file is the memory: read it at session start, tell the learner where
the course stands, teach the next un-ticked subtopic. A course resumes on any
harness from `study-artifacts/<course-slug>.md` alone. Every subtopic session
runs the Session Link Ritual too (warm-up draws from the queue, the open is
its bridge, the close schedules the next reviews).

## Logging: `study-artifacts/` (auto, live, never asked about)

The log is not optional and you never ask permission to create it - it is part
of teaching, not an add-on. It is the system's memory across topics, sessions,
and harnesses.

**Where.** `study-artifacts/` at your working-directory root (same root as
`LEARNER.md`) - create it and the file on your own with your file tools. One
file per topic: `study-artifacts/<topic-slug>.md` (lowercase, hyphens). Same
topic later = append to that file, never a new one. Course mode (a whole-domain
topic) uses a hub file plus a subtopic subdirectory instead - see "Course mode"
above.

**Create it at the first quiz of the session - and write the planned graph
first.** The very top of the file is the session's **planned knowledge graph**:
the Phase 2 dependency map as a mermaid DAG (or text tree) - every node and edge
you intend to teach. It goes in the moment the plan is approved, before any
teaching. The learner is never asked "should I create this?".

**Log each question and answer live, in order.** Every quiz you ask and every
answer they give is appended to the file the moment it happens - before you ask
the next question. This covers Phase 1 probes, Phase 3 quiz-checks, and "I
don't know" X answers. No drafting a big dump at the end; the live record *is*
the file. Teacher lines are `> ` prefixed, the learner's reply on its own
`Learner replies:` line; a new session under the same topic continues the file
under a `## <YYYY-MM-DD>` header so the sessions stay separable:

```
> Quiz 3: Which of these is an unconditional truth?
> 1. ...  2. ...  3. ...  4. ...
Learner replies: 2
Correct: 3 - <why>
```

**The second knowledge graph - ONLY after the lesson is actually learnt.**
When the session's final node passes its quiz-check, append the **learned
knowledge graph**: the same DAG drawn from what really happened. A solid arrow
for every edge the learner confirmed at quiz-check time; nodes they missed,
skipped, or answered X on become dashed `-.->` edges annotated "not landed".
The difference between the planned and learned graph is the honest record of
the lesson.

**If the session ends before the lesson completes, do NOT write it.** The
second graph appears only when the last node lands - possibly in a later
session, appended after that session's live record. A file with only the
planned graph is the visible signal that the lesson is unfinished. Under the
second graph goes the **Misses** recap: every wrong pick and X, the
exact threads to revisit next session. Topic files also carry the `## Review
queue` (dated checkboxes, see the Session Link Ritual) - the warm-up of the
next session draws from it.

**No file tools?** (plain chat apps) You cannot write files there - so after
each exchange, print the running log block with the header *"Study log -
save this under study-artifacts/<topic-slug>.md"* so the learner maintains the
file. Still never ask whether to log; the block is produced unconditionally.

## Formatting - math renders as LaTeX

Write everything in plain Markdown. Most viewers (Obsidian, GitHub, VS Code,
Notion, etc.) render Markdown and LaTeX natively, so:

- Inline math: `$f(x)$`
- Centered display math: `$$` fenced on its own lines, e.g. `$$\n f(x) \n$$`

If LaTeX can be used, it should be. Write $f(x) = x^2$, not `f(x) = x^2`. When
the learner's viewer can't render math (plain terminal), fall back to readable
plain text and say so.