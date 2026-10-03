import { describe, expect, test } from "bun:test";
import katex from "katex";
import { getAnswerFormat, topicRegistry } from "./index";
import type { GeneratedProblem } from "./index";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "../../../convex/cas";

// Every exercise in the registry is administered to students, so each generator
// is swept here for the failure modes that reach the learner: missing content,
// template placeholders that never got interpolated, LaTeX that KaTeX refuses to
// render, degenerate items (a "quotient rule" problem whose answer is 0), and
// official solutions the deterministic grader would mark wrong.

const SAMPLES = 120;
const CAS_SAMPLES = 15;

const TEXT_FIELDS = ["title", "statement", "prompt", "solution", "explanation", "hint"] as const;

// --- KaTeX ---------------------------------------------------------------
// Mirrors MathRenderer: $$…$$ / $…$ are normalised to \[…\] / \(…\), then each
// math span is handed to KaTeX. A span that throws here renders as red fallback
// text in the app.
function normalizeDelimiters(text: string): string {
  let s = text.replace(/\\\$/g, "$");
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `\\[${inner}\\]`);
  s = s.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (_, inner) => `\\(${inner}\\)`);
  return s;
}

function mathSpans(text: string): { math: string; display: boolean }[] {
  return normalizeDelimiters(text)
    .split(/(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g)
    .filter(
      (part) =>
        (part.startsWith("\\[") && part.endsWith("\\]")) ||
        (part.startsWith("\\(") && part.endsWith("\\)")),
    )
    .map((part) => ({ math: part.slice(2, -2), display: part.startsWith("\\[") }));
}

// --- text that must never reach a student --------------------------------
const CORRUPTION: [RegExp, string][] = [
  [/\$\{/, "unexpanded ${...} template placeholder"],
  [/(?<!is )\bundefined\b/, "literal 'undefined'"],
  [/\bNaN\b/, "literal 'NaN'"],
  [/\[object Object\]/, "literal '[object Object]'"],
];

// Typography defects produced by interpolating raw coefficients. Checked on the
// statement and the solution — the two strings a student must read exactly.
const DEGENERATE: [RegExp, string][] = [
  [/(?<![\d.\w}])1x(?![\d\w])/, "redundant coefficient '1x'"],
  [/(?<![\d.\w}])1y(?![\d\w])/, "redundant coefficient '1y'"],
  [/[+\-]\s+[-+]\s*\d/, "double sign such as '+ -3' or '- -5'"],
  [/\\d?frac\{\s*0\s*\}/, "fraction with a zero numerator"],
];

function textOf(problem: GeneratedProblem, topicId: string): { field: string; value: string }[] {
  const parts: { field: string; value: string }[] = TEXT_FIELDS.filter(
    (field) => typeof problem[field] === "string",
  ).map((field) => ({ field: String(field), value: problem[field] as string }));
  const format = getAnswerFormat(topicId, problem);
  parts.push({ field: "answerFormat.instruction", value: format.instruction });
  parts.push({ field: "answerFormat.placeholder", value: format.placeholder });
  return parts;
}

for (const [topicId, engine] of Object.entries(topicRegistry)) {
  describe(`topic "${topicId}"`, () => {
    const problems: GeneratedProblem[] = Array.from({ length: SAMPLES }, () => engine.generate());

    test("every generated problem carries the content a student needs", () => {
      for (const problem of problems) {
        for (const field of ["statement", "solution", "explanation", "hint"] as const) {
          expect(`${field}: ${typeof problem[field]}`).toBe(`${field}: string`);
          expect((problem[field] as string).trim().length).toBeGreaterThan(0);
        }
        const format = getAnswerFormat(topicId, problem);
        expect(format.instruction.trim().length).toBeGreaterThan(0);
        expect(format.placeholder.trim().length).toBeGreaterThan(0);
      }
    });

    test("no unexpanded template placeholders or JS artefacts reach the student", () => {
      for (const problem of problems) {
        for (const { field, value } of textOf(problem, topicId)) {
          for (const [pattern, label] of CORRUPTION) {
            const match = value.match(pattern);
            expect(
              match ? `${field} contains ${label}: ${excerpt(value, match.index ?? 0)}` : "clean",
            ).toBe("clean");
          }
        }
      }
    });

    test("every math span renders in KaTeX", () => {
      for (const problem of problems) {
        for (const { field, value } of textOf(problem, topicId)) {
          for (const span of mathSpans(value)) {
            let error = "";
            try {
              katex.renderToString(span.math, {
                displayMode: span.display,
                throwOnError: true,
                strict: false,
              });
            } catch (thrown) {
              error = `${field}: ${(thrown as Error).message.split("\n")[0]} — "${span.math}"`;
            }
            expect(error).toBe("");
          }
        }
      }
    });

    test("statements and solutions are free of degenerate coefficients and signs", () => {
      for (const problem of problems) {
        for (const field of ["statement", "solution"] as const) {
          const value = problem[field] as string;
          for (const [pattern, label] of DEGENERATE) {
            const match = value.match(pattern);
            expect(
              match ? `${field} contains ${label}: ${excerpt(value, match.index ?? 0)}` : "clean",
            ).toBe("clean");
          }
        }
      }
    });

    test("the generator produces varied problems", () => {
      const distinct = new Set(problems.map((problem) => problem.statement)).size;
      // The proof topics (integral_axioms, vector_space_axioms) draw from fixed
      // banks of qualitative scenarios rather than random coefficients, so they
      // set the floor: a student session must not keep meeting the same item.
      expect(`${distinct} distinct statements in ${SAMPLES} draws`).toBe(
        `${Math.max(distinct, 20)} distinct statements in ${SAMPLES} draws`,
      );
    });

    // --- deterministic grading ------------------------------------------
    const gradable = problems.slice(0, CAS_SAMPLES).flatMap((problem) => {
      const direct = computeDirectGroundTruth(problem.statement, topicId);
      if (!direct || !direct.isComputable || !direct.groundTruth) return [];
      return [{ problem, groundTruth: direct.groundTruth }];
    });

    test("the official solution is never graded as wrong by the CAS", () => {
      for (const { problem, groundTruth } of gradable) {
        // null means "no deterministic verdict, defer to the AI grader" — only
        // an explicit false is a defect: the student copying the model answer
        // would be marked incorrect.
        const verdict = checkEquivalenceDirect(problem.solution, groundTruth);
        expect(
          verdict.isEquivalent === false
            ? `solution "${problem.solution}" rejected against ground truth "${groundTruth}"`
            : "accepted",
        ).toBe("accepted");
      }
    });

    test("a nonsense answer is never graded as correct", () => {
      for (const { groundTruth } of gradable.slice(0, 5)) {
        expect(checkEquivalenceDirect("banana", groundTruth).isEquivalent === true).toBe(
          false,
        );
      }
    });
  });
}

function excerpt(value: string, index: number): string {
  return value.slice(Math.max(0, index - 40), index + 60).replace(/\n/g, " ");
}

// Topics whose answers are settled without the AI grader. Deterministic grading
// depends on the statement's exact wording, so a purely cosmetic change to a
// generator can silently drop a topic back onto the AI. These assert that every
// generated problem — under the canonical id and under each admin-panel alias —
// still reaches the CAS.
const DETERMINISTIC_TOPICS = [
  "limits",
  "limits_continuity",
  "derivatives",
  "derivatives_practice",
  "piecewise_continuity",
  "continuity",
  "piecewise",
  "domain_range",
  "quadratic_equations",
  "quadratic",
  "eigenvalues",
  "eigenvalues_3x3",
  "determinants",
  "matrices",
  "polynomial_inner_product",
  "linear_equations",
  "equations",
  "linear_systems",
  "systems",
];

describe("deterministic grading coverage", () => {
  for (const topicId of DETERMINISTIC_TOPICS) {
    test(`"${topicId}" grades every generated problem without the AI`, () => {
      const engine = topicRegistry[topicId];
      for (let i = 0; i < 60; i++) {
        const problem = engine.generate();
        const direct = computeDirectGroundTruth(problem.statement, topicId);
        expect(
          direct && direct.isComputable && direct.groundTruth
            ? "gradable"
            : `not gradable: ${problem.statement.replace(/\n/g, " ")}`,
        ).toBe("gradable");
      }
    });
  }

  const ALIASES: [string, string][] = [
    ["limits_continuity", "limits"],
    ["derivatives_practice", "derivatives"],
    ["continuity", "piecewise_continuity"],
    ["piecewise", "piecewise_continuity"],
    ["quadratic", "quadratic_equations"],
    ["matrices", "determinants"],
    ["equations", "linear_equations"],
    ["systems", "linear_systems"],
  ];

  for (const [alias, canonical] of ALIASES) {
    test(`alias "${alias}" grades identically to "${canonical}"`, () => {
      const engine = topicRegistry[canonical];
      for (let i = 0; i < 25; i++) {
        const { statement } = engine.generate();
        expect(JSON.stringify(computeDirectGroundTruth(statement, alias))).toBe(
          JSON.stringify(computeDirectGroundTruth(statement, canonical)),
        );
      }
    });
  }
});
