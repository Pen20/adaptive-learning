import { describe, expect, test } from "bun:test";
import {
  parseLimitGroundTruth,
  parsePiecewiseGroundTruth,
  parseDomainRangeGroundTruth,
  reduceFraction,
  gcdCalc,
} from "./calculusCasUtils";

// ── Utility helpers ──────────────────────────────────────────────────────────

describe("gcdCalc", () => {
  test("returns 1 for coprime numbers", () => {
    expect(gcdCalc(7, 3)).toBe(1);
    expect(gcdCalc(4, 9)).toBe(1);
  });
  test("reduces shared factors", () => {
    expect(gcdCalc(6, 4)).toBe(2);
    expect(gcdCalc(15, 10)).toBe(5);
  });
  test("handles zeros and ones", () => {
    expect(gcdCalc(0, 5)).toBe(5);
    expect(gcdCalc(1, 100)).toBe(1);
  });
});

describe("reduceFraction", () => {
  test("returns integer string when denominator divides numerator", () => {
    expect(reduceFraction(6, 3)).toBe("2");
    expect(reduceFraction(10, 2)).toBe("5");
  });
  test("reduces to lowest terms", () => {
    expect(reduceFraction(3, 2)).toBe("3/2");
    expect(reduceFraction(6, 4)).toBe("3/2");
  });
});

// ── Limits CAS parsing ───────────────────────────────────────────────────────

describe("parseLimitGroundTruth", () => {
  // Type 0 — factoring
  test("recognises difference-of-squares limit and returns 2a", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("6");
  });

  test("factoring type works for negative a", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to -4} \\frac{x^2 - 16}{x + 4} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("-8");
  });

  test("factoring type: a=1 gives 2", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to 1} \\frac{x^2 - 1}{x - 1} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result!.groundTruth).toBe("2");
  });

  // Type 1 — cancellation
  test("recognises cancellation limit and returns b*a+c", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to 2} \\frac{(5x + 3)(x - 2)}{x - 2} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("13"); // 5*2+3=13
  });

  // Type 2 — direct substitution
  test("recognises direct-substitution polynomial limit", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to 3} (4x^2 + 2) $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("38"); // 4*9+2=38
  });

  test("direct substitution with negative a", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to -2} (3x^2 + 5) $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result!.groundTruth).toBe("17"); // 3*4+5=17
  });

  // Type 3 — infinity
  test("recognises limit at infinity and returns reduced ratio", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{6x + 1}{3x + 2} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("2"); // 6/3=2
  });

  test("limit at infinity reduces fraction correctly", () => {
    const stmt = "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{5x + 3}{2x + 1} $$";
    const result = parseLimitGroundTruth(stmt);
    expect(result!.groundTruth).toBe("5/2");
  });

  test("returns null for unrecognised statement", () => {
    const result = parseLimitGroundTruth("Find the area under the curve.");
    expect(result).toBeNull();
  });
});

// ── Piecewise CAS parsing ────────────────────────────────────────────────────

describe("parsePiecewiseGroundTruth", () => {
  function buildStatement(x1: number, m: number, b: number, q: number): string {
    const qDisplay = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
    return ` Determine if the function is continuous or discontinuous at $x = ${x1}$\n$$f(x) = \\begin{cases} ${m}x + ${b}, & x < ${x1} \\\\ x ${qDisplay}, & x \\ge ${x1} \\end{cases} $$`;
  }

  test("detects continuous function (left limit = right value)", () => {
    // m=2, b=3, x1=5 → left=13; q=8 → right=5+8=13 ✓
    const stmt = buildStatement(5, 2, 3, 8);
    const result = parsePiecewiseGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("continuous");
  });

  test("detects discontinuous function (left limit ≠ right value)", () => {
    // m=2, b=3, x1=5 → left=13; q=6 → right=5+6=11 ≠ 13
    const stmt = buildStatement(5, 2, 3, 6);
    const result = parsePiecewiseGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toBe("discontinuous");
  });

  test("description contains numerical left and right values", () => {
    const stmt = buildStatement(4, 3, 1, 9);
    // left = 3*4+1=13, right = 4+9=13 → continuous
    const result = parsePiecewiseGroundTruth(stmt);
    expect(result!.description).toContain("13");
  });

  test("returns null for unrecognised statement", () => {
    expect(parsePiecewiseGroundTruth("Find the eigenvalues.")).toBeNull();
  });
});

// ── Domain/Range CAS parsing ─────────────────────────────────────────────────

describe("parseDomainRangeGroundTruth", () => {
  // Type 0 — absolute value
  test("recognises absolute-value function and returns correct range lower bound", () => {
    const stmt = "Determine the domain and range of the function $$ f(x) = 3 + |x^2 - 7| $$";
    const result = parseDomainRangeGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toContain("(-inf, inf)");
    expect(result!.groundTruth).toContain("[3, inf)");
  });

  test("absolute value: range minimum equals additive constant", () => {
    for (const a of [1, 2, 5]) {
      const stmt = `$$ f(x) = ${a} + |x^2 - 4| $$`;
      const result = parseDomainRangeGroundTruth(stmt);
      expect(result!.groundTruth).toContain(`[${a}, inf)`);
    }
  });

  // Type 1 — square root
  test("recognises sqrt function and computes correct domain lower bound", () => {
    // f(x) = sqrt(2x - 6) → x >= 3
    const stmt = "$$ f(x) = \\sqrt{2x - 6} $$";
    const result = parseDomainRangeGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toContain("[3, inf)");
    expect(result!.groundTruth).toContain("[0, inf)");
  });

  test("sqrt: handles non-unit coefficient as fraction", () => {
    // f(x) = sqrt(3x - 4) → x >= 4/3
    const stmt = "$$ f(x) = \\sqrt{3x - 4} $$";
    const result = parseDomainRangeGroundTruth(stmt);
    expect(result!.groundTruth).toContain("[4/3, inf)");
  });

  // Type 2 — rational
  test("recognises rational function and returns correct excluded values", () => {
    // f(x) = 2/(x - 5)
    const stmt = "$$ f(x) = \\frac{2}{x - 5} $$";
    const result = parseDomainRangeGroundTruth(stmt);
    expect(result).not.toBeNull();
    expect(result!.groundTruth).toContain("R\\{5}");
    expect(result!.groundTruth).toContain("R\\{0}");
  });

  test("rational: excluded x value appears in description", () => {
    const stmt = "$$ f(x) = \\frac{3}{x - 7} $$";
    const result = parseDomainRangeGroundTruth(stmt);
    expect(result!.description).toContain("7");
  });

  test("returns null for unrecognised statement", () => {
    expect(parseDomainRangeGroundTruth("Find the derivative.")).toBeNull();
  });
});
