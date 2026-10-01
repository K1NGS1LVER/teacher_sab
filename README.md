# teacher-sab

### A portable AI teacher that helps knowledge stick.

`teacher-sab` brings a structured teaching loop to any AI harness: probe what
you know, build a dependency-aware lesson, check understanding as you go, and
keep the memory of every session in plain Markdown.

<p>
  <a href="https://www.npmjs.com/package/teacher-sab"><img src="https://img.shields.io/npm/v/teacher-sab?color=CB3837&logo=npm&logoColor=white" alt="npm version"></a>
  <a href="https://github.com/K1NGS1LVER/teacher_sab/blob/main/LICENSE"><img src="https://img.shields.io/github/license/K1NGS1LVER/teacher_sab?color=2ea44f" alt="MIT license"></a>
  <a href="https://github.com/K1NGS1LVER/teacher_sab"><img src="https://img.shields.io/github/stars/K1NGS1LVER/teacher_sab?style=flat&logo=github" alt="GitHub stars"></a>
  <a href="https://www.npmjs.com/package/teacher-sab"><img src="https://img.shields.io/npm/dm/teacher-sab?color=CB3837&logo=npm&logoColor=white" alt="npm weekly downloads"></a>
</p>

> A fork of [amosblomqvist/learn](https://github.com/amosblomqvist/learn).
> The teaching philosophy comes from the original project; this fork makes the
> system portable across modern AI tools and keeps its session memory in files.

## Why this exists

Most AI explanations optimize for getting an answer out. This system optimizes
for building a connected mental model:

- **Unconditional truths first** — establish the safe foundations before
  building on top of them.
- **Discoverable reasoning** — show how each idea follows from the previous one
  instead of presenting arbitrary facts.
- **Retrieval over recognition** — probe first, quiz during the lesson, and use
  free recall to strengthen what was learned.
- **Decodable quizzes** — every quiz check has one explicit target, a
  self-contained requested output, and parallel options; malformed or
  ambiguous items are regenerated before they reach the learner.
- **Continuity across sessions** — save the plan, transcript, learned graph,
  misses, and review queue so the next session can pick up where you stopped.

## Quick start

Install into the current project:

```bash
npx teacher-sab -a universal -d . -y
```

Quiz checks are plain chat, but they are not improvised: the teach skill
requires one answerable target per item, splits compound questions, and checks
that no option repeats the question or contains its explanation. If a generated
item fails that gate, the teacher regenerates it before displaying it.

Then start your AI harness in that directory and say:

> Use the `teach` skill. Read `LEARNER.md` first. Teach me Docker.

The installer adds the skill, creates a learner profile template, and prepares
`study-artifacts/` for session memory. Edit `LEARNER.md` once so the teacher
knows your background, pace, preferences, and constraints.

<details>
<summary><strong>Interactive installation</strong></summary>

```bash
npx teacher-sab
```

Choose one or more harnesses, the target directory, and copy or symlink mode.
Use `-y` for a non-interactive install; it defaults to all harnesses.

</details>

## How a session works

```text
LEARNER.md
    │
    ▼
warm-up ──► probe ──► approve plan ──► teach one node at a time
    ▲                                      │
    └──── review queue ◄── close ◄── quiz / free recall
```

Every lesson follows the same shape:

1. Read the learner profile and any existing study artifacts.
2. Run a short retrieval warm-up from the review queue.
3. Probe the learner's current understanding.
4. Research and propose a dependency-aware plan.
5. Teach one node at a time, motivating each step and checking it immediately.
6. Close with free recall, misses, and dated reviews.

For a large domain such as Docker, course mode creates a hub and keeps its
numbered session artifacts together:

```text
study-artifacts/
├── index.md
├── docker.md
└── docker/
    ├── 01-foundations.md
    └── 02-images-and-containers.md
```

Atomic topics remain a single file such as
`study-artifacts/network-basics.md`. Course folders use exact normalized topic
slugs; existing artifacts are preserved rather than fuzzy-matched or migrated.
Multiple-choice logs stay compact: the artifact keeps the question and learner's
answer, not the numbered answer options.

## Works with your harness

| Harness | Project install |
| --- | --- |
| Universal standard | `.agents/skills/` |
| opencode | `.opencode/skills/` |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Kilo Code | `.kilo/skills/` |
| Cursor | `.cursor/rules/` |
| Antigravity | `.agents/skills/` |
| Hermes | `.hermes/skills/` |
| pi / pi code | `.pi/skills/` |
| oh-my-pi | `.omp/skills/` |
| aider | `.agents/skills/` |
| Cline | `.cline/skills/` |
| Plain chat | Paste the skill and learner profile |

The universal install is usually enough:

```bash
npx teacher-sab -a universal -d . -y
```

List all choices and flags:

```bash
npx teacher-sab --help
```

<details>
<summary><strong>Manual universal install</strong></summary>

```bash
mkdir -p .agents/skills
cp -r /path/to/teacher_sab/skills/teach .agents/skills/
cp -r /path/to/teacher_sab/skills/visualize .agents/skills/
cp /path/to/teacher_sab/LEARNER.template.md LEARNER.md
```

Restart your harness if it caches skills at startup.

</details>

## What gets installed

| Path | Purpose | Required |
| --- | --- | :---: |
| `skills/teach/SKILL.md` | Teaching philosophy, session loop, course mode, and logging rules | Yes |
| `LEARNER.md` | Your editable learner profile | Yes |
| `skills/visualize/SKILL.md` | Rules for useful Mermaid, SVG, or ASCII visuals | No |
| `agents/researcher.md` | Accuracy-checking subagent brief | No |
| `agents/mermaid-maker.md` | Mermaid diagram subagent brief | No |
| `agents/svg-maker.md` | Geometry diagram subagent brief | No |
| `study-artifacts/` | Session logs, graphs, review queues, and index | Generated |

## CLI reference

```text
Usage: npx teacher-sab [options]

-a, --agents <list>   Harness names or numbers, separated by spaces or commas
-d, --dir <path>      Installation target (default: current directory)
-l, --link            Symlink instead of copying package files
-y, --yes             Skip prompts; install all harnesses with defaults
-h, --help            Show help
-v, --version         Show version
```

Harness numbers:

`1 opencode` · `2 claude` · `3 codex` · `4 kilo` · `5 cursor` · `6 agy` ·
`7 hermes` · `8 pi` · `9 universal` · `10 chat` · `11 pi-code` ·
`12 oh-my-pi` · `13 aider` · `14 cline`

## Continue your studies

You do not need to remember the last topic:

> Use the teach skill. Continue my studies.

The teacher reads `study-artifacts/index.md`, checks due reviews and unfinished
courses, then proposes the next session instead of silently starting somewhere
new.

## Change the learner

Edit `LEARNER.md` to change the teaching experience:

- background and existing knowledge
- preferred pace and Socratic versus expository style
- subjects and practical constraints
- energy and session-length preferences

To hand the system to someone else:

```bash
cp LEARNER.md another-learner.md
cp LEARNER.template.md LEARNER.md
```

## Differences from upstream

This fork keeps the pedagogy and removes the pi-only extension dependency:

- quizzes run as plain numbered chat questions instead of TUI popups
- logs use portable Markdown instead of an Obsidian-specific md-log
- visuals degrade to Mermaid or ASCII when a renderer is unavailable
- installer and skill files work across multiple AI harnesses

For the original pi extensions, use the
[upstream project](https://github.com/amosblomqvist/learn).

## Contributing

The core teaching rules live in
[`skills/teach/SKILL.md`](skills/teach/SKILL.md). Changes to the quiz contract,
logging format, or pedagogy should be documented there first so every harness
gets the same behavior.

## License and attribution

This fork is released under the [MIT License](LICENSE). The teaching pedagogy
is credited to [amosblomqvist/learn](https://github.com/amosblomqvist/learn).
