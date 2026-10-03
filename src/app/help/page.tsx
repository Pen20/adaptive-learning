"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    AlertTriangle, 
    CheckCircle, 
    Info, 
    Keyboard, 
    RotateCcw, 
    ShieldAlert, 
    Timer,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden antialiased">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
            <div className="absolute -top-24 -right-24 h-96 w-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800/40">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                <div className="text-center space-y-4 mb-16">
                    <Badge variant="outline" className="px-4 py-1 border-indigo-500/30 bg-indigo-500/5 text-indigo-400 font-bold tracking-widest uppercase text-[10px]">
                        Support & Logic Protocols
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl">
                        System Guide <span className="text-indigo-500">&</span> Rules
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        A comprehensive framework for mastering higher-level mathematics through AI-augmented learning and strict pedagogical standards.
                    </p>
                </div>

                {/* Grading Policy - The Core Pillar */}
                <Card className="border-indigo-500/20 bg-[#1e293b]/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-60" />
                    <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 py-6">
                        <CardTitle className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                <ShieldAlert className="h-5 w-5 text-indigo-400" />
                            </div>
                            Core AI Grading Logic
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 pb-10 space-y-6">
                        <p className="text-slate-300 leading-relaxed text-lg font-medium">
                            Grading on this platform is driven by logical verification, not just numerical results. Our goal is 100% conceptual mastery.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/40 space-y-3">
                                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                </div>
                                <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Reasoning is Key</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">Incorrect or missing steps result in a Grade 0, even if the final result is numerically correct.</p>
                            </div>
                            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/40 space-y-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                </div>
                                <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Explicit Solution</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">You must explicitly state your final answer within the reasoning block for total validation.</p>
                            </div>
                            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/40 space-y-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <SearchIcon className="h-4 w-4 text-amber-400" />
                                </div>
                                <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Pattern Detection</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">AI analyzes step-consistency to detect and penalize ungrounded &quot;lucky guesses&quot;.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Exams & Workflow Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <Card className="lg:col-span-12 border-slate-800/60 bg-[#1e293b]/40 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-slate-800/40 py-6">
                            <CardTitle className="flex items-center gap-3 text-slate-200 font-bold uppercase tracking-widest text-xs">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Timer className="h-4 w-4 text-blue-400" />
                                </div>
                                Advanced Examination Protocols
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-slate-800/40">
                                <div className="p-8 space-y-3">
                                    <h4 className="font-black text-white text-sm">Strict Deadlines</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">Automated timers enforce rigid submission windows. Late work is not processed by the AI judge.</p>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h4 className="font-black text-white text-sm">Official Results</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">Grades are finalized by instructors. An email notification marks the release of official transcripts.</p>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h4 className="font-black text-white text-sm">Error Localization</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">Post-release, your dashboard will highlight precisely where your logic failed using red markers.</p>
                                </div>
                                <div className="p-8 space-y-3">
                                    <h4 className="font-black text-white text-sm">Direct Review</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">Email links use secure authentication to bypass manual logins and land you on your result page.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Left Column Tools */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card className="border-slate-800/60 bg-[#1e293b]/30 backdrop-blur-sm p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10">
                                        <Keyboard className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-200">Notation Center</h3>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">Click symbols in the &quot;Notation Guide&quot; to auto-inject LaTeX into your solution. No manual typing required.</p>
                            </Card>
                            <Card className="border-slate-800/60 bg-[#1e293b]/30 backdrop-blur-sm p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10">
                                        <Info className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-200">Optical Preview</h3>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">Always cross-verify your &quot;Live Preview&quot; to ensure your mathematical intent is rendered correctly before finalization.</p>
                            </Card>
                        </div>

                        <Card className="border-slate-800/60 bg-[#1e293b]/30 backdrop-blur-sm p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10">
                                    <RotateCcw className="h-5 w-5 text-amber-500" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-slate-200">Adaptive Mastery Loop</h3>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Our platform identifies specific weaknesses in your problem history. &quot;Adaptive Practice&quot; sessions are structurally curated to force engagement with your most frequent logical errors.
                            </p>
                        </Card>
                    </div>

                    {/* Right Column: Reporting & Help */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md p-8 border-dashed relative h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-white">Logic Quality Control</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    AI models occasionally misinterpret complex proofs. If you detect a valid error:
                                </p>
                                <div className="bg-black/20 p-4 rounded-xl border border-red-500/10">
                                    <p className="text-xs text-red-100/80 font-medium">
                                        Use the <strong>&quot;Submit for Review&quot;</strong> protocol found in the <strong>&quot;QUALITY REPORT&quot;</strong> widget. 
                                        This escalates your case to a human expert for final arbitration.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-12 rounded-3xl border border-white/5 shadow-2xl text-center space-y-6">
                    <h2 className="text-3xl font-black text-white tracking-tight">Synchronize with Curriculum</h2>
                    <p className="text-slate-400 max-w-md mx-auto font-medium">
                        Your learning journey is fully indexed and ready for you to continue. Choose your path.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-7 text-lg font-black uppercase tracking-tighter rounded-2xl shadow-lg transition-all hover:scale-105">
                                Go to Terminal <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
