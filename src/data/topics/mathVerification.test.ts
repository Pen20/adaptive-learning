import { describe, expect, test } from "bun:test";
import { topicRegistry } from "./index";
import type { GeneratedProblem } from "./index";

// The deterministic grader (convex/cas.ts) re-derives the answer for limits,
// derivatives, quadratics, determinants, eigenvalues and polynomial inner
// products, so those topics already have an independent check in
// topicAudit.test.ts. The topics below have no CAS path: their official answer
// is whatever the generator printed. Here the answer is re-derived from the
// *statement text the student sees* and compared with the printed solution, so a
// formula bug in a generator cannot pass unnoticed.

const SAMPLES = 150;

function sample(topicId: string): GeneratedProblem[] {
  const engine = topicRegistry[topicId];
  if (!engine) throw new Error(`unknown topic ${topicId}`);
  return Array.from({ length: SAMPLES }, () => engine.generate());
}

/** All numbers inside a LaTeX matrix/cases environment, in row-major order. */
function matrixEntries(text: string, env: string): number[] | null {
  const body = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`).exec(text);
  if (!body) return null;
  const numbers = body[1].match(/-?\d+/g);
  return numbers ? numbers.map(Number) : null;
}

/** Parses "3x + 5", "x - 2", "-x", "4x" into [slope, intercept]. */
function parseLinear(expression: string): [number, number] | null {
  const match = /^\s*(-?\d*)x\s*(?:([+-])\s*(\d+))?\s*$/.exec(expression.trim());
  if (!match) return null;
  const slope = match[1] === "" ? 1 : match[1] === "-" ? -1 : Number(match[1]);
  const intercept = match[2] ? (match[2] === "-" ? -1 : 1) * Number(match[3]) : 0;
  return [slope, intercept];
}

/** "17/6" or "5" or "-3" → exact rational value. */
function parseRational(text: string): number | null {
  const clean = text.replace(/\$/g, "").trim();
  const fraction = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(clean);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return /^-?\d+$/.test(clean) ? Number(clean) : null;
}

// ── linear_equations: ax + b = c ────────────────────────────────────────────
describe("linear_equations", () => {
  test("the printed solution actually solves the printed equation", () => {
    for (const problem of sample("linear_equations")) {
      const equation = /\$\$\s*(\d+)x \+ (\d+) = (\d+)\s*\$\$/.exec(problem.statement);
      expect(`parsed: ${!!equation} — ${problem.statement}`).toBe(
        `parsed: true — ${problem.statement}`,
      );
      const [, a, b, c] = equation!.map(Number);
      const x = parseRational(problem.solution);
      expect(`${a}·${x} + ${b}`).toBe(`${a}·${(c - b) / a} + ${b}`);
      expect(a * x! + b).toBe(c);
    }
  });
});

// ── linear_systems: find k making the system inconsistent ───────────────────
describe("linear_systems", () => {
  test("the printed k makes the two lines parallel but distinct (no solution)", () => {
    for (const problem of sample("linear_systems")) {
      const first = /(-?\d*)x \+ (-?\d*)y = (-?\d+)/.exec(problem.statement);
      const second = /(-?\d*)x \+ ky = (-?\d+)/.exec(problem.statement);
      expect(`parsed: ${!!first && !!second}`).toBe("parsed: true");
      const num = (raw: string) => (raw === "" ? 1 : raw === "-" ? -1 : Number(raw));
      const [a1, b1, c1] = [num(first![1]), num(first![2]), Number(first![3])];
      const [a2, c2] = [num(second![1]), Number(second![2])];
      const k = parseRational(problem.solution);
      expect(`k parsed: ${k !== null}`).toBe("k parsed: true");

      // Parallel: the coefficient rows are proportional …
      expect(`a1·k - b1·a2 = ${a1 * k! - b1 * a2}`).toBe("a1·k - b1·a2 = 0");
      // … and distinct: the constants are NOT in the same ratio, otherwise the
      // system would have infinitely many solutions instead of none.
      expect(a1 * c2 === c1 * a2).toBe(false);
    }
  });
});

// ── linear_independence: w must complete an independent set ─────────────────
describe("linear_independence", () => {
  test("the proposed w gives a non-singular matrix [u | v | w]", () => {
    for (const problem of sample("linear_independence")) {
      const vectors = problem.statement.match(
        /\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g,
      );
      const w = /\\mathbf\{w\} = \\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/.exec(
        problem.explanation,
      );
      expect(`u,v parsed: ${vectors?.length === 2}, w parsed: ${!!w}`).toBe(
        "u,v parsed: true, w parsed: true",
      );
      const parse = (block: string) => (block.match(/-?\d+/g) ?? []).map(Number);
      const [u, v] = vectors!.map(parse);
      const wVec = parse(w![1]);
      expect(`${u.length},${v.length},${wVec.length}`).toBe("3,3,3");

      const det =
        u[0] * (v[1] * wVec[2] - v[2] * wVec[1]) -
        u[1] * (v[0] * wVec[2] - v[2] * wVec[0]) +
        u[2] * (v[0] * wVec[1] - v[1] * wVec[0]);
      expect(`det[u|v|w] = ${det} (statement: ${problem.statement.slice(0, 80)})`).not.toBe(
        `det[u|v|w] = 0 (statement: ${problem.statement.slice(0, 80)})`,
      );
      expect(det === 0).toBe(false);
    }
  });
});

// ── integral_inner_product: <f,g> = ∫₀¹ f·g ────────────────────────────────
describe("integral_inner_product", () => {
  test("the printed value equals the integral of the printed functions", () => {
    for (const problem of sample("integral_inner_product")) {
      const f = /f\(x\) = ([^$]+)\$/.exec(problem.statement);
      const g = /g\(x\) = ([^$]+)\$/.exec(problem.statement);
      expect(`f,g parsed: ${!!f && !!g}`).toBe("f,g parsed: true");
      const fLinear = parseLinear(f![1]);
      const gLinear = parseLinear(g![1]);
      expect(`linear: ${!!fLinear && !!gLinear} — "${f![1]}" "${g![1]}"`).toBe(
        `linear: true — "${f![1]}" "${g![1]}"`,
      );
      const [a, b] = fLinear!;
      const [c, d] = gLinear!;
      // ∫₀¹ (ax+b)(cx+d) dx = ac/3 + (ad+bc)/2 + bd
      const expected = (a * c) / 3 + (a * d + b * c) / 2 + b * d;
      const printed = parseRational(problem.solution);
      expect(`value parsed: ${printed !== null} — ${problem.solution}`).toBe(
        `value parsed: true — ${problem.solution}`,
      );
      expect(Math.abs(printed! - expected) < 1e-9).toBe(true);
    }
  });
});

// ── piecewise_continuity: verdict must match the two pieces ────────────────
describe("piecewise_continuity", () => {
  test("the continuity verdict matches the left limit and the right value", () => {
    for (const problem of sample("piecewise_continuity")) {
      const cases = /\\begin\{cases\}\s*(.+?), & x < (-?\d+) \\\\ (.+?), & x \\ge/.exec(
        problem.statement,
      );
      expect(`parsed: ${!!cases} — ${problem.statement}`).toBe(
        `parsed: true — ${problem.statement}`,
      );
      const left = parseLinear(cases![1]);
      const right = parseLinear(cases![3]);
      const boundary = Number(cases![2]);
      expect(`pieces: ${!!left && !!right} — "${cases![1]}" / "${cases![3]}"`).toBe(
        `pieces: true — "${cases![1]}" / "${cases![3]}"`,
      );
      const leftValue = left![0] * boundary + left![1];
      const rightValue = right![0] * boundary + right![1];
      const expected = leftValue === rightValue ? "continuous" : "discontinuous";
      expect(`${problem.solution} (${leftValue} vs ${rightValue})`).toBe(
        `${expected} (${leftValue} vs ${rightValue})`,
      );
    }
  });
});

// ── eigenspaces_2x2: eigenvalues and eigenspace bases ──────────────────────
describe("eigenspaces_2x2", () => {
  test("the printed eigenvalues are the roots of the printed matrix", () => {
    for (const problem of sample("eigenspaces_2x2")) {
      const entries = matrixEntries(problem.statement, "bmatrix");
      expect(`matrix parsed: ${entries?.length === 4}`).toBe("matrix parsed: true");
      const [a, b, c, d] = entries!;
      const eigenvalues = (
        /Eigenvalues?: \$\\lambda = ([^$]+)\$/.exec(problem.solution)?.[1] ?? ""
      )
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));
      expect(`eigenvalues parsed: ${eigenvalues.length > 0} — ${problem.solution}`).toBe(
        `eigenvalues parsed: true — ${problem.solution}`,
      );
      for (const lambda of eigenvalues) {
        // λ is an eigenvalue iff det(A - λI) = 0
        const characteristic = (a - lambda) * (d - lambda) - b * c;
        expect(`det(A - ${lambda}I) = ${characteristic}`).toBe(`det(A - ${lambda}I) = 0`);
      }
      // trace and determinant must be accounted for by the listed spectrum
      const multiplicity = eigenvalues.length === 1 ? 2 : 1;
      const sum = eigenvalues.reduce((total, value) => total + value * multiplicity, 0);
      const product = eigenvalues.reduce((total, value) => total * value ** multiplicity, 1);
      expect(`trace ${sum}, det ${product}`).toBe(`trace ${a + d}, det ${a * d - b * c}`);
    }
  });

  test("every printed basis vector is a non-zero eigenvector", () => {
    for (const problem of sample("eigenspaces_2x2")) {
      const [a, b, c, d] = matrixEntries(problem.statement, "bmatrix")!;
      const sections = problem.solution.split(/\\lambda = /).slice(1);
      let checked = 0;
      for (const section of sections) {
        const lambda = Number(/^(-?\d+)/.exec(section)?.[1]);
        if (!Number.isFinite(lambda)) continue;
        const blocks = section.match(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g) ?? [];
        for (const block of blocks) {
          const [x, y] = (block.match(/-?\d+/g) ?? []).map(Number);
          expect(`eigenvector (${x}, ${y}) is non-zero`).toBe(
            `eigenvector (${x === 0 && y === 0 ? "zero" : x}, ${x === 0 && y === 0 ? "zero" : y}) is non-zero`,
          );
          // (A - λI)v = 0
          expect(
            `(A-${lambda}I)v = (${(a - lambda) * x + b * y}, ${c * x + (d - lambda) * y})`,
          ).toBe(`(A-${lambda}I)v = (0, 0)`);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(0);
    }
  });
});

// ── gram_schmidt: eigenvalues of the block matrix ──────────────────────────
describe("gram_schmidt", () => {
  test("the printed eigenvalues are the spectrum of the printed matrix", () => {
    for (const problem of sample("gram_schmidt")) {
      const entries = matrixEntries(problem.statement, "pmatrix");
      expect(`matrix parsed: ${entries?.length === 9}`).toBe("matrix parsed: true");
      const [a, b, , , , , , , c] = entries!;
      const printed = (/Eigenvalues: \$\\lambda = ([^$]+)\$/.exec(problem.solution)?.[1] ?? "")
        .split(",")
        .map((value) => Number(value.trim()));
      const expected = [a + b, a - b, c].sort((x, y) => x - y);
      expect(printed.join(",")).toBe(expected.join(","));
      // The worked solution argues from *distinct* eigenvalues (symmetric matrix
      // ⇒ eigenvectors of distinct eigenvalues are orthogonal), so the generator
      // must not produce a repeated one.
      expect(new Set(expected).size).toBe(3);
    }
  });

  test("the printed orthonormal basis really is orthonormal eigenvectors", () => {
    for (const problem of sample("gram_schmidt")) {
      const [a, b, , , , , , , c] = matrixEntries(problem.statement, "pmatrix")!;
      // The stated basis is {(1,1,0)/√2, (1,-1,0)/√2, (0,0,1)}.
      const basis: [number[], number][] = [
        [[1, 1, 0], a + b],
        [[1, -1, 0], a - b],
        [[0, 0, 1], c],
      ];
      const A = [
        [a, b, 0],
        [b, a, 0],
        [0, 0, c],
      ];
      for (const [vector, lambda] of basis) {
        const image = A.map((row) => row.reduce((sum, value, i) => sum + value * vector[i], 0));
        expect(image.join(",")).toBe(vector.map((value) => value * lambda).join(","));
      }
      const dot = (p: number[], q: number[]) => p.reduce((sum, value, i) => sum + value * q[i], 0);
      expect(dot(basis[0][0], basis[1][0])).toBe(0);
      expect(dot(basis[0][0], basis[2][0])).toBe(0);
      expect(dot(basis[1][0], basis[2][0])).toBe(0);
    }
  });
});

// ── inner_product_def: axiom manipulation ──────────────────────────────────
describe("inner_product_def", () => {
  test("the printed answer follows from the axioms", () => {
    for (const problem of sample("inner_product_def")) {
      const given = /\\langle u, v \\rangle = (-?\d+)\$/.exec(problem.statement);
      if (given) {
        // <2v, 3u> = 6<u, v>
        expect(parseRational(problem.solution)).toBe(6 * Number(given[1]));
        continue;
      }
      const expansion = /\\langle (\d+)u - (\d+)v, w \\rangle/.exec(problem.statement);
      expect(`recognised: ${!!expansion} — ${problem.statement}`).toBe(
        `recognised: true — ${problem.statement}`,
      );
      const [, k1, k2] = expansion!;
      expect(problem.solution).toBe(
        `$${k1}\\langle u, w \\rangle - ${k2}\\langle v, w \\rangle$`,
      );
    }
  });
});

// ── domain_range: domain and range of each function family ─────────────────
describe("domain_range", () => {
  test("the printed domain and range match the printed function", () => {
    for (const problem of sample("domain_range")) {
      const title = problem.title ?? "";
      if (title.includes("Absolute Value")) {
        // f(x) = a + |x² - b| → domain ℝ, range [a, ∞)
        const a = Number(/f\(x\) = (\d+) \+ \|/.exec(problem.statement)?.[1]);
        expect(Number.isFinite(a)).toBe(true);
        expect(problem.solution).toBe(
          `Domain: \\((-\\infty, \\infty)\\),  Range: \\([${a}, \\infty)\\)`,
        );
      } else if (title.includes("Square Root")) {
        // f(x) = √(ax - b) → domain [b/a, ∞), range [0, ∞)
        const radicand = /\\sqrt\{(.+?)\}/.exec(problem.statement)?.[1] ?? "";
        const linear = parseLinear(radicand);
        expect(`radicand parsed: ${!!linear} — "${radicand}"`).toBe(
          `radicand parsed: true — "${radicand}"`,
        );
        const [a, b] = linear!;
        expect(problem.solution).toBe(
          `Domain: \\([${-b / a}, \\infty)\\),  Range: \\([0, \\infty)\\)`,
        );
      } else {
        // f(x) = c/(x - a) → domain ℝ∖{a}, range ℝ∖{0}
        const a = Number(/\\frac\{\d+\}\{x - (-?\d+)\}/.exec(problem.statement)?.[1]);
        expect(Number.isFinite(a)).toBe(true);
        expect(problem.solution).toBe(
          `Domain: \\(\\mathbb{R} \\setminus \\{${a}\\}\\),  Range: \\(\\mathbb{R} \\setminus \\{0\\}\\)`,
        );
      }
    }
  });
});
