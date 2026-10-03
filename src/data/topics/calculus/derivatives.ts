export const derivativesLogic = {
  guide: {
    title: "Derivative Rules",
    content: `
- **Power Rule**: \\(\\frac{d}{dx}[x^n] = nx^{n-1}\\)
- **Chain Rule**: \\(\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)\\)
- **Product Rule**: \\(\\frac{d}{dx}[uv] = u'v + uv'\\)
- **Quotient Rule**: \\(\\frac{d}{dx}\\!\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}\\)
- **Key derivatives**: \\(\\frac{d}{dx}[\\sin u] = \\cos u \\cdot u'\\), \\(\\frac{d}{dx}[\\cos u] = -\\sin u \\cdot u'\\), \\(\\frac{d}{dx}[\\ln u] = \\frac{u'}{u}\\), \\(\\frac{d}{dx}[e^u] = e^u \\cdot u'\\)
    `,
  },
  generate: () => {
    const a = Math.floor(Math.random() * 5) + 2;  // 2–6
    const b = Math.floor(Math.random() * 4) + 2;  // 2–5
    const n = Math.floor(Math.random() * 3) + 3;  // 3–5  (polynomial exponent)
    const k = Math.floor(Math.random() * 4) + 2;  // 2–5  (linear coefficient)
    const m = Math.floor(Math.random() * 5) + 1;  // 1–5  (constant term)
    const type = Math.floor(Math.random() * 5);

    // ── Type 0: Trig (Chain Rule) — existing ──────────────────────────────
    if (type === 0) {
      const ab = a * b;
      return {
        title: "Derivatives — Chain Rule (Trig)",
        statement: `Find the derivative of the function $$ f(x) = ${a} \\cos(${b}x) $$`,
        prompt: "Find \\(f'(x)\\):",
        solution: `\\(-${ab} \\sin(${b}x)\\)`,
        answerFormat: {
          placeholder: "Example: -6 sin(2x)",
          instruction:
            "Write the derivative as a mathematical expression. Use \\\\sin, \\\\cos notation or plain text. Order and spacing do not matter.",
          alternatives: [
            `-${ab}\\sin(${b}x)`,
            `-${ab} \\sin(${b}x)`,
            `f'(x) = -${ab}\\sin(${b}x)`,
            `-${ab}sin(${b}x)`,
          ],
          fields: [
            {
              key: "derivative",
              label: "f'(x)",
              placeholder: `-${ab}\\sin(${b}x)`,
            },
          ],
        },
        explanation: `Apply the **Chain Rule**: \\(\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)\\).

Let \\(u = ${b}x\\), so \\(f(x) = ${a}\\cos(u)\\).

- Outer derivative: \\(\\frac{d}{du}[${a}\\cos(u)] = -${a}\\sin(u)\\)
- Inner derivative: \\(u' = \\frac{d}{dx}[${b}x] = ${b}\\)

Combine:
$$ f'(x) = -${a}\\sin(${b}x) \\cdot ${b} = -${ab}\\sin(${b}x) $$`,
        hint: `Apply the Chain Rule. The outer function is \\(${a}\\cos(u)\\) and the inner function is \\(u = ${b}x\\).`,
        reasoningSteps: `Step 1 — Identify the composition: f(x) = a·cos(u) where u = bx is the inner function.
Step 2 — Differentiate the outer function: d/du[a·cos(u)] = −a·sin(u).
Step 3 — Differentiate the inner function: u' = b.
Step 4 — Apply the Chain Rule: f'(x) = (outer derivative at u) · u' = −a·sin(bx) · b.
Step 5 — Simplify: f'(x) = −ab·sin(bx).`,
      };
    }

    // ── Type 1: Log (Chain Rule) — existing ───────────────────────────────
    if (type === 1) {
      const twoA = 2 * a;
      return {
        title: "Derivatives — Chain Rule (Logarithm)",
        statement: `Find the derivative of the function $$ g(x) = \\ln(${a}x^2 + ${b}) $$`,
        prompt: "Find \\(g'(x)\\):",
        solution: `\\(\\dfrac{${twoA}x}{${a}x^2 + ${b}}\\)`,
        answerFormat: {
          placeholder: `Example: ${twoA}x/(${a}x^2+${b})`,
          instruction:
            "Write the derivative as a simplified fraction. Equivalent forms are accepted.",
          alternatives: [
            `\\frac{${twoA}x}{${a}x^2 + ${b}}`,
            `${twoA}x/(${a}x^2 + ${b})`,
            `g'(x) = \\frac{${twoA}x}{${a}x^2 + ${b}}`,
          ],
          fields: [
            {
              key: "derivative",
              label: "g'(x)",
              placeholder: `\\frac{${twoA}x}{${a}x^2 + ${b}}`,
            },
          ],
        },
        explanation: `Apply the **Chain Rule** for \\(\\ln(u)\\): \\(\\frac{d}{dx}[\\ln(u)] = \\frac{u'}{u}\\).

Let \\(u = ${a}x^2 + ${b}\\).

- Inner derivative: \\(u' = \\frac{d}{dx}[${a}x^2 + ${b}] = ${twoA}x\\)
- Outer derivative: \\(\\frac{d}{du}[\\ln(u)] = \\frac{1}{u}\\)

Combine:
$$ g'(x) = \\frac{${twoA}x}{${a}x^2 + ${b}} $$`,
        hint: `Use \\([\\ln(u)]' = u'/u\\). Identify \\(u = ${a}x^2 + ${b}\\) and compute its derivative first.`,
        reasoningSteps: `Step 1 — Identify the composition: g(x) = ln(u) where u = ax² + b is the inner function.
Step 2 — Differentiate the outer function: d/du[ln(u)] = 1/u.
Step 3 — Differentiate the inner function: u' = 2ax.
Step 4 — Apply the Chain Rule: g'(x) = (1/u) · u' = (2ax)/(ax² + b).
Step 5 — State the simplified result.`,
      };
    }

    // ── Type 2: Power Rule (Polynomial) ───────────────────────────────────
    if (type === 2) {
      const na = n * a;
      const bSign = k > 0 ? "+" : "-";
      const cSign = m > 0 ? "+" : "-";
      return {
        title: "Derivatives — Power Rule",
        statement: `Find the derivative of the function $$ f(x) = ${a}x^${n} ${bSign} ${k}x ${cSign} ${m} $$`,
        prompt: "Find \\(f'(x)\\):",
        solution: `\\(${na}x^${n - 1} + ${k}\\)`,
        answerFormat: {
          placeholder: `Example: ${na}x^${n - 1} + ${k}`,
          instruction:
            "Apply the power rule to each term. Constants differentiate to 0.",
          alternatives: [
            `${na}x^${n - 1} + ${k}`,
            `f'(x) = ${na}x^${n - 1} + ${k}`,
            `\\(${na}x^{${n - 1}} + ${k}\\)`,
          ],
          fields: [
            {
              key: "derivative",
              label: "f'(x)",
              placeholder: `${na}x^${n - 1} + ${k}`,
            },
          ],
        },
        explanation: `Apply the **Power Rule** \\(\\frac{d}{dx}[x^n] = nx^{n-1}\\) term by term:

- \\(\\frac{d}{dx}[${a}x^${n}] = ${n} \\cdot ${a} \\cdot x^{${n}-1} = ${na}x^{${n - 1}}\\)
- \\(\\frac{d}{dx}[${k}x] = ${k}\\)
- \\(\\frac{d}{dx}[${m}] = 0\\) (constant rule)

Therefore:
$$ f'(x) = ${na}x^{${n - 1}} + ${k} $$`,
        hint: `Apply \\(\\frac{d}{dx}[cx^n] = cnx^{n-1}\\) to each term. The constant \\(${m}\\) disappears.`,
        reasoningSteps: `Step 1 — Apply the Power Rule term by term: d/dx[axⁿ] = naxⁿ⁻¹.
Step 2 — Differentiate the linear term: d/dx[kx] = k.
Step 3 — Differentiate the constant: d/dx[m] = 0 (constant rule).
Step 4 — Combine: f'(x) = naxⁿ⁻¹ + k.`,
      };
    }

    // ── Type 3: Product Rule  f(x) = x^n · e^(bx) ────────────────────────
    if (type === 3) {
      const nm1 = n - 1;
      // Simplified form: x^(n-1) * e^(bx) * (n + bx)
      return {
        title: "Derivatives — Product Rule",
        statement: `Find the derivative of the function $$ f(x) = x^${n} \\cdot e^{${b}x} $$`,
        prompt: "Find \\(f'(x)\\):",
        solution: `\\(e^{${b}x}(${n}x^{${nm1}} + ${b}x^${n})\\)`,
        answerFormat: {
          placeholder: `Example: e^(${b}x)(${n}x^${nm1} + ${b}x^${n})`,
          instruction:
            "Apply the product rule. Factored or expanded forms are both accepted.",
          alternatives: [
            `e^{${b}x}(${n}x^{${nm1}} + ${b}x^{${n}})`,
            `${n}x^{${nm1}}e^{${b}x} + ${b}x^{${n}}e^{${b}x}`,
            `x^{${nm1}}e^{${b}x}(${n} + ${b}x)`,
          ],
          fields: [
            {
              key: "derivative",
              label: "f'(x)",
              placeholder: `e^{${b}x}(${n}x^{${nm1}} + ${b}x^{${n}})`,
            },
          ],
        },
        explanation: `Apply the **Product Rule**: \\(\\frac{d}{dx}[uv] = u'v + uv'\\).

Let \\(u = x^${n}\\) and \\(v = e^{${b}x}\\).

- \\(u' = ${n}x^{${nm1}}\\) (power rule)
- \\(v' = ${b}e^{${b}x}\\) (chain rule: \\(\\frac{d}{dx}[e^{${b}x}] = ${b}e^{${b}x}\\))

Combine:
$$ f'(x) = ${n}x^{${nm1}} \\cdot e^{${b}x} + x^{${n}} \\cdot ${b}e^{${b}x} $$

Factor out \\(x^{${nm1}} e^{${b}x}\\):
$$ f'(x) = x^{${nm1}} e^{${b}x}(${n} + ${b}x) $$`,
        hint: `Set \\(u = x^{${n}}\\) and \\(v = e^{${b}x}\\). Then \\(u' = ${n}x^{${nm1}}\\) and \\(v' = ${b}e^{${b}x}\\) by the chain rule.`,
        reasoningSteps: `Step 1 — Identify the two factors: u = xⁿ and v = e^(bx).
Step 2 — Differentiate u using the Power Rule: u' = nxⁿ⁻¹.
Step 3 — Differentiate v using the Chain Rule: v' = be^(bx).
Step 4 — Apply the Product Rule: f'(x) = u'v + uv' = nxⁿ⁻¹·e^(bx) + xⁿ·be^(bx).
Step 5 — Factor the result: f'(x) = xⁿ⁻¹·e^(bx)·(n + bx).`,
      };
    }

    // ── Type 4: Quotient Rule  f(x) = (ax+b)/(kx+m) ─────────────────────
    // a, k are positive; answer numerator = a*m - b*k (but b is our `b` coeff here)
    // Use distinct names to avoid shadowing: coeffA, coeffB, coeffC, coeffD
    const coeffA = a;
    const coeffB = b;
    const coeffC = k;
    // ad - bc = 0 would make f a constant function: the "quotient rule" exercise
    // would collapse to f'(x) = 0/(cx+d)^2, which is not the skill being tested
    // and which the CAS grades against the ground truth 0. Nudging d keeps the
    // determinant non-zero (a(d+1) - bc = a > 0) without an extra random draw.
    const coeffD = coeffA * m - coeffB * coeffC === 0 ? m + 1 : m;
    const numeratorDet = coeffA * coeffD - coeffB * coeffC;
    const bSign4 = coeffB > 0 ? `+ ${coeffB}` : `- ${Math.abs(coeffB)}`;
    const dSign4 = coeffD > 0 ? `+ ${coeffD}` : `- ${Math.abs(coeffD)}`;

    return {
      title: "Derivatives — Quotient Rule",
      statement: `Find the derivative of the function $$ f(x) = \\frac{${coeffA}x ${bSign4}}{${coeffC}x ${dSign4}} $$`,
      prompt: "Find \\(f'(x)\\):",
      solution: `\\(\\dfrac{${numeratorDet}}{(${coeffC}x ${dSign4})^2}\\)`,
      answerFormat: {
        placeholder: `Example: ${numeratorDet}/(${coeffC}x${dSign4})^2`,
        instruction:
          "Apply the quotient rule. Give the simplified result with the denominator squared.",
        alternatives: [
          `\\frac{${numeratorDet}}{(${coeffC}x ${dSign4})^2}`,
          `${numeratorDet}/(${coeffC}x${dSign4})^2`,
          `f'(x) = \\frac{${numeratorDet}}{(${coeffC}x ${dSign4})^2}`,
        ],
        fields: [
          {
            key: "derivative",
            label: "f'(x)",
            placeholder: `\\frac{${numeratorDet}}{(${coeffC}x ${dSign4})^2}`,
          },
        ],
      },
      explanation: `Apply the **Quotient Rule**: \\(\\frac{d}{dx}\\!\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}\\).

Let \\(u = ${coeffA}x ${bSign4}\\) and \\(v = ${coeffC}x ${dSign4}\\).

- \\(u' = ${coeffA}\\) (constant coefficient)
- \\(v' = ${coeffC}\\)

Numerator: \\(u'v - uv' = ${coeffA}(${coeffC}x ${dSign4}) - (${coeffA}x ${bSign4}) \\cdot ${coeffC}\\)
$$ = ${coeffA * coeffC}x + ${coeffA * coeffD} - ${coeffA * coeffC}x - ${coeffB * coeffC} = ${numeratorDet} $$

Therefore:
$$ f'(x) = \\frac{${numeratorDet}}{(${coeffC}x ${dSign4})^2} $$`,
      hint: `Use \\(\\frac{d}{dx}\\!\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}\\). Here \\(u' = ${coeffA}\\) and \\(v' = ${coeffC}\\).`,
      reasoningSteps: `Step 1 — Identify the numerator u = ax + b and denominator v = cx + d.
Step 2 — Differentiate u: u' = a (constant coefficient of x).
Step 3 — Differentiate v: v' = c.
Step 4 — Apply the Quotient Rule: f'(x) = (u'v − uv') / v².
Step 5 — Expand the numerator u'v − uv': a(cx + d) − (ax + b)c = ad − bc (the x terms cancel).
Step 6 — Write the simplified result: f'(x) = (ad − bc) / (cx + d)².`,
    };
  },
};
