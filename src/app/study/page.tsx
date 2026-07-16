"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

function formatTopicTitle(slug: string) {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  if (status === "submitted" || status === "completed") {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
  }
  if (status === "in_progress") {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In progress</Badge>;
  }
  if (status === "locked") {
    return (
      <Badge variant="outline" className="text-slate-400">
        <Lock className="w-3 h-3 mr-1" /> Locked
      </Badge>
    );
  }
  return <Badge variant="outline">Not started</Badge>;
}

function StepRow({
  label,
  status,
  href,
}: {
  label: string;
  status: string;
  href: string;
}) {
  const done = status === "submitted" || status === "completed";
  const locked = status === "locked";
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-800">{label}</span>
        <StatusBadge status={status} />
      </div>
      {!done && !locked && (
        <Button asChild size="sm">
          <Link href={href}>{status === "in_progress" ? "Resume" : "Start"}</Link>
        </Button>
      )}
    </div>
  );
}

export default function StudyDashboardPage() {
  const dashboard = useQuery(api.studyQuiz.getMyStudyDashboard, {});

  if (dashboard === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading your study dashboard…
      </div>
    );
  }

  if (!dashboard.enrolled) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Research Study</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600 space-y-2">
            <p>You are not currently enrolled in an active study session.</p>
            <p>
              If you signed a consent form and expected to participate, please contact the research
              team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Research Study — Your Sessions</h1>
        <p className="text-slate-600 mt-2">
          For each topic, follow the three steps in order: <strong>pre-quiz</strong> →{" "}
          <strong>practice session</strong> → <strong>post-quiz</strong>. Quizzes are timed and can
          be submitted only once. No results are shown during the study.
        </p>
      </div>

      {dashboard.topics.map((topic, index) => {
        const postStatus =
          topic.practice !== "completed" && topic.quizzes.post === "not_started"
            ? "locked"
            : topic.quizzes.post;
        return (
          <Card key={topic.topicName}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                {formatTopicTitle(topic.topicName)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StepRow
                label="1. Pre-quiz"
                status={topic.quizzes.pre}
                href={`/study/quiz/${topic.topicName}?type=pre`}
              />
              <StepRow
                label="2. Practice session"
                status={topic.practice}
                href={`/study/practice/${topic.topicName}`}
              />
              <StepRow
                label="3. Post-quiz"
                status={postStatus}
                href={`/study/quiz/${topic.topicName}?type=post`}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
