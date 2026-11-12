# Separating teaching nodes in explanation mode

## Question

What does learning research support for separating consecutive conceptual nodes in a text-based, node-by-node lesson?

## Findings

### 1. Make the knowledge structure visible with headings

Headings are a structural signal, not merely decoration. Experiments found that headings improve memory for topics and their organization, apparently by changing how readers encode and retrieve the text. A later experiment also found that headings improved comprehension and reduced cognitive load, although effects on raw memory were not consistently significant.

Sources:

- Sanchez, Lorch & Lorch (2001), *Effects of Headings on Text Processing Strategies*, DOI: https://doi.org/10.1006/ceps.2000.1056
- Hartley & Trueman (1983), *The Effects of Headings in Text on Recall, Search and Retrieval*, DOI: https://doi.org/10.1111/j.2044-8279.1983.tb02551.x
- Wiesner et al. (2022), *Caption it! The impact of headings on learning from texts*, DOI: https://doi.org/10.1002/acp.4076

Implication: `Node A — Foundations` is more useful than an unlabeled horizontal rule. The label tells the learner what kind of unit follows and helps them reconstruct the lesson later.

### 2. Use signaling to show what matters and how parts relate

Instructional-design research calls cues such as headings, outlines, pointer words, emphasis, and explicit relationship labels “signaling.” A review of Mayer’s research describes positive effects from highlighting essential material and identifying the main steps of a process. The useful signal is the one that reveals the lesson’s organization; arbitrary decoration is not the target.

Source:

- Mayer (1999), *Research-based principles for the design of instructional messages*, DOI: https://doi.org/10.1075/dd.1.1.02may
- Mayer & Fiorella’s research summary in *Applying the science of learning to medical education* (2010), including the signaling and segmenting table: https://doi.org/10.1111/j.1365-2923.2010.03624.x

Implication: use a short “Builds on” or “Why this matters” line at the start of each node, and a “Connection” line before the check. This is more pedagogically meaningful than repeated dashes.

### 3. Break a continuous lesson into manageable segments

The segmenting principle says that learners generally do better when a complex, fast-paced explanation is broken into learner-paced segments rather than delivered as one continuous unit. Mayer’s summary reports positive transfer effects in the original tests, while a newer meta-analysis reports a smaller average effect and substantial boundary conditions. So segmentation is well-supported, but there is no universal optimal segment length.

Sources:

- Mayer, *Multimedia Learning*, chapter summary for the Segmenting Principle: https://www.cambridge.org/core/books/multimedia-learning/7A62F072A71289E1E262980CB026A3F9/listing
- Rey et al. (2019) and later synthesis discussed in the 2025 meta-analysis: https://doi.org/10.1016/j.edurev.2025.100730

Implication: keep the existing “teach one node, then check it” rhythm. Do not present the complete explanations for A, B, and C as a single uninterrupted block before inviting retrieval.

### 4. Whitespace helps legibility, but evidence is stronger for structure than for a particular divider glyph

The sources above support headings, cues, and meaningful segmentation. They do not establish that repeated em dashes, horizontal rules, boxes, or other decorative separators are themselves the cause of better learning. A separator can improve scanability, but its role should be subordinate to the semantic structure.

Implication: use generous paragraph spacing and a consistent heading hierarchy. Reserve a heavier divider for a real phase transition, such as `Explanation → Check` or `Node loop → Close`, rather than between every paragraph.

## Recommendation for teacher-sab

Use a structured-notebook pattern for every node:

```text
## Node A — Foundations

Why this matters: <one or two sentences>

### Core idea
<explanation, using short paragraphs or bullets>

### Example
<one concrete example or analogy>

### Connection
This follows from <previous node> because <explicit relationship>.

### Check
<applied quiz or free-recall prompt>
```

For the chat renderer, the minimum effective version is:

1. A real node heading with both the ID and expanded name.
2. One blank line before and after each section.
3. A visible but quiet label for `Why this matters`, `Core idea`, `Example`, `Connection`, and `Check`.
4. A single horizontal rule only between major phases, if needed.

This gives the learner both navigational structure and retrieval boundaries without making the response look like a stack of decorative cards. It also matches the existing teaching rule that every node has a motivate → establish → connect → quiz-check loop.

## Confidence and limits

High confidence: headings and meaningful structural cues improve organization, search, and/or comprehension in educational text; learner-paced segmentation is useful especially for complex material and less-experienced learners.

Moderate confidence: whitespace and subtle visual grouping improve scanability in this chat context. They are sensible implementation choices, but the cited studies do not isolate “blank line versus dash” as the causal variable.

Avoid claiming that any one separator is “proven.” The evidence supports a semantic structure that makes the lesson’s dependency graph and phase changes easy to see.
