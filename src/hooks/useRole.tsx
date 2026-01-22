"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

// Global state for viewing mode - simple implementation without Context for now since it's just Navbar/Admin pages
// Actually, strict React would use Context or Zustand. Let's use a simple detailed hook or context?
// Since `Navbar` and `AdminPage` are far apart, we need a shared state.
// We can use a simple custom event or just `localStorage` + `window` event to sync (hacky but works for simple case).
// Better: Create `RoleContext`.

// Let's create a tiny Context here for simplicity.
// Actually, for this iteration, let's just use localStorage to persist the "VIEW_MODE" and read it.
// React state won't update across components automatically if we just use localStorage.
// So Navbar needs to control it, but Admin dashboard needs to read it.
// If I use localStorage, I need to trigger updates.

// Let's create a lightweight global store pattern or Context in a separate file if I could, but `useRole` implies a hook.
// I will implement a Context provider pattern.

import { createContext, useContext, ReactNode } from "react";

type RoleContextType = {
  isAdmin: boolean;        // Helper: true if user HAS admin role AND is not viewing as student
  isStudent: boolean;
  hasAdminRole: boolean;   // True if user physically has admin role
  viewAsStudent: boolean;
  toggleViewMode: () => void;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: clerkLoaded } = useUser();
  const userProfile = useQuery(api.users.getUser, { userId: user?.id || "" });
  
  const [viewAsStudent, setViewAsStudent] = useState(false);

  // Load view preference from local storage once mounted
  useEffect(() => {
    const stored = localStorage.getItem("view_as_student");
    if (stored === "true") setViewAsStudent(true);
  }, []);

  const toggleViewMode = () => {
    const newState = !viewAsStudent;
    setViewAsStudent(newState);
    localStorage.setItem("view_as_student", String(newState));
  };
  
  const isLoading = !clerkLoaded || userProfile === undefined;
  
  // Logic: 
  // hasAdminRole = DB says admin
  // isAdmin = hasAdminRole && !viewAsStudent
  
  const hasAdminRole = userProfile?.roles?.includes("admin") || userProfile?.role === "admin";
  
  const isAdmin = hasAdminRole && !viewAsStudent;
  const isStudent = true; // Everyone is a student basically, or !isAdmin

  return (
    <RoleContext.Provider value={{ isAdmin, isStudent, hasAdminRole, viewAsStudent, toggleViewMode, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
