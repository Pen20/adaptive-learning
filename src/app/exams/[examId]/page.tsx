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
        <div className="container mx-auto py-10 max-w-4xl px-4">
            <Card className="mb-10 border-green-200 bg-gradient-to-b from-green-50 to-white shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500"></div>
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
                        <Button onClick={() => router.push("/exams")} variant="outline" className="mt-2 font-medium bg-white hover:bg-slate-50 transition-colors shadow-sm">Return to Exams List</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-10">
                {questions.map((q, idx) => {
                    const res = gradingResults[idx] as any;
                    const isCorrect = typeof res === 'object' ? res.grade === 1 : res === true;
                    return (
                        <Card key={idx} className={`overflow-hidden border shadow-sm transition-all hover:shadow-md ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                            <CardHeader className={`flex flex-row justify-between items-center py-4 px-6 border-b ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`font-bold px-3 py-1 border-2 shadow-sm ${isCorrect ? 'border-green-300 text-green-800 bg-green-100' : 'border-red-300 text-red-800 bg-red-100'}`}>
                                        Q{idx + 1}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isCorrect ? 
                                        <div className="flex items-center gap-2 text-green-700 font-bold bg-green-100/80 px-3 py-1.5 rounded-full text-sm shadow-sm border border-green-200">
                                            <CheckCircle className="h-4 w-4" /> Correct
                                        </div> : 
                                        <div className="flex items-center gap-2">
                                            {res?.errorType && <Badge variant="destructive" className="bg-white text-red-700 hover:bg-white border-red-200 shadow-sm px-3 py-1 font-semibold">{res.errorType}</Badge>}
                                            <div className="flex items-center gap-2 text-red-700 font-bold bg-red-100/80 px-3 py-1.5 rounded-full text-sm shadow-sm border border-red-200">
                                                <XCircle className="h-4 w-4" /> Incorrect
                                            </div>
                                        </div>
                                    }
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 px-6 pb-6 text-slate-800">
                                <div className="text-lg text-slate-900 font-medium bg-[#dae8e8] p-6 rounded-xl border border-[#c4d4d4] shadow-inner leading-relaxed overflow-x-auto">
                                    <MathRenderer content={q.statement} />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                            <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Reasoning</p>
                                        </div>
                                        <div className="text-sm font-mono text-slate-700 flex-grow whitespace-pre-wrap">
                                            <MathRenderer content={answers[idx] || "(No Reasoning Provided)"} />
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-xl border border-green-100 bg-green-50 flex flex-col shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-200/50">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Correct Solution</p>
                                        </div>
                                        <div className="text-sm text-slate-800 flex-grow pt-1 leading-relaxed">
                                            <MathRenderer content={q.solution} />
                                        </div>
                                    </div>
                                </div>

                                {res?.feedback && (
                                    <div className="mt-4 p-5 bg-blue-50/80 border border-blue-200 rounded-xl text-sm shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                        <div className="flex items-center gap-2 mb-3 border-b border-blue-100/50 pb-3">
                                            <Sparkles className="h-5 w-5 text-blue-600" /> 
                                            <p className="font-bold text-blue-900 text-base">AI Feedback</p>
                                        </div>
                                        <div className="text-blue-950/90 leading-relaxed font-medium">
                                            <MathRenderer content={res.feedback} />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm">
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                                        <div className="flex h-8 w-8 rounded-full bg-indigo-100 items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                        </div>
                                        <p className="font-bold text-slate-800 text-base">Step-by-Step Explanation</p>
                                    </div>
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
    <div className="container mx-auto py-10 max-w-3xl px-4 flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-200">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{exam.title}</h1>
            <p className="text-slate-500 font-medium mt-1">{exam.courseName}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold shadow-sm border border-blue-100">
             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
             <span>{questions.length} Questions</span>
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
                            className="gap-2 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200 text-slate-700 shadow-sm transition-all"
                            disabled={scanningIds[idx]}
                            onClick={() => document.getElementById(`scan-${idx}`)?.click()}
                        >
                            {scanningIds[idx] ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Camera className="h-4 w-4 text-blue-600" />}
                            Scan Solution
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
                            <label className="text-sm font-semibold tracking-wide">Reasoning Steps <span className="text-muted-foreground font-normal">(Required)</span></label>
                        </div>
                        <div className="space-y-3">
                             <Textarea 
                                className="min-h-[140px] font-mono text-sm bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 resize-y leading-relaxed"
                                placeholder={"Type your steps here...\nExample: \"By definition, V is...\"\nUse $...$ for inline equations and $$...$$ for block equations."}
                                value={answers[idx] || ""}
                                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                            />
                            {answers[idx] && (
                                <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm transition-all animate-in fade-in-0 slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Live Math Preview</p>
                                    </div>
                                    <div className="text-slate-800 leading-relaxed">
                                        <MathRenderer content={answers[idx]} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}

        <div className="flex justify-end pt-6 pb-12 mt-4 border-t border-slate-200">
            <Button size="lg" className="px-8 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold" onClick={handleSubmit} disabled={submitted || isGrading}>
                {isGrading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Grading and Analyzing...
                    </>
                ) : submitted ? "Submitted Successfully" : "Submit Exam for Grading"}
            </Button>
        </div>
      </div>
    </div>
  );
}
