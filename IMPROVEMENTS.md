# teacher-sab — what this fork adds over the original

`teacher-sab` is a fork of **[amosblomqvist/learn](https://github.com/amosblomqvist/learn)**.
The teaching pedagogy — the two principles, the probe → plan → teach loop, the
quiz-construction rules, the visualization discipline — is entirely the original
owner's, and the credit for it belongs to them
([the original video](https://www.youtube.com/watch?v=kzcI5F4tGiU)).

What is *this* fork's work is everything below: making that pedagogy run
anywhere and keeping the memory of your sessions between AI tools.

## What this fork adds

| # | Change | Why it matters |
|---|--------|----------------|
| 1 | **Harness-agnostic installer** — `npx teacher-sab` (or `setup.sh`) installs into 10 harnesses (opencode, Claude Code, Codex, Kilo, Cursor, Antigravity, Hermes, pi, universal `.agents/skills`, plain chat) with copy-or-symlink and an interactive picker | The original ran on pi only and needed its extension code; this runs in whatever agent you actually use |
| 2 | **Auto session logs with dual knowledge graphs** — every session writes `study-artifacts/<topic>.md`: a *planned* knowledge graph at the start, a *learned* graph at the end (dashed edges mark what didn't land), plus a live Q&A transcript | You can see on file what was taught vs. what actually stuck — the honest record of a lesson |
| 3 | **Spaced retrieval across sessions** — the Session Link Ritual opens each session with a warm-up drawn from a dated review queue (1/3/7/14-day ladder) and closes with an interleaved consolidation | Knowledge survives the gap between sessions instead of decaying — the single best-evidenced memory technique |
| 4 | **Course mode for whole domains** — a request like "teach me monarchs" decomposes into a dependency-ordered set of subtopics with a hub file, a progress checklist, and a learned course graph | One atomic session can't hold a whole domain; now it doesn't have to |
| 5 | **"Continue my studies" resume flow** — say continue with no topic name and the teacher reads the logs + review queues and proposes today's session; a `study-artifacts/index.md` auto-index tracks every thread | Pick up mid-stream on any harness, from the files, not from chat memory |
| 6 | **Evidence-based retrieval upgrades** — confidence grading on quiz misses (1-3), free-recall checks ("explain X in your own words") instead of recognition-only quizzes, self-explaining a wrong pick before it's corrected, and a brain-dump close over a recognition round | Free recall beats multiple choice, errors with self-explanation beat errors with answers — these are the strength increases |
| 7 | **Learner profile that installs with the system** — every install gets a `LEARNER.md` template; editing that one file re-teaches the system to a different person | Portability of the "teach one person, forever" loop |
| 8 | **Portable subagent briefs** — `agents/researcher.md`, `agents/mermaid-maker.md`, `agents/svg-maker.md` map onto whatever subagent system your harness has | Accuracy checking and diagram making work without pi's specific plugins |

## What this fork deliberately does NOT do (vs. the original)

- **No pi extension popups** — quizzes run as plain numbered options in chat, same grading contract.
- **No guaranteed pixel-rendered diagrams** — visuals degrade to Mermaid/ASCII where the harness has no renderer.
- **No Obsidian md-log** — logging goes to `study-artifacts/` instead (see #2).

If you want the pi-only popups and Obsidian notes back, run the
[upstream repo](https://github.com/amosblomqvist/learn) directly.