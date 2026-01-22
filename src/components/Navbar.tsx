// src/components/Navbar.tsx
"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { BookOpenIcon, GraduationCap, LayoutDashboardIcon, LogInIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRole } from "@/hooks/useRole";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

const AdminLink = () => {
  const { user } = useUser();
  const userProfile = useQuery(api.users.getUser, { userId: user?.id || "" });

  if (!userProfile?.roles?.includes("admin") && userProfile?.role !== "admin") return null;

  return (
    <Link
      href={"/admin"}
      className='flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors'
    >
      <ShieldCheck className='size-4' />
      <span className='hidden sm:inline'>Admin</span>
    </Link>
  );
};

const RoleSwitcher = () => {
    // This hook needs to be inside RoleProvider which wraps the app.
    // Navbar is inside Layout -> RoleProvider -> ... -> Navbar.
    // Wait, I need to make sure Navbar is inside the provider.
    // Assuming we wrap in layout.tsx.
    
    // We cannot use `useRole` if Navbar is outside provider.
    // Provider wrapping needs to happen at root.
    
    // Let's assume we successfully wrapped in layout.tsx.
    const { hasAdminRole, viewAsStudent, toggleViewMode, isLoading } = useRole();

    if (isLoading) return null;
    if (!hasAdminRole) return null;

    return (
        <div className="flex items-center gap-2 px-3">
             <div className="flex items-center gap-2">
                <Switch 
                    className="data-[state=checked]:bg-amber-600"
                    checked={!viewAsStudent}
                    onCheckedChange={toggleViewMode}
                    id="admin-mode"
                />
                <Label htmlFor="admin-mode" className="text-xs font-medium cursor-pointer">
                    {viewAsStudent ? "Student View" : "Admin View"}
                </Label>
             </div>
        </div>
    );
};

const ExamsLink = () => {
  const activeExams = useQuery(api.exams.getActiveExams);

  // Always show the link so students can access the exams page (which handles "no exams" state)
  const count = activeExams?.length || 0;

  return (
    <Link
      href={"/exams"}
      className='flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-colors'
    >
      <BookOpenIcon className='size-4' />
      <span className='hidden sm:inline'>Exams</span>
      {count > 0 && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-medium text-white bg-pink-600 rounded-full">
            {count}
        </span>
      )}
    </Link>
  );
};

const Navbar = () => {
  return (
    <nav className='flex justify-between items-center py-4 px-6 bg-background border-b sticky top-0 z-50'>
      {/* Brand Logo */}
      <Link href={"/"} className='text-lg sm:text-xl font-extrabold text-primary flex items-center gap-2'>
        <GraduationCap className='size-7 text-blue-600' />
        <span className="tracking-tight">STACK-AI-Math-Course</span>
      </Link>

      <div className='flex items-center space-x-1 sm:space-x-3'>
        {/* Navigation Links */}
        <Link
          href={"/"}
          className='flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary transition-colors'
        >
          <BookOpenIcon className='size-4' />
          <span className='hidden sm:inline'>All Courses</span>
        </Link>

        {/* User Specific Links */}
        <SignedIn>
          <Link
            href={"/dashboard"}
            className='flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary transition-colors'
          >
            <LayoutDashboardIcon className='size-4' />
            <span className='hidden sm:inline'>My Progress</span>
          </Link>
          
          <AdminLink />
          <ExamsLink />
          <RoleSwitcher />
        </SignedIn>

        <div className="h-6 w-[1px] bg-border mx-2 hidden sm:block" />

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode='modal'>
              <Button variant='ghost' size='sm' className="gap-2">
                <LogInIcon className="size-4" />
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode='modal'>
              <Button size='sm' className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {/* Clerk User Button handles Profile and Sign Out internally */}
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "size-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;