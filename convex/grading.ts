import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./_generated/api";

export const gradeSubmission = action({
// ... (omitting for brevity as I'm replacing the whole file structure or a large chunk)
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(), // "mistral", "llama3", "phi3", "gpt-4o"
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
        const prompt = `
    You are a strict but helpful math tutor. Grade the following student submission for correctness and logic.
    Address the student directly in the second person (e.g., "Your answer is...").
    Problem: ${args.problemStatement}
    Student's Final Answer: ${args.studentAnswer}
    Student's Reasoning: ${args.reasoning}

    Return ONLY a valid JSON object with no markdown formatting. The JSON must have:
    - "grade": 1 for correct, 0 for incorrect.
    - "feedback": A concise, encouraging explanation. Use $$...$$ for block math and $...$ for inline math. Do NOT wrap text in $.
    - "errorType": If grade is 0, a 2-4 word category of the error (e.g., "Calculation Error", "Conceptual Misunderstanding", "Sign Error", "Incomplete Steps"). If grade is 1, return an empty string.
    IMPORTANT: Double-escape all backslashes in the JSON string (e.g., "\\\\text", "\\\\frac").
        `;

        if (args.model === "gemini-2.5-flash") {
             const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
             if (!GOOGLE_API_KEY) return { grade: 0, feedback: "Error: Missing GOOGLE_API_KEY" };

             const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
             const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

             // Gemini prompt slightly adjusted for JSON structure enforcement via prompt engineering as strict JSON mode varies
             const geminiPrompt = `
             System: You are a helpful math tutor. Grade the following student submission.
             
             Problem: ${args.problemStatement}
             Student Answer: ${args.studentAnswer}
             Reasoning: ${args.reasoning}

             Instructions:
             1. Address the student directly in the second person.
             2. Return ONLY a valid JSON object. Do not wrap it in markdown code blocks.
             3. The JSON must have "grade" (1 or 0) and "feedback" (string).
             4. Double escape LaTeX backslashes.
             5. STRICTLY use $$...$$ delimiters for block math (matrices, separate equations).
             6. STRICTLY use $...$ delimiters for ALL inline math (e.g., $x$, $\frac{1}{2}$, $5x + 3$).
             7. NEVER output raw LaTeX without delimiters. For example, never write \frac{a}{b}, always write $\frac{a}{b}$.
             8. Do NOT wrap normal text explanations in $.

             JSON Output:
             `;

             const result = await model.generateContent(geminiPrompt);
             const response = await result.response;
             const text = response.text();
             
             // Clean potential markdown blocks if Gemini adds them
             const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
             
             try {
                const parsed = JSON.parse(cleaned);
                return { grade: parsed.grade, feedback: parsed.feedback };
             } catch (e) {
                 console.error("Gemini JSON Parse Error", text);
                 return { grade: 0, feedback: "Error parsing Gemini response." };
             }
        }

        if (args.model === "gpt-4o" || args.model === "gpt-4o-mini" || true) { // Fallback to OpenAI for everything or handle errors for others
             const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
             if (!OPENAI_API_KEY) return { grade: 0, feedback: "Error: Missing OPENAI_API_KEY" };

             const completion = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: args.model.startsWith("gpt") ? args.model : "gpt-4o-mini", // Default to mini if unknown/deprecated model passed
                    messages: [
                        { role: "system", content: "You are a helpful math tutor. Grade the student's work. Talk directly to the student in the second person (e.g., 'You did...'). Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY wrap all math in $...$ (inline) or $$...$$ (block)." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
             });

             const data = await completion.json();
             if (data.error) return { grade: 0, feedback: `OpenAI Error: ${data.error.message}` };
             
             const content = data.choices[0].message.content;
             const parsed = JSON.parse(content);
             return { grade: parsed.grade, feedback: parsed.feedback };
        }
    } catch (err: any) {
        console.error("Unexpected Grading Error:", err);
        return { grade: 0, feedback: `Unexpected system error: ${err.message}` };
    }
  },
});

export const checkPracticeAnswer = action({
  args: {
    questionText: v.string(),
    userAnswer: v.string(),
    correctAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return { isCorrect: false, feedback: "Error: Missing OpenAI Key" };

    const prompt = `
      Question: ${args.questionText}
      Expected Answer: ${args.correctAnswer}
      Student Answer: ${args.userAnswer}

      Is the student's answer correct? Provide a short explanation.
      Address the student directly in the second person (e.g., "Your answer is...").
      Return JSON: { "isCorrect": boolean, "feedback": "3-sentence explanation" }
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful math tutor. Verify the student's answer. Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY wrap all math in $...$ (inline) or $$...$$ (block)." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return { isCorrect: content.isCorrect, feedback: content.feedback };
    } catch (e: any) {
        console.error("Practice Grading Error:", e);
        return { isCorrect: false, feedback: "Error checking answer. Please try again." };
    }
  },
});

export const transcribeReasoning = action({
  args: {
    image: v.string(), // base64 string
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a math transcription assistant. Transcribe the handwritten or printed math solution in the image into LaTeX-formatted text. Use $...$ for inline math and $$...$$ for block math. Do not include any conversational text, just the transcription. If steps are numbered, maintain the numbering. Output should be ready to be pasted into a reasoning box."
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe this image." },
                {
                  type: "image_url",
                  image_url: {
                    url: args.image,
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.choices[0].message.content;
    } catch (err: any) {
      console.error("Transcription Error:", err);
      throw new Error("Failed to transcribe image. Please try again.");
    }
  },
});

export const gradeWithJudge = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get initial grade
    const initialResult = (await ctx.runAction(api.grading.gradeSubmission, args)) as { grade: number; feedback: string; errorType?: string };

    try {
      // 2. Invoke Judge
      const judgeResult = (await ctx.runAction(api.judge.evaluateEvaluator, {
        problemStatement: args.problemStatement,
        studentAnswer: args.studentAnswer,
        studentReasoning: args.reasoning,
        assistantGrade: initialResult.grade,
        assistantFeedback: initialResult.feedback,
        topicName: args.topicName,
      })) as {
        suggestedGrade: number;
        refinedFeedback: string;
        errorType: string;
        isModified: boolean;
        judgeConfidence: number;
        reasoning: string;
      };

      // 3. Prepare final result
      return {
        grade: judgeResult.suggestedGrade,
        feedback: judgeResult.isModified ? judgeResult.refinedFeedback : initialResult.feedback,
        errorType: judgeResult.errorType || initialResult.errorType,
        judgeMetadata: {
          judgeFeedback: judgeResult.refinedFeedback,
          isJudgeModified: judgeResult.isModified,
          judgeConfidence: judgeResult.judgeConfidence,
          judgeReasoning: judgeResult.reasoning
        }
      };
    } catch (err) {
      console.error("Judge failed, falling back to initial result", err);
      return {
        grade: initialResult.grade,
        feedback: initialResult.feedback,
        errorType: initialResult.errorType,
      };
    }
  },
});
