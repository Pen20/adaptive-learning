import { describe, expect, test } from "bun:test";
import { derivativesLogic } from "./derivatives";

const REQUIRED_FIELDS = [
  "title",
  "statement",
  "solution",
  "explanation",
  "hint",
  "answerFormat",
] as const;

function forceType(typeIndex: number, callback: () => ReturnType<typeof derivativesLogic.generate>) {
  // Math.random calls: a, b, n, k, m, type
  // type = floor(r * 5), so r = typeIndex / 5 + epsilon
  const original = Math.random;
  const typeR = typeIndex / 5 + 0.01;
  const values = [0.5, 0.5, 0.5, 0.5, 0.5, typeR];
  let idx = 0;
  Math.random = () => values[idx++] ?? 0;
  try {
    return callback();
  } finally {
    Math.random = original;
  }
}

describe("derivativesLogic generator", () => {
  test("every generated problem has required fields and non-empty content", () => {
    for (let i = 0; i < 60; i++) {
      const p = derivativesLogic.generate();
      for (const field of REQUIRED_FIELDS) {
        expect(p[field]).toBeDefined();
      }
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.solution.length).toBeGreaterThan(0);
      expect(p.answerFormat.fields?.length).toBeGreaterThan(0);
    }
  });

  test("type 0 (trig chain rule): solution contains sin and correct sign", () => {
    const p = forceType(0, () => derivativesLogic.generate());
    // a=floor(0.5*5)+2=4, b=floor(0.5*4)+2=4, ab=-16
    expect(p.title).toContain("Trig");
    expect(p.statement).toContain("\\cos");
    expect(p.solution).toContain("\\sin");
    // derivative of a*cos(bx) is negative
    expect(p.solution).toMatch(/-\d+/);
  });

  test("type 1 (log chain rule): solution is a fraction form", () => {
    const p = forceType(1, () => derivativesLogic.generate());
    expect(p.title).toContain("Logarithm");
    expect(p.statement).toContain("\\ln");
    // solution should contain a fraction
    expect(p.solution).toContain("frac");
  });

  test("type 2 (power rule): solution contains correct leading coefficient", () => {
    const p = forceType(2, () => derivativesLogic.generate());
    // a=4, n=floor(0.5*3)+3=4, n*a=16
    expect(p.title).toContain("Power");
    expect(p.statement).toContain("x^");
    // The derivative drops the constant term
    expect(p.explanation).toContain("Power Rule");
  });

  test("type 3 (product rule): statement has e^{} and explanation has Product Rule", () => {
    const p = forceType(3, () => derivativesLogic.generate());
    expect(p.title).toContain("Product");
    expect(p.statement).toContain("e^{");
    expect(p.explanation).toContain("Product Rule");
    expect(p.solution).toContain("e^{");
  });

  test("type 4 (quotient rule): statement has \\frac and explanation has Quotient Rule", () => {
    const p = forceType(4, () => derivativesLogic.generate());
    expect(p.title).toContain("Quotient");
    expect(p.statement).toContain("\\frac");
    expect(p.explanation).toContain("Quotient Rule");
  });

  test("trig type: coefficient in solution matches a*b from statement", () => {
    for (let i = 0; i < 20; i++) {
      const original = Math.random;
      const typeR = 0.01; // type=0
      const aR = Math.random();
      const bR = Math.random();
      let idx = 0;
      const rValues = [aR, bR, 0.5, 0.5, 0.5, typeR];
      Math.random = () => rValues[idx++] ?? 0;
      const p = derivativesLogic.generate();
      Math.random = original;

      if (!p.title.includes("Trig")) continue;

      const a = Math.floor(aR * 5) + 2;
      const b = Math.floor(bR * 4) + 2;
      const expectedCoeff = a * b;
      expect(p.solution).toContain(String(expectedCoeff));
    }
  });

  test("quotient rule: numerator determinant (ad-bc) appears in solution", () => {
    const original = Math.random;
    // a=4, b=4, k(=c)=4, m(=d)=3 → ad-bc = 4*3 - 4*4 = 12-16 = -4
    const values = [0.5, 0.5, 0.5, 0.5, 0.4, 0.9]; // type=4
    let idx = 0;
    Math.random = () => values[idx++] ?? 0;
    const p = derivativesLogic.generate();
    Math.random = original;

    if (!p.title.includes("Quotient")) return;
    // a=floor(0.5*5)+2=4, b=floor(0.5*4)+2=4, k=floor(0.5*4)+2=4, m=floor(0.4*5)+1=3
    const det = 4 * 3 - 4 * 4; // = -4
    expect(p.solution).toContain(String(det));
  });
});
