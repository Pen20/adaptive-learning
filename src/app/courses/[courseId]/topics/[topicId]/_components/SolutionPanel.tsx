import { MathRenderer } from "@/components/MathRenderer";
import { NotationHelp } from "@/components/math/NotationHelp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon, CheckCircle, Lightbulb } from "lucide-react";
import type { ProblemData } from "../_types";

interface SolutionPanelProps {
  problemData: ProblemData;
  allowHints: boolean;
  allowSolution: boolean;
  allowDetailed: boolean;
  alwaysShowSolution: boolean;
  isAdmin: boolean;
  hasResult: boolean;
  showHint: boolean;
  showSolution: boolean;
  showExplanation: boolean;
  onShowHint: () => void;
  onToggleSolution: () => void;
  onToggleExplanation: () => void;
  onInsertNotation: (code: string) => void;
}

export function SolutionPanel({
  problemData,
  allowHints,
  allowSolution,
  allowDetailed,
  alwaysShowSolution,
  isAdmin,
  hasResult,
  showHint,
  showSolution,
  showExplanation,
  onShowHint,
  onToggleSolution,
  onToggleExplanation,
  onInsertNotation,
}: SolutionPanelProps) {
  const canViewSolutions = isAdmin || hasResult || alwaysShowSolution;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowHints && (
          <Button variant="outline" onClick={onShowHint} disabled={showHint}>
            <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
            {showHint ? "Hint Revealed" : "Need Help?"}
          </Button>
        )}

        <NotationHelp onInsert={onInsertNotation} />

        {allowSolution && canViewSolutions && (
          <Button variant="outline" onClick={onToggleSolution}>
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
        )}

        {allowDetailed && canViewSolutions && (
          <Button
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
            onClick={onToggleExplanation}
          >
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
            <CardTitle className="text-blue-700 dark:text-blue-300">
              Step-by-Step Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="text-lg space-y-4 max-w-full">
              <MathRenderer content={problemData.explanation} />
            </div>
          </CardContent>
        </Card>
      )}

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
    </>
  );
}
