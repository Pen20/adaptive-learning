
"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Fire and forget - ensures user exists in DB
      syncUser().catch((err) => console.error("User sync failed:", err));
    }
  }, [isLoaded, user, syncUser]);

  return null;
}
