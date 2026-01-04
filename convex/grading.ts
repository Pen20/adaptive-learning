import { action } from "./_generated/server";
import { v } from "convex/values";
import { HfInference } from "@huggingface/inference";

export const gradeSubmission = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(), // "mistral", "llama3", "phi3", "gpt-4o"
  },
  handler: async (ctx, args) => {
    try {
        const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
        if (!HUGGINGFACE_API_KEY) {
          console.error("Missing HUGGINGFACE_API_KEY");
          return { grade: 0, feedback: "System Error: API Configuration Missing (HUGGINGFACE_API_KEY)" };
        }

        const hf = new HfInference(HUGGINGFACE_API_KEY);

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

        // OpenAI Logic
        if (args.model === "gpt-4o" || args.model === "gpt-4o-mini") {
             const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
             if (!OPENAI_API_KEY) return { grade: 0, feedback: "Error: Missing OPENAI_API_KEY" };

             const completion = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: args.model,
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

        // Default to Zephyr 7B Beta
        let modelId = "HuggingFaceH4/zephyr-7b-beta"; 
        
        if (args.model === "mistral") modelId = "mistralai/Mistral-7B-Instruct-v0.3"; 
        if (args.model === "llama3") modelId = "meta-llama/Meta-Llama-3-8B-Instruct";
        if (args.model === "phi3") modelId = "microsoft/Phi-3-mini-4k-instruct";

        const makeHfRequest = async (id: string) => {
             // Using chatCompletion (most models support this now) or textGeneration
             // Using textGeneration typically works reliably for older checkpoints, but chat is better for instruct models.
             // We'll stick to textGeneration with the same payload we were using manually, or use hf.chatCompletion if we specifically want chat structure.
             // Given the prompt is one string, let's use hf.textGeneration which maps closely to the previous raw call.
             
             return hf.textGeneration({
                model: id,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    return_full_text: false,
                    temperature: 0.1
                }
             });
        };

        let generatedText = "";

        try {
            const result = await makeHfRequest(modelId);
            generatedText = result.generated_text;
        } catch (e: any) {
            console.warn(`Model ${modelId} failed:`, e);

             // Fallback
             if (modelId !== "mistralai/Mistral-7B-Instruct-v0.1") {
                 console.log("Attempting fallback to Mistral v0.1");
                 try {
                     const result = await makeHfRequest("mistralai/Mistral-7B-Instruct-v0.1");
                     generatedText = result.generated_text;
                 } catch (fallbackErr: any) {
                    return { grade: 0, feedback: `AI Service Error (Fallback failed): ${fallbackErr.message}` };
                 }
             } else {
                 return { grade: 0, feedback: `AI Service Error: ${e.message}` };
             }
        }

        // Attempt to parse JSON from the LLM output
        const cleanedText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        try {
          const parsed = JSON.parse(cleanedText);
          return {
            grade: parsed.grade,
            feedback: parsed.feedback,
          };
        } catch (e) {
          console.error("Failed to parse LLM response:", cleanedText);
           return {
            grade: 0,
            feedback: "Error parsing AI response. Raw output: " + cleanedText.substring(0, 50) + "...",
          };
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
