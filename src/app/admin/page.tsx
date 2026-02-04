"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { topicRegistry } from "@/data/topics";

// Helper to get topics by course
// Helper to get topics by course
const getTopicsByCourse = (courseId: string) => {
  if (courseId === "linear_algebra") {
      return ["linear_equations", "quadratic_equations", "linear_systems", "determinants", "eigenvalues", "linear_independence", "gram_schmidt"];
  }
  if (courseId === "calculus") {
      return ["limits", "derivatives", "piecewise_continuity", "domain_range"];
  }
  return [];
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const permissions = useQuery(api.permissions.getAllPermissions);
  const updatePermission = useMutation(api.permissions.updatePermission);
  const userProfile = useQuery(api.users.getUser, { userId: user?.id || "" });

  if (!isLoaded || userProfile === undefined) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!userProfile?.roles?.includes("admin") && userProfile?.role !== "admin") {
     return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-red-600">
            <ShieldAlert className="h-16 w-16" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-slate-600">You do not have permission to view this page.</p>
        </div>
     );
  }

  const handleToggle = async (courseName: string, topicName: string, field: string, currentValue: boolean) => {
    // Optimistic UI could be handled by local state, but Convex is fast enough for admin panel
    await updatePermission({
        courseName,
        topicName,
        field,
        value: !currentValue
    });
  };

  const getPermissionValue = (courseName: string, topicName: string, field: "allowHints" | "allowSolution" | "allowDetailedSolution" | "allowPractice") => {
    const perm = permissions?.find(p => p.courseName === courseName && p.topicName === topicName);
    return perm ? perm[field] : true; // Default to true if not set
  };

  const renderTopicRow = (topicId: string, courseName: string, displayName: string) => (
    <div key={topicId} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
        <div className="font-medium capitalize w-48">{topicId.replace(/_/g, " ")}</div>
        <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
                <Label htmlFor={`${topicId}-hints`} className="text-xs text-muted-foreground">Hints</Label>
                <Switch 
                    id={`${topicId}-hints`} 
                    checked={getPermissionValue(courseName, topicId, "allowHints")}
                    onCheckedChange={() => handleToggle(courseName, topicId, "allowHints", getPermissionValue(courseName, topicId, "allowHints"))}
                />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Label htmlFor={`${topicId}-sol`} className="text-xs text-muted-foreground">Solution</Label>
                <Switch 
                    id={`${topicId}-sol`}
                    checked={getPermissionValue(courseName, topicId, "allowSolution")}
                    onCheckedChange={() => handleToggle(courseName, topicId, "allowSolution", getPermissionValue(courseName, topicId, "allowSolution"))}
                />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Label htmlFor={`${topicId}-detail`} className="text-xs text-muted-foreground">Detailed</Label>
                <Switch 
                    id={`${topicId}-detail`}
                    checked={getPermissionValue(courseName, topicId, "allowDetailedSolution")}
                    onCheckedChange={() => handleToggle(courseName, topicId, "allowDetailedSolution", getPermissionValue(courseName, topicId, "allowDetailedSolution"))}
                />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Label htmlFor={`${topicId}-practice`} className="text-xs text-muted-foreground">Practice</Label>
                <Switch 
                    id={`${topicId}-practice`}
                    checked={getPermissionValue(courseName, topicId, "allowPractice")}
                    onCheckedChange={() => handleToggle(courseName, topicId, "allowPractice", getPermissionValue(courseName, topicId, "allowPractice"))}
                />
            </div>
        </div>
    </div>
  );

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-2">Manage visibility settings for course materials.</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            Admin Mode Active
        </div>
      </div>

      <Tabs defaultValue="linear_algebra" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="linear_algebra">Linear Algebra</TabsTrigger>
          <TabsTrigger value="calculus">Calculus</TabsTrigger>
          <TabsTrigger value="exams">Exam Management</TabsTrigger>
        </TabsList>

        <TabsContent value="linear_algebra">
          <Card>
            <CardHeader>
              <CardTitle>Linear Algebra Topics</CardTitle>
              <CardDescription>Control feature access for Linear Algebra modules.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    {/* Updated to match canonical IDs from convex/courses.ts for correct permission mapping */}
                    {["linear_systems", "linear_equations", "determinants", "eigenvalues", "quadratic_equations", "linear_independence", "gram_schmidt"].map(topic => 
                        renderTopicRow(topic, "Linear Algebra", topic)
                    )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculus">
          <Card>
            <CardHeader>
              <CardTitle>Calculus Topics</CardTitle>
              <CardDescription>Control feature access for Calculus modules.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                     {["limits", "piecewise_continuity", "derivatives", "domain_range"].map(topic => 
                        renderTopicRow(topic, "Differential Calculus", topic)
                    )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
            <ExamManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExamManager() {
    const createExam = useMutation(api.exams.createExam);
    const exams = useQuery(api.exams.getAllExams);
    const toggleStatus = useMutation(api.exams.toggleExamStatus);
    const releaseResults = useMutation(api.exams.releaseExamResults);
    const deleteExam = useMutation(api.exams.deleteExam);

    const [title, setTitle] = useState("");
    const [course, setCourse] = useState<"Linear Algebra" | "Differential Calculus">("Linear Algebra");
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    
    // Derived from selectedTopics: questionCount = selectedTopics.length
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [feedbackMode, setFeedbackMode] = useState<"immediate" | "on_close">("immediate");

    const availableTopics = getTopicsByCourse(course === "Linear Algebra" ? "linear_algebra" : "calculus");

    const handleCreate = async () => {
        if (!title || !startDate || !endDate || selectedTopics.length === 0) {
            alert("Please fill all fields");
            return;
        }

        await createExam({
            title,
            courseName: course,
            topics: selectedTopics,
            questionCount: selectedTopics.length,
            // datetime-local returns YYYY-MM-DDTHH:mm, which Date parses correctly
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            isActive: true,
            feedbackMode
        });
        
        alert("Exam Created!");
        setTitle("");
        setSelectedTopics([]);
        setStartDate("");
        setEndDate("");
        setFeedbackMode("immediate");
    };

    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Exam</CardTitle>
                    <CardDescription>Configure a new exam session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Exam Title</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm 1" />
                        </div>
                        <div className="space-y-2">
                             <Label>Course</Label>
                             <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={course} 
                                onChange={e => {
                                    setCourse(e.target.value as any);
                                    setSelectedTopics([]);
                                }}
                             >
                                <option value="Linear Algebra">Linear Algebra</option>
                                <option value="Differential Calculus">Differential Calculus</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date & Time</Label>
                            <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date & Time</Label>
                            <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>

                        {/* Question Count is verified from topics length automatically */}
                        <div className="space-y-2">
                             <Label>Feedback Mode</Label>
                             <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={feedbackMode} 
                                onChange={e => setFeedbackMode(e.target.value as any)}
                             >
                                <option value="immediate">Immediate Feedback</option>
                                <option value="on_close">After Exam Closes</option>
                             </select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Select Topics</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-4 rounded-md h-40 overflow-y-auto">
                            {availableTopics.map(topic => (
                                <div key={topic} className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        id={topic} 
                                        checked={selectedTopics.includes(topic)}
                                        onChange={() => toggleTopic(topic)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={topic} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer">
                                        {topic.replace(/_/g, " ")}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleCreate} className="w-full">Create Exam</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Exams</CardTitle>
                </CardHeader>
                <CardContent>
                    {!exams ? <Loader2 className="animate-spin" /> : (
                        <div className="space-y-4">
                            {exams.length === 0 && <p className="text-muted-foreground">No exams found.</p>}
                            {exams.map(exam => (
                                <div key={exam._id} className="flex items-center justify-between border p-4 rounded-md">
                                    <div>
                                        <h3 className="font-bold">{exam.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {exam.courseName} | {new Date(exam.startDate).toLocaleString()} - {new Date(exam.endDate).toLocaleString()}
                                        </p>
                                        <p className="text-sm">Topics: {exam.topics.map(t => t.replace(/_/g, " ")).join(", ")}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Release Results Control */}
                                        <div className="flex flex-col items-end">
                                            {exam.resultsReleased ? (
                                                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Results Released</span>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => releaseResults({ examId: exam._id })}
                                                >
                                                    Release Results
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Label>Active</Label>
                                            <Switch 
                                                checked={exam.isActive} 
                                                onCheckedChange={(checked) => toggleStatus({ examId: exam._id, isActive: checked })} 
                                            />
                                        </div>
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
                                                    deleteExam({ examId: exam._id })
                                                        .catch(err => {
                                                            console.error("Delete failed:", err);
                                                            alert("Failed to delete exam: " + (err.message || "Unknown error"));
                                                        });
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
