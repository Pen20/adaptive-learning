"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { topicRegistry } from "@/data/topics";
import { MathRenderer } from "@/components/MathRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Camera, Clock, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function ExamPage() {
  const params = useParams();
  const examId = params.examId as string; 
  const router = useRouter();
  const { user } = useUser();

  const exam = useQuery(api.exams.getExam, { examId: examId as any });
  const submitExam = useMutation(api.exams.submitExam);
  const existingSubmission = useQuery(api.exams.getUserSubmission, { 
      examId: examId as any, 
      userId: user?.id || "" 
  });
  
  const transcribeReasoning = useAction(api.grading.transcribeReasoning);
  const gradeWithJudge = useAction(api.grading.gradeOptimized);

  const createSubmission = useMutation(api.exams.createExamSubmission);

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scanningIds, setScanningIds] = useState<Record<number, boolean>>({});

  const [isGrading, setIsGrading] = useState(false);
  const [gradingResults, setGradingResults] = useState<Record<number, boolean>>({});

  // Initialize or Resume Exam
  useEffect(() => {
    if (!exam || !user) return;

    const initExam = async () => {
        if (existingSubmission) {
            // Resume existing session
            if (existingSubmission.questions) {
                try {
                    setQuestions(JSON.parse(existingSubmission.questions));
                } catch (e) { console.error("Failed to parse questions", e); }
            }
            if (existingSubmission.answers) {
                try {
                    setAnswers(JSON.parse(existingSubmission.answers));
                } catch (e) { }
            }
            if (existingSubmission.status === "submitted") {
                setSubmitted(true);
                setScore(existingSubmission.score || 0);
                if (existingSubmission.results) {
                    try {
                        setGradingResults(JSON.parse(existingSubmission.results));
                    } catch (e) { }
                }
            }
        } else if (questions.length === 0) {
            // Start new session
            const generated = [];
            const count = exam.questionCount;
            const topics = exam.topics;
            
            // Verify we have topics
            if (topics.length > 0) {
                for (let i = 0; i < count; i++) {
                    // Use Round Robin to ensure even coverage of all selected topics
                    const topicId = topics[i % topics.length];
                    const engine = topicRegistry[topicId];
                    if (engine) {
                        generated.push({ ...engine.generate(), topicId });
                    }
                }
                
                // Shuffle questions so they aren't strictly ordered by topic (e.g. A, B, C, A, B, C)
                for (let i = generated.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [generated[i], generated[j]] = [generated[j], generated[i]];
                }
            }
            
            setQuestions(generated);
            
            // Persist the generated questions immediately
            await createSubmission({
                examId: exam._id,
                userId: user.id,
                questions: JSON.stringify(generated),
                totalQuestions: generated.length
            });
        }
    };

    initExam();
  }, [exam, existingSubmission, user]);

  const handleScan = async (file: File, questionIndex: number) => {
      if (file.size > 5 * 1024 * 1024) {
          alert("File too large");
          return;
      }

      setScanningIds(prev => ({ ...prev, [questionIndex]: true }));
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = reader.result as string;
              const text = await transcribeReasoning({ image: base64 });
              setAnswers(prev => ({
                  ...prev,
                  [questionIndex]: (prev[questionIndex] ? prev[questionIndex] + " " : "") + text
              }));
              setScanningIds(prev => ({ ...prev, [questionIndex]: false }));
          };
      } catch (err) {
          console.error(err);
          alert("Scan failed");
          setScanningIds(prev => ({ ...prev, [questionIndex]: false }));
      }
  };

  if (!exam || !user) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  if (existingSubmission && existingSubmission.status === "submitted" && !submitted) {
      // WaitForStateSync
      return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  // Handle "Results Pending" state (Submitted but results not released)
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
                       <Button onClick={() => router.push("/exams")} className="mt-6">Back to Exams</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (submitted && resultsAvailable) {
      // REVIEW MODE
      return (
        <div className="container mx-auto py-10 max-w-3xl px-4">
            <Card className="mb-8 border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h1 className="text-3xl font-bold mb-2">Exam Results</h1>
                    <p className="text-2xl font-semibold">Score: {score}%</p>
                    <Button onClick={() => router.push("/exams")} variant="outline" className="mt-4">Back to List</Button>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {questions.map((q, idx) => {
                    const res = gradingResults[idx] as any;
                    const isCorrect = typeof res === 'object' ? res.grade === 1 : res === true;
                    return (
                        <Card key={idx} className={`border-2 ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>Question {idx + 1}</CardTitle>
                                {isCorrect ? 
                                    <CheckCircle className="text-green-500 h-5 w-5" /> : 
                                    <div className="flex items-center gap-2">
                                        {res?.errorType && <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">{res.errorType}</Badge>}
                                        <XCircle className="text-red-500 h-5 w-5" />
                                    </div>
                                }
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-lg bg-slate-50 p-4 rounded-md">
                                    <MathRenderer content={q.statement} />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-md border bg-white">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Your Reasoning</p>
                                        <div className="text-sm">
                                            <MathRenderer content={answers[idx] || "(No Reasoning Provided)"} />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-md border bg-green-50 border-green-200">
                                        <p className="text-xs font-bold text-green-700 uppercase mb-1">Correct Solution</p>
                                        <div className="text-sm">
                                            <MathRenderer content={q.solution} />
                                        </div>
                                    </div>
                                </div>

                                {res?.feedback && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-900">
                                        <p className="font-bold mb-1 flex items-center gap-1">
                                            <Sparkles className="h-4 w-4" /> AI Feedback:
                                        </p>
                                        <MathRenderer content={res.feedback} />
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
                                    <p className="font-bold mb-1">Step-by-Step Explanation:</p>
                                    <MathRenderer content={q.explanation} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
      );
  }




  const handleSubmit = async () => {
      try {
          if (questions.length === 0) {
              alert("No questions to submit!");
              return;
          }

          setIsGrading(true);

          // Grade all questions in parallel using strict AI grading
          const gradingPromises = questions.map(async (q, idx) => {
              const studentReasoning = answers[idx]?.trim();
              if (!studentReasoning) return { idx, grade: 0, feedback: "No reasoning provided.", errorType: "Missing Answer" };

              try {
                  const result = await gradeWithJudge({
                      problemStatement: q.statement,
                      studentAnswer: "", // Extracting from reasoning in backend
                      reasoning: studentReasoning,
                      model: "gpt-4o-mini",
                      topicName: q.topicId
                  });
                  return { idx, ...result };
              } catch (e) {
                  console.error(`Grading failed for Q${idx + 1}`, e);
                  return { idx, grade: 0, feedback: "Grading system error.", errorType: "System Error" };
              }
          });

          const outcomes = await Promise.all(gradingPromises);
          
          const newResults: Record<number, any> = {};
          let correctCount = 0;
          
          outcomes.forEach(o => {
              newResults[o.idx] = {
                  grade: o.grade,
                  feedback: o.feedback,
                  errorType: o.errorType
              };
              if (o.grade === 1) correctCount++;
          });
          
          let calculatedScore = Math.round((correctCount / questions.length) * 100);
          if (isNaN(calculatedScore)) calculatedScore = 0;

          await submitExam({
              examId: exam._id,
              userId: user.id,
              answers: JSON.stringify(answers),
              score: calculatedScore,
              totalQuestions: questions.length,
              results: JSON.stringify(newResults),
          });
          
          setSubmitted(true);
          setScore(calculatedScore);
          setGradingResults(newResults);
      } catch (error: any) {
          console.error("Submit failed:", error);
          alert("Failed to submit exam: " + (error.message || "Unknown error"));
      } finally {
          setIsGrading(false);
      }
  };

  return (
    <div className="container mx-auto py-10 max-w-3xl px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">{exam.courseName}</p>
        </div>
        <div className="text-right">
             <p className="font-mono text-lg">Total Questions: {questions.length}</p>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q, idx) => (
            <Card key={idx}>
                <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
                    <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*"
                            id={`scan-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleScan(file, idx);
                            }}
                        />
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                            disabled={scanningIds[idx]}
                            onClick={() => document.getElementById(`scan-${idx}`)?.click()}
                        >
                            {scanningIds[idx] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            Scan Solution
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-lg">
                        <MathRenderer content={q.statement} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium leading-none">Reasoning Steps (Mandatory: Results based on logical steps)</label>
                        </div>
                        <div className="space-y-2">
                             <Textarea 
                                className="min-h-[120px] font-mono text-sm"
                                placeholder="Type your steps here... Use $...$ for equations."
                                value={answers[idx] || ""}
                                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                            />
                            {answers[idx] && (
                                <div className="mt-2 p-3 bg-slate-50 border rounded-md text-sm transition-all animate-in fade-in-0 slide-in-from-top-1">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Live Preview</p>
                                    <MathRenderer content={answers[idx]} />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}

        <div className="flex justify-end pt-4 pb-10">
            <Button size="lg" onClick={handleSubmit} disabled={submitted || isGrading}>
                {isGrading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Grading...
                    </>
                ) : submitted ? "Submitted" : "Submit Exam"}
            </Button>
        </div>
      </div>
    </div>
  );
}
