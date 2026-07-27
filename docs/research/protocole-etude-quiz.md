# Experimental Protocol — Quiz Study: Validating the Pedagogical Reward

**Working title:** *Does AI-judged feedback actually teach? A randomized study of RLAIF, expert-in-the-loop, and outcome-based reward signals for automated mathematics feedback.*

**Version:** 1.1 — 27 July 2026 (translated to English; content unchanged from v1.0, 16 July 2026)
**Principal investigator:** Dogbalou Motognon Wastalas d'Assise
**Platform:** STACK-AI-Math-Course (Next.js + Convex + Gemini/OpenAI)
**Status:** draft — to be pre-registered (OSF) before any recruitment

---

## 1. Background and rationale

The platform's feedback pipeline combines three quality signals:

1. **RLAIF / Best-of-N** (`convex/grading.ts` → `gradeBestOfN`): N=3 candidate feedbacks generated at temperature 0.4; an LLM-as-Judge (`convex/judge.ts` → `evaluateEvaluator`, grounded on CAS verification and expert corrections) assigns each a `judgeConfidence`; the most confident candidate is delivered to the student.
2. **Expert-in-the-loop** (`convex/corrections.ts`): approved human corrections, fed back as few-shot examples into the grader and the judge.
3. **Outcome-Based Reward** (`convex/submissions.ts`): for each submission, `outcomeReward = masteryBefore(next submission) − masteryBefore(current submission)` on the same topic; feedbacks with `outcomeReward ≥ 5` populate a "pedagogically validated" few-shot pool injected into `gradeOptimized`.

**Problem:** signals 1 and 2 measure the *plausibility* of the feedback (a judge finds it correct and aligned). They do not measure its *pedagogical effectiveness*. Signal 3 rests on the assumption that the mastery gain observed after a piece of feedback is attributable, at least in part, to that feedback. None of these assumptions has been tested experimentally.

**Thesis to be tested:** the most honest reward signal in education is not what a second AI thinks of the feedback, but whether the student improved after receiving it.

## 2. Research questions and hypotheses

- **RQ1.** Does judge-selected feedback (Best-of-N) produce a greater learning gain than single-pass feedback?
  **H1:** gain(B) > gain(A), expected effect size d ≈ 0.3–0.4.
- **RQ2.** Does adding outcome-validated few-shot examples (the `outcomeReward ≥ 5` pool) improve the gain relative to Best-of-N alone?
  **H2:** gain(C) > gain(B).
- **RQ3.** Does `judgeConfidence` predict `outcomeReward`?
  **H3 (central hypothesis, weakly directional):** the correlation is weak (ρ < 0.3) — the AI judge optimises plausibility, not learning. *Every outcome is informative*: a strong correlation would validate RLAIF as a proxy; a weak one demonstrates the necessity of the outcome signal.
- **RQ4 (exploratory).** Are expert corrections better aligned with outcome than the AI judge is? (compare `outcomeReward` for expert-corrected feedbacks vs judge-validated-only feedbacks).

## 3. Experimental design

### 3.1 Conditions (three arms)

| Arm | Name | Implementation | What the student receives |
|---|---|---|---|
| **A** | Single-pass (control) | `gradeOptimized`, `useBestOfN=false`, outcome-validated context **disabled** | Grader-only feedback (with CAS + expert-correction few-shots, as before June 2026) |
| **B** | RLAIF Best-of-N | `gradeBestOfN` (N=3, selection by `judgeConfidence`) | Best candidate according to the judge |
| **C** | Best-of-N + Outcome | `gradeBestOfN` **plus** the `outcomeReward ≥ 5` few-shot pool injected into candidate generation | Best candidate, generated with grounding on pedagogically validated feedbacks |

All arms retain: CAS verification, three-section feedback structure (Answer/Reasoning/Verdict), LaTeX delimiters, and the background judge (for logging, without altering the feedback delivered in arm A).

### 3.2 Randomisation unit: student × topic (within-subject)

Each student works through **three topics** (e.g. *Determinants*, *Eigenvalues*, *Derivative Rules* — to be fixed according to the cohort's syllabus). For each student, the three conditions are assigned to the three topics by **counterbalanced random permutation** (3×3 Latin square over presentation order × condition), stratified by overall pre-test score (median split).

Rationale: a within-subject design neutralises between-individual differences (the dominant source of variance in education) and roughly halves the required sample relative to a between-subjects design. The risk of cross-condition contamination is low: a student never sees two competing feedbacks for the same submission.

### 3.3 Two phases

- **Phase 1 — Bootstrap (arms A and B only, 2 topics/student).** The `outcomeReward` pool is currently near-empty. Phase 1 (a) compares A vs B, and (b) accumulates the outcome signal needed for arm C. Exit criterion: ≥ 15 feedbacks with `outcomeReward ≥ 5` per topic targeted in phase 2.
- **Phase 2 — Main study (A, B, C, 3 topics/student).** The outcome-validated pool is **frozen** on the first day of phase 2 (versioned snapshot) so that arm C is stable and reproducible throughout.

Phase 1 participants do not take part in phase 2 (distinct cohorts).

## 4. Participants

- **Population:** first/second-year university students enrolled in linear algebra or differential calculus. Sites: MMUST (Kenya) as the priority — continuity with the pilot — plus a possible second cohort for generalisability.
- **Inclusion criteria:** ≥ 18 years old, enrolled in the relevant course, signed informed consent, access to a computer/browser.
- **Exclusion criteria:** participation in phase 1 (for phase 2); participation in the earlier qualitative pilot with more than one session of platform exposure.
- **Sample size (phase 2):** for a paired A–B comparison with d = 0.4, two-sided α = .05, power = .80 and within-subject correlation r ≈ .5: **n ≈ 52 completed students**. Recruitment target: **80 students** (expected attrition 20–25%). Phase 1: 40–50 students suffice (its main purpose is signal accumulation).
- **Incentive:** certificate of participation + full platform access after the study; compliant with local ethics committee rules (no financial incentive contingent on performance).

## 5. Materials

### 5.1 Pre/post quiz (the measurement instrument)

- **6 items per topic**, numeric answers or symbolic expressions **marked exclusively by CAS** (deterministic). The measurement instrument must **never** depend on the manipulated AI grader — otherwise the measure is contaminated by the manipulation.
- Pre-test and post-test are **isomorphic**: same problem skeletons, regenerated numeric parameters (the parametric generation in `src/data/topics/` does exactly this). Random assignment of version (v1/v2) to pre or post, counterbalanced.
- Duration: 15 min per topic, no feedback, no hints, one attempt per item.
- Prior piloting of the items on 10–15 students outside the study: target a mean difficulty of 0.4–0.7 and a discrimination index > 0.2 (the difficulty/discrimination dashboards of STACKAI Math Educator serve this purpose).
- **Pilot item bank generated (18 July 2026):** `docs/research/banque-items-pilote.md` (+ `item-bank/item-bank.json`) — 36 CAS-validated items (3 topics × 2 isomorphic forms A/B × 6 items, 2/2/2 composition), unique answer keys per form, reproducible seeded generation (`scripts/generate-item-bank.ts`). The document includes the marking key and the worksheet for computing p and D indices.

### 5.2 Practice session (the intervention)

- 30 minutes per topic, **minimum 6 problems submitted** (dosage control: a session only counts as complete at 6 submissions; beyond that, free practice until the time limit).
- After each submission: feedback according to the assigned condition, with a mandatory minimum reading time of 20 s before the next problem (guarantees exposure to the treatment).
- **Difficulty-controlled problem sequence:** to neutralise the "the gain comes from the difficulty of the next problem" confound, the difficulty progression is **fixed by a shared script** (2 easy → 2 medium → 2 hard), identical across the three arms, instead of the adaptive recommendation engine. The adaptive engine is disabled during the study.
- Hints and solutions (`permissions.ts`) are disabled during the study: feedback is the only support.

### 5.3 Retention (optional but recommended)

Delayed post-test (same items, regenerated parameters) at **day 7**, 10 min per topic, to measure retention. Analysed as secondary; expected attrition is higher there.

## 6. Procedure (phase 2, per participant)

| Step | Duration | Content |
|---|---|---|
| 0. Onboarding | 15 min | Consent, account creation, demographics (year, programme, self-reported confidence), platform tutorial on a neutral topic |
| 1. Pre-test | 3 × 15 min | CAS quiz on the 3 topics, counterbalanced order |
| 2. Practice | 3 × 30 min | One session per topic, condition assigned by randomisation; 5-min breaks between topics |
| 3. Immediate post-test | 3 × 15 min | Isomorphic quizzes |
| 4. Questionnaire | 10 min | Perceived usefulness of feedback (5-point Likert, 6 items), cognitive load (abbreviated NASA-TLX), free-text comment |
| 5. Delayed post-test | Day 7, 3 × 10 min | Online, email reminder (Resend) |

Recommended format: **two proctored in-room sessions** (steps 0–3 over a half-day or two consecutive days) to control the environment, plus step 5 remotely.

## 7. Variables and measures

### 7.1 Primary

- **Normalised learning gain** per student × topic:
  `g = (post − pre) / (max − pre)` (Hake gain; if `pre = max`, excluded from the analysis for that topic).

### 7.2 Secondary

- **Observed `outcomeReward`** per submission (native scale: +10 correct answer, +3 partial, 0 otherwise → the reward between two submissions ranges from −0 to +10; "high-reward" threshold = 5).
- **Accuracy on the next attempt** (probability that a submission following a piece of feedback is correct), by condition.
- **Retention** at day 7 (delayed normalised gain).
- **`judgeConfidence`** for every delivered feedback (logged in all three arms, including A where the judge runs in the background without altering the feedback).
- **Within-session mastery trajectory** (slope of `masteryScore` over the 6+ submissions).
- Perceived usefulness, cognitive load, feedback reading time, time per problem.

### 7.3 Covariates

Pre-test score, topic, presentation order, programme, self-reported confidence.

### 7.4 Required logging — **IMPLEMENTED (17 July 2026)**, see `convex/experiment.ts`

1. ✅ Table `experimentAssignments`: `{ userId, participantCode, phase, topicName, condition, latinSquareRow, topicOrder, enrolledAt }`. Enrolment (`experiment:enrollParticipant`) applies the Latin square automatically (cycling permutations by enrolment order, overridable via `latinSquareRow`) and assigns the pseudonym `P<phase>-NNN`.
2. ✅ Fields `experimentCondition` + `experimentPhase` on `submissions`, copied from the assignment at submission time.
3. ✅ Condition forcing in `gradingPipeline.gradeAndSaveSubmission`: if the user has an assignment for that topic **and** their phase is active (`experimentConfig.activePhase`), the condition overrides the frontend's `useBestOfN`. Outside an active phase, the platform behaves normally.
4. ✅ Few-shot pool snapshots (`experimentPoolSnapshots`): `experiment:freezePoolsForPhase` freezes expert corrections + outcome-validated feedbacks per topic; during the study, `gradeOptimized` and `evaluateEvaluator` (including arm A's background judge) read from the snapshot. A pool that was never frozen returns an empty list — no silent fallback to live data.
5. ✅ Log `experimentGradingLogs`: all 3 Best-of-N candidates and their `judgeConfidence` (not just the selected one), selected index, grading latency, model, `PROMPT_VERSION` (to be incremented on every prompt change).
6. ✅ Pseudonymised export (`experiment:exportSubmissions`, `experiment:exportGradingLogs`): Clerk identifiers replaced by `participantCode`.

**Operator runbook** (internal functions — CLI or Convex dashboard only, never exposed to clients):

```bash
# 1. On the first day of a phase: freeze the pools for the study topics
npx convex run experiment:freezePoolsForPhase '{"phase": 2, "topics": ["Determinants", "Eigenvalues & Vectors", "Derivatives"]}'

# 2. Enrol each participant (enrolment order balances the Latin square)
npx convex run experiment:enrollParticipant '{"userId": "<clerk-id>", "phase": 2, "topics": ["Determinants", "Eigenvalues & Vectors", "Derivatives"]}'

# 3. Activate the phase (condition forcing only applies while a phase is active)
npx convex run experiment:setActivePhase '{"phase": 2}'

# 4. Monitoring
npx convex run experiment:getExperimentStatus '{}'

# 5. End of phase: deactivate, then export
npx convex run experiment:setActivePhase '{"phase": null}'
npx convex run experiment:exportSubmissions '{"phase": 2}' > phase2_submissions.json
npx convex run experiment:exportGradingLogs '{"phase": 2}' > phase2_grading_logs.json
```

⚠️ The `topics` passed to enrolment and freezing must use topic **slugs** — the same convention as `submissions.topicName` (e.g. `"determinants"`, `"eigenvalues"`, `"derivatives"`, not the display titles). This is also what the direct CAS check and quiz mode expect.

### 7.5 Pre/post quiz mode — **IMPLEMENTED (17 July 2026)**

- **Backend** `convex/studyQuiz.ts` + table `studyQuizAttempts`: at start-up the client generates ~42 candidate problems **balanced across difficulty tiers** from the topic's parametric generator; the server retains 6 items whose ground truth is computable by **direct CAS** (`computeDirectGroundTruth`, never the LLM fallback), enforcing the **fixed 2 easy / 2 medium / 2 hard composition** (shared classifiers in `src/data/difficultyClassifiers.ts`, presented in increasing order of difficulty) — guaranteeing that pre and post share the same difficulty mix. Snapshot stores the ground truths (never sent to the client). On submission, marking is 100% deterministic (`checkEquivalenceDirect`). Empty or unparsable answer = incorrect (pre-specified); `casChecked=false` is logged for transparency. One attempt only per participant × topic × type; server-side timer (pre/post 15 min, delayed 10 min, 60 s grace, overrun flagged `overTime` without rejection); resume after disconnection; autosave. No score or feedback is shown to the student.
- **Frontend**: `/study` (participant dashboard — assigned topics in order, never revealing the condition) and `/study/quiz/[topicId]?type=pre|post|delayed` (instruction screen, 6 items, countdown with automatic submission at 0:00, submission confirmation).
- **Export**: `npx convex run studyQuiz:exportQuizAttempts '{"phase": 2}'` (pseudonymised by `participantCode`).
- **Tests**: `convex/studyQuiz.test.ts` (bun test) verifies for each study topic that ≥ 6/40 generated problems are markable by direct CAS, that the generator's official solution is marked correct, and that a nonsense answer never is. Validated topics: `determinants`, `eigenvalues`, `derivatives`.

### 7.6 Practice session constraints (§5.2) — **IMPLEMENTED (17 July 2026)**

- **Sessions** (`convex/studyPractice.ts` + table `studyPracticeSessions`): 30 min per topic, minimum 6 submissions to complete (when time expires, the session may be closed below the minimum, flagged `underMinimum` for the exclusion rule in §9.4 — the participant is never blocked). Resume after disconnection. Page `/study/practice/[topicId]`.
- **Protocol order enforced server-side**: pre-quiz submitted → practice session unlocked; session completed → post-quiz unlocked; post-quiz submitted → delayed quiz unlocked. The `/study` dashboard displays all three steps with locks.
- **Fixed difficulty sequence** (`src/data/studyDifficulty.ts`): 2 easy → 2 medium → 2 hard, identical across the three arms, obtained by classifying generator variants + rejection sampling; beyond 6, free generation. Tiers validated by tests (`studyDifficulty.test.ts`) for `determinants` (singular 2×2 → 3×3 computation → parametric 3×3), `eigenvalues` (diagonal → triangular → symmetric/characteristic equation), `derivatives` (polynomial → chain rule → product/quotient).
- **Feedback reading time**: 20 s enforced before "Next problem" (client-side).
- **Server-side locks** (not circumventable from the interface): hints/solutions disabled in `permissions.getPermissions` for any active participant on their study topic; adaptive engine switched off in `recommendations.generatePractice`; **grading model fixed server-side** (`STUDY_MODEL` in `experiment.ts`; the client's model selector is ignored) — reinforcing the freeze in §10.
- **Export**: `npx convex run studyPractice:exportPracticeSessions '{"phase": 2}'`.

**System freeze during each phase:** no changes to prompts, LLM models or thresholds, and no approval of new expert corrections that would influence the pools. Expert corrections continue to be *collected* (for RQ4) but do not enter the few-shot pools before the phase ends.

## 8. Randomisation and blinding

- Assignment sequence generated by script (seed recorded), stratified by median overall pre-test score, in blocks of 6 (the 6 Latin-square permutations).
- **Students:** blind to condition (all three arms produce feedback that is visually identical in format).
- **Expert markers:** blind to condition when reviewing submissions (the admin interface hides `experimentCondition` and Best-of-N metadata).
- **Analyst:** the primary analysis is run on data with conditions coded A'/B'/C', kept masked until the database and analysis plan are frozen.
- The PI does not interact with participants during practice sessions (neutral proctor).

## 9. Statistical analysis plan

Pre-registered on OSF before the first phase-2 participant. Software: R (lme4, emmeans) or Python (statsmodels, pingouin). Threshold α = .05, Holm correction for pairwise comparisons.

### 9.1 H1/H2 — Effect of condition on gain

Linear mixed model:

```
g ~ condition + pretest_c + topic + order + (1 | student)
```

Planned contrasts: B−A (H1), C−B (H2), C−A (secondary). Effect sizes: paired d with 95% CIs. Sensitivity analysis: ANCOVA on raw post-test with pre-test as covariate; beta model if the gain distribution is non-normal.

### 9.2 H3 — Judge vs outcome

Across all non-terminal submissions (those that have an `outcomeReward`):

- Spearman correlation `judgeConfidence` × `outcomeReward`, with cluster-bootstrap CIs (by student).
- Mixed model: `outcomeReward ~ judgeConfidence + grade + difficulty + (1 | student) + (1 | topic)` — the `judgeConfidence` coefficient is the direct test of H3.
- ROC curve: `judgeConfidence` as a predictor of `outcomeReward ≥ 5` (AUC with CI).
- Pre-specified interpretation: AUC < 0.6 or ρ < 0.3 → the judge is not a reliable proxy for pedagogical effectiveness.

### 9.3 RQ4 — Experts vs judge (exploratory)

Compare mean `outcomeReward` for feedbacks that were (a) modified by the judge, (b) corrected by an expert (kept out of the few-shot pools during the phase), (c) unmodified.

### 9.4 Exclusions and missing data (pre-specified rules)

- A student×topic pair is excluded if: fewer than 6 practice submissions, pre-test = maximum score, total practice time < 15 min, or a logged technical anomaly (grading API failure more than twice in the session).
- A student is excluded entirely if ≥ 2 of their topics are excluded.
- Intention-to-treat (all data retained) as a sensitivity analysis.
- Day-7 retention: complete-case analysis + a model with MAR missing data (those absent at the delayed test are not excluded from the immediate analysis).

## 10. Threats to validity and countermeasures

| Threat | Countermeasure |
|---|---|
| The gain reflects problem difficulty, not the feedback | Fixed difficulty sequence, identical across the 3 arms; adaptive engine disabled |
| The measurement instrument depends on the manipulated system | Pre/post marked exclusively by CAS |
| Regression to the mean | Pre-test as covariate; stratified randomisation |
| System drift during the study | Freeze on prompts, models and few-shot pools; versioning |
| Order effects / fatigue | Latin square over order × condition; breaks; sessions ≤ 30 min |
| Off-platform learning between pre and post | Immediate post-test on the same day; the delayed test is secondary only |
| Between-LLM variability (non-determinism) | Logging of candidates and confidences; fixed temperature and model version |
| Differential attrition | Within-subject conditions (attrition removes the student from all 3 arms at once) |
| Generalisability limited to one site | Acknowledge as a limitation; second cohort if feasible |

## 11. Ethics and data protection

- **Approvals required before recruitment:** the institutional ethics committee of the doctoral host institution **and**, for the Kenyan site: the MMUST ethics committee (IERC) + a **NACOSTI** research licence (National Commission for Science, Technology and Innovation — mandatory for all research in Kenya, including by a foreign researcher). Allow 6–10 weeks.
- **Written informed consent**: purpose (comparison of automated feedback types), voluntary participation, withdrawal without consequence for course grades, and an explicit statement that the feedback is AI-generated and may contain errors.
- **Non-maleficence:** the control arm (A) receives the standard system, not an absence of feedback — no participant is pedagogically disadvantaged. Full platform access (the best condition) is offered to everyone after the study.
- **Data:** compliance with the **Kenya Data Protection Act 2019** and with the GDPR where applicable. Pseudonymisation at export (Clerk identifiers replaced by codes), no health data, age/institution stored separately from responses. Retention: 5 years on encrypted institutional storage. Submissions transit through the Gemini/OpenAI APIs: the consent form states this, and no names are included in prompts.
- **Minors:** excluded (≥ 18 years old).

## 12. Provisional timeline

| Period | Milestone |
|---|---|
| Aug 2026 | Instrumentation (§7.4), quiz item piloting, ethics submissions (IERC + NACOSTI) |
| Sep–Oct 2026 | OSF pre-registration; ethics approvals |
| Oct–Nov 2026 | **Phase 1** (bootstrap, 40–50 students, arms A/B) |
| Dec 2026 | Interim analysis of phase 1; freeze of the outcome-validated pool; exit criterion verified |
| Jan–Feb 2027 | **Phase 2** (80 students, 3 arms) + day-7 delayed tests |
| Mar 2027 | Database freeze, unblinding, analysis |
| Apr–May 2027 | Writing — target: IJAIED (journal); short version at AIED/EDM if the deadline calendar allows |

## 13. Deliverables and success criteria

- Anonymised dataset + analysis code published (OSF/GitHub) alongside the paper.
- The study is publishable **whatever the outcome of H1–H3**: the contribution is the joint measurement (randomised gain + judge/outcome correlation), not the confirmation of the hypotheses.
