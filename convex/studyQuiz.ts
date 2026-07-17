import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "./cas";
import { classifyDifficulty } from "../src/data/difficultyClassifiers";
import type { DifficultyTier } from "../src/data/difficultyClassifiers";

// Pre/post/delayed quizzes for the quiz study — the measurement instrument
// (docs/research/protocole-etude-quiz.md §5.1).
//
// Grading is fully deterministic: items are only accepted into a quiz when the
// direct CAS path (computeDirectGroundTruth, no LLM fallback) can compute their
// ground truth at start time, and answers are checked with the deterministic
// equivalence checker at submit time. Students never see scores or feedback.

const QUIZ_ITEM_COUNT = 6;
// Fixed tier composition so pre/post quizzes are isomorphic in difficulty mix
// (protocol §5.1). Applied whenever the topic has a difficulty classifier.
const QUIZ_TIER_COMPOSITION: Record<DifficultyTier, number> = { easy: 2, medium: 2, hard: 2 };
const GRACE_MS = 60_000;
const TIME_LIMITS_MS: Record<"pre" | "post" | "delayed", number> = {
  pre: 15 * 60_000,
  post: 15 * 60_000,
  delayed: 10 * 60_000,
};

const quizTypeValidator = v.union(v.literal("pre"), v.literal("post"), v.literal("delayed"));

type QuizQuestion = {
  statement: string;
  prompt?: string;
  placeholder: string;
  instruction: string;
  groundTruth: string;
  expression: string;
};

type QuizQuestionView = {
  statement: string;
  prompt?: string;
  placeholder: string;
  instruction: string;
};

type StartQuizResult = {
  attemptId: Id<"studyQuizAttempts">;
  questions: QuizQuestionView[];
  answersJson: string;
  startedAt: number;
  timeLimitMs: number;
  resumed: boolean;
};

// Client-facing view: never includes groundTruth/expression.
function stripQuestion(q: QuizQuestion): QuizQuestionView {
  return {
    statement: q.statement,
    prompt: q.prompt,
    placeholder: q.placeholder,
    instruction: q.instruction,
  };
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

export const getAttemptById = internalQuery({
  args: { attemptId: v.id("studyQuizAttempts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.attemptId);
  },
});

export const findAttempt = internalQuery({
  args: { userId: v.string(), topicName: v.string(), quizType: quizTypeValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_user_topic_type", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName).eq("quizType", args.quizType),
      )
      .first();
  },
});

export const createAttempt = internalMutation({
  args: {
    userId: v.string(),
    participantCode: v.string(),
    phase: v.number(),
    topicName: v.string(),
    quizType: quizTypeValidator,
    questionsJson: v.string(),
    timeLimitMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Re-check uniqueness inside the mutation so concurrent starts cannot
    // create two attempts.
    const existing = await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_user_topic_type", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName).eq("quizType", args.quizType),
      )
      .first();
    if (existing) throw new Error("Quiz attempt already exists");

    return await ctx.db.insert("studyQuizAttempts", {
      ...args,
      answersJson: JSON.stringify([]),
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

export const finalizeAttempt = internalMutation({
  args: {
    attemptId: v.id("studyQuizAttempts"),
    answersJson: v.string(),
    resultsJson: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return; // already submitted (double-click, retry)

    const submittedAt = Date.now();
    await ctx.db.patch(args.attemptId, {
      answersJson: args.answersJson,
      resultsJson: args.resultsJson,
      score: args.score,
      status: "submitted",
      submittedAt,
      overTime: submittedAt > attempt.startedAt + attempt.timeLimitMs + GRACE_MS,
    });
  },
});

// ─── Participant-facing API ────────────────────────────────────────────────────

// Study dashboard for the signed-in participant: their assigned topics (order
// only — NEVER the experiment condition) and quiz progress per topic.
export const getMyStudyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { enrolled: false as const };

    const config = await ctx.db.query("experimentConfig").first();
    const activePhase = config?.activePhase ?? null;
    if (activePhase === null) return { enrolled: false as const };

    const assignments = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const active = assignments
      .filter((a) => a.phase === activePhase)
      .sort((a, b) => a.topicOrder - b.topicOrder);
    if (active.length === 0) return { enrolled: false as const };

    const topics = [];
    for (const a of active) {
      const quizzes: Record<string, "not_started" | "in_progress" | "submitted"> = {};
      for (const quizType of ["pre", "post", "delayed"] as const) {
        const attempt = await ctx.db
          .query("studyQuizAttempts")
          .withIndex("by_user_topic_type", (q) =>
            q.eq("userId", identity.subject).eq("topicName", a.topicName).eq("quizType", quizType),
          )
          .first();
        quizzes[quizType] = attempt ? attempt.status === "submitted" ? "submitted" : "in_progress" : "not_started";
      }

      const practiceSession = await ctx.db
        .query("studyPracticeSessions")
        .withIndex("by_user_topic", (q) =>
          q.eq("userId", identity.subject).eq("topicName", a.topicName),
        )
        .first();
      const practice =
        quizzes.pre !== "submitted"
          ? ("locked" as const)
          : practiceSession
            ? practiceSession.status
            : ("not_started" as const);

      topics.push({ topicName: a.topicName, topicOrder: a.topicOrder, quizzes, practice });
    }

    return { enrolled: true as const, phase: activePhase, topics };
  },
});

// State of one quiz for the signed-in participant (used by the quiz page to
// decide between start screen, resume, and completed screen).
export const getMyQuizState = query({
  args: { topicName: v.string(), quizType: quizTypeValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "none" as const };

    const attempt = await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_user_topic_type", (q) =>
        q.eq("userId", identity.subject).eq("topicName", args.topicName).eq("quizType", args.quizType),
      )
      .first();
    if (!attempt) return { status: "none" as const };
    if (attempt.status === "submitted") return { status: "submitted" as const };

    const questions = (JSON.parse(attempt.questionsJson) as QuizQuestion[]).map(stripQuestion);
    return {
      status: "in_progress" as const,
      attemptId: attempt._id,
      questions,
      answersJson: attempt.answersJson,
      startedAt: attempt.startedAt,
      timeLimitMs: attempt.timeLimitMs,
    };
  },
});

// Starts a quiz: the client generates candidate problems from the topic's
// parametric generator; the server keeps the first QUIZ_ITEM_COUNT candidates
// whose ground truth the direct CAS path can compute, and snapshots them with
// their ground truths. Requires an active experiment assignment for this topic.
export const startQuizAttempt = action({
  args: {
    topicName: v.string(),
    quizType: quizTypeValidator,
    candidates: v.array(
      v.object({
        statement: v.string(),
        prompt: v.optional(v.string()),
        placeholder: v.string(),
        instruction: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<StartQuizResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (args.candidates.length > 60) throw new Error("Too many candidates");

    const assignment = (await ctx.runQuery(internal.experiment.getActiveAssignment, {
      userId: identity.subject,
      topicName: args.topicName,
    })) as { condition: string; phase: number; participantCode: string } | null;
    if (!assignment) {
      throw new Error("You are not enrolled in the study for this topic, or the study is not active.");
    }

    // Protocol order: pre-quiz → practice session → post-quiz → delayed quiz.
    if (args.quizType === "post") {
      const practice = (await ctx.runQuery(internal.studyPractice.findSessionForUser, {
        userId: identity.subject,
        topicName: args.topicName,
      })) as Doc<"studyPracticeSessions"> | null;
      if (!practice || practice.status !== "completed") {
        throw new Error("Please complete the practice session for this topic before taking the post-quiz.");
      }
    }
    if (args.quizType === "delayed") {
      const postQuiz = (await ctx.runQuery(internal.studyQuiz.findAttempt, {
        userId: identity.subject,
        topicName: args.topicName,
        quizType: "post",
      })) as Doc<"studyQuizAttempts"> | null;
      if (!postQuiz || postQuiz.status !== "submitted") {
        throw new Error("The follow-up quiz unlocks after you have submitted the post-quiz.");
      }
    }

    const existing = (await ctx.runQuery(internal.studyQuiz.findAttempt, {
      userId: identity.subject,
      topicName: args.topicName,
      quizType: args.quizType,
    })) as Doc<"studyQuizAttempts"> | null;
    if (existing) {
      if (existing.status === "submitted") throw new Error("You have already completed this quiz.");
      // Resume the in-progress attempt instead of creating a new one.
      const questions = (JSON.parse(existing.questionsJson) as QuizQuestion[]).map(stripQuestion);
      return {
        attemptId: existing._id as Id<"studyQuizAttempts">,
        questions,
        answersJson: existing.answersJson,
        startedAt: existing.startedAt,
        timeLimitMs: existing.timeLimitMs,
        resumed: true,
      };
    }

    // Keep only candidates whose ground truth is computable by the direct
    // (deterministic) CAS path; dedupe identical statements. When the topic has
    // a difficulty classifier, enforce the fixed tier composition (2/2/2) so
    // every quiz — pre and post alike — has the same difficulty mix.
    const useTiers = classifyDifficulty(args.topicName, "") !== null;
    const tierRemaining: Record<string, number> = { ...QUIZ_TIER_COMPOSITION };
    const seen = new Set<string>();
    const questions: QuizQuestion[] = [];
    for (const candidate of args.candidates) {
      if (questions.length >= QUIZ_ITEM_COUNT) break;
      if (seen.has(candidate.statement)) continue;
      seen.add(candidate.statement);

      if (useTiers) {
        const tier = classifyDifficulty(args.topicName, candidate.statement);
        if (!tier || tierRemaining[tier] <= 0) continue;
        tierRemaining[tier] -= 1;
      }

      const direct = computeDirectGroundTruth(candidate.statement, args.topicName);
      if (!direct || !direct.isComputable || !direct.groundTruth) {
        if (useTiers) {
          const tier = classifyDifficulty(args.topicName, candidate.statement);
          if (tier) tierRemaining[tier] += 1; // give the slot back
        }
        continue;
      }

      questions.push({
        statement: candidate.statement,
        prompt: candidate.prompt,
        placeholder: candidate.placeholder,
        instruction: candidate.instruction,
        groundTruth: direct.groundTruth,
        expression: direct.expression ?? direct.groundTruth,
      });
    }

    if (questions.length < QUIZ_ITEM_COUNT) {
      throw new Error(
        `Could not build a CAS-gradable quiz for topic "${args.topicName}" (got ${questions.length}/${QUIZ_ITEM_COUNT} items). This topic may not be supported for quizzes.`,
      );
    }
    // Scripted difficulty order for a consistent testing experience: 2 easy,
    // then 2 medium, then 2 hard (stable for topics without a classifier).
    if (useTiers) {
      const tierRank: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
      questions.sort(
        (a, b) =>
          (tierRank[classifyDifficulty(args.topicName, a.statement) ?? "easy"] ?? 0) -
          (tierRank[classifyDifficulty(args.topicName, b.statement) ?? "easy"] ?? 0),
      );
    }

    const timeLimitMs = TIME_LIMITS_MS[args.quizType];
    const attemptId = (await ctx.runMutation(internal.studyQuiz.createAttempt, {
      userId: identity.subject,
      participantCode: assignment.participantCode,
      phase: assignment.phase,
      topicName: args.topicName,
      quizType: args.quizType,
      questionsJson: JSON.stringify(questions),
      timeLimitMs,
    })) as Id<"studyQuizAttempts">;

    const created = (await ctx.runQuery(internal.studyQuiz.getAttemptById, {
      attemptId,
    })) as Doc<"studyQuizAttempts"> | null;
    return {
      attemptId,
      questions: questions.map(stripQuestion),
      answersJson: JSON.stringify([]),
      startedAt: created?.startedAt ?? Date.now(),
      timeLimitMs,
      resumed: false,
    };
  },
});

// Autosave answers while the quiz is running.
export const saveQuizAnswers = mutation({
  args: { attemptId: v.id("studyQuizAttempts"), answersJson: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.userId !== identity.subject) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return;

    const parsed = JSON.parse(args.answersJson);
    if (!Array.isArray(parsed) || parsed.some((a) => typeof a !== "string")) {
      throw new Error("answersJson must be a JSON array of strings");
    }

    await ctx.db.patch(args.attemptId, { answersJson: args.answersJson });
  },
});

// Submits and grades the quiz deterministically. Returns no score and no
// per-item results — the participant only learns that submission succeeded.
export const submitQuizAttempt = action({
  args: { attemptId: v.id("studyQuizAttempts"), answersJson: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const attempt = await ctx.runQuery(internal.studyQuiz.getAttemptById, {
      attemptId: args.attemptId,
    });
    if (!attempt || attempt.userId !== identity.subject) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return { submitted: true };

    const questions = JSON.parse(attempt.questionsJson) as QuizQuestion[];
    const parsedAnswers = JSON.parse(args.answersJson);
    if (!Array.isArray(parsedAnswers) || parsedAnswers.some((a) => typeof a !== "string")) {
      throw new Error("answersJson must be a JSON array of strings");
    }
    const answers = questions.map((_, i) => (parsedAnswers[i] ?? "").trim());

    const results = questions.map((question, i) => {
      if (!answers[i]) return { isCorrect: false, casChecked: true };
      const check = checkEquivalenceDirect(answers[i], question.groundTruth);
      // An unparseable answer counts as incorrect (pre-specified in the
      // protocol); casChecked=false marks it for transparency in the export.
      return { isCorrect: check.isEquivalent === true, casChecked: check.casChecked };
    });

    const score = results.filter((r) => r.isCorrect).length;
    await ctx.runMutation(internal.studyQuiz.finalizeAttempt, {
      attemptId: args.attemptId,
      answersJson: JSON.stringify(answers),
      resultsJson: JSON.stringify(results),
      score,
    });

    return { submitted: true };
  },
});

// ─── Anonymized export (CLI only) ──────────────────────────────────────────────
//   npx convex run studyQuiz:exportQuizAttempts '{"phase": 2}'

export const exportQuizAttempts = internalQuery({
  args: { phase: v.number() },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_phase", (q) => q.eq("phase", args.phase))
      .collect();
    return attempts.map((a) => ({
      participantCode: a.participantCode,
      phase: a.phase,
      topicName: a.topicName,
      quizType: a.quizType,
      questionsJson: a.questionsJson,
      answersJson: a.answersJson,
      resultsJson: a.resultsJson ?? null,
      score: a.score ?? null,
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt ?? null,
      timeLimitMs: a.timeLimitMs,
      overTime: a.overTime ?? null,
    }));
  },
});
