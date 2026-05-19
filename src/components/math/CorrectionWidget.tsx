"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CircleAlert, X, Send, AlertTriangle } from "lucide-react";

interface CorrectionWidgetProps {
  submissionId: Id<"submissions">;
  initialGrade: number;
  initialFeedback: string;
  topicName: string;
  userId: string;
  isAdmin: boolean;
}

export function CorrectionWidget({
  submissionId,
  initialGrade,
  initialFeedback,
  topicName,
  userId,
  isAdmin,
}: CorrectionWidgetProps) {
  const [correctedGrade, setCorrectedGrade] = useState(initialGrade);
  const [correctedFeedback, setCorrectedFeedback] = useState(initialFeedback);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitCorrection = useMutation(api.corrections.submitCorrection);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitCorrection({
        submissionId,
        correctedGrade,
        correctedFeedback,
        topicName,
        userId,
        bypassModeration: isAdmin,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit correction:", error);
      alert("Error submitting correction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-emerald-50 border-emerald-200 mt-4">
        <CardContent className="pt-6 text-center text-emerald-800">
          <Check className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">
            {isAdmin 
              ? "Correction applied successfully! This will now help guide the AI judge." 
              : "Thank you! Your feedback has been submitted for admin review."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          AI Grade or Feedback Incorrect?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <p className="text-xs font-medium text-amber-800">Correct Grade:</p>
          <div className="flex bg-white rounded-md border border-amber-200 overflow-hidden">
            <button
              onClick={() => setCorrectedGrade(1)}
              className={`px-3 py-1 flex items-center gap-1 text-xs transition-colors ${
                correctedGrade === 1 ? "bg-green-500 text-white" : "hover:bg-green-50 text-slate-600"
              }`}
            >
              <Check className="h-3 w-3" /> Correct
            </button>
            <button
              onClick={() => setCorrectedGrade(0.5)}
              className={`px-3 py-1 flex items-center gap-1 text-xs transition-colors ${
                correctedGrade === 0.5 ? "bg-amber-500 text-white" : "hover:bg-amber-50 text-slate-600"
              }`}
            >
              <CircleAlert className="h-3 w-3" /> Partial
            </button>
            <button
              onClick={() => setCorrectedGrade(0)}
              className={`px-3 py-1 flex items-center gap-1 text-xs transition-colors ${
                correctedGrade === 0 ? "bg-red-500 text-white" : "hover:bg-red-50 text-slate-600"
              }`}
            >
              <X className="h-3 w-3" /> Incorrect
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-800">Corrected/Refined Feedback:</p>
          <Textarea
            value={correctedFeedback}
            onChange={(e) => setCorrectedFeedback(e.target.value)}
            className="bg-white text-xs min-h-[80px] border-amber-200 focus-visible:ring-amber-500"
            placeholder="Help the AI understand why it was wrong..."
          />
        </div>

        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight text-amber-700 border-amber-200">
            {isAdmin ? "EXPERT EVALUATION" : "QUALITY REPORT"}
          </Badge>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 gap-2 text-amber-900 font-bold hover:bg-amber-100 border border-amber-200"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : isAdmin ? "Apply Expert Review" : "Submit for Review"}
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
