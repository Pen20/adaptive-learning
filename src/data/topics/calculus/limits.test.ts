import { describe, expect, test } from "bun:test";
import { limitsLogic } from "./limits";

function parseSolutionNumber(solution: string): number | null {
  // Matches integers and simple fractions like "3/2" or "-6"
  const clean = solution.replace(/\\\(|\\\)|\$\$|\$/g, "").trim();
  if (clean.includes("/")) {
    const [n, d] = clean.split("/").map(Number);
    return Number.isFinite(n / d) ? n / d : null;
  }
  const val = Number(clean);
  return Number.isFinite(val) ? val : null;
}

function extractLimitPoint(statement: string): number | null {
  const m = statement.match(/\\lim_\{x\s*\\to\s*(-?\d+)\}/);
  return m ? Number(m[1]) : null;
}

describe("limitsLogic generator", () => {
  test("every generated problem has required fields", () => {
    for (let i = 0; i < 60; i++) {
      const p = limitsLogic.generate();
      expect(typeof p.title).toBe("string");
      expect(p.title.length).toBeGreaterThan(0);
      expect(typeof p.statement).toBe("string");
      expect(typeof p.solution).toBe("string");
      expect(typeof p.explanation).toBe("string");
      expect(typeof p.hint).toBe("string");
      expect(p.answerFormat).toBeDefined();
      expect(p.answerFormat.fields?.length).toBeGreaterThan(0);
    }
  });

  test("solution is always a finite number or reduced fraction", () => {
    for (let i = 0; i < 60; i++) {
      const p = limitsLogic.generate();
      const val = parseSolutionNumber(p.solution);
      expect(val).not.toBeNull();
      expect(Number.isFinite(val!)).toBe(true);
    }
  });

  test("factoring type: answer equals 2a where a is the limit point", () => {
    // Force type=0 by pinning Math.random
    const original = Math.random;
    // calls: a, b, c, p, q, type  — type < 0.25 → type=0
    const values = [0.6, 0.5, 0.5, 0.5, 0.5, 0.05];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0;
    try {
      const p = limitsLogic.generate();
      // a = floor(0.6*10)-5 = 1, type=0
      const a = extractLimitPoint(p.statement);
      expect(a).not.toBeNull();
      const answer = parseSolutionNumber(p.solution);
      expect(answer).toBe(2 * a!);
    } finally {
      Math.random = original;
    }
  });

  test("cancellation type: answer equals b*a + c", () => {
    // Force type=1: last value in [0.25, 0.5)
    const original = Math.random;
    const values = [0.6, 0.5, 0.5, 0.5, 0.5, 0.3];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0;
    try {
      const p = limitsLogic.generate();
      // a=1, b=floor(0.5*8)+2=6, c=floor(0.5*10)+1=6  → 6*1+6=12
      expect(p.title).toContain("Cancellation");
      const answer = parseSolutionNumber(p.solution);
      expect(answer).toBe(12);
    } finally {
      Math.random = original;
    }
  });

  test("direct substitution type: answer equals b*a^2 + c", () => {
    // Force type=2: last value in [0.5, 0.75)
    const original = Math.random;
    const values = [0.6, 0.5, 0.5, 0.5, 0.5, 0.6];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0;
    try {
      const p = limitsLogic.generate();
      // a=1, b=6, c=6 → 6*1+6=12
      expect(p.title).toContain("Direct Substitution");
      const answer = parseSolutionNumber(p.solution);
      expect(answer).toBe(12);
    } finally {
      Math.random = original;
    }
  });

  test("infinity type: answer is leading-coefficient ratio", () => {
    // Force type=3: last value >= 0.75
    const original = Math.random;
    // p=floor(0.5*5)+1=3, q=floor(0.5*4)+1=3, numerCoeff=6, denomCoeff=3 → 2
    const values = [0.6, 0.5, 0.5, 0.5, 0.5, 0.9];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0;
    try {
      const p = limitsLogic.generate();
      expect(p.title).toContain("Infinity");
      expect(p.statement).toContain("\\infty");
      const answer = parseSolutionNumber(p.solution);
      expect(Number.isFinite(answer!)).toBe(true);
    } finally {
      Math.random = original;
    }
  });

  test("limit point a is never 0", () => {
    for (let i = 0; i < 80; i++) {
      const p = limitsLogic.generate();
      const a = extractLimitPoint(p.statement);
      if (a !== null) expect(a).not.toBe(0);
    }
  });

  test("answerFormat alternatives always include the solution value", () => {
    for (let i = 0; i < 40; i++) {
      const p = limitsLogic.generate();
      const numericAnswer = parseSolutionNumber(p.solution)!;
      const altsText = p.answerFormat.alternatives?.join(" ") ?? "";
      const altsContainValue =
        altsText.includes(String(numericAnswer)) ||
        altsText.includes(String(Math.round(numericAnswer)));
      expect(altsContainValue).toBe(true);
    }
  });
});
