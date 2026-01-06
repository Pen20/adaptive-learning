"use client";

import FeedbackForm from "@/components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4">
      <FeedbackForm />
    </div>
  );
}
