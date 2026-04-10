"use client";
import { useState, useEffect, useRef } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { Loader2, Lightbulb, CheckCircle, XCircle, Sparkles, BookOpenIcon, ArrowLeft, Camera, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { CorrectionWidget } from "@/components/math/CorrectionWidget";
import { Id } from "../../../../../../convex/_generated/dataModel";


export default function ProblemPage() {
  const { user } = useUser();
  const params = useParams();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { isAdmin, isLoading: roleLoading } = useRole();

  // State
  const [finalAnswer, setFinalAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ grade: number; feedback: string; errorType?: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<Id<"submissions"> | null>(null);

  // Refs for cursor-aware notation insertion
  const reasoningRef = useRef<HTMLTextAreaElement>(null);
  const savedCursorRef = useRef({ start: 0, end: 0 });

  // Debounced State for Performance
  const [debouncedReasoning, setDebouncedReasoning] = useState("");

  // Dynamic Problem State
  const [problemData, setProblemData] = useState<{ statement: string; hint: string; solution: string; explanation?: string; guide?: { title: string; content: string }; title?: string } | null>(null);

  // Recommendation State
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<{ message: string; questions: any[] } | null>(null);

  // Image Upload State
  const [transcribing, setTranscribing] = useState(false);

  // Actions/Mutations
  const gradeWithJudge = useAction(api.grading.gradeWithJudge);
  const saveSubmission = useMutation(api.submissions.saveSubmission);
  const generatePractice = useAction(api.recommendations.generatePractice);
  const updateMastery = useMutation(api.users.updateMastery);
  const transcribeReasoning = useAction(api.grading.transcribeReasoning);

  // Permissions
  const normalizedCourseName = courseId === "linear_algebra" ? "Linear Algebra" : "Differential Calculus";
  const permissions = useQuery(api.permissions.getPermissions, { 
    courseName: normalizedCourseName, 
    topicName: topicId 
  });
  
  // Defaults to true if loading or not found (handled in backend query too, but good to be safe)
  // Watch the saved submission for background judge updates
  const liveSubmission = useQuery(
    api.submissions.getSubmission,
    lastSubmissionId ? { submissionId: lastSubmissionId } : "skip"
  );


  const allowHints = permissions?.allowHints ?? true;
  const allowSolution = permissions?.allowSolution ?? true;
  const allowDetailed = permissions?.allowDetailedSolution ?? true;
  const allowPractice = permissions?.allowPractice ?? true;
  const allowRLHF = permissions?.allowRLHF ?? true;
  const alwaysShowSolution = permissions?.alwaysShowSolution ?? false;

  // Debounce logic for reasoning preview
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedReasoning(reasoning), 500);
    return () => clearTimeout(timer);
  }, [reasoning]);

  useEffect(() => {
    if (topicRegistry[topicId]) {
      const engine = topicRegistry[topicId];
      const generated = engine.generate();
      
      // Normalize data from different engines
      setProblemData({
        statement: generated.statement,
        hint: generated.hint,
        solution: generated.solution || generated.domainSolution + ", " + generated.rangeSolution || "See explanation",
        explanation: generated.explanation,
        guide: engine.guide, // Optional guide from the engine
        title: generated.title
      });
      // Reset states
      setShowHint(false);
      setShowSolution(false);
      setShowExplanation(false);
      setResult(null);
      setReasoning("");
      setFinalAnswer("");
      setLastSubmissionId(null);
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

    try {
      // Run grader + judge inline — result shown only after both complete
      const gradeResult = await gradeWithJudge({
        problemStatement: problemData.statement,
        studentAnswer: finalAnswer,
        reasoning,
        model,
        topicName: topicId,
      });

      setResult({ grade: gradeResult.grade, feedback: gradeResult.feedback, errorType: gradeResult.errorType });

      // Save submission with judge results already included — skips background scheduling
      const subId = await saveSubmission({
        userId: user.id,
        courseName: courseId === "linear_algebra" ? "Linear Algebra" : "Differential Calculus",
        topicName: topicId,
        problemStatement: problemData.statement,
        finalAnswer,
        reasoningSteps: reasoning,
        grade: gradeResult.grade,
        aiFeedback: gradeResult.feedback,
        errorType: gradeResult.errorType,
        judgeFeedback: gradeResult.judgeMetadata?.judgeFeedback,
        isJudgeModified: gradeResult.judgeMetadata?.isJudgeModified,
        judgeConfidence: gradeResult.judgeMetadata?.judgeConfidence,
        usedHints: showHint,
        judgeAlreadyRun: true,
      });
      setLastSubmissionId(subId);

    } catch (error) {
      console.error("Grading failed:", error);
      toast.error("Grading failed. Please check your connection and try again.");
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
            topicName: topicId,
            currentProblemType: problemData?.title
        });
        setRecommendations(data);
    } catch (err) {
        console.error(err);
        toast.error("Could not generate recommendations. Please try again.");
    } finally {
        setRecommending(false);
    }
  };

  const handleCompletePractice = async () => {
      if (!user) return;
      await updateMastery({
          userId: user.id,
          topicName: topicId,
          scoreIncrement: 10,
      });
      toast.success("Practice Complete! +10 mastery points earned.");
      setRecommendations(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setTranscribing(true);
        try {
            const transcription = await transcribeReasoning({ image: base64 });
            setReasoning(prev => prev ? prev + "\n\n" + transcription : transcription);
        } catch (error) {
            console.error("Transcription failed:", error);
            toast.error("Failed to transcribe image. Please try again.");
        } finally {
            setTranscribing(false);
        }
    };
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
           <h1 className="text-3xl font-bold capitalize">{topicId.replace(/_/g, " ")} Practice</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">AI Grader:</span>
            <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Problem & Hints */}
        <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm transition-all">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 pt-4 px-6">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                         <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                         Problem Statement
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="text-lg text-slate-900 leading-relaxed font-medium bg-[#dae8e8] p-6 rounded-xl shadow-inner border border-[#c4d4d4] overflow-x-auto">
                        <MathRenderer content={problemData.statement} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
                {allowHints && (
                    <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint}>
                        <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                        {showHint ? "Hint Revealed" : "Need Help?"}
                    </Button>
                )}
                
                <NotationHelp onInsert={(code) => {
                    const { start, end } = savedCursorRef.current;
                    setReasoning(prev => {
                        const text = prev || '';
                        return text.slice(0, start) + code + text.slice(end);
                    });
                    savedCursorRef.current = { start: start + code.length, end: start + code.length };
                }} />

                {(allowSolution && (isAdmin || result !== null || alwaysShowSolution)) && (
                    <Button variant="outline" onClick={() => setShowSolution(!showSolution)}>
                        {showSolution ? "Hide Solution" : "Show Solution"}
                    </Button>
                )}

                {(allowDetailed && (isAdmin || result !== null || alwaysShowSolution)) && (
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20" onClick={() => setShowExplanation(!showExplanation)}>
                        {showExplanation ? "Hide Detailed Solution" : "Detailed Solution"}
                    </Button>
                )}
            </div>
            
            {showHint && allowHints && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Hint</AlertTitle>
                    <AlertDescription>
                        <MathRenderer content={problemData.hint} />
                    </AlertDescription>
                </Alert>
            )}

            {showSolution && allowSolution && (
                 <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Solution</AlertTitle>
                    <AlertDescription>
                        <MathRenderer content={problemData.solution} />
                    </AlertDescription>
                </Alert>
            )}

            {showExplanation && allowDetailed && problemData.explanation && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 mt-4">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-300">Step-by-Step Explanation</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                        <div className="text-lg space-y-4 max-w-full">
                            <MathRenderer content={problemData.explanation} />
                        </div>
                    </CardContent>
                </Card>
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
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <label className="text-sm font-semibold tracking-wide text-slate-700">Final Answer</label>
                        <Input 
                            className="bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 text-base py-6"
                            placeholder="Enter your final response here" 
                            value={finalAnswer}
                            onChange={(e) => setFinalAnswer(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <label className="text-sm font-semibold tracking-wide flex flex-col sm:flex-row sm:items-center gap-1">
                                    <span>Reasoning Steps</span> 
                                    <span className="text-muted-foreground font-normal text-xs">(Must include final answer for grading)</span>
                                </label>
                            </div>
                            <div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    id="reasoning-image-upload" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-2 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200 text-slate-700 shadow-sm transition-all" 
                                    onClick={() => document.getElementById("reasoning-image-upload")?.click()}
                                    disabled={transcribing}
                                >
                                    {transcribing ? <Loader2 className="h-3 w-3 animate-spin text-blue-600" /> : <Camera className="h-3 w-3 text-blue-600" />}
                                    <span className="hidden sm:inline">Scan</span>
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            ref={reasoningRef}
                            className="min-h-[160px] font-mono text-sm bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 resize-y leading-relaxed"
                            placeholder={"Type your steps here...\nExample: \"By definition, V is...\"\nUse $...$ for inline equations and $$...$$ for block equations."}
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            onBlur={() => {
                                if (reasoningRef.current) {
                                    savedCursorRef.current = { start: reasoningRef.current.selectionStart, end: reasoningRef.current.selectionEnd };
                                }
                            }}
                            onSelect={() => {
                                if (reasoningRef.current) {
                                    savedCursorRef.current = { start: reasoningRef.current.selectionStart, end: reasoningRef.current.selectionEnd };
                                }
                            }}
                        />
                        
                        {debouncedReasoning && (
                            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm transition-all animate-in fade-in-0 slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Live Math Preview</p>
                                </div>
                                <div className="text-slate-800 leading-relaxed break-words overflow-x-auto">
                                    <MathRenderer content={debouncedReasoning} />
                                </div>
                            </div>
                        )}
                    </div>

                    <Button 
                        className="w-full shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-6" 
                        size="lg" 
                        onClick={handleCheck} 
                        disabled={grading || !finalAnswer.trim() || !reasoning.trim()}
                    >
                        {grading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Grading and Analyzing...
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
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-semibold">AI Feedback:</p>
                                {result.errorType && (
                                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                        {result.errorType}
                                    </Badge>
                                )}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-md">
                                <MathRenderer content={result.feedback || "No feedback provided."} />
                            </div>
                        </div>

                        {(isAdmin || allowRLHF) && lastSubmissionId && user && (
                            <CorrectionWidget 
                                submissionId={lastSubmissionId}
                                initialGrade={result.grade}
                                initialFeedback={result.feedback}
                                topicName={topicId}
                                userId={user.id}
                                isAdmin={isAdmin}
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>

            {/* Recommendations Section */}
            {allowPractice && (
                !recommendations ? (
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
                ) : recommendations.questions.length > 0 ? (
                    <AdaptivePractice
                        questions={recommendations.questions}
                        message={recommendations.message}
                        onComplete={handleCompletePractice}
                    />
                ) : (
                    <Card className="bg-blue-50/50 border-blue-100 mt-8">
                        <CardContent className="pt-6 text-center py-8">
                            <p className="text-blue-800 font-medium">{recommendations.message}</p>
                            <Button variant="outline" className="mt-4" onClick={() => setRecommendations(null)}>
                                Dismiss
                            </Button>
                        </CardContent>
                    </Card>
                )
            )}
        </div>

    </div>
  );
}
