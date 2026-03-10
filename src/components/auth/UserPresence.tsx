"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function UserPresence() {
  const { user } = useUser();
  const updateStatus = useMutation(api.users.updateLastActive);

  useEffect(() => {
    if (!user) return;

    // Pulse every 3 minutes
    const interval = setInterval(() => {
      updateStatus({ userId: user.id });
    }, 3 * 60 * 1000);

    // Initial update
    updateStatus({ userId: user.id });

    return () => clearInterval(interval);
  }, [user, updateStatus]);

  return null;
}
