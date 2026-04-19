import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

function normalizeSecondPersonFeedback(feedback: string) {
  return feedback
    .replace(/\bThe student has\b/g, "You have")
    .replace(/\bthe student has\b/g, "you have")
    .replace(/\bThe student is\b/g, "You are")
    .replace(/\bthe student is\b/g, "you are")
    .replace(/\bThe student needs\b/g, "You need")
    .replace(/\bthe student needs\b/g, "you need")
    .replace(/\bThe student should\b/g, "You should")
    .replace(/\bthe student should\b/g, "you should")
    .replace(/\bThe student wrote\b/g, "You wrote")
    .replace(/\bthe student wrote\b/g, "you wrote")
    .replace(/\bThe student gave\b/g, "You gave")
    .replace(/\bthe student gave\b/g, "you gave")
    .replace(/\bThe student received\b/g, "You received")
    .replace(/\bthe student received\b/g, "you received")
    .replace(/\bThe student's\b/g, "Your")
    .replace(/\bthe student's\b/g, "your")
    .replace(/\bThe student\b/g, "You")
    .replace(/\bthe student\b/g, "you");
}

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

    // CAS: get independent verified answer for this problem
    const casResult = await ctx.runAction(internal.cas.computeGroundTruth, {
      problemStatement: args.problemStatement,
      topicName: args.topicName,
    }) as { isComputable: boolean; groundTruth: string | null; expression: string | null };

    const casContext = casResult.isComputable
      ? `\n⚠️  CAS VERIFIED ANSWER (mathjs — do NOT override unless the expression is clearly wrong):
   Expression: ${casResult.expression}
   Correct answer: ${casResult.groundTruth}
   If the AI feedback states a different numeric answer, that is a MATHEMATICAL ACCURACY failure.\n`
      : "";

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
${casContext}
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
- Do NOT penalise valid alternative methods or condensed steps. Condensed reasoning is acceptable.
- **Semantic Equivalence**: Mathematically equivalent statements MUST receive the same grade regardless of phrasing or notation. "\\(\\det(A) \\neq 0\\)" and "the determinant is non-zero" are identical. Adding or omitting connective words like "since", "thus", or "therefore" does NOT change the mathematical content. Never flag a correct answer as wrong solely due to rephrasing.
- Grade 1 requires both a correct answer AND reasoning that shows the key steps. Thin reasoning (no steps at all) is grade 0, but concise or shorthand steps are acceptable.
- **Wrong feedback must show the correct result**: If you rewrite feedback for a wrong answer or wrong reasoning, ALWAYS include a brief statement of what the correct answer/result is — even one sentence is enough.
- **Direct Address Only**: Address the learner as "you" and "your" in every feedback section. Never write "the student", "the learner", or third-person phrases such as "The student has shown".
- MANDATORY FEEDBACK STRUCTURE: refinedFeedback MUST contain exactly three labelled sections — never collapse into one paragraph.
  Section 1 — header "**Answer:**": assess only the final answer. If incorrect, state the correct answer and one actionable sentence on what the student needs to fix in their final answer.
  Section 2 — header "**Reasoning:**": assess only the reasoning steps, independently. If a step is wrong or missing, name it and add one actionable sentence on what the student needs to show or correct. Never skip or merge with Section 1.
  Section 3 — header "**Verdict:**": 2-3 sentences. Justify the grade and list all mistakes. If grade is 1, confirm both are correct. Use "you" and "your"; never write "the student".
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
              content: "You are a precise math feedback alignment judge. Address the learner directly as you/your; never write 'the student'. Return only valid JSON. Double-escape all LaTeX backslashes. Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. Never use $ or $$.",
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
        refinedFeedback: normalizeSecondPersonFeedback(content.refinedFeedback || args.assistantFeedback),
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
