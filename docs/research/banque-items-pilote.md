# Banque d'items pilotes — Quiz pré/post de l'étude

**Générée le :** 2026-07-18 · **Script :** `scripts/generate-item-bank.ts` · **Seed :** 20260718 (reproductible)

## Objet

Formes fixes destinées au **pilotage de l'instrument de mesure** (protocole §5.1, docs/research/protocole-etude-quiz.md) auprès de 10–15 étudiants hors étude. Chaque sujet a deux versions isomorphes — **Version A** (pré-test) et **Version B** (post-test) — mêmes squelettes de problèmes, mêmes proportions de difficulté (2 faciles, 2 moyens, 2 difficiles), paramètres numériques différents. Chaque item a été validé automatiquement : la vérité terrain est calculée par le CAS direct (déterministe, sans LLM) et la solution officielle du générateur est notée correcte par le correcteur d'équivalence.

## Administration du pilote

- 6 items par sujet, **15 minutes**, réponse finale uniquement, une tentative par item, sans feedback ni indice.
- Tous les pilotes reçoivent **les mêmes items** (c'est la condition du calcul des indices psychométriques).
- Correction avec la clé de réponse ci-dessous (équivalences acceptées : notation d'ensemble, fractions équivalentes, formes symboliquement égales — mêmes règles que `checkEquivalenceDirect`).

## Critères de rétention des items (§5.1)

- **Indice de difficulté** p (proportion de réussite) visé : **0,40 – 0,70**.
- **Indice de discrimination** D (méthode des groupes extrêmes 27 % ou corrélation point-bisériale) : **> 0,20**.
- Item hors cibles → régénérer un remplaçant du même palier avec le script (changer BASE_SEED) et re-piloter si possible.

---

# Sujet : Determinants (`determinants`)

## Version A (pré-test)

### DET-A-1 — facile

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 6 & 3 \\ 2 & k \end{bmatrix} $$

*Consigne :* Find $k$ such that $\det(A) = 0$:

*Format de réponse :* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (ex. `Example: k = 3/2`)

**Réponse attendue (clé CAS) :** `1`

**Solution officielle :** $k = 1$

### DET-A-2 — facile

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 5 & 1 \\ 1 & k \end{bmatrix} $$

*Consigne :* Find $k$ such that $\det(A) = 0$:

*Format de réponse :* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (ex. `Example: k = 3/2`)

**Réponse attendue (clé CAS) :** `1/5`

**Solution officielle :** $k = \dfrac{1}{5}$

### DET-A-3 — moyen

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & 2 \\ -2 & 0 & 1 \\ -2 & -2 & -2 \end{vmatrix} $$

*Consigne :* Find $\det(A)$:

*Format de réponse :* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (ex. `Example: det(A) = 12`)

**Réponse attendue (clé CAS) :** `24`

**Solution officielle :** $\det(A) = 24$

### DET-A-4 — moyen

Compute the determinant:
$$ \begin{vmatrix} 2 & 2 & -1 \\ -2 & -1 & 0 \\ 1 & 1 & 2 \end{vmatrix} $$

*Consigne :* Find $\det(A)$:

*Format de réponse :* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (ex. `Example: det(A) = 12`)

**Réponse attendue (clé CAS) :** `5`

**Solution officielle :** $\det(A) = 5$

### DET-A-5 — difficile

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 6 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Consigne :* Find the values of $k$ for which the determinant is non-zero:

*Format de réponse :* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (ex. `Example: k != 3`)

**Réponse attendue (clé CAS) :** `k != 6`

**Solution officielle :** $k \neq 6$

### DET-A-6 — difficile

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 8 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Consigne :* Find the values of $k$ for which the determinant is non-zero:

*Format de réponse :* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (ex. `Example: k != 3`)

**Réponse attendue (clé CAS) :** `k != 8`

**Solution officielle :** $k \neq 8$

## Version B (post-test)

### DET-B-1 — facile

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 6 & 2 \\ 3 & k \end{bmatrix} $$

*Consigne :* Find $k$ such that $\det(A) = 0$:

*Format de réponse :* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (ex. `Example: k = 3/2`)

**Réponse attendue (clé CAS) :** `1`

**Solution officielle :** $k = 1$

### DET-B-2 — facile

Find the value of $k$ for which the matrix is singular:
$$ A = \begin{bmatrix} 3 & 4 \\ 1 & k \end{bmatrix} $$

*Consigne :* Find $k$ such that $\det(A) = 0$:

*Format de réponse :* Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted. (ex. `Example: k = 3/2`)

**Réponse attendue (clé CAS) :** `4/3`

**Solution officielle :** $k = \dfrac{4}{3}$

### DET-B-3 — moyen

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & 1 \\ -1 & 0 & 1 \\ 0 & 1 & 0 \end{vmatrix} $$

*Consigne :* Find $\det(A)$:

*Format de réponse :* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (ex. `Example: det(A) = 12`)

**Réponse attendue (clé CAS) :** `-3`

**Solution officielle :** $\det(A) = -3$

### DET-B-4 — moyen

Compute the determinant:
$$ \begin{vmatrix} 2 & -2 & -2 \\ -1 & -1 & 0 \\ 2 & -1 & 2 \end{vmatrix} $$

*Consigne :* Find $\det(A)$:

*Format de réponse :* Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear. (ex. `Example: det(A) = 12`)

**Réponse attendue (clé CAS) :** `-14`

**Solution officielle :** $\det(A) = -14$

### DET-B-5 — difficile

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 3 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Consigne :* Find the values of $k$ for which the determinant is non-zero:

*Format de réponse :* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (ex. `Example: k != 3`)

**Réponse attendue (clé CAS) :** `k != 3`

**Solution officielle :** $k \neq 3$

### DET-B-6 — difficile

Find the values of $k$ for which the determinant is non-zero:
$$ \begin{bmatrix} 1 & 4 & 3 \\ -3 & 0 & -5 \\ k & 4 & 3 \end{bmatrix} $$

*Consigne :* Find the values of $k$ for which the determinant is non-zero:

*Format de réponse :* Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \neq. (ex. `Example: k != 3`)

**Réponse attendue (clé CAS) :** `k != 1`

**Solution officielle :** $k \neq 1$

## Clé de réponse — Determinants

| Item | Palier | Clé CAS |
|---|---|---|
| DET-A-1 | facile | `1` |
| DET-A-2 | facile | `1/5` |
| DET-A-3 | moyen | `24` |
| DET-A-4 | moyen | `5` |
| DET-A-5 | difficile | `k != 6` |
| DET-A-6 | difficile | `k != 8` |
| DET-B-1 | facile | `1` |
| DET-B-2 | facile | `4/3` |
| DET-B-3 | moyen | `-3` |
| DET-B-4 | moyen | `-14` |
| DET-B-5 | difficile | `k != 3` |
| DET-B-6 | difficile | `k != 1` |

---

# Sujet : Eigenvalues & Eigenvectors (2×2) (`eigenvalues`)

## Version A (pré-test)

### EIG-A-1 — facile

Find the eigenvalues of $$ A = \begin{pmatrix} 6 & 0 \\ 0 & 9 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[6, 9]`

**Solution officielle :** $\lambda_1 = 6,\ \lambda_2 = 9$

### EIG-A-2 — facile

Find the eigenvalues of $$ A = \begin{pmatrix} 2 & 0 \\ 0 & 5 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[2, 5]`

**Solution officielle :** $\lambda_1 = 2,\ \lambda_2 = 5$

### EIG-A-3 — moyen

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 1 \\ 0 & 6 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[3, 6]`

**Solution officielle :** $\lambda_1 = 3,\ \lambda_2 = 6$

### EIG-A-4 — moyen

Find the eigenvalues of $$ A = \begin{pmatrix} 1 & 4 \\ 0 & 3 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[1, 3]`

**Solution officielle :** $\lambda_1 = 1,\ \lambda_2 = 3$

### EIG-A-5 — difficile

Find the eigenvalues of $$ A = \begin{pmatrix} 5 & 1 \\ 1 & 5 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[4, 6]`

**Solution officielle :** $\lambda_1 = 4,\ \lambda_2 = 6$

### EIG-A-6 — difficile

Find the eigenvalues of $$ A = \begin{pmatrix} 7 & 1 \\ 1 & 7 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[6, 8]`

**Solution officielle :** $\lambda_1 = 6,\ \lambda_2 = 8$

## Version B (post-test)

### EIG-B-1 — facile

Find the eigenvalues of $$ A = \begin{pmatrix} 4 & 0 \\ 0 & 5 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[4, 5]`

**Solution officielle :** $\lambda_1 = 4,\ \lambda_2 = 5$

### EIG-B-2 — facile

Find the eigenvalues of $$ A = \begin{pmatrix} 2 & 0 \\ 0 & 6 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[2, 6]`

**Solution officielle :** $\lambda_1 = 2,\ \lambda_2 = 6$

### EIG-B-3 — moyen

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 2 \\ 0 & 5 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[3, 5]`

**Solution officielle :** $\lambda_1 = 3,\ \lambda_2 = 5$

### EIG-B-4 — moyen

Find the eigenvalues of $$ A = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[1, 3]`

**Solution officielle :** $\lambda_1 = 1,\ \lambda_2 = 3$

### EIG-B-5 — difficile

Find the eigenvalues of $$ A = \begin{pmatrix} 8 & 1 \\ 1 & 8 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[7, 9]`

**Solution officielle :** $\lambda_1 = 7,\ \lambda_2 = 9$

### EIG-B-6 — difficile

Find the eigenvalues of $$ A = \begin{pmatrix} 3 & 1 \\ 1 & 3 \end{pmatrix} $$

*Consigne :* Find all eigenvalues $\lambda$:

*Format de réponse :* Give all eigenvalues as a set. Set notation is accepted, and order does not matter. (ex. `Example: lambda in {2, 5}`)

**Réponse attendue (clé CAS) :** `[2, 4]`

**Solution officielle :** $\lambda_1 = 2,\ \lambda_2 = 4$

## Clé de réponse — Eigenvalues & Eigenvectors (2×2)

| Item | Palier | Clé CAS |
|---|---|---|
| EIG-A-1 | facile | `[6, 9]` |
| EIG-A-2 | facile | `[2, 5]` |
| EIG-A-3 | moyen | `[3, 6]` |
| EIG-A-4 | moyen | `[1, 3]` |
| EIG-A-5 | difficile | `[4, 6]` |
| EIG-A-6 | difficile | `[6, 8]` |
| EIG-B-1 | facile | `[4, 5]` |
| EIG-B-2 | facile | `[2, 6]` |
| EIG-B-3 | moyen | `[3, 5]` |
| EIG-B-4 | moyen | `[1, 3]` |
| EIG-B-5 | difficile | `[7, 9]` |
| EIG-B-6 | difficile | `[2, 4]` |

---

# Sujet : Derivatives (`derivatives`)

## Version A (pré-test)

### DER-A-1 — facile

Find the derivative of the function $$ f(x) = 4x^4 + 4x + 1 $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the power rule to each term. Constants differentiate to 0. (ex. `Example: 16x^3 + 4`)

**Réponse attendue (clé CAS) :** `16*x^3+4`

**Solution officielle :** \(16x^3 + 4\)

### DER-A-2 — facile

Find the derivative of the function $$ f(x) = 4x^5 + 4x + 1 $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the power rule to each term. Constants differentiate to 0. (ex. `Example: 20x^4 + 4`)

**Réponse attendue (clé CAS) :** `20*x^4+4`

**Solution officielle :** \(20x^4 + 4\)

### DER-A-3 — moyen

Find the derivative of the function $$ g(x) = \ln(2x^2 + 5) $$

*Consigne :* Find \(g'(x)\):

*Format de réponse :* Write the derivative as a simplified fraction. Equivalent forms are accepted. (ex. `Example: 4x/(2x^2+5)`)

**Réponse attendue (clé CAS) :** `4*(2*x^2+5)^(-1)*x`

**Solution officielle :** \(\dfrac{4x}{2x^2 + 5}\)

### DER-A-4 — moyen

Find the derivative of the function $$ f(x) = 2 \cos(2x) $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Write the derivative as a mathematical expression. Use \\sin, \\cos notation or plain text. Order and spacing do not matter. (ex. `Example: -6 sin(2x)`)

**Réponse attendue (clé CAS) :** `-4*sin(2*x)`

**Solution officielle :** \(-4 \sin(2x)\)

### DER-A-5 — difficile

Find the derivative of the function $$ f(x) = \frac{4x + 4}{3x + 4} $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the quotient rule. Give the simplified result with the denominator squared. (ex. `Example: 4/(3x+ 4)^2`)

**Réponse attendue (clé CAS) :** `-3*(3*x+4)^(-2)*(4+4*x)+4*(3*x+4)^(-1)`

**Solution officielle :** \(\dfrac{4}{(3x + 4)^2}\)

### DER-A-6 — difficile

Find the derivative of the function $$ f(x) = x^4 \cdot e^{5x} $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the product rule. Factored or expanded forms are both accepted. (ex. `Example: e^(5x)(4x^3 + 5x^4)`)

**Réponse attendue (clé CAS) :** `4*e^(5*x)*x^3+5*e^(5*x)*x^4`

**Solution officielle :** \(e^{5x}(4x^{3} + 5x^4)\)

## Version B (post-test)

### DER-B-1 — facile

Find the derivative of the function $$ f(x) = 5x^4 + 5x + 2 $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the power rule to each term. Constants differentiate to 0. (ex. `Example: 20x^3 + 5`)

**Réponse attendue (clé CAS) :** `20*x^3+5`

**Solution officielle :** \(20x^3 + 5\)

### DER-B-2 — facile

Find the derivative of the function $$ f(x) = 4x^3 + 3x + 1 $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the power rule to each term. Constants differentiate to 0. (ex. `Example: 12x^2 + 3`)

**Réponse attendue (clé CAS) :** `12*x^2+3`

**Solution officielle :** \(12x^2 + 3\)

### DER-B-3 — moyen

Find the derivative of the function $$ f(x) = 3 \cos(2x) $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Write the derivative as a mathematical expression. Use \\sin, \\cos notation or plain text. Order and spacing do not matter. (ex. `Example: -6 sin(2x)`)

**Réponse attendue (clé CAS) :** `-6*sin(2*x)`

**Solution officielle :** \(-6 \sin(2x)\)

### DER-B-4 — moyen

Find the derivative of the function $$ g(x) = \ln(2x^2 + 2) $$

*Consigne :* Find \(g'(x)\):

*Format de réponse :* Write the derivative as a simplified fraction. Equivalent forms are accepted. (ex. `Example: 4x/(2x^2+2)`)

**Réponse attendue (clé CAS) :** `4*(2+2*x^2)^(-1)*x`

**Solution officielle :** \(\dfrac{4x}{2x^2 + 2}\)

### DER-B-5 — difficile

Find the derivative of the function $$ f(x) = \frac{3x + 2}{5x + 5} $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the quotient rule. Give the simplified result with the denominator squared. (ex. `Example: 5/(5x+ 5)^2`)

**Réponse attendue (clé CAS) :** `-5*(2+3*x)*(5+5*x)^(-2)+3*(5+5*x)^(-1)`

**Solution officielle :** \(\dfrac{5}{(5x + 5)^2}\)

### DER-B-6 — difficile

Find the derivative of the function $$ f(x) = x^3 \cdot e^{2x} $$

*Consigne :* Find \(f'(x)\):

*Format de réponse :* Apply the product rule. Factored or expanded forms are both accepted. (ex. `Example: e^(2x)(3x^2 + 2x^3)`)

**Réponse attendue (clé CAS) :** `2*e^(2*x)*x^3+3*e^(2*x)*x^2`

**Solution officielle :** \(e^{2x}(3x^{2} + 2x^3)\)

## Clé de réponse — Derivatives

| Item | Palier | Clé CAS |
|---|---|---|
| DER-A-1 | facile | `16*x^3+4` |
| DER-A-2 | facile | `20*x^4+4` |
| DER-A-3 | moyen | `4*(2*x^2+5)^(-1)*x` |
| DER-A-4 | moyen | `-4*sin(2*x)` |
| DER-A-5 | difficile | `-3*(3*x+4)^(-2)*(4+4*x)+4*(3*x+4)^(-1)` |
| DER-A-6 | difficile | `4*e^(5*x)*x^3+5*e^(5*x)*x^4` |
| DER-B-1 | facile | `20*x^3+5` |
| DER-B-2 | facile | `12*x^2+3` |
| DER-B-3 | moyen | `-6*sin(2*x)` |
| DER-B-4 | moyen | `4*(2+2*x^2)^(-1)*x` |
| DER-B-5 | difficile | `-5*(2+3*x)*(5+5*x)^(-2)+3*(5+5*x)^(-1)` |
| DER-B-6 | difficile | `2*e^(2*x)*x^3+3*e^(2*x)*x^2` |

---

## Feuille de calcul des indices (à remplir après le pilote)

| Item | n réponses | n correctes | p | D | Verdict (garder / remplacer) |
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
