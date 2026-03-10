import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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

    // Fetch approved expert corrections for this topic to use as few-shot examples
    const expertCorrections = await ctx.runQuery(api.corrections.getApprovedCorrectionsForTopic, {
      topicName: args.topicName,
      limit: 3
    });

    let fewShotContext = "";
    if (expertCorrections && expertCorrections.length > 0) {
      fewShotContext = `
      ### Expert Peer Review Examples (Historical Corrections):
      The following are examples of how expert human professors have corrected past AI evaluations in this topic. You MUST prioritize following these examples for your judgment:
      ${expertCorrections.map((c: any, i: number) => `
      Example ${i + 1}:
      - AI Feedback was corrected to: "${c.correctedFeedback}"
      - Corrected Grade: ${c.correctedGrade}
      `).join("\n")}
      `;
    }

    const judgePrompt = `
      You are an expert Math Professor acting as an "LLM-as-a-Judge". 
      Your task is to review the evaluation provided by an AI Assistant for a student's math submission on the topic: "${args.topicName}".

      ${fewShotContext}

      Problem Statement:
      ${args.problemStatement}

      Student's Final Answer:
      ${args.studentAnswer}

      Student's Reasoning Steps:
      ${args.studentReasoning}

      AI Assistant's Evaluation:
      - Grade (1=Correct, 0=Incorrect): ${args.assistantGrade}
      - Feedback: ${args.assistantFeedback}

      Your Goal:
      1. Determine if the Assistant's grade is accurate based on the Problem and the Student's work.
      2. Assess if the Assistant's feedback is helpful, encouraging, and pedagogically sound.
      3. **Reasoning Check**: If the student provides reasoning steps, they must be logically sound. If the reasoning is incorrect or inconsistent with the final answer (e.g., "lucky guess" or "copied answer"), the grade MUST be 0 (Incorrect), even if the final result matches the solution.
      4. If the Assistant made a mistake (like marking a lucky guess as correct) or the feedback could be significantly improved, provide a "Refined Feedback" and a corrected grade.
      5. Categorize the error type specifically for the topic "${args.topicName}". Use categories like "Inconsistent Reasoning", "Calculation Error", etc.
      6. Provide a confidence score (0.0 to 1.0) for your judgment.

      Return ONLY a valid JSON object with the following structure:
      {
        "isAssistantCorrect": boolean,
        "suggestedGrade": number (0 or 1),
        "refinedFeedback": string (Explain clearly why the reasoning was wrong even if the answer was right. Use LaTeX $...$ for inline and $$...$$ for blocks),
        "errorType": string (descriptive topic-specific category if grade is 0, otherwise empty string),
        "isModified": boolean,
        "judgeConfidence": number (0.0 - 1.0),
        "reasoning": "Briefly explains your decision as a judge"
      }

      IMPORTANT: Double-escape all backslashes in the LaTeX strings (e.g., "\\\\text", "\\\\frac").
    `;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "o3-mini",
          reasoning_effort: "medium",
          messages: [
            { role: "developer", content: "You are a strict but fair Math Professor. You judge the quality of AI-generated math tutoring evaluations. You have been provided with historical expert corrections to help you align with human standards. Return strictly valid JSON." },
            { role: "user", content: judgePrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`);
      
      const content = JSON.parse(data.choices[0].message.content);
      
      // Basic validation and normalization
      return {
        isAssistantCorrect: !!content.isAssistantCorrect,
        suggestedGrade: content.suggestedGrade === 1 ? 1 : 0,
        refinedFeedback: content.refinedFeedback || args.assistantFeedback,
        errorType: content.errorType || "",
        isModified: !!content.isModified,
        judgeConfidence: typeof content.judgeConfidence === 'number' ? content.judgeConfidence : 0.5,
        reasoning: content.reasoning || ""
      };
    } catch (err: any) {
      console.error("Judge Error:", err);
      throw new Error(`Failed to execute Judge agent: ${err.message}`);
    }
  },
});
