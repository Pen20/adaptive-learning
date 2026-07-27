# Pilot Item Bank — Pre/Post Quiz for the Study

**Generated:** 2026-07-18 · **Script:** `scripts/generate-item-bank.ts` · **Seed:** 20260718 (reproducible)

## Purpose

Fixed forms for **piloting the measurement instrument** (protocol §5.1, docs/research/protocole-etude-quiz.md) with 10–15 students outside the study. Each topic has two isomorphic versions — **Version A** (pre-test) and **Version B** (post-test) — same problem skeletons, same difficulty composition (2 easy, 2 medium, 2 hard), different numeric parameters. Every item was validated automatically: the ground truth is computed by the direct CAS path (deterministic, no LLM) and the generator's official solution is graded correct by the equivalence checker.

## Pilot administration

- 6 items per topic, **15 minutes**, final answer only, one attempt per item, no feedback and no hints.
- All pilot participants receive **the same items** (a precondition for computing the psychometric indices).
- Mark using the answer key below (accepted equivalences: set notation, equivalent fractions, symbolically equal forms — the same rules as `checkEquivalenceDirect`).

## Item retention criteria (§5.1)

- **Difficulty index** p (proportion correct), target: **0.40 – 0.70**.
- **Discrimination index** D (27% extreme-groups method or point-biserial correlation): **> 0.20**.
- Item outside the targets → regenerate a replacement in the same tier with the script (change BASE_SEED) and re-pilot if feasible.

---

# Topic: Determinants (`determinants`)

## Version A (pre-test)

### DET-A-1 — easy

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 6 & 3 \\ 2 & k \end{bmatrix} $$

*Prompt:* Find $k$ such that $\det(A) = 0$:

*Answer format:* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (e.g. `Example: k = 3/2`)

**Expected answer (CAS key):** `1`

**Official solution:** $k = 1$

### DET-A-2 — easy

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 5 & 1 \\ 1 & k \end{bmatrix} $$

*Prompt:* Find $k$ such that $\det(A) = 0$:

*Answer format:* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (e.g. `Example: k = 3/2`)

**Expected answer (CAS key):** `1/5`

**Official solution:** $k = \dfrac{1}{5}$

### DET-A-3 — medium

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & 2 \\ -2 & 0 & 1 \\ -2 & -2 & -2 \end{vmatrix} $$

*Prompt:* Find $\det(A)$:

*Answer format:* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (e.g. `Example: det(A) = 12`)

**Expected answer (CAS key):** `24`

**Official solution:** $\det(A) = 24$

### DET-A-4 — medium

Compute the determinant:
$$ \begin{vmatrix} 2 & 2 & -1 \\ -2 & -1 & 0 \\ 1 & 1 & 2 \end{vmatrix} $$

*Prompt:* Find $\det(A)$:

*Answer format:* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (e.g. `Example: det(A) = 12`)

**Expected answer (CAS key):** `5`

**Official solution:** $\det(A) = 5$

### DET-A-5 — hard

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 6 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Prompt:* Find the values of $k$ for which the determinant is non-zero:

*Answer format:* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (e.g. `Example: k != 3`)

**Expected answer (CAS key):** `k != 6`

**Official solution:** $k \neq 6$

### DET-A-6 — hard

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 8 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Prompt:* Find the values of $k$ for which the determinant is non-zero:

*Answer format:* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (e.g. `Example: k != 3`)

**Expected answer (CAS key):** `k != 8`

**Official solution:** $k \neq 8$

## Version B (post-test)

### DET-B-1 — easy

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 6 & 2 \\ 3 & k \end{bmatrix} $$

*Prompt:* Find $k$ such that $\det(A) = 0$:

*Answer format:* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (e.g. `Example: k = 3/2`)

**Expected answer (CAS key):** `1`

**Official solution:** $k = 1$

### DET-B-2 — easy

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 3 & 4 \\ 1 & k \end{bmatrix} $$

*Prompt:* Find $k$ such that $\det(A) = 0$:

*Answer format:* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (e.g. `Example: k = 3/2`)

**Expected answer (CAS key):** `4/3`

**Official solution:** $k = \dfrac{4}{3}$

### DET-B-3 — medium

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & 1 \\ -1 & 0 & 1 \\ 0 & 1 & 0 \end{vmatrix} $$

*Prompt:* Find $\det(A)$:

*Answer format:* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (e.g. `Example: det(A) = 12`)

**Expected answer (CAS key):** `-3`

**Official solution:** $\det(A) = -3$

### DET-B-4 — medium

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & -2 \\ -1 & -1 & 0 \\ 2 & -1 & 2 \end{vmatrix} $$

*Prompt:* Find $\det(A)$:

*Answer format:* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (e.g. `Example: det(A) = 12`)

**Expected answer (CAS key):** `-14`

**Official solution:** $\det(A) = -14$

### DET-B-5 — hard

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 3 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Prompt:* Find the values of $k$ for which the determinant is non-zero:

*Answer format:* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (e.g. `Example: k != 3`)

**Expected answer (CAS key):** `k != 3`

**Official solution:** $k \neq 3$

### DET-B-6 — hard

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 1 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Prompt:* Find the values of $k$ for which the determinant is non-zero:

*Answer format:* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (e.g. `Example: k != 3`)

**Expected answer (CAS key):** `k != 1`

**Official solution:** $k \neq 1$

## Answer key — Determinants

| Item | Tier | CAS key |
|---|---|---|
| DET-A-1 | easy | `1` |
| DET-A-2 | easy | `1/5` |
| DET-A-3 | medium | `24` |
| DET-A-4 | medium | `5` |
| DET-A-5 | hard | `k != 6` |
| DET-A-6 | hard | `k != 8` |
| DET-B-1 | easy | `1` |
| DET-B-2 | easy | `4/3` |
| DET-B-3 | medium | `-3` |
| DET-B-4 | medium | `-14` |
| DET-B-5 | hard | `k != 3` |
| DET-B-6 | hard | `k != 1` |

---

# Topic: Eigenvalues & Eigenvectors (2×2) (`eigenvalues`)

## Version A (pre-test)

### EIG-A-1 — easy

Find the eigenvalues of $$ A = \begin{pmatrix} 6 & 0 \\ 0 & 9 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[6, 9]`

**Official solution:** $\lambda_1 = 6,\ \lambda_2 = 9$

### EIG-A-2 — easy

Find the eigenvalues of $$ A = \begin{pmatrix} 2 & 0 \\ 0 & 5 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[2, 5]`

**Official solution:** $\lambda_1 = 2,\ \lambda_2 = 5$

### EIG-A-3 — medium

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 1 \\ 0 & 6 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[3, 6]`

**Official solution:** $\lambda_1 = 3,\ \lambda_2 = 6$

### EIG-A-4 — medium

Find the eigenvalues of $$ A = \begin{pmatrix} 1 & 4 \\ 0 & 3 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[1, 3]`

**Official solution:** $\lambda_1 = 1,\ \lambda_2 = 3$

### EIG-A-5 — hard

Find the eigenvalues of $$ A = \begin{pmatrix} 5 & 1 \\ 1 & 5 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[4, 6]`

**Official solution:** $\lambda_1 = 4,\ \lambda_2 = 6$

### EIG-A-6 — hard

Find the eigenvalues of $$ A = \begin{pmatrix} 7 & 1 \\ 1 & 7 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[6, 8]`

**Official solution:** $\lambda_1 = 6,\ \lambda_2 = 8$

## Version B (post-test)

### EIG-B-1 — easy

Find the eigenvalues of $$ A = \begin{pmatrix} 4 & 0 \\ 0 & 5 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[4, 5]`

**Official solution:** $\lambda_1 = 4,\ \lambda_2 = 5$

### EIG-B-2 — easy

Find the eigenvalues of $$ A = \begin{pmatrix} 2 & 0 \\ 0 & 6 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[2, 6]`

**Official solution:** $\lambda_1 = 2,\ \lambda_2 = 6$

### EIG-B-3 — medium

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 2 \\ 0 & 5 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[3, 5]`

**Official solution:** $\lambda_1 = 3,\ \lambda_2 = 5$

### EIG-B-4 — medium

Find the eigenvalues of $$ A = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[1, 3]`

**Official solution:** $\lambda_1 = 1,\ \lambda_2 = 3$

### EIG-B-5 — hard

Find the eigenvalues of $$ A = \begin{pmatrix} 8 & 1 \\ 1 & 8 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[7, 9]`

**Official solution:** $\lambda_1 = 7,\ \lambda_2 = 9$

### EIG-B-6 — hard

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 1 \\ 1 & 3 \end{pmatrix} $$

*Prompt:* Find all eigenvalues $\lambda$:

*Answer format:* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (e.g. `Example: lambda in {2, 5}`)

**Expected answer (CAS key):** `[2, 4]`

**Official solution:** $\lambda_1 = 2,\ \lambda_2 = 4$

## Answer key — Eigenvalues & Eigenvectors (2×2)

| Item | Tier | CAS key |
|---|---|---|
| EIG-A-1 | easy | `[6, 9]` |
| EIG-A-2 | easy | `[2, 5]` |
| EIG-A-3 | medium | `[3, 6]` |
| EIG-A-4 | medium | `[1, 3]` |
| EIG-A-5 | hard | `[4, 6]` |
| EIG-A-6 | hard | `[6, 8]` |
| EIG-B-1 | easy | `[4, 5]` |
| EIG-B-2 | easy | `[2, 6]` |
| EIG-B-3 | medium | `[3, 5]` |
| EIG-B-4 | medium | `[1, 3]` |
| EIG-B-5 | hard | `[7, 9]` |
| EIG-B-6 | hard | `[2, 4]` |

---

# Topic: Derivatives (`derivatives`)

## Version A (pre-test)

### DER-A-1 — easy

Find the derivative of the function $$ f(x) = 4x^4 + 4x + 1 $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the power rule to each term. Constants differentiate to 0. (e.g. `Example: 16x^3 + 4`)

**Expected answer (CAS key):** `16*x^3+4`

**Official solution:** \(16x^3 + 4\)

### DER-A-2 — easy

Find the derivative of the function $$ f(x) = 4x^5 + 4x + 1 $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the power rule to each term. Constants differentiate to 0. (e.g. `Example: 20x^4 + 4`)

**Expected answer (CAS key):** `20*x^4+4`

**Official solution:** \(20x^4 + 4\)

### DER-A-3 — medium

Find the derivative of the function $$ g(x) = \ln(2x^2 + 5) $$

*Prompt:* Find \(g'(x)\):

*Answer format:* Write the derivative as a simplified fraction. Equivalent forms are accepted. (e.g. `Example: 4x/(2x^2+5)`)

**Expected answer (CAS key):** `4*(2*x^2+5)^(-1)*x`

**Official solution:** \(\dfrac{4x}{2x^2 + 5}\)

### DER-A-4 — medium

Find the derivative of the function $$ f(x) = 2 \cos(2x) $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Write the derivative as a mathematical expression. Use \\sin, \\cos notation or plain text. Order and spacing do not matter. (e.g. `Example: -6 sin(2x)`)

**Expected answer (CAS key):** `-4*sin(2*x)`

**Official solution:** \(-4 \sin(2x)\)

### DER-A-5 — hard

Find the derivative of the function $$ f(x) = \frac{4x + 4}{3x + 4} $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the quotient rule. Give the simplified result with the denominator squared. (e.g. `Example: 4/(3x+ 4)^2`)

**Expected answer (CAS key):** `-3*(3*x+4)^(-2)*(4+4*x)+4*(3*x+4)^(-1)`

**Official solution:** \(\dfrac{4}{(3x + 4)^2}\)

### DER-A-6 — hard

Find the derivative of the function $$ f(x) = x^4 \cdot e^{5x} $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the product rule. Factored or expanded forms are both accepted. (e.g. `Example: e^(5x)(4x^3 + 5x^4)`)

**Expected answer (CAS key):** `4*e^(5*x)*x^3+5*e^(5*x)*x^4`

**Official solution:** \(e^{5x}(4x^{3} + 5x^4)\)

## Version B (post-test)

### DER-B-1 — easy

Find the derivative of the function $$ f(x) = 5x^4 + 5x + 2 $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the power rule to each term. Constants differentiate to 0. (e.g. `Example: 20x^3 + 5`)

**Expected answer (CAS key):** `20*x^3+5`

**Official solution:** \(20x^3 + 5\)

### DER-B-2 — easy

Find the derivative of the function $$ f(x) = 4x^3 + 3x + 1 $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the power rule to each term. Constants differentiate to 0. (e.g. `Example: 12x^2 + 3`)

**Expected answer (CAS key):** `12*x^2+3`

**Official solution:** \(12x^2 + 3\)

### DER-B-3 — medium

Find the derivative of the function $$ f(x) = 3 \cos(2x) $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Write the derivative as a mathematical expression. Use \\sin, \\cos notation or plain text. Order and spacing do not matter. (e.g. `Example: -6 sin(2x)`)

**Expected answer (CAS key):** `-6*sin(2*x)`

**Official solution:** \(-6 \sin(2x)\)

### DER-B-4 — medium

Find the derivative of the function $$ g(x) = \ln(2x^2 + 2) $$

*Prompt:* Find \(g'(x)\):

*Answer format:* Write the derivative as a simplified fraction. Equivalent forms are accepted. (e.g. `Example: 4x/(2x^2+2)`)

**Expected answer (CAS key):** `4*(2+2*x^2)^(-1)*x`

**Official solution:** \(\dfrac{4x}{2x^2 + 2}\)

### DER-B-5 — hard

Find the derivative of the function $$ f(x) = \frac{3x + 2}{5x + 5} $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the quotient rule. Give the simplified result with the denominator squared. (e.g. `Example: 5/(5x+ 5)^2`)

**Expected answer (CAS key):** `-5*(2+3*x)*(5+5*x)^(-2)+3*(5+5*x)^(-1)`

**Official solution:** \(\dfrac{5}{(5x + 5)^2}\)

### DER-B-6 — hard

Find the derivative of the function $$ f(x) = x^3 \cdot e^{2x} $$

*Prompt:* Find \(f'(x)\):

*Answer format:* Apply the product rule. Factored or expanded forms are both accepted. (e.g. `Example: e^(2x)(3x^2 + 2x^3)`)

**Expected answer (CAS key):** `2*e^(2*x)*x^3+3*e^(2*x)*x^2`

**Official solution:** \(e^{2x}(3x^{2} + 2x^3)\)

## Answer key — Derivatives

| Item | Tier | CAS key |
|---|---|---|
| DER-A-1 | easy | `16*x^3+4` |
| DER-A-2 | easy | `20*x^4+4` |
| DER-A-3 | medium | `4*(2*x^2+5)^(-1)*x` |
| DER-A-4 | medium | `-4*sin(2*x)` |
| DER-A-5 | hard | `-3*(3*x+4)^(-2)*(4+4*x)+4*(3*x+4)^(-1)` |
| DER-A-6 | hard | `4*e^(5*x)*x^3+5*e^(5*x)*x^4` |
| DER-B-1 | easy | `20*x^3+5` |
| DER-B-2 | easy | `12*x^2+3` |
| DER-B-3 | medium | `-6*sin(2*x)` |
| DER-B-4 | medium | `4*(2+2*x^2)^(-1)*x` |
| DER-B-5 | hard | `-5*(2+3*x)*(5+5*x)^(-2)+3*(5+5*x)^(-1)` |
| DER-B-6 | hard | `2*e^(2*x)*x^3+3*e^(2*x)*x^2` |

---

## Index worksheet (to fill in after the pilot)

| Item | n responses | n correct | p | D | Verdict (keep / replace) |
|---|---|---|---|---|---|
| DET-A-1 |  |  |  |  |  |
| DET-A-2 |  |  |  |  |  |
| DET-A-3 |  |  |  |  |  |
| DET-A-4 |  |  |  |  |  |
| DET-A-5 |  |  |  |  |  |
| DET-A-6 |  |  |  |  |  |
| DET-B-1 |  |  |  |  |  |
| DET-B-2 |  |  |  |  |  |
| DET-B-3 |  |  |  |  |  |
| DET-B-4 |  |  |  |  |  |
| DET-B-5 |  |  |  |  |  |
| DET-B-6 |  |  |  |  |  |
| EIG-A-1 |  |  |  |  |  |
| EIG-A-2 |  |  |  |  |  |
| EIG-A-3 |  |  |  |  |  |
| EIG-A-4 |  |  |  |  |  |
| EIG-A-5 |  |  |  |  |  |
| EIG-A-6 |  |  |  |  |  |
| EIG-B-1 |  |  |  |  |  |
| EIG-B-2 |  |  |  |  |  |
| EIG-B-3 |  |  |  |  |  |
| EIG-B-4 |  |  |  |  |  |
| EIG-B-5 |  |  |  |  |  |
| EIG-B-6 |  |  |  |  |  |
| DER-A-1 |  |  |  |  |  |
| DER-A-2 |  |  |  |  |  |
| DER-A-3 |  |  |  |  |  |
| DER-A-4 |  |  |  |  |  |
| DER-A-5 |  |  |  |  |  |
| DER-A-6 |  |  |  |  |  |
| DER-B-1 |  |  |  |  |  |
| DER-B-2 |  |  |  |  |  |
| DER-B-3 |  |  |  |  |  |
| DER-B-4 |  |  |  |  |  |
| DER-B-5 |  |  |  |  |  |
| DER-B-6 |  |  |  |  |  |
