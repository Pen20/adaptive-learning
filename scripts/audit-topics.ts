/**
 * Standalone audit of every exercise generator in the topic registry.
 * Run: bun run scripts/audit-topics.ts [samplesPerTopic]
 *
 * Not a test: it prints a report of every anomaly found so the item bank can be
 * inspected before exercises are administered to students.
 */
import katex from "katex";
import { topicRegistry, getAnswerFormat } from "../src/data/topics";
import type { GeneratedProblem } from "../src/data/topics";
import { computeDirectGroundTruth, checkEquivalenceDirect } from "../convex/cas";

const SAMPLES = Number(process.argv[2] ?? 200);
const CAS_SAMPLES = 25;

type Finding = { topic: string; kind: string; detail: string };
const findings: Finding[] = [];
const add = (topic: string, kind: string, detail: string) =>
  findings.push({ topic, kind, detail });

// Mirrors MathRenderer.normalizeDelimiters + its split regex.
function normalizeDelimiters(text: string): string {
  let s = text.replace(/\\\$/g, "$");
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `\\[${inner}\\]`);
  s = s.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (_, inner) => `\\(${inner}\\)`);
  return s;
}

function mathSpans(text: string): { math: string; display: boolean }[] {
  const normalized = normalizeDelimiters(text);
  const regex = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  return normalized
    .split(regex)
    .filter(
      (p) =>
        (p.startsWith("\\[") && p.endsWith("\\]")) ||
        (p.startsWith("\\(") && p.endsWith("\\)")),
    )
    .map((p) => ({ math: p.slice(2, -2), display: p.startsWith("\\[") }));
}

const TEXT_FIELDS = [
  "title",
  "statement",
  "prompt",
  "solution",
  "explanation",
  "hint",
] as const;

const BAD_TOKENS: [RegExp, string][] = [
  [/\$\{/, "unexpanded template placeholder ${...}"],
  // "is undefined" / "at Infinity" are legitimate prose in worked solutions.
  [/(?<!is )\bundefined\b/, "literal 'undefined'"],
  [/\bNaN\b/, "literal 'NaN'"],
  [/(?<!at )\bInfinity\b/, "literal 'Infinity'"],
  [/\[object Object\]/, "literal '[object Object]'"],
];

// Checked on the statement and solution only: worked explanations legitimately
// display 0/0 indeterminate forms, "+ 0" vanishing terms and skipped cofactors.
const COSMETIC_FIELDS = ["title", "statement", "prompt", "solution"];

const COSMETIC: [RegExp, string][] = [
  [/[+\-]\s*[-+]\s*\d/, "double sign (e.g. '+ -3')"],
  [/(?<![\d.\w}])1x(?![\d\w])/, "redundant coefficient '1x'"],
  [/(?<![\d.\w}])1y(?![\d\w])/, "redundant coefficient '1y'"],
  [/x\^\{?1\}?(?![\d\w])/, "redundant exponent 'x^1'"],
  [/x\^\{?0\}?(?![\d\w])/, "degenerate exponent 'x^0'"],
  [/\\d?frac\{\s*0\s*\}/, "fraction with zero numerator"],
  [/\\d?frac\{[^{}]*\}\{\s*0\s*\}/, "fraction with zero denominator"],
  [/[+\-]\s*0(?![\d.])/, "trivial '+ 0' / '- 0' term"],
];

for (const [topicId, engine] of Object.entries(topicRegistry)) {
  const problems: GeneratedProblem[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    try {
      problems.push(engine.generate());
    } catch (error) {
      add(topicId, "THROWS", `generate() threw: ${(error as Error).message}`);
      break;
    }
  }
  if (!problems.length) continue;

  const seenBad = new Set<string>();
  const seenCosmetic = new Set<string>();
  const seenKatex = new Set<string>();

  for (const p of problems) {
    // --- required content -------------------------------------------------
    for (const field of ["statement", "solution", "explanation", "hint"] as const) {
      const value = p[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        if (!seenBad.has(`empty:${field}`)) {
          seenBad.add(`empty:${field}`);
          add(topicId, "EMPTY_FIELD", `"${field}" is missing or empty`);
        }
      }
    }

    const format = getAnswerFormat(topicId, p);
    if (!format.placeholder?.trim() || !format.instruction?.trim()) {
      if (!seenBad.has("format")) {
        seenBad.add("format");
        add(
          topicId,
          "ANSWER_FORMAT",
          "answer format has an empty placeholder or instruction",
        );
      }
    }

    if (!p.pedagogy && !seenBad.has("pedagogy")) {
      seenBad.add("pedagogy");
      add(topicId, "NO_PEDAGOGY", "generated problem carries no pedagogy instance");
    }

    // --- corrupted text ---------------------------------------------------
    for (const field of TEXT_FIELDS) {
      const value = p[field];
      if (typeof value !== "string") continue;
      for (const [pattern, label] of BAD_TOKENS) {
        const m = value.match(pattern);
        if (m) {
          const key = `${field}:${label}`;
          if (!seenBad.has(key)) {
            seenBad.add(key);
            const idx = m.index ?? 0;
            add(
              topicId,
              "CORRUPT_TEXT",
              `${field}: ${label} — ...${value
                .slice(Math.max(0, idx - 40), idx + 60)
                .replace(/\n/g, " ")}...`,
            );
          }
        }
      }
      if (!COSMETIC_FIELDS.includes(field)) continue;
      for (const [pattern, label] of COSMETIC) {
        const m = value.match(pattern);
        if (m) {
          const key = `${field}:${label}`;
          if (!seenCosmetic.has(key)) {
            seenCosmetic.add(key);
            const idx = m.index ?? 0;
            add(
              topicId,
              "FORMATTING",
              `${field}: ${label} — ...${value
                .slice(Math.max(0, idx - 40), idx + 60)
                .replace(/\n/g, " ")}...`,
            );
          }
        }
      }
    }

    // --- KaTeX rendering --------------------------------------------------
    for (const field of TEXT_FIELDS) {
      const value = p[field];
      if (typeof value !== "string") continue;
      for (const span of mathSpans(value)) {
        try {
          katex.renderToString(span.math, {
            displayMode: span.display,
            throwOnError: true,
            strict: false,
          });
        } catch (error) {
          const message = (error as Error).message.split("\n")[0];
          const key = `${field}:${message}`;
          if (!seenKatex.has(key)) {
            seenKatex.add(key);
            add(
              topicId,
              "KATEX",
              `${field}: ${message} — source: ${span.math.slice(0, 90)}`,
            );
          }
        }
      }
    }
  }

  // --- variety ------------------------------------------------------------
  const distinct = new Set(problems.map((p) => p.statement)).size;
  if (distinct < Math.min(10, SAMPLES)) {
    add(
      topicId,
      "LOW_VARIETY",
      `only ${distinct} distinct statements in ${problems.length} draws`,
    );
  }

  // --- deterministic grading of the official solution ----------------------
  let computable = 0;
  let mismatches = 0;
  for (const p of problems.slice(0, CAS_SAMPLES)) {
    let direct;
    try {
      direct = computeDirectGroundTruth(p.statement, topicId);
    } catch (error) {
      add(
        topicId,
        "CAS_THROWS",
        `computeDirectGroundTruth threw: ${(error as Error).message}`,
      );
      break;
    }
    if (!direct?.isComputable || !direct.groundTruth) continue;
    computable++;
    const check = checkEquivalenceDirect(p.solution, direct.groundTruth);
    // null = no deterministic verdict, deferred to the AI grader. Only an
    // explicit false is a defect: the student copying the model answer loses.
    if (check.isEquivalent === false) {
      mismatches++;
      if (mismatches <= 3) {
        add(
          topicId,
          "CAS_MISMATCH",
          `official solution "${p.solution}" not accepted against ground truth "${direct.groundTruth}" (statement: ${p.statement.slice(0, 90)})`,
        );
      }
    }
  }

  console.error(
    `[audit] ${topicId}: ${problems.length} problems, ${distinct} distinct, ${computable}/${CAS_SAMPLES} CAS-gradable, ${mismatches} solution mismatches`,
  );
}

// -- report ----------------------------------------------------------------
const byKind = new Map<string, Finding[]>();
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind)!.push(f);
}
const lines: string[] = [];
lines.push(`# Topic generator audit - ${SAMPLES} samples per topic`);
lines.push(`Topics audited: ${Object.keys(topicRegistry).length}`);
lines.push(`Findings: ${findings.length}`);
for (const [kind, items] of [...byKind.entries()].sort()) {
  lines.push(`\n## ${kind} (${items.length})`);
  for (const item of items) lines.push(`- **${item.topic}** - ${item.detail}`);
}
console.log(lines.join("\n"));
