import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api, internal } from "./_generated/api";

export const gradeSubmission = action({
// ... (omitting for brevity as I'm replacing the whole file structure or a large chunk)
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
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

    IMPORTANT: If "Student's Final Answer" is empty or missing, you MUST identify their intended final answer from their "Reasoning" steps. If no final answer can be found in the reasoning, the grade should be 0.
    
    IMPORTANT: NO BARE ANSWERS. If the "Student's Reasoning" is empty, trivial, or merely states the work was done on paper, you MUST give a grade of 0. Your feedback MUST explicitly state: "You need to provide your full written reasoning and core logic steps here. I cannot accept just the final solution because I need to assess your methodology and highlight any missing steps."

    IMPORTANT: STRICT MATH DELIMITER PROTOCOL
    - You MUST wrap EVERY mathematical symbol, variable, matrix, or expression in LaTeX delimiters.
    - Use \\( ... \\) for inline math (e.g., \\(x\\), \\(\\mathbf{u}\\), \\(\\frac{1}{2}\\)).
    - Use \\[ ... \\] for block math (e.g., matrices, long equations).
    - NEVER use $ or $$ as delimiters. NEVER output raw LaTeX without delimiters.
    - Example of CORRECT formatting: "Your vector \\(\\mathbf{u}\\) is independent."
    - Example of INCORRECT formatting: "Your vector $\mathbf{u}$ is independent."

    Return ONLY a valid JSON object with no markdown formatting. The JSON must have:
    - "grade": 1 for correct, 0 for incorrect.
    - "feedback": A concise, encouraging explanation. ALWAYS follow the DELIMITER PROTOCOL above.
    - "errorType": If grade is 0, a 2-4 word category of the error. If grade is 1, return an empty string.
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
             4. Double escape LaTeX backslashes in the JSON string (e.g., \\\\frac, \\\\mathbf).
             5. STRICTLY use \\\\[ ... \\\\] delimiters for block math (matrices, separate equations).
             6. STRICTLY use \\\\( ... \\\\) delimiters for ALL inline math (e.g., \\\\(x\\\\), \\\\(\\\\frac{1}{2}\\\\)).
             7. NEVER use $ or $$ as delimiters. NEVER output raw LaTeX without delimiters.
             8. Do NOT wrap normal text explanations in math delimiters.

             JSON Output:
             `;

             const result = await model.generateContent(geminiPrompt);
             const response = await result.response;
             const text = response.text();
             
             // Clean potential markdown blocks if Gemini adds them
             const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
             
             try {
                const parsed = JSON.parse(cleaned);
                return { grade: parsed.grade, feedback: parsed.feedback, errorType: "" };
             } catch (e) {
                 console.error("Gemini JSON Parse Error", text);
                 return { grade: 0, feedback: "Error parsing Gemini response.", errorType: "Parse Error" };
             }
        } else { // OpenAI (gpt-4o, gpt-4o-mini, or any unrecognised model falls back to OpenAI)
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
                        { role: "system", content: "You are a helpful math tutor. Grade the student's work. Talk directly to the student in the second person (e.g., 'You did...'). Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. NEVER use $ or $$ as delimiters." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
             });

             const data = await completion.json();
             if (data.error) return { grade: 0, feedback: `OpenAI Error: ${data.error.message}`, errorType: "API Error" };
             
             const content = data.choices[0].message.content;
             const parsed = JSON.parse(content);
             return { grade: parsed.grade, feedback: parsed.feedback, errorType: parsed.errorType || "" };
        }
    } catch (err: any) {
        console.error("Unexpected Grading Error:", err);
        return { grade: 0, feedback: `Unexpected system error: ${err.message}`, errorType: "System Error" };
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
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful math tutor. Verify the student's answer. Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY use \\\\( and \\\\) for ALL inline math (e.g., \\\\(x\\\\), \\\\(\\\\frac{1}{2}\\\\)). STRICTLY use \\\\[ and \\\\] for block/display math (e.g., matrices). NEVER use $ or $$ delimiters." },
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a high-precision Math Transcription Expert specializing in handwritten pedagogical solutions.
              
              YOUR TASK:
              Transcribe the provided image into clean, professionally formatted LaTeX.
              
              HANDWRITING RULES:
              1. **Ambiguity Resolution**: Carefully distinguish between 'x' (variable) and '×' (multiplication), '0' (zero) and 'o' (letter), 'l' (ell) and '1' (one).
              2. **Structural Fidelity**: If a solution is written in multi-line steps with alignment (e.g., sequels of equations), use the LaTeX 'aligned' environment or multiple $$...$$ blocks to maintain that vertical flow.
              3. **Matrix/Vector Support**: For handwritten matrices or vectors, use the 'bmatrix' or 'pmatrix' environments.
              4. **Latex Delimiters**: 
                 - Use $...$ for inline variables or short terms.
                 - Use $$...$$ for significant formulas, multi-line derivations, or centered results.
              
              OUTPUT CONSTRAINTS:
              - Return ONLY the LaTeX transcription. 
              - Do NOT include any conversational text (e.g. "Here is the transcription...").
              - Do NOT use markdown code blocks; just the raw text with LaTeX delimiters.
              - Ensure the output is immediately readable by a MathJax/KaTeX renderer.`
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

export const gradeOptimized = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get few-shot examples (expert corrections) for this topic
    const expertCorrections = await ctx.runQuery(api.corrections.getApprovedCorrectionsForTopic, {
      topicName: args.topicName,
      limit: 2
    });

    let fewShotContext = "";
    if (expertCorrections && expertCorrections.length > 0) {
      fewShotContext = `
      ### Reference Standards (Expert Professor Corrections):
      ${expertCorrections.map((c: any, i: number) => `
      Example ${i + 1}:
      - AI Feedback was corrected to: "${c.correctedFeedback}"
      - Corrected Grade: ${c.correctedGrade}
      `).join("\n")}
      `;
    }

    const unifiedPrompt = `
    You are an expert Math Professor. Grade the student's submission for the topic: "${args.topicName}".

    ${fewShotContext}

    Problem: ${args.problemStatement}
    Student's Final Answer: ${args.studentAnswer}
    Student's Reasoning: ${args.reasoning}

    STRICT RULES:
    1. **REQUIRED REASONING (NO BARE ANSWERS)**: If the "Student's Reasoning" is empty, trivial, or merely states that the work was done on paper, you MUST assign a grade of 0. Your feedback MUST explicitly state: "You need to provide your full written reasoning and core logic steps here. I cannot accept just the final solution because I need to assess your methodology and highlight any missing steps."
    2. **Final Answer Detection**: If "Student's Final Answer" is empty, you MUST find the answer within the "Reasoning" steps.
    3. **Reasoning Consistency**: If the reasoning is incorrect, inconsistent with the final answer, or appears to be a "lucky guess", the grade MUST be 0.
    4. **Final Answer in Steps**: The student must include a clear final answer somewhere within their work.
    5. **Tone**: Be professional, encouraging, and direct (use "You" / second person).
    6. **STRICT MATH DELIMITER PROTOCOL**:
       - You MUST wrap EVERY mathematical symbol, variable, matrix, or expression in delimiters.
       - Use \\( ... \\) for inline math and \\[ ... \\] for block math. Double-escape backslashes in JSON (e.g., "\\\\frac", "\\\\mathbf").
       - NEVER use $ or $$ as delimiters. NEVER output raw LaTeX (e.g., \\boldsymbol, \\begin) without delimiters.

    Return ONLY a valid JSON object:
    {
      "grade": number (0 or 1),
      "feedback": "Concise pedagogical explanation following STRICT MATH DELIMITER PROTOCOL",
      "errorType": "2-4 word category if grade 0, else empty"
    }
    `;

    const systemMessage = "You are a strict Math Professor. Return strictly valid JSON. IMPORTANT: Double-escape all LaTeX backslashes (e.g., '\\\\frac', '\\\\mathbf'). Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. NEVER use $ or $$ as delimiters.";

    try {
      if (args.model === "gemini-2.5-flash") {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) return { grade: 0, feedback: "Error: Missing GOOGLE_API_KEY", errorType: "Config Error", isOptimized: true };

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const geminiModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" } as any,
        });

        const result = await geminiModel.generateContent(`${systemMessage}\n\n${unifiedPrompt}`);
        const text = result.response.text();

        // Extract the first {...} block in case Gemini adds surrounding text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Gemini returned no JSON object:", text);
          return { grade: 0, feedback: "Error: Gemini returned an unexpected response format. Please try again.", errorType: "Parse Error", isOptimized: true };
        }
        const content = JSON.parse(jsonMatch[0]);
        return {
          grade: content.grade,
          feedback: content.feedback,
          errorType: content.errorType || "",
          isOptimized: true
        };
      } else {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) return { grade: 0, feedback: "Error: Missing OPENAI_API_KEY", errorType: "Config Error", isOptimized: true };

        const openaiModel = args.model.startsWith("gpt") ? args.model : "gpt-4o-mini";
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: unifiedPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        if (data.error) return { grade: 0, feedback: `API Error: ${data.error.message}`, errorType: "API Error", isOptimized: true };
        const content = JSON.parse(data.choices[0].message.content);
        return {
          grade: content.grade,
          feedback: content.feedback,
          errorType: content.errorType || "",
          isOptimized: true
        };
      }
    } catch (e: any) {
      console.error("Optimized Grading Error:", e);
      return { grade: 0, feedback: "Error during grading. Please try again.", errorType: "Feedback Error", isOptimized: true };
    }
  },
});

// Background action — called by scheduler after saveSubmission, never directly by the client
export const runJudgeForSubmission = internalAction({
  args: {
    submissionId: v.id("submissions"),
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    grade: v.number(),
    feedback: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const judgeResult = (await ctx.runAction(api.judge.evaluateEvaluator, {
        problemStatement: args.problemStatement,
        studentAnswer: args.studentAnswer,
        studentReasoning: args.reasoning,
        assistantGrade: args.grade,
        assistantFeedback: args.feedback,
        topicName: args.topicName,
      })) as {
        suggestedGrade: number;
        refinedFeedback: string;
        errorType: string;
        isModified: boolean;
        judgeConfidence: number;
        reasoning: string;
      };

      await ctx.runMutation(internal.submissions.patchSubmissionWithJudge, {
        submissionId: args.submissionId,
        grade: judgeResult.suggestedGrade,
        feedback: judgeResult.isModified ? judgeResult.refinedFeedback : args.feedback,
        errorType: judgeResult.errorType || "",
        judgeFeedback: judgeResult.refinedFeedback,
        isJudgeModified: judgeResult.isModified,
        judgeConfidence: judgeResult.judgeConfidence,
      });
    } catch (err) {
      console.error("Background judge failed for submission", args.submissionId, err);
      // Patch judgeStatus to complete even on failure so the UI doesn't hang
      await ctx.runMutation(internal.submissions.patchSubmissionWithJudge, {
        submissionId: args.submissionId,
        grade: args.grade,
        feedback: args.feedback,
        errorType: "",
        judgeFeedback: "",
        isJudgeModified: false,
        judgeConfidence: 0,
      });
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
    const initialResult = (await ctx.runAction(api.grading.gradeOptimized, args)) as { grade: number; feedback: string; errorType?: string };

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
        errorType: judgeResult.errorType || initialResult.errorType || "",
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
        errorType: initialResult.errorType || "",
        judgeMetadata: undefined
      };
    }
  },
});

// Grades a student answer against a teacher-defined marking scheme (partial marking).
// Each criterion is awarded its full marks or 0. Total grade is sum of awarded marks (0-1).
export const gradeWithMarkingScheme = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    studentReasoning: v.string(),
    topicName: v.string(),
    model: v.string(),
    criteria: v.array(v.object({
      id: v.string(),
      description: v.string(),
      marks: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const criteriaLines = args.criteria
      .map(c => `- [${c.id}] (${c.marks} marks): "${c.description}"`)
      .join("\n");

    const prompt = `
You are a strict Math Professor grading an exam answer against a specific marking scheme.

Topic: ${args.topicName}
Problem: ${args.problemStatement}
Student's Final Answer: ${args.studentAnswer || "(see reasoning)"}
Student's Reasoning: ${args.studentReasoning || "(none provided)"}

MARKING SCHEME — evaluate each criterion independently:
${criteriaLines}

RULES:
1. For each criterion, award the FULL marks listed or 0 — no partial marks within a criterion.
2. totalGrade = sum of all awarded marks (between 0.0 and 1.0).
3. If no reasoning is provided, every criterion gets 0.
4. Award marks only when the criterion is clearly and explicitly met.
5. Address the student directly (second person).
6. STRICT MATH DELIMITER PROTOCOL: Use \\( \\) for inline math and \\[ \\] for block math. Double-escape all backslashes in JSON (e.g., "\\\\frac", "\\\\mathbf").

Return ONLY valid JSON (no markdown):
{
  "criteria": [
    { "id": "<criterion id>", "awarded": <marks or 0>, "met": <true/false>, "reason": "Brief reason why marks were or were not awarded" }
  ],
  "totalGrade": <0.0 to 1.0>,
  "feedback": "Concise overall feedback referencing which criteria were met or missed"
}
    `;

    const systemMsg = "You are a strict Math Professor. Return only valid JSON. Double-escape all LaTeX backslashes. Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. Never use $ or $$.";

    try {
      if (args.model === "gemini-2.5-flash") {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) return { grade: 0, feedback: "Error: Missing GOOGLE_API_KEY", criteriaResults: [], errorType: "Config Error" };

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const geminiModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" } as any,
        });
        const result = await geminiModel.generateContent(`${systemMsg}\n\n${prompt}`);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { grade: 0, feedback: "Error: unexpected Gemini response.", criteriaResults: [], errorType: "Parse Error" };
        const content = JSON.parse(jsonMatch[0]);
        return {
          grade: content.totalGrade ?? 0,
          feedback: content.feedback ?? "",
          criteriaResults: content.criteria ?? [],
          errorType: content.totalGrade === 1 ? "" : "Partial / Incorrect",
        };
      } else {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) return { grade: 0, feedback: "Error: Missing OPENAI_API_KEY", criteriaResults: [], errorType: "Config Error" };

        const openaiModel = args.model.startsWith("gpt") ? args.model : "gpt-4o-mini";
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: "system", content: systemMsg },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });
        const data = await response.json();
        if (data.error) return { grade: 0, feedback: `API Error: ${data.error.message}`, criteriaResults: [], errorType: "API Error" };
        const content = JSON.parse(data.choices[0].message.content);
        return {
          grade: content.totalGrade ?? 0,
          feedback: content.feedback ?? "",
          criteriaResults: content.criteria ?? [],
          errorType: content.totalGrade === 1 ? "" : "Partial / Incorrect",
        };
      }
    } catch (e: any) {
      console.error("Marking scheme grading error:", e);
      return { grade: 0, feedback: "Error during grading. Please try again.", criteriaResults: [], errorType: "System Error" };
    }
  },
});
