"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Trash2, Lightbulb, Check, FileText, Play, MessageSquare, LayoutDashboard, Settings, Info, Palette } from "lucide-react";
import { topicRegistry } from "@/data/topics";
import { CorrectionModerator } from "@/components/admin/CorrectionModerator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper to get topics by course (Deprecated - now uses dynamic queries)

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const permissions = useQuery(api.permissions.getAllPermissions);
  const updatePermission = useMutation(api.permissions.updatePermission);
  const userProfile = useQuery(api.users.getUser, { userId: user?.id || "" });
  const updateTheme = useMutation(api.users.updateThemePreference);

  const [theme, setTheme] = useState<Theme>("midnight");

  useEffect(() => {
    if (userProfile?.themePreference) {
      setTheme(userProfile.themePreference as Theme);
    }
  }, [userProfile]);

  const linearTopics = useQuery(api.courses.getCourseTopics, { courseId: "linear_algebra" });
  const calculusTopics = useQuery(api.courses.getCourseTopics, { courseId: "differential_calculus" });

  if (!isLoaded || userProfile === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  if (!userProfile?.roles?.includes("admin") && userProfile?.role !== "admin") {
     return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-red-600 bg-[#0f172a]">
            <ShieldAlert className="h-16 w-16" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-slate-400">You do not have permission to view this page.</p>
        </div>
     );
  }

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user?.id) {
      await updateTheme({ userId: user.id, theme: newTheme });
    }
  };

  const themeStyles = {
    midnight: {
      bg: "bg-[#0f172a]",
      card: "bg-[#1e293b]/50 border-slate-800/60",
      cardActive: "bg-[#1e293b]",
      text: "text-slate-100",
      accent: "text-indigo-400",
      accentBg: "bg-indigo-500/10",
      accentBorder: "border-indigo-500/20",
      button: "bg-indigo-600 hover:bg-indigo-500",
      highlight: "indigo"
    },
    slate: {
      bg: "bg-[#111827]",
      card: "bg-[#1f2937]/50 border-gray-700/50",
      cardActive: "bg-[#1f2937]",
      text: "text-gray-100",
      accent: "text-emerald-400",
      accentBg: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/20",
      button: "bg-emerald-600 hover:bg-emerald-500",
      highlight: "emerald"
    },
    oceanic: {
      bg: "bg-[#020617]",
      card: "bg-[#0f172a]/50 border-cyan-900/40",
      cardActive: "bg-[#0f172a]",
      text: "text-slate-100",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/20",
      button: "bg-cyan-600 hover:bg-cyan-500",
      highlight: "cyan"
    }
  };

  const style = themeStyles[theme];

  const handleToggle = async (courseName: string, topicName: string, field: string, currentValue: boolean) => {
    await updatePermission({
        courseName,
        topicName,
        field,
        value: !currentValue
    });
  };

  const FeatureToggle = ({ label, icon, checked, onChange }: { label: string, icon: React.ReactNode, checked: boolean, onChange: () => void }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`p-2 rounded-md border transition-all ${checked ? `${style.accentBg} ${style.accentBorder} ${style.accent}` : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
            {icon}
        </div>
        <Label className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{label}</Label>
        <Switch 
            checked={checked}
            onCheckedChange={onChange}
            className={`scale-75 data-[state=checked]:bg-${style.highlight}-500`}
        />
    </div>
  );

  const renderTopicRow = (topicId: string, courseName: string, title: string) => (
    <div key={topicId} className={`group relative flex items-center justify-between p-5 mb-4 ${style.card} border rounded-xl hover:${style.cardActive} hover:border-${style.highlight}-500/50 transition-all duration-300 shadow-sm hover:shadow-${style.highlight}-500/10`}>
        <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg ${style.accentBg} ${style.accentBorder} border flex items-center justify-center ${style.accent} group-hover:scale-110 transition-transform`}>
                 <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
                <div className={`font-bold ${style.text} group-hover:text-white transition-colors capitalize`}>{title.replace(/_/g, " ")}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Module ID: {topicId}</div>
            </div>
        </div>
        
        <div className="flex gap-4 lg:gap-8 items-center">
            <FeatureToggle 
                label="Hints" 
                icon={<Lightbulb className="h-3 w-3" />}
                checked={getPermissionValue(courseName, topicId, "allowHints")}
                onChange={() => handleToggle(courseName, topicId, "allowHints", getPermissionValue(courseName, topicId, "allowHints"))}
            />
            <FeatureToggle 
                label="Solution" 
                icon={<Check className="h-3 w-3" />}
                checked={getPermissionValue(courseName, topicId, "allowSolution")}
                onChange={() => handleToggle(courseName, topicId, "allowSolution", getPermissionValue(courseName, topicId, "allowSolution"))}
            />
            <FeatureToggle 
                label="Detailed" 
                icon={<FileText className="h-3 w-3" />}
                checked={getPermissionValue(courseName, topicId, "allowDetailedSolution")}
                onChange={() => handleToggle(courseName, topicId, "allowDetailedSolution", getPermissionValue(courseName, topicId, "allowDetailedSolution"))}
            />
            <FeatureToggle 
                label="Practice" 
                icon={<Play className="h-3 w-3" />}
                checked={getPermissionValue(courseName, topicId, "allowPractice")}
                onChange={() => handleToggle(courseName, topicId, "allowPractice", getPermissionValue(courseName, topicId, "allowPractice"))}
            />
             <FeatureToggle 
                label="RLHF" 
                icon={<MessageSquare className="h-3 w-3" />}
                checked={getPermissionValue(courseName, topicId, "allowRLHF")}
                onChange={() => handleToggle(courseName, topicId, "allowRLHF", getPermissionValue(courseName, topicId, "allowRLHF"))}
            />
        </div>
    </div>
  );

  const getPermissionValue = (courseName: string, topicName: string, field: "allowHints" | "allowSolution" | "allowDetailedSolution" | "allowPractice" | "allowRLHF") => {
    if (!permissions) return true; // Default to true if not loaded
    const perm = permissions.find(p => p.courseName === courseName && p.topicName === topicName);
    return perm ? (perm as any)[field] : true; // Default to true if not set
  };


  return (
    <div className={`min-h-screen ${style.bg} ${style.text} py-12 px-4 transition-colors duration-500 antialiased`}>
      <div className="max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 underline decoration-indigo-500/30 decoration-8 underline-offset-4">Instructor Terminal</h1>
            <p className="text-slate-400 mt-2 max-w-lg font-medium leading-relaxed">System-wide orchestration of pedagogical assets and student tracking.</p>
        </div>
        
        <div className="flex items-center gap-4 self-end md:self-auto">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <Palette className="h-4 w-4 text-slate-400" />
                <Select value={theme} onValueChange={(val: Theme) => handleThemeChange(val)}>
                  <SelectTrigger className="w-[140px] border-none bg-transparent shadow-none text-xs font-bold uppercase tracking-widest text-slate-300 focus:ring-0">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="midnight">Midnight Blue</SelectItem>
                    <SelectItem value="slate">Slate Emerald</SelectItem>
                    <SelectItem value="oceanic">Deep Oceanic</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className={`flex items-center gap-3 ${style.accentBg} ${style.accentBorder} border px-5 py-2.5 rounded-2xl`}>
                <div className={`h-2 w-2 rounded-full bg-${style.highlight}-500 animate-pulse`} />
                <span className={`text-sm font-black ${style.accent} flex items-center gap-2 uppercase tracking-tighter`}>
                    <ShieldAlert className="h-4 w-4" />
                    Admin Access
                </span>
             </div>
        </div>
      </div>

      <Tabs defaultValue="linear_algebra" className="space-y-8">
        <div className="flex justify-start border-b border-slate-800/60 pb-px">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
                <AdminTabTrigger value="monitoring" label="Monitoring" icon={<Activity className="h-4 w-4" />} />
                <AdminTabTrigger value="linear_algebra" label="Linear Algebra" icon={<LayoutDashboard className="h-4 w-4" />} />
                <AdminTabTrigger value="differential_calculus" label="Calculus" icon={<LayoutDashboard className="h-4 w-4" />} />
                <AdminTabTrigger value="exams" label="Exams" icon={<Settings className="h-4 w-4" />} />
                <AdminTabTrigger value="moderation" label="Moderation" icon={<ShieldAlert className="h-4 w-4" />} />
            </TabsList>
        </div>
        <AdminTabContent value="monitoring" title="Student Tracking" description="Monitor student online status, progress, and performance in real-time.">
            <StudentMonitor style={style} />
        </AdminTabContent>


        <AdminTabContent value="linear_algebra" title="Linear Algebra Management" description="Control feature access and visibility for linear algebra modules.">
            {linearTopics === undefined || permissions === undefined ? <div className="p-12 text-center text-slate-500"><Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" /> Loading Topics...</div> : 
             linearTopics.length === 0 ? <div className="p-12 text-center text-slate-500 font-medium">No topics discovered in database.</div> :
             linearTopics.map(topic => 
                renderTopicRow(topic.topicId, "Linear Algebra", topic.title)
            )}
        </AdminTabContent>

        <AdminTabContent value="differential_calculus" title="Calculus Management" description="Manage visibility settings and pedagogical tools for calculus topics.">
             {calculusTopics === undefined || permissions === undefined ? <div className="p-12 text-center text-slate-500"><Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" /> Loading Topics...</div> : 
              calculusTopics.length === 0 ? <div className="p-12 text-center text-slate-500 font-medium">No calculus topics found.</div> :
              calculusTopics.map(topic => 
                renderTopicRow(topic.topicId, "Differential Calculus", topic.title)
            )}
        </AdminTabContent>

        <AdminTabContent value="exams" title="Examination Control" description="Design, schedule, and manage automated exam sessions.">
            <ExamManager style={style} />
        </AdminTabContent>

        <AdminTabContent value="moderation" title="Correction Moderation" description="Audit AI grading decisions and verify student-submitted corrections.">
            <CorrectionModerator style={style} />
        </AdminTabContent>
      </Tabs>
      </div>
    </div>
  );
}

type Theme = "midnight" | "slate" | "oceanic";

function ExamManager({ style }: { style: any }) {
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

    const availableTopics = useQuery(api.courses.getCourseTopics, { 
        courseId: course === "Linear Algebra" ? "linear_algebra" : "differential_calculus" 
    });

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
        <div className="space-y-10">
            <Card className={`${style.card} border-slate-800 shadow-2xl`}>
                <CardHeader className="border-b border-slate-800 bg-[#0f172a]/30">
                    <CardTitle className="text-white">Create New Exam Session</CardTitle>
                    <CardDescription className="text-slate-400">Configure parameters for a secure automated examination.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exam Title</Label>
                            <Input 
                                className="bg-[#0f172a]/50 border-slate-800 text-white focus:ring-indigo-500/50" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="e.g. Midterm Assessment" 
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Module Category</Label>
                             <Select 
                                value={course} 
                                onValueChange={val => {
                                    setCourse(val as any);
                                    setSelectedTopics([]);
                                }}
                             >
                                <SelectTrigger className="bg-[#0f172a]/50 border-slate-800 text-slate-300 w-full">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-slate-800 text-slate-100">
                                    <SelectItem value="Linear Algebra">Linear Algebra</SelectItem>
                                    <SelectItem value="Differential Calculus">Calculus</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Feedback Protocol</Label>
                             <Select 
                                value={feedbackMode} 
                                onValueChange={val => setFeedbackMode(val as any)}
                             >
                                <SelectTrigger className="bg-[#0f172a]/50 border-slate-800 text-slate-300 w-full">
                                    <SelectValue placeholder="Select Mode" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-slate-800 text-slate-100">
                                    <SelectItem value="immediate">Real-time Feedback</SelectItem>
                                    <SelectItem value="on_close">Post-Exam Audit Only</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scheduled Commencement</Label>
                            <Input 
                                className="bg-[#0f172a]/50 border-slate-800 text-white" 
                                type="datetime-local" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expected Conclusion</Label>
                            <Input 
                                className="bg-[#0f172a]/50 border-slate-800 text-white" 
                                type="datetime-local" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-3 flex flex-col justify-end">
                            <Button className={`w-full ${style.button} text-white font-black uppercase tracking-widest py-6 shadow-${style.highlight}-500/20 shadow-lg`} onClick={handleCreate}>
                                <Play className="h-4 w-4 mr-2" /> 
                                Initialize Exam
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-800">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Exam Content ({selectedTopics.length} Topics Targeted)</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0f172a]/30 p-5 rounded-2xl border border-slate-800/60 max-h-48 overflow-y-auto custom-scrollbar">
                            {availableTopics === undefined ? <div className="text-sm text-slate-600 animate-pulse">Scanning server...</div> :
                             availableTopics.length === 0 ? <div className="text-sm text-slate-600">No available content found.</div> :
                             availableTopics.map(topic => (
                                <div 
                                    key={topic.topicId} 
                                    onClick={() => toggleTopic(topic.topicId)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                                        selectedTopics.includes(topic.topicId) 
                                        ? `${style.accentBg} border-${style.highlight}-500/40 text-white` 
                                        : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                                >
                                    <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                                        selectedTopics.includes(topic.topicId) ? `bg-${style.highlight}-500 border-${style.highlight}-500` : 'border-slate-700'
                                    }`}>
                                        {selectedTopics.includes(topic.topicId) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="text-xs font-bold truncate">{topic.title.replace(/_/g, " ")}</span>
                                </div>
                             ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams === undefined ? <div className="col-span-full py-12 text-center text-slate-600">Querying central database...</div> :
                 (!exams || exams.length === 0) ? <div className="col-span-full py-12 text-center text-slate-600 font-bold uppercase tracking-widest">No active sessions located.</div> :
                 exams.map(exam => (
                    <div key={exam._id} className={`${style.card} border rounded-2xl overflow-hidden shadow-xl group hover:border-${style.highlight}-500/40 transition-all`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black text-white text-lg tracking-tight mb-1">{exam.title}</h3>
                                    <Badge className="bg-slate-800 text-slate-500 border-slate-700 text-[9px] uppercase font-black">{exam.courseName}</Badge>
                                </div>
                                <Switch 
                                    checked={exam.isActive} 
                                    onCheckedChange={(checked) => toggleStatus({ examId: exam._id, isActive: checked })}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                    <Activity className={`h-3.5 w-3.5 ${style.accent}`} />
                                    <span>{exam.topics.length} Targeted Modules</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                    <Info className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Closes {new Date(exam.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-800/50">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 border-slate-800 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest"
                                    onClick={() => releaseResults({ examId: exam._id })}
                                >
                                    Force Release
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                                    onClick={() => {
                                        if (confirm("Permanently eliminate session data?")) {
                                            deleteExam({ examId: exam._id });
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                         {exam.isActive && <div className={`h-1 bg-gradient-to-r from-${style.highlight}-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]`} />}
                    </div>
                 ))}
            </div>
        </div>
    );
}

function StudentMonitor({ style }: { style: any }) {
    const studentData = useQuery(api.users.getStudentAnalytics);

    if (studentData === undefined) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
    }

    return (
        <Card className={`${style.card} text-slate-100 shadow-2xl overflow-hidden`}>
            <CardHeader className="border-b border-slate-800 bg-[#0f172a]/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl text-white">Student Activity Monitor</CardTitle>
                        <CardDescription className="text-slate-400">Real-time status and progress tracking for all students.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-500 uppercase">Live Pulse</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Adaptive Practice</th>
                                <th className="px-6 py-4">Recent Activity</th>
                                <th className="px-6 py-4 text-center">Score</th>
                                <th className="px-6 py-4">Exams</th>
                                <th className="px-6 py-4 text-right">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {studentData.map((student) => (
                                <tr key={student.userId} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-200">{student.name}</div>
                                                <div className="text-xs text-slate-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.isOnline ? (
                                            <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20 gap-1.5 py-0.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Online
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500 border-slate-700 bg-transparent">
                                                Offline
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs text-slate-200 font-bold">{student.topicsAttempted} <span className="text-slate-500 font-medium">Topics Started</span></div>
                                            <div className={`text-[11px] font-black ${style.accent} uppercase tracking-tighter`}>
                                               Avg Mastery: {student.averageMastery || 0}%
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-400 border border-slate-600 uppercase font-mono">
                                                {student.recentTopic === "N/A" ? "Idle" : "Studying"}
                                            </span>
                                            <span className="truncate max-w-[150px]">{student.recentTopic.replace("_", " ")}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <div className={`text-sm font-bold ${student.successRate > 70 ? 'text-green-400' : student.successRate > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {student.successRate}%
                                         </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-24">
                                            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                                                <span>Taken</span>
                                                <span>{student.examsTaken}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-${style.highlight}-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1000`} 
                                                    style={{ width: `${Math.min(student.examsTaken * 20, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs text-slate-500 font-medium">
                                            {student.lastActive ? new Date(student.lastActive).toLocaleTimeString() : "Never"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {studentData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                                        No students found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function AdminTabTrigger({ value, label, icon }: { value: string, label: string, icon: React.ReactNode }) {
    return (
        <TabsTrigger 
            value={value} 
            className="group relative flex items-center gap-2.5 px-1 py-4 bg-transparent border-none data-[state=active]:bg-transparent shadow-none hover:text-white transition-all overflow-hidden"
        >
            <div className={`p-1.5 rounded-lg transition-colors group-data-[state=active]:bg-indigo-500/10 group-data-[state=active]:text-indigo-400 text-slate-500`}>
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight group-data-[state=active]:text-white text-slate-500">{label}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform origin-left rounded-t-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </TabsTrigger>
    );
}

function AdminTabContent({ value, title, description, children }: { value: string, title: string, description: string, children: React.ReactNode }) {
    return (
        <TabsContent value={value} className="mt-0 focus-visible:outline-none">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">{description}</p>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </TabsContent>
    );
}
