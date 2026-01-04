import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { MathRenderer } from "./MathRenderer";

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
  
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

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
    } finally {
        setLoadingIds(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const allCorrect = questions.every(q => feedbacks[q.id]?.isCorrect);

  return (
    <Card className="bg-blue-50/50 border-blue-100 mt-8">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
             <Sparkles className="h-5 w-5 text-blue-600" />
             Adaptive Practice
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
                            value={userAnswers[q.id] || ""} 
                            onChange={(e) => setUserAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                            placeholder="Enter your answer..."
                            className="max-w-xs"
                            disabled={feedbacks[q.id]?.isCorrect}
                        />
                        <Button 
                            onClick={() => handleSubmit(q)} 
                            disabled={!userAnswers[q.id] || loadingIds[q.id] || feedbacks[q.id]?.isCorrect}
                            size="sm"
                        >
                            {loadingIds[q.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                        </Button>
                    </div>

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
