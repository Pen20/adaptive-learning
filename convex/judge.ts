import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * LLM-as-Judge: single responsibility — verify that the AI feedback is
 * aligned with the specific problem and the student's actual submission.
 *
 * Three alignment checks (each binary pass/fail):
 *   1. PROBLEM RELEVANCE  — feedback addresses this specific problem, not a generic response
 *   2. MATHEMATICAL ACCURACY — mathematical claims in the feedback are correct for this problem
 *   3. GRADE CONSISTENCY — the awarded grade matches what the student actually submitted
 *
 * Only returns isModified=true when at least one check fails, and only then
 * produces a corrected grade/feedback. This keeps the judge fast and surgical.
 */
export const evaluateEvaluator = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    studentReasoning: v.string(),
    assistantGrade: v.number(),
    assistantFeedback: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

    // Fetch up to 2 approved expert corrections as few-shot alignment examples
    const expertCorrections = await ctx.runQuery(api.corrections.getApprovedCorrectionsForTopic, {
      topicName: args.topicName,
      limit: 2,
    });

    const fewShotContext = expertCorrections?.length
      ? `### Expert Alignment Examples for topic "${args.topicName}":
${expertCorrections.map((c: any, i: number) =>
  `Example ${i + 1}: corrected feedback → "${c.correctedFeedback}" | corrected grade → ${c.correctedGrade}`
).join("\n")}`
      : "";

    const judgePrompt = `
You are an LLM-as-Judge for a math tutoring system. Your ONLY job is to verify that the AI feedback is ALIGNED with the specific problem and the student's submission.

${fewShotContext}

--- CONTEXT ---
Topic: ${args.topicName}
Problem: ${args.problemStatement}
Student's Final Answer: ${args.studentAnswer || "(none)"}
Student's Reasoning: ${args.studentReasoning || "(none)"}
AI Grade: ${args.assistantGrade} (1 = correct, 0 = incorrect)
AI Feedback: ${args.assistantFeedback}

--- YOUR THREE ALIGNMENT CHECKS ---
1. PROBLEM RELEVANCE: Does the feedback specifically address THIS problem? Fail if the feedback is generic and could apply to any question.
2. MATHEMATICAL ACCURACY: Are the mathematical statements in the feedback correct for THIS problem? Fail if the feedback contains wrong formulas, wrong values, or contradicts the correct solution.
3. GRADE CONSISTENCY: Independently solve the problem yourself and verify the correct answer. Then compare it sign-by-sign and value-by-value against what the student wrote. A missing negative sign, wrong coefficient, or any numeric error means the answer is WRONG → grade must be 0. Fail this check if a wrong answer received grade 1, or a correct answer received grade 0.

--- RULES ---
- If all three checks pass → set isModified: false and copy the original feedback as refinedFeedback. Do NOT rewrite working feedback.
- If any check fails → set isModified: true and write a corrected refinedFeedback that fixes ONLY the failing checks.
- Do NOT change the grade unless check 3 clearly fails.
- Do NOT penalise valid alternative methods or condensed steps.
- Grade 1 requires both a correct answer AND sound reasoning. Grade 0 with thin reasoning is valid.
- MATH DELIMITERS: use \\( \\) for inline math and \\[ \\] for block math. Double-escape backslashes in JSON (e.g. "\\\\frac", "\\\\mathbf"). Never use $ or $$.

Return ONLY valid JSON:
{
  "checks": {
    "problemRelevance": true | false,
    "mathematicalAccuracy": true | false,
    "gradeConsistency": true | false
  },
  "isModified": boolean,
  "suggestedGrade": 0 | 1,
  "refinedFeedback": "string — original if isModified=false, corrected if true",
  "errorType": "2-4 word category if grade 0, else empty string",
  "judgeConfidence": 0.0-1.0,
  "reasoning": "One sentence explaining the decision"
}
    `.trim();

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a precise math feedback alignment judge. Return only valid JSON. Double-escape all LaTeX backslashes. Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. Never use $ or $$.",
            },
            { role: "user", content: judgePrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`);

      const content = JSON.parse(data.choices[0].message.content);
      const checks = content.checks ?? {};

      return {
        isAssistantCorrect: content.isModified === false,
        suggestedGrade: content.suggestedGrade === 1 ? 1 : 0,
        refinedFeedback: content.refinedFeedback || args.assistantFeedback,
        errorType: content.errorType || "",
        isModified: !!content.isModified,
        judgeConfidence: typeof content.judgeConfidence === "number" ? content.judgeConfidence : 0.5,
        reasoning: content.reasoning || "",
        checks: {
          problemRelevance: checks.problemRelevance !== false,
          mathematicalAccuracy: checks.mathematicalAccuracy !== false,
          gradeConsistency: checks.gradeConsistency !== false,
        },
      };
    } catch (err: any) {
      console.error("Judge Error:", err);
      throw new Error(`Judge failed: ${err.message}`);
    }
  },
});
