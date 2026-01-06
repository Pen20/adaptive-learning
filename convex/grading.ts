import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const gradeSubmission = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(), // "mistral", "llama3", "phi3", "gpt-4o"
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
    - "feedback": A concise, encouraging explanation in LaTeX format where appropriate (e.g., wrap math in $...$).
    IMPORTANT: Double-escape all backslashes in the JSON string (e.g., "\\\\text", "\\\\frac").
        `;

        if (args.model === "gemini-1.5-flash" || args.model === "gemini-1.5-flash-001") {
             const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
             if (!GOOGLE_API_KEY) return { grade: 0, feedback: "Error: Missing GOOGLE_API_KEY" };

             const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
             const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

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
                        { role: "system", content: "You are a helpful math tutor. Grade the student's work. Talk directly to the student in the second person (e.g., 'You did...'). Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty')." },
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
                    { role: "system", content: "You are a helpful math tutor. Verify the student's answer. Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty')." },
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
