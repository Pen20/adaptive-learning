"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Brain, CheckCircle2, Loader2, RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import { MathRenderer } from "@/components/MathRenderer";
import { NotationHelp } from "@/components/math/NotationHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { PedagogicalEvaluation } from "../_types";

interface Props {
  submissionId: Id<"submissions">;
  evaluation?: PedagogicalEvaluation;
}

function formatRemediationPrompt(prompt: string) {
  return prompt
    .replace(
      "For [[a,b],[c,d]], which expression gives the determinant?",
      "For $\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$, which expression gives the determinant?",
    )
    .replace(
      "Compute det([[3,2],[1,4]]).",
      "Compute $\\det\\begin{bmatrix} 3 & 2 \\\\ 1 & 4 \\end{bmatrix}$.",
    )
    .replace(
      "Find k so that [[2,3],[4,k]] is singular.",
      "Find $k$ so that $\\begin{bmatrix} 2 & 3 \\\\ 4 & k \\end{bmatrix}$ is singular.",
    );
}

function formatChoice(activityId: string, option: string) {
  const mathActivities = new Set(["concept-sign", "concept-2x2", "concept-singular"]);
  if (!mathActivities.has(activityId)) return option;
  return `$${option.replaceAll("−", "-").replaceAll("≠", "\\ne")}$`;
}

export function GuidedMistakeCorrection({ submissionId, evaluation }: Props) {
  const startRemediation = useMutation(api.remediation.startRemediation);
  const submitResponse = useMutation(api.remediation.submitRemediationResponse);
  const [sessionId, setSessionId] = useState<Id<"remediationSessions"> | null>(null);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const responseRef = useRef<HTMLTextAreaElement>(null);
  const responseCursor = useRef({ start: 0, end: 0 });
  const state = useQuery(
    api.remediation.getRemediationState,
    sessionId ? { sessionId } : "skip",
  );

  const begin = async () => {
    setSubmitting(true);
    try {
      const id = await startRemediation({ submissionId });
      setSessionId(id);
      setFeedback(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not start guided correction.");
    } finally {
      setSubmitting(false);
    }
  };

  const check = async () => {
    if (!sessionId || !response.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitResponse({ sessionId, response });
      setFeedback(result.feedback);
      if (result.correct) setResponse("");
      if (result.completed) toast.success("Guided correction completed. +5 mastery points.");
    } catch (error) {
      console.error(error);
      toast.error("Could not check this step.");
    } finally {
      setSubmitting(false);
    }
  };

  const rememberResponseCursor = () => {
    const element = responseRef.current;
    if (!element) return;
    responseCursor.current = {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0,
    };
  };

  const insertNotation = (code: string) => {
    const { start, end } = responseCursor.current;
    const insertion = `$${code}$`;
    setResponse((current) =>
      current.slice(0, start) + insertion + current.slice(end),
    );
    const nextCursor = start + insertion.length;
    responseCursor.current = { start: nextCursor, end: nextCursor };
    requestAnimationFrame(() => {
      responseRef.current?.focus();
      responseRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  if (!sessionId) {
    return (
      <Card className="border-indigo-200 bg-indigo-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-950">
            <Brain className="h-5 w-5 text-indigo-600" />
            Guided Mistake Correction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Work on the first reasoning error from this submission, correct your
            original step, and demonstrate the idea on a transfer task.
          </p>
          {evaluation?.misconceptionLabel && (
            <div className="mt-3 flex items-start gap-2 rounded-md border bg-white p-3 text-sm">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <span><strong>Learning target:</strong> {evaluation.misconceptionLabel}</span>
            </div>
          )}
          <Button className="mt-4" onClick={begin} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start guided correction
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state === undefined) {
    return <Card><CardContent className="py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></CardContent></Card>;
  }

  if (!state) return null;

  if (state.status === "completed") {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex items-start gap-3 py-6">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Correction completed</p>
            <p className="mt-1 text-sm text-green-800">You corrected the targeted error and applied the idea to a new case.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activity = state.activity;
  if (!activity) return null;
  const progress = (state.progress.current / state.progress.total) * 100;

  return (
    <Card className="border-indigo-200 bg-indigo-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-950">
          <Brain className="h-5 w-5 text-indigo-600" />
          Guided Mistake Correction
        </CardTitle>
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>{activity.title}</span>
            <span>{state.progress.current} of {state.progress.total}</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.misconceptionLabel && (
          <p className="text-sm"><strong>Target:</strong> {state.misconceptionLabel}</p>
        )}
        <div className="rounded-md border bg-white p-4 text-sm">
          <MathRenderer content={formatRemediationPrompt(activity.prompt)} />
        </div>

        {activity.responseType === "choice" ? (
          <div className="grid gap-2">
            {activity.options?.map((option: string) => (
              <Button key={option} type="button" variant={response === option ? "default" : "outline"} className="h-auto min-h-9 justify-start py-2 text-left" onClick={() => setResponse(option)}>
                <MathRenderer content={formatChoice(activity.id, option)} />
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="guided-correction-response" className="text-sm font-medium text-slate-700">
                Your correction
              </label>
              <NotationHelp onInsert={insertNotation} />
            </div>
            <Textarea
              id="guided-correction-response"
              ref={responseRef}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              onBlur={rememberResponseCursor}
              onSelect={rememberResponseCursor}
              className="min-h-24 bg-white font-mono text-sm"
              placeholder="Write your corrected step or response…"
            />
            {response.trim() && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm transition-all animate-in fade-in-0 slide-in-from-top-2">
                <div className="mb-2 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    Live Math Preview
                  </p>
                </div>
                <div className="overflow-x-auto break-words leading-relaxed text-slate-800">
                  <MathRenderer content={response} />
                </div>
              </div>
            )}
          </div>
        )}

        {feedback && (
          <div className="flex items-start gap-2 rounded-md border bg-white p-3 text-sm">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <MathRenderer content={feedback} />
          </div>
        )}

        <Button onClick={check} disabled={!response.trim() || submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Check this step
        </Button>
      </CardContent>
    </Card>
  );
}
