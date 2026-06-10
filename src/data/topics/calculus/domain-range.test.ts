import { describe, expect, test } from "bun:test";
import { domainRangeLogic } from "./domain-range";

function forceType(typeIndex: number) {
  // Math.random() calls: type (first call in generate)
  // type = floor(r * 3) → typeIndex/3 + epsilon
  const original = Math.random;
  const typeR = typeIndex / 3 + 0.01;
  // subsequent calls use 0.5 as safe defaults
  let first = true;
  Math.random = () => {
    if (first) { first = false; return typeR; }
    return 0.5;
  };
  try {
    return domainRangeLogic.generate();
  } finally {
    Math.random = original;
  }
}

describe("domainRangeLogic generator", () => {
  test("every generated problem has required fields", () => {
    for (let i = 0; i < 60; i++) {
      const p = domainRangeLogic.generate();
      expect(typeof p.title).toBe("string");
      expect(typeof p.statement).toBe("string");
      expect(typeof p.solution).toBe("string");
      expect(typeof p.explanation).toBe("string");
      expect(typeof p.hint).toBe("string");
      expect(p.answerFormat).toBeDefined();
      expect(p.answerFormat.fields?.length).toBeGreaterThan(0);
    }
  });

  // ── Type 0: Absolute value ────────────────────────────────────────────────

  test("type 0: domain is all reals, range lower bound matches parameter a", () => {
    const original = Math.random;
    // calls: type=0, a=floor(0.5*5)+1=3, b=floor(0.5*9)+1=5
    let callIdx = 0;
    const vals = [0.01, 0.5, 0.5];
    Math.random = () => vals[callIdx++] ?? 0.5;
    try {
      const p = domainRangeLogic.generate();
      // a=3
      expect(p.solution).toContain("(-\\infty, \\infty)");
      expect(p.solution).toContain("[3, \\infty)");
      expect(p.statement).toContain("|x^2");
    } finally {
      Math.random = original;
    }
  });

  test("type 0: range minimum equals the additive constant", () => {
    for (let i = 0; i < 30; i++) {
      const original = Math.random;
      let callIdx = 0;
      const typeR = 0.01;
      const aR = Math.random();
      Math.random = () => {
        if (callIdx === 0) { callIdx++; return typeR; }
        if (callIdx === 1) { callIdx++; return aR; }
        callIdx++;
        return 0.5;
      };
      const p = domainRangeLogic.generate();
      Math.random = original;

      const a = Math.floor(aR * 5) + 1;
      expect(p.solution).toContain(`[${a}, \\infty)`);
    }
  });

  // ── Type 1: Square root ───────────────────────────────────────────────────

  test("type 1: domain lower bound is b/a (integer since b=a*bMult)", () => {
    const original = Math.random;
    // calls: type, a=floor(0.5*3)+1=2, bMult=floor(0.5*4)+1=3 → b=6, lower=3
    let idx = 0;
    const vals = [0.35, 0.5, 0.5];
    Math.random = () => vals[idx++] ?? 0.5;
    try {
      const p = domainRangeLogic.generate();
      expect(p.statement).toContain("\\sqrt{");
      expect(p.solution).toContain("[3, \\infty)");
      expect(p.solution).toContain("[0, \\infty)");
    } finally {
      Math.random = original;
    }
  });

  test("type 1: range is always [0, inf)", () => {
    for (let i = 0; i < 30; i++) {
      const p = forceType(1);
      if (!p.statement.includes("\\sqrt")) continue;
      expect(p.solution).toContain("[0, \\infty)");
    }
  });

  // ── Type 2: Rational ──────────────────────────────────────────────────────

  test("type 2: excluded x value appears in domain and equals denominator root", () => {
    const original = Math.random;
    // calls: type, a=floor(0.5*6)+1=4, c=floor(0.5*5)+1=3
    let idx = 0;
    const vals = [0.68, 0.5, 0.5];
    Math.random = () => vals[idx++] ?? 0.5;
    try {
      const p = domainRangeLogic.generate();
      expect(p.statement).toContain("\\frac{");
      expect(p.solution).toContain("\\{4\\}");  // excluded x=4
      expect(p.solution).toContain("\\{0\\}");  // range excludes 0
    } finally {
      Math.random = original;
    }
  });

  test("type 2: range always excludes 0", () => {
    for (let i = 0; i < 30; i++) {
      const p = forceType(2);
      if (!p.statement.includes("\\frac{")) continue;
      expect(p.solution).toContain("\\{0\\}");
    }
  });

  // ── Cross-type ────────────────────────────────────────────────────────────

  test("solution always contains domain and range information", () => {
    for (let i = 0; i < 60; i++) {
      const p = domainRangeLogic.generate();
      const sol = p.solution.toLowerCase();
      expect(sol.includes("domain") || sol.includes("\\infty") || sol.includes("\\{")).toBe(true);
    }
  });

  test("answerFormat has separate domain and range fields", () => {
    for (let i = 0; i < 60; i++) {
      const p = domainRangeLogic.generate();
      const keys = p.answerFormat.fields?.map((f) => f.key) ?? [];
      expect(keys).toContain("domain");
      expect(keys).toContain("range");
    }
  });
});
