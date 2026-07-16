"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import { getAnswerFormat, topicRegistry } from "@/data/topics";
import { MathRenderer } from "@/components/MathRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuizType = "pre" | "post" | "delayed";

type QuizQuestionView = {
  statement: string;
  prompt?: string;
  placeholder: string;
  instruction: string;
};

type QuizSession = {
  attemptId: Id<"studyQuizAttempts">;
  questions: QuizQuestionView[];
  startedAt: number;
  timeLimitMs: number;
};

const QUIZ_LABELS: Record<QuizType, string> = {
  pre: "Pre-quiz",
  post: "Post-quiz",
  delayed: "Follow-up quiz",
};

const CANDIDATE_COUNT = 40;

function buildCandidates(topicId: string) {
  const engine = topicRegistry[topicId];
  if (!engine) return [];
  const candidates = [];
  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const generated = engine.generate();
    const format = getAnswerFormat(topicId, generated);
    candidates.push({
      statement: generated.statement,
      prompt: generated.prompt,
      placeholder: format.placeholder,
      instruction: format.instruction,
    });
  }
  return candidates;
}

function formatTopicTitle(slug: string) {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyQuizPage() {
  const params = useParams<{ topicId: string }>();
  const searchParams = useSearchParams();
  const topicId = params.topicId;
  const rawType = searchParams.get("type");
  const quizType: QuizType =
    rawType === "post" || rawType === "delayed" ? rawType : "pre";

  const quizState = useQuery(api.studyQuiz.getMyQuizState, {
    topicName: topicId,
    quizType,
  });
  const startQuiz = useAction(api.studyQuiz.startQuizAttempt);
  const submitQuiz = useAction(api.studyQuiz.submitQuizAttempt);
  const saveAnswers = useMutation(api.studyQuiz.saveQuizAnswers);

  const [session, setSession] = useState<QuizSession | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedNow, setSubmittedNow] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const autoSubmitted = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<string[]>([]);
  answersRef.current = answers;

  // Resume an in-progress attempt found on the server.
  useEffect(() => {
    if (session || submittedNow) return;
    if (quizState?.status === "in_progress") {
      setSession({
        attemptId: quizState.attemptId,
        questions: quizState.questions,
        startedAt: quizState.startedAt,
        timeLimitMs: quizState.timeLimitMs,
      });
      const saved = JSON.parse(quizState.answersJson) as string[];
      setAnswers(quizState.questions.map((_, i) => saved[i] ?? ""));
    }
  }, [quizState, session, submittedNow]);

  const doSubmit = useCallback(
    async (currentSession: QuizSession) => {
      if (submitting) return;
      setSubmitting(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      try {
        await submitQuiz({
          attemptId: currentSession.attemptId,
          answersJson: JSON.stringify(answersRef.current),
        });
        setSubmittedNow(true);
      } catch (error) {
        console.error("Quiz submission failed:", error);
      } finally {
        setSubmitting(false);
        setConfirmingSubmit(false);
      }
    },
    [submitQuiz, submitting],
  );

  // Countdown timer + auto-submit at zero.
  useEffect(() => {
    if (!session || submittedNow) return;
    const tick = () => {
      const remaining = session.startedAt + session.timeLimitMs - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void doSubmit(session);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, submittedNow, doSubmit]);

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const result = await startQuiz({
        topicName: topicId,
        quizType,
        candidates: buildCandidates(topicId),
      });
      setSession({
        attemptId: result.attemptId,
        questions: result.questions,
        startedAt: result.startedAt,
        timeLimitMs: result.timeLimitMs,
      });
      const saved = JSON.parse(result.answersJson) as string[];
      setAnswers(result.questions.map((_: QuizQuestionView, i: number) => saved[i] ?? ""));
    } catch (error) {
      console.error("Failed to start quiz:", error);
      setStartError(
        error instanceof Error ? error.message : "Failed to start the quiz. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveAnswers({
        attemptId: session.attemptId,
        answersJson: JSON.stringify(answersRef.current),
      }).catch((error) => console.error("Autosave failed:", error));
    }, 1500);
  };

  // ── Render states ────────────────────────────────────────────────────────────

  if (quizState === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">Loading…</div>
    );
  }

  if (quizState.status === "submitted" || submittedNow) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>
              {QUIZ_LABELS[quizType]} — {formatTopicTitle(topicId)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p className="font-medium text-green-700">Your answers have been recorded. Thank you!</p>
            <p>
              To keep the study fair, quiz results are not shown during the study period.
            </p>
            <Button asChild>
              <Link href="/study">Back to study dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>
              {QUIZ_LABELS[quizType]} — {formatTopicTitle(topicId)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>The quiz has <strong>6 questions</strong> on this topic.</li>
              <li>
                You have <strong>{quizType === "delayed" ? "10" : "15"} minutes</strong>; the quiz
                submits automatically when time runs out.
              </li>
              <li>Give only the final answer for each question — no reasoning is required.</li>
              <li>There are no hints and no feedback, and you can submit only once.</li>
              <li>Your answers are saved automatically while you work.</li>
            </ul>
            {startError && (
              <p className="text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
                {startError}
              </p>
            )}
            <Button onClick={handleStart} disabled={starting}>
              {starting ? "Preparing your quiz…" : "Start the quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = answers.filter((a) => a.trim() !== "").length;
  const lowTime = remainingMs !== null && remainingMs < 2 * 60_000;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-slate-800">
          {QUIZ_LABELS[quizType]} — {formatTopicTitle(topicId)}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {answeredCount}/{session.questions.length} answered
          </span>
          <span
            className={`font-mono text-lg font-semibold ${lowTime ? "text-red-600" : "text-slate-800"}`}
          >
            {remainingMs !== null ? formatRemaining(remainingMs) : "--:--"}
          </span>
        </div>
      </div>

      {session.questions.map((question, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-700">Question {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-900 leading-relaxed overflow-x-auto">
              <MathRenderer content={question.statement} />
            </div>
            {question.prompt && (
              <div className="text-slate-800 font-medium">
                <MathRenderer content={question.prompt} />
              </div>
            )}
            <div className="space-y-1">
              <Input
                value={answers[index] ?? ""}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder={question.placeholder}
                className="font-mono"
                disabled={submitting}
              />
              <p className="text-xs text-slate-500">{question.instruction}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-end gap-3 pb-10">
        {confirmingSubmit ? (
          <>
            <span className="text-sm text-slate-600">
              {answeredCount < session.questions.length
                ? `${session.questions.length - answeredCount} question(s) unanswered. Submit anyway?`
                : "Submit your answers? This cannot be undone."}
            </span>
            <Button variant="outline" onClick={() => setConfirmingSubmit(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void doSubmit(session)} disabled={submitting}>
              {submitting ? "Submitting…" : "Confirm submission"}
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirmingSubmit(true)} disabled={submitting}>
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  );
}
