"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import { getAnswerFormat } from "@/data/topics";
import type { GeneratedProblem } from "@/data/topics";
import {
  generateProblemForTier,
  tierForProblemIndex,
} from "@/data/studyDifficulty";
import { useProblemGrading } from "@/app/courses/[courseId]/topics/[topicId]/_hooks/useProblemGrading";
import type { ProblemData } from "@/app/courses/[courseId]/topics/[topicId]/_types";
import { MathRenderer } from "@/components/MathRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";

const FEEDBACK_READING_MS = 20_000;

function toProblemData(topicId: string, generated: GeneratedProblem): ProblemData {
  return {
    statement: generated.statement,
    hint: generated.hint,
    solution: generated.solution || "See explanation",
    explanation: generated.explanation,
    title: generated.title,
    answerFormat: getAnswerFormat(topicId, generated),
    reasoningSteps: generated.reasoningSteps,
  };
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

export default function StudyPracticePage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId;
  const { user } = useUser();

  const practiceState = useQuery(api.studyPractice.getMyPracticeState, {
    topicName: topicId,
  });
  const allTopics = useQuery(api.courses.getAllTopics, {});
  const startSession = useMutation(api.studyPractice.startPracticeSession);
  const recordSubmission = useMutation(api.studyPractice.recordPracticeSubmission);
  const completeSession = useMutation(api.studyPractice.completePracticeSession);

  const [sessionId, setSessionId] = useState<Id<"studyPracticeSessions"> | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [timeLimitMs, setTimeLimitMs] = useState<number>(30 * 60_000);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [readingRemainingMs, setReadingRemainingMs] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const recordedSubmissions = useRef(new Set<string>());
  const minSubmissions =
    (practiceState && "minSubmissions" in practiceState
      ? practiceState.minSubmissions
      : undefined) ?? 6;

  const courseId =
    allTopics?.find((t: { topicId: string; courseId: string }) => t.topicId === topicId)
      ?.courseId ?? "linear_algebra";

  const { grading, result, lastSubmissionId, handleCheck } = useProblemGrading({
    userId: user?.id,
    courseId,
    topicId,
    problemData,
    finalAnswer,
    reasoning,
    model: "gpt-4o", // overridden server-side (STUDY_MODEL) for enrolled participants
    usedHints: false,
  });

  // Hydrate the running session from the server (resume after reload).
  useEffect(() => {
    if (sessionId || !practiceState) return;
    if (practiceState.status === "in_progress" && "sessionId" in practiceState) {
      setSessionId(practiceState.sessionId);
      setSessionStart(practiceState.startedAt);
      setTimeLimitMs(practiceState.timeLimitMs);
      setSubmissionCount(practiceState.submissionCount);
    }
  }, [practiceState, sessionId]);

  // Generate the current problem according to the fixed difficulty script.
  useEffect(() => {
    if (!sessionId || problemData) return;
    const generated = generateProblemForTier(topicId, tierForProblemIndex(submissionCount));
    setProblemData(toProblemData(topicId, generated));
  }, [sessionId, problemData, submissionCount, topicId]);

  // Session countdown.
  useEffect(() => {
    if (!sessionId || sessionStart === null) return;
    const tick = () => setRemainingMs(sessionStart + timeLimitMs - Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionId, sessionStart, timeLimitMs]);

  // After each graded submission: count it server-side and start the 20 s
  // feedback-reading gate (protocol §5.2 — guarantees exposure to the treatment).
  useEffect(() => {
    if (!result || !lastSubmissionId || !sessionId) return;
    if (recordedSubmissions.current.has(lastSubmissionId)) return;
    recordedSubmissions.current.add(lastSubmissionId);

    setReadingRemainingMs(FEEDBACK_READING_MS);
    void recordSubmission({ sessionId, submissionId: lastSubmissionId })
      .then((res) => setSubmissionCount(res.submissionCount))
      .catch((error) => console.error("Failed to record submission:", error));
  }, [result, lastSubmissionId, sessionId, recordSubmission]);

  // Feedback-reading countdown.
  useEffect(() => {
    if (readingRemainingMs <= 0) return;
    const interval = setInterval(
      () => setReadingRemainingMs((ms) => Math.max(0, ms - 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [readingRemainingMs]);

  const handleStart = async () => {
    setStarting(true);
    setActionError(null);
    try {
      const res = await startSession({ topicName: topicId });
      setSessionId(res.sessionId);
      setSessionStart(res.startedAt);
      setTimeLimitMs(res.timeLimitMs);
      setSubmissionCount(res.submissionCount);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to start the session.");
    } finally {
      setStarting(false);
    }
  };

  const handleNextProblem = () => {
    setProblemData(null); // regenerated by the effect for the updated count
    setFinalAnswer("");
    setReasoning("");
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    setActionError(null);
    try {
      await completeSession({ sessionId });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to finish the session.");
    } finally {
      setFinishing(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────

  if (practiceState === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">Loading…</div>
    );
  }

  if (practiceState.status === "not_enrolled") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-slate-600">
            You are not enrolled in the study for this topic, or the study is not active.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (practiceState.status === "locked_pre") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Practice — {formatTopicTitle(topicId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p>The practice session unlocks after you complete the pre-quiz for this topic.</p>
            <Button asChild>
              <Link href={`/study/quiz/${topicId}?type=pre`}>Go to the pre-quiz</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (practiceState.status === "completed") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Practice — {formatTopicTitle(topicId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p className="font-medium text-green-700">
              Practice session completed. Thank you!
            </p>
            <p>The next step for this topic is the post-quiz.</p>
            <Button asChild>
              <Link href={`/study/quiz/${topicId}?type=post`}>Go to the post-quiz</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Practice — {formatTopicTitle(topicId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>You have <strong>30 minutes</strong> to practise this topic.</li>
              <li>Please solve and submit <strong>at least {minSubmissions} problems</strong>.</li>
              <li>After each submission you will receive feedback — read it carefully before moving on.</li>
              <li>There are no hints and no solutions; the feedback is your only help.</li>
            </ul>
            {actionError && (
              <p className="text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
                {actionError}
              </p>
            )}
            <Button onClick={handleStart} disabled={starting}>
              {starting ? "Starting…" : "Start the practice session"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeExpired = remainingMs !== null && remainingMs <= 0;
  const lowTime = remainingMs !== null && remainingMs < 5 * 60_000;
  const canFinish = submissionCount >= minSubmissions || timeExpired;
  const readingGateActive = readingRemainingMs > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-slate-800">
          Practice — {formatTopicTitle(topicId)}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {submissionCount}/{minSubmissions} problems
          </span>
          <span
            className={`font-mono text-lg font-semibold ${lowTime ? "text-red-600" : "text-slate-800"}`}
          >
            {remainingMs !== null ? formatRemaining(remainingMs) : "--:--"}
          </span>
        </div>
      </div>

      {!timeExpired && problemData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-700">
              Problem {submissionCount + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-900 leading-relaxed overflow-x-auto">
              <MathRenderer content={problemData.statement} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Your reasoning steps</label>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Show how you worked towards your answer…"
                rows={5}
                disabled={grading || !!result}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Final answer</label>
              <Input
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                placeholder={problemData.answerFormat.placeholder}
                className="font-mono"
                disabled={grading || !!result}
              />
              <p className="text-xs text-slate-500">{problemData.answerFormat.instruction}</p>
            </div>
            {!result && (
              <Button onClick={handleCheck} disabled={grading || finalAnswer.trim() === ""}>
                {grading ? "Checking your answer…" : "Submit answer"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {result && !timeExpired && (
        <Card
          className={`border-l-4 ${result.grade >= 1 ? "border-l-green-500" : "border-l-red-500"}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {result.grade >= 1 ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none overflow-x-auto">
              <MathRenderer content={result.feedback} />
            </div>
            <Button onClick={handleNextProblem} disabled={readingGateActive}>
              {readingGateActive
                ? `Read the feedback… (${Math.ceil(readingRemainingMs / 1000)}s)`
                : "Next problem"}
            </Button>
          </CardContent>
        </Card>
      )}

      {timeExpired && (
        <Card>
          <CardContent className="pt-6 text-slate-600">
            Time is up — please finish the session below.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3 pb-10">
        {actionError && <span className="text-sm text-red-600">{actionError}</span>}
        <Button
          variant={canFinish ? "default" : "outline"}
          onClick={handleFinish}
          disabled={!canFinish || finishing || grading}
          title={
            canFinish
              ? undefined
              : `Submit at least ${minSubmissions} problems before finishing`
          }
        >
          {finishing ? "Finishing…" : "Finish session"}
        </Button>
      </div>
    </div>
  );
}
