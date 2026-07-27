# Survey Data Annex — MMUST Pilot Study

**Version:** 1.1 — 27 July 2026
**Source:** the four `.xlsx` files (Google Forms exports) in the project root.
**Purpose:** pre-fill §4.2, §4.3 and §7 of [`papier1-squelette.md`](papier1-squelette.md). Figures below are ready to be copied into the manuscript as they stand.

> ⚠️ **Status:** raw descriptives, verified by script (`scratchpad/stats.py`, `selection.py`). Thematic analysis of the open-ended responses still has to be done by hand — the verbatims selected below are candidates, not a coding scheme.

---

## 1. The four instruments

| # | Instrument | Population | n | Collection window |
|---|---|---|---|---|
| S-pre | *Students' Perceptions **Before** Using the AI-Powered STACK Recommendation System* | students | **100** | 9 Oct – 12 Nov 2025 |
| S-post | *Students' Perceptions **After** Using the AI-Powered STACK Recommendation System* | students | **32** | 3 Nov – 12 Nov 2025 |
| T-pre | *STACK – AI Analytics Assistant Pilot Study* (pre) | lecturers | **11** | 6 Oct – 11 Nov 2025 |
| T-post | *POST SURVEY – AI analytics* | lecturers | **7** | 7 Oct – 5 Nov 2025 |

**Overall pilot period: 6 October – 12 November 2025** (Kenyan semester).

### Pre/post matching (by email address)

- **Students: 19 unique individuals** answered both surveys (20 rows on the S-pre side — one duplicate submission). That is 59% of the post sample and 19% of the pre sample.
- **Lecturers: 4** matched, but only 4 of the 7 T-post responses carry an email address, so lecturer-side matching is partial and not usable.

> ⚠️ **Structural limitation to own up to in the paper:** the pre and post items share **neither** the same scales (S-pre = numeric 1–7; S-post = 5-level ordinal labels) **nor** the same wording. **No pre/post test is computable.** The two waves are reported separately, descriptively. This is precisely the gap the randomised trial in Paper 2 fills.

### Selection check (are the 19 matched students atypical?)

Comparison of **baseline** means (S-pre) between matched (n = 20 rows) and unmatched (n = 80) respondents:

- Small differences across the 12 seven-point items: |Δ| ≤ 0.42, most below 0.35.
- Largest gap: "STACK helps me identify which concepts to practise more" — matched 5.55 vs unmatched 5.97 (Δ = −0.42).
- **Notable imbalance on year of study:** 90% of matched respondents are in year 4 or above, against 59% of the unmatched.
- Gender: 75% male among matched vs 66% unmatched.

→ **To write in §7.1:** post-survey respondents are advanced students and do not differ appreciably from the rest on baseline attitudes; self-selection on seniority is a limitation.

---

## 2. Samples — demographic descriptives

### Students

| | S-pre (n=100) | S-post (n=32) |
|---|---|---|
| Male / Female | 68% / 32% | 65% / 35% (n=31) |
| Year 4 or above | 65% | 62% |
| Year 3 | 31% | 38% |
| Year 2 | 4% | — |
| Institution | MMUST 100% | MMUST 97%, U. of Trieste 3% |
| Main programme | — | BSc Mathematics 42%, BEd Science 29% |
| **Smartphone-only access** | **63%** | **66%** |
| Laptop + smartphone | 30% | 28% |
| Laptop only | 4% | 6% |
| Prior STACK familiarity | regular/very frequent use 61% | "frequently used" 53%, "occasionally" 44%, never 3% |

> **Headline figure: two thirds of students reach the platform on a smartphone alone.** That is a strong design argument (responsive, low bandwidth) and a marker of the resource-constrained setting.

**Internet reliability** (1–7): S-pre M = 4.94 (SD 1.49), 16% ≤ 3 — S-post M = 5.38 (SD 1.18), 3% ≤ 3.

### Lecturers (T-pre, n=11)

| Variable | Distribution |
|---|---|
| Gender | 7 M / 4 F |
| Institution | MMUST 10, Maseno University 1 |
| Position | Lecturer 5, Teaching Assistant 4, Senior Lecturer 1, STACK content developer 1 |
| Experience | 0–2 years: 5; 3–5 years: 1; 6+ years: 5 |
| **Typical class size** | **40–150: 6; 150–300: 4; > 300: 1** |
| STACK experience | Basic 5, Intermediate 2, Advanced 4 |
| Courses taught with STACK | Differential Calculus (8/11), Linear Algebra I–II (5), Analytical Geometry (5), Integral Calculus (4), Foundations of Pure Mathematics (4), Complex Analysis (3), Vector Analysis (3), Measure Theory (2), Advanced Calculus, Statistics, Engineering Mathematics |

---

## 3. Findings I — needs analysis (paper §5)

### 3.1 Lecturers: the analytics gap, quantified

| Item (T-pre) | Result |
|---|---|
| Frequency of analysing assessment data | *Sometimes* 55%, *Often* 18%, *Every assessment* 9%, *Rarely* 9%, *Never* 9% |
| **Use any digital tool to analyse STACK data** | **No: 7/11 (64%)** — Yes: 4/11 (36%) |
| Reasons for non-use (n=7, multiple choice) | **unaware of available tools: 6/7**; **lack of training or skills: 5/7**; lack of institutional support: 1; no perceived need: 1 |
| Confidence analysing without tools (n=7) | *Moderately confident* 4, *Not at all* 2, *Somewhat* 1 |
| Main challenges (n=4 tool users) | **lack of time 4/4**; **finding student errors 3/4**; **understanding why 2/4**; low-discrimination items 1; finding at-risk students 1 |
| Data wanted if a simple tool existed (n=7) | grades 6/7; **progress over time 6/7**; **errors and misconceptions 4/7**; item difficulty 3/7 |

**Candidate verbatims (T-pre):**

> "Lack of awareness of available tools, Lack of training or skills" — the dominant reason, 6 respondents out of 7.

> "I would be able to address common misconceptions and errors, be able to monitor my students progress and so be more effective in my teaching."

> "I focus on student attempt patterns, time spent per question, number of reattempts, and specific error types. I also look at question discrimination indices, average difficulty levels, and performance distributions across cohorts." *(the one already-equipped lecturer — describes exactly what the dashboard implements; excellent verbatim for the needs→design traceability argument)*

> "It is a good idea to embed AI powered tools in STACK" / "Inco-operating AI on stack to make work easier" *(demand for integration — gap 8 in §5.1)*

> "To identify, procure and embed the most robust data analysis tools in STACK for purposes of analysis."

### 3.2 Students: the feedback gap, quantified (S-pre, n=100, 1–7 scales)

| Item | M | SD | Md | % ≥ 5 | % ≤ 3 |
|---|---|---|---|---|---|
| 10. Confidence using STACK | 5.54 | 1.37 | 6 | 82% | 6% |
| **13. I clearly understand *why* my answer is marked incorrect** | **4.59** | **1.61** | **4** | **50%** | **20%** |
| 14. Helpfulness of STACK's current explanations/feedback | 5.56 | 1.27 | 6 | 81% | 4% |
| **16. STACK marks fairly when I use valid alternative methods** | **5.19** | **1.54** | 5 | 71% | **11%** |
| **17. Confidence that STACK accurately evaluates my reasoning** | **5.07** | **1.42** | 5 | 64% | 11% |
| 19. STACK encourages me to reflect on my mistakes | 5.54 | 1.42 | 6 | 77% | 9% |
| 20. STACK helps me identify concepts to practise more | 5.89 | 1.44 | 6 | 85% | 6% |

> **The central result of §5.2, and it is clean:** the lowest item in the whole instrument is **"I understand *why* I am marked incorrect" (M = 4.59, Md = 4, only 50% above the midpoint)** — well below general confidence in STACK (5.54) and perceived helpfulness of its feedback (5.56). Students **accept STACK but do not understand its verdicts.** That is exactly the praxeological gap of §3.1, measured.

**Expectations of AI, before any use (S-pre):**

| Item | M | SD | % ≥ 5 |
|---|---|---|---|
| 22. The recommender will suggest questions at my level | 5.69 | 1.19 | 84% |
| **23. AI will help me target my weak areas** | **6.02** | **1.18** | **92%** |
| 25. I trust AI to make fair recommendations | 5.42 | 1.27 | 76% |
| 27. I will follow the AI's recommendations | 5.77 | 1.15 | 87% |
| 28. Motivation to explore the AI's feedback | 5.87 | 1.26 | 86% |

→ Expectations were already very high **before** use (up to 92%). Use this in §7 as an interpretive guard-rail: positive post ratings may reflect that initial enthusiasm as much as tool quality (expectancy / novelty effects).

**Candidate verbatims (S-pre, Q18 "What situations made you question whether STACK's marking was fair or accurate?") — grouped by mechanism:**

*Symbolic equivalence not recognised:*
> "Just because i wrote x+y and stack says y+x doesn't mean am wrong." ⭐ *(ideal verbatim for §1.2)*

> "Sometimes my answer is marked wrong but during review the stack's answer is the same as mine"

> "In some few cases you're marked wrong and the correction feedback is the same as your wrong answer"

*Syntax / format:*
> "Sometimes you put double space mistakenly and the answer automatically becomes wrong."

> "Sometimes the answers are correct but not in a form given in stack and not a requirement on the question. You fail when you got the correct answer still"

> "By writing correct answers but not knowing the format on how to write"

*Alternative method rejected:*
> "This was a situation when I used a different approach to a quiz, got a correct answer but still the stack marked me wrong"

> "I did a math problem according to my class examples but I still got an incorrect answer"

> "When I have my lecture notes… An exact example from the notes and it's marked wrong. That means even my lecturers are wrong" ⭐ *(shows the epistemic cost: the student ends up doubting their lecturer)*

*Final-answer-only marking:*
> "Marking the final answers only"

> "Mark the steps not final answer" *(Q21)*

> "The partial marking of questions I really doubt it since sometimes you feel you deserve all the marks"

**Candidate verbatims (S-pre, Q21 "What feedback would you wish for?") — these map directly onto DP1–DP3:**

> "identifying exactly where mistakes are made and how to improve, along with clearer explanations of why certain approaches are effective or ineffective" ⭐ *(almost a word-for-word statement of DP1)*

> "Explanation as to why some of my solutions are wrong plus order of answers which are correct should be considered" *(DP1 + equivalence)*

> "By giving a step by step way of handling a certain problem after doing it wrong other than skipping some steps and reaching the answer with direct solution" *(DP3)*

> "I wish stack could be providing the reason why you may be marked wrong while you use a different approach to a problem" *(DP1 + DP2)*

> "It would be nice if stack gave extra practice questions in my weak areas." ⭐ *(an explicit request for the adaptive loop of §6.3.3, voiced by a student before any exposure to it)*

> "Detailing the solutions in detail and not assuming I have a clue on the calculation in the solution."

> "Alternative approaches to a given problem" / "Give several solution during computation of problems"

*Out-of-scope requests (worth a mention in §8.5 / future work):* audio and video explanations (≥ 6 mentions), integrated lecture notes, handwritten-script scanning, fewer symbolic notations.

---

## 4. Findings II — post-deployment perceptions (paper §7)

### 4.1 Students (S-post, n=32) — favourable share (top two categories)

| Item | Favourable | Breakdown |
|---|---|---|
| **20. Perceived impact on understanding / performance** | **91%** (29/32) | Strongly positive 34%, Positive 56% |
| 26. Clarity of the questions displayed | 91% (29/32) | Very clear 38%, Clear 53% |
| **14. The AI feedback helped my understanding** | **88%** (28/32) | Very helpful 38%, Helpful 50% |
| 18. Usefulness of step-by-step reasoning and hints | 84% (27/32) | Very useful 41%, Useful 44% |
| 23. Buttons intuitive (Check Solution / Show Steps / Generate) | 84% (27/32) | Very much 44%, Mostly 41% |
| **16. Understood my mistakes better than with traditional feedback** | **78%** (25/32) | Strongly agree 34%, Agree 44%, **Neutral 22%, no disagreement at all** |
| 22. Ease of navigation | 78% (25/32) | 6% "Difficult" |
| 19. Expectations met | 75% (24/32) | Fully met 25%, Mostly met 50% |
| 11. More helpful than other online tools | 72% (23/32) | 3% "Not at all helpful" |

**Comparison of the three models (1–5, S-post):**

| Model | M | SD | % ≥ 4 |
|---|---|---|---|
| GPT-4o | 4.12 | 1.24 | 75% |
| GPT-4o-mini | 4.25 | 0.95 | 81% |
| GPT-3.5-Turbo | 4.03 | 1.20 | 75% |

Stated preference (Q28, open-ended): **GPT-4o 14 mentions, GPT-4o-mini 8, GPT-3.5-Turbo 1**, with 9 unusable responses ("Yes", "All", "I don't know").

> ⚠️ **Handle with care:** the differences between models are within noise (SD ≈ 1 at n = 32) and exposure to models was neither controlled nor randomised — one respondent writes "GPT-4o that's what I had", another "I didn't use it". **Do not present this as a model comparison.** Frame it as: "students do not reliably distinguish between models, which motivates the randomised protocol of Paper 2." That is an argument, not a confession.

### 4.2 Lecturers (T-post, n=7)

| Item | Result |
|---|---|
| Ease of learning the tool | **100%** *Easy* (6) or *Very easy* (1) |
| "Good idea for my teaching practice" | **100%** (Agree 5, Strongly agree 2) |
| Overall attitude | **100%** positive (Positive 5, Very positive 2) |
| Would recommend to colleagues | **100%** (Likely 4, Definitely yes 3) |
| Intent to reuse next semester | 86% (Strongly/Agree 6, Somewhat agree 1) |
| Improves understanding of student difficulties | *Quite effective* 57%, *Very* 29%, *Extremely* 14% |
| Could enhance learning outcomes | *Very large / greatest extent* 71% |
| Would use insights to adjust teaching | Agree/Strongly 71% — **1 respondent *Strongly disagree*** |
| **Trust in the analytics (difficulty, discrimination, error patterns), 1–7** | **M = 5.86 (SD 0.69) — 7/7 ≥ 5** |
| Overall satisfaction (1–7) | M = 5.71 (SD 0.76) — 7/7 ≥ 5 |
| Confidence increased by explanations and examples (1–5) | M = 4.57 (SD 0.53) |
| Resources available (time/devices/internet) (1–7) | **M = 4.57, SD 2.07** — highly dispersed, one respondent at 1 |
| Component ratings (1–5) | Mistake Analyzer M = 4.14; Feedback Assistant + Chatbot M = 4.00 |

**Chat vs dashboards (1–7):** chat helps find answers faster than dashboards M = 5.14; the reverse M = 3.86; both combined M = 4.29. Preferred modality: **dashboards 43%, both equally 43%, chat 14%**.
→ Honest reading: lecturers *find* answers faster through chat but *prefer* dashboards. Good material for §8 (chat serves the targeted query, the dashboard the overview).

**NEA categories (Q21, n=4 responses):** 4/4 judge them clear — "The categories agree with standard definitions for the categories." Too thin a base for a validity claim; present as a signal, not evidence.

**Candidate verbatims (T-post):**

*Perceived value:*
> "When i want to analyze my data to the core, beyond the scores — to identify the specific errors made by my students" ⭐ *("beyond the scores" is the paper's pitch in three words)*

> "It helped me identify a conceptual misunderstanding made by my students."

> "Easily identified students' errors and I was able to identify their weaknesses."

> "Ability to handle a large number of students at ago" *(tie back to the 150–300+ class sizes)*

*Criticisms — quote these, they build credibility:*
> "The aspect of just giving the answers without steps." and "Answers without showing steps" *(two lecturers: step-level grading was not yet exposed on the lecturer side → cycle 2 refinement)*

> "My large class size of over 100 students." *(scaling hesitation)*

> "It takes too long to synchronize, I'm not sure if it's dependent on the internet speed." *(latency / bandwidth)*

> "They are only based on the answers and not the steps" *(on trusting the chatbot's recommendations)*

*Adoption conditions:*
> "If STACK is explicitly adopted as an assessment tool." — the other responses cite workshops, training, ICT support (5/5 mention training or support).

> "Ideally, it should be central IT but since the institution is cash-strapped, possibly research projects" ⭐ *(sustainability in a resource-constrained setting — §8.5)*

> "The tool is great, it is the resources that are inadequate"

### 4.3 Students — open-ended responses (S-post)

**Methodological caution:** post-test open responses are **very short** (mode = 1–3 words: "Good", "Excellent", "Better"), collected mostly on smartphones. Of 32 responses to "Why is this AI approach better?", 11 reduce to "Better"/"It's better". **Do not over-interpret; do not claim a rich thematic analysis.** A small number of substantive responses carries most of the content.

*Dominant theme: hints before answering* — spontaneously mentioned by ≥ 8 respondents in Q13 "which part was most helpful?":
> "The way it gives a hint before you answer which makes you practice before getting an answer"

> "When it gave me hints on answering questions" / "The hint/ formula part" / "Giving hint"

*Theme: immediate feedback and error localisation:*
> "The instant feedback feature was the most helpful because it showed me my mistakes right away and helped me understand how to correct them."

> "It highlight mistakes and what was required to be done"

> "I could correct the mistake with no much help"

*Theme: "Explain Your Reasoning" — the reasoning space:*
> "Gave me a thinking space to validate my take on the question" ⭐

> "It gives you space to express yourself" / "Gives space for my reasoning"

> "They encouraged me to justify my answers and see results instantly, which strengthened my learning."

*Counterpoint worth quoting (important for honesty):*
> "For me it was a little difficult up to now I am having trouble understanding how to explain my answers" ⭐ *(articulating one's reasoning is a cognitive cost, not a gift — a rare and valuable nuance)*

> "It sometimes does not show some steps in calculating a particular and if you are not keen you might miss the steps"

> "It is not accurate" / "It helps partially" *(2 clearly negative respondents)*

*Requested improvements (Q32/Q33):* more detail in the steps; audio and video explanations (≥ 4); progress tracking / attempt history; coverage of more units; handwritten-script scanning; offline availability; latency.

---

## 5. What these data support — and what they do not

**They support:**
- Quantifying the gap on the student side (understanding of the verdict M = 4.59 vs general trust 5.54) and on the lecturer side (64% with no analysis tool at all; 6/7 through sheer unawareness).
- Documenting the resource-constrained context (two thirds smartphone-only, class sizes 40–300+, 16% rating connectivity ≤ 3/7).
- Establishing the feasibility and acceptability of both prototypes (100% of lecturers would recommend; 88% of students found the AI feedback helpful).
- Surfacing field requirements that the design actually implemented (traceability, §6.4).

**They do not support:**
- Any causal inference or learning gain — no performance measure, no control group.
- Any pre/post test: scales and item wording are not matched across waves (an instrument-design limitation).
- Any LLM model comparison: uncontrolled exposure, small n, differences within noise.
- Any statistical generalisation: single site, convenience samples, self-selection (post respondents 90% in year 4+).

---

## 6. Still to obtain

- [ ] **Exact ethics status of the pilot**: IERC MMUST approval and/or NACOSTI permit — number and date. Consent is properly documented in both instruments (100% consenting; the student wording covers anonymity, confidentiality and withdrawal without penalty) — a good basis for the ethics statement, but the institutional approval must be cited.
- [x] **Number of interviews** — resolved from the pilot summary PDF: all **7 MMUST mathematics lecturers** were interviewed individually (within the 11 lecturers overall). The **interview guides themselves are still missing**.
- [ ] ⚠️ **Discrepancy to resolve:** the pilot summary states that 100 students "participated in both pre- and post-surveys". The post-survey export contains **32** responses. The 32 figure is the one supported by the data and the one used in the draft.
- [ ] **Platform usage descriptives**: number of submissions, judge override rate, error-type distribution (`experiment:exportSubmissions`).
- [ ] **Anonymisation**: the four files contain email addresses and phone numbers. Produce depersonalised versions before any sharing or data deposit, and **never commit them as they stand**.
