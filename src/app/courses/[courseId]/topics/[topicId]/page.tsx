"use client";
import { useState, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api"; 
import { topicRegistry } from "@/data/topics";
import { BlockMath, InlineMath } from "react-katex";
import { MathRenderer } from "@/components/MathRenderer";
import { NotationHelp } from "@/components/math/NotationHelp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import AdaptivePractice from "@/components/AdaptivePractice";
import { Loader2, Lightbulb, CheckCircle, XCircle, Sparkles, BookOpenIcon, ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function ProblemPage() {
  const { user } = useUser();
  const params = useParams();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;

  // State
  const [finalAnswer, setFinalAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [model, setModel] = useState("mistral");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ grade: number; feedback: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Dynamic Problem State
  const [problemData, setProblemData] = useState<{ statement: string; hint: string; solution: string; guide?: { title: string; content: string } } | null>(null);

  // Recommendation State
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<{ message: string; questions: any[] } | null>(null);

            {/* Recommendations Section */}


  // Actions/Mutations
  const gradeSubmission = useAction(api.grading.gradeSubmission);
  const saveSubmission = useMutation(api.submissions.saveSubmission);
  const generatePractice = useAction(api.recommendations.generatePractice);
  const updateMastery = useMutation(api.users.updateMastery);

  useEffect(() => {
    if (topicRegistry[topicId]) {
      const engine = topicRegistry[topicId];
      const generated = engine.generate();
      
      // Normalize data from different engines
      setProblemData({
        statement: generated.statement,
        hint: generated.hint,
        solution: generated.solution || generated.domainSolution + ", " + generated.rangeSolution || "See explanation",
        guide: engine.guide // Optional guide from the engine
      });
    } else {
        // Fallback for linear algebra topics not in registry yet
        setProblemData({
            statement: "Problem generator not implemented for this topic yet.",
            hint: "Check back later.",
            solution: "N/A"
        });
    }
  }, [topicId]);

  if (!problemData) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" />Loading Problem...</div>;

  const handleCheck = async () => {
    if (!user || !problemData) return;
    setGrading(true);
    setResult(null);

    setResult(null);

    try {
      const gradeResult = await gradeSubmission({
        problemStatement: problemData.statement,
        studentAnswer: finalAnswer,
        reasoning,
        model,
      });

      setResult(gradeResult);

      // Only save if it's a valid grade/feedback, or we can save failed attempts too with strict checks
      // If feedback contains "Error", maybe dont save? 
      // Actually saving it is fine, just maybe 0 grade.
      if (!gradeResult.feedback.includes("Error")) {
          await saveSubmission({
            userId: user.id,
            courseName: courseId === "linear_algebra" ? "Linear Algebra" : "Differential Calculus",
            topicName: topicId,
            problemStatement: problemData.statement,
            finalAnswer,
            reasoningSteps: reasoning,
            grade: gradeResult.grade,
            aiFeedback: gradeResult.feedback,
            usedHints: showHint,
          });
      }

    } catch (error) {
      console.error("Grading failed:", error);
      // Since we handle errors in the action, this catch usually catches network/convex client errors
      alert("Network error or server unreachable.");
    } finally {
      setGrading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!user) return;
    setRecommending(true);
    try {
        const data = await generatePractice({
            userId: user.id,
            courseName: courseId === "linear_algebra" ? "Linear Algebra" : "Differential Calculus",
            topicName: topicId
        });
        setRecommendations(data);
    } catch (err) {
        console.error(err);
    } finally {
        setRecommending(false);
    }
  };

  const handleCompletePractice = async () => {
      if (!user) return;
      await updateMastery({
          userId: user.id,
          topicName: topicId,
          scoreIncrement: 10 // +10 mastery for completing practice
      });
      alert("Practice Complete! Mastery score updated.");
      setRecommendations(null); // Clear practice
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href={`/courses/${courseId}/topics`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Topics
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <Badge variant="outline" className="mb-2 uppercase tracking-wide">{courseId.replace("_", " ")}</Badge>
           <h1 className="text-3xl font-bold capitalize">{topicId.replace("_", " ")} Practice</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">AI Grader:</span>
            <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mistral">Mistral 7B</SelectItem>
                    <SelectItem value="llama3">Llama 3 (8B)</SelectItem>
                    <SelectItem value="phi3">Phi-3 Mini</SelectItem>
                    <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Problem & Hints */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Problem</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-lg py-4">
                        <MathRenderer content={problemData.statement} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint}>
                    <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                    {showHint ? "Hint Revealed" : "Need Help?"}
                </Button>
                
                <NotationHelp />

                <Button variant="outline" onClick={() => setShowSolution(!showSolution)}>
                    {showSolution ? "Hide Solution" : "Show Solution"}
                </Button>
            </div>
            
            {showHint && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Hint</AlertTitle>
                    <AlertDescription>
                        <MathRenderer content={problemData.hint} />
                    </AlertDescription>
                </Alert>
            )}

            {showSolution && (
                 <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Solution</AlertTitle>
                    <AlertDescription>
                        <BlockMath math={problemData.solution} />
                    </AlertDescription>
                </Alert>
            )}

            {/* Recommendations Section */}
            {!recommendations ? (
                <Card className="bg-blue-50/50 border-blue-100 mt-8">
                    <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                             <Sparkles className="h-5 w-5 text-blue-600" />
                             Adaptive Practice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">
                                Struggling? Let AI generate 3 personalized practice questions based on your mistakes.
                            </p>
                            <Button onClick={handleGetRecommendations} disabled={recommending}>
                                {recommending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Get Recommended Questions
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <AdaptivePractice 
                    questions={recommendations.questions} 
                    message={recommendations.message} 
                    onComplete={handleCompletePractice} 
                />
            )}

            {/* Math Guide / Cheatsheet */}
            {problemData.guide && (
                 <Card className="bg-amber-50/50 border-amber-100 mt-8">
                    <CardHeader>
                        <CardTitle className="text-amber-900 flex items-center gap-2">
                             <BookOpenIcon className="h-5 w-5 text-amber-600" />
                             {problemData.guide.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-2 text-amber-900/80">
                            <MathRenderer content={problemData.guide.content} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Right Col: Input & Live Preview */}
        <div className="space-y-6">
            <Card className="border-2 border-slate-100">
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Final Answer</label>
                        <Input 
                            placeholder="Enter your final response here" 
                            value={finalAnswer}
                            onChange={(e) => setFinalAnswer(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Reasoning Steps (LaTeX supported)</label>
                        <Textarea 
                            className="min-h-[150px] font-mono text-sm"
                            placeholder="Type your steps here... Use $...$ for equations."
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">
                            Live Preview:
                        </div>
                        <div className="p-3 bg-slate-50 rounded-md border min-h-[40px] text-sm break-words">
                           {reasoning ? <MathRenderer content={reasoning} /> : <span className="text-slate-400 italic">Preview appears here...</span>}
                        </div>
                    </div>

                    <Button 
                        className="w-full" 
                        size="lg" 
                        onClick={handleCheck} 
                        disabled={grading || !finalAnswer}
                    >
                        {grading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Grading with AI...
                            </>
                        ) : (
                            "Check Answer"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Result Display */}
            {result && (
                <Card className={`border-l-4 ${result.grade === 1 ? "border-l-green-500" : "border-l-red-500"}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {result.grade === 1 ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                            {result.grade === 1 ? "Correct!" : "Keep Trying"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            <p className="font-semibold mb-2">AI Feedback:</p>
                            <div className="bg-slate-50 p-4 rounded-md">
                                <MathRenderer content={result.feedback || "No feedback provided."} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
