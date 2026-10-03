"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function ExamsListPage() {
  const data = useQuery(api.exams.getStudentExams);

  if (data === undefined) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  const { available, submitted } = data;

  return (
    <div className="container mx-auto py-10 max-w-4xl px-4 space-y-10">
      
      {/* SECTION 1: AVAILABLE EXAMS */}
      <div>
          <h1 className="text-3xl font-bold mb-6">Available Exams</h1>
          {available.length === 0 ? (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No active exams available at the moment.
                </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
                {available.map(exam => (
                    <Card key={exam._id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle>{exam.title}</CardTitle>
                            <CardDescription>{exam.courseName}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1 text-sm text-slate-500">
                                 <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Closes: {new Date(exam.endDate).toLocaleString()}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{exam.questionCount} Questions</span>
                                 </div>
                            </div>
                            <Link href={`/exams/${exam._id}`}>
                                <Button>Start Exam</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
      </div>

      {/* SECTION 2: EXAM HISTORY */}
      <div>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Exam History</h2>
          {submitted.length === 0 ? (
            <p className="text-muted-foreground italic">No past exams found.</p>
          ) : (
             <div className="grid gap-4">
                {submitted.map((exam) => {
                    const resultsReady = exam.feedbackMode === "immediate" || exam.resultsReleased;
                    return (
                        <Card key={exam._id} className={`hover:shadow-md transition-shadow border-l-4 ${resultsReady ? "border-l-green-500" : "border-l-amber-500"}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{exam.title}</CardTitle>
                                        <CardDescription>{exam.courseName}</CardDescription>
                                    </div>
                                    {resultsReady && exam.score !== undefined && (
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-green-600">{exam.score}%</span>
                                            <span className="block text-xs text-muted-foreground">Score</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1 text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Submitted on: {new Date(exam.endDate).toLocaleDateString()}</span> 
                                        {/* Ideally we use submittedAt from submission but simpler to verify against end date for now */}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {resultsReady ? (
                                            <span className="text-green-600 font-medium">Results Available</span>
                                        ) : (
                                            <span className="text-amber-600 font-medium">Results Pending Release</span>
                                        )}
                                    </div>
                                </div>
                                <Link href={`/exams/${exam._id}`}>
                                    <Button variant={resultsReady ? "default" : "outline"}>
                                        {resultsReady ? "View Results" : "View Status"}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
             </div>
          )}
      </div>

    </div>
  );
}
