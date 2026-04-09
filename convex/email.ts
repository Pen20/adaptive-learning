"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendResultEmail = action({
  args: {
    email: v.string(),
    examTitle: v.string(),
    score: v.number(),
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    // If no credentials, log simply.
    if (!gmailEmail || !gmailAppPassword) {
        console.log(`[MOCK EMAIL] To: ${args.email} | Score: ${args.score}% | Exam: ${args.examTitle}`);
        return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Math Course" <${gmailEmail}>`, 
            to: args.email,
            subject: `Exam Results: ${args.examTitle}`,
            html: `
                <h1>Exam Results Available</h1>
                <p>Hello,</p>
                <p>Your results for <strong>${args.examTitle}</strong> are now available.</p>
                <p><strong>Your Score: ${args.score}%</strong></p>
                <p>You can view the detailed solution and feedback by logging into the platform.</p>
                <br />
                <a href="${process.env.SITE_URL ?? "https://ai-math-adaptive.vercel.app"}/exams/${args.examId}">View Results</a>
            `
        });
        console.log("Result email sent successfully to " + args.email, info.messageId);
    } catch (error) {
        console.error("Failed to send email to " + args.email, error);
        throw error;
    }
  },
});

export const sendFeedbackEmail = action({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    type: v.string(),
    message: v.string(),
    institution: v.optional(v.string()),
    gender: v.optional(v.string()),
    profession: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL ?? "wastalasdassise@gmail.com";
    
    // If no credentials, log simply.
    if (!gmailEmail || !gmailAppPassword) {
        console.log(`[MOCK EMAIL] To Admin: ${adminEmail} | From: ${args.email ?? "Anonymous"} | Type: ${args.type} | Message: ${args.message}`);
        return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Math Course Feedback" <${gmailEmail}>`, 
            to: adminEmail,
            subject: `New ${args.type} from ${args.name ?? "Anonymous"}`,
            html: `
                <h1>New Feedback Received</h1>
                <p><strong>Type:</strong> ${args.type}</p>
                <p><strong>Name:</strong> ${args.name ?? "N/A"}</p>
                <p><strong>Email:</strong> ${args.email ?? "N/A"}</p>
                <p><strong>Institution:</strong> ${args.institution ?? "N/A"}</p>
                <p><strong>Profession:</strong> ${args.profession ?? "N/A"}</p>
                <p><strong>Gender:</strong> ${args.gender ?? "N/A"}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>${args.message}</p>
            `
        });
        console.log("Feedback email sent successfully to " + adminEmail, info.messageId);
    } catch (error) {
        console.error("Failed to send feedback email to admin", error);
        throw error;
    }
  },
});
