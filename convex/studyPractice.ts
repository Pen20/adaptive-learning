import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { findActiveAssignment } from "./experiment";

// Practice sessions during the quiz study (protocol §5.2):
// - unlocked only after the pre-quiz is submitted; completing the session
//   unlocks the post-quiz (enforced in convex/studyQuiz.ts)
// - 30 minutes per topic, minimum 6 submissions for a valid session
// - fixed difficulty script and the 20 s feedback-reading gate live in the
//   frontend (src/app/study/practice/); hints/solutions/adaptive practice are
//   disabled server-side in permissions.ts and recommendations.ts

export const PRACTICE_TIME_LIMIT_MS = 30 * 60_000;
export const PRACTICE_MIN_SUBMISSIONS = 6;
const GRACE_MS = 60_000;

async function findSession(ctx: QueryCtx | MutationCtx, userId: string, topicName: string) {
  return await ctx.db
    .query("studyPracticeSessions")
    .withIndex("by_user_topic", (q) => q.eq("userId", userId).eq("topicName", topicName))
    .first();
}

// Used by studyQuiz.startQuizAttempt to gate the post-quiz.
export const findSessionForUser = internalQuery({
  args: { userId: v.string(), topicName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyPracticeSessions")
      .withIndex("by_user_topic", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName),
      )
      .first();
  },
});

// State of the practice session for the signed-in participant. Never exposes
// the experiment condition.
export const getMyPracticeState = query({
  args: { topicName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "not_enrolled" as const };

    const assignment = await findActiveAssignment(ctx, identity.subject, args.topicName);
    if (!assignment) return { status: "not_enrolled" as const };

    const preQuiz = await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_user_topic_type", (q) =>
        q.eq("userId", identity.subject).eq("topicName", args.topicName).eq("quizType", "pre"),
      )
      .first();
    if (!preQuiz || preQuiz.status !== "submitted") {
      return { status: "locked_pre" as const };
    }

    const session = await ctx.db
      .query("studyPracticeSessions")
      .withIndex("by_user_topic", (q) =>
        q.eq("userId", identity.subject).eq("topicName", args.topicName),
      )
      .first();
    if (!session) return { status: "not_started" as const };

    return {
      status: session.status,
      sessionId: session._id,
      submissionCount: session.submissionCount,
      startedAt: session.startedAt,
      timeLimitMs: session.timeLimitMs,
      minSubmissions: PRACTICE_MIN_SUBMISSIONS,
    };
  },
});

// Starts (or resumes) the practice session. Requires an active assignment and
// a submitted pre-quiz, so the protocol order pre → practice → post holds.
export const startPracticeSession = mutation({
  args: { topicName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const assignment = await findActiveAssignment(ctx, identity.subject, args.topicName);
    if (!assignment) {
      throw new Error("You are not enrolled in the study for this topic, or the study is not active.");
    }

    const preQuiz = await ctx.db
      .query("studyQuizAttempts")
      .withIndex("by_user_topic_type", (q) =>
        q.eq("userId", identity.subject).eq("topicName", args.topicName).eq("quizType", "pre"),
      )
      .first();
    if (!preQuiz || preQuiz.status !== "submitted") {
      throw new Error("Please complete the pre-quiz for this topic first.");
    }

    const existing = await findSession(ctx, identity.subject, args.topicName);
    if (existing) {
      if (existing.status === "completed") {
        throw new Error("You have already completed the practice session for this topic.");
      }
      return {
        sessionId: existing._id,
        submissionCount: existing.submissionCount,
        startedAt: existing.startedAt,
        timeLimitMs: existing.timeLimitMs,
        resumed: true,
      };
    }

    const sessionId = await ctx.db.insert("studyPracticeSessions", {
      userId: identity.subject,
      participantCode: assignment.participantCode,
      phase: assignment.phase,
      topicName: args.topicName,
      status: "in_progress",
      submissionCount: 0,
      startedAt: Date.now(),
      timeLimitMs: PRACTICE_TIME_LIMIT_MS,
    });
    const created = await ctx.db.get(sessionId);
    return {
      sessionId,
      submissionCount: 0,
      startedAt: created?.startedAt ?? Date.now(),
      timeLimitMs: PRACTICE_TIME_LIMIT_MS,
      resumed: false,
    };
  },
});

// Counts a graded submission toward the session. Verifies the submission really
// belongs to this user/topic so the count cannot be inflated.
export const recordPracticeSubmission = mutation({
  args: {
    sessionId: v.id("studyPracticeSessions"),
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) throw new Error("Session not found");
    if (session.status !== "in_progress") return { submissionCount: session?.submissionCount ?? 0 };

    const submission = await ctx.db.get(args.submissionId);
    if (
      !submission ||
      submission.userId !== identity.subject ||
      submission.topicName !== session.topicName ||
      submission._creationTime < session.startedAt
    ) {
      throw new Error("Submission does not belong to this practice session");
    }

    const submissionCount = session.submissionCount + 1;
    await ctx.db.patch(args.sessionId, { submissionCount });
    return { submissionCount };
  },
});

// Completes the session. Allowed when the minimum submission count is reached,
// or when time has expired (then flagged underMinimum for the analysis-stage
// exclusion rule §9.4 — participants are never blocked by the rule itself).
export const completePracticeSession = mutation({
  args: { sessionId: v.id("studyPracticeSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) throw new Error("Session not found");
    if (session.status === "completed") return { completed: true };

    const now = Date.now();
    const timeExpired = now > session.startedAt + session.timeLimitMs + GRACE_MS;
    const underMinimum = session.submissionCount < PRACTICE_MIN_SUBMISSIONS;
    if (underMinimum && !timeExpired) {
      throw new Error(
        `Please submit at least ${PRACTICE_MIN_SUBMISSIONS} problems before finishing (currently ${session.submissionCount}).`,
      );
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      completedAt: now,
      underMinimum: underMinimum || undefined,
    });
    return { completed: true };
  },
});

// ─── Anonymized export (CLI only) ──────────────────────────────────────────────
//   npx convex run studyPractice:exportPracticeSessions '{"phase": 2}'

export const exportPracticeSessions = internalQuery({
  args: { phase: v.number() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("studyPracticeSessions")
      .withIndex("by_phase", (q) => q.eq("phase", args.phase))
      .collect();
    return sessions.map((s) => ({
      participantCode: s.participantCode,
      phase: s.phase,
      topicName: s.topicName,
      status: s.status,
      submissionCount: s.submissionCount,
      startedAt: s.startedAt,
      completedAt: s.completedAt ?? null,
      timeLimitMs: s.timeLimitMs,
      underMinimum: s.underMinimum ?? false,
    }));
  },
});
