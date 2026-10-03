# Paper 1 — Detailed Outline

**Version:** 1.2 — 27 July 2026 (§4.2, §4.3, §5 and §7 pre-filled with the real survey data; document translated to English)
**Status:** outline for drafting
**Data:** [`donnees-enquetes.md`](donnees-enquetes.md) — all descriptives and verbaNtims, verified

---

## 0. Metadata

**Proposed title (main variant):**
> *Bridging CAS Verification and Didactic Feedback: A Design-Based Study of an AI-Enhanced Adaptive Assessment Ecosystem for University Mathematics*

Variants:
- *From Right/Wrong to Why: Integrating Didactics, Computer Algebra, and AI for Adaptive Mathematics Assessment* (catchier)
- *Integrating Didactic Mathematics, Pedagogical E-Learning Design, and AI for Adaptive Assessment in University Mathematics* (the Trieste slide title — continuity with the conference)

**Target journal:** *International Journal of Mathematical Education in Science and Technology* (iJMEST) — the natural home of the STACK community.
Alternatives: *Teaching Mathematics and its Applications* (IMA), *IEEE Transactions on Learning Technologies* (if the architecture is foregrounded), *Education and Information Technologies*.

**Article type:** Design-Based Research (DBR) / design and development study.
**Target length:** 7,000–9,000 words excluding references.
**Proposed keywords:** STACK; computer algebra systems; automated assessment; AI feedback; large language models; Newman error analysis; design-based research; adaptive learning; mathematics education; Kenya.

**One-sentence thesis:** CAS assessment verifies symbolic equivalence but discards the didactic information in a student's work; a layered architecture — deterministic CAS, AI diagnosis, LLM-as-Judge validation, lecturer analytics — designed from authentic field needs, closes that praxeological gap.

---

## Abstract (150–250 words — write last)

Required structure:
1. **Problem** (2 sentences): CAS assessment systems such as STACK mark right/wrong but do not diagnose misconceptions; lecturers lack analytic tools, students lack explanatory feedback.
2. **Method** (2 sentences): two-cycle DBR; needs study at MMUST (Kenya) with lecturers and students who use STACK; design and implementation of two integrated tools.
3. **Figures to include in the abstract** (the most telling): 100 students and 11 lecturers pre, 32 and 7 post; **64% of lecturers use no analysis tool at all**; **students poorly understand *why* they are marked incorrect (4.59/7), well below their general trust in STACK (5.54/7)**; after use, **88% found the AI feedback helpful** and **78% reported understanding their mistakes better than with traditional feedback**.
4. **Result/contribution** (2–3 sentences): (a) a field-derived needs→design-requirements mapping; (b) a three-layer grading pipeline (CAS verification → LLM diagnosis → LLM-as-Judge validation) with a human expert in the loop; (c) an ecosystem connecting lecturer analytics (Newman categories, psychometric indices) and student adaptive learning (parametric generation, mastery, recommendations).
5. **Scope** (1 sentence): transferable design principles for AI–CAS integration in mathematics assessment; the causal efficacy of the feedback is the subject of a separate randomised study (point to Paper 2).

---

## 1. Introduction (~900 words)

**Section goal:** establish the problem, the gap, and the contributions. General to particular in four moves.

- **1.1 Automated assessment in university mathematics.** Massification, need for feedback at scale; STACK as the de facto standard for CAS assessment (cite Sangwin). Acknowledge the strengths: symbolic equivalence, parametric generation, potential response trees.
- **1.2 The problem.** Three limitations experienced in practice (from slide 4): (i) symbolic equivalence misses the didactic information in the *process*; (ii) binary marking → no partial credit, no error localisation; (iii) no misconception detection → generic feedback. Illustrate with a small example (a wrong determinant answer: STACK says "incorrect", and nothing more).
- **1.3 The research gap.** Recent LLM-feedback work (2023–2026) largely ignores CAS grounding (uncontrolled hallucination) AND didactic grounding (no theoretical framework for error analysis); STACK work stays inside the symbolic paradigm. Nobody bridges full architecture + didactic theory + field needs from an under-represented context (sub-Saharan Africa).
- **1.4 Research questions and contributions.**
  - **RQ1:** What needs do lecturers and students who use STACK express with respect to AI-assisted assessment? (→ §5)
  - **RQ2:** What architecture connects CAS verification, AI diagnosis and didactic frameworks into a coherent adaptive assessment ecosystem? (→ §6)
  - **RQ3:** How do stakeholders perceive the tools produced by this design? (→ §7)
  - Contributions: C1 needs→requirements mapping (table); C2 reusable three-layer pipeline; C3 integrated two-sided ecosystem (lecturer/student); C4 design principles (DP1–DP5).
- Outline of the paper.

⚠️ *Trap: do NOT promise learning gains — this paper does not measure them. Frame C1–C4 as design and feasibility contributions.*

## 2. Background and Related Work (~1,200 words)

- **2.1 CAS-based assessment and STACK.** How it works (Maxima, PRTs), strengths, literature on use; documented limitations (final-answer feedback, authoring effort).
- **2.2 AI and LLM feedback in mathematics education.** The 2023–2026 wave: LLM tutors, automated marking, hallucination and reliability; LLM-as-Judge as a quality-control pattern; positioning: we use the CAS as a guard-rail on the LLM, not the reverse.
- **2.3 Error analysis frameworks.** Newman Error Analysis (Reading, Comprehension, Transformation, Process Skills, Encoding) — justify the choice: operationalisable as automatic classification categories; briefly note competitors (misconception taxonomies, SOLO).
- **2.4 Learning analytics dashboards for mathematics.** Difficulty and discrimination indices, visualisation for lecturers; the missing integration with error diagnosis.
- **2.5 Gap synthesis** (½ page, can be a table): no approach combines {CAS, LLM, didactic framework, analytics, adaptivity} — our position at that intersection.

## 3. Theoretical Framework (~800 words)

**Goal:** this is what separates the paper from "we plugged GPT into an LMS". Draws on slides 5 and 13.

- **3.1 The praxeological gap.** Anthropological Theory of the Didactic (Chevallard): praxeology [Task / Technique / Technology / Theory]. Core argument: STACK assesses the *task* (the outcome); the *technique* (the student's reasoning) and its justifying *technology* remain invisible. AI as a diagnostic layer makes the technique assessable → "closing the praxeological gap".
- **3.2 The Didactics–AI–CAS triangle.** Conceptual figure (slide 5, redrawn properly): CAS = deterministic mathematical truth; AI = interpretation of reasoning and natural language; Didactics = the frameworks that constrain what the AI looks for (Newman categories, expected reasoning steps). Each vertex corrects a weakness of the other two.
- **3.3 AI as didactic mediator.** Formulating the Trieste conclusion: AI translates the CAS's symbolic verdict into a pedagogically structured explanation, and translates the student's informal work into categories the lecturer can analyse.

## 4. Methodology (~900 words)

- **4.1 Design-Based Research.** Rationale (authentic problem, theory↔field iterations, production of design principles); cite McKenney & Reeves / the DBR Collective. Cycle diagram: **Cycle 1** = needs analysis (MMUST) → requirements → prototypes; **Cycle 2** = prototype deployment → perceptions → refinement (and → the randomised study, out of scope here).
- **4.2 Setting and participants.** MMUST (Masinde Muliro University of Science and Technology, Kenya): public university, mathematics courses using STACK. **Collection: 6 October – 12 November 2025.**
  - **Students:** n = **100** (pre) and n = **32** (post); 19 individuals matched across both waves. 65% in year 4 or above; 68% male; **63% access STACK on a smartphone only**.
  - **Lecturers:** n = **11** (pre) and n = **7** (post); 5 Lecturers, 4 Teaching Assistants, 1 Senior Lecturer, 1 STACK content developer; **class sizes 40–150 (6), 150–300 (4), > 300 (1)**.
  - Convenience recruitment among STACK users in the relevant courses (Differential Calculus, Linear Algebra I–II, Analytical Geometry, Integral Calculus, etc.).
  - *Under-represented context — make this explicit and make it count: needs identified in a resource-constrained environment (smartphones, unreliable connectivity, very large cohorts) strengthen transferability.*
  - 📄 All figures and verbatims: [`donnees-enquetes.md`](donnees-enquetes.md).
- **4.3 Instruments and collection.** Four online surveys (Google Forms), pre and post × students and lecturers, mixing scale items and open questions; plus individual interviews **[n to be confirmed]**. Describe each instrument briefly and its purpose.
  - ⚠️ **Instrumentation limitation to declare honestly:** the pre and post waves do **not** use the same scales (pre: numeric 1–7; post: 5-level ordinal labels) or the same item wording. **No matched pre/post analysis is computable.** The two waves are reported as separate descriptives. Present this as the lesson from cycle 1 that directly motivated the matched instrumentation of the randomised trial (Paper 2) — that is DBR logic, not a concealed flaw.
- **4.4 Analysis.** Thematic analysis of open responses and interviews (gap categories); descriptives for scale items (M, SD, % favourable); triangulation of lecturers and students. Selection check on the matched subsample (§7.1).
- **4.5 Ethics.** Informed consent collected in all four instruments (100% consenting; the student wording covers anonymity, confidentiality and withdrawal without penalty). Institutional approvals **[to be completed: IERC MMUST / NACOSTI — number and date]**. Anonymisation: emails and phone numbers were collected solely for pre/post matching, removed from the analysed datasets and excluded from any deposit.

⚠️ *Still to retrieve before drafting: the interview guides, the number of interviews, and the ethics approval references. An iJMEST reviewer will ask for them.*

## 5. Findings I — Needs Analysis (~1,100 words)

**Sources: "Pilot Study in Kenya - Summary"** (category structure, to be reused as is) **+ the pre-surveys** ([`donnees-enquetes.md`](donnees-enquetes.md) §3, figures and verbatims ready to copy).

- **5.1 Gaps identified by lecturers** (8 categories): (1) limited insight into student errors; (2) time-consuming manual analysis; (3) no analytics/visualisation; (4) insufficient progress tracking; (5) no AI feedback or recommendations; (6) weak support for pedagogical decisions; (7) need for training and simplicity; (8) expectation of AI *integrated into* STACK. One or two verbatim quotes per major category.
  - **Quantitative anchors (T-pre, n = 11):** **64% use no digital tool at all** to analyse STACK data; among them **6/7 cite unawareness of available tools** and 5/7 lack of training; only 27% analyse their data often or at every assessment; the challenges cited are **lack of time (4/4)** and **finding student errors (3/4)**; if a simple tool existed, 6/7 would want **progress over time** and 4/7 **errors and misconceptions**.
  - **Recommended opening verbatim:** *"When I want to analyze my data to the core, beyond the scores — to identify the specific errors made by my students"* (T-post).
- **5.2 Gaps identified by students** (5 categories): (1) marking perceived as unfair/inaccurate (syntax, unrecognised alternative methods); (2) insufficient explanatory feedback; (3) difficulty identifying one's own conceptual weaknesses; (4) weak support for reflection; (5) need for personalised, adaptive practice.
  - **The central quantitative result (S-pre, n = 100, 1–7 scales) — the praxeological gap, measured:** the weakest item in the whole instrument is **"I clearly understand *why* my answer is marked incorrect": M = 4.59 (SD 1.61), median 4, only 50% above the midpoint** — while general trust in STACK reaches 5.54 and perceived helpfulness of its feedback 5.56. Students **accept STACK but do not understand its verdicts.** Complete with perceived fairness towards alternative methods (5.19) and confidence in its evaluation of reasoning (5.07).
  - **Recommended opening verbatim (§1.2 or §5.2):** *"Just because I wrote x+y and stack says y+x doesn't mean am wrong."* — and, for the epistemic cost: *"An exact example from the notes and it's marked wrong. That means even my lecturers are wrong."*
  - **Expectations of AI before any use:** 92% expect AI to help them target their weak areas (M = 6.02); 87% would follow its recommendations. Recall this in §7 as an interpretive guard-rail (expectancy effects).
  - One student spontaneously formulates the adaptive loop of §6.3.3 before ever seeing it: *"It would be nice if STACK gave extra practice questions in my weak areas."*
- **5.3 From gaps to design requirements.** **Table 1 (the centrepiece of the paper)**: Gap | Pilot evidence | Design requirement | Intended educational benefit — the table already exists in the pilot summary; condense it. Derive five **design principles**:
  - **DP1 — Diagnosis beyond the verdict:** every assessment produces an error category and an explanation, not just a mark.
  - **DP2 — Symbolic truth as guard-rail:** no AI claim about correctness may contradict the CAS.
  - **DP3 — Structured, actionable feedback:** fixed format (answer / reasoning / verdict), addressed to the student.
  - **DP4 — Actionable analytics for the lecturer:** Newman aggregations, psychometric indices, longitudinal tracking.
  - **DP5 — Human control:** the expert can correct the AI, and those corrections retrain the system (few-shot).

## 6. System Design — The STACK-AI Ecosystem (~1,800 words; technical core)

**Goal:** show *how the components connect* (the original motivation for the paper). Each subsection points back to the DPs it realises.

- **6.1 Overview.** **Figure 2: ecosystem architecture** (slides 8 + 13, redrawn): two applications on a real-time backend (Convex) — *STACKAI Math Educator* (lecturer side) and *STACK-AI-Math-Course* (student side) — sharing submission data.
- **6.2 STACKAI Math Educator (lecturer side — DP4).** Real-time analytics dashboard; automated Newman classification of errors; grade distribution, per-item difficulty and discrimination indices; GPT+RAG assistant for contextualised diagnostic explanation. (From slides 7–8.)
- **6.3 STACK-AI-Math-Course (student side).**
  - **6.3.1 Parametric problem generation:** 16+ topics (linear algebra, calculus), skeletons × random parameters → unlimited practice and isomorphic versions.
  - **6.3.2 The three-layer grading pipeline (DP1–DP3)** — **Figure 3** (slide 10, redrawn):
    - *Layer 1 — CAS verification:* deterministic computation of ground truth (JavaScript CAS libraries: nerdamer/mathjs) and equivalence checking of the final answer.
    - *Layer 2 — AI grading:* an LLM (Gemini 2.5 Flash / GPT-4o) evaluates the reasoning, producing feedback structured in three sections plus an error type (Newman-inspired categories).
    - *Layer 3 — LLM-as-Judge:* a second LLM applies three alignment checks (relevance to the problem, mathematical accuracy, grade consistency), grounded on the CAS truth and on few-shot expert corrections.
  - **6.3.3 Adaptive loop:** each submission updates a per-topic mastery score; the recommendation engine crosses mastery with error types to select the next problem (difficulty/type).
  - **6.3.4 Human expert in the loop (DP5):** correction moderation interface; approved corrections become alignment examples for both the grader and the judge.
  - **6.3.5 Handwriting recognition:** handwritten submission → OCR → pipeline (mention briefly).
- **6.4 Design↔needs traceability.** **Table 2**: component → DP → originating gap (closing the DBR loop).
- **6.5 Implementation choices and scope.** Technical honesty: symbolic verification uses server-side JavaScript CAS libraries (nerdamer), not Maxima/STACK itself — discuss this as an architectural choice (latency, serverless integration) and position native STACK/Maxima integration as future work. **Do not let a STACK reviewer discover this on their own.**

## 7. Findings II — Deployment and Stakeholder Perceptions (~900 words)

**Goal:** RQ3 — feasibility/perception evaluation (NOT causal efficacy).
📄 **Every figure in this section is ready in [`donnees-enquetes.md`](donnees-enquetes.md) §4.** Do not recompute: copy.

- **7.1 Deployment and respondents.** Both prototypes were used at MMUST from **6 October to 12 November 2025**, across Differential Calculus, Linear Algebra I–II, Analytical Geometry and Integral Calculus. Post surveys: **32 students** and **7 lecturers**.
  - **Selection check to report (it strengthens credibility):** the 19 students who answered both waves do not differ appreciably from the rest on baseline attitudes (|Δ| ≤ 0.42 across 12 seven-point items), but are **further along in the programme (90% in year 4 or above, against 59%)**. Own the self-selection as a limitation.
  - Restate the instrumentation limitation from §4.3 here: **no pre/post comparison is possible**; the two waves are descriptive and separate.
- **7.2 Student perceptions (n = 32).** Suggested order of presentation, strongest to most qualified — **Table 5** (item | % favourable | n):
  - **91% report a positive perceived impact** on their understanding or performance (34% "strongly positive");
  - **88% found the AI feedback helpful** to their understanding;
  - **84%** found the step-by-step reasoning and hints useful;
  - **78% report understanding their mistakes better than with traditional feedback** — 22% neutral, **no disagreement at all** (the result most directly tied to DP1);
  - 75% had their expectations met; 72% rate it more helpful than other online tools;
  - usability: 91% clarity of questions, 84% intuitive buttons, 78% ease of navigation (6% "difficult").
  - **Open-ended themes** (short, mobile-typed — do not over-interpret): hints before answering (dominant theme, ≥ 8 spontaneous mentions), immediate feedback localising the error, and the "Explain Your Reasoning" space — *"Gave me a thinking space to validate my take on the question"*.
  - **Counterpoints to quote explicitly** (they make the paper credible): *"For me it was a little difficult, up to now I am having trouble understanding how to explain my answers"* — articulating one's reasoning carries a cognitive cost; *"It sometimes does not show some steps… you might miss the steps"*; two frankly negative respondents (*"It is not accurate"*, *"It helps partially"*).
  - ⚠️ **Interpret in the light of §5.2:** pre-use expectations were already at 92% — part of the post-use positivity is expectancy and novelty. Say it before a reviewer does.
- **7.3 Lecturer perceptions (n = 7).** Unanimous on adoption, more measured on effectiveness:
  - **100%** found the tool easy to pick up, consider it a good idea for their practice, hold a positive attitude, and would recommend it to colleagues; 86% intend to reuse it next semester;
  - **trust in the analytics (difficulty, discrimination, error patterns): M = 5.86/7 (SD 0.69), 7/7 ≥ 5**; overall satisfaction M = 5.71/7;
  - improvement in understanding student difficulties: 43% "very/extremely effective", 57% "quite effective" — **real but not rapturous enthusiasm; report it as such**;
  - 71% would use the insights to adjust their teaching — **one respondent strongly disagrees**; mention it;
  - **chat vs dashboards:** chat gets them to answers faster (M = 5.14) than dashboards (M = 3.86), yet stated preference goes to dashboards (43%) or both equally (43%). Reading for §8: chat serves the targeted query, the dashboard the overview.
  - **NEA categories**: judged clear by the 4 lecturers who answered — an encouraging signal, too thin a base for a validity claim.
  - **Criticisms and adoption conditions (to quote):** *"The aspect of just giving the answers without steps"* (2 lecturers — step-level detail was not yet exposed on the lecturer side → cycle 2 refinement); *"My large class size of over 100 students"*; *"It takes too long to synchronize"*; training and ICT support cited by 5/5; available resources highly dispersed (M = 4.57, **SD 2.07**, one respondent at 1); *"Ideally it should be central IT but since the institution is cash-strapped, possibly research projects"*.
- **7.4 The three-model comparison — frame it, do not sell it.** Students rate GPT-4o 4.12/5, GPT-4o-mini 4.25/5, GPT-3.5-Turbo 4.03/5; stated preference goes to GPT-4o (14 mentions) then GPT-4o-mini (8). **These differences are within noise and exposure to models was neither controlled nor randomised** (one respondent: *"GPT-4o, that's what I had"*; another: *"I didn't use it"*). The conclusion to write: *students do not reliably discriminate feedback quality between models in free use* — which **motivates the randomised protocol of Paper 2**. Framed that way it is an argument, not a confession.
- **7.5 Illustrative vignette** (box): the path of a real anonymised submission — determinant problem → wrong answer → CAS ground truth → three-section feedback → error type → mastery update → recommendation → lecturer view. This is the concrete demonstration of "how the components connect".
- **7.6 Platform usage descriptives** (if available at submission): number of submissions, judge/grader agreement rate, error-type distribution. *(Export script: `experiment:exportSubmissions` and Convex tables.)* **[to be produced]**

## 8. Discussion (~900 words)

- **8.1 Answers to the RQs** (synthesis in three paragraphs).
- **8.2 The three-layer pipeline as a reusable pattern.** Argument: deterministic where possible (CAS), generative where necessary (explanation), validated where risky (judge). Transferable to other STEM subjects.
- **8.3 A praxeological reading of the result.** Back to the framework of §3: what the ecosystem makes visible (technique, technology) and what remains out of reach (theory).
- **8.4 Limitations.** (i) single site, modest samples (100/32 students, 11/7 lecturers) → cautious transferability, no statistical generalisation; (ii) perceptions ≠ learning: no causal claim — the randomised trial (pre-registered protocol) is under way, point to Paper 2; (iii) **pre and post instruments not matched on scales → no change test computable** (an acknowledged cycle-1 limitation, corrected in the Paper 2 protocol); (iv) **self-selection of post respondents** (90% in year 4 or above) and very high pre-use expectations (92%) → plausible expectancy and novelty effects; (v) LLM non-determinism and cost; model versioning; (vi) JavaScript CAS ≠ Maxima: narrower symbolic coverage; (vii) platform language (English) vs multilingual contexts; (viii) real usage was not logged during the pilot (usage descriptives come from later instrumentation).
- **8.5 Implications** for the STACK community (towards LLM-augmented PRTs?) and for deployments in resource-constrained settings.

## 9. Conclusion and Future Work (~400 words)

Restate the four contributions; future work: (1) the randomised study on RLAIF + outcome-based reward (Paper 2 — one sentence, no details); (2) native STACK/Maxima integration; (3) embeddings and spectral clustering of error profiles, early intervention (slide 11); (4) multi-site deployment.

---

## Figures and tables

| # | Title | Source | Status |
|---|---|---|---|
| Fig. 1 | DBR cycles of the study | to create | ☐ |
| Fig. 2 | Ecosystem architecture (2 apps + backend + data flow) | redraw slides 8/13 | ☐ |
| Fig. 3 | Three-layer grading pipeline | redraw slide 10 | ☐ |
| Fig. 4 | Didactics–AI–CAS triangle | redraw slide 5 | ☐ |
| Fig. 5 | Screenshots (Newman dashboard; three-section feedback) | platform | ☐ |
| Fig. 6 | S-pre baseline items ranked by mean (highlights the "understand why" trough at 4.59) | `donnees-enquetes.md` §3.2 | ☐ to plot |
| Table 1 | Gaps → evidence → requirements → benefits (lecturers + students) | pilot summary (exists) | ◐ |
| Table 2 | Components → design principles → originating gaps | to derive | ☐ |
| Table 3 | Related-work synthesis (the literature gap) | to create | ☐ |
| Table 4 | Sample characteristics (4 instruments: n, period, demographics) | `donnees-enquetes.md` §1–2 | ✅ data ready |
| Table 5 | Post-deployment perceptions, students and lecturers (% favourable) | `donnees-enquetes.md` §4 | ✅ data ready |

## Pre-drafting / pre-submission checklist

- [x] **Exact n's** for the pilot (100/32 students, 11/7 lecturers) + collection period (6 Oct – 12 Nov 2025) → §4.2
- [ ] **Pilot ethics approval** (IERC MMUST / NACOSTI: number + date) — consent is documented, the institutional approval still needs citing
- [x] **Number of individual interviews** — resolved from the pilot summary: all **7 MMUST mathematics lecturers** were interviewed individually (of the 11 lecturers who took part overall)
- [ ] **Interview guides / topic schedule** — still not located; needed for §4.3
- [ ] ⚠️ **Resolve the discrepancy in the pilot summary PDF**: it states that 100 students "participated in both pre- and post-surveys", but the post-survey export contains 32 responses. The draft uses 32. Correct the summary document if it is circulating with supervisors.
- [x] Process the four xlsx files (pre/post × students/lecturers): descriptives + verbatims → [`donnees-enquetes.md`](donnees-enquetes.md)
- [ ] Export platform usage descriptives (submissions, judge override rate, error types)
- [ ] Produce depersonalised copies of the four xlsx files (strip emails and phone numbers) before any data deposit
- [ ] Choose and anonymise the submission used in the §7.5 vignette
- [ ] Redraw the four figures as vector graphics (no slide screenshots)
- [ ] Check terminological consistency: one ecosystem name ("STACK-AI"), stable names for the two tools
- [ ] Decide: Gemini 2.5 Flash vs GPT-4o — describe both honestly (the grader is configurable) rather than hiding one
- [ ] iJMEST guidelines: format, length, reference style
- [ ] Review by supervisors + a colleague from the STACK community

## Anticipated reviewer objections

1. **"Where is the evidence of learning?"** → Owned from the introduction onwards and in §8.4: this is a design paper; the pre-registered randomised trial is separate, ongoing work.
2. **"This isn't really STACK"** (no Maxima) → §6.5 addresses it head-on; the title must not oversell the STACK integration (prefer "CAS-based assessment" to "STACK" in the title if needed).
3. **"LLMs hallucinate"** → §6.3.2: that is precisely the argument for layers 1 and 3 (CAS guard-rail + judge).
4. **"Small sample, single site"** → owned as intrinsic to DBR; the contribution is the needs→design mapping and the architecture, not statistical generalisation.
5. **"Novelty?"** → related-work table (Table 3): the intersection {CAS + LLM + didactics + analytics + adaptivity + African field site} is unoccupied.
6. **"Your pre and post surveys are not comparable"** → true, and declared up front in §4.3 and §8.4: instruments not matched on scales, two separate descriptive waves. Present it as the cycle-1 lesson that produced the matched instrumentation of Paper 2 — the DBR loop working as intended.
7. **"Your model comparison is worthless"** → §7.4 says so before the reviewer does: uncontrolled exposure, differences within noise; the finding *is* the absence of reliable discrimination, and it motivates the randomisation in Paper 2.
8. **"Your post results are just novelty enthusiasm"** → §5.2 documents pre-use expectations already at 92%, §7.2 restates it explicitly, §7.1 reports the selection check. Acknowledging the risk disarms the criticism; hiding it invites it.
