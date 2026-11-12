# Evidence for node-by-node explanation formatting

## Summary

For `teacher-sab`'s node-by-node mode, use a stable, meaningful boundary around each node: a descriptive heading, a short purpose/connection cue, coherent explanation, and a user-paced applied check. This recommendation is well supported for segmentation, headings/organizational signaling, selective cueing, and removal of irrelevant detail. The evidence is much weaker for any exact whitespace amount, font choice, line length, or decorative “card” treatment; those should remain restrained implementation choices, not claims about learning gains.

The strongest relevant research is mostly on expository text and multimedia explanations rather than conversational Markdown. Transfer to chat is therefore an evidence-informed inference. The active check and feedback remain more important than surface formatting: recent synthesis of Mayer's work finds larger and more consistent effects for active learner involvement than for layout changes.[^1]

## Findings

1. **Meaningful chunking/segmentation has the clearest direct case for node boundaries.** A meta-analysis of 56 investigations and 88 comparisons found a significant segmenting effect with small-to-medium benefits for retention and transfer, lower cognitive load, and more learning time; the effect was present for system-paced as well as learner-paced segmentation.[^2] In a primary experiment, allowing learners to control the pace of 16 segments improved transfer relative to continuous presentation, though not retention.[^3] This supports one coherent idea or causal move per node, followed by a pause/check before the next dependent node. It does not support arbitrary shortness: segments should be meaningful and coherent, not merely equal-sized.

2. **Headings and outlines help readers build and retrieve topic structure.** Across nine experiments, headings aided recall, search, and retrieval; marginal versus embedded placement did not matter in that study.[^4] Three experiments found that outlines and headings each facilitated recall, with the combination producing the highest overall recall; outlines also improved reordering of statements from the text.[^5] A later experiment found that heading-related information was recalled better when it was close to the heading, while unrelated or distant information was disadvantaged; the benefit was strongest for main-topic recall rather than subordinate detail.[^6] For this project, a node heading should name the concept and its role in the dependency graph, and the explanation immediately following it should stay on that topic.

3. **Signaling works when it points to structure or critical content, not when everything is emphasized.** A meta-analysis of 103 studies and 12,201 participants found positive effects of signaling on retention (`g+ = 0.53`) and transfer (`g+ = 0.33`), with reduced cognitive load; included signals covered organizational cues, typographic emphasis, and visual cues.[^7] The boundary condition matters: a cue should identify the essential relationship or transition. Use one or two consistent signals per node—such as the heading, a `Why this matters` label, a bold target term, or an explicit `Connect` sentence—and avoid bolding whole paragraphs or using several competing visual codes. Current CAST guidance likewise recommends highlighting key elements, relationships, and previously learned skills with explicit cues.[^8]

4. **Coherence is a stronger claim than “make it pretty.”** In four experiments, adding concurrent on-screen text that summarized or duplicated narration reduced retention and transfer, and adding interesting but irrelevant material also reduced understanding.[^9] A meta-analysis of the seductive-details literature concluded that interesting but irrelevant additions hinder learning, with effects moderated by design and learner-pacing conditions.[^10] Therefore, every example, analogy, diagram, aside, and typographic flourish in a node should earn its place by supporting the target idea or its connection. Do not repeat the same explanation in prose, a callout, and a caption unless the modes serve different necessary functions.

5. **Whitespace and typographic boundaries are plausible supports, but exact recipes are not robustly established.** Primary reading studies show that formatting can affect processing: phrase-sensitive spacing improved comprehension for average readers in one experiment,[^11] and increased interline spacing improved reading speed and word/letter identification in another, while increased interletter spacing slowed reading.[^12] A textbook study also reported better learning and memory with combined typographic and spatial cues, but it was a single older experiment with 96 undergraduates.[^13] These results justify using blank lines, indentation, and consistent heading levels as low-cost visual boundaries. They do **not** justify a universal pixel/rem/font rule, a fixed number of bullets, or the claim that more whitespace always improves learning. In this repository, whitespace should clarify semantic boundaries, not inflate every response.

6. **First-party instructional-design guidance agrees with the evidence, but should be treated as implementation guidance rather than causal proof.** Cornell's Center for Teaching Innovation recommends descriptive titles and breaking text into small sections with clear headings.[^14] Carnegie Mellon's Eberly Center recommends preset heading styles, consistent type, and controlled bold/italic emphasis to establish hierarchy; its lecture guidance recommends outlines, signposts, transitions, and periodic summaries to help novices organize information.[^15] CAST's current UDL Guidelines 3.0 explicitly include connecting prior knowledge and highlighting patterns, critical features, big ideas, and relationships.[^8] These recommendations align with the empirical findings, but they do not establish exact visual specifications for a chat interface.

## Evidence-to-design decision

| Design choice for a node | Evidence status | Recommendation |
| --- | --- | --- |
| One meaningful explanatory unit before the next dependent unit | Robust/medium: segmentation meta-analysis and primary pacing experiments | Keep one node as the unit of explanation; pause for the check before advancing. |
| Descriptive heading close to its explanation | Moderate: heading experiments, mostly recall/search outcomes | Use one stable heading per node; make it name the concept, not merely “Step 2.” |
| Selective emphasis and explicit relationship cues | Moderate-to-strong: signaling meta-analysis; CAST guidance | Bold only the target term or relationship; use `Why`, `Connect`, and `Check` labels consistently. |
| Remove irrelevant detail and redundant restatement | Moderate-to-strong: primary coherence experiments and meta-analysis | Keep examples functional; delete decorative asides and duplicate explanations. |
| Exact whitespace, font, line length, number of bullets, cards, borders, or colors | Low/uncertain for this use case | Choose accessible, consistent Markdown defaults; do not present these as evidence-based learning requirements. |

## Concrete recommendation for `teacher-sab`

Retain the existing node loop and give each node this visual/semantic frame:

```markdown
### Node N — <descriptive concept>

**Why now:** <the problem this node solves or the gap it closes>

<Core explanation: one coherent move, using bullets only for genuinely parallel points.>

**Connect:** This follows from <established node> and enables <next node>.

**Check:** <a new-surface, applied question; wait for the learner>
```

Use a blank line between these blocks and a consistent heading hierarchy. Keep the heading and its explanation physically adjacent. Use bold sparingly as a signal, not as decoration; reserve stronger separators for major phase changes rather than every node. If a visual or code example is necessary, place its label immediately beside or before the relevant element and remove prose that merely repeats it. The practical success criterion is not visual polish: the learner should be able to say what this node added, how it follows from the prior node, and use it in the check without searching through a dense wall of text.

## Sources

### Primary research and systematic reviews

- [^1]: Cromley, J. G., & Chen, R. (2025). *A meta-analysis of Richard Mayer's multimedia learning research: Searching for boundary conditions of design principles across multiple media types*. **Educational Research Review, 49**, 100730. DOI: [10.1016/j.edurev.2025.100730](https://doi.org/10.1016/j.edurev.2025.100730). Meta-analysis of 92 articles, 181 studies, and 591 effects; reports boundary conditions and stronger effects for active involvement than surface layout changes.
- [^2]: Rey, G. D., Beege, M., Nebel, S., Wirzberger, M., Schmitt, T. H., & Schneider, S. (2019). *A Meta-analysis of the Segmenting Effect*. **Educational Psychology Review, 31**, 389–419. DOI: [10.1007/s10648-018-9456-4](https://doi.org/10.1007/s10648-018-9456-4).
- [^3]: Mayer, R. E., & Chandler, P. (2001). *When Learning Is Just a Click Away: Does Simple User Interaction Foster Deeper Understanding of Multimedia Messages?* **Journal of Educational Psychology, 93**(2), 390–397. DOI: [10.1037/0022-0663.93.2.390](https://doi.org/10.1037/0022-0663.93.2.390). [Open article copy](https://tecfa.unige.ch/tecfa/teaching/methodo/Mayer_Chandler01.pdf).
- [^4]: Hartley, J., & Trueman, M. (1983). *The effects of headings in text on recall, search and retrieval*. **British Journal of Educational Psychology, 53**(2), 205–214. DOI: [10.1111/j.2044-8279.1983.tb02551.x](https://doi.org/10.1111/j.2044-8279.1983.tb02551.x).
- [^5]: Lorch, R. F., Jr. (1989). *The effect of outlines and headings on readers' recall of text*. **Contemporary Educational Psychology, 14**(2), 111–123. DOI: [10.1016/0361-476X(89)90029-5](https://doi.org/10.1016/0361-476X(89)90029-5).
- [^6]: Yeari, M., Oudega, M., & van den Broek, P. (2008). *How the relationship between text and headings influences readers' memory*. **Contemporary Educational Psychology, 33**(4), 859–874. DOI: [10.1016/j.cedpsych.2007.11.001](https://doi.org/10.1016/j.cedpsych.2007.11.001).
- [^7]: Schneider, S., Beege, M., Nebel, S., & Rey, G. D. (2018). *A meta-analysis of how signaling affects learning with media*. **Educational Research Review, 23**, 1–24. DOI: [10.1016/j.edurev.2017.11.001](https://doi.org/10.1016/j.edurev.2017.11.001).
- [^9]: Mayer, R. E., Heiser, J., & Lonn, S. (2001). *Cognitive constraints on multimedia learning: When presenting more material results in less understanding*. **Journal of Educational Psychology, 93**(1), 187–198. DOI: [10.1037/0022-0663.93.1.187](https://doi.org/10.1037/0022-0663.93.1.187). [Open article copy](https://www.csus.edu/cpns/epperson/_internal/_documents/courses/hist107/Mayer_Heiser_Lonn_2001.pdf).
- [^10]: Sundararajan, N., & Adesope, O. (2020). *Keep It Coherent: A Meta-Analysis of the Seductive Details Effect*. **Educational Psychology Review, 32**, 707–734. DOI: [10.1007/s10648-020-09522-4](https://doi.org/10.1007/s10648-020-09522-4).
- [^11]: Jandreau, S., & Bever, T. (1992). *Phrase-spaced formats improve comprehension in average readers*. **Journal of Applied Psychology, 77**(2), 143–146. DOI: [10.1037/0021-9010.77.2.143](https://doi.org/10.1037/0021-9010.77.2.143). [PubMed record](https://pubmed.ncbi.nlm.nih.gov/1592757/).
- [^12]: Van Overschelde, J. P., & Healy, A. F. (2005). *A Blank Look in Reading: The Effect of Blank Space on the Identification of Letters and Words During Reading*. **Experimental Psychology, 52**(3), 213–223. DOI: [10.1027/1618-3169.52.3.213](https://doi.org/10.1027/1618-3169.52.3.213).
- [^13]: Shebilske, W. L., & Rotondo, J. A. (1981). *Typographical and Spatial Cues that Facilitate Learning from Textbooks*. **Visible Language, 15**(1), 41–54. [Journal record](https://journals.uc.edu/index.php/vl/article/view/5313).

### First-party instructional-design guidance

- [^8]: CAST. *CAST Universal Design for Learning Guidelines 3.0*. Official guidance: [udlguidelines.cast.org](https://udlguidelines.cast.org/). Relevant checkpoints include connecting prior knowledge and highlighting patterns, critical features, big ideas, and relationships.
- [^14]: Cornell University Center for Teaching Innovation. *Best practices for creating engaging online content*. [Official guidance](https://teaching.cornell.edu/teaching-resources/online-teaching/best-practices-creating-engaging-online-content).
- [^15]: Carnegie Mellon University Eberly Center. *Create Accessible Content* and *Lectures*. [Hierarchy guidance](https://www.cmu.edu/teaching/designteach/teach/classroomclimate/createaccessiblecontent.html); [structuring/signposting guidance](https://www.cmu.edu/teaching/designteach/design/instructionalstrategies/lectures.html).

## Gaps and cautions

- Most segmentation, signaling, and coherence meta-analyses concern multimedia or prepared expository materials, not an adaptive AI conversation rendered as Markdown.
- Heading studies often measure recall, search, or topic organization; they do not prove that a particular heading style improves far transfer or long-term retention.
- The literature does not establish exact Markdown rules such as “three bullets,” “one screen per node,” a specific line-height, or a required separator. Treat those as usability hypotheses to test with learners, not settled learning science.
- Formatting cannot compensate for a wrong dependency graph, unverified explanation, absent retrieval, or feedback that lets the learner advance on an unconfirmed foundation.
