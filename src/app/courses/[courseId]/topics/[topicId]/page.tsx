"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/hooks/useRole";
import { GuidedMistakeCorrection } from "./_components/GuidedMistakeCorrection";
import { AnswerPanel } from "./_components/AnswerPanel";
import { FeedbackCard } from "./_components/FeedbackCard";
import { ProblemStatementCard } from "./_components/ProblemStatementCard";
import { SolutionPanel } from "./_components/SolutionPanel";
import { useGeneratedProblem } from "./_hooks/useGeneratedProblem";
import { useImageTranscription } from "./_hooks/useImageTranscription";
import { useProblemGrading } from "./_hooks/useProblemGrading";
import { useProblemPermissions } from "./_hooks/useProblemPermissions";

export default function ProblemPage() {
  const { user } = useUser();
  const params = useParams();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { isAdmin } = useRole();

  const [finalAnswer, setFinalAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [useBestOfN, setUseBestOfN] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [debouncedReasoning, setDebouncedReasoning] = useState("");
  const [debouncedFinalAnswer, setDebouncedFinalAnswer] = useState("");

  const reasoningRef = useRef<HTMLTextAreaElement>(null);
  const savedCursorRef = useRef({ start: 0, end: 0 });

  const problemData = useGeneratedProblem(topicId);
  const permissions = useProblemPermissions(courseId, topicId);
  const { transcribing, handleImageUpload } =
    useImageTranscription(setReasoning);
  const { grading, result, lastSubmissionId, handleCheck } = useProblemGrading({
    userId: user?.id,
    courseId,
    topicId,
    problemData,
    finalAnswer,
    reasoning,
    model,
    usedHints: showHint,
    useBestOfN,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedReasoning(reasoning), 500);
    return () => clearTimeout(timer);
  }, [reasoning]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFinalAnswer(finalAnswer), 300);
    return () => clearTimeout(timer);
  }, [finalAnswer]);

  useEffect(() => {
    setShowHint(false);
    setShowSolution(false);
    setShowExplanation(false);
    setReasoning("");
    setFinalAnswer("");
  }, [topicId]);

  const rememberReasoningCursor = () => {
    if (!reasoningRef.current) return;

    savedCursorRef.current = {
      start: reasoningRef.current.selectionStart,
      end: reasoningRef.current.selectionEnd,
    };
  };

  const insertNotation = (code: string) => {
    const { start, end } = savedCursorRef.current;
    setReasoning((previous) => {
      const text = previous || "";
      return text.slice(0, start) + code + text.slice(end);
    });
    savedCursorRef.current = {
      start: start + code.length,
      end: start + code.length,
    };
  };

  const handleAutoFill = () => {
    if (!problemData) return;

    const final = problemData.solution?.trim() || "";
    const reasoningText = [
      problemData.explanation?.trim(),
      final ? `Final answer: ${final}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    setFinalAnswer(final);
    setReasoning(reasoningText || final);
    toast.success("Answer and reasoning filled for testing.");
  };

  if (!problemData) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto" />
        Loading Problem...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/courses/${courseId}/topics`}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Topics
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Badge variant="outline" className="mb-2 uppercase tracking-wide">
            {courseId.replace("_", " ")}
          </Badge>
          <h1 className="text-3xl font-bold capitalize">
            {topicId.replace(/_/g, " ")} Practice
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            AI Grader:
          </span>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
            </SelectContent>
          </Select>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
              useBestOfN
                ? "border-violet-400 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-medium whitespace-nowrap">
              Best-of-3 RLHF
            </span>
            <Switch
              checked={useBestOfN}
              onCheckedChange={setUseBestOfN}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ProblemStatementCard statement={problemData.statement} />
          <SolutionPanel
            problemData={problemData}
            allowHints={permissions.allowHints}
            allowSolution={permissions.allowSolution}
            allowDetailed={permissions.allowDetailed}
            alwaysShowSolution={permissions.alwaysShowSolution}
            isAdmin={isAdmin}
            hasResult={result !== null}
            showHint={showHint}
            showSolution={showSolution}
            showExplanation={showExplanation}
            onShowHint={() => setShowHint(true)}
            onToggleSolution={() => setShowSolution((visible) => !visible)}
            onToggleExplanation={() =>
              setShowExplanation((visible) => !visible)
            }
            onInsertNotation={insertNotation}
          />
        </div>

        <div className="space-y-6">
          <AnswerPanel
            finalAnswer={finalAnswer}
            setFinalAnswer={setFinalAnswer}
            debouncedFinalAnswer={debouncedFinalAnswer}
            reasoning={reasoning}
            setReasoning={setReasoning}
            debouncedReasoning={debouncedReasoning}
            answerFormat={problemData.answerFormat}
            reasoningRef={reasoningRef}
            onRememberCursor={rememberReasoningCursor}
            onImageUpload={handleImageUpload}
            transcribing={transcribing}
            grading={grading}
            onAutoFill={
              isAdmin || process.env.NODE_ENV !== "production"
                ? handleAutoFill
                : undefined
            }
            onCheck={handleCheck}
          />

          {result && (
            <>
              <FeedbackCard
                result={result}
                allowRLHF={permissions.allowRLHF}
                isAdmin={isAdmin}
                lastSubmissionId={lastSubmissionId}
                userId={user?.id}
                topicName={topicId}
              />
              {topicId === "determinants" && result.grade < 1 && lastSubmissionId && permissions.allowPractice && (
                <GuidedMistakeCorrection
                  submissionId={lastSubmissionId}
                  evaluation={result.pedagogicalEvaluation}
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
