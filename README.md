# teacher_sab

A teaching system that works in **any** AI harness: opencode, Claude Code, pi,
Codex, Cursor, plain ChatGPT - whatever you use. No harness-specific code, no
extensions to install: the pedagogy runs as plain-chat conventions and a set of
portable Markdown skills.

> **Fork of [amosblomqvist/learn](https://github.com/amosblomqvist/learn)**.
> The pedagogy - two teaching principles, the probe → plan → teach loop, the quiz
> construction rules, the visualization discipline - is entirely from that
> project ([the original video](https://www.youtube.com/watch?v=kzcI5F4tGiU)).
> This fork strips the pi-specific extension code so nothing depends on a
> particular agent: no popups, no Obsidian md-log, no extension-backed makers.
> The teaching core is the transferable part; the original belongs to the author
> who got it right first. Upstream: https://github.com/amosblomqvist/learn

## What it teaches how

Two principles, verified by the original owner over years of use:

1. **Unconditional truths first** - lock in the always-true core before anything
   built on it, so it commits instantly and safely.
2. **"How could I have discovered this?"** - every step gets a reason, so
   nothing feels arbitrary. A fact you could have found yourself, you remember.

Plus a **probe → plan → teach** loop: graded quizzes (and free-recall checks)
to locate the exact edge of your understanding, a plan (with a dependency map)
you approve before any teaching, then node-by-node building with a quiz check
after every step - and misses are self-explained before being corrected. Every
session opens with a low-stakes retrieval warm-up and closes with a brain-dump,
feeding a spaced review queue so knowledge survives the gaps between sessions.
Whole domains run as connected course sessions. Visuals are added only when a
picture genuinely beats words - never decoration.

## What's in here

| Path | Role | Required? |
| --- | --- | --- |
| `skills/teach/SKILL.md` | the teaching philosophy + process (atomic lessons + course mode for whole domains) | **yes** |
| `LEARNER.md` | the learner profile the teacher reads each session | **yes** |
| `skills/visualize/SKILL.md` | when/how to add a correct visual to a lesson | optional |
| `agents/researcher.md` | brief for a research subagent (accuracy checks) | optional |
| `agents/mermaid-maker.md` | brief for a diagram-maker subagent | optional |
| `agents/svg-maker.md` | brief for a geometry-diagram subagent | optional |
| `study-artifacts/` | session logs (planned + learned knowledge graphs, review queues) + an auto-maintained index - auto-created, filled by the teach skill | generated |
| `LEARNER.template.md` | blank profile for handing the system to someone else | - |

Minimum viable setup: `skills/teach/SKILL.md` + `LEARNER.md`. Everything else is
polish that degrades gracefully when absent.

The layout matches both conventions at once: `skills/` and `agents/` are exactly
what the original pi config used, and the skill files are the standard agent
skills format (`SKILL.md` with `name`/`description` frontmatter), readable by
every skill-capable agent.

## Using it in your harness

Pick one row. Every path below installs the pieces you chose from the table
above. After installing, run your agent and tell it: **"Use the `teach` skill.
Teach me <topic>. Read LEARNER.md first."**

To pick up mid-stream without naming a topic - due reviews first, then your
next step: **"Use the teach skill. Continue my studies."** The teacher reads the
logs and review queues and proposes today's session.

### Quickest: npx (npm package)

```bash
npx teacher-sab
```

Prompts for which harnesses and where to install, then drops in the `teach`
skill (+ optional `visualize` skill and the 3 subagents), creates `LEARNER.md`
from the template, and makes the `study-artifacts/` log dir. Non-interactive
variant: `npx teacher-sab -a "2 6 9" -d . -y` (harnesses by number or name).

Package metadata and the CLI credit the original: pedagogy by
[amosblomqvist/learn](https://github.com/amosblomqvist/learn); installer,
packaging, and improvements by this fork. What the fork adds over the original
is documented in [IMPROVEMENTS.md](IMPROVEMENTS.md) (also shipped in the
package).

The manual installs below do the same thing without npm.

### Quickstart: setup script

`setup.sh` installs everything interactively - it asks questions with tricolor
(yes, you guessed it) menus:

```bash
bash <path-to-this-repo>/setup.sh
```

Run it from anywhere; it finds its own files from its own location.

**Pick one harness or several.** Type one number, or space/comma-separated
numbers for multiple (e.g. `2 6 9` installs into Claude, Antigravity, and the
universal dir at once). Type `a` for everything.

**Copy or symlink.** It asks whether to copy the files in or symlink to the
repo. Symlink mode makes the repo the single source of truth: edit
`skills/teach/SKILL.md` or `LEARNER.md` once and every harness sees the change.
(Cursor rules are generated `.mdc` files, so those are always written.)

When it asks where to install, you can type a path, **or drag a folder from
Finder into the terminal** (it pastes the path for you), or just press Enter to
use the current directory. Relative paths resolve against wherever you ran the
script from:

```
Install into directory (absolute or relative) [..]: ~/some/project
```

If you pick a *global* harness (Claude, Kilo, Hermes, Cursor), the script also
offers a user-level install so the skill follows you across projects instead of
staying in a project folder.

### The universal method (recommended - works across agents)

The cross-agent skills standard is `.agents/skills/` - opencode, Codex, and
increasingly others read it natively, so one copy serves every skill-capable
agent you run:

```bash
cd <your-project>
mkdir -p .agents/skills
cp -r <path-to-this-repo>/skills/teach .agents/skills/
cp -r <path-to-this-repo>/skills/visualize .agents/skills/
cp <path-to-this-repo>/LEARNER.md .
```

Put `LEARNER.md` in your project root - the teach skill looks for it there.
Restart your agent if it caches skills at startup (Codex, Cursor) and it should
list `teach` as available.

### Per-harness reference

| Harness | Where the skills go | Subagents (optional) |
| --- | --- | --- |
| opencode | `.opencode/skills/` (also reads `.agents/skills/`) | `.opencode/agent/` |
| Claude Code | `.claude/skills/` (also reads `.agents/skills/`) | `.claude/agents/` |
| Codex | `.agents/skills/` (repo) or `~/.agents/skills/` (user) | inline (no subagent files) |
| Cursor | `.cursor/rules/teach.mdc` (also reads `.codex/skills/`) | inline |
| pi (original harness) | install the whole repo as `.pi/` | `.pi/agents/` |
| Plain chat (ChatGPT, Gemini, ...) | paste `skills/teach/SKILL.md` into the session | none |

If your harness reads `.agents/skills/`, skip the per-harness row and just use
the universal method above.

**opencode**

```bash
cd <your-project>
mkdir -p .opencode/skills .opencode/agent
cp -r <path-to-this-repo>/skills/teach .opencode/skills/
cp -r <path-to-this-repo>/skills/visualize .opencode/skills/
cp <path-to-this-repo>/agents/*.md .opencode/agent/
cp <path-to-this-repo>/LEARNER.md .
```

The `teach` skill shows up in the skill picker and as a slash-command-style
`/teach`. Ask in chat "use the teach skill" or invoke it directly. The three
`agents/*.md` files become real subagents the teacher can dispatch for research
and diagrams.

**Claude Code**

```bash
cd <your-project>
mkdir -p .claude/skills .claude/agents
cp -r <path-to-this-repo>/skills/teach .claude/skills/
cp -r <path-to-this-repo>/skills/visualize .claude/skills/
cp <path-to-this-repo>/agents/*.md .claude/agents/
cp <path-to-this-repo>/LEARNER.md .
```

Invoke with `/skills` (or ask the agent to use the `teach` skill). The three
briefs in `agents/` become Claude Code subagents (`researcher`,
`mermaid-maker`, `svg-maker`).

**Codex**

```bash
cd <your-project>
mkdir -p .agents/skills
cp -r <path-to-this-repo>/skills/teach .agents/skills/
cp -r <path-to-this-repo>/skills/visualize .agents/skills/
cp <path-to-this-repo>/LEARNER.md .
# user-level (all your repos), optionally:
mkdir -p ~/.agents/skills
cp -r <path-to-this-repo>/skills/* ~/.agents/skills/
```

Restart Codex after adding skills so it picks them up. Codex has no subagent
files, so research/verification runs inline with its own tools - same behavior,
different plumbing.

**Cursor**

```bash
mkdir -p .cursor/rules
```

Create `.cursor/rules/teach.mdc` with this frontmatter prepended to the contents
of `skills/teach/SKILL.md`:

```markdown
---
description: Teach anything so it locks in, not just memorizes. Follow for every lesson, explanation, or teaching task. Reads LEARNER.md first.
alwaysApply: true
globs: ["**/*"]
---
<contents of skills/teach/SKILL.md>
```

The `alwaysApply: true` makes the rules fire on every agent run without any
setup step. Do the same for `skills/visualize/SKILL.md` as `visualize.mdc` if
you want diagrams.

**pi (the original harness)**

```bash
cd <your-project>
git clone https://github.com/K1NGS1LVER/teacher_sab.git .pi
```

The repo's layout is exactly the `.pi` config layout, so it drops in as-is.
Because this fork removed the pi extension code, quizzes now run as in-chat
numbered options (same grading contract) instead of the original popups. If you
want the popups and Obsidian md-log back, run the upstream repo instead or
re-add its `extensions/`.

**Plain chat (ChatGPT, Gemini, Copilot, ...)**

No filesystem to install to. Just paste in:

1. `skills/teach/SKILL.md` - prefixed with "You are a teacher. Follow this
   exactly."
2. Your filled-in `LEARNER.md` - prefixed with "This is the learner. Teach to
   this profile."

Then start the topic. Bonus: paste `skills/visualize/SKILL.md` too if the chat
app can render Markdown (most can), so diagrams come along.

### First-run checklist

1. Installed the skill into a location your harness reads.
2. `LEARNER.md` sits in your project root (or wherever the skill can read it).
3. Said "use the teach skill" (or invoked `/teach` / opened the rule).
4. The teacher probes with a few quizzes before it ever starts explaining - if
   it jumps straight into lecturing, remind it to run Phase 1 (probe) first.

## Change the owner

The whole system teaches **one learner at a time**, and that learner lives in
`LEARNER.md`:

1. Edit `LEARNER.md` - background, how you like to learn, subjects, energy
   habits, anything that changes how you should be taught.
2. To hand the system to someone else: `cp LEARNER.md their-name.md`, reset
   `LEARNER.md` from `LEARNER.template.md`, and have them fill it in.

The teach skill reads `LEARNER.md` at the start of every session. Edit that
file, and the same skill teaches a different person. No code changes.

## Trade-offs vs. the original

The original ran on pi with real extensions: a `quiz` TUI popup, an
`ask-user-question` popup, md-log to Obsidian, and tool-backed makers that
render Mermaid/SVG to PNG and verify by looking. This port loses:

- **Popups** - quizzes are in-chat numbered options instead. Same grading
  contract, less pretty.
- **Guaranteed pixel-rendered diagrams** - makers render only where the harness
  has a rendering path; otherwise the visual is a Mermaid/ASCII block the
  learner renders in their own viewer.
- **md-log to Obsidian** - you lose the auto-append to a markdown note. Copy/
  paste, or wire it to whatever file tools your harness has.

If you want the popups and extension-backed makers back, run the original repo
(pi) or adapt `extensions/` from it - the pedagogy here is the transferable
part.

## Keeping in sync with upstream

The fork keeps the upstream remote; pick up original changes with:

```bash
git fetch upstream main && git merge upstream/main
```

## Notes

- Accuracy is non-negotiable in this system. When in doubt, the teacher pauses
  and verifies before teaching.
- The quiz format and "how options should be built" rules live in
  `skills/teach/SKILL.md`; if you find a better distractor-writing procedure,
  edit that file, it applies everywhere.
- The upstream repo ships without a license file. This fork inherits that
  status - treat it as reference material for your own learning setup, and
  credit the original if you redistribute the pedagogy.