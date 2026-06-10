import { describe, expect, test } from "bun:test";
import { piecewiseLogic } from "./piecewise";

function parseLeftLimit(statement: string, x1: number): number | null {
  // Extract m and b from "\begin{cases} mx + b, & x < x1"
  const m = statement.match(/\\begin\{cases\}\s*(-?\d+)x\s*\+\s*(-?\d+)\s*,/);
  if (!m) return null;
  return Number(m[1]) * x1 + Number(m[2]);
}

function parseRightValue(statement: string, x1: number): number | null {
  // Extract q from "\\ x + q, & x \ge x1"
  const m = statement.match(/\\\\\s*x\s*\+\s*(-?\d+)\s*,/);
  if (!m) return null;
  return x1 + Number(m[1]);
}

describe("piecewiseLogic generator", () => {
  test("every generated problem has required fields", () => {
    for (let i = 0; i < 50; i++) {
      const p = piecewiseLogic.generate();
      expect(typeof p.title).toBe("string");
      expect(typeof p.statement).toBe("string");
      expect(typeof p.prompt).toBe("string");
      expect(typeof p.solution).toBe("string");
      expect(typeof p.explanation).toBe("string");
      expect(typeof p.hint).toBe("string");
      expect(p.answerFormat).toBeDefined();
      expect(p.answerFormat.fields?.length).toBeGreaterThan(0);
    }
  });

  test("solution is always 'continuous' or 'discontinuous'", () => {
    for (let i = 0; i < 80; i++) {
      const p = piecewiseLogic.generate();
      expect(["continuous", "discontinuous"]).toContain(p.solution);
    }
  });

  test("solution matches actual left-limit vs right-value comparison", () => {
    for (let i = 0; i < 80; i++) {
      const p = piecewiseLogic.generate();
      const leftLimit = parseLeftLimit(p.statement, p.x1);
      const rightValue = parseRightValue(p.statement, p.x1);

      if (leftLimit === null || rightValue === null) continue;

      const actualVerdict =
        Math.abs(leftLimit - rightValue) < 1e-9
          ? "continuous"
          : "discontinuous";

      expect(p.solution).toBe(actualVerdict);
    }
  });

  test("forces continuous case: left limit equals right value", () => {
    const original = Math.random;
    // isContinuous = Math.random() > 0.5  → set to 0.9 (>0.5 → true)
    // calls: x1, m, b, isContinuous, jump(skipped), (no more)
    const values = [0.5, 0.5, 0.5, 0.9];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0.5;
    try {
      const p = piecewiseLogic.generate();
      expect(p.solution).toBe("continuous");
      const leftLimit = parseLeftLimit(p.statement, p.x1);
      const rightValue = parseRightValue(p.statement, p.x1);
      expect(leftLimit).not.toBeNull();
      expect(rightValue).not.toBeNull();
      expect(Math.abs(leftLimit! - rightValue!)).toBeLessThan(1e-9);
    } finally {
      Math.random = original;
    }
  });

  test("forces discontinuous case: left limit differs from right value", () => {
    const original = Math.random;
    // isContinuous = Math.random() > 0.5 → 0.1 → false; jump = floor(0.5*3)+1 = 2
    const values = [0.5, 0.5, 0.5, 0.1, 0.5];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0.5;
    try {
      const p = piecewiseLogic.generate();
      expect(p.solution).toBe("discontinuous");
      const leftLimit = parseLeftLimit(p.statement, p.x1);
      const rightValue = parseRightValue(p.statement, p.x1);
      expect(leftLimit).not.toBeNull();
      expect(rightValue).not.toBeNull();
      expect(Math.abs(leftLimit! - rightValue!)).toBeGreaterThan(0);
    } finally {
      Math.random = original;
    }
  });

  test("explanation shows correct left limit and right value", () => {
    for (let i = 0; i < 40; i++) {
      const p = piecewiseLogic.generate();
      const leftLimit = parseLeftLimit(p.statement, p.x1);
      const rightValue = parseRightValue(p.statement, p.x1);
      if (leftLimit === null || rightValue === null) continue;
      expect(p.explanation).toContain(String(leftLimit));
      expect(p.explanation).toContain(String(rightValue));
    }
  });

  test("boundary x1 is always between 2 and 6", () => {
    for (let i = 0; i < 60; i++) {
      const p = piecewiseLogic.generate();
      expect(p.x1).toBeGreaterThanOrEqual(2);
      expect(p.x1).toBeLessThanOrEqual(6);
    }
  });
});
