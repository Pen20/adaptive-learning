import { MathRenderer } from "@/components/MathRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProblemStatementCardProps {
  statement: string;
}

export function ProblemStatementCard({ statement }: ProblemStatementCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm transition-all">
      <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4 pt-4 px-6">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block" />
          Problem Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-6">
        <div className="text-lg text-slate-900 leading-relaxed font-medium bg-[#dae8e8] p-6 rounded-xl shadow-inner border border-[#c4d4d4] overflow-x-auto">
          <MathRenderer content={statement} />
        </div>
      </CardContent>
    </Card>
  );
}
