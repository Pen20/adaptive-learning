import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Quiz study infrastructure — see docs/research/protocole-etude-quiz.md §7.4.
//
// While a phase is active (experimentConfig.activePhase), enrolled participants
// get their feedback condition forced by gradingPipeline.gradeAndSaveSubmission,
// few-shot pools are read from frozen snapshots, and every grading event is
// logged with all Best-of-N candidates.
//
// All researcher-facing operations are internal functions: they are never
// exposed to browser clients and are run from the CLI or the Convex dashboard:
//   npx convex run experiment:setActivePhase '{"phase": 1}'
//   npx convex run experiment:enrollParticipant '{"userId": "...", "phase": 1, "topics": ["...", "..."]}'
//   npx convex run experiment:freezePoolsForPhase '{"phase": 1, "topics": ["...", "..."]}'

// Bump whenever any grading/judge prompt text changes. Logged on every grading
// event so analysis can detect (and exclude) mid-phase prompt drift.
export const PROMPT_VERSION = "2026-07-16-v1";

// Grading model forced server-side for all enrolled participants (protocol §10:
// model version fixed during each phase — the client's model picker is ignored).
export const STUDY_MODEL = "gpt-4o";

export type ExperimentCondition = "single_pass" | "best_of_n" | "best_of_n_outcome";

// Phase 1 (bootstrap) runs two arms on two topics; phase 2 runs all three arms.
const CONDITIONS_BY_PHASE: Record<number, ExperimentCondition[]> = {
  1: ["single_pass", "best_of_n"],
  2: ["single_pass", "best_of_n", "best_of_n_outcome"],
};

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

async function getConfig(ctx: QueryCtx | MutationCtx) {
  return await ctx.db.query("experimentConfig").first();
}

// Shared lookup: the user's assignment for this topic, but only while its phase
// is active. Used by the grading pipeline, permissions, recommendations, and
// the practice/quiz modules so "in the study" means the same thing everywhere.
export async function findActiveAssignment(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  topicName: string,
) {
  const config = await getConfig(ctx);
  if (!config || config.activePhase === null) return null;

  const assignment = await ctx.db
    .query("experimentAssignments")
    .withIndex("by_user_topic", (q) => q.eq("userId", userId).eq("topicName", topicName))
    .filter((q) => q.eq(q.field("phase"), config.activePhase))
    .first();
  return assignment ?? null;
}

// ─── Phase control ─────────────────────────────────────────────────────────────

export const setActivePhase = internalMutation({
  args: { phase: v.union(v.number(), v.null()) },
  handler: async (ctx, args) => {
    if (args.phase !== null && !CONDITIONS_BY_PHASE[args.phase]) {
      throw new Error(`Unknown phase: ${args.phase}. Valid phases: 1, 2.`);
    }
    const existing = await getConfig(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, {
        activePhase: args.phase,
        updatedAt: Date.now(),
        updatedBy: "cli",
      });
    } else {
      await ctx.db.insert("experimentConfig", {
        activePhase: args.phase,
        updatedAt: Date.now(),
        updatedBy: "cli",
      });
    }
    return { activePhase: args.phase };
  },
});

export const getExperimentStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const config = await getConfig(ctx);
    const activePhase = config?.activePhase ?? null;
    let enrolledParticipants = 0;
    if (activePhase !== null) {
      const rows = await ctx.db
        .query("experimentAssignments")
        .withIndex("by_phase", (q) => q.eq("phase", activePhase))
        .collect();
      enrolledParticipants = new Set(rows.map((r) => r.participantCode)).size;
    }
    return { activePhase, enrolledParticipants, promptVersion: PROMPT_VERSION };
  },
});

// ─── Enrollment ────────────────────────────────────────────────────────────────

// Enrolls one participant: assigns each study topic a condition using a Latin
// square over the phase's conditions. If latinSquareRow is omitted, rows are
// cycled in enrollment order so the design stays balanced automatically.
export const enrollParticipant = internalMutation({
  args: {
    userId: v.string(),
    phase: v.number(),
    topics: v.array(v.string()),
    latinSquareRow: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conditions = CONDITIONS_BY_PHASE[args.phase];
    if (!conditions) throw new Error(`Unknown phase: ${args.phase}`);
    if (args.topics.length !== conditions.length) {
      throw new Error(
        `Phase ${args.phase} requires exactly ${conditions.length} topics (one per condition), got ${args.topics.length}.`,
      );
    }

    const participant = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!participant) throw new Error(`No user found for userId ${args.userId}`);

    const existing = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    if (existing.some((a) => a.phase === args.phase)) {
      throw new Error(`User ${args.userId} is already enrolled in phase ${args.phase}`);
    }
    // Protocol §4: phase 1 participants are excluded from phase 2.
    if (args.phase === 2 && existing.some((a) => a.phase === 1)) {
      throw new Error(`User ${args.userId} participated in phase 1 and cannot join phase 2`);
    }

    const phaseRows = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_phase", (q) => q.eq("phase", args.phase))
      .collect();
    const enrolledCount = new Set(phaseRows.map((r) => r.participantCode)).size;

    const perms = permutations(conditions);
    const row = (args.latinSquareRow ?? enrolledCount) % perms.length;
    const conditionOrder = perms[row];
    const participantCode = `P${args.phase}-${String(enrolledCount + 1).padStart(3, "0")}`;
    const now = Date.now();

    const assignments = args.topics.map((topicName, i) => ({
      topicName,
      condition: conditionOrder[i],
      topicOrder: i,
    }));
    for (const a of assignments) {
      await ctx.db.insert("experimentAssignments", {
        userId: args.userId,
        participantCode,
        phase: args.phase,
        topicName: a.topicName,
        condition: a.condition,
        latinSquareRow: row,
        topicOrder: a.topicOrder,
        enrolledAt: now,
      });
    }

    return { participantCode, latinSquareRow: row, assignments };
  },
});

// Called by gradingPipeline on every submission. Returns the assignment only
// when its phase is currently active, so the platform behaves normally for
// everyone (and every topic) outside the study.
export const getActiveAssignment = internalQuery({
  args: { userId: v.string(), topicName: v.string() },
  handler: async (ctx, args) => {
    const assignment = await findActiveAssignment(ctx, args.userId, args.topicName);
    if (!assignment) return null;

    return {
      condition: assignment.condition,
      phase: assignment.phase,
      participantCode: assignment.participantCode,
    };
  },
});

// ─── Pool freezing ─────────────────────────────────────────────────────────────

// Snapshots both few-shot pools (approved expert corrections + outcome-validated
// feedback) for each study topic. Run once at phase start, before activating the
// phase. Re-running replaces the snapshot (only do this before enrollment).
export const freezePoolsForPhase = internalMutation({
  args: { phase: v.number(), topics: v.array(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const summary: Array<{ topicName: string; expertCorrections: number; outcomeValidated: number }> = [];

    for (const topicName of args.topics) {
      const corrections = await ctx.db
        .query("humanCorrections")
        .withIndex("by_topic_status", (q) => q.eq("topicName", topicName).eq("status", "approved"))
        .order("desc")
        .take(2);
      const correctionEntries = corrections.map((c) => ({
        correctedFeedback: c.correctedFeedback,
        correctedGrade: c.correctedGrade,
      }));

      const highReward = await ctx.db
        .query("submissions")
        .withIndex("by_topic_outcome", (q) => q.eq("topicName", topicName).gte("outcomeReward", 5))
        .order("desc")
        .take(5);
      const outcomeEntries = highReward.map((s) => ({
        aiFeedback: s.aiFeedback,
        judgeFeedback: s.judgeFeedback,
        outcomeReward: s.outcomeReward,
        grade: s.grade,
      }));

      const pools = [
        { poolType: "expertCorrections" as const, entries: correctionEntries },
        { poolType: "outcomeValidated" as const, entries: outcomeEntries },
      ];
      for (const pool of pools) {
        const existing = await ctx.db
          .query("experimentPoolSnapshots")
          .withIndex("by_phase_pool_topic", (q) =>
            q.eq("phase", args.phase).eq("poolType", pool.poolType).eq("topicName", topicName),
          )
          .first();
        if (existing) await ctx.db.delete(existing._id);
        await ctx.db.insert("experimentPoolSnapshots", {
          phase: args.phase,
          poolType: pool.poolType,
          topicName,
          entriesJson: JSON.stringify(pool.entries),
          frozenAt: now,
        });
      }

      summary.push({
        topicName,
        expertCorrections: correctionEntries.length,
        outcomeValidated: outcomeEntries.length,
      });
    }

    return { phase: args.phase, frozenAt: now, summary };
  },
});

// Read a frozen pool. Returns the parsed entries (shape-compatible with the live
// queries in corrections.ts / submissions.ts) or an empty array if never frozen —
// an unfrozen pool must not silently fall back to live data mid-study.
export const getFrozenPool = internalQuery({
  args: {
    phase: v.number(),
    poolType: v.union(v.literal("expertCorrections"), v.literal("outcomeValidated")),
    topicName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("experimentPoolSnapshots")
      .withIndex("by_phase_pool_topic", (q) =>
        q.eq("phase", args.phase).eq("poolType", args.poolType).eq("topicName", args.topicName),
      )
      .first();
    if (!snapshot) return [];
    const entries = JSON.parse(snapshot.entriesJson) as unknown[];
    return args.limit !== undefined ? entries.slice(0, args.limit) : entries;
  },
});

// ─── Grading event log ─────────────────────────────────────────────────────────

export const logGradingEvent = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    userId: v.string(),
    participantCode: v.string(),
    phase: v.number(),
    topicName: v.string(),
    condition: v.string(),
    model: v.string(),
    gradingLatencyMs: v.number(),
    candidatesJson: v.string(),
    selectedIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("experimentGradingLogs", {
      ...args,
      promptVersion: PROMPT_VERSION,
      createdAt: Date.now(),
    });
  },
});

// ─── Anonymized export ─────────────────────────────────────────────────────────
//
// Run from the CLI (never exposed to clients):
//   npx convex run experiment:exportSubmissions '{"phase": 2}'
//   npx convex run experiment:exportGradingLogs '{"phase": 2}'
// Participants are identified only by participantCode; Clerk userIds are dropped.

export const exportSubmissions = internalQuery({
  args: { phase: v.number() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_phase", (q) => q.eq("phase", args.phase))
      .collect();

    const rows = [];
    for (const a of assignments) {
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_user_topic", (q) =>
          q.eq("userId", a.userId).eq("topicName", a.topicName),
        )
        .collect();
      for (const s of submissions) {
        if (s.experimentPhase !== args.phase) continue;
        rows.push({
          participantCode: a.participantCode,
          phase: a.phase,
          topicName: a.topicName,
          condition: a.condition,
          latinSquareRow: a.latinSquareRow,
          topicOrder: a.topicOrder,
          submissionId: s._id,
          submittedAt: s._creationTime,
          problemStatement: s.problemStatement,
          finalAnswer: s.finalAnswer,
          reasoningSteps: s.reasoningSteps,
          grade: s.grade,
          errorType: s.errorType ?? null,
          aiFeedback: s.aiFeedback,
          judgeFeedback: s.judgeFeedback ?? null,
          isJudgeModified: s.isJudgeModified ?? null,
          judgeConfidence: s.judgeConfidence ?? null,
          usedHints: s.usedHints,
          masteryBefore: s.masteryBefore ?? null,
          outcomeReward: s.outcomeReward ?? null,
        });
      }
    }
    return rows;
  },
});

export const exportGradingLogs = internalQuery({
  args: { phase: v.number() },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("experimentGradingLogs")
      .withIndex("by_phase", (q) => q.eq("phase", args.phase))
      .collect();
    return logs.map(({ userId, ...log }) => {
      void userId;
      return log;
    });
  },
});
