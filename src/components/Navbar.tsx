// src/components/Navbar.tsx
"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { BookOpenIcon, GraduationCap, LayoutDashboardIcon, LogInIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

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