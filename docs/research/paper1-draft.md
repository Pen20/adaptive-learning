# Paper 1 — Manuscript Draft

**Version:** 0.4 — 27 July 2026
**Status:** §1, §2, §5, §6, §7, §8 drafted. **Pending: §3 (theoretical framework), §4 (methodology), §9 (conclusion).**
**Data:** [`donnees-enquetes.md`](donnees-enquetes.md) — every figure below traces to that annex.
**Conventions:** British spelling; past tense for findings; no causal language anywhere in the findings sections.
**References:** working list at the end, with verification status marked per entry. Several author lists are unverified — see that section before submitting.

> **Drafting notes are marked `[NOTE: …]` and must be resolved or removed before submission.**

---

## 1. Introduction

### 1.1 Automated assessment in university mathematics

Mathematics departments assess at a scale that makes hand-marking impossible. Enrolments in service courses run to hundreds; the lecturers in our study taught cohorts of 40–150, 150–300, and in one case more than 300 students. Automated assessment is not a convenience in this setting but a precondition for giving students any feedback at all.

Within mathematics, STACK has become the de facto standard for this task (Sangwin, 2013). Its design reflects a genuine understanding of the discipline. Rather than matching strings, it establishes mathematical equivalence through a computer algebra kernel, so that a student who writes a correct answer in an unexpected but equivalent form is credited. Its parametric question authoring generates structurally identical problems over randomised values, supporting practice and deterring copying. Its potential response trees allow authors to anticipate specific wrong answers and attach targeted responses to them. These are substantial achievements, and nothing in this paper should be read as disputing them.

### 1.2 The problem

The limitation lies elsewhere. Symbolic equivalence adjudicates the *answer*, and a potential response tree responds to answers its author foresaw. Neither has access to the account a student gives of their own reasoning. Three consequences follow, and all three surfaced in our field data before we had any theory to organise them.

First, the assessment is blind to process. A student who reaches a correct determinant by a fluke of arithmetic and one who reaches it by cofactor expansion are indistinguishable to the system. So are two students who reach the same wrong answer for entirely different reasons.

Second, marking tends toward the binary, so partial understanding earns nothing. Students in our study asked, in as many words, that the system "mark the steps not final answer".

Third, and most consequentially, an incorrect verdict arrives without an explanation the student can use. Where a potential response tree anticipated the error, the response is apt; where it did not, the student learns only that they were wrong. One student in our pre-deployment survey put the resulting frustration precisely: "Just because I wrote x+y and stack says y+x doesn't mean am wrong." Another, having reproduced a worked example from lecture notes and been marked incorrect, drew the conclusion that follows: "That means even my lecturers are wrong."

That second remark is worth dwelling on. A marking system that cannot explain itself does not merely fail to teach; it can corrode a student's trust in the mathematics they have been taught. Our survey data quantifies how widespread this is. Students rated their confidence in using STACK at 5.54 on a seven-point scale and the helpfulness of its feedback at 5.56 — yet the lowest-rated item in the entire instrument, at 4.59, asked whether they understood *why* an answer had been marked incorrect. Students accept the system's verdicts without being able to interpret them.

### 1.3 The research gap

Two bodies of work address parts of this problem, and neither joins them.

Work on computer-aided assessment has developed the symbolic machinery to great sophistication but remains, by design, within the paradigm of adjudicating answers (Sangwin, 2013). Work on large language models in mathematics education, which has grown rapidly since 2023, produces explanatory feedback fluently but characteristically lacks two things: a deterministic check on its mathematical claims, and a didactic framework specifying what the model should be looking for. The first omission is not hypothetical — Gupta et al. (2025) found that only 56.6% of LLM tutoring dialogues were entirely correct even while 90% were judged to offer high-quality instructional support. The second is structural: a model asked to "give helpful feedback" optimises for something no theory of mathematical learning defines.

Combining the two is not a matter of connecting a language model to an assessment platform. It requires deciding which component holds authority over what: which claims are settled deterministically, which are generated, which are validated, and by what standard. That architectural question — and the question of what didactic theory should constrain the generative component — has not, to our knowledge, been addressed together with an empirical account of what the users of such a system actually need. Nor has it been addressed from a resource-constrained setting, though such settings impose the sharpest constraints: in our cohort, 63% of students reached the platform on a smartphone alone.

### 1.4 Research questions and contributions

We report a design-based study conducted with lecturers and students at a Kenyan public university, addressing three questions:

- **RQ1.** What needs do lecturers and students who use STACK express in relation to AI-assisted assessment?
- **RQ2.** What architecture connects CAS verification, AI diagnosis and didactic theory into a coherent adaptive assessment ecosystem?
- **RQ3.** How do stakeholders perceive the resulting tools in use?

The contributions are correspondingly four:

**C1.** An empirical mapping from field-identified gaps to design requirements, derived from interviews with all seven mathematics lecturers then teaching with STACK at the study site, surveys of 11 lecturers and 100 students, and grounded in a context under-represented in this literature.

**C2.** A layered grading architecture in which a computer algebra system holds authority over correctness, a language model interprets reasoning, a didactic layer situates that interpretation within Chevallard's praxeological framework (see §3) [NOTE: primary Chevallard citation still unresolved — see references], and a second language model validates alignment. The allocation of authority between layers, rather than any single layer, is the contribution.

**C3.** An integrated two-sided ecosystem in which the diagnostic record produced for a student's feedback is the same record that populates the lecturer's analytics.

**C4.** Five design principles (DP1–DP5) abstracted from C1 and realised in C2–C3, stated so as to be transferable to other computer-aided assessment settings.

We are explicit about what this paper does not establish. It reports perceptions of feasibility and usefulness, not learning outcomes. No performance measure was collected during the deployment, no control condition existed, and no causal claim is made anywhere in what follows. The efficacy question is the subject of a separate randomised study, and §8.4 states precisely why the present design cannot answer it.

The paper proceeds by reviewing related work (§2) and the theoretical framework (§3), describing the design-based methodology (§4), reporting the needs analysis (§5), the resulting system design (§6) and stakeholder perceptions (§7), before discussing implications and limitations (§8).

---

## 2. Background and Related Work

### 2.1 CAS-based assessment and STACK

STACK — the System for Teaching and Assessment using a Computer Algebra Kernel — is an open-source assessment system built on a computer algebra kernel, and is the reference implementation of computer-aided assessment in university mathematics (Sangwin, 2013). Two of its design decisions distinguish it from generic quiz engines. Answers are judged by establishing mathematical properties through the CAS rather than by string comparison, so equivalent forms are credited. And feedback is delivered through *potential response trees*: author-written decision structures that test properties of a student's answer and attach outcomes and feedback to each branch (STACK Project, n.d.).

The potential response tree is the locus of both STACK's pedagogical strength and its practical limits. It permits an author who anticipates a specific misconception to respond to it precisely, and recent work has extended the mechanism to structured reasoning tasks including elements of proof. But its coverage is bounded by authorial foresight — a response the author did not anticipate falls through to a generic outcome — and the authoring burden is substantial. The generative-AI literature on STACK identifies this cost directly: problem generation requires algebraic scripting, dynamic randomisation and grading logic, which together impose a heavy workload on teachers ([STACK GenAI paper], 2026).

That paper is the closest existing work to ours and warrants precise positioning. It applies retrieval-augmented generation to produce STACK problems aligned to Depth of Knowledge levels, and — critically — validates every generated problem through multi-seed Maxima testing before release. The authors motivate that validation stage with an observation we corroborate: LLM-generated mathematical content exhibits surface-level plausibility while harbouring subtle symbolic errors detectable only by formal algebraic verification. The architectural principle is therefore shared. The scope is not: their pipeline generates and verifies *problems*, whereas the present work grades and diagnoses *student solutions*. Generation is verified against a specification the system itself supplies; diagnosis must interpret work the system has never seen.

### 2.2 LLMs and feedback in mathematics education

Interest in language models as sources of mathematical feedback has grown quickly since 2023, and the evidence is genuinely double-edged.

The most directly relevant evaluation for our purposes is Gupta et al. (2025), who assessed several GPT models both as problem solvers and as interactive tutors in college algebra. The dissociation they report is the empirical premise of our architecture: the models produced correct final answers for 85.5% of problems, and human evaluators judged 90% of tutoring dialogues to offer high-quality instructional support — yet only 56.6% of those dialogues were *entirely correct*. Their conclusion is that LLMs are not yet suitable as mathematics tutors without human oversight or additional mechanisms ensuring correctness.

Two features of that result shape our design. First, high final-answer accuracy does not transfer to correctness across an explanatory dialogue, so an architecture that trusts a model's fluency inherits a substantial error rate. Second, and more troubling for assessment, instructional quality as judged by humans and factual correctness came apart — feedback can read as excellent while being wrong. Feedback that is wrong but persuasive is worse than no feedback in an assessment context, because it carries the institution's authority.

The wider literature on mathematical hallucination supports the same conclusion, describing failure modes specific to this domain — incorrect computation, invalid algebraic transformation, unsound deduction — that propagate through derivation chains, and converging on external verification and neuro-symbolic grounding as mitigations rather than on better prompting alone.

**LLM-as-Judge.** Using a strong model to evaluate another model's output was established as a scalable proxy for human preference by Zheng et al. (2023), who reported GPT-4–human agreement of roughly 85%, exceeding the 81% agreement between human raters, while documenting position, verbosity and self-enhancement biases. The pattern has since been widely adopted, and subsequently scrutinised. Recent large-scale evaluations report intraclass correlations of 0.58–0.77 with a substantial share of score variance attributable to within-judge noise — reliability characterised as poor to moderate by psychometric standards — and catalogue a dozen distinct bias types ([LLM-judge reliability studies], 2026).

The implication for educational deployment is specific and, we think, underappreciated. A judge whose agreement with humans is high on average but noisy per item is adequate for ranking systems in aggregate and inadequate as the sole arbiter of an individual student's feedback. This motivates two decisions in §6: the judge is constrained by an independent deterministic verdict rather than trusted alone, and where it is used to select among candidates it is not permitted to rewrite them.

### 2.3 Error analysis frameworks

Diagnosing a mathematical error requires a scheme for what kinds of error exist. Newman's error analysis, developed from research into language factors in mathematics in the 1970s, decomposes word-problem solving into five stages — reading, comprehension, transformation, process skills, and encoding — and locates an error at the first stage that fails ([Newman, 1977]; see also recent applications). Its appeal for automated diagnosis is that the categories are few, ordered, and defined by observable features of student work rather than by inferred mental states, which makes them candidates for machine classification.

Its limits deserve equal statement. The framework was developed for word problems, whereas much university mathematics is presented symbolically; the reading and comprehension stages transfer least well. It also locates errors procedurally rather than conceptually: knowing that a student failed at transformation does not identify *which* misconception produced the failure. Alternative schemes — misconception taxonomies, SOLO — trade classification tractability against diagnostic depth in the opposite direction.

We note here, and document in §6.5, that the present implementation does not in fact classify into Newman's categories; it produces free-text error labels. The tension between the framework's suitability and what was built is real, and we treat it as a finding about the difficulty of operationalising didactic theory rather than as an implementation detail.

### 2.4 Learning analytics for mathematics teaching

Item-level psychometrics — difficulty indices, discrimination indices, distractor analysis — are long-established, and dashboards presenting them to teachers are now common (see the recent overview in *Education Sciences*, 2024). The reported obstacle is not availability but use: dashboard uptake among teachers varies substantially, and many find it difficult to draw conclusions from student data, with data literacy and pedagogical knowledge identified as prerequisites rather than by-products of dashboard provision.

Our field data reproduces this pattern in a sharper form. Two thirds of the lecturers we surveyed used no analytical tool at all, and the reason was overwhelmingly unawareness and lack of training rather than absence of need (§5.1). This aligns with documented conditions in the region, where ineffective assessment systems that fail to give teachers information they can act on are identified as a systemic constraint (World Bank, 2016), and where universities are reported to lack capacity for full e-assessment implementation.

Two gaps in this literature matter for our design. Dashboards report *how many* students erred on an item, not *why*, because the underlying data records correctness rather than diagnosis. And they are almost universally lecturer-facing artefacts built over a data stream generated for grading, rather than a shared diagnostic record serving both teaching and learning.

### 2.5 Synthesis: the unoccupied intersection

Table 3 positions the present work against the five strands above. [NOTE: Build Table 3 as columns — CAS grounding | LLM diagnosis of reasoning | didactic framework | lecturer analytics | adaptivity | field-derived requirements — with rows for STACK, the STACK GenAI generation work, LLM tutoring/feedback systems, learning analytics dashboards, and this work.]

Each strand supplies something the others lack. STACK contributes deterministic symbolic authority but assesses answers, not reasoning. LLM feedback systems interpret reasoning but, on the evidence of §2.2, cannot be trusted to adjudicate correctness unaided. Error analysis frameworks specify what a diagnosis should identify but are seldom implemented in running assessment systems. Analytics dashboards aggregate outcomes but not diagnoses. And the resource-constrained settings where assessment automation would matter most are largely absent from the design literature, despite being where the operating constraints — smartphone-only access, unreliable bandwidth, cohorts above 300, no institutional analytics capacity — most sharply discipline what a design can assume.

The contribution of this paper lies at that intersection: an architecture that allocates authority over correctness to a CAS, interpretation of reasoning to a language model, the structure of that interpretation to a didactic framework, and validation to an independent judge — designed from, and evaluated in, a setting that admits none of the usual infrastructural assumptions.

---

## 3. Theoretical Framework

### 3.1 The praxeological gap

The Anthropological Theory of the Didactic (ATD) analyses any mathematical activity as a *praxeology*: a four-part structure comprising a type of task (T), a technique (τ) for carrying out tasks of that type, a technology (θ) that explains and justifies the technique, and a theory (Θ) that in turn underwrites the technology (Chevallard; see references). The first two components form the *praxis* — what is done — and the second two the *logos* — the discourse that rationalises it.

The framework earns its place here because it names, with precision, what automated assessment does and does not capture. When a student submits a determinant, STACK adjudicates the *task*: the answer either is or is not equivalent to the expected value. The *technique* — cofactor expansion, row reduction, a memorised 2×2 rule misapplied to a 3×3 matrix — leaves no trace the system can read. The *technology* and *theory* that would justify the chosen technique are further out of reach still.

We call this the **praxeological gap**: automated assessment operates on the task, while learning and its difficulties reside in the technique and the logos that justifies it. The gap is not a defect of any particular implementation. It follows from the fact that a final answer is a projection of a praxeology onto a single value, and projections lose information. Two students submitting the same wrong answer may have executed different techniques justified by different — or absent — technologies; the answer alone cannot distinguish them, and neither can any system that reads only the answer.

The gap has a measurable signature, which §5.2 reports. Students in our study rated STACK's feedback helpful (5.56/7) while rating their understanding of *why* they were marked wrong markedly lower (4.59/7). The verdict arrives; the reasoning behind it does not. From an ATD standpoint that dissociation is exactly what one would predict of a system that assesses the task and is silent on the logos.

### 3.2 The Didactics–AI–CAS triangle

Our design proposition is that closing this gap requires three distinct sources of authority, each compensating for a weakness of the other two.

**The CAS supplies deterministic mathematical truth.** It settles equivalence and computes ground truth, and does so without the possibility of plausible error. It has nothing whatever to say about reasoning.

**The language model supplies interpretation.** It can read an informal, partially articulated account of a technique and name what the student appears to have done. It cannot be trusted to adjudicate correctness — §2.2 gives the figures — and left unconstrained it will optimise for feedback that reads well rather than feedback that diagnoses.

**Didactic theory supplies the constraint.** It specifies what the interpretation should be looking for. A model asked simply to be helpful has no defined target; a model asked to identify the technique a student used, and to relate it to the technology that justifies it, is answering a question with a didactic referent. The framework converts an open-ended generative task into a structured one.

The three are mutually corrective. The CAS bounds the model's claims about correctness; the model supplies what the CAS cannot express; the theory disciplines what the model produces. Neither pair suffices — CAS plus theory yields a verdict with no interpretation of student work, and model plus theory yields structured feedback that may be confidently wrong.

### 3.3 AI as didactic mediator

This yields our characterisation of the language model's role. It is not an assessor: the CAS assesses. It is not a tutor in the conversational sense. It is a **didactic mediator**, performing two translations.

Outward, it translates a symbolic verdict into an explanation a student can act on — from "not equivalent" to an account of which step went wrong and what would have been required. Inward, it translates informal student work into categories a lecturer can aggregate and act upon, turning prose into diagnosis.

Both translations are lossy, and the framework tells us where. Technique can be inferred from what a student writes, because a student who shows their work displays their technique. Technology and theory cannot be inferred the same way: a student may execute a technique correctly while holding no justification for it, and nothing in a correct final answer distinguishes the two cases. Our implementation reflects this asymmetry — technique is inferred, whereas technology and theory are supplied from a curated per-topic schema (§6.3.2) — and §8.3 returns to what that asymmetry means for the claim that the gap has been closed. It is closed at the level of praxis; at the level of logos it is narrowed, not closed.

[NOTE: Read and position against *Modelling Mathematics Teaching with Instructional Technology in Resource-constrained Settings: An Analysis of Didactic Structuring Through the ATD* (AJRMSTE, 2025) before finalising this section — it applies the same framework to the same class of setting, and either supports this framing or pre-empts part of it. See references.]

## 4. Methodology

### 4.1 Design-based research

The study follows a design-based research (DBR) methodology, appropriate here for three reasons: the problem is authentic and identified by practitioners rather than derived from literature; the work proceeds by iteration between theoretical commitments and field realities; and the intended output includes transferable design principles, not only an artefact [NOTE: add DBR methodology citation — McKenney & Reeves is the usual anchor; not yet verified].

Two cycles are reported. **Cycle 1** comprised the needs analysis: interviews and surveys at the study site, from which design requirements and the five design principles were derived (§5), followed by implementation (§6). **Cycle 2** comprised deployment of both prototypes and the collection of stakeholder perceptions (§7), which identified refinements — most substantially the absence of step-level detail in the lecturer view — and exposed the instrumentation limitation that motivated the separate randomised study.

### 4.2 Setting and participants

The study was conducted at Masinde Muliro University of Science and Technology (MMUST), a Kenyan public university whose mathematics courses use STACK for assessment. Data collection ran from **6 October to 12 November 2025**.

**Lecturers.** Eleven lecturers participated, including all seven mathematics lecturers then teaching with STACK at the institution, each of whom was interviewed individually. The group comprised five Lecturers, four Teaching Assistants, one Senior Lecturer and one STACK content developer; ten were based at MMUST and one at another Kenyan university. Teaching experience was bimodal (five with six or more years, five with two or fewer). Reported typical class sizes were 40–150 (six), 150–300 (four) and above 300 (one). Seven completed the post-deployment survey.

**Students.** One hundred students completed the pre-deployment survey and 32 the post-deployment survey, with 19 individuals common to both. Respondents spanned year groups (65% in year four or above) and mathematics-related programmes, and were recruited by convenience from courses using STACK: Differential Calculus, Linear Algebra I–II, Analytical Geometry and Integral Calculus.

The setting is under-represented in this literature, and its operating constraints are part of the finding rather than context to be noted and set aside: 63% of students accessed the platform by smartphone alone, and 16% rated their connection reliability at 3 or below on a seven-point scale.

### 4.3 Instruments and data collection

Four instruments were administered: pre- and post-deployment surveys for each of the two stakeholder groups, combining scale items with open-ended questions, alongside the individual lecturer interviews. Student surveys covered prior STACK experience, access conditions, perceived fairness and clarity of marking, and — post-deployment — perceptions of the AI feedback, usability and the three underlying models. Lecturer instruments covered assessment-analysis practice, tool use and barriers, and post-deployment perceptions of the analytics.

One limitation is structural and we state it here rather than in the limitations section alone. **The pre- and post-deployment instruments share neither response scales (seven-point numeric versus five-level ordinal) nor item wording, so no matched pre/post statistic is computable.** The two waves are therefore reported as independent descriptive accounts, and no statement in §7 should be read as a measurement of change. This was an error of instrument design in cycle 1. Consistent with DBR practice we report it as a study outcome: it is the direct reason the subsequent randomised study uses scale-matched, pre-registered instruments.

### 4.4 Analysis

Scale items were summarised descriptively (mean, standard deviation, median, and proportion favourable), computed by script from the raw survey exports. Open-ended responses and interview material were analysed thematically to produce the gap categories of §5, then triangulated across the two stakeholder groups. Because 19 students completed both waves, we additionally compared baseline responses of those who did and did not return, as a check on response selection (§7.1). Post-deployment open responses were typically brief and are reported as illustrative rather than as a saturated thematic analysis.

### 4.5 Ethics

Informed consent was obtained through all four instruments; every respondent consented, and the student consent text covered anonymity, confidentiality, and withdrawal without penalty. Email addresses were collected solely to permit pre/post matching, were removed from the analysed datasets, and are excluded from any data deposit. No performance or grade data was linked to survey responses.

> ⚠️ **[NOTE — SUBMISSION BLOCKER] Institutional ethics approval references are not yet recorded.** This section requires the MMUST Institutional Ethics Review Committee approval number and date, and, if applicable, the NACOSTI research licence number, together with the approval of the doctoral host institution. Consent is documented; institutional approval is not. **iJMEST will not publish without an ethics statement, and this cannot be drafted from available materials — it must be supplied.**

---

## 5. Findings I: Needs Analysis

### 5.1 Gaps identified by lecturers

Eleven lecturers took part in the needs analysis, including all seven mathematics lecturers then teaching with STACK at MMUST, each of whom was interviewed individually. Their teaching contexts were substantial: six reported typical class sizes of 40–150 students, four of 150–300, and one of more than 300. Experience was bimodal — five lecturers had six or more years of teaching experience and five had two years or fewer — and prior STACK experience ranged from basic (five) to advanced (four).

Analysis of the interviews and survey responses converged on a single structural finding: STACK was valued as a marking engine but was not usable as a source of pedagogical intelligence. Two thirds of lecturers (7 of 11, 64%) reported using **no digital tool whatsoever** to analyse their STACK assessment data. Critically, this was not a considered rejection. Among those seven, six cited unawareness of available tools and five cited a lack of training or skills, while only one cited an absence of perceived need. The gap was therefore one of access and capability rather than of demand — a distinction with direct design consequences, since it implies that discoverability and low entry cost matter as much as analytic power.

Consistent with this, routine engagement with assessment data was shallow. Only 27% of lecturers analysed their data often or at every assessment; 55% did so only "sometimes", and the remainder rarely or never. Among the four lecturers who did use tools, all four identified lack of time as a principal obstacle, three identified difficulty in finding student errors, and two the difficulty of understanding *why* those errors occurred. Asked what they would analyse if a straightforward tool were available, six of seven named longitudinal progress and four named errors and misconceptions — ahead of raw grades in emphasis, though not in frequency.

The interviews articulated eight recurring limitations, which we group as: (1) limited insight into student errors, with no automated link between an incorrect answer and the underlying misconception; (2) time-consuming manual analysis; (3) absence of visual analytics summarising common errors, performance distributions and progress; (4) insufficient longitudinal tracking and no early indicator of at-risk students; (5) minimal AI-driven feedback or teaching recommendations; (6) limited support for instructional decision-making, particularly for remediation planning; (7) a skills and training gap, coupled with a stated preference for tools that are simple to learn; and (8) an expectation that AI capability should be embedded *within* STACK rather than requiring migration to external tools.

The eighth point recurred with notable consistency and shaped the integration strategy: lecturers wanted AI to simplify existing work rather than add a parallel system to maintain. One lecturer summarised the analytic ambition succinctly, wanting to "analyse my data to the core, beyond the scores — to identify the specific errors made by my students". Another, the only respondent already working with exported data, described a practice that anticipated the eventual dashboard almost feature for feature: "I focus on student attempt patterns, time spent per question, number of reattempts, and specific error types. I also look at question discrimination indices, average difficulty levels, and performance distributions across cohorts."

### 5.2 Gaps identified by students

One hundred students completed the pre-deployment survey, drawn from several year groups and mathematics-related programmes; 65% were in their fourth year or above and 68% were male. Their access conditions were constrained in ways that proved consequential for design: 63% reached STACK on a smartphone alone, a further 30% on a combination of laptop and smartphone, and only 4% on a laptop alone. Perceived connection reliability averaged 4.94 on a seven-point scale (SD = 1.49), with 16% rating it 3 or below.

The quantitative pattern in the student data is the central finding of this analysis, and it is not the one a satisfaction survey would predict. Students were broadly positive about STACK: confidence in using it for practice and assessment averaged 5.54 (SD = 1.37) and the perceived helpfulness of its existing feedback averaged 5.56 (SD = 1.27), both on seven-point scales. Yet the lowest-scoring item in the entire instrument asked whether they understood *why* an answer had been marked incorrect: mean 4.59 (SD = 1.61), median 4, with only half the cohort rating it above the scale midpoint and one fifth rating it 3 or below. Two related items sat between these poles: perceived fairness when a valid alternative method was used averaged 5.19 (SD = 1.54), and confidence that STACK accurately evaluated their mathematical reasoning averaged 5.07 (SD = 1.42).

Students, in other words, accepted the system without understanding its verdicts. This is precisely the praxeological gap set out in §3.1, rendered as a measurement: the task is assessed, the technique is not, and the learner is left holding a judgement they cannot interpret.

The open responses explain the mechanism behind the numbers, and fall into four groups. The first concerns unrecognised symbolic equivalence, expressed with some exasperation: "Just because I wrote x+y and stack says y+x doesn't mean am wrong." Several students described receiving a correction identical to their own rejected answer — "in some few cases you're marked wrong and the correction feedback is the same as your wrong answer". The second concerns syntax and formatting, where a stray space or an unanticipated form cost full marks. The third concerns valid alternative methods: "This was a situation when I used a different approach to a quiz, got a correct answer but still the stack marked me wrong." The epistemic cost of these episodes is captured by one student who followed a worked example from class and was marked incorrect: "That means even my lecturers are wrong." The fourth concerns the marking of final answers only, and produced the succinct design demand: "Mark the steps not final answer."

Asked what feedback they wished STACK provided, students described the diagnostic layer before it existed. One asked for feedback "identifying exactly where mistakes are made and how to improve, along with clearer explanations of why certain approaches are effective or ineffective". Another anticipated the adaptive loop: "It would be nice if STACK gave extra practice questions in my weak areas." Recurring requests beyond the scope of this design — audio and video explanation, handwritten-script scanning, offline access — are returned to in §8.5.

Expectations of AI, recorded before any exposure to the prototypes, were uniformly high: 92% expected AI to help them target weak areas (M = 6.02, SD = 1.18), 87% said they would follow its recommendations, and 76% trusted AI to make fair recommendations. These baselines are essential context for the perception data reported in §7, and we return to them there.

### 5.3 From gaps to design requirements

Table 1 maps each identified gap to the evidence supporting it, the design requirement derived from it, and the intended educational benefit. [NOTE: Table 1 to be typeset from the pilot summary's two tables — lecturer-level (9 rows) and student-level (8 rows) — condensed to roughly 12 rows total.]

Five design principles were abstracted from that mapping and govern the architecture described in §6:

- **DP1 — Diagnosis beyond the verdict.** Every assessment produces an error category and an explanation, not only a mark.
- **DP2 — Symbolic truth as guard-rail.** No AI-generated claim about correctness may contradict the computer algebra system.
- **DP3 — Structured, actionable feedback.** Feedback follows a fixed three-part format (answer, reasoning, verdict) addressed to the student.
- **DP4 — Actionable analytics for the lecturer.** Error-category aggregation, psychometric indices and longitudinal tracking, presented without requiring data-analysis expertise.
- **DP5 — Human control.** Experts can correct AI output, and approved corrections re-enter the system as alignment examples.

DP2 and DP5 warrant comment, as both were derived from stakeholder distrust rather than stakeholder request. Students' fairness complaints were not requests for leniency but for correctness — for a marker that recognises mathematically equivalent work. DP2 encodes that as an architectural constraint. Similarly, no lecturer asked for a human-in-the-loop correction facility; the requirement was inferred from the conjunction of high expectations of AI and low tolerance for inaccurate marking evident across both groups.

---

## 6. System Design: The STACK-AI Ecosystem

### 6.1 Overview

The ecosystem comprises two applications sharing a common data substrate: *STACKAI Math Educator*, which serves lecturers, and *STACK-AI-Math-Course*, which serves students. Both are built on Convex, a serverless backend providing a reactive document database in which query results propagate to connected clients without polling. This choice matters pedagogically as well as technically: a lecturer viewing a cohort dashboard sees submissions appear as students work, without refreshing.

The student-facing application is organised around a single transaction — a student submits a final answer together with a written account of their reasoning, and receives a graded, structured, diagnostic response — and around what the system records while doing so. The remainder of this section follows that transaction through the architecture, then examines what the lecturer-facing application does with the accumulated record.

[NOTE: §6.2 below describes the lecturer application, whose source is a separate repository not analysed here. The description must be verified against that codebase before submission, at the same level of specificity as §6.3. Do not submit §6.2 on the strength of the slides alone.]

### 6.2 STACKAI Math Educator: the lecturer-facing tool

[NOTE: To be written from the STACKAI Math Educator repository. Cover: the real-time analytics dashboard; automated classification of student errors; grade distributions and per-item difficulty and discrimination indices; and the retrieval-augmented conversational assistant. Two claims in the outline require particular scrutiny against that code — (i) whether error classification is genuinely implemented against the Newman categories or, as in the student-facing application, produces free-text labels (see §6.5), and (ii) how difficulty and discrimination are computed. §7.3 reports that lecturers trusted these indices highly, so their provenance must be stated precisely.]

### 6.3 STACK-AI-Math-Course: the student-facing platform

#### 6.3.1 Parametric problem generation

Problems are produced by eighteen generator modules covering linear algebra (determinants, eigenvalues for 2×2 and 3×3 matrices, eigenspaces, linear systems, independence, Gram–Schmidt, several inner-product families, vector-space axioms, quadratics) and differential calculus (derivatives, limits, piecewise continuity, domain and range), exposed through twenty-six registry keys once topic aliases are counted. Each module is a skeleton parameterised over randomly drawn coefficients, so a topic yields an effectively unlimited supply of structurally isomorphic problems. Every generated problem carries its own answer-format instruction and, where the topic defines one, an expected reasoning scaffold enumerating the steps a complete solution should exhibit.

This addresses two distinct requirements at once. It supplies the unlimited personalised practice students asked for (§5.2), and it makes possible the isomorphic pre/post instruments required for controlled evaluation, since two forms of a test can be generated from identical skeletons under different parameters.

#### 6.3.2 The layered grading pipeline

A submission passes through three layers, each recorded separately in the submission's diagnostic record.

**Layer 1 — CAS verification.** Before any language model is invoked, the system attempts to compute the problem's ground truth deterministically, using the nerdamer computer algebra library with its algebra, calculus and equation-solving modules. If the ground truth is computable, the student's final answer is then tested for symbolic equivalence against it. Both results — whether verification was possible, and whether the answer was equivalent — are recorded, and the verified answer is injected into the language model's prompt with an explicit instruction not to recompute it.

This layer realises DP2. The instruction is not advisory: the grading prompt states that where the CAS has ruled on the final answer, that ruling determines the final-answer score and may not be overridden, and a post-processing step re-imposes the CAS verdict on the model's output before the feedback reaches the student. The design intent is precise — the language model is permitted to interpret and explain, but never to adjudicate arithmetic. It is also the direct answer to the fairness complaints of §5.2: symbolic equivalence checking means that `x+y` and `y+x`, or a fraction and its decimal, are treated as the same answer.

**Layer 2 — AI diagnosis.** A language model (Gemini 2.5 Flash or a GPT model, configurable per submission) grades the submission against a half-point rubric and returns a structured diagnosis: the technique the student appears to have used, an error type, the misconception behind it, the location of the error, and concept tags.

The rubric deserves emphasis because it responds directly to a documented complaint. Marks are not binary. A submission earns up to 0.5 for its final answer and up to 0.5 for its reasoning, so the attainable grades are 0, 0.5 and 1. A correct answer with absent reasoning earns 0.5, as does sound reasoning that reaches a wrong answer. Students in §5.2 objected that STACK marks "the final answers only" and asked it to "mark the steps not final answer"; the split rubric is that requirement implemented. Feedback is returned in three fixed sections — final answer, reasoning steps, verdict — each addressed to the student in the second person, satisfying DP3.

**Layer 3 — Didactic interpretation.** The third layer is where the theoretical framework of §3 becomes executable rather than merely motivating. Each submission is interpreted as a praxeology in Chevallard's sense, populating all four components: the *task type* and the *technology* and *theory* that justify it are drawn from a curated per-topic map authored alongside the problem generators, while the *technique* is supplied by the diagnosis of layer 2. The layer emits a learning-focus statement naming the task type, the technique the student used, and the mathematical idea that justifies it, together with a profile update recording the misconception tags and the recommended next task.

This is the architectural expression of the central claim of §3.1. STACK assesses the task; the technique remains invisible. Layer 2 makes the technique legible by naming it, and layer 3 situates it within the technology and theory that justify it. The composition of the layers, not any single one, is what closes the praxeological gap.

#### 6.3.3 The judge as reward model

A second language model (GPT-4o-mini) evaluates the feedback produced by the first, applying three binary alignment checks: whether the feedback addresses this specific problem rather than being generic, whether its mathematical claims are correct, and whether the grade is consistent with what the student submitted. The judge receives the CAS ground truth independently and is instructed that it may not contradict a CAS-backed verdict, so the guard-rail of DP2 constrains the validator as well as the grader. It returns the three check outcomes, a confidence score, and — only when a check fails — corrected feedback.

The judge is used in two distinct modes. In the default path it runs asynchronously after the submission is stored, and its output is recorded *alongside* the delivered feedback rather than replacing it, so that the delivered response and the validator's opinion of it are both preserved for analysis. In the Best-of-N path, the grader generates up to three candidate feedbacks in parallel at a raised sampling temperature, the judge scores each, and the highest-scoring candidate is delivered. Here the judge functions strictly as a reward model for ranking: it selects among candidates but does not rewrite the winner, a deliberate restriction that prevents a validator disagreeing with the CAS from corrupting a correct verdict.

#### 6.3.4 Mastery and the adaptive loop

Each submission updates a per-topic mastery score, incremented by 10 for a fully correct submission and 3 for a half-credit one, capped at 100. The recommendation engine reads that score together with the student's two most recent incorrect submissions and their diagnosed error types, and prompts a language model to generate three new practice problems targeting the observed weaknesses, banded by mastery: foundational single-step problems below 30, multi-step problems between 30 and 70, and problems combining several concepts above 70.

The system also captures a second signal. Because each submission records the mastery score prevailing immediately before it, the change in mastery across consecutive submissions on a topic can be attributed to the intervening feedback. This *outcome reward* is written back onto the earlier submission once the next one arrives. Feedback that preceded a measurable mastery gain is thereby identifiable, and such feedback is fed back into the grading prompt as few-shot exemplars — an attempt to optimise not for feedback a second model judges plausible, but for feedback that preceded improvement. The validity of that attribution is exactly what the randomised study evaluates, and we make no claim for it here.

#### 6.3.5 Expert correction and the human loop

Any submission can be corrected by a human expert, who supplies a revised grade — constrained to the same 0, 0.5 or 1 rubric — and revised feedback. Corrections enter a moderation queue and take effect only once approved by a user holding the administrator role. Approved corrections are then retrieved as few-shot exemplars by both the grader and the judge, so a single expert intervention propagates to future gradings on that topic and to the standard against which future feedback is validated. This realises DP5, and it is the mechanism by which lecturer judgement, rather than model preference, sets the alignment target.

#### 6.3.6 Handwritten work

Students may photograph handwritten working, which is transcribed and either submitted as reasoning or used to seed the recommendation engine. Given that 63% of the cohort reach the platform by smartphone alone (§5.2), this is less a convenience feature than a condition of use.

### 6.4 Traceability from design back to needs

[NOTE: Table 2 to be constructed — one row per component, mapping component → design principle → originating gap from Table 1. The mapping is complete in the sense that every DP has at least one implementing component; state whether the converse holds.]

### 6.5 Implementation choices, and their limits

Four aspects of the implementation qualify the claims above, and we state them plainly rather than leaving them for a reader to discover.

**The CAS layer is not Maxima.** Symbolic verification uses nerdamer, a JavaScript computer algebra library, executed inside the serverless backend rather than by invoking STACK's Maxima kernel. The motivation is architectural — a single runtime, no external process, latency compatible with synchronous grading — but the consequence is a narrower symbolic coverage than Maxima offers. Where ground truth cannot be computed, the pipeline continues without layer 1, and the guarantee of DP2 lapses for that submission: the language model's verdict then stands unchecked. The system records which submissions were CAS-verified, so this is measurable rather than merely acknowledged. Native STACK integration is future work, and the honest description of the present system is that it implements the *pattern* STACK's community would recognise, on different symbolic foundations.

**Error categories are not a taxonomy.** The error type returned by layer 2 is a short free-text label generated by the language model, not a classification into Newman's categories or any other fixed scheme. Individual labels are usable, and they drive the recommendation engine adequately. But free-text labels do not aggregate reliably: "Sign Error", "sign mistake" and "Incorrect Sign" are three strings. Any cohort-level claim resting on error-category frequencies is therefore weaker than it appears, and reconciling the didactic framing of §2.3 with the implementation requires either constraining the model to a closed category set or clustering the labels post hoc. [NOTE: This bears directly on §6.2 — verify how the lecturer dashboard aggregates error categories before claiming Newman classification anywhere in the paper.]

**Mastery is a practice counter, not an ability estimate.** The mastery score accumulates credit and is capped; it never decreases. It therefore measures accumulated successful practice rather than current ability, and a student who has stopped answering correctly retains their score. It should not be read as a psychometric estimate, and the outcome reward derived from it inherits the same limitation — it can register improvement but never regression.

**Generated practice problems are not verified.** Problems from the eighteen parametric generators carry CAS-computable ground truth by construction. Problems produced by the recommendation engine do not: they are generated by a language model together with a purported correct answer, which is not checked against the CAS before being shown. This is the one place in the architecture where the guard-rail principle of DP2 is not enforced, and it should be closed by routing generated problems through the same verification path.

---

## 7. Findings II: Deployment and Stakeholder Perceptions

### 7.1 Deployment and respondents

Both prototypes were deployed at MMUST between 6 October and 12 November 2025, across Differential Calculus, Linear Algebra I–II, Analytical Geometry and Integral Calculus. Post-deployment surveys were completed by 32 students and 7 lecturers.

Nineteen students completed both the pre- and post-deployment surveys, permitting a check on who elected to respond after using the tools. On the twelve seven-point baseline items, respondents who completed both waves differed little from those who completed only the first (all absolute differences ≤ 0.42, most below 0.35), suggesting that post-survey respondents were not drawn disproportionately from students with unusually favourable or unfavourable prior attitudes. They were, however, further advanced in their studies: 90% were in their fourth year or above, against 59% of non-respondents. The perceptions below should therefore be read as those of comparatively senior students.

A limitation of the instruments constrains what can be claimed here. The pre- and post-deployment surveys used neither matched scales (seven-point numeric versus five-level ordinal) nor matched item wording, and no pre/post change statistic is therefore computable. The two waves are reported separately and descriptively; no inference about change over time is drawn from their juxtaposition. We return to this in §8.4, and it directly motivated the matched instrumentation of the randomised study reported separately.

### 7.2 Student perceptions

Student responses were favourable across all measured dimensions, with the strongest ratings falling on the diagnostic functions that DP1–DP3 were designed to deliver. Ninety-one per cent reported a positive perceived impact on their understanding or performance, 34% describing it as strongly positive. Eighty-eight per cent found the AI feedback helpful to their understanding, and 84% found the step-by-step reasoning and hints useful.

The item most directly tied to the design rationale asked whether the tool helped students understand their mistakes better than traditional feedback methods: 78% agreed or strongly agreed, 22% were neutral, and **no student disagreed**. Usability ratings were comparable — 91% rated question clarity favourably, 84% found the interface controls intuitive, and 78% found navigation easy, though 6% found it difficult. Seventy-five per cent reported that the tool met their expectations, and 72% rated it more helpful than other online learning tools they had used.

Open responses were typically brief, reflecting smartphone-based completion, and do not support a rich thematic analysis; three patterns nonetheless recurred with sufficient frequency to report. The most frequent, mentioned spontaneously by at least eight respondents, concerned the availability of hints before answering: "The way it gives a hint before you answer which makes you practice before getting an answer." The second concerned the immediacy and specificity of feedback — "it showed me my mistakes right away and helped me understand how to correct them". The third concerned the reasoning-entry field, which several students described in terms of cognitive space rather than assessment: "Gave me a thinking space to validate my take on the question."

Dissenting responses are instructive and we report them in full. One student found the reasoning requirement itself burdensome: "For me it was a little difficult, up to now I am having trouble understanding how to explain my answers." This is a substantive design finding rather than a usability complaint: articulating one's reasoning imposes a cognitive cost that the design treats as costless. A second observed that step-by-step output was not always complete — "if you are not keen you might miss the steps". Two further respondents were plainly negative, one stating the system "is not accurate" and another that "it helps partially".

These results must be read against the baselines in §5.2, where expectations of AI already stood at 92% before any exposure. Favourable post-deployment ratings are consistent with a genuinely useful tool, but they are equally consistent with expectancy and novelty effects, and this design cannot distinguish the two. Nothing in this section should be read as evidence of learning; no performance measure was collected.

### 7.3 Lecturer perceptions

Lecturer responses (n = 7) were unanimous on adoption and more measured on effectiveness — a pattern worth preserving rather than smoothing. All seven found the tool easy to learn, considered it a good idea for their practice, reported a positive overall attitude, and would recommend it to colleagues; six of seven intended to use it the following semester.

Trust in the analytics was high and consistent: confidence in the reported difficulty, discrimination and error-pattern measures averaged 5.86 on a seven-point scale (SD = 0.69), with every respondent rating 5 or above, and overall satisfaction averaged 5.71 (SD = 0.76). Effectiveness ratings were more moderate. Asked how far the tool improved their understanding of student difficulties, 43% answered "very" or "extremely effective" and 57% "quite effective". Seventy-one per cent would use the insights to adjust their teaching, though one respondent disagreed strongly.

An unexpected divergence emerged between the two access modalities. Lecturers reported that conversational queries helped them find answers faster than the dashboards (M = 5.14 versus 3.86 for the converse), yet stated preference ran the other way: 43% preferred dashboards, 43% valued both equally, and only 14% preferred chat. Retrieval speed and preferred modality thus dissociate, suggesting the two serve distinct purposes — targeted enquiry against periodic overview — rather than competing for the same role. The four lecturers who commented on the automated error categories judged them clear and consistent with standard definitions; this is too small a base to support any claim about the validity of the classification.

Criticism clustered on two themes. The first concerned granularity: two lecturers objected that the tool reported outcomes "without showing steps", and a third qualified their trust in its recommendations on the same grounds — "they are only based on the answers and not the steps". Step-level detail was implemented on the student side but not surfaced in the lecturer view at the time of deployment, and this was the most substantive functional gap identified. The second concerned operating conditions: one lecturer cited synchronisation delays of uncertain origin, and another hesitated on grounds of scale, with "over 100 students". Available resources of time, devices and connectivity were the most dispersed measure in the entire lecturer survey (M = 4.57, SD = 2.07), one respondent rating them at the scale minimum. Asked what institutional support would encourage adoption, all five who answered named training, workshops or ICT support, and one raised sustainability directly: "Ideally, it should be central IT but since the institution is cash-strapped, possibly research projects."

### 7.4 Comparison of feedback models

Students rated feedback helpfulness for three underlying models on a five-point scale: GPT-4o 4.12 (SD = 1.24), GPT-4o-mini 4.25 (SD = 0.95) and GPT-3.5-Turbo 4.03 (SD = 1.20). Stated preference favoured GPT-4o (14 mentions) over GPT-4o-mini (8) and GPT-3.5-Turbo (1), with nine responses uninterpretable.

These differences are within measurement noise at this sample size, and exposure to models was neither controlled nor randomised: students encountered whichever model their session had configured, as their own comments make clear ("GPT-4o, that's what I had"; "I didn't use it"). We therefore report no model comparison. The interpretable finding is the absence of reliable discrimination — under uncontrolled exposure, students did not distinguish feedback quality across models differing substantially in capability and cost. Whether that reflects genuine equivalence for this task, insensitivity of self-report to feedback quality, or simple inattention cannot be settled by these data, and the question motivated the randomised design reported separately.

### 7.5 Illustrative vignette

[NOTE: To be written once a representative anonymised submission is selected — see the §7.5 checklist item. Trace one determinant submission end to end: problem statement → incorrect student answer and reasoning → CAS ground truth → three-section feedback → assigned error category → mastery update → next recommended problem → lecturer dashboard view. This is the concrete demonstration of component integration and should be presented as a boxed figure.]

### 7.6 Platform usage

[NOTE: Pending export via `experiment:exportSubmissions`. Report submission volume, judge/grader agreement rate, and error-type distribution over the deployment window. If the export cannot be produced for the deployment period, state that usage telemetry was not instrumented at pilot time and remove this subsection rather than back-filling from later data.]

---

## 8. Discussion

### 8.1 Answers to the research questions

**RQ1** asked what lecturers and students need. The two groups described the same deficit from opposite sides. Lecturers could not see why their students erred — two thirds used no analytical tool at all, and among those, unawareness and lack of training, not absence of need, explained the gap. Students could not see why they had been marked wrong, an item that scored lower than any other in a survey otherwise favourable to STACK. Both groups, in other words, were asking for the same missing object: an account of the reasoning that produced an answer. That convergence is what made a single architecture capable of serving both.

**RQ2** asked what architecture connects CAS verification, AI diagnosis and didactic theory. Our answer allocates authority explicitly. Correctness is settled deterministically where it can be; interpretation is generated; the interpretation is constrained by a praxeological schema rather than left to the model's notion of helpfulness; and alignment is validated by an independent model that is itself forbidden from contradicting the deterministic layer. §6.5 documents where this allocation is presently incomplete.

**RQ3** asked how stakeholders perceived the result. Favourably, with qualifications worth preserving. Every lecturer would recommend the tool and trusted its analytics highly, while rating its effect on their understanding of student difficulties more moderately. Students rated the diagnostic functions highest, and not one disagreed that they understood their mistakes better than with traditional feedback — though 22% were neutral, and pre-deployment expectations were already high enough to make novelty effects a live alternative explanation.

### 8.2 Allocated authority as a reusable pattern

The generalisable claim of this paper is not the particular system but the principle governing its layers: *be deterministic where you can, generative where you must, theory-constrained where the output must be interpretable, and independently validated where the cost of error is high.*

Each clause does specific work. Deterministic verification removes the failure mode that most damages trust in AI-assisted assessment — a confident, fluent, wrong correction. Generation is confined to what determinism cannot supply, namely explanation in natural language. Theory-constraint addresses a problem that receives less attention: an unconstrained model asked for helpful feedback optimises against no defined target, whereas a model asked to identify the technique a student used, and to situate it against the technology that justifies it, is answering a question with a didactic referent. Independent validation catches the residue.

Nothing in this pattern is specific to mathematics. Any domain possessing a decidable correctness oracle — symbolic computation, unit tests in programming education, structured chemical notation — can instantiate it. What varies is the theory supplying the constraint, and that must come from the domain's own didactics rather than from the machine learning literature.

### 8.3 A praxeological reading

Returning to §3: the ecosystem renders the *technique* visible by requiring students to state their reasoning and having the system name what they did, and it attaches *technology* and *theory* to that technique from a curated per-topic schema. This is a partial success and should be described as such. Technique is genuinely inferred from student work; technology and theory are supplied by the system's authors, not discovered in the student's account. The system can therefore report which justification *should* underwrite a technique, but not whether the student holds it. Assessing a student's grasp of the theory that justifies their method remains beyond what this architecture reaches, and it is not clear that any assessment mediated by a final answer and a paragraph of reasoning could reach it.

One student comment marks the boundary from the other side: "up to now I am having trouble understanding how to explain my answers". Making technique visible requires students to articulate it, and articulation is itself a mathematical competence unevenly distributed among learners. A design that treats the reasoning box as a free window onto cognition mistakes a demanding task for a neutral one.

### 8.4 Limitations

*Of the study.* The work was conducted at a single site with convenience samples. Post-deployment respondents were self-selected and markedly more senior than the wider cohort. Most consequentially, the pre- and post-deployment instruments shared neither scales nor item wording, so no change statistic is computable; this was a design error in the first cycle, and it is the reason the perceptions in §7 stand alone rather than as a before-and-after comparison. Pre-deployment expectations of AI were already at 92%, so novelty and expectancy remain plausible explanations for favourable post-deployment ratings, and this design cannot exclude them. No learning was measured: there was no performance instrument and no control condition, and no statement in this paper should be read as evidence that the system teaches.

*Of the artefact.* Symbolic verification uses a JavaScript computer algebra library rather than Maxima, with narrower coverage; where ground truth is not computable the deterministic guarantee lapses for that submission. Error categories are free-text model output rather than a fixed taxonomy, which limits any aggregate claim resting on error frequencies and creates a tension with the didactic framing of §2.3 that further work must resolve. The mastery score accumulates and never decreases, so it records successful practice rather than current ability. Problems produced by the recommendation engine are not routed through CAS verification, leaving one path in which the system's own guard-rail principle is unenforced. Language model outputs are non-deterministic and version-dependent, and the models used carry per-submission cost that a department must bear.

*Of scope.* The platform is English-only, in a setting where that is not every student's first language. Two thirds of the cohort worked on smartphones over connections that 16% rated at or below 3 on a seven-point scale, and the deployment was not instrumented to record how far those conditions shaped what we observed.

### 8.5 Implications

For the STACK community, the pattern of §8.2 suggests a direction that preserves what STACK does well: a potential response tree could hand unanticipated responses to a diagnostic layer while retaining authority over the responses it does anticipate, so that generative capability extends coverage rather than replacing established machinery.

For deployments in resource-constrained settings, our data locates the binding constraints away from where they are usually sought. Lecturers did not resist analytics; they had never encountered them, and asked for training and institutional support more often than for features. One framed the sustainability question directly, noting that central IT would be the natural owner "but since the institution is cash-strapped, possibly research projects". A system whose per-submission cost is met by a research grant is not yet a system that a department can adopt, and the field should report those costs as routinely as it reports accuracy.

For research on AI feedback more broadly, the most useful result here may be a negative one. Students given feedback from three models of substantially different capability and cost did not reliably distinguish between them (§7.4). If self-reported helpfulness cannot separate models that differ this much, it is a weak instrument for evaluating feedback quality — which is precisely the argument for measuring whether students subsequently improve, and the question the randomised study takes up.

---

## 9. Conclusion and Future Work

We set out to establish what users of CAS-based assessment need from AI support, what architecture could supply it, and how such an architecture is received in use.

The needs analysis found lecturers and students describing the same absence from opposite sides — neither could see the reasoning behind a verdict — and found it in a form sharp enough to measure: two thirds of lecturers used no analytical tool at all, mainly through unawareness rather than disinterest, and students' understanding of *why* they were marked incorrect was the weakest item in an instrument otherwise favourable to STACK. From that mapping we derived five design principles and an architecture that allocates authority explicitly: deterministic verification over correctness, generative interpretation of reasoning, didactic theory constraining what that interpretation seeks, and independent validation of the result. In deployment, every lecturer would recommend the tools and trusted their analytics; 88% of students found the AI feedback helpful and 78% reported understanding their mistakes better than with conventional feedback, with no student disagreeing.

We claim no more than that. These are perceptions of feasibility and usefulness, gathered without a control condition or any measure of performance, from a self-selected and comparatively senior group of respondents whose expectations of AI were already high before use. Whether the feedback teaches is not a question this design can answer.

Four directions follow, in rough order of how much they would change the argument.

**Measuring efficacy.** A pre-registered randomised study is under way, comparing feedback conditions within subjects with scale-matched instruments and CAS-marked outcome measures. Its central question is whether a second model's confidence in a piece of feedback predicts whether the student subsequently improves — a question §7.4 suggests self-report cannot settle, since students did not reliably distinguish models of substantially different capability and cost.

**Closing the architecture's own gaps.** Three are identified in §6.5 and are tractable. Problems produced by the recommendation engine bypass CAS verification, leaving one path where the system's guard-rail principle goes unenforced; recent STACK work validating generated problems by multi-seed CAS testing indicates the remedy. Error categories are free-text rather than drawn from a closed taxonomy, which limits aggregate diagnostic claims and leaves the didactic framing of §2.3 only partially realised. And the mastery score accumulates without decay, recording practice rather than current ability.

**Native STACK integration.** Symbolic verification currently runs on a JavaScript computer algebra library rather than Maxima, trading coverage for architectural simplicity. Integrating the diagnostic layers with STACK itself — so that a potential response tree could delegate unanticipated responses to a diagnostic layer while retaining authority over those it anticipates — would extend rather than replace what the STACK community has built, and would make the approach directly usable by that community.

**Beyond a single site.** The design principles are stated to be transferable, and that claim is untested. Multi-site deployment, particularly across differing infrastructural conditions and languages, is the obvious next step; the present study establishes only that the approach is workable where it was built.

The broader argument we would leave with the field concerns where authority sits. Connecting a language model to an assessment system is straightforward, and increasingly common. Deciding what each component is permitted to determine — and refusing the generative component authority over claims a deterministic one can settle — is the harder and more consequential design problem. Where a decidable correctness oracle exists, we see no good reason to let a language model overrule it, and considerable evidence that it should not.

---

## References (working list — §1 and §2 only)

**Verification status is marked on every entry. Nothing below was written from memory; each was returned by a literature search on 27 July 2026. Entries marked ⚠️ have a verified title/venue/DOI but an unverified author list, because the publisher blocked automated retrieval — resolve these against the publisher page or your reference manager before submission.**

✅ **Verified in full**

- Gupta, A., Reddig, J., Calo, T., Weitekamp, D., & MacLellan, C. J. (2025). Beyond final answers: Evaluating large language models for math tutoring. *arXiv:2503.16460* [cs.HC]. Also published in the AIED 2025 proceedings (Springer, doi:10.1007/978-3-031-98414-3_23).
  — *Used in §2.2 for the 85.5% / 90% / 56.6% dissociation. Check whether to cite the arXiv or the Springer version; iJMEST will prefer the published one.*

- Zheng, L., Chiang, W.-L., Sheng, Y., Zhuang, S., Wu, Z., Zhuang, Y., Lin, Z., Li, Z., Li, D., Xing, E. P., Zhang, H., Gonzalez, J. E., & Stoica, I. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. *Advances in Neural Information Processing Systems 36* (Datasets and Benchmarks Track). arXiv:2306.05685.
  — *Used in §2.2 for the ~85% vs 81% agreement figures and the three named biases.*

- Sangwin, C. J. (2013). *Computer aided assessment of mathematics*. Oxford University Press. ISBN 978-0199660353.
  — *The anchor citation for §2.1. Confirm whether a later edition exists.*

⚠️ **Title/venue/DOI verified; author list NOT verified**

- [Authors to confirm] (2026). A proposal of a mathematics problem generation tool using generative AI for STACK online assessment system. *Mathematics, 14*(14), 2481. doi:10.3390/math14142481.
  — **The most important reference to get right.** It is the closest prior work: RAG-based STACK problem generation with multi-seed Maxima validation. MDPI blocked automated retrieval, so the author list must be filled in manually. §2.1 and §2.5 both depend on it, and §2.1 quotes its motivation for CAS validation.

- [Authors to confirm] (2025). Modelling mathematics teaching with instructional technology in resource-constrained settings: An analysis of didactic structuring through the anthropological theory of the didactics. *African Journal of Research in Mathematics, Science and Technology Education*. doi:10.1080/18117295.2025.2588528.
  — **Not yet cited in the draft, and it should be.** ATD applied to instructional technology in resource-constrained settings is close to this paper's exact framing; it belongs in §2.3 or §3 and strengthens the claim that the theoretical lens suits the context. Taylor & Francis blocked retrieval — read it before citing.

- [Authors to confirm] (2026). Reliability without validity: A systematic, large-scale evaluation of LLM-as-a-judge models across agreement, consistency, and bias. *arXiv:2606.19544*.
- [Authors to confirm] (2026). The coin flip judge? Reliability and bias in LLM-as-a-judge evaluation. *arXiv:2606.13685*.
  — *Both support the ICC 0.58–0.77 / within-judge-noise claim in §2.2. Cite one or both; check whether either has since been peer-reviewed, as two arXiv preprints on one claim is weak for a journal submission.*

- [Authors to confirm] (2024). A current overview of the use of learning analytics dashboards. *Education Sciences, 14*(1), 82.
  — *Used in §2.4 for dashboard uptake and the data-literacy prerequisite.*

- World Bank (2016). *Mathematics education in Sub-Saharan Africa: Status, challenges, and opportunities*. Report P152990.
  — *Used in §2.4. Confirm the exact title and report number from the World Bank record.*

🔶 **Cited from established knowledge, exact reference NOT verified by search — must be confirmed**

- Newman, M. A. (1977). An analysis of sixth-grade pupils' errors on written mathematical tasks. *Victorian Institute for Educational Research Bulletin*.
  — Searches confirmed the framework, its five stages (reading, comprehension, transformation, process skills, encoding) and its 1970s origin, but **not this specific bibliographic entry**. Verify before use, or cite a recent secondary source that restates the framework.

- Chevallard, Y. — Anthropological Theory of the Didactic. A verified encyclopedia entry exists: *Anthropological Theory of the Didactic (ATD)*, in *Encyclopedia of Mathematics Education* (Springer), doi:10.1007/978-3-030-15789-0_100034. The praxeological structure [T, τ, θ, Θ] was confirmed by search.
  — **§1.4 and §3 need a primary Chevallard citation, which is not yet established.** Decide between the encyclopedia entry and a primary source, and note that much of the primary literature is in French.

- STACK Project (n.d.). *Potential response trees*. STACK documentation, docs.stack-assessment.org.
  — *Cite the documentation, or replace with a peer-reviewed source on PRTs.*

**Still to source**

- Design-based research methodology for §4.1 (McKenney & Reeves is the usual anchor — not yet verified).
- A peer-reviewed source for §2.2's mathematical-hallucination claims; the draft currently relies on search summaries of preprints.
- Recent STACK-community work beyond Sangwin (2013) for §2.1 — the field has moved since, and a reviewer from that community will expect current references.
