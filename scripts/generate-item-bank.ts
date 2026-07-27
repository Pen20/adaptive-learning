// Generates the fixed pilot item bank for the quiz study (protocol §5.1).
//
// Run:  bun scripts/generate-item-bank.ts
//
// For each study topic it produces two isomorphic fixed forms (Version A for
// the pre-test, Version B for the post-test): same generator skeletons, same
// 2 easy / 2 medium / 2 hard composition, different parameters. Every item is
// validated end-to-end: the direct CAS path must compute its ground truth and
// must grade the generator's official solution as correct.
//
// Generation is reproducible: Math.random is replaced by a seeded PRNG
// (one seed per topic × version, derived from BASE_SEED).
//
// Outputs:
//   docs/research/item-bank/item-bank.json   (machine-readable, with answer key)
//   docs/research/banque-items-pilote.md     (reviewable document)

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { topicRegistry, getAnswerFormat } from "../src/data/topics";
import type { GeneratedProblem } from "../src/data/topics";
import { classifyDifficulty } from "../src/data/difficultyClassifiers";
import type { DifficultyTier } from "../src/data/difficultyClassifiers";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "../convex/cas";

const BASE_SEED = 20260718;
const STUDY_TOPICS = [
  { slug: "determinants", code: "DET", title: "Determinants" },
  { slug: "eigenvalues", code: "EIG", title: "Eigenvalues & Eigenvectors (2×2)" },
  { slug: "derivatives", code: "DER", title: "Derivatives" },
] as const;
const VERSIONS = ["A", "B"] as const;
const TIER_PLAN: Array<{ tier: DifficultyTier; count: number }> = [
  { tier: "easy", count: 2 },
  { tier: "medium", count: 2 },
  { tier: "hard", count: 2 },
];
const TIER_LABELS: Record<DifficultyTier, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};
const MAX_TRIES_PER_ITEM = 500;

type BankItem = {
  id: string;
  topic: string;
  version: (typeof VERSIONS)[number];
  position: number; // 1-6, presentation order
  tier: DifficultyTier;
  statement: string;
  prompt: string | null;
  placeholder: string;
  instruction: string;
  groundTruth: string; // CAS answer key (deterministic)
  officialSolution: string; // generator's worked solution (LaTeX)
  explanation: string | null; // for expert review
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function generateItem(
  topicSlug: string,
  tier: DifficultyTier,
  usedStatements: Set<string>,
  usedTruths: Set<string>,
): { generated: GeneratedProblem; groundTruth: string } {
  const engine = topicRegistry[topicSlug];
  for (let attempt = 0; attempt < MAX_TRIES_PER_ITEM; attempt++) {
    const generated = engine.generate();
    if (classifyDifficulty(topicSlug, generated.statement) !== tier) continue;
    if (usedStatements.has(generated.statement)) continue;

    const direct = computeDirectGroundTruth(generated.statement, topicSlug);
    if (!direct || !direct.isComputable || !direct.groundTruth) continue;
    // No two items of the same form may share an answer key (answer leakage)
    if (usedTruths.has(direct.groundTruth)) continue;

    // The official solution must be graded correct by the deterministic checker
    const check = checkEquivalenceDirect(generated.solution, direct.groundTruth);
    if (check.isEquivalent !== true) continue;

    usedStatements.add(generated.statement);
    usedTruths.add(direct.groundTruth);
    return { generated, groundTruth: direct.groundTruth };
  }
  throw new Error(
    `Could not generate a valid "${tier}" item for topic "${topicSlug}" within ${MAX_TRIES_PER_ITEM} tries`,
  );
}

function buildBank(): BankItem[] {
  const items: BankItem[] = [];
  for (const topic of STUDY_TOPICS) {
    // Uniqueness enforced across BOTH versions of a topic so pre and post
    // never show a participant the same parameters.
    const usedStatements = new Set<string>();
    for (const version of VERSIONS) {
      const seed = BASE_SEED + STUDY_TOPICS.indexOf(topic) * 1000 + (version === "A" ? 0 : 500);
      const restoreRandom = Math.random;
      Math.random = mulberry32(seed);
      const usedTruths = new Set<string>(); // per version — no repeated answer keys in one form
      try {
        let position = 0;
        for (const { tier, count } of TIER_PLAN) {
          for (let i = 0; i < count; i++) {
            position += 1;
            const { generated, groundTruth } = generateItem(topic.slug, tier, usedStatements, usedTruths);
            const format = getAnswerFormat(topic.slug, generated);
            items.push({
              id: `${topic.code}-${version}-${position}`,
              topic: topic.slug,
              version,
              position,
              tier,
              statement: generated.statement,
              prompt: generated.prompt ?? null,
              placeholder: format.placeholder,
              instruction: format.instruction,
              groundTruth,
              officialSolution: generated.solution,
              explanation: generated.explanation ?? null,
            });
          }
        }
      } finally {
        Math.random = restoreRandom;
      }
    }
  }
  return items;
}

function renderMarkdown(items: BankItem[]): string {
  const lines: string[] = [];
  lines.push(`# Pilot Item Bank — Pre/Post Quiz for the Study`);
  lines.push("");
  lines.push(`**Generated:** 2026-07-18 · **Script:** \`scripts/generate-item-bank.ts\` · **Seed:** ${BASE_SEED} (reproducible)`);
  lines.push("");
  lines.push(`## Purpose`);
  lines.push("");
  lines.push(`Fixed forms for **piloting the measurement instrument** (protocol §5.1, docs/research/protocole-etude-quiz.md) with 10–15 students outside the study. Each topic has two isomorphic versions — **Version A** (pre-test) and **Version B** (post-test) — same problem skeletons, same difficulty composition (2 easy, 2 medium, 2 hard), different numeric parameters. Every item was validated automatically: the ground truth is computed by the direct CAS path (deterministic, no LLM) and the generator's official solution is graded correct by the equivalence checker.`);
  lines.push("");
  lines.push(`## Pilot administration`);
  lines.push("");
  lines.push(`- 6 items per topic, **15 minutes**, final answer only, one attempt per item, no feedback and no hints.`);
  lines.push(`- All pilot participants receive **the same items** (a precondition for computing the psychometric indices).`);
  lines.push(`- Mark using the answer key below (accepted equivalences: set notation, equivalent fractions, symbolically equal forms — the same rules as \`checkEquivalenceDirect\`).`);
  lines.push("");
  lines.push(`## Item retention criteria (§5.1)`);
  lines.push("");
  lines.push(`- **Difficulty index** p (proportion correct), target: **0.40 – 0.70**.`);
  lines.push(`- **Discrimination index** D (27% extreme-groups method or point-biserial correlation): **> 0.20**.`);
  lines.push(`- Item outside the targets → regenerate a replacement in the same tier with the script (change BASE_SEED) and re-pilot if feasible.`);
  lines.push("");

  for (const topic of STUDY_TOPICS) {
    lines.push(`---`);
    lines.push("");
    lines.push(`# Topic: ${topic.title} (\`${topic.slug}\`)`);
    for (const version of VERSIONS) {
      lines.push("");
      lines.push(`## Version ${version} ${version === "A" ? "(pre-test)" : "(post-test)"}`);
      const versionItems = items.filter((i) => i.topic === topic.slug && i.version === version);
      for (const item of versionItems) {
        lines.push("");
        lines.push(`### ${item.id} — ${TIER_LABELS[item.tier]}`);
        lines.push("");
        lines.push(item.statement);
        if (item.prompt) {
          lines.push("");
          lines.push(`*Prompt:* ${item.prompt}`);
        }
        lines.push("");
        lines.push(`*Answer format:* ${item.instruction} (e.g. \`${item.placeholder}\`)`);
        lines.push("");
        lines.push(`**Expected answer (CAS key):** \`${item.groundTruth}\``);
        lines.push("");
        lines.push(`**Official solution:** ${item.officialSolution}`);
      }
    }
    lines.push("");
    lines.push(`## Answer key — ${topic.title}`);
    lines.push("");
    lines.push(`| Item | Tier | CAS key |`);
    lines.push(`|---|---|---|`);
    for (const item of items.filter((i) => i.topic === topic.slug)) {
      lines.push(`| ${item.id} | ${TIER_LABELS[item.tier]} | \`${item.groundTruth}\` |`);
    }
    lines.push("");
  }

  lines.push(`---`);
  lines.push("");
  lines.push(`## Index worksheet (to fill in after the pilot)`);
  lines.push("");
  lines.push(`| Item | n responses | n correct | p | D | Verdict (keep / replace) |`);
  lines.push(`|---|---|---|---|---|---|`);
  for (const item of items) {
    lines.push(`| ${item.id} |  |  |  |  |  |`);
  }
  lines.push("");
  return lines.join("\n");
}

const items = buildBank();
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "research");
mkdirSync(join(outDir, "item-bank"), { recursive: true });
writeFileSync(
  join(outDir, "item-bank", "item-bank.json"),
  JSON.stringify(
    { generatedAt: "2026-07-18", baseSeed: BASE_SEED, itemCount: items.length, items },
    null,
    2,
  ),
);
writeFileSync(join(outDir, "banque-items-pilote.md"), renderMarkdown(items));

const summary = STUDY_TOPICS.map((t) => {
  const n = items.filter((i) => i.topic === t.slug).length;
  return `${t.slug}: ${n} items`;
}).join(" · ");
console.log(`Item bank generated — ${items.length} items (${summary})`);
console.log(`  docs/research/item-bank/item-bank.json`);
console.log(`  docs/research/banque-items-pilote.md`);
