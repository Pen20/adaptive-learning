"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { errorMessage } from "@/lib/errors";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { topicRegistry } from "@/data/topics";
import type { GeneratedProblem } from "@/data/topics";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MathRenderer } from "@/components/MathRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock, Sparkles, Camera } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  SCAN_IMAGE_ACCEPT,
  SCAN_IMAGE_TYPE_LABEL,
  validateScanImageFile,
} from "@/lib/scanUpload";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// An exam question is a generated problem plus the topic it was drawn from.
type ExamQuestion = GeneratedProblem & { topicId: string };

// Shape produced by gradeWithMarkingScheme (see the JSON contract in
// convex/grading.ts): one entry per marking-scheme criterion.
type CriterionResult = {
  id?: string;
  met: boolean;
  reason: string;
  awarded: number;
  marks?: number;
};

type GradingOutcome = {
  grade: number;
  feedback: string;
  errorType?: string;
  criteriaResults: CriterionResult[];
};

export default function ExamPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const { user } = useUser();

  const exam = useQuery(api.exams.getExam, { examId: examId as Id<"exams"> });
  const submitExam = useMutation(api.exams.submitExam);
  const saveAnswers = useMutation(api.exams.saveExamAnswers);
  const existingSubmission = useQuery(api.exams.getUserSubmission, {
    examId: examId as Id<"exams">,
  });

  const transcribeReasoning = useAction(api.grading.transcribeReasoning);
  const gradeOptimized = useAction(api.grading.gradeOptimized);
  const gradeWithMarkingScheme = useAction(api.grading.gradeWithMarkingScheme);
  const createSubmission = useMutation(api.exams.createExamSubmission);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scanningIds, setScanningIds] = useState<Record<number, boolean>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResults, setGradingResults] = useState<Record<number, GradingOutcome>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize or resume exam
  useEffect(() => {
    if (!exam || !user) return;

    const initExam = async () => {
      if (existingSubmission) {
        if (existingSubmission.questions) {
          try {
            setQuestions(JSON.parse(existingSubmission.questions));
          } catch (e) {
            console.error("Failed to parse saved questions", e);
            toast.error("Could not restore exam questions. Please contact support.");
          }
        }
        if (existingSubmission.answers) {
          try {
            setAnswers(JSON.parse(existingSubmission.answers));
          } catch (e) {
            console.error("Failed to parse saved answers", e);
          }
        }
        if (existingSubmission.status === "submitted") {
          setSubmitted(true);
          setScore(existingSubmission.score ?? 0);
          if (existingSubmission.results) {
            try {
              setGradingResults(JSON.parse(existingSubmission.results));
            } catch (e) {
              console.error("Failed to parse grading results", e);
            }
          }
        }
      } else if (questions.length === 0) {
        const generated: ExamQuestion[] = [];
        const count = exam.questionCount;
        const topics = exam.topics;

        if (topics.length > 0) {
          for (let i = 0; i < count; i++) {
            const topicId = topics[i % topics.length];
            const engine = topicRegistry[topicId];
            if (engine) {
              generated.push({ ...engine.generate(), topicId });
            }
          }
          for (let i = generated.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [generated[i], generated[j]] = [generated[j], generated[i]];
          }
        }

        setQuestions(generated);
        await createSubmission({
          examId: exam._id,
          userId: user.id,
          questions: JSON.stringify(generated),
          totalQuestions: generated.length,
        });
      }
    };

    initExam();
  }, [exam, existingSubmission, user]);

  // Countdown timer
  useEffect(() => {
    if (!exam || submitted) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((exam.endDate - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        toast.warning("Time is up! Submitting your exam...");
        // auto-submit is handled by the parent effect below
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [exam, submitted]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!exam || !user || submitted || questions.length === 0) return;
    autoSaveRef.current = setInterval(async () => {
      try {
        await saveAnswers({ examId: exam._id, userId: user.id, answers: JSON.stringify(answers) });
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [exam, user, submitted, answers, questions.length]);

  const handleScan = async (file: File, questionIndex: number) => {
    const validationError = validateScanImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setScanningIds((prev) => ({ ...prev, [questionIndex]: true }));
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const text = await transcribeReasoning({ image: base64 });
          setAnswers((prev) => ({
            ...prev,
            [questionIndex]: (prev[questionIndex] ? prev[questionIndex] + " " : "") + text,
          }));
        } catch {
          toast.error("Scan failed. Please try again.");
        } finally {
          setScanningIds((prev) => ({ ...prev, [questionIndex]: false }));
        }
      };
    } catch {
      toast.error("Scan failed. Please try again.");
      setScanningIds((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const handleSubmit = useCallback(async (force = false) => {
    if (!force && !window.confirm("Are you sure you want to submit? You cannot change your answers after submission.")) {
      return;
    }
    if (questions.length === 0) {
      toast.error("No questions to submit.");
      return;
    }

    setIsGrading(true);
    try {
      // Parse per-question marking schemes if defined on the exam
      const schemesMap: Record<string, { id: string; description: string; marks: number }[]> =
        exam?.markingSchemes ? JSON.parse(exam.markingSchemes) : {};

      const gradingPromises = questions.map(async (q, idx) => {
        const studentReasoning = answers[idx]?.trim();
        if (!studentReasoning) {
          return { idx, grade: 0, feedback: "No reasoning provided.", errorType: "Missing Answer", criteriaResults: [] };
        }
        try {
          const criteria = schemesMap[String(idx)];
          if (criteria && criteria.length > 0) {
            // Use rubric-based partial marking
            const result = await gradeWithMarkingScheme({
              problemStatement: q.statement,
              studentAnswer: "",
              studentReasoning,
              topicName: q.topicId,
              model: "gpt-4o-mini",
              criteria,
            });
            return { idx, ...result };
          } else {
            // Fall back to binary grading
            const result = await gradeOptimized({
              problemStatement: q.statement,
              studentAnswer: "",
              reasoning: studentReasoning,
              model: "gpt-4o-mini",
              topicName: q.topicId,
            });
            return { idx, ...result, criteriaResults: [] };
          }
        } catch (e) {
          console.error(`Grading failed for Q${idx + 1}`, e);
          return { idx, grade: 0, feedback: "Grading system error.", errorType: "System Error", criteriaResults: [] };
        }
      });

      const outcomes = await Promise.all(gradingPromises);
      const newResults: Record<number, GradingOutcome> = {};
      let totalGradeSum = 0;

      outcomes.forEach((o) => {
        newResults[o.idx] = {
          grade: o.grade,
          feedback: o.feedback,
          errorType: o.errorType,
          criteriaResults: "criteriaResults" in o ? (o.criteriaResults ?? []) : [],
        };
        totalGradeSum += o.grade;
      });

      const calculatedScore = questions.length > 0
        ? Math.round((totalGradeSum / questions.length) * 100)
        : 0;

      await submitExam({
        examId: exam!._id,
        userId: user!.id,
        answers: JSON.stringify(answers),
        score: calculatedScore,
        totalQuestions: questions.length,
        results: JSON.stringify(newResults),
      });

      setSubmitted(true);
      setScore(calculatedScore);
      setGradingResults(newResults);
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit exam: " + errorMessage(error));
    } finally {
      setIsGrading(false);
    }
  }, [questions, answers, gradeOptimized, submitExam, exam, user]);

  if (!exam || !user) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (existingSubmission && existingSubmission.status === "submitted" && !submitted) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const resultsAvailable = exam.feedbackMode === "immediate" || exam.resultsReleased;

  if (submitted && !resultsAvailable) {
    return (
      <div className="container mx-auto py-10 max-w-2xl text-center">
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <Clock className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold mb-2">Exam Submitted</h1>
            <p className="text-xl">Your results have been recorded.</p>
            <p className="text-muted-foreground mt-4">
              Full results and solutions will be available after the instructor releases them.
            </p>
            <Button onClick={() => router.push("/exams")} className="mt-6">
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && resultsAvailable) {
    return (
      <div className="container mx-auto py-10 max-w-4xl px-4">
        <Card className="mb-10 border-green-200 bg-gradient-to-b from-green-50 to-white shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500" />
          <CardContent className="pt-8 pb-8 text-center relative z-10">
            <div className="inline-flex justify-center items-center h-20 w-20 rounded-full bg-green-100 mb-6 shadow-inner">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 text-slate-900 tracking-tight">Exam Results</h1>
            <div className="inline-flex items-center justify-center bg-white px-6 py-2 rounded-full border border-green-200 shadow-sm mt-2 mb-6 gap-3">
              <span className="text-lg font-medium text-slate-600 uppercase tracking-wide">Final Score</span>
              <span className="text-2xl font-extrabold text-green-600">{score}%</span>
            </div>
            <div>
              <Button onClick={() => router.push("/exams")} variant="outline" className="mt-2 font-medium bg-white hover:bg-slate-50 transition-colors shadow-sm">
                Return to Exams List
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-10">
          {questions.map((q, idx) => {
            const res = gradingResults[idx];
            const grade = res?.grade ?? 0;
            const isFullMark = grade === 1;
            const isPartial = grade > 0 && grade < 1;
            const isZero = grade === 0;
            const hasCriteria = res?.criteriaResults?.length > 0;
            const borderColor = isFullMark ? "border-green-200" : isPartial ? "border-yellow-200" : "border-red-200";
            const headerBg = isFullMark ? "bg-green-50/50 border-green-100" : isPartial ? "bg-yellow-50/50 border-yellow-100" : "bg-red-50/50 border-red-100";
            return (
              <Card key={idx} className={`overflow-hidden border shadow-sm transition-all hover:shadow-md ${borderColor}`}>
                <CardHeader className={`flex flex-row justify-between items-center py-4 px-6 border-b ${headerBg}`}>
                  <Badge variant="outline" className={`font-bold px-3 py-1 border-2 shadow-sm ${isFullMark ? "border-green-300 text-green-800 bg-green-100" : isPartial ? "border-yellow-300 text-yellow-800 bg-yellow-100" : "border-red-300 text-red-800 bg-red-100"}`}>
                    Q{idx + 1}
                  </Badge>
                  <div className="flex items-center gap-3">
                    {hasCriteria ? (
                      <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-full text-sm shadow-sm border ${isFullMark ? "text-green-700 bg-green-100/80 border-green-200" : isPartial ? "text-yellow-700 bg-yellow-100/80 border-yellow-200" : "text-red-700 bg-red-100/80 border-red-200"}`}>
                        {isFullMark ? <CheckCircle className="h-4 w-4" /> : isZero ? <XCircle className="h-4 w-4" /> : null}
                        {grade} / 1
                      </div>
                    ) : isFullMark ? (
                      <div className="flex items-center gap-2 text-green-700 font-bold bg-green-100/80 px-3 py-1.5 rounded-full text-sm shadow-sm border border-green-200">
                        <CheckCircle className="h-4 w-4" /> Correct
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {res?.errorType && (
                          <Badge variant="destructive" className="bg-white text-red-700 hover:bg-white border-red-200 shadow-sm px-3 py-1 font-semibold">
                            {res.errorType}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-red-700 font-bold bg-red-100/80 px-3 py-1.5 rounded-full text-sm shadow-sm border border-red-200">
                          <XCircle className="h-4 w-4" /> Incorrect
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 px-6 pb-6 text-slate-800">
                  <div className="text-lg text-slate-900 font-medium bg-[#dae8e8] p-6 rounded-xl border border-[#c4d4d4] shadow-inner leading-relaxed overflow-x-auto">
                    <MathRenderer content={q.statement} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-3 border-b border-slate-100">Your Reasoning</p>
                      <div className="text-sm font-mono text-slate-700 flex-grow whitespace-pre-wrap">
                        <MathRenderer content={answers[idx] || "(No Reasoning Provided)"} />
                      </div>
                    </div>
                    <div className="p-5 rounded-xl border border-green-100 bg-green-50 flex flex-col shadow-sm">
                      <p className="text-xs font-bold text-green-800 uppercase tracking-widest mb-3 pb-3 border-b border-green-200/50">Correct Solution</p>
                      <div className="text-sm text-slate-800 flex-grow pt-1 leading-relaxed">
                        <MathRenderer content={q.solution} />
                      </div>
                    </div>
                  </div>
                  {res?.criteriaResults?.length > 0 && (
                    <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm">
                      <p className="font-bold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-200">Marking Breakdown</p>
                      <div className="space-y-2">
                        {res.criteriaResults.map((c, ci) => (
                          <div key={ci} className={`flex items-start gap-3 p-3 rounded-lg border ${c.met ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            <div className={`mt-0.5 shrink-0 ${c.met ? "text-green-600" : "text-red-500"}`}>
                              {c.met ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-600 leading-snug">{c.reason}</p>
                            </div>
                            <span className={`shrink-0 text-xs font-bold ${c.met ? "text-green-700" : "text-red-600"}`}>
                              {c.awarded}/{c.awarded > 0 ? c.awarded : (res.criteriaResults[ci]?.marks ?? "?")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {res?.feedback && (
                    <div className="mt-4 p-5 bg-blue-50/80 border border-blue-200 rounded-xl text-sm shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                      <div className="flex items-center gap-2 mb-3 border-b border-blue-100/50 pb-3 pl-3">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <p className="font-bold text-blue-900 text-base">AI Feedback</p>
                      </div>
                      <div className="text-blue-950/90 leading-relaxed font-medium pl-3">
                        <MathRenderer content={res.feedback} />
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm">
                    <p className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-200">Step-by-Step Explanation</p>
                    <div className="leading-relaxed text-slate-700">
                      <MathRenderer content={q.explanation} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl px-4 flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{exam.title}</h1>
          <p className="text-slate-500 font-medium mt-1">{exam.courseName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold shadow-sm border border-blue-100">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{questions.length} Questions</span>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-sm border ${timeLeft < 300 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-700 border-slate-200"}`}>
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 flex-grow">
        {questions.map((q, idx) => (
          <Card key={idx} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center bg-slate-50/80 border-b border-slate-100 pb-4 pt-4 px-6">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold px-3 py-1 shadow-sm border border-blue-200">
                  Q{idx + 1}
                </Badge>
                <CardTitle className="text-lg font-semibold text-slate-800 hidden sm:block">Question</CardTitle>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept={SCAN_IMAGE_ACCEPT}
                  id={`scan-${idx}`}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScan(file, idx);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200 text-slate-700 shadow-sm transition-all"
                  disabled={scanningIds[idx]}
                  onClick={() => document.getElementById(`scan-${idx}`)?.click()}
                  aria-label="Scan handwritten solution"
                  title={`Scan ${SCAN_IMAGE_TYPE_LABEL} image`}
                >
                  {scanningIds[idx] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <Camera className="h-4 w-4 text-blue-600" />
                  )}
                  Scan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 px-6 pb-6">
              <div className="text-lg text-slate-900 leading-relaxed font-medium bg-[#dae8e8] p-6 rounded-xl shadow-inner border border-[#c4d4d4] overflow-x-auto">
                <MathRenderer content={q.statement} />
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <label className="text-sm font-semibold tracking-wide">
                    Reasoning Steps <span className="text-muted-foreground font-normal">(Required)</span>
                  </label>
                </div>
                <Textarea
                  className="min-h-[140px] font-mono text-sm bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 resize-y leading-relaxed"
                  placeholder={"Type your steps here...\nUse $...$ for inline equations and $$...$$ for block equations."}
                  value={answers[idx] || ""}
                  onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                  aria-label={`Reasoning for question ${idx + 1}`}
                />
                {answers[idx] && (
                  <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Live Preview</p>
                    <div className="text-slate-800 leading-relaxed">
                      <MathRenderer content={answers[idx]} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end pt-6 pb-12 mt-4 border-t border-slate-200">
          <Button
            size="lg"
            className="px-8 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
            onClick={() => handleSubmit(false)}
            disabled={submitted || isGrading}
          >
            {isGrading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Grading and Analyzing...
              </>
            ) : submitted ? (
              "Submitted Successfully"
            ) : (
              "Submit Exam for Grading"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
