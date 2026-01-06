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
  }).index("by_userId", ["userId"]),

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
  }),
});
