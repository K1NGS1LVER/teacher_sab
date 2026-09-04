---
name: visualize
description: "Add a correct, minimal visual to a lesson - a diagram or geometric picture - when an idea is genuinely clearer as a picture: a dependency graph, system/flow, sequence, state machine, tree, comparison, or a spatial/geometric thing (coordinate geometry, number line, vectors, a plot, a physical layout). Degrades gracefully across harnesses: renders to an image where the harness can, otherwise a Mermaid/ASCII block the learner renders in their own viewer. Never decorative, always verified correct."
---

# Visualize

A picture earns its place only when it shows something words can't - shape,
structure, direction, relationship, geometry. This skill produces ONE such
picture, and it must be **correct**: a wrong edge or a wrong coordinate is worse
than no picture. Prefer no visual over a false one.

You are the **creative director**. You decide the exact idea and distill it to
its fewest carrying elements, then you (or a maker subagent, if your harness has
one) author it, and you verify it before it reaches the learner.

## When to visualize (and when not to)

This teaching system builds a **dependency graph in the learner's head** -
axioms at the root, derived facts hanging off them. A visual is powerful exactly
when it makes that structure (or a geometry) visible. Reach for one when:

- The idea is a **structure or relationship**: dependencies, a system with parts
  and arrows, a flow/pipeline, a sequence of exchanges, a state machine, a
  tree/hierarchy, a comparison, a containment (what's inside vs outside).
- The idea is **spatial or geometric**: coordinate geometry, a number line,
  vectors, a function's shape, a physical arrangement.

Do NOT visualize when prose or a single equation already carries it. A
decorative diagram that just restates the sentence next to it adds noise and a
chance to be wrong. When in doubt, don't - a missing visual is cheaper than a
false one.

## Choose the medium

- **Mermaid** - structural/relational visuals: dependency graphs, flowcharts,
  sequence/state/ER/class diagrams, trees, mindmaps, timelines. This is the
  default and fits the dependency-graph pedagogy directly.
- **Hand-written SVG** - spatial/geometric visuals Mermaid can't lay out: exact
  coordinates, geometry figures, number lines, vectors, plots, custom shapes.

Rule of thumb: if it's *nodes-and-edges / relationships*, use Mermaid. If it's
*positions-and-shapes / geometry*, use SVG (or an ASCII sketch where the harness
and viewer can't do SVG).

## How to author it, per capability

1. **Harness has a diagram maker subagent or render tool** (e.g.
   `agents/mermaid-maker.md`, `agents/svg-maker.md`, a render-extension): brief
   it with the concrete elements (below), have it render, **look at the result,
   and verify it is true before publishing**. Never publish a picture you have
   not verified.
2. **No maker, but the harness can write files and the learner's viewer renders
   images/Mermaid**: author the source yourself (a ```mermaid``` block, or an
   `.svg` written to a file the viewer can open), and if you cannot see the
   render yourself, say so and re-derive the layout carefully by hand instead of
   claiming it renders.
3. **No renderer at all** (plain chat): put a ```mermaid``` (or small ASCII)
   block straight into the reply. Most Markdown viewers render Mermaid; ASCII is
   the last-resort that always renders. Keep both tiny and correct.

In every case the same rule holds: **verify the picture says what you mean
before the learner sees it** - correct arrow directions, correct labels, correct
geometry. If you can't verify it, don't include it.

## Brief it well: one idea, fewest elements

The most common failure is **cramming** - every extra label makes the picture
harder to read AND harder to lay out correctly. Before authoring, prune to the
fewest elements that carry the idea, and for each ask: *"if I delete this, is
the idea still clear?"* If yes, delete it.

Give the concrete elements you want - not a vague topic, not a long checklist.

- BAD: "make a diagram about how TCP works"
- GOOD: "graph TD: a node 'packet' at the top; arrows down to 'ordering' and
  'retransmit on loss'; both arrows down into 'reliable stream'. No title. Show
  that reliability is built FROM packets, not alongside them."

Keep the idea intact. If your brief lists more than ~5-7 elements, cut it first.

## Embed it in the lesson

- **Image file** (harness wrote a PNG/SVG): embed with a relative path or the
  viewer's link syntax, e.g. `![](viz/<filename>)` or an Obsidian wikilink
  `![[filename|500]]` where the learner uses Obsidian.
- **Mermaid block**: a fenced ```mermaid``` block with the diagram source.
- **ASCII**: a `<pre>` block or fenced code block.

Introduce the visual in a sentence, then let it carry the idea - don't narrate
every element back in prose.

## Why correctness matters here

- A diagram that "renders fine but says something false" reaches the learner
  looking authoritative - worse than prose, because pictures are trusted.
- When your harness allows looking at the rendered result (it renders an image
  back to you), always do that, and iterate until it is both correct and clean.
- Small corrections are cheaper than regrowing trust after one wrong diagram.

> The original system ran on pi with extension-backed makers that rendered
> Mermaid/SVG to PNG and verified by looking. This port keeps the same
> editorial discipline but adapts the authoring to whatever the harness can do.