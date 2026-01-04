"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, GraduationCap, TrendingUp, BookOpen } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const masteryData = useQuery(api.users.getUserMastery, user ? { userId: user.id } : "skip");

  if (!isLoaded || !isSignedIn) {
    return <div className="p-10 flex justify-center">Loading user...</div>;
  }

  if (masteryData === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="text-muted-foreground">Fetching your progress...</p>
      </div>
    );
  }

  // Calculate Overall Mastery
  const totalScore = masteryData.reduce((acc, curr) => acc + curr.masteryScore, 0);
  const avgMastery = masteryData.length > 0 ? Math.round(totalScore / masteryData.length) : 0;

  // Topics specific to Calculus
  const calculusTopics = ["limits", "derivatives", "piecewise_continuity", "domain_range"];
  
  // Topics specific to Linear Algebra
  // Note: "linear_equations" was added in backend but user might want to track it too.
  // The user prompt lists: quadratic_equations, linear_systems, linear_equations, determinants, eigenvalues
  const linearAlgebraTopics = ["linear_equations", "quadratic_equations", "linear_systems", "determinants", "eigenvalues"];

  const allTopics = [...calculusTopics, ...linearAlgebraTopics];
  
  // Helper to get score for a topic
  const getTopicScore = (topicId: string) => {
    const found = masteryData.find((m) => m.topicName === topicId);
    return found ? found.masteryScore : 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Overall Progress Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Overall Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">{avgMastery}%</div>
            <Progress value={avgMastery} className="mt-4 h-2 bg-blue-200" />
            <p className="text-xs text-blue-600 mt-2">Across all attempted topics</p>
          </CardContent>
        </Card>

        {/* Stats Card 2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Topics Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{masteryData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {allTopics.length} core modules</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mb-6">Differential Calculus Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {calculusTopics.map((topicId) => {
           const score = getTopicScore(topicId);
           return (
            <Card key={topicId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="capitalize">{topicId.replace(/_/g, " ")}</CardTitle>
                <CardDescription>Core Concept</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Mastery</span>
                    <span>{score}%</span>
                </div>
                <Progress value={score} className={score >= 80 ? "bg-green-100 placeholder:bg-green-100" : ""} />
              </CardContent>
            </Card>
           );
        })}
      </div>

      <h2 className="text-2xl font-semibold mb-6">Linear Algebra Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {linearAlgebraTopics.map((topicId) => {
           const score = getTopicScore(topicId);
           return (
            <Card key={topicId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="capitalize">{topicId.replace(/_/g, " ")}</CardTitle>
                <CardDescription>Linear Concept</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Mastery</span>
                    <span>{score}%</span>
                </div>
                <Progress value={score} className={score >= 80 ? "bg-purple-100 placeholder:bg-purple-100" : ""} />
              </CardContent>
            </Card>
           );
        })}
      </div>
    </div>
  );
}
