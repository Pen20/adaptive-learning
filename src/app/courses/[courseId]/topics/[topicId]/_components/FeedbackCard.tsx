import { MathRenderer } from "@/components/MathRenderer";
import { CorrectionWidget } from "@/components/math/CorrectionWidget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CircleAlert, XCircle } from "lucide-react";
import type { Id } from "@/lib/convex";
import type { GradingResult } from "../_types";

interface FeedbackCardProps {
  result: GradingResult;
  allowRLHF: boolean;
  isAdmin: boolean;
  lastSubmissionId: Id<"submissions"> | null;
  userId?: string;
  topicName: string;
}

function conciseFeedback(feedback: string, hasPedagogicalEvaluation: boolean) {
  if (!hasPedagogicalEvaluation) return feedback;
  const withoutVerdict = feedback.split(/\n\n\*\*Verdict:\*\*/)[0] ?? feedback;
  return withoutVerdict.split(/\n\n\*\*Learning focus:\*\*/)[0] ?? withoutVerdict;
}

export function FeedbackCard({
  result,
  allowRLHF,
  isAdmin,
  lastSubmissionId,
  userId,
  topicName,
}: FeedbackCardProps) {
  const isCorrect = result.grade >= 1;
  const isPartial = result.grade > 0 && result.grade < 1;
  const StatusIcon = isCorrect ? CheckCircle : isPartial ? CircleAlert : XCircle;
  const statusLabel = isCorrect ? "Correct!" : isPartial ? "Partially Correct" : "Keep Trying";
  const scoreLabel = `${Number.isInteger(result.grade) ? result.grade : Number(result.grade.toFixed(2))}/1`;
  const borderClass = isCorrect
    ? "border-l-green-500"
    : isPartial
      ? "border-l-amber-500"
      : "border-l-red-500";
  const iconClass = isCorrect
    ? "text-green-500"
    : isPartial
      ? "text-amber-500"
      : "text-red-500";
  const errorBadgeClass = isPartial
    ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
    : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";

  return (
    <Card className={`border-l-4 ${borderClass}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className={iconClass} />
          {statusLabel}
          <Badge variant="outline" className="ml-1 text-xs">
            {scoreLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold">AI Feedback:</p>
            {result.errorType && (
              <Badge
                variant="secondary"
                className={errorBadgeClass}
              >
                {result.errorType}
              </Badge>
            )}
          </div>
          <div className="bg-slate-50 p-4 rounded-md">
            <MathRenderer content={conciseFeedback(result.feedback || "No feedback provided.", !!result.pedagogicalEvaluation)} />
          </div>

          {result.pedagogicalEvaluation && (
            <div className="mt-4 space-y-3 rounded-md border border-indigo-100 bg-indigo-50/40 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Your approach</p>
                <p className="mt-1 text-sm text-slate-800">{result.pedagogicalEvaluation.techniqueLabel}</p>
              </div>
              {result.pedagogicalEvaluation.misconceptionLabel && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">First point to correct</p>
                  <p className="mt-1 text-sm text-slate-800">
                    Your reasoning diverges when applying: {result.pedagogicalEvaluation.misconceptionLabel.toLowerCase()}.
                  </p>
                </div>
              )}
              {result.pedagogicalEvaluation.remediationPrompt && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">How to improve your reasoning</p>
                  <div className="mt-1 text-sm text-slate-800">
                    <MathRenderer content={result.pedagogicalEvaluation.remediationPrompt} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {(isAdmin || allowRLHF) && lastSubmissionId && userId && (
          <CorrectionWidget
            submissionId={lastSubmissionId}
            initialGrade={result.grade}
            initialFeedback={result.feedback}
            topicName={topicName}
            userId={userId}
            isAdmin={isAdmin}
          />
        )}
      </CardContent>
    </Card>
  );
}
