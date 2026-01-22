import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Clerk ID
    firstName: v.string(),
    surname: v.string(),
    email: v.string(),
    birthDay: v.string(),
    institutionName: v.string(),
    // Temporary field to support migration logic
    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
    // New unified field for unique or multiple roles
    roles: v.optional(v.array(v.string())), 
  }).index("by_userId", ["userId"]),

  topicPermissions: defineTable({
    courseName: v.string(),
    topicName: v.string(),
    allowHints: v.boolean(),
    allowSolution: v.boolean(),
    allowDetailedSolution: v.boolean(),
    allowPractice: v.boolean(),
  }).index("by_course_topic", ["courseName", "topicName"]),

  exams: defineTable({
    title: v.string(),
    courseName: v.union(v.literal("Linear Algebra"), v.literal("Differential Calculus")),
    topics: v.array(v.string()), // topicIds
    questionCount: v.number(),
    startDate: v.number(), // timestamp
    endDate: v.number(),   // timestamp
    isActive: v.boolean(),
    feedbackMode: v.union(v.literal("immediate"), v.literal("on_close")),
    resultsReleased: v.optional(v.boolean()),
  }).index("by_course_active", ["courseName", "isActive"]),

  examSubmissions: defineTable({
    examId: v.id("exams"),
    userId: v.string(),
    answers: v.optional(v.string()), // JSON string map of question index -> answer/reasoning
    score: v.optional(v.number()),
    results: v.optional(v.string()), // JSON string map of question index -> boolean (isCorrect)
    questions: v.optional(v.string()), // JSON string snapshot of generated questions
    status: v.optional(v.union(v.literal("in_progress"), v.literal("submitted"))),
    totalQuestions: v.number(),
    submittedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
  }).index("by_exam_user", ["examId", "userId"]),

  submissions: defineTable({
    userId: v.string(),
    courseName: v.union(v.literal("Linear Algebra"), v.literal("Differential Calculus")),
    topicName: v.string(),
    problemStatement: v.string(),
    finalAnswer: v.string(),
    reasoningSteps: v.string(),
    grade: v.number(), 
    aiFeedback: v.string(),
    usedHints: v.boolean(),
  }).index("by_user_topic", ["userId", "topicName"]),

  studentMastery: defineTable({
    userId: v.string(),
    topicName: v.string(),
    masteryScore: v.number(), 
    lastAttempt: v.number(),
  }).index("by_user_mastery", ["userId", "masteryScore"]),

  feedback: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    type: v.string(),
    message: v.string(),
    submittedAt: v.number(),
    institution: v.optional(v.string()),
    gender: v.optional(v.string()),
    profession: v.optional(v.string()),
  }),

});
