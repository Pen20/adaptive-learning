"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export type CourseName = "Linear Algebra" | "Differential Calculus";

export function courseIdToCourseName(courseId: string): CourseName {
  return courseId === "linear_algebra"
    ? "Linear Algebra"
    : "Differential Calculus";
}

export function useProblemPermissions(courseId: string, topicId: string) {
  const permissions = useQuery(api.permissions.getPermissions, {
    courseName: courseIdToCourseName(courseId),
    topicName: topicId,
  });

  return {
    allowHints: permissions?.allowHints ?? true,
    allowSolution: permissions?.allowSolution ?? true,
    allowDetailed: permissions?.allowDetailedSolution ?? true,
    allowPractice: permissions?.allowPractice ?? true,
    allowRLHF: permissions?.allowRLHF ?? true,
    alwaysShowSolution: permissions?.alwaysShowSolution ?? false,
  };
}
