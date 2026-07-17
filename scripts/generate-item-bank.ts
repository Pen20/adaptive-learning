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
//   docs/research/banque-items-pilote.md     (reviewable document, in French)

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
const TIER_LABELS_FR: Record<DifficultyTier, string> = {
  easy: "facile",
  medium: "moyen",
  hard: "difficile",
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
  lines.push(`# Banque d'items pilotes — Quiz pré/post de l'étude`);
  lines.push("");
  lines.push(`**Générée le :** 2026-07-18 · **Script :** \`scripts/generate-item-bank.ts\` · **Seed :** ${BASE_SEED} (reproductible)`);
  lines.push("");
  lines.push(`## Objet`);
  lines.push("");
  lines.push(`Formes fixes destinées au **pilotage de l'instrument de mesure** (protocole §5.1, docs/research/protocole-etude-quiz.md) auprès de 10–15 étudiants hors étude. Chaque sujet a deux versions isomorphes — **Version A** (pré-test) et **Version B** (post-test) — mêmes squelettes de problèmes, mêmes proportions de difficulté (2 faciles, 2 moyens, 2 difficiles), paramètres numériques différents. Chaque item a été validé automatiquement : la vérité terrain est calculée par le CAS direct (déterministe, sans LLM) et la solution officielle du générateur est notée correcte par le correcteur d'équivalence.`);
  lines.push("");
  lines.push(`## Administration du pilote`);
  lines.push("");
  lines.push(`- 6 items par sujet, **15 minutes**, réponse finale uniquement, une tentative par item, sans feedback ni indice.`);
  lines.push(`- Tous les pilotes reçoivent **les mêmes items** (c'est la condition du calcul des indices psychométriques).`);
  lines.push(`- Correction avec la clé de réponse ci-dessous (équivalences acceptées : notation d'ensemble, fractions équivalentes, formes symboliquement égales — mêmes règles que \`checkEquivalenceDirect\`).`);
  lines.push("");
  lines.push(`## Critères de rétention des items (§5.1)`);
  lines.push("");
  lines.push(`- **Indice de difficulté** p (proportion de réussite) visé : **0,40 – 0,70**.`);
  lines.push(`- **Indice de discrimination** D (méthode des groupes extrêmes 27 % ou corrélation point-bisériale) : **> 0,20**.`);
  lines.push(`- Item hors cibles → régénérer un remplaçant du même palier avec le script (changer BASE_SEED) et re-piloter si possible.`);
  lines.push("");

  for (const topic of STUDY_TOPICS) {
    lines.push(`---`);
    lines.push("");
    lines.push(`# Sujet : ${topic.title} (\`${topic.slug}\`)`);
    for (const version of VERSIONS) {
      lines.push("");
      lines.push(`## Version ${version} ${version === "A" ? "(pré-test)" : "(post-test)"}`);
      const versionItems = items.filter((i) => i.topic === topic.slug && i.version === version);
      for (const item of versionItems) {
        lines.push("");
        lines.push(`### ${item.id} — ${TIER_LABELS_FR[item.tier]}`);
        lines.push("");
        lines.push(item.statement);
        if (item.prompt) {
          lines.push("");
          lines.push(`*Consigne :* ${item.prompt}`);
        }
        lines.push("");
        lines.push(`*Format de réponse :* ${item.instruction} (ex. \`${item.placeholder}\`)`);
        lines.push("");
        lines.push(`**Réponse attendue (clé CAS) :** \`${item.groundTruth}\``);
        lines.push("");
        lines.push(`**Solution officielle :** ${item.officialSolution}`);
      }
    }
    lines.push("");
    lines.push(`## Clé de réponse — ${topic.title}`);
    lines.push("");
    lines.push(`| Item | Palier | Clé CAS |`);
    lines.push(`|---|---|---|`);
    for (const item of items.filter((i) => i.topic === topic.slug)) {
      lines.push(`| ${item.id} | ${TIER_LABELS_FR[item.tier]} | \`${item.groundTruth}\` |`);
    }
    lines.push("");
  }

  lines.push(`---`);
  lines.push("");
  lines.push(`## Feuille de calcul des indices (à remplir après le pilote)`);
  lines.push("");
  lines.push(`| Item | n réponses | n correctes | p | D | Verdict (garder / remplacer) |`);
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
