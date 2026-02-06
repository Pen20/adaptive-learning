"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendResultEmail = action({
  args: {
    email: v.string(),
    examTitle: v.string(),
    score: v.number(),
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    
    // If no API key, log simply.
    if (!apiKey) {
        console.log(`[MOCK EMAIL] To: ${args.email} | Score: ${args.score}% | Exam: ${args.examTitle}`);
        return;
    }

    const resend = new Resend(apiKey);

    try {
        await resend.emails.send({
            from: "Math Course <onboarding@resend.dev>", 
            to: args.email,
            subject: `Exam Results: ${args.examTitle}`,
            html: `
                <h1>Exam Results Available</h1>
                <p>Hello,</p>
                <p>Your results for <strong>${args.examTitle}</strong> are now available.</p>
                <p><strong>Your Score: ${args.score}%</strong></p>
                <p>You can view the detailed solution and feedback by logging into the platform.</p>
                <br />
                <a href="${process.env.SITE_URL ?? "https://my-math-course.vercel.app"}/exams/${args.examId}">View Results</a>
            `
        });
    } catch (error) {
        console.error("Failed to send email to " + args.email, error);
    }
  },
});
