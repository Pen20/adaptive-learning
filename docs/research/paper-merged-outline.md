# Merged Paper — Outline

**Version:** 0.2 — 29 August 2026 (rewritten around the 50/50 dual-channel mark; v0.1 wrongly proposed making the reasoning score non-summative)
**Supersedes:** [`papier1-squelette.md`](papier1-squelette.md) (DBR/iJMEST) and the study framing in [`protocole-etude-quiz.md`](protocole-etude-quiz.md), which are retained as source material, not as separate submissions.
**Data already held:** [`donnees-enquetes.md`](donnees-enquetes.md) (MMUST pilot, Oct–Nov 2025).
**Status:** design document. Nothing here is drafted prose yet.

---

## 0. The thesis in one sentence

A student's mark can be split into two channels with **disjoint authority** — a CAS channel that alone decides whether the answer is right, and a fiche-constrained AI channel that alone credits the reasoning — so that mathematics assessment can finally award method marks at scale without the AI ever being able to overturn, soften, or contradict the symbolic verdict.

The deterministic path is not preserved by keeping AI out of the grade. It is preserved by **fencing** what each channel may decide.

---

## 1. What this paper takes from each draft, and what it drops

| From Paper 1 (DBR / iJMEST) | Decision |
|---|---|
| Pilot problem statement: students accept STACK but do not understand its verdicts (M = 4.59/7 vs 5.54/7 general trust) | **Keep** — motivating measurement, and the baseline for RQ4 |
| Pilot finding: *"Overemphasis on final answers… STACK primarily evaluates final responses rather than the reasoning process"* → requirement: *process-aware assessment* | **Keep and promote** — this is now the paper's central design warrant (§3.1) |
| Gap → design-requirement table | **Keep, compressed** to the student-side rows; one table |
| Praxeological framing (Chevallard: task / technique / technology / theory) | **Keep, demoted** to ~2 paragraphs justifying the fiche schema |
| Two-cycle DBR narrative, cycle diagrams | **Drop** — one paragraph |
| Lecturer analytics dashboard, Newman aggregation, psychometric indices | **Drop entirely** — separate paper, separate audience |
| Post-deployment perception tables (n=32 / n=7), model comparison | **Drop** — replaced by the new study |
| Handwriting OCR | **Drop** — one sentence in future work |

| From Paper 2 (RLAIF / IJAIED) | Decision |
|---|---|
| CAS-marked isomorphic pre/post instrument (`convex/studyQuiz.ts`) | **Keep** — measurement backbone |
| Fixed difficulty sequence, hints/solutions disabled, 20 s reading floor, server-side locks | **Keep** — internal-validity apparatus |
| Latin square, pool freezing, pseudonymised export (`convex/experiment.ts`) | **Keep** — reuse the instrumentation |
| Background-judge-in-control-arm pattern | **Keep** — reused in §6 to hold scoring constant across arms |
| RLAIF Best-of-N vs single-pass; judge-confidence vs outcome-reward (H1–H3) | **Drop** — separate technical paper |
| Day-7 retention | **Keep as secondary** |
| Human correction moderation (`convex/corrections.ts`) | **Promote from optional to required** — see I8 |

---

## 2. Topic decomposition — how the problem statement is partitioned

This is what makes an AI-awarded mark defensible, so it is a first-class contribution, not implementation detail. Already built in `src/data/pedagogy/`.

A topic is not a bag of problems; it is a **versioned evaluation fiche** (`schema.ts`):

```
Topic  (ficheId, ficheVersion)
 ├─ learningObjectives[]        what the topic is for
 ├─ prerequisites[]             what must already hold
 ├─ taskTypes[]                 the kinds of question the generator may emit
 │   └─ acceptedTechniques[]    the legitimate methods for that task
 │       └─ reasoningComponents[]   ordered steps, each with
 │            · acceptableEvidence[]      what counts as having done it
 │            · insufficientEvidence[]    what looks like it but is not
 ├─ evaluationRubric.reasoningCriteria[]  weighted criteria — THE MARKING RUBRIC
 ├─ equivalencePolicy           what representational differences are NOT errors
 ├─ scoringPolicy               who may award what, and the full/zero credit rules
 ├─ feedbackPolicy              tone, ordering, max corrections, phrasing
 └─ misconceptions[]            coded (e.g. DET-M3), each with
      · observableIndicators[]      how it shows up in written work
      · feedbackStrategy.prompt     the Socratic question to ask
      · remediationStrategy         which repair ladder to run
```

**Current coverage:** 18 distinct fiches serving 26 registry entries; 41 distinct coded misconceptions. `determinants` is authored to depth (3 task types, 6 techniques, 7 misconceptions); the other 17 sit at template depth (1 / 1 / 2). See §9.

**Why this matters now that the AI awards marks.** The fiche is not a prompt-engineering convenience — it is the **published marking rubric**, versioned and human-authored. The AI is never asked *"how good is this reasoning?"* It is asked *"do the submitted steps satisfy these named criteria, and if not, which of these named misconceptions applies?"* An institution can inspect the rubric, a lecturer can amend it, and a student can be shown it. That is the ordinary standard for any marking scheme that carries credit, and it is the standard the AI channel must meet because it carries credit.

---

## 3. Two channels, disjoint authority

| | **Channel 1 — Answer** | **Channel 2 — Reasoning** |
|---|---|---|
| Worth | 0.5 | 0.5 |
| Decided by | CAS only (`convex/cas.ts`) | Fiche-constrained LLM only |
| Scale | {0, 0.5} | {0, 0.5} |
| May the other channel influence it? | **No** | **No** |
| Basis | symbolic/numeric equivalence to computed ground truth | `evaluationRubric.reasoningCriteria` at the pinned `ficheVersion` |
| Recourse | re-computation | human expert review (`corrections.ts`) |

The four reachable outcomes are already implemented in `buildVerdictSection`, and each is pedagogically distinct: 1/1; 0.5/1 *right answer, unsound method*; 0.5/1 *sound method, wrong answer*; 0/1. **That second-and-third distinction is the entire point** — it is the partial credit the pilot students asked for, and no CAS-only system can express it.

### 3.1 Why 50/50 is the finding, not a compromise

Three independent warrants, all already in hand:

1. **The field study generated it.** The pilot's student-level design-requirements table names *overemphasis on final answers* as a gap and *process-aware assessment that values intermediate reasoning and method selection* as the requirement. Verbatims: *"Mark the steps not final answer"*, *"Marking the final answers only"*, *"The partial marking of questions I really doubt it since sometimes you feel you deserve all the marks."*
2. **It matches how mathematics is actually marked.** Human markers award method marks and accuracy marks separately. A design that credits only the final answer is the anomaly; STACK adopted it because a CAS can verify answers and cannot read arguments. The AI channel removes that constraint, so the anomaly no longer has to be tolerated.
3. **It makes the system falsifiable.** A decorative explanation layer cannot be wrong in any way that matters. A mark can be wrong, and can be shown to be wrong — which is why §7 carries a reliability study, and why that study is the paper's hardest evidence.

### 3.2 The eight invariants

Numbered, testable, each mapped to code. This is the paper's Table 2.

| # | Invariant | Enforced at |
|---|---|---|
| **I1** | **Channel separation.** The answer mark is a pure function of the CAS result. Any final-answer score the model proposes is discarded whenever the CAS verdict is computable. | `grading.ts:enforceHalfPointStructure` / `finalAnswerScoreFromCas` |
| **I2** | **Bounded reasoning authority.** The model's award is discretised to {0, 0.5}, is granted only against the fiche's `reasoningCriteria`, and cannot alter Channel 1. | `asHalfPoint`, `scoringPolicy.maximumReasoningScore` |
| **I3** | **Derived verdict.** The verdict sentence is a pure function of the two sub-scores. The model supplies one input; it never writes the sentence, and the arithmetic is independently checkable. | `grading.ts:buildVerdictSection` |
| **I4** | **Non-contradiction.** The reasoning narrative may localise a divergence; it may not assert, imply, or dispute the correctness of the final answer. That is Channel 1's to state. | section replacement + `feedbackPolicy` |
| **I5** | **Closed vocabulary.** Technique, step and misconception identifiers must resolve inside the topic's fiche at the declared `ficheVersion`. Unresolved → diagnosis rejected, degrade to generic feedback, log the rejection. | **not yet enforced** — §9 |
| **I6** | **Deterministic routing.** The remediation sequence is a pure function of the misconception code and the fiche. No model call selects it. | `remediation.ts:buildActivities` |
| **I7** | **Deterministic gating.** Every gate in the remediation ladder is decided by CAS equivalence or by a closed-form choice. No free-text auto-pass. | **not yet enforced** — §9 |
| **I8** | **Contestability and reproducibility.** Every reasoning mark is reviewable by a human expert; overrides are logged and version-linked. `ficheId`, `ficheVersion`, `PROMPT_VERSION`, model id, temperature and CAS result are recorded per submission. | `corrections.ts`, `experimentGradingLogs` |

I8 is not administrative housekeeping. Once the AI awards credit, an appeal route stops being a nice extra and becomes a condition of legitimacy — and the override rate it produces is itself a reportable measure.

---

## 4. What the AI feedback should look like

Four blocks, fixed order, fixed labels. Both marks are shown to the student, separately, always.

### 4.1 Anatomy

| Block | Author | Carries a mark? | Content rule |
|---|---|---|---|
| **Final Answer** | deterministic | 0.5 (CAS) | Sub-score plus the CAS-verified answer, verbatim |
| **Reasoning steps** | **model, bounded** | 0.5 (model) | Sub-score, then: acknowledge valid work first; localise the *first genuine divergence*; name the technique; **at most one** actionable correction; never dispute Channel 1; never call an equivalent form an error |
| **Verdict** | deterministic | — | Pure function of the two sub-scores |
| **Next step** | deterministic routing, generated phrasing | — | Names the misconception, opens the repair ladder |

The Reasoning constraints are not prompt suggestions — they are `feedbackPolicy` fields (`acknowledgeCorrectWorkFirst`, `identifyFirstGenuineDivergence`, `maximumActionableCorrections: 1`, `doNotCallEquivalentExpressionsErrors`, `preferredReasoningPhrases`), per-topic and versioned.

**Transparency requirement.** Because two different authorities award the two halves, the interface must make that visible — the student should be able to see that the answer mark came from symbolic computation and the reasoning mark from a rubric-constrained model, and should be able to contest the second. This is a design commitment worth stating explicitly in the paper; it is also the honest answer to "do students know an AI marked them?"

### 4.2 Worked example — Figure 2, with deterministic spans shaded

*Problem:* find k such that the matrix [[2, 3], [4, k]] is singular.
*Student:* "det = 2k + 12; set 2k + 12 = 0; so k = −6." Final answer k = −6.

```
**Final Answer:**  (0/0.5)  Your final answer does not match the CAS-verified     [CHANNEL 1 — CAS]
answer k = 6. Compare your final value, signs, and listed solutions with
this verified result.

**Reasoning steps:**  (0/0.5)  Your setup is right: a 2x2 matrix is singular    [CHANNEL 2 — model,
exactly when its determinant is zero. Your reasoning diverges when you             fiche-bounded]
expand the determinant — you wrote 2k + 12, but the 2x2 determinant
subtracts the anti-diagonal product, ad − bc, which gives 2k − 12.

**Verdict:**  Your score is 0/1: the final answer is not correct and the           [DERIVED]
reasoning does not yet justify the correct result. Start from the mistake
identified above, then recompute the final answer carefully.

**Next step:**  Guided correction — 2x2 determinant sign rule (DET-M3).      [DETERMINISTIC routing]
```

A second panel of the same figure should show the **0.5/1 method-mark case** — correct setup and valid technique, arithmetic slip at the last step — because that is the outcome STACK cannot produce and the one the pilot students were asking for.

What the model decided: half the mark, on published criteria, and one paragraph. What it could not decide: that k = 6, the arithmetic of the total, whether DET-M3 exists, or what happens next.

### 4.3 The loop that follows

DET-M3 deterministically selects a five-stage ladder — `concept_activation → guided_correction → focused_check → transfer_task → reflection` — each stage gated (I7), advancing only on a pass, terminating in a **CAS-marked isomorphic transfer item**. That terminal item is the paper's cleanest outcome measure (§7).

---

## 5. Research questions

- **RQ1 (design).** How can a mathematics assessment award credit for reasoning using a generative model while guaranteeing that the model cannot alter, contradict or soften the symbolic verdict? → the fiche as published rubric (§2), channel separation and I1–I8 (§3), the feedback contract (§4).
- **RQ2 (can the AI channel carry credit?).** Is the fiche-constrained reasoning mark reliable enough to count toward a grade? → agreement with blind expert marking against the ceiling set by expert–expert agreement; stability across repeated grading; out-of-vocabulary rate under I5; absence of length and language confounds; human override rate under I8.
- **RQ3 (learning).** Does misconception-targeted remediation, routed deterministically from the diagnosis, produce greater learning gain than the dual-channel mark with bounded feedback alone, and than the mark alone?
- **RQ4 (the pilot's own deficit).** Does the design move the item the MMUST pilot identified as the weakest in the whole instrument — *"I clearly understand why my answer is marked incorrect"*, M = 4.59/7 — using the same item and the same 1–7 scale? Secondary: does perceived fairness on alternative methods (5.19) and confidence that the system evaluates reasoning accurately (5.07) move with it?

RQ2 is now the paper's load-bearing question. RQ4 is what makes this one paper rather than two: the earlier study's measured deficit becomes this study's pre-registered target.

---

## 6. Study design

**Three arms, within-subject, one per topic**, Latin-square counterbalanced over order × condition, stratified by pre-test median. Reuses `convex/experiment.ts` with two new conditions.

| Arm | Student receives | Isolates |
|---|---|---|
| **A — Mark only** | Both sub-scores, CAS-verified answer, worked model solution. No AI narrative, no ladder. | baseline |
| **B — Bounded feedback** | A, plus the Reasoning narrative under the §4 contract | the value of the explanatory layer |
| **C — Full loop** | B, plus the deterministically routed remediation ladder | the value of closing the loop |

**Scoring is held constant across all three arms.** The AI awards the reasoning mark in arm A as well; only the *narrative* is withheld. This reuses the background-judge pattern already in `protocole-etude-quiz.md` and it removes what would otherwise be a serious confound — if arm A marked on the final answer alone, the contrast would bundle "richer feedback" with "a different grading scheme" and neither could be attributed. Note in the paper that this makes arm A a *dual-channel* baseline rather than a STACK replica; the STACK comparison is made argumentatively in §3.1, not experimentally.

The outcome measure is unaffected either way: pre/post quizzes are CAS-marked and binary in every arm (`studyQuiz.ts`), so the manipulated scoring never touches the dependent variable.

**Offline, no participants required — the ungrounded audit.** Re-grade the same submissions with I1–I5 disabled and have experts rate the output for mark contradictions, hallucinated misconceptions, and final-answer verdicts that conflict with the CAS. This quantifies exactly what the envelope prevents without exposing a student to it. It is the most persuasive single result available to this paper and it is nearly free.

**Sample.** Within-subject, 3 topics, d = 0.4, r ≈ .5, α = .05, power .80 → **n ≈ 52 complete**; recruit **80**. Site: MMUST, for continuity with the pilot. Ethics: IERC MMUST plus NACOSTI, 6–10 weeks.

**Consent addendum required.** Participants must be told that part of their mark is awarded by an AI system against a published rubric, and that they may contest it. This follows from I8 and from the Kenya Data Protection Act provisions on automated decision-making; it is also simply the right thing to disclose.

**One protocol change is mandatory:** `remediation.ts:startRemediation` currently throws whenever an active study assignment exists, so the present infrastructure cannot measure arm C at all. Gate it by condition instead of blocking it.

---

## 7. Measures

### 7.1 Primary — learning

Normalised gain g = (post − pre) / (max − pre) per student × topic, on isomorphic CAS-marked items. The instrument never touches the manipulated grader.

Model: `g ~ condition + pretest_c + topic + order + (1 | student)`; planned contrasts B−A, C−B, C−A, Holm-corrected. Pre-register on OSF before recruitment.

### 7.2 The reliability study (RQ2) — mandatory, because the AI awards credit

This is a distinct sub-study and should be reported as its own results section. It can run on pilot-phase data, before the main trial.

- **Sample:** ~300 submissions, stratified by topic and by CAS outcome — reasoning-quality distributions differ sharply between right-answer and wrong-answer submissions, and an unstratified sample will flatter the model.
- **Procedure:** two mathematics lecturers independently apply the same fiche rubric to award {0, 0.5}, blind to the AI score and to each other.
- **Report:** expert–expert agreement first (this is the **ceiling**, and it will not be 1.0 — say so before a reviewer does), then AI–expert agreement. Percent exact agreement, Cohen's κ, **and Gwet's AC1** — κ is unstable under the skewed marginals expected here, so pre-commit to reporting both.
- **Pre-specified acceptance threshold:** AI–expert agreement within 0.15 of expert–expert agreement, and κ ≥ 0.6. Declare this before looking.
- **Disagreement analysis by misconception code:** where does the model systematically over- or under-credit? This is more informative than the headline coefficient.

### 7.3 Stability, fairness, recourse

- **Stability:** re-grade 200 submissions three times at the production temperature and model version; report exact-match rate on the reasoning mark. Pre-specify ≥ 0.90. An unstable mark is an unfair mark, and LLM non-determinism is the obvious reviewer attack.
- **Length confound:** regress the reasoning mark on response length and word count, controlling for expert-rated quality. If longer answers score higher independent of quality, the channel rewards typing, not thinking.
- **Equity checks:** reasoning mark by device type (**63% of the pilot cohort were smartphone-only** — thumb-typed reasoning is shorter) and by self-reported confidence writing mathematics in English. Report these whatever they show.
- **Override rate (I8):** proportion of reasoning marks a human expert changes on review, and the direction of change.

### 7.4 Secondary — the loop

- **Repair rate** — pass rate on the ladder's terminal isomorphic transfer item, per misconception code. Answers "did the targeted remediation fix the targeted thing?", diagnostically rather than as one blunt number.
- **Attempts-to-pass** per ladder stage (needs logging; §9).
- **Out-of-vocabulary rate** — proportion of diagnoses rejected by I5.
- **Envelope activations** — how often I1 discarded a model-proposed final-answer score.
- **RQ4 items** — the 4.59, 5.19 and 5.07 items, same wording, same 1–7 scale.
- Cognitive load (abbreviated NASA-TLX), time-on-task, feedback reading time.

Note for the discussion: the reasoning mark feeds `masteryScore` and `outcomeReward`, so its reliability propagates into the adaptive signals. Whatever RQ2 returns bounds how much weight those downstream signals can bear.

---

## 8. Expected results — pre-specified

Stated as predictions so the paper is publishable either way.

1. **Expert–expert agreement will be meaningfully below 1.0** (predict κ ≈ 0.65–0.80). Marking reasoning is genuinely hard for humans too. Reporting this first reframes the AI result correctly: the question is not "is the AI perfect" but "is it as consistent as a second marker."
2. **AI–expert agreement close to, and plausibly at, that ceiling** on procedural criteria; **clearly below it** on criteria requiring judgement about whether an argument is complete. The `correct_but_incomplete` status is where I expect the model to struggle most.
3. **Stability ≥ 0.90** at production temperature — if it is not, the reasoning mark is not fit to carry credit and the paper must say so plainly.
4. **A detectable length effect** that survives controlling for quality. Predicting this and measuring it is much stronger than being asked about it in review.
5. **B > A on gain, small (d ≈ 0.2–0.3).** Explanatory feedback helps modestly; the pilot's own counterpoint (*"I am having trouble understanding how to explain my answers"*) warns that articulation carries a cognitive cost.
6. **C > B, larger than B − A.** The mechanism under test is that *acting on* a diagnosis beats *reading* one. If it fails, the finding is that diagnosis-without-practice is where the value already sits — still worth reporting.
7. **Repair rate varying sharply by misconception code.** Procedural and calculation codes (DET-M3, the sign rule) should repair well; conceptual codes should not. This heterogeneity tells the STACK community which misconceptions are worth authoring ladders for.
8. **Out-of-vocabulary rate materially above zero (5–15%).** The first quantification of how often a constrained LLM tries to leave its taxonomy, and precisely what I5 exists to catch.
9. **The ungrounded audit will show a non-trivial mark-contradiction rate.** Whatever the number, it is the headline justification for the envelope.
10. **RQ4 items improve over the 4.59 / 5.19 / 5.07 baselines.** Expect the largest single effect here, and be disciplined: it is a perception measure across two different samples, and pre-use expectations were already at 92%. Report as convergent, not confirmatory.

---

## 9. What must be built before recruitment

Ordered by how much each changes what the study can measure.

1. **Run the reliability study (§7.2) first.** If the AI channel cannot mark consistently, the 50/50 design does not survive review and the main trial would be measuring an instrument you cannot defend. This is now the gating task, ahead of everything else.
2. **Enforce I7 — real gating.** `remediation.ts:398` passes any free-text response of at least 12 characters, and four of five stages for every non-determinant topic have no expected answer. As it stands, "practises until mastery" is "types until length." Route text gates through `checkEquivalenceDirect`; convert the rest to closed-form choices.
3. **Fix substring matching.** `normalizeAnswer(response).includes(...)` marks `16` correct when the expected answer is `6`. Use CAS equivalence.
4. **Enforce I5 — validate identifiers against the fiche**, log rejections, degrade gracefully. Today an unrecognised code silently falls back to `misconceptions[0]`, sending the student to the wrong ladder. Fixing it unlocks the RQ2 out-of-vocabulary measure.
5. **Author two more fiches to determinants depth.** The study topics are determinants, eigenvalues and derivatives; the latter two are template stubs (1 task type, 1 technique, 2 misconceptions), so the arms would not deliver comparable interventions. Also DET-M5 and DET-M7 have no targeted activation and silently fall through to DET-M3's. **The fiche is now the published marking rubric — a stub rubric awarding real credit is not defensible.**
6. **Add the terminal isomorphic transfer item** to every ladder — creates the repair-rate measure.
7. **Gate remediation by condition** rather than blocking it during the study.
8. **Log per-stage attempts, retries and timings** into `remediationSessions`.
9. **Expose the appeal route (I8) in the student UI** and log overrides. `corrections.ts` exists but is admin-facing; if the AI awards credit, the student needs a visible way to contest it.

Not blocking, but before submission: reconcile `CLAUDE.md`, `README.md` and `studyPractice.ts:12`, which still describe an adaptive recommendation engine deleted in `5c27b32`; and clear the 74 ESLint errors, since the artefact will be public.

---

## 10. Where to publish

### Primary recommendation — *Computers and Education: Artificial Intelligence* (Elsevier, open access)

Best fit on scope: an AI-in-education system, a design rationale, and empirical evaluation with real learners. The dual-channel framing lands directly in its active stream on generative AI in assessment, and — importantly under the 50/50 design — its reviewers are equipped to judge an inter-rater reliability argument. Faster than the flagship. Costs an APC (verify the current figure) and carries less standing than *Computers & Education*.

### If the results are strong — *Computers & Education* (Elsevier)

Higher standing, no APC on the subscription route, but it will want a clear learning-outcome result and will not accept architecture alone. **Decision rule, now two-part:** submit to *C&E* only if RQ2 clears its pre-specified threshold **and** the C−A contrast reaches d ≥ 0.3. If the reliability result is good but the learning result is null, *CAEAI* — the reliability study and the ungrounded audit carry the paper on their own. If the reliability result fails its threshold, that is still publishable, but it becomes a cautionary paper about AI-awarded marks and the venue conversation changes entirely.

### ACM alternatives

- ***ACM Transactions on Interactive Intelligent Systems (TiiS)*** — good fit if you foreground channel separation and I1–I8 as a reusable design pattern for bounded delegation to a generative model. Weaker mathematics-education readership.
- ***ACM Learning @ Scale*** — fast, visible, deadline-driven, ~10 pages. The scale and resource-constraint angle lands, but the fiche schema and the reliability study will not both fit.

### Also viable (Elsevier)

*Assessing Writing* is the wrong subject but the right methodological neighbourhood — worth reading its AI-scoring reliability papers for how they report agreement, since that literature is a decade ahead of ours on this exact question. *International Journal of Human-Computer Studies* if the co-design becomes central. *Computers & Education Open* as an OA fallback.

### Two warnings

**Reach.** None of these venues is read by the STACK community, which lives in *IJMEST* (Taylor & Francis) and the STACK/Moodle circuit. If official STACK integration is the goal, this paper is the evidence base and a short follow-up note or conference talk is the delivery mechanism. One paper cannot do both jobs.

**Conformance.** The abstract will claim the deterministic path is preserved, but the symbolic layer is nerdamer/mathjs (`convex/cas.ts`), not Maxima. A reviewer will find this. Either implement Channel 1 against real Maxima/STACK for at least one topic and report the conformance check — bounded work, much the stronger option — or retitle to "CAS-based assessment" and state the STACK relationship as design-compatible rather than realised. Decide before drafting the abstract, not after review.

---

## 11. Working titles

- *Two Channels, Disjoint Authority: Awarding Method Marks with AI Without Compromising CAS Verification*
- *Method Marks at Scale: A Dual-Channel Design for AI-Assisted Mathematics Assessment*
- *The CAS Decides the Answer, the AI Credits the Reasoning: Bounded Delegation in Automated Mathematics Assessment*
