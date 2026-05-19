import { describe, expect, test } from "bun:test";
import { quadraticLogic } from "./quadratic";

function parseCoefficients(statement: string) {
  const compact = statement
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\s+/g, "");

  const match = compact.match(/x\^2(?:([+-])(\d*)x)?([+-]\d+)=0/);
  if (!match) throw new Error(`Could not parse quadratic statement: ${statement}`);

  const bSign = match[1];
  const bCoeff = match[2];
  const b = bSign ? (bSign === "-" ? -1 : 1) * (bCoeff ? Number(bCoeff) : 1) : 0;
  const c = Number(match[3]);

  return { b, c };
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
});
