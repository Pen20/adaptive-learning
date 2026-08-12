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
    lastActive: v.optional(v.number()), // timestamp for online status
    themePreference: v.optional(v.string()), // e.g. "midnight", "slate", "ocean"
  }).index("by_userId", ["userId"]),

  topicPermissions: defineTable({
    courseName: v.string(),
    topicName: v.string(),
    allowHints: v.boolean(),
    allowSolution: v.boolean(),
    allowDetailedSolution: v.boolean(),
    allowPractice: v.boolean(),
    allowRLHF: v.optional(v.boolean()),
    alwaysShowSolution: v.optional(v.boolean()),
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
    // JSON: Record<string, MarkingCriterion[]>
    // key = question slot index (e.g. "0", "1"); absent key = binary grading
    markingSchemes: v.optional(v.string()),
  }).index("by_course_active", ["courseName", "isActive"])
    .index("by_active_end", ["isActive", "endDate"]),

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
  }).index("by_exam_user", ["examId", "userId"])
    .index("by_user", ["userId"]),

  submissions: defineTable({
    userId: v.string(),
    courseName: v.union(v.literal("Linear Algebra"), v.literal("Differential Calculus")),
    topicName: v.string(),
    problemStatement: v.string(),
    finalAnswer: v.string(),
    reasoningSteps: v.string(),
    grade: v.number(),
    aiFeedback: v.string(),
    judgeFeedback: v.optional(v.string()),
    isJudgeModified: v.optional(v.boolean()),
    judgeConfidence: v.optional(v.number()),
    errorType: v.optional(v.string()),
    usedHints: v.boolean(),
    judgeStatus: v.optional(v.union(v.literal("pending"), v.literal("complete"))),
    // Approach 4 — Outcome-Based Reward Model fields
    masteryBefore: v.optional(v.number()),  // mastery snapshot before this submission updates it
    outcomeReward: v.optional(v.number()),  // Δ = masteryAfter − masteryBefore, written on next submission
    // Quiz study — set when the user has an active experiment assignment for this topic
    experimentCondition: v.optional(v.string()), // "single_pass" | "best_of_n" | "best_of_n_outcome"
    experimentPhase: v.optional(v.number()),
  }).index("by_user_topic", ["userId", "topicName"])
    .index("by_user", ["userId"])
    .index("by_user_topic_grade", ["userId", "topicName", "grade"])
    .index("by_topic_outcome", ["topicName", "outcomeReward"]),

  studentTopicStats: defineTable({
    userId: v.string(),
    topicName: v.string(),
    total: v.number(),
    correct: v.number(),
    lastAttempt: v.number(),
  }).index("by_user_topic", ["userId", "topicName"])
    .index("by_user_lastAttempt", ["userId", "lastAttempt"]),

  studentMastery: defineTable({
    userId: v.string(),
    topicName: v.string(),
    masteryScore: v.number(), 
    lastAttempt: v.number(),
  }).index("by_user_mastery", ["userId", "topicName"]),

  studentLearningProfile: defineTable({
    userId: v.string(),
    topicName: v.string(),
    conceptTag: v.string(),
    masteryScore: v.number(),
    misconceptionCount: v.number(),
    techniqueCount: v.number(),
    lastTechnique: v.optional(v.string()),
    lastMisconception: v.optional(v.string()),
    recommendedNextTask: v.optional(v.string()),
    lastSeen: v.number(),
  }).index("by_user_topic_concept", ["userId", "topicName", "conceptTag"])
    .index("by_user_topic", ["userId", "topicName"])
    .index("by_user_lastSeen", ["userId", "lastSeen"]),

  submissionDiagnostics: defineTable({
    submissionId: v.id("submissions"),
    userId: v.string(),
    topicName: v.string(),
    casLayer: v.string(), // JSON string
    aiLayer: v.string(), // JSON string
    didacticLayer: v.string(), // JSON string
    techniqueUsed: v.optional(v.string()),
    misconception: v.optional(v.string()),
    conceptTags: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_submission", ["submissionId"])
    .index("by_user_topic", ["userId", "topicName"]),

  remediationSessions: defineTable({
    userId: v.string(),
    submissionId: v.id("submissions"),
    topicName: v.string(),
    ficheId: v.string(),
    ficheVersion: v.string(),
    taskTypeId: v.string(),
    techniqueId: v.string(),
    misconceptionId: v.optional(v.string()),
    misconceptionLabel: v.optional(v.string()),
    activitiesJson: v.string(),
    responsesJson: v.string(),
    currentActivityIndex: v.number(),
    successfulChecks: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("completed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user_submission", ["userId", "submissionId"])
    .index("by_user_status", ["userId", "status"]),

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

  humanCorrections: defineTable({
    submissionId: v.id("submissions"),
    correctedGrade: v.number(), // 0, 0.5, or 1
    correctedFeedback: v.string(),
    topicName: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdBy: v.string(), // Clerk ID
    createdAt: v.number(),
  }).index("by_topic_status", ["topicName", "status"])
    .index("by_status", ["status"]),

  phase1Evaluations: defineTable({
    submissionId: v.id("submissions"),
    topicName: v.string(),
    problemStatement: v.string(),
    studentAnswer: v.string(),
    studentReasoning: v.string(),
    originalGrade: v.number(),
    // Single-pass pipeline results
    spGrade: v.number(),
    spJudgeConfidence: v.number(),
    spIsJudgeModified: v.boolean(),
    spErrorType: v.string(),
    spFeedback: v.string(),
    // Best-of-N pipeline results
    bonGrade: v.number(),
    bonJudgeConfidence: v.number(),
    bonIsJudgeModified: v.boolean(),
    bonSelectedIndex: v.number(),
    bonAllConfidences: v.array(v.number()),
    bonErrorType: v.string(),
    bonFeedback: v.string(),
    // CAS ground truth
    casIsComputable: v.boolean(),
    casGroundTruth: v.optional(v.string()),
    casSpAgrees: v.optional(v.boolean()),
    casBonAgrees: v.optional(v.boolean()),
    // Derived
    gradesAgree: v.boolean(),
    confidenceDelta: v.number(), // bonConfidence - spConfidence
    // Human evaluation (filled in later)
    humanPreference: v.optional(v.union(v.literal("single"), v.literal("bon"), v.literal("tie"))),
    humanRaterNotes: v.optional(v.string()),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_topic", ["topicName"])
    .index("by_created", ["createdAt"])
    .index("by_submission", ["submissionId"]),

  // ─── Quiz study (see docs/research/protocole-etude-quiz.md §7.4) ────────────

  // One row per participant × topic: which feedback condition this student
  // receives on this topic during the study.
  experimentAssignments: defineTable({
    userId: v.string(), // Clerk ID
    participantCode: v.string(), // pseudonym used in exports, e.g. "P2-014"
    phase: v.number(), // 1 = bootstrap (A/B), 2 = main study (A/B/C)
    topicName: v.string(),
    condition: v.union(
      v.literal("single_pass"),
      v.literal("best_of_n"),
      v.literal("best_of_n_outcome"),
    ),
    latinSquareRow: v.number(), // which permutation of conditions this participant got
    topicOrder: v.number(), // position of this topic in the participant's session order
    enrolledAt: v.number(),
  }).index("by_user_topic", ["userId", "topicName"])
    .index("by_phase", ["phase"])
    .index("by_user", ["userId"]),

  // Singleton: which phase is currently running. Assignments only take effect
  // while their phase is active, so the platform behaves normally outside the study.
  experimentConfig: defineTable({
    activePhase: v.union(v.number(), v.null()),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }),

  // Frozen few-shot pools (expert corrections + outcome-validated feedback),
  // snapshotted at phase start so the treatment stays constant during a phase.
  experimentPoolSnapshots: defineTable({
    phase: v.number(),
    poolType: v.union(v.literal("expertCorrections"), v.literal("outcomeValidated")),
    topicName: v.string(),
    entriesJson: v.string(), // JSON array of few-shot entries
    frozenAt: v.number(),
  }).index("by_phase_pool_topic", ["phase", "poolType", "topicName"]),

  // Full per-submission grading log: all Best-of-N candidates and their judge
  // confidences (not just the selected one), latency, model, prompt version.
  experimentGradingLogs: defineTable({
    submissionId: v.id("submissions"),
    userId: v.string(),
    participantCode: v.string(),
    phase: v.number(),
    topicName: v.string(),
    condition: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    gradingLatencyMs: v.number(),
    candidatesJson: v.string(), // JSON: [{index, grade, judgeConfidence, isJudgeModified}] or single-pass entry
    selectedIndex: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_submission", ["submissionId"])
    .index("by_phase", ["phase"]),

  // Pre/post/delayed quizzes — the study's measurement instrument.
  // Items are CAS-graded only (deterministic); ground truths are stored in the
  // questions snapshot server-side and never sent to the client.
  studyQuizAttempts: defineTable({
    userId: v.string(),
    participantCode: v.string(),
    phase: v.number(),
    topicName: v.string(), // topic slug, same convention as submissions.topicName
    quizType: v.union(v.literal("pre"), v.literal("post"), v.literal("delayed")),
    questionsJson: v.string(), // JSON: [{statement, prompt?, placeholder, instruction, groundTruth, expression}]
    answersJson: v.string(), // JSON: string[] aligned with questions
    resultsJson: v.optional(v.string()), // JSON: [{isCorrect, casChecked}] — written at submit
    score: v.optional(v.number()), // count of correct items
    status: v.union(v.literal("in_progress"), v.literal("submitted")),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    timeLimitMs: v.number(),
    overTime: v.optional(v.boolean()), // submitted after the limit + grace (flagged, not rejected)
  }).index("by_user_topic_type", ["userId", "topicName", "quizType"])
    .index("by_phase", ["phase"]),

  // Practice sessions during the study (protocol §5.2): 30 min per topic,
  // minimum 6 submissions to be valid, fixed difficulty script, no hints.
  studyPracticeSessions: defineTable({
    userId: v.string(),
    participantCode: v.string(),
    phase: v.number(),
    topicName: v.string(), // topic slug
    status: v.union(v.literal("in_progress"), v.literal("completed")),
    submissionCount: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    timeLimitMs: v.number(),
    underMinimum: v.optional(v.boolean()), // completed with < 6 submissions (excluded at analysis)
  }).index("by_user_topic", ["userId", "topicName"])
    .index("by_phase", ["phase"]),

  courses: defineTable({
    courseId: v.string(), // slug like "linear_algebra"
    title: v.string(),
    imageUrl: v.string(),
    description: v.string(),
  }).index("by_courseId", ["courseId"]),

  topics: defineTable({
    courseId: v.string(), // references courses.courseId
    topicId: v.string(),  // slug like "linear_equations"
    title: v.string(),
    description: v.string(),
    chapter: v.string(),
    order: v.optional(v.number()),
  }).index("by_course", ["courseId"])
    .index("by_topicId", ["topicId"]),

});
