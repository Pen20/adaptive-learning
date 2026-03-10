"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";

export function CorrectionModerator({ style }: { style?: any }) {
  const pendingCorrections = useQuery(api.corrections.getPendingCorrections);
  const approvedHistory = useQuery(api.corrections.getRecentApprovedCorrections, { limit: 10 });
  const approve = useMutation(api.corrections.approveCorrection);
  const reject = useMutation(api.corrections.rejectCorrection);

  // Fallback if style is not provided (e.g. legacy usage)
  const themeStyle = style || {
    card: "bg-[#1e293b] border-slate-800",
    bg: "bg-[#0f172a]",
    accent: "text-indigo-400",
    accentBorder: "border-indigo-500/20",
    accentBg: "bg-indigo-500/10",
    highlight: "indigo"
  };

  if (pendingCorrections === undefined) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
  }

  if (pendingCorrections.length === 0) {
    return (
      <Card className={`${themeStyle.card.replace('/50', '/30')} shadow-xl border-dashed`}>
        <CardContent className="py-20 text-center text-slate-500 font-medium italic">
          No pending corrections to review at this moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={`${themeStyle.card} shadow-2xl overflow-hidden`}>
        <CardHeader className={`border-b border-slate-800/60 bg-[#0f172a]/50`}>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Moderation Queue ({pendingCorrections.length})</CardTitle>
              <CardDescription className="text-slate-400">
                Review student-submitted corrections. Approved entries guide future AI judgments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {pendingCorrections.map((correction) => (
              <div key={correction._id} className={`border border-slate-800 rounded-xl p-6 bg-[#0f172a]/30 group hover:border-${themeStyle.highlight}-500/30 transition-all duration-300`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <Badge variant="outline" className={`capitalize border-slate-700 text-slate-400 bg-slate-800/50 py-1 px-3 text-[10px] font-bold tracking-wider`}>
                        {correction.topicName.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Submitted {new Date(correction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 font-bold text-[11px] uppercase tracking-wider"
                      onClick={() => approve({ correctionId: correction._id })}
                    >
                      <Check className="h-3 w-3 mr-1.5" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 font-bold text-[11px] uppercase tracking-wider"
                      onClick={() => reject({ correctionId: correction._id })}
                    >
                      <X className="h-3 w-3 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Corrected Grade</p>
                    <Badge className={`${correction.correctedGrade === 1 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} py-1.5 px-4 font-bold rounded-lg border`}>
                      {correction.correctedGrade === 1 ? "SET AS CORRECT" : "SET AS INCORRECT"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expert Feedback</p>
                    <div className="text-sm p-4 bg-[#0f172a] rounded-xl border border-slate-800/60 text-slate-300 italic font-medium leading-relaxed">
                      "{correction.correctedFeedback}"
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
                  <span>Submission ID: {correction.submissionId}</span>
                  <ExternalLink className="h-3 w-3 opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={`${themeStyle.card.replace('/50', '/20')} shadow-xl`}>
        <CardHeader className="pb-4">
          <CardTitle className={`text-lg ${themeStyle.text.replace('text-slate-100', 'text-slate-200').replace('text-gray-100', 'text-gray-200')}`}>Recent Verification History</CardTitle>
          <CardDescription className="text-slate-500">
            Active expert corrections influencing AI reasoning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {approvedHistory === undefined ? <Loader2 className="animate-spin text-slate-600" /> : 
              approvedHistory.length === 0 ? <p className="text-slate-600 text-center py-6 text-sm italic">Queue clear.</p> :
              approvedHistory.map((correction) => (
                <div key={correction._id} className="border border-slate-800/40 rounded-xl p-4 space-y-3 bg-[#0f172a]/20 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center">
                        <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[9px] uppercase font-black">{correction.topicName.replace(/_/g, " ")}</Badge>
                        <span className="text-[9px] text-green-500/60 font-black uppercase tracking-widest">Verified</span>
                    </div>
                    <div className="flex gap-6">
                         <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                            <div className={`text-[10px] font-bold ${correction.correctedGrade === 1 ? "text-green-500/80" : "text-red-500/80"}`}>
                                {correction.correctedGrade === 1 ? "CORRECT" : "INCORRECT"}
                            </div>
                         </div>
                         <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Feedback</p>
                            <p className="text-xs text-slate-400 font-medium line-clamp-1 italic">"{correction.correctedFeedback}"</p>
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
