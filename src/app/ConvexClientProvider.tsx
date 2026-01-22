"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

import { UserSync } from "@/components/UserSync";
import { ProfileCheck } from "@/components/ProfileCheck";
import { RoleProvider } from "@/hooks/useRole";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RoleProvider>
          <UserSync />
          <ProfileCheck />
          {children}
        </RoleProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
