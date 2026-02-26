"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";

export function CorrectionModerator() {
  const pendingCorrections = useQuery(api.corrections.getPendingCorrections);
  const approvedHistory = useQuery(api.corrections.getRecentApprovedCorrections, { limit: 10 });
  const approve = useMutation(api.corrections.approveCorrection);
  const reject = useMutation(api.corrections.rejectCorrection);

  if (pendingCorrections === undefined) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (pendingCorrections.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No pending corrections to review.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue ({pendingCorrections.length})</CardTitle>
          <CardDescription>
            Review student-submitted corrections. Once approved, they will be used as expert examples to guide future AI judgments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingCorrections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No pending corrections.</p>
            ) : (
              pendingCorrections.map((correction) => (
                <div key={correction._id} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge variant="outline" className="capitalize">{correction.topicName.replace(/_/g, " ")}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted on {new Date(correction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => approve({ correctionId: correction._id })}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => reject({ correctionId: correction._id })}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Corrected Grade</p>
                      <Badge className={correction.correctedGrade === 1 ? "bg-green-500" : "bg-red-500"}>
                        {correction.correctedGrade === 1 ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Suggested Feedback</p>
                      <div className="text-sm p-3 bg-slate-50 rounded-md border text-slate-700 italic">
                        {correction.correctedFeedback}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 italic text-[10px] text-slate-400 flex items-center gap-1">
                    Submission ID: {correction.submissionId}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correction History (Recently Approved)</CardTitle>
          <CardDescription>
            These corrections are currently active and influencing the AI Judge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {approvedHistory === undefined ? <Loader2 className="animate-spin" /> : 
              approvedHistory.length === 0 ? <p className="text-muted-foreground text-center py-4">No approved corrections yet.</p> :
              approvedHistory.map((correction) => (
                <div key={correction._id} className="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50/50 opacity-90">
                    <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="capitalize text-[10px]">{correction.topicName.replace(/_/g, " ")}</Badge>
                        <span className="text-[10px] text-slate-400 font-medium">Approved</span>
                    </div>
                    <div className="flex gap-4">
                         <div className="w-20">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Grade</p>
                            <Badge variant="outline" className={`text-[10px] ${correction.correctedGrade === 1 ? "text-green-600 border-green-100" : "text-red-600 border-red-100"}`}>
                                {correction.correctedGrade === 1 ? "Correct" : "Incorrect"}
                            </Badge>
                         </div>
                         <div className="flex-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Expert Feedback</p>
                            <p className="text-xs text-slate-600 line-clamp-2">{correction.correctedFeedback}</p>
                         </div>
                    </div>
                </div>
              ))
             }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
