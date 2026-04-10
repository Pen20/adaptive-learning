import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MathRenderer } from "./MathRenderer";
import { NotationHelp } from "./math/NotationHelp";

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
}

interface AdaptivePracticeProps {
  questions: Question[];
  message: string;
  onComplete: () => void;
}

export default function AdaptivePractice({ questions, message, onComplete }: AdaptivePracticeProps) {
  const checkAnswer = useAction(api.grading.checkPracticeAnswer);
  const transcribeReasoning = useAction(api.grading.transcribeReasoning);
  
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [scanningIds, setScanningIds] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const savedCursors = useRef<Record<string, { start: number; end: number }>>({});

  const handleSubmit = async (q: Question) => {
    const answer = userAnswers[q.id];
    if (!answer) return;

    setLoadingIds(prev => ({ ...prev, [q.id]: true }));
    
    try {
        const result = await checkAnswer({
            questionText: q.text,
            userAnswer: answer,
            correctAnswer: q.correctAnswer
        });
        setFeedbacks(prev => ({ ...prev, [q.id]: result }));
    } catch (error) {
        console.error("Error checking answer:", error);
        toast.error("Could not check answer. Please try again.");
    } finally {
        setLoadingIds(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const handleScan = async (q: Question, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please upload an image smaller than 5MB.");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result as string;
        setScanningIds(prev => ({ ...prev, [q.id]: true }));
        try {
            const transcription = await transcribeReasoning({ image: base64 });
            setUserAnswers(prev => ({ ...prev, [q.id]: transcription }));
        } catch (error) {
            console.error("Transcription failed:", error);
            toast.error("Failed to transcribe image. Please try again.");
        } finally {
            setScanningIds(prev => ({ ...prev, [q.id]: false }));
        }
    };
  };

  const allCorrect = questions.length > 0 && questions.every(q => feedbacks[q.id]?.isCorrect);

  return (
    <Card className="bg-blue-50/50 border-blue-100 mt-8">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
             <Sparkles className="h-5 w-5 text-blue-600" />
             Advanced Adaptive Practice 
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium text-blue-800 mb-4">{message}</p>
        <div className="space-y-6">
            {questions.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-md border shadow-sm">
                    <div className="mb-3 text-sm text-slate-800 overflow-x-auto">
                        <MathRenderer content={q.text} />
                    </div>
                    
                    <div className="flex gap-2 items-start">
                        <Input
                            ref={(el) => { if (el) inputRefs.current[q.id] = el; }}
                            value={userAnswers[q.id] || ""}
                            onChange={(e) => setUserAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                            placeholder="Enter your answer..."
                            className="max-w-xs"
                            disabled={feedbacks[q.id]?.isCorrect}
                            onBlur={() => {
                                const el = inputRefs.current[q.id];
                                if (el) savedCursors.current[q.id] = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
                            }}
                            onSelect={() => {
                                const el = inputRefs.current[q.id];
                                if (el) savedCursors.current[q.id] = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
                            }}
                        />

                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                id={`scan-${q.id}`}
                                className="hidden" 
                                onChange={(e) => handleScan(q, e)}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`scan-${q.id}`)?.click()}
                                disabled={scanningIds[q.id] || feedbacks[q.id]?.isCorrect}
                                title="Scan Solution"
                            >
                                {scanningIds[q.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </div>

                        <Button 
                            onClick={() => handleSubmit(q)} 
                            disabled={!userAnswers[q.id] || loadingIds[q.id] || feedbacks[q.id]?.isCorrect}
                            size="sm"
                        >
                            {loadingIds[q.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                        </Button>

                        {!feedbacks[q.id]?.isCorrect && (
                            <NotationHelp
                                onInsert={(code) => {
                                    const cursor = savedCursors.current[q.id] ?? { start: 0, end: 0 };
                                    setUserAnswers(prev => {
                                        const text = prev[q.id] || '';
                                        const newText = text.slice(0, cursor.start) + code + text.slice(cursor.end);
                                        savedCursors.current[q.id] = { start: cursor.start + code.length, end: cursor.start + code.length };
                                        return { ...prev, [q.id]: newText };
                                    });
                                }}
                            />
                        )}
                    </div>

                    {!feedbacks[q.id]?.isCorrect && userAnswers[q.id] && (
                        <div className="mt-3">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Live Preview:</p>
                            <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-sm overflow-x-auto min-h-[40px] flex items-center">
                                <MathRenderer content={userAnswers[q.id]} />
                            </div>
                        </div>
                    )}

                    {feedbacks[q.id] && (
                        <div className={`mt-3 text-sm p-3 rounded-md flex items-start gap-2 ${feedbacks[q.id].isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                            {feedbacks[q.id].isCorrect ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                            <div className="flex-1 overflow-x-auto min-w-0">
                                <MathRenderer content={feedbacks[q.id].feedback} />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {allCorrect && (
                <div className="pt-4 border-t border-blue-100">
                    <p className="text-sm text-blue-800 mb-2">Great work! You've completed all practice questions.</p>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onComplete}>
                        Mark Practice as Complete (+10 Mastery)
                    </Button>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
