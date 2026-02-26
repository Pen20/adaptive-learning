import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generatePractice = action({
  args: {
    userId: v.string(),
    courseName: v.string(),
    topicName: v.string(),
    currentProblemType: v.optional(v.string()),
    transcribedWork: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use OPENAI_API_KEY for problem generation
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    // 1. Fetch last 5 incorrect submissions for this user/course/topic
    // Note: We need to use internal mutation/query or logic. 
    // Since we are in an action, we can call a query.
    // However, defining a query to filter by user and correctness is needed.
    // For simplicity, we'll ask the action to accept the "incorrect concepts" directly 
    // or we fetch recent submissions via a new query helper.
    
    // Let's assume we fetch them via a query helper we'll create: `submissions.getIncorrectSubmissions`
    const incorrectSubmissions = await ctx.runQuery(api.submissions.getIncorrectSubmissions, { 
      userId: args.userId, 
      topicName: args.topicName,
      limit: 2 
    });

    const studentMastery = await ctx.runQuery(api.submissions.getStudentMastery, {
      userId: args.userId,
      topicName: args.topicName
    });

    const masteryScore = studentMastery?.masteryScore || 0;

    // If no past mistakes AND no transcribed work, we can't really personalize much beyond generic topic practice
    if ((!incorrectSubmissions || incorrectSubmissions.length === 0) && !args.transcribedWork) {
      return {
        message: "Great job! You don't have enough incorrect attempts to generate targeted practice yet. Try scanning your work if you are stuck!",
        questions: []
      };
    }

    const mistakes = (incorrectSubmissions || []).map((s: any) => 
      `Problem: ${s.problemStatement}\nError Type: ${s.errorType || "Unknown"}\nWrong Answer: ${s.finalAnswer}\nReasoning: ${s.reasoningSteps}\nFeedback: ${s.aiFeedback}`
    ).join("\n\n");

    let context = "";
    if (args.transcribedWork) {
        context = `
The student has uploaded an image of their work on a problem they are currently stuck on.
The student has a mastery level of ${masteryScore} (Scale 0-100).
Here is the transcription of their work:
"${args.transcribedWork}"

Analyze this work to identify their misconceptions or where they are getting stuck.
Generate practice questions that specifically target these issues at a difficulty level appropriate for mastery ${masteryScore}.
`;
    } else {
        context = `
The student has a mastery level of ${masteryScore} (Scale 0-100) in ${args.topicName}.
The student recently struggled with:

${mistakes}
`;
    }

    const prompt = `
The student is working on ${args.courseName} - ${args.topicName}.
The student's Mastery Level is ${masteryScore}/100.
${args.currentProblemType ? `Current Focus: ${args.currentProblemType}. 
IMPORTANT: Generate questions STRICTLY related to "${args.currentProblemType}". 
- If the focus is Trigonometric, use ONLY trigonometric functions (and basic polynomials). Do NOT introduce exponentials (e^x) or logarithms (ln) unless they are explicitly part of this topic title.
- If the focus is Logarithmic, focus on logarithms.
- Keep the difficulty consistent with a mastery level of ${masteryScore}.` : ""}

${context}

IMPORTANT: Analyze the "Error Type" patterns above. These may be descriptive labels like "Chain Rule Error" or "Sign Error". 
- Infer the underlying mathematical misconception from these labels and the student's reasoning.
- Generate questions that specifically target these identified issues.
- For example, if the error type mentions "Factorisation", test algebraic factorisation. If it mentions "Sign", focus on negative numbers.
- If it is a descriptive topic-specific error (e.g., "Product Rule mistake" in Derivatives), generate problems centering on that specific rule.

Difficulty Adjustment:
- If Mastery < 30: Generate foundational, single-step problems.
- If Mastery 30-70: Generate intermediate, multi-step problems.
- If Mastery > 70: Generate challenging, complex problems that combine multiple concepts.

Generate 3 new practice questions. 
Structure your response STRICTLY as a JSON object with a "questions" key containing an array of objects.
Each object must have:
- "id": a unique string ID (1, 2, 3)
- "text": the LaTeX-formatted problem statement
- "correctAnswer": the correct answer (numerical or simple string)

Example:
{
  "questions": [
    { "id": "1", "text": "Solve for $x$: $2x = 4$", "correctAnswer": "2" }
  ]
}
    `;

    // 2. Call OpenAI (GPT-4o)

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
                        content: `You are a helpful math tutor. Generate practice problems based on the student's mistakes, error types, and mastery level (${masteryScore}/100). 
                        Adjust difficulty dynamically: 
                        - Low mastery = simplified examples. 
                        - High mastery = complex applications.
                        Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string.` 
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);
        
        return {
            message: args.transcribedWork ? "Based on your scanned work, here are some recommended problems to help you practice:" : "Based on your recent mistakes, here are some recommended problems:",
            questions: parsed.questions || []
        };

    } catch (e: any) {
        console.error("OpenAI Recommendation Error:", e);
        return {
            message: "Unable to generate specific recommendations at this time.",
            questions: []
        };
    }
  },
});
