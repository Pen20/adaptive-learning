import { describe, expect, test } from "bun:test";
import { quadraticLogic } from "./quadratic";

function parseCoefficients(statement: string) {
  const compact = statement
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\s+/g, "");

  const match = compact.match(/x\^2(?:([+-])(\d*)x)?(?:([+-]\d+))?=0/);
  if (!match) throw new Error(`Could not parse quadratic statement: ${statement}`);

  const bSign = match[1];
  const bCoeff = match[2];
  const b = bSign ? (bSign === "-" ? -1 : 1) * (bCoeff ? Number(bCoeff) : 1) : 0;
  const c = match[3] ? Number(match[3]) : 0;

  return { b, c };
}

function withRandomValues<T>(values: number[], callback: () => T) {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => values[index++] ?? 0;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function parseRoots(solution: string) {
  const withoutLabels = solution.replace(/x_\d+\s*=/g, "");
  return (withoutLabels.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

describe("quadraticLogic", () => {
  test("generated solutions satisfy the generated equation", () => {
    for (let index = 0; index < 50; index++) {
      const problem = quadraticLogic.generate();
      const { b, c } = parseCoefficients(problem.statement);
      const roots = parseRoots(problem.solution);

      expect(roots.length).toBeGreaterThan(0);
      for (const root of roots) {
        expect(root * root + b * root + c).toBe(0);
      }
    }
  });

  test("omits zero x and constant terms from generated equations", () => {
    const zeroQuadratic = withRandomValues([0.5, 0.5], () =>
      quadraticLogic.generate(),
    );
    expect(zeroQuadratic.statement).toContain("$$x^2 = 0$$");
    expect(zeroQuadratic.statement.includes("+ 0")).toBe(false);

    const zeroConstant = withRandomValues([0.5, 0.7], () =>
      quadraticLogic.generate(),
    );
    expect(zeroConstant.statement).toContain("$$x^2 - 2x = 0$$");
    expect(zeroConstant.statement.includes("+ 0")).toBe(false);

    const zeroXTerm = withRandomValues([0.7, 0.3], () =>
      quadraticLogic.generate(),
    );
    expect(zeroXTerm.statement).toContain("$$x^2 - 4 = 0$$");
    expect(zeroXTerm.statement.includes("0x")).toBe(false);
  });
});
