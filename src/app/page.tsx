// src/app/page.tsx
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Info } from "lucide-react";
import FeedbackForm from "@/components/FeedbackForm";

export default async function Home() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  // Fetches your Linear Algebra and Differential Calculus courses
  const courses = await convex.query(api.courses.getCourses);

  return (
    <div className='flex flex-col min-h-screen bg-slate-50/50'>
      <main className='flex-grow container mx-auto px-4 py-20'>
        {/* Hero Section */}
        <div className='text-center mb-20'>
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="px-4 py-1 rounded-full text-blue-700 bg-blue-50 border-blue-200">
              Adaptive Learning for Higher Ed
            </Badge>
          </div>
          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight lg:text-6xl mb-6 text-slate-900'>
            Master Complex Mathematics
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
            Join an adaptive platform designed for university students. Deepen your understanding of 
            <span className="text-slate-900 font-medium"> Linear Algebra</span> and 
            <span className="text-slate-900 font-medium"> Differential Calculus</span> through AI-powered feedback.
          </p>
          <div className="flex justify-center mt-8">
            <Link href="/help">
              <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 px-6 py-6 h-auto">
                <Info className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-bold text-sm">System Guide & Rules</div>
                  <div className="text-xs text-muted-foreground">Read before you start</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Course Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16'>
          {courses.map((course) => (
            <Card key={course._id} className='flex flex-col border-2 transition-all hover:border-blue-500/50 hover:shadow-xl overflow-hidden'>
              <div className='relative h-64 w-full bg-slate-200'>
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className='object-cover'
                />
              </div>
              
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">University Level</span>
                </div>
                <CardTitle className='text-2xl'>{course.title}</CardTitle>
              </CardHeader>

              <CardContent className='flex-grow'>
                <p className="text-muted-foreground line-clamp-2">
                  Interactive problem sets covering core university curriculum with step-by-step AI guidance.
                </p>
              </CardContent>

              <CardFooter className='border-t bg-slate-50/50 p-6 flex justify-between items-center'>
                <div className="flex items-center text-sm font-medium text-slate-600">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {course.topicCount} Topics
                </div>

                {/* Logged In Flow */}
                <SignedIn>
                  <Link href={`/courses/${course._id}/topics`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                      Go to Course
                    </Button>
                  </Link>
                </SignedIn>

                {/* Logged Out Flow */}
                <SignedOut>
                  <SignInButton mode='modal'>
                    <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      Enroll for Free
                    </Button>
                  </SignInButton>
                </SignedOut>
              </CardFooter>
            </Card>
          ))}
        </div>

      
          <section className="mb-20">
            <FeedbackForm />
          </section>

      </main>
    </div>
  );
}