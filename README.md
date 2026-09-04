# teacher_sab

A teaching system that works in **any** AI harness: opencode, Claude Code, pi, Codex,
Cursor, plain ChatGPT - whatever you use.

> **Fork of [amosblomqvist/learn](https://github.com/amosblomqvist/learn)**.
> The pedagogy - two teaching principles, the probe → plan → teach loop, the quiz
> construction rules, the visualization discipline - is entirely from that
> project ([the original video](https://www.youtube.com/watch?v=kzcI5F4tGiU)).
> This fork strips the pi-specific extension code so nothing here depends on a
> particular agent: no popups, no Obsidian md-log, no extension-backed makers.
> The teaching core is the transferable part; the original belongs to the author
> who got it right first. Upstream: https://github.com/amosblomqvist/learn

The pedagogic core is the same: two principles (unconditional truths first,
"how could I have discovered this?"), a probe -> plan -> teach loop, graded
quizzes with instant feedback, and correct-visual-only-when-it-earns-its-place
visualization.

## What's in here

- `LEARNER.md` - the "owner" profile. **This is the file you change.**
- `LEARNER.template.md` - a blank copy for handing the system to someone else.
- `skills/teach/SKILL.md` - the teaching philosophy and process.
- `skills/visualize/SKILL.md` - when/how to add a visual to a lesson.
- `agents/` - portable briefs the teacher can dispatch: researcher,
  mermaid-maker, svg-maker.

There is no harness-specific code. Everything below is convention over
extension: quizzes run in chat (the teacher asks, you reply with a number), the
researcher is any web-search tool your harness has, visuals degrade gracefully
to an ASCII/Mermaid code block if no renderer exists.

## Install

Drop the files wherever your harness reads them, then tell the agent to load
the `teach` skill (or `/teach` where skills are commands).

- **Skills-capable harnesses** (opencode, Claude Code): copy the `skills/`
  folder into your project's skills directory. Agent files (Claude Code:
  `.claude/agents/`, opencode: `.opencode/agent/`) give the teacher real
  subagents for research and diagrams.
- **Plain chat harnesses** (ChatGPT, etc.): paste `skills/teach/SKILL.md`
  into the session, or keep it in a file and tell the model "You are a teacher.
  Read skills/teach/SKILL.md and follow it."

Minimum viable setup is just the teach skill + LEARNER.md. Everything else is
optional polish.

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

## Notes

- Accuracy is non-negotiable in this system. When in doubt, the teacher pauses
  and verifies before teaching.
- The quiz format and "how options should be built" rules are part of
  `skills/teach/SKILL.md`; if you find a better distractor-writing procedure,
  edit that file, it applies everywhere.