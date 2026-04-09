import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createExam = mutation({
  args: {
    title: v.string(),
    courseName: v.union(v.literal("Linear Algebra"), v.literal("Differential Calculus")),
    topics: v.array(v.string()),
    questionCount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    feedbackMode: v.union(v.literal("immediate"), v.literal("on_close")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Check admin role
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    if (!user.roles?.includes("admin") && user.role !== "admin") throw new Error("Admin access required");

    await ctx.db.insert("exams", args);
  },
});

export const getActiveExams = query({
  args: {},
  handler: async (ctx) => {
    // Return all active exams that are currently within the date window
    const now = Date.now();
    const exams = await ctx.db.query("exams").filter(q => q.eq(q.field("isActive"), true)).collect();
    
    // Filter by date implementation in JS since Convex filter limitations might make range queries complex depending on indexes
    return exams.filter(e => e.startDate <= now && e.endDate >= now);
  },
});

export const getStudentExams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { available: [], submitted: [] }; // or throw

    const now = Date.now();
    
    // 1. Get all exams (we need even inactive ones if the user submitted them to show results)
    const allExams = await ctx.db.query("exams").collect();
    
    // 2. Get user submissions
    // We need to look up by user ID. The identity.subject is the Clerk ID.
    // In schema, users table has `userId: identity.subject`.
    // And examSubmissions has `userId` matching that.
    
    const submissions = await ctx.db.query("examSubmissions")
        .filter(q => q.eq(q.field("userId"), identity.subject))
        .collect();

    const submissionMap = new Map();
    submissions.forEach(s => submissionMap.set(s.examId, s));

    const available = [];
    const submitted = [];

    for (const exam of allExams) {
        const sub = submissionMap.get(exam._id);
        
        if (sub) {
            // Already submitted
            submitted.push({
                ...exam,
                score: sub.score,
                submissionStatus: sub.status,
                resultsReleased: exam.resultsReleased // ensure this is passed
            });
        } else {
            // Not submitted. Is it valid?
            if (exam.isActive && exam.startDate <= now && exam.endDate >= now) {
                available.push(exam);
            }
        }
    }

    // Sort by date
    available.sort((a, b) => a.endDate - b.endDate);
    submitted.sort((a, b) => b.endDate - a.endDate);

    return { available, submitted };
  }
});


export const getAllExams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Check admin role
    const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first();

    if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) {
        return null;
    }

    return await ctx.db.query("exams").order("desc").collect();
  },
});

export const toggleExamStatus = mutation({
  args: { examId: v.id("exams"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first();

    if (!user) throw new Error("User not found");
    if (!user.roles?.includes("admin") && user.role !== "admin") throw new Error("Admin access required");

    await ctx.db.patch(args.examId, { isActive: args.isActive });
  },
});

export const getExam = query({
    args: { examId: v.id("exams") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.examId);
    }
});

export const createExamSubmission = mutation({
    args: {
        examId: v.id("exams"),
        userId: v.string(),
        questions: v.string(), // JSON string
        totalQuestions: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        if (identity.subject !== args.userId) throw new Error("Unauthorized");

        // Check if already exists to prevent overwrite
        const existing = await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId).eq("userId", args.userId))
            .first();
        
        if (existing) return existing._id; // Existing session

        return await ctx.db.insert("examSubmissions", {
             examId: args.examId,
             userId: args.userId,
             questions: args.questions,
             totalQuestions: args.totalQuestions,
             status: "in_progress",
             startedAt: Date.now(),
         });
    }
});

export const saveExamAnswers = mutation({
    args: {
        examId: v.id("exams"),
        userId: v.string(),
        answers: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        if (identity.subject !== args.userId) throw new Error("Unauthorized");

        const existing = await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId).eq("userId", args.userId))
            .first();

        if (existing && existing.status !== "submitted") {
            await ctx.db.patch(existing._id, { answers: args.answers });
        }
    }
});

export const submitExam = mutation({
    args: {
        examId: v.id("exams"),
        userId: v.string(),
        answers: v.string(), // JSON string
        score: v.number(),
        totalQuestions: v.optional(v.number()),
        results: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        if (identity.subject !== args.userId) throw new Error("Unauthorized");

         const existing = await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId).eq("userId", args.userId))
            .first();

         if (!existing) throw new Error("No active exam session found");

         await ctx.db.patch(existing._id, {
             answers: args.answers,
             score: args.score,
             status: "submitted",
             submittedAt: Date.now(),
             results: args.results,
         });
    }
});

export const deleteExam = mutation({
    args: { examId: v.id("exams") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .first();

        if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) throw new Error("Admin access required");

        await ctx.db.delete(args.examId);
        
        // Optional: Clean up submissions?
        // For data integrity, maybe keep or delete.
        // Let's cascade delete for now or leave them orphaned.
        // Better to cascade delete to keep DB clean.
        const submissions = await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId))
            .collect();
            
        for (const sub of submissions) {
            await ctx.db.delete(sub._id);
        }
    }
});

export const releaseExamResults = mutation({
    args: { examId: v.id("exams") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        
        // Admin Check
        const user = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");
        if (!user.roles?.includes("admin") && user.role !== "admin") throw new Error("Admin access required");

        const exam = await ctx.db.get(args.examId);
        if (!exam) throw new Error("Exam not found");

        await ctx.db.patch(args.examId, { resultsReleased: true });
        
        // Trigger Email Notification for all submissions
        const submissions = await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId))
            .collect();

        for (const sub of submissions) {
            if (sub.status === "submitted" && sub.score !== undefined) {
                // Get user email
                // Note: user might be different from sub.userId if looking up by "userId" field vs Clerk ID.
                // Our schema uses 'userId' string which matches Clerk ID.
                // We need to look up the User document to get the email.
                const student = await ctx.db.query("users")
                    .withIndex("by_userId", q => q.eq("userId", sub.userId))
                    .first();
                
                if (student?.email) {
                    await ctx.scheduler.runAfter(0, api.email.sendResultEmail, {
                        email: student.email,
                        examTitle: exam.title,
                        score: sub.score,
                        examId: exam._id
                    });
                }
            }
        }
    }
});

export const getUserSubmission = query({
    args: { examId: v.id("exams"), userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query("examSubmissions")
            .withIndex("by_exam_user", q => q.eq("examId", args.examId).eq("userId", args.userId))
            .first();
    }
});

export const updateExamMarkingSchemes = mutation({
    args: {
        examId: v.id("exams"),
        markingSchemes: v.string(), // JSON: Record<string, MarkingCriterion[]>
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_userId", q => q.eq("userId", identity.subject))
            .first();

        if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) throw new Error("Admin access required");

        const exam = await ctx.db.get(args.examId);
        if (!exam) throw new Error("Exam not found");

        await ctx.db.patch(args.examId, { markingSchemes: args.markingSchemes });
    },
});
