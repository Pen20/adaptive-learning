"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    GraduationCap, 
    TrendingUp, 
    BookOpen, 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ChevronRight,
    Palette,
    History,
    Trophy,
    Info
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { MathRenderer } from "@/components/MathRenderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Theme = "midnight" | "slate" | "oceanic";

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const userData = useQuery(api.users.getUser, user ? { userId: user.id } : "skip");
  const masteryData = useQuery(api.users.getUserMastery, user ? { userId: user.id } : "skip");
  const examData = useQuery(api.exams.getStudentExams, user ? {} : "skip");
  const recentSubmissions = useQuery(api.submissions.getRecentSubmissions, user ? { userId: user.id, limit: 10 } : "skip");
  const courses = useQuery(api.courses.getCourses);
  const allTopics = useQuery(api.courses.getAllTopics);
  const userStats = useQuery(api.users.getUserStats, user ? { userId: user.id } : "skip");
  const updateTheme = useMutation(api.users.updateThemePreference);

  const [theme, setTheme] = useState<Theme>("midnight");

  useEffect(() => {
    if (userData?.themePreference) {
      setTheme(userData.themePreference as Theme);
    }
  }, [userData]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  if (masteryData === undefined || examData === undefined || recentSubmissions === undefined || courses === undefined || allTopics === undefined || userStats === undefined) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
        <p className="text-slate-400 font-medium">Synchronizing your learning data...</p>
      </div>
    );
  }

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    await updateTheme({ userId: user.id, theme: newTheme });
  };

  const themeStyles = {
    midnight: {
      bg: "bg-[#0f172a]",
      card: "bg-[#1e293b]/50 border-slate-800/60",
      text: "text-slate-100",
      accent: "text-indigo-400",
      accentBg: "bg-indigo-500/10",
      accentBorder: "border-indigo-500/20",
      progress: "bg-indigo-500",
      heroGradient: "from-indigo-600 to-purple-600",
      heroText: "text-white"
    },
    slate: {
      bg: "bg-[#111827]",
      card: "bg-[#1f2937]/50 border-gray-700/50",
      text: "text-gray-100",
      accent: "text-emerald-400",
      accentBg: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/20",
      progress: "bg-emerald-500",
      heroGradient: "from-emerald-600 to-teal-600",
      heroText: "text-white"
    },
    oceanic: {
      bg: "bg-[#020617]",
      card: "bg-[#0f172a]/50 border-cyan-900/40",
      text: "text-slate-100",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/20",
      progress: "bg-cyan-500",
      heroGradient: "from-cyan-600 to-blue-600",
      heroText: "text-white"
    }
  };

  const style = themeStyles[theme];

  // Calculate Stats
  const totalScore = masteryData.reduce((acc, curr) => acc + curr.masteryScore, 0);
  const globalProgress = userStats.totalTopics > 0 ? Math.round(totalScore / userStats.totalTopics) : 0;
  
  const getTopicScore = (topicId: string) => masteryData.find(m => m.topicName === topicId)?.masteryScore || 0;

  return (
    <div className={`min-h-screen ${style.bg} ${style.text} py-12 px-4 transition-colors duration-500 antialiased`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl ${style.accentBg} ${style.accentBorder} border flex items-center justify-center ${style.accent}`}>
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-1">Student Dashboard</h1>
              <p className="text-slate-400 font-medium">Welcome back, {user.firstName}. Tracking your journey to mastery.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
             <Link href="/help">
                <Button variant="ghost" className="h-10 gap-2 border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl">
                   <Info className="h-4 w-4 text-blue-400" />
                   System Guide
                </Button>
             </Link>
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <Palette className="h-4 w-4 text-slate-400" />
                <Select value={theme} onValueChange={(val: Theme) => handleThemeChange(val)}>
                  <SelectTrigger className="w-[140px] border-none bg-transparent shadow-none text-xs font-bold uppercase tracking-widest text-slate-300">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="midnight">Midnight Blue</SelectItem>
                    <SelectItem value="slate">Slate Emerald</SelectItem>
                    <SelectItem value="oceanic">Deep Oceanic</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
        </div>

        {/* Top Section: Overview & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Overall Hero Card */}
          <Card className={`lg:col-span-2 relative overflow-hidden text-white border-none shadow-2xl`}>
             <div className={`absolute inset-0 bg-gradient-to-br ${style.heroGradient}`} />
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
             <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <CardTitle className="flex items-center gap-2 text-white/90 font-black uppercase tracking-widest text-xs">
                        <TrendingUp className="h-4 w-4" /> Global Academic Progress
                    </CardTitle>
                    <Badge className="bg-white/20 text-white border-none font-black text-[10px] backdrop-blur-md">LEVEL {userStats.level}</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-7xl font-black tracking-tighter text-white">{globalProgress}%</span>
                    <span className="text-white/70 font-bold">Cumulative Score</span>
                </div>
             </CardHeader>
             <CardContent className="relative z-10 pt-4">
                <Progress value={globalProgress} className={`h-3 bg-black/20 border-white/10 [&>div]:bg-white`} />
                <div className="flex justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-white/80">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5" /> {userStats.modulesMastered} Modules Mastered
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> {userStats.streak} Day Streak
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
             <Card className={`${style.card} transition-transform hover:scale-[1.02] shadow-lg`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${style.accentBg} ${style.accent}`}>
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modules Started</span>
                    </div>
                    <div className="text-4xl font-black text-white">{masteryData.length}</div>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">out of {userStats.totalTopics} targeted modules</p>
                </CardContent>
             </Card>
             <Card className={`${style.card} transition-transform hover:scale-[1.02] shadow-lg`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</span>
                    </div>
                    <div className="text-4xl font-black text-emerald-400">{userStats.successRate}%</div>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">on individual practice sessions</p>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Adaptive Practice & Exams */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Examination Hub */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className={`h-5 w-5 ${style.accent}`} />
                <h2 className="text-xl font-black tracking-tight uppercase">Examination Center</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examData.available.map((exam: any) => (
                   <Card key={exam._id} className={`${style.card} group overflow-hidden`}>
                      <CardContent className="p-5">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{exam.title}</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{exam.courseName}</p>
                            </div>
                            <Badge className="bg-green-500/10 text-green-400 border-none text-[9px] font-black">OPEN</Badge>
                         </div>
                         <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                            <span className="text-[10px] text-slate-400 font-medium uppercase truncate">Ends {new Date(exam.endDate).toLocaleDateString()}</span>
                            <Link href={`/exams/${exam._id}`}>
                                <Button size="sm" className="h-8 bg-white text-black hover:bg-slate-200 text-[10px] font-black uppercase rounded-lg">Commence <ChevronRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                         </div>
                      </CardContent>
                   </Card>
                ))}
                {examData.available.length === 0 && (
                   <div className={`col-span-2 py-8 px-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 font-medium text-sm`}>
                      No active examination sessions found. Check back later.
                   </div>
                )}
              </div>
            </section>

            {/* Course Progress */}
            <section className="space-y-16">
              {courses.map(course => {
                const courseTopics = allTopics.filter(t => t.courseId === course.courseId);
                // Group by chapter
                const chapters = Array.from(new Set(courseTopics.map(t => t.chapter)));
                
                return (
                  <div key={course.courseId} className="space-y-10">
                    <div className="flex items-center gap-4">
                        <div className={`h-8 w-2 rounded-full bg-gradient-to-b ${style.heroGradient}`} />
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">{course.title}</h3>
                    </div>

                    {chapters.map(chapter => (
                        <div key={chapter} className="space-y-6 pl-6 border-l border-slate-800/50">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{chapter}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courseTopics.filter(t => t.chapter === chapter).map(topic => (
                                    <CourseModuleCard key={topic.topicId} id={topic.topicId} title={topic.title} score={getTopicScore(topic.topicId)} style={style} />
                                ))}
                            </div>
                        </div>
                    ))}
                  </div>
                );
              })}
            </section>
          </div>

          {/* Right Side: Recent Activity */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <History className={`h-5 w-5 ${style.accent}`} />
                    <h2 className="text-xl font-black tracking-tight uppercase">Problem History</h2>
                </div>
                <Card className={`${style.card} divide-y divide-slate-800/50`}>
                    {recentSubmissions.map((sub: any) => (
                        <div key={sub._id} className="p-4 hover:bg-white/5 transition-colors cursor-default">
                            <div className="flex justify-between items-start gap-3 mb-2">
                                <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 ${style.text}`}>{sub.topicName.replace(/_/g, " ")}</span>
                                {sub.grade === 1 ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                )}
                            </div>
                            <div className="text-[10px] text-slate-500 italic mb-1 flex gap-1 overflow-hidden">
                                <span className="font-bold flex-shrink-0">Q:</span>
                                <div className="line-clamp-2 flex-grow min-w-0"><MathRenderer content={sub.problemStatement} /></div>
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium mb-2 flex gap-1 overflow-hidden">
                                <span className="font-bold text-white flex-shrink-0">A:</span>
                                <div className="line-clamp-2 flex-grow min-w-0"><MathRenderer content={sub.finalAnswer} /></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-medium text-slate-600 uppercase">
                                <span>{new Date(sub._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{sub.usedHints ? "Used Hints" : "Clean Run"}</span>
                            </div>
                        </div>
                    ))}
                    {recentSubmissions.length === 0 && (
                        <div className="p-10 text-center text-slate-600 text-[11px] font-medium italic">
                            No recent activity found. Start a practice session!
                        </div>
                    )}
                </Card>
            </section>

            <section>
                <Card className="bg-indigo-600 text-white border-none overflow-hidden relative shadow-xl">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                    <CardContent className="p-6">
                        <h4 className="font-black text-lg mb-2 leading-tight uppercase tracking-tighter">Prepare for upcoming finals</h4>
                        <p className="text-indigo-100/70 text-xs mb-4">Our AI coach recommends focusing on "Inner Product Spaces" based on your recent errors.</p>
                        <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase h-9">Launch AI Tutor</Button>
                    </CardContent>
                </Card>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}

function CourseModuleCard({ id, title, score, style }: { id: string, title: string, score: number, style: any }) {
    return (
        <Card className={`${style.card} hover:border-${style.accent.split('-')[1]}-500/40 transition-all duration-300 group`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-slate-200 text-sm font-bold group-hover:text-white transition-colors">{title}</CardTitle>
                    <span className={`text-xs font-black ${score >= 80 ? "text-emerald-400" : score >= 50 ? style.accent : "text-slate-500"}`}>{score}%</span>
                </div>
            </CardHeader>
            <CardContent>
                <Progress value={score} className={`h-1.5 ${style.bg} border-slate-800/40 [&>div]:${style.progress}`} />
            </CardContent>
        </Card>
    );
}

function Button({ children, className, size = "default", variant = "default", ...props }: any) {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
    };
    return (
        <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`} {...props}>
            {children}
        </button>
    );
}
