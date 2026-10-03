# Developer Response — System Specification (Questions A–F)

**Version:** 1.0 — 3 October 2026
**Codebase:** `Pen20/adaptive-learning` @ `8349185` (main)
**Status of this document:** every answer in sections A–D is grounded in the code, with file and line references. Sections E and F are **largely unanswerable from the codebase** and are marked accordingly — they require the research team's own records, not the developer's.

> ### ⚠️ Read this before anything else
>
> Three findings materially affect what can be claimed. They are stated here rather than buried.
>
> **1. The pilot predates this codebase.** The MMUST pilot ran **6 Oct – 12 Nov 2025** (`donnees-enquetes.md` §1). This repository's first commit is **3 January 2026**, and it contains **zero commits in the pilot window**. Guided Mistake Correction (`convex/remediation.ts`) was first committed on **12 August 2026**, ten months after the post-survey closed. **The students who completed the post-survey did not use the version in these screenshots, and did not use Guided Mistake Correction at all.** Questions 47–49 cannot be answered affirmatively.
>
> **2. Problem selection is not adaptive.** The next problem is drawn by a uniform random call to the topic's parametric generator (`useGeneratedProblem.ts:28`). Mastery, error history and past performance have **no influence** on what the student sees next. What *is* error-conditioned is the feedback and the correction sequence — not the item selection. Calling the system "adaptive" without that distinction will not survive review (Q31, Q37).
>
> **3. Free-text correction steps advance on length, not correctness.** In Guided Mistake Correction, a step with no `expectedAnswer` is marked correct when the response is **≥ 12 characters** (`remediation.ts:335-337`). Four of the five stages are free-text. This is the weakest link in the pipeline and must be disclosed (Q22).

---

## A. Purpose and architecture

### 1. Exact purpose, and the STACK limitation addressed

The system awards credit for **mathematical reasoning**, not only for the final answer. In STACK (and CAS-based assessment generally), the input is an answer box: it captures a value, so the student's *method* is never available to be assessed. Marks therefore attach to the outcome alone.

This system splits the mark in two: the final answer is marked by a CAS, and the reasoning is marked by an LLM constrained by a human-authored rubric. The constraint being addressed is **the input schema as much as the grader** — `submissions` stores `finalAnswer` and `reasoningSteps` as separate fields (`schema.ts`), and the UI elicits them separately (`AnswerPanel.tsx:110-237`).

### 2. Architecture and stack

| Layer | Technology | Evidence |
|---|---|---|
| Frontend | Next.js 16.1.1 (App Router), React 19.2, TypeScript, Tailwind 4, Shadcn/UI | `package.json` |
| Math rendering | KaTeX via `react-katex` | `MathRenderer.tsx` |
| Backend | Convex (serverless functions + reactive DB) | `convex/` |
| Database | Convex document store, 20+ tables | `convex/schema.ts` |
| CAS | **nerdamer** 1.1.13 (`Algebra`, `Calculus`, `Solve`) | `cas.ts:4-7` |
| LLM (grading) | Google Gemini 2.5 Flash *or* OpenAI GPT-4o/4o-mini | `grading.ts:1294,1403` |
| LLM (CAS extraction) | OpenAI `gpt-4o-mini` | `cas.ts:679` |
| Auth | Clerk (Google/GitHub/email), webhook sync to Convex | `middleware.ts`, `api/webhooks/clerk` |
| Email | Resend + Nodemailer/Gmail fallback | `convex/email.ts` |
| Deployment | Vercel (frontend), Convex Cloud (backend) | — |

**Correction to a comment in the code:** the grading prompt tells the model the answer was "computed deterministically by mathjs" (`grading.ts:1198`). The CAS is actually **nerdamer**. `mathjs` is a dependency but is not the CAS in this path. Cosmetic, but do not repeat the error in the thesis.

### 3. Complete data flow

1. **Generate.** `useGeneratedProblem.ts:28` calls `topicRegistry[topicId].generate()` — a parametric template with randomised coefficients. Produces statement, solution, explanation, hint, `reasoningSteps` scaffold, `answerFormat`, and a `pedagogy` instance binding the item to a fiche task type.
2. **Elicit.** `AnswerPanel.tsx` renders a structured Final Answer field (typed sub-fields when `answerFormat.fields` exists) and a free-text Reasoning Steps textarea with live KaTeX preview and handwriting image upload (`transcribeReasoning`, `grading.ts:963`).
3. **Submit.** `gradingPipeline.gradeAndSaveSubmission` authenticates, checks for an active study assignment, and routes to `gradeOptimized` or `gradeBestOfN`.
4. **CAS ground truth.** `cas.computeGroundTruth` — deterministic parser first, LLM-extraction fallback second (see Q5).
5. **CAS equivalence.** `cas.checkAnswerEquivalence` compares the student's final answer to the ground truth.
6. **LLM grading.** One prompt carrying the CAS verdict, the fiche, the reasoning scaffold, and few-shot examples; returns structured JSON.
7. **Deterministic override.** `enforceHalfPointStructure` (`grading.ts:166`) overwrites the model's `finalAnswerScore` and rewrites the Final Answer and Verdict prose from the CAS result.
8. **Didactic layer.** `buildDidacticInterpretation` appends the **Learning focus** section (`didactics.ts:137`).
9. **Persist.** `submissions.saveSubmission` writes the submission, updates `studentTopicStats`, `studentMastery`, `studentLearningProfile`, `submissionDiagnostics`.
10. **Display, then optional correction.** Student clicks into Guided Mistake Correction → `remediation.startRemediation` builds a 5-activity sequence from the diagnosed misconception.

### 4. Deterministic vs. LLM

**Deterministic:** problem generation; CAS ground truth on the direct path; CAS equivalence checking; the entire final-answer half-mark; the Final Answer and Verdict prose; grade arithmetic; mastery/level/streak/success-rate; the Learning focus template; **selection and ordering of all five correction activities**; advancement rules in correction.

**LLM:** the reasoning half-mark; all reasoning prose; error-type/misconception/technique/concept-tag classification; the `remediationPrompt` seeding correction stage 2; CAS expression extraction on the fallback path; handwriting transcription; Best-of-N candidate ranking (judge).

### 5. Is the final answer CAS-verified before the LLM runs? — Exact procedure

**Yes, and the CAS verdict is binding.** Two tiers:

**Tier 1 — fully deterministic** (`cas.ts:458 computeDirectGroundTruth`). Topic-specific parsers extract the mathematical object from the problem statement and compute the answer with no LLM involvement. Implemented for 11 canonical topics: `eigenvalues`, `eigenvalues_3x3`, `quadratic_equations`, `determinants`, `linear_equations`, `linear_systems`, `polynomial_inner_product`, `limits`, `derivatives`, `piecewise_continuity`, `domain_range`.

**Tier 2 — LLM-assisted extraction** (`cas.ts:637-726`). If no direct parser matches, `gpt-4o-mini` is asked to translate the problem into a nerdamer expression; nerdamer then evaluates it deterministically. **The ground truth therefore depends on an LLM's reading of the problem on this path.** The *evaluation* is deterministic; the *extraction* is not.

Then `checkEquivalenceDirect` (`cas.ts:740`) compares, handling numeric lists, symbolic equality via `nerdamer(...).eq(...)`, string verdicts, and numeric function sampling. It returns `{ isEquivalent, casChecked }`, and `finalAnswerScoreFromCas` (`grading.ts:78`) maps that to 0.5 / 0 / null.

**For the quiz study, tier 2 is disabled** — `studyQuiz.ts` calls `computeDirectGroundTruth` only, so study items are graded fully deterministically (`cas.ts:455-457`). This is the right design and worth reporting.

### 6. What is sent to, and returned by, the LLM

**Sent** (`grading.ts:1213-1285`): topic name; problem statement; the student's final answer and reasoning text; expected answer format; the CAS block (expression, verified answer, equivalence verdict); the topic's reasoning scaffold; the fiche JSON (task type, rubric, misconception catalogue, policies); an intermediate-equivalence rule; the scoring rubric and 9 formatting rules; up to 1 approved expert correction and up to 2 outcome-validated feedback examples **drawn from other students' submissions**.

**Returned:** `finalAnswerScore`, `reasoningScore`, `grade`, `feedback`, `errorType`, `techniqueUsed`, `misconception`, `errorLocation`, `conceptTags[]`, `diagnosisConfidence`, and — when a fiche applies — `techniqueId`, `reasoningStatus`, `completedStepIds[]`, `firstIncorrectStepId`, `misconceptionId`, `criterionResults[]`, `remediationPrompt`.

**No student identifiers are sent.** See Q55.

### 7. Model choice, and what "Best-of-3 RLHF" does

Gemini 2.5 Flash is the **default**; the client may request an OpenAI model (`grading.ts:1403`, temperature 0 on both). **For enrolled study participants the model is forced server-side to `gpt-4o`** and the client's choice is ignored (`experiment.ts:24`, `gradingPipeline.ts:73`). So the study model is **GPT-4o, not Gemini 2.5 Flash** — check which configuration your screenshots show.

**Best-of-3** (`grading.ts:1833 gradeBestOfN`): generates N = 3 independent gradings at **temperature 0.4** (not 0, so they genuinely differ), scores each with the LLM-as-judge acting as a reward model (`judge.evaluateEvaluator`), and returns the candidate with the highest `judgeConfidence`. It is **selection only** — once a candidate wins, the judge may not overwrite its grade or feedback, precisely so it cannot corrupt a CAS-backed verdict (`grading.ts:1921-1925`). This is Best-of-N / RLAIF *inference-time* selection; **no model weights are updated, so it is not RLHF in the training sense.** Describe it as "Best-of-N reranking with an LLM reward model".

---

## B. Assessment and feedback

### 8. Final Answer vs. Reasoning Steps — separately

**Final Answer (0.5).** Decided by the CAS. `finalAnswerScoreFromCas` returns 0.5 on equivalence, 0 on non-equivalence, and `null` only when the CAS could not compute or could not parse. When non-null it **overrides whatever the model returned** (`grading.ts:171-178`), and the Final Answer prose is replaced by a deterministic template (`buildFinalAnswerSection`, `grading.ts:102`). The LLM's view of the final answer survives only when the CAS abstains.

**Reasoning (0.5).** Decided by the LLM alone, constrained by the fiche: evaluate only the applicable `reasoningComponents` for the technique the student actually used; apply the `equivalencePolicy` before calling anything an error; classify with exactly one of five `reasoningStatus` values; identify only the *first* genuine divergence. Scoring is **binary** (`scoringPolicy.mode = "binary"`); criterion weights exist "for diagnosis and feedback", explicitly **not** for fractional scoring.

### 9. Score generation — is it always 50/50?

**Yes.** `finalAnswerWeight: 0.5` / `reasoningWeight: 0.5` in every fiche; the prompt fixes it; `addScores` sums the two halves; `normalizeHalfPointScore` snaps each to {0, 0.5}. Total ∈ {0, 0.5, 1}. There is no per-topic or per-item override anywhere in the codebase.

The 0/0.5 + 0/0.5 in your screenshot is the standard display. **The 50/50 split is a deliberate design commitment, not an implementation default** — it is the claim that reasoning is worth as much as the answer.

### 10. Mismatched answer and reasoning

Both cases are first-class and produce **0.5/1**, with distinct feedback (`buildVerdictSection`, `grading.ts:119`):

- **Correct answer, wrong reasoning** → "you earned the final-answer point, but the reasoning point is missing or not mathematically sound yet."
- **Wrong answer, sound reasoning** → "your reasoning has useful mathematical structure, but the final answer does not match the verified result."

Special case: answer correct but reasoning empty or non-mathematical ("I did it on paper") → reasoning 0, answer still 0.5 (`grading.ts:1239-1240`).

### 11. Required AI output schema

OpenAI uses a **strict JSON schema** with `additionalProperties: false` and all 17 fields required (`grading.ts:1420-1482`). Gemini uses `responseMimeType: "application/json"` plus prompt-level specification — **structurally weaker**, with a text-parsing fallback (`parseJsonObject`, `grading.ts:260`) that strips code fences and regex-extracts the first `{...}`.

### 12. Are Final Answer / Reasoning steps / Verdict / Learning focus mandatory?

**The first three are mandatory and enforced after the fact, not merely requested.** The prompt demands exactly three sections with literal bold headers; `normalizeFeedbackStructure` repairs header formatting; `replaceStructuredSection` **overwrites** the Final Answer and Verdict sections with deterministic text whenever the CAS has ruled.

**Learning focus is appended deterministically**, never generated by the model (`appendDidacticFeedback`, `grading.ts:502`). Its content is a template over the CAS verdict plus a **praxeological** description — task type / technique / technology / theory, i.e. Chevallard's Anthropological Theory of the Didactic (`didactics.ts:117-135`). Worth naming explicitly in the thesis: this is the one place the design has an explicit didactic theory behind it.

### 13. How error labels are produced

Three-step resolution (`grading.ts:568-576`):
1. LLM returns both a free-text `misconception` and a catalogue `misconceptionId`.
2. The ID is looked up in the topic's fiche; **on a hit, the fiche's canonical `label` replaces the model's wording.**
3. On a miss, it falls back to the model's free text, then `errorType`, then `"Unclassified mathematical error"`.

A label such as **"incorrect operation for isolating variable"** (lowercase, uncanonical) is almost certainly step-3 free text. The nearest canonical labels for `linear_equations` are *"Unbalanced equation operation"* and *"Sign error while isolating variable"*.

### 14. Which taxonomy?

**Not Newman Error Analysis.** It is a **project-specific, topic-level closed catalogue**: the *fiche pédagogique d'évaluation*, one per topic, versioned (`ficheId`, `ficheVersion`). Each misconception carries an ID, a label, a `classification` ∈ {`conceptual_error`, `procedural_error`, `calculation_error`, `incomplete_reasoning`}, `observableIndicators`, `prerequisiteIds`, a `feedbackStrategy`, and a `remediationStrategy`.

**Coverage is uneven and this matters for any per-code claim:**

| | Fiches | Depth |
|---|---|---|
| `determinants` | 1, hand-authored, v1.1.0 | 3 task types, multiple techniques, **7 misconceptions**, prerequisites, per-misconception remediation |
| 17 other topics | generated from one template (`standardFiches.ts`), v1.0.0 | 1 task type, 1 technique, 2 reasoning components, **~2 misconceptions each** (34 total) |

**The catalogue is closed in the prompt but not enforced at parse time.** `normalizePedagogicalEvaluation` (`aiDiagnosis.ts:80`) accepts any string as `misconceptionId`. Out-of-vocabulary IDs are not rejected — they silently fall through to free text. If you want to report an out-of-vocabulary rate, the data to compute it exists in `submissionDiagnostics`, but nothing currently blocks it.

### 15. Linking an error to a topic/technique/concept

Via the fiche (`misconceptionId` → `prerequisiteIds`, `remediationStrategy`) and via the didactic layer, which emits `conceptTags` = topic + model tags + task type + theory. These update `studentLearningProfile`, keyed by `(userId, topicName, conceptTag)`, carrying per-concept mastery, misconception and technique counts.

### 16. What stops the LLM contradicting the CAS

Four mechanisms, of which only the last is a true guarantee:
1. Prompt instruction — "The CAS is always right. Do NOT recompute."
2. Rubric instruction — "you MUST use that CAS result for finalAnswerScore."
3. **Post-hoc score override** — `enforceHalfPointStructure` discards the model's `finalAnswerScore` whenever the CAS ruled.
4. **Post-hoc prose override** — the Final Answer and Verdict sections are replaced with deterministic text.

So the model **cannot** alter the final-answer mark or the sentences reporting it. It *can* still write something inconsistent inside the **Reasoning steps** section, which is never overwritten. That residual channel should be named as a limitation.

### 17. Malformed, uncertain, unavailable or inconsistent output

| Failure | Behaviour | Location |
|---|---|---|
| Gemini structured mode throws | Retry in prompt-only JSON mode | `grading.ts:1334-1355` |
| Still unparseable | `casBackedFallbackFeedback` — CAS-only feedback, reasoning marked unassessable | `grading.ts:1357-1373` |
| OpenAI API error | grade 0, `errorType: "API Error"` | `grading.ts:1491` |
| Missing API key | grade 0, `"Config Error"` | `grading.ts:1296` |
| Any other exception | grade 0, `"Feedback Error"`, generic retry message | `grading.ts:1526` |
| Invalid enum in output | Coerced — `reasoningStatus` → `"missing"`, criterion status → `"not-evidenced"` | `aiDiagnosis.ts:73-82` |
| Best-of-N candidate failed | Excluded from selection unless all failed | `grading.ts:1901-1908` |

**Note the asymmetry:** a model failure produces **grade 0**, not "ungraded". A student can receive a zero because of an infrastructure fault. For a summative setting this needs either a distinguishable `ungraded` state or a documented recovery route (`corrections.ts` override exists, but is reactive).

---

## C. Guided Mistake Correction and adaptation

### 18. What makes it adaptive — exactly

**It is error-conditioned, not learner-adaptive.** Precisely:

- **Adaptive:** which misconception is diagnosed (`misconceptionId`) selects the stage-1 activity, and the LLM-generated `remediationPrompt` — specific to the student's actual first error — becomes the stage-2 prompt. For `determinants`, six distinct stage-1 activities exist, one per misconception code.
- **Not adaptive:** the number of stages, their order, their pedagogical function, and stages 3–5 are **fixed**. Nothing reads mastery, attempt history, or prior performance. `buildActivities` (`remediation.ts:32`) takes only the current error as input.

Honest formulation: **deterministic remediation routing conditioned on a diagnosed misconception.** That is more auditable than a learned recommender — a lecturer can inspect the whole mapping before deployment — and it is what the code does. Framing it as a recommender invites a comparison it will lose.

### 19. What determines the next correction step

**Only the current error.** `buildActivities` receives `topicName`, `misconceptionId`, `misconceptionLabel`, `techniqueLabel`, `conceptPrompt` (from the fiche's `feedbackStrategy.prompt`), and `remediationPrompt`. **Not** previous attempts, historical performance, or topic mastery.

### 20. How many stages — always five?

**Always exactly five.** Both branches return one activation activity plus four fixed activities. The "5 of 5" in your screenshot is invariant across every topic and every misconception.

### 21. The five stages

| # | Stage | Purpose | Response | Checked against |
|---|---|---|---|---|
| 1 | `concept_activation` | Retrieve the rule whose absence caused the error | Multiple choice (determinants) / text (all others) | Exact expected option / length |
| 2 | `guided_correction` | Repair the student's own first incorrect step | Text | Length only |
| 3 | `focused_check` | Isolate the skill on a clean instance | Text (determinants: `det[[3,2],[1,4]]` → 10) | Expected answer (determinants) / length |
| 4 | `transfer_task` | Apply to a new case (determinants: find *k* making `[[2,3],[4,k]]` singular → 6) | Text | Expected answer (determinants) / length |
| 5 | `reflection` | Convert the repair into a reusable check | Text | Length only |

The ladder is sound pedagogy — activate, repair, isolate, transfer, generalise. **But only `determinants` has verifiable answers at stages 1, 3 and 4.** For the other 17 topics, **all five stages are length-checked free text**.

### 22. What determines advancement

```
correct = expectedAnswer
    ? normalizeAnswer(response).includes(normalizeAnswer(expectedAnswer))
    : response.length >= 12
```
(`remediation.ts:335-337`; `normalizeAnswer` lowercases, strips whitespace and backslashes.)

**For every free-text stage, any 12-character string advances the student.** "aaaaaaaaaaaa" passes. Outside `determinants`, that is the entire sequence. This is the single most consequential limitation in the system and it must be disclosed in any claim about correction efficacy. Note also that the substring match means a response *containing* the expected answer passes even alongside wrong work.

### 23. Incorrect response during correction

The response is logged with `correct: false`, `retryFeedback` is shown, the index does **not** advance, and the student may retry **without limit**. `retryFeedback` is a fixed hint per activity, not generated.

### 24. After successful completion

`status: "completed"`, `completedAt` set, and **`masteryScore += 5`**, capped at 100 (`remediation.ts:363-368`). No new problem is served, nothing else changes.

**Flag for the thesis:** completing a correction raises mastery by 5 points — half of what a fully correct submission earns (10). Since advancement is length-based, mastery can be inflated by typing. Any mastery-based outcome measure inherits this.

### 25. Is the solution revealed?

**Not inside Guided Mistake Correction.** The fiche sets `avoidGivingAnswerImmediately: true`; the prompt requires a `remediationPrompt` that "helps repair the first error without giving the complete answer"; stage prompts are questions.

**But the ordinary feedback that precedes it does reveal the answer** — rule 7 requires stating the correct result, and the deterministic Final Answer section prints the CAS answer verbatim. Separately, hints and full solutions are available in normal practice (`allowHints`, `allowSolution` default `true`), though **both are force-disabled server-side during study sessions** (`permissions.ts:25-29`). So: solution-free within the correction ladder, not solution-free overall.

### 26. Does the sequence change with error type?

**Stage 1 only, and only for `determinants`** — six misconception-specific activations (DET-M1, M2, M3, M4, M6; unmapped IDs fall back to DET-M3). Stage 2 varies in *content* via `remediationPrompt`. Stages 3–5 are identical for everyone. For the other 17 topics there is **one** generic activation regardless of misconception.

### 27. Is "what will you check next time…" dynamic?

**Partially, and not at all for determinants.**
- Non-determinant topics: `In one sentence, what will you check next time to avoid "${misconceptionLabel}"?` — the *template* is static, the misconception label is interpolated.
- `determinants`: `"what will you check first next time you solve a determinant problem?"` — **fully static**, no error reference.

### 28. What is stored per correction interaction

In `remediationSessions`: `userId`, `submissionId`, `topicName`, `ficheId`, `ficheVersion`, `taskTypeId`, `techniqueId`, `misconceptionId`, `misconceptionLabel`, the full `activitiesJson`, `responsesJson` (every response with `activityId`, text, `correct`, timestamp — **including failed attempts**), `currentActivityIndex`, `successfulChecks`, `status`, `startedAt`, `completedAt`.

This is good provenance: fiche version is recorded, so analysis can detect rubric drift.

### 29. Does practice recommendation depend on correction?

**No.** The only effect is `masteryScore += 5`, and mastery does not influence problem selection anywhere.

### 30. Student / mastery model — exact variables and rules

**`studentMastery`** — `(userId, topicName) → masteryScore ∈ [0,100]`, `lastAttempt`.

$$\text{mastery}_{t+1} = \min\bigl(100,\ \text{mastery}_t + \Delta\bigr), \qquad
\Delta = \begin{cases} 10 & \text{grade} = 1 \\ 3 & \text{grade} = 0.5 \\ 0 & \text{grade} = 0 \end{cases}$$

plus $+5$ on correction completion. (`submissions.ts:38-42`, `remediation.ts:365`)

**Properties you must state plainly:** monotonically non-decreasing — **no decay, no penalty for wrong answers, no forgetting**. Mastery measures *accumulated successful effort*, not current ability. Threshold: a module counts as "mastered" at **≥ 80**, i.e. 8 perfect submissions. It is **not** a Bayesian Knowledge Tracing, IRT, or BKT-style model, and should not be described as one.

**`studentLearningProfile`** — per `(userId, topicName, conceptTag)`: `masteryScore` (same deltas, clamped [0,100]), `misconceptionCount`, `techniqueCount`, `lastTechnique`, `lastMisconception`, `recommendedNextTask`. Richer, but **nothing reads it to make a decision** — it is recorded, not used.

### 31. If there is no formal learner model, what does "adaptive" mean?

Defensible claim, in descending strength:

1. **Error-conditioned feedback** — reasoning feedback targets the first genuine divergence in *this* student's work, against a published rubric. Genuinely responsive.
2. **Misconception-routed remediation** — the diagnosed code deterministically selects the repair activity. Genuinely conditional (though only richly so for determinants).
3. **Accumulated mastery state** — recorded and displayed, drives nothing.
4. **Adaptive item selection** — **does not exist.**

I would avoid "personalised learning support" and "adaptive learning path" in the thesis as currently implemented, and claim instead: *diagnostic feedback and deterministic, misconception-routed correction*. That is both accurate and more interesting, because determinism is auditable where a learned recommender is not.

---

## D. Recommendations and progression

### 32. How practice topics are selected

**By the student, from a menu.** `/courses/[courseId]/topics` lists the topics; the student picks. No automated selection exists.

### 33. Basis for recommendations

**There is no recommendation engine.** `convex/recommendations.ts` — referenced in `CLAUDE.md` — **does not exist**; it was removed. The only artefacts named "recommendation" are:
- `recommendedNextTask` — a **static per-topic string** (`didactics.ts:22-88`), identical for every student, stored and sometimes displayed.
- `remediationStrategy` in the fiche — a label, not an algorithm.

`CLAUDE.md` is out of date on this point and should be corrected before anyone else reads it as a specification.

### 34–35. Dashboard indicator formulas

All from `convex/users.ts:328-418` and `src/app/dashboard/page.tsx:139-141`. Let $g_i \in \{0, 0.5, 1\}$ be submission grades and $c_i = \mathrm{clamp}(g_i, 0, 1)$.

| Indicator | Formula | Location |
|---|---|---|
| **Success rate** | $\mathrm{round}\!\left(100 \cdot \dfrac{\sum_i c_i}{N}\right)$ | `users.ts:357` |
| **Level** | $\left\lfloor \dfrac{\sum_i c_i}{5} \right\rfloor + 1$ | `users.ts:362` |
| **Modules mastered** | $\bigl|\{\text{topics} : \text{masteryScore} \ge 80\}\bigr|$ | `users.ts:369` |
| **Cumulative / global progress** | $\mathrm{round}\!\left(\dfrac{\sum_{\text{topics}} \text{masteryScore}}{\text{total topics}}\right)$ | `dashboard/page.tsx:140` |
| **Streak** | Consecutive calendar days (local `toDateString`) with ≥ 1 submission, counted back from the most recent; resets unless the latest day is today or yesterday | `users.ts:374-407` |
| **Problem History %** (per topic) | $\mathrm{round}\!\left(100 \cdot \dfrac{\text{correct}}{\text{total}}\right)$, where `correct` accumulates $c_i$ | `dashboard/page.tsx:346` |

Two caveats worth a footnote: a half-mark contributes 0.5 to "correct", so **Success rate is not the proportion of fully correct submissions**; and the streak uses local-time day boundaries while being compared against UTC-derived creation times.

### 36. Problem History percentage

Per topic: cumulative credit ÷ attempts × 100, from `studentTopicStats`. Not a recency-weighted or windowed figure — it never forgets, so it is insensitive to improvement late in a long history.

### 37. How one problem influences the next

**It does not, for item selection.** It updates mastery, stats, learning profile and diagnostics, and makes a correction sequence available. The next problem is an independent random draw from the same generator. The *one* exception is study practice sessions, where a **fixed, non-adaptive** difficulty script applies (Q39).

### 38. Complete topic list

**18 canonical topics** in `topicRegistry` (`src/data/topics/index.ts:244`), plus 6 admin aliases. The Linear Algebra list in your screenshot is **not** complete.

*Differential Calculus (4):* `limits`, `derivatives`, `piecewise_continuity`, `domain_range`.

*Linear Algebra (14):* `quadratic_equations`, `linear_systems`, `linear_equations`, `determinants`, `eigenvalues`, `eigenvalues_3x3`, `eigenspaces_2x2`, `linear_independence`, `gram_schmidt`, `inner_product_def`, `integral_inner_product`, `integral_axioms`, `polynomial_inner_product`, `vector_space_axioms`.

*Aliases:* `limits_continuity`, `derivatives_practice`, `systems`, `equations`, `quadratic`, `matrices`, `continuity`, `piecewise`.

### 39. Fixed, parameterised, random, or AI-generated?

**Parameterised templates with uniform random draws. No AI generation.** Each generator picks a variant uniformly (`Math.floor(Math.random() * 3)`) then randomises coefficients, and emits statement, solution, explanation, hint, `reasoningSteps` scaffold, `answerFormat` and the fiche binding — so the ground truth is authored, not inferred.

**Study sessions only:** `studyDifficulty.ts` enforces a fixed sequence — **easy, easy, medium, medium, hard, hard** — obtained by rejection sampling the same generators (up to 80 attempts), then free generation from the 7th problem. It is **identical across experimental arms by design**, so difficulty cannot confound the feedback-condition comparison. This is a strength; report it.

### 40. What is "Fulfill Auto", and did students have it?

It is a **developer/admin testing shortcut**: it fills the answer box with the stored model solution and the reasoning box with the stored explanation (`page.tsx:110-123`), toasting *"Answer and reasoning filled for testing."*

Gated by `isAdmin || process.env.NODE_ENV !== "production"` (`page.tsx:236-240`). In a production deployment, **ordinary students never see it**; it is visible to admins, and to anyone running a development build.

**Its presence in your screenshot means the screenshot was taken either from an admin account or from a non-production build** — so the screenshots do not depict the student-facing interface. Worth resolving before any of them appear in the thesis.

---

## E. Co-design

**None of questions 41–46 can be answered from the codebase.** Git history records *what* changed and *when*, never *why* or *who asked*. There are no co-design session records, participant logs, requirement traces or iteration notes in the repository, and no commit message cites a stakeholder request.

What the repository *can* contribute:

- **A dated feature chronology** (`git log`) — from which any claim of the form "X was introduced after stakeholder feedback" can be **falsified** if X predates the feedback. Given finding 1, most pedagogical features postdate the pilot by 8–10 months, which at least leaves room for the claim that post-survey feedback informed them. The link itself must come from your records.
- **The fiche as a content-validity artefact** — if the criteria, misconceptions and feedback phrasings in `determinants.json` were authored with lecturers, that is a documentable co-design output. If authored by the team alone, it is a design decision.

**My recommendation.** Answer 41–46 yourself from session records, dates and participant counts. If those records are informal, write "informed by" rather than "co-designed" and keep it to a paragraph. A claimed participatory method with no documented procedure is the most reliable way to lose a reviewer, and §44's requested mapping (*stakeholder need → design requirement → implemented feature*) is exactly the artefact that would rescue it — I can help build the right-hand column from the code once you supply the left.

---

## F. Evaluation

### 47–49. Who used this version, for how long, under what conditions

**This is the finding that most affects the thesis.**

| | |
|---|---|
| Pilot window | **6 Oct – 12 Nov 2025** (`donnees-enquetes.md` §1) |
| Repository's first commit | **3 January 2026** |
| Commits during the pilot | **0** |
| Guided Mistake Correction added | **12 August 2026** |
| Fiche-based pedagogical evaluation added | **12 Aug / 23 Aug 2026** |
| Quiz-study RCT instrumentation added | **17 July 2026** |

**The 32 post-survey respondents cannot have used Guided Mistake Correction, the fiche-based reasoning rubric, or Best-of-N.** Either the pilot ran against a predecessor artefact whose history is not in this repository, or the repository was re-initialised and the true history is lost. Only you can say which — but in both cases, **"the students who completed the post-survey used the version in these screenshots" is not supportable**, and I would not let that sentence into the chapter.

Survey Ns, for the record: S-pre 100, S-post 32, T-pre 11, T-post 7; 19 students matched across both waves.

### 50–51. Modules completed, supervision

Not recoverable from the codebase. No session logs, no proctoring state, no condition assignment exists for the 2025 pilot — `experimentAssignments` was created in July 2026. If production Convex data from the pilot still exists it would carry `submissions` rows with timestamps and topic names, which would answer this directly. That is a database query, not a code question, and I can write it if you have access.

### 52. Available interaction logs

What the **current** schema captures (all of it post-dating the pilot):

| Evidence | Table / field |
|---|---|
| Attempts, answers, reasoning text | `submissions.finalAnswer`, `.reasoningSteps`, `.problemStatement` |
| Grades and both half-marks | `.grade`; halves recoverable from `pipelineDiagnostics` |
| AI feedback and judge revision | `.aiFeedback`, `.judgeFeedback`, `.isJudgeModified`, `.judgeConfidence` |
| Detected error | `.errorType`; `submissionDiagnostics.misconception`, `.techniqueUsed`, `.conceptTags` |
| Full three-layer diagnosis | `submissionDiagnostics.casLayer` / `.aiLayer` / `.didacticLayer` (JSON) |
| Correction steps, incl. failures | `remediationSessions.responsesJson` |
| Correction completion and duration | `.status`, `.startedAt`, `.completedAt` |
| Grading latency | `experimentGradingLogs.gradingLatencyMs` |
| Best-of-N candidate set | `.candidatesJson`, `.selectedIndex` |
| Condition assignment | `submissions.experimentCondition`, `.experimentPhase` |
| Mastery trajectory | `submissions.masteryBefore`, `.outcomeReward` |
| Provenance | `ficheId`, `ficheVersion`, `PROMPT_VERSION`, model id |

**Not logged:** time-on-task per problem (only `_creationTime`), hint/solution opening events (`usedHints` is a single boolean), device type, keystroke or revision history.

The **absence of time-on-task and device type** is worth fixing before the next data collection — both were flagged as needed measures, and 63% of your pilot cohort was smartphone-only.

### 53. Pre/post comparison

**Not computable, and your own annex says so** (`donnees-enquetes.md`): the pre and post instruments share neither scales (1–7 numeric vs. 5-level ordinal) nor wording. The pilot evaluation is **perception-based and descriptive**, reported as two separate waves. Interaction-log evidence for the pilot depends on whether that production data still exists (Q50).

### 54. Recorded technical failures, LLM errors, CAS disagreements

**Partially — and not in a queryable form.** Failures are `console.error`'d to Convex logs (ephemeral), and a failed grading is persisted only as a submission with grade 0 and `errorType ∈ {"API Error", "Config Error", "Feedback Error"}`. So failure counts are recoverable by querying those error types.

**CAS–AI disagreement is detectable but not currently recorded as such**: `pipelineDiagnostics.casLayer.equivalent` and the model's own `finalAnswerScore` are both available, but the pre-override model score is discarded before persistence — so you cannot currently measure how often the LLM *would have* contradicted the CAS. **That is a one-line change and a genuinely publishable statistic.** I would add it before the next round of data collection.

### 55. Privacy mechanisms

**Implemented:**
- Clerk authentication; `middleware.ts` protects all non-public routes.
- Per-call ownership checks: `identity.subject !== args.userId` → reject (`gradingPipeline.ts:51`); every remediation and submission query re-verifies ownership.
- **No student identifiers reach the LLM.** The prompt carries the problem, the answer, the reasoning and the fiche — no name, email, user ID or institution.
- API keys server-side only, in Convex environment variables.
- Role gating via `useRole.tsx` + `topicPermissions`.

**Gaps to disclose:**
- **Student-authored content crosses between students.** Few-shot examples are drawn from *other* students' submissions and their feedback (`getApprovedCorrectionsForTopic`, `getHighRewardSubmissions`) and injected into the prompt. No identifiers travel with them, but free-text reasoning can itself be identifying.
- **Third-party processing.** Submissions are sent to Google and/or OpenAI. No DPA, retention policy, regional routing or opt-out is implemented in code.
- No encryption at rest beyond Convex defaults; no retention or deletion policy; no consent artefact in the data model.

---

## Chapter 6 research question — my assessment

Your proposed formulation:

> **RQ4.** How can an AI-supported adaptive mathematics learning environment be co-designed to provide diagnostic feedback, guided mistake correction, and personalised learning support following students' mathematical errors?

**Two terms in it are not supported by the implementation, and a reviewer with access to the system would find both.**

1. **"personalised learning support"** — nothing in the system personalises what a student is asked to do next. Item selection is a uniform random draw; mastery and the per-concept learning profile are recorded but read by no decision. (Q31, Q33, Q37)
2. **"adaptive"**, unqualified — invites comparison with learner-model-driven systems. There is no learner model in the ITS sense: mastery is a monotone counter with fixed increments.

**"co-designed"** is not contradicted by the code, but it is not evidenced by it either, and it currently rests on records I cannot see (§E).

### Suggested reformulation

> **RQ4.** How can a CAS-verified mathematics assessment environment be designed so that an AI grader credits student reasoning against a published, versioned rubric, and so that diagnosed misconceptions deterministically route students into guided correction — and what do students and lecturers require of such a design?

Why this is stronger:

- **"credits student reasoning"** names the actual contribution — the 50/50 split, which is a deliberate commitment rather than an implementation detail.
- **"published, versioned rubric"** foregrounds the fiche, which is what makes an AI-awarded mark institutionally defensible: inspectable, amendable, showable to the student.
- **"deterministically route"** turns the weakness into the claim. Your routing is a pure function of misconception code and fiche — the one part of an adaptive system a lecturer can audit *before* deployment. Determinism is the finding; sell it.
- **"what students and lecturers require"** keeps the co-design clause but makes it a requirements question your survey data can actually answer.

**If you keep "guided mistake correction" in the RQ**, Q22 must be fixed first. A correction ladder whose free-text stages advance on a 12-character threshold cannot support a claim about correction *efficacy* — only about correction *uptake*. Two routes: evaluate free-text responses with the same fiche-constrained grader used for reasoning, or add `expectedAnswer` values for stages 3–4 across topics (which is what `determinants` already does, and is the cheaper fix).

### One scope call

`determinants` is the only topic with a hand-authored fiche deep enough for per-misconception analysis: 7 misconceptions, 6 targeted activations, verifiable correction stages. The other 17 topics have ~2 template-generated misconceptions and no verifiable stages. **Any claim reported per misconception code is, today, a claim about determinants.** Either scope the chapter to it explicitly — which is perfectly respectable — or author two more fiches to that depth before recruiting.
