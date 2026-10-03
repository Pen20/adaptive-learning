"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Book } from "lucide-react";
import { useParams } from "next/navigation";

export default function TopicsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const topics = useQuery(api.courses.getCourseTopics, { courseId });

  if (topics === undefined) {
    return <div className="p-10 text-center">Loading topics...</div>;
  }

  // Group topics by chapter
  const groupedTopics: Record<string, typeof topics> = {};
  const chapterOrder: string[] = [];

  topics.forEach((topic) => {
    const chapter = topic.chapter || "Other";
    if (!groupedTopics[chapter]) {
      groupedTopics[chapter] = [];
      chapterOrder.push(chapter);
    }
    groupedTopics[chapter].push(topic);
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:underline mb-2 block">
          &larr; Back to Courses
        </Link>
        <h1 className="text-3xl font-bold capitalize">
          {courseId.replace("_", " ")} Topics
        </h1>
        <p className="text-muted-foreground mt-2">
          Select a topic to start practicing.
        </p>
      </div>

      <div className="space-y-12">
        {chapterOrder.map((chapter) => (
          <div key={chapter} className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight text-indigo-900 border-l-4 border-indigo-600 pl-4 py-1.5 bg-indigo-50/50 rounded-r-lg">
              {chapter}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedTopics[chapter].map((topic) => (
                <Card key={topic.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="h-4 w-4 text-blue-500" />
                      {topic.title}
                    </CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/courses/${courseId}/topics/${topic.id}`}>
                      <Button className="w-full gap-2">
                        Start Practice <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
