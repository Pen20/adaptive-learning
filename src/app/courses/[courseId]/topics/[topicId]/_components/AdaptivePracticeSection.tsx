import AdaptivePractice from "@/components/AdaptivePractice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import type { PracticeRecommendations } from "../_types";

interface AdaptivePracticeSectionProps {
  allowPractice: boolean;
  recommendations: PracticeRecommendations | null;
  recommending: boolean;
  onGetRecommendations: () => void;
  onCompletePractice: () => void;
  onDismiss: () => void;
}

export function AdaptivePracticeSection({
  allowPractice,
  recommendations,
  recommending,
  onGetRecommendations,
  onCompletePractice,
  onDismiss,
}: AdaptivePracticeSectionProps) {
  if (!allowPractice) return null;

  if (!recommendations) {
    return (
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
              Struggling? Let AI generate 3 personalized practice questions
              based on your mistakes.
            </p>
            <Button onClick={onGetRecommendations} disabled={recommending}>
              {recommending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Get Recommended Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.questions.length > 0) {
    return (
      <AdaptivePractice
        questions={recommendations.questions}
        message={recommendations.message}
        onComplete={onCompletePractice}
      />
    );
  }

  return (
    <Card className="bg-blue-50/50 border-blue-100 mt-8">
      <CardContent className="pt-6 text-center py-8">
        <p className="text-blue-800 font-medium">{recommendations.message}</p>
        <Button variant="outline" className="mt-4" onClick={onDismiss}>
          Dismiss
        </Button>
      </CardContent>
    </Card>
  );
}
