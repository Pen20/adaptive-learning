
"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function ProfileCheck() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const convexUser = useQuery(api.users.getUser, 
    user ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user || !convexUser) return;
    
    // Allow access to onboarding page itself
    if (pathname === "/onboarding") return;

    // Check for missing required fields
    if (!convexUser.institutionName || !convexUser.birthDay || !convexUser.firstName || !convexUser.surname) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, convexUser, pathname, router]);

  return null;
}
